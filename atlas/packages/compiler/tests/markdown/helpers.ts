/**
 * Test harness for the Markdown compiler: a deterministic fake CompileContext
 * (KaTeX for math, no highlighting, no layout, a fixed citation set) and
 * helpers to build NodeMeta and pull blocks out of a compiled body.
 */
import katex from 'katex';
import type {
  Block,
  BlockKind,
  BlockOf,
  CitationKey,
  Diagnostic,
  DiagnosticCode,
  FigureSpec,
  LinkTarget,
  NodeId,
  NodeMeta,
  Scene,
  XRefKind,
  XRefTarget,
} from '@atlas/core';
import { compileMarkdown } from '../../src/markdown/index.ts';
import type { CompileContext, CompiledBody } from '../../src/markdown/contract.ts';

export const KNOWN_CITATIONS: ReadonlySet<string> = new Set(['P01', 'P19', 'R5.6', 'R5.13', 'R5.15']);

export interface FakeContext extends CompileContext {
  readonly layoutCalls: FigureSpec[];
}

export interface FakeOptions {
  readonly xrefs?: Readonly<Record<string, XRefTarget>>;
  readonly links?: Readonly<Record<string, NodeId>>;
  readonly layout?: (spec: FigureSpec) => Promise<Scene | null>;
}

export function fakeContext(options: FakeOptions = {}): FakeContext {
  const layoutCalls: FigureSpec[] = [];
  return {
    layoutCalls,
    resolveLink: (href: string): LinkTarget => {
      if (/^https?:\/\//u.test(href)) return { type: 'external', href };
      const nodeId = options.links?.[href];
      if (nodeId !== undefined) return { type: 'node', nodeId, anchor: null, href: `/${nodeId}/` };
      return { type: 'unresolved', raw: href };
    },
    hasCitation: (key: CitationKey) => KNOWN_CITATIONS.has(key),
    resolveXRef: (kind: XRefKind, number: string) => options.xrefs?.[`${kind}:${number}`] ?? null,
    renderMath: (tex: string, displayMode: boolean) => katex.renderToString(tex, { displayMode, throwOnError: true, output: 'htmlAndMathml' }),
    highlight: () => null,
    layout: async (spec: FigureSpec) => {
      layoutCalls.push(spec);
      return options.layout === undefined ? null : options.layout(spec);
    },
    nodeExists: () => true,
  };
}

export function makeMeta(overrides: Partial<NodeMeta> = {}): NodeMeta {
  return {
    id: 'ms.section.5.2',
    entityType: 'section',
    title: 'Attention calculation',
    shortTitle: 'Attention',
    volume: 1,
    part: 1,
    chapter: 5,
    section: '5.2',
    slug: '05-2-attention-calculation',
    parent: 'ms.chapter.5',
    prevSibling: null,
    nextSibling: null,
    children: [],
    prerequisites: [],
    downstream: [],
    related: [],
    siblingsByMechanism: [],
    relations: [],
    axes: { lifecycle: [], mechanism: [], feedbackSetting: [], modality: [] },
    papers: [],
    implementations: [],
    benchmarks: [],
    datasets: [],
    maturity: 'foundational',
    disputed: false,
    labelsUsed: [],
    empiricallyObserved: false,
    wordCountTarget: null,
    updatedAt: '2026-09-20',
    editorialStatus: 'manuscript_draft',
    ...overrides,
  };
}

export async function compile(body: string, options: { meta?: Partial<NodeMeta>; ctx?: FakeContext; bodyStartLine?: number } = {}): Promise<CompiledBody> {
  return compileMarkdown(
    { sourcePath: 'fixture.md', body, bodyStartLine: options.bodyStartLine ?? 1, meta: makeMeta(options.meta) },
    options.ctx ?? fakeContext(),
  );
}

/** Every block of the body (lead + regions), nested blocks included, in reading order. */
export function allBlocks(body: CompiledBody): Block[] {
  const out: Block[] = [];
  const visit = (blocks: readonly Block[]): void => {
    for (const block of blocks) {
      out.push(block);
      if (block.kind === 'quote' || block.kind === 'expansion') visit(block.blocks);
      else if (block.kind === 'list') for (const item of block.items) visit(item.blocks);
      else if (block.kind === 'proposition' && block.proof !== null) visit(block.proof);
      else if (block.kind === 'experiment') for (const field of block.fields) visit(field.blocks);
    }
  };
  visit(body.lead);
  for (const region of body.regions) visit(region.blocks);
  return out;
}

export function blocksOf<K extends BlockKind>(body: CompiledBody, kind: K): BlockOf<K>[] {
  return allBlocks(body).filter((block): block is BlockOf<K> => block.kind === kind);
}

export function onlyBlock<K extends BlockKind>(body: CompiledBody, kind: K): BlockOf<K> {
  const found = blocksOf(body, kind);
  if (found.length !== 1) throw new Error(`expected exactly one ${kind} block, found ${found.length}`);
  const [block] = found;
  if (block === undefined) throw new Error(`no ${kind} block`);
  return block;
}

export function codes(body: CompiledBody, severity?: Diagnostic['severity']): DiagnosticCode[] {
  return body.diagnostics.filter((item) => severity === undefined || item.severity === severity).map((item) => item.code);
}

/** Wraps fixture content in a minimal section: an H1 and one region with the given heading. */
export function section(region: string, content: string): string {
  return `# 5.2 Attention calculation\n\n## ${region}\n\n${content}\n`;
}
