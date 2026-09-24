/**
 * Search documents (UI_UX §32): every navigable object with its type, a
 * hierarchy context line (`Foundations / Minimal Transformer`), and a bounded
 * body. Planned chapters and sections are included so the reader can find
 * where a topic will live; their pages show plan data.
 */
import {
  DOMAIN_LABELS,
  domainOfPart,
  inlineToText,
  type Block,
  type GlossaryTerm,
  type NodeId,
  type ReferenceRecord,
  type Registry,
  type ResearchDocument,
  type SearchDoc,
  type SearchKind,
} from '@atlas/core';
import type { ParsedLab, ParsedSystem } from '../registry/reference-stack.ts';
import { APPENDICES_ID, FRONT_MATTER_GROUP_ID, ROOT_ID } from '../project/nodes.ts';
import { squash, truncate, unique } from '../project/text.ts';
import type { NodeRecord, NodeTable } from '../project/types.ts';
import { firstParagraphText, walkBlocks, walkDocument } from '../project/walk.ts';

export const SEARCH_BODY_MAX = 1200;
const TITLE_MAX = 200;

export interface SearchInputs {
  readonly table: NodeTable;
  readonly documents: ReadonlyMap<NodeId, ResearchDocument>;
  readonly registry: Registry;
  readonly systems: readonly ParsedSystem[];
  readonly labs: readonly ParsedLab[];
}

function joinBody(parts: readonly (string | null | undefined)[]): string {
  return truncate(parts.filter((part): part is string => typeof part === 'string' && part.trim() !== '').map(squash).join(' · '), SEARCH_BODY_MAX);
}

function keywords(parts: readonly (string | number | null | undefined)[]): string {
  return unique(parts.filter((part): part is string | number => part !== null && part !== undefined && part !== '').map(String)).join(' ');
}

export function buildSearchDocs(input: SearchInputs): SearchDoc[] {
  const { table, documents, registry } = input;
  const out: SearchDoc[] = [];
  const ids = new Set<string>();
  const push = (doc: SearchDoc): void => {
    if (ids.has(doc.id)) return;
    ids.add(doc.id);
    out.push({ ...doc, title: truncate(doc.title, TITLE_MAX) });
  };

  const nodeOf = (id: NodeId | null): NodeRecord | undefined => (id === null ? undefined : table.nodes.get(id));
  const domainLabel = (node: NodeRecord): string => DOMAIN_LABELS[domainOfPart(node.part)];
  const chapterOf = (node: NodeRecord): NodeRecord | undefined => {
    if (node.entityType === 'chapter') return node;
    const parent = nodeOf(node.parent);
    return parent?.entityType === 'chapter' ? parent : undefined;
  };
  /** Context for objects inside a node: `Domain / Chapter short title` (or the node's own title). */
  const objectContext = (node: NodeRecord): string => {
    const chapter = chapterOf(node);
    if (chapter !== undefined) return `${domainLabel(node)} / ${chapter.shortTitle}`;
    return node.shortTitle;
  };
  const thesisText = (doc: ResearchDocument | undefined): string | null => {
    const thesis = doc?.header.thesis ?? null;
    return thesis === null ? null : inlineToText(thesis);
  };

  // ── editorial nodes ────────────────────────────────────────────────────────
  for (const id of table.order) {
    const node = table.nodes.get(id);
    if (node === undefined || id === ROOT_ID || id === FRONT_MATTER_GROUP_ID) continue;
    const doc = documents.get(id);
    const kind = nodeKind(node);
    if (kind === null) continue;
    const parent = nodeOf(node.parent);
    let context = '';
    let body = '';
    let keys = '';
    switch (kind) {
      case 'volume':
        context = 'The Model Stack';
        body = joinBody([thesisText(doc), doc === undefined ? null : firstParagraphText(doc.lead), ...regionTitles(doc)]);
        keys = keywords([node.number, `volume ${node.number ?? ''}`]);
        break;
      case 'part':
        context = `${domainLabel(node)} / ${parent?.shortTitle ?? ''}`;
        body = joinBody([node.plan?.outcome, thesisText(doc), doc === undefined ? null : firstParagraphText(doc.lead), ...regionTitles(doc)]);
        keys = keywords([node.number, `part ${node.number ?? ''}`, node.part]);
        break;
      case 'chapter': {
        context = `${domainLabel(node)} / ${parent?.shortTitle ?? ''}`;
        const why = doc?.regions.find((region) => region.role === 'why-chapter');
        const prerequisites = node.plan?.prerequisitesText ?? null;
        body =
          doc === undefined
            ? joinBody([node.plan?.artifact, prerequisites === null ? null : `prerequisites: ${prerequisites}`])
            : joinBody([thesisText(doc), why === undefined ? null : firstParagraphText(why.blocks), node.plan?.artifact, ...regionTitles(doc)]);
        keys = keywords([node.number, node.chapter, `ch${node.number ?? ''}`, ...(doc?.meta.axes.mechanism.map(humanise) ?? [])]);
        break;
      }
      case 'section':
        context = `${domainLabel(node)} / ${parent?.shortTitle ?? ''}`;
        body = doc === undefined ? '' : sectionBody(doc);
        keys = keywords([node.number, `§${node.number ?? ''}`, ...(doc?.meta.axes.mechanism.map(humanise) ?? [])]);
        break;
      case 'appendix':
        context = id === APPENDICES_ID ? 'Reference appendices' : `Appendix ${node.number ?? ''}`;
        body = joinBody([thesisText(doc), doc === undefined ? null : firstParagraphText(doc.lead), ...regionTitles(doc)]);
        keys = keywords([node.number, node.number === null ? null : `appendix ${node.number}`]);
        break;
      case 'front-matter':
        context = 'Front matter';
        body = joinBody([thesisText(doc), doc === undefined ? null : firstParagraphText(doc.lead), ...regionTitles(doc)]);
        keys = keywords([node.slug]);
        break;
      default:
        break;
    }
    push({ id: `node:${id}`, kind, title: node.title, context: squash(context.replace(/\s*\/\s*$/u, '')), url: node.url, body, keywords: keys });
  }

  // ── objects inside documents ───────────────────────────────────────────────
  const equationByNumber = new Map(registry.equations.map((entry) => [entry.number, entry]));
  for (const id of table.order) {
    const doc = documents.get(id);
    const node = table.nodes.get(id);
    if (doc === undefined || node === undefined) continue;
    const context = objectContext(node);
    for (const figure of doc.figures) {
      push({
        // Authored ids (fig-5.3) are book-unique; derived ids are only unique within a document.
        id: figure.id.startsWith('fig-auto-') ? `fig:${id}#${figure.anchor}` : `fig:${figure.id}`,
        kind: 'figure',
        title: figure.number === null ? figure.spec.title : `Figure ${figure.number} · ${figure.spec.title}`,
        context,
        url: `${node.url}#${figure.anchor}`,
        body: joinBody([figure.spec.caption, figure.spec.alt]),
        keywords: keywords([figure.id, figure.number, figure.spec.kind]),
      });
    }
    for (const { block, region } of walkDocument(doc)) {
      const anchor = block.anchor ?? region?.anchor ?? null;
      const at = anchor === null ? node.url : `${node.url}#${anchor}`;
      switch (block.kind) {
        case 'equation': {
          if (block.number === null) break;
          const entry = equationByNumber.get(block.number);
          if (entry?.nodeId !== id) break;
          push({
            id: `eq:${block.number}`,
            kind: 'equation',
            title: `Eq. ${block.number} · ${node.shortTitle}`,
            context,
            url: entry.url,
            body: joinBody([...block.variables.map((variable) => `${variable.symbol}: ${variable.meaning}`), block.note === null ? null : inlineToText(block.note)]),
            keywords: keywords([block.number, ...block.variables.map((variable) => variable.symbol)]),
          });
          break;
        }
        case 'algorithm':
          push({
            id: `alg:${id}#${anchor ?? block.name}`,
            kind: 'algorithm',
            title: block.number === null ? block.name : `Algorithm ${block.number} — ${block.name}`,
            context,
            url: at,
            body: joinBody([...block.input, ...block.output, ...block.invariant, ...block.lines.map((line) => line.comment)]),
            keywords: keywords([block.number]),
          });
          break;
        case 'experiment':
          push({
            id: `exp:${id}#${anchor ?? block.number}`,
            kind: 'experiment',
            title: `Experiment ${block.number} — ${block.name}`,
            context,
            url: at,
            body: joinBody(block.fields.slice(0, 3).map((field) => `${field.name}: ${blocksText(field.blocks)}`)),
            keywords: keywords([block.number]),
          });
          break;
        case 'failure-mode':
          push({
            id: `fm:${id}#${anchor ?? block.name}`,
            kind: 'failure-mode',
            title: block.name,
            context,
            url: at,
            body: joinBody([
              block.symptom === null ? null : `Symptom: ${inlineToText(block.symptom)}`,
              block.cause === null ? null : `Cause: ${inlineToText(block.cause)}`,
              block.detection === null ? null : `Detection: ${inlineToText(block.detection)}`,
            ]),
            keywords: '',
          });
          break;
        case 'open-question': {
          const question = inlineToText(block.content);
          push({
            id: `oq:${id}#${anchor ?? truncate(question, 40)}`,
            kind: 'open-question',
            title: truncate(question, 140),
            context,
            url: at,
            body: joinBody([question, block.settle === null ? null : `What would settle it: ${inlineToText(block.settle)}`]),
            keywords: '',
          });
          break;
        }
        default:
          break;
      }
    }
  }

  // ── registries ─────────────────────────────────────────────────────────────
  for (const term of registry.terms) push(termDoc(term, table, objectContext));
  for (const reference of registry.references) push(paperDoc(reference));
  for (const system of input.systems) {
    const entity = registry.systems.find((candidate) => candidate.id === system.id);
    push({
      id: `system:${system.id}`,
      kind: 'system',
      title: system.name,
      context: system.layer ?? system.role,
      url: entity?.atlasUrl ?? `/systems/${system.id.slice('impl.'.length)}/`,
      body: joinBody([system.why, system.role]),
      keywords: keywords([system.id, `#${String(system.rank)}`]),
    });
  }
  for (const lab of input.labs) {
    const entity = registry.labs.find((candidate) => candidate.id === lab.id);
    push({
      id: `lab:${lab.id}`,
      kind: 'lab',
      title: lab.name,
      context: 'Reference stack §1',
      url: entity?.atlasUrl ?? `/labs/${lab.id.slice('lab.'.length)}/`,
      body: joinBody([lab.why]),
      keywords: keywords([lab.id]),
    });
  }
  return out;
}

function nodeKind(node: NodeRecord): SearchKind | null {
  if (node.id === APPENDICES_ID) return 'appendix';
  switch (node.entityType) {
    case 'volume':
      return 'volume';
    case 'part':
      return 'part';
    case 'chapter':
      return 'chapter';
    case 'section':
      return 'section';
    case 'appendix':
      return 'appendix';
    case 'frontmatter':
      return 'front-matter';
    case 'verification':
    case 'references':
      return null;
  }
}

function humanise(tag: string): string {
  return tag.replaceAll('_', ' ');
}

function regionTitles(doc: ResearchDocument | undefined): string[] {
  return doc === undefined ? [] : doc.regions.map((region) => region.title);
}

function blocksText(blocks: readonly Block[]): string {
  const parts: string[] = [];
  for (const { block } of walkBlocks(blocks, null)) {
    if (block.kind === 'paragraph') parts.push(inlineToText(block.content));
  }
  return parts.join(' ');
}

/** Thesis, region titles, definitions, then the first paragraph of each region. */
function sectionBody(doc: ResearchDocument): string {
  const definitions: string[] = [];
  for (const { block } of walkDocument(doc)) {
    if (block.kind === 'definition') definitions.push(`${block.term}: ${inlineToText(block.content)}`);
  }
  const firsts = doc.regions.map((region) => firstParagraphText(region.blocks));
  return joinBody([doc.header.thesis === null ? null : inlineToText(doc.header.thesis), doc.regions.map((region) => region.title).join(', '), ...definitions, ...firsts]);
}

function termDoc(term: GlossaryTerm, table: NodeTable, context: (node: NodeRecord) => string): SearchDoc {
  const owner = table.nodes.get(term.owner);
  return {
    id: `term:${term.slug}`,
    kind: 'term',
    title: term.term,
    context: owner === undefined ? term.ownerTitle : context(owner),
    url: term.url,
    body: joinBody([inlineToText(term.definition)]),
    keywords: keywords([term.slug.replaceAll('-', ' ')]),
  };
}

function paperDoc(reference: ReferenceRecord): SearchDoc {
  return {
    id: `paper:${reference.key}`,
    kind: 'paper',
    title: reference.work,
    context: truncate([reference.authors, reference.venue].filter((part) => part !== '').join(' · '), 160),
    url: reference.atlasUrl,
    body: joinBody(reference.uses.map((use) => use.usedFor)),
    keywords: keywords([reference.key, reference.spine ? 'spine' : null, reference.type]),
  };
}
