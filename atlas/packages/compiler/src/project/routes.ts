/**
 * Routes (UI_UX §34, §61): URL, breadcrumbs along the editorial parent chain
 * (the atlas index itself is the home link, not a crumb), and prev/next along
 * the reading order restricted to nodes that have a manuscript.
 */
import type { Crumb, NodeId, Route, RouteRef } from '@atlas/core';
import { ROOT_ID } from './nodes.ts';
import type { NodeRecord, NodeTable } from './types.ts';

export function crumbOf(node: NodeRecord): Crumb {
  return { id: node.id, title: node.shortTitle, number: node.number, url: node.url };
}

export function refOf(node: NodeRecord): RouteRef {
  return { id: node.id, title: node.title, number: node.number, url: node.url };
}

/** Root-most first; excludes the node itself and the atlas index. Cycle-safe. */
export function breadcrumbsOf(table: NodeTable, id: NodeId): Crumb[] {
  const crumbs: Crumb[] = [];
  const seen = new Set<NodeId>([id]);
  let cursor = table.nodes.get(id)?.parent ?? null;
  while (cursor !== null && cursor !== ROOT_ID && !seen.has(cursor)) {
    seen.add(cursor);
    const node = table.nodes.get(cursor);
    if (node === undefined) break;
    crumbs.unshift(crumbOf(node));
    cursor = node.parent;
  }
  return crumbs;
}

/** Reading order restricted to nodes with a manuscript. */
export function manuscriptOrder(table: NodeTable): NodeId[] {
  return table.order.filter((id) => {
    const node = table.nodes.get(id);
    return node !== undefined && node.doc !== null;
  });
}

/** Route for every node that has a manuscript. */
export function buildRoutes(table: NodeTable): Map<NodeId, Route> {
  const readable = manuscriptOrder(table);
  const routes = new Map<NodeId, Route>();
  readable.forEach((id, index) => {
    const node = table.nodes.get(id);
    if (node === undefined) return;
    const prevId = index > 0 ? readable[index - 1] : undefined;
    const nextId = readable[index + 1];
    const prevNode = prevId === undefined ? undefined : table.nodes.get(prevId);
    const nextNode = nextId === undefined ? undefined : table.nodes.get(nextId);
    routes.set(id, {
      url: node.url,
      breadcrumbs: breadcrumbsOf(table, id),
      prev: prevNode === undefined ? null : refOf(prevNode),
      next: nextNode === undefined ? null : refOf(nextNode),
    });
  });
  return routes;
}
