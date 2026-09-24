/**
 * `diagram` layout: ELK layered (Sugiyama) with orthogonal routing, groups as
 * compound nodes (VISUAL_GRAMMAR §5.1, §3.3). Node boxes are sized from the
 * same text metrics the renderer uses. Output coordinates are absolute and
 * rounded to 0.1 px so the Scene JSON is byte-stable across runs.
 */
import type { DiagramSpec, EdgeKind, Point, Scene, SceneEdge, SceneGroup, SceneNode } from '@atlas/core';
import { measureNode, round1 } from '../node-geometry.ts';
import { textWidth } from '../text-metrics.ts';
import { elk, type ElkExtendedEdge, type ElkNode } from './elk.ts';

export const EDGE_LABEL_FONT = 11;
const EDGE_LABEL_HEIGHT = 14;
const GROUP_LABEL_FONT = 11.5;
const GROUP_LABEL_HEIGHT = 16;
const PADDING = 16;

function rootOptions(direction: DiagramSpec['direction']): Record<string, string> {
  return {
    'elk.algorithm': 'layered',
    'elk.direction': direction === 'LR' ? 'RIGHT' : 'DOWN',
    'elk.edgeRouting': 'ORTHOGONAL',
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    'elk.randomSeed': '1',
    'elk.padding': `[top=${PADDING},left=${PADDING},bottom=${PADDING},right=${PADDING}]`,
    'elk.spacing.nodeNode': '22',
    'elk.spacing.edgeNode': '14',
    'elk.spacing.edgeEdge': '9',
    'elk.spacing.edgeLabel': '3',
    'elk.spacing.componentComponent': '28',
    'elk.layered.spacing.nodeNodeBetweenLayers': '44',
    'elk.layered.spacing.edgeNodeBetweenLayers': '16',
    'elk.layered.spacing.edgeEdgeBetweenLayers': '9',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
    'elk.layered.mergeEdges': 'false',
    'elk.edgeLabels.placement': 'CENTER',
    'elk.edgeLabels.inline': 'false',
  };
}

interface Abs {
  readonly x: number;
  readonly y: number;
}

/** Lays out a diagram spec. Deterministic: identical input yields identical Scene JSON. */
export async function layoutDiagram(spec: DiagramSpec): Promise<Scene> {
  const measured = new Map(spec.nodes.map((node) => [node.id, measureNode(node.kind, node.label, node.sub ?? null)]));
  const groupIds = new Set(spec.groups.map((group) => group.id));
  const leaf = (id: string): ElkNode => {
    const size = measured.get(id);
    return { id, width: size?.width ?? 80, height: size?.height ?? 32 };
  };

  // Root children in model order; a group's compound node sits where its first member appears.
  const children: ElkNode[] = [];
  const placedGroups = new Set<string>();
  for (const node of spec.nodes) {
    const group = node.group !== undefined && groupIds.has(node.group) ? node.group : null;
    if (group === null) {
      children.push(leaf(node.id));
      continue;
    }
    if (placedGroups.has(group)) continue;
    placedGroups.add(group);
    const label = spec.groups.find((entry) => entry.id === group)?.label ?? group;
    const labelWidth = Math.ceil(textWidth(label.toUpperCase(), GROUP_LABEL_FONT, 'sans') * 1.1) + 24;
    children.push({
      id: `group:${group}`,
      layoutOptions: {
        'elk.padding': `[top=${GROUP_LABEL_HEIGHT + 14},left=14,bottom=14,right=14]`,
        'elk.nodeSize.constraints': 'MINIMUM_SIZE',
        'elk.nodeSize.minimum': `(${labelWidth}, 40)`,
      },
      children: spec.nodes.filter((member) => member.group === group).map((member) => leaf(member.id)),
    });
  }

  const edges: ElkExtendedEdge[] = spec.edges.map((edge, index) => ({
    id: `e${index}`,
    sources: [edge.from],
    targets: [edge.to],
    ...(edge.label === undefined || edge.label === ''
      ? {}
      : { labels: [{ id: `e${index}:label`, text: edge.label, width: Math.ceil(textWidth(edge.label, EDGE_LABEL_FONT, 'mono')) + 8, height: EDGE_LABEL_HEIGHT }] }),
  }));

  const graph: ElkNode = { id: 'root', layoutOptions: rootOptions(spec.direction), children, edges };
  const result = await elk().layout(graph);

  // Absolute origin of every node (compound or leaf).
  const origin = new Map<string, Abs>([['root', { x: 0, y: 0 }]]);
  const boxes = new Map<string, { x: number; y: number; width: number; height: number }>();
  const walk = (node: ElkNode, parent: Abs): void => {
    for (const child of node.children ?? []) {
      const abs = { x: parent.x + (child.x ?? 0), y: parent.y + (child.y ?? 0) };
      origin.set(child.id, abs);
      boxes.set(child.id, { ...abs, width: child.width ?? 0, height: child.height ?? 0 });
      walk(child, abs);
    }
  };
  walk(result, { x: 0, y: 0 });

  const nodes: SceneNode[] = spec.nodes.map((node) => {
    const box = boxes.get(node.id) ?? { x: 0, y: 0, width: 80, height: 32 };
    return {
      id: node.id,
      kind: node.kind,
      label: node.label,
      sub: node.sub ?? null,
      x: round1(box.x),
      y: round1(box.y),
      width: round1(box.width),
      height: round1(box.height),
      emphasis: node.emphasis,
      group: node.group !== undefined && groupIds.has(node.group) ? node.group : null,
      href: null,
    };
  });

  const groups: SceneGroup[] = spec.groups
    .filter((group) => boxes.has(`group:${group.id}`))
    .map((group) => {
      const box = boxes.get(`group:${group.id}`) ?? { x: 0, y: 0, width: 0, height: 0 };
      return { id: group.id, label: group.label, x: round1(box.x), y: round1(box.y), width: round1(box.width), height: round1(box.height) };
    });

  const centre = new Map(nodes.map((node) => [node.id, { x: node.x + node.width / 2, y: node.y + node.height / 2 }]));
  const laidOut = new Map((result.edges ?? []).map((edge) => [edge.id, edge]));

  const sceneEdges: SceneEdge[] = spec.edges.map((edge, index) => {
    const id = `e${index}`;
    const out = laidOut.get(id) as (ElkExtendedEdge & { container?: string }) | undefined;
    const offset = origin.get(out?.container ?? 'root') ?? { x: 0, y: 0 };
    const points: Point[] = [];
    for (const section of out?.sections ?? []) {
      const raw = [section.startPoint, ...(section.bendPoints ?? []), section.endPoint];
      for (const point of raw) {
        const next = { x: round1(point.x + offset.x), y: round1(point.y + offset.y) };
        const last = points.at(-1);
        if (last?.x !== next.x || last.y !== next.y) points.push(next);
      }
    }
    const from = centre.get(edge.from) ?? { x: 0, y: 0 };
    const to = centre.get(edge.to) ?? { x: 0, y: 0 };
    if (points.length < 2) {
      points.length = 0;
      points.push({ x: round1(from.x), y: round1(from.y) }, { x: round1(to.x), y: round1(to.y) });
    }
    const label = out?.labels?.[0];
    const labelAt =
      label === undefined || edge.label === undefined
        ? null
        : { x: round1((label.x ?? 0) + offset.x + (label.width ?? 0) / 2), y: round1((label.y ?? 0) + offset.y + (label.height ?? 0) / 2) };
    // A flow edge drawn against the layout direction returns information upstream (VISUAL_GRAMMAR §3.2).
    const upstream = spec.direction === 'LR' ? to.x < from.x - 1 : to.y < from.y - 1;
    const kind: EdgeKind = edge.kind === 'flow' && upstream ? 'feedback' : edge.kind;
    return { id, from: edge.from, to: edge.to, kind, label: edge.label ?? null, points, labelAt };
  });

  return {
    width: Math.ceil(result.width ?? 0),
    height: Math.ceil(result.height ?? 0),
    nodes,
    edges: sceneEdges,
    groups,
  };
}
