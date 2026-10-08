import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { citationField } from '../../src/lib/citation-field.ts';
import { discRadius, labConstellation } from '../../src/lib/lab-constellation.ts';
import { leadingName, monogram, monograms } from '../../src/lib/monogram.ts';

describe('monograms (labs, systems)', () => {
  test('derive a short mark from the recorded name only', () => {
    assert.equal(monogram('Allen Institute for AI (Ai2)'), 'Ai2');
    assert.equal(monogram('Max Planck Institute for Intelligent Systems (MPI-IS)'), 'MPI');
    assert.equal(monogram('Stanford CRFM'), 'CRFM');
    assert.equal(monogram('IBM Research AI'), 'IBM');
    assert.equal(monogram('Meta AI / FAIR'), 'Meta');
    assert.equal(monogram('OpenAI'), 'OAI');
    assert.equal(monogram('DeepSeek'), 'DS');
    assert.equal(monogram('Google DeepMind'), 'GDM');
    assert.equal(monogram('Hugging Face Research'), 'HF');
    assert.equal(monogram('Anthropic'), 'An');
    assert.equal(monogram('NVIDIA Research'), 'NV');
    assert.equal(leadingName('Mila – Quebec AI Institute'), 'Mila');
  });

  test('a set is made unique: colliding marks grow from their leading word', () => {
    const marks = monograms([
      'Salesforce AI Research',
      'Sakana AI',
      'Samsung Research AI',
      'Mistral AI',
      'Microsoft Research / Microsoft AI',
    ]);
    assert.deepEqual(marks, ['Sal', 'Sak', 'Sam', 'Mis', 'Mic']);
    assert.equal(new Set(marks).size, marks.length);
  });
});

describe('lab constellation', () => {
  const parts = [
    { n: 1, numeral: 'I', chapters: [1, 2, 3] },
    { n: 2, numeral: 'II', chapters: [4, 5, 6] },
    { n: 3, numeral: 'III', chapters: [7, 8, 9] },
  ];
  const chapters = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [String(n), { n, written: n <= 5 }]));
  const labs = [
    { key: 'a', chapters: [1], sectionsByChapter: { '1': 4 }, sections: 4 },
    { key: 'b', chapters: [1, 5], sectionsByChapter: { '1': 1, '5': 3 }, sections: 4 },
    { key: 'c', chapters: [2], sectionsByChapter: { '2': 9 }, sections: 9 },
    { key: 'd', chapters: [1, 2], sectionsByChapter: { '1': 1, '2': 1 }, sections: 2 },
    { key: 'idle', chapters: [], sectionsByChapter: {}, sections: 0 },
  ];

  test('the axis holds the parts with a written chapter; the rest share one planned zone', () => {
    const field = labConstellation(labs, parts, chapters);
    assert.deepEqual(
      field.bands.map((band) => band.numeral),
      ['I', 'II'],
    );
    assert.equal(field.slots.length, 6);
    assert.ok(field.planned !== null && field.planned.from === 'III' && field.planned.chapters === 3);
  });

  test('x is the footprint-weighted mean chapter; discs never overlap; idle labs are not drawn', () => {
    const field = labConstellation(labs, parts, chapters);
    assert.deepEqual(field.marks.map((mark) => mark.key).sort(), ['a', 'b', 'c', 'd']);
    const at = new Map(field.marks.map((mark) => [mark.key, mark]));
    assert.equal(at.get('a')?.at, 0);
    assert.equal(at.get('b')?.at, (0 * 1 + 4 * 3) / 4);
    assert.ok((at.get('c')?.r ?? 0) > (at.get('a')?.r ?? 0), 'more sections, larger disc');
    assert.equal(at.get('c')?.r, Math.round(discRadius(9) * 10) / 10);
    for (const [i, p] of field.marks.entries()) {
      for (const q of field.marks.slice(i + 1))
        assert.ok(Math.hypot(p.x - q.x, p.y - q.y) >= p.r + q.r - 0.2, `${p.key} and ${q.key} overlap`);
    }
  });

  test('links join labs that share a chapter, weighted by chapters shared', () => {
    const field = labConstellation(labs, parts, chapters);
    const weight = (a: string, b: string): number | undefined =>
      field.links.find((link) => (link.a === a && link.b === b) || (link.a === b && link.b === a))?.shared;
    assert.equal(weight('a', 'b'), 1);
    assert.equal(weight('a', 'd'), 1);
    assert.equal(weight('c', 'd'), 1);
    assert.equal(weight('a', 'c'), undefined);
  });
});

describe('citation field layouts', () => {
  test('the compact layout sets lane labels above the dots', () => {
    const works = [
      { key: 'P1', type: 'paper', year: 2020, weight: 2 },
      { key: 'P2', type: 'paper', year: 2021, weight: 1 },
      { key: 'D1', type: 'documentation', year: null, weight: 1 },
    ];
    const compact = citationField(works, ['paper', 'documentation'], {
      width: 400,
      labelW: 18,
      labelTop: 17,
      undatedW: 58,
    });
    for (const lane of compact.lanes) {
      assert.ok(lane.ly < lane.cy, 'label above the lane centre');
      for (const mark of compact.marks.filter((candidate) => candidate.type === lane.type))
        assert.ok(mark.y - mark.r >= lane.ly, 'dots clear the label');
    }
    const wide = citationField(works, ['paper', 'documentation']);
    for (const lane of wide.lanes) assert.equal(lane.ly, lane.cy + 4);
  });
});
