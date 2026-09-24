/**
 * View models for research objects whose markup needs light preparation:
 * algorithm line groups, claim provenance, experiment numbering. Pure.
 */
import type { AlgorithmBlock, AlgorithmLine, CitationKey, ClaimSource } from '@atlas/core';
import { derivedEquation } from './url.ts';

export interface AlgorithmRow {
  /** Line number as written, or null for lines before the first numbered line. */
  readonly n: number | null;
  /** Fragment id `alg-5-2-L3` so prose can link and highlight the line; null when unnumbered or the block has no anchor. */
  readonly id: string | null;
  /** The numbered line followed by its unnumbered continuation lines. */
  readonly lines: readonly AlgorithmLine[];
}

/** Groups continuation lines under the numbered line they continue. */
export function algorithmRows(block: Pick<AlgorithmBlock, 'anchor' | 'lines'>): AlgorithmRow[] {
  const rows: { n: number | null; id: string | null; lines: AlgorithmLine[] }[] = [];
  for (const line of block.lines) {
    const current = rows.at(-1);
    if (line.n === null && current !== undefined) {
      current.lines.push(line);
      continue;
    }
    const id = line.n !== null && block.anchor !== null ? `${block.anchor}-L${line.n}` : null;
    rows.push({ n: line.n, id, lines: [line] });
  }
  return rows;
}

/** Leading indentation preserved as spaces; the code column is `white-space: pre`. */
export function indented(line: AlgorithmLine): string {
  return `${' '.repeat(Math.max(0, Math.min(line.indent, 40)))}${line.code}`;
}

export type ProvenanceItem =
  | { readonly type: 'cite'; readonly key: CitationKey }
  | { readonly type: 'equation'; readonly number: string; readonly anchor: string }
  | { readonly type: 'doc'; readonly id: string }
  | { readonly type: 'text'; readonly text: string };

/** Claim source → what the provenance line shows (cite link, derivation equation, documentation id, or text). */
export function provenanceItem(source: ClaimSource): ProvenanceItem {
  if (source.key !== null) return { type: 'cite', key: source.key };
  if (source.type === 'derived') {
    const equation = derivedEquation(source.raw);
    if (equation !== null) return { type: 'equation', ...equation };
  }
  if (source.type === 'official-doc') {
    const id = source.raw.replace(/^OD:\s*/iu, '');
    return { type: 'doc', id };
  }
  return { type: 'text', text: source.raw };
}

/**
 * Shortens text to at most `max` characters (ellipsis included), cutting at
 * the last space when that keeps at least half the budget, else mid-word.
 */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/gu, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  const kept = space >= Math.floor(max / 2) ? cut.slice(0, space) : cut;
  return `${kept.replace(/[\s,;:.—-]+$/u, '')}…`;
}
