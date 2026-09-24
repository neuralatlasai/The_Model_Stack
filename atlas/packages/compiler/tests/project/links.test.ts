import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { createLinkResolver } from '../../src/project/links.ts';
import { buildNodeTable, type NodeTableResult } from '../../src/project/nodes.ts';
import { realManifest, source } from './fixtures.ts';

const PART1 = 'vol-01-learning-and-representation/part-01-scientific-foundations';
const CH05 = `${PART1}/ch05-minimal-transformer-and-execution-trace`;
const CH04 = `${PART1}/ch04-language-modeling-and-learning-objectives`;
const FROM = `${CH05}/05-2-attention-calculation.md`;

describe('link resolution', () => {
  let table: NodeTableResult;

  before(async () => {
    table = buildNodeTable(await realManifest(), [
      source('ms.chapter.4', `${CH04}/README.md`, { slug: 'ch04-language-modeling-and-learning-objectives' }),
      source('ms.section.5.1', `${CH05}/05-1-end-to-end-forward-pass.md`, { slug: '05-1-end-to-end-forward-pass' }),
      source('ms.section.5.2', FROM, { slug: '05-2-attention-calculation' }),
      source('ms.frontmatter.notation', 'front-matter/notation.md', { slug: 'notation' }),
    ]);
  });

  it('resolves a sibling file with an anchor to its node URL', () => {
    const resolver = createLinkResolver(table, FROM, 'ms.section.5.2');
    assert.deepEqual(resolver.resolve('05-1-end-to-end-forward-pass.md#formulation'), {
      type: 'node',
      nodeId: 'ms.section.5.1',
      anchor: 'formulation',
      href: '/ch05-minimal-transformer-and-execution-trace/05-1-end-to-end-forward-pass/#formulation',
    });
    assert.deepEqual(resolver.diagnostics(), []);
  });

  it('resolves ../ paths across chapters and to front matter', () => {
    const resolver = createLinkResolver(table, FROM, 'ms.section.5.2');
    const chapter = resolver.resolve('../ch04-language-modeling-and-learning-objectives/README.md');
    assert.ok(chapter.type === 'node');
    assert.equal(chapter.href, '/ch04-language-modeling-and-learning-objectives/');
    const notation = resolver.resolve('../../../front-matter/notation.md#2-shapes');
    assert.ok(notation.type === 'node');
    assert.equal(notation.href, '/front-matter/notation/#2-shapes');
  });

  it('resolves directory links to the folder README', () => {
    const resolver = createLinkResolver(table, FROM, 'ms.section.5.2');
    const target = resolver.resolve('../ch04-language-modeling-and-learning-objectives/');
    assert.ok(target.type === 'node');
    assert.equal(target.nodeId, 'ms.chapter.4');
  });

  it('marks links to planned nodes as planned with an info diagnostic (once per href)', () => {
    const resolver = createLinkResolver(table, FROM, 'ms.section.5.2');
    const href = '../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-2-state-accounting.md';
    const target = resolver.resolve(href);
    assert.ok(target.type === 'planned');
    assert.equal(target.nodeId, 'ms.section.42.2');
    assert.match(target.href, /^\/ch42-[a-z0-9-]+\/42-2-state-accounting\/$/u);
    resolver.resolve(href);
    const diagnostics = resolver.diagnostics();
    assert.equal(diagnostics.length, 1);
    const [planned] = diagnostics;
    assert.ok(planned !== undefined);
    assert.equal(planned.code, 'link-planned');
    assert.equal(planned.severity, 'info');
    assert.equal(planned.file, FROM);
  });

  it('keeps external http(s) and mailto links external', () => {
    const resolver = createLinkResolver(table, FROM, 'ms.section.5.2');
    assert.deepEqual(resolver.resolve('https://arxiv.org/abs/1706.03762'), { type: 'external', href: 'https://arxiv.org/abs/1706.03762' });
    assert.deepEqual(resolver.resolve('mailto:editor@example.org'), { type: 'external', href: 'mailto:editor@example.org' });
    assert.deepEqual(resolver.diagnostics(), []);
  });

  it('resolves a bare #anchor to the same document', () => {
    const resolver = createLinkResolver(table, FROM, 'ms.section.5.2');
    assert.deepEqual(resolver.resolve('#eq-5-4'), {
      type: 'node',
      nodeId: 'ms.section.5.2',
      anchor: 'eq-5-4',
      href: '/ch05-minimal-transformer-and-execution-trace/05-2-attention-calculation/#eq-5-4',
    });
  });

  it('reports unknown targets, escapes out of docs/, and unsafe schemes as unresolved warnings', () => {
    const resolver = createLinkResolver(table, FROM, 'ms.section.5.2');
    assert.deepEqual(resolver.resolve('no-such-file.md'), { type: 'unresolved', raw: 'no-such-file.md' });
    assert.equal(resolver.resolve('../../../../book_plan.md').type, 'unresolved');
    assert.equal(resolver.resolve('javascript:alert(1)').type, 'unresolved');
    const diagnostics = resolver.diagnostics();
    assert.equal(diagnostics.length, 3);
    assert.ok(diagnostics.every((item) => item.code === 'link-unresolved' && item.severity === 'warning'));
  });

  it('decodes percent-encoded paths', () => {
    const resolver = createLinkResolver(table, FROM, 'ms.section.5.2');
    assert.equal(resolver.resolve('05-1-end-to-end-forward-pass%2Emd').type, 'node');
  });
});
