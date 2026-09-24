/**
 * Explorable figures: every diagram and matrix answers the pointer.
 *
 * Diagrams, cycles, concept maps (`svg.vg-scene`): pointing at a node lights
 * it, its incident edges, and its neighbours, steps everything else back, and
 * writes a readout under the figure — what feeds the node and what it feeds —
 * so a concept map reads as a set of dependencies rather than a picture.
 *
 * Matrices (`svg[data-mx-grid]`): pointing at a cell lights its row and
 * column and names the pair and whether it is admitted (masks, attention
 * patterns, routing), using the renderer's bitmap — no recomputation.
 *
 * Pure enhancement of server-rendered SVG; state classes only (has-explore,
 * is-hot, is-near). Live-instrument states use different classes (has-lit,
 * is-lit), so exploring a live instrument never clobbers its scroll state.
 */
import type { PageContext } from './page.ts';

interface SceneIndex {
  readonly nodes: Map<string, SVGGElement>;
  readonly edges: { readonly from: string; readonly to: string; readonly parts: Element[] }[];
}

function labelOf(node: Element): string {
  const label = [...node.querySelectorAll('.vg-node__label')].map((t) => t.textContent.trim()).join(' ').trim();
  const sub = node.querySelector('.vg-node__sub')?.textContent.trim() ?? '';
  return sub === '' ? label : `${label} ${sub}`;
}

function readoutFor(svg: SVGSVGElement, className: string): HTMLElement {
  const host = svg.closest('.vg-figure') ?? svg.parentElement;
  const existing = host?.querySelector<HTMLElement>(`.${className}`);
  if (existing !== null && existing !== undefined) return existing;
  const line = document.createElement('p');
  line.className = className;
  line.setAttribute('aria-live', 'polite');
  const body = svg.closest('.vg-figure__body') ?? svg;
  body.insertAdjacentElement('afterend', line);
  return line;
}

function indexScene(svg: SVGSVGElement): SceneIndex {
  const nodes = new Map<string, SVGGElement>();
  for (const node of svg.querySelectorAll<SVGGElement>('g.vg-node[data-vg-key]')) nodes.set(node.getAttribute('data-vg-key') ?? '', node);
  const byKey = new Map<string, Element[]>();
  for (const part of svg.querySelectorAll('.vg-edge[data-vg-key], .vg-edge__tag[data-vg-key]')) {
    const key = part.getAttribute('data-vg-key') ?? '';
    byKey.set(key, [...(byKey.get(key) ?? []), part]);
  }
  const edges = [...byKey].map(([key, parts]) => {
    const [from = '', to = ''] = key.split('->');
    return { from, to, parts };
  });
  return { nodes, edges };
}

/** Nodes in reading order (top-to-bottom, then left-to-right) for keyboard stepping. */
function readingOrder(nodes: Iterable<SVGGElement>): SVGGElement[] {
  const placed = [...nodes].map((node) => {
    const box = node.getBBox();
    return { node, x: box.x + box.width / 2, y: box.y + box.height / 2 };
  });
  return placed.sort((a, b) => (Math.abs(a.y - b.y) > 8 ? a.y - b.y : a.x - b.x)).map((entry) => entry.node);
}

/** One tab stop per figure; arrows step, Home/End jump, Esc clears. */
function makeSteppable(svg: SVGSVGElement, hint: string): void {
  if (!svg.hasAttribute('tabindex')) svg.setAttribute('tabindex', '0');
  svg.classList.add('is-explorable');
  const label = svg.getAttribute('aria-label');
  svg.setAttribute('aria-label', label === null ? hint : `${label}. ${hint}`);
}

const STEP_KEYS: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

function exploreScene(svg: SVGSVGElement, signal: AbortSignal): void {
  const index = indexScene(svg);
  if (index.nodes.size === 0) return;
  let readout: HTMLElement | null = null;
  let order: SVGGElement[] | null = null;
  let cursor = -1;
  const clear = (): void => {
    svg.classList.remove('has-explore');
    for (const el of svg.querySelectorAll('.is-hot, .is-near')) el.classList.remove('is-hot', 'is-near');
    if (readout !== null) readout.textContent = '';
  };
  const focusNode = (node: SVGGElement): void => {
    const id = node.getAttribute('data-vg-key') ?? '';
    clear();
    svg.classList.add('has-explore');
    node.classList.add('is-hot');
    const into: string[] = [];
    const outOf: string[] = [];
    for (const edge of index.edges) {
      if (edge.from !== id && edge.to !== id) continue;
      for (const part of edge.parts) part.classList.add('is-hot');
      const other = edge.from === id ? edge.to : edge.from;
      const otherNode = index.nodes.get(other);
      otherNode?.classList.add('is-near');
      const name = otherNode === undefined ? other : labelOf(otherNode);
      if (edge.from === id) outOf.push(name);
      else into.push(name);
    }
    readout ??= readoutFor(svg, 'vg-explore');
    readout.replaceChildren();
    const strong = document.createElement('b');
    strong.textContent = labelOf(node);
    readout.append(strong);
    if (into.length > 0) readout.append(`  ← ${into.join(', ')}`);
    if (outOf.length > 0) readout.append(`  → ${outOf.join(', ')}`);
    if (into.length === 0 && outOf.length === 0) readout.append('  (no drawn connections)');
  };
  svg.addEventListener(
    'pointerover',
    (event) => {
      const node = event.target instanceof Element ? event.target.closest<SVGGElement>('g.vg-node[data-vg-key]') : null;
      if (node !== null) focusNode(node);
    },
    { signal },
  );
  svg.addEventListener('pointerleave', () => {
    if (document.activeElement !== svg) clear();
  }, { signal });

  makeSteppable(svg, 'Use the arrow keys to step through its nodes and see what each one connects to');
  svg.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        clear();
        cursor = -1;
        return;
      }
      const step = STEP_KEYS[event.key];
      const jump = event.key === 'Home' ? 'first' : event.key === 'End' ? 'last' : null;
      if (step === undefined && jump === null) return;
      event.preventDefault();
      order ??= readingOrder(index.nodes.values());
      if (order.length === 0) return;
      cursor = jump === 'first' ? 0 : jump === 'last' ? order.length - 1 : (cursor + (step ?? 0) + order.length) % order.length;
      const node = order[cursor];
      if (node !== undefined) focusNode(node);
    },
    { signal },
  );
  svg.addEventListener('blur', () => {
    clear();
    cursor = -1;
  }, { signal });
}

function exploreMatrix(svg: SVGSVGElement, signal: AbortSignal): void {
  const [left = 0, top = 0, cell = 1, rows = 0, cols = 0] = (svg.dataset['mxGrid'] ?? '').split(' ').map(Number);
  const bits = svg.dataset['mxCells'] ?? '';
  const rowTicks = (svg.dataset['mxRowTicks'] ?? '').split('|');
  const colTicks = (svg.dataset['mxColTicks'] ?? '').split('|');
  const rowLabel = svg.dataset['mxRowLabel'] ?? 'row';
  const colLabel = svg.dataset['mxColLabel'] ?? 'column';
  const hover = svg.querySelector<SVGGElement>('[data-mx-hover]');
  const rowBand = hover?.querySelector<SVGRectElement>('.vg-mx-hover__row');
  const colBand = hover?.querySelector<SVGRectElement>('.vg-mx-hover__col');
  const outline = hover?.querySelector<SVGRectElement>('.vg-mx-hover__cell');
  if (hover === null || rows === 0 || cols === 0) return;
  let readout: HTMLElement | null = null;
  let last = '';
  let at: readonly [number, number] | null = null;

  const off = (): void => {
    hover.classList.remove('is-on');
    last = '';
    at = null;
    if (readout !== null) readout.textContent = '';
  };
  const focusCell = (i: number, j: number): void => {
    const key = `${String(i)}:${String(j)}`;
    if (key === last) return;
    last = key;
    at = [i, j];
    hover.classList.add('is-on');
    rowBand?.setAttribute('y', String(top + i * cell));
    colBand?.setAttribute('x', String(left + j * cell));
    outline?.setAttribute('x', String(left + j * cell));
    outline?.setAttribute('y', String(top + i * cell));
    const on = bits.charAt(i * cols + j) === '1';
    readout ??= readoutFor(svg, 'vg-explore');
    readout.replaceChildren();
    const strong = document.createElement('b');
    strong.textContent = `${rowLabel} ${rowTicks[i] ?? String(i)} · ${colLabel} ${colTicks[j] ?? String(j)}`;
    readout.append(strong, on ? '  — admitted' : '  — masked');
    const rowCount = bits.slice(i * cols, (i + 1) * cols).split('').filter((b) => b === '1').length;
    readout.append(`  (${String(rowCount)} of ${String(cols)} in this row)`);
  };

  svg.addEventListener(
    'pointermove',
    (event) => {
      const ctm = svg.getScreenCTM();
      if (ctm === null) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
      const j = Math.floor((point.x - left) / cell);
      const i = Math.floor((point.y - top) / cell);
      if (i < 0 || j < 0 || i >= rows || j >= cols) {
        hover.classList.remove('is-on');
        last = '';
        return;
      }
      focusCell(i, j);
    },
    { signal },
  );
  svg.addEventListener('pointerleave', () => {
    if (document.activeElement !== svg) off();
  }, { signal });

  makeSteppable(svg, 'Use the arrow keys to move between cells');
  const MOVES: Readonly<Record<string, readonly [number, number]>> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  svg.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        off();
        return;
      }
      const move = MOVES[event.key];
      if (move === undefined) return;
      event.preventDefault();
      if (at === null) {
        focusCell(0, 0); // first key press enters the grid at its top-left cell
        return;
      }
      const clamp = (value: number, size: number): number => Math.min(size - 1, Math.max(0, value));
      focusCell(clamp(at[0] + move[0], rows), clamp(at[1] + move[1], cols));
    },
    { signal },
  );
  svg.addEventListener('blur', off, { signal });
}

export function initFigureExplore(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  for (const svg of doc.querySelectorAll<SVGSVGElement>('svg.vg-scene')) exploreScene(svg, ctl.signal);
  for (const svg of doc.querySelectorAll<SVGSVGElement>('svg[data-mx-grid]')) exploreMatrix(svg, ctl.signal);
}
