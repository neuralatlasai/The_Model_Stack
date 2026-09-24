/**
 * Display math (`$$ … $$`) → EquationBlock. The paragraph that follows may
 * carry the tag and the variable table:
 *
 *   *(Eq. 5.4)* where L = layers, S = sequence length, …
 *
 * The tag gives the number and the anchor (`eq-5-4`); the rest of the line is
 * the note, and a `where …` clause is parsed into variables for the equation
 * inspector. TeX is rendered once, here, by the context's KaTeX renderer.
 */
import { inlineToText, objectAnchor, type EquationBlock, type EquationVariable } from '@atlas/core';
import type { Math as MathNode } from 'mdast-util-math';
import type { Paragraph, PhrasingContent, RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import type { Consumed } from '../flow-types.ts';
import { convertPhrasing } from '../inline.ts';
import { splitTopLevel, trimInline } from '../inline-utils.ts';
import { depthOf, type CompileState, type FlowEnv } from '../state.ts';

const TAG = /^\(\s*Eq\.?\s*((?:\d+|[A-Z])\.\d+[a-z]?)\s*\)/u;

export function escapeHtml(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

interface Tag {
  readonly number: string;
  readonly rest: PhrasingContent[];
}

/** Recognises `*(Eq. 5.4)* …` or `(Eq. 5.4) …` at the start of a paragraph. */
export function equationTag(paragraph: Paragraph): Tag | null {
  const [first, ...others] = paragraph.children;
  if (first === undefined) return null;
  if (first.type === 'emphasis' || first.type === 'strong') {
    const match = TAG.exec(toString(first).trim());
    if (match?.[0].length !== toString(first).trim().length) return null;
    return { number: match[1] ?? '', rest: others };
  }
  if (first.type === 'text') {
    const match = TAG.exec(first.value);
    if (match === null) return null;
    const remainder = first.value.slice(match[0].length);
    const rest: PhrasingContent[] = remainder === '' ? others : [{ ...first, value: remainder }, ...others];
    return { number: match[1] ?? '', rest };
  }
  return null;
}

/**
 * `where L = layers, S = sequence length; b = bytes per value.` → variables.
 * Splits at top-level commas/semicolons of the first sentence; a fragment with
 * no `=` continues the previous meaning.
 */
export function parseWhereClause(text: string): EquationVariable[] {
  const lead = /^\s*where\s+/iu.exec(text);
  if (lead === null) return [];
  let clause = text.slice(lead[0].length);
  const stop = /\.(?=\s+[A-Z"“(*]|\s*$)/u.exec(clause);
  if (stop !== null) clause = clause.slice(0, stop.index);
  const out: { symbol: string; meaning: string }[] = [];
  for (const fragment of splitTopLevel(clause, new Set([',', ';']))) {
    const piece = fragment.trim().replace(/^and\s+/u, '');
    if (piece === '') continue;
    const spaced = /^(.{1,40}?)\s+=\s+([\s\S]+)$/u.exec(piece);
    const tight = spaced === null ? /^([^\s=]{1,12})=([\s\S]+)$/u.exec(piece) : null;
    const match = spaced ?? tight;
    if (match !== null) {
      out.push({ symbol: (match[1] ?? '').trim(), meaning: (match[2] ?? '').trim().replace(/[.;]+$/u, '') });
    } else {
      const last = out.at(-1);
      if (last !== undefined) last.meaning = `${last.meaning}, ${piece.replace(/[.;]+$/u, '')}`;
    }
  }
  return out.filter((variable) => variable.symbol !== '' && variable.meaning !== '');
}

export function convertEquation(
  node: MathNode,
  next: RootContent | undefined,
  st: CompileState,
  env: FlowEnv,
): Consumed<EquationBlock> {
  const tex = node.value;
  const line = st.lineOf(node);
  let html: string;
  try {
    html = st.ctx.renderMath(tex, true);
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    st.report('equation-render-error', `display math failed to render: ${reason}`, line);
    html = `<code>${escapeHtml(tex)}</code>`;
  }

  const tag = next?.type === 'paragraph' ? equationTag(next) : null;
  if (tag === null) {
    return {
      value: { kind: 'equation', anchor: null, depth: depthOf('equation', env), number: null, tex, html, note: null, variables: [] },
      extra: 0,
    };
  }
  if (st.equationNumbers.has(tag.number)) {
    st.report('equation-duplicate-number', `Eq. ${tag.number} is tagged more than once in this document`, st.lineOf(next));
  }
  st.equationNumbers.add(tag.number);
  const note = trimInline(convertPhrasing(tag.rest, st));
  return {
    value: {
      kind: 'equation',
      anchor: st.anchors.claim(objectAnchor('eq', tag.number)),
      depth: depthOf('equation', env),
      number: tag.number,
      tex,
      html,
      note: note.length === 0 ? null : note,
      variables: parseWhereClause(inlineToText(note)),
    },
    extra: 1,
  };
}
