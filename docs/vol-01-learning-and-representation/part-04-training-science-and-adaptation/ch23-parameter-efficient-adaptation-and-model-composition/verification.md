---
id: ms.verification.23
entity_type: verification
title: Verification — Parameter-efficient adaptation and model composition
short_title: Verification 23
volume: 1
part: 4
chapter: 23
section: null
slug: verification
parent: ms.chapter.23
prev_sibling: ms.section.23.6
next_sibling: ms.references.23
children: []
prerequisites: [ms.chapter.6, ms.section.23.1, ms.section.23.2, ms.section.23.3, ms.section.23.4, ms.section.23.5, ms.section.23.6]
downstream: [ms.chapter.24, ms.chapter.40, ms.chapter.44, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [adaptation, evaluation, serving], mechanism: [verification, parameter_efficient_adaptation], feedback_setting: [], modality: [text]}
papers: [P14, P15]
implementations: [impl.hugging-face-peft, impl.hugging-face-transformers, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [ASSUMED, MATHEMATICALLY-DERIVED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# Verification — Chapter 23

## Artifact specification

[UNVERIFIED] The plan's artifact is an **adapter lifecycle and composition study**. This chapter specifies its contracts; it does not contain trained task artifacts, measured memory savings or serving benchmarks.

| Record | Required fields |
|---|---|
| Common reference | Base/tensor hashes; tokenizer; template; positional/attention conventions; task-head identity; permitted data |
| Adaptation | Every trained name/shape; rank/scale/initializer; extra modules; frozen-state mask; optimizer groups; numerical representation |
| Training | Valid-token exposure; accepted/rejected clocks; seeds/RNG; data cursor; checkpointing policy; optimizer/scheduler state |
| Quantization | Codebook; block layouts; packed values/scales; nested metadata; decoding dtype; exact frozen identity |
| Composition | Source deltas; common base; coefficients; trim/tie policies; DARE masks; compression tolerances; validation selection |
| Deployment | Unmerged/merged/requantized exports; runtime commit; residency/alias policy; invocation boundary; cache lineage |
| Evidence | Per-example predictions; target/retention/generalization slices; uncertainty; resource timeline; failures and rejects |

## Verification task

[ASSUMED] Use one openly available decoder checkpoint and two authorized, disjoint domain corpora selected before execution. Materialize train, configuration-validation and untouched final-test manifests, plus retention and shifted-generalization sets. Choose model dimensions, context and batch size that allow the full-update baseline on the available device. Freeze tokenizer/template/data order. Hardware and exact model are **NOT-DISCLOSED** until a run is registered; this is an unexecuted proposal.

### Experiment 23.1 - Matched-quality full and adapter tuning

| Field | Proposed protocol |
|---|---|
| Hypothesis | An adapter configuration in the declared finite search can meet target/retention gates with lower total peak resident memory than separately tuned full updating |
| Setup | Common base, objective and data manifest; accepted-state loop from Chapter 19; equal valid-token exposure as the primary training budget |
| Independent variables | Full tuning versus LoRA; ranks 4/16/64; attention-only versus attention-plus-MLP targets; original versus rank-stabilized scaling; full-precision versus specified quantized frozen base |
| Controlled variables | Tokens, serialization/masks, evaluation data, batch/context, checkpoint policy, seed set and comparable learning-rate-search budget |
| Dataset/workload | Registered domain training data, independent validation/test data, retention controls and shifted-source/time slices; deduplicate across boundaries |
| Hardware | Record device model/count/memory, host RAM, interconnect, driver and power instrumentation; no hardware is assumed to have been tested |
| Metrics | Per-example task quality; valid-token NLL; retention/generalization; seed variation; peak allocated/reserved device bytes; host peak; trained scalars; elapsed training/evaluation/export time |
| Baselines | Unchanged base; separately tuned full update; conventional LoRA; quantized-base adapter with exact decoding identity |
| Expected result | Conditional: lower-memory claim passes only for configurations satisfying every predeclared gate; the direction of quality or wall-clock differences is not assumed |
| Ablation | Fixed-target rank sweep; matched-scalar target allocation; scaling/rate controls; quantized-base identity; trained-head inclusion |
| Interpretation | A failed feasible set rejects the claimed benefit for this model/data/search budget; it does not prove impossibility for every adapter method |
| Threats to validity | Small search, test leakage, contamination, one model/device, unequal effective exposure, hidden pretraining overlap, stochastic training and changed kernels |

[ASSUMED] Begin with three fixed training seeds and a cap of 2,000 accepted updates per trial, recording actual valid tokens. Select a learning-rate grid before testing, with the same number of configuration trials per family. These are finite protocol inputs, not source-reported optimal settings. If the full baseline has not reached the registered validation criterion, its quality reference remains unresolved rather than silently weakened. A larger follow-up budget must be separately registered.

[ASSUMED] For a higher-is-better task metric measured on $[0,1]$, start with an adapter noninferiority margin of 0.01 relative to the selected full-update control, and a maximum retention regression of 0.02 relative to the unchanged base. Use one-sided paired confidence bounds, independent problem/document resampling, and simultaneous gate control as in Eq. 23.34. These illustrative tolerances require stakeholder justification before execution; they are not universal adequacy thresholds. Report raw scores, differences and intervals.

[MATHEMATICALLY-DERIVED] Compare memory only after quality acceptance. A method with smaller factors but failed quality cannot occupy the matched-quality frontier. Report total peak over a common train/evaluate/save interval, not only weights or moments. Track the components in Eq. 23.5/23.12 and allocation/reservation separately. Host offload/paging can move the peak between devices rather than remove it. Timing includes warmup and its separately disclosed exclusion policy. Energy and monetary conclusions require actual instrumentation/prices and remain absent here.

### Experiment 23.2 - Artifact, composition and serving closure

| Field | Proposed protocol |
|---|---|
| Hypothesis | Algebraically compatible exports preserve their declared function, while identity/scale/cache violations are rejected or measurably fail parity |
| Setup | Fixed mathematical probe inputs plus accepted artifacts from Experiment 23.1; deterministic dropout-free reference; finite export/workload list |
| Independent variables | Unmerged/merged/requantized paths; update versus factor averaging; TIES trim; DARE masks; correct/wrong base; clean/adapted caches; cold/warm residency |
| Controlled variables | Same source factors, tokens, templates, quantization identity, evaluation precision, sampling policy and request traces |
| Dataset/workload | Fixed-history logit probes; complete generation; per-task composition tests; shared-base multi-adapter arrivals with declared popularity/length/rank distributions |
| Hardware | Same registered device where feasible; record every changed backend/device/parallelism configuration as a separate comparison |
| Metrics | Maximum/relative tensor error; logit error and KL; task/retention slices; identity mismatch rejection; resident bytes; loading, queue, prefill and decode times |
| Baselines | Pristine base; exact unmerged reference; exact concatenated correction; each constituent task artifact; uncached complete recomputation |
| Expected result | Exact-arithmetic identities provide analytical references; finite-precision outcomes and measured timings remain unknown |
| Ablation | Duplicate merge; lost scale; missing magnitudes/head; changed block metadata; incompatible base; token reorder; cache reuse after activation; alias reload during a pinned request |
| Interpretation | Isolate serialization/operator defects from task interference, and cache-history defects from ordinary rounding |
| Threats to validity | Probe coverage, nondeterministic kernels, different arithmetic reassociation, synthetic popularity, short generation, insufficient warmup and workload-specific scheduling |

[ASSUMED] For the first FP64 toy-matrix comparison, use absolute tolerance $10^{-10}$ and relative Frobenius tolerance $10^{-9}$ with norm floor $10^{-12}$. These tolerances are illustrative analytical-check inputs. BF16, quantized and end-to-end Transformer paths need independently registered error budgets and held-out behavioral gates; they do not inherit FP64 thresholds. Inject wrong-base and duplicate-merge cases deliberately. A parser successfully loading the tensors is not a pass.

[MATHEMATICALLY-DERIVED] Check exact update concatenation before optional SVD compression. Record the compression residual and per-task behavior. For DARE, repeated masks estimate coordinate means/variances with uncertainty; deterministic output equality is not expected from its parameter expectation identity. Test TIES zero/tie conventions and missing task modules explicitly. Source delta magnitudes and sign disagreement remain diagnostics rather than task-quality guarantees.

[MATHEMATICALLY-DERIVED] Serving experiments must pin request versions across reload, admit only compatible artifacts and preserve token/output association after heterogeneous grouping. Test cancellation and eviction with outstanding work. For activated adapters, compare clean-prefix reuse against complete recomputation, then attempt adapted-prefix reuse as a negative case. The state-history boundary in Eq. 23.25–23.26 is the correctness target.

| Performance context field | Required before any measured latency/throughput is published |
|---|---|
| Hardware | Device model/count, host/link, capacity and placement |
| Model | Base and task artifact identities, projection layout and ranks |
| Precision | Storage, decode, task factors, KV and accumulation |
| Sequence length | Prompt and generated lengths, including invocation position |
| Input/output distribution | Trace source, popularity, rank distribution and length histogram |
| Concurrency | Arrival process, active/queued requests, admitted adapters and KV occupancy |
| Runtime version | Engine/backend commit, configuration, graph/caching modes |
| Measurement boundary | Cold/warm loading, queue, prefill, decode and full-pipeline inclusion |

## Topic-completeness audit

[UNVERIFIED] This is an editorial map, distinct from the proposed experiments. Each row maps the required topic to its own treatment. Across a row, **S/W** mean Scope/Why this exists (problem, baseline, axis); **F/M** mean Formulation/Mechanism (IO, shapes, objective, assumptions, derivation, methodology); **A** means Algorithm (state, order, invariant, failure, termination); **I** means Implementation (operators, framework/layer, resources); **E/O** mean Experimental design/Observations (actual reported protocol, outcome and limits); **X/L/R** mean Siblings/Extensions/Limitations/Reproducibility (alternatives, changed mechanism, regime, artifacts and gaps). Links below identify the canonical file; the named headings are stable manuscript anchors.

| Topic / variant | S/W and F/M mathematical contract | A: executable procedure | I: realization and resources | E/O: primary protocol and interpretation | X/L/R: validity and closure |
|---|---|---|---|---|---|
| Full updating | [23.1](23-1-adaptation-families.md#formulation), Eq. 23.1–23.2, all-coordinate map | Algorithm 23.1; Chapter 19 accepted transition | Base gradients/moments/activations; full artifact | LoRA controls [P14], §5–7; learning/retention control [R23.20], §3–4 | Full feasible directions do not guarantee retention; exact base/restart state |
| Bottleneck adapters | 23.1 F/M; nonlinear down/up map, biases and insertion count | Algorithm 23.1 restricted graph; initialization/placement in Methodology | Extra norm/head state; nonlinear inference cannot use linear merge | [R23.1], §2.1 Fig. 2; §3.1/3.6 | Interface/placement matters; one-module count is not whole-model cost |
| Soft prompt tuning | 23.1 F/M; $p\times d$ input embeddings | Frozen-stack differentiation, Algorithm 23.1 | Prompt positions add sequence work and stored task state | [R23.2], §2–3 Fig. 1, §5 | Architecture/scale/domain limits; zero-length boundary |
| Prefix tuning | 23.1 F/M; layer KV inputs and direct-prefix count | Training reparameterization then materialized export | Attention cache/interface cost separate from prompt embeddings | [R23.3], §4.2–4.3, §5–7 | Decoder reconstruction stated; encoder-decoder interfaces differ |
| Selective training / BitFit | 23.1 F/M; coordinate selector and task head | Selected gradient map, Algorithm 23.1 | Existing tensors remain resident; frozen mask check | [R23.4], §3–4 Tables 1–3 | Masked-LM evidence; not decoder-wide guarantee |
| Ordinary LoRA | [23.2](23-2-lora-mechanics.md#mechanism), Eq. 23.4–23.6 | Algorithm 23.2; Gaussian/zero init and merge-once gate | Targets/orientation/GQA widths, Eq. 23.5, extra state | [P14], §4–7, rank/target ablations | Rank ceiling, factor conditioning, deterministic merge limits |
| rsLoRA | 23.2 M, Eq. 23.7; initialization and rank-limit assumptions | Algorithm 23.2 with $\alpha/\sqrt r$ | Same factor layout; scaling changes gradients | [R23.6], Definition 3.1/Theorem 3.2, §4 Figs. 2–3 | Asymptotic stability is not finite-rank quality; crossed sweeps |
| LoRA+ | 23.2 M, Eq. 23.31; grouped rates and common state | Paired factor transition on Algorithm 23.2 clock | Group moments/decay; same export operator | [R23.7], Algorithm 1, §5, Appendix C; task-dependent and weak-gain setting | Width assumptions and selection caveat; ratio/seed/search records |
| DoRA | 23.2 M, Eq. 23.8/23.32; magnitude/direction and two gradients | Joint factors/magnitudes; valid norms; complete normalized merge | Norm graph cost, extra magnitudes, detached distinction | [R23.8], §4.3, §5.1, Tables 1/7–8 | Zero norms, transpose axis and inherited baselines; save magnitudes |
| RandLoRA | 23.2 Extensions, Eq. 23.10/23.33; frozen random bases and learned diagonals | Zero-correction explanatory init; bounded coefficient transition | Random-operator storage/products; coefficient count differs from LoRA | [R23.16], §4–5; supplement B/C.6.1 | Conditional full rank; divisibility, basis identity, absent full Llama-3 control |
| Quantized-base adaptation | [23.3](23-3-quantized-base-adaptation.md#formulation), Eq. 23.11–23.12 | Algorithm 23.3 immutable quantization identity | Packed/decoded/task/moment/activation states separated | [P15], §3–5 Tables 2–3; §7 limits | Changing decoded base changes function; artifact closure |
| NF4 and nested scales | 23.3 M; normal-distribution codebook, zero, block reconstruction | Exact encoder/decoder state within Algorithm 23.3 | Payload, block metadata, dtype and boundary accounting | [P15], §3 Eq. 4–6; §4 ablations | Distribution premise and metadata error; exact layout required |
| Paged optimization | 23.3 M; state transfer lower bound | Bounded accepted update still owns optimizer state | Device/host bytes, link contention, faults and elapsed time | [P15], §3; source lacks a universal paging-throughput guarantee | Transfer cost not erased by offload; host/reserve limits |
| LoftQ initialization | 23.3 Extensions, alternating quantizer/residual low-rank objective | Source Algorithm 1 reconstruction; finite cap/tolerance | Quantizer/factorization workspace before task training | [R23.10], §3–4 Tables 1–4 | Nonconvex/quantizer-dependent; record source base and stopping |
| Selection and task vectors | [23.4](23-4-multi-task-composition.md#formulation), Eq. 23.15–23.19 | Compatibility gate, selection branch, exact concatenation | Dense traffic versus growing factor rank | [R23.11], §2–5, Appendix D | Common reference, heads and gauge; negation is not deletion proof |
| TIES | 23.4 M, trim/elect/disjoint mean | Algorithm 23.4; explicit deterministic tie/zero policy | Selection masks, sorting/workspace, dense/adapter exports | [R23.12], §4.2 Algorithm 1, §6–7 ablations | Per-task interference and validation scaling; exact masks |
| DARE | 23.4 M, Eq. 23.20 coordinate moments | Independent mask then rescale, followed by declared merge | Sparse masks, seed and retained entries | [R23.13], §3, §4.2–4.7, including wrong-base failure | Unbiased parameters do not imply unbiased outputs; drop-rate limits |
| Merged/unmerged and heterogeneous serving | [23.5](23-5-serving-implications.md#formulation), Eq. 23.22–23.23 | Algorithm 23.5, immutable identity and atomic pin/evict | Shared base, segments, loading, KV/reserve budget | [R23.14], §4–7; [R23.15], §5–7 | Historical baseline boundaries, random weights; cold/warm trace records |
| aLoRA activation | 23.5 Extensions, Eq. 23.25–23.26 causal induction | Invocation-trained rule; clean/adapted state partition | Prefix reuse requires prior function history; no constant merge | [R23.17], §2–4, Appendix E–G | Accuracy variability/exclusions; invocation tokenization and cache identity |
| Activated-adapter serving extension | 23.5 Extensions; base-aligned hash/mask account | Admission/cache protocol with activation-aware validity | Source-specific modified vLLM and H100/BF16 setup | [R23.18], §3–5, Appendix A–B | Adapter-stage timer, unequal ranks, synthetic weights, batching future work |
| Evaluation and parity | [23.6](23-6-evaluation.md#mechanism), Eq. 23.27–23.30/23.34 | Algorithm 23.6 finite selection then untouched tests | Full peaks, lifecycle costs, export/runtime identity | [R23.20], §3–4; [R23.21], §3–5; source-specific uncertainties | Equal tokens/time/parameters differ; slice/multiplicity/seed uncertainty |
| Spectral diagnostic | 23.6 Extensions, sign-invariant alignment and rank-energy definition | Declared layer/top-$k$/threshold; bounded decomposition and optional intervention | SVD workspace/precision; new artifact repeats gates | [R23.21], Definition 3.1/Algorithm 1, §5, Appendix G/N | Complete-basis span, sign/repeated-spectrum ambiguity; not quality certification |

## Evidence gaps and status

| Gap | Status | Consequence |
|---|---|---|
| Training, composition and serving experiments proposed here | UNVERIFIED | No local quality, memory, throughput, energy or parity claim |
| Exact revisions of several unversioned paper PDFs | UNVERIFIED | Ledger identifies inspected full surface; no commit/revision is invented |
| Mutable vLLM latest documentation | UNVERIFIED | API semantics are disclosed; current installed behavior is untested |
| Deployment task tolerances and production working set | NOT-DISCLOSED | No accepted deployment or universal serving choice |
| Pretraining overlap/private retention distribution | NOT-DISCLOSED | Public-suite retention is a bounded observation |
| Search-only 2026 successor leads | UNVERIFIED | No mechanism/results claims from abstracts or discovery snippets |

[UNVERIFIED] Editorial status remains manuscript draft. Source-reported methods/results, derived examples and proposed tests are separated throughout. All six sections use the contract headings and observation layers; each contains one inline technical diagram and two rail instruments, with a dated chapter lineage. Compiler/schema/math/link checks validate manuscript structure and rendering only; they are not adaptation experiments.
