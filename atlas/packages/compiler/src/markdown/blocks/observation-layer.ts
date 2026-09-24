/**
 * The four-part observation layer under `## Observations` (UI_UX §41,
 * CONTENT_CONTRACT §6): four bold-led paragraphs become ONE block so the
 * renderer can separate source claims, evidence, inference, and unknowns.
 */
import { OBSERVATION_PARTS, type Inline, type ObservationLayerBlock, type ObservationPart } from '@atlas/core';
import type { Paragraph } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { convertPhrasing } from '../inline.ts';
import { stripLead, trimInline } from '../inline-utils.ts';
import { depthOf, type CompileState, type FlowEnv } from '../state.ts';

const PART_PATTERNS: readonly (readonly [RegExp, ObservationPart])[] = [
  [/^What the (?:papers?|sources?|documentation|authors?|reports?)\s+(?:claims?|reports?|says?|states?)\b/iu, 'claims'],
  [/^What the evidence shows\b/iu, 'evidence'],
  [/^What we infer\b/iu, 'inference'],
  [/^What remains unknown\b/iu, 'unknown'],
];

/** The observation part a paragraph opens, or null. */
export function observationPartOf(paragraph: Paragraph): ObservationPart | null {
  const lead = paragraph.children[0];
  if (lead?.type !== 'strong') return null;
  const text = toString(lead).trim();
  for (const [pattern, part] of PART_PATTERNS) if (pattern.test(text)) return part;
  return null;
}

export function buildObservationLayer(paragraphs: readonly Paragraph[], st: CompileState, env: FlowEnv, line: number | null): ObservationLayerBlock {
  const parts: Record<ObservationPart, Inline[] | null> = { claims: null, evidence: null, inference: null, unknown: null };
  for (const paragraph of paragraphs) {
    const part = observationPartOf(paragraph);
    if (part === null) continue;
    const content = trimInline(stripLead(convertPhrasing(paragraph.children.slice(1), st), /^[\s:.]+/u));
    const existing = parts[part];
    parts[part] = existing === null ? content : [...existing, { kind: 'break' }, { kind: 'break' }, ...content];
  }
  const missing = OBSERVATION_PARTS.filter((part) => parts[part] === null);
  if (missing.length > 0) {
    st.report('observation-layer-incomplete', `observation layer lacks: ${missing.join(', ')}`, line);
  }
  return { kind: 'observation-layer', anchor: null, depth: depthOf('observation-layer', env), parts };
}
