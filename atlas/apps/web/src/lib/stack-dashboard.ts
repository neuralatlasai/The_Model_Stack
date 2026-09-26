/**
 * Data for the home page's live dashboard (components/home/StackDashboard.astro,
 * client dashboard.ts): one state for the whole book and one per part, all
 * derived from the compiled bundle.
 *
 *   restsOn    chapters a part builds on, through the transitive closure of
 *              declared prerequisites (outside the part itself)
 *   feeds      chapters that build on the part, the same way
 *   tiles      the part's chapters with the share of sections written
 *   evidence   evidence labels used in the part's written manuscripts,
 *              grouped as cited source / derived or assumed / gap
 *   concepts   glossary terms the part's chapters define
 *   status     every chapter as written, in progress, or planned
 */
import { EVIDENCE_CLASS, type EvidenceLabel, type Registry, type ResearchDocument } from '@atlas/core';
import { REGION_LABEL } from './brain3d.ts';
import type { StackModel } from './stack.ts';
import { walkDocument } from './walk.ts';

export type ChapterState = 'written' | 'progress' | 'planned';

export interface DashTile {
  readonly n: number;
  readonly label: string;
  readonly url: string;
  readonly fill: number;
}

export interface DashState {
  readonly part: number;
  readonly badge: string;
  readonly range: string;
  readonly restsOn: number;
  readonly feeds: number;
  readonly written: string;
  readonly drawsOn: readonly string[];
  readonly feedsInto: readonly string[];
  readonly tiles: readonly DashTile[];
  readonly evidence: readonly [number, number, number];
  readonly concepts: readonly string[];
  readonly chapters: readonly number[];
}

export interface Dashboard {
  readonly overview: DashState;
  readonly parts: readonly DashState[];
  readonly line: readonly { readonly part: number; readonly numeral: string; readonly label: string; readonly restsOn: number }[];
  readonly status: readonly { readonly n: number; readonly part: number; readonly state: ChapterState; readonly title: string; readonly url: string }[];
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** Transitive closure over prerequisite edges ([prerequisite, chapter]). */
export function closure(edges: readonly (readonly [number, number])[], direction: 'up' | 'down'): Map<number, Set<number>> {
  const next = new Map<number, number[]>();
  for (const [from, to] of edges) {
    const [a, b] = direction === 'up' ? [to, from] : [from, to];
    next.set(a, [...(next.get(a) ?? []), b]);
  }
  const memo = new Map<number, Set<number>>();
  const visit = (n: number, seen: Set<number>): Set<number> => {
    const known = memo.get(n);
    if (known !== undefined) return known;
    const out = new Set<number>();
    for (const m of next.get(n) ?? []) {
      if (seen.has(m)) continue;
      out.add(m);
      for (const k of visit(m, new Set([...seen, m]))) out.add(k);
    }
    memo.set(n, out);
    return out;
  };
  for (const n of new Set(edges.flat())) visit(n, new Set([n]));
  return memo;
}

/** Evidence labels used per chapter, grouped as [source, inference, gap]. */
export function evidenceByChapter(docs: readonly ResearchDocument[]): Map<number, [number, number, number]> {
  const out = new Map<number, [number, number, number]>();
  const add = (chapter: number, label: EvidenceLabel | null): void => {
    if (label === null) return;
    const cls = EVIDENCE_CLASS[label];
    if (cls === 'measurement') return;
    const row = out.get(chapter) ?? [0, 0, 0];
    row[cls === 'source' ? 0 : cls === 'inference' ? 1 : 2] += 1;
    out.set(chapter, row);
  };
  for (const doc of docs) {
    const chapter = doc.meta.chapter;
    if (chapter === null) continue;
    walkDocument(doc, {
      block: (block) => {
        if (block.kind === 'claim' || block.kind === 'observation') add(chapter, block.label);
      },
      inline: (node) => {
        if (node.kind === 'label') add(chapter, node.label);
      },
    });
  }
  return out;
}

export function buildDashboard(stack: StackModel, registry: Registry, docs: readonly ResearchDocument[]): Dashboard {
  const chapters = Object.values(stack.chapters).sort((a, b) => a.n - b.n);
  const up = closure(stack.edges, 'up');
  const down = closure(stack.edges, 'down');
  const evidence = evidenceByChapter(docs);
  const stateOf = (n: number): ChapterState => {
    const chapter = stack.chapters[String(n)];
    if (chapter === undefined || chapter.sectionsWritten === 0) return 'planned';
    return chapter.written && chapter.sectionsWritten >= chapter.sectionsTotal ? 'written' : 'progress';
  };
  const conceptsOf = (list: readonly number[]): string[] =>
    registry.terms.filter((term) => term.chapter !== null && list.includes(term.chapter)).map((term) => term.term);
  const sumEvidence = (list: readonly number[]): [number, number, number] =>
    list.reduce<[number, number, number]>((acc, n) => {
      const row = evidence.get(n) ?? [0, 0, 0];
      return [acc[0] + row[0], acc[1] + row[1], acc[2] + row[2]];
    }, [0, 0, 0]);
  const partOf = (n: number): number => stack.chapters[String(n)]?.part ?? 0;
  const regionsOf = (set: ReadonlySet<number>, own: number): string[] => {
    const counts = new Map<number, number>();
    for (const n of set) {
      const p = partOf(n);
      if (p !== own && p !== 0) counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => REGION_LABEL[p] ?? '');
  };
  const writtenCount = (list: readonly number[]): string => `${String(list.filter((n) => stateOf(n) === 'written').length)}/${String(list.length)}`;

  const parts: DashState[] = stack.parts.map((part) => {
    const own = new Set(part.chapters);
    const rests = new Set<number>();
    const feeds = new Set<number>();
    for (const n of part.chapters) {
      for (const m of up.get(n) ?? []) if (!own.has(m)) rests.add(m);
      for (const m of down.get(n) ?? []) if (!own.has(m)) feeds.add(m);
    }
    const first = part.chapters[0] ?? 0;
    const last = part.chapters.at(-1) ?? 0;
    return {
      part: part.n,
      badge: `Part ${part.numeral} · ${REGION_LABEL[part.n] ?? part.title}`,
      range: `Chapters ${pad(first)}–${pad(last)}`,
      restsOn: rests.size,
      feeds: feeds.size,
      written: writtenCount(part.chapters),
      drawsOn: regionsOf(rests, part.n).slice(0, 3),
      feedsInto: regionsOf(feeds, part.n).slice(0, 3),
      tiles: part.chapters.map((n) => {
        const chapter = stack.chapters[String(n)];
        return {
          n,
          label: chapter === undefined ? pad(n) : /^chapter \d+/iu.test(chapter.short) ? chapter.title : chapter.short,
          url: chapter?.url ?? '/library/',
          fill: chapter === undefined || chapter.sectionsTotal === 0 ? 0 : chapter.sectionsWritten / chapter.sectionsTotal,
        };
      }),
      evidence: sumEvidence(part.chapters),
      concepts: conceptsOf(part.chapters),
      chapters: part.chapters,
    };
  });

  const all = chapters.map((chapter) => chapter.n);
  const overview: DashState = {
    part: 0,
    badge: 'The Model Stack',
    range: 'Parts I–XI',
    restsOn: 0,
    feeds: 0,
    written: writtenCount(all),
    drawsOn: [],
    feedsInto: [],
    tiles: stack.parts.map((part) => {
      const done = part.chapters.reduce((sum, n) => {
        const chapter = stack.chapters[String(n)];
        return sum + (chapter === undefined || chapter.sectionsTotal === 0 ? 0 : chapter.sectionsWritten / chapter.sectionsTotal);
      }, 0);
      return { n: part.n, label: REGION_LABEL[part.n] ?? part.title, url: part.url, fill: part.chapters.length === 0 ? 0 : done / part.chapters.length };
    }),
    evidence: sumEvidence(all),
    concepts: conceptsOf(all),
    chapters: [],
  };

  return {
    overview,
    parts,
    line: parts.map((state, i) => ({ part: state.part, numeral: stack.parts[i]?.numeral ?? '', label: REGION_LABEL[state.part] ?? '', restsOn: state.restsOn })),
    status: chapters.map((chapter) => ({ n: chapter.n, part: chapter.part, state: stateOf(chapter.n), title: chapter.title, url: chapter.url })),
  };
}
