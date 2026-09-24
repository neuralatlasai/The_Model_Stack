/**
 * The knowledge graph: the editorial tree (Volume → Part → Chapter → Section)
 * plus typed concept relations from frontmatter. Views never render the whole
 * graph; they render a node's local neighbourhood (UI_UX §73).
 */
import type { EditorialStatus, Maturity, RelationType } from './frontmatter.ts';
import type { EntityType, NodeId } from './ids.ts';

/** Research domain of a part; drives the domain accent (UI_UX §46) for identifiers, edges, and active states only. */
export const DOMAINS = [
  'foundations',
  'data',
  'architecture',
  'training',
  'hardware',
  'post-training',
  'inference',
  'serving',
  'agents',
  'embodied',
  'evaluation',
  'reference',
] as const;
export type DomainKey = (typeof DOMAINS)[number];

export const PART_DOMAINS: Readonly<Record<number, DomainKey>> = {
  1: 'foundations',
  2: 'data',
  3: 'architecture',
  4: 'training',
  5: 'hardware',
  6: 'post-training',
  7: 'inference',
  8: 'serving',
  9: 'agents',
  10: 'embodied',
  11: 'evaluation',
};

export const DOMAIN_LABELS: Readonly<Record<DomainKey, string>> = {
  foundations: 'Foundations',
  data: 'Data',
  architecture: 'Architecture',
  training: 'Training',
  hardware: 'Hardware & kernels',
  'post-training': 'Post-training & RL',
  inference: 'Inference algorithms',
  serving: 'Serving',
  agents: 'Agents & retrieval',
  embodied: 'Multimodal & embodied',
  evaluation: 'Evaluation & assurance',
  reference: 'Reference',
};

export function domainOfPart(part: number | null): DomainKey {
  return part === null ? 'reference' : (PART_DOMAINS[part] ?? 'reference');
}

export type NodeState = EditorialStatus | 'planned';

export interface GraphNode {
  readonly id: NodeId;
  readonly entityType: EntityType;
  /** `"05"` for chapters, `"5.2"` for sections, `"II"` for volumes, `"V"` for parts, `"A"` for appendices. */
  readonly number: string | null;
  readonly title: string;
  readonly shortTitle: string;
  readonly url: string;
  readonly parent: NodeId | null;
  readonly children: readonly NodeId[];
  readonly domain: DomainKey;
  /** false when the manifest lists the node but no manuscript file exists yet. */
  readonly hasManuscript: boolean;
  readonly state: NodeState;
  readonly maturity: Maturity | null;
  readonly wordCount: number;
  /** One-sentence summary (chapter thesis / section scope objective) for hover previews, or null. */
  readonly summary: string | null;
  /** Plan data from `docs/atlas-manifest.json` (chapters and parts); shown on planned-node pages instead of placeholder text. */
  readonly plan: NodePlan | null;
}

export interface NodePlan {
  /** Chapter artifact as specified in book_plan.md. */
  readonly artifact: string | null;
  /** Chapter prerequisites as written in the plan ("graduate-level ML and software engineering"). */
  readonly prerequisitesText: string | null;
  /** Part outcome. */
  readonly outcome: string | null;
  /** Planned section titles in order (chapters only). */
  readonly sections: readonly { readonly id: NodeId; readonly number: string; readonly title: string }[];
}

/** Node-to-node edge types: frontmatter relations plus the dependency lists. */
export type EdgeType = RelationType | 'prerequisite' | 'downstream' | 'related' | 'sibling_by_mechanism';

export interface GraphEdge {
  readonly from: NodeId;
  readonly to: NodeId;
  readonly type: EdgeType;
}

/** A relation whose target is not a node (paper., impl., concept., experiment., …). */
export interface ExternalRelation {
  readonly from: NodeId;
  readonly type: RelationType;
  readonly target: string;
}

export interface TreeNode {
  readonly id: NodeId;
  readonly number: string | null;
  readonly title: string;
  readonly shortTitle: string;
  readonly url: string;
  readonly domain: DomainKey;
  readonly hasManuscript: boolean;
  readonly children: readonly TreeNode[];
}

export interface AtlasGraph {
  readonly nodes: Readonly<Record<string, GraphNode>>;
  readonly edges: readonly GraphEdge[];
  readonly external: readonly ExternalRelation[];
  /** Volumes, then front matter and appendices. */
  readonly tree: readonly TreeNode[];
  /** Linear reading order of every node with a URL. */
  readonly order: readonly NodeId[];
}

export interface Neighbourhood {
  readonly node: GraphNode;
  readonly ancestors: readonly GraphNode[];
  readonly children: readonly GraphNode[];
  /** Same editorial parent, excluding the node. */
  readonly siblings: readonly GraphNode[];
  readonly prerequisites: readonly GraphNode[];
  /** Declared downstream plus nodes that list this node as a prerequisite. */
  readonly dependents: readonly GraphNode[];
  readonly related: readonly GraphNode[];
  /** Concept-level alternatives (`siblings_by_mechanism`). */
  readonly alternatives: readonly GraphNode[];
}

/**
 * Local neighbourhood of a node. Pure; deduplicated; order-preserving.
 * Returns null when the id is not in the graph.
 */
export function neighbourhood(graph: AtlasGraph, id: NodeId): Neighbourhood | null {
  const node = graph.nodes[id];
  if (node === undefined) return null;

  const get = (nodeId: NodeId): GraphNode | undefined => graph.nodes[nodeId];
  const collect = (ids: Iterable<NodeId>): GraphNode[] => {
    const seen = new Set<NodeId>();
    const out: GraphNode[] = [];
    for (const nodeId of ids) {
      if (nodeId === id || seen.has(nodeId)) continue;
      seen.add(nodeId);
      const found = get(nodeId);
      if (found !== undefined) out.push(found);
    }
    return out;
  };

  const ancestors: GraphNode[] = [];
  for (let cursor = node.parent; cursor !== null; ) {
    const parent = get(cursor);
    if (parent === undefined) break;
    ancestors.unshift(parent);
    cursor = parent.parent;
  }

  const outgoing = (type: GraphEdge['type']): NodeId[] =>
    graph.edges.filter((edge) => edge.from === id && edge.type === type).map((edge) => edge.to);
  const incoming = (type: GraphEdge['type']): NodeId[] =>
    graph.edges.filter((edge) => edge.to === id && edge.type === type).map((edge) => edge.from);

  const parentNode = node.parent === null ? undefined : get(node.parent);

  return {
    node,
    ancestors,
    children: collect(node.children),
    siblings: collect(parentNode?.children ?? []),
    prerequisites: collect(outgoing('prerequisite')),
    dependents: collect([...outgoing('downstream'), ...incoming('prerequisite')]),
    related: collect([...outgoing('related'), ...incoming('related'), ...outgoing('trades_off_with')]),
    alternatives: collect([...outgoing('sibling_by_mechanism'), ...incoming('sibling_by_mechanism')]),
  };
}
