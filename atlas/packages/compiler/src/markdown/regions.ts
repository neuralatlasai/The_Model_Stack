/**
 * H2 headings split a document into regions — the unit of scroll
 * synchronisation (UI_UX §11). Each region gets a role from the canonical
 * heading vocabulary (CONTENT_CONTRACT §3, §4, §13), a unique anchor from its
 * heading text, and the role's minimum depth.
 */
import { REGION_HEADINGS, REGION_ROLE_DEPTH, type Depth, type Inline, type RegionRole } from '@atlas/core';
import type { Heading, Root, RootContent } from 'mdast';
import { claimHeadingAnchor, inlineOf } from './convert.ts';
import { plainText } from './inline-utils.ts';
import type { CompileState } from './state.ts';

export interface RegionPlan {
  readonly heading: Heading;
  readonly nodes: readonly RootContent[];
  readonly role: RegionRole;
  readonly title: string;
  readonly titleInline: readonly Inline[];
  readonly anchor: string;
  readonly depth: Depth;
}

export interface DocumentSplit {
  /** Everything before the first H2 (header anatomy + lead). */
  readonly front: readonly RootContent[];
  readonly regions: readonly RegionPlan[];
}

const HEADING_KEYS = Object.keys(REGION_HEADINGS).sort((a, b) => b.length - a.length);

/**
 * Role of an H2 from its text: a leading number (`3. Acceptance criteria`) is
 * ignored, and so is anything after an em dash, a parenthesis, or a colon.
 * Exact vocabulary matches win; otherwise the longest vocabulary entry that is
 * a whole-word prefix (`Acceptance criteria and tolerance rationale`).
 */
export function roleForHeading(text: string): RegionRole | null {
  const unnumbered = text.replace(/^\s*(?:\d+(?:\.\d+)*\.?|[A-Z]\.)\s+/u, '');
  const head = (unnumbered.split(/\s+[—–]\s+|\s*\(|:\s/u)[0] ?? '').replace(/\s+/gu, ' ').trim().toLowerCase();
  const exact = REGION_HEADINGS[head];
  if (exact !== undefined) return exact;
  const prefix = HEADING_KEYS.find((key) => head.startsWith(`${key} `));
  return prefix === undefined ? null : (REGION_HEADINGS[prefix] ?? null);
}

/** Entity types whose H2 vocabulary is fixed by the contract (others use free headings). */
const VOCABULARY_TYPES: ReadonlySet<string> = new Set(['section', 'chapter', 'verification']);

export function splitDocument(root: Root, st: CompileState): DocumentSplit {
  const children = root.children;
  const firstH2 = children.findIndex((node) => node.type === 'heading' && node.depth === 2);
  const front = firstH2 === -1 ? children : children.slice(0, firstH2);
  if (firstH2 === -1) return { front, regions: [] };

  const regions: RegionPlan[] = [];
  let current: { heading: Heading; nodes: RootContent[] } | null = null;
  const flush = (): void => {
    if (current === null) return;
    const titleInline = inlineOf(current.heading.children, st);
    const title = plainText(titleInline).replace(/\s+/gu, ' ').trim();
    const line = st.lineOf(current.heading);
    const known = roleForHeading(title);
    if (known === null && VOCABULARY_TYPES.has(st.input.meta.entityType)) {
      st.report('heading-unknown-region', `"${title}" is not a canonical region heading; role 'other'`, line);
    }
    const role = known ?? 'other';
    regions.push({
      heading: current.heading,
      nodes: current.nodes,
      role,
      title,
      titleInline,
      anchor: claimHeadingAnchor(title, st, line),
      depth: REGION_ROLE_DEPTH[role],
    });
  };
  for (const node of children.slice(firstH2)) {
    if (node.type === 'heading' && node.depth <= 2) {
      flush();
      current = { heading: node, nodes: [] };
    } else if (current !== null) {
      current.nodes.push(node);
    }
  }
  flush();
  return { front, regions };
}
