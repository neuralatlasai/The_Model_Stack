/**
 * Persisted knowledge-tree state (lazy chunk; zod via @atlas/core):
 *
 * - Expanded branches the reader chose (STORAGE_KEYS.treeExpanded) are
 *   restored; the current node's ancestors always stay expanded; branches that
 *   were only auto-expanded for an earlier page collapse again ("unrelated
 *   branches collapse softly", UI_UX §5). Toggles made before this chunk
 *   loaded are merged, then every later toggle is persisted directly.
 * - Stored reading progress is painted as hairlines on every other node; the
 *   current node's hairline is owned by scroll-sync (live position).
 */
import { STORAGE_KEYS, StoredProgressSchema, StoredTreeExpandedSchema } from '@atlas/core';
import type { PageContext } from './page.ts';
import { setProgress } from './scroll-sync.ts';
import { drainTreeToggles, treeApi } from './tree.ts';
import { expandedSet, updateExpanded } from './tree-model.ts';

export function initTreeState(ctx: PageContext): void {
  const api = treeApi(ctx);
  if (api === null) return;
  const { store } = ctx;

  let userExpanded = store.read(STORAGE_KEYS.treeExpanded, StoredTreeExpandedSchema, []);
  const queued = drainTreeToggles(ctx);
  for (const [id, open] of queued) userExpanded = updateExpanded(userExpanded, id, open);
  if (queued.size > 0) store.write(STORAGE_KEYS.treeExpanded, userExpanded);

  const open = expandedSet(userExpanded, api.ancestors);
  for (const item of api.items) {
    const id = api.idOf(item);
    if (id !== null && api.isExpandable(item)) api.setExpanded(item, open.has(id));
  }

  ctx.actions.persistTreeToggle = (id: string, expand: boolean): void => {
    userExpanded = updateExpanded(userExpanded, id, expand);
    store.write(STORAGE_KEYS.treeExpanded, userExpanded);
  };

  const progress = store.read(STORAGE_KEYS.progress, StoredProgressSchema, {});
  for (const [id, entry] of Object.entries(progress)) {
    const item = api.byId.get(id);
    if (item !== undefined && item !== api.current) setProgress(item, entry.max.toFixed(3));
  }
}
