/**
 * Build-time figure index for the Figures page: every compiled figure of every
 * document that has one, with its kind, placement, live states, and where it
 * sits (chapter, section). The registry's object index names figures; the
 * compiled documents carry their specs, so both are read here.
 */
import { FIGURE_KINDS, type FigureKind, type FigurePlacement } from '@atlas/core';
import { getDocument, getGraph, getRegistry, hasDocument } from './atlas.ts';
import { mapBounded } from './concurrency.ts';

export interface FigureRow {
  readonly id: string;
  /** `5.3`, or null for derived (unnumbered) figures such as concept maps. */
  readonly number: string | null;
  readonly title: string;
  readonly kind: FigureKind;
  readonly placement: FigurePlacement;
  /** Scroll-driven states: > 0 means a live rail instrument. */
  readonly states: number;
  readonly authored: boolean;
  readonly url: string;
  readonly chapter: number;
  /** `5.2`, `05`, or null (verification / references pages). */
  readonly where: string;
  readonly whereTitle: string;
}

export type KindFamily = 'structure' | 'computation' | 'quantity' | 'comparison';

/** What each kind is for, and its family (colour) — one line each, for readouts and headers. */
export const KIND_INFO: Readonly<Record<FigureKind, { readonly short: string; readonly family: KindFamily; readonly purpose: string }>> = {
  diagram: { short: 'diagram', family: 'structure', purpose: 'data or control flow between components' },
  cycle: { short: 'cycle', family: 'structure', purpose: 'loops and feedback between stages' },
  hierarchy: { short: 'hier.', family: 'structure', purpose: 'levels, containment, and taxonomies' },
  lineage: { short: 'lineage', family: 'structure', purpose: 'the ancestry of a method over time' },
  'tensor-flow': { short: 'tensor', family: 'computation', purpose: 'tensor shapes through an operation' },
  'systems-trace': { short: 'trace', family: 'computation', purpose: 'one step or request through system components' },
  'memory-stack': { short: 'memory', family: 'computation', purpose: 'how bytes or a budget divide' },
  matrix: { short: 'matrix', family: 'computation', purpose: 'pairwise structure: masks, routing, designs' },
  calculator: { short: 'calc', family: 'quantity', purpose: 'a live evaluation of the chapter’s equation' },
  'stat-panel': { short: 'stats', family: 'quantity', purpose: 'reported and derived numbers with their labels' },
  chart: { short: 'chart', family: 'quantity', purpose: 'a quantity against a variable' },
  compare: { short: 'compare', family: 'comparison', purpose: 'alternatives on stated axes' },
};

/** Kinds in family order, so the matrix reads structure → computation → quantity → comparison. */
export const KIND_ORDER: readonly FigureKind[] = (['structure', 'computation', 'quantity', 'comparison'] as const).flatMap((family) =>
  FIGURE_KINDS.filter((kind) => KIND_INFO[kind].family === family),
);

export async function collectFigures(): Promise<FigureRow[]> {
  const [registry, graph] = await Promise.all([getRegistry(), getGraph()]);
  const ids = [...new Set(registry.objects.filter((entry) => entry.kind === 'figure').map((entry) => entry.nodeId))];
  const perDoc = await mapBounded(ids, 6, async (id) => {
    if (!(await hasDocument(id))) return [];
    const doc = await getDocument(id);
    const node = graph.nodes[id];
    const chapter = doc.meta.chapter ?? 0;
    const where = doc.meta.entityType === 'section' ? (node?.number ?? '') : doc.meta.entityType === 'chapter' ? 'README' : doc.meta.entityType;
    return doc.figures.map(
      (figure): FigureRow => ({
        id: figure.id,
        number: figure.number,
        title: figure.spec.title,
        kind: figure.spec.kind,
        placement: figure.placement,
        states: figure.spec.states.length,
        authored: figure.origin === 'authored',
        url: `${doc.route.url}#${figure.anchor}`,
        chapter,
        where,
        whereTitle: node?.shortTitle ?? doc.header.title,
      }),
    );
  });
  const rows = perDoc.flat();
  const numberKey = (row: FigureRow): number => {
    const match = /^(\d+)\.(\d+)$/u.exec(row.number ?? '');
    return match === null ? 9999 : Number(match[2]);
  };
  return rows.sort((a, b) => a.chapter - b.chapter || numberKey(a) - numberKey(b) || a.id.localeCompare(b.id));
}
