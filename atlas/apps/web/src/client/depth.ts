/**
 * Depth control (UI_UX §29): Overview · Technical · Research · Implementation
 * toggle the visibility of layers of one document (`<html data-depth>` +
 * CSS on `[data-depth-min]`). The selection is kept in the URL (`?depth=`,
 * via replaceState, no history entries), persisted (STORAGE_KEYS.depth), and
 * announced (EVENTS.depth). The segmented control's links keep `?depth=`
 * hrefs as the no-JavaScript fallback.
 *
 * Changing depth shows or hides content above the reading position, so the
 * element at the reading line is measured before and after and the page is
 * corrected by the difference: the reader stays on the same sentence.
 *
 * Links keep depth across navigation two ways: the inline bootstrap restores
 * it from storage onto <html data-depth> on every load and swap, this module
 * writes it back into the URL, and internal links are rewritten just before
 * use (pointerdown, focus, context menu) so copied or new-tab links carry it.
 */
import type { Depth } from '@atlas/core';
import { ATTR, DEPTH_DESCRIPTIONS, DEPTH_LABELS, EVENTS, isDepth, READING_THRESHOLD, STORAGE_KEYS } from './contract.ts';
import { $$, isRendered } from './dom.ts';
import { depthFromUrl, linkWithDepth, pageUrlWithDepth, resolveDepth } from './depth-url.ts';
import { emit } from './events.ts';
import { ACTIONS, actionSelector, attrOf, closestAction, HOOK } from './hooks.ts';
import type { PageContext } from './page.ts';

export function initDepth(ctx: PageContext): void {
  const { doc, ctl, store } = ctx;
  const root = doc.documentElement;

  const controls = (): HTMLElement[] => $$(actionSelector(ACTIONS.depth), doc);
  const valueOf = (control: Element): Depth | null => {
    const value = attrOf(control, HOOK.depthOption);
    return value !== null && isDepth(value) ? value : null;
  };
  const paintControls = (depth: Depth): void => {
    for (const control of controls()) {
      const selected = valueOf(control) === depth;
      if (control instanceof HTMLButtonElement) control.setAttribute('aria-pressed', selected ? 'true' : 'false');
      else if (selected) control.setAttribute('aria-current', 'true');
      else control.removeAttribute('aria-current');
    }
  };
  const syncUrl = (depth: Depth): void => {
    const next = pageUrlWithDepth(location.href, depth);
    if (next === location.href) return;
    try {
      history.replaceState(history.state, '', next);
    } catch {
      // replaceState can be rate-limited; the depth is still applied and persisted.
    }
  };

  const setDepth = (depth: Depth): void => {
    if (depth === ctx.state.depth && root.getAttribute(ATTR.depth) === depth) return;
    const anchor = readingAnchor(doc, ctx.article);
    root.setAttribute(ATTR.depth, depth);
    if (anchor !== null) restoreAnchor(anchor);
    ctx.state.depth = depth;
    syncUrl(depth);
    store.write(STORAGE_KEYS.depth, depth);
    paintControls(depth);
    emit(doc, EVENTS.depth, { depth });
    ctx.announce(`Depth: ${DEPTH_LABELS[depth]}. ${DEPTH_DESCRIPTIONS[depth]}.`);
  };
  ctx.actions.setDepth = setDepth;

  // Initial state: URL (a shared link states its depth) → stored preference → default. The inline
  // bootstrap has already resolved the stored preference (enumerated values only) onto <html data-depth>
  // before first paint; reading it back here keeps zod out of the eager chunk.
  const fromUrl = depthFromUrl(location.href);
  const fromRoot = root.getAttribute(ATTR.depth);
  const initial = resolveDepth(fromUrl, fromRoot !== null && isDepth(fromRoot) ? fromRoot : null);
  ctx.state.depth = initial;
  if (root.getAttribute(ATTR.depth) !== initial) root.setAttribute(ATTR.depth, initial);
  if (fromUrl !== null) store.write(STORAGE_KEYS.depth, fromUrl);
  syncUrl(initial);
  paintControls(initial);

  doc.addEventListener(
    'click',
    (event) => {
      const control = closestAction(event.target, ACTIONS.depth);
      if (control === null || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const depth = valueOf(control);
      if (depth === null) return;
      event.preventDefault();
      setDepth(depth);
    },
    { signal: ctl.signal },
  );

  // Carry depth on internal links just before they are used.
  const rewrite = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const link = event.target.closest<HTMLAnchorElement>('a[href]');
    if (link === null || link.hasAttribute('download') || closestAction(link, ACTIONS.depth) !== null) return;
    const raw = link.getAttribute('href');
    if (raw === null) return;
    const next = linkWithDepth(raw, ctx.state.depth, location.href);
    if (next !== null && next !== raw) link.setAttribute('href', next);
  };
  for (const type of ['pointerdown', 'focusin', 'contextmenu'] as const) {
    doc.addEventListener(type, rewrite, { signal: ctl.signal, capture: true });
  }

  ctx.actions.linkTo = (anchor: string | null): string => {
    const url = new URL(pageUrlWithDepth(location.href, ctx.state.depth));
    url.hash = anchor === null ? '' : `#${anchor}`;
    return url.href;
  };
}

interface ReadingAnchor {
  readonly chain: readonly { readonly element: Element; readonly top: number }[];
}

/** The element under the reading line in the article column, with its ancestors' positions. */
function readingAnchor(doc: Document, article: HTMLElement | null): ReadingAnchor | null {
  if (article === null) return null;
  const box = article.getBoundingClientRect();
  const y = window.innerHeight * READING_THRESHOLD;
  if (box.top > y || box.bottom < y) return null;
  let element = doc.elementFromPoint(box.left + Math.min(box.width / 2, 320), y);
  const chain: { element: Element; top: number }[] = [];
  for (; element !== null && article.contains(element) && chain.length < 12; element = element.parentElement) {
    chain.push({ element, top: element.getBoundingClientRect().top });
    if (element === article) break;
  }
  return chain.length === 0 ? null : { chain };
}

/** Corrects the scroll position so the first still-rendered element of the chain keeps its viewport offset. */
function restoreAnchor(anchor: ReadingAnchor): void {
  for (const { element, top } of anchor.chain) {
    if (!isRendered(element)) continue;
    const delta = element.getBoundingClientRect().top - top;
    if (Math.abs(delta) >= 1) window.scrollBy({ top: delta, left: 0, behavior: 'instant' });
    return;
  }
}
