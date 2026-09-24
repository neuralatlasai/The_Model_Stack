/**
 * Per-page context shared by the controllers: the page's identity, the store,
 * the announcer, and a small registry of actions that other modules (the
 * lazily loaded chunks and the palette) can invoke. The validated data island
 * is read on demand by the lazy chunks (page-data.ts), never here: this
 * module is part of the zod-free eager chunk.
 *
 * State ownership: `state.activeAnchor/activeRole/progress` are written only
 * by scroll-sync; `state.depth` only by depth.ts. Everyone else reads.
 */
import type { Depth, InspectTarget, NodeId, RegionRole } from '@atlas/core';
import { ATTR, DEFAULT_DEPTH, parseNodeId } from './contract.ts';
import type { ThemePreference } from './events.ts';
import { h, SR_ONLY_CLASS } from './dom.ts';
import type { Controller } from './lifecycle.ts';
import type { Store } from './storage.ts';

export interface PageState {
  activeAnchor: string | null;
  activeRole: RegionRole | null;
  progress: number;
  depth: Depth;
}

export interface PageActions {
  setDepth?: (depth: Depth) => void;
  setTheme?: (preference: ThemePreference) => void;
  toggleDarkMode?: () => void;
  /** Pins an object in the rail inspector (desktop) or a bottom sheet (mobile); the reader stays anchored. */
  inspect?: (target: InspectTarget, trigger: HTMLElement | null) => void;
  /** Shows prerequisites · siblings · downstream for the current node. */
  showPosition?: () => void;
  /** Toggles the bookmark for a bookmark control (null: the active region). Registered by the reading-state chunk. */
  toggleBookmark?: (control: Element | null) => void;
  /** Persists a reader's expand/collapse in the tree. Registered by the tree-state chunk. */
  persistTreeToggle?: (nodeId: string, open: boolean) => void;
  copyText?: (text: string, confirmation: string) => Promise<boolean>;
  /** Link to an anchor on this page, carrying the current depth. */
  linkTo?: (anchor: string | null) => string;
}

export interface PageContext {
  readonly doc: Document;
  readonly ctl: Controller;
  readonly store: Store;
  /** Site base with leading and trailing slash. */
  readonly base: string;
  /** `<article data-node-id>` of a reading page, else null (index pages). */
  readonly article: HTMLElement | null;
  readonly nodeId: NodeId | null;
  readonly announce: (message: string) => void;
  readonly state: PageState;
  readonly actions: PageActions;
}

export function createPageContext(doc: Document, ctl: Controller, store: Store, base: string): PageContext {
  const article = doc.querySelector<HTMLElement>(`[${ATTR.nodeId}]`);
  const nodeId = parseNodeId(article?.getAttribute(ATTR.nodeId));
  return {
    doc,
    ctl,
    store,
    base,
    article,
    nodeId,
    announce: createAnnouncer(doc, ctl),
    state: { activeAnchor: null, activeRole: null, progress: 0, depth: DEFAULT_DEPTH },
    actions: {},
  };
}

const LIVE_REGION_ID = 'atlas-live';
/** Minimum spacing between announcements; the latest pending message wins. */
const ANNOUNCE_GAP_MS = 1200;

/**
 * One polite live region per page, rate-limited so scroll-driven region
 * changes never flood a screen reader.
 */
function createAnnouncer(doc: Document, ctl: Controller): (message: string) => void {
  let region = doc.getElementById(LIVE_REGION_ID);
  let last = Number.NEGATIVE_INFINITY;
  let pending: string | null = null;
  let cancel: (() => void) | null = null;

  const ensureRegion = (): HTMLElement => {
    if (region?.isConnected !== true) {
      region = h('div', { id: LIVE_REGION_ID, class: SR_ONLY_CLASS, role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
      doc.body.append(region);
    }
    return region;
  };

  const flush = (): void => {
    cancel = null;
    const message = pending;
    if (message === null) return;
    pending = null;
    last = Date.now();
    const target = ensureRegion();
    // Clear first so an identical consecutive message is announced again.
    target.textContent = '';
    ctl.frame(() => {
      target.textContent = message;
    });
  };

  return (message: string): void => {
    if (ctl.disposed || message.trim() === '') return;
    pending = message;
    cancel?.();
    const wait = last + ANNOUNCE_GAP_MS - Date.now();
    if (wait <= 0) flush();
    else cancel = ctl.timeout(flush, wait);
  };
}
