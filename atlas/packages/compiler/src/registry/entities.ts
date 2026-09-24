/**
 * Systems and labs (UI_UX §22, CONTENT_CONTRACT §3 item 13). Entities come
 * from the reference stack; `usedBy` from frontmatter `implementations`;
 * `uses` from each chapter's Reference-stack coverage table, whose Entry cell
 * names the exact stack entry with its rank (`#17 PyTorch`,
 * `**PyTorch** (#17)`, or several entries separated by `;`).
 */
import {
  diagnostic,
  inlineToText,
  labUrl,
  systemUrl,
  type Diagnostic,
  type Inline,
  type LabEntity,
  type NodeId,
  type StackUse,
  type SystemEntity,
  type TableBlock,
} from '@atlas/core';
import { nameKey } from '../project/text.ts';
import type { CompiledSource, NodeTable } from '../project/types.ts';
import { walkDocument } from '../project/walk.ts';
import { headerKey } from './markdown-table.ts';
import type { ParsedLab, ParsedSystem, ReferenceStack } from './reference-stack.ts';

export interface EntityBuild {
  readonly systems: SystemEntity[];
  readonly labs: LabEntity[];
  readonly diagnostics: Diagnostic[];
}

interface CoverageColumns {
  readonly section: number;
  readonly entry: number;
  readonly what: number | null;
  readonly sections: number | null;
  readonly label: number | null;
}

function coverageColumns(table: TableBlock): CoverageColumns | null {
  const keys = table.columns.map((column) => headerKey(inlineToText(column.header)));
  const find = (...accepted: string[]): number | null => {
    const index = keys.findIndex((key) => accepted.some((candidate) => key === candidate || key.startsWith(candidate)));
    return index === -1 ? null : index;
  };
  const section = find('stack section');
  const entry = find('entry');
  if (section === null || entry === null) return null;
  return { section, entry, what: find('what this chapter takes from it', 'what'), sections: find('sections'), label: find('evidence label', 'evidence') };
}

export interface EntryRef {
  readonly rank: number | null;
  readonly name: string;
}

/** `#42 SGLang; #43 TensorRT-LLM` / `**PyTorch** (#17)` → [{rank, name}]. */
export function parseEntryCell(text: string): EntryRef[] {
  return text
    .split(';')
    .map((piece) => piece.trim())
    .filter((piece) => piece !== '')
    .map((piece) => {
      const rankMatch = /#\s*(\d+)/u.exec(piece);
      const name = piece
        .replace(/\(\s*#\s*\d+\s*\)/gu, '')
        .replace(/#\s*\d+/gu, '')
        .replace(/[*_`]/gu, '')
        .replace(/\s+/gu, ' ')
        .trim();
      return { rank: rankMatch?.[1] === undefined ? null : Number.parseInt(rankMatch[1], 10), name };
    });
}

function matchEntry<E extends { readonly rank: number; readonly name: string }>(
  ref: EntryRef,
  entries: readonly E[],
): { readonly entry: E | null; readonly problem: string | null } {
  const byName = entries.find((candidate) => nameKey(candidate.name) === nameKey(ref.name)) ?? null;
  if (ref.rank === null) return { entry: byName, problem: byName === null ? `"${ref.name}" matches no entry` : null };
  const byRank = entries.find((candidate) => candidate.rank === ref.rank) ?? null;
  if (byRank === null) return { entry: byName, problem: `rank #${String(ref.rank)} does not exist` };
  if (ref.name === '' || nameKey(byRank.name) === nameKey(ref.name)) return { entry: byRank, problem: null };
  // Tolerate a shortened exact name ("Transformers" for "Hugging Face Transformers").
  if (nameKey(byRank.name).includes(nameKey(ref.name))) return { entry: byRank, problem: null };
  return {
    entry: byName ?? byRank,
    problem: `"#${String(ref.rank)} ${ref.name}" does not match the reference stack's #${String(ref.rank)} "${byRank.name}"`,
  };
}

export function buildEntities(stack: ReferenceStack, compiled: readonly CompiledSource[], table: NodeTable): EntityBuild {
  const diagnostics: Diagnostic[] = [];
  const systemUses = new Map<string, StackUse[]>();
  const labUses = new Map<string, StackUse[]>();
  const usedBy = new Map<string, NodeId[]>();
  const unknownImpl = new Map<string, { nodes: NodeId[]; file: string }>();

  for (const { source, body } of compiled) {
    // usedBy: frontmatter implementations, resolved through the alias table.
    for (const rawId of source.meta.implementations) {
      const canonical = stack.aliases.get(rawId);
      if (!canonical?.startsWith('impl.')) {
        const record = unknownImpl.get(rawId) ?? { nodes: [], file: source.path };
        if (!record.nodes.includes(source.meta.id)) record.nodes.push(source.meta.id);
        unknownImpl.set(rawId, record);
        continue;
      }
      const list = usedBy.get(canonical) ?? [];
      if (!list.includes(source.meta.id)) list.push(source.meta.id);
      usedBy.set(canonical, list);
    }

    if (source.meta.entityType !== 'chapter') continue;
    for (const { block, region } of walkDocument(body)) {
      if (block.kind !== 'table') continue;
      if (block.role !== 'stack-coverage' && region?.role !== 'stack-coverage') continue;
      const columns = coverageColumns(block);
      if (columns === null) continue;
      for (const row of block.rows) {
        const cell = (index: number | null): readonly Inline[] => (index === null ? [] : (row[index] ?? []));
        const sectionText = inlineToText(cell(columns.section));
        const kind = /§\s*1\b/u.test(sectionText) ? 'lab' : /§\s*4\b/u.test(sectionText) ? 'system' : null;
        if (kind === null) continue;
        const use: Omit<StackUse, 'nodeId'> = {
          what: cell(columns.what),
          sections: inlineToText(cell(columns.sections)).trim(),
          label: inlineToText(cell(columns.label)).trim(),
        };
        for (const ref of parseEntryCell(inlineToText(cell(columns.entry)))) {
          const match: { entry: ParsedLab | ParsedSystem | null; problem: string | null } =
            kind === 'lab' ? matchEntry(ref, stack.labs) : matchEntry(ref, stack.systems);
          if (match.problem !== null) {
            diagnostics.push(
              diagnostic('reference-stack-parse', `Reference-stack coverage (${kind === 'lab' ? '§1' : '§4'}): ${match.problem}`, {
                file: source.path,
                nodeId: source.meta.id,
              }),
            );
          }
          if (match.entry === null) continue;
          const target = kind === 'lab' ? labUses : systemUses;
          const list = target.get(match.entry.id) ?? [];
          list.push({ nodeId: source.meta.id, ...use });
          target.set(match.entry.id, list);
        }
      }
    }
  }

  for (const [rawId, record] of unknownImpl) {
    diagnostics.push(
      diagnostic(
        'reference-stack-parse',
        `${rawId} (implementations of ${record.nodes.join(', ')}) has no §4 entry in AI_REFERENCE_STACK.md; use impl.<exact §4 name, kebab-cased>`,
        { file: record.file, nodeId: record.nodes[0] ?? null },
      ),
    );
  }

  const orderIndex = new Map(table.order.map((id, index) => [id, index]));
  const byOrder = (a: NodeId, b: NodeId): number => (orderIndex.get(a) ?? 0) - (orderIndex.get(b) ?? 0);

  const systems: SystemEntity[] = stack.systems.map((system) => ({
    id: system.id,
    name: system.name,
    rank: system.rank,
    layer: system.layer,
    surfaces: system.surfaces,
    usedBy: [...(usedBy.get(system.id) ?? [])].sort(byOrder),
    uses: systemUses.get(system.id) ?? [],
    atlasUrl: systemUrl(system.id),
  }));
  const labs: LabEntity[] = stack.labs.map((lab) => ({
    id: lab.id,
    name: lab.name,
    rank: lab.rank,
    surfaces: lab.surfaces,
    uses: labUses.get(lab.id) ?? [],
    atlasUrl: labUrl(lab.id),
  }));
  return { systems, labs, diagnostics };
}
