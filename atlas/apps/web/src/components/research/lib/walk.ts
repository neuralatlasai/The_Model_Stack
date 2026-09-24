/**
 * Block-tree traversal for renderers that need objects defined elsewhere in
 * the document (rail instruments resolve equation, sibling, failure-mode, and
 * term anchors to their blocks). Pure; depth-first in document order.
 */
import type { Block, BlockKind, BlockOf, Region, ResearchDocument } from '@atlas/core';
import { assertNever } from '@atlas/core';

export function isBlockKind<K extends BlockKind>(block: Block, kind: K): block is BlockOf<K> {
  return block.kind === kind;
}

/** Direct child blocks of a container block (lists, quotes, expansions, proofs, experiment fields). */
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

/** Every block, nested ones included, in document order. */
export function* iterateBlocks(blocks: readonly Block[]): Generator<Block> {
  for (const block of blocks) {
    yield block;
    yield* iterateBlocks(childBlocks(block));
  }
}

/** Every block of a document: lead first, then each region. */
export function* documentBlocks(doc: Pick<ResearchDocument, 'lead' | 'regions'>): Generator<Block> {
  yield* iterateBlocks(doc.lead);
  for (const region of doc.regions) yield* iterateBlocks(region.blocks);
}

/** All blocks of one kind in a block list (nested included), in order. */
export function blocksOfKind<K extends BlockKind>(blocks: readonly Block[], kind: K): BlockOf<K>[] {
  const out: BlockOf<K>[] = [];
  for (const block of iterateBlocks(blocks)) {
    if (isBlockKind(block, kind)) out.push(block);
  }
  return out;
}

/** The block of a kind whose anchor matches, or null. */
export function findBlock<K extends BlockKind>(
  doc: Pick<ResearchDocument, 'lead' | 'regions'>,
  kind: K,
  anchor: string,
): BlockOf<K> | null {
  for (const block of documentBlocks(doc)) {
    if (isBlockKind(block, kind) && block.anchor === anchor) return block;
  }
  return null;
}

/** The definition block that owns a glossary slug in this document, or null. */
export function findDefinition(doc: Pick<ResearchDocument, 'lead' | 'regions'>, slug: string): BlockOf<'definition'> | null {
  for (const block of documentBlocks(doc)) {
    if (isBlockKind(block, 'definition') && block.termSlug === slug) return block;
  }
  return null;
}

/** Sibling blocks of a region in order (the Siblings region's strip). */
export function regionSiblings(region: Pick<Region, 'blocks'>): BlockOf<'sibling'>[] {
  return blocksOfKind(region.blocks, 'sibling');
}
