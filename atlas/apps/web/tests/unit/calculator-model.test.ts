import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { CalculatorSpecSchema, type CalculatorSpec } from '@atlas/core';
import { clampInput, createCalculatorModel } from '../../src/client/calculator-model.ts';

/** The worked example of docs/VISUAL_GRAMMAR.md §4 (Eq. 5.8), plus a derived output that reads an earlier output. */
const SPEC: CalculatorSpec = CalculatorSpecSchema.parse({
  tex: 'M_{\\text{scores}} = B\\,H\\,T^{2}\\,b',
  equation: '5.8',
  inputs: [
    { symbol: 'B', label: 'sequences', default: 1, min: 1, max: 64, scale: 'log2', format: 'integer' },
    { symbol: 'H', label: 'heads', default: 32, min: 1, max: 128, scale: 'log2', format: 'integer' },
    { symbol: 'T', label: 'sequence length', default: 8192, min: 512, max: 131072, scale: 'log2', format: 'tokens' },
    { symbol: 'b', label: 'bytes per value', default: 2, min: 1, max: 4, options: [1, 2, 4], format: 'bytes' },
  ],
  outputs: [
    { symbol: 'M', label: 'scores per layer', formula: 'B*H*T^2*b', format: 'bytes', emphasis: true },
    { symbol: 'G', label: 'in GiB', formula: 'M / 2^30', format: 'fixed2' },
  ],
  presets: [{ label: 'long context', values: { T: 131072 } }],
});

const INPUT = (symbol: string): CalculatorSpec['inputs'][number] => {
  const input = SPEC.inputs.find((candidate) => candidate.symbol === symbol);
  assert.ok(input !== undefined);
  return input;
};

describe('createCalculatorModel', () => {
  test('defaults come from the spec and evaluate to the documented 4 GiB', () => {
    const model = createCalculatorModel(SPEC);
    assert.deepEqual(model.defaults, { B: 1, H: 32, T: 8192, b: 2 });
    const [scores, gib] = model.evaluate(model.defaults);
    assert.equal(scores?.value, 4 * 2 ** 30);
    assert.equal(scores?.text, '4\u202fGiB'); // core formatValue: narrow no-break space before the unit
    assert.equal(gib?.value, 4);
    assert.equal(gib?.text, '4.00');
    assert.equal(model.isAtDefaults(model.defaults), true);
  });

  test('outputs are evaluated in declared order, so later outputs read earlier ones', () => {
    const model = createCalculatorModel(SPEC);
    const results = model.evaluate({ ...model.defaults, T: 16384 });
    assert.deepEqual(
      results.map((result) => result.symbol),
      ['M', 'G'],
    );
    assert.equal(results[1]?.value, 16);
    assert.equal(model.isAtDefaults({ ...model.defaults, T: 16384 }), false);
  });

  test('a formula that fails to compile or evaluate yields "—" and never throws', () => {
    const broken: CalculatorSpec = {
      ...SPEC,
      outputs: [
        { symbol: 'X', label: 'syntax error', formula: 'B*(H', format: 'raw', emphasis: false },
        { symbol: 'Y', label: 'unbound', formula: 'Q*2', format: 'raw', emphasis: false },
        { symbol: 'Z', label: 'non-finite', formula: 'B/0', format: 'raw', emphasis: false },
        { symbol: 'W', label: 'reads a failed output', formula: 'X+1', format: 'raw', emphasis: false },
      ],
    };
    const model = createCalculatorModel(broken);
    const results = model.evaluate(model.defaults);
    for (const result of results) {
      assert.equal(result.value, null);
      assert.equal(result.text, '—');
      assert.ok(result.error !== null && result.error !== '');
    }
  });

  test('missing or non-finite values fall back to defaults during evaluation', () => {
    const model = createCalculatorModel(SPEC);
    assert.equal(model.evaluate({ T: Number.NaN })[0]?.value, 4 * 2 ** 30);
  });
});

describe('input normalisation', () => {
  test('clamps to [min, max]', () => {
    const model = createCalculatorModel(SPEC);
    assert.equal(model.normalise('T', 10), 512);
    assert.equal(model.normalise('T', 1e9), 131072);
  });

  test('log2 inputs snap to powers of two inside the range', () => {
    assert.equal(clampInput(INPUT('H'), 40), 32);
    assert.equal(clampInput(INPUT('H'), 48), 64);
    assert.equal(clampInput(INPUT('B'), 0.3), 1);
  });

  test('options snap to the nearest option', () => {
    assert.equal(clampInput(INPUT('b'), 3.2), 4);
    assert.equal(clampInput(INPUT('b'), 1.4), 1);
  });

  test('unknown symbols and non-finite values are rejected', () => {
    const model = createCalculatorModel(SPEC);
    assert.equal(model.normalise('nope', 3), null);
    assert.equal(model.normalise('T', Number.POSITIVE_INFINITY), null);
    assert.equal(model.normalise('T', Number.NaN), null);
  });
});
