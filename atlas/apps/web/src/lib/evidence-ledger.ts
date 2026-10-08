/**
 * The evidence page's instrument (pages/evidence.astro): how often each of the
 * ten labels marks a statement in each chapter's manuscript. Counted over
 * chapter and section documents only — front matter, verification pages, and
 * appendices describe the labels rather than use them (they name
 * EMPIRICALLY-OBSERVED, for instance, to say it does not occur). A statement
 * is a labelled claim or observation block, or an inline label in prose.
 */
import { EVIDENCE_LABELS, type EvidenceLabel, type ResearchDocument } from '@atlas/core';
import { walkDocument } from './walk.ts';

export interface EvidenceLedger {
  /** Chapters with at least one labelled statement, ascending. */
  readonly chapters: readonly number[];
  /** count[label][chapter] (0 when absent). */
  readonly count: (label: EvidenceLabel, chapter: number) => number;
  readonly labelTotal: (label: EvidenceLabel) => number;
  readonly chapterTotal: (chapter: number) => number;
  readonly total: number;
  /** Largest single cell, for scaling marks. */
  readonly max: number;
}

export function evidenceLedger(
  docs: readonly ResearchDocument[],
  counted: (doc: ResearchDocument) => boolean,
): EvidenceLedger {
  const cells = new Map<EvidenceLabel, Map<number, number>>(
    EVIDENCE_LABELS.map((label) => [label, new Map<number, number>()]),
  );
  const add = (label: EvidenceLabel | null, chapter: number): void => {
    if (label === null) return;
    const row = cells.get(label);
    row?.set(chapter, (row.get(chapter) ?? 0) + 1);
  };
  for (const doc of docs) {
    const chapter = doc.meta.chapter;
    if (chapter === null || !counted(doc)) continue;
    walkDocument(doc, {
      block: (block) => {
        if (block.kind === 'claim' || block.kind === 'observation') add(block.label, chapter);
      },
      inline: (node) => {
        if (node.kind === 'label') add(node.label, chapter);
      },
    });
  }
  const chapters = [...new Set([...cells.values()].flatMap((row) => [...row.keys()]))].sort((a, b) => a - b);
  const count = (label: EvidenceLabel, chapter: number): number => cells.get(label)?.get(chapter) ?? 0;
  const labelTotal = (label: EvidenceLabel): number =>
    [...(cells.get(label)?.values() ?? [])].reduce((sum, n) => sum + n, 0);
  const chapterTotal = (chapter: number): number =>
    EVIDENCE_LABELS.reduce((sum, label) => sum + count(label, chapter), 0);
  const total = EVIDENCE_LABELS.reduce((sum, label) => sum + labelTotal(label), 0);
  const max = Math.max(0, ...[...cells.values()].flatMap((row) => [...row.values()]));
  return { chapters, count, labelTotal, chapterTotal, total, max };
}

/** Mark diameter in px for a count: area ∝ count, so the eye reads totals honestly; 0 draws nothing. */
export function markSize(count: number, max: number, largest = 20, smallest = 3): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.max(smallest, Math.round(Math.sqrt(count / max) * largest * 10) / 10);
}

/** "31%" (whole percent; "<1%" for a non-zero share under one percent). */
export function share(part: number, whole: number): string {
  if (whole <= 0 || part <= 0) return '0%';
  const pct = (part / whole) * 100;
  return pct < 1 ? '<1%' : `${String(Math.round(pct))}%`;
}
