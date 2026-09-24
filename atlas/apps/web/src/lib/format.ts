/**
 * Presentation formatting for the shell. Deterministic and locale-free so the
 * same build always emits the same bytes (no Intl, no Date parsing of local
 * time). Number formatting for instruments lives in @atlas/core (format.ts).
 */
import type { EditorialStatus, Maturity, NodeState } from '@atlas/core';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/u;

interface DateParts {
  readonly year: string;
  readonly month: string;
  readonly day: number;
}

function dateParts(iso: string): DateParts | null {
  const match = ISO_DATE.exec(iso);
  if (match === null) return null;
  const [, year, month, day] = match;
  if (year === undefined || month === undefined || day === undefined) return null;
  const monthName = MONTHS[Number.parseInt(month, 10) - 1];
  if (monthName === undefined) return null;
  return { year, month: monthName, day: Number.parseInt(day, 10) };
}

/** `2026-09-20` → `Sep 2026`; unparseable input is returned unchanged. */
export function formatMonthYear(iso: string): string {
  const parts = dateParts(iso);
  return parts === null ? iso : `${parts.month} ${parts.year}`;
}

/** `2026-09-20` → `20 Sep 2026`; unparseable input is returned unchanged. */
export function formatDay(iso: string): string {
  const parts = dateParts(iso);
  return parts === null ? iso : `${String(parts.day)} ${parts.month} ${parts.year}`;
}

/** `updated Sep 2026` (UI_UX §9 metadata line). */
export function updatedLabel(iso: string): string {
  return `updated ${formatMonthYear(iso)}`;
}

/** Machine-readable `YYYY-MM-DD` prefix for `<time datetime>`; null when the input is not a date. */
export function isoDate(iso: string): string | null {
  const match = ISO_DATE.exec(iso);
  return match === null ? null : match[0];
}

/** Two-digit chapter number (`5` → `05`). */
export function padChapter(chapter: number): string {
  return chapter.toString().padStart(2, '0');
}

const STATE_LABELS: Readonly<Record<NodeState, string>> = {
  architecture_only: 'architecture only',
  manuscript_draft: 'manuscript draft',
  reviewed: 'reviewed',
  released: 'released',
  planned: 'planned',
};

export function stateLabel(state: NodeState | EditorialStatus): string {
  return STATE_LABELS[state];
}

export function maturityLabel(maturity: Maturity): string {
  return maturity;
}

/** `1 section` / `6 sections`. */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${grouped(count)} ${count === 1 ? singular : pluralForm}`;
}

/** Grouped integer without locale dependence (`12345` → `12,345`). */
export function grouped(count: number): string {
  return Math.round(count)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/gu, ',');
}

/** Code-unit string order (locale-independent, so builds are reproducible). */
export function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** Truncates to at most `max` characters, ending with an ellipsis when cut. */
export function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  if (max <= 1) return text.slice(0, max);
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Collapses internal whitespace (search/alt text, meta descriptions). */
export function squash(text: string): string {
  return text.replace(/\s+/gu, ' ').trim();
}

/**
 * Sort key for lineage years (`2017`, `2025+`): `2025+` sorts after `2025`.
 * Non-numeric input sorts last.
 */
export function yearSortKey(year: string): number {
  const match = /^(\d{4})(\+)?$/u.exec(year.trim());
  if (match === null) return Number.POSITIVE_INFINITY;
  const base = Number.parseInt(match[1] ?? '0', 10);
  return match[2] === undefined ? base : base + 0.5;
}

const ROMAN: readonly (readonly [number, string])[] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** Upper-case Roman numeral for 1–3999 (volume and part identity lines); other input is returned as digits. */
export function roman(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) return String(value);
  let rest = value;
  let out = '';
  for (const [unit, glyph] of ROMAN) {
    while (rest >= unit) {
      out += glyph;
      rest -= unit;
    }
  }
  return out;
}
