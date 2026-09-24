import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inlineToText, type Inline } from '@atlas/core';
import { classifyHtml } from '../../src/markdown/inline.ts';
import { compile, codes, fakeContext, onlyBlock, section } from './helpers.ts';

async function paragraph(markdown: string, ctx = fakeContext()): Promise<{ content: readonly Inline[]; body: Awaited<ReturnType<typeof compile>> }> {
  const body = await compile(section('Intuition', markdown), { ctx });
  return { content: onlyBlock(body, 'paragraph').content, body };
}

function kinds(nodes: readonly Inline[]): string[] {
  return nodes.map((node) => node.kind);
}

describe('inline conversion', () => {
  it('keeps tokenizer placeholders such as <bos>, <unk>, <s>, </s> as literal text without diagnostics', async () => {
    const { content, body } = await paragraph('Sequences start with <bos>, map rare bytes to <unk>, and SentencePiece wraps them in <s> … </s> tokens.');
    assert.equal(inlineToText(content), 'Sequences start with <bos>, map rare bytes to <unk>, and SentencePiece wraps them in <s> … </s> tokens.');
    assert.ok(content.every((node) => node.kind === 'text'));
    assert.deepEqual(codes(body), []);
  });

  it('turns a real inline tag into text and reports raw-html-dropped', async () => {
    const { content, body } = await paragraph('A <span class="x">styled</span> word.');
    assert.equal(inlineToText(content), 'A <span class="x">styled</span> word.');
    assert.ok(codes(body).includes('raw-html-dropped'));
  });

  it('classifies raw html tokens', () => {
    assert.equal(classifyHtml('<bos>'), 'placeholder');
    assert.equal(classifyHtml('<s>'), 'placeholder');
    assert.equal(classifyHtml('<statement>'), 'placeholder');
    assert.equal(classifyHtml('<div>'), 'tag');
    assert.equal(classifyHtml('<name attr="1">'), 'tag');
    assert.equal(classifyHtml('<!-- note -->'), 'comment');
  });

  it('recognises evidence labels, but not a DERIVED:eq source id', async () => {
    const { content } = await paragraph('The bound holds [MATHEMATICALLY-DERIVED · DERIVED:eq-2.1] and is PAPER-REPORTED elsewhere.');
    const labels = content.filter((node) => node.kind === 'label');
    assert.deepEqual(
      labels.map((node) => (node.kind === 'label' ? node.label : null)),
      ['MATHEMATICALLY-DERIVED', 'PAPER-REPORTED'],
    );
    assert.match(inlineToText(content), /DERIVED:eq-2\.1/u);
  });

  it('recognises known citation keys, also inside brackets, and diagnoses unknown R-keys', async () => {
    const { content, body } = await paragraph('PAPER-REPORTED (P01, Table 1) and [R5.13]; R9.99 is unknown and P77 is not a key here.');
    const cites = content.filter((node) => node.kind === 'cite').map((node) => (node.kind === 'cite' ? node.key : ''));
    assert.deepEqual(cites, ['P01', 'R5.13']);
    assert.deepEqual(codes(body), ['citation-unresolved']);
    assert.match(inlineToText(content), /R9\.99 is unknown and P77/u);
  });

  it('never recognises tokens inside inline code or math', async () => {
    const { content } = await paragraph('Use `P01 PAPER-REPORTED Eq. 5.4` and $P01$ literally.');
    assert.deepEqual(kinds(content), ['text', 'code', 'text', 'math', 'text']);
  });

  it('resolves cross-references and keeps the authored text', async () => {
    const target = { nodeId: 'ms.section.5.2' as const, anchor: 'eq-5-4', href: '/ch05/05-2/#eq-5-4' };
    const ctx = fakeContext({ xrefs: { 'equation:5.4': target } });
    const { content, body } = await paragraph('See Eq. (5.4), Eqs. 5.4–5.7, the bound (Eq. 5.4), Algorithm 5.2 and Fig. 5.3.', ctx);
    const xrefs = content.filter((node) => node.kind === 'xref');
    assert.deepEqual(
      xrefs.map((node) => (node.kind === 'xref' ? [node.ref, node.number, node.text, node.target?.anchor ?? null] : [])),
      [
        ['equation', '5.4', 'Eq. (5.4)', 'eq-5-4'],
        ['equation', '5.4', 'Eqs. 5.4–5.7', 'eq-5-4'],
        ['equation', '5.4', 'Eq. 5.4', 'eq-5-4'],
        ['algorithm', '5.2', 'Algorithm 5.2', null],
        ['figure', '5.3', 'Fig. 5.3', null],
      ],
    );
    assert.ok(inlineToText(content).includes('(Eq. 5.4),'), 'the closing parenthesis of a parenthetical is not swallowed');
    assert.deepEqual(codes(body).filter((code) => code === 'xref-unresolved').length, 2);
  });

  it('resolves links through the context and records linked nodes', async () => {
    const ctx = fakeContext({ links: { '../ch14/14-1.md': 'ms.section.14.1' } });
    const body = await compile(section('Intuition', 'Owned by [§14.1 with P01](../ch14/14-1.md) and [docs](https://pytorch.org/docs).'), { ctx });
    const content = onlyBlock(body, 'paragraph').content;
    const links = content.filter((node) => node.kind === 'link');
    assert.equal(links.length, 2);
    const first = links[0];
    assert.ok(first?.kind === 'link' && first.target.type === 'node');
    assert.ok(first.children.every((child) => child.kind !== 'cite'), 'no citation inside link text');
    assert.deepEqual(body.linksTo, ['ms.section.14.1']);
  });

  it('renders inline math with KaTeX and reports render errors', async () => {
    const good = await paragraph('Parent id $u_{\\mathrm{in}}$ here.');
    const math = good.content.find((node) => node.kind === 'math');
    assert.ok(math?.kind === 'math' && math.html.includes('katex'));
    const bad = await paragraph('Broken $\\frac{1}{$ math.');
    assert.ok(codes(bad.body, 'error').includes('equation-render-error'));
  });

  it('keeps a lone dollar amount as text', async () => {
    const { content } = await paragraph('An hourly rate of $7.30 (R5.13, PAPER-REPORTED).');
    assert.ok(!content.some((node) => node.kind === 'math'));
    assert.match(inlineToText(content), /\$7\.30/u);
  });
});
