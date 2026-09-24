import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildXRefIndex, normaliseObjectNumber } from '../../src/project/xref.ts';

const empty = { equations: [], algorithms: [], figures: [], experiments: [], propositions: [] };

describe('cross-reference index', () => {
  it('resolves numbered objects to node, anchor and href; first definition wins', () => {
    const index = buildXRefIndex([
      { nodeId: 'ms.section.5.2', url: '/ch05/05-2/', sourcePath: 'a.md', index: { ...empty, equations: ['5.4', '5.5'], figures: ['fig-5.3'], algorithms: ['5.2'] } },
      { nodeId: 'ms.section.5.3', url: '/ch05/05-3/', sourcePath: 'b.md', index: { ...empty, equations: ['5.4'], figures: ['5.3'], experiments: ['5.1'] } },
      { nodeId: 'ms.verification.5', url: '/ch05/verification/', sourcePath: 'v.md', index: { ...empty, experiments: ['5.1'] } },
    ]);
    assert.deepEqual(index.resolve('equation', '5.4'), { nodeId: 'ms.section.5.2', anchor: 'eq-5-4', href: '/ch05/05-2/#eq-5-4' });
    assert.deepEqual(index.resolve('figure', '5.3'), { nodeId: 'ms.section.5.2', anchor: 'fig-5-3', href: '/ch05/05-2/#fig-5-3' });
    assert.equal(index.resolve('algorithm', '5.2')?.anchor, 'alg-5-2');
    assert.equal(index.resolve('experiment', '5.1')?.nodeId, 'ms.section.5.3');
    assert.equal(index.resolve('proposition', '5.1'), null);
    assert.equal(index.resolve('equation', '9.9'), null);
    const codes = index.diagnostics.map((item) => item.code).sort();
    assert.deepEqual(codes, ['equation-duplicate-number', 'figure-duplicate-id']);
    assert.equal(index.diagnostics.find((item) => item.code === 'figure-duplicate-id')?.severity, 'error');
  });

  it('normalises written numbers', () => {
    assert.equal(normaliseObjectNumber('fig-5.3'), '5.3');
    assert.equal(normaliseObjectNumber(' 14.10 '), '14.10');
    assert.equal(normaliseObjectNumber('Figure 5.3'), '5.3');
  });
});
