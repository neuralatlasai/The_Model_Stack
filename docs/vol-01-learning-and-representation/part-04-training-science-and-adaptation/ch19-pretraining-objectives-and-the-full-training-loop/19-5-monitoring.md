---
id: ms.section.19.5
entity_type: section
title: Monitoring
short_title: Monitoring
volume: 1
part: 4
chapter: 19
section: 19.5
slug: 19-5-monitoring
parent: ms.chapter.19
prev_sibling: ms.section.19.4
next_sibling: ms.section.19.6
children: []
prerequisites: [ms.chapter.6, ms.section.19.2, ms.section.19.3, ms.section.19.4]
downstream: [ms.chapter.20, ms.chapter.30]
related: [ms.chapter.9]
relations: []
axes: {lifecycle: [pretraining, evaluation], mechanism: [monitoring, training_stability], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch, impl.torchtitan]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 19.5 Monitoring

## Scope

[DERIVED] Training monitoring estimates specified quantities and preserves enough context to investigate departures. It covers target-weighted loss by slice, gradient and parameter norms, activation statistics, schedule traces, numerical rejection, and resource boundaries. Stability interventions are owned by §§20.4–20.5; this section defines the observations those interventions need. A monitor cannot establish causality or model quality from a smooth aggregate curve alone.

## Why this exists

[MATHEMATICALLY-DERIVED] An aggregate training loss combines within-slice model behavior with the proportions of slices sampled at each step. A change in mixture can move the aggregate even when every slice loss is unchanged. Smoothing can hide a short-lived excursion; logging only accepted updates can conceal repeated nonfinite attempts. Both can produce an apparently quiet curve while the underlying process changes.

[PAPER-REPORTED] OLMo 2 reports that repeated n-gram sequences appeared in investigated spike batches, while the association depended on model scale and data ordering and was not deterministic. This is evidence for preserving the offending batch and its context, not a rule that repetition necessarily causes a spike. [R19.28], §3.1.

## Intuition

[MATHEMATICALLY-DERIVED] Monitoring is a reduction with an observation boundary. A ratio of total loss to total target count estimates a target mean over that boundary; an average of step means estimates an equal-step mean. A pre-clipping gradient norm describes a different vector from a post-clipping norm. The same metric name can therefore conceal different estimands unless count, operator boundary, and clock are retained.

## Formulation

[MATHEMATICALLY-DERIVED] Let $j$ identify a declared slice such as language, source domain, length bin, or objective component. For mutually exclusive exhaustive slices at update $k$, let $s_{kj}$ be summed loss and $q_{kj}$ scored-target count. With $Q_k=\sum_jq_{kj}>0$, define

$$
L_{kj}=s_{kj}/q_{kj}\quad(q_{kj}>0),\qquad
p_{kj}=q_{kj}/Q_k,\qquad
L_k=\sum_jp_{kj}L_{kj}.
$$
*(Eq. 19.14)*

[MATHEMATICALLY-DERIVED] Missing slices have absent means, not measured zero loss. Overlapping slices require their own denominator and cannot be summed to reconstruct the aggregate. For a reporting window $\mathcal K$, the target-weighted slice loss is $\sum_{k\in\mathcal K}s_{kj}/\sum_{k\in\mathcal K}q_{kj}$ whenever the denominator is positive.

## Mechanism

### Methodology: separate mixture movement from model movement

[MATHEMATICALLY-DERIVED] For two observations with defined slice losses, aggregate movement decomposes exactly as

$$
L_k-L_{k-1}
=\sum_jp_{kj}(L_{kj}-L_{k-1,j})
+\sum_j(p_{kj}-p_{k-1,j})L_{k-1,j}.
$$
*(Eq. 19.15)*

[MATHEMATICALLY-DERIVED] The first term holds current proportions fixed while measuring within-slice movement; the second accounts for changed proportions against the earlier slice losses. Neither is a causal attribution when data difficulty changes within a slice. A fixed held-out evaluation distribution removes the sampled training-mixture component from its own comparison, but it introduces a distinct evaluation workload and must preserve tokenization, masking, and reduction conventions.

```figure
id: fig-19.7
kind: calculator
title: Aggregate loss under changing slice proportions
caption: >-
  Vary the share of the first slice without changing either slice loss.
  Aggregate loss moves even though within-slice losses are constant. The
  inputs are an analytical example, not reported model measurements.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-19.14
alt: >-
  Two exhaustive slices have losses 2 and 4 nats. A first-slice target
  share of 0.8 yields aggregate loss 2.4. Equal shares yield 3.0. The
  reduction changes solely because the target proportions change.
spec:
  tex: L=p L_1+(1-p)L_2
  equation: "19.14"
  inputs:
    - {symbol: p, label: first slice target share, default: 0.8, min: 0, max: 1}
    - {symbol: l1, label: first slice loss in nats, default: 2, min: 0, max: 20}
    - {symbol: l2, label: second slice loss in nats, default: 4, min: 0, max: 20}
  outputs:
    - {symbol: mixture, label: aggregate target loss, formula: p*l1+(1-p)*l2, emphasis: true}
    - {symbol: equal, label: equal-slice mean, formula: (l1+l2)/2}
```

### Norms, activations, and the location of a check

[MATHEMATICALLY-DERIVED] Log the normalized unscaled gradient norm before clipping, the clipping multiplier, and the actual parameter-change ratio from Eq. 19.10. If only the clipped norm is logged, every above-threshold update collapses to the same value and the severity of the incoming excursion is lost. Per-layer norms distinguish a localized transition from a broad change, but they must use fixed parameter partitions across runs.

[MATHEMATICALLY-DERIVED] For an observed activation tensor with $n$ declared finite entries $u_i$, useful summaries include $\mu=n^{-1}\sum_i u_i$, $r=(n^{-1}\sum_i u_i^2)^{1/2}$, $\max_i|u_i|$, and a separate nonfinite count. Removing nonfinite entries before summarization can keep the finite-entry mean defined, but the nonfinite count must remain visible. Otherwise a failure is converted into a benign statistic. RMS and absolute maximum describe different tails; neither implies a particular attention entropy or downstream quality.

[MATHEMATICALLY-DERIVED] Numerical checks should distinguish loss, gradients, optimizer moments, parameters, and selected activations. A finite scalar loss with nonfinite gradients is possible when the derivative is undefined or a backward computation overflows. A valid incoming gradient with a nonfinite candidate update is possible when a persistent moment or division is invalid. §19.3's acceptance boundary therefore complements, rather than replaces, intermediate diagnostics.

### Early alerts require calibrated scope

[DERIVED] An alert policy first separates structural violations from statistical departures. Invalid target counts, nonfinite tensors, inconsistent identities, and impossible clock transitions are categorical contract failures. A large finite gradient or unusual activation is an observation whose threshold must be declared against a reference distribution. The recipe records the event, recent raw metrics, exact batch identities, and checkpoint generation before deciding whether to halt or continue. A universal numerical threshold cannot be derived from the metric name.

[MATHEMATICALLY-DERIVED] Let $u_k$ be a scalar diagnostic and $\mu_{k-1},\sigma_{k-1}$ statistics computed from a fixed trailing window preceding $k$. A standardized departure can be written $z_k=(u_k-\mu_{k-1})/\max(\sigma_{k-1},\epsilon_u)$ with $\epsilon_u>0$ in the same units as $u_k$. This definition is an analytical monitoring rule, not a Gaussian calibration theorem. Serial dependence, heavy tails, warmup, and a changing mixture invalidate a naive independent-normal false-alarm interpretation. Compute the reference before adding the candidate observation to avoid allowing the excursion to dilute its own departure score.

## Algorithm

**Algorithm 19.5 — Count-preserving monitoring.** [DERIVED] Input: one attempt's summed slice losses $s_{kj}$, counts $q_{kj}$, diagnostics $u_k$, and status $v_k$. State: reporting accumulators $(S_j,Q_j)$, accepted/attempt counters $(c,a)$, and bounded raw-history buffer $\mathcal H$. Output: a metric record plus next reporting state. The acceptance predicate is owned by §19.3; monitoring does not mutate parameters.

$$
\begin{aligned}
1.\quad &a^+\gets a+1,\quad
 f_k\gets\operatorname{finite}(u_k,(s_{kj})_j).\\
2.\quad &c^+\gets c+\mathbf1\{v_k=\mathrm{accepted}\}.\\
3.\quad &j:\quad
 (S_j^+,Q_j^+)\gets
 \begin{cases}
 (S_j+s_{kj},Q_j+q_{kj}),&f_k\land q_{kj}>0,\\
 (S_j,Q_j),&\text{otherwise}.
 \end{cases}\\
4.\quad &\widehat L_j\gets
 \begin{cases}S_j^+/Q_j^+,&Q_j^+>0,\\
 \mathrm{absent},&Q_j^+=0.
 \end{cases}\\
5.\quad &\mathcal H^+\gets
 \operatorname{bounded\_append}(\mathcal H,(a^+,c^+,u_k,v_k,f_k)).\\
6.\quad &\operatorname{return}((\widehat L_j,Q_j^+)_j,\mathcal H^+,a^+,c^+).
\end{aligned}
$$
*(Eq. 19.16)*

[DERIVED] This procedure reports finite attempted-batch losses, including those whose update was later rejected; that boundary is intentional. An accepted-only series needs a separate status filter and name. Invalid metrics remain in the raw event buffer while being excluded from finite ratio accumulators. The record must expose excluded counts so the finite mean cannot conceal repeated failures.

## Implementation

[MATHEMATICALLY-DERIVED] **PyTorch**, the Model / autograd framework layer, and **TorchTitan**, the Distributed training layer, are the relevant execution surfaces. A local monitor reduces detached loss sums and counts; it must avoid retaining autograd graphs across reporting windows. Full-coordinate norms and activation scans require $O(N)$ and $O(n_{\mathrm{act}})$ reads respectively; scalar accumulators require $O(J)$ storage for $J$ slices. A raw-history buffer of capacity $H_{\mathrm{hist}}$ requires $O(H_{\mathrm{hist}}J)$ storage when each record includes slice vectors. These are analytical costs, not claims about an uninspected telemetry implementation.

[MATHEMATICALLY-DERIVED] Distributed sums/counts require reductions over the actual target-owning participants. Device-to-host scalar extraction and collective reporting can synchronize execution, so asynchronous logging does not imply zero measurement overhead. Fixed-window time boundaries must state whether data loading, optimizer work, checkpointing, and evaluation are included. Monitoring adds no trainable model parameters or scored targets; it adds memory traffic, reductions, event storage, and potentially latency.

[NOT-DISCLOSED] Per-metric overhead, power, storage charges, and logging throughput for the book's recipe are unmeasured. Sampling activations reduces scan cost but changes the observation population; a sampled maximum is not the full-tensor maximum.

## Experimental design

### Reported experiments

[PAPER-REPORTED] OLMo 2 defines a spike score using departures of at least seven standard deviations from a rolling average of the previous 1,000 values. Its initialization ablation deliberately shortens warmup to induce an unstable baseline and reports fewer gradient-norm spikes with the new initialization, alongside slower initial convergence. The manipulated baseline and tradeoff matter when interpreting that result. [R19.28], §3.2, “Spike score” and “Empirical results.”

## Observations

**What the paper claims.** [PAPER-REPORTED] OLMo 2 reports a diagnostic discrepancy between two z-loss implementations: forward agreement accompanied different backward behavior. Its reported cross-entropy and downstream outcomes did not change in those experiments. [R19.28], §3.3.3 and Figure 8.

**What the evidence shows.** [DERIVED] These ablations support examining gradients and implementation boundaries in addition to forward loss. They do not establish a universal spike threshold or prove that a diagnostic difference necessarily causes a capability loss.

**What we infer.** [MATHEMATICALLY-DERIVED] Equal forward values do not constrain derivative equality; preserving raw derivatives, counts, and state boundaries is necessary to test the stronger equivalence.

**What remains unknown.** [NOT-DISCLOSED] The inspected study does not supply a universal false-alarm rate for the book's monitoring policy across model scales, mixtures, and runtimes.

## Failure modes

[MATHEMATICALLY-DERIVED] Average-of-means reporting biases target weights; overlapping slices can double count; accepted-only reporting hides attempts; smoothed-only histories erase excursions; unbounded tensor logging retains memory; missing clocks misalign learning rates and loss. Each has a direct check: retain numerator/denominator, label slice overlap, expose attempts and rejections, retain bounded raw records, detach numerical observations, and join records on a stable attempt/update identity.

## Siblings

[DERIVED] Training telemetry observes the sampled optimization process; held-out evaluation observes a fixed comparison distribution. Profiling observes resource execution; anomaly detection flags departures; causal intervention tests a proposed mechanism. These are different evidential tasks. Chapter 06 owns experimental design and uncertainty, Chapter 20 owns stability interventions, and Chapter 30 owns distributed training efficiency.

## Extensions

[DERIVED] Monitoring can attach versioned layer, objective, and source-domain identities to the same sums/counts. Increasing slice granularity improves localization while reducing observations per slice and increasing telemetry cost. Adaptive alerting is a separate estimator with its own state and calibration; adding it does not turn monitoring into a proof of safety or convergence.

## Limitations

[MATHEMATICALLY-DERIVED] Observational coincidence is not causal identification. A gradient excursion and a repeated sequence can occur together without proving that filtering the sequence improves training. Loss reduction on training targets does not establish generalization, contamination freedom, or downstream correctness. Monitoring establishes what was observed under its declared reduction and sampling boundary.

## Reproducibility

[DERIVED] Retain slice definitions and overlap rules, scalar sums/counts, metric dtype and operator boundary, attempt/accept counters, smoothing law, alert history/window/floor, sampled-coordinate policy, and resource timing boundary. The raw event retains data identity and last accepted checkpoint. Proposed alert injections and slice-mixture checks remain unexecuted in [verification.md](verification.md).

## References

[R19.28](references.md#r1928); mathematical identities19.14–19.16.
