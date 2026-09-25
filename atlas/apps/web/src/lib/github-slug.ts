/**
 * GitHub-compatible heading slugs (the `github-slugger` rule): lower-case,
 * drop everything but letters, marks, numbers, connector punctuation, hyphens
 * and spaces, then turn each space into a hyphen. Manuscripts are edited on
 * GitHub, where authors copy these anchors ("Experiment 9.4 — Transfer…" →
 * `#experiment-94--transfer…`, "R12.1" → `#r121`); the atlas renders an alias
 * with this slug wherever its own anchor differs, so both kinds of link land.
 */
export function githubSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replaceAll(' ', '-');
}

/** The alias to render next to `anchor`, or null when the GitHub slug is empty or already the anchor. */
export function githubAlias(title: string, anchor: string | null): string | null {
  const slug = githubSlug(title);
  return slug === '' || slug === anchor ? null : slug;
}
