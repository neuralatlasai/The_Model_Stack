/**
 * Client-only DOM hooks: the markup attributes the client controllers look for
 * beyond the frozen core DOM contract (`ATTR` in @atlas/core). Server-rendered
 * components (web-shell, web-blocks, visual) opt into behaviour by emitting
 * these attributes; every controller degrades to a no-op when its hook is
 * absent, so pages stay fully readable without JavaScript.
 *
 * `data-action` values (buttons or links):
 *   tree-toggle            caret in a tree row (`data-tree-target="{nodeId}"`): expand/collapse, no navigation
 *   toggle-tree            native popover invoker for the knowledge tree (`popovertarget`); enhanced
 *   toggle-rail            native popover invoker for the context rail sheet (`popovertarget`); enhanced
 *   open-tree              open the tree in a client-built slide-in dialog (markup without popovers)
 *   open-context           open the rail in a client-built bottom-sheet dialog (markup without popovers)
 *   bookmark               toggle a bookmark; optional data-bookmark-kind / data-bookmark-anchor
 *                          (defaults to the active region)
 *   open-search            open the ⌘K / Ctrl-K palette (also `search`, `palette`)
 *   toggle-theme           cycle light → dark → system; optional data-theme-value sets one directly
 *   set-depth              depth control; value in data-depth-option (or data-depth-value);
 *                          links keep their `?depth=` href as the no-JS fallback
 *   copy-code              copy the code of the enclosing block (or of #data-copy-target)
 *   copy-link              copy a link to data-anchor (or the href fragment) at the current depth
 *   inspector-close        close the rail inspector
 */
export const HOOK = {
  action: 'data-action',
  depthOption: ['data-depth-option', 'data-depth-value'],
  themeValue: 'data-theme-value',
  treeTarget: 'data-tree-target',
  bookmarkKind: 'data-bookmark-kind',
  bookmarkAnchor: 'data-bookmark-anchor',
  copyTarget: 'data-copy-target',
  anchor: 'data-anchor',
  /** Rail inspector host; created by the client above the first instrument group when absent. */
  railInspector: 'data-rail-inspector',
  /** Rail root (the context panel); falls back to the parent of the first `[data-rail-for]` group. */
  rail: 'data-rail',
  /** Optional element in the rail header whose text shows the active region's title. */
  railCurrent: 'data-rail-current',
  /** Knowledge-tree panel (client-built slide-in when the markup has no popover). */
  treePanel: 'data-tree-panel',
  /** Optional per-item label element for tree type-ahead (else `.sh-tree-label`, else the item text). */
  treeLabel: 'data-tree-label',
  /** Header view links (UI_UX §9 `[ Read ] [ Map ] … [ Compare ]`): `data-view="map" | "compare"`. */
  view: 'data-view',
  /** Chart hooks emitted by the visual renderer (see charts.ts). */
  chartSeries: 'data-series',
  chartToggle: 'data-series-toggle',
  chartX: 'data-x',
  chartY: 'data-y',
  chartXFormat: 'data-x-format',
  chartYFormat: 'data-y-format',
  /** Site base for fetches when served under a sub-path: `<meta name="atlas-base" content="/atlas/">`. */
  baseMeta: 'atlas-base',
} as const;

export const ACTIONS = {
  treeToggle: ['tree-toggle'],
  togglePanel: ['toggle-tree', 'toggle-rail'],
  openTree: ['open-tree'],
  openContext: ['open-context'],
  bookmark: ['bookmark'],
  search: ['open-search', 'search', 'palette'],
  theme: ['toggle-theme', 'theme'],
  depth: ['set-depth', 'depth'],
  copyCode: ['copy-code'],
  copyLink: ['copy-link'],
  copyTex: ['copy-tex'],
  inspectorClose: ['inspector-close'],
} as const satisfies Record<string, readonly string[]>;

/** `[data-action="a"], [data-action="b"]` for one action family. */
export function actionSelector(names: readonly string[]): string {
  return names.map((name) => `[${HOOK.action}="${name}"]`).join(', ');
}

/** The closest element (from an event target) carrying one of the actions, or null. */
export function closestAction(target: EventTarget | null, names: readonly string[]): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(actionSelector(names)) : null;
}

/** First non-empty value among several attribute names. */
export function attrOf(element: Element, names: readonly string[]): string | null {
  for (const name of names) {
    const value = element.getAttribute(name);
    if (value !== null && value !== '') return value;
  }
  return null;
}

/** Viewport width at which the rail becomes a column (UI_UX §56–57). */
export const DESKTOP_MIN_WIDTH = 1024;
