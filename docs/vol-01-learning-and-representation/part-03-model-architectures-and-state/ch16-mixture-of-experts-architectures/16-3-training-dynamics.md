---
id: ms.section.16.3
entity_type: section
title: Training dynamics
short_title: Training dynamics
section: 16.3
slug: 16-3-training-dynamics
parent: ms.chapter.16
prev_sibling: ms.section.16.2
next_sibling: ms.section.16.4
children: []
prerequisites: [ms.chapter.13, ms.chapter.14, ms.section.16.2]
downstream: [ms.chapter.27, ms.chapter.29, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 16
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [mixture_of_experts, conditional_computation], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P10, P13]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 16.3 — Training dynamics

## Scope

Training dynamics couples expert assignment, task gradients, balancing interventions, and the distribution of examples reaching each expert. This section covers auxiliary objectives, bias-based alternatives, balancing scope, router stability, and expert collapse. The baseline is the explicit routing contract from 16.2. The goal is to diagnose whether a training change improves the intended task while maintaining a workable assignment distribution, rather than optimizing a load statistic in isolation.

## Why this exists

**DERIVED.** Routing creates a feedback loop. An expert receiving more examples can obtain more updates; its changing outputs can alter the router's task gradients; future assignments can then become more concentrated. The direction and strength of this interaction depend on the model and optimizer. It is a failure mechanism to test, not a theorem that every unregularized router collapses.

Resource imbalance can also appear without permanent collapse. A globally well-used expert collection may receive a highly skewed microbatch. That batch determines immediate buffer occupancy and critical-path work. Long-run averages and instantaneous execution constraints operate at different time scales.

**PAPER-REPORTED.** Switch Transformers includes a load-balancing auxiliary objective [P10]. Auxiliary-Loss-Free Load Balancing uses expert-wise bias updates to influence selection without introducing the corresponding auxiliary task-gradient term [R16.3]. Their intervention paths differ.

## Intuition

**DERIVED.** Balance can mean equal assignment counts across a microbatch, equal counts across a global optimizer batch, or equal use inside every sequence. These are different constraints. A domain-homogeneous sequence may naturally prefer a subset of experts even while a mixed global batch uses all experts.

An auxiliary loss changes optimization gradients. A selection bias changes which experts receive inputs. Neither is free of consequences for the learned function. “Auxiliary-loss-free” identifies one mechanism boundary; it does not mean that the model's entire training objective contains no auxiliary term.

> **Definition — Balancing scope.** The population of assignments and time interval over which a router's load statistics are measured and its balancing intervention is computed.

## Formulation

**MATHEMATICALLY-DERIVED — top-one reference.** Let \(M>0\) tokens have routing probabilities \(p_{t,e}\), \(E\) experts, and one pre-capacity selection per token. Define assignment fraction \(f_e\) and mean probability \(\bar p_e\):

$$
f_e=\frac{1}{M}\sum_{t=1}^{M}\mathbf1[e=\arg\max_j p_{t,j}],
\qquad
\bar p_e=\frac{1}{M}\sum_{t=1}^{M}p_{t,e},
\qquad
\mathcal L_{\mathrm{bal}}=\lambda E\sum_{e=1}^{E}f_e\bar p_e.
$$
*(Eq. 16.7)*

This is the Switch-style auxiliary form [P10], stated for a fixed scope with coefficient \(\lambda\ge0\). Both distributions are normalized under the defined top-one, pre-capacity convention. Top-k and post-drop statistics need their own denominator.

Treating \(f_e\) as fixed in differentiation gives

$$
\frac{\partial\mathcal L_{\mathrm{bal}}}{\partial z_{t,j}}
=\frac{\lambda E}{M}p_{t,j}
\left(f_j-\sum_{e=1}^{E}f_ep_{t,e}\right).
$$
*(Eq. 16.8)*

The derivative follows from the softmax Jacobian. It encourages changes relative to the current observed load, but it is not a proof that the joint routing/training system converges to perfect balance. At uniform \(f_e=\bar p_e=1/E\), the auxiliary value is \(\lambda\); a scalar loss near that value alone is insufficient to establish a balanced realized histogram.

For a generic bias controller, define selection scores \(s_{t,e}+b_e\), count \(n_e\), total assignments \(A>0\), and update rate \(\eta\ge0\):

$$
b_e^{\mathrm{new}}=b_e+\eta\left(\frac{1}{E}-\frac{n_e}{A}\right).
$$
*(Eq. 16.9)*

This is an illustrative proportional controller, **not the exact update rule of every loss-free method**. It increases underloaded experts' selection bias. Whether combination weights use biased or original scores is a separate contract.

A scope-specific maximum-to-mean load ratio is

$$
\rho=\frac{\max_e n_e}{A/E}=\frac{E\max_e n_e}{A}.
$$
*(Eq. 16.10)*

It equals one under exact equal counts and can approach \(E\) when one expert receives all assignments. It does not identify the quality or semantic specialization of those assignments.


~~~figure
id: fig-16.9
kind: calculator
title: "Maximum expert load relative to mean"
caption: "Illustrative total of 1024 assignments; the maximum count must describe a feasible histogram. The ratio measures skew, not specialization quality."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.10"
alt: "Illustrative total of 1024 assignments; the maximum count must describe a feasible histogram. The ratio measures skew, not specialization quality."
spec: {"tex":"\\rho=E n_{max}/A","equation":"16.10","inputs":[{"symbol":"E","label":"experts","default":8,"min":8,"max":8,"format":"integer"},{"symbol":"A","label":"assignments","default":1024,"min":1024,"max":1024,"format":"integer"},{"symbol":"nmax","label":"maximum expert load","default":256,"min":128,"max":1024,"format":"integer"}],"outputs":[{"symbol":"ratio","label":"maximum to mean","formula":"E*nmax/A","format":"fixed2"}]}
states: [{"anchor":"formulation","label":"Moderate skew","variables":{"E":8,"A":1024,"nmax":256},"note":"The busiest expert receives twice the mean."},{"anchor":"mechanism","label":"Balanced fixture","variables":{"E":8,"A":1024,"nmax":128},"note":"Every expert must have 128 assignments in this fixture."},{"anchor":"failure-modes","label":"Concentrated fixture","variables":{"E":8,"A":1024,"nmax":1024},"note":"A post-drop histogram would hide some demand if capacity clips it."}]
~~~


## Mechanism

**DERIVED.** The auxiliary coefficient trades influence between task learning and balancing gradients. Comparing coefficients without their loss normalization, expert count, and scope is unreliable. Gradient accumulation can also change the effective scope if load statistics are calculated independently for each microbatch.

A controller instead stores state and modifies selection. Its update rate, observation window, synchronization, and warm-up behavior determine how quickly it responds. A large rate can oscillate assignments between experts; a small rate can lag distribution changes. These are testable control behaviors, not unconditional claims about a named implementation.

**PAPER-REPORTED.** DeepSeek-V3 combines bias-based balancing with a complementary sequence-wise auxiliary term [P13]. **DERIVED.** Describing that report as eliminating every balancing-related loss would erase a material part of its training contract. Record each intervention and its scope separately.

Pre-capacity loads reveal router demand; post-capacity loads reveal executed work. If a capacity limiter clips every expert to the same count, the executed histogram can look balanced while many assignments are discarded. Balance monitoring must therefore precede the capacity decision as well as follow it.


~~~figure
id: fig-16.10
kind: diagram
title: "Balance acts through gradients or selection state"
caption: "Task gradients update model parameters; an auxiliary objective adds gradients, while a controller updates selection state from load observations."
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.9"
alt: "Task gradients update model parameters; an auxiliary objective adds gradients, while a controller updates selection state from load observations."
spec: {"direction":"LR","nodes":[{"id":"scores","kind":"tensor","label":"Router scores"},{"id":"select","kind":"process","label":"Selection"},{"id":"load","kind":"metric","label":"Pre-capacity load"},{"id":"task","kind":"objective","label":"Task and optional auxiliary loss"},{"id":"weights","kind":"model","label":"Updated parameters"},{"id":"bias","kind":"state","label":"Optional selection bias"}],"edges":[{"from":"scores","to":"select","kind":"flow"},{"from":"select","to":"load","kind":"flow"},{"from":"select","to":"task","kind":"flow"},{"from":"task","to":"weights","kind":"flow"},{"from":"weights","to":"scores","kind":"feedback"},{"from":"load","to":"bias","kind":"flow"},{"from":"bias","to":"select","kind":"feedback"}]}
~~~


Router stability has both numerical and statistical components. Low score margins can make selections sensitive to precision or small input changes. Temporal instability can also reflect deliberate exploration or adaptation to a changing data mixture. Measure assignment churn alongside task loss, margins, expert counts, and gradient norms before diagnosing failure.

Expert collapse means persistent restriction of useful routing or learning to a subset under a declared observation regime. An unused expert in one small batch is not sufficient evidence. Inspect exposure over time and across task domains, and distinguish intentional eligibility restrictions from unintended starvation.

Parameter updates need careful interpretation. An expert that receives no examples may still have optimizer state affected by decay or other optimizer rules. Conversely, a nonzero load does not guarantee a useful gradient if the branch is saturated or its combination weight is negligible. Log actual update magnitudes when the hypothesis concerns learning rather than assignment alone.

Specialization and balance can coexist at different scopes. Domain-specific preferences need not produce global overload if the data mixture distributes demand. Forcing equal use within every individual sequence can impose a stronger constraint than required for cluster-level execution. The right trade-off is empirical and depends on deployment distribution as well as training stability.

## Algorithm

**DERIVED — instrumented balancing update.**

~~~text
Algorithm 16.3 — Update balancing state with explicit scope
INPUT: routing scores, assignment ledger, scope identifier, task loss,
       auxiliary or controller policy, optimizer, finite step budget
OUTPUT: updated model/state and pre/post-capacity diagnostics
STATE: router parameters, optional expert biases, exposure counters
INVARIANT: statistics use the declared population and normalization
1. Collect pre-capacity selections and verify total assignment count.
2. Aggregate load and probability statistics over the declared scope.
3. Compute the auxiliary objective when that policy is enabled.
4. Apply capacity and record executed assignments and dropped mass separately.
5. Compute task gradients and the declared auxiliary gradients.
6. Update parameters under the optimizer contract.
7. Update non-gradient controller state from the specified load observations.
8. Record task loss, load skew, margins, churn, drops, and expert update norms.
9. Stop at the finite budget and evaluate held-out domains and load regimes.
~~~

Histogram construction costs \(O(A+E)\) per scope with indexed expert identifiers. Distributed aggregation communicates at least the selected statistics under the chosen algorithm; it does not require transferring every token representation merely to compute counts. State synchronization must match the process group that defines the scope.

## Implementation

**OFFICIAL-DOCUMENTATION.** NVIDIA Megatron-Core, **Distributed training**, distinguishes microbatch, sequence, global auxiliary, and bias-based balancing options in its inspected guide [R16.4]. **DERIVED.** Record the resolved policy and scope rather than relying on a default flag.

Hugging Face Transformers, **Model definition / adaptation**, provides a model-specific Switch implementation surface [R16.5]. PyTorch, **Model / autograd framework**, supplies the reference gradient and reduction operations. A small finite-difference check away from selection boundaries can verify Eq. 16.8 without training a full model.

Checkpoint controller state and observation counters if they influence future routing. Restoring weights without restoring that state can change the continuation. Also specify whether load statistics aggregate across data-parallel, expert-parallel, or other groups; the words “global balance” are incomplete without a topology.

## Experimental design

**PROPOSAL — no balance or quality result is claimed.**

### Experiment 16.3 — Balance, stability, and specialization

- **Hypothesis:** Balancing scope and intervention strength affect both execution skew and learned task behavior.
- **Setup:** Compare a finite set of auxiliary and controller policies from a common initialization.
- **Independent variables:** Scope, coefficient or update rate, score precision, and data-mixture shift.
- **Controlled variables:** Expert architecture, token budget, optimizer, routing granularity, and evaluation split.
- **Dataset/workload:** Mixed-domain training batches, homogeneous-domain stress batches, and held-out tasks.
- **Hardware:** Record devices, parallel groups, kernels, and synchronization boundaries.
- **Metrics:** Task quality, pre/post-capacity histograms, load ratio, churn, margins, dropped mass, and expert update norms.
- **Baselines:** No balancing intervention, declared auxiliary balancing, and declared bias controller.
- **Expected result:** A resource improvement is accepted only with its measured task and stability consequences.
- **Ablation:** Hold scope fixed while varying strength, then hold strength fixed while varying scope.
- **Interpretation:** Separate starvation, transient small-batch imbalance, and intended specialization.
- **Threats to validity:** Unequal effective loss weights, unsynchronized controller state, correlated batches, and different capacity policies.

## Observations

**What the paper claims — PAPER-REPORTED.** Auxiliary objectives and bias-based balancing act through different training mechanisms [P10, R16.3].

**What the evidence shows — MATHEMATICALLY-DERIVED.** The auxiliary gradient depends on observed load and softmax probability; the controller separately changes selection preferences.

**What we infer — DERIVED.** Load statistics require scope, timing, and pre/post-capacity provenance before they can explain training behavior.

**What remains unknown — UNVERIFIED.** Optimal intervention strength, convergence behavior, and specialization quality require experiments.

## Failure modes

**DERIVED.** Failures include overbalancing at an unnecessarily narrow scope, controller oscillation, silent bias-state reset, and a balanced executed histogram produced by heavy dropping.


~~~figure
id: fig-16.11
kind: stat-panel
title: "Balance diagnostics need provenance"
caption: "Check these independent boundaries before interpreting an MoE quality or resource claim."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.10"
alt: "Check these independent boundaries before interpreting an MoE quality or resource claim."
spec: {"header":"Required distinctions","rows":[{"key":"Scope","value":"Sequence microbatch or global batch"},{"key":"Demand","value":"Count assignments before capacity"},{"key":"Execution","value":"Count accepted and dropped work"},{"key":"Learning","value":"Track updates and task quality"}]}
~~~


A decreasing auxiliary loss accompanied by worsening task performance is a failed trade-off under a task-preservation criterion, even if the routing plot appears visually uniform. Monitor the objective that the system is intended to serve.

## Siblings

**DERIVED.** Auxiliary gradients, selection controllers, expert-choice capacity, and changes to the data mixture can all alter load. They operate at different points in the causal chain and need separate ablations.

## Extensions

**DERIVED.** Fine-tuning on a narrow domain can change expert exposure relative to pretraining. Evaluate retained-domain quality as well as adaptation quality. Heterogeneous expert cost may motivate cost-weighted balancing, but equal cost targets need not imply equal token counts.

## Limitations

**DERIVED.** The proportional controller is explanatory. It carries no convergence guarantee here. The load ratio ignores ordering, destination topology, and per-expert cost variation. It is one diagnostic within a larger record.

## Reproducibility

Save model, optimizer, controller state, scope definitions, loss normalization, valid-token counts, data ordering, and diagnostics before and after capacity handling. Keep independent seeds and evaluation domains separate from hyperparameter selection.

## References

[P10](references.md#p10); [P13](references.md#p13); [R16.3](references.md#r163); [R16.4](references.md#r164); [R16.5](references.md#r165).

