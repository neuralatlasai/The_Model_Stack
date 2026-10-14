---
id: "ms.section.44.2"
entity_type: "section"
title: "44.2 — Prefill management"
volume: 2
part: 8
chapter: 44
section: 44.2
slug: "44-2-prefill-management"
parent: "ms.chapter.44"
prev_sibling: "ms.section.44.1"
next_sibling: "ms.section.44.3"
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

# 44.2 — Prefill management

## Scope

[DERIVED] This section owns partitioning prompt computation into schedulable chunks, interaction with ongoing decode, and the fairness consequences of allocating residual token budgets. It compares full-prefill priority, decode priority, and bounded mixed iterations under identical model semantics and state capacity. Success requires both first-token and token-gap objectives, plus a progress guarantee for admitted prefills. Cache layout is assumed from Chapter 42; distributing phases across different devices belongs to §44.4.

## Why this exists

[MATHEMATICALLY-DERIVED] A long full prefill is a nonpreemptive service interval from the perspective of co-running decode requests. Every existing request waiting for the next shared model pass inherits that interval as a token gap. Giving decode strict priority removes this particular interruption but can leave arriving prompts without service. The scheduling problem is not resolved by choosing which phase always wins: it requires bounding the amount of work any one phase inserts before the other can progress.

[PAPER-REPORTED] Sarathi-Serve combines chunked prefills with decode-first, budget-limited mixed batches and profiles the token budget against the intended TBT constraint [R44.2](references.md), §4, Algorithm 3. The word “stall-free” describes eliminating full-prefill interruptions in that policy; it does not establish zero incremental decode latency.

[DERIVED] The consequential change is the preemption granularity. An indivisible prompt becomes a sequence of prefix-preserving chunks that can yield between executions. The GPU still executes each scheduled chunk nonpreemptively at the software boundary. Chunking therefore creates a controllable upper scale for interference while adding more launches, repeated access to earlier KV, and scheduling decisions.

## Intuition

[MATHEMATICALLY-DERIVED] A mixed iteration can amortize common parameter reads over decode tokens and fresh prompt positions. Its benefit is largest when the added prompt arithmetic uses otherwise underused compute. Once that arithmetic or attention traffic becomes the limiting resource, more prompt tokens directly lengthen the iteration. The correct chunk size depends on batch composition and existing context, not just model parameter count.

## Formulation

> **Definition — Chunked prefill.** [DERIVED] Evaluating consecutive portions of a prompt across multiple forward passes while retaining prior prompt state and preserving the original causal dependencies and positions.

| Symbol | Meaning and unit |
|---|---|
| $P,q_j,S_j$ | Prompt length, chunk $j$ length, preceding cached tokens |
| $K,\mathcal D_k$ | Number of chunks and active decode set |
| $\tau,b_k$ | Total iteration token budget and occupied decode positions |
| $f(\mathcal D_k,q,S)$ | Profiled mixed-iteration duration in seconds |
| $\delta_r(k)$ | Remaining token-gap budget at iteration decision $k$, in seconds |
| $Q_i,d_i,w_i$ | Tenant/class work credit, deficit, and weight |

[MATHEMATICALLY-DERIVED] For causal attention with all earlier KV retained, splitting a prompt preserves the logical pair count:
$$
\sum_{j=1}^{K}\left(q_j S_j+\frac{q_j(q_j+1)}2\right)
=\frac{P(P+1)}2,\qquad
S_j=\sum_{i<j}q_i,\quad\sum_jq_j=P.
$$
*(Eq. 44.6)*

where pair count excludes layers/heads and is not a memory-traffic identity. Expanding $P^2=(\sum_jq_j)^2$ yields the cross terms $2\sum_{i<j}q_iq_j$, exactly the attention to previous chunks.

[MATHEMATICALLY-DERIVED] A latency-aware chunk bound is
$$
q_k^\star=\max\left\{q\in\mathbb N_0:
b_k+q\le\tau,\space
\widehat f(\mathcal D_k,q,S)+\epsilon_k
\le \min_{r\in\mathcal D_k}\delta_r(k),\space
\operatorname{state\_feasible}(q)\right\}.
$$
*(Eq. 44.7)*

where $\delta_r(k)=G_r-(t_k-t_{r,\rm last})-m_{r,\rm publish}$, with full gap target $G_r$, time of the last visible token $t_{r,\rm last}$, and transport/publication margin $m_{r,\rm publish}$. Thus already elapsed waiting time is charged before admitting a chunk. Here $\epsilon_k$ is an explicit prediction/synchronization margin. Empty decode sets require a separate prefill execution target; the minimum over an empty set is not silently used. The profile must represent the actual mixed kernel path.

```figure
{
  "id": "fig-44.6",
  "kind": "diagram",
  "title": "Prefix-preserving mixed iterations",
  "caption": "Each chunk reads retained prior state and advances one prompt offset. Decode work shares the pass but retains a separate token-gap constraint.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.6",
  "alt": "Each chunk reads retained prior state and advances one prompt offset. Decode work shares the pass but retains a separate token-gap constraint. The figure is an analytical structure or illustrative configuration, not a measured model result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "p",
        "kind": "tensor",
        "label": "full prompt positions"
      },
      {
        "id": "s",
        "kind": "memory",
        "label": "retained prefix KV"
      },
      {
        "id": "q",
        "kind": "process",
        "label": "next consecutive chunk"
      },
      {
        "id": "d",
        "kind": "state",
        "label": "due decode tokens"
      },
      {
        "id": "b",
        "kind": "process",
        "label": "bounded mixed pass"
      },
      {
        "id": "o",
        "kind": "state",
        "label": "advance offsets"
      }
    ],
    "edges": [
      {
        "from": "p",
        "to": "q",
        "kind": "flow"
      },
      {
        "from": "s",
        "to": "q",
        "kind": "flow"
      },
      {
        "from": "q",
        "to": "b",
        "kind": "flow"
      },
      {
        "from": "d",
        "to": "b",
        "kind": "flow"
      },
      {
        "from": "b",
        "to": "o",
        "kind": "flow"
      },
      {
        "from": "o",
        "to": "s",
        "kind": "flow"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] A correct chunk procedure maps prompt positions $S_j,\ldots,S_j+q_j-1$ to the same positional encoding and causal attention support as full prefill. Earlier KV is read but not recomputed; newly produced KV becomes available to the next chunk only after its completion event. The first generated token is emitted after the final prompt contribution has been processed. A scheduler cannot label a partial prompt a complete request merely because it has returned a tensor.

[MATHEMATICALLY-DERIVED] Eq. 44.6 prevents a misleading explanation of chunk overhead as necessarily “more quadratic attention.” The logical pairs are unchanged. Additional cost can arise from less favorable GEMM shapes, repeated weight loads, launch overhead, and repeated reads of earlier state. An analytical decomposition is
$$
T_{\rm chunked}
=\sum_{j=1}^{K}t_{\rm useful}(q_j,S_j)
+K\kappa+T_{\rm extra\ traffic}+T_{\rm scheduling},
$$
*(Eq. 44.8)*

where $\kappa$ is per-chunk launch/control overhead and the useful-time function already includes its declared compute and baseline traffic. This decomposition does not count overlap twice. Equality of pair counts gives no equality of runtime.

[DERIVED] Decode-first packing begins with one due token for each admitted decode sequence, then allocates remaining work to partially processed prompts, then eligible new prompts. This order preserves continuity for currently running sequences and avoids repeatedly abandoning a half-computed prompt in favor of newcomers. However, if decode positions consume the entire budget at every iteration, residual service is zero. The implementation must either restrict decode admission, reserve a prefill share, or state that first-token fairness is not guaranteed.

[MATHEMATICALLY-DERIVED] A bounded-share analytical policy can assign class $i$ a deficit $d_i$ and increment it by a work quantum $Q_i$ every round. Service of cost $c_i$ is charged as $d_i\leftarrow d_i-c_i$. If all admitted work units have cost at most $c_{\max}$, the system has finite active classes, and every round supplies positive residual capacity, deficit service prevents indefinite bypass. These conditions matter: a weight by itself is not a waiting-time guarantee, and an unbounded nonpreemptive chunk defeats the bound.

[DERIVED] Fairness should be denominated in a declared resource. Equal requests penalize long prompts; equal tokens ignore context-dependent attention; equal predicted GPU time depends on estimator calibration; equal cache-hit ratios reward already cached tenants. The scheduler may choose one, but must expose the resulting tradeoff. Tenant isolation and admission classes are service-contract concerns developed in Chapter 46; this section identifies the work granularity that makes those policies enforceable.

```figure
{
  "id": "fig-44.7",
  "kind": "calculator",
  "title": "Chunk launch overhead component",
  "caption": "This executes only the K times kappa component of Eq. 44.8. Useful compute and extra traffic must be accounted separately.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-44.8",
  "alt": "This executes only the K times kappa component of Eq. 44.8. Useful compute and extra traffic must be accounted separately. The figure is an analytical structure or illustrative configuration, not a measured model result.",
  "spec": {
    "tex": "T_{launch}=K\\kappa",
    "equation": "44.8",
    "inputs": [
      {
        "symbol": "K",
        "label": "chunks",
        "default": 16,
        "min": 1,
        "max": 256,
        "format": "integer"
      },
      {
        "symbol": "kappa",
        "label": "seconds per chunk",
        "default": 0.0001,
        "min": 0,
        "max": 0.01,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "T",
        "label": "launch/control seconds",
        "formula": "K*kappa",
        "format": "seconds",
        "emphasis": true
      }
    ]
  }
}
```

[DERIVED] For pipeline execution, equal token counts do not imply equal stage times if different requests have different accumulated contexts or MoE routing loads. Nevertheless, reducing the variance of admitted prompt work can reduce differences between consecutive microbatches. This is a scheduling lever rather than a proof that all pipeline bubbles vanish. The resource model must retain the slowest stage and the feedback dependency that produces the next decode token.

[MATHEMATICALLY-DERIVED] For $R$ requests and $K$ chunks, a presorted scheduler has $O(R)$ construction cost per iteration, hence up to $O(KR)$ bookkeeping over a prompt's chunking horizon in the worst case. Metadata is $O(R+K)$ if the trace retains chunk records; online state needs only the current offset. Model parameters are unchanged. KV capacity is determined by total resident prefix, while chunk workspace can be smaller. Smaller chunks may increase weight/HBM traffic and collective-launch frequency; energy and billed GPU-time follow actual iteration durations rather than the pair-count identity.

## Algorithm

### Algorithm 44.2 — Bounded mixed execution with progress protection

[DERIVED] Inputs are active decodes $\mathcal D$, partial prompts $\mathcal P$, waiting prompts $\mathcal W$, profiled mixed duration, allocation state, token/time constraints, and optional class credits. Output is one feasible mixed batch. This explanatory adaptation makes progress conditions explicit rather than claiming to reproduce a source's unspecified fairness policy.

$$
\begin{aligned}
1.\;&\mathcal B\gets\operatorname{reserve\_decode}(\mathcal D),\quad
b\gets|\mathcal B|;\quad
b>\tau\Rightarrow\operatorname{invoke\_admission\_recovery}.\\
2.\;&\mathcal C\gets\operatorname{credit\_then\_age\_order}(\mathcal P,\mathcal W);
\quad d_i\gets d_i+Q_i.\\
3.\;&r\gets\operatorname{next}(\mathcal C),\quad
q\gets\min(P_r-S_r,\tau-b,\operatorname{credit\_cap}(r)).\\
4.\;&q\gets\operatorname{largest\_feasible\_prefix}(q,\widehat f,\epsilon,\delta);
\quad q=0\Rightarrow\operatorname{defer}(r).\\
5.\;&\operatorname{reserve}(r,q)\text{ succeeds}
\Rightarrow(\mathcal B,b,d_i)\gets
(\mathcal B\cup\{(r,q)\},b+q,d_i-\widehat c_r(q));\\
&\operatorname{reserve}\text{ fails}\Rightarrow\operatorname{rollback\_candidate}(r).\\
6.\;&\text{After at most }|\mathcal C|\text{ visits, launch }\mathcal B;
\quad\text{on completion }S_r\gets S_r+q_r.\\
7.\;&S_r=P_r\Rightarrow r:\operatorname{prefill}\to\operatorname{decode};
\quad\operatorname{cancelled}(r)\Rightarrow\operatorname{release\_after\_completion}.
\end{aligned}
$$
*(Eq. 44.9)*

where $\widehat c_r$ uses the chosen fairness unit. Invariants are monotonically increasing prompt offsets, unchanged causal positions, legal token/state budgets, and no output publication before its computation completes. A bounded search over chunk sizes can enumerate all aligned candidates; monotonic binary search is valid only if the measured feasibility function is monotone. A round with no prefill progress records why; it must not claim starvation freedom.

## Implementation

[OFFICIAL-DOCUMENTATION] The inspected Sarathi-Serve scheduler source orders completed-prefill sequences before partial prefills, limits remaining chunk work, allocates waiting sequences, and records preempted IDs [R44.13](references.md), SarathiScheduler._schedule and _get_seq_next_num_prefill_tokens. Its optional dynamic chunk schedule is distinct from the fixed-budget archival evaluation. The source is unpinned main and was not executed.

[DERIVED] **vLLM** and **SGLang** are reference-stack Inference engines (§4 #41/#42); **PyTorch** is Model / autograd (§4 #17), and **NVIDIA NCCL** supplies Kernels / collectives (§4 #4). Packed token positions and per-request prefix lengths must reach a chunk-capable attention kernel. The scheduler's budget is useless if a fallback silently executes the full prompt, or if a graph-capture path assumes a different batch layout. The engine's exact attention backend and graph policy are material configuration, not incidental software labels.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Sarathi-Serve evaluates Poisson arrivals from openchat_sharegpt4 and arxiv_summarization lengths, filtering total lengths above 8192/16384 respectively. Table 4 ablates hybrid-only, chunk-only, and combined scheduling; Figure 14 measures chunk overhead [R44.2](references.md), §§5.1,5.4.

| Evidence/context | Disclosed setting |
|---|---|
| [PAPER-REPORTED] Table 4 hardware/model | Yi-34B, two A100 GPUs, TP2 |
| [PAPER-REPORTED] Workload/concurrency | 128 requests, source dataset lengths; token budget 1024 |
| [PAPER-REPORTED] Runtime/boundary | Archival Sarathi-Serve/vLLM-derived prototype; P50 TTFT and P99 TBT in seconds |
| [PAPER-REPORTED] openchat hybrid-only / chunk-only / combined | TTFT 0.53 / 1.04 / 0.76; TBT 0.68 / 0.17 / 0.14 |
| [PAPER-REPORTED] arxiv hybrid-only / chunk-only / combined | TTFT 3.78 / 5.38 / 3.90; TBT 1.38 / 0.20 / 0.17 |
| [NOT-DISCLOSED] Uncertainty | Table 4 does not specify dtype or a seed interval for these comparisons |

## Observations

**What the paper claims.** [PAPER-REPORTED] Combining the two techniques offers a better throughput/latency compromise; small chunks incur overhead [R44.2](references.md), §5.4.

**What the evidence shows.** [DERIVED] Table 4 does not show the combined policy winning every metric: hybrid-only has lower median TTFT in both datasets, while the combined policy improves TBT. The measured tradeoff is scientifically stronger than an unqualified “both latencies always improve.”

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 44.6 preserves useful attention work, while Eq. 44.8 exposes additional overhead. Chunking buys scheduling opportunities with execution efficiency; optimal granularity depends on the active constraint.

**What remains unknown.** [NOT-DISCLOSED] This ablation does not establish tenant-level starvation bounds, a universal chunk optimum, or end-to-end cancellation correctness under distributed failure.

## Failure modes

> **Failure mode — Residual-budget starvation.** [DERIVED] *Symptom:* stable decode latency with unbounded prefill waiting age. *Cause:* decodes consume every token slot. *Detection:* per-class oldest age and zero-service rounds. *Mitigation:* bounded decode admission or reserved prefill credit.

> **Failure mode — Incorrect chunk boundary.** [DERIVED] *Symptom:* chunked and full-prefill logits disagree beyond numerical tolerance. *Cause:* reset positions, missing earlier KV, or wrong mask. *Detection:* compare final prompt logits with identical tokens/backend/dtype. *Mitigation:* preserve offsets and explicit causal-state invariants.

## Siblings

[DERIVED] **Full-prefill priority** minimizes prompt fragmentation but can insert a long token gap. **Strict decode priority** preserves running service but offers no residual-capacity guarantee. **Bounded mixed execution** makes interference controllable while paying chunk overhead. **Disaggregation** [§44.4](44-4-disaggregation.md) removes same-device phase competition but adds a state-transfer and queue boundary. These change the scheduling primitive and resource coupling, not the model's training objective.

```figure
{
  "id": "fig-44.8",
  "kind": "compare",
  "title": "Phase priority and progress",
  "caption": "Each policy pays a different coupling cost; no entry is a quality or performance ranking.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.7",
  "alt": "Each policy pays a different coupling cost; no entry is a quality or performance ranking. The figure is an analytical structure or illustrative configuration, not a measured model result.",
  "spec": {
    "axis": "Scheduling constraint changed at identical model semantics",
    "columns": [
      {
        "id": "p",
        "label": "Prefill priority"
      },
      {
        "id": "d",
        "label": "Decode priority"
      },
      {
        "id": "m",
        "label": "Bounded mixed"
      }
    ],
    "rows": [
      {
        "dimension": "Prefill progress",
        "values": {
          "p": "immediate when chosen",
          "d": "residual only",
          "m": "bounded work units"
        }
      },
      {
        "dimension": "Decode interference",
        "values": {
          "p": "full prompt interval",
          "d": "decode work only",
          "m": "limited chunk interval"
        }
      },
      {
        "dimension": "Additional obligation",
        "values": {
          "p": "token-gap exposure",
          "d": "starvation control",
          "m": "chunk correctness and margin"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] Preble's cache-ratio priority groups add fairness considerations to a cache-aware local scheduler; [§44.3](44-3-prefix-and-state-placement.md) covers the source's p99-versus-mean ablation [R44.4](references.md), §§4.3,5.4. Current vLLM documentation exposes a decode-priority implementation of chunking [R44.9](references.md), “Chunked Prefill.” Adoption documents availability, not replication of Sarathi-Serve's historical results.

## Limitations

> **Open question.** [DERIVED] Can a joint time-and-state fair scheduler retain prefix reuse while bounding both TTFT and worst token gaps under uncertain output lengths? · *what evidence would settle it:* a conditional bound with explicit arrival/work limits, accompanied by equal-budget experiments that include low-cache tenants and adversarial long prompts.

[DERIVED] Exact full-prefill equivalence is a semantic contract, not bitwise equality across different floating-point reduction orders. A complete comparison specifies tolerance and generated-output policy. The present derivations apply to causal prefix retention; recurrent-state, bidirectional encoder, and speculative multi-token paths need separate contracts.

## Reproducibility

[DERIVED] Retain chunk offsets/sizes, batch context lengths, attention backend, token budget, state preemption, deadline margin, and per-class service history. Report per-token gaps separately from mean TPOT, and TTFT with queue time included. Source tests are archival; no proposed fairness mechanism here is represented as an executed improvement. The falsifiable comparison is in [verification.md](verification.md).

## References

[DERIVED] [R44.2](references.md) §§4–5, Algorithm 3, Table 4, Figure 14; [R44.4](references.md) §§4.3,5.4; [R44.9](references.md) “Chunked Prefill”; [R44.13](references.md) scheduler source.
