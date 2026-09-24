/**
 * Algorithm blocks (CONTENT_CONTRACT §5, UI_UX §17): a fenced `text` block
 *
 *   Algorithm 5.2 — Causal multi-head attention
 *   INPUT   n : [B, T, D]; …
 *           continuation lines are indented
 *   OUTPUT  a : [B, T, D]
 *   STATE   …
 *   INVARIANT …
 *   1.  Q, K, V ← …          # Eq. 5.4
 *   2.  S ← …                # comment
 *       unnumbered continuation
 *   TERMINATION: …
 *
 * parsed into an IO contract, numbered lines with comments and indentation,
 * and trailer lines. The paragraph after the block that begins `Complexity:`
 * is attached by the caller.
 */
import type { AlgorithmBlock, AlgorithmLine } from '@atlas/core';
import { objectAnchor } from '@atlas/core';
import type { CompileState, FlowEnv } from '../state.ts';
import { depthOf } from '../state.ts';

const TITLE = /^Algorithm(?:\s+((?:\d+|[A-Z])\.\d+[a-z]?))?\s*(?:[—–:-]\s*(.*))?$/u;
const HEADER = /^(INPUTS?|OUTPUTS?|STATE|INVARIANTS?)\b:?\s*(.*)$/u;
const NUMBERED = /^(\s*)(\d+)([.)]?)(\s+)(.*)$/u;
/** Trailer keywords at column 0 once the numbered body has started. */
const TRAILER =
  /^(?:TERMINATION|COMPLEXITY|COST|NOTES?|POSTCONDITIONS?|GUARANTEES?|FAILURES?|ERRORS?|RETURNS?|(?:STATE )?TRANSITIONS?)\b/u;
const COMMENT = /\s#\s?(.*)$/u;

function contentRows(code: string): string[] {
  const rows = code.replace(/\r\n?/gu, '\n').split('\n');
  const first = rows.findIndex((row) => row.trim() !== '');
  return first === -1 ? [] : rows.slice(first);
}

export function isAlgorithmSource(code: string): boolean {
  return /^Algorithm\b/u.test((contentRows(code)[0] ?? '').trim());
}

type HeaderKey = 'input' | 'output' | 'state' | 'invariant';

function headerKey(word: string): HeaderKey {
  if (word.startsWith('INPUT')) return 'input';
  if (word.startsWith('OUTPUT')) return 'output';
  if (word.startsWith('STATE')) return 'state';
  return 'invariant';
}

function splitComment(text: string): { code: string; comment: string | null } {
  const match = COMMENT.exec(text);
  if (match === null) return { code: text.trimEnd(), comment: null };
  return { code: text.slice(0, match.index).trimEnd(), comment: (match[1] ?? '').trim() || null };
}

export function parseAlgorithm(code: string, st: CompileState, env: FlowEnv, line: number | null): AlgorithmBlock {
  const rows = contentRows(code);
  const title = TITLE.exec((rows[0] ?? '').trim());
  const number = title?.[1] ?? null;
  const name = (title?.[2] ?? '').trim();
  const headers: Record<HeaderKey, string[]> = { input: [], output: [], state: [], invariant: [] };
  const trailer: string[] = [];
  const raw: { n: number | null; column: number; text: string }[] = [];
  let phase: 'header' | 'body' | 'trailer' = 'header';
  let lastHeader: HeaderKey | null = null;

  for (const row of rows.slice(1)) {
    if (row.trim() === '') continue;
    if (phase === 'trailer') {
      trailer.push(row.trimEnd());
      continue;
    }
    const header = HEADER.exec(row);
    if (header !== null && phase === 'header') {
      lastHeader = headerKey(header[1] ?? '');
      const text = (header[2] ?? '').trim();
      if (text !== '') headers[lastHeader].push(text);
      continue;
    }
    const numbered = NUMBERED.exec(row);
    if (numbered !== null) {
      phase = 'body';
      const column = (numbered[1] ?? '').length + (numbered[2] ?? '').length + (numbered[3] ?? '').length + (numbered[4] ?? '').length;
      raw.push({ n: Number.parseInt(numbered[2] ?? '0', 10), column, text: numbered[5] ?? '' });
      continue;
    }
    if (phase === 'body' && TRAILER.test(row)) {
      phase = 'trailer';
      trailer.push(row.trimEnd());
      continue;
    }
    if (phase === 'header' && lastHeader !== null && /^\s/u.test(row)) {
      headers[lastHeader].push(row.trim());
      continue;
    }
    if (phase === 'header' && /^[A-Z][A-Z_]{2,}\b/u.test(row)) {
      // An uppercase line before any numbered line that is not a known header (e.g. PARAMETERS): an extra header group.
      lastHeader = null;
      raw.push({ n: null, column: 0, text: row.trim() });
      continue;
    }
    const leading = row.length - row.trimStart().length;
    raw.push({ n: null, column: leading, text: row.trim() });
  }

  const numberedColumns = raw.filter((item) => item.n !== null).map((item) => item.column);
  const base = numberedColumns.length > 0 ? Math.min(...numberedColumns) : 0;
  const lines: AlgorithmLine[] = raw.map((item) => {
    const { code: body, comment } = splitComment(item.text);
    const offset = Math.max(0, item.column - base);
    return { n: item.n, code: body, comment, indent: offset < 2 ? 0 : offset };
  });

  if (title === null || number === null) {
    st.report('algorithm-malformed', 'algorithm title must read "Algorithm <ch>.<n> — <name>"', line);
  }
  if (numberedColumns.length === 0) st.report('algorithm-malformed', `Algorithm ${number ?? '?'} has no numbered lines`, line);
  if (headers.input.length === 0 || headers.output.length === 0) {
    st.report('algorithm-malformed', `Algorithm ${number ?? '?'} lacks an INPUT or OUTPUT contract`, line);
  }

  return {
    kind: 'algorithm',
    anchor: number === null ? null : st.anchors.claim(objectAnchor('alg', number)),
    depth: depthOf('algorithm', env),
    number,
    name,
    input: headers.input,
    output: headers.output,
    state: headers.state,
    invariant: headers.invariant,
    lines,
    trailer,
    complexity: null,
  };
}
