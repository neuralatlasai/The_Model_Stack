/**
 * schema.org structured data (UI_UX §74): articles, their place in the book,
 * the works they cite, the software they discuss, and modification dates.
 * Only facts present in the compiled bundle are emitted — no invented authors,
 * publishers, or dates.
 */
import {
  inlineToText,
  type AtlasGraph,
  type GraphNode,
  type ReferenceRecord,
  type Registry,
  type ResearchDocument,
} from '@atlas/core';
import { clip, squash } from './format.ts';
import { ancestorsOf } from './nodes.ts';

export const BOOK_TITLE = 'The Model Stack — From Data and Silicon to Intelligence';
export const SITE_TITLE = 'The Model Stack · Research Atlas';

type JsonLd = Record<string, unknown>;

/** Resolves a site-relative path against the configured site, or keeps it relative when no site is configured. */
export function absoluteUrl(path: string, site: URL | undefined): string {
  return site === undefined ? path : new URL(path, site).href;
}

function book(edition: string): JsonLd {
  return { '@type': 'Book', name: BOOK_TITLE, bookEdition: edition };
}

function schemaTypeForNode(node: Pick<GraphNode, 'entityType'>): string {
  switch (node.entityType) {
    case 'chapter':
    case 'appendix':
      return 'Chapter';
    case 'volume':
    case 'part':
      return 'CreativeWorkSeries';
    default:
      return 'CreativeWork';
  }
}

function partOfChain(graph: AtlasGraph, node: GraphNode, site: URL | undefined, edition: string): JsonLd {
  let outer: JsonLd = book(edition);
  for (const ancestor of ancestorsOf(graph, node.id)) {
    outer = {
      '@type': schemaTypeForNode(ancestor),
      name: ancestor.title,
      url: absoluteUrl(ancestor.url, site),
      isPartOf: outer,
    };
  }
  return outer;
}

export function referenceSchemaType(record: Pick<ReferenceRecord, 'type'>): string {
  switch (record.type) {
    case 'paper':
      return 'ScholarlyArticle';
    case 'technical report':
      return 'Report';
    case 'repository':
      return 'SoftwareSourceCode';
    case 'dataset card':
      return 'Dataset';
    case 'course':
      return 'Course';
    default:
      return 'CreativeWork';
  }
}

function citation(record: ReferenceRecord): JsonLd {
  const out: JsonLd = { '@type': referenceSchemaType(record), name: record.work, creditText: record.authors };
  if (record.url !== null) out['url'] = record.url;
  return out;
}

export interface DocumentJsonLdInput {
  readonly doc: ResearchDocument;
  readonly graph: AtlasGraph;
  readonly registry: Registry;
  readonly site: URL | undefined;
  readonly edition: string;
}

export function documentJsonLd({ doc, graph, registry, site, edition }: DocumentJsonLdInput): JsonLd {
  const node = graph.nodes[doc.meta.id];
  const description = doc.header.thesis === null ? null : squash(inlineToText(doc.header.thesis));
  const references = new Map(registry.references.map((record) => [record.key, record]));
  const cited = doc.citations
    .map((key) => references.get(key))
    .filter((record): record is ReferenceRecord => record !== undefined);
  const systems = registry.systems.filter((system) => doc.meta.implementations.includes(system.id));

  const out: JsonLd = {
    '@context': 'https://schema.org',
    '@type': doc.meta.entityType === 'section' || doc.meta.entityType === 'chapter' ? 'TechArticle' : 'CreativeWork',
    headline: clip(doc.header.title, 110),
    name: doc.header.title,
    url: absoluteUrl(doc.route.url, site),
    inLanguage: 'en',
    dateModified: doc.meta.updatedAt,
    creativeWorkStatus: doc.meta.editorialStatus.replaceAll('_', ' '),
    wordCount: doc.stats.words,
    isPartOf: node === undefined ? book(edition) : partOfChain(graph, node, site, edition),
  };
  if (description !== null && description !== '') out['description'] = clip(description, 300);
  if (cited.length > 0) out['citation'] = cited.map(citation);
  if (systems.length > 0) {
    out['mentions'] = systems.map((system) => {
      const entry: JsonLd = { '@type': 'SoftwareSourceCode', name: system.name };
      const surface = system.surfaces[0];
      if (surface !== undefined) entry['url'] = surface.url;
      return entry;
    });
  }
  return out;
}

export function paperJsonLd(record: ReferenceRecord, site: URL | undefined): JsonLd {
  const out: JsonLd = {
    '@context': 'https://schema.org',
    ...citation(record),
    identifier: record.key,
    mainEntityOfPage: absoluteUrl(record.atlasUrl, site),
  };
  if (record.code !== null) out['sameAs'] = record.code;
  return out;
}

export function siteJsonLd(graph: AtlasGraph, site: URL | undefined, edition: string): JsonLd {
  const volumes = graph.tree
    .map((root) => graph.nodes[root.id])
    .filter((node): node is GraphNode => node?.entityType === 'volume');
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_TITLE,
    url: absoluteUrl('/', site),
    inLanguage: 'en',
    about: {
      ...book(edition),
      hasPart: volumes.map((volume) => ({ '@type': 'CreativeWorkSeries', name: volume.title, url: absoluteUrl(volume.url, site) })),
    },
  };
}
