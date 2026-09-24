/**
 * KaTeX and Shiki as configured for CompileContext, and the CLI's argument
 * boundary (usage errors never start a compile).
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { EXIT_CODES, main, type CliIo } from '../../src/cli.ts';
import { createCodeHighlighter, type CodeHighlighter } from '../../src/highlight/highlighter.ts';
import { renderMath } from '../../src/project/math.ts';

describe('renderMath', () => {
  it('renders HTML plus MathML and marks display mode', () => {
    const inline = renderMath('u_{\\mathrm{in}}', false);
    assert.match(inline, /class="katex"/u);
    assert.match(inline, /<math/u);
    assert.match(renderMath('M = 2LBSH_{kv}d_hb', true), /katex-display/u);
  });

  it('throws on invalid TeX so the Markdown compiler can diagnose it', () => {
    assert.throws(() => renderMath('\\frac{1}{', false));
  });

  it('does not trust \\href or leak macros between calls', () => {
    // Untrusted commands render as inert red text; the TeX survives only as escaped annotation text.
    const html = renderMath('\\href{javascript:alert(1)}{x}', false);
    assert.doesNotMatch(html, /<a\s|href=/u);
    renderMath('\\gdef\\foo{1}\\foo', false);
    assert.throws(() => renderMath('\\foo', false));
  });
});

describe('code highlighter', () => {
  let highlighter: CodeHighlighter;

  before(async () => {
    highlighter = await createCodeHighlighter();
  });

  after(() => {
    highlighter.dispose();
  });

  it('emits dual-theme CSS variables for loaded languages', () => {
    const html = highlighter.highlight('x = softmax(q @ k.T)  # scores', 'python');
    assert.ok(html !== null);
    assert.match(html, /--shiki-light:/u);
    assert.match(html, /--shiki-dark:/u);
    assert.match(html, /atlas-light/u);
  });

  it('escapes plain text and returns null for unknown languages', () => {
    assert.match(highlighter.highlight('<bos> tokens', 'text') ?? '', /&#x3C;bos>/u);
    assert.equal(highlighter.highlight('x', 'brainfuck'), null);
    assert.equal(highlighter.highlight('x', null), null);
    assert.ok(highlighter.highlight('{"a": 1}', 'JSON') !== null, 'language names are case-insensitive');
  });
});

describe('cli argument boundary', () => {
  const capture = (): CliIo & { readonly text: () => string } => {
    let buffer = '';
    return {
      out: (value) => {
        buffer += value;
      },
      err: (value) => {
        buffer += value;
      },
      text: () => buffer,
    };
  };

  it('prints help and exits 0', async () => {
    const io = capture();
    assert.equal(await main(['--help'], io), EXIT_CODES.ok);
    assert.match(io.text(), /^Usage: atlas-compile/u);
  });

  it('exits 2 on unknown flags, missing arguments, and invalid values', async () => {
    const io = capture();
    assert.equal(await main(['--nope'], io), EXIT_CODES.usage);
    assert.equal(await main(['--docs', 'x'], io), EXIT_CODES.usage);
    assert.match(io.text(), /--reference-stack is required/u);
    assert.equal(await main(['--docs', 'x', '--reference-stack', 'y', '--out', 'z', '--compiled-at', 'yesterday'], io), EXIT_CODES.usage);
    assert.equal(await main(['--docs', 'x', '--reference-stack', 'y', '--out', 'z', '--concurrency', '64'], io), EXIT_CODES.usage);
  });

  it('exits 3 when an input cannot be read', async () => {
    const io = capture();
    assert.equal(
      await main(['--docs', 'definitely-missing-docs', '--reference-stack', 'missing.md', '--out', 'never-written', '--quiet'], io),
      EXIT_CODES.fatal,
    );
    assert.match(io.text(), /atlas-manifest\.json/u);
  });
});
