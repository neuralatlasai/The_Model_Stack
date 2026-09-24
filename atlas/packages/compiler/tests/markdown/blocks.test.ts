import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inlineToText } from '@atlas/core';
import { parseWhereClause } from '../../src/markdown/blocks/equation.ts';
import { blocksOf, codes, compile, fakeContext, onlyBlock, section } from './helpers.ts';

const text = inlineToText;

describe('typed blockquotes', () => {
  it('reads a definition with its term slug and anchor', async () => {
    const body = await compile(
      section(
        'Formulation',
        '> **Definition — attention score matrix.** The `[B, H, T, T]` tensor `S = QKᵀ/√Dh` before masking and softmax; it is the only tensor in the reference forward pass whose size is quadratic in T.',
      ),
    );
    const definition = onlyBlock(body, 'definition');
    assert.equal(definition.term, 'attention score matrix');
    assert.equal(definition.termSlug, 'attention-score-matrix');
    assert.equal(definition.anchor, 'term-attention-score-matrix');
    assert.match(text(definition.content), /^The \[B, H, T, T\] tensor/u);
    assert.deepEqual(body.definedTerms, ['attention-score-matrix']);
  });

  it('reads a claim label and typed sources', async () => {
    const body = await compile(
      section('Formulation', '> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-42.1; P19, R5.13, OD:vllm-docs, some note].** For L=32 the tensors occupy 8 GiB.'),
    );
    const claim = onlyBlock(body, 'claim');
    assert.equal(claim.label, 'MATHEMATICALLY-DERIVED');
    assert.deepEqual(
      claim.sources.map((source) => [source.raw, source.type, source.key]),
      [
        ['DERIVED:eq-42.1', 'derived', null],
        ['P19', 'paper', 'P19'],
        ['R5.13', 'reference', 'R5.13'],
        ['OD:vllm-docs', 'official-doc', null],
        ['some note', 'other', null],
      ],
    );
    assert.equal(text(claim.content), 'For L=32 the tensors occupy 8 GiB.');
    assert.deepEqual(body.citations, ['P19', 'R5.13']);
  });

  it('degrades a claim with an unknown label to a quote plus a diagnostic', async () => {
    const body = await compile(section('Formulation', '> **Claim [PROBABLY-TRUE · P01].** Something.'));
    assert.equal(blocksOf(body, 'claim').length, 0);
    assert.equal(blocksOf(body, 'quote').length, 1);
    assert.ok(codes(body).includes('block-malformed'));
  });

  it('splits an assumption at its sensitivity marker', async () => {
    const body = await compile(
      section(
        'Formulation',
        '> **Assumption.** The scale is exactly `1/√Dh` · *sensitivity:* PAPER-REPORTED (P01, §3.2.1, footnote): a learned scale changes the softmax temperature.',
      ),
    );
    const assumption = onlyBlock(body, 'assumption');
    assert.equal(text(assumption.content), 'The scale is exactly 1/√Dh');
    assert.equal(text(assumption.sensitivity ?? []), 'PAPER-REPORTED (P01, §3.2.1, footnote): a learned scale changes the softmax temperature.');
    assert.equal(assumption.depth, 'technical');
  });

  it('reads observations, open questions, notes, and implementation notes', async () => {
    const body = await compile(
      section(
        'Limitations',
        [
          '> **Observation [PAPER-REPORTED].** The paper reports a speedup.',
          '',
          '> **Open question.** Does exposure bias survive post-training? · *what evidence would settle it:* a paired comparison.',
          '',
          '> **Historical note.** The three-level scheme is Marr’s.',
          '',
          '> **Caveat.** Leaderboards are rung-0 evidence.',
          '',
          '> **Warning.** Run untrusted code in a sandbox.',
          '',
          '> **Further reading.** See the survey.',
          '',
          '> **Implementation note [impl.pytorch · 2.14.0 documentation, execution UNVERIFIED].** The documented computation scales by 1/√E.',
          '',
          '> **Implementation note [datatrove · commit 1ca2583, not executed].** Defaults are 5-grams.',
          '',
          '> A plain quotation.',
        ].join('\n'),
      ),
    );
    assert.equal(onlyBlock(body, 'observation').label, 'PAPER-REPORTED');
    const question = onlyBlock(body, 'open-question');
    assert.equal(text(question.content), 'Does exposure bias survive post-training?');
    assert.equal(text(question.settle ?? []), 'a paired comparison.');
    assert.equal(question.anchor, 'oq-1');
    const notes = blocksOf(body, 'note');
    assert.deepEqual(
      notes.map((note) => [note.variant, note.impl, note.version]),
      [
        ['historical', null, null],
        ['caveat', null, null],
        ['warning', null, null],
        ['further-reading', null, null],
        ['implementation', 'impl.pytorch', '2.14.0 documentation, execution UNVERIFIED'],
        ['implementation', null, 'datatrove · commit 1ca2583, not executed'],
      ],
    );
    assert.equal(blocksOf(body, 'quote').length, 1);
  });

  it('reads a failure mode with all four segments and an anchor', async () => {
    const body = await compile(
      section(
        'Failure modes',
        '> **Failure mode — future leakage.** *Symptom:* training loss falls implausibly fast. *Cause:* mask applied after softmax, wrong orientation (`triu` versus `tril`). *Detection:* assert `P[..., i, j] = 0` for `j > i`. *Mitigation:* additive `−∞` mask before softmax.',
      ),
    );
    const failure = onlyBlock(body, 'failure-mode');
    assert.equal(failure.name, 'future leakage');
    assert.equal(failure.anchor, 'fm-future-leakage');
    assert.equal(text(failure.symptom ?? []), 'training loss falls implausibly fast.');
    assert.equal(text(failure.cause ?? []), 'mask applied after softmax, wrong orientation (triu versus tril).');
    assert.equal(text(failure.detection ?? []), 'assert P[..., i, j] = 0 for j > i.');
    assert.equal(text(failure.mitigation ?? []), 'additive −∞ mask before softmax.');
    assert.equal(failure.depth, 'research');
  });

  it('recovers failure-mode fields when stray asterisks open an emphasis across them', async () => {
    const body = await compile(
      section(
        'Failure modes',
        "> **Failure mode — constant transfer.** *Symptom:* the planner's N* changes across the R*_D sensitivity range. *Cause:* an English-web constant. *Detection:* step 8. *Mitigation:* fit R*_D on the pool.",
      ),
    );
    const failure = onlyBlock(body, 'failure-mode');
    assert.ok(failure.cause !== null && failure.detection !== null && failure.mitigation !== null);
    assert.deepEqual(codes(body), []);
  });

  it('attaches a proof sketch to a proposition', async () => {
    const body = await compile(
      section(
        'Formulation',
        '> **Proposition 7.1.** If a catalogue identifies datasets by role, a constraint is inexpressible.\n\n*Proof sketch.* Identification by role means the key is (name, role). ∎\n\nAfter the proof.',
      ),
    );
    const proposition = onlyBlock(body, 'proposition');
    assert.equal(proposition.variant, 'proposition');
    assert.equal(proposition.number, '7.1');
    assert.equal(proposition.anchor, 'prop-7-1');
    assert.equal(proposition.proof?.length, 1);
    assert.equal(blocksOf(body, 'paragraph').length, 2, 'proof paragraph is nested; the following paragraph stays in the region');
  });

  it('attaches a following <details> derivation as a theorem proof', async () => {
    const body = await compile(section('Mechanism', '> **Theorem 2.3.** A statement.\n\n<details><summary>Proof of Theorem 2.3</summary>\n\nStep one.\n\n</details>'));
    const proposition = onlyBlock(body, 'proposition');
    assert.equal(proposition.variant, 'theorem');
    assert.equal(text(proposition.proof?.[0]?.kind === 'paragraph' ? proposition.proof[0].content : []), 'Step one.');
    assert.equal(blocksOf(body, 'expansion').length, 0);
  });
});

describe('equations', () => {
  const eqs = [
    '$$',
    'Q = n\\,W_Q',
    '$$',
    '*(Eq. 5.4)* where the reshape splits D into H contiguous slices of Dh; no arithmetic.',
    '',
    '$$',
    'M_{KV} = 2\\,L\\,B\\,S\\,H_{kv}\\,d_h\\,b',
    '$$',
    '*(Eq. 42.1)* where L = layers, B = sequences, S = tokens per sequence, H_kv = KV heads, d_h = head dimension, b = bytes per value.',
    '',
    '$$',
    'x = y',
    '$$',
  ].join('\n');

  it('numbers tagged display math, renders it, and parses the variable table', async () => {
    const body = await compile(section('Formulation', eqs));
    const [first, second, third] = blocksOf(body, 'equation');
    assert.equal(first?.number, '5.4');
    assert.equal(first?.anchor, 'eq-5-4');
    assert.match(first?.html ?? '', /katex/u);
    assert.equal(text(first?.note ?? []), 'where the reshape splits D into H contiguous slices of Dh; no arithmetic.');
    assert.deepEqual(first?.variables, []);
    assert.deepEqual(
      second?.variables.map((variable) => [variable.symbol, variable.meaning]),
      [
        ['L', 'layers'],
        ['B', 'sequences'],
        ['S', 'tokens per sequence'],
        ['H_kv', 'KV heads'],
        ['d_h', 'head dimension'],
        ['b', 'bytes per value'],
      ],
    );
    assert.equal(third?.number, null);
    assert.equal(third?.anchor, null);
    assert.equal(first?.depth, 'technical');
    assert.equal(blocksOf(body, 'paragraph').length, 0, 'tag lines are consumed');
  });

  it('parses where-clauses at top level only and stops at the sentence end', () => {
    assert.deepEqual(parseWhereClause('where q_k(u) ≥ 0 = sampling proportion (q_k < 1 sub-samples, q_k > 1 repeats), tok_u = tokenizer. The identity holds.'), [
      { symbol: 'q_k(u) ≥ 0', meaning: 'sampling proportion (q_k < 1 sub-samples, q_k > 1 repeats)' },
      { symbol: 'tok_u', meaning: 'tokenizer' },
    ]);
    assert.deepEqual(parseWhereClause('where b = bytes per value, typically 2'), [{ symbol: 'b', meaning: 'bytes per value, typically 2' }]);
    assert.deepEqual(parseWhereClause('(MATHEMATICALLY-DERIVED)'), []);
  });

  it('diagnoses duplicate numbers and render errors without throwing', async () => {
    const body = await compile(section('Formulation', '$$\na\n$$\n*(Eq. 5.4)*\n\n$$\nb\n$$\n*(Eq. 5.4)*\n\n$$\n\\frac{1}{\n$$\n*(Eq. 5.5)*'));
    assert.ok(codes(body).includes('equation-duplicate-number'));
    assert.ok(codes(body, 'error').includes('equation-render-error'));
    const broken = blocksOf(body, 'equation').find((equation) => equation.number === '5.5');
    assert.equal(broken?.html, '<code>\\frac{1}{</code>');
    const anchors = blocksOf(body, 'equation').map((equation) => equation.anchor);
    assert.equal(new Set(anchors).size, anchors.length, 'anchors stay unique');
  });
});

describe('algorithms, traces, and code', () => {
  const algorithm = [
    '```text',
    'Algorithm 5.2 — Causal multi-head attention (materialised reference form)',
    'INPUT   n : [B, T, D]; W_Q, W_K, W_V, W_O : [D, D]',
    '        H with D mod H = 0',
    'OUTPUT  a : [B, T, D]',
    'STATE   Q, K, V : [B, H, T, Dh]; S, P : [B, H, T, T]',
    'INVARIANT rows of P sum to 1',
    '1.  Q, K, V ← split_heads(n·W_Q)             # Eq. 5.4',
    '2.  for t in 1..T:',
    '3.      S ← Q · Kᵀ / √Dh                     # [B, H, T, T]',
    '        continuation of line 3',
    '4.  return a',
    'TERMINATION: straight-line code; no loops.',
    '```',
    '',
    'Complexity: `8·D² + 4·T·D` FLOPs per token.',
    '',
    'Next paragraph.',
  ].join('\n');

  it('parses the IO contract, numbered lines, comments, indentation, trailer, and complexity', async () => {
    const body = await compile(section('Algorithm', algorithm));
    const block = onlyBlock(body, 'algorithm');
    assert.equal(block.number, '5.2');
    assert.equal(block.anchor, 'alg-5-2');
    assert.equal(block.name, 'Causal multi-head attention (materialised reference form)');
    assert.deepEqual(block.input, ['n : [B, T, D]; W_Q, W_K, W_V, W_O : [D, D]', 'H with D mod H = 0']);
    assert.deepEqual(block.output, ['a : [B, T, D]']);
    assert.deepEqual(block.invariant, ['rows of P sum to 1']);
    assert.deepEqual(
      block.lines.map((line) => [line.n, line.code, line.comment, line.indent]),
      [
        [1, 'Q, K, V ← split_heads(n·W_Q)', 'Eq. 5.4', 0],
        [2, 'for t in 1..T:', null, 0],
        [3, 'S ← Q · Kᵀ / √Dh', '[B, H, T, T]', 4],
        [null, 'continuation of line 3', null, 4],
        [4, 'return a', null, 0],
      ],
    );
    assert.deepEqual(block.trailer, ['TERMINATION: straight-line code; no loops.']);
    assert.equal(text(block.complexity ?? []), '8·D² + 4·T·D FLOPs per token.');
    assert.equal(blocksOf(body, 'paragraph').length, 1, 'the complexity paragraph is consumed');
  });

  it('diagnoses an algorithm without numbered lines', async () => {
    const body = await compile(section('Algorithm', '```text\nAlgorithm 5.9 — Empty\nINPUT x\nOUTPUT y\n```'));
    assert.ok(codes(body).includes('algorithm-malformed'));
  });

  it('builds tensor and systems traces through the visual parsers', async () => {
    const body = await compile(
      section(
        'Implementation',
        [
          '```text',
          'Tensor trace',
          '[B, T, D] → linear W_qkv [D, 3·H·Dh] → [B, T, 3·H·Dh] → view → [B, T, 3, H, Dh]',
          '[B, H, T, Dh] × [B, H, Dh, T] → batched matmul → [B, H, T, T]',
          '```',
          '',
          '```text',
          'Systems trace (single device, one Linear layer)',
          'stage                 → latency          / memory                / compute',
          'cast master→operand   → 1 pass over W    / +2 B/param copy       / elementwise',
          'GEMM forward          → tensor-core bound/ activations saved     / 2·M·N·K FLOPs',
          '```',
        ].join('\n'),
      ),
    );
    const tensor = onlyBlock(body, 'tensor-trace');
    assert.ok(tensor.lines.length >= 2);
    assert.ok(tensor.dims.includes('B') && tensor.dims.includes('Dh'));
    assert.equal(tensor.depth, 'implementation', 'block depth never drops below its region depth');
    const systems = onlyBlock(body, 'systems-trace');
    assert.ok(systems.rows.length >= 2);
    assert.match(systems.title, /^Systems trace/u);
  });

  it('keeps other fenced code as code with the context highlighter', async () => {
    const body = await compile(section('Implementation', '```python\nprint(1)\n```\n\n```text\nplain listing\n```'));
    const [python, plain] = blocksOf(body, 'code');
    assert.equal(python?.lang, 'python');
    assert.equal(python?.anchor, 'code-1');
    assert.equal(python?.html, null);
    assert.equal(plain?.anchor, null);
  });
});

describe('experiments', () => {
  it('reads the field list with bold labels (dot and colon forms)', async () => {
    const body = await compile(
      section(
        'Experimental design',
        [
          '### Experiment 1.1 — Rejection test of a proposed design',
          '',
          '- **Hypothesis.** A design satisfies every constraint.',
          '- **Setup:** Build T_0 by sampling.',
          '- **Independent variables.** None.',
          '- **Controlled variables.** Corpus version.',
          '- **Dataset / workload.** Held-out split.',
          '- **Hardware.** One accelerator class.',
          '- **Metrics.** Q̂ with a paired bootstrap interval.',
          '- **Baselines.** Retrieval-only.',
          '- **Expected result (as a proposal).** Either feasible or rejected.',
          '- **Ablation.** A sweep over b and k.',
          '- **Interpretation.** Each rejection is attributed to a level.',
          '- **Threats to validity.** Dependent units.',
          '',
          'This is a proposal; no run was executed.',
        ].join('\n'),
      ),
    );
    const experiment = onlyBlock(body, 'experiment');
    assert.equal(experiment.number, '1.1');
    assert.equal(experiment.anchor, 'exp-1-1');
    assert.equal(experiment.name, 'Rejection test of a proposed design');
    assert.equal(experiment.fields.length, 12);
    assert.equal(experiment.fields[4]?.name, 'Dataset/workload');
    assert.equal(experiment.fields[8]?.name, 'Expected result');
    const setup = experiment.fields[1]?.blocks[0];
    assert.equal(setup?.kind === 'paragraph' ? text(setup.content) : null, 'Build T_0 by sampling.');
    assert.deepEqual(codes(body), []);
    assert.equal(blocksOf(body, 'paragraph').filter((paragraph) => text(paragraph.content).startsWith('This is a proposal')).length, 1);
    assert.deepEqual(body.outline[0]?.children, [{ anchor: 'exp-1-1', title: 'Experiment 1.1 — Rejection test of a proposed design' }]);
  });

  it('reads the compact paragraph form and reports missing fields as info', async () => {
    const body = await compile(
      section(
        'Experimental design',
        '### Experiment 2.2 (summary; full protocol in verification.md) — Coverage of bootstrap intervals\n\nHypothesis: per-prompt intervals under-cover. Setup: simulate K templates. Metrics: coverage.',
      ),
    );
    const experiment = onlyBlock(body, 'experiment');
    assert.equal(experiment.number, '2.2');
    assert.equal(experiment.name, 'Coverage of bootstrap intervals');
    assert.deepEqual(
      experiment.fields.map((field) => field.name),
      ['Hypothesis', 'Setup', 'Metrics'],
    );
    assert.deepEqual(codes(body), ['experiment-missing-field']);
    assert.equal(body.diagnostics[0]?.severity, 'info');
  });
});

describe('observation layer and siblings', () => {
  it('folds the four labelled paragraphs into one observation-layer block', async () => {
    const body = await compile(
      section(
        'Observations',
        [
          '**What the paper claims.** PAPER-REPORTED (P01, §3.2.2): equal cost.',
          '',
          '**What the evidence shows.** A direct consequence of H·Dh = D.',
          '',
          '> **Open question.** Something open?',
          '',
          '**What we infer.** DERIVED: memory is exhausted first.',
          '',
          '**What remains unknown.** NOT-DISCLOSED: biases.',
        ].join('\n'),
      ),
    );
    const layer = onlyBlock(body, 'observation-layer');
    assert.equal(text(layer.parts.claims ?? []), 'PAPER-REPORTED (P01, §3.2.2): equal cost.');
    assert.equal(text(layer.parts.unknown ?? []), 'NOT-DISCLOSED: biases.');
    assert.deepEqual(
      body.regions[0]?.blocks.map((block) => block.kind),
      ['observation-layer', 'open-question'],
    );
    const evidence = body.rail[0]?.instruments.find((instrument) => instrument.kind === 'evidence');
    assert.deepEqual(evidence?.kind === 'evidence' ? evidence.counts : null, { 'PAPER-REPORTED': 1, DERIVED: 1, 'NOT-DISCLOSED': 1 });
  });

  it('reports an incomplete observation layer', async () => {
    const body = await compile(section('Observations', '**What the paper claims.** Something.'));
    assert.ok(codes(body).includes('observation-layer-incomplete'));
    const empty = await compile(section('Observations', 'Just prose.'));
    assert.ok(codes(empty).includes('observation-layer-incomplete'));
  });

  it('reads sibling differentials in the one-line and multi-line forms', async () => {
    const ctx = fakeContext({ links: { '../ch14/14-1.md': 'ms.section.14.1' } });
    const body = await compile(
      section(
        'Siblings',
        [
          '**MQA / GQA** — [§14.1](../ch14/14-1.md)',
          'Why it exists: PAPER-REPORTED (R5.6, abstract): decode is bandwidth-bound. What assumption changed: query heads may share K and V heads. What objective changed: none. What problem it solved: K, V bytes fall by H_q/H_kv. What new failure mode it introduced: reduced capacity at H_kv = 1. Changed primitive: per-head W_K, W_V → shared.',
          '',
          '**Item-level inference — [§2.5](../ch02/02-5.md).** DERIVED: appropriate when observations are independent.',
          '',
          '**BF16** — this section. Why it exists: FP16 range failures.',
          'What assumption changed (relative to FP16): 7 mantissa bits suffice.',
          'New failure mode: small updates are lost.',
          'Changed primitive: mantissa 10 → 7 bits.',
        ].join('\n'),
      ),
      { ctx },
    );
    const siblings = blocksOf(body, 'sibling');
    assert.equal(siblings.length, 2);
    const [mqa, bf16] = siblings;
    assert.equal(mqa?.name, 'MQA / GQA');
    assert.equal(mqa?.anchor, 'sib-mqa-gqa');
    assert.equal(mqa?.target?.type, 'node');
    assert.equal(text(mqa?.differential.objectiveChanged ?? []), 'none.');
    assert.equal(text(mqa?.differential.changedPrimitive ?? []), 'per-head W_K, W_V → shared.');
    assert.equal(bf16?.target, null);
    assert.equal(text(bf16?.differential.newFailureMode ?? []), 'small updates are lost.');
    assert.equal(bf16?.differential.objectiveChanged, null);
    assert.equal(blocksOf(body, 'paragraph').length, 1, 'a bold-led paragraph without fields stays prose');
    assert.ok(codes(body).every((code) => code === 'sibling-missing-field'));
    assert.deepEqual(body.linksTo, ['ms.section.14.1']);
    const strip = body.rail[0]?.instruments[0];
    assert.deepEqual(strip, { kind: 'siblings', anchors: ['sib-mqa-gqa', 'sib-bf16'] });
  });
});

describe('tables, lists, details, rules, raw html', () => {
  it('assigns table roles and the wide flag', async () => {
    const references = '| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |\n|---|---|---|---|---|---|---|---|---|---|\n| P01 | paper | Attention | Vaswani | 2017 | https://arxiv.org/abs/1706.03762 | null | peer-reviewed | 2026-09-20 | §5.2 |';
    const performance = '| Model | Hardware | Precision | Concurrency | TTFT |\n|---|---|---|---|---|\n| m | h | BF16 | 8 | 20 ms |';
    const generic = '| Symbol | Meaning |\n|:--|--:|\n| B | batch |';
    const body = await compile(section('References', `${references}\n\n${performance}\n\n${generic}`));
    const tables = blocksOf(body, 'table');
    assert.deepEqual(
      tables.map((table) => [table.role, table.wide]),
      [
        ['references', true],
        ['performance', false],
        ['generic', false],
      ],
    );
    assert.deepEqual(
      tables[2]?.columns.map((column) => column.align),
      ['left', 'right'],
    );
    const stack = await compile(section('Reference-stack coverage', '| Stack section | Entry | Layer |\n|---|---|---|\n| §4 | vLLM | Inference engine |'));
    assert.equal(onlyBlock(stack, 'table').role, 'stack-coverage');
  });

  it('keeps lists with nested typed content', async () => {
    const body = await compile(section('Implementation', '3. first\n4. second with $x$\n\n---\n\n- [ ] task'));
    const [ordered, tasks] = blocksOf(body, 'list');
    assert.equal(ordered?.ordered, true);
    assert.equal(ordered?.start, 3);
    assert.equal(ordered?.items.length, 2);
    assert.equal(tasks?.items[0]?.checked, false);
    assert.equal(blocksOf(body, 'rule').length, 1);
  });

  it('turns both <details> forms into expansions with the right variant', async () => {
    const body = await compile(
      section(
        'Mechanism',
        [
          '<details><summary>Derivation of the causal-mask halving</summary>',
          'For query position $i$, the mask admits keys j ≤ i. MATHEMATICALLY-DERIVED.',
          '</details>',
          '',
          '<details><summary>Why does GQA reduce memory?</summary>',
          '',
          'Because K and V are shared.',
          '',
          '```python',
          'x = 1',
          '```',
          '',
          '</details>',
          '',
          'After.',
        ].join('\n'),
      ),
    );
    const [derivation, expansion] = blocksOf(body, 'expansion');
    assert.equal(derivation?.variant, 'derivation');
    assert.equal(text(derivation?.summary ?? []), 'Derivation of the causal-mask halving');
    assert.deepEqual(
      derivation?.blocks.map((block) => block.kind),
      ['paragraph'],
    );
    assert.equal(expansion?.variant, 'expansion');
    assert.deepEqual(
      expansion?.blocks.map((block) => block.kind),
      ['paragraph', 'code'],
    );
    assert.deepEqual(
      body.regions[0]?.blocks.map((block) => block.kind),
      ['expansion', 'expansion', 'paragraph'],
    );
    assert.deepEqual(codes(body), []);
  });

  it('keeps flow-level raw html as escaped text with a diagnostic and drops comments', async () => {
    const body = await compile(section('Intuition', '<div class="note">Hi</div>\n\n<!-- author note -->\n\nText.'));
    const paragraphs = blocksOf(body, 'paragraph').map((paragraph) => text(paragraph.content));
    assert.deepEqual(paragraphs, ['<div class="note">Hi</div>', 'Text.']);
    assert.deepEqual(codes(body), ['raw-html-dropped', 'raw-html-dropped']);
  });
});
