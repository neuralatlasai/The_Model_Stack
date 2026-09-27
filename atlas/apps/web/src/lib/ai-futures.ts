/**
 * AI futures (`/ai-futures/`): a supplied, ranked list of 100 sources on the
 * trajectory, control, and alignment of frontier AI, re-verified against each
 * source's own site and connected to the book.
 *
 *   data        src/data/ai-futures-ecosystem.json — rank, name, geography,
 *               fit score and reason verbatim from the supplied list
 *               (research/ai-futures-ecosystem/source-2026-09-27.md); the
 *               canonical URL, verification status, and description come from
 *               loading each site; kind and chapter anchors are the atlas's
 *               classification
 *   mentions    written pages whose prose names an entry (alias match, the
 *               same matcher as the evaluation ecosystem)
 */
import type { AtlasGraph, NodeId, ResearchDocument } from '@atlas/core';
import { z } from 'zod';
import raw from '../data/ai-futures-ecosystem.json' with { type: 'json' };
import { aliasMatcher, documentText, matches } from './eval-ecosystem.ts';

export const KINDS = [
  { key: 'scenario', label: 'Scenarios & forecasting', short: 'Scenarios', plural: 'scenario and forecasting sources' },
  {
    key: 'measurement',
    label: 'Capability & trajectory measurement',
    short: 'Measurement',
    plural: 'measurement sources',
  },
  {
    key: 'alignment',
    label: 'Alignment & control research',
    short: 'Alignment',
    plural: 'alignment and control groups',
  },
  {
    key: 'framework',
    label: 'Frontier safety frameworks & evaluators',
    short: 'Safety frameworks',
    plural: 'safety frameworks and evaluators',
  },
  { key: 'governance', label: 'Governance & strategy', short: 'Governance', plural: 'governance and strategy sources' },
  { key: 'lab', label: 'Frontier labs', short: 'Labs', plural: 'frontier labs' },
  { key: 'institute', label: 'Research institutes', short: 'Institutes', plural: 'research institutes' },
  { key: 'compute', label: 'Compute & infrastructure', short: 'Compute', plural: 'compute and infrastructure sources' },
] as const;
export type KindKey = (typeof KINDS)[number]['key'];

export const GEOS = [
  { key: 'us', label: 'US', code: 'US' },
  { key: 'cn', label: 'China', code: 'CN' },
  { key: 'uk', label: 'UK', code: 'UK' },
  { key: 'global', label: 'Global', code: 'GL' },
] as const;
export type GeoKey = (typeof GEOS)[number]['key'];

export const STATUSES = [
  { key: 'verified', label: 'verified', title: 'Loaded on the check date at the listed address and matches the entry' },
  {
    key: 'redirected',
    label: 'address updated',
    title:
      'The listed address redirects, fails, duplicates another entry, or is superseded by a canonical address; the working address comes from the organisation’s own site',
  },
  {
    key: 'unverified',
    label: 'UNVERIFIED',
    title: 'Could not be loaded or confirmed; the supplier’s reason is shown instead of a description',
  },
] as const;
export type StatusKey = (typeof STATUSES)[number]['key'];

const url = z.url({ protocol: /^https$/u });
/** A working address may be plain http only where the site's HTTPS certificate is broken (the note says so). */
const workingUrl = z.url({ protocol: /^https?$/u });
const EntrySchema = z.object({
  rank: z.number().int().min(1).max(100),
  name: z.string().min(1),
  short: z.string().min(1),
  org: z.string().min(1),
  geo: z.enum(GEOS.map((geo) => geo.key) as [GeoKey, ...GeoKey[]]),
  geoSupplied: z.string().min(1),
  fit: z.number().int().min(0).max(100),
  reason: z.string().min(1),
  kind: z.enum(KINDS.map((kind) => kind.key) as [KindKey, ...KindKey[]]),
  description: z.string().min(1).nullable(),
  chapters: z.array(z.number().int().min(1).max(66)),
  aliases: z.array(z.string().min(1)),
  links: z.object({ listed: url, url: workingUrl }),
  verification: z.object({
    status: z.enum(STATUSES.map((status) => status.key) as [StatusKey, ...StatusKey[]]),
    method: z.enum(['fetch', 'search', 'none']),
    note: z.string(),
  }),
});
const DataSchema = z.object({
  meta: z.object({
    title: z.string(),
    asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u),
    provenance: z.string(),
    source: z.string(),
  }),
  entries: z.array(EntrySchema).length(100),
});

export type FuturesEntry = z.infer<typeof EntrySchema>;
export type FuturesData = z.infer<typeof DataSchema>;

let cached: FuturesData | null = null;
/**
 * The validated list. Ranks run 1…100 without gaps; the supplier's fit score
 * never rises down the list; an entry is described only if it was reached, and
 * a corrected address differs from the listed one.
 */
export function futures(): FuturesData {
  if (cached !== null) return cached;
  const data = DataSchema.parse(raw);
  data.entries.forEach((entry, index) => {
    const at = `ai futures: #${String(entry.rank)}`;
    if (entry.rank !== index + 1) throw new Error(`ai futures: rank ${String(index + 1)} is out of order`);
    const previous = data.entries[index - 1];
    if (previous !== undefined && entry.fit > previous.fit)
      throw new Error(`${at} has a higher fit score than #${String(previous.rank)}`);
    const { status } = entry.verification;
    if (status === 'unverified' && entry.description !== null)
      throw new Error(`${at} is UNVERIFIED but carries a description`);
    if (status !== 'unverified' && entry.description === null)
      throw new Error(`${at} was reached but has no description`);
    if (status === 'redirected' && entry.links.url === entry.links.listed)
      throw new Error(`${at} is marked corrected but keeps the listed address`);
    if (status === 'redirected' && entry.verification.note.trim() === '')
      throw new Error(`${at} is marked corrected without evidence`);
    if (entry.links.url.startsWith('http:') && !/certificate/iu.test(entry.verification.note))
      throw new Error(`${at} links plain http without a certificate note`);
  });
  cached = data;
  return data;
}

// ── mentions in the book ─────────────────────────────────────────────────────

export interface Mention {
  readonly id: NodeId;
  readonly url: string;
  readonly number: string | null;
  readonly title: string;
  readonly chapter: number;
}

/** For each rank, the written sections and chapters whose prose names the entry, in reading order. */
export function findMentions(
  entries: readonly FuturesEntry[],
  docs: readonly ResearchDocument[],
  graph: AtlasGraph,
): Map<number, Mention[]> {
  const order = new Map(graph.order.map((id, index) => [id, index]));
  const texts = docs
    .filter(
      (doc) => doc.meta.chapter !== null && (doc.meta.entityType === 'section' || doc.meta.entityType === 'chapter'),
    )
    .map((doc) => ({ doc, text: documentText(doc) }));
  const out = new Map<number, Mention[]>();
  for (const entry of entries) {
    const matcher = aliasMatcher(entry.aliases);
    const found = texts
      .filter(({ text }) => matches(matcher, text))
      .map(({ doc }) => ({
        id: doc.meta.id,
        url: doc.route.url,
        number: doc.meta.section,
        title: doc.meta.shortTitle,
        chapter: doc.meta.chapter ?? 0,
      }))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    out.set(entry.rank, found);
  }
  return out;
}

// ── instruments ──────────────────────────────────────────────────────────────

/** The geographies that occur in the list, in GEOS order (an empty column is not drawn). */
export function presentGeos(entries: readonly FuturesEntry[]): readonly (typeof GEOS)[number][] {
  return GEOS.filter((geo) => entries.some((entry) => entry.geo === geo.key));
}

/** Kind × geography counts, rows in KINDS order, columns in the given geography order. */
export function kindGeoMatrix(
  entries: readonly FuturesEntry[],
  geos: readonly (typeof GEOS)[number][] = GEOS,
): readonly { readonly kind: KindKey; readonly cells: readonly number[]; readonly total: number }[] {
  return KINDS.map(({ key }) => {
    const cells = geos.map((geo) => entries.filter((entry) => entry.kind === key && entry.geo === geo.key).length);
    return { kind: key, cells, total: cells.reduce((a, b) => a + b, 0) };
  });
}

/** Entries per verification status, in STATUSES order. */
export function statusCounts(entries: readonly FuturesEntry[]): Readonly<Record<StatusKey, number>> {
  const counts: Record<StatusKey, number> = { verified: 0, redirected: 0, unverified: 0 };
  for (const entry of entries) counts[entry.verification.status] += 1;
  return counts;
}

/** Display form of a link: host plus the first path segment when the page is not the site root. */
export function linkLabel(href: string): string {
  const u = new URL(href);
  const host = u.hostname.replace(/^www\./u, '');
  const first = u.pathname.split('/').find((part) => part !== '' && !/^(?:en|en-us|index\.html?)$/iu.test(part));
  return first === undefined ? host : `${host}/${first}`;
}

// ── panel geometry ───────────────────────────────────────────────────────────
//
// Every instrument below is a pure layout in SVG user units, computed at build
// time from the data; the page draws it and the client only moves highlights.

const round = (n: number): number => Math.round(n * 10) / 10;
const num = (n: number): string => String(round(n));
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
const sum = (list: readonly number[]): number => list.reduce((a, b) => a + b, 0);

/** Short kind labels for rows, bands and the readout (≤ 1 word each). */
export const KIND_ROW: Readonly<Record<KindKey, string>> = {
  scenario: 'Scenarios',
  measurement: 'Measurement',
  alignment: 'Alignment',
  framework: 'Frameworks',
  governance: 'Governance',
  lab: 'Labs',
  institute: 'Institutes',
  compute: 'Compute',
};

/** Long geography names for cluster boundaries. */
export const GEO_NAME: Readonly<Record<GeoKey, string>> = {
  us: 'United States',
  cn: 'China',
  uk: 'United Kingdom',
  global: 'Global',
};

/** The supplier's fit range over the list. */
export function fitRange(entries: readonly FuturesEntry[]): { readonly min: number; readonly max: number } {
  const fits = entries.map((entry) => entry.fit);
  return { min: Math.min(...fits), max: Math.max(...fits) };
}

/** A monotone cubic through knots (Fritsch–Carlson): the curve never overshoots its knots. */
export interface Monotone {
  readonly xs: readonly number[];
  readonly ys: readonly number[];
  /** Tangent (dy/dx) at each knot. */
  readonly m: readonly number[];
}

export function monotone(points: readonly (readonly [number, number])[]): Monotone {
  const n = points.length;
  const xs = points.map((point) => point[0]);
  const ys = points.map((point) => point[1]);
  const x = (i: number): number => xs[i] ?? 0;
  const y = (i: number): number => ys[i] ?? 0;
  const secant = Array.from({ length: Math.max(0, n - 1) }, (_, i) => (y(i + 1) - y(i)) / (x(i + 1) - x(i) || 1));
  const s = (i: number): number => secant[i] ?? 0;
  const m = Array.from({ length: n }, (_, i) => {
    if (i === 0) return s(0);
    if (i === n - 1) return s(n - 2);
    return s(i - 1) * s(i) <= 0 ? 0 : (s(i - 1) + s(i)) / 2;
  });
  for (let i = 0; i < n - 1; i += 1) {
    if (s(i) === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = (m[i] ?? 0) / s(i);
    const b = (m[i + 1] ?? 0) / s(i);
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * s(i);
      m[i + 1] = t * b * s(i);
    }
  }
  return { xs, ys, m };
}

/** The curve's height at x (clamped to the first and last knot). */
export function monotoneAt(curve: Monotone, at: number): number {
  const { xs, ys, m } = curve;
  const last = xs.length - 1;
  if (last < 0) return 0;
  if (at <= (xs[0] ?? 0)) return ys[0] ?? 0;
  if (at >= (xs[last] ?? 0)) return ys[last] ?? 0;
  let i = 0;
  while (i < last - 1 && at > (xs[i + 1] ?? 0)) i += 1;
  const x0 = xs[i] ?? 0;
  const h = (xs[i + 1] ?? 0) - x0 || 1;
  const t = (at - x0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * (ys[i] ?? 0) +
    (t3 - 2 * t2 + t) * h * (m[i] ?? 0) +
    (-2 * t3 + 3 * t2) * (ys[i + 1] ?? 0) +
    (t3 - t2) * h * (m[i + 1] ?? 0)
  );
}

/** The monotone cubic as an SVG path (one cubic Bézier per knot interval). */
export function monotonePath(points: readonly (readonly [number, number])[]): string {
  const first = points[0];
  if (first === undefined) return '';
  const { xs, ys, m } = monotone(points);
  let d = `M${num(first[0])} ${num(first[1])}`;
  for (let i = 0; i < xs.length - 1; i += 1) {
    const x0 = xs[i] ?? 0;
    const x1 = xs[i + 1] ?? 0;
    const y0 = ys[i] ?? 0;
    const y1 = ys[i + 1] ?? 0;
    const h = (x1 - x0) / 3;
    d += `C${num(x0 + h)} ${num(y0 + (m[i] ?? 0) * h)} ${num(x1 - h)} ${num(y1 - (m[i + 1] ?? 0) * h)} ${num(x1)} ${num(y1)}`;
  }
  return d;
}

// ── field line: the supplier's fit score down the ranking ──────────────────

/** Field line geometry: rank r sits at the centre of the r-th of n equal columns, so HTML rows of n cells align with it. */
export interface FieldBox {
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly bottom: number;
  /** Rank from which the halftone band fades in, grid step, depth under the line, clearance from it, largest dot radius. */
  readonly halftoneFrom: number;
  readonly step: number;
  readonly depth: number;
  readonly clearance: number;
  readonly dot: number;
}

export const FIELD: FieldBox = {
  width: 1000,
  height: 280,
  top: 30,
  bottom: 34,
  halftoneFrom: 34,
  step: 7.5,
  depth: 96,
  clearance: 11,
  dot: 2.3,
};
export const FIELD_NARROW: FieldBox = {
  width: 400,
  height: 250,
  top: 26,
  bottom: 30,
  halftoneFrom: 34,
  step: 5.6,
  depth: 74,
  clearance: 9,
  dot: 1.8,
};

export interface FieldPoint {
  readonly rank: number;
  readonly fit: number;
  readonly x: number;
  readonly y: number;
}

export interface FieldLine {
  readonly points: readonly FieldPoint[];
  /** The line through every point. */
  readonly d: string;
  /** Halftone texture under the right part of the line: one path of dots whose size fades away from the line. */
  readonly halftone: string;
  /** y of the lowest fit (the axis) and of the highest. */
  readonly base: number;
  readonly peak: number;
  readonly min: number;
  readonly max: number;
  /** Height of one fit point. */
  readonly unit: number;
}

export function fieldX(rank: number, count: number, width: number = FIELD.width): number {
  return round(((rank - 0.5) / count) * width);
}

/**
 * The supplier's fit down the ranking. The line runs through one knot per run
 * of equal fit (at the run's centre), so it sweeps instead of stepping and
 * stays within one fit point of every source; each source's dot sits on the
 * line at its rank.
 */
export function fieldLine(entries: readonly FuturesEntry[], box: FieldBox = FIELD): FieldLine {
  const { min, max } = fitRange(entries);
  const n = entries.length;
  const span = box.height - box.top - box.bottom;
  const yOf = (fit: number): number => round(box.top + ((max - fit) / (max - min || 1)) * span);
  const knots: [number, number][] = [];
  for (let i = 0; i < n;) {
    const fit = entries[i]?.fit ?? min;
    let j = i;
    while (j + 1 < n && entries[j + 1]?.fit === fit) j += 1;
    knots.push([(fieldX(i + 1, n, box.width) + fieldX(j + 1, n, box.width)) / 2, yOf(fit)]);
    i = j + 1;
  }
  const lastEntry = entries.at(-1);
  const end = knots.at(-1);
  if (lastEntry !== undefined && end !== undefined && end[0] < fieldX(n, n, box.width))
    knots.push([fieldX(n, n, box.width), yOf(lastEntry.fit)]);
  const firstEntry = entries[0];
  const start = knots[0];
  if (firstEntry !== undefined && start !== undefined && start[0] > fieldX(1, n, box.width))
    knots.unshift([fieldX(1, n, box.width), yOf(firstEntry.fit)]);
  const curve = monotone(knots);
  const points = entries.map((entry) => {
    const x = fieldX(entry.rank, n, box.width);
    return { rank: entry.rank, fit: entry.fit, x, y: round(monotoneAt(curve, x)) };
  });
  const base = yOf(min);
  const x0 = fieldX(box.halftoneFrom, n, box.width);
  const fade = box.width - x0;
  let halftone = '';
  let row = 0;
  for (let y = box.top; y <= base + 0.01; y += box.step, row += 1) {
    for (let x = x0 + (row % 2 === 0 ? 0 : box.step / 2); x <= box.width; x += box.step) {
      const below = y - monotoneAt(curve, x) - box.clearance;
      if (below < 0 || below > box.depth) continue;
      const t = clamp((x - x0) / (fade * 0.55), 0, 1);
      const r = box.dot * (1 - below / box.depth) * t * t * (3 - 2 * t);
      if (r < 0.42) continue;
      halftone += `M${num(x - r)} ${num(y)}a${num(r)} ${num(r)} 0 1 0 ${num(2 * r)} 0a${num(r)} ${num(r)} 0 1 0 ${num(-2 * r)} 0`;
    }
  }
  return {
    points,
    d: monotonePath(knots),
    halftone,
    base,
    peak: yOf(max),
    min,
    max,
    unit: round(span / (max - min || 1)),
  };
}

// ── field map: one tile per source, area ∝ fit, clustered by geography ──────
//
// Clusters stack top to bottom in GEOS order. Inside a cluster the sources run
// in rank order through horizontal strips of near-equal area (an ordered strip
// treemap), so reading order is rank order. One scale holds across clusters: a
// tile's area is `scale × fit` everywhere. A cluster smaller than one full
// strip is drawn compact: a single strip at the nominal tile height.

export const MAP = { width: 400, pad: 6, tile: 33, head: 9, between: 24, icons: 3 } as const;

export interface MapTile {
  readonly rank: number;
  readonly geo: GeoKey;
  readonly kind: KindKey;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** Among the cluster's top MAP.icons: carries its kind pictogram. */
  readonly icon: boolean;
}

export interface MapCluster {
  readonly geo: GeoKey;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly compact: boolean;
}

export interface FieldMap {
  readonly tiles: readonly MapTile[];
  readonly clusters: readonly MapCluster[];
  readonly width: number;
  readonly height: number;
  /** Area per fit point, the same in every cluster. */
  readonly scale: number;
}

/** Splits items (in order) into n contiguous runs of near-equal total weight. */
export function partition<T>(items: readonly T[], weight: (item: T) => number, n: number): T[][] {
  const total = sum(items.map(weight));
  const runs: T[][] = [[]];
  let acc = 0;
  for (const item of items) {
    const w = weight(item);
    const current = runs.at(-1) ?? [];
    if (runs.length < n && current.length > 0 && acc + w / 2 > (total * runs.length) / n) runs.push([item]);
    else current.push(item);
    acc += w;
  }
  return runs;
}

export function fieldMap(entries: readonly FuturesEntry[]): FieldMap {
  const mean = sum(entries.map((entry) => entry.fit)) / Math.max(1, entries.length);
  const scale = (MAP.tile * MAP.tile) / mean;
  const inner = MAP.width - 2 * MAP.pad;
  const tiles: MapTile[] = [];
  const clusters: MapCluster[] = [];
  let top = MAP.head;
  for (const geo of presentGeos(entries)) {
    const items = entries.filter((entry) => entry.geo === geo.key).sort((a, b) => a.rank - b.rank);
    const area = scale * sum(items.map((entry) => entry.fit));
    const compact = area < inner * MAP.tile;
    const stripW = compact ? area / MAP.tile : inner;
    const strips = compact
      ? [items]
      : partition(items, (entry) => entry.fit, Math.max(1, Math.round(area / (inner * MAP.tile))));
    let y = top + MAP.pad;
    strips.forEach((strip) => {
      const h = (scale * sum(strip.map((entry) => entry.fit))) / stripW;
      let x = MAP.pad;
      for (const entry of strip) {
        const w = (scale * entry.fit) / h;
        tiles.push({
          rank: entry.rank,
          geo: geo.key,
          kind: entry.kind,
          x: round(x),
          y: round(y),
          w: round(w),
          h: round(h),
          icon: items.indexOf(entry) < MAP.icons,
        });
        x += w;
      }
      y += h;
    });
    const h = y + MAP.pad - top;
    clusters.push({ geo: geo.key, x: 0, y: round(top), w: round(stripW + 2 * MAP.pad), h: round(h), compact });
    top += h + MAP.between;
  }
  tiles.sort((a, b) => a.rank - b.rank);
  return { tiles, clusters, width: MAP.width, height: round(top - MAP.between + 2), scale };
}

// ── who ranks where: kind share down the ranking ─────────────────────────────

/** Width of the rolling window, in ranks. */
export const SHARE_WINDOW = 10;

/**
 * For each rank, the share of each kind (KINDS order) among the SHARE_WINDOW
 * sources around it (the window slides but never leaves the list, so it always
 * holds SHARE_WINDOW sources), then smoothed with two [1 2 1]/4 passes, which
 * keeps every rank's shares summing to 1.
 */
export function kindShare(entries: readonly FuturesEntry[], window: number = SHARE_WINDOW, passes = 2): number[][] {
  const n = entries.length;
  const w = Math.min(window, n);
  let rows = entries.map((_, i) => {
    const start = clamp(i - Math.floor((w - 1) / 2), 0, n - w);
    const slice = entries.slice(start, start + w);
    return KINDS.map((kind) => slice.filter((entry) => entry.kind === kind.key).length / w);
  });
  for (let pass = 0; pass < passes; pass += 1) {
    const prev = rows;
    rows = prev.map((row, i) => {
      const left = prev[Math.max(0, i - 1)] ?? row;
      const right = prev[Math.min(n - 1, i + 1)] ?? row;
      return row.map((value, k) => ((left[k] ?? 0) + 2 * value + (right[k] ?? 0)) / 4);
    });
  }
  return rows;
}

export interface ShareBox {
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  /** Label type size in user units. */
  readonly font: number;
}

export const SHARE_WIDE: ShareBox = { width: 1000, height: 330, left: 48, right: 2, top: 8, bottom: 36, font: 14 };
export const SHARE_NARROW: ShareBox = { width: 400, height: 400, left: 34, right: 2, top: 8, bottom: 30, font: 12 };

export interface ShareLabel {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface ShareBand {
  readonly kind: KindKey;
  /** Position in KINDS; fills cycle ink · hatched ink · oxblood · hatched oxblood. */
  readonly index: number;
  readonly d: string;
  /** Box centred on the band's widest run, or null where the band never holds a box. */
  readonly label: ShareLabel | null;
}

/** Approximate advance of a Garamond label (a box is sized from it; the text is centred, so an error only changes padding). */
export const labelWidth = (text: string, font: number): number => round(text.length * font * 0.5 + font * 1.1);

/** Stacked 100% bands, KINDS[0] on top, each labelled at its widest free run. */
export function shareBands(entries: readonly FuturesEntry[], box: ShareBox): ShareBand[] {
  const shares = kindShare(entries);
  const n = shares.length;
  const plotW = box.width - box.left - box.right;
  const plotH = box.height - box.top - box.bottom;
  const xOf = (i: number): number => box.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW);
  const edges = shares.map((row) => {
    const out = [box.top];
    let acc = 0;
    for (const value of row) {
      acc += value;
      out.push(box.top + acc * plotH);
    }
    return out;
  });
  const edge = (i: number, k: number): number => edges[i]?.[k] ?? box.top;
  const placed: ShareLabel[] = [];
  const bands = KINDS.map((kind, k) => {
    const upper = Array.from({ length: n }, (_, i) => `${num(xOf(i))} ${num(edge(i, k))}`);
    const lower = Array.from({ length: n }, (_, i) => `${num(xOf(n - 1 - i))} ${num(edge(n - 1 - i, k + 1))}`);
    return {
      kind: kind.key,
      index: k,
      d: `M${upper.join('L')}L${lower.join('L')}Z`,
      label: null as ShareLabel | null,
      thick: Math.max(...Array.from({ length: n }, (_, i) => edge(i, k + 1) - edge(i, k))),
    };
  });
  const h = round(box.font * 1.65);
  // Widest point first: a box that fits inside the band over its whole width
  // wins; otherwise the box centres on the band's thickest point and may
  // overhang it. Boxes never overlap one another or leave the plot.
  for (const band of [...bands].sort((a, b) => b.thick - a.thick)) {
    const w = labelWidth(KIND_ROW[band.kind], box.font);
    let best: { score: number; label: ShareLabel } | null = null;
    for (let c = 0; c < n; c += 1) {
      const cx = clamp(xOf(c), box.left + w / 2 + 3, box.width - box.right - w / 2 - 3);
      const from = Math.max(0, Math.floor(((cx - w / 2 - box.left) / plotW) * (n - 1)));
      const to = Math.min(n - 1, Math.ceil(((cx + w / 2 - box.left) / plotW) * (n - 1)));
      let hi = -Infinity;
      let lo = Infinity;
      for (let i = from; i <= to; i += 1) {
        hi = Math.max(hi, edge(i, band.index));
        lo = Math.min(lo, edge(i, band.index + 1));
      }
      const room = lo - hi;
      const mid = Math.round(((cx - box.left) / plotW) * (n - 1));
      const centre = (edge(mid, band.index) + edge(mid, band.index + 1)) / 2;
      const thick = edge(mid, band.index + 1) - edge(mid, band.index);
      if (thick < 4) continue;
      const fits = room >= h + 4;
      const y = clamp(fits ? (hi + lo) / 2 - h / 2 : centre - h / 2, box.top + 2, box.height - box.bottom - h - 2);
      const label = { x: round(cx - w / 2), y: round(y), w, h };
      if (
        placed.some(
          (other) =>
            label.x < other.x + other.w + 6 &&
            other.x < label.x + label.w + 6 &&
            label.y < other.y + other.h + 4 &&
            other.y < label.y + label.h + 4,
        )
      )
        continue;
      const score = fits ? 1000 + room : thick;
      if (best === null || score > best.score) best = { score, label };
    }
    if (best !== null) {
      band.label = best.label;
      placed.push(best.label);
    }
  }
  return bands.map(({ kind, index, d, label }) => ({ kind, index, d, label }));
}

// ── fit by geography: a unit histogram ───────────────────────────────────────

export interface HistBox {
  readonly width: number;
  readonly top: number;
  readonly bottom: number;
  /** Unit size and vertical pitch in user units. */
  readonly unit: number;
  readonly pitch: number;
  /** Gap between fit bands, in columns. */
  readonly gap: number;
}

export const HIST_WIDE: HistBox = { width: 1000, top: 36, bottom: 30, unit: 17, pitch: 20, gap: 1.1 };
export const HIST_NARROW: HistBox = { width: 400, top: 30, bottom: 26, unit: 7.4, pitch: 9, gap: 0.9 };

export interface HistUnit {
  readonly rank: number;
  readonly geo: GeoKey;
  readonly kind: KindKey;
  /** Centre. */
  readonly x: number;
  readonly y: number;
}

export interface HistBand {
  readonly min: number;
  readonly max: number;
  /** Rank span of the band's sources. */
  readonly first: number;
  readonly last: number;
  /** Centre x and the top of its tallest column. */
  readonly x: number;
  readonly top: number;
}

export interface Histogram {
  readonly units: readonly HistUnit[];
  readonly columns: readonly { readonly fit: number; readonly x: number }[];
  readonly bands: readonly HistBand[];
  readonly base: number;
  readonly height: number;
  readonly column: number;
}

/** Five-point fit bands over the range; a band that would hold only the maximum joins the one below it. */
export function fitBands(min: number, max: number): { min: number; max: number }[] {
  const bands: { min: number; max: number }[] = [];
  for (let b = Math.floor(min / 5) * 5; b <= max; b += 5)
    bands.push({ min: Math.max(b, min), max: Math.min(b + 4, max) });
  const last = bands.at(-1);
  const prev = bands.at(-2);
  if (last !== undefined && prev !== undefined && last.min === last.max) {
    bands.pop();
    prev.max = last.max;
  }
  return bands;
}

/** One unit per source, stacked in its fit column (US, then China, then UK, each by rank), columns grouped into fit bands. */
export function unitHistogram(entries: readonly FuturesEntry[], box: HistBox): Histogram {
  const { min, max } = fitRange(entries);
  const bands = fitBands(min, max);
  const slots = max - min + 1 + (bands.length - 1) * box.gap;
  const column = box.width / slots;
  const tallest = Math.max(
    ...Array.from({ length: max - min + 1 }, (_, i) => entries.filter((entry) => entry.fit === min + i).length),
  );
  const base = box.top + tallest * box.pitch;
  const geoOrder = new Map(GEOS.map((geo, i) => [geo.key, i]));
  const columns: { fit: number; x: number }[] = [];
  const units: HistUnit[] = [];
  const out: HistBand[] = [];
  let slot = 0;
  bands.forEach((band, b) => {
    if (b > 0) slot += box.gap;
    const xs: number[] = [];
    let high = 0;
    for (let fit = band.min; fit <= band.max; fit += 1) {
      const x = round((slot + 0.5) * column);
      columns.push({ fit, x });
      xs.push(x);
      const stack = entries
        .filter((entry) => entry.fit === fit)
        .sort((p, q) => (geoOrder.get(p.geo) ?? 0) - (geoOrder.get(q.geo) ?? 0) || p.rank - q.rank);
      stack.forEach((entry, i) =>
        units.push({ rank: entry.rank, geo: entry.geo, kind: entry.kind, x, y: round(base - (i + 0.5) * box.pitch) }),
      );
      high = Math.max(high, stack.length);
      slot += 1;
    }
    const ranks = entries.filter((entry) => entry.fit >= band.min && entry.fit <= band.max).map((entry) => entry.rank);
    out.push({
      min: band.min,
      max: band.max,
      first: Math.min(...ranks),
      last: Math.max(...ranks),
      x: round((Math.min(...xs) + Math.max(...xs)) / 2),
      top: round(base - high * box.pitch),
    });
  });
  units.sort((a, b) => a.rank - b.rank);
  return { units, columns, bands: out, base: round(base), height: round(base + box.bottom), column: round(column) };
}
