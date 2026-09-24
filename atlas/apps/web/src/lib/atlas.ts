/**
 * Build-time loader for the compiled bundle (`atlas/.atlas/`).
 *
 * Contract (shared with web-blocks and web-client):
 *   loadBundle()        manifest + graph + registry, validated once per process
 *   getDocument(id)     one compiled ResearchDocument
 *   getGraph()          AtlasGraph
 *   getRegistry()       Registry
 *   listDocuments()     every compiled document in reading order
 *   buildPageData(doc)  the per-page PageData island (validated by PageDataSchema)
 *
 * The bundle directory is configuration: `ATLAS_BUNDLE_DIR` (process env,
 * read once) overrides the default injected by astro.config.mjs. Every file is
 * a trust boundary: the manifest is parsed with core `BundleManifestSchema`
 * after an explicit schema-version check; graph, registry and documents are
 * parsed with the schemas in bundle-schemas.ts.
 *
 * Caching: one promise for the bundle and one per document, bounded by the
 * manifest's document list and keyed by the bundle directory. Failed reads
 * are not cached. During `astro dev` the caches are also dropped whenever
 * `bundle.json` changes on disk, so `npm run compile` is picked up without
 * restarting the server.
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { z } from 'zod';
import {
  BUNDLE_FILES,
  BUNDLE_SCHEMA_VERSION,
  BundleManifestSchema,
  DOCUMENT_SCHEMA_VERSION,
  docFilePath,
  isNodeId,
  neighbourhood,
  SEARCH_KINDS,
  type AtlasGraph,
  type BundleManifest,
  type CitationKey,
  type GlossaryTerm,
  type GraphNode,
  type Neighbourhood,
  type NodeId,
  type PageData,
  type ReferenceRecord,
  type Registry,
  type ResearchDocument,
} from '@atlas/core';
import { atlasGraphSchema, describeIssues, documentEnvelopeSchema, registrySchema } from './bundle-schemas.ts';
import { mapBounded } from './concurrency.ts';
import { pageDataFor } from './page-data.ts';

export type AtlasBundleErrorCode =
  | 'config-invalid'
  | 'bundle-missing'
  | 'bundle-unreadable'
  | 'bundle-invalid'
  | 'schema-version'
  | 'document-missing';

/** Stable, branchable failure for every bundle-loading problem (engineering standards §6). */
export class AtlasBundleError extends Error {
  readonly code: AtlasBundleErrorCode;

  constructor(code: AtlasBundleErrorCode, message: string, options?: { readonly cause?: unknown }) {
    super(message, options);
    this.name = 'AtlasBundleError';
    this.code = code;
  }
}

export interface LoadedBundle {
  /** Absolute bundle directory. */
  readonly dir: string;
  readonly manifest: BundleManifest;
  readonly graph: AtlasGraph;
  readonly registry: Registry;
}

const RUN_COMPILE = 'Run `npm run compile` from atlas/ first (or set ATLAS_BUNDLE_DIR to a compiled bundle).';
const DOCUMENT_READ_CONCURRENCY = 8;

// ─── configuration boundary ───────────────────────────────────────────────────

const bundleDirSchema = z.string().trim().min(1);

function resolveBundleDir(): string {
  const override = process.env['ATLAS_BUNDLE_DIR'];
  const injected = typeof __ATLAS_BUNDLE_DIR__ === 'string' ? __ATLAS_BUNDLE_DIR__ : undefined;
  const parsed = bundleDirSchema.safeParse(override ?? injected);
  if (!parsed.success) {
    throw new AtlasBundleError(
      'config-invalid',
      override === undefined
        ? 'No bundle directory configured: set ATLAS_BUNDLE_DIR or build through astro.config.mjs.'
        : 'ATLAS_BUNDLE_DIR is set but empty.',
    );
  }
  return path.resolve(parsed.data);
}

// ─── file reading ─────────────────────────────────────────────────────────────

async function readText(dir: string, relative: string): Promise<string> {
  const file = path.join(dir, relative);
  try {
    return await readFile(file, 'utf8');
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new AtlasBundleError('bundle-missing', `Research Atlas bundle file not found: ${file}. ${RUN_COMPILE}`, {
        cause: error,
      });
    }
    throw new AtlasBundleError('bundle-unreadable', `Cannot read ${file}.`, { cause: error });
  }
}

async function readJson(dir: string, relative: string): Promise<unknown> {
  const text = await readText(dir, relative);
  try {
    return JSON.parse(text) as unknown;
  } catch (error: unknown) {
    throw new AtlasBundleError('bundle-invalid', `${path.join(dir, relative)} is not valid JSON. ${RUN_COMPILE}`, {
      cause: error,
    });
  }
}

function parseWith<S extends z.ZodType>(schema: S, value: unknown, file: string): z.output<S> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new AtlasBundleError('bundle-invalid', `${file} does not match the atlas schema:\n${describeIssues(result.error)}`, {
      cause: result.error,
    });
  }
  return result.data;
}

const schemaVersionProbe = z.object({ schemaVersion: z.unknown() });

async function readBundle(dir: string): Promise<LoadedBundle> {
  const rawManifest = await readJson(dir, BUNDLE_FILES.manifest);
  const probe = schemaVersionProbe.safeParse(rawManifest);
  const version = probe.success ? probe.data.schemaVersion : undefined;
  if (version !== BUNDLE_SCHEMA_VERSION) {
    throw new AtlasBundleError(
      'schema-version',
      `Bundle schema version ${JSON.stringify(version)} at ${dir}; this web build expects ${String(BUNDLE_SCHEMA_VERSION)}. ${RUN_COMPILE}`,
    );
  }
  const manifest = parseWith(BundleManifestSchema, rawManifest, BUNDLE_FILES.manifest);
  const [rawGraph, rawRegistry] = await Promise.all([readJson(dir, BUNDLE_FILES.graph), readJson(dir, BUNDLE_FILES.registry)]);
  const graph: AtlasGraph = parseWith(atlasGraphSchema, rawGraph, BUNDLE_FILES.graph);
  const registry: Registry = parseWith(registrySchema, rawRegistry, BUNDLE_FILES.registry);
  return { dir, manifest, graph, registry };
}

// ─── caches ───────────────────────────────────────────────────────────────────

interface Caches {
  /** Directory the cached entries were read from; a different directory invalidates them. */
  dir: string | null;
  bundle: Promise<LoadedBundle> | null;
  stamp: number | null;
  readonly documents: Map<NodeId, Promise<ResearchDocument>>;
}

const caches: Caches = { dir: null, bundle: null, stamp: null, documents: new Map() };

function resetCaches(dir: string): void {
  caches.dir = dir;
  caches.bundle = null;
  caches.stamp = null;
  caches.documents.clear();
}

/** Dev only: drop caches when bundle.json was rewritten by `npm run compile`. */
async function revalidateInDev(dir: string): Promise<void> {
  if (!import.meta.env.DEV) return;
  let stamp: number | null = null;
  try {
    stamp = (await stat(path.join(dir, BUNDLE_FILES.manifest))).mtimeMs;
  } catch (error: unknown) {
    // A missing manifest is reported by readBundle with the actionable message.
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  if (stamp !== caches.stamp) {
    resetCaches(dir);
    caches.stamp = stamp;
  }
}

export async function loadBundle(): Promise<LoadedBundle> {
  const dir = resolveBundleDir();
  if (caches.dir !== dir) resetCaches(dir);
  await revalidateInDev(dir);
  let pending = caches.bundle;
  if (pending === null) {
    const reading = readBundle(dir);
    pending = reading;
    caches.bundle = reading;
    // A failed load is not cached: the next call retries (e.g. after `npm run compile`).
    // The caller still receives the rejection through the returned promise.
    reading.catch(() => {
      if (caches.bundle === reading) caches.bundle = null;
    });
  }
  return pending;
}

export async function getManifest(): Promise<BundleManifest> {
  return (await loadBundle()).manifest;
}

export async function getGraph(): Promise<AtlasGraph> {
  return (await loadBundle()).graph;
}

export async function getRegistry(): Promise<Registry> {
  return (await loadBundle()).registry;
}

// ─── documents ────────────────────────────────────────────────────────────────

async function readDocument(dir: string, id: NodeId): Promise<ResearchDocument> {
  const relative = docFilePath(id);
  const envelope = parseWith(documentEnvelopeSchema, await readJson(dir, relative), relative);
  if (envelope.meta.id !== id) {
    throw new AtlasBundleError('bundle-invalid', `${relative} holds ${envelope.meta.id}, expected ${id}. ${RUN_COMPILE}`);
  }
  if (envelope.schemaVersion !== DOCUMENT_SCHEMA_VERSION) {
    throw new AtlasBundleError('schema-version', `${relative} has document schema ${String(envelope.schemaVersion)}.`);
  }
  // Envelope validated above; block bodies are version-gated compiler output (see bundle-schemas.ts).
  return envelope as unknown as ResearchDocument;
}

/** True when the node has a compiled document in this bundle. */
export async function hasDocument(id: NodeId): Promise<boolean> {
  return (await getManifest()).documents.includes(id);
}

export async function getDocument(id: NodeId): Promise<ResearchDocument> {
  const bundle = await loadBundle();
  if (!bundle.manifest.documents.includes(id)) {
    throw new AtlasBundleError('document-missing', `No compiled document for ${id} in ${bundle.dir}. ${RUN_COMPILE}`);
  }
  let pending = caches.documents.get(id);
  if (pending === undefined) {
    const reading = readDocument(bundle.dir, id);
    pending = reading;
    caches.documents.set(id, reading);
    reading.catch(() => {
      if (caches.documents.get(id) === reading) caches.documents.delete(id);
    });
  }
  return pending;
}

/** Every compiled document, in the manifest's reading order. */
export async function listDocuments(): Promise<ResearchDocument[]> {
  const { manifest } = await loadBundle();
  const ids = manifest.documents.filter((id): id is NodeId => isNodeId(id));
  return mapBounded(ids, DOCUMENT_READ_CONCURRENCY, (id) => getDocument(id));
}

// ─── graph and registry lookups ───────────────────────────────────────────────

export async function getNode(id: NodeId): Promise<GraphNode | null> {
  return (await getGraph()).nodes[id] ?? null;
}

export async function getNeighbourhood(id: NodeId): Promise<Neighbourhood | null> {
  return neighbourhood(await getGraph(), id);
}

export async function getReference(key: CitationKey): Promise<ReferenceRecord | null> {
  return (await getRegistry()).references.find((record) => record.key === key) ?? null;
}

export async function getTerm(slug: string): Promise<GlossaryTerm | null> {
  return (await getRegistry()).terms.find((term) => term.slug === slug) ?? null;
}

/** The `PageData` island for one reading page. */
export async function buildPageData(doc: ResearchDocument): Promise<PageData> {
  const { graph, registry } = await loadBundle();
  return pageDataFor(doc, { graph, registry });
}

// ─── search payloads (served verbatim to the client) ──────────────────────────

const searchDocsSchema = z.array(
  z.object({
    id: z.string(),
    kind: z.enum(SEARCH_KINDS),
    title: z.string(),
    context: z.string(),
    url: z.string(),
    body: z.string(),
    keywords: z.string(),
  }),
);

/**
 * Raw text of a search payload after validating it: `search-docs.json` against
 * the SearchDoc shape, `search-index.json` as a JSON object (MiniSearch's
 * serialised index is opaque to us; the client loads it with core
 * SEARCH_INDEX_OPTIONS).
 */
export async function readSearchPayload(file: 'searchDocs' | 'searchIndex'): Promise<string> {
  const { dir } = await loadBundle();
  const relative = BUNDLE_FILES[file];
  const text = await readText(dir, relative);
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch (error: unknown) {
    throw new AtlasBundleError('bundle-invalid', `${relative} is not valid JSON. ${RUN_COMPILE}`, { cause: error });
  }
  if (file === 'searchDocs') parseWith(searchDocsSchema, value, relative);
  else parseWith(z.record(z.string(), z.unknown()), value, relative);
  return text;
}
