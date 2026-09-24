/**
 * Two restrained Shiki themes in the atlas palette (shared style spec).
 * Code reads as ink on paper: keywords and functions carry the darkest ink,
 * identifiers ink-2, punctuation and comments recede (comments italic
 * graphite), strings take a muted umber, numbers and constants a slate blue.
 * Colour never carries meaning alone; nothing is bold or saturated.
 *
 * Emitted with `defaultColor: false`, so each token carries `--shiki-light` /
 * `--shiki-dark` custom properties and the site's CSS picks one per theme.
 */
import type { ThemeRegistration } from 'shiki';

interface Palette {
  readonly background: string;
  readonly foreground: string;
  readonly ink: string;
  readonly ink2: string;
  readonly ink3: string;
  readonly string: string;
  readonly number: string;
  readonly rule: string;
}

const LIGHT: Palette = {
  background: '#F1EEE6', // --paper-sunk
  foreground: '#4A4740', // --ink-2
  ink: '#1B1A17', // --ink
  ink2: '#4A4740', // --ink-2
  ink3: '#6E6A60', // --ink-3
  string: '#7A3E1D', // umber (--domain-data)
  number: '#1F4E79', // slate blue (--domain-architecture)
  rule: '#DDD8CC', // --rule
};

const DARK: Palette = {
  background: '#201E1B', // --paper-sunk (dark)
  foreground: '#B9B2A5', // --ink-2 (dark)
  ink: '#E7E2D8', // --ink (dark)
  ink2: '#B9B2A5', // --ink-2 (dark)
  ink3: '#8F887B', // --ink-3 (dark)
  string: '#D29A6E', // umber (--domain-data, dark)
  number: '#8DB4DA', // slate blue (--domain-architecture, dark)
  rule: '#34312B', // --rule (dark)
};

function theme(name: string, type: 'light' | 'dark', p: Palette): ThemeRegistration {
  return {
    name,
    type,
    colors: {
      'editor.background': p.background,
      'editor.foreground': p.foreground,
      'editorLineNumber.foreground': p.ink3,
      'editor.selectionBackground': p.rule,
    },
    tokenColors: [
      { settings: { foreground: p.foreground, background: p.background } },
      {
        scope: ['comment', 'punctuation.definition.comment', 'string.comment'],
        settings: { foreground: p.ink3, fontStyle: 'italic' },
      },
      {
        scope: [
          'keyword',
          'keyword.control',
          'keyword.operator.logical',
          'keyword.operator.word',
          'storage',
          'storage.type',
          'storage.modifier',
          'variable.language',
          'support.type.property-name.json',
          'entity.name.tag',
        ],
        settings: { foreground: p.ink },
      },
      {
        scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function', 'entity.name.type', 'entity.name.class', 'support.class', 'support.type'],
        settings: { foreground: p.ink },
      },
      {
        scope: ['string', 'string.quoted', 'string.template', 'string.unquoted', 'markup.inline.raw', 'constant.character.escape'],
        settings: { foreground: p.string },
      },
      {
        scope: ['constant.numeric', 'constant.language', 'constant.other', 'support.constant', 'variable.other.constant'],
        settings: { foreground: p.number },
      },
      {
        scope: ['variable', 'variable.parameter', 'variable.other', 'meta.definition.variable', 'entity.other.attribute-name'],
        settings: { foreground: p.ink2 },
      },
      {
        scope: [
          'punctuation',
          'meta.brace',
          'keyword.operator',
          'punctuation.separator',
          'punctuation.terminator',
          'punctuation.definition.string',
          'punctuation.section',
        ],
        settings: { foreground: p.ink3 },
      },
      { scope: ['markup.heading', 'entity.name.section'], settings: { foreground: p.ink } },
      { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
      { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
      { scope: ['markup.underline.link', 'string.other.link'], settings: { foreground: p.string } },
      { scope: ['invalid', 'invalid.illegal'], settings: { foreground: p.ink, fontStyle: 'underline' } },
    ],
  };
}

export const ATLAS_LIGHT_THEME = 'atlas-light';
export const ATLAS_DARK_THEME = 'atlas-dark';

export const atlasLight: ThemeRegistration = theme(ATLAS_LIGHT_THEME, 'light', LIGHT);
export const atlasDark: ThemeRegistration = theme(ATLAS_DARK_THEME, 'dark', DARK);
