---
id: ms.section.23.1
entity_type: section
title: Adaptation families
volume: 1
part: 4
chapter: 23
section: 23.1
slug: 23-1-adaptation-families
parent: ms.chapter.23
prev_sibling: null
next_sibling: ms.section.23.2
children: []
prerequisites: [ms.chapter.13, ms.chapter.19, ms.chapter.22]
downstream: [ms.section.23.2, ms.chapter.31]
related: [ms.chapter.24, ms.chapter.40]
siblings_by_mechanism: []
relations: [{type: supported_by, target: paper.P14}, {type: implemented_by, target: impl.hugging-face-peft}]
axes: {lifecycle: [adaptation], mechanism: [parameter_efficient_adaptation], feedback_setting: [], modality: [text]}
papers: [P14, P15]
implementations: [impl.hugging-face-peft, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 23.1 Adaptation families

## Scope

**MATHEMATICALLY-DERIVED.** Adaptation specifies a set of reachable functions and an optimization path through that set. This section separates full fine-tuning, inserted bottleneck adapters, learned input prompts, per-layer prefixes, low-rank weight updates, and selective training of existing parameters. Compare these interventions under one target objective, tokenizer, data split, and deployment boundary. The question is which restriction preserves useful task performance while reducing total lifecycle cost; the number of trainable scalars answers only part of that question. Objective construction belongs to [Chapter 19](../ch19-pretraining-objectives-and-the-full-training-loop/README.md); rank mechanics begin in [23.2](23-2-lora-mechanics.md).

## Why this exists

**MATHEMATICALLY-DERIVED.** Suppose a base model has $N$ stored parameters and each of $K$ tasks would otherwise require an independent fully tuned copy. With $b$ bytes per stored value, that representation occupies $KNb$ bytes. Sharing one immutable base and storing $n_k$ additional parameters per task gives $Nb+b\sum_k n_k$, before configuration, tokenizer, and runtime state. Sharing is meaningful only if those tasks use the same base tensors and operator semantics. A small task artifact attached to a different base is a different model, even when all tensor shapes agree.

**MATHEMATICALLY-DERIVED.** Training cost follows a different decomposition. Freezing weights removes their gradients and optimizer states, but the gradient of a downstream trainable module still depends on intermediate activations and upstream Jacobians. The required backward graph depends on where trainable variables enter. Input prompt tuning generally differentiates through the whole model to reach the prompt; training only a final classifier may detach a frozen feature extractor. Therefore identical trainable counts need not imply identical activation memory or FLOPs. An adaptation family must specify both the parameter subset and the differentiation boundary.

## Intuition

**MATHEMATICALLY-DERIVED.** Let a frozen base implement $f_{\theta_0}$ and let $\phi$ denote task variables. An adaptation map $g$ produces $f_{\theta_0,\phi}=g(f_{\theta_0},\phi)$. Locally, the possible output changes are $J_\phi\,\delta\phi$, where $J_\phi$ is the Jacobian of outputs with respect to the task variables. Restricting $\phi$ reduces the tangent directions accessible to optimization, but parameter count alone does not determine their alignment with the target residual. A million variables in an irrelevant module can be less useful than fewer variables at a sensitive interface. This is a local differential account, not a theorem that a particular small adapter will generalize.

## Formulation

**MATHEMATICALLY-DERIVED.** For supervised examples $\mathcal D_a$ with target masks, use the token-normalized objective of Chapter 19 and write its dependence on task variables as $\mathcal L_a(\phi)$. Let $\mathcal D_r$ be a separately held retention set. The mathematical distinction between families is the map from $\phi$ to the realized model:

$$
\begin{aligned}
\text{full:}&\quad \theta=\theta_0+\phi,\qquad \phi\in\mathbb R^N,\\
\text{selective:}&\quad \theta=\theta_0+\mathsf S\phi,\qquad \mathsf S\in\{0,1\}^{N\times n_s},\\
\text{inserted:}&\quad h'=h+U\,\sigma(Vh+a)+u,\\
\text{prompt:}&\quad f_{\theta_0,P}(x)=f_{\theta_0}([P;E(x)]),\\
\text{prefix:}&\quad (K_\ell',V_\ell')=([K^p_\ell;K_\ell],[V^p_\ell;V_\ell]),\\
\text{low-rank:}&\quad W_j'=W_{0,j}+s_j\mathsf B_j\mathsf A_j.
\end{aligned}
$$
*(Eq. 23.1)*

**MATHEMATICALLY-DERIVED.** Here $\mathsf S$ selects distinct existing scalar coordinates; $h\in\mathbb R^d$, $V\in\mathbb R^{a_w\times d}$ and $U\in\mathbb R^{d\times a_w}$ form an inserted bottleneck of width $a_w$; $a,u$ are biases. $P\in\mathbb R^{p\times d}$ is an input soft prompt. The prefix expression is a decoder-attention reconstruction with $p$ additional key/value positions per layer; encoder-decoder variants require separate attention interfaces. $\mathsf A_j,\mathsf B_j$ are low-rank factors defined in 23.2. These expressions identify adaptation locations; they do not impose an identical initialization or optimizer across source methods.

$$
\begin{aligned}
n_{\rm bottleneck}&=2da_w+a_w+d, &n_{\rm prompt}&=pd,\\
n_{\rm prefix,KV}&=2LpH_{kv}d_h, &n_{\rm selective}&=n_s,\\
M_{\rm task,store}&=b_a n_a, &M_{\rm task,train}&=(b_a+b_g+b_o)n_a.
\end{aligned}
$$
*(Eq. 23.2)*

**MATHEMATICALLY-DERIVED.** The first count is per inserted module; multiply by the actual number of insertions. Prefix count assumes direct stored key/value tensors and excludes a training-only reparameterization network. $b_a,b_g,b_o$ count task weights, gradients, and optimizer bytes per scalar; they are explicit accounting inputs, not universal constants. Total resident memory adds base weights, activations, workspaces, communication buffers, and allocator reserve.

```figure
id: fig-23.2
kind: calculator
title: Task-specific parameter counts
caption: Analytical counts for one bottleneck, an input prompt, and direct decoder key/value prefixes. The bottleneck count is per insertion; prefix training reparameterization and all runtime memory are excluded.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.2
alt: With width 4096, bottleneck 16, prompt length 32, 32 layers, eight key/value heads and head width 128, one bottleneck contains 135184 parameters, an input prompt 131072 and direct key/value prefixes 2097152.
states:
  - {anchor: formulation, label: Parameter boundary, highlight: [np, nk], note: A prompt count does not include its activation or cache cost.}
  - {anchor: mechanism, label: Insertion boundary, highlight: [na], note: Multiply the bottleneck count by the number of actual inserted modules.}
spec:
  tex: n_a=2da_w+a_w+d,\quad n_p=pd,\quad n_k=2LpH_{kv}d_h
  equation: "23.2"
  inputs:
    - {symbol: d, label: hidden width, default: 4096, min: 256, max: 16384, scale: log2, format: integer}
    - {symbol: aw, label: bottleneck width, default: 16, min: 1, max: 512, scale: log2, format: integer}
    - {symbol: p, label: prompt positions, default: 32, min: 1, max: 512, scale: log2, format: integer}
    - {symbol: L, label: layers, default: 32, min: 1, max: 128, step: 1, format: integer}
    - {symbol: Hkv, label: key/value heads, default: 8, min: 1, max: 64, scale: log2, format: integer}
    - {symbol: dh, label: head width, default: 128, min: 32, max: 512, scale: log2, format: integer}
  outputs:
    - {symbol: na, label: one bottleneck, formula: 2*d*aw+aw+d, format: params}
    - {symbol: np, label: input prompt, formula: p*d, format: params}
    - {symbol: nk, label: direct KV prefixes, formula: 2*L*p*Hkv*dh, format: params, emphasis: true}
```

## Mechanism

**PAPER-REPORTED.** Houlsby adapters insert a nonlinear down-projection/up-projection residual module, initialized near identity; the original study also trains task-specific layer-normalization and output parameters. Its Figure 2 fixes placement within the source Transformer, so copying only the bottleneck equation does not reconstruct the complete method. [R23.1] (§2.1, Fig. 2)

**PAPER-REPORTED.** Prompt tuning learns only prepended embedding vectors while holding the T5 backbone fixed. Prefix tuning supplies learned activations at multiple layers and uses a training reparameterization that is discarded after materializing the prefix. These are distinct interfaces: an input prompt must propagate through the frozen stack; a direct prefix can independently control each designated layer's attention memory. [R23.2] (§2); [R23.3] (§4.2–4.3)

**PAPER-REPORTED.** BitFit selects bias terms and a task classifier in masked-language-model encoders. This is selective updating of existing tensors, not insertion of a separate low-rank branch. Its evidence concerns the disclosed BERT/RoBERTa tasks, and does not establish that a bias-free decoder has an equivalent trainable subset. [R23.4] (§3–4)

**MATHEMATICALLY-DERIVED.** The selection matrix gives a precise first-order restriction: $\nabla_\phi\mathcal L=\mathsf S^\top\nabla_\theta\mathcal L$ and $\delta\theta\in\operatorname{range}(\mathsf S)$. Full tuning removes that restriction but still depends on the chosen objective and optimizer. A prompt changes conditioning rather than base tensors. An inserted nonlinear adapter generally cannot be collapsed into one neighboring linear weight for all $h$ because $\sigma(Vh+a)$ depends nonlinearly on its input. A linear low-rank branch can be collapsed under the conditions in 23.2. Thus mergeability follows from operator algebra, not from the generic label “adapter.”

**MATHEMATICALLY-DERIVED.** For decoder attention with ordinary sequence length $T$, a direct prefix introduces $Tp$ additional query-key pairs per head in the forward attention computation, excluding prefix queries when none are computed. An input prompt processed as ordinary positions changes the causal admitted-pair count from $T(T+1)/2$ to $(T+p)(T+p+1)/2$. Their difference is $Tp+p(p+1)/2$. The two paths therefore have different prefill costs even at equal stored parameter count. For decode, each additional retained prefix key/value position contributes $2LH_{kv}d_hb$ cache bytes per independently stored prefix; sharing immutable prefix tensors may reduce duplication but requires runtime support.

```figure
id: fig-23.3
kind: diagram
title: Adaptation entry points
caption: The location of trainable variables determines the backward path and the deployable artifact. A common objective does not make these interventions functionally equivalent.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.1
alt: Training data feeds one objective. The objective differentiates through a model whose task variables enter as selected base coordinates, inserted nonlinear modules, input embeddings, layer key/value prefixes, or linear low-rank branches. All paths require an evaluated deployment artifact.
spec:
  direction: TB
  nodes:
    - {id: data, kind: dataset, label: Fixed adaptation data}
    - {id: obj, kind: objective, label: One declared loss}
    - {id: base, kind: model, label: Base model, sub: immutable identity}
    - {id: sel, kind: tensor, label: Existing coordinates, sub: full or selective}
    - {id: mod, kind: process, label: Inserted nonlinear module}
    - {id: prm, kind: tensor, label: Input prompt or layer prefixes}
    - {id: lr, kind: tensor, label: Linear low-rank factors}
    - {id: dep, kind: metric, label: Deployment parity gate}
  edges:
    - {from: data, to: obj}
    - {from: base, to: obj, kind: dependency}
    - {from: sel, to: obj, kind: dependency}
    - {from: mod, to: obj, kind: dependency}
    - {from: prm, to: obj, kind: dependency}
    - {from: lr, to: obj, kind: dependency}
    - {from: obj, to: dep, kind: emphasis}
```

## Algorithm

### Algorithm 23.1 - Bounded adaptation-family comparison

**MATHEMATICALLY-DERIVED.** Algorithm 23.1 is a bounded family comparison. Inputs are base hash $h_0$, finite maps $\mathcal G$, data/tokenizer/template manifest $\mathcal M$, token budget $D_{\max}$, memory budget $M_{\max}$ and quality/retention predicates $\mathsf Q,\mathsf R$. $\mathsf{Train}$ is Chapter 19's accepted loop restricted to task variables. $\mathsf{Eval}$ returns target score $q_g$, retention score $r_g$ and Boolean deployment-parity gate $p_g$ on untouched data with declared tolerances; failures return rejection. State $\mathcal A$ stores admitted artifacts and $\mathcal F$ rejected candidates.

$$
\begin{aligned}
1.\;&(\mathcal A,\mathcal F)\leftarrow(\varnothing,\varnothing),\quad h(\theta_0)=h_0;\\
2.\;&\forall g\in\mathcal G:\quad (\phi_0,\mathcal C_g)\leftarrow\mathsf{Init}(g,\theta_0,\mathcal M);\\
3.\;&\neg\mathsf{Valid}(\mathcal C_g)\Rightarrow
\bigl(\mathcal F\leftarrow\mathcal F\cup\{(g,\mathrm{contract})\},\
\operatorname{continue}_g\bigr);\\
4.\;&(\sigma_g,\phi_g^*,\mathcal T_g)\leftarrow
\mathsf{Train}(g,\phi_0,\mathcal M,D_{\max},M_{\max});\\
5.\;&\sigma_g\ne\mathrm{success}\Rightarrow
\bigl(\mathcal F\leftarrow\mathcal F\cup\{(g,\sigma_g)\},\
\operatorname{continue}_g\bigr),\quad
(q_g,r_g,p_g)\leftarrow\mathsf{Eval}(g,\phi_g^*,\mathcal M);\\
6.\;&\mathsf Q(q_g)\land\mathsf R(r_g)\land p_g\land h(\theta_0)=h_0
\Rightarrow\mathcal A\leftarrow\mathcal A\cup\{(g,\phi_g^*,\mathcal T_g)\};\\
7.\;&\text{otherwise}\Rightarrow\mathcal F\leftarrow\mathcal F\cup\{(g,\mathrm{gate\ failure})\};\\
8.\;&\operatorname{return}(\mathcal A,\mathcal F).
\end{aligned}
$$
*(Eq. 23.3)*

**MATHEMATICALLY-DERIVED.** $\operatorname{continue}_g$ skips the remaining operations for that candidate. Only a successful training status defines $\phi_g^*$ for evaluation; stale state from another candidate is never used. Initialization, training and evaluation have finite attempt/time caps in $\mathcal M$, including zero-valid-target and runtime-failure paths. The invariant is unchanged base identity for frozen-base candidates, unchanged data contracts and no test-driven selection. Finite $\mathcal G$ plus bounded calls ensures termination. An empty feasible set is a failed comparison under this budget.

## Implementation

**OFFICIAL-DOCUMENTATION.** Hugging Face PEFT is the parameter-efficient tuning project in the MODEL DEFINITION / ADAPTATION layer; Hugging Face Transformers supplies model definitions. The inspected PEFT LoRA configuration separately exposes target modules, modules saved outside adapters, rank, scaling, and initialization. Consequently the artifact manifest must list actual trainable tensors instead of inferring them from the method name. [R23.5] (v0.21.0, LoraConfig)

**MATHEMATICALLY-DERIVED.** The operator graph determines resource accounting. An inserted bottleneck adds roughly $4da_w$ multiplication/addition FLOPs per token for its two projections, excluding nonlinearity and biases. A soft prompt adds sequence work and possibly cache. Selective final-layer tuning can avoid an upstream backward pass only when no earlier variable is trainable and the feature extractor is detached. Parameter synchronization is proportional to the synchronized trainable tensors, but replicated frozen weights still consume each worker's memory. Energy and monetary cost require measured execution duration and the actual power/pricing boundary; neither follows from $n_a/N$.

```figure
id: fig-23.4
kind: stat-panel
title: Adapter comparison boundary
caption: A compact ledger of quantities that must remain separate. Formulas count storage only; the remaining terms require a workload and runtime measurement.
placement: rail
anchor: implementation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.2
alt: With an illustrative one-billion-parameter base, one million task parameters and two bytes per stored value, base storage is two billion bytes and task storage is two million bytes. Activations, optimizer states, cache and workspace remain additional.
spec:
  header: STORAGE BOUNDARY
  variables: {N: 1000000000, na: 1000000, b: 2}
  rows:
    - {key: base weights, formula: N*b, format: bytes}
    - {key: task weights, formula: na*b, format: bytes}
    - {key: excluded, value: activations / optimizer / workspace}
    - {key: deployment, value: base + task + tokenizer + template}
```

## Experimental design

**PAPER-REPORTED.** The adapter study uses BERT on GLUE, additional classification datasets, and SQuAD; validation selects bottleneck sizes and training settings, including repeated seeds. Its main comparison establishes a parameter/quality tradeoff within those tasks. [R23.1] (§3.1–3.6) Prompt tuning studies T5 scale, prompt length and initialization, reports three-run variation, and includes domain-transfer tests; its scale-dependent parity is a result for that protocol. [R23.2] (§2–5, Fig. 1)

**PAPER-REPORTED.** Prefix tuning compares GPT-2 table-to-text generation and BART summarization, with low-data and unseen-topic evaluations. BitFit compares encoder fine-tuning with bias subsets across GLUE and data regimes. These experiments change both task and architecture relative to modern decoder instruction adaptation, so their scores cannot be pooled into one family ranking. [R23.3] (§5–7); [R23.4] (§4, Tables 1–3)

## Observations

**What the paper claims.** **PAPER-REPORTED.** Each originating study demonstrates that its restricted intervention can preserve useful downstream quality in the disclosed setting; the papers differ in task, architecture, parameter boundary, and training protocol. [R23.1] [R23.2] [R23.3] [R23.4]

**What the evidence shows.** **UNVERIFIED.** This edition has not reproduced those comparisons on a shared 2026 model or independently established matched-quality total-memory savings for all families.

**What we infer.** **MATHEMATICALLY-DERIVED.** Equations 23.1–23.2 show why training-state savings, stored-artifact savings, and inference savings require separate denominators. A small $n_a$ constrains task-state storage; it gives no bound on activations or added sequence work.

**What remains unknown.** **NOT-DISCLOSED.** The cited papers do not specify this book's intended workload, service-level objective, or current deployment hardware. Their energy and monetary costs cannot be transferred to that workload.

## Failure modes

**MATHEMATICALLY-DERIVED.** Three failures have different signatures. A parameter-selection error updates supposedly frozen tensors and changes the base hash. An interface mismatch loads valid-shaped task tensors into a changed module ordering or attention layout and changes outputs. An accounting error reports trainable state while an activation peak causes OOM. Detect them respectively with immutable-tensor checks, deterministic interface probes, and peak-resident measurements at declared sequence and batch sizes. A zero-sized selective set cannot learn unless another trainable component exists; a zero-length prompt reduces to the frozen base.

## Siblings

**MATHEMATICALLY-DERIVED.** Full tuning maximizes accessible existing-coordinate directions; selective tuning restricts those coordinates; inserted modules expand the architecture; prompts alter conditioning; prefixes alter layer memory; LoRA adds factored linear updates. Retrieval in Chapter 22 changes available evidence rather than task tensors. Quantization in Chapter 40 changes representation precision. These interventions can coexist, but coexistence requires an explicit composed operator graph and its own evaluation.

## Extensions

**PAPER-REPORTED.** LoRA's factorized update is an alternative branch that supports algebraic merging into a dense weight. [P14] (§4.1) The documented rsLoRA, DoRA, and LoRA+ successors change scaling, parameterization, and optimization respectively; [23.2](23-2-lora-mechanics.md) reconstructs those differences. They are not interchangeable names for increasing rank.

## Limitations

**MATHEMATICALLY-DERIVED.** Local Jacobian analysis describes small functional changes around a specified point. Large updates, nonlinear gating, and changes of prompt length can invalidate its approximation. A restricted family may fail the quality constraint even with lower training-state cost. Such a result establishes a limit for the tested budget and search procedure, not impossibility for every parameter-efficient method.

## Reproducibility

**UNVERIFIED.** No training or runtime benchmark was executed here. Reproduction requires base and tokenizer revisions, template, target masks, actual trainable names/shapes, family-specific initialization, optimizer groups, sequence packing, seed, stopping clock, full memory trace, and exported artifact. The paper/doc inspection records and exact locators are in [the ledger](references.md); the proposed matched-quality study is in [verification](verification.md).

## References

- [P14](references.md#p14) — LoRA.
- [R23.1](references.md#r231) — bottleneck adapters.
- [R23.2](references.md#r232) — prompt tuning.
- [R23.3](references.md#r233) — prefix tuning.
- [R23.4](references.md#r234) — BitFit.
- [R23.5](references.md#r235) — PEFT LoRA configuration.
