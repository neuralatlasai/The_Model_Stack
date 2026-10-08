/** Structured inspection rows preserve the complete authored inline stream. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inlineToText, type Inline } from '@atlas/core';
import { inspectionDimensions, type InspectionDimensions } from '../lib/inspection-dimensions.ts';

function text(value: string): Inline {
  return { kind: 'text', value };
}

function emphasis(value: string): Inline {
  return { kind: 'emphasis', children: [text(value)] };
}

const HEADING: Inline = { kind: 'strong', children: [text('Inspection dimensions applied.')] };

/** Concatenate rendered semantic slots in their document order, including delimiters. */
function project(view: InspectionDimensions): string {
  if (view.kind === 'paragraph') return inlineToText(view.content);
  return (
    inlineToText(view.heading) +
    view.rows.map((row) => inlineToText(row.term) + inlineToText(row.content)).join('') +
    inlineToText(view.trailing)
  );
}

describe('inspection dimensions presentation', () => {
  it('renders six explicit dimensions and retains the Communication sentence as following prose', () => {
    const communication = emphasis('Communication');
    const nodes: readonly Inline[] = [
      HEADING,
      text(' '),
      emphasis('Precision'),
      text(': solve sensitivity and finite-logit differentiation (§§02.1,02.4). '),
      emphasis('Memory'),
      text(': operands, temporary copies, reverse-mode state, curvature factors (§§02.1,02.4). '),
      emphasis('Kernels'),
      text(': contraction accounting and documented fused-loss interface (§§02.1,02.3,02.4). '),
      emphasis('Post-training'),
      text(': importance ratios, sampled KL, score derivatives (§§02.2–02.4). '),
      emphasis('Metrics'),
      text(': BPB, paired differences, confidence intervals and power (§§02.3,02.5). '),
      emphasis('Reproducibility'),
      text(': inspected revisions, declared units, resampling labels and unexecuted verification. '),
      communication,
      text(
        ' is counted only when explicitly introduced by a placement; distributed mechanisms are owned by Chapter 29. Parallelism, checkpoint/restart, deployment reliability, and production serving behavior are not chapter-owned implementations.',
      ),
    ];
    const before = structuredClone(nodes);
    const view = inspectionDimensions(nodes);
    assert.equal(view.kind, 'dimensions');
    if (view.kind !== 'dimensions') return;
    assert.deepEqual(
      view.rows.map((row) => inlineToText(row.term)),
      ['Precision:', 'Memory:', 'Kernels:', 'Post-training:', 'Metrics:', 'Reproducibility:'],
    );
    assert.equal(view.heading[0], HEADING);
    assert.equal(view.trailing[0], communication);
    assert.match(inlineToText(view.trailing), /^Communication is counted only/u);
    assert.equal(project(view), inlineToText(nodes));
    assert.deepEqual(nodes, before);
  });

  it('keeps cross-reference, citation and link nodes with their original targets', () => {
    const xref: Inline = {
      kind: 'xref',
      ref: 'equation',
      number: '2.4',
      text: 'Eq. 2.4',
      target: { nodeId: 'ms.section.2.1', anchor: 'eq-2-4', href: '/chapter-02/section-1/#eq-2-4' },
    };
    const cite: Inline = { kind: 'cite', key: 'R2.1', resolved: true };
    const link: Inline = {
      kind: 'link',
      target: { type: 'node', nodeId: 'ms.references.2', anchor: null, href: '/chapter-02/references/' },
      children: [text('primary source')],
    };
    const nodes: readonly Inline[] = [
      HEADING,
      text(' Applied to the inspected sources. '),
      emphasis('Precision'),
      text(': see '),
      xref,
      text(' and '),
      cite,
      text('. '),
      emphasis('Metrics'),
      text(': retain the '),
      link,
      text('.'),
    ];
    const view = inspectionDimensions(nodes);
    assert.equal(view.kind, 'dimensions');
    if (view.kind !== 'dimensions') return;
    assert.ok(view.rows[0]?.content.includes(xref));
    assert.ok(view.rows[0]?.content.includes(cite));
    assert.ok(view.rows[1]?.content.includes(link));
    assert.equal(project(view), inlineToText(nodes));
    assert.deepEqual(view.trailing, []);
  });

  it('leaves ordinary paragraphs, free inspection prose and fewer than two explicit terms unchanged', () => {
    const cases: readonly (readonly Inline[])[] = [
      [],
      [text('Ordinary prose. '), emphasis('Precision'), text(': one. '), emphasis('Metrics'), text(': two.')],
      [HEADING, text(' Memory, Precision, Communication and Metrics are accounted for in this chapter.')],
      [
        HEADING,
        text(' Of the dimensions, '),
        emphasis('Precision'),
        text(' — accumulation dtype; '),
        emphasis('Memory'),
        text(' — saved state.'),
      ],
      [HEADING, text(' '), emphasis('Precision'), text(': a single explicit dimension.')],
      [
        HEADING,
        text(' '),
        emphasis('Precision'),
        text(' : not an immediate colon. '),
        emphasis('Metrics'),
        text(': one.'),
      ],
      [
        { kind: 'strong', children: [text('Inspection dimensions.')] },
        text(' '),
        emphasis('Precision'),
        text(': one. '),
        emphasis('Metrics'),
        text(': two.'),
      ],
    ];
    for (const nodes of cases) {
      const view = inspectionDimensions(nodes);
      assert.equal(view.kind, 'paragraph');
      if (view.kind === 'paragraph') assert.equal(view.content, nodes);
      assert.equal(project(view), inlineToText(nodes));
    }
  });

  it('does not parse separators inside equations, code or nested emphasis as dimension boundaries', () => {
    const math: Inline = {
      kind: 'math',
      tex: String.raw`p(x):=\frac{a;b}{c:d}`,
      html: '<span>trusted math: a;b</span>',
    };
    const code: Inline = { kind: 'code', value: 'dtype: fp32; axis: -1' };
    const bodyEmphasis = emphasis('paired');
    const nested: Inline = {
      kind: 'link',
      target: { type: 'external', href: 'https://example.org/primary' },
      children: [emphasis('Not a top-level term'), text(': nested body.')],
    };
    const nodes: readonly Inline[] = [
      HEADING,
      text(' '),
      emphasis('Precision'),
      text(': evaluate '),
      math,
      text('; preserve '),
      code,
      text('. '),
      emphasis('Metrics'),
      text(': use '),
      bodyEmphasis,
      text(' comparisons and '),
      nested,
      text(' Retain punctuation: a;b:c.'),
    ];
    const view = inspectionDimensions(nodes);
    assert.equal(view.kind, 'dimensions');
    if (view.kind !== 'dimensions') return;
    assert.equal(view.rows.length, 2);
    assert.ok(view.rows[0]?.content.includes(math));
    assert.ok(view.rows[0]?.content.includes(code));
    assert.ok(view.rows[1]?.content.includes(bodyEmphasis));
    assert.ok(view.rows[1]?.content.includes(nested));
    assert.deepEqual(view.trailing, []);
    assert.equal(project(view), inlineToText(nodes));
    assert.equal(math.tex, String.raw`p(x):=\frac{a;b}{c:d}`);
  });

  it('keeps sentence-leading body emphasis inside the final definition', () => {
    const saved = emphasis('Saved activations');
    const nodes: readonly Inline[] = [
      HEADING,
      text(' '),
      emphasis('Precision'),
      text(': preserve accumulation. '),
      emphasis('Memory'),
      text(': retain copies. '),
      saved,
      text(' dominate peak memory.'),
    ];
    const view = inspectionDimensions(nodes);
    assert.equal(view.kind, 'dimensions');
    if (view.kind !== 'dimensions') return;
    assert.ok(view.rows[1]?.content.includes(saved));
    assert.deepEqual(view.trailing, []);
    assert.equal(project(view), inlineToText(nodes));
  });

  it('does not infer a summary from another dimension name or different Communication wording', () => {
    const precision = emphasis('Precision');
    const communication = emphasis('Communication');
    const nodes: readonly Inline[] = [
      HEADING,
      text(' '),
      emphasis('Kernels'),
      text(': account for contractions. '),
      emphasis('Memory'),
      text(': retain copies. '),
      precision,
      text(' affects storage. '),
      communication,
      text(' dominates some placement costs.'),
    ];
    const view = inspectionDimensions(nodes);
    assert.equal(view.kind, 'dimensions');
    if (view.kind !== 'dimensions') return;
    assert.ok(view.rows[1]?.content.includes(precision));
    assert.ok(view.rows[1]?.content.includes(communication));
    assert.deepEqual(view.trailing, []);
    assert.equal(project(view), inlineToText(nodes));
  });
});
