import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { brainLayout, hemispherePoint, insideBrain, simplex3 } from '../../src/lib/brain3d.ts';
import { arcPoint, globeNodes } from '../../src/lib/globe.ts';
import { landDots } from '../../src/lib/world-dots.ts';

const DOMAINS = ['foundations', 'data', 'architecture', 'training', 'hardware', 'post-training', 'inference', 'serving', 'agents', 'embodied', 'evaluation'];
const chapters = Array.from({ length: 66 }, (_, i) => ({
  n: i + 1,
  title: `Chapter ${String(i + 1)}`,
  url: `/ch${String(i + 1)}/`,
  part: Math.floor(i / 6) + 1,
  domain: DOMAINS[Math.floor(i / 6)] ?? 'foundations',
  written: i < 14,
}));

describe('3D brain', () => {
  test('every neuron and concept lies inside the cerebrum', () => {
    const brain = brainLayout({
      parts: DOMAINS.map((domain, i) => ({ n: i + 1, title: domain, domain })),
      chapters,
      terms: Array.from({ length: 222 }, (_, i) => ({ term: `t${String(i)}`, chapter: (i % 14) + 1 })),
      prereqs: Array.from({ length: 65 }, (_, i) => [i + 1, i + 2] as const),
    });
    assert.equal(brain.neurons.length, 66);
    assert.equal(brain.concepts.length, 222);
    for (const point of [...brain.neurons, ...brain.concepts]) assert.ok(insideBrain(point.p[0], point.p[1], point.p[2], 0.9), JSON.stringify(point.p));
    assert.equal(brain.fibres.length, 65);
  });

  test('the cortex is folded (surface radius varies) and each hemisphere keeps to its side', () => {
    const noise = simplex3(3);
    const radii: number[] = [];
    for (let i = 0; i < 400; i += 1) {
      const y = 1 - (2 * (i + 0.5)) / 400;
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.39996;
      const [px, py, pz] = hemispherePoint(noise, Math.cos(a) * r, y, Math.sin(a) * r, 1);
      assert.ok(pz > 0, 'left hemisphere stays at z > 0');
      radii.push(Math.hypot(px, py));
    }
    assert.ok(Math.max(...radii) - Math.min(...radii) > 0.3);
  });
});

describe('globe', () => {
  test('chapters sit on the unit sphere in reading order; arcs stay close to it', () => {
    const nodes = globeNodes(chapters);
    assert.deepEqual(
      nodes.map((node) => node.n),
      chapters.map((chapter) => chapter.n),
    );
    for (const node of nodes) assert.ok(Math.abs(Math.hypot(...node.p) - 1) < 1e-9);
    const a = nodes[0]?.p ?? [0, 0, 1];
    const b = nodes[65]?.p ?? [0, 0, 1];
    for (let t = 0; t <= 1; t += 0.125) {
      const r = Math.hypot(...arcPoint(a, b, t));
      assert.ok(r >= 1 - 1e-9 && r <= 1.13, `radius ${String(r)} at t=${String(t)}`);
    }
  });

  test('land covers about 29 % of the Earth', () => {
    const dots = landDots();
    assert.equal(dots.length % 2, 0);
    const fraction = dots.length / 2 / 22000;
    assert.ok(fraction > 0.26 && fraction < 0.32, String(fraction));
  });
});
