/**
 * Compact header anatomy (UI_UX §9, CONTENT_CONTRACT §3 items 1–4):
 *
 *   VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 05     identity line
 *   # 05 — A minimal Transformer and its execution trace         number + title
 *   <one-sentence thesis>                                        chapters
 *   6 sections · 2 spine papers · … · updated 2026-09-20          metadata line
 *
 * Section files take their thesis from the Scope objective sentence instead.
 * Everything else before the first H2 is the document lead.
 */
import type { Block, DocumentHeader, Inline, NodeMeta } from '@atlas/core';
import type { RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { inlineOf } from './convert.ts';
import { plainText, sliceInline, trimInline } from './inline-utils.ts';
import type { CompileState } from './state.ts';

export interface HeaderResult {
  readonly header: DocumentHeader;
  readonly leadNodes: readonly RootContent[];
}

function squash(text: string): string {
  return text.replace(/\s+/gu, ' ').trim();
}

/** `VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 05`: upper-case, slash-separated. */
export function isIdentityLine(text: string): boolean {
  const flat = squash(text);
  return flat.includes('/') && flat === flat.toUpperCase() && /[A-Z]/u.test(flat) && flat.length <= 200;
}

/** `6 sections · 2 spine papers · … · updated 2026-09-20`. */
export function isMetaLine(text: string): boolean {
  const flat = squash(text);
  return /^\d+\s+sections?\b/iu.test(flat) || (flat.includes('·') && /\bupdated\s+\d{4}-\d{2}-\d{2}\b/iu.test(flat));
}

/** Splits `05 — Title`, `5.2 Title`, `Appendix A — Title`, `Part III — Title` into number and title. */
export function splitTitle(text: string, meta: NodeMeta): { number: string | null; title: string } {
  const flat = squash(text);
  const section = /^((?:\d+|[A-Z])\.\d+)\s+(.+)$/u.exec(flat);
  if (section !== null) return { number: section[1] ?? null, title: section[2] ?? flat };
  const chapter = /^(\d{1,3})\s*[—–-]\s*(.+)$/u.exec(flat);
  if (chapter !== null) return { number: chapter[1] ?? null, title: chapter[2] ?? flat };
  const appendix = /^Appendix\s+([A-Z])\s*[—–:-]\s*(.+)$/iu.exec(flat);
  if (appendix !== null) return { number: appendix[1] ?? null, title: appendix[2] ?? flat };
  const volumePart = /^(?:Volume|Part)\s+([IVXLC]+|\d+)\s*[—–:-]\s*(.+)$/iu.exec(flat);
  if (volumePart !== null) return { number: volumePart[1] ?? null, title: volumePart[2] ?? flat };
  if (meta.entityType === 'section' && meta.section !== null) return { number: meta.section, title: flat };
  if (meta.entityType === 'chapter' && meta.chapter !== null) return { number: String(meta.chapter).padStart(2, '0'), title: flat };
  return { number: null, title: flat };
}

export function buildHeader(front: readonly RootContent[], st: CompileState): HeaderResult {
  const meta = st.input.meta;
  const h1Index = front.findIndex((node) => node.type === 'heading' && node.depth === 1);
  const leadNodes: RootContent[] = [];
  let identityLine: string | null = null;
  let number: string | null = null;
  let title = meta.title;
  let thesis: Inline[] | null = null;
  let metaLine: Inline[] | null = null;

  if (h1Index === -1) {
    st.report('block-malformed', 'document has no H1 title; the frontmatter title is used', 1);
  }

  for (const [index, node] of front.entries()) {
    if (index === h1Index && node.type === 'heading') {
      const split = splitTitle(toString(node), meta);
      number = split.number;
      title = split.title;
      continue;
    }
    if (node.type === 'paragraph') {
      const text = toString(node);
      if (identityLine === null && (h1Index === -1 || index < h1Index) && isIdentityLine(text)) {
        identityLine = squash(text);
        continue;
      }
      if (h1Index !== -1 && index > h1Index && metaLine === null && isMetaLine(text) && onlyHeaderBetween(front, h1Index, index)) {
        metaLine = inlineOf(node.children, st);
        continue;
      }
      if (meta.entityType === 'chapter' && thesis === null && metaLine === null && index === h1Index + 1) {
        thesis = inlineOf(node.children, st);
        continue;
      }
    }
    leadNodes.push(node);
  }

  if (number === null && h1Index === -1) number = splitTitle(meta.title, meta).number;
  return { header: { identityLine, number, title, thesis, metaLine }, leadNodes };
}

/** True when every node between the H1 and `index` is a paragraph (the thesis), so the meta line sits in the header. */
function onlyHeaderBetween(front: readonly RootContent[], h1Index: number, index: number): boolean {
  return front.slice(h1Index + 1, index).every((node) => node.type === 'paragraph') && index - h1Index <= 2;
}

const OBJECTIVE = /^\s*Objective\s*[:.]\s*/u;
const SENTENCE_END = /[.!?](?=\s+[A-Z(“"[]|\s*$)/gu;

/** The Scope objective sentence of a section: text after `Objective:` up to the first sentence end. */
export function objectiveSentence(blocks: readonly Block[]): Inline[] | null {
  for (const block of blocks) {
    if (block.kind !== 'paragraph') continue;
    const text = plainText(block.content);
    const lead = OBJECTIVE.exec(text);
    if (lead === null) continue;
    SENTENCE_END.lastIndex = lead[0].length;
    const end = SENTENCE_END.exec(text);
    const stop = end === null ? text.length : end.index + 1;
    const sentence = trimInline(sliceInline(block.content, lead[0].length, stop));
    return sentence.length > 0 ? sentence : null;
  }
  return null;
}
