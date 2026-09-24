/**
 * Node box geometry shared by the layout engines (compile time) and the SVG
 * renderers (render time). Both sides call the same functions, so the text a
 * renderer draws always fits the box the layout reserved for it.
 *
 * A box = text block + padding + the glyph's own inset (the stacked back layer
 * of a tensor, the caps of a dataset cylinder, the tips of an objective lozenge…).
 */
import type { NodeKind } from '@atlas/core';
import { linesWidth, wrapText } from './text-metrics.ts';

export const NODE_TYPE = {
  labelSize: 13,
  labelLine: 16,
  subSize: 11.5,
  subLine: 14,
  padX: 12,
  padY: 8,
  /** Widest text block inside a node before wrapping. */
  maxTextWidth: 196,
  minWidth: 64,
  /** Gap between the label block and the sub-label block. */
  subGap: 3,
} as const;

export interface Inset {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** Extra space each primitive glyph needs around its text (VISUAL_GRAMMAR §3.1). */
export const GLYPH_INSET: Readonly<Record<NodeKind, Inset>> = {
  node: { top: 0, right: 0, bottom: 0, left: 0 },
  process: { top: 0, right: 0, bottom: 0, left: 3 },
  state: { top: 0, right: 8, bottom: 0, left: 8 },
  tensor: { top: 6, right: 6, bottom: 0, left: 0 },
  memory: { top: 8, right: 0, bottom: 0, left: 0 },
  dataset: { top: 9, right: 0, bottom: 5, left: 0 },
  model: { top: 3, right: 3, bottom: 3, left: 3 },
  objective: { top: 0, right: 14, bottom: 0, left: 14 },
  metric: { top: 0, right: 0, bottom: 7, left: 0 },
  hardware: { top: 2, right: 3, bottom: 2, left: 3 },
  flow: { top: 0, right: 11, bottom: 0, left: 9 },
  dependency: { top: 0, right: 0, bottom: 0, left: 0 },
  branch: { top: 0, right: 0, bottom: 0, left: 22 },
  feedback: { top: 0, right: 16, bottom: 0, left: 0 },
  boundary: { top: 0, right: 2, bottom: 0, left: 2 },
};

export interface NodeText {
  readonly labelLines: readonly string[];
  readonly subLines: readonly string[];
}

export interface MeasuredNode extends NodeText {
  readonly width: number;
  readonly height: number;
}

function textBlockHeight(text: NodeText): number {
  const label = text.labelLines.length * NODE_TYPE.labelLine;
  const sub = text.subLines.length === 0 ? 0 : NODE_TYPE.subGap + text.subLines.length * NODE_TYPE.subLine;
  return label + sub;
}

/** Boundary labels are set in letter-spaced small caps, which run about 12 % wider. */
function labelScale(kind: NodeKind): number {
  return kind === 'boundary' ? 1.12 : 1;
}

function wrapNodeText(kind: NodeKind, label: string, sub: string | null, maxTextWidth: number): NodeText {
  const scale = labelScale(kind);
  const labelLines = wrapText(label, maxTextWidth / scale, NODE_TYPE.labelSize, 'sans');
  const subLines = sub === null || sub === '' ? [] : wrapText(sub, maxTextWidth, NODE_TYPE.subSize, 'mono');
  return { labelLines, subLines };
}

/** Measures a node box for the given primitive, label, and monospace sub-label. Deterministic. */
export function measureNode(kind: NodeKind, label: string, sub: string | null, maxTextWidth: number = NODE_TYPE.maxTextWidth): MeasuredNode {
  const text = wrapNodeText(kind, label, sub, maxTextWidth);
  const inset = GLYPH_INSET[kind];
  const textW = Math.max(
    linesWidth(text.labelLines, NODE_TYPE.labelSize, 'sans') * labelScale(kind),
    linesWidth(text.subLines, NODE_TYPE.subSize, 'mono'),
  );
  const width = Math.max(NODE_TYPE.minWidth, Math.ceil(textW + 2 * NODE_TYPE.padX + inset.left + inset.right));
  const height = Math.ceil(textBlockHeight(text) + 2 * NODE_TYPE.padY + inset.top + inset.bottom);
  return { ...text, width, height };
}

export interface PlacedLine {
  readonly text: string;
  /** Baseline position, absolute. */
  readonly x: number;
  readonly y: number;
  readonly role: 'label' | 'sub';
}

/**
 * Text lines of a node already placed in a box (x, y, width, height): centred
 * horizontally inside the glyph's text area and vertically in the box.
 */
export function placeNodeText(kind: NodeKind, label: string, sub: string | null, box: { x: number; y: number; width: number; height: number }): PlacedLine[] {
  const inset = GLYPH_INSET[kind];
  const innerW = Math.max(24, box.width - 2 * NODE_TYPE.padX - inset.left - inset.right);
  const text = wrapNodeText(kind, label, sub, innerW + 1);
  const blockH = textBlockHeight(text);
  const areaTop = box.y + inset.top;
  const areaH = box.height - inset.top - inset.bottom;
  const cx = box.x + inset.left + (box.width - inset.left - inset.right) / 2;
  let cursor = areaTop + (areaH - blockH) / 2;
  const lines: PlacedLine[] = [];
  for (const line of text.labelLines) {
    // Baseline ≈ top + 0.76 × line height for a 13 px face in a 16 px line.
    lines.push({ text: line, x: round1(cx), y: round1(cursor + 12), role: 'label' });
    cursor += NODE_TYPE.labelLine;
  }
  if (text.subLines.length > 0) cursor += NODE_TYPE.subGap;
  for (const line of text.subLines) {
    lines.push({ text: line, x: round1(cx), y: round1(cursor + 10.5), role: 'sub' });
    cursor += NODE_TYPE.subLine;
  }
  return lines;
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
