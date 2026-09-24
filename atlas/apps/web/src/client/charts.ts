/**
 * Progressive enhancement of server-rendered chart SVGs (UI_UX §42,
 * VISUAL_GRAMMAR §5.10). Without JavaScript a chart is a complete, captioned
 * figure with a text equivalent; with it:
 *
 * - hover (or keyboard focus + arrows) marks the nearest data point and
 *   reads out its exact x and y;
 * - a legend entry isolates its series (click again to restore all), with
 *   `aria-pressed` meaning "series shown"; nothing animates.
 *
 * Markup contract (the visual chart renderer, packages/visual/src/svg/chart.tsx):
 *   <figure data-figure-kind="chart"> … <div class="vg-chart vg-chart--{type}">
 *     <svg> … <path data-series="{id}"/> …
 *       <circle class="vg-pt" data-series="{id}" data-x="512" data-y="1.2e8" data-xv="512" data-yv="1.2 GiB"/>
 *     <div class="vg-legend"><button data-series="{id}" aria-pressed="true">label</button> …
 * `data-xv` / `data-yv` are the renderer's formatted values; without them the
 * readout formats raw values with core `formatValue` and the axis formats in
 * `data-x-format` / `data-y-format` (on the <svg> or <figure>). A legend may
 * also use `data-series-toggle="{id}"` (any element; made keyboard-operable).
 */
import { ATTR } from './contract.ts';
import {
  edgeOfSeries,
  nearestPoint,
  parseFormat,
  parseNumber,
  readoutText,
  stepInSeries,
  switchSeries,
  toggleIsolation,
  type PickMode,
  type PlotPoint,
  type ReadoutAxes,
} from './chart-model.ts';
import { $$, h } from './dom.ts';
import { HOOK } from './hooks.ts';
import { frameScheduler, type Controller } from './lifecycle.ts';
import type { PageContext } from './page.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DIMMED = 'is-dimmed';
const ACTIVE = 'is-active';

export function initCharts(ctx: PageContext): void {
  for (const figure of $$(`[${ATTR.figureKind}="chart"]`, ctx.doc)) {
    const svg = figure.querySelector<SVGSVGElement>('svg');
    if (svg !== null && svg.querySelector(`[${HOOK.chartX}][${HOOK.chartY}]`) !== null) enhanceChart(ctx.ctl, figure, svg);
  }
}

function attrFrom(svg: Element, figure: Element, name: string): string | null {
  return svg.getAttribute(name) ?? figure.getAttribute(name);
}

/** Axis titles: explicit attributes, else the renderer's `.vg-axis-label` texts (the x label is centred). */
function axisLabels(svg: SVGSVGElement, figure: HTMLElement): { x: string | null; y: string | null } {
  let x = attrFrom(svg, figure, 'data-x-label');
  let y = attrFrom(svg, figure, 'data-y-label');
  for (const label of $$<SVGTextElement>('.vg-axis-label', svg)) {
    const text = label.textContent.trim();
    if (text === '') continue;
    if (label.getAttribute('text-anchor') === 'middle') x ??= text;
    else y ??= text;
  }
  return { x, y };
}

function enhanceChart(ctl: Controller, figure: HTMLElement, svg: SVGSVGElement): void {
  const labelsForAxes = axisLabels(svg, figure);
  const axes: ReadoutAxes = {
    xFormat: parseFormat(attrFrom(svg, figure, HOOK.chartXFormat)),
    yFormat: parseFormat(attrFrom(svg, figure, HOOK.chartYFormat)),
    xLabel: labelsForAxes.x,
    yLabel: labelsForAxes.y,
  };
  const scatter = attrFrom(svg, figure, 'data-chart-type') === 'scatter' || figure.querySelector('.vg-chart--scatter') !== null;
  const mode: PickMode = scatter ? 'xy' : 'x';
  // Legend entries live outside the plot: `data-series-toggle` anywhere, or `data-series` buttons outside the <svg>.
  const toggles = $$<Element>(`[${HOOK.chartToggle}], button[${HOOK.chartSeries}]`, figure).filter((element) => !svg.contains(element));
  const seriesEls = $$<Element>(`[${HOOK.chartSeries}]`, svg);
  const toggleId = (toggle: Element): string => toggle.getAttribute(HOOK.chartToggle) ?? toggle.getAttribute(HOOK.chartSeries) ?? '';

  const labels = new Map<string, string>();
  for (const toggle of toggles) {
    const id = toggleId(toggle);
    const text = toggle.textContent.trim();
    if (id !== '' && text !== '') labels.set(id, text);
  }
  for (const element of seriesEls) {
    const id = element.getAttribute(HOOK.chartSeries) ?? '';
    const label = element.getAttribute('data-series-label');
    if (id !== '' && label !== null && !labels.has(id)) labels.set(id, label);
  }

  // Geometry is measured lazily (the chart may be hidden by depth until the reader interacts).
  let points: PlotPoint[] | null = null;
  let pointEls: Element[] = [];
  let order: string[] = [];
  const measure = (): PlotPoint[] => {
    if (points !== null) return points;
    const rootInverse = svg.getScreenCTM()?.inverse() ?? null;
    const measured: PlotPoint[] = [];
    const elements: Element[] = [];
    for (const element of $$<SVGGraphicsElement>(`[${HOOK.chartX}][${HOOK.chartY}]`, svg)) {
      const x = parseNumber(element.getAttribute(HOOK.chartX));
      const y = parseNumber(element.getAttribute(HOOK.chartY));
      const local = element.getScreenCTM();
      if (x === null || y === null || rootInverse === null || local === null) continue;
      const box = element.getBBox();
      const center = new DOMPoint(box.x + box.width / 2, box.y + box.height / 2).matrixTransform(rootInverse.multiply(local));
      const series = element.closest(`[${HOOK.chartSeries}]`)?.getAttribute(HOOK.chartSeries) ?? 'series';
      measured.push({ series, x, y, px: center.x, py: center.y, xText: element.getAttribute('data-xv'), yText: element.getAttribute('data-yv') });
      elements.push(element);
    }
    order = [...new Set(measured.map((point) => point.series))];
    points = measured;
    pointEls = elements;
    return measured;
  };

  const marker = document.createElementNS(SVG_NS, 'circle');
  marker.setAttribute('class', 'cx-chart-focus');
  marker.setAttribute('r', '4.5');
  marker.setAttribute('aria-hidden', 'true');
  marker.setAttribute('visibility', 'hidden');
  svg.append(marker);
  const readout = h('p', { class: 'cx-chart-readout', role: 'status', 'aria-live': 'polite' });
  const hintId = `${figure.id === '' ? 'chart' : figure.id}-keys`;
  const hint = h('span', { class: 'cx-sr-only', id: hintId }, 'Arrow keys read data points; up and down switch series.');
  svg.after(hint, readout);
  ctl.defer(() => {
    marker.remove();
    hint.remove();
    readout.remove();
  });

  let isolated: string | null = null;
  let current = -1;
  const visible = (): ReadonlySet<string> | null => (isolated === null ? null : new Set([isolated]));

  const select = (index: number): void => {
    const point = measure()[index];
    if (point === undefined) return;
    pointEls[current]?.classList.remove(ACTIVE);
    current = index;
    pointEls[index]?.classList.add(ACTIVE);
    marker.setAttribute('cx', String(point.px));
    marker.setAttribute('cy', String(point.py));
    marker.setAttribute('visibility', 'visible');
    readout.textContent = readoutText(labels.get(point.series) ?? point.series, point, axes);
  };
  const clear = (): void => {
    pointEls[current]?.classList.remove(ACTIVE);
    current = -1;
    marker.setAttribute('visibility', 'hidden');
    readout.textContent = '';
  };

  // ── pointer ──────────────────────────────────────────────────────────────
  let lastPointer: { x: number; y: number } | null = null;
  const track = frameScheduler(ctl, () => {
    if (lastPointer === null) return;
    const inverse = svg.getScreenCTM()?.inverse();
    if (inverse === undefined) return;
    const user = new DOMPoint(lastPointer.x, lastPointer.y).matrixTransform(inverse);
    const index = nearestPoint(measure(), user.x, user.y, mode, visible());
    if (index >= 0 && index !== current) select(index);
  });
  svg.addEventListener(
    'pointermove',
    (event) => {
      lastPointer = { x: event.clientX, y: event.clientY };
      track();
    },
    { signal: ctl.signal, passive: true },
  );
  svg.addEventListener(
    'pointerleave',
    () => {
      lastPointer = null;
      if (document.activeElement !== svg) clear();
    },
    { signal: ctl.signal },
  );

  // ── keyboard ─────────────────────────────────────────────────────────────
  if (!svg.hasAttribute('tabindex')) svg.setAttribute('tabindex', '0');
  const describedBy = [svg.getAttribute('aria-describedby'), hintId].filter((part): part is string => part !== null && part !== '');
  svg.setAttribute('aria-describedby', describedBy.join(' '));

  svg.addEventListener(
    'focus',
    () => {
      if (current >= 0) return;
      const all = measure();
      const firstSeries = order.find((series) => isolated === null || series === isolated);
      const first = all.findIndex((point) => point.series === firstSeries);
      if (first >= 0) select(edgeOfSeries(all, first, 'first'));
    },
    { signal: ctl.signal },
  );
  svg.addEventListener(
    'blur',
    () => {
      if (lastPointer === null) clear();
    },
    { signal: ctl.signal },
  );
  svg.addEventListener(
    'keydown',
    (event) => {
      const all = measure();
      if (current < 0) return;
      let next: number;
      switch (event.key) {
        case 'ArrowRight':
          next = stepInSeries(all, current, 1);
          break;
        case 'ArrowLeft':
          next = stepInSeries(all, current, -1);
          break;
        case 'ArrowUp':
          next = switchSeries(all, current, -1, order, visible());
          break;
        case 'ArrowDown':
          next = switchSeries(all, current, 1, order, visible());
          break;
        case 'Home':
          next = edgeOfSeries(all, current, 'first');
          break;
        case 'End':
          next = edgeOfSeries(all, current, 'last');
          break;
        default:
          return;
      }
      event.preventDefault();
      select(next);
    },
    { signal: ctl.signal },
  );

  // ── legend isolation ─────────────────────────────────────────────────────
  const paintIsolation = (): void => {
    for (const element of seriesEls) {
      const id = element.getAttribute(HOOK.chartSeries);
      element.classList.toggle(DIMMED, isolated !== null && id !== isolated);
    }
    for (const toggle of toggles) {
      toggle.setAttribute('aria-pressed', isolated === null || toggleId(toggle) === isolated ? 'true' : 'false');
    }
    const point = current >= 0 ? measure()[current] : undefined;
    if (point !== undefined && isolated !== null && point.series !== isolated) {
      const replacement = nearestPoint(measure(), point.px, point.py, 'x', visible());
      if (replacement >= 0) select(replacement);
      else clear();
    }
  };
  const activateToggle = (toggle: Element): void => {
    const id = toggleId(toggle);
    if (id === '') return;
    isolated = toggleIsolation(isolated, id);
    paintIsolation();
  };
  for (const toggle of toggles) {
    const native = toggle instanceof HTMLButtonElement;
    if (!native) {
      toggle.setAttribute('role', 'button');
      if (!toggle.hasAttribute('tabindex')) toggle.setAttribute('tabindex', '0');
      toggle.addEventListener(
        'keydown',
        (event) => {
          if (!(event instanceof KeyboardEvent) || (event.key !== 'Enter' && event.key !== ' ')) return;
          event.preventDefault();
          activateToggle(toggle);
        },
        { signal: ctl.signal },
      );
    }
    toggle.addEventListener(
      'click',
      () => {
        activateToggle(toggle);
      },
      { signal: ctl.signal },
    );
  }
  paintIsolation();

  // Layout changes (resize, depth) can move the points; re-measure on next use.
  window.addEventListener(
    'resize',
    () => {
      points = null;
    },
    { signal: ctl.signal, passive: true },
  );
}
