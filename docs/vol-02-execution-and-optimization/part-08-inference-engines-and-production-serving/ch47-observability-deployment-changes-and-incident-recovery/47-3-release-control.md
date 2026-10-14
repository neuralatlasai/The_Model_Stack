---
id: "ms.section.47.3"
entity_type: "section"
title: "47.3 — Release control"
volume: 2
part: 8
chapter: 47
section: 47.3
slug: "47-3-release-control"
parent: "ms.chapter.47"
prev_sibling: "ms.section.47.2"
next_sibling: "ms.section.47.4"
children: []
prerequisites: ["ms.chapter.30","ms.chapter.43","ms.chapter.44","ms.chapter.45","ms.chapter.46"]
downstream: ["ms.chapter.48","ms.chapter.66"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["observability","deployment","recovery"],"feedback_setting":[],"modality":["text"]}
papers: []
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 47.3 — Release control

## Scope

[DERIVED] A release is an immutable executable specification of model behavior and serving behavior. Release control determines whether to expose it, how to compare it with a control, and when to stop or reverse exposure. The unit includes model, tokenizer, template, numerical representation, engine, kernels, topology, cache semantics, and policy. A weight file alone cannot define the deployed function.

## Why this exists

[DERIVED] Changing a chat template can alter token positions without changing weights. Changing a kernel can alter floating-point reductions without changing the mathematical model. Changing batching policy can alter latency and sometimes numerical behavior. A rollback that restores only weights may therefore preserve the defect. Reproducible release control requires content-addressed artifacts and an explicit compatibility relation among them.

[DERIVED] Candidate testing also consumes resources and can affect the control. Shadow requests can occupy GPU queues, warm shared caches, or invoke tools. A canary on a lightly loaded replica may miss an interference defect that appears after broad rollout. Exposure control must distinguish functional compatibility, statistical uncertainty, operational harm, and shared-resource interference; a single aggregate success rate cannot resolve them.

## Intuition

[DERIVED] Separate artifact validation, isolated shadow execution, and randomized user exposure. Validation asks whether the tuple can execute and preserve declared contracts. Shadow execution compares behavior on mirrored inputs while containing side effects. A canary estimates outcomes under limited actual exposure, followed by staged expansion only when its gates are satisfied. Each stage answers a different question and has its own failure return.

```figure
{
  "id": "fig-47.9",
  "kind": "diagram",
  "title": "Bounded exposure with terminal decisions",
  "caption": "Compatibility, isolated shadowing and staged actual exposure answer different questions; failure fences further candidate admission.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.12",
  "alt": "Compatibility, isolated shadowing and staged actual exposure answer different questions; failure fences further candidate admission. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "memory",
        "label": "immutable tuple"
      },
      {
        "id": "v",
        "kind": "process",
        "label": "compatibility"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "isolated shadow"
      },
      {
        "id": "c",
        "kind": "branch",
        "label": "bounded canary"
      },
      {
        "id": "p",
        "kind": "state",
        "label": "promote"
      },
      {
        "id": "r",
        "kind": "feedback",
        "label": "fence / reject"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "v",
        "to": "s",
        "kind": "flow",
        "label": "pass"
      },
      {
        "from": "v",
        "to": "r",
        "kind": "flow",
        "label": "fail"
      },
      {
        "from": "s",
        "to": "c",
        "kind": "flow",
        "label": "pass"
      },
      {
        "from": "s",
        "to": "r",
        "kind": "flow",
        "label": "fail"
      },
      {
        "from": "c",
        "to": "p",
        "kind": "flow",
        "label": "all gates"
      },
      {
        "from": "c",
        "to": "r",
        "kind": "flow",
        "label": "harm or cap"
      }
    ]
  }
}
```

[OFFICIAL-DOCUMENTATION] Google's canary guidance illustrates a deliberately defective candidate: 20% candidate errors exposed to 5% of traffic produce only 1% aggregate errors. Per-version measurement makes the defect visible. This is a worked example, not a measured inference incident or a guarantee that a 5% canary is adequate. [R47.4, Figures 16-3–16-4 and “Minimizing Risk”]

## Formulation

[DERIVED] Define the immutable release tuple

$$
 \mathcal R=(h_W,h_T,h_{\rm template},h_{\rm quant},h_{\rm engine},
 h_{\rm compiler},h_{\rm kernels},h_{\rm deps},\mathcal H,\mathcal P,\mathcal C).
$$

(Eq. 47.9)

[DERIVED] Hashes identify content and build artifacts; $\mathcal H$ describes hardware/topology, $\mathcal P$ admission/routing/sampling policy, and $\mathcal C$ cache and state-format semantics. A signed manifest binds these fields and their compatibility checks. Mutable tags are discovery aids, not identities. Hashing an incomplete manifest does not make omitted dependencies reproducible.

[MATHEMATICALLY-DERIVED] Consider two arms $a\in\{0,1\}$, $m$ predeclared loss endpoints normalized to $[0,1]$, independent identically distributed observations within each arm/endpoint, and fixed valid random assignment. For sample count $n\ge1$, allocate
$\eta_n=3\alpha/(\pi^2mn^2)$. Hoeffding's inequality and a union bound yield

$$
 \epsilon_n=\sqrt{\frac{\log(2/\eta_n)}{2n}},\qquad
 \Pr\!\left(\exists a,j,n:
 |\widehat\mu_{a,j,n}-\mu_{a,j}|>\epsilon_n\right)
 \le 2m\sum_{n=1}^\infty\eta_n=\alpha .
$$

(Eq. 47.10)

[MATHEMATICALLY-DERIVED] For a single stationary stage, on the simultaneous event, the candidate-minus-control harm $\Delta_j$ lies in
$$
 [L_j,U_j]=
 [\widehat\mu_{1,j}-\widehat\mu_{0,j}-\epsilon_{n_1}-\epsilon_{n_0},
  \widehat\mu_{1,j}-\widehat\mu_{0,j}+\epsilon_{n_1}+\epsilon_{n_0}].
$$

(Eq. 47.11)
Thus rejecting when $L_j>\delta_j$ and declaring endpoint noninferiority only when $U_j<\delta_j$ remain protected against arbitrary repeated looks under the stated model.

[DERIVED] For $K$ predeclared stages with potentially different means, allocate $\alpha_s>0$ with $\sum_{s=1}^K\alpha_s\le\alpha$, apply Eqs. 47.10–11 within stage $s$ using $\alpha_s$, and reset its sample counts only with that new allocation. The union bound then covers all stages. Reusing $\alpha$ after every reset is not covered. The construction is deliberately conservative and does not solve confounding. Conversation dependence calls for an appropriate assignment/analysis unit; rare tenant clusters may provide few independent units. Delayed labels require mature cohorts or an independently justified observation model. Adaptive allocation, changing traffic distributions, or interference invalidates this simple iid guarantee. Raw unbounded latency also does not satisfy the bounded-loss premise; use a prespecified SLO-violation indicator or a declared clipping estimand.

## Mechanism

[DERIVED] Compatibility checks cover vocabulary and special tokens, template semantics, quantization format/scales, adapter identity, supported kernels, graph shapes, parallel shards, positional configuration, and cache serialization. Some mismatches should prevent startup; others require a new cache namespace. A release may be executable yet behaviorally incompatible with an API contract. The manifest must state whether partial streams, tool schemas, finish reasons, and output constraints retain their meaning.

[DERIVED] A shadow receives a copy of eligible inputs and produces private outputs. Tool calls, external writes, billing effects, notifications, and memory updates must be intercepted or redirected to an isolated sink. Its cache namespace and resource budget should prevent unintended cross-arm warming or eviction. Privacy authorization for a production request does not automatically authorize arbitrary replication into another region or retention system.

[DERIVED] Canary assignment should be stable for the unit whose history affects the answer, often a conversation or workflow. Record assignment probability and eligibility before outcomes occur. Excluding difficult requests after observing candidate failures destroys comparability. When quality requires delayed ground truth, rapid infrastructure gates can stop immediate harm while the quality gate stays pending; infrastructure health cannot substitute for mature outcome evidence.

```figure
{
  "id": "fig-47.10",
  "kind": "calculator",
  "title": "Candidate harm can hide globally",
  "caption": "Illustrative arithmetic: candidate fraction times candidate incremental failure rate. This is not an inference measurement.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-47.12",
  "alt": "Illustrative arithmetic: candidate fraction times candidate incremental failure rate. This is not an inference measurement. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "tex": "g=ph",
    "inputs": [
      {
        "symbol": "p",
        "label": "candidate exposure fraction",
        "default": 0.05,
        "min": 0.001,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "h",
        "label": "candidate incremental failure",
        "default": 0.2,
        "min": 0,
        "max": 1,
        "format": "ratio"
      }
    ],
    "outputs": [
      {
        "symbol": "g",
        "label": "aggregate incremental failure",
        "formula": "p*h",
        "format": "ratio",
        "emphasis": true
      }
    ]
  }
}
```

[DERIVED] Staged rollout changes the experimental environment. A candidate that passes at low utilization may fail when its cache footprint, collective load, or queueing interactions dominate. Therefore each stage rechecks resource and user-facing endpoints, preserves a viable control/rollback path, and applies a finite exposure/time budget. Promotion at one stage authorizes the next bounded stage, not an unqualified claim of universal superiority.

## Algorithm

### Algorithm 47.3 — Bounded release control

[DERIVED] Algorithm 47.3 is a bounded release controller. Inputs are candidate/control tuples, ordered stages $S$, endpoint tolerances $\delta$, stage-specific alpha allocations, exposure/time caps, and a compatibility predicate. State starts at validated=false, stage=0, candidate exposure=0. Outputs are rejected, promoted, or inconclusive, with evidence and an immutable decision log.

$$
\begin{aligned}
1.\;&\neg\operatorname{compatible}(\mathcal R_1)\Rightarrow
 \text{return rejected with failing predicate}.\\
2.\;&\text{Execute bounded isolated shadow validation; any forbidden side effect or contract failure}\\
 &\Rightarrow\text{disable shadow, preserve evidence, return rejected}.\\
3.\;&\text{For each stage }s\in S\text{ once, initialize stage-specific statistics/alpha; assign eligible units by the frozen rule;}\\
 &\text{collect by immutable release and assignment identity until its finite deadline/cap}.\\
4.\;&\text{Hard safety/resource gate fails or some }L_j>\delta_j
 \Rightarrow\text{fence candidate admission, drain/cancel by contract, return rejected}.\\
5.\;&\text{All required mature endpoints satisfy }U_j<\delta_j
 \text{ and minimum coverage holds}\Rightarrow\text{advance stage};\\
 &\text{otherwise at the cap, fence new candidate exposure and return inconclusive}.\\
6.\;&\text{After final stage, atomically publish the routing epoch and release decision; return promoted}.
\end{aligned}
$$

(Eq. 47.12)

[DERIVED] Its invariant is that every exposed request names an approved tuple and assignment epoch; unobserved quality is never treated as a passing endpoint. A controller crash resumes from the durable decision log. Stage transitions need compare-and-swap or equivalent fencing so two controllers cannot independently expand exposure. Rollback mechanics and partially completed requests are developed in [47.5](47-5-recovery.md).

## Implementation

[DERIVED] AI_REFERENCE_STACK §4 **#17 PyTorch**, layer **Model / autograd framework**, **#41 vLLM**, layer **Inference engine**, and **#42 SGLang**, layer **Inference engine**, occupy different fields of Eq. 47.9. **#1 NVIDIA CUDA**, layer **Accelerator / driver / compiler**, and **#4 NVIDIA NCCL**, layer **Kernels / numerics / collectives**, supply hardware/runtime compatibility dependencies. The release controller and shadow-side-effect sink are an engineering synthesis outside those entries.

[DERIVED] Immutable artifacts cost storage proportional to retained model/engine/build bytes and metadata; deduplication can reduce repeated content but does not eliminate retention policy. Shadowing fraction $p$ adds approximately $p\lambda$ requests/s of model work before any reuse, with separate prompt/output token distributions and KV state. It can double inference work for fully mirrored traffic even if users receive only one answer. Shared-weight execution saves weight capacity only when the implementation supports safe sharing; it does not erase private runtime or KV memory.

[DERIVED] Canary resource costs include reserved control capacity, candidate warm-up, graph capture, cache warm-up, and temporary duplicated artifacts. Communication includes artifact distribution and mirrored payloads. Latency/throughput perturbation depends on whether arms share devices, network, cache, and admission. Energy and money must include these temporary resources and failed-stage work. No inspected source supplies a workload-independent release-control overhead or optimal canary fraction.

## Experimental design

### Methodology

[OFFICIAL-DOCUMENTATION] Google's worked procedure compares candidate and control metrics, emphasizes representative traffic and adequate duration, and notes that workload/load changes can affect attribution. It is operational guidance and an illustrative application, not a randomized LLM-quality trial. [R47.4, “Choosing a Canary Population” and “Metrics Should Be Representative and Attributable”]

### Reported experiments

[OFFICIAL-DOCUMENTATION] The worked candidate's error-rate arithmetic demonstrates why global metrics can hide concentrated candidate harm. It does not report task labels, inference hardware, confidence intervals, or statistical power. Equation 47.10 supplies an independently derived repeated-look safeguard; it is not attributed to the workbook. [R47.4, worked App Engine example]

[OFFICIAL-DOCUMENTATION] Current vLLM batch-invariance documentation describes a beta execution mode with deterministic kernels and disabled optimizations on specified platforms/models. This is a compatibility option for controlled comparisons, with a possible performance cost, rather than evidence that every release is bitwise reproducible. [R47.10, “Hardware Requirements”, “Tested Models” and “Implementation Details”]

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The operational source argues that limited candidate exposure and per-version evaluation reduce release risk while providing evidence for promotion. It is documentation rather than a research paper. [R47.4]

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] Its deliberately defective candidate can be hidden in a global metric and exposed by version-specific comparison. The example does not quantify inference-specific quality or optimal exposure. [R47.4, Figures 16-3–16-4]

**What we infer.** [DERIVED] Immutable tuples, isolated shadows, stable assignment, and explicit sequential gates address distinct failure mechanisms. Their composition is useful only when compatibility and statistical premises are tested separately.

**What remains unknown.** [NOT-DISCLOSED] There is no source-supported universal duration, traffic fraction, or endpoint set that guarantees an inference release is safe across workloads and shared-resource conditions.

## Failure modes

[DERIVED] Repeated fixed-sample significance tests create excess false alarms. A candidate can also “win” by changing output length, refusal behavior, or which requests finish. Shared caches and queues contaminate control outcomes. Shadow tools can cause duplicate real-world effects. A rollback pointer to a mutable model tag can load different bytes than the original control. Each failure breaks a specific release or inference premise.

## Siblings

[DERIVED] Offline paired replay controls inputs but omits live load and user adaptation. Shadowing sees current inputs but cannot directly measure users' reactions to unseen answers. Canaries observe actual exposure but add selection/interference concerns. Staged rollout tests broader operating regimes while limiting exposure; it does not make early-stage evidence representative by definition.

```figure
{
  "id": "fig-47.11",
  "kind": "compare",
  "title": "Release evidence boundaries",
  "caption": "Current inputs, actual exposure and controlled replay offer different evidence.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.12",
  "alt": "Current inputs, actual exposure and controlled replay offer different evidence. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "axis": "Question answered and missing behavior",
    "columns": [
      {
        "id": "m",
        "label": "Offline replay"
      },
      {
        "id": "t",
        "label": "Shadow"
      },
      {
        "id": "p",
        "label": "Canary"
      }
    ],
    "rows": [
      {
        "dimension": "Inputs",
        "values": {
          "m": "fixed archived cohort",
          "t": "mirrored current traffic",
          "p": "assigned live units"
        }
      },
      {
        "dimension": "User reaction",
        "values": {
          "m": "absent",
          "t": "unseen candidate",
          "p": "observed but delayed"
        }
      },
      {
        "dimension": "Main threat",
        "values": {
          "m": "distribution mismatch",
          "t": "side effects / interference",
          "p": "assignment / spillovers"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage moves from process deployment to content-addressed execution tuples, then isolated shadow comparison and statistically accountable exposure. A major open question is how to estimate release effects when model candidates compete for shared caches and accelerators. Settling evidence requires experiments that vary isolation and assignment unit, measure spillovers on the control, and distinguish direct candidate harm from system-wide interference.

## Limitations

[DERIVED] Eq. 47.10 is a transparent conservative guarantee under a narrow model. It may need too many samples for rare failures, and a passed average endpoint can conceal subgroup harm. A finite list of endpoints cannot prove absence of unknown defects. Hard operational stops and independent safety review can therefore coexist with statistical gates without being misrepresented as statistical conclusions.

## Reproducibility

[UNVERIFIED] No canary, shadow, or sequential test was executed here. Required artifacts are both immutable tuples, eligibility/assignment rules, endpoint definitions, bounded-loss transformations, mature-label cutoffs, alpha allocation, stage caps, side-effect isolation policy, decision logs, and cache/routing epochs. The proposed implementation exercise appears only in [verification](verification.md).

## References

[DERIVED] [R47.4, Canarying Releases](https://sre.google/workbook/canarying-releases/); [R47.10, vLLM batch invariance](https://docs.vllm.ai/en/stable/features/batch_invariance/); [R47.11, PyTorch reproducibility](https://docs.pytorch.org/docs/2.14/notes/randomness.html). Exact mutable/pinned status is in [references](references.md).
