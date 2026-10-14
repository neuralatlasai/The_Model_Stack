---
id: ms.section.46.3
entity_type: section
title: Routing
volume: 2
part: 8
chapter: 46
section: 46.3
slug: 46-3-routing
parent: ms.chapter.46
prev_sibling: ms.section.46.2
next_sibling: ms.section.46.4
children: []
prerequisites: [ms.chapter.6, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.section.46.2]
downstream: [ms.chapter.47, ms.chapter.48, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [serving_control_plane], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.tensorrt-llm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 46.3 — Routing

## Scope

[DERIVED] Routing chooses a model, provider and eligible execution destination under quality, cost, latency and data constraints. The baseline sends every request to one fixed model and round-robins its replicas. This section separates model selection from replica placement and distinguishes hard authorization/geography constraints from soft cache affinity. Chapter 44 owns physical cache-placement policy; here the control plane decides which destinations are permitted before optimizing among them.

## Why this exists

[DERIVED] Model heterogeneity creates a quality/cost opportunity; replica heterogeneity creates queue/cache differences; provider heterogeneity creates protocol and operational differences. Treating all three as one load-balancing problem can send a request to an inexpensive but incapable model, an unauthorized destination or a cached worker whose queue erases the reuse benefit.

[PAPER-REPORTED] RouteLLM learns query-conditioned preference predictions, while2026 R2-Router adds output-budget selection [R46.3, §§2–3; R46.19, §4]. These methods optimize estimated response behavior. They do not remove deployment eligibility or certify the application's latency and data policy.

## Intuition

[DERIVED] First define the feasible set, then score it. A hard data constraint is a set membership condition; a cache hit is a potential execution saving. Putting both into one weighted sum allows a sufficiently large saving to compensate for a forbidden destination. That is mathematically different from enforcing the constraint.

## Formulation

> **Definition — Routing eligibility set.** [DERIVED] The destinations satisfying a request's required model capabilities, authorization, geography/data-access policy, version contract and available admission conditions before soft optimization.

| Local symbol | Meaning |
|---|---|
| $\mathcal A_r$ | Eligible actions for request $r$ |
| $a=(m,p,e,b)$ | Model, provider, endpoint and output-budget action |
| $\widehat q_a,\widehat c_a,\widehat \ell_a$ | Estimated quality, complete cost and latency |
| $\pi(a\mid x)$ | Query-conditioned routing probability |
| $B_{\rm cost}$ | Expected cost budget over a declared population |
| $\lambda,\nu$ | Nonnegative cost and latency tradeoff weights |
| $\varepsilon_u$ | Uniform utility-estimation error bound |
| $n_m,n_b$ | Candidate model and budget counts |

[DERIVED] Eligibility is an intersection:

$$
\mathcal A_r=
\mathcal A_{\rm capability}\cap\mathcal A_{\rm authorization}
\cap\mathcal A_{\rm geography}\cap\mathcal A_{\rm version}
\cap\mathcal A_{\rm admission}.
$$
*(Eq. 46.11)*

An empty set returns a declared rejection or deferral. Failover must recompute the same intersection; a failed provider does not authorize a forbidden one.

[PAPER-REPORTED] The 2025 routing framework uses an expected-budget optimization over estimated quality/cost [R46.18, §2 Eq. 1; Appendix A]:

$$
\max_{\pi}\ \mathbb E_x\sum_{a\in\mathcal A_x}\pi(a\mid x)\widehat q_a(x),
\quad
\mathbb E_x\sum_a\pi(a\mid x)\widehat c_a(x)\le B_{\rm cost},
\quad \pi(\cdot\mid x)\in\Delta(\mathcal A_x).
$$
*(Eq. 46.12)*

[DERIVED] The eligible-action restriction is this chapter's deployment adaptation. An expected budget does not impose a per-request maximum spend, deadline or quality guarantee.

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] For a Lagrange multiplier $\lambda\ge0$, Eq. 46.12's objective separates by query into scores $\widehat q_a-\lambda\widehat c_a$. Probability mass is placed on maximizing actions; mixing tied actions can meet an aggregate budget. The source theorem gives conditions and a construction for its estimator-based optimum [R46.18, Theorem1; Appendix A]. It is not a theorem that learned estimates equal real task quality.

[DERIVED] A practical latency-aware score may subtract $\nu\widehat\ell_a$, but a hard deadline remains a feasibility/risk constraint. Dollars, milliseconds and quality scores need declared scaling and weights. An arbitrary weighted sum has no universal application meaning. Use the same quality evaluator across actions or explicitly calibrate incomparable scores.

[PAPER-REPORTED] RouteLLM's matrix-factorization branch models pairwise preference with query/model scores and a logistic difference [R46.3, §3.2 Eqs.10–11]. Its source data starts from Arena battles and includes augmentation. For a binary preference target $y$, the corresponding explanatory loss is

$$
p_\theta(x;i,j)=\sigma(s_\theta(i,x)-s_\theta(j,x)),\quad
\mathcal L=-y\log p_\theta-(1-y)\log(1-p_\theta).
$$
*(Eq. 46.13)*

[DERIVED] Preference win probability is not absolute task correctness or the magnitude of quality improvement. A threshold on it can trace a useful cost/performance frontier but does not automatically solve every cardinal-utility objective. Ties, judge bias, training-domain proportions and model-pool changes affect what the prediction means. Router acceptance needs independent evaluation on the intended task population.

[PAPER-REPORTED] R2-Router treats each model as a quality-versus-output-budget curve. Its shared query encoder feeds per-model/budget prediction heads trained with MSE; routing searches model/budget pairs, with piecewise-linear interpolation between anchors [R46.19, §4.3 Eqs.5–9]. Dataset construction samples model responses across budgets, scores quality and records actual generated length [§3, §5.1].

[DERIVED] The estimator objective for this variant is

$$
\mathcal L_{\rm curve}=
\sum_{(x,m,b)}\left(\widehat q_\theta(x,m,b)-q_{\rm label}(x,m,b)\right)^2,
\qquad
a^\star=\arg\max_{a\in\mathcal A_r}
[\widehat q_a-\lambda\widehat c_a-\nu\widehat\ell_a].
$$
*(Eq. 46.14)*

A prompt asking for a token budget changes the input and can affect reasoning, not just cost. Hard truncation enforces a maximum but can produce an invalid answer. The deployment action must include the budget instruction, cap and resulting quality acceptance; it cannot borrow quality evidence from unconstrained generation.

[PAPER-REPORTED] R2-Router's optimization-dominance theorem assumes the fixed operating points belong to the expanded budget set [R46.19, Theorem4.3]. [MATHEMATICALLY-DERIVED] Maximizing true utility over a superset cannot reduce the oracle maximum. That set-inclusion fact does not establish dominance of an imperfect learned policy or generalization to a new model.

[MATHEMATICALLY-DERIVED] If every candidate utility estimate satisfies $|\widehat u(a)-u(a)|\le\varepsilon_u$, then for true optimum $a^\star$ and predicted optimum $\widehat a$,

$$
u(a^\star)-u(\widehat a)
\le [u(a^\star)-\widehat u(a^\star)]
+[\widehat u(\widehat a)-u(\widehat a)]
\le2\varepsilon_u.
$$
*(Eq. 46.15)*

The omitted middle difference is nonpositive because $\widehat a$ maximizes estimated utility. This bound requires uniform error over the feasible action set; average MSE or judge correlation does not provide it.

[DERIVED] Piecewise-linear quality interpolation plus linear output cost gives an affine score on each budget segment. Its maximum occurs at an endpoint unless the segment is flat; a hard budget cutoff adds a feasible boundary point. Thus continuous interpolation alone need not require dense budget search. Nonlinear latency, discrete generation effects and uncertain actual output length can invalidate that simplified optimization.

[PAPER-REPORTED] Cascade routing instead uses already computed responses to update estimates and choose further models. Its “supermodel” search can consider exponentially many subsets, with source-specific pruning [R46.18, §4 Algorithm3; Lemma1]. This is distinct from a transport retry: a cascade deliberately spends additional inference to improve estimated answer quality.

[DERIVED] A deployed cascade must include cumulative compute, evaluator cost and remaining deadline. A post-hoc judge can be wrong; a model that produced a syntactically valid answer can still be escalated for quality. Conversely, a provider timeout may leave duplicate computation in flight without producing an answer to judge. Mixing those cases under one “fallback” statistic obscures both cost and correctness.

[DERIVED] Provider routing adds a separate boundary. Even the same named model can expose different templates, sampler defaults, quantization and versioning. Apply the [engine selection contract](../ch43-runtime-architecture-and-inference-engine-selection/43-6-selection-methodology.md) before assuming equivalent conditional behavior. If the provider does not disclose its numerical/runtime identity, report that limitation rather than inferring parity from a model label.

[DERIVED] Geography and data-access constraints are declared application policies, not latency preferences. They apply to prompts, retrieved documents, attachments, tool results, telemetry and cached state. Capability filtering can also include permitted tool schemas, language/context requirements and modality. Validate the effective destination after redirects/failover, not only the first routing decision. This section does not infer any jurisdiction's legal requirements.

[OFFICIAL-DOCUMENTATION] The current vLLM Production Stack load-aware route scores endpoints by matched-prefix fraction minus a weighted normalized in-flight load [R46.14, “How It Works”]. It can choose a cold idle endpoint over a warm busy one; its documented load unit is request count.

[DERIVED] This is a soft execution heuristic inside the eligible set. Normalized prefix fraction is dimensionless, but it is not predicted saved milliseconds. In-flight count omits remaining output work and token lengths. The parameter therefore needs workload-specific calibration; a score comparison is not proof of deadline feasibility.

[OFFICIAL-DOCUMENTATION] Dynamo's current router configuration exposes overlap credits, prefill-load scaling, optional decode-active-request weight and state-tracking choices [R46.17, KvRouterConfig]. These are version-specific interfaces, not an independently measured routing advantage.

[DERIVED] Routing state is stale by at least its collection/transport interval. A cache entry can be evicted after the router observes it; multiple routers can simultaneously select the same apparently idle worker. A destination therefore must revalidate admission and cache identity. The route should tolerate a cache miss without changing semantics, while hard authorization must remain enforced. Chapter 44 develops physical locality/eviction tradeoffs.

[DERIVED] Cost includes query encoding, scoring candidates, policy lookup, network hops and any escalation. Discrete model/budget scoring is $O(n_mn_b)$ after encoding, with estimator-specific hidden width costs; storing model/budget heads grows accordingly. Replica scoring is $O(n_e)$ in a simple full scan; indexed approximations reduce search at the cost of stale/incomplete information. Cascade subset search can be $O(2^{n_m})$ before pruning. Label construction can dominate training cost because each query is evaluated across multiple models/budgets.

```figure
id: fig-46.9
kind: diagram
title: Hard eligibility before soft routing
caption: Data and capability constraints define the action set. Quality, cost, queue and cache scores choose only within that set.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.11
alt: A request passes capability, authorization, geography and version filters before model/provider and replica scoring. An empty feasible set returns rejection.
spec:
  direction: LR
  nodes:
    - {id: request, kind: tensor, label: request and policy}
    - {id: filter, kind: process, label: hard eligibility intersection}
    - {id: model, kind: process, label: model provider budget selection}
    - {id: replica, kind: process, label: eligible replica cache load score}
    - {id: admission, kind: process, label: revalidate destination admission}
    - {id: execute, kind: process, label: execute declared action}
    - {id: reject, kind: state, label: explicit rejection}
  edges:
    - {from: request, to: filter}
    - {from: filter, to: model}
    - {from: filter, to: reject, kind: dependency}
    - {from: model, to: replica}
    - {from: replica, to: admission}
    - {from: admission, to: execute}
```

## Algorithm

### Algorithm 46.3 — Policy-constrained model and endpoint routing

[DERIVED] Inputs are a request, immutable policy/model revisions, finite candidate/budget sets and remaining deadline. Outputs are a reserved eligible action or a terminal reason. Reject/Expire use §46.1's terminal accounting and safe-release convention.

$$
\begin{aligned}
1.\;&\mathcal A_r\leftarrow\operatorname{ResolveEligibility}(r);
\quad\mathcal A_r=\varnothing\Rightarrow\operatorname{Reject}.\\
2.\;&\widehat q,\widehat c,\widehat\ell\leftarrow
\operatorname{PredictAtResolvedVersions}(\mathcal A_r);
\quad\text{unsupported estimator domain}\Rightarrow\operatorname{DeclaredFallbackOrReject}.\\
3.\;&a\leftarrow\operatorname{ChooseWithinBudgetAndDeadline}(\mathcal A_r);
\quad\text{none}\Rightarrow\operatorname{Reject}.\\
4.\;&\operatorname{RevalidateAndReserve}(a);
\quad\text{conflict}\Rightarrow\operatorname{Rollback};\\
&\text{bounded reroute budget remains}\Rightarrow\text{return to 1};
\quad\text{otherwise}\Rightarrow\operatorname{Reject}.\\
5.\;&\operatorname{ExecuteAndRecord}(a);
\quad\text{quality cascade allowed and budget remains}\Rightarrow
\operatorname{UpdateEstimatesAndReturnTo1};\\
&\text{otherwise}\Rightarrow\operatorname{Finalize}.
\end{aligned}
$$

[DERIVED] Reroute branches in line 4 are entered only on reservation conflict; success proceeds to 5. A fallback in line 2 must pass the same hard eligibility checks. Finite attempt/model-call/token caps and an absolute deadline bound the procedure. Invariants are hard-policy preservation, exact action identity and cumulative cost accounting.

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM and TensorRT-LLM are **Inference engine**. Production Stack, Dynamo, RouteLLM/cascade-routing and R2-Router are outside the numbered stack and are routed through explicit deployment/model-selection coverage. Their controllers/estimators are separate from the engine numerical path. No router was trained or deployed here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] RouteLLM's historical evaluation uses GPT-4-1106-preview/Mixtral, held-out preference validation and MTBench/MMLU/GSM8K [R46.3, §4]. Table 1 reports augmented matrix-factorization routing reaching 80% of the strong-versus-weak performance gap with 31.31% strong-model calls, versus 78.08% for random routing, on MTBench. This threshold is recovered performance gain, not an 80% absolute task score.

[PAPER-REPORTED] The unified framework's RouterBench experiment uses seven task benchmarks, three/five/eleven model subsets, and zero-centered Gaussian perturbations of true quality/cost with fitted linear estimators. Table 1 reports zero-shot quality-cost AUC 87.24% for cascade routing versus 83.25% routing in the eleven-model low-noise condition. It reports 74.40% versus 72.67% under high noise; Appendix E describes confidence intervals [R46.18, §5.1]. These are controlled estimator-quality experiments rather than a production router latency test. The apparent access to true outcomes is part of the benchmark construction, not a deployable pre-answer oracle.

[PAPER-REPORTED] R2-Router evaluates 30,968 queries, 15 models and 16 budget settings; responses are judged, actual tokens recorded, and five seed runs reported. Its OOD split trains on MMLU-Pro STEM and tests non-STEM [R46.19, §§5–6; Appendix B]. Those are quality/cost experiments, not provider availability or client-p95 experiments.

## Observations

**What the paper claims.** [PAPER-REPORTED] Query-conditioned selection and budget curves improve quality/cost tradeoffs [R46.3; R46.19].

**What the evidence shows.** [PAPER-REPORTED] R2-Router's OOD Table 1 reports AUDC 0.71±0.05 versus CARROT-L 0.67±0.04, with QNC 0.26±0.09 versus 0.56±0.06. Its reported average routing overhead is below 400 ms in its long-generation setup [R46.19, §§5.4,6.3]. The reported error bars do not by themselves establish a paired significance result.

**What we infer.** [DERIVED] A 400 ms router is material for a hypothetical 500 ms first-token budget even if it is a small share of long generation. Oracle set dominance, judge correlation and actual deployment quality are different claims.

**What remains unknown.** [UNVERIFIED] Independent service latency, calibration under model/provider updates and enforcement of hard policy were not executed here.

## Failure modes

> **Failure mode — Policy treated as a penalty.** [DERIVED] *Symptom:* a high-cache-score route crosses a forbidden data boundary. *Cause:* authorization/geography is traded against soft utility. *Detection:* inspect the effective destination against the eligibility set. *Mitigation:* filter before scoring and revalidate every fallback.

[DERIVED] Stale load, changed provider defaults, truncation-induced invalid answers and biased quality estimators create additional observable failures.

## Siblings

[DERIVED] Single-call model routing uses ex-ante estimates; cascading buys post-hoc information with additional calls; replica routing preserves intended model semantics while changing physical execution. [Resilience](46-5-resilience.md) handles transport failures and duplicate work, not quality escalation.

## Extensions

### Improvements

[PAPER-REPORTED] The 2025 framework unifies routing/cascading under estimator-based optimization;2026 R2-Router expands actions to model/budget pairs [R46.18–19]. The changed primitive is selection over a response-cost curve. Its benefit depends on reliable quality estimates, additional profiling/labels and valid budget enforcement; it does not supply hard deployment guarantees.

## Limitations

[DERIVED] Quality estimation can drift faster than model catalogs. Prompt-based budget control is imperfect and can change task behavior. A research question is whether calibrated uncertainty can constrain quality loss across new models and budget instructions while preserving low routing overhead. Evidence requires independent tasks, observed budget adherence and explicit estimator error, not an oracle frontier alone.

## Reproducibility

[UNVERIFIED] Preserve training/selection/acceptance splits, preference/judge policy, model/provider revisions, budget instructions, token prices as dated inputs, actual usage, estimator/configuration, eligibility policy and endpoint-state timestamps. No current cost recommendation or universal model ranking is made. Proposals remain in [verification](verification.md).

```figure
id: fig-46.10
kind: calculator
title: Utility prediction error
caption: Eq. 46.15 bounds selection regret only when a uniform action-wise utility error bound is valid.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.15
alt: A uniform utility estimation error doubles into a worst-case selection-regret bound.
states:
  - {anchor: formulation, label: Uniform bound, note: Average prediction error is insufficient.}
  - {anchor: mechanism, label: New action, note: The bound must cover every eligible model and budget.}
  - {anchor: failure-modes, label: Policy violation, note: Utility bounds do not authorize an ineligible destination.}
spec:
  tex: regret le 2 epsilon_u
  equation: "46.15"
  inputs:
    - {symbol: error, label: uniform utility error, default: 0.05, min: 0, max: 0.5, format: fixed2}
  outputs:
    - {symbol: regret, label: conditional regret bound, formula: "2*error", format: fixed2}
```

```figure
id: fig-46.11
kind: stat-panel
title: Three routing decisions
caption: Model, provider and replica choices change different contracts.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-46.11
alt: The card separates model capability, provider policy and physical replica locality.
spec:
  header: ROUTING BOUNDARIES
  rows:
    - {key: model, value: task capability and budget}
    - {key: provider, value: data and protocol contract}
    - {key: replica, value: eligible queue and cache locality}
```

## References

[R46.3](references.md#r46-3), [R46.14](references.md#r46-14), [R46.17](references.md#r46-17), [R46.18](references.md#r46-18), [R46.19](references.md#r46-19).
