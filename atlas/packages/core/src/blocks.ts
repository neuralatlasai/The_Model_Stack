/**
 * Block-level research AST (UI_UX §6, CONTENT_CONTRACT §5).
 *
 * Every typed object of the content grammar is a first-class block with its
 * own renderer — definitions, claims, equations, algorithms, failure modes and
 * the rest are NOT generic callouts. The compiler recognises them from the
 * mandatory Markdown grammar; anything unrecognised degrades to a generic block
 * plus a diagnostic, never to raw HTML.
 */
import type { Depth } from './depth.ts';
import type { EvidenceLabel, ObservationPart } from './evidence.ts';
import type { CitationKey, FigureId, ImplId, NodeId } from './ids.ts';
import type { Inline, LinkTarget } from './inline.ts';
import type { Scene } from './scene.ts';
import type { FigureEvidence, FigurePlacement, FigureSpec, SystemsTraceColumn } from './visual-spec.ts';

interface BlockBase {
  /** Stable fragment id when the block is independently linkable (`eq-5-4`, `alg-5-2`, `fm-future-leakage`); else null. */
  readonly anchor: string | null;
  /** Minimum reader depth at which the block is shown. */
  readonly depth: Depth;
}

export interface ParagraphBlock extends BlockBase {
  readonly kind: 'paragraph';
  readonly content: readonly Inline[];
}

/** H3–H6 inside a region (H2s define regions, see document.ts). */
export interface HeadingBlock extends BlockBase {
  readonly kind: 'heading';
  readonly level: 3 | 4 | 5 | 6;
  readonly content: readonly Inline[];
  readonly anchor: string;
}

export interface ListItem {
  readonly blocks: readonly Block[];
  readonly checked: boolean | null;
}

export interface ListBlock extends BlockBase {
  readonly kind: 'list';
  readonly ordered: boolean;
  readonly start: number | null;
  readonly items: readonly ListItem[];
}

/** Semantic role of a table so the renderer can pick sticky columns, emphasis, and breakout width. */
export type TableRole =
  | 'generic'
  | 'benchmark'
  | 'dataset'
  | 'model'
  | 'comparison'
  | 'performance'
  | 'references'
  | 'position'
  | 'sections'
  | 'stack-coverage';

export interface TableColumn {
  readonly header: readonly Inline[];
  readonly align: 'left' | 'center' | 'right' | null;
}

export interface TableBlock extends BlockBase {
  readonly kind: 'table';
  readonly role: TableRole;
  readonly columns: readonly TableColumn[];
  /** rows[r][c] is the inline content of one cell. */
  readonly rows: readonly (readonly (readonly Inline[])[])[];
  /** Tables wider than the prose measure break out to analysis width. */
  readonly wide: boolean;
}

export interface QuoteBlock extends BlockBase {
  readonly kind: 'quote';
  readonly blocks: readonly Block[];
}

export interface RuleBlock extends BlockBase {
  readonly kind: 'rule';
}

/** `> **Definition — <term>.** …` — only in the owning chapter. */
export interface DefinitionBlock extends BlockBase {
  readonly kind: 'definition';
  readonly term: string;
  /** Glossary slug; also the fragment anchor `term-<slug>`. */
  readonly termSlug: string;
  readonly content: readonly Inline[];
}

export interface ClaimSource {
  readonly raw: string;
  readonly type: 'paper' | 'reference' | 'official-doc' | 'derived' | 'other';
  readonly key: CitationKey | null;
}

/** `> **Claim [<LABEL> · <source>].** …` */
export interface ClaimBlock extends BlockBase {
  readonly kind: 'claim';
  readonly label: EvidenceLabel;
  readonly sources: readonly ClaimSource[];
  readonly content: readonly Inline[];
}

/** `> **Assumption.** … · *sensitivity:* …` */
export interface AssumptionBlock extends BlockBase {
  readonly kind: 'assumption';
  readonly content: readonly Inline[];
  readonly sensitivity: readonly Inline[] | null;
}

/** `> **Observation [<LABEL>].** …` */
export interface ObservationBlock extends BlockBase {
  readonly kind: 'observation';
  readonly label: EvidenceLabel | null;
  readonly content: readonly Inline[];
}

/** `> **Proposition 14.1.** …` followed optionally by a proof sketch / derivation. */
export interface PropositionBlock extends BlockBase {
  readonly kind: 'proposition';
  readonly variant: 'proposition' | 'theorem' | 'lemma' | 'corollary';
  readonly number: string | null;
  readonly content: readonly Inline[];
  readonly proof: readonly Block[] | null;
}

export interface EquationVariable {
  readonly symbol: string;
  readonly meaning: string;
}

/** Display math `$$…$$` with trailing `*(Eq. 5.4)* where …` line. */
export interface EquationBlock extends BlockBase {
  readonly kind: 'equation';
  /** `"5.4"` when tagged, else null (untagged display math is not linkable). */
  readonly number: string | null;
  readonly tex: string;
  /** KaTeX HTML+MathML, rendered at compile time. Trusted compiler output. */
  readonly html: string;
  /** Text of the `where …` clause. */
  readonly note: readonly Inline[] | null;
  /** Parsed from the `where` clause (`L = layers, S = …`); feeds the equation inspector. */
  readonly variables: readonly EquationVariable[];
}

/** `<details><summary>…</summary>…</details>` — inline expansion; never a separate page (UI_UX §30). */
export interface ExpansionBlock extends BlockBase {
  readonly kind: 'expansion';
  readonly variant: 'derivation' | 'proof' | 'expansion';
  readonly summary: readonly Inline[];
  readonly blocks: readonly Block[];
}

export interface AlgorithmLine {
  /** Line number as written (`1.` → 1), null for unnumbered continuation lines. */
  readonly n: number | null;
  readonly code: string;
  /** Trailing `# …` comment, without the marker. */
  readonly comment: string | null;
  /** Leading indentation in spaces after the number column. */
  readonly indent: number;
}

/** Fenced `text` block whose first line is `Algorithm 5.2 — <name>`. */
export interface AlgorithmBlock extends BlockBase {
  readonly kind: 'algorithm';
  readonly number: string | null;
  readonly name: string;
  readonly input: readonly string[];
  readonly output: readonly string[];
  readonly state: readonly string[];
  readonly invariant: readonly string[];
  readonly lines: readonly AlgorithmLine[];
  /** Lines after the numbered body (TERMINATION, COMPLEXITY, notes). */
  readonly trailer: readonly string[];
  /** The paragraph directly after the block starting with `Complexity:`, when present. */
  readonly complexity: readonly Inline[] | null;
}

export interface CodeBlock extends BlockBase {
  readonly kind: 'code';
  readonly lang: string | null;
  readonly code: string;
  /** Shiki dual-theme HTML (CSS variables), or null when the language is unknown. Trusted compiler output. */
  readonly html: string | null;
}

export type TensorSegment = { readonly type: 'shape'; readonly text: string } | { readonly type: 'op'; readonly text: string };

/** Fenced `text` block titled `Tensor trace`. Each line is `shape → op → shape …`. */
export interface TensorTraceBlock extends BlockBase {
  readonly kind: 'tensor-trace';
  readonly title: string;
  readonly lines: readonly (readonly TensorSegment[])[];
  /** Dimension symbols seen in shapes, in first-seen order (B, T, D, H, Dh, …). */
  readonly dims: readonly string[];
  readonly raw: string;
}

/** Fenced `text` block titled `Systems trace`. */
export interface SystemsTraceBlock extends BlockBase {
  readonly kind: 'systems-trace';
  readonly title: string;
  /** Column names from the header row, or the canonical columns when rows use `key: value` pairs. */
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- known values documented; raw author text accepted and diagnosed
  readonly columns: readonly (SystemsTraceColumn | string)[];
  readonly rows: readonly { readonly stage: string; readonly cells: readonly string[] }[];
  readonly raw: string;
}

/** Fixed experiment field list (CONTENT_CONTRACT §5). */
export const EXPERIMENT_FIELDS = [
  'Hypothesis',
  'Setup',
  'Independent variables',
  'Controlled variables',
  'Dataset/workload',
  'Hardware',
  'Metrics',
  'Baselines',
  'Expected result',
  'Ablation',
  'Interpretation',
  'Threats to validity',
] as const;
export type ExperimentField = (typeof EXPERIMENT_FIELDS)[number];

/** `### Experiment 5.3 — <name>` with the fixed field list. Always a proposal in Edition 1.0. */
export interface ExperimentBlock extends BlockBase {
  readonly kind: 'experiment';
  readonly number: string;
  readonly name: string;
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- known values documented; raw author text accepted and diagnosed
  readonly fields: readonly { readonly name: ExperimentField | string; readonly blocks: readonly Block[] }[];
}

/** `> **Failure mode — <name>.** *Symptom:* … *Cause:* … *Detection:* … *Mitigation:* …` */
export interface FailureModeBlock extends BlockBase {
  readonly kind: 'failure-mode';
  readonly name: string;
  readonly symptom: readonly Inline[] | null;
  readonly cause: readonly Inline[] | null;
  readonly detection: readonly Inline[] | null;
  readonly mitigation: readonly Inline[] | null;
}

/** `> **Open question.** … · *what evidence would settle it:* …` */
export interface OpenQuestionBlock extends BlockBase {
  readonly kind: 'open-question';
  readonly content: readonly Inline[];
  readonly settle: readonly Inline[] | null;
}

export type NoteVariant = 'historical' | 'caveat' | 'warning' | 'further-reading' | 'implementation';

/** Historical note, caveat, warning, further reading, implementation note. */
export interface NoteBlock extends BlockBase {
  readonly kind: 'note';
  readonly variant: NoteVariant;
  readonly content: readonly Inline[];
  /** Implementation notes only: `[impl.pytorch · 2.14.0 …]`. */
  readonly impl: ImplId | null;
  readonly version: string | null;
}

/** The four labelled paragraphs under `## Observations` (UI_UX §41). */
export interface ObservationLayerBlock extends BlockBase {
  readonly kind: 'observation-layer';
  readonly parts: Readonly<Record<ObservationPart, readonly Inline[] | null>>;
}

export const SIBLING_FIELDS = [
  'whyExists',
  'assumptionChanged',
  'objectiveChanged',
  'problemSolved',
  'newFailureMode',
  'changedPrimitive',
] as const;
export type SiblingField = (typeof SIBLING_FIELDS)[number];

export const SIBLING_FIELD_TITLES: Readonly<Record<SiblingField, string>> = {
  whyExists: 'Why it exists',
  assumptionChanged: 'What assumption changed',
  objectiveChanged: 'What objective changed',
  problemSolved: 'What problem it solved',
  newFailureMode: 'What new failure mode it introduced',
  changedPrimitive: 'Changed primitive',
};

/** A differential sibling under `## Siblings` (CONTENT_CONTRACT §7, UI_UX §14). */
export interface SiblingBlock extends BlockBase {
  readonly kind: 'sibling';
  readonly name: string;
  readonly target: LinkTarget | null;
  readonly differential: Readonly<Record<SiblingField, readonly Inline[] | null>>;
}

export type FigureOrigin = 'authored' | 'mermaid' | 'tensor-trace' | 'systems-trace';

/** A figure after validation, numbering, and (for graph kinds) layout. */
export interface CompiledFigure {
  /** Authored id (`fig-5.3`) or a generated id for derived figures (`fig-auto-5.2-concept-map`). */
  readonly id: FigureId | `fig-auto-${string}`;
  /** Display number (`"5.3"`), null for unnumbered derived figures. */
  readonly number: string | null;
  /** Fragment id (`fig-5-3`). */
  readonly anchor: string;
  readonly origin: FigureOrigin;
  readonly placement: FigurePlacement;
  /** The region (H2 anchor) the figure belongs to; rail figures activate with it. */
  readonly regionAnchor: string;
  readonly spec: FigureSpec;
  /** Present for diagram and cycle kinds. */
  readonly scene: Scene | null;
  readonly evidence: FigureEvidence;
  readonly sources: readonly string[];
  /** Full text equivalent: `alt` plus a structured description generated from the spec. */
  readonly text: string;
}

export interface FigureBlock extends BlockBase {
  readonly kind: 'figure';
  readonly figure: CompiledFigure;
}

export type Block =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | TableBlock
  | QuoteBlock
  | RuleBlock
  | DefinitionBlock
  | ClaimBlock
  | AssumptionBlock
  | ObservationBlock
  | PropositionBlock
  | EquationBlock
  | ExpansionBlock
  | AlgorithmBlock
  | CodeBlock
  | TensorTraceBlock
  | SystemsTraceBlock
  | ExperimentBlock
  | FailureModeBlock
  | OpenQuestionBlock
  | NoteBlock
  | ObservationLayerBlock
  | SiblingBlock
  | FigureBlock;

export type BlockKind = Block['kind'];
export type BlockOf<K extends BlockKind> = Extract<Block, { kind: K }>;

/** Default minimum depth per block kind; the effective depth is max(region depth, this). */
export const BLOCK_KIND_DEPTH: Readonly<Record<BlockKind, Depth>> = {
  paragraph: 'overview',
  heading: 'overview',
  list: 'overview',
  table: 'overview',
  quote: 'overview',
  rule: 'overview',
  definition: 'overview',
  claim: 'overview',
  assumption: 'technical',
  observation: 'research',
  proposition: 'technical',
  equation: 'technical',
  expansion: 'technical',
  algorithm: 'technical',
  code: 'implementation',
  'tensor-trace': 'technical',
  'systems-trace': 'implementation',
  experiment: 'research',
  'failure-mode': 'research',
  'open-question': 'research',
  note: 'overview',
  'observation-layer': 'research',
  sibling: 'research',
  figure: 'overview',
};

/** Ids referenced by a node that the graph and inspector need without re-walking blocks. */
export interface BlockReferences {
  readonly citations: readonly CitationKey[];
  readonly nodes: readonly NodeId[];
}
