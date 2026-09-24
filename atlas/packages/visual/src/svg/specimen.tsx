/**
 * Primitive specimens (VISUAL_GRAMMAR §3): one node glyph or one edge kind
 * drawn at its real size with the renderer's own typography, for the
 * visual-grammar reference page and author documentation. Static SVG with an
 * accessible name.
 */
import type { JSX } from 'preact';
import type { EdgeKind, NodeKind, Point, SceneEdge } from '@atlas/core';
import { measureNode } from '../node-geometry.ts';
import { NodeGlyph } from './glyphs.tsx';
import { EdgePath, EdgeLabel } from './scene.tsx';
import { cls, r1 } from './util.ts';

const PAD = 10;

export interface NodeSpecimenProps {
  readonly kind: NodeKind;
  readonly label: string;
  readonly sub?: string | null;
  readonly emphasis?: boolean;
}

/** One node primitive at its natural size. */
export function NodeSpecimen({ kind, label, sub = null, emphasis = false }: NodeSpecimenProps): JSX.Element {
  const size = measureNode(kind, label, sub);
  const width = Math.ceil(size.width + 2 * PAD);
  const height = Math.ceil(size.height + 2 * PAD);
  return (
    <svg class={cls('vg-svg', 'vg-specimen', 'vg-specimen--node')} viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={`${kind} primitive: ${label}${sub === null ? '' : ` ${sub}`}`}>
      <NodeGlyph kind={kind} label={label} sub={sub} box={{ x: PAD, y: PAD, width: size.width, height: size.height }} emphasis={emphasis} id={`specimen-${kind}`} />
    </svg>
  );
}

const EDGE_TEXT: Readonly<Record<EdgeKind, string>> = {
  flow: 'flow: data or control moves forward',
  dependency: 'dependency: requires, reads, or is computed from',
  feedback: 'feedback: information returns to an earlier stage',
  emphasis: 'emphasis: the argument’s main path',
};

/** One edge kind between two small nodes, with a label on the route. */
export function EdgeSpecimen({ kind, label }: { readonly kind: EdgeKind; readonly label: string }): JSX.Element {
  const a = measureNode('node', 'source', null);
  const b = measureNode('node', 'target', null);
  const gap = 150;
  const width = PAD * 2 + a.width + gap + b.width;
  const feedback = kind === 'feedback';
  const height = feedback ? PAD * 2 + a.height + 34 : PAD * 2 + Math.max(a.height, b.height);
  const ay = PAD + a.height / 2;
  const bx = PAD + a.width + gap;
  let points: Point[];
  let labelAt: Point;
  if (feedback) {
    const low = PAD + a.height + 22;
    points = [
      { x: bx + b.width / 2, y: PAD + b.height },
      { x: bx + b.width / 2, y: low },
      { x: PAD + a.width / 2, y: low },
      { x: PAD + a.width / 2, y: PAD + a.height },
    ];
    labelAt = { x: PAD + a.width + gap / 2, y: low };
  } else {
    points = [
      { x: PAD + a.width, y: ay },
      { x: bx, y: ay },
    ];
    labelAt = { x: PAD + a.width + gap / 2, y: ay };
  }
  const edge: SceneEdge = { id: `specimen-${kind}`, from: feedback ? 'b' : 'a', to: feedback ? 'a' : 'b', kind, label, points, labelAt };
  return (
    <svg class={cls('vg-svg', 'vg-specimen', 'vg-specimen--edge')} viewBox={`0 0 ${r1(width)} ${r1(height)}`} width={r1(width)} height={r1(height)} role="img" aria-label={EDGE_TEXT[kind]}>
      <g class="vg-edges">
        <EdgePath edge={edge} />
      </g>
      <g class="vg-nodes">
        <NodeGlyph kind="node" label="source" sub={null} box={{ x: PAD, y: PAD, width: a.width, height: a.height }} />
        <NodeGlyph kind="node" label="target" sub={null} box={{ x: bx, y: PAD, width: b.width, height: b.height }} />
      </g>
      <g class="vg-edge-labels">
        <EdgeLabel edge={edge} />
      </g>
    </svg>
  );
}
