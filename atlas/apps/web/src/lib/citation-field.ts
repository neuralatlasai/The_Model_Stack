/**
 * Geometry for the Papers page's citation field: every cited work as a dot,
 * years across (early decades compressed, undated works in their own column),
 * one lane per reference type. Dot area grows with the number of chapters that
 * draw on the work, so the book's load-bearing sources stand out.
 *
 * Placement packs dots without overlap: larger dots are placed first, each at
 * the free spot nearest its ideal point (its year, its lane's centre line),
 * searching sideways within its year before moving off the centre line; each
 * lane's height is whatever its densest year needs. Pure and deterministic.
 */

export interface FieldWork {
  readonly key: string;
  readonly type: string;
  readonly year: number | null;
  readonly weight: number; // chapters drawing on the work
}

export interface FieldMark extends FieldWork {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

export interface FieldLane {
  readonly type: string;
  readonly count: number;
  readonly y0: number;
  readonly cy: number;
  readonly y1: number;
}

export interface FieldGeometry {
  readonly width: number;
  readonly height: number;
  readonly x0: number;
  readonly x1: number;
  readonly undatedX: number | null;
  readonly breakX: number | null;
  readonly axisY: number;
  readonly lanes: readonly FieldLane[];
  readonly marks: readonly FieldMark[];
  readonly ticks: readonly { readonly x: number; readonly label: string }[];
}

export function radiusFor(weight: number): number {
  if (weight >= 5) return 6.4;
  if (weight >= 3) return 5.3;
  if (weight === 2) return 4.3;
  if (weight === 1) return 3.4;
  return 2.7;
}

const GAP = 1.3;
const STEP = 3.5;

export function citationField(works: readonly FieldWork[], typeOrder: readonly string[], width = 780): FieldGeometry {
  const labelW = 132;
  const x0 = labelW;
  const hasUndated = works.some((work) => work.year === null);
  const undatedW = hasUndated ? 74 : 0;
  const x1 = width - 10 - (hasUndated ? undatedW + 16 : 0);
  const dated = works.flatMap((work) => (work.year === null ? [] : [work.year]));
  const yMin = Math.min(...dated);
  const yMax = Math.max(...dated);
  const split = Math.max(yMin, Math.min(2012, yMax - 10));
  const early = split > yMin ? (x1 - x0) * 0.16 : 0;
  const xOf = (year: number): number => {
    if (year <= split) return split === yMin ? x0 : x0 + ((year - yMin) / (split - yMin)) * early;
    return x0 + early + ((year - split) / Math.max(1, yMax - split)) * (x1 - x0 - early);
  };
  const halfYear = (year: number | null): number => {
    if (year === null) return undatedW / 2 - 4;
    if (year <= split) return 5;
    return Math.max(6, (xOf(year + 1) - xOf(year)) / 2 - 1.5);
  };
  const undatedX = hasUndated ? x1 + 16 + undatedW / 2 : null;

  const types = typeOrder.filter((type) => works.some((work) => work.type === type));
  // Place per lane in lane-local coordinates (centre line at 0), then stack lanes.
  const local = new Map<string, { work: FieldWork; dx: number; dy: number; r: number }[]>();
  for (const type of types) {
    const own = works
      .filter((work) => work.type === type)
      .sort((a, b) => b.weight - a.weight || (a.year ?? 9999) - (b.year ?? 9999) || a.key.localeCompare(b.key));
    const placed: { work: FieldWork; dx: number; dy: number; r: number }[] = [];
    for (const work of own) {
      const r = radiusFor(work.weight);
      const cx = work.year === null ? (undatedX ?? x1) : xOf(work.year);
      const span = halfYear(work.year) - r;
      let best: { dx: number; dy: number } | null = null;
      for (let ring = 0; best === null && ring < 60; ring += 1) {
        // Candidates at this cost ring: sideways within the year first, then off the centre line.
        const candidates: { dx: number; dy: number; cost: number }[] = [];
        for (let i = -ring; i <= ring; i += 1) {
          for (const j of [ring - Math.abs(i), -(ring - Math.abs(i))]) {
            const dx = cx + i * STEP;
            if (Math.abs(i * STEP) > Math.max(0, span)) continue;
            // Dated dots stay left of the undated column; nothing leaves the drawing.
            if (work.year !== null && dx + r > x1 + 8) continue;
            if (dx - r < x0 - 8 || dx + r > width - 2) continue;
            candidates.push({ dx, dy: j * STEP, cost: Math.abs(j) * 1.25 + Math.abs(i) });
          }
        }
        candidates.sort((a, b) => a.cost - b.cost || Math.abs(a.dy) - Math.abs(b.dy));
        for (const candidate of candidates) {
          if (placed.every((other) => Math.hypot(other.dx - candidate.dx, other.dy - candidate.dy) >= other.r + r + GAP)) {
            best = candidate;
            break;
          }
        }
      }
      placed.push({ work, dx: best?.dx ?? cx, dy: best?.dy ?? 0, r });
    }
    local.set(type, placed);
  }

  const lanes: FieldLane[] = [];
  const marks: FieldMark[] = [];
  let y = 8;
  for (const type of types) {
    const placed = local.get(type) ?? [];
    const up = Math.max(8, ...placed.map((item) => -item.dy + item.r));
    const down = Math.max(8, ...placed.map((item) => item.dy + item.r));
    const y0 = y;
    const cy = y0 + up + 5;
    const y1 = cy + down + 5;
    lanes.push({ type, count: placed.length, y0, cy, y1 });
    for (const item of placed) marks.push({ ...item.work, x: round(item.dx), y: round(cy + item.dy), r: item.r });
    y = y1;
  }
  const axisY = y + 4;

  const candidates = [...new Set([yMin, ...dated.filter((year) => year % 10 === 0 || (year > split && year % 2 === 0)), yMax])].sort((a, b) => a - b);
  const ticks: { x: number; label: string }[] = [];
  for (const year of candidates) {
    const x = xOf(year);
    const previous = ticks.at(-1);
    if (previous === undefined || x - previous.x >= 34) ticks.push({ x: round(x), label: String(year) });
    else if (year === yMax) ticks[ticks.length - 1] = { x: round(x), label: String(year) };
  }
  if (undatedX !== null) ticks.push({ x: round(undatedX), label: 'undated' });

  return {
    width,
    height: Math.ceil(axisY + 20),
    x0,
    x1,
    undatedX,
    breakX: early > 0 ? round(x0 + early) : null,
    axisY: round(axisY),
    lanes,
    marks,
    ticks,
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
