/**
 * Typed custom events. The core DOM contract names three document-level events
 * (`EVENTS` in @atlas/core); the client adds a few internal ones. The global
 * `DocumentEventMap` augmentation makes `document.addEventListener(EVENTS.x, …)`
 * receive a correctly typed `CustomEvent<Detail>` everywhere in the app.
 */
import type { ActiveRegionDetail, DepthDetail, InspectTarget, NodeId } from '@atlas/core';
import { type EVENTS } from './contract.ts';

/** Client-internal events (not part of the frozen core contract). */
export const CLIENT_EVENTS = {
  /** Document reading progress changed (throttled to ≥ 0.2 % steps). */
  progress: 'atlas:progress',
  /** The stored bookmark list changed. */
  bookmarks: 'atlas:bookmarks',
  /** Theme preference or effective theme changed. */
  theme: 'atlas:theme',
  /** The rail inspector was closed (by Esc, the close button, or a region change on mobile). */
  inspectorClosed: 'atlas:inspector-closed',
} as const;

export type ThemePreference = 'light' | 'dark' | 'system';
export type EffectiveTheme = 'light' | 'dark';

export interface ProgressDetail {
  readonly nodeId: NodeId;
  /** Fraction of the document read, 0..1. */
  readonly progress: number;
  /** Active region anchor, or null before the first region crosses the reading line. */
  readonly anchor: string | null;
}

export interface ThemeDetail {
  readonly preference: ThemePreference;
  readonly effective: EffectiveTheme;
}

export interface AtlasEventDetails {
  [EVENTS.activeRegion]: ActiveRegionDetail;
  [EVENTS.depth]: DepthDetail;
  [EVENTS.inspect]: InspectTarget;
  [CLIENT_EVENTS.progress]: ProgressDetail;
  [CLIENT_EVENTS.bookmarks]: null;
  [CLIENT_EVENTS.theme]: ThemeDetail;
  [CLIENT_EVENTS.inspectorClosed]: null;
}

declare global {
  interface DocumentEventMap {
    [EVENTS.activeRegion]: CustomEvent<ActiveRegionDetail>;
    [EVENTS.depth]: CustomEvent<DepthDetail>;
    [EVENTS.inspect]: CustomEvent<InspectTarget>;
    [CLIENT_EVENTS.progress]: CustomEvent<ProgressDetail>;
    [CLIENT_EVENTS.bookmarks]: CustomEvent<null>;
    [CLIENT_EVENTS.theme]: CustomEvent<ThemeDetail>;
    [CLIENT_EVENTS.inspectorClosed]: CustomEvent<null>;
  }
}

/** Dispatches a typed atlas event on `document`. */
export function emit<K extends keyof AtlasEventDetails>(doc: Document, type: K, detail: AtlasEventDetails[K]): void {
  doc.dispatchEvent(new CustomEvent(type, { detail }));
}
