/**
 * Depth control (UI_UX §29): one document, four cumulative visibility layers.
 * A block is visible when its depth rank ≤ the reader's selected depth rank.
 * The selection lives in the URL (`?depth=`) and on `<html data-depth>`.
 */

export const DEPTHS = ['overview', 'technical', 'research', 'implementation'] as const;
export type Depth = (typeof DEPTHS)[number];

export const DEFAULT_DEPTH: Depth = 'implementation';

export const DEPTH_LABELS: Readonly<Record<Depth, string>> = {
  overview: 'Overview',
  technical: 'Technical',
  research: 'Research',
  implementation: 'Implementation',
};

export const DEPTH_DESCRIPTIONS: Readonly<Record<Depth, string>> = {
  overview: 'Narrative, intuition, principal diagrams',
  technical: 'Adds equations, derivations, algorithms',
  research: 'Adds experiments, observations, siblings, failure modes, citations',
  implementation: 'Adds code, systems traces, implementation and reproducibility detail',
};

export function depthRank(depth: Depth): number {
  return DEPTHS.indexOf(depth);
}

/** The deeper of two depths (a block inherits at least its region's depth). */
export function maxDepth(a: Depth, b: Depth): Depth {
  return depthRank(a) >= depthRank(b) ? a : b;
}

export function isDepth(value: string): value is Depth {
  return (DEPTHS as readonly string[]).includes(value);
}

/** Parses `?depth=` at the URL trust boundary; unknown values fall back to the default. */
export function parseDepth(value: string | null | undefined): Depth {
  return value !== null && value !== undefined && isDepth(value) ? value : DEFAULT_DEPTH;
}
