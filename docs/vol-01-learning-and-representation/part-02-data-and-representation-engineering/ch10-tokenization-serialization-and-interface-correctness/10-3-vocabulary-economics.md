---
id: ms.section.10.3
entity_type: section
title: Vocabulary economics
short_title: Fertility, heads, break-even
volume: 1
part: 2
chapter: 10
section: 10.3
slug: 10-3-vocabulary-economics
parent: ms.chapter.10
prev_sibling: ms.section.10.2
next_sibling: ms.section.10.4
children: []
prerequisites: [ms.section.5.6, ms.section.9.5, ms.section.10.1, ms.section.10.2]
downstream: [ms.section.13.5, ms.section.15.4, ms.section.21.2, ms.section.42.2, ms.section.48.5, ms.section.50.2]
related: [ms.section.4.6]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.R10.10}
  - {type: supported_by, target: paper.R10.11}
  - {type: trades_off_with, target: concept.kv-state-accounting}
axes:
  lifecycle: [pretraining, inference, serving]
  mechanism: [tokenization, embedding, output_head, memory_accounting]
  feedback_setting: []
  modality: [text]
papers: []
implementations: [impl.hugging-face-transformers, impl.liger-kernel, impl.vllm]
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, DERIVED, ASSUMED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 2200
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 10.3 Vocabulary economics

## Scope

Objective: account for every cost that the vocabulary size V touches — embedding and output-head parameters, logits memory and softmax FLOPs, realised sequence length through token fertility, and the KV-cache consequence through Eq. N.8 — and derive the condition under which enlarging V lowers total cost. Baseline: the widely repeated claim that a larger vocabulary reduces sequence cost, which `book_plan.md` lists as a correction to enforce: the reduction is conditional and must be measured jointly with the parameter and logits costs. Success criterion: the reader can evaluate the break-even inequality (Eq. 10.12) for a given model and fertility curve, and can state the cross-lingual cost inequity in the units a serving bill uses. Boundaries: how the head is parameterised and tied ([§13.5](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-5-embeddings-and-heads.md)); compute-optimal allocation across N and D ([§21.2](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md)); cache accounting ([§42.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-2-state-accounting.md)); mixture-level fertility as a data decision ([§9.5](../ch09-data-mixtures-curricula-and-sample-efficiency/09-5-multilingual-and-specialist-mixtures.md)).

## Why this exists

What failed before was single-axis reasoning. Vocabulary sizes were inherited or chosen for compression alone: PAPER-REPORTED (R10.11, §1): scaling laws "usually disregard the impact of the vocabulary size. For example, in Kaplan et al. only non-vocabulary parameters are considered in their predictive formula. This negligence has resulted in substantial variability in the vocabulary size of current LLMs." The bottleneck appeared in two places at once. At the head, the `[B, T, V]` logits tensor and the `V × d_model` projection became a memory and FLOP term comparable to a transformer block; at the input, multilingual text under an English-tuned vocabulary consumed several times the tokens of English for the same content. PAPER-REPORTED (R10.10, abstract): "The same text translated into different languages can have drastically different tokenization lengths, with differences up to 15 times in some cases." The dominant constraint is that these two costs move in opposite directions under V and neither is small. What changed in the solution is joint accounting: PAPER-REPORTED (R10.11): "the optimal vocabulary size depends on the compute budget, with larger models requiring larger vocabularies", derived from IsoFLOPs sweeps in which "we break down the total model parameters (N) into non-vocabulary (N_nv) and vocabulary parameters (N_v)". This section formalises that accounting as a break-even inequality rather than a fitted constant.

## Intuition

Physically, V buys rows and sells positions. Each row costs `d_model` parameters in the embedding and, untied, another `d_model` in the head; each position costs a full forward pass. A row is worth buying only if the positions it saves — across the whole workload, weighted by how often the merged string occurs — outweigh its parameter, logits and softmax costs. The first thousand rows beyond bytes save enormous numbers of positions (common words); the hundred-thousandth row saves a few, on a rare string, in one language. So the marginal saving in fertility falls with V while the marginal cost per row is constant. The crossing point is the break-even, and it depends on the non-vocabulary size of the model: a larger model makes each position more expensive, so it can afford more rows. Heuristically, the vocabulary is a cache whose hit rate saturates. This paragraph is DERIVED from Eq. 10.8–10.12 below.

## Formulation

> **Definition — token fertility.** For a tokenizer 𝒯 and a text sample s, the number of tokens per unit of content: `f_𝒯(s) = |𝒯(s)| / |s|` with `|s|` measured in UTF-8 bytes (the book's default), characters, or whitespace-delimited words; the unit MUST be stated. Its inverse in bytes per token is the compression ratio; the cross-language ratio `|𝒯(s_A)| / |𝒯(s_B)|` for translations s_A, s_B is the *premium* of A relative to B (PAPER-REPORTED, R10.10, §3: "a tokenizer t achieves parity for A with respect to B at s_A and s_B if |t(s_A)|/|t(s_B)| ≈ 1. The ratio … is the premium for A relative to B").

$$
f_{\mathcal{T}}(s) = \frac{|\mathcal{T}(s)|}{|s|_{\text{bytes}}}, \qquad \pi_{A/B} = \frac{|\mathcal{T}(s_A)|}{|\mathcal{T}(s_B)|}
$$
*(Eq. 10.6)* where |𝒯(s)| = token count, |s|_bytes = UTF-8 byte count, π = premium. Fertility is a function of V through the tokenizer; write `f(V)` for its workload average.

$$
N_{\text{vocab}} = \begin{cases} 2\,V\,d_{\text{model}} & \text{untied embedding and head} \\ V\,d_{\text{model}} & \text{tied} \end{cases}
$$
*(Eq. 10.7)* where V = vocabulary size, d_model = residual width. MATHEMATICALLY-DERIVED from the shapes `[V, d_model]` of the two matrices ([§5.1](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-1-end-to-end-forward-pass.md)); tying is owned by [§13.5](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-5-embeddings-and-heads.md).

$$
M_{\text{logits}} = B\,T\,V\,b_{\text{logit}} \;\text{bytes}, \qquad F_{\text{head}} = 2\,V\,d_{\text{model}} \;\text{FLOPs per token (forward)}
$$
*(Eq. 10.8)* where B = sequences, T = tokens per sequence, b_logit = bytes per logit (4 in FP32, the dtype in which the loss is typically evaluated, [§3.2](../../part-01-scientific-foundations/ch03-numerical-computation-and-trustworthy-training/03-2-stable-primitives.md)). The softmax adds O(V) exponentials and one reduction per position. MATHEMATICALLY-DERIVED. The embedding gather costs no FLOPs: PAPER-REPORTED (R10.8, §3): "mapping an input token to its corresponding vector representation in the vocabulary matrix is essentially 'free' in terms of FLOPs since it can be implemented by addressing a particular row in memory."

$$
T(V) = f(V)\,\cdot\,|s|_{\text{bytes}}
$$
*(Eq. 10.9)* where T(V) = realised sequence length of a document of |s| bytes under vocabulary V. MATHEMATICALLY-DERIVED from Eq. 10.6.

$$
M_{KV}(V) = 2\,L\,H_{kv}\,d_h\,b\;\cdot\;T(V)
$$
*(Eq. 10.10)* where the per-token constant is Eq. N.8 divided by B·S. The cache has no V term; it is the one cost that a lower fertility reduces unconditionally. MATHEMATICALLY-DERIVED.

$$
C(V) = \big(a + c\,V\big)\;\cdot\;T(V)
$$
*(Eq. 10.11)* where a = per-token cost independent of V (for training FLOPs, a ≈ 6·N_nv per the C ≈ 6ND approximation stated with Eq. N.3; for forward-only inference, a ≈ 2·N_nv plus the per-token cache read), c = per-token cost per vocabulary row (6·d_model for training FLOPs counting the head; 2·d_model for forward FLOPs; b_logit·B for logits bytes). This is the joint cost the plan requires; PAPER-REPORTED (R10.11, §3) writes the training form as `C ≈ 6ND ≈ 6(N_nv + V d)·H·f(V)` with H the number of training characters and f the fertility per character.

Differentiating Eq. 10.11 and requiring `dC/dV < 0`:

$$
\varepsilon_f(V) \;:=\; -\frac{V\,f'(V)}{f(V)} \;>\; \frac{c\,V}{a + c\,V}
$$
*(Eq. 10.12)* where ε_f = the fertility elasticity (relative reduction in tokens per relative increase in V) and the right-hand side is the vocabulary's share of per-token cost. MATHEMATICALLY-DERIVED (derivation below). **A larger vocabulary lowers total cost only while the fertility elasticity exceeds the vocabulary's share of the per-token cost.** Because ε_f falls with V (the codebook saturates) and the share rises with V, the inequality holds up to a break-even V* and fails beyond it.

<details><summary>Derivation of Eq. 10.12</summary>

C(V) = (a + cV)·T(V). dC/dV = c·T(V) + (a + cV)·T'(V). With T(V) = f(V)·|s| and |s| fixed, T'/T = f'/f. Then dC/dV < 0 ⟺ c·T + (a + cV)·T' < 0 ⟺ −T'/T > c/(a + cV) ⟺ −V f'(V)/f(V) > cV/(a + cV). The right-hand side is (per-token vocabulary cost)/(total per-token cost). For c → 0 (a model whose head is negligible) the condition is ε_f > 0, i.e. any fertility reduction helps; for a → 0 (a model that is all head) the condition is ε_f > 1, i.e. tokens must fall at least proportionally to V, which no saturating codebook achieves.

</details>

> **Assumption.** f(V) is smooth and decreasing on the workload · *sensitivity:* on a workload disjoint from the tokenizer's training corpus (a new language, a code dialect), f(V) can be flat in V — added rows never fire — and Eq. 10.12 fails at every V; this is the multilingual case of R10.10.

## Mechanism

**Fertility by language and domain.** The premium is a property of the tokenizer's training distribution, not of the language. PAPER-REPORTED (R10.10, §1): the cl100k tokenizer "uses about 1.6 times more tokens to encode the same text in Italian as it does in English, 2.6 times for Bulgarian and 3 times for Arabic. For Shan … that difference can be as high as 15 times", measured on FLORES-200 (2,000 parallel sentences, 200 languages). The mechanism for the worst cases is explicit: a Shan word "constructed from one consonant and three diacritics" has four code points and "resulting in 9 tokens" because "the diacritics are encoded separately", while English "you" is a single token (R10.10, §4.1). Byte-level alphabets do not remove the disparity: "byte-level representation of the same text is over 4 times longer for Burmese or Tibetan than Chinese" (R10.10, §1) because UTF-8 lengths differ by script. Multilingual tokenizers reduce but do not eliminate it: "All five models have languages with premiums of more than 2.5" (R10.10, §4.3). Model developers report the same lever from the other side: PAPER-REPORTED (R10.31, §3.2): Llama 3's vocabulary "combines 100K tokens from the tiktoken tokenizer with 28K additional tokens to better support non-English languages", improving "compression rates on a sample of English data from 3.17 to 3.94 characters per token", and "adding 28K tokens from select non-English languages improved both compression ratios and downstream performance, with no impact on English tokenization." Domain follows the same rule: a web-trained codebook under-merges code and mathematics ([§10.2](10-2-implementations-and-normalization.md) on digit and whitespace rules), so f is higher on those domains at the same V. Cost of the disparity, in the three currencies R10.10 names: "Commercial services charge users per token … users of some languages paying at least 2.5 times more for the same task as users of English"; latency, since "Some languages can require twice the time to process the same content"; and context, since token-efficient languages "process or generate texts that may be more than an order of magnitude longer" in a fixed window.

**Embedding and head parameters.** Eq. 10.7 at d_model = 4,096 and V = 128k gives 5.2·10⁸ parameters untied, 2.6·10⁸ tied; at V = 256k, 1.05·10⁹ untied. These are illustrative arithmetic, not specifications of any model. The share of total parameters is what matters: PAPER-REPORTED (R10.8, §3): in mT5-Base the vocabulary matrices "amount to 256 million parameters, or about 66% of the total parameter count"; at ByT5-Large the vocabulary share is 0.06 % against 42 % for mT5-Large (R10.8, §6.4). Whether those rows are well trained is a separate question: PAPER-REPORTED (R10.37): under-trained tokens — "tokens present in the tokenizer vocabulary but that are nearly or entirely absent during model training" — typically amount to "0.1–1% of the total vocabulary size" of the models tested, and for untied embeddings with weight decay "the embeddings corresponding to under-trained tokens will tend to zero as training progresses." Cost: N_vocab parameters × (b_w bytes of weights + gradient + optimizer state) during training; at inference the head is read once per decoded token, `2·V·d_model·b_w` bytes untied or `V·d_model·b_w` tied, which at small batch is a bandwidth term of the same order as one transformer block ([§5.5](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-5-training-and-generation.md)).

**Logits memory and the softmax.** Eq. 10.8 at B·T = 2¹⁷ tokens per step and V = 128k in FP32 is 2¹⁷·2¹⁷·4 bytes = 64 GiB for the logits alone, before the gradient of the same shape — larger than the residual stream of every layer combined for a mid-sized model (MATHEMATICALLY-DERIVED; illustrative). This is the term that fused linear–cross-entropy kernels exist to remove: OFFICIAL-DOCUMENTATION (R10.44): Liger Kernel's fused linear cross-entropy performs "chunk-by-chunk computation to reduce memory" and the README claims memory reduced "by up to 80%" for the loss under stated conditions; OFFICIAL-DOCUMENTATION (R10.20, TRL v1.13.0): `SFTTrainer` defaults to `loss_type="chunked_nll"`, "so peak activation memory does not scale with the full vocab × seq_len logits tensor". Cost line for the fusion: the same FLOPs (the head matmul is still executed) traded for recomputation of chunk logits in the backward pass and a kernel dependency; the reported percentages apply to the configurations in R10.44's README and do not transfer without measurement.

**Sequence length and its downstream multipliers.** Eq. 10.9 multiplies into every per-token cost in the book: forward FLOPs (2N per token, [§5.6](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md)), attention scores (quadratic in T), cache bytes (Eq. 10.10), effective context ([§15.4](../../part-03-model-architectures-and-state/ch15-position-long-context-and-effective-information-access/15-4-effective-context.md)), prefill latency (TTFT scales with prompt tokens) and per-token billing. A premium of π on a language therefore raises its KV bytes per document by π, its prefill FLOPs by about π (and its score FLOPs by π²), and its bill by π — the cost inequity of R10.10 restated in the book's currencies (DERIVED).

**The break-even.** Eq. 10.12 is the correction the plan demands, in inequality form. Two readings. Training: with a ≈ 6N_nv and c ≈ 6d_model the share is `V d_model / (N_nv + V d_model)`; for N_nv = 7·10⁹, d_model = 4,096 and V = 32k the share is ≈ 1.8 %, so V can grow while the fertility elasticity exceeds a few percent — a weak condition that most codebooks satisfy far past 32k, which is the qualitative content of R10.11's finding that "Most LLMs, however, use insufficient vocabulary sizes." At N_nv = 10⁸ and the same d_model the share at V = 32k is ≈ 57 %, and doubling V requires tokens to fall by more than a third — which saturating codebooks do not deliver — so small models want small vocabularies (DERIVED; illustrative arithmetic). Inference at batch 1: a is dominated by weight and cache reads per token, c by the head's weight read `2 d_model b_w`, and the share is the head's fraction of bytes per step; the condition becomes a bandwidth statement. R10.11's fitted forms give the empirical shape: PAPER-REPORTED (R10.11, §4.1): "N_nv = 0.08·C^0.50, N_v = 0.20·C^0.42 and H = 6.42·C^0.50", so optimal vocabulary parameters grow with compute more slowly than non-vocabulary parameters, `N_v^opt ∝ N_nv^γ` with γ ≈ 0.83; and the paper's headline extrapolation, "the optimal vocabulary size of Llama2-70B should have been at least 216K, 7 times larger than its vocabulary of 32K", is an extrapolation of a fit from models of 33M–3B parameters and is UNVERIFIED at 70B. The one validated point is small: "By increasing the vocabulary size from the conventional 32K to 43K, we improve performance on ARC-Challenge from 29.1 to 32.0 with the same 2.3e21 FLOPs" (R10.11, abstract; 3B-parameter model, SlimPajama data) — PAPER-REPORTED with its workload stated, a single benchmark, no confidence interval given in the abstract.

**Why the unconditional claim is a category error.** "A larger vocabulary reduces sequence length" is true; "a larger vocabulary reduces cost" is not, because the reduction is bought with a per-token cost that grows linearly in V and a per-row training-data requirement that grows with V (R10.11: "the parameters from expanding the vocabulary cannot be adequately trained with limited data, which leads to a decline in model performance"). The KV cache (Eq. 10.10) is the exception that makes the claim seductive: it has no V term. A serving-only analysis that looks at cache bytes will always favour larger V; a whole-system analysis will not.

## Algorithm

```text
Algorithm 10.8 — Joint vocabulary cost evaluation and break-even search
INPUT   candidate sizes V₁ < … < V_K; tokenizers 𝒯_k trained at each V_k with identical normalisation;
        workload W = {(s, weight)} of documents with language/domain labels; model constants N_nv, d_model, L, H_kv, d_h, b, b_w;
        regime ∈ {train-FLOPs, decode-bytes, logits-memory}
OUTPUT  table of C(V_k) per regime; break-even V* (largest k with C(V_k) < C(V_{k−1}))
STATE   f[k] : workload-average fertility; f_g[k] : per-group fertility
INVARIANT the same byte set W is tokenised at every k
1.  for k = 1 … K: f[k] ← Σ_W weight·|𝒯_k(s)| / Σ_W weight·|s|_bytes ; f_g[k] per group g
2.  for k: T[k] ← f[k]·Σ_W weight·|s|_bytes                               # Eq. 10.9
3.  set (a, c) by regime: train-FLOPs (6N_nv, 6d_model); decode-bytes (2N_nv b_w + cache read, 2d_model b_w); logits (0, B·b_logit)
4.  for k: C[k] ← (a + c·V_k)·T[k]                                       # Eq. 10.11
5.  for k ≥ 2: ε[k] ← −(log f[k] − log f[k−1]) / (log V_k − log V_{k−1}); share[k] ← c·V_k/(a + c·V_k)
6.  V* ← largest V_k with ε[k] > share[k]                                 # Eq. 10.12 on the grid
7.  report C, ε, share, V*, and the premium π_g = f_g/f_English per group at V*
TERMINATION: K evaluations.
```

Complexity: K tokenizer trainings plus K tokenisations of W (O(K·|W|·log n) by Algorithm 10.2); the model constants enter only arithmetically. Implementation: fertility from the tokenizer artifact under Hugging Face Tokenizers or SentencePiece; the regime constants from the model's `config.json`; the cache constant from Eq. N.8.

## Implementation

Tensors and operators: the head is `[B, T, d_model] @ [d_model, V] → [B, T, V]` followed by log-softmax in FP32 ([§3.2](../../part-01-scientific-foundations/ch03-numerical-computation-and-trustworthy-training/03-2-stable-primitives.md)); the embedding is a gather. Framework: *Hugging Face Transformers* (#26, Model definition / adaptation) exposes `num_parameters(exclude_embeddings=True)` (OFFICIAL-DOCUMENTATION, R10.19), which is the N_nv of Eq. 10.11, and `resize_token_embeddings(pad_to_multiple_of=…)` whose documentation notes padding V to a multiple "is especially useful to enable the use of Tensor Cores on NVIDIA hardware with compute capability >= 7.5" (R10.19) — a reminder that the head GEMM's efficiency, not only its size, depends on V. Kernels: *Liger Kernel* (#40, Kernels / numerics / collectives) provides the fused linear cross-entropy (R10.44); *Hugging Face TRL* (#29, Post-training / RL) defaults to chunked NLL (R10.20); *NVIDIA Megatron-Core* (#23, Distributed training) shards the head across tensor-parallel ranks — vocabulary parallelism, owned by [§13.5](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-5-embeddings-and-heads.md) and Chapter 29. Memory: Eq. 10.7 × bytes per parameter for weights; Eq. 10.8 for logits unless fused. Communication: under tensor parallelism the softmax over a sharded V needs an all-reduce of per-shard maxima and sums (Chapter 29). Deployment: *vLLM* (#41, Inference engine) computes logits for sampling per decode step; the per-step cost `2·V·d_model` FLOPs and `V·b_logit` bytes per sequence is part of TPOT ([§42.1](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition.md)).

> **Implementation note [impl.liger-kernel · README as of 2026-09-20; release UNVERIFIED].** The README's headline figures (throughput "+20%", memory "−60%") are stated for "LLaMA 3-8B, Batch Size = 8, Data Type = bf16, Optimizer = AdamW, Gradient Checkpointing = True, Distributed Strategy = FSDP1 on 8 A100s" (R10.44). They are a vendor measurement for that configuration and are not the book's.

## Experimental design

### Experiment 10.3 — Vocabulary-size sweep at matched bytes and matched non-vocabulary parameters

- **Hypothesis.** On a fixed byte budget, held-out bits per byte is non-monotone in V with an interior optimum that shifts to larger V as N_nv grows; the optimum predicted by Eq. 10.12 from measured fertility and the training-FLOP constants lies within one grid step of the measured optimum.
- **Setup.** Train byte-level BPE tokenizers at V ∈ {8k, 16k, 32k, 64k, 128k, 256k} on one corpus; train decoders at N_nv ∈ {1·10⁸, 4·10⁸, 1.6·10⁹} with untied heads for a fixed byte budget each.
- **Independent variables.** V; N_nv.
- **Controlled variables.** Corpus bytes, normalisation, regex, optimizer, schedule, seed, d_model per N_nv.
- **Dataset/workload.** Multilingual web sample with per-language held-out splits; a code split; a mathematics split.
- **Hardware.** Any accelerator; record wall-clock per step so that logits-memory effects surface as throughput.
- **Metrics.** Bits per byte per split ([§2.3](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-3-information-theory.md)); fertility per split; ε_f on the grid; C(V) per Eq. 10.11; premium per language; peak memory.
- **Baselines.** The fit of R10.11 applied to each N_nv.
- **Expected result.** Interior optimum at each N_nv; optimum V increasing with N_nv; languages with the highest premium gain most from larger V but remain above parity. ASSUMED.
- **Ablation.** Tied versus untied heads (changes c); fused versus materialised logits (changes memory, not the optimum).
- **Interpretation.** Agreement with Eq. 10.12 supports using measured fertility elasticity as the design variable; disagreement indicates that the per-row data requirement (undertraining) dominates the FLOP accounting.
- **Threats to validity.** Bits per byte must be computed on identical normalised bytes across V; the seed-to-seed variance at small N_nv can exceed the effect between adjacent V.

## Observations

**What the paper claims.** PAPER-REPORTED (R10.10): premiums up to 15× on FLORES-200 for cl100k; byte-level premiums over 4× between scripts; multilingual tokenizers reduce but retain premiums above 2.5 for some languages. PAPER-REPORTED (R10.11): optimal vocabulary parameters follow a power law in compute with exponent below that of non-vocabulary parameters; a 32K→43K change at 3B parameters and 2.3·10²¹ FLOPs improved ARC-Challenge from 29.1 to 32.0. PAPER-REPORTED (R10.31): 100K+28K vocabulary raised English compression from 3.17 to 3.94 characters per token. PAPER-REPORTED (R10.8): mT5-Base's vocabulary matrices are ≈ 66 % of its parameters.

**What the evidence shows.** The premium measurements are direct tokenizer counts on a public parallel corpus and are reproducible by anyone with the tokenizers; they need no model. The R10.11 scaling claim rests on one lab's sweep up to 3B parameters and one validation benchmark; the 216K extrapolation for a 70B model has not been tested (UNVERIFIED). The Llama 3 compression figure is a vendor number on an undisclosed English sample.

**What we infer.** DERIVED: Eq. 10.12 explains why the compute-optimal V grows with model size without a fitted exponent — the vocabulary's cost share falls as N_nv grows, so the same fertility elasticity clears a lower bar. DERIVED: because the KV cache has no V term, serving-side accounting alone always recommends larger V; the training-side and logits terms are what bound it.

**What remains unknown.** NOT-DISCLOSED: the fertility curves f(V) of any production tokenizer family across V (only endpoints are published). UNVERIFIED: whether ε_f measured on a training corpus predicts ε_f on deployment traffic. Open question: whether per-language vocabulary allocation (equalising premiums) or global compression should be the objective; R10.10 argues for parity, R10.11 for compute-optimality, and the two objectives differ.

## Failure modes

> **Failure mode — logits out-of-memory at long context.** *Symptom:* OOM at the loss, not in the blocks, when T or V grows. *Cause:* Eq. 10.8 materialised in FP32 with its gradient. *Detection:* profile the peak at the head. *Mitigation:* chunked or fused cross-entropy (R10.20, R10.44); vocabulary parallelism ([§13.5](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-5-embeddings-and-heads.md)).

> **Failure mode — undertrained vocabulary rows.** *Symptom:* glitch tokens, near-zero embedding norms, anomalous completions on rare strings. *Cause:* V grown beyond what the data can train (R10.11; R10.37). *Detection:* embedding-norm and reachability scans (R10.37). *Mitigation:* reduce V, or expand the data that fires the rows; migration rules in [§10.6](10-6-migration-and-compatibility.md).

> **Failure mode — premium-blind capacity planning.** *Symptom:* p99 latency and cost per accepted task diverge by language; context windows overflow for some users at the same content length. *Cause:* workload specified in tokens without a language mix. *Detection:* per-language fertility on production traffic. *Mitigation:* specify workloads in bytes per language and convert through measured f ([§48.1](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/48-1-workload-specification.md)).

> **Failure mode — tied-head accounting error.** *Symptom:* parameter counts and FLOP budgets off by V·d_model. *Cause:* Eq. 10.7 applied with the wrong case. *Detection:* compare `num_parameters(exclude_embeddings=True)` with the reported total. *Mitigation:* state tying explicitly in every model record (Appendix A field "architecture source").

## Siblings

**Compute-optimal N–D allocation ([§21.2](../../part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/21-2-compute-optimal-design.md))** — owned elsewhere
Why it exists: allocate a FLOP budget between parameters and tokens. What assumption changed (relative to this section): V fixed and excluded from N. What objective changed: loss at fixed C. What problem it solved: the N–D trade. What new failure mode it introduced: vocabulary-blind fits (R10.11). Changed primitive: N → (N_nv, N_v).

**Embedding and head parameterisation ([§13.5](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-5-embeddings-and-heads.md))** — owned elsewhere
Why it exists: decide tying, head precision and vocabulary parallelism. What assumption changed: the cost per row c is a design variable. What objective changed: none. What problem it solved: halving N_vocab by tying; sharding the head. What new failure mode it introduced: tied heads couple input and output geometry. Changed primitive: two matrices → one.

**Byte-level models (ByT5, BLT; [§10.1](10-1-tokenization-algorithms.md))** — sibling at the other end of V
Why it exists: set V = 256 (or no fixed V) and pay in sequence length. What assumption changed: the codebook's parameters are better spent in layers. What objective changed: none. What problem it solved: no vocabulary to design. What new failure mode it introduced: 2–10× inference slowdowns in R10.8's configurations. Changed primitive: rows → positions.

**Mixture-level fertility ([§9.5](../ch09-data-mixtures-curricula-and-sample-efficiency/09-5-multilingual-and-specialist-mixtures.md))** — owned elsewhere
Why it exists: fertility changes how many bytes a token budget buys per language. What assumption changed: the tokenizer is fixed and the mixture moves. What objective changed: exposure accounting in bytes versus tokens. What problem it solved: fair exposure. What new failure mode it introduced: token-counted mixtures under-expose high-premium languages. Changed primitive: token weights → byte weights.

## Extensions

Domain adaptation: adding domain tokens shifts f on that domain only; evaluate Eq. 10.12 on the adapted workload, not the base corpus ([§10.6](10-6-migration-and-compatibility.md)). Long context: attention's quadratic term makes the effective c larger at long T, favouring larger V for long-document workloads. Multimodality: image tokens are set by patch geometry, not by V; the text V's share of per-token cost falls when visual tokens dominate the sequence ([§55.2](../../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/55-2-alignment-and-fusion.md)). Agents: tool outputs are often JSON and code; their fertility under a web-trained codebook is a large fraction of agent context cost ([§50.2](../../../vol-03-grounded-and-interactive-intelligence/part-09-retrieval-context-and-agent-systems/ch50-context-construction-and-retrieval-augmented-generation/50-2-context-budgeting.md)). Proposals only.

## Limitations

Eq. 10.11 is linear in V and ignores the head GEMM's efficiency dependence on V alignment, the softmax's memory traffic, and the data requirement per row; Eq. 10.12 is a necessary condition on cost, not a prediction of loss. The regime constants a and c must be recomputed for MoE models (activated parameters) and for tied heads. Falsification: a sweep in which C(V) computed from Eq. 10.11 decreases monotonically to the largest V while held-out loss worsens would show that the data-per-row constraint, not cost, binds — the R10.11 regime at small data. Decision consequence: choose V on the deployment workload's fertility curve and the model's non-vocabulary size together; never from compression alone.

## Reproducibility

Sources opened 2026-09-20: R10.8, R10.10, R10.11, R10.31, R10.37 (arXiv PDFs, text extracted); R10.19 and R10.20 (documentation, versions v5.17.0 and v1.13.0 as displayed); R10.44 (README). All numeric examples not attributed to a source are illustrative arithmetic on stated shapes. Metric definitions: fertility per Eq. 10.6 in UTF-8 bytes; premium relative to English unless stated. Unresolved: f(V) curves for production tokenizers (NOT-DISCLOSED).

## References

R10.8 · R10.10 · R10.11 · R10.19 · R10.20 · R10.31 · R10.37 · R10.44 · [notation.md](../../../front-matter/notation.md) · [references.md](references.md)
