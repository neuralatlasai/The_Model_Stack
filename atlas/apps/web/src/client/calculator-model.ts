/**
 * Calculator state logic for the Calculator island (UI_UX §16: numerical
 * examples are executable; results update immediately). Formulas are
 * compiled once per figure with core `compileFormula` (a safe Pratt parser,
 * no eval) and evaluated in declared order, so an output may read earlier
 * outputs (VISUAL_GRAMMAR §5.5). Nothing here throws: bad input is clamped or
 * ignored, and a formula that fails yields `value: null` rendered as "—".
 * Pure; unit-tested.
 */
import { compileFormula, formatValue, type CalculatorSpec, type CompiledFormula, type ValueFormat } from '@atlas/core';

type Input = CalculatorSpec['inputs'][number];

export interface OutputResult {
  readonly symbol: string;
  readonly label: string;
  readonly format: ValueFormat;
  readonly emphasis: boolean;
  readonly value: number | null;
  /** Formatted with core `formatValue` (deterministic, locale-free); "—" when undefined. */
  readonly text: string;
  readonly error: string | null;
}

export interface CalculatorModel {
  readonly defaults: Readonly<Record<string, number>>;
  /** Clamps a proposed value into the input's domain (nearest option; power of two on log2 scales). Null when unusable. */
  normalise(symbol: string, value: number): number | null;
  /** Outputs in declared order. */
  evaluate(values: Readonly<Record<string, number>>): readonly OutputResult[];
  isAtDefaults(values: Readonly<Record<string, number>>): boolean;
}

type Compiled = { readonly ok: true; readonly formula: CompiledFormula } | { readonly ok: false; readonly error: string };

export function createCalculatorModel(spec: CalculatorSpec): CalculatorModel {
  const inputs = new Map<string, Input>(spec.inputs.map((input) => [input.symbol, input]));
  const defaults: Record<string, number> = {};
  for (const input of spec.inputs) defaults[input.symbol] = input.default;

  // Memoised compilation: once per model, not per keystroke.
  const compiled: readonly Compiled[] = spec.outputs.map((output) => {
    try {
      return { ok: true, formula: compileFormula(output.formula) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'invalid formula' };
    }
  });

  const normalise = (symbol: string, value: number): number | null => {
    const input = inputs.get(symbol);
    if (input === undefined || !Number.isFinite(value)) return null;
    return clampInput(input, value);
  };

  return {
    defaults,
    normalise,
    evaluate: (values) => {
      const env: Record<string, number> = {};
      for (const input of spec.inputs) {
        const given = Object.hasOwn(values, input.symbol) ? values[input.symbol] : undefined;
        env[input.symbol] = given !== undefined && Number.isFinite(given) ? clampInput(input, given) : input.default;
      }
      return spec.outputs.map((output, index): OutputResult => {
        const entry = compiled[index];
        let value: number | null = null;
        let error: string | null = null;
        if (!entry?.ok) {
          error = entry?.ok === false ? entry.error : 'missing formula';
        } else {
          try {
            value = entry.formula.evaluate(env);
            env[output.symbol] = value;
          } catch (caught) {
            error = caught instanceof Error ? caught.message : 'evaluation failed';
          }
        }
        return {
          symbol: output.symbol,
          label: output.label,
          format: output.format,
          emphasis: output.emphasis,
          value,
          text: value === null ? '—' : formatValue(value, output.format),
          error,
        };
      });
    },
    isAtDefaults: (values) => spec.inputs.every((input) => (Object.hasOwn(values, input.symbol) ? values[input.symbol] : input.default) === input.default),
  };
}

/** Domain of one input: options snap to the nearest option; log2 snaps to a power of two; everything clamps to [min, max]. */
export function clampInput(input: Input, value: number): number {
  const options = input.options;
  if (options !== undefined && options.length > 0) {
    let best = options[0] ?? input.default;
    for (const option of options) if (Math.abs(option - value) < Math.abs(best - value)) best = option;
    return best;
  }
  const clamped = Math.min(input.max, Math.max(input.min, value));
  if (input.scale === 'log2' && input.min > 0) {
    const lo = Math.ceil(Math.log2(input.min) - 1e-9);
    const hi = Math.max(lo, Math.floor(Math.log2(input.max) + 1e-9));
    const exponent = Math.min(hi, Math.max(lo, Math.round(Math.log2(clamped))));
    return 2 ** exponent;
  }
  return clamped;
}
