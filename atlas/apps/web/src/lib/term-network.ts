/**
 * The glossary as a network (pages/terms.astro): which definitions mention
 * which other terms.
 *
 * A mention is an exact, case-insensitive, whole-word match (a plural `s`/`es`
 * allowed) of another term's name in a definition's prose — code and math are
 * not searched. A name also answers to the forms it lists: parenthetical
 * qualifiers are dropped (`censoring (of a trajectory)` → `censoring`) and
 * names joined by ` / `, `;`, `,`, or `and` split into their parts, keeping a
 * part only when it can stand alone as a name (two or more words, a hyphenated
 * word, or a capitalised word/acronym: `KL divergence`, `cross-entropy`, `VJP`)
 * so `available / sampled / consumed tokens` does not claim every "available".
 * Pure; no DOM.
 */
import type { Inline } from '@atlas/core';

export interface TermName {
  readonly slug: string;
  readonly term: string;
}

/** Forms a term's name answers to, longest first. */
export function termForms(name: string): string[] {
  const bare = name.replace(/\s*\([^)]*\)/gu, ' ').replace(/\s+/gu, ' ').trim();
  const parts = bare
    .split(/\s+\/\s+|\s*;\s*|,\s+|\s+and\s+/u)
    .map((part) => part.trim())
    .filter((part) => part !== '' && part !== bare);
  const standalone = (part: string): boolean => /\s/u.test(part) || part.includes('-') || /^\p{Lu}/u.test(part);
  const forms = new Set([bare, ...parts.filter(standalone)].filter((form) => form.length >= 3));
  return [...forms].sort((a, b) => b.length - a.length);
}

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

interface Matcher {
  readonly slug: string;
  readonly form: string;
  readonly re: RegExp;
}

export function matchers(terms: readonly TermName[]): Matcher[] {
  return terms
    .flatMap((term) =>
      termForms(term.term).map((form) => ({
        slug: term.slug,
        form,
        // Acronyms match case-sensitively; words and phrases do not.
        re: new RegExp(`(?<![\\p{L}\\p{N}-])${escape(form)}(?:e?s)?(?![\\p{L}\\p{N}-])`, /^[\p{Lu}\d]{2,}$/u.test(form) ? 'gu' : 'giu'),
      })),
    )
    .sort((a, b) => b.form.length - a.form.length);
}

export interface Segment {
  readonly text: string;
  /** Slug of the mentioned term, or null for plain text. */
  readonly slug: string | null;
}

/** Splits prose into plain text and mentions (longest form wins; no overlaps; `self` is never a mention). */
export function segment(text: string, all: readonly Matcher[], self: string): Segment[] {
  const taken: { start: number; end: number; slug: string }[] = [];
  for (const matcher of all) {
    if (matcher.slug === self) continue;
    matcher.re.lastIndex = 0;
    for (const match of text.matchAll(matcher.re)) {
      const start = match.index;
      const end = start + match[0].length;
      if (taken.some((span) => start < span.end && end > span.start)) continue;
      taken.push({ start, end, slug: matcher.slug });
    }
  }
  taken.sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let at = 0;
  for (const span of taken) {
    if (span.start > at) out.push({ text: text.slice(at, span.start), slug: null });
    out.push({ text: text.slice(span.start, span.end), slug: span.slug });
    at = span.end;
  }
  if (at < text.length) out.push({ text: text.slice(at), slug: null });
  return out;
}

/** Prose of a definition for mention search: text, emphasis, and link text; not code or math. */
export function proseOf(nodes: readonly Inline[]): string {
  return nodes
    .map((node) => {
      switch (node.kind) {
        case 'text':
          return node.value;
        case 'emphasis':
        case 'strong':
        case 'delete':
        case 'link':
          return proseOf(node.children);
        case 'code':
        case 'math':
        case 'cite':
        case 'label':
        case 'xref':
        case 'break':
          return ' ';
      }
    })
    .join('');
}

/** Mentions out of every definition (slug → mentioned slugs, in order of first mention). */
export function mentionGraph(terms: readonly (TermName & { readonly definition: readonly Inline[] })[]): Map<string, string[]> {
  const all = matchers(terms);
  return new Map(
    terms.map((term) => [
      term.slug,
      [...new Set(segment(proseOf(term.definition), all, term.slug).flatMap((part) => (part.slug === null ? [] : [part.slug])))],
    ]),
  );
}

/** Equation numbers a definition cross-references (`Eq. 5.23–5.24` counts 5.23). */
export function equationRefs(nodes: readonly Inline[]): string[] {
  const out: string[] = [];
  const walk = (list: readonly Inline[]): void => {
    for (const node of list) {
      if (node.kind === 'xref' && node.ref === 'equation') out.push(node.number);
      else if ('children' in node) walk(node.children);
    }
  };
  walk(nodes);
  return [...new Set(out)];
}
