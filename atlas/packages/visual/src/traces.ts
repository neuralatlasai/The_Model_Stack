/**
 * Tensor and systems traces (CONTENT_CONTRACT §5; VISUAL_GRAMMAR §2, §5.2–5.3).
 *
 * Both are plain-text fenced blocks that stay readable in Markdown. The parsers
 * recover their structure without demanding a stricter format than authors use:
 *
 *   Tensor trace …                     (title line)
 *   [B, T, D] → op → [B, T, 3·H·Dh]    (segments split on →; a segment opening
 *                                       with a bracketed shape is a `shape`)
 *   … # 2·B·H·T²·Dh FLOPs              (trailing comment → an op segment `# …`)
 *   --- block ℓ ---                    (divider → a single op segment)
 *
 *   Systems trace …                    (title line)
 *   stage → latency / memory / …       (header row: positional cells)
 *   name  → latency: … / failure: …    (or key: value cells)
 */
import type { TensorSegment } from '@atlas/core';

export interface ParsedTensorTrace {
  readonly title: string;
  readonly lines: TensorSegment[][];
  /** Dimension symbols seen in bracketed shapes, first-seen order. */
  readonly dims: string[];
}

export interface ParsedSystemsTrace {
  readonly title: string;
  readonly columns: string[];
  readonly rows: { stage: string; cells: string[] }[];
}

const TREE_CHARS = /^[\s─━┬┴├┤└┌┐┘│┼╰╭]+|[\s─━┬┴├┤└┌┐┘│┼╰╭]+$/gu;
/** Identifier-like dimension tokens inside a shape: `B`, `Dh`, `H_kv`, `T̃`, `n_img`. */
const DIM_TOKEN = /[\p{L}][\p{L}\p{M}\p{N}_]*/gu;
/** A bracket group that reads as a shape: not an index like `E[x]` (preceded by a letter or digit). */
const SHAPE_GROUP = /(?<![\p{L}\p{N}_)])\[([^[\]]*)\]/gu;

function nonEmptyLines(raw: string): string[] {
  return raw
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/u, ''))
    .filter((line) => line.trim() !== '');
}

/** Dimension symbols appearing in bracketed shapes of `text`, appended to `into` in first-seen order. */
export function collectDims(text: string, into: string[]): void {
  for (const group of text.matchAll(SHAPE_GROUP)) {
    const inner = group[1] ?? '';
    for (const token of inner.matchAll(DIM_TOKEN)) {
      const symbol = token[0];
      if (!into.includes(symbol)) into.push(symbol);
    }
  }
}

function isShapeSegment(text: string): boolean {
  return /^(?:\d+\s*[×x*]\s*)?\[/u.test(text);
}

/** Parses a `Tensor trace` block (title line included). Returns null when the block is not a tensor trace. */
export function parseTensorTrace(raw: string): ParsedTensorTrace | null {
  const lines = nonEmptyLines(raw);
  const first = lines[0]?.trim();
  if (first === undefined || !/^Tensor trace\b/iu.test(first)) return null;
  const out: TensorSegment[][] = [];
  const dims: string[] = [];
  for (const line of lines.slice(1)) {
    let body = line.trim();
    let comment: string | null = null;
    const hash = /\s#\s+(.*)$/u.exec(body);
    if (hash !== null) {
      comment = (hash[1] ?? '').trim();
      body = body.slice(0, hash.index).trim();
    }
    if (/^-{3,}.*-{3,}$/u.test(body) || !body.includes('→')) {
      const segments: TensorSegment[] = body === '' ? [] : [{ type: 'op', text: body.replace(/\s+/gu, ' ') }];
      if (comment !== null) segments.push({ type: 'op', text: `# ${comment}` });
      if (segments.length > 0) out.push(segments);
      collectDims(body, dims);
      continue;
    }
    const segments: TensorSegment[] = [];
    for (const part of body.split('→')) {
      const text = part.replace(TREE_CHARS, '').replace(/\s+/gu, ' ').trim();
      if (text === '') continue;
      segments.push({ type: isShapeSegment(text) ? 'shape' : 'op', text });
      collectDims(text, dims);
    }
    if (comment !== null) segments.push({ type: 'op', text: `# ${comment}` });
    if (segments.length > 0) out.push(segments);
  }
  return { title: first, lines: out, dims };
}

// ─── systems trace ────────────────────────────────────────────────────────────

/** Column keys recognised in `key: value` rows, in display order. */
const KNOWN_COLUMNS = ['latency', 'memory', 'storage', 'compute', 'cost', 'communication', 'failure'] as const;
const NOTE_COLUMN = 'note';
const DETAIL_COLUMN = 'detail';
/** Arrow between the stage and its cells: `→` or `->` with whitespace on both sides. */
const STAGE_ARROW = /\s(?:→|->)\s/u;
/** Cell separator: `/` with whitespace on at least one side (so `B/param`, `N/s` stay intact). */
const CELL_SEPARATOR = /\s+\/\s*|\s*\/\s+/u;
const KEY_VALUE = /^([A-Za-z][A-Za-z ,()-]{0,47}?):\s+(.+)$/u;

function splitCells(text: string): string[] {
  return text
    .split(CELL_SEPARATOR)
    .map((cell) => cell.trim())
    .filter((cell) => cell !== '');
}

function splitStage(line: string): { stage: string; rest: string | null } {
  const match = STAGE_ARROW.exec(line);
  if (match === null) return { stage: line.trim(), rest: null };
  return { stage: line.slice(0, match.index).trim(), rest: line.slice(match.index + match[0].length).trim() };
}

function knownKeys(key: string): string[] | null {
  const parts = key
    .toLowerCase()
    .split(/\s*,\s*|\s+and\s+/u)
    .map((part) => part.trim())
    .filter((part) => part !== '');
  if (parts.length === 0) return null;
  return parts.every((part) => (KNOWN_COLUMNS as readonly string[]).includes(part)) ? parts : null;
}

/** Parses a `Systems trace` block (title line included). Returns null when the block is not a systems trace. */
export function parseSystemsTrace(raw: string): ParsedSystemsTrace | null {
  const lines = nonEmptyLines(raw);
  const first = lines[0]?.trim();
  if (first === undefined || !/^Systems trace\b/iu.test(first)) return null;
  const body = lines.slice(1).map(splitStage);
  const header = body[0];

  // Header-row form: `stage → latency / memory / …`, then positional rows.
  if (header?.rest !== null && header !== undefined && /^stages?$/iu.test(header.stage)) {
    const columns = splitCells(header.rest);
    const rows = body.slice(1).map(({ stage, rest }) => {
      const cells = rest === null ? [] : splitCells(rest);
      if (cells.length > columns.length && columns.length > 0) {
        const overflow = cells.splice(columns.length - 1);
        cells.push(overflow.join(' / '));
      }
      while (cells.length < columns.length) cells.push('');
      return { stage, cells };
    });
    return { title: first, columns, rows };
  }

  // Key-value form: `stage → latency: … / failure: …`.
  const parsedRows = body.map(({ stage, rest }) => {
    const values = new Map<string, string[]>();
    let keyed = 0;
    const add = (column: string, value: string): void => {
      const list = values.get(column) ?? [];
      list.push(value);
      values.set(column, list);
    };
    const cells = rest === null ? [] : splitCells(rest);
    for (const cell of cells) {
      const kv = KEY_VALUE.exec(cell);
      const keys = kv === null ? null : knownKeys(kv[1] ?? '');
      if (kv !== null && keys !== null) {
        keyed += 1;
        for (const key of keys) add(key, (kv[2] ?? '').trim());
      } else if (kv !== null) {
        keyed += 1;
        add(NOTE_COLUMN, cell);
      } else {
        add(NOTE_COLUMN, cell);
      }
    }
    return { stage, values, keyed, cells };
  });

  const anyKeyed = parsedRows.some((row) => row.keyed > 0);
  if (!anyKeyed) {
    // Positional rows without a header: one descriptive column, cells kept as written.
    return {
      title: first,
      columns: [DETAIL_COLUMN],
      rows: parsedRows.map((row) => ({ stage: row.stage, cells: [row.cells.join(' / ')] })),
    };
  }
  const present = new Set<string>();
  for (const row of parsedRows) for (const key of row.values.keys()) present.add(key);
  const columns = [...KNOWN_COLUMNS.filter((column) => present.has(column)), ...(present.has(NOTE_COLUMN) ? [NOTE_COLUMN] : [])];
  const rows = parsedRows.map((row) => ({
    stage: row.stage,
    cells: columns.map((column) => (row.values.get(column) ?? []).join('; ')),
  }));
  return { title: first, columns, rows };
}
