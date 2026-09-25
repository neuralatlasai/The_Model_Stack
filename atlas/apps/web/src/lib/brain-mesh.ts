/**
 * Cortex meshes for the 3D brain, built fast enough to show at once:
 * an indexed icosphere by recursive subdivision (shared vertices from the
 * start — no vertex merging), sculpted by lib/brain3d.ts, with area-weighted
 * vertex normals. Pure; runs in a Web Worker (client/brain-worker.ts) or, as
 * a fallback, on the main thread.
 */
import { cerebellumPoint, hemispherePoint, simplex3 } from './brain3d.ts';

export interface MeshArrays {
  readonly position: Float32Array;
  readonly normal: Float32Array;
  readonly index: Uint32Array;
}

const T = (1 + Math.sqrt(5)) / 2;
const ICO_VERTICES = [
  [-1, T, 0], [1, T, 0], [-1, -T, 0], [1, -T, 0],
  [0, -1, T], [0, 1, T], [0, -1, -T], [0, 1, -T],
  [T, 0, -1], [T, 0, 1], [-T, 0, -1], [-T, 0, 1],
] as const;
const ICO_FACES = [
  [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
  [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
  [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
  [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
] as const;

/** Unit icosphere with 10·4^level + 2 shared vertices. */
export function icosphere(level: number): { position: Float32Array; index: Uint32Array } {
  const vertexCount = 10 * 4 ** level + 2;
  const position = new Float32Array(vertexCount * 3);
  let count = 0;
  const push = (x: number, y: number, z: number): number => {
    const l = Math.hypot(x, y, z) || 1;
    position[count * 3] = x / l;
    position[count * 3 + 1] = y / l;
    position[count * 3 + 2] = z / l;
    count += 1;
    return count - 1;
  };
  for (const [x, y, z] of ICO_VERTICES) push(x, y, z);
  let faces: number[] = ICO_FACES.flat();
  for (let l = 0; l < level; l += 1) {
    const cache = new Map<number, number>();
    const mid = (a: number, b: number): number => {
      const key = a < b ? a * vertexCount + b : b * vertexCount + a;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const i = push(
        (position[a * 3] ?? 0) + (position[b * 3] ?? 0),
        (position[a * 3 + 1] ?? 0) + (position[b * 3 + 1] ?? 0),
        (position[a * 3 + 2] ?? 0) + (position[b * 3 + 2] ?? 0),
      );
      cache.set(key, i);
      return i;
    };
    const next: number[] = [];
    for (let f = 0; f < faces.length; f += 3) {
      const a = faces[f] ?? 0;
      const b = faces[f + 1] ?? 0;
      const c = faces[f + 2] ?? 0;
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      next.push(a, ab, ca, b, bc, ab, c, ca, bc, ab, bc, ca);
    }
    faces = next;
  }
  return { position, index: Uint32Array.from(faces) };
}

/** Area-weighted vertex normals. */
export function vertexNormals(position: Float32Array, index: Uint32Array): Float32Array {
  const normal = new Float32Array(position.length);
  for (let f = 0; f < index.length; f += 3) {
    const a = (index[f] ?? 0) * 3;
    const b = (index[f + 1] ?? 0) * 3;
    const c = (index[f + 2] ?? 0) * 3;
    const ux = (position[b] ?? 0) - (position[a] ?? 0);
    const uy = (position[b + 1] ?? 0) - (position[a + 1] ?? 0);
    const uz = (position[b + 2] ?? 0) - (position[a + 2] ?? 0);
    const vx = (position[c] ?? 0) - (position[a] ?? 0);
    const vy = (position[c + 1] ?? 0) - (position[a + 1] ?? 0);
    const vz = (position[c + 2] ?? 0) - (position[a + 2] ?? 0);
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) {
      normal[v] = (normal[v] ?? 0) + nx;
      normal[v + 1] = (normal[v + 1] ?? 0) + ny;
      normal[v + 2] = (normal[v + 2] ?? 0) + nz;
    }
  }
  for (let i = 0; i < normal.length; i += 3) {
    const l = Math.hypot(normal[i] ?? 0, normal[i + 1] ?? 0, normal[i + 2] ?? 1) || 1;
    normal[i] = (normal[i] ?? 0) / l;
    normal[i + 1] = (normal[i + 1] ?? 0) / l;
    normal[i + 2] = (normal[i + 2] ?? 0) / l;
  }
  return normal;
}

function sculpt(level: number, point: (x: number, y: number, z: number) => readonly [number, number, number]): MeshArrays {
  const { position, index } = icosphere(level);
  for (let i = 0; i < position.length; i += 3) {
    const [x, y, z] = point(position[i] ?? 0, position[i + 1] ?? 0, position[i + 2] ?? 0);
    position[i] = x;
    position[i + 1] = y;
    position[i + 2] = z;
  }
  return { position, normal: vertexNormals(position, index), index };
}

/** Left hemisphere, right hemisphere, cerebellum. */
export function brainMeshes(small: boolean): MeshArrays[] {
  const noise = simplex3(3);
  const level = small ? 5 : 6;
  return [
    sculpt(level, (x, y, z) => hemispherePoint(noise, x, y, z, 1)),
    sculpt(level, (x, y, z) => hemispherePoint(noise, x, y, z, -1)),
    sculpt(level - 1, (x, y, z) => cerebellumPoint(noise, x, y, z)),
  ];
}
