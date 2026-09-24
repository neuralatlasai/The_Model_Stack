/**
 * The five views of one research node (UI_UX §9): Read · Map · Papers ·
 * Implementations · Compare. Every target is a static page or fragment, so the
 * mode strip works without JavaScript.
 */
import type { AtlasGraph, NodeId } from '@atlas/core';
import { chapterFragment, compareUrl, mapUrl } from './urls.ts';

export const MODES = ['read', 'map', 'papers', 'implementations', 'compare'] as const;
export type Mode = (typeof MODES)[number];

export const MODE_LABELS: Readonly<Record<Mode, string>> = {
  read: 'Read',
  map: 'Map',
  papers: 'Papers',
  implementations: 'Implementations',
  compare: 'Compare',
};

export type ModeLinks = Readonly<Record<Mode, string>>;

export interface ModeInput {
  readonly graph: AtlasGraph;
  readonly url: string;
  readonly chapter: number | null;
  /** Anchor of the page's own references region, when it has one. */
  readonly referencesAnchor: string | null;
  /** True when a compare page exists for this node (it has sibling differentials). */
  readonly hasCompare: boolean;
}

export function modeLinks({ graph, url, chapter, referencesAnchor, hasCompare }: ModeInput): ModeLinks {
  const referencesNode = chapter === null ? undefined : graph.nodes[`ms.references.${String(chapter)}` as NodeId];
  let papers = '/papers/';
  if (referencesAnchor !== null) papers = `${url}#${referencesAnchor}`;
  else if (referencesNode?.hasManuscript) papers = referencesNode.url;

  let compare = '/compare/';
  if (hasCompare) compare = compareUrl(url);
  else if (chapter !== null) compare = `/compare/#${chapterFragment(chapter)}`;

  return {
    read: url,
    map: mapUrl(url),
    papers,
    implementations: chapter === null ? '/systems/' : `/systems/#${chapterFragment(chapter)}`,
    compare,
  };
}
