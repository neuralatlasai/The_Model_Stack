---
id: ms.section.1.3
entity_type: section
title: Model categories
short_title: Model categories
volume: 1
part: 1
chapter: 1
section: 1.3
slug: 01-3-model-categories
parent: ms.chapter.1
prev_sibling: ms.section.1.2
next_sibling: ms.section.1.4
children: []
prerequisites: [ms.section.1.1, ms.section.1.2]
downstream: [ms.section.4.2, ms.section.13.1, ms.section.16.1, ms.section.17.1, ms.section.21.4, ms.section.66.5]
related: [ms.section.1.5]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P10}
  - {type: supported_by, target: paper.P11}
  - {type: supported_by, target: paper.P13}
  - {type: supported_by, target: paper.P05}
  - {type: prerequisite_of, target: ms.section.13.1}
axes:
  lifecycle: [pretraining, adaptation, inference]
  mechanism: [model_taxonomy, conditional_computation, generative_families, disclosure]
  feedback_setting: []
  modality: [text, image, video]
papers: [P02, P05, P10, P11, P13, P25, P44, P47]
implementations: [impl.hugging-face-transformers, impl.nvidia-megatron-core, impl.microsoft-deepspeed, impl.pytorch-dtensor-devicemesh, impl.vllm, impl.sglang, impl.tensorrt-llm, impl.llama-cpp]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, NOT-DISCLOSED, UNVERIFIED, DERIVED, OFFICIAL-DOCUMENTATION]
  empirically_observed: false
word_count_target: 1700
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 1.3 Model categories

## Scope

Objective: define four category axes (general versus specialized; dense versus sparse; autoregressive versus other generative or predictive families; open weights versus reproducible training) by what each changes in the resource ledger and the evidence available, not by brand or size. Baseline: categorization by product name. Success criterion: a model can be placed on all four axes from disclosed facts alone, with NOT-DISCLOSED where the facts are absent. Boundaries: the architectures themselves are owned by [Chapters 13–18](../../part-03-model-architectures-and-state/README.md), objectives by [04](../ch04-language-modeling-and-learning-objectives/README.md), disclosure records by [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md).

## Why this exists

What failed: architecture and training details were inferred from a model name; "open" was used for weights, code, and data interchangeably; a total parameter count was compared with an activated one; and "generative model" was taken to mean "autoregressive Transformer". The bottleneck is that each conflation breaks a ledger entry: comparing a dense N with a sparse total N mis-predicts per-token FLOPs by the sparsity ratio, and treating open weights as reproducible training promises experiments that cannot be run. What changed: the four axes below are each tied to specific ledger dimensions and to a specific disclosure test.

## Intuition

Physically, the four axes answer four resource questions. Generality asks how wide a task distribution the parameters must serve, which fixes how much of D and N is spent outside the reader's target. Sparsity asks which parameters are touched per token, separating memory capacity (all parameters) from FLOPs and weight traffic (activated parameters). The generative family asks how many sequential steps the sampler needs and what state it carries between them, which fixes decode latency and cache memory. Openness asks which artifacts exist for the reader to measure, which fixes which evidence labels are even possible.

Heuristically, generality is "breadth of curriculum", sparsity is "specialists consulted per question", and the generative family is "how the answer is written out". None of these analogies predicts a number; the ledger does.

## Formulation

> **Definition — general versus specialized model.** A model is specialized relative to a specification when its committed task distribution 𝒟_task is a strict subset of the distribution its training data was drawn to cover, with success criteria stated only on that subset; it is general when the specification commits to the wider distribution. The distinction is about commitments, not size.

> **Definition — open weights versus reproducible training.** Open weights: the inference-time parameters and the code to run them are released under a stated license. Reproducible training: in addition, the training data (or a deterministic recipe to regenerate it), the training code and configuration, and enough run metadata (tokenizer, order, seeds where stated) are released so that a third party could re-run training and compare within a stated tolerance.

For the dense/sparse axis, let N_total be all parameters and N_act the parameters that participate in one token's forward pass. For a dense model N_act = N_total. For a routed mixture-of-experts model with E experts per layer of which k are selected per token,

$$
N_{\text{act}} = N_{\text{shared}} + \frac{k}{E}\, N_{\text{experts}}, \qquad
\text{FLOPs}_{\text{token}} \approx 2\, N_{\text{act}}, \qquad
M_{\text{params}} = N_{\text{total}}\, b
$$
*(Eq. 1.4)* where N_shared = attention, embedding, and shared-expert parameters, N_experts = parameters in routed experts, b = bytes per value, and the FLOP term uses the one multiply-add = 2 FLOPs convention with no attention-score term (see [§1.5](01-5-resource-accounting.md)).

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-1.4].** Per-token compute scales with N_act while memory capacity scales with N_total; a sparse model therefore trades capacity and communication (expert dispatch) for FLOPs. Neither N alone predicts the other.

```figure
id: fig-1.14
kind: calculator
title: Activated against total parameters, Eq. 1.4
caption: >-
  Starts from N_act, the left equation's output, because P13's abstract
  states N_total and N_act but not the shared/routed split or k/E. The
  per-token FLOP line follows N_act, the capacity line follows N_total, and
  the last output is how far a FLOP axis is wrong if N_total is read as a
  dense N. b is the reader's choice, not a disclosed format. Scroll: dense,
  then DeepSeek-V3, the matched-N_act design, and the N-mismatch failure.
placement: rail
anchor: formulation
evidence: PAPER-REPORTED
source: [P13, "DERIVED:eq-1.4"]
concepts: [ms.section.1.3]
alt: >-
  Calculator for Eq. 1.4 with inputs total parameters N_total, activated
  parameters N_act (capped at N_total) and bytes per value b. Defaults are
  DeepSeek-V3's reported 671B total and 37B activated (P13) with a
  reader-chosen b = 2. Outputs: activated fraction 0.055; FLOPs per token
  about 2·N_act = 74 GFLOP; weights held N_total·b = 1.22 TiB; weight bytes
  read per token at batch 1, N_act·b = 68.9 GiB; and the factor
  N_total/N_act = 18.1 by which a FLOP axis overstates compute if the total
  is read as a dense N. The dense state sets both counts to 37B: fraction 1,
  74 GFLOP per token, 68.9 GiB held.
states:
  - { anchor: formulation, label: "dense · N_act = N_total", variables: { Nt: 37e9, Na: 37e9, b: 2 }, highlight: [F, M], note: "Dense: one N sets both lines. At 37B that is 74 GFLOP per token and 68.9 GiB of weights at b = 2, activated fraction 1." }
  - { anchor: mechanism, label: "DeepSeek-V3 (P13)", variables: { Nt: 671e9, Na: 37e9, b: 2 }, highlight: [f, M], note: "671B total, 37B activated: fraction 0.055. Per-token FLOPs stay at 74 GFLOP while the weights held grow 18× to 1.22 TiB at b = 2." }
  - { anchor: experimental-design, label: "matched N_act", variables: { Nt: 671e9, Na: 37e9, b: 2 }, highlight: [F, Mt], note: "The proposed sparse–dense comparison fixes N_act, so both arms spend 74 GFLOP and read 68.9 GiB per token at batch 1; they differ in capacity and dispatch only." }
  - { anchor: failure-modes, label: "N mismatch", variables: { Nt: 671e9, Na: 37e9, b: 2 }, highlight: [R], note: "Plotting 671B beside a dense N on a FLOP axis overstates per-token compute 18.1×. Plot N_act for FLOPs and N_total for memory." }
spec:
  tex: >-
    N_{\text{act}} = N_{\text{shared}} + \frac{k}{E}\,N_{\text{experts}},\qquad \text{FLOPs}_{\text{token}} \approx 2\,N_{\text{act}},\qquad M_{\text{params}} = N_{\text{total}}\,b
  equation: "1.4"
  inputs:
    - { symbol: Nt, label: "total parameters N_total", default: 671e9, min: 1e9, max: 2e12, scale: log10, format: params }
    - { symbol: Na, label: "activated parameters N_act", default: 37e9, min: 1e9, max: 2e12, scale: log10, format: params }
    - { symbol: b, label: "bytes per value b (reader's choice)", default: 2, min: 0.5, max: 4, options: [0.5, 1, 2, 4], format: bytes }
  outputs:
    - { symbol: f, label: "activated fraction N_act / N_total", formula: "min(Na, Nt)/Nt", format: fixed3, emphasis: true }
    - { symbol: F, label: "FLOPs per token ≈ 2·N_act", formula: "2*min(Na, Nt)", format: flops }
    - { symbol: M, label: "weights held, N_total·b", formula: "Nt*b", format: bytes, emphasis: true }
    - { symbol: Mt, label: "weight bytes read per token at batch 1", formula: "min(Na, Nt)*b", format: bytes }
    - { symbol: R, label: "FLOP overstatement if N_total is read as dense N", formula: "Nt/min(Na, Nt)", format: ratio }
```

For the generative-family axis, the autoregressive factorization is [Eq. N.1](../../../front-matter/notation.md): T sequential conditional draws, each reading the whole parameter set and a growing cache. Other families change the number of sequential steps and the state: masked or denoising objectives predict corrupted spans in parallel (PAPER-REPORTED · P02; R1.9); diffusion models sample by an iterative refinement whose step count is a sampler choice, described by its authors as a progressive decoding scheme that generalizes autoregressive decoding (PAPER-REPORTED · R1.10); contrastive objectives learn an embedding by predicting which caption matches which image and produce no sequence at all (PAPER-REPORTED · P44); joint-embedding predictive objectives predict masked latent representations rather than tokens (PAPER-REPORTED · P47). Selective state-space models remain autoregressive but replace the cache with a fixed-size recurrent state, which is why their authors report linear scaling in sequence length (PAPER-REPORTED · P11).

```figure
id: fig-1.15
kind: compare
title: Generative and predictive families by sequential steps and carried state
caption: >-
  Only two columns make T sequential conditional draws, and they differ only
  in what is carried between draws: a cache that grows with context against
  a fixed-size recurrent state. That single difference is why §1.3 derives
  that the recurrent family's decode advantage grows with S and shrinks with
  N. The other four change what is predicted; where this section does not
  state their carried state, the cell says so rather than filling it.
placement: wide
evidence: PAPER-REPORTED
source: [P02, R1.9, R1.10, P44, P47, P11]
alt: >-
  Comparison of six families on sequential steps per output and the state
  carried between steps. Autoregressive (Eq. N.1): next token from all
  previous ones; T sequential draws; a key–value cache that grows with
  context (Eq. N.8). Masked or denoising (P02, R1.9): corrupted spans
  predicted in parallel; carried state not stated in §1.3. Diffusion (R1.10):
  iterative refinement whose step count is a sampler choice, described by
  its authors as progressive decoding that generalizes autoregressive
  decoding. Contrastive (P44): which caption matches which image; no
  sequence is produced. Joint-embedding predictive (P47): masked latent
  representations rather than tokens. Selective state space (P11): still
  autoregressive with T sequential draws, but a fixed-size recurrent state
  replaces the cache; its authors report linear scaling in sequence length;
  §1.3 derives that the cache term of Eq. N.8 goes while the weight read
  stays, so the decode advantage grows with S and shrinks with N.
spec:
  axis: >-
    Sequential steps per output and the state carried between them, which
    set decode latency and memory; output quality is not an axis here
  columns:
    - { id: ar, label: "Autoregressive (Eq. N.1)" }
    - { id: mask, label: "Masked / denoising" }
    - { id: diff, label: "Diffusion" }
    - { id: contr, label: "Contrastive" }
    - { id: jepa, label: "Joint-embedding predictive" }
    - { id: ssm, label: "Selective state space" }
  rows:
    - { dimension: "what is predicted", values: { ar: "the next token given all previous tokens", mask: "corrupted spans (P02, R1.9)", diff: "a sample, by iterative refinement (R1.10)", contr: "which caption matches which image (P44)", jepa: "masked latent representations, not tokens (P47)", ssm: "the next token given all previous tokens (P11)" } }
    - { dimension: "sequential steps per output", values: { ar: "T conditional draws", mask: "spans predicted in parallel", diff: "step count is a sampler choice", contr: "none: no sequence is produced", jepa: "latent targets, not a token sequence", ssm: "T conditional draws" } }
    - { dimension: "state carried across steps", values: { ar: "key–value cache growing with context (Eq. N.8)", mask: "not stated in §1.3", diff: "not stated in §1.3", contr: "none", jepa: "not stated in §1.3", ssm: "fixed-size recurrent state in place of the cache" } }
    - { dimension: "cited description", values: { ar: "reference factorization of the book", mask: "text-to-text denoising; bidirectional masked prediction", diff: "progressive decoding that generalizes autoregressive decoding", contr: "contrastive pretraining on image–caption pairs", jepa: "joint-embedding predictive objective", ssm: "linear scaling in sequence length" } }
    - { dimension: "decode consequence derived in §1.3", values: { ar: "weight read plus a growing cache read per step", ssm: "cache term removed, weight read kept: gains grow with S, shrink with N" } }
```

## Mechanism

Each axis is decided by a disclosure test and moves specific ledger entries.

| Axis | Disclosure test | Ledger entries moved | Owner of the mechanism |
|---|---|---|---|
| General / specialized | Does the specification commit to a subset? Was training data narrowed (continued pretraining on a domain corpus)? | D (domain tokens), N (a smaller specialist may meet the same subset criterion), evaluation FLOPs restricted to the subset | [§22.1](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md), [§23.1](../../part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/23-1-adaptation-families.md) |
| Dense / sparse | Are N_total and N_act both stated? Is k/E stated? | FLOPs (N_act), memory capacity (N_total), communication (expert dispatch), latency (routing imbalance) | [§16.1](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-1-conditional-computation.md), [§29.4](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-4-expert-parallelism.md) |
| Autoregressive / other | What is the factorization and sampler? How many sequential steps per output? What state persists? | latency (steps × per-step cost), memory (cache vs recurrent state), throughput | [§4.1](../ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md)–[4.2](../ch04-language-modeling-and-learning-objectives/04-2-alternative-objectives.md), [§17.1](../../part-03-model-architectures-and-state/ch17-state-space-recurrent-linear-attention-and-hybrid-models/17-1-recurrent-state.md), [§42.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition.md) |
| Open weights / reproducible training | Which of weights, inference code, training code, data, run metadata are released, under which license? | Which ledger entries can be measured rather than PAPER-REPORTED; money (license terms) | [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md), [§66.5](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch66-release-decisions-reproducibility-and-research-to-production-closure/66-5-reproducibility-and-disclosure.md) |

Worked placements, all from the cited disclosure:

- Sparse, general, open weights: DeepSeek-V3 reports 671B total and 37B activated parameters per token, 14.8T pretraining tokens, and 2.788M H800 GPU-hours for full training (PAPER-REPORTED · P13, abstract, accessed 2026-09-20). Eq. 1.4 gives an activated fraction near 0.055, so per-token FLOPs are set by 37B while memory capacity is set by 671B. Its training data composition and the run's energy and money are NOT-DISCLOSED.
- Sparse as a mechanism: Switch Transformers route each example to a single expert so that parameter count grows with "constant computational cost" per example (PAPER-REPORTED · P10).
- Specialized by continued pretraining: DeepSeekMath 7B continues pretraining of a code base model on 120B math-related tokens (PAPER-REPORTED · P25). The specialization is a data commitment, not an architecture change; the ledger entry moved is D.
- Reproducible training: Pythia releases 16 models from 70M to 12B parameters trained on public data in the same order with 154 intermediate checkpoints each (PAPER-REPORTED · R1.8). OLMo releases weights with open training data and training and evaluation code (PAPER-REPORTED · R1.7); Dolma releases a three-trillion-token corpus and its curation toolkit (PAPER-REPORTED · P05). Whether OLMo's abstract-level release includes intermediate checkpoints and logs is UNVERIFIED here.
- Neither: the GPT-4 technical report states that it "contains no further details about the architecture (including model size), hardware, training compute, dataset construction, training method, or similar" (PAPER-REPORTED · R1.14, Section 2). Every axis except "autoregressive Transformer-style, next-token pretraining, RLHF fine-tuned" is NOT-DISCLOSED for that model, and nothing may be inferred from its name.

```figure
id: fig-1.16
kind: compare
title: Four-axis placements from the cited disclosures
caption: >-
  The unfilled cells are the result, not an omission: Algorithm 1.3 fills a
  coordinate only from the cited disclosure, so much of this table reads
  'not placed in §1.3' or NOT-DISCLOSED. DeepSeek-V3 is the only column with
  both N counts, which is what lets Eq. 1.4 separate its FLOPs from its
  capacity; GPT-4's own report withholds every coordinate but its family.
placement: wide
evidence: PAPER-REPORTED
source: [P13, P25, R1.8, R1.7, P05, R1.14]
alt: >-
  Comparison of five models on the four category axes as §1.3 places them.
  DeepSeek-V3 (P13): general; sparse, 671B total and 37B activated, fraction
  about 0.055; family not placed here; open weights with training data
  composition NOT-DISCLOSED; 14.8T tokens and 2.788M H800 GPU-hours
  reported. DeepSeekMath 7B (P25): specialized by continued pretraining of a
  code base model on 120B math-related tokens; the entry moved is D, not the
  architecture. Pythia (R1.8): reproducible training, 16 models from 70M to
  12B parameters on public data in the same order, 154 checkpoints each.
  OLMo (R1.7) with Dolma (P05): weights, training data, training and
  evaluation code; Dolma is a three-trillion-token corpus with its curation
  toolkit; checkpoints and logs UNVERIFIED here. GPT-4 (R1.14):
  autoregressive Transformer-style, next-token pretraining, RLHF fine-tuned;
  size, compute, data and method NOT-DISCLOSED; neither open weights nor
  reproducible.
spec:
  axis: >-
    Placement (g, s, f, o) returned by Algorithm 1.3 from the cited
    disclosure alone; no coordinate is filled from a model or family name
  columns:
    - { id: dsv3, label: "DeepSeek-V3 (P13)" }
    - { id: dsm, label: "DeepSeekMath 7B (P25)" }
    - { id: pythia, label: "Pythia (R1.8)" }
    - { id: olmo, label: "OLMo (R1.7), Dolma (P05)" }
    - { id: gpt4, label: "GPT-4 (R1.14)" }
  rows:
    - { dimension: "g, general or specialized", values: { dsv3: "general", dsm: "specialized: continued pretraining on 120B math tokens", pythia: "not placed in §1.3", olmo: "not placed in §1.3", gpt4: "NOT-DISCLOSED" } }
    - { dimension: "s, dense or sparse", values: { dsv3: "sparse: 671B total, 37B activated, fraction ≈ 0.055", dsm: "not placed in §1.3", pythia: "not placed in §1.3", olmo: "not placed in §1.3", gpt4: "NOT-DISCLOSED (model size withheld)" } }
    - { dimension: "f, generative family", values: { dsv3: "not placed in §1.3", dsm: "not placed in §1.3", pythia: "not placed in §1.3", olmo: "not placed in §1.3", gpt4: "autoregressive Transformer-style, next-token pretraining, RLHF fine-tuned" } }
    - { dimension: "o, openness", values: { dsv3: "open weights; training data composition NOT-DISCLOSED", dsm: "not placed in §1.3", pythia: "reproducible training: public data, same order, 154 checkpoints per model", olmo: "weights, training data, training and evaluation code; checkpoints and logs UNVERIFIED", gpt4: "neither" } }
    - { dimension: "ledger entry the placement moves", values: { dsv3: "FLOPs by N_act, capacity by N_total (Eq. 1.4)", dsm: "D (domain tokens), not the architecture", pythia: "re-training ablations become runnable", olmo: "entries measurable, not only PAPER-REPORTED", gpt4: "none can be filled; nothing is inferred from the name" } }
    - { dimension: "other reported facts", values: { dsv3: "14.8T tokens; 2.788M H800 GPU-hours", pythia: "16 models, 70M to 12B parameters", olmo: "Dolma: three-trillion-token corpus and curation toolkit" } }
```

Cost line per axis: generality costs tokens outside the target distribution (D) and evaluation FLOPs over a wider suite; sparsity costs memory capacity for N_total and communication for dispatch while saving FLOPs; non-autoregressive families change latency by the step count and memory by the state they carry; openness costs nothing in FLOPs and determines which entries can be KNOWN rather than PAPER-REPORTED.

```figure
id: fig-1.17
kind: memory-stack
title: DeepSeek-V3 capacity against per-token weight bytes
caption: >-
  At b = 2, a reader-chosen width and not DeepSeek-V3's disclosed format,
  the model holds 1.22 TiB while one token at batch 1 touches 68.9 GiB of
  it, 5.5%. The third bar is a dense model with the same per-token FLOPs: it
  holds exactly what the sparse model reads. Sparsity buys capacity at
  constant compute and pays for it in memory and expert dispatch.
placement: rail
anchor: mechanism
evidence: PAPER-REPORTED
source: [P13, "DERIVED:eq-1.4"]
alt: >-
  Three stacked bars in bytes at b = 2 bytes per value, a reader-chosen
  width. Sparse model held in memory, N_total·b for 671B parameters: 68.9 GiB
  activated for a given token plus 1,181 GiB idle for that token, 1.22 TiB in
  total. Sparse model, weight bytes read per token at batch 1, N_act·b for
  37B activated parameters: 68.9 GiB. Dense model at the same per-token
  FLOPs, N = 37B: 68.9 GiB held. Parameter counts are PAPER-REPORTED (P13);
  the byte values follow from Eq. 1.4.
spec:
  format: bytes
  variables: { Nt: 671e9, Na: 37e9, b: 2 }
  bars:
    - label: "sparse, held: N_total·b"
      segments:
        - { label: "activated for this token", kind: tensor, formula: "Na*b" }
        - { label: "idle for this token", kind: memory, formula: "(Nt - Na)*b" }
    - label: "sparse, read per token at batch 1"
      segments:
        - { label: "activated weights, N_act·b", kind: tensor, formula: "Na*b" }
    - label: "dense at equal FLOPs, held"
      segments:
        - { label: "all weights, N = N_act", kind: tensor, formula: "Na*b" }
```

## Algorithm

```text
Algorithm 1.3 — Four-axis placement from disclosure
INPUT   disclosure set 𝔇 (papers, model cards, repositories, licenses) for model m; specification σ
OUTPUT  placement (g, s, f, o) with each coordinate a value or NOT-DISCLOSED; ledger deltas
INVARIANT  no coordinate is set from a model name or a family name
 1. g := "specialized" if σ.𝒟_task ⊂ training distribution stated in 𝔇 and criteria are restricted, else "general"; NOT-DISCLOSED if 𝔇 lacks the training distribution
 2. if 𝔇 states N_total and N_act (or k, E, N_experts): s := (N_total, N_act) via Eq. 1.4 else s := NOT-DISCLOSED
 3. f := factorization and sampler stated in 𝔇 (AR / masked / diffusion / contrastive / predictive / recurrent-AR); record sequential steps per output and persistent state; else NOT-DISCLOSED
 4. o := subset of {weights, inference code, training code, data, run metadata} released with licenses; "reproducible" only if all five are present
 5. ledger deltas := entries moved per the Mechanism table for each coordinate
 6. return (g, s, f, o), deltas
TERMINATION  four coordinates, one pass over 𝔇
```

Complexity: linear in |𝔇|. Implementation link: the "Required model record" fields of [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md).

## Implementation

The placement is recorded in the model record. At the *Model definition / adaptation* layer (Hugging Face Transformers), a sparse model is identified by the expert configuration in its released config rather than by name. At the *Distributed training* layer (NVIDIA Megatron-Core, Microsoft DeepSpeed, PyTorch DTensor / DeviceMesh), sparsity appears as expert parallelism and its dispatch collectives. At the *Inference engine* layer (vLLM, SGLang, TensorRT-LLM, llama.cpp), the family determines whether a paged cache (autoregressive Transformer) or a recurrent-state buffer is the relevant memory object. Which engine supports which family at which version is OFFICIAL-DOCUMENTATION to be pinned by the owning chapters and is UNVERIFIED here. Version pinning follows the Reproducibility dimension of `AI_REFERENCE_STACK.md` §4.2.

## Experimental design

Proposal: a matched-budget comparison across the sparse/dense axis at equal N_act and equal D, reporting the success criterion of [§1.1](01-1-problem-formulation.md) together with memory capacity, communication volume, and decode latency at a declared batch; and a general/specialized comparison at equal total tokens where the specialist's extra domain tokens are subtracted from the generalist's mixture. Seeds: three per arm. Evaluation: held-out units with bootstrap intervals. This is the methodology of [§16.6](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-6-comparative-methodology.md) and [§21.4](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-4-beyond-dense-pretraining.md); nothing was run here.

## Observations

**What the paper claims.** Switch Transformers report up to 7× pretraining speedups at the same computational resources relative to T5-Base and T5-Large (PAPER-REPORTED · P10). DeepSeek-V3 reports stable training with "no irrecoverable loss spikes or rollbacks" (PAPER-REPORTED · P13). Mamba reports 5× higher inference throughput than Transformers and linear scaling in sequence length (PAPER-REPORTED · P11).

**What the evidence shows.** Each speedup is measured on its authors' workload, hardware, and implementation, and none has been independently reproduced within this book; the Switch and Mamba figures are not comparable with each other because the baselines and measurement boundaries differ.

**What we infer.** DERIVED: the per-token FLOP advantage of sparsity (Eq. 1.4) is arithmetic; whether it becomes wall-clock advantage depends on communication and load balance, which are runtime-level facts ([§1.2](01-2-levels-of-analysis.md)). DERIVED: recurrent-state families remove the cache term of [Eq. N.8](../../../front-matter/notation.md) but not the weight-read term, so their decode advantage grows with S and shrinks with N.

**What remains unknown.** For most proprietary models all four coordinates are NOT-DISCLOSED. The proportion of reported sparse-model speedups attributable to routing versus to co-designed kernels is UNVERIFIED without single-level arms.

## Failure modes

> **Failure mode — name-based inference.** *Symptom:* an architecture or training claim cites only a product name. *Cause:* absence of disclosure filled by assumption. *Detection:* Algorithm 1.3 step invariant. *Mitigation:* record NOT-DISCLOSED.

> **Failure mode — N mismatch.** *Symptom:* a sparse model's N_total is compared with a dense model's N in a scaling plot. *Cause:* the axis was not recorded. *Detection:* the plotted quantity does not state activated or total. *Mitigation:* plot N_act for FLOPs and N_total for memory, per Eq. 1.4.

> **Failure mode — open-weights as reproducible.** *Symptom:* a planned ablation requires re-training with a modified corpus, but only weights are available. *Cause:* coordinate o recorded as "open" without the five-part test. *Detection:* step 4 of Algorithm 1.3. *Mitigation:* choose a reproducible-training suite (for example Pythia, R1.8) for the ablation.

## Siblings

**Architectural families** — [§13.1](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-1-architectural-families.md)
Why it exists: to define encoder, decoder, and encoder–decoder Transformer variants. What assumption changed: the axis is block structure, not resource category. What objective changed: none. What problem it solved: naming the reference architecture. What new failure mode it introduced: conflating block structure with objective. Changed primitive: category axis → block diagram.

**Conditional computation** — [§16.1](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-1-conditional-computation.md)
Why it exists: to derive the sparse mechanism and its routing. What assumption changed: N_act < N_total by construction. What objective changed: an auxiliary or loss-free balancing term is added. What problem it solved: FLOPs per token at large N_total. What new failure mode it introduced: routing collapse and dispatch communication. Changed primitive: dense FFN → routed experts.

**Alternative objectives** — [§4.2](../ch04-language-modeling-and-learning-objectives/04-2-alternative-objectives.md)
Why it exists: to formulate masked, denoising, prefix, infilling, contrastive, and predictive losses. What assumption changed: the factorization of [Eq. N.1](../../../front-matter/notation.md) is not assumed. What objective changed: the loss itself. What problem it solved: bidirectional conditioning and non-sequential outputs. What new failure mode it introduced: mismatch between pretraining objective and generation interface. Changed primitive: next-token likelihood → corrupted-span or embedding objective.

**Disclosure record** — [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md)
Why it exists: to hold per-release facts. What assumption changed: none. What objective changed: none. What problem it solved: a stable place for NOT-DISCLOSED. What new failure mode it introduced: staleness of pinned records. Changed primitive: axis → record field.

## Extensions

Domain adaptation moves a model along the general/specialized axis without changing the others (data commitment, as in P25). Long context stresses the family axis through the cache or state term. Multimodality adds encoders whose family (contrastive, predictive) may differ from the language decoder's, so a single model carries two placements (P44, P47). Agents do not change placement; they change 𝒟_task. Embodied policies may use flow or diffusion action heads, a family choice made at the output interface ([§58.1](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch58-generative-multimodal-models-and-alternative-generation-paths/58-1-generative-representations.md)). Proposals only.

## Limitations

Valid regime: models with at least a technical report. Falsification: if two models with identical placements and matched ledgers differ in the success criterion beyond interval width, the axes are incomplete for that application and a finer axis (data mixture, objective detail) must be added. Decision consequence: a reader who cannot fill a coordinate does not adopt the model for a study that depends on it.

## Reproducibility

Artifacts: the four-axis placement per model, with source per coordinate. Configurations: released configs where o includes code. Unresolved: OLMo checkpoint and log release status (UNVERIFIED here); all proprietary coordinates (NOT-DISCLOSED).

## References

P02, P05, P10, P11, P13, P25, P44, P47; R1.7, R1.8, R1.9, R1.10, R1.14; [notation](../../../front-matter/notation.md) Eq. N.1, N.8.
