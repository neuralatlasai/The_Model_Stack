/**
 * Bound the uncompressed Pages artifact, including every generated asset.
 * GitHub Pages permits a 1 GB published site; reserve 100 MB for growth.
 * Run after the final build and base-path rewriting, before uploading it.
 */
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export const SITE_SIZE_BUDGET_BYTES = 900_000_000;

export interface SiteSize {
  readonly files: number;
  readonly bytes: number;
}

/** Reject symlinks and special entries: the measured tree must be the uploaded tree. */
export async function measureSite(directory: string): Promise<SiteSize> {
  if (!(await stat(directory)).isDirectory()) throw new Error(`Not a site directory: ${directory}`);
  let files = 0;
  let bytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await measureSite(path);
      files += nested.files;
      bytes += nested.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += (await stat(path)).size;
    } else {
      throw new Error(`Site contains a symlink or unsupported entry: ${path}`);
    }
  }
  return { files, bytes };
}

/** Empty builds and exhausted growth allowance both block publication. */
export function assertSiteBudget(size: SiteSize, budget = SITE_SIZE_BUDGET_BYTES): void {
  if (!Number.isSafeInteger(budget) || budget <= 0) throw new Error('Site budget must be a positive integer.');
  if (size.files === 0) throw new Error('Site artifact is empty.');
  if (size.bytes > budget) {
    throw new Error(
      `Site artifact is ${String(size.bytes)} bytes; budget is ${String(budget)} bytes. Reduce repeated payloads before publishing.`,
    );
  }
}

if (import.meta.main) {
  const directory = process.argv[2];
  if (directory === undefined) {
    console.error('usage: node scripts/check-site-size.ts <dist-dir>');
    process.exitCode = 2;
  } else {
    try {
      const size = await measureSite(directory);
      assertSiteBudget(size);
      console.log(
        `${String(size.files)} files · ${String(size.bytes)} bytes · ${(size.bytes / 1_048_576).toFixed(2)} MiB · budget ${String(SITE_SIZE_BUDGET_BYTES)} bytes`,
      );
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}
