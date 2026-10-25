import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { targetFromTrigger } from '../../src/client/citations.ts';

function trigger(attributes: Readonly<Record<string, string>>): Element {
  return { getAttribute: (name: string) => attributes[name] ?? null } as unknown as Element;
}

describe('citation target equation numbers', () => {
  test('accepts an indexed equation with one optional lowercase suffix', () => {
    for (const number of ['5.4', '55.15a', '55.15z']) {
      assert.deepEqual(targetFromTrigger(trigger({ 'data-xref': `equation:${number}` })), {
        type: 'equation',
        number,
      });
    }
  });

  test('rejects malformed, uppercase, multiple-suffix and injected equation targets', () => {
    for (const number of [
      '',
      '55',
      '55x15a',
      '55.15A',
      '55.15aa',
      '55.15a/extra',
      '55.15a#fragment',
      '55.15a\n',
      ' 55.15a',
      '55.15a ',
      '<img src=x>',
    ]) {
      assert.equal(targetFromTrigger(trigger({ 'data-xref': `equation:${number}` })), null, number);
    }
  });

  test('keeps citation and node targets in their own existing namespaces', () => {
    assert.deepEqual(targetFromTrigger(trigger({ 'data-cite': 'R55.8' })), { type: 'paper', key: 'R55.8' });
    assert.deepEqual(targetFromTrigger(trigger({ 'data-node': 'ms.section.55.4' })), {
      type: 'node',
      id: 'ms.section.55.4',
    });
    assert.equal(targetFromTrigger(trigger({ 'data-node': 'ms.section.55.4a' })), null);
    assert.equal(targetFromTrigger(trigger({ 'data-node': 'javascript:alert(1)' })), null);
  });
});
