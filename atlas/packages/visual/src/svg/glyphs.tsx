/**
 * Primitive glyphs (VISUAL_GRAMMAR §3.1). One drawing per node kind, fixed
 * across the book, so a reader learns the vocabulary once:
 *
 *   node       hairline rectangle             process   heavier left rule
 *   state      pill                           tensor    two stacked back layers
 *   memory     banked band across the top     dataset   cylinder with a record line
 *   model      double rule                    objective lozenge (elongated diamond)
 *   metric     ruler underline with ticks     hardware  notched corners and pins
 *   flow       chevron ends                   dependency dashed rectangle
 *   branch     small diamond with fork        feedback  return hook
 *   boundary   long-dash enclosure, small-caps label
 *
 * Strokes are hairlines (vector-effect: non-scaling-stroke in CSS); colours
 * come only from the figure tokens (--fig-*), so light and dark are handled by
 * the token layer. Corners carry a 1.5 px radius: crisp, never soft.
 */
import type { JSX } from 'preact';
import type { NodeKind } from '@atlas/core';
import { GLYPH_INSET, placeNodeText } from '../node-geometry.ts';
import { cls, r1 } from './util.ts';

export interface Box {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

const RADIUS = 1.5;

function Rect({ box, class: className, radius = RADIUS }: { readonly box: Box; readonly class: string; readonly radius?: number }): JSX.Element {
  return <rect class={className} x={r1(box.x)} y={r1(box.y)} width={r1(Math.max(0, box.width))} height={r1(Math.max(0, box.height))} rx={radius} ry={radius} />;
}

function points(list: readonly (readonly [number, number])[]): string {
  return list.map(([px, py]) => `${r1(px)},${r1(py)}`).join(' ');
}

/** The outline and decorations of one primitive, drawn into `box`. */
export function NodeShape({ kind, box }: { readonly kind: NodeKind; readonly box: Box }): JSX.Element {
  const { x, y, width: w, height: h } = box;
  const cy = y + h / 2;
  switch (kind) {
    case 'process':
      return (
        <>
          <Rect class="vg-shape" box={box} />
          <path class="vg-ink" d={`M${r1(x + RADIUS)} ${r1(y)} H${r1(x + 3)} V${r1(y + h)} H${r1(x + RADIUS)} A${RADIUS} ${RADIUS} 0 0 1 ${r1(x)} ${r1(y + h - RADIUS)} V${r1(y + RADIUS)} A${RADIUS} ${RADIUS} 0 0 1 ${r1(x + RADIUS)} ${r1(y)} Z`} />
        </>
      );
    case 'state':
      return <Rect class="vg-shape" box={box} radius={h / 2} />;
    case 'tensor': {
      const step = GLYPH_INSET.tensor.top / 2;
      const face = { width: w - 2 * step, height: h - 2 * step };
      return (
        <>
          <Rect class="vg-shape vg-shape--back" box={{ x: x + 2 * step, y, ...face }} />
          <Rect class="vg-shape vg-shape--back" box={{ x: x + step, y: y + step, ...face }} />
          <Rect class="vg-shape" box={{ x, y: y + 2 * step, ...face }} />
        </>
      );
    }
    case 'memory': {
      const band = GLYPH_INSET.memory.top;
      const banks = [0.25, 0.5, 0.75].map((t) => x + t * w);
      return (
        <>
          <Rect class="vg-shape" box={box} />
          <path class="vg-band" d={`M${r1(x + 0.5)} ${r1(y + band)} V${r1(y + RADIUS)} Q${r1(x + 0.5)} ${r1(y + 0.5)} ${r1(x + RADIUS)} ${r1(y + 0.5)} H${r1(x + w - RADIUS)} Q${r1(x + w - 0.5)} ${r1(y + 0.5)} ${r1(x + w - 0.5)} ${r1(y + RADIUS)} V${r1(y + band)} Z`} />
          <line class="vg-hair" x1={r1(x)} y1={r1(y + band)} x2={r1(x + w)} y2={r1(y + band)} />
          <path class="vg-hair vg-hair--soft" d={banks.map((bx) => `M${r1(bx)} ${r1(y + 1.5)} V${r1(y + band - 1.5)}`).join(' ')} />
        </>
      );
    }
    case 'dataset': {
      const ry = 4.5;
      const body = `M${r1(x)} ${r1(y + ry)} A${r1(w / 2)} ${ry} 0 0 1 ${r1(x + w)} ${r1(y + ry)} V${r1(y + h - ry)} A${r1(w / 2)} ${ry} 0 0 1 ${r1(x)} ${r1(y + h - ry)} Z`;
      const rim = `M${r1(x)} ${r1(y + ry)} A${r1(w / 2)} ${ry} 0 0 0 ${r1(x + w)} ${r1(y + ry)}`;
      const record = `M${r1(x)} ${r1(y + ry + 3.5)} A${r1(w / 2)} ${ry} 0 0 0 ${r1(x + w)} ${r1(y + ry + 3.5)}`;
      return (
        <>
          <path class="vg-shape" d={body} />
          <path class="vg-hair" d={rim} />
          <path class="vg-hair vg-hair--soft" d={record} />
        </>
      );
    }
    case 'model':
      return (
        <>
          <Rect class="vg-shape" box={box} />
          <Rect class="vg-hair" box={{ x: x + 3, y: y + 3, width: w - 6, height: h - 6 }} radius={0.75} />
        </>
      );
    case 'objective': {
      const tip = GLYPH_INSET.objective.left;
      return (
        <polygon
          class="vg-shape"
          points={points([
            [x, cy],
            [x + tip, y],
            [x + w - tip, y],
            [x + w, cy],
            [x + w - tip, y + h],
            [x + tip, y + h],
          ])}
        />
      );
    }
    case 'metric': {
      const base = y + h - 4;
      const ticks = Array.from({ length: 9 }, (_, k) => ({ tx: x + 8 + (k / 8) * (w - 16), major: k % 4 === 0 }));
      return (
        <>
          <Rect class="vg-shape" box={box} />
          <line class="vg-hair" x1={r1(x + 8)} y1={r1(base)} x2={r1(x + w - 8)} y2={r1(base)} />
          <path class="vg-hair" d={ticks.filter((tick) => tick.major).map(({ tx }) => `M${r1(tx)} ${r1(base)} V${r1(base - 3.5)}`).join(' ')} />
          <path class="vg-hair vg-hair--soft" d={ticks.filter((tick) => !tick.major).map(({ tx }) => `M${r1(tx)} ${r1(base)} V${r1(base - 2)}`).join(' ')} />
        </>
      );
    }
    case 'hardware': {
      const n = 4;
      const d = `M${r1(x + n)} ${r1(y)} H${r1(x + w - n)} V${r1(y + n)} H${r1(x + w)} V${r1(y + h - n)} H${r1(x + w - n)} V${r1(y + h)} H${r1(x + n)} V${r1(y + h - n)} H${r1(x)} V${r1(y + n)} H${r1(x + n)} Z`;
      const pins = [0.18, 0.32, 0.68, 0.82].map((t) => x + t * w);
      return (
        <>
          <path class="vg-shape" d={d} />
          <path class="vg-hair" d={pins.map((px) => `M${r1(px)} ${r1(y - 2.5)} V${r1(y)} M${r1(px)} ${r1(y + h)} V${r1(y + h + 2.5)}`).join(' ')} />
        </>
      );
    }
    case 'flow':
      return (
        <polygon
          class="vg-shape"
          points={points([
            [x, y],
            [x + w - 10, y],
            [x + w, cy],
            [x + w - 10, y + h],
            [x, y + h],
            [x + 8, cy],
          ])}
        />
      );
    case 'dependency':
      return <Rect class="vg-shape vg-shape--dashed" box={box} />;
    case 'branch': {
      const dx = x + 11;
      const s = 5;
      return (
        <>
          <Rect class="vg-shape" box={box} />
          <polygon class="vg-ink" points={`${r1(dx - s)},${r1(cy)} ${r1(dx)},${r1(cy - s)} ${r1(dx + s)},${r1(cy)} ${r1(dx)},${r1(cy + s)}`} />
          <path class="vg-hair" d={`M${r1(dx + s)} ${r1(cy)} L${r1(dx + s + 4)} ${r1(cy - 4)} M${r1(dx + s)} ${r1(cy)} L${r1(dx + s + 4)} ${r1(cy + 4)}`} />
        </>
      );
    }
    case 'feedback': {
      const hx = x + w - 6;
      return (
        <>
          <Rect class="vg-shape" box={box} />
          <path class="vg-hair" d={`M${r1(hx)} ${r1(cy + 5)} V${r1(cy - 1)} A4 4 0 0 0 ${r1(hx - 8)} ${r1(cy - 1)} V${r1(cy + 3)}`} />
          <path class="vg-hair" d={`M${r1(hx - 11)} ${r1(cy + 1)} L${r1(hx - 8)} ${r1(cy + 4)} L${r1(hx - 5)} ${r1(cy + 1)}`} />
        </>
      );
    }
    case 'boundary':
      return <Rect class="vg-shape vg-shape--boundary" box={box} radius={3} />;
    case 'node':
      return <Rect class="vg-shape" box={box} />;
  }
}

export interface NodeGlyphProps {
  readonly kind: NodeKind;
  readonly label: string;
  readonly sub: string | null;
  readonly box: Box;
  readonly emphasis?: boolean;
  readonly href?: string | null;
  readonly id?: string;
  /** Live-instrument key (`data-vg-key`); defaults to `id`. */
  readonly vgKey?: string;
  /** Lit by the current state (`is-lit`). */
  readonly lit?: boolean;
}

/** A complete node: glyph plus wrapped label and monospace sub-label. */
export function NodeGlyph({ kind, label, sub, box, emphasis = false, href = null, id, vgKey, lit = false }: NodeGlyphProps): JSX.Element {
  const lines = placeNodeText(kind, label, sub, box);
  const key = vgKey ?? id;
  const body = (
    <g class={cls('vg-node', `vg-node--${kind}`, emphasis && 'vg-node--emph', lit && 'is-lit')} data-node={id} data-vg-key={key}>
      <NodeShape kind={kind} box={box} />
      {lines.map((line) => (
        <text class={line.role === 'label' ? cls('vg-node__label', kind === 'boundary' && 'vg-node__label--caps') : 'vg-node__sub'} x={line.x} y={line.y} text-anchor="middle">
          {line.text}
        </text>
      ))}
    </g>
  );
  return href === null ? body : <a href={href} class="vg-node-link">{body}</a>;
}

/** A small standalone glyph (legends, hierarchy rows). Decorative: the adjacent text names the kind. */
export function GlyphIcon({ kind, emphasis = false }: { readonly kind: NodeKind; readonly emphasis?: boolean }): JSX.Element {
  const inset = GLYPH_INSET[kind];
  const width = 30 + Math.min(inset.left + inset.right, 10);
  const height = 18 + Math.min(inset.top + inset.bottom, 6);
  return (
    <svg class={cls('vg-glyph', `vg-node--${kind}`, emphasis && 'vg-node--emph')} viewBox={`-1 -4 ${width + 2} ${height + 8}`} width={width + 2} height={height + 8} aria-hidden="true" focusable="false">
      <g class="vg-node">
        <NodeShape kind={kind} box={{ x: 0, y: 0, width, height }} />
      </g>
    </svg>
  );
}
