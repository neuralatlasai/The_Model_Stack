/**
 * Fragment anchors. Every anchor in a compiled document (regions, headings,
 * equations, figures, terms, failure modes, …) is claimed through one
 * registry so that anchors are unique within the document and deterministic
 * across compiles of the same source.
 */

/**
 * Lower-case ASCII slug with hyphens: `Why this exists` → `why-this-exists`,
 * `Attention score matrix (S)` → `attention-score-matrix-s`. Diacritics are
 * folded; everything that is not `[a-z0-9]` collapses to one hyphen. Returns
 * the empty string when nothing survives (callers supply a fallback).
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/['’]/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

export interface AnchorRegistry {
  /**
   * Claims `base` (or `base-2`, `base-3`, … when taken) and returns the anchor
   * actually claimed. An empty base falls back to `fallback`.
   */
  readonly claim: (base: string, fallback?: string) => string;
  readonly has: (anchor: string) => boolean;
}

export function createAnchorRegistry(): AnchorRegistry {
  const taken = new Set<string>();
  return {
    claim: (base, fallback = 'x') => {
      const root = base === '' ? fallback : base;
      let candidate = root;
      for (let n = 2; taken.has(candidate); n += 1) candidate = `${root}-${n}`;
      taken.add(candidate);
      return candidate;
    },
    has: (anchor) => taken.has(anchor),
  };
}
