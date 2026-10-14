import assert from 'node:assert/strict';
import { it } from 'node:test';
import type { Inline } from '@atlas/core';
import { indexNumberedObjects } from '../../src/markdown/number-index.ts';
import { walkAllInline } from '../../src/markdown/walk.ts';
import { buildNodeTable } from '../../src/project/nodes.ts';
import { buildXRefIndex } from '../../src/project/xref.ts';
import { buildEquationIndex, buildObjectIndex } from '../../src/registry/indexes.ts';
import { allBlocks, compile, fakeContext } from '../markdown/helpers.ts';
import { must, realManifest, source } from './fixtures.ts';

it('resolves mathematical algorithms through both passes, the object registry and outline without rewriting math', async () => {
  const manuscript = `## Algorithm

See Algorithm 5.1, Algorithm 5.2 and Algorithm 5.3.

### Algorithm 5.1 — Heading procedure

[DERIVED] Inputs and invariants remain scientific prose.

$$
x_{k+1}=x_k+1
$$

*(Eq. 5.4)*

[DERIVED] **Algorithm 5.2 — Paragraph procedure.** Inputs are bounded; output is a receipt.

$$
y=2
$$

*(Eq. 5.5)*

> **Algorithm 5.3 — Quoted procedure.** [DERIVED] Preserve this contract.
>
> Preserve the following explanation, too.

$$
z=3
$$

*(Eq. 5.6)*
`;
  const doc = source(
    'ms.section.5.2',
    'vol-01-learning-and-representation/part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-2-attention-calculation.md',
    {},
    manuscript,
  );
  const table = buildNodeTable(await realManifest(), [doc]);
  const url = must(table.nodes.get(doc.meta.id)).url;
  const xrefs = buildXRefIndex([
    { nodeId: doc.meta.id, url, sourcePath: doc.path, index: indexNumberedObjects(manuscript) },
  ]);
  const body = await compile(manuscript, {
    meta: doc.meta,
    ctx: { ...fakeContext(), resolveXRef: xrefs.resolve },
  });
  const refs: Extract<Inline, { kind: 'xref' }>[] = [];
  walkAllInline([...body.lead, ...body.regions.flatMap((region) => region.blocks)], (node) => {
    if (node.kind === 'xref' && node.ref === 'algorithm') refs.push(node);
  });
  assert.ok(refs.length >= 3);
  assert.ok(refs.every((ref) => ref.target?.href === `${url}#alg-5-${ref.number.split('.')[1] ?? ''}`));
  assert.ok(!body.diagnostics.some((item) => item.code === 'xref-unresolved'));

  const compiled = [{ source: doc, body }];
  const algorithms = buildObjectIndex(compiled, table).filter((entry) => entry.kind === 'algorithm');
  assert.deepEqual(
    algorithms.map((entry) => entry.anchor),
    ['alg-5-1', 'alg-5-2', 'alg-5-3'],
  );
  assert.ok(algorithms.every((entry) => entry.nodeId === doc.meta.id && entry.url === `${url}#${entry.anchor}`));
  assert.deepEqual(
    body.outline
      .flatMap((entry) => entry.markers)
      .filter((marker) => marker.type === 'algorithm')
      .map((marker) => marker.anchor),
    ['alg-5-1', 'alg-5-2', 'alg-5-3'],
  );
  assert.equal(body.stats.algorithms, 3);
  assert.equal(body.stats.equations, 3);
  assert.deepEqual(
    buildEquationIndex(compiled, table).map((entry) => entry.tex),
    ['x_{k+1}=x_k+1', 'y=2', 'z=3'],
  );
  assert.equal(allBlocks(body).filter((block) => block.kind === 'algorithm').length, 0);
  assert.equal(allBlocks(body).filter((block) => block.kind === 'quote').length, 1);
});
