import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { CycleSpec, FigureSpec, GraphNode, NodeId, Scene, SceneNode } from '@atlas/core';
import { layoutCycle, layoutDiagram, layoutFigure, layoutNeighbourhood, parseFigure, parseMermaid, placeNodeText } from '../src/index.ts';
import { envelope, grammarKindExamples, mermaidBlocks } from './fixtures.ts';

function figureOf(kind: string, spec: unknown): FigureSpec {
  const parsed = parseFigure(envelope(kind, spec, 1));
  assert.deepEqual(parsed.issues, []);
  assert.ok(parsed.figure !== null);
  return parsed.figure;
}

function overlaps(a: SceneNode, b: SceneNode): boolean {
  const eps = 0.5;
  return a.x < b.x + b.width - eps && b.x < a.x + a.width - eps && a.y < b.y + b.height - eps && b.y < a.y + a.height - eps;
}

function assertWellFormed(scene: Scene): void {
  for (let i = 0; i < scene.nodes.length; i += 1) {
    const a = scene.nodes[i];
    assert.ok(a !== undefined);
    assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.width <= scene.width + 0.5 && a.y + a.height <= scene.height + 0.5, `node ${a.id} outside the scene`);
    for (let j = i + 1; j < scene.nodes.length; j += 1) {
      const b = scene.nodes[j];
      assert.ok(b !== undefined);
      assert.ok(!overlaps(a, b), `nodes ${a.id} and ${b.id} overlap`);
    }
  }
  const byId = new Map(scene.nodes.map((node) => [node.id, node]));
  for (const edge of scene.edges) {
    assert.ok(edge.points.length >= 2, `edge ${edge.id} has ${edge.points.length} points`);
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    assert.ok(from !== undefined && to !== undefined);
    const start = edge.points[0];
    const end = edge.points[edge.points.length - 1];
    assert.ok(start !== undefined && end !== undefined);
    const near = (node: SceneNode, p: { x: number; y: number }): boolean =>
      p.x >= node.x - 1.5 && p.x <= node.x + node.width + 1.5 && p.y >= node.y - 1.5 && p.y <= node.y + node.height + 1.5;
    assert.ok(near(from, start), `edge ${edge.id} does not start on ${edge.from}`);
    assert.ok(near(to, end), `edge ${edge.id} does not end on ${edge.to}`);
  }
  for (const group of scene.groups) {
    for (const node of scene.nodes.filter((entry) => entry.group === group.id)) {
      assert.ok(node.x >= group.x && node.y >= group.y && node.x + node.width <= group.x + group.width + 0.5 && node.y + node.height <= group.y + group.height + 0.5, `${node.id} outside group ${group.id}`);
    }
  }
  // Every node's text fits its box (the renderer re-wraps with the same metrics).
  for (const node of scene.nodes) {
    for (const line of placeNodeText(node.kind, node.label, node.sub, node)) {
      assert.ok(line.y > node.y && line.y < node.y + node.height + 0.5, `text of ${node.id} escapes its box`);
    }
  }
}

describe('layoutFigure — diagram (ELK layered)', () => {
  const diagram = grammarKindExamples().find((example) => example.kind === 'diagram');
  assert.ok(diagram !== undefined);
  const figure = figureOf('diagram', diagram.spec);

  it('is deterministic: identical input → identical Scene JSON', async () => {
    const first = await layoutFigure(figure);
    const second = await layoutFigure(figure);
    assert.ok(first !== null);
    assert.equal(JSON.stringify(first), JSON.stringify(second));
  });

  it('lays out the grammar example without overlaps, with groups enclosing members and labelled edges', async () => {
    const scene = await layoutFigure(figure);
    assert.ok(scene !== null);
    assertWellFormed(scene);
    assert.equal(scene.groups.length, 1);
    assert.deepEqual(
      scene.edges.map((edge) => [edge.kind, edge.label, edge.labelAt !== null]),
      [
        ['flow', null, false],
        ['emphasis', 'QKᵀ/√Dh', true],
        ['dependency', 'B·H·T²·b bytes', true],
      ],
    );
    // LR: flow runs left to right.
    const x = scene.nodes.find((node) => node.id === 'x');
    const qkv = scene.nodes.find((node) => node.id === 'qkv');
    assert.ok(x !== undefined && qkv !== undefined && x.x < qkv.x);
  });

  it('returns null for kinds that are not laid out', async () => {
    const matrix = figureOf('matrix', { rows: 4, cols: 4, pattern: 'causal', rowLabel: 'i', colLabel: 'j' });
    assert.equal(await layoutFigure(matrix), null);
  });

  for (const block of mermaidBlocks()) {
    it(`lays out the concept map in ${block.file} deterministically and without overlaps`, async () => {
      const { spec } = parseMermaid(block.body);
      assert.ok(spec !== null);
      const scene = await layoutDiagram(spec);
      assertWellFormed(scene);
      assert.equal(scene.nodes.length, spec.nodes.length);
      assert.equal(scene.edges.length, spec.edges.length);
      assert.equal(JSON.stringify(await layoutDiagram(spec)), JSON.stringify(scene));
      // TB: upstream (back) edges are reported as feedback.
      const byId = new Map(scene.nodes.map((node) => [node.id, node]));
      for (const edge of scene.edges) {
        const from = byId.get(edge.from);
        const to = byId.get(edge.to);
        if (from === undefined || to === undefined) continue;
        if (edge.kind === 'feedback') assert.ok(to.y + to.height / 2 < from.y + from.height / 2 || spec.edges.some((e) => e.kind === 'feedback' && e.from === edge.from && e.to === edge.to));
      }
    });
  }
});

describe('layoutCycle — column with feedback lanes (UI_UX §27)', () => {
  const cycleExample = grammarKindExamples().find((example) => example.kind === 'cycle');
  assert.ok(cycleExample !== undefined);
  const figure = figureOf('cycle', cycleExample.spec);
  const spec = (figure as Extract<FigureSpec, { kind: 'cycle' }>).spec;

  it('stacks stages in authored order in one column and runs forward flow straight down', () => {
    const scene = layoutCycle(spec);
    assertWellFormed(scene);
    const xs = new Set(scene.nodes.map((node) => node.x));
    assert.equal(xs.size, 1);
    const ys = scene.nodes.map((node) => node.y);
    assert.deepEqual(
      ys,
      [...ys].sort((a, b) => a - b),
    );
    for (const edge of scene.edges.filter((entry) => entry.kind === 'flow')) {
      const [start, end] = edge.points;
      assert.equal(edge.points.length, 2);
      assert.ok(start !== undefined && start.x === end?.x && end.y > start.y);
    }
  });

  it('routes feedback on the right in distinct lanes, arrowing back into the upstream stage', () => {
    const scene = layoutCycle(spec);
    const right = Math.max(...scene.nodes.map((node) => node.x + node.width));
    const feedback = scene.edges.filter((edge) => edge.kind === 'feedback');
    assert.equal(feedback.length, 2);
    const laneXs = feedback.map((edge) => edge.points[1]?.x ?? 0);
    for (const edge of feedback) {
      assert.equal(edge.points.length, 4);
      const [start, a, b, end] = edge.points;
      assert.ok(start !== undefined && a !== undefined && b !== undefined && end !== undefined);
      assert.ok(a.x > right && b.x === a.x, 'lane lies right of the column');
      assert.ok(end.y < start.y, 'feedback returns upstream');
      assert.equal(end.x, right);
      assert.ok(edge.labelAt !== null && edge.labelAt.x > a.x);
    }
    assert.notEqual(laneXs[0], laneXs[1]);
    // The shorter loop (eval → pre) takes the inner lane.
    const inner = feedback.find((edge) => edge.from === 'eval');
    const outer = feedback.find((edge) => edge.from === 'dep');
    assert.ok((inner?.points[1]?.x ?? 0) < (outer?.points[1]?.x ?? 0));
  });

  it('treats an upstream flow edge as feedback, routes skips on the left, and is deterministic', () => {
    const custom: CycleSpec = {
      stages: [
        { id: 'a', label: 'A', kind: 'process' },
        { id: 'b', label: 'B', kind: 'process' },
        { id: 'c', label: 'C', kind: 'process' },
        { id: 'd', label: 'D', kind: 'process' },
      ],
      edges: [
        { from: 'a', to: 'b', kind: 'flow' },
        { from: 'b', to: 'c', kind: 'flow' },
        { from: 'c', to: 'd', kind: 'flow' },
        { from: 'a', to: 'd', kind: 'flow', label: 'skip' },
        { from: 'd', to: 'b', kind: 'flow' },
        { from: 'c', to: 'a', kind: 'feedback' },
      ],
    };
    const scene = layoutCycle(custom);
    assertWellFormed(scene);
    const left = Math.min(...scene.nodes.map((node) => node.x));
    const skip = scene.edges.find((edge) => edge.label === 'skip');
    assert.equal(skip?.kind, 'flow');
    assert.ok((skip?.points[1]?.x ?? Infinity) < left);
    assert.equal(scene.edges.find((edge) => edge.from === 'd' && edge.to === 'b')?.kind, 'feedback');
    const overlapping = scene.edges.filter((edge) => edge.kind === 'feedback').map((edge) => edge.points[1]?.x);
    assert.equal(new Set(overlapping).size, overlapping.length, 'overlapping spans need distinct lanes');
    assert.equal(JSON.stringify(layoutCycle(custom)), JSON.stringify(scene));
  });
});

describe('layoutNeighbourhood — constrained semantic graph (UI_UX §13)', () => {
  const node = (id: string, title: string, number: string | null = null): GraphNode => ({
    id: id as NodeId,
    entityType: id.startsWith('ms.chapter') ? 'chapter' : 'section',
    number,
    title,
    shortTitle: title,
    url: `/${id}/`,
    parent: null,
    children: [],
    domain: 'foundations',
    hasManuscript: true,
    state: 'manuscript_draft',
    maturity: null,
    wordCount: 0,
    summary: null,
    plan: null,
  });
  const center = node('ms.section.5.2', 'Causal self-attention', '5.2');
  const input = {
    center,
    prerequisites: [node('ms.section.2.1', 'Tensor algebra', '2.1'), node('ms.section.4.1', 'Autoregressive modeling', '4.1')],
    dependents: Array.from({ length: 11 }, (_, i) => node(`ms.section.14.${i + 1}`, `Attention variant ${i + 1}`, `14.${i + 1}`)),
    siblings: [node('ms.section.5.1', 'End-to-end forward pass', '5.1'), node('ms.section.5.3', 'Feed-forward block', '5.3')],
    alternatives: [node('ms.section.14.2', 'Latent attention', '14.2')],
  };

  it('places prerequisites left, dependents right, siblings above, alternatives below', () => {
    const scene = layoutNeighbourhood(input);
    assertWellFormed(scene);
    const c = scene.nodes.find((entry) => entry.id === center.id);
    assert.ok(c !== undefined && c.emphasis && c.href === '/ms.section.5.2/');
    const role = (prefix: string): SceneNode[] => scene.nodes.filter((entry) => entry.id.startsWith(`${prefix}:`));
    for (const pre of role('prerequisites')) assert.ok(pre.x + pre.width < c.x);
    for (const dep of role('dependents')) assert.ok(dep.x > c.x + c.width);
    for (const sib of role('siblings')) assert.ok(sib.y + sib.height < c.y);
    for (const alt of role('alternatives')) assert.ok(alt.y > c.y + c.height);
    assert.deepEqual(
      scene.groups.map((group) => [group.id, group.label]),
      [
        ['siblings', 'Siblings'],
        ['prerequisites', 'Prerequisites'],
        ['dependents', 'Enables'],
        ['alternatives', 'Alternatives'],
      ],
    );
  });

  it('caps a column at 8 with a "+n more" node and connects every listed node to the centre', () => {
    const scene = layoutNeighbourhood(input);
    const deps = scene.nodes.filter((entry) => entry.id.startsWith('dependents:'));
    assert.equal(deps.length, 8);
    const more = deps.at(-1);
    assert.equal(more?.label, '+4 more');
    assert.equal(more?.href, null);
    assert.equal(scene.edges.filter((edge) => edge.from === center.id).length, 7);
    assert.equal(scene.edges.filter((edge) => edge.to === center.id).length, 2);
    assert.equal(deps[0]?.sub, '§14.1');
  });

  it('is deterministic', () => {
    assert.equal(JSON.stringify(layoutNeighbourhood(input)), JSON.stringify(layoutNeighbourhood(input)));
  });
});
