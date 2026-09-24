/**
 * Deterministic text measurement without a DOM.
 *
 * Layout runs at compile time on Node, where no font metrics exist, so widths
 * are estimated from per-character advance classes calibrated against the
 * three families the atlas ships (Inter Variable, IBM Plex Mono, EB Garamond).
 * The estimate errs slightly wide: a node box a few pixels too large is
 * invisible, a label that overflows its glyph is a defect.
 */

export type TextFamily = 'sans' | 'mono' | 'serif';

/** Advance widths in em for Inter at text sizes (rounded up). */
const SANS_NARROW = new Set(Array.from('iljI|!.,:;\'`’‘ı·'));
const SANS_SEMI_NARROW = new Set(Array.from('ftr()[]{}-/\\"”“ '));
const SANS_WIDE = new Set(Array.from('mwMW@%'));
const SERIF_FACTOR = 0.92;
const MONO_ADVANCE = 0.6;
const SAFETY = 1.04;
const COMBINING_MARK = /\p{M}/u;
const UPPER = /\p{Lu}/u;
const DIGIT = /\d/u;
const WIDE_SYMBOL = /[→←↑↓⇒⇢↩∑Σ∂∇≈≤≥×⊕⊙∘√∈∉∪∩⌈⌉⌊⌋]/u;

function sansAdvance(ch: string): number {
  if (COMBINING_MARK.test(ch)) return 0;
  if (ch === ' ') return 0.28;
  if (SANS_NARROW.has(ch)) return 0.27;
  if (SANS_SEMI_NARROW.has(ch)) return 0.37;
  if (SANS_WIDE.has(ch)) return 0.86;
  if (DIGIT.test(ch)) return 0.6;
  if (WIDE_SYMBOL.test(ch)) return 0.8;
  if (UPPER.test(ch)) return 0.7;
  if (ch.charCodeAt(0) > 0x2e80) return 1;
  return 0.56;
}

/** Estimated rendered width in px of `text` at `fontSize` px. */
export function textWidth(text: string, fontSize: number, family: TextFamily = 'sans'): number {
  let em = 0;
  for (const ch of text) {
    if (family === 'mono') {
      em += COMBINING_MARK.test(ch) ? 0 : MONO_ADVANCE;
    } else {
      em += sansAdvance(ch) * (family === 'serif' ? SERIF_FACTOR : 1);
    }
  }
  return em * fontSize * SAFETY;
}

function hardBreak(word: string, maxWidth: number, fontSize: number, family: TextFamily): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const ch of word) {
    const candidate = current + ch;
    if (current !== '' && textWidth(candidate, fontSize, family) > maxWidth) {
      pieces.push(current);
      current = ch;
    } else {
      current = candidate;
    }
  }
  if (current !== '') pieces.push(current);
  return pieces;
}

function ellipsize(line: string, maxWidth: number, fontSize: number, family: TextFamily): string {
  let out = line;
  while (out.length > 1 && textWidth(`${out}…`, fontSize, family) > maxWidth) {
    out = out.slice(0, -1).trimEnd();
  }
  return `${out}…`;
}

/**
 * Greedy word wrap. Words longer than the line are hard-broken. When
 * `maxLines` is given, the last kept line ends with an ellipsis if text was cut.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  family: TextFamily = 'sans',
  maxLines: number = Number.POSITIVE_INFINITY,
): string[] {
  const words = text.trim().split(/\s+/u).filter((word) => word !== '');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current === '' ? word : `${current} ${word}`;
    if (textWidth(candidate, fontSize, family) <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current !== '') lines.push(current);
    if (textWidth(word, fontSize, family) > maxWidth) {
      const pieces = hardBreak(word, maxWidth, fontSize, family);
      lines.push(...pieces.slice(0, -1));
      current = pieces.at(-1) ?? '';
    } else {
      current = word;
    }
  }
  if (current !== '') lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept.at(-1) ?? '';
    kept[kept.length - 1] = ellipsize(last, maxWidth, fontSize, family);
    return kept;
  }
  return lines;
}

/** Width of the widest line. */
export function linesWidth(lines: readonly string[], fontSize: number, family: TextFamily = 'sans'): number {
  let widest = 0;
  for (const line of lines) widest = Math.max(widest, textWidth(line, fontSize, family));
  return widest;
}
