---
id: ms.section.63.5
entity_type: section
title: "Performance/quality coupling"
volume: 3
part: 11
chapter: 63
section: 63.5
slug: 63-5-performance-quality-coupling
parent: ms.chapter.63
prev_sibling: ms.section.63.4
next_sibling: ms.section.63.6
children: []
prerequisites: [ms.chapter.6, ms.chapter.62]
downstream: [ms.chapter.65, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [evaluation], mechanism: [evaluation_validity], feedback_setting: [], modality: [text, image, audio, video]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 63.5 Performance/quality coupling

## Scope

[DERIVED] A reliability improvement is useful only under an explicit performance boundary. Longer outputs, more search branches, retries and stronger judges can change both quality and resource demand. This section defines cost per completed valid task, user-facing latency, retry specialization and shared-state/cache effects. The system ledger combines [Chapter 48](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md) economics, [Chapter 42](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md) inference resources and [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md) judgment cost. Its artifact is a joint quality/latency/cost frontier on the same offered tasks.

## Why this exists

[DERIVED] Tokens per second, mean model-call latency and benchmark success alone can improve while the user receives fewer valid completions before a deadline. A retry increases offered work; a verifier consumes calls; a longer context changes prefill and KV state; a tool wait changes critical paths. Comparing cost only among successful episodes deletes expensive failures. Comparing latency only among returned answers hides timeouts and overload. Keep every offered episode and charge its descendants, including invalid outputs and failed validation.

## Intuition

[DERIVED] A retry policy resembles a truncated geometric process only when attempts are independent, have the same success probability and cost, stop on recognized success, and do not modify future feasibility. Real agent retries often violate all four premises. The simplified calculation is useful as an accounting control: under those assumptions retrying raises completion probability but does not improve expected spend per valid completion. Any claimed efficiency gain must then come from changed attempt cost, success probability, selection or a different constraint.

## Formulation

[MATHEMATICALLY-DERIVED] For independent attempts with $0<p\le1$, at most $k\ge1$ attempts, per-attempt cost $c_a\ge0$ and a perfect success recognizer,

$$
P_k=1-(1-p)^k,\qquad \mathbb E[A_k]=\sum_{j=0}^{k-1}(1-p)^j=\frac{P_k}{p},\qquad \mathbb E[C_k]=c_a\frac{P_k}{p},\qquad \frac{\mathbb E[C_k]}{P_k}=\frac{c_a}{p}.
$$
*(Eq. 63.13)*

[DERIVED] The last ratio is expected total spend divided by expected valid completions across many offered tasks, not the mean of a random per-task ratio. It omits setup, selector mistakes, changing contexts, tool charges, side effects and deadline loss; add those explicitly when present. Calculator domains keep $p>0$; $p=0$ has zero success and undefined spend per successful task.

[MATHEMATICALLY-DERIVED] For a realized acyclic dependency graph with measured node service durations $d_v\ge0$, an unlimited-resource lower bound and observed end-to-end latency are

$$
T_{\rm crit}=\max_{\mathcal P\ \mathrm{path}}\sum_{v\in\mathcal P}d_v,\qquad T_{\rm user}=t_{\rm terminal}-t_{\rm admission}\ge T_{\rm crit}.
$$
*(Eq. 63.14)*

[DERIVED] The inequality assumes the graph includes work within the measured boundary and valid durations; scheduling, queueing, network gaps and cleanup can add time. Cyclic workflows must be unrolled into a finite realized event graph. Maximum individual span duration equals neither the critical path in general nor the full elapsed time.

$$
\widehat q_D=\frac{\sum_{j=1}^{N}Y_j\mathbf1\{T_j\le D_j\}}{N},\quad \widehat c_{\rm valid}=\frac{\sum_{j=1}^{N}C_j}{\sum_{j=1}^{N}Y_j\mathbf1\{T_j\le D_j\}},\quad \widehat g_D=\frac{\sum_{j=1}^{N}Y_j\mathbf1\{T_j\le D_j\}}{T_{\rm campaign}}.
$$
*(Eq. 63.15)*

[DERIVED] Here $N\ge1$, $D_j$ is the offered deadline, $Y_j$ includes task/policy/integrity gates, and $T_{\rm campaign}>0$ is a declared wall-clock window. Cost per valid completion is undefined when no valid task completes. Goodput uses the whole campaign boundary; task throughput and token throughput have different units. Terminal failures still have measured cost and terminal time.

```figure
{
  "id": "fig-63.15",
  "kind": "calculator",
  "title": "Retries buy completion under a strict model",
  "caption": "Eq. 63.13 assumes identical independent attempts, constant cost, perfect success recognition and no side effects/deadline loss. The ratio is total expected spend per expected valid completion.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-63.13",
  "alt": "Eq. 63.13 assumes identical independent attempts, constant cost, perfect success recognition and no side effects/deadline loss. The ratio is total expected spend per expected valid completion.",
  "spec": {
    "tex": "P_k=1-(1-p)^k,\\quad E[A_k]=P_k/p,\\quad c_{\\rm valid}=c_a/p",
    "equation": "63.13",
    "inputs": [
      {
        "symbol": "p",
        "label": "Independent attempt success",
        "default": 0.5,
        "min": 0.01,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "k",
        "label": "Maximum attempts",
        "default": 3,
        "min": 1,
        "max": 20,
        "format": "integer"
      },
      {
        "symbol": "cost",
        "label": "Constant cost per attempt",
        "default": 1,
        "min": 0,
        "max": 20,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "success",
        "label": "Completion probability",
        "formula": "1-(1-p)^k",
        "format": "percent"
      },
      {
        "symbol": "attempts",
        "label": "Expected attempts",
        "formula": "(1-(1-p)^k)/p",
        "format": "raw"
      },
      {
        "symbol": "spend",
        "label": "Expected spend (cost units)",
        "formula": "cost*(1-(1-p)^k)/p",
        "format": "raw"
      },
      {
        "symbol": "pervalid",
        "label": "Spend per expected valid completion",
        "formula": "cost/p",
        "format": "raw"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Bounded retries",
      "variables": {
        "p": 0.5,
        "k": 3,
        "cost": 1
      },
      "note": "The simple model charges every attempted call.",
      "highlight": [
        "success",
        "spend"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "More permitted retries",
      "variables": {
        "p": 0.5,
        "k": 10,
        "cost": 1
      },
      "note": "Completion rises while expected spend per expected valid task stays fixed.",
      "highlight": [
        "success",
        "pervalid"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Systematic low success",
      "variables": {
        "p": 0.05,
        "k": 10,
        "cost": 1
      },
      "note": "A low p makes completion expensive even before side effects and deadlines.",
      "highlight": [
        "success",
        "pervalid"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Freeze a resource vector rather than declaring token equality to be compute equality. At minimum record input, cached-input, output and reasoning tokens when exposed; model calls, search branches, retrieved bytes/chunks, tool calls, CPU/GPU time where measurable, concurrency and all provider charges. State when quantities are not exposed. Different models, tokenizers, quantization, context lengths and serving kernels can spend different physical resources on the same token count.

[DERIVED] Sweep budget and concurrency while preserving the offered workload and acceptance predicates. Treat additional retries, search depth and judges as parts of the policy. For each setting report success, safe deadline success, latency distribution with censored/timeouts identified, resource demand and uncertainty. A Pareto improvement requires no worsening on the specified dimensions; a weighted score encodes preferences and can conceal a violated hard constraint.

[DERIVED] Cache hits need semantic and ownership conditions. Exact reuse requires identity of every state component that affects the reused computation, including model/adapter, tokenizer, prompt prefix, positional convention and relevant modality preprocessing. Approximate retrieval/semantic caching changes the output distribution and needs its own accuracy/staleness test. A warm prefix cache does not justify reusing a tool result after its policy or database epoch changes. Separate hot, cold and mixed-cache workloads with invalidation cost and memory pressure.

```figure
{
  "id": "fig-63.16",
  "kind": "diagram",
  "title": "One ledger for quality and resources",
  "caption": "Every branch, retry and verification call is charged to the offered task before terminal gates and deadline success are computed.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.15",
  "alt": "Every branch, retry and verification call is charged to the offered task before terminal gates and deadline success are computed.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Offered task + deadline"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Admission / queue"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Policy tree + tools"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Verification + durable state"
      },
      {
        "id": "n4",
        "kind": "state",
        "label": "Task / policy / integrity gates"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Deadline goodput + full cost"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2"
      },
      {
        "from": "n2",
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4"
      },
      {
        "from": "n4",
        "to": "n5"
      },
      {
        "from": "n1",
        "to": "n5",
        "label": "rejection retained"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 63.5 — Build a joint reliability/resource frontier.**

[DERIVED] **Inputs:** frozen offered tasks, finite policy/budget/concurrency grid, resource boundary and gate/deadline rules. **Outputs:** paired frontier with complete cost and failure accounting.

1. Register every offered episode and reserve budget for its full descendant tree. Specify cache state, concurrency, arrival process, cancellation and maximum retry/search expansion.
2. Randomize or block policy settings over matched tasks and fresh state. Use a load generator that records offered work even when admission rejects it.
3. Trace task admission, queues, model/tool spans, branches, retries, verification, durable effects and terminal outcome. Charge all attempts and failed branches to the parent task.
4. Apply unchanged gate/deadline predicates and compute Eq. 63.15. Retain zero-success settings as undefined cost-per-valid rather than dropping them.
5. Estimate paired uncertainty at the independent task/load-block level. Identify feasible nondominated settings only after applying hard constraints.
6. Confirm the chosen policy on a separate held-out workload and stop the finite sweep. Record deployment shifts that invalidate its cache, workload or resource assumptions.

[DERIVED] With $J$ grid settings and $N$ tasks, experiment work scales with the total *realized* policy calls, not just $JN$. A depth-$d$ full search of branching factor $b>1$ has $(b^{d+1}-1)/(b-1)$ nodes before pruning. Bounded budgets and cancellation keep the experiment finite; unbounded retries invalidate the planned resource model.

## Implementation

[DERIVED] Join telemetry by parent task ID, attempt ID, branch ID and environment epoch. Synchronize resource accounting without assuming clocks from unrelated services are comparable; use monotonic local durations and calibrated trace timing where needed. Store price schedules separately from usage so economic calculations can be updated without rewriting measured token/call counts. Include setup and warmup in the user boundary when the user actually pays or waits for them, otherwise disclose the excluded boundary.

[DERIVED] Overload changes policy behavior: tool/model timeouts trigger retries, retries increase load, and queueing delays can make otherwise correct answers miss their deadline. Admission control, retry budgets and backoff therefore belong in the quality experiment. Batching may improve accelerator throughput while delaying individual responses. Report offered arrival rate, accepted rate and rejection outcome, not only completed service rate. Streaming systems also need first-useful output and committed task completion; low first-token latency alone does not imply an early correct action.

## Experimental design

[ASSUMED] Use the same offered task roster to compare one attempt, bounded retries, deeper retrieval/search and additional validation under matched money and deadline constraints. Measure both warm and cold cache conditions and a realistic mixed sequence with invalidation. Include increasing load until a prespecified guard trips. Use separate development and confirmation workloads; report the chosen policy's selection cost. Experiment 63.3 proposes this study without benchmark or serving execution.

## Observations

**What the paper claims.** [PAPER-REPORTED] $\tau^{\tau}$-Bench scores constructed agents on held-out simulated users under model and serving-budget restrictions [R63.6, §§3–4].

**What the evidence shows.** [PAPER-REPORTED] Each configuration has one construction trial per task; the 53-task overall average weights 35 banking tasks. Its expert reference uses privileged ground truth [R63.6, Table 2, §7 limitations].

**What we infer.** [DERIVED] Build cost, serving cost and user-task success require separate ledgers. A privileged reference is not average human performance.

**What remains unknown.** [NOT-DISCLOSED] The study does not characterize repeated-build variance or authorize a production cost/reliability guarantee.

[DERIVED] Source context for the above comparison:

| Field | $\tau^{\tau}$-Bench inspected v1 context |
|---|---|
| Hardware | Construction container: 2 vCPUs, 4 GB, no local GPU; remote inference hardware NOT-DISCLOSED |
| Precision | Remote model precision NOT-DISCLOSED |
| Sequence/workload | 53 tasks, four domains; one construction per configuration/task |
| Input/output | Multimodal business artifacts, client interaction, submitted agent and held-out user simulations; lengths vary |
| Concurrency | Cross-task model-serving concurrency NOT-DISCLOSED |
| Runtime | Headless vendor/open harnesses; pinned construction image; eight-hour build limit |
| Boundary | Construction spend/time separated from mean serving credits and penalized reward |
| Comparability | Different model/harness combinations; oracle reference has ground-truth access; no controlled hardware-latency comparison |

## Failure modes

> **Failure mode — Cheap successes after expensive failures disappear.** [DERIVED] *Symptom:* cost per task is reported using only successful episodes while retries, timeouts and validator calls are omitted. *Cause:* resource and outcome ledgers use different denominators. *Detection:* reconcile all descendant usage to every offered task and compare totals with provider/service records. *Mitigation:* charge complete task trees, report offered-task and valid-completion metrics together, and preserve zero-success settings.

[MATHEMATICALLY-DERIVED] In Eq. 63.13, increasing $k$ from one to ten can sharply improve $P_k$ while leaving $c_a/p$ unchanged. Under a hard deadline, extra attempts can even lower deadline success through queueing or late completion. A cache hit that returns an obsolete account state can improve latency while failing integrity; it is not a valid Pareto gain.

```figure
{
  "id": "fig-63.17",
  "kind": "compare",
  "title": "Reuse identity determines the claim",
  "caption": "Exact computational reuse and approximate answer reuse require different validation; warm-cache speed is meaningful only with valid identity and freshness.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.15",
  "alt": "Exact computational reuse and approximate answer reuse require different validation; warm-cache speed is meaningful only with valid identity and freshness.",
  "spec": {
    "axis": "Cache contract",
    "columns": [
      {
        "id": "a",
        "label": "Exact computation reuse"
      },
      {
        "id": "b",
        "label": "Approximate semantic reuse"
      }
    ],
    "rows": [
      {
        "dimension": "Required match",
        "values": {
          "a": "All computation-affecting state",
          "b": "Qualified semantic/answer predicate"
        }
      },
      {
        "dimension": "Risk",
        "values": {
          "a": "Identity or ownership mismatch",
          "b": "Staleness and changed answer distribution"
        }
      },
      {
        "dimension": "Evaluation",
        "values": {
          "a": "Correctness + memory/latency",
          "b": "Quality/freshness + memory/latency"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Choose more search/retries when marginal valid completion value exceeds added resource, delay and side-effect risk under the actual workload. Choose abstention/escalation when the next attempt is unaffordable, late or unsafe. Reverse a bigger-budget policy when gains vanish on held-out tasks, overload erases deadline goodput or repeated effects violate invariants. Reverse an aggressive cache when freshness/identity failures exceed its qualified error budget.

## Extensions

[DERIVED] Add task-conditional budgets, early stopping and confidence-aware routing only with independent validation of the decision signal and full selection accounting. A speculative branch can reduce latency if its work is safely disposable; a speculative external write cannot be treated like a discarded token branch. Apply [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md) selective-risk conditions to any accepted-output gate and recheck under the induced workload shift.

## Limitations

[DERIVED] List-price dollars are not stable physical compute units. Hosted providers can hide reasoning tokens, hardware and scheduling. A finite workload frontier does not establish optimality across all policies. Aggregate cost-per-valid can be dominated by task mix and does not replace per-stratum reporting. The geometric instrument is intentionally a simplified control, not a fitted retry model.

## Reproducibility

[DERIVED] Release the offered workload/arrival trace, policy grid, budget/pricing version, cache identity/invalidation rules, parent-child usage ledger, timing boundary, all terminal outcomes and Pareto/selection code when implemented. Explicitly mark hidden hardware/precision/concurrency fields. No source serving stack or task-construction agent was executed for this chapter.

## References

[R63.6] Shi et al., inspected v1 (2026-09-04), §§3.1–3.2 and 4, Table 2 and §7 limitations. The context table scopes the cited protocol; no claimed latency or model-ranking replication is made.
