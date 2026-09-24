/**
 * Knowledge-tree behaviour (UI_UX §5) over the server-rendered APG
 * navigation treeview:
 *
 *   <ul role="tree">
 *     <li role="none">
 *       <div class="sh-tree-row">
 *         <button data-action="tree-toggle" data-tree-target="{id}" tabindex="-1" aria-hidden="true">
 *         <a role="treeitem" data-tree-node="{id}" href aria-expanded aria-owns="{group id}" aria-current? tabindex>
 *           … <span data-progress="{id}">   (hairline; `--progress` 0..1)
 *       <ul role="group" id="{group id}" hidden?> …
 *
 * - Keyboard (APG): roving tabindex; ↑/↓/Home/End move; → expands or enters;
 *   ← collapses or goes to the parent; Enter follows the link (native);
 *   Space follows it too; printable keys type-ahead.
 * - The caret expands/collapses without navigating.
 * - The tree persists across ClientRouter navigations (transition:persist),
 *   so aria-current, the active branch, and tabindex are re-synced on every
 *   page load, and the current item is scrolled into view inside the tree
 *   panel only (never the page).
 * - Persisted expansion (STORAGE_KEYS.treeExpanded) and stored-progress
 *   hairlines need zod-validated storage reads, so they are applied by the
 *   lazily loaded tree-state.ts; toggles made before it loads are queued.
 */
import { ATTR } from './contract.ts';
import { $, $$, isRendered, scrollIntoContainer } from './dom.ts';
import { ACTIONS, closestAction, HOOK } from './hooks.ts';
import type { PageContext } from './page.ts';
import { keyToMove, moveIndex, typeaheadIndex } from './tree-model.ts';

const TYPEAHEAD_RESET_MS = 600;

/** What tree-state.ts needs to apply persisted state to the same tree. */
export interface TreeApi {
  readonly items: readonly HTMLElement[];
  readonly byId: ReadonlyMap<string, HTMLElement>;
  /** Ancestors of the current node (they always stay expanded). */
  readonly ancestors: readonly string[];
  readonly current: HTMLElement | null;
  idOf(item: Element): string | null;
  isExpandable(item: HTMLElement): boolean;
  setExpanded(item: HTMLElement, open: boolean): void;
}

const apis = new WeakMap<PageContext, TreeApi>();
const pending = new WeakMap<PageContext, Map<string, boolean>>();

export function treeApi(ctx: PageContext): TreeApi | null {
  return apis.get(ctx) ?? null;
}

/** Expand/collapse choices made before the persistence chunk loaded (in order, last wins). */
export function drainTreeToggles(ctx: PageContext): ReadonlyMap<string, boolean> {
  const queued = pending.get(ctx) ?? new Map<string, boolean>();
  pending.delete(ctx);
  return queued;
}

export function initTree(ctx: PageContext): void {
  const { doc, ctl, nodeId } = ctx;
  const tree = $('[role="tree"]', doc);
  if (tree === null) return;
  const items = $$('[role="treeitem"]', tree);
  const firstItem = items[0];
  if (firstItem === undefined) return;

  const idOf = (item: Element): string | null => item.getAttribute(ATTR.treeNode) ?? item.closest(`[${ATTR.treeNode}]`)?.getAttribute(ATTR.treeNode) ?? null;
  const byId = new Map<string, HTMLElement>();
  for (const item of items) {
    const id = idOf(item);
    if (id !== null) byId.set(id, item);
  }

  const groupOf = (item: HTMLElement): HTMLElement | null => {
    const owns = item.getAttribute('aria-owns');
    if (owns !== null && owns !== '') return doc.getElementById(owns.split(/\s+/u)[0] ?? '');
    const li = item.closest('li');
    return li === null ? null : $(':scope > [role="group"]', li);
  };
  const parentItem = (item: HTMLElement): HTMLElement | null => {
    const group = item.parentElement?.closest<HTMLElement>('[role="group"]') ?? null;
    if (group === null || !tree.contains(group)) return null;
    if (group.id !== '') {
      const owner = $(`[aria-owns~="${CSS.escape(group.id)}"]`, tree);
      if (owner !== null) return owner;
    }
    const li = group.closest('li');
    return li === null ? null : $(':scope [role="treeitem"]', li);
  };
  const isExpandable = (item: HTMLElement): boolean => item.hasAttribute('aria-expanded');
  const isExpanded = (item: HTMLElement): boolean => item.getAttribute('aria-expanded') === 'true';
  const setExpanded = (item: HTMLElement, open: boolean): void => {
    if (!isExpandable(item)) return;
    item.setAttribute('aria-expanded', open ? 'true' : 'false');
    const group = groupOf(item);
    if (group !== null) group.hidden = !open;
  };

  // ── current node: aria-current, active branch, roving tabindex ────────────
  const current = nodeId === null ? null : (byId.get(nodeId) ?? null);
  const ancestors: string[] = [];
  for (let cursor = current === null ? null : parentItem(current); cursor !== null; cursor = parentItem(cursor)) {
    const id = idOf(cursor);
    if (id !== null) ancestors.push(id);
    setExpanded(cursor, true);
  }
  for (const item of items) {
    if (item === current) item.setAttribute('aria-current', 'page');
    else if (item.getAttribute('aria-current') === 'page') item.removeAttribute('aria-current');
  }
  let rover: HTMLElement = current ?? items.find((item) => item.getAttribute('tabindex') === '0') ?? firstItem;
  const setRover = (item: HTMLElement): void => {
    if (item === rover) return;
    rover.setAttribute('tabindex', '-1');
    item.setAttribute('tabindex', '0');
    rover = item;
  };
  for (const item of items) item.setAttribute('tabindex', item === rover ? '0' : '-1');
  // Links and buttons inside a treeitem stay clickable but out of the tab sequence (one tab stop per tree).
  for (const control of $$('[role="treeitem"] a[href], [role="treeitem"] button', tree)) control.setAttribute('tabindex', '-1');

  if (current !== null) {
    ctl.frame(() => {
      if (isRendered(current)) scrollIntoContainer(current, tree.closest('nav, aside') ?? tree);
    });
  }

  apis.set(ctx, { items, byId, ancestors, current, idOf, isExpandable, setExpanded });

  const toggle = (item: HTMLElement, open: boolean): void => {
    setExpanded(item, open);
    const id = idOf(item);
    if (id === null) return;
    const persist = ctx.actions.persistTreeToggle;
    if (persist !== undefined) {
      persist(id, open);
      return;
    }
    const queue = pending.get(ctx) ?? new Map<string, boolean>();
    queue.delete(id);
    queue.set(id, open);
    pending.set(ctx, queue);
  };

  // ── interaction ───────────────────────────────────────────────────────────
  const visibleItems = (): HTMLElement[] => items.filter(isRendered);
  const focusItem = (item: HTMLElement | undefined): void => {
    if (item === undefined) return;
    setRover(item);
    item.focus();
  };

  let buffer = '';
  let cancelReset: (() => void) | null = null;
  const labelOf = (item: HTMLElement): string => ($(`[${HOOK.treeLabel}]`, item) ?? $('.sh-tree-label', item) ?? item).textContent.trim();

  tree.addEventListener(
    'keydown',
    (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const item = event.target instanceof Element ? event.target.closest<HTMLElement>('[role="treeitem"]') : null;
      if (item === null || !tree.contains(item)) return;
      const move = keyToMove(event.key);
      if (move !== null) {
        const visible = visibleItems();
        event.preventDefault();
        focusItem(visible[moveIndex(move, visible.indexOf(item), visible.length)]);
        return;
      }
      switch (event.key) {
        case 'ArrowRight': {
          event.preventDefault();
          if (!isExpandable(item)) return;
          if (!isExpanded(item)) toggle(item, true);
          else focusItem(groupOf(item)?.querySelector<HTMLElement>('[role="treeitem"]') ?? undefined);
          return;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          if (isExpandable(item) && isExpanded(item)) toggle(item, false);
          else focusItem(parentItem(item) ?? undefined);
          return;
        }
        case ' ': {
          event.preventDefault();
          item.click();
          return;
        }
        default:
          break;
      }
      if (event.key.length === 1 && /\S/u.test(event.key)) {
        event.preventDefault();
        buffer += event.key;
        cancelReset?.();
        cancelReset = ctl.timeout(() => {
          buffer = '';
        }, TYPEAHEAD_RESET_MS);
        const visible = visibleItems();
        const index = typeaheadIndex(visible.map(labelOf), visible.indexOf(item), buffer);
        if (index >= 0) focusItem(visible[index]);
      }
    },
    { signal: ctl.signal },
  );

  tree.addEventListener(
    'focusin',
    (event) => {
      const item = event.target instanceof Element ? event.target.closest<HTMLElement>('[role="treeitem"]') : null;
      if (item !== null) setRover(item);
    },
    { signal: ctl.signal },
  );

  tree.addEventListener(
    'click',
    (event) => {
      const caret = closestAction(event.target, ACTIONS.treeToggle);
      if (caret === null) return;
      event.preventDefault();
      event.stopPropagation();
      const target = caret.getAttribute(HOOK.treeTarget);
      const item = (target === null ? null : byId.get(target)) ?? caret.parentElement?.querySelector<HTMLElement>('[role="treeitem"]') ?? null;
      if (item === null) return;
      toggle(item, !isExpanded(item));
      // The caret is pointer-only; keep focus coherent with the roving tabindex.
      if (doc.activeElement === caret) {
        setRover(item);
        item.focus({ preventScroll: true });
      }
    },
    { signal: ctl.signal },
  );
}
