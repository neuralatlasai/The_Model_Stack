/**
 * Knowledge graph (UI_UX §1, §13, §73): one GraphNode per manifest node and
 * compiled document (planned nodes included, flagged), typed edges from the
 * frontmatter dependency lists and node-targeted relations, external
 * relations for everything else, the editorial tree, and the reading order.
 */
import {
  diagnostic,
  domainOfPart,
  inlineToText,
  isNodeId,
  type AtlasGraph,
  type Diagnostic,
  type EdgeType,
  type ExternalRelation,
  type GraphEdge,
  type GraphNode,
  type NodeId,
  type ResearchDocument,
  type TreeNode,
} from '@atlas/core';
import { APPENDICES_ID, FRONT_MATTER_GROUP_ID, ROOT_ID } from '../project/nodes.ts';
import { truncate } from '../project/text.ts';
import type { NodeRecord, NodeTable } from '../project/types.ts';

export const SUMMARY_MAX = 280;

function summaryOf(doc: ResearchDocument | undefined): string | null {
  const thesis = doc?.header.thesis ?? null;
  if (thesis === null) return null;
  const text = inlineToText(thesis).trim();
  return text === '' ? null : truncate(text, SUMMARY_MAX);
}

function graphNode(node: NodeRecord, doc: ResearchDocument | undefined): GraphNode {
  return {
    id: node.id,
    entityType: node.entityType,
    number: node.number,
    title: node.title,
    shortTitle: node.shortTitle,
    url: node.url,
    parent: node.parent,
    children: node.children,
    domain: domainOfPart(node.part),
    hasManuscript: doc !== undefined,
    state: doc === undefined ? 'planned' : doc.meta.editorialStatus,
    maturity: doc?.meta.maturity ?? null,
    wordCount: doc?.stats.words ?? 0,
    summary: summaryOf(doc),
    plan: node.plan,
  };
}

export function buildGraph(table: NodeTable, documents: ReadonlyMap<NodeId, ResearchDocument>): { graph: AtlasGraph; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const nodes: Record<string, GraphNode> = {};
  for (const id of table.order) {
    const node = table.nodes.get(id);
    if (node !== undefined) nodes[id] = graphNode(node, documents.get(id));
  }

  const edges: GraphEdge[] = [];
  const external: ExternalRelation[] = [];
  const edgeKeys = new Set<string>();
  const externalKeys = new Set<string>();

  const addEdge = (doc: ResearchDocument, to: NodeId, type: EdgeType, field: string): void => {
    if (to === doc.meta.id) return;
    if (!table.nodes.has(to)) {
      diagnostics.push(
        diagnostic('manifest-unknown-node', `${field} target ${to} is not a node of the manifest or docs/`, {
          file: doc.sourcePath,
          line: 2,
          nodeId: doc.meta.id,
        }),
      );
      return;
    }
    const key = `${doc.meta.id}|${to}|${type}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push({ from: doc.meta.id, to, type });
  };

  for (const id of table.order) {
    const doc = documents.get(id);
    if (doc === undefined) continue;
    const meta = doc.meta;
    for (const target of meta.prerequisites) addEdge(doc, target, 'prerequisite', 'prerequisites');
    for (const target of meta.downstream) addEdge(doc, target, 'downstream', 'downstream');
    for (const target of meta.related) addEdge(doc, target, 'related', 'related');
    for (const target of meta.siblingsByMechanism) addEdge(doc, target, 'sibling_by_mechanism', 'siblings_by_mechanism');
    for (const relation of meta.relations) {
      if (isNodeId(relation.target)) {
        addEdge(doc, relation.target, relation.type, `relations[${relation.type}]`);
        continue;
      }
      const key = `${meta.id}|${relation.type}|${relation.target}`;
      if (externalKeys.has(key)) continue;
      externalKeys.add(key);
      external.push({ from: meta.id, type: relation.type, target: relation.target });
    }
  }

  const treeOf = (id: NodeId, seen: ReadonlySet<NodeId>): TreeNode | null => {
    const node = table.nodes.get(id);
    if (node === undefined || seen.has(id)) return null;
    const nextSeen = new Set(seen).add(id);
    const children: TreeNode[] = [];
    for (const childId of node.children) {
      const child = table.nodes.get(childId);
      if (child === undefined) continue;
      // Chapter satellites (verification, references) appear only once written.
      if ((child.entityType === 'verification' || child.entityType === 'references') && child.doc === null) continue;
      const subtree = treeOf(childId, nextSeen);
      if (subtree !== null) children.push(subtree);
    }
    return {
      id: node.id,
      number: node.number,
      title: node.title,
      shortTitle: node.shortTitle,
      url: node.url,
      domain: domainOfPart(node.part),
      hasManuscript: node.doc !== null,
      children,
    };
  };

  const root = table.nodes.get(ROOT_ID);
  const topLevel = (root?.children ?? []).filter((id) => id !== FRONT_MATTER_GROUP_ID && id !== APPENDICES_ID);
  const tree: TreeNode[] = [];
  for (const id of [...topLevel, FRONT_MATTER_GROUP_ID, APPENDICES_ID]) {
    const subtree = treeOf(id, new Set([ROOT_ID]));
    if (subtree !== null) tree.push(subtree);
  }

  return { graph: { nodes, edges, external, tree, order: [...table.order] }, diagnostics };
}
