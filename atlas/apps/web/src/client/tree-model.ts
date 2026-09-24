/**
 * Pure logic of the knowledge-tree keyboard pattern (WAI-ARIA APG tree view)
 * and of the persisted expansion set. Unit-tested; tree.ts applies it to DOM.
 */

export type TreeMove = 'next' | 'previous' | 'first' | 'last';

/** Index in a list of visible items after a vertical move (no wrap, APG behaviour). */
export function moveIndex(move: TreeMove, current: number, count: number): number {
  if (count <= 0) return -1;
  switch (move) {
    case 'next':
      return Math.min(count - 1, current + 1);
    case 'previous':
      return Math.max(0, current - 1);
    case 'first':
      return 0;
    case 'last':
      return count - 1;
  }
}

export function keyToMove(key: string): TreeMove | null {
  switch (key) {
    case 'ArrowDown':
      return 'next';
    case 'ArrowUp':
      return 'previous';
    case 'Home':
      return 'first';
    case 'End':
      return 'last';
    default:
      return null;
  }
}

/**
 * Type-ahead: the next visible item (after `current`, wrapping) whose label
 * starts with `buffer`. A buffer of one repeated character cycles through the
 * items starting with that character. Returns -1 when nothing matches.
 */
export function typeaheadIndex(labels: readonly string[], current: number, buffer: string): number {
  const needle = buffer.toLocaleLowerCase();
  if (needle === '' || labels.length === 0) return -1;
  const repeated = Array.from(needle).every((char) => char === needle[0]);
  const query = repeated ? needle.slice(0, 1) : needle;
  // A fresh multi-character buffer may still match the current item; a single key moves on.
  const startOffset = needle.length > 1 && !repeated ? 0 : 1;
  for (let step = 0; step < labels.length; step += 1) {
    const index = (current + startOffset + step + labels.length) % labels.length;
    const label = labels[index];
    if (label !== undefined && labelMatches(label, query)) return index;
  }
  return -1;
}

/**
 * Tree labels usually start with a number (`5.2 Latent attention`, `05 — Tokenization`);
 * type-ahead matches either the full label or the title after the number.
 */
export function labelMatches(label: string, query: string): boolean {
  const text = label.trim().toLocaleLowerCase();
  if (text.startsWith(query)) return true;
  const title = text.replace(/^\d+(?:\.\d+)*\s*[—–-]?\s*/u, '');
  return title !== text && title.startsWith(query);
}

export const MAX_EXPANDED = 400;

/**
 * Updates the persisted set of branches the reader expanded (insertion order,
 * newest last, capped so the stored array always satisfies its schema).
 */
export function updateExpanded(stored: readonly string[], id: string, open: boolean): string[] {
  const next = stored.filter((entry) => entry !== id);
  if (open) next.push(id);
  return next.length > MAX_EXPANDED ? next.slice(next.length - MAX_EXPANDED) : next;
}

/**
 * Branches to show expanded: the reader's own choices plus the ancestors of
 * the current node (the active branch expands automatically; branches that
 * were only auto-expanded for an earlier page collapse again).
 */
export function expandedSet(userExpanded: readonly string[], ancestors: readonly string[]): ReadonlySet<string> {
  return new Set([...userExpanded, ...ancestors]);
}
