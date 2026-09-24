/**
 * The compile pipeline, parameterised by the Markdown engine and the layout
 * function so it can be exercised without them:
 *
 *   load (manifest, frontmatter) → node table → routes → references + stack
 *   → pass 1 (numbered objects → xref index) → pass 2 (bodies, bounded)
 *   → documents → registry → graph → search → diagnostics → bundle manifest
 *
 * Pure with respect to time: `compiledAt` is an input. All fan-out is bounded.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BUNDLE_SCHEMA_VERSION,
  DOCUMENT_SCHEMA_VERSION,
  chapterNumberOf,
  countBySeverity,
  type BundleManifest,
  type CitationKey,
  type Diagnostic,
  type FigureSpec,
  type NodeId,
  type ReferenceRecord,
  type Registry,
  type ResearchDocument,
  type Scene,
} from '@atlas/core';
import type { CompileContext, CompiledBody, MarkdownInput, NumberedObjectIndex } from '../markdown/contract.ts';
import { sortDiagnostics } from '../emit/diagnostics.ts';
import { buildGraph } from '../graph/build.ts';
import { createCodeHighlighter, type CodeHighlighter } from '../highlight/highlighter.ts';
import { buildEntities } from '../registry/entities.ts';
import { buildEquationIndex, buildObjectIndex } from '../registry/indexes.ts';
import { collectLineage } from '../registry/lineage.ts';
import { mergeReferences, parseReferencesFile, type ReferenceRow } from '../registry/references.ts';
import { parseReferenceStack } from '../registry/reference-stack.ts';
import { collectTerms } from '../registry/terms.ts';
import { buildSearchIndex } from '../search/index-builder.ts';
import { buildSearchDocs } from '../search/docs.ts';
import { clampConcurrency, mapLimit } from './concurrency.ts';
import { AtlasInputError } from './errors.ts';
import { normaliseText, toPosix } from './fs.ts';
import { createLinkResolver } from './links.ts';
import { loadProject } from './load.ts';
import { ManifestError } from './manifest.ts';
import { renderMath } from './math.ts';
import { buildNodeTable } from './nodes.ts';
import { buildRoutes } from './routes.ts';
import type { CompiledAtlas, CompiledSource, SourceDoc } from './types.ts';
import { buildXRefIndex, type XRefSource } from './xref.ts';

export interface CompileAtlasOptions {
  /** The docs/ directory (absolute, or relative to the working directory). */
  readonly docsDir: string;
  /** Path to Instruction/AI_REFERENCE_STACK.md (read-only input). */
  readonly referenceStackPath: string;
  /** ISO timestamp recorded in bundle.json; supplied by the caller, never read from the clock here. */
  readonly compiledAt: string;
  /** Parallel file reads and document compiles, clamped to 1..8. Default 4. */
  readonly concurrency?: number;
  /** Cancels the compile between documents and stages. */
  readonly signal?: AbortSignal;
}

/** The Markdown compiler and layout engine the pipeline drives (see markdown/contract.ts). */
export interface CompileEngine {
  readonly indexNumberedObjects: (input: MarkdownInput) => NumberedObjectIndex | Promise<NumberedObjectIndex>;
  readonly compileMarkdown: (input: MarkdownInput, ctx: CompileContext) => CompiledBody | Promise<CompiledBody>;
  readonly layoutFigure: (spec: FigureSpec) => Promise<Scene | null>;
  /** Defaults to the Shiki highlighter with the atlas themes. */
  readonly createHighlighter?: () => Promise<CodeHighlighter>;
}

const DEFAULT_CONCURRENCY = 4;
const APPENDIX_D_ID: NodeId = 'ms.appendix.d';

function markdownInput(source: SourceDoc): MarkdownInput {
  return { sourcePath: source.path, body: source.body, bodyStartLine: source.bodyStartLine, meta: source.meta };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function runPipeline(options: CompileAtlasOptions, engine: CompileEngine): Promise<CompiledAtlas> {
  const { signal } = options;
  signal?.throwIfAborted();
  const concurrency = clampConcurrency(options.concurrency, DEFAULT_CONCURRENCY);
  const docsDir = path.resolve(options.docsDir);
  const stackPath = path.resolve(options.referenceStackPath);
  const stackFile = toPosix(path.relative(docsDir, stackPath));

  // ── load ───────────────────────────────────────────────────────────────────
  const project = await loadProject(docsDir, concurrency, signal).catch((error: unknown) => {
    if (error instanceof ManifestError) throw error;
    if (signal?.aborted === true) throw error;
    throw new AtlasInputError('docs-unreadable', `cannot read the docs directory ${docsDir}: ${describe(error)}`, { cause: error });
  });
  let stackText: string;
  try {
    stackText = normaliseText(await readFile(stackPath, { encoding: 'utf8', signal }));
  } catch (error: unknown) {
    if (signal?.aborted === true) throw error;
    throw new AtlasInputError('reference-stack-unreadable', `cannot read the reference stack ${stackPath}`, { cause: error });
  }

  const table = buildNodeTable(project.manifest, project.sources);
  const routes = buildRoutes(table);
  const stack = parseReferenceStack(stackText, stackFile);
  signal?.throwIfAborted();

  // ── references (read from source before any body is compiled) ──────────────
  const referenceRows: ReferenceRow[] = [];
  const authorityRows: ReferenceRow[] = [];
  const referenceDiagnostics: Diagnostic[] = [];
  for (const source of table.docs) {
    const isChapterReferences = source.meta.entityType === 'references';
    const isSpineAppendix = source.meta.id === APPENDIX_D_ID;
    if (!isChapterReferences && !isSpineAppendix) continue;
    const chapter = source.meta.chapter ?? chapterNumberOf(source.meta.id) ?? 0;
    const parsed = parseReferencesFile({ file: source.path, chapter, body: source.body, bodyStartLine: source.bodyStartLine, nodeId: source.meta.id });
    if (isSpineAppendix) {
      authorityRows.push(...parsed.rows.filter((row) => row.key.startsWith('P')));
    } else {
      referenceRows.push(...parsed.rows);
      referenceDiagnostics.push(...parsed.diagnostics);
    }
  }
  const merged = mergeReferences(referenceRows, authorityRows);
  referenceDiagnostics.push(...merged.diagnostics);
  const citationKeys = new Set<string>(merged.records.map((record) => record.key));

  // ── pass 1: numbered objects → cross-reference index ───────────────────────
  const numbered = await mapLimit(table.docs, concurrency, async (source) => engine.indexNumberedObjects(markdownInput(source)), signal);
  const xrefSources: XRefSource[] = table.docs.map((source, index) => ({
    nodeId: source.meta.id,
    url: table.nodes.get(source.meta.id)?.url ?? '/',
    sourcePath: source.path,
    index: numbered[index] ?? { equations: [], algorithms: [], figures: [], experiments: [], propositions: [] },
  }));
  const xref = buildXRefIndex(xrefSources);

  // ── pass 2: bodies ─────────────────────────────────────────────────────────
  const highlighter = await (engine.createHighlighter ?? createCodeHighlighter)();
  let compiled: CompiledSource[];
  let documentDiagnostics: Diagnostic[][];
  try {
    const results = await mapLimit(
      table.docs,
      concurrency,
      async (source) => {
        const resolver = createLinkResolver(table, source.path, source.meta.id);
        const ctx: CompileContext = {
          resolveLink: resolver.resolve,
          hasCitation: (key: CitationKey) => citationKeys.has(key),
          resolveXRef: xref.resolve,
          renderMath,
          highlight: highlighter.highlight,
          layout: engine.layoutFigure,
          nodeExists: (id: NodeId) => table.nodes.has(id),
        };
        let body: CompiledBody;
        try {
          body = await engine.compileMarkdown(markdownInput(source), ctx);
        } catch (error: unknown) {
          if (signal?.aborted === true) throw error;
          throw new AtlasInputError('compile-failed', `the Markdown compiler failed on ${source.path}: ${describe(error)}`, { cause: error });
        }
        return { compiled: { source, body }, diagnostics: [...body.diagnostics, ...resolver.diagnostics()] };
      },
      signal,
    );
    compiled = results.map((result) => result.compiled);
    documentDiagnostics = results.map((result) => result.diagnostics);
  } finally {
    highlighter.dispose();
  }

  // ── documents ──────────────────────────────────────────────────────────────
  const documents: ResearchDocument[] = [];
  const documentsById = new Map<NodeId, ResearchDocument>();
  compiled.forEach(({ source, body }, index) => {
    const route = routes.get(source.meta.id);
    if (route === undefined) return;
    const doc: ResearchDocument = {
      schemaVersion: DOCUMENT_SCHEMA_VERSION,
      meta: source.meta,
      route,
      header: body.header,
      lead: body.lead,
      regions: body.regions,
      figures: body.figures,
      rail: body.rail,
      outline: body.outline,
      citations: body.citations,
      definedTerms: body.definedTerms,
      linksTo: body.linksTo,
      stats: body.stats,
      sourcePath: source.path,
      diagnostics: sortDiagnostics(documentDiagnostics[index] ?? []),
    };
    documents.push(doc);
    documentsById.set(doc.meta.id, doc);
  });

  // ── registry ───────────────────────────────────────────────────────────────
  // A chapter's references page lists every key; it is the bibliography, not a citing text.
  const citingDocuments = documents.filter((doc) => doc.meta.entityType !== 'references');
  const references: ReferenceRecord[] = merged.records.map((record) => ({
    ...record,
    citedBy: citingDocuments.filter((doc) => doc.citations.includes(record.key)).map((doc) => doc.meta.id),
  }));
  const terms = collectTerms(compiled, table);
  const entities = buildEntities(stack, compiled, table);
  const lineage = collectLineage(compiled);
  const registry: Registry = {
    references,
    terms: terms.terms,
    systems: entities.systems,
    labs: entities.labs,
    lineage: lineage.lineage,
    equations: buildEquationIndex(compiled, table),
    objects: buildObjectIndex(compiled, table),
  };

  // ── graph, search ──────────────────────────────────────────────────────────
  const graph = buildGraph(table, documentsById);
  const searchDocs = buildSearchDocs({ table, documents: documentsById, registry, systems: stack.systems, labs: stack.labs });
  const searchIndex = buildSearchIndex(searchDocs);
  signal?.throwIfAborted();

  // ── diagnostics and manifest ───────────────────────────────────────────────
  const projectDiagnostics = [
    ...project.diagnostics,
    ...table.diagnostics,
    ...stack.diagnostics,
    ...referenceDiagnostics,
    ...xref.diagnostics,
    ...terms.diagnostics,
    ...entities.diagnostics,
    ...lineage.diagnostics,
    ...graph.diagnostics,
  ];
  const diagnostics = sortDiagnostics([...projectDiagnostics, ...documents.flatMap((doc) => doc.diagnostics)]);

  const manifest: BundleManifest = {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    edition: project.manifest.edition,
    compiledAt: options.compiledAt,
    docsRoot: project.manifest.root,
    documents: documents.map((doc) => doc.meta.id),
    counts: {
      documents: documents.length,
      planned: Object.values(graph.graph.nodes).filter((node) => !node.hasManuscript).length,
      figures: documents.reduce((sum, doc) => sum + doc.figures.length, 0),
      equations: registry.equations.length,
      references: registry.references.length,
      terms: registry.terms.length,
      searchDocs: searchDocs.length,
    },
    diagnostics: countBySeverity(diagnostics),
  };

  return { manifest, documents, graph: graph.graph, registry, searchDocs, searchIndex, diagnostics };
}
