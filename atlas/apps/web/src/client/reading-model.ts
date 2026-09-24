/**
 * Reading state (UI_UX §62–63): per-node progress, recent concepts, and
 * bookmarks that keep their surrounding context. Pure transforms over the
 * stored shapes from @atlas/core; every result satisfies its schema's limits
 * (lengths, list sizes), so a write can never produce a value that a later
 * read would discard. Time is injected. Unit-tested.
 */
import type { StoredBookmarks, StoredProgress, StoredRecent } from '@atlas/core';

export const MAX_RECENT = 30;
export const MAX_BOOKMARKS = 500;
/** Progress records kept (least recently updated dropped first). */
export const MAX_PROGRESS_ENTRIES = 600;

export type Bookmark = StoredBookmarks[number];
export type RecentEntry = StoredRecent[number];

export function clip(text: string, max: number): string {
  const squashed = text.replace(/\s+/gu, ' ').trim();
  return squashed.length <= max ? squashed : `${squashed.slice(0, max - 1).trimEnd()}…`;
}

/** Records the furthest point reached (never moves backwards) and the last region read. */
export function recordProgress(state: StoredProgress, nodeId: string, fraction: number, anchor: string | null, now: string): StoredProgress {
  const previous = state[nodeId];
  const max = Math.max(previous?.max ?? 0, Math.min(1, Math.max(0, fraction)));
  const entry = { max, anchor: clip(anchor ?? previous?.anchor ?? '', 120), at: clip(now, 40) };
  if (previous?.max === entry.max && previous.anchor === entry.anchor) return state;
  const next: StoredProgress = { ...state, [nodeId]: entry };
  const keys = Object.keys(next);
  if (keys.length <= MAX_PROGRESS_ENTRIES) return next;
  const oldest = keys
    .filter((key) => key !== nodeId)
    .sort((a, b) => (next[a]?.at ?? '').localeCompare(next[b]?.at ?? ''))
    .slice(0, keys.length - MAX_PROGRESS_ENTRIES);
  for (const key of oldest) Reflect.deleteProperty(next, key);
  return next;
}

/** Moves the node to the front of the recent list (deduplicated, capped). */
export function pushRecent(list: StoredRecent, entry: RecentEntry): StoredRecent {
  const clean: RecentEntry = { nodeId: entry.nodeId, url: clip(entry.url, 400), title: clip(entry.title, 200) };
  return [clean, ...list.filter((item) => item.nodeId !== entry.nodeId)].slice(0, MAX_RECENT);
}

export function bookmarkKey(bookmark: Pick<Bookmark, 'nodeId' | 'anchor'>): string {
  return `${bookmark.nodeId}#${bookmark.anchor ?? ''}`;
}

export function isBookmarked(list: StoredBookmarks, nodeId: string, anchor: string | null): boolean {
  const key = bookmarkKey({ nodeId, anchor });
  return list.some((item) => bookmarkKey(item) === key);
}

/** Adds the bookmark (newest first) or removes it when already saved. */
export function toggleBookmark(list: StoredBookmarks, bookmark: Bookmark): { readonly list: StoredBookmarks; readonly added: boolean } {
  const key = bookmarkKey(bookmark);
  if (list.some((item) => bookmarkKey(item) === key)) {
    return { list: list.filter((item) => bookmarkKey(item) !== key), added: false };
  }
  const clean: Bookmark = {
    kind: bookmark.kind,
    nodeId: bookmark.nodeId,
    anchor: bookmark.anchor === null ? null : clip(bookmark.anchor, 120),
    title: clip(bookmark.title, 200),
    context: clip(bookmark.context, 400),
    url: clip(bookmark.url, 400),
    at: clip(bookmark.at, 40),
  };
  return { list: [clean, ...list].slice(0, MAX_BOOKMARKS), added: true };
}
