/**
 * Small helpers shared by the renderers. Pure; safe on server and client.
 */
import type { Point } from '@atlas/core';

/** Joins class names, skipping falsy parts. */
export function cls(...parts: readonly (string | false | null | undefined)[]): string {
  return parts.filter((part): part is string => typeof part === 'string' && part !== '').join(' ');
}

/** FNV-1a 32-bit hash → base-36; used for deterministic, collision-resistant SVG id prefixes. */
export function hashId(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

/** A fragment-safe id prefix. */
export function safeId(text: string): string {
  const cleaned = text.replace(/[^A-Za-z0-9_-]+/gu, '-').replace(/^-+|-+$/gu, '');
  return /^[A-Za-z]/u.test(cleaned) ? cleaned : `vg-${cleaned}`;
}

/** Minimum rendered scale of an SVG figure inside a scroll region (CSS `.vg-scroll .vg-w{k}`). */
export const MIN_FIGURE_SCALE = 0.8;
const WIDTH_BUCKET = 50;
const MAX_BUCKET = 48;

/**
 * Size-bucket class carrying an SVG's natural width to CSS without an inline
 * style (CSP-safe): inside a `.vg-scroll` region the figure never renders
 * below MIN_FIGURE_SCALE of its natural size, so labels stay legible on phones.
 */
export function widthClass(width: number): string {
  return `vg-w${Math.min(MAX_BUCKET, Math.max(1, Math.floor(width / WIDTH_BUCKET)))}`;
}

export function r1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * SVG path through orthogonal points with rounded corners of radius ≤ `radius`
 * (clamped to half of each adjacent segment). `trimEnd` shortens the last
 * segment so an arrowhead can sit on the endpoint without the stroke showing through.
 */
export function roundedPath(points: readonly Point[], radius: number, trimEnd = 0): string {
  if (points.length < 2) return '';
  const pts = points.map((point) => ({ x: point.x, y: point.y }));
  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  if (last !== undefined && prev !== undefined && trimEnd > 0) {
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const length = Math.hypot(dx, dy);
    if (length > trimEnd) {
      last.x -= (dx / length) * trimEnd;
      last.y -= (dy / length) * trimEnd;
    }
  }
  const first = pts[0];
  if (first === undefined) return '';
  let d = `M${r1(first.x)} ${r1(first.y)}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    if (a === undefined || b === undefined || c === undefined) continue;
    const inLen = Math.hypot(b.x - a.x, b.y - a.y);
    const outLen = Math.hypot(c.x - b.x, c.y - b.y);
    const r = Math.min(radius, inLen / 2, outLen / 2);
    if (r < 0.5 || inLen === 0 || outLen === 0) {
      d += ` L${r1(b.x)} ${r1(b.y)}`;
      continue;
    }
    const p1 = { x: b.x - ((b.x - a.x) / inLen) * r, y: b.y - ((b.y - a.y) / inLen) * r };
    const p2 = { x: b.x + ((c.x - b.x) / outLen) * r, y: b.y + ((c.y - b.y) / outLen) * r };
    d += ` L${r1(p1.x)} ${r1(p1.y)} Q${r1(b.x)} ${r1(b.y)} ${r1(p2.x)} ${r1(p2.y)}`;
  }
  const end = pts[pts.length - 1];
  if (end !== undefined) d += ` L${r1(end.x)} ${r1(end.y)}`;
  return d;
}

/** Arrowhead polygon points with its tip at `tip`, pointing along from → tip. */
export function arrowHead(from: Point, tip: Point, length = 7, halfWidth = 3.5): string {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const bx = tip.x - ux * length;
  const by = tip.y - uy * length;
  const left = `${r1(bx - uy * halfWidth)},${r1(by + ux * halfWidth)}`;
  const right = `${r1(bx + uy * halfWidth)},${r1(by - ux * halfWidth)}`;
  return `${r1(tip.x)},${r1(tip.y)} ${left} ${right}`;
}

// ─── live-instrument state (VISUAL_GRAMMAR §6) ──────────────────────────────

/** The parts a state lights, and the variables it overrides. */
export interface StateView {
  /** Keys of lit parts (`data-vg-key`); empty = nothing dimmed. */
  readonly lit: ReadonlySet<string>;
  /** Formula-variable / calculator-input overrides, or null. */
  readonly overrides: Readonly<Record<string, number>> | null;
}

export const NO_STATE: StateView = { lit: new Set<string>(), overrides: null };

/** `is-lit` when `key` is lit in `state`. */
export function litClass(state: StateView, key: string): string | false {
  return state.lit.has(key) && 'is-lit';
}

/** Key of a scene edge (`from->to`). */
export function edgeKey(from: string, to: string): string {
  return `${from}->${to}`;
}

/** Inline style carrying a 0..1 fraction as `--vg-frac` (the live-instrument width/position channel). */
export function fracStyle(frac: number): Record<string, string> {
  const clamped = Number.isFinite(frac) ? Math.min(1, Math.max(0, frac)) : 0;
  return { '--vg-frac': String(Math.round(clamped * 1e4) / 1e4) };
}
