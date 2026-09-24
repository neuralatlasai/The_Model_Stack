/**
 * Flow content (a sequence of mdast block nodes) → research-AST blocks.
 *
 * The converter walks one sibling sequence at a time with lookahead, because
 * several typed objects span more than one mdast node: display math + its tag
 * line, an algorithm + its `Complexity:` paragraph, an experiment heading + its
 * field list, a proposition + its proof, `<details>` … `</details>`, a sibling
 * head + a split-off differential, and the four observation paragraphs.
 */
import type { Block, ExpansionBlock, HeadingBlock, Inline, ListBlock, ParagraphBlock } from '@atlas/core';
import type { Heading, List, Paragraph, PhrasingContent, RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { convertBlockquote } from './blocks/quote.ts';
import { convertCode } from './blocks/code.ts';
import { convertEquation } from './blocks/equation.ts';
import { convertExperiment } from './blocks/experiment.ts';
import { buildObservationLayer, observationPartOf } from './blocks/observation-layer.ts';
import { convertSibling } from './blocks/sibling.ts';
import { convertTable } from './blocks/table.ts';
import type { FlowConverter } from './flow-types.ts';
import { convertPhrasing, htmlAsInline } from './inline.ts';
import { plainText, trimInline } from './inline-utils.ts';
import { isDetailsClose, isDetailsOpen, parseRaw, summaryText } from './parse.ts';
import { slugify } from './slug.ts';
import { depthOf, type CompileState, type FlowEnv } from './state.ts';

export function createFlowConverter(st: CompileState): FlowConverter {
  const flow: FlowConverter = (nodes, env) => convertSequence(nodes, env, st, flow);
  return flow;
}

/** Claims a heading anchor from its text, diagnosing collisions with existing anchors. */
export function claimHeadingAnchor(text: string, st: CompileState, line: number | null): string {
  const base = slugify(text) || 'section';
  if (st.anchors.has(base)) {
    st.report('heading-duplicate-anchor', `heading "${text}" repeats the anchor #${base}; it is renamed`, line);
  }
  return st.anchors.claim(base);
}

export function paragraphBlock(content: readonly Inline[], env: FlowEnv): ParagraphBlock {
  return { kind: 'paragraph', anchor: null, depth: depthOf('paragraph', env), content: trimInline(content) };
}

function headingBlock(node: Heading, st: CompileState, env: FlowEnv): HeadingBlock {
  const content = trimInline(convertPhrasing(node.children, st));
  // H1/H2 inside a nested container cannot open a region; they render as H3.
  const level: HeadingBlock['level'] = node.depth === 4 || node.depth === 5 || node.depth === 6 ? node.depth : 3;
  return {
    kind: 'heading',
    level,
    content,
    anchor: claimHeadingAnchor(plainText(content).trim(), st, st.lineOf(node)),
    depth: depthOf('heading', env),
  };
}

function listBlock(node: List, env: FlowEnv, flow: FlowConverter): ListBlock {
  const ordered = node.ordered === true;
  return {
    kind: 'list',
    anchor: null,
    depth: depthOf('list', env),
    ordered,
    start: ordered ? (node.start ?? 1) : null,
    items: node.children.map((item) => ({ blocks: flow(item.children, env), checked: item.checked ?? null })),
  };
}

/** Inline content of a short Markdown fragment (e.g. a `<summary>` text), positioned at `line`. */
function inlineFromMarkdown(text: string, st: CompileState): Inline[] {
  const fragment = parseRaw(text.trim());
  const first = fragment.children[0];
  if (first?.type === 'paragraph' || first?.type === 'heading') return trimInline(convertPhrasing(first.children, st));
  return text.trim() === '' ? [] : [{ kind: 'text', value: text.trim() }];
}

interface DetailsRange {
  readonly block: ExpansionBlock;
  /** Index of the closing `</details>` (or the last node consumed). */
  readonly end: number;
}

function collectDetails(nodes: readonly RootContent[], start: number, st: CompileState, env: FlowEnv, flow: FlowConverter): DetailsRange {
  let depth = 0;
  let end = -1;
  for (let j = start; j < nodes.length; j += 1) {
    const node = nodes[j];
    if (node?.type !== 'html') continue;
    if (isDetailsOpen(node.value)) depth += 1;
    else if (isDetailsClose(node.value)) {
      depth -= 1;
      if (depth === 0) {
        end = j;
        break;
      }
    }
  }
  if (end === -1) {
    st.report('block-malformed', '<details> is never closed; the rest of the region is placed inside the expansion', st.lineOf(nodes[start]));
    end = nodes.length - 1;
  }
  let inner = nodes.slice(start + 1, end + (isClose(nodes[end]) ? 0 : 1));
  let summary: Inline[] = [];
  const head = inner[0];
  const headSummary = head?.type === 'html' ? summaryText(head.value) : null;
  if (headSummary !== null) {
    summary = inlineFromMarkdown(headSummary, st);
    inner = inner.slice(1);
  }
  const summaryPlain = plainText(summary).trim();
  const variant = /^Derivation\b/iu.test(summaryPlain) ? 'derivation' : /\bProof\b/iu.test(summaryPlain) ? 'proof' : 'expansion';
  return {
    block: {
      kind: 'expansion',
      anchor: null,
      depth: depthOf('expansion', env),
      variant,
      summary: summary.length > 0 ? summary : [{ kind: 'text', value: 'Details' }],
      blocks: flow(inner, env),
    },
    end,
  };
}

function isClose(node: RootContent | undefined): boolean {
  return node?.type === 'html' && isDetailsClose(node.value);
}

const PROOF_LEAD = /^(?:Proof(?: sketch)?|Derivation)\.?$/iu;

function isProofParagraph(node: RootContent | undefined): node is Paragraph {
  if (node?.type !== 'paragraph') return false;
  const lead = node.children[0];
  return (lead?.type === 'emphasis' || lead?.type === 'strong') && PROOF_LEAD.test(toString(lead).trim());
}

function convertSequence(nodes: readonly RootContent[], env: FlowEnv, st: CompileState, flow: FlowConverter): Block[] {
  const out: Block[] = [];
  const consumed = new Set<RootContent>();
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (node === undefined || consumed.has(node)) continue;
    const next = nodes[i + 1];
    switch (node.type) {
      case 'paragraph': {
        if (env.role === 'observations' && observationPartOf(node) !== null) {
          const members = nodes
            .slice(i)
            .filter((item): item is Paragraph => item.type === 'paragraph' && !consumed.has(item) && observationPartOf(item) !== null);
          for (const member of members) consumed.add(member);
          out.push(buildObservationLayer(members, st, env, st.lineOf(node)));
          break;
        }
        if (env.role === 'siblings') {
          const sibling = convertSibling(node, next, st, env);
          if (sibling !== null) {
            out.push(sibling.value);
            i += sibling.extra;
            break;
          }
        }
        const content = convertPhrasing(node.children, st);
        if (content.length > 0) out.push(paragraphBlock(content, env));
        break;
      }
      case 'heading': {
        if (node.depth >= 3) {
          const experiment = convertExperiment(node, nodes.slice(i + 1), st, env, flow);
          if (experiment !== null) {
            out.push(experiment.value);
            i += experiment.extra;
            break;
          }
        }
        out.push(headingBlock(node, st, env));
        break;
      }
      case 'blockquote': {
        const block = convertBlockquote(node, st, env, flow);
        if (block.kind !== 'proposition') {
          out.push(block);
          break;
        }
        const proof: Block[] = [];
        let j = i + 1;
        while (isProofParagraph(nodes[j])) {
          const paragraph = nodes[j];
          if (paragraph?.type === 'paragraph') proof.push(paragraphBlock(convertPhrasing(paragraph.children, st), env));
          j += 1;
        }
        const candidate = nodes[j];
        if (proof.length === 0 && candidate?.type === 'html' && isDetailsOpen(candidate.value)) {
          const details = collectDetails(nodes, j, st, env, flow);
          proof.push(...details.block.blocks);
          j = details.end + 1;
        }
        out.push(proof.length > 0 ? { ...block, proof } : block);
        i = j - 1;
        break;
      }
      case 'math': {
        const equation = convertEquation(node, next, st, env);
        out.push(equation.value);
        i += equation.extra;
        break;
      }
      case 'code': {
        const code = convertCode(node, nodes.slice(i + 1), st, env);
        out.push(code.value);
        i += code.extra;
        break;
      }
      case 'list':
        out.push(listBlock(node, env, flow));
        break;
      case 'table':
        out.push(convertTable(node, st, env));
        break;
      case 'thematicBreak':
        out.push({ kind: 'rule', anchor: null, depth: depthOf('rule', env) });
        break;
      case 'html': {
        if (isDetailsOpen(node.value)) {
          const details = collectDetails(nodes, i, st, env, flow);
          out.push(details.block);
          i = details.end;
          break;
        }
        const content = htmlAsInline(node.value, st, st.lineOf(node));
        if (content.length > 0) out.push(paragraphBlock(content, env));
        break;
      }
      case 'definition':
        // Link-reference definitions are collected before conversion and render nothing.
        break;
      case 'footnoteDefinition':
        out.push(...flow(node.children, env));
        break;
      default: {
        const text = toString(node).trim();
        if (text !== '') out.push(paragraphBlock([{ kind: 'text', value: text }], env));
        break;
      }
    }
  }
  return out;
}

/** Phrasing of a heading or paragraph as inline nodes (used by the header builder). */
export function inlineOf(children: readonly PhrasingContent[], st: CompileState): Inline[] {
  return trimInline(convertPhrasing(children, st));
}
