/**
 * Edition-1.0 evidence rules (CONTENT_CONTRACT §6, CLAUDE.md §3):
 * - `EMPIRICALLY-OBSERVED` must not be used as a label → `label-forbidden`;
 * - `CODE-VERIFIED` must state repository + commit + check → when the
 *   paragraph (or cell, or heading) that uses it never mentions a commit →
 *   `code-verified-without-commit`.
 *
 * The rules target label USE, not label MENTION: manuscripts legitimately say
 * "No result is EMPIRICALLY-OBSERVED in this edition" or "CODE-VERIFIED is not
 * used". An occurrence is a mention when a negation (no / not / never / nor /
 * without) precedes it in the same sentence, or when it is immediately
 * followed by a negated or prohibitive predicate ("does not appear",
 * "is not used", "is forbidden"). Code spans, math, and code blocks are not
 * prose and are never checked.
 */
import { EVIDENCE_LABEL_PATTERN } from '@atlas/core';
import type { Nodes, PhrasingContent } from 'mdast';
import type { CompileState } from './state.ts';

function phrasingPlain(nodes: readonly PhrasingContent[]): string {
  let out = '';
  for (const node of nodes) {
    switch (node.type) {
      case 'text':
        out += node.value;
        break;
      case 'emphasis':
      case 'strong':
      case 'delete':
      case 'link':
      case 'linkReference':
        out += phrasingPlain(node.children);
        break;
      case 'break':
        out += ' ';
        break;
      default:
        // inline code, inline math, raw html, images, footnote references: not prose.
        out += ' ';
        break;
    }
  }
  return out;
}

const NEGATION_BEFORE = /\b(?:no|not|never|nor|without|neither|none|nothing)\b/iu;
const NEGATION_AFTER = /^\W{0,3}(?:(?:is|are|was|were|does|do|did|has|have|must|may|should|can)\s+)?(?:not|never)\b|^\W{0,3}(?:is\s+|are\s+)?(?:forbidden|absent|excluded|prohibited)\b/iu;

/** True when the label occurrence at [start, end) is mentioned rather than used. */
export function isMention(text: string, start: number, end: number): boolean {
  const before = text.slice(0, start);
  const boundary = Math.max(before.lastIndexOf('. '), before.lastIndexOf('; '), before.lastIndexOf('? '), before.lastIndexOf('! '));
  const sentenceHead = before.slice(boundary === -1 ? 0 : boundary + 2);
  if (NEGATION_BEFORE.test(sentenceHead)) return true;
  return NEGATION_AFTER.test(text.slice(end, end + 48));
}

function checkText(text: string, line: number | null, st: CompileState): void {
  const pattern = new RegExp(EVIDENCE_LABEL_PATTERN.source, 'gu');
  for (const match of text.matchAll(pattern)) {
    const label = match[1];
    if (label !== 'EMPIRICALLY-OBSERVED' && label !== 'CODE-VERIFIED') continue;
    const start = match.index;
    const end = start + match[0].length;
    if (isMention(text, start, end)) continue;
    if (label === 'EMPIRICALLY-OBSERVED') {
      st.report('label-forbidden', 'EMPIRICALLY-OBSERVED is used as an evidence label; Edition 1.0 ran no experiments', line);
    } else if (!/\bcommit\b/iu.test(text)) {
      st.report('code-verified-without-commit', 'CODE-VERIFIED is used without naming the repository commit and the check performed', line);
    }
  }
}

/** Walks every prose container of the (normalised) tree. */
export function checkEvidenceRules(node: Nodes, st: CompileState): void {
  switch (node.type) {
    case 'paragraph':
    case 'heading':
    case 'tableCell':
      checkText(phrasingPlain(node.children), st.lineOf(node), st);
      return;
    case 'root':
    case 'blockquote':
    case 'list':
    case 'listItem':
    case 'table':
    case 'tableRow':
    case 'footnoteDefinition':
      for (const child of node.children) checkEvidenceRules(child, st);
      return;
    default:
      return;
  }
}
