/**
 * Figure placement helpers.
 *
 * A rail-placed figure is drawn twice: in the context rail (desktop) and
 * inline for narrow viewports where the rail is a sheet. `<Figure>` from
 * @atlas/visual/svg writes `id={figure.anchor}`, and the calculator island
 * derives its control ids from the figure, so each copy receives a distinct
 * anchor. The canonical `#fig-5-4` fragment stays on the reading-column
 * placeholder, which is visible at every breakpoint.
 */
import type { CompiledFigure } from '@atlas/core';

export type FigureCopy = 'rail' | 'inline';

export function figureCopy(figure: CompiledFigure, copy: FigureCopy): CompiledFigure {
  return { ...figure, anchor: `${figure.anchor}--${copy}` };
}

export function isCalculator(figure: CompiledFigure): boolean {
  return figure.spec.kind === 'calculator';
}

/** `Figure 5.4` for numbered figures; the title for unnumbered derived figures. */
export function figureLabel(figure: CompiledFigure): string {
  return figure.number === null ? figure.spec.title : `Figure ${figure.number}`;
}
