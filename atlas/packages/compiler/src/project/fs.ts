/**
 * Filesystem boundary of the compiler: directory walk and text reads, always
 * with bounded concurrency. Paths returned to the rest of the compiler are
 * relative to the docs root with forward slashes.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { mapLimit } from './concurrency.ts';

/** Directory names never descended into. */
const SKIPPED_DIRS: ReadonlySet<string> = new Set(['node_modules', '.git', '.atlas', '.astro', 'dist']);

export function toPosix(relative: string): string {
  return relative.split(path.sep).join('/');
}

/** Lists every `.md` file under `root`, relative and posix, sorted for determinism. */
export async function listMarkdownFiles(root: string, concurrency: number, signal?: AbortSignal): Promise<string[]> {
  const found: string[] = [];
  let frontier: string[] = [root];
  while (frontier.length > 0) {
    const listings = await mapLimit(
      frontier,
      concurrency,
      async (dir) => readdir(dir, { withFileTypes: true }).then((entries) => ({ dir, entries })),
      signal,
    );
    const nextFrontier: string[] = [];
    for (const { dir, entries } of listings) {
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!SKIPPED_DIRS.has(entry.name)) nextFrontier.push(full);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
          found.push(toPosix(path.relative(root, full)));
        }
      }
    }
    frontier = nextFrontier;
  }
  return found.sort(comparePaths);
}

/** Byte-wise path order (stable across platforms and locales). */
export function comparePaths(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export interface TextFile {
  /** Relative to the docs root, posix. */
  readonly path: string;
  readonly text: string;
}

/** Reads files as UTF-8 (BOM stripped, CRLF normalised to LF), bounded concurrency. */
export async function readTextFiles(
  root: string,
  relativePaths: readonly string[],
  concurrency: number,
  signal?: AbortSignal,
): Promise<TextFile[]> {
  return mapLimit(
    relativePaths,
    concurrency,
    async (relative) => ({ path: relative, text: normaliseText(await readFile(path.join(root, relative), { encoding: 'utf8', signal })) }),
    signal,
  );
}

export function normaliseText(raw: string): string {
  const withoutBom = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return withoutBom.replace(/\r\n?/gu, '\n');
}

/** Posix join + normalise of a docs-relative path. Returns null when the result escapes the root. */
export function resolveDocsPath(fromFile: string, href: string): string | null {
  const joined = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), href));
  if (joined === '..' || joined.startsWith('../') || path.posix.isAbsolute(joined)) return null;
  return joined === '.' ? '' : joined;
}
