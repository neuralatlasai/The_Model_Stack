/**
 * DOM contract between server-rendered markup (apps/web components) and the
 * client controllers (apps/web islands/client). Attribute names and event
 * names live here so neither side hard-codes strings.
 *
 * Reading state persisted in localStorage is a trust boundary (UI_UX §62):
 * every stored value has a zod schema and is parsed on read; a failed parse
 * discards the value.
 */
import { z } from 'zod';
import { DEPTHS, type Depth } from './depth.ts';
import type { RegionRole } from './document.ts';
import type { NodeId } from './ids.ts';

export const ATTR = {
  /** On <html>: selected depth. */
  depth: 'data-depth',
  /** On <html>: `light` | `dark` | absent (system). */
  theme: 'data-theme',
  /** On <article>: the node id being read. */
  nodeId: 'data-node-id',
  /** On each region <section>: its anchor. */
  region: 'data-region',
  regionRole: 'data-region-role',
  /** On any block: minimum depth at which it is visible. */
  depthMin: 'data-depth-min',
  /** On a rail instrument group: the region anchor it serves. */
  railFor: 'data-rail-for',
  railInstrument: 'data-instrument',
  /** On a tree item: its node id. */
  treeNode: 'data-tree-node',
  /** On citation triggers: the citation key. */
  cite: 'data-cite',
  /** On glossary term triggers: the term slug. */
  term: 'data-term',
  /** On cross-reference links: `equation:5.4`. */
  xref: 'data-xref',
  /** On internal links into the atlas: the target node id (link preview card). */
  linkNode: 'data-node',
  figure: 'data-figure',
  figureKind: 'data-figure-kind',
  /** On a tensor dimension token: its symbol; hovering highlights the same symbol everywhere in the figure. */
  dim: 'data-dim',
  /** On an equation variable row: its symbol. */
  eqVar: 'data-eq-var',
  /** On interactive figure hosts: id of the <script type="application/json"> holding the spec. */
  specRef: 'data-spec-ref',
  minimap: 'data-minimap',
  progress: 'data-progress',
} as const;

export const EVENTS = {
  /** Fired on `document` when the region crossing the reading threshold changes. */
  activeRegion: 'atlas:active-region',
  /** Fired on `document` when the depth selection changes. */
  depth: 'atlas:depth',
  /** Request the rail inspector to show an object; the reader stays anchored. */
  inspect: 'atlas:inspect',
} as const;

export interface ActiveRegionDetail {
  readonly nodeId: NodeId;
  readonly anchor: string;
  readonly role: RegionRole;
  /** Fraction of the document read, 0..1. */
  readonly progress: number;
}

export interface DepthDetail {
  readonly depth: Depth;
}

export type InspectTarget =
  | { readonly type: 'paper'; readonly key: string }
  | { readonly type: 'term'; readonly slug: string }
  | { readonly type: 'equation'; readonly number: string }
  | { readonly type: 'node'; readonly id: NodeId };

/** Reading-threshold line as a fraction of viewport height (a region is active once its top crosses it). */
export const READING_THRESHOLD = 0.28;

// ─── per-page data island ────────────────────────────────────────────────────

/** id of the `<script type="application/json">` element each reading page embeds. */
export const PAGE_DATA_ELEMENT_ID = 'atlas-page-data';

const refEntry = z
  .object({
    key: z.string().max(12),
    type: z.string().max(40),
    work: z.string().max(400),
    authors: z.string().max(600),
    venue: z.string().max(200),
    url: z.string().max(600).nullable(),
    code: z.string().max(600).nullable(),
    status: z.string().max(40),
    /** "Used for" text of the current chapter's references.md row. */
    usedFor: z.string().max(1200),
    atlasUrl: z.string().max(200),
  })
  .strict();

const routeRef = z.object({ id: z.string().max(60), title: z.string().max(200), number: z.string().max(12).nullable(), url: z.string().max(400) }).strict();

/**
 * Preview card for an atlas node the page links to (a chapter, section,
 * verification or references page): hovering an internal link shows where it
 * leads, whether it is written, and how it sits in the dependency graph.
 */
const nodeCard = z
  .object({
    id: z.string().max(60),
    /** Entity type (`chapter`, `section`, `part`, …). */
    entity: z.string().max(24),
    number: z.string().max(12).nullable(),
    title: z.string().max(300),
    url: z.string().max(400),
    written: z.boolean(),
    summary: z.string().max(600).nullable(),
    /** The enclosing chapter or part (`05 Minimal Transformer`, `Part I — Scientific foundations`). */
    within: z.string().max(200).nullable(),
    /** Direct prerequisite / dependent chapter counts (chapters only; 0 otherwise). */
    prerequisites: z.number().int().min(0).max(999),
    dependents: z.number().int().min(0).max(999),
    /** The chapter's sections in order, `w` written / `p` planned (a chapter's own; a section's parent chapter's). */
    sections: z.string().regex(/^[wp]{0,99}$/u),
    /** For a section: its 1-based position among the chapter's sections; null otherwise. */
    sectionPosition: z.number().int().min(1).max(99).nullable(),
  })
  .strict();

export type NodeCard = z.output<typeof nodeCard>;

/**
 * Only what the client needs for the current page: inspector payloads for the
 * references, terms, and equations the page mentions, plus its neighbourhood.
 * Parsed with zod on read (the DOM is a trust boundary like any other input).
 */
export const PageDataSchema = z
  .object({
    nodeId: z.string().max(60),
    url: z.string().max(400),
    title: z.string().max(300),
    regions: z.array(z.object({ anchor: z.string().max(120), role: z.string().max(40), title: z.string().max(200) }).strict()).max(60),
    references: z.record(z.string().max(12), refEntry),
    terms: z.record(
      z.string().max(120),
      z.object({ term: z.string().max(200), definition: z.string().max(1200), url: z.string().max(400), ownerTitle: z.string().max(200) }).strict(),
    ),
    equations: z.record(
      z.string().max(12),
      z
        .object({
          number: z.string().max(12),
          anchor: z.string().max(60),
          url: z.string().max(400),
          /** Trusted KaTeX output from the compiler. */
          html: z.string().max(60000),
          variables: z.array(z.object({ symbol: z.string().max(60), meaning: z.string().max(300) }).strict()).max(40),
        })
        .strict(),
    ),
    neighbours: z
      .object({ prerequisites: z.array(routeRef).max(40), dependents: z.array(routeRef).max(60), siblings: z.array(routeRef).max(40) })
      .strict(),
    /** Preview cards for the atlas nodes this page links to, keyed by node id. */
    nodes: z.record(z.string().max(60), nodeCard).default({}),
  })
  .strict();

export type PageData = z.output<typeof PageDataSchema>;

// ─── persisted reading state ─────────────────────────────────────────────────

export const STORAGE_KEYS = {
  depth: 'atlas.depth.v1',
  theme: 'atlas.theme.v1',
  progress: 'atlas.progress.v1',
  bookmarks: 'atlas.bookmarks.v1',
  recent: 'atlas.recent.v1',
  treeExpanded: 'atlas.tree-expanded.v1',
} as const;

export const StoredDepthSchema = z.enum(DEPTHS);
export const StoredThemeSchema = z.enum(['light', 'dark', 'system']);

/** Per-node reading progress: furthest fraction reached and last active region. */
export const StoredProgressSchema = z.record(
  z.string(),
  z.object({ max: z.number().min(0).max(1), anchor: z.string().max(120), at: z.string().max(40) }).strict(),
);

/** Saved objects keep their surrounding context (UI_UX §63): node, anchor, title, and a text excerpt. */
export const StoredBookmarksSchema = z
  .array(
    z
      .object({
        kind: z.enum(['node', 'region', 'equation', 'figure', 'paper', 'term', 'open-question']),
        nodeId: z.string().max(60),
        anchor: z.string().max(120).nullable(),
        title: z.string().max(200),
        context: z.string().max(400),
        url: z.string().max(400),
        at: z.string().max(40),
      })
      .strict(),
  )
  .max(500);

export const StoredRecentSchema = z.array(z.object({ nodeId: z.string().max(60), url: z.string().max(400), title: z.string().max(200) }).strict()).max(30);

export const StoredTreeExpandedSchema = z.array(z.string().max(60)).max(400);

export type StoredProgress = z.output<typeof StoredProgressSchema>;
export type StoredBookmarks = z.output<typeof StoredBookmarksSchema>;
export type StoredRecent = z.output<typeof StoredRecentSchema>;
