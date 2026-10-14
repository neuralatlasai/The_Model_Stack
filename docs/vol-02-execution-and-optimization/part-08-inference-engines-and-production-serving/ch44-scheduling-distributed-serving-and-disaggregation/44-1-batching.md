---
id: "ms.section.44.1"
entity_type: "section"
title: "44.1 — Batching"
volume: 2
part: 8
chapter: 44
section: 44.1
slug: "44-1-batching"
parent: "ms.chapter.44"
prev_sibling: null
next_sibling: "ms.section.44.2"
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

# 44.1 — Batching

## Scope

[DERIVED] This section owns the unit at which requests enter and leave a model execution: fixed cohorts, request-level dynamic batches, and iteration-level continuous batches. It treats heterogeneous prompt/output lengths, token budgets, state reservation, and scheduling overhead. The baseline is identical model, precision, kernels, hardware, and arrivals with a different admission boundary. Success is useful completed work under a declared latency contract, rather than a larger nominal batch. Chunk selection, placement, disaggregation, and overload decisions have their canonical treatments in §§44.2–44.6.

## Why this exists

[MATHEMATICALLY-DERIVED] An autoregressive request occupies resources across many dependent forward passes. A batch formed once and retained until its longest request ends wastes opportunities when shorter requests finish. Waiting for enough arrivals to fill that cohort introduces a second loss at low load. These are different effects: admission delay precedes execution, while cohort drain happens during execution. Eliminating one does not eliminate the other.

[PAPER-REPORTED] Orca combines iteration-level FCFS admission, selective operator batching, and per-request KV reservation from maximum token counts [R44.1](references.md), §§3–4. Its original attention implementation and reservation policy are historical.

[DERIVED] Batching is therefore a control problem with three coupled states: compute work due now, resident state accumulated previously, and uncertain work arriving later. A request count alone represents none of these accurately. Two batches with the same number of sequences can differ in prompt work, attention traffic, remaining residency, and deadline slack. Scheduler quality depends on how these quantities map into execution time.

## Intuition

[MATHEMATICALLY-DERIVED] A continuous batch is a sequence of feasible execution sets, not a permanently full container. Finished requests leave after their completion boundary; eligible arrivals join before a later iteration. Weight reads can be amortized across more useful tokens, but increasing the set also increases per-iteration work. Thus continuous batching can improve resource use without monotonically improving each request's latency. The comparison axis must distinguish tokens per second, requests per second, and latency of the already admitted sequences.

## Formulation

> **Definition — Continuous batching.** [DERIVED] Reconstructing the admitted execution set at model iteration boundaries so completed requests can depart and new requests can join without waiting for an entire original cohort to finish.

> **Definition — Iteration token budget.** [DERIVED] An upper bound on newly executed token positions in one scheduled forward pass; it does not directly bound the total cached context those positions attend to.

| Symbol | Meaning and unit |
|---|---|
| $r,a_r,p_r,o_r$ | Request, arrival time in seconds, prompt tokens, eventual output tokens |
| $s_{r,k},u_{r,k}$ | Already processed context and newly executed positions at iteration $k$ |
| $\mathcal B_k,\tau_k,N_{\max}$ | Execution set, token budget, maximum simultaneous sequences |
| $v_r(s),M_{\rm KV}$ | Resident request state in bytes and available state capacity |
| $\widehat t(\mathcal B_k,u_k)$ | Profile-based iteration-time estimate in seconds |
| $h_r$ | Next request deadline or latency target in seconds |

[MATHEMATICALLY-DERIVED] With final generated lengths known only for retrospective accounting, a fixed cohort's decode-slot utilization under equal-duration iterations is
$$
d_r=\max(o_r-1,0),\qquad
\eta_{\rm cohort}=\frac{\sum_{r=1}^{B}d_r}{B\max_r d_r},\quad\max_r d_r>0.
$$
*(Eq. 44.1)*

where $B$ is cohort size, $o_r$ counts all generated tokens, prefill emits the first token, and $d_r$ counts subsequent decode iterations. A cohort with no subsequent decode has no defined decode-slot utilization. This counts useful slots, not GPU utilization: different contexts and kernel shapes invalidate equal iteration cost. The expression is one when all outputs are equal and can approach $1/B$ when one dominates.

[MATHEMATICALLY-DERIVED] A feasible execution set satisfies separate work and state constraints:
$$
\sum_{r\in\mathcal B_k}u_{r,k}\le\tau_k,\quad
|\mathcal B_k|\le N_{\max},\quad
M_{\rm pinned,k}+M_{\rm new,k}+M_{\rm workspace,k}\le M_{\rm available}.
$$
*(Eq. 44.2)*

where pinned state includes shared blocks counted once, new state is the allocation due before launch, and workspaces include execution buffers outside the KV pool. The cache-byte derivation belongs to [Chapter 42](../../part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md); here it is an admission input.

[DERIVED] A useful scheduling objective is to maximize accepted deadline-compliant work over a horizon, subject to Eq. 44.2 and a model-equivalence contract. That objective is neither ordinary bin packing nor a supervised training loss. It depends on future arrivals and unknown output lengths; a practical policy uses estimates and a recovery path. Reporting an oracle with true future lengths as an implementable scheduler would silently change the information available.

```figure
{
  "id": "fig-44.3",
  "kind": "diagram",
  "title": "Iteration admission and state ownership",
  "caption": "Admission joins work and state constraints. Completed kernels release ownership before a later batch reserves reusable slots.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.3",
  "alt": "Admission joins work and state constraints. Completed kernels release ownership before a later batch reserves reusable slots. The figure is an analytical structure or illustrative configuration, not a measured model result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "q",
        "kind": "state",
        "label": "eligible queues"
      },
      {
        "id": "a",
        "kind": "process",
        "label": "select work due"
      },
      {
        "id": "m",
        "kind": "memory",
        "label": "reserve state"
      },
      {
        "id": "b",
        "kind": "branch",
        "label": "all constraints feasible"
      },
      {
        "id": "g",
        "kind": "hardware",
        "label": "launch one iteration"
      },
      {
        "id": "c",
        "kind": "feedback",
        "label": "completion and retirement"
      }
    ],
    "edges": [
      {
        "from": "q",
        "to": "a",
        "kind": "flow"
      },
      {
        "from": "a",
        "to": "m",
        "kind": "flow"
      },
      {
        "from": "m",
        "to": "b",
        "kind": "flow"
      },
      {
        "from": "b",
        "to": "g",
        "kind": "flow",
        "label": "yes"
      },
      {
        "from": "b",
        "to": "q",
        "kind": "flow",
        "label": "defer"
      },
      {
        "from": "g",
        "to": "c",
        "kind": "flow"
      },
      {
        "from": "c",
        "to": "q",
        "kind": "flow"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Static batching fixes membership before execution, often with padding or masking to a common shape. A request-level dynamic batch adds a waiting window or size threshold, forms a cohort from queued requests, then runs that cohort to completion. Both can use efficient packed kernels; neither inherently permits replacing a completed sequence before the cohort drains. Continuous batching changes the lifetime of membership, while padding removal changes the representation. Treating those changes as identical obscures which intervention explains a measured gain.

[MATHEMATICALLY-DERIVED] Under an illustrative stationary arrival process with rate $\lambda$, waiting to collect $B$ requests from an empty system adds an expected $(B-1)/\lambda$ seconds for the first arrival if interarrival times are independent with mean $1/\lambda$. A timeout caps collection delay but yields partially filled batches. No claim about a production arrival distribution is needed for this analytical counterexample: at sufficiently low rate, collecting a full batch can cost more than the execution it saves.

[DERIVED] An iteration scheduler first retires completed work, releases references only after dependent kernels complete, updates queue state, and obtains a snapshot of the available state pool. It then selects runnable sequences, computes their work due now, reserves allocations, and launches a common batch description. Admission and reservation must form one logical transaction. A stale free-memory estimate can otherwise admit a batch that fails before the first kernel, despite apparently respecting a token budget.

[MATHEMATICALLY-DERIVED] Token count is an incomplete time model. For causal attention with existing context $s$ and $u$ new prompt positions, the number of newly evaluated query/key pairs is
$$
A(s,u)=su+\frac{u(u+1)}2.
$$
*(Eq. 44.3)*

where attention-head and layer factors are excluded. A decode token has $u=1$ but reads $s+1$ positions. Consequently two batches with equal $\sum u$ may have very different attention traffic. The scheduler can retain a token budget as a simple guard while separately bounding predicted time and memory.

[DERIVED] Maximum-length reservation makes future growth feasible but can sacrifice concurrency when actual outputs are short. Incremental allocation accepts more requests initially but introduces a future preemption decision when growth exhausts memory. Neither policy eliminates uncertainty: the first converts uncertainty into reserved capacity, the second converts it into recovery risk. Reserving only current bytes while claiming no future preemption is not a complete execution contract.

```figure
{
  "id": "fig-44.4",
  "kind": "calculator",
  "title": "Context-dependent attention work",
  "caption": "At equal new-token count, a longer existing context increases pair count. Values are illustrative and omit head and layer factors.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-44.3",
  "alt": "At equal new-token count, a longer existing context increases pair count. Values are illustrative and omit head and layer factors. The figure is an analytical structure or illustrative configuration, not a measured model result.",
  "spec": {
    "tex": "A=su+u(u+1)/2",
    "equation": "44.3",
    "inputs": [
      {
        "symbol": "s",
        "label": "cached tokens",
        "default": 4096,
        "min": 0,
        "max": 131072,
        "format": "tokens"
      },
      {
        "symbol": "u",
        "label": "new positions",
        "default": 128,
        "min": 1,
        "max": 8192,
        "format": "tokens"
      }
    ],
    "outputs": [
      {
        "symbol": "A",
        "label": "query/key pairs",
        "formula": "s*u+u*(u+1)/2",
        "format": "integer",
        "emphasis": true
      }
    ]
  }
}
```

[MATHEMATICALLY-DERIVED] With $R$ eligible requests, sorting by priority costs $O(R\log R)$ and scanning a presorted list costs $O(R)$. Batch metadata occupies $O(R)$ auxiliary space; cache indices and state payload are separate. Dense parameter count and model semantics remain unchanged. Useful token compute depends on $\sum u$ and Eq. 44.3; weight traffic can be shared within a pass, while KV traffic grows with admitted contexts. Scheduling across ranks adds batch-description dissemination and collective synchronization. A throughput improvement follows only if saved execution exceeds the added control and state-management work.

## Algorithm

### Algorithm 44.1 — Transactional iteration admission

[DERIVED] Inputs are eligible requests $\mathcal Q$, running state $\mathcal A$, token budget $\tau$, sequence bound $N$, a memory allocator, and a priority order. Output is one batch descriptor and updated queues. This is an explanatory continuous-batching procedure; it is not a transcription of a particular engine.

$$
\begin{aligned}
1.\;&\mathcal A\gets\operatorname{retire\_completed}(\mathcal A);
\quad \mathcal C\gets\operatorname{order}(\mathcal A\cup\mathcal Q),\space
\mathcal B\gets\varnothing,\ b\gets0.\\
2.\;&r\gets\operatorname{next}(\mathcal C),\quad
u\gets\operatorname{work\_due}(r,\tau-b).\\
3.\;&u=0\ \lor\ |\mathcal B|=N
\Rightarrow\operatorname{defer}(r);
\quad\text{otherwise reserve }\Delta v_r(u).\\
4.\;&\operatorname{reserve\_failed}
\Rightarrow\operatorname{defer\_or\_preempt\_by\_policy}(r);
\quad\operatorname{reserve\_succeeded}
\Rightarrow(\mathcal B,b)\gets(\mathcal B\cup\{(r,u)\},b+u).\\
5.\;&\mathcal C\ne\varnothing\land b<\tau\land|\mathcal B|<N
\Rightarrow\text{return to 2; otherwise validate and launch }\mathcal B.\\
6.\;&\operatorname{launch\_failed}
\Rightarrow\operatorname{rollback\_unpublished\_reservations};
\quad\operatorname{completed}
\Rightarrow\operatorname{publish\_tokens\_and\_state\_epoch}.
\end{aligned}
$$
*(Eq. 44.4)*

where every request is considered at most once per construction round. Invariants are Eq. 44.2, no mutation of in-flight block ownership, and one authoritative state epoch per request. An empty infeasible batch yields to a documented recovery policy instead of busy-looping. Construction terminates after $|\mathcal C|$ visits; model execution has its own bounded output limit and cancellation state.

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM V1 documents decode-priority chunked prefill using the remaining max_num_batched_tokens budget and default recomputation preemption [R44.9](references.md), “Chunked Prefill” and “Preemption.” These are mutable documentation claims accessed 2026-10-14, not a version-independent statement about all vLLM releases.

[DERIVED] The reference-stack execution path is **PyTorch** (§4 #17, Model / autograd), **vLLM** (§4 #41, Inference engine), or **SGLang** (§4 #42, Inference engine), with **NVIDIA NCCL** (§4 #4, Kernels / collectives) for distributed synchronization. Scheduling produces token IDs, positions, sequence lengths, and block-table references; attention consumes those references while projection and feed-forward operators consume packed positions. No gradient computation is required for this serving decision.

[DERIVED] CPU bookkeeping and GPU execution require a common completion boundary. A host queue can mark a request finished before a device stream has stopped reading its KV; immediately recycling that memory creates a use-after-free race. Conversely, retaining every finished allocation until a whole batch drains recreates cohort waste in the memory layer. Event-associated ownership, reference counts, and batch epochs make the admission contract concrete.

[MATHEMATICALLY-DERIVED] Energy and monetary cost are not determined by batch size. Let $E_k=\int_{t_k}^{t_{k+1}}P(t)\,dt$ include the declared device boundary. Cost per accepted token is $\sum_k E_k/N_{\rm accepted}$, while billed device-time additionally counts idle and reserved time. An increased power draw with a sufficiently shorter pass can reduce energy; a larger throughput with deadline failures can increase cost per useful completion. Source-independent numerical savings are therefore not asserted.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Orca's §6.2 uses synthesized prompts uniform over 32–512 tokens and generation limits uniform over 1–128, compares a custom request-batching FasterTransformer scheduler, varies maximum batch/microbatch sizes, and reports median end-to-end latency divided by generated tokens. Figure 10 includes GPT-3-shaped 101B/175B/341B models on 8/16/32 GPUs. Its low-load 101B case is an explicit exception to the general advantage [R44.1](references.md), §§6.1–6.2, Figures 9–11.

| Evidence/context | Disclosed setting |
|---|---|
| [PAPER-REPORTED] Hardware/precision | Azure A100-40GB GPUs, eight/VM, NVLink and 200 Gbps adapters; FP16 |
| [PAPER-REPORTED] Semantics | Synthetic token counts; no actual checkpoint/text; EOS suppressed; Poisson arrivals |
| [PAPER-REPORTED] Runtime/boundary | Archival Orca/FasterTransformer, varying max batch/microbatch; median complete-request latency/output token |

[NOT-DISCLOSED] Those figures do not provide a modern shared-prefix trace, per-token latency tails, or an uncertainty interval sufficient to transfer their numerical advantage to a 2026 engine. The paper's experiment is a historical test of admission boundaries under its baseline, not a current engine ranking.

## Observations

**What the paper claims.** [PAPER-REPORTED] Orca attributes its serving improvement to iteration scheduling together with its execution design [R44.1](references.md), §§4,6.

**What the evidence shows.** [DERIVED] The inspected protocol controls engine-only behavior separately from end-to-end scheduling, but the latter comparison combines membership, memory reservation, and control-path differences. Its measured outcome does not isolate iteration scheduling as a universal multiplicative factor.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 44.1 identifies the cohort-drain opportunity; Eq. 44.2 shows why filling that opportunity still requires state feasibility. At low load or equal lengths, the opportunity shrinks even with correct continuous batching.

**What remains unknown.** [UNVERIFIED] No book-authored execution verifies current vLLM/SGLang behavior or transfers the historical speedups to contemporary kernels, long contexts, and multi-tenant traffic.

## Failure modes

> **Failure mode — Work-budget confusion.** [DERIVED] *Symptom:* iteration latency spikes despite a constant token budget. *Cause:* longer cached contexts increase Eq. 44.3. *Detection:* correlate latency with context-weighted work and memory traffic. *Mitigation:* combine token, state, and predicted-time constraints.

> **Failure mode — Growth deadlock.** [DERIVED] *Symptom:* all resident requests need another block but none can run. *Cause:* incremental admission without headroom or recovery. *Detection:* zero feasible execution sets with nonempty queues. *Mitigation:* reserve progress capacity or invoke an explicit preemption policy.

## Siblings

[DERIVED] **Static versus request-dynamic batching:** the latter changes when a cohort forms and can bound collection delay, but retains cohort membership. **Request-dynamic versus continuous batching:** the latter changes the replacement boundary to an iteration and therefore needs persistent request state. **Sequence versus token budgets:** the former caps concurrent identities, the latter newly executed positions; neither bounds cached-context traffic. These are differential implementation choices at the same admission layer, not three mutually exclusive kernel families.

```figure
{
  "id": "fig-44.5",
  "kind": "compare",
  "title": "Admission boundaries and obligations",
  "caption": "The alternatives change membership lifetime independently of packing, kernel choice, and persistent-state allocation.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-44.2",
  "alt": "The alternatives change membership lifetime independently of packing, kernel choice, and persistent-state allocation. The figure is an analytical structure or illustrative configuration, not a measured model result.",
  "spec": {
    "axis": "Membership and state obligation at fixed model and workload",
    "columns": [
      {
        "id": "static",
        "label": "Static cohort"
      },
      {
        "id": "dynamic",
        "label": "Request dynamic"
      },
      {
        "id": "continuous",
        "label": "Continuous"
      }
    ],
    "rows": [
      {
        "dimension": "Admission",
        "values": {
          "static": "before execution",
          "dynamic": "size or timeout",
          "continuous": "iteration boundary"
        }
      },
      {
        "dimension": "Replacement",
        "values": {
          "static": "after cohort",
          "dynamic": "after cohort",
          "continuous": "after request completion"
        }
      },
      {
        "dimension": "State",
        "values": {
          "static": "cohort lifetime",
          "dynamic": "cohort lifetime",
          "continuous": "persistent request ownership"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] Sarathi-Serve changes the work admitted at each iteration by splitting prompts; [§44.2](44-2-prefill-management.md) reconstructs its method and reported ablation [R44.2](references.md). Preble changes which replica and cache-sharing class receives a request; [§44.3](44-3-prefix-and-state-placement.md) explains its distinct global/local decisions [R44.4](references.md). Neither successor establishes that maximizing the number of sequences is the right objective.

## Limitations

[MATHEMATICALLY-DERIVED] The equal-duration assumption behind Eq. 44.1 is a diagnostic bound, not a throughput predictor. Finite waiting-time guarantees additionally require bounded admitted work and capacity exceeding offered work over the relevant interval. Under sustained overload, no scheduling rule can provide finite latency to every arrival. Admission control is owned by [Chapter 46](../ch46-admission-control-routing-autoscaling-and-service-contracts/README.md); this section only makes its resource inputs explicit.

## Reproducibility

[DERIVED] A reconstructable batching comparison records arrival timestamps, exact tokenized prompts, stopping/sampling rules, actual output lengths, model/kernel revisions, padding/packing policy, state reservation, batch descriptors, scheduler time, and allocation/preemption events. Identical request counts without identical tokenization and termination are insufficient controls. Current documentation is unpinned; source-reported experiments remain attributed, and the unexecuted artifact protocol lives in [verification.md](verification.md).

## References

[DERIVED] Primary records: [R44.1](references.md) Orca §§3–4,6; [R44.2](references.md) Sarathi-Serve §§4–5; [R44.4](references.md) Preble §§4–5; [R44.9](references.md) current vLLM optimization guide. Canonical resource accounting: Chapter 42.
