---
id: ms.chapter.17
entity_type: chapter
title: "State-space, recurrent, linear-attention, and hybrid models"
short_title: "Recurrent and hybrid models"
section: null
slug: ch17-state-space-recurrent-linear-attention-and-hybrid-models
parent: ms.part.3
prev_sibling: ms.chapter.16
next_sibling: ms.chapter.18
children: [ms.section.17.1, ms.section.17.2, ms.section.17.3, ms.section.17.4, ms.section.17.5, ms.section.17.6, ms.verification.17, ms.references.17]
prerequisites: [ms.chapter.2, ms.chapter.13, ms.chapter.14, ms.chapter.15]
downstream: [ms.chapter.27, ms.chapter.42]
word_count_target: 1200
volume: 1
part: 3
chapter: 17
related: []
relations: []
axes: {lifecycle: [pretraining, inference, evaluation], mechanism: [recurrent_state, state_space, linear_attention], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P11, P12]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.triton-language]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-27
editorial_status: manuscript_draft
---


VOLUME I / PART III — MODEL ARCHITECTURES AND STATE / CHAPTER 17

# 17 — State-space, recurrent, linear-attention, and hybrid models

**DERIVED — thesis.** A sequence model's useful memory is determined jointly by its state representation, update semantics, numerical precision, and task requirements, so architectural comparisons must measure retained information and execution cost under explicit budgets.

6 sections · 2 spine papers · 3 reference-stack systems · prerequisites: 02, 13–15 · artifact: a sequence-model comparison under explicit state budgets · updated 2026-09-27

## Why this chapter exists

**DERIVED.** Retaining a representation for every past token makes future content-based access possible, but grows the storage and access burden as sequences lengthen. Replacing that history with a compact state changes the bottleneck. Computation may remain affordable while information needed by an unforeseen query has already been combined, attenuated, or overwritten. Input acceptance and information retention therefore require separate explanations.

The dominant constraint depends on the task. Streaming prediction may benefit from a compact statistic; exact delayed recall of arbitrary inputs requires preserving many distinguishable histories. A model that compresses aggressively can be appropriate for one distribution and inadequate for another. Neither asymptotic complexity nor a single retrieval example settles this distinction.

Modern sequence architectures respond by changing what is written, what is forgotten, how queries read the result, and which layers keep explicit history. They also change how those operations are scheduled during training and generation. The same recurrence can have several mathematically equivalent execution forms with different numerical and hardware behavior.

This chapter supplies the missing comparison contract: define the operator, prove the relevant identities, enumerate all persistent state, and test quality and cost separately. The resulting decision concerns a declared workload and resource envelope. It does not require a universal winner among recurrent, attention, or hybrid models.

## Concept map

~~~mermaid
flowchart LR
  task["[Objective] Task requirement"] --> budget["[Memory] State budget"]
  budget --> state["[State] Recurrent boundary"]
  state --> capacity["[Dependency] Finite precision"]
  state --> ssm["[Process] Selective dynamics"]
  state --> kernel["[Process] Feature accumulation"]
  state --> delta["[Process] Delta correction"]
  ssm --> scan["[Process] Parallel schedule"]
  kernel --> scan
  delta --> scan
  ssm --> hybrid["[Model] Hybrid composition"]
  kernel --> hybrid
  delta --> hybrid
  cache["[Memory] Attention cache"] --> hybrid
  hybrid --> restore["[Process] Boundary restoration"]
  restore --> recall["[Metric] Recall and copying"]
  scan --> execution["[Metric] Execution cost"]
  recall --> decision["[Objective] Feasible operating region"]
  execution --> decision
~~~

Text equivalent:

- Task requirement determines the state budget.
  - The recurrent boundary has finite-precision capacity.
  - Selective dynamics, feature accumulation, and delta correction define alternative update mechanisms.
  - Each mechanism requires an appropriate parallel schedule.
- Hybrid composition combines selected recurrent mechanisms with attention caches.
  - Boundary restoration preserves the complete accepted prefix.
  - Recall and copying test information access.
- Execution cost and task quality jointly determine the feasible operating region.


~~~figure
id: fig-17.1
kind: cycle
title: "Architecture evaluation loop"
caption: "Declare the task and state budget, choose a mechanism, verify its operator, evaluate quality and cost, and revise the allocation from evidence."
placement: inline
anchor: concept-map
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.22"
alt: "Declare the task and state budget, choose a mechanism, verify its operator, evaluate quality and cost, and revise the allocation from evidence."
spec: {"stages":[{"id":"task","label":"Task and state budget","kind":"objective"},{"id":"model","label":"Sequence mechanism","kind":"model"},{"id":"check","label":"Operator verification","kind":"process"},{"id":"quality","label":"Quality by task and length","kind":"metric"},{"id":"cost","label":"State and execution cost","kind":"metric"}],"edges":[{"from":"task","to":"model"},{"from":"model","to":"check"},{"from":"check","to":"quality"},{"from":"quality","to":"cost"},{"from":"cost","to":"task","kind":"feedback"}]}
~~~

The map separates a representation decision from an execution decision. A state update can be mathematically valid while its proposed parallelization is incorrect or inefficient. Conversely, an optimized kernel can accurately compute an operator whose memory is insufficient for the intended task. Following both paths prevents either result from being used as evidence for the other.

## Position in the book

| Relationship | Chapters and purpose |
|---|---|
| Prerequisites | [02 — Mathematical and statistical foundations](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/README.md); [13 — Dense design](../ch13-dense-transformer-design-and-parameter-allocation/README.md); [14 — Attention and cache representations](../ch14-attention-architectures-and-cache-representations/README.md); [15 — Effective information access](../ch15-position-long-context-and-effective-information-access/README.md) |
| Siblings (same part) | [16 — Mixture-of-experts architectures](../ch16-mixture-of-experts-architectures/README.md), which changes parameter activation rather than temporal memory |
| Downstream | [27 — Kernels](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/README.md); [42 — Inference resource models](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/README.md) |
| Trades off with | [14 — Explicit history storage](../ch14-attention-architectures-and-cache-representations/README.md) and [15 — Long-context access](../ch15-position-long-context-and-effective-information-access/README.md) |

## Sections

| Section | Title | What changes here | Primary evidence labels |
|---|---|---|---|
| [17.1](17-1-recurrent-state.md) | Recurrent state | A prefix is replaced by a complete finite-precision state contract | MATHEMATICALLY-DERIVED |
| [17.2](17-2-state-space-models.md) | State-space models | Structured dynamics become input dependent and require a compatible execution schedule | PAPER-REPORTED; MATHEMATICALLY-DERIVED |
| [17.3](17-3-linear-attention.md) | Linear attention | Future reads operate through accumulated feature statistics | PAPER-REPORTED; MATHEMATICALLY-DERIVED |
| [17.4](17-4-delta-rule-mechanisms.md) | Delta-rule mechanisms | A write corrects an existing association after declared forgetting | PAPER-REPORTED; MATHEMATICALLY-DERIVED |
| [17.5](17-5-hybrid-composition.md) | Hybrid composition | Layers own different kinds of temporal state within one model | OFFICIAL-DOCUMENTATION; DERIVED |
| [17.6](17-6-evaluation-boundaries.md) | Evaluation boundaries | Comparisons are conditioned on task, length, quality, state, and execution boundaries | DERIVED; UNVERIFIED |

Read the first section before interpreting any constant-memory claim. Read the delta derivation before treating forgetting and replacement as interchangeable. Researchers primarily concerned with deployment can then move to hybrid state ownership and the evaluation protocol, returning to each operator's derivation when a correctness discrepancy appears.

## Artifact

**PROPOSAL.** The chapter artifact is **a sequence-model comparison under explicit state budgets**. Its specification is in [verification.md](verification.md); no measured result files are fabricated. The deliverable contains an operator manifest, architecture ledger, state inventory, workload manifest, quality records, execution records, and a decision report.

The operator manifest records update equations, masks, initialization, normalization, gate placement, and reset semantics. The state inventory gives shapes, dtypes, ownership, byte counts, and restoration rules for every persistent component. Workload records separate independent information count from token length. Execution records identify hardware, revisions, timing boundaries, and whether a result concerns prefill or decode.

The decision report joins these records only after correctness checks pass. A useful result can be a failure boundary: for example, a workload region in which memory remains bounded but exact recall does not meet the declared threshold. Such a result is scientifically informative without being converted into a universal architecture judgment.

## Verification

**PROPOSAL.** Compare recall and generation quality as sequence length grows while separately measuring persistent state and compute. First verify the operator identities and complete-state replay; then evaluate held-out tasks with fixed mappings and scoring rules. Report matched-parameter, matched-training-compute, and matched-state panels separately. A crossover claim requires measurements within the tested range and satisfaction of the stated quality threshold. The full protocol specifies retained failure records and unresolved evidence in [verification.md](verification.md).

## Lineage

**PAPER-REPORTED.** Dates refer to the cited work's first listed publication or preprint, with revised versions recorded in [references.md](references.md).

- 2020 · Linear Transformers [R17.2] · conceptual ancestor.
- 2023 · Mamba [P11] · alternative branch.
- 2024 · Structured state-space duality and Mamba-2 [R17.1] · engineering optimization.
- 2024 · Gated Delta Networks preprint [P12; revised 2025] · alternative branch.
- 2025 · Nemotron-H [R17.4] · current frontier.


~~~figure
id: fig-17.2
kind: lineage
title: "From feature state to hybrid composition"
caption: "Source-dated conceptual and engineering developments. The dates establish lineage, not a current performance ranking."
placement: inline
anchor: lineage
evidence: PAPER-REPORTED
source: [R17.2, P11, R17.1, P12, R17.4]
alt: "Source-dated conceptual and engineering developments. The dates establish lineage, not a current performance ranking."
spec: {"entries":[{"year":2020,"work":"Linear Transformers","cite":"R17.2","relation":"conceptual ancestor"},{"year":2023,"work":"Mamba","cite":"P11","relation":"alternative branch"},{"year":2024,"work":"Structured state-space duality","cite":"R17.1","relation":"engineering optimization"},{"year":2024,"work":"Gated Delta Networks preprint","cite":"P12","relation":"alternative branch"},{"year":2025,"work":"Nemotron-H","cite":"R17.4","relation":"current frontier"}]}
~~~

Here “current frontier” is the book's lineage relation for a recent documented direction, not a claim that the cited model leads all benchmarks in September 2026. Historical mechanisms remain useful because they reveal which assumptions later designs change. Current documentation provides implementation surfaces; it does not retrospectively rewrite the original paper's conditions.

## Terms owned here

| Term | Canonical meaning | Owner |
|---|---|---|
| Recurrent-state contract | Complete prefix-dependent values required to reproduce continuation | [17.1](17-1-recurrent-state.md) |
| Selective state-space update | State-space propagation with declared input-dependent coefficients | [17.2](17-2-state-space-models.md) |
| Associative feature state | Outer-product and normalization statistics for a specified factorized kernel | [17.3](17-3-linear-attention.md) |
| Delta-rule state update | A write proportional to a value-prediction residual at the incoming key | [17.4](17-4-delta-rule-mechanisms.md) |
| Heterogeneous sequence state | Different temporal storage primitives aligned to one accepted prefix | [17.5](17-5-hybrid-composition.md) |
| State-budget comparison | Quality/cost evaluation with complete prefix-dependent storage constrained and reported | [17.6](17-6-evaluation-boundaries.md) |

## Reference-stack coverage

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #14 NVIDIA Research | — | Gated DeltaNet and Nemotron-H primary reports | [Papers](https://research.nvidia.com/publications) | 17.4–17.5 | PAPER-REPORTED |
| §1 lab | #5 Alibaba Qwen | — | Official Qwen3-Next hybrid model card | [Models](https://huggingface.co/Qwen) | 17.5 | OFFICIAL-DOCUMENTATION |
| §1 lab | #27 Hugging Face Research | — | Maintained Transformers model-definition surface | [Code](https://github.com/huggingface) | 17.1, 17.2, 17.4, 17.5 | OFFICIAL-DOCUMENTATION |
| §2 conference | #2 ICML | — | Archival linear-attention and SSD papers | [Proceedings](https://proceedings.mlr.press/) | 17.2–17.3 | PAPER-REPORTED |
| §3 discovery source | #1 arXiv | — | Versioned Mamba, Gated DeltaNet, Zoology, and Nemotron-H manuscripts | [Discovery](https://arxiv.org/) | 17.1–17.6 | PAPER-REPORTED |
| §4 system | #17 PyTorch | Model / autograd framework | Tensor reference design and documented matrix exponential | [docs/code](https://pytorch.org/docs/stable/) | 17.1–17.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #26 Hugging Face Transformers | Model definition / adaptation | Current hybrid architecture integration surface | [docs/code](https://huggingface.co/docs/transformers/) | 17.1–17.6 | OFFICIAL-DOCUMENTATION |
| §4 system | #6 Triton language | Kernels / numerics / collectives | Associative-scan primitive and kernel boundary | [docs/code](https://triton-lang.org/) | 17.1–17.6 | OFFICIAL-DOCUMENTATION |

**Inspection dimensions applied.** Parallelism and Kernels are analyzed through affine scans, structured chunks, and sequential generation (§§17.1–17.4). Precision and Memory are explicit in every state formula. Communication and Checkpointing enter through sharded ownership and complete-state restoration (§§17.1, 17.5). Inference, Metrics, Reliability, and Reproducibility govern the evaluation ledger (§17.6). Post-training performance is not inferred from architecture descriptions.

The named stack systems have different responsibilities. A framework reference checks tensor semantics; a model integration specifies complete architecture behavior; a kernel primitive supplies a low-level operation. Naming all three is not a claim that each independently implements every mechanism. No implementation outside the reference stack is claimed or required by this manuscript.

## Source route

Use the stack's lab-first route to find the official disclosure, the conference route to check archival identity, the paper cascade to inspect equations and revisions, and the system route to verify implementation documentation. Concrete filled-in queries are:

1. Lab protocol: site:research.nvidia.com/publications "Gated Delta" OR site:arxiv.org/abs "NVIDIA" "Gated Delta".
2. Lab protocol: site:qwenlm.github.io "Qwen3-Next" OR site:arxiv.org/abs "Qwen" "hybrid".
3. Conference workflow: site:proceedings.mlr.press "Transformers are SSMs".
4. Paper cascade: site:arxiv.org/abs "Zoology" "recall".
5. Training-stack protocol: "Triton language" official documentation associative_scan.
6. Training-stack protocol: "PyTorch" official documentation matrix_exp.

Discovery routes locate evidence; claim support comes from the exact pages recorded in references.md. Source revision, access date, and tested runtime version are separate fields. A moving page does not establish a pinned implementation.

## Status

**Manuscript draft, 2026-09-27.** All six planned sections are developed with equations, algorithms, experiments, failure analysis, and chapter-local figures. **UNVERIFIED:** trained quality, device timings, energy, monetary cost, and workload crossovers. **NOT-DISCLOSED:** any named model internals not present in the inspected disclosure; none are filled in by inference.

Mathematical examples are illustrative and explicitly bounded. Proposed experiments remain proposals. Editorial consistency checks establish that the manuscript's records, equations, and figures agree; they cannot establish universal correctness or a benchmark result. Moving documentation must be pinned before a reproduction study.

