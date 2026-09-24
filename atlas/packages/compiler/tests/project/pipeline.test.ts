/**
 * The project pipeline on the real docs/ with a stand-in Markdown engine: checks
 * everything the project layer owns (loading, routes, links, references,
 * stack, graph, search, bundle manifest) independently of markdown/.
 */
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { BundleManifestSchema, neighbourhood, SEARCH_KINDS } from '@atlas/core';
import { runPipeline } from '../../src/project/pipeline.ts';
import type { CompiledAtlas } from '../../src/project/types.ts';
import { loadSearchIndex } from '../../src/search/index-builder.ts';
import { DOCS_DIR, FIXED_COMPILED_AT, REFERENCE_STACK } from './paths.ts';
import { must } from './fixtures.ts';
import { stubEngine } from './stub-engine.ts';

describe('pipeline on real docs (stub Markdown engine)', () => {
  let atlas: CompiledAtlas;

  before(async () => {
    atlas = await runPipeline({ docsDir: DOCS_DIR, referenceStackPath: REFERENCE_STACK, compiledAt: FIXED_COMPILED_AT }, stubEngine);
  });

  it('produces a valid bundle manifest', () => {
    const manifest = BundleManifestSchema.parse(atlas.manifest);
    assert.equal(manifest.compiledAt, FIXED_COMPILED_AT);
    assert.equal(manifest.edition, '1.0');
    assert.equal(manifest.counts.documents, atlas.documents.length);
    assert.ok(manifest.counts.documents >= 100, `documents: ${String(manifest.counts.documents)}`);
    assert.equal(manifest.documents[0], 'ms.root');
  });

  it('loads every docs page with frontmatter and skips the authoring contracts', () => {
    const paths = new Set(atlas.documents.map((doc) => doc.sourcePath));
    assert.ok(paths.has('README.md'));
    assert.ok(paths.has('appendices/README.md'));
    assert.ok(!paths.has('CONTENT_CONTRACT.md'));
    assert.ok(!paths.has('VISUAL_GRAMMAR.md'));
    const codes = new Set(atlas.diagnostics.map((item) => item.code));
    assert.ok(!codes.has('frontmatter-invalid'));
    assert.ok(!codes.has('frontmatter-missing'));
    assert.ok(!codes.has('frontmatter-id-mismatch'));
  });

  it('puts every manifest chapter and section in the graph, planned ones flagged', () => {
    for (let chapter = 1; chapter <= 66; chapter += 1) {
      const node = atlas.graph.nodes[`ms.chapter.${String(chapter)}`];
      assert.ok(node !== undefined, `ms.chapter.${String(chapter)}`);
    }
    assert.equal(Object.values(atlas.graph.nodes).filter((node) => node.entityType === 'section').length, 396);
    const ch42 = must(atlas.graph.nodes['ms.chapter.42']);
    assert.equal(ch42.hasManuscript, false);
    assert.equal(ch42.state, 'planned');
    assert.equal(ch42.domain, 'inference');
    assert.ok((ch42.plan?.artifact ?? '').length > 0);
    const ch05 = must(atlas.graph.nodes['ms.chapter.5']);
    assert.equal(ch05.hasManuscript, true);
    assert.equal(ch05.number, '05');
    assert.equal(ch05.domain, 'foundations');
    assert.equal(atlas.graph.nodes['ms.volume.2']?.number, 'II');
    assert.equal(atlas.graph.nodes['ms.part.7']?.number, 'VII');
  });

  it('builds the tree: volumes, then front matter, then appendices', () => {
    assert.deepEqual(
      atlas.graph.tree.map((node) => node.id),
      ['ms.volume.1', 'ms.volume.2', 'ms.volume.3', 'ms.frontmatter', 'ms.appendices'],
    );
    const ch05 = atlas.graph.tree[0]?.children[0]?.children.find((node) => node.id === 'ms.chapter.5');
    assert.deepEqual(
      ch05?.children.map((node) => node.id),
      ['ms.section.5.1', 'ms.section.5.2', 'ms.section.5.3', 'ms.section.5.4', 'ms.section.5.5', 'ms.section.5.6', 'ms.verification.5', 'ms.references.5'],
    );
    const ch42 = atlas.graph.tree[1]?.children.flatMap((part) => part.children).find((node) => node.id === 'ms.chapter.42');
    assert.equal(ch42?.children.length, 6, 'planned satellites are not listed in the tree');
  });

  it('derives typed edges from frontmatter and keeps the neighbourhood local', () => {
    assert.ok(atlas.graph.edges.some((edge) => edge.from === 'ms.chapter.5' && edge.to === 'ms.chapter.4' && edge.type === 'prerequisite'));
    assert.ok(atlas.graph.external.some((relation) => relation.from === 'ms.chapter.5' && relation.target === 'paper.P01'));
    const local = neighbourhood(atlas.graph, 'ms.chapter.5');
    assert.ok(local !== null);
    assert.ok(local.prerequisites.some((node) => node.id === 'ms.chapter.4'));
    assert.ok(local.dependents.some((node) => node.id === 'ms.chapter.42'));
  });

  it('merges references across chapters and fills citedBy', () => {
    const p01 = atlas.registry.references.find((record) => record.key === 'P01');
    assert.ok(p01 !== undefined);
    assert.ok(p01.uses.length >= 2);
    assert.ok(p01.citedBy.includes('ms.section.5.2'));
    assert.ok(!p01.citedBy.some((id) => id.startsWith('ms.references.')));
    assert.ok(atlas.registry.references.some((record) => record.key === 'P19'));
    assert.ok(atlas.registry.references.some((record) => record.key.startsWith('R5.')));
  });

  it('builds systems and labs from the reference stack with usedBy from frontmatter', () => {
    assert.equal(atlas.registry.systems.length, 50);
    assert.equal(atlas.registry.labs.length, 50);
    const pytorch = must(atlas.registry.systems.find((system) => system.id === 'impl.pytorch'));
    assert.ok(pytorch.usedBy.length > 0);
    assert.equal(pytorch.layer, 'Model / autograd framework');
  });

  it('routes chain written nodes in reading order', () => {
    const doc = must(atlas.documents.find((candidate) => candidate.meta.id === 'ms.section.5.2'));
    assert.equal(doc.route.url, '/ch05-minimal-transformer-and-execution-trace/05-2-attention-calculation/');
    assert.equal(doc.route.prev?.id, 'ms.section.5.1');
    assert.equal(doc.route.next?.id, 'ms.section.5.3');
    assert.deepEqual(
      doc.route.breadcrumbs.map((crumb) => crumb.id),
      ['ms.volume.1', 'ms.part.1', 'ms.chapter.5'],
    );
  });

  it('diagnoses links: planned targets as info, broken ones as warnings, attached to the linking document', () => {
    const planned = atlas.diagnostics.filter((item) => item.code === 'link-planned');
    assert.ok(planned.length > 0);
    assert.ok(planned.every((item) => item.severity === 'info' && item.file !== null));
    const withPlanned = atlas.documents.find((doc) => doc.diagnostics.some((item) => item.code === 'link-planned'));
    assert.ok(withPlanned !== undefined);
  });

  it('indexes typed search documents with unique ids and bounded bodies', () => {
    const ids = new Set(atlas.searchDocs.map((doc) => doc.id));
    assert.equal(ids.size, atlas.searchDocs.length);
    assert.ok(atlas.searchDocs.every((doc) => doc.body.length <= 1200));
    assert.ok(atlas.searchDocs.every((doc) => (SEARCH_KINDS as readonly string[]).includes(doc.kind)));
    const section = must(atlas.searchDocs.find((doc) => doc.id === 'node:ms.section.5.2'));
    assert.equal(section.kind, 'section');
    assert.equal(section.context, 'Foundations / Minimal Transformer');
    const planned = must(atlas.searchDocs.find((doc) => doc.id === 'node:ms.chapter.42'));
    assert.equal(planned.kind, 'chapter');
    assert.ok(planned.body.length > 0, 'planned chapters are searchable by their plan artifact');
    assert.equal(atlas.searchDocs.find((doc) => doc.id === 'system:impl.vllm')?.context, 'Inference engine');
    assert.ok(atlas.searchDocs.some((doc) => doc.id === 'paper:P19'));
    assert.ok(atlas.searchDocs.some((doc) => doc.id === 'lab:lab.deepseek'));
  });

  it('round-trips the MiniSearch index with the shared options', () => {
    const index = loadSearchIndex(atlas.searchIndex);
    assert.equal(index.documentCount, atlas.searchDocs.length);
    const attention = index.search('attention');
    assert.ok(attention.length > 0);
    const kv = index.search('KV cache');
    assert.ok(kv.length > 0);
    const p19 = index.search('P19');
    const top = must(p19[0]);
    assert.equal(top.id, 'paper:P19');
    assert.equal(top['kind'] as unknown, 'paper');
    assert.ok(index.search('vLLM').some((hit) => hit.id === 'system:impl.vllm'));
  });

  it('is deterministic for a fixed compiledAt', async () => {
    const again = await runPipeline({ docsDir: DOCS_DIR, referenceStackPath: REFERENCE_STACK, compiledAt: FIXED_COMPILED_AT }, stubEngine);
    assert.equal(again.searchIndex, atlas.searchIndex);
    assert.deepEqual(again.manifest, atlas.manifest);
    assert.deepEqual(again.graph, atlas.graph);
  });

  it('honours an aborted signal', async () => {
    const controller = new AbortController();
    controller.abort(new Error('stop'));
    await assert.rejects(
      runPipeline({ docsDir: DOCS_DIR, referenceStackPath: REFERENCE_STACK, compiledAt: FIXED_COMPILED_AT, signal: controller.signal }, stubEngine),
      /stop/u,
    );
  });

  it('fails with stable codes on unreadable inputs', async () => {
    await assert.rejects(
      runPipeline({ docsDir: DOCS_DIR, referenceStackPath: `${REFERENCE_STACK}.missing`, compiledAt: FIXED_COMPILED_AT }, stubEngine),
      (error: unknown) => error instanceof Error && 'code' in error && error.code === 'reference-stack-unreadable',
    );
    await assert.rejects(
      runPipeline({ docsDir: `${DOCS_DIR}-missing`, referenceStackPath: REFERENCE_STACK, compiledAt: FIXED_COMPILED_AT }, stubEngine),
      (error: unknown) => error instanceof Error && 'code' in error && error.code === 'manifest-invalid',
    );
  });
});
