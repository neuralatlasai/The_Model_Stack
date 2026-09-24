/**
 * GFM table extraction from raw Markdown (mdast + gfm + math), used by the
 * registries that must read tables before the Markdown compile pass
 * (references) or from read-only inputs (AI_REFERENCE_STACK.md). Columns are
 * addressed by header text, never by position: column order differs between
 * chapters.
 */
import type { Heading, Nodes, Root, Table, TableCell } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { mathFromMarkdown } from 'mdast-util-math';
import { toString } from 'mdast-util-to-string';
import { gfm } from 'micromark-extension-gfm';
import { math } from 'micromark-extension-math';

export function parseMarkdown(text: string): Root {
  return fromMarkdown(text, {
    extensions: [gfm(), math()],
    mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
  });
}

export interface CellValue {
  /** Plain text of the cell, whitespace-collapsed. */
  readonly text: string;
  /** URLs of links inside the cell, in order. */
  readonly links: readonly string[];
}

export interface TableRowValue {
  /** 1-based line within the parsed text. */
  readonly line: number | null;
  readonly cells: readonly CellValue[];
}

export interface ParsedTable {
  /** Header texts as written (whitespace-collapsed). */
  readonly headers: readonly string[];
  readonly rows: readonly TableRowValue[];
  /** Text of the nearest preceding heading, or null. */
  readonly heading: string | null;
  readonly headingDepth: number | null;
  readonly line: number | null;
}

function cellValue(cell: TableCell): CellValue {
  const links: string[] = [];
  const visit = (node: Nodes): void => {
    if (node.type === 'link') links.push(node.url);
    if ('children' in node) for (const child of node.children) visit(child);
  };
  visit(cell);
  return { text: toString(cell).replace(/\s+/gu, ' ').trim(), links };
}

/** Every GFM table in document order with its nearest preceding heading. */
export function extractTables(root: Root): ParsedTable[] {
  const tables: ParsedTable[] = [];
  let heading: Heading | null = null;
  for (const node of root.children) {
    if (node.type === 'heading') {
      heading = node;
      continue;
    }
    if (node.type !== 'table') continue;
    tables.push(tableValue(node, heading));
  }
  return tables;
}

function tableValue(table: Table, heading: Heading | null): ParsedTable {
  const [headerRow, ...bodyRows] = table.children;
  const headers = headerRow === undefined ? [] : headerRow.children.map((cell) => cellValue(cell).text);
  return {
    headers,
    rows: bodyRows.map((row) => ({ line: row.position?.start.line ?? null, cells: row.children.map(cellValue) })),
    heading: heading === null ? null : toString(heading).replace(/\s+/gu, ' ').trim(),
    headingDepth: heading?.depth ?? null,
    line: table.position?.start.line ?? null,
  };
}

/** Header text → comparison key: lower-case, collapsed spaces, parenthetical notes removed. */
export function headerKey(header: string): string {
  return header
    .toLowerCase()
    .replace(/\([^)]*\)/gu, '')
    .replace(/[*_`]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

/**
 * Resolves wanted columns by header text. `aliases` maps a logical field to the
 * accepted header keys (see `headerKey`). Returns field → column index; missing
 * fields are absent.
 */
export function mapColumns<F extends string>(headers: readonly string[], aliases: Readonly<Record<F, readonly string[]>>): Partial<Record<F, number>> {
  const keys = headers.map(headerKey);
  const out: Partial<Record<F, number>> = {};
  for (const field of Object.keys(aliases) as F[]) {
    const accepted = aliases[field];
    const index = keys.findIndex((key) => accepted.includes(key));
    if (index !== -1) out[field] = index;
  }
  return out;
}

/** Cell text for a mapped field, or '' when the field or cell is missing. */
export function cellText(row: TableRowValue, index: number | undefined): string {
  if (index === undefined) return '';
  return row.cells[index]?.text ?? '';
}

export function cellLinks(row: TableRowValue, index: number | undefined): readonly string[] {
  if (index === undefined) return [];
  return row.cells[index]?.links ?? [];
}
