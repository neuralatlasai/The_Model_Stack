/**
 * Context rail (UI_UX §10): the instrument panel follows the region being
 * read. Server markup renders every region's instruments as
 * `<div data-rail-for="{anchor}">` groups; this controller shows exactly one
 * (others get the `hidden` attribute), fades the incoming group in with an
 * opacity-only transition ≤ 190 ms (none under reduced motion), and keeps a
 * pinned inspector (`[data-rail-inspector]`) above the instruments while the
 * reader moves on. Esc or the close button unpins it and returns focus to
 * the citation that opened it. Below the desktop breakpoint the rail is a
 * popover sheet (opened for the inspector) or, failing that, the inspector
 * opens in a client-built bottom sheet.
 *
 * Inspector content needs the zod-validated page data, so its builder is a
 * lazily imported chunk; the state machine and group switching are eager.
 */
import type { InspectTarget } from '@atlas/core';
import { ATTR, EVENTS } from './contract.ts';
import { $, $$, focusElement, h, isRendered, prefersReducedMotion, replaceChildren, scrollIntoContainer } from './dom.ts';
import { CLIENT_EVENTS, emit } from './events.ts';
import { ACTIONS, actionSelector, HOOK } from './hooks.ts';
import type * as InspectorViewModule from './inspector-view.ts';
import type { PageContext } from './page.ts';
import { INITIAL_RAIL_STATE, railAnchor, railReducer, sameTarget, targetKey, type RailEvent, type RailState } from './rail-machine.ts';
import { openSheet, showPanel } from './sheets.ts';

const PANEL_MS = 190;

type ViewModule = typeof InspectorViewModule;
let viewModule: Promise<ViewModule> | null = null;

/** The inspector content builder (lazy; shared with citation previews). */
export function loadInspectorView(): Promise<ViewModule> {
  viewModule ??= import('./inspector-view.ts').catch((error: unknown) => {
    viewModule = null;
    throw error instanceof Error ? error : new Error('inspector failed to load');
  });
  return viewModule;
}

export function initRail(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const groups = $$(`[${ATTR.railFor}]`, doc);
  const root = $(`[${HOOK.rail}]`, doc) ?? groups[0]?.parentElement ?? null;
  const current = $(`[${HOOK.railCurrent}]`, doc);

  let state: RailState = INITIAL_RAIL_STATE;
  let shownGroup: string | null = null;
  let inspector: HTMLElement | null = null;
  let returnFocus: HTMLElement | null = null;

  const railVisible = (): boolean => root !== null && isRendered(root);

  /** The region's own heading text (the server renders it; no page data needed). */
  const regionTitle = (anchor: string | null): string => {
    if (anchor === null) return '';
    const section = doc.querySelector(`[${ATTR.region}="${CSS.escape(anchor)}"]`);
    const heading = section?.querySelector('h2')?.textContent.trim() ?? '';
    return heading === '' ? anchor : heading;
  };

  const showGroup = (anchor: string | null): void => {
    if (anchor === shownGroup) return;
    const first = shownGroup === null;
    shownGroup = anchor;
    let shown: HTMLElement | null = null;
    for (const group of groups) {
      const match = group.getAttribute(ATTR.railFor) === anchor;
      group.hidden = !match;
      if (match) shown = group;
    }
    if (current !== null) current.textContent = regionTitle(anchor);
    if (shown !== null && !first) {
      fadeIn(shown);
      if (railVisible()) ctx.announce(`Context: ${regionTitle(anchor)}`);
    }
  };

  const ensureInspector = (): HTMLElement | null => {
    if (inspector?.isConnected === true) return inspector;
    inspector = $(`[${HOOK.railInspector}]`, doc);
    if (inspector === null && root !== null) {
      inspector = h('section', { [HOOK.railInspector]: '', class: 'cx-inspector', hidden: true });
      const firstGroup = groups[0];
      if (firstGroup?.parentElement === root) root.insertBefore(inspector, firstGroup);
      else root.prepend(inspector);
    }
    return inspector;
  };

  const renderInspector = async (target: InspectTarget): Promise<void> => {
    const host = ensureInspector();
    if (host === null) return;
    const { buildInspectorView } = await loadInspectorView();
    // A later request or a close may have superseded this one while the chunk loaded.
    if (ctl.disposed || state.mode !== 'inspecting' || !sameTarget(state.target, target)) return;
    const view = buildInspectorView(ctx, target, 'pinned');
    const titleId = 'atlas-inspector-title';
    const close = h('button', { type: 'button', class: 'cx-inspector__close', [HOOK.action]: ACTIONS.inspectorClose[0] }, 'Close');
    const heading = h('h3', { class: 'cx-insp__title', id: titleId, tabindex: -1 }, view.title);
    replaceChildren(host, h('header', { class: 'cx-inspector__head' }, h('span', { class: 'cx-insp__kind' }, view.kind), close), heading, view.body);
    host.setAttribute('aria-labelledby', titleId);
    host.setAttribute('data-inspect', targetKey(target));
    if (!host.hasAttribute('role')) host.setAttribute('role', 'region');
    host.hidden = false;
    fadeIn(host);
    focusElement(heading);
  };

  const hideInspector = (): void => {
    const host = inspector;
    if (host === null) return;
    host.hidden = true;
    host.removeAttribute('data-inspect');
    replaceChildren(host);
    emit(doc, CLIENT_EVENTS.inspectorClosed, null);
    const back = returnFocus;
    returnFocus = null;
    if (back?.isConnected === true) back.focus({ preventScroll: true });
  };

  const dispatch = (event: RailEvent): void => {
    const previous = state;
    state = railReducer(state, event);
    if (state === previous) return;
    showGroup(railAnchor(state));
    if (state.mode === 'inspecting') {
      if (previous.mode !== 'inspecting' || previous.target !== state.target) {
        renderInspector(state.target).catch(() => {
          ctx.announce('The inspector could not be loaded.');
        });
      }
    } else if (previous.mode === 'inspecting') {
      hideInspector();
    }
  };

  const openInSheet = async (target: InspectTarget, focusOrigin: HTMLElement | null): Promise<void> => {
    const { buildInspectorView } = await loadInspectorView();
    if (ctl.disposed) return;
    const view = buildInspectorView(ctx, target, 'pinned');
    const content = h(
      'div',
      { class: 'cx-inspector cx-inspector--sheet' },
      h('span', { class: 'cx-insp__kind' }, view.kind),
      h('h3', { class: 'cx-insp__title' }, view.title),
      view.body,
    );
    openSheet(ctx, { side: 'bottom', label: view.title, content, borrow: false, returnFocus: focusOrigin });
  };

  const inspect = (target: InspectTarget, trigger: HTMLElement | null): void => {
    const focusOrigin = trigger ?? (doc.activeElement instanceof HTMLElement ? doc.activeElement : null);
    // Below the desktop frame the rail is a closed popover sheet: open it and pin there.
    const sheet = root?.closest<HTMLElement>('[popover]') ?? null;
    if (!railVisible() && sheet !== null) showPanel(sheet);
    if (!railVisible()) {
      openInSheet(target, focusOrigin).catch(() => {
        ctx.announce('The inspector could not be loaded.');
      });
      return;
    }
    returnFocus = focusOrigin;
    dispatch({ type: 'inspect', target });
  };
  ctx.actions.inspect = inspect;

  // "Show prerequisites": the rail's position instrument when it is on screen, else the position view pinned.
  ctx.actions.showPosition = () => {
    const instrument = $$(`[${ATTR.railInstrument}="position"]`, doc).find(isRendered);
    if (instrument !== undefined) {
      scrollIntoContainer(instrument, root);
      focusElement(instrument);
      return;
    }
    if (ctx.nodeId !== null) inspect({ type: 'node', id: ctx.nodeId }, null);
  };

  doc.addEventListener(
    EVENTS.activeRegion,
    (event) => {
      dispatch({ type: 'region', anchor: event.detail.anchor });
    },
    { signal: ctl.signal },
  );
  doc.addEventListener(
    EVENTS.inspect,
    (event) => {
      inspect(event.detail, null);
    },
    { signal: ctl.signal },
  );
  doc.addEventListener(
    'click',
    (event) => {
      if (event.target instanceof Element && event.target.closest(actionSelector(ACTIONS.inspectorClose)) !== null) {
        dispatch({ type: 'close' });
      }
    },
    { signal: ctl.signal },
  );
  doc.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented || state.mode !== 'inspecting') return;
      if (event.target instanceof Element && event.target.closest('dialog') !== null) return;
      event.preventDefault();
      dispatch({ type: 'close' });
    },
    { signal: ctl.signal },
  );

  // Before the first region crosses the reading line, show the first region's instruments.
  const first = groups[0]?.getAttribute(ATTR.railFor);
  if (first !== undefined && first !== null && ctx.state.activeAnchor === null) dispatch({ type: 'region', anchor: first });
}

function fadeIn(element: HTMLElement): void {
  if (prefersReducedMotion() || typeof element.animate !== 'function') return;
  element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: PANEL_MS, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
}
