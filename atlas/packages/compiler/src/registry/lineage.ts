/**
 * Lineage (UI_UX §21, CONTENT_CONTRACT §3 item 11). Each chapter page's
 * Lineage list is written `year · work (key) · relation — note`, with the
 * relation one of the five fixed words (sometimes italic, sometimes followed
 * by a qualifier or a parenthetical note). The Timeline view aggregates them.
 */
import {
  LINEAGE_RELATIONS,
  diagnostic,
  inlineToText,
  isCitationKey,
  type CitationKey,
  type Diagnostic,
  type Inline,
  type LineageEntry,
  type LineageRelation,
  type ListItem,
  type NodeId,
} from '@atlas/core';
import type { CompiledSource } from '../project/types.ts';
import { sliceInline, trimInline } from '../project/walk.ts';

const SEPARATOR = ' · ';
const CITE = /(?:^|[\s([])(P\d{2}|R\d+\.\d+)(?=[\s)\],;]|$)/u;
const CITE_BRACKETED = /\s*[([](?:P\d{2}|R\d+\.\d+)[)\]]/gu;
const CITE_BARE = /\s+(?:P\d{2}|R\d+\.\d+)(?=[\s,;]|$)/gu;

export interface ParsedLineageLine {
  readonly year: string;
  readonly work: string;
  readonly relation: LineageRelation;
  readonly cite: CitationKey | null;
  /** Offset in the text projection where the note begins, or null when there is none. */
  readonly noteStart: number | null;
}

/** Parses one lineage line's text projection. Returns a reason string when it does not fit the grammar. */
export function parseLineageText(text: string): ParsedLineageLine | string {
  const firstSep = text.indexOf(SEPARATOR);
  if (firstSep === -1) return 'expected "year · work · relation"';
  const year = text.slice(0, firstSep).trim().replace(/\s*[-–]\s*/u, '–');
  // A single year, an open frontier (`2025+`), or a span (`2021–2023`) sorted by its first year.
  if (!/^\d{4}(?:\+|–\d{4})?$/u.test(year)) return `"${year}" is not a year (YYYY, YYYY+, or YYYY–YYYY)`;

  // The relation is the last ` · `-separated segment that starts with a relation word,
  // so a work title may itself contain ` · `.
  const restStart = firstSep + SEPARATOR.length;
  const rest = text.slice(restStart);
  let searchFrom = rest.length;
  while (searchFrom > 0) {
    const sepAt = rest.lastIndexOf(SEPARATOR, searchFrom - 1);
    if (sepAt === -1) break;
    const segmentStart = sepAt + SEPARATOR.length;
    const segment = rest.slice(segmentStart);
    const lead = /^[\s*_]*/u.exec(segment)?.[0].length ?? 0;
    const lowered = segment.slice(lead).toLowerCase();
    const relation = LINEAGE_RELATIONS.find((candidate) => lowered.startsWith(candidate));
    if (relation !== undefined) {
      const workRaw = rest.slice(0, sepAt);
      const cite = CITE.exec(workRaw)?.[1] ?? null;
      const work = workRaw.replace(CITE_BRACKETED, '').replace(CITE_BARE, '').replace(/\s+/gu, ' ').trim();
      const afterRelation = lead + relation.length;
      const noteRaw = segment.slice(afterRelation);
      const noteLead = /^[\s*_]*(?:[—–:-]\s*)?/u.exec(noteRaw)?.[0].length ?? 0;
      const hasNote = noteRaw.slice(noteLead).replace(/[\s.()*_]/gu, '') !== '';
      return {
        year,
        work,
        relation,
        cite: cite !== null && isCitationKey(cite) ? cite : null,
        noteStart: hasNote ? restStart + segmentStart + afterRelation + noteLead : null,
      };
    }
    searchFrom = sepAt;
  }
  return `no relation word; expected one of: ${LINEAGE_RELATIONS.join(', ')}`;
}

function itemInline(item: ListItem): readonly Inline[] | null {
  for (const block of item.blocks) {
    if (block.kind === 'paragraph') return block.content;
  }
  return null;
}

/** Extracts lineage entries from every chapter page's `lineage` region, sorted by year (stable). */
export function collectLineage(compiled: readonly CompiledSource[]): { lineage: LineageEntry[]; diagnostics: Diagnostic[] } {
  const lineage: LineageEntry[] = [];
  const diagnostics: Diagnostic[] = [];
  for (const { source, body } of compiled) {
    if (source.meta.entityType !== 'chapter') continue;
    const nodeId: NodeId = source.meta.id;
    for (const region of body.regions) {
      if (region.role !== 'lineage') continue;
      for (const block of region.blocks) {
        if (block.kind !== 'list') continue;
        for (const item of block.items) {
          const content = itemInline(item);
          if (content === null) continue;
          const text = inlineToText(content);
          const parsed = parseLineageText(text);
          if (typeof parsed === 'string') {
            diagnostics.push(diagnostic('block-malformed', `lineage entry "${text.slice(0, 80)}": ${parsed}`, { file: source.path, nodeId }));
            continue;
          }
          const note = parsed.noteStart === null ? [] : trimInline(sliceInline(content, parsed.noteStart), '()—–.*_');
          lineage.push({ year: parsed.year, work: parsed.work, relation: parsed.relation, cite: parsed.cite, nodeId, note });
        }
      }
    }
  }
  // Array.prototype.sort is stable: equal years keep reading order.
  lineage.sort((a, b) => Number.parseInt(a.year, 10) - Number.parseInt(b.year, 10));
  return { lineage, diagnostics };
}
