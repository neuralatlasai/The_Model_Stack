/**
 * `### Experiment 5.1 — <name>` followed by the fixed field list
 * (CONTENT_CONTRACT §5, UI_UX §42). Fields are read from a list whose items
 * open with a bold label (`**Hypothesis.**`, `**Setup:**`,
 * `**Dataset / workload.**`, `**Expected result (as a proposal).**`), or — for
 * compact summaries — from a paragraph of `Hypothesis: … Setup: …` runs.
 */
import { EXPERIMENT_FIELDS, objectAnchor, type Block, type ExperimentBlock, type Inline } from '@atlas/core';
import type { Heading, List, Paragraph, RootContent } from 'mdast';
import { toString } from 'mdast-util-to-string';
import type { Consumed, FlowConverter } from '../flow-types.ts';
import { convertPhrasing } from '../inline.ts';
import { splitByMarkers, stripLead, trimInline, type InlineMarker } from '../inline-utils.ts';
import { depthOf, type CompileState, type FlowEnv } from '../state.ts';

const TITLE = /^Experiments?\s+((?:\d+|[A-Z])\.\d+[a-z]?)(?![\d.])\s*([\s\S]*)$/u;

export function experimentTitle(heading: Heading): { number: string; name: string } | null {
  const match = TITLE.exec(toString(heading).replace(/\s+/gu, ' ').trim());
  if (match === null) return null;
  const tail = (match[2] ?? '').trim();
  const dash = /[—–]|\s-\s|^:\s*/u.exec(tail);
  const name = dash === null ? tail : tail.slice(dash.index + dash[0].length).trim();
  return { number: match[1] ?? '', name };
}

/** `Dataset / workload.` → `Dataset/workload`; `Expected result (as a proposal):` → `Expected result`. */
export function canonicalField(label: string): string {
  const bare = label
    .replace(/\([^)]*\)/gu, ' ')
    .replace(/[.:]+\s*$/u, '')
    .replace(/\s*\/\s*/gu, '/')
    .replace(/\s+/gu, ' ')
    .trim();
  const canonical = EXPERIMENT_FIELDS.find((field) => field.toLowerCase() === bare.toLowerCase());
  return canonical ?? bare;
}

const FIELD_PATTERN = EXPERIMENT_FIELDS.map((field) => field.replace('/', String.raw`\s*/\s*`)).join('|');
const PARAGRAPH_MARKERS: readonly InlineMarker<string>[] = EXPERIMENT_FIELDS.map((field) => ({
  key: field,
  text: new RegExp(String.raw`(?<=^|\n|[.;]\s+)${field.replace('/', String.raw`\s*/\s*`)}(?:\s*\([^)]*\))?\s*:`, 'u'),
}));
const STARTS_WITH_FIELD = new RegExp(String.raw`^\s*(?:${FIELD_PATTERN})(?:\s*\([^)]*\))?\s*:`, 'u');

interface Field {
  name: string;
  blocks: Block[];
}

function fieldsFromList(list: List, st: CompileState, env: FlowEnv, flow: FlowConverter): Field[] {
  const fields: Field[] = [];
  for (const item of list.children) {
    const [first, ...others] = item.children;
    const lead = first?.type === 'paragraph' ? first.children[0] : undefined;
    if (first?.type === 'paragraph' && lead?.type === 'strong') {
      const name = canonicalField(toString(lead));
      const content = trimInline(stripLead(convertPhrasing(first.children.slice(1), st), /^[\s:.—–-]+/u));
      const blocks: Block[] = [];
      if (content.length > 0) blocks.push({ kind: 'paragraph', anchor: null, depth: depthOf('paragraph', env), content });
      blocks.push(...flow(others, env));
      fields.push({ name, blocks });
      continue;
    }
    const blocks = flow(item.children, env);
    const previous = fields.at(-1);
    if (previous === undefined) fields.push({ name: 'Note', blocks });
    else previous.blocks.push(...blocks);
  }
  return fields;
}

function fieldsFromParagraphs(paragraphs: readonly Paragraph[], st: CompileState, env: FlowEnv): Field[] {
  const content: Inline[] = [];
  for (const paragraph of paragraphs) {
    if (content.length > 0) content.push({ kind: 'text', value: '\n' });
    content.push(...convertPhrasing(paragraph.children, st));
  }
  const split = splitByMarkers(content, PARAGRAPH_MARKERS);
  return split.parts.map((part) => ({
    name: part.key,
    blocks: part.content.length === 0 ? [] : [{ kind: 'paragraph', anchor: null, depth: depthOf('paragraph', env), content: part.content }],
  }));
}

/**
 * Converts the experiment heading and consumes its field list (or field
 * paragraphs). Returns null when the heading is not an experiment heading.
 */
export function convertExperiment(
  heading: Heading,
  following: readonly RootContent[],
  st: CompileState,
  env: FlowEnv,
  flow: FlowConverter,
): Consumed<ExperimentBlock> | null {
  const title = experimentTitle(heading);
  if (title === null) return null;
  const line = st.lineOf(heading);
  let fields: Field[] = [];
  let extra = 0;
  const next = following[0];
  if (next?.type === 'list') {
    fields = fieldsFromList(next, st, env, flow);
    extra = 1;
  } else {
    const paragraphs: Paragraph[] = [];
    for (const node of following) {
      if (node.type !== 'paragraph' || !STARTS_WITH_FIELD.test(toString(node))) break;
      paragraphs.push(node);
    }
    if (paragraphs.length > 0) {
      fields = fieldsFromParagraphs(paragraphs, st, env);
      extra = paragraphs.length;
    }
  }
  const present = new Set(fields.map((field) => field.name));
  const missing = EXPERIMENT_FIELDS.filter((field) => !present.has(field));
  if (missing.length > 0) {
    st.report('experiment-missing-field', `Experiment ${title.number} lacks ${missing.join(', ')}`, line);
  }
  return {
    value: {
      kind: 'experiment',
      anchor: st.anchors.claim(objectAnchor('exp', title.number)),
      depth: depthOf('experiment', env),
      number: title.number,
      name: title.name,
      fields,
    },
    extra,
  };
}
