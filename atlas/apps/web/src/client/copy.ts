/**
 * Copy actions: `[data-action="copy-code"]` copies the text of the enclosing
 * code block (or of `#data-copy-target`); `[data-action="copy-link"]` copies
 * an absolute link to `data-anchor` (or the control's href fragment) at the
 * reader's current depth. Uses the async Clipboard API with a selection-based
 * fallback, and confirms politely through the live region.
 */
import { $, h } from './dom.ts';
import { ACTIONS, closestAction, HOOK } from './hooks.ts';
import type { PageContext } from './page.ts';

export async function copyText(text: string): Promise<boolean> {
  // Undefined in insecure contexts despite the DOM typings.
  const clipboard = navigator.clipboard as Clipboard | undefined;
  try {
    if (clipboard !== undefined) {
      await clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context: fall through to the selection fallback.
  }
  return copyWithSelection(text);
}

/** Legacy fallback for contexts without the async Clipboard API (http, older engines, denied permission). */
function copyWithSelection(text: string): boolean {
  const area = h('textarea', { readonly: true, 'aria-hidden': 'true', tabindex: -1, class: 'cx-offscreen' });
  area.value = text;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  document.body.append(area);
  area.select();
  let ok: boolean;
  try {
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- fallback only when navigator.clipboard is unavailable or refused
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  area.remove();
  active?.focus({ preventScroll: true });
  return ok;
}

export function initCopy(ctx: PageContext): void {
  const { doc, ctl } = ctx;

  const copy = async (text: string, confirmation: string): Promise<boolean> => {
    const ok = await copyText(text);
    ctx.announce(ok ? confirmation : 'Copy failed: select the text and copy it manually.');
    return ok;
  };
  ctx.actions.copyText = copy;

  doc.addEventListener(
    'click',
    (event) => {
      const codeControl = closestAction(event.target, ACTIONS.copyCode);
      if (codeControl !== null) {
        event.preventDefault();
        const source = codeSource(doc, codeControl);
        if (source !== null) void copy(source.textContent, 'Code copied to the clipboard.');
        return;
      }
      const texControl = closestAction(event.target, ACTIONS.copyTex);
      if (texControl !== null) {
        event.preventDefault();
        const tex = texControl.getAttribute('data-tex') ?? '';
        if (tex !== '') void copy(tex, 'TeX source copied to the clipboard.');
        return;
      }
      const linkControl = closestAction(event.target, ACTIONS.copyLink);
      if (linkControl !== null) {
        event.preventDefault();
        const anchor = linkControl.getAttribute(HOOK.anchor) ?? fragment(linkControl);
        const href = ctx.actions.linkTo?.(anchor) ?? location.href;
        void copy(href, 'Link copied to the clipboard.');
      }
    },
    { signal: ctl.signal },
  );
}

function codeSource(doc: Document, control: HTMLElement): Element | null {
  const id = control.getAttribute(HOOK.copyTarget);
  if (id !== null && id !== '') return doc.getElementById(id);
  // The nearest ancestor (≤ 5 levels) that contains a code block.
  let node: Element | null = control.parentElement;
  for (let depth = 0; node !== null && depth < 5; depth += 1, node = node.parentElement) {
    const code = $('pre code', node) ?? $('pre', node);
    if (code !== null) return code;
  }
  return null;
}

function fragment(control: HTMLElement): string | null {
  const href = control.getAttribute('href');
  if (!href?.includes('#')) return null;
  const raw = href.slice(href.indexOf('#') + 1);
  try {
    return raw === '' ? null : decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
