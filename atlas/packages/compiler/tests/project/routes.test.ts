import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import type { NodeId } from '@atlas/core';
import { buildNodeTable, type NodeTableResult } from '../../src/project/nodes.ts';
import { buildRoutes, breadcrumbsOf } from '../../src/project/routes.ts';
import { must, realManifest, source } from './fixtures.ts';

const CH05 = 'vol-01-learning-and-representation/part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace';

describe('node table and routes (real manifest, synthetic documents)', () => {
  let table: NodeTableResult;

  before(async () => {
    const manifest = await realManifest();
    table = buildNodeTable(manifest, [
      source('ms.root', 'README.md', { slug: 'index' }),
      source('ms.chapter.5', `${CH05}/README.md`, { slug: 'ch05-minimal-transformer-and-execution-trace', title: 'A minimal Transformer', shortTitle: 'Minimal Transformer' }),
      source('ms.section.5.1', `${CH05}/05-1-end-to-end-forward-pass.md`, { slug: '05-1-end-to-end-forward-pass' }),
      source('ms.section.5.2', `${CH05}/05-2-attention-calculation.md`, { slug: '05-2-attention-calculation', title: 'Attention calculation' }),
      source('ms.verification.5', `${CH05}/verification.md`, { slug: 'verification' }),
      source('ms.frontmatter.notation', 'front-matter/notation.md', { slug: 'notation' }),
      source('ms.appendices', 'appendices/README.md', { slug: 'appendices' }),
    ]);
  });

  it('derives URLs from manifest slugs', () => {
    assert.equal(table.nodes.get('ms.root')?.url, '/');
    assert.equal(table.nodes.get('ms.appendices')?.url, '/appendices/');
    assert.equal(table.nodes.get('ms.frontmatter')?.url, '/front-matter/');
    assert.equal(table.nodes.get('ms.frontmatter.notation')?.url, '/front-matter/notation/');
    assert.equal(table.nodes.get('ms.volume.1')?.url, '/vol-01-learning-and-representation/');
    assert.equal(table.nodes.get('ms.part.5')?.url, '/part-05-hardware-kernels-and-distributed-execution/');
    assert.equal(table.nodes.get('ms.chapter.5')?.url, '/ch05-minimal-transformer-and-execution-trace/');
    assert.equal(table.nodes.get('ms.section.5.2')?.url, '/ch05-minimal-transformer-and-execution-trace/05-2-attention-calculation/');
    assert.equal(table.nodes.get('ms.verification.5')?.url, '/ch05-minimal-transformer-and-execution-trace/verification/');
    assert.equal(table.nodes.get('ms.references.5')?.url, '/ch05-minimal-transformer-and-execution-trace/references/');
    assert.equal(table.nodes.get('ms.appendix.d')?.url, '/appendices/appendix-d-primary-paper-spine/');
  });

  it('numbers volumes and parts in Roman numerals, chapters two-digit, appendices by letter', () => {
    assert.equal(table.nodes.get('ms.volume.3')?.number, 'III');
    assert.equal(table.nodes.get('ms.part.11')?.number, 'XI');
    assert.equal(table.nodes.get('ms.chapter.5')?.number, '05');
    assert.equal(table.nodes.get('ms.section.5.2')?.number, '5.2');
    assert.equal(table.nodes.get('ms.appendix.h')?.number, 'H');
  });

  it('keeps every manifest node, planned ones without a document', () => {
    for (let chapter = 1; chapter <= 66; chapter += 1) assert.ok(table.nodes.has(`ms.chapter.${String(chapter)}` as NodeId), `ms.chapter.${String(chapter)}`);
    assert.equal(table.nodes.get('ms.chapter.42')?.doc, null);
    assert.equal(table.nodes.get('ms.chapter.42')?.plan?.sections.length, 6);
    assert.ok(table.nodes.get('ms.chapter.5')?.doc !== null);
  });

  it('prefers document titles and keeps plan data', () => {
    assert.equal(table.nodes.get('ms.chapter.5')?.title, 'A minimal Transformer');
    assert.equal(table.nodes.get('ms.chapter.5')?.plan?.artifact, 'a small reference Transformer with inspectable intermediate tensors');
    assert.equal(table.nodes.get('ms.part.1')?.plan?.outcome, 'A correct reference model and defensible experiment');
  });

  it('builds breadcrumbs along the parent chain without the atlas index', () => {
    const crumbs = breadcrumbsOf(table, 'ms.section.5.2').map((crumb) => crumb.id);
    assert.deepEqual(crumbs, ['ms.volume.1', 'ms.part.1', 'ms.chapter.5']);
    assert.deepEqual(breadcrumbsOf(table, 'ms.volume.1'), []);
    assert.deepEqual(
      breadcrumbsOf(table, 'ms.frontmatter.notation').map((crumb) => crumb.id),
      ['ms.frontmatter'],
    );
    assert.equal(breadcrumbsOf(table, 'ms.chapter.5').at(-1)?.title, 'Part I');
  });

  it('chains prev/next along reading order, restricted to written nodes', () => {
    const routes = buildRoutes(table);
    const section52 = must(routes.get('ms.section.5.2'));
    assert.equal(section52.prev?.id, 'ms.section.5.1');
    // 5.3–5.6 are not written in this synthetic set, so next skips to verification.
    assert.equal(section52.next?.id, 'ms.verification.5');
    assert.equal(routes.get('ms.chapter.5')?.next?.id, 'ms.section.5.1');
    assert.equal(routes.get('ms.root')?.prev, null);
    assert.equal(routes.get('ms.root')?.next?.id, 'ms.chapter.5');
    assert.equal(routes.get('ms.appendices')?.prev?.id, 'ms.frontmatter.notation');
    assert.equal(routes.has('ms.chapter.42'), false);
  });

  it('reading order puts chapter README before sections, then verification and references', () => {
    const order = table.order;
    const at = (id: string): number => order.indexOf(id as never);
    assert.ok(at('ms.chapter.5') < at('ms.section.5.1'));
    assert.ok(at('ms.section.5.6') < at('ms.verification.5'));
    assert.ok(at('ms.verification.5') < at('ms.references.5'));
    assert.ok(at('ms.references.5') < at('ms.chapter.6'));
    assert.ok(at('ms.part.11') < at('ms.frontmatter.notation'));
    assert.ok(at('ms.frontmatter.glossary') < at('ms.appendices'));
    assert.ok(at('ms.appendices') < at('ms.appendix.a'));
  });

  it('indexes manifest paths and document paths', () => {
    assert.equal(table.pathIndex.get(`${CH05}/05-2-attention-calculation.md`), 'ms.section.5.2');
    assert.equal(table.pathIndex.get('README.md'), 'ms.root');
    assert.equal(table.pathIndex.get('appendices/README.md'), 'ms.appendices');
    assert.ok(table.pathIndex.has('appendices/appendix-d-primary-paper-spine.md'));
  });

  it('has no diagnostics for consistent documents', () => {
    assert.deepEqual(table.diagnostics, []);
  });
});

describe('node table diagnostics', () => {
  it('flags an id that does not match the manifest path, unknown ids, duplicates, and slug drift', async () => {
    const manifest = await realManifest();
    const table = buildNodeTable(manifest, [
      source('ms.section.5.3', `${CH05}/05-2-attention-calculation.md`, { slug: '05-3-feed-forward-computation' }),
      source('ms.section.99.1', 'extra/99-1.md', { slug: 'x' }),
      source('ms.section.5.1', `${CH05}/05-1-end-to-end-forward-pass.md`, { slug: 'wrong-slug' }),
      source('ms.section.5.1', `${CH05}/copy.md`, { slug: '05-1-end-to-end-forward-pass' }),
    ]);
    const codes = table.diagnostics.map((item) => `${item.code}:${item.file ?? ''}`);
    assert.ok(codes.includes(`frontmatter-id-mismatch:${CH05}/05-2-attention-calculation.md`));
    assert.ok(codes.includes('manifest-unknown-node:extra/99-1.md'));
    assert.ok(codes.includes(`frontmatter-id-mismatch:${CH05}/copy.md`));
    assert.ok(table.diagnostics.some((item) => item.message.includes('slug "wrong-slug"')));
    // The unknown document still gets a node so it is compiled and addressable.
    assert.ok(table.nodes.has('ms.section.99.1'));
    assert.equal(table.docs.filter((doc) => doc.meta.id === 'ms.section.5.1').length, 1);
  });
});
