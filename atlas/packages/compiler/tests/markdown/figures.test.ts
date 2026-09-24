import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MAX_RAIL_INSTRUMENTS, type Scene } from '@atlas/core';
import { blocksOf, codes, compile, fakeContext, onlyBlock } from './helpers.ts';

/** The calculator of VISUAL_GRAMMAR §4, bound to the Mechanism region. */
const CALCULATOR = `\`\`\`figure
id: fig-5.4
kind: calculator
title: Score-matrix bytes per layer
caption: >-
  The materialised score matrix grows with T² while every other attention
  tensor grows with T; vary T to see where it overtakes the weights.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-5.8
alt: >-
  Calculator for Eq. 5.8, M = B·H·T²·b. With B = 1, H = 32, T = 8192 and
  b = 2 bytes the score matrix occupies 4 GiB per layer per materialised copy.
spec:
  tex: M_{\\text{scores}} = B\\,H\\,T^{2}\\,b
  equation: "5.8"
  inputs:
    - { symbol: B, label: sequences, default: 1, min: 1, max: 64, scale: log2, format: integer }
    - { symbol: H, label: heads, default: 32, min: 1, max: 128, scale: log2, format: integer }
    - { symbol: T, label: sequence length, default: 8192, min: 512, max: 131072, scale: log2, format: tokens }
    - { symbol: b, label: bytes per value, default: 2, min: 1, max: 4, options: [1, 2, 4], format: bytes }
  outputs:
    - { symbol: M, label: scores per layer, formula: B*H*T^2*b, format: bytes, emphasis: true }
\`\`\``;

const DIAGRAM = `\`\`\`figure
id: fig-5.1
kind: diagram
title: Attention data flow on one device
caption: The score tensor is the only object quadratic in T; follow the emphasised edge.
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-5.5
alt: Normalised stream feeds the QKV projection, which produces the score tensor stored in HBM.
spec:
  direction: LR
  nodes:
    - { id: x,   kind: tensor,  label: normalised stream, sub: "[B, T, D]" }
    - { id: qkv, kind: process, label: QKV projection }
    - { id: s,   kind: tensor,  label: scores, sub: "[B, H, T, T]", emphasis: true }
    - { id: hbm, kind: memory,  label: HBM, group: dev }
  edges:
    - { from: x, to: qkv }
    - { from: qkv, to: s, kind: emphasis }
    - { from: s, to: hbm, kind: dependency }
  groups:
    - { id: dev, label: one accelerator }
\`\`\``;

function statPanel(id: string, anchor: string): string {
  return `\`\`\`figure
id: ${id}
kind: stat-panel
title: Reference configuration ${id}
caption: Illustrative configuration, not a named model; read the parameter rows.
placement: rail
anchor: ${anchor}
evidence: DERIVED
source: DERIVED:eq-5.8
alt: Stat panel listing the layer count and width of an illustrative configuration.
spec:
  header: REFERENCE CONFIG · BF16
  variables: { L: 12, D: 768 }
  rows:
    - { key: layers, value: "12" }
    - { key: non-embedding params, formula: 12*L*D^2, format: params }
\`\`\``;
}

const SCENE: Scene = { width: 100, height: 50, nodes: [], edges: [], groups: [] };

describe('authored figures', () => {
  it('validates, numbers, anchors, and binds a rail calculator to its region', async () => {
    const body = await compile(`# 5.2 Attention\n\n## Formulation\n\n${CALCULATOR}\n\n## Mechanism\n\nProse.\n`);
    const block = onlyBlock(body, 'figure');
    const figure = block.figure;
    assert.equal(figure.id, 'fig-5.4');
    assert.equal(figure.number, '5.4');
    assert.equal(figure.anchor, 'fig-5-4');
    assert.equal(block.anchor, 'fig-5-4');
    assert.equal(figure.origin, 'authored');
    assert.equal(figure.placement, 'rail');
    assert.equal(figure.regionAnchor, 'mechanism', 'anchor: overrides the enclosing region');
    assert.equal(figure.evidence, 'MATHEMATICALLY-DERIVED');
    assert.deepEqual(figure.sources, ['DERIVED:eq-5.8']);
    assert.ok(figure.text.startsWith('Calculator for Eq. 5.8'));
    assert.ok(figure.text.length > figure.spec.alt.length, 'generated description is appended');
    assert.equal(figure.scene, null);
    assert.deepEqual(codes(body, 'error'), []);
    assert.deepEqual(body.figures.map((item) => item.id), ['fig-5.4']);
    const mechanism = body.rail.find((binding) => binding.regionAnchor === 'mechanism');
    assert.deepEqual(mechanism?.instruments[0], { kind: 'figure', figureId: 'fig-5.4' });
    const formulation = body.rail.find((binding) => binding.regionAnchor === 'formulation');
    assert.ok(!formulation?.instruments.some((instrument) => instrument.kind === 'figure'));
  });

  it('lays out diagram figures through the context', async () => {
    const ctx = fakeContext({ layout: async () => SCENE });
    const body = await compile(`# 5.2 Attention\n\n## Mechanism\n\n${DIAGRAM}\n`, { ctx });
    assert.equal(ctx.layoutCalls.length, 1);
    assert.deepEqual(onlyBlock(body, 'figure').figure.scene, SCENE);
    assert.deepEqual(body.outline[0]?.markers, [{ type: 'figure', anchor: 'fig-5-1', label: 'Fig. 5.1' }]);
  });

  it('reports a failing layout without dropping the figure', async () => {
    const ctx = fakeContext({
      layout: async () => {
        throw new Error('elk exploded');
      },
    });
    const body = await compile(`# 5.2 Attention\n\n## Mechanism\n\n${DIAGRAM}\n`, { ctx });
    assert.equal(onlyBlock(body, 'figure').figure.scene, null);
    assert.ok(codes(body, 'error').includes('figure-layout-failed'));
  });

  it('reports invalid YAML at its source line and keeps the source as code', async () => {
    const body = await compile('# 5.2 A\n\n## Mechanism\n\n```figure\nid: fig-5.1\ntitle: [unclosed\n```\n', { bodyStartLine: 40 });
    const diagnostic = body.diagnostics.find((item) => item.code === 'figure-yaml-invalid');
    assert.ok(diagnostic !== undefined);
    assert.equal(diagnostic.severity, 'error');
    assert.equal(diagnostic.line, 46, 'the YAML error line is mapped into the file');
    assert.equal(blocksOf(body, 'figure').length, 0);
    assert.equal(onlyBlock(body, 'code').lang, 'figure');
  });

  it('reports schema violations with issue paths', async () => {
    const body = await compile('# 5.2 A\n\n## Mechanism\n\n```figure\nid: fig-5.2\nkind: matrix\ntitle: Causal mask\nevidence: DERIVED\nsource: DERIVED:eq-5.5\nalt: short\nspec:\n  rows: 8\n```\n');
    const diagnostic = body.diagnostics.find((item) => item.code === 'figure-schema-invalid');
    assert.ok(diagnostic !== undefined);
    assert.match(diagnostic.message, /caption/u);
    assert.match(diagnostic.message, /alt/u);
    assert.equal(onlyBlock(body, 'code').anchor, 'fig-5-2', 'the fallback keeps the figure anchor for cross-references');
  });

  it('forbids EMPIRICALLY-OBSERVED figure evidence', async () => {
    const body = await compile(`# 5.2 A\n\n## Mechanism\n\n${DIAGRAM.replace('evidence: MATHEMATICALLY-DERIVED', 'evidence: EMPIRICALLY-OBSERVED')}\n`);
    assert.ok(codes(body, 'error').includes('label-forbidden'));
    assert.equal(blocksOf(body, 'figure').length, 0);
  });

  it('replaces a figure with an unevaluable formula by its source', async () => {
    const body = await compile(`# 5.2 A\n\n## Mechanism\n\n${CALCULATOR.replace('formula: B*H*T^2*b', 'formula: B*H*T^2*q')}\n`);
    assert.ok(codes(body, 'error').includes('figure-formula-invalid'));
    assert.equal(blocksOf(body, 'figure').length, 0);
    assert.equal(onlyBlock(body, 'code').anchor, 'fig-5-4');
  });

  it('diagnoses chapter mismatch, unknown region anchors, and duplicate ids', async () => {
    const mismatched = CALCULATOR.replace('id: fig-5.4', 'id: fig-6.1').replace('anchor: mechanism', 'anchor: nowhere');
    const body = await compile(`# 5.2 A\n\n## Mechanism\n\n${mismatched}\n\n${DIAGRAM}\n\n${DIAGRAM}\n`);
    const errors = codes(body, 'error');
    assert.ok(errors.includes('figure-chapter-mismatch'));
    assert.ok(errors.includes('figure-reference-invalid'));
    assert.ok(errors.includes('figure-duplicate-id'));
    const figures = blocksOf(body, 'figure');
    assert.deepEqual(figures.map((block) => block.figure.id), ['fig-6.1', 'fig-5.1']);
    assert.equal(figures[0]?.figure.regionAnchor, 'mechanism', 'an unknown anchor falls back to the enclosing region');
  });

  it('caps rail instruments per region and reports overflow', async () => {
    const panels = ['fig-5.11', 'fig-5.12', 'fig-5.13', 'fig-5.14'].map((id) => statPanel(id, 'formulation')).join('\n\n');
    const body = await compile(`# 5.2 A\n\n## Formulation\n\n$$\nx\n$$\n*(Eq. 5.4)*\n\n${panels}\n`);
    const binding = body.rail.find((item) => item.regionAnchor === 'formulation');
    assert.equal(binding?.instruments.length, MAX_RAIL_INSTRUMENTS);
    assert.ok(binding?.instruments.every((instrument) => instrument.kind === 'figure'), 'authored rail figures take priority over derived instruments');
    assert.deepEqual(codes(body, 'warning'), ['rail-overflow']);
  });

  it('fills remaining rail slots with derived instruments', async () => {
    const body = await compile(`# 5.2 A\n\n## Formulation\n\n$$\nx\n$$\n*(Eq. 5.4)* where x = input.\n\n> **Definition — thing.** A thing (P01).\n\n${statPanel('fig-5.11', 'formulation')}\n`);
    const binding = body.rail.find((item) => item.regionAnchor === 'formulation');
    assert.deepEqual(binding?.instruments, [
      { kind: 'figure', figureId: 'fig-5.11' },
      { kind: 'equations', anchors: ['eq-5-4'] },
      { kind: 'terms', slugs: ['thing'] },
    ]);
  });
});

describe('Mermaid concept maps', () => {
  const conceptMap = [
    '# 05 — A minimal Transformer',
    '',
    '## Concept map',
    '',
    '```mermaid',
    'flowchart TD',
    '    A["[Tensor] token ids [B, T]"] --> B["[Process] embedding gather"]',
    '    B --> C["[Tensor] residual stream [B, T, D]"]',
    '    K["[Memory] KV cache"] -. "decode reuse" .-> C',
    '```',
    '',
    '- [Tensor] token ids `[B, T]`',
    '  - [Process] embedding gather → [Tensor] residual stream `[B, T, D]`',
    '- [Memory] KV cache feeds decode',
  ].join('\n');

  it('builds a derived diagram figure whose text equivalent is the following list', async () => {
    const ctx = fakeContext({ layout: async () => SCENE });
    const body = await compile(conceptMap, { ctx, meta: { id: 'ms.chapter.5', entityType: 'chapter', section: null } });
    const figure = onlyBlock(body, 'figure').figure;
    assert.equal(figure.id, 'fig-auto-5-concept-map-1');
    assert.equal(figure.anchor, 'fig-auto-5-concept-map-1');
    assert.equal(figure.origin, 'mermaid');
    assert.equal(figure.number, null);
    assert.equal(figure.evidence, 'KNOWN');
    assert.deepEqual(figure.sources, ['concept map']);
    assert.equal(figure.regionAnchor, 'concept-map');
    assert.equal(figure.spec.kind, 'diagram');
    // Titled after the document, so every page's concept map is named for what it maps.
    assert.match(figure.spec.title, /: concepts and dependencies$/u);
    assert.ok(figure.text.startsWith('- [Tensor] token ids [B, T]\n  - [Process] embedding gather'));
    assert.deepEqual(figure.scene, SCENE);
    assert.deepEqual(
      body.regions[0]?.blocks.map((block) => block.kind),
      ['figure', 'list'],
      'the text-equivalent list is kept as an ordinary list',
    );
    assert.deepEqual(codes(body), []);
  });

  it('accepts a short lead-in paragraph before the text list and warns when the list is missing', async () => {
    const withLead = conceptMap.replace('```\n\n- [Tensor]', '```\n\nText equivalent:\n\n- [Tensor]');
    const lead = await compile(withLead, { meta: { id: 'ms.chapter.5', entityType: 'chapter', section: null } });
    assert.ok(onlyBlock(lead, 'figure').figure.text.startsWith('- [Tensor]'));
    const missing = await compile(conceptMap.split('\n- [Tensor]')[0] ?? '', { meta: { id: 'ms.chapter.5', entityType: 'chapter', section: null } });
    assert.ok(codes(missing, 'warning').includes('block-malformed'));
  });

  it('reports parse errors and falls back to the source', async () => {
    const body = await compile('# 05 — T\n\n## Concept map\n\n```mermaid\nsequenceDiagram\n  A->>B: hi\n```\n', {
      meta: { id: 'ms.chapter.5', entityType: 'chapter', section: null },
    });
    const diagnostic = body.diagnostics.find((item) => item.code === 'mermaid-parse-error');
    assert.equal(diagnostic?.severity, 'error');
    assert.equal(diagnostic?.line, 6, 'issue line is mapped into the file');
    assert.equal(onlyBlock(body, 'code').lang, 'mermaid');
  });
});
