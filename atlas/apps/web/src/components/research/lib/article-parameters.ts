/**
 * The first six authored symbol / meaning pairs, linked to their defining
 * equations. Nested blocks are visited in manuscript order through the shared
 * iterator. Selection is O(b + v + t), for visited blocks, variables, and text
 * bytes; the output and deduplication set each hold at most six definitions.
 */
import type { EquationVariable, ResearchDocument } from '@atlas/core';
import { documentBlocks } from './walk.ts';

export interface ArticleParameter extends EquationVariable {
  readonly equationAnchor?: string;
}

export function articleParameters(doc: Pick<ResearchDocument, 'lead' | 'regions'>): readonly ArticleParameter[] {
  const parameters: ArticleParameter[] = [];
  const seen = new Set<string>();
  for (const block of documentBlocks(doc)) {
    if (block.kind !== 'equation') continue;
    for (const variable of block.variables) {
      const symbol = variable.symbol.trim();
      const meaning = variable.meaning.trim();
      if (symbol === '' || meaning === '') continue;
      // Preserve distinct scoped definitions of the same symbol instead of
      // claiming that a later equation must use the first equation's meaning.
      const key = JSON.stringify([symbol, meaning]);
      if (seen.has(key)) continue;
      seen.add(key);
      parameters.push({
        symbol,
        meaning,
        ...(block.anchor === null ? {} : { equationAnchor: block.anchor }),
      });
      if (parameters.length === 6) return parameters;
    }
  }
  return parameters;
}
