/**
 * The book as a brain (home hero): a side-view brain drawn procedurally —
 * cerebrum with gyri and the lateral and central fissures, cerebellum with
 * folia, brainstem — and the book mapped into it:
 *
 *   regions    the eleven parts, each a region of the cerebrum
 *   neurons    the 66 chapters, on a small ring around their region
 *   concepts   glossary terms, clustered around the chapter that owns them
 *   fibres     declared chapter prerequisites, curving through the interior
 *   dendrites  each concept to its chapter
 *
 * Pure and deterministic (seeded), so the server renders the same brain on
 * every build and the tests can check that everything lands inside it.
 */

export interface BrainChapter {
  readonly n: number;
  readonly number: string;
  readonly title: string;
  readonly url: string;
  readonly part: number;
  readonly domain: string;
  readonly written: boolean;
}

export interface BrainPart {
  readonly n: number;
  readonly numeral: string;
  readonly title: string;
  readonly domain: string;
  readonly url: string;
}

export interface BrainTerm {
  readonly term: string;
  readonly chapter: number;
  readonly url: string;
}

export interface BrainNeuron extends BrainChapter {
  readonly x: number;
  readonly y: number;
}

export interface BrainModel {
  readonly width: number;
  readonly height: number;
  readonly cerebrum: string;
  readonly cerebellum: string;
  readonly folia: readonly string[];
  readonly stem: string;
  readonly sulci: readonly string[];
  readonly fissures: readonly string[];
  readonly regions: readonly (BrainPart & { readonly x: number; readonly y: number })[];
  readonly neurons: readonly BrainNeuron[];
  readonly concepts: readonly (BrainTerm & { readonly x: number; readonly y: number; readonly domain: string })[];
  readonly fibres: readonly { readonly from: number; readonly to: number; readonly d: string }[];
  readonly dendrites: readonly { readonly chapter: number; readonly d: string; readonly domain: string }[];
}

const W = 600;
const H = 392;
const CX = 300;
const CY = 180;
const RX = 250;
const RY = 152;

/** Deterministic PRNG (mulberry32). */
export function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (x: number, mu: number, s: number): number => Math.exp(-(((x - mu) / s) ** 2));

/** Radial scale of the cerebrum outline at angle θ (0 = occipital pole, π/2 = down, π = frontal pole). */
function shape(theta: number, bumps: boolean): number {
  const t = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const down = Math.max(0, Math.sin(t));
  let f = 1;
  f *= 1 - 0.2 * down ** 3; // flatter underside
  f *= 1 + 0.12 * gauss(t, 0.56 * Math.PI, 0.2 * Math.PI); // temporal lobe hangs low
  f *= 1 - 0.1 * gauss(t, 0.8 * Math.PI, 0.055 * Math.PI); // notch at the lateral fissure
  f *= 1 + 0.04 * gauss(t, Math.PI, 0.25 * Math.PI); // rounded frontal pole
  f *= 1 + 0.03 * gauss(t, 1.55 * Math.PI, 0.3 * Math.PI); // high parietal dome
  if (bumps) f *= 1 + 0.016 * Math.sin(27 * t) + 0.009 * Math.sin(49 * t + 0.7);
  return f;
}

const point = (theta: number, scale: number, bumps = false): readonly [number, number] => {
  const f = shape(theta, bumps) * scale;
  return [CX + RX * Math.cos(theta) * f, CY + RY * Math.sin(theta) * f];
};

/** True when (x, y) lies inside the cerebrum shrunk by `margin` (0–1). */
export function insideCerebrum(x: number, y: number, margin = 0.9): boolean {
  const theta = Math.atan2((y - CY) / RY, (x - CX) / RX);
  const [bx, by] = point(theta, margin);
  return Math.hypot(x - CX, y - CY) <= Math.hypot(bx - CX, by - CY);
}

const fmt = (v: number): string => (Math.round(v * 10) / 10).toString();

function closed(points: readonly (readonly [number, number])[]): string {
  return `M${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L')}Z`;
}

/** A smooth open path through points (quadratic through midpoints). */
function smooth(points: readonly (readonly [number, number])[]): string {
  const first = points[0];
  if (first === undefined) return '';
  let d = `M${fmt(first[0])} ${fmt(first[1])}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [x, y] = points[i] ?? first;
    const [nx, ny] = points[i + 1] ?? first;
    d += `Q${fmt(x)} ${fmt(y)} ${fmt((x + nx) / 2)} ${fmt((y + ny) / 2)}`;
  }
  const last = points.at(-1) ?? first;
  return `${d}L${fmt(last[0])} ${fmt(last[1])}`;
}

/** Region centres, one per part, spread through the cerebrum (numbers are part numbers). */
const REGION: Readonly<Record<number, readonly [number, number]>> = {
  1: [470, 150],
  2: [412, 88],
  3: [330, 66],
  4: [246, 76],
  5: [160, 112],
  6: [98, 186],
  7: [168, 244],
  8: [252, 178],
  9: [340, 160],
  10: [300, 262],
  11: [418, 222],
};

export function brainMap(parts: readonly BrainPart[], chapters: readonly BrainChapter[], terms: readonly BrainTerm[], prereqs: readonly (readonly [number, number])[], seed = 7): BrainModel {
  const rand = prng(seed);

  const outline: [number, number][] = [];
  for (let i = 0; i < 360; i += 1) outline.push([...point((i / 360) * 2 * Math.PI, 1, true)]);
  const cerebrum = closed(outline);

  // Gyri: short meandering curves inside the cerebrum (clipped to it when drawn).
  const sulci: string[] = [];
  for (let tries = 0; sulci.length < 110 && tries < 4000; tries += 1) {
    const x = CX - RX + rand() * 2 * RX;
    const y = CY - RY + rand() * 2 * RY * 1.1;
    if (!insideCerebrum(x, y, 0.97)) continue;
    let angle = rand() * Math.PI * 2;
    const pts: [number, number][] = [[x, y]];
    const steps = 3 + Math.floor(rand() * 4);
    for (let s = 0; s < steps; s += 1) {
      angle += (rand() - 0.5) * 2.2;
      const len = 8 + rand() * 13;
      const prev = pts.at(-1) ?? [x, y];
      pts.push([prev[0] + Math.cos(angle) * len, prev[1] + Math.sin(angle) * len]);
    }
    sulci.push(smooth(pts));
  }
  const fissures = [
    smooth([[118, 232], [170, 226], [228, 214], [284, 206], [336, 196], [372, 176]]), // lateral (Sylvian)
    smooth([[318, 36], [306, 74], [288, 108], [276, 140], [262, 170]]), // central
    smooth([[470, 64], [478, 100], [492, 126]]), // parieto-occipital
  ];

  // Cerebellum below the occipital lobe, brainstem below the centre.
  const cb: [number, number][] = [];
  for (let i = 0; i < 180; i += 1) {
    const t = (i / 180) * 2 * Math.PI;
    const r = 1 + 0.02 * Math.sin(22 * t);
    cb.push([432 + 84 * Math.cos(t) * r, 300 + 48 * Math.sin(t) * r]);
  }
  const cerebellum = closed(cb);
  const folia = [0.84, 0.66, 0.48, 0.3].map((k) => smooth(Array.from({ length: 13 }, (_, i) => {
    const t = Math.PI * (0.05 + (i / 12) * 0.9);
    return [432 + 84 * k * Math.cos(t + Math.PI), 312 + 42 * k * Math.sin(t) * 0.9 - 4] as [number, number];
  })));
  const stem = 'M322 280C332 306 342 326 348 346C352 360 354 374 356 390L388 390C388 372 392 358 398 344C406 324 414 304 420 284Z';

  // Neurons: each part's chapters on a small ring around its region.
  const byPart = new Map<number, BrainChapter[]>();
  for (const chapter of chapters) byPart.set(chapter.part, [...(byPart.get(chapter.part) ?? []), chapter]);
  const neurons: BrainNeuron[] = [];
  for (const [part, list] of byPart) {
    const [rx, ry] = REGION[part] ?? [CX, CY];
    const offset = part * 0.9;
    list.forEach((chapter, i) => {
      const angle = offset + (i / list.length) * Math.PI * 2;
      let x = rx + Math.cos(angle) * 27;
      let y = ry + Math.sin(angle) * 21;
      for (let k = 0; k < 8 && !insideCerebrum(x, y, 0.9); k += 1) {
        x = (x + rx) / 2;
        y = (y + ry) / 2;
      }
      neurons.push({ ...chapter, x, y });
    });
  }
  const at = new Map(neurons.map((neuron) => [neuron.n, neuron]));

  // Concepts: a golden-angle spiral around the owning chapter.
  const perChapter = new Map<number, number>();
  const concepts: BrainModel['concepts'][number][] = [];
  const dendrites: BrainModel['dendrites'][number][] = [];
  for (const term of terms) {
    const home = at.get(term.chapter);
    if (home === undefined) continue;
    const i = perChapter.get(term.chapter) ?? 0;
    perChapter.set(term.chapter, i + 1);
    const angle = i * 2.39996 + home.n;
    const r = 10 + 4.6 * Math.sqrt(i + 1);
    let x = home.x + Math.cos(angle) * r;
    let y = home.y + Math.sin(angle) * r * 0.85;
    for (let k = 0; k < 8 && !insideCerebrum(x, y, 0.93); k += 1) {
      x = (x + home.x) / 2;
      y = (y + home.y) / 2;
    }
    concepts.push({ ...term, x, y, domain: home.domain });
    dendrites.push({ chapter: home.n, domain: home.domain, d: `M${fmt(home.x)} ${fmt(home.y)}L${fmt(x)} ${fmt(y)}` });
  }

  // Fibres: prerequisite → chapter, bowed toward the interior like white-matter tracts.
  const fibres = prereqs
    .map(([from, to]) => {
      const a = at.get(from);
      const b = at.get(to);
      if (a === undefined || b === undefined) return null;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const qx = mx + (CX - mx) * 0.38;
      const qy = my + (CY + 10 - my) * 0.38;
      return { from, to, d: `M${fmt(a.x)} ${fmt(a.y)}Q${fmt(qx)} ${fmt(qy)} ${fmt(b.x)} ${fmt(b.y)}` };
    })
    .filter((fibre) => fibre !== null);

  const regions = parts.map((part) => {
    const [x, y] = REGION[part.n] ?? [CX, CY];
    return { ...part, x, y };
  });

  return { width: W, height: H, cerebrum, cerebellum, folia, stem, sulci, fissures, regions, neurons, concepts, fibres, dendrites };
}
