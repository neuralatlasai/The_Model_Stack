/**
 * Search contract (UI_UX §32). Deterministic lexical retrieval over typed
 * objects; results always carry their object type. The compiler builds a
 * MiniSearch index with `SEARCH_INDEX_OPTIONS`; the client loads it lazily on
 * the first ⌘K / Ctrl-K with the same options (MiniSearch requires identical
 * options for `loadJSON`).
 */

export const SEARCH_KINDS = [
  'volume',
  'part',
  'chapter',
  'section',
  'term',
  'paper',
  'equation',
  'algorithm',
  'figure',
  'experiment',
  'failure-mode',
  'open-question',
  'system',
  'lab',
  'appendix',
  'front-matter',
] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

/** Type line shown on each result (`CONCEPT · Inference / KV Cache`). */
export const SEARCH_KIND_LABELS: Readonly<Record<SearchKind, string>> = {
  volume: 'VOLUME',
  part: 'PART',
  chapter: 'CHAPTER',
  section: 'CONCEPT',
  term: 'TERM',
  paper: 'PAPER',
  equation: 'EQUATION',
  algorithm: 'ALGORITHM',
  figure: 'FIGURE',
  experiment: 'EXPERIMENT',
  'failure-mode': 'FAILURE MODE',
  'open-question': 'OPEN QUESTION',
  system: 'SYSTEM',
  lab: 'LAB',
  appendix: 'APPENDIX',
  'front-matter': 'REFERENCE',
};

export interface SearchDoc {
  /** Unique across the index: `node:ms.section.5.2`, `paper:P19`, `eq:5.4`, `term:kv-cache`. */
  readonly id: string;
  readonly kind: SearchKind;
  readonly title: string;
  /** Hierarchy context, e.g. `Foundations / Minimal Transformer`. */
  readonly context: string;
  readonly url: string;
  /** Indexed body text, truncated by the compiler (≤ 1,200 chars). */
  readonly body: string;
  /** Extra tokens: numbers (`5.4`), keys (`P19`), symbols, aliases. */
  readonly keywords: string;
}

/** Shared MiniSearch options. Kept as plain data so core has no MiniSearch dependency. */
export const SEARCH_INDEX_OPTIONS = {
  idField: 'id',
  fields: ['title', 'keywords', 'context', 'body'],
  storeFields: ['kind', 'title', 'context', 'url'],
  searchOptions: {
    boost: { title: 4, keywords: 3, context: 1.5, body: 1 },
    prefix: true,
    fuzzy: 0.15,
  },
} as const;

export interface SearchHit {
  readonly id: string;
  readonly kind: SearchKind;
  readonly title: string;
  readonly context: string;
  readonly url: string;
  readonly score: number;
}
