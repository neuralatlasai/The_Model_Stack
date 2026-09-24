/**
 * Pure logic of the ⌘K / Ctrl-K palette (UI_UX §32–33): query-mode parsing,
 * command catalogue and ranking, grouping of search hits by object type, and
 * the plain-text page citation. Unit-tested; palette.ts renders it.
 */
import { SEARCH_KIND_LABELS, type SearchHit, type SearchKind } from '@atlas/core';

export type ParsedQuery = { readonly mode: 'search'; readonly text: string } | { readonly mode: 'command'; readonly text: string };

/** A query starting with `>` is a command query (UI_UX §33); anything else searches. */
export function parseQuery(raw: string): ParsedQuery {
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('>')) return { mode: 'command', text: trimmed.slice(1).trim() };
  return { mode: 'search', text: raw.trim() };
}

export const COMMAND_IDS = [
  'go-to-concept',
  'open-graph',
  'compare',
  'copy-citation',
  'show-prerequisites',
  'depth-overview',
  'depth-technical',
  'depth-research',
  'depth-implementation',
  'toggle-dark',
  'equation-inspector',
  'bookmark',
  'copy-link',
] as const;
export type CommandId = (typeof COMMAND_IDS)[number];

export interface CommandSpec {
  readonly id: CommandId;
  readonly title: string;
  readonly keywords: readonly string[];
}

export const COMMANDS: readonly CommandSpec[] = [
  { id: 'go-to-concept', title: 'Go to concept', keywords: ['find', 'section', 'chapter', 'term', 'navigate'] },
  { id: 'open-graph', title: 'Open graph for this page', keywords: ['map', 'neighbourhood', 'neighborhood', 'relations'] },
  { id: 'compare', title: 'Compare this section', keywords: ['siblings', 'alternatives', 'differential'] },
  { id: 'copy-citation', title: 'Copy citation for this page', keywords: ['cite', 'reference', 'clipboard'] },
  { id: 'show-prerequisites', title: 'Show prerequisites', keywords: ['position', 'depends', 'downstream', 'siblings'] },
  { id: 'depth-overview', title: 'Depth: Overview', keywords: ['toggle depth', 'narrative', 'intuition'] },
  { id: 'depth-technical', title: 'Depth: Technical', keywords: ['toggle depth', 'equations', 'algorithms'] },
  { id: 'depth-research', title: 'Depth: Research', keywords: ['toggle depth', 'experiments', 'papers', 'evidence'] },
  { id: 'depth-implementation', title: 'Depth: Implementation', keywords: ['toggle depth', 'code', 'systems'] },
  { id: 'toggle-dark', title: 'Toggle dark mode', keywords: ['theme', 'light', 'dark', 'colour', 'color'] },
  { id: 'equation-inspector', title: 'Open equation inspector', keywords: ['variables', 'math', 'formula'] },
  { id: 'bookmark', title: 'Bookmark this section', keywords: ['save', 'reading list'] },
  { id: 'copy-link', title: 'Copy link to this section', keywords: ['share', 'url', 'anchor', 'clipboard'] },
];

function scoreToken(title: string, keywords: readonly string[], token: string): number {
  if (title.startsWith(token)) return 3;
  if (title.split(/[\s:—-]+/u).some((word) => word.startsWith(token))) return 2;
  if (title.includes(token)) return 1;
  if (keywords.some((keyword) => keyword.startsWith(token) || keyword.split(/\s+/u).some((word) => word.startsWith(token)))) return 0.5;
  return 0;
}

/**
 * Commands matching every token of `text` (title first, then keywords),
 * best first; ties keep catalogue order. An empty query lists everything.
 */
export function rankCommands<T extends { readonly title: string; readonly keywords: readonly string[] }>(commands: readonly T[], text: string): T[] {
  const tokens = text.toLocaleLowerCase().split(/\s+/u).filter((token) => token !== '');
  if (tokens.length === 0) return [...commands];
  const scored: { readonly command: T; readonly score: number; readonly index: number }[] = [];
  commands.forEach((command, index) => {
    const title = command.title.toLocaleLowerCase();
    const keywords = command.keywords.map((keyword) => keyword.toLocaleLowerCase());
    let score = 0;
    for (const token of tokens) {
      const tokenScore = scoreToken(title, keywords, token);
      if (tokenScore === 0) return;
      score += tokenScore;
    }
    scored.push({ command, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((entry) => entry.command);
}

export interface HitGroup {
  readonly kind: SearchKind;
  readonly label: string;
  readonly hits: readonly SearchHit[];
}

/**
 * Keeps the `limit` best hits and groups them by object type. Groups are
 * ordered by their best hit, hits within a group by score, so the first
 * option is always the overall best match.
 */
export function groupHits(hits: readonly SearchHit[], limit: number): HitGroup[] {
  const best = [...hits].sort((a, b) => b.score - a.score).slice(0, Math.max(0, limit));
  const groups = new Map<SearchKind, SearchHit[]>();
  for (const hit of best) {
    const list = groups.get(hit.kind);
    if (list === undefined) groups.set(hit.kind, [hit]);
    else list.push(hit);
  }
  return [...groups.entries()].map(([kind, list]) => ({ kind, label: SEARCH_KIND_LABELS[kind], hits: list }));
}

/** Object kinds reachable through "Go to concept". */
export const CONCEPT_KINDS: ReadonlySet<SearchKind> = new Set<SearchKind>(['volume', 'part', 'chapter', 'section', 'term']);

/** Type line under a result: `CONCEPT · Foundations / Minimal Transformer`. */
export function typeLine(hit: Pick<SearchHit, 'kind' | 'context'>): string {
  const label = SEARCH_KIND_LABELS[hit.kind];
  return hit.context.trim() === '' ? label : `${label} · ${hit.context}`;
}

/** `§5.2` for sections, `Chapter 5` for chapter pages, else null. */
export function locator(nodeId: string | null): string | null {
  if (nodeId === null) return null;
  const section = /^ms\.section\.(\d+\.\d+)$/u.exec(nodeId);
  if (section?.[1] !== undefined) return `§${section[1]}`;
  const chapter = /^ms\.chapter\.(\d+)$/u.exec(nodeId);
  if (chapter?.[1] !== undefined) return `Chapter ${chapter[1]}`;
  return null;
}

/** Plain-text citation of the current page: `Title — The Model Stack, §5.2, https://…/`. */
export function formatCitation(title: string, nodeId: string | null, url: string): string {
  const parts = [`${title.trim()} — The Model Stack`];
  const where = locator(nodeId);
  if (where !== null) parts.push(where);
  parts.push(url);
  return parts.join(', ');
}
