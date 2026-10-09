---
id: "ms.section.38.1"
entity_type: "section"
title: "Computation dimensions"
short_title: "Computation dimensions"
volume: 2
part: 7
chapter: 38
section: 38.1
slug: "38-1-computation-dimensions"
parent: "ms.chapter.38"
prev_sibling: null
next_sibling: "ms.section.38.2"
children: []
prerequisites: ["ms.chapter.6", "ms.chapter.32", "ms.chapter.35", "ms.chapter.37"]
downstream: ["ms.chapter.39", "ms.chapter.47", "ms.chapter.61", "ms.chapter.63", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["inference", "evaluation", "assurance"], "mechanism": ["search", "verification", "adaptive_compute"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2300
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 38.1 — Computation dimensions

## Scope

[DERIVED] Inference-time computation is a policy for spending resources after a task arrives while the learned model weights remain fixed. The policy may lengthen one trajectory, sample alternatives, inspect evidence, execute tools, call a verifier or search over partial states. These operations change different conditional distributions and consume different resources. This section defines their common accounting interface; subsequent sections derive aggregation, search, stopping and representation-specific procedures. The chapter artifact is a quality-versus-inference-budget frontier whose points retain their complete execution boundary, including unsuccessful and cancelled work.

[DERIVED] Weight updates, test-time training and persistent adaptation are separate interventions. A search controller may learn its routing rule offline, but its deployment action remains an inference decision. A tool can mutate external state even when model weights are frozen. Therefore a frozen checkpoint alone does not establish a stationary task environment or a reproducible execution.

## Why this exists

[DERIVED] “More thinking” is not a unit of computation. Ten short candidates can consume fewer generated tokens than one long response while requiring more prefills and verification. A retrieval call can return information unavailable to any amount of closed-book sampling. Parallel execution can shorten a critical path while increasing aggregate accelerator work. A stronger verifier can improve selection while making every candidate more expensive. Comparing only the visible answer length hides these differences and can reverse the apparent efficiency ordering.

[DERIVED] The engineering decision is consequently a constrained experiment: specify which information and operations each policy may use, measure the resources actually consumed, then compare quality under a declared constraint. A budget expressed in generated tokens is useful, but it is not automatically a fixed FLOP, elapsed-time, monetary or energy budget. The conversion depends on model size, context length, batch shape, hardware, cache reuse, precision and serving load.

## Intuition

[DERIVED] Represent an inference run as a directed acyclic graph of completed operations, with additional edges for information dependencies and resource reservations. A serial reasoning chain contributes a long dependency path. Independent candidate sampling contributes width. Retrieval and tools contribute new observations. Verification contributes selection evidence. Search combines these dimensions by deciding which operation to execute next from the accumulated state. The graph explains why two runs with equal operation counts can have different latency and different statistical behavior.

[DERIVED] The candidate generator and the controller must remain distinct identities. Changing a temperature changes the generator distribution. Changing when generation is stopped changes the observed trajectory distribution. Changing which candidates are retained changes the selection distribution. When all three change together, an improved final answer cannot be attributed to longer deliberation alone.


```figure
{
  "id": "fig-38.1",
  "kind": "diagram",
  "title": "Inference has depth, width and evidence",
  "caption": "Generation, tools and verification feed a controller through distinct observations; the ledger retains every operation.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.0",
  "alt": "Generation, tools and verification feed a controller through distinct observations; the ledger retains every operation. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "state",
        "label": "Task + contract"
      },
      {
        "id": "n1",
        "kind": "branch",
        "label": "Controller"
      },
      {
        "id": "n2",
        "kind": "model",
        "label": "Serial / candidates"
      },
      {
        "id": "n3",
        "kind": "dependency",
        "label": "Retrieval / tools"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Verifier"
      },
      {
        "id": "n5",
        "kind": "memory",
        "label": "Operation ledger"
      },
      {
        "id": "n6",
        "kind": "metric",
        "label": "Answer + cost"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2",
        "label": "generate"
      },
      {
        "from": "n1",
        "to": "n3",
        "label": "observe"
      },
      {
        "from": "n2",
        "to": "n4",
        "label": "check"
      },
      {
        "from": "n3",
        "to": "n1",
        "label": "feedback"
      },
      {
        "from": "n4",
        "to": "n1",
        "label": "score"
      },
      {
        "from": "n2",
        "to": "n5"
      },
      {
        "from": "n3",
        "to": "n5"
      },
      {
        "from": "n4",
        "to": "n5"
      },
      {
        "from": "n5",
        "to": "n6",
        "label": "frozen select"
      }
    ]
  }
}
```


## Formulation

> **Definition — Inference policy.** A bounded controller that maps the currently authorized task state and execution history to the next generation, evidence, checking, search or termination action, without an unrecorded change to the declared model and environment identities.

[DERIVED] Let the immutable run contract be

$$
\mathcal E=(x,v_\pi,v_{\rm tok},v_{\rm dec},v_V,v_{\rm tool},D_{\rm access},\mu,\mathcal B,\mathcal M).
$$
*(Eq. 38.0)*

Here $x$ is the task; $v$ identify model, tokenizer, decoding processors, verifier and tools; $D_{\rm access}$ defines accessible evidence; $\mu$ is the controller; $\mathcal B$ specifies resource ceilings; and $\mathcal M$ fixes evaluation and selection. A complete attempt ledger is part of this identity, rather than an optional debugging product.

[MATHEMATICALLY-DERIVED] For operations $j$ in the attempted run, record a resource vector

$$
\mathbf C=\sum_j(T^{\rm prefill}_j,T^{\rm gen}_j,F_j,W^{\rm acc}_j,N^{\rm tool}_j,N^V_j,\$_j),\qquad
L=t_{\rm return}-t_{\rm arrival}.
$$
*(Eq. 38.1)*

Token counts, FLOPs, accelerator-seconds, tool calls, verifier calls and currency are distinct coordinates. $L$ includes queueing, dispatch, retries, synchronization and final answer delivery. A component can be unavailable, in which case its field is NOT-DISCLOSED rather than reconstructed from an unrelated token count.

[MATHEMATICALLY-DERIVED] With operation durations $d_j\ge0$, total work $W=\sum_jd_j$, critical-path span $S=\max_{p\in\mathcal P}\sum_{j\in p}d_j$, and $m$ identical non-overlapping workers, any ideal schedule satisfies

$$
L_{\rm exec}\ge\max(S,W/m),\qquad
W_{\rm stage}=d_0+\sum_i d_i,\quad S_{\rm stage}=d_0+\max_i d_i.
$$
*(Eq. 38.2)*

The last two identities describe a coordinator followed by independent branches with no additional join work. They are an analytical model, not a latency predictor for an LLM service. Add join, communication and resource-contention costs when present.


```figure
{
  "id": "fig-38.2",
  "kind": "calculator",
  "title": "Work and critical path differ",
  "caption": "Eq.38.2 compares one coordinator and three independent branches of declared duration. Join and communication are zero in this analytical construction.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.2",
  "alt": "Eq.38.2 compares one coordinator and three independent branches of declared duration. Join and communication are zero in this analytical construction. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "38.2",
    "tex": "W=d_0+a+b+c,\\ S=d_0+\\max(a,b,c)",
    "inputs": [
      {
        "symbol": "d0",
        "label": "Coordinator duration",
        "default": 1,
        "min": 0.1,
        "max": 5,
        "format": "fixed3"
      },
      {
        "symbol": "a",
        "label": "Branch A duration",
        "default": 3,
        "min": 0.1,
        "max": 10,
        "format": "fixed3"
      },
      {
        "symbol": "b",
        "label": "Branch B duration",
        "default": 5,
        "min": 0.1,
        "max": 10,
        "format": "fixed3"
      },
      {
        "symbol": "c",
        "label": "Branch C duration",
        "default": 2,
        "min": 0.1,
        "max": 10,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "work",
        "label": "Total work",
        "formula": "d0+a+b+c",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "span",
        "label": "Critical path",
        "formula": "d0+max(a,b,c)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "ratio",
        "label": "Ideal serial/span ratio",
        "formula": "(d0+a+b+c)/(d0+max(a,b,c))",
        "format": "fixed3",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Unequal branches",
      "variables": {
        "a": 3,
        "b": 5,
        "c": 2
      }
    },
    {
      "anchor": "mechanism",
      "label": "Balanced branches",
      "variables": {
        "a": 5,
        "b": 5,
        "c": 5
      }
    },
    {
      "anchor": "failure-modes",
      "label": "One long branch",
      "variables": {
        "a": 1,
        "b": 10,
        "c": 1
      }
    }
  ]
}
```


## Mechanism

### Methodology

[DERIVED] **Serial deliberation** appends state to one autoregressive trajectory. Its next action is conditioned on earlier sampled tokens, so errors can persist and later computation is not an independent retry. A maximum output cap censors trajectories; it does not implement an uncertainty-optimal stopping rule. A reasoning-effort setting is a control surface whose internal scheduling semantics remain unknown unless disclosed.

[DERIVED] **Parallel candidates** repeat a declared generator from the same task context. Fresh random seeds can establish conditional independence for an ideal sampler, while common task ambiguity, shared weights or shared retrieved evidence still induce correlated outcomes when results are pooled over tasks. Reusing the same prefix cache preserves distribution only when cache identity includes the same tokens, positions, masks and model state. Prefix reuse changes execution cost, not the formal need to define the sampling law.

[DERIVED] **Retrieval and tools** change available information. A search query has a timestamped index, ranking policy and returned document set. A code execution has fixtures, runtime, permissions and a result status. The controller can use these observations to revise its answer or its search state. Information gain is not guaranteed: irrelevant documents can distract a model, stale pages can mislead it, and a tool result can be malformed or adversarial. Count unsuccessful calls, query reformulations and evidence parsing.

[DERIVED] **Verifier calls** estimate or check a candidate property. A learned score, a test-suite verdict and a formal proof-kernel result have different validity contracts. Calling one twice with identical input does not create two independent pieces of evidence. **External search** combines generation and checking over a retained frontier. It must declare expansion, scoring, pruning and return rules; the tree picture alone does not specify an algorithm.


```figure
{
  "id": "fig-38.3",
  "kind": "compare",
  "title": "Operations change different objects",
  "caption": "The comparison keeps state extension, new information and selection evidence distinct.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.0",
  "alt": "The comparison keeps state extension, new information and selection evidence distinct. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Serial text"
      },
      {
        "id": "n1",
        "label": "External tools"
      },
      {
        "id": "n2",
        "label": "Verification"
      }
    ],
    "rows": [
      {
        "dimension": "Adds",
        "values": {
          "n0": "Conditioned tokens",
          "n1": "Environment observation",
          "n2": "Candidate property"
        }
      },
      {
        "dimension": "Cost",
        "values": {
          "n0": "Prefill + decode",
          "n1": "Call + execution",
          "n2": "Scoring / checking"
        }
      },
      {
        "dimension": "Main validity gap",
        "values": {
          "n0": "Error persistence",
          "n1": "Evidence authenticity",
          "n2": "Proxy correctness"
        }
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] A hard resource ceiling requires admission before execution. If $c_t$ is consumed work, $r_t$ outstanding reservations, $u(a)$ a valid upper allowance for action $a$, and $B$ the ceiling, admit only when

$$
c_t+r_t+u(a)\le B;\qquad
(c_{t+1},r_{t+1})=(c_t+c(a),r_t-u(a)),\quad0\le c(a)\le u(a).
$$
*(Eq. 38.3)*

Resource vectors use coordinatewise inequalities. Reserving a token cap does not reserve an unbounded external tool. Every action needs an enforceable allowance or a separately declared soft-budget status. Refund unused reservation only after completion or acknowledged cancellation.

## Algorithm

**Algorithm 38.1 — Bounded inference controller with immutable operation accounting.** Inputs are Eq.38.0, nonnegative integer action cap $K$, vector ceiling $\mathbf B$, nonnegative executable per-action bounds $\mathbf u$, finite enforceable action deadlines, and an authorized action function. Numerical budget coordinates admit only measured nonnegative actual costs $\mathbf d\le\mathbf u$; unknown physical costs stay ledger metadata and do not enter budget arithmetic. Outputs are an answer or ABSTAIN and the complete ledger. State contains history $H$, candidate set $Y$, consumed vector $\mathbf c$ and outstanding reservations $\mathbf r$.

$$
\begin{aligned}
1.\;&t\gets0;\ H\gets\varnothing;\ Y\gets\varnothing;\ \mathbf c,\mathbf r\gets\mathbf0.\\
2.\;&\textbf{while }t<K:\ a\gets\mu(x,H,Y);\quad
 a=\mathrm{STOP}\Rightarrow\textbf{break}.\\
3.\;&\neg\mathrm{Authorized}(a,D_{\rm access},v_{\rm tool},\mathrm{schema})\ \text{or }\mathbf u(a)\text{ unenforceable}
 \Rightarrow H\gets H\cup\{\mathrm{DENIED}(t,a)\};\ t\gets t+1;\ \textbf{continue}.\\
4.\;&\mathbf c+\mathbf r+\mathbf u(a)\nleq\mathbf B\Rightarrow\textbf{break};\quad
 \mathbf r\gets\mathbf r+\mathbf u(a);\ \iota\gets\mathrm{UniqueID}(t,a).\\
5.\;&(o,z,\mathbf d)\gets\mathrm{ExecuteCapped}(\iota,a,\mathbf u(a));\quad
 \mathbf c\gets\mathbf c+\mathbf d;\ \mathbf r\gets\mathbf r-\mathbf u(a).\\
6.\;&H\gets H\cup\{(\iota,a,o,z,\mathbf d,v)\};\quad
 z=\mathrm{COMPLETE}\land\mathrm{ValidCandidate}(o)\Rightarrow Y\gets Y\cup\{(\iota,o)\}.\\
7.\;&z\in\{\mathrm{ERROR},\mathrm{TIMEOUT},\mathrm{CANCELLED}\}\Rightarrow
 \mathrm{RetainPartial}(H,\iota).\\
8.\;&t\gets t+1\quad\text{for every executed outcome}.\\
9.\;&Y=\varnothing\Rightarrow\textbf{return }(\mathrm{ABSTAIN},H,\mathbf c);\quad
 \textbf{return }(\mathrm{SelectFrozen}(Y,H),H,\mathbf c).
\end{aligned}
$$

[DERIVED] Execution is synchronous here; an asynchronous extension retains reservations until acknowledgement and is developed in §38.3. Step8 selection is a local frozen computation whose allowance is included in the run contract. If selection needs another model call, it is an ordinary admitted action before STOP. Termination follows finite $K$ and enforced action deadlines. The conservation invariant is that every started operation has exactly one terminal record and its consumed work remains charged.

## Implementation

[DERIVED] Build operation records around occurrence IDs, parent IDs and versioned inputs. Two identical textual queries are two billable occurrences even when a cache serves one of them. Record cache hits separately from avoided model work. Distinguish a failed generation, a completed invalid candidate and an evaluator unable to decide. An unknown verdict remains unknown; neither answer selection nor cost reporting may silently erase it.

[DERIVED] Tool execution also needs effect semantics. Retrying a read-only search differs from repeating a payment or repository mutation. The inference ledger should reference an idempotency key or an externally observed effect identity where applicable. Search over hypothetical branches must not perform irreversible real-world actions merely to estimate their value. This is an environment boundary, not a modification to the language-model probability equation.


```figure
{
  "id": "fig-38.4",
  "kind": "memory-stack",
  "title": "Reservation occupancy against one hard ceiling",
  "caption": "Eq.38.3:60 consumed units plus20 outstanding units leave20 reservable units in this100-unit analytical coordinate. A30-unit next proposal crosses the ceiling; resource units are never mixed.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.3",
  "alt": "A stacked reservation bar contains consumed60, outstanding20 and proposed20 units against capacity100. In the failure state proposed work30 makes the stack110, so admission must be denied. All values are analytical.",
  "spec": {
    "format": "integer",
    "variables": {
      "B": 100,
      "c": 60,
      "r": 20,
      "u": 20
    },
    "bars": [
      {
        "label": "Current and proposed occupancy",
        "segments": [
          {
            "label": "Consumed",
            "formula": "c",
            "kind": "process"
          },
          {
            "label": "Outstanding reservations",
            "formula": "r",
            "kind": "memory"
          },
          {
            "label": "Proposed allowance",
            "formula": "u",
            "kind": "dependency"
          }
        ]
      }
    ],
    "budget": {
      "label": "Declared hard ceiling",
      "formula": "B"
    }
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Before a new proposal",
      "variables": {
        "u": 0
      },
      "note": "Consumed plus reserved occupies80 of100 units."
    },
    {
      "anchor": "algorithm",
      "label": "Admissible proposal",
      "variables": {
        "u": 20
      },
      "note": "The sum reaches the ceiling."
    },
    {
      "anchor": "failure-modes",
      "label": "Deny before execution",
      "variables": {
        "u": 30
      },
      "note": "A110-unit occupancy cannot be admitted."
    }
  ]
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] Kimi K2.5 supplies a concrete parallel-agent protocol; its resource surrogate is critical steps, not aggregate compute. The bounded table records the disclosed study rather than proposing a new experiment. [R38.8](references.md)

| Protocol field | Inspected source disclosure |
|---|---|
| Method and model | PARL; trainable K2.5 orchestrator, frozen subagents; §3 |
| Workload | BrowseComp, WideSearch, internal Swarm benchmark; §5.2 |
| Environment | Web search/browser/code tools; create_subagent and assign_task; AppendixE.8 |
| Budget | BrowseComp orchestrator15 steps, each subagent100; WideSearch100/100; internal100/50 |
| Resource surrogate | Sum of main steps plus longest subagent branch per stage |
| Actual finding | BrowseComp78.4 versus single-agent60.6; Table6 |
| Reproducibility boundary | Matched total FLOPs, exact inference hardware/precision, confidence intervals and raw episode logs: NOT-DISCLOSED in cited comparison |

[DERIVED] These outcomes establish a reported system comparison. They do not isolate a pure concurrency effect from learned orchestration, task decomposition, context sharding or changed total work. A constrained stage-length surrogate is useful for controlling a study, but it cannot be relabeled a measured wall-clock or energy budget.

## Observations

**What the paper claims.** [PAPER-REPORTED] PARL learns when and how to create parallel subagents, with auxiliary instantiation/completion rewards annealed away. [R38.8](references.md)

**What the evidence shows.** [PAPER-REPORTED] The cited comparison reports improved search-task outcomes under its disclosed agent budgets; it does not provide a matched-total-compute causal isolation of parallelism. [R38.8](references.md)

**What we infer.** [DERIVED] Parallelism is an inference-policy choice whose value depends on independent useful subtasks and aggregation overhead. Its benefit must be read jointly with work and span.

**What remains unknown.** [NOT-DISCLOSED] The source does not establish this chapter's full per-operation cost vector or a transferable quality-versus-p99 frontier for arbitrary workloads.

## Failure modes

[DERIVED] More branches can amplify a shared false premise. More retrieval can reproduce one erroneous source through several mirrors. More verifier calls can spend the budget confirming an exploitable proxy. A shorter visible trace can conceal expensive prefills, latent modules or tool execution. Unacknowledged cancellation can temporarily exceed a concurrency cap even when the scheduler believes slots are free. These failures occur at different layers and should retain separate diagnostic fields.


```figure
{
  "id": "fig-38.5",
  "kind": "matrix",
  "title": "No coordinate substitutes for another",
  "caption": "Rows are token, verifier-call and latency constraints; columns are token, verifier-call and elapsed counters. Diagonal cells identify directly matched measurements.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.1",
  "alt": "Rows are token, verifier-call and latency constraints; columns are token, verifier-call and elapsed counters. Diagonal cells identify directly matched measurements. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "rows": 3,
    "cols": 3,
    "pattern": "explicit",
    "cells": [
      [
        1,
        0,
        0
      ],
      [
        0,
        1,
        0
      ],
      [
        0,
        0,
        1
      ]
    ],
    "rowLabel": "constraint: tokens / calls / latency",
    "colLabel": "counter: tokens / calls / elapsed",
    "legend": "Diagonal = direct accounting; off-diagonal conversion needs a measured model."
  }
}
```


## Siblings

[DERIVED] Chapter37 owns the actual processed decoding distribution and cache semantics. Chapter32 owns feedback validity; Chapter35 owns verifiable-reward optimization. Chapter36 owns rollout infrastructure and persistent environments. This chapter owns inference control over those mechanisms, with all model updates frozen during a reported run.

## Extensions

### Improvements

[DERIVED] Move from a scalar “thinking budget” to a resource vector with a declared optimization coordinate and hard constraints on the others. Use cheap preliminary observations only if their extraction cost is charged. Learn routing offline on a lineage-separated development set, then freeze both the router and its fallbacks before independent evaluation. Add deadline-aware cancellation that preserves partial work, rather than discarding the evidence of overlong attempts.


```figure
{
  "id": "fig-38.6",
  "kind": "chart",
  "title": "Parallel work lower bound",
  "caption": "Eq.38.2 assumes total work24 and critical span6 in abstract duration units. The curve uses integer worker counts. Each point is a legal integer worker count; no fractional-worker interpolation is asserted.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.2",
  "alt": "Eq.38.2 assumes total work24 and critical span6 in abstract duration units. The curve uses integer worker counts. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "worker count",
      "domain": [
        1,
        16
      ]
    },
    "y": {
      "label": "execution lower bound"
    },
    "series": [
      {
        "id": "n0",
        "label": "max(span, work/workers)",
        "formula": "max(6,24/x)",
        "sample": {
          "from": 1,
          "to": 16,
          "count": 16
        },
        "emphasis": true
      }
    ]
  }
}
```


## Limitations

[DERIVED] Work/span bounds ignore heterogeneous accelerators, batching interference and external-service variation. The operation graph is a measurement abstraction, not a claim about undocumented provider internals. A complete ledger makes a comparison auditable; it does not guarantee that the task distribution, evaluator or selected utility captures real deployment needs.

## Reproducibility

[DERIVED] Publish the contract, all operation IDs and statuses, authorized evidence snapshots, processor ordering, reservation bounds, actual resource counters, cache policy, tool versions and frozen selection rule. Mark unavailable counters explicitly. A run is incomplete if a successful answer cannot be connected to every operation that helped produce it, including cancelled and failed work.

## References

[R38.8](references.md) §§3,5.2 and AppendixE.8 supply the bounded agent-swarm study. Equations38.0–38.3, Algorithm38.1 and all figures are book-derived contracts, not reported model experiments.
