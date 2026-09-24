/**
 * Internal types of the project layer. Public output types live in @atlas/core;
 * these describe intermediate state between pipeline stages.
 */
import type { CompiledBody } from '../markdown/contract.ts';
import type {
  AtlasGraph,
  BundleManifest,
  Diagnostic,
  EntityType,
  NodeId,
  NodeMeta,
  NodePlan,
  Registry,
  ResearchDocument,
  SearchDoc,
} from '@atlas/core';

/** A docs/ file whose frontmatter validated. */
export interface SourceDoc {
  /** Relative to docs/, posix. */
  readonly path: string;
  readonly meta: NodeMeta;
  readonly body: string;
  readonly bodyStartLine: number;
  /** Full file text (registries re-parse references tables from it). */
  readonly text: string;
}

/**
 * One node of the editorial hierarchy: every manifest node, the two index
 * pages, the front-matter group, and any extra document. Structure (parent,
 * children, order) comes from the manifest; titles prefer the document.
 */
export interface NodeRecord {
  readonly id: NodeId;
  readonly entityType: EntityType;
  readonly title: string;
  readonly shortTitle: string;
  readonly slug: string;
  /** Display number (`II`, `V`, `05`, `5.2`, `A`) or null. */
  readonly number: string | null;
  readonly url: string;
  readonly parent: NodeId | null;
  readonly children: readonly NodeId[];
  readonly volume: number | null;
  readonly part: number | null;
  readonly chapter: number | null;
  /** Docs-relative path of the node's file (from the manifest or the document), or null for virtual nodes. */
  readonly path: string | null;
  readonly doc: SourceDoc | null;
  readonly plan: NodePlan | null;
}

export interface NodeTable {
  readonly nodes: ReadonlyMap<NodeId, NodeRecord>;
  /** Linear reading order of every node (planned included). */
  readonly order: readonly NodeId[];
  /** Docs-relative `.md` path → node id (manifest paths and actual document paths). */
  readonly pathIndex: ReadonlyMap<string, NodeId>;
  readonly diagnostics: readonly Diagnostic[];
}

/** Everything `compileAtlas` produces, in memory. `writeBundle` serialises it. */
export interface CompiledAtlas {
  readonly manifest: BundleManifest;
  /** Compiled documents in reading order. */
  readonly documents: readonly ResearchDocument[];
  readonly graph: AtlasGraph;
  readonly registry: Registry;
  readonly searchDocs: readonly SearchDoc[];
  /** Serialised MiniSearch index (`JSON.stringify(miniSearch)`), loadable with `SEARCH_INDEX_OPTIONS`. */
  readonly searchIndex: string;
  /** Project diagnostics plus every document's diagnostics, sorted (severity, file, line). */
  readonly diagnostics: readonly Diagnostic[];
}

/** A compiled body paired with its source, before assembly into a ResearchDocument. */
export interface CompiledSource {
  readonly source: SourceDoc;
  readonly body: CompiledBody;
}
