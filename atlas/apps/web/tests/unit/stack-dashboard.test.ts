import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { closure } from '../../src/lib/stack-dashboard.ts';
import { STORY_PARTS, runs } from '../../src/lib/home-story.ts';

describe('stack dashboard', () => {
  // 1 → 2 → 3, 1 → 4 (edges are [prerequisite, chapter])
  const edges: [number, number][] = [
    [1, 2],
    [2, 3],
    [1, 4],
  ];

  test('rests-on is the transitive closure of prerequisites', () => {
    const up = closure(edges, 'up');
    assert.deepEqual([...(up.get(3) ?? [])].sort(), [1, 2]);
    assert.deepEqual([...(up.get(4) ?? [])], [1]);
    assert.equal(up.get(1)?.size ?? 0, 0);
  });

  test('feeds is the transitive closure of dependents', () => {
    const down = closure(edges, 'down');
    assert.deepEqual([...(down.get(1) ?? [])].sort(), [2, 3, 4]);
    assert.equal(down.get(3)?.size ?? 0, 0);
  });

  test('a cycle terminates', () => {
    const up = closure([[1, 2], [2, 1]], 'up');
    assert.ok((up.get(1)?.size ?? 0) <= 2);
  });
});

describe('home story', () => {
  test('one step per part, in order, each with body and outcome', () => {
    assert.deepEqual(
      STORY_PARTS.map((part) => part.n),
      Array.from({ length: 11 }, (_, i) => i + 1),
    );
    for (const part of STORY_PARTS) assert.ok(part.heading.length > 0 && part.body.length > 0 && part.outcome.length > 0);
  });

  test('bold markup splits into runs', () => {
    assert.deepEqual(runs('a **b** c'), [
      { text: 'a ', bold: false },
      { text: 'b', bold: true },
      { text: ' c', bold: false },
    ]);
  });
});
