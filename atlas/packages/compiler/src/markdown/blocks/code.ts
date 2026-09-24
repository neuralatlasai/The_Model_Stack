/**
 * Fenced code dispatch (CONTENT_CONTRACT §5, VISUAL_GRAMMAR §2):
 *   ```figure            → authored figure
 *   ```mermaid           → derived concept-map figure
 *   ```text Algorithm …  → AlgorithmBlock (+ following `Complexity:` paragraph)
 *   ```text Tensor trace → TensorTraceBlock
 *   ```text Systems trace→ SystemsTraceBlock
 *   anything else        → CodeBlock with context-provided highlighting
 */
import type { Block, CodeBlock } from '@atlas/core';
import type { Code, RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import { compileAuthoredFigure, compileMermaidFigure } from '../figures.ts';
import type { Consumed } from '../flow-types.ts';
import { convertPhrasing } from '../inline.ts';
import { stripLead, trimInline } from '../inline-utils.ts';
import { depthOf, type CompileState, type FlowEnv } from '../state.ts';
import { parseSystemsTrace, parseTensorTrace } from '../visual.ts';
import { isAlgorithmSource, parseAlgorithm } from './algorithm.ts';

const PLAIN_LANGS: ReadonlySet<string> = new Set(['', 'text', 'txt', 'plain', 'plaintext']);
const COMPLEXITY = /^\s*Complexity\s*:\s*/u;

function firstLine(code: string): string {
  return (code.split(/\r?\n/u).find((line) => line.trim() !== '') ?? '').trim();
}

function plainCode(node: Code, st: CompileState, env: FlowEnv): CodeBlock {
  const lang = node.lang ?? null;
  let html: string | null;
  try {
    html = st.ctx.highlight(node.value, lang);
  } catch {
    // Highlighting is presentational; fall back to unhighlighted monospace.
    html = null;
  }
  const linkable = !PLAIN_LANGS.has((lang ?? '').toLowerCase());
  if (linkable) st.counters.code += 1;
  return {
    kind: 'code',
    anchor: linkable ? st.anchors.claim(`code-${st.counters.code}`) : null,
    depth: depthOf('code', env),
    lang,
    code: node.value,
    html,
  };
}

export function convertCode(node: Code, following: readonly RootContent[], st: CompileState, env: FlowEnv): Consumed<Block> {
  const next = following[0];
  const lang = (node.lang ?? '').toLowerCase();
  const line = st.lineOf(node);
  if (lang === 'figure') return { value: compileAuthoredFigure(node, st, env), extra: 0 };
  if (lang === 'mermaid') return { value: compileMermaidFigure(node, following, st, env), extra: 0 };
  if (!PLAIN_LANGS.has(lang)) return { value: plainCode(node, st, env), extra: 0 };

  const head = firstLine(node.value);
  if (isAlgorithmSource(node.value)) {
    const algorithm = parseAlgorithm(node.value, st, env, line);
    if (next?.type === 'paragraph' && COMPLEXITY.test(toString(next))) {
      const complexity = trimInline(stripLead(convertPhrasing(next.children, st), COMPLEXITY));
      return { value: { ...algorithm, complexity: complexity.length > 0 ? complexity : null }, extra: 1 };
    }
    return { value: algorithm, extra: 0 };
  }
  if (/^Tensor trace\b/iu.test(head)) {
    const trace = parseTensorTrace(node.value);
    if (trace !== null) {
      return {
        value: {
          kind: 'tensor-trace',
          anchor: null,
          depth: depthOf('tensor-trace', env),
          title: trace.title,
          lines: trace.lines,
          dims: trace.dims,
          raw: node.value,
        },
        extra: 0,
      };
    }
    st.report('block-malformed', 'tensor trace could not be parsed; rendered as code', line);
    return { value: plainCode(node, st, env), extra: 0 };
  }
  if (/^Systems trace\b/iu.test(head)) {
    const trace = parseSystemsTrace(node.value);
    if (trace !== null) {
      return {
        value: {
          kind: 'systems-trace',
          anchor: null,
          depth: depthOf('systems-trace', env),
          title: trace.title,
          columns: trace.columns,
          rows: trace.rows,
          raw: node.value,
        },
        extra: 0,
      };
    }
    st.report('block-malformed', 'systems trace could not be parsed; rendered as code', line);
    return { value: plainCode(node, st, env), extra: 0 };
  }
  return { value: plainCode(node, st, env), extra: 0 };
}
