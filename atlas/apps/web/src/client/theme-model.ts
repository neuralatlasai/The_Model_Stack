/**
 * Theme preference logic. `<html data-theme>` is `light`, `dark`, or absent
 * (follow the system); the preference cycles light → dark → system, matching
 * the shell's toggle. Pure; unit-tested.
 */
import type { EffectiveTheme, ThemePreference } from './events.ts';

export const THEME_CYCLE: readonly ThemePreference[] = ['light', 'dark', 'system'];

/** Validates a theme value from the DOM (`data-theme`, `data-theme-value`); same enumeration as core StoredThemeSchema. */
export function themePreferenceOf(value: string | null): ThemePreference | null {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}

export function nextTheme(preference: ThemePreference): ThemePreference {
  const index = THEME_CYCLE.indexOf(preference);
  return THEME_CYCLE[(index + 1) % THEME_CYCLE.length] ?? 'system';
}

export function effectiveTheme(preference: ThemePreference, systemDark: boolean): EffectiveTheme {
  if (preference === 'system') return systemDark ? 'dark' : 'light';
  return preference;
}

/** "Toggle dark mode": an explicit choice of the theme opposite to what is shown now. */
export function toggledTheme(preference: ThemePreference, systemDark: boolean): EffectiveTheme {
  return effectiveTheme(preference, systemDark) === 'dark' ? 'light' : 'dark';
}

/** Value of `<html data-theme>`: null means "remove the attribute". */
export function themeAttribute(preference: ThemePreference): EffectiveTheme | null {
  return preference === 'system' ? null : preference;
}

export function themeLabel(preference: ThemePreference, systemDark: boolean): string {
  const shown = effectiveTheme(preference, systemDark);
  return preference === 'system' ? `system (${shown})` : shown;
}
