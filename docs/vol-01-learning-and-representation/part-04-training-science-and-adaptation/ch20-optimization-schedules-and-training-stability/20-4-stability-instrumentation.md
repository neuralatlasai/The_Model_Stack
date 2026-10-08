---
id: ms.section.20.4
entity_type: section
title: Stability instrumentation
short_title: Stability instrumentation
volume: 1
part: 4
chapter: 20
section: 20.4
slug: 20-4-stability-instrumentation
parent: ms.chapter.20
prev_sibling: ms.section.20.3
next_sibling: ms.section.20.5
children: []
prerequisites: [ms.chapter.2, ms.chapter.3, ms.chapter.19]
downstream: [ms.chapter.21, ms.chapter.22, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.6, ms.chapter.13]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P13}
  - {type: implemented_by, target: impl.pytorch}
axes: {lifecycle: [pretraining, continued_training, evaluation], mechanism: [optimization, training_stability], feedback_setting: [], modality: [text, image]}
papers: [P13]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 20.4 Stability instrumentation

## Scope

[DERIVED] This section owns instrumentation at data, activation, gradient, optimizer and committed-state boundaries, including sparse routing. Success means retained raw evidence that distinguishes observed boundaries; an alert alone cannot establish causal diagnosis. Monitoring aggregation and loss denominators remain Chapter 19 prerequisites.

## Why this exists

[DERIVED] Stability instrumentation must locate the state transition that changed and retain evidence preceding it. A scalar loss spike is compatible with a difficult batch, an objective-normalization error, growing attention logits, precision failure, optimizer-state corruption or infrastructure corruption. These mechanisms need different observables. The instrumentation boundary therefore spans data, forward activations, backward gradients, update candidates and committed state, with measurements timestamped relative to synchronization, unscaling and clipping. A dashboard of smoothed loss cannot reconstruct a discarded batch or an overwritten moment buffer.

## Intuition

[MATHEMATICALLY-DERIVED] Norms, maxima and finite flags reveal different failure classes. A norm can hide a sparse outlier, clipping can hide an incoming spike, and an equal forward scalar can coexist with unequal derivatives. Boundary order and state identity determine which inference a measurement permits.

## Formulation

| Symbol | Meaning and domain |
|---|---|
| $n_W,\Delta W_k$ | Tensor element count and committed parameter displacement |
| $r_k(W),\epsilon_W$ | Relative displacement and positive diagnostic norm floor |
| $A^h,Q^h,K^h$ | Admitted head logits, queries and keys with compatible token/head axes |
| $a_i$ | Routed assignment count for expert $i$ in one declared window |
| $Z_{k,j},\mathcal Q_j$ | Observed tensor at boundary $j$ and its sampling/uniqueness map |
| $\mathcal H_k,w$ | Retained unsmoothed history and finite window length |

### Distinguish gradients, updates and parameter drift

[MATHEMATICALLY-DERIVED] For a parameter tensor $W$ containing $n_W$ elements, define $\operatorname{RMS}(W)=\|W\|_F/\sqrt{n_W}$. With committed displacement $\Delta W_k=W_k-W_{k-1}$, a diagnostic relative step is

$$
r_k(W)=\frac{\|\Delta W_k\|_F}{\max(\|W_{k-1}\|_F,\epsilon_W)}.
$$
*(Eq. 20.9)*

[DERIVED] The floor $\epsilon_W>0$ is a declared diagnostic normalization, not a universal physical constant. The ratio includes gradient-driven change, decay and post-update rescaling; comparing it with $\eta\|g\|$ is meaningful only for plain SGD without those additions. Separate proposed update, actually retained displacement and post-constraint displacement when rounding or clipping can alter them. A gradient can be large while Adam's denominator suppresses the step, or small while a poorly scaled denominator amplifies it.

[MATHEMATICALLY-DERIVED] Global squared gradient norm is $\sum_i g_i^2$ over unique trainable coordinates. For partitioned coordinates it is the sum of shard contributions; for replicated coordinates it must not be counted repeatedly. Averaging local norms is generally neither the global norm nor the norm of an averaged gradient. Measure the normalized, synchronized, unscaled gradient before clipping to observe the instability that clipping may conceal. The post-clipping norm answers a different question.

### Retain distributions and exceptional flags

[DERIVED] A layer's RMS can remain nearly unchanged while a sparse coordinate grows. Record finite counts and maxima alongside means, norms or selected quantiles. For low-precision roles, saturation/zeroing counts and block-scale maxima distinguish clipping by representation from an intentionally clipped optimizer update. A transient can disappear under an exponential moving average; a figure should retain its smoothing coefficient and the underlying unsmoothed trace. Maxima are sample-size-sensitive, so changing batch or sequence length changes their interpretation even with the same distribution.

[PAPER-REPORTED] OLMo 2 defines a spike score as the percentage of values at least seven standard deviations from a rolling average of the previous 1,000 values, applying it to loss and gradient norm. This is a descriptive statistic chosen by those authors. It is not a Gaussian tail-probability certificate: training traces are dependent and nonstationary, and a rolling baseline adapts after a sustained shift. Report the window, direction convention and units when reconstructing it. [R20.10]; section 3.2

## Mechanism

### Methodology: Attention outliers need per-head evidence

[MATHEMATICALLY-DERIVED] For head $h$, attention logits are $A^h=Q^h(K^h)^\top/\sqrt{d_h}$ before masking and softmax. For finite row logits with probabilities $p$, the softmax Jacobian is $\operatorname{diag}(p)-pp^\top$. Concentration toward a single key changes sensitivity even when a numerically shifted softmax avoids overflow. Inspect admitted logits, query/key norms, probability concentration and the head identity; a maximum across all layers loses the location. Masked negative infinities are expected sentinels and must be distinguished from nonfinite unmasked arithmetic.

[PAPER-REPORTED] Kimi K2 monitors the maximum positive admitted attention logit per head, $S_{\max}^h$. Its mid-scale 9B-activated/53B-total MoE study observes maxima above 1000 under vanilla Muon. The report's QK-Clip uses this observed statistic to rescale selected projection weights after the optimizer update. In MLA, head-specific content-query and content-key weights receive square-root factors, head-specific rotary-query weights receive the full factor, and the shared rotary-key component is left unchanged. The instrumentation is thus coupled to the architecture's shared-state structure. [R20.11]; section 2.1

[DERIVED] A batch maximum is not a global bound for unseen inputs. Moreover, a statistic gathered before an update is not the exact maximum of logits produced by the updated weights. The post-update intervention regulates subsequent growth; treating it as proof that every current or future logit is below the threshold overstates the mechanism. Negative extreme logits and nonfinite products require separate checks.

### Router state is part of stability

[PAPER-REPORTED] DeepSeek-V3 adjusts expert-selection biases using whole-batch load counts. The biases affect top-k selection, while selected affinity weights remain based on the original scores. An overloaded expert's bias decreases and an underloaded expert's increases by the specified speed. A small sequence-wise balance loss remains, despite the auxiliary-loss-free name. Expert assignments, gate weights, bias values and load-balance interventions are different observables and should not be compressed into one auxiliary-loss curve. [P13]; section 2.1.2

[MATHEMATICALLY-DERIVED] If $a_i$ counts assignments to expert $i$, then $\sum_i a_i$ equals the total routed assignments under a fixed top-k policy without token dropping. This identity catches accounting mistakes. Useful derived summaries include maximum/mean load and the fraction assigned to each expert, retaining the number of tokens and selected experts. A high imbalance can increase the slowest expert's processing time and communication tail even when the scalar loss remains smooth. An entropy summary alone can miss a single overloaded expert or mix together layers with different expert counts.

[DERIVED] Routing biases, running statistics and any capacity/drop policy belong to the checkpointed transition state. A rollback restoring weights and Adam moments while retaining later router biases creates a new trajectory. Changing router-bias speed late in training, as DeepSeek-V3 discloses, also changes a control loop; the causal claim cannot be attributed solely to the optimizer rate.

### Find the first exceptional boundary

[DERIVED] Checking only the final loss misses finite-forward/nonfinite-backward failures. Checking only gradients misses a finite-gradient update that overflows an optimizer statistic. Retain finite flags at input decoding/masking, selected activation boundaries, loss terms, gradients before/after unscale, moment candidates and parameters after commitment. This is a localization ordering, not proof of cause: the first *observed* nonfinite tensor can occur after an unobserved earlier error. Broader diagnostic instrumentation may change kernel choice or synchronization and must be identified as a separate replay.

[OFFICIAL-DOCUMENTATION] PyTorch AMP examples require unscaling before inspecting or clipping scaled gradients; GradScaler skips an optimizer step when its assigned gradients contain infinities or NaNs. This documented check does not test every forward activation, guarantee finite candidate optimizer state, or decide the trainer's data and schedule clocks. `clip_grad_norm_` can be configured to error on a nonfinite norm; clipping is not a repair operation for NaNs. [R20.25], [R20.26]

```figure
id: fig-20.10
kind: diagram
title: Stability evidence before and after the update
caption: Every measurement is attached to a transition boundary. The first observed anomaly localizes the evidence but does not alone identify a cause.
placement: inline
evidence: DERIVED
source: [R20.10, R20.11, R20.26]
alt: Data and masks feed forward activations and objective terms, then unscaled gradients, candidate moments, and committed state. Routing and precision state are retained alongside the transition.
spec:
  direction: TB
  nodes:
    - {id: data, kind: dataset, label: realized data and masks}
    - {id: act, kind: process, label: admitted logits and activations}
    - {id: loss, kind: process, label: objective terms and counts}
    - {id: grad, kind: process, label: unscaled unclipped gradient}
    - {id: cand, kind: branch, label: candidate update and moments}
    - {id: state, kind: state, label: committed state and counters}
  edges:
    - {from: data, to: act}
    - {from: act, to: loss}
    - {from: loss, to: grad}
    - {from: grad, to: cand}
    - {from: cand, to: state}
```

[MATHEMATICALLY-DERIVED] A retained activation boundary with shape $[B,T,d_{\mathrm{model}}]$ and $b$ bytes per value occupies

$$
M_{\mathrm{snapshot}}=BTd_{\mathrm{model}}b.
$$
*(Eq. 20.16)*

```figure
{
  "id": "fig-20.11",
  "kind": "calculator",
  "title": "Committed relative parameter displacement",
  "caption": "The ratio includes decay and post-update constraints. The floor prevents a zero denominator but can dominate near zero; values are an analytical diagnostic example.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-20.9",
  "alt": "For parameter norm 10 and displacement norm 0.01, the relative committed step is 0.001. Near-zero parameters are normalized by the declared floor.",
  "states": [
    {
      "anchor": "formulation",
      "label": "Well above the floor",
      "variables": {
        "wnorm": 10
      },
      "note": "Parameter norm determines the denominator."
    },
    {
      "anchor": "mechanism",
      "label": "Zero-initialized tensor",
      "variables": {
        "wnorm": 0
      },
      "note": "The declared floor now controls the ratio; inspect absolute displacement too."
    }
  ],
  "spec": {
    "tex": "r(W)=\\|\\Delta W\\|_F/\\max(\\|W\\|_F,\\epsilon_W)",
    "equation": "20.9",
    "inputs": [
      {
        "symbol": "wnorm",
        "label": "pre-update parameter norm",
        "default": 10,
        "min": 0,
        "max": 100,
        "format": "raw",
        "step": 0.1
      },
      {
        "symbol": "delta",
        "label": "committed displacement norm",
        "default": 0.01,
        "min": 0.0001,
        "max": 1,
        "format": "raw",
        "scale": "log10"
      },
      {
        "symbol": "eps",
        "label": "diagnostic floor",
        "default": 0.001,
        "min": 0.000001,
        "max": 0.1,
        "format": "raw",
        "scale": "log10"
      }
    ],
    "outputs": [
      {
        "symbol": "Relative",
        "label": "relative committed step",
        "formula": "delta/max(wnorm,eps)",
        "format": "ratio",
        "emphasis": true
      }
    ]
  }
}
```

```figure
{
  "id": "fig-20.12",
  "kind": "calculator",
  "title": "One retained activation snapshot",
  "caption": "Payload of one B by T by width activation tensor. Multiple boundaries, gradients, staging and metadata add storage; summary reductions retain less information.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-20.16",
  "alt": "Eight sequences of length 4096 with width 4096 at two bytes require 256 MiB for one activation snapshot.",
  "spec": {
    "tex": "M_{\\mathrm{snapshot}}=BTd_{\\mathrm{model}}b",
    "equation": "20.16",
    "inputs": [
      {
        "symbol": "B",
        "label": "sequences",
        "default": 8,
        "min": 1,
        "max": 64,
        "format": "integer",
        "scale": "log2"
      },
      {
        "symbol": "T",
        "label": "tokens per sequence",
        "default": 4096,
        "min": 512,
        "max": 131072,
        "format": "tokens",
        "scale": "log2"
      },
      {
        "symbol": "dim",
        "label": "residual width",
        "default": 4096,
        "min": 256,
        "max": 16384,
        "format": "integer",
        "scale": "log2"
      },
      {
        "symbol": "bytes",
        "label": "bytes per retained value",
        "default": 2,
        "min": 1,
        "max": 4,
        "format": "bytes",
        "options": [
          1,
          2,
          4
        ]
      }
    ],
    "outputs": [
      {
        "symbol": "Snapshot",
        "label": "one sampled tensor",
        "formula": "B*T*dim*bytes",
        "format": "bytes",
        "emphasis": true
      }
    ]
  }
}
```

## Algorithm

### Algorithm 20.4 — Ordered stability evidence

[DERIVED] Inputs are causally ordered boundaries $\mathcal B=(\text{data},\text{activation},\text{loss},\text{gradient},\text{candidate},\text{commit})$, timestamped observed tensors $Z_{k,j}$, intentional-sentinel masks $\mathcal S_j$, uniqueness/sampling maps $\mathcal Q_j$, alert predicates $\mathcal A_j$, and complete state/batch references. For each selected boundary:

$$
\begin{aligned}
\text{(1)}\quad &Y_{k,j}=\mathcal Q_j(Z_{k,j})\setminus\mathcal S_j;\\
\text{(2)}\quad &f_{k,j}=\prod_{z\in Y_{k,j}}\mathbf1\{|z|<\infty\};\\
\text{(3)}\quad &h_{k,j}=(|Y_{k,j}|,\sum Y_{k,j}^2,\max|Y_{k,j}|,f_{k,j},t_{k,j});\\
\text{(4)}\quad &j_* =\min\{j:f_{k,j}=0\ \lor\ \mathcal A_j(h_{k,j},\mathcal H_{k-1})=1\};\\
\text{(5)}\quad &\mathcal R_k=(\text{state/batch identity},\{h_{k,j}\},j_*,\text{acceptance},\text{clocks},\text{routing/precision state});\\
\text{(6)}\quad &\mathcal H_k=\operatorname{Tail}_{w}(\mathcal H_{k-1}\cup\{\mathcal R_k\}).
\end{aligned}
$$

[DERIVED] Empty sampling sets receive a missing-observation marker, not an undefined maximum. NaN is nonfinite. If no alert fires, $j_*=\varnothing$. Loss numerators/denominators and pre/post-clipping gradients remain separate fields. An anomalous window and its payload references are preserved before replacing the rolling baseline. The output is one retained record, including rejection; the invariant is boundary-identified unsmoothed evidence. Finite selected boundaries imply termination. Parameter reductions cost $O(N)$ arithmetic; activation reductions visit only declared sampled tensors. The first *observed* anomaly is a localization result, not a proven cause.

## Implementation

[DERIVED] Full activation snapshots can dominate storage: a sampled boundary with shape $[B,T,d_{model}]$ needs $BTd_{model}b$ bytes before metadata. Scalar summaries reduce write volume but discard spatial attribution. Computation of a maximum or squared norm is linear in visited elements and often bandwidth-bound; exact quantiles require additional work, whereas approximate summaries have their own approximation error. The record must distinguish sampled layers from complete coverage.

[DERIVED] Collective overhead depends on which summaries require global agreement. A vector of per-expert counts or per-head maxima is usually much smaller than gradients, but extra collectives can serialize an otherwise overlapped path. Instrumentation needs its own latency/allocation boundary: logging asynchronous device tensors through a host read can synchronize execution. An instrumented throughput measurement must report whether these costs are included. Monetary and energy overhead remain unverified without actual measurement.

[OFFICIAL-DOCUMENTATION] PyTorch provides the MODEL / AUTOGRAD FRAMEWORK operations for tensor reductions, clipping and AMP state inspection. Distributed layout semantics determine which coordinates are unique; an ordinary tensor API call is not automatically a globally correct sharded norm. The chapter's pseudocode specifies measurement roles without claiming a deployed monitoring implementation or a checked distributed kernel. [R20.25], [R20.26]

## Experimental design

### Reported experiments

[PAPER-REPORTED] OLMo 2 investigates several separate instability sources. Repetition masking removes loss contributions from sequences with at least 32 repeats of n-grams of length 1-13; it mitigates many spikes without eliminating slow gradient-norm growth. A shortened-warmup initialization ablation changes the gradient spike score from 0.40 to 0.03, while the changed initialization converges slightly more slowly. Reordered branch normalization and QK normalization improve together; neither isolated change yields the same result. Merely switching nonparametric LayerNorm to RMSNorm shows no difference in the authors' ablation. These negative/interaction results matter for interpreting the final recipe. [R20.10]; sections 3.1-3.3

[PAPER-REPORTED] Kimi K2's production run uses threshold 100 and reports no loss spikes across 15.5T tokens. A separate 0.5B-activated/3B-total MoE comparison uses threshold 30 and finds near-overlapping validation-loss curves with/without QK-Clip. The large-run observation and smaller controlled comparison are different strengths of evidence: the former demonstrates one complete disclosed trajectory, the latter examines an intervention under a smaller architecture and threshold. Neither establishes a universal no-spike guarantee. [R20.11]; section 2.1/AppD

## Observations

### Observation 20.4 - Smooth loss can conceal an unresolved implementation difference

**What the paper claims.** [PAPER-REPORTED] OLMo 2 attributes a backward-path discrepancy to suspected precision differences and describes replacing its custom implementation. [R20.10]; Section 3.3.3

**What the evidence shows.** [PAPER-REPORTED] Its custom and optimized paths produce equal forward z-loss values but different backward behavior, without a measured cross-entropy or downstream-quality difference in the reported comparison. [R20.10]; Section 3.3.3

**What we infer.** [DERIVED] Equal scalar forward values do not establish equal derivatives, and aggregate task quality can lack sensitivity to a numerical discrepancy. Recording the first observed divergence boundary is necessary for interpreting such a comparison.

**What remains unknown.** [NOT-DISCLOSED] The report does not establish a verified operation-level root cause. No independent reproduction resolving that cause is supplied here.

## Failure modes

[DERIVED] Post-clipping-only logs erase the incoming spike. Loss without valid-token count confounds batch composition with objective scale. A rank-local maximum can miss another rank's failure. A norm over replicated shards can falsely signal growth. Silent filter changes alter both stability and training distribution. A state manifest without the realized offending batch cannot test the proposed data cause. Treat each as an identifiable measurement boundary rather than substituting a more aggressive alert threshold.

## Siblings

[DERIVED] On the axis of observed quantity, [loss/count monitoring](../ch19-pretraining-objectives-and-the-full-training-loop/19-5-monitoring.md#formulation) measures task fit, incoming gradient norms measure the differentiated objective, relative committed updates measure retained displacement, per-head maxima locate attention outliers, and router counts measure sparse load. [Recovery](20-5-recovery-interventions.md#mechanism) changes a transition; instrumentation records it. A diagnostic intervention can alter runtime and therefore needs its own execution record.

## Extensions

### Improvements

[PAPER-REPORTED] Spectral Scaling Laws of Muon tracks singular-value quantiles of normalized momentum across 77M-2.8B GPT-style models, selected at comparable relative depths. The matrices supplied to Newton-Schulz, rather than raw gradient norm alone, expose directions that finite iterations under-amplify. Its fitted late-layer scaling is substantially steeper than that of middle layers; frontier extrapolation is a model prediction, not an observed trillion-parameter result. This extends instrumentation from scalar amplitude to the optimizer's actual spectral input. [R20.16]; section 3/AppA

## Limitations

[DERIVED] Sampling can miss the actual first failing operation, and a changed instrumented kernel can alter the behavior under investigation. A batch maximum depends on sample size and cannot bound unseen inputs. Rolling spike scores are descriptive under nonstationary dependent traces; they do not imply a calibrated Gaussian false-alert probability.

## Reproducibility

[DERIVED] Retain measurement code/version, tensor roles/shapes/dtypes, uniqueness/sharding convention, sampling intervals, windows and smoothing, finite-sentinel rules, event timestamps, accepted/consumed counters and data/state references. Report source hypotheses as hypotheses. This manuscript reconstructs reported instrumentation and its interpretation; it does not supply measured event traces or claim that its proposed diagnostic capture has been run.


## References

[P13](references.md) ? [R20.10](references.md) ? [R20.11](references.md) ? [R20.25](references.md) ? [R20.26](references.md) ? [R20.16](references.md)
