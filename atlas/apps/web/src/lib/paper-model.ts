/**
 * Data for a paper page (pages/papers/[key].astro): one registry work as a
 * connected object. Pure functions over the compiled graph, the registry, and
 * the Stack model; nothing is inferred beyond them.
 *
 *   chapters   every chapter that records a use of the work or holds a page
 *              citing it, with those pages (weight = citing pages)
 *   cocited    works cited on the same pages as this one — the overlap of the
 *              registry's `citedBy` node ids — ranked by shared pages
 *   lineage    timeline entries whose `cite` is this key, with their index in
 *              `registry.lineage` (the timeline anchors entries `#tl-{index}`)
 */
import type { AtlasGraph, GraphNode, LineageEntry, NodeId, ReferenceRecord, Registry } from '@atlas/core';
import { compareStrings } from './format.ts';
import { relationKey } from './lineage-strip.ts';
import { enclosing } from './nodes.ts';
import type { StackModel } from './stack.ts';

export interface PaperPageRef {
  readonly id: string;
  /** `4.1` for a section, `ch` for the chapter page, `ver` / `refs` for its verification / references pages. */
  readonly label: string;
  readonly title: string;
  readonly url: string;
}

export interface PaperUse {
  readonly usedFor: string;
  readonly accessed: string | null;
}

export interface PaperChapter {
  readonly n: number;
  readonly number: string;
  readonly title: string;
  readonly short: string;
  readonly url: string;
  readonly pages: readonly PaperPageRef[];
  readonly uses: readonly PaperUse[];
}

export interface PaperCocited {
  readonly key: string;
  readonly work: string;
  readonly url: string;
  readonly spine: boolean;
  readonly shared: readonly PaperPageRef[];
  /** Chapters of the shared pages. */
  readonly chapters: readonly number[];
}

export interface PaperLineage {
  readonly index: number;
  readonly year: string;
  readonly relation: string;
  readonly relationKey: string;
  readonly work: string;
  readonly note: LineageEntry['note'];
  readonly chapter: number | null;
  readonly owner: { readonly number: string | null; readonly title: string; readonly url: string } | null;
}

export interface PaperGridLane {
  readonly numeral: string;
  readonly title: string;
  readonly url: string;
  readonly chapters: readonly { readonly n: number; readonly number: string; readonly short: string; readonly title: string; readonly url: string; readonly written: boolean }[];
}

export interface PaperModel {
  readonly chapters: readonly PaperChapter[];
  readonly lanes: readonly (readonly PaperGridLane[])[];
  readonly cocited: readonly PaperCocited[];
  /** Works sharing at least one page with this one (the list shows the top few). */
  readonly cocitedTotal: number;
  readonly lineage: readonly PaperLineage[];
  /** Citing pages outside any chapter (front matter, appendices). */
  readonly otherPages: readonly PaperPageRef[];
  readonly pages: number;
}

const COCITED_SHOWN = 8;

const chapterNumber = (node: GraphNode | null): number | null => {
  const match = node === null ? null : /^ms\.chapter\.(\d+)$/u.exec(node.id);
  return match?.[1] === undefined ? null : Number(match[1]);
};

function pageRef(node: GraphNode): PaperPageRef {
  const label =
    node.entityType === 'section'
      ? (node.number ?? 'sec')
      : node.entityType === 'chapter'
        ? 'ch'
        : node.entityType === 'verification'
          ? 'ver'
          : node.entityType === 'references'
            ? 'refs'
            : (node.number ?? '·');
  return { id: node.id, label, title: node.title, url: node.url };
}

/** Graph order for stable page ordering (chapter page, sections, verification, references). */
const orderIndex = (graph: AtlasGraph): Map<string, number> => new Map(graph.order.map((id, index) => [id, index]));

export function buildPaperModel(record: ReferenceRecord, graph: AtlasGraph, registry: Registry, stack: StackModel): PaperModel {
  const order = orderIndex(graph);
  const byOrder = (a: PaperPageRef, b: PaperPageRef): number => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
  const chapterOfId = (id: string): number | null => chapterNumber(enclosing(graph, id as NodeId, 'chapter'));

  const pagesBy = new Map<number, PaperPageRef[]>();
  const otherPages: PaperPageRef[] = [];
  for (const id of record.citedBy) {
    const node = graph.nodes[id];
    if (node === undefined) continue;
    const n = chapterOfId(id);
    if (n === null) otherPages.push(pageRef(node));
    else pagesBy.set(n, [...(pagesBy.get(n) ?? []), pageRef(node)]);
  }
  const usesBy = new Map<number, PaperUse[]>();
  for (const use of record.uses) usesBy.set(use.chapter, [...(usesBy.get(use.chapter) ?? []), { usedFor: use.usedFor, accessed: use.accessed }]);

  const chapters: PaperChapter[] = [...new Set([...pagesBy.keys(), ...usesBy.keys()])]
    .sort((a, b) => a - b)
    .map((n) => {
      const chapter = stack.chapters[String(n)];
      return {
        n,
        number: chapter?.number ?? String(n).padStart(2, '0'),
        title: chapter?.title ?? `Chapter ${String(n)}`,
        short: chapter?.short ?? `Chapter ${String(n)}`,
        url: chapter?.url ?? '/library/',
        pages: [...(pagesBy.get(n) ?? [])].sort(byOrder),
        uses: usesBy.get(n) ?? [],
      };
    });

  const lanes: PaperGridLane[][] = stack.volumes.map((volume) =>
    volume.parts
      .map((p) => stack.parts.find((part) => part.n === p))
      .filter((part) => part !== undefined)
      .map((part) => ({
        numeral: part.numeral,
        title: part.title,
        url: part.url,
        chapters: part.chapters
          .map((n) => stack.chapters[String(n)])
          .filter((c) => c !== undefined)
          .map((c) => ({ n: c.n, number: c.number, short: c.short, title: c.title, url: c.url, written: c.written })),
      })),
  );

  const mine = new Set(record.citedBy);
  const ranked = registry.references
    .filter((other) => other.key !== record.key)
    .map((other) => ({ other, shared: other.citedBy.filter((id) => mine.has(id)) }))
    .filter((entry) => entry.shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length || Number(b.other.spine) - Number(a.other.spine) || compareStrings(a.other.key, b.other.key));
  const cocited: PaperCocited[] = ranked.slice(0, COCITED_SHOWN).map(({ other, shared }) => {
    const refs = shared
      .map((id) => graph.nodes[id])
      .filter((node): node is GraphNode => node !== undefined)
      .map(pageRef)
      .sort(byOrder);
    return {
      key: other.key,
      work: other.work,
      url: other.atlasUrl,
      spine: other.spine,
      shared: refs,
      chapters: [...new Set(shared.map(chapterOfId).filter((n): n is number => n !== null))].sort((a, b) => a - b),
    };
  });

  const lineage: PaperLineage[] = registry.lineage
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.cite === record.key)
    .map(({ entry, index }) => {
      const owner = graph.nodes[entry.nodeId] ?? null;
      return {
        index,
        year: entry.year,
        relation: entry.relation,
        relationKey: relationKey(entry.relation),
        work: entry.work,
        note: entry.note,
        chapter: chapterOfId(entry.nodeId),
        owner: owner === null ? null : { number: owner.number, title: owner.title, url: owner.url },
      };
    });

  return {
    chapters,
    lanes,
    cocited,
    cocitedTotal: ranked.length,
    lineage,
    otherPages: otherPages.sort(byOrder),
    pages: record.citedBy.length,
  };
}
