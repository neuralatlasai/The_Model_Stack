/**
 * Layout dispatch for graph-shaped figure kinds (core `LAID_OUT_KINDS`).
 * Matches `CompileContext.layout` in the compiler seam.
 */
import type { FigureSpec, Scene } from '@atlas/core';
import { layoutCycle } from './cycle.ts';
import { layoutDiagram } from './diagram.ts';

/** Scene for `diagram` (ELK layered) and `cycle` (column + feedback lanes); null for every other kind. */
export async function layoutFigure(spec: FigureSpec): Promise<Scene | null> {
  switch (spec.kind) {
    case 'diagram':
      return await layoutDiagram(spec.spec);
    case 'cycle':
      return layoutCycle(spec.spec);
    default:
      return null;
  }
}

export { layoutCycle, layoutDiagram };
export { layoutNeighbourhood, NEIGHBOURHOOD_CAP, NEIGHBOURHOOD_HEADINGS, type NeighbourhoodInput } from './neighbourhood.ts';
