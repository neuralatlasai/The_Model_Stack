---
id: ms.section.4.3
entity_type: section
title: Code and structured sequences
short_title: FIM and structured targets
volume: 1
part: 1
chapter: 4
section: 4.3
slug: 04-3-code-and-structured-sequences
parent: ms.chapter.4
prev_sibling: ms.section.4.2
next_sibling: ms.section.4.4
children: []
prerequisites: [ms.section.4.1, ms.section.4.2]
downstream: [ms.section.10.5, ms.section.37.4, ms.section.19.1, ms.section.31.2]
related: [ms.section.42.3]
siblings_by_mechanism: [ms.section.4.1, ms.section.4.2, ms.section.4.5]
relations:
  - {type: variant_of, target: concept.likelihood-objective}
  - {type: supported_by, target: paper.R4.5}
axes: {lifecycle: [pretraining, evaluation], mechanism: [objective, sequence_rearrangement, execution_grounding], feedback_setting: [verifiable_reward], modality: [code, text]}
papers: []
implementations: [impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 4.3 Code and structured sequences

## Scope

Fill-in-the-middle training changes which document continuations a causal language model learns by rearranging prefix, middle, and suffix spans before applying the autoregressive loss. Prefix-suffix-middle and suffix-prefix-middle layouts differ in delimiter placement and adjacency; real tokenization can also change the sequence at a split boundary. For code and other structured sequences, likelihood measures agreement with serialized targets, while execution-based evaluation measures success under a specified test environment. This section separates the data transformation, token alignment, sampling protocol, and execution criterion. (PAPER-REPORTED; R4.5 sections3-4 and AppendixD; R4.10 section3; R4.12 AppendixE.)

Boundaries: tokenizer and serialisation contracts are owned by [§10.5](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-5-tool-and-multimodal-interfaces.md); constrained decoding by [§37.4](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-4-structured-generation.md).

## Why this exists

What failed before was that a left-to-right model could not condition on a suffix, while the dominant code-editing workload — completing inside an existing file — has one. The bottleneck was architectural: encoder–decoder span corruption (§4.2) supplies suffix conditioning but costs a second parameter stack and forbids single-stack streaming generation. The constraint that became dominant was that the objective had to stay causal so that one model, one KV cache, and one sampler could serve both completion and infilling. What changed was the recognition that the *data*, not the model, can be rearranged: move the middle to the end, mark the boundaries with sentinels, and the ordinary causal loss trains suffix-conditioned generation. A parallel shift happened in evaluation: for code, matching reference text is the wrong target, because equivalent programs differ textually; the target became execution.

## Intuition

Physically, FIM costs nothing at the backbone: the transformed document has the same token count plus three sentinels and an end-of-text marker, and the loss is the same causal cross-entropy over the same number of positions (DERIVED). What it buys is a conditioning pattern — prefix and suffix visible before the middle is generated — without any bidirectional attention. Heuristically one may say the model "learns to look ahead"; the mechanism is only that the suffix now sits *before* the middle in the causal order. For execution grounding the physical fact is different: a unit-test verdict is a bit obtained by running a program, so the target is produced by an external process with its own latency and failure modes, not by a lookup in the corpus.

## Formulation

Let a document x of length T be split at character level into prefix, middle, suffix segments; Enc(·) denotes tokenisation of a character span; ⟨PRE⟩, ⟨SUF⟩, ⟨MID⟩, ⟨EOT⟩ are reserved token ids.

> **Definition — Fill-in-the-middle (PSM / SPM).** The transformation of a document into a rearranged sequence in which the middle segment appears last, preceded by prefix and suffix delimited by sentinels, so that a causal model trained with Eq. N.2 on the rearranged sequence learns p_θ(middle | prefix, suffix). PSM orders the visible segments prefix-then-suffix; SPM orders them suffix-then-prefix.

$$
x^{\text{PSM}} = \langle\text{PRE}\rangle \circ \text{Enc}(\text{prefix}) \circ \langle\text{SUF}\rangle \circ \text{Enc}(\text{suffix}) \circ \langle\text{MID}\rangle \circ \text{Enc}(\text{middle}) \circ \langle\text{EOT}\rangle
$$
*(Eq. 4.7)* where ∘ = concatenation, Enc = tokeniser, and ⟨EOT⟩ marks that the middle has connected to the suffix.

```figure
id: fig-4.15
kind: matrix
title: Causal mask over the PSM-rearranged audit sequence
caption: >-
  The mask is the plain causal mask of §4.1; only the order of the tokens
  changed. The highlighted row is ⟨MID⟩ at slot 9: it predicts the first
  middle token, a, from a state that has already read the prefix and the
  whole suffix. That is suffix conditioning with no bidirectional attention,
  with explicitly counted delimiter and tokenization overhead.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.7", R4.5]
alt: >-
  Sixteen by sixteen causal grid for the verification FIM row in PSM order:
  PRE, def, ▁add, (, SUF, ▁return, ▁a, +, ▁b, MID, a, comma, ▁b, ), colon,
  EOT. Cells on and below the diagonal are admitted, 136 of 256. Row 9, the
  MID sentinel, is highlighted across columns 0 to 9: it sees the prefix
  (def ▁add parenthesis) and the suffix (▁return ▁a + ▁b) before the middle
  (a, comma, ▁b, ), colon) is generated. Loss is on all 16 slots under R4.5's
  choice, or on the 6 slots from a to EOT under the middle-only variant.
spec:
  rows: 16
  cols: 16
  pattern: causal
  rowLabel: "slot of the PSM sequence (query)"
  colLabel: "slot visible to it"
  rowTicks: ["PRE", "def", "▁add", "(", "SUF", "▁return", "▁a", "+", "▁b", "MID", "a", ",", "▁b", ")", ":", "EOT"]
  colTicks: ["PRE", "def", "▁add", "(", "SUF", "▁return", "▁a", "+", "▁b", "MID", "a", ",", "▁b", ")", ":", "EOT"]
  highlight:
    - { row: 9, col: 0 }
    - { row: 9, col: 1 }
    - { row: 9, col: 2 }
    - { row: 9, col: 3 }
    - { row: 9, col: 4 }
    - { row: 9, col: 5 }
    - { row: 9, col: 6 }
    - { row: 9, col: 7 }
    - { row: 9, col: 8 }
    - { row: 9, col: 9 }
  legend: "causal over PSM order: 136 of 256 pairs; row MID sees prefix and suffix before the middle"
```

The FIM loss on the rearranged sequence is Eq. N.2 with m_t = 1 on every position of x^{PSM} (the paper's choice, see Mechanism), or with m_t = 1 only on the ⟨MID⟩-to-⟨EOT⟩ segment (a ledger variant). The target-length ratio of §4.2 is ρ = 1 in the first case and ρ = |middle|/T in the second (MATHEMATICALLY-DERIVED).

```figure
id: fig-4.16
kind: stat-panel
title: FIM token accounting on the audit split
caption: >-
  The audit split (prefix 3, middle 5, suffix 4 tokens) under Eq. 4.7. Two
  middle-only ratios are shown on purpose: this paragraph's |middle|/T counts
  document tokens, while the §2.1 table counts slots of the rearranged
  sequence and includes EOT. Either way, keeping loss on all sections is what
  holds ρ at 1. The rate rows follow the reported transform rates.
placement: rail
anchor: formulation
evidence: PAPER-REPORTED
source: [R4.5, R4.12, "DERIVED:eq-4.7"]
alt: >-
  Instrument panel for FIM on the verification split: prefix 3, middle 5 and
  suffix 4 tokens, 12 document tokens, plus 4 sentinel tokens (PRE, SUF, MID,
  EOT) for a rearranged length of 16. With loss on all sections (R4.5) ρ = 1.
  With middle-only loss, |middle|/T = 5/12 = 0.417 by this section's formula,
  or 6/16 = 0.375 in the audit table, which counts EOT and the sentinels. At
  R4.5's 50% transform rate half of the documents are rearranged and the
  expected overhead is 2 tokens per document in this toy comparison without a baseline EOT; at Code Llama's 0.9 rate it is
  3.6 tokens per document, and at the illustrative rate 0.25 it is 1.
spec:
  header: "FIM · AUDIT SPLIT 3 / 5 / 4 · PSM"
  variables: { np: 3, nm: 5, ns: 4, r: 0.5 }
  rows:
    - { key: "prefix / middle / suffix tokens", value: "3 / 5 / 4" }
    - { key: "document tokens T", formula: "np + nm + ns", format: integer }
    - { key: "sentinels PRE, SUF, MID, EOT", value: "+4" }
    - { key: "rearranged length |z|", formula: "np + nm + ns + 4", format: integer }
    - { key: "ρ, loss on all sections (R4.5)", value: "1" }
    - { key: "ρ middle-only, |middle|/T", formula: "nm/(np + nm + ns)", format: fixed3 }
    - { key: "middle-only Σm/|z|, §2.1 table", formula: "(nm + 1)/(np + nm + ns + 4)", format: fixed3 }
    - { key: "documents transformed, rate r", formula: "r", format: percent }
    - { key: "expected toy delimiters/doc", formula: "4*r", format: fixed2, note: "4 per transformed document" }
states:
  - { anchor: formulation, label: "audit, R4.5 rate 0.5", variables: { r: 0.5 }, highlight: ["rearranged length |z|", "ρ middle-only, |middle|/T", "middle-only Σm/|z|, §2.1 table"], note: "The audit's 12 tokens become 16. Loss on all sections keeps ρ = 1; a middle-only mask keeps 5 of 12 document tokens, or 6 of 16 slots once EOT is counted." }
  - { anchor: mechanism, label: "Code Llama rate 0.9", variables: { r: 0.9 }, highlight: ["documents transformed, rate r", "expected toy delimiters/doc"], note: "R4.12 transforms 90% of documents, half in PSM and half in SPM (45% each), for 3.6 toy delimiter tokens/doc on average and no extra parameters." }
  - { anchor: experimental-design, label: "illustrative transform rate r = 0.25", variables: { r: 0.25 }, highlight: ["documents transformed, rate r", "ρ middle-only, |middle|/T"], note: "This illustrative rate changes the fraction transformed, not this selected split; the middle-only mask excludes 7 of 12 ordinary document targets. No training result is implied." }
```

> **Definition — Execution-grounded target.** A training or evaluation target whose value is determined by executing the model's output (compiling, running tests, calling a checker) rather than by comparing it with reference text.

For n samples per problem of which c pass the tests, the unbiased estimator of pass@k is

$$
\widehat{\text{pass@}k} = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}
$$
*(Eq. 4.8)* where n = samples drawn, c = samples passing all tests, k ≤ n (PAPER-REPORTED · R4.10).

```figure
id: fig-4.17
kind: calculator
title: Unbiased pass@k for one problem
caption: >-
  The per-problem term of Eq. 4.8, computed as the product
  ∏(n − c − j)/(n − j) over j < k, the numerically stable form: it is the
  share of size-k subsets of the n samples that contain no passing program.
  The chapter's averages over problems take the mean of this term. Counts are
  illustrative, not a reported evaluation; this instrument allows k ≤ 20.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.8", R4.10]
alt: >-
  Calculator for the per-problem term of Eq. 4.8. Inputs: samples drawn n
  (20, 50, 100 or 200), passing samples c from 0 to 20, and k from 1 to 20.
  Outputs: the share of size-k subsets with no passing sample, built up over
  the first 8, 16 and 20 factors of the product of (n − c − j)/(n − j); the
  estimate pass@k = 1 minus that share; and c/n for reference. At the defaults
  n = 20, c = 2, k = 5 the no-pass share is C(18,5)/C(20,5) = 0.553 and
  pass@5 = 0.447. At k = 1 the estimate equals c/n = 0.100. At k = 19 > n − c
  every subset contains a pass and the estimate is 1. With c = 6 of 20,
  pass@5 = 0.871.
spec:
  tex: >-
    \widehat{\text{pass@}k} = 1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}
    = 1 - \prod_{j=0}^{k-1}\frac{n-c-j}{n-j}
  equation: "4.8"
  inputs:
    - { symbol: n, label: "samples drawn per problem, n", default: 20, min: 20, max: 200, options: [20, 50, 100, 200], format: integer }
    - { symbol: c, label: "samples passing all tests, c", default: 2, min: 0, max: 20, step: 1, format: integer }
    - { symbol: k, label: "k (instrument limit k ≤ 20)", default: 5, min: 1, max: 20, step: 1, format: integer }
  outputs:
    - { symbol: Q8, label: "no-pass share of min(k, 8)-subsets", formula: "max(0,n-c)/n*(1-clamp(k-1,0,1)*(1-max(0,n-c-1)/(n-1)))*(1-clamp(k-2,0,1)*(1-max(0,n-c-2)/(n-2)))*(1-clamp(k-3,0,1)*(1-max(0,n-c-3)/(n-3)))*(1-clamp(k-4,0,1)*(1-max(0,n-c-4)/(n-4)))*(1-clamp(k-5,0,1)*(1-max(0,n-c-5)/(n-5)))*(1-clamp(k-6,0,1)*(1-max(0,n-c-6)/(n-6)))*(1-clamp(k-7,0,1)*(1-max(0,n-c-7)/(n-7)))", format: fixed3 }
    - { symbol: Q16, label: "no-pass share of min(k, 16)-subsets", formula: "Q8*(1-clamp(k-8,0,1)*(1-max(0,n-c-8)/(n-8)))*(1-clamp(k-9,0,1)*(1-max(0,n-c-9)/(n-9)))*(1-clamp(k-10,0,1)*(1-max(0,n-c-10)/(n-10)))*(1-clamp(k-11,0,1)*(1-max(0,n-c-11)/(n-11)))*(1-clamp(k-12,0,1)*(1-max(0,n-c-12)/(n-12)))*(1-clamp(k-13,0,1)*(1-max(0,n-c-13)/(n-13)))*(1-clamp(k-14,0,1)*(1-max(0,n-c-14)/(n-14)))*(1-clamp(k-15,0,1)*(1-max(0,n-c-15)/(n-15)))", format: fixed3 }
    - { symbol: Q, label: "C(n−c, k)/C(n, k), no-pass share of k-subsets", formula: "Q16*(1-clamp(k-16,0,1)*(1-max(0,n-c-16)/(n-16)))*(1-clamp(k-17,0,1)*(1-max(0,n-c-17)/(n-17)))*(1-clamp(k-18,0,1)*(1-max(0,n-c-18)/(n-18)))*(1-clamp(k-19,0,1)*(1-max(0,n-c-19)/(n-19)))", format: fixed3 }
    - { symbol: P, label: "pass@k for this problem, Eq. 4.8", formula: "1 - Q", format: fixed3, emphasis: true }
    - { symbol: P1, label: "c/n, the k = 1 value", formula: "c/n", format: fixed3 }
  presets:
    - { label: "n = 200, c = 20, k = 10", values: { n: 200, c: 20, k: 10 } }
states:
  - { anchor: formulation, label: "k = 1", variables: { n: 20, c: 2, k: 1 }, highlight: [P, P1], note: "At k = 1 the estimator is exactly c/n: 2 passing samples out of 20 give pass@1 = 0.100." }
  - { anchor: mechanism, label: "k = 5 from the same 20", variables: { n: 20, c: 2, k: 5 }, highlight: [Q, P], note: "The same 20 samples scored at k = 5: 55.3% of the 5-subsets hold no passing program, so pass@5 = 0.447, with no new sampling as long as k ≤ n." }
  - { anchor: implementation, label: "k > n − c", variables: { n: 20, c: 2, k: 19 }, highlight: [Q, P], note: "Once k exceeds n − c = 18 every k-subset holds a pass and the estimate is exactly 1; k > n is undefined (Systems trace), which is why n and k travel together." }
  - { anchor: failure-modes, label: "leaked tests, c = 6", variables: { n: 20, c: 6, k: 5 }, highlight: [P, P1], note: "Test-suite leakage raises c, not capability: c from 2 to 6 of 20 lifts pass@5 from 0.447 to 0.871, the symptom of the leakage failure mode. Illustrative counts." }
```

## Mechanism

### Methodology

FIM first samples a document or context fragment for transformation, chooses two character boundaries, and constructs prefix, middle, and suffix. The transformed order changes which original-document information precedes a target under an ordinary causal model. It retains the cross-entropy operator while changing the training distribution and its expected objective. The original FIM study scores all three segments; a middle-only mask would be a different supervision choice ([R4.5](references.md#r45), section 3 and Appendix C, PAPER-REPORTED).

The inspected study's compatible SPM layout is PRE + SUF + Enc(suffix) + MID + Enc(prefix) + Enc(middle) + EOT. This differs from the superficially natural SUF-suffix-PRE-prefix-MID-middle arrangement. The sentinel positions are part of the method, not cosmetic formatting (R4.5 Appendix D, PAPER-REPORTED). Code Llama follows compatible PSM/SPM formats, transforms eligible documents at its disclosed rate, and jointly tokenizes prefix and middle for SPM to avoid a split-subtoken training boundary (R4.12 section 2.3 and Appendix E, PAPER-REPORTED). Consequently a random character split that lands inside a token can be out of distribution for that particular SPM recipe.

For an editor, SPM places a fixed suffix before an expanding prefix, allowing reuse of the unchanged initial token-prefix cache. This benefit requires exact equality of the already cached token IDs, positions, and conditioning state. Appending characters can retokenize the final prefix token, so reuse ends at the longest unchanged token prefix, not necessarily the previous character boundary. A changed suffix invalidates later prefix cache state. Cache savings are thus workload- and tokenizer-dependent (DERIVED).

InCoder's causal masking replaces several spans in place with distinct sentinels and appends their contents in sentinel-marked blocks. This construction permits multiple missing regions while retaining a causal decoder (R4.9 method, PAPER-REPORTED). Serialization must preserve recoverable boundaries, escape reserved markers when they are data, and record whether the target is one span, several spans, or the full transformed stream. Syntax-aware span sampling and constrained decoding are separate interventions; neither follows automatically from FIM.

Execution-grounded evaluation introduces an external verifier. A candidate passing HumanEval's unit tests is correct under that test suite, not proven correct for every possible input ([R4.10](references.md#r410), section 3). The pipeline must preserve the prompt, generated text, extracted program, environment, timeout, tests, and result. Parse failures, execution failures, and timeouts are distinct outcomes. Text overlap does not determine those outcomes, so likelihood, exact match, and test pass rates require separate reporting.

To derive Eq. 4.8, condition on n candidates with c successes and choose k distinct candidates uniformly. Of the binomial(n,k) subsets, binomial(n-c,k) contain no success. Subtracting their ratio from one gives the conditional probability of at least one observed success. Averaging this estimator over independent samples from a fixed candidate distribution estimates that distribution's pass@k; changing temperature, filtering, or reranking changes the estimand (MATHEMATICALLY-DERIVED; estimator attributed to R4.10).

Cost boundary: transformed token count is |Enc(prefix)|+|Enc(middle)|+|Enc(suffix)|+4 in the written PSM convention. Relative to Enc(document)+EOT, the difference is three extra delimiters plus any retokenization change. It is not universally four extra tokens. No new backbone parameters are required beyond added vocabulary embeddings/output rows if new IDs extend the vocabulary. Execution adds sample generation, test runtime, process isolation, and resource limits; latency and energy require measured workload distributions (DERIVED).

```figure
id: fig-4.18
kind: compare
title: Four ways to give a generated span its right-hand context
caption: >-
  The first three constructions use a causal decoder with different
  transformed data and target policies; encoder-decoder span corruption
  uses a separate bidirectional source. PSM and SPM differ in serialization,
  boundary behavior, and cache reuse when the prefix changes. All target
  policies are part of the objective, despite a shared CE primitive.
placement: wide
evidence: PAPER-REPORTED
source: [R4.5, R4.12, R4.9, P02]
concepts: [ms.section.4.3, ms.section.4.2]
alt: >-
  Comparison of FIM in PSM order, FIM in SPM order, causal masking, and
  encoder–decoder span corruption. Sequence: PSM is PRE, prefix, SUF, suffix,
  MID, middle, EOT; SPM is PRE, SUF, suffix, MID, prefix, middle, EOT; causal masking puts sentinels in the body and appends the
  spans; span corruption sends corrupted text to an encoder and the
  sentinel-delimited spans to a decoder. Mask: causal for the first three;
  bidirectional encoder plus causal decoder with cross-attention for the
  last. Loss: all sections for FIM, middle-only as a variant; appended spans
  for causal masking, body NOT-DISCLOSED; all of y for span corruption. Extra
  tokens: the toy FIM layout contains four markers, with retokenization
  affecting its overhead relative to ordinary completion. Added vocabulary
  IDs need embedding/output rows; a second stack is architecture dependent. An appended keystroke
  forces suffix re-prefill under PSM and changes only the tail under SPM.
  Reported rates: 50% (R4.5); 0.9 split evenly between PSM and SPM (R4.12);
  15% corruption (P02).
spec:
  axis: >-
    How the right-hand context reaches the generated span, what the layout
    costs in tokens and parameters, and what an edit invalidates at inference
  columns:
    - { id: psm, label: "FIM, PSM (R4.5)", node: ms.section.4.3 }
    - { id: spm, label: "FIM, SPM (R4.5; R4.12)", node: ms.section.4.3 }
    - { id: cm, label: "Causal masking (R4.9)", node: ms.section.4.3 }
    - { id: span, label: "Span corruption, enc–dec (P02)", node: ms.section.4.2 }
  rows:
    - { dimension: "sequence construction", values: { psm: "PRE∘prefix∘SUF∘suffix∘MID∘middle∘EOT (Eq. 4.7)", spm: "suffix, then prefix, then middle; PRE+SUF+suffix+MID+prefix+middle+EOT (R4.5 Appendix D)", cm: "sentinels replace spans in the body; spans appended at the end", span: "x̃ with sentinels to the encoder; s_1∘span_1∘…∘s_{K+1} to the decoder" } }
    - { dimension: "attention mask", values: { psm: "causal", spm: "causal", cm: "causal", span: "bidirectional encoder; causal decoder + cross-attention" } }
    - { dimension: "context seen when the span is generated", values: { psm: "prefix and suffix", spm: "suffix and prefix; prefix contiguous with the middle", cm: "the whole body, with sentinels at the gaps", span: "the whole corrupted input, both directions" } }
    - { dimension: "loss sections", values: { psm: "all three (R4.5); middle-only is a ledger variant", spm: "as PSM; R4.12 does not state its choice", cm: "appended spans; body treatment NOT-DISCLOSED", span: "all of y" } }
    - { dimension: "toy delimiters/doc", values: { psm: "+4: PRE, SUF, MID, EOT", spm: "+4", cm: "one sentinel per span in the body and one per appended span", span: "K sentinels in x̃, K + 1 in y" } }
    - { dimension: "extra parameters", values: { psm: "new embedding/output rows if vocabulary extends", spm: "same vocabulary condition", cm: "same vocabulary condition", span: "encoder/decoder sharing and cross-attention determine parameters" } }
    - { dimension: "a keystroke appended to the prefix", values: { psm: "changes tokens before the suffix: suffix K/V re-prefilled", spm: "only the tail changes; suffix K/V reused", cm: "not analysed in §4.3", span: "encoder input changes: re-encode (§4.2 Limitations)" } }
    - { dimension: "reported rate", values: { psm: "50% of documents (R4.5 main models)", spm: "R4.12: 0.9 of documents, half PSM, half SPM", cm: "not stated here", span: "15% of tokens (P02 baseline)" } }
```

```figure
id: fig-4.19
kind: chart
title: pass@k against k at one empirical pass rate, four sample counts
caption: >-
  Every curve has the same observed rate c/n = 0.1, so all start at
  pass@1 = 0.10, yet they separate as k grows: at k = 10 the estimate is 1.00
  from 10 samples and 0.67 from 100. The estimate is not a function of c/n
  alone; it reaches the plug-in value 1 − (1 − c/n)^k only as n → ∞. Under iid sampling from a fixed candidate law, every valid n≥k estimates
  the same population pass@k; n affects precision and the conditional
  finite-sample value, so it must be disclosed. Illustrative
  counts, not a reported evaluation.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-4.8", R4.10]
alt: >-
  Line chart of the per-problem pass@k estimate of Eq. 4.8 against k from 1
  to 20, at a fixed empirical pass rate c/n = 0.1. For n = 10, c = 1 the
  estimate is k/10, reaching 1.00 at k = 10 (k cannot exceed n). For n = 20,
  c = 2: 0.447 at k = 5, 0.763 at k = 10, 1.00 at k = 20. For n = 50, c = 5:
  0.423, 0.689, 0.933. For n = 100, c = 10: 0.416, 0.670, 0.905. The dashed
  n → ∞ limit 1 − 0.9^k gives 0.410, 0.651 and 0.878 and lies below every
  finite-n curve. All curves equal 0.10 at k = 1.
spec:
  type: line
  x: { label: "k, samples scored per problem", scale: linear, format: integer, domain: [1, 20] }
  y: { label: "pass@k, one problem", scale: linear, format: fixed2, domain: [0, 1] }
  series:
    - { id: n10, label: "n = 10, c = 1", formula: "1-max(0,10-x)/10", sample: { from: 1, to: 10, count: 10 } }
    - { id: n20, label: "n = 20, c = 2", formula: "1-max(0,20-x)/20*max(0,20-x-1)/19", sample: { from: 1, to: 20, count: 20 } }
    - { id: n50, label: "n = 50, c = 5", formula: "1-max(0,50-x)/50*max(0,50-x-1)/49*max(0,50-x-2)/48*max(0,50-x-3)/47*max(0,50-x-4)/46", sample: { from: 1, to: 20, count: 20 } }
    - { id: n100, label: "n = 100, c = 10", formula: "1-max(0,100-x)/100*max(0,100-x-1)/99*max(0,100-x-2)/98*max(0,100-x-3)/97*max(0,100-x-4)/96*max(0,100-x-5)/95*max(0,100-x-6)/94*max(0,100-x-7)/93*max(0,100-x-8)/92*max(0,100-x-9)/91", sample: { from: 1, to: 20, count: 20 }, emphasis: true }
    - { id: lim, label: "n → ∞ limit, 1 − (1 − c/n)^k", formula: "1-0.9^x", sample: { from: 1, to: 20, count: 20 }, dashed: true }
  annotations:
    - { x: 1, label: "pass@1 = c/n = 0.10 for every n" }
    - { x: 10, label: "n = 10: 1.00; n = 100: 0.67" }
    - { x: 20, label: "n = 20: 1.00; n = 100: 0.90; limit 0.88" }
```

## Algorithm

```text
Algorithm 4.3 — Character-level PSM data construction
INPUT string s, transform probability r, mode in {all_segments,middle_only},
      tokenizer Enc, atomic reserved IDs PRE/SUF/MID/EOT, RNG
OUTPUT transformed IDs, aligned target mask, mode, split boundaries
1 if uniform(RNG)>=r: return Enc(s)+[EOT], ordinary causal target mask
2 draw a,b from the declared boundary distribution on 0...len(s); order a<=b
3 prefix,middle,suffix <- s[:a],s[a:b],s[b:]
4 p,m,q <- Enc(prefix),Enc(middle),Enc(suffix)
5 z <- [PRE]+p+[SUF]+q+[MID]+m+[EOT]
6 score all z targets for all_segments; for middle_only score middle and EOT targets
7 apply the same BOS/one-position target shift as Algorithm 4.1
INVARIANTS reconstruction in original segment order equals s when Enc is lossless;
           |z|=|p|+|m|+|q|+4; no assertion that |p|+|m|+|q|=|Enc(s)|
```

String slicing and assembly are O(|s|) excluding tokenizer complexity; tokenization cost depends on the selected implementation and must not be assumed linear for every tokenizer. For context-level transformation, preserve partial-document and Unicode decoding rules before transforming, then apply the declared length trimming/padding policy (R4.5 Appendix C). The middle-only option is a declared analytical variant, not an attributed recipe.

For pass@k, require 1<=k<=n and 0<=c<=n. If n-c<k, return one. Otherwise compute 1-product(j=0,...,k-1)[(n-c-j)/(n-j)], preferably with log1p/expm1 for stability. This needs O(k) arithmetic and O(1) auxiliary storage without large binomial integers (MATHEMATICALLY-DERIVED). Average per-problem estimates over the declared problem weighting.

```figure
id: fig-4.20
kind: diagram
title: The FIM transform of Algorithm 4.3 in the data pipeline
caption: >-
  String slicing and assembly run in the data pipeline; tokenizer complexity
  is separately specified. The accelerator evaluates the transformed causal
  objective. The heavy path
  is the transformed branch. The two places this pipeline can break the
  objective are the tokeniser boundary at the split point and the loss-mask
  choice, and neither is recoverable from a checkpoint.
placement: inline
evidence: PAPER-REPORTED
source: [R4.5, R4.12, "DERIVED:eq-4.7"]
alt: >-
  Diagram of Algorithm 4.3. A document or context chunk of n characters goes
  to a branch on a uniform draw against the FIM rate r (0.5 in R4.5, 0.9 in
  R4.12). With probability 1 − r the document is tokenised unchanged and ends
  with EOT, all positions scored. With probability r, two uniform character
  positions a ≤ b split it into prefix, middle and suffix; each segment is
  tokenised, with a split-subtoken risk at the boundary that R4.12 avoids in
  SPM by encoding prefix and middle together; the segments are assembled in
  PSM order with PRE, SUF, MID and EOT, four delimiters in the toy convention; a loss-mask branch
  chooses all sections (R4.5) or the middle only. Both branches feed the
  unchanged causal cross-entropy of Eq. N.2 on the accelerator. The
  transform-and-mask steps are grouped as the data pipeline, O(n) per
  document; context-level FIM applies them after chunking.
spec:
  direction: TB
  nodes:
    - { id: doc, kind: dataset, label: "document, or chunk for context-level FIM", sub: "string s of n characters" }
    - { id: rate, kind: branch, label: "uniform draw below the FIM rate r?", sub: "r = 0.5 (R4.5); 0.9 (R4.12)", group: pipe }
    - { id: plain, kind: tensor, label: "Enc(s) ∘ EOT, untransformed", sub: "m = 1 on every position", group: pipe }
    - { id: split, kind: process, label: "two uniform character positions a ≤ b", sub: "character-level split (R4.5)", group: pipe }
    - { id: segs, kind: tensor, label: "prefix, middle, suffix", sub: "s[0:a], s[a:b], s[b:n]", group: pipe }
    - { id: enc, kind: process, label: "tokenise each segment", sub: "split-subtoken risk at a", group: pipe }
    - { id: psm, kind: tensor, label: "PRE∘prefix∘SUF∘suffix∘MID∘middle∘EOT", sub: "|z| = document tokens + 4", group: pipe }
    - { id: mask, kind: branch, label: "loss mask", sub: "all sections (R4.5) or middle only", group: pipe }
    - { id: ce, kind: objective, label: "causal cross-entropy, Eq. N.2", sub: "unchanged objective" }
    - { id: spmjoin, kind: dependency, label: "SPM: encode prefix + middle together", sub: "R4.12, removes the boundary artefact" }
  edges:
    - { from: doc, to: rate }
    - { from: rate, to: plain, label: "no, probability 1 − r" }
    - { from: rate, to: split, kind: emphasis, label: "yes, probability r" }
    - { from: split, to: segs, kind: emphasis }
    - { from: segs, to: enc, kind: emphasis }
    - { from: enc, to: psm, kind: emphasis, label: "Eq. 4.7" }
    - { from: psm, to: mask, kind: emphasis }
    - { from: mask, to: ce, kind: emphasis }
    - { from: plain, to: ce }
    - { from: spmjoin, to: enc, kind: dependency, label: "SPM variant" }
  groups:
    - { id: pipe, label: "data pipeline; slicing O(|s|), tokenizer cost separate" }
```

## Implementation

```text
PSM prompt: PRE -> prefix IDs -> SUF -> suffix IDs -> MID -> prefill -> sample middle -> EOT
SPM prompt: PRE -> SUF -> suffix IDs -> MID -> prefix IDs -> prefill -> sample continuation -> EOT
verifier: generated text -> declared extraction -> isolated test environment -> outcome record
```

Reserved markers must be atomic IDs in the selected tokenizer. Confirm tokenizer normalization and leading-space behavior for each segment; decoded-string equality alone does not establish equality of token IDs or cache state. At inference the generated span must stop under the model's trained EOT convention or an explicit budget. Stopping because generated text happens to match the suffix can truncate a valid middle and is not an equivalent termination rule (DERIVED).

The official HumanEval repository describes the security boundary for executing generated code ([R4.30](references.md#r430), README, OFFICIAL-DOCUMENTATION). The evaluation environment must bound time, memory, process access, and external effects and record runtime/library versions. No generated code was executed for this chapter. To compare models, hold tests and extraction rules fixed; to compare samplers, hold the checkpoint fixed and record the complete sampling policy.

The decode cost for n candidates is not necessarily n simultaneous KV caches: sequential and batched evaluation have different peak memory and scheduling. Report sample count, concurrency, generated-length distribution, accelerator/runtime configuration, and CPU test execution separately before making a throughput comparison (DERIVED).

## Experimental design

### Reported experiments

The FIM study separates transformation-rate, format, application-stage, and span-selection interventions. Its rate study trains matched-scale models for a stated token budget and compares autoregressive held-out loss with infilling and code-generation evaluations. Its format study trains pure PSM, pure SPM, and joint mixtures, then evaluates both formats. Its context-versus-document study changes whether transformation occurs before or after packing/chunking ([R4.5](references.md#r45), section 4.2-4.5, Tables 1-2 and corresponding figures, PAPER-REPORTED).

These are distinct protocols. Table 1 uses temperature 0.2 and 100 samples per task; context-level comparisons accompanying Figure 7 use 200 samples per task. The study reports deterioration at a fully transformed rate in its ordinary autoregressive loss comparison. Thus its favorable compatibility finding has a measured regime and is not a theorem of distribution preservation.

Code Llama's infilling evaluation distinguishes single-line, multiline, and random-span problems, decoding policy, and PSM/SPM format; Appendix E identifies the split-subtoken mismatch for its SPM recipe (R4.12 section 3.2 and Appendix E, PAPER-REPORTED). HumanEval supplies the per-problem pass@k estimator and demonstrates that text-overlap metrics do not identify execution outcomes (R4.10 section 3). None of these results licenses transferring a pass rate to a new test harness without matching its environment and prompt/decoding protocol.

## Observations

**What the paper claims.** FIM reports infilling gains while preserving ordinary autoregressive performance in its studied mixtures; it also reports effects of format, span boundaries, and transformation stage (PAPER-REPORTED: R4.5 section 4).

**What the evidence shows.** Compatibility depends on transformation rate and task format. Code Llama's SPM boundary issue shows why a segment-order description alone is insufficient to reproduce an infilling distribution (R4.12 Appendix E).

**What we infer.** Tokenization, sentinel placement, scoring masks, and packing stage are methodological variables. Execution metrics additionally depend on a verifier and a candidate distribution; neither is specified by the language-model objective alone (DERIVED).

**What remains unknown.** An undocumented model's FIM mask or sampler is NOT-DISCLOSED. The cited tests do not establish semantic correctness on all program inputs, robustness to arbitrary structured formats, or measured latency for a new editor workload.

## Failure modes

> **Failure mode — Sentinel fragmentation.** *Symptom:* the transformed format no longer matches training. *Cause:* reserved sentinels encode as ordinary multi-token text. *Detection:* verify exact single IDs and round-trip construction. *Mitigation:* preserve the model/tokenizer sentinel contract (DERIVED).

> **Failure mode — Split-subtoken mismatch.** *Symptom:* an infill starts from a partial-token prompt unlike training. *Cause:* different joint/separate encoding at the prefix-middle boundary. *Detection:* compare compatible PSM/SPM training and evaluation token sequences. *Mitigation:* use the source's boundary protocol; no universal token-boundary remedy is implied (R4.12 AppendixE, PAPER-REPORTED).

> **Failure mode — Nonterminating middle.** *Symptom:* the EOT stop condition is not met within budget. *Cause:* multiple possible modeling/format errors; length alone does not identify one. *Detection:* record EOT emission and budget termination separately. *Mitigation:* preserve trained EOT semantics and impose a declared budget; suffix-text matching is not equivalent (DERIVED).

> **Failure mode — Verifier leakage or incompleteness.** *Symptom:* apparent test success fails on independent cases. *Cause:* contaminated tasks, weak tests, or extraction/environment drift. *Detection:* audit overlaps and independent held-out tests. *Mitigation:* freeze the harness and report its scope; post-cutoff dates alone do not prove absence of leakage (DERIVED).

## Siblings

Ordinary causal completion preserves document order. PSM/SPM infilling transforms that order and conditions the missing span on both sides under a declared sentinel format. Encoder-decoder span corruption instead presents a corrupted bidirectional source and generates sentinel-delimited missing spans. Its target/input ratio can be below or above one depending on corruption and sentinel counts, and its encoder/cross-attention costs remain distinct [§4.2](04-2-alternative-objectives.md).

Multi-token prediction adds future-offset losses to shared representations rather than rearranging the document. Its auxiliary heads change training work and gradient weights, while a later draft/verification procedure determines any inference benefit [§4.4](04-4-auxiliary-prediction.md). Neither multiple target heads nor syntax-aware spans alone establishes execution correctness.



## Extensions

### Improvements

Context-level FIM addresses loss of complete infilling examples during document packing, and joint PSM/SPM training supplies both inference formats in the source study (R4.5 section 3.1-3.2 and section 4.3-4.4, PAPER-REPORTED). These changes modify data construction rather than the cross-entropy operator.

Character-level boundaries expose partial-token infills; joint encoding in Code Llama's SPM recipe instead avoids such splits at one boundary and creates a corresponding evaluation constraint (R4.12 section 2.3 and Appendix E, PAPER-REPORTED). The improvement has a trade-off, which must stay visible in the ledger.

Execution-grounded feedback can be used for data filtering or later optimization, but the objective then depends on how verification outcomes enter training. That methodological transition is taught in the post-training chapters; a test pass rate by itself does not change a pretraining loss.

## Limitations

Infilling likelihood is conditional on a particular transformed format and tokenizer. Increasing transformation rate need not monotonically improve infilling loss, and the cited FIM compatibility result is not distribution invariance. The execution estimator is meaningful only for its declared candidate distribution and test environment; weak tests limit the property being measured.

The chapter does not execute code or measure editing latency. Several released systems do not disclose their complete FIM scoring masks; those gaps remain NOT-DISCLOSED rather than being filled by another model's recipe.

## Reproducibility

Preserve tokenizer/checkpoint, exact sentinels, split distribution, segment encoding rules, transformation rate and stage, post-transform length policy, target mask, and stop policy. Evaluation records additionally require sample count, temperature and truncation, candidate extraction, test suite revision, environment, and resource limits. Keep all outcomes for unbiased pass@k accounting; silently discarding failed parses or timeouts changes the sample distribution. No model or execution harness was run for this chapter; proposed fixture checks remain in [verification.md](verification.md).

## References

R4.5, R4.9, R4.10, R4.11, R4.12, R4.30; Eq. N.2.
