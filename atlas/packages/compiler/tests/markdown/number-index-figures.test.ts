import assert from 'node:assert/strict';
import { it } from 'node:test';
import { indexNumberedObjects } from '../../src/markdown/number-index.ts';

it('indexes YAML, quoted YAML, pretty JSON and minified JSON figure identities equally', () => {
  const bodies = [
    'id: fig-5.3\nkind: diagram',
    '"id": "fig-5.3"\nkind: diagram',
    JSON.stringify({ kind: 'diagram', id: 'fig-5.3', spec: {} }, null, 2),
    JSON.stringify({ kind: 'diagram', id: 'fig-5.3', spec: {} }),
  ];
  for (const body of bodies) {
    assert.deepEqual(indexNumberedObjects('```figure\n' + body + '\n```').figures, ['5.3']);
  }
});

it('reads only the top-level JSON figure ID, not IDs in its scientific data', () => {
  const body = JSON.stringify({
    spec: { nodes: [{ id: 'fig-99.1' }], description: 'id: fig-99.2' },
    id: 'fig-5.3',
  });
  assert.deepEqual(indexNumberedObjects('```figure\n' + body + '\n```').figures, ['5.3']);
});

it('ignores figure examples in other code fences and accepts a figure fence ending at EOF', () => {
  const source = [
    '```json',
    '{"id":"fig-99.1"}',
    '```',
    'Prose mentions fig-99.2.',
    '> ```figure',
    '> {"id":"fig-5.3"}',
  ].join('\n');
  assert.deepEqual(indexNumberedObjects(source).figures, ['5.3']);
});

it('does not register non-string or malformed JSON identities', () => {
  for (const id of [null, 53, 'fig-5.3-extra', 'fig-5.3/../../other']) {
    const source = '```figure\n' + JSON.stringify({ id }) + '\n```';
    assert.deepEqual(indexNumberedObjects(source).figures, []);
  }
});
