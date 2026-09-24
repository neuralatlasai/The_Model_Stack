/**
 * GFM tables → TableBlock with a semantic role (so the renderer can pick
 * sticky columns, emphasis, and breakout width) and a `wide` flag.
 */
import type { Inline, RegionRole, TableBlock, TableColumn, TableRole } from '@atlas/core';
import type { Table } from 'mdast';
import { convertPhrasing } from '../inline.ts';
import { plainText, trimInline } from '../inline-utils.ts';
import { depthOf, type CompileState, type FlowEnv } from '../state.ts';

const PERFORMANCE_HEADERS = /hardware|precision|concurrency|runtime version|measurement boundary|sequence length|input\/output|latency|throughput|ttft|tpot/u;
const BENCHMARK_HEADERS = /capability measured|task construction|metric|contamination|protocol|known limitations|comparability/u;
const LONG_CELL = 160;

function countMatching(headers: readonly string[], pattern: RegExp): number {
  return headers.filter((header) => pattern.test(header)).length;
}

/** Role from the region and the header row (CONTENT_CONTRACT §3, §5, §14). */
export function tableRole(headers: readonly string[], region: RegionRole): TableRole {
  const h = headers.map((header) => header.toLowerCase().replace(/\s+/gu, ' ').trim());
  const first = h[0] ?? '';
  if (region === 'stack-coverage' || first.startsWith('stack section')) return 'stack-coverage';
  if (h.includes('key') && h.includes('type') && h.includes('work')) return 'references';
  if (region === 'position' || (first === 'relation' && (h[1] ?? '').startsWith('link'))) return 'position';
  if (region === 'sections' || h.some((header) => header.includes('what changes here'))) return 'sections';
  if (countMatching(h, PERFORMANCE_HEADERS) >= 2 && h.some((header) => /hardware|precision|concurrency/u.test(header))) return 'performance';
  if (countMatching(h, BENCHMARK_HEADERS) >= 3) return 'benchmark';
  if (h.some((header) => /dataset|corpus/u.test(header)) && h.some((header) => /licen[cs]e|snapshot|provenance|role/u.test(header))) {
    return 'dataset';
  }
  if (h.some((header) => /^model\b/u.test(header)) && h.some((header) => /param|context|release|licen[cs]e|weights|architecture/u.test(header))) {
    return 'model';
  }
  if (['dimension', 'axis', 'property', 'aspect', 'criterion'].includes(first) || h.some((header) => header.includes('comparison'))) {
    return 'comparison';
  }
  return 'generic';
}

export function convertTable(node: Table, st: CompileState, env: FlowEnv): TableBlock {
  const [headerRow, ...bodyRows] = node.children;
  const columns: TableColumn[] = (headerRow?.children ?? []).map((cell, index) => ({
    header: trimInline(convertPhrasing(cell.children, st)),
    align: node.align?.[index] ?? null,
  }));
  const width = columns.length;
  const rows: Inline[][][] = bodyRows.map((row) => {
    const cells = row.children.slice(0, width).map((cell) => trimInline(convertPhrasing(cell.children, st)));
    while (cells.length < width) cells.push([]);
    return cells;
  });
  const longest = rows.reduce((max, row) => Math.max(max, ...row.map((cell) => plainText(cell).length)), 0);
  return {
    kind: 'table',
    anchor: null,
    depth: depthOf('table', env),
    role: tableRole(
      columns.map((column) => plainText(column.header)),
      env.role,
    ),
    columns,
    rows,
    wide: width > 5 || longest > LONG_CELL,
  };
}
