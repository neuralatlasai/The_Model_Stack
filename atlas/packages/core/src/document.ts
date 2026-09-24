/**
 * A compiled research document: one per `docs/` file. H2 headings split the
 * body into regions with a semantic role; regions are the unit of scroll
 * synchronisation (UI_UX §11): the active region drives the tree highlight,
 * the rail instruments, the URL hash, progress, and the minimap.
 */
import type { Block, CompiledFigure } from './blocks.ts';
import type { Depth } from './depth.ts';
import type { Diagnostic } from './diagnostics.ts';
import type { EvidenceLabel } from './evidence.ts';
import type { NodeMeta } from './frontmatter.ts';
import type { CitationKey, NodeId } from './ids.ts';
import type { Inline } from './inline.ts';
import type { Route } from './routes.ts';

/** Section-file H2 roles, in contract order (CONTENT_CONTRACT §4). */
export const SECTION_ROLES = [
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
] as const;
export type SectionRole = (typeof SECTION_ROLES)[number];

/** Chapter-page H2 roles (CONTENT_CONTRACT §3). */
export const CHAPTER_ROLES = [
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
] as const;
export type ChapterRole = (typeof CHAPTER_ROLES)[number];

/** verification.md H2 roles (CONTENT_CONTRACT §13). */
export const VERIFICATION_ROLES = ['artifact-spec', 'verification-task', 'acceptance', 'not-done'] as const;
export type VerificationRole = (typeof VERIFICATION_ROLES)[number];

export type RegionRole = SectionRole | ChapterRole | VerificationRole | 'other';

/** Canonical heading text → role. Matching is case-insensitive on the text before any em dash. */
export const REGION_HEADINGS: Readonly<Record<string, RegionRole>> = {
  scope: 'scope',
  'why this exists': 'why',
  intuition: 'intuition',
  formulation: 'formulation',
  mechanism: 'mechanism',
  algorithm: 'algorithm',
  implementation: 'implementation',
  'experimental design': 'experimental-design',
  observations: 'observations',
  'failure modes': 'failure-modes',
  siblings: 'siblings',
  extensions: 'extensions',
  limitations: 'limitations',
  reproducibility: 'reproducibility',
  references: 'references',
  'why this chapter exists': 'why-chapter',
  'concept map': 'concept-map',
  'position in the book': 'position',
  sections: 'sections',
  artifact: 'artifact',
  verification: 'verification',
  lineage: 'lineage',
  'terms owned here': 'terms',
  'reference-stack coverage': 'stack-coverage',
  'source route': 'source-route',
  status: 'status',
  'artifact specification': 'artifact-spec',
  'verification task': 'verification-task',
  'acceptance criteria': 'acceptance',
  'what this edition did not do': 'not-done',
};

/** Minimum depth per region role; blocks inside take max(region, block-kind) depth. */
export const REGION_ROLE_DEPTH: Readonly<Record<RegionRole, Depth>> = {
  scope: 'overview',
  why: 'overview',
  intuition: 'overview',
  formulation: 'technical',
  mechanism: 'technical',
  algorithm: 'technical',
  implementation: 'implementation',
  'experimental-design': 'research',
  observations: 'research',
  'failure-modes': 'research',
  siblings: 'research',
  extensions: 'research',
  limitations: 'research',
  reproducibility: 'implementation',
  references: 'research',
  'why-chapter': 'overview',
  'concept-map': 'overview',
  position: 'overview',
  sections: 'overview',
  artifact: 'technical',
  verification: 'research',
  lineage: 'overview',
  terms: 'overview',
  'stack-coverage': 'research',
  'source-route': 'research',
  status: 'research',
  'artifact-spec': 'technical',
  'verification-task': 'research',
  acceptance: 'research',
  'not-done': 'research',
  other: 'overview',
};

/** Position of a region in the causal reading loop (UI_UX §78), shown in the minimap. */
export const REGION_ROLE_LABELS: Readonly<Record<RegionRole, string>> = {
  scope: 'Scope',
  why: 'Why this exists',
  intuition: 'Intuition',
  formulation: 'Formulation',
  mechanism: 'Mechanism',
  algorithm: 'Algorithm',
  implementation: 'Implementation',
  'experimental-design': 'Experimental design',
  observations: 'Observations',
  'failure-modes': 'Failure modes',
  siblings: 'Siblings',
  extensions: 'Extensions',
  limitations: 'Limitations',
  reproducibility: 'Reproducibility',
  references: 'References',
  'why-chapter': 'Why this chapter exists',
  'concept-map': 'Concept map',
  position: 'Position in the book',
  sections: 'Sections',
  artifact: 'Artifact',
  verification: 'Verification',
  lineage: 'Lineage',
  terms: 'Terms owned here',
  'stack-coverage': 'Reference-stack coverage',
  'source-route': 'Source route',
  status: 'Status',
  'artifact-spec': 'Artifact specification',
  'verification-task': 'Verification task',
  acceptance: 'Acceptance criteria',
  'not-done': 'What this edition did not do',
  other: '',
};

export interface Region {
  readonly role: RegionRole;
  /** Heading text as written. */
  readonly title: string;
  /** Fragment id, unique within the document (`formulation`, `why-this-exists`). */
  readonly anchor: string;
  readonly depth: Depth;
  readonly blocks: readonly Block[];
}

/** Minimap markers (UI_UX §12). */
export type OutlineMarkerType =
  | 'equation'
  | 'figure'
  | 'algorithm'
  | 'experiment'
  | 'code'
  | 'failure-mode'
  | 'open-question'
  | 'definition'
  | 'claim';

export interface OutlineMarker {
  readonly type: OutlineMarkerType;
  readonly anchor: string;
  /** Short label: `Eq. 5.4`, `Alg. 5.2`, `Fig. 5.3`, failure-mode name. */
  readonly label: string;
}

export interface OutlineEntry {
  readonly anchor: string;
  readonly title: string;
  readonly role: RegionRole;
  readonly depth: Depth;
  readonly markers: readonly OutlineMarker[];
  /** H3 sub-headings (experiments, sub-arguments) for the minimap's second level. */
  readonly children: readonly { readonly anchor: string; readonly title: string }[];
}

/**
 * Context-rail instrument (UI_UX §10). At most three are active per region.
 * Authored rail figures take priority; the compiler fills remaining slots
 * with derived instruments appropriate to the region role.
 */
export type RailInstrument =
  | { readonly kind: 'figure'; readonly figureId: CompiledFigure['id'] }
  /** Variable inspector for the equations of the region. */
  | { readonly kind: 'equations'; readonly anchors: readonly string[] }
  /** Where-am-I: prerequisites · siblings · downstream of the current node. */
  | { readonly kind: 'position' }
  /** Differential sibling strip (siblings region). */
  | { readonly kind: 'siblings'; readonly anchors: readonly string[] }
  /** Citation stack for the citations made inside the region. */
  | { readonly kind: 'citations'; readonly keys: readonly CitationKey[] }
  /** Evidence profile: label counts for the region (observations / claims). */
  | { readonly kind: 'evidence'; readonly counts: Readonly<Partial<Record<EvidenceLabel, number>>> }
  /** Failure-mode index for the region. */
  | { readonly kind: 'failure-modes'; readonly anchors: readonly string[] }
  /** Glossary terms defined in the region. */
  | { readonly kind: 'terms'; readonly slugs: readonly string[] };

export type RailInstrumentKind = RailInstrument['kind'];

export const MAX_RAIL_INSTRUMENTS = 3;

export interface RailBinding {
  readonly regionAnchor: string;
  readonly role: RegionRole;
  readonly instruments: readonly RailInstrument[];
}

/** Compact chapter header anatomy (UI_UX §9, CONTENT_CONTRACT §3 items 1–4). */
export interface DocumentHeader {
  /** `VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 05`, or null for sections (derived from breadcrumbs instead). */
  readonly identityLine: string | null;
  /** `05`, `5.2`, `A`; null for front matter. */
  readonly number: string | null;
  readonly title: string;
  /** One-sentence thesis (chapters) or the Scope objective sentence (sections). */
  readonly thesis: readonly Inline[] | null;
  /** `6 sections · 2 spine papers · …` */
  readonly metaLine: readonly Inline[] | null;
}

export interface DocumentStats {
  readonly words: number;
  readonly readingMinutes: number;
  readonly equations: number;
  readonly figures: number;
  readonly algorithms: number;
  readonly experiments: number;
  readonly failureModes: number;
  readonly definitions: number;
  readonly citations: number;
}

export const DOCUMENT_SCHEMA_VERSION = 1;

export interface ResearchDocument {
  readonly schemaVersion: typeof DOCUMENT_SCHEMA_VERSION;
  readonly meta: NodeMeta;
  readonly route: Route;
  readonly header: DocumentHeader;
  /** Blocks before the first H2 that are not part of the header anatomy. */
  readonly lead: readonly Block[];
  readonly regions: readonly Region[];
  /** Every figure in document order (inline, wide, and rail). */
  readonly figures: readonly CompiledFigure[];
  readonly rail: readonly RailBinding[];
  readonly outline: readonly OutlineEntry[];
  /** Citation keys in order of first appearance. */
  readonly citations: readonly CitationKey[];
  /** Glossary slugs defined in this document. */
  readonly definedTerms: readonly string[];
  /** Nodes linked from the body (for backlinks). */
  readonly linksTo: readonly NodeId[];
  readonly stats: DocumentStats;
  /** Path relative to `docs/`, forward slashes. */
  readonly sourcePath: string;
  readonly diagnostics: readonly Diagnostic[];
}
