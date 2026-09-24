/**
 * Web-side URL scheme on top of @atlas/core routes (UI_UX §61). Node URLs come
 * from the compiled bundle (manifest slugs); the atlas views derive their own
 * stable paths from them so a node's map and compare pages mirror its URL.
 *
 *   /<node path>/            the node (document or planned page)
 *   /graph/<node path>/      Map mode: constrained neighbourhood graph
 *   /compare/<node path>/    Compare mode: sibling differentials side by side
 *   /papers/<key>/           paper object (core paperUrl)
 *   /systems/<name>/         reference-stack system (core systemUrl)
 *   /labs/<name>/            lab (core labUrl)
 */
import { normalisePath, type CitationKey, type Depth } from '@atlas/core';

/** Rest-parameter value for `[...slug]` routes: `/a/b/` → `a/b`; the root `/` → undefined. */
export function pathParam(url: string): string | undefined {
  const path = normalisePath(url).slice(1, -1);
  return path === '' ? undefined : path;
}

/** Map-mode page of a node. */
export function mapUrl(nodeUrl: string): string {
  return `/graph${normalisePath(nodeUrl)}`;
}

/** Compare-mode page of a node (only generated for nodes with sibling differentials). */
export function compareUrl(nodeUrl: string): string {
  return `/compare${normalisePath(nodeUrl)}`;
}

/** Route parameter of a paper page; must agree with core `paperUrl` (`R5.13` → `r5-13`). */
export function paperParam(key: CitationKey): string {
  return key.toLowerCase().replaceAll('.', '-');
}

/** Link to a URL at a given reader depth (UI_UX §29: depth persists in the URL). */
export function withDepth(url: string, depth: Depth): string {
  return `${url}?depth=${depth}`;
}

/** Fragment id grouping per-chapter content on index pages (`ch-05`). */
export function chapterFragment(chapter: number): string {
  return `ch-${chapter.toString().padStart(2, '0')}`;
}

/** Stable DOM id derived from a node id (`ms.section.5.2` → `ms-section-5-2`). */
export function domIdFor(prefix: string, nodeId: string): string {
  return `${prefix}-${nodeId.replace(/[^A-Za-z0-9_-]/gu, '-')}`;
}
