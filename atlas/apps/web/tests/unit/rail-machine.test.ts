import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { INITIAL_RAIL_STATE, railAnchor, railReducer, sameTarget, targetKey, type RailState } from '../../src/client/rail-machine.ts';

const paper = { type: 'paper', key: 'P19' } as const;
const equation = { type: 'equation', number: '5.4' } as const;

describe('railReducer', () => {
  test('idle → region → region follows the active region', () => {
    let state: RailState = INITIAL_RAIL_STATE;
    state = railReducer(state, { type: 'region', anchor: 'scope' });
    assert.deepEqual(state, { mode: 'region', anchor: 'scope' });
    state = railReducer(state, { type: 'region', anchor: 'formulation' });
    assert.deepEqual(state, { mode: 'region', anchor: 'formulation' });
  });

  test('the same region returns the same state object (no re-render)', () => {
    const state: RailState = { mode: 'region', anchor: 'scope' };
    assert.equal(railReducer(state, { type: 'region', anchor: 'scope' }), state);
  });

  test('inspect pins the object and remembers the region', () => {
    const state = railReducer({ mode: 'region', anchor: 'mechanism' }, { type: 'inspect', target: paper });
    assert.deepEqual(state, { mode: 'inspecting', anchor: 'mechanism', target: paper });
  });

  test('a pinned inspector survives region changes; the instruments beneath follow', () => {
    const pinned = railReducer({ mode: 'region', anchor: 'mechanism' }, { type: 'inspect', target: paper });
    const moved = railReducer(pinned, { type: 'region', anchor: 'algorithm' });
    assert.deepEqual(moved, { mode: 'inspecting', anchor: 'algorithm', target: paper });
    assert.equal(railAnchor(moved), 'algorithm');
  });

  test('inspecting another object replaces it; the same object is a no-op', () => {
    const pinned = railReducer(INITIAL_RAIL_STATE, { type: 'inspect', target: paper });
    assert.equal(railReducer(pinned, { type: 'inspect', target: { type: 'paper', key: 'P19' } }), pinned);
    assert.deepEqual(railReducer(pinned, { type: 'inspect', target: equation }), { mode: 'inspecting', anchor: null, target: equation });
  });

  test('close returns to the region, or to idle when no region was active', () => {
    assert.deepEqual(railReducer({ mode: 'inspecting', anchor: 'formulation', target: equation }, { type: 'close' }), { mode: 'region', anchor: 'formulation' });
    assert.deepEqual(railReducer({ mode: 'inspecting', anchor: null, target: equation }, { type: 'close' }), INITIAL_RAIL_STATE);
    const region: RailState = { mode: 'region', anchor: 'scope' };
    assert.equal(railReducer(region, { type: 'close' }), region);
  });
});

describe('targets', () => {
  test('sameTarget compares by type and key', () => {
    assert.equal(sameTarget(paper, { type: 'paper', key: 'P19' }), true);
    assert.equal(sameTarget(paper, { type: 'paper', key: 'P20' }), false);
    assert.equal(sameTarget(paper, { type: 'term', slug: 'P19' }), false);
    assert.equal(sameTarget({ type: 'node', id: 'ms.section.5.2' }, { type: 'node', id: 'ms.section.5.2' }), true);
  });

  test('targetKey is stable', () => {
    assert.equal(targetKey(equation), 'equation:5.4');
    assert.equal(targetKey({ type: 'term', slug: 'kv-cache' }), 'term:kv-cache');
  });
});
