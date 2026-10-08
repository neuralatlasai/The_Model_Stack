/**
 * Select two authored research objects for an article's opening visual surface.
 * A bounded two-item insertion keeps selection O(n) in figure count and O(1)
 * auxiliary storage; sorting the complete document would cost O(n log n).
 * Equal priorities preserve manuscript order. Generated traces and maps remain
 * in the manuscript and never stand in for an authored experimental figure.
 */
import type { CompiledFigure, FigureSpec } from '@atlas/core';

const PRIORITY: Readonly<Record<FigureSpec['kind'], number>> = {
  chart: 0,
  diagram: 5,
  cycle: 5,
  'tensor-flow': 4,
  hierarchy: 3,
  lineage: 4,
  calculator: 2,
  'stat-panel': 3,
  matrix: 3,
  'memory-stack': 3,
  compare: 4,
  'systems-trace': 4,
};

/**
 * Actual compiled scene bounds distinguish a readable narrow dependency chain
 * from a long graph that would lose its labels when fitted to two columns.
 * Large graphs remain available in the full manuscript and as a fallback.
 * Checking bounds is constant-time; no graph traversal enters selection.
 */
function figurePriority(figure: CompiledFigure): number {
  if (figure.spec.kind === 'diagram' || figure.spec.kind === 'cycle') {
    const scene = figure.scene;
    if (
      scene !== null &&
      Number.isFinite(scene.width) &&
      Number.isFinite(scene.height) &&
      scene.width > 0 &&
      scene.width <= 640 &&
      scene.height > 0 &&
      scene.height <= 1200
    )
      return 1;
  }
  return PRIORITY[figure.spec.kind];
}

/** At most two existing figures, ordered by analytical priority and source order. */
export function articleOverviewFigures(figures: readonly CompiledFigure[]): readonly CompiledFigure[] {
  const selected: CompiledFigure[] = [];
  for (const figure of figures) {
    if (figure.origin !== 'authored') continue;
    const priority = figurePriority(figure);
    const index = selected.findIndex((candidate) => figurePriority(candidate) > priority);
    if (index === -1) {
      if (selected.length < 2) selected.push(figure);
    } else {
      selected.splice(index, 0, figure);
      if (selected.length > 2) selected.pop();
    }
  }
  return selected;
}

/**
 * A visual preview is a distinct DOM object, while its specification retains
 * its canonical source identity. SVG descriptions / clip paths, calculator
 * controls, radio names, and rendered figure IDs all derive from this anchor.
 * Neither the canonical manuscript object nor its inline / rail copy changes.
 */
export function articleOverviewCopy(figure: CompiledFigure): CompiledFigure {
  return {
    ...figure,
    id: `fig-auto-overview-${figure.anchor}`,
    anchor: `${figure.anchor}--overview`,
    placement: 'inline',
  };
}
