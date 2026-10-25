import assert from 'node:assert/strict';
import fs, { mkdtemp, readdir, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it, type TestContext } from 'node:test';
import { BUNDLE_SCHEMA_VERSION, BundleManifestSchema, diagnostic, type Diagnostic } from '@atlas/core';
import { groupByFile, sortDiagnostics } from '../../src/emit/diagnostics.ts';
import { stableStringify } from '../../src/emit/json.ts';
import { bundleFiles, BundleWriteError, writeBundle } from '../../src/emit/write.ts';
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
      counts: {
        documents: documentIds.length,
        planned: 0,
        figures: 0,
        equations: 0,
        references: 0,
        terms: 0,
        searchDocs: 0,
      },
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

/** Fault injection stays at the filesystem boundary without changing the writer's API. */
function mockRename(t: TestContext, implementation: typeof fs.rename): void {
  const mocked = t.mock.method(fs, 'rename', implementation);
  syncBuiltinESMExports();
  t.after(() => {
    mocked.mock.restore();
    syncBuiltinESMExports();
  });
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

  it('restores before falling back when installing the staged directory is refused', async (t) => {
    const out = path.join(root, 'install-refused');
    const previous = tinyAtlas(['ms.root', 'ms.chapter.5']);
    const next = tinyAtlas(['ms.root', 'ms.chapter.6']);
    await writeBundle(previous, out);
    const previousManifest = await readFile(path.join(out, 'bundle.json'), 'utf8');
    const actualRename = fs.rename;
    const renames: string[] = [];
    mockRename(t, async (from, to) => {
      if (from === out) renames.push('retire');
      if (to === out && typeof from === 'string' && from.includes('.tmp-')) {
        renames.push('install');
        throw Object.assign(new Error('injected Windows staging lock'), { code: 'EPERM' });
      }
      if (to === out && typeof from === 'string' && from.includes('.old-')) renames.push('restore');
      await actualRename(from, to);
    });
    const actualWriteFile = fs.writeFile;
    let published = false;
    const writes = t.mock.method(fs, 'writeFile', async (...args: Parameters<typeof fs.writeFile>) => {
      if (args[0] === path.join(out, 'bundle.json')) {
        assert.equal(await readFile(args[0], 'utf8'), previousManifest, 'restore precedes publication');
        for (const file of bundleFiles(next)) {
          if (file.relative !== 'bundle.json') {
            assert.equal(await readFile(path.join(out, file.relative), 'utf8'), file.content);
          }
        }
        published = true;
      }
      await actualWriteFile(...args);
    });
    syncBuiltinESMExports();
    t.after(() => {
      writes.mock.restore();
      syncBuiltinESMExports();
    });

    const report = await writeBundle(next, out);
    assert.equal(report.mode, 'in-place');
    assert.deepEqual(renames, ['retire', 'install', 'restore']);
    assert.equal(published, true, 'the new manifest follows every new document and shared file');
    assert.deepEqual((await readdir(path.join(out, 'docs'))).sort(), ['ms.chapter.6.json', 'ms.root.json']);
    assert.deepEqual(
      (await readdir(root)).filter((name) => name.includes('.tmp-') || name.includes('.old-')),
      [],
    );
  });

  it('keeps the existing fallback when retiring the target is refused', async (t) => {
    const out = path.join(root, 'retire-refused');
    await writeBundle(tinyAtlas(['ms.root', 'ms.chapter.5']), out);
    const actualRename = fs.rename;
    let attempts = 0;
    mockRename(t, async (from, to) => {
      if (from === out) {
        attempts += 1;
        throw Object.assign(new Error('injected Windows target lock'), { code: 'EBUSY' });
      }
      await actualRename(from, to);
    });
    const report = await writeBundle(tinyAtlas(['ms.root']), out);
    assert.equal(report.mode, 'in-place');
    assert.equal(attempts, 1);
    assert.deepEqual(await readdir(path.join(out, 'docs')), ['ms.root.json']);
  });

  it('restores the previous bundle and rejects unrelated installation errors', async (t) => {
    const out = path.join(root, 'install-io-error');
    const previous = tinyAtlas(['ms.root', 'ms.chapter.5']);
    await writeBundle(previous, out);
    const actualRename = fs.rename;
    const failure = Object.assign(new Error('injected I/O failure'), { code: 'EIO' });
    mockRename(t, async (from, to) => {
      if (to === out && typeof from === 'string' && from.includes('.tmp-')) throw failure;
      await actualRename(from, to);
    });
    await assert.rejects(writeBundle(tinyAtlas(['ms.root']), out), (error: unknown) => {
      assert.ok(error instanceof BundleWriteError);
      assert.equal(error.cause, failure);
      return true;
    });
    for (const file of bundleFiles(previous)) {
      assert.equal(await readFile(path.join(out, file.relative), 'utf8'), file.content);
    }
    assert.deepEqual(
      (await readdir(root)).filter((name) => name.includes('.tmp-') || name.includes('.old-')),
      [],
    );
  });

  it('restores but does not start the fallback after cancellation during installation', async (t) => {
    const out = path.join(root, 'install-aborted');
    const previous = tinyAtlas(['ms.root', 'ms.chapter.5']);
    await writeBundle(previous, out);
    const controller = new AbortController();
    const reason = new Error('cancel the bundle write');
    const actualRename = fs.rename;
    mockRename(t, async (from, to) => {
      if (to === out && typeof from === 'string' && from.includes('.tmp-')) {
        controller.abort(reason);
        throw Object.assign(new Error('injected staging lock'), { code: 'EPERM' });
      }
      await actualRename(from, to);
    });
    await assert.rejects(writeBundle(tinyAtlas(['ms.root']), out, { signal: controller.signal }), (error: unknown) => {
      assert.ok(error instanceof BundleWriteError);
      assert.equal(error.cause, reason);
      return true;
    });
    for (const file of bundleFiles(previous)) {
      assert.equal(await readFile(path.join(out, file.relative), 'utf8'), file.content);
    }
    assert.deepEqual(
      (await readdir(root)).filter((name) => name.includes('.tmp-') || name.includes('.old-')),
      [],
    );
  });

  it('preserves the retired bundle if restoration itself is refused', async (t) => {
    const out = path.join(root, 'restore-refused');
    const previous = tinyAtlas(['ms.root', 'ms.chapter.5']);
    await writeBundle(previous, out);
    const actualRename = fs.rename;
    const restoreFailure = Object.assign(new Error('injected restoration lock'), { code: 'EBUSY' });
    let retired = '';
    mockRename(t, async (from, to) => {
      if (from === out && typeof to === 'string') retired = to;
      if (to === out && typeof from === 'string' && from.includes('.tmp-')) {
        throw Object.assign(new Error('injected staging lock'), { code: 'EPERM' });
      }
      if (to === out && from === retired) throw restoreFailure;
      await actualRename(from, to);
    });
    await assert.rejects(writeBundle(tinyAtlas(['ms.root']), out), (error: unknown) => {
      assert.ok(error instanceof BundleWriteError);
      assert.equal(error.cause, restoreFailure);
      return true;
    });
    assert.notEqual(retired, '');
    await assert.rejects(readdir(out), { code: 'ENOENT' });
    for (const file of bundleFiles(previous)) {
      assert.equal(await readFile(path.join(retired, file.relative), 'utf8'), file.content);
    }
    assert.deepEqual(
      (await readdir(root)).filter((name) => name.includes('.tmp-')),
      [],
    );
    assert.equal(path.dirname(retired), root);
    assert.ok(path.basename(retired).startsWith('.restore-refused.old-'));
    await rm(retired, { recursive: true, force: true });
  });
});
