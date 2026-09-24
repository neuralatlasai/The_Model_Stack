/**
 * URL hygiene for hrefs built from data (PageData, search index, storage).
 * Every such string is untrusted until it passes one of these guards, so a
 * corrupted index or a hand-edited localStorage entry can never produce a
 * `javascript:` link. Pure; unit-tested.
 */

/** http(s) URLs only (external papers, code); anything else is rejected. */
export function safeExternalHref(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined || raw.trim() === '') return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

// Control characters and backslashes have no business in an internal path (and `\` is treated as `/` by browsers).
const UNSAFE_PATH = /[\\\p{Cc}]/u;

/** Root-relative internal paths only (`/ch05-…/`, `/papers/p19/#x`); protocol-relative `//host` is rejected. */
export function safeInternalHref(raw: string | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || UNSAFE_PATH.test(raw)) return null;
  return raw;
}

/**
 * Prefixes the deploy base to a base-relative route (`/ch05/` + base `/atlas/` → `/atlas/ch05/`).
 * Paths that already carry the base are returned unchanged.
 */
export function withBase(base: string, path: string): string {
  if (base === '/' || path.startsWith(base)) return path;
  return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
}

/** Canonical form of the current page URL for citations: origin + path, no query or fragment. */
export function canonicalPageUrl(href: string): string {
  const url = new URL(href);
  return `${url.origin}${url.pathname}`;
}
