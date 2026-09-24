/**
 * Geometry for the Timeline page's lineage minimap: time runs top to bottom
 * (the same direction the chronicle scrolls), one column per relation.
 * Early decades are compressed so the dense recent years get the height.
 *
 * Dots never overlap: each entry starts at its year's band in its relation's
 * column and takes the first free slot, filling outward from the column's
 * centre, then down a row — so a year's cluster reads as a count.
 * Pure and deterministic.
 */
import { relationKey, type RelationKey } from './lineage-strip.ts';

export interface MinimapEntry {
  readonly id: number;
  readonly year: number;
  readonly relation: string;
  readonly chapter: number;
}

export interface MinimapMark extends MinimapEntry {
  readonly x: number;
  readonly y: number;
  readonly relationKey: RelationKey;
}

export interface MinimapLane {
  readonly key: RelationKey;
  readonly lines: readonly [string, string];
  readonly x0: number;
  readonly cx: number;
  readonly x1: number;
}

export interface MinimapYear {
  readonly year: number;
  /** Band this year owns (hit area and viewport-band anchor). */
  readonly y0: number;
  readonly y1: number;
  readonly count: number;
}

export interface MinimapGeometry {
  readonly width: number;
  readonly height: number;
  readonly axisX: number;
  readonly top: number;
  readonly bottom: number;
  readonly breakY: number | null;
  readonly lanes: readonly MinimapLane[];
  readonly marks: readonly MinimapMark[];
  readonly years: readonly MinimapYear[];
  readonly ticks: readonly { readonly year: number; readonly y: number }[];
}

const LANES: readonly (readonly [RelationKey, string, string])[] = [
  ['anc', 'conceptual', 'ancestor'],
  ['opt', 'engineering', 'optimization'],
  ['alt', 'alternative', 'branch'],
  ['sup', 'superseded', 'approach'],
  ['fro', 'current', 'frontier'],
];

const PITCH = 7.4;
const TICK_GAP = 13;

export function lineageMinimap(entries: readonly MinimapEntry[], width = 400, height = 700): MinimapGeometry {
  const axisX = 40;
  const laneW = (width - axisX - 6) / LANES.length;
  const lanes: MinimapLane[] = LANES.map(([key, a, b], index) => {
    const x0 = axisX + 6 + index * laneW;
    return { key, lines: [a, b], x0, cx: x0 + laneW / 2, x1: x0 + laneW };
  });
  const top = 40;
  const bottom = height - 8;
  const years = entries.map((entry) => entry.year);
  const yMin = Math.min(...years);
  const yMax = Math.max(...years);
  const split = Math.max(yMin, Math.min(2015, yMax - 8));
  const early = split > yMin ? (bottom - top) * 0.2 : 0;
  // Bands run from a year to the next, so the last year has a full band too.
  const yOf = (year: number): number => {
    if (year <= split) return split === yMin ? top : top + ((year - yMin) / (split - yMin)) * early;
    return top + early + ((year - split) / Math.max(1, yMax + 1 - split)) * (bottom - top - early);
  };

  const placed: MinimapMark[] = [];
  for (const lane of lanes) {
    const own = entries.filter((entry) => relationKey(entry.relation) === lane.key).sort((a, b) => a.year - b.year || a.id - b.id);
    const taken: { x: number; y: number }[] = [];
    const slots = Math.max(1, Math.floor((laneW - 8) / PITCH));
    const order = Array.from({ length: slots }, (_, k) => (k % 2 === 0 ? k / 2 : -(k + 1) / 2)); // 0, -1, +1, -2, +2 …
    const shift = slots % 2 === 0 ? PITCH / 2 : 0;
    for (const entry of own) {
      const start = yOf(entry.year) + 4.5;
      let spot: { x: number; y: number } | null = null;
      for (let row = 0; spot === null && row < 40; row += 1) {
        const y = start + row * PITCH;
        for (const slot of order) {
          const x = lane.cx + slot * PITCH + shift;
          if (x < lane.x0 + 3 || x > lane.x1 - 3) continue;
          if (taken.every((other) => Math.hypot(other.x - x, other.y - y) >= PITCH - 0.05)) {
            spot = { x, y };
            break;
          }
        }
      }
      const final = spot ?? { x: lane.cx, y: start };
      taken.push(final);
      placed.push({ ...entry, x: round(final.x), y: round(final.y), relationKey: lane.key });
    }
  }

  const populated = [...new Set(years)].sort((a, b) => a - b);
  const bandYears: MinimapYear[] = populated.map((year, index) => {
    const previous = populated[index - 1];
    const next = populated[index + 1];
    const recent = year > split || (year === split && split > yMin);
    const y0 = recent || previous === undefined ? yOf(year) : (yOf(previous) + yOf(year)) / 2;
    const own = placed.filter((mark) => mark.year === year);
    const lowest = own.length === 0 ? yOf(year) : Math.max(...own.map((mark) => mark.y)) + 4;
    const y1 = Math.max(lowest, recent ? yOf(year + 1) : next === undefined ? yOf(year) + 6 : (yOf(year) + yOf(next)) / 2);
    return { year, y0: round(y0), y1: round(y1), count: own.length };
  });

  const candidates = [...new Set([yMin, ...populated.filter((year) => year % 10 === 0 || year >= split), yMax])].sort((a, b) => a - b);
  const ticks: { year: number; y: number }[] = [];
  for (const year of candidates) {
    const y = yOf(year) + 7.5;
    const previous = ticks.at(-1);
    if (previous === undefined || y - previous.y >= TICK_GAP) ticks.push({ year, y: round(y) });
  }

  const lowestMark = Math.max(bottom, ...placed.map((mark) => mark.y + 6));
  return {
    width,
    height: Math.ceil(lowestMark + 4),
    axisX,
    top,
    bottom: lowestMark,
    breakY: early > 0 ? round(top + early) : null,
    lanes,
    marks: placed,
    years: bandYears,
    ticks,
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
