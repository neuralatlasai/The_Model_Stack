---
id: "ms.section.44.6"
entity_type: "section"
title: "44.6 — Load adaptation"
volume: 2
part: 8
chapter: 44
section: 44.6
slug: "44-6-load-adaptation"
parent: "ms.chapter.44"
prev_sibling: "ms.section.44.5"
next_sibling: ms.verification.44
children: []
prerequisites: ["ms.chapter.29","ms.chapter.42","ms.chapter.43"]
downstream: ["ms.chapter.46","ms.chapter.47","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["scheduling","distributed_serving","disaggregation"],"feedback_setting":[],"modality":["text"]}
papers: ["P37","P38"]
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 44.6 — Load adaptation

## Scope

[DERIVED] This section owns adapting admitted work to bursty arrivals, long-tailed output lengths, cancellation, preemption, migration, and priority classes. It also distinguishes useful SLO goodput from raw completion or token throughput. The baseline is an equal-budget static placement/scheduler with identical requests and model semantics. Success requires bounded state, explicit rejection/cancellation accounting, and service improvement that survives recovery and transition costs. Autoscaling policy and external service contracts are owned by Chapter 46.

## Why this exists

[MATHEMATICALLY-DERIVED] Output length is normally unknown at admission, while every newly generated token can extend memory residency and future work. A placement balanced at arrival can become unbalanced during execution. Bursts amplify the mismatch: prefill completes a wave of requests before decode can drain them. Long tails make the mean an inadequate description because a few persistent requests can hold substantial state through many short arrivals.

[PAPER-REPORTED] FastServe uses profiled first-iteration time to skip-join a multilevel feedback queue, demotes attained service, and promotes starved jobs [R44.6](references.md), §4.1, Algorithm 1. Llumnix instead changes placement during execution through live state migration and a virtual-usage load metric [R44.5](references.md), §4. These methods address different consequences of unknown remaining work.

[DERIVED] Adaptation cannot create capacity from sustained overload. It decides which work waits, moves, recomputes, or is rejected. A scheduler that reports lower latency only for the accepted subset may have improved admission selection rather than execution. Both can be useful, but they need different denominators and evidence.

## Intuition

[MATHEMATICALLY-DERIVED] A long sequence is expensive to move because it owns a large prefix, but its old KV is immutable under a fixed model/policy. A migration can copy that prefix while generation continues, then pause briefly to move the tail. The advantage depends on copy bandwidth exceeding the rate at which new state appears. Likewise, lower GPU frequency can save power while increasing residency and memory pressure. Adaptation is a state-and-time problem, not just a queue-length problem.

## Formulation

> **Definition — SLO goodput.** [DERIVED] The rate of useful completed requests satisfying the declared joint service criteria, measured over a specified offered/accepted population and time boundary.

> **Definition — Virtual usage.** [DERIVED] A scheduling accounting quantity that augments physical state occupancy with policy costs such as queued demand or protected headroom; it need not equal allocated bytes.

| Symbol | Meaning and unit |
|---|---|
| $A,C,S$ | Offered, completed, and criterion-satisfying request counts |
| $T,\lambda_o$ | Observation seconds and offered request rate |
| $M_j,V_r,B_j$ | Instance state capacity, virtual usage, active batch size |
| $g,B_x$ | Newly generated state bytes/s and effective migration bytes/s |
| $T_{\rm rec},T_{\rm swap}$ | Recomputation and swap recovery seconds |
| $P_c,E_c,R_c,G_c$ | Configuration power, energy/request, feasible requests/s, GPU count |

[MATHEMATICALLY-DERIVED] With rejection and unsuccessful work retained in the accounting,
$$
G_{\rm offered}=\frac{S}{T},\qquad
\operatorname{attainment}_{\rm offered}=\frac{S}{A},\qquad
\operatorname{attainment}_{\rm accepted}=\frac{S}{A-N_{\rm rejected}}.
$$
*(Eq. 44.26)*

where cancellation treatment must be declared in the useful-work criterion rather than silently removed. A system can raise accepted attainment by rejecting more requests while lowering $G_{\rm offered}$. Quality constraints, if present, belong in the criterion defining $S$.

[DERIVED] Request-average TPOT and worst token gap answer different questions. A single long preemption stall can be diluted over hundreds of output tokens. Tail service analysis should retain the sequence of visible-token timestamps and distinguish scheduling delay, execution time, migration downtime, recomputation, and client backpressure. “P99 TPOT” is ambiguous unless the aggregation order is stated.

```figure
{
  "id": "fig-44.18",
  "kind": "diagram",
  "title": "Adaptive request lifecycle and reclamation",
  "caption": "Cancellation prevents new work immediately, but memory release waits for physical references to quiesce. Migration and recovery retain one request epoch.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.31",
  "alt": "Cancellation prevents new work immediately, but memory release waits for physical references to quiesce. Migration and recovery retain one request epoch. Values and structures are analytical; no measured model performance is shown.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "active epoch"
      },
      {
        "id": "p",
        "kind": "branch",
        "label": "growth pressure or burst"
      },
      {
        "id": "r",
        "kind": "process",
        "label": "preempt or migrate"
      },
      {
        "id": "o",
        "kind": "state",
        "label": "committed owner"
      },
      {
        "id": "c",
        "kind": "state",
        "label": "cancelling"
      },
      {
        "id": "q",
        "kind": "process",
        "label": "quiesce kernels and transport"
      },
      {
        "id": "t",
        "kind": "state",
        "label": "terminal once"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "p",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "r",
        "kind": "flow"
      },
      {
        "from": "r",
        "to": "o",
        "kind": "flow"
      },
      {
        "from": "o",
        "to": "a",
        "kind": "flow"
      },
      {
        "from": "a",
        "to": "c",
        "kind": "flow"
      },
      {
        "from": "r",
        "to": "c",
        "kind": "flow"
      },
      {
        "from": "c",
        "to": "q",
        "kind": "flow"
      },
      {
        "from": "q",
        "to": "t",
        "kind": "flow"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] FastServe initializes a job in the highest-priority queue whose quantum accommodates its predicted first iteration, then demotes after quantum use and periodically promotes starved jobs. It manages KV movement proactively rather than assuming context-free preemption [R44.6](references.md), §§4.1–4.2. This is a partially informed policy: prompt cost is estimated, final output length remains unknown.

[DERIVED] A feedback queue uses attained service as information about likely remaining work. It avoids an unavailable oracle, but can deprioritize a valuable long job and can be sensitive to the fairness unit. Counting iterations treats a short-context decode like a long-context one; counting predicted device-time is more resource-aware but inherits model error. Starvation promotion restores eligibility, yet a finite latency guarantee still needs bounded competing work and enough capacity.

[PAPER-REPORTED] Llumnix defines instance freeness as $(M-\sum_r V_r)/B$, adds queued head-of-line demand and priority headroom to virtual usage, and pairs relatively overloaded/free instances for migration. Its append-only copy protocol reserves destination blocks stage by stage, overlaps old-state copying with decode, then stops the request for the final tail and commits ownership [R44.5](references.md), §§4.2–4.4.

[MATHEMATICALLY-DERIVED] Let the first migration copy contain $V_0$ bytes and new state accrue at rate $g$. Under constant effective copy bandwidth $B_x$ with perfect overlap and no setup costs, successive tails satisfy
$$
V_{i+1}=\frac{g}{B_x}V_i,\qquad
\sum_{i=0}^{\infty}\frac{V_i}{B_x}
=\frac{V_0/B_x}{1-g/B_x}\quad\text{if }g<B_x.
$$
*(Eq. 44.27)*

where these are analytical fluid approximations. If $g\ge B_x$, the tail does not contract; a finite pause or abort is necessary. Copying faster on an idle link does not establish contraction under simultaneous migrations.

[DERIVED] A live-migration transaction must also account for destination capacity and source completion. Destination blocks are reserved before copying each range; a source that completes or is cancelled during transfer aborts or reconciles the migration. The final ownership switch waits for valid state and fences the old executor. A missing acknowledgement is an ownership uncertainty, not permission to run both copies. The handoff invariants from §44.4 remain applicable.

[MATHEMATICALLY-DERIVED] Preemption has distinct recovery choices:
$$
T_{\rm rec}=T_{\rm requeue}+T_{\rm prefix\ recompute},\qquad
T_{\rm swap}=T_{\rm out}+T_{\rm requeue}'+T_{\rm in}+T_{\rm format},
$$
*(Eq. 44.28)*

where swap transfers the relevant stored state, and recomputation must replay the committed token prefix under compatible model semantics. Choose by expected total recovery cost and available host/network capacity, not by assuming one is universally cheaper. In particular, a short prefix can favor recomputation while a long prefix on a fast path can favor transfer.

[OFFICIAL-DOCUMENTATION] Current vLLM V1 documents recomputation as its default preemption mode and warns that repeated preemptions can degrade latency [R44.9](references.md), “Preemption.” The current default is an implementation-specific tradeoff, not a theorem about every model, context, or transport.

```figure
{
  "id": "fig-44.19",
  "kind": "calculator",
  "title": "Convergent migration copy work",
  "caption": "The fluid model is restricted here to g below B. It ignores setup and contention; outside this regime the geometric tail does not contract.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-44.27",
  "alt": "The fluid model is restricted here to g below B. It ignores setup and contention; outside this regime the geometric tail does not contract. Values and structures are analytical; no measured model performance is shown.",
  "spec": {
    "tex": "T=(V/B)/(1-g/B)",
    "equation": "44.27",
    "inputs": [
      {
        "symbol": "V",
        "label": "initial state bytes",
        "default": 1073741824,
        "min": 1,
        "max": 137438953472,
        "format": "bytes"
      },
      {
        "symbol": "g",
        "label": "state growth bytes per second",
        "default": 10000000,
        "min": 0,
        "max": 500000000,
        "format": "bytes/s"
      },
      {
        "symbol": "B",
        "label": "copy bytes per second",
        "default": 10000000000,
        "min": 1000000000,
        "max": 1000000000000,
        "format": "bytes/s"
      }
    ],
    "outputs": [
      {
        "symbol": "T",
        "label": "total copy seconds",
        "formula": "(V/B)/(1-g/B)",
        "format": "seconds",
        "emphasis": true
      }
    ]
  }
}
```

[PAPER-REPORTED] Mooncake coordinates rejection before expensive prefill using predicted decode readiness; its paper distinguishes rejecting only after phase work from early rejection and prediction-assisted early rejection [R44.3](references.md), §6. The relevant benefit is avoiding computation for requests that cannot proceed, subject to forecast accuracy.

[DERIVED] Early rejection can also be premature. A currently full decode pool may drain before a long prefill finishes; using instantaneous load alone rejects a feasible future arrival. Conversely, optimistic output-length prediction can admit too many persistent requests. Forecast error has asymmetric costs: unnecessary rejection loses useful work, while underestimating residency can trigger broad stalls and recomputation. Prediction accuracy should therefore be evaluated by decision consequences, not only length-estimation error.

[DERIVED] Cancellation requires a terminal-state protocol. The client disconnecting does not prove all workers, kernels, or transfers have stopped. Marking cancellation prevents new work and output publication, but memory can be reclaimed only when device/transport references quiesce. A concurrent EOS, cancellation, and migration acknowledgement must resolve to one authoritative terminal state. Retry IDs and epochs prevent a cancelled request from reappearing through delayed messages.

[PAPER-REPORTED] BiScale's 2026 controller builds profiled latency/power models and simulation-based phase configuration tables, uses an ILP for placement, prefill horizon control and decode frequency selection with memory override. Its prefill projection assumes no new arrivals and no ongoing completions within the horizon [R44.8](references.md), §§4.3–4.5.

[MATHEMATICALLY-DERIVED] A generic phase-configuration reconstruction is
$$
\min_{n_c\in\mathbb N_0}\sum_c n_cE_cR_c,\quad
\sum_c n_cG_c\le G,\quad
\sum_{c\in P}n_cR_c\ge(1+\alpha)R,\quad
\sum_{c\in D}n_cR_c\ge(1+\alpha)R.
$$
*(Eq. 44.29)*

where $E_cR_c$ has units of power, $R$ is target request rate, and phase service tables embody workload-dependent feasibility. This is the structure of BiScale's stated ILP [R44.8](references.md), Eqs. 1–5, expressed with a separate candidate index. Optimizing a profiled table is conditionally optimal for that table, not proof of real SLO guarantees under model error and transition delays.

[DERIVED] A phase controller can exploit slack by choosing a slower frequency only when predicted service plus queue evolution remains within deadlines. Its implementation needs a fallback on underprediction and an accounting boundary that includes frequency-change delays. BiScale's greedy search ranks candidates by average power; minimizing average power is not generally identical to minimizing energy if duration differs. For a hypothetical pair, lower $P$ can still yield higher $PT$ when time grows enough. That dimensional distinction limits the interpretation of the heuristic without asserting that its reported energy results are wrong.

[MATHEMATICALLY-DERIVED] Let steady-state savings over window $W$ be $\Delta P\,W$ joules and transition/recovery cost be $E_{\rm tr}$. Adaptation saves total energy only if
$$
\Delta P\,W>E_{\rm tr}.
$$
*(Eq. 44.30)*

where transition energy includes the chosen boundary's overlap, startup, drain, and extra work. A similar inequality uses billed GPU-time for monetary break-even. Frequent reconfiguration can lose even when every isolated steady-state placement is better.

## Algorithm

### Algorithm 44.7 — Bounded event-driven adaptation and terminal-state handling

[DERIVED] Inputs are request/instance state, service classes, load estimates, finite migration/preemption budgets, deadlines, and cancellation events. Output is a feasible action and an auditable event record. This analytical controller joins the execution obligations; it is not claimed to reproduce any one cited system.

$$
\begin{aligned}
1.\;&a\gets\operatorname{idle};\quad\operatorname{collect}(e,\operatorname{queues},\operatorname{memory},\operatorname{last\ token});
\quad\operatorname{cancel}(r)\Rightarrow r:\operatorname{active}\to\operatorname{cancelling}.\\
2.\;&r=\operatorname{cancelling}\Rightarrow
\operatorname{stop\_new\_work}(r);\
\operatorname{await\_quiescence}(r,d_r);\
\operatorname{publish\_terminal\_once}(r);\ \operatorname{return\_for\_request}(r).\\
3.\;&\operatorname{infeasible\_growth}\Rightarrow
v\gets\operatorname{policy\_victim};\
\mathcal A\gets\operatorname{feasible\_recovery\_actions}(v);\space
\mathcal A=\varnothing\Rightarrow\operatorname{fail\_explicitly\ and\ return};\quad
 a\gets\arg\min_{a\in\mathcal A}\widehat T_a.\\
4.\;&a=\operatorname{migrate}\land\widehat g\ge\widehat B_x
\Rightarrow\operatorname{bound\_pause\ or\ abort};
\quad\operatorname{reserve\_destination}\text{ fails}\Rightarrow\operatorname{choose\_another\ action}.\\
5.\;&a=\operatorname{idle}\Rightarrow\operatorname{return\_until\_next\_event};\quad
\operatorname{execute\_action}(a,e);
\quad\operatorname{error}\Rightarrow\operatorname{rollback\_uncommitted\ state};\
\operatorname{fence\_failed\ epoch}.\\
6.\;&\operatorname{success}\Rightarrow\operatorname{commit\_owner\ or\ queue\ state};
\quad\operatorname{record}(\operatorname{cost},\operatorname{delay},\operatorname{terminal\ outcome}).\\
7.\;&\operatorname{budget\ exhausted}\lor\operatorname{deadline\ expired}
\Rightarrow\operatorname{fail\_explicitly};
\quad\text{otherwise return on the next event}.
\end{aligned}
$$
*(Eq. 44.31)*

where all waiting and retries have finite deadlines. Invariants are one owner/terminal outcome per epoch, nonnegative physical allocations, preserved committed prefix, and no freeing while in-flight references exist. A timeout that cannot cancel transport must quarantine its buffers rather than immediately reuse them. With $R$ requests, event ordering is $O(\log R)$ using a heap; action payload costs follow Eqs. 44.27–44.28.

## Implementation

[DERIVED] **vLLM/SGLang** (§4 #41/#42, Inference engine) expose the admission and state-management layer; **PyTorch** (§4 #17, Model / autograd) and **NVIDIA NCCL** (§4 #4, Kernels / collectives) supply execution/communication substrates. Llumnix, FastServe, Mooncake, MFS, and BiScale are method-specific sources outside the numbered system stack. Adaptation joins queue priorities to allocator references, copy streams, rank epochs, and API cancellation state; a policy name does not specify those interfaces.

[OFFICIAL-DOCUMENTATION] Mooncake's inspected transfer header states that a scatter-operation wait timeout does not cancel the transfer and buffers must remain alive until completion [R44.15](references.md), ScatterTransferOperation.waitFor. This concrete interface condition illustrates why logical cancellation and physical reclamation are distinct.

[MATHEMATICALLY-DERIVED] Model parameter count is unchanged by request preemption; expert replication is a separate §44.5 intervention. Migration temporarily duplicates KV and adds network/HBM traffic. Recomputation repeats prefix FLOPs and weight reads. Swap consumes host capacity and bidirectional bandwidth. Lower frequency can extend byte-seconds of resident state. Energy and money must charge failed, cancelled, recomputed, and transition work rather than divide only successful output tokens by active-kernel time.

## Experimental design

### Reported experiments

[PAPER-REPORTED] FastServe's OPT-13B ablation uses FP16 on one A100-40GB, ShareGPT lengths with input/output ratio varied, and FCFS/fixed-priority/naive-MLFQ controls. Figure 14 favors skip-join; Figure 15 finds recovery strategies similar at low load [R44.6](references.md), §§6.1,6.3. The historical vLLM comparator is v0.1.7; normalized complete-request latency is not a visible-token-gap metric.

[PAPER-REPORTED] Llumnix tests 10,000-request Poisson/Gamma traces, real ShareGPT/BurstGPT lengths and synthetic power-law tails, with common vLLM backends; its migration microbenchmark is separate from serving tests [R44.5](references.md), §§6.1–6.3.

| Evidence/context | Llumnix | Mooncake rejection | BiScale |
|---|---|---|---|
| [PAPER-REPORTED] Hardware/model | 16 A10 GPUs; LLaMA-7B/30B, 16-bit | 8 prefill + 8 decode instances; eight A800-80GB/node, RDMA up to 800 Gbps; dummy LLaMA2-70B-shaped model | 16 H100 GPUs; Llama-3.3-70B |
| [PAPER-REPORTED] Workload/concurrency | Poisson/Gamma arrivals, variable lengths; migration holds 8k total tokens/batch | 23,000 trace requests replayed 2×; trace mean input/output 7955/194 tokens | ShareGPT lengths; Gamma/ Azure-timestamp arrivals, varied rates |
| [PAPER-REPORTED] Runtime/boundary | Archival vLLM; mean/p99 latency, copy downtime | Archival Mooncake/vLLM; rejection counts, not quality | vLLM-based prototype; GPU energy, P99 TTFT and request-mean TPOT |
| [PAPER-REPORTED] Result | Migration downtime roughly 20–30 ms in its microbenchmark | Rejections 4183 / 3771 / 3589 for baseline / early / predictive | Evaluated at 67%/85% of its measured capacity; isolated steady-state windows |
| [NOT-DISCLOSED] Additional context | Exact serving commit absent | Dummy-weight precision and per-iteration concurrency not specified in quoted protocol | Precision not stated in inspected §6.1 |
| [PAPER-REPORTED] BiScale targets | — | — | TTFT 600 ms; request-mean TPOT 100 ms |
| [NOT-DISCLOSED] Uncertainty | No interval for quoted downtime range | No seed interval for rejection counts | No full transition-inclusive result |

[PAPER-REPORTED] In an under-provisioned decode window, BiScale consumes more energy than PlaceOnly while protecting the TPOT target; the cheaper fixed-frequency comparator violates that target [R44.8](references.md), §6.3.2. This is a constrained-service tradeoff, not an energy win in every window.

[PAPER-REPORTED] BiScale uses isolated five-minute windows and excludes configuration-transition overhead and session ramp regions [R44.8](references.md), §§4.6,6.1–6.2. Those exclusions prevent treating the study as proof of uninterrupted online reconfiguration.

## Observations

**What the paper claims.** [PAPER-REPORTED] The sources report benefits from preemption-aware scheduling, live placement repair, early rejection, and phase-aware energy control within their respective evaluation boundaries [R44.3](references.md); [R44.5](references.md); [R44.6](references.md); [R44.8](references.md).

**What the evidence shows.** [DERIVED] The migration microbenchmark isolates copying downtime, the rejection experiment counts avoided infeasible work, and BiScale measures steady-state control. They do not jointly validate one production controller or establish that their benefits add. FastServe's policy comparison uses historical OPT/ShareGPT/Alpaca traces and cannot rank current engine defaults.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 44.27 gives the contraction condition behind short migration pauses; Eq. 44.26 prevents accepted-only denominator inflation; Eq. 44.30 specifies when steady-state energy savings survive transitions.

**What remains unknown.** [UNVERIFIED] Common-budget evidence is missing for a controller that combines accurate long-tail prediction, per-tenant fairness, migration, cancellation, and energy control under correlated bursts and failures.

## Failure modes

> **Failure mode — Recompute cascade.** [DERIVED] *Symptom:* more preemptions increase the queue, which triggers further preemptions. *Cause:* overload recovery creates substantial repeated work. *Detection:* useful-token/recomputed-token ratio and repeated victim IDs. *Mitigation:* bound admitted state, rate-limit recovery, and reject before unproductive execution.

> **Failure mode — Cancellation resurrection.** [DERIVED] *Symptom:* a cancelled request emits tokens or reacquires blocks. *Cause:* delayed migration/queue messages use an old epoch. *Detection:* terminal-state/event trace. *Mitigation:* fence epochs and make terminal publication idempotent.

## Siblings

[DERIVED] **Feedback priority** changes who runs; **preemption** changes residency and recovery; **migration** changes the owner; **early rejection** changes admitted population; **frequency control** changes execution rate and power. Each affects a different state transition. A service class with lower queue priority is not automatically isolated from execution interference; protected headroom is a separate decision.

```figure
{
  "id": "fig-44.20",
  "kind": "compare",
  "title": "Adaptation actions and accounting",
  "caption": "An action can improve one population while exporting cost elsewhere. Offered goodput and full recovery/transition costs preserve that distinction.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.26",
  "alt": "An action can improve one population while exporting cost elsewhere. Offered goodput and full recovery/transition costs preserve that distinction. Values and structures are analytical; no measured model performance is shown.",
  "spec": {
    "axis": "State transition and principal added cost",
    "columns": [
      {
        "id": "priority",
        "label": "Priority"
      },
      {
        "id": "preempt",
        "label": "Preempt"
      },
      {
        "id": "migrate",
        "label": "Migrate"
      },
      {
        "id": "reject",
        "label": "Reject"
      },
      {
        "id": "dvfs",
        "label": "Frequency"
      }
    ],
    "rows": [
      {
        "dimension": "Changed state",
        "values": {
          "priority": "run order",
          "preempt": "residency",
          "migrate": "owner",
          "reject": "admitted population",
          "dvfs": "execution rate"
        }
      },
      {
        "dimension": "Cost to retain",
        "values": {
          "priority": "lower-class waiting",
          "preempt": "recompute or swap",
          "migrate": "copy and duplicate state",
          "reject": "lost offered work",
          "dvfs": "transition and residency"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The historical line from FastServe to Llumnix expands the control space from within-instance service order to live inter-instance placement. Mooncake moves rejection ahead of wasted phase work. The 2026 BiScale study adds phase-specific energy optimization, while MFS adds network-stage urgency [R44.7](references.md). Their unresolved intersection is controller composition under real transition and failure costs; the inspected evidence does not resolve it.

## Limitations

> **Open question.** [DERIVED] Can an adaptive policy improve offered-population goodput without exporting worse tails to low-priority or low-cache tenants? · *what evidence would settle it:* joint class-conditioned service/loss accounting over burst and long-tail traces, with identical admission budgets and explicit bounds on starvation and repeated recovery.

[DERIVED] Queueing guarantees require assumptions about offered work, not just arrival count. Neither a finite sample's SLO success nor an ILP's feasibility establishes a worst-case guarantee. Load predictors and latency/power models are learned or profiled components with distribution shift, and safety margins consume resources that should be charged.

## Reproducibility

[DERIVED] Retain offered/accepted/rejected/cancelled populations, output timestamps, estimator inputs/errors, priority promotions, copy stages, repeated preemptions, terminal epochs, power boundary, startup/drain, and transition work. State whether average TPOT precedes or follows percentile aggregation. Preserve source-defined dummy-model and simulation boundaries; no private model inference or book-executed result is claimed.

## References

[DERIVED] [R44.3](references.md) §§6–7, Table 2; [R44.5](references.md) §§4,6; [R44.6](references.md) §§4,6; [R44.7](references.md) §§3–6; [R44.8](references.md) §§4–6; [R44.9](references.md) preemption; [R44.15](references.md) waitFor buffer lifetime.
