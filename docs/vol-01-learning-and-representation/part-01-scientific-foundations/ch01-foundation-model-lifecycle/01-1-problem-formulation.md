---
id: ms.section.1.1
entity_type: section
title: Problem formulation
short_title: Problem formulation
volume: 1
part: 1
chapter: 1
section: 1.1
slug: 01-1-problem-formulation
parent: ms.chapter.1
prev_sibling: null
next_sibling: ms.section.1.2
children: []
prerequisites: [ms.frontmatter.notation]
downstream: [ms.section.2.6, ms.section.6.1, ms.section.6.5, ms.section.48.1, ms.section.61.1, ms.section.66.3]
related: [ms.section.1.5, ms.section.1.6]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P50}
  - {type: prerequisite_of, target: ms.section.6.1}
  - {type: evaluated_by, target: ms.verification.1}
axes:
  lifecycle: [evaluation, serving, assurance]
  mechanism: [problem_formulation, constrained_optimization]
  feedback_setting: []
  modality: [text]
papers: [P50, P21]
implementations: [impl.vllm, impl.sglang, impl.tensorrt-llm, impl.llama-cpp, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, ASSUMED, KNOWN, DERIVED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 1700
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 1.1 Problem formulation

## Scope

Objective: turn an application request into a specification whose every field is measurable. Baseline: the informal brief ("a helpful assistant for our documents"), against which nothing can be rejected. Success: a specification naming task distribution, intended users, capabilities, acceptable errors, operating conditions, and success criteria with estimators and thresholds, so that a later measurement can reject it. Boundaries: statistical machinery is owned by [§2.5](../ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md) and [§2.6](../ch02-mathematical-and-statistical-foundations/02-6-optimization-language.md); benchmark construction by [§6.1](../ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md).

## Why this exists

Projects optimized a proxy (a public benchmark, a preference win-rate) never shown to be the quantity users pay for, and found the mismatch after the training budget was spent. A large run is not repeatable at will, so the specification is the only cheap place to be wrong. Quality, latency, memory, and cost are coupled through the same decision variables (model size, precision, context length, retrieval), so a specification naming one and omitting the others is either unsatisfiable or unfalsifiable. HELM made explicit that a single scenario–metric pair is not an evaluation and that accuracy, calibration, robustness, fairness, bias, toxicity, and efficiency trade off (PAPER-REPORTED · P50); this section extends that discipline to the whole specification.

## Intuition

Every field is a claim about how a bounded resource is spent to reduce a bounded error. A latency bound is a bound on memory traffic per token at a given batch; an accuracy threshold at fixed context length bounds how much conditioning can be consumed per request; a cost ceiling divides the remaining budget between parameters, tokens, and replicas. The specification is a budget allocation with an acceptance test.

Heuristically, it is the job description the model is hired against: useful for enumerating fields, useless for setting thresholds, which come from the error-severity table and the ledger.

## Formulation

> **Definition — task distribution.** A distribution 𝒟_task over triples (c, y*, u): conditioning input c, reference or acceptance function y*, and user context u (segment, locale, permissions), defined by a population, a sampling procedure, and a held-out split identifier, not by a benchmark name.

> **Definition — operating conditions.** The envelope Ω of input-length distribution, arrival-rate envelope, concurrency, hardware class, precision, and policy constraints under which success criteria must hold.

> **Definition — acceptable error.** For error class k with severity s_k, a tolerated rate ε_k with a stated estimator and confidence procedure.

> **Definition — success criterion.** A tuple (metric from the fixed vocabulary, estimator, threshold, confidence procedure, evaluator-independence statement) fixed before measurement.

Let f_ψ be the deployed system (model, retrieval, decoding, serving policy) under design ψ ∈ Ψ, and q(f_ψ(c), y*, u) ∈ {0,1} the acceptance function. The expected accepted-task rate is

$$
Q(\psi) = \mathbb{E}_{(c, y^*, u) \sim \mathcal{D}_{\text{task}}}\big[\, q(f_\psi(c), y^*, u)\,\big]
$$
*(Eq. 1.1)* where ψ = design decisions, q = acceptance function, 𝒟_task = task distribution.

The specification is the constrained problem

$$
\max_{\psi \in \Psi}\; Q(\psi)\quad \text{s.t.}\quad
\begin{cases}
\text{err}_k(\psi) \le \varepsilon_k & \forall k \\
\text{lat}_{p95}(\psi;\,\Omega) \le \tau_{\text{lat}} \\
M_{\text{params}}(\psi) + M_{KV}(\psi;\,\Omega) + M_{\text{runtime}} \le M_{\text{cap}} \\
\text{throughput}(\psi;\,\Omega) \ge \lambda_{\max} \\
\text{cost per accepted task}(\psi) \le \kappa
\end{cases}
$$
*(Eq. 1.2)* where err_k = rate of error class k, lat_p95 = p95 E2E latency at a stated boundary, M_* per [Eq. N.5, N.8](../../../front-matter/notation.md), M_cap = per-replica memory capacity, λ_max = peak arrival rate in requests/s (local symbol; not the loss weight), κ = cost ceiling under [notation §2.10](../../../front-matter/notation.md).

```figure
id: fig-1.4
kind: diagram
title: The specification as one constrained problem, Eq. 1.2
caption: >-
  Every constraint row reads the same design ψ, which is why quality,
  latency, memory and cost cannot be specified one at a time. Only the
  objective and the error rows read the task distribution; the operating
  envelope Ω enters latency, memory (through M_KV) and throughput. The branch
  is the claim below: an infeasible specification is found on the ledger
  before training, and its only exit is a recorded relaxation, never a larger
  run.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-1.1", "DERIVED:eq-1.2"]
concepts: [ms.section.1.1]
alt: >-
  Left-to-right diagram of Eq. 1.1 and Eq. 1.2. A design ψ in Ψ (model
  category, parameter count, precision, context policy, retrieval, replicas)
  feeds the objective, maximise Q(ψ), the expected accepted-task rate of
  Eq. 1.1, which reads the task distribution of (c, y*, u) triples through an
  expectation. The same ψ feeds five constraint rows: err_k(ψ) ≤ ε_k for
  every error class, which also reads the task distribution; p95 latency at
  a stated boundary ≤ τ_lat; M_params + M_KV + M_runtime ≤ M_cap per replica;
  throughput ≥ λ_max requests per second; cost per accepted task ≤ κ. The
  operating conditions Ω feed the latency, memory and throughput rows; the
  ledger bounds of §1.5 feed the memory and cost rows. All five rows lead to
  the branch "feasible point exists?". Yes leads to committing a training
  budget; no leads to relaxing the least-severe constraint once, which
  returns to the design space (Algorithm 1.1 line 9).
spec:
  direction: LR
  nodes:
    - { id: psi, kind: branch, label: "design ψ ∈ Ψ", sub: "category · N · b · context · retrieval · replicas" }
    - { id: dtask, kind: dataset, label: "task distribution 𝒟_task", sub: "(c, y*, u) triples, held-out split id" }
    - { id: omega, kind: dependency, label: "operating conditions Ω", sub: "lengths · arrivals · concurrency · hardware" }
    - { id: ledger, kind: dependency, label: "ledger bounds (§1.5)", sub: "ten entries, label and source each" }
    - { id: q, kind: objective, label: "max Q(ψ), Eq. 1.1", sub: "expected accepted-task rate", emphasis: true }
    - { id: err, kind: metric, label: "err_k(ψ) ≤ ε_k for all k", sub: "one row per severity level" }
    - { id: lat, kind: metric, label: "lat_p95(ψ; Ω) ≤ τ_lat", sub: "E2E at a stated boundary" }
    - { id: mem, kind: memory, label: "M_params + M_KV + M_runtime ≤ M_cap", sub: "per replica, Eq. N.5 and N.8" }
    - { id: thr, kind: metric, label: "throughput(ψ; Ω) ≥ λ_max", sub: "requests/s at peak arrival" }
    - { id: cost, kind: metric, label: "cost per accepted task ≤ κ", sub: "notation §2.10" }
    - { id: feas, kind: branch, label: "feasible point exists?", sub: "on ledger bounds, before any run" }
    - { id: commit, kind: state, label: "commit the training budget" }
    - { id: relax, kind: feedback, label: "relax the least-severe constraint once, record it" }
  edges:
    - { from: psi, to: q, kind: emphasis, label: "q(f_ψ(c), y*, u)" }
    - { from: dtask, to: q, kind: dependency, label: "expectation over" }
    - { from: dtask, to: err, kind: dependency }
    - { from: psi, to: err }
    - { from: psi, to: lat }
    - { from: psi, to: mem }
    - { from: psi, to: thr }
    - { from: psi, to: cost }
    - { from: omega, to: lat, kind: dependency }
    - { from: omega, to: mem, kind: dependency, label: "M_KV(ψ; Ω)" }
    - { from: omega, to: thr, kind: dependency }
    - { from: ledger, to: mem, kind: dependency }
    - { from: ledger, to: cost, kind: dependency }
    - { from: err, to: feas }
    - { from: lat, to: feas }
    - { from: mem, to: feas }
    - { from: thr, to: feas }
    - { from: cost, to: feas }
    - { from: feas, to: commit, label: "yes" }
    - { from: feas, to: relax, label: "no" }
    - { from: relax, to: psi, kind: feedback, label: "Algorithm 1.1 line 9" }
```

> **Assumption.** Q(ψ) is estimated on a finite held-out sample of independent draws from 𝒟_task · *sensitivity:* dependent units (several items per document or user) understate interval width and let a design pass by chance; [§6.4](../ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md) owns the correction.

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-1.2].** Eq. 1.2 has no feasible point when its constraints are jointly inconsistent over Ψ; an infeasible specification cannot be fixed by training, so feasibility is checked on the ledger of [§1.5](01-5-resource-accounting.md) before any run.

The gate has a sample-size cost that follows from its estimators. For a rate estimated on n independent units, the normal-approximation half-width at critical value z is δ = z·sqrt(Q̂(1−Q̂)/n), which is largest at Q̂ = 1/2, so

$$
n \;\ge\; \frac{z^{2}}{4\,\delta^{2}}, \qquad\qquad \varepsilon_{\text{upper}} = 1 - \alpha^{1/n} \approx \frac{-\ln \alpha}{n}\quad\text{(zero violations observed in } n \text{ units)}
$$
*(Eq. 1.9)* where δ = target half-width of the interval on Q or on an error rate, z = normal critical value, α = one-sided error level (local symbol; not the scaling exponent of Eq. N.3), ε_upper = exact upper confidence bound on a rare-error rate when none was observed, from (1 − ε)^n = α.

```figure
id: fig-1.5
kind: calculator
title: Sample size of the gate, Eq. 1.9
caption: >-
  Two estimators, two prices. The first output is the independent units a
  ±δ interval on an accepted-task or error rate needs at its worst case,
  Q̂ = 1/2; the second is the violation-free units that certify a rare error
  class at ε_k. At the defaults they are 2,401 and 2,995, the two numbers of
  the claim below. Scroll: the instrument follows the specification from the
  formula to the threshold field, the pilot, and the untestable threshold.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-1.9"
concepts: [ms.section.1.1]
alt: >-
  Calculator for Eq. 1.9 with inputs z (1.645, 1.96 or 2.576), half-width δ,
  one-sided level α and a rare-error rate ε_k to certify. Outputs: units for
  a half-width δ at Q̂ = 1/2, ceil(z²/(4δ²)); violation-free units for an
  exact upper bound 1 − α^(1/n) at or below ε_k, ceil(ln α / ln(1 − ε_k));
  the approximation −ln α / ε_k; and −ln α itself. At z = 1.96, δ = 0.02,
  α = 0.05 and ε_k = 10⁻³: 2,401 units, 2,995 violation-free units, 2,996 by
  the approximation, and −ln α = 3.00. States: δ = 0.01 gives 9,604 units;
  the pilot state δ = 0.05, ε_k = 10⁻² gives 385 and 299; ε_k = 10⁻⁴ gives
  29,956 violation-free units.
states:
  - { anchor: formulation, label: "δ = 0.02 · ε_k = 10⁻³", variables: { z: 1.96, delta: 0.02, alpha: 0.05, eps: 0.001 }, highlight: [nq, nz], note: "The claim's two numbers: 2,401 units give ±0.02 on Q at z = 1.96, and 2,995 violation-free units (≈ 3.0/ε_k) certify a severe error class at 10⁻³." }
  - { anchor: mechanism, label: "step 6 · δ = 0.01", variables: { z: 1.96, delta: 0.01, alpha: 0.05, eps: 0.001 }, highlight: [delta, nq], note: "Step 6 fixes estimator and threshold together. Halving δ to 0.01 quadruples the sample to 9,604 units, which is why n is written beside every threshold." }
  - { anchor: experimental-design, label: "pilot on T_0", variables: { z: 1.96, delta: 0.05, alpha: 0.05, eps: 0.01 }, highlight: [nq, nz], note: "Validating the specification on an existing model before training: ±0.05 needs 385 units and a 10⁻² error class 299 clean ones, at inference cost only." }
  - { anchor: failure-modes, label: "untestable · ε_k = 10⁻⁴", variables: { z: 1.96, delta: 0.02, alpha: 0.05, eps: 0.0001 }, highlight: [eps, nz], note: "A 10⁻⁴ severe-error threshold needs 29,956 violation-free independent units. If the pilot cannot afford them the threshold is untestable, not passed." }
spec:
  tex: >-
    n \ge \frac{z^{2}}{4\,\delta^{2}},\qquad \varepsilon_{\text{upper}} = 1 - \alpha^{1/n} \approx \frac{-\ln\alpha}{n}
  equation: "1.9"
  inputs:
    - { symbol: z, label: "normal critical value z", default: 1.96, min: 1.645, max: 2.576, options: [1.645, 1.96, 2.576], format: fixed3 }
    - { symbol: delta, label: "target half-width δ", default: 0.02, min: 0.005, max: 0.1, options: [0.005, 0.01, 0.02, 0.03, 0.05, 0.1], format: fixed3 }
    - { symbol: alpha, label: "one-sided level α", default: 0.05, min: 0.01, max: 0.1, options: [0.01, 0.05, 0.1], format: fixed2 }
    - { symbol: eps, label: "rare-error rate to certify ε_k", default: 0.001, min: 0.0001, max: 0.05, options: [0.0001, 0.001, 0.01, 0.05], format: percent }
  outputs:
    - { symbol: nq, label: "units for ±δ at Q̂ = 1/2", formula: "ceil(z^2/(4*delta^2))", format: integer, emphasis: true }
    - { symbol: nz, label: "violation-free units for ε_upper ≤ ε_k", formula: "ceil(ln(alpha)/ln(1 - eps))", format: integer, emphasis: true }
    - { symbol: na, label: "same, by the −ln α / ε_k approximation", formula: "-ln(alpha)/eps", format: integer }
    - { symbol: r3, label: "−ln α, the 3.0 of ε_upper ≈ 3.0/n", formula: "-ln(alpha)", format: fixed2 }
```

> **Claim [MATHEMATICALLY-DERIVED · DERIVED:eq-1.9].** With z = 1.96 and δ = 0.02, the first bound gives n ≥ 2,401 independent units. With α = 0.05 the second gives ε_upper ≈ 3.0/n, so certifying a severe error class at ε_k ≤ 10⁻³ needs about 3,000 violation-free independent units. A threshold tighter than the affordable n cannot be tested; the specification must therefore state n beside every threshold. These are properties of the estimators, not measurements.

```figure
id: fig-1.6
kind: chart
title: Resolvable rate against independent units, Eq. 1.9
caption: >-
  The two bounds fall at different speeds: the interval half-width as 1/√n,
  the zero-violation bound as 1/n. Both reach the thresholds of the claim
  between n ≈ 2,400 and 3,000, but beyond that each tenfold increase in
  units buys √10 on the interval and 10× on the rare-error bound. The dashed
  −ln α / n line stays within 2% of the exact bound from n = 100 upward.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-1.9"
alt: >-
  Log–log line chart of the rate an estimator can resolve against the number
  of independent units n, from 100 to 100,000, at z = 1.96 and α = 0.05. The
  interval half-width at Q̂ = 1/2, z/(2√n), is 0.098 at n = 100, 0.02 at
  n = 2,401, 0.0098 at n = 10,000 and 0.0031 at n = 100,000. The exact upper
  bound on a rare-error rate with zero violations, 1 − α^(1/n), is 0.0295 at
  n = 100, 0.0010 at n = 2,995, 0.0003 at n = 10,000 and 0.00003 at
  n = 100,000. The approximation −ln α / n is dashed and nearly coincides
  with the exact bound. Annotations mark n = 2,401 (δ = 0.02) and n = 2,995
  (ε_upper = 10⁻³).
spec:
  type: line
  x: { label: "independent units n", scale: log10, format: integer, domain: [100, 100000] }
  y: { label: "resolvable rate", scale: log10, format: percent }
  variables: { z: 1.96, alpha: 0.05 }
  series:
    - { id: half, label: "half-width z/(2√n) at Q̂ = 1/2", formula: "z/(2*sqrt(x))", sample: { from: 100, to: 100000, count: 13 } }
    - { id: zero, label: "ε_upper = 1 − α^(1/n), zero violations", formula: "1 - alpha^(1/x)", sample: { from: 100, to: 100000, count: 13 }, emphasis: true }
    - { id: approx, label: "−ln α / n", formula: "-ln(alpha)/x", sample: { from: 100, to: 100000, count: 13 }, dashed: true }
  annotations:
    - { x: 2401, label: "n = 2,401: δ = 0.02" }
    - { x: 2995, label: "n = 2,995: ε_upper = 10⁻³" }
```

## Mechanism

The mechanism is the ordered translation of a request into the fields of Eq. 1.2; the order prevents unfalsifiable fields.

| Step | Field | Source of value | Label on the field |
|---|---|---|---|
| 1 | Task distribution | population definition and sampling procedure; pilot sample T_0 | KNOWN once T_0 exists; ASSUMED before |
| 2 | Intended users | segments in u with request mix and permissions | ASSUMED (product input) |
| 3 | Capabilities | enumerated claims bound to benchmark records | KNOWN per record |
| 4 | Acceptable errors | severity table: class → harm → ε_k | ASSUMED with sensitivity |
| 5 | Operating conditions | Ω from load logs or a declared envelope | KNOWN (logs) or ASSUMED |
| 6 | Success criteria | metric, estimator, threshold, confidence, evaluator | ASSUMED threshold; MATHEMATICALLY-DERIVED estimator |
| 7 | Resource constraints | ten ledger entries with bounds | per [§1.5](01-5-resource-accounting.md) |

Model cards proposed intended use, out-of-scope use, and evaluation disaggregated across conditions as reporting fields (PAPER-REPORTED · R1.3); datasheets did the same for a dataset's motivation, composition, collection, and recommended uses (PAPER-REPORTED · R1.4). Here those fields are inputs fixed before development, not post-hoc documentation.

```figure
id: fig-1.7
kind: stat-panel
title: Specification fields and the labels they can carry
caption: >-
  Four of the seven fields are product inputs or per-entry bounds that stay
  ASSUMED until a measurement replaces them, which is why each carries a
  sensitivity note; three can become KNOWN from a pilot sample, benchmark
  records, or load logs. The two formula rows are the price of step 6 from
  Eq. 1.9: a success criterion tighter than these sample sizes cannot be
  tested.
placement: rail
anchor: mechanism
evidence: DERIVED
source: ["DERIVED:alg-1.1", "DERIVED:eq-1.9"]
alt: >-
  Instrument panel listing the seven fields of Algorithm 1.1 with the label
  each can carry: task distribution, KNOWN once the pilot sample T_0 exists;
  intended users, ASSUMED product input; capabilities, KNOWN per benchmark
  record; acceptable errors, ASSUMED with sensitivity; operating conditions,
  KNOWN from logs or else ASSUMED; success criteria, ASSUMED threshold with a
  mathematically derived estimator; resource constraints, per ledger entry of
  §1.5. Two computed rows from Eq. 1.9: 2,401 units for a ±0.02 interval at
  Q̂ = 1/2 and z = 1.96, and 2,995 violation-free units to certify an error
  class at 10⁻³ with α = 0.05. A dot glyph fills three of seven dots for the
  fields that can become KNOWN.
spec:
  header: "SPEC σ · SEVEN FIELDS · LABELS"
  variables: { z: 1.96, delta: 0.02, alpha: 0.05, eps: 0.001 }
  rows:
    - { key: "1 task distribution", value: "KNOWN once T_0 exists" }
    - { key: "2 intended users", value: "ASSUMED product input" }
    - { key: "3 capabilities", value: "KNOWN per benchmark record" }
    - { key: "4 acceptable errors", value: "ASSUMED, with sensitivity" }
    - { key: "5 operating conditions Ω", value: "KNOWN from logs, else ASSUMED" }
    - { key: "6 success criteria", value: "ASSUMED threshold" }
    - { key: "7 resource constraints", value: "per ledger entry, §1.5" }
    - { key: "units for ±0.02 at Q̂ = 1/2", formula: "ceil(z^2/(4*delta^2))", format: integer, note: "Eq. 1.9, z = 1.96" }
    - { key: "clean units for ε_k = 10⁻³", formula: "ceil(ln(alpha)/ln(1 - eps))", format: integer, note: "Eq. 1.9, α = 0.05" }
  glyph:
    type: dots
    total: 7
    filled: 3
    legend:
      - { marker: filled, label: "can become KNOWN from records", value: "fields 1, 3, 5" }
      - { marker: hollow, label: "ASSUMED or per ledger entry", value: "fields 2, 4, 6, 7" }
```

Cost line: engineering time plus a pilot sample; gate cost = n of Eq. 1.9 × per-request inference FLOPs ([Eq. 1.5](01-5-resource-accounting.md)) plus judging cost per unit; latency, energy, and money of the gate are UNVERIFIED until a load test is run; no training FLOPs. Its failure cost is the whole downstream budget.

## Algorithm

```text
Algorithm 1.1 — Specification construction
INPUT   request R; load logs or envelope Ω_0; harm ledger H; budget κ
OUTPUT  specification σ = (𝒟_task, U, Cap, {ε_k}, Ω, Crit, Ledger, Reject)
STATE   feasible ∈ {unknown, true, false}
INVARIANT  every field of σ carries an evidence label and a source
 1. define population P and sampling procedure S from R; draw pilot T_0 ~ S(P); 𝒟_task := (P, S, split-id)
 2. enumerate user segments U with request mix and permissions
 3. for each capability claim: bind to a benchmark record, or mark UNVERIFIED and drop from Cap
 4. for each error class k in H: set severity s_k, tolerated rate ε_k, sensitivity
 5. set Ω from Ω_0: input-length quantiles, arrival envelope, concurrency, hardware class, precision
 6. for each success criterion: fix (metric, estimator, threshold, confidence procedure, evaluator)
 7. Ledger := Algorithm 1.5 over candidate designs Ψ
 8. feasible := ∃ ψ ∈ Ψ satisfying Eq. 1.2 on Ledger bounds
 9. if not feasible: relax the least-severe constraint once, record it, go to 7
10. Reject := the measurements of verification.md that would reject σ
11. return σ
TERMINATION  step 9 relaxes each constraint at most once per severity level
```

```figure
id: fig-1.8
kind: diagram
title: Specification construction with bounded relaxation, Algorithm 1.1
caption: >-
  Steps 1–6 turn the request into fields and never loop. Only steps 7–9 can
  repeat, and that loop runs through the ledger, not through training. Each
  constraint is relaxed at most once per severity level (the termination
  clause), so an infeasible specification either becomes feasible with a
  written relaxation or stops here, before any budget is committed.
placement: inline
evidence: DERIVED
source: "DERIVED:alg-1.1"
alt: >-
  Top-to-bottom flow of Algorithm 1.1. Inputs: request R, load logs or
  envelope Ω_0, harm ledger H and budget κ. Step 1 defines population P,
  sampling procedure S and pilot T_0, fixing 𝒟_task as (P, S, split id). Step
  2 enumerates user segments with request mix and permissions. Step 3 binds
  each capability claim to a benchmark record or marks it UNVERIFIED and
  drops it. Step 4 sets severity and tolerated rate per error class. Step 5
  sets Ω from Ω_0. Step 6 fixes metric, estimator, threshold, confidence
  procedure and evaluator per criterion. Step 7 builds the ledger with
  Algorithm 1.5 over candidate designs. Step 8 branches on whether some
  design satisfies Eq. 1.2. If not, step 9 relaxes the least-severe
  constraint once, records it and returns to step 7. If so, step 10 attaches
  the rejection measurements of verification.md and σ is returned with every
  field labeled and sourced.
spec:
  direction: TB
  nodes:
    - { id: req, kind: dependency, label: "request R · load logs Ω_0 · harm ledger H · budget κ" }
    - { id: s1, kind: process, label: "1 · population P, sampling S, pilot T_0", sub: "𝒟_task := (P, S, split id)" }
    - { id: s2, kind: process, label: "2 · user segments U, request mix, permissions" }
    - { id: s3, kind: process, label: "3 · bind each capability to a benchmark record", sub: "unbound → UNVERIFIED, dropped" }
    - { id: s4, kind: process, label: "4 · severity s_k and tolerated rate ε_k per class" }
    - { id: s5, kind: process, label: "5 · Ω from Ω_0", sub: "length quantiles · arrivals · concurrency · hardware" }
    - { id: s6, kind: process, label: "6 · metric, estimator, threshold, confidence, evaluator" }
    - { id: s7, kind: process, label: "7 · Ledger := Algorithm 1.5 over Ψ" }
    - { id: s8, kind: branch, label: "8 · ∃ ψ ∈ Ψ satisfying Eq. 1.2?" }
    - { id: s9, kind: feedback, label: "9 · relax the least-severe constraint once, record it" }
    - { id: s10, kind: process, label: "10 · Reject := measurements of verification.md" }
    - { id: out, kind: objective, label: "σ returned", sub: "every field labeled and sourced" }
  edges:
    - { from: req, to: s1 }
    - { from: s1, to: s2 }
    - { from: s2, to: s3 }
    - { from: s3, to: s4 }
    - { from: s4, to: s5 }
    - { from: s5, to: s6 }
    - { from: s6, to: s7 }
    - { from: s7, to: s8 }
    - { from: s8, to: s10, kind: emphasis, label: "feasible" }
    - { from: s8, to: s9, label: "infeasible" }
    - { from: s9, to: s7, kind: feedback, label: "go to 7" }
    - { from: s10, to: out }
```

Complexity: linear in fields and constraints; the pilot sample dominates. Implementation link: the artifact record in the [chapter README](README.md).

## Implementation

No tensors or kernels: the implementation is a versioned file beside the benchmark manifest of [§6.6](../ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md) and the workload specification of [§48.1](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-1-workload-specification.md), which refines Ω. Metric names use the fixed vocabulary (TTFT, TPOT, p95, cost per accepted task). The constraints are realised by measurement on reference-stack systems: latency, throughput, and memory rows on vLLM, SGLang, or TensorRT-LLM (*Inference engine* layer) or llama.cpp for local targets; quality rows through Hugging Face Transformers (*Model definition / adaptation* layer) under a pinned harness. The HELM harness is outside the §4 system list and is reached through the Stanford CRFM code surface (§1, #38). No version is pinned here, so every such figure is UNVERIFIED until the owning chapter pins one.

## Experimental design

Proposal: validate the specification before training by measuring an existing model under Ω on the held-out split of T_0. Baselines: retrieval-only and a smaller general model, anchoring the threshold to what is cheaply attainable. Ablations: context-length and retrieval policy with the model fixed. Budget: inference only. Seeds: decoding and evaluation-order seeds recorded. Evaluator independence: acceptance judged by a procedure that produced no training data. Uncertainty: bootstrap over independent units. Full protocol: [Experiment 1.1](verification.md).

## Observations

**What the paper claims.** HELM reports seven metrics on each of 16 core scenarios for 30 models and states that "metrics beyond accuracy don't fall to the wayside" and "trade-offs are clearly exposed" (PAPER-REPORTED · P50, abstract v2, accessed 2026-09-20). InstructGPT reports that labelers preferred outputs of its 1.3B model to those of the 175B GPT-3 on its prompt distribution, with "minimal performance regressions on public NLP datasets" (PAPER-REPORTED · P21).

**What the evidence shows.** Both results rest on the authors' own scenario sets, labeler pools, and prompt distributions; neither is reproduced here. The InstructGPT preference is evidence that the task distribution, not size, orders models on that distribution.

**What we infer.** DERIVED: a single-metric specification cannot detect the trade-offs HELM measured, so Eq. 1.2 carries at least one error-class constraint per severity level. ASSUMED: thresholds are product inputs with sensitivity notes.

**What remains unknown.** Whether a specification written before training predicts post-deployment acceptance within useful tolerance is UNVERIFIED; no public calibration study is cited. Real request distributions of named products are NOT-DISCLOSED.

## Failure modes

> **Failure mode — proxy substitution.** *Symptom:* benchmark score rises while production acceptance is flat. *Cause:* the criterion names a benchmark whose distribution is not 𝒟_task. *Detection:* per-segment acceptance on T_0 diverges from the benchmark. *Mitigation:* bind capabilities to records built from 𝒟_task.

> **Failure mode — unbounded envelope.** *Symptom:* p95 latency passes the load test and fails in production. *Cause:* Ω omitted the context-length tail or arrival bursts. *Detection:* measured input-length quantiles exceed declared ones. *Mitigation:* derive Ω from logs with stated quantiles.

> **Failure mode — infeasible specification.** *Symptom:* every candidate violates some constraint. *Cause:* constraints set without the ledger. *Detection:* Algorithm 1.1 line 8. *Mitigation:* documented relaxation by severity.

## Siblings

**Preregistered experiment** — [§6.6](../ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence.md)
Why it exists: fix hypotheses and analyses before data. What assumption changed: the object is one experiment, not a product. What objective changed: validity of a comparison rather than feasibility of a system. What problem it solved: post-hoc analysis. What new failure mode: rigid protocols that cannot absorb a corrected error taxonomy. Changed primitive: specification → protocol.

**Workload specification** — [§48.1](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-1-workload-specification.md)
Why it exists: capacity planning needs Ω at finer resolution. What assumption changed: the model is fixed. What objective changed: goodput at the SLO instead of Q(ψ). What problem it solved: load tests that do not represent traffic. What new failure mode: overfitting capacity to one replayed trace. Changed primitive: task distribution → request trace.

**Objective ledger** — [§4.1](../ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md)
Why it exists: the training objective needs masks and normalization. What assumption changed: it constrains learning, not acceptance. What objective changed: likelihood rather than acceptance. What problem it solved: incomparable losses. What new failure mode: likelihood gains that do not move Q(ψ). Changed primitive: acceptance function → loss.

```figure
id: fig-1.9
kind: compare
title: The system specification and its siblings
caption: >-
  Each sibling keeps the discipline of fixing criteria before data and
  changes the object they are fixed on: an experiment, a request trace, or a
  training loss. The last row is the price of each change, and only the
  objective ledger's failure lands back on this section's Q(ψ).
placement: wide
evidence: DERIVED
source: "DERIVED:eq-1.2"
alt: >-
  Comparison of the system specification of §1.1 with three siblings.
  System specification: one application before development; optimises
  feasibility, then Q(ψ) under Eq. 1.2; solves optimising a proxy users do
  not pay for; fails as infeasible or unfalsifiable fields. Preregistered
  experiment (§6.6): one experiment; validity of a comparison; primitive
  specification to protocol; solves post-hoc analysis; fails as a rigid
  protocol that cannot absorb a corrected error taxonomy. Workload
  specification (§48.1): the model is fixed; goodput at the SLO; primitive
  task distribution to request trace; solves load tests that do not
  represent traffic; fails by overfitting capacity to one replayed trace.
  Objective ledger (§4.1): the training objective; likelihood rather than
  acceptance; primitive acceptance function to loss; solves incomparable
  losses; fails as likelihood gains that do not move Q(ψ).
spec:
  axis: >-
    What each object fixes before data, what it optimises, and the primitive
    that changes relative to the system specification
  columns:
    - { id: spec, label: "System specification (§1.1)", node: ms.section.1.1 }
    - { id: prereg, label: "Preregistered experiment", node: ms.section.6.6 }
    - { id: workload, label: "Workload specification", node: ms.section.48.1 }
    - { id: objled, label: "Objective ledger", node: ms.section.4.1 }
  rows:
    - { dimension: "object", values: { spec: "one application, before development", prereg: "one experiment, not a product", workload: "a capacity plan with the model fixed", objled: "the training objective" } }
    - { dimension: "what is optimised", values: { spec: "feasibility, then Q(ψ) under Eq. 1.2", prereg: "validity of a comparison", workload: "goodput at the SLO", objled: "likelihood, not acceptance" } }
    - { dimension: "changed primitive", values: { spec: "reference", prereg: "specification → protocol", workload: "task distribution → request trace", objled: "acceptance function → loss" } }
    - { dimension: "problem solved", values: { spec: "a proxy optimised that users do not pay for", prereg: "post-hoc analysis", workload: "load tests that do not represent traffic", objled: "incomparable losses (masks, normalization)" } }
    - { dimension: "new failure mode", values: { spec: "infeasible or unfalsifiable fields", prereg: "a rigid protocol that cannot absorb a corrected error taxonomy", workload: "capacity overfit to one replayed trace", objled: "likelihood gains that do not move Q(ψ)" } }
```

## Extensions

Domain adaptation narrows 𝒟_task and adds domain error classes. Long context puts the input-length distribution into M_KV, coupling quality and memory. Multimodality makes c and y* typed tuples with per-modality evaluators. Agents make acceptance trajectory-level with irreversible actions in the error ledger ([§63.1](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/63-1-interactive-benchmarks.md)). Embodiment replaces p95 latency with hard deadlines. Proposals only.

## Limitations

Valid regime: applications whose acceptance can be judged per unit at tolerable cost. Falsification: if the pilot estimate of Q(ψ) and deployed acceptance differ beyond interval width for well-sampled 𝒟_task, the sampling procedure is wrong. Decision consequence: no training budget is committed before Algorithm 1.1 returns feasible.

## Reproducibility

Artifacts: specification file, pilot sample id, severity table. Metric definitions: [notation §3](../../../front-matter/notation.md). Unresolved: calibration of specifications against deployment outcomes (UNVERIFIED).

## References

P21, P50; R1.3, R1.4; [notation](../../../front-matter/notation.md) Eq. N.5, N.8, §2.10.
