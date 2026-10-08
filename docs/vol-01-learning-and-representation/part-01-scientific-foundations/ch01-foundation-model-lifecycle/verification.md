---
id: ms.verification.1
entity_type: verification
title: Verification — a system specification as a constrained optimization problem
short_title: Verification
volume: 1
part: 1
chapter: 1
section: null
slug: verification
parent: ms.chapter.1
prev_sibling: ms.section.1.6
next_sibling: ms.references.1
children: []
prerequisites: [ms.section.1.1, ms.section.1.4, ms.section.1.5, ms.section.1.6]
downstream: [ms.section.6.6, ms.section.48.2, ms.section.66.3]
related: []
siblings_by_mechanism: []
relations:
  - {type: evaluated_by, target: ms.section.6.6}
axes:
  lifecycle: [evaluation, serving, assurance]
  mechanism: [constrained_optimization, load_test, acceptance_gate]
  feedback_setting: []
  modality: [text]
papers: [P50, P40]
implementations: []
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, ASSUMED, DERIVED, UNVERIFIED, PAPER-REPORTED]
  empirically_observed: false
word_count_target: 900
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# Verification — a system specification as a constrained optimization problem

## 1. Artifact specification

The proposed artifact is a versioned `spec.yaml` and a human-readable `spec-rationale.md`. They are specified here; no measured instance was created. Fields include the target population and sampling frame, task/reference/user schema, independent or clustered sampling units, split and contamination policy, user segments and permissions, capability claims with evaluation records, error classes and tolerated rates, success criteria and estimators, admitted operating envelope, finite candidate designs, ten resource entries with units/boundaries/provenance, and evidence-based rejection rules. The rationale records sensitivity and unresolved measurements. Policy thresholds are declared inputs; observing a pilot does not make the population or capability claims known.

## 2. Verification task

The application is a proposed document-grounded question-answering system. The corpus, permission policy, retrieval index, generator, prompt construction, serving policy, and evaluator are separately versioned. P40 supplies a published parametric/non-parametric modeling example; the application's generic retrieval workflow is not represented as a reproduction of P40's latent-document training objective.

For design ψ, let q = 1 when an answer is correct, its factual statements are supported by accessible evidence, and it satisfies the declared acceptance policy; abstentions and failures receive the policy's specified outcome. Let λ_max denote the locally defined peak arrival rate in requests/s, τ₁ and τ₂ client-boundary latency targets, and κ the cost ceiling. The book formulation is

$$
\max_{\psi\in\Psi} Q(\psi)\quad\text{s.t.}\quad
\begin{aligned}
&\operatorname{err}_{\rm unsupported}(\psi)\le\varepsilon_1,
\qquad\operatorname{err}_{\rm permission}(\psi)\le\varepsilon_2,\\
&\operatorname{TTFT}_{p95}(\psi;\Omega)\le\tau_1,
\qquad\operatorname{TPOT}_{p95}(\psi;\Omega)\le\tau_2,\\
&M_{\rm weights}+M_{KV}+M_{\rm runtime}\le M_{\rm cap},\\
&\operatorname{goodput}(\psi;\Omega)\ge\lambda_{\max},
\qquad\operatorname{cost/accepted\ task}(\psi)\le\kappa .
\end{aligned}
$$
*(Eq. 1.8)* where Q is Eq. 1.1, Ω is the declared admitted workload, and Ψ is the finite candidate set. Memory is evaluated per device/shard with maximum admitted lengths or a documented admission rule; conventional KV uses Eq. N.8 only where that representation applies. Tolerated permission error is a policy choice, not the smallest rate a convenient sample happens to resolve.

> **Assumption.** Illustrative planning inputs are τ₁ = 1 s, τ₂ = 0.05 s, ε₁ = 0.05, S_max = 16,384, and B_max = 16. They are neither measurements nor recommended settings. Doubling conventional context doubles the KV term at fixed batch and representation; halving a latency target tightens the execution requirement but does not itself identify a bottleneck.

```figure
id: fig-1.34
kind: memory-stack
title: Memory row of Eq. 1.8 across the secondary sweep
caption: >-
  N_total = 8·10⁹ dense with L = 32, H_kv = 8 and d_h = 128 is an
  illustrative stand-in for ψ0's unstated N, not a named model; S_max and
  B_max are the Assumption block's. The cache, 32 GiB, is about 2.1× the
  BF16 weights (14.9 GiB), so the b-sweep moves only the smaller segment
  (46.9 → 35.7 GiB)
  while doubling S_max adds 32 GiB: the memory row is set by B_max·S_max
  before precision. M_runtime is ASSUMED and not drawn, and no M_cap line is
  drawn because the hardware class is not stated.
placement: inline
evidence: ASSUMED
source: "DERIVED:eq-1.8"
alt: >-
  Four stacked bars of per-replica memory for the memory row of Eq. 1.8,
  with an illustrative dense N_total = 8·10⁹, L = 32, H_kv = 8, d_h = 128 and
  a 2-byte cache, not a named model, at B_max = 16. ψ0 with b = 2 and
  S_max = 16,384: weights 14.9 GiB plus M_KV 32 GiB, 46.9 GiB. b = 1: 7.45
  plus 32, 39.5 GiB. b = 0.5: 3.73 plus 32, 35.7 GiB. b = 2 with S_max
  doubled to 32,768: 14.9 plus 64, 78.9 GiB. M_runtime is not drawn and there
  is no capacity line.
spec:
  format: bytes
  variables: { N: 8e9, L: 32, Hkv: 8, dh: 128, bkv: 2, B: 16, S: 16384 }
  bars:
    - label: "ψ0: b = 2, S_max = 16K"
      segments:
        - { label: "weights N_total·b", kind: tensor, formula: "N*2" }
        - { label: "M_KV(B_max, S_max)", kind: memory, formula: "2*L*B*S*Hkv*dh*bkv" }
    - label: "b = 1, re-gated"
      segments:
        - { label: "weights N_total·b", kind: tensor, formula: "N*1" }
        - { label: "M_KV(B_max, S_max)", kind: memory, formula: "2*L*B*S*Hkv*dh*bkv" }
    - label: "b = 0.5, re-gated"
      segments:
        - { label: "weights N_total·b", kind: tensor, formula: "N*0.5" }
        - { label: "M_KV(B_max, S_max)", kind: memory, formula: "2*L*B*S*Hkv*dh*bkv" }
    - label: "b = 2, S_max doubled to 32K"
      segments:
        - { label: "weights N_total·b", kind: tensor, formula: "N*2" }
        - { label: "M_KV(B_max, 2·S_max)", kind: memory, formula: "2*L*B*(2*S)*Hkv*dh*bkv" }
```

```figure
id: fig-1.35
kind: calculator
title: Bandwidth the TPOT bound demands of one replica
caption: >-
  Conditional dense streaming model from Eq. 1.6: weights and conventional
  KV are assumed read once per step at the stated boundary. This is a
  planning calculation, not measured bandwidth or a general TPOT guarantee.
  A p95 service target is distinct from a worst-case per-step deadline.
placement: rail
anchor: 2-verification-task
evidence: ASSUMED
source: ["DERIVED:eq-1.8", "DERIVED:eq-1.6"]
alt: >-
  Calculator for the bandwidth lower bound B_mem ≥ (N_act·b + M_KV(B_max,
  S_max))/τ_2, with the cache fixed at L = 32, H_kv = 8, d_h = 128 and 2
  bytes per value, an illustrative configuration and not a named model.
  Inputs: τ_2, B_max, S_max, b and N. At τ_2 = 0.05 s, B_max = 16,
  S_max = 16,384, b = 2 and N = 8·10⁹: M_KV = 32 GiB, 46.9 GiB per decode
  step, 1.01 TB/s in the conditional streaming model, and 320 tokens per second
  per replica when every step takes exactly τ_2. Presets: τ_2 halved to
  0.025 s needs 2.01 TB/s; b = 1 needs 0.85 TB/s.
spec:
  tex: >-
    B_{\text{mem}} \ge \frac{N_{\text{act}}\,b + M_{KV}(B_{\max}, S_{\max})}{\tau_2}
  equation: "1.8"
  inputs:
    - { symbol: tau2, label: "TPOT bound τ_2", default: 0.05, min: 0.025, max: 0.1, options: [0.025, 0.05, 0.1], format: seconds }
    - { symbol: Bm, label: "batch cap B_max", default: 16, min: 1, max: 64, scale: log2, format: integer }
    - { symbol: Sm, label: "context cap S_max", default: 16384, min: 2048, max: 65536, scale: log2, format: tokens }
    - { symbol: b, label: "bytes per weight b", default: 2, min: 0.5, max: 2, options: [0.5, 1, 2], format: bytes }
    - { symbol: N, label: "N_act = N_total, dense, illustrative", default: 8e9, min: 1e9, max: 7e10, scale: log10, format: params }
  outputs:
    - { symbol: KV, label: "M_KV(B_max, S_max)", formula: "2*32*Bm*Sm*8*128*2", format: bytes }
    - { symbol: Tr, label: "bytes per decode step", formula: "N*b + KV", format: bytes }
    - { symbol: BW, label: "streaming bandwidth requirement", formula: "Tr/tau2", format: "bytes/s", emphasis: true }
    - { symbol: TPS, label: "tokens per second per replica at τ_2", formula: "Bm/tau2", format: integer }
  presets:
    - { label: "τ_2 halved", values: { tau2: 0.025 } }
    - { label: "b = 1", values: { b: 1 } }
```

### Experiment 1.1 — Rejection test of a proposed design

- **Hypothesis.** A frozen candidate ψ₀ satisfies Eq. 1.8 on the specified population and workload. The analysis distinguishes supported, rejected, and unresolved constraints; failure to reject is insufficient evidence of feasibility.
- **Setup.** Construct a permission-tagged evaluation sample and independent final split; pin corpus, index, model/tokenizer/template, decoding, engine, hardware, and evaluator. Define question/document/user grouping before sampling. A preliminary necessary-memory calculation rejects impossible configurations without treating a passing prediction as an execution measurement.
- **Independent variables.** The primary test fixes ψ₀. Secondary candidate comparisons vary retrieval depth and weight format separately; every changed artifact receives its own quality evaluation.
- **Controlled variables.** Corpus/index version, checkpoint, serialized prompt, decoding, evaluator and judging instructions, device placement, runtime, arrival trace, and timing boundary.
- **Dataset/workload.** Held-out questions sampled from the declared staff population, stratified where relevant; group related questions by source document/user. Replay an independently specified trace containing the declared length tails and bursts, not only mean rate.
- **Hardware.** Record accelerator class, count and memory per shard/replica, interconnect, precision, and runtime version. Vendor limits are bounds, not achieved throughput.
- **Metrics.** Acceptance and error rates with a confidence procedure matched to independent or clustered units; a fixed-sample binomial upper bound for zero permission violations only under independent constant-probability Bernoulli sampling. Report TTFT/TPOT p50/p95/p99 with uncertainty under the replay's dependence structure, goodput, allocator peaks, and cost per accepted task over a declared window. A naive bootstrap of all-zero events cannot establish a useful rare-event upper bound.
- **Baselines.** Retrieval-only evidence presentation, ψ₀ without retrieval, and a smaller model under the same evaluation policy. These are system contrasts, not isolated parameter-count effects unless other causes are controlled.
- **Expected result.** No outcome is asserted. A violating confidence bound can reject; a supporting bound can support within scope; an interval crossing the threshold remains unresolved. Multiplicity and adaptive candidate selection are included in the declared error-control procedure.
- **Ablation.** Compare retrieval-depth and precision candidates on paired evaluation units. Estimate the paired difference and its interval directly; overlap or non-overlap of two separate intervals is not the decision rule. Measure traffic/kernel effects before attributing a latency difference to b alone.
- **Interpretation.** Report which constraint fails and which intervention contrast was measured. An accounting model below observed capacity or latency does not by itself identify the failing component. Requirement revisions are explicit decisions, never automatic relaxations of permission constraints.
- **Threats to validity.** Cluster dependence, contamination, evaluator leakage, adaptive reuse of final data, omitted burstiness, index drift, quantization overhead, admission-policy changes, incomplete power/cost boundaries, and insufficient rare-event precision.

| Measurement | Rejecting condition | Supporting condition / remaining boundary |
|---|---|---|
| Acceptance Q | valid upper confidence limit below declared floor | lower limit above floor; applies to sampled population |
| Unsupported-answer rate | valid lower limit above ε₁ | upper limit below ε₁; denominator includes declared abstention policy |
| Permission violations | prespecified zero-tolerance event rule, or lower limit above ε₂ | zero observations alone is insufficient; use a valid upper limit and separate deterministic permission checks |
| Client latency quantiles | valid evidence exceeds target under Ω | supporting quantile uncertainty bound; finite trace does not certify all future traffic |
| Device memory | actual peak exceeds capacity or a valid necessary-footprint bound does | measured/admission-accounted headroom for tested configurations; account for workspace and fragmentation |
| Goodput | valid upper limit below declared arrival requirement | lower limit above requirement at declared trace and acceptance policy |
| Cost/accepted task | cost boundary and denominator exceed κ | all included prices/quantities and uncertainty stated; zero accepted tasks makes ratio undefined |
| Resource-model consistency | measured work/traffic/timing contradicts the substituted streaming assumptions | revise accounting/boundary; this check alone neither accepts nor rejects application quality |

```figure
id: fig-1.36
kind: diagram
title: Evidence outcomes for the proposed application
caption: >-
  No measurement has been performed. Rejection, scoped support, and
  unresolved evidence are distinct outcomes; necessary bounds cannot
  certify achieved service behavior.
placement: wide
evidence: ASSUMED
source: ["DERIVED:eq-1.8", "DERIVED:alg-1.1"]
alt: >-
  A frozen specification and candidate feed independent quality, execution,
  memory, and cost measurements. Valid threshold comparisons lead to rejected,
  supported within scope, or unresolved outcomes, with assumptions recorded.
spec:
  direction: LR
  nodes:
    - { id: spec, kind: objective, label: "frozen specification and candidate" }
    - { id: sample, kind: dataset, label: "population sample and held-out arrival trace" }
    - { id: measure, kind: process, label: "quality, latency, goodput, memory, cost" }
    - { id: interval, kind: branch, label: "valid bounds relative to thresholds" }
    - { id: rejected, kind: state, label: "rejected by evidence" }
    - { id: supported, kind: state, label: "supported within tested scope" }
    - { id: unresolved, kind: state, label: "unresolved; more evidence needed" }
  edges:
    - { from: spec, to: measure }
    - { from: sample, to: measure }
    - { from: measure, to: interval }
    - { from: interval, to: rejected }
    - { from: interval, to: supported, kind: emphasis }
    - { from: interval, to: unresolved }
```

## 3. Acceptance criteria

The proposed artifact is complete when its fields, units, sources, boundary assumptions, and independent measurement plan are specified. A candidate's release decision additionally requires supporting evidence for every release criterion, documented handling of multiplicity and candidate selection, measured workload conditions, and unresolved-gap review. Paired baseline contrasts use direct difference estimators. No numerical value here authorizes a release, and an empty rejection set does not establish feasibility.

## 4. Additional unexecuted protocols

These proposals preserve the chapter's research questions without replacing published methods or results.

### Experiment 1.2 — Attribution under changed normalization

- **Hypothesis.** response-length and group-standard-deviation normalization have distinct effects in the chosen GRPO setting.

- **Setup.** a four-arm binary factorial with the two terms independently enabled/disabled.

- **Independent variables.** the two normalizations.

- **Controlled variables.** base checkpoint, prompts, reward verifier, sampler, optimizer budget and evaluation budget.

- **Dataset/workload.** versioned MATH training and independent held-out problem groups, with contamination policy.

- **Hardware.** one pinned accelerator/parallelism configuration.

- **Metrics.** reward, output length by correctness, held-out accuracy, interaction estimate and repeated-seed uncertainty.

- **Baselines.** original GRPO.

- **Expected result.** no directional outcome asserted.

- **Ablation.** all four combinations.

- **Interpretation.** estimates term and interaction effects for this training regime, rather than importing P28's combined-change result as two isolated causes.

- **Threats to validity.** correlated seeds/prompts, unstable ratios, verifier errors, unequal consumed tokens and early stopping.

### Experiment 1.3 — Artifact availability and rerun closure

- **Hypothesis.** a selected documented open-training release supports a tolerance-defined rerun.

- **Setup.** inventory exact checkpoints, corpus shards/order, tokenizer, training/evaluation code, configuration and environment; attempt only a separately authorized bounded pilot.

- **Independent variables.** reference run versus rerun.

- **Controlled variables.** artifact identities and stated hardware/precision constraints.

- **Dataset/workload.** pinned training prefix and held-out evaluation sample.

- **Hardware.** declared before execution.

- **Metrics.** loss trajectory, evaluated outputs, consumed tokens, resource use, and divergence tolerance.

- **Baselines.** source reference trajectory.

- **Expected result.** either documented agreement or a missing-artifact/divergence record.

- **Ablation.** change one configuration only after the replication target is assessed.

- **Interpretation.** distinguishes disclosure from reproduced execution.

- **Threats to validity.** inaccessible data, nondeterminism, environment drift, undefined tolerances.

### Experiment 1.4 — Matched adaptation routes

- **Hypothesis.** two candidate adaptation routes have distinguishable acceptance/retention trade-offs at a declared budget.

- **Setup.** compare SFT-only and SFT-plus-preference routes from the same checkpoint; reserve final evaluation.

- **Independent variables.** route; optional deliberate interface change is a separate diagnostic arm.

- **Controlled variables.** prompt population, base, supervision quality, total budget boundary, decoding and evaluator.

- **Dataset/workload.** versioned domain and retention sets.

- **Hardware.** pinned training and serving configurations.

- **Metrics.** acceptance, retention, generation/training resources, latency, paired uncertainty.

- **Baselines.** starting checkpoint and SFT-only.

- **Expected result.** no winner assumed.

- **Ablation.** report additional data, objective and compute separately where separable.

- **Interpretation.** a route-package result until controls identify components.

- **Threats to validity.** unmatched data, unequal teacher costs, adaptive selection, interface drift.

### Experiment 1.5 — Resource model check

- **Hypothesis.** the conditional streaming approximation predicts traffic trends in a selected dense decoder regime.

- **Setup.** batch sweep B ∈ {1,4,16,64} at fixed admitted context, then a separately quality-checked weight-format change.

- **Independent variables.** batch and format.

- **Controlled variables.** model, device, kernels/runtime, length distribution, placement, warm-up and boundary.

- **Dataset/workload.** pinned synthetic length workload plus an independent representative trace.

- **Hardware.** stated accelerator and profiler configuration.

- **Metrics.** actual HBM bytes, operations, TPOT distribution, workspace, power and device energy.

- **Baselines.** unmodified format and direct measured resource bound.

- **Expected result.** model agreement or an identified accounting discrepancy; no speedup asserted.

- **Ablation.** cache reuse and dequantization contribution where measurable.

- **Interpretation.** tests the traffic substitution, not physical law.

- **Threats to validity.** profiler overhead, clock drift, on-chip caching, hidden synchronization and different admitted batches.

### Experiment 1.6 — Mechanistic claim validation

- **Hypothesis.** a candidate internal feature mediates a specified behavior contrast on held-out inputs.

- **Setup.** define component, perturbation, background state, output statistic, controls and transfer population before intervention.

- **Independent variables.** intervention and control intervention.

- **Controlled variables.** model, inputs, decoding, feature selection and intervention magnitude.

- **Dataset/workload.** held-out prompt groups distinct from feature discovery.

- **Hardware.** pinned framework/model execution.

- **Metrics.** activation/logit effects, generated behavior with sampling uncertainty, reconstruction and off-distribution diagnostics.

- **Baselines.** original model, sham intervention, and suitable alternative features.

- **Expected result.** scoped effect, rejection, or unresolved mediation.

- **Ablation.** remove, replace, and restore under defined backgrounds where meaningful.

- **Interpretation.** a perturbation effect alone does not establish unique necessity, sufficiency, or training origin.

- **Threats to validity.** feature selection bias, redundant circuits, intervention artifacts, incomplete replacement model, prompt-specific transfer.

## Coverage audit

This is an editorial map, not a claim of independent experimental verification. Every section is manuscript_draft. Canonical architecture/optimization chapters own full derivations of their algorithms; Chapter 1 owns their system-level distinctions and dependencies.

| Required topic | Manuscript anchor | Inspected source and locator | Boundary / gap |
|---|---|---|---|
| Task distribution, users, capabilities | [1.1 Formulation](01-1-problem-formulation.md#formulation), [Methodology](01-1-problem-formulation.md#methodology) | P50 §§2–4; R1.17 §§4.3–4.4; P21 §3.2 | book acceptance function is explicit; no application population sampled |
| Acceptable errors, operating conditions, success criteria | [1.1 Formulation](01-1-problem-formulation.md#formulation), [Reported experiments](01-1-problem-formulation.md#reported-experiments) | P50 §7 Table 7 and §8.1; R1.3 §4 | policy thresholds are declared; Bernoulli/normal planning conditions and multiplicity limits stated |
| Objective, representation, algorithm, implementation | [1.2 Formulation](01-2-levels-of-analysis.md#formulation), [Methodology](01-2-levels-of-analysis.md#methodology) | P19 §3; P14 §4; P28 §3 | book seven-level taxonomy; held-fixed fields do not alone identify causality |
| Runtime, infrastructure, product behavior, evidence | [1.2 Mechanism](01-2-levels-of-analysis.md#mechanism), [Reported experiments](01-2-levels-of-analysis.md#reported-experiments) | P19 §4.3/App. E; P36 §§4–6; P21 §§3–4 | operator, engine and jointly changed system contrasts distinguished; no current engine benchmark |
| General/specialized, dense/sparse | [1.3 Formulation](01-3-model-categories.md#formulation), [Methodology](01-3-model-categories.md#methodology) | P10 §§2–4; P13 §2; P25 §2 | scope is relative; active ratio is not measured traffic; unequal experts require summed counts |
| AR, denoising, masked, diffusion, contrastive, predictive, recurrent | [1.3 Mechanism](01-3-model-categories.md#mechanism) | P02 §§2.1/3.3; R1.9 §3.1; R1.10 §3; P44 §2.3; P47 §§2–3; P11 §3 | objectives and inference separated; T5 remains AR; canonical mathematical treatments linked |
| Open weights versus reproducible training | [1.3 Methodology](01-3-model-categories.md#methodology), [Algorithm](01-3-model-categories.md#algorithm) | R1.7 §§1/3/6; P05 §§2–4; R1.14 §2 | release documentation inspected; exact artifact closure and independent rerun unverified |
| Pretraining, continued training, adaptation | [1.4 Formulation](01-4-lifecycle-and-intervention.md#formulation), [Mechanism](01-4-lifecycle-and-intervention.md#mechanism) | P14 §4; P21 §3; P25 §2 | stage dependencies and training-state costs; no universal mandatory route |
| Preferences, RL, distillation | [1.4 Methodology](01-4-lifecycle-and-intervention.md#methodology), [Reported experiments](01-4-lifecycle-and-intervention.md#reported-experiments) | P21 Eqs. 1–2/§4.2; P26 §§2–4; P32 §2; R1.15/R1.16 | response-only versus logits distinguished; one student is already instruction-tuned; full route-cost match absent |
| Retrieval, compression, deployment, feedback | [1.4 Mechanism](01-4-lifecycle-and-intervention.md#mechanism), [Algorithm](01-4-lifecycle-and-intervention.md#algorithm) | P40 §2; P36 §§4–5; R1.5 §4 | generic graph is book synthesis; compression variants and curation have separate checks; no deployment executed |
| Parameters, tokens, FLOPs | [1.5 Formulation](01-5-resource-accounting.md#formulation), [Methodology](01-5-resource-accounting.md#methodology) | P08 §§1–4; P09 §3/Eqs. 2–4/App. F; P13 Table 1 | operation approximations and fitting conditions explicit; no universal allocation exponent |
| Capacity, traffic, communication | [1.5 Formulation](01-5-resource-accounting.md#formulation), [Algorithm](01-5-resource-accounting.md#algorithm) | P19 §3; P36 §§4–6; notation N.4/N.8 | streaming substitution conditional; admitted maxima/shard placement matter; measured HBM traffic unavailable |
| Latency, throughput, energy, money | [1.5 Reported experiments](01-5-resource-accounting.md#reported-experiments), [Observations](01-5-resource-accounting.md#observations) | P36 §6.1; R1.11 §2; R1.12; P13 Table 1 | assumed-price training estimate disclosed; full program invoice/facility energy absent; no service measurement |
| Mechanistic and physical explanations; cognitive vocabulary | [1.6 Formulation](01-6-scientific-interpretation.md#formulation), [Methodology](01-6-scientific-interpretation.md#methodology) | P52 methodology/limitations; P28 §§2–3 | evidence types are editorial, not universal cost/confidence ladder; cognitive labels supply no mechanism |
| Causal evidence, competing hypotheses, falsification | [1.6 Algorithm](01-6-scientific-interpretation.md#algorithm), [Reported experiments](01-6-scientific-interpretation.md#reported-experiments) | P52 validation appendices; P28 §2.3/§3/App. A; P09 App. D.4 | perturbation semantics and identification limits explicit; no unique necessity or mediation established here |

| Cross-topic obligation | Treatment | Remaining closure |
|---|---|---|
| Research question, formal contract and mathematics | Scope/Formulation revised throughout; Eqs. 1.1–1.10 identified as book formulations or approximations; source equations have locators | exhaustive formal proof/audit of every downstream owner is outside this chapter |
| Full methodology and executable procedure | all six Methodology subsections; bounded Algorithms 1.1–1.6 distinguish evidence gaps and artifact promotion | pseudocode is an explanatory procedure, not executed software |
| Implementation and resources | stack-layer placement, conditional FLOPs/traffic/energy equations, factorial-run accounting and route gates | current code paths, hardware measurements, commits, complete energy/cost boundaries unverified |
| Published protocols and observations | all six Reported experiments subsections; four-part Observations tied to actual study settings | independent reproduction and some source-disclosed configuration/seed details absent |
| Alternatives and improvements | Siblings and Improvements compare source mechanisms and name non-isolated package changes | no exhaustive current-literature or universal-SOTA claim |
| Failures, validity and reproducibility | source-conditioned failure analysis and limitations; 34 inspected primary records in references | unversioned PDFs/live pages not immutably pinned; software and artifact closure pending |

## What this edition did not do

No specification was populated with measured application values, no training or circuit intervention was run, no service was deployed, and no proposed design was accepted. Published experimental findings remain PAPER-REPORTED; mathematical identities and explicitly conditional calculations remain derived; planning inputs remain ASSUMED. These distinctions and the listed evidence gaps prevent promotion to reviewed status.
