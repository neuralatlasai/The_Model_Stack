---
id: ms.verification.5
entity_type: verification
title: Verification — full-sequence versus cached inference
short_title: Verification 05
volume: 1
part: 1
chapter: 5
section: null
slug: verification
parent: ms.chapter.5
prev_sibling: ms.section.5.6
next_sibling: ms.references.5
children: []
prerequisites: [ms.section.3.6, ms.section.5.1, ms.section.5.2, ms.section.5.5, ms.section.5.6]
downstream: [ms.section.26.6, ms.section.42.2]
related: []
siblings_by_mechanism: []
relations:
  - {type: implemented_by, target: impl.pytorch}
  - {type: evaluated_by, target: experiment.5.1}
axes:
  lifecycle: [inference, evaluation]
  mechanism: [cache_representation, numerical_equivalence]
  feedback_setting: []
  modality: [text]
papers: [P01]
implementations: [impl.pytorch, impl.flashattention]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED]
  empirically_observed: false
word_count_target: 900
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# Verification - Chapter 05

## 1. Verification boundary

The chapter specifies a mathematical decoder and derives resource identities. No pinned PyTorch reference model, trained checkpoint, full-versus-cached logit report, or accelerator profile was executed for this revision. The earlier unexecuted implementation listing and asserted artifact filenames have been removed: a listing is not evidence that those files or their results exist. The actual executed checks in section 7 concern arithmetic and finite-difference identities only; they provide no model-quality or latency result.

The principal proposed artifact remains an inspectable reference Transformer with position-resolved intermediates. Its required output is a configuration and operator trace plus an equivalence report, not just an aggregate pass flag. Source surfaces and versions are recorded in [references.md](references.md).

## 2. Topic and obligation coverage

| Topic | Mathematical specification | Method and implementation distinctions | Source observations and limits | Verification obligation |
|---|---|---|---|---|
| 5.1 Forward pass | Embedding, position, sequential branches, final norm, head | QKV packing, independent layer parameters, parameter sharing, trace/alias identity | P01 component variations; GPT-2/LLaMA are distinct complete architectures | Compare shapes, parameter identities, and intermediate tensors against the declared function |
| 5.2 Attention | Scaled logits, allowed sets, softmax, context, output projection, backward derivatives | Fully masked rows, finite allowed logits, Boolean mask semantics, non-square alignment, functional dropout, online normalization | P01 head/width variation; P19 exact-attention IO; PyTorch API is versioned | Test causal visibility, row sums, masked probabilities, gradients, and explicitly aligned cache chunks |
| 5.3 FFN | Two-matrix and gated forms, activation derivatives, parameter/FLOP matching | Gate ordering, width rounding, nonlinear formula, saved tensor versus recomputation choices | Shazeer T5/C4 protocol and held-out outcome; adoption is not isolated ablation | Compare matched projection counts and analytic gradients; inspect actual saving policy |
| 5.4 Residual organization | Jacobian order, norm Jacobians, exact covariance expansion, conditional variance model | Epsilon/affine parameters, final norm, scaling of complete branches versus initializers, finite precision | Xiong theorem premises and source training experiments; DeepNorm is a joint design | Check derivatives and covariance terms; keep initialization bounds separate from trained stability |
| 5.5 Training/generation | Shifted masked objective, layer/position induction, cache increment, prefill/decode arithmetic | Module/autograd mode, consumed versus sampled positions, valid-key mask, fixed parameters/conditioning | Source incremental-decoding and exact-attention evidence; no executed reference | Compare identical token streams position by position, with deliberate mask/index/position corruptions |
| 5.6 Accounting | Unique parameter count, operator FLOPs, conditional saved inventory, state dtype alternatives | Head rows, aliases, live intervals, padding, reserve, read model versus measured traffic | P08 non-embedding convention and P19 IO context | Match integer identities; separately measure dispatch, live allocations, and profiler semantics |

This matrix locates substantive material. It does not certify that every architecture family or frontier implementation has been covered, nor that a draft has passed independent scientific reproduction.

## 3. Experiment 5.1 - full versus incremental evaluation

**Hypothesis and premises.** Full causal evaluation and incremental evaluation compute the same real-arithmetic logit for a fixed token at a fixed absolute position, with identical weights, token IDs, positional mapping, attention visibility, conditioning, normalization, and deterministic branch operations. Floating-point outputs can differ through reduction order, casts, tiling, or storage dtype. A dtype alone supplies no universal end-to-end error bound or requirement that error remain flat with position.

**Setup.** Construct a tiny decoder first, for example d=64, H=4, L=4, F=256, V=128 with a position table covering the tested sequence. The full analytical configuration in 5.6 is a second workload, rather than a prerequisite for checking the invariant. Fix and record initialization, epsilon, activation formula, gain/bias policy, head sharing, dtypes, framework revision, backend, and device. Use a fixed synthetic token stream and explicit absolute position IDs. Put stochastic module operations in deterministic evaluation mode and separately disable autograd when appropriate; functional SDPA must receive dropout_p=0.

**Paths.** A evaluates all S positions with the declared full causal mask. B evaluates the same S positions while writing a cache, returning all logit rows for this test even though production prefill may return only the last. C consumes the first token and then feeds the same remaining input tokens one at a time through the cache. C is teacher-forced so differences in sampling do not create different inputs. Repeat C with several valid cached chunk sizes and an explicit lower-right mask; PyTorch's non-square upper-left is_causal must not silently replace it.

**Controls and baselines.** Repeat A under the same runtime to measure nondeterminism. A deterministic repeat can be bit-identical while a differently shaped GEMM in C still rounds differently; zero repeat error does not require zero cross-path error. Compare the same materialized operator first, then a separately logged fused backend. A CPU FP32 result is another finite-precision execution, not exact mathematical ground truth. An FP64 or independently implemented small reference can help localize disagreements, with its own reduction/cast conventions recorded.

**Metrics.** Save max absolute error, a scaled maximum error using a positive denominator floor, RMS error, and per-position/per-layer discrepancies. Report argmax agreement separately. Near-tied logits can change argmax under a numerically small perturbation; if maximum component error is at most epsilon and the reference top-two gap exceeds2epsilon, argmax is preserved. Without that margin, a universal agreement percentage is unjustified.

**Tolerance selection.** Predeclare atol/rtol for the exact workload after examining operator conditioning and higher-precision comparison, and report their rationale. Neither10 times a repeated-run floor nor a fixed BF162% threshold is a derived full-model bound. Relative-only errors are unstable near zero. Larger lengths/depths need their own recorded numerical budget. The proposed experiment cannot be reported as passing until its outputs and environment exist.

**Ablations.** Remove the full causal mask, corrupt a cache slot, restart decoded positions at zero, or invert Boolean-mask semantics, one at a time. Use a fixture with nontrivial position embeddings and sensitivity to earlier/future inputs. A random degenerate fixture may fail to expose a corruption, so detection must be established for the fixture rather than assumed. Error-versus-position signatures are diagnostic clues; different defects can produce the same profile and one defect can produce several profiles. Intermediate tensor comparisons localize them.

**Interpretation.** Agreement supports implementation fidelity for the tested configurations. It does not establish trained quality, long-context extrapolation, arbitrary cache eviction equivalence, or all backend correctness. A disagreement can reflect a violated premise, numerical budget, or implementation error; it is not by itself a counterexample to the real-arithmetic induction.

## 4. Experiment 5.2 - attention and FFN differentiation

Specify one nonempty finite allowed-key set per query and compare the materialized attention derivatives in 5.2 against directional finite differences or a separately trusted differentiation path. Check row sums of dS, masked entries, and both dQ/dK paths. Fully masked rows require an explicit extension policy; comparing one backend's zero extension with undefined mathematical softmax is an invalid oracle.

For the gated FFN, perturb the shared normalized input and verify that its cotangent sums contributions through both input projections. Repeat activation checks for the exact GELU/SiLU formula in the specification; a different approximation is a different function. Report finite-difference step selection and truncation/rounding behavior rather than one unmotivated tolerance. This experiment is UNVERIFIED and has no executed gradient report.

## 5. Experiment 5.3 - allocation and operation accounting

First match unique parameter scalars against Eq. 5.22 with both tied and untied heads. Record whether names alias the same parameter/storage. Then enumerate dense matrix applications and attention pairs under the same head-row and masking convention as the execution. Do not use all resident parameters as the dense multiplication count.

For memory, capture unique live allocations and synchronization-aware allocated/reserved peaks for an initialized training step, including optimizer moment creation. Separately compare materialized attention, exact fused attention, and checkpoint choices. The conditional probability allocation in 5.6 is not an exact forecast of measured peak savings. Record profiler counting semantics, actual backend dispatch, padding, recomputation, and extra library allocations. This experiment remains UNVERIFIED.

## 6. Failure and acceptance boundaries

A correct causal model with fixed conditioning must pass a nondegenerate future-perturbation check at earlier output positions within its declared numerical tolerance. Cached chunks must use the visibility condition j<=old_length+i for query-local index i. Position-table bounds apply to consumed positions; generating a final unconsumed sample does not add its K/V.

Integer parameter identities and byte conversions require exact equality. A measured allocation/FLOP discrepancy instead requires reconciliation with actual aliases, lifetimes, backend work, or omitted operators; it cannot be attributed automatically to generic overhead. No source report removes the need to inspect these execution-specific terms.

## 7. Executed analytical checks - 2026-10-08

A Python3.12.8 standard-library run completed the checks below. It did not instantiate a neural model, call a framework backend, train a checkpoint, or profile an accelerator.

| Check | Executed result |
|---|---|
| Unique parameters and dense-matrix count | Block projection matrices84,934,656; N_dense109,510,656; tied110,316,288; untied134,892,288; exact assertions passed |
| Forward arithmetic | Dense256,770,048 and ideal causal237,914,112 leading FLOPs per token; exact assertions passed |
| Prefill head-row distinction | Last-row head193,341,554,688 versus all-row head243,624,050,688 leading FLOPs at B=1, S=1024; exact assertions passed |
| Storage | Cache increment36,864 bytes; FP32 training logits1000 MiB; conditional saved inventory384 MiB per block; exact assertions passed |
| Matched FFN | 3*d*2048=2*d*3072 and 6*d*2048=4*d*3072; exact assertions passed |
| Allowed causal pairs | Recurrence sum(t) equals T(T+1)/2 for 4096 lengths; exact assertions passed |
| Norm Jacobians |64 seeded vectors, dimensions selected from 2,3,8,16; both RMSNorm and LayerNorm, epsilon0.03, centered finite differences step1e-5; maximum absolute entry error2.131550047579367e-9, below the declared2e-8 check tolerance |
| Generation boundaries |8256 prompt/generated-length cases; zero-generation and final-unconsumed-token counting identities passed |

The norm test used random seed 20261008, coordinates uniform[-2,2], gains uniform[0.5,1.5], and exact analytic Jacobians from 5.4. It verifies those formulas at sampled ordinary inputs, not an error bound for arbitrary norms or a full model. The generation check verifies counting identities, not an executed generation implementation.

The inspected Stanford handout downloaded from its official repository has SHA-256 `cf402d1c6d3c66da035bdf33b3e2c1bbc4bb92a78b006ee36577e925a265e328`,47 pages, and identifies itself as Version 26.0.3, Spring 2026. Its text was extracted to a temporary file for inspection. This pins the inspected PDF content; it does not pin the repository's mutable main branch or establish that its tests were run.
