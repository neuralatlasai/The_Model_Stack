/** Small chapter indexes shared by the static endpoint and its lazy tree loader. */
import { z } from 'zod';
import { chapterNumberOf, parseNodeId, type AtlasGraph } from '@atlas/core';
import { safeInternalHref, withBase } from '../client/urls.ts';

const ChildSchema = z.strictObject({
  id: z.string().max(100),
  number: z.string().max(16).nullable(),
  title: z.string().min(1).max(400),
  url: z.string().min(1).max(500),
  hasManuscript: z.boolean(),
});

const PayloadSchema = z.strictObject({
  version: z.literal(1),
  id: z.string().max(100),
  url: z.string().min(1).max(500),
  children: z.array(ChildSchema).min(1).max(32),
});

export type TreeChildrenPayload = z.output<typeof PayloadSchema>;
export type TreeChild = z.output<typeof ChildSchema>;

/** The graph owns titles, ordering and publication state; this endpoint adds no editorial data. */
export function buildTreeChildren(graph: AtlasGraph, chapterId: string): TreeChildrenPayload | null {
  const chapter = graph.nodes[chapterId];
  if (chapter?.entityType !== 'chapter' || !chapter.hasManuscript) return null;
  const children = chapter.children.flatMap((id): TreeChild[] => {
    const child = graph.nodes[id];
    if (child === undefined) return [];
    return [{ id, number: child.number, title: child.shortTitle, url: child.url, hasManuscript: child.hasManuscript }];
  });
  return children.length === 0 ? null : { version: 1, id: chapter.id, url: chapter.url, children };
}

/** Validate a fetched index before it can create links or change the navigation tree. */
export function parseTreeChildren(
  raw: unknown,
  chapterId: string,
  base: string,
  origin: string,
  expectedChapterUrl: string,
): readonly TreeChild[] {
  const payload = PayloadSchema.parse(raw);
  const number = chapterNumberOf(chapterId);
  if (payload.id !== chapterId || !/^ms\.chapter\.[1-9]\d*$/u.test(chapterId) || number === null)
    throw new Error('Chapter index identity mismatch');
  const resolve = (rawUrl: string): URL => {
    const safe = safeInternalHref(rawUrl);
    if (safe === null) throw new Error('Unsafe chapter index URL');
    const url = new URL(withBase(base, safe), origin);
    if (url.origin !== origin || !url.pathname.startsWith(base) || url.search !== '' || url.hash !== '')
      throw new Error('Chapter index URL leaves the deployment base');
    return url;
  };
  const parent = resolve(payload.url);
  if (!parent.pathname.endsWith('/') || parent.href !== resolve(expectedChapterUrl).href)
    throw new Error('Chapter index path does not match its trigger');
  const seen = new Set<string>();
  return payload.children.map((child) => {
    const id = parseNodeId(child.id);
    const url = resolve(child.url);
    if (
      id === null ||
      !/^ms\.(?:section|verification|references)\./u.test(id) ||
      chapterNumberOf(id) !== number ||
      seen.has(id) ||
      !url.pathname.startsWith(parent.pathname) ||
      url.pathname === parent.pathname
    )
      throw new Error('Invalid chapter index child');
    seen.add(id);
    return { ...child, url: url.pathname };
  });
}
