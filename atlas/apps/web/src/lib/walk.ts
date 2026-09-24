/**
 * Exhaustive traversal of the compiled research AST (blocks + inline). The
 * switch statements are closed over the core unions (`assertNever`), so a new
 * block or inline kind in @atlas/core fails the type check here instead of
 * being silently skipped by page data or search helpers.
 */
import { assertNever, type Block, type Inline, type NodeId, type ResearchDocument, type XRefKind } from '@atlas/core';

export interface AstVisitor {
  readonly block?: (block: Block) => void;
  readonly inline?: (node: Inline) => void;
}

export function walkInlines(nodes: readonly Inline[] | null, visitor: AstVisitor): void {
  if (nodes === null) return;
  for (const node of nodes) {
    visitor.inline?.(node);
    switch (node.kind) {
      case 'emphasis':
      case 'strong':
      case 'delete':
      case 'link':
        walkInlines(node.children, visitor);
        break;
      case 'text':
      case 'code':
      case 'math':
      case 'cite':
      case 'label':
      case 'xref':
      case 'break':
        break;
      default:
        assertNever(node);
    }
  }
}

export function walkBlocks(blocks: readonly Block[], visitor: AstVisitor): void {
  for (const block of blocks) {
    visitor.block?.(block);
    switch (block.kind) {
      case 'paragraph':
      case 'heading':
      case 'definition':
      case 'claim':
      case 'observation':
      case 'note':
        walkInlines(block.content, visitor);
        break;
      case 'list':
        for (const item of block.items) walkBlocks(item.blocks, visitor);
        break;
      case 'table':
        for (const column of block.columns) walkInlines(column.header, visitor);
        for (const row of block.rows) for (const cell of row) walkInlines(cell, visitor);
        break;
      case 'quote':
        walkBlocks(block.blocks, visitor);
        break;
      case 'assumption':
        walkInlines(block.content, visitor);
        walkInlines(block.sensitivity, visitor);
        break;
      case 'proposition':
        walkInlines(block.content, visitor);
        if (block.proof !== null) walkBlocks(block.proof, visitor);
        break;
      case 'equation':
        walkInlines(block.note, visitor);
        break;
      case 'expansion':
        walkInlines(block.summary, visitor);
        walkBlocks(block.blocks, visitor);
        break;
      case 'algorithm':
        walkInlines(block.complexity, visitor);
        break;
      case 'experiment':
        for (const field of block.fields) walkBlocks(field.blocks, visitor);
        break;
      case 'failure-mode':
        walkInlines(block.symptom, visitor);
        walkInlines(block.cause, visitor);
        walkInlines(block.detection, visitor);
        walkInlines(block.mitigation, visitor);
        break;
      case 'open-question':
        walkInlines(block.content, visitor);
        walkInlines(block.settle, visitor);
        break;
      case 'observation-layer':
        for (const part of Object.values(block.parts)) walkInlines(part, visitor);
        break;
      case 'sibling':
        for (const field of Object.values(block.differential)) walkInlines(field, visitor);
        break;
      case 'rule':
      case 'code':
      case 'tensor-trace':
      case 'systems-trace':
      case 'figure':
        break;
      default:
        assertNever(block);
    }
  }
}

/** Walks header, lead, and every region of a document. */
export function walkDocument(doc: ResearchDocument, visitor: AstVisitor): void {
  walkInlines(doc.header.thesis, visitor);
  walkInlines(doc.header.metaLine, visitor);
  walkBlocks(doc.lead, visitor);
  for (const region of doc.regions) walkBlocks(region.blocks, visitor);
}

export interface DocumentFacts {
  /** Equation numbers defined in the document, in order. */
  readonly equationsDefined: readonly string[];
  /** Equation numbers referenced by cross-references in prose, in first-seen order. */
  readonly equationsReferenced: readonly string[];
  /** Every xref kind/number pair seen. */
  readonly xrefs: readonly { readonly ref: XRefKind; readonly number: string }[];
  /** Atlas nodes the prose links to (written or planned), in first-seen order. */
  readonly linkedNodes: readonly NodeId[];
}

export function documentFacts(doc: ResearchDocument): DocumentFacts {
  const defined: string[] = [];
  const referenced = new Set<string>();
  const xrefs: { ref: XRefKind; number: string }[] = [];
  const linked = new Set<NodeId>();
  walkDocument(doc, {
    block: (block) => {
      if (block.kind === 'equation' && block.number !== null) defined.push(block.number);
    },
    inline: (node) => {
      if (node.kind === 'link' && (node.target.type === 'node' || node.target.type === 'planned')) linked.add(node.target.nodeId);
      if (node.kind !== 'xref') return;
      xrefs.push({ ref: node.ref, number: node.number });
      if (node.ref === 'equation') referenced.add(node.number);
    },
  });
  return { equationsDefined: defined, equationsReferenced: [...referenced], xrefs, linkedNodes: [...linked] };
}

/** All blocks of one kind anywhere in the document (nested included), in document order. */
export function blocksOfKind<K extends Block['kind']>(doc: ResearchDocument, kind: K): Extract<Block, { kind: K }>[] {
  const out: Extract<Block, { kind: K }>[] = [];
  walkDocument(doc, {
    block: (block) => {
      if (isKind(block, kind)) out.push(block);
    },
  });
  return out;
}

function isKind<K extends Block['kind']>(block: Block, kind: K): block is Extract<Block, { kind: K }> {
  return block.kind === kind;
}
