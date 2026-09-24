/**
 * Small DOM helpers shared by the controllers. All element construction goes
 * through `h()`, which sets text with Text nodes and attributes with
 * setAttribute: untrusted strings never reach an HTML parser.
 */
import { DESKTOP_MIN_WIDTH, HOOK } from './hooks.ts';

export function $(selector: string, root: ParentNode = document): HTMLElement | null {
  return root.querySelector<HTMLElement>(selector);
}

export function $$<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] {
  return [...root.querySelectorAll<T>(selector)];
}

type Child = Node | string | null | undefined | false;
type Attrs = Readonly<Record<string, string | number | boolean | null | undefined>>;

/**
 * Builds an element safely. Attribute values are strings set via setAttribute
 * (`true` → empty attribute, `false`/null/undefined → omitted); string children
 * become Text nodes.
 */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    element.setAttribute(name, value === true ? '' : String(value));
  }
  append(element, children);
  return element;
}

export function append(parent: Node, children: readonly Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
}

/** Replaces all children with the given ones. */
export function replaceChildren(parent: Element, ...children: Child[]): void {
  parent.replaceChildren();
  append(parent, children);
}

/**
 * Parses KaTeX HTML into a fragment.
 *
 * TRUST DECISION: only call this with compiler-produced KaTeX output
 * (`EquationBlock.html`, `PageData.equations[n].html`). That HTML is generated
 * at build time by KaTeX from the book's own TeX (never from reader input or
 * third-party data), embedded in the page's JSON data island, and validated
 * for shape by `PageDataSchema`. A <template> parses it inertly (scripts do
 * not run, images do not load until adopted) before it is inserted.
 */
export function trustedCompilerHtml(html: string): DocumentFragment {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

/** True when the element generates boxes (not display:none, not inside a hidden ancestor). */
export function isRendered(element: Element): boolean {
  return element.getClientRects().length > 0;
}

export function matchesMedia(query: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

export function prefersReducedMotion(): boolean {
  return matchesMedia('(prefers-reduced-motion: reduce)');
}

/** Three-column desktop frame (≥ 1024 px). Below it the rail and tree become sheets. */
export function isDesktop(): boolean {
  return window.innerWidth >= DESKTOP_MIN_WIDTH;
}

/** Hover-capable fine pointer (hover previews are pointless on touch). */
export function canHover(): boolean {
  return matchesMedia('(hover: hover) and (pointer: fine)');
}

/** True while the user is typing in a text control (global shortcuts must not fire). */
export function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) {
    return !['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'color', 'file', 'image'].includes(target.type);
  }
  return false;
}

/** A plain primary-button click without modifiers (anything else keeps native link behaviour). */
export function isPlainClick(event: MouseEvent): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !event.defaultPrevented;
}

/** Site base with leading and trailing slash: `<meta name="atlas-base">`, else the build-time fallback. */
export function siteBase(doc: Document, fallback: string): string {
  const meta = doc.querySelector<HTMLMetaElement>(`meta[name="${HOOK.baseMeta}"]`);
  const raw = meta?.content.trim() ?? '';
  return normaliseBase(raw === '' ? fallback : raw);
}

export function normaliseBase(raw: string): string {
  const withLead = raw.startsWith('/') ? raw : `/${raw}`;
  return withLead.endsWith('/') ? withLead : `${withLead}/`;
}

/** Makes an element programmatically focusable without adding it to the tab order, then focuses it. */
export function focusElement(element: HTMLElement, preventScroll = true): void {
  if (!element.hasAttribute('tabindex') && element.tabIndex < 0) element.setAttribute('tabindex', '-1');
  element.focus({ preventScroll });
}

/** Scrolls `item` into view inside its nearest scrollable ancestor only, never the page. */
export function scrollIntoContainer(item: HTMLElement, stopAt: Element | null = null): void {
  const container = scrollableAncestor(item, stopAt);
  if (container === null) return;
  const itemRect = item.getBoundingClientRect();
  const boxRect = container.getBoundingClientRect();
  const above = itemRect.top < boxRect.top;
  const below = itemRect.bottom > boxRect.bottom;
  if (!above && !below) return;
  const offset = itemRect.top - boxRect.top - (container.clientHeight - itemRect.height) / 2;
  container.scrollTop += offset;
}

function scrollableAncestor(element: HTMLElement, stopAt: Element | null): HTMLElement | null {
  for (let node = element.parentElement; node !== null && node !== stopAt?.parentElement; node = node.parentElement) {
    if (node === document.body || node === document.documentElement) return null;
    const overflow = getComputedStyle(node).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

/** Visually hidden but announced (used when no CSS class is available yet). */
export const SR_ONLY_CLASS = 'cx-sr-only';
