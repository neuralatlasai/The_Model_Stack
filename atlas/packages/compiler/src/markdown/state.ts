/**
 * Per-document compile state. One `CompileState` lives for exactly one
 * `compileMarkdown` call; nothing here is module-global, so concurrent
 * compiles of different documents cannot interfere.
 */
import {
  BLOCK_KIND_DEPTH,
  diagnostic,
  maxDepth,
  type BlockKind,
  type CompiledFigure,
  type Depth,
  type Diagnostic,
  type DiagnosticCode,
  type FigureSpec,
  type RegionRole,
} from '@atlas/core';
import type { Nodes } from 'mdast';
import type { CompileContext, MarkdownInput } from './contract.ts';
import { createAnchorRegistry, type AnchorRegistry } from './slug.ts';

/** Where a block sequence sits: the enclosing region decides depth and figure binding. */
export interface FlowEnv {
  readonly role: RegionRole;
  readonly depth: Depth;
  /** Region anchor; for the lead (content before the first H2) the first region's anchor. */
  readonly regionAnchor: string;
  /** Region title (used for derived figure titles). */
  readonly regionTitle: string;
}

/** A compiled figure whose `scene` is filled in after the (async) layout pass. */
export type PendingFigure = { -readonly [K in keyof CompiledFigure]: CompiledFigure[K] };

export interface LayoutJob {
  readonly figure: PendingFigure;
  readonly spec: FigureSpec;
  readonly line: number | null;
}

export interface CompileState {
  readonly input: MarkdownInput;
  readonly ctx: CompileContext;
  readonly anchors: AnchorRegistry;
  readonly diagnostics: Diagnostic[];
  /** Every figure in document order (inline, wide, rail; authored and derived). */
  readonly figures: CompiledFigure[];
  readonly figureIds: Set<string>;
  readonly layoutJobs: LayoutJob[];
  readonly equationNumbers: Set<string>;
  /** Region anchors of the document, known before any block is converted. */
  regionAnchors: ReadonlySet<string>;
  /** Link-reference definitions (`[id]: url`), by normalised identifier. */
  readonly definitions: Map<string, string>;
  /** Monotonic counters for ordinal anchors (claims, open questions, code, concept maps). */
  readonly counters: { claim: number; openQuestion: number; code: number; mermaid: number };
  /** De-duplication of per-document info/warning diagnostics keyed by subject. */
  readonly reported: Set<string>;
  /** Converts an mdast line (1-based within the body) into a file line. */
  readonly fileLine: (bodyLine: number | null | undefined) => number | null;
  readonly lineOf: (node: Nodes | undefined) => number | null;
  /** Adds a diagnostic with the code's canonical severity; `line` is a body line (mdast). */
  readonly report: (code: DiagnosticCode, message: string, bodyLine?: number | null) => void;
  /** Like `report`, but only once per `key` within the document. */
  readonly reportOnce: (key: string, code: DiagnosticCode, message: string, bodyLine?: number | null) => void;
}

export function createState(input: MarkdownInput, ctx: CompileContext): CompileState {
  const diagnostics: Diagnostic[] = [];
  const reported = new Set<string>();
  const fileLine = (bodyLine: number | null | undefined): number | null =>
    bodyLine === null || bodyLine === undefined ? null : bodyLine + input.bodyStartLine - 1;
  const report = (code: DiagnosticCode, message: string, bodyLine: number | null = null): void => {
    diagnostics.push(diagnostic(code, message, { file: input.sourcePath, line: fileLine(bodyLine), nodeId: input.meta.id }));
  };
  return {
    input,
    ctx,
    anchors: createAnchorRegistry(),
    diagnostics,
    figures: [],
    figureIds: new Set(),
    layoutJobs: [],
    equationNumbers: new Set(),
    regionAnchors: new Set(),
    definitions: new Map(),
    counters: { claim: 0, openQuestion: 0, code: 0, mermaid: 0 },
    reported,
    fileLine,
    lineOf: (node) => node?.position?.start.line ?? null,
    report,
    reportOnce: (key, code, message, bodyLine = null) => {
      if (reported.has(key)) return;
      reported.add(key);
      report(code, message, bodyLine);
    },
  };
}

/** Effective depth of a block: at least its region's depth (UI_UX §29). */
export function depthOf(kind: BlockKind, env: FlowEnv): Depth {
  return maxDepth(env.depth, BLOCK_KIND_DEPTH[kind]);
}
