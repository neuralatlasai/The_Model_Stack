/**
 * Runtime schemas for the compiled bundle (`atlas/.atlas/`) — the web app's
 * file trust boundary (engineering standards §6, §16).
 *
 * @atlas/core freezes the TypeScript shapes but ships a zod schema only for
 * the bundle manifest. This module supplies the rest:
 *
 * - `graph.json` and `registry.json` are validated completely (inline content
 *   included), so the parsed values are assignable to the core types without
 *   casts.
 * - Documents are validated at the envelope: schema version, meta, route,
 *   header, region/figure/rail structure, and the discriminant + depth of every
 *   top-level block. Block bodies are compiler output gated by
 *   `DOCUMENT_SCHEMA_VERSION`; a full Block schema belongs in @atlas/core
 *   (requested in the web-shell report) so compiler and web share one contract.
 */
import { z } from 'zod';
import {
  BLOCK_KIND_DEPTH,
  DEPTHS,
  DOMAINS,
  EDITORIAL_STATUSES,
  ENTITY_TYPES,
  EVIDENCE_LABELS,
  FIGURE_KINDS,
  FIGURE_PLACEMENTS,
  LINEAGE_RELATIONS,
  MATURITY_LEVELS,
  RELATION_TYPES,
  STACK_LAYERS,
  isCitationKey,
  isImplId,
  isLabId,
  isNodeId,
  type AtlasGraph,
  type CitationKey,
  type ImplId,
  type Inline,
  type LabId,
  type LinkTarget,
  type NodeId,
  type Registry,
  type TreeNode,
} from '@atlas/core';

// ─── primitives ───────────────────────────────────────────────────────────────

export const nodeIdSchema = z.custom<NodeId>((value) => typeof value === 'string' && isNodeId(value), {
  message: 'not a node id',
});
const citationKeySchema = z.custom<CitationKey>((value) => typeof value === 'string' && isCitationKey(value), {
  message: 'not a citation key',
});
const implIdSchema = z.custom<ImplId>((value) => typeof value === 'string' && isImplId(value), {
  message: 'not an impl id',
});
const labIdSchema = z.custom<LabId>((value) => typeof value === 'string' && isLabId(value), {
  message: 'not a lab id',
});
const XREF_KINDS = ['equation', 'algorithm', 'figure', 'experiment', 'proposition'] as const;

// ─── inline content (recursive) ───────────────────────────────────────────────

const linkTargetSchema: z.ZodType<LinkTarget> = z.discriminatedUnion('type', [
  z.object({ type: z.literal('node'), nodeId: nodeIdSchema, anchor: z.string().nullable(), href: z.string() }),
  z.object({ type: z.literal('external'), href: z.string() }),
  z.object({ type: z.literal('planned'), nodeId: nodeIdSchema, href: z.string() }),
  z.object({ type: z.literal('unresolved'), raw: z.string() }),
]);

export const inlineSchema: z.ZodType<Inline> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('text'), value: z.string() }),
    z.object({ kind: z.literal('emphasis'), children: z.array(inlineSchema) }),
    z.object({ kind: z.literal('strong'), children: z.array(inlineSchema) }),
    z.object({ kind: z.literal('delete'), children: z.array(inlineSchema) }),
    z.object({ kind: z.literal('code'), value: z.string() }),
    z.object({ kind: z.literal('math'), tex: z.string(), html: z.string() }),
    z.object({ kind: z.literal('link'), target: linkTargetSchema, children: z.array(inlineSchema) }),
    z.object({ kind: z.literal('cite'), key: citationKeySchema, resolved: z.boolean() }),
    z.object({ kind: z.literal('label'), label: z.enum(EVIDENCE_LABELS) }),
    z.object({
      kind: z.literal('xref'),
      ref: z.enum(XREF_KINDS),
      number: z.string(),
      text: z.string(),
      target: z.object({ nodeId: nodeIdSchema, anchor: z.string(), href: z.string() }).nullable(),
    }),
    z.object({ kind: z.literal('break') }),
  ]),
);

const inlineList = z.array(inlineSchema);

// ─── graph.json ───────────────────────────────────────────────────────────────

const nodePlanSchema = z.object({
  artifact: z.string().nullable(),
  prerequisitesText: z.string().nullable(),
  outcome: z.string().nullable(),
  sections: z.array(z.object({ id: nodeIdSchema, number: z.string(), title: z.string() })),
});

const graphNodeSchema = z.object({
  id: nodeIdSchema,
  entityType: z.enum(ENTITY_TYPES),
  number: z.string().nullable(),
  title: z.string(),
  shortTitle: z.string(),
  url: z.string(),
  parent: nodeIdSchema.nullable(),
  children: z.array(nodeIdSchema),
  domain: z.enum(DOMAINS),
  hasManuscript: z.boolean(),
  state: z.enum([...EDITORIAL_STATUSES, 'planned']),
  maturity: z.enum(MATURITY_LEVELS).nullable(),
  wordCount: z.number().nonnegative(),
  summary: z.string().nullable(),
  plan: nodePlanSchema.nullable(),
});

const treeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    id: nodeIdSchema,
    number: z.string().nullable(),
    title: z.string(),
    shortTitle: z.string(),
    url: z.string(),
    domain: z.enum(DOMAINS),
    hasManuscript: z.boolean(),
    children: z.array(treeNodeSchema),
  }),
);

const EDGE_TYPES = [...RELATION_TYPES, 'prerequisite', 'downstream', 'related', 'sibling_by_mechanism'] as const;

export const atlasGraphSchema = z.object({
  nodes: z.record(z.string(), graphNodeSchema),
  edges: z.array(z.object({ from: nodeIdSchema, to: nodeIdSchema, type: z.enum(EDGE_TYPES) })),
  external: z.array(z.object({ from: nodeIdSchema, type: z.enum(RELATION_TYPES), target: z.string() })),
  tree: z.array(treeNodeSchema),
  order: z.array(nodeIdSchema),
}) satisfies z.ZodType<AtlasGraph>;

// ─── registry.json ────────────────────────────────────────────────────────────

const surfaceSchema = z.object({ label: z.string(), url: z.string() });
const stackUseSchema = z.object({ nodeId: nodeIdSchema, what: inlineList, sections: z.string(), label: z.string() });

export const registrySchema = z.object({
  references: z.array(
    z.object({
      key: citationKeySchema,
      spine: z.boolean(),
      type: z.string(),
      work: z.string(),
      authors: z.string(),
      venue: z.string(),
      url: z.string().nullable(),
      code: z.string().nullable(),
      status: z.string(),
      uses: z.array(z.object({ chapter: z.number().int(), usedFor: z.string(), accessed: z.string().nullable() })),
      citedBy: z.array(nodeIdSchema),
      atlasUrl: z.string(),
    }),
  ),
  terms: z.array(
    z.object({
      slug: z.string(),
      term: z.string(),
      definition: inlineList,
      owner: nodeIdSchema,
      ownerTitle: z.string(),
      chapter: z.number().int().nullable(),
      url: z.string(),
    }),
  ),
  systems: z.array(
    z.object({
      id: implIdSchema,
      name: z.string(),
      rank: z.number().nullable(),
      layer: z.enum(STACK_LAYERS).nullable(),
      surfaces: z.array(surfaceSchema),
      usedBy: z.array(nodeIdSchema),
      uses: z.array(stackUseSchema),
      atlasUrl: z.string(),
    }),
  ),
  labs: z.array(
    z.object({
      id: labIdSchema,
      name: z.string(),
      rank: z.number().nullable(),
      surfaces: z.array(surfaceSchema),
      uses: z.array(stackUseSchema),
      atlasUrl: z.string(),
    }),
  ),
  lineage: z.array(
    z.object({
      year: z.string(),
      work: z.string(),
      relation: z.enum(LINEAGE_RELATIONS),
      cite: citationKeySchema.nullable(),
      nodeId: nodeIdSchema,
      note: inlineList,
    }),
  ),
  equations: z.array(
    z.object({
      number: z.string(),
      nodeId: nodeIdSchema,
      anchor: z.string(),
      url: z.string(),
      tex: z.string(),
      html: z.string(),
      variables: z.array(z.object({ symbol: z.string(), meaning: z.string() })),
    }),
  ),
  objects: z.array(
    z.object({
      kind: z.enum(['figure', 'algorithm', 'experiment', 'failure-mode', 'open-question', 'definition']),
      label: z.string(),
      title: z.string(),
      nodeId: nodeIdSchema,
      anchor: z.string(),
      url: z.string(),
    }),
  ),
}) satisfies z.ZodType<Registry>;

// ─── documents (envelope) ─────────────────────────────────────────────────────

const blockKindSchema = z.string().refine((kind) => Object.hasOwn(BLOCK_KIND_DEPTH, kind), {
  message: 'unknown block kind',
});
const blockEnvelope = z.looseObject({
  kind: blockKindSchema,
  anchor: z.string().nullable(),
  depth: z.enum(DEPTHS),
});
const routeRefSchema = z.object({ id: nodeIdSchema, title: z.string(), number: z.string().nullable(), url: z.string() });
const RAIL_KINDS = ['figure', 'equations', 'position', 'siblings', 'citations', 'evidence', 'failure-modes', 'terms'] as const;

export const documentEnvelopeSchema = z.looseObject({
  // Not `z.literal(DOCUMENT_SCHEMA_VERSION)`: a mismatch must reach atlas.ts's own
  // check, which throws a friendlier 'schema-version' AtlasBundleError (mirroring
  // the bundle-manifest probe above) instead of a generic schema-validation error.
  schemaVersion: z.unknown(),
  meta: z.looseObject({
    id: nodeIdSchema,
    entityType: z.enum(ENTITY_TYPES),
    title: z.string(),
    shortTitle: z.string(),
    volume: z.number().int().nullable(),
    part: z.number().int().nullable(),
    chapter: z.number().int().nullable(),
    section: z.string().nullable(),
    slug: z.string(),
    parent: nodeIdSchema.nullable(),
    papers: z.array(z.string()),
    implementations: z.array(z.string()),
    maturity: z.enum(MATURITY_LEVELS),
    labelsUsed: z.array(z.enum(EVIDENCE_LABELS)),
    updatedAt: z.string(),
    editorialStatus: z.enum(EDITORIAL_STATUSES),
  }),
  route: z.object({
    url: z.string(),
    breadcrumbs: z.array(routeRefSchema),
    prev: routeRefSchema.nullable(),
    next: routeRefSchema.nullable(),
  }),
  header: z.object({
    identityLine: z.string().nullable(),
    number: z.string().nullable(),
    title: z.string(),
    thesis: inlineList.nullable(),
    metaLine: inlineList.nullable(),
  }),
  lead: z.array(blockEnvelope),
  regions: z.array(
    z.looseObject({
      role: z.string(),
      title: z.string(),
      anchor: z.string(),
      depth: z.enum(DEPTHS),
      blocks: z.array(blockEnvelope),
    }),
  ),
  figures: z.array(
    z.looseObject({
      id: z.string(),
      number: z.string().nullable(),
      anchor: z.string(),
      placement: z.enum(FIGURE_PLACEMENTS),
      regionAnchor: z.string(),
      spec: z.looseObject({ kind: z.enum(FIGURE_KINDS), title: z.string() }),
    }),
  ),
  rail: z.array(
    z.looseObject({
      regionAnchor: z.string(),
      role: z.string(),
      instruments: z.array(z.looseObject({ kind: z.enum(RAIL_KINDS) })),
    }),
  ),
  outline: z.array(z.looseObject({ anchor: z.string(), title: z.string(), role: z.string(), depth: z.enum(DEPTHS) })),
  citations: z.array(citationKeySchema),
  definedTerms: z.array(z.string()),
  linksTo: z.array(nodeIdSchema),
  stats: z.object({
    words: z.number(),
    readingMinutes: z.number(),
    equations: z.number(),
    figures: z.number(),
    algorithms: z.number(),
    experiments: z.number(),
    failureModes: z.number(),
    definitions: z.number(),
    citations: z.number(),
  }),
  sourcePath: z.string(),
  diagnostics: z.array(z.looseObject({ severity: z.enum(['error', 'warning', 'info']), code: z.string() })),
});

/** Formats the first few zod issues as `path: message` lines for build errors. */
export function describeIssues(error: z.ZodError, limit = 5): string {
  return error.issues
    .slice(0, limit)
    .map((issue) => `  ${issue.path.map(String).join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}
