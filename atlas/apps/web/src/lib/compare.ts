/**
 * Compare mode (UI_UX §14–15) for Edition 1.0: a node's authored sibling
 * differentials (CONTENT_CONTRACT §7) side by side, rows = the six
 * differential questions, columns = the siblings. Rows whose answers differ
 * are emphasised; identical rows recede.
 */
import {
  inlineToText,
  SIBLING_FIELD_TITLES,
  SIBLING_FIELDS,
  type Inline,
  type NodeId,
  type ResearchDocument,
  type SiblingBlock,
  type SiblingField,
} from '@atlas/core';
import { listDocuments, getManifest } from './atlas.ts';
import { squash } from './format.ts';
import { blocksOfKind } from './walk.ts';

export function siblingBlocks(doc: ResearchDocument): SiblingBlock[] {
  return blocksOfKind(doc, 'sibling');
}

export interface CompareRow {
  readonly field: SiblingField;
  readonly title: string;
  /** One cell per sibling, in column order; null when the author left the field out. */
  readonly cells: readonly (readonly Inline[] | null)[];
  /** True when at least two present cells differ in text. */
  readonly differs: boolean;
  /** Number of siblings that answer this question. */
  readonly answered: number;
}

/** Comparison key for an answer: case, spacing, and trailing punctuation do not make answers differ. */
function answerKey(cell: readonly Inline[]): string {
  return squash(inlineToText(cell))
    .toLowerCase()
    .replace(/[\s.,;:!]+$/u, '');
}

export function compareRows(siblings: readonly SiblingBlock[]): CompareRow[] {
  return SIBLING_FIELDS.map((field) => {
    const cells = siblings.map((sibling) => sibling.differential[field]);
    const texts = cells.filter((cell): cell is readonly Inline[] => cell !== null).map(answerKey);
    return {
      field,
      title: SIBLING_FIELD_TITLES[field],
      cells,
      differs: new Set(texts).size > 1,
      answered: texts.length,
    };
  });
}

interface CompareIndexCache {
  readonly key: unknown;
  readonly ids: Promise<ReadonlySet<NodeId>>;
}

let cache: CompareIndexCache | null = null;

/** Ids of every compiled document with at least one sibling differential (memoised per bundle). */
export async function nodesWithCompare(): Promise<ReadonlySet<NodeId>> {
  const manifest = await getManifest();
  if (cache?.key !== manifest) {
    const ids = listDocuments().then(
      (docs) => new Set(docs.filter((doc) => siblingBlocks(doc).length > 0).map((doc) => doc.meta.id)),
    );
    cache = { key: manifest, ids };
  }
  return cache.ids;
}
