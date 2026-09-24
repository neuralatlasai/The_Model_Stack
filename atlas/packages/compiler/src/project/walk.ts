/**
 * Read-only traversal helpers over the compiled research AST, used by the
 * registries, the graph summaries, and search. Pure.
 */
import { assertNever, inlineToText, type Block, type Inline, type Region } from '@atlas/core';

export interface BlockVisit {
  readonly block: Block;
  /** Anchor of the enclosing H2 region, or null for lead blocks. */
  readonly region: Region | null;
}

/** Direct child blocks of a block (lists, quotes, expansions, proofs, experiment fields). */
export function childBlocks(block: Block): readonly Block[] {
  switch (block.kind) {
    case 'list':
      return block.items.flatMap((item) => item.blocks);
    case 'quote':
    case 'expansion':
      return block.blocks;
    case 'proposition':
      return block.proof ?? [];
    case 'experiment':
      return block.fields.flatMap((field) => field.blocks);
    case 'paragraph':
    case 'heading':
    case 'table':
    case 'rule':
    case 'definition':
    case 'claim':
    case 'assumption':
    case 'observation':
    case 'equation':
    case 'algorithm':
    case 'code':
    case 'tensor-trace':
    case 'systems-trace':
    case 'failure-mode':
    case 'open-question':
    case 'note':
    case 'observation-layer':
    case 'sibling':
    case 'figure':
      return [];
    default:
      return assertNever(block);
  }
}

/** Depth-first, document order, every block including nested ones. */
export function* walkBlocks(blocks: readonly Block[], region: Region | null): Generator<BlockVisit> {
  for (const block of blocks) {
    yield { block, region };
    yield* walkBlocks(childBlocks(block), region);
  }
}

/** Every block of a compiled body: lead first, then each region. */
export function* walkDocument(body: { readonly lead: readonly Block[]; readonly regions: readonly Region[] }): Generator<BlockVisit> {
  yield* walkBlocks(body.lead, null);
  for (const region of body.regions) yield* walkBlocks(region.blocks, region);
}

/** Text of the first paragraph among `blocks` (not descending into nested structures), or null. */
export function firstParagraphText(blocks: readonly Block[]): string | null {
  for (const block of blocks) {
    if (block.kind === 'paragraph') {
      const text = inlineToText(block.content).trim();
      if (text !== '') return text;
    }
  }
  return null;
}

/** Plain-text length of one inline node (matches `inlineToText`). */
function inlineLength(node: Inline): number {
  return inlineToText([node]).length;
}

/**
 * Slices inline content by offsets into its `inlineToText` projection,
 * preserving structure: text and code nodes are split; emphasis, strong,
 * delete and links are sliced recursively; atomic nodes (math, cite, label,
 * xref, break) are kept whole when they start inside the range.
 */
export function sliceInline(nodes: readonly Inline[], start: number, end = Number.POSITIVE_INFINITY): Inline[] {
  const out: Inline[] = [];
  let offset = 0;
  for (const node of nodes) {
    const length = inlineLength(node);
    const nodeStart = offset;
    const nodeEnd = offset + length;
    offset = nodeEnd;
    if (nodeEnd <= start || nodeStart >= end) continue;
    const from = Math.max(0, start - nodeStart);
    const to = Math.min(length, end - nodeStart);
    switch (node.kind) {
      case 'text':
      case 'code': {
        const value = node.value.slice(from, to);
        if (value !== '') out.push({ ...node, value });
        break;
      }
      case 'emphasis':
      case 'strong':
      case 'delete':
      case 'link': {
        const children = sliceInline(node.children, from, to);
        if (children.length > 0) out.push({ ...node, children });
        break;
      }
      case 'math':
      case 'cite':
      case 'label':
      case 'xref':
      case 'break':
        if (nodeStart >= start) out.push(node);
        break;
      default:
        assertNever(node);
    }
  }
  return out;
}

/** Trims leading/trailing whitespace and the given punctuation from the text ends of inline content. */
export function trimInline(nodes: readonly Inline[], punctuation = ''): Inline[] {
  const text = inlineToText(nodes);
  const pattern = new RegExp(`^[\\s${escapeClass(punctuation)}]*`, 'u');
  const tailPattern = new RegExp(`[\\s${escapeClass(punctuation)}]*$`, 'u');
  const lead = pattern.exec(text)?.[0].length ?? 0;
  const tail = tailPattern.exec(text.slice(lead))?.[0].length ?? 0;
  return sliceInline(nodes, lead, text.length - tail);
}

function escapeClass(value: string): string {
  return value.replace(/[\\\]^-]/gu, (char) => `\\${char}`);
}
