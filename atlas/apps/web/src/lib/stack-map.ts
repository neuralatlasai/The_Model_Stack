/**
 * Helpers for the graph page's dependency map (components/shell/StackExplorer.astro):
 * label wrapping for SVG text (which does not wrap by itself) and the rest-state
 * facts of the readout. Pure, so the component and its tests agree.
 */
import type { StackChapter } from './stack.ts';

/**
 * Greedy word wrap into at most `maxLines` lines of at most `maxChars`
 * characters. A word longer than a line is cut; text that does not fit ends
 * the last line with an ellipsis (the full title is always in the readout and
 * the accessible name).
 */
export function wrapLabel(text: string, maxChars: number, maxLines: number): string[] {
  // Hyphenated compounds may break after a hyphen ("Vision-language-" / "action").
  const words = text
    .trim()
    .split(/\s+/u)
    .flatMap((word) => (word.length > maxChars ? word.split(/(?<=-)/u) : [word]))
    .filter((word) => word !== '');
  const lines: string[] = [];
  let current = '';
  let index = 0;
  for (; index < words.length; index += 1) {
    const word = words[index] ?? '';
    const next = current === '' ? word : current.endsWith('-') ? `${current}${word}` : `${current} ${word}`;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current !== '') {
      lines.push(current);
      current = '';
      if (lines.length === maxLines) break;
    }
    current = word.length > maxChars ? word.slice(0, maxChars) : word;
  }
  if (lines.length < maxLines && current !== '') {
    lines.push(current);
    current = '';
    index = words.length;
  }
  if (index < words.length || current !== '') {
    const last = lines.at(-1) ?? '';
    const trimmed = last.length >= maxChars ? last.slice(0, maxChars - 1).trimEnd() : last;
    lines[lines.length - 1] = `${trimmed.replace(/[,;:]$/u, '')}…`;
  }
  return lines;
}

export interface StackFacts {
  readonly written: number;
  readonly total: number;
  /** The chapter the most later chapters rest on (largest transitive downstream set). */
  readonly keystone: StackChapter | null;
  /** The chapter that rests on the most (largest transitive upstream set). */
  readonly deepest: StackChapter | null;
}

export function stackFacts(chapters: readonly StackChapter[]): StackFacts {
  const pick = (score: (chapter: StackChapter) => number): StackChapter | null =>
    chapters.reduce<StackChapter | null>((best, chapter) => (best === null || score(chapter) > score(best) ? chapter : best), null);
  return {
    written: chapters.filter((chapter) => chapter.written).length,
    total: chapters.length,
    keystone: pick((chapter) => chapter.downstream),
    deepest: pick((chapter) => chapter.upstream),
  };
}
