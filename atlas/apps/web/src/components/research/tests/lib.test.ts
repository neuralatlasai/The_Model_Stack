/**
 * Unit tests for the research renderers' pure view logic (URL safety, inline
 * dispatch, table profiling, algorithm rows, provenance, glyph vocabulary,
 * header anatomy, block traversal, figure copies, build-time TeX).
 * Run: node --test apps/web/src/components/research/tests/
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AlgorithmBlock, Block, SiblingBlock, TableBlock } from '@atlas/core';
import { figureCopy, figureLabel, isCalculator } from '../lib/figure.ts';
import { evidenceDots, orderedCounts, referenceStatusGlyph, roleLabel, roleOrdinal } from '../lib/grammar.ts';
import { derivedMetaLine, identityLine, sentenceCase } from '../lib/header.ts';
import { inlineView } from '../lib/inline.ts';
import { algorithmRows, indented, provenanceItem, truncate } from '../lib/objects.ts';
import { hasRowHeader, isNumericCell, isTallTable, profileColumns, tableLabel, TALL_TABLE_ROWS } from '../lib/table.ts';
import { renderDisplayTex } from '../lib/tex.ts';
import { derivedEquation, isInternalHref, isSafeExternalHref, withBase } from '../lib/url.ts';
import { blocksOfKind, findBlock, findDefinition, iterateBlocks, regionSiblings } from '../lib/walk.ts';
import { CALCULATOR, documentWith, HEADER, META, para, ROUTE, STATS, text } from './fixtures.ts';

describe('url', () => {
  it('prefixes root-relative paths with the deploy base and leaves others alone', () => {
    assert.equal(withBase('/papers/p01/', '/'), '/papers/p01/');
    assert.equal(withBase('/papers/p01/', '/atlas/'), '/atlas/papers/p01/');
    assert.equal(withBase('/papers/p01/', '/atlas'), '/atlas/papers/p01/');
    assert.equal(withBase('#eq-5-4', '/atlas/'), '#eq-5-4');
    assert.equal(withBase('https://arxiv.org/abs/1706.03762', '/atlas/'), 'https://arxiv.org/abs/1706.03762');
    assert.equal(withBase('//evil.example/x', '/atlas/'), '//evil.example/x');
  });

  it('accepts only http(s) and mailto as external links', () => {
    assert.equal(isSafeExternalHref('https://pytorch.org/docs/'), true);
    assert.equal(isSafeExternalHref('mailto:editor@example.org'), true);
    assert.equal(isSafeExternalHref('javascript:alert(1)'), false);
    assert.equal(isSafeExternalHref('data:text/html,<b>x</b>'), false);
    assert.equal(isSafeExternalHref('../relative.md'), false);
  });

  it('treats root-relative paths and fragments as internal, protocol-relative as not', () => {
    assert.equal(isInternalHref('/ch05/'), true);
    assert.equal(isInternalHref('#scope'), true);
    assert.equal(isInternalHref('//cdn.example/'), false);
    assert.equal(isInternalHref('https://example.org/'), false);
  });

  it('parses DERIVED equation sources into anchors', () => {
    assert.deepEqual(derivedEquation('DERIVED:eq-5.8'), { number: '5.8', anchor: 'eq-5-8' });
    assert.deepEqual(derivedEquation(' DERIVED: eq-42.1 '), { number: '42.1', anchor: 'eq-42-1' });
    assert.equal(derivedEquation('P19'), null);
  });
});

describe('inlineView', () => {
  const base = '/atlas/';
  it('keeps text as text (tokens like <bos> are escaped by the template, never parsed)', () => {
    assert.deepEqual(inlineView(text('<bos>'), base), { kind: 'text', value: '<bos>' });
  });

  it('maps link targets to link, planned, external, and plain views', () => {
    const children = [text('§5.1')];
    const node = inlineView({ kind: 'link', target: { type: 'node', nodeId: 'ms.section.5.1', anchor: null, href: '/ch05/05-1/' }, children }, base);
    assert.equal(node.kind, 'link');
    assert.equal(node.kind === 'link' ? node.href : '', '/atlas/ch05/05-1/');
    // Internal links carry their node id: the client shows a preview card (written or planned, what it holds).
    assert.equal(node.kind === 'link' ? node.node : '', 'ms.section.5.1');

    const planned = inlineView({ kind: 'link', target: { type: 'planned', nodeId: 'ms.section.14.1', href: '/ch14/14-1/' }, children }, base);
    assert.equal(planned.kind === 'link' ? `${planned.className}|${planned.node ?? ''}` : '', 'rb-link rb-planned|ms.section.14.1');

    const external = inlineView({ kind: 'link', target: { type: 'external', href: 'https://arxiv.org/abs/2205.14135' }, children }, base);
    assert.equal(external.kind === 'link' ? `${external.href}|${external.rel ?? ''}|${external.node ?? 'none'}` : '', 'https://arxiv.org/abs/2205.14135|noopener|none');

    assert.equal(inlineView({ kind: 'link', target: { type: 'unresolved', raw: 'x.md' }, children }, base).kind, 'plain');
  });

  it('degrades unsafe hrefs to plain text', () => {
    const children = [text('click')];
    assert.equal(inlineView({ kind: 'link', target: { type: 'external', href: 'javascript:alert(1)' }, children }, '/').kind, 'plain');
    assert.equal(
      inlineView({ kind: 'link', target: { type: 'node', nodeId: 'ms.root', anchor: null, href: 'javascript:alert(1)' }, children }, '/').kind,
      'plain',
    );
  });

  it('resolves xrefs to data-xref values and keeps unresolved ones as text', () => {
    const resolved = inlineView(
      { kind: 'xref', ref: 'equation', number: '5.4', text: 'Eq. 5.4', target: { nodeId: 'ms.section.5.2', anchor: 'eq-5-4', href: '/ch05/05-2/#eq-5-4' } },
      '/',
    );
    assert.deepEqual(resolved, { kind: 'xref', href: '/ch05/05-2/#eq-5-4', xref: 'equation:5.4', text: 'Eq. 5.4' });
    assert.deepEqual(inlineView({ kind: 'xref', ref: 'figure', number: '9.9', text: 'Figure 9.9', target: null }, '/'), {
      kind: 'xref-missing',
      text: 'Figure 9.9',
    });
  });
});

describe('table profiling', () => {
  const sections: TableBlock = {
    kind: 'table',
    anchor: null,
    depth: 'overview',
    role: 'sections',
    wide: false,
    columns: [
      { header: [text('§')], align: null },
      { header: [text('Title')], align: null },
      { header: [text('What changes here')], align: null },
    ],
    rows: [
      [[text('5.1')], [text('End-to-end forward pass')], [text('The model becomes a typed trace')]],
      [[text('5.2')], [text('Attention calculation')], [text('A score matrix appears')]],
    ],
  };

  it('recognises quantities and rejects prose', () => {
    for (const cell of ['5.1', '8 GiB', '1,024', '≈ 4×', '2.5e9', '−3', '12 ms', '64%']) assert.equal(isNumericCell(cell), true, cell);
    for (const cell of ['P01', 'H_q', 'End-to-end', '', 'a score matrix appears after 5 steps']) assert.equal(isNumericCell(cell), false, cell);
  });

  it('marks numeric and emphasis columns for the sections role', () => {
    const [number, title, changes] = profileColumns(sections);
    assert.equal(number?.numeric, true);
    assert.equal(number?.align, 'right');
    assert.equal(title?.numeric, false);
    assert.equal(changes?.emphasis, true);
    assert.equal(hasRowHeader(sections), false);
    assert.equal(tableLabel(sections), 'Table: §, Title, What changes here');
  });

  it('flags relation grids as row-headed and long tables as tall', () => {
    assert.equal(hasRowHeader({ ...sections, role: 'position' }), true);
    const rows = Array.from({ length: TALL_TABLE_ROWS + 1 }, () => [[text('x')], [text('y')], [text('z')]]);
    assert.equal(isTallTable({ ...sections, rows }), true);
    assert.equal(isTallTable(sections), false);
  });
});

describe('algorithm rows', () => {
  const block: AlgorithmBlock = {
    kind: 'algorithm',
    anchor: 'alg-5-2',
    depth: 'technical',
    number: '5.2',
    name: 'Causal attention',
    input: [],
    output: [],
    state: [],
    invariant: [],
    lines: [
      { n: 1, code: 'S ← Q·Kᵀ', comment: '[B, H, T, T]', indent: 0 },
      { n: null, code: 'continued', comment: null, indent: 4 },
      { n: 2, code: 'return S', comment: null, indent: 0 },
    ],
    trailer: [],
    complexity: null,
  };

  it('groups continuation lines under their numbered line and ids each numbered line', () => {
    const rows = algorithmRows(block);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.id, 'alg-5-2-L1');
    assert.equal(rows[0]?.lines.length, 2);
    assert.equal(rows[1]?.id, 'alg-5-2-L2');
    assert.equal(algorithmRows({ ...block, anchor: null })[0]?.id, null);
  });

  it('preserves indentation as leading spaces', () => {
    assert.equal(indented({ n: null, code: 'x', comment: null, indent: 4 }), '    x');
  });
});

describe('claim provenance', () => {
  it('maps sources to cite, equation, documentation, and text items', () => {
    assert.deepEqual(provenanceItem({ raw: 'P19', type: 'paper', key: 'P19' }), { type: 'cite', key: 'P19' });
    assert.deepEqual(provenanceItem({ raw: 'DERIVED:eq-5.8', type: 'derived', key: null }), { type: 'equation', number: '5.8', anchor: 'eq-5-8' });
    assert.deepEqual(provenanceItem({ raw: 'OD:vllm-docs', type: 'official-doc', key: null }), { type: 'doc', id: 'vllm-docs' });
    assert.deepEqual(provenanceItem({ raw: 'author note', type: 'other', key: null }), { type: 'text', text: 'author note' });
  });

  it('truncates at a word boundary', () => {
    assert.equal(truncate('Attention Is All You Need', 60), 'Attention Is All You Need');
    assert.equal(truncate('FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness', 40), 'FlashAttention: Fast and…');
    assert.equal(truncate('Supercalifragilisticexpialidocious words', 12), 'Supercalifr…');
    assert.ok(truncate('a '.repeat(80), 20).length <= 20);
  });
});

describe('grammar', () => {
  it('numbers roles in contract order and ignores other', () => {
    assert.equal(roleOrdinal('scope'), '01');
    assert.equal(roleOrdinal('formulation'), '04');
    assert.equal(roleOrdinal('references'), '15');
    assert.equal(roleOrdinal('why-chapter'), '01');
    assert.equal(roleOrdinal('other'), null);
    assert.equal(roleLabel('other', 'Notes'), 'Notes');
    assert.equal(roleLabel('siblings', 'Siblings'), 'Siblings');
  });

  it('orders evidence counts canonically and scales large dot matrices', () => {
    const entries = orderedCounts({ UNVERIFIED: 1, 'PAPER-REPORTED': 2, DERIVED: 0 });
    assert.deepEqual(
      entries.map((entry) => `${entry.marker.short}:${entry.count}:${entry.marker.glyph}`),
      ['UNVERIFIED:1:○', 'PAPER:2:●'],
    );
    const small = evidenceDots({ 'PAPER-REPORTED': 3, ASSUMED: 2 });
    assert.equal(small.scale, 1);
    assert.equal(small.dots.length, 5);
    const large = evidenceDots({ 'PAPER-REPORTED': 100, ASSUMED: 30 }, 64);
    assert.equal(large.scale, 3);
    assert.equal(large.total, 130);
    assert.ok(large.dots.length <= 64);
  });

  it('gives every reference status a glyph', () => {
    assert.equal(referenceStatusGlyph('preprint').glyph, '◐');
    assert.equal(referenceStatusGlyph('UNVERIFIED').name, 'unverified');
    assert.equal(referenceStatusGlyph('').name, 'status not recorded');
  });
});

describe('header anatomy', () => {
  const doc = { header: HEADER, meta: META, route: ROUTE, stats: STATS };

  it('derives the section identity line from breadcrumbs without repeating labels', () => {
    assert.equal(identityLine(doc), 'Volume I / Part I / Chapter 05 — Minimal Transformer / Section 5.2');
  });

  it('prefers the authored identity line', () => {
    const authored = { ...doc, header: { ...HEADER, identityLine: 'VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 05' } };
    assert.equal(identityLine(authored), 'VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 05');
  });

  it('builds a derived meta line from stats', () => {
    assert.equal(derivedMetaLine(doc), '9 min read · 5 equations · 1 algorithm · 5 sources · foundational · updated 2026-09-20');
  });

  it('sentence-cases a lowercase thesis and leaves others untouched', () => {
    assert.deepEqual(sentenceCase([text('expand the lines')]), [text('Expand the lines')]);
    const code = [{ kind: 'code', value: 'x' } as const, text(' rest')];
    assert.equal(sentenceCase(code), code);
    const already = [text('Already cased')];
    assert.equal(sentenceCase(already), already);
  });
});

describe('block traversal', () => {
  const sibling: SiblingBlock = {
    kind: 'sibling',
    anchor: 'sib-mqa',
    depth: 'research',
    name: 'MQA',
    target: null,
    differential: {
      whyExists: null,
      assumptionChanged: null,
      objectiveChanged: null,
      problemSolved: null,
      newFailureMode: null,
      changedPrimitive: [text('per-head K/V → shared')],
    },
  };
  const nested: Block = {
    kind: 'expansion',
    anchor: null,
    depth: 'technical',
    variant: 'derivation',
    summary: [text('Derivation')],
    blocks: [
      para('inside', 'p-inside'),
      { kind: 'definition', anchor: 'term-kv', depth: 'overview', term: 'KV cache', termSlug: 'kv', content: [text('state')] },
    ],
  };

  it('walks nested blocks depth-first in document order', () => {
    const kinds = [...iterateBlocks([para('a'), nested, sibling])].map((block) => block.kind);
    assert.deepEqual(kinds, ['paragraph', 'expansion', 'paragraph', 'definition', 'sibling']);
  });

  it('finds blocks by kind and anchor, and definitions by slug', () => {
    const doc = documentWith([para('lead')], [nested, sibling]);
    assert.equal(findBlock(doc, 'paragraph', 'p-inside')?.anchor, 'p-inside');
    assert.equal(findBlock(doc, 'sibling', 'missing'), null);
    assert.equal(findDefinition(doc, 'kv')?.term, 'KV cache');
    assert.equal(blocksOfKind([nested], 'definition').length, 1);
    assert.equal(regionSiblings({ blocks: [nested, sibling] }).length, 1);
  });
});

describe('figure copies', () => {
  it('gives each copy a distinct anchor and keeps the figure id', () => {
    const rail = figureCopy(CALCULATOR, 'rail');
    const inline = figureCopy(CALCULATOR, 'inline');
    assert.equal(rail.anchor, 'fig-5-4--rail');
    assert.equal(inline.anchor, 'fig-5-4--inline');
    assert.equal(rail.id, CALCULATOR.id);
    assert.equal(isCalculator(CALCULATOR), true);
    assert.equal(figureLabel(CALCULATOR), 'Figure 5.4');
    assert.equal(figureLabel({ ...CALCULATOR, number: null }), 'Score-matrix bytes per layer');
  });

  it('renders calculator TeX at build time and recovers from TeX errors', () => {
    const html = renderDisplayTex('M = B\\,H\\,T^{2}\\,b');
    assert.ok(html?.includes('katex-display') === true);
    assert.ok(html?.includes('<math'));
    assert.equal(renderDisplayTex('\\frac{'), undefined);
  });
});
