/**
 * Data for the Library page (components/shell/LibraryExplorer.astro): the
 * manuscript as an instrument. Pure functions over the compiled graph, the
 * registry, and the Stack model, so every number the page shows is derived
 * from the bundle and never hand-maintained.
 *
 *   chapter  words = the chapter node plus its sections, verification and
 *            references pages; figures and equations are the registry's
 *            objects on those nodes; works = registry references whose uses or
 *            citing pages fall in the chapter
 *   section  drafted = the section node has a manuscript
 */
import type { AtlasGraph, GraphNode, NodeId, Registry } from '@atlas/core';
import { stateLabel } from './format.ts';
import { enclosing } from './nodes.ts';
import type { StackModel } from './stack.ts';

export interface LibrarySection {
  readonly number: string;
  readonly title: string;
  readonly url: string;
  readonly written: boolean;
  readonly words: number;
  readonly figures: number;
}

export interface LibraryChapter {
  readonly n: number;
  readonly number: string;
  readonly title: string;
  readonly short: string;
  readonly url: string;
  readonly part: number;
  readonly domain: string;
  readonly written: boolean;
  readonly state: string;
  readonly summary: string;
  /** The book plan's artifact for the chapter (what it will produce); '' when the plan records none. */
  readonly plan: string;
  readonly words: number;
  readonly figures: number;
  readonly equations: number;
  readonly works: number;
  readonly sections: readonly LibrarySection[];
  readonly sectionsWritten: number;
  readonly prereqs: readonly number[];
  readonly unlocks: readonly number[];
  readonly upstream: number;
  readonly downstream: number;
}

export interface LibraryPart {
  readonly n: number;
  readonly numeral: string;
  readonly title: string;
  readonly url: string;
  readonly domain: string;
  readonly outcome: string | null;
  readonly chapters: readonly number[];
  readonly written: number;
  readonly sectionsWritten: number;
  readonly sectionsTotal: number;
  readonly words: number;
}

export interface LibraryVolume {
  readonly n: number;
  readonly numeral: string;
  readonly title: string;
  readonly url: string;
  readonly parts: readonly number[];
  readonly chapters: number;
  readonly written: number;
  readonly sectionsWritten: number;
  readonly sectionsTotal: number;
}

export interface LibraryShelfItem {
  readonly number: string | null;
  readonly title: string;
  readonly url: string;
  readonly written: boolean;
  readonly state: string;
  readonly words: number;
}

export interface LibraryTotals {
  readonly chapters: number;
  readonly chaptersWritten: number;
  readonly sections: number;
  readonly sectionsWritten: number;
  readonly words: number;
  readonly figures: number;
  readonly figuresInChapters: number;
  readonly equations: number;
  readonly equationsInChapters: number;
  readonly references: number;
  readonly spine: number;
  readonly maxWords: number;
  readonly maxFigures: number;
  readonly maxEquations: number;
  readonly maxWorks: number;
}

export interface LibraryModel {
  readonly volumes: readonly LibraryVolume[];
  readonly parts: readonly LibraryPart[];
  readonly chapters: readonly LibraryChapter[];
  readonly shelf: readonly LibraryShelfItem[];
  readonly totals: LibraryTotals;
}

const chapterNumberOf = (graph: AtlasGraph, id: string): number | null => {
  const chapter = enclosing(graph, id as NodeId, 'chapter');
  const match = chapter === null ? null : /^ms\.chapter\.(\d+)$/u.exec(chapter.id);
  return match?.[1] === undefined ? null : Number(match[1]);
};

const tally = (items: readonly { readonly nodeId: string }[]): Map<string, number> => {
  const out = new Map<string, number>();
  for (const item of items) out.set(item.nodeId, (out.get(item.nodeId) ?? 0) + 1);
  return out;
};

export function buildLibraryModel(graph: AtlasGraph, registry: Registry, stack: StackModel): LibraryModel {
  const figureCount = tally(registry.objects.filter((object) => object.kind === 'figure'));

  // Works cited per chapter: a reference counts once for every chapter that records a use or holds a citing page.
  const works = new Map<number, number>();
  for (const record of registry.references) {
    const chapters = new Set<number>(record.uses.map((use) => use.chapter));
    for (const id of record.citedBy) {
      const n = chapterNumberOf(graph, id);
      if (n !== null) chapters.add(n);
    }
    for (const n of chapters) works.set(n, (works.get(n) ?? 0) + 1);
  }

  const chapters: LibraryChapter[] = Object.values(stack.chapters)
    .sort((a, b) => a.n - b.n)
    .map((chapter) => {
      const node = graph.nodes[chapter.id as NodeId];
      const children = (node?.children ?? []).map((id) => graph.nodes[id]).filter((child): child is GraphNode => child !== undefined);
      const sections: LibrarySection[] = children
        .filter((child) => child.entityType === 'section')
        .map((section) => ({
          number: section.number ?? '',
          title: section.title,
          url: section.url,
          written: section.hasManuscript,
          words: section.wordCount,
          figures: figureCount.get(section.id) ?? 0,
        }));
      const words = (node?.wordCount ?? 0) + children.reduce((sum, child) => sum + child.wordCount, 0);
      return {
        n: chapter.n,
        number: chapter.number,
        title: chapter.title,
        short: chapter.short,
        url: chapter.url,
        part: chapter.part,
        domain: chapter.domain,
        written: chapter.written,
        state: node === undefined ? 'planned' : stateLabel(node.state),
        summary: node?.summary ?? '',
        plan: node?.plan?.artifact ?? '',
        words,
        figures: chapter.figures,
        equations: chapter.equations,
        works: works.get(chapter.n) ?? 0,
        sections,
        sectionsWritten: sections.filter((section) => section.written).length,
        prereqs: chapter.prereqs,
        unlocks: chapter.unlocks,
        upstream: chapter.upstream,
        downstream: chapter.downstream,
      };
    });
  const byN = new Map(chapters.map((chapter) => [chapter.n, chapter]));
  const inPart = (list: readonly number[]): LibraryChapter[] => list.map((n) => byN.get(n)).filter((c): c is LibraryChapter => c !== undefined);

  const parts: LibraryPart[] = stack.parts
    .map((part) => {
      const members = inPart(part.chapters);
      const node = graph.nodes[part.id as NodeId];
      return {
        n: part.n,
        numeral: part.numeral,
        title: part.title,
        url: part.url,
        domain: part.domain,
        outcome: node?.plan?.outcome ?? null,
        chapters: part.chapters,
        written: members.filter((c) => c.written).length,
        sectionsWritten: members.reduce((sum, c) => sum + c.sectionsWritten, 0),
        sectionsTotal: members.reduce((sum, c) => sum + c.sections.length, 0),
        words: members.reduce((sum, c) => sum + c.words, 0),
      };
    })
    .sort((a, b) => a.n - b.n);
  const partByN = new Map(parts.map((part) => [part.n, part]));

  const volumes: LibraryVolume[] = stack.volumes.map((volume) => {
    const members = volume.parts.map((n) => partByN.get(n)).filter((p): p is LibraryPart => p !== undefined);
    return {
      n: volume.n,
      numeral: volume.numeral,
      title: volume.title,
      url: volume.url,
      parts: volume.parts,
      chapters: members.reduce((sum, p) => sum + p.chapters.length, 0),
      written: members.reduce((sum, p) => sum + p.written, 0),
      sectionsWritten: members.reduce((sum, p) => sum + p.sectionsWritten, 0),
      sectionsTotal: members.reduce((sum, p) => sum + p.sectionsTotal, 0),
    };
  });

  const shelf: LibraryShelfItem[] = graph.order
    .map((id) => graph.nodes[id])
    .filter((node): node is GraphNode => node !== undefined && (node.entityType === 'frontmatter' || node.entityType === 'appendix') && node.id !== 'ms.root')
    .map((node) => ({
      number: node.number,
      title: node.title,
      url: node.url,
      written: node.hasManuscript,
      state: stateLabel(node.state),
      words: node.wordCount,
    }));

  const chapterIds = new Set<string>();
  for (const chapter of Object.values(stack.chapters)) {
    chapterIds.add(chapter.id);
    for (const id of graph.nodes[chapter.id as NodeId]?.children ?? []) chapterIds.add(id);
  }
  const totals: LibraryTotals = {
    chapters: chapters.length,
    chaptersWritten: chapters.filter((c) => c.written).length,
    sections: chapters.reduce((sum, c) => sum + c.sections.length, 0),
    sectionsWritten: chapters.reduce((sum, c) => sum + c.sectionsWritten, 0),
    words: chapters.reduce((sum, c) => sum + c.words, 0),
    figures: registry.objects.filter((object) => object.kind === 'figure').length,
    figuresInChapters: chapters.reduce((sum, c) => sum + c.figures, 0),
    equations: registry.equations.length,
    equationsInChapters: registry.equations.filter((equation) => chapterIds.has(equation.nodeId)).length,
    references: registry.references.length,
    spine: registry.references.filter((record) => record.spine).length,
    maxWords: Math.max(1, ...chapters.map((c) => c.words)),
    maxFigures: Math.max(1, ...chapters.map((c) => c.figures)),
    maxEquations: Math.max(1, ...chapters.map((c) => c.equations)),
    maxWorks: Math.max(1, ...chapters.map((c) => c.works)),
  };

  return { volumes, parts, chapters, shelf, totals };
}

/** `26293` → `26.3k`; `940` → `940`; `0` → `—`. Compact word counts for tiles. */
export function compactCount(n: number): string {
  if (n <= 0) return '—';
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
}
