import { inlineToText, objectAnchor, type Block, type EquationBlock, type Inline } from '@atlas/core';

export interface MathProcedure {
  readonly kind: 'math-procedure';
  readonly anchor: string;
  readonly number: string;
  readonly title: readonly Inline[];
  readonly introduction: readonly Inline[];
  readonly context: readonly Block[];
  readonly equation: EquationBlock;
}

export type ResearchFlowItem = Block | MathProcedure;

/** Group explicit definitions and their first recurrence, preserving all prose
 * and mathematics. A mention, intervening figure, or another heading stops it. */
export function groupMathProcedures(blocks: readonly Block[]): ResearchFlowItem[] {
  const result: ResearchFlowItem[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (block === undefined) continue;
    if (block.kind !== 'paragraph' && block.kind !== 'heading') {
      result.push(block);
      continue;
    }
    const strongIndex = block.content.findIndex((inline) => inline.kind === 'strong');
    const strong = block.content[strongIndex];
    const prefix = block.content.slice(0, strongIndex);
    const explicit =
      block.kind === 'heading' ||
      (strong?.kind === 'strong' &&
        prefix.every(
          (inline) => inline.kind === 'label' || (inline.kind === 'text' && /^[\s[\]]*$/u.test(inline.value)),
        ));
    const title = block.kind === 'heading' ? block.content : strong?.kind === 'strong' ? strong.children : [];
    const match = explicit ? /^Algorithm\s+((?:\d+|[A-Z])\.\d+[a-z]?)\s+[—–-]\s+/u.exec(inlineToText(title)) : null;
    if (match === null) {
      result.push(block);
      continue;
    }
    let end = i + 1;
    while (blocks[end]?.kind === 'paragraph' && !blocks[end]?.anchor?.startsWith('alg-')) end += 1;
    const equation = blocks[end];
    if (equation?.kind !== 'equation') {
      result.push(block);
      continue;
    }
    const number = match[1] ?? '';
    result.push({
      kind: 'math-procedure',
      anchor: block.anchor ?? objectAnchor('alg', number),
      number,
      title,
      introduction: block.kind === 'heading' ? [] : [...prefix, ...block.content.slice(strongIndex + 1)],
      context: blocks.slice(i + 1, end),
      equation,
    });
    i = end;
  }
  return result;
}
