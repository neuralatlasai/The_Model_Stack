/**
 * Chapter/section header anatomy (UI_UX §9, CONTENT_CONTRACT §3 items 1–4).
 * Chapter pages carry an authored identity line and meta line; sections,
 * verification and references pages derive them from breadcrumbs and stats.
 */
import type { Inline, ResearchDocument } from '@atlas/core';
import { entityTypeOf } from '@atlas/core';

type HeaderSource = Pick<ResearchDocument, 'header' | 'meta' | 'route' | 'stats'>;

/** `Volume I` for a crumb titled `Volume I` or `Learning and representation`; never `Volume I — Volume I`. */
function labelled(kind: string, number: string | null, title: string, withTitle: boolean): string {
  if (title.toLowerCase().startsWith(kind.toLowerCase())) return title;
  if (number === null) return title;
  return withTitle ? `${kind} ${number} — ${title}` : `${kind} ${number}`;
}

function crumbPart(id: string, number: string | null, title: string): string | null {
  switch (entityTypeOf(id)) {
    case 'volume':
      return labelled('Volume', number, title, false);
    case 'part':
      return labelled('Part', number, title, true);
    case 'chapter':
      return labelled('Chapter', number, title, true);
    case 'appendix':
      return labelled('Appendix', number, title, true);
    case 'section':
    case 'verification':
    case 'references':
    case 'frontmatter':
    case null:
      return null;
  }
}

function selfPart(doc: HeaderSource): string | null {
  switch (doc.meta.entityType) {
    case 'section':
      return doc.meta.section === null ? null : `Section ${doc.meta.section}`;
    case 'verification':
      return 'Verification';
    case 'references':
      return 'References';
    case 'frontmatter':
      return 'Front matter';
    case 'volume':
    case 'part':
    case 'chapter':
    case 'appendix':
      return null;
  }
}

/** Authored identity line, else `Volume I / Part I / Chapter 05 — Minimal Transformer / Section 5.2`. */
export function identityLine(doc: HeaderSource): string | null {
  if (doc.header.identityLine !== null) return doc.header.identityLine;
  const parts: string[] = [];
  for (const crumb of doc.route.breadcrumbs) {
    const part = crumbPart(crumb.id, crumb.number, crumb.title);
    if (part !== null) parts.push(part);
  }
  const own = selfPart(doc);
  if (own !== null) parts.push(own);
  return parts.length === 0 ? null : parts.join(' / ');
}

function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** Derived meta line for documents without an authored one: reading time, object counts, maturity, date. */
export function derivedMetaLine(doc: HeaderSource): string {
  const { stats, meta } = doc;
  const parts: string[] = [];
  if (stats.readingMinutes > 0) parts.push(`${stats.readingMinutes} min read`);
  if (stats.equations > 0) parts.push(plural(stats.equations, 'equation'));
  if (stats.figures > 0) parts.push(plural(stats.figures, 'figure'));
  if (stats.algorithms > 0) parts.push(plural(stats.algorithms, 'algorithm'));
  if (stats.experiments > 0) parts.push(plural(stats.experiments, 'experiment proposal'));
  if (stats.citations > 0) parts.push(plural(stats.citations, 'source'));
  parts.push(meta.maturity);
  parts.push(`updated ${meta.updatedAt}`);
  return parts.join(' · ');
}

/**
 * Sentence-cases a thesis whose first node is text starting with a lowercase
 * letter (sections derive the thesis from `Objective: expand …`). Casing
 * only; code, math, and every other character are left untouched.
 */
export function sentenceCase(nodes: readonly Inline[]): readonly Inline[] {
  const [first, ...rest] = nodes;
  if (first?.kind !== 'text') return nodes;
  const match = /^(\s*)(\p{Ll})/u.exec(first.value);
  if (match === null) return nodes;
  const [whole, space = '', letter = ''] = match;
  return [{ kind: 'text', value: `${space}${letter.toUpperCase()}${first.value.slice(whole.length)}` }, ...rest];
}
