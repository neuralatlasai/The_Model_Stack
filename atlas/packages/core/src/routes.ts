/**
 * URL scheme (UI_UX §61). Slugs are the stable URLs (CONTENT_CONTRACT §1.1),
 * so every path is derived from manifest slugs and never from titles. Paths
 * are base-relative and end with `/`; the web app prefixes its deploy base.
 */
import type { CitationKey, ImplId, LabId, NodeId } from './ids.ts';

export type UrlInput =
  | { readonly type: 'volume' | 'part' | 'chapter'; readonly slug: string }
  | { readonly type: 'section'; readonly chapterSlug: string; readonly slug: string }
  | { readonly type: 'verification' | 'references'; readonly chapterSlug: string }
  | { readonly type: 'appendix'; readonly slug: string }
  | { readonly type: 'frontmatter'; readonly slug: string };

export function urlForNode(input: UrlInput): string {
  switch (input.type) {
    case 'volume':
    case 'part':
    case 'chapter':
      return `/${input.slug}/`;
    case 'section':
      return `/${input.chapterSlug}/${input.slug}/`;
    case 'verification':
      return `/${input.chapterSlug}/verification/`;
    case 'references':
      return `/${input.chapterSlug}/references/`;
    case 'appendix':
      return `/appendices/${input.slug}/`;
    case 'frontmatter':
      return `/front-matter/${input.slug}/`;
  }
}

/** `P01` → `/papers/p01/`; `R5.13` → `/papers/r5-13/`. */
export function paperUrl(key: CitationKey): string {
  return `/papers/${key.toLowerCase().replaceAll('.', '-')}/`;
}

/** `impl.vllm` → `/systems/vllm/`. */
export function systemUrl(id: ImplId): string {
  return `/systems/${id.slice('impl.'.length)}/`;
}

/** `lab.deepseek` → `/labs/deepseek/`. */
export function labUrl(id: LabId): string {
  return `/labs/${id.slice('lab.'.length)}/`;
}

export function termAnchor(slug: string): string {
  return `term-${slug}`;
}

/** Top-level destinations (UI_UX §35). Order is the navigation order. */
export const TOP_NAV = [
  { key: 'atlas', label: 'Atlas', url: '/' },
  { key: 'library', label: 'Library', url: '/library/' },
  { key: 'papers', label: 'Papers', url: '/papers/' },
  { key: 'systems', label: 'Systems', url: '/systems/' },
  { key: 'labs', label: 'Labs', url: '/labs/' },
  { key: 'timeline', label: 'Timeline', url: '/timeline/' },
  { key: 'graph', label: 'Graph', url: '/graph/' },
] as const;
export type TopNavKey = (typeof TOP_NAV)[number]['key'];

export interface Crumb {
  readonly id: NodeId;
  readonly title: string;
  readonly number: string | null;
  readonly url: string;
}

export interface RouteRef {
  readonly id: NodeId;
  readonly title: string;
  readonly number: string | null;
  readonly url: string;
}

export interface Route {
  readonly url: string;
  /** Root → parent; excludes the node itself. Quiet conceptual hierarchy (UI_UX §34). */
  readonly breadcrumbs: readonly Crumb[];
  /** Reading-order neighbours (section 5.1 → 5.2 …; chapter pages chain through their sections). */
  readonly prev: RouteRef | null;
  readonly next: RouteRef | null;
}

/** Normalises a path for comparison: leading slash, trailing slash, no query/hash. */
export function normalisePath(path: string): string {
  const bare = path.split(/[?#]/u, 1)[0] ?? '/';
  const withLead = bare.startsWith('/') ? bare : `/${bare}`;
  return withLead.endsWith('/') ? withLead : `${withLead}/`;
}
