/**
 * Bundle loader at its file trust boundary: a fixture bundle is written to a
 * fresh temporary directory per case and selected through ATLAS_BUNDLE_DIR
 * (the loader keys its caches by directory, so cases do not interfere).
 */
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, describe, it } from 'node:test';
import { BUNDLE_FILES, docFilePath, PageDataSchema, type NodeId } from '@atlas/core';
import {
  AtlasBundleError,
  buildPageData,
  getDocument,
  getGraph,
  getNeighbourhood,
  getReference,
  getTerm,
  hasDocument,
  listDocuments,
  loadBundle,
  readSearchPayload,
} from '../atlas.ts';
import { manifestFor, sectionDoc, smallGraph, smallRegistry } from './fixtures.ts';

const dirs: string[] = [];

interface BundleOverrides {
  readonly manifest?: unknown;
  readonly graph?: unknown;
  readonly document?: unknown;
  readonly searchDocs?: unknown;
}

async function writeBundle(overrides: BundleOverrides = {}): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), 'atlas-web-test-'));
  dirs.push(dir);
  const documents: NodeId[] = ['ms.section.5.2'];
  await mkdir(path.join(dir, BUNDLE_FILES.docsDir), { recursive: true });
  const files: Record<string, unknown> = {
    [BUNDLE_FILES.manifest]: overrides.manifest ?? manifestFor(documents),
    [BUNDLE_FILES.graph]: overrides.graph ?? smallGraph(),
    [BUNDLE_FILES.registry]: smallRegistry(),
    [BUNDLE_FILES.searchDocs]: overrides.searchDocs ?? [
      { id: 'node:ms.section.5.2', kind: 'section', title: 'Attention calculation', context: 'Foundations', url: '/ch05/05-2/', body: 'b', keywords: '5.2' },
    ],
    [BUNDLE_FILES.searchIndex]: { documentCount: 1 },
    [docFilePath('ms.section.5.2')]: overrides.document ?? sectionDoc(),
  };
  for (const [relative, value] of Object.entries(files)) {
    await writeFile(path.join(dir, relative), JSON.stringify(value), 'utf8');
  }
  return dir;
}

function useBundle(dir: string): void {
  process.env['ATLAS_BUNDLE_DIR'] = dir;
}

function isBundleError(code: AtlasBundleError['code']) {
  return (error: unknown): boolean => error instanceof AtlasBundleError && error.code === code;
}

after(async () => {
  delete process.env['ATLAS_BUNDLE_DIR'];
  for (const dir of dirs) await rm(dir, { recursive: true, force: true });
});

describe('atlas bundle loader', () => {
  it('loads and validates a well-formed bundle', async () => {
    useBundle(await writeBundle());
    const bundle = await loadBundle();
    assert.equal(bundle.manifest.edition, '1.0');
    assert.equal(Object.keys(bundle.graph.nodes).length, 7);
    assert.equal((await getGraph()).tree[0]?.id, 'ms.volume.1');
    assert.equal((await getReference('P01'))?.work, 'Attention Is All You Need');
    assert.equal(await getReference('P52'), null);
    assert.equal((await getTerm('kv-cache'))?.term, 'KV cache');
    assert.equal((await getNeighbourhood('ms.section.5.2'))?.prerequisites[0]?.id, 'ms.section.5.1');
  });

  it('reads documents once and builds valid page data', async () => {
    useBundle(await writeBundle());
    const doc = await getDocument('ms.section.5.2');
    assert.equal(doc.header.title, 'Attention calculation');
    assert.equal(await getDocument('ms.section.5.2'), doc);
    assert.equal(await hasDocument('ms.section.5.2'), true);
    assert.equal(await hasDocument('ms.section.5.1'), false);
    assert.equal((await listDocuments()).length, 1);
    assert.equal(PageDataSchema.safeParse(await buildPageData(doc)).success, true);
  });

  it('refuses documents the manifest does not list', async () => {
    useBundle(await writeBundle());
    await assert.rejects(getDocument('ms.section.5.1'), isBundleError('document-missing'));
  });

  it('explains a missing bundle and retries once it exists', async () => {
    const dir = path.join(await mkdtemp(path.join(tmpdir(), 'atlas-web-missing-')), 'not-compiled');
    dirs.push(path.dirname(dir));
    useBundle(dir);
    await assert.rejects(loadBundle(), (error: unknown) => {
      assert.ok(error instanceof AtlasBundleError);
      assert.equal(error.code, 'bundle-missing');
      assert.match(error.message, /npm run compile/u);
      return true;
    });
    // Simulate `npm run compile` producing the bundle: the failed load was not cached.
    const compiled = await writeBundle();
    await rm(dir, { recursive: true, force: true });
    await cp(compiled, dir, { recursive: true });
    assert.equal((await loadBundle()).manifest.documents.length, 1);
  });

  it('rejects a bundle from another schema version before trusting it', async () => {
    useBundle(await writeBundle({ manifest: { ...manifestFor(['ms.section.5.2']), schemaVersion: 2 } }));
    await assert.rejects(loadBundle(), isBundleError('schema-version'));
  });

  it('rejects a graph that does not match the schema', async () => {
    const graph = smallGraph();
    useBundle(await writeBundle({ graph: { ...graph, order: ['not-a-node-id'] } }));
    await assert.rejects(loadBundle(), (error: unknown) => {
      assert.ok(error instanceof AtlasBundleError);
      assert.equal(error.code, 'bundle-invalid');
      assert.match(error.message, /graph\.json/u);
      return true;
    });
  });

  it('rejects a document whose id does not match its file', async () => {
    const doc = sectionDoc();
    useBundle(await writeBundle({ document: { ...doc, meta: { ...doc.meta, id: 'ms.section.5.1' } } }));
    await assert.rejects(getDocument('ms.section.5.2'), isBundleError('bundle-invalid'));
  });

  it('rejects a document with an unknown block kind', async () => {
    const doc = sectionDoc();
    const [first] = doc.regions;
    assert.ok(first !== undefined);
    const broken = { ...doc, regions: [{ ...first, blocks: [{ kind: 'html', anchor: null, depth: 'overview' }] }] };
    useBundle(await writeBundle({ document: broken }));
    await assert.rejects(getDocument('ms.section.5.2'), isBundleError('bundle-invalid'));
  });

  it('serves validated search payloads verbatim', async () => {
    useBundle(await writeBundle());
    const docs = await readSearchPayload('searchDocs');
    assert.equal((JSON.parse(docs) as { kind: string }[])[0]?.kind, 'section');
    assert.equal((JSON.parse(await readSearchPayload('searchIndex')) as { documentCount: number }).documentCount, 1);
    useBundle(await writeBundle({ searchDocs: [{ id: 'x', kind: 'not-a-kind' }] }));
    await assert.rejects(readSearchPayload('searchDocs'), isBundleError('bundle-invalid'));
  });

  it('fails fast on an empty bundle directory setting', async () => {
    process.env['ATLAS_BUNDLE_DIR'] = '   ';
    await assert.rejects(loadBundle(), isBundleError('config-invalid'));
  });
});
