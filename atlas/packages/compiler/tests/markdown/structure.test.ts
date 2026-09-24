import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inlineToText } from '@atlas/core';
import { isMention } from '../../src/markdown/evidence.ts';
import { roleForHeading } from '../../src/markdown/regions.ts';
import { splitTitle } from '../../src/markdown/header.ts';
import { slugify, createAnchorRegistry } from '../../src/markdown/slug.ts';
import { allBlocks, codes, compile, makeMeta } from './helpers.ts';

const CHAPTER = [
  'VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 05',
  '',
  '# 05 — A minimal Transformer and its execution trace',
  '',
  'A decoder-only Transformer is fully specified by a short list of typed tensors (P01).',
  '',
  '6 sections · 2 spine papers · 2 implementations · prerequisites: 03–04 · updated 2026-09-20',
  '',
  'An extra lead paragraph.',
  '',
  '## Why this chapter exists',
  '',
  'What failed before.',
  '',
  '## Terms owned here',
  '',
  '| Term | One-line definition | Section |',
  '|---|---|---|',
  '| Attention score matrix | The [B, H, T, T] tensor. | §5.2 |',
  '',
  '## Reading notes',
  '',
  'Free text.',
].join('\n');

describe('header anatomy', () => {
  it('reads identity line, number, title, thesis, and metadata line of a chapter page', async () => {
    const body = await compile(CHAPTER, { meta: { id: 'ms.chapter.5', entityType: 'chapter', section: null } });
    assert.equal(body.header.identityLine, 'VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 05');
    assert.equal(body.header.number, '05');
    assert.equal(body.header.title, 'A minimal Transformer and its execution trace');
    assert.equal(inlineToText(body.header.thesis ?? []), 'A decoder-only Transformer is fully specified by a short list of typed tensors (P01).');
    assert.match(inlineToText(body.header.metaLine ?? []), /^6 sections · 2 spine papers/u);
    assert.deepEqual(
      body.lead.map((block) => (block.kind === 'paragraph' ? inlineToText(block.content) : block.kind)),
      ['An extra lead paragraph.'],
    );
  });

  it('takes a section thesis from the Scope objective sentence', async () => {
    const body = await compile(
      '# 5.2 Attention calculation\n\n## Scope\n\nObjective: expand the four attention lines of the §5.1 trace — projections and softmax — into equations with shapes, and cost each line. Baseline: Eq. (1) of P01.\n',
    );
    assert.equal(body.header.number, '5.2');
    assert.equal(body.header.title, 'Attention calculation');
    assert.equal(body.header.identityLine, null);
    assert.equal(
      inlineToText(body.header.thesis ?? []),
      'expand the four attention lines of the §5.1 trace — projections and softmax — into equations with shapes, and cost each line.',
    );
  });

  it('splits numbered titles of every entity type', () => {
    const meta = makeMeta();
    assert.deepEqual(splitTitle('5.2 Attention calculation', meta), { number: '5.2', title: 'Attention calculation' });
    assert.deepEqual(splitTitle('05 — A minimal Transformer', meta), { number: '05', title: 'A minimal Transformer' });
    assert.deepEqual(splitTitle('Appendix A — Research organizations', meta), { number: 'A', title: 'Research organizations' });
    assert.deepEqual(splitTitle('Part III — Model architectures', meta), { number: 'III', title: 'Model architectures' });
    assert.deepEqual(splitTitle('Notation and the shared mathematical contract', makeMeta({ entityType: 'frontmatter', section: null })), {
      number: null,
      title: 'Notation and the shared mathematical contract',
    });
  });

  it('warns when a document has no H1', async () => {
    const body = await compile('## Scope\n\nObjective: x.');
    assert.equal(body.header.title, 'Attention calculation', 'falls back to the frontmatter title');
    assert.ok(codes(body).includes('block-malformed'));
  });
});

describe('regions, anchors, and depth', () => {
  it('maps canonical headings to roles and diagnoses unknown ones on vocabulary pages', async () => {
    const body = await compile(CHAPTER, { meta: { id: 'ms.chapter.5', entityType: 'chapter', section: null } });
    assert.deepEqual(
      body.regions.map((region) => [region.anchor, region.role, region.depth]),
      [
        ['why-this-chapter-exists', 'why-chapter', 'overview'],
        ['terms-owned-here', 'terms', 'overview'],
        ['reading-notes', 'other', 'overview'],
      ],
    );
    assert.deepEqual(codes(body), ['heading-unknown-region']);
    const volume = await compile('# Volume I — Learning\n\n## Parts\n\nText.', { meta: { id: 'ms.volume.1', entityType: 'volume', section: null, chapter: null } });
    assert.deepEqual(codes(volume), [], 'free headings are fine outside the section/chapter/verification vocabulary');
    const terms = body.rail.find((binding) => binding.regionAnchor === 'terms-owned-here');
    assert.deepEqual(terms?.instruments, [{ kind: 'terms', slugs: ['attention-score-matrix'] }]);
  });

  it('reads roles through numbering, dashes, parentheses, and whole-word prefixes', () => {
    assert.equal(roleForHeading('3. Acceptance criteria'), 'acceptance');
    assert.equal(roleForHeading('3. Acceptance criteria and tolerance rationale'), 'acceptance');
    assert.equal(roleForHeading('Siblings — differential explanations'), 'siblings');
    assert.equal(roleForHeading('Experimental design (a proposal)'), 'experimental-design');
    assert.equal(roleForHeading('WHY THIS EXISTS'), 'why');
    assert.equal(roleForHeading('Reference listing'), null);
  });

  it('keeps every anchor unique within the document and reports duplicate headings', async () => {
    const body = await compile(
      '# 5.2 T\n\n## Mechanism\n\n### Mechanism\n\n### Notes\n\n### Notes\n\n$$\nx\n$$\n*(Eq. 5.4)*\n\n## Mechanism\n\n### eq-5-4\n',
    );
    const anchors = [
      ...body.regions.map((region) => region.anchor),
      ...allBlocks(body)
        .map((block) => block.anchor)
        .filter((anchor): anchor is string => anchor !== null),
    ];
    assert.equal(new Set(anchors).size, anchors.length, anchors.join(' '));
    assert.deepEqual(
      body.regions.map((region) => region.anchor),
      ['mechanism', 'mechanism-2'],
    );
    assert.ok(codes(body).filter((code) => code === 'heading-duplicate-anchor').length >= 3);
  });

  it('assigns block depth as max(region depth, kind depth)', async () => {
    const body = await compile(
      [
        '# 5.2 T',
        '## Intuition',
        'Prose.',
        '',
        '$$',
        'x',
        '$$',
        '',
        '```python',
        'x = 1',
        '```',
        '## Implementation',
        'Prose.',
        '## Siblings',
        'Prose.',
      ].join('\n\n'),
    );
    const [intuition, implementation, siblings] = body.regions;
    assert.deepEqual(
      intuition?.blocks.map((block) => [block.kind, block.depth]),
      [
        ['paragraph', 'overview'],
        ['equation', 'technical'],
        ['code', 'implementation'],
      ],
    );
    assert.deepEqual(implementation?.blocks.map((block) => block.depth), ['implementation']);
    assert.deepEqual(siblings?.blocks.map((block) => block.depth), ['research']);
    assert.deepEqual(
      body.outline.map((entry) => [entry.anchor, entry.depth, entry.markers.map((marker) => marker.type)]),
      [
        ['intuition', 'overview', ['code']],
        ['implementation', 'implementation', []],
        ['siblings', 'research', []],
      ],
    );
  });

  it('slugs are lower-case ASCII with hyphens and the registry suffixes collisions', () => {
    assert.equal(slugify('Why this exists'), 'why-this-exists');
    assert.equal(slugify('Attention score matrix (S) — Ω'), 'attention-score-matrix-s');
    assert.equal(slugify('Café  décor'), 'cafe-decor');
    const registry = createAnchorRegistry();
    assert.equal(registry.claim('a'), 'a');
    assert.equal(registry.claim('a'), 'a-2');
    assert.equal(registry.claim(''), 'x');
  });
});

describe('evidence rules', () => {
  it('forbids EMPIRICALLY-OBSERVED as a label but not a negated mention', async () => {
    const used = await compile('# 5.2 T\n\n## Observations\n\n> **Claim [EMPIRICALLY-OBSERVED · P01].** We measured it.');
    assert.deepEqual(codes(used, 'error'), ['label-forbidden']);
    const mentioned = await compile(
      '# 5.2 T\n\n## Status\n\nNo result is EMPIRICALLY-OBSERVED in this edition. Every label is DERIVED, and EMPIRICALLY-OBSERVED does not appear. `EMPIRICALLY-OBSERVED` in code is fine.',
    );
    assert.deepEqual(codes(mentioned, 'error'), []);
  });

  it('requires a commit next to CODE-VERIFIED', async () => {
    const bare = await compile('# 5.2 T\n\n## Implementation\n\nThe kernel dispatch is CODE-VERIFIED.');
    assert.deepEqual(codes(bare, 'error'), ['code-verified-without-commit']);
    const pinned = await compile('# 5.2 T\n\n## Implementation\n\nCODE-VERIFIED: vllm-project/vllm at commit 1ca2583, by running the unit test.');
    assert.deepEqual(codes(pinned, 'error'), []);
    const negated = await compile('# 5.2 T\n\n## Status\n\nNo code was executed, so CODE-VERIFIED is not used.');
    assert.deepEqual(codes(negated, 'error'), []);
  });

  it('distinguishes mentions from uses', () => {
    const text = 'The label EMPIRICALLY-OBSERVED is forbidden here.';
    const start = text.indexOf('EMPIRICALLY');
    assert.equal(isMention(text, start, start + 'EMPIRICALLY-OBSERVED'.length), true);
    const use = 'Claim [EMPIRICALLY-OBSERVED · P01]. Then nothing else.';
    const at = use.indexOf('EMPIRICALLY');
    assert.equal(isMention(use, at, at + 'EMPIRICALLY-OBSERVED'.length), false);
  });

  it('carries file, line, and node id on every diagnostic', async () => {
    const body = await compile('# 5.2 T\n\n## Implementation\n\nThe dispatch is CODE-VERIFIED.', { bodyStartLine: 45 });
    const [diagnostic] = body.diagnostics;
    assert.deepEqual(
      diagnostic === undefined ? null : [diagnostic.file, diagnostic.line, diagnostic.nodeId],
      ['fixture.md', 49, 'ms.section.5.2'],
    );
  });
});

describe('document projections', () => {
  it('counts prose words and reading time, and orders citations by first appearance', async () => {
    const body = await compile(
      '# 5.2 T\n\n## Scope\n\nObjective: one two three (R5.13).\n\n## Mechanism\n\nFour five (P19) six `not counted` and $x+y$ R5.13 P01.\n',
    );
    assert.equal(body.stats.words, 12, 'Objective one two three R5.13 | Four five P19 six and R5.13 P01 (code and math excluded)');
    assert.equal(body.stats.readingMinutes, 1);
    assert.deepEqual(body.citations, ['R5.13', 'P19', 'P01']);
    assert.equal(body.stats.citations, 3);
    const scope = body.rail.find((binding) => binding.regionAnchor === 'scope');
    assert.deepEqual(scope?.instruments, [{ kind: 'position' }, { kind: 'citations', keys: ['R5.13'] }]);
  });
});
