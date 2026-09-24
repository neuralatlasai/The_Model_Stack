import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { compareRows, siblingBlocks } from '../compare.ts';
import { blocksOfKind, documentFacts } from '../walk.ts';
import { sectionDoc, sibling, text } from './fixtures.ts';

describe('walk', () => {
  it('finds blocks nested in expansions and lists, in document order', () => {
    const numbers = blocksOfKind(sectionDoc(), 'equation').map((block) => block.number);
    assert.deepEqual(numbers, ['5.2', '5.3']);
  });

  it('collects cross-references from nested inline content', () => {
    const facts = documentFacts(sectionDoc());
    assert.deepEqual(facts.equationsDefined, ['5.2', '5.3']);
    assert.deepEqual(facts.equationsReferenced, ['5.1']);
    assert.deepEqual(
      facts.xrefs.map((xref) => `${xref.ref}:${xref.number}`),
      ['equation:5.1', 'algorithm:5.2'],
    );
  });
});

describe('compare rows', () => {
  it('returns the siblings of a document', () => {
    assert.deepEqual(
      siblingBlocks(sectionDoc()).map((block) => block.name),
      ['MQA', 'GQA'],
    );
  });

  it('marks rows whose answers differ and rows that are the same', () => {
    const rows = compareRows(siblingBlocks(sectionDoc()));
    const byField = new Map(rows.map((row) => [row.field, row]));
    assert.equal(rows.length, 6);
    assert.equal(byField.get('assumptionChanged')?.differs, true);
    // "None." and "none" are the same answer after normalisation.
    assert.equal(byField.get('objectiveChanged')?.differs, false);
    assert.equal(byField.get('objectiveChanged')?.answered, 2);
    // One answer and one omission: nothing to contrast.
    assert.equal(byField.get('problemSolved')?.differs, false);
    assert.equal(byField.get('problemSolved')?.answered, 1);
    assert.deepEqual(byField.get('problemSolved')?.cells[1], null);
  });

  it('keeps column order and titles from core', () => {
    const rows = compareRows([sibling('A', { whyExists: [text('x')] }), sibling('B', { whyExists: [text('y')] })]);
    assert.equal(rows[0]?.title, 'Why it exists');
    assert.equal(rows[0]?.differs, true);
  });
});
