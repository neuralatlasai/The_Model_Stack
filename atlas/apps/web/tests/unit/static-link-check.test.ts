import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const checker = fileURLToPath(new URL('../../../../scripts/check-links.ts', import.meta.url));

test('standalone deferred/search JSON must resolve files, fragments and deployment base', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-links-'));
  try {
    const dist = join(directory, 'dist');
    await mkdir(join(dist, 'child'), { recursive: true });
    await writeFile(join(dist, 'index.html'), '<main id="main">Atlas</main>');
    await writeFile(join(dist, 'child', 'index.html'), '<h1 id="known">Section</h1>');
    await writeFile(join(directory, 'outside.html'), '<p>Outside the artifact</p>');
    const run = () => spawnSync(process.execPath, [checker, dist, '/book/'], { encoding: 'utf8', timeout: 10_000 });
    await writeFile(join(dist, 'index.json'), JSON.stringify({ children: [{ url: '/book/child/#known' }] }));
    const valid = run();
    assert.equal(valid.status, 0, valid.stdout + valid.stderr);
    for (const [url, diagnostic] of [
      ['/outside/', 'data URLs outside /book/: 1'],
      ['/book/missing/', 'broken links (no built file): 1'],
      ['/book/child/#missing', 'fragments with no matching id: 1'],
      ['/book/../outside.html', 'broken links (no built file): 1'],
      ['/book/%2e%2e/outside.html', 'broken links (no built file): 1'],
    ]) {
      await writeFile(join(dist, 'index.json'), JSON.stringify({ stored: { record: { url } } }));
      const result = run();
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.ok(result.stdout.includes(diagnostic ?? ''), result.stdout);
    }
  } finally {
    const target = resolve(directory);
    assert.equal(dirname(target), resolve(tmpdir()));
    assert.ok(basename(target).startsWith('atlas-links-'));
    await rm(target, { recursive: true, force: true });
  }
});
