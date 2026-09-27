/**
 * Geometry for the Labs constellation (pages/labs/index.astro): every lab a
 * written chapter draws on, as a disc on the book's chapter axis.
 *
 *   x      the footprint-weighted mean position of the chapters that draw on
 *          the lab (weight = sections of that chapter naming it, at least 1),
 *          on an axis of the parts that hold a written chapter; the parts
 *          after them (planned only) share one compressed, hatched zone
 *   r      grows with the lab's footprint (sections), area-true
 *   y      a clean packing: each disc keeps its x exactly and moves off the
 *          centre line only as far as it must to clear the discs already
 *          placed (largest first)
 *   links  every pair of labs sharing a chapter, weighted by chapters shared
 *
 * Pure and deterministic; the page draws it and the client lights it.
 */

export interface ConstellationChapter {
  readonly n: number;
  readonly written: boolean;
}

export interface ConstellationPart {
  readonly n: number;
  readonly numeral: string;
  readonly chapters: readonly number[];
}

export interface ConstellationLab {
  readonly key: string;
  readonly chapters: readonly number[];
  readonly sectionsByChapter: Readonly<Record<string, number>>;
  readonly sections: number;
}

export interface ConstellationMark {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Footprint-weighted mean chapter slot (0-based along the axis). */
  readonly at: number;
}

export interface ConstellationSlot {
  readonly n: number;
  readonly x: number;
  readonly written: boolean;
}

export interface ConstellationBand {
  readonly part: number;
  readonly numeral: string;
  readonly x0: number;
  readonly x1: number;
}

export interface ConstellationLink {
  readonly a: string;
  readonly b: string;
  readonly shared: number;
}

export interface Constellation {
  readonly width: number;
  readonly height: number;
  /** Centre line of the packing. */
  readonly cy: number;
  /** Baseline of the chapter axis. */
  readonly axisY: number;
  readonly slots: readonly ConstellationSlot[];
  readonly bands: readonly ConstellationBand[];
  /** The compressed zone of planned-only parts (null when every part holds a written chapter). */
  readonly planned: { readonly x0: number; readonly x1: number; readonly from: string; readonly to: string; readonly chapters: number } | null;
  readonly marks: readonly ConstellationMark[];
  readonly links: readonly ConstellationLink[];
}

export interface ConstellationOptions {
  /** Drawing width in user units. */
  readonly width?: number;
  /** Disc radius for one section, and its growth per √section. */
  readonly r0?: number;
  readonly rk?: number;
  /** Width of the planned parts' zone. */
  readonly plannedW?: number;
}

export function discRadius(sections: number, r0 = 11, rk = 2.4): number {
  return r0 + rk * Math.sqrt(Math.max(1, sections));
}

const GAP = 4;
const round = (value: number): number => Math.round(value * 10) / 10;

export function labConstellation(
  labs: readonly ConstellationLab[],
  parts: readonly ConstellationPart[],
  chapters: Readonly<Record<string, ConstellationChapter>>,
  options: ConstellationOptions = {},
): Constellation {
  const { width = 760, r0 = 11, rk = 2.4 } = options;
  const written = (n: number): boolean => chapters[String(n)]?.written === true;
  const lastWritten = parts.reduce((last, part, index) => (part.chapters.some(written) ? index : last), -1);
  const axisParts = parts.slice(0, Math.max(1, lastWritten + 1));
  const rest = parts.slice(axisParts.length);
  const padX = 18;
  const plannedW = rest.length > 0 ? (options.plannedW ?? 96) : 0;
  const x0 = padX;
  const x1 = width - padX - (plannedW > 0 ? plannedW + 14 : 0);
  const axisChapters = axisParts.flatMap((part) => part.chapters);
  const slotW = (x1 - x0) / Math.max(1, axisChapters.length);
  const slotOf = new Map(axisChapters.map((n, index) => [n, index]));
  const xAt = (slot: number): number => x0 + (slot + 0.5) * slotW;

  const drawn = labs.filter((lab) => lab.chapters.some((n) => slotOf.has(n)));
  const ideal = drawn.map((lab) => {
    let weight = 0;
    let sum = 0;
    for (const n of lab.chapters) {
      const slot = slotOf.get(n);
      if (slot === undefined) continue;
      const w = Math.max(1, lab.sectionsByChapter[String(n)] ?? 0);
      weight += w;
      sum += w * slot;
    }
    const at = weight === 0 ? 0 : sum / weight;
    return { lab, at, x: xAt(at), r: discRadius(lab.sections, r0, rk) };
  });

  // Largest first; each disc keeps its x and takes the free y nearest the centre line.
  const placed: { key: string; x: number; dy: number; r: number; at: number }[] = [];
  for (const item of [...ideal].sort((a, b) => b.r - a.r || a.at - b.at || a.lab.key.localeCompare(b.lab.key))) {
    let best = 0;
    for (let step = 0; step < 400; step += 1) {
      const dy = step === 0 ? 0 : (step % 2 === 1 ? -1 : 1) * Math.ceil(step / 2) * 2;
      if (placed.every((other) => Math.hypot(other.x - item.x, other.dy - dy) >= other.r + item.r + GAP)) {
        best = dy;
        break;
      }
    }
    placed.push({ key: item.lab.key, x: item.x, dy: best, r: item.r, at: item.at });
  }
  const up = Math.max(24, ...placed.map((item) => item.r - item.dy));
  const down = Math.max(24, ...placed.map((item) => item.r + item.dy));
  // Room above the discs for the part numerals.
  const top = 34;
  const cy = top + up;
  const axisY = cy + down + 16;

  const slots = axisChapters.map((n, index) => ({ n, x: round(xAt(index)), written: written(n) }));
  const bands = axisParts.map((part) => {
    const first = slotOf.get(part.chapters[0] ?? -1) ?? 0;
    const last = slotOf.get(part.chapters.at(-1) ?? -1) ?? first;
    return { part: part.n, numeral: part.numeral, x0: round(x0 + first * slotW + 2), x1: round(x0 + (last + 1) * slotW - 2) };
  });
  const links: ConstellationLink[] = [];
  for (let i = 0; i < drawn.length; i += 1) {
    for (let j = i + 1; j < drawn.length; j += 1) {
      const a = drawn[i];
      const b = drawn[j];
      if (a === undefined || b === undefined) continue;
      const shared = a.chapters.filter((n) => b.chapters.includes(n)).length;
      if (shared > 0) links.push({ a: a.key, b: b.key, shared });
    }
  }
  return {
    width,
    height: Math.ceil(axisY + 34),
    cy: round(cy),
    axisY: round(axisY),
    slots,
    bands,
    planned:
      rest.length === 0
        ? null
        : {
            x0: round(width - padX - plannedW),
            x1: round(width - padX),
            from: rest[0]?.numeral ?? '',
            to: rest.at(-1)?.numeral ?? '',
            chapters: rest.reduce((sum, part) => sum + part.chapters.length, 0),
          },
    marks: placed
      .map((item) => ({ key: item.key, x: round(item.x), y: round(cy + item.dy), r: round(item.r), at: round(item.at) }))
      .sort((a, b) => a.x - b.x || a.y - b.y),
    links,
  };
}
