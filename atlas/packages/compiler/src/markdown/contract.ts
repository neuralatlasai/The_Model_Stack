/**
 * Internal seam of the compiler.
 *
 *   project/ (walk docs, frontmatter, manifest, routes, registries, graph, search, emit)
 *        │  builds a CompileContext per file
 *        ▼
 *   markdown/ compileMarkdown(input, ctx) → CompiledBody
 *
 * `markdown/` knows nothing about the filesystem, the manifest, or other
 * documents; everything cross-document arrives through `CompileContext`
 * callbacks. That keeps the Markdown → research-AST translation pure and
 * unit-testable on strings.
 */
import type {
  Block,
  CitationKey,
  CompiledFigure,
  Diagnostic,
  DocumentHeader,
  DocumentStats,
  FigureSpec,
  LinkTarget,
  NodeId,
  NodeMeta,
  OutlineEntry,
  RailBinding,
  Region,
  Scene,
  XRefKind,
  XRefTarget,
} from '@atlas/core';

export interface MarkdownInput {
  /** Path relative to `docs/`, forward slashes. Used for diagnostics and link resolution. */
  readonly sourcePath: string;
  /** Markdown body with the frontmatter block already removed. */
  readonly body: string;
  /** 1-based line of the first body line in the original file (for diagnostic line numbers). */
  readonly bodyStartLine: number;
  readonly meta: NodeMeta;
}

export interface CompileContext {
  /** Resolves an href written in `sourcePath` (relative `.md` path, `#anchor`, or absolute URL). */
  readonly resolveLink: (href: string) => LinkTarget;
  /** True when the citation key has a record in the registry (any chapter's references.md). */
  readonly hasCitation: (key: CitationKey) => boolean;
  /**
   * Resolves "Eq. 5.4" / "Algorithm 5.2" / "Figure 5.3" / "Experiment 5.1" / "Proposition 14.1"
   * to the node and anchor that define it. Resolution is two-pass: the project layer first
   * indexes every document's numbered objects, then compiles bodies with this resolver.
   */
  readonly resolveXRef: (kind: XRefKind, number: string) => XRefTarget | null;
  /** Server-side KaTeX render (displayMode for $$ blocks). Throws on TeX errors; the caller diagnoses. */
  readonly renderMath: (tex: string, displayMode: boolean) => string;
  /** Shiki dual-theme HTML, or null when the language is not loaded. */
  readonly highlight: (code: string, lang: string | null) => string | null;
  /** Layout for graph-shaped figure kinds (diagram, cycle). Provided by @atlas/visual. */
  readonly layout: (spec: FigureSpec) => Promise<Scene | null>;
  /** Chapter-level existence check for node ids referenced from figures (`concepts`, `node`). */
  readonly nodeExists: (id: NodeId) => boolean;
}

/** Everything a ResearchDocument needs from the body; the project layer adds meta, route, and sourcePath. */
export interface CompiledBody {
  readonly header: DocumentHeader;
  readonly lead: readonly Block[];
  readonly regions: readonly Region[];
  readonly figures: readonly CompiledFigure[];
  readonly rail: readonly RailBinding[];
  readonly outline: readonly OutlineEntry[];
  readonly citations: readonly CitationKey[];
  readonly definedTerms: readonly string[];
  readonly linksTo: readonly NodeId[];
  readonly stats: DocumentStats;
  readonly diagnostics: readonly Diagnostic[];
}

/**
 * First-pass index of a document's numbered objects, produced without resolving
 * links or rendering math, so the project layer can build `resolveXRef` before
 * the full compile pass.
 */
export interface NumberedObjectIndex {
  readonly equations: readonly string[];
  readonly algorithms: readonly string[];
  readonly figures: readonly string[];
  readonly experiments: readonly string[];
  readonly propositions: readonly string[];
}
