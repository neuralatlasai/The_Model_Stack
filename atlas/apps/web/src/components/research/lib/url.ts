/**
 * URL helpers for research-block renderers. Pure (no Vite/Astro globals) so
 * they run under `node --test`; `site.ts` binds them to the deploy base.
 *
 * Compiler output carries base-relative paths (`/papers/p01/`,
 * `/ch05-…/05-2-…/#eq-5-4`); core routes.ts leaves the deploy-base prefix to
 * the web app. Hrefs are also a trust boundary for XSS: only http(s)/mailto
 * external links and root-relative or fragment internal links are emitted.
 */

const SAFE_EXTERNAL_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:', 'mailto:']);

/** Prefixes a root-relative atlas path with the deploy base. Fragments and absolute URLs pass through unchanged. */
export function withBase(href: string, base: string): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const trimmed = base.endsWith('/') ? base.slice(0, -1) : base;
  return `${trimmed}${href}`;
}

/** True for an absolute http(s)/mailto URL; `javascript:`, `data:` and relative strings are rejected. */
export function isSafeExternalHref(href: string): boolean {
  if (!URL.canParse(href)) return false;
  return SAFE_EXTERNAL_PROTOCOLS.has(new URL(href).protocol);
}

/**
 * `https://www.anthropic.com/research/team/interpretability` → `anthropic.com/research/team/interpre…`.
 * Display only; the href and title keep the full URL.
 */
export function shortUrl(href: string, max = 38): string {
  if (!URL.canParse(href)) return href;
  const url = new URL(href);
  const host = url.hostname.replace(/^www\./u, '');
  const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/u, '');
  const text = `${host}${path}`;
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/** True when a link's visible text is just its own URL (as typed in Markdown tables and autolinks). */
export function isBareUrl(children: readonly { readonly kind: string; readonly value?: string }[], href: string): boolean {
  if (children.length !== 1) return false;
  const only = children[0];
  if (only === undefined || (only.kind !== 'text' && only.kind !== 'code')) return false;
  const text = (only.value ?? '').trim().replace(/\/$/u, '');
  return text === href.replace(/\/$/u, '') || text === href.replace(/^https?:\/\//u, '').replace(/\/$/u, '');
}

/** True for a root-relative path (not protocol-relative) or a same-page fragment. */
export function isInternalHref(href: string): boolean {
  return (href.startsWith('/') && !href.startsWith('//')) || href.startsWith('#');
}

/** `#anchor` for a fragment id. */
export function fragment(anchor: string): string {
  return `#${anchor}`;
}

/** `DERIVED:eq-5.8` → `{ number: '5.8', anchor: 'eq-5-8' }`; null when the source is not an equation derivation. */
export function derivedEquation(raw: string): { readonly number: string; readonly anchor: string } | null {
  const match = /^DERIVED:\s*eq-(\d+\.\d+)$/iu.exec(raw.trim());
  const number = match?.[1];
  return number === undefined ? null : { number, anchor: `eq-${number.replaceAll('.', '-')}` };
}
