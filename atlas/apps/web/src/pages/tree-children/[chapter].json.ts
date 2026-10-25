/** Deferred chapter children: a few leaf links instead of repeating every section in every page. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getGraph } from '../../lib/atlas.ts';
import { buildTreeChildren } from '../../lib/tree-children.ts';

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const graph = await getGraph();
  return Object.values(graph.nodes)
    .filter((node) => node.entityType === 'chapter' && node.hasManuscript && node.children.length > 0)
    .map((node) => ({ params: { chapter: String(Number(node.number)) } }));
};

export const GET: APIRoute = async ({ params }) => {
  const payload = buildTreeChildren(await getGraph(), `ms.chapter.${params['chapter'] ?? ''}`);
  return payload === null
    ? new Response(null, { status: 404 })
    : new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
