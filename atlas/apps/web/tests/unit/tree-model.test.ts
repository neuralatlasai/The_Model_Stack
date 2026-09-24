import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { StoredTreeExpandedSchema } from '@atlas/core';
import { expandedSet, keyToMove, labelMatches, MAX_EXPANDED, moveIndex, typeaheadIndex, updateExpanded } from '../../src/client/tree-model.ts';

describe('vertical moves (APG tree)', () => {
  test('keys map to moves; other keys do not', () => {
    assert.equal(keyToMove('ArrowDown'), 'next');
    assert.equal(keyToMove('ArrowUp'), 'previous');
    assert.equal(keyToMove('Home'), 'first');
    assert.equal(keyToMove('End'), 'last');
    assert.equal(keyToMove('ArrowRight'), null);
  });

  test('moves clamp at the ends (no wrap)', () => {
    assert.equal(moveIndex('next', 4, 5), 4);
    assert.equal(moveIndex('previous', 0, 5), 0);
    assert.equal(moveIndex('next', 1, 5), 2);
    assert.equal(moveIndex('first', 3, 5), 0);
    assert.equal(moveIndex('last', 0, 5), 4);
    assert.equal(moveIndex('next', 0, 0), -1);
  });
});

describe('type-ahead', () => {
  const labels = ['Foundations', 'Tokenization', 'Transformer anatomy', '5.2 Attention', 'Training loop'];

  test('finds the next item starting with the buffer, after the current one, wrapping', () => {
    assert.equal(typeaheadIndex(labels, 0, 't'), 1);
    assert.equal(typeaheadIndex(labels, 4, 'f'), 0);
  });

  test('repeating one character cycles through matches', () => {
    assert.equal(typeaheadIndex(labels, 1, 'tt'), 2);
    assert.equal(typeaheadIndex(labels, 2, 'ttt'), 4);
  });

  test('a multi-character buffer can stay on the current item', () => {
    assert.equal(typeaheadIndex(labels, 2, 'tra'), 2);
    assert.equal(typeaheadIndex(labels, 1, 'tra'), 2);
  });

  test('numbered labels match by number or by title', () => {
    assert.equal(typeaheadIndex(labels, 0, 'a'), 3);
    assert.equal(typeaheadIndex(labels, 0, '5'), 3);
    assert.equal(labelMatches('05 — Minimal transformer', 'min'), true);
  });

  test('no match → -1', () => {
    assert.equal(typeaheadIndex(labels, 0, 'zz'), -1);
    assert.equal(typeaheadIndex([], 0, 'a'), -1);
  });
});

describe('persisted expansion', () => {
  test('adds (newest last), removes, deduplicates', () => {
    let stored = updateExpanded([], 'ms.part.1', true);
    stored = updateExpanded(stored, 'ms.chapter.5', true);
    stored = updateExpanded(stored, 'ms.part.1', true);
    assert.deepEqual(stored, ['ms.chapter.5', 'ms.part.1']);
    assert.deepEqual(updateExpanded(stored, 'ms.chapter.5', false), ['ms.part.1']);
  });

  test('stays within the stored schema limit', () => {
    let stored: string[] = [];
    for (let i = 0; i < MAX_EXPANDED + 25; i += 1) stored = updateExpanded(stored, `ms.section.1.${String(i + 1)}`, true);
    assert.equal(stored.length, MAX_EXPANDED);
    assert.equal(stored.at(-1), `ms.section.1.${String(MAX_EXPANDED + 25)}`);
    assert.equal(StoredTreeExpandedSchema.safeParse(stored).success, true);
  });

  test('the active branch always expands in addition to the reader’s choices', () => {
    const open = expandedSet(['ms.part.3'], ['ms.volume.1', 'ms.part.1', 'ms.chapter.5']);
    assert.deepEqual([...open].sort(), ['ms.chapter.5', 'ms.part.1', 'ms.part.3', 'ms.volume.1']);
  });
});
