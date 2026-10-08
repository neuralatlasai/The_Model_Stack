import assert from 'node:assert/strict';
import { it } from 'node:test';
import { indexNumberedObjects } from '../../src/markdown/number-index.ts';
import { allBlocks, compile } from './helpers.ts';

const definitions = [
  '### Algorithm 20.1 — Accepted update',
  '**Algorithm 21.1 — Compute allocation.** [DERIVED]',
  '[DERIVED] **Algorithm 22.4 — Mixture update.** Inputs are fixed.',
];

it('indexes and anchors mathematical algorithm definitions without changing their equations', async () => {
  const source = `## Algorithm\n\n${definitions.join('\n\n$$\nx_{k+1}=x_k+1\n$$\n\n')}\n\n$$\ny=2\n$$`;
  assert.deepEqual(indexNumberedObjects(source).algorithms, ['20.1', '21.1', '22.4']);
  const body = await compile(source);
  assert.deepEqual(
    allBlocks(body)
      .filter((block) => block.anchor?.startsWith('alg-'))
      .map((block) => block.anchor),
    ['alg-20-1', 'alg-21-1', 'alg-22-4'],
  );
  assert.equal(body.stats.algorithms, 3);
  assert.equal(body.stats.equations, 3);
});

it('does not promote prose mentions or fenced Markdown examples into mathematical definitions', async () => {
  const source =
    '## Methodology\n\nAlgorithm 20.1 is discussed elsewhere.\n\nSee **Algorithm 21.1 — Example.**\n\n```markdown\n### Algorithm 22.4 — Example\n```';
  assert.deepEqual(indexNumberedObjects(source).algorithms, []);
  const body = await compile(source);
  assert.equal(body.stats.algorithms, 0);
  assert.equal(
    allBlocks(body).some((block) => block.anchor?.startsWith('alg-')),
    false,
  );
});
