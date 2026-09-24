/**
 * Document projections: the minimap outline (UI_UX §12), reading statistics,
 * citation order, defined terms, and outgoing node links.
 */
import {
  EVIDENCE_SHORT,
  isCitationKey,
  type Block,
  type CitationKey,
  type CompiledFigure,
  type DocumentStats,
  type NodeId,
  type OutlineEntry,
  type OutlineMarker,
  type Region,
} from '@atlas/core';
import { plainText, proseText } from './inline-utils.ts';
import type { CompileState } from './state.ts';
import { ownInlines, walkAllInline, walkBlocks, walkInline } from './walk.ts';

const WORDS_PER_MINUTE = 230;
const MARKER_LABEL_MAX = 48;

function clip(text: string): string {
  const flat = text.replace(/\s+/gu, ' ').trim();
  return flat.length > MARKER_LABEL_MAX ? `${flat.slice(0, MARKER_LABEL_MAX - 1).trimEnd()}…` : flat;
}

function markerFor(block: Block): OutlineMarker | null {
  switch (block.kind) {
    case 'equation':
      return block.number !== null && block.anchor !== null ? { type: 'equation', anchor: block.anchor, label: `Eq. ${block.number}` } : null;
    case 'figure':
      return {
        type: 'figure',
        anchor: block.figure.anchor,
        label: block.figure.number !== null ? `Fig. ${block.figure.number}` : clip(block.figure.spec.title),
      };
    case 'algorithm':
      return block.anchor !== null ? { type: 'algorithm', anchor: block.anchor, label: `Alg. ${block.number ?? ''}`.trim() } : null;
    case 'experiment':
      return block.anchor !== null ? { type: 'experiment', anchor: block.anchor, label: `Exp. ${block.number}` } : null;
    case 'code':
      return block.anchor !== null ? { type: 'code', anchor: block.anchor, label: block.lang ?? 'code' } : null;
    case 'failure-mode':
      return block.anchor !== null ? { type: 'failure-mode', anchor: block.anchor, label: clip(block.name) } : null;
    case 'open-question':
      return block.anchor !== null ? { type: 'open-question', anchor: block.anchor, label: clip(plainText(block.content)) } : null;
    case 'definition':
      return block.anchor !== null ? { type: 'definition', anchor: block.anchor, label: clip(block.term) } : null;
    case 'claim':
      return block.anchor !== null ? { type: 'claim', anchor: block.anchor, label: `Claim · ${EVIDENCE_SHORT[block.label]}` } : null;
    default:
      return null;
  }
}

export function buildOutline(regions: readonly Region[]): OutlineEntry[] {
  return regions.map((region) => {
    const markers: OutlineMarker[] = [];
    walkBlocks(region.blocks, (block) => {
      const marker = markerFor(block);
      if (marker !== null) markers.push(marker);
    });
    const children: { anchor: string; title: string }[] = [];
    for (const block of region.blocks) {
      if (block.kind === 'heading' && block.level === 3) children.push({ anchor: block.anchor, title: plainText(block.content).trim() });
      else if (block.kind === 'experiment' && block.anchor !== null) {
        children.push({ anchor: block.anchor, title: block.name === '' ? `Experiment ${block.number}` : `Experiment ${block.number} — ${block.name}` });
      }
    }
    return { anchor: region.anchor, title: region.title, role: region.role, depth: region.depth, markers, children };
  });
}

/** A word; digits joined by a dot (`5.13`, `R5.13`) count once. */
const WORD = /[\p{L}\p{N}](?:[\p{L}\p{N}'’-]|\.(?=\p{N}))*/gu;

/** Prose words: paragraphs, headings, lists, tables, and typed-block text; code, math, and figures excluded. */
export function countWords(blocks: readonly Block[]): number {
  let words = 0;
  walkBlocks(blocks, (block) => {
    for (const sequence of ownInlines(block)) words += proseText(sequence).match(WORD)?.length ?? 0;
    if (block.kind === 'experiment' || block.kind === 'sibling' || block.kind === 'failure-mode') {
      words += block.name.match(WORD)?.length ?? 0;
    }
  });
  return words;
}

export function buildStats(blocks: readonly Block[], figures: readonly CompiledFigure[], citations: readonly CitationKey[]): DocumentStats {
  const counts = { equations: 0, algorithms: 0, experiments: 0, failureModes: 0, definitions: 0 };
  walkBlocks(blocks, (block) => {
    if (block.kind === 'equation') counts.equations += 1;
    else if (block.kind === 'algorithm') counts.algorithms += 1;
    else if (block.kind === 'experiment') counts.experiments += 1;
    else if (block.kind === 'failure-mode') counts.failureModes += 1;
    else if (block.kind === 'definition') counts.definitions += 1;
  });
  const words = countWords(blocks);
  return {
    words,
    readingMinutes: Math.ceil(words / WORDS_PER_MINUTE),
    ...counts,
    figures: figures.length,
    citations: citations.length,
  };
}

/** Citation keys in order of first appearance: claim sources, prose citations, figure sources. */
export function citationOrder(blocks: readonly Block[], st: CompileState): CitationKey[] {
  const seen = new Set<CitationKey>();
  const add = (key: string | null): void => {
    if (key !== null && isCitationKey(key) && !seen.has(key) && st.ctx.hasCitation(key)) seen.add(key);
  };
  walkBlocks(blocks, (block) => {
    if (block.kind === 'claim') for (const source of block.sources) add(source.key);
    if (block.kind === 'figure') for (const source of block.figure.sources) add(source);
    for (const sequence of ownInlines(block)) {
      walkInline(sequence, (node) => {
        if (node.kind === 'cite') add(node.key);
      });
    }
  });
  return [...seen];
}


export function definedTerms(blocks: readonly Block[]): string[] {
  const out: string[] = [];
  walkBlocks(blocks, (block) => {
    if (block.kind === 'definition' && !out.includes(block.termSlug)) out.push(block.termSlug);
  });
  return out;
}

/** Node ids reached by resolved links (manuscript or planned), excluding the document itself. */
export function linkedNodes(blocks: readonly Block[], self: NodeId): NodeId[] {
  const out: NodeId[] = [];
  const add = (id: NodeId): void => {
    if (id !== self && !out.includes(id)) out.push(id);
  };
  walkAllInline(blocks, (node) => {
    if (node.kind === 'link' && (node.target.type === 'node' || node.target.type === 'planned')) add(node.target.nodeId);
  });
  walkBlocks(blocks, (block) => {
    if (block.kind === 'sibling' && block.target !== null && (block.target.type === 'node' || block.target.type === 'planned')) {
      add(block.target.nodeId);
    }
  });
  return out;
}
