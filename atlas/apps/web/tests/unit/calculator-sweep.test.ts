import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CalculatorSpecSchema, ChartSpecSchema, type CalculatorSpec } from '@atlas/core';
import { createCalculatorModel } from '../../src/client/calculator-model.ts';
import { calculatorSweep, sweepSettings } from '../../src/client/calculator-sweep.ts';

const spec: CalculatorSpec = CalculatorSpecSchema.parse({
  tex: 'y=ax',
  inputs: [
    { symbol: 'x', label: 'Count', default: 5, min: 1, max: 11, step: 2, format: 'integer' },
    { symbol: 'a', label: 'Multiplier', default: 3, min: 1, max: 5, step: 0.25, format: 'fixed2' },
  ],
  outputs: [
    { symbol: 'y', label: 'Result', formula: 'a*x', format: 'fixed2', emphasis: true },
    { symbol: 'z', label: 'Derived result', formula: 'y+2', format: 'fixed2' },
  ],
});

test('sweeps use reachable integer and discrete log2 settings with bounded work', () => {
  const input = spec.inputs[0];
  assert.ok(input);
  assert.deepEqual(sweepSettings(input), [1, 3, 5, 7, 9, 11]);
  const log = { ...input, min: 1, max: 1024, scale: 'log2' as const };
  assert.deepEqual(sweepSettings(log), [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]);
  const large = sweepSettings({ ...input, min: 1, max: 10_000_001 });
  assert.ok(large.length <= 41);
  assert.ok(large.every((value) => Number.isInteger(value) && (value - 1) % 2 === 0));
});

test('baseline holds other controls at defaults and current point uses exact sequential outputs', () => {
  const model = createCalculatorModel(spec);
  const sweep = calculatorSweep(spec, model, { x: 7, a: 4 }, 'a', 'z');
  assert.ok(sweep);
  assert.equal(sweep.current, 30);
  assert.equal(sweep.chart.series[0]?.points?.find(([x]) => x === 4)?.[1], 22);
  assert.equal(sweep.chart.series[1]?.points?.find(([x]) => x === 4)?.[1], 30);
  assert.deepEqual(sweep.chart.series[2]?.points, [[4, 30]]);
  assert.equal(ChartSpecSchema.safeParse(sweep.chart).success, true);
});

test('undefined interior evaluations switch to unconnected points and report omissions', () => {
  const broken: CalculatorSpec = {
    ...spec,
    outputs: [{ symbol: 'y', label: 'Pole', formula: '1/(x-5)', format: 'fixed2', emphasis: true }],
  };
  const model = createCalculatorModel(broken);
  const sweep = calculatorSweep(broken, model, model.defaults, 'x', 'y');
  assert.ok(sweep);
  assert.equal(sweep.chart.type, 'scatter');
  assert.equal(sweep.omitted, 2);
  assert.equal(sweep.current, null);
  assert.deepEqual(sweep.chart.series[2]?.points, []);
  assert.ok(sweep.chart.series.every((series) => series.points?.every(([x, y]) => x !== 5 && Number.isFinite(y))));
});

test('unknown selectors return no plot and invalid current input cannot create NaN coordinates', () => {
  const model = createCalculatorModel(spec);
  assert.equal(calculatorSweep(spec, model, model.defaults, 'missing', 'y'), null);
  const sweep = calculatorSweep(spec, model, { x: Number.NaN, a: 3 }, 'x', 'y');
  assert.ok(sweep);
  assert.ok(sweep.chart.series.every((series) => series.points?.every((point) => point.every(Number.isFinite))));
});
