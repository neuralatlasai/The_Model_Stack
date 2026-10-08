/** Chart size overrides change layout geometry without changing canonical defaults. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveChartSize } from '../src/svg/chart-size.ts';

describe('chart viewport dimensions', () => {
  it('keeps canonical placement sizes when no override is supplied', () => {
    assert.deepEqual(resolveChartSize('inline'), { w: 640, h: 360 });
    assert.deepEqual(resolveChartSize('rail'), { w: 320, h: 236 });
    assert.deepEqual(resolveChartSize('wide'), { w: 900, h: 420 });
  });

  it('accepts the overview viewport and both practical boundaries', () => {
    assert.deepEqual(resolveChartSize('inline', { width: 440, height: 390 }), { w: 440, h: 390 });
    assert.deepEqual(resolveChartSize('inline', { width: 320, height: 236 }), { w: 320, h: 236 });
    assert.deepEqual(resolveChartSize('rail', { width: 1600, height: 1200 }), { w: 1600, h: 1200 });
  });

  it('falls back for non-finite or out-of-bounds geometry', () => {
    for (const dimensions of [
      { width: Number.NaN, height: 390 },
      { width: 440, height: Number.POSITIVE_INFINITY },
      { width: 319, height: 390 },
      { width: 440, height: 235 },
      { width: 1601, height: 390 },
      { width: 440, height: 1201 },
    ]) {
      assert.deepEqual(resolveChartSize('inline', dimensions), { w: 640, h: 360 });
    }
  });
});
