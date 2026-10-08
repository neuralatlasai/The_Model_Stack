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
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 1.3 Model categories

## Scope

Model categories are compared along target scope, dense or sparse parameter use, training objective and inference procedure, and the availability of weights or training-reproduction artifacts. These coordinates are separate: denoising can train an autoregressive decoder, and a recurrent architecture can also generate autoregressively. The resource consequences are conditional on the disclosed architecture and workload. Canonical architecture chapters supply the full model derivations; this section explains classification and its evidence boundaries.

## Why this exists

T5 and BERT both use corruption-based prediction, yet T5 generates with an autoregressive decoder while BERT's masked objective conditions bidirectionally (P02, §§2.1, 3.3; R1.9, §3.1). Switch Transformers increase resident expert parameters without activating every expert for each token, but routing capacity and execution still affect work and communication (P10, §§2–4). OLMo documents a training-artifact release beyond inference weights (R1.7). These sources show why training objective, architecture, activated computation, target scope, and release evidence need separate coordinates. A model name or parameter total cannot substitute for those disclosures.

## Intuition

DERIVED: the four axes describe different objects. Scope is an empirical claim about tasks and domains. Sparsity describes which operators and weights participate in a forward pass. An objective defines prediction targets, while an architecture and sampler determine the sequence of inference operations. Disclosure specifies which artifacts can be inspected or rerun. None of these coordinates determines the others: an autoregressive model can use sparse experts or recurrent state, and a broadly pretrained model can be adapted to a restricted evaluation domain.

## Formulation

> **Definition — general versus specialized model.** These are relative descriptions of the breadth of intended use and demonstrated task coverage. A specialization claim must name its domain, training or adaptation intervention, and evaluation population; generality requires evidence across a declared broader set. Restricting deployment alone does not establish that a model has undergone specialized training.

> **Definition — open weights versus reproducible training.** Weight availability, inference code, training code/configuration, data, run metadata, and licensing are separate disclosure fields. Reconstructible training additionally requires artifacts sufficient to rerun the stated procedure and compare within declared tolerances. The presence of a release checklist does not itself establish successful independent reproduction or unrestricted legal reuse.

For the dense/sparse axis, let N_total be all parameters and N_act the parameters that participate in one token's forward pass. For a dense model N_act = N_total. For a routed mixture-of-experts model with E experts per layer of which k are selected per token,

$$
N_{\text{act}} = N_{\text{shared}} + \frac{k}{E}\, N_{\text{experts}}, \qquad
\text{FLOPs}_{\text{token}} \approx 2\, N_{\text{act}}, \qquad
M_{\text{params}} = N_{\text{total}}\, b
$$
*(Eq. 1.4)* where N_shared is the count of shared parameters in the chosen activated-count convention, N_experts is the aggregate count across equal-sized routed experts, k of E experts execute for each token, and b is a uniform hypothetical storage width. Unequal expert sizes require summing the selected experts explicitly. The 2N_act approximation counts matrix multiply-adds and excludes attention-score products, routing, lookup-only parameters, padding, dequantization, and other operators; it is not a physical traffic measurement. See [§1.5](01-5-resource-accounting.md).

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-1.4].** Under the equal-expert and matrix-operation conditions, the parameter-linear FLOP estimate depends on activated weights while total logical weight storage depends on all stored weights. Device capacity additionally depends on sharding, replication, offload, precision metadata, and workspaces. Distributed expert dispatch adds communication when selected experts are remote.

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

MATHEMATICALLY-DERIVED: [Eq. N.1](../../../front-matter/notation.md) factors a sequence probability into causal conditionals; ancestral sampling uses one conditional draw per emitted token. It does not require Transformer attention or a KV cache. PAPER-REPORTED · [P02, §§2.1, 3.3](https://arxiv.org/pdf/1910.10683): T5's span-denoising pretraining still uses an autoregressive decoder. PAPER-REPORTED · [R1.9, §3.1](https://arxiv.org/pdf/1810.04805): BERT predicts selected masked positions with bidirectional conditioning and has no native left-to-right generation procedure. Thus a denoising objective does not establish parallel generation.

PAPER-REPORTED · [R1.10, §3 and Algorithms 1–2](https://arxiv.org/pdf/2006.11239): DDPM trains a noise predictor and samples by a reverse denoising chain carrying a full noisy sample. PAPER-REPORTED · [P44, §2.3](https://arxiv.org/pdf/2103.00020): CLIP aligns image and text embeddings with a contrastive loss; its evaluated zero-shot classifier scores text prompts rather than generating captions. PAPER-REPORTED · [P47, §2.1](https://arxiv.org/html/2506.09985v1): V-JEPA 2 predicts masked video representations from an EMA target encoder, with stop-gradient; its action-conditioned successor has a separate autoregressive latent predictor. PAPER-REPORTED · [P11, §3](https://arxiv.org/html/2312.00752v2): Mamba combines input-dependent state-space parameters with a recurrent inference state. These are objective–architecture–inference distinctions, not mutually exclusive brand categories.

```figure
id: fig-1.15
kind: compare
title: Objectives, inference procedures, and persistent state
caption: >-
  Denoising is an objective family. T5 uses an autoregressive decoder;
  BERT predicts masked positions bidirectionally. Architecture and
  inference procedure must therefore be recorded separately.
placement: wide
evidence: PAPER-REPORTED
source: [P02, R1.9, R1.10, P44, P47, P11]
alt: >-
  Six columns distinguish a conventional autoregressive Transformer, T5
  denoising, BERT masking, diffusion, contrastive and joint-embedding
  prediction, and recurrent autoregressive state-space models.
spec:
  axis: "Training target versus output procedure and state"
  columns:
    - { id: ar, label: "AR Transformer" }
    - { id: t5, label: "T5 / BERT" }
    - { id: diff, label: "DDPM" }
    - { id: clip, label: "CLIP" }
    - { id: jepa, label: "V-JEPA 2" }
    - { id: ssm, label: "Mamba" }
  rows:
    - { dimension: "target", values: { ar: "next token", t5: "T5: corrupted spans; BERT: masked tokens", diff: "denoising reverse-process training", clip: "paired image/text embedding alignment", jepa: "masked target-encoder latent features", ssm: "next token in language-model setting" } }
    - { dimension: "output procedure", values: { ar: "sequential conditional draws", t5: "T5: AR decoder; BERT: no native left-to-right generator", diff: "iterative reverse denoising", clip: "embedding similarity; no native caption generator", jepa: "latent prediction; action-conditioned variant is distinct", ssm: "sequential conditional draws" } }
    - { dimension: "state", values: { ar: "conventional KV cache grows with context", t5: "depends on encoder/decoder execution", diff: "current noisy sample and timestep", clip: "embeddings for comparison", jepa: "latent context and prediction targets", ssm: "fixed-size recurrent state for fixed architecture" } }
    - { dimension: "limit", values: { ar: "cache formula is architecture-specific", t5: "denoising does not imply parallel generation", diff: "sampler steps and quality are coupled", clip: "contrastive objective is not token likelihood", jepa: "latent prediction is not pixel reconstruction", ssm: "state size alone does not establish speed or quality" } }
```

## Mechanism

### Methodology

DERIVED: construct a classification from inspected artifacts, not from a model's advertised role. For scope, list the training distribution as disclosed, the adaptation intervention, and the evaluation domains separately. A domain name in a training report is not a complete probability distribution. For sparsity, count the shared operators, routed expert tensors, experts selected per token, and expert-capacity policy. For prediction, record the loss targets separately from decoder dependency and persistent state. For disclosure, distinguish a released artifact from a report that promises a future release. A category value therefore retains a source locator and an unresolved-details field.

PAPER-REPORTED · [P10, §§2.1–2.4](https://arxiv.org/html/2101.03961v3): Switch simplifies routing to the top-scored expert and imposes a finite per-expert capacity. Overflow tokens bypass the expert through the residual path; auxiliary balancing discourages unequal load. Capacity buffers introduce padded work, and router precision and initialization choices address training instability. DERIVED: equal activated parameter counts do not ensure equal executed FLOPs, communication, or quality. Batch routing, dropped tokens, and padding must remain in a sparse/dense comparison. Inference also reads the union of activated experts across a batch rather than one token's activated set.

PAPER-REPORTED · [R1.7, §§1, 3, 6](https://arxiv.org/html/2402.00838v2): OLMo describes training data, code, intermediate checkpoints, and logging artifacts, allowing analyses unavailable from final weights alone. Its introduction names logs while the release/future-work discussion retains some prospective wording. DERIVED: the report establishes its documented artifact scope; availability of every historical log or checkpoint must still be checked at a pinned revision before a reproduction claim. Training disclosure and independently demonstrated reproduction remain distinct axes.

Each axis is decided by a disclosure test and moves specific ledger entries.

| Axis | Disclosure test | Ledger entries moved | Owner of the mechanism |
|---|---|---|---|
| General / specialized | Does the specification commit to a subset? Was training data narrowed (continued pretraining on a domain corpus)? | D (domain tokens), N (a smaller specialist may meet the same subset criterion), evaluation FLOPs restricted to the subset | [§22.1](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-1-stage-definitions.md), [§23.1](../../part-04-training-science-and-adaptation/ch23-parameter-efficient-adaptation-and-model-composition/23-1-adaptation-families.md) |
| Dense / sparse | Are N_total and N_act both stated? Is k/E stated? | FLOPs (N_act), memory capacity (N_total), communication (expert dispatch), latency (routing imbalance) | [§16.1](../../part-03-model-architectures-and-state/ch16-mixture-of-experts-architectures/16-1-conditional-computation.md), [§29.4](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch29-parallelism-collectives-and-distributed-optimization/29-4-expert-parallelism.md) |
| Autoregressive / other | What is the factorization and sampler? How many sequential steps per output? What state persists? | latency (steps × per-step cost), memory (cache vs recurrent state), throughput | [§4.1](../ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md)–[4.2](../ch04-language-modeling-and-learning-objectives/04-2-alternative-objectives.md), [§17.1](../../part-03-model-architectures-and-state/ch17-state-space-recurrent-linear-attention-and-hybrid-models/17-1-recurrent-state.md), [§42.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition.md) |
| Open weights / reproducible training | Which of weights, inference code, training code, data, run metadata are released, under which license? | Which ledger entries can be measured rather than PAPER-REPORTED; money (license terms) | [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md), [§66.5](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch66-release-decisions-reproducibility-and-research-to-production-closure/66-5-reproducibility-and-disclosure.md) |

Worked placements use the source's disclosed mechanisms and release claims:

- DeepSeek-V3 is an autoregressive sparse Transformer with MLA attention and a routed/shared-expert architecture. It reports 671B total and 37B activated parameters, 14.8T pretraining tokens, and 2.788M H800 GPU-hours (P13, §§1–2). The 0.055 activated fraction is a parameter ratio, not a measured byte-traffic ratio. Coarse data categories and an assumed-price training estimate are disclosed; the exact full corpus and facility energy are not.
- DeepSeekMath continues a code base model using a math-oriented mixture derived through iterative web selection (P25, §2). Its target specialization is supported by this data construction and task evaluation; not every architectural or optimizer detail is held fixed in a comparison with unrelated general models.
- OLMo documents weights, training data, code, and intermediate artifacts for scientific study; Dolma supplies the associated corpus and curation methods (R1.7, §§1, 3, 6; P05). This is stronger disclosure than weights alone, while an independent end-to-end rerun still requires the exact artifact versions and a tolerance-defined target.
- GPT-4's report identifies an autoregressive Transformer-style model with next-token pretraining and RLHF but withholds detailed size, training-compute, dataset-construction, and architecture information (R1.14, §2). The specified withheld fields remain NOT-DISCLOSED; withholding size alone does not prove a model is sparse or dense.

```figure
id: fig-1.16
kind: compare
title: Model placements and disclosure limits
caption: >-
  Placements follow methods and release records. Reproducibility is a
  stronger claim than artifact availability and is not certified here.
placement: wide
evidence: PAPER-REPORTED
source: [P13, P25, R1.7, P05, R1.14]
alt: >-
  DeepSeek-V3 is sparse and autoregressive with open weights; DeepSeekMath
  is domain-oriented; OLMo and Dolma document training artifacts; GPT-4
  identifies its broad family but withholds detailed training information.
spec:
  axis: "Disclosed mechanism, scope, and artifact boundary"
  columns:
    - { id: v3, label: "DeepSeek-V3" }
    - { id: math, label: "DeepSeekMath" }
    - { id: olmo, label: "OLMo / Dolma" }
    - { id: gpt, label: "GPT-4 report" }
  rows:
    - { dimension: "scope", values: { v3: "broad language tasks", math: "math-oriented continued training", olmo: "language-model research", gpt: "broad reported tasks" } }
    - { dimension: "mechanism", values: { v3: "AR sparse Transformer; MLA; 671B total / 37B active", math: "AR continued-pretraining route", olmo: "AR dense Transformer", gpt: "AR Transformer-style; detailed architecture withheld" } }
    - { dimension: "release claim", values: { v3: "open weights; full training corpus not released", math: "reported model and data-selection method", olmo: "weights, data, code, intermediate artifacts", gpt: "weights and full training record not released" } }
    - { dimension: "limit", values: { v3: "active ratio is not HBM traffic", math: "domain focus is relative to tasks", olmo: "independent rerun not performed here", gpt: "no sparse/dense inference from withheld size" } }
```

Cost line: wider claimed scope requires broader evaluation, but does not imply a fixed training-token surcharge. Sparse routing distinguishes resident parameters, active computation, dispatch, and batch-level expert reuse. Family state and sequential depth affect execution; disclosure determines which quantities can be inspected. None of these axes alone establishes quality or total cost.

```figure
id: fig-1.17
kind: memory-stack
title: Parameter-storage proxies for total and active coefficients
caption: >-
  At b = 2, a reader-chosen width and not DeepSeek-V3's disclosed format,
  the coefficient-storage proxies are 1.22 TiB total and 68.9 GiB active,
  a 5.5% ratio. These are not measured resident footprints or transferred
  bytes; mixed formats, routing, batch reuse, and placement require their
  own account. The third bar is a hypothetical dense 37B-coefficient model.
placement: rail
anchor: mechanism
evidence: PAPER-REPORTED
source: [P13, "DERIVED:eq-1.4"]
alt: >-
  Three stacked bars in bytes at b = 2 bytes per value, a reader-chosen
  width. Sparse model held in memory, N_total·b for 671B parameters: 68.9 GiB
  activated for a given token plus 1,181 GiB idle for that token, 1.22 TiB in
  total. Sparse model, active coefficient-byte proxy, N_act·b for
  37B activated parameters: 68.9 GiB. Hypothetical dense model with N = 37B: 68.9 GiB held. Parameter counts are PAPER-REPORTED (P13);
  the byte values follow from Eq. 1.4.
spec:
  format: bytes
  variables: { Nt: 671e9, Na: 37e9, b: 2 }
  bars:
    - label: "sparse, held: N_total·b"
      segments:
        - { label: "activated for this token", kind: tensor, formula: "Na*b" }
        - { label: "idle for this token", kind: memory, formula: "(Nt - Na)*b" }
    - label: "sparse, active coefficient-byte proxy"
      segments:
        - { label: "activated weights, N_act·b", kind: tensor, formula: "Na*b" }
    - label: "hypothetical dense 37B, coefficient bytes"
      segments:
        - { label: "all weights, N = N_act", kind: tensor, formula: "Na*b" }
```

## Algorithm

```text
Algorithm 1.3 — Four-axis placement from disclosure
INPUT   disclosure set 𝔇 (papers, model cards, repositories, licenses) for model m; specification σ
OUTPUT  placement (g, s, f, o) with each coordinate a value or NOT-DISCLOSED; ledger deltas
INVARIANT  no coordinate is set from a model name or a family name
 1. record stated target tasks and domain emphasis; general/specialized is relative to that declared scope, or undetermined
 2. if 𝔇 states N_total and N_act (or k, E, N_experts): s := (N_total, N_act) via Eq. 1.4 else s := NOT-DISCLOSED
 3. f := factorization and sampler stated in 𝔇 (AR / masked / diffusion / contrastive / predictive / recurrent-AR); record sequential steps per output and persistent state; else NOT-DISCLOSED
 4. o := subset of {weights, inference code, training code, data, run metadata} released with licenses; "rerun artifacts documented" only if their identities and required configuration are available; independent reproducibility remains unverified until tested
 5. ledger deltas := entries moved per the Mechanism table for each coordinate
 6. return (g, s, f, o), deltas
TERMINATION  four coordinates, one pass over 𝔇
```

Complexity: linear in |𝔇|. Implementation link: the "Required model record" fields of [Appendix A](../../../appendices/appendix-a-organizations-model-families-and-disclosure.md).

## Implementation

The placement is recorded in the model record. At the *Model definition / adaptation* layer (Hugging Face Transformers), a sparse model is identified by the expert configuration in its released config rather than by name. At the *Distributed training* layer (NVIDIA Megatron-Core, Microsoft DeepSpeed, PyTorch DTensor / DeviceMesh), sparsity appears as expert parallelism and its dispatch collectives. At the *Inference engine* layer (vLLM, SGLang, TensorRT-LLM, llama.cpp), the family determines whether a paged cache (autoregressive Transformer) or a recurrent-state buffer is the relevant memory object. Which engine supports which family at which version is OFFICIAL-DOCUMENTATION to be pinned by the owning chapters and is UNVERIFIED here. Version pinning follows the Reproducibility dimension of `AI_REFERENCE_STACK.md` §4.2.

## Experimental design

### Reported experiments

PAPER-REPORTED · [P10, §3 and Table 1](https://arxiv.org/html/2101.03961v3): Switch compares sparse and dense T5-derived models on C4 pretraining, distinguishing quality per step from time to a loss target and varying expert capacity. Its FLOP-matched comparisons increase parameter capacity; they are not total-parameter-matched studies. The capacity-factor comparison explicitly tests the work/overflow trade-off, and the paper notes an implementation-dependent nonmonotonic speed result. Such a protocol supports conditional-computation efficiency in its setup, not a universal sparse-model speedup.

PAPER-REPORTED · [P11, §4.5 and Appendix E.5](https://arxiv.org/html/2312.00752v2): Mamba separates scan microbenchmarks from end-to-end inference throughput and memory benchmarks. The inference study includes untrained configurations, which can establish execution cost but not task-quality parity. PAPER-REPORTED · [P25, §2](https://arxiv.org/html/2402.03300v3): DeepSeekMath constructs a math-related corpus using iterative web retrieval/classification and continues a code-initialized model with a disclosed mixture. This is evidence about a domain-focused training route, rather than an architecture-only comparison. Training/evaluation overlap controls, baselines, and mixture details remain necessary when interpreting specialization results.

## Observations

**What the paper claims.** PAPER-REPORTED · P10, §3: sparse capacity improves loss and time-to-target in its tested C4 configurations. PAPER-REPORTED · P11, §4.5: recurrent-state execution admits larger batches than the tested attention baseline. PAPER-REPORTED · P13, §2: total and activated parameter counts are separately disclosed for its MoE model.

**What the evidence shows.** Each speedup is measured on its authors' workload, hardware, and implementation, and none has been independently reproduced within this book; the Switch and Mamba figures are not comparable with each other because the baselines and measurement boundaries differ.

**What we infer.** DERIVED: reducing selected expert weights reduces the matrix-linear arithmetic term relative to activating all experts. Whether it improves wall time depends on routing, padding, placement, and kernels. A recurrent model replaces a length-growing KV representation with its own state; the difference alone gives no universal throughput ratio or monotonic relationship with parameter count.

**What remains unknown.** NOT-DISCLOSED · R1.14, §2: GPT-4's report withholds parameter count and detailed training/system design. UNVERIFIED: artifact availability and numerical reproducibility are not established by reading an open-training report; this chapter has not rerun those training procedures.

## Failure modes

> **Failure mode — name-based inference.** *Symptom:* an architecture or training claim cites only a product name. *Cause:* absence of disclosure filled by assumption. *Detection:* Algorithm 1.3 step invariant. *Mitigation:* record NOT-DISCLOSED.

> **Failure mode — N mismatch.** *Symptom:* a sparse model's N_total is compared with a dense model's N in a scaling plot. *Cause:* the axis was not recorded. *Detection:* the plotted quantity does not state activated or total. *Mitigation:* plot N_act for FLOPs and N_total for memory, per Eq. 1.4.

> **Failure mode — open-weights as reproducible.** *Symptom:* a planned ablation requires re-training with a modified corpus, but only weights are available. *Cause:* coordinate o recorded as "open" without the five-part test. *Detection:* step 4 of Algorithm 1.3. *Mitigation:* choose a reproducible-training suite (for example Pythia, R1.7) for the ablation.

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

### Improvements

PAPER-REPORTED · P10, §§2–3: top-1 routing simplifies the predecessor's multi-expert dispatch while selective precision, initialization, and capacity controls address instability and overflow; Table 1 tests capacity choices rather than holding every implementation effect constant. PAPER-REPORTED · [P13, §§2.1–2.2, 4.5](https://arxiv.org/html/2412.19437v2): DeepSeek-V3 combines MLA, routed/shared experts, an auxiliary-loss-free routing-bias adjustment, and multi-token prediction; its component ablations establish narrower claims than the complete-model comparison. These mechanisms belong to Chapters 14–16 and 19. PAPER-REPORTED · P47, §§2–3: action conditioning extends a pretrained latent encoder with a separate predictor. DERIVED: one system consequently needs component-level category records; a single generative/predictive label loses the distinction between representation learning and the output interface.

## Limitations

DERIVED: these axes are descriptive summaries rather than a sufficient statistic for quality. Two models with identical placements can differ through data, optimization, training duration, or fine-grained architecture. Such a difference does not falsify a category definition. Missing coordinates restrict claims that depend on them; they do not establish that the model is unsuitable for every application. The manuscript makes no cross-family quality ranking.

## Reproducibility

Artifacts: the four-axis placement per model, with source per coordinate. Configurations: released configs where o includes code. Unresolved: OLMo checkpoint and log release status (UNVERIFIED here); all proprietary coordinates (NOT-DISCLOSED).

## References

P02, P05, P10, P11, P13, P25, P44, P47; R1.7, R1.9, R1.10, R1.14; [notation](../../../front-matter/notation.md) Eq. N.1, N.8.
