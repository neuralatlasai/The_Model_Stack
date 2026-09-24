/**
 * Compiled output layout (`atlas/.atlas/`). The compiler writes it; the web
 * app reads it at build time. Reading is a file trust boundary, so the
 * manifest is zod-validated and its schema version checked before any other
 * file is trusted.
 */
import { z } from 'zod';
import type { NodeId } from './ids.ts';

export const BUNDLE_SCHEMA_VERSION = 1;

export const BUNDLE_FILES = {
  manifest: 'bundle.json',
  graph: 'graph.json',
  registry: 'registry.json',
  searchDocs: 'search-docs.json',
  searchIndex: 'search-index.json',
  diagnostics: 'diagnostics.json',
  docsDir: 'docs',
} as const;

/** `ms.section.5.2` → `docs/ms.section.5.2.json` (ids are filesystem-safe by construction). */
export function docFilePath(id: NodeId): string {
  return `${BUNDLE_FILES.docsDir}/${id}.json`;
}

export const BundleManifestSchema = z
  .object({
    schemaVersion: z.literal(BUNDLE_SCHEMA_VERSION),
    edition: z.string(),
    /** ISO timestamp passed in by the CLI (never read inside pure compile steps). */
    compiledAt: z.string(),
    docsRoot: z.string(),
    /** Every node with a compiled document, in reading order. */
    documents: z.array(z.string()),
    counts: z
      .object({
        documents: z.number().int().nonnegative(),
        planned: z.number().int().nonnegative(),
        figures: z.number().int().nonnegative(),
        equations: z.number().int().nonnegative(),
        references: z.number().int().nonnegative(),
        terms: z.number().int().nonnegative(),
        searchDocs: z.number().int().nonnegative(),
      })
      .strict(),
    diagnostics: z
      .object({ error: z.number().int().nonnegative(), warning: z.number().int().nonnegative(), info: z.number().int().nonnegative() })
      .strict(),
  })
  .strict();

export type BundleManifest = z.output<typeof BundleManifestSchema>;
