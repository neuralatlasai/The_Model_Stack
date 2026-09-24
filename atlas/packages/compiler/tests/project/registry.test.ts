import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { before, describe, it } from 'node:test';
import { inlineToText, type Block, type Inline, type TableBlock } from '@atlas/core';
import { buildNodeTable, type NodeTableResult } from '../../src/project/nodes.ts';
import { sliceInline } from '../../src/project/walk.ts';
import { buildEntities, parseEntryCell } from '../../src/registry/entities.ts';
import { buildEquationIndex, buildObjectIndex } from '../../src/registry/indexes.ts';
import { collectLineage, parseLineageText } from '../../src/registry/lineage.ts';
import { parseReferenceStack, type ReferenceStack } from '../../src/registry/reference-stack.ts';
import { collectTerms } from '../../src/registry/terms.ts';
import { compiledSource, must, realManifest, region, source, text } from './fixtures.ts';
import { REFERENCE_STACK } from './paths.ts';

const CH05 = 'vol-01-learning-and-representation/part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace';

describe('lineage grammar', () => {
  it('parses the formats used across chapters', () => {
    const cases: [string, string, string, string | null, string | null][] = [
      ['2017 · Attention Is All You Need (P01) · conceptual ancestor — the encoder–decoder reference.', '2017', 'Attention Is All You Need', 'P01', 'the encoder–decoder reference.'],
      ['2015 · Hidden Technical Debt in Machine Learning Systems [R1.5] · conceptual ancestor (hidden feedback loops).', '2015', 'Hidden Technical Debt in Machine Learning Systems', 'R1.5', '(hidden feedback loops).'],
      ['1985 · IEEE Std 754 (binary floating-point arithmetic; revised 2008, 2019) [R3.1] · *conceptual ancestor*', '1985', 'IEEE Std 754 (binary floating-point arithmetic; revised 2008, 2019)', 'R3.1', null],
      ['2019 · T5 (P02) · *current frontier* for span-corruption bookkeeping — sentinel targets', '2019', 'T5', 'P02', 'for span-corruption bookkeeping — sentinel targets'],
      ['2019 · CCNet (R7.17) and C4 (P02) · *conceptual ancestor* — WET extraction', '2019', 'CCNet and C4', 'R7.17', 'WET extraction'],
      ['1948 · Shannon, *A Mathematical Theory of Communication* [R2.1] · conceptual ancestor (entropy, coding length)', '1948', 'Shannon, A Mathematical Theory of Communication', 'R2.1', '(entropy, coding length)'],
      ['2025+ · hardware-specialised attention kernels · current frontier', '2025+', 'hardware-specialised attention kernels', null, null],
    ];
    for (const [line, year, work, cite, note] of cases) {
      const parsed = parseLineageText(line.replaceAll('*', ''));
      assert.ok(typeof parsed !== 'string', `${line}: ${typeof parsed === 'string' ? parsed : ''}`);
      assert.equal(parsed.year, year);
      assert.equal(parsed.work, work);
      assert.equal(parsed.cite, cite);
      const plain = line.replaceAll('*', '');
      assert.equal(parsed.noteStart === null ? null : plain.slice(parsed.noteStart), note);
    }
  });

  it('rejects entries without a relation word or year', () => {
    assert.equal(typeof parseLineageText('2017 · Transformer · inspired'), 'string');
    assert.equal(typeof parseLineageText('circa 2017 · Transformer · conceptual ancestor'), 'string');
  });

  it('collects entries from a chapter lineage region and keeps inline structure in notes', () => {
    const item = (content: Inline[]): { blocks: Block[]; checked: null } => ({ blocks: [{ kind: 'paragraph', anchor: null, depth: 'overview', content }], checked: null });
    const list: Block = {
      kind: 'list',
      anchor: null,
      depth: 'overview',
      ordered: false,
      start: null,
      items: [
        item([
          { kind: 'text', value: '2022 · FlashAttention (' },
          { kind: 'cite', key: 'P19', resolved: true },
          { kind: 'text', value: ') · engineering optimization — exact attention, see ' },
          { kind: 'math', tex: 'O(T^2)', html: '<span>…</span>' },
        ]),
        item(text('2017 · Transformer (P01) · rearranged')),
      ],
    };
    const compiled = [compiledSource(source('ms.chapter.5', `${CH05}/README.md`), { regions: [region('lineage', 'Lineage', [list])] })];
    const { lineage, diagnostics } = collectLineage(compiled);
    assert.equal(lineage.length, 1);
    const entry = must(lineage[0]);
    assert.equal(entry.relation, 'engineering optimization');
    assert.equal(entry.cite, 'P19');
    assert.equal(entry.work, 'FlashAttention');
    assert.ok(entry.note.some((node) => node.kind === 'math'));
    assert.equal(inlineToText(entry.note), 'exact attention, see O(T^2)');
    assert.equal(diagnostics.length, 1);
    assert.equal(must(diagnostics[0]).code, 'block-malformed');
  });
});

describe('sliceInline', () => {
  it('slices across nested nodes by text offset', () => {
    const nodes: Inline[] = [
      { kind: 'text', value: 'ab' },
      { kind: 'strong', children: [{ kind: 'text', value: 'cd' }] },
      { kind: 'code', value: 'ef' },
    ];
    assert.equal(inlineToText(sliceInline(nodes, 1, 5)), 'bcde');
    assert.equal(sliceInline(nodes, 2, 4)[0]?.kind, 'strong');
  });
});

describe('reference-stack coverage → entities', () => {
  let stack: ReferenceStack;
  let table: NodeTableResult;

  before(async () => {
    stack = parseReferenceStack(await readFile(REFERENCE_STACK, 'utf8'), 'stack.md');
    table = buildNodeTable(await realManifest(), []);
  });

  it('parses entry cells in all observed formats', () => {
    assert.deepEqual(parseEntryCell('#17 PyTorch'), [{ rank: 17, name: 'PyTorch' }]);
    assert.deepEqual(parseEntryCell('**PyTorch** (#17)'), [{ rank: 17, name: 'PyTorch' }]);
    assert.deepEqual(parseEntryCell('#42 SGLang; #43 TensorRT-LLM; #45 llama.cpp'), [
      { rank: 42, name: 'SGLang' },
      { rank: 43, name: 'TensorRT-LLM' },
      { rank: 45, name: 'llama.cpp' },
    ]);
    assert.deepEqual(parseEntryCell('LMArena leaderboards'), [{ rank: null, name: 'LMArena leaderboards' }]);
  });

  it('attaches uses from coverage tables and usedBy from implementations', () => {
    const cell = (value: string): Inline[] => text(value);
    const coverage: TableBlock = {
      kind: 'table',
      anchor: null,
      depth: 'research',
      role: 'stack-coverage',
      wide: true,
      columns: ['Stack section', 'Entry (rank)', 'Stack layer', 'What this chapter takes from it', 'Surface used', 'Sections', 'Evidence label'].map((header) => ({
        header: cell(header),
        align: null,
      })),
      rows: [
        ['§1 lab', '#18 Google Research', '—', 'P01 equations', 'Papers', '5.1–5.5', 'PAPER-REPORTED'].map(cell),
        ['§4 system', '**PyTorch** (#17)', 'Model / autograd framework', 'SDPA signature', 'docs/code', '5.1–5.6', 'OFFICIAL-DOCUMENTATION'].map(cell),
        ['§4 system', '#42 SGLang; #41 TensorRT-LLM', 'Inference engine', 'forward pointers', 'docs/code', '5.5', 'OFFICIAL-DOCUMENTATION'].map(cell),
        ['§2 conference', '#1 NeurIPS', '—', 'venue', 'Papers', '5.1', 'PAPER-REPORTED'].map(cell),
      ],
    };
    const chapter = source('ms.chapter.5', `${CH05}/README.md`, { implementations: ['impl.pytorch', 'impl.flashmla'] });
    const section = source('ms.section.5.2', `${CH05}/05-2-attention-calculation.md`, { implementations: ['impl.pytorch', 'impl.vllm'] });
    const compiled = [
      compiledSource(chapter, { regions: [region('stack-coverage', 'Reference-stack coverage', [coverage])] }),
      compiledSource(section),
    ];
    const built = buildEntities(stack, compiled, table);
    const pytorch = must(built.systems.find((system) => system.id === 'impl.pytorch'));
    assert.deepEqual(pytorch.usedBy, ['ms.chapter.5', 'ms.section.5.2']);
    assert.equal(pytorch.uses.length, 1);
    const use = must(pytorch.uses[0]);
    assert.equal(use.sections, '5.1–5.6');
    assert.equal(inlineToText(use.what), 'SDPA signature');
    assert.equal(pytorch.atlasUrl, '/systems/pytorch/');
    assert.equal(built.systems.find((system) => system.id === 'impl.sglang')?.uses.length, 1);
    assert.equal(built.labs.find((lab) => lab.name === 'Google Research')?.uses[0]?.nodeId, 'ms.chapter.5');
    // "#41 TensorRT-LLM" names the wrong rank; the flash-mla implementation is not in the stack.
    const messages = built.diagnostics.map((item) => item.message);
    assert.ok(messages.some((message) => message.includes('#41 TensorRT-LLM')));
    assert.ok(messages.some((message) => message.startsWith('impl.flashmla')));
    assert.ok(built.diagnostics.every((item) => item.code === 'reference-stack-parse'));
    // Name wins over a wrong rank.
    assert.equal(built.systems.find((system) => system.id === 'impl.tensorrt-llm')?.uses.length, 1);
  });
});

describe('terms and indexes', () => {
  it('assigns one owner per term, first in reading order, and diagnoses duplicates', async () => {
    const table = buildNodeTable(await realManifest(), [
      source('ms.section.5.1', `${CH05}/05-1-end-to-end-forward-pass.md`, { slug: '05-1-end-to-end-forward-pass' }),
      source('ms.section.5.2', `${CH05}/05-2-attention-calculation.md`, { slug: '05-2-attention-calculation' }),
    ]);
    const definition = (term: string, slug: string): Block => ({ kind: 'definition', anchor: `term-${slug}`, depth: 'overview', term, termSlug: slug, content: text(`${term} means…`) });
    const [first, second] = table.docs;
    assert.ok(first !== undefined && second !== undefined);
    const compiled = [
      compiledSource(first, { regions: [region('formulation', 'Formulation', [definition('residual stream', 'residual-stream')])] }),
      compiledSource(second, {
        regions: [
          region('formulation', 'Formulation', [
            definition('residual stream', 'residual-stream'),
            definition('attention score matrix', 'attention-score-matrix'),
            {
              kind: 'equation',
              anchor: 'eq-5-4',
              depth: 'technical',
              number: '5.4',
              tex: 'S = QK^T',
              html: '<span class="katex">S</span>',
              note: null,
              variables: [{ symbol: 'S', meaning: 'scores' }],
            },
            { kind: 'failure-mode', anchor: 'fm-overflow', depth: 'research', name: 'Softmax overflow', symptom: null, cause: null, detection: null, mitigation: null },
          ]),
        ],
      }),
    ];
    const { terms, diagnostics } = collectTerms(compiled, table);
    assert.deepEqual(
      terms.map((term) => [term.slug, term.owner]),
      [
        ['attention-score-matrix', 'ms.section.5.2'],
        ['residual-stream', 'ms.section.5.1'],
      ],
    );
    assert.equal(must(terms[1]).url, '/ch05-minimal-transformer-and-execution-trace/05-1-end-to-end-forward-pass/#term-residual-stream');
    assert.equal(diagnostics.length, 1);
    const duplicate = must(diagnostics[0]);
    assert.equal(duplicate.code, 'term-duplicate-owner');
    assert.equal(duplicate.severity, 'warning');

    const equations = buildEquationIndex(compiled, table);
    assert.equal(equations.length, 1);
    const equation = must(equations[0]);
    assert.equal(equation.url, '/ch05-minimal-transformer-and-execution-trace/05-2-attention-calculation/#eq-5-4');
    assert.deepEqual(equation.variables, [{ symbol: 'S', meaning: 'scores' }]);

    const objects = buildObjectIndex(compiled, table);
    assert.ok(objects.some((entry) => entry.kind === 'failure-mode' && entry.anchor === 'fm-overflow'));
    assert.equal(objects.filter((entry) => entry.kind === 'definition').length, 3);
  });
});
