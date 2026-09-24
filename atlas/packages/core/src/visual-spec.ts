/**
 * Visual grammar contract (UI_UX §10, §16, §21, §26–27, §53–55; docs/VISUAL_GRAMMAR.md).
 *
 * Authors write ```figure fenced blocks containing YAML that must satisfy
 * `FigureSpecSchema`. The schema checks shape; the compiler additionally checks
 * semantics (formula identifiers, edge endpoints, evidence rules) and lays out
 * graph-shaped kinds into a `Scene`.
 *
 * Primitive vocabulary is fixed so a reader learns one visual language:
 * node kinds share glyphs across every diagram, cycle, and hierarchy.
 */
import { z } from 'zod';
import { EVIDENCE_LABELS, type EvidenceLabel } from './evidence.ts';
import { isFigureId, isNodeId } from './ids.ts';

/** UI_UX §53 diagram primitives. Mermaid label prefixes `[Tensor]` etc. map onto these. */
export const NODE_KINDS = [
  'node',
  'process',
  'state',
  'tensor',
  'memory',
  'dataset',
  'model',
  'objective',
  'metric',
  'hardware',
  'flow',
  'dependency',
  'branch',
  'feedback',
  'boundary',
] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

/** Edge semantics: flow = data/control (solid), dependency = requires (dashed), feedback = returns (curved), emphasis = the argument's main path. */
export const EDGE_KINDS = ['flow', 'dependency', 'feedback', 'emphasis'] as const;
export type EdgeKind = (typeof EDGE_KINDS)[number];

export const FIGURE_KINDS = [
  'diagram',
  'tensor-flow',
  'systems-trace',
  'memory-stack',
  'calculator',
  'stat-panel',
  'lineage',
  'cycle',
  'matrix',
  'chart',
  'hierarchy',
  'compare',
] as const;
export type FigureKind = (typeof FIGURE_KINDS)[number];

/**
 * - `inline`: in the reading column (≈760 px).
 * - `wide`: breaks out to analysis width (≈1100 px) for large diagrams/tables.
 * - `rail`: a scroll-bound instrument in the context rail, active while its region is read.
 */
export const FIGURE_PLACEMENTS = ['inline', 'wide', 'rail'] as const;
export type FigurePlacement = (typeof FIGURE_PLACEMENTS)[number];

/** Number formats shared by calculators, stat panels, memory stacks, and chart axes. */
export const VALUE_FORMATS = [
  'bytes',
  'bits',
  'bytes/s',
  'flops',
  'flop/s',
  'params',
  'tokens',
  'seconds',
  'si',
  'percent',
  'ratio',
  'integer',
  'fixed1',
  'fixed2',
  'fixed3',
  'raw',
] as const;
export type ValueFormat = (typeof VALUE_FORMATS)[number];

export const LINEAGE_RELATIONS = [
  'conceptual ancestor',
  'engineering optimization',
  'alternative branch',
  'superseded approach',
  'current frontier',
] as const;
export type LineageRelation = (typeof LINEAGE_RELATIONS)[number];

// ─── shared field schemas ─────────────────────────────────────────────────────

const localId = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]{0,39}$/u, 'local ids: letter then [A-Za-z0-9_-], ≤ 40 chars');
/** Formula identifiers: `H_kv`, `d_h`, `T`, `b`. Greek and primes are written out (`beta`, `Tp`). */
const symbol = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,23}$/u, 'symbols: ASCII identifier ≤ 24 chars');
const formula = z.string().min(1).max(400);
const shortText = z.string().min(1).max(160);
const nodeIdRef = z
  .string()
  .refine((value) => isNodeId(value), { message: 'not a node id' })
  .transform((value) => value);
const variables = z.record(symbol, z.number());

/** Evidence for a figure's numbers. EMPIRICALLY-OBSERVED is forbidden in Edition 1.0. */
const figureEvidence = z
  .enum(EVIDENCE_LABELS)
  .refine((label) => label !== 'EMPIRICALLY-OBSERVED', { message: 'EMPIRICALLY-OBSERVED is forbidden in Edition 1.0' });

/** Required next to any reported performance number (CONTENT_CONTRACT §5, performance-figure row). */
export const PerformanceContextSchema = z
  .object({
    hardware: shortText,
    model: shortText,
    precision: shortText,
    sequenceLength: shortText,
    ioDistribution: shortText,
    concurrency: shortText,
    runtimeVersion: shortText,
    measurementBoundary: shortText,
  })
  .strict();
export type PerformanceContext = z.output<typeof PerformanceContextSchema>;

/** One scroll-driven state of a rail instrument, active while `anchor` is the region being read. */
export const FigureStateSchema = z
  .object({
    anchor: z.string().regex(/^[a-z0-9-]+$/u),
    /** Short state name shown in the instrument header (`T = 8K`, `decode`, `pre-norm`). */
    label: z.string().min(1).max(40).optional(),
    /** Formula-variable / calculator-input overrides for this state. */
    variables: variables.optional(),
    /** Keys of the parts to light (see envelope `states` docs). */
    highlight: z.array(z.string().min(1).max(80)).max(16).default([]),
    /** One line on what this state shows. */
    note: z.string().min(1).max(240).optional(),
  })
  .strict();
export type FigureState = z.output<typeof FigureStateSchema>;

const envelope = {
  id: z
    .string()
    .refine((value) => isFigureId(value), { message: 'figure id must be fig-<chapter>.<n>' })
    .transform((value) => value),
  title: z.string().min(3).max(120),
  /** What to notice, in one or two sentences. Not a restatement of the title. */
  caption: z.string().min(10).max(700),
  placement: z.enum(FIGURE_PLACEMENTS).default('inline'),
  /** Region anchor (H2 slug) a rail figure binds to; defaults to the enclosing region. */
  anchor: z.string().regex(/^[a-z0-9-]+$/u).optional(),
  evidence: figureEvidence,
  /** Source ids: `P19`, `R5.13`, `DERIVED:eq-5.8`, `OD:vllm-docs`. At least one. */
  source: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).transform((value) =>
    Array.isArray(value) ? value : [value],
  ),
  /** Text equivalent (UI_UX §60): what the figure shows, in words a screen reader can use. */
  alt: z.string().min(20).max(1200),
  concepts: z.array(nodeIdRef).default([]),
  context: PerformanceContextSchema.optional(),
  /**
   * Scroll-driven states (rail figures only; ai-2027-style live instrument). The figure stays
   * pinned in the rail while the reader is in any listed region and transitions between states:
   * formula-driven values recompute with `variables` overrides and tween, `highlight` lights the
   * named parts (diagram/cycle node ids, chart series ids, stat-panel row keys, memory-stack
   * segment labels, hierarchy level labels, tensor-flow step indexes "0".., systems-trace stage
   * names, lineage works, compare dimensions) and dims the rest, `note` replaces the state line.
   */
  states: z.array(FigureStateSchema).max(16).default([]),
} as const;

// ─── kind-specific specs ──────────────────────────────────────────────────────

export const DiagramSpecSchema = z
  .object({
    direction: z.enum(['LR', 'TB']).default('LR'),
    nodes: z
      .array(
        z
          .object({
            id: localId,
            kind: z.enum(NODE_KINDS).default('node'),
            label: z.string().min(1).max(80),
            /** Monospace sub-label: a tensor shape, a byte count, a version. */
            sub: z.string().max(60).optional(),
            group: localId.optional(),
            emphasis: z.boolean().default(false),
          })
          .strict(),
      )
      .min(2)
      .max(40),
    edges: z
      .array(
        z
          .object({
            from: localId,
            to: localId,
            kind: z.enum(EDGE_KINDS).default('flow'),
            label: z.string().max(60).optional(),
          })
          .strict(),
      )
      .max(80)
      .default([]),
    groups: z
      .array(z.object({ id: localId, label: z.string().min(1).max(60) }).strict())
      .max(10)
      .default([]),
  })
  .strict();

export const TensorFlowSpecSchema = z
  .object({
    /** Dimension legend: symbol → meaning. Hovering a dimension in any shape highlights it everywhere. */
    dims: z.record(z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,11}$/u), z.string().min(1).max(60)),
    steps: z
      .array(
        z
          .object({
            /** e.g. `[B, T, 3, H, Dh]`. */
            shape: z.string().regex(/^\[[^\]]+\]$/u, 'shape must be written [d1, d2, ...]'),
            label: z.string().max(60).optional(),
            /** The operation that produced this step from the previous one; omit on the first step. */
            op: z.string().max(80).optional(),
            /** Cost line for the op: FLOPs, bytes, params. */
            cost: z.string().max(80).optional(),
          })
          .strict(),
      )
      .min(2)
      .max(16),
  })
  .strict();

export const SYSTEMS_TRACE_COLUMNS = ['latency', 'memory', 'compute', 'communication', 'failure'] as const;
export type SystemsTraceColumn = (typeof SYSTEMS_TRACE_COLUMNS)[number];

export const SystemsTraceSpecSchema = z
  .object({
    columns: z.array(z.enum(SYSTEMS_TRACE_COLUMNS)).min(1).max(5).default([...SYSTEMS_TRACE_COLUMNS]),
    stages: z
      .array(
        z
          .object({
            name: z.string().min(1).max(60),
            values: z.partialRecord(z.enum(SYSTEMS_TRACE_COLUMNS), z.string().max(120)),
            emphasis: z.boolean().default(false),
          })
          .strict(),
      )
      .min(2)
      .max(16),
  })
  .strict();

export const MemoryStackSpecSchema = z
  .object({
    format: z.enum(VALUE_FORMATS).default('bytes'),
    variables: variables.default({}),
    bars: z
      .array(
        z
          .object({
            label: z.string().min(1).max(60),
            segments: z
              .array(
                z
                  .object({
                    label: z.string().min(1).max(60),
                    kind: z.enum(NODE_KINDS).default('memory'),
                    value: z.number().nonnegative().optional(),
                    formula: formula.optional(),
                  })
                  .strict()
                  .refine((s) => (s.value === undefined) !== (s.formula === undefined), {
                    message: 'give exactly one of value or formula',
                  }),
              )
              .min(1)
              .max(12),
          })
          .strict(),
      )
      .min(1)
      .max(8),
    /** A capacity line, e.g. device HBM; drawn as a hairline across the bars. */
    budget: z
      .object({ label: z.string().min(1).max(60), value: z.number().positive().optional(), formula: formula.optional() })
      .strict()
      .refine((b) => (b.value === undefined) !== (b.formula === undefined), {
        message: 'give exactly one of value or formula',
      })
      .optional(),
  })
  .strict();

export const CalculatorSpecSchema = z
  .object({
    /** Display equation (TeX). Rendered with KaTeX; symbols in `inputs` become inspectable. */
    tex: z.string().min(1).max(400),
    /** Equation number this calculator executes, e.g. `5.8`. */
    equation: z.string().regex(/^\d+\.\d+$/u).optional(),
    inputs: z
      .array(
        z
          .object({
            symbol,
            label: z.string().min(1).max(60),
            default: z.number(),
            min: z.number(),
            max: z.number(),
            step: z.number().positive().optional(),
            scale: z.enum(['linear', 'log2', 'log10']).default('linear'),
            /** Discrete choices (e.g. bytes per value 0.5, 1, 2, 4). Overrides min/max/step for the control. */
            options: z.array(z.number()).min(2).max(12).optional(),
            format: z.enum(VALUE_FORMATS).default('raw'),
          })
          .strict()
          .refine((i) => i.min <= i.default && i.default <= i.max, { message: 'default must lie in [min, max]' }),
      )
      .min(1)
      .max(8),
    outputs: z
      .array(
        z
          .object({
            symbol,
            label: z.string().min(1).max(60),
            formula,
            format: z.enum(VALUE_FORMATS).default('raw'),
            emphasis: z.boolean().default(false),
          })
          .strict(),
      )
      .min(1)
      .max(6),
    presets: z
      .array(z.object({ label: z.string().min(1).max(40), values: variables }).strict())
      .max(6)
      .default([]),
  })
  .strict();

export const StatPanelSpecSchema = z
  .object({
    /** Instrument header, AI-2040 style (e.g. `REFERENCE CONFIG · BF16`). */
    header: z.string().min(1).max(60),
    variables: variables.default({}),
    rows: z
      .array(
        z
          .object({
            key: z.string().min(1).max(40),
            value: z.string().max(40).optional(),
            formula: formula.optional(),
            format: z.enum(VALUE_FORMATS).default('raw'),
            note: z.string().max(80).optional(),
          })
          .strict()
          .refine((r) => (r.value === undefined) !== (r.formula === undefined), {
            message: 'give exactly one of value or formula',
          }),
      )
      .min(1)
      .max(12),
    glyph: z
      .discriminatedUnion('type', [
        z
          .object({
            type: z.literal('dots'),
            total: z.number().int().min(2).max(240),
            filled: z.number().int().min(0),
            legend: z
              .array(z.object({ marker: z.enum(['filled', 'hollow']), label: z.string().min(1).max(40), value: z.string().max(24).optional() }).strict())
              .max(3)
              .default([]),
          })
          .strict(),
        z
          .object({
            type: z.literal('blocks'),
            items: z
              .array(z.object({ label: z.string().min(1).max(24), weight: z.number().positive(), emphasis: z.boolean().default(false) }).strict())
              .min(1)
              .max(16),
          })
          .strict(),
      ])
      .optional(),
  })
  .strict();

export const LineageSpecSchema = z
  .object({
    entries: z
      .array(
        z
          .object({
            year: z.union([z.number().int().min(1900).max(2100), z.string().regex(/^\d{4}\+?$/u)]),
            work: z.string().min(1).max(80),
            cite: z.string().regex(/^(P\d{2}|R\d+\.\d+)$/u).optional(),
            node: nodeIdRef.optional(),
            relation: z.enum(LINEAGE_RELATIONS),
            note: z.string().max(140).optional(),
          })
          .strict(),
      )
      .min(2)
      .max(20),
  })
  .strict();

export const CycleSpecSchema = z
  .object({
    stages: z
      .array(z.object({ id: localId, label: z.string().min(1).max(40), kind: z.enum(NODE_KINDS).default('process'), sub: z.string().max(40).optional() }).strict())
      .min(3)
      .max(12),
    edges: z
      .array(
        z
          .object({ from: localId, to: localId, kind: z.enum(['flow', 'feedback']).default('flow'), label: z.string().max(40).optional() })
          .strict(),
      )
      .min(2)
      .max(30),
  })
  .strict();

export const MATRIX_PATTERNS = ['causal', 'full', 'banded', 'block-diagonal', 'prefix', 'dilated', 'explicit'] as const;
export type MatrixPattern = (typeof MATRIX_PATTERNS)[number];

export const MatrixSpecSchema = z
  .object({
    rows: z.number().int().min(2).max(64),
    cols: z.number().int().min(2).max(64),
    pattern: z.enum(MATRIX_PATTERNS),
    /** Window for `banded`, block size for `block-diagonal`, prefix length for `prefix`, stride for `dilated`. */
    parameter: z.number().int().positive().optional(),
    /** Explicit cell intensities in [0, 1], rows × cols; required iff pattern = explicit. */
    cells: z.array(z.array(z.number().min(0).max(1))).optional(),
    rowLabel: z.string().min(1).max(40),
    colLabel: z.string().min(1).max(40),
    rowTicks: z.array(z.string().max(12)).optional(),
    colTicks: z.array(z.string().max(12)).optional(),
    highlight: z.array(z.object({ row: z.number().int().min(0), col: z.number().int().min(0) }).strict()).max(64).default([]),
    legend: z.string().max(120).optional(),
  })
  .strict();

const axisSchema = z
  .object({
    label: z.string().min(1).max(60),
    scale: z.enum(['linear', 'log2', 'log10']).default('linear'),
    format: z.enum(VALUE_FORMATS).default('raw'),
    domain: z.tuple([z.number(), z.number()]).optional(),
    ticks: z.array(z.number()).max(16).optional(),
  })
  .strict();

export const ChartSpecSchema = z
  .object({
    type: z.enum(['line', 'step', 'scatter', 'area', 'bar']),
    x: axisSchema,
    y: axisSchema,
    variables: variables.default({}),
    /** For `bar`: category labels; each series then gives `values` of the same length. */
    categories: z.array(z.string().min(1).max(40)).max(24).optional(),
    series: z
      .array(
        z
          .object({
            id: localId,
            label: z.string().min(1).max(60),
            points: z.array(z.tuple([z.number(), z.number()])).max(500).optional(),
            values: z.array(z.number()).max(24).optional(),
            /** y = f(x, variables); sampled over `sample`. */
            formula: formula.optional(),
            sample: z
              .object({ from: z.number(), to: z.number(), count: z.number().int().min(2).max(400) })
              .strict()
              .optional(),
            emphasis: z.boolean().default(false),
            dashed: z.boolean().default(false),
          })
          .strict(),
      )
      .min(1)
      .max(8),
    annotations: z
      .array(z.object({ x: z.number(), y: z.number().optional(), label: z.string().min(1).max(60) }).strict())
      .max(8)
      .default([]),
  })
  .strict();

export const HierarchySpecSchema = z
  .object({
    direction: z.enum(['down', 'up']).default('down'),
    levels: z
      .array(
        z
          .object({
            label: z.string().min(1).max(40),
            kind: z.enum(NODE_KINDS).default('hardware'),
            capacity: z.string().max(40).optional(),
            bandwidth: z.string().max(40).optional(),
            latency: z.string().max(40).optional(),
            note: z.string().max(100).optional(),
            emphasis: z.boolean().default(false),
          })
          .strict(),
      )
      .min(2)
      .max(12),
  })
  .strict();

export const CompareSpecSchema = z
  .object({
    /** The evaluation axis, stated before anything is compared (CLAUDE.md §3). */
    axis: z.string().min(10).max(200),
    columns: z
      .array(z.object({ id: localId, label: z.string().min(1).max(40), node: nodeIdRef.optional() }).strict())
      .min(2)
      .max(6),
    rows: z
      .array(
        z
          .object({
            dimension: z.string().min(1).max(60),
            values: z.record(localId, z.string().max(160)),
            note: z.string().max(160).optional(),
          })
          .strict(),
      )
      .min(2)
      .max(24),
  })
  .strict();

// ─── the discriminated union ──────────────────────────────────────────────────

export const FigureSpecSchema = z.discriminatedUnion('kind', [
  z.object({ ...envelope, kind: z.literal('diagram'), spec: DiagramSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('tensor-flow'), spec: TensorFlowSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('systems-trace'), spec: SystemsTraceSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('memory-stack'), spec: MemoryStackSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('calculator'), spec: CalculatorSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('stat-panel'), spec: StatPanelSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('lineage'), spec: LineageSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('cycle'), spec: CycleSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('matrix'), spec: MatrixSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('chart'), spec: ChartSpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('hierarchy'), spec: HierarchySpecSchema }).strict(),
  z.object({ ...envelope, kind: z.literal('compare'), spec: CompareSpecSchema }).strict(),
]);

export type FigureSpecInput = z.input<typeof FigureSpecSchema>;
export type FigureSpec = z.output<typeof FigureSpecSchema>;
export type FigureSpecOf<K extends FigureKind> = Extract<FigureSpec, { kind: K }>;

export type DiagramSpec = z.output<typeof DiagramSpecSchema>;
export type TensorFlowSpec = z.output<typeof TensorFlowSpecSchema>;
export type SystemsTraceSpec = z.output<typeof SystemsTraceSpecSchema>;
export type MemoryStackSpec = z.output<typeof MemoryStackSpecSchema>;
export type CalculatorSpec = z.output<typeof CalculatorSpecSchema>;
export type StatPanelSpec = z.output<typeof StatPanelSpecSchema>;
export type LineageSpec = z.output<typeof LineageSpecSchema>;
export type CycleSpec = z.output<typeof CycleSpecSchema>;
export type MatrixSpec = z.output<typeof MatrixSpecSchema>;
export type ChartSpec = z.output<typeof ChartSpecSchema>;
export type HierarchySpec = z.output<typeof HierarchySpecSchema>;
export type CompareSpec = z.output<typeof CompareSpecSchema>;

/** Kinds whose geometry is computed by the layout engine at compile time. */
export const LAID_OUT_KINDS: ReadonlySet<FigureKind> = new Set<FigureKind>(['diagram', 'cycle']);

/** Kinds that need client-side code (sliders, hover values). Everything else is static SVG/HTML. */
export const INTERACTIVE_KINDS: ReadonlySet<FigureKind> = new Set<FigureKind>(['calculator', 'chart']);

export type FigureEvidence = Exclude<EvidenceLabel, 'EMPIRICALLY-OBSERVED'>;
