/**
 * Live home instrument (components/shell/AtlasInstrument.astro).
 *
 * - Hover or focus a chapter dot → the readout line names it (number, title,
 *   state); the dot's part row is marked `is-lit`.
 * - Hover or focus a chapter in the universe map (`[data-chapter-link]`) →
 *   the matching dot lights; hovering a part (`[data-part-link]`) lights its
 *   row. The panel and the map are two projections of one structure.
 * - Hover a legend line → its dot set stays, the other set dims.
 * - The dot grid is a single tab stop; arrow keys move focus (roving
 *   tabindex): ←/→ within a part, ↑/↓ across parts, Home/End.
 *
 * Pure DOM enhancement; the markup works as plain links without it.
 */
import type { PageContext } from './page.ts';

const LIT = 'is-lit';

export function initAtlasInstrument(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const panel = doc.querySelector<HTMLElement>('[data-atlas-instrument]');
  if (panel === null) return;
  const readout = panel.querySelector<HTMLElement>('[data-instrument-readout]');
  const dots = [...panel.querySelectorAll<HTMLAnchorElement>('a[data-dot]')];
  if (dots.length === 0) return;
  const rows = [...panel.querySelectorAll<HTMLElement>('[data-part-id]')];
  const defaultText = readout?.dataset['default'] ?? '';

  const clear = (): void => {
    for (const element of panel.querySelectorAll(`.${LIT}`)) element.classList.remove(LIT);
    panel.classList.remove('has-lit');
    if (readout !== null) readout.textContent = defaultText;
  };

  const lightDot = (dot: HTMLAnchorElement): void => {
    clear();
    dot.classList.add(LIT);
    dot.closest('[data-part-id]')?.classList.add(LIT);
    panel.classList.add('has-lit');
    if (readout !== null) readout.textContent = dot.dataset['readout'] ?? '';
  };

  const lightPart = (partId: string): void => {
    clear();
    const row = rows.find((candidate) => candidate.dataset['partId'] === partId);
    if (row === undefined) return;
    row.classList.add(LIT);
    panel.classList.add('has-lit');
    const title = row.querySelector<HTMLElement>('.sh-dotrow-num')?.title ?? '';
    const partDots = [...row.querySelectorAll<HTMLAnchorElement>('a[data-dot]')];
    const written = partDots.filter((dot) => dot.classList.contains('sh-dot--filled')).length;
    if (readout !== null) readout.textContent = `${title} · ${String(written)} of ${String(partDots.length)} chapters written`;
  };

  const onDot = (event: Event): void => {
    const dot = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-dot]') : null;
    if (dot !== null) lightDot(dot);
  };
  panel.addEventListener('pointerover', onDot, { signal: ctl.signal });
  panel.addEventListener('focusin', onDot, { signal: ctl.signal });
  panel.addEventListener(
    'pointerleave',
    () => {
      if (!panel.contains(doc.activeElement)) clear();
    },
    { signal: ctl.signal },
  );
  panel.addEventListener(
    'focusout',
    (event) => {
      if (!(event.relatedTarget instanceof Node) || !panel.contains(event.relatedTarget)) clear();
    },
    { signal: ctl.signal },
  );

  // Legend lines: keep one set, dim the other.
  for (const legend of panel.querySelectorAll<HTMLElement>('[data-legend]')) {
    const set = legend.dataset['legend'];
    legend.addEventListener('pointerenter', () => { panel.setAttribute('data-legend-focus', set ?? ''); }, { signal: ctl.signal });
    legend.addEventListener('pointerleave', () => { panel.removeAttribute('data-legend-focus'); }, { signal: ctl.signal });
  }

  // The universe map lights the panel.
  const onMap = (event: Event): void => {
    if (!(event.target instanceof Element)) return;
    const chapterLink = event.target.closest<HTMLElement>('[data-chapter-link]');
    if (chapterLink !== null) {
      const dot = dots.find((candidate) => candidate.dataset['dot'] === chapterLink.dataset['chapterLink']);
      if (dot !== undefined) lightDot(dot);
      return;
    }
    const part = event.target.closest<HTMLElement>('[data-part-link]');
    const partId = part?.dataset['partLink'];
    if (partId !== undefined) lightPart(partId);
  };
  const map = doc.querySelector<HTMLElement>('.sh-universe');
  if (map !== null) {
    map.addEventListener('pointerover', onMap, { signal: ctl.signal });
    map.addEventListener('focusin', onMap, { signal: ctl.signal });
    map.addEventListener('pointerleave', clear, { signal: ctl.signal });
  }

  // Roving tabindex across the dot grid.
  const grid = rows.map((row) => [...row.querySelectorAll<HTMLAnchorElement>('a[data-dot]')]);
  const position = (dot: HTMLAnchorElement): readonly [number, number] | null => {
    for (let r = 0; r < grid.length; r += 1) {
      const c = grid[r]?.indexOf(dot) ?? -1;
      if (c >= 0) return [r, c];
    }
    return null;
  };
  const focusAt = (r: number, c: number): void => {
    const row = grid[Math.max(0, Math.min(grid.length - 1, r))] ?? [];
    const target = row[Math.max(0, Math.min(row.length - 1, c))];
    if (target === undefined) return;
    for (const dot of dots) dot.tabIndex = -1;
    target.tabIndex = 0;
    target.focus();
  };
  panel.addEventListener(
    'keydown',
    (event) => {
      const dot = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-dot]') : null;
      if (dot === null) return;
      const at = position(dot);
      if (at === null) return;
      const [r, c] = at;
      const moves: Readonly<Record<string, readonly [number, number]>> = {
        ArrowRight: [r, c + 1],
        ArrowLeft: [r, c - 1],
        ArrowDown: [r + 1, c],
        ArrowUp: [r - 1, c],
        Home: [0, 0],
        End: [grid.length - 1, Number.MAX_SAFE_INTEGER],
      };
      const next = moves[event.key];
      if (next === undefined) return;
      event.preventDefault();
      focusAt(next[0], next[1]);
    },
    { signal: ctl.signal },
  );
}
