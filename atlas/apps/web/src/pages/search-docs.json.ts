/**
 * `/search-docs.json` — the typed search documents (core SearchDoc[]) behind
 * the index, validated and served verbatim as a static asset for the client
 * palette (result rows show kind, title, context, url).
 */
import type { APIRoute } from 'astro';
import { readSearchPayload } from '../lib/atlas.ts';

export const prerender = true;

export const GET: APIRoute = async () =>
  new Response(await readSearchPayload('searchDocs'), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
