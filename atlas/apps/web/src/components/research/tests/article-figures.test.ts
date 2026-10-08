/** Selection must preserve actual source objects and leave canonical DOM identities intact. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FigureSpecSchema, type CompiledFigure, type FigureId } from '@atlas/core';
import { articleOverviewCopy, articleOverviewFigures } from '../lib/article-figures.ts';
import { CALCULATOR } from './fixtures.ts';

function chart(n: number): CompiledFigure {
  const id: FigureId = `fig-5.${n}`;
  return {
    ...CALCULATOR,
    id,
    number: `5.${n}`,
    anchor: `fig-5-${n}`,
    spec: FigureSpecSchema.parse({
      ...CALCULATOR.spec,
      id,
      kind: 'chart',
      spec: {
        type: 'line',
        x: { label: 'Input' },
        y: { label: 'Output' },
        series: [
          {
            id: 'identity',
            label: 'Identity',
            points: [
              [0, 0],
              [1, 1],
            ],
          },
        ],
      },
    }),
  };
}

function diagram(n: number, width = 524, height = 1087): CompiledFigure {
  const source = chart(n);
  return {
    ...source,
    scene: { width, height, nodes: [], edges: [], groups: [] },
    spec: FigureSpecSchema.parse({
      ...source.spec,
      kind: 'diagram',
      spec: {
        direction: 'LR',
        nodes: [
          { id: 'input', label: 'Input' },
          { id: 'output', label: 'Output' },
        ],
        edges: [{ from: 'input', to: 'output' }],
      },
    }),
  };
}

describe('article visual overview', () => {
  it('prefers authored charts and preserves manuscript order for equal priorities', () => {
    const first = chart(10);
    const second = chart(11);
    const later = chart(12);
    const figures = Object.freeze([CALCULATOR, diagram(9), first, second, later]);
    assert.deepEqual(articleOverviewFigures(figures), [first, second]);
    assert.equal(figures.length, 5);
  });

  it('retains an authored scientific diagram ahead of calculator and table surfaces', () => {
    const visual = diagram(10);
    assert.deepEqual(articleOverviewFigures([CALCULATOR, visual]), [visual, CALCULATOR]);
    const plot = chart(11);
    assert.deepEqual(articleOverviewFigures([CALCULATOR, visual, plot]), [plot, visual]);
  });

  it('prefers readable instruments to oversized graphs without discarding the source graph', () => {
    const crowded = diagram(10, 3534, 258);
    const compact = diagram(11, 524, 1087);
    assert.deepEqual(articleOverviewFigures([crowded, CALCULATOR, compact]), [compact, CALCULATOR]);
    assert.deepEqual(articleOverviewFigures([crowded, CALCULATOR]), [CALCULATOR, crowded]);
    const tall = diagram(12, 524, 1600);
    assert.deepEqual(articleOverviewFigures([tall, crowded, CALCULATOR]), [CALCULATOR, tall]);
  });

  it('shows available authored objects and excludes generated figures', () => {
    const generated: CompiledFigure = { ...chart(10), origin: 'mermaid' };
    assert.deepEqual(articleOverviewFigures([generated, CALCULATOR]), [CALCULATOR]);
    assert.deepEqual(articleOverviewFigures([generated]), []);
    assert.deepEqual(articleOverviewFigures([]), []);
  });

  it('namespaces preview IDs without changing source specifications or canonical anchors', () => {
    const copy = articleOverviewCopy(CALCULATOR);
    assert.equal(copy.anchor, 'fig-5-4--overview');
    assert.equal(copy.id, 'fig-auto-overview-fig-5-4');
    assert.equal(copy.placement, 'inline');
    assert.equal(copy.spec, CALCULATOR.spec);
    assert.equal(copy.sources, CALCULATOR.sources);
    assert.equal(copy.text, CALCULATOR.text);
    assert.equal(CALCULATOR.anchor, 'fig-5-4');
    assert.equal(CALCULATOR.placement, 'rail');
    assert.notEqual(copy.anchor, `${CALCULATOR.anchor}--inline`);
    assert.notEqual(copy.anchor, `${CALCULATOR.anchor}--rail`);
  });
});
