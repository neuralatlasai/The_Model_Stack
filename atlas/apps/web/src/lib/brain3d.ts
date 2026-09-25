/**
 * The book as a 3D brain (home hero, client brain3d.ts). Pure and seeded:
 *
 *   surface    `hemispherePoint` / `cerebellumPoint` map a unit-sphere
 *              direction to a point on a folded cortex: an ellipsoid with the
 *              brain's side profile (flat underside, temporal lobe, rounded
 *              frontal pole), a flat medial wall at the longitudinal fissure,
 *              and gyri from ridged 3D simplex noise
 *   layout     `brainLayout` places the eleven parts as regions (alternating
 *              hemispheres), chapters on a small sphere around their region,
 *              glossary concepts around their chapter, and prerequisite fibres
 *              as quadratic curves bowed through the interior
 *
 * Coordinates: x front (−) to back (+), y up, z left (+) / right (−).
 */

// ── 3D simplex noise (Gustavson), seeded permutation ─────────────────────────
const GRAD3 = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
] as const;

export function simplex3(seed = 1): (x: number, y: number, z: number) => number {
  const rand = prng(seed);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [p[i], p[j]] = [p[j] ?? 0, p[i] ?? 0];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i += 1) perm[i] = p[i & 255] ?? 0;
  const F3 = 1 / 3;
  const G3 = 1 / 6;
  const dot = (g: readonly number[], x: number, y: number, z: number): number => (g[0] ?? 0) * x + (g[1] ?? 0) * y + (g[2] ?? 0) * z;
  return (xin, yin, zin) => {
    const s = (xin + yin + zin) * F3;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    const k = Math.floor(zin + s);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const z0 = zin - (k - t);
    let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number;
    if (x0 >= y0) {
      if (y0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0];
      else if (x0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1];
      else [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1];
    } else if (y0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1];
    else if (x0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1];
    else [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0];
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const corner = (tt: number, gi: number, x: number, y: number, z: number): number => {
      const tc = tt - x * x - y * y - z * z;
      return tc < 0 ? 0 : tc ** 4 * dot(GRAD3[gi % 12] ?? GRAD3[0], x, y, z);
    };
    const g0 = perm[ii + (perm[jj + (perm[kk] ?? 0)] ?? 0)] ?? 0;
    const g1 = perm[ii + i1 + (perm[jj + j1 + (perm[kk + k1] ?? 0)] ?? 0)] ?? 0;
    const g2 = perm[ii + i2 + (perm[jj + j2 + (perm[kk + k2] ?? 0)] ?? 0)] ?? 0;
    const g3 = perm[ii + 1 + (perm[jj + 1 + (perm[kk + 1] ?? 0)] ?? 0)] ?? 0;
    return 32 * (corner(0.6, g0, x0, y0, z0) + corner(0.6, g1, x1, y1, z1) + corner(0.6, g2, x2, y2, z2) + corner(0.6, g3, x3, y3, z3));
  };
}

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

/** Side-profile scale at angle θ in the x–y plane (0 = occipital pole, π/2 = down, π = frontal pole). */
function profile(theta: number): number {
  const t = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const down = Math.max(0, Math.sin(t));
  let f = 1 - 0.18 * down ** 3;
  f *= 1 + 0.12 * gauss(t, 0.58 * Math.PI, 0.2 * Math.PI);
  f *= 1 - 0.08 * gauss(t, 0.8 * Math.PI, 0.06 * Math.PI);
  f *= 1 + 0.05 * gauss(t, Math.PI, 0.25 * Math.PI);
  f *= 1 + 0.04 * gauss(t, 1.55 * Math.PI, 0.3 * Math.PI);
  return f;
}

export const HEMI = { rx: 1, ry: 0.7, rz: 0.4, centre: 0.36 } as const;
export type Noise = (x: number, y: number, z: number) => number;

/**
 * Cortical relief at a point, 0 (sulcus floor) … 1 (gyral crown). Sulci are
 * where domain-warped noise crosses zero, so they wind like real folds; the
 * gyri between them are broad and rounded.
 */
export function gyri(noise: Noise, x: number, y: number, z: number): number {
  const wx = x + 0.28 * noise(x * 1.6 + 5, y * 1.6, z * 1.6);
  const wy = y + 0.28 * noise(x * 1.6, y * 1.6 + 9, z * 1.6);
  const wz = z + 0.28 * noise(x * 1.6, y * 1.6, z * 1.6 + 13);
  const primary = 1 - Math.exp(-Math.abs(noise(wx * 4.6, wy * 4.6, wz * 4.6)) * 5.5);
  const secondary = 1 - Math.exp(-Math.abs(noise(wx * 9.5 + 3, wy * 9.5 + 1, wz * 9.5 + 7)) * 5);
  return 0.84 * primary + 0.16 * secondary * primary;
}

/** Distance from (x, y) to the polyline, for carving fissures. */
function toPolyline(x: number, y: number, pts: readonly (readonly [number, number])[]): number {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const [ax, ay] = pts[i] ?? [0, 0];
    const [bx, by] = pts[i + 1] ?? [0, 0];
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
    best = Math.min(best, Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))));
  }
  return best;
}

/** Lateral (Sylvian) fissure separating the temporal lobe, and the central sulcus. */
const SYLVIAN = [[-0.62, -0.2], [-0.3, -0.12], [0.02, -0.02], [0.3, 0.1]] as const;
const CENTRAL = [[0.02, 0.72], [-0.06, 0.45], [-0.14, 0.18], [-0.2, 0.0]] as const;

/** A point on one hemisphere's cortex for unit direction (ux, uy, uz); side = +1 left, −1 right. */
export function hemispherePoint(noise: Noise, ux: number, uy: number, uz: number, side: 1 | -1): readonly [number, number, number] {
  const f = profile(Math.atan2(-uy, ux));
  let x = ux * HEMI.rx * f;
  let y = uy * HEMI.ry * f;
  if (y < 0) y *= 0.84;
  // lateral coordinate from the hemisphere's own centre; the medial wall is flattened
  let zl = uz * side * HEMI.rz;
  const medial = zl < -0.3;
  if (medial) zl = -0.3 + (zl + 0.3) * 0.14;
  const lateral = 1 - Math.max(0, -zl / HEMI.rz) * 0.7;
  const g = gyri(noise, x, y, side * (HEMI.centre + zl)) * (medial ? 0.4 : 1);
  const onSide = Math.max(0, zl / HEMI.rz);
  const fissure = 0.075 * Math.exp(-((toPolyline(x, y, SYLVIAN) / 0.035) ** 2)) * onSide + 0.04 * Math.exp(-((toPolyline(x, y, CENTRAL) / 0.028) ** 2));
  const d = (0.07 * g - 0.045) * lateral - fissure;
  const len = Math.hypot(x, y, zl) || 1;
  x += (x / len) * d;
  y += (y / len) * d;
  zl += (zl / len) * d;
  return [x, y, side * (HEMI.centre + zl)];
}

export const CEREBELLUM = { x: 0.6, y: -0.38, rx: 0.28, ry: 0.17, rz: 0.46 } as const;

/** A point on the cerebellum for unit direction: an ellipsoid with fine horizontal folia and a midline notch. */
export function cerebellumPoint(noise: Noise, ux: number, uy: number, uz: number): readonly [number, number, number] {
  const folia = 0.014 * Math.sin(uy * 64 + noise(ux * 3, uy * 3, uz * 3) * 2.5);
  const notch = 1 - 0.1 * gauss(uz, 0, 0.12) * Math.max(0, uy);
  const r = 1 + folia;
  return [CEREBELLUM.x + ux * CEREBELLUM.rx * r, CEREBELLUM.y + uy * CEREBELLUM.ry * r * notch, uz * CEREBELLUM.rz * r];
}

/** Inside the cerebrum volume (with a safety margin 0–1). */
export function insideBrain(x: number, y: number, z: number, margin = 0.82): boolean {
  const side = z >= 0 ? 1 : -1;
  const zl = z * side - HEMI.centre;
  const f = profile(Math.atan2(-y, x));
  const yy = y < 0 ? y / 0.84 : y;
  return (x / (HEMI.rx * f)) ** 2 + (yy / (HEMI.ry * f)) ** 2 + (zl / HEMI.rz) ** 2 <= margin * margin && z * side > 0.03;
}

// ── layout ───────────────────────────────────────────────────────────────────

export interface Brain3DInput {
  readonly parts: readonly { readonly n: number; readonly title: string; readonly domain: string }[];
  readonly chapters: readonly { readonly n: number; readonly title: string; readonly url: string; readonly part: number; readonly domain: string; readonly written: boolean }[];
  readonly terms: readonly { readonly term: string; readonly chapter: number }[];
  readonly prereqs: readonly (readonly [number, number])[];
}

export interface Brain3D {
  readonly regions: readonly { readonly n: number; readonly label: string; readonly domain: string; readonly p: readonly [number, number, number] }[];
  readonly neurons: readonly { readonly n: number; readonly title: string; readonly url: string; readonly part: number; readonly region: string; readonly domain: string; readonly written: boolean; readonly concepts: number; readonly p: readonly [number, number, number] }[];
  readonly concepts: readonly { readonly chapter: number; readonly term: string; readonly domain: string; readonly p: readonly [number, number, number] }[];
  readonly fibres: readonly { readonly from: number; readonly to: number; readonly c: readonly [number, number, number] }[];
}

export const REGION_LABEL: Readonly<Record<number, string>> = {
  1: 'Foundations',
  2: 'Data',
  3: 'Architecture',
  4: 'Training',
  5: 'Hardware',
  6: 'Post-training',
  7: 'Inference',
  8: 'Serving',
  9: 'Agents',
  10: 'Multimodal',
  11: 'Evaluation',
};

/** Region centres (x front→back, y up) and hemisphere per part. */
const REGION: Readonly<Record<number, readonly [number, number, 1 | -1]>> = {
  1: [0.62, 0.12, 1],
  2: [0.42, 0.42, -1],
  3: [0.1, 0.5, 1],
  4: [-0.22, 0.46, -1],
  5: [-0.52, 0.3, 1],
  6: [-0.76, 0.02, -1],
  7: [-0.5, -0.24, 1],
  8: [-0.14, 0.06, -1],
  9: [0.2, 0.12, 1],
  10: [0.02, -0.32, -1],
  11: [0.46, -0.12, -1],
};

/** Points on a sphere (Fibonacci), deterministic. */
function sphere(count: number, radius: number, twist: number): (readonly [number, number, number])[] {
  const out: (readonly [number, number, number])[] = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const a = i * 2.39996 + twist;
    out.push([Math.cos(a) * r * radius, y * radius, Math.sin(a) * r * radius]);
  }
  return out;
}

/** Pull a point toward an anchor until it lies inside the cerebrum. */
function inside(p: readonly [number, number, number], anchor: readonly [number, number, number], margin: number): [number, number, number] {
  let [x, y, z] = p;
  for (let k = 0; k < 10 && !insideBrain(x, y, z, margin); k += 1) {
    x = (x + anchor[0]) / 2;
    y = (y + anchor[1]) / 2;
    z = (z + anchor[2]) / 2;
  }
  return [x, y, z];
}

export function brainLayout(input: Brain3DInput): Brain3D {
  const regions = input.parts.map((part) => {
    const [x, y, side] = REGION[part.n] ?? [0, 0, 1];
    return { n: part.n, label: REGION_LABEL[part.n] ?? part.title, domain: part.domain, p: [x, y, side * (HEMI.centre + 0.02)] as const };
  });
  const regionAt = new Map(regions.map((region) => [region.n, region.p]));
  const conceptCount = new Map<number, number>();
  for (const term of input.terms) conceptCount.set(term.chapter, (conceptCount.get(term.chapter) ?? 0) + 1);

  const byPart = new Map<number, Brain3DInput['chapters'][number][]>();
  for (const chapter of input.chapters) byPart.set(chapter.part, [...(byPart.get(chapter.part) ?? []), chapter]);
  const neurons: Brain3D['neurons'][number][] = [];
  for (const [part, list] of byPart) {
    const centre = regionAt.get(part) ?? ([0, 0, HEMI.centre] as const);
    const ring = sphere(list.length, 0.15, part);
    list.forEach((chapter, i) => {
      const [dx, dy, dz] = ring[i] ?? [0, 0, 0];
      const p = inside([centre[0] + dx, centre[1] + dy * 0.8, centre[2] + dz * 0.7], centre, 0.8);
      neurons.push({ n: chapter.n, title: chapter.title, url: chapter.url, part, region: REGION_LABEL[part] ?? '', domain: chapter.domain, written: chapter.written, concepts: conceptCount.get(chapter.n) ?? 0, p });
    });
  }
  const at = new Map(neurons.map((neuron) => [neuron.n, neuron]));

  const seen = new Map<number, number>();
  const concepts: Brain3D['concepts'][number][] = [];
  for (const term of input.terms) {
    const home = at.get(term.chapter);
    if (home === undefined) continue;
    const i = seen.get(term.chapter) ?? 0;
    seen.set(term.chapter, i + 1);
    const total = conceptCount.get(term.chapter) ?? 1;
    const [dx, dy, dz] = sphere(total, 0.05 + 0.012 * Math.sqrt(total), term.chapter)[i] ?? [0, 0, 0];
    concepts.push({ chapter: term.chapter, term: term.term, domain: home.domain, p: inside([home.p[0] + dx, home.p[1] + dy, home.p[2] + dz], home.p, 0.86) });
  }

  const fibres = input.prereqs
    .map(([from, to]) => {
      const a = at.get(from);
      const b = at.get(to);
      if (a === undefined || b === undefined) return null;
      const mid = [(a.p[0] + b.p[0]) / 2, (a.p[1] + b.p[1]) / 2, (a.p[2] + b.p[2]) / 2] as const;
      const c = [mid[0] * 0.62, mid[1] * 0.62 - 0.04, mid[2] * 0.55] as const;
      return { from, to, c };
    })
    .filter((fibre) => fibre !== null);

  return { regions, neurons, concepts, fibres };
}

/** Domain colours for the neural glow (the bright palette the brain uses on its dark cortex). */
export const GLOW: Readonly<Record<string, string>> = {
  foundations: '#e6ddcc',
  data: '#ffae70',
  architecture: '#7fc0ff',
  training: '#d19cff',
  hardware: '#ffcf4d',
  'post-training': '#ff8db3',
  inference: '#7fe6a4',
  serving: '#68e0dd',
  agents: '#9fb3ff',
  embodied: '#f2c36b',
  evaluation: '#d4d8df',
  reference: '#e6ddcc',
};

/** Domain colours on paper (deep, saturated inks for the light theme). */
export const INK: Readonly<Record<string, string>> = {
  foundations: '#a48558',
  data: '#b5541f',
  architecture: '#1f5fa8',
  training: '#7a45b5',
  hardware: '#a87a00',
  'post-training': '#b33a66',
  inference: '#23864a',
  serving: '#16807f',
  agents: '#4a5fc4',
  embodied: '#8a6a1c',
  evaluation: '#5c636d',
  reference: '#4a4740',
};
