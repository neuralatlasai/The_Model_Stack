---
id: ms.section.42.6
entity_type: section
title: Predictive models
volume: 2
part: 7
chapter: 42
section: 42.6
slug: 42-6-predictive-models
parent: ms.chapter.42
prev_sibling: ms.section.42.5
next_sibling: ms.verification.42
children: []
prerequisites: [ms.chapter.14, ms.chapter.17, ms.chapter.25, ms.chapter.37, ms.chapter.40]
downstream: [ms.chapter.43, ms.chapter.44, ms.chapter.48]
related: []
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P36}
  - {type: implemented_by, target: impl.vllm}
axes: {lifecycle: [inference, serving], mechanism: [resource_accounting, cache_representation], feedback_setting: [], modality: [text]}
papers: [P36]
implementations: [impl.vllm, impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 42.6 Predictive models

## Scope

[DERIVED] The objective is an inference estimator that distinguishes exact storage identities, physical lower bounds, calibrated execution surfaces and queueing predictions. The baseline is a constant tokens/s or a model-size-only estimate. Success means predicting a declared workload inside a validated regime, exposing residuals and rejecting infeasible or out-of-domain inputs. Metric definitions and general queueing theory remain in [shared notation](../../../front-matter/notation.md) and Chapter 48; this section derives the inference-specific workload and state terms.

## Why this exists

[DERIVED] A memory ceiling is not a throughput estimate. A bandwidth lower bound is not a latency prediction. A fitted mean is not a p99 guarantee. These distinctions become operationally important when prompt/output lengths vary, several requests share weights, and admission changes batch composition. The same cache occupancy can arise from many short requests or a few long ones with different compute, state traffic and completion behavior.

[PAPER-REPORTED] Two 2026 studies make those modeling choices explicit: Lin et al. calibrate mixed/solo iteration costs and embed them in a multiclass control model [R42.15, §§2,6]; Ramani and Tantawi combine approximate per-iteration work with a state-dependent birth-death model for mean latency [R42.14, §§IV–VI]. Their analytical tractability comes from source conditions that must travel with their results.

## Intuition

[MATHEMATICALLY-DERIVED] The estimator has four layers. First count exact required objects. Then test physical capacity. Next estimate execution time conditional on the admitted batch and state. Finally simulate or analytically model arrivals and service to obtain request-visible timing. Errors in earlier layers cannot be repaired by fitting an unexplained constant at the last layer. A residual should identify omitted work, approximation error or a changed distribution rather than silently expanding a "utilization factor."

[DERIVED] The physically useful decomposition is parameters and activated operators, bytes moved across each memory tier, bytes communicated across each link, and dependencies that determine whether those operations overlap. Workload statistics determine how often each state occurs. A correct conditional iteration model can still give a wrong online prediction when the scheduler spends time in a different state distribution.

## Formulation

[MATHEMATICALLY-DERIVED] For a homogeneous unshared cache whose per-sequence token cost is $c=2LH_{kv}d_hb$, let $M_{\rm fixed}$ include weights and fixed resident allocations, $M_{\rm tmp}^{\max}$ an admissible simultaneous temporary peak and $M_{\rm usable}$ the device budget. The equal-context memory ceiling is

$$
B_{\max}(S)=\left\lfloor\frac{M_{\rm usable}-M_{\rm fixed}-M_{\rm tmp}^{\max}}{cS}\right\rfloor .
$$
*(Eq. 42.13)*

| Symbol | Meaning / unit |
|---|---|
| $M_{\rm usable},M_{\rm fixed},M_{\rm tmp}$ | disjoint capacity/fixed/temporary bytes |
| $c,S,B_{\max}$ | KV bytes/token, tokens/sequence, sequence ceiling |
| $\nu,d_n,p_n$ | requests/s, departures/s, stationary occupancy probability |

where all $M$ are bytes and $S>0$. Negative free capacity means infeasible, not a negative batch. Paging requires rounded physical slots; sharing requires unique blocks; heterogeneous layers require §42.2. Admission based only on current length must also reserve or manage future growth.

[MATHEMATICALLY-DERIVED] For one stated bottleneck device/link boundary in an iteration, with local arithmetic $F_u$, local HBM traffic $Q_{H,u}$, traffic on that link $Q_{N,u}$ and explicit dependency latency $t_{\rm dep,u}$,

$$
t_u\ge\max\left(\frac{F_u}{P_{\rm peak}},\frac{Q_{H,u}}{B_{\rm mem}},
\frac{Q_{N,u}}{B_{\rm net}},t_{\rm dep,u}\right).
$$
*(Eq. 42.14)*

where FLOPs/FLOP/s and bytes/(bytes/s) all give seconds. The maximum is a lower bound allowing ideal overlap; it is not a sum unless the execution schedule serializes these resources. Effective measured rates improve prediction but change the expression from a hardware bound to a calibrated model.


```figure
{
  "id": "fig-42.18",
  "kind": "calculator",
  "title": "Equal-context memory ceiling",
  "caption": "Illustrative configuration, not a device/model recommendation. The default reserves 48 GiB fixed and 4 GiB temporary from an 80 GiB budget; pages and sharing require a different accounting.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.13",
  "alt": "With 28 GiB remaining and 131072 bytes per token, contexts of 8192 tokens fit 28 sequences under the simplified formula.",
  "spec": {
    "tex": "B_{\\max}=\\lfloor(M-M_f-M_t)/(cS)\\rfloor",
    "equation": "42.13",
    "inputs": [
      {
        "symbol": "M",
        "label": "Usable GiB",
        "default": 80,
        "min": 1,
        "max": 512,
        "format": "raw"
      },
      {
        "symbol": "Mf",
        "label": "Fixed GiB",
        "default": 48,
        "min": 0,
        "max": 512,
        "format": "raw"
      },
      {
        "symbol": "Mt",
        "label": "Temporary peak GiB",
        "default": 4,
        "min": 0,
        "max": 512,
        "format": "raw"
      },
      {
        "symbol": "c",
        "label": "KV bytes per token",
        "default": 131072,
        "min": 1,
        "max": 1048576,
        "format": "bytes"
      },
      {
        "symbol": "S",
        "label": "Retained tokens per sequence",
        "default": 8192,
        "min": 1,
        "max": 131072,
        "format": "tokens"
      }
    ],
    "outputs": [
      {
        "symbol": "free",
        "label": "Free state bytes",
        "formula": "(M-Mf-Mt)*2^30",
        "format": "bytes"
      },
      {
        "symbol": "Bmax",
        "label": "Nonnegative sequence ceiling",
        "formula": "max(0,floor((M-Mf-Mt)*2^30/(c*S)))",
        "format": "integer"
      }
    ]
  },
  "anchor": "formulation"
}
```


## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] A single sequence with $S_p$ prompt tokens and $S_o$ outputs requires $S_o-1$ ordinary post-prefill passes. Under the convention that each pass reads all keys including its newly processed token, the total attended decode positions are

$$
A_{\rm decode}=\sum_{j=1}^{S_o-1}(S_p+j)
=(S_o-1)S_p+\frac{S_o(S_o-1)}2.
$$
*(Eq. 42.15)*

where $A_{\rm decode}$ is a count of key positions. Multiplying by actual KV bytes/position gives an idealized state-read volume if each stored value is fetched once per pass and no reuse changes the traffic. Thus output length has a quadratic contribution to total state reads even though instantaneous state storage is linear in length. For $S_o=1$, post-prefill read volume is zero under this accounting boundary.

[MATHEMATICALLY-DERIVED] Across workload distribution $\mathcal P(S_p,S_o)$,

$$
\mathbb E[A_{\rm decode}]
=\mathbb E[(S_o-1)S_p]
+\frac{\mathbb E[S_o^2]-\mathbb E[S_o]}2.
$$
*(Eq. 42.16)*

The first expectation includes prompt/output covariance. Replacing both lengths by their means omits that covariance and half the output-length variance. A synthetic benchmark with equal fixed lengths cannot reveal these terms. Long outputs also remain resident longer, so the distribution over in-flight requests is residence-time biased relative to the arrival distribution. An arrival histogram alone is insufficient to estimate active cache occupancy.

[DERIVED] An execution surface should condition on new prefill rows, active decode rows, total attended keys, cache representation, hit fraction, parallel mesh and backend. A useful calibrated form can combine a fixed launch/weight term with token and state-read terms; kernel shape changes can introduce thresholds rather than one global linear coefficient. Fit separate domains or an explicitly piecewise surface when attention changes backend, graph replay changes shape, or quantization introduces a different operator path.

[PAPER-REPORTED] Ramani and Tantawi parameterize baseline iteration overhead, per-token compute and per-cached-token access time; their homogeneous-request approximation uses mean prompt/output lengths, independent lengths and Poisson arrivals [R42.14, §§IV–V]. They derive state-dependent service time and total departure rate $\min(n,B)/t_{\rm service}(\min(n,B))$ for occupancy $n$, with a geometric stationary tail only when offered arrivals remain below full-batch completion capacity. Their model predicts means.

[MATHEMATICALLY-DERIVED] To expose that queueing contract without reusing the paper's symbols, let $\nu$ be arrival requests/s, $d_n$ the state-dependent total departure rate and $p_n$ stationary occupancy probability. For a birth-death process satisfying detailed balance,

$$
p_n=p_0\prod_{j=1}^{n}\frac{\nu}{d_j},\qquad
d_j=\frac{\min(j,B)}{t_{\rm service}(\min(j,B))}.
$$
*(Eq. 42.17)*

Normalization requires a finite sum. Once $d_j=d_B$ for all $j>B$, the tail ratio is $\nu/d_B$, so stationarity requires $\nu<d_B$. This is a reconstruction of the specified Markovian abstraction, not a proof that real continuous-batching servers have exponential service or occupancy-only dynamics. Tokens/sequence ages and current prefix lengths generally contain additional information.

[DERIVED] A fitted mean iteration model can support an operational mean queue estimate only when its arrival/service assumptions and calibration domain hold. It cannot generate a justified p95/p99 by adding an arbitrary percentile multiplier. Tail predictions require a distributional model and validation of that tail under the actual scheduler. Correlated arrivals, long requests, preemption, retries, CPU stalls and cache misses alter both occupancy and service distribution.

[PAPER-REPORTED] Lin et al. use a two-mode iteration abstraction, a fixed prompt chunk, representative request classes and independent exponential service stages to derive a many-GPU fluid control problem [R42.15, §§2–3]. Calibration supports a locally nearly constant solo-decode cost and a linear mixed-iteration cost over measured chunk sizes [R42.15, §6.1]. Their asymptotic result concerns the specified control model; it does not imply finite-cluster tail-latency optimality.

[DERIVED] The engineering response is to expose model class and residual checks. For a deterministic analytical inventory, disagreement is a representation or boundary bug. For a physical lower bound, a measurement faster than the bound indicates miscounted work/bytes or incompatible peak-rate assumptions. For a fitted surface, plot residuals by prompt length, output length, batch, cache hits and load. For queueing, examine arrival variability, stationarity and waiting tails. A single aggregate relative-error average can conceal a systematic failure in the longest requests.

[MATHEMATICALLY-DERIVED] Fitting a linear time surface $t=Xa+\varepsilon$ requires identifying its coefficients. If all experiments keep token count proportional to attended state, columns of $X$ can be nearly collinear, making compute and state coefficients unstable. More repeated measurements at the same ratio reduce noise but do not repair rank deficiency. Independently varying prompt length, output step and batch separates weight amortization, new-token arithmetic and cache traffic. A high $R^2$ alone is not evidence that fitted coefficients correspond to physical resources.

[DERIVED] Operational prediction also needs initialization and transition costs. Adding a replica involves weight load, executable preparation, graph capture and cache warming; an instantaneous steady-state capacity change omits them. Admission must reject a candidate whose expected growth exceeds the state policy even if the mean service estimate is favorable. Cancellation and bounded retries change the workload distribution and must be counted explicitly. Reliability, energy and money cannot be inferred from an isolated GPU mean; integrate actual device/host/network occupancy and accepted service over the same window.


```figure
{
  "id": "fig-42.19",
  "kind": "diagram",
  "title": "Prediction layers and validity",
  "caption": "Only the first two layers establish exact identities or impossibility. Calibrated execution and queue predictions require measured domain and distribution assumptions.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.14",
  "alt": "An inventory feeds capacity and physical bounds, then a calibrated iteration surface, an arrival/scheduler model and client-visible latency. Residual checks return to each preceding layer.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "i",
        "kind": "tensor",
        "label": "Representation inventory"
      },
      {
        "id": "b",
        "kind": "metric",
        "label": "Capacity and physical bounds"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "Calibrated iteration surface"
      },
      {
        "id": "q",
        "kind": "process",
        "label": "Arrival and scheduler model"
      },
      {
        "id": "l",
        "kind": "metric",
        "label": "Client-visible latency"
      },
      {
        "id": "v",
        "kind": "feedback",
        "label": "Domain and residual checks"
      }
    ],
    "edges": [
      {
        "from": "i",
        "to": "b"
      },
      {
        "from": "b",
        "to": "s"
      },
      {
        "from": "s",
        "to": "q"
      },
      {
        "from": "q",
        "to": "l"
      },
      {
        "from": "l",
        "to": "v"
      },
      {
        "from": "v",
        "to": "i"
      }
    ]
  }
}
```


## Algorithm

**Algorithm 42.6 — Bounded hierarchical estimator.** [DERIVED] Inputs are model/execution inventory, finite workload trace or declared distribution, supported mesh, measured calibration domain and finite prediction horizon $H$. Output is per-rank capacity, conditional iteration predictions, delivery estimates and a residual/gap ledger.

$$
\begin{aligned}
1.&\quad \operatorname{ValidateIdentityAndUnits};\quad
M_r\leftarrow\operatorname{InventoryAndLiveness};\
M_r>M_{\rm usable,r}\Rightarrow\mathrm{INFEASIBLE}.\\
2.&\quad (F_u,Q_{H,u},Q_{N,u},\mathcal D_u)\leftarrow\operatorname{CountBatchState};\
t_{{\rm lower},u}\leftarrow\operatorname{Bound}(42.14).\\
3.&\quad \operatorname{OutsideCalibrationDomain}(u)\Rightarrow\mathrm{UNVERIFIED\_PREDICTION};\
\widehat t_u\leftarrow\operatorname{CalibratedSurface}(u).\\
4.&\quad \widehat t_u<t_{{\rm lower},u}\Rightarrow\mathrm{ACCOUNTING\_FAILURE};\
\operatorname{AdvanceTraceOrValidQueueModel}(\widehat t_u).\\
5.&\quad \text{For events before }H:\operatorname{AdmitOrReject};\
\operatorname{UpdateState};\operatorname{RecordDeliveryAndRecovery}.\\
6.&\quad \operatorname{Return}(\mathrm{capacity},\mathrm{latency},\mathrm{domain},\mathrm{residuals});\
\text{do not label unvalidated tails as predictions}.
\end{aligned}
$$

[DERIVED] Invariants are per-rank capacity, nonnegative times, causal token advancement and explicit output boundaries. Finite horizon, bounded queue/admission and capped output lengths guarantee finite event counts for a finite arrival trace. An unbounded stochastic workload requires an explicit truncation/error criterion. Event simulation costs $O(E\log E)$ with a priority queue of $E$ events, plus batch-surface evaluation; state memory scales with active requests/pages. The estimator adds no model parameters but uses CPU time and stored traces.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** documents startup KV-token capacity and an estimated maximum concurrency based on configured maximum sequence length [R42.12, opening section]. That readout is a storage-based estimate, not a measured request-throughput or latency guarantee. **PyTorch — Model / autograd framework** provides the allocation boundary used in §42.2 [R42.3].

[DERIVED] Implement the artifact as separate inventory, bounds, calibrated surfaces and trace/queue modules. Every predicted number should retain its model/configuration identity, validity range and calibration provenance. Distinguish measured effective rate from hardware peak. Version changes, new graph shapes or an attention backend change require revalidation rather than silently recycling old coefficients.

## Experimental design

### Reported experiments

| Study | Protocol and evidence boundary |
|---|---|
| IBM 2026 [PAPER-REPORTED] | Llama-3.1-8B and Qwen2.5-14B on H100; 224 operating points, 16 mean-length pairs from 64 to 4096 and light/moderate load; fitted mean TTFT/ITL, with separate online controller evaluation [R42.14, §VI; §VIII] |
| Lin et al. 2026 [PAPER-REPORTED] | A100-SXM4-40GB server, vLLM 0.11.0, source-named Qwen-4B/Qwen-8B calibration; event simulation with two request classes, cluster sizes 5–500 and five seeds [R42.15, §6.1–6.2] |

[NOT-DISCLOSED] Exact model artifact hashes, a shared cross-study runtime and independently validated client-tail latency are absent from these inspected protocols. IBM fits the evaluated grid jointly; these reported errors are not an independently held-out prediction test [R42.14, §VI, Table I]. Lin et al.'s simulated cluster outcomes must not be presented as measurements from a 500-GPU deployment.

## Observations

**What the paper claims.** [PAPER-REPORTED] IBM reports joint-fit errors 4.6%/7.9% for mean ITL and 13.6%/15.8% for TTFT; its error is mean absolute deviation divided by mean measurement [R42.14, §VI, Table I]. These are not held-out or quantile errors.

**What the evidence shows.** [PAPER-REPORTED] The largest IBM deviations occur at long sequences/high load [R42.14, §VI]. Lin et al. report convergence in calibrated simulations but also class-wise decode-occupancy drift for the basic router, motivating an SLI-aware refinement [R42.15, §6.2; Figs. 4–5]. Aggregate optimal reward does not establish every desired occupancy target.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 42.16 identifies variance/covariance terms lost by a homogeneous mean-length approximation. Eq. 42.17 proves that no finite steady-state normalization exists once its arrival rate reaches its saturated departure rate.

**What remains unknown.** [UNVERIFIED] Transfer to bursty production traces, current models/backends, finite-cluster tail guarantees and independently reproduced fitted coefficients remains unresolved here.


```figure
{
  "id": "fig-42.20",
  "kind": "chart",
  "title": "Decode history reads grow with output",
  "caption": "Analytical prompt length 2048, not benchmark data. Summed attended positions contain both prompt-times-output and a quadratic generated-history term.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-42.15",
  "alt": "The curve executes Eq. 42.15 for outputs from 1 to 1024. One output needs no post-prefill decode pass under the declared convention.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Output model tokens",
      "scale": "linear",
      "format": "tokens",
      "domain": [
        1,
        1024
      ]
    },
    "y": {
      "label": "Summed attended key positions",
      "format": "raw"
    },
    "variables": {
      "Sp": 2048
    },
    "series": [
      {
        "id": "read",
        "label": "Post-prefill attended positions",
        "formula": "(x-1)*Sp+x*(x-1)/2",
        "sample": {
          "from": 1,
          "to": 1024,
          "count": 32
        }
      }
    ]
  },
  "anchor": "mechanism"
}
```


## Failure modes

> **Failure mode — Mean fit promoted to tail SLO.** [DERIVED] *Symptom:* predicted average latency is accurate while p99 violates service targets. *Cause:* the model has no validated tail distribution. *Detection:* inspect residuals and arrival/service tails separately. *Mitigation:* validate a distributional model or restrict the claim to means.

[DERIVED] Further failures are mean-length substitution despite heavy output variance, averaging memory before applying a hard ceiling, treating replicas as instantly warm, ignoring cross-request prefix correlations and calibrating compute/state coefficients from a rank-deficient design. Each has an observable diagnostic rather than an unexplained safety multiplier.

## Siblings

[DERIVED] Analytical bounds explain impossibility but can be loose. Calibrated surfaces predict local execution but need coverage. Trace simulation preserves declared heterogeneity but depends on the measured scheduler model. Markov/fluid abstractions offer tractability under explicit assumptions. Chapter 48 owns their general queueing/economic comparisons; here the axis is inference-specific representation fidelity versus calibration and computational cost.

## Extensions

### Improvements

[PAPER-REPORTED] IBM's online sliding-window multi-observation fitting avoids assigning all observed queueing delay to fixed iteration overhead, and excludes saturated cycles where its steady-state model is undefined [R42.14, §VII]. Lin et al.'s SLI-aware router changes class placement to address occupancy drift [R42.15, §6.2]. Neither refinement removes the underlying service/arrival assumptions or validates arbitrary latency tails.

## Limitations

[DERIVED] An estimator is authoritative only over its inventory and tested domain. A lower bound remains useful when absolute prediction is weak; an unresolved residual remains useful when its cause is explicit. Extrapolation beyond sequence, batch, backend or load coverage is UNVERIFIED. No equation here establishes empirical performance of a named deployment without measurements.

> **Open question.** [UNVERIFIED] How far can a compact iteration/queue model generalize across nonstationary ragged batches without losing identifiable physical parameters? *What evidence would settle it:* held-out joint length/arrival traces, backend changes and near-saturation tests with both mean and tail residuals and an explicit state-distribution model. This is a research question, separate from the missing execution of this edition.

## Reproducibility

[DERIVED] Retain units, exact timing/counter boundaries, identities, calibration train/holdout split, workload joint distributions, parameter constraints, residual plots, queue assumptions, finite horizon and excluded configurations. No estimator measurement or controller execution was performed for this edition. [Verification](verification.md) specifies the falsifiable proposal.

## References

[R42.3](references.md#r42-3), [R42.12](references.md#r42-12), [R42.14](references.md#r42-14), [R42.15](references.md#r42-15).
