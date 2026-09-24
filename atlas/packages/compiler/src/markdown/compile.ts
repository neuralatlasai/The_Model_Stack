/**
 * `compileMarkdown`: one document body → CompiledBody (contract.ts).
 *
 *   parse (+ <details> normalisation) → link definitions → evidence rules
 *   → split into header / lead / H2 regions (anchors claimed first)
 *   → convert blocks (typed objects, figures, traces) → section thesis
 *   → layout jobs (sequential, awaited) → rail, outline, stats, citations
 *
 * Pure with respect to the filesystem: everything cross-document arrives via
 * the CompileContext. Content problems become diagnostics; the function only
 * throws for programmer errors.
 */
import type { Block, CompiledFigure, Region } from '@atlas/core';
import type { Nodes as MdastNodes } from 'mdast';
import type { CompileContext, CompiledBody, MarkdownInput } from './contract.ts';
import { createFlowConverter } from './convert.ts';
import { checkEvidenceRules } from './evidence.ts';
import { buildHeader, objectiveSentence } from './header.ts';
import { definitionKey } from './inline.ts';
import { buildOutline, buildStats, citationOrder, definedTerms, linkedNodes } from './outline.ts';
import { parseMarkdown } from './parse.ts';
import { buildRail } from './rail.ts';
import { splitDocument } from './regions.ts';
import { createState, type CompileState, type FlowEnv } from './state.ts';

function collectDefinitions(node: MdastNodes, st: CompileState): void {
  if (node.type === 'definition') {
    st.definitions.set(definitionKey(node.label ?? node.identifier), node.url);
    return;
  }
  if ('children' in node) for (const child of node.children) collectDefinitions(child, st);
}

/** Runs graph layouts one at a time (bounded work; ELK is CPU-bound). */
async function runLayouts(st: CompileState): Promise<void> {
  for (const job of st.layoutJobs) {
    try {
      job.figure.scene = await st.ctx.layout(job.spec);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      st.report('figure-layout-failed', `${job.figure.id}: layout failed: ${reason}`, job.line);
    }
  }
}

export async function compileMarkdown(input: MarkdownInput, ctx: CompileContext): Promise<CompiledBody> {
  const st = createState(input, ctx);
  const root = parseMarkdown(input.body);
  collectDefinitions(root, st);
  checkEvidenceRules(root, st);

  const split = splitDocument(root, st);
  st.regionAnchors = new Set(split.regions.map((plan) => plan.anchor));
  const flow = createFlowConverter(st);

  const { header, leadNodes } = buildHeader(split.front, st);
  const leadEnv: FlowEnv = {
    role: 'other',
    depth: 'overview',
    regionAnchor: split.regions[0]?.anchor ?? 'top',
    regionTitle: header.title,
  };
  const lead = flow(leadNodes, leadEnv);

  const regions: Region[] = split.regions.map((plan) => ({
    role: plan.role,
    title: plan.title,
    anchor: plan.anchor,
    depth: plan.depth,
    blocks: flow(plan.nodes, { role: plan.role, depth: plan.depth, regionAnchor: plan.anchor, regionTitle: plan.title }),
  }));

  for (const [index, region] of regions.entries()) {
    if (region.role === 'observations' && !region.blocks.some((block) => block.kind === 'observation-layer')) {
      st.report(
        'observation-layer-incomplete',
        'Observations has none of the four labelled paragraphs (What the paper claims / evidence shows / we infer / remains unknown)',
        st.lineOf(split.regions[index]?.heading),
      );
    }
  }

  const scope = regions.find((region) => region.role === 'scope');
  const finalHeader =
    input.meta.entityType === 'section' ? { ...header, thesis: scope === undefined ? null : objectiveSentence(scope.blocks) } : header;

  await runLayouts(st);

  const all: Block[] = [...lead, ...regions.flatMap((region) => region.blocks)];
  const figures: readonly CompiledFigure[] = st.figures;
  const citations = citationOrder(all, st);
  const headingLines = new Map(split.regions.map((plan) => [plan.anchor, st.lineOf(plan.heading)] as const));
  return {
    header: finalHeader,
    lead,
    regions,
    figures,
    rail: buildRail(regions, figures, st, headingLines),
    outline: buildOutline(regions),
    citations,
    definedTerms: definedTerms(all),
    linksTo: linkedNodes(all, input.meta.id),
    stats: buildStats(all, figures, citations),
    diagnostics: st.diagnostics,
  };
}

