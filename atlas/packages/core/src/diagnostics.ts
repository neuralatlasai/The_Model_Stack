/**
 * Compiler diagnostics. Content defects are reported, never silently dropped.
 * `error` fails `npm run compile -- --check` (and therefore the build);
 * `warning` is shown in the build report; `info` is bookkeeping.
 *
 * Links to planned-but-unwritten chapters are expected in Edition 1.0 and are
 * `info`, not `warning`: the manifest guarantees the destination will exist.
 */
import type { NodeId } from './ids.ts';

export const DIAGNOSTIC_CODES = {
  // frontmatter and structure
  'frontmatter-missing': 'error',
  'frontmatter-invalid': 'error',
  'frontmatter-id-mismatch': 'error',
  'manifest-unknown-node': 'warning',
  'heading-unknown-region': 'info',
  'heading-duplicate-anchor': 'warning',
  // links and citations
  'link-unresolved': 'warning',
  'link-planned': 'info',
  'citation-unresolved': 'warning',
  'xref-unresolved': 'info',
  // evidence rules
  'label-forbidden': 'error',
  'code-verified-without-commit': 'error',
  // typed blocks
  'block-malformed': 'warning',
  'equation-render-error': 'error',
  'equation-duplicate-number': 'warning',
  'algorithm-malformed': 'warning',
  'experiment-missing-field': 'info',
  'sibling-missing-field': 'info',
  'observation-layer-incomplete': 'warning',
  'raw-html-dropped': 'warning',
  'mermaid-parse-error': 'error',
  'term-duplicate-owner': 'warning',
  // visual grammar
  'figure-yaml-invalid': 'error',
  'figure-schema-invalid': 'error',
  'figure-duplicate-id': 'error',
  'figure-chapter-mismatch': 'error',
  'figure-formula-invalid': 'error',
  'figure-reference-invalid': 'error',
  'figure-context-missing': 'error',
  'figure-layout-failed': 'error',
  'rail-overflow': 'warning',
  // registries
  'reference-row-malformed': 'warning',
  'reference-duplicate-conflict': 'info',
  'reference-stack-parse': 'warning',
} as const satisfies Record<string, DiagnosticSeverity>;

export type DiagnosticSeverity = 'error' | 'warning' | 'info';
export type DiagnosticCode = keyof typeof DIAGNOSTIC_CODES;

export interface Diagnostic {
  readonly severity: DiagnosticSeverity;
  readonly code: DiagnosticCode;
  readonly message: string;
  /** Path relative to `docs/` (or the reference stack), forward slashes; null for global diagnostics. */
  readonly file: string | null;
  /** 1-based source line when known. */
  readonly line: number | null;
  readonly nodeId: NodeId | null;
}

/** Builds a diagnostic with the code's canonical severity. */
export function diagnostic(
  code: DiagnosticCode,
  message: string,
  location: { readonly file?: string | null; readonly line?: number | null; readonly nodeId?: NodeId | null } = {},
): Diagnostic {
  return {
    severity: DIAGNOSTIC_CODES[code],
    code,
    message,
    file: location.file ?? null,
    line: location.line ?? null,
    nodeId: location.nodeId ?? null,
  };
}

export function countBySeverity(diagnostics: readonly Diagnostic[]): Record<DiagnosticSeverity, number> {
  const counts: Record<DiagnosticSeverity, number> = { error: 0, warning: 0, info: 0 };
  for (const item of diagnostics) counts[item.severity] += 1;
  return counts;
}
