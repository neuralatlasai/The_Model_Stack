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
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Verification — a system specification as a constrained optimization problem

## 1. Artifact specification

The chapter artifact is a **system specification** for one application, delivered as two files.

`spec.yaml` (machine-readable; one record):

| Field | Type | Content | Evidence label carried |
|---|---|---|---|
| `application_id` | string | stable identifier and version | KNOWN |
| `task_distribution` | record | population definition; sampling procedure; input/output schema; held-out split id; contamination policy; pilot sample id (T_0) and size | KNOWN once T_0 exists |
| `users_and_operating_conditions` | record | user segments with request mix; arrival-rate envelope (mean, peak λ_max in requests/s); concurrency; input-length quantiles (p50, p95, p99 in tokens); output-length quantiles; hardware class; precision; regional and permission constraints | KNOWN (logs) or ASSUMED |
| `capabilities` | list | capability claims, each with a benchmark-record id ([§6.1](../ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md)) | KNOWN per record |
| `acceptable_errors` | table | error class k → severity s_k; tolerated rate ε_k; estimator; confidence procedure | ASSUMED with sensitivity |
| `success_criteria` | table | metric (fixed vocabulary); estimator; threshold; confidence procedure; evaluator-independence statement | ASSUMED threshold |
| `resource_constraints` | table | the ten ledger entries of [§1.5](01-5-resource-accounting.md): value or bound; unit; measurement boundary; label; source | per entry |
| `decision_variables` | table | design space Ψ: model placement on the four axes of [§1.3](01-3-model-categories.md); N_act, N_total; b; S_max; retrieval policy (k passages, chunk size); replicas n_rep; batch cap B_max; route through the graph of [§1.4](01-4-lifecycle-and-intervention.md) | ASSUMED (candidates) |
| `rejection_criteria` | list | the measurements of §3 below that reject a design, with thresholds | DERIVED from the constraints |
| `provenance` | map | field → (label, source, accessed date) | — |

`spec-rationale.md` (human-readable): one paragraph per field stating why the value was chosen, its sensitivity, and the relaxation order by severity used in Algorithm 1.1 line 9.

## 2. Verification task

The plan's task: *express one application as a constrained optimization problem; show which measurements would reject the proposed design.* The application chosen is a **document-grounded question-answering assistant** for an internal corpus (parametric model plus non-parametric retrieval in the sense of P40), used by staff through a chat interface. It is chosen because every constraint of [Eq. 1.2](01-1-problem-formulation.md) binds visibly: quality depends on retrieval and context, latency on decode traffic, memory on context length, and cost on replicas.

### Problem statement

Decision variables ψ = (family and N_act, N_total; precision b; maximum context S_max; retrieval depth k; replicas n_rep; batch cap B_max; route ρ). Objective and constraints:

$$
\max_{\psi}\; Q(\psi) = \mathbb{E}_{\mathcal{D}_{\text{task}}}\big[q(f_\psi(c), y^*, u)\big]
\quad\text{s.t.}\quad
\begin{aligned}
&\text{err}_{\text{unsupported}}(\psi) \le \varepsilon_1,\quad \text{err}_{\text{permission}}(\psi) \le \varepsilon_2 \\
&\text{TTFT}_{p95} \le \tau_1,\quad \text{TPOT}_{p95} \le \tau_2 \quad (\text{client boundary, at } \lambda_{\max}) \\
&N_{\text{total}}\, b + M_{KV}(B_{\max}, S_{\max}) + M_{\text{runtime}} \le M_{\text{cap}} \\
&\text{goodput}(\psi;\,\Omega) \ge \lambda_{\max} \\
&\text{cost per accepted task}(\psi) \le \kappa
\end{aligned}
$$
*(Eq. 1.8)* where q = 1 when the answer is judged correct *and* every factual statement is supported by a retrieved passage the user is permitted to see; err_unsupported = rate of answers containing an unsupported statement; err_permission = rate of answers citing a passage outside the user's permissions (severity: highest; ε_2 is set to the smallest rate the estimator can bound); τ_1, τ_2 = latency bounds; M_KV per [Eq. N.8](../../../front-matter/notation.md); M_cap = per-replica accelerator memory; κ = budget per accepted task under [notation §2.10](../../../front-matter/notation.md).

> **Assumption.** Illustrative planning inputs for one instance: τ_1 = 1.0 s, τ_2 = 0.05 s, ε_1 = 0.05, S_max = 16,384 tokens, B_max = 16 · *sensitivity:* these are ASSUMED product inputs for the worked protocol, not measured or recommended values; halving τ_2 moves the design into the traffic-bound regime of [Eq. 1.6](01-5-resource-accounting.md) and typically forces smaller b or smaller N_act; doubling S_max doubles M_KV and may make the memory constraint bind first.

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
  Composes Eq. 1.8's TPOT row with Eq. 1.6's traffic term: every decode
  step must finish within τ_2, so a replica needs at least the step's bytes
  divided by τ_2 of achieved, not vendor-peak, bandwidth. At the assumed
  τ_2 = 0.05 s, B_max = 16 and S_max = 16K, an illustrative dense N = 8·10⁹
  at b = 2 needs 1.01 TB/s; halving τ_2 doubles it, the Assumption block's
  traffic-bound regime, and b = 1 lowers it only to 0.85 TB/s because the
  cache dominates.
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
  step, at least 1.01 TB/s of achieved bandwidth, and 320 tokens per second
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
    - { symbol: BW, label: "achieved bandwidth needed", formula: "Tr/tau2", format: "bytes/s", emphasis: true }
    - { symbol: TPS, label: "tokens per second per replica at τ_2", formula: "Bm/tau2", format: integer }
  presets:
    - { label: "τ_2 halved", values: { tau2: 0.025 } }
    - { label: "b = 1", values: { b: 1 } }
```

### Experiment 1.1 — Rejection test of a proposed design

- **Hypothesis.** A proposed design ψ_0 (dense open-weights model at stated N, b = 2, S_max = 16,384, k = 8, n_rep = 2, B_max = 16, route: base → SFT on domain conversations → gate → deployment with retrieval) satisfies every constraint of Eq. 1.8 on 𝒟_task at Ω. The null to be rejected is feasibility; rejection of any single constraint rejects ψ_0.
- **Setup.** Build T_0 by the sampling procedure S over real staff questions with permission-tagged references; freeze the held-out split; build the retrieval index over the versioned corpus; deploy ψ_0 on the declared hardware class with a pinned inference engine version; instrument client-boundary timestamps t_0, t_1, …, t_n per [notation §2.8](../../../front-matter/notation.md).
- **Independent variables.** None in the primary test (ψ_0 is fixed); in the secondary sweep, b ∈ {2, 1, 0.5} (weight-only quantization, re-gated as its own artifact) and k ∈ {4, 8, 16}.
- **Controlled variables.** Corpus version, index version, tokenizer and template checksums, engine version, hardware class, decoding parameters, evaluator version and prompts, arrival trace.
- **Dataset / workload.** Held-out split of T_0 for quality (independent units = distinct questions from distinct source documents); a replayed arrival trace at λ_max with the declared input-length quantiles for latency and goodput.
- **Hardware.** One accelerator class, stated by name, memory capacity, and count per replica; P_peak and B_mem recorded as vendor bounds (ASSUMED, not achieved values).
- **Metrics.** Q̂(ψ_0) with paired bootstrap 95% interval over independent units; err̂_unsupported and err̂_permission with the same units; TTFT and TPOT p50/p95/p99 at the client boundary over the replay window; goodput (requests meeting both τ_1 and τ_2) in requests/s; peak allocator memory per replica; cost per accepted task = (device-hours × price + retrieval and storage cost over the window) / accepted tasks, with the attribution window stated and prices ASSUMED.
- **Baselines.** (i) Retrieval-only: return the top-k passages without generation (bounds the value of the model); (ii) a smaller general model at the same b and k (bounds the value of N); (iii) ψ_0 without retrieval (bounds the value of the non-parametric memory, P40).
- **Expected result (as a proposal).** Either ψ_0 is feasible with all intervals on the satisfying side, or at least one measurement below rejects it. No outcome is asserted for this edition.
- **Ablation.** The secondary sweep over b and k identifies which constraint binds first: a b-sweep that moves TPOT_p95 across τ_2 while Q̂ stays within its interval indicates the traffic-bound regime; a k-sweep that moves Q̂ and TTFT together shows the quality–latency coupling through prompt tokens.
- **Interpretation.** Each rejection is attributed to a level of [§1.2](01-2-levels-of-analysis.md): quality rejections to the model, route, or retrieval policy; latency rejections to runtime or infrastructure; memory rejections to the ledger; cost rejections to replicas and prices. A rejected design returns to Algorithm 1.1 line 9 with the least-severe constraint relaxed and the relaxation recorded.
- **Threats to validity.** Dependent evaluation units (several questions from one document) narrow intervals falsely; evaluator not independent of SFT data leaks the gate; replayed traces omit burstiness; vendor peaks used as achieved values; corpus drift between index build and evaluation; contamination of T_0 by SFT conversations.

### Measurements that reject ψ_0

| Measurement | Rejects ψ_0 when | Constraint | Level attributed |
|---|---|---|---|
| Q̂ 95% interval | upper bound < the success-criterion threshold | objective floor | model / route / retrieval |
| err̂_unsupported interval | lower bound > ε_1 | error class 1 | model / retrieval policy |
| err̂_permission | any observed violation above the estimator's resolvable rate | error class 2 (highest severity, no relaxation) | product behavior (permission filter) |
| TTFT_p95, TPOT_p95 at λ_max | either exceeds τ_1, τ_2 over the replay window | latency | runtime / infrastructure |
| Peak allocator memory | exceeds M_cap on any replica, or Eq. N.8 prediction plus runtime term exceeds M_cap before the test | memory capacity | ledger |
| Goodput | below λ_max at the declared concurrency | throughput | runtime / replicas |
| Cost per accepted task | above κ with the stated window and prices | money | replicas / prices / route |
| Consistency check | TPOT_p50 below the [Eq. 1.6](01-5-resource-accounting.md) bound | accounting error, not a pass | ledger inputs wrong |

```figure
id: fig-1.36
kind: diagram
title: Rejection protocol for the proposed design ψ0, Experiment 1.1
caption: >-
  Nothing here has been measured; the protocol is a proposal. The memory
  row is checked twice, once as a prediction before the replay and once at
  the allocator; the consistency row sits outside the branch because it
  marks an accounting error, not a pass. Every rejection is attributed to a
  level of §1.2 and returns to Algorithm 1.1 line 9, except a permission
  violation, whose constraint has no relaxation.
placement: wide
evidence: ASSUMED
source: ["DERIVED:eq-1.8", "DERIVED:alg-1.1", P40]
alt: >-
  Left-to-right diagram of Experiment 1.1. Inputs: the held-out split of T_0
  (distinct questions from distinct documents); the versioned corpus feeding
  the retrieval index; a replayed arrival trace at λ_max with declared
  input-length quantiles; a declared hardware class with a pinned engine and
  vendor peaks as ASSUMED bounds; three baselines (retrieval-only, a smaller
  general model, ψ0 without retrieval). The design ψ0 (dense, b = 2,
  S_max = 16,384, k = 8, n_rep = 2, B_max = 16; base → SFT → gate →
  deployment with retrieval) feeds four measurement groups: Q̂ and the two
  error rates with paired bootstrap 95% intervals; TTFT and TPOT p50, p95
  and p99 at the client boundary; goodput and peak allocator memory; cost
  per accepted task with ASSUMED prices. A pre-test compares the Eq. N.8
  prediction plus a runtime term with M_cap. All feed the branch "any
  rejection row fires": none means feasible; any means rejected, attributed
  to a level, and returned through Algorithm 1.1 line 9 to a revised
  design. TPOT p50 below the Eq. 1.6 bound marks an accounting error.
spec:
  direction: LR
  nodes:
    - { id: t0, kind: dataset, label: "T_0 held-out split", sub: "distinct questions, distinct documents" }
    - { id: corpus, kind: dataset, label: "versioned corpus → index" }
    - { id: trace, kind: dataset, label: "replayed arrival trace at λ_max", sub: "declared input-length quantiles" }
    - { id: hw, kind: hardware, label: "declared hardware class, pinned engine", sub: "P_peak, B_mem as ASSUMED vendor bounds" }
    - { id: base, kind: dependency, label: "baselines: retrieval-only · smaller model · no retrieval" }
    - { id: psi, kind: model, label: "ψ0: dense, b = 2, S_max = 16,384, k = 8, n_rep = 2, B_max = 16", sub: "base → SFT → gate → deploy with retrieval" }
    - { id: pred, kind: memory, label: "pre-test: Eq. N.8 + runtime ≤ M_cap?" }
    - { id: mq, kind: metric, label: "Q̂, err_unsupported, err_permission", sub: "paired bootstrap 95% over units" }
    - { id: ml, kind: metric, label: "TTFT, TPOT p50 / p95 / p99", sub: "client boundary, replay window" }
    - { id: mg, kind: metric, label: "goodput, peak allocator memory" }
    - { id: mc, kind: metric, label: "cost per accepted task", sub: "window stated, prices ASSUMED" }
    - { id: br, kind: branch, label: "any rejection row fires?" }
    - { id: ok, kind: state, label: "ψ0 feasible: every interval on the satisfying side" }
    - { id: rej, kind: state, label: "ψ0 rejected, attributed to a level (§1.2)" }
    - { id: relax, kind: feedback, label: "Algorithm 1.1 line 9: relax least-severe, record" }
    - { id: cons, kind: metric, label: "consistency: TPOT_p50 below the Eq. 1.6 bound?" }
    - { id: acct, kind: state, label: "accounting error, not a pass" }
  edges:
    - { from: corpus, to: psi, kind: dependency, label: "index" }
    - { from: hw, to: psi, kind: dependency }
    - { from: t0, to: mq }
    - { from: psi, to: mq }
    - { from: base, to: mq, kind: dependency, label: "same units and intervals" }
    - { from: trace, to: ml }
    - { from: psi, to: ml }
    - { from: trace, to: mg }
    - { from: psi, to: mg }
    - { from: mg, to: mc }
    - { from: psi, to: pred }
    - { from: pred, to: br }
    - { from: mq, to: br }
    - { from: ml, to: br }
    - { from: mg, to: br }
    - { from: mc, to: br }
    - { from: br, to: ok, label: "none" }
    - { from: br, to: rej, kind: emphasis, label: "any row" }
    - { from: rej, to: relax }
    - { from: relax, to: psi, kind: feedback, label: "revised design" }
    - { from: ml, to: cons }
    - { from: cons, to: acct, label: "fires" }
```

## 3. Acceptance criteria

1. Every field of `spec.yaml` is present with a label and a source; `rejection_criteria` is non-empty. (Categorical.)
2. Algorithm 1.1 returns `feasible = true` on the ledger bounds *before* any measurement, with the relaxation log empty or documented. (Categorical.)
3. All eight rows of the rejection table are measured; none rejects, with intervals reported at 95% over independent units of stated count. (Numeric per row; tolerances are the interval widths.)
4. The three baselines are reported alongside ψ_0 with the same units and intervals; ψ_0's Q̂ interval excludes the retrieval-only baseline's interval, or the design is returned for revision because generation adds no measured value. (Numeric.)
5. Every latency and throughput figure sits in a table stating hardware, model, precision, sequence length, input/output distribution, concurrency, runtime version, and measurement boundary. (Categorical.)
6. The consistency row does not fire. (Categorical.)

## 4. What this edition did not do

This protocol is a proposal. No specification instance was populated with measured values, no index was built, no model was deployed, no arrival trace was replayed, no interval was computed, and no design was accepted or rejected. The numeric inputs in the Assumption block are illustrative planning values and are not recommendations. Every result-bearing label in this file is MATHEMATICALLY-DERIVED (for the form of Eq. 1.8 and the bounds), ASSUMED (for thresholds), or UNVERIFIED (for anything that would require a measurement). No label asserting a performed experiment appears in this chapter.
