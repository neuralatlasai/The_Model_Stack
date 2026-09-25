/**
 * Land of the real Earth as dots, for the globe (home § 02). An equal-area
 * Fibonacci lattice over the sphere keeps the points that fall on land in
 * Natural Earth's 1:110m land polygons (world-atlas, public domain), so the
 * dotted continents have even density from equator to pole.
 * Build-time only; the page receives the flat [lat, lon, lat, lon, …] list.
 */
import type { MultiPolygon, Polygon, Position } from 'geojson';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import land from 'world-atlas/land-110m.json' with { type: 'json' };

type Ring = readonly Position[];

function inRing(lon: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi = 0, yi = 0] = ring[i] ?? [];
    const [xj = 0, yj = 0] = ring[j] ?? [];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inPolygon(lon: number, lat: number, rings: readonly Ring[]): boolean {
  const [outer, ...holes] = rings;
  return outer !== undefined && inRing(lon, lat, outer) && !holes.some((hole) => inRing(lon, lat, hole));
}

let cached: number[] | null = null;

/** Land dots as a flat list of [latitude, longitude] pairs in radians (rounded to 3 decimals). */
export function landDots(count = 22000): number[] {
  if (cached !== null) return cached;
  const topology = land as unknown as Topology<{ land: GeometryCollection }>;
  const collection = feature(topology, topology.objects.land);
  const polygons: (readonly Ring[])[] = [];
  const bounds: [number, number, number, number][] = [];
  for (const item of collection.features) {
    const geometry = item.geometry as Polygon | MultiPolygon;
    const list = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    for (const rings of list) {
      polygons.push(rings);
      const outer = rings[0] ?? [];
      bounds.push([
        Math.min(...outer.map((p) => p[0] ?? 0)),
        Math.min(...outer.map((p) => p[1] ?? 0)),
        Math.max(...outer.map((p) => p[0] ?? 0)),
        Math.max(...outer.map((p) => p[1] ?? 0)),
      ]);
    }
  }
  const out: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const lat = Math.asin(y);
    const lon = (((i * 2.399963229728653) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    const dlat = (lat * 180) / Math.PI;
    const dlon = (lon * 180) / Math.PI;
    const hit = polygons.some((rings, k) => {
      const b = bounds[k];
      return b !== undefined && dlon >= b[0] && dlon <= b[2] && dlat >= b[1] && dlat <= b[3] && inPolygon(dlon, dlat, rings);
    });
    if (hit) out.push(Math.round(lat * 1000) / 1000, Math.round(lon * 1000) / 1000);
  }
  cached = out;
  return out;
}
