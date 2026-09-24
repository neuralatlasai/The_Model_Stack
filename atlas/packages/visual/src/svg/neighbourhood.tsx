/**
 * Local neighbourhood graph (UI_UX §13). Groups render as column/row headings
 * (small caps, hairline underline) rather than boxes; nodes link to their
 * pages; the current node carries the domain emphasis. Static SVG, keyboard
 * reachable through the node links.
 */
import type { JSX } from 'preact';
import type { Scene } from '@atlas/core';
import { NodeGlyph } from './glyphs.tsx';
import { EdgePath } from './scene.tsx';
import { hashId, r1, widthClass } from './util.ts';

export interface NeighbourhoodGraphProps {
  readonly scene: Scene;
  readonly title?: string;
  readonly desc?: string;
  readonly idPrefix?: string;
}

export function NeighbourhoodGraph({ scene, title = 'Local neighbourhood', desc, idPrefix }: NeighbourhoodGraphProps): JSX.Element {
  const prefix = idPrefix ?? `vg-nb-${hashId(scene.nodes.map((node) => node.id).join(','))}`;
  const center = scene.nodes.find((node) => node.emphasis);
  const summary =
    desc ??
    scene.groups
      .map((group) => {
        const members = scene.nodes.filter((node) => node.group === group.id).map((node) => node.label);
        return `${group.label}: ${members.join(', ')}`;
      })
      .join('. ');
  const width = Math.max(1, Math.ceil(scene.width));
  const height = Math.max(1, Math.ceil(scene.height));
  return (
    <svg
      class={`vg-svg vg-neighbourhood ${widthClass(width)}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="group"
      aria-labelledby={`${prefix}-title`}
      aria-describedby={`${prefix}-desc`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={`${prefix}-title`}>{center === undefined ? title : `${title}: ${center.label}`}</title>
      <desc id={`${prefix}-desc`}>{summary}</desc>
      {scene.groups.map((group) => (
        <g class="vg-nb-heading" key={group.id}>
          <text class="vg-nb-heading__label" x={r1(group.x)} y={r1(group.y + 13)}>
            {group.label}
          </text>
          <line class="vg-hair" x1={r1(group.x)} y1={r1(group.y + 18)} x2={r1(group.x + group.width)} y2={r1(group.y + 18)} />
        </g>
      ))}
      <g class="vg-edges">
        {scene.edges.map((edge) => (
          <EdgePath edge={edge} key={edge.id} />
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
          />
        ))}
      </g>
    </svg>
  );
}
