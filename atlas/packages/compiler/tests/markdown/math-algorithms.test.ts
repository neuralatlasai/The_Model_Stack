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

it('indexes quoted mathematical titles and preserves the quote, equations and explanatory prose', async () => {
  const source = `## Algorithm

> **Algorithm 54.1 — Bounded delegation.** [DERIVED] Inputs are finite. Output is a receipt.
>
> The contract remains part of the quoted procedure.

$$
\\begin{aligned}
1.\\;& x\\gets 1.\\\\
2.\\;& \\operatorname{return}(x).
\\end{aligned}
$$

*(Eq. 54.1)*

[DERIVED] The invariant explains when the result is valid.`;
  assert.deepEqual(indexNumberedObjects(source).algorithms, ['54.1']);
  const body = await compile(source);
  const blocks = allBlocks(body);
  assert.ok(blocks.some((block) => block.kind === 'quote'));
  assert.equal(blocks.filter((block) => block.anchor === 'alg-54-1').length, 1);
  assert.equal(blocks.filter((block) => block.kind === 'equation').length, 1);
  assert.ok(blocks.some((block) => block.kind === 'paragraph' && block.anchor === null));
  assert.equal(body.stats.algorithms, 1);
  assert.equal(body.stats.equations, 1);
  assert.deepEqual(
    body.outline.flatMap((entry) => entry.markers).filter((marker) => marker.type === 'algorithm'),
    [{ type: 'algorithm', anchor: 'alg-54-1', label: 'Alg. 54.1' }],
  );
});

it('does not promote plain procedure prose even beside display math', async () => {
  const lead = '[DERIVED] Algorithm 47.4 performs localization. Inputs are finite hypotheses. Output is a ledger.';
  const math = '$$\n1.\\; h\\gets h+1\n$$';
  for (const negative of [
    `## Algorithm\n\n${lead}\n\n${math}`,
    `## Mechanism\n\n${lead}\n\n${math}`,
    `## Algorithm\n\n${lead}`,
    `## Algorithm\n\n[DERIVED] Algorithm 47.4 is discussed elsewhere.\n\n${math}`,
    `## Algorithm\n\n[DERIVED] Algorithm 47.4's inputs are discussed elsewhere. Output is unchanged.\n\n${math}`,
  ]) {
    assert.deepEqual(indexNumberedObjects(negative).algorithms, []);
    assert.equal((await compile(negative)).stats.algorithms, 0);
  }
});

it('does not create a second object for a procedure lead below its explicit heading', async () => {
  const source = `## Algorithm

### Algorithm 53.1 — Typed inventory

[DERIVED] Algorithm 53.1 constructs an inventory. Inputs are records. Output is an inventory.

$$
1.\\; A\\gets\\varnothing
$$`;
  assert.deepEqual(indexNumberedObjects(source).algorithms, ['53.1']);
  const body = await compile(source);
  assert.equal(body.stats.algorithms, 1);
  assert.deepEqual(
    allBlocks(body)
      .filter((block) => block.anchor?.startsWith('alg-'))
      .map((block) => block.anchor),
    ['alg-53-1'],
  );
});

it('ignores quoted fenced and indented examples while recognizing nested quoted titles', async () => {
  const source = [
    '> ```markdown',
    '> ### Algorithm 54.1 — Literal example',
    '> ```',
    '',
    '>     ### Algorithm 54.2 — Indented code example',
    '',
    '> > [DERIVED] **Algorithm 54.3 — Nested quoted definition.** Inputs are finite.',
  ].join('\n');
  assert.deepEqual(indexNumberedObjects(source).algorithms, ['54.3']);
  const body = await compile(source);
  assert.equal(body.stats.algorithms, 1);
  assert.equal(allBlocks(body).filter((block) => block.anchor === 'alg-54-3').length, 1);
});
