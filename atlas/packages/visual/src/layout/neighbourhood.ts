/**
 * Local neighbourhood graph (UI_UX §13, §73): a constrained semantic layout,
 * never a force simulation. Prerequisites form the left column, dependents the
 * right column, the current node sits between them; siblings (same editorial
 * parent) form rows above and mechanism alternatives rows below. Columns and
 * rows are capped; the overflow collapses into a "+n more" node.
 */
import type { GraphNode, Point, Scene, SceneEdge, SceneGroup, SceneNode } from '@atlas/core';
import { measureNode, NODE_TYPE, round1 } from '../node-geometry.ts';
import { wrapText } from '../text-metrics.ts';

export interface NeighbourhoodInput {
  readonly center: GraphNode;
  readonly prerequisites: readonly GraphNode[];
  readonly dependents: readonly GraphNode[];
  readonly siblings: readonly GraphNode[];
  readonly alternatives: readonly GraphNode[];
}

/** Maximum nodes shown per column or row band before collapsing into "+n more". */
export const NEIGHBOURHOOD_CAP = 8;

const PAD = 16;
const COL_W = 180;
const CENTER_W = 224;
const COL_GAP = 64;
const STACK_GAP = 10;
const ROW_W = 160;
const ROW_GAP = 12;
const ROW_MAX = 4;
const HEADING = 24;
const BAND_GAP = 36;

type Role = 'prerequisites' | 'dependents' | 'siblings' | 'alternatives';

export const NEIGHBOURHOOD_HEADINGS: Readonly<Record<Role, string>> = {
  prerequisites: 'Prerequisites',
  dependents: 'Enables',
  siblings: 'Siblings',
  alternatives: 'Alternatives',
};

function numberTag(node: GraphNode): string | null {
  if (node.number === null) return null;
  switch (node.entityType) {
    case 'section':
      return `§${node.number}`;
    case 'chapter':
      return `Ch ${node.number}`;
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

interface Draft {
  readonly id: string;
  readonly label: string;
  readonly sub: string | null;
  readonly href: string | null;
  readonly width: number;
  readonly height: number;
  readonly emphasis: boolean;
}

function draft(id: string, title: string, sub: string | null, href: string | null, width: number, maxLines: number, emphasis = false): Draft {
  const textW = width - 2 * NODE_TYPE.padX;
  const label = wrapText(title, textW, NODE_TYPE.labelSize, 'sans', maxLines).join(' ');
  const size = measureNode('node', label, sub, textW);
  return { id, label, sub, href, width, height: size.height, emphasis };
}

function capped(role: Role, nodes: readonly GraphNode[], width: number): Draft[] {
  const shown = nodes.length > NEIGHBOURHOOD_CAP ? nodes.slice(0, NEIGHBOURHOOD_CAP - 1) : nodes;
  const drafts = shown.map((node) => draft(`${role}:${node.id}`, node.shortTitle || node.title, numberTag(node), node.url, width, 2));
  if (nodes.length > shown.length) {
    drafts.push(draft(`${role}:more`, `+${nodes.length - shown.length} more`, null, null, width, 1));
  }
  return drafts;
}

function toScene(d: Draft, x: number, y: number): SceneNode {
  return {
    id: d.id,
    kind: 'node',
    label: d.label,
    sub: d.sub,
    x: round1(x),
    y: round1(y),
    width: d.width,
    height: d.height,
    emphasis: d.emphasis,
    group: d.emphasis ? null : d.id.slice(0, d.id.indexOf(':')),
    href: d.href,
  };
}

function dedupe(points: Point[]): Point[] {
  const out: Point[] = [];
  for (const point of points) {
    const last = out.at(-1);
    if (last?.x !== point.x || last.y !== point.y) out.push(point);
  }
  return out;
}

/** Rows of up to ROW_MAX nodes, centred on `cx`, starting at `top` (below a heading). Returns the band height. */
function placeRows(drafts: Draft[], cx: number, top: number, out: SceneNode[]): number {
  let y = top;
  for (let start = 0; start < drafts.length; start += ROW_MAX) {
    const row = drafts.slice(start, start + ROW_MAX);
    const width = row.length * ROW_W + (row.length - 1) * ROW_GAP;
    const height = Math.max(...row.map((d) => d.height));
    row.forEach((d, k) => out.push(toScene(d, cx - width / 2 + k * (ROW_W + ROW_GAP), y)));
    y += height + ROW_GAP;
  }
  return drafts.length === 0 ? 0 : y - top - ROW_GAP;
}

/** Deterministic neighbourhood layout. Node ids are `<role>:<node id>`; the centre keeps its own id. */
export function layoutNeighbourhood(input: NeighbourhoodInput): Scene {
  const pre = capped('prerequisites', input.prerequisites, COL_W);
  const dep = capped('dependents', input.dependents, COL_W);
  const sib = capped('siblings', input.siblings, ROW_W);
  const alt = capped('alternatives', input.alternatives, ROW_W);
  const center = draft(input.center.id, input.center.shortTitle || input.center.title, numberTag(input.center), input.center.url, CENTER_W, 3, true);

  const leftX = PAD;
  const centerX = leftX + COL_W + COL_GAP;
  const rightX = centerX + CENTER_W + COL_GAP;
  const cx = centerX + CENTER_W / 2;
  const bandWidth = rightX + COL_W + PAD;
  const rowsWidth = (drafts: Draft[]): number => {
    const perRow = Math.min(ROW_MAX, drafts.length);
    return perRow * ROW_W + Math.max(0, perRow - 1) * ROW_GAP + 2 * PAD;
  };
  const width = Math.max(bandWidth, rowsWidth(sib), rowsWidth(alt));
  const shift = (width - bandWidth) / 2;

  const nodes: SceneNode[] = [];
  const groups: SceneGroup[] = [];
  let y = PAD;

  // Siblings band (above).
  if (sib.length > 0) {
    const bandTop = y;
    const h = placeRows(sib, cx + shift, bandTop + HEADING, nodes);
    const members = nodes.filter((node) => node.group === 'siblings');
    const minX = Math.min(...members.map((node) => node.x));
    const maxX = Math.max(...members.map((node) => node.x + node.width));
    groups.push({ id: 'siblings', label: NEIGHBOURHOOD_HEADINGS.siblings, x: round1(minX), y: round1(bandTop), width: round1(maxX - minX), height: round1(HEADING + h) });
    y = bandTop + HEADING + h + BAND_GAP;
  }

  // Middle band: columns under headings, centre vertically centred on the taller column.
  const columnHeight = (drafts: Draft[]): number => drafts.reduce((sum, d) => sum + d.height, 0) + Math.max(0, drafts.length - 1) * STACK_GAP;
  const bandTop = y;
  const colTop = bandTop + HEADING;
  const bandInner = Math.max(columnHeight(pre), columnHeight(dep), center.height);
  const centerY = colTop + (bandInner - center.height) / 2;
  const centerNode = toScene(center, centerX + shift, centerY);
  nodes.push(centerNode);
  const cyMid = centerNode.y + centerNode.height / 2;

  const edges: SceneEdge[] = [];
  const placeColumn = (drafts: Draft[], x: number, role: 'prerequisites' | 'dependents'): void => {
    if (drafts.length === 0) return;
    const total = columnHeight(drafts);
    let cursor = colTop + (bandInner - total) / 2;
    const placed: SceneNode[] = [];
    for (const d of drafts) {
      const node = toScene(d, x + shift, cursor);
      placed.push(node);
      nodes.push(node);
      cursor += d.height + STACK_GAP;
    }
    const top = Math.min(...placed.map((node) => node.y));
    const bottom = Math.max(...placed.map((node) => node.y + node.height));
    groups.push({ id: role, label: NEIGHBOURHOOD_HEADINGS[role], x: round1(x + shift), y: round1(Math.min(bandTop, top - HEADING)), width: COL_W, height: round1(bottom - Math.min(bandTop, top - HEADING)) });
    for (const node of placed) {
      if (node.href === null && node.id.endsWith(':more')) continue;
      const mid = round1(node.y + node.height / 2);
      if (role === 'prerequisites') {
        const trunk = round1(node.x + node.width + COL_GAP / 2);
        edges.push({
          id: `edge:${node.id}`,
          from: node.id,
          to: centerNode.id,
          kind: 'flow',
          label: null,
          points: dedupe([
            { x: round1(node.x + node.width), y: mid },
            { x: trunk, y: mid },
            { x: trunk, y: round1(cyMid) },
            { x: round1(centerNode.x), y: round1(cyMid) },
          ]),
          labelAt: null,
        });
      } else {
        const trunk = round1(centerNode.x + centerNode.width + COL_GAP / 2);
        edges.push({
          id: `edge:${node.id}`,
          from: centerNode.id,
          to: node.id,
          kind: 'flow',
          label: null,
          points: dedupe([
            { x: round1(centerNode.x + centerNode.width), y: round1(cyMid) },
            { x: trunk, y: round1(cyMid) },
            { x: trunk, y: mid },
            { x: round1(node.x), y: mid },
          ]),
          labelAt: null,
        });
      }
    }
  };
  placeColumn(pre, leftX, 'prerequisites');
  placeColumn(dep, rightX, 'dependents');
  y = colTop + bandInner + BAND_GAP;

  // Alternatives band (below).
  if (alt.length > 0) {
    const altTop = y;
    const h = placeRows(alt, cx + shift, altTop + HEADING, nodes);
    const members = nodes.filter((node) => node.group === 'alternatives');
    const minX = Math.min(...members.map((node) => node.x));
    const maxX = Math.max(...members.map((node) => node.x + node.width));
    groups.push({ id: 'alternatives', label: NEIGHBOURHOOD_HEADINGS.alternatives, x: round1(minX), y: round1(altTop), width: round1(maxX - minX), height: round1(HEADING + h) });
    y = altTop + HEADING + h + BAND_GAP;
  }

  return { width: Math.ceil(width), height: Math.ceil(y - BAND_GAP + PAD), nodes, edges, groups };
}
