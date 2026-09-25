/**
 * The evaluation ecosystem (`/evaluation-ecosystem/`): a ranked list of the
 * 100 evaluation frameworks, benchmarks, and platforms that matter in 2026,
 * validated at the trust boundary and connected to the book.
 *
 *   data        src/data/evaluation-ecosystem.json — rank, name, type and
 *               rationale verbatim from the supplied list; kind, domain, and
 *               chapter anchors are the atlas's classification; links and
 *               maintainer facts were checked against primary sources
 *   mentions    where written pages already name an entry (alias match over
 *               the compiled prose), so the page links into the text
 *   papers      registry works whose titles name an entry
 */
import type { AtlasGraph, NodeId, ReferenceRecord, ResearchDocument } from '@atlas/core';
import { z } from 'zod';
import raw from '../data/evaluation-ecosystem.json' with { type: 'json' };
import { walkDocument } from './walk.ts';

export const KINDS = [
  { key: 'leaderboard', label: 'Leaderboard / index', plural: 'leaderboards and indices' },
  { key: 'benchmark', label: 'Benchmark', plural: 'benchmarks' },
  { key: 'framework', label: 'Framework / harness', plural: 'frameworks and harnesses' },
  { key: 'platform', label: 'Platform / service', plural: 'platforms and services' },
] as const;
export type KindKey = (typeof KINDS)[number]['key'];

export const DOMAINS = [
  { key: 'general', label: 'General capability & preference', short: 'General' },
  { key: 'reasoning', label: 'Reasoning, mathematics & science', short: 'Reasoning' },
  { key: 'coding', label: 'Coding & software engineering', short: 'Coding' },
  { key: 'agents', label: 'Agents, tools & computer use', short: 'Agents' },
  { key: 'work', label: 'Professional & economic work', short: 'Work' },
  { key: 'multimodal', label: 'Multimodal understanding', short: 'Multimodal' },
  { key: 'context', label: 'Long context', short: 'Long context' },
  { key: 'safety', label: 'Safety, security & red-teaming', short: 'Safety' },
  { key: 'apps', label: 'Applications, RAG & production', short: 'Applications' },
] as const;
export type DomainKey = (typeof DOMAINS)[number]['key'];

export const ACCESS_LABEL: Readonly<Record<string, string>> = {
  'open-source': 'open source',
  'open-benchmark': 'open benchmark',
  'private-test': 'private test set',
  commercial: 'commercial',
  hosted: 'hosted, free to view',
};

const url = z.url({ protocol: /^https$/u });
const EntrySchema = z.object({
  rank: z.number().int().min(1).max(100),
  core: z.boolean(),
  name: z.string().min(1),
  short: z.string().min(1),
  type: z.string().min(1),
  why: z.string().min(1),
  kind: z.enum(KINDS.map((kind) => kind.key) as [KindKey, ...KindKey[]]),
  domain: z.enum(DOMAINS.map((domain) => domain.key) as [DomainKey, ...DomainKey[]]),
  chapters: z.array(z.number().int().min(1).max(66)),
  aliases: z.array(z.string().min(1)),
  refs: z.array(z.object({ label: z.string(), n: z.number().int() })),
  links: z.object({ official: url.nullable(), repo: url.nullable(), paper: url.nullable() }),
  org: z.string().nullable(),
  released: z.string().regex(/^\d{4}(?:-\d{2})?$/u).nullable(),
  access: z.string().nullable(),
  verification: z.object({
    status: z.enum(['confirmed', 'renamed', 'unconfirmed', 'pending']),
    currentName: z.string().nullable(),
    note: z.string(),
    listLinkOk: z.boolean().nullable(),
  }),
});
const DataSchema = z.object({
  meta: z.object({ title: z.string(), asOf: z.string(), provenance: z.string(), verified: z.number().int() }),
  sources: z.array(z.object({ n: z.number().int(), url, title: z.string() })),
  entries: z.array(EntrySchema).length(100),
});

export type EcoEntry = z.infer<typeof EntrySchema>;
export type EcoData = z.infer<typeof DataSchema>;

let cached: EcoData | null = null;
/** The validated list; ranks must run 1…100 without gaps and every cited source must exist. */
export function ecosystem(): EcoData {
  if (cached !== null) return cached;
  const data = DataSchema.parse(raw);
  const sources = new Set(data.sources.map((source) => source.n));
  data.entries.forEach((entry, index) => {
    if (entry.rank !== index + 1) throw new Error(`evaluation ecosystem: rank ${String(index + 1)} is out of order`);
    for (const ref of entry.refs) if (!sources.has(ref.n)) throw new Error(`evaluation ecosystem: #${String(entry.rank)} cites missing source [${String(ref.n)}]`);
  });
  cached = data;
  return data;
}

// ── mentions in the book ─────────────────────────────────────────────────────

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

/** One regex per entry: any alias as a whole token (`~` prefix = case-insensitive). */
export function aliasMatcher(aliases: readonly string[]): { readonly exact: RegExp | null; readonly folded: RegExp | null } {
  const build = (list: readonly string[], flags: string): RegExp | null =>
    list.length === 0 ? null : new RegExp(`(?<![\\p{L}\\p{N}_-])(?:${list.map(escape).join('|')})(?![\\p{L}\\p{N}_])`, flags);
  return {
    exact: build(aliases.filter((alias) => !alias.startsWith('~')), 'u'),
    folded: build(aliases.filter((alias) => alias.startsWith('~')).map((alias) => alias.slice(1)), 'iu'),
  };
}

export function matches(matcher: ReturnType<typeof aliasMatcher>, text: string): boolean {
  return (matcher.exact?.test(text) ?? false) || (matcher.folded?.test(text) ?? false);
}

/** Plain prose of a compiled document (text and code spans, headings, tables, lists). */
export function documentText(doc: ResearchDocument): string {
  const parts: string[] = [];
  walkDocument(doc, {
    inline: (node) => {
      if (node.kind === 'text' || node.kind === 'code') parts.push(node.value);
    },
  });
  return parts.join(' ');
}

export interface Mention {
  readonly id: NodeId;
  readonly url: string;
  readonly number: string | null;
  readonly title: string;
  readonly chapter: number;
}

/** For each rank, the written pages whose prose names the entry, in reading order. */
export function findMentions(entries: readonly EcoEntry[], docs: readonly ResearchDocument[], graph: AtlasGraph): Map<number, Mention[]> {
  const order = new Map(graph.order.map((id, index) => [id, index]));
  const texts = docs
    .filter((doc) => doc.meta.chapter !== null && (doc.meta.entityType === 'section' || doc.meta.entityType === 'chapter'))
    .map((doc) => ({ doc, text: documentText(doc) }));
  const out = new Map<number, Mention[]>();
  for (const entry of entries) {
    const matcher = aliasMatcher(entry.aliases);
    const found = texts
      .filter(({ text }) => matches(matcher, text))
      .map(({ doc }) => ({ id: doc.meta.id, url: doc.route.url, number: doc.meta.section, title: doc.meta.shortTitle, chapter: doc.meta.chapter ?? 0 }))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    out.set(entry.rank, found);
  }
  return out;
}

/** For each rank, registry works whose title names the entry. */
export function findPapers(entries: readonly EcoEntry[], references: readonly ReferenceRecord[]): Map<number, ReferenceRecord[]> {
  const out = new Map<number, ReferenceRecord[]>();
  for (const entry of entries) {
    const matcher = aliasMatcher(entry.aliases);
    out.set(entry.rank, references.filter((record) => matches(matcher, record.work)));
  }
  return out;
}

/** Domain × kind counts, rows in DOMAINS order, columns in KINDS order. */
export function domainKindMatrix(entries: readonly EcoEntry[]): readonly { readonly domain: DomainKey; readonly cells: readonly number[]; readonly total: number }[] {
  return DOMAINS.map(({ key }) => {
    const cells = KINDS.map((kind) => entries.filter((entry) => entry.domain === key && entry.kind === kind.key).length);
    return { domain: key, cells, total: cells.reduce((a, b) => a + b, 0) };
  });
}

/** Display host of a URL: `github.com/EleutherAI/lm-evaluation-harness` → `github.com/EleutherAI`. */
export function hostLabel(href: string): string {
  const u = new URL(href);
  const host = u.hostname.replace(/^www\./u, '');
  if (host === 'github.com' || host === 'huggingface.co') {
    const owner = u.pathname.split('/').find((part) => part !== '');
    return owner === undefined ? host : `${host}/${owner}`;
  }
  return host;
}
