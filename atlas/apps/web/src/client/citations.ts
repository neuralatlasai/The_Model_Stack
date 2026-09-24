/**
 * Citation, glossary-term, equation, and link previews (UI_UX §19, §31).
 *
 * Desktop: hover (fine pointer) or keyboard focus on `[data-cite]`,
 * `[data-term]`, `[data-xref^="equation:"]`, or an internal link
 * (`a[data-node]`) shows a lightweight preview next to the reference. A click
 * on a citation, term, or equation pins the object into the rail inspector
 * without navigating (the reader stays anchored at the sentence, history is
 * untouched); a click on an internal link navigates as usual — its preview
 * only says where it leads (written or planned, what it holds, how it sits in
 * the dependency graph). Mobile: a tap opens the same content in a bottom sheet.
 * Modified clicks (⌘/Ctrl/Shift/middle) keep native link behaviour, so the
 * reference can still be opened in a new tab.
 *
 * All content is built with safe DOM APIs from the zod-validated PageData;
 * equation previews insert the compiler's KaTeX HTML (trusted; see dom.ts).
 * The content builder is a lazy chunk, fetched on the first hover or focus
 * (the show delay hides the load); clicks never wait for it.
 */
import type { InspectTarget } from '@atlas/core';
import { ATTR, parseNodeId } from './contract.ts';
import { canHover, h, isPlainClick, replaceChildren } from './dom.ts';
import type { PageContext } from './page.ts';
import { loadInspectorView } from './rail.ts';

const TRIGGER_SELECTOR = `[${ATTR.cite}], [${ATTR.term}], [${ATTR.xref}^="equation:"], a[${ATTR.linkNode}]`;
const SHOW_DELAY_MS = 110;
const HIDE_DELAY_MS = 160;
const PREVIEW_ID = 'atlas-preview';
const GAP = 8;

export function initCitations(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  if (doc.querySelector(TRIGGER_SELECTOR) === null) return;

  let preview: HTMLElement | null = null;
  let owner: HTMLElement | null = null;
  let cancelShow: (() => void) | null = null;
  let cancelHide: (() => void) | null = null;

  const ensurePreview = (): HTMLElement => {
    if (preview?.isConnected === true) return preview;
    preview = h('div', { id: PREVIEW_ID, class: 'cx-preview', role: 'tooltip', hidden: true });
    preview.addEventListener(
      'pointerenter',
      () => {
        cancelHide?.();
      },
      { signal: ctl.signal },
    );
    preview.addEventListener('pointerleave', scheduleHide, { signal: ctl.signal });
    doc.body.append(preview);
    return preview;
  };

  let wanted: HTMLElement | null = null;
  const show = (trigger: HTMLElement, target: InspectTarget): void => {
    cancelShow?.();
    cancelHide?.();
    if (owner === trigger && preview?.hidden === false) return;
    wanted = trigger;
    loadInspectorView()
      .then(({ buildInspectorView }) => {
        if (ctl.disposed || wanted !== trigger) return; // the pointer or focus moved on meanwhile
        render(trigger, buildInspectorView(ctx, target, 'preview'));
      })
      .catch(() => undefined); // previews are an enhancement; the link still works
  };

  const render = (trigger: HTMLElement, view: { readonly kind: string; readonly title: string; readonly body: HTMLElement }): void => {
    const host = ensurePreview();
    replaceChildren(host, h('span', { class: 'cx-insp__kind' }, view.kind), h('p', { class: 'cx-insp__title' }, view.title), view.body);
    owner?.removeAttribute('aria-describedby');
    owner = trigger;
    trigger.setAttribute('aria-describedby', PREVIEW_ID);
    host.hidden = false;
    position(host, trigger);
  };

  const hide = (): void => {
    cancelShow?.();
    cancelHide?.();
    wanted = null;
    if (preview !== null) preview.hidden = true;
    owner?.removeAttribute('aria-describedby');
    owner = null;
  };

  function scheduleHide(): void {
    cancelHide?.();
    cancelHide = ctl.timeout(hide, HIDE_DELAY_MS);
  }

  const triggerOf = (target: EventTarget | null): HTMLElement | null =>
    target instanceof Element ? target.closest<HTMLElement>(TRIGGER_SELECTOR) : null;

  doc.addEventListener(
    'pointerover',
    (event) => {
      if (event.pointerType === 'touch' || !canHover()) return;
      const trigger = triggerOf(event.target);
      if (trigger === null) return;
      const target = targetFromTrigger(trigger);
      if (target === null) return;
      cancelHide?.();
      cancelShow?.();
      cancelShow = ctl.timeout(() => {
        show(trigger, target);
      }, SHOW_DELAY_MS);
    },
    { signal: ctl.signal },
  );
  doc.addEventListener(
    'pointerout',
    (event) => {
      const trigger = triggerOf(event.target);
      if (trigger === null) return;
      const next = event.relatedTarget;
      if (next instanceof Node && (trigger.contains(next) || preview?.contains(next) === true)) return;
      cancelShow?.();
      scheduleHide();
    },
    { signal: ctl.signal },
  );
  doc.addEventListener(
    'focusin',
    (event) => {
      const trigger = triggerOf(event.target);
      if (trigger?.matches(':focus-visible') !== true) return;
      const target = targetFromTrigger(trigger);
      if (target !== null) show(trigger, target);
    },
    { signal: ctl.signal },
  );
  doc.addEventListener(
    'focusout',
    (event) => {
      if (triggerOf(event.target) !== null) scheduleHide();
    },
    { signal: ctl.signal },
  );
  doc.addEventListener(
    'click',
    (event) => {
      const trigger = triggerOf(event.target);
      if (trigger === null || !isPlainClick(event)) return;
      const target = targetFromTrigger(trigger);
      if (target === null) return;
      if (target.type === 'node') {
        hide(); // links navigate; the preview was only a signpost
        return;
      }
      event.preventDefault();
      hide();
      ctx.actions.inspect?.(target, trigger);
    },
    { signal: ctl.signal },
  );
  // Capture phase: a visible preview consumes Esc before the rail sees it.
  doc.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Escape' || preview === null || preview.hidden) return;
      event.preventDefault();
      const back = owner;
      hide();
      if (back !== null && doc.activeElement !== back) back.focus({ preventScroll: true });
    },
    { signal: ctl.signal, capture: true },
  );
  window.addEventListener(
    'scroll',
    () => {
      if (preview !== null && !preview.hidden) hide();
    },
    { passive: true, signal: ctl.signal },
  );
  ctl.defer(() => {
    preview?.remove();
    preview = null;
  });
}

/** Places the preview below the reference (above when there is no room), clamped to the viewport. */
function position(host: HTMLElement, trigger: HTMLElement): void {
  const rects = trigger.getClientRects();
  const anchor = rects[0] ?? trigger.getBoundingClientRect();
  host.style.left = '0px';
  host.style.top = '0px';
  const { width, height } = host.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  const left = Math.min(Math.max(GAP, anchor.left), Math.max(GAP, viewportWidth - width - GAP));
  const below = anchor.bottom + GAP;
  const top = below + height <= viewportHeight - GAP ? below : Math.max(GAP, anchor.top - height - GAP);
  host.style.left = `${String(Math.round(left))}px`;
  host.style.top = `${String(Math.round(top))}px`;
}

/** Parses a trigger element into an inspect target (`data-cite`, `data-term`, `data-xref="equation:5.4"`, `data-node`). */
export function targetFromTrigger(element: Element): InspectTarget | null {
  const cite = element.getAttribute(ATTR.cite);
  if (cite !== null && cite !== '') return { type: 'paper', key: cite };
  const term = element.getAttribute(ATTR.term);
  if (term !== null && term !== '') return { type: 'term', slug: term };
  const xref = element.getAttribute(ATTR.xref);
  if (xref?.startsWith('equation:') === true) {
    const number = xref.slice('equation:'.length);
    if (/^\d+\.\d+$/u.test(number)) return { type: 'equation', number };
  }
  const node = parseNodeId(element.getAttribute(ATTR.linkNode));
  if (node !== null) return { type: 'node', id: node };
  return null;
}
