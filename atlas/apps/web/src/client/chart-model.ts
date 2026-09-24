/**
 * Pure logic for chart inspection (UI_UX §42: hover gives precise values,
 * clicking a legend entry isolates a series, nothing animates). Points carry
 * their data coordinates (x, y) and their position in SVG user units
 * (px, py). Unit-tested.
 */
import { formatValue, VALUE_FORMATS, type ValueFormat } from '@atlas/core';

export interface PlotPoint {
  readonly series: string;
  readonly x: number;
  readonly y: number;
  readonly px: number;
  readonly py: number;
  /** Display value of x as rendered (`data-xv`: formatted value or bar category), else null. */
  readonly xText: string | null;
  /** Display value of y as rendered (`data-yv`), else null. */
  readonly yText: string | null;
}

/** `x`: nearest in x then y (line, step, area, bar); `xy`: Euclidean (scatter). */
export type PickMode = 'x' | 'xy';

/**
 * Index of the point nearest to (px, py) among visible series (`visible` null = all).
 * Returns -1 when there is no candidate.
 */
export function nearestPoint(points: readonly PlotPoint[], px: number, py: number, mode: PickMode, visible: ReadonlySet<string> | null): number {
  let best = -1;
  let bestPrimary = Number.POSITIVE_INFINITY;
  let bestSecondary = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    if (visible !== null && !visible.has(point.series)) return;
    const dx = Math.abs(point.px - px);
    const dy = Math.abs(point.py - py);
    const primary = mode === 'x' ? dx : Math.hypot(dx, dy);
    const secondary = mode === 'x' ? dy : 0;
    if (primary < bestPrimary - 1e-9 || (Math.abs(primary - bestPrimary) <= 1e-9 && secondary < bestSecondary)) {
      best = index;
      bestPrimary = primary;
      bestSecondary = secondary;
    }
  });
  return best;
}

/** Next/previous point of the same series in x order; stays put at the ends. */
export function stepInSeries(points: readonly PlotPoint[], index: number, direction: 1 | -1): number {
  const current = points[index];
  if (current === undefined) return index;
  const ordered = seriesPoints(points, current.series);
  const position = ordered.indexOf(index);
  const next = ordered[position + direction];
  return next ?? index;
}

/** First or last point (x order) of the current point's series. */
export function edgeOfSeries(points: readonly PlotPoint[], index: number, edge: 'first' | 'last'): number {
  const current = points[index];
  if (current === undefined) return index;
  const ordered = seriesPoints(points, current.series);
  return (edge === 'first' ? ordered[0] : ordered[ordered.length - 1]) ?? index;
}

/** The point with the nearest x in the next/previous visible series (series order as given). */
export function switchSeries(
  points: readonly PlotPoint[],
  index: number,
  direction: 1 | -1,
  order: readonly string[],
  visible: ReadonlySet<string> | null,
): number {
  const current = points[index];
  if (current === undefined) return index;
  const candidates = order.filter((series) => visible === null || visible.has(series));
  const position = candidates.indexOf(current.series);
  const target = candidates[position + direction];
  if (target === undefined) return index;
  let best = index;
  let bestDistance = Number.POSITIVE_INFINITY;
  points.forEach((point, candidate) => {
    if (point.series !== target) return;
    const distance = Math.abs(point.px - current.px);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  });
  return best;
}

function seriesPoints(points: readonly PlotPoint[], series: string): number[] {
  return points
    .map((point, index) => ({ point, index }))
    .filter((entry) => entry.point.series === series)
    .sort((a, b) => a.point.px - b.point.px)
    .map((entry) => entry.index);
}

const FORMATS: ReadonlySet<string> = new Set<string>(VALUE_FORMATS);

function isValueFormat(value: string): value is ValueFormat {
  return FORMATS.has(value);
}

/** Validates a `data-x-format` / `data-y-format` attribute; unknown → `raw`. */
export function parseFormat(value: string | null): ValueFormat {
  return value !== null && isValueFormat(value) ? value : 'raw';
}

/** Parses a numeric data attribute; null for anything that is not a finite number. */
export function parseNumber(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export interface ReadoutAxes {
  readonly xFormat: ValueFormat;
  readonly yFormat: ValueFormat;
  readonly xLabel: string | null;
  readonly yLabel: string | null;
}

/** `scores B·H·T²·b — sequence length T 8.19 K · bytes per layer 4 GiB`. */
export function readoutText(seriesLabel: string, point: PlotPoint, axes: ReadoutAxes): string {
  const x = point.xText ?? formatValue(point.x, axes.xFormat);
  const y = point.yText ?? formatValue(point.y, axes.yFormat);
  const xPart = axes.xLabel === null ? x : `${axes.xLabel} ${x}`;
  const yPart = axes.yLabel === null ? y : `${axes.yLabel} ${y}`;
  return `${seriesLabel} — ${xPart} · ${yPart}`;
}

/** Legend isolation: clicking the isolated series again restores all; otherwise isolate the clicked one. */
export function toggleIsolation(isolated: string | null, clicked: string): string | null {
  return isolated === clicked ? null : clicked;
}
