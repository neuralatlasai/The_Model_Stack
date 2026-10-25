import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import { assertSiteBudget, measureSite } from '../../../../scripts/check-site-size.ts';

describe('Pages artifact budget', () => {
  it('counts all nested bytes, including non-HTML assets', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'atlas-size-'));
    try {
      await mkdir(join(directory, '_astro'));
      await writeFile(join(directory, 'index.html'), '<p>Atlas</p>');
      await writeFile(join(directory, '_astro', 'asset.bin'), new Uint8Array(37));
      assert.deepEqual(await measureSite(directory), { files: 2, bytes: 49 });
    } finally {
      const target = resolve(directory);
      assert.equal(dirname(target), resolve(tmpdir()));
      assert.ok(basename(target).startsWith('atlas-size-'));
      await rm(target, { recursive: true, force: true });
    }
  });

  it('accepts the budget boundary and rejects one extra byte or an empty build', () => {
    assert.doesNotThrow(() => {
      assertSiteBudget({ files: 1, bytes: 100 }, 100);
    });
    assert.throws(() => {
      assertSiteBudget({ files: 1, bytes: 101 }, 100);
    }, /Reduce repeated payloads/u);
    assert.throws(() => {
      assertSiteBudget({ files: 0, bytes: 0 }, 100);
    }, /empty/u);
    assert.throws(() => {
      assertSiteBudget({ files: 1, bytes: 1 }, Number.NaN);
    }, /positive integer/u);
  });
});
