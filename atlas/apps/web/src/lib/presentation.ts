/**
 * Presentation order of a compiled document.
 *
 * The content contract fixes the order in which authors WRITE a chapter page
 * (CONTENT_CONTRACT §3); the reader needs a different order (UI_UX §8–9):
 * identity and thesis, then the concept map, why the chapter exists, the
 * sections themselves, lineage and position — and only then the research
 * apparatus (reference-stack coverage, source route, status), which serves
 * verification rather than reading.
 *
 * One function decides the order so that the article, the minimap, and the
 * rail number regions identically (ordinals follow display order, not the
 * role's position in the contract).
 */
import type { OutlineEntry, Region, RegionRole, ResearchDocument } from '@atlas/core';

/** Reading order for chapter pages; roles not listed keep their relative order after these. */
const CHAPTER_READING_ORDER: readonly RegionRole[] = [
  'concept-map',
  'why-chapter',
  'sections',
  'lineage',
  'position',
  'terms',
  'artifact',
  'verification',
];

/** Regions that document how the page was sourced; shown last, set compactly. */
const APPARATUS_ROLES: ReadonlySet<RegionRole> = new Set<RegionRole>(['stack-coverage', 'source-route', 'status']);

export interface Presentation {
  /** Reading regions in display order. */
  readonly main: readonly Region[];
  /** Apparatus regions (chapter pages only), in display order. */
  readonly apparatus: readonly Region[];
  /** Region anchor → display ordinal (`01`, `02`, …), continuous across main and apparatus. */
  readonly ordinals: ReadonlyMap<string, string>;
  /** Outline entries in display order (minimap). */
  readonly outline: readonly OutlineEntry[];
}

function rank(role: RegionRole, order: readonly RegionRole[]): number {
  const index = order.indexOf(role);
  return index === -1 ? order.length : index;
}

export function presentDocument(doc: ResearchDocument): Presentation {
  const isChapter = doc.meta.entityType === 'chapter';
  const indexed = doc.regions.map((region, index) => ({ region, index }));

  const main = isChapter
    ? indexed
        .filter(({ region }) => !APPARATUS_ROLES.has(region.role))
        .sort((a, b) => rank(a.region.role, CHAPTER_READING_ORDER) - rank(b.region.role, CHAPTER_READING_ORDER) || a.index - b.index)
        .map(({ region }) => region)
    : doc.regions;
  const apparatus = isChapter ? doc.regions.filter((region) => APPARATUS_ROLES.has(region.role)) : [];

  const ordinals = new Map<string, string>();
  [...main, ...apparatus].forEach((region, index) => {
    ordinals.set(region.anchor, String(index + 1).padStart(2, '0'));
  });

  const byAnchor = new Map(doc.outline.map((entry) => [entry.anchor, entry]));
  const outline = [...main, ...apparatus]
    .map((region) => byAnchor.get(region.anchor))
    .filter((entry): entry is OutlineEntry => entry !== undefined);

  return { main, apparatus, ordinals, outline };
}
