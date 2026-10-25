import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FigureSpecSchema } from '@atlas/core';
import { figureInstanceName, initialFigureAnnotation } from '../src/svg/util.ts';

describe('reader-facing figure instance identity', () => {
  it('distinguishes copies of the same figure without exposing DOM identifiers', () => {
    const title = 'Conditional privacy bound';
    assert.equal(figureInstanceName('fig-58-3', title), 'Figure 58.3: Conditional privacy bound, main figure');
    assert.equal(
      figureInstanceName('fig-58-3--overview', title),
      'Figure 58.3: Conditional privacy bound, visual overview',
    );
    assert.equal(figureInstanceName('fig-58-3--inline', title), 'Figure 58.3: Conditional privacy bound, main figure');
    assert.equal(figureInstanceName('fig-58-3--rail', title), 'Figure 58.3: Conditional privacy bound, context rail');
    assert.equal(
      figureInstanceName('fig-58-3--overview-sweep', title),
      'Figure 58.3: Conditional privacy bound, visual overview',
    );
  });

  it('keeps figure numbers distinct when titles or comparison axes repeat', () => {
    assert.notEqual(figureInstanceName('fig-61-3', 'Comparison'), figureInstanceName('fig-61-6', 'Comparison'));
    assert.equal(figureInstanceName('fig-55-15a'), 'Figure 55.15a, main figure');
    assert.equal(
      figureInstanceName('fig-auto-layer-map--overview', 'Layer map'),
      'Figure auto layer map: Layer map, visual overview',
    );
  });
});

describe('authored-default calculator annotations', () => {
  const figure = FigureSpecSchema.parse({
    id: 'fig-62.3',
    kind: 'calculator',
    title: 'Repeated judgments',
    caption: 'Conditional effective count',
    evidence: 'MATHEMATICALLY-DERIVED',
    source: 'DERIVED:eq-62.3',
    alt: 'Effective count with correlated repeats.',
    states: [{ anchor: 'formulation', label: 'Independent repeats', note: 'No correlation.', variables: { rho: 0 } }],
    spec: {
      tex: 'n',
      inputs: [{ symbol: 'rho', label: 'Correlation', default: 0.5, min: 0, max: 1 }],
      outputs: [{ symbol: 'n', label: 'Count', formula: '1/(1+rho)' }],
    },
  });

  it('does not claim independent repeats for a correlated authored default', () => {
    assert.equal(initialFigureAnnotation(figure), undefined);
    assert.equal(figure.kind === 'calculator' ? figure.spec.inputs[0]?.default : undefined, 0.5);
  });

  it('retains annotations only when all declared bindings hold', () => {
    const first = figure.states[0];
    assert.ok(first);
    assert.deepEqual(initialFigureAnnotation({ ...figure, states: [{ ...first, variables: { rho: 0.5 } }] }), {
      ...first,
      variables: { rho: 0.5 },
    });
    assert.equal(
      initialFigureAnnotation({ ...figure, states: [{ ...first, variables: { missing: 0.5 } }] }),
      undefined,
    );
  });
});
