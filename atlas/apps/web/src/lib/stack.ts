/**
 * Data for the home page's Stack Explorer: the whole book as one dependency
 * map. Pure functions over the compiled graph and registry, so the explorer's
 * structure is derived — never hand-maintained — and testable without a DOM.
 *
 * Chapter prerequisites come from two sources, merged:
 *  - the plan's prerequisite text for every chapter ("10, 13–14", "48–62");
 *  - chapter-level `prerequisites` edges from manuscripts' frontmatter.
 */
import type { AtlasGraph, GraphNode, Registry } from '@atlas/core';
import { getDocument, getGraph, getRegistry, hasDocument } from './atlas.ts';
import { routeTables } from './reading-routes.ts';

/** "04, 07–09" → [4, 7, 8, 9]. En dash, hyphen, and "to" ranges; ignores text without numbers. */
export function parseChapterList(text: string | null | undefined): number[] {
  if (text === null || text === undefined) return [];
  const out: number[] = [];
  for (const match of text.matchAll(/(\d{1,2})\s*(?:[–—-]|to)\s*(\d{1,2})|(\d{1,2})/gu)) {
    const [, from, to, single] = match;
    if (from !== undefined && to !== undefined) {
      const a = Number(from);
      const b = Number(to);
      for (let n = Math.min(a, b); n <= Math.max(a, b); n += 1) out.push(n);
    } else if (single !== undefined) {
      out.push(Number(single));
    }
  }
  return out;
}

/** Route text in order: "Volume I (01–24) → Part VI (31–36) → 61–62" → [1…24, 31…36, 61, 62], de-duplicated. */
export function parseRoute(text: string): number[] {
  // Prefer the parenthesised ranges when a step names a volume or part; otherwise take the bare numbers.
  const steps = text.split(/→|->|,(?![^(]*\))/u);
  const seen = new Set<number>();
  const out: number[] = [];
  for (const step of steps) {
    const paren = /\(([^)]*)\)/u.exec(step);
    const source = paren?.[1] ?? step.replace(/\b(?:Volume|Part)\s+[IVXLC]+\b/gu, '');
    for (const n of parseChapterList(source)) {
      if (n >= 1 && n <= 66 && !seen.has(n)) {
        seen.add(n);
        out.push(n);
      }
    }
  }
  return out;
}

export interface StackChapter {
  readonly n: number;
  readonly id: string;
  readonly number: string;
  readonly title: string;
  readonly short: string;
  readonly url: string;
  readonly part: number;
  readonly domain: string;
  readonly written: boolean;
  readonly summary: string;
  readonly sectionsWritten: number;
  readonly sectionsTotal: number;
  readonly figures: number;
  readonly equations: number;
  readonly prereqs: readonly number[];
  readonly unlocks: readonly number[];
  readonly upstream: number;
  readonly downstream: number;
}

export interface StackPart {
  readonly n: number;
  readonly id: string;
  readonly numeral: string;
  readonly title: string;
  readonly domain: string;
  readonly volume: number;
  readonly url: string;
  readonly chapters: readonly number[];
}

export interface StackVolume {
  readonly n: number;
  readonly numeral: string;
  readonly title: string;
  readonly url: string;
  readonly parts: readonly number[];
}

export interface StackLineage {
  /** Index in the registry's lineage list — the timeline page anchors entries as `#tl-{id}`. */
  readonly id: number;
  readonly year: number;
  readonly work: string;
  readonly relation: string;
  readonly chapter: number;
}

export interface StackRoute {
  readonly label: string;
  readonly why: string;
  readonly chapters: readonly number[];
}

export interface StackModel {
  readonly volumes: readonly StackVolume[];
  readonly parts: readonly StackPart[];
  readonly chapters: Readonly<Record<string, StackChapter>>;
  readonly edges: readonly (readonly [number, number])[];
  readonly lineage: readonly StackLineage[];
  readonly routes: readonly StackRoute[];
}

/** "Part VII — Inference algorithms" → "Inference algorithms"; titles carry their own numeral prefix. */
const stripNumeral = (title: string): string => title.replace(/^(?:Part|Volume)\s+[IVXLC]+\s*[—–-]\s*/u, '');

const chapterNumberOfId = (id: string): number | null => {
  const match = /^ms\.chapter\.(\d+)$/u.exec(id);
  return match?.[1] === undefined ? null : Number(match[1]);
};

function closureSize(start: number, next: ReadonlyMap<number, readonly number[]>): number {
  const seen = new Set<number>();
  const stack = [...(next.get(start) ?? [])];
  while (stack.length > 0) {
    const n = stack.pop();
    if (n === undefined || seen.has(n)) continue;
    seen.add(n);
    stack.push(...(next.get(n) ?? []));
  }
  return seen.size;
}

export function buildStackModel(
  graph: AtlasGraph,
  registry: Registry,
  routes: readonly { readonly label: string; readonly route: string; readonly why: string }[],
): StackModel {
  const byType = (type: GraphNode['entityType']): GraphNode[] => graph.order.map((id) => graph.nodes[id]).filter((n): n is GraphNode => n?.entityType === type);
  const volumes = byType('volume');
  const parts = byType('part');
  const chapterNodes = byType('chapter');

  const prereqs = new Map<number, Set<number>>();
  for (const chapter of chapterNodes) {
    const n = chapterNumberOfId(chapter.id);
    if (n === null) continue;
    const set = new Set<number>(parseChapterList(chapter.plan?.prerequisitesText).filter((p) => p !== n && p >= 1 && p <= 66));
    prereqs.set(n, set);
  }
  for (const edge of graph.edges) {
    if (edge.type !== 'prerequisite') continue;
    const to = chapterNumberOfId(edge.from);
    const from = chapterNumberOfId(edge.to);
    if (to !== null && from !== null && from !== to) prereqs.get(to)?.add(from);
  }
  const unlocks = new Map<number, number[]>();
  for (const [n, set] of prereqs) for (const p of set) unlocks.set(p, [...(unlocks.get(p) ?? []), n]);
  const prereqLists = new Map<number, number[]>([...prereqs].map(([n, set]) => [n, [...set].sort((a, b) => a - b)]));

  const countBy = (nodeIds: ReadonlySet<string>, items: readonly { readonly nodeId: string }[]): number =>
    items.filter((item) => nodeIds.has(item.nodeId)).length;

  const chapters: Record<string, StackChapter> = {};
  for (const chapter of chapterNodes) {
    const n = chapterNumberOfId(chapter.id);
    if (n === null) continue;
    const sections = chapter.children.map((id) => graph.nodes[id]).filter((c): c is GraphNode => c?.entityType === 'section');
    const owned = new Set<string>([chapter.id, ...chapter.children]);
    const partNumber = chapter.parent === null ? 0 : Number(/\d+$/u.exec(chapter.parent)?.[0] ?? 0);
    chapters[String(n)] = {
      n,
      id: chapter.id,
      number: chapter.number ?? String(n).padStart(2, '0'),
      title: chapter.title,
      short: chapter.shortTitle,
      url: chapter.url,
      part: partNumber,
      domain: chapter.domain,
      written: chapter.hasManuscript,
      summary: chapter.summary ?? chapter.plan?.artifact ?? '',
      sectionsWritten: sections.filter((s) => s.hasManuscript).length,
      sectionsTotal: sections.length,
      figures: registry.objects.filter((o) => o.kind === 'figure' && owned.has(o.nodeId)).length,
      equations: countBy(owned, registry.equations),
      prereqs: prereqLists.get(n) ?? [],
      unlocks: (unlocks.get(n) ?? []).sort((a, b) => a - b),
      upstream: closureSize(n, prereqLists),
      downstream: closureSize(n, unlocks),
    };
  }

  const edges: [number, number][] = [];
  for (const [n, list] of prereqLists) for (const p of list) edges.push([p, n]);

  const lineage: StackLineage[] = registry.lineage
    .map((entry, id): StackLineage | null => {
      const node = graph.nodes[entry.nodeId];
      const chapterId = node?.entityType === 'chapter' ? node.id : (node?.parent ?? '');
      const chapter = chapterNumberOfId(chapterId);
      const year = Number(/\d{4}/u.exec(entry.year)?.[0] ?? Number.NaN);
      return chapter === null || !Number.isFinite(year) ? null : { id, year, work: entry.work, relation: entry.relation, chapter };
    })
    .filter((entry): entry is StackLineage => entry !== null)
    .sort((a, b) => a.year - b.year);

  return {
    volumes: volumes.map((volume) => ({
      n: Number(/\d+$/u.exec(volume.id)?.[0] ?? 0),
      numeral: volume.number ?? '',
      title: stripNumeral(volume.title),
      url: volume.url,
      parts: volume.children.map((id) => Number(/\d+$/u.exec(id)?.[0] ?? 0)).filter((n) => n > 0),
    })),
    parts: parts.map((part) => ({
      n: Number(/\d+$/u.exec(part.id)?.[0] ?? 0),
      id: part.id,
      numeral: part.number ?? '',
      title: stripNumeral(part.title),
      domain: part.domain,
      volume: Number(/\d+$/u.exec(part.parent ?? '')?.[0] ?? 0),
      url: part.url,
      chapters: part.children.map(chapterNumberOfId).filter((n): n is number => n !== null),
    })),
    chapters,
    edges,
    lineage,
    routes: routes
      .map((route) => ({ label: route.label, why: route.why, chapters: parseRoute(route.route) }))
      .filter((route) => route.chapters.length > 1),
  };
}

// ── memoised build-time model (one per build; the graph and registry are immutable) ──

let cached: { readonly graph: AtlasGraph; readonly model: Promise<StackModel> } | null = null;

/**
 * The Stack model for the whole site, shared by the home page and every rail.
 * Memoised per loaded graph: when `npm run compile` rewrites the bundle during
 * `astro dev`, lib/atlas.ts reloads it and the model is rebuilt with it.
 */
export async function getStackModel(): Promise<StackModel> {
  const graph = await getGraph();
  if (cached?.graph !== graph) {
    const model = (async () => {
      const registry = await getRegistry();
      const routesDoc = (await hasDocument('ms.frontmatter.reading-routes')) ? await getDocument('ms.frontmatter.reading-routes') : null;
      return buildStackModel(graph, registry, routesDoc === null ? [] : routeTables(routesDoc).flatMap((table) => table.rows));
    })();
    cached = { graph, model };
  }
  return cached.model;
}
