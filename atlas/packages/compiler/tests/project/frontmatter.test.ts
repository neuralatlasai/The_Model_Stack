import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseFrontmatter, splitFrontmatter } from '../../src/project/frontmatter.ts';
import { normaliseText } from '../../src/project/fs.ts';

const VALID_YAML = `id: ms.section.5.2
entity_type: section
title: Attention calculation
short_title: Attention
volume: 1
part: 1
chapter: 5
section: 5.2
slug: 05-2-attention-calculation
parent: ms.chapter.5
prev_sibling: ms.section.5.1
next_sibling: ms.section.5.3
children: []
prerequisites: [ms.section.5.1]
downstream: []
related: []
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P01}
axes: {lifecycle: [pretraining], mechanism: [attention], feedback_setting: [], modality: [text]}
papers: [P01]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED], empirically_observed: false}
word_count_target: 900
updated_at: 2026-09-20
editorial_status: manuscript_draft`;

describe('splitFrontmatter', () => {
  it('splits the block and reports the first body line', () => {
    const split = splitFrontmatter(`---\nid: x\ntitle: y\n---\n\n# Heading\n`);
    assert.ok(split !== null);
    assert.equal(split.yaml, 'id: x\ntitle: y');
    assert.equal(split.body, '\n# Heading\n');
    assert.equal(split.bodyStartLine, 5);
  });

  it('returns null without an opening fence or without a closing fence', () => {
    assert.equal(splitFrontmatter('# No frontmatter\n'), null);
    assert.equal(splitFrontmatter('---\nid: x\n'), null);
  });

  it('handles CRLF and a BOM after normalisation', () => {
    const split = splitFrontmatter(normaliseText('﻿---\r\nid: x\r\n---\r\nbody\r\n'));
    assert.ok(split !== null);
    assert.equal(split.body, 'body\n');
    assert.equal(split.bodyStartLine, 4);
  });
});

describe('parseFrontmatter', () => {
  it('validates and normalises a section (section number from the id, date kept as a string)', () => {
    const result = parseFrontmatter(VALID_YAML);
    assert.ok(result.ok);
    assert.equal(result.meta.id, 'ms.section.5.2');
    assert.equal(result.meta.section, '5.2');
    assert.equal(result.meta.updatedAt, '2026-09-20');
    assert.equal(result.meta.shortTitle, 'Attention');
  });

  it('keeps section 14.10 distinct from 14.1 (YAML float hazard)', () => {
    const result = parseFrontmatter(VALID_YAML.replace('id: ms.section.5.2', 'id: ms.section.14.10').replace('section: 5.2', 'section: 14.10'));
    assert.ok(result.ok);
    assert.equal(result.meta.section, '14.10');
  });

  it('reports schema violations with field paths', () => {
    const result = parseFrontmatter(VALID_YAML.replace('editorial_status: manuscript_draft', 'editorial_status: finished'));
    assert.ok(!result.ok);
    assert.match(result.message, /editorial_status/u);
  });

  it('rejects unknown keys (typos surface as diagnostics)', () => {
    const result = parseFrontmatter(`${VALID_YAML}\ntitel: typo`);
    assert.equal(result.ok, false);
  });

  it('reports YAML syntax errors with a file line', () => {
    const result = parseFrontmatter('id: ms.section.5.2\ntitle: [unclosed\n');
    assert.ok(!result.ok);
    assert.match(result.message, /^YAML:/u);
    assert.ok(result.line === null || result.line >= 2);
  });

  it('rejects duplicate keys', () => {
    const result = parseFrontmatter(`${VALID_YAML}\ntitle: again`);
    assert.equal(result.ok, false);
  });
});
