/**
 * Static chart (VISUAL_GRAMMAR §5.10, UI_UX §42): line, step, scatter, area,
 * bar on linear / log2 / log10 axes with deterministic nice ticks and
 * formatted tick labels. No animation of data. Anatomy:
 *
 *   y label (top left) · annotation flags (top band, collision-free rows)
 *   horizontal hairline grid at y ticks, dotted verticals at x ticks, x axis rule
 *   series: line + end dot + direct end label (leader when displaced)
 *   x label (bottom right) · legend buttons (series isolation, client)
 *
 * Every data point is a `<circle class="vg-pt" data-series data-x data-y
 * data-xv data-yv>`, invisible until hovered, so the client can add
 * exact-value hover and legend isolation. Series are distinguished by dash
 * pattern and direct labels as well as colour.
 *
 * Live-instrument cursor (state variable `x`): the plot group
 * `<g class="vg-plotarea" data-vg-key="x" data-vg-frac="x">` carries the
 * cursor's x as `--vg-frac` (0..1 across the plot); each series group
 * `<g data-vg-key="<id>" data-vg-frac="<id>">` carries its y at that x as
 * `--vg-frac` (0 bottom .. 1 top). `<g class="vg-cursor" data-vg-cursor>` is
 * the vertical rule, shown with `is-on`; values are `data-vg-value="x"` and
 * `data-vg-value="<id>"`. The scales are on the <svg>: `data-x-scale`,
 * `data-x-domain="d0,d1"`, `data-x-range="px0,px1"`, and the same for y
 * (`data-y-range` runs bottom → top), plus `data-plot="x y w h"`.
 */
import type { JSX } from 'preact';
import { formatValue, type ChartSpec, type FigurePlacement } from '@atlas/core';
import { chartIncludesZero, formatTick, makeScale, resolveChart, type Point2, type ResolvedSeries, type Scale } from '../chart.ts';
import { chartCursorValues, CURSOR_VARIABLE } from '../state.ts';
import { textWidth, wrapText } from '../text-metrics.ts';
import { cls, fracStyle, hashId, litClass, NO_STATE, r1, widthClass, type StateView } from './util.ts';

const SIZES: Readonly<Record<FigurePlacement, { readonly w: number; readonly h: number }>> = {
  rail: { w: 320, h: 236 },
  inline: { w: 640, h: 360 },
  wide: { w: 900, h: 420 },
};
const TICK_FONT = 10.5;
const LABEL_FONT = 11.5;
const ANNOT_FONT = 10.5;
const ANNOT_ROW = 14;
const MAX_POINTS = 64;
const LOG_NAME = { linear: '', log2: 'log₂', log10: 'log₁₀' } as const;

function thin<T>(items: readonly T[], max: number): T[] {
  if (items.length <= max) return [...items];
  const out: T[] = [];
  for (let k = 0; k < max; k += 1) {
    const item = items[Math.round((k * (items.length - 1)) / (max - 1))];
    if (item !== undefined) out.push(item);
  }
  return out;
}

function styleClass(series: ResolvedSeries, index: number): string {
  return cls('vg-series', series.emphasis ? 'vg-series--emph' : `vg-series--${index % 4}`, series.dashed && 'vg-series--dashed');
}

function scaleAttrs(scale: Scale): { domain: string; range: string } {
  return { domain: `${scale.domain[0]},${scale.domain[1]}`, range: `${r1(scale.range[0])},${r1(scale.range[1])}` };
}

export interface ChartViewProps {
  readonly spec: ChartSpec;
  readonly title: string;
  readonly desc: string;
  readonly idPrefix?: string;
  readonly placement?: FigurePlacement;
  /** Live-instrument state: lit series, variable overrides, and the cursor variable `x`. */
  readonly state?: StateView;
}

export function ChartView({ spec, title, desc, idPrefix, placement = 'inline', state = NO_STATE }: ChartViewProps): JSX.Element {
  const prefix = idPrefix ?? `vg-ch-${hashId(`${title}|${spec.series.map((series) => series.id).join(',')}`)}`;
  const resolved = resolveChart(spec, state.overrides);
  const { w, h } = SIZES[placement];
  const isBar = spec.type === 'bar';
  const includeZero = chartIncludesZero(spec);
  const rail = placement === 'rail';

  // ── margins ────────────────────────────────────────────────────────────────
  const yProbe = makeScale(spec.y.scale, resolved.yExtent, [0, 1], { domain: spec.y.domain, ticks: spec.y.ticks, includeZero });
  const yLabels = yProbe.ticks.map((tick) => formatTick(tick, spec.y.format, spec.y.scale));
  const left = Math.ceil(Math.max(20, ...yLabels.map((label) => textWidth(label, TICK_FONT, 'mono'))) + 10);
  const lineSeries = resolved.series.filter((series) => series.points.length > 0);
  const directLabels = !rail && !isBar && spec.type !== 'scatter';
  const labelRoom = directLabels ? Math.min(168, Math.ceil(Math.max(0, ...lineSeries.map((series) => textWidth(series.label, LABEL_FONT, 'sans')))) + 18) : 0;
  const right = Math.max(rail ? 12 : 18, labelRoom);

  // Annotation flags: rows assigned left to right so no two labels overlap.
  const xProbe = makeScale(spec.x.scale, resolved.xExtent, [left, w - right], { domain: spec.x.domain, ticks: spec.x.ticks });
  const flags: { index: number; x: number; row: number; anchor: 'start' | 'middle' | 'end'; from: number; to: number }[] = [];
  if (!isBar) {
    const rowsEnd: number[] = [];
    const sorted = spec.annotations.map((annotation, index) => ({ index, x: xProbe.map(annotation.x) })).sort((a, b) => a.x - b.x);
    for (const { index, x } of sorted) {
      if (!(x >= left - 0.5 && x <= w - right + 0.5)) continue;
      const width = textWidth(spec.annotations[index]?.label ?? '', ANNOT_FONT, 'mono');
      const anchor = x - width / 2 < 2 ? 'start' : x + width / 2 > w - 2 ? 'end' : 'middle';
      const from = anchor === 'start' ? x - 3 : anchor === 'end' ? x - width : x - width / 2;
      const to = from + width + 3;
      let row = rowsEnd.findIndex((end) => end + 8 <= from);
      if (row < 0) {
        row = rowsEnd.length;
        rowsEnd.push(to);
      } else {
        rowsEnd[row] = to;
      }
      flags.push({ index, x, row, anchor, from, to });
    }
  }
  const flagRows = flags.length === 0 ? 0 : Math.max(...flags.map((flag) => flag.row)) + 1;
  const top = 26 + flagRows * ANNOT_ROW;
  const bottom = 40;
  const x0 = left;
  const x1 = w - right;
  const y0 = top;
  const y1 = h - bottom;

  const yScale = makeScale(spec.y.scale, resolved.yExtent, [y1, y0], { domain: spec.y.domain, ticks: spec.y.ticks, includeZero });
  const categories = spec.categories ?? [];
  const band = isBar ? (x1 - x0) / Math.max(1, categories.length) : 0;
  const xScale = makeScale(spec.x.scale, resolved.xExtent, [x0, x1], { domain: spec.x.domain, ticks: spec.x.ticks });
  const px = (x: number): number => (isBar ? x0 + band * (x + 0.5) : xScale.map(x));
  const py = (y: number): number => yScale.map(y);
  const baseline = spec.y.scale === 'linear' ? py(Math.max(Math.min(0, yScale.domain[1]), yScale.domain[0])) : y1;

  // X tick labels, thinned so they never collide.
  const xTicks: { x: number; label: string }[] = isBar
    ? categories.map((category, index) => ({ x: px(index), label: wrapText(category, band - 4, TICK_FONT, 'sans', 1)[0] ?? category }))
    : xScale.ticks.map((tick) => ({ x: px(tick), label: formatTick(tick, spec.x.format, spec.x.scale) }));
  const widest = Math.max(1, ...xTicks.map((tick) => textWidth(tick.label, TICK_FONT, isBar ? 'sans' : 'mono')));
  const stride = Math.max(1, Math.ceil((widest + 10) / Math.max(1, (x1 - x0) / Math.max(1, xTicks.length))));
  const shownX = xTicks.filter((_, index) => index % stride === 0);

  const seriesCount = Math.max(1, resolved.series.length);
  const groupWidth = band * 0.7;
  const barWidth = groupWidth / seriesCount;

  const pathFor = (points: readonly Point2[]): string => {
    if (points.length === 0) return '';
    const mapped = points.map(([x, y]) => [r1(px(x)), r1(py(y))] as const);
    const [first] = mapped;
    if (first === undefined) return '';
    let d = `M${first[0]} ${first[1]}`;
    for (let k = 1; k < mapped.length; k += 1) {
      const point = mapped[k];
      if (point === undefined) continue;
      d += spec.type === 'step' ? ` H${point[0]} V${point[1]}` : ` L${point[0]} ${point[1]}`;
    }
    if (spec.type === 'area') {
      const last = mapped[mapped.length - 1];
      if (last !== undefined) d += ` L${last[0]} ${r1(baseline)} L${first[0]} ${r1(baseline)} Z`;
    }
    return d;
  };

  // Direct end labels, pushed apart vertically; a leader joins a displaced label to its line end.
  const ends = directLabels
    ? lineSeries
        .map((series) => {
          const last = series.points[series.points.length - 1];
          return last === undefined ? null : { series, x: px(last[0]), anchorY: py(last[1]), y: py(last[1]) };
        })
        .filter((entry): entry is { series: ResolvedSeries; x: number; anchorY: number; y: number } => entry !== null)
        .sort((a, b) => a.y - b.y)
    : [];
  for (let k = 1; k < ends.length; k += 1) {
    const prev = ends[k - 1];
    const cur = ends[k];
    if (prev !== undefined && cur !== undefined && cur.y < prev.y + 14) cur.y = prev.y + 14;
  }
  const overflow = (ends.at(-1)?.y ?? 0) - (y1 - 4);
  if (overflow > 0) for (const end of ends) end.y -= overflow;
  const endOf = new Map(ends.map((end) => [end.series.id, end]));

  // Live-instrument cursor at the initial state's x.
  const cursorX = state.overrides?.[CURSOR_VARIABLE];
  const cursorOn = cursorX !== undefined && Number.isFinite(cursorX);
  const cursorValues = cursorOn ? chartCursorValues(spec, state.overrides) : {};
  const indexOf = new Map(resolved.series.map((series, index) => [series.id, index]));
  const plot = { x: r1(x0), y: r1(y0), w: r1(x1 - x0), h: r1(y1 - y0) };
  const xAttrs = scaleAttrs(isBar ? { ...xScale, range: [x0 + band / 2, x1 - band / 2] } : xScale);
  const yAttrs = scaleAttrs(yScale);

  return (
    <div class={cls('vg-chart', `vg-chart--${spec.type}`, `vg-chart--${placement}`)}>
      <svg
        class={`vg-svg vg-chart__svg ${widthClass(w)}`}
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        role="img"
        aria-labelledby={`${prefix}-title ${prefix}-desc`}
        data-chart-type={spec.type}
        data-x-scale={isBar ? 'band' : spec.x.scale}
        data-x-domain={xAttrs.domain}
        data-x-range={xAttrs.range}
        data-y-scale={spec.y.scale}
        data-y-domain={yAttrs.domain}
        data-y-range={yAttrs.range}
        data-x-format={spec.x.format}
        data-y-format={spec.y.format}
        data-plot={`${plot.x} ${plot.y} ${plot.w} ${plot.h}`}
      >
        <title id={`${prefix}-title`}>{title}</title>
        <desc id={`${prefix}-desc`}>{desc}</desc>
        <defs>
          <clipPath id={`${prefix}-clip`}>
            <rect x={x0 - 3} y={y0 - 3} width={x1 - x0 + 6} height={y1 - y0 + 6} />
          </clipPath>
        </defs>
        <text class="vg-axis-label vg-axis-label--y" x="0" y="11">
          {spec.y.label}
          {spec.y.scale !== 'linear' && <tspan class="vg-axis-scale">{` · ${LOG_NAME[spec.y.scale]}`}</tspan>}
        </text>
        <g class="vg-grid">
          {yScale.ticks.map((tick) => (
            <line class="vg-gridline" x1={x0} y1={r1(py(tick))} x2={x1} y2={r1(py(tick))} key={`g${tick}`} />
          ))}
          {!isBar &&
            shownX.map((tick) => (tick.x > x0 + 0.5 && tick.x < x1 - 0.5 ? <line class="vg-gridline vg-gridline--x" x1={r1(tick.x)} y1={y0} x2={r1(tick.x)} y2={y1} key={`gx${tick.x}`} /> : null))}
        </g>
        <line class="vg-axis" x1={x0} y1={r1(baseline)} x2={x1} y2={r1(baseline)} />
        {yScale.ticks.map((tick) => (
          <text class="vg-tick" x={x0 - 7} y={r1(py(tick))} text-anchor="end" dominant-baseline="central" key={`y${tick}`}>
            {formatTick(tick, spec.y.format, spec.y.scale)}
          </text>
        ))}
        {shownX.map((tick) => (
          <g key={`x${tick.x}`}>
            <line class="vg-axis" x1={r1(tick.x)} y1={y1} x2={r1(tick.x)} y2={y1 + 4} />
            <text class={cls('vg-tick', isBar && 'vg-tick--category')} x={r1(tick.x)} y={y1 + 16} text-anchor="middle">
              {tick.label}
            </text>
          </g>
        ))}
        <text class="vg-axis-label vg-axis-label--x" x={x1} y={h - 5} text-anchor="end">
          {spec.x.label}
          {spec.x.scale !== 'linear' && !isBar && <tspan class="vg-axis-scale">{` · ${LOG_NAME[spec.x.scale]}`}</tspan>}
          <tspan class="vg-axis-scale">{' →'}</tspan>
        </text>

        {flags.map((flag) => {
          const annotation = spec.annotations[flag.index];
          if (annotation === undefined) return null;
          const ty = y0 - 7 - (flagRows - 1 - flag.row) * ANNOT_ROW;
          return (
            <g class="vg-annot" key={`a${flag.index}`}>
              <line class="vg-annot__rule" x1={r1(flag.x)} y1={r1(ty + 3)} x2={r1(flag.x)} y2={y1} />
              {annotation.y !== undefined && <circle class="vg-annot__dot" cx={r1(flag.x)} cy={r1(py(annotation.y))} r="3" />}
              <text class="vg-annot__label" x={r1(flag.anchor === 'start' ? flag.x - 3 : flag.anchor === 'end' ? flag.x + 3 : flag.x)} y={r1(ty)} text-anchor={flag.anchor}>
                {annotation.label}
              </text>
            </g>
          );
        })}

        <g class={cls('vg-plotarea', cursorOn && 'is-cursor')} data-vg-key={CURSOR_VARIABLE} data-vg-frac={CURSOR_VARIABLE} style={fracStyle(cursorValues[CURSOR_VARIABLE]?.frac ?? 0)}>
          <g class={cls('vg-cursor', cursorOn && 'is-on')} data-vg-cursor>
            <svg class="vg-cursor__frame" x={plot.x} y={plot.y} width={plot.w} height={plot.h} overflow="visible">
              <g class="vg-cursor__x">
                <line class="vg-cursor__rule" x1="0" y1="0" x2="0" y2={plot.h} />
                <text class="vg-cursor__xlabel" x="0" y="-6" text-anchor="middle" data-vg-value={CURSOR_VARIABLE}>
                  {cursorValues[CURSOR_VARIABLE]?.text ?? ''}
                </text>
              </g>
            </svg>
          </g>
          {resolved.series.map((series, index) => {
            const end = endOf.get(series.id);
            const last = series.points[series.points.length - 1];
            const value = cursorValues[series.id];
            return (
              <g
                class={cls('vg-series-g', styleClass(series, index), litClass(state, series.id))}
                data-vg-key={series.id}
                data-vg-frac={series.id}
                style={fracStyle(value?.frac ?? 0)}
                key={series.id}
              >
                {isBar ? (
                  <g clip-path={`url(#${prefix}-clip)`}>
                    {series.points.map(([category, v]) => {
                      const bx = x0 + band * category + (band - groupWidth) / 2 + barWidth * index;
                      const barTop = Math.min(py(v), baseline);
                      const height = Math.abs(baseline - py(v));
                      return <rect class="vg-bar" x={r1(bx + 0.5)} y={r1(barTop)} width={r1(Math.max(1, barWidth - 1.5))} height={r1(height)} key={category} />;
                    })}
                  </g>
                ) : (
                  <g clip-path={`url(#${prefix}-clip)`}>
                    <path class="vg-series__line" data-series={series.id} data-series-label={series.label} d={pathFor(series.points)} />
                    {last !== undefined && spec.type !== 'scatter' && <circle class="vg-series__end" cx={r1(px(last[0]))} cy={r1(py(last[1]))} r={series.emphasis ? 2.75 : 2.25} />}
                  </g>
                )}
                {end !== undefined && (
                  <>
                    {Math.abs(end.y - end.anchorY) > 3 && <path class="vg-series__leader" d={`M${r1(end.x + 3)} ${r1(end.anchorY)} L${r1(x1 + 5)} ${r1(end.y)}`} />}
                    <text class={cls('vg-series-label', series.emphasis && 'vg-series-label--emph')} x={r1(x1 + 8)} y={r1(end.y)} dominant-baseline="central">
                      {wrapText(series.label, labelRoom - 12, LABEL_FONT, 'sans', 1)[0] ?? series.label}
                    </text>
                  </>
                )}
                {!isBar && (
                  <svg class="vg-cursor__frame" x={plot.x} y={plot.y} width={plot.w} height={plot.h} overflow="visible">
                    <g class="vg-cursor__pt" data-vg-cursor-series={series.id}>
                      <circle class="vg-cursor__dot" cx="0" cy="0" r="3.5" />
                      <text class="vg-cursor__value" x="-7" y="-7" text-anchor="end" data-vg-value={series.id}>
                        {value?.text ?? ''}
                      </text>
                    </g>
                  </svg>
                )}
              </g>
            );
          })}
        </g>

        <g class="vg-points">
          {resolved.series.map((series) =>
            thin(series.points, MAX_POINTS).map(([x, y]) => (
              <circle
                class={cls('vg-pt', spec.type === 'scatter' && 'vg-pt--visible', series.emphasis && 'vg-pt--emph')}
                cx={r1(isBar ? x0 + band * x + (band - groupWidth) / 2 + barWidth * (indexOf.get(series.id) ?? 0) + barWidth / 2 : px(x))}
                cy={r1(py(y))}
                r={spec.type === 'scatter' ? 3 : 3.5}
                data-series={series.id}
                data-x={x}
                data-y={y}
                data-xv={isBar ? (categories[x] ?? String(x)) : formatValue(x, spec.x.format)}
                data-yv={formatValue(y, spec.y.format)}
                key={`${series.id}:${x}`}
              />
            )),
          )}
        </g>
      </svg>
      <div class="vg-legend" role="group" aria-label="Series">
        {resolved.series.map((series, index) => (
          <button type="button" class="vg-legend__item" data-series={series.id} aria-pressed="true" key={series.id}>
            <svg class="vg-legend__swatch" viewBox="0 0 24 8" width="24" height="8" aria-hidden="true" focusable="false">
              {isBar ? (
                <rect class={cls(styleClass(series, index), 'vg-bar')} x="6" y="0" width="12" height="8" />
              ) : (
                <line class={cls(styleClass(series, index), 'vg-series__line')} x1="0" y1="4" x2="24" y2="4" />
              )}
            </svg>
            <span>{series.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
