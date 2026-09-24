/**
 * Evidence labels (book_plan Appendix H, CONTENT_CONTRACT §6) and the four-part
 * observation layer (UI_UX §41). Labels are rendered as quiet semantic markers;
 * `EVIDENCE_CLASS` drives their typographic treatment, never a badge wall.
 */

export const EVIDENCE_LABELS = [
  'KNOWN',
  'DERIVED',
  'ASSUMED',
  'NOT-DISCLOSED',
  'UNVERIFIED',
  'PAPER-REPORTED',
  'OFFICIAL-DOCUMENTATION',
  'MATHEMATICALLY-DERIVED',
  'CODE-VERIFIED',
  'EMPIRICALLY-OBSERVED',
] as const;

export type EvidenceLabel = (typeof EVIDENCE_LABELS)[number];

/**
 * - `source`: a cited party asserts it (paper, documentation, supplied material).
 * - `inference`: the book derives or assumes it.
 * - `gap`: the evidence is missing or unchecked.
 * - `measurement`: an executed check (forbidden in Edition 1.0 except CODE-VERIFIED with repo+commit).
 */
export type EvidenceClass = 'source' | 'inference' | 'gap' | 'measurement';

export const EVIDENCE_CLASS: Readonly<Record<EvidenceLabel, EvidenceClass>> = {
  KNOWN: 'source',
  'PAPER-REPORTED': 'source',
  'OFFICIAL-DOCUMENTATION': 'source',
  DERIVED: 'inference',
  'MATHEMATICALLY-DERIVED': 'inference',
  ASSUMED: 'inference',
  'NOT-DISCLOSED': 'gap',
  UNVERIFIED: 'gap',
  'CODE-VERIFIED': 'measurement',
  'EMPIRICALLY-OBSERVED': 'measurement',
};

/** Short forms used in the compact rail and the minimap (UI_UX §20 indicator vocabulary). */
export const EVIDENCE_SHORT: Readonly<Record<EvidenceLabel, string>> = {
  KNOWN: 'KNOWN',
  'PAPER-REPORTED': 'PAPER',
  'OFFICIAL-DOCUMENTATION': 'OFFICIAL',
  DERIVED: 'DERIVED',
  'MATHEMATICALLY-DERIVED': 'MATH',
  ASSUMED: 'ASSUMPTION',
  'NOT-DISCLOSED': 'NOT DISCLOSED',
  UNVERIFIED: 'UNVERIFIED',
  'CODE-VERIFIED': 'CODE',
  'EMPIRICALLY-OBSERVED': 'EMPIRICAL',
};

/** Labels that Edition 1.0 forbids outright (CONTENT_CONTRACT §6). CODE-VERIFIED needs repo+commit, checked separately. */
export const FORBIDDEN_IN_EDITION_1: ReadonlySet<EvidenceLabel> = new Set<EvidenceLabel>(['EMPIRICALLY-OBSERVED']);

export function isEvidenceLabel(value: string): value is EvidenceLabel {
  return (EVIDENCE_LABELS as readonly string[]).includes(value);
}

/**
 * Matches a label token in prose. Longest labels first so `DERIVED` does not shadow
 * `MATHEMATICALLY-DERIVED`; the lookarounds stop `DERIVED` matching inside `-DERIVED`.
 * Labels contain only [A-Z-], which need no escaping outside a character class.
 */
export const EVIDENCE_LABEL_PATTERN = new RegExp(
  `(?<![A-Za-z-])(${[...EVIDENCE_LABELS].sort((a, b) => b.length - a.length).join('|')})(?![A-Za-z-])`,
  'gu',
);

/** The four-part observation layer, in fixed order. */
export const OBSERVATION_PARTS = ['claims', 'evidence', 'inference', 'unknown'] as const;
export type ObservationPart = (typeof OBSERVATION_PARTS)[number];

export const OBSERVATION_PART_TITLES: Readonly<Record<ObservationPart, string>> = {
  claims: 'What the paper claims',
  evidence: 'What the evidence shows',
  inference: 'What we infer',
  unknown: 'What remains unknown',
};
