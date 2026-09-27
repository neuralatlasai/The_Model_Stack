import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import { BANDS, BAND_DEPTH, GEOS, GLYPHS, KINDS, SCOPE, SWEEP_S, bandOf, futures, kindGeoMatrix, linkLabel, presentGeos, scopeLayout, statusCounts } from '../../src/lib/ai-futures.ts';
import raw from '../../src/data/ai-futures-ecosystem.json' with { type: 'json' };

/** The supplied list, verbatim (research/ai-futures-ecosystem/source-2026-09-27.md). */
function suppliedRows(): { rank: number; geo: string; name: string; url: string; fit: number; reason: string }[] {
  const text = readFileSync(new URL('../../../../../research/ai-futures-ecosystem/source-2026-09-27.md', import.meta.url), 'utf8');
  const row = /^\| (\d+) \| (.+?) \| \[(.+?)\]\((https:\/\/[^)]+)\) \| \*\*(\d+)\*\* \| (.+?) \|$/u;
  return text
    .split(/\r?\n/u)
    .map((line) => row.exec(line))
    .filter((match) => match !== null)
    .map((match) => ({
      rank: Number(match[1]),
      // Flags are written as text: "🇺🇸 US" → "US", "🇺🇸/global" → "US/global".
      geo: (match[2] ?? '')
        .replace(/\u{1F1FA}\u{1F1F8}(?=\/)/gu, 'US')
        .replace(/\u{1F1E8}\u{1F1F3}(?=\/)/gu, 'China')
        .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
        .trim(),
      name: match[3] ?? '',
      url: match[4] ?? '',
      fit: Number(match[5]),
      reason: match[6] ?? '',
    }));
}

describe('AI futures data', () => {
  const { entries } = futures();

  test('all 100 ranks, in order, with the supplier’s name, geography, listed URL, fit score, and reason verbatim', () => {
    const supplied = suppliedRows();
    assert.equal(supplied.length, 100);
    assert.equal(entries.length, 100);
    entries.forEach((entry, index) => {
      const source = supplied[index];
      assert.ok(source !== undefined);
      assert.equal(entry.rank, index + 1);
      assert.equal(entry.rank, source.rank);
      assert.equal(entry.name, source.name, `#${String(entry.rank)} name`);
      assert.equal(entry.geoSupplied, source.geo, `#${String(entry.rank)} geography`);
      assert.equal(entry.links.listed, source.url, `#${String(entry.rank)} listed URL`);
      assert.equal(entry.fit, source.fit, `#${String(entry.rank)} fit`);
      assert.equal(entry.reason, source.reason, `#${String(entry.rank)} reason`);
    });
  });

  test('links carry no tracking parameters; http only where HTTPS is broken; an updated address differs from the listed one', () => {
    for (const entry of entries) {
      assert.match(entry.links.listed, /^https:\/\//u);
      for (const url of [entry.links.listed, entry.links.url]) assert.doesNotMatch(url, /utm_/u, url);
      if (!entry.links.url.startsWith('https://')) assert.match(entry.verification.note, /certificate/iu, `#${String(entry.rank)} explains its http link`);
      if (entry.verification.status === 'redirected') assert.notEqual(entry.links.url, entry.links.listed, `#${String(entry.rank)}`);
    }
  });

  test('only reached sources carry a description; unreached ones fall back to the supplier’s reason', () => {
    for (const entry of entries) {
      const reached = entry.verification.status !== 'unverified';
      assert.equal(entry.description !== null, reached, `#${String(entry.rank)}`);
      if (!reached) assert.ok(entry.verification.note.length > 0, `#${String(entry.rank)} says why it is UNVERIFIED`);
    }
    const counts = statusCounts(entries);
    assert.equal(counts.verified + counts.redirected + counts.unverified, 100);
  });

  test('descriptions are plain: no hype vocabulary, no forbidden evidence label', () => {
    const hype = /\b(?:leading|cutting[- ]edge|world[- ]class|groundbreaking|revolutionary|state[- ]of[- ]the[- ]art|best[- ]in[- ]class|premier|unparalleled)\b/iu;
    for (const entry of entries) if (entry.description !== null) assert.doesNotMatch(entry.description, hype, `#${String(entry.rank)}`);
    assert.doesNotMatch(JSON.stringify(raw), /EMPIRICALLY-OBSERVED/u);
  });

  test('the supplier’s fit score never rises down the list', () => {
    for (let i = 1; i < entries.length; i += 1) assert.ok((entries[i]?.fit ?? 0) <= (entries[i - 1]?.fit ?? 0));
  });

  test('chapter anchors are real chapter numbers', () => {
    for (const entry of entries) for (const n of entry.chapters) assert.ok(Number.isInteger(n) && n >= 1 && n <= 66);
  });

  test('kind × geography matrix accounts for every entry, over all geographies and over those present', () => {
    for (const geos of [GEOS, presentGeos(entries)]) {
      const matrix = kindGeoMatrix(entries, geos);
      assert.equal(matrix.length, KINDS.length);
      for (const row of matrix) assert.equal(row.cells.length, geos.length);
      assert.equal(
        matrix.reduce((sum, row) => sum + row.total, 0),
        100,
      );
    }
  });});

describe('horizon scope', () => {
  const { entries } = futures();
  const layout = scopeLayout(entries);

  test('one glyph per entry, inside its kind sector and its fit band, none overlapping', () => {
    assert.equal(layout.glyphs.length, 100);
    assert.equal(BAND_DEPTH.reduce((sum, depth) => sum + depth, 0), SCOPE.R - SCOPE.r0);
    const sector = 180 / KINDS.length;
    for (const glyph of layout.glyphs) {
      const entry = entries[glyph.rank - 1];
      assert.ok(entry !== undefined);
      assert.equal(glyph.kind, entry.kind);
      assert.equal(glyph.band, bandOf(entry.fit));
      const r = Math.hypot(glyph.x - SCOPE.cx, SCOPE.cy - glyph.y);
      const ro = SCOPE.R - BAND_DEPTH.slice(0, glyph.band).reduce((sum, depth) => sum + depth, 0);
      assert.ok(r <= ro + 0.5 && r >= ro - (BAND_DEPTH[glyph.band] ?? 0) - 0.5, `#${String(glyph.rank)} radius ${String(r)} outside its band`);
      const k = KINDS.findIndex((kind) => kind.key === glyph.kind);
      assert.ok(glyph.angle <= 180 - k * sector && glyph.angle >= 180 - (k + 1) * sector, `#${String(glyph.rank)} outside its sector`);
      assert.ok(glyph.delay >= 0 && glyph.delay <= SWEEP_S);
    }
    for (const a of layout.glyphs) for (const b of layout.glyphs) if (a.rank < b.rank) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= SCOPE.spacing - 0.2, `#${String(a.rank)} and #${String(b.rank)} overlap`);
  });

  test('bands cover the supplier’s fit range with the highest band on the horizon', () => {
    assert.equal(bandOf(100), 0);
    assert.equal(bandOf(65), BANDS.length - 1);
    assert.throws(() => bandOf(64));
    assert.equal(layout.rings.at(-1)?.r, SCOPE.R);
    assert.equal(layout.edges.length, KINDS.length + 1);
    for (const kind of KINDS) assert.match(GLYPHS[kind.key], /^M[-\d.\s,MLHVAZahvlz]+$/u);
  });
});

describe('link labels', () => {
  test('host plus first meaningful path segment', () => {
    assert.equal(linkLabel('https://ai-2027.com/'), 'ai-2027.com');
    assert.equal(linkLabel('https://www.redwoodresearch.org/research/ai-control'), 'redwoodresearch.org/research');
    assert.equal(linkLabel('https://seed.bytedance.com/en/'), 'seed.bytedance.com');
    assert.equal(linkLabel('https://www.nist.gov/caisi'), 'nist.gov/caisi');
  });
});
