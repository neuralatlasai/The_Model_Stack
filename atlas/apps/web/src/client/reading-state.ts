/**
 * Local reading state (UI_UX §62–63): chapter progress, recent concepts, and
 * bookmarks with context. Everything goes through the Store (zod-parsed
 * reads, never-throwing writes, in-memory fallback), so blocked or corrupt
 * storage degrades to a session-only state without errors.
 *
 * Bookmark control: `[data-action="bookmark"]` (typically in the rail header)
 * saves the active region by default; `data-bookmark-kind` and
 * `data-bookmark-anchor` save a specific equation, figure, or open question.
 * Its `aria-pressed` follows the active region. The click itself is caught
 * by the eager chunk (main.ts), which loads this chunk if needed and calls
 * `actions.toggleBookmark`, so an early click is never lost.
 *
 * Lazy-chunk module (zod via @atlas/core).
 */
import {
  EVENTS,
  STORAGE_KEYS,
  StoredBookmarksSchema,
  StoredProgressSchema,
  StoredRecentSchema,
  type StoredBookmarks,
  type StoredRecent,
} from '@atlas/core';
import { $$ } from './dom.ts';
import { CLIENT_EVENTS, emit } from './events.ts';
import { ACTIONS, actionSelector, HOOK } from './hooks.ts';
import { debounce } from './lifecycle.ts';
import type { PageContext } from './page.ts';
import { pageData } from './page-data.ts';
import { clip, isBookmarked, pushRecent, recordProgress, toggleBookmark, type Bookmark } from './reading-model.ts';
import type { Store } from './storage.ts';

const PROGRESS_WRITE_MS = 1500;
const BookmarkKindSchema = StoredBookmarksSchema.element.shape.kind;

export function readBookmarks(store: Store): StoredBookmarks {
  return store.read(STORAGE_KEYS.bookmarks, StoredBookmarksSchema, []);
}

export function readRecent(store: Store): StoredRecent {
  return store.read(STORAGE_KEYS.recent, StoredRecentSchema, []);
}

export function initReadingState(ctx: PageContext): void {
  const { doc, ctl, store, nodeId } = ctx;
  if (nodeId === null) return;
  const data = pageData(doc);
  const title = data?.title ?? doc.title;

  store.write(STORAGE_KEYS.recent, pushRecent(readRecent(store), { nodeId, url: location.pathname, title }));

  // ── progress ─────────────────────────────────────────────────────────────
  // Start from the position scroll-sync reached before this chunk loaded.
  let pending: { readonly progress: number; readonly anchor: string | null } | null =
    ctx.state.progress > 0 ? { progress: ctx.state.progress, anchor: ctx.state.activeAnchor } : null;
  const writer = debounce(
    ctl,
    () => {
      if (pending === null) return;
      const current = store.read(STORAGE_KEYS.progress, StoredProgressSchema, {});
      const next = recordProgress(current, nodeId, pending.progress, pending.anchor, new Date().toISOString());
      pending = null;
      if (next !== current) store.write(STORAGE_KEYS.progress, next);
    },
    PROGRESS_WRITE_MS,
  );
  doc.addEventListener(
    CLIENT_EVENTS.progress,
    (event) => {
      pending = { progress: event.detail.progress, anchor: event.detail.anchor };
      writer.call();
    },
    { signal: ctl.signal },
  );
  const flush = (): void => {
    writer.flush();
  };
  window.addEventListener('pagehide', flush, { signal: ctl.signal });
  doc.addEventListener(
    'visibilitychange',
    () => {
      if (doc.visibilityState === 'hidden') flush();
    },
    { signal: ctl.signal },
  );
  ctl.defer(flush);

  // ── bookmarks ────────────────────────────────────────────────────────────
  const controls = (): HTMLElement[] => $$(actionSelector(ACTIONS.bookmark), doc);
  const anchorFor = (control: Element): string | null => control.getAttribute(HOOK.bookmarkAnchor) ?? ctx.state.activeAnchor;

  const paint = (): void => {
    const list = readBookmarks(store);
    for (const control of controls()) {
      const saved = isBookmarked(list, nodeId, anchorFor(control));
      control.setAttribute('aria-pressed', saved ? 'true' : 'false');
    }
  };

  const toggle = (control: Element | null): void => {
    const anchor = control === null ? ctx.state.activeAnchor : anchorFor(control);
    const kindParse = BookmarkKindSchema.safeParse(control?.getAttribute(HOOK.bookmarkKind) ?? (anchor === null ? 'node' : 'region'));
    const kind: Bookmark['kind'] = kindParse.success ? kindParse.data : 'region';
    const regionTitle = anchor === null ? null : (data?.regions.find((region) => region.anchor === anchor)?.title ?? null);
    const target = anchor === null ? null : doc.getElementById(anchor);
    const bookmark: Bookmark = {
      kind,
      nodeId,
      anchor,
      title: regionTitle === null ? title : `${title} — ${regionTitle}`,
      context: excerpt(target ?? ctx.article),
      url: `${location.pathname}${anchor === null ? '' : `#${encodeURIComponent(anchor)}`}`,
      at: new Date().toISOString(),
    };
    const { list, added } = toggleBookmark(readBookmarks(store), bookmark);
    store.write(STORAGE_KEYS.bookmarks, list);
    paint();
    emit(doc, CLIENT_EVENTS.bookmarks, null);
    ctx.announce(added ? `Bookmarked: ${bookmark.title}` : `Bookmark removed: ${bookmark.title}`);
  };
  ctx.actions.toggleBookmark = toggle;
  doc.addEventListener(EVENTS.activeRegion, paint, { signal: ctl.signal });
  // Another tab may have changed the lists.
  window.addEventListener(
    'storage',
    (event) => {
      if (event.key === STORAGE_KEYS.bookmarks) paint();
    },
    { signal: ctl.signal },
  );
  paint();
}

/** First sentences of the saved object's surroundings, so a bookmark is not detached from its concept. */
function excerpt(element: Element | null): string {
  if (element === null) return '';
  const paragraph = element.matches('p') ? element : (element.querySelector('p') ?? element);
  return clip(paragraph.textContent, 400);
}
