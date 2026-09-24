/**
 * @atlas/compiler — compiles docs/ into the Research Atlas bundle.
 *
 *   const atlas = await compileAtlas({ docsDir, referenceStackPath, compiledAt });
 *   await writeBundle(atlas, '.atlas');
 *
 * `compileAtlas` is in-memory and never reads the clock or the environment;
 * `writeBundle` is the only function that writes. Failures the caller can
 * branch on carry a stable `code` (`ManifestError` → `manifest-invalid`,
 * `AtlasInputError` → `reference-stack-unreadable` | `docs-unreadable` |
 * `compile-failed`, `BundleWriteError` → `bundle-write-failed`); content
 * defects are diagnostics in the result, never exceptions.
 */
import { layoutFigure } from '@atlas/visual';
import { compileMarkdown, indexNumberedObjects } from './markdown/index.ts';
import { runPipeline, type CompileAtlasOptions } from './project/pipeline.ts';
import type { CompiledAtlas } from './project/types.ts';

export type { CompileAtlasOptions, CompileEngine } from './project/pipeline.ts';
export type { CompiledAtlas } from './project/types.ts';
export { runPipeline } from './project/pipeline.ts';
export { writeBundle, bundleFiles, BundleWriteError, type WriteBundleOptions, type WriteReport } from './emit/write.ts';
export { ManifestError } from './project/manifest.ts';
export { AtlasInputError, type InputErrorCode } from './project/errors.ts';
export { stableStringify } from './emit/json.ts';
export { sortDiagnostics, groupByFile } from './emit/diagnostics.ts';
export { searchIndexOptions, loadSearchIndex } from './search/index-builder.ts';

/** Compiles the whole atlas in memory with the real Markdown compiler, Shiki, KaTeX, and ELK layout. */
export async function compileAtlas(options: CompileAtlasOptions): Promise<CompiledAtlas> {
  return runPipeline(options, { indexNumberedObjects, compileMarkdown, layoutFigure });
}
