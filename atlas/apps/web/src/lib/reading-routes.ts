/**
 * Reading routes (UI_UX §38) are authored in front-matter/reading-routes.md as
 * tables whose route cells read `01–06 → 13–17 → Volume II (25–48) → 63, 66`.
 * This module turns such a cell into text runs with the two-digit chapter
 * numbers linked, and extracts route tables from the compiled document, so the
 * home page shows the routes without duplicating their content.
 */
import { inlineToText, type ResearchDocument, type TableBlock } from '@atlas/core';

export type RouteToken =
  | { readonly type: 'text'; readonly value: string }
  | { readonly type: 'chapter'; readonly value: string; readonly chapter: number; readonly url: string | null };

/** Splits route text on two-digit chapter numbers (01–99) not embedded in longer digit runs. */
export function tokenizeRoute(text: string, chapterUrl: (chapter: number) => string | null): RouteToken[] {
  const tokens: RouteToken[] = [];
  const pattern = /(?<!\d)(\d{2})(?!\d)/gu;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const digits = match[1];
    const index = match.index;
    if (digits === undefined) continue;
    const chapter = Number.parseInt(digits, 10);
    if (chapter < 1) continue;
    if (index > last) tokens.push({ type: 'text', value: text.slice(last, index) });
    tokens.push({ type: 'chapter', value: digits, chapter, url: chapterUrl(chapter) });
    last = index + digits.length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
}

export interface RouteRow {
  readonly label: string;
  readonly route: string;
  readonly why: string;
}

export interface RouteTable {
  readonly title: string;
  readonly anchor: string;
  readonly rows: readonly RouteRow[];
}

function cellText(table: TableBlock, row: number, column: number): string {
  const cell = table.rows[row]?.[column];
  return cell === undefined ? '' : inlineToText(cell).trim();
}

/**
 * Route tables of the reading-routes document: every table in a region whose
 * header row names a route column (`Route`, `Chapter route`). Columns are
 * taken positionally as label · route · rationale.
 */
export function routeTables(doc: ResearchDocument): RouteTable[] {
  const out: RouteTable[] = [];
  for (const region of doc.regions) {
    for (const block of region.blocks) {
      if (block.kind !== 'table' || block.columns.length < 3) continue;
      const header = block.columns.map((column) => inlineToText(column.header).trim().toLowerCase());
      const routeColumn = header.findIndex((name) => name.includes('route'));
      if (routeColumn < 1) continue;
      const rows: RouteRow[] = [];
      for (let r = 0; r < block.rows.length; r += 1) {
        rows.push({
          label: cellText(block, r, 0),
          route: cellText(block, r, routeColumn),
          why: cellText(block, r, routeColumn + 1 < block.columns.length ? routeColumn + 1 : block.columns.length - 1),
        });
      }
      out.push({ title: region.title.replace(/^\d+\.\s*/u, ''), anchor: region.anchor, rows });
    }
  }
  return out;
}
