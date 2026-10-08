/** Chart geometry is resolved before scales, annotation layout, and SVG paths. */
import type { FigurePlacement } from '@atlas/core';

export interface ChartDimensions {
  readonly width: number;
  readonly height: number;
}

interface ChartSize {
  readonly w: number;
  readonly h: number;
}

const SIZES: Readonly<Record<FigurePlacement, ChartSize>> = {
  rail: { w: 320, h: 236 },
  inline: { w: 640, h: 360 },
  wide: { w: 900, h: 420 },
};

/** Runtime callers of the exported renderer need not originate in TypeScript. */
function validDimensions(value: unknown): value is ChartDimensions {
  return (
    typeof value === 'object' &&
    value !== null &&
    'width' in value &&
    'height' in value &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    Number.isFinite(value.width) &&
    Number.isFinite(value.height) &&
    value.width >= 320 &&
    value.width <= 1600 &&
    value.height >= 236 &&
    value.height <= 1200
  );
}

/**
 * Invalid optional dimensions recover to the placement's canonical size.
 * Bounds reserve room for labels and prevent unreasonable SVG viewports.
 * Values are geometry inputs rather than CSS transforms, so fonts retain
 * their intended size while the plot and coordinate scales are recomputed.
 */
export function resolveChartSize(placement: FigurePlacement, dimensions?: ChartDimensions): ChartSize {
  if (validDimensions(dimensions)) {
    return { w: dimensions.width, h: dimensions.height };
  }
  return SIZES[placement];
}
