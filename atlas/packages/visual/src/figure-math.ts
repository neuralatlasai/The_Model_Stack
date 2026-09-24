/**
 * Formula evaluation for executable figures (VISUAL_GRAMMAR §4.2): calculators,
 * stat panels, memory stacks. Shared by validation (compile time), the text
 * equivalent, the static renderers, and the calculator island, so every
 * surface shows the same number for the same inputs.
 */
import {
  compileFormula,
  ExprError,
  formatParts,
  type CalculatorSpec,
  type CompiledFormula,
  type FormattedValue,
  type MemoryStackSpec,
  type NodeKind,
  type StatPanelSpec,
  type ValueFormat,
} from '@atlas/core';

export interface Evaluation {
  readonly value: number | null;
  /** Human-readable reason when `value` is null. */
  readonly error: string | null;
}

const COMPILE_CACHE_LIMIT = 512;
const compileCache = new Map<string, CompiledFormula | ExprError>();

/** Compiles a formula once (bounded cache); returns the ExprError instead of throwing. */
export function compileCached(source: string): CompiledFormula | ExprError {
  const hit = compileCache.get(source);
  if (hit !== undefined) return hit;
  let result: CompiledFormula | ExprError;
  try {
    result = compileFormula(source);
  } catch (error) {
    result = error instanceof ExprError ? error : new ExprError('syntax', String(error), -1);
  }
  if (compileCache.size >= COMPILE_CACHE_LIMIT) {
    const oldest = compileCache.keys().next();
    if (oldest.done !== true) compileCache.delete(oldest.value);
  }
  compileCache.set(source, result);
  return result;
}

/** Evaluates `source` in `env`; never throws. */
export function tryEvaluate(source: string, env: Readonly<Record<string, number>>): Evaluation {
  const compiled = compileCached(source);
  if (compiled instanceof ExprError) {
    const where = compiled.position >= 0 ? ` at ${compiled.position}` : '';
    return { value: null, error: `${compiled.message}${where}` };
  }
  const unbound = compiled.variables.filter((name) => !Object.hasOwn(env, name));
  if (unbound.length > 0) return { value: null, error: `unbound identifier${unbound.length > 1 ? 's' : ''} ${unbound.map((n) => `'${n}'`).join(', ')}` };
  try {
    return { value: compiled.evaluate(env), error: null };
  } catch (error) {
    return { value: null, error: error instanceof Error ? error.message : String(error) };
  }
}

export function formatOrDash(value: number | null, format: ValueFormat): FormattedValue {
  return value === null ? { value: '—', unit: '' } : formatParts(value, format);
}

const COUNT_FORMATS: ReadonlySet<ValueFormat> = new Set<ValueFormat>(['tokens', 'params', 'integer', 'raw', 'si']);

/**
 * Display form of a value the reader chose (a calculator input): integers below
 * one million are shown exactly (`8,192`, not `8.19 K`); everything else uses the
 * shared formatter.
 */
export function formatInputParts(value: number, format: ValueFormat): FormattedValue {
  if (COUNT_FORMATS.has(format) && Number.isInteger(value) && Math.abs(value) < 1e6) return formatParts(value, 'integer');
  return formatParts(value, format);
}

export function formatInputValue(value: number, format: ValueFormat): string {
  const parts = formatInputParts(value, format);
  return parts.unit === '' ? parts.value : parts.unit === '×' ? `${parts.value}×` : `${parts.value}\u202f${parts.unit}`;
}

// ─── calculator ───────────────────────────────────────────────────────────────

export type CalculatorInput = CalculatorSpec['inputs'][number];

export function calculatorDefaults(spec: CalculatorSpec): Record<string, number> {
  const values: Record<string, number> = {};
  for (const input of spec.inputs) values[input.symbol] = input.default;
  return values;
}

export interface CalculatorOutputValue {
  readonly symbol: string;
  readonly label: string;
  readonly format: ValueFormat;
  readonly emphasis: boolean;
  readonly value: number | null;
  readonly error: string | null;
}

/** Evaluates outputs in order; later outputs may read earlier ones (VISUAL_GRAMMAR §5.5). */
export function evaluateCalculator(spec: CalculatorSpec, inputs: Readonly<Record<string, number>>): CalculatorOutputValue[] {
  const env: Record<string, number> = {};
  for (const input of spec.inputs) {
    const given = Object.hasOwn(inputs, input.symbol) ? inputs[input.symbol] : undefined;
    env[input.symbol] = given !== undefined && Number.isFinite(given) ? given : input.default;
  }
  return spec.outputs.map((output) => {
    const result = tryEvaluate(output.formula, env);
    if (result.value !== null) env[output.symbol] = result.value;
    return { symbol: output.symbol, label: output.label, format: output.format, emphasis: output.emphasis, ...result };
  });
}

/**
 * Maps a calculator input onto a native range control. `log2` sliders move in
 * integer exponents (values are powers of two); `log10` sliders move in 1/100
 * decades; `options` become a discrete index.
 */
export interface SliderModel {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly toValue: (position: number) => number;
  readonly toPosition: (value: number) => number;
}

function significantRound(value: number, digits: number): number {
  if (value === 0) return 0;
  return Number(value.toPrecision(digits));
}

export function sliderModel(input: CalculatorInput): SliderModel {
  const options = input.options;
  if (options !== undefined) {
    return {
      min: 0,
      max: options.length - 1,
      step: 1,
      toValue: (position) => options[Math.min(options.length - 1, Math.max(0, Math.round(position)))] ?? input.default,
      toPosition: (value) => {
        let best = 0;
        options.forEach((option, index) => {
          if (Math.abs(option - value) < Math.abs((options[best] ?? option) - value)) best = index;
        });
        return best;
      },
    };
  }
  if (input.scale === 'log2' && input.min > 0 && input.max > 0) {
    const lo = Math.ceil(Math.log2(input.min) - 1e-9);
    const hi = Math.floor(Math.log2(input.max) + 1e-9);
    return {
      min: lo,
      max: Math.max(lo, hi),
      step: 1,
      toValue: (position) => 2 ** Math.round(position),
      toPosition: (value) => Math.min(Math.max(lo, hi), Math.max(lo, Math.round(Math.log2(Math.max(value, Number.MIN_VALUE))))),
    };
  }
  if (input.scale === 'log10' && input.min > 0 && input.max > 0) {
    const lo = Math.log10(input.min);
    const hi = Math.log10(input.max);
    const step = Math.max((hi - lo) / 200, 1e-6);
    return {
      min: lo,
      max: hi,
      step,
      toValue: (position) => Math.min(input.max, Math.max(input.min, significantRound(10 ** position, 3))),
      toPosition: (value) => Math.min(hi, Math.max(lo, Math.log10(Math.max(value, Number.MIN_VALUE)))),
    };
  }
  const integerFormat = input.format === 'integer' || input.format === 'tokens' || input.format === 'params';
  const step = input.step ?? (integerFormat ? Math.max(1, Math.round((input.max - input.min) / 200)) : (input.max - input.min) / 200 || 1);
  return {
    min: input.min,
    max: input.max,
    step,
    toValue: (position) => Math.min(input.max, Math.max(input.min, position)),
    toPosition: (value) => Math.min(input.max, Math.max(input.min, value)),
  };
}

// ─── stat panel ───────────────────────────────────────────────────────────────

export interface StatRowValue {
  readonly key: string;
  readonly note: string | null;
  readonly text: FormattedValue;
  readonly error: string | null;
}

/** Formula environment: the spec's variables with state overrides on top. */
export function withOverrides(variables: Readonly<Record<string, number>>, overrides: Readonly<Record<string, number>> | null | undefined): Record<string, number> {
  const env: Record<string, number> = { ...variables };
  if (overrides !== null && overrides !== undefined) {
    for (const [name, value] of Object.entries(overrides)) if (Number.isFinite(value)) env[name] = value;
  }
  return env;
}

export function evaluateStatPanel(spec: StatPanelSpec, overrides: Readonly<Record<string, number>> | null = null): StatRowValue[] {
  const env = withOverrides(spec.variables, overrides);
  return spec.rows.map((row) => {
    if (row.formula === undefined) {
      return { key: row.key, note: row.note ?? null, text: { value: row.value ?? '—', unit: '' }, error: null };
    }
    const result = tryEvaluate(row.formula, env);
    return { key: row.key, note: row.note ?? null, text: formatOrDash(result.value, row.format), error: result.error };
  });
}

// ─── memory stack ─────────────────────────────────────────────────────────────

export interface StackSegmentValue {
  readonly label: string;
  readonly kind: NodeKind;
  readonly value: number | null;
  readonly error: string | null;
}

export interface StackBarValue {
  readonly label: string;
  readonly segments: StackSegmentValue[];
  readonly total: number;
}

export interface StackValues {
  readonly bars: StackBarValue[];
  readonly budget: { readonly label: string; readonly value: number | null; readonly error: string | null } | null;
  /** Largest of the bar totals and the budget; the scale's upper end before rounding. */
  readonly max: number;
}

export function evaluateMemoryStack(spec: MemoryStackSpec, overrides: Readonly<Record<string, number>> | null = null): StackValues {
  const env = withOverrides(spec.variables, overrides);
  const bars = spec.bars.map((bar) => {
    const segments = bar.segments.map((segment): StackSegmentValue => {
      if (segment.value !== undefined) return { label: segment.label, kind: segment.kind, value: segment.value, error: null };
      const result = tryEvaluate(segment.formula ?? '', env);
      return { label: segment.label, kind: segment.kind, ...result };
    });
    const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value ?? 0), 0);
    return { label: bar.label, segments, total };
  });
  let budget: StackValues['budget'] = null;
  if (spec.budget !== undefined) {
    budget =
      spec.budget.value !== undefined
        ? { label: spec.budget.label, value: spec.budget.value, error: null }
        : { label: spec.budget.label, ...tryEvaluate(spec.budget.formula ?? '', env) };
  }
  const max = Math.max(0, ...bars.map((bar) => bar.total), budget?.value ?? 0);
  return { bars, budget, max };
}

// ─── glyph allocation ─────────────────────────────────────────────────────────

/** Largest-remainder allocation of `cells` among weights (deterministic; ties go to the earlier item). */
export function allocateCells(weights: readonly number[], cells: number): number[] {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return weights.map(() => 0);
  const exact = weights.map((weight) => (weight / total) * cells);
  const floors = exact.map((value) => Math.floor(value));
  let remaining = cells - floors.reduce((sum, value) => sum + value, 0);
  const order = exact.map((value, index) => ({ index, frac: value - Math.floor(value) })).sort((a, b) => b.frac - a.frac || a.index - b.index);
  for (const entry of order) {
    if (remaining <= 0) break;
    floors[entry.index] = (floors[entry.index] ?? 0) + 1;
    remaining -= 1;
  }
  return floors;
}
