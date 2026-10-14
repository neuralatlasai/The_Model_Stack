---
id: "ms.section.47.4"
entity_type: "section"
title: "47.4 — Regression localization"
volume: 2
part: 8
chapter: 47
section: 47.4
slug: "47-4-regression-localization"
parent: "ms.chapter.47"
prev_sibling: "ms.section.47.3"
next_sibling: "ms.section.47.5"
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

# 47.4 — Regression localization

## Scope

[DERIVED] Regression localization narrows a behavioral or performance change to evidence-supported mechanisms. Candidate causes include data/model updates, numerical representation, templates, kernel/compiler changes, caching, and serving policy. The objective is not to produce the most plausible story quickly; it is to distinguish observations from competing explanations while preserving enough evidence to test the leading hypotheses.

## Why this exists

[DERIVED] Most deployed changes are bundles. A new model arrives with a new tokenizer, engine build, quantized artifact, and scheduler configuration. Quality and latency may move simultaneously because outputs become longer. Rolling back the bundle can restore service but cannot identify which component caused the regression. Localization therefore needs immutable release differences, workload-conditioned comparisons, and targeted interventions with clear boundaries.

[DERIVED] A single failed request is also ambiguous. Wrong output can originate in retrieval/data, tokenization, numerical execution, cached state, generation policy, or publication. An apparently slow kernel can reflect a changed batch shape caused by upstream scheduling. Instrumentation should preserve these intermediate representations and causal ordering at a bounded sampling rate; an end-to-end score alone cannot separate the mechanisms.

## Intuition

[DERIVED] Compare the same conceptual pipeline at successive boundaries: raw input, rendered input, token IDs, numerical artifact, execution shape, logits or controlled token decisions, emitted tokens, and visible response. Find the earliest boundary where candidate and control diverge beyond the expected tolerance, then test whether that divergence explains the observed failure. An earlier difference is a useful localization clue, not automatically the root cause.

```figure
{
  "id": "fig-47.12",
  "kind": "diagram",
  "title": "Earliest divergence is a diagnostic lead",
  "caption": "Matched release and input identities support boundary comparisons; a divergence still needs a mechanism and falsifier.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.15",
  "alt": "Matched release and input identities support boundary comparisons; a divergence still needs a mechanism and falsifier. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "i",
        "kind": "state",
        "label": "raw / rendered input"
      },
      {
        "id": "t",
        "kind": "process",
        "label": "token IDs"
      },
      {
        "id": "w",
        "kind": "memory",
        "label": "artifact / cache"
      },
      {
        "id": "g",
        "kind": "hardware",
        "label": "kernel and shape"
      },
      {
        "id": "o",
        "kind": "feedback",
        "label": "logits / output"
      }
    ],
    "edges": [
      {
        "from": "i",
        "to": "t",
        "kind": "flow"
      },
      {
        "from": "t",
        "to": "w",
        "kind": "flow"
      },
      {
        "from": "w",
        "to": "g",
        "kind": "flow"
      },
      {
        "from": "g",
        "to": "o",
        "kind": "flow"
      }
    ]
  }
}
```

[PAPER-REPORTED] Spectroscope groups structurally similar request flows and compares distributions between problem and nonproblem periods. It distinguishes structural changes from timing changes and ranks candidate mutations. Its six cases include real production changes and an injected spinning fault; these are storage/distributed-system cases, not LLM serving experiments. [R47.5, §§3–5 and 8]

## Formulation

[MATHEMATICALLY-DERIVED] Let $c$ denote a workload stratum with proportions $\pi_{v,c}$ and mean latency $\mu_{v,c}$ in version/period $v$. Adding and subtracting $\sum_c\pi_{0,c}\mu_{1,c}$ gives the exact decomposition

$$
 \mathbb E[T_1]-\mathbb E[T_0]
 =\sum_c\pi_{0,c}(\mu_{1,c}-\mu_{0,c})
  +\sum_c(\pi_{1,c}-\pi_{0,c})\mu_{1,c}.
$$

(Eq. 47.13)

[DERIVED] The first term is a reference-mixture within-stratum change; the second is a composition change under candidate conditional means. The decomposition is algebraic, not causal. It needs support for estimating $\mu_{1,c}$ where $\pi_{0,c}>0$; unseen strata require bounds or explicit exclusion. Coarse prompt-length bins can retain substantial confounding from context, output length, image processing, cache reuse, and tenant policy.

[DERIVED] Some useful conditioning variables are themselves consequences of the release. Conditioning on generated length or realized cache hit can remove a real effect or introduce selection bias. Use pre-treatment features for release-effect comparisons. Controlled output-token replay and forced cache states can still be diagnostic interventions, but then the estimand is a constrained execution question rather than the total user-facing release effect.

[MATHEMATICALLY-DERIVED] Recall the greedy-margin certificate from Chapters 40/43 for diagnosis: suppose reference and candidate logits $z,z'$ satisfy $\|z-z'\|_\infty\le\varepsilon$, and the reference greedy winner $j$ has margin
$m=z_j-\max_{k\ne j}z_k$. Then

$$
 z'_j-z'_k\ge z_j-z_k-2\varepsilon,\qquad
 m>2\varepsilon\Rightarrow \arg\max z'=\arg\max z=j.
$$

(Eq. 47.14)

[DERIVED] Near a decision boundary, small numerical differences can change a token and then alter all subsequent context. Thus token divergence alone does not prove a gross kernel defect. Conversely, a large logit discrepancy on matched tensors deserves investigation even when the sampled token happens to match. Sampling, ties, NaNs, and different vocabulary/order require separate guards. Eq. 47.14 covers finite logits and greedy selection only.

## Mechanism

[DERIVED] Data/model changes should be checked through artifact digests, dataset/evaluation cohort versions, adapter IDs, and input normalization. Template checks compare exact rendered bytes and token IDs, including special tokens and truncation. Numerical checks compare quantization scales/layouts and dequantized reference operations where feasible; the quantization mechanism belongs to Chapter 40, while this section asks whether the deployed artifact and kernel implement the intended one.

[DERIVED] Kernel/compiler localization records build flags, graph capture choices, attention backend, numerical precision, reduction order, and hardware architecture. Cache localization checks semantic keys, prefix ownership, reference counts, serialization format, and invalidation epochs. Serving-policy localization records admission, chunking, routing, batching, preemption and cancellation. These are candidates with distinct observables: a template affects token IDs before execution, whereas stale KV can change logits despite identical input tokens.

[OFFICIAL-DOCUMENTATION] PyTorch 2.14 documents that seeds alone do not guarantee reproducibility across releases/platforms, and deterministic execution can reduce performance. Current vLLM's beta batch-invariance mode changes kernel/collective execution and may disable optimizations. Therefore a deterministic diagnostic mode is a controlled execution setting, not proof that normal production mode is defective whenever it differs. [R47.11, “Reproducibility”; R47.10, “Implementation Details”]

```figure
{
  "id": "fig-47.13",
  "kind": "calculator",
  "title": "Greedy margin certificate",
  "caption": "Finite-logit bound only: a top-two margin above twice the maximum perturbation preserves the greedy winner.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-47.14",
  "alt": "Finite-logit bound only: a top-two margin above twice the maximum perturbation preserves the greedy winner. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "tex": "m>2\\varepsilon",
    "inputs": [
      {
        "symbol": "m",
        "label": "reference logit margin",
        "default": 0.1,
        "min": 0,
        "max": 10,
        "format": "fixed2"
      },
      {
        "symbol": "e",
        "label": "maximum absolute perturbation",
        "default": 0.02,
        "min": 0,
        "max": 5,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "g",
        "label": "margin minus perturbation bound",
        "formula": "m-2*e",
        "format": "fixed2",
        "emphasis": true
      }
    ]
  }
}
```

[DERIVED] A hypothesis ledger should state a predicted signature and a falsifier. “Template truncation changed” predicts different token IDs before prefill. “Cache namespace collision” predicts dependence on prior compatible-looking but semantically different requests and disappears with an isolated empty namespace. “Batch-shape numerical drift” predicts matched inputs with differences associated with shape/backend. A diagnosis that cannot name any observation that would contradict it is too flexible to be scientifically useful.

## Algorithm

### Algorithm 47.4 — Bounded regression localization

[DERIVED] Algorithm 47.4 performs bounded localization after containment. Inputs are immutable releases, authorized finite evidence cohort, finite hypotheses $H$, total diagnostic budget $B$, and deadline $D$. Initialize durable remaining budget $B_{\rm rem}=B$ and unresolved hypotheses. Output is an evidence ledger, not automatic causal certainty.

$$
\begin{aligned}
1.\;&\text{Validate release/input identities; missing evidence}\Rightarrow\text{return unidentified}.\\
2.\;&\text{Compare pre-treatment composition and boundary representations; record earliest divergence}.\\
3.\;&\text{For each }h\in H\text{ once, choose a declared check with worst-case cost }c_h;\\
 &c_h>B_{\rm rem}\text{ or unsafe/infeasible}\Rightarrow\text{mark untested; continue};\\
 &\text{atomically reserve }c_h:\ B_{\rm rem}\leftarrow B_{\rm rem}-c_h.\\
4.\;&\text{Execute in isolation with a timeout bounded by the remaining deadline};\\
 &\text{on timeout quiesce the check; retain failure evidence};\\
 &\text{reconcile actual cost }\widetilde c_h\le c_h:
 B_{\rm rem}\leftarrow B_{\rm rem}+c_h-\widetilde c_h.\\
5.\;&\text{Update supported/contradicted/unresolved status from predeclared signatures};\\
 &\text{at }D\text{ or exhausted budget, return alternatives and missing evidence};\\
 &\text{after the finite list, return the complete ledger}.
\end{aligned}
$$

(Eq. 47.15)

[DERIVED] Reservations include timeout/cleanup cost; a check without an enforceable cost cap is infeasible under this budget model. Containment and diagnosis remain separate. Rollback supports a changed-bundle hypothesis under controlled restoration, but can coincide with spontaneous recovery and does not establish causality. Missing baselines or redacted inputs return a limitation.

## Implementation

[DERIVED] AI_REFERENCE_STACK §4 **#17 PyTorch**, layer **Model / autograd framework**, **#41 vLLM**, layer **Inference engine**, **#1 NVIDIA CUDA**, layer **Accelerator / driver / compiler**, and **#4 NVIDIA NCCL**, layer **Kernels / numerics / collectives**, identify different localization boundaries. Spectroscope is a primary research method outside the catalog; its trace-comparison principles are adapted here, not claimed as an inference-engine feature.

[DERIVED] A trace comparison over $N$ requests and $k$ retained events has $O(Nk)$ input size before indexing. Exact structural comparison can be more expensive when parallel flows require canonicalization or edit-distance matching. Pairwise graph comparisons should not be casually labeled linear. Comparing selected logit vectors costs $O(V)$ per position for vocabulary size $V$, and retaining all logits costs $O(NtV)$ values for $t$ positions; bounded selections or summaries reduce cost but lose evidence.

[DERIVED] Diagnostic model runs add prompt/output FLOPs, weight traffic, KV capacity and communication according to the chosen topology. Disabling caches or deterministic fast paths can deliberately increase latency and energy, so diagnostic throughput is not a production performance estimate. GPU/host storage for tensor captures can dominate trace metadata. Monetary cost includes isolated replicas and secure evidence retention; no inspected source establishes a universal localization overhead.

## Experimental design

### Methodology

[PAPER-REPORTED] Spectroscope uses request-flow categories, timing distribution tests, structural count differences, and precursor matching. Its default per-comparison significance setting does not provide a global multiple-testing guarantee. Request categories also assume sufficiently similar work. For LLM adaptation, conditioning only on a common root endpoint leaves prompt and output heterogeneity unresolved. [R47.5, §§4–5 and 7]

### Reported experiments

[PAPER-REPORTED] One reported configuration-change case moved storage activity onto a metadata server after preallocation/distribution settings changed. Flow comparison and developer confirmation supported that diagnosis. The evaluation also measures category relevance and affected-request coverage; its injected cases must be distinguished from blind incident discovery. [R47.5, §§8.1–8.3]

[DERIVED] These source results support comparing causal execution structure, not a numerical claim about inference localization accuracy. The present chapter has no matched model/kernel experiment. A production endpoint with different prompt distributions, asynchronous publication, or speculative output bundles requires its own event schema and validation.

## Observations

**What the paper claims.** [PAPER-REPORTED] Comparing request-flow structure and timing can help diagnose performance changes that conventional aggregate metrics obscure. [R47.5, Abstract and §3]

**What the evidence shows.** [PAPER-REPORTED] The reported cases identify useful candidate mutations under the source's instrumentation and workloads, with both actual and injected problems. They do not establish universal causal identification. [R47.5, §8]

**What we infer.** [DERIVED] Boundary-by-boundary comparison is especially valuable for inference because tokenization, cached state and numerical execution can change independently. A predicted signature plus a discriminating intervention is stronger than temporal coincidence.

**What remains unknown.** [NOT-DISCLOSED] Localization reliability for long-context, multimodal, multi-tenant and nondeterministic inference workloads is not measured by these historical cases or this manuscript.

## Failure modes

[DERIVED] Simpson's paradox can make every relevant cohort improve while the aggregate worsens because traffic shifts. Treating output length as a harmless covariate can hide a model-induced cost increase. Turning caching off may remove a cache bug while also changing batch size and queueing. Deterministic mode may alter kernels enough to mask the original defect. A successful intervention must be interpreted with all of its changes, not only the intended one.

## Siblings

[DERIVED] Temporal bisection narrows the change window; artifact bisection narrows a build difference; paired tensor comparison narrows numerical divergence; causal-flow comparison narrows structural execution changes. Each assumes the relevant state can be reconstructed. None replaces population outcome monitoring when a regression affects only a small semantic subgroup.

```figure
{
  "id": "fig-47.14",
  "kind": "compare",
  "title": "Localization methods isolate different boundaries",
  "caption": "An intervention's changed conditions determine its diagnostic meaning.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.15",
  "alt": "An intervention's changed conditions determine its diagnostic meaning. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "axis": "Evidence narrowed and principal caveat",
    "columns": [
      {
        "id": "m",
        "label": "Artifact bisection"
      },
      {
        "id": "t",
        "label": "Tensor comparison"
      },
      {
        "id": "p",
        "label": "Flow comparison"
      }
    ],
    "rows": [
      {
        "dimension": "Narrows",
        "values": {
          "m": "changed build fields",
          "t": "numerical boundary",
          "p": "execution structure"
        }
      },
      {
        "dimension": "Needs",
        "values": {
          "m": "reconstructable releases",
          "t": "matched tensor inputs",
          "p": "compatible trace schema"
        }
      },
      {
        "dimension": "Cannot alone prove",
        "values": {
          "m": "one causal component",
          "t": "user-quality impact",
          "p": "semantic correctness"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage proceeds from aggregate symptom detection to flow-level differences and then inference-specific intermediate representations. An open research question is how to distinguish harmless numerical divergence from quality-relevant errors without storing all tensors or relying on a brittle judge. Settling evidence would connect matched numerical discrepancies, token-margin sensitivity, independent task outcomes and realistic resource budgets across kernels and workloads.

## Limitations

[DERIVED] Exact root cause may remain unidentified after safe mitigation. Missing input history, hidden external tool state, concurrent changes, and shared-resource feedback can prevent clean interventions. A precise statement of supported mechanisms and remaining alternatives is more defensible than promoting an operationally convenient explanation to certainty.

## Reproducibility

[UNVERIFIED] No localization experiment was executed. Reproduction needs candidate/control tuples, cohort eligibility, rendered inputs/token IDs where authorized, cache initial conditions, tensor tolerances, numerical modes, event schemas, diagnostic budgets, and the complete hypothesis ledger including negative checks. Proposed template/cache regression injection remains in [verification](verification.md).

## References

[DERIVED] [R47.5, Spectroscope](https://www.usenix.org/legacy/events/nsdi11/tech/full_papers/Sambasivan.pdf), §§3–5, 7–8; [R47.10, batch invariance](https://docs.vllm.ai/en/stable/features/batch_invariance/); [R47.11, reproducibility](https://docs.pytorch.org/docs/2.14/notes/randomness.html). Source-derived historical case prose is kept compact; the inference adaptations and derivations are original synthesis.
