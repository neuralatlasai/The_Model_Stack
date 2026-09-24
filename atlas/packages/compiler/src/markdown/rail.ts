/**
 * Context-rail bindings (UI_UX §10, VISUAL_GRAMMAR §6). Each region gets at
 * most MAX_RAIL_INSTRUMENTS instruments: authored `placement: rail` figures
 * bound to it first (document order), then derived instruments by role —
 * equation inspector (formulation, mechanism), sibling strip, failure-mode
 * index, evidence profile (observations), position (scope, why, chapter-page
 * framing regions), terms (terms region or regions with definitions), and the
 * citation stack (any region that cites).
 */
import {
  MAX_RAIL_INSTRUMENTS,
  isCitationKey,
  type CitationKey,
  type CompiledFigure,
  type EvidenceLabel,
  type RailBinding,
  type RailInstrument,
  type Region,
  type RegionRole,
} from '@atlas/core';
import { plainText } from './inline-utils.ts';
import { slugify } from './slug.ts';
import type { CompileState } from './state.ts';
import { walkAllInline, walkBlocks } from './walk.ts';

const POSITION_ROLES: ReadonlySet<RegionRole> = new Set<RegionRole>(['scope', 'why', 'why-chapter', 'concept-map', 'position']);
const EQUATION_ROLES: ReadonlySet<RegionRole> = new Set<RegionRole>(['formulation', 'mechanism']);

export interface RegionTally {
  readonly equations: string[];
  readonly siblings: string[];
  readonly failureModes: string[];
  readonly terms: string[];
  readonly citations: CitationKey[];
  readonly labels: Partial<Record<EvidenceLabel, number>>;
}

function addUnique<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value);
}

function bump(counts: Partial<Record<EvidenceLabel, number>>, label: EvidenceLabel): void {
  counts[label] = (counts[label] ?? 0) + 1;
}

/** Objects, labels, and citations of one region, in reading order. */
export function tallyRegion(region: Region, st: CompileState): RegionTally {
  const tally: RegionTally = { equations: [], siblings: [], failureModes: [], terms: [], citations: [], labels: {} };
  const cite = (key: CitationKey | null): void => {
    if (key !== null && st.ctx.hasCitation(key)) addUnique(tally.citations, key);
  };
  walkBlocks(region.blocks, (block) => {
    switch (block.kind) {
      case 'equation':
        if (block.number !== null && block.anchor !== null) tally.equations.push(block.anchor);
        break;
      case 'sibling':
        if (block.anchor !== null) tally.siblings.push(block.anchor);
        break;
      case 'failure-mode':
        if (block.anchor !== null) tally.failureModes.push(block.anchor);
        break;
      case 'definition':
        addUnique(tally.terms, block.termSlug);
        break;
      case 'claim':
        bump(tally.labels, block.label);
        for (const source of block.sources) cite(source.key);
        break;
      case 'observation':
        if (block.label !== null) bump(tally.labels, block.label);
        break;
      case 'figure':
        for (const source of block.figure.sources) {
          if (isCitationKey(source)) cite(source);
        }
        break;
      case 'table':
        if (region.role === 'terms') {
          for (const row of block.rows) {
            const slug = slugify(plainText(row[0] ?? []));
            if (slug !== '') addUnique(tally.terms, slug);
          }
        }
        break;
      default:
        break;
    }
  });
  walkAllInline(region.blocks, (node) => {
    if (node.kind === 'label') bump(tally.labels, node.label);
    else if (node.kind === 'cite') cite(node.key);
  });
  return tally;
}

function derived(role: RegionRole, tally: RegionTally): RailInstrument[] {
  const out: RailInstrument[] = [];
  if (EQUATION_ROLES.has(role) && tally.equations.length > 0) out.push({ kind: 'equations', anchors: tally.equations });
  if (role === 'siblings' && tally.siblings.length > 0) out.push({ kind: 'siblings', anchors: tally.siblings });
  if (role === 'failure-modes' && tally.failureModes.length > 0) out.push({ kind: 'failure-modes', anchors: tally.failureModes });
  if (role === 'observations' && Object.keys(tally.labels).length > 0) out.push({ kind: 'evidence', counts: tally.labels });
  if (POSITION_ROLES.has(role)) out.push({ kind: 'position' });
  if (tally.terms.length > 0) out.push({ kind: 'terms', slugs: tally.terms });
  if (tally.citations.length > 0) out.push({ kind: 'citations', keys: tally.citations });
  return out;
}

export function buildRail(
  regions: readonly Region[],
  figures: readonly CompiledFigure[],
  st: CompileState,
  headingLines: ReadonlyMap<string, number | null>,
): RailBinding[] {
  return regions.map((region) => {
    const authored = figures.filter((figure) => figure.placement === 'rail' && figure.regionAnchor === region.anchor);
    if (authored.length > MAX_RAIL_INSTRUMENTS) {
      st.report(
        'rail-overflow',
        `region #${region.anchor} binds ${authored.length} rail figures; only the first ${MAX_RAIL_INSTRUMENTS} are shown (${authored
          .slice(MAX_RAIL_INSTRUMENTS)
          .map((figure) => figure.id)
          .join(', ')} dropped)`,
        headingLines.get(region.anchor) ?? null,
      );
    }
    const instruments: RailInstrument[] = authored.slice(0, MAX_RAIL_INSTRUMENTS).map((figure) => ({ kind: 'figure', figureId: figure.id }));
    for (const instrument of derived(region.role, tallyRegion(region, st))) {
      if (instruments.length >= MAX_RAIL_INSTRUMENTS) break;
      instruments.push(instrument);
    }
    return { regionAnchor: region.anchor, role: region.role, instruments };
  });
}
