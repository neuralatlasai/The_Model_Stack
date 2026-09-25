/**
 * The book as a globe (home § 02, client globe3d.ts). Pure:
 *
 *   nodes   every chapter on the surface of a unit sphere, along a coil that
 *           winds from the north (chapter 1) to the south (chapter 66) in
 *           reading order — neighbouring chapters are neighbours on the
 *           world, and each part is one stretch of the coil
 *   arcs    every declared prerequisite as a great-circle arc lifted off the
 *           surface, higher the farther it travels
 *
 * Coordinates: y up; longitude 0 faces +z (the camera).
 */

export interface GlobeChapter {
  readonly n: number;
  readonly title: string;
  readonly url: string;
  readonly part: number;
  readonly domain: string;
  readonly written: boolean;
}

export interface GlobeNode extends GlobeChapter {
  readonly lat: number;
  readonly lon: number;
  readonly p: readonly [number, number, number];
}

export function onSphere(lat: number, lon: number, r = 1): [number, number, number] {
  return [r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon)];
}

export function globeNodes(chapters: readonly GlobeChapter[], turns = 2.2): GlobeNode[] {
  const sorted = [...chapters].sort((a, b) => a.n - b.n);
  const last = Math.max(1, sorted.length - 1);
  return sorted.map((chapter, i) => {
    const t = i / last;
    const lat = ((62 - t * 124) * Math.PI) / 180;
    const lon = t * turns * 2 * Math.PI - Math.PI / 2;
    return { ...chapter, lat, lon, p: onSphere(lat, lon) };
  });
}

/** Point `t` (0–1) along the lifted great-circle arc from a to b (unit vectors). */
export function arcPoint(a: readonly [number, number, number], b: readonly [number, number, number], t: number): [number, number, number] {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  let p: [number, number, number];
  if (omega < 1e-5) p = [a[0], a[1], a[2]];
  else {
    const s = Math.sin(omega);
    const wa = Math.sin((1 - t) * omega) / s;
    const wb = Math.sin(t * omega) / s;
    p = [a[0] * wa + b[0] * wb, a[1] * wa + b[1] * wb, a[2] * wa + b[2] * wb];
  }
  const lift = 1 + (0.02 + 0.1 * (omega / Math.PI)) * Math.sin(Math.PI * t);
  return [p[0] * lift, p[1] * lift, p[2] * lift];
}
