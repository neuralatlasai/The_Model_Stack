/**
 * Geometry for the home page's lineage strip (StackExplorer.astro): every
 * dated lineage entry as a dot stacked on its year, on an axis whose early
 * decades are compressed (the book's lineage is dense after 2015, sparse
 * before). Pure and deterministic: same entries → same picture.
 *
 * Placement is a dot plot without overlaps: each entry starts at its year's
 * tick, entries of the same year spread into columns centred on the tick, and
 * each dot takes the lowest row with no dot closer than one pitch — so every
 * dot sits on (or stacks up from) its own year and none hides another.
 */

export interface StripEntry {
  readonly id: number;
  readonly year: number;
  readonly work: string;
  readonly relation: string;
  readonly chapter: number;
}

export interface StripMark extends StripEntry {
  readonly x: number;
  readonly y: number;
  readonly relationKey: RelationKey;
}

export interface StripYear {
  readonly year: number;
  readonly x: number;
  /** Hit column: from halfway to the previous populated year to halfway to the next. */
  readonly x0: number;
  readonly x1: number;
  readonly count: number;
  readonly byRelation: Readonly<Partial<Record<RelationKey, number>>>;
}

export interface StripGeometry {
  readonly width: number;
  readonly height: number;
  readonly axisY: number;
  readonly x0: number;
  readonly x1: number;
  /** x of the compression break (null when the range needs none). */
  readonly breakX: number | null;
  readonly marks: readonly StripMark[];
  readonly years: readonly StripYear[];
  readonly ticks: readonly { readonly year: number; readonly x: number; readonly label: string }[];
}

export const RELATION_KEYS = {
  'conceptual ancestor': 'anc',
  'engineering optimization': 'opt',
  'alternative branch': 'alt',
  'superseded approach': 'sup',
  'current frontier': 'fro',
} as const;
export type RelationKey = (typeof RELATION_KEYS)[keyof typeof RELATION_KEYS];

export function relationKey(relation: string): RelationKey {
  return (RELATION_KEYS as Readonly<Record<string, RelationKey>>)[relation] ?? 'anc';
}

const PITCH = 7.6; // centre-to-centre distance between dots (r = 3.2)
const ROW = 7.6;
const TICK_GAP = 36; // minimum distance between year labels

export function lineageStrip(entries: readonly StripEntry[], width = 1000): StripGeometry {
  const x0 = 34;
  const x1 = width - 22;
  const years = entries.map((entry) => entry.year);
  const yMin = Math.min(...years);
  const yMax = Math.max(...years);
  // Recent decade gets most of the width; everything earlier is compressed into 24 %.
  const split = Math.max(yMin, Math.min(2015, yMax - 8));
  const early = split > yMin ? (x1 - x0) * 0.24 : 0;
  const xOf = (year: number): number => {
    if (year <= split) return split === yMin ? x0 : x0 + ((year - yMin) / (split - yMin)) * early;
    return x0 + early + ((year - split) / Math.max(1, yMax - split)) * (x1 - x0 - early);
  };
  const yearWidth = (year: number): number => (year < split ? PITCH : xOf(year + 1) - xOf(year));

  // Same-year entries spread into columns centred on the tick, capped by the year's width.
  const byYear = new Map<number, StripEntry[]>();
  for (const entry of [...entries].sort((a, b) => a.year - b.year || a.id - b.id)) {
    byYear.set(entry.year, [...(byYear.get(entry.year) ?? []), entry]);
  }
  const rows: number[][] = []; // rows[r] = x positions already placed in row r
  const placed: { entry: StripEntry; x: number; row: number }[] = [];
  for (const [year, list] of byYear) {
    const cols = Math.max(1, Math.min(list.length, Math.floor((yearWidth(year) - 6) / PITCH), 7));
    // Clusters at either end of the axis shift inward so no dot leaves the drawing.
    const half = ((cols - 1) / 2) * PITCH;
    const shift = Math.min(0, width - 6 - (xOf(year) + half)) + Math.max(0, 6 - (xOf(year) - half));
    list.forEach((entry, k) => {
      const col = k % cols;
      const x = xOf(year) + shift + (col - (cols - 1) / 2) * PITCH;
      let row = 0;
      while ((rows[row] ?? []).some((other) => Math.abs(other - x) < PITCH - 0.01)) row += 1;
      (rows[row] ??= []).push(x);
      placed.push({ entry, x, row });
    });
  }
  const maxRow = Math.max(0, ...placed.map((item) => item.row));
  const top = 6;
  const axisY = top + (maxRow + 1) * ROW + 2;
  const height = axisY + 22;
  const marks: StripMark[] = placed.map(({ entry, x, row }) => ({
    ...entry,
    x: Math.round(x * 10) / 10,
    y: Math.round((axisY - 4.4 - row * ROW) * 10) / 10,
    relationKey: relationKey(entry.relation),
  }));

  const populated = [...byYear.keys()].sort((a, b) => a - b);
  const stripYears: StripYear[] = populated.map((year, index) => {
    const x = xOf(year);
    const previous = populated[index - 1];
    const next = populated[index + 1];
    const byRelation: Partial<Record<RelationKey, number>> = {};
    for (const entry of byYear.get(year) ?? []) {
      const key = relationKey(entry.relation);
      byRelation[key] = (byRelation[key] ?? 0) + 1;
    }
    return {
      year,
      x,
      x0: previous === undefined ? x0 - 12 : (xOf(previous) + x) / 2,
      x1: next === undefined ? x1 + 12 : (x + xOf(next)) / 2,
      count: byYear.get(year)?.length ?? 0,
      byRelation,
    };
  });

  // Labels: the first year, round years in the compressed span, every year after the split; thinned.
  const candidates = [...new Set([yMin, ...populated.filter((year) => year % 10 === 0 || year >= split), yMax])].sort((a, b) => a - b);
  const ticks: { year: number; x: number; label: string }[] = [];
  for (const year of candidates) {
    const previous = ticks.at(-1);
    const tick = { year, x: xOf(year), label: String(year) };
    if (previous === undefined || tick.x - previous.x >= TICK_GAP) ticks.push(tick);
    else if (year === yMax) ticks[ticks.length - 1] = tick;
  }

  return { width, height, axisY, x0, x1, breakX: early > 0 ? x0 + early : null, marks, years: stripYears, ticks };
}
