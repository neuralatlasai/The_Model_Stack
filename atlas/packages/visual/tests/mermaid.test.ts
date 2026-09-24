import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DiagramSpecSchema, NODE_KINDS } from '@atlas/core';
import { parseMermaid } from '../src/index.ts';
import { mermaidBlocks } from './fixtures.ts';

describe('parseMermaid on every concept map in docs/', () => {
  const blocks = mermaidBlocks();

  it('finds the concept maps', () => {
    assert.ok(blocks.length >= 10, `expected ≥ 10 mermaid blocks, found ${blocks.length}`);
  });

  for (const block of blocks) {
    it(`parses ${block.file}`, () => {
      const result = parseMermaid(block.body);
      assert.deepEqual(result.issues, []);
      assert.ok(result.spec !== null);
      const spec = result.spec;
      assert.ok(spec.nodes.length >= 10, `only ${spec.nodes.length} nodes`);
      assert.ok(spec.edges.length >= 1);
      assert.ok(DiagramSpecSchema.safeParse(spec).success);
      for (const node of spec.nodes) assert.ok((NODE_KINDS as readonly string[]).includes(node.kind));

      // Every [Prefix] in the source selects the node's kind.
      const declared = new Map<string, string>();
      for (const match of block.body.matchAll(/\b([A-Za-z0-9_]+)\["\[([A-Za-z]+)\]/gu)) {
        declared.set(match[1] ?? '', (match[2] ?? '').toLowerCase());
      }
      assert.ok(declared.size >= 10);
      for (const [id, kind] of declared) {
        const node = spec.nodes.find((entry) => entry.id === id);
        assert.ok(node !== undefined, `node ${id} missing`);
        assert.equal(node.kind, kind, `node ${id}`);
      }
      // Every edge endpoint is a node.
      const ids = new Set(spec.nodes.map((node) => node.id));
      for (const edge of spec.edges) {
        assert.ok(ids.has(edge.from) && ids.has(edge.to), `${edge.from} → ${edge.to}`);
      }
    });
  }

  it('reads the chapter 5 map precisely (shape sub-labels, dotted labelled edges)', () => {
    const block = blocks.find((entry) => entry.file.includes('ch05-'));
    assert.ok(block !== undefined);
    const { spec } = parseMermaid(block.body);
    assert.ok(spec !== null);
    const ids = spec.nodes.map((node) => node.id);
    assert.deepEqual(ids.slice(0, 4), ['A', 'B', 'C', 'P']);
    const tokenIds = spec.nodes.find((node) => node.id === 'A');
    assert.deepEqual({ kind: tokenIds?.kind, label: tokenIds?.label, sub: tokenIds?.sub }, { kind: 'tensor', label: 'token ids', sub: '[B, T]' });
    const cache = spec.nodes.find((node) => node.id === 'K');
    assert.deepEqual({ kind: cache?.kind, label: cache?.label, sub: cache?.sub }, { kind: 'memory', label: 'KV cache', sub: '[L, B, S, Hkv, Dh]' });
    const reuse = spec.edges.find((edge) => edge.from === 'K' && edge.to === 'Q');
    assert.deepEqual(reuse, { from: 'K', to: 'Q', kind: 'dependency', label: 'decode reuse' });
    const bytes = spec.edges.find((edge) => edge.from === 'S' && edge.to === 'MEM');
    assert.equal(bytes?.label, 'O(T²) bytes');
    assert.equal(spec.direction, 'TB');
  });

  it('maps a [Feedback] edge-label prefix to a feedback edge (chapter 9)', () => {
    const block = blocks.find((entry) => entry.file.includes('ch09-'));
    assert.ok(block !== undefined);
    const { spec } = parseMermaid(block.body);
    const edge = spec?.edges.find((entry) => entry.from === 'PX' && entry.to === 'CAP');
    assert.deepEqual(edge, { from: 'PX', to: 'CAP', kind: 'feedback', label: 'transfer small → large' });
  });

  it('keeps pipe labels on accept/reject edges (chapter 1)', () => {
    const block = blocks.find((entry) => entry.file.endsWith('ch01-foundation-model-lifecycle/README.md'));
    assert.ok(block !== undefined);
    const { spec } = parseMermaid(block.body);
    assert.deepEqual(
      spec?.edges.filter((edge) => edge.from === 'GATE').map((edge) => [edge.to, edge.label]),
      [
        ['DEP', 'accept'],
        ['INT', 'reject'],
      ],
    );
  });
});

describe('parseMermaid syntax subset', () => {
  it('parses chains, & groups, link styles, labels, comments, and subgraphs', () => {
    const source = [
      'flowchart LR',
      '  %% a comment line',
      '  subgraph dev["[Boundary] one accelerator"]',
      '    H["[Memory] HBM"]',
      '    S[("[Dataset] shard")]',
      '  end',
      '  A["[Tensor] x [B, T, D]"] --> B["[Process] QKV"] ==>|QKᵀ| C{"[Branch] route"}',
      '  A & B -.-> H',
      '  C -- "chosen" --> S',
      '  C --- D(["[State] idle"]) %% trailing comment',
      '  D ~~~ A',
      '  classDef hot fill:#f00',
      '  class A hot',
    ].join('\n');
    const { spec, issues } = parseMermaid(source);
    assert.deepEqual(issues, []);
    assert.ok(spec !== null);
    assert.equal(spec.direction, 'LR');
    assert.deepEqual(
      spec.nodes.map((node) => [node.id, node.kind, node.label, node.sub ?? null, node.group ?? null]),
      [
        ['H', 'memory', 'HBM', null, 'dev'],
        ['S', 'dataset', 'shard', null, 'dev'],
        ['A', 'tensor', 'x', '[B, T, D]', null],
        ['B', 'process', 'QKV', null, null],
        ['C', 'branch', 'route', null, null],
        ['D', 'state', 'idle', null, null],
      ],
    );
    assert.deepEqual(
      spec.edges.map((edge) => [edge.from, edge.to, edge.kind, edge.label ?? null]),
      [
        ['A', 'B', 'flow', null],
        ['B', 'C', 'emphasis', 'QKᵀ'],
        ['A', 'H', 'dependency', null],
        ['B', 'H', 'dependency', null],
        ['C', 'S', 'flow', 'chosen'],
        ['C', 'D', 'flow', null],
      ],
    );
    assert.deepEqual(spec.groups, [{ id: 'dev', label: 'one accelerator' }]);
  });

  it('falls back to shape-derived kinds without a prefix and to node', () => {
    const { spec } = parseMermaid('graph TD\n  A{decide} --> B[(store)]\n  B --> C(state)\n  C --> D[plain]\n  D --> E');
    assert.deepEqual(
      spec?.nodes.map((node) => [node.id, node.kind, node.label]),
      [
        ['A', 'branch', 'decide'],
        ['B', 'dataset', 'store'],
        ['C', 'state', 'state'],
        ['D', 'node', 'plain'],
        ['E', 'node', 'E'],
      ],
    );
  });

  it('reports unknown primitives, non-flowcharts, nesting, and unparsable statements with line numbers', () => {
    assert.deepEqual(parseMermaid('flowchart TD\n  A["[Widget] x"] --> B').issues, [{ message: "unknown primitive prefix [Widget] on node 'A' (VISUAL_GRAMMAR §3.1)", line: 2 }]);
    const sequence = parseMermaid('sequenceDiagram\n  A->>B: hi');
    assert.equal(sequence.spec, null);
    assert.equal(sequence.issues[0]?.line, 1);
    const nested = parseMermaid('flowchart TD\nsubgraph a\nsubgraph b\nX --> Y\nend\nend');
    assert.ok(nested.issues.some((issue) => issue.message.includes('must not nest') && issue.line === 3));
    const broken = parseMermaid('flowchart TD\n  A --> B\n  A -> ');
    assert.ok(broken.issues.some((issue) => issue.line === 3));
  });

  it('fits over-long labels into label + sub-label within the schema limits', () => {
    const long = 'Resource ledger: N, D, FLOPs, capacity, traffic, communication, latency, throughput, energy';
    const { spec, issues } = parseMermaid(`flowchart TD\n  A["[Metric] ${long}"] --> B["[Node] b"]`);
    assert.deepEqual(issues, []);
    const node = spec?.nodes[0];
    assert.equal(node?.label, 'Resource ledger');
    assert.ok((node?.sub?.length ?? 0) <= 60);
  });

  it('rejects diagrams the schema forbids (fewer than two nodes)', () => {
    const { spec, issues } = parseMermaid('flowchart TD\n  A["[Node] alone"]');
    assert.equal(spec, null);
    assert.ok(issues.length > 0);
  });
});
