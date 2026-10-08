/**
 * System / lab page map (components/shell/EntityMap.astro): pointing at or
 * focusing a chapter dot — or its row in the readout's index — fills the
 * fixed-size readout with what that chapter takes from the system or lab (or
 * that its plan names it), and marks the dot and the row together; leaving
 * returns to the rest state: the chapter that draws on it most.
 */
import type { PageContext } from './page.ts';

export function initEntityMap(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-entity-map]');
  const svg = root?.querySelector<SVGSVGElement>('[data-em-svg]') ?? null;
  const readout = root?.querySelector<HTMLElement>('[data-em-readout]') ?? null;
  if (root === null || svg === null || readout === null) return;
  const signal = ctl.signal;
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
  const dots = new Map(
    [...svg.querySelectorAll<SVGAElement>('[data-em-n]')].map((dot) => [dot.dataset['emN'] ?? '', dot]),
  );
  const rows = new Map(
    [...readout.querySelectorAll<HTMLElement>('[data-em-row]')].map((row) => [row.dataset['emRow'] ?? '', row]),
  );
  const restN = readout.dataset['emRest'] ?? '';

  const write = (kicker: string, title: string, meta: string, what: string): void => {
    if (out.kicker !== null) out.kicker.textContent = kicker;
    if (out.title !== null) out.title.textContent = title;
    if (out.meta !== null) out.meta.textContent = meta;
    if (out.what !== null) out.what.textContent = what;
  };
  const mark = (n: string, className: string): void => {
    for (const node of [...dots.values(), ...rows.values()]) node.classList.remove(className);
    dots.get(n)?.classList.add(className);
    rows.get(n)?.classList.add(className);
  };
  const show = (n: string): void => {
    const dot = dots.get(n);
    if (dot === undefined) return;
    mark('', 'is-rest');
    mark(n, 'is-focus');
    const sections = dot.dataset['emSections'] ?? '';
    const state = dot.classList.contains('is-used')
      ? sections === '' || sections === '0'
        ? 'listed'
        : `${sections} §`
      : dot.classList.contains('is-planned-use')
        ? 'planned'
        : 'not yet';
    write(
      `ch ${n.padStart(2, '0')} · ${state}`,
      dot.dataset['emTitle'] ?? '',
      dot.dataset['emMeta'] ?? '',
      dot.dataset['emWhat'] ?? '',
    );
  };
  const reset = (): void => {
    mark('', 'is-focus');
    mark(restN, 'is-rest');
    write(initial.kicker, initial.title, initial.meta, initial.what);
  };
  const keyOf = (target: EventTarget | null): string | null => {
    if (!(target instanceof Element)) return null;
    return (
      target.closest<HTMLElement | SVGElement>('[data-em-n], [data-em-row]')?.getAttribute('data-em-n') ??
      target.closest<HTMLElement>('[data-em-row]')?.dataset['emRow'] ??
      null
    );
  };
  for (const scope of [svg, readout]) {
    scope.addEventListener(
      'pointerover',
      (event) => {
        const n = keyOf(event.target);
        if (n !== null) show(n);
      },
      { signal },
    );
    scope.addEventListener(
      'focusin',
      (event) => {
        const n = keyOf(event.target);
        if (n !== null) show(n);
      },
      { signal },
    );
  }
  root.addEventListener('pointerleave', reset, { signal });
  root.addEventListener(
    'focusout',
    (event) => {
      if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) reset();
    },
    { signal },
  );
}
