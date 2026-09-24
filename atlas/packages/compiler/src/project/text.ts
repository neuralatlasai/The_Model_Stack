/**
 * Small, pure text helpers shared by the project layer, registries, graph, and
 * search. Deterministic and locale-independent.
 */

/** `NVIDIA cuBLAS / cuBLASLt` → `nvidia-cublas-cublaslt`; `Huawei Noah's Ark Lab` → `huawei-noahs-ark-lab`. */
export function kebab(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/gu, '')
    .toLowerCase()
    .replace(/['’]/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

/** Collapses runs of whitespace to single spaces and trims. */
export function squash(value: string): string {
  return value.replace(/\s+/gu, ' ').trim();
}

/** Truncates at a word boundary to at most `max` characters (ellipsis included). */
export function truncate(value: string, max: number): string {
  const text = squash(value);
  if (text.length <= max) return text;
  const cut = text.slice(0, Math.max(0, max - 1));
  const boundary = cut.lastIndexOf(' ');
  const head = boundary > max * 0.6 ? cut.slice(0, boundary) : cut;
  return `${head.replace(/[\s,;:.·—-]+$/u, '')}…`;
}

const ROMAN: readonly (readonly [number, string])[] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** Positive integer → upper-case Roman numeral (`11` → `XI`). */
export function toRoman(value: number): string {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError(`toRoman expects a positive integer, got ${String(value)}`);
  let rest = value;
  let out = '';
  for (const [unit, glyph] of ROMAN) {
    while (rest >= unit) {
      out += glyph;
      rest -= unit;
    }
  }
  return out;
}

/** `5` → `"05"`. */
export function twoDigit(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Normalised comparison key for names: lower-case alphanumerics only. */
export function nameKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, '');
}

/** Stable, de-duplicated copy preserving first occurrence order. */
export function unique<T>(values: Iterable<T>): T[] {
  return [...new Set(values)];
}
