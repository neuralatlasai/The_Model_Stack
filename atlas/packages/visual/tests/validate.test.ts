import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { FigureSpec } from '@atlas/core';
import { parseFigure, validateFigure } from '../src/index.ts';
import { envelope, fixtureContext, grammarFigureExample, grammarKindExamples, specOf } from './fixtures.ts';

function mustParse(raw: unknown): FigureSpec {
  const parsed = parseFigure(raw);
  assert.deepEqual(parsed.issues, []);
  assert.ok(parsed.figure !== null);
  return parsed.figure;
}

function codes(raw: unknown, ctx = fixtureContext): string[] {
  return validateFigure(mustParse(raw), ctx).map((issue) => issue.code);
}

describe('validateFigure on the normative examples of VISUAL_GRAMMAR.md', () => {
  it('accepts the §4 figure envelope example (calculator for Eq. 5.8) cleanly', () => {
    const figure = mustParse(grammarFigureExample());
    assert.equal(figure.kind, 'calculator');
    assert.deepEqual(validateFigure(figure, fixtureContext), []);
  });

  const examples = grammarKindExamples();

  it('extracts one spec example per kind that has one (all but calculator)', () => {
    assert.deepEqual(examples.map((example) => example.kind).sort(), [
      'chart',
      'compare',
      'cycle',
      'diagram',
      'hierarchy',
      'lineage',
      'matrix',
      'memory-stack',
      'stat-panel',
      'systems-trace',
      'tensor-flow',
    ]);
  });

  /**
   * Known defects in docs/VISUAL_GRAMMAR.md (not editable in this wave): unquoted
   * commas inside YAML flow mappings split a value into an extra key, so the
   * examples as written fail the schema. Each entry pins the failure and the
   * minimal quoting fix; when the grammar is corrected, the first assertion
   * fails and the entry should be deleted.
   */
  const YAML_DEFECTS: Readonly<Record<string, { readonly unrecognized: readonly string[]; readonly fix: readonly (readonly [string, string])[] }>> = {
    'memory-stack': { unrecognized: ['v'], fix: [['label: Adam m, v,', 'label: "Adam m, v",']] },
    hierarchy: {
      unrecognized: ['per SM', 'device-wide'],
      fix: [
        ['note: on-chip, per SM', 'note: "on-chip, per SM"'],
        ['note: off-chip, device-wide', 'note: "off-chip, device-wide"'],
      ],
    },
  };

  examples.forEach((example, index) => {
    const defect = YAML_DEFECTS[example.kind];
    if (defect === undefined) {
      it(`accepts the §${example.section} ${example.kind} example`, () => {
        const figure = mustParse(envelope(example.kind, example.spec, index + 1));
        assert.deepEqual(validateFigure(figure, fixtureContext), []);
      });
      return;
    }
    it(`§${example.section} ${example.kind}: the example as written has unquoted commas; quoted, it validates`, () => {
      const asWritten = parseFigure(envelope(example.kind, example.spec, index + 1));
      assert.equal(asWritten.figure, null);
      assert.deepEqual(
        asWritten.issues.map((issue) => /Unrecognized key: "([^"]+)"/u.exec(issue.message)?.[1]),
        defect.unrecognized,
      );
      let fixed = example.yaml;
      for (const [from, to] of defect.fix) fixed = fixed.replace(from, to);
      const figure = mustParse(envelope(example.kind, specOf(fixed), index + 1));
      assert.deepEqual(validateFigure(figure, fixtureContext), []);
    });
  });
});

describe('validateFigure rejects invalid figures with typed codes', () => {
  const calculator = (formula: string): Record<string, unknown> =>
    envelope(
      'calculator',
      {
        tex: 'M = B H T^2 b',
        equation: '5.8',
        inputs: [
          { symbol: 'B', label: 'sequences', default: 1, min: 1, max: 64, scale: 'log2' },
          { symbol: 'T', label: 'tokens', default: 8192, min: 512, max: 131072, scale: 'log2', format: 'tokens' },
        ],
        outputs: [{ symbol: 'M', label: 'bytes', formula, format: 'bytes' }],
      },
      1,
    );

  it('unbound symbol in a calculator output', () => {
    assert.deepEqual(codes(calculator('B*T^2*Z')), ['figure-formula-invalid', 'figure-formula-invalid', 'figure-formula-invalid', 'figure-formula-invalid', 'figure-formula-invalid']);
  });

  it('formula syntax errors and non-finite values at defaults', () => {
    assert.ok(codes(calculator('B*(T')).includes('figure-formula-invalid'));
    assert.ok(codes(calculator('1/(T-T)')).includes('figure-formula-invalid'));
  });

  it('non-finite output at a reachable slider extreme', () => {
    const issues = validateFigure(mustParse(calculator('1/(B-1)*T')), fixtureContext);
    assert.ok(issues.some((issue) => issue.code === 'figure-formula-invalid' && issue.message.includes('B = 1')));
  });

  it('outputs may read earlier outputs; later-to-earlier references are unbound', () => {
    const spec = {
      tex: 'x',
      inputs: [{ symbol: 'T', label: 'tokens', default: 4, min: 1, max: 8 }],
      outputs: [
        { symbol: 'A', label: 'a', formula: 'T*2' },
        { symbol: 'C', label: 'c', formula: 'A+T' },
      ],
    };
    assert.deepEqual(codes(envelope('calculator', spec, 1)), []);
    const reversed = { ...spec, outputs: [spec.outputs[1], spec.outputs[0]] };
    assert.ok(codes(envelope('calculator', reversed, 1)).includes('figure-formula-invalid'));
  });

  it('unknown edge endpoint and unknown group in a diagram', () => {
    const spec = {
      nodes: [
        { id: 'a', label: 'A', group: 'nowhere' },
        { id: 'b', label: 'B' },
      ],
      edges: [{ from: 'a', to: 'missing' }],
    };
    assert.deepEqual(codes(envelope('diagram', spec, 1)), ['figure-reference-invalid', 'figure-reference-invalid']);
  });

  it('undeclared tensor dimension', () => {
    const spec = { dims: { B: 'batch', T: 'tokens' }, steps: [{ shape: '[B, T]' }, { shape: '[B, T, Q]', op: 'expand' }] };
    const issues = validateFigure(mustParse(envelope('tensor-flow', spec, 1)), fixtureContext);
    assert.equal(issues.length, 1);
    assert.equal(issues[0]?.code, 'figure-reference-invalid');
    assert.match(issues[0]?.message ?? '', /'Q'/u);
  });

  it('bar values length must match categories', () => {
    const spec = {
      type: 'bar',
      x: { label: 'config' },
      y: { label: 'bytes', format: 'bytes' },
      categories: ['a', 'b', 'c'],
      series: [{ id: 's', label: 'KV', values: [1, 2] }],
    };
    assert.deepEqual(codes(envelope('chart', spec, 1)), ['figure-schema-invalid']);
  });

  it('EMPIRICALLY-OBSERVED is forbidden', () => {
    const parsed = parseFigure(envelope('matrix', { rows: 4, cols: 4, pattern: 'causal', rowLabel: 'i', colLabel: 'j' }, 1, { evidence: 'EMPIRICALLY-OBSERVED' }));
    assert.equal(parsed.figure, null);
    assert.deepEqual(
      parsed.issues.map((issue) => issue.code),
      ['label-forbidden'],
    );
  });

  it('PAPER-REPORTED performance chart needs context; with context it passes', () => {
    const spec = {
      type: 'line',
      x: { label: 'concurrency', scale: 'log2' },
      y: { label: 'decode throughput (tokens/s)' },
      series: [{ id: 'r', label: 'reported', points: [[1, 40], [8, 250], [64, 900]] }],
    };
    const base = envelope('chart', spec, 1, { evidence: 'PAPER-REPORTED', source: 'P19' });
    assert.deepEqual(codes(base), ['figure-context-missing']);
    const context = {
      hardware: 'as reported in P19',
      model: 'as reported',
      precision: 'FP16',
      sequenceLength: '2048',
      ioDistribution: 'as reported',
      concurrency: '1–64',
      runtimeVersion: 'as reported',
      measurementBoundary: 'kernel only',
    };
    assert.deepEqual(codes({ ...base, context }), []);
  });

  it('derived (illustrative) charts do not need context', () => {
    const spec = { type: 'line', x: { label: 'T', scale: 'log2' }, y: { label: 'latency (s)', format: 'seconds' }, series: [{ id: 'r', label: 'model', formula: 'x/1000', sample: { from: 1, to: 1024, count: 4 } }] };
    assert.deepEqual(codes(envelope('chart', spec, 1)), []);
  });

  it('references: chapter mismatch, unknown citation, malformed source, unknown node', () => {
    const matrix = { rows: 4, cols: 4, pattern: 'causal', rowLabel: 'i', colLabel: 'j' };
    assert.deepEqual(codes({ ...envelope('matrix', matrix, 1), id: 'fig-6.1' }), ['figure-chapter-mismatch']);
    assert.deepEqual(codes(envelope('matrix', matrix, 1, { source: ['P99'] })), ['figure-reference-invalid']);
    assert.deepEqual(codes(envelope('matrix', matrix, 1, { source: ['arxiv:1234'] })), ['figure-reference-invalid']);
    assert.deepEqual(codes(envelope('matrix', matrix, 1, { concepts: ['ms.volume.9'] })), ['figure-reference-invalid']);
    assert.deepEqual(codes(envelope('matrix', matrix, 1, { evidence: 'PAPER-REPORTED', source: 'DERIVED:eq-5.8' })), ['figure-reference-invalid']);
  });

  it('matrix, compare, and systems-trace consistency', () => {
    assert.deepEqual(codes(envelope('matrix', { rows: 4, cols: 4, pattern: 'explicit', rowLabel: 'i', colLabel: 'j' }, 1)), ['figure-schema-invalid']);
    assert.deepEqual(codes(envelope('matrix', { rows: 4, cols: 4, pattern: 'banded', rowLabel: 'i', colLabel: 'j', highlight: [{ row: 9, col: 0 }] }, 1)), [
      'figure-schema-invalid',
      'figure-schema-invalid',
    ]);
    const compare = {
      axis: 'KV bytes per token at fixed width',
      columns: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      rows: [
        { dimension: 'x', values: { a: '1', c: '2' } },
        { dimension: 'y', values: { a: '1', b: '1' } },
      ],
    };
    assert.deepEqual(codes(envelope('compare', compare, 1)), ['figure-reference-invalid']);
    const trace = { columns: ['latency'], stages: [{ name: 'a', values: { latency: 'x', memory: 'y' } }, { name: 'b', values: {} }] };
    assert.deepEqual(codes(envelope('systems-trace', trace, 1)), ['figure-reference-invalid']);
  });

  it('log axes need positive values; memory segments must be non-negative', () => {
    const chart = { type: 'line', x: { label: 'x' }, y: { label: 'y', scale: 'log10' }, series: [{ id: 's', label: 's', formula: 'x - 5', sample: { from: 0, to: 10, count: 5 } }] };
    assert.ok(codes(envelope('chart', chart, 1)).includes('figure-formula-invalid'));
    const stack = { bars: [{ label: 'b', segments: [{ label: 's', formula: '0 - N' }] }], variables: { N: 3 } };
    assert.deepEqual(codes(envelope('memory-stack', stack, 1)), ['figure-formula-invalid']);
  });
});
