/**
 * Chart data resolution and scales (VISUAL_GRAMMAR §5.10). Pure and
 * deterministic: tick positions are computed from the data with the classic
 * nice-number rule (linear) or integer powers (log2, log10), never from the
 * DOM, so the server render and the text equivalent agree.
 */
import { formatValue, type ChartSpec, type ValueFormat } from '@atlas/core';
import { tryEvaluate, withOverrides } from './figure-math.ts';

export type ScaleKind = 'linear' | 'log2' | 'log10';
export type Point2 = readonly [number, number];

const clean = (value: number): number => Number(value.toPrecision(12));

function niceStep(span: number, count: number): number {
  const raw = span / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalised = raw / magnitude;
  const nice = normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10;
  return nice * magnitude;
}

/** Nice linear ticks covering [min, max] (the first ≤ min, the last ≥ max). */
export function niceLinearTicks(min: number, max: number, count = 5): number[] {
  let lo = min;
  let hi = max;
  if (!(Number.isFinite(lo) && Number.isFinite(hi))) return [0, 1];
  if (lo === hi) {
    const pad = lo === 0 ? 1 : Math.abs(lo) * 0.1;
    lo -= pad;
    hi += pad;
  }
  if (lo > hi) [lo, hi] = [hi, lo];
  const step = niceStep(hi - lo, count);
  const start = Math.floor(lo / step + 1e-9) * step;
  const end = Math.ceil(hi / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let i = 0; i <= 64; i += 1) {
    const tick = clean(start + i * step);
    if (tick > end + step * 1e-9) break;
    ticks.push(tick);
  }
  return ticks;
}

/** Integer-power ticks for a log axis covering [min, max]; thinned to ≤ 9 ticks. */
export function logTicks(min: number, max: number, base: 2 | 10): number[] {
  const log = base === 2 ? Math.log2 : Math.log10;
  const lo = Math.floor(log(Math.max(min, Number.MIN_VALUE)) + 1e-9);
  const hi = Math.ceil(log(Math.max(max, Number.MIN_VALUE)) - 1e-9);
  const top = Math.max(hi, lo + 1);
  const count = top - lo + 1;
  const stride = Math.ceil(count / 9);
  const ticks: number[] = [];
  for (let k = lo; k <= top; k += 1) {
    if ((k - lo) % stride === 0) ticks.push(clean(base ** k));
  }
  if (base === 10 && top - lo <= 1) {
    const extra: number[] = [];
    for (let k = lo; k < top; k += 1) extra.push(clean(2 * 10 ** k), clean(5 * 10 ** k));
    return [...ticks, ...extra].sort((a, b) => a - b);
  }
  return ticks;
}

export interface Scale {
  readonly kind: ScaleKind;
  readonly domain: readonly [number, number];
  readonly range: readonly [number, number];
  readonly ticks: readonly number[];
  readonly map: (value: number) => number;
}

function transform(kind: ScaleKind, value: number): number {
  if (kind === 'log2') return Math.log2(value);
  if (kind === 'log10') return Math.log10(value);
  return value;
}

/**
 * Builds a scale over data extent [lo, hi]. An explicit domain is used as-is
 * (ticks filtered to it); otherwise the domain snaps to the outer ticks.
 */
export function makeScale(
  kind: ScaleKind,
  extent: readonly [number, number],
  range: readonly [number, number],
  options: { readonly domain?: readonly [number, number] | undefined; readonly ticks?: readonly number[] | undefined; readonly includeZero?: boolean } = {},
): Scale {
  let [lo, hi] = extent;
  if (options.includeZero === true && kind === 'linear') {
    lo = Math.min(lo, 0);
    hi = Math.max(hi, 0);
  }
  let domain: [number, number];
  let ticks: number[];
  if (kind === 'linear') {
    const auto = niceLinearTicks(options.domain?.[0] ?? lo, options.domain?.[1] ?? hi);
    domain = options.domain !== undefined ? [options.domain[0], options.domain[1]] : [auto[0] ?? lo, auto.at(-1) ?? hi];
    ticks = auto;
  } else {
    const positiveLo = lo > 0 ? lo : 1;
    const positiveHi = hi > 0 ? hi : positiveLo * 2;
    const auto = logTicks(options.domain?.[0] ?? positiveLo, options.domain?.[1] ?? positiveHi, kind === 'log2' ? 2 : 10);
    domain = options.domain !== undefined ? [options.domain[0], options.domain[1]] : [auto[0] ?? positiveLo, auto.at(-1) ?? positiveHi];
    ticks = auto;
  }
  if (options.ticks !== undefined && options.ticks.length > 0) ticks = [...options.ticks];
  const [d0, d1] = domain;
  const eps = Math.abs(d1 - d0) * 1e-9;
  ticks = ticks.filter((tick) => tick >= Math.min(d0, d1) - eps && tick <= Math.max(d0, d1) + eps && (kind === 'linear' || tick > 0));
  const t0 = transform(kind, d0);
  const t1 = transform(kind, d1);
  const span = t1 - t0 === 0 ? 1 : t1 - t0;
  const [r0, r1] = range;
  return {
    kind,
    domain: [d0, d1],
    range,
    ticks,
    map: (value) => r0 + ((transform(kind, value) - t0) / span) * (r1 - r0),
  };
}

const COUNT_FORMATS: ReadonlySet<ValueFormat> = new Set<ValueFormat>(['tokens', 'params', 'integer', 'raw', 'si']);

/**
 * Tick label. On log2 axes of counts (tokens, parameters), powers of two read
 * in the context-length convention (`8K` = 8,192, `128K` = 131,072); every
 * other tick uses the shared formatter.
 */
export function formatTick(value: number, format: ValueFormat, scale: ScaleKind): string {
  if (scale === 'log2' && COUNT_FORMATS.has(format) && value >= 1024 && Number.isInteger(Math.log2(value))) {
    const exponent = Math.log2(value);
    if (exponent >= 30) return `${2 ** (exponent - 30)}G`;
    if (exponent >= 20) return `${2 ** (exponent - 20)}M`;
    return `${2 ** (exponent - 10)}K`;
  }
  return formatValue(value, format);
}

// ─── series resolution ────────────────────────────────────────────────────────

export interface ResolvedSeries {
  readonly id: string;
  readonly label: string;
  readonly emphasis: boolean;
  readonly dashed: boolean;
  /** Points sorted by x (line/step/area/scatter), or (categoryIndex, value) for bars. */
  readonly points: readonly Point2[];
  readonly error: string | null;
}

export interface ResolvedChart {
  readonly series: readonly ResolvedSeries[];
  readonly xExtent: readonly [number, number];
  readonly yExtent: readonly [number, number];
}

/** Sample positions over [from, to]: geometric on log x axes, arithmetic otherwise. */
export function samplePositions(from: number, to: number, count: number, scale: ScaleKind): number[] {
  const n = Math.max(2, Math.floor(count));
  const out: number[] = [];
  const geometric = scale !== 'linear' && from > 0 && to > 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / (n - 1);
    const value = geometric ? from * (to / from) ** t : from + (to - from) * t;
    out.push(clean(value));
  }
  return out;
}

/** Chart formula environment: variables plus state overrides; `x` is the sampled axis and is never overridden here. */
export function chartVariables(spec: ChartSpec, overrides: Readonly<Record<string, number>> | null = null): Record<string, number> {
  const env = withOverrides(spec.variables, overrides);
  delete env['x'];
  return env;
}

/** Evaluates every series of a chart. Errors are reported per series, never thrown. */
export function resolveChart(spec: ChartSpec, overrides: Readonly<Record<string, number>> | null = null): ResolvedChart {
  const variables = chartVariables(spec, overrides);
  const series = spec.series.map((entry): ResolvedSeries => {
    const base = { id: entry.id, label: entry.label, emphasis: entry.emphasis, dashed: entry.dashed };
    if (spec.type === 'bar') {
      const values = entry.values ?? [];
      return { ...base, points: values.map((value, index): Point2 => [index, value]), error: entry.values === undefined ? 'bar series needs values' : null };
    }
    if (entry.points !== undefined) {
      const points = [...entry.points].sort((a, b) => a[0] - b[0]);
      return { ...base, points, error: null };
    }
    if (entry.formula !== undefined) {
      const range = entry.sample ?? (spec.x.domain === undefined ? undefined : { from: spec.x.domain[0], to: spec.x.domain[1], count: 32 });
      if (range === undefined) return { ...base, points: [], error: 'formula series needs sample (or an x domain)' };
      const points: Point2[] = [];
      for (const x of samplePositions(range.from, range.to, range.count, spec.x.scale)) {
        const result = tryEvaluate(entry.formula, { ...variables, x });
        if (result.value === null) return { ...base, points, error: `at x = ${x}: ${result.error ?? 'error'}` };
        points.push([x, result.value]);
      }
      return { ...base, points, error: null };
    }
    return { ...base, points: [], error: 'series has no points, values, or formula' };
  });
  const xs: number[] = [];
  const ys: number[] = [];
  for (const entry of series) {
    for (const [x, y] of entry.points) {
      xs.push(x);
      ys.push(y);
    }
  }
  for (const annotation of spec.annotations) {
    if (spec.type !== 'bar') xs.push(annotation.x);
    if (annotation.y !== undefined) ys.push(annotation.y);
  }
  const extent = (values: number[], fallback: readonly [number, number]): readonly [number, number] =>
    values.length === 0 ? fallback : [Math.min(...values), Math.max(...values)];
  const categories = spec.categories?.length ?? 0;
  return {
    series,
    xExtent: spec.type === 'bar' ? [0, Math.max(0, categories - 1)] : extent(xs, [0, 1]),
    yExtent: extent(ys, [0, 1]),
  };
}

// ─── unit scales (shared by the renderer and the state evaluator) ───────────

/** Whether the y axis of this chart type starts at zero on linear scales. */
export function chartIncludesZero(spec: ChartSpec): boolean {
  return spec.type === 'bar' || spec.type === 'area';
}

export interface UnitScales {
  /** Maps a data x to [0, 1] across the plot (bars: category centres). */
  readonly x: (value: number) => number;
  /** Maps a data y to [0, 1] from the bottom of the plot to the top. */
  readonly y: (value: number) => number;
  readonly xScale: Scale;
  readonly yScale: Scale;
}

/**
 * The chart's scales normalised to [0, 1]. The renderer maps the same domains
 * onto pixels, so a fraction from here lands exactly on the drawn geometry.
 */
export function unitScales(spec: ChartSpec, resolved: ResolvedChart): UnitScales {
  const xScale = makeScale(spec.x.scale, resolved.xExtent, [0, 1], { domain: spec.x.domain, ticks: spec.x.ticks });
  const yScale = makeScale(spec.y.scale, resolved.yExtent, [0, 1], { domain: spec.y.domain, ticks: spec.y.ticks, includeZero: chartIncludesZero(spec) });
  const categories = Math.max(1, spec.categories?.length ?? 0);
  return {
    x: spec.type === 'bar' ? (value) => (value + 0.5) / categories : (value) => xScale.map(value),
    y: (value) => yScale.map(value),
    xScale,
    yScale,
  };
}

function toAxis(kind: ScaleKind, value: number): number {
  if (kind === 'log2') return Math.log2(value);
  if (kind === 'log10') return Math.log10(value);
  return value;
}

/**
 * The y value of one series at `x`: formula series are evaluated exactly; point
 * series are interpolated in axis space (straight segments on log axes stay
 * straight); step series hold the previous value; bars read the nearest category.
 * Null outside the series' x range or when the formula fails.
 */
export function seriesValueAt(spec: ChartSpec, series: ResolvedSeries, x: number, overrides: Readonly<Record<string, number>> | null = null): number | null {
  const entry = spec.series.find((candidate) => candidate.id === series.id);
  if (spec.type === 'bar') {
    const point = series.points[Math.round(x)];
    return point === undefined ? null : point[1];
  }
  if (entry?.formula !== undefined) {
    return tryEvaluate(entry.formula, { ...chartVariables(spec, overrides), x }).value;
  }
  const points = series.points;
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined || x < first[0] || x > last[0]) return null;
  for (let k = 1; k < points.length; k += 1) {
    const a = points[k - 1];
    const b = points[k];
    if (a === undefined || b === undefined || x > b[0]) continue;
    if (spec.type === 'step') return x === b[0] ? b[1] : a[1];
    const ta = toAxis(spec.x.scale, a[0]);
    const tb = toAxis(spec.x.scale, b[0]);
    const t = tb === ta ? 0 : (toAxis(spec.x.scale, x) - ta) / (tb - ta);
    if (spec.y.scale !== 'linear' && a[1] > 0 && b[1] > 0) {
      const ya = toAxis(spec.y.scale, a[1]);
      const yb = toAxis(spec.y.scale, b[1]);
      const base = spec.y.scale === 'log2' ? 2 : 10;
      return base ** (ya + (yb - ya) * t);
    }
    return a[1] + (b[1] - a[1]) * t;
  }
  return last[1];
}
