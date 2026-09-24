import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { formatValue, type FigureSpec } from '@atlas/core';
import { evaluateFigureState, resolveFigureStates } from '../src/state.ts';
import { parseFigure } from '../src/index.ts';
import { envelope } from './fixtures.ts';

function figure(kind: string, spec: unknown, overrides: Record<string, unknown> = {}): FigureSpec {
  const parsed = parseFigure(envelope(kind, spec, 1, overrides));
  assert.deepEqual(parsed.issues, [], JSON.stringify(parsed.issues));
  assert.ok(parsed.figure !== null);
  return parsed.figure;
}

const statPanel = figure('stat-panel', {
  header: 'REFERENCE CONFIG · BF16',
  variables: { L: 12, D: 768, V: 50257 },
  rows: [
    { key: 'layers', value: '12' },
    { key: 'non-embedding params', formula: '12*L*D^2', format: 'params' },
    { key: 'embedding params', formula: 'V*D', format: 'params' },
  ],
});

const memoryStack = figure('memory-stack', {
  format: 'bytes',
  variables: { N: 7e9 },
  bars: [
    {
      label: 'per model',
      segments: [
        { label: 'BF16 weights', kind: 'tensor', formula: '2*N' },
        { label: 'BF16 gradients', kind: 'tensor', formula: '2*N' },
        { label: 'FP32 master', kind: 'memory', formula: '4*N' },
        { label: 'Adam m, v', kind: 'memory', formula: '8*N' },
      ],
    },
    { label: 'inference', segments: [{ label: 'BF16 weights', kind: 'tensor', formula: '2*N' }] },
  ],
  budget: { label: '80 GiB device', formula: '80*2^30' },
});

const calculator = figure('calculator', {
  tex: 'M = B H T^2 b',
  equation: '5.8',
  inputs: [
    { symbol: 'B', label: 'sequences', default: 1, min: 1, max: 64, scale: 'log2', format: 'integer' },
    { symbol: 'T', label: 'sequence length', default: 8192, min: 512, max: 131072, scale: 'log2', format: 'tokens' },
    { symbol: 'b', label: 'bytes per value', default: 2, min: 1, max: 4, options: [1, 2, 4], format: 'bytes' },
  ],
  outputs: [
    { symbol: 'M', label: 'scores per layer', formula: 'B*32*T^2*b', format: 'bytes', emphasis: true },
    { symbol: 'M2', label: 'S and P held', formula: '2*M', format: 'bytes' },
  ],
});

const chart = figure('chart', {
  type: 'line',
  x: { label: 'sequence length T', scale: 'log2', format: 'tokens', domain: [512, 131072] },
  y: { label: 'bytes per layer', scale: 'log2', format: 'bytes' },
  variables: { B: 1, H: 32, D: 4096, b: 2 },
  series: [
    { id: 'scores', label: 'scores', formula: 'B*H*x^2*b', sample: { from: 512, to: 131072, count: 9 }, emphasis: true },
    { id: 'act', label: 'activation', points: [[512, 4194304], [131072, 1073741824]] },
  ],
});

describe('evaluateFigureState', () => {
  it('computes formula rows of a stat panel, keyed by row key, and skips literal rows', () => {
    const { values } = evaluateFigureState(statPanel, null);
    assert.deepEqual(Object.keys(values).sort(), ['embedding params', 'non-embedding params']);
    const row = values['non-embedding params'];
    assert.ok(row !== undefined);
    assert.equal(row.value, 12 * 12 * 768 ** 2);
    assert.equal(row.text, formatValue(12 * 12 * 768 ** 2, 'params'));
    assert.equal(row.format, 'params');
    assert.equal(row.frac, undefined);
  });

  it('merges overrides over the spec variables without mutating the spec', () => {
    const before = JSON.stringify(statPanel);
    const { values } = evaluateFigureState(statPanel, { L: 24, D: 1024 });
    assert.equal(values['non-embedding params']?.value, 12 * 24 * 1024 ** 2);
    assert.equal(values['embedding params']?.value, 50257 * 1024);
    assert.equal(JSON.stringify(statPanel), before);
  });

  it('ignores non-finite overrides', () => {
    const { values } = evaluateFigureState(statPanel, { L: Number.NaN, D: Number.POSITIVE_INFINITY });
    assert.equal(values['non-embedding params']?.value, 12 * 12 * 768 ** 2);
  });

  it('keys memory-stack segments as "<bar>/<segment>" with widths as a fraction of the widest bar', () => {
    const { values } = evaluateFigureState(memoryStack, null);
    const N = 7e9;
    const widest = 16 * N;
    assert.equal(values['per model/Adam m, v']?.value, 8 * N);
    assert.equal(values['per model/Adam m, v']?.frac, 0.5);
    assert.equal(values['per model/BF16 weights']?.frac, 0.125);
    assert.equal(values['inference/BF16 weights']?.frac, 0.125);
    assert.equal(values['per model']?.value, widest);
    assert.equal(values['per model']?.frac, 1);
    assert.equal(values['per model']?.text, formatValue(widest, 'bytes'));
    const budget = values['budget'];
    assert.ok(budget !== undefined);
    assert.equal(budget.value, 80 * 2 ** 30);
    assert.ok(Math.abs((budget.frac ?? 0) - (80 * 2 ** 30) / widest) < 1e-4);
    assert.equal(values['per model/Adam m, v#share']?.text, '50 %');
    assert.match(values['per model#budget']?.text ?? '', /over budget$/u);
    assert.match(values['inference#budget']?.text ?? '', /headroom$/u);
  });

  it('scales memory-stack widths to the budget when the budget is the larger', () => {
    const { values } = evaluateFigureState(memoryStack, { N: 1e9 });
    assert.equal(values['budget']?.frac, 1);
    const expected = (8e9 / (80 * 2 ** 30)).toFixed(4);
    assert.equal(values['per model/Adam m, v']?.frac?.toFixed(4), expected);
  });

  it('evaluates calculator outputs by symbol, later outputs reading earlier ones', () => {
    const defaults = evaluateFigureState(calculator, null).values;
    const M = 1 * 32 * 8192 ** 2 * 2;
    assert.equal(defaults['M']?.value, M);
    assert.equal(defaults['M']?.text, '4 GiB');
    assert.equal(defaults['M2']?.value, 2 * M);
    const changed = evaluateFigureState(calculator, { T: 32768, b: 1 }).values;
    assert.equal(changed['M']?.value, 32 * 32768 ** 2);
    assert.equal(changed['M2']?.value, 2 * 32 * 32768 ** 2);
  });

  it('reports calculator inputs with the position of their control', () => {
    const { values } = evaluateFigureState(calculator, { T: 131072, b: 4 });
    assert.equal(values['T']?.value, 131072);
    assert.equal(values['T']?.frac, 1);
    assert.equal(values['T']?.text, '131,072');
    assert.equal(values['B']?.frac, 0);
    assert.equal(values['b']?.frac, 1);
    assert.equal(values['b']?.text, '4 B');
  });

  it('adds chart cursor values only when the overrides carry x', () => {
    assert.deepEqual(evaluateFigureState(chart, null).values, {});
    assert.deepEqual(evaluateFigureState(chart, { B: 2 }).values, {});
    const { values } = evaluateFigureState(chart, { x: 8192 });
    assert.equal(values['x']?.text, '8K');
    assert.ok(values['x']?.frac !== undefined && values['x'].frac > 0 && values['x'].frac < 1);
    assert.equal(values['scores']?.value, 32 * 8192 ** 2 * 2);
    assert.equal(values['scores']?.text, formatValue(32 * 8192 ** 2 * 2, 'bytes'));
    const act = values['act'];
    assert.ok(act !== undefined);
    // Interpolated in log–log space between the two points: exactly B·x·D·b at x = 8192.
    assert.ok(Math.abs(act.value - 8192 * 4096 * 2) / (8192 * 4096 * 2) < 1e-9);
    assert.ok((values['scores']?.frac ?? 0) > (act.frac ?? 1));
  });

  it('applies non-x chart overrides to the series', () => {
    const { values } = evaluateFigureState(chart, { x: 2048, H: 64 });
    assert.equal(values['scores']?.value, 64 * 2048 ** 2 * 2);
  });

  it('returns no values for kinds without formulas', () => {
    const lineage = figure('lineage', {
      entries: [
        { year: 2017, work: 'Transformer', cite: 'P01', relation: 'conceptual ancestor' },
        { year: 2022, work: 'FlashAttention', cite: 'P19', relation: 'engineering optimization' },
      ],
    });
    assert.deepEqual(evaluateFigureState(lineage, { x: 1 }).values, {});
  });
});

describe('resolveFigureStates', () => {
  it('precomputes every authored state in order', () => {
    const withStates = figure('stat-panel', (statPanel as Extract<FigureSpec, { kind: 'stat-panel' }>).spec, {
      placement: 'rail',
      states: [
        { anchor: 'formulation', label: 'GPT-2 small', highlight: ['layers'], note: 'The reference configuration.' },
        { anchor: 'mechanism', variables: { L: 24 }, highlight: ['non-embedding params'] },
      ],
    });
    const states = resolveFigureStates(withStates);
    assert.equal(states.length, 2);
    assert.equal(states[0]?.label, 'GPT-2 small');
    assert.deepEqual(states[0]?.highlight, ['layers']);
    assert.equal(states[1]?.label, null);
    assert.equal(states[1]?.values['non-embedding params']?.value, 12 * 24 * 768 ** 2);
  });
});

describe('@atlas/visual/state stays browser-safe', () => {
  it('imports only @atlas/core and pure sibling modules (never elkjs or preact)', () => {
    const allowed = new Set(['state.ts', 'figure-math.ts', 'chart.ts']);
    const seen = new Set<string>();
    const visit = (file: string): void => {
      if (seen.has(file)) return;
      seen.add(file);
      const source = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
      for (const match of source.matchAll(/^import\s[^'"]*['"]([^'"]+)['"]/gmu)) {
        const target = match[1] ?? '';
        if (target === '@atlas/core') continue;
        assert.ok(target.startsWith('./'), `${file} imports ${target}`);
        const next = target.slice(2);
        assert.ok(allowed.has(next), `${file} imports ${target}, outside the browser-safe set`);
        visit(next);
      }
    };
    visit('state.ts');
    assert.deepEqual([...seen].sort(), ['chart.ts', 'figure-math.ts', 'state.ts']);
  });
});
