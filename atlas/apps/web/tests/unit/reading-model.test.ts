import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { StoredBookmarksSchema, StoredProgressSchema, StoredRecentSchema, type StoredProgress } from '@atlas/core';
import {
  isBookmarked,
  MAX_PROGRESS_ENTRIES,
  MAX_RECENT,
  pushRecent,
  recordProgress,
  toggleBookmark,
  type Bookmark,
} from '../../src/client/reading-model.ts';

const NOW = '2026-09-23T10:00:00.000Z';

describe('recordProgress', () => {
  test('records the furthest fraction and never moves backwards', () => {
    let state: StoredProgress = {};
    state = recordProgress(state, 'ms.section.5.2', 0.4, 'formulation', NOW);
    state = recordProgress(state, 'ms.section.5.2', 0.2, 'scope', NOW);
    assert.equal(state['ms.section.5.2']?.max, 0.4);
    assert.equal(state['ms.section.5.2']?.anchor, 'scope');
    assert.equal(StoredProgressSchema.safeParse(state).success, true);
  });

  test('clamps out-of-range fractions', () => {
    const state = recordProgress({}, 'ms.chapter.5', 7, null, NOW);
    assert.equal(state['ms.chapter.5']?.max, 1);
    assert.equal(state['ms.chapter.5']?.anchor, '');
  });

  test('returns the same object when nothing changed', () => {
    const state = recordProgress({}, 'ms.section.5.2', 0.4, 'formulation', NOW);
    assert.equal(recordProgress(state, 'ms.section.5.2', 0.3, 'formulation', NOW), state);
  });

  test('drops the least recently updated entries beyond the cap', () => {
    const state: StoredProgress = {};
    for (let i = 0; i < MAX_PROGRESS_ENTRIES; i += 1) {
      state[`ms.section.1.${String(i + 1)}`] = { max: 0.5, anchor: '', at: `2026-01-01T00:00:${String(i % 60).padStart(2, '0')}.${String(i).padStart(3, '0')}Z` };
    }
    const next = recordProgress(state, 'ms.section.9.9', 0.1, null, NOW);
    assert.equal(Object.keys(next).length, MAX_PROGRESS_ENTRIES);
    assert.ok(Object.hasOwn(next, 'ms.section.9.9'));
  });
});

describe('pushRecent', () => {
  test('moves the node to the front, deduplicated, capped', () => {
    let list = Array.from({ length: MAX_RECENT }, (_, i) => ({ nodeId: `ms.section.1.${String(i + 1)}`, url: `/s${String(i)}/`, title: `S${String(i)}` }));
    list = pushRecent(list, { nodeId: 'ms.section.1.5', url: '/s4/', title: 'S4' });
    assert.equal(list[0]?.nodeId, 'ms.section.1.5');
    assert.equal(list.length, MAX_RECENT);
    assert.equal(list.filter((entry) => entry.nodeId === 'ms.section.1.5').length, 1);
    list = pushRecent(list, { nodeId: 'ms.section.2.1', url: '/n/', title: 'N' });
    assert.equal(list.length, MAX_RECENT);
    assert.equal(StoredRecentSchema.safeParse(list).success, true);
  });

  test('clips over-long titles so the stored value always satisfies its schema', () => {
    const list = pushRecent([], { nodeId: 'ms.section.1.1', url: '/x/', title: 'x'.repeat(500) });
    assert.equal(StoredRecentSchema.safeParse(list).success, true);
    assert.ok((list[0]?.title.length ?? 0) <= 200);
  });
});

describe('toggleBookmark', () => {
  const bookmark: Bookmark = {
    kind: 'region',
    nodeId: 'ms.section.5.2',
    anchor: 'formulation',
    title: 'Attention — Formulation',
    context: 'y'.repeat(900),
    url: '/ch05/05-2/#formulation',
    at: NOW,
  };

  test('adds (newest first, context clipped) and removes on the second toggle', () => {
    const added = toggleBookmark([], bookmark);
    assert.equal(added.added, true);
    assert.equal(added.list.length, 1);
    assert.equal(StoredBookmarksSchema.safeParse(added.list).success, true);
    assert.equal(isBookmarked(added.list, 'ms.section.5.2', 'formulation'), true);
    assert.equal(isBookmarked(added.list, 'ms.section.5.2', 'mechanism'), false);

    const removed = toggleBookmark(added.list, bookmark);
    assert.equal(removed.added, false);
    assert.equal(removed.list.length, 0);
  });

  test('a node bookmark (anchor null) is distinct from its region bookmarks', () => {
    const list = toggleBookmark(toggleBookmark([], bookmark).list, { ...bookmark, kind: 'node', anchor: null }).list;
    assert.equal(list.length, 2);
    assert.equal(isBookmarked(list, 'ms.section.5.2', null), true);
  });
});
