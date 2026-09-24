/**
 * Glossary (CONTENT_CONTRACT §3 item 12): one canonical owner per term. Terms
 * come from Definition blocks in compiled bodies; the first definition in
 * reading order owns the slug and later ones are diagnosed.
 */
import { diagnostic, termAnchor, type Diagnostic, type GlossaryTerm } from '@atlas/core';
import { walkDocument } from '../project/walk.ts';
import type { CompiledSource, NodeTable } from '../project/types.ts';

export function collectTerms(compiled: readonly CompiledSource[], table: NodeTable): { terms: GlossaryTerm[]; diagnostics: Diagnostic[] } {
  const terms = new Map<string, GlossaryTerm>();
  const diagnostics: Diagnostic[] = [];
  for (const { source, body } of compiled) {
    const node = table.nodes.get(source.meta.id);
    if (node === undefined) continue;
    const seenHere = new Set<string>();
    for (const { block } of walkDocument(body)) {
      if (block.kind !== 'definition') continue;
      if (seenHere.has(block.termSlug)) continue;
      seenHere.add(block.termSlug);
      const owner = terms.get(block.termSlug);
      if (owner !== undefined) {
        diagnostics.push(
          diagnostic(
            'term-duplicate-owner',
            `"${block.term}" (${block.termSlug}) is already defined by ${owner.owner}; a term has exactly one owning chapter — link to it instead`,
            { file: source.path, nodeId: source.meta.id },
          ),
        );
        continue;
      }
      terms.set(block.termSlug, {
        slug: block.termSlug,
        term: block.term,
        definition: block.content,
        owner: node.id,
        ownerTitle: node.title,
        chapter: node.chapter,
        url: `${node.url}#${termAnchor(block.termSlug)}`,
      });
    }
  }
  const sorted = [...terms.values()].sort((a, b) => {
    const ta = a.term.toLowerCase();
    const tb = b.term.toLowerCase();
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });
  return { terms: sorted, diagnostics };
}
