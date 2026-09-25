/**
 * Data behind the home page's product sections — every value comes from the
 * compiled bundle, nothing is hand-written:
 *
 *   layers     the eleven parts as the stack, bottom (foundations) to top
 *              (evaluation), with each chapter written or planned
 *   claims     real labelled claims from written sections, one or two per
 *              evidence label, for the "evidence first" card
 *   labels     how often each evidence label occurs across the manuscripts
 *   focus      written chapters with their declared prerequisites and the
 *              chapters that build on them
 *   searches   real results of a few queries against the site's own index
 *   anatomy    the section regions and the depth at which each appears
 */
import {
  DEPTHS,
  DEPTH_DESCRIPTIONS,
  DEPTH_LABELS,
  EVIDENCE_CLASS,
  EVIDENCE_LABELS,
  REGION_ROLE_DEPTH,
  REGION_ROLE_LABELS,
  SEARCH_INDEX_OPTIONS,
  inlineToText,
  type Depth,
  type EvidenceClass,
  type EvidenceLabel,
  type Inline,
  type ResearchDocument,
  type SearchDoc,
} from '@atlas/core';
import MiniSearch from 'minisearch';
import type { StackModel } from './stack.ts';
import { walkDocument } from './walk.ts';

export interface HomeLayer {
  readonly numeral: string;
  readonly title: string;
  readonly url: string;
  readonly domain: string;
  readonly written: number;
  readonly chapters: readonly { readonly number: string; readonly title: string; readonly url: string; readonly written: boolean }[];
}

export interface HomeClaim {
  readonly label: EvidenceLabel;
  readonly cls: EvidenceClass;
  readonly text: string;
  readonly where: string;
  readonly url: string;
  /** Citation keys the claim rests on (`R6.4`, `P19`), when it cites registry works. */
  readonly cites: readonly string[];
}

export interface HomeFocus {
  readonly number: string;
  readonly title: string;
  readonly url: string;
  readonly prereqs: readonly HomeRef[];
  readonly unlocks: readonly HomeRef[];
}
export interface HomeRef {
  readonly number: string;
  readonly title: string;
  readonly url: string;
  readonly written: boolean;
}

export interface HomeSearch {
  readonly query: string;
  readonly results: readonly { readonly kind: string; readonly title: string; readonly context: string; readonly url: string }[];
}

export interface HomeModel {
  readonly layers: readonly HomeLayer[];
  readonly claims: readonly HomeClaim[];
  readonly labels: readonly { readonly label: EvidenceLabel; readonly cls: EvidenceClass; readonly count: number }[];
  readonly focus: readonly HomeFocus[];
  readonly searches: readonly HomeSearch[];
  readonly anatomy: readonly { readonly label: string; readonly depth: Depth }[];
  readonly depths: readonly { readonly key: Depth; readonly label: string; readonly description: string }[];
}

const squash = (text: string): string => text.replace(/\s+/gu, ' ').trim();

type Token = { readonly t: 'text'; readonly v: string } | { readonly t: 'math' } | { readonly t: 'cite'; readonly key: string } | { readonly t: 'label'; readonly label: EvidenceLabel };

function tokens(nodes: readonly Inline[], out: Token[] = []): Token[] {
  for (const node of nodes) {
    switch (node.kind) {
      case 'text':
      case 'code':
        out.push({ t: 'text', v: node.value });
        break;
      case 'xref':
        out.push({ t: 'text', v: node.text });
        break;
      case 'math':
        out.push({ t: 'math' });
        break;
      case 'cite':
        out.push({ t: 'cite', key: node.key });
        break;
      case 'label':
        out.push({ t: 'label', label: node.label });
        break;
      case 'emphasis':
      case 'strong':
      case 'delete':
      case 'link':
        tokens(node.children, out);
        break;
      case 'break':
        out.push({ t: 'text', v: ' ' });
        break;
    }
  }
  return out;
}

const MATH = '\u0000';
/** The sentences a paragraph labels inline — "… is X (PAPER-REPORTED · R6.4)." — with the keys they cite. */
export function labelledSentences(content: readonly Inline[]): { label: EvidenceLabel; text: string; cites: string[] }[] {
  const out: { label: EvidenceLabel; text: string; cites: string[] }[] = [];
  const list = tokens(content);
  let buf = '';
  for (let i = 0; i < list.length; i += 1) {
    const token = list[i];
    if (token === undefined) continue;
    if (token.t === 'text') buf += token.v;
    else if (token.t === 'math') buf += MATH;
    else if (token.t === 'label') {
      const before = buf.replace(/[\s([;,:—-]+$/u, '');
      const sentence = before.split(/(?<=[.!?])\s+(?=[A-Z§])/u).at(-1) ?? '';
      const cites: string[] = [];
      let j = i + 1;
      for (; j < list.length && j < i + 8; j += 1) {
        const next = list[j];
        if (next === undefined) break;
        if (next.t === 'cite') cites.push(next.key);
        else if (next.t === 'text' && next.v.includes(')')) break;
        else if (next.t === 'label') break;
      }
      out.push({ label: token.label, text: sentence.trim(), cites });
      buf = '';
      i = j;
    }
  }
  return out;
}

/** Inline citation brackets are shown as chips, not in the sentence. */
const clean = (text: string): string => squash(text.replace(/\s*\[(?:[PR]\d+(?:\.\d+)?(?:[,;]\s*)?)+\]/gu, '').replace(/\s*\(\s*\)/gu, ''));

/** Sentences worth showing on a front page: complete, readable length, prose rather than notation. */
function presentable(text: string): boolean {
  const opens = text.split('(').length;
  return (
    text.length >= 80 &&
    text.length <= 240 &&
    /^[A-Z]/u.test(text) &&
    !text.includes(MATH) &&
    !/\$|\\[a-z]|[{}|=√Σ∑≈²³·≤≥→×]/u.test(text) &&
    // rubric prefixes ("Cost line:", "What failed:") and pointers are not claims
    !/^[A-Z][a-z]+(?: [a-z]+){0,2}: /u.test(text) &&
    !/^(?:See|Source|Table|Figure|Eq)\b/u.test(text) &&
    // cut mid-sentence where the label sat inside it
    !/\b(?:with|and|of|to|the|a|an|for|in|on|by|from|at|as|or|that|than|is|are|be)\.$/iu.test(text) &&
    opens === text.split(')').length
  );
}

const READABLE_ROLES = new Set(['why', 'intuition', 'mechanism', 'scope', 'observations', 'limitations', 'extensions', 'failure-modes', 'implementation']);

export function selectClaims(docs: readonly ResearchDocument[], perLabel = 2, max = 8): HomeClaim[] {
  const byLabel = new Map<EvidenceLabel, HomeClaim[]>();
  const taken = new Set<string>();
  const sorted = [...docs].filter((doc) => doc.meta.entityType === 'section').sort((a, b) => (a.meta.section ?? '').localeCompare(b.meta.section ?? '', 'en', { numeric: true }));
  const offer = (doc: ResearchDocument, anchor: string, label: EvidenceLabel, raw: string, cites: readonly string[]): void => {
    const text = clean(raw).replace(/([^.!?)])$/u, '$1.');
    const list = byLabel.get(label) ?? [];
    const key = `${label}:${String(doc.meta.chapter)}`;
    if (EVIDENCE_CLASS[label] === 'measurement' || list.length >= perLabel || taken.has(key) || !presentable(text)) return;
    list.push({ label, cls: EVIDENCE_CLASS[label], text, where: `§${doc.meta.section ?? ''} ${doc.meta.shortTitle}`, url: `${doc.route.url}#${anchor}`, cites: [...new Set(cites)].slice(0, 3) });
    byLabel.set(label, list);
    taken.add(key);
  };
  for (const doc of sorted) {
    for (const region of doc.regions) {
      if (!READABLE_ROLES.has(region.role)) continue;
      for (const block of region.blocks) {
        if (block.kind === 'claim') offer(doc, region.anchor, block.label, inlineToText(block.content), block.sources.map((source) => source.key).filter((key) => key !== null));
        if (block.kind === 'paragraph') for (const found of labelledSentences(block.content)) offer(doc, region.anchor, found.label, found.text, found.cites);
      }
    }
  }
  // Interleave labels (first of each, then second of each) so consecutive cards differ.
  const order: EvidenceLabel[] = ['PAPER-REPORTED', 'DERIVED', 'OFFICIAL-DOCUMENTATION', 'NOT-DISCLOSED', 'MATHEMATICALLY-DERIVED', 'ASSUMED', 'UNVERIFIED', 'KNOWN'];
  const rounds = [0, 1].flatMap((round) => order.map((label) => byLabel.get(label)?.[round]).filter((claim) => claim !== undefined));
  return rounds.slice(0, max);
}

/**
 * Evidence labels applied in the chapter manuscripts: claim/observation blocks and inline labels.
 * Front matter and appendices are left out (they name labels to explain them), and so is the
 * measurement class, which Edition 1.0 mentions only to say it was not used.
 */
export function countLabels(docs: readonly ResearchDocument[]): HomeModel['labels'] {
  const counts = new Map<EvidenceLabel, number>();
  const add = (label: EvidenceLabel | null): void => {
    if (label !== null) counts.set(label, (counts.get(label) ?? 0) + 1);
  };
  for (const doc of docs) {
    if (doc.meta.chapter === null) continue;
    walkDocument(doc, {
      block: (block) => {
        if (block.kind === 'claim' || block.kind === 'observation') add(block.label);
      },
      inline: (node) => {
        if (node.kind === 'label') add(node.label);
      },
    });
  }
  return EVIDENCE_LABELS.map((label) => ({ label, cls: EVIDENCE_CLASS[label], count: counts.get(label) ?? 0 }))
    .filter((entry) => entry.count > 0 && entry.cls !== 'measurement')
    .sort((a, b) => b.count - a.count);
}

export function buildLayers(stack: StackModel): HomeLayer[] {
  return stack.parts.map((part) => {
    const chapters = part.chapters.map((n) => stack.chapters[String(n)]).filter((chapter) => chapter !== undefined);
    return {
      numeral: part.numeral,
      title: part.title.replace(/^Part [IVXL]+ — /u, ''),
      url: part.url,
      domain: part.domain,
      written: chapters.filter((chapter) => chapter.written).length,
      chapters: chapters.map((chapter) => ({ number: chapter.number, title: chapter.title, url: chapter.url, written: chapter.written })),
    };
  });
}

/** The short title, unless it is a placeholder ("Chapter 15 overview"). */
const displayTitle = (chapter: { readonly short: string; readonly title: string }): string =>
  /^chapter \d+/iu.test(chapter.short) ? chapter.title : chapter.short;

/** Written chapters with both upstream and downstream links, the most connected first. */
export function buildFocus(stack: StackModel, max = 4): HomeFocus[] {
  const ref = (n: number): HomeRef | null => {
    const chapter = stack.chapters[String(n)];
    return chapter === undefined ? null : { number: chapter.number, title: displayTitle(chapter), url: chapter.url, written: chapter.written };
  };
  return Object.values(stack.chapters)
    .filter((chapter) => chapter.written && chapter.prereqs.length > 0 && chapter.unlocks.length > 0)
    .sort((a, b) => Math.min(b.prereqs.length, 4) + Math.min(b.unlocks.length, 4) - (Math.min(a.prereqs.length, 4) + Math.min(a.unlocks.length, 4)) || a.n - b.n)
    .slice(0, max)
    .sort((a, b) => a.n - b.n)
    .map((chapter) => ({
      number: chapter.number,
      title: displayTitle(chapter),
      url: chapter.url,
      prereqs: chapter.prereqs.slice(-4).map(ref).filter((entry) => entry !== null),
      unlocks: chapter.unlocks.slice(0, 4).map(ref).filter((entry) => entry !== null),
    }));
}

/** Top results for each query from the site's own search index (same options as the palette). */
export function runSearches(indexJson: string, docsJson: string, queries: readonly string[], per = 4): HomeSearch[] {
  const engine = MiniSearch.loadJSON<SearchDoc>(indexJson, { ...SEARCH_INDEX_OPTIONS, searchOptions: { ...SEARCH_INDEX_OPTIONS.searchOptions, boost: { ...SEARCH_INDEX_OPTIONS.searchOptions.boost } }, fields: [...SEARCH_INDEX_OPTIONS.fields], storeFields: [...SEARCH_INDEX_OPTIONS.storeFields] });
  const docs = new Map((JSON.parse(docsJson) as SearchDoc[]).map((doc) => [doc.id, doc]));
  return queries.map((query) => ({
    query,
    results: engine
      .search(query)
      .slice(0, per)
      .map((hit) => docs.get(String(hit.id)))
      .filter((doc) => doc !== undefined)
      .map((doc) => ({ kind: doc.kind, title: doc.title, context: doc.context, url: doc.url })),
  }));
}

/** Section anatomy in reading order with the depth at which each region appears. */
export function buildAnatomy(): HomeModel['anatomy'] {
  const roles = ['scope', 'why', 'intuition', 'formulation', 'mechanism', 'algorithm', 'experimental-design', 'observations', 'failure-modes', 'siblings', 'implementation', 'reproducibility'] as const;
  return roles.map((role) => ({ label: REGION_ROLE_LABELS[role], depth: REGION_ROLE_DEPTH[role] }));
}

export function depthList(): HomeModel['depths'] {
  return DEPTHS.map((key) => ({ key, label: DEPTH_LABELS[key], description: DEPTH_DESCRIPTIONS[key] }));
}
