/**
 * Research minimap (UI_UX §12): a vertical semantic outline of the page. The
 * entry for the active region gets `aria-current="location"` and `is-active`;
 * markers (equations, figures, experiments, …) inside the active region get
 * `is-in-region`. Markers are ordinary fragment links, so a click uses native
 * anchor navigation; afterwards focus moves to the target so keyboard users
 * continue reading from there.
 */
import { ATTR, EVENTS } from './contract.ts';
import { $, $$, focusElement, isPlainClick } from './dom.ts';
import type { PageContext } from './page.ts';

const ACTIVE = 'is-active';
const IN_REGION = 'is-in-region';

export function initMinimap(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const minimap = $(`[${ATTR.minimap}]`, doc);
  if (minimap === null) return;

  const entries = $$<HTMLAnchorElement>('a[href*="#"]', minimap)
    .map((link) => ({ link, anchor: fragmentOf(link) }))
    .filter((entry): entry is { link: HTMLAnchorElement; anchor: string } => entry.anchor !== null);
  if (entries.length === 0) return;

  const regionOf = new Map<string, string | null>();
  for (const { anchor } of entries) {
    const target = doc.getElementById(anchor);
    const region = target?.closest(`[${ATTR.region}]`)?.getAttribute(ATTR.region) ?? null;
    regionOf.set(anchor, target?.hasAttribute(ATTR.region) === true ? anchor : region);
  }

  const highlight = (active: string): void => {
    for (const { link, anchor } of entries) {
      const isRegion = anchor === active;
      link.classList.toggle(ACTIVE, isRegion);
      if (isRegion) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
      link.classList.toggle(IN_REGION, !isRegion && regionOf.get(anchor) === active);
    }
  };

  doc.addEventListener(
    EVENTS.activeRegion,
    (event) => {
      highlight(event.detail.anchor);
    },
    { signal: ctl.signal },
  );
  if (ctx.state.activeAnchor !== null) highlight(ctx.state.activeAnchor);

  minimap.addEventListener(
    'click',
    (event) => {
      if (!isPlainClick(event) || !(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('a[href*="#"]');
      const anchor = link === null ? null : fragmentOf(link);
      if (anchor === null) return;
      // Let the native jump (and any router handling) happen first, then move focus without scrolling again.
      ctl.frame(() => {
        const target = doc.getElementById(anchor);
        if (target !== null) focusElement(target);
      });
    },
    { signal: ctl.signal },
  );
}

/** The decoded fragment of a same-page link, or null. */
function fragmentOf(link: HTMLAnchorElement): string | null {
  const url = new URL(link.href, location.href);
  if (url.pathname !== location.pathname || url.hash.length < 2) return null;
  try {
    return decodeURIComponent(url.hash.slice(1));
  } catch {
    return url.hash.slice(1);
  }
}
