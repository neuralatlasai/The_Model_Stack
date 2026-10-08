import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseSystemsTrace, parseTensorTrace } from '../src/index.ts';
import { systemsTraceBlocks, tensorTraceBlocks } from './fixtures.ts';
import { PARSER_REGRESSIONS } from './parser-regressions.ts';

describe('parseTensorTrace on every tensor trace in docs/', () => {
  const blocks = tensorTraceBlocks();

  it('finds the tensor traces', () => {
    assert.ok(blocks.length > 0, 'no authored tensor traces found');
  });

  for (const block of blocks) {
    it(`parses ${block.file}`, () => {
      const trace = parseTensorTrace(block.body);
      assert.ok(trace !== null);
      assert.match(trace.title, /^Tensor trace/u);
      assert.ok(trace.lines.length >= 1);
      assert.ok(trace.dims.length >= 1, 'no dimension symbols recovered');
      for (const line of trace.lines) {
        assert.ok(line.length >= 1);
        for (const segment of line) assert.ok(segment.text.trim() !== '' && !segment.text.includes('→'));
      }
      // Every source line with an arrow produced at least one shape segment or is a prose step.
      const shapes = trace.lines.flat().filter((segment) => segment.type === 'shape');
      assert.ok(shapes.length >= 1);
    });
  }

  it('recovers the chapter 5 forward pass as 21 rows with dividers, dims in first-seen order, and no index false positives', () => {
    const trace = parseTensorTrace(PARSER_REGRESSIONS.forward);
    assert.ok(trace !== null);
    assert.equal(trace.lines.length, 21);
    assert.deepEqual(trace.dims, ['B', 'T', 'D', 'H', 'Dh', 'F', 'V']);
    assert.deepEqual(trace.lines[0], [
      { type: 'shape', text: '[B, T] int64' },
      { type: 'op', text: 'gather E[x]' },
      { type: 'shape', text: '[B, T, D] h_0 (embedding)' },
    ]);
    assert.deepEqual(trace.lines[2], [{ type: 'op', text: '--- block ℓ (repeated L times) ---' }]);
  });

  it('keeps trailing cost comments as # segments (chapter 2)', () => {
    const trace = parseTensorTrace(PARSER_REGRESSIONS.cost);
    assert.deepEqual(trace?.lines[1]?.at(-1), { type: 'op', text: '# 2·B·H·T²·Dh FLOPs, output B·H·T²·b bytes' });
    assert.deepEqual(trace?.lines[0]?.at(-1), { type: 'shape', text: '3 × [B, H, T, Dh]' });
  });

  it('strips tree-drawing characters and reads combining marks in symbols (chapter 4)', () => {
    const trace = parseTensorTrace(PARSER_REGRESSIONS.mtp);
    assert.deepEqual(trace?.lines[0]?.[0], { type: 'shape', text: '[B, T, d] h^0' });
    assert.ok(parseTensorTrace(PARSER_REGRESSIONS.span)?.dims.includes('T̃'));
  });

  it('returns null for other blocks', () => {
    assert.equal(parseTensorTrace('Algorithm 5.2 — x\nINPUT: y'), null);
    assert.equal(parseTensorTrace(''), null);
  });
});

describe('parseSystemsTrace on every systems trace in docs/', () => {
  const blocks = systemsTraceBlocks();

  it('finds the systems traces', () => {
    assert.ok(blocks.length > 0, 'no authored systems traces found');
  });

  for (const block of blocks) {
    it(`parses ${block.file}`, () => {
      const trace = parseSystemsTrace(block.body);
      assert.ok(trace !== null);
      assert.match(trace.title, /^Systems trace/u);
      assert.ok(trace.columns.length >= 1);
      assert.ok(trace.rows.length >= 2);
      for (const row of trace.rows) {
        assert.ok(row.stage !== '');
        assert.equal(row.cells.length, trace.columns.length, `row '${row.stage}'`);
        assert.ok(
          row.cells.some((cell) => cell !== ''),
          `row '${row.stage}' is empty`,
        );
      }
    });
  }

  it('reads header-row traces positionally, keeping B/param intact and folding overflow into the last column', () => {
    const trace = parseSystemsTrace(PARSER_REGRESSIONS.mixed);
    assert.deepEqual(trace?.columns, ['latency', 'memory', 'compute', 'communication', 'failure']);
    assert.deepEqual(trace?.rows[0], {
      stage: 'cast master→operand',
      cells: ['1 pass over W', '+2 B/param operand copy', 'elementwise', 'none', 'none'],
    });
    const gemm = parseSystemsTrace(PARSER_REGRESSIONS.repro)?.rows.find((row) => row.stage === 'GEMMs');
    assert.equal(gemm?.cells[4], 'split-K / multi-stream order');
  });

  it('reads key: value traces into canonical columns, extra keys, and a note column', () => {
    assert.deepEqual(parseSystemsTrace(PARSER_REGRESSIONS.acquisition)?.columns, [
      'latency',
      'memory',
      'compute',
      'communication',
      'failure',
    ]);
    const train = parseSystemsTrace(PARSER_REGRESSIONS.controlled);
    assert.deepEqual(train?.columns, ['memory', 'storage', 'compute', 'communication', 'failure']);
    const trainRow = train?.rows.find((row) => row.stage === 'train');
    assert.equal(trainRow?.cells[0], 'per Chapters 29–30');
    assert.equal(trainRow?.cells[3], 'per Chapters 29–30');
    const act = parseSystemsTrace(PARSER_REGRESSIONS.rights)?.rows.find((row) => row.stage === 'act per class');
    assert.ok(act?.cells.at(-1)?.startsWith('raw, shard, cache, index, backup: delete or tombstone'));
  });

  it('keeps positional rows without a header as one detail column (chapter 6)', () => {
    const trace = parseSystemsTrace(PARSER_REGRESSIONS.frontier);
    assert.deepEqual(trace?.columns, ['detail']);
    assert.deepEqual(trace?.rows[0], {
      stage: 'immutable workload',
      cells: ['replay scheduled arrivals / bounded queue / record rejected requests'],
    });
  });

  it('returns null for other blocks', () => {
    assert.equal(parseSystemsTrace('Tensor trace\n[B] → x → [B]'), null);
  });
});
