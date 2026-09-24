/**
 * Frontmatter schema (CONTENT_CONTRACT §2) — the trust boundary for every
 * `docs/` file. `FrontmatterSchema` validates raw YAML; `NodeMeta` is the
 * normalised, typed result the rest of the system consumes.
 *
 * YAML hazards handled here rather than downstream:
 * - `section: 14.10` parses as the float 14.1, so the section number is taken from the id.
 * - `updated_at` may arrive as a Date under YAML 1.1 schemas; it is normalised to `YYYY-MM-DD`.
 */
import { z } from 'zod';
import { EVIDENCE_LABELS, type EvidenceLabel } from './evidence.ts';
import { entityTypeOf, isNodeId, type EntityType, type NodeId } from './ids.ts';

export const RELATION_TYPES = [
  'prerequisite_of',
  'variant_of',
  'implemented_by',
  'evaluated_by',
  'supported_by',
  'contradicted_by',
  'consumes',
  'produces',
  'trades_off_with',
] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

/** Target namespaces seen in `relations[].target` (book_plan "Graph semantics"). */
export const RELATION_TARGET_NAMESPACES = [
  'paper',
  'impl',
  'concept',
  'experiment',
  'reference',
  'ref',
  'artifact',
  'lab',
  'benchmark',
  'dataset',
] as const;
export type RelationTargetNamespace = (typeof RELATION_TARGET_NAMESPACES)[number];
export type RelationTarget = `${RelationTargetNamespace}.${string}` | NodeId;

export const LIFECYCLE_STAGES = [
  'data',
  'pretraining',
  'continued_training',
  'adaptation',
  'post_training',
  'inference',
  'serving',
  'evaluation',
  'assurance',
] as const;
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const FEEDBACK_SETTINGS = [
  'human_preference',
  'ai_feedback',
  'verifiable_reward',
  'learned_reward',
  'environment_return',
] as const;
export type FeedbackSetting = (typeof FEEDBACK_SETTINGS)[number];

export const MODALITIES = ['text', 'code', 'image', 'audio', 'video', 'action', 'tool_trajectory'] as const;
export type Modality = (typeof MODALITIES)[number];

export const MATURITY_LEVELS = ['foundational', 'established', 'active', 'emerging', 'open'] as const;
export type Maturity = (typeof MATURITY_LEVELS)[number];

export const EDITORIAL_STATUSES = ['architecture_only', 'manuscript_draft', 'reviewed', 'released'] as const;
export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number];

export const ENTITY_TYPES = [
  'volume',
  'part',
  'chapter',
  'section',
  'verification',
  'references',
  'appendix',
  'frontmatter',
] as const satisfies readonly EntityType[];

const nodeIdSchema = z
  .string()
  .refine((value) => isNodeId(value), { message: 'not a node id (ms.<type>.<n>)' })
  .transform((value) => value);

const nullableNodeId = nodeIdSchema.nullable();

/** Tolerates an absent list (normalised to []) but not a malformed one. */
const idList = z.array(nodeIdSchema).nullish().transform((value) => value ?? []);
const stringList = z.array(z.string()).nullish().transform((value) => value ?? []);

const relationTargetSchema = z
  .string()
  .refine(
    (value) =>
      isNodeId(value) || RELATION_TARGET_NAMESPACES.some((namespace) => value.startsWith(`${namespace}.`)),
    { message: 'relation target must be a node id or <namespace>.<name>' },
  )
  .transform((value) => value as RelationTarget);

export const RelationSchema = z.object({
  type: z.enum(RELATION_TYPES),
  target: relationTargetSchema,
});
export type Relation = z.output<typeof RelationSchema>;

const dateSchema = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/u), z.date()])
  .transform((value) => (typeof value === 'string' ? value : value.toISOString().slice(0, 10)));

/** Raw frontmatter as authored. Unknown keys are rejected so typos surface as diagnostics. */
export const FrontmatterSchema = z
  .object({
    id: nodeIdSchema,
    entity_type: z.enum(ENTITY_TYPES),
    title: z.string().min(1),
    short_title: z.string().max(60).nullish(),
    volume: z.number().int().positive().nullable(),
    part: z.number().int().positive().nullable(),
    chapter: z.number().int().positive().nullable(),
    section: z.union([z.number(), z.string()]).nullable(),
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/u),
    parent: nullableNodeId,
    prev_sibling: nullableNodeId,
    next_sibling: nullableNodeId,
    children: idList,
    prerequisites: idList,
    downstream: idList,
    related: idList,
    siblings_by_mechanism: idList,
    relations: z.array(RelationSchema).nullish().transform((value) => value ?? []),
    axes: z
      .object({
        lifecycle: z.array(z.enum(LIFECYCLE_STAGES)).default([]),
        /** Open vocabulary by design (book_plan leaves mechanism tags unconstrained). */
        mechanism: z.array(z.string()).default([]),
        feedback_setting: z.array(z.enum(FEEDBACK_SETTINGS)).default([]),
        modality: z.array(z.enum(MODALITIES)).default([]),
      })
      .strict(),
    papers: stringList,
    implementations: stringList,
    benchmarks: stringList,
    datasets: stringList,
    status: z.object({ maturity: z.enum(MATURITY_LEVELS), disputed: z.boolean() }).strict(),
    evidence_summary: z
      .object({
        labels_used: z.array(z.enum(EVIDENCE_LABELS)),
        empirically_observed: z.boolean(),
      })
      .strict(),
    word_count_target: z.number().int().nonnegative().nullable(),
    updated_at: dateSchema,
    editorial_status: z.enum(EDITORIAL_STATUSES),
  })
  .strict();

export type RawFrontmatter = z.input<typeof FrontmatterSchema>;
export type ParsedFrontmatter = z.output<typeof FrontmatterSchema>;

/** Normalised, typed node metadata. Every downstream consumer uses this, never raw YAML. */
export interface NodeMeta {
  readonly id: NodeId;
  readonly entityType: EntityType;
  readonly title: string;
  readonly shortTitle: string;
  readonly volume: number | null;
  readonly part: number | null;
  readonly chapter: number | null;
  /** `"5.2"` for sections, derived from the id (never from the lossy YAML float). */
  readonly section: string | null;
  readonly slug: string;
  readonly parent: NodeId | null;
  readonly prevSibling: NodeId | null;
  readonly nextSibling: NodeId | null;
  readonly children: readonly NodeId[];
  readonly prerequisites: readonly NodeId[];
  readonly downstream: readonly NodeId[];
  readonly related: readonly NodeId[];
  readonly siblingsByMechanism: readonly NodeId[];
  readonly relations: readonly Relation[];
  readonly axes: {
    readonly lifecycle: readonly LifecycleStage[];
    readonly mechanism: readonly string[];
    readonly feedbackSetting: readonly FeedbackSetting[];
    readonly modality: readonly Modality[];
  };
  readonly papers: readonly string[];
  readonly implementations: readonly string[];
  readonly benchmarks: readonly string[];
  readonly datasets: readonly string[];
  readonly maturity: Maturity;
  readonly disputed: boolean;
  readonly labelsUsed: readonly EvidenceLabel[];
  readonly empiricallyObserved: boolean;
  readonly wordCountTarget: number | null;
  readonly updatedAt: string;
  readonly editorialStatus: EditorialStatus;
}

/** Pure normalisation from validated frontmatter to `NodeMeta`. */
export function toNodeMeta(parsed: ParsedFrontmatter): NodeMeta {
  const sectionMatch = /^ms\.section\.(\d+\.\d+)$/u.exec(parsed.id);
  return {
    id: parsed.id,
    entityType: entityTypeOf(parsed.id) ?? parsed.entity_type,
    title: parsed.title,
    shortTitle: parsed.short_title ?? parsed.title,
    volume: parsed.volume,
    part: parsed.part,
    chapter: parsed.chapter,
    section: sectionMatch?.[1] ?? null,
    slug: parsed.slug,
    parent: parsed.parent,
    prevSibling: parsed.prev_sibling,
    nextSibling: parsed.next_sibling,
    children: parsed.children,
    prerequisites: parsed.prerequisites,
    downstream: parsed.downstream,
    related: parsed.related,
    siblingsByMechanism: parsed.siblings_by_mechanism,
    relations: parsed.relations,
    axes: {
      lifecycle: parsed.axes.lifecycle,
      mechanism: parsed.axes.mechanism,
      feedbackSetting: parsed.axes.feedback_setting,
      modality: parsed.axes.modality,
    },
    papers: parsed.papers,
    implementations: parsed.implementations,
    benchmarks: parsed.benchmarks,
    datasets: parsed.datasets,
    maturity: parsed.status.maturity,
    disputed: parsed.status.disputed,
    labelsUsed: parsed.evidence_summary.labels_used,
    empiricallyObserved: parsed.evidence_summary.empirically_observed,
    wordCountTarget: parsed.word_count_target,
    updatedAt: parsed.updated_at,
    editorialStatus: parsed.editorial_status,
  };
}
