/**
 * The compare index's instrument (pages/compare/index.astro): every authored
 * alternative as one column of six cells — one per differential question
 * (core SIBLING_FIELDS order), filled where the author answered it — grouped
 * by the node it is an alternative to, one row per chapter. Pure: the page
 * renders it and the tests pin it.
 */
import { inlineToText, SIBLING_FIELDS, type SiblingBlock } from '@atlas/core';
import { squash } from './format.ts';

export interface FieldAlternative {
  readonly name: string;
  /** One flag per SIBLING_FIELDS entry: true where the question is answered. */
  readonly stated: readonly boolean[];
  /** "Why it exists", as plain text ('' when not stated). */
  readonly why: string;
  /** "Changed primitive", as plain text ('' when not stated). */
  readonly change: string;
}

export interface FieldNode {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly href: string;
  readonly alternatives: readonly FieldAlternative[];
  /** Answers given across all alternatives, and answers possible (alternatives × 6). */
  readonly answered: number;
  readonly possible: number;
}

const text = (value: SiblingBlock['differential'][keyof SiblingBlock['differential']]): string =>
  value === null ? '' : squash(inlineToText(value));

/** Section numbers print without a chapter's leading zero ("02.1" → "2.1"), as everywhere else. */
export function sectionNumber(number: string): string {
  return number.replace(/^0(\d)\./u, '$1.');
}

export function fieldAlternative(sibling: SiblingBlock): FieldAlternative {
  return {
    name: sibling.name,
    stated: SIBLING_FIELDS.map((field) => sibling.differential[field] !== null),
    why: text(sibling.differential.whyExists),
    change: text(sibling.differential.changedPrimitive),
  };
}

export function fieldNode(input: {
  id: string;
  number: string | null;
  title: string;
  href: string;
  siblings: readonly SiblingBlock[];
}): FieldNode {
  const alternatives = input.siblings.map(fieldAlternative);
  return {
    id: input.id,
    number: sectionNumber(input.number ?? ''),
    title: input.title,
    href: input.href,
    alternatives,
    answered: alternatives.reduce((sum, alternative) => sum + alternative.stated.filter(Boolean).length, 0),
    possible: alternatives.length * SIBLING_FIELDS.length,
  };
}

/** "every question answered" / "3 answers not stated". */
export function gapNote(answered: number, possible: number): string {
  const missing = possible - answered;
  if (missing <= 0) return 'every question answered';
  return `${String(missing)} answer${missing === 1 ? '' : 's'} not stated`;
}
