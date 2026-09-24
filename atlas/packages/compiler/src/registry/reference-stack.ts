/**
 * Parser for `Instruction/AI_REFERENCE_STACK.md` (read-only input): §1 labs
 * (rank, exact name, surfaces), §4 systems (rank, exact name, docs/code URL)
 * and the §4.1 dependency map that places each system in one of the eight
 * stack layers. Ids follow CONTENT_CONTRACT §2: `impl.` / `lab.` + the exact
 * name lower-cased and kebab-cased, with a small override table where the
 * contract's documented id differs from the mechanical rule.
 */
import { STACK_LAYERS, diagnostic, type Diagnostic, type ImplId, type LabId, type StackLayer } from '@atlas/core';
import type { Code, Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { kebab, nameKey } from '../project/text.ts';
import { cellLinks, cellText, extractTables, mapColumns, parseMarkdown } from './markdown-table.ts';

export interface StackSurface {
  readonly label: string;
  readonly url: string;
}

export interface ParsedLab {
  readonly id: LabId;
  readonly name: string;
  readonly rank: number;
  readonly why: string;
  readonly surfaces: readonly StackSurface[];
}

export interface ParsedSystem {
  readonly id: ImplId;
  readonly name: string;
  readonly rank: number;
  /** The §4 table's own "Layer" description (not a §4.1 layer). */
  readonly role: string;
  readonly why: string;
  readonly layer: StackLayer | null;
  readonly surfaces: readonly StackSurface[];
}

export interface ReferenceStack {
  readonly labs: readonly ParsedLab[];
  readonly systems: readonly ParsedSystem[];
  /** Any id used in docs → canonical entity id (includes the canonical ids themselves). */
  readonly aliases: ReadonlyMap<string, string>;
  readonly diagnostics: readonly Diagnostic[];
}

/** Documented ids that differ from the mechanical rule (CONTENT_CONTRACT §2 lists `lab.z-ai-glm`). */
const LAB_ID_OVERRIDES: Readonly<Record<string, LabId>> = {
  'Z.ai / Zhipu AI / GLM': 'lab.z-ai-glm',
};
const SYSTEM_ID_OVERRIDES: Readonly<Record<string, ImplId>> = {};

/** §4.1 dependency-map tokens that do not match a §4 name mechanically. */
const LAYER_TOKEN_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'AWS Neuron': ['AWS Trainium/Inferentia + Neuron'],
  'Triton-lang': ['Triton language'],
  Liger: ['Liger Kernel'],
  NeMo: ['NVIDIA NeMo Framework'],
};

const LAB_SURFACES = [
  ['home', 'Home'],
  ['research', 'Research'],
  ['papers', 'Papers'],
  ['blog', 'Blog'],
  ['code', 'Code'],
  ['models', 'Models'],
] as const;

export function labIdFor(name: string): LabId {
  return LAB_ID_OVERRIDES[name] ?? `lab.${kebab(name)}`;
}

export function systemIdFor(name: string): ImplId {
  return SYSTEM_ID_OVERRIDES[name] ?? `impl.${kebab(name)}`;
}

function rankOf(text: string): number | null {
  const match = /^\s*#?\s*(\d+)\s*$/u.exec(text);
  return match?.[1] === undefined ? null : Number.parseInt(match[1], 10);
}

export function parseReferenceStack(text: string, file: string): ReferenceStack {
  const diagnostics: Diagnostic[] = [];
  const root = parseMarkdown(text);
  const warn = (message: string, line: number | null = null): void => {
    diagnostics.push(diagnostic('reference-stack-parse', message, { file, line }));
  };

  const labs: ParsedLab[] = [];
  const systems: ParsedSystem[] = [];

  for (const table of extractTables(root)) {
    const labColumns = mapColumns(table.headers, {
      rank: ['#'],
      name: ['lab / organization', 'lab / organisation'],
      why: ['why track'],
      home: ['home'],
      research: ['research'],
      papers: ['papers'],
      blog: ['blog / engineering', 'blog'],
      code: ['code'],
      models: ['models'],
    });
    if (labColumns.name !== undefined && labColumns.rank !== undefined) {
      for (const row of table.rows) {
        const rank = rankOf(cellText(row, labColumns.rank));
        const name = cellText(row, labColumns.name);
        if (rank === null || name === '') {
          warn(`§1 row is missing a rank or name ("${cellText(row, labColumns.rank)}", "${name}")`, row.line);
          continue;
        }
        const surfaces: StackSurface[] = [];
        for (const [field, label] of LAB_SURFACES) {
          const url = cellLinks(row, labColumns[field])[0];
          if (url !== undefined) surfaces.push({ label, url });
        }
        labs.push({ id: labIdFor(name), name, rank, why: cellText(row, labColumns.why), surfaces });
      }
      continue;
    }

    const systemColumns = mapColumns(table.headers, {
      rank: ['#'],
      name: ['system / project'],
      role: ['layer'],
      why: ['why it matters'],
      docs: ['canonical docs/code'],
    });
    if (systemColumns.name !== undefined && systemColumns.rank !== undefined) {
      for (const row of table.rows) {
        const rank = rankOf(cellText(row, systemColumns.rank));
        const name = cellText(row, systemColumns.name);
        if (rank === null || name === '') {
          warn(`§4 row is missing a rank or name ("${cellText(row, systemColumns.rank)}", "${name}")`, row.line);
          continue;
        }
        const url = cellLinks(row, systemColumns.docs)[0];
        if (url === undefined) warn(`§4 #${String(rank)} ${name} has no docs/code link`, row.line);
        systems.push({
          id: systemIdFor(name),
          name,
          rank,
          role: cellText(row, systemColumns.role),
          why: cellText(row, systemColumns.why),
          layer: null,
          surfaces: url === undefined ? [] : [{ label: 'docs/code', url }],
        });
      }
    }
  }

  if (labs.length === 0) warn('no §1 lab table found (expected a "Lab / organization" column)');
  if (systems.length === 0) warn('no §4 system table found (expected a "System / project" column)');

  const layered = assignLayers(root, systems, warn);

  const aliases = new Map<string, string>();
  for (const lab of labs) {
    aliases.set(lab.id, lab.id);
    aliases.set(`lab.${kebab(lab.name)}`, lab.id);
  }
  for (const system of layered) {
    aliases.set(system.id, system.id);
    aliases.set(`impl.${kebab(system.name)}`, system.id);
  }

  checkDuplicates(labs, warn);
  checkDuplicates(layered, warn);

  return { labs, systems: layered, aliases, diagnostics };
}

function checkDuplicates(entries: readonly { readonly id: string; readonly name: string }[], warn: (message: string) => void): void {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    const other = seen.get(entry.id);
    if (other !== undefined) warn(`"${entry.name}" and "${other}" both map to ${entry.id}`);
    else seen.set(entry.id, entry.name);
  }
}

/** Finds the fenced block under the "4.1 Stack dependency map" heading. */
function dependencyMap(root: Root): Code | null {
  let inSection = false;
  for (const node of root.children) {
    if (node.type === 'heading') {
      inSection = /stack dependency map/iu.test(toString(node));
      continue;
    }
    if (inSection && node.type === 'code') return node;
  }
  return null;
}

function layerOfHeader(line: string): StackLayer | null {
  const key = nameKey(line);
  return STACK_LAYERS.find((layer) => nameKey(layer) === key) ?? null;
}

/** Candidate comparison keys for a system name: whole name and each ` / `-separated part. */
function systemKeys(name: string): string[] {
  const parts = name.split(/\s+\/\s+/u);
  return [nameKey(name), ...parts.map(nameKey)];
}

function matchToken(token: string, systems: readonly ParsedSystem[]): ParsedSystem[] {
  const aliased = LAYER_TOKEN_ALIASES[token];
  if (aliased !== undefined) {
    return aliased.flatMap((name) => systems.filter((system) => system.name === name));
  }
  const key = nameKey(token);
  const exact = systems.filter((system) => systemKeys(system.name).includes(key));
  if (exact.length === 1) return exact;
  const suffix = systems.filter((system) => systemKeys(system.name).some((candidate) => candidate.endsWith(key)));
  if (suffix.length === 1) return suffix;
  // `AMD ROCm/HIP`, `Intel Gaudi/oneAPI`: one token naming several entries.
  if (token.includes('/')) {
    const pieces = token.split('/').map((piece) => piece.trim()).filter((piece) => piece !== '');
    const matched = pieces.map((piece) => matchToken(piece, systems));
    if (matched.every((list) => list.length === 1)) return matched.flat();
  }
  return [];
}

function assignLayers(root: Root, systems: readonly ParsedSystem[], warn: (message: string, line?: number | null) => void): ParsedSystem[] {
  const block = dependencyMap(root);
  if (block === null) {
    warn('§4.1 stack dependency map not found; systems have no stack layer');
    return [...systems];
  }
  const layerById = new Map<string, StackLayer>();
  let current: StackLayer | null = null;
  const baseLine = (block.position?.start.line ?? 0) + 1;
  block.value.split('\n').forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === '' || line === '↓') return;
    if (/^[A-Z][A-Z /-]+$/u.test(line)) {
      current = layerOfHeader(line);
      if (current === null) warn(`§4.1 layer heading "${line}" is not one of the eight stack layers`, baseLine + index);
      return;
    }
    if (current === null) return;
    for (const token of line.split('|').map((part) => part.trim()).filter((part) => part !== '')) {
      const matched = matchToken(token, systems);
      if (matched.length === 0) {
        warn(`§4.1 entry "${token}" matches no §4 system`, baseLine + index);
        continue;
      }
      for (const system of matched) {
        const existing = layerById.get(system.id);
        if (existing !== undefined && existing !== current) {
          warn(`§4 ${system.name} appears in two §4.1 layers (${existing}, ${current})`, baseLine + index);
          continue;
        }
        layerById.set(system.id, current);
      }
    }
  });

  return systems.map((system) => {
    const layer = layerById.get(system.id) ?? null;
    if (layer === null) warn(`§4 #${String(system.rank)} ${system.name} is not placed in the §4.1 dependency map`);
    return { ...system, layer };
  });
}
