---
id: ms.section.16.1
entity_type: section
title: Conditional computation
short_title: Conditional computation
section: 16.1
slug: 16-1-conditional-computation
parent: ms.chapter.16
prev_sibling: null
next_sibling: ms.section.16.2
children: []
prerequisites: [ms.chapter.13, ms.chapter.14]
downstream: [ms.chapter.27, ms.chapter.29, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 16
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [mixture_of_experts, conditional_computation], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P10, P13]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 16.1 — Conditional computation

## Scope

Conditional computation changes which parameters participate in processing a token. This section distinguishes total parameters, per-token activated parameters, dense components, routing overhead, and physical residency. The baseline is the dense feed-forward allocation developed in [Chapter 13](../ch13-dense-transformer-design-and-parameter-allocation/README.md). Success is an accounting model that reconstructs both the logical computation and its storage requirements without treating parameter count as a quality or latency measurement.

## Why this exists

**PAPER-REPORTED.** Sparsely gated mixture-of-experts work explored increasing model capacity through input-dependent expert selection [R16.1]. Switch Transformers simplified routing to one selected expert per token in its sparse layers [P10]. These are architectural interventions: different tokens can use different feed-forward parameters.

**DERIVED.** Dense scaling couples additional feed-forward parameters to additional arithmetic for every token. Expert sparsity relaxes that coupling by storing alternatives and selecting a subset. It introduces a different constraint: the selected token representations and expert weights must meet at an execution location, while the complete expert collection must be stored, sharded, or loaded.

The useful comparison therefore has several axes. Equal activated expert arithmetic does not imply equal total memory. Equal total parameters does not imply equal arithmetic. Equal arithmetic does not imply equal latency when routing, communication, small matrix shapes, or load imbalance differ. An MoE description must identify which axis it holds fixed.

## Intuition

**DERIVED.** An expert is a parameterized function, not a guaranteed semantic specialist. The router assigns inputs to those functions. Specialization is an empirical property requiring evidence about assignments and behavior; expert names assigned after inspecting a few examples do not establish it.

Sparse activation is usually local to selected sublayers. Attention, normalization, residual paths, embeddings, output projections, shared experts, and router scoring may remain dense. A model described as top-two does not evaluate only two parameters or two complete models. It selects two expert branches within the relevant routing scope.

> **Definition — Activated-parameter contract.** A declared counting rule for the distinct parameter tensors used by one token or one batch, specifying dense components, shared experts, routed experts, router parameters, and tied-weight treatment.

## Formulation

**MATHEMATICALLY-DERIVED.** For one MoE feed-forward layer, let \(E\) be the number of equal-sized routed experts, \(k\in\{1,\ldots,E\}\) selected experts per token, \(P_e\) parameters per routed expert, \(P_s\) parameters in always-active shared expert branches, and \(P_r\) router parameters. Let \(P_d\) denote other always-active parameters inside the explicitly chosen accounting boundary. Then

$$
P_{\mathrm{total}}=P_d+P_s+P_r+EP_e,\qquad
P_{\mathrm{active,token}}=P_d+P_s+P_r+kP_e.
$$
*(Eq. 16.1)*

This counts the router's full scoring parameters when all expert scores are computed. It assumes distinct expert tensors and excludes tied-parameter double counting. Heterogeneous experts require a sum over the actual selected sizes.

For an ungated two-matrix expert of model width \(d\) and hidden width \(h\), ignoring biases, normalization, and elementwise operations,

$$
P_e=2dh,\qquad F_{e,\mathrm{forward}}\approx4dh
\quad\text{FLOPs per token}.
$$
*(Eq. 16.2)*

The FLOP convention counts a multiply and addition separately. A three-matrix gated expert instead has \(3dh\) matrix parameters and approximately \(6dh\) matrix FLOPs. Use the actual expert form from Chapter 13.

Let \(\mathcal S_t\) be token \(t\)'s selected expert set. Across a batch of \(M\) tokens,

$$
U=\left|\bigcup_{t=1}^{M}\mathcal S_t\right|,\qquad
k\le U\le\min(E,Mk).
$$
*(Eq. 16.3)*

The union of touched experts can approach the full expert collection even though every token selects only \(k\). Per-token activation and per-batch weight access are different quantities.


~~~figure
id: fig-16.3
kind: calculator
title: "Routed parameter capacity versus activation"
caption: "Illustrative equal-sized routed experts; this ratio excludes dense components, shared experts, and routing overhead."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.1"
alt: "Illustrative equal-sized routed experts; this ratio excludes dense components, shared experts, and routing overhead."
spec: {"tex":"P_{routed}/P_{active,routed}=E/k","equation":"16.1","inputs":[{"symbol":"E","label":"routed experts","default":64,"min":8,"max":256,"format":"integer"},{"symbol":"k","label":"selected experts","default":2,"min":1,"max":8,"format":"integer"},{"symbol":"Pe","label":"parameters per expert","default":1000000,"min":100000,"max":10000000,"format":"integer"}],"outputs":[{"symbol":"total","label":"routed parameters","formula":"E*Pe","format":"integer"},{"symbol":"active","label":"active routed parameters","formula":"k*Pe","format":"integer"},{"symbol":"ratio","label":"routed-only ratio","formula":"E/k","format":"fixed2"}]}
states: [{"anchor":"formulation","label":"Top two","variables":{"E":64,"k":2,"Pe":1000000},"note":"Total routed storage and activation have different counts."},{"anchor":"mechanism","label":"More experts","variables":{"E":128,"k":2,"Pe":1000000},"note":"Selected-expert arithmetic is unchanged in this restricted model."},{"anchor":"failure-modes","label":"More active branches","variables":{"E":64,"k":8,"Pe":1000000},"note":"Increasing top-k changes active work even at fixed total parameters."}]
~~~


## Mechanism

**DERIVED.** A token passes through the router, gathers selected expert outputs, combines them with specified coefficients, and continues through the residual architecture. This selection changes the function family. It is not the same operation as pruning a dense network after training or placing dense weights on more devices.

Increasing \(E\) at fixed \(k,d,h\) increases routed parameter capacity without increasing the leading selected-expert matrix arithmetic per token. However, a dense linear router over all experts costs \(O(MdE)\), and expert selection has its own cost. The complete layer cost is therefore not exactly constant in \(E\).

Parameter storage persists independently of whether an expert receives a particular token. In training, expert weights, gradients, and optimizer states have their own allocation and sharding rules. A zero gradient for one batch does not imply that the corresponding optimizer state has disappeared. In inference, offloading inactive experts can reduce device residency but adds transfer and scheduling costs.

Shared experts contribute on every token under an always-active shared-branch design. Their parameters belong in both total and activated counts. **PAPER-REPORTED.** DeepSeek-V3 uses shared and routed expert structure [P13]. **DERIVED.** That pattern does not justify assuming identical expert widths or shared-branch behavior in every model.


~~~figure
id: fig-16.4
kind: diagram
title: "Conditional branches and always-active state"
caption: "The router selects a subset of routed functions while shared functions remain active; all stored experts remain part of total parameter accounting."
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.1"
alt: "The router selects a subset of routed functions while shared functions remain active; all stored experts remain part of total parameter accounting."
spec: {"direction":"LR","nodes":[{"id":"x","kind":"tensor","label":"Token representation"},{"id":"router","kind":"process","label":"Router scores and selection"},{"id":"experts","kind":"model","label":"Selected routed experts"},{"id":"shared","kind":"model","label":"Always-active shared branch"},{"id":"combine","kind":"process","label":"Weighted combination"},{"id":"store","kind":"memory","label":"Complete expert collection"}],"edges":[{"from":"x","to":"router","kind":"flow"},{"from":"router","to":"experts","kind":"flow"},{"from":"x","to":"shared","kind":"flow"},{"from":"experts","to":"combine","kind":"flow"},{"from":"shared","to":"combine","kind":"flow"},{"from":"store","to":"experts","kind":"dependency"}]}
~~~


Arithmetic intensity depends on tokens per expert. A large prefill batch may accumulate many rows for an expert's matrix multiplication, while a small decoding batch may activate several experts with very few rows each. The same per-token FLOP estimate can therefore correspond to different weight reuse and hardware utilization. This is a consequence of the execution shape, not an observed performance result.

Capacity has two meanings that must remain separate. Statistical capacity concerns representational possibilities and learned behavior. Runtime expert capacity concerns how many routed assignments an execution policy admits. A large total parameter count establishes neither useful specialization nor a no-drop execution guarantee.

For the illustrative equal-sized case, the routed-only total-to-active ratio is \(E/k\). The full-model ratio is smaller when always-active components contribute substantially. It can also differ across tokens for variable-\(k\) or heterogeneous-expert routing. Report the distribution or exact policy instead of one unexplained headline number.

## Algorithm

**DERIVED — symbolic and trace-based accounting.**

~~~text
Algorithm 16.1 — Reconstruct total and activated parameters
INPUT: model tensor inventory, expert membership, shared/dense ownership,
       bounded routing trace, tied-weight identities, precision policy
OUTPUT: total count, per-token active counts, batch union, storage ledger
STATE: unique parameter identifiers and selected-expert sets
INVARIANT: each physical parameter tensor is counted once in total storage
1. Validate expert identifiers and the declared routing scope.
2. Deduplicate tied tensors in the total parameter inventory.
3. Classify always-active, shared-expert, routed-expert, and router tensors.
4. Sum total parameters independently of the routing trace.
5. For each token, union always-active tensors with selected expert tensors.
6. Compute the batch-wide union of selected experts.
7. Convert parameter counts to payload bytes using the actual storage policy.
8. Report omitted optimizer, activation, cache, and communication terms explicitly.
~~~

For \(M\) tokens with at most \(k\) assignments, trace aggregation can run in \(O(Mk+E)\) using bounded expert-index arrays. Avoid repeated full-model scans per token. Sorting arbitrary tensor identifiers adds comparator and lookup cost; a prebuilt inventory separates that work from the hot accounting path.

## Implementation

**OFFICIAL-DOCUMENTATION.** Hugging Face Transformers, **Model definition / adaptation**, exposes a Switch Transformers model interface and configuration [R16.5]. NVIDIA Megatron-Core, **Distributed training**, documents MoE execution options [R16.4]. These establish implementation surfaces, not measured equivalence across frameworks.

**DERIVED.** PyTorch, **Model / autograd framework**, supplies tensor and gradient boundaries for a small reference. Inspect the loaded tensor inventory rather than inferring counts from a model name. Record whether embeddings and output weights are tied, whether expert matrices are packed into larger tensors, and whether quantization metadata is stored separately.

A packed expert tensor may have one framework object but contain many experts. Conversely, a logically shared expert may have several physical replicas. Logical parameter count and physical replica storage are separate ledgers. Treat optimizer sharding, expert parallelism, and quantization as additional representation choices.

When measuring resource use, include dense attention and KV state under the chosen request shape. MoE changes feed-forward execution; it does not automatically shrink attention caches. Peak memory also includes dispatch buffers and temporary expert outputs, which the parameter formulas intentionally exclude.

## Experimental design

**PROPOSAL — no training or throughput outcome is claimed.**

### Experiment 16.1 — Capacity and activation accounting

- **Hypothesis:** Increasing routed expert count at fixed selected-expert width and count separates parameter storage from selected-expert arithmetic.
- **Setup:** Compare a bounded family with explicit tensor inventories and fixed expert forms.
- **Independent variables:** Expert count, top-k, shared-expert size, and batch token count.
- **Controlled variables:** Model width, expert hidden width, dense components, precision, and accounting boundary.
- **Dataset/workload:** Synthetic routing traces plus held-out token batches for later execution.
- **Hardware:** Record actual devices and runtime before measurement; none is implied by the formulas.
- **Metrics:** Total parameters, per-token activated parameters, batch expert union, payload bytes, and measured operator costs.
- **Baselines:** Dense feed-forward layers matched separately by active arithmetic and by total parameters.
- **Expected result:** The ledgers differ in the predicted structural ways; quality and speed remain empirical.
- **Ablation:** Remove shared experts or router cost from a diagnostic ledger to expose the resulting undercount.
- **Interpretation:** Reject any claimed comparison that silently changes its accounting boundary.
- **Threats to validity:** Tied-weight double counting, padded tensor capacity, heterogeneous expert sizes, and hidden replicas.

## Observations

**What the paper claims — PAPER-REPORTED.** Sparse gating and Switch routing investigate conditional expert computation [R16.1, P10].

**What the evidence shows — MATHEMATICALLY-DERIVED.** Equations 16.1–16.3 separate stored parameters, per-token activation, and the batch union.

**What we infer — DERIVED.** Activated-parameter numbers require a counting contract before they can inform resource comparisons.

**What remains unknown — UNVERIFIED.** Quality gained from additional experts and realized execution efficiency require controlled experiments.

## Failure modes

**DERIVED.** Typical errors include omitting router or shared parameters, comparing per-token activation with per-batch memory traffic, and interpreting sparse expert use as sparse attention state.


~~~figure
id: fig-16.5
kind: stat-panel
title: "MoE accounting boundaries"
caption: "Check these independent boundaries before interpreting an MoE quality or resource claim."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-16.3"
alt: "Check these independent boundaries before interpreting an MoE quality or resource claim."
spec: {"header":"Required distinctions","rows":[{"key":"Total","value":"All distinct stored parameters"},{"key":"Per token","value":"Selected and always-active tensors"},{"key":"Per batch","value":"Union of touched experts"},{"key":"Physical","value":"Replicas buffers and precision metadata"}]}
~~~


A low measured expert union can also be a warning rather than an efficiency success. It may reflect a narrow workload, a small batch, or collapsed routing. Those explanations require the router and training analyses in the following sections.

## Siblings

**DERIVED.** Dense widening applies added parameters to every token. MoE adds selectable functions. Model parallelism distributes computation without necessarily changing the function. Weight compression changes representation precision or structure. These mechanisms can coexist but have different mathematical boundaries.

## Extensions

**DERIVED.** Heterogeneous experts replace equal-size formulas with selected sums. Sequence-level routing changes assignment granularity. Multimodal experts may process different representation shapes, making a single active-parameter ratio even less informative. Declare the token or example unit used by each branch.

## Limitations

**DERIVED.** Parameter counts do not establish statistical capacity, task quality, communication volume, or wall-clock speed. The forward FLOP approximation omits elementwise operations and backward computation. It is a transparent leading-term model, not an end-to-end benchmark.

## Reproducibility

Preserve the parameter inventory, tensor identity rules, expert configuration, routing traces, precision metadata, model revision, and accounting boundary. Keep logical parameters, physical replicas, and runtime buffers in separate fields. Record all excluded costs before presenting ratios.

## References

[P10](references.md#p10); [P13](references.md#p13); [R16.1](references.md#r161); [R16.4](references.md#r164); [R16.5](references.md#r165).

