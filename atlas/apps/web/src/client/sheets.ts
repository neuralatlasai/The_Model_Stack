/**
 * Mobile and tablet sheets (UI_UX §56–57): the knowledge tree becomes a
 * slide-in navigator, the context rail an inspectable bottom sheet, and
 * citation / equation inspectors open in a sheet.
 *
 * Two mechanisms, both accessible dialogs (focus moved in and contained,
 * Esc, scrim click, focus returned to the trigger):
 *
 * 1. Native popover panels (`<nav id="knowledge-tree" popover>`, the rail
 *    `popover`) opened by `popovertarget` invokers. The platform provides
 *    Esc and light dismiss (scrim click) without JavaScript; this module adds
 *    focus placement on open, Tab containment while open, and closes the
 *    panel when one of its links is followed.
 * 2. A client-built modal <dialog> (`openSheet`) for transient content
 *    (inspectors on mobile) and for markup that has no popover panel
 *    (`data-action="open-tree" | "open-context"`). showModal() gives the
 *    focus trap and inert background; borrowed panels are moved in and put
 *    back exactly where they were on close.
 *
 * Motion is CSS-only and disabled under prefers-reduced-motion.
 */
import { ATTR } from './contract.ts';
import { $, $$, h } from './dom.ts';
import { ACTIONS, actionSelector, closestAction, DESKTOP_MIN_WIDTH, HOOK } from './hooks.ts';
import type { PageContext } from './page.ts';

export interface SheetRequest {
  readonly side: 'left' | 'bottom';
  /** Accessible name and visible heading. */
  readonly label: string;
  readonly content: HTMLElement;
  /** True when `content` is an existing panel to borrow and return; false for transient content. */
  readonly borrow: boolean;
  readonly returnFocus: HTMLElement | null;
  readonly trigger?: HTMLElement | null;
}

interface OpenSheet {
  readonly dialog: HTMLDialogElement;
  readonly request: SheetRequest;
  readonly placeholder: Comment | null;
  /** `hidden` may be `true`, `false`, or `"until-found"`; restored exactly. */
  readonly wasHidden: HTMLElement['hidden'];
}

let current: OpenSheet | null = null;

export function openSheet(ctx: PageContext, request: SheetRequest): void {
  closeSheet();
  const { doc, ctl } = ctx;
  const listen = { signal: ctl.signal };
  const dialog = h('dialog', { class: 'cx-sheet', 'data-side': request.side, 'aria-label': request.label });
  const close = h('button', { type: 'button', class: 'cx-sheet__close' }, 'Close');
  const bodyEl = h('div', { class: 'cx-sheet__body' });
  dialog.append(
    h(
      'div',
      { class: 'cx-sheet__frame' },
      h('header', { class: 'cx-sheet__head' }, h('span', { class: 'cx-sheet__title' }, request.label), close),
      bodyEl,
    ),
  );

  let placeholder: Comment | null = null;
  const wasHidden = request.content.hidden;
  if (request.borrow) {
    placeholder = doc.createComment('atlas-sheet-placeholder');
    request.content.replaceWith(placeholder);
    request.content.setAttribute('data-in-sheet', '');
    request.content.hidden = false;
  }
  bodyEl.append(request.content);
  doc.body.append(dialog);
  current = { dialog, request, placeholder, wasHidden };

  close.addEventListener(
    'click',
    () => {
      dialog.close();
    },
    listen,
  );
  // The frame fills the dialog box, so a click whose target is the dialog itself landed on the backdrop.
  dialog.addEventListener(
    'click',
    (event) => {
      if (event.target === dialog) dialog.close();
    },
    listen,
  );
  // Following a link inside the sheet (tree navigation): close after the click has been dispatched,
  // so the router still sees the anchor in the document.
  bodyEl.addEventListener(
    'click',
    (event) => {
      if (event.target instanceof Element && event.target.closest('a[href]') !== null) {
        ctl.timeout(() => {
          if (!event.defaultPrevented && dialog.open) dialog.close();
        }, 0);
      }
    },
    listen,
  );
  // Not bound to the page signal: the close handler must run even when dispose() closes the sheet.
  dialog.addEventListener('close', () => {
    finish(dialog);
  });

  request.trigger?.setAttribute('aria-expanded', 'true');
  dialog.showModal();
  close.focus();
}

/** Closes the open sheet (if any), returning borrowed panels and focus. */
export function closeSheet(): void {
  const sheet = current;
  if (sheet === null) return;
  if (sheet.dialog.open) sheet.dialog.close();
  else finish(sheet.dialog);
}

export function isSheetOpen(): boolean {
  return current?.dialog.open === true;
}

function finish(dialog: HTMLDialogElement): void {
  const sheet = current;
  if (sheet?.dialog !== dialog) return;
  current = null;
  const { request, placeholder, wasHidden } = sheet;
  if (placeholder !== null) {
    request.content.removeAttribute('data-in-sheet');
    request.content.hidden = wasHidden;
    if (placeholder.isConnected) placeholder.replaceWith(request.content);
    else request.content.remove();
  }
  dialog.remove();
  request.trigger?.setAttribute('aria-expanded', 'false');
  if (request.returnFocus?.isConnected === true) request.returnFocus.focus({ preventScroll: true });
}

/** Shows a native popover panel if it is one and currently closed. Returns true when it is open afterwards. */
export function showPanel(panel: HTMLElement): boolean {
  if (!panel.hasAttribute('popover') || typeof panel.showPopover !== 'function') return false;
  if (!panel.matches(':popover-open')) {
    try {
      panel.showPopover();
    } catch {
      return false;
    }
  }
  return true;
}

export function initSheets(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  ctl.defer(closeSheet);

  enhancePopoverPanels(ctx);

  const openers = [...ACTIONS.openTree, ...ACTIONS.openContext];
  for (const trigger of $$(actionSelector(openers), doc)) {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
  }

  doc.addEventListener(
    'click',
    (event) => {
      const trigger = closestAction(event.target, openers);
      if (trigger === null) return;
      const isTree = (ACTIONS.openTree as readonly string[]).includes(trigger.getAttribute(HOOK.action) ?? '');
      const panel = isTree ? treePanel(doc, trigger) : contextPanel(doc, trigger);
      if (panel === null) return; // keep the trigger's native behaviour (e.g. a link to the library)
      event.preventDefault();
      if (showPanel(panel)) return;
      openSheet(ctx, {
        side: isTree ? 'left' : 'bottom',
        label: isTree ? 'Knowledge tree' : 'Context',
        content: panel,
        borrow: true,
        returnFocus: trigger,
        trigger,
      });
    },
    { signal: ctl.signal },
  );

  // Growing into the desktop frame puts borrowed panels back in their columns.
  if (typeof window.matchMedia === 'function') {
    window.matchMedia(`(min-width: ${String(DESKTOP_MIN_WIDTH)}px)`).addEventListener(
      'change',
      (event) => {
        if (event.matches && isSheetOpen()) closeSheet();
      },
      { signal: ctl.signal },
    );
  }
}

/**
 * Focus management for native popover panels opened by `popovertarget`
 * invokers: focus moves into the panel on open (the current tree item, else
 * the first focusable element), Tab wraps inside it, and following a link
 * inside it closes it (the tree persists across navigations, so an open
 * navigator would otherwise stay open over the next page).
 */
function enhancePopoverPanels(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const invokers = $$<HTMLButtonElement>(`${actionSelector(ACTIONS.togglePanel)}, [popovertarget]`, doc);
  const panels = new Set<HTMLElement>();
  for (const invoker of invokers) {
    const id = invoker.getAttribute('popovertarget');
    const panel = id === null ? null : doc.getElementById(id);
    if (panel?.hasAttribute('popover') === true) panels.add(panel);
  }

  for (const panel of panels) {
    // A persisted panel (transition:persist) can arrive open from the previous page.
    if (panel.matches(':popover-open') && !isColumn(panel)) panel.hidePopover();

    panel.addEventListener(
      'toggle',
      (event) => {
        if (!(event instanceof ToggleEvent) || event.newState !== 'open') return;
        ctl.frame(() => {
          const target = focusTarget(panel);
          target?.focus({ preventScroll: true });
        });
      },
      { signal: ctl.signal },
    );
    panel.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Tab' && panel.matches(':popover-open')) containTab(panel, event);
      },
      { signal: ctl.signal },
    );
    panel.addEventListener(
      'click',
      (event) => {
        if (!(event.target instanceof Element) || event.target.closest('a[href]') === null) return;
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
        if (panel.matches(':popover-open') && !isColumn(panel)) {
          ctl.timeout(() => {
            // A handler further up (citation pinning) may have kept the reader on the page.
            if (!event.defaultPrevented && panel.matches(':popover-open')) panel.hidePopover();
          }, 0);
        }
      },
      { signal: ctl.signal },
    );
  }
}

/** A popover restyled as an in-flow column (desktop) is rendered while "closed"; nothing to manage then. */
function isColumn(panel: HTMLElement): boolean {
  return !panel.matches(':popover-open') && panel.getClientRects().length > 0;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(panel: HTMLElement): HTMLElement[] {
  return $$(FOCUSABLE, panel).filter((element) => !element.hasAttribute('inert') && element.getClientRects().length > 0);
}

function focusTarget(panel: HTMLElement): HTMLElement | null {
  const current = $('[role="treeitem"][tabindex="0"], [aria-current="page"]', panel);
  if (current !== null && current.getClientRects().length > 0) return current;
  return focusables(panel)[0] ?? null;
}

function containTab(panel: HTMLElement, event: KeyboardEvent): void {
  const items = focusables(panel);
  const first = items[0];
  const last = items[items.length - 1];
  if (first === undefined || last === undefined) return;
  const active = panel.ownerDocument.activeElement;
  if (event.shiftKey && (active === first || !panel.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !panel.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}

function controlled(doc: Document, trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute('aria-controls');
  return id === null || id === '' ? null : doc.getElementById(id);
}

function treePanel(doc: Document, trigger: HTMLElement): HTMLElement | null {
  return controlled(doc, trigger) ?? $(`[${HOOK.treePanel}]`, doc) ?? $('[role="tree"]', doc)?.closest<HTMLElement>('nav, aside') ?? null;
}

function contextPanel(doc: Document, trigger: HTMLElement): HTMLElement | null {
  return controlled(doc, trigger) ?? $(`[${HOOK.rail}]`, doc) ?? $(`[${ATTR.railFor}]`, doc)?.parentElement ?? null;
}
