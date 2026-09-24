/**
 * Markdown → mdast, plus one structural normalisation.
 *
 * Parsing uses CommonMark + GFM (tables, strikethrough, autolinks, footnotes)
 * + math (`$$…$$` display and single-dollar inline math). Raw HTML is never
 * interpreted: the only structural HTML in the manuscripts is
 * `<details><summary>…</summary>…</details>`. CommonMark hands such a block to
 * us either as separate `html` nodes around ordinary Markdown (when blank lines
 * separate them) or as ONE `html` node that swallows the Markdown inside (when
 * they do not). `normaliseDetails` rewrites the second form into the first so
 * that every later pass sees `<details>`, `<summary>…</summary>`, content
 * nodes, `</details>` as siblings, with correct source lines.
 */
import type { BlockContent, DefinitionContent, Html, Nodes, Root, RootContent } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { mathFromMarkdown } from 'mdast-util-math';
import { gfm } from 'micromark-extension-gfm';
import { math } from 'micromark-extension-math';

/** Parses a Markdown string into mdast without any normalisation. */
export function parseRaw(source: string): Root {
  return fromMarkdown(source, {
    extensions: [gfm(), math()],
    mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
  });
}

/** Parses a document body and normalises `<details>` structure (see module comment). */
export function parseMarkdown(source: string): Root {
  const root = parseRaw(source);
  normaliseDetails(root);
  return root;
}

/** Tags that are structural in `<details>` expansions; everything else in raw HTML is text. */
const DETAILS_TOKEN = /<details\b[^>]*>|<\/details\s*>|<summary\b[^>]*>[\s\S]*?<\/summary\s*>/giu;

export function isDetailsOpen(value: string): boolean {
  return /^<details\b[^>]*>$/iu.test(value.trim());
}

export function isDetailsClose(value: string): boolean {
  return /^<\/details\s*>$/iu.test(value.trim());
}

/** Returns the inner text of a `<summary>…</summary>` html node, or null. */
export function summaryText(value: string): string | null {
  const match = /^<summary\b[^>]*>([\s\S]*?)<\/summary\s*>$/iu.exec(value.trim());
  return match === null ? null : (match[1] ?? '');
}

const FLOW_TYPES: ReadonlySet<string> = new Set([
  'blockquote',
  'code',
  'heading',
  'html',
  'list',
  'math',
  'paragraph',
  'table',
  'thematicBreak',
  'definition',
  'footnoteDefinition',
]);

function isRootContent(node: RootContent): node is RootContent {
  return typeof node.type === 'string';
}

function isFlowContent(node: RootContent): node is BlockContent | DefinitionContent {
  return FLOW_TYPES.has(node.type);
}

/** Moves every position in a subtree down by `delta` lines (re-parsed fragments start at line 1). */
function shiftLines(node: Nodes, delta: number): void {
  if (node.position !== undefined) {
    node.position = {
      start: { ...node.position.start, line: node.position.start.line + delta },
      end: { ...node.position.end, line: node.position.end.line + delta },
    };
  }
  if ('children' in node) {
    for (const child of node.children) shiftLines(child, delta);
  }
}

function countNewlines(text: string): number {
  let count = 0;
  for (const ch of text) if (ch === '\n') count += 1;
  return count;
}

function htmlNode(value: string, line: number): Html {
  return {
    type: 'html',
    value,
    position: { start: { line, column: 1 }, end: { line: line + countNewlines(value), column: 1 } },
  };
}

/** Splits one html node that contains details/summary tags into structural tags and re-parsed Markdown. */
function splitDetailsHtml(node: Html): RootContent[] {
  const startLine = node.position?.start.line ?? 1;
  const value = node.value;
  const out: RootContent[] = [];
  let cursor = 0;
  const pushMarkdown = (text: string, offset: number): void => {
    if (text.trim() === '') return;
    const fragment = parseRaw(text);
    normaliseDetails(fragment);
    const delta = startLine - 1 + countNewlines(value.slice(0, offset));
    for (const child of fragment.children) {
      shiftLines(child, delta);
      out.push(child);
    }
  };
  for (const match of value.matchAll(DETAILS_TOKEN)) {
    const at = match.index;
    pushMarkdown(value.slice(cursor, at), cursor);
    out.push(htmlNode(match[0], startLine + countNewlines(value.slice(0, at))));
    cursor = at + match[0].length;
  }
  pushMarkdown(value.slice(cursor), cursor);
  return out;
}

function normaliseChildren<T extends RootContent>(children: T[], accept: (node: RootContent) => node is T): T[] {
  const out: T[] = [];
  for (const child of children) {
    if (child.type === 'html' && /<\/?details\b|<summary\b/iu.test(child.value) && !isSingleStructuralTag(child.value)) {
      for (const piece of splitDetailsHtml(child)) {
        if (accept(piece)) out.push(piece);
      }
      continue;
    }
    normaliseDetails(child);
    out.push(child);
  }
  return out;
}

function isSingleStructuralTag(value: string): boolean {
  return isDetailsOpen(value) || isDetailsClose(value) || summaryText(value) !== null;
}

/**
 * Rewrites, in place, every flow-level html node that bundles details/summary
 * tags with content. Only flow containers (root, blockquote, list items,
 * footnote definitions) are visited; inline html is left for the inline pass.
 */
export function normaliseDetails(node: Nodes): void {
  switch (node.type) {
    case 'root':
      node.children = normaliseChildren(node.children, isRootContent);
      return;
    case 'blockquote':
    case 'listItem':
    case 'footnoteDefinition':
      node.children = normaliseChildren(node.children, isFlowContent);
      return;
    case 'list':
      for (const item of node.children) normaliseDetails(item);
      return;
    default:
      return;
  }
}
