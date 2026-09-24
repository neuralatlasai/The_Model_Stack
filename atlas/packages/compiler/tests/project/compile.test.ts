/**
 * Integration: the real compiler (Markdown engine, KaTeX, Shiki, ELK layout)
 * over the real docs/ with a fixed compiledAt, then a bundle write/read.
 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { BundleManifestSchema, countBySeverity } from '@atlas/core';
import { compileAtlas, loadSearchIndex, writeBundle, type CompiledAtlas } from '../../src/index.ts';
import { DOCS_DIR, FIXED_COMPILED_AT, REFERENCE_STACK } from './paths.ts';

describe('compileAtlas on the real docs', () => {
  let atlas: CompiledAtlas;
  let out: string;

  before(async () => {
    atlas = await compileAtlas({ docsDir: DOCS_DIR, referenceStackPath: REFERENCE_STACK, compiledAt: FIXED_COMPILED_AT });
    out = await mkdtemp(path.join(os.tmpdir(), 'atlas-compile-'));
  });

  after(async () => {
    await rm(out, { recursive: true, force: true });
  });

  it('puts every manifest chapter in the graph', () => {
    for (let chapter = 1; chapter <= 66; chapter += 1) {
      assert.ok(atlas.graph.nodes[`ms.chapter.${String(chapter)}`] !== undefined, `ms.chapter.${String(chapter)}`);
    }
  });

  it('compiles chapter 05: the chapter page, six sections, verification, references', () => {
    const ids = new Set(atlas.documents.map((doc) => doc.meta.id));
    for (const id of [
      'ms.chapter.5',
      'ms.section.5.1',
      'ms.section.5.2',
      'ms.section.5.3',
      'ms.section.5.4',
      'ms.section.5.5',
      'ms.section.5.6',
      'ms.verification.5',
      'ms.references.5',
    ]) {
      assert.ok(ids.has(id as never), id);
    }
    const section = atlas.documents.find((doc) => doc.meta.id === 'ms.section.5.2');
    assert.ok((section?.regions.length ?? 0) > 5);
    assert.equal(section?.route.url, '/ch05-minimal-transformer-and-execution-trace/05-2-attention-calculation/');
  });

  it('reports zero frontmatter-invalid diagnostics', () => {
    assert.equal(atlas.diagnostics.filter((item) => item.code === 'frontmatter-invalid').length, 0);
  });

  it('counts diagnostics consistently and records the fixed timestamp', () => {
    assert.deepEqual(atlas.manifest.diagnostics, countBySeverity(atlas.diagnostics));
    assert.equal(atlas.manifest.compiledAt, FIXED_COMPILED_AT);
    const counts = atlas.manifest.counts;
    const byCode = new Map<string, number>();
    for (const item of atlas.diagnostics) byCode.set(`${item.severity} ${item.code}`, (byCode.get(`${item.severity} ${item.code}`) ?? 0) + 1);
    // Surfaced in the test log so the observed numbers are reviewable.
    process.stdout.write(`# counts ${JSON.stringify(counts)}\n# diagnostics ${JSON.stringify(atlas.manifest.diagnostics)}\n`);
    for (const [key, value] of [...byCode].sort()) process.stdout.write(`#   ${key}: ${String(value)}\n`);
  });

  it('resolves search for attention, KV cache, and P19', () => {
    const index = loadSearchIndex(atlas.searchIndex);
    assert.ok(index.search('attention').length > 0);
    assert.ok(index.search('KV cache').length > 0);
    assert.ok(index.search('P19').some((hit) => hit.id === 'paper:P19'));
  });

  it('writes a bundle whose manifest validates and whose documents parse', async () => {
    const target = path.join(out, '.atlas');
    const report = await writeBundle(atlas, target);
    assert.equal(report.files, atlas.documents.length + 6);
    const manifest = BundleManifestSchema.parse(JSON.parse(await readFile(path.join(target, 'bundle.json'), 'utf8')));
    assert.equal(manifest.documents.length, atlas.documents.length);
    const doc: unknown = JSON.parse(await readFile(path.join(target, 'docs', 'ms.section.5.2.json'), 'utf8'));
    assert.ok(doc !== null && typeof doc === 'object' && 'regions' in doc);
  });
});
