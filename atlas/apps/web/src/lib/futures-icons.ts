/**
 * AI futures pictograms (`/ai-futures/`): one line icon per kind, drawn on a
 * 24-unit grid as a single stroke path (no fills). Consumers render them as
 * `<symbol viewBox="0 0 24 24">` with `fill: none; stroke: currentColor` and
 * set the stroke width for the size they draw at.
 *
 *   scenario     a forecast fan: one trunk, three branching futures
 *   measurement  a gauge with a needle
 *   alignment    a shield with a check
 *   framework    stairs: risk thresholds, one step at a time
 *   governance   an institution: pediment, four columns, a base
 *   lab          a laboratory flask
 *   institute    an open book
 *   compute      two server units
 */
import type { KindKey } from './ai-futures.ts';

export const ICON_VIEWBOX = '0 0 24 24';

export const ICONS: Readonly<Record<KindKey, string>> = {
  scenario: 'M3 18 8.5 13.5M8.5 13.5C13 13.5 15 6 21 5.5M8.5 13.5C13 13.5 15.5 12 21 12M8.5 13.5C13 13.5 15 18 21 18.5',
  measurement: 'M4 16.5a8 8 0 0 1 16 0M12 16.5l4.4-5.4M6.3 10.8l1.2 1.1M12 8.5v1.7M17.7 10.8l-1.2 1.1M3.5 20h17',
  alignment: 'M12 3.2 19 6v5.4c0 4.5-3 8-7 9.4-4-1.4-7-4.9-7-9.4V6ZM8.8 12.1l2.2 2.2 4.4-4.5',
  framework: 'M3 20.5h4.5V16H12v-4.5h4.5V7H21M3 16.5v4M16.5 3v4',
  governance: 'M3 9.5 12 4l9 5.5ZM5.5 9.5v8M9.8 9.5v8M14.2 9.5v8M18.5 9.5v8M3 20.5h18',
  lab: 'M9.5 3.5h5M10.5 3.5v6L5 19a1.3 1.3 0 0 0 1.1 2h11.8a1.3 1.3 0 0 0 1.1-2l-5.5-9.5v-6M7.2 15.5h9.6',
  institute: 'M12 6.5C10 5 7 4.5 3.5 5v13.5C7 18 10 18.5 12 20c2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5ZM12 6.5V20',
  compute:
    'M5 4h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM5 14h14a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1ZM7.5 7h.01M7.5 17h.01M11 7h6M11 17h6',
};

/** Verification status marks on a ±7 grid: a check, a turn-and-arrow, a question mark. */
export const STATUS_MARKS: Readonly<Record<'verified' | 'redirected' | 'unverified', string>> = {
  verified: 'M-4.6 0.4-1.6 3.4 4.8-3.2',
  redirected: 'M-4.6-4.2v2.9a2.7 2.7 0 0 0 2.7 2.7H4.8M2 -1.8 4.8 1.4 2 4.6',
  unverified: 'M-2.5-2.3a2.6 2.6 0 1 1 3.5 2.4c-.8.4-1 .9-1 1.8v.5M0 4.7v.2',
};
