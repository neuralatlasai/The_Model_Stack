---
id: ms.verification.40
entity_type: verification
title: Chapter 40 verification and topic audit
volume: 2
part: 7
chapter: 40
section: null
slug: verification
parent: ms.chapter.40
prev_sibling: ms.section.40.6
next_sibling: ms.references.40
children: []
prerequisites: [ms.section.40.6]
downstream: [ms.chapter.42, ms.chapter.43, ms.chapter.48]
related: []
relations: []
axes: {lifecycle: [evaluation, inference], mechanism: [quantization_verification], feedback_setting: [], modality: [text]}
papers: [P15, P33, P34]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.vllm, impl.llama-cpp]
benchmarks: []
datasets: []
status: {maturity: open, disputed: false}
evidence_summary: {labels_used: [ASSUMED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 40 — Verification and topic-completeness audit

## Artifact specification

[KNOWN] The planned artifact is **a quantized checkpoint with calibration and runtime evidence**. This specification does not claim those experimental files exist.

| Proposed artifact | Required fields |
|---|---|
| identity.json | Source model/revision/hash; tokenizer/revision/hash; template; license; converter repository/commit; quantizer/configuration; creation timestamp |
| precision-map.csv | Tensor/operator; target class; logical shape; original dtype; codebook; code width; effective width; group axis/size; scale/zero dtype; exclusions |
| calibration.jsonl | Dataset/snapshot/hash; sample identity; role; token count; length; domain/language; selection seed; preprocessing/template; train/selection/evaluation membership |
| calibration-statistics.csv | Operator; range/percentiles; saturation count; moments; sensitivity; candidate score; scoring reference; observer/freeze schedule |
| packed checkpoint and config | Codes; scales; zero points; codebook identity; permutations; padding; layout version; source hash; export schema; sharding |
| decoded-parity.csv | Tensor; shape; code round-trip; exact scale bytes; absolute/relative error; zero handling; operator tolerance; pass/fail |
| dispatch.csv | Operator; shape; dtype tuple; device; kernel/backend; native/fallback; workspace; compilation/capture mode; support error |
| task-results.jsonl | Immutable input; reference/quantized outputs; sampler/seeds; caps; evaluator/version; correctness; termination/failure; prompt/output lengths |
| resource-records.csv | Device/driver/runtime; workload; concurrency/arrival process; cache state; warmup; file/live/peak bytes; scales/metadata; TTFT/TPOT/ITL/E2E; throughput/goodput; failures |
| cost-records.csv | Conversion/recovery resources; power-measurement boundary if available; service resources; amortization horizon; accepted-task denominator |

[MATHEMATICALLY-DERIVED] Complete artifact identity includes companion configuration and template, because codes alone do not specify a decoder or conditional model. A scalar effective-bit number is insufficient when some tensors remain unquantized.

## Verification task

### Experiment 40.1 — Numerical construction and export parity

**Hypothesis.** [ASSUMED] Packing/reloading preserves the intended quantized values, and supported kernels approximate their declared reference operator within predeclared tolerances.

**Setup.** [ASSUMED] Pin Qwen3-8B source, tokenizer and all tooling before construction. Use the same source for BF16 and quantized branches. Begin with a nearest-rounding weight-only artifact; add one source-supported compensated or scaled variant. A candidate whose device path is unsupported is retained as an explicit failure or measured fallback, not silently removed.

**Independent variables.** [ASSUMED] Quantizer construction; group size 32/128; supported native path versus declared decode fallback; representative matrix shapes.

**Controlled variables.** [ASSUMED] Source weights, preprocessing, template, input values, device, runtime, accumulation dtype and reference operator boundary.

**Dataset/workload.** [ASSUMED] Include zero/constant tensors, midpoint values, range endpoints, saturation cases, odd group tails and captured model-layer inputs. Captured inputs use a calibration split separate from final task evaluation. Values are numerical fixtures, not empirical model results.

**Hardware.** [ASSUMED] One accelerator on which BF16 baseline and selected quantized path both fit; exact device, memory, driver and kernel revisions must be written before execution. This unresolved equipment identity blocks a reproducible run, not the mathematical protocol.

**Metrics.** [ASSUMED] Exact code and metadata round-trip; decoded tensor error; maximum absolute and normalized operator error; nonfinite counts; actual kernel dispatch; peak temporary memory.

**Baselines.** [ASSUMED] BF16 source operator and a high-precision multiplication of the same decoded quantized weights. The latter isolates runtime error from representation error.

**Expected result.** [ASSUMED] Code and metadata round-trip should be exact; operator comparison should satisfy its preregistered dtype/shape-specific tolerance. Failure rejects artifact correctness even if a task score appears acceptable.

**Ablation.** [ASSUMED] Disable packing permutation, alter one scale axis or force a fallback in controlled negative fixtures. These deliberately invalid fixtures must fail validation.

**Interpretation.** [MATHEMATICALLY-DERIVED] Passing establishes correctness for exercised representations/shapes. It does not establish task retention or coverage of unexercised dispatch paths.

**Threats to validity.** [MATHEMATICALLY-DERIVED] Reference and candidate sharing the same faulty decoder can agree. An independently written decoder and explicit group/code fixtures reduce that circularity.

### Experiment 40.2 — Task and trajectory preservation

**Hypothesis.** [ASSUMED] The accepted quantized branch remains within a one-percentage-point quality-loss budget on each declared primary stratum, including long contexts and long generated responses.

**Setup.** [ASSUMED] Freeze calibration and recovery decisions before opening final task outcomes. Use disjoint calibration, selection and acceptance identities. Proposed initial calibration budget is 128 sequences of 512 tokens; this is a controlled pilot, not a factual claim of representativeness.

**Independent variables.** [ASSUMED] Precision map, weight-only versus supported weight/activation/cache combinations, calibration population and response-length stratum.

**Controlled variables.** [ASSUMED] Prompt/template/tokenizer, source revision, sampler, token caps, evaluator, correctness criteria and aggregate normalization.

**Dataset/workload.** [ASSUMED] Preregister independently held-out code, mathematical reasoning, instruction compliance and long-context retrieval tasks with exact dataset versions and contamination records. At least 512 independent problems per broad primary stratum is an initial planning budget; sample-size adequacy must be recalculated from paired variance and required power.

**Hardware.** [ASSUMED] Same device/runtime as Experiment 40.1, with all actual fallback choices retained.

**Metrics.** [ASSUMED] Paired task differences and problem-clustered uncertainty; conditional KL on common prefixes; generation completion, EOS, invalid-format and timeout rates; quality by prompt/output length; numerical tails.

**Baselines.** [ASSUMED] BF16 and nearest-rounding quantization at the same eligible-bit budget. Recovery branches additionally retain the pre-recovery quantized checkpoint.

**Expected result.** [ASSUMED] Acceptance requires the lower bound of the paired 95% interval for quantized-minus-reference primary quality to exceed −1 percentage point. This is a chosen decision threshold, not a research constant. Insufficient precision is inconclusive and cannot be counted as passing.

**Ablation.** [ASSUMED] Evaluate single-target changes and their joint composition; short versus long calibration; alternate eligible precision maps. Selection uses the selection set, never the final acceptance set.

**Interpretation.** [MATHEMATICALLY-DERIVED] Small common-prefix KL plus task failure rejects KL as a sufficient acceptance proxy for that population. Preserved average accuracy with a failing critical length stratum rejects uniform deployment.

**Threats to validity.** [MATHEMATICALLY-DERIVED] Benchmark reuse, shared synthetic provenance, evaluator dependence, near duplicates and multiple comparisons can invalidate intervals or selection claims. Their records must remain explicit.

### Experiment 40.3 — Complete end-to-end resource frontier

**Hypothesis.** [ASSUMED] Quantization yields a useful memory or service-cost benefit after encoding, metadata, fallbacks, cache and workspace are counted at accepted quality.

**Setup.** [ASSUMED] Evaluate only fully identified artifacts, while retaining unsupported/failing conditions in the results ledger. Measure cold startup separately from steady state.

**Independent variables.** [ASSUMED] Prompt/output length, concurrency, batch/scheduler settings, native versus fallback path and cache precision.

**Controlled variables.** [ASSUMED] Hardware count/topology, source model, quality criteria, requests, arrival process, runtime, cache warmness, warmup and timing boundary.

**Dataset/workload.** [ASSUMED] Fixed request traces covering short-prefill/long-decode, long-prefill/short-decode and long-context concurrency. Report the actual distribution rather than just a maximum length.

**Hardware.** [ASSUMED] Fixed accelerator/node tuple from Experiment 40.1. A capacity-enabled fewer-device configuration is a separate comparison because it changes topology.

**Metrics.** [ASSUMED] File bytes; total live and loading-peak bytes; HBM traffic if measurable; TTFT, TPOT, ITL and E2E quantiles; throughput/goodput; failures; cost per accepted task; measured energy only if power traces exist.

**Baselines.** [ASSUMED] BF16 on the same hardware/concurrency and the declared quantized fallback. A separate best-feasible-batch comparison may analyze capacity benefit.

**Expected result.** [ASSUMED] At accepted quality, the artifact must reduce complete memory or cost per accepted task by at least 10% without violating the declared service SLO. The 10% margin is a practical pilot threshold and requires reconsideration for a deployment's actual utility.

**Ablation.** [ASSUMED] Count/decount encoding and expanded-weight workspace diagnostically while reporting only complete E2E values as acceptance evidence.

**Interpretation.** [MATHEMATICALLY-DERIVED] A faster GEMM with slower accepted requests rejects the inferred deployment acceleration. A smaller file with unchanged live memory rejects a capacity claim.

**Threats to validity.** [MATHEMATICALLY-DERIVED] Thermal/power changes, background load, compile caches, request-order effects and omitted errors can bias timing. Repeated windows and raw logs are required.

## Acceptance criteria

| Gate | Proposed criterion | Rejection or unresolved consequence |
|---|---|---|
| Representation | All code/layout/metadata fixtures exactly round-trip | Any mismatch rejects artifact |
| Operator | Declared finite outputs and preregistered dtype-specific tolerances | Tolerance not set before results makes gate unresolved |
| Data independence | Calibration/selection/final evaluation memberships disjoint and hashed | Benchmark-based selection must be disclosed; no independent claim |
| Quality | Paired lower 95% bound exceeds −1 point per primary stratum | Failed stratum rejects uniform deployment; underpowered interval inconclusive |
| Memory | Sum codes/scales/metadata/exclusions/cache/workspace plus allocator boundary | Unexplained bytes invalidate claimed savings |
| Execution | Every exercised layer/shape has native/fallback/rejection record | Missing dispatch prevents an executable-method claim |
| Benefit | At least 10% memory or accepted-task-cost improvement under SLO | Otherwise no deployment advantage established |
| Reproducibility | Immutable model/tool/config/hardware records and raw results | Missing identities block reviewed experimental artifact |

## What this edition did not do

[KNOWN] The three protocols are **unexecuted proposals**. No checkpoint was quantized, no recovery training was run, no source benchmark was reproduced, and no native kernel was exercised. Source-reported studies in the manuscripts remain separate from these proposals. Editorial source inspection and figure/schema validation are not model experiments.

## Topic-completeness audit

[KNOWN] Obligation codes below refer to CONTENT_CONTRACT §4.1: **P** problem/prior limitation; **F** formal contract; **M** methodology; **Q** mathematics; **A** bounded procedure; **I** implementation/execution; **C** resource accounting; **E** reported protocol; **O** observations; **S** alternatives; **L** documented lineage; **V** validity/failures; **R** reproducibility. Each section has all fifteen normative headings. Unless a topic-specific exception is stated, all thirteen obligations apply; the anchor set identifies where they are addressed. Source gaps constrain claims rather than licensing invented details.

| Required topic / substantive variant | Manuscript anchors and obligations | Primary source and exact locator | Unresolved gap / review consequence |
|---|---|---|---|
| Scale and zero point | 40.1 Formulation, Eqs. 40.1–4; Algorithm40.1; Implementation; all P–R | R40.5 §2.1–2.4, Eq.1 | Local kernel execution UNVERIFIED; analytical contract closed |
| Symmetric versus asymmetric ranges | 40.1 Formulation and zero-point expansion; Failure modes/Siblings; P,F,M,Q,A,I,C,E,O,S,L,V,R | R40.5 §2.1–2.2 | Range convention must be artifact-specific |
| Tensor/channel/group granularity | 40.1 Mechanism/Implementation; 40.4 SmoothQuant differential; all | R40.3 §2 Fig.3; §3 Table1 | Supported group/axis combinations UNVERIFIED locally |
| Clipping and saturation | 40.1 Eq.40.2, Algorithm40.1, Failure modes; all | R40.5 §3 simulated ranges; R40.6 §3 saturation | Optimum clipping percentile intentionally not universal |
| Quantization error and covariance | 40.1 Eq.40.3, nullspace counterexample; 40.4 Eq.40.13; all | P33 §3 Eq.1; R40.7 §3.2 Eqs.14–20 | Source-specific statistical generalization absent |
| Weights | 40.2 Mechanism/Implementation; 40.4 compensation/scaling; all | P33 §4 Algorithm1; P34 §3.2 | Runtime gain only after dispatch/measurement |
| Activations | 40.2 Mechanism; 40.4 Eq.40.16; all | R40.3 §4 Eq.3/Table2 | Static/dynamic range transfer workload-specific |
| Gradients / rounding relevance | 40.2 Mechanism stochastic expectation/variance; all | R40.6 §3 and §4.1–4.2 | Historical experiments do not establish low-bit LLM convergence |
| Optimizer states | 40.2 Eq.40.7 and state lifecycle; all | R40.4 §2.1–2.3, §3 | Modern exact package/kernel configuration UNVERIFIED |
| KV cache K versus V | 40.2 Eq.40.8, residual storage; all | R40.9 §3.2 Table2, §3.3 Algorithm1/Eq.3 | Source mechanism reconstructed; long-context transfer not guaranteed |
| Mixed-precision layer allocation | 40.2 Eq.40.6/Algorithm40.2; Siblings/Extensions; all | R40.18 “How AutoQuantize works,” grouped decisions; R40.20 “How KV AutoQuant works” | Separable sensitivity and modeled bits are surrogates |
| Calibration / representativeness | 40.3 Eq.40.9, prefix-input distinction, Experimental design; all | P33 §5 C4 setup; P34 §5.3; R40.10 §3.4 | Dataset hashes incomplete; held-out independence required |
| Outliers | 40.3 Mechanism; 40.4 scaling tradeoff; all | P34 §3.1 Tables1–2; R40.3 §3 Fig.4 | Magnitude is not universal task importance |
| Fake quantization | 40.3 Eq.40.11/Algorithm40.3; 40.6 Ascend boundary; all | R40.5 §3; R40.21 §3.2 | Real-runtime parity remains UNVERIFIED |
| Rounding optimization | 40.3 Eq.40.10; Algorithms40.1/40.3; all | R40.7 §3.3 Eqs.21–25, §5 Table2 | Vision source limits extrapolation to modern reasoning models |
| QAT recovery | 40.3 Eqs.40.11–12 and implementation; all | R40.22 “Quantization-Aware Training”; R40.10 §3 | Surrogate gradients have no general discrete-descent guarantee |
| QAD recovery | 40.3 Experimental design/Observations; 40.6 Extensions; all | R40.10 §3.1 Eq.1/Table1; §3.4 selection; AppendixA | Selection dependence and independent replication unresolved |
| Learned tied/dual scales | 40.3 Eq.40.12/Extensions/Implementation; all | R40.19 “How Scale Learning Works,” “Results” | Full repeated-seed evidence NOT-DISCLOSED |
| GPTQ | 40.4 Eqs.40.13–14/Algorithm40.4/costs/Observations; all | P33 §3–4, Algorithm1; §5 Tables5–6 | Direct-inverse book algorithm explicitly differs from optimized source |
| AWQ | 40.4 Eq.40.15 and scale tradeoff; all | P34 §3.2 Eqs.4–5; Tables1–2; §4.2 | No universal domain-transfer or modern runtime ordering |
| SmoothQuant | 40.4 Eq.40.16/Implementation/Observations; all | R40.3 §4 Eq.3/Table2; §3 Table1 | Per-channel diagnostic not represented as supported final GEMM |
| bitsandbytes / NF4 / FP4 | 40.4 Eq.40.17 and storage/compute distinction; all | P15 §3 Eq.4; R40.16 Linear4bit/LinearNF4/LinearFP4 | Current executable library/device tuple UNVERIFIED |
| LLM.int8() differential | 40.4 Mechanism/Siblings; P,F,M,Q,I,C,S,V,R; E/O restricted to mechanism scope | R40.8 §3.1–3.2/Fig.2 | No standalone benchmark case owned here; no speed claim imported |
| Integer versus low-bit floating | 40.4 Eq.40.17 and metadata arithmetic; all | R40.17 Table1/Fig.2; P15 §3 | Distribution-conditioned comparison, no unconditional ranking |
| Hardware-supported variants | 40.4/40.5 Implementation and dispatch; all | R40.15 hardware chart/backend selection | Documentation-only support; no CODE-VERIFIED claim |
| Packing and metadata | 40.5 Eqs.40.18–19/Algorithm40.5; all | R40.13 tensor/header structures; R40.14 “Format” | No exported artifact produced |
| Dequantization and kernel availability | 40.5 Eq.40.21/Implementation; all | P34 §4.2; R40.15 “Supported Hardware” | Peak workspace/traffic require measurement |
| GGUF | 40.5 Mechanism/Implementation/Siblings; all except training-data E (format has none) | R40.13 version3 structures/general.quantization_version; R40.23 quantize usage | Backend-specific realization untested |
| safetensors | 40.5 Mechanism/Siblings; all except training-data E (container has none) | R40.14 “Format” byte/header schema | Companion quantizer semantics mandatory |
| Conversion / export compatibility | 40.5 Eq.40.20/Algorithm40.5/Extensions; all | R40.20 composition/export flags; R40.14 format | Layout conversion distinguished from lossy requantization |
| Quality by task / length | 40.6 Eq.40.23, Experimental design and failure strata; all | R40.21 §3.1–3.3; R40.20 mixed results | Independent local task frontier UNVERIFIED |
| Numerical divergence | 40.6 Eq.40.22–24/Algorithm40.6; all | R40.10 Table1; own margin/chain-rule derivations | Prefix population limits sequence inference |
| Complete memory including scales | 40.1 Eq.40.4; 40.2 Eq.40.5; 40.5 Eq.40.21; 40.6 Mechanism; all | P15 §3/AppendixG; R40.13 format overhead | Loading/live/allocator boundaries unmeasured |
| Actual end-to-end speed | 40.6 Eq.40.25 and contextualized historical table; all | P33 Table6/AppendixA.2.2; R40.21 §4 | Changed-GPU historical comparison; no new speed evidence |

## Research questions and evidence needed

> **Open question.** [UNVERIFIED] Can local reconstruction or isolated-layer KL predict failure on rare expert routes and long generated trajectories? · *what evidence would settle it:* independently held-out trajectory strata, recorded routing/attention behavior, fixed calibration budgets and predictive calibration of local scores against task failures, including negative results.

> **Open question.** [UNVERIFIED] How much quality is lost by separable precision allocation compared with joint weight/activation/cache and runtime optimization? · *what evidence would settle it:* controlled models small enough for a joint-search reference, matched eligible-bit and measured-latency constraints, interaction ablations and actual executable assignments.

> **Open question.** [UNVERIFIED] Which benefits of learned scales survive export and transfer beyond the recovery distribution? · *what evidence would settle it:* exact fake/export operator parity, scale-only versus weight-and-scale comparisons at matched compute, independent domains and repeated training seeds.

> **Open question.** [UNVERIFIED] When does teacher-preserving recovery retain useful policy behavior better than task-loss recovery without preserving teacher errors? · *what evidence would settle it:* fixed recovery information/budgets, untouched evaluation populations, teacher-error strata and checkpoint selection independent of reported tasks.

## Review consequence

[KNOWN] Every planned coverage item has a canonical manuscript location and source boundary. Scientific completeness is not certified by the table alone. **Reviewed** status remains blocked by the unexecuted artifact, missing exact local runtime identities and absent independent experimental validation; source omissions restrict claims even after future execution.
