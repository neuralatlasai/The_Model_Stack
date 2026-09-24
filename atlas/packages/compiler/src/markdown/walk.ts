/**
 * Read-only traversal of the compiled block tree: every block (nested ones
 * included) and every inline sequence a block owns. Rail, outline, stats and
 * citation order are all projections computed with these two walkers.
 */
import { assertNever, type Block, type Inline } from '@atlas/core';

/** Blocks nested directly inside `block`, in reading order. */
export function childBlocks(block: Block): readonly Block[] {
  switch (block.kind) {
    case 'quote':
    case 'expansion':
      return block.blocks;
    case 'list':
      return block.items.flatMap((item) => item.blocks);
    case 'proposition':
      return block.proof ?? [];
    case 'experiment':
      return block.fields.flatMap((field) => field.blocks);
    default:
      return [];
  }
}

/** Visits every block depth-first in reading order. */
export function walkBlocks(blocks: readonly Block[], visit: (block: Block) => void): void {
  for (const block of blocks) {
    visit(block);
    walkBlocks(childBlocks(block), visit);
  }
}

function present(...parts: (readonly Inline[] | null)[]): (readonly Inline[])[] {
  return parts.filter((part): part is readonly Inline[] => part !== null);
}

/** Inline sequences owned by the block itself (not by nested blocks), in reading order. */
export function ownInlines(block: Block): (readonly Inline[])[] {
  switch (block.kind) {
    case 'paragraph':
    case 'heading':
    case 'definition':
    case 'claim':
    case 'observation':
    case 'note':
      return [block.content];
    case 'proposition':
      return [block.content];
    case 'assumption':
      return present(block.content, block.sensitivity);
    case 'open-question':
      return present(block.content, block.settle);
    case 'table':
      return [...block.columns.map((column) => column.header), ...block.rows.flat()];
    case 'equation':
      return present(block.note);
    case 'expansion':
      return [block.summary];
    case 'algorithm':
      return present(block.complexity);
    case 'failure-mode':
      return present(block.symptom, block.cause, block.detection, block.mitigation);
    case 'observation-layer':
      return present(block.parts.claims, block.parts.evidence, block.parts.inference, block.parts.unknown);
    case 'sibling':
      return present(
        block.differential.whyExists,
        block.differential.assumptionChanged,
        block.differential.objectiveChanged,
        block.differential.problemSolved,
        block.differential.newFailureMode,
        block.differential.changedPrimitive,
      );
    case 'list':
    case 'quote':
    case 'rule':
    case 'code':
    case 'tensor-trace':
    case 'systems-trace':
    case 'experiment':
    case 'figure':
      return [];
    default:
      return assertNever(block);
  }
}

/** Visits every inline node depth-first (containers before their children). */
export function walkInline(nodes: readonly Inline[], visit: (node: Inline) => void): void {
  for (const node of nodes) {
    visit(node);
    if (node.kind === 'emphasis' || node.kind === 'strong' || node.kind === 'delete' || node.kind === 'link') {
      walkInline(node.children, visit);
    }
  }
}

/** Visits every inline node of every block (nested blocks included), in reading order. */
export function walkAllInline(blocks: readonly Block[], visit: (node: Inline, owner: Block) => void): void {
  walkBlocks(blocks, (block) => {
    for (const sequence of ownInlines(block)) walkInline(sequence, (node) => { visit(node, block); });
  });
}
