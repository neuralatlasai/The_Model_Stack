/**
 * Context-rail state machine (UI_UX §10, §88 "context-rail state machine").
 *
 *   idle ──region(a)──▶ region(a) ──region(b)──▶ region(b)
 *    │                    │
 *    └──inspect(t)──▶ inspecting(t, anchor) ◀──inspect(t')── (replaces the pinned object)
 *                         │  region(b): stays inspecting; the instruments beneath follow b
 *                         └──close──▶ region(anchor) | idle
 *
 * A pinned inspector sits above the instruments and survives region changes:
 * the reader keeps the paper or equation they asked about while reading on.
 * Pure; unit-tested.
 */
import type { InspectTarget } from '@atlas/core';

export type RailState =
  | { readonly mode: 'idle' }
  | { readonly mode: 'region'; readonly anchor: string }
  | { readonly mode: 'inspecting'; readonly anchor: string | null; readonly target: InspectTarget };

export type RailEvent =
  | { readonly type: 'region'; readonly anchor: string }
  | { readonly type: 'inspect'; readonly target: InspectTarget }
  | { readonly type: 'close' };

export const INITIAL_RAIL_STATE: RailState = { mode: 'idle' };

export function railAnchor(state: RailState): string | null {
  return state.mode === 'idle' ? null : state.anchor;
}

export function railReducer(state: RailState, event: RailEvent): RailState {
  switch (event.type) {
    case 'region':
      if (state.mode === 'inspecting') {
        return state.anchor === event.anchor ? state : { ...state, anchor: event.anchor };
      }
      return state.mode === 'region' && state.anchor === event.anchor ? state : { mode: 'region', anchor: event.anchor };
    case 'inspect':
      if (state.mode === 'inspecting' && sameTarget(state.target, event.target)) return state;
      return { mode: 'inspecting', anchor: railAnchor(state), target: event.target };
    case 'close':
      if (state.mode !== 'inspecting') return state;
      return state.anchor === null ? INITIAL_RAIL_STATE : { mode: 'region', anchor: state.anchor };
  }
}

export function sameTarget(a: InspectTarget, b: InspectTarget): boolean {
  switch (a.type) {
    case 'paper':
      return b.type === 'paper' && a.key === b.key;
    case 'term':
      return b.type === 'term' && a.slug === b.slug;
    case 'equation':
      return b.type === 'equation' && a.number === b.number;
    case 'node':
      return b.type === 'node' && a.id === b.id;
  }
}

/** Stable string form, used as a data attribute and for bookmarks. */
export function targetKey(target: InspectTarget): string {
  switch (target.type) {
    case 'paper':
      return `paper:${target.key}`;
    case 'term':
      return `term:${target.slug}`;
    case 'equation':
      return `equation:${target.number}`;
    case 'node':
      return `node:${target.id}`;
  }
}
