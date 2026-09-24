/**
 * Differential siblings under `## Siblings` (CONTENT_CONTRACT §7, UI_UX §14):
 *
 *   **MQA / GQA** — [§14.1](../…/14-1-mha-mqa-and-gqa.md)
 *   Why it exists: … What assumption changed: … What objective changed: …
 *   What problem it solved: … What new failure mode it introduced: …
 *   Changed primitive: …
 *
 * Also accepted: the link inside the bold head (`**Name — [§2.5](…).**`), no
 * link at all (`— this file`), fields on one line or on separate lines, and
 * the differential in the paragraph right after the head. A bold-led
 * paragraph with no differential field at all stays prose (nothing is lost).
 */
import { SIBLING_FIELDS, type SiblingBlock, type SiblingField, type Inline } from '@atlas/core';
import type { Paragraph, RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import type { Consumed } from '../flow-types.ts';
import { convertPhrasing } from '../inline.ts';
import { firstLink, splitByMarkers, type InlineMarker } from '../inline-utils.ts';
import { slugify } from '../slug.ts';
import { depthOf, type CompileState, type FlowEnv } from '../state.ts';

const AT_BOUNDARY = String.raw`(?<=^|\n|[.;!?)\]]\s+)`;

export const SIBLING_MARKERS: readonly InlineMarker<SiblingField>[] = [
  { key: 'whyExists', text: new RegExp(String.raw`${AT_BOUNDARY}Why\b[^:\n.]{0,40}?\bexists?\b[^:\n.]{0,30}:`, 'u') },
  { key: 'assumptionChanged', text: new RegExp(String.raw`${AT_BOUNDARY}(?:What assumptions?|Assumptions?) changed\b[^:\n.]{0,40}:`, 'u') },
  { key: 'objectiveChanged', text: new RegExp(String.raw`${AT_BOUNDARY}(?:What objectives?|Objectives?) changed\b[^:\n.]{0,40}:`, 'u') },
  { key: 'problemSolved', text: new RegExp(String.raw`${AT_BOUNDARY}(?:What problems?\b|Problems? solved\b)[^:\n.]{0,40}:`, 'u') },
  { key: 'newFailureMode', text: new RegExp(String.raw`${AT_BOUNDARY}(?:What new|New) failure modes?\b[^:\n.]{0,40}:`, 'u') },
  { key: 'changedPrimitive', text: new RegExp(String.raw`${AT_BOUNDARY}(?:Changed primitives?|Primitives? changed)\b[^:\n.]{0,40}:`, 'u') },
];

const STARTS_WITH_DIFFERENTIAL = /^\s*Why\b[^:\n.]{0,40}?\bexists?\b[^:\n.]{0,30}:/u;

interface Head {
  readonly name: string;
  /** Inline content of the bold head (may hold the link). */
  readonly strong: Inline[];
  /** Everything after the bold head. */
  readonly rest: Inline[];
}

function readHead(paragraph: Paragraph, st: CompileState): Head | null {
  const [lead, ...others] = paragraph.children;
  if (lead?.type !== 'strong') return null;
  const strongText = toString(lead).replace(/\s+/gu, ' ').trim();
  const dashInStrong = /\s[—–]\s/u.exec(strongText);
  const after = others[0];
  const dashAfter = after?.type === 'text' && /^\s*[—–]/u.test(after.value);
  if (dashInStrong === null && !dashAfter) return null;
  const name = (dashInStrong === null ? strongText : strongText.slice(0, dashInStrong.index)).replace(/[.:]+$/u, '').trim();
  if (name === '') return null;
  return { name, strong: convertPhrasing(lead.children, st, {}), rest: convertPhrasing(others, st) };
}

/**
 * Converts a sibling paragraph (and, when its differential is split off, the
 * next paragraph). Returns null when the paragraph is not a sibling head or has
 * no differential fields.
 */
export function convertSibling(
  paragraph: Paragraph,
  next: RootContent | undefined,
  st: CompileState,
  env: FlowEnv,
): Consumed<SiblingBlock> | null {
  const head = readHead(paragraph, st);
  if (head === null) return null;
  const line = st.lineOf(paragraph);
  let content = head.rest;
  let extra = 0;
  let split = splitByMarkers(content, SIBLING_MARKERS);
  if (split.parts.length === 0 && next?.type === 'paragraph' && STARTS_WITH_DIFFERENTIAL.test(toString(next))) {
    content = [...content, { kind: 'text', value: '\n' }, ...convertPhrasing(next.children, st)];
    split = splitByMarkers(content, SIBLING_MARKERS);
    extra = 1;
  }
  if (split.parts.length === 0) {
    st.report('sibling-missing-field', `sibling "${head.name}" has no differential fields (Why it exists: … Changed primitive: …); kept as prose`, line);
    return null;
  }
  const differential: Record<SiblingField, Inline[] | null> = {
    whyExists: null,
    assumptionChanged: null,
    objectiveChanged: null,
    problemSolved: null,
    newFailureMode: null,
    changedPrimitive: null,
  };
  for (const part of split.parts) {
    if (part.content.length === 0) continue;
    const existing = differential[part.key];
    differential[part.key] = existing === null ? part.content : [...existing, { kind: 'text', value: ' ' }, ...part.content];
  }
  const missing = SIBLING_FIELDS.filter((field) => differential[field] === null);
  if (missing.length > 0) {
    st.report('sibling-missing-field', `sibling "${head.name}" lacks ${missing.join(', ')}`, line);
  }
  const link = firstLink(split.prefix) ?? firstLink(head.strong);
  return {
    value: {
      kind: 'sibling',
      anchor: st.anchors.claim(`sib-${slugify(head.name) || 'sibling'}`),
      depth: depthOf('sibling', env),
      name: head.name,
      target: link === null ? null : link.target,
      differential,
    },
    extra,
  };
}
