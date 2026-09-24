/**
 * Data for the Systems and Labs index instruments (pages/systems, pages/labs).
 * Pure projections of the registry, graph, and stack model — nothing here is
 * hand-maintained and nothing is inferred beyond what the registry records:
 *
 *  - a system is "analysed by" a chapter when that chapter's Reference-stack
 *    coverage table names it (`uses`), or when a node of a *written* chapter
 *    lists it among its implementations (`usedBy`);
 *  - a *planned* chapter whose plan lists the system (`usedBy` on an unwritten
 *    chapter) is kept apart as "named in the plan", never counted as use;
 *  - a lab is drawn on by a chapter only through `uses`.
 *
 * Section counts come from the coverage table's "Sections" cell ("7.1–7.6",
 * "1.1, 1.3", "verification"): ranges expand, named non-numbered parts count
 * once, free text ("chapter page only") counts zero.
 */
import { inlineToText, STACK_LAYERS, type AtlasGraph, type LabEntity, type NodeId, type Registry, type StackUse, type SystemEntity } from '@atlas/core';
import { compareStrings } from './format.ts';
import { enclosing } from './nodes.ts';
import type { StackModel } from './stack.ts';

export interface EntityChapter {
  readonly n: number;
  readonly number: string;
  readonly short: string;
  readonly title: string;
  readonly url: string;
  readonly part: number;
  readonly written: boolean;
}

export interface EntityPart {
  readonly n: number;
  readonly numeral: string;
  readonly title: string;
  readonly url: string;
  readonly volume: number;
  readonly chapters: readonly number[];
}

export interface EntityUse {
  /** Chapter number the coverage row belongs to. */
  readonly ch: number;
  /** The "Sections" cell, verbatim. */
  readonly sections: string;
  /** Parsed count of sections the cell names (0 when it names none). */
  readonly count: number;
  /** Evidence label the chapter assigned (OFFICIAL-DOCUMENTATION, PAPER-REPORTED, …). */
  readonly label: string;
  /** The "What is used" cell, flattened to text (citations as their keys). */
  readonly what: string;
}

export interface Surface {
  readonly label: string;
  readonly url: string;
}

export interface SystemRow {
  /** DOM-safe key (`vllm`), also the page slug. */
  readonly key: string;
  readonly name: string;
  readonly rank: number | null;
  /** Index into STACK_LAYERS (0 = accelerator … 7 = serving); -1 when the reference stack states none. */
  readonly layer: number;
  readonly url: string;
  readonly surfaces: readonly Surface[];
  /** Written chapters that analyse it, ascending. */
  readonly chapters: readonly number[];
  /** Planned chapters whose plan names it, ascending. */
  readonly planned: readonly number[];
  readonly uses: readonly EntityUse[];
  /** Sections of written chapters that list it as an implementation, by chapter (for chapters with no coverage row). */
  readonly listedIn: Readonly<Record<string, readonly string[]>>;
}

export interface LayerRow {
  readonly index: number;
  readonly name: string;
  readonly systems: readonly string[];
}

export interface SystemsModel {
  readonly chapters: Readonly<Record<string, EntityChapter>>;
  readonly parts: readonly EntityPart[];
  readonly layers: readonly LayerRow[];
  readonly systems: readonly SystemRow[];
}

export interface LabRow {
  readonly key: string;
  readonly name: string;
  readonly rank: number | null;
  readonly url: string;
  readonly surfaces: readonly Surface[];
  /** Written chapters that draw on it, ascending. */
  readonly chapters: readonly number[];
  /** Sections drawing on it, by chapter number (summed over coverage rows). */
  readonly sectionsByChapter: Readonly<Record<string, number>>;
  readonly sections: number;
  readonly uses: readonly EntityUse[];
}

export interface LabsModel {
  readonly chapters: Readonly<Record<string, EntityChapter>>;
  readonly parts: readonly EntityPart[];
  readonly labs: readonly LabRow[];
}

/** "7.1–7.6" → 6; "1.1, 1.3, verification" → 3; "chapter page only; not cited inside a section" → 0. */
export function countSections(text: string): number {
  let count = 0;
  for (const raw of text.split(/[,;]/u)) {
    const token = raw.trim();
    const range = /(\d+)\.(\d+)\s*[–—-]\s*(?:\d+\.)?(\d+)/u.exec(token);
    if (range !== null) {
      count += Math.max(1, Number(range[3]) - Number(range[2]) + 1);
    } else if (/\d+\.\d+/u.test(token)) {
      count += 1;
    } else if (/^(?:verification|lineage|references)$/iu.test(token)) {
      count += 1;
    }
  }
  return count;
}

const byRank = <T extends { readonly rank: number | null; readonly name: string }>(a: T, b: T): number =>
  (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER) || compareStrings(a.name, b.name);

const chapterNumberOf = (graph: AtlasGraph, id: NodeId): number | null => {
  const chapter = enclosing(graph, id, 'chapter');
  const match = chapter === null ? null : /^ms\.chapter\.(\d+)$/u.exec(chapter.id);
  return match?.[1] === undefined ? null : Number(match[1]);
};

function projectChapters(stack: StackModel): { chapters: Record<string, EntityChapter>; parts: EntityPart[] } {
  const chapters: Record<string, EntityChapter> = {};
  for (const chapter of Object.values(stack.chapters)) {
    chapters[String(chapter.n)] = {
      n: chapter.n,
      number: chapter.number,
      short: chapter.short,
      title: chapter.title,
      url: chapter.url,
      part: chapter.part,
      written: chapter.written,
    };
  }
  const order = new Map(stack.volumes.flatMap((volume) => volume.parts.map((part, index) => [part, volume.n * 100 + index] as const)));
  const parts = [...stack.parts]
    .sort((a, b) => (order.get(a.n) ?? a.n) - (order.get(b.n) ?? b.n))
    .map((part) => ({ n: part.n, numeral: part.numeral, title: part.title, url: part.url, volume: part.volume, chapters: part.chapters }));
  return { chapters, parts };
}

function projectUses(graph: AtlasGraph, uses: readonly StackUse[]): EntityUse[] {
  return uses
    .map((use) => ({ use, ch: chapterNumberOf(graph, use.nodeId) }))
    .filter((item): item is { use: StackUse; ch: number } => item.ch !== null)
    .map(({ use, ch }) => ({
      ch,
      sections: use.sections,
      count: countSections(use.sections),
      label: use.label,
      what: inlineToText(use.what).replace(/\s+/gu, ' ').trim(),
    }))
    .sort((a, b) => a.ch - b.ch);
}

const slugOf = (id: string, prefix: string): string => id.slice(prefix.length);

function systemRow(system: SystemEntity, graph: AtlasGraph, written: ReadonlySet<number>): SystemRow {
  const uses = projectUses(graph, system.uses);
  const chapters = new Set<number>();
  const planned = new Set<number>();
  const listedIn: Record<string, string[]> = {};
  for (const use of uses) (written.has(use.ch) ? chapters : planned).add(use.ch);
  for (const nodeId of system.usedBy) {
    const ch = chapterNumberOf(graph, nodeId);
    if (ch === null) continue;
    if (written.has(ch)) {
      chapters.add(ch);
      const node = graph.nodes[nodeId];
      if (node?.entityType === 'section' && node.number !== null) (listedIn[String(ch)] ??= []).push(node.number);
    } else {
      planned.add(ch);
    }
  }
  const ascending = (set: ReadonlySet<number>): number[] => [...set].sort((a, b) => a - b);
  const layer = system.layer === null ? -1 : STACK_LAYERS.indexOf(system.layer);
  return {
    key: slugOf(system.id, 'impl.'),
    name: system.name,
    rank: system.rank,
    layer,
    url: system.atlasUrl,
    surfaces: system.surfaces,
    chapters: ascending(chapters),
    planned: ascending(planned).filter((n) => !chapters.has(n)),
    uses,
    listedIn,
  };
}

export function buildSystemsModel(graph: AtlasGraph, registry: Registry, stack: StackModel): SystemsModel {
  const { chapters, parts } = projectChapters(stack);
  const written = new Set(Object.values(chapters).filter((chapter) => chapter.written).map((chapter) => chapter.n));
  const systems = [...registry.systems].sort(byRank).map((system) => systemRow(system, graph, written));
  const layers: LayerRow[] = STACK_LAYERS.map((name, index) => ({
    index,
    name,
    systems: systems.filter((system) => system.layer === index).map((system) => system.key),
  }));
  const unstated = systems.filter((system) => system.layer === -1);
  if (unstated.length > 0) layers.push({ index: -1, name: 'Layer not stated in the reference stack', systems: unstated.map((system) => system.key) });
  return { chapters, parts, layers, systems };
}

function labRow(lab: LabEntity, graph: AtlasGraph, written: ReadonlySet<number>): LabRow {
  const uses = projectUses(graph, lab.uses).filter((use) => written.has(use.ch));
  const sectionsByChapter: Record<string, number> = {};
  for (const use of uses) sectionsByChapter[String(use.ch)] = (sectionsByChapter[String(use.ch)] ?? 0) + use.count;
  return {
    key: slugOf(lab.id, 'lab.'),
    name: lab.name,
    rank: lab.rank,
    url: lab.atlasUrl,
    surfaces: lab.surfaces,
    chapters: [...new Set(uses.map((use) => use.ch))].sort((a, b) => a - b),
    sectionsByChapter,
    sections: uses.reduce((sum, use) => sum + use.count, 0),
    uses,
  };
}

export function buildLabsModel(graph: AtlasGraph, registry: Registry, stack: StackModel): LabsModel {
  const { chapters, parts } = projectChapters(stack);
  const written = new Set(Object.values(chapters).filter((chapter) => chapter.written).map((chapter) => chapter.n));
  return { chapters, parts, labs: [...registry.labs].sort(byRank).map((lab) => labRow(lab, graph, written)) };
}

/** Mark weight 1–6 for a count (sections or chapters); 0 stays 0. */
export function weightOf(count: number): number {
  return count <= 0 ? 0 : Math.min(6, count);
}
