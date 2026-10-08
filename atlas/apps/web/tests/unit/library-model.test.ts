import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { WEAVE, compactCount, splitThesis, weaveLayout } from '../../src/lib/library-model.ts';

describe('library thesis markers', () => {
  test('a bare "Thesis." marker is stripped', () => {
    assert.deepEqual(splitThesis('Thesis. A training program is trustworthy.'), {
      text: 'A training program is trustworthy.',
      label: null,
    });
  });

  test('an evidence label before the marker is kept, lower-cased', () => {
    assert.deepEqual(splitThesis('DERIVED — thesis. A dense architecture must be specified.'), {
      text: 'A dense architecture must be specified.',
      label: 'derived',
    });
    assert.deepEqual(splitThesis('NOT DISCLOSED — thesis. Unknown.'), { text: 'Unknown.', label: 'not disclosed' });
  });

  test('prose without a marker is untouched', () => {
    const text = 'A foundation model is not an artifact but a gated sequence of interventions.';
    assert.deepEqual(splitThesis(`  ${text} `), { text, label: null });
    assert.deepEqual(splitThesis('The thesis. of it'), { text: 'The thesis. of it', label: null });
  });
});

describe('prerequisite weave layout', () => {
  const parts = [
    { n: 1, chapters: [1, 2, 3] },
    { n: 2, chapters: [4, 5, 6] },
  ];
  const layout = weaveLayout(parts, [
    [1, 2],
    [1, 6],
    [3, 4],
    [2, 9],
  ]);

  test('chapters sit in book order, one slot each, with a gap between parts', () => {
    assert.equal(layout.slots, 6 + WEAVE.gap);
    assert.equal(layout.x.get(1), 0.5);
    assert.equal(layout.x.get(3), 2.5);
    assert.equal(layout.x.get(4), 3.5 + WEAVE.gap);
    assert.deepEqual(
      layout.parts.map((part) => [part.n, part.from, part.to]),
      [
        [1, 0, 3],
        [2, 3 + WEAVE.gap, 6 + WEAVE.gap],
      ],
    );
  });

  test('edges to unknown chapters are dropped; the longest arch comes first', () => {
    assert.deepEqual(
      layout.arcs.map((arc) => [arc.p, arc.n]),
      [
        [1, 6],
        [3, 4],
        [1, 2],
      ],
    );
  });

  test('every arch starts and ends on the baseline and rises with its span', () => {
    const lift = (d: string): number => {
      const numbers = d.match(/-?\d+(?:\.\d+)?/gu)?.map(Number) ?? [];
      assert.equal(numbers.length, 8);
      assert.equal(numbers[1], WEAVE.height);
      assert.equal(numbers[7], WEAVE.height);
      return WEAVE.height - (numbers[3] ?? 0);
    };
    const [long, mid, short] = layout.arcs.map((arc) => lift(arc.d));
    assert.ok((long ?? 0) > (mid ?? 0) && (mid ?? 0) > (short ?? 0) && (short ?? 0) > 0);
    assert.ok((long ?? 0) <= (WEAVE.height * 4) / 3);
  });
});

describe('compact counts', () => {
  test('words as tiles show them', () => {
    assert.equal(compactCount(0), '—');
    assert.equal(compactCount(940), '940');
    assert.equal(compactCount(1234), '1.2k');
    assert.equal(compactCount(26293), '26k');
  });
});
