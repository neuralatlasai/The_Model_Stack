/** Derived equation display must use real registry targets and preserve unknown evidence. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EquationIndexEntry } from '@atlas/core';
import { equationTargets, equationTextParts, spacedSectionReferences } from '../lib/inline-equations.ts';
import { inlineViews } from '../lib/inline.ts';
import { text } from './fixtures.ts';

function equation(number: string, url: string): EquationIndexEntry {
  return {
    number,
    url,
    nodeId: 'ms.section.2.3',
    anchor: 'authored-anchor',
    tex: 'x',
    html: '<span>x</span>',
    variables: [],
  };
}

describe('inline derivation references', () => {
  it('uses exact registry destinations and caches each immutable registry revision', () => {
    const registry = { equations: [equation('2.10', '/information/#authored-anchor')] };
    const targets = equationTargets(registry);
    assert.equal(targets.get('2.10'), '/information/#authored-anchor');
    assert.equal(equationTargets(registry), targets);
    assert.notEqual(equationTargets({ equations: registry.equations }), targets);
  });

  it('preserves punctuation and unknown derivations without inventing equation anchors', () => {
    const targets = new Map([['2.10', '/information/#authored-anchor']]);
    assert.deepEqual(equationTextParts('[DERIVED:eq-2.10; DERIVED:eq-99.9].', targets), [
      { kind: 'text', value: '[' },
      { kind: 'equation', number: '2.10', href: '/information/#authored-anchor', source: 'DERIVED:eq-2.10' },
      { kind: 'text', value: '; DERIVED:eq-99.9].' },
    ]);
    assert.deepEqual(equationTextParts('NOT-DERIVED:eq-2.10; DERIVED:eq-2.10.1', targets), [
      { kind: 'text', value: 'NOT-DERIVED:eq-2.10; DERIVED:eq-2.10.1' },
    ]);
  });

  it('rejects unsafe destinations and applies the deployment base to known internal links', () => {
    assert.equal(equationTargets({ equations: [equation('2.10', 'javascript:alert(1)')] }).size, 0);
    const targets = new Map([['2.10', '/information/#authored-anchor']]);
    assert.deepEqual(inlineViews([text('DERIVED:eq-2.10')], '/book/', targets), [
      {
        kind: 'derived-equation',
        href: '/book/information/#authored-anchor',
        text: 'Eq. 2.10',
        source: 'DERIVED:eq-2.10',
      },
    ]);
    assert.deepEqual(inlineViews([{ kind: 'code', value: 'DERIVED:eq-2.10' }], '/', targets), [
      { kind: 'code', value: 'DERIVED:eq-2.10' },
    ]);
  });
});

describe('explicit section-reference spacing', () => {
  it('adds a narrow nonbreaking prefix space and comma spaces without changing numbers', () => {
    assert.equal(
      spacedSectionReferences('Precision (§§02.1,02.4); source §3.2.'),
      'Precision (§§\u202f02.1, 02.4); source §\u202f3.2.',
    );
    assert.equal(spacedSectionReferences('§§ 02.1–02.4,02.6'), '§§\u202f02.1–02.4, 02.6');
  });

  it('does not normalize unrelated prose punctuation, code, or math nodes', () => {
    assert.equal(
      spacedSectionReferences('Tuples (1,2), f(0,1), and decimal 0.2.'),
      'Tuples (1,2), f(0,1), and decimal 0.2.',
    );
    assert.deepEqual(
      inlineViews(
        [
          { kind: 'code', value: '§§02.1,02.4' },
          { kind: 'math', tex: 'x', html: '§3.2' },
        ],
        '/',
      ),
      [
        { kind: 'code', value: '§§02.1,02.4' },
        { kind: 'math', html: '§3.2' },
      ],
    );
  });
});
