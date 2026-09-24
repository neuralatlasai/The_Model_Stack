/**
 * Markdown → research-AST translation (pure; no filesystem). The project layer
 * calls `indexNumberedObjects` on every body first (cross-reference pass 1),
 * then `compileMarkdown` with a CompileContext per document.
 */
export { compileMarkdown } from './compile.ts';
export { indexNumberedObjects } from './number-index.ts';
export type { CompileContext, CompiledBody, MarkdownInput, NumberedObjectIndex } from './contract.ts';
