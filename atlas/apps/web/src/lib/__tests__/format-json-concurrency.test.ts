import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { LineageEntry } from '@atlas/core';
import { mapBounded } from '../concurrency.ts';
import {
  clip,
  compareStrings,
  formatDay,
  formatMonthYear,
  grouped,
  isoDate,
  padChapter,
  plural,
  roman,
  squash,
  stateLabel,
  updatedLabel,
  yearSortKey,
} from '../format.ts';
import { jsonForHtml } from '../json.ts';
import { groupByYear, relationCounts } from '../lineage.ts';

describe('format', () => {
  it('formats ISO dates without locale dependence', () => {
    assert.equal(formatMonthYear('2026-09-20'), 'Sep 2026');
    assert.equal(formatDay('2026-09-05'), '5 Sep 2026');
    assert.equal(updatedLabel('2026-01-31'), 'updated Jan 2026');
    assert.equal(formatDay('2026-09-23T17:52:19.762Z'), '23 Sep 2026');
    assert.equal(isoDate('2026-09-23T17:52:19.762Z'), '2026-09-23');
  });

  it('returns unparseable dates unchanged', () => {
    assert.equal(formatMonthYear('September'), 'September');
    assert.equal(formatDay('2026-13-01'), '2026-13-01');
    assert.equal(isoDate('n/a'), null);
  });

  it('formats counts, numbers, and states', () => {
    assert.equal(plural(1, 'section'), '1 section');
    assert.equal(plural(396, 'section'), '396 sections');
    assert.equal(grouped(1234567), '1,234,567');
    assert.equal(padChapter(5), '05');
    assert.equal(stateLabel('manuscript_draft'), 'manuscript draft');
    assert.equal(stateLabel('planned'), 'planned');
  });

  it('writes roman numerals for volumes and parts', () => {
    assert.deepEqual([1, 4, 9, 11, 40, 1990].map(roman), ['I', 'IV', 'IX', 'XI', 'XL', 'MCMXC']);
    assert.equal(roman(0), '0');
  });

  it('clips and squashes text', () => {
    assert.equal(clip('abcdef', 10), 'abcdef');
    assert.equal(clip('abcdef', 4), 'abc…');
    assert.equal(clip('abcdef', 4).length, 4);
    assert.equal(squash('  a \n b\t c '), 'a b c');
  });

  it('sorts lineage years with open-ended years after their base year', () => {
    assert.ok(yearSortKey('2025') < yearSortKey('2025+'));
    assert.ok(yearSortKey('2025+') < yearSortKey('2026'));
    assert.equal(yearSortKey('unknown'), Number.POSITIVE_INFINITY);
    assert.deepEqual(['b', 'a', 'B'].sort(compareStrings), ['B', 'a', 'b']);
  });
});

describe('jsonForHtml', () => {
  it('cannot terminate or comment out the script element that holds it', () => {
    const value = { a: '</script><script>alert(1)</script>', b: '<!-- x -->', c: 'a & b > c', d: '  ' };
    const html = jsonForHtml(value);
    for (const forbidden of ['<', '>', '&', ' ', ' ']) assert.equal(html.includes(forbidden), false);
    assert.deepEqual(JSON.parse(html), value);
  });

  it('rejects values JSON cannot represent', () => {
    assert.throws(() => jsonForHtml(undefined), TypeError);
  });
});

describe('mapBounded', () => {
  it('keeps input order and never exceeds the limit', async () => {
    let inFlight = 0;
    let peak = 0;
    const result = await mapBounded([5, 1, 4, 2, 3], 2, async (value) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise<void>((resolve) => {
        setImmediate(resolve);
      });
      inFlight -= 1;
      return value * 10;
    });
    assert.deepEqual(result, [50, 10, 40, 20, 30]);
    assert.ok(peak <= 2);
  });

  it('rejects with the first failure and stops taking new work', async () => {
    const started: number[] = [];
    await assert.rejects(
      mapBounded([1, 2, 3, 4, 5, 6], 1, async (value) => {
        started.push(value);
        if (value === 2) throw new Error('boom');
        return value;
      }),
      /boom/u,
    );
    assert.deepEqual(started, [1, 2]);
  });

  it('wraps non-Error rejections and validates the limit', async () => {
    await assert.rejects(
      mapBounded([1], 1, async () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error -- deliberately throws a non-Error to verify mapBounded wraps it
        throw 'plain string';
      }),
      (error: unknown) => error instanceof Error && error.cause === 'plain string',
    );
    await assert.rejects(mapBounded([1], 0, async (value) => value), RangeError);
    assert.deepEqual(await mapBounded([], 4, async (value) => value), []);
  });
});

describe('lineage grouping', () => {
  const entry = (year: string, relation: LineageEntry['relation']): LineageEntry => ({
    year,
    work: `work ${year}`,
    relation,
    cite: null,
    nodeId: 'ms.chapter.5',
    note: [],
  });

  it('groups by year in chronological order', () => {
    const groups = groupByYear([
      entry('2025+', 'current frontier'),
      entry('2017', 'conceptual ancestor'),
      entry('2025', 'engineering optimization'),
      entry('2017', 'alternative branch'),
    ]);
    assert.deepEqual(
      groups.map((group) => `${group.year}:${String(group.entries.length)}`),
      ['2017:2', '2025:1', '2025+:1'],
    );
  });

  it('counts every relation, including absent ones', () => {
    const counts = relationCounts([entry('2017', 'conceptual ancestor')]);
    assert.equal(counts.length, 5);
    assert.equal(counts.find((row) => row.relation === 'conceptual ancestor')?.count, 1);
    assert.equal(counts.find((row) => row.relation === 'current frontier')?.count, 0);
  });
});
