import assert from 'node:assert/strict';
import { it } from 'node:test';
import { inlineToText, type EquationBlock, type ParagraphBlock } from '@atlas/core';
import { groupMathProcedures } from '../lib/math-procedures.ts';

const equation: EquationBlock = {
  kind: 'equation',
  anchor: 'eq-19-11',
  depth: 'implementation',
  number: '19.11',
  tex: 'x_{k+1}=x_k+1',
  html: '<span>math</span>',
  variables: [],
  note: null,
};
const definition: ParagraphBlock = {
  kind: 'paragraph',
  anchor: 'alg-19-3',
  depth: 'implementation',
  content: [
    { kind: 'strong', children: [{ kind: 'text', value: 'Algorithm 19.3 — Accepted update.' }] },
    { kind: 'text', value: ' The input state is fixed.' },
  ],
};

it('keeps the title, input context and unchanged recurrence in one mathematical procedure', () => {
  const flow = groupMathProcedures([definition, equation]);
  assert.equal(flow.length, 1);
  const plate = flow[0];
  assert.ok(plate?.kind === 'math-procedure');
  assert.equal(plate.anchor, 'alg-19-3');
  assert.equal(inlineToText(plate.title), 'Algorithm 19.3 — Accepted update.');
  assert.equal(inlineToText(plate.introduction), ' The input state is fixed.');
  assert.equal(plate.equation, equation);
});

it('keeps intervening contexts and does not mistake a prose reference for a definition', () => {
  const context: ParagraphBlock = {
    ...definition,
    anchor: null,
    content: [{ kind: 'text', value: 'A finite gradient is required.' }],
  };
  const flow = groupMathProcedures([definition, context, equation]);
  const plate = flow[0];
  assert.ok(plate?.kind === 'math-procedure');
  assert.deepEqual(plate.context, [context]);
  const mention: ParagraphBlock = {
    ...definition,
    anchor: null,
    content: [{ kind: 'text', value: 'See ' }, ...definition.content],
  };
  assert.deepEqual(groupMathProcedures([mention, equation]), [mention, equation]);
});

it('does not attach an equation across an intervening figure or heading', () => {
  const heading = {
    kind: 'heading' as const,
    anchor: 'next',
    depth: 'implementation' as const,
    level: 3 as const,
    content: [{ kind: 'text' as const, value: 'Next mechanism' }],
  };
  assert.deepEqual(groupMathProcedures([definition, heading, equation]), [definition, heading, equation]);
});
