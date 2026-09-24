/**
 * Cross-reference index (two-pass compile, pass 1). Every document's numbered
 * objects are indexed before any body is compiled, so "Eq. 5.4" in chapter 14
 * resolves to the section of chapter 5 that defines it. First definition in
 * reading order wins; later duplicates are diagnosed.
 */
import { diagnostic, objectAnchor, type Diagnostic, type NodeId, type XRefKind, type XRefTarget } from '@atlas/core';
import type { NumberedObjectIndex } from '../markdown/contract.ts';

const PREFIX: Readonly<Record<XRefKind, 'eq' | 'alg' | 'fig' | 'exp' | 'prop'>> = {
  equation: 'eq',
  algorithm: 'alg',
  figure: 'fig',
  experiment: 'exp',
  proposition: 'prop',
};

const FIELD: Readonly<Record<XRefKind, keyof NumberedObjectIndex>> = {
  equation: 'equations',
  algorithm: 'algorithms',
  figure: 'figures',
  experiment: 'experiments',
  proposition: 'propositions',
};

export interface XRefSource {
  readonly nodeId: NodeId;
  readonly url: string;
  readonly sourcePath: string;
  readonly index: NumberedObjectIndex;
}

export interface XRefIndex {
  readonly resolve: (kind: XRefKind, number: string) => XRefTarget | null;
  readonly size: number;
  readonly diagnostics: readonly Diagnostic[];
}

/** `fig-5.3` / `Figure 5.3` / ` 5.3 ` → `5.3`; anything else is returned trimmed. */
export function normaliseObjectNumber(value: string): string {
  const match = /(\d+\.\d+[a-z]?)\s*$/u.exec(value.trim());
  return match?.[1] ?? value.trim();
}

/** Builds the index from pass-1 results given in reading order. */
export function buildXRefIndex(sources: readonly XRefSource[]): XRefIndex {
  const table = new Map<string, XRefTarget>();
  const diagnostics: Diagnostic[] = [];
  const owners = new Map<string, string>();

  for (const source of sources) {
    for (const kind of Object.keys(PREFIX) as XRefKind[]) {
      const seenHere = new Set<string>();
      for (const raw of source.index[FIELD[kind]]) {
        const number = normaliseObjectNumber(raw);
        if (seenHere.has(number)) continue; // in-document duplicates are the Markdown compiler's diagnosis
        seenHere.add(number);
        const key = `${kind}:${number}`;
        const owner = owners.get(key);
        if (owner !== undefined) {
          if (kind === 'figure') {
            diagnostics.push(
              diagnostic('figure-duplicate-id', `fig-${number} is already defined in ${owner}; figure ids are unique across the book`, {
                file: source.sourcePath,
                nodeId: source.nodeId,
              }),
            );
          } else if (kind === 'equation') {
            diagnostics.push(
              diagnostic('equation-duplicate-number', `Eq. ${number} is already defined in ${owner}; references resolve to the first`, {
                file: source.sourcePath,
                nodeId: source.nodeId,
              }),
            );
          }
          continue;
        }
        owners.set(key, source.sourcePath);
        const anchor = objectAnchor(PREFIX[kind], number);
        table.set(key, { nodeId: source.nodeId, anchor, href: `${source.url}#${anchor}` });
      }
    }
  }

  return {
    resolve: (kind, number) => table.get(`${kind}:${normaliseObjectNumber(number)}`) ?? null,
    size: table.size,
    diagnostics,
  };
}
