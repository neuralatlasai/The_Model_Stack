/**
 * Equation index (every numbered equation with its KaTeX HTML and variable
 * table, for the equation inspector) and object index (figures, algorithms,
 * experiments, failure modes, open questions, definitions), in reading order.
 */
import {
  inlineToText,
  objectAnchor,
  termAnchor,
  type EquationIndexEntry,
  type NodeId,
  type ObjectIndexEntry,
} from '@atlas/core';
import { truncate } from '../project/text.ts';
import type { CompiledSource, NodeTable } from '../project/types.ts';
import { walkDocument } from '../project/walk.ts';

export function buildEquationIndex(compiled: readonly CompiledSource[], table: NodeTable): EquationIndexEntry[] {
  const out: EquationIndexEntry[] = [];
  const seen = new Set<string>();
  for (const { source, body } of compiled) {
    const url = table.nodes.get(source.meta.id)?.url;
    if (url === undefined) continue;
    for (const { block } of walkDocument(body)) {
      if (block.kind !== 'equation' || block.number === null || seen.has(block.number)) continue;
      seen.add(block.number);
      const anchor = block.anchor ?? objectAnchor('eq', block.number);
      out.push({
        number: block.number,
        nodeId: source.meta.id,
        anchor,
        url: `${url}#${anchor}`,
        tex: block.tex,
        html: block.html,
        variables: block.variables.map((variable) => ({ symbol: variable.symbol, meaning: variable.meaning })),
      });
    }
  }
  return out;
}

export function buildObjectIndex(compiled: readonly CompiledSource[], table: NodeTable): ObjectIndexEntry[] {
  const out: ObjectIndexEntry[] = [];
  for (const { source, body } of compiled) {
    const nodeId: NodeId = source.meta.id;
    const url = table.nodes.get(nodeId)?.url;
    if (url === undefined) continue;
    const push = (kind: ObjectIndexEntry['kind'], label: string, title: string, anchor: string): void => {
      out.push({ kind, label, title, nodeId, anchor, url: `${url}#${anchor}` });
    };

    for (const figure of body.figures) {
      push('figure', figure.number === null ? 'Figure' : `Fig. ${figure.number}`, figure.spec.title, figure.anchor);
    }
    for (const { block, region } of walkDocument(body)) {
      const fallback = region?.anchor ?? '';
      switch (block.kind) {
        case 'algorithm':
          push(
            'algorithm',
            block.number === null ? 'Algorithm' : `Alg. ${block.number}`,
            block.name,
            block.anchor ?? (block.number === null ? fallback : objectAnchor('alg', block.number)),
          );
          break;
        case 'experiment':
          push('experiment', `Exp. ${block.number}`, block.name, block.anchor ?? objectAnchor('exp', block.number));
          break;
        case 'failure-mode':
          push('failure-mode', 'Failure mode', block.name, block.anchor ?? fallback);
          break;
        case 'open-question':
          push('open-question', 'Open question', truncate(inlineToText(block.content), 160), block.anchor ?? fallback);
          break;
        case 'definition':
          push('definition', 'Definition', block.term, block.anchor ?? termAnchor(block.termSlug));
          break;
        default:
          break;
      }
    }
  }
  return out;
}
