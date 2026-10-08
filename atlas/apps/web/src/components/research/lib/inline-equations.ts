/** Resolve displayed derivation references only against existing registry equations. */
import type { Registry } from '@atlas/core';
import { isInternalHref } from './url.ts';

const equationIndexes = new WeakMap<Pick<Registry, 'equations'>, ReadonlyMap<string, string>>();
const DERIVATION = /(?<![A-Za-z0-9_:-])DERIVED:eq-((?:\d+|[A-Z])\.\d+[a-z]?)(?![A-Za-z0-9_.])/gu;

export type EquationTextPart =
  | { readonly kind: 'text'; readonly value: string }
  | { readonly kind: 'equation'; readonly number: string; readonly href: string; readonly source: string };

/** O(e) once per registry object; subsequent inline renders reuse its O(1) lookup. */
export function equationTargets(registry: Pick<Registry, 'equations'>): ReadonlyMap<string, string> {
  const cached = equationIndexes.get(registry);
  if (cached !== undefined) return cached;
  const index = new Map<string, string>();
  for (const equation of registry.equations) {
    if (isInternalHref(equation.url)) index.set(equation.number, equation.url);
  }
  equationIndexes.set(registry, index);
  return index;
}

/** Unknown equation IDs remain exact source text, without guessed destinations. */
export function equationTextParts(value: string, equations: ReadonlyMap<string, string>): readonly EquationTextPart[] {
  const parts: EquationTextPart[] = [];
  let cursor = 0;
  for (const match of value.matchAll(DERIVATION)) {
    const number = match[1];
    if (number === undefined) continue;
    const href = equations.get(number);
    if (href === undefined || !isInternalHref(href)) continue;
    if (match.index > cursor) parts.push({ kind: 'text', value: value.slice(cursor, match.index) });
    parts.push({ kind: 'equation', number, href, source: match[0] });
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) parts.push({ kind: 'text', value: value.slice(cursor) });
  return parts;
}

/** Typography only: explicit section-reference lists gain normal comma spaces. */
export function spacedSectionReferences(value: string): string {
  return value.replace(
    /(§{1,2})\s*(\d+\.\d+(?:\s*[–-]\s*\d+\.\d+)?(?:\s*,\s*\d+\.\d+)*)/gu,
    (_reference: string, marker: string, numbers: string) =>
      `${marker}\u202f${numbers.replace(/\s*,\s*(?=\d)/gu, ', ')}`,
  );
}
