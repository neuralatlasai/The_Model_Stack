/**
 * mdast phrasing content → research-AST inline nodes (core inline.ts).
 *
 * Inside TEXT only (never inside code, math, or link text) three token
 * families are recognised:
 * - evidence labels (`MATHEMATICALLY-DERIVED`) → `label`;
 * - citation keys (`P19`, `R5.13`, also inside `[…]`) → `cite`, only when the
 *   registry knows the key (unknown `R<ch>.<n>` keys are diagnosed);
 * - textual cross-references (`Eq. 5.4`, `Eq. (5.4)`, `Eqs. 5.4–5.7`,
 *   `Algorithm 5.2`, `Figure 5.3`/`Fig. 5.3`, `Experiment 5.1`,
 *   `Proposition 14.1`) → `xref`, resolved through the context.
 * Raw inline HTML never survives: placeholders such as `<bos>` become text,
 * and anything that looks like a real tag is also text plus a diagnostic.
 */
import {
  EVIDENCE_LABEL_PATTERN,
  isCitationKey,
  isEvidenceLabel,
  type Inline,
  type XRefKind,
} from '@atlas/core';
import type { PhrasingContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import type { CompileState } from './state.ts';

export interface InlineOptions {
  /** Link text: labels are still recognised, citations and cross-references are not (no nested interactives). */
  readonly inLink?: boolean;
}

// ─── raw HTML ────────────────────────────────────────────────────────────────

/**
 * Element names that make an inline or flow html token a real tag. `s` is
 * deliberately absent: `<s>`/`</s>` are sentence-boundary tokens in this book.
 */
const HTML_ELEMENTS: ReadonlySet<string> = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'blockquote', 'br', 'button', 'canvas', 'caption', 'center', 'cite', 'code',
  'col', 'colgroup', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption',
  'figure', 'font', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'iframe', 'img',
  'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'mark', 'math', 'meta', 'nav', 'noscript',
  'object', 'ol', 'option', 'p', 'picture', 'pre', 'q', 'script', 'section', 'select', 'small', 'source', 'span',
  'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot',
  'th', 'thead', 'time', 'tr', 'u', 'ul', 'var', 'video', 'wbr',
]);

export type HtmlKind = 'comment' | 'tag' | 'placeholder';

/**
 * Classifies a raw html token: comments and declarations, real elements (known
 * name, or any tag with attributes), or a placeholder such as `<bos>`,
 * `<unk>`, `<s>`, `<statement>` that is simply text.
 */
export function classifyHtml(value: string): HtmlKind {
  const trimmed = value.trim();
  if (/^<!--|^<!\[CDATA\[|^<![A-Za-z]|^<\?/u.test(trimmed)) return 'comment';
  const tags = [...trimmed.matchAll(/<\/?([A-Za-z][A-Za-z0-9-]*)(\s[^<>]*)?\/?>/gu)];
  for (const tag of tags) {
    const name = (tag[1] ?? '').toLowerCase();
    const attributes = (tag[2] ?? '').trim();
    if (HTML_ELEMENTS.has(name) || attributes.includes('=')) return 'tag';
  }
  return 'placeholder';
}

/** Raw html as literal text (escaped by the renderer). Real tags are diagnosed; comments are dropped. */
export function htmlAsInline(value: string, st: CompileState, line: number | null): Inline[] {
  const kind = classifyHtml(value);
  if (kind === 'comment') {
    st.report('raw-html-dropped', `HTML comment/declaration removed: ${abbreviate(value)}`, line);
    return [];
  }
  if (kind === 'tag') st.report('raw-html-dropped', `raw HTML is not rendered; kept as literal text: ${abbreviate(value)}`, line);
  return [{ kind: 'text', value }];
}

function abbreviate(value: string): string {
  const flat = value.replace(/\s+/gu, ' ').trim();
  return flat.length > 80 ? `${flat.slice(0, 79)}…` : flat;
}

// ─── text recognisers ────────────────────────────────────────────────────────

const CITE_PATTERN = /(?<![A-Za-z0-9_.])(P\d{2}|R\d+\.\d+)(?![A-Za-z0-9_]|\.\d)/gu;
const OBJECT_NUMBER = String.raw`(?:\d+|[A-Z])\.\d+[a-z]?`;
const NUMBER_END = String.raw`(?![\d]|\.\d)`;
/** `5.4` or `(5.4)`; a closing parenthesis is consumed only when it closes an opening one. */
const EQ_NUMBER = (name: string): string => String.raw`(?:\((?<${name}p>${OBJECT_NUMBER})\)|(?<${name}>${OBJECT_NUMBER})${NUMBER_END})`;
const XREF_PATTERN = new RegExp(
  [
    String.raw`(?<eq>\b(?:Eqs?\.|Equations?)\s*${EQ_NUMBER('eqn')}(?:\s*(?:[–—-]|to)\s*(?:\(${OBJECT_NUMBER}\)|${OBJECT_NUMBER}${NUMBER_END}))?)`,
    String.raw`(?<alg>\bAlgorithms?\s+(?<algn>${OBJECT_NUMBER})${NUMBER_END})`,
    String.raw`(?<fig>\b(?:Figures?|Figs?\.)\s*(?<fign>${OBJECT_NUMBER})${NUMBER_END})`,
    String.raw`(?<exp>\bExperiments?\s+(?<expn>${OBJECT_NUMBER})${NUMBER_END})`,
    String.raw`(?<prop>\b(?:Proposition|Theorem|Lemma|Corollary)s?\s+(?<propn>${OBJECT_NUMBER})${NUMBER_END})`,
  ].join('|'),
  'gu',
);

const XREF_GROUPS: readonly (readonly [string, string, XRefKind])[] = [
  ['eq', 'eqn', 'equation'],
  ['alg', 'algn', 'algorithm'],
  ['fig', 'fign', 'figure'],
  ['exp', 'expn', 'experiment'],
  ['prop', 'propn', 'proposition'],
];

interface Token {
  readonly start: number;
  readonly end: number;
  readonly node: Inline;
}

function labelTokens(value: string): Token[] {
  const out: Token[] = [];
  const pattern = new RegExp(EVIDENCE_LABEL_PATTERN.source, 'gu');
  for (const match of value.matchAll(pattern)) {
    const label = match[1] ?? '';
    const end = match.index + match[0].length;
    // `DERIVED:eq-5.8` is a source id, not a label use (a label followed by `: ` still is).
    if (value.charAt(end) === ':' && /\S/u.test(value.charAt(end + 1))) continue;
    if (isEvidenceLabel(label)) out.push({ start: match.index, end, node: { kind: 'label', label } });
  }
  return out;
}

function citeTokens(value: string, st: CompileState, line: number | null): Token[] {
  const out: Token[] = [];
  for (const match of value.matchAll(CITE_PATTERN)) {
    const key = match[1] ?? '';
    if (!isCitationKey(key)) continue;
    if (st.ctx.hasCitation(key)) {
      out.push({ start: match.index, end: match.index + key.length, node: { kind: 'cite', key, resolved: true } });
    } else if (key.startsWith('R')) {
      st.reportOnce(`cite:${key}`, 'citation-unresolved', `citation ${key} has no record in any references.md`, line);
    }
  }
  return out;
}

function xrefTokens(value: string, st: CompileState, line: number | null): Token[] {
  const out: Token[] = [];
  for (const match of value.matchAll(XREF_PATTERN)) {
    const groups = match.groups ?? {};
    for (const [whole, num, kind] of XREF_GROUPS) {
      const text = groups[whole];
      const number = groups[num] ?? groups[`${num}p`];
      if (text === undefined || number === undefined) continue;
      const target = st.ctx.resolveXRef(kind, number);
      if (target === null) {
        st.reportOnce(`xref:${kind}:${number}`, 'xref-unresolved', `${text} does not resolve to a numbered ${kind}`, line);
      }
      out.push({ start: match.index, end: match.index + text.length, node: { kind: 'xref', ref: kind, number, text, target } });
      break;
    }
  }
  return out;
}

/** Splits one text value into text / label / cite / xref nodes. */
export function recogniseText(value: string, st: CompileState, line: number | null, options: InlineOptions = {}): Inline[] {
  const tokens = [...labelTokens(value)];
  if (options.inLink !== true) tokens.push(...citeTokens(value, st, line), ...xrefTokens(value, st, line));
  if (tokens.length === 0) return value === '' ? [] : [{ kind: 'text', value }];
  tokens.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Inline[] = [];
  let cursor = 0;
  for (const token of tokens) {
    if (token.start < cursor) continue; // overlapped by an earlier, longer token
    if (token.start > cursor) out.push({ kind: 'text', value: value.slice(cursor, token.start) });
    out.push(token.node);
    cursor = token.end;
  }
  if (cursor < value.length) out.push({ kind: 'text', value: value.slice(cursor) });
  return out;
}

// ─── phrasing conversion ─────────────────────────────────────────────────────

/** Normalised identifier for link-reference definitions (CommonMark label matching). */
export function definitionKey(label: string): string {
  return label.trim().replace(/\s+/gu, ' ').toLowerCase();
}

export function convertPhrasing(nodes: readonly PhrasingContent[], st: CompileState, options: InlineOptions = {}): Inline[] {
  const out: Inline[] = [];
  for (const node of nodes) out.push(...convertOne(node, st, options));
  return out;
}

function convertOne(node: PhrasingContent, st: CompileState, options: InlineOptions): Inline[] {
  const line = st.lineOf(node);
  switch (node.type) {
    case 'text':
      return recogniseText(node.value, st, line, options);
    case 'emphasis':
      return [{ kind: 'emphasis', children: convertPhrasing(node.children, st, options) }];
    case 'strong':
      return [{ kind: 'strong', children: convertPhrasing(node.children, st, options) }];
    case 'delete':
      return [{ kind: 'delete', children: convertPhrasing(node.children, st, options) }];
    case 'inlineCode':
      return [{ kind: 'code', value: node.value }];
    case 'inlineMath':
      return [renderInlineMath(node.value, st, line)];
    case 'break':
      return [{ kind: 'break' }];
    case 'link':
      return [linkNode(node.url, node.children, st)];
    case 'linkReference': {
      const url = st.definitions.get(definitionKey(node.label ?? node.identifier));
      if (url !== undefined) return [linkNode(url, node.children, st)];
      return recogniseText(`[${toString(node)}]`, st, line, options);
    }
    case 'image':
    case 'imageReference':
      return node.alt === null || node.alt === undefined || node.alt === '' ? [] : [{ kind: 'text', value: node.alt }];
    case 'footnoteReference':
      return [{ kind: 'text', value: `[^${node.label ?? node.identifier}]` }];
    case 'html':
      return htmlAsInline(node.value, st, line);
    default:
      return recogniseText(toString(node), st, line, options);
  }
}

function linkNode(url: string, children: readonly PhrasingContent[], st: CompileState): Inline {
  const target = st.ctx.resolveLink(url);
  const content = convertPhrasing(children, st, { inLink: true });
  return { kind: 'link', target, children: content.length > 0 ? content : [{ kind: 'text', value: url }] };
}

function renderInlineMath(tex: string, st: CompileState, line: number | null): Inline {
  try {
    return { kind: 'math', tex, html: st.ctx.renderMath(tex, false) };
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    st.report('equation-render-error', `inline math $${tex}$ failed to render: ${reason}`, line);
    return { kind: 'code', value: tex };
  }
}
