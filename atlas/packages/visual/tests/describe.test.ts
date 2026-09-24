import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FIGURE_KINDS, formatValue, type FigureSpec } from '@atlas/core';
import { allocateCells, describeFigure, evaluateCalculator, logTicks, makeScale, matrixSummary, niceLinearTicks, parseFigure, sliderModel } from '../src/index.ts';
import { envelope, grammarFigureExample, grammarKindExamples, specOf } from './fixtures.ts';

/** Grammar examples with the YAML quoting fixes applied (see validate.test.ts). */
function examples(): Map<string, FigureSpec> {
  const out = new Map<string, FigureSpec>();
  grammarKindExamples().forEach((example, index) => {
    const yaml = example.yaml
      .replace('label: Adam m, v,', 'label: "Adam m, v",')
      .replace('note: on-chip, per SM', 'note: "on-chip, per SM"')
      .replace('note: off-chip, device-wide', 'note: "off-chip, device-wide"');
    const parsed = parseFigure(envelope(example.kind, specOf(yaml), index + 1));
    assert.ok(parsed.figure !== null, `${example.kind}: ${JSON.stringify(parsed.issues)}`);
    out.set(example.kind, parsed.figure);
  });
  const calculator = parseFigure(grammarFigureExample()).figure;
  assert.ok(calculator !== null);
  out.set('calculator', calculator);
  return out;
}

describe('describeFigure', () => {
  const figures = examples();

  it('covers every figure kind with a non-empty, multi-line text equivalent', () => {
    for (const kind of FIGURE_KINDS) {
      const figure = figures.get(kind);
      assert.ok(figure !== undefined, `no example for ${kind}`);
      const text = describeFigure(figure);
      assert.ok(text.trim().length > 40, `${kind}: ${text}`);
      assert.ok(text.split('\n').length >= 2, `${kind} should list structure line by line`);
    }
  });

  it('states computed values and structure in words', () => {
    const text = (kind: string): string => {
      const figure = figures.get(kind);
      assert.ok(figure !== undefined);
      return describeFigure(figure);
    };
    assert.match(text('calculator'), /scores per layer M = 4\sGiB \(primary\)/u);
    assert.match(text('calculator'), /sequence length T = 8\.19\sK \(range 512 to 131\sK in powers of two\)/u);
    assert.match(text('memory-stack'), /total 104\sGiB/u);
    assert.match(text('memory-stack'), /exceeds it by 24\.3\sGiB/u);
    assert.match(text('diagram'), /normalised stream \[B, T, D\] → QKV projection 6·D² FLOPs\/token/u);
    assert.match(text('diagram'), /\(main path\) “QKᵀ\/√Dh”/u);
    assert.match(text('tensor-flow'), /Step 2: packed QKV projection → \[B, T, 3, H, Dh\]; cost 6·D² FLOPs\/token\./u);
    assert.match(text('systems-trace'), /Stage 2, GEMM forward \(emphasised\): memory activations saved; compute tensor-core bound\./u);
    assert.match(text('stat-panel'), /non-embedding params 84\.9\sM/u);
    assert.match(text('stat-panel'), /Dot glyph: 12 of 48 filled/u);
    assert.match(text('lineage'), /2025\+: hardware-specialised attention kernels — current frontier\./u);
    assert.match(text('cycle'), /Feedback loops: Deploy → Data “usage data”; Evaluate → Pretrain “ablations”\./u);
    assert.match(text('matrix'), /36 of 64 cells admitted \(56 %\)/u);
    assert.match(text('chart'), /Series scores B·H·T²·b \(emphasised\): at 512, 16\sMiB; .*at 131\sK, 1\sTiB\./u);
    assert.match(text('hierarchy'), /6\. HBM \(memory, emphasised\); off-chip, device-wide\./u);
    assert.match(text('compare'), /Rows identical across columns: objective \(unchanged\)/u);
    assert.match(text('compare'), /Rows that differ: KV heads — MHA: H_q, GQA: H_kv < H_q, MQA: 1/u);
  });
});

describe('numeric helpers', () => {
  it('nice linear ticks cover the range with 1-2-2.5-5 steps', () => {
    assert.deepEqual(niceLinearTicks(0, 97), [0, 20, 40, 60, 80, 100]);
    assert.deepEqual(niceLinearTicks(0.2, 0.9), [0.2, 0.4, 0.6, 0.8, 1]);
    assert.deepEqual(niceLinearTicks(5, 5), [4.4, 4.6, 4.8, 5, 5.2, 5.4, 5.6]);
  });

  it('log ticks are integer powers, thinned to ≤ 9', () => {
    assert.deepEqual(logTicks(512, 131072, 2), [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072]);
    assert.ok(logTicks(1, 2 ** 40, 2).length <= 9);
    assert.deepEqual(logTicks(1, 1e3, 10), [1, 10, 100, 1000]);
    assert.deepEqual(logTicks(10, 90, 10), [10, 20, 50, 100]);
  });

  it('scales map domains onto ranges (log2 evenly spaced per doubling)', () => {
    const scale = makeScale('log2', [512, 131072], [0, 800]);
    assert.equal(scale.map(512), 0);
    assert.equal(scale.map(131072), 800);
    assert.equal(scale.map(8192), 400);
  });

  it('log2 sliders move in powers of two; option sliders by index', () => {
    const t = sliderModel({ symbol: 'T', label: 't', default: 8192, min: 512, max: 131072, scale: 'log2', format: 'tokens' });
    assert.deepEqual([t.min, t.max, t.step, t.toPosition(8192), t.toValue(15)], [9, 17, 1, 13, 32768]);
    const b = sliderModel({ symbol: 'b', label: 'b', default: 2, min: 1, max: 4, scale: 'linear', options: [1, 2, 4], format: 'bytes' });
    assert.deepEqual([b.min, b.max, b.toPosition(4), b.toValue(1)], [0, 2, 2, 2]);
  });

  it('calculators evaluate outputs in order and never throw', () => {
    const calculator = parseFigure(grammarFigureExample()).figure;
    assert.ok(calculator?.kind === 'calculator');
    const [scores] = evaluateCalculator(calculator.spec, { T: 32768 });
    assert.equal(scores?.value, 1 * 32 * 32768 ** 2 * 2);
    assert.equal(formatValue(scores?.value ?? 0, 'bytes'), '64\u202fGiB');
    const broken = evaluateCalculator({ ...calculator.spec, outputs: [{ symbol: 'Z', label: 'z', formula: 'nope*2', format: 'raw', emphasis: false }] }, {});
    assert.equal(broken[0]?.value, null);
    assert.match(broken[0]?.error ?? '', /unbound identifier 'nope'/u);
  });

  it('matrix summaries and block allocation are exact', () => {
    assert.deepEqual(matrixSummary({ rows: 8, cols: 8, pattern: 'banded', parameter: 3, rowLabel: 'i', colLabel: 'j', highlight: [] }), { total: 64, admitted: 21, mass: 21 });
    assert.deepEqual(matrixSummary({ rows: 4, cols: 8, pattern: 'causal', rowLabel: 'i', colLabel: 'j', highlight: [] }).admitted, 4 * 5 + 6);
    assert.deepEqual(allocateCells([1, 1, 1], 40), [14, 13, 13]);
    assert.deepEqual(allocateCells([4, 8], 12), [4, 8]);
  });
});
