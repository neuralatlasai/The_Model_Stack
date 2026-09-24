/**
 * Data shapes of the home page's live instrument panel (components/shell/AtlasInstrument.astro).
 * Kept in a plain module so pages can import the types without importing a component's frontmatter.
 */

export interface InstrumentRow {
  readonly key: string;
  readonly value: number;
  readonly href?: string;
  readonly note?: string;
}

export interface InstrumentDot {
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly href: string;
  readonly filled: boolean;
  /** Readout text shown on hover/focus and used as the dot's accessible name. */
  readonly readout: string;
}

export interface InstrumentPart {
  readonly id: string;
  readonly numeral: string;
  readonly title: string;
  readonly domain: string;
  readonly dots: readonly InstrumentDot[];
}
