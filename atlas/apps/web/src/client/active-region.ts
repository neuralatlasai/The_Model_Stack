/**
 * Pure geometry of scroll synchronisation (UI_UX §11). No DOM access: the
 * controller measures, these functions decide. Unit-tested under node:test.
 */
import type { RegionRole } from '@atlas/core';
import { REGION_ROLES } from './contract.ts';

export interface ActivePick {
  /** Index into the measured regions; -1 when there are no regions. */
  readonly index: number;
  /** True when a region has actually crossed the reading line (false at the top of the page). */
  readonly crossed: boolean;
}

/**
 * The active region is the last region whose top has crossed the reading line
 * (`top <= line`, viewport coordinates). When the page is scrolled to the very
 * bottom, short trailing regions can never reach the line, so the last region
 * whose top is inside the viewport wins instead. Before any region crosses,
 * the first region is active (the rail shows its instruments) but `crossed`
 * is false so the URL hash is left alone.
 */
export function pickActiveRegion(tops: readonly number[], line: number, atBottom: boolean, viewportHeight: number): ActivePick {
  if (tops.length === 0) return { index: -1, crossed: false };
  let index = -1;
  const limit = atBottom ? viewportHeight - 1 : line;
  for (let i = 0; i < tops.length; i += 1) {
    const top = tops[i];
    if (top !== undefined && top <= limit) index = i;
  }
  return index === -1 ? { index: 0, crossed: false } : { index, crossed: true };
}

export interface ProgressInput {
  /** Reading line in viewport coordinates (READING_THRESHOLD × viewport height). */
  readonly line: number;
  /** Article box in viewport coordinates. */
  readonly articleTop: number;
  readonly articleHeight: number;
  readonly atBottom: boolean;
}

/** Fraction of the article above the reading line, clamped to 0..1; 1 at the bottom of the page. */
export function readingProgress(input: ProgressInput): number {
  if (input.atBottom) return 1;
  if (!(input.articleHeight > 0)) return 0;
  return clamp01((input.line - input.articleTop) / input.articleHeight);
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Within 2 px of the bottom counts as the bottom (sub-pixel scroll positions, zoom). */
export function isAtBottom(scrollY: number, viewportHeight: number, pageHeight: number): boolean {
  return scrollY + viewportHeight >= pageHeight - 2;
}

/**
 * Whether the URL hash should follow the active region. A deep link to an
 * object inside the active region (`#eq-5-4` while reading `#formulation`) is
 * kept; it is only replaced once the reader has moved to another region.
 *
 * @param currentHash  `location.hash` without `#` (decoded), possibly empty.
 * @param hashRegion   anchor of the region containing the current hash target, or null.
 */
export function shouldReplaceHash(currentHash: string, activeAnchor: string, hashRegion: string | null): boolean {
  if (currentHash === activeAnchor) return false;
  if (currentHash !== '' && hashRegion === activeAnchor) return false;
  return true;
}

/** `href` with its fragment replaced (`anchor`) or removed (null). Query and path are preserved. */
export function hrefWithHash(href: string, anchor: string | null): string {
  const url = new URL(href);
  url.hash = anchor === null ? '' : `#${anchor}`;
  const text = url.href;
  // URL keeps a bare `#` when the hash is set to '' on some engines; strip it.
  return anchor === null && text.endsWith('#') ? text.slice(0, -1) : text;
}

const KNOWN_ROLES: ReadonlySet<string> = new Set<string>(REGION_ROLES);

function isKnownRole(value: string): value is RegionRole {
  return KNOWN_ROLES.has(value);
}

/** Validates a `data-region-role` attribute value. */
export function toRegionRole(value: string | undefined): RegionRole {
  return value !== undefined && isKnownRole(value) ? value : 'other';
}

/** Progress changes smaller than this are not repainted or re-emitted. */
export const PROGRESS_EPSILON = 0.002;
