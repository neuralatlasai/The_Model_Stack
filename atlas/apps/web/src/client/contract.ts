/**
 * Local adapter of the core DOM contract for the eager client chunk.
 *
 * Why it exists: @atlas/core is one barrel whose modules construct zod
 * schemas at the top level and whose package does not declare
 * `"sideEffects": false`, so *any* runtime import from it pulls zod classic
 * plus every schema into the bundle (~26–32 KB min+gz measured with the
 * installed Vite/rolldown), which alone exhausts the 30 KB budget of
 * main.ts. The eager chunk therefore takes the contract constants from here;
 * zod-dependent work (storage reads, PageData) runs in lazily loaded chunks
 * that import @atlas/core directly.
 *
 * Drift is impossible to miss: every constant is typed as `typeof` the core
 * export (type-only imports are erased, so they cost nothing at runtime) and
 * tests/unit/contract.test.ts asserts deep equality with the real core values.
 * Requested core change (see the web-client report): declare
 * `"sideEffects": false` and mark top-level schema constructions
 * `/*#__PURE__*\/`, after which this file can be deleted.
 */
import type {
  ATTR as CORE_ATTR,
  DEPTH_DESCRIPTIONS as CORE_DEPTH_DESCRIPTIONS,
  DEPTH_LABELS as CORE_DEPTH_LABELS,
  DEPTHS as CORE_DEPTHS,
  Depth,
  EVENTS as CORE_EVENTS,
  NodeId,
  READING_THRESHOLD as CORE_READING_THRESHOLD,
  RegionRole,
  STORAGE_KEYS as CORE_STORAGE_KEYS,
} from '@atlas/core';

export const ATTR: typeof CORE_ATTR = {
  depth: 'data-depth',
  theme: 'data-theme',
  nodeId: 'data-node-id',
  region: 'data-region',
  regionRole: 'data-region-role',
  depthMin: 'data-depth-min',
  railFor: 'data-rail-for',
  railInstrument: 'data-instrument',
  treeNode: 'data-tree-node',
  cite: 'data-cite',
  term: 'data-term',
  xref: 'data-xref',
  linkNode: 'data-node',
  figure: 'data-figure',
  figureKind: 'data-figure-kind',
  dim: 'data-dim',
  eqVar: 'data-eq-var',
  specRef: 'data-spec-ref',
  minimap: 'data-minimap',
  progress: 'data-progress',
};

export const EVENTS: typeof CORE_EVENTS = {
  activeRegion: 'atlas:active-region',
  depth: 'atlas:depth',
  inspect: 'atlas:inspect',
};

export const STORAGE_KEYS: typeof CORE_STORAGE_KEYS = {
  depth: 'atlas.depth.v1',
  theme: 'atlas.theme.v1',
  progress: 'atlas.progress.v1',
  bookmarks: 'atlas.bookmarks.v1',
  recent: 'atlas.recent.v1',
  treeExpanded: 'atlas.tree-expanded.v1',
};

export const READING_THRESHOLD: typeof CORE_READING_THRESHOLD = 0.28;

export const DEPTHS: typeof CORE_DEPTHS = ['overview', 'technical', 'research', 'implementation'];

export const DEFAULT_DEPTH: Depth = 'implementation';

export const DEPTH_LABELS: typeof CORE_DEPTH_LABELS = {
  overview: 'Overview',
  technical: 'Technical',
  research: 'Research',
  implementation: 'Implementation',
};

export const DEPTH_DESCRIPTIONS: typeof CORE_DEPTH_DESCRIPTIONS = {
  overview: 'Narrative, intuition, principal diagrams',
  technical: 'Adds equations, derivations, algorithms',
  research: 'Adds experiments, observations, siblings, failure modes, citations',
  implementation: 'Adds code, systems traces, implementation and reproducibility detail',
};

export function isDepth(value: string): value is Depth {
  return (DEPTHS as readonly string[]).includes(value);
}

/** Every region role except `other` (SECTION_ROLES, CHAPTER_ROLES, VERIFICATION_ROLES in core). */
export const REGION_ROLES = [
  'scope',
  'why',
  'intuition',
  'formulation',
  'mechanism',
  'algorithm',
  'implementation',
  'experimental-design',
  'observations',
  'failure-modes',
  'siblings',
  'extensions',
  'limitations',
  'reproducibility',
  'references',
  'why-chapter',
  'concept-map',
  'position',
  'sections',
  'artifact',
  'verification',
  'lineage',
  'terms',
  'stack-coverage',
  'source-route',
  'status',
  'artifact-spec',
  'verification-task',
  'acceptance',
  'not-done',
] as const satisfies readonly RegionRole[];

/** Compile-time completeness: a role added to core but missing here is a type error. */
type MissingRoles = Exclude<Exclude<RegionRole, 'other'>, (typeof REGION_ROLES)[number]>;
export const REGION_ROLES_COMPLETE: [MissingRoles] extends [never] ? true : MissingRoles = true;

// Same grammar as core ids.ts NODE_ID_PATTERNS (checked against core parseNodeId in the contract test).
const NODE_ID =
  /^ms\.(?:volume\.[1-9]\d*|part\.[1-9]\d*|chapter\.[1-9]\d*|section\.[1-9]\d*\.[1-9]\d*|verification\.[1-9]\d*|references\.[1-9]\d*|appendix\.[a-z]|frontmatter(?:\.[a-z][a-z0-9-]*)?|root|appendices)$/u;

function isNodeId(value: string): value is NodeId {
  return NODE_ID.test(value);
}

/** Parses a node id at a trust boundary (a DOM attribute); null when it is not one. */
export function parseNodeId(value: unknown): NodeId | null {
  return typeof value === 'string' && isNodeId(value) ? value : null;
}

/** `objectAnchor('eq', '5.4')` → `eq-5-4` (core ids.ts). */
export function objectAnchor(prefix: 'eq' | 'alg' | 'fig' | 'exp' | 'prop' | 'tbl', number: string): string {
  return `${prefix}-${number.replaceAll('.', '-')}`;
}
