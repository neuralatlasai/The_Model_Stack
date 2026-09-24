/**
 * Column profiling for the DataTable renderer (UI_UX §51). Decides, per
 * column, whether values are numeric (tabular mono, right-aligned), whether
 * the column is the role's emphasised column ("what changes here", stack
 * layer, reference key), and whether the first column is a row header.
 */
import type { Inline, TableBlock, TableRole } from '@atlas/core';
import { inlineToText } from '@atlas/core';

/**
 * A short cell that is a quantity: optional comparator, a number (grouped,
 * decimal, or exponent form), and an optional short unit (`%`, `×`, `GiB`,
 * `ms`, `tokens/s`). Section numbers such as `5.1` also qualify, which is the
 * intended tabular treatment for them.
 */
const NUMERIC_CELL =
  /^[~≈<>≤≥±+−-]?\s?\d[\d,.\u00A0\u202F ]*(?:[eE][+−-]?\d+)?\s?(?:[%×x]|[A-Za-zµ/·]{1,10})?$/u;
const NUMERIC_SHARE = 0.6;
const MAX_NUMERIC_CHARS = 28;
/** Tables with more rows than this scroll inside a bounded box so the sticky header stays reachable. */
export const TALL_TABLE_ROWS = 14;

export interface ColumnProfile {
  readonly index: number;
  readonly numeric: boolean;
  /** Role emphasis: `what changes here` (sections), `layer` (stack-coverage). */
  readonly emphasis: boolean;
  /** Identifier column: reference keys, stack entries. */
  readonly key: boolean;
  readonly align: 'left' | 'center' | 'right';
}

export function isNumericCell(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_NUMERIC_CHARS && NUMERIC_CELL.test(trimmed);
}

function headerText(table: TableBlock, index: number): string {
  const column = table.columns[index];
  return column === undefined ? '' : inlineToText(column.header).trim().toLowerCase();
}

function cellTexts(table: TableBlock, index: number): string[] {
  return table.rows.map((row) => {
    const cell: readonly Inline[] | undefined = row[index];
    return cell === undefined ? '' : inlineToText(cell);
  });
}

function isEmphasisColumn(role: TableRole, header: string): boolean {
  if (role === 'sections') return header.includes('what changes');
  if (role === 'stack-coverage') return header.includes('layer');
  return false;
}

function isKeyColumn(role: TableRole, header: string, index: number): boolean {
  if (role === 'references') return index === 0 || header === 'key';
  if (role === 'stack-coverage') return header === 'entry';
  return false;
}

export function profileColumns(table: TableBlock): ColumnProfile[] {
  return table.columns.map((column, index) => {
    const header = headerText(table, index);
    const texts = cellTexts(table, index).filter((text) => text.trim().length > 0);
    const numericCount = texts.filter(isNumericCell).length;
    const numeric = texts.length > 0 && numericCount / texts.length >= NUMERIC_SHARE;
    const align = column.align ?? (numeric ? 'right' : 'left');
    return {
      index,
      numeric,
      emphasis: isEmphasisColumn(table.role, header),
      key: isKeyColumn(table.role, header, index),
      align,
    };
  });
}

/** The first column reads as a row header in relation grids and record tables. */
export function hasRowHeader(table: TableBlock): boolean {
  switch (table.role) {
    case 'position':
    case 'benchmark':
    case 'dataset':
    case 'model':
    case 'comparison':
      return true;
    case 'generic':
    case 'performance':
    case 'references':
    case 'sections':
    case 'stack-coverage':
      return false;
  }
}

export function isTallTable(table: TableBlock): boolean {
  return table.rows.length > TALL_TABLE_ROWS;
}

/** Accessible name for the scroll region: the header cells, joined. */
export function tableLabel(table: TableBlock): string {
  const headers = table.columns.map((column) => inlineToText(column.header).trim()).filter((text) => text.length > 0);
  const summary = headers.slice(0, 4).join(', ');
  return summary === '' ? 'Table' : `Table: ${summary}${headers.length > 4 ? ', …' : ''}`;
}
