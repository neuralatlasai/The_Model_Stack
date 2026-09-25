import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { CitationKey, Inline } from '@atlas/core';
import { buildAnatomy, depthList, labelledSentences } from '../../src/lib/home-model.ts';

const text = (value: string): Inline => ({ kind: 'text', value });
const cite = (key: string): Inline => ({ kind: 'cite', key: key as CitationKey, resolved: true });

describe('home model', () => {
  test('a labelled sentence is the one just before the label, with the keys it cites', () => {
    const found = labelledSentences([
      text('Setup comes first. HELM made explicit that one metric is not an evaluation ('),
      { kind: 'label', label: 'PAPER-REPORTED' },
      text(' · '),
      cite('P50'),
      text('). The next sentence carries no label.'),
    ]);
    assert.equal(found.length, 1);
    assert.equal(found[0]?.label, 'PAPER-REPORTED');
    assert.equal(found[0]?.text, 'HELM made explicit that one metric is not an evaluation');
    assert.deepEqual(found[0]?.cites, ['P50']);
  });

  test('unlabelled prose yields nothing', () => {
    assert.deepEqual(labelledSentences([text('Plain prose without any evidence label.')]), []);
  });

  test('section anatomy is ordered and every depth appears', () => {
    const anatomy = buildAnatomy();
    assert.equal(anatomy[0]?.label, 'Scope');
    assert.deepEqual(
      [...new Set(anatomy.map((row) => row.depth))].sort(),
      depthList().map((depth) => depth.key).sort(),
    );
  });
});
