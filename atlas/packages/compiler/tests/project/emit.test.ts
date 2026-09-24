import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { BUNDLE_SCHEMA_VERSION, BundleManifestSchema, diagnostic, type Diagnostic } from '@atlas/core';
import { groupByFile, sortDiagnostics } from '../../src/emit/diagnostics.ts';
import { stableStringify } from '../../src/emit/json.ts';
import { BundleWriteError, writeBundle } from '../../src/emit/write.ts';
import type { CompiledAtlas } from '../../src/project/types.ts';
import { buildSearchIndex } from '../../src/search/index-builder.ts';

describe('stableStringify', () => {
  it('sorts keys recursively, keeps array order, drops undefined, ends with a newline', () => {
    const a = stableStringify({ b: 1, a: { d: [3, 1], c: undefined, e: null } });
    const b = stableStringify({ a: { e: null, d: [3, 1] }, b: 1 });
    assert.equal(a, b);
    assert.equal(a, '{"a":{"d":[3,1],"e":null},"b":1}\n');
  });

  it('rejects values JSON cannot represent faithfully', () => {
    assert.throws(() => stableStringify({ x: Number.NaN }), /non-finite number at \$\.x/u);
    assert.throws(() => stableStringify({ x: new Map() }), /unsupported JSON value/u);
  });
});

describe('diagnostic ordering', () => {
  it('orders by severity, file, line and removes exact duplicates', () => {
    const items: Diagnostic[] = [
      diagnostic('link-planned', 'p', { file: 'b.md', line: 3 }),
      diagnostic('link-unresolved', 'u', { file: 'b.md', line: 9 }),
      diagnostic('frontmatter-invalid', 'f', { file: 'z.md', line: 2 }),
      diagnostic('link-unresolved', 'u', { file: 'a.md', line: 1 }),
      diagnostic('link-unresolved', 'u', { file: 'a.md', line: 1 }),
      diagnostic('reference-stack-parse', 'g'),
    ];
    const sorted = sortDiagnostics(items);
    assert.deepEqual(
      sorted.map((item) => `${item.severity}:${item.file ?? '-'}:${item.line === null ? '-' : String(item.line)}`),
      ['error:z.md:2', 'warning:-:-', 'warning:a.md:1', 'warning:b.md:9', 'info:b.md:3'],
    );
    assert.deepEqual([...groupByFile(sorted).keys()], ['z.md', '(global)', 'a.md', 'b.md']);
  });
});

function tinyAtlas(documentIds: readonly string[]): CompiledAtlas {
  const documents = documentIds.map((id) => ({ meta: { id } })) as unknown as CompiledAtlas['documents'];
  return {
    manifest: {
      schemaVersion: BUNDLE_SCHEMA_VERSION,
      edition: '1.0',
      compiledAt: '2026-09-23T00:00:00.000Z',
      docsRoot: 'docs',
      documents: [...documentIds],
      counts: { documents: documentIds.length, planned: 0, figures: 0, equations: 0, references: 0, terms: 0, searchDocs: 0 },
      diagnostics: { error: 0, warning: 0, info: 0 },
    },
    documents,
    graph: { nodes: {}, edges: [], external: [], tree: [], order: [] },
    registry: { references: [], terms: [], systems: [], labs: [], lineage: [], equations: [], objects: [] },
    searchDocs: [],
    searchIndex: buildSearchIndex([]),
    diagnostics: [],
  };
}

describe('writeBundle', () => {
  let root: string;

  before(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), 'atlas-bundle-'));
  });

  after(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('writes every bundle file with a valid manifest and replaces a previous bundle atomically', async () => {
    const out = path.join(root, '.atlas');
    const first = await writeBundle(tinyAtlas(['ms.root', 'ms.chapter.5']), out);
    assert.equal(first.mode, 'atomic');
    assert.deepEqual((await readdir(path.join(out, 'docs'))).sort(), ['ms.chapter.5.json', 'ms.root.json']);
    const manifest = BundleManifestSchema.parse(JSON.parse(await readFile(path.join(out, 'bundle.json'), 'utf8')));
    assert.deepEqual(manifest.documents, ['ms.root', 'ms.chapter.5']);
    for (const name of ['graph.json', 'registry.json', 'search-docs.json', 'search-index.json', 'diagnostics.json']) {
      JSON.parse(await readFile(path.join(out, name), 'utf8'));
    }

    await mkdir(path.join(out, 'stale-marker'));
    await writeFile(path.join(out, 'stale-marker', 'x.txt'), 'x');
    const second = await writeBundle(tinyAtlas(['ms.root']), out);
    assert.equal(second.mode, 'atomic');
    assert.deepEqual(await readdir(path.join(out, 'docs')), ['ms.root.json']);
    assert.ok(!(await readdir(out)).includes('stale-marker'), 'the old directory is replaced, not merged');
    assert.deepEqual(
      (await readdir(root)).filter((name) => name.includes('.tmp-') || name.includes('.old-')),
      [],
      'no staging or retired directories remain',
    );
  });

  it('is byte-for-byte deterministic', async () => {
    const a = path.join(root, 'a');
    const b = path.join(root, 'b');
    await writeBundle(tinyAtlas(['ms.root']), a);
    await writeBundle(tinyAtlas(['ms.root']), b);
    for (const name of ['bundle.json', 'graph.json', 'search-index.json', 'docs/ms.root.json']) {
      assert.equal(await readFile(path.join(a, name), 'utf8'), await readFile(path.join(b, name), 'utf8'), name);
    }
  });

  it('refuses an invalid manifest before touching the output', async () => {
    const atlas = tinyAtlas(['ms.root']);
    const broken = { ...atlas, manifest: { ...atlas.manifest, schemaVersion: 99 } } as unknown as CompiledAtlas;
    const out = path.join(root, 'never');
    await assert.rejects(writeBundle(broken, out), BundleWriteError);
    await assert.rejects(readdir(out));
  });
});
