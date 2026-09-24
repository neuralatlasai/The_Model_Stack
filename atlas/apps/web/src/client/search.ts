/**
 * Search entry points (UI_UX §32): ⌘K / Ctrl-K anywhere and any
 * `[data-action="open-search"]` trigger open the palette. The palette module
 * (MiniSearch, the index, the dialog) is a separate chunk loaded on first use
 * and warmed when the pointer or focus reaches a trigger, so the initial
 * script stays small.
 */
import { closestAction, ACTIONS, actionSelector } from './hooks.ts';
import { $$ } from './dom.ts';
import type * as PaletteModuleNamespace from './palette.ts';
import type { PageContext } from './page.ts';

type PaletteModule = typeof PaletteModuleNamespace;

let palette: Promise<PaletteModule> | null = null;

function loadPalette(): Promise<PaletteModule> {
  palette ??= import('./palette.ts').catch((error: unknown) => {
    palette = null; // allow a later retry
    throw error instanceof Error ? error : new Error('palette failed to load');
  });
  return palette;
}

export function initSearch(ctx: PageContext): void {
  const { doc, ctl } = ctx;

  const open = (returnFocus: HTMLElement | null): void => {
    loadPalette()
      .then((module) => {
        if (!ctl.disposed) module.openPalette(ctx, returnFocus);
      })
      .catch(() => {
        ctx.announce('Search could not be loaded. Check the connection and try again.');
      });
  };

  doc.addEventListener(
    'keydown',
    (event) => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      event.preventDefault();
      open(doc.activeElement instanceof HTMLElement ? doc.activeElement : null);
    },
    { signal: ctl.signal },
  );
  doc.addEventListener(
    'click',
    (event) => {
      const trigger = closestAction(event.target, ACTIONS.search);
      if (trigger === null) return;
      event.preventDefault();
      open(trigger);
    },
    { signal: ctl.signal },
  );

  const apple = /Mac|iPhone|iPad/u.test(navigator.userAgent);
  for (const trigger of $$(actionSelector(ACTIONS.search), doc)) {
    trigger.setAttribute('aria-haspopup', 'dialog');
    for (const type of ['pointerenter', 'focus'] as const) {
      trigger.addEventListener(
        type,
        () => {
          void loadPalette().catch(() => undefined);
        },
        { signal: ctl.signal, once: true },
      );
    }
    // The shell renders the Apple glyph; show the chord this platform actually uses.
    const kbd = trigger.querySelector('kbd');
    if (!apple && kbd !== null && kbd.textContent === '⌘K') kbd.textContent = 'Ctrl K';
  }
}
