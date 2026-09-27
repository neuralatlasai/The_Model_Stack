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
  { key: 'measurement', label: 'Capability & trajectory measurement', short: 'Measurement', plural: 'measurement sources' },
  { key: 'alignment', label: 'Alignment & control research', short: 'Alignment', plural: 'alignment and control groups' },
  { key: 'framework', label: 'Frontier safety frameworks & evaluators', short: 'Safety frameworks', plural: 'safety frameworks and evaluators' },
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
    title: 'The listed address redirects, fails, duplicates another entry, or is superseded by a canonical address; the working address comes from the organisation’s own site',
  },
  { key: 'unverified', label: 'UNVERIFIED', title: 'Could not be loaded or confirmed; the supplier’s reason is shown instead of a description' },
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
  meta: z.object({ title: z.string(), asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u), provenance: z.string(), source: z.string() }),
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
    if (previous !== undefined && entry.fit > previous.fit) throw new Error(`${at} has a higher fit score than #${String(previous.rank)}`);
    const { status } = entry.verification;
    if (status === 'unverified' && entry.description !== null) throw new Error(`${at} is UNVERIFIED but carries a description`);
    if (status !== 'unverified' && entry.description === null) throw new Error(`${at} was reached but has no description`);
    if (status === 'redirected' && entry.links.url === entry.links.listed) throw new Error(`${at} is marked corrected but keeps the listed address`);
    if (status === 'redirected' && entry.verification.note.trim() === '') throw new Error(`${at} is marked corrected without evidence`);
    if (entry.links.url.startsWith('http:') && !/certificate/iu.test(entry.verification.note)) throw new Error(`${at} links plain http without a certificate note`);
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
export function findMentions(entries: readonly FuturesEntry[], docs: readonly ResearchDocument[], graph: AtlasGraph): Map<number, Mention[]> {
  const order = new Map(graph.order.map((id, index) => [id, index]));
  const texts = docs
    .filter((doc) => doc.meta.chapter !== null && (doc.meta.entityType === 'section' || doc.meta.entityType === 'chapter'))
    .map((doc) => ({ doc, text: documentText(doc) }));
  const out = new Map<number, Mention[]>();
  for (const entry of entries) {
    const matcher = aliasMatcher(entry.aliases);
    const found = texts
      .filter(({ text }) => matches(matcher, text))
      .map(({ doc }) => ({ id: doc.meta.id, url: doc.route.url, number: doc.meta.section, title: doc.meta.shortTitle, chapter: doc.meta.chapter ?? 0 }))
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

// ── horizon scope ────────────────────────────────────────────────────────────
//
// A half-disc seen from the observer at the base centre: eight sectors (one per
// kind, left to right in KINDS order) and six concentric bands of the
// supplier's fit score, the highest band on the outer horizon ring. Each source
// is one glyph, packed deterministically by rank inside its sector × band cell.

/** Fit bands, outer (horizon) → inner (observer). */
export const BANDS = [
  { min: 90, max: 100 },
  { min: 85, max: 89 },
  { min: 80, max: 84 },
  { min: 75, max: 79 },
  { min: 70, max: 74 },
  { min: 65, max: 69 },
] as const;

/** Scope geometry in SVG user units; the sweep takes SWEEP_S seconds per pass. */
export const SCOPE = { width: 1000, height: 506, cx: 500, cy: 470, r0: 120, R: 440, spacing: 20 } as const;
/** Radial depth of each band, outer → inner (sums to R − r0): the crowded inner bands get more room so every cell packs at one spacing. */
export const BAND_DEPTH = [50, 46, 46, 50, 60, 68] as const;
export const SWEEP_S = 8;

/** One path per kind, drawn in a ±8 box around the origin. */
/** One path per kind, every glyph about 13 units across (a ±7 box around the origin). */
export const GLYPHS: Readonly<Record<KindKey, string>> = {
  scenario: 'M0-7 7 0 0 7-7 0Z',
  measurement: 'M0-6.5 7 5.6H-7Z',
  alignment: 'M-6 0a6 6 0 1 0 12 0a6 6 0 1 0-12 0Z',
  framework: 'M-5.3-5.3h10.6v10.6h-10.6Z',
  governance: 'M0-7 1.8-1.8 7 0 1.8 1.8 0 7-1.8 1.8-7 0-1.8-1.8Z',
  lab: 'M0-6.4 5.5-3.2v6.4L0 6.4l-5.5-3.2v-6.4Z',
  institute: 'M0-6.4 6.2-1.6V5.6H-6.2V-1.6Z',
  compute: 'M1-1V-5.9A6 6 0 0 1 5.9-1ZM1 1H5.9A6 6 0 0 1 1 5.9ZM-1 1V5.9A6 6 0 0 1-5.9 1ZM-1-1H-5.9A6 6 0 0 1-1-5.9Z',
};

export interface ScopeGlyph {
  readonly rank: number;
  readonly kind: KindKey;
  readonly band: number;
  readonly x: number;
  readonly y: number;
  /** Degrees, 180 = left horizon, 0 = right horizon. */
  readonly angle: number;
  /** Seconds into a sweep pass at which the sweep line crosses the glyph. */
  readonly delay: number;
}

export interface ScopeLayout {
  readonly glyphs: readonly ScopeGlyph[];
  /** Sector edges in degrees, 180 → 0. */
  readonly edges: readonly number[];
  /** Band boundaries: radius and the fit value at that boundary, inner → outer. */
  readonly rings: readonly { readonly r: number; readonly fit: number }[];
  readonly sectors: readonly { readonly kind: KindKey; readonly mid: number }[];
}

const rad = (deg: number): number => (deg * Math.PI) / 180;
const round = (n: number): number => Math.round(n * 10) / 10;

export function bandOf(fit: number): number {
  const index = BANDS.findIndex((band) => fit >= band.min && fit <= band.max);
  if (index < 0) throw new Error(`ai futures: fit ${String(fit)} is outside every band`);
  return index;
}

/** Slots for k glyphs in the annular sector [ri, ro] × [a0, a1]: outer row first, left to right; null if they do not fit. */
function pack(k: number, ri: number, ro: number, a0: number, a1: number, sp: number): { r: number; a: number }[] | null {
  const rows = Math.max(1, Math.floor((ro - ri) / sp));
  const step = rows === 1 ? 0 : (ro - ri - sp) / (rows - 1);
  const lines = Array.from({ length: rows }, (_, row) => {
    const r = rows === 1 ? (ri + ro) / 2 : ro - sp / 2 - row * step;
    const pad = ((sp * 0.5) / r) * (180 / Math.PI);
    const from = a1 - pad;
    const to = a0 + pad;
    const capacity = to > from ? 0 : Math.floor((rad(from - to) * r) / sp) + 1;
    return { r, from, to, capacity };
  });
  if (lines.reduce((sum, line) => sum + line.capacity, 0) < k) return null;
  const out: { r: number; a: number }[] = [];
  let remaining = k;
  for (const line of lines) {
    const n = Math.min(line.capacity, remaining);
    remaining -= n;
    if (n === 0) continue;
    const mid = (line.from + line.to) / 2;
    const gap = n === 1 ? 0 : Math.min((line.from - line.to) / (n - 1), ((sp * 1.35) / line.r) * (180 / Math.PI));
    for (let i = 0; i < n; i += 1) out.push({ r: line.r, a: mid + (gap * (n - 1)) / 2 - i * gap });
  }
  return out;
}

/** Deterministic placement of every entry: sector = kind, band = supplier fit, order = rank. */
export function scopeLayout(entries: readonly FuturesEntry[]): ScopeLayout {
  const { cx, cy, r0, R, spacing } = SCOPE;
  const sector = 180 / KINDS.length;
  const outer = BAND_DEPTH.map((_, b) => R - BAND_DEPTH.slice(0, b).reduce((sum, depth) => sum + depth, 0));
  const glyphs: ScopeGlyph[] = [];
  KINDS.forEach((kind, k) => {
    const a1 = 180 - k * sector;
    const a0 = a1 - sector;
    BANDS.forEach((_, b) => {
      const cell = entries.filter((entry) => entry.kind === kind.key && bandOf(entry.fit) === b).sort((p, q) => p.rank - q.rank);
      if (cell.length === 0) return;
      const ro = outer[b] ?? R;
      const ri = ro - (BAND_DEPTH[b] ?? 0);
      const slots = pack(cell.length, ri, ro, a0, a1, spacing);
      if (slots === null) throw new Error(`ai futures: ${kind.key} × band ${String(b)} does not fit`);
      cell.forEach((entry, i) => {
        const slot = slots[i] ?? { r: ri, a: a0 };
        glyphs.push({
          rank: entry.rank,
          kind: kind.key,
          band: b,
          x: round(cx + slot.r * Math.cos(rad(slot.a))),
          y: round(cy - slot.r * Math.sin(rad(slot.a))),
          angle: round(slot.a),
          delay: Math.round(((180 - slot.a) / 180) * SWEEP_S * 100) / 100,
        });
      });
    });
  });
  glyphs.sort((p, q) => p.rank - q.rank);
  const fits = [65, 70, 75, 80, 85, 90, 100];
  return {
    glyphs,
    edges: Array.from({ length: KINDS.length + 1 }, (_, i) => 180 - i * sector),
    rings: fits.map((fit, i) => ({ r: i === 0 ? r0 : (outer[BANDS.length - i] ?? R), fit })),
    sectors: KINDS.map((kind, i) => ({ kind: kind.key, mid: 180 - (i + 0.5) * sector })),
  };
}
