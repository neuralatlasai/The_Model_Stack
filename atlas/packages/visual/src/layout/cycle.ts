/**
 * `cycle` layout (VISUAL_GRAMMAR §5.8, UI_UX §27): stages stacked in a single
 * column in authored order; forward flow between neighbours runs straight
 * down; feedback (explicit, or any edge whose target is upstream) returns on
 * the right in nested lanes; forward edges that skip stages run on the left.
 *
 * Lanes are assigned by interval packing (shortest spans innermost), and each
 * node's attachment points are ordered so that stubs never cross a lane.
 * Pure arithmetic: identical input yields identical output.
 */
import type { CycleSpec, Point, Scene, SceneEdge, SceneNode } from '@atlas/core';
import { measureNode, round1 } from '../node-geometry.ts';
import { textWidth } from '../text-metrics.ts';
import { EDGE_LABEL_FONT } from './diagram.ts';

const PAD = 16;
const ROW_GAP = 34;
const FIRST_LANE = 22;
const LANE_GAP = 16;
const LABEL_OFFSET = 6;
const MIN_COLUMN = 148;

type Side = 'right' | 'left';

interface Routed {
  readonly index: number;
  readonly from: number;
  readonly to: number;
  readonly side: Side | 'straight';
  lane: number;
}

function labelWidth(label: string | undefined): number {
  return label === undefined || label === '' ? 0 : Math.ceil(textWidth(label, EDGE_LABEL_FONT, 'mono')) + 4;
}

/** Packs intervals into lanes: shortest spans first, each into the lowest free lane. */
function assignLanes(edges: Routed[]): number {
  const lanes: (readonly [number, number])[][] = [];
  const order = [...edges].sort((a, b) => {
    const spanA = Math.abs(a.to - a.from);
    const spanB = Math.abs(b.to - b.from);
    return spanA - spanB || Math.max(a.from, a.to) - Math.max(b.from, b.to) || a.index - b.index;
  });
  for (const edge of order) {
    const lo = Math.min(edge.from, edge.to);
    const hi = Math.max(edge.from, edge.to);
    let lane = 0;
    for (;;) {
      const taken = lanes[lane] ?? [];
      // Spans may share an end node (their stubs use different ports); a self-loop blocks its node.
      const clash = taken.some(([a, b]) => (lo === hi || a === b ? a <= hi && lo <= b : Math.max(a, lo) < Math.min(b, hi)));
      if (!clash) break;
      lane += 1;
    }
    (lanes[lane] ??= []).push([lo, hi]);
    edge.lane = lane;
  }
  return lanes.length;
}

/** Lays out a cycle spec as a column with feedback lanes on the right. */
export function layoutCycle(spec: CycleSpec): Scene {
  const index = new Map(spec.stages.map((stage, i) => [stage.id, i]));
  const sizes = spec.stages.map((stage) => measureNode(stage.kind, stage.label, stage.sub ?? null));
  const colWidth = Math.max(MIN_COLUMN, ...sizes.map((size) => size.width));

  const routed: Routed[] = [];
  spec.edges.forEach((edge, i) => {
    const from = index.get(edge.from);
    const to = index.get(edge.to);
    if (from === undefined || to === undefined) return;
    let side: Routed['side'];
    if (edge.kind === 'feedback' || to <= from) side = 'right';
    else if (to === from + 1) side = 'straight';
    else side = 'left';
    routed.push({ index: i, from, to, side, lane: 0 });
  });
  const right = routed.filter((edge) => edge.side === 'right');
  const left = routed.filter((edge) => edge.side === 'left');
  const rightLanes = assignLanes(right);
  const leftLanes = assignLanes(left);

  // Lane spacing makes room for each lane's labels (set beside the lane, away from the column).
  const laneOffsets = (edges: Routed[], count: number): number[] => {
    const offsets: number[] = [];
    let cursor = FIRST_LANE;
    for (let lane = 0; lane < count; lane += 1) {
      offsets.push(cursor);
      const widest = Math.max(0, ...edges.filter((edge) => edge.lane === lane).map((edge) => labelWidth(spec.edges[edge.index]?.label)));
      cursor += Math.max(LANE_GAP, widest === 0 ? LANE_GAP : widest + LABEL_OFFSET + 8);
    }
    offsets.push(cursor);
    return offsets;
  };
  const rightOffsets = laneOffsets(right, rightLanes);
  const leftOffsets = laneOffsets(left, leftLanes);
  const leftExtent = leftLanes === 0 ? 0 : (leftOffsets[leftLanes] ?? 0);
  const straightLabel = Math.max(0, ...routed.filter((edge) => edge.side === 'straight').map((edge) => labelWidth(spec.edges[edge.index]?.label)));

  const colLeft = PAD + leftExtent;
  const cx = colLeft + colWidth / 2;
  const colRight = colLeft + colWidth;

  const nodes: SceneNode[] = [];
  let y = PAD;
  spec.stages.forEach((stage, i) => {
    const size = sizes[i] ?? { width: colWidth, height: 32 };
    // Every stage spans the full column: the lifecycle reads as one aligned stack.
    nodes.push({
      id: stage.id,
      kind: stage.kind,
      label: stage.label,
      sub: stage.sub ?? null,
      x: round1(colLeft),
      y: round1(y),
      width: colWidth,
      height: size.height,
      emphasis: false,
      group: null,
      href: null,
    });
    y += size.height + ROW_GAP;
  });

  // Attachment points on each node side, ordered so that stubs do not cross lanes:
  // top→bottom: edges whose far end is above (inner lanes first), then those below (outer lanes first).
  const ports = new Map<string, number>();
  const assignPorts = (edges: Routed[], side: Side): void => {
    nodes.forEach((node, n) => {
      const attached: { key: string; up: boolean; lane: number; order: number }[] = [];
      for (const edge of edges) {
        if (edge.from === n) attached.push({ key: `${edge.index}:from`, up: edge.to < n, lane: edge.lane, order: edge.index });
        if (edge.to === n) attached.push({ key: `${edge.index}:to`, up: edge.from < n, lane: edge.lane, order: edge.index });
      }
      attached.sort((a, b) => {
        if (a.up !== b.up) return a.up ? -1 : 1;
        return (a.up ? a.lane - b.lane : b.lane - a.lane) || a.order - b.order || (a.key < b.key ? -1 : 1);
      });
      attached.forEach((entry, k) => {
        ports.set(`${side}:${entry.key}`, node.y + (node.height * (k + 1)) / (attached.length + 1));
      });
    });
  };
  assignPorts(right, 'right');
  assignPorts(left, 'left');

  let maxX = colRight + (straightLabel > 0 ? 8 + straightLabel : 0);
  const edges: SceneEdge[] = [];
  for (const edge of routed) {
    const source = nodes[edge.from];
    const target = nodes[edge.to];
    const authored = spec.edges[edge.index];
    if (source === undefined || target === undefined || authored === undefined) continue;
    const label = authored.label ?? null;
    const width = labelWidth(authored.label);
    let points: Point[];
    let labelAt: Point | null = null;
    if (edge.side === 'straight') {
      const startY = source.y + source.height;
      const endY = target.y;
      points = [
        { x: round1(cx), y: round1(startY) },
        { x: round1(cx), y: round1(endY) },
      ];
      if (label !== null) labelAt = { x: round1(cx + 8 + width / 2), y: round1((startY + endY) / 2) };
    } else {
      const side: Side = edge.side;
      const offsets = side === 'right' ? rightOffsets : leftOffsets;
      const laneX = side === 'right' ? colRight + (offsets[edge.lane] ?? FIRST_LANE) : colLeft - (offsets[edge.lane] ?? FIRST_LANE);
      const edgeX = (node: SceneNode): number => (side === 'right' ? node.x + node.width : node.x);
      const y0 = ports.get(`${side}:${edge.index}:from`) ?? source.y + source.height / 2;
      const y1 = ports.get(`${side}:${edge.index}:to`) ?? target.y + target.height / 2;
      points = [
        { x: round1(edgeX(source)), y: round1(y0) },
        { x: round1(laneX), y: round1(y0) },
        { x: round1(laneX), y: round1(y1) },
        { x: round1(edgeX(target)), y: round1(y1) },
      ];
      if (label !== null) {
        const dx = LABEL_OFFSET + width / 2;
        labelAt = { x: round1(side === 'right' ? laneX + dx : laneX - dx), y: round1((y0 + y1) / 2) };
      }
      if (side === 'right') maxX = Math.max(maxX, laneX + (label === null ? 0 : LABEL_OFFSET + width));
    }
    edges.push({
      id: `e${edge.index}`,
      from: authored.from,
      to: authored.to,
      kind: edge.side === 'right' ? 'feedback' : 'flow',
      label,
      points,
      labelAt,
    });
  }
  edges.sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));

  const bottom = Math.max(...nodes.map((node) => node.y + node.height));
  return {
    width: Math.ceil(maxX + PAD),
    height: Math.ceil(bottom + PAD),
    nodes,
    edges,
    groups: [],
  };
}
