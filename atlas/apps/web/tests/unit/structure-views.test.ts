import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { Neighbourhood, ResearchDocument } from '@atlas/core';
import { graphNode, nodeMeta, sectionDoc, sibling, text } from '../../src/lib/__tests__/fixtures.ts';
import { fieldAlternative, fieldNode, gapNote, sectionNumber } from '../../src/lib/compare-field.ts';
import { evidenceLedger, markSize, share } from '../../src/lib/evidence-ledger.ts';
import { mapGroup, MAP_ROLE_NOTES, neighbourhoodMap, nodeTag, tidyIdentity } from '../../src/lib/neighbourhood-map.ts';
import { stackFacts, wrapLabel } from '../../src/lib/stack-map.ts';
import type { StackChapter } from '../../src/lib/stack.ts';

describe('neighbourhood map (graph/[...slug])', () => {
  test('tags read as the rest of the atlas prints them', () => {
    assert.equal(nodeTag({ entityType: 'chapter', number: '05' }), '05');
    assert.equal(nodeTag({ entityType: 'section', number: '5.2' }), '§5.2');
    assert.equal(nodeTag({ entityType: 'part', number: 'IV' }), 'Part IV');
    assert.equal(nodeTag({ entityType: 'appendix', number: 'A' }), 'App A');
    assert.equal(nodeTag({ entityType: 'frontmatter', number: null }), null);
  });

  test('groups cap at the limit and count the rest as "+n more"', () => {
    const nodes = Array.from({ length: 11 }, (_, k) => graphNode({ id: `ms.chapter.${String(k + 1)}` as never, entityType: 'chapter', url: `/ch${String(k)}/` }));
    const group = mapGroup('dependents', nodes, 8);
    assert.equal(group.items.length, 7);
    assert.equal(group.more, 4);
    assert.equal(group.items[0]?.map, '/graph/ch0/');
    assert.equal(mapGroup('dependents', nodes.slice(0, 8), 8).more, 0);
  });

  test('the text twin keeps every relation, uncapped, in reading order, and drops empty groups', () => {
    const node = (id: string) => graphNode({ id: id as never, entityType: 'chapter', url: `/${id}/` });
    const hood: Neighbourhood = {
      node: node('ms.chapter.1'),
      ancestors: [],
      children: [],
      siblings: [node('ms.chapter.2')],
      prerequisites: [],
      dependents: Array.from({ length: 12 }, (_, k) => node(`ms.chapter.${String(k + 10)}`)),
      related: [],
      alternatives: [],
    };
    const map = neighbourhoodMap(hood);
    assert.deepEqual(
      map.twin.map((group) => group.role),
      ['dependents', 'siblings'],
    );
    assert.equal(map.twin[0]?.items.length, 12);
    assert.equal(map.dependents.more, 5);
    for (const note of Object.values(MAP_ROLE_NOTES)) assert.ok(note.split(' ').length <= 6, `helper label too long: ${note}`);
  });

  test('a planned node without a summary reads its planned artifact', () => {
    const planned = graphNode({
      id: 'ms.chapter.40',
      entityType: 'chapter',
      url: '/ch40/',
      hasManuscript: false,
      plan: { artifact: 'A calibrated quantizer', prerequisitesText: null, outcome: null, sections: [] },
    });
    const map = neighbourhoodMap({ node: planned, ancestors: [], children: [], siblings: [], prerequisites: [], dependents: [], related: [], alternatives: [] });
    assert.equal(map.center.summary, 'Planned artifact: A calibrated quantizer');
  });

  test('the identity line drops the part title’s repeated numeral', () => {
    assert.equal(
      tidyIdentity('VOLUME I / PART I — PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 01'),
      'VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 01',
    );
    assert.equal(tidyIdentity('VOLUME I / PART I — SCIENTIFIC FOUNDATIONS'), 'VOLUME I / PART I — SCIENTIFIC FOUNDATIONS');
  });
});

describe('stack map labels (graph index)', () => {
  test('wraps on words into at most two lines, with an ellipsis only when text is left over', () => {
    assert.deepEqual(wrapLabel('Lifecycle as a system', 18, 2), ['Lifecycle as a', 'system']);
    assert.deepEqual(wrapLabel('Objectives', 18, 2), ['Objectives']);
    const long = wrapLabel('Accelerators, memory hierarchy, and performance models', 18, 2);
    assert.equal(long.length, 2);
    assert.ok(long.every((line) => line.length <= 18));
    assert.ok(long[1]?.endsWith('…'));
  });

  test('hyphenated compounds break after a hyphen instead of being cut mid-word', () => {
    const lines = wrapLabel('Vision-language-action policies and embodied agents', 18, 2);
    assert.equal(lines[0], 'Vision-language-');
    assert.ok(lines[1]?.startsWith('action'));
  });

  test('facts name the keystone and the deepest chapter from the transitive counts', () => {
    const chapter = (n: number, upstream: number, downstream: number, written = false): StackChapter => ({
      n,
      id: `ms.chapter.${String(n)}`,
      number: String(n).padStart(2, '0'),
      title: `Chapter ${String(n)}`,
      short: `C${String(n)}`,
      url: `/ch${String(n)}/`,
      part: 1,
      domain: 'foundations',
      written,
      summary: '',
      sectionsWritten: 0,
      sectionsTotal: 6,
      figures: 0,
      equations: 0,
      prereqs: [],
      unlocks: [],
      upstream,
      downstream,
    });
    const facts = stackFacts([chapter(1, 0, 3, true), chapter(2, 1, 1), chapter(3, 2, 0), chapter(4, 3, 0)]);
    assert.equal(facts.written, 1);
    assert.equal(facts.total, 4);
    assert.equal(facts.keystone?.n, 1);
    assert.equal(facts.deepest?.n, 4);
  });
});

describe('compare field', () => {
  test('one flag per differential question, in order; plain-text why and change', () => {
    const alt = fieldAlternative(sibling('GQA', { whyExists: [text('to cut KV bytes.')], changedPrimitive: [text('H K/V heads → G groups')] }));
    assert.deepEqual(alt.stated, [true, false, false, false, false, true]);
    assert.equal(alt.why, 'to cut KV bytes.');
    assert.equal(alt.change, 'H K/V heads → G groups');
  });

  test('a node counts answers across its alternatives', () => {
    const node = fieldNode({
      id: 'ms.section.5.2',
      number: '05.2',
      title: 'Attention calculation',
      href: '/compare/ch05/05-2/',
      siblings: [sibling('MQA', { whyExists: [text('a')], problemSolved: [text('b')] }), sibling('GQA', {})],
    });
    assert.equal(node.number, '5.2');
    assert.equal(node.answered, 2);
    assert.equal(node.possible, 12);
    assert.equal(gapNote(node.answered, node.possible), '10 answers not stated');
    assert.equal(gapNote(12, 12), 'every question answered');
    assert.equal(gapNote(11, 12), '1 answer not stated');
  });

  test('section numbers lose a chapter’s leading zero only', () => {
    assert.equal(sectionNumber('02.1'), '2.1');
    assert.equal(sectionNumber('10.4'), '10.4');
    assert.equal(sectionNumber('1.3'), '1.3');
  });
});

describe('evidence ledger', () => {
  const labelled = (id: string, chapter: number, entityType: 'section' | 'verification', labels: readonly string[]): ResearchDocument => {
    const base = sectionDoc();
    return {
      ...base,
      meta: nodeMeta(id as never, { chapter, entityType }),
      regions: [
        {
          role: 'formulation',
          title: 'Formulation',
          anchor: 'formulation',
          depth: 'technical',
          blocks: [
            {
              kind: 'paragraph',
              anchor: null,
              depth: 'overview',
              content: labels.map((label) => ({ kind: 'label', label }) as never),
            },
          ],
        },
      ],
    };
  };

  test('counts labels per chapter over the documents it is told to count', () => {
    const docs = [
      labelled('ms.section.5.1', 5, 'section', ['DERIVED', 'DERIVED', 'PAPER-REPORTED']),
      labelled('ms.section.7.1', 7, 'section', ['PAPER-REPORTED']),
      labelled('ms.verification.7', 7, 'verification', ['EMPIRICALLY-OBSERVED']),
    ];
    const ledger = evidenceLedger(docs, (doc) => doc.meta.entityType === 'section');
    assert.deepEqual(ledger.chapters, [5, 7]);
    assert.equal(ledger.count('DERIVED', 5), 2);
    assert.equal(ledger.count('PAPER-REPORTED', 7), 1);
    assert.equal(ledger.labelTotal('EMPIRICALLY-OBSERVED'), 0, 'verification pages name labels; they are not counted');
    assert.equal(ledger.chapterTotal(5), 3);
    assert.equal(ledger.total, 4);
    assert.equal(ledger.max, 2);
  });

  test('mark area is proportional to the count; zero draws nothing', () => {
    assert.equal(markSize(0, 100), 0);
    assert.equal(markSize(100, 100), 20);
    assert.equal(markSize(25, 100), 10);
    assert.equal(markSize(1, 1000), 3, 'a single statement is still visible');
  });

  test('shares round to whole percent, with "<1%" for a sliver', () => {
    assert.equal(share(1, 3), '33%');
    assert.equal(share(1, 400), '<1%');
    assert.equal(share(0, 10), '0%');
    assert.equal(share(3, 0), '0%');
  });
});
