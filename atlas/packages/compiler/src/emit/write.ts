/**
 * Bundle writer (`atlas/.atlas/`, layout in core bundle.ts). Atomic by
 * default: every file is written into a sibling temp directory, `bundle.json`
 * last, then the directory is swapped in with two renames. When the swap is
 * refused (Windows keeps directories locked while a dev server reads them),
 * it falls back to writing in place with `bundle.json` last and stale
 * document files removed, so a reader never sees a new manifest over old docs.
 */
import { randomUUID } from 'node:crypto';
import { mkdir, readdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BUNDLE_FILES, BundleManifestSchema, docFilePath } from '@atlas/core';
import { mapLimit } from '../project/concurrency.ts';
import type { CompiledAtlas } from '../project/types.ts';
import { stableStringify } from './json.ts';

export interface WriteBundleOptions {
  readonly signal?: AbortSignal;
  /** Parallel file writes, clamped to 1..8. Default 8. */
  readonly concurrency?: number;
}

export interface WriteReport {
  readonly outDir: string;
  readonly files: number;
  readonly bytes: number;
  readonly mode: 'atomic' | 'in-place';
}

export class BundleWriteError extends Error {
  readonly code = 'bundle-write-failed';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'BundleWriteError';
  }
}

interface OutputFile {
  readonly relative: string;
  readonly content: string;
}

/** Serialises the compiled atlas into the bundle's files (manifest last). */
export function bundleFiles(result: CompiledAtlas): OutputFile[] {
  const manifest = BundleManifestSchema.safeParse(result.manifest);
  if (!manifest.success) {
    throw new BundleWriteError(`bundle manifest failed validation: ${manifest.error.issues.map((issue) => issue.message).join('; ')}`);
  }
  const files: OutputFile[] = result.documents.map((doc) => ({ relative: docFilePath(doc.meta.id), content: stableStringify(doc) }));
  files.push(
    { relative: BUNDLE_FILES.graph, content: stableStringify(result.graph) },
    { relative: BUNDLE_FILES.registry, content: stableStringify(result.registry) },
    { relative: BUNDLE_FILES.searchDocs, content: stableStringify(result.searchDocs) },
    // MiniSearch's own serialisation is already deterministic for a deterministic insertion order.
    { relative: BUNDLE_FILES.searchIndex, content: `${result.searchIndex}\n` },
    { relative: BUNDLE_FILES.diagnostics, content: stableStringify(result.diagnostics, 2) },
    { relative: BUNDLE_FILES.manifest, content: stableStringify(manifest.data, 2) },
  );
  return files;
}

function isSwapRefusal(error: unknown): boolean {
  if (error === null || typeof error !== 'object' || !('code' in error)) return false;
  return error.code === 'EPERM' || error.code === 'EBUSY' || error.code === 'EACCES' || error.code === 'EXDEV' || error.code === 'ENOTEMPTY';
}

async function writeAll(dir: string, files: readonly OutputFile[], concurrency: number, signal?: AbortSignal): Promise<void> {
  await mkdir(path.join(dir, BUNDLE_FILES.docsDir), { recursive: true });
  const manifestFile = files.find((file) => file.relative === BUNDLE_FILES.manifest);
  const rest = files.filter((file) => file.relative !== BUNDLE_FILES.manifest);
  await mapLimit(rest, concurrency, async (file) => writeFile(path.join(dir, file.relative), file.content, { encoding: 'utf8', signal }), signal);
  if (manifestFile !== undefined) {
    await writeFile(path.join(dir, manifestFile.relative), manifestFile.content, { encoding: 'utf8', signal });
  }
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await readdir(target);
    return true;
  } catch (error: unknown) {
    if (error !== null && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

/** Removes `docs/*.json` files that the new bundle does not contain (in-place mode). */
async function removeStaleDocs(outDir: string, files: readonly OutputFile[]): Promise<void> {
  const keep = new Set(files.map((file) => path.basename(file.relative)));
  const docsDir = path.join(outDir, BUNDLE_FILES.docsDir);
  const existing = await readdir(docsDir).catch((error: unknown) => {
    if (error !== null && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return [] as string[];
    throw error;
  });
  for (const name of existing) {
    if (name.endsWith('.json') && !keep.has(name)) await rm(path.join(docsDir, name), { force: true });
  }
}

export async function writeBundle(result: CompiledAtlas, outDir: string, options: WriteBundleOptions = {}): Promise<WriteReport> {
  const files = bundleFiles(result);
  const bytes = files.reduce((sum, file) => sum + Buffer.byteLength(file.content, 'utf8'), 0);
  const concurrency = options.concurrency ?? 8;
  const target = path.resolve(outDir);
  const parent = path.dirname(target);
  const base = path.basename(target);
  await mkdir(parent, { recursive: true });

  const staging = path.join(parent, `.${base}.tmp-${randomUUID()}`);
  try {
    await writeAll(staging, files, concurrency, options.signal);
    options.signal?.throwIfAborted();

    const hadPrevious = await pathExists(target);
    if (!hadPrevious) {
      await rename(staging, target);
      return { outDir: target, files: files.length, bytes, mode: 'atomic' };
    }
    const retired = path.join(parent, `.${base}.old-${randomUUID()}`);
    try {
      await rename(target, retired);
    } catch (error: unknown) {
      if (!isSwapRefusal(error)) throw error;
      // Directory locked: write in place, manifest last, then drop stale documents.
      await writeAll(target, files, concurrency, options.signal);
      await removeStaleDocs(target, files);
      return { outDir: target, files: files.length, bytes, mode: 'in-place' };
    }
    try {
      await rename(staging, target);
    } catch (error: unknown) {
      await rename(retired, target);
      throw error;
    }
    await rm(retired, { recursive: true, force: true });
    return { outDir: target, files: files.length, bytes, mode: 'atomic' };
  } catch (error: unknown) {
    throw error instanceof BundleWriteError ? error : new BundleWriteError(`could not write the bundle to ${target}`, { cause: error });
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}
