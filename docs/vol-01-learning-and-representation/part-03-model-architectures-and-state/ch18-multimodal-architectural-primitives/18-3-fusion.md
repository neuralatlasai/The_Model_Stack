---
id: ms.section.18.3
entity_type: section
title: Fusion
short_title: Fusion
volume: 1
part: 3
chapter: 18
section: 18.3
slug: 18-3-fusion
parent: ms.chapter.18
prev_sibling: ms.section.18.2
next_sibling: ms.section.18.4
children: []
prerequisites: [ms.section.18.2, ms.chapter.13]
downstream: [ms.chapter.19, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60]
related: [ms.chapter.10, ms.chapter.13]
siblings_by_mechanism: []
relations: []
axes:
  lifecycle: [pretraining, adaptation, inference, evaluation]
  mechanism: [multimodal_interfaces]
  feedback_setting: []
  modality: [text, image, audio, video, action]
papers: [P44, P45]
implementations: []
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, DERIVED, MATHEMATICALLY-DERIVED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 18.3 Fusion

## Scope

Fusion is the computation graph that permits one modality to influence another representation or prediction. Its defining properties are where interaction occurs, which elements may interact, what state is shared, and which conditional dependencies the masks enforce. This section separates early sequence concatenation, late score/embedding combination, cross-attention, interleaved conditioning, shared backbones and modality-specific branches. These choices are independent of whether the training objective is contrastive or generative.

## Why this exists

DERIVED: two systems can use the same image encoder and language model yet expose different evidence to a predicted token. A pooled retrieval embedding, a prepended patch sequence and an inserted cross-attention module implement different functions. Their costs and failure modes follow from those dependency graphs. Calling all three multimodal alignment does not specify the mechanism, the interaction stage or the available conditional information.

## Intuition

MATHEMATICALLY-DERIVED: let image features be $U\in\mathbb R^{n\times d}$ and text features $T\in\mathbb R^{t\times d}$. Concatenation places $n+t$ elements in one sequence, but the attention mask determines whether text can read images, whether image states can read text, and whether future text leaks into training. Concatenation alone specifies neither bidirectional interaction nor causal generation. A cross-attention block makes the query/key-value direction explicit; a late similarity model may never create token-level interaction at all.

## Formulation

A fusion specification is the tuple $(\mathcal V,\mathcal E,M,S)$: representation nodes, directed dependency edges, masks on those edges, and shared parameter/state identities. This is a book-defined representation of a computation graph. For dense attention at width $d$, multiplying scores and values requires approximately $4L^2d$ FLOPs at sequence length $L$, excluding projections and softmax. Consequently,

$$
4(n+t)^2d-4n^2d-4t^2d=8ntd. \tag{18.6}
$$

MATHEMATICALLY-DERIVED: this is the interaction-term increase for full bidirectional self-attention relative to two independent full-attention sequences with the same width and layer count. It does not include different encoders, causal masking efficiencies, projection costs or kernel traffic. A block-sparse mask can reduce admissible edges; whether it reduces executed work depends on implementation.

For text queries and visual keys/values,

$$
\operatorname{CA}(T,U)=\operatorname{softmax}\left(\frac{TW_Q(UW_K)^{\mathsf T}}{\sqrt{d_k}}+M_{TU}\right)UW_V. \tag{18.7}
$$

The score matrix has shape $[t,n]$. Cross-attention need not update $U$, and a separate reverse block is required if the visual representation is to read current text. Parameter sharing elsewhere does not create a missing directed edge.

## Mechanism

### Methodology: early and late interaction

DERIVED: early fusion embeds modality elements into the receiving backbone before a substantial portion of its computation. Its benefit as a representation class is that later layers can build task-dependent joint features; its cost includes the full admitted multimodal sequence. A causal prefix of $n$ image vectors and $t$ text tokens contributes $n$ additional persistent keys/values at every affected layer. The exact attention rule for prefix elements must be specified separately: they may use a bidirectional prefix mask, a causal sequence mask or a separately computed encoder representation.

Late fusion first computes independent outputs. A similarity model uses normalized pooled features $u,v$ and score $u^{\mathsf T}v/\tau$; a decision ensemble might combine calibrated class scores. These are distinct operations. Adding embeddings requires a shared coordinate space and a declared normalization/weighting rule; adding probabilities requires identical outcome definitions. Neither operation is equivalent to token-level attention. Independent encoding permits caching one side of retrieval, whereas joint candidate encoding usually requires work for each pair. Section 18.4 develops the CLIP example and its evaluation protocol.

MATHEMATICALLY-DERIVED: with $B$ image and text embeddings of width $d$, all-pairs dot products cost approximately $2B^2d$ FLOPs, while storing the pooled features costs $2Bdb$ bytes. This quadratic batch operation is different from quadratic within-example sequence attention. At inference, ranking $C$ cached candidates for one query costs approximately $2Cd$ dot-product FLOPs before search/index effects. Using retrieval scores to rank candidates supplies no autoregressive generator unless another component defines one.

### Methodology: interleaving and conditional masks

PAPER-REPORTED · Flamingo inserts visual cross-attention modules into a frozen language stack. Its inference-time direct visual mask restricts a text position to the immediately preceding image/video; earlier observations can influence it indirectly through preceding text states (R18.2, §§3.1.2–3.1.3). DERIVED: direct access and indirect dependence are different. Removing an earlier image from the current cross-attention keys does not prove that the prediction is independent of that image, because text-state paths may carry its influence.

Let $\varphi(\ell)$ identify the most recent visual observation preceding text position $\ell$. A direct mask is

$$
M_{\ell j}=\begin{cases}0&j\in\mathcal I_{\varphi(\ell)},\\-\infty&\text{otherwise},\end{cases} \tag{18.8}
$$

where $\mathcal I_k$ indexes the visual vectors belonging to observation $k$. With no preceding observation, the implementation needs an explicit absent-visual path rather than a softmax over an all-masked row. Event delimiters, observation ownership and empty-input behavior are therefore part of the mathematical interface. Interleaving can express demonstrations and later queries, but a model must have been trained or otherwise shown to use that format; serializability alone is no evidence of successful in-context adaptation. PAPER-REPORTED · Flamingo also randomizes image-index associations when sampling M3W training examples; the immediate-predecessor rule is not its complete training-data construction (R18.2, §4.1.4, Appendix A.1.2).

### Methodology: gates and preservation at initialization

PAPER-REPORTED · Flamingo initializes its added residual gates at zero using $\tanh(\alpha)$ (R18.2, §3.1.2). For branch output $f_\phi(h,U)$,

$$
h'=h+\tanh(\alpha)f_\phi(h,U). \tag{18.9}
$$

MATHEMATICALLY-DERIVED: at $\alpha=0$, this block is the identity on $h$. The derivative with respect to branch parameters is initially zero through this gate, while $\partial h'/\partial\alpha=f_\phi(h,U)$ can be nonzero. A gate can begin learning before its branch parameters receive gradients through that residual route. Other losses or parameter-sharing paths may alter this conclusion; it applies to the displayed branch alone. After the gate changes, the frozen language weights remain fixed but the composite function changes. Initialization identity is not a guarantee of perpetual text-only behavior preservation.

### Methodology: shared computation and specialized branches

PAPER-REPORTED · Qwen2.5-Omni separates a text-generating Thinker from a Talker that receives Thinker representations and text embeddings to generate speech codes (R18.6, §§2.1, 2.3). DERIVED: this is a directed interface with specialized output computation, not evidence that all modalities share identical hidden states or output heads. A shared backbone means shared parameterized operations; modality-specific input/output branches can coexist with it. Recording only a single total parameter count loses this topology.

MATHEMATICALLY-DERIVED: if tasks $a$ and $b$ share parameters $\theta_s$ but have private parameters $\theta_a,\theta_b$, then $\nabla_{\theta_s}(\lambda_aL_a+\lambda_bL_b)$ is the sum of both shared gradients, while the private gradient depends only on paths that reach the corresponding branch. This is the structural source of possible transfer or interference; the sign and magnitude require the actual objectives and data. Distinct branches can remove one path for interference without isolating all shared computation.

## Algorithm

DERIVED: construct a graph with one node per encoded modality, connector, backbone block and output head. Annotate each edge with shape, modality ownership, allowed positions, dtype and differentiability. Construct masks from observation membership and the declared causal policy, not from sequence offsets guessed after padding. Evaluate each node only after its dependencies are available. At generation, append the output state to the correct stream and update the appropriate cache; do not update an independent retrieval embedding cache as if it were a joint autoregressive state. The graph and mask record are the reproducible definition of fusion.

## Implementation

MATHEMATICALLY-DERIVED: at $L_b$ backbone layers and effective key/value width $d_{kv}$, retaining $n$ prefix elements adds $2L_bnd_{kv}b$ bytes of uncompressed KV state per example, excluding allocator and metadata overhead. Cross-attention may cache $U W_K$ and $U W_V$ for a fixed observation, but its projections and attention still consume compute and memory. A fixed-query resampler changes $n$ to $q$ downstream while adding the resampling work described in Section 18.2. Late fusion stores pooled candidate embeddings rather than a language-model KV prefix, but candidate encoding and retrieval are separate costs.

DERIVED: communication follows placement. A fused backbone on one device may need only connector outputs from an encoder device; distributed inserted cross-attention can require feature or projection transfers at multiple sites. Concurrent audio/text generation may overlap compute, so latency is determined by the critical path and scheduling, not by summing isolated throughput figures. Physical traffic, achieved throughput, energy and money are UNVERIFIED without that execution record.

## Experimental design

PAPER-REPORTED · Flamingo compares gating, conditioning architectures, resamplers and image-attention policies on its development suite, with separate support examples for few-shot evaluation (R18.2, §4.4, Appendix C.3). Its findings concern the tested backbone, datasets and aggregate score. Qwen2.5-Omni reports benchmark suites for text, audio, image, video, audiovisual and speech outputs, rather than a fully matched factorial isolation of every branch (R18.6, §5). DERIVED: the latter establishes reported package performance; it does not identify the causal effect of its branch split by itself.

## Observations

PAPER-REPORTED · Removing zero-initialized gating reduces Flamingo's aggregate development score and produces training-instability episodes in its reported ablation (R18.2, §4.4.2, Table 7). DERIVED: the initialization identity has both an exact algebraic meaning and source-reported optimization evidence; neither establishes stability for every backbone or training mixture.

DERIVED: early fusion increases the opportunity for joint representation building and the sequence state the backbone must process. Cross-attention specifies a directional interface and can constrain the visual state supplied to each text position. Late fusion supports independent candidate encoding but cannot reproduce arbitrary cross-token computation through a single pooled score. Shared backbones and specialized branches are additional axes rather than mutually exclusive fusion categories.

## Failure modes

DERIVED: target leakage arises when the training mask permits future answer text or later observations unavailable at prediction time. All-masked softmax rows require explicit handling. Incorrect observation membership can attach a question to the wrong image while every tensor shape remains valid. Adding modality prefixes can alter rotary positions or text context length, so frozen backbone weights alone do not establish unchanged text behavior.

## Siblings

Section 18.2 owns connector architecture and freezing. Section 18.4 owns losses. Section 18.5 distinguishes sequence order from physical time and information availability. Section 18.6 examines effects on shared parameters and held-out capabilities.

## Extensions

### Improvements and their evidence

DERIVED: Flamingo's gated cross-attention and fixed-query resampling are evaluated changes to its conditioning path, not universal replacements for concatenation. Qwen2.5-Omni's specialized output branch addresses a different requirement: text-conditioned streaming speech. Their merits require different outcomes. A fusion change must preserve the stated causal information boundary before any score or latency difference can be interpreted as an improvement.

## Limitations

NOT-DISCLOSED: the inspected sources do not provide a common hardware/runtime workload for all fusion variants. MATHEMATICALLY-DERIVED: arithmetic and state counts omit kernel execution, batching, precision effects and model-quality changes. They are accounting relationships, not measured speedups.

## Reproducibility

Record the complete attention graph, masks, observation delimiters, gate initialization, layer insertion schedule, cache ownership and absent-modality behavior. No fusion implementation or benchmark was executed for this manuscript.

## References

P44 §2; R18.2 §§3, 4.4, Appendix C.3; R18.6 §§2, 5. See [References](references.md).
