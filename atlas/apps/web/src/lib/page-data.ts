/**
 * Per-page data island (core `PageDataSchema`): only what the client needs for
 * the current page — the references, glossary terms, and equations this page
 * uses, plus its neighbourhood — never the whole registry (UI_UX §72).
 *
 * Pure: the caller supplies graph and registry. Every string is clipped to the
 * schema's limits and the result is parsed with `PageDataSchema` before it is
 * returned, so the client's own parse of the island cannot fail on valid
 * compiler output.
 */
import {
  inlineToText,
  neighbourhood,
  PageDataSchema,
  type AtlasGraph,
  type CitationKey,
  type EquationBlock,
  type GraphNode,
  type NodeId,
  type PageData,
  type Registry,
  type ResearchDocument,
} from '@atlas/core';
import { clip, squash } from './format.ts';
import { blocksOfKind, documentFacts } from './walk.ts';

export interface PageDataSources {
  readonly graph: AtlasGraph;
  readonly registry: Registry;
}

type RouteRefOut = PageData['neighbours']['siblings'][number];

/** Limits of PageDataSchema (packages/core/src/dom.ts), mirrored for clipping. */
const LIMIT = {
  nodeId: 60,
  url: 400,
  title: 300,
  regions: 60,
  regionAnchor: 120,
  regionRole: 40,
  regionTitle: 200,
  refKey: 12,
  refType: 40,
  refWork: 400,
  refAuthors: 600,
  refVenue: 200,
  refUrl: 600,
  refStatus: 40,
  refUsedFor: 1200,
  refAtlasUrl: 200,
  termSlug: 120,
  term: 200,
  termDefinition: 1200,
  termOwnerTitle: 200,
  eqNumber: 12,
  eqAnchor: 60,
  eqHtml: 60000,
  eqVariables: 40,
  eqSymbol: 60,
  eqMeaning: 300,
  routeId: 60,
  routeTitle: 200,
  routeNumber: 12,
  prerequisites: 40,
  dependents: 60,
  siblings: 40,
  nodes: 120,
  nodeEntity: 24,
  nodeSummary: 600,
  nodeWithin: 200,
} as const;

function unique<T>(values: Iterable<T>): T[] {
  return [...new Set(values)];
}

function routeRef(node: GraphNode): RouteRefOut | null {
  if (node.id.length > LIMIT.routeId || node.url.length > LIMIT.url) return null;
  const number = node.number !== null && node.number.length <= LIMIT.routeNumber ? node.number : null;
  return { id: node.id, title: clip(node.title, LIMIT.routeTitle), number, url: node.url };
}

function routeRefs(nodes: readonly GraphNode[], max: number): RouteRefOut[] {
  const out: RouteRefOut[] = [];
  for (const node of nodes) {
    if (out.length >= max) break;
    const ref = routeRef(node);
    if (ref !== null) out.push(ref);
  }
  return out;
}

type NodeCardOut = PageData['nodes'][string];

/** Preview card for a linked node: identity, status, enclosing chapter/part, graph degree, section progress. */
export function nodeCard(graph: AtlasGraph, id: NodeId): NodeCardOut | null {
  const node = graph.nodes[id];
  if (node === undefined || node.id.length > LIMIT.nodeId || node.url.length > LIMIT.url) return null;
  const parent = node.parent === null ? undefined : graph.nodes[node.parent];
  const within =
    parent === undefined || parent.entityType === 'volume'
      ? null
      : clip(
          parent.number === null || parent.entityType === 'part' ? parent.title : `${parent.number} ${parent.shortTitle}`,
          LIMIT.nodeWithin,
        );
  const hood = node.entityType === 'chapter' ? neighbourhood(graph, id) : null;
  const chapter = node.entityType === 'chapter' ? node : node.entityType === 'section' ? parent : undefined;
  const sections = (chapter?.children ?? []).map((child) => graph.nodes[child]).filter((child) => child?.entityType === 'section');
  const position = node.entityType === 'section' ? sections.findIndex((section) => section?.id === id) : -1;
  const summary = node.summary === null ? null : squash(node.summary).replace(/^(?:Thesis|Summary|Scope)\s*[.:—-]\s*/u, '');
  return {
    id: node.id,
    entity: clip(node.entityType, LIMIT.nodeEntity),
    number: node.number !== null && node.number.length <= LIMIT.routeNumber ? node.number : null,
    title: clip(node.title, LIMIT.title),
    url: node.url,
    written: node.hasManuscript,
    // Section summaries are scope objectives written as predicates ("give overflow-safe forms …").
    summary: summary === null || summary === '' ? null : clip(summary.charAt(0).toUpperCase() + summary.slice(1), LIMIT.nodeSummary),
    within,
    prerequisites: Math.min(999, hood?.prerequisites.length ?? 0),
    dependents: Math.min(999, hood?.dependents.length ?? 0),
    sections: sections
      .slice(0, 99)
      .map((section) => (section?.hasManuscript === true ? 'w' : 'p'))
      .join(''),
    sectionPosition: position === -1 || position >= 99 ? null : position + 1,
  };
}

function railKeys(doc: ResearchDocument): { citations: CitationKey[]; terms: string[] } {
  const citations: CitationKey[] = [];
  const terms: string[] = [];
  for (const binding of doc.rail) {
    for (const instrument of binding.instruments) {
      if (instrument.kind === 'citations') citations.push(...instrument.keys);
      if (instrument.kind === 'terms') terms.push(...instrument.slugs);
    }
  }
  return { citations, terms };
}

function equationEntry(
  number: string,
  anchor: string,
  url: string,
  html: string,
  variables: readonly { readonly symbol: string; readonly meaning: string }[],
): PageData['equations'][string] | null {
  if (number.length > LIMIT.eqNumber || anchor.length > LIMIT.eqAnchor || html.length > LIMIT.eqHtml) return null;
  if (url.length > LIMIT.url) return null;
  return {
    number,
    anchor,
    url,
    html,
    variables: variables.slice(0, LIMIT.eqVariables).map((variable) => ({
      symbol: clip(variable.symbol, LIMIT.eqSymbol),
      meaning: clip(variable.meaning, LIMIT.eqMeaning),
    })),
  };
}

export function pageDataFor(doc: ResearchDocument, sources: PageDataSources): PageData {
  const { graph, registry } = sources;
  const url = doc.route.url;
  const rail = railKeys(doc);

  // References: cited in the body or stacked in the rail, resolved against the registry.
  const referenceByKey = new Map(registry.references.map((record) => [record.key, record]));
  const references: PageData['references'] = {};
  for (const key of unique([...doc.citations, ...rail.citations])) {
    const record = referenceByKey.get(key);
    if (record === undefined || key.length > LIMIT.refKey) continue;
    const use = record.uses.find((entry) => entry.chapter === doc.meta.chapter) ?? record.uses[0];
    references[key] = {
      key,
      type: clip(record.type, LIMIT.refType),
      work: clip(record.work, LIMIT.refWork),
      authors: clip(record.authors, LIMIT.refAuthors),
      venue: clip(record.venue, LIMIT.refVenue),
      url: record.url !== null && record.url.length <= LIMIT.refUrl ? record.url : null,
      code: record.code !== null && record.code.length <= LIMIT.refUrl ? record.code : null,
      status: clip(record.status, LIMIT.refStatus),
      usedFor: clip(squash(use?.usedFor ?? ''), LIMIT.refUsedFor),
      atlasUrl: clip(record.atlasUrl, LIMIT.refAtlasUrl),
    };
  }

  // Terms: defined on this page or listed by a rail glossary instrument.
  const termBySlug = new Map(registry.terms.map((term) => [term.slug, term]));
  const terms: PageData['terms'] = {};
  for (const slug of unique([...doc.definedTerms, ...rail.terms])) {
    const term = termBySlug.get(slug);
    if (term === undefined || slug.length > LIMIT.termSlug || term.url.length > LIMIT.url) continue;
    terms[slug] = {
      term: clip(term.term, LIMIT.term),
      definition: clip(squash(inlineToText(term.definition)), LIMIT.termDefinition),
      url: term.url,
      ownerTitle: clip(term.ownerTitle, LIMIT.termOwnerTitle),
    };
  }

  // Equations: defined here (authoritative block data) plus those cross-referenced from prose.
  const equations: PageData['equations'] = {};
  for (const block of blocksOfKind(doc, 'equation')) {
    const entry = ownEquation(block, url);
    if (entry !== null) equations[entry.number] = entry;
  }
  const equationByNumber = new Map(registry.equations.map((entry) => [entry.number, entry]));
  for (const number of documentFacts(doc).equationsReferenced) {
    if (Object.hasOwn(equations, number)) continue;
    const indexed = equationByNumber.get(number);
    if (indexed === undefined) continue;
    const entry = equationEntry(indexed.number, indexed.anchor, indexed.url, indexed.html, indexed.variables);
    if (entry !== null) equations[entry.number] = entry;
  }

  // Nodes: every chapter / section / page the prose links to, for link previews.
  const nodes: PageData['nodes'] = {};
  for (const id of documentFacts(doc).linkedNodes) {
    if (id === doc.meta.id || Object.keys(nodes).length >= LIMIT.nodes) continue;
    const card = nodeCard(graph, id);
    if (card !== null) nodes[id] = card;
  }

  const hood = neighbourhood(graph, doc.meta.id);
  const data: PageData = {
    nodeId: doc.meta.id,
    url: clip(url, LIMIT.url),
    title: clip(doc.header.title, LIMIT.title),
    regions: doc.regions.slice(0, LIMIT.regions).map((region) => ({
      anchor: clip(region.anchor, LIMIT.regionAnchor),
      role: clip(region.role, LIMIT.regionRole),
      title: clip(region.title, LIMIT.regionTitle),
    })),
    references,
    terms,
    equations,
    neighbours: {
      prerequisites: routeRefs(hood?.prerequisites ?? [], LIMIT.prerequisites),
      dependents: routeRefs(hood?.dependents ?? [], LIMIT.dependents),
      siblings: routeRefs(hood?.siblings ?? [], LIMIT.siblings),
    },
    nodes,
  };

  const checked = PageDataSchema.safeParse(data);
  if (!checked.success) {
    const first = checked.error.issues[0];
    throw new Error(
      `PageData for ${doc.meta.id} violates PageDataSchema at ${first?.path.map(String).join('.') ?? '?'}: ${first?.message ?? 'unknown'}`,
      { cause: checked.error },
    );
  }
  return checked.data;
}

function ownEquation(block: EquationBlock, url: string): PageData['equations'][string] | null {
  if (block.number === null || block.anchor === null) return null;
  return equationEntry(block.number, block.anchor, `${url}#${block.anchor}`, block.html, block.variables);
}
