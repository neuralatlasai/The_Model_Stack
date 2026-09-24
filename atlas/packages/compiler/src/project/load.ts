/**
 * Project loading: manifest + every docs/ Markdown file with validated
 * frontmatter. Files without frontmatter at the docs root (the authoring
 * contracts CONTENT_CONTRACT.md and VISUAL_GRAMMAR.md) are not atlas pages and
 * are skipped silently; anywhere else a missing block is `frontmatter-missing`.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { diagnostic, type Diagnostic } from '@atlas/core';
import { listMarkdownFiles, normaliseText, readTextFiles } from './fs.ts';
import { parseFrontmatter, splitFrontmatter } from './frontmatter.ts';
import { ManifestError, parseManifest, type Manifest } from './manifest.ts';
import type { SourceDoc } from './types.ts';

export const MANIFEST_FILE = 'atlas-manifest.json';

export interface LoadedProject {
  readonly manifest: Manifest;
  readonly sources: readonly SourceDoc[];
  /** Files considered (for the report). */
  readonly fileCount: number;
  readonly diagnostics: readonly Diagnostic[];
}

export async function loadManifest(docsDir: string, signal?: AbortSignal): Promise<Manifest> {
  let text: string;
  try {
    text = await readFile(path.join(docsDir, MANIFEST_FILE), { encoding: 'utf8', signal });
  } catch (error: unknown) {
    if (signal?.aborted === true) throw error;
    throw new ManifestError(`cannot read ${path.join(docsDir, MANIFEST_FILE)}`, { cause: error });
  }
  return parseManifest(normaliseText(text));
}

export async function loadProject(docsDir: string, concurrency: number, signal?: AbortSignal): Promise<LoadedProject> {
  const manifest = await loadManifest(docsDir, signal);
  const paths = await listMarkdownFiles(docsDir, concurrency, signal);
  const files = await readTextFiles(docsDir, paths, concurrency, signal);
  const diagnostics: Diagnostic[] = [];
  const sources: SourceDoc[] = [];

  for (const file of files) {
    const split = splitFrontmatter(file.text);
    if (split === null) {
      if (!file.path.includes('/')) continue; // root-level authoring contracts, not pages
      diagnostics.push(diagnostic('frontmatter-missing', 'file has no YAML frontmatter block (--- … ---) on line 1', { file: file.path, line: 1 }));
      continue;
    }
    const parsed = parseFrontmatter(split.yaml);
    if (!parsed.ok) {
      diagnostics.push(diagnostic('frontmatter-invalid', parsed.message, { file: file.path, line: parsed.line }));
      continue;
    }
    sources.push({ path: file.path, meta: parsed.meta, body: split.body, bodyStartLine: split.bodyStartLine, text: file.text });
  }
  return { manifest, sources, fileCount: files.length, diagnostics };
}
