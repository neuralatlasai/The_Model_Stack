/**
 * Lineage relations (UI_UX §21, CONTENT_CONTRACT §3 item 11) and their fixed
 * glyphs. A glyph never carries meaning alone: the relation word is always
 * printed beside it.
 */
import { LINEAGE_RELATIONS, type LineageEntry, type LineageRelation } from '@atlas/core';
import { compareStrings, yearSortKey } from './format.ts';

export const RELATION_GLYPHS: Readonly<Record<LineageRelation, string>> = {
  'conceptual ancestor': '○',
  'engineering optimization': '◆',
  'alternative branch': '◇',
  'superseded approach': '⊘',
  'current frontier': '●',
};

export function relationSlug(relation: LineageRelation): string {
  return relation.replaceAll(' ', '-');
}

export interface YearGroup {
  readonly year: string;
  readonly entries: readonly LineageEntry[];
}

/** Groups entries by year label in chronological order (`2025+` after `2025`); stable within a year. */
export function groupByYear(entries: readonly LineageEntry[]): YearGroup[] {
  const groups = new Map<string, LineageEntry[]>();
  for (const entry of entries) {
    const bucket = groups.get(entry.year);
    if (bucket === undefined) groups.set(entry.year, [entry]);
    else bucket.push(entry);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => yearSortKey(a) - yearSortKey(b) || compareStrings(a, b))
    .map(([year, bucket]) => ({ year, entries: bucket }));
}

export function relationCounts(entries: readonly LineageEntry[]): { relation: LineageRelation; count: number }[] {
  return LINEAGE_RELATIONS.map((relation) => ({
    relation,
    count: entries.filter((entry) => entry.relation === relation).length,
  }));
}
