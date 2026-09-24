---
id: ms.section.13.2
entity_type: section
title: Width, depth, and heads
short_title: Width, depth, and heads
section: 13.2
slug: 13-2-width-depth-and-heads
parent: ms.chapter.13
prev_sibling: ms.section.13.1
next_sibling: ms.section.13.3
children: []
prerequisites: [ms.chapter.5, ms.chapter.10, ms.section.13.1]
downstream: [ms.chapter.14, ms.chapter.19, ms.chapter.21]
word_count_target: 1800
volume: 1
part: 3
chapter: 13
related: []
relations: []
axes: {lifecycle: [pretraining, inference], mechanism: [dense_architecture, parameter_allocation], feedback_setting: [], modality: [text]}
papers: [P01, P02]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core, impl.nvidia-transformer-engine]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [KNOWN, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-25
editorial_status: manuscript_draft
---

# 13.2 Width, depth, and heads

## Scope

**KNOWN — chapter matrix.** This section owns capacity allocation across width, depth, and attention heads, including tensor shapes, representational bottlenecks, and scaling constraints. It generalizes the fixed reference accounting of [§5.6](../../part-01-scientific-foundations/ch05-minimal-transformer-and-execution-trace/05-6-reference-accounting.md). The baseline is choosing an architecture from a parameter total. Success requires a decomposed parameter and forward-FLOP model whose exclusions are explicit.

## Why this exists

**DERIVED.** Parameters are storage objects; computation is a sequence of operator invocations. The same number of parameters can be arranged into many shallow wide matrices or many deeper narrow matrices. Those arrangements change sequential dependency length, activation shapes, attention work, and opportunities for device utilization.

**DERIVED.** Head count creates a further ambiguity. In conventional multi-head attention, increasing heads while reducing each head's dimension keeps total projection width fixed. Increasing heads while preserving head dimension enlarges the projections instead. Both changes are informally described as “more heads,” yet only one preserves matrix parameter count. An ablation that does not distinguish them has no stable independent variable.

## Intuition

**DERIVED.** Residual width bounds the dimension of the vector passed between blocks. Feed-forward width changes the internal nonlinear expansion. Attention projection width determines the combined head space. Depth determines how many transformations are composed. These quantities are related by a chosen architecture, not by a universal identity.

**KNOWN — notation.** Use $d=d_{\mathrm{model}}$, $f=d_{\mathrm{ff}}$, $H=H_q=H_{kv}$ for ordinary multi-head attention, and $d_a=Hd_h$. The global symbol $D$ remains training tokens; it is not reused for model width.

## Formulation

> **Definition — Body parameter budget.** The scalar parameters in block projection matrices under Eq. 13.4; vocabulary tables, normalization, biases, and other learned terms are accounted for separately.

**MATHEMATICALLY-DERIVED — homogeneous dense decoder.** For $L$ blocks, bias-free attention, a feed-forward block with $k$ weight matrices of compatible dimensions, and $e$ distinct vocabulary tables,

$$
N=L(4dd_a+kdf)+eVd+N_{\mathrm{other}}.
$$
*(Eq. 13.4)*

where $k=2$ for an ordinary two-projection feed-forward block and $k=3$ for the specified gated variant; $e=1$ when input and output share one table and $e=2$ when untied. $N_{\mathrm{other}}$ includes normalization, biases, position parameters, auxiliary heads, and any omitted adapters. Cross-attention requires the additional term from §13.1.

**MATHEMATICALLY-DERIVED — dense full-matrix forward count.**

$$
F_{\mathrm{body}}=
2BTL(4dd_a+kdf)+4BLT^2d_a.
$$
*(Eq. 13.5)*

where $B$ is batch size, $T$ training sequence length, and multiply-add counts as two FLOPs. The final term counts dense score and value products; a causal kernel that avoids masked tiles requires a different realized-work model. Softmax, activation functions, normalization, residual adds, position transforms, and the vocabulary head are excluded.

**MATHEMATICALLY-DERIVED — intermediate storage.** A naive materialized attention score tensor has

$$
M_{\mathrm{scores}}=bBH T^2,
\qquad
M_{\mathrm{one\ residual}}=bBTd.
$$
*(Eq. 13.6)*

where $b$ is bytes per stored value. The first is a representation-specific allocation, not a universal attention-memory requirement. Training retention across layers depends on recomputation and fusion.

~~~figure
id: fig-13.6
kind: calculator
title: Dense block parameter allocation
caption: Eq. 13.4 with projected attention width equal to residual width. The output excludes embeddings, biases, normalization, and positional parameters.
placement: rail
anchor: formulation
states:
  - {anchor: formulation, label: "24 blocks at width 1024", variables: {L: 24, d: 1024, f: 4096, k: 2}, note: "Body matrices contain 301,989,888 parameters, excluding embeddings and small terms."}
  - {anchor: mechanism, label: "6 blocks at width 2048", variables: {L: 6, d: 2048, f: 8192, k: 2}, note: "The same body count has different depth and attention-work coefficients."}
  - {anchor: siblings, label: "Add a gate at fixed width", variables: {L: 24, d: 1024, f: 4096, k: 3}, note: "Adding a third FFN matrix without reducing its width breaks the match."}
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-13.4
alt: Twenty-four blocks of width 1024 with a two-matrix feed-forward width 4096 contain 301,989,888 body matrix parameters.
spec:
  tex: N_{\mathrm{body}}=L(4d^2+kdf)
  equation: "13.4"
  inputs:
    - {symbol: L, label: blocks, default: 24, min: 1, max: 256, format: integer}
    - {symbol: d, label: residual width, default: 1024, min: 64, max: 16384, format: integer}
    - {symbol: f, label: feed-forward width, default: 4096, min: 64, max: 65536, format: integer}
    - {symbol: k, label: feed-forward matrices, default: 2, min: 2, max: 3, options: [2, 3], format: integer}
  outputs:
    - {symbol: Nbody, label: body matrix parameters, formula: L*(4*d^2+k*d*f), format: params}
~~~

## Mechanism

**MATHEMATICALLY-DERIVED.** With $d_a=d$, a query/key/value projection maps $[B,T,d]$ to $[B,T,3d]$. Splitting heads produces $[B,H,T,d_h]$. The $QK^\top$ product and value aggregation each cost $2BT^2Hd_h$, so their leading arithmetic depends on $d_a=Hd_h$, while the materialized score array depends on $H$. Equal attention-product FLOPs therefore do not imply equal score-storage bytes.

**DERIVED.** If $H$ grows at fixed $d$, each head becomes narrower and each head's compatibility scores arise from a lower-dimensional projected space. That changes factorization and softmax partitioning without adding projection parameters. It does not prove either improved or degraded task quality. If $d_h$ is fixed instead, $d_a$ grows with $H$, changing parameters, arithmetic, and output-projection input width.

**MATHEMATICALLY-DERIVED — controlled counterexample.** Compare architecture A with $L=24,d=1024,f=4096$ and architecture B with $L=6,d=2048,f=8192$, both with $d_a=d$ and $k=2$. Each has $301{,}989{,}888$ body matrix parameters. The embedding and normalization terms are deliberately excluded from this equality.

~~~figure
id: fig-13.7
kind: compare
title: Equal body parameters with unequal execution structure
caption: Both configurations contain 301,989,888 body matrix parameters. Embedding and small-parameter differences must be added before claiming equal total size.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: [DERIVED:eq-13.4, DERIVED:eq-13.5, DERIVED:eq-13.6]
alt: A has 24 blocks of width 1024; B has six blocks of width 2048. A has twice the depth-width product and four times the block count despite equal body parameters.
spec:
  axis: Fixed body matrix parameter count with ordinary two-matrix feed-forward blocks
  columns:
    - {id: a, label: "A: deeper"}
    - {id: b, label: "B: wider"}
  rows:
    - {dimension: blocks, values: {a: "24", b: "6"}}
    - {dimension: residual width, values: {a: "1024", b: "2048"}}
    - {dimension: feed-forward width, values: {a: "4096", b: "8192"}}
    - {dimension: body parameters, values: {a: "301989888", b: "301989888"}}
    - {dimension: depth times width, values: {a: "24576", b: "12288"}}
    - {dimension: dense attention-product coefficient, values: {a: "98304 B T^2", b: "49152 B T^2"}}
~~~

**MATHEMATICALLY-DERIVED.** Eq. 13.5 gives identical body projection FLOPs for these architectures at the same $B,T$. Their attention-product terms differ by two because $Ld$ differs by two. Retaining one residual-sized tensor per block also produces a twofold difference under that explicitly chosen retention model. Meanwhile A requires four times as many sequential blocks. None of those statements predicts a fourfold latency ratio: kernel efficiency, overlap, launch overhead, and memory behavior intervene.

**DERIVED.** Width also interacts with vocabulary cost. At fixed vocabulary size, B's input table has twice as many parameters as A's. Matching only body parameters while reporting “equal total parameters” would therefore be false. A total-budget search must subtract all nonbody terms before allocating block capacity.

**DERIVED.** Hardware constraints discretize the algebra. A valid head decomposition requires integral dimensions. Tensor-parallel partitioning may require divisibility or explicit padding. Fused kernels can impose supported head sizes, strides, or alignment. Rounding a feed-forward width upward changes the budget; silently rounding it back in the report hides real parameters and operations.

**DERIVED.** A rank bottleneck should be stated locally. A linear projection from $d$ to $d_a<d$ has rank at most $d_a$, but the entire nonlinear residual block is not consequently rank-limited to $d_a$: the identity path still carries the residual stream. Matrix-rank observations cannot be promoted directly into a global capability bound.

## Algorithm

**MATHEMATICALLY-DERIVED — sequence-distribution control.** For variable-length examples processed separately without padding, the attention-product term is proportional to the sum of squared lengths, whereas tokenwise projection work is proportional to their sum. Replacing the distribution by its mean length loses the variance contribution because the mean square equals the squared mean plus the variance. Padding examples to a common batch length introduces a third quantity: executed padded work. A depth–width comparison must retain the actual length histogram and batching policy before averaging per-token costs; identical total token counts alone do not match attention arithmetic.

**DERIVED — finite design enumeration.**

~~~text
Algorithm 13.2 — Enumerate dense designs under an explicit budget
INPUT: bounded candidate depths, widths, head dimensions, and FFN widths
OUTPUT: feasible configurations with decomposed costs and rejected constraints
STATE: one record per candidate
INVARIANT: total size includes every unique parameter category exactly once
1. Enumerate the finite Cartesian product of declared candidates.
2. Reject nonintegral head decompositions and unsupported partition constraints.
3. Resolve rounded physical dimensions and bias/normalization/head settings.
4. Count attention, FFN, vocabulary, position, and remaining parameters.
5. Count forward work for each declared source/target or decode workload.
6. Record representation-specific activation and state estimates separately.
7. Retain candidates meeting the exact budget; report mismatch for approximate matches.
8. Rank only by a predeclared evaluated objective, not by parameter count alone.
~~~

**DERIVED — complexity.** For $n_{\mathrm{cand}}$ candidates and $n_{\mathrm{shape}}$ explicit workload shapes, closed-form accounting costs $O(n_{\mathrm{cand}}n_{\mathrm{shape}})$ time and $O(n_{\mathrm{cand}})$ retained records. This is bounded offline enumeration, not a quadratic unbounded data algorithm. Avoid enumerating every integer width when supported alignment classes define a much smaller candidate set.

## Implementation

**OFFICIAL-DOCUMENTATION — [R13.10](references.md#r1310).** Hugging Face Transformers exposes architectural configuration fields for its Llama implementation; such fields provide an inspection surface, not a universal dense-model template. PyTorch (*Model / autograd framework*) supplies actual operators. NVIDIA Megatron-Core (*Distributed training*) exposes tensor-parallel projection components [R13.13](references.md#r1313).

**DERIVED.** Compare configuration-derived counts with an inventory of unique tensor objects or storage identities under the framework's sharing semantics. A state dictionary may expose several names for one logical shared parameter. Distributed shards add another distinction: local stored elements, global unique parameters, and replicated buffers are different totals.

**DERIVED.** Framework tracing should annotate actual sequence shapes and dispatch. A counter that reports only linear layers can agree exactly with the first term of Eq. 13.5 while omitting the long-context term entirely. Conversely, counting all masked positions as executed FLOPs can overestimate a kernel that skips causal tiles. Name the counting convention before comparing estimates.

## Experimental design

**PROPOSAL — no measurements reported.**

### Experiment 13.2 — Depth–width tradeoff at controlled budgets

- **Hypothesis:** equal body parameters preserve projection arithmetic but not attention work or state.
- **Setup:** instantiate the constructed A/B configurations with all excluded terms restored in the report.
- **Independent variables:** depth, width, head partition, and sequence length.
- **Controlled variables:** data, tokenizer, target budget, FFN family, precision, and optimizer search budget.
- **Dataset/workload:** held-out language modeling plus a declared domain slice.
- **Hardware:** record accelerator, interconnect, runtime, backend, and batch geometry.
- **Metrics:** exact parameter inventory, counted FLOPs, retained bytes, phase latency, and held-out loss.
- **Baselines:** same-width depth sweep and same-depth width sweep.
- **Expected result:** cost terms follow their formulas; quality ordering remains unpredicted.
- **Ablation:** change heads at fixed $d_a$ versus fixed $d_h$ as separate interventions.
- **Interpretation:** attribute structural cost before explaining measured latency.
- **Threats to validity:** unmatched embeddings, kernel padding, and unequal tuning effort.

## Observations

**What the paper claims.** **PAPER-REPORTED — P01.** Multi-head attention uses separate projected head spaces. No universal optimal head count is taken from the original experiment.

**What the evidence shows.** **MATHEMATICALLY-DERIVED.** The constructed configurations have equal body parameters and unequal attention-product coefficients.

**What we infer.** **DERIVED.** A parameter budget defines a feasible family, not a unique execution cost.

**What remains unknown.** **UNVERIFIED.** The best depth–width allocation for a given domain and hardware remains an empirical question.

## Failure modes

~~~figure
id: fig-13.8
kind: stat-panel
title: Head count and explicit score storage
caption: One full score tensor at batch 1, length 1024 and two bytes per element occupies 16 MiB for eight heads or 32 MiB for sixteen heads.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: DERIVED:eq-13.6
alt: One full score tensor at batch 1, length 1024 and two bytes per element occupies 16 MiB for eight heads or 32 MiB for sixteen heads.
spec:
  header: ACCOUNTING BOUNDARY
  rows:
    - {key: "total attention width", value: "1024 in either design"}
    - {key: "8 heads of width 128", value: "16 MiB"}
    - {key: "16 heads of width 64", value: "32 MiB"}
    - {key: "execution condition", value: "full score tensor retained"}
~~~

> **Failure mode — hidden total mismatch.** **DERIVED.** *Symptom:* “matched” models have different stored sizes. *Cause:* embeddings or normalization omitted. *Detection:* unique-parameter inventory. *Mitigation:* report every category and budget residual.

> **Failure mode — changed head intervention.** **DERIVED.** *Symptom:* a head-count study also changes projection size. *Cause:* fixed head dimension mistaken for fixed total width. *Detection:* inspect $Hd_h$. *Mitigation:* define which quantity is held constant.

## Siblings

**DERIVED.** Depth adds compositional stages; residual width enlarges interstage representation; FFN width enlarges local nonlinear work; head count repartitions or enlarges attention according to the stated constraint. [§13.3](13-3-feed-forward-alternatives.md) changes FFN form, and [§13.5](13-5-embeddings-and-heads.md) changes vocabulary allocation. Sparse expert capacity is a separate Chapter 16 mechanism, routed through the [Part III map](../README.md).

## Extensions

**DERIVED.** Heterogeneous layers replace the homogeneous factor $L$ by a sum over layer-specific dimensions. Bottleneck adapters require their own projections. Encoder–decoder models require separate encoder/decoder sums and cross-attention terms. Parameter sharing across layers reduces unique storage without removing repeated execution.

## Limitations

**DERIVED.** Closed-form FLOPs exclude communication, launch overhead, and memory traffic. Training work additionally includes gradients and possible recomputation. A constant multiplier on forward FLOPs is only an approximation under a specified backward implementation.

## Reproducibility

**DERIVED — required record.** Retain logical and padded dimensions, head decomposition, unique/shared parameter identities, excluded terms, task-head geometry, per-phase shapes, FLOP convention, and implementation constraints.

## References

[P01](references.md#p01); [R13.10 — configuration surface](references.md#r1310); [R13.13 — distributed projection route](references.md#r1313); [R13.15 — CS336](references.md#r1315).
