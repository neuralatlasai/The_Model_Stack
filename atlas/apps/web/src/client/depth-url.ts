/**
 * Depth in the URL (UI_UX §29: "The URL should preserve selected depth").
 * `?depth=` is parsed at the URL trust boundary with core `isDepth`; the
 * default depth is represented by the absence of the parameter so ordinary
 * links stay clean. Pure; unit-tested.
 */
import type { Depth } from '@atlas/core';
import { DEFAULT_DEPTH, isDepth } from './contract.ts';

export const DEPTH_PARAM = 'depth';

/** The valid `?depth=` of a URL, or null when absent or invalid. */
export function depthFromUrl(href: string): Depth | null {
  let value: string | null;
  try {
    value = new URL(href).searchParams.get(DEPTH_PARAM);
  } catch {
    return null;
  }
  return value !== null && isDepth(value) ? value : null;
}

/** URL wins (a shared link states its depth), then the stored preference, then the default. */
export function resolveDepth(fromUrl: Depth | null, stored: Depth | null): Depth {
  return fromUrl ?? stored ?? DEFAULT_DEPTH;
}

/** `url` with `?depth=` set to `depth`, or removed for the default depth. Fragment preserved. */
export function urlWithDepth(url: URL, depth: Depth): URL {
  const next = new URL(url.href);
  if (depth === DEFAULT_DEPTH) next.searchParams.delete(DEPTH_PARAM);
  else next.searchParams.set(DEPTH_PARAM, depth);
  return next;
}

/** The current page's absolute URL carrying `depth` (for history.replaceState). */
export function pageUrlWithDepth(pageHref: string, depth: Depth): string {
  return urlWithDepth(new URL(pageHref), depth).href;
}

// Paths that name files (feeds, JSON, PDFs, images) are not pages: their links are left alone.
const FILE_PATH = /\.[A-Za-z0-9]{1,8}$/u;

/**
 * Rewrites an internal page link so it carries the reader's depth. Returns
 * the root-relative href (`/ch05/05-2/?depth=technical#eq-5-4`), or null when
 * the link must not be touched: other origins, non-http(s) schemes, file
 * paths, and same-page fragment links (adding a query would turn an in-page
 * jump into a navigation).
 */
export function linkWithDepth(rawHref: string, depth: Depth, pageHref: string): string | null {
  let page: URL;
  let url: URL;
  try {
    page = new URL(pageHref);
    url = new URL(rawHref, pageHref);
  } catch {
    return null;
  }
  if (url.origin !== page.origin || (url.protocol !== 'https:' && url.protocol !== 'http:')) return null;
  if (FILE_PATH.test(url.pathname)) return null;
  if (url.pathname === page.pathname && url.search === page.search && url.hash !== '') return null;
  const next = urlWithDepth(url, depth);
  return `${next.pathname}${next.search}${next.hash}`;
}
