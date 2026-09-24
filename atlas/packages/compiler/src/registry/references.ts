/**
 * Reference registry (UI_UX §19, §67; CONTENT_CONTRACT §14). Every chapter's
 * `references.md` tables are read by header name (column order differs
 * between chapters) and merged by key: spine keys (`P19`) recur across
 * chapters and accumulate `uses`; chapter keys (`R5.13`) are chapter-scoped.
 * Metadata comes from the first chapter (reading order) that lists the key;
 * later disagreements are recorded as `reference-duplicate-conflict` (info).
 */
import {
  REFERENCE_STATUSES,
  REFERENCE_TYPES,
  chapterNumberOf,
  diagnostic,
  isCitationKey,
  isSpinePaperKey,
  paperUrl,
  type CitationKey,
  type Diagnostic,
  type NodeId,
  type ReferenceRecord,
  type ReferenceUse,
} from '@atlas/core';
import { squash } from '../project/text.ts';
import { cellLinks, cellText, extractTables, mapColumns, parseMarkdown, type TableRowValue } from './markdown-table.ts';

const COLUMNS = {
  key: ['key'],
  type: ['type'],
  work: ['work', 'title'],
  authors: ['authors / organisation', 'authors / organization', 'authors/organisation', 'authors/organization', 'authors', 'organisation', 'organization'],
  venue: ['venue / year', 'venue/year', 'venue', 'year'],
  url: ['primary url', 'url'],
  code: ['official code', 'code'],
  status: ['status'],
  usedFor: ['used for'],
  accessed: ['accessed'],
} as const;
type Column = keyof typeof COLUMNS;

/** One row of one chapter's references table. */
export interface ReferenceRow {
  readonly key: CitationKey;
  readonly type: string;
  readonly work: string;
  readonly authors: string;
  readonly venue: string;
  readonly url: string | null;
  readonly code: string | null;
  readonly status: string;
  readonly usedFor: string;
  readonly accessed: string | null;
  readonly chapter: number;
  readonly file: string;
  readonly line: number | null;
}

export interface ReferencesFileInput {
  /** Docs-relative path of the references.md file. */
  readonly file: string;
  readonly chapter: number;
  /** Markdown body (frontmatter removed). */
  readonly body: string;
  /** 1-based line of the body's first line in the file. */
  readonly bodyStartLine: number;
  readonly nodeId: NodeId | null;
}

const NULLISH = /^(?:null|none|n\/a|—|–|-)?(?:\s*\(.*\))?$/iu;
const URL_IN_TEXT = /https?:\/\/[^\s<>()|]+/u;

/** URL cell → URL or null. Links win over text; `null` and blanks are null. */
export function urlCell(text: string, links: readonly string[]): string | null {
  const link = links.find((candidate) => /^https?:\/\//iu.test(candidate));
  if (link !== undefined) return link;
  const trimmed = text.trim();
  if (NULLISH.test(trimmed)) return null;
  return URL_IN_TEXT.exec(trimmed)?.[0] ?? null;
}

/**
 * A canonical vocabulary value, allowing a trailing qualifier the authors add
 * (`preprint (venue not confirmed on page)` → `preprint`). Null when the cell
 * does not start with a canonical value.
 */
export function canonicalValue<V extends string>(text: string, vocabulary: readonly V[]): V | null {
  const lowered = text.trim().toLowerCase();
  for (const value of vocabulary) {
    const key = value.toLowerCase();
    if (lowered === key) return value;
    if (lowered.startsWith(key) && /^[\s(;,:—–-]/u.test(lowered.slice(key.length))) return value;
  }
  return null;
}

function isNullish(text: string): boolean {
  return NULLISH.test(text.trim());
}

/** Parses every references table in one file. */
export function parseReferencesFile(input: ReferencesFileInput): { rows: ReferenceRow[]; diagnostics: Diagnostic[] } {
  const rows: ReferenceRow[] = [];
  const diagnostics: Diagnostic[] = [];
  const root = parseMarkdown(input.body);
  const lineOf = (row: TableRowValue): number | null => (row.line === null ? null : row.line + input.bodyStartLine - 1);
  const at = (line: number | null): { file: string; line: number | null; nodeId: NodeId | null } => ({ file: input.file, line, nodeId: input.nodeId });

  for (const table of extractTables(root)) {
    const columns = mapColumns<Column>(table.headers, COLUMNS);
    if (columns.key === undefined || columns.work === undefined) continue;
    const missing = (['type', 'authors', 'venue', 'url', 'status', 'usedFor'] as const).filter((field) => columns[field] === undefined);
    if (missing.length > 0) {
      diagnostics.push(
        diagnostic('reference-row-malformed', `references table lacks column(s): ${missing.join(', ')}`, at(table.line === null ? null : table.line + input.bodyStartLine - 1)),
      );
    }

    for (const row of table.rows) {
      const line = lineOf(row);
      const rawKey = cellText(row, columns.key).replace(/[*`[\]]/gu, '').trim();
      if (rawKey === '') continue;
      if (!isCitationKey(rawKey)) {
        diagnostics.push(diagnostic('reference-row-malformed', `"${rawKey}" is not a citation key (P01–P52 or R<ch>.<n>)`, at(line)));
        continue;
      }
      const work = cellText(row, columns.work);
      if (work === '' || isNullish(work)) {
        diagnostics.push(diagnostic('reference-row-malformed', `${rawKey}: the Work cell is empty`, at(line)));
        continue;
      }
      const keyChapter = chapterNumberOf(rawKey);
      if (keyChapter !== null && keyChapter !== input.chapter) {
        diagnostics.push(
          diagnostic('reference-row-malformed', `${rawKey} is a chapter-${String(keyChapter)} key listed in chapter ${String(input.chapter)}'s references`, at(line)),
        );
      }
      const typeText = cellText(row, columns.type);
      const type = canonicalValue(typeText, REFERENCE_TYPES) ?? typeText;
      if (typeText !== '' && type === typeText && !(REFERENCE_TYPES as readonly string[]).includes(type)) {
        diagnostics.push(diagnostic('reference-row-malformed', `${rawKey}: type "${typeText}" is not one of ${REFERENCE_TYPES.join(' · ')}`, at(line)));
      }
      const statusText = cellText(row, columns.status);
      const status = canonicalValue(statusText, REFERENCE_STATUSES) ?? statusText;
      if (statusText !== '' && status === statusText && !(REFERENCE_STATUSES as readonly string[]).includes(status)) {
        diagnostics.push(
          diagnostic('reference-row-malformed', `${rawKey}: status "${statusText}" is not one of ${REFERENCE_STATUSES.join(' · ')}`, at(line)),
        );
      }
      const urlText = cellText(row, columns.url);
      const url = urlCell(urlText, cellLinks(row, columns.url));
      if (url === null && !isNullish(urlText)) {
        diagnostics.push(diagnostic('reference-row-malformed', `${rawKey}: Primary URL cell "${urlText}" contains no http(s) URL`, at(line)));
      }
      const accessed = cellText(row, columns.accessed);
      rows.push({
        key: rawKey,
        type,
        work,
        authors: cellText(row, columns.authors),
        venue: cellText(row, columns.venue),
        url,
        code: urlCell(cellText(row, columns.code), cellLinks(row, columns.code)),
        status,
        usedFor: cellText(row, columns.usedFor),
        accessed: accessed === '' || isNullish(accessed) ? null : accessed,
        chapter: input.chapter,
        file: input.file,
        line,
      });
    }
  }
  return { rows, diagnostics };
}

/** Spine keys by number, then chapter keys by (chapter, n). */
export function compareCitationKeys(a: string, b: string): number {
  const rank = (key: string): readonly [number, number, number] => {
    const spine = /^P(\d+)$/u.exec(key);
    if (spine?.[1] !== undefined) return [0, Number.parseInt(spine[1], 10), 0];
    const chapter = /^R(\d+)\.(\d+)$/u.exec(key);
    if (chapter?.[1] !== undefined && chapter[2] !== undefined) return [1, Number.parseInt(chapter[1], 10), Number.parseInt(chapter[2], 10)];
    return [2, 0, 0];
  };
  const [a0, a1, a2] = rank(a);
  const [b0, b1, b2] = rank(b);
  if (a0 !== b0) return a0 - b0;
  if (a1 !== b1) return a1 - b1;
  if (a2 !== b2) return a2 - b2;
  return a < b ? -1 : a > b ? 1 : 0;
}

const COMPARED_FIELDS = ['type', 'work', 'authors', 'venue', 'url', 'code', 'status'] as const;

function comparable(value: string | null): string {
  return value === null ? '' : squash(value).toLowerCase();
}

/**
 * Merges rows (given in reading order) by key. `authority` rows (Appendix D,
 * the spine of record) supply metadata first but add no chapter use.
 * `citedBy` is left empty; the pipeline fills it once bodies are compiled.
 */
export function mergeReferences(
  rows: readonly ReferenceRow[],
  authority: readonly ReferenceRow[] = [],
): { records: ReferenceRecord[]; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const firstRow = new Map<CitationKey, ReferenceRow>();
  const uses = new Map<CitationKey, ReferenceUse[]>();

  for (const row of authority) {
    if (!firstRow.has(row.key)) {
      firstRow.set(row.key, row);
      uses.set(row.key, []);
    }
  }

  for (const row of rows) {
    const first = firstRow.get(row.key);
    if (first === undefined) {
      firstRow.set(row.key, row);
      uses.set(row.key, [{ chapter: row.chapter, usedFor: row.usedFor, accessed: row.accessed }]);
      continue;
    }
    const differing = COMPARED_FIELDS.filter((field) => comparable(first[field]) !== comparable(row[field]) && row[field] !== null && row[field] !== '');
    if (differing.length > 0) {
      diagnostics.push(
        diagnostic(
          'reference-duplicate-conflict',
          `${row.key}: ${differing.join(', ')} differ from the record in ${first.file} (first listing wins)`,
          { file: row.file, line: row.line },
        ),
      );
    }
    const list = uses.get(row.key) ?? [];
    const sameChapter = list.findIndex((use) => use.chapter === row.chapter);
    if (sameChapter === -1) {
      list.push({ chapter: row.chapter, usedFor: row.usedFor, accessed: row.accessed });
    } else {
      const existing = list[sameChapter];
      if (existing !== undefined && row.usedFor !== '' && !existing.usedFor.includes(row.usedFor)) {
        list[sameChapter] = { ...existing, usedFor: existing.usedFor === '' ? row.usedFor : `${existing.usedFor}; ${row.usedFor}` };
      }
    }
    uses.set(row.key, list);
  }

  const records: ReferenceRecord[] = [...firstRow.values()]
    .sort((a, b) => compareCitationKeys(a.key, b.key))
    .map((row) => ({
      key: row.key,
      spine: isSpinePaperKey(row.key),
      type: row.type,
      work: row.work,
      authors: row.authors,
      venue: row.venue,
      url: row.url,
      code: row.code,
      status: row.status,
      uses: [...(uses.get(row.key) ?? [])].sort((x, y) => x.chapter - y.chapter),
      citedBy: [],
      atlasUrl: paperUrl(row.key),
    }));
  return { records, diagnostics };
}
