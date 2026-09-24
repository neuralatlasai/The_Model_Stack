import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { STORAGE_KEYS, StoredDepthSchema, StoredRecentSchema, StoredTreeExpandedSchema } from '@atlas/core';
import { createStore, type StorageLike } from '../../src/client/storage.ts';

class MapStorage implements StorageLike {
  readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

class RefusingStorage implements StorageLike {
  getItem(): string | null {
    throw new Error('SecurityError: storage disabled');
  }
  setItem(): void {
    throw new Error('QuotaExceededError');
  }
  removeItem(): void {
    throw new Error('SecurityError: storage disabled');
  }
}

describe('createStore', () => {
  test('round-trips a valid value through JSON', () => {
    const backing = new MapStorage();
    const store = createStore(backing);
    store.write(STORAGE_KEYS.depth, 'technical');
    assert.equal(backing.data.get(STORAGE_KEYS.depth), '"technical"');
    assert.equal(store.read(STORAGE_KEYS.depth, StoredDepthSchema, 'implementation'), 'technical');
    assert.equal(store.persistent, true);
  });

  test('missing value → fallback; readOptional → null', () => {
    const store = createStore(new MapStorage());
    assert.equal(store.read(STORAGE_KEYS.depth, StoredDepthSchema, 'overview'), 'overview');
    assert.equal(store.readOptional(STORAGE_KEYS.depth, StoredDepthSchema), null);
  });

  test('corrupt JSON is discarded from storage and the fallback returned', () => {
    const backing = new MapStorage();
    backing.data.set(STORAGE_KEYS.treeExpanded, '[not json');
    const store = createStore(backing);
    assert.deepEqual(store.read(STORAGE_KEYS.treeExpanded, StoredTreeExpandedSchema, []), []);
    assert.equal(backing.data.has(STORAGE_KEYS.treeExpanded), false);
  });

  test('a value that fails its schema is discarded', () => {
    const backing = new MapStorage();
    backing.data.set(STORAGE_KEYS.recent, JSON.stringify([{ nodeId: 'ms.section.5.2', url: '/x/', title: 'X', extra: true }]));
    const store = createStore(backing);
    assert.deepEqual(store.read(STORAGE_KEYS.recent, StoredRecentSchema, []), []);
    assert.equal(backing.data.has(STORAGE_KEYS.recent), false);
  });

  test('an over-long list (schema max) is rejected rather than trusted', () => {
    const backing = new MapStorage();
    backing.data.set(STORAGE_KEYS.treeExpanded, JSON.stringify(Array.from({ length: 401 }, (_, i) => `ms.section.1.${String(i + 1)}`)));
    assert.deepEqual(createStore(backing).read(STORAGE_KEYS.treeExpanded, StoredTreeExpandedSchema, []), []);
  });

  test('refusing storage never throws and degrades to session memory', () => {
    const store = createStore(new RefusingStorage());
    assert.equal(store.read(STORAGE_KEYS.depth, StoredDepthSchema, 'research'), 'research');
    assert.doesNotThrow(() => {
      store.write(STORAGE_KEYS.depth, 'overview');
    });
    assert.equal(store.persistent, false);
    assert.equal(store.read(STORAGE_KEYS.depth, StoredDepthSchema, 'research'), 'overview');
    assert.doesNotThrow(() => {
      store.remove(STORAGE_KEYS.depth);
    });
    assert.equal(store.read(STORAGE_KEYS.depth, StoredDepthSchema, 'research'), 'research');
  });

  test('no backing store at all works in memory', () => {
    const store = createStore(null);
    store.write(STORAGE_KEYS.depth, 'technical');
    assert.equal(store.read(STORAGE_KEYS.depth, StoredDepthSchema, 'overview'), 'technical');
  });

  test('unserialisable values are ignored', () => {
    const store = createStore(new MapStorage());
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    assert.doesNotThrow(() => {
      store.write('atlas.test', cyclic);
    });
  });
});
