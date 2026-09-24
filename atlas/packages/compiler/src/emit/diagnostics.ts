/**
 * Diagnostic ordering and grouping for diagnostics.json and the CLI report.
 * Order: severity (error → warning → info), file (global first), line, code,
 * message — total, so the output is deterministic.
 */
import type { Diagnostic, DiagnosticSeverity } from '@atlas/core';

const SEVERITY_RANK: Readonly<Record<DiagnosticSeverity, number>> = { error: 0, warning: 1, info: 2 };

function compareText(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function compareDiagnostics(a: Diagnostic, b: Diagnostic): number {
  return (
    SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
    compareText(a.file ?? '', b.file ?? '') ||
    (a.line ?? 0) - (b.line ?? 0) ||
    compareText(a.code, b.code) ||
    compareText(a.message, b.message)
  );
}

/** Sorted copy with exact duplicates removed. */
export function sortDiagnostics(diagnostics: readonly Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  const out: Diagnostic[] = [];
  for (const item of [...diagnostics].sort(compareDiagnostics)) {
    const key = `${item.severity}|${item.code}|${item.file ?? ''}|${item.line === null ? '' : String(item.line)}|${item.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Groups by file (null → `(global)`), preserving the sorted order. */
export function groupByFile(diagnostics: readonly Diagnostic[]): Map<string, Diagnostic[]> {
  const groups = new Map<string, Diagnostic[]>();
  for (const item of diagnostics) {
    const key = item.file ?? '(global)';
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  return groups;
}
