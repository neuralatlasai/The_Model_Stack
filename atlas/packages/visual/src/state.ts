/**
 * Live-instrument states (VISUAL_GRAMMAR §6; core `FigureStateSchema`).
 *
 * A rail figure may carry scroll-driven `states`. The web client applies a
 * state by (1) lighting the parts named in `highlight` and (2) recomputing every
 * formula-driven number with the state's `variables` on top of the figure's
 * defaults. This module is the pure, DOM-free half of step (2): given a spec and
 * overrides it returns the value, formatted text, and (where a width or a
 * position depends on it) a 0..1 fraction for every keyed quantity.
 *
 * Browser-safe entry point `@atlas/visual/state`: this module and its imports
 * (`figure-math.ts`, `chart.ts`) depend on `@atlas/core` only — never on elkjs
 * or Preact — so the client bundle stays small.
 *
 * Keys (the `data-vg-value` / `data-vg-key` vocabulary of the renderers):
 *
 *   stat-panel    row key                         (formula rows only)
 *   memory-stack  "<bar label>/<segment label>"   segment value; frac = share of the scale
 *                 "<bar label>"                   bar total;     frac = share of the scale
 *                 "budget"                        budget;        frac = share of the scale
 *                 "<bar label>/<segment label>#share"   segment ÷ bar total (percent)
 *                 "<bar label>#budget"            bar total − budget ("… over budget" / "… headroom")
 *   calculator    input symbol                    frac = position of the control in its range
 *                 output symbol
 *   chart         "x"                             only when overrides carry x; frac = across the plot
 *                 series id                       y of the series at x; frac = up the plot (0 bottom)
 *
 * The memory-stack scale is the widest bar total, or the budget when larger.
 */
import { formatValue, type CalculatorSpec, type ChartSpec, type FigureSpec, type MemoryStackSpec, type StatPanelSpec, type ValueFormat } from '@atlas/core';
import { formatTick, resolveChart, seriesValueAt, unitScales } from './chart.ts';
import { evaluateCalculator, evaluateMemoryStack, formatInputValue, sliderModel, tryEvaluate, withOverrides } from './figure-math.ts';

export interface FigureStateValue {
  readonly value: number;
  /** The formatted value, exactly as the renderer prints it. */
  readonly text: string;
  readonly format: ValueFormat;
  /** 0..1: a width (memory stack), a control position (calculator input), or a plot position (chart cursor). */
  readonly frac?: number;
}

export interface FigureStateValues {
  readonly values: Record<string, FigureStateValue>;
}

/** Key of one memory-stack segment (also its `data-vg-key`). */
export function segmentKey(bar: string, segment: string): string {
  return `${bar}/${segment}`;
}

/** The key under which a budget line is exposed. */
export const BUDGET_KEY = 'budget';

/** The chart cursor's state variable. */
export const CURSOR_VARIABLE = 'x';

const clamp01 = (value: number): number => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);
const round4 = (value: number): number => Math.round(value * 1e4) / 1e4;

function entry(value: number, text: string, format: ValueFormat, frac?: number): FigureStateValue {
  return frac === undefined ? { value, text, format } : { value, text, format, frac: round4(clamp01(frac)) };
}

function statPanel(spec: StatPanelSpec, overrides: Readonly<Record<string, number>> | null, out: Record<string, FigureStateValue>): void {
  const env = withOverrides(spec.variables, overrides);
  for (const row of spec.rows) {
    if (row.formula === undefined) continue;
    const value = tryEvaluate(row.formula, env).value;
    if (value !== null) out[row.key] = entry(value, formatValue(value, row.format), row.format);
  }
}

/** Headroom text for a bar against its budget: "32 GiB over budget" or "16 GiB headroom". */
export function budgetText(total: number, budget: number, format: ValueFormat): string {
  const delta = total - budget;
  return delta > 0 ? `${formatValue(delta, format)} over budget` : `${formatValue(-delta, format)} headroom`;
}

/** Share of a bar as the renderer prints it ("12 %", "0.4 %"). */
export function shareText(part: number, whole: number): string {
  if (whole <= 0) return '—';
  const share = (part / whole) * 100;
  return `${share >= 10 || share === 0 ? share.toFixed(0) : share.toFixed(1)}\u202F%`;
}

/** The memory-stack scale: widest bar total, or the budget when larger. */
export function memoryScale(values: ReturnType<typeof evaluateMemoryStack>): number {
  return values.max > 0 ? values.max : 1;
}

function memoryStack(spec: MemoryStackSpec, overrides: Readonly<Record<string, number>> | null, out: Record<string, FigureStateValue>): void {
  const values = evaluateMemoryStack(spec, overrides);
  const scale = memoryScale(values);
  const budget = values.budget?.value ?? null;
  for (const bar of values.bars) {
    for (const segment of bar.segments) {
      if (segment.value === null) continue;
      const key = segmentKey(bar.label, segment.label);
      out[key] = entry(segment.value, formatValue(segment.value, spec.format), spec.format, Math.max(0, segment.value) / scale);
      out[`${key}#share`] = entry(bar.total > 0 ? segment.value / bar.total : 0, shareText(segment.value, bar.total), 'percent');
    }
    out[bar.label] = entry(bar.total, formatValue(bar.total, spec.format), spec.format, bar.total / scale);
    if (budget !== null) out[`${bar.label}#budget`] = entry(bar.total - budget, budgetText(bar.total, budget, spec.format), spec.format);
  }
  if (budget !== null) out[BUDGET_KEY] = entry(budget, formatValue(budget, spec.format), spec.format, budget / scale);
}

function calculator(spec: CalculatorSpec, overrides: Readonly<Record<string, number>> | null, out: Record<string, FigureStateValue>): void {
  const inputs: Record<string, number> = {};
  for (const input of spec.inputs) {
    const given = overrides !== null && Object.hasOwn(overrides, input.symbol) ? overrides[input.symbol] : undefined;
    const value = given !== undefined && Number.isFinite(given) ? given : input.default;
    inputs[input.symbol] = value;
    const model = sliderModel(input);
    const span = model.max - model.min;
    const frac = span > 0 ? (model.toPosition(value) - model.min) / span : 0;
    out[input.symbol] = entry(value, formatInputValue(value, input.format), input.format, frac);
  }
  for (const output of evaluateCalculator(spec, inputs)) {
    if (output.value !== null) out[output.symbol] = entry(output.value, formatValue(output.value, output.format), output.format);
  }
}

/** Chart cursor values: `x` and every series' y at x (empty unless the overrides carry `x`). */
export function chartCursorValues(spec: ChartSpec, overrides: Readonly<Record<string, number>> | null): Record<string, FigureStateValue> {
  const out: Record<string, FigureStateValue> = {};
  chart(spec, overrides, out);
  return out;
}

function chart(spec: ChartSpec, overrides: Readonly<Record<string, number>> | null, out: Record<string, FigureStateValue>): void {
  const x = overrides === null ? undefined : overrides[CURSOR_VARIABLE];
  if (x === undefined || !Number.isFinite(x)) return;
  const resolved = resolveChart(spec, overrides);
  const unit = unitScales(spec, resolved);
  const xText = spec.type === 'bar' ? (spec.categories?.[Math.round(x)] ?? formatValue(x, 'raw')) : formatTick(x, spec.x.format, spec.x.scale);
  out[CURSOR_VARIABLE] = entry(x, xText, spec.x.format, unit.x(x));
  for (const series of resolved.series) {
    const y = seriesValueAt(spec, series, x, overrides);
    if (y === null || !Number.isFinite(y)) continue;
    out[series.id] = entry(y, formatValue(y, spec.y.format), spec.y.format, unit.y(y));
  }
}

/**
 * Every formula-driven value of `spec` with `overrides` merged over the
 * defaults (spec variables, calculator input defaults). Values that cannot be
 * computed are omitted. Pure and deterministic; safe on server and client.
 */
export function evaluateFigureState(spec: FigureSpec, overrides: Readonly<Record<string, number>> | null): FigureStateValues {
  const values: Record<string, FigureStateValue> = {};
  switch (spec.kind) {
    case 'stat-panel':
      statPanel(spec.spec, overrides, values);
      break;
    case 'memory-stack':
      memoryStack(spec.spec, overrides, values);
      break;
    case 'calculator':
      calculator(spec.spec, overrides, values);
      break;
    case 'chart':
      chart(spec.spec, overrides, values);
      break;
    default:
      break;
  }
  return { values };
}

/** One authored state with its values precomputed (the `data-states` payload). */
export interface ResolvedFigureState {
  readonly anchor: string;
  readonly label: string | null;
  readonly note: string | null;
  readonly highlight: readonly string[];
  readonly variables: Readonly<Record<string, number>>;
  readonly values: Record<string, FigureStateValue>;
}

/** The figure's states with values resolved, in authored order (empty when the figure has none). */
export function resolveFigureStates(spec: FigureSpec): ResolvedFigureState[] {
  return spec.states.map((state) => ({
    anchor: state.anchor,
    label: state.label ?? null,
    note: state.note ?? null,
    highlight: state.highlight,
    variables: state.variables ?? {},
    values: evaluateFigureState(spec, state.variables ?? null).values,
  }));
}
