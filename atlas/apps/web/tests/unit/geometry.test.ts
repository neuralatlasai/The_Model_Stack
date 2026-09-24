import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { citationField, radiusFor } from '../../src/lib/citation-field.ts';
import { lineageMinimap } from '../../src/lib/lineage-minimap.ts';
import { lineageStrip, relationKey } from '../../src/lib/lineage-strip.ts';

const RELATIONS = ['conceptual ancestor', 'engineering optimization', 'alternative branch', 'superseded approach', 'current frontier'];

/** A deterministic, lineage-shaped sample: sparse early years, dense recent ones. */
function entries(): { id: number; year: number; work: string; relation: string; chapter: number }[] {
  const years = [1948, 1979, 1985, 1991, 2010, 2013, 2013, 2015, 2017, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2022, 2024];
  for (let i = 0; i < 20; i += 1) years.push(2024);
  return years.map((year, id) => ({ id, year, work: `w${String(id)}`, relation: RELATIONS[id % RELATIONS.length] ?? 'conceptual ancestor', chapter: (id % 9) + 1 }));
}

function minGap(points: readonly { x: number; y: number; r?: number }[]): number {
  let gap = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const a = points[i];
      const b = points[j];
      if (a === undefined || b === undefined) continue;
      gap = Math.min(gap, Math.hypot(a.x - b.x, a.y - b.y) - (a.r ?? 0) - (b.r ?? 0));
    }
  }
  return gap;
}

describe('lineage strip (home)', () => {
  test('places every entry once, deterministically, with no overlapping dots', () => {
    const input = entries();
    const a = lineageStrip(input);
    const b = lineageStrip(input);
    assert.deepEqual(a, b);
    assert.equal(a.marks.length, input.length);
    assert.deepEqual(new Set(a.marks.map((mark) => mark.id)), new Set(input.map((entry) => entry.id)));
    assert.ok(minGap(a.marks) >= 7.5, 'dot centres are at least one pitch apart');
  });

  test('dots sit on or above the axis, and year labels never collide', () => {
    const strip = lineageStrip(entries());
    for (const mark of strip.marks) {
      assert.ok(mark.y < strip.axisY && mark.y > 0);
      assert.ok(mark.x - 3.2 >= 0 && mark.x + 3.2 <= strip.width, `a dense last year stays inside the drawing (x = ${String(mark.x)})`);
    }
    for (let i = 1; i < strip.ticks.length; i += 1) {
      const gap = (strip.ticks[i]?.x ?? 0) - (strip.ticks[i - 1]?.x ?? 0);
      assert.ok(gap >= 36, `ticks ${String(i - 1)}–${String(i)} are ${String(gap)} apart`);
    }
    assert.equal(strip.ticks.at(-1)?.label, '2024', 'the last year always keeps its label');
  });

  test('year columns carry their relation mix and cover their own dots', () => {
    const strip = lineageStrip(entries());
    const y2019 = strip.years.find((year) => year.year === 2019);
    assert.equal(y2019?.count, 7);
    assert.equal(Object.values(y2019?.byRelation ?? {}).reduce((sum, n) => sum + n, 0), 7);
    for (const mark of strip.marks) {
      const column = strip.years.find((year) => year.year === mark.year);
      assert.ok(column !== undefined && mark.x >= column.x0 - 8 && mark.x <= column.x1 + 8);
    }
  });

  test('unknown relations fall back to the ancestor key', () => {
    assert.equal(relationKey('current frontier'), 'fro');
    assert.equal(relationKey('something else'), 'anc');
  });
});

describe('lineage minimap (timeline)', () => {
  test('one dot per entry, inside its relation lane, no overlaps, below the lane header', () => {
    const input = entries();
    const map = lineageMinimap(input, 360, 640);
    assert.equal(map.marks.length, input.length);
    assert.ok(minGap(map.marks) >= 7.3);
    for (const mark of map.marks) {
      const lane = map.lanes.find((candidate) => candidate.key === mark.relationKey);
      assert.ok(lane !== undefined && mark.x > lane.x0 && mark.x < lane.x1, `mark ${String(mark.id)} is inside its lane`);
      assert.ok(mark.y >= map.top && mark.y <= map.height);
    }
  });

  test('time runs downward: later years never sit above earlier ones in a lane', () => {
    const map = lineageMinimap(entries(), 360, 640);
    for (const lane of map.lanes) {
      const own = map.marks.filter((mark) => mark.relationKey === lane.key).sort((a, b) => a.year - b.year);
      for (let i = 1; i < own.length; i += 1) {
        const previous = own[i - 1];
        const current = own[i];
        if (previous !== undefined && current !== undefined && current.year > previous.year) assert.ok(current.y >= previous.y - 0.01);
      }
    }
  });

  test('every populated year owns a band that contains its dots', () => {
    const map = lineageMinimap(entries(), 360, 640);
    for (const mark of map.marks) {
      const band = map.years.find((year) => year.year === mark.year);
      assert.ok(band !== undefined && mark.y >= band.y0 - 0.01 && mark.y <= band.y1 + 0.01, `year ${String(mark.year)}`);
    }
  });
});

describe('citation field (papers)', () => {
  const works = [
    ...Array.from({ length: 40 }, (_, i) => ({ key: `P${String(i)}`, type: 'paper', year: 2015 + (i % 11), weight: i % 6 })),
    ...Array.from({ length: 12 }, (_, i) => ({ key: `D${String(i)}`, type: 'documentation', year: null, weight: 1 })),
    { key: 'R1', type: 'repository', year: 2020, weight: 0 },
  ];

  test('every work is placed once, lanes follow the given type order, and dots never overlap', () => {
    const field = citationField(works, ['paper', 'technical report', 'repository', 'documentation']);
    assert.equal(field.marks.length, works.length);
    assert.deepEqual(
      field.lanes.map((lane) => lane.type),
      ['paper', 'repository', 'documentation'],
      'empty types are dropped; order is kept',
    );
    for (const lane of field.lanes) {
      const own = field.marks.filter((mark) => mark.type === lane.type);
      assert.ok(minGap(own) >= 1.2, `${lane.type} dots keep a gap`);
      for (const mark of own) assert.ok(mark.y - mark.r >= lane.y0 && mark.y + mark.r <= lane.y1);
    }
  });

  test('undated works gather in their own column; size grows with the chapters that draw on a work', () => {
    const field = citationField(works, ['paper', 'repository', 'documentation']);
    assert.ok(field.undatedX !== null);
    for (const mark of field.marks.filter((candidate) => candidate.year === null)) assert.ok(mark.x > field.x1);
    assert.ok(radiusFor(5) > radiusFor(3) && radiusFor(3) > radiusFor(1) && radiusFor(1) > radiusFor(0));
    assert.equal(field.ticks.at(-1)?.label, 'undated');
  });
});
