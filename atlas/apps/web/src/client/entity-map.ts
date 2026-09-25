/**
 * System / lab page map (components/shell/EntityMap.astro): pointing at or
 * focusing a chapter dot fills the fixed-size readout with what that chapter
 * takes from the system or lab (or that its plan names it); leaving restores
 * the page's summary.
 */
import type { PageContext } from './page.ts';

export function initEntityMap(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-entity-map]');
  const svg = root?.querySelector<SVGSVGElement>('[data-em-svg]') ?? null;
  if (root === null || svg === null) return;
  const out = {
    kicker: root.querySelector<HTMLElement>('[data-em-kicker]'),
    title: root.querySelector<HTMLElement>('[data-em-rtitle]'),
    meta: root.querySelector<HTMLElement>('[data-em-rmeta]'),
    what: root.querySelector<HTMLElement>('[data-em-rwhat]'),
  };
  const initial = {
    kicker: out.kicker?.textContent ?? '',
    title: out.title?.textContent ?? '',
    meta: out.meta?.textContent ?? '',
    what: out.what?.textContent ?? '',
  };
  const write = (kicker: string, title: string, meta: string, what: string): void => {
    if (out.kicker !== null) out.kicker.textContent = kicker;
    if (out.title !== null) out.title.textContent = title;
    if (out.meta !== null) out.meta.textContent = meta;
    if (out.what !== null) out.what.textContent = what;
  };
  const dotFrom = (target: EventTarget | null): SVGAElement | null =>
    target instanceof Element ? target.closest<SVGAElement>('[data-em-n]') : null;
  const show = (dot: SVGAElement): void => {
    for (const other of svg.querySelectorAll('.is-focus')) other.classList.remove('is-focus');
    dot.classList.add('is-focus');
    const state = dot.classList.contains('is-used') ? 'draws on it' : dot.classList.contains('is-planned-use') ? 'planned' : 'does not draw on it yet';
    write(`ch ${(dot.dataset['emN'] ?? '').padStart(2, '0')} · ${state}`, dot.dataset['emTitle'] ?? '', dot.dataset['emMeta'] ?? '', dot.dataset['emWhat'] ?? '');
  };
  const reset = (): void => {
    for (const other of svg.querySelectorAll('.is-focus')) other.classList.remove('is-focus');
    write(initial.kicker, initial.title, initial.meta, initial.what);
  };
  svg.addEventListener('pointerover', (event) => {
    const dot = dotFrom(event.target);
    if (dot !== null) show(dot);
  }, { signal: ctl.signal });
  svg.addEventListener('focusin', (event) => {
    const dot = dotFrom(event.target);
    if (dot !== null) show(dot);
  }, { signal: ctl.signal });
  svg.addEventListener('pointerleave', reset, { signal: ctl.signal });
  svg.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !svg.contains(event.relatedTarget)) reset();
  }, { signal: ctl.signal });
}
