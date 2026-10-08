/**
 * Model for a node's Map page (pages/graph/[...slug].astro): the constrained
 * neighbourhood as four groups around the node — prerequisites (left),
 * dependents (right), siblings (above), mechanism alternatives (below) — plus
 * the text twin's relation groups. Pure functions over core graph nodes, so
 * the page and its tests share one definition of tags, caps, and order.
 */
import type { DomainKey, GraphNode, Neighbourhood } from '@atlas/core';
import { mapUrl } from './urls.ts';

/** Nodes drawn per group before the rest collapse into "+n more" (a link to the text twin). */
export const MAP_CAP = 8;

export type MapRole = 'prerequisites' | 'dependents' | 'siblings' | 'alternatives' | 'children' | 'related';

export const MAP_ROLE_LABELS: Readonly<Record<MapRole, string>> = {
  prerequisites: 'Prerequisites',
  dependents: 'Enables',
  siblings: 'Siblings',
  alternatives: 'Alternatives',
  children: 'Contains',
  related: 'Related',
};

/** One-line notes for the text twin (helper labels stay short). */
export const MAP_ROLE_NOTES: Readonly<Record<MapRole, string>> = {
  prerequisites: 'Read these first',
  dependents: 'Builds directly on this node',
  siblings: 'Same editorial parent',
  alternatives: 'Same problem, another mechanism',
  children: 'Editorial children',
  related: 'Trade-offs and contrasts',
};

export interface MapItem {
  readonly id: string;
  /** Short mono tag: `02` (chapter), `§1.2` (section), `Part I`, `App A`; null for unnumbered nodes. */
  readonly tag: string | null;
  readonly title: string;
  readonly short: string;
  readonly url: string;
  readonly map: string;
  readonly written: boolean;
  readonly summary: string | null;
  readonly domain: DomainKey;
  readonly kind: string;
}

export interface MapGroup {
  readonly role: MapRole;
  readonly label: string;
  readonly items: readonly MapItem[];
  /** Items beyond the cap (drawn as "+n more"). */
  readonly more: number;
}

export function nodeTag(node: Pick<GraphNode, 'entityType' | 'number'>): string | null {
  if (node.number === null) return null;
  switch (node.entityType) {
    case 'section':
      return `§${node.number}`;
    case 'part':
      return `Part ${node.number}`;
    case 'volume':
      return `Vol ${node.number}`;
    case 'appendix':
      return `App ${node.number}`;
    default:
      return node.number;
  }
}

/** Human kind for the readout: "chapter", "section", "front matter", … */
export function nodeKind(node: Pick<GraphNode, 'entityType'>): string {
  switch (node.entityType) {
    case 'frontmatter':
      return 'front matter';
    default:
      return node.entityType;
  }
}

export function mapItem(node: GraphNode): MapItem {
  return {
    id: node.id,
    tag: nodeTag(node),
    title: node.title,
    short: node.shortTitle || node.title,
    url: node.url,
    map: mapUrl(node.url),
    written: node.hasManuscript,
    summary:
      node.summary ??
      (node.plan?.artifact === null || node.plan?.artifact === undefined
        ? null
        : `Planned artifact: ${node.plan.artifact}`),
    domain: node.domain,
    kind: nodeKind(node),
  };
}

export function mapGroup(role: MapRole, nodes: readonly GraphNode[], cap: number = MAP_CAP): MapGroup {
  const shown = nodes.length > cap ? nodes.slice(0, cap - 1) : nodes;
  return { role, label: MAP_ROLE_LABELS[role], items: shown.map(mapItem), more: nodes.length - shown.length };
}

export interface NeighbourhoodMap {
  readonly center: MapItem;
  readonly prerequisites: MapGroup;
  readonly dependents: MapGroup;
  readonly siblings: MapGroup;
  readonly alternatives: MapGroup;
  /** Every relation group, uncapped, in reading order, empty groups dropped: the text twin. */
  readonly twin: readonly MapGroup[];
}

export function neighbourhoodMap(hood: Neighbourhood, cap: number = MAP_CAP): NeighbourhoodMap {
  const twinOrder: readonly [MapRole, readonly GraphNode[]][] = [
    ['prerequisites', hood.prerequisites],
    ['dependents', hood.dependents],
    ['alternatives', hood.alternatives],
    ['siblings', hood.siblings],
    ['children', hood.children],
    ['related', hood.related],
  ];
  return {
    center: mapItem(hood.node),
    prerequisites: mapGroup('prerequisites', hood.prerequisites, cap),
    dependents: mapGroup('dependents', hood.dependents, cap),
    siblings: mapGroup('siblings', hood.siblings, cap + 4),
    alternatives: mapGroup('alternatives', hood.alternatives, cap),
    twin: twinOrder
      .filter(([, nodes]) => nodes.length > 0)
      .map(([role, nodes]) => mapGroup(role, nodes, Number.POSITIVE_INFINITY)),
  };
}

/** The identity line without the part title's repeated "Part N —" prefix ("PART I — PART I — SCIENTIFIC …"). */
export function tidyIdentity(line: string): string {
  return line.replace(/PART ([IVXLC]+) — PART \1 — /gu, 'PART $1 — ');
}
