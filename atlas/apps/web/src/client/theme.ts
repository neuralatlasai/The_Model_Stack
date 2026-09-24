/**
 * Theme control: light / dark / system (UI_UX §59). The inline bootstrap sets
 * `<html data-theme>` before first paint and on every ClientRouter swap; this
 * module handles the toggle, persists STORAGE_KEYS.theme (JSON string, which
 * the bootstrap reads), keeps the control's accessible name current, and
 * reports system-theme changes while "system" is selected.
 */
import { ATTR, STORAGE_KEYS } from './contract.ts';
import { $$, matchesMedia } from './dom.ts';
import { CLIENT_EVENTS, emit, type ThemePreference } from './events.ts';
import { ACTIONS, actionSelector, closestAction, HOOK } from './hooks.ts';
import type { PageContext } from './page.ts';
import { effectiveTheme, nextTheme, themeAttribute, themeLabel, themePreferenceOf, toggledTheme } from './theme-model.ts';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function initTheme(ctx: PageContext): void {
  const { doc, ctl, store } = ctx;
  const root = doc.documentElement;
  // The inline bootstrap applied the stored preference (enumerated values only) before first paint:
  // <html data-theme="light|dark"> or no attribute for "system". Reading it back keeps zod out of this chunk.
  let preference: ThemePreference = themePreferenceOf(root.getAttribute(ATTR.theme)) ?? 'system';
  const systemDark = (): boolean => matchesMedia(DARK_QUERY);

  const paint = (): void => {
    const value = themeAttribute(preference);
    if (value === null) root.removeAttribute(ATTR.theme);
    else root.setAttribute(ATTR.theme, value);
    const label = themeLabel(preference, systemDark());
    for (const control of $$(actionSelector(ACTIONS.theme), doc)) {
      const explicit = control.getAttribute(HOOK.themeValue);
      if (explicit !== null) {
        control.setAttribute('aria-pressed', explicit === preference ? 'true' : 'false');
      } else {
        control.setAttribute('aria-label', `Colour theme: ${label}`);
        control.setAttribute('title', `Colour theme: ${label} (next: ${nextTheme(preference)})`);
        control.setAttribute('data-theme-state', preference);
      }
    }
  };

  const setTheme = (next: ThemePreference): void => {
    preference = next;
    store.write(STORAGE_KEYS.theme, next);
    paint();
    const effective = effectiveTheme(next, systemDark());
    emit(doc, CLIENT_EVENTS.theme, { preference: next, effective });
    ctx.announce(`Colour theme: ${themeLabel(next, systemDark())}`);
  };
  ctx.actions.setTheme = setTheme;
  ctx.actions.toggleDarkMode = () => {
    setTheme(toggledTheme(preference, systemDark()));
  };

  paint();

  doc.addEventListener(
    'click',
    (event) => {
      const control = closestAction(event.target, ACTIONS.theme);
      if (control === null) return;
      event.preventDefault();
      setTheme(themePreferenceOf(control.getAttribute(HOOK.themeValue)) ?? nextTheme(preference));
    },
    { signal: ctl.signal },
  );

  if (typeof window.matchMedia === 'function') {
    window.matchMedia(DARK_QUERY).addEventListener(
      'change',
      () => {
        if (preference !== 'system') return;
        paint();
        emit(doc, CLIENT_EVENTS.theme, { preference, effective: effectiveTheme(preference, systemDark()) });
      },
      { signal: ctl.signal },
    );
  }
}
