/**
 * Figures (VISUAL_GRAMMAR §2, §4): authored ```figure blocks and Mermaid
 * concept maps.
 *
 * Authored: YAML → FigureSpecSchema (shape) → validateFigure (semantics:
 * formulas, endpoints, citations, node ids, chapter, performance context) →
 * numbering and anchors → layout job for graph-shaped kinds. A figure that
 * fails YAML or schema, repeats an id, or carries a formula that cannot be
 * evaluated is replaced by its source as a code block (the diagnostics fail
 * the build); other semantic problems are diagnosed and the figure is kept.
 *
 * Mermaid: parseMermaid → a derived `diagram` figure whose text equivalent is
 * the nested list that follows the diagram (kept as an ordinary list too).
 */
import {
  FigureSpecSchema,
  LAID_OUT_KINDS,
  isCitationKey,
  isFigureId,
  isNodeId,
  objectAnchor,
  type Block,
  type CodeBlock,
  type CompiledFigure,
  type DiagnosticCode,
  type FigureBlock,
  type FigureSpec,
  type FigureSpecOf,
} from '@atlas/core';
import type { Code, List, ListItem, RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { parseDocument } from 'yaml';
import { depthOf, type CompileState, type FlowEnv, type PendingFigure } from './state.ts';
import { describeFigure, parseMermaid, validateFigure } from './visual.ts';

const MAX_ALT = 1200;
const MAX_ISSUES_IN_MESSAGE = 6;

function highlightSafe(st: CompileState, code: string, lang: string | null): string | null {
  try {
    return st.ctx.highlight(code, lang);
  } catch {
    // Highlighting is presentational; an unhighlightable block renders as plain monospace text.
    return null;
  }
}

function sourceAsCode(node: Code, st: CompileState, env: FlowEnv, anchor: string | null, highlightAs: string): CodeBlock {
  return {
    kind: 'code',
    anchor,
    depth: depthOf('code', env),
    lang: node.lang ?? null,
    code: node.value,
    html: highlightSafe(st, node.value, highlightAs),
  };
}

function figureBlock(figure: CompiledFigure, env: FlowEnv): FigureBlock {
  return { kind: 'figure', anchor: figure.anchor, depth: depthOf('figure', env), figure };
}

function register(st: CompileState, figure: PendingFigure, spec: FigureSpec, line: number | null): void {
  st.figures.push(figure);
  st.figureIds.add(figure.id);
  if (LAID_OUT_KINDS.has(spec.kind)) st.layoutJobs.push({ figure, spec, line });
}

/** Validation codes after which a figure cannot be rendered safely (it is replaced by its source). */
const UNSAFE_CODES: ReadonlySet<DiagnosticCode> = new Set<DiagnosticCode>(['figure-formula-invalid', 'figure-schema-invalid']);

/** Graph kinds need unique ids and edges between existing nodes before layout can run (validateFigure reports why). */
function graphIsWellFormed(spec: FigureSpec): boolean {
  let ids: string[];
  let edges: readonly { readonly from: string; readonly to: string }[];
  if (spec.kind === 'diagram') {
    ids = spec.spec.nodes.map((node) => node.id);
    edges = spec.spec.edges;
  } else if (spec.kind === 'cycle') {
    ids = spec.spec.stages.map((stage) => stage.id);
    edges = spec.spec.edges;
  } else {
    return true;
  }
  const known = new Set(ids);
  return known.size === ids.length && edges.every((edge) => known.has(edge.from) && known.has(edge.to));
}

/** `fig-5.3` → `5.3`. */
export function figureNumber(id: string): string {
  return id.startsWith('fig-') ? id.slice('fig-'.length) : id;
}

// ─── authored figures ────────────────────────────────────────────────────────

export function compileAuthoredFigure(node: Code, st: CompileState, env: FlowEnv): Block {
  const fenceLine = st.lineOf(node);
  const firstContentLine = fenceLine === null ? null : fenceLine + 1;

  const doc = parseDocument(node.value, { uniqueKeys: true, prettyErrors: false });
  const yamlError = doc.errors[0];
  if (yamlError !== undefined) {
    // Error offsets are character positions in the block; count lines to point into the file.
    const offset = yamlError.pos[0];
    const at = node.value.slice(0, offset).split('\n').length;
    const line = firstContentLine === null ? fenceLine : firstContentLine + at - 1;
    st.report('figure-yaml-invalid', `figure YAML: ${yamlError.message.split('\n')[0] ?? yamlError.code}`, line);
    return sourceAsCode(node, st, env, null, 'yaml');
  }
  const data: unknown = doc.toJS({ maxAliasCount: 50 });

  const parsed = FigureSpecSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, MAX_ISSUES_IN_MESSAGE).map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`);
    const more = parsed.error.issues.length > MAX_ISSUES_IN_MESSAGE ? ` (+${parsed.error.issues.length - MAX_ISSUES_IN_MESSAGE} more)` : '';
    const rawId = typeof data === 'object' && data !== null && 'id' in data && typeof data.id === 'string' ? data.id : null;
    st.report('figure-schema-invalid', `figure ${rawId ?? '(no id)'}: ${issues.join('; ')}${more}`, fenceLine);
    if (parsed.error.issues.some((issue) => issue.path.includes('evidence') && issue.message.includes('EMPIRICALLY-OBSERVED'))) {
      st.report('label-forbidden', `figure ${rawId ?? '(no id)'}: EMPIRICALLY-OBSERVED is forbidden in Edition 1.0`, fenceLine);
    }
    const anchor = rawId !== null && isFigureId(rawId) && !st.figureIds.has(rawId) ? st.anchors.claim(objectAnchor('fig', figureNumber(rawId))) : null;
    return sourceAsCode(node, st, env, anchor, 'yaml');
  }
  const spec = parsed.data;

  if (st.figureIds.has(spec.id)) {
    st.report('figure-duplicate-id', `${spec.id} is defined more than once in this document`, fenceLine);
    return sourceAsCode(node, st, env, null, 'yaml');
  }
  const issues = validateFigure(spec, {
    chapter: st.input.meta.chapter,
    hasCitation: (key) => isCitationKey(key) && st.ctx.hasCitation(key),
    nodeExists: (id) => isNodeId(id) && st.ctx.nodeExists(id),
  });
  let unsafe = !graphIsWellFormed(spec);
  for (const issue of issues) {
    st.report(issue.code, issue.message, fenceLine);
    // Unevaluable formulas and structural inconsistencies would break the renderer; reference problems do not.
    if (UNSAFE_CODES.has(issue.code)) unsafe = true;
  }
  const number = figureNumber(spec.id);
  if (unsafe) {
    st.figureIds.add(spec.id);
    return sourceAsCode(node, st, env, st.anchors.claim(objectAnchor('fig', number)), 'yaml');
  }

  let regionAnchor = env.regionAnchor;
  if (spec.anchor !== undefined) {
    if (st.regionAnchors.has(spec.anchor)) regionAnchor = spec.anchor;
    else st.report('figure-reference-invalid', `${spec.id}: anchor '${spec.anchor}' is not a region of this document`, fenceLine);
  }

  const figure: PendingFigure = {
    id: spec.id,
    number,
    anchor: st.anchors.claim(objectAnchor('fig', number)),
    origin: 'authored',
    placement: spec.placement,
    regionAnchor,
    spec,
    scene: null,
    evidence: spec.evidence,
    sources: spec.source,
    text: `${spec.alt}\n${describeFigure(spec)}`,
  };
  register(st, figure, spec, fenceLine);
  return figureBlock(figure, env);
}

// ─── Mermaid concept maps ────────────────────────────────────────────────────

function itemText(item: ListItem, depth: number, out: string[]): void {
  const [first, ...others] = item.children;
  const text = first === undefined || first.type === 'list' ? '' : toString(first).replace(/\s+/gu, ' ').trim();
  if (text !== '') out.push(`${'  '.repeat(depth)}- ${text}`);
  for (const child of first?.type === 'list' ? item.children : others) {
    if (child.type === 'list') for (const nested of child.children) itemText(nested, depth + 1, out);
  }
}

/** Plain-text rendering of the nested list that is a diagram's text equivalent. */
export function listAsText(list: List): string {
  const out: string[] = [];
  for (const item of list.children) itemText(item, 0, out);
  return out.join('\n');
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

/**
 * The nested list that is the diagram's text equivalent: directly after the
 * diagram, or after a short lead-in paragraph such as "Text equivalent:".
 */
export function textEquivalentList(following: readonly RootContent[]): List | null {
  const [first, second] = following;
  if (first?.type === 'list') return first;
  if (first?.type === 'paragraph' && second?.type === 'list') {
    const lead = toString(first).trim();
    if (lead.length <= 120 && (lead.endsWith(':') || /^text equivalent/iu.test(lead))) return second;
  }
  return null;
}

export function compileMermaidFigure(node: Code, following: readonly RootContent[], st: CompileState, env: FlowEnv): Block {
  const fenceLine = st.lineOf(node);
  const result = parseMermaid(node.value);
  for (const issue of result.issues) {
    const line = fenceLine === null || issue.line === null ? fenceLine : fenceLine + issue.line;
    st.report('mermaid-parse-error', `Mermaid: ${issue.message}`, line);
  }
  const diagram = result.spec;
  if (diagram === null) return sourceAsCode(node, st, env, null, 'mermaid');

  st.counters.mermaid += 1;
  const ordinal = st.counters.mermaid;
  const scope = st.input.meta.chapter ?? st.input.meta.slug;
  const id: CompiledFigure['id'] = `fig-auto-${scope}-concept-map-${ordinal}`;

  let alt: string;
  const list = textEquivalentList(following);
  if (list !== null) {
    alt = clip(listAsText(list), MAX_ALT);
  } else {
    st.report('block-malformed', 'Mermaid diagram is not followed by its text-equivalent nested list (CONTENT_CONTRACT §8)', fenceLine);
    alt = `Diagram with ${diagram.nodes.length} nodes and ${diagram.edges.length} edges.`;
  }
  const conceptMap = env.role === 'concept-map';
  const spec: FigureSpecOf<'diagram'> = {
    // Derived figures have no authored id; the spec carries a synthetic chapter-0 id (see CompiledFigure.id for the real one).
    id: `fig-0.${ordinal}`,
    kind: 'diagram',
    title: conceptMap ? `${st.input.meta.shortTitle}: concepts and dependencies` : env.regionTitle || 'Diagram',
    caption:
      'Solid arrows carry data or control forward; dashed arrows mark dependencies and reuse; shapes follow the atlas primitives (tensor, process, memory, objective).',
    placement: diagram.direction === 'LR' || diagram.nodes.length > 12 ? 'wide' : 'inline',
    evidence: 'KNOWN',
    source: ['concept map'],
    alt,
    concepts: [],
    states: [],
    spec: diagram,
  };
  const figure: PendingFigure = {
    id,
    number: null,
    anchor: st.anchors.claim(id),
    origin: 'mermaid',
    placement: spec.placement,
    regionAnchor: env.regionAnchor,
    spec,
    scene: null,
    evidence: 'KNOWN',
    sources: spec.source,
    text: `${alt}\n${describeFigure(spec)}`,
  };
  register(st, figure, spec, fenceLine);
  return figureBlock(figure, env);
}
