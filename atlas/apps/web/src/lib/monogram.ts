/**
 * Monograms for labs and systems (pages/labs, pages/systems): a short mark set
 * in the site's own fonts, derived from the name exactly as the reference
 * stack writes it. No third-party logo is drawn or embedded; the mark is only
 * an abbreviation of the recorded name, so it can never claim more than the
 * registry holds.
 *
 *   "Allen Institute for AI (Ai2)"  → "Ai2"   a short parenthetical acronym
 *   "Stanford CRFM", "IBM Research" → "CRFM", "IBM"   an all-caps word
 *   "Meta AI / FAIR", "Z.ai"        → "Meta", "Z.ai"  a short leading word
 *   "OpenAI", "DeepSeek"            → "OAI", "DS"     inner capitals
 *   "Google DeepMind"               → "GDM"           initials (inner capitals kept)
 *   "Anthropic"                     → "An"            first two letters
 *
 * `monograms` makes a set unique: marks that collide grow to three letters of
 * their leading word ("Sa" ×3 → "Sal", "Sak", "Sam"), then take a digit.
 * Systems pass their vendors, so "NVIDIA cuDNN" reads "cuDNN", not "NV".
 */

export interface MonogramOptions {
  /** Leading vendor names dropped when more of the name follows ("NVIDIA NCCL" → "NCCL"). */
  readonly vendors?: readonly string[];
}

const GENERIC = new Set([
  'ai',
  'research',
  'lab',
  'labs',
  'laboratory',
  'institute',
  'science',
  'department',
  'center',
  'centre',
  'machine',
  'learning',
  'university',
  'academy',
  'applied',
  'theoretical',
  'intelligent',
  'systems',
  'framework',
  'of',
  'for',
  'and',
  'the',
]);

const capitals = (word: string): string => word.replace(/[^A-Z]/gu, '');
const titled = (word: string, length: number): string => {
  const letters = word.replace(/[^\p{L}\p{N}]/gu, '');
  return letters.charAt(0).toUpperCase() + letters.slice(1, length).toLowerCase() || word.slice(0, length);
};

/** The name's leading form: before " / " or " – ", without a parenthetical. */
export function leadingName(name: string): string {
  return (name.split(/\s+[/–—]\s+/u)[0] ?? name).replace(/\s*\([^)]*\)/gu, '').trim();
}

export function monogram(name: string, options: MonogramOptions = {}): string {
  const paren = /\(([^)]+)\)/u.exec(name)?.[1]?.trim();
  if (paren !== undefined) {
    const head = paren.split('-')[0] ?? paren;
    if (/^[\p{L}\p{N}]{2,5}$/u.test(head)) return head;
  }
  let words = leadingName(name)
    .split(/\s+/u)
    .filter((word) => word !== '');
  for (const vendor of options.vendors ?? []) {
    const parts = vendor.split(/\s+/u);
    if (words.length > parts.length && parts.every((part, index) => words[index] === part)) {
      words = words.slice(parts.length);
      break;
    }
  }
  const acronym = words.find((word) => /^[A-Z][A-Z0-9]{1,4}$/u.test(word) && word !== 'AI');
  if (acronym !== undefined) return acronym;
  const significant = words.filter((word) => !GENERIC.has(word.toLowerCase()));
  const pool = significant.length > 0 ? significant : words;
  if (pool.length === 1) {
    const word = pool[0] ?? name;
    if (word.length <= 4) return word;
    // A lower-case product name is its own mark when short ("cuBLAS", "oneAPI", "llama.cpp" → "llama").
    const head = word.split('.')[0] ?? word;
    if (/^[a-z]/u.test(word) && head.length <= 6) return head;
    if (/^[A-Z0-9]+$/u.test(word)) return word.slice(0, word.length > 6 ? 3 : 2);
    const inner = capitals(word);
    if (inner.length >= 2) return inner.slice(0, 3);
    return titled(word, 2);
  }
  const initials = pool
    .map((word) => (capitals(word).length >= 2 ? capitals(word) : word.charAt(0).toUpperCase() || ''))
    .join('');
  return initials.slice(0, 3);
}

/** Monograms for a list of names, made unique within the list (same order as `names`). */
export function monograms(names: readonly string[], options: MonogramOptions = {}): string[] {
  const marks = names.map((name) => monogram(name, options));
  const count = (mark: string): number => marks.filter((other) => other === mark).length;
  const grown = marks.map((mark, index) => {
    if (count(mark) === 1) return mark;
    const lead = leadingName(names[index] ?? '').split(/\s+/u)[0] ?? mark;
    return titled(lead, 3);
  });
  const seen = new Map<string, number>();
  return grown.map((mark) => {
    const n = (seen.get(mark) ?? 0) + 1;
    seen.set(mark, n);
    return n === 1 ? mark : `${mark.slice(0, 2)}${String(n)}`;
  });
}
