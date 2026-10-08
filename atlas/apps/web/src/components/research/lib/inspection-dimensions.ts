/**
 * Present only explicitly labelled inspection dimensions as definition rows.
 * Work is linear in inline-tree size; only structural text boundaries are split.
 * All semantic nodes retain their identity, targets and authored order.
 */
import { inlineToText, type Inline } from '@atlas/core';

export interface InspectionDimension {
  readonly term: readonly Inline[];
  readonly content: readonly Inline[];
}

export type InspectionDimensions =
  | { readonly kind: 'paragraph'; readonly content: readonly Inline[] }
  | {
      readonly kind: 'dimensions';
      readonly heading: readonly Inline[];
      readonly rows: readonly InspectionDimension[];
      readonly trailing: readonly Inline[];
    };

interface DimensionStart {
  readonly index: number;
  readonly term: Inline;
  readonly following: Extract<Inline, { readonly kind: 'text' }>;
}

/** No punctuation parsing occurs inside math, code, links or other nested nodes. */
export function inspectionDimensions(nodes: readonly Inline[]): InspectionDimensions {
  const heading = nodes[0];
  if (heading?.kind !== 'strong' || inlineToText(heading.children) !== 'Inspection dimensions applied.') {
    return { kind: 'paragraph', content: nodes };
  }

  const terms: DimensionStart[] = [];
  for (let index = 1; index < nodes.length; index += 1) {
    const node = nodes[index];
    const following = nodes[index + 1];
    if (
      node?.kind === 'emphasis' &&
      following?.kind === 'text' &&
      following.value.startsWith(':') &&
      inlineToText(node.children).trim().length > 0
    ) {
      terms.push({ index, term: node, following });
    }
  }
  const first = terms[0];
  const last = terms[terms.length - 1];
  if (terms.length < 2 || first === undefined || last === undefined) return { kind: 'paragraph', content: nodes };

  const firstTerm = first.index;
  const lastTerm = last.index;
  let trailingStart = nodes.length;
  // The current corpus explicitly follows its rows with "Communication is counted...".
  // Other emphasized sentences remain in their row; no generic prose-boundary inference.
  for (let index = lastTerm + 2; index < nodes.length; index += 1) {
    const node = nodes[index];
    const previous = nodes[index - 1];
    const following = nodes[index + 1];
    if (
      node?.kind === 'emphasis' &&
      inlineToText(node.children) === 'Communication' &&
      following?.kind === 'text' &&
      /^\s+is counted\b/u.test(following.value) &&
      previous?.kind === 'text' &&
      /[.!?]\s+$/u.test(previous.value)
    ) {
      trailingStart = index;
      break;
    }
  }

  const rows = terms.map(({ index: start, term, following }, index): InspectionDimension => {
    const end = terms[index + 1]?.index ?? trailingStart;
    return {
      term: [term, { kind: 'text', value: ':' }],
      content: [{ ...following, value: following.value.slice(1) }, ...nodes.slice(start + 2, end)],
    };
  });

  return {
    kind: 'dimensions',
    heading: nodes.slice(0, firstTerm),
    rows,
    trailing: nodes.slice(trailingStart),
  };
}
