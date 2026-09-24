/**
 * Live rail instruments (VISUAL_GRAMMAR §6.1): figures with `states` stay in
 * the rail across their regions and change state as the reader scrolls — the
 * atlas's version of the ai-2027 dashboard that moves with the story.
 *
 * On every active-region change, for each `[data-live-figure]`:
 * - visible only while the active region is one of its `data-live-anchors`;
 * - applies the state bound to that region: lights `highlight` parts
 *   (`[data-vg-key]` get `is-lit`, the figure root gets `has-lit`), writes the
 *   state label and note, and sends `variables` to the figure:
 *     · calculators receive an `atlas:figure-state` event (islands/Calculator.tsx
 *       sets its inputs, outputs recompute);
 *     · formula-driven kinds (stat-panel, memory-stack) recompute through the
 *       optional value hook, tweening numbers and `--vg-frac` widths.
 *
 * The spec comes from a `<script type="application/json" data-live-spec>` next
 * to the figure and is parsed with the core schema (the DOM is a trust
 * boundary). Motion is skipped under prefers-reduced-motion.
 */
import { FigureSpecSchema, formatValue, type FigureSpec, type FigureState, type ValueFormat } from '@atlas/core';
import { EVENTS } from './contract.ts';
import type { PageContext } from './page.ts';

export const FIGURE_STATE_EVENT = 'atlas:figure-state';

export interface FigureStateDetail {
  readonly figureId: string;
  readonly variables: Readonly<Record<string, number>>;
}

/** Recomputed values for formula-driven kinds: key → value, format, and optional width fraction. */
export type ValueHook = (
  spec: FigureSpec,
  overrides: Readonly<Record<string, number>> | null,
) => { readonly values: Readonly<Record<string, { readonly value: number; readonly text: string; readonly format: ValueFormat; readonly frac?: number }>> };

interface Live {
  readonly host: HTMLElement;
  readonly root: HTMLElement;
  readonly spec: FigureSpec;
  readonly anchors: ReadonlySet<string>;
  current: string | null;
}

const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

function parseSpec(host: HTMLElement): FigureSpec | null {
  const script = host.querySelector('script[data-live-spec]');
  if (script === null) return null;
  try {
    const parsed = FigureSpecSchema.safeParse(JSON.parse(script.textContent));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Tween a formatted number from its current raw value to `to` over ~260 ms. */
function tweenNumber(element: HTMLElement, to: number, format: ValueFormat, text: string): void {
  const fromRaw = Number(element.dataset['vgRaw'] ?? Number.NaN);
  element.dataset['vgRaw'] = String(to);
  if (!Number.isFinite(fromRaw) || reducedMotion() || fromRaw === to) {
    element.textContent = text;
    return;
  }
  const start = performance.now();
  const duration = 260;
  const step = (now: number): void => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    // Interpolate in log space for positive magnitudes spanning orders of magnitude.
    const value = fromRaw > 0 && to > 0 ? Math.exp(Math.log(fromRaw) + (Math.log(to) - Math.log(fromRaw)) * eased) : fromRaw + (to - fromRaw) * eased;
    element.textContent = t < 1 ? formatValue(value, format) : text;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function applyState(live: Live, state: FigureState | undefined, valueHook: ValueHook | null): void {
  const { root, spec } = live;
  const highlight = new Set(state?.highlight ?? []);
  root.classList.toggle('has-lit', highlight.size > 0);
  for (const part of root.querySelectorAll<HTMLElement | SVGElement>('[data-vg-key]')) {
    part.classList.toggle('is-lit', highlight.has(part.getAttribute('data-vg-key') ?? ''));
  }
  const label = root.querySelector('[data-vg-state-label]');
  if (label !== null) label.textContent = state?.label ?? '';
  const note = root.querySelector('[data-vg-state-note]');
  if (note !== null) note.textContent = state?.note ?? '';

  const variables = state?.variables ?? null;
  if (spec.kind === 'calculator') {
    if (variables !== null) {
      const detail: FigureStateDetail = { figureId: spec.id, variables };
      root.dispatchEvent(new CustomEvent<FigureStateDetail>(FIGURE_STATE_EVENT, { detail, bubbles: true }));
    }
    return;
  }
  if (valueHook === null) return;
  const { values } = valueHook(spec, variables);
  for (const [key, entry] of Object.entries(values)) {
    const valueElement = root.querySelector<HTMLElement>(`[data-vg-value="${CSS.escape(key)}"]`);
    if (valueElement !== null) tweenNumber(valueElement, entry.value, entry.format, entry.text);
    if (entry.frac !== undefined) {
      const part = root.querySelector<HTMLElement>(`[data-vg-key="${CSS.escape(key)}"]`);
      part?.style.setProperty('--vg-frac', String(entry.frac));
    }
  }
}

export function initLiveInstruments(ctx: PageContext, valueHook: ValueHook | null = null): void {
  const { doc, ctl } = ctx;
  const hosts = [...doc.querySelectorAll<HTMLElement>('[data-live-figure]')];
  if (hosts.length === 0) return;

  const lives: Live[] = [];
  for (const host of hosts) {
    const spec = parseSpec(host);
    const root = host.querySelector<HTMLElement>('[data-figure]') ?? host;
    if (spec === null) continue;
    lives.push({ host, root, spec, anchors: new Set((host.dataset['liveAnchors'] ?? '').split(/\s+/u).filter(Boolean)), current: null });
  }

  const onRegion = (anchor: string): void => {
    for (const live of lives) {
      const inside = live.anchors.has(anchor);
      live.host.hidden = !inside;
      if (!inside || live.current === anchor) continue;
      live.current = anchor;
      const state = live.spec.states.find((candidate) => candidate.anchor === anchor) ?? live.spec.states[0];
      applyState(live, state, valueHook);
    }
  };

  // Before the first region crosses the reading line, show instruments bound to the first region only.
  const firstRegion = doc.querySelector<HTMLElement>('[data-region]')?.dataset['region'];
  if (firstRegion !== undefined) onRegion(firstRegion);

  doc.addEventListener(EVENTS.activeRegion, (event) => { onRegion(event.detail.anchor); }, { signal: ctl.signal });
}
