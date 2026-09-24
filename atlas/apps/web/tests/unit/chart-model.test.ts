import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  edgeOfSeries,
  nearestPoint,
  parseFormat,
  parseNumber,
  readoutText,
  stepInSeries,
  switchSeries,
  toggleIsolation,
  type PlotPoint,
} from '../../src/client/chart-model.ts';

const point = (series: string, x: number, y: number, px: number, py: number): PlotPoint => ({ series, x, y, px, py, xText: null, yText: null });

// Two series sampled at the same x positions; pixel y grows downwards.
const POINTS: PlotPoint[] = [
  point('scores', 512, 1e6, 100, 300),
  point('scores', 1024, 4e6, 200, 250),
  point('scores', 2048, 1.6e7, 300, 150),
  point('act', 512, 1e5, 100, 320),
  point('act', 1024, 2e5, 200, 310),
  point('act', 2048, 4e5, 300, 300),
];

describe('nearestPoint', () => {
  test('x mode picks the nearest column, then the nearest y within it', () => {
    assert.equal(nearestPoint(POINTS, 195, 305, 'x', null), 4);
    assert.equal(nearestPoint(POINTS, 195, 240, 'x', null), 1);
  });

  test('xy mode is Euclidean', () => {
    assert.equal(nearestPoint(POINTS, 290, 290, 'xy', null), 5);
  });

  test('hidden series are skipped; no candidates → -1', () => {
    assert.equal(nearestPoint(POINTS, 195, 305, 'x', new Set(['scores'])), 1);
    assert.equal(nearestPoint(POINTS, 0, 0, 'x', new Set(['none'])), -1);
    assert.equal(nearestPoint([], 0, 0, 'x', null), -1);
  });
});

describe('keyboard traversal', () => {
  test('stepInSeries moves along x and stops at the ends', () => {
    assert.equal(stepInSeries(POINTS, 0, 1), 1);
    assert.equal(stepInSeries(POINTS, 2, 1), 2);
    assert.equal(stepInSeries(POINTS, 3, -1), 3);
  });

  test('edgeOfSeries jumps to the first/last point of the series', () => {
    assert.equal(edgeOfSeries(POINTS, 1, 'first'), 0);
    assert.equal(edgeOfSeries(POINTS, 4, 'last'), 5);
  });

  test('switchSeries lands on the nearest x in the neighbouring visible series', () => {
    assert.equal(switchSeries(POINTS, 1, 1, ['scores', 'act'], null), 4);
    assert.equal(switchSeries(POINTS, 4, -1, ['scores', 'act'], null), 1);
    assert.equal(switchSeries(POINTS, 4, 1, ['scores', 'act'], null), 4);
    assert.equal(switchSeries(POINTS, 1, 1, ['scores', 'act'], new Set(['scores'])), 1);
  });
});

describe('attribute parsing and readout', () => {
  test('parseFormat accepts only core value formats', () => {
    assert.equal(parseFormat('bytes'), 'bytes');
    assert.equal(parseFormat('bogus'), 'raw');
    assert.equal(parseFormat(null), 'raw');
  });

  test('parseNumber rejects non-finite and empty values', () => {
    assert.equal(parseNumber('1.5e3'), 1500);
    assert.equal(parseNumber(''), null);
    assert.equal(parseNumber('Infinity'), null);
    assert.equal(parseNumber('abc'), null);
  });

  test('readout uses rendered values when present, core formatting otherwise', () => {
    const axes = { xFormat: 'tokens', yFormat: 'bytes', xLabel: 'sequence length T', yLabel: 'bytes per layer' } as const;
    // core formatValue separates number and unit with a narrow no-break space (U+202F)
    assert.equal(readoutText('scores', point('scores', 8192, 4 * 2 ** 30, 0, 0), axes), 'scores — sequence length T 8.19\u202fK · bytes per layer 4\u202fGiB');
    assert.equal(
      readoutText('act', { ...point('act', 2, 5, 0, 0), xText: 'FP8', yText: '5 ms' }, { ...axes, xLabel: null }),
      'act — FP8 · bytes per layer 5 ms',
    );
  });

  test('legend isolation toggles', () => {
    assert.equal(toggleIsolation(null, 'a'), 'a');
    assert.equal(toggleIsolation('a', 'a'), null);
    assert.equal(toggleIsolation('a', 'b'), 'b');
  });
});
