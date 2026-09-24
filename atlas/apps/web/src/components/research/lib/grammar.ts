/**
 * Typographic vocabulary of the research-block renderers: evidence glyphs,
 * region ordinals, minimap markers, note and proposition titles. Glyphs are
 * shape-coded so colour never carries meaning alone (VISUAL_GRAMMAR §8).
 */
import type {
  EvidenceClass,
  EvidenceLabel,
  NoteVariant,
  ObservationPart,
  OutlineMarkerType,
  PropositionBlock,
  RegionRole,
} from '@atlas/core';
import {
  CHAPTER_ROLES,
  EVIDENCE_CLASS,
  EVIDENCE_LABELS,
  EVIDENCE_SHORT,
  REGION_ROLE_LABELS,
  SECTION_ROLES,
  VERIFICATION_ROLES,
} from '@atlas/core';

/** source ● · inference ◆ · gap ○ · measurement ■ */
export const EVIDENCE_GLYPH: Readonly<Record<EvidenceClass, string>> = {
  source: '●',
  inference: '◆',
  gap: '○',
  measurement: '■',
};

export const EVIDENCE_CLASS_TITLES: Readonly<Record<EvidenceClass, string>> = {
  source: 'cited source',
  inference: 'the book’s inference',
  gap: 'evidence missing or unchecked',
  measurement: 'executed check',
};

export interface EvidenceMarker {
  readonly label: EvidenceLabel;
  readonly cls: EvidenceClass;
  readonly glyph: string;
  readonly short: string;
}

export function evidenceMarker(label: EvidenceLabel): EvidenceMarker {
  const cls = EVIDENCE_CLASS[label];
  return { label, cls, glyph: EVIDENCE_GLYPH[cls], short: EVIDENCE_SHORT[label] };
}

/** Evidence counts in canonical label order, zero and absent labels dropped. */
export function orderedCounts(
  counts: Readonly<Partial<Record<EvidenceLabel, number>>>,
): { readonly marker: EvidenceMarker; readonly count: number }[] {
  const out: { readonly marker: EvidenceMarker; readonly count: number }[] = [];
  for (const label of EVIDENCE_LABELS) {
    const count = counts[label] ?? 0;
    if (count > 0) out.push({ marker: evidenceMarker(label), count });
  }
  return out;
}

/**
 * Dot-matrix cells for an evidence profile: one dot per labelled statement,
 * or one dot per `scale` statements when the total exceeds `maxDots`.
 */
export function evidenceDots(
  counts: Readonly<Partial<Record<EvidenceLabel, number>>>,
  maxDots = 64,
): { readonly dots: readonly EvidenceMarker[]; readonly scale: number; readonly total: number } {
  const entries = orderedCounts(counts);
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);
  const scale = total <= maxDots ? 1 : Math.ceil(total / maxDots);
  const dots: EvidenceMarker[] = [];
  for (const { marker, count } of entries) {
    const n = Math.max(1, Math.round(count / scale));
    for (let i = 0; i < n; i += 1) dots.push(marker);
  }
  return { dots, scale, total };
}

/** Two-digit ordinal of a role in its contract order (`formulation` → `04`); null for `other`. */
export function roleOrdinal(role: RegionRole): string | null {
  const lists: readonly (readonly string[])[] = [SECTION_ROLES, CHAPTER_ROLES, VERIFICATION_ROLES];
  for (const list of lists) {
    const index = list.indexOf(role);
    if (index >= 0) return String(index + 1).padStart(2, '0');
  }
  return null;
}

/** Canonical role label, falling back to the heading as written for `other`. */
export function roleLabel(role: RegionRole, title: string): string {
  const label = REGION_ROLE_LABELS[role];
  return label === '' ? title : label;
}

export const MARKER_GLYPH: Readonly<Record<OutlineMarkerType, string>> = {
  equation: '=',
  figure: '▢',
  algorithm: '≡',
  experiment: '△',
  code: '‹›',
  'failure-mode': '×',
  'open-question': '?',
  definition: '≔',
  claim: '⊢',
};

export const MARKER_NAMES: Readonly<Record<OutlineMarkerType, string>> = {
  equation: 'Equation',
  figure: 'Figure',
  algorithm: 'Algorithm',
  experiment: 'Experiment',
  code: 'Code',
  'failure-mode': 'Failure mode',
  'open-question': 'Open question',
  definition: 'Definition',
  claim: 'Claim',
};

/**
 * Marker types the minimap draws. Claims are omitted: a section carries dozens,
 * and marking each one would turn the topology into noise (UI_UX §12, §20).
 */
export const MINIMAP_MARKER_TYPES: ReadonlySet<OutlineMarkerType> = new Set<OutlineMarkerType>([
  'equation',
  'figure',
  'algorithm',
  'experiment',
  'code',
  'failure-mode',
  'open-question',
  'definition',
]);

/** Evidence class that tints each observation-layer label (UI_UX §41). */
export const OBSERVATION_PART_CLASS: Readonly<Record<ObservationPart, EvidenceClass>> = {
  claims: 'source',
  evidence: 'source',
  inference: 'inference',
  unknown: 'gap',
};

export const NOTE_TITLES: Readonly<Record<NoteVariant, string>> = {
  historical: 'Historical note',
  caveat: 'Caveat',
  warning: 'Warning',
  'further-reading': 'Further reading',
  implementation: 'Implementation note',
};

export const PROPOSITION_TITLES: Readonly<Record<PropositionBlock['variant'], string>> = {
  proposition: 'Proposition',
  theorem: 'Theorem',
  lemma: 'Lemma',
  corollary: 'Corollary',
};

/** Reference status glyphs for the citation stack (references.md Status column). */
export function referenceStatusGlyph(status: string): { readonly glyph: string; readonly name: string } {
  switch (status) {
    case 'peer-reviewed':
      return { glyph: '●', name: 'peer-reviewed' };
    case 'preprint':
      return { glyph: '◐', name: 'preprint' };
    case 'official documentation':
      return { glyph: '■', name: 'official documentation' };
    case 'archived':
      return { glyph: '▫', name: 'archived' };
    case 'UNVERIFIED':
      return { glyph: '○', name: 'unverified' };
    default:
      return { glyph: '·', name: status === '' ? 'status not recorded' : status };
  }
}
