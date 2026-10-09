/** Bounded, legal input settings evaluated by the calculator's existing model. */
import type { CalculatorSpec, ChartSpec } from '@atlas/core';
import { sliderModel } from '@atlas/visual';
import type { CalculatorModel } from './calculator-model.ts';

const MAX_SAMPLES = 41;
const COUNT_FORMATS = new Set(['integer', 'tokens', 'params']);

export function sweepSettings(input: CalculatorSpec['inputs'][number]): readonly number[] {
  if (input.options !== undefined) return input.options;
  const slider = sliderModel(input);
  const steps = Math.max(0, Math.floor((slider.max - slider.min) / slider.step + 1e-8));
  if (!Number.isFinite(steps)) return [input.default];
  const count = Math.min(MAX_SAMPLES, steps + 1);
  const values = new Set<number>();
  for (let i = 0; i < count; i += 1) {
    const step = count < 2 ? 0 : Math.round((i * steps) / (count - 1));
    values.add(slider.toValue(slider.min + step * slider.step));
  }
  return [...values];
}

export interface CalculatorSweep {
  readonly chart: ChartSpec;
  readonly omitted: number;
  readonly current: number | null;
}

export function calculatorSweep(
  spec: CalculatorSpec,
  model: CalculatorModel,
  values: Readonly<Record<string, number>>,
  inputSymbol: string,
  outputSymbol: string,
): CalculatorSweep | null {
  const input = spec.inputs.find((item) => item.symbol === inputSymbol);
  const output = spec.outputs.find((item) => item.symbol === outputSymbol);
  if (input === undefined || output === undefined) return null;
  const settings = sweepSettings(input);
  const currentX = model.normalise(input.symbol, values[input.symbol] ?? input.default) ?? input.default;
  const xs = [...new Set([...settings, currentX])].sort((a, b) => a - b);
  let omitted = 0;
  const evaluate = (base: Readonly<Record<string, number>>): [number, number][] => {
    const points: [number, number][] = [];
    for (const x of xs) {
      const result = model.evaluate({ ...base, [input.symbol]: x }).find((item) => item.symbol === output.symbol);
      if (result?.value === null || result?.value === undefined || !Number.isFinite(result.value)) {
        omitted += 1;
        continue;
      }
      points.push([x, result.value]);
    }
    return points;
  };
  const baseline = evaluate(model.defaults);
  const selected = evaluate(values);
  const current = model.evaluate(values).find((item) => item.symbol === output.symbol)?.value ?? null;
  // Discrete inputs and undefined interior samples must not acquire invented connecting trajectories.
  const discrete = input.options !== undefined || input.scale === 'log2' || COUNT_FORMATS.has(input.format);
  const chart: ChartSpec = {
    type: discrete || omitted > 0 ? 'scatter' : 'line',
    x: { label: input.label, scale: input.scale, format: input.format, domain: [input.min, input.max] },
    y: { label: output.label, scale: 'linear', format: output.format },
    variables: {},
    series: [
      { id: 'defaults', label: 'Other controls at defaults', points: baseline, emphasis: false, dashed: true },
      { id: 'selected', label: 'Other controls as selected', points: selected, emphasis: true, dashed: false },
      {
        id: 'current',
        label: 'Current setting',
        points: current === null ? [] : [[currentX, current]],
        emphasis: false,
        dashed: false,
      },
    ],
    annotations: [],
  };
  return { chart, omitted, current };
}
