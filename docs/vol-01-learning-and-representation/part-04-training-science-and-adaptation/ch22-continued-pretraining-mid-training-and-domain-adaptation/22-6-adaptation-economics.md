---
id: ms.section.22.6
entity_type: section
title: Adaptation economics
short_title: Adaptation economics
volume: 1
part: 4
chapter: 22
section: 22.6
slug: 22-6-adaptation-economics
parent: ms.chapter.22
prev_sibling: ms.section.22.5
next_sibling: null
children: []
prerequisites: [ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.19, ms.chapter.20, ms.chapter.21]
downstream: [ms.chapter.23, ms.chapter.24, ms.chapter.31]
related: [ms.chapter.49, ms.chapter.50, ms.chapter.63]
relations: []
axes: {lifecycle: [continued_training, adaptation], mechanism: [distribution_transition, retention, adaptation_decision], feedback_setting: [], modality: [text]}
papers: [P13, P40]
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 22.6 Adaptation economics

## Scope

[DERIVED] This section owns the economics of a bounded adaptation decision: usable data availability, task frequency, freshness, amortization, rollback, and deployment constraints. It compares interventions only after Section 22.4's utility and retention gates are fixed. Chapter 21 owns training allocation laws; Chapters 48 and 63 own serving and lifecycle accounting. Success is a decision whose cost boundary and accepted-task denominator can be audited, with sensitivity to uncertain demand and quality.

## Why this exists

[DERIVED] A training run is a fixed investment, while a retrieval/context intervention can move more cost into each request. Comparing only training FLOPs or only inference tokens misses that distinction. An expensive specialization can become economical under frequent reuse; the same artifact can be wasteful when demand is low, the data changes quickly, or the release fails retention validation.

[DERIVED] Data availability also constrains the decision before hardware does. A large nominal corpus may contain duplicates, stale documents, restricted material, or insufficient examples of the desired procedure. Spending more compute on repeated available material does not create additional independent evidence. If governance or freshness requirements eliminate the corpus, an apparently attractive compute estimate does not make the intervention feasible.

## Intuition

[MATHEMATICALLY-DERIVED] Fixed cost is amortized by demand only over the interval in which the artifact remains useful. A model that is retrained every week has a different effective horizon from one reused for a year. Accepted-task cost also depends on the fraction of requests meeting quality and service requirements. A cheaper raw request can be more expensive per accepted task if it fails more often or requires more retries.

[DERIVED] Rollback has economic value because a candidate can pass offline validation and still encounter distributional or systems failures after rollout. That value cannot be represented solely by average benchmark quality. Preserve a compatible prior artifact, state the rollback trigger, and include release, storage, and recovery work in the same decision boundary.

## Formulation

[DERIVED] For intervention $h$ over a common horizon containing $n>0$ requests, let $F_h$ be fixed cost, $v_h$ expected variable cost per request, and $q_h\in(0,1]$ the fraction meeting the declared acceptance rule. All monetary quantities use one stated currency and attribution window. Then

$$
K_h(n)=F_h+n v_h,\qquad
k_h(n)=\frac{F_h+n v_h}{nq_h}
=\frac{F_h}{nq_h}+\frac{v_h}{q_h}.
$$
*(Eq. 22.19)*

[DERIVED] $F_h$ includes data preparation, rights review where relevant, model/index construction, pilots, evaluation, release conversion, and allocated engineering work according to the chosen boundary. $v_h$ includes inference, retrieval, tool calls, retries, and failure handling attributable to each request. $q_h$ includes quality and service criteria; counting only returned responses changes the denominator.

[MATHEMATICALLY-DERIVED] For $F_A/q_A>F_B/q_B$ and $v_B/q_B>v_A/q_A$, the break-even request count is

$$
n_\star=
\frac{F_A/q_A-F_B/q_B}
     {v_B/q_B-v_A/q_A}.
$$
*(Eq. 22.20)*

[MATHEMATICALLY-DERIVED] Under the constant-$q$, constant-$v$ model, $A$ has lower accepted-task cost for $n>n_\star$. If both normalized fixed and variable costs are higher, $A$ never wins this cost axis. If the denominator is zero, the variable-cost advantage is absent and there is no finite crossing unless the fixed costs are also equal. None of these statements ranks interventions on utility beyond the shared acceptance bar.

[DERIVED] Let $H$ be the usable release horizon in seconds, $f$ the mean request frequency in requests/second, and $n=fH$. Freshness, contract expiry, hardware support, or expected replacement can shorten $H$. Demand outside that usable horizon cannot amortize the current release.

## Mechanism

### Methodology

[DERIVED] Begin with feasibility constraints. Record whether weights may be updated, whether optimizer state is available, which data may be used for training or indexing, required access boundaries, supported inference hardware, maximum artifact size, and required output interfaces. A domain-trained artifact that cannot be served within the required latency or memory budget is infeasible regardless of an offline accuracy gain.

[DERIVED] Quantify the usable corpus after deduplication, leakage removal, permissions, and freshness filtering. Distinguish $U_D$, available unique target tokens, from consumed $D_D$. Include the cost of preparing this corpus. Report repetition $D_D/U_D$, but do not use it as a substitute for learning curves. Data may become the limiting resource before the proposed compute budget is exhausted.

[MATHEMATICALLY-DERIVED] Under the explicitly limited dense-Transformer approximation from Chapter 21, corpus-training work is approximately $6ND_s$ FLOPs when attention-score work, recomputation, and nonmodel overhead are excluded. Adaptation may violate those simplifications, especially with long context or MoE. Use measured executed work or a model-specific operator count when those terms are material. Multiplying total MoE parameters by the dense approximation does not give a validated training cost.

[DERIVED] Build a ledger that includes every candidate trial, not just the accepted run. A failed pilot still consumes data processing, device time, and evaluation resources. Dataset screening, mixture integration, repeated seeds, and post-training assessment can dominate a short final adaptation stage. If engineering effort is excluded, say so; do not present a hardware-only estimate as total organizational cost.

[DERIVED] Next estimate demand under uncertainty. Report a range for $n$, not a single optimistic forecast, and compute Eq. 22.19 across that range. Estimate $q_h$ from held-out tasks using the intended service and quality rule. Variable cost can depend on request length, concurrency, evidence availability, and retry policy; stratify those workloads rather than transferring one average to another population.

[DERIVED] Freshness needs a concrete contract. A parametric checkpoint encodes effects of past exposure, while a retrieval system can point to a current index snapshot. Both can become stale: the model may require a new adaptation, and the index may require ingestion, validation, cache invalidation, and access-policy updates. Compare the actual update paths and their latency, not an assumed distinction between “static model” and “always current retrieval.”

[ASSUMED] For a sensitivity calculation only, suppose relevant facts change according to a homogeneous Poisson process with rate $\nu$ changes per second, and any such change invalidates the stored answer. At artifact age $a$, the probability of no change is $e^{-\nu a}$. If requests arrive uniformly over a refresh interval $H$, the average unchanged probability is

$$
p_{\mathrm{fresh}}(H)=
\frac{1}{H}\int_0^H e^{-\nu a}\,da
=\frac{1-e^{-\nu H}}{\nu H},
\quad \nu H>0,
\qquad p_{\mathrm{fresh}}(H)=1\text{ when }\nu=0.
$$
*(Eq. 22.21)*

[DERIVED] This is an analytical scenario, not a measured model of any domain. Correlated changes, heterogeneous document importance, correction delays, and cache behavior can invalidate it. Its role is to expose sensitivity to the refresh interval. A deployment needs actual change and task data before interpreting a freshness probability as an accepted-task rate.

[DERIVED] Finally compare rollback paths. A weight-based deployment needs a pinned prior model, tokenizer, serving configuration, and compatible downstream interfaces. A retrieval deployment needs the corresponding index and policy versions. Rollback must restore the coherent pair, not just one component. Charge retained storage, validation, and recovery work to the chosen lifecycle boundary.

```figure
id: fig-22.18
kind: diagram
title: Adaptation cost over a usable release horizon
caption: The decision includes rejected trials, recurring serving work, refresh, and rollback. Only requests within the artifact's useful horizon amortize its fixed cost.
placement: inline
evidence: DERIVED
source: DERIVED:eq-22.19
alt: Data preparation and pilot trials contribute to fixed cost. An accepted release serves requests until refresh or replacement. Variable serving cost and accepted-task counts enter the same cost denominator, with rollback preserving a previous coherent release.
spec:
  direction: TB
  nodes:
    - { id: data, kind: dataset, label: Usable permitted data }
    - { id: pilots, kind: process, label: Pilots and rejected candidates }
    - { id: fixed, kind: metric, label: Fixed lifecycle cost }
    - { id: release, kind: model, label: Accepted coherent release }
    - { id: demand, kind: flow, label: Requests within usable horizon }
    - { id: variable, kind: metric, label: Serving and failure costs }
    - { id: accepted, kind: metric, label: Tasks meeting quality and service }
    - { id: ratio, kind: metric, label: Cost per accepted task }
    - { id: rollback, kind: state, label: Pinned prior release }
  edges:
    - { from: data, to: pilots }
    - { from: pilots, to: fixed }
    - { from: pilots, to: release }
    - { from: release, to: demand }
    - { from: demand, to: variable }
    - { from: demand, to: accepted }
    - { from: fixed, to: ratio }
    - { from: variable, to: ratio }
    - { from: accepted, to: ratio, kind: emphasis }
    - { from: rollback, to: release, kind: dependency, label: recovery path }
```

## Algorithm

[DERIVED] **Algorithm 22.6 — Feasible lifecycle decision.** Inputs are finite candidate interventions $\mathcal H$, demand interval $0<n_{\min}\le n_{\max}<\infty$, nonempty finite-bounded cost/quality intervals with $F,v\ge0$ and $q\in[0,1]$, retention and service constraints, and a declared decision functional $\mathsf V$ with a bounded evaluation procedure. Reject invalid inputs. Output is an adaptation record, including rejection when no arm is supported.

$$
\begin{aligned}
1.\quad&
\mathcal H_F\gets
\{h\in\mathcal H:
\mathsf{DataPermitted}(h)\land
\mathsf{Deployable}(h)\land
\mathsf{RollbackReady}(h)\}.\\
2.\quad&
\mathcal H_A\gets
\{h\in\mathcal H_F:
\mathcal G_{\mathrm{quality,retention,service}}(h)=1\}.\\
3.\quad&
\mathcal K_h\gets
\left\{\frac{F+n v}{nq}:
n\in[n_{\min},n_{\max}],\
(F,v,q)\in\mathcal I_h,\ q>0\right\}.\\
&\mathcal K_h\gets\mathcal K_h\cup\{+\infty:\
\exists(F,v,0)\in\mathcal I_h\}.\\
4.\quad&
h^\star\gets
\begin{cases}
\arg\min_{h\in\mathcal H_A}\mathsf V(\mathcal K_h),&
\mathcal H_A\ne\varnothing,\\
\bot,&\text{otherwise}.
\end{cases}\\
5.\quad&
r\gets
(h^\star,\mathcal I,\mathcal G,\mathsf V,
\mathsf{RefreshPolicy},\mathsf{RollbackManifest}).
\end{aligned}
$$

[DERIVED] $\mathcal I_h$ is the uncertainty set for fixed cost, variable cost, and acceptance fraction. A worst-case $\mathsf V$, expected-cost $\mathsf V$, or other utility rule must be selected explicitly; they can yield different decisions. An expectation additionally requires a specified probability law. If the uncertainty set includes $q=0$, accepted-task cost is unbounded and no finite-cost claim follows for that case. Resolve ties by a fixed configuration ordering; reject if every decision value is non-finite. The procedure terminates after finite feasibility/evaluation checks and the declared bounded optimization.

## Implementation

[DERIVED] **PyTorch — core training framework; Hugging Face Transformers — model-definition layer.** Training execution supplies device-time and token-accounting records; a release pipeline supplies artifact conversions and serving compatibility checks. Neither framework reading nor parameter count establishes total cost. The adaptation record needs identifiers joining dataset, trial, checkpoint, evaluation, and deployment records.

[MATHEMATICALLY-DERIVED] Persistent storage includes the base artifact, candidates retained for audit, accepted release, rollback release, and optimizer/data state according to archive policy. A full checkpoint's size is not its inference artifact's size. Context-heavy retrieval can increase prefill work and memory, while parameter adaptation may leave inference architecture unchanged. Actual throughput and latency depend on workload and runtime; no cost advantage follows merely from avoiding an index or avoiding training.

[DERIVED] Energy requires measured device and relevant host power integrated over the counted interval, or a clearly labeled estimate with its boundaries. Money requires applicable device/storage/network rates and utilization assumptions. Both are UNVERIFIED for the hypothetical comparison in this chapter. Do not substitute advertised peak FLOPs, TDP, or a provider's headline token price for measured application cost.

```figure
id: fig-22.19
kind: calculator
title: Amortized accepted-task cost
caption: Illustrative currency units, not vendor pricing. Eq. 22.19 makes both fixed investment and acceptance fraction visible.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-22.19
alt: With fixed cost 10000 units, one million requests, variable cost 0.01 units per request, and 80 percent accepted tasks, cost is 0.025 units per accepted task.
states:
  - { anchor: formulation, label: Moderate reuse, variables: { F: 10000, n: 1000000, v: 0.01, q: 0.8 }, note: Fixed cost and serving cost contribute equally in this illustrative case. }
  - { anchor: limitations, label: Low reuse, variables: { F: 10000, n: 100000, v: 0.01, q: 0.8 }, note: Short useful horizons can leave the fixed investment largely unamortized. }
spec:
  tex: k=(F+nv)/(nq)
  equation: "22.19"
  inputs:
    - { symbol: F, label: fixed cost in units, default: 10000, min: 0, max: 100000, step: 1000, format: fixed3 }
    - { symbol: n, label: requests in usable horizon, default: 1000000, min: 10000, max: 10000000, step: 10000, format: integer }
    - { symbol: v, label: variable cost per request, default: 0.01, min: 0, max: 0.1, step: 0.001, format: fixed3 }
    - { symbol: q, label: accepted fraction, default: 0.8, min: 0.01, max: 1, step: 0.01, format: percent }
  outputs:
    - { symbol: k, label: units per accepted task, formula: (F+n*v)/(n*q), format: fixed3, emphasis: true }
    - { symbol: fixed, label: fixed contribution, formula: F/(n*q), format: fixed3 }
    - { symbol: variable, label: variable contribution, formula: v/q, format: fixed3 }
```

```figure
id: fig-22.20
kind: stat-panel
title: Lifecycle cost boundary
caption: A hardware-only estimate and a total lifecycle estimate answer different questions. Preserve the counted boundary in every comparison.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-22.19
alt: The cost boundary includes data, pilots, evaluation, release, serving, refresh, and rollback, with an accepted-task denominator over one useful horizon.
spec:
  header: ADAPTATION LEDGER
  rows:
    - { key: fixed, value: data trials evaluation release }
    - { key: recurring, value: serving retries refresh }
    - { key: resilience, value: archive and rollback }
    - { key: denominator, value: accepted tasks in horizon }
    - { key: unknowns, value: demand quality rates energy }
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] The Nemotron 3 Ultra report describes a practical reduction of its pretraining horizon to 20T tokens after rollback and learning-rate annealing mitigated a later divergence whose cause remained undetermined. This illustrates a disclosed budget revision under training failure. It does not supply the lifecycle cost of the domain task in this chapter. [R22.9]

[DERIVED] Economic evidence requires a ledger covering data preparation, every intervention trial, evaluation, index construction, artifact conversion, and the serving workload. Accepted-task fraction and latency must use common task criteria. Demand horizons and refresh intervals require sensitivity analysis when their future values are uncertain. Without measured workload costs and acceptance, a monetary winner remains an analytical scenario; [verification.md](verification.md) specifies the unexecuted measurement protocol.

## Observations

**What the paper claims.** [PAPER-REPORTED] The NVIDIA case reports recovery decisions and a revised training horizon, with an unresolved root cause for the later divergence. [R22.9]

**What the evidence shows.** [DERIVED] A planned token budget can change after a failure. Economic accounting must retain the unsuccessful work and recovery, rather than charging only the final accepted trajectory.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 22.20 gives a break-even point only under stable acceptance and variable-cost assumptions. If quality or cost depends on age, request mix, or concurrency, integrate those quantities over the usable horizon instead of applying one constant.

**What remains unknown.** [UNVERIFIED] The actual demand, quality, energy, device rates, labor allocation, and refresh costs of the book's proposed domain adaptation have not been measured. No deployment recommendation is supported by the illustrative calculator.

## Failure modes

[DERIVED] Common accounting failures are excluding rejected trials, using raw requests instead of accepted tasks, amortizing over demand after the artifact becomes stale, mixing incompatible service levels, and treating unavailable data as free. Operational failures include a rollback model paired with the wrong tokenizer or index, a refreshed index with stale caches, and an adapted artifact that exceeds serving memory limits.

[DERIVED] A cost estimate can be numerically precise while decisionally fragile. If a small change in $q_h$, demand, or horizon reverses the chosen arm, the decision needs more evidence or a more conservative policy. Display the sensitivity and the uncertainty interval, not merely the point estimate.

## Siblings

[DERIVED] A one-time specialist model trades fixed investment against repeated inference. Retrieval trades index maintenance and per-request evidence processing against a different freshness path. SFT and adapter updates change their training and release costs, while prompt/context interventions may increase recurring prefill. None is intrinsically cheapest; the accepted-task denominator and useful horizon determine the comparison.

## Extensions

[DERIVED] Extend the ledger to staged releases, periodic refresh, and multiple tenants by allocating shared costs explicitly. Shared base-model costs and tenant-specific adaptation costs should not be counted twice. A multi-tenant index or adapter archive also requires separate authorization and rollback boundaries. Chapter 63 develops the broader lifecycle economic evaluation.

## Limitations

[DERIVED] Cost minimization is meaningful only among feasible candidates meeting the intended quality and retention bar. Eq. 22.19 does not monetize harms or benefits excluded from its utility definition. Eq. 22.21 is a declared sensitivity model and must not be presented as a measured freshness law. Decision authority remains with the organization when the utility function or acceptable regression is unspecified.

## Reproducibility

[DERIVED] Publish the counted boundary, currency and rates, workload distribution, request horizon, acceptance rule, confidence intervals, trial ledger, refresh schedule, and rollback manifest. Preserve the distinction between measured costs and analytical scenarios. The book has authored a decision procedure and proposed experiment; it has not measured adaptation economics.

## References

- [R22.9](references.md#r229) — 2026 training recovery and horizon revision.
