/**
 * Pure operations on research-AST inline sequences: trimming, slicing by
 * plain-text offset, and splitting at field markers. Typed blocks use these to
 * carve `*Symptom:* … *Cause:* …`, `Why it exists: … What assumption changed:
 * …`, `· *sensitivity:* …` and similar authored grammars out of one paragraph
 * without losing inline structure (math, citations, links) inside each part.
 */
import { inlineToText, type Inline } from '@atlas/core';

type ContainerInline = Extract<Inline, { readonly children: readonly Inline[] }>;

function isContainer(node: Inline): node is ContainerInline {
  return node.kind === 'emphasis' || node.kind === 'strong' || node.kind === 'delete' || node.kind === 'link';
}

function withChildren(node: ContainerInline, children: readonly Inline[]): Inline {
  switch (node.kind) {
    case 'emphasis':
      return { kind: 'emphasis', children };
    case 'strong':
      return { kind: 'strong', children };
    case 'delete':
      return { kind: 'delete', children };
    case 'link':
      return { kind: 'link', target: node.target, children };
  }
}

/** Plain text of a sequence (see core `inlineToText`). */
export function plainText(nodes: readonly Inline[]): string {
  return inlineToText(nodes);
}

/** Text that counts as prose: math and code are excluded (word counts, sentence detection). */
export function proseText(nodes: readonly Inline[]): string {
  let out = '';
  for (const node of nodes) {
    switch (node.kind) {
      case 'text':
        out += node.value;
        break;
      case 'code':
      case 'math':
        out += ' ';
        break;
      case 'break':
        out += ' ';
        break;
      case 'cite':
        out += node.key;
        break;
      case 'label':
        out += node.label;
        break;
      case 'xref':
        out += node.text;
        break;
      case 'emphasis':
      case 'strong':
      case 'delete':
      case 'link':
        out += proseText(node.children);
        break;
    }
  }
  return out;
}

function isEmptyText(node: Inline): boolean {
  return node.kind === 'text' && node.value === '';
}

/** Drops empty text nodes and empty containers (shallow for containers' own emptiness). */
function compact(nodes: readonly Inline[]): Inline[] {
  const out: Inline[] = [];
  for (const node of nodes) {
    if (isEmptyText(node)) continue;
    if (isContainer(node) && node.children.length === 0) continue;
    out.push(node);
  }
  return out;
}

/** Removes a leading match of `pattern` (anchored at the start) from the first text of the sequence. */
export function stripLead(nodes: readonly Inline[], pattern: RegExp): Inline[] {
  const list = compact(nodes);
  const first = list[0];
  if (first === undefined) return list;
  if (first.kind === 'text') {
    const match = pattern.exec(first.value);
    if (match?.index !== 0) return list;
    return compact([{ kind: 'text', value: first.value.slice(match[0].length) }, ...list.slice(1)]);
  }
  if (isContainer(first)) {
    const inner = stripLead(first.children, pattern);
    return compact([withChildren(first, inner), ...list.slice(1)]);
  }
  return list;
}

/** Removes a trailing match of `pattern` (which should end with `$`) from the last text of the sequence. */
export function stripTrail(nodes: readonly Inline[], pattern: RegExp): Inline[] {
  const list = compact(nodes);
  const last = list.at(-1);
  if (last === undefined) return list;
  if (last.kind === 'text') {
    const match = pattern.exec(last.value);
    if (match === null) return list;
    return compact([...list.slice(0, -1), { kind: 'text', value: last.value.slice(0, match.index) }]);
  }
  if (isContainer(last)) {
    const inner = stripTrail(last.children, pattern);
    return compact([...list.slice(0, -1), withChildren(last, inner)]);
  }
  return list;
}

/** Trims whitespace (and stray line breaks) at both ends. */
export function trimInline(nodes: readonly Inline[]): Inline[] {
  let list = compact(nodes);
  while (list[0]?.kind === 'break') list = list.slice(1);
  while (list.at(-1)?.kind === 'break') list = list.slice(0, -1);
  return stripTrail(stripLead(list, /^\s+/u), /\s+$/u);
}

function nodeLength(node: Inline): number {
  return inlineToText([node]).length;
}

/**
 * Slice by plain-text offsets (`inlineToText` coordinates), `[start, end)`.
 * Text is cut; atomic nodes (code, math, cite, label, xref, break) are kept
 * only when they start inside the range; containers are sliced recursively.
 */
export function sliceInline(nodes: readonly Inline[], start: number, end: number): Inline[] {
  const out: Inline[] = [];
  let offset = 0;
  for (const node of nodes) {
    const length = nodeLength(node);
    const nodeStart = offset;
    const nodeEnd = offset + length;
    offset = nodeEnd;
    if (nodeEnd <= start || nodeStart >= end) continue;
    if (node.kind === 'text') {
      out.push({ kind: 'text', value: node.value.slice(Math.max(0, start - nodeStart), Math.min(length, end - nodeStart)) });
    } else if (isContainer(node)) {
      const children = sliceInline(node.children, start - nodeStart, end - nodeStart);
      if (children.length > 0) out.push(withChildren(node, children));
    } else if (nodeStart >= start) {
      out.push(node);
    }
  }
  return compact(out);
}

/** First link target in document order, searching containers. */
export function firstLink(nodes: readonly Inline[]): Extract<Inline, { kind: 'link' }> | null {
  for (const node of nodes) {
    if (node.kind === 'link') return node;
    if (isContainer(node)) {
      const inner = firstLink(node.children);
      if (inner !== null) return inner;
    }
  }
  return null;
}

/**
 * A field marker inside a paragraph:
 * - `styled`: an emphasis/strong node whose whole text matches (`*Symptom:*`);
 * - `text`: a match inside a text node (`Why it exists:`). Must not carry the `g` flag.
 */
export interface InlineMarker<K extends string> {
  readonly key: K;
  readonly styled?: RegExp;
  readonly text?: RegExp;
}

export interface MarkerPart<K extends string> {
  readonly key: K;
  readonly content: Inline[];
}

export interface MarkerSplit<K extends string> {
  /** Content before the first marker. */
  readonly prefix: Inline[];
  readonly parts: MarkerPart<K>[];
}

const LEAD_JOINERS = /^[\s:·]+/u;
const TRAIL_JOINERS = /[\s·—–]+$/u;

function globalClone(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
}

function isStyledMarker<K extends string>(node: Inline, markers: readonly InlineMarker<K>[]): boolean {
  if (node.kind !== 'emphasis' && node.kind !== 'strong') return false;
  const text = inlineToText(node.children).trim();
  return markers.some((marker) => marker.styled?.test(text) === true);
}

function containsStyledMarker<K extends string>(nodes: readonly Inline[], markers: readonly InlineMarker<K>[]): boolean {
  return nodes.some((node) => isStyledMarker(node, markers) || ((node.kind === 'emphasis' || node.kind === 'strong') && containsStyledMarker(node.children, markers)));
}

/**
 * Unwraps emphasis/strong that swallowed a marker. Stray asterisks in prose
 * (`N*`, `R*_D`) can make the parser open an emphasis that runs across
 * `*Cause:*`; hoisting its children restores the authored field structure.
 */
function hoistMarkers<K extends string>(nodes: readonly Inline[], markers: readonly InlineMarker<K>[]): Inline[] {
  const out: Inline[] = [];
  for (const node of nodes) {
    if ((node.kind === 'emphasis' || node.kind === 'strong') && !isStyledMarker(node, markers) && containsStyledMarker(node.children, markers)) {
      out.push(...hoistMarkers(node.children, markers));
    } else {
      out.push(node);
    }
  }
  return out;
}

/**
 * Splits a top-level inline sequence at markers. Each part's content is
 * trimmed of joining punctuation (`:`, `·`, whitespace) at its start and of
 * trailing joiners (`·`, dashes) before the next marker.
 */
export function splitByMarkers<K extends string>(input: readonly Inline[], markers: readonly InlineMarker<K>[]): MarkerSplit<K> {
  const nodes = hoistMarkers(input, markers);
  const textMarkers = markers
    .filter((marker): marker is InlineMarker<K> & { readonly text: RegExp } => marker.text !== undefined)
    .map((marker) => ({ key: marker.key, re: globalClone(marker.text) }));
  const segments: { key: K | null; content: Inline[] }[] = [{ key: null, content: [] }];
  const current = (): Inline[] => {
    const last = segments.at(-1);
    if (last === undefined) throw new Error('splitByMarkers: segment stack is empty');
    return last.content;
  };

  for (const node of nodes) {
    if ((node.kind === 'emphasis' || node.kind === 'strong') && markers.some((marker) => marker.styled !== undefined)) {
      const text = inlineToText(node.children).trim();
      const hit = markers.find((marker) => marker.styled?.test(text) === true);
      if (hit !== undefined) {
        segments.push({ key: hit.key, content: [] });
        continue;
      }
    }
    if (node.kind === 'text' && textMarkers.length > 0) {
      let pos = 0;
      for (;;) {
        let best: { key: K; index: number; end: number } | null = null;
        for (const marker of textMarkers) {
          marker.re.lastIndex = pos;
          const match = marker.re.exec(node.value);
          if (match !== null && (best === null || match.index < best.index)) {
            best = { key: marker.key, index: match.index, end: match.index + match[0].length };
          }
        }
        if (best === null) break;
        if (best.index > pos) current().push({ kind: 'text', value: node.value.slice(pos, best.index) });
        segments.push({ key: best.key, content: [] });
        pos = best.end === best.index ? best.end + 1 : best.end;
      }
      if (pos < node.value.length) current().push({ kind: 'text', value: node.value.slice(pos) });
      continue;
    }
    current().push(node);
  }

  const clean = (content: readonly Inline[]): Inline[] => trimInline(stripTrail(stripLead(content, LEAD_JOINERS), TRAIL_JOINERS));
  const [head, ...rest] = segments;
  const parts: MarkerPart<K>[] = [];
  for (const segment of rest) {
    if (segment.key !== null) parts.push({ key: segment.key, content: clean(segment.content) });
  }
  return { prefix: trimInline(stripTrail(head?.content ?? [], TRAIL_JOINERS)), parts };
}

/** Splits plain text on a separator at nesting depth 0 of (), [], {}. */
export function splitTopLevel(text: string, separators: ReadonlySet<string>): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text.charAt(i);
    if (ch === '(' || ch === '[' || ch === '{') depth += 1;
    else if ((ch === ')' || ch === ']' || ch === '}') && depth > 0) depth -= 1;
    else if (depth === 0 && separators.has(ch)) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out;
}
