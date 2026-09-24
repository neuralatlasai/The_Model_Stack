import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  clamp01,
  hrefWithHash,
  isAtBottom,
  pickActiveRegion,
  readingProgress,
  shouldReplaceHash,
  toRegionRole,
} from '../../src/client/active-region.ts';

describe('pickActiveRegion', () => {
  const line = 280; // READING_THRESHOLD 0.28 × 1000 px viewport

  test('no regions → index -1', () => {
    assert.deepEqual(pickActiveRegion([], line, false, 1000), { index: -1, crossed: false });
  });

  test('before any region crosses the reading line the first region is active but not crossed', () => {
    assert.deepEqual(pickActiveRegion([400, 1200, 2000], line, false, 1000), { index: 0, crossed: false });
  });

  test('the last region whose top has crossed the line wins', () => {
    assert.deepEqual(pickActiveRegion([-900, -100, 250, 900], line, false, 1000), { index: 2, crossed: true });
  });

  test('a top exactly on the line counts as crossed', () => {
    assert.deepEqual(pickActiveRegion([-10, 280, 600], line, false, 1000), { index: 1, crossed: true });
  });

  test('at the bottom of the page a short trailing region inside the viewport becomes active', () => {
    assert.deepEqual(pickActiveRegion([-2000, -400, 500, 820], line, true, 1000), { index: 3, crossed: true });
  });

  test('at the bottom, regions below the viewport are ignored', () => {
    assert.deepEqual(pickActiveRegion([-400, 100, 1400], line, true, 1000), { index: 1, crossed: true });
  });
});

describe('readingProgress', () => {
  test('fraction of the article above the reading line', () => {
    assert.equal(readingProgress({ line: 280, articleTop: -720, articleHeight: 4000, atBottom: false }), 0.25);
  });

  test('clamped to [0, 1]', () => {
    assert.equal(readingProgress({ line: 280, articleTop: 600, articleHeight: 4000, atBottom: false }), 0);
    assert.equal(readingProgress({ line: 280, articleTop: -9000, articleHeight: 4000, atBottom: false }), 1);
  });

  test('1 at the bottom of the page, 0 for an empty article', () => {
    assert.equal(readingProgress({ line: 280, articleTop: -100, articleHeight: 4000, atBottom: true }), 1);
    assert.equal(readingProgress({ line: 280, articleTop: 0, articleHeight: 0, atBottom: false }), 0);
  });

  test('clamp01 maps NaN to 0', () => {
    assert.equal(clamp01(Number.NaN), 0);
  });
});

describe('isAtBottom', () => {
  test('within 2 px of the page end', () => {
    assert.equal(isAtBottom(3000, 1000, 4001.5), true);
    assert.equal(isAtBottom(2990, 1000, 4000), false);
  });
});

describe('shouldReplaceHash', () => {
  test('same anchor → no write', () => {
    assert.equal(shouldReplaceHash('formulation', 'formulation', 'formulation'), false);
  });

  test('a deep link inside the active region is kept', () => {
    assert.equal(shouldReplaceHash('eq-5-4', 'formulation', 'formulation'), false);
  });

  test('a deep link outside the active region is replaced', () => {
    assert.equal(shouldReplaceHash('eq-5-4', 'mechanism', 'formulation'), true);
  });

  test('no hash → the active region is written', () => {
    assert.equal(shouldReplaceHash('', 'scope', null), true);
  });
});

describe('hrefWithHash', () => {
  test('replaces the fragment, keeps path and query', () => {
    assert.equal(hrefWithHash('https://atlas.test/ch05/05-2/?depth=technical#scope', 'mechanism'), 'https://atlas.test/ch05/05-2/?depth=technical#mechanism');
  });

  test('removes the fragment without leaving a bare #', () => {
    assert.equal(hrefWithHash('https://atlas.test/ch05/#scope', null), 'https://atlas.test/ch05/');
  });
});

describe('toRegionRole', () => {
  test('known section, chapter, and verification roles pass through', () => {
    assert.equal(toRegionRole('formulation'), 'formulation');
    assert.equal(toRegionRole('why-chapter'), 'why-chapter');
    assert.equal(toRegionRole('acceptance'), 'acceptance');
  });

  test('anything else is "other"', () => {
    assert.equal(toRegionRole('<script>'), 'other');
    assert.equal(toRegionRole(undefined), 'other');
  });
});
