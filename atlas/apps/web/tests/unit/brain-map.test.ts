import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { brainMap, insideCerebrum, prng, type BrainChapter, type BrainPart, type BrainTerm } from '../../src/lib/brain-map.ts';

const DOMAINS = ['foundations', 'data', 'architecture', 'training', 'hardware', 'post-training', 'inference', 'serving', 'agents', 'embodied', 'evaluation'];
const parts: BrainPart[] = DOMAINS.map((domain, i) => ({ n: i + 1, numeral: String(i + 1), title: `Part ${String(i + 1)}`, domain, url: `/p${String(i + 1)}/` }));
const chapters: BrainChapter[] = Array.from({ length: 66 }, (_, i) => ({
  n: i + 1,
  number: String(i + 1).padStart(2, '0'),
  title: `Chapter ${String(i + 1)}`,
  url: `/ch${String(i + 1)}/`,
  part: Math.floor(i / 6) + 1,
  domain: DOMAINS[Math.floor(i / 6)] ?? 'foundations',
  written: i < 14,
}));
const terms: BrainTerm[] = Array.from({ length: 220 }, (_, i) => ({ term: `t${String(i)}`, chapter: (i % 14) + 1, url: `/t${String(i)}/` }));
const prereqs: [number, number][] = Array.from({ length: 65 }, (_, i) => [i + 1, i + 2]);

describe('brain map', () => {
  const brain = brainMap(parts, chapters, terms, [...prereqs, [1, 99]]);

  test('every chapter is a neuron and every neuron and concept lies inside the cerebrum', () => {
    assert.equal(brain.neurons.length, 66);
    assert.equal(brain.concepts.length, 220);
    for (const point of [...brain.neurons, ...brain.concepts]) assert.ok(insideCerebrum(point.x, point.y, 0.99), `(${String(point.x)}, ${String(point.y)}) is inside`);
  });

  test('fibres join known chapters only; one dendrite per concept', () => {
    assert.equal(brain.fibres.length, 65);
    assert.equal(brain.dendrites.length, brain.concepts.length);
  });

  test('deterministic for a seed', () => {
    const again = brainMap(parts, chapters, terms, prereqs);
    assert.equal(again.cerebrum, brain.cerebrum);
    assert.deepEqual(again.sulci, brain.sulci);
    const [a, b] = [prng(3), prng(3)];
    assert.equal(a(), b());
  });
});
