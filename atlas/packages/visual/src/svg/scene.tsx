/**
 * Scene renderer for laid-out graph figures (diagram, cycle) and edge
 * primitives (VISUAL_GRAMMAR §3.2): flow = solid hairline + arrowhead;
 * dependency = dashed; feedback = rounded return path; emphasis = heavier
 * stroke in the domain accent. Arrowheads are explicit notched polygons (no
 * <marker>), so several figures on one page never collide on ids and heads
 * inherit the edge's colour through CSS. Every edge leaves its source from a
 * small port dot, so a crossing never reads as a junction.
 *
 * Live-instrument keys: nodes carry `data-vg-key="<node id>"`, edges
 * `data-vg-key="<from>-><to>"`; parts lit by the initial state get `is-lit`.
 */
import type { JSX } from 'preact';
import type { Point, Scene, SceneEdge } from '@atlas/core';
import { textWidth } from '../text-metrics.ts';
import { NodeGlyph } from './glyphs.tsx';
import { cls, edgeKey, hashId, litClass, NO_STATE, r1, roundedPath, widthClass, type StateView } from './util.ts';

const CORNER = 6;
const FEEDBACK_CORNER = 14;
const ARROW = 8;
const NOTCH = 2.25;

/** Notched arrowhead with its tip at `tip`, pointing along from → tip. */
function arrowHead(from: Point, tip: Point, length: number, halfWidth: number): string {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const bx = tip.x - ux * length;
  const by = tip.y - uy * length;
  const nx = tip.x - ux * (length - NOTCH);
  const ny = tip.y - uy * (length - NOTCH);
  return `${r1(tip.x)},${r1(tip.y)} ${r1(bx - uy * halfWidth)},${r1(by + ux * halfWidth)} ${r1(nx)},${r1(ny)} ${r1(bx + uy * halfWidth)},${r1(by - ux * halfWidth)}`;
}

export function EdgePath({ edge, lit = false }: { readonly edge: SceneEdge; readonly lit?: boolean }): JSX.Element | null {
  const points = edge.points;
  const tip = points[points.length - 1];
  const before = points[points.length - 2];
  const start = points[0];
  if (tip === undefined || before === undefined || start === undefined) return null;
  const radius = edge.kind === 'feedback' ? FEEDBACK_CORNER : CORNER;
  const emphasis = edge.kind === 'emphasis';
  return (
    <g class={cls('vg-edge', `vg-edge--${edge.kind}`, lit && 'is-lit')} data-edge={edge.id} data-vg-key={edgeKey(edge.from, edge.to)}>
      <path class="vg-edge__line" d={roundedPath(points, radius, ARROW - NOTCH - 0.5)} />
      <circle class="vg-edge__port" cx={r1(start.x)} cy={r1(start.y)} r={emphasis ? 2 : 1.6} />
      <polygon class="vg-edge__head" points={arrowHead(before, tip, emphasis ? ARROW + 1 : ARROW, emphasis ? 3.75 : 3.25)} />
    </g>
  );
}

const LABEL_FONT = 10.5;

export function EdgeLabel({ edge, lit = false }: { readonly edge: SceneEdge; readonly lit?: boolean }): JSX.Element | null {
  if (edge.label === null || edge.labelAt === null) return null;
  const width = Math.ceil(textWidth(edge.label, LABEL_FONT, 'mono')) + 8;
  const { x, y } = edge.labelAt;
  return (
    <g class={cls('vg-edge__tag', `vg-edge__tag--${edge.kind}`, lit && 'is-lit')} data-vg-key={edgeKey(edge.from, edge.to)}>
      <rect class="vg-edge__knock" x={r1(x - width / 2)} y={r1(y - 7.5)} width={width} height="15" rx="2" ry="2" />
      <text class={cls('vg-edge__label', `vg-edge__label--${edge.kind}`)} x={r1(x)} y={r1(y)} text-anchor="middle" dominant-baseline="central">
        {edge.label}
      </text>
    </g>
  );
}

export interface SceneSvgProps {
  readonly scene: Scene;
  /** Accessible name (the figure title). */
  readonly title: string;
  /** Accessible description (the figure alt text). */
  readonly desc: string;
  /** Prefix for the <title>/<desc> ids; must be unique on the page (the figure anchor). */
  readonly idPrefix?: string;
  readonly class?: string;
  /** Live-instrument state (lit parts) applied to the initial render. */
  readonly state?: StateView;
  /** Numbers the nodes in reading order in a left gutter (cycle stages: 01, 02, …). */
  readonly ordinals?: boolean;
}

const ORDINAL_GUTTER = 26;

/** Static SVG for a laid-out Scene. `width`/`height` are the natural size; CSS caps it at 100 % of the column. */
export function SceneSvg({ scene, title, desc, idPrefix, class: extra, state = NO_STATE, ordinals = false }: SceneSvgProps): JSX.Element {
  const prefix = idPrefix ?? `vg-${hashId(`${title}|${scene.width}x${scene.height}|${scene.nodes.map((node) => node.id).join(',')}`)}`;
  const titleId = `${prefix}-title`;
  const descId = `${prefix}-desc`;
  const gutter = ordinals ? ORDINAL_GUTTER : 0;
  const width = Math.max(1, Math.ceil(scene.width + gutter));
  const height = Math.max(1, Math.ceil(scene.height));
  return (
    <svg
      class={cls('vg-svg', 'vg-scene', widthClass(width), extra)}
      viewBox={`${-gutter} 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={titleId}>{title}</title>
      <desc id={descId}>{desc}</desc>
      <g class="vg-groups">
        {scene.groups.map((group) => (
          <g class="vg-group" key={group.id} data-group={group.id} data-vg-key={group.id}>
            <rect class="vg-group__box" x={group.x} y={group.y} width={group.width} height={group.height} rx="3" ry="3" />
            <text class="vg-group__label" x={r1(group.x + 10)} y={r1(group.y + 14)}>
              {group.label}
            </text>
          </g>
        ))}
      </g>
      <g class="vg-edges">
        {scene.edges.map((edge) => (
          <EdgePath edge={edge} key={edge.id} lit={litClass(state, edgeKey(edge.from, edge.to)) !== false} />
        ))}
      </g>
      <g class="vg-nodes">
        {scene.nodes.map((node) => (
          <NodeGlyph
            key={node.id}
            id={node.id}
            kind={node.kind}
            label={node.label}
            sub={node.sub}
            box={{ x: node.x, y: node.y, width: node.width, height: node.height }}
            emphasis={node.emphasis}
            href={node.href}
            lit={state.lit.has(node.id)}
          />
        ))}
      </g>
      {ordinals && (
        <g class="vg-ordinals" aria-hidden="true">
          {scene.nodes.map((node, index) => (
            <text class={cls('vg-ordinal', litClass(state, node.id))} data-vg-key={node.id} x={r1(-gutter + 2)} y={r1(node.y + node.height / 2)} dominant-baseline="central" key={`o${node.id}`}>
              {String(index + 1).padStart(2, '0')}
            </text>
          ))}
        </g>
      )}
      <g class="vg-edge-labels">
        {scene.edges.map((edge) => (
          <EdgeLabel edge={edge} key={edge.id} lit={state.lit.has(edgeKey(edge.from, edge.to))} />
        ))}
      </g>
    </svg>
  );
}
