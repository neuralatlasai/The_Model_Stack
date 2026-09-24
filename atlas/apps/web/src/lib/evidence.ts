/**
 * Permitted meanings of the evidence labels, verbatim from
 * docs/CONTENT_CONTRACT.md §6 (which implements book_plan.md Appendix H).
 * CONTENT_CONTRACT.md is not itself an atlas page, so the legend page quotes
 * it here; if the contract changes, this table must change with it.
 */
import type { EvidenceLabel } from '@atlas/core';

export const EVIDENCE_MEANINGS: Readonly<Record<EvidenceLabel, string>> = {
  KNOWN: 'Directly supported by the supplied material or identified evidence; specify that evidence',
  DERIVED: 'Follows from stated assumptions/calculations; show the auditable derivation',
  ASSUMED: 'A design or planning input chosen for the analysis; include sensitivity when material',
  'NOT-DISCLOSED': 'The required detail is absent from the inspected public disclosure',
  UNVERIFIED: 'A candidate statement remains unchecked or could not be validated',
  'PAPER-REPORTED': 'The cited authors report the method or result; it has not thereby been independently reproduced',
  'OFFICIAL-DOCUMENTATION': 'The project/vendor/organization documents the claim for the stated version',
  'MATHEMATICALLY-DERIVED': 'The result follows under explicit mathematical assumptions',
  'CODE-VERIFIED':
    'The relevant implementation was inspected or a targeted executable check established the stated property',
  'EMPIRICALLY-OBSERVED': 'A specified experiment was actually performed and its measurements retained',
};

export const EVIDENCE_CLASS_TITLES = {
  source: 'Source — a cited party asserts it',
  inference: 'Inference — the book derives or assumes it',
  gap: 'Gap — the evidence is missing or unchecked',
  measurement: 'Measurement — an executed check',
} as const;
