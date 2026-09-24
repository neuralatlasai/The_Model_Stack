/**
 * Scroll as a research control signal (UI_UX §11).
 *
 * Observes the region sections (`<section data-region data-region-role>`). The
 * active region is the last one whose top has crossed READING_THRESHOLD × the
 * viewport height. On change it dispatches EVENTS.activeRegion (tree, rail,
 * minimap, and reading state listen), and follows it with the URL hash via
 * history.replaceState (debounced; history.state is preserved so Astro's
 * ClientRouter keeps its scroll bookkeeping; no history entries are added and
 * the page never jumps). Document progress is painted onto the current tree
 * node and the minimap as `--progress` and emitted as CLIENT_EVENTS.progress.
 *
 * Native scroll physics are untouched: listeners are passive and only read
 * layout, once per animation frame. An IntersectionObserver on a band above
 * the reading line catches threshold crossings precisely; the rAF-throttled
 * scroll listener keeps progress current and covers engines without IO.
 */
import type { ActiveRegionDetail } from '@atlas/core';
import { ATTR, EVENTS, READING_THRESHOLD } from './contract.ts';
import {
  hrefWithHash,
  isAtBottom,
  pickActiveRegion,
  PROGRESS_EPSILON,
  readingProgress,
  shouldReplaceHash,
  toRegionRole,
} from './active-region.ts';
import { $, $$, isRendered } from './dom.ts';
import { CLIENT_EVENTS, emit } from './events.ts';
import { debounce, frameScheduler } from './lifecycle.ts';
import type { PageContext } from './page.ts';

const HASH_DEBOUNCE_MS = 180;

export function initScrollSync(ctx: PageContext): void {
  const { doc, ctl, article, nodeId } = ctx;
  if (article === null || nodeId === null) return;
  const scope: ParentNode = article.querySelector(`[${ATTR.region}]`) !== null ? article : doc;

  let regions: HTMLElement[] = [];
  const collect = (): void => {
    regions = $$(`[${ATTR.region}]`, scope).filter(isRendered);
  };
  collect();

  let active: string | null = null;
  let crossedOnce = false;
  let lastProgress = -1;
  let pendingHash: string | null | undefined;

  const hashWriter = debounce(
    ctl,
    () => {
      if (pendingHash === undefined) return;
      writeHash(pendingHash);
      pendingHash = undefined;
    },
    HASH_DEBOUNCE_MS,
  );

  const update = (): void => {
    // Reads first …
    const viewportHeight = window.innerHeight;
    const line = viewportHeight * READING_THRESHOLD;
    const tops = regions.map((region) => region.getBoundingClientRect().top);
    const atBottom = isAtBottom(window.scrollY, viewportHeight, doc.documentElement.scrollHeight);
    const articleRect = article.getBoundingClientRect();
    const pick = pickActiveRegion(tops, line, atBottom, viewportHeight);
    const progress = readingProgress({ line, articleTop: articleRect.top, articleHeight: articleRect.height, atBottom });

    // … then writes.
    const region = pick.index >= 0 ? regions[pick.index] : undefined;
    if (region !== undefined) {
      const anchor = region.getAttribute(ATTR.region) ?? region.id;
      if (anchor !== active) {
        active = anchor;
        const role = toRegionRole(region.getAttribute(ATTR.regionRole) ?? undefined);
        ctx.state.activeAnchor = anchor;
        ctx.state.activeRole = role;
        const detail: ActiveRegionDetail = { nodeId, anchor, role, progress };
        emit(doc, EVENTS.activeRegion, detail);
      }
      if (pick.crossed) {
        crossedOnce = true;
        queueHash(anchor);
      } else if (crossedOnce) {
        // Back at the top of the page: drop a region hash (but keep deep links to other objects).
        queueHash(null);
      }
    }

    if (Math.abs(progress - lastProgress) >= PROGRESS_EPSILON || (progress === 1 && lastProgress !== 1)) {
      lastProgress = progress;
      ctx.state.progress = progress;
      paintProgress(doc, nodeId, progress);
      emit(doc, CLIENT_EVENTS.progress, { nodeId, progress, anchor: active });
    }
  };

  const queueHash = (anchor: string | null): void => {
    const current = decodeHash(location.hash);
    if (anchor === null) {
      // Only a hash that names a region is dropped; deep links to objects survive.
      if (current === '' || !regions.some((region) => region.getAttribute(ATTR.region) === current)) return;
    } else {
      const target = current === '' ? null : doc.getElementById(current);
      const hashRegion = target?.closest(`[${ATTR.region}]`)?.getAttribute(ATTR.region) ?? null;
      if (!shouldReplaceHash(current, anchor, hashRegion)) return;
    }
    pendingHash = anchor;
    hashWriter.call();
  };

  const schedule = frameScheduler(ctl, update);

  window.addEventListener('scroll', schedule, { passive: true, signal: ctl.signal });
  window.addEventListener(
    'resize',
    () => {
      collect();
      schedule();
    },
    { passive: true, signal: ctl.signal },
  );
  // Depth changes show/hide regions: re-measure after layout settles.
  doc.addEventListener(
    EVENTS.depth,
    () => {
      ctl.frame(() => {
        collect();
        schedule();
      });
    },
    { signal: ctl.signal },
  );

  if (typeof IntersectionObserver === 'function') {
    // A band from the top of the viewport down to the reading line: a region entering or
    // leaving it is exactly a threshold crossing.
    const bottomInset = `-${String(Math.round((1 - READING_THRESHOLD) * 1000) / 10)}%`;
    const observer = ctl.observe(new IntersectionObserver(schedule, { rootMargin: `0px 0px ${bottomInset} 0px`, threshold: [0] }));
    for (const region of $$(`[${ATTR.region}]`, scope)) observer.observe(region);
  }

  // Leaving the page: flush a pending hash so back-navigation restores the right region.
  ctl.defer(() => {
    hashWriter.flush();
  });

  schedule();
}

function writeHash(anchor: string | null): void {
  const next = hrefWithHash(location.href, anchor);
  if (next === location.href) return;
  try {
    // Preserve history.state: Astro's ClientRouter stores its index and scroll position there.
    history.replaceState(history.state, '', next);
  } catch {
    // Some engines rate-limit replaceState (e.g. >100 calls / 30 s); the hash is a convenience, not state.
  }
}

function decodeHash(hash: string): string {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Paints progress onto the current node's tree item and the minimap: the host
 * gets a `--progress` custom property (0..1); its own `[data-progress]` bar
 * element (the hairline, if rendered) gets `data-progress="0.420"` and the
 * same custom property.
 */
export function paintProgress(doc: Document, nodeId: string, progress: number): void {
  const value = progress.toFixed(3);
  const item = $(`[${ATTR.treeNode}="${CSS.escape(nodeId)}"]`, doc);
  if (item !== null) setProgress(item, value);
  const minimap = $(`[${ATTR.minimap}]`, doc);
  if (minimap !== null) setProgress(minimap, value);
}

export function setProgress(host: HTMLElement, value: string): void {
  host.style.setProperty('--progress', value);
  const bar = $$(`[${ATTR.progress}]`, host).find(
    (candidate) => candidate.closest(`[${ATTR.treeNode}], [${ATTR.minimap}]`) === host,
  );
  if (bar !== undefined) {
    bar.setAttribute(ATTR.progress, value);
    bar.style.setProperty('--progress', value);
  }
}
