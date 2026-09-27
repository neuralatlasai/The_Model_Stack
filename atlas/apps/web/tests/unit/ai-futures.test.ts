import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, test } from 'node:test';
import {
  FIELD,
  GEOS,
  GEO_NAME,
  HIST_NARROW,
  HIST_WIDE,
  KINDS,
  KIND_ROW,
  MAP,
  SHARE_NARROW,
  SHARE_WIDE,
  SHARE_WINDOW,
  fieldLine,
  fieldMap,
  fieldX,
  fitBands,
  fitRange,
  futures,
  kindGeoMatrix,
  kindShare,
  labelWidth,
  linkLabel,
  monotone,
  monotoneAt,
  monotonePath,
  partition,
  presentGeos,
  shareBands,
  statusCounts,
  unitHistogram,
} from '../../src/lib/ai-futures.ts';
import { ICONS, ICON_VIEWBOX } from '../../src/lib/futures-icons.ts';
import raw from '../../src/data/ai-futures-ecosystem.json' with { type: 'json' };

/** The supplied list, verbatim (research/ai-futures-ecosystem/source-2026-09-27.md). */
function suppliedRows(): { rank: number; geo: string; name: string; url: string; fit: number; reason: string }[] {
  const text = readFileSync(
    new URL('../../../../../research/ai-futures-ecosystem/source-2026-09-27.md', import.meta.url),
    'utf8',
  );
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
      if (!entry.links.url.startsWith('https://'))
        assert.match(entry.verification.note, /certificate/iu, `#${String(entry.rank)} explains its http link`);
      if (entry.verification.status === 'redirected')
        assert.notEqual(entry.links.url, entry.links.listed, `#${String(entry.rank)}`);
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
    const hype =
      /\b(?:leading|cutting[- ]edge|world[- ]class|groundbreaking|revolutionary|state[- ]of[- ]the[- ]art|best[- ]in[- ]class|premier|unparalleled)\b/iu;
    for (const entry of entries)
      if (entry.description !== null) assert.doesNotMatch(entry.description, hype, `#${String(entry.rank)}`);
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
  });
});

describe('field line', () => {
  const { entries } = futures();
  const line = fieldLine(entries);

  test('one point per source, at the centre of its rank column, on a line within one fit point of its fit', () => {
    assert.equal(line.points.length, 100);
    const { min, max } = fitRange(entries);
    assert.equal(min, 65);
    assert.equal(max, 100);
    const span = FIELD.height - FIELD.top - FIELD.bottom;
    for (const point of line.points) {
      const entry = entries[point.rank - 1];
      assert.ok(entry !== undefined);
      assert.equal(point.x, fieldX(point.rank, 100));
      const exact = FIELD.top + ((max - entry.fit) / (max - min)) * span;
      assert.ok(
        Math.abs(point.y - exact) <= line.unit + 0.2,
        `#${String(point.rank)} is ${String(Math.abs(point.y - exact))} from its fit`,
      );
    }
    assert.equal(line.points[0]?.y, line.peak);
    assert.equal(line.points.at(-1)?.y, line.base);
  });

  test('the line never rises down the ranking, and the halftone stays below it', () => {
    for (let i = 1; i < line.points.length; i += 1)
      assert.ok((line.points[i]?.y ?? 0) >= (line.points[i - 1]?.y ?? 0) - 0.05);
    assert.match(line.d, /^M[\d.\s]+(?:C[\d.\s-]+)+$/u);
    assert.ok(line.halftone.length > 0);
    const dots = [...line.halftone.matchAll(/M([\d.]+) ([\d.]+)a([\d.]+)/gu)].map((m) => ({
      x: Number(m[1]) + Number(m[3]),
      y: Number(m[2]),
    }));
    for (const dot of dots) {
      const col = Math.min(99, Math.max(0, Math.round(dot.x / (FIELD.width / 100) - 0.5)));
      const neighbours = [line.points[Math.max(0, col - 1)], line.points[col], line.points[Math.min(99, col + 1)]].map(
        (p) => p?.y ?? 0,
      );
      assert.ok(dot.y >= Math.min(...neighbours), `a halftone dot at ${String(dot.x)} sits above the line`);
      assert.ok(dot.y <= line.base + 0.01);
    }
  });

  test('the monotone cubic passes through its knots and never overshoots them', () => {
    const knots: [number, number][] = [
      [0, 10],
      [10, 10],
      [20, 30],
      [30, 31],
      [40, 60],
    ];
    const curve = monotone(knots);
    for (const [x, y] of knots) assert.ok(Math.abs(monotoneAt(curve, x) - y) < 1e-9);
    for (let x = 0; x <= 40; x += 0.5) {
      const y = monotoneAt(curve, x);
      assert.ok(y >= 10 - 1e-9 && y <= 60 + 1e-9);
    }
    for (let x = 0.5; x <= 40; x += 0.5) assert.ok(monotoneAt(curve, x) >= monotoneAt(curve, x - 0.5) - 1e-9);
    assert.equal(monotonePath([]), '');
  });
});

describe('field map (treemap by geography)', () => {
  const { entries } = futures();
  const map = fieldMap(entries);

  test('one tile per source inside its geography’s boundary, tiles never overlapping', () => {
    assert.equal(map.tiles.length, 100);
    assert.deepEqual(
      map.clusters.map((cluster) => cluster.geo),
      presentGeos(entries).map((geo) => geo.key),
    );
    for (const tile of map.tiles) {
      const entry = entries[tile.rank - 1];
      assert.ok(entry !== undefined);
      assert.equal(tile.geo, entry.geo);
      assert.equal(tile.kind, entry.kind);
      const cluster = map.clusters.find((c) => c.geo === tile.geo);
      assert.ok(cluster !== undefined);
      assert.ok(
        tile.x >= cluster.x + MAP.pad - 0.2 && tile.x + tile.w <= cluster.x + cluster.w - MAP.pad + 0.3,
        `#${String(tile.rank)} leaves its cluster horizontally`,
      );
      assert.ok(
        tile.y >= cluster.y + MAP.pad - 0.2 && tile.y + tile.h <= cluster.y + cluster.h - MAP.pad + 0.3,
        `#${String(tile.rank)} leaves its cluster vertically`,
      );
      assert.ok(tile.x + tile.w <= map.width + 0.3 && tile.y + tile.h <= map.height + 0.3);
    }
    for (const a of map.tiles)
      for (const b of map.tiles)
        if (a.rank < b.rank) {
          const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          assert.ok(overlapX <= 0.3 || overlapY <= 0.3, `#${String(a.rank)} and #${String(b.rank)} overlap`);
        }
    for (let i = 1; i < map.clusters.length; i += 1) {
      const prev = map.clusters[i - 1];
      const next = map.clusters[i];
      assert.ok(
        prev !== undefined && next !== undefined && next.y >= prev.y + prev.h + 10,
        'clusters leave room for their labels',
      );
    }
  });

  test('tile area is one scale × fit in every cluster, and reading order is rank order', () => {
    for (const tile of map.tiles) {
      const entry = entries[tile.rank - 1];
      assert.ok(entry !== undefined);
      const area = tile.w * tile.h;
      assert.ok(
        Math.abs(area / (map.scale * entry.fit) - 1) < 0.03,
        `#${String(tile.rank)} area ${String(area)} is not ∝ fit`,
      );
    }
    for (const cluster of map.clusters) {
      const tiles = map.tiles.filter((tile) => tile.geo === cluster.geo);
      const reading = [...tiles].sort((a, b) => a.y - b.y || a.x - b.x).map((tile) => tile.rank);
      assert.deepEqual(
        reading,
        tiles.map((tile) => tile.rank),
      );
      assert.equal(tiles.filter((tile) => tile.icon).length, Math.min(MAP.icons, tiles.length));
      assert.ok(tiles.slice(0, MAP.icons).every((tile) => tile.icon));
    }
  });

  test('partition keeps order and balances weight', () => {
    const runs = partition([5, 5, 5, 5, 5, 5], (v) => v, 3);
    assert.deepEqual(runs, [
      [5, 5],
      [5, 5],
      [5, 5],
    ]);
    assert.deepEqual(
      partition([1, 2, 3], (v) => v, 1),
      [[1, 2, 3]],
    );
  });
});

describe('who ranks where (kind share)', () => {
  const { entries } = futures();

  test('every rank’s shares sum to 1 over a window that never leaves the list', () => {
    const raw = kindShare(entries, SHARE_WINDOW, 0);
    assert.equal(raw.length, 100);
    for (const row of raw) {
      assert.equal(row.length, KINDS.length);
      assert.ok(Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 1e-9);
      for (const value of row) assert.ok(Number.isInteger(Math.round(value * SHARE_WINDOW * 1e6) / 1e6));
    }
    const first = raw[0];
    const top = entries.slice(0, SHARE_WINDOW);
    assert.deepEqual(
      first,
      KINDS.map((kind) => top.filter((entry) => entry.kind === kind.key).length / SHARE_WINDOW),
    );
    for (const row of kindShare(entries)) assert.ok(Math.abs(row.reduce((a, b) => a + b, 0) - 1) < 1e-9);
  });

  test('bands stack to the full plot; each carries a label inside the plot and labels never collide', () => {
    for (const box of [SHARE_WIDE, SHARE_NARROW]) {
      const bands = shareBands(entries, box);
      assert.equal(bands.length, KINDS.length);
      const labels = bands.flatMap((band) => (band.label === null ? [] : [band.label]));
      assert.equal(labels.length, KINDS.length, `every band is labelled at ${String(box.width)}`);
      for (const label of labels) {
        assert.ok(label.x >= box.left && label.x + label.w <= box.width - box.right + 0.1);
        assert.ok(label.y >= box.top && label.y + label.h <= box.height - box.bottom + 0.1);
      }
      for (const a of labels)
        for (const b of labels)
          if (a !== b)
            assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, 'labels overlap');
      for (const band of bands) assert.match(band.d, /^M[\d.\s]+(?:L[\d.\s]+)+Z$/u);
      assert.ok(labelWidth('Measurement', box.font) > labelWidth('Labs', box.font));
    }
  });
});

describe('fit by geography (unit histogram)', () => {
  const { entries } = futures();

  test('fit bands cover 65–100 in fives, the lone maximum joining the band below', () => {
    assert.deepEqual(fitBands(65, 100), [
      { min: 65, max: 69 },
      { min: 70, max: 74 },
      { min: 75, max: 79 },
      { min: 80, max: 84 },
      { min: 85, max: 89 },
      { min: 90, max: 94 },
      { min: 95, max: 100 },
    ]);
    assert.deepEqual(fitBands(66, 72), [
      { min: 66, max: 69 },
      { min: 70, max: 72 },
    ]);
  });

  test('one unit per source in its fit column, stacked without overlap, band labels carrying real rank spans', () => {
    for (const box of [HIST_WIDE, HIST_NARROW]) {
      const hist = unitHistogram(entries, box);
      assert.equal(hist.units.length, 100);
      assert.equal(hist.columns.length, 36);
      const columnOf = new Map(hist.columns.map((column) => [column.fit, column.x]));
      for (const unit of hist.units) {
        const entry = entries[unit.rank - 1];
        assert.ok(entry !== undefined);
        assert.equal(unit.x, columnOf.get(entry.fit));
        assert.ok(unit.y < hist.base && unit.y > 0);
        assert.ok(unit.x > 0 && unit.x < box.width);
      }
      const seen = new Set(hist.units.map((unit) => `${String(unit.x)}:${String(unit.y)}`));
      assert.equal(seen.size, 100, 'two units share a slot');
      for (let i = 1; i < hist.columns.length; i += 1)
        assert.ok((hist.columns[i]?.x ?? 0) - (hist.columns[i - 1]?.x ?? 0) >= hist.column - 0.2);
      for (const band of hist.bands) {
        const ranks = entries
          .filter((entry) => entry.fit >= band.min && entry.fit <= band.max)
          .map((entry) => entry.rank);
        assert.equal(band.first, Math.min(...ranks));
        assert.equal(band.last, Math.max(...ranks));
        assert.ok(band.top >= box.top - 0.1);
      }
    }
  });
});

describe('pictograms', () => {
  test('one stroke path per kind on the 24-unit grid', () => {
    assert.equal(ICON_VIEWBOX, '0 0 24 24');
    for (const kind of KINDS) {
      const d = ICONS[kind.key];
      assert.match(d, /^M[-\d.\s,MLHVCSAZmlhvcsaz]+$/u, kind.key);
      for (const value of d.match(/-?\d+(?:\.\d+)?/gu) ?? [])
        assert.ok(Math.abs(Number(value)) <= 24, `${kind.key} leaves the grid`);
    }
    assert.equal(new Set(KINDS.map((kind) => ICONS[kind.key])).size, KINDS.length, 'two kinds share a pictogram');
    for (const kind of KINDS) assert.ok(KIND_ROW[kind.key].split(/\s+/u).length <= 6);
    for (const geo of GEOS) assert.ok(GEO_NAME[geo.key].split(/\s+/u).length <= 6);
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
