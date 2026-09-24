/**
 * The per-page JSON data island (`<script type="application/json"
 * id="atlas-page-data">`), parsed with core `PageDataSchema`. The DOM is a
 * trust boundary like any other input: malformed data yields null and the
 * features that need it (previews, inspector, citation copy) degrade to
 * their link fallbacks. Parsed once per island element.
 *
 * Lazy-chunk module: it imports zod through @atlas/core (see contract.ts).
 */
import { PAGE_DATA_ELEMENT_ID, PageDataSchema, type PageData } from '@atlas/core';

const cache = new WeakMap<Element, PageData | null>();

export function pageData(doc: Document): PageData | null {
  const script = doc.getElementById(PAGE_DATA_ELEMENT_ID);
  if (script === null) return null;
  const cached = cache.get(script);
  if (cached !== undefined) return cached;
  let parsed: PageData | null;
  try {
    const result = PageDataSchema.safeParse(JSON.parse(script.textContent));
    parsed = result.success ? result.data : null;
  } catch {
    parsed = null;
  }
  cache.set(script, parsed);
  return parsed;
}
