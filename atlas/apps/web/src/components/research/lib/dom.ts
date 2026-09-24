/**
 * DOM-contract attribute builders. Attribute names come from core `ATTR` so
 * renderers never hard-code them; templates spread the returned objects.
 *
 * Client hooks beyond the core contract are the ones web-client documents in
 * `apps/web/src/client/hooks.ts`:
 * - `data-rail` on the rail root and an empty `data-rail-inspector` slot;
 * - `data-action="copy-code" | "copy-link"` on quiet tool controls;
 * - `data-equation="5.4"` on an equation root, so rail variable rows can find
 *   the rendered equation they describe.
 * Equation inspection needs no extra hook: any `[data-xref^="equation:"]`
 * element opens the equation in the rail inspector.
 */
import type { Depth, RailInstrumentKind, RegionRole } from '@atlas/core';
import { ATTR } from '@atlas/core';

export type Attrs = Readonly<Record<string, string>>;

export const RAIL_ROOT_ATTR = 'data-rail';
export const RAIL_INSPECTOR_ATTR = 'data-rail-inspector';
export const ACTION_ATTR = 'data-action';
export const EQUATION_ATTR = 'data-equation';

export type ToolAction = 'copy-code' | 'copy-link';

export function depthAttrs(depth: Depth): Attrs {
  return { [ATTR.depthMin]: depth };
}

export function regionAttrs(anchor: string, role: RegionRole, depth: Depth): Attrs {
  return { [ATTR.region]: anchor, [ATTR.regionRole]: role, [ATTR.depthMin]: depth };
}

export function railForAttrs(regionAnchor: string): Attrs {
  return { [ATTR.railFor]: regionAnchor };
}

export function instrumentAttrs(kind: RailInstrumentKind): Attrs {
  return { [ATTR.railInstrument]: kind };
}

export function citeAttrs(key: string): Attrs {
  return { [ATTR.cite]: key };
}

export function termAttrs(slug: string): Attrs {
  return { [ATTR.term]: slug };
}

/** `equation:5.4` — the cross-reference kind and number (core XRefKind). */
export function xrefAttrs(value: string): Attrs {
  return { [ATTR.xref]: value };
}

/** Opens equation `number` in the rail inspector (hover preview, click to pin). */
export function inspectEquationAttrs(number: string): Attrs {
  return xrefAttrs(`equation:${number}`);
}

export function eqVarAttrs(symbol: string): Attrs {
  return { [ATTR.eqVar]: symbol };
}

/** On the minimap root: the node it outlines. The client marks the active region's link. */
export function minimapAttrs(nodeId: string): Attrs {
  return { [ATTR.minimap]: nodeId };
}

/** On the reading-progress hairline; the client writes the fraction read (0..1). */
export function progressAttrs(): Attrs {
  return { [ATTR.progress]: '0' };
}

export function actionAttrs(action: ToolAction): Attrs {
  return { [ACTION_ATTR]: action };
}

export function equationAttrs(number: string): Attrs {
  return { [EQUATION_ATTR]: number };
}

export function railRootAttrs(): Attrs {
  return { [RAIL_ROOT_ATTR]: '' };
}

export function railInspectorAttrs(): Attrs {
  return { [RAIL_INSPECTOR_ATTR]: '' };
}
