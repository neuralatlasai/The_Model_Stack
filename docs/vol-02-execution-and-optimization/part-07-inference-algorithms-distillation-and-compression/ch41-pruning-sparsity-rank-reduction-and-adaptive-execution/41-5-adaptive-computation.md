---
id: "ms.section.41.5"
entity_type: "section"
title: "41.5 — Adaptive computation"
volume: 2
part: 7
chapter: 41
section: 41.5
slug: "41-5-adaptive-computation"
parent: "ms.chapter.41"
prev_sibling: "ms.section.41.4"
next_sibling: "ms.section.41.6"
children: []
prerequisites: ["ms.chapter.13","ms.chapter.14","ms.chapter.15","ms.chapter.16","ms.chapter.17","ms.chapter.25","ms.chapter.26","ms.chapter.27","ms.chapter.28","ms.chapter.39","ms.chapter.40"]
downstream: ["ms.chapter.42","ms.chapter.43","ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle":["inference","adaptation"],"mechanism":["pruning","sparsity","adaptive_computation"],"feedback_setting":[],"modality":["text","image"]}
papers: []
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.nvidia-cutlass","impl.nvidia-cuda"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 41.5 — Adaptive computation

## Scope

[DERIVED] Adaptive computation selects work as a function of input or intermediate state. This section owns early exit, token/patch pruning, dynamic depth, conditional execution routing, and quality-constrained policies. The baseline executes the full declared graph for every input. Success is a controlled quality–resource frontier with correct causal state, including routing and batching overhead. Search across alternative generated responses belongs to Chapter 38; exact speculative acceptance belongs to Chapter 37.

## Why this exists

[MATHEMATICALLY-DERIVED] A static compressed model pays its retained cost on every token. A dynamic policy can reserve greater depth for some tokens, but this changes intermediate states, future cache contents, and batch occupancy. Average active layers are therefore neither an accuracy guarantee nor a wall-clock-speed measurement. Avoiding one block can also remove information that a later token would have attended to.

[PAPER-REPORTED] CALM identifies local confidence, sequence-level quality control, and missing hidden states after earlier exits as separate problems [R41.12](references.md), §§3–4. Mixture-of-Depths fixes the number of tokens admitted to a block while learning their identities [R41.11](references.md), §3. LayerSkip trains early representations for a shared output head and can verify early drafts with later layers [R41.13](references.md), §4. These policies have different correctness contracts.

## Intuition

[MATHEMATICALLY-DERIVED] A gate saves arithmetic only if the gated branch is not executed. Multiplying its computed output by zero saves no producer work. Fixed-capacity routing can preserve predictable tensor shapes while changing token identities; confidence-based exit changes the number of active examples and requires compaction or wasted padding. The policy's information set matters as much as its budget: selecting a token based on future tokens leaks unavailable information in autoregressive inference.

## Formulation

| Symbol | Meaning |
|---|---|
| $a_{\ell t}\in\{0,1\}$ | Whether token $t$ executes block $\ell$ |
| $c_{\ell t}$ | Confidence statistic available after block $\ell$ |
| $e_t\in\{1,\ldots,L\}$ | Token's exit depth |
| $k_\ell,T_\ell$ | Admitted token capacity and incoming token count |
| $\xi$ | Execution-policy threshold/configuration; distinct from global loss weight $\lambda$ |
| $\ell_i(\xi)\in[0,1]$ | Bounded sequence-level excess-risk/dissimilarity on calibration example $i$ |
| $n_{\rm cal},J,\varepsilon$ | Independent calibration examples, fixed candidate count, failure probability |

[MATHEMATICALLY-DERIVED] A dynamic residual block is
$$
h_{\ell+1,t}=h_{\ell,t}+a_{\ell t}F_\ell(h_{\ell,\cdot})_t.
$$
*(Eq. 41.25)*

The notation exposes cross-token dependence: attention for an admitted token depends on which keys and values exist. Early exit imposes $a_{\ell t}=\mathbf1[\ell\le e_t]$; dynamic depth can skip a middle block and later re-enter computation.

[MATHEMATICALLY-DERIVED] For $k$ admitted tokens instead of $T$ in a self-attention block, projection/FFN arithmetic scales approximately as $k/T$ and admitted-pair arithmetic as $(k/T)^2$, when both queries and keys are restricted. If queries alone are reduced while all keys remain, pair arithmetic instead scales as $k/T$. These are different policies, not interchangeable savings formulas.

```figure
{
  "id": "fig-41.15",
  "kind": "diagram",
  "title": "Exit, bypass, and token removal",
  "caption": "These policies change different state transitions. An exit omits all later blocks; a bypass can re-enter; token removal changes subsequent attention participants.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.25",
  "alt": "A token can execute a block, bypass it on the residual path and rejoin later, or exit to an output head. Token removal is a separate branch changing the admitted token set.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "h",
        "kind": "tensor",
        "label": "current token state"
      },
      {
        "id": "g",
        "kind": "branch",
        "label": "causal policy"
      },
      {
        "id": "f",
        "kind": "process",
        "label": "execute block"
      },
      {
        "id": "b",
        "kind": "flow",
        "label": "residual bypass"
      },
      {
        "id": "n",
        "kind": "state",
        "label": "next layer"
      },
      {
        "id": "e",
        "kind": "process",
        "label": "early output head"
      },
      {
        "id": "r",
        "kind": "state",
        "label": "token removed"
      }
    ],
    "edges": [
      {
        "from": "h",
        "to": "g"
      },
      {
        "from": "g",
        "to": "f"
      },
      {
        "from": "f",
        "to": "n"
      },
      {
        "from": "g",
        "to": "b"
      },
      {
        "from": "b",
        "to": "n"
      },
      {
        "from": "g",
        "to": "e"
      },
      {
        "from": "g",
        "to": "r"
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.16",
  "kind": "calculator",
  "title": "Finite-policy calibration penalty",
  "caption": "Analytical Hoeffding union bound for independent bounded sequence losses and a policy family fixed before calibration. It is not CALM's stronger deployed test.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.26",
  "alt": "Calculator displays the confidence radius square root of log J over epsilon divided by twice the number of independent calibration examples.",
  "spec": {
    "tex": "r=\\sqrt{\\log(J/\\varepsilon)/(2n_{cal})}",
    "equation": "41.26",
    "inputs": [
      {
        "symbol": "J",
        "label": "fixed candidate policies",
        "default": 20,
        "min": 1,
        "max": 100,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "ncal",
        "label": "independent examples",
        "default": 1000,
        "min": 100,
        "max": 100000,
        "step": 100,
        "format": "integer"
      },
      {
        "symbol": "eps",
        "label": "failure probability",
        "default": 0.05,
        "min": 0.01,
        "max": 0.1,
        "step": 0.01,
        "format": "fixed2"
      }
    ],
    "outputs": [
      {
        "symbol": "rad",
        "label": "risk confidence radius",
        "formula": "sqrt(ln(J/eps)/(2*ncal))",
        "format": "fixed2",
        "emphasis": true
      }
    ]
  }
}
```
```figure
{
  "id": "fig-41.17",
  "kind": "stat-panel",
  "title": "Fixed-capacity arithmetic ratios",
  "caption": "Illustrative admitted fraction one half. Restricting both queries and keys quarters pair arithmetic; restricting queries alone halves it.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-41.25",
  "alt": "For an illustrative admitted token fraction one half, projection work ratio is one half, both-query-and-key pair-work ratio is one quarter, and query-only pair-work ratio is one half.",
  "spec": {
    "header": "ADMITTED TOKEN FRACTION",
    "variables": {
      "q": 0.5
    },
    "rows": [
      {
        "key": "projection-work ratio",
        "formula": "q",
        "format": "fixed2"
      },
      {
        "key": "query-and-key pair ratio",
        "formula": "q^2",
        "format": "fixed2"
      },
      {
        "key": "query-only pair ratio",
        "formula": "q",
        "format": "fixed2"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] **Early exit** computes a confidence statistic after a subset of layers and stops when $c_{\ell t}$ exceeds a threshold. Training must make intermediate states usable by the output head, either through shared-head supervision or a source-specific exit classifier. A high maximum probability alone is not calibrated sequence quality. Even agreement with the final layer means agreement with the parent, not factual correctness. Different sequence lengths and domains change the cost and risk of a local mistake.

[PAPER-REPORTED] CALM studies softmax-margin, hidden-state-saturation, and learned-classifier confidence; it calibrates thresholds against bounded sequence-level consistency using Learn then Test with family-wise error control [R41.12](references.md), §§3.5–4, Proposition 1. It also propagates states for skipped layers. Its guarantee requires the source's sampling and bounded-loss conditions and does not certify shifted deployment data.

[MATHEMATICALLY-DERIVED] A simple simultaneous alternative illustrates the statistical requirement without reproducing CALM's more powerful test. For $J$ policies fixed independently of calibration examples, Hoeffding plus a union bound gives
$$
U_j=\frac1{n_{\rm cal}}\sum_{i=1}^{n_{\rm cal}}\ell_i(\xi_j)
+\sqrt{\frac{\log(J/\varepsilon)}{2n_{\rm cal}}},\qquad
\Pr\!\left(\forall j:\mathbb E[\ell(\xi_j)]\le U_j\right)\ge1-\varepsilon.
$$
*(Eq. 41.26)*

The observations must be independent and identically distributed bounded examples; individual tokens within one response are not independent samples. Selecting the least-cost policy with $U_j\le\delta$ preserves this simultaneous guarantee. Repeatedly inventing new policies after observing calibration outcomes invalidates the fixed-family argument. The full-depth fallback has zero parent-disagreement by construction, but can still make task errors.

[DERIVED] **Missing-state handling** is an essential early-exit mechanism. A later token reaching deep layer $\ell$ may need keys/values for an earlier token that stopped shallowly. Copying or projecting shallow states introduces an approximation; reconstructing missing layers spends additional compute; constraining exit schedules can restrict the policy. Zero-filling missing cache entries silently changes attention and is not an acceptable unspecified implementation. Cache validity must track which representations were actually generated and by which policy.

[PAPER-REPORTED] LayerSkip combines depth-dependent layer dropout with shared-head intermediate losses, then uses early layers as a draft and remaining layers for verification while reusing early-layer state [R41.13](references.md), §§4.1–4.3. Verification changes the semantic contract relative to accepting an early prediction directly. The mathematical distribution-preservation requirements remain those of [speculative decoding](../ch37-decoding-constrained-generation-and-speculative-execution/37-5-speculative-decoding.md), not a consequence of dropout training.

[DERIVED] **Token/patch pruning** removes selected token representations from subsequent computation. Vision classification can retain a class token and a fixed number of image tokens while dropping others. Dense prediction, localization, video, and action tasks require spatial/temporal correspondence beyond a classification score; preserving class accuracy does not establish those contracts. Retaining original positional identifiers matters: compacting token storage is not permission to renumber physical image positions.

[PAPER-REPORTED] DynamicViT uses local and pooled-global token features to predict keep/drop probabilities, trains with differentiable attention masking, and progressively removes tokens at inference according to prescribed ratios [R41.14](references.md), §3, Eqs. 1–14. Training keeps a masked graph for differentiation; inference gathers retained tokens. Its ratio loss, teacher-feature loss, and output KL are separate training components rather than an assertion that attention magnitude is a sufficient importance score.

[MATHEMATICALLY-DERIVED] At three stages with identical keep fraction $q$, retained counts are approximately $qT,q^2T,q^3T$ with rounding and protected tokens added. Arithmetic depends on how many blocks follow each stage, not merely on final retained count. A token removed late saves fewer block operations than the same token removed early. Gather/scatter traffic costs $O(Td_{\rm model})$ per pruning stage and positional metadata costs $O(T)$ indices.

[DERIVED] **Dynamic depth and conditional routing** retain tokens on a residual path when not selected for a block. This permits re-entry at later blocks, unlike monotone early exit. A top-$k_\ell$ router gives exact capacity during training. The selection itself costs at least a score pass and a top-$k$ operation, typically $O(T_\ell\log k_\ell)$ with a heap-style bound or a source-specific parallel selection. Small routed matrices may lose more hardware efficiency than the arithmetic saved.

[PAPER-REPORTED] Mixture-of-Depths selects a fixed token capacity with expert-choice-style top-$k$ routing and addresses the noncausal top-$k$ decision during autoregressive sampling through predictive routing [R41.11](references.md), §§3.3–3.6. The selected tokens participate in both attention and FFN. Its training router and inference router therefore require separate evaluation; fixed capacity does not make the token-selection decision causal automatically.

[MATHEMATICALLY-DERIVED] **Quality-aware execution** minimizes expected resource use subject to a declared risk constraint:
$$
\min_\xi\mathbb E[\mathsf{cost}_\xi(x)]
\quad\text{subject to}\quad
\mathbb E[\ell_\xi(x)]\le\delta,\quad
\mathsf{stateValid}_\xi(x)=1.
$$
*(Eq. 41.27)*

An expected-risk constraint can hide rare severe regressions; grouping by domain or task changes the statistical problem and needs corresponding calibration. A latency SLO additionally depends on queueing, concurrency, and tail behavior. Policies that reduce mean arithmetic can increase tail latency through irregular batch composition.

[MATHEMATICALLY-DERIVED] Parameter memory usually stays near the full optional graph because some requests can still take every path. Activation and KV savings depend on state policy; they are not proportional to average executed layers unless every skipped state is truly unnecessary. Training consumes extra loss-head or router computation, possibly backward through multiple exits. Inference adds confidence evaluation, compaction, state repair, and dispatch. Distributed dynamic routing can communicate indices and uneven payloads; energy and money remain workload measurements, not functions of expected depth alone.

## Algorithm

### Algorithm 41.5 — Causal early-exit controller with explicit state completion

[DERIVED] Inputs are a trained multi-exit model, a calibrated fixed threshold $\xi$, a state-completion contract $\mathsf C$, and maximum output length $S_{\max}$. Outputs are tokens and a valid policy-tagged state trace. This reference accepts approximate early exits; exact verification is a distinct branch.

$$
\begin{aligned}
1.\;&t\leftarrow1;\quad \mathcal K\leftarrow\mathsf{prefill}_{\mathsf C}(x_{1:S_p-1});\quad y_0\leftarrow x_{S_p}.\\
2.\;&h\leftarrow\mathsf{embed}(y_{t-1});\quad\ell\leftarrow1.\\
3.\;&\mathcal K_\ell\leftarrow\mathsf C(\mathcal K_\ell,\text{required prefix});
\quad\neg\mathsf{valid}(\mathcal K_\ell)\Rightarrow
(\mathsf{discardPendingCurrentTokenWrites};\ \mathsf{fullDepthFallback}).\\
4.\;&h\leftarrow\mathsf{block}_\ell(h,\mathcal K_\ell);
\quad c\leftarrow\mathsf{confidence}_\ell(h).\\
5.\;&c<\xi\land\ell<L\Rightarrow(\ell\leftarrow\ell+1;\ \text{return to }3).\\
6.\;&y_t\leftarrow\mathsf{decode}_\ell(h);
\quad \mathcal K\leftarrow\mathsf{commit}_{\mathsf C}(\mathcal K,h,\ell).\\
7.\;&y_t=\mathsf{EOS}\lor t=S_{\max}\Rightarrow\mathsf{return};
\quad t\leftarrow t+1;\ \text{return to }2.
\end{aligned}
$$
*(Eq. 41.28)*

[DERIVED] Here $S_p$ is prompt length. Prefill caches only the first $S_p-1$ prompt tokens; the final prompt token $y_0$ is processed exactly once in the first loop to produce the first generated token. For an empty prompt, initialize an empty cache and set $y_0$ to the declared beginning-of-sequence token. The invariant is that every attention read has a representation justified by $\mathsf C$ and causal prefix data. Normal execution uses at most $L$ block evaluations per token plus explicitly bounded state repair. A fallback discards all uncommitted current-token writes before restarting from the last committed prefix and may restart full-depth execution once, giving at most $2L$ current-token block evaluations; a second failure terminates the request. Total generation is length bounded. If state repair itself requires unbounded recomputation, the contract is incomplete.

## Implementation

[DERIVED] **PyTorch — Model / autograd framework** and **Hugging Face Transformers — Model definition / adaptation** provide operator and model substrates, but a generic forward method is not a verified adaptive runtime. Token compaction needs index maps, stable positions, valid attention masks, and workspaces. Dynamic exit batches need active-sequence lists; keeping exited examples padded through every block preserves the old cost. CUDA graph capture requires a compatible shape strategy, such as fixed capacity or shape buckets, with any extra padding charged.

[PAPER-REPORTED] LayerSkip explicitly reuses an early-layer KV/query state in self-verification [R41.13](references.md), §4.3.3. That source-specific cache design is not evidence that arbitrary intermediate-layer skipping can reuse all activations identically. **NVIDIA CUDA — Accelerator / driver / compiler** supplies execution primitives; exact launch and capture behavior for these manuscripts is UNVERIFIED.

## Experimental design

### Reported experiments

[PAPER-REPORTED] CALM evaluates eight-layer T5 generation on CNN/DM, WMT15 English–French, and SQuAD; it reports ROUGE-L, BLEU or bounded BLEURT-based risk, and token F1. Calibration uses 50 random 80/20 calibration/test partitions with failure probability 0.05 [R41.12](references.md), §5. Its main efficiency metric is executed decoder layers; its reference whole-model speed estimate has a separate TPUv3 benchmarking boundary.

[PAPER-REPORTED] DynamicViT trains on ImageNet's training set and evaluates single-crop top-1 on 50,000 validation images. With DeiT-S and three-stage keep ratio 0.7, it reports top-1 79.3% versus 79.8% dense and arithmetic 2.9 versus 4.6 GFLOPs [R41.14](references.md), Table 1 and Appendix A. Static, random, and attention-score selection ablations hold arithmetic near the same budget [R41.14](references.md), Table 4.

[PAPER-REPORTED] LayerSkip separates continual pretraining, from-scratch training, code tuning, and task tuning, and ablates dropout versus intermediate supervision [R41.13](references.md), §§5–7. In Table 2, direct shallow exits substantially reduce summarization quality, while self-verification retains much more of the parent behavior. This is a useful negative control for accepting early predictions without verification.

## Observations

**What the paper claims.** [PAPER-REPORTED] CALM claims calibrated sequence-consistency control under its conditions; DynamicViT claims an ImageNet quality/compute trade-off; MoD claims efficient learned allocation under fixed capacity [R41.12](references.md), §4; [R41.14](references.md), §4; [R41.11](references.md), §4.

**What the evidence shows.** [DERIVED] Each result concerns a different risk metric, architecture, and execution boundary. An average active-depth result cannot be substituted for measured end-to-end throughput or long-context reliability.

**What we infer.** [MATHEMATICALLY-DERIVED] Equation 41.26 explains why calibrating on a fixed independent policy family differs from selecting the most attractive empirical threshold without multiplicity control.

**What remains unknown.** [UNVERIFIED] Current serving-engine compatibility, production drift, policy-specific energy, and worst-case state-repair overhead have not been measured in this edition.

## Failure modes

> **Failure mode — Noncausal router.** [DERIVED] *Symptom:* teacher-forced evaluation exceeds autoregressive quality. *Cause:* sequence-global selection accesses future token scores. *Detection:* trace each selection's available information. *Mitigation:* use and evaluate a causal predictive policy.

> **Failure mode — Empty deep cache.** [DERIVED] *Symptom:* deep later tokens read absent or misaligned prefix state. *Cause:* early exit omitted required representations. *Detection:* policy-tagged cache validity checks. *Mitigation:* implement the declared completion or fallback rule.

## Siblings

[DERIVED] [Static depth pruning](41-3-structural-reduction.md) reduces every input's graph and often parameter memory. Early exit retains optional deep layers. [Inference-time search](../ch38-inference-time-reasoning-search-and-adaptive-compute/README.md) allocates work over candidate trajectories; dynamic depth allocates work inside one forward trajectory. Exact [speculation](../ch37-decoding-constrained-generation-and-speculative-execution/37-5-speculative-decoding.md) can correct draft errors under an explicit acceptance algorithm; unverified early exit changes the model distribution.

## Extensions

### Improvements

[PAPER-REPORTED] LayerSkip changes intermediate training and adds reusable self-verification relative to ordinary early exits [R41.13](references.md), §§4 and 7. MoD changes monotone halting into nonmonotone per-block participation while bounding training capacity [R41.11](references.md), §3. Neither establishes universal superiority: the former adds verification work and the latter adds routing mismatch and state complexity.

## Limitations

[DERIVED] Guarantees on bounded parent-consistency do not establish safety, factual correctness, or worst-case per-example quality. Vision token-removal evidence from classification does not transfer automatically to dense spatial tasks. Dynamic execution needs its own threat and reliability boundary because routing controls which information and states survive.

## Reproducibility

[UNVERIFIED] No adaptive runtime was executed. Required artifacts include trained exit/router checkpoints, calibration split identifiers, fixed candidate policy family, confidence definition, bounded risk, multiplicity procedure, position maps, state-completion rule, concurrency, and actual kernel traces. Source versions and locators appear in [references.md](references.md).

## References

[R41.11](references.md), Mixture-of-Depths §3–4; [R41.12](references.md), CALM §3–6; [R41.13](references.md), LayerSkip §4–7; [R41.14](references.md), DynamicViT §3–4 and Appendix A.
