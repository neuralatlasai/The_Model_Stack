/**
 * Binds the pure URL helpers to the Astro deploy base. Kept separate from
 * url.ts because `import.meta.env` exists only under Vite/Astro.
 */
import type { CitationKey, ImplId } from '@atlas/core';
import { paperUrl, systemUrl } from '@atlas/core';
import { withBase } from './url.ts';

/** Deploy-base-aware href for a compiler-produced, base-relative path. */
export function href(path: string): string {
  return withBase(path, import.meta.env.BASE_URL);
}

/** Paper object page for a citation key (`P01` → `<base>/papers/p01/`). */
export function citeHref(key: CitationKey): string {
  return href(paperUrl(key));
}

/** System page for an implementation id (`impl.vllm` → `<base>/systems/vllm/`). */
export function systemHref(id: ImplId): string {
  return href(systemUrl(id));
}
