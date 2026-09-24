/**
 * Identifier grammar for every addressable research object.
 *
 * Node ids come from `docs/` frontmatter (CONTENT_CONTRACT §2). Object ids
 * (equations, figures, algorithms, experiments) are numbered `<chapter>.<n>`
 * and double as URL fragment anchors. Template-literal types give compile-time
 * shape; the `parse*` guards are the runtime check at trust boundaries.
 */

export type VolumeId = `ms.volume.${number}`;
export type PartId = `ms.part.${number}`;
export type ChapterId = `ms.chapter.${number}`;
export type SectionId = `ms.section.${number}.${number}`;
export type VerificationId = `ms.verification.${number}`;
export type ReferencesId = `ms.references.${number}`;
export type AppendixId = `ms.appendix.${string}`;
/** Front matter, plus the two index pages: `ms.root` (atlas index) and `ms.appendices` (appendix index). */
export type FrontMatterId = `ms.frontmatter.${string}` | 'ms.frontmatter' | 'ms.root' | 'ms.appendices';

/** Every node of the editorial hierarchy (Volume → Part → Chapter → Section, plus satellites). */
export type NodeId =
  | VolumeId
  | PartId
  | ChapterId
  | SectionId
  | VerificationId
  | ReferencesId
  | AppendixId
  | FrontMatterId;

export type EntityType =
  | 'volume'
  | 'part'
  | 'chapter'
  | 'section'
  | 'verification'
  | 'references'
  | 'appendix'
  | 'frontmatter';

/** Appendix D spine paper (`P01`–`P52`). */
export type SpinePaperKey = `P${number}`;
/** Chapter-scoped reference (`R14.3`). */
export type ChapterRefKey = `R${number}.${number}`;
export type CitationKey = SpinePaperKey | ChapterRefKey;

export type ImplId = `impl.${string}`;
export type LabId = `lab.${string}`;
export type ConceptId = `concept.${string}`;

/** Numbered objects inside chapters. The anchor form is `eq-5-4` (dots → dashes) so it is a valid fragment. */
export type EquationNumber = `${number}.${number}`;
export type FigureId = `fig-${number}.${number}`;

const NODE_ID_PATTERNS: readonly (readonly [EntityType, RegExp])[] = [
  ['volume', /^ms\.volume\.[1-9]\d*$/u],
  ['part', /^ms\.part\.[1-9]\d*$/u],
  ['chapter', /^ms\.chapter\.[1-9]\d*$/u],
  ['section', /^ms\.section\.[1-9]\d*\.[1-9]\d*$/u],
  ['verification', /^ms\.verification\.[1-9]\d*$/u],
  ['references', /^ms\.references\.[1-9]\d*$/u],
  ['appendix', /^ms\.appendix\.[a-z]$/u],
  ['frontmatter', /^ms\.(?:frontmatter(?:\.[a-z][a-z0-9-]*)?|root|appendices)$/u],
];

/** Returns the entity type encoded in a node id, or null if the string is not a node id. */
export function entityTypeOf(id: string): EntityType | null {
  for (const [type, pattern] of NODE_ID_PATTERNS) {
    if (pattern.test(id)) return type;
  }
  return null;
}

export function isNodeId(value: string): value is NodeId {
  return entityTypeOf(value) !== null;
}

/** Parses a node id at a trust boundary. Returns null instead of throwing so callers emit a diagnostic. */
export function parseNodeId(value: unknown): NodeId | null {
  return typeof value === 'string' && isNodeId(value) ? value : null;
}

export function isSectionId(value: string): value is SectionId {
  return entityTypeOf(value) === 'section';
}

export function isChapterId(value: string): value is ChapterId {
  return entityTypeOf(value) === 'chapter';
}

const SPINE_PAPER = /^P\d{2}$/u;
const CHAPTER_REF = /^R[1-9]\d*\.[1-9]\d*$/u;

export function isCitationKey(value: string): value is CitationKey {
  return SPINE_PAPER.test(value) || CHAPTER_REF.test(value);
}

export function isSpinePaperKey(value: string): value is SpinePaperKey {
  return SPINE_PAPER.test(value);
}

export function isImplId(value: string): value is ImplId {
  return /^impl\.[a-z0-9][a-z0-9.-]*$/u.test(value);
}

export function isLabId(value: string): value is LabId {
  return /^lab\.[a-z0-9][a-z0-9-]*$/u.test(value);
}

export function isFigureId(value: string): value is FigureId {
  return /^fig-[1-9]\d*\.[1-9]\d*$/u.test(value);
}

/** Chapter number of a chapter-scoped id (`ms.section.5.2` → 5, `R5.13` → 5, `fig-5.3` → 5); null otherwise. */
export function chapterNumberOf(id: string): number | null {
  const match =
    /^ms\.(?:chapter|section|verification|references)\.(\d+)/u.exec(id) ??
    /^R(\d+)\./u.exec(id) ??
    /^fig-(\d+)\./u.exec(id);
  const digits = match?.[1];
  return digits === undefined ? null : Number.parseInt(digits, 10);
}

/**
 * Converts a numbered object reference into a URL-fragment anchor.
 * `objectAnchor('eq', '5.4')` → `eq-5-4`; `objectAnchor('alg', '5.2')` → `alg-5-2`.
 */
export function objectAnchor(prefix: 'eq' | 'alg' | 'fig' | 'exp' | 'prop' | 'tbl', number: string): string {
  return `${prefix}-${number.replaceAll('.', '-')}`;
}
