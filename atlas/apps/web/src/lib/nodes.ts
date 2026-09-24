/**
 * Graph helpers for the shell: ancestry, identity lines, tree expansion
 * state, and ordered node lists. Pure functions over the compiled AtlasGraph.
 */
import type { AtlasGraph, DomainKey, GraphNode, NodeId, TreeNode } from '@atlas/core';

export function nodeOf(graph: AtlasGraph, id: NodeId | null | undefined): GraphNode | null {
  if (id === null || id === undefined) return null;
  return graph.nodes[id] ?? null;
}

/** Root → parent (excludes the node itself). Stops at a missing or cyclic parent. */
export function ancestorsOf(graph: AtlasGraph, id: NodeId): GraphNode[] {
  const out: GraphNode[] = [];
  const seen = new Set<NodeId>([id]);
  let cursor = graph.nodes[id]?.parent ?? null;
  while (cursor !== null && !seen.has(cursor)) {
    seen.add(cursor);
    const parent = graph.nodes[cursor];
    if (parent === undefined) break;
    out.unshift(parent);
    cursor = parent.parent;
  }
  return out;
}

export function childrenOf(graph: AtlasGraph, node: GraphNode): GraphNode[] {
  return node.children.map((id) => graph.nodes[id]).filter((child): child is GraphNode => child !== undefined);
}

/** Nodes of one entity type in reading order (graph.order), falling back to insertion order for unordered nodes. */
export function nodesOfType(graph: AtlasGraph, type: GraphNode['entityType']): GraphNode[] {
  const ordered: GraphNode[] = [];
  const seen = new Set<NodeId>();
  for (const id of graph.order) {
    const node = graph.nodes[id];
    if (node?.entityType === type && !seen.has(id)) {
      ordered.push(node);
      seen.add(id);
    }
  }
  for (const node of Object.values(graph.nodes)) {
    if (node.entityType === type && !seen.has(node.id)) ordered.push(node);
  }
  return ordered;
}

/** `VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 05` style line for pages without a compiled header. */
export function identityLine(graph: AtlasGraph, node: GraphNode): string {
  const segments: string[] = [];
  for (const item of [...ancestorsOf(graph, node.id), node]) {
    switch (item.entityType) {
      case 'volume':
        segments.push(`VOLUME ${item.number ?? ''}`.trim());
        break;
      case 'part':
        segments.push(`PART ${item.number ?? ''} — ${item.title.toUpperCase()}`.trim());
        break;
      case 'chapter':
        segments.push(`CHAPTER ${item.number ?? ''}`.trim());
        break;
      case 'section':
        segments.push(`SECTION ${item.number ?? ''}`.trim());
        break;
      case 'appendix':
        segments.push(`APPENDIX ${item.number ?? ''}`.trim());
        break;
      case 'verification':
        segments.push('VERIFICATION');
        break;
      case 'references':
        segments.push('REFERENCES');
        break;
      case 'frontmatter':
        break;
    }
  }
  return segments.join(' / ');
}

export function domainOf(graph: AtlasGraph, id: NodeId | null): DomainKey {
  return nodeOf(graph, id)?.domain ?? 'reference';
}

export interface TreeState {
  /** Nodes whose children are shown. */
  readonly expanded: ReadonlySet<NodeId>;
  /** Ancestors of the current node plus the node (the active branch). */
  readonly activePath: ReadonlySet<NodeId>;
  readonly currentId: NodeId | null;
}

/**
 * Server-side expansion (UI_UX §5): the active branch is expanded and its
 * ancestors stay visible; unrelated branches collapse. With no current node,
 * the volumes open to show their parts.
 */
export function treeState(graph: AtlasGraph, currentId: NodeId | null): TreeState {
  const activePath = new Set<NodeId>();
  const expanded = new Set<NodeId>();
  if (currentId !== null && graph.nodes[currentId] !== undefined) {
    for (const ancestor of ancestorsOf(graph, currentId)) {
      activePath.add(ancestor.id);
      expanded.add(ancestor.id);
    }
    activePath.add(currentId);
    if (graph.nodes[currentId].children.length > 0) expanded.add(currentId);
  } else {
    for (const root of graph.tree) {
      if (graph.nodes[root.id]?.entityType === 'volume') expanded.add(root.id);
    }
  }
  return { expanded, activePath, currentId: currentId !== null && graph.nodes[currentId] !== undefined ? currentId : null };
}

/** Depth-first search of the tree for a node (used to locate roving-tabindex focus). */
export function treeContains(nodes: readonly TreeNode[], id: NodeId): boolean {
  for (const node of nodes) {
    if (node.id === id || treeContains(node.children, id)) return true;
  }
  return false;
}

/** Previous and next nodes along the linear reading order (graph.order). */
export function orderNeighbours(graph: AtlasGraph, id: NodeId): { prev: GraphNode | null; next: GraphNode | null } {
  const index = graph.order.indexOf(id);
  if (index === -1) return { prev: null, next: null };
  const prevId = index > 0 ? graph.order[index - 1] : undefined;
  const nextId = graph.order[index + 1];
  return { prev: nodeOf(graph, prevId), next: nodeOf(graph, nextId) };
}

/** Nearest ancestor (or the node itself) of a given entity type. */
export function enclosing(graph: AtlasGraph, id: NodeId, type: GraphNode['entityType']): GraphNode | null {
  const self = graph.nodes[id];
  if (self?.entityType === type) return self;
  return ancestorsOf(graph, id).find((node) => node.entityType === type) ?? null;
}

/** Number prefix shown before titles: `05`, `5.2`, `II`, `A`. */
export function numberLabel(node: Pick<GraphNode, 'number'>): string {
  return node.number ?? '';
}
