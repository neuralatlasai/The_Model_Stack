/** Parameter previews retain scoped definitions and their first canonical equation links. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EquationBlock, EquationVariable } from '@atlas/core';
import { articleParameters } from '../lib/article-parameters.ts';
import { documentWith, para } from './fixtures.ts';

function equation(variables: readonly EquationVariable[], anchor = 'eq-5-1'): EquationBlock {
  return {
    kind: 'equation',
    anchor,
    depth: 'technical',
    number: '5.1',
    tex: 'n=1',
    html: '<span>n = 1</span>',
    note: null,
    variables,
  };
}

describe('article key parameters', () => {
  it('deduplicates identical definitions and preserves different scoped meanings', () => {
    const lead = equation([{ symbol: 'n', meaning: 'objects' }]);
    const later = equation(
      [
        { symbol: ' n ', meaning: ' objects ' },
        { symbol: 'n', meaning: 'samples' },
        { symbol: 'z', meaning: 'bytes transferred' },
      ],
      'eq-5-2',
    );
    assert.deepEqual(articleParameters(documentWith([lead], [later])), [
      { symbol: 'n', meaning: 'objects', equationAnchor: 'eq-5-1' },
      { symbol: 'n', meaning: 'samples', equationAnchor: 'eq-5-2' },
      { symbol: 'z', meaning: 'bytes transferred', equationAnchor: 'eq-5-2' },
    ]);
  });

  it('visits nested equations in source order and selects at most six definitions', () => {
    const variables = Array.from({ length: 8 }, (_, n) => ({ symbol: `x_${n}`, meaning: `Authored definition ${n}` }));
    const doc = documentWith([], [{ kind: 'quote', anchor: null, depth: 'technical', blocks: [equation(variables)] }]);
    assert.deepEqual(
      articleParameters(doc),
      variables.slice(0, 6).map((variable) => ({ ...variable, equationAnchor: 'eq-5-1' })),
    );
  });

  it('adds no synthetic notation when equations or definitions are absent', () => {
    assert.deepEqual(articleParameters(documentWith([para('No equation definitions.')], [])), []);
    assert.deepEqual(
      articleParameters(
        documentWith(
          [
            equation([
              { symbol: '', meaning: 'Empty symbol' },
              { symbol: 'x', meaning: ' ' },
            ]),
          ],
          [],
        ),
      ),
      [],
    );
  });
});
