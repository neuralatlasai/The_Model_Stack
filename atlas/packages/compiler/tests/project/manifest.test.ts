import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, it } from 'node:test';
import { ManifestError, parseManifest } from '../../src/project/manifest.ts';
import { must } from './fixtures.ts';
import { DOCS_DIR } from './paths.ts';

describe('parseManifest', () => {
  it('parses the real atlas-manifest.json with the full plan', async () => {
    const manifest = parseManifest(await readFile(path.join(DOCS_DIR, 'atlas-manifest.json'), 'utf8'));
    const parts = manifest.volumes.flatMap((volume) => volume.parts);
    const chapters = parts.flatMap((part) => part.chapters);
    const sections = chapters.flatMap((chapter) => chapter.sections);
    assert.equal(manifest.volumes.length, 3);
    assert.equal(parts.length, 11);
    assert.equal(chapters.length, 66);
    assert.equal(sections.length, 396);
    // A–H from book_plan.md, plus I: the evaluation ecosystem (added 2026-09-25).
    assert.deepEqual(
      manifest.appendices.map((appendix) => appendix.letter),
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'],
    );
    assert.equal(manifest.front_matter.length, 3);
    const chapter5 = must(chapters.find((chapter) => chapter.id === 'ms.chapter.5'));
    assert.equal(chapter5.slug, 'ch05-minimal-transformer-and-execution-trace');
    const section2 = must(chapter5.sections[1]);
    assert.equal(section2.id, 'ms.section.5.2');
    assert.equal(section2.number, '5.2');
  });

  it('rejects invalid JSON with a ManifestError', () => {
    assert.throws(() => parseManifest('{ not json'), (error: unknown) => error instanceof ManifestError && error.message.includes('not valid JSON'));
  });

  it('rejects a schema violation and names the path', () => {
    const bad = JSON.stringify({ edition: '1.0', date: '2026-09-20', root: 'docs', volumes: [{ id: 'nope' }], appendices: [], front_matter: [] });
    assert.throws(() => parseManifest(bad), (error: unknown) => error instanceof ManifestError && error.message.includes('volumes.0'));
  });

  it('rejects paths that escape docs/', () => {
    const manifest = {
      edition: '1.0',
      date: '2026-09-20',
      root: 'docs',
      volumes: [{ id: 'ms.volume.1', number: 1, title: 'V', slug: 'vol-01', path: '../outside.md', parts: [] }],
      appendices: [],
      front_matter: [],
    };
    assert.throws(() => parseManifest(JSON.stringify(manifest)), ManifestError);
  });
});
