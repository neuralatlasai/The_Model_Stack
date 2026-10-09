---
id: "ms.section.30.5"
entity_type: "section"
title: "Observability"
short_title: "Observability"
volume: 2
part: 5
chapter: 30
section: 30.5
slug: "30-5-observability"
parent: "ms.chapter.30"
prev_sibling: "ms.section.30.4"
next_sibling: "ms.section.30.6"
children: []
prerequisites: ["ms.chapter.12", "ms.chapter.19", "ms.chapter.20", "ms.chapter.21", "ms.chapter.25", "ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29"]
downstream: ["ms.chapter.31", "ms.chapter.36", "ms.chapter.44"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "continued_training"], "mechanism": ["distributed_training", "fault_tolerance", "checkpointing"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.torchtitan", "impl.megatron-lm", "impl.nvidia-megatron-core"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2000
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 30.5 — Observability

## Scope

[DERIVED] Define metrics that preserve logical-update, rank-role and wall-time semantics while bounding the observer's resource use. The baseline is synchronous distributed training with identifiable optimizer boundaries. Success means that retained-token throughput, utilization, stage accounting, numerical health and restart cost can be reconstructed from versioned records. Monitoring is evidence for investigation; an anomaly score does not establish a hardware root cause. Kernel analysis remains the responsibility of Chapters 26–29.

## Why this exists

[PAPER-REPORTED] The 2026 ARGUS study combines semantic spans, kernel records and CPU stacks, while StageFrontier explicitly distinguishes additive timing accounting from causal attribution [R30.18, §4–6; R30.19, §3–4]. Their different observation contracts address a shared ambiguity: waiting for another rank and performing useful work can occupy the same visible stage.

[DERIVED] A tokens-per-second counter can improve while the amount of retained training falls: replay executes tokens already counted before an incident. A loss dashboard can remain finite after finite corruption. A communication span can increase because its peer was delayed by storage, rather than because the fabric slowed. A mean step duration can improve while long-tail recovery consumes more allocated accelerator time. A runbook must therefore attach denominators, coverage, rank roles, missingness and version boundaries to every displayed number. Otherwise the dashboard is a collection of plausible but incompatible statements.

## Intuition

[MATHEMATICALLY-DERIVED] A measurement is a projection of execution. An additive projection requires disjoint accounting regions; a causal explanation additionally requires dependency or intervention evidence. Summing overlapping GPU kernel durations, host spans and collective timers counts time more than once. Conversely, a short host launch span can enqueue long device work. Start with inexpensive, complete counters; escalate to a bounded trace when the remaining hypotheses require event order, stream dependencies or an independent device measurement.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $F_m,F_x$ | Declared useful-model and executed arithmetic per update | FLOPs |
| $P_{\rm pool}$ | Summed compatible accelerator arithmetic peak | FLOPs/s |
| $t_u$ | Wall duration of the same update/window | Seconds |
| $D_r,D_x$ | Retained unique and executed token exposures | Tokens |
| $d_{r,j}$ | Ordered non-overlapping host-visible stage duration | Seconds |
| $L_r,z_r$ | Summed token loss numerator and valid-token denominator | Loss, tokens |
| $\mathcal U$ | Unique logical gradient-coordinate ownership | Set |

[MATHEMATICALLY-DERIVED] Under a declared arithmetic counting convention and common observation window,

$$
\operatorname{MFU}=\frac{F_m}{P_{\rm pool}t_u},\qquad
\operatorname{HFU}_{\rm count}=\frac{F_x}{P_{\rm pool}t_u},\qquad F_x=F_m+F_{\rm remat}+F_{\rm extra}.
$$
*(Eq. 30.21)*

The HFU expression is an executed-arithmetic estimate, not a hardware-counter measurement. Report whether multiply-add counts as two FLOPs, whether attention's sequence-dependent work is included, how routed experts are counted, and whether forward-only auxiliary work belongs in $F_{\rm extra}$. Dense and sparse peaks, numerical precision and device count must agree with the numerator. A value above one first demands a convention and window audit; it is not evidence that a device exceeded its physical limit.

```figure
{
  "id": "fig-30.25",
  "kind": "diagram",
  "title": "Metrics retain their observation contracts",
  "caption": "Logical updates feed separate progress, numerical-health and timing records. A bounded trace is selected only after the cheap records narrow the unresolved question.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.26",
  "alt": "Logical updates feed separate progress, numerical-health and timing records. A bounded trace is selected only after the cheap records narrow the unresolved question.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "u",
        "kind": "state",
        "label": "Logical update and generation"
      },
      {
        "id": "p",
        "kind": "objective",
        "label": "Retained-token progress"
      },
      {
        "id": "n",
        "kind": "tensor",
        "label": "Loss and gradient state"
      },
      {
        "id": "t",
        "kind": "flow",
        "label": "Role-aware stage spans"
      },
      {
        "id": "q",
        "kind": "boundary",
        "label": "Missingness and queue budget"
      },
      {
        "id": "r",
        "kind": "process",
        "label": "Selective trace"
      },
      {
        "id": "i",
        "kind": "dependency",
        "label": "Incident hypothesis"
      }
    ],
    "edges": [
      {
        "from": "u",
        "to": "p"
      },
      {
        "from": "u",
        "to": "n"
      },
      {
        "from": "u",
        "to": "t"
      },
      {
        "from": "p",
        "to": "q"
      },
      {
        "from": "n",
        "to": "q"
      },
      {
        "from": "t",
        "to": "q"
      },
      {
        "from": "q",
        "to": "r"
      },
      {
        "from": "r",
        "to": "i"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.26",
  "kind": "calculator",
  "title": "Useful arithmetic and recomputation utilization",
  "caption": "Adjust analytical arithmetic counts, compatible pool peak and update duration. Extra arithmetic raises executed utilization at fixed duration without increasing useful model work.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.21",
  "alt": "Adjust analytical arithmetic counts, compatible pool peak and update duration. Extra arithmetic raises executed utilization at fixed duration without increasing useful model work.",
  "spec": {
    "tex": "\\mathrm{MFU}=F/(Pt),\\quad \\mathrm{HFU}_{count}=(F+R)/(Pt)",
    "equation": "30.21",
    "inputs": [
      {
        "symbol": "F",
        "label": "Useful update TFLOPs",
        "default": 12000,
        "min": 1000,
        "max": 20000,
        "step": 1000,
        "format": "fixed3"
      },
      {
        "symbol": "R",
        "label": "Additional TFLOPs",
        "default": 3000,
        "min": 0,
        "max": 20000,
        "step": 1000,
        "format": "fixed3"
      },
      {
        "symbol": "P",
        "label": "Pool peak TFLOPs per second",
        "default": 20000,
        "min": 10000,
        "max": 100000,
        "step": 1000,
        "format": "fixed3"
      },
      {
        "symbol": "t",
        "label": "Update duration seconds",
        "default": 1,
        "min": 1,
        "max": 10,
        "step": 0.25,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "m",
        "label": "Model utilization",
        "formula": "F/(P*t)",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "h",
        "label": "Executed arithmetic utilization",
        "formula": "(F+R)/(P*t)",
        "format": "raw",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Distinguish executed throughput from retained progress over a wall window $T$, including all allocations, recovery and rejected updates assigned to that window:

$$
v_x=D_x/T,\qquad v_r=D_r/T,\qquad \rho_{\rm replay}=(D_x-D_r)/\max(D_x,1).
$$
*(Eq. 30.22)*

Here “unique” refers to logical training exposures, not deduplicated text: an intentionally repeated epoch remains a new canonical exposure. A recovered update must not be counted twice because it acquired a different physical endpoint. An executed exposure that was rejected or rolled back is excluded from retained progress. For partially filled or multimodal batches, record valid loss positions and modality-specific units; padding tokens or image patches are not silently interchangeable with language tokens. A training-only throughput window and an end-to-end run window are both useful if their boundaries are explicit.

[MATHEMATICALLY-DERIVED] For complete, nonnegative, ordered stage vectors relative to each rank's logical-step start, define cumulative durations, prefix frontiers and increments:

$$
c_{r,j}=\sum_{i=1}^{j}d_{r,i},\quad f_j=\max_r c_{r,j},\quad a_j=f_j-f_{j-1}\ge0,\quad \sum_{j=1}^{J}a_j=f_J,\quad f_0=0.
$$
*(Eq. 30.23)*

The equality telescopes. It accounts for maximum rank elapsed time under the ordered-stage contract; it does not reconstruct an arbitrary global critical path or correct unmatched step-start skew. Include a residual stage so each vector closes to the measured step total, and validate step identity before aggregation. This is a derivation of an accounting identity used in StageFrontier, not a new algorithm claim [R30.19, §3]. The rank attaining the maximum can change between boundaries. Its frontier share identifies where to inspect, while synchronization, role heterogeneity and overlap determine whether that stage caused the slowdown.

[DERIVED] Device timing requires a different clock contract. Record CUDA events on the stream that performs the work, retain cross-stream wait relationships, and resolve event readiness later rather than synchronizing every stage on the hot path. Summed kernel durations can exceed elapsed time when streams overlap. A trace should expose active intervals, dependency waits and idle intervals separately; a “communication percentage” derived by adding every overlapping collective cannot be subtracted directly from step time. Instrumentation itself must have a stated CPU, pinned-memory, device-memory and bandwidth budget.

[MATHEMATICALLY-DERIVED] The globally weighted loss and unique-coordinate gradient norm are

$$
\bar\ell=\frac{\sum_r L_r}{\sum_r z_r},\quad \sum_r z_r>0,\qquad
\|g\|_2=\left(\sum_{u\in\mathcal U}|g_u|^2\right)^{1/2}.
$$
*(Eq. 30.24)*

Count each logical coordinate once: summing complete data-parallel replicas overstates the norm. State whether gradients are scaled, accumulated, unscaled, clipped or post-reduction when observed. Report loss by objective and modality, clipping frequency, skipped-update count, parameter-update norm, optimizer moment summaries and nonfinite flags alongside aggregate loss. A changed loss denominator or data mixture is a changed metric definition, not necessarily learning progress.

[MATHEMATICALLY-DERIVED] Stable RMS summaries can avoid intermediate overflow without pretending to eliminate arithmetic error. For finite $x\in\mathbb R^n$, $n>0$, let $m=\max_i|x_i|$ and define

$$
\operatorname{RMS}(x)=\begin{cases}0,&m=0,\\m\sqrt{n^{-1}\sum_i(x_i/m)^2},&m>0.\end{cases}
$$
*(Eq. 30.25)*

Use a documented accumulation dtype, preserve nonfinite counts rather than replacing them with zero, and record all-zero states separately. Distributional summaries should include quantiles or sampled histograms when a small affected shard would disappear in a global mean. Sketches are lossy observations; retain their sampling policy and error parameters.

[DERIVED] Network health joins rank-role mappings to collective sequence IDs, message sizes, transport choices, NIC/link counters and topology. Compare peers that execute equivalent work. A large duration with little traffic can be a late peer; a large duration with retransmission or link-error evidence suggests a different hypothesis. Host staging, checkpoint drain and trace export compete for fabric capacity, so correlate them using update/window identities. A monitor must state whether a counter is cumulative, reset on restart, sampled, or missing; treating a reset as a negative error rate hides the very event being investigated.

```figure
{
  "id": "fig-30.27",
  "kind": "hierarchy",
  "title": "Escalation changes what can be concluded",
  "caption": "Low-volume records select a rank, role and window. Device traces and host stacks answer narrower questions; an intervention is needed for a causal repair claim.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.26",
  "alt": "Low-volume records select a rank, role and window. Device traces and host stacks answer narrower questions; an intervention is needed for a causal repair claim.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Progress ledger",
        "kind": "objective",
        "note": "Retained tokens and wall time"
      },
      {
        "label": "Stage vectors",
        "kind": "flow",
        "note": "Additive exposure accounting"
      },
      {
        "label": "Numerical summaries",
        "kind": "tensor",
        "note": "Finite flags and unique shards"
      },
      {
        "label": "Role-aware kernel records",
        "kind": "process",
        "note": "Candidate operator and stream"
      },
      {
        "label": "Bounded trace and stacks",
        "kind": "dependency",
        "note": "Dependency confirmation"
      },
      {
        "label": "Controlled intervention",
        "kind": "boundary",
        "note": "Discriminate remaining causes"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.28",
  "kind": "chart",
  "title": "More executed arithmetic can leave useful work unchanged",
  "caption": "Analytical cases hold useful model FLOPs, peak FLOPs and elapsed time fixed, giving40% useful utilization. Additional replay arithmetic changes executed utilization to60% or80%; these are accounting examples, not achieved throughput.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.21",
  "alt": "At zero,50% and100% additional arithmetic, executed utilization is40%,60%,80%, while useful utilization stays40%. The denominators are held fixed.",
  "spec": {
    "type": "bar",
    "x": {
      "label": "Additional arithmetic / useful arithmetic"
    },
    "y": {
      "label": "Utilization percent",
      "domain": [
        0,
        100
      ],
      "ticks": [
        0,
        20,
        40,
        60,
        80,
        100
      ]
    },
    "categories": [
      "0%",
      "50%",
      "100%"
    ],
    "series": [
      {
        "id": "executed",
        "label": "Executed arithmetic",
        "values": [
          40,
          60,
          80
        ],
        "emphasis": true
      },
      {
        "id": "useful",
        "label": "Useful model arithmetic",
        "values": [
          40,
          40,
          40
        ]
      }
    ]
  }
}
```

## Algorithm

### Algorithm 30.5 — Bounded observation and selective escalation

[DERIVED] Inputs are generation $e$, logical update IDs, stage schema $J$, a byte budget $B$, queue deadline $\delta$ and immutable metric definitions. Outputs are versioned summaries or an explicit incomplete record. Telemetry failure cannot silently modify the training update. Mandatory safety checks remain in the training-control protocol, not in this optional observer. Let $C(w)$ require all expected records with the same generation, logical update and schema, plus valid numerical fields. A dropped record is not enqueued later in the procedure.

$$
\begin{aligned}
1.&\quad z\leftarrow\operatorname{capture}(e,k,\text{role},\text{schema},\text{local counters}).\\
2.&\quad \neg\operatorname{finite\_nonnegative\_closed}(z.d)\Longrightarrow z.\text{quality}\leftarrow\text{invalid}.\\
3.&\quad a\leftarrow\mathbf1[\operatorname{bytes}(Q)+\operatorname{bytes}(z)\le B];\quad a=0\Longrightarrow\operatorname{count\_drop}().\\
4.&\quad a=1\Longrightarrow\operatorname{enqueue}(z,Q);\quad w\leftarrow\operatorname{gather\_bounded}(Q,\delta,\text{separate control path}).\\
5.&\quad \neg C(w)\Longrightarrow\operatorname{emit}(\text{telemetry limited},w).\\
6.&\quad C(w)\Longrightarrow\operatorname{compute}(v_r,v_x,a_j,\bar\ell,\|g\|_2;\text{definitions}).\\
7.&\quad H\leftarrow\operatorname{candidate\_hypotheses}(w,\text{roles});\quad |H|>1\Longrightarrow\operatorname{bounded\_trace}(H).\\
8.&\quad \operatorname{emit}(w,H,\text{coverage},\text{observer cost},\text{unresolved causes}).
\end{aligned}
$$
*(Eq. 30.26)*

[DERIVED] The queue invariant is $\operatorname{bytes}(Q)\le B$; the identity invariant prohibits joining different generations or logical steps. Collection terminates on completion or deadline. A malformed window is never repaired by inventing zero-duration ranks. Local work is $O(J)$ plus chosen summaries; a dense gather of $N$ steps over $R$ ranks is $O(NRJ)$ values. Sampling and hierarchical aggregation reduce traffic only with an explicit loss-of-information contract. A watchdog that uses the same blocked collective it watches does not satisfy bounded termination.

```figure
{
  "id": "fig-30.29",
  "kind": "compare",
  "title": "Observation mechanisms answer different questions",
  "caption": "The comparison concerns information and cost obligations, not measured overhead. Each mechanism needs its own versioned protocol and missingness policy.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.26",
  "alt": "The comparison concerns information and cost obligations, not measured overhead. Each mechanism needs its own versioned protocol and missingness policy.",
  "spec": {
    "axis": "Observation contract",
    "columns": [
      {
        "id": "counter",
        "label": "Counters"
      },
      {
        "id": "stage",
        "label": "Ordered stages"
      },
      {
        "id": "trace",
        "label": "Event trace"
      }
    ],
    "rows": [
      {
        "dimension": "Primary question",
        "values": {
          "counter": "How much progress?",
          "stage": "Where exposure first appears?",
          "trace": "Which dependencies and streams?"
        }
      },
      {
        "dimension": "Missing information",
        "values": {
          "counter": "Order and overlap",
          "stage": "Detailed device causality",
          "trace": "Uncaptured windows"
        }
      },
      {
        "dimension": "Resource control",
        "values": {
          "counter": "Bounded cardinality",
          "stage": "Bounded gather and window",
          "trace": "Bounded buffers and sampling"
        }
      },
      {
        "dimension": "Conclusion limit",
        "values": {
          "counter": "No root-cause claim",
          "stage": "Routing under stated model",
          "trace": "Confirmation within capture"
        }
      }
    ]
  }
}
```

## Implementation

[OFFICIAL-DOCUMENTATION] TorchTitan v0.3.0's structured logger defines per-rank structured records and spans with time, step and tags [R30.16, README]. [DERIVED] Bind these to experiment/generation identity, tensor-parallel and expert roles, configuration digest and quality flags. A declared nonblocking design principle is not a proof that an arbitrary handler is nonblocking: bound export work, avoid inline remote writes, and test a stalled sink. Keep high-cardinality sample identities in the artifact ledger rather than multiplying time-series labels without limit.

[DERIVED] At tensor level, numerical summaries obey unique-shard ownership and scale conventions. At framework level, stage boundaries include optimizer and data waits. At kernel level, a selected trace records stream and operator correlation. At memory level, preallocate bounded trace buffers and include them in admission. At communication level, use a failure-safe telemetry path and role-aware comparisons. At deployment level, monitor the monitor: dropped records, queue occupancy, gather timeout, export lag and incremental step-time cost are first-class fields. MaxText or Megatron-Core adapters require the same contract even when their metric names differ.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The following compact records describe inspected 2026 source protocols, rather than experiments executed for this book [R30.18, §8, Appendix C; R30.19, §6, Appendix F].

| Protocol field | ARGUS | StageFrontier |
|---|---|---|
| Workload | HunYuan-V3 Preview MoE;36 layers, hidden 2048,128 experts/top8 | BF16 transformer; exact model/hardware per artifact rows |
| Hardware/precision | 8/32 GPUs; NVLink node; BF16; GPU model not disclosed in setup | 8–128 ranks; NVIDIA24.12/PyTorch2.6.0a0/CUDA12.6; NCCL2.23.4 |
| Budget/baselines | 1000 iterations; always-on PyTorch Profiler/nsys | 20 warmup,120–600 measured steps; shared-stage baselines; selected-window profiler comparison |
| Seeds/uncertainty | Independent-run CI not disclosed | Hidden-rank matrix5 seeds; overhead paired-block bootstrap |
| Ablations | Sampling/semantic/CUPTI components | Event sampling; removed injection; accumulation; FSDP/ZeRO-1 |

## Observations

**What the paper claims.** [PAPER-REPORTED] ARGUS reports combined overhead within 2% in its setup, while always-on nsys fails with NaN/hang and PyTorch Profiler accumulates traces. StageFrontier reports50/50 top-two but40/50 top-one routing rows; per-stage maxima also reach50/50 top-two [R30.18, §8.2; R30.19, Table4].

**What the evidence shows.** [DERIVED] These are different capture regimes, not universal profiler rankings. StageFrontier's selected-window agreement uses a shared coarse reducer, while small data tails and host-only controls expose scope boundaries. ARGUS's Appendix D diagnostic mapping is not a measured recall distribution across all possible production faults.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq.30.23 supplies additive accounting with a validated ordered-stage contract; it cannot alone identify a causal operator. Eq.30.22 makes replay and rejected work visible even when training-only utilization remains high.

**What remains unknown.** [UNVERIFIED] This edition has not measured instrumentation cost, rare-event false alarms, long-run telemetry backpressure or diagnostic recall on its own deployment. Source results do not close those gaps.

## Failure modes

> **Failure mode — Wait charged twice.** [MATHEMATICALLY-DERIVED] *Symptom:* component totals exceed elapsed step time. *Cause:* per-stage maxima or overlapping spans are added. *Detection:* closure check and stream trace. *Mitigation:* a valid disjoint accounting contract, with overlaps reported separately.

> **Failure mode — Healthy-looking incomplete window.** [DERIVED] *Symptom:* worst-rank latency disappears during an incident. *Cause:* missing ranks replaced by zeros. *Detection:* expected/observed rank and generation coverage. *Mitigation:* emit incomplete quality and withhold a strong diagnostic conclusion.

[DERIVED] Numerical metrics also fail through replica double counting, inconsistent gradient scaling, zero denominators and post-clipping observations that hide pre-clipping excursions. A repaired unit conversion does not validate the underlying sampling policy. Store definitions beside values so later reviews can distinguish a metric change from a system change.

```figure
{
  "id": "fig-30.30",
  "kind": "stat-panel",
  "title": "The monitor must disclose its own losses",
  "caption": "These quality fields constrain interpretation of every summary. They are categorical protocol obligations, not measured incident statistics.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.26",
  "alt": "These quality fields constrain interpretation of every summary. They are categorical protocol obligations, not measured incident statistics.",
  "spec": {
    "header": "The monitor must disclose its own losses",
    "rows": [
      {
        "key": "Coverage",
        "value": "Expected versus observed ranks"
      },
      {
        "key": "Identity",
        "value": "Generation and logical step"
      },
      {
        "key": "Queue",
        "value": "Bytes, drops and export lag"
      },
      {
        "key": "Clock",
        "value": "Host/device and stream contract"
      },
      {
        "key": "Conclusion",
        "value": "Candidate versus confirmed cause"
      }
    ]
  },
  "anchor": "failure-modes"
}
```

## Siblings

[DERIVED] Counters provide long-duration coverage with little ordering information; ordered stage vectors add additive exposure accounting under a schema; detailed traces add event dependencies and stream overlap within captured windows. CPU stack sampling can explain host inactivity that GPU traces only show as idle. None subsumes all the others. Choose the least costly observation capable of discriminating the current hypotheses and retain enough raw evidence to audit that choice.

## Extensions

### Improvements

[PAPER-REPORTED] ARGUS uses bounded buffers and permits partial record drops under backpressure; StageFrontier downgrades incomplete or role-heterogeneous evidence [R30.18, Appendix A; R30.19, §4–5]. [DERIVED] For mixture-of-experts or pipeline roles, compare like roles and include routing/sequence shape before interpreting timing distributions. A global rank mean can conceal valid role differences.

## Limitations

[DERIVED] This section defines evidence contracts and derivations, not a calibrated anomaly detector. Timing conclusions depend on stage closure, matching logical steps, finite observation overhead and correct role assignment. A causal diagnosis remains unresolved when alternative dependency graphs produce the same summaries. That uncertainty is an output of the protocol, not a missing dashboard feature.

## Reproducibility

[DERIVED] Preserve metric schemas, arithmetic conventions, rank maps, generation boundaries, window inclusion rules, sampling configuration, raw selected traces, queue/drop counters and paired overhead runs. Record tool versions and capture modes; selected-window and always-on outcomes must remain separate. [UNVERIFIED] No profiler or monitoring experiment was executed for this manuscript. The proposed paired observer-cost and stalled-sink protocol is in [verification](verification.md#experiment-305--observer-cost-missingness-and-diagnostic-evidence).

## References

[R30.16] versioned TorchTitan structured logging; [R30.18] ARGUS; [R30.19] StageFrontier. Full records and inspection locators appear in [references](references.md).
