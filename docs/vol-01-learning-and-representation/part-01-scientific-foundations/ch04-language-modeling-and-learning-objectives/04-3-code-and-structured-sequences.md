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
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1000
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 4.3 Code and structured sequences

## Scope

Objective: specify fill-in-the-middle (FIM) as a *document rearrangement* applied before the causal objective, distinguish its PSM and SPM layouts, and separate it from the causal-masking variant that moves masked spans to the end; then state what changes when data are syntax-bearing (code, JSON, AST serialisations) and when targets are grounded in execution rather than text. Baseline: the causal row of §4.1. Success: the reader can produce the FIM-transformed token sequence and loss mask for the hand-audited example in [verification.md](verification.md) and can say which parts of "code capability" the likelihood objective does and does not measure. Boundaries: tokenizer and serialisation contracts are owned by [§10.5](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-5-tool-and-multimodal-interfaces.md); constrained decoding by [§37.4](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-4-structured-generation.md).

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
  for 4 extra tokens and no extra parameters.
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
  expected overhead is 2 tokens per document; at Code Llama's 0.9 rate it is
  3.6 tokens per document, and at Experiment 4.3's 0.25 arm it is 1.
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
    - { key: "expected extra tokens per document", formula: "4*r", format: fixed2, note: "4 per transformed document" }
states:
  - { anchor: formulation, label: "audit, R4.5 rate 0.5", variables: { r: 0.5 }, highlight: ["rearranged length |z|", "ρ middle-only, |middle|/T", "middle-only Σm/|z|, §2.1 table"], note: "The audit's 12 tokens become 16. Loss on all sections keeps ρ = 1; a middle-only mask keeps 5 of 12 document tokens, or 6 of 16 slots once EOT is counted." }
  - { anchor: mechanism, label: "Code Llama rate 0.9", variables: { r: 0.9 }, highlight: ["documents transformed, rate r", "expected extra tokens per document"], note: "R4.12 transforms 90% of documents, half in PSM and half in SPM (45% each), for 3.6 extra tokens per document on average and no extra parameters." }
  - { anchor: experimental-design, label: "Exp. 4.3 arm r = 0.25", variables: { r: 0.25 }, highlight: ["documents transformed, rate r", "ρ middle-only, |middle|/T"], note: "Experiment 4.3 sweeps r over {0, 0.25, 0.5, 0.9}; its middle-only arm removes 1 − ρ of the gradient-bearing tokens, 7 of 12 on this split." }
```

> **Definition — Execution-grounded target.** A training or evaluation target whose value is determined by executing the model's output (compiling, running tests, calling a checker) rather than by comparing it with reference text.

For n samples per problem of which c pass the tests, the unbiased estimator of pass@k is

$$
\widehat{\text{pass@}k} = \mathbb{E}\!\left[1 - \frac{\binom{n-c}{k}}{\binom{n}{k}}\right]
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

**FIM (R4.5).** The paper transforms documents so that "the middle span is chosen uniformly at random where the split between prefix, middle, suffix happens at the character level", assembles them in the PSM order of Eq. 4.7, and trains with the ordinary causal loss; it states that "we keep the loss on all three sections prefix, middle, and suffix" (PAPER-REPORTED · R4.5). Its central empirical claim is the "FIM-for-free" property: with a large fraction of documents transformed, "FIM models achieve similar AR test loss as the non-FIM models", and the abstract states that such training "does not harm the original left-to-right generative capability, as measured by perplexity" (PAPER-REPORTED · R4.5). The main models use a 50% FIM rate with ablations at other rates (PAPER-REPORTED · R4.5). The paper distinguishes *document-level* FIM (transform before chunking and packing into contexts) from *context-level* FIM (transform after chunking), and reports the latter performs better because more contexts actually contain an infilling example (PAPER-REPORTED · R4.5).

**SPM.** The SPM layout places the suffix first, then the prefix, then the middle. The stated reason is cache reuse at inference: "appending tokens to the prefix no longer invalidates the keys and values computed in the suffix section", because prefix and middle are now contiguous at the end of the sequence (PAPER-REPORTED · R4.5). The exact sentinel placement in the SPM variant differs between implementations; the segment order is the durable definition and the sentinel layout is recorded as UNVERIFIED in the ledger. Code Llama reports applying the transformation "with a probability of 0.9", "half of the splits in the prefix-suffix-middle (PSM) format and the other half in" SPM, following R4.5's character-level splitting, and notes that "In SPM format, we concatenate the prefix and the middle part before encoding to tokens" to avoid the split-subtoken artefact at the prefix/middle boundary (PAPER-REPORTED · R4.12). Whether Code Llama restricts loss to the middle is not stated (NOT-DISCLOSED · R4.12).

**Causal masking (R4.9).** InCoder's objective instead masks spans in place, replaces them with sentinels, and moves the masked content to the end of the file: "regions of code have been randomly masked and moved to the end of each file, allowing code infilling with bidirectional context" (PAPER-REPORTED · R4.9). In ledger terms it is span corruption executed inside a single causal stack: the sentinel positions in the body are inputs, the appended spans are targets. StarCoder reports "infilling capabilities" among its released features (PAPER-REPORTED · R4.11).

```figure
id: fig-4.18
kind: compare
title: Four ways to give a generated span its right-hand context
caption: >-
  Only the last column changes the objective; the first three keep one
  causal stack and change the sequence. PSM and SPM differ in one row, what an
  appended keystroke invalidates in the KV cache, which is why SPM exists.
  Causal masking reorders the same way as FIM but corrupts the body in place,
  like span corruption inside one stack.
placement: wide
evidence: PAPER-REPORTED
source: [R4.5, R4.12, R4.9, P02]
concepts: [ms.section.4.3, ms.section.4.2]
alt: >-
  Comparison of FIM in PSM order, FIM in SPM order, causal masking, and
  encoder–decoder span corruption. Sequence: PSM is PRE, prefix, SUF, suffix,
  MID, middle, EOT; SPM is suffix, prefix, middle (sentinel layout
  UNVERIFIED); causal masking puts sentinels in the body and appends the
  spans; span corruption sends corrupted text to an encoder and the
  sentinel-delimited spans to a decoder. Mask: causal for the first three;
  bidirectional encoder plus causal decoder with cross-attention for the
  last. Loss: all sections for FIM, middle-only as a variant; appended spans
  for causal masking, body NOT-DISCLOSED; all of y for span corruption. Extra
  tokens: 4 per document for FIM, sentinels per span otherwise. Parameters:
  none, except a second stack for span corruption. An appended keystroke
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
    - { dimension: "sequence construction", values: { psm: "PRE∘prefix∘SUF∘suffix∘MID∘middle∘EOT (Eq. 4.7)", spm: "suffix, then prefix, then middle; sentinel layout UNVERIFIED", cm: "sentinels replace spans in the body; spans appended at the end", span: "x̃ with sentinels to the encoder; s_1∘span_1∘…∘s_{K+1} to the decoder" } }
    - { dimension: "attention mask", values: { psm: "causal", spm: "causal", cm: "causal", span: "bidirectional encoder; causal decoder + cross-attention" } }
    - { dimension: "context seen when the span is generated", values: { psm: "prefix and suffix", spm: "suffix and prefix; prefix contiguous with the middle", cm: "the whole body, with sentinels at the gaps", span: "the whole corrupted input, both directions" } }
    - { dimension: "loss sections", values: { psm: "all three (R4.5); middle-only is a ledger variant", spm: "as PSM; R4.12 does not state its choice", cm: "appended spans; body treatment NOT-DISCLOSED", span: "all of y" } }
    - { dimension: "extra tokens per document", values: { psm: "+4: PRE, SUF, MID, EOT", spm: "+4", cm: "one sentinel per span in the body and one per appended span", span: "K sentinels in x̃, K + 1 in y" } }
    - { dimension: "extra parameters", values: { psm: "none", spm: "none", cm: "none", span: "second stack plus cross-attention projections" } }
    - { dimension: "a keystroke appended to the prefix", values: { psm: "changes tokens before the suffix: suffix K/V re-prefilled", spm: "only the tail changes; suffix K/V reused", cm: "not analysed in §4.3", span: "encoder input changes: re-encode (§4.2 Limitations)" } }
    - { dimension: "reported rate", values: { psm: "50% of documents (R4.5 main models)", spm: "R4.12: 0.9 of documents, half PSM, half SPM", cm: "not stated here", span: "15% of tokens (P02 baseline)" } }
```

Cost line for FIM: +4 tokens per transformed document; no extra parameters; no extra FLOPs beyond those tokens; the KV cache at inference is the same size as for completion (DERIVED). Cost line for causal masking: sentinel tokens in the body plus one sentinel per appended span; targets are appended so the sequence grows by the number of spans (DERIVED).

**Syntax-sensitive data.** Code and serialised structures are token sequences with hard constraints (balanced delimiters, grammar) that the likelihood objective does not know about. Tokenisation of whitespace-significant languages, of long identifiers, and of the prefix/middle boundary (the split-subtoken problem above) all change what the objective measures; the ledger records the tokenizer id for this reason, and the serialisation of tool calls, JSON, and ASTs is fixed in [§10.5](../../part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/10-5-tool-and-multimodal-interfaces.md).

**Execution-grounded targets.** R4.10 introduces HumanEval, where "a sample is considered correct if it passes a set of unit tests", gives Eq. 4.8 and a numerically stable implementation, and shows "significant overlap" between BLEU distributions of correct and incorrect programs, concluding that "optimizing for BLEU score is not equivalent to optimizing for functional correctness" (PAPER-REPORTED · R4.10). The consequence for this chapter is a category boundary: the pretraining objective is text likelihood; the capability of interest is a property of executed programs; the two are connected only empirically, and that connection is the subject of §4.6.

```figure
id: fig-4.19
kind: chart
title: pass@k against k at one empirical pass rate, four sample counts
caption: >-
  Every curve has the same observed rate c/n = 0.1, so all start at
  pass@1 = 0.10, yet they separate as k grows: at k = 10 the estimate is 1.00
  from 10 samples and 0.67 from 100. The estimate is not a function of c/n
  alone; it reaches the plug-in value 1 − (1 − c/n)^k only as n → ∞. A pass@k
  reported without its n cannot be placed on a shared axis. Illustrative
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
Algorithm 4.3 — FIM document transform (PSM, character-level split)
INPUT   document string s of length n chars, FIM rate r ∈ [0,1], tokenizer Enc, sentinel ids PRE, SUF, MID, EOT, RNG
OUTPUT  token sequence z, loss mask m (all ones unless middle_only)
STATE   split points a ≤ b in [0, n]
INVARIANT  Enc(prefix) ∘ Enc(middle) ∘ Enc(suffix) decodes to s (up to tokenizer boundary effects); |z| = |Enc(prefix)| + |Enc(middle)| + |Enc(suffix)| + 4
1  if RNG.uniform() ≥ r:  return Enc(s) ∘ [EOT], m = 1          # untransformed document
2  a, b ← sorted(RNG.uniform_int(0, n), RNG.uniform_int(0, n))   # two uniform character positions
3  prefix, middle, suffix ← s[0:a], s[a:b], s[b:n]
4  z ← [PRE] ∘ Enc(prefix) ∘ [SUF] ∘ Enc(suffix) ∘ [MID] ∘ Enc(middle) ∘ [EOT]
5  m ← 1 for all positions of z                                  # R4.5 keeps loss on all three sections
6  if middle_only:  m[t] ← 1[position t is after MID]            # ledger variant; not the R4.5 choice
7  return z, m                                                   # terminates; no cross-document state
```
Complexity: O(n) per document; the transform runs on the data pipeline, not the accelerator. Applying it after chunking (context-level FIM) replaces line 1's document with the chunk (PAPER-REPORTED · R4.5). Implementation link: the sentinels must exist in the tokenizer vocabulary as single ids; the Hugging Face Transformers tokenizer for a FIM-trained model must expose them as special tokens, otherwise Enc splits them into pieces (DERIVED; specific model tokenizers UNVERIFIED).

```figure
id: fig-4.20
kind: diagram
title: The FIM transform of Algorithm 4.3 in the data pipeline
caption: >-
  Everything inside the boundary runs on the data pipeline in O(n) per
  document; the accelerator only ever sees a causal objective. The heavy path
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
  PSM order with PRE, SUF, MID and EOT, 4 extra tokens; a loss-mask branch
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
    - { id: pipe, label: "data pipeline, O(n) per document, no accelerator" }
```

## Implementation

```text
Tensor trace (FIM inference, PSM)
[1, P+S+3] prompt = PRE ∘ prefix ∘ SUF ∘ suffix ∘ MID → prefill → KV cache [L, P+S+3, H_kv, d_h] → decode middle until EOT
```

```text
Systems trace (execution-grounded evaluation)
sample n programs → latency: n decodes / memory: n KV caches / compute: n·|program|·N / communication: none / failure: timeout, non-termination
execute tests in sandbox → latency: test runtime, unbounded without timeout / memory: sandbox / compute: CPU / communication: result bits / failure: flaky tests, environment drift
estimate pass@k via Eq. 4.8 → latency: negligible / failure: k > n undefined; c = n gives 1
```

> **Warning.** The official HumanEval harness (`main` branch, commit not pinned) states: "This program exists to run untrusted model-generated code. Users are strongly encouraged not to do so outside of a robust security sandbox", and ships with the execution call commented out so that the reader must enable it deliberately (OFFICIAL-DOCUMENTATION · R4.30, accessed 2026-09-20). An execution-grounded target therefore carries a security boundary that a text target does not; sandboxing cost and timeout policy are part of the metric's definition.

The inference-side cost of SPM versus PSM is a cache-invalidation pattern, developed in [§42.3](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-3-cache-organization.md): under PSM, each keystroke appended to the prefix changes tokens *before* the suffix and forces re-prefill of the suffix; under SPM only the tail changes (DERIVED from Eq. 4.7 and the cache definition).

## Experimental design

### Experiment 4.3 — FIM rate versus left-to-right loss and infilling loss at fixed token budget

- **Hypothesis:** at a fixed token budget, increasing the FIM rate from 0 to 0.5 leaves the left-to-right held-out NLL within seed variance while reducing infilling NLL on held-out middle spans (the FIM-for-free property of R4.5).
- **Setup:** §3.5 reference model on a code corpus; rates {0, 0.25, 0.5, 0.9}; context-level transform.
- **Independent variables:** FIM rate; loss on all sections vs middle-only (Algorithm 4.3 line 6).
- **Controlled variables:** tokenizer with reserved sentinels, seeds, token budget, schedule.
- **Dataset/workload:** a permissively licensed code corpus with per-file provenance (§7); held-out files split at character level.
- **Hardware:** one accelerator.
- **Metrics:** left-to-right NLL (nats/token) on untransformed held-out files; infilling NLL on the middle segment of transformed held-out files; both with the same tokenizer.
- **Baselines:** rate 0.
- **Expected result:** left-to-right NLL flat across rates within seed variance; infilling NLL decreasing with rate; middle-only loss reduces the number of gradient-bearing tokens by 1 − ρ.
- **Ablation:** document-level vs context-level transform.
- **Interpretation:** whether the FIM-for-free property holds outside the R4.5 setting.
- **Threats to validity:** the two NLLs are measured on different position sets and are not compared with each other; only across rates.

Proposal only; no run was executed.

## Observations

**What the paper claims.** R4.5 claims FIM-for-free under a 50% transform rate with loss on all sections, prefers character-level uniform splits, and reports context-level FIM outperforming document-level FIM; it motivates SPM by KV-cache reuse (PAPER-REPORTED · R4.5). R4.12 reports a 0.9 transform rate split evenly between PSM and SPM, and the prefix–middle concatenation before tokenisation in SPM (PAPER-REPORTED · R4.12). R4.9 reports causal masking with spans moved to the end (PAPER-REPORTED · R4.9). R4.10 reports that BLEU does not separate functionally correct from incorrect programs (PAPER-REPORTED · R4.10).

**What the evidence shows.** FIM-for-free is measured *by perplexity* in R4.5; R4.12's adoption of the recipe at a different rate is consistent with it but is not a controlled reproduction. The BLEU–correctness gap of R4.10 is a within-paper measurement with a clear mechanism (textual variance of equivalent programs) and has not, to the book's knowledge, been contradicted.

**What we infer.** Because the FIM transform changes only the data, its ledger row is the causal row with a different sequence-construction field; any claim that FIM "changes the objective" is a category error (DERIVED). We infer, marked ASSUMED, that loss-on-all-sections is what makes FIM cheap in gradient-bearing tokens (ρ = 1), and that middle-only variants trade that for a cleaner target; no source compares the two at scale.

**What remains unknown.** Whether contemporary released code models apply loss to all sections is NOT-DISCLOSED for every model the book inspected. The interaction between FIM sentinels and chat serialisation (§10.4–10.5) is UNVERIFIED.

## Failure modes

> **Failure mode — Sentinel fragmentation.** *Symptom:* infilling quality collapses after a tokenizer change or migration. *Cause:* ⟨PRE⟩/⟨SUF⟩/⟨MID⟩ no longer single ids and are encoded as text. *Detection:* `Enc("<PRE>")` returns more than one id. *Mitigation:* reserve sentinels as special tokens; test in the §10.6 migration suite.

> **Failure mode — Split-subtoken boundary.** *Symptom:* the model produces a spurious leading space or a mangled identifier at the prefix/middle junction. *Cause:* the character-level split lands inside a token; Enc(prefix) ∘ Enc(middle) ≠ Enc(prefix ∘ middle). *Detection:* compare token sequences of the joined and separately encoded segments. *Mitigation:* R4.12's concatenate-then-encode for SPM; token-boundary-aware splitting (which R4.5 reports as less robust).

> **Failure mode — Non-terminating middle.** *Symptom:* infilling generation never emits ⟨EOT⟩ and overruns into a regenerated suffix. *Cause:* insufficient ⟨EOT⟩ supervision or a suffix that the model has learned to reproduce. *Detection:* rate of outputs exceeding a length cap. *Mitigation:* stop on ⟨EOT⟩ and on suffix-match; length cap; verify the EOT token is in the loss.

> **Failure mode — Test-suite leakage.** *Symptom:* pass@k rises while held-out execution on fresh problems does not. *Cause:* evaluation problems or their tests present in training data. *Detection:* contamination audit (§8, §61.4). *Mitigation:* held-out problem sets with post-cutoff creation dates.

## Siblings

**Causal LM** — [04-1-autoregressive-modeling.md](04-1-autoregressive-modeling.md)
Why it exists: the base objective. What assumption changed here: the document may be reordered before it is scored. What objective changed: none. What problem it solved: none of the infilling ones. What new failure mode it introduced: none of the sentinel ones. Changed primitive: identity map on documents → FIM transform.

**Span corruption (encoder–decoder)** — [04-2-alternative-objectives.md](04-2-alternative-objectives.md)
Why it exists: bidirectional context with short targets. What assumption changed: a separate encoder may read the whole document. What objective changed: sentinel-delimited targets with ρ < 1. What problem it solved: infilling with full bidirectional visibility. What new failure mode it introduced: two stacks, cross-attention cost, no single-stack streaming. Changed primitive: rearrangement → corruption plus encoder.

**Multi-token prediction** — [04-4-auxiliary-prediction.md](04-4-auxiliary-prediction.md)
Why it exists: denser supervision per position. What assumption changed: positions beyond t+1 may be targets of an auxiliary head. What objective changed: an added term. What problem it solved: additional training signal and draft heads. What new failure mode it introduced: head cost and loss weighting. Changed primitive: one output head → several.

## Extensions

For agents, tool-call arguments and structured outputs are serialised text whose grammar is enforced at decode time rather than by the objective, developed in [§37.4](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/37-4-structured-generation.md); execution-grounded targets become rewards in the verifiable-reward setting of Part VI (forward pointer; the reward setting is defined there, not here). For long context, context-level FIM interacts with packing: the more documents per context, the larger the effective transform rate (PAPER-REPORTED · R4.5). For AST-serialised data the split must respect node boundaries or the middle is syntactically meaningless — a proposal (ASSUMED).

## Limitations

FIM is valid when the deployment supplies a suffix and the tokenizer preserves sentinels; it is falsified as a design if infilling NLL does not fall with transform rate in Experiment 4.3. Execution grounding is valid where a trustworthy executor exists; where tests are weak, pass@k measures test weakness. Decision consequence: record the sentinel ids, the transform rate, the split granularity, and the loss-section choice as ledger fields, because none is recoverable from a checkpoint.

## Reproducibility

Versions: R4.5 arXiv 2207.14255 (ar5iv rendering accessed 2026-09-20); R4.9, R4.10, R4.11, R4.12 arXiv abs/ar5iv pages accessed 2026-09-20. Artifacts: ledger rows `fim_psm`, `fim_spm`, `causal_masking` in [verification.md](verification.md). Configuration: rate, split granularity, sentinel ids, loss-section choice, document- vs context-level. Metrics: left-to-right NLL and infilling NLL, reported separately; pass@k with n and k stated. Unresolved: exact SPM sentinel layout (UNVERIFIED); loss-section choices of released models (NOT-DISCLOSED).

## References

R4.5, R4.9, R4.10, R4.11, R4.12, R4.30; Eq. N.2.
