/**
 * Canonical research entities (UI_UX §19, §22, §67): papers, glossary terms,
 * systems, labs, lineage. Bibliographic text lives once in the registry;
 * documents refer to it by key (paper_id → metadata, claim → paper_id).
 */
import type { Block } from './blocks.ts';
import type { CitationKey, ImplId, LabId, NodeId } from './ids.ts';
import type { Inline } from './inline.ts';
import type { LineageRelation } from './visual-spec.ts';

export const REFERENCE_TYPES = [
  'paper',
  'technical report',
  'documentation',
  'repository',
  'dataset card',
  'model card',
  'course',
  'measurement source',
] as const;
export type ReferenceType = (typeof REFERENCE_TYPES)[number];

export const REFERENCE_STATUSES = ['peer-reviewed', 'preprint', 'official documentation', 'archived', 'UNVERIFIED'] as const;
export type ReferenceStatus = (typeof REFERENCE_STATUSES)[number];

export interface ReferenceUse {
  /** The chapter references file the record appears in. */
  readonly chapter: number;
  /** The "Used for" cell for that chapter. */
  readonly usedFor: string;
  readonly accessed: string | null;
}

/** One work, merged across every chapter's references.md that lists it. */
export interface ReferenceRecord {
  readonly key: CitationKey;
  readonly spine: boolean;
  /** Known type, or the raw cell text when the author used a non-canonical type (diagnosed). */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- known values documented; raw author text accepted and diagnosed
  readonly type: ReferenceType | string;
  readonly work: string;
  readonly authors: string;
  readonly venue: string;
  readonly url: string | null;
  readonly code: string | null;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- known values documented; raw author text accepted and diagnosed
  readonly status: ReferenceStatus | string;
  readonly uses: readonly ReferenceUse[];
  /** Nodes whose body cites the key, in reading order. */
  readonly citedBy: readonly NodeId[];
  /** Atlas page for the paper object (`/papers/p19/`). */
  readonly atlasUrl: string;
}

export interface GlossaryTerm {
  readonly slug: string;
  readonly term: string;
  readonly definition: readonly Inline[];
  /** The one node that owns the definition (CONTENT_CONTRACT §3 item 12). */
  readonly owner: NodeId;
  readonly ownerTitle: string;
  readonly chapter: number | null;
  /** Owner URL + `#term-<slug>`. */
  readonly url: string;
}

/** AI_REFERENCE_STACK.md §4.1 stack layers. */
export const STACK_LAYERS = [
  'Accelerator / driver / compiler',
  'Kernels / numerics / collectives',
  'Model / autograd framework',
  'Distributed training',
  'Model definition / adaptation',
  'Post-training / RL',
  'Inference engine',
  'Serving / portable runtime',
] as const;
export type StackLayer = (typeof STACK_LAYERS)[number];

/** What a chapter takes from a stack entry (from its Reference-stack coverage table). */
export interface StackUse {
  readonly nodeId: NodeId;
  readonly what: readonly Inline[];
  readonly sections: string;
  readonly label: string;
}

export interface SystemEntity {
  readonly id: ImplId;
  /** Exact name as written in AI_REFERENCE_STACK.md §4. */
  readonly name: string;
  readonly rank: number | null;
  readonly layer: StackLayer | null;
  /** Docs / code URLs exactly as listed in the reference stack. */
  readonly surfaces: readonly { readonly label: string; readonly url: string }[];
  /** Nodes that list the id in `implementations`. */
  readonly usedBy: readonly NodeId[];
  readonly uses: readonly StackUse[];
  readonly atlasUrl: string;
}

export interface LabEntity {
  readonly id: LabId;
  /** Exact name as written in AI_REFERENCE_STACK.md §1. */
  readonly name: string;
  readonly rank: number | null;
  readonly surfaces: readonly { readonly label: string; readonly url: string }[];
  readonly uses: readonly StackUse[];
  readonly atlasUrl: string;
}

/** A dated lineage entry from a chapter's Lineage list; the Timeline view aggregates them. */
export interface LineageEntry {
  readonly year: string;
  readonly work: string;
  readonly relation: LineageRelation;
  readonly cite: CitationKey | null;
  readonly nodeId: NodeId;
  readonly note: readonly Inline[];
}

export interface EquationIndexEntry {
  readonly number: string;
  readonly nodeId: NodeId;
  readonly anchor: string;
  readonly url: string;
  readonly tex: string;
  readonly html: string;
  readonly variables: readonly { readonly symbol: string; readonly meaning: string }[];
}

export interface ObjectIndexEntry {
  readonly kind: 'figure' | 'algorithm' | 'experiment' | 'failure-mode' | 'open-question' | 'definition';
  readonly label: string;
  readonly title: string;
  readonly nodeId: NodeId;
  readonly anchor: string;
  readonly url: string;
}

export interface Registry {
  readonly references: readonly ReferenceRecord[];
  readonly terms: readonly GlossaryTerm[];
  readonly systems: readonly SystemEntity[];
  readonly labs: readonly LabEntity[];
  readonly lineage: readonly LineageEntry[];
  readonly equations: readonly EquationIndexEntry[];
  readonly objects: readonly ObjectIndexEntry[];
}

/** Blocks shown when a reference or term is inspected in the rail. */
export interface InspectorPayload {
  readonly title: string;
  readonly blocks: readonly Block[];
}
