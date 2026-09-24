/**
 * `/search-index.json` — the MiniSearch index built by the compiler with core
 * SEARCH_INDEX_OPTIONS, served verbatim (after validation) as a static asset.
 * The client loads it lazily on the first ⌘K / Ctrl-K.
 */
import type { APIRoute } from 'astro';
import { readSearchPayload } from '../lib/atlas.ts';

export const prerender = true;

export const GET: APIRoute = async () =>
  new Response(await readSearchPayload('searchIndex'), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
