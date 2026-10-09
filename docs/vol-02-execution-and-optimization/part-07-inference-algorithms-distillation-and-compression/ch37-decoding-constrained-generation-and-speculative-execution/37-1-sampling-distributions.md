---
id: ms.section.37.1
entity_type: section
title: Sampling distributions
short_title: Sampling distributions
volume: 2
part: 7
chapter: 37
section: '37.1'
slug: 37-1-sampling-distributions
parent: ms.chapter.37
prev_sibling: null
next_sibling: ms.section.37.2
children: []
prerequisites:
- ms.chapter.4
- ms.chapter.5
- ms.chapter.14
- ms.chapter.31
downstream:
- ms.chapter.38
- ms.chapter.39
- ms.chapter.40
- ms.chapter.42
- ms.chapter.48
related: []
relations: []
axes:
  lifecycle:
  - inference
  mechanism:
  - decoding
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.vllm
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 2000
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 37.1 — Sampling distributions

## Scope

[DERIVED] This section owns the probability distribution implemented by greedy selection, temperature, top-k, nucleus filtering and history-dependent penalties. The baseline is the model softmax at a fixed token prefix. Success means identifying the actual normalized token law, its support, ordering and reproducibility boundary. Structural legality is taught in §37.4; speculative correction in §37.5 preserves a declared processed target, rather than necessarily the unmodified model. The artifact is a processor specification that can be compared independently of generated prose.

## Why this exists

[DERIVED] A checkpoint does not uniquely specify a generator. The prompt template, token history, logit processors, precision, random-number algorithm and stopping policy jointly define the delivered response. Two services can load identical weights and return different distributions without either changing the model. A request described only as “temperature 0.7” is therefore incomplete. It can still include nucleus truncation, a minimum-length EOS mask, a frequency penalty or a grammar, each of which changes support or relative odds.

[OFFICIAL-DOCUMENTATION] The pinned vLLM release exposes raw and processed log-probability modes, multiple sampling implementations, per-request seed handling and separate legacy/V2 sampler paths. Its native top-k implementation retains tokens tied at the kth logit threshold. A fused sampler is described as statistically equivalent, without promising the same realized draw as native sampling. These distinctions are implementation facts at this release pin, not a cross-engine reproducibility guarantee. [R37.1, sampler.py and topk_topp_sampler.py](references.md#r371)

## Intuition

[MATHEMATICALLY-DERIVED] Positive temperature rescales log odds. It leaves their ordering unchanged before other processors, but changes their magnitude and hence a probability-mass-based cutoff. Top-k retains a rank-defined set; top-p retains a mass-defined set. A penalty can change the ordering itself. A legality mask removes events, then normalization redistributes their probability to surviving events. These operations do not generally commute, even when they share the same final softmax call.

[DERIVED] Greedy generation is a deterministic decision rule under declared ties. It does not sample the original model distribution at “zero noise.” The limiting softmax as temperature approaches zero is uniform across exactly tied maxima, whereas a library argmax can choose a particular tied index. Numeric rounding can create or remove a tie. A reproducibility contract must state whether it requires identical output tokens, equality of probability laws, or only comparable task metrics; those are different assertions.

## Formulation

| Local object | Meaning | Shape / unit |
|---|---|---|
| $z(v,h)$ | Model logit for token event $v$ at prefix $h$ | $[V]$, logit units |
| $u>0$ | Sampling temperature, distinct from distillation $\tau$ | Dimensionless |
| $n_v(h)$ | Count in the explicitly selected history scope | Integer |
| $f,a,r$ | Frequency, presence and repetition controls | Declared scalar conventions |
| $S(h,z)$ | Surviving support after ordered filters | Vocabulary subset |
| $q(v\mid h)$ | Actual sampling law | Normalized $[V]$ probability |

[MATHEMATICALLY-DERIVED] One declared processor family first applies sign-aware repetition scaling, then additive frequency/presence penalties, then temperature and support selection:

$$
\tilde z_v=\begin{cases}z_v/r&n_v>0,\ z_v\ge0,\\r z_v&n_v>0,\ z_v<0,\\z_v&n_v=0,\end{cases}\quad w_v=\tilde z_v-f n_v-a\mathbf1\{n_v>0\},\qquad q(v\mid h)=\frac{\mathbf1\{v\in S\}e^{w_v/u}}{\sum_{j\in S}e^{w_j/u}}.
$$
*(Eq. 37.1)*

where $r>0$; $r>1$ suppresses repeated tokens under this convention. Counts for repetition can include prompt tokens while frequency/presence counts can be response-only. This is a declared mathematical family; the implementation-specific scopes and ordering must be pinned separately. Require nonempty finite-mass support.

```figure
{
  "id": "fig-37.1",
  "kind": "calculator",
  "title": "Temperature and repeated-token odds",
  "caption": "Illustrative logits (2,1,0), response-count penalty, no truncation and no repetition multiplier. The three outputs sum to one; changing the integer count can change the most likely token.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.1",
  "alt": "Adjust the declared illustrative inputs; repeated-token probability=exp((2-f*n)/u)/(exp((2-f*n)/u)+exp(1/u)+1), second-token probability=exp(1/u)/(exp((2-f*n)/u)+exp(1/u)+1), third-token probability=1/(exp((2-f*n)/u)+exp(1/u)+1). Illustrative logits (2,1,0), response-count penalty, no truncation and no repetition multiplier. The three outputs sum to one; changing the integer count can change the most likely token.",
  "spec": {
    "tex": "q_1=\\frac{e^{(z_1-fn)/u}}{e^{(z_1-fn)/u}+e^{z_2/u}+e^{z_3/u}}",
    "equation": "37.1",
    "inputs": [
      {
        "symbol": "u",
        "label": "sampling temperature",
        "default": 0.7,
        "min": 0.1,
        "max": 2.1,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "f",
        "label": "frequency penalty",
        "default": 0.2,
        "min": 0,
        "max": 2,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "n",
        "label": "previous occurrences",
        "default": 2,
        "min": 0,
        "max": 20,
        "format": "integer",
        "step": 1
      }
    ],
    "outputs": [
      {
        "symbol": "p1",
        "label": "repeated-token probability",
        "formula": "exp((2-f*n)/u)/(exp((2-f*n)/u)+exp(1/u)+1)",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "p2",
        "label": "second-token probability",
        "formula": "exp(1/u)/(exp((2-f*n)/u)+exp(1/u)+1)",
        "format": "raw",
        "emphasis": false
      },
      {
        "symbol": "p3",
        "label": "third-token probability",
        "formula": "1/(exp((2-f*n)/u)+exp(1/u)+1)",
        "format": "raw",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared boundary",
      "variables": {
        "u": 1,
        "f": 0,
        "n": 0
      },
      "note": "Without penalties, the declared logits determine the full-support law."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "u": 0.7,
        "f": 0.2,
        "n": 2
      },
      "note": "The response-count penalty changes logits before sampling."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "u": 0.1,
        "f": 2,
        "n": 20
      },
      "note": "Very small but nonzero event masses remain visible; this is not a zero-temperature contract."
    }
  ]
}
```

[MATHEMATICALLY-DERIVED] With deterministic total order $v_{(1)},\ldots,v_{(V)}$ resolving equal logits, rank truncation retains the first $k$ events. For a normalized pre-nucleus law $q_0$, nucleus filtering retains the smallest leading set whose mass reaches threshold $\rho$:

$$
S_k=\{v_{(1)},\ldots,v_{(k)}\},\qquad j_\rho=\min\left\{j:\sum_{i=1}^j q_0(v_{(i)})\ge\rho\right\},\quad S_\rho=\{v_{(1)},\ldots,v_{(j_\rho)}\},\quad q_\rho(v)=\frac{q_0(v)\mathbf1\{v\in S_\rho\}}{q_0(S_\rho)}.
$$
*(Eq. 37.2)*

where $1\le k\le V$ and $0<\rho\le1$. If top-k precedes top-p, $q_0$ is the renormalized top-k law. This exact-k/tie convention is the book specification, not a claim that every backend has identical threshold ties.

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Compute stable normalization by subtracting the largest surviving finite logit before exponentiation. This cancels in the ratio and avoids overflow. Masking with negative infinity is valid only when some finite event remains; all-negative-infinity softmax is undefined. A minimum-token rule may temporarily remove EOS. A grammar may remove every alternative that a separately computed top-p set retained. Detect an empty intersection rather than quietly unmasking tokens, because unmasking changes the promised constraint.

```figure
id: fig-37.2
kind: diagram
title: Ordered probability construction
caption: A processor pipeline defines the target event distribution. The legality stage shown here is a declared contract;
  a concrete runtime must identify its actual placement, including upstream grammar masking.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.1
alt: The information path is Model logits, then Bias and penalties, then Legality contract, then Temperature, then Rank and
  mass filters, then Normalized law. A processor pipeline defines the target event distribution. The legality stage shown
  here is a declared contract; a concrete runtime must identify its actual placement, including upstream grammar masking.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: tensor
    label: Model logits
    sub: V token events
  - id: n1
    kind: process
    label: Bias and penalties
    sub: history and scope
  - id: n2
    kind: boundary
    label: Legality contract
    sub: declared placement
  - id: n3
    kind: process
    label: Temperature
    sub: positive u
  - id: n4
    kind: process
    label: Rank and mass filters
    sub: specified ties
  - id: n5
    kind: metric
    label: Normalized law
    sub: record chosen log q
  edges:
  - from: n0
    to: n1
  - from: n1
    to: n2
  - from: n2
    to: n3
  - from: n3
    to: n4
  - from: n4
    to: n5
```

[MATHEMATICALLY-DERIVED] For two retained events, the ratio is $q(v)/q(j)=\exp((w_v-w_j)/u)$. Differentiating the full-support law gives $\partial q(v)/\partial u=q(v)(\mathbb E_q[w]-w_v)/u^2$. Thus increasing temperature reduces probability on above-mean logits and raises it on below-mean logits. It does not imply monotonically higher task accuracy. Once top-p changes the support, the overall mapping is piecewise smooth with cutoff discontinuities; derivatives that ignore these support transitions describe only one region.

```figure
{
  "id": "fig-37.3",
  "kind": "chart",
  "title": "Binary probability under temperature",
  "caption": "Analytical full-support binary distributions. Temperature approaches a point selection only for a unique maximum; this plot contains no task-quality measurements.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.1",
  "alt": "Analytical curves: logit gap one equals 1/(1+exp(-1/x)), logit gap two equals 1/(1+exp(-2/x)). Analytical full-support binary distributions. Temperature approaches a point selection only for a unique maximum; this plot contains no task-quality measurements.",
  "spec": {
    "type": "line",
    "x": {
      "label": "sampling temperature u",
      "scale": "linear",
      "domain": [
        0.1,
        2.1
      ]
    },
    "y": {
      "label": "probability of higher logit",
      "scale": "linear",
      "domain": [
        0.5,
        1
      ],
      "format": "raw"
    },
    "series": [
      {
        "id": "s0",
        "label": "logit gap one",
        "formula": "1/(1+exp(-1/x))",
        "sample": {
          "to": 2.1,
          "count": 101,
          "from": 0.1
        }
      },
      {
        "id": "s1",
        "label": "logit gap two",
        "formula": "1/(1+exp(-2/x))",
        "sample": {
          "to": 2.1,
          "count": 101,
          "from": 0.1
        }
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 0.7310585786300049,
        "label": "Temperature1; gap1 probability0.7311"
      },
      {
        "x": 1,
        "y": 0.8807970779778823,
        "label": "Temperature1; gap2 probability0.8808"
      }
    ]
  }
}
```

[MATHEMATICALLY-DERIVED] Processor order has an observable finite counterexample. Let probabilities be $(0.60,0.25,0.10,0.05)$, grammar-legal tokens be the second and third, and nucleus threshold be $0.8$. Nucleus first retains the first two tokens; intersecting legality leaves only the second. Legality first produces $(0,5/7,2/7,0)$; its nucleus must retain both legal tokens to reach $0.8$. Normalization does not reconcile these different supports. The same issue affects which distribution is logged for importance weighting or speculative correction.

```figure
id: fig-37.4
kind: matrix
title: Nucleus and grammar order
caption: 'Illustrative probabilities (0.60,0.25,0.10,0.05), legal events b/c, top-p0.8. Rows: nucleus then grammar; grammar
  then nucleus. Columns: a,b,c,d.'
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.2
alt: 'Each filled cell denotes an admitted relationship. Illustrative probabilities (0.60,0.25,0.10,0.05), legal events b/c,
  top-p0.8. Rows: nucleus then grammar; grammar then nucleus. Columns: a,b,c,d.'
spec:
  rows: 2
  cols: 4
  pattern: explicit
  cells:
  - - 0
    - 1
    - 0
    - 0
  - - 0
    - 1
    - 1
    - 0
  rowLabel: nucleus-first / grammar-first
  colLabel: a / b / c / d
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

[DERIVED] Counts require an explicit scope. Frequency suppression grows with repeated occurrences; presence suppression applies once after the first occurrence. Sign-aware repetition scaling changes a positive and a negative logit differently and is not equivalent to subtracting a constant. A punctuation-heavy schema can make an aggressive repetition penalty discourage required delimiters. A code or tool signature can require repeated identifiers. A penalty intended to improve surface diversity can therefore reduce correctness without any numerical bug.

## Algorithm

### Algorithm 37.1 — auditable next-token selection

[DERIVED] Algorithm 37.1 is the reference processor contract, not a transcription of every vLLM backend. Inputs are finite logits, history, ordered processor list, legal vocabulary, declared ties, request RNG key and mode. Output is a token, its processed log probability and a support/configuration identity. State contains no implicit global RNG dependency.

$$
\begin{aligned}
&1.\quad h\leftarrow\text{immutable prefix};\ s\leftarrow z(h);\ S\leftarrow\mathcal V.\\
&2.\quad\textbf{for each declared processor }P_i\textbf{ in order: }(s,S)\leftarrow P_i(s,S,h).\\
&3.\quad\text{allow only finite logits or }-\infty;\ \text{reject empty }S\text{ or no finite logit in }S.\\
&4.\quad\textbf{if greedy: }v\leftarrow\operatorname{ArgMax}_{\rm tie}(s|_S);\ q\leftarrow\delta_v.\\
&5.\quad\textbf{else: require }u>0;\ \ell\leftarrow\operatorname{LogSoftmax}(s|_S);\\
&6.\qquad v\leftarrow\operatorname{Categorical}(\ell;\text{request key, position, domain});\ q\leftarrow e^\ell.\\
&7.\quad\text{return }(v,\log q(v),\operatorname{Hash}(\text{model,tokenizer,config},h,P_{1:m},S,\text{RNG contract})).
\end{aligned}
$$

[DERIVED] Step2 applies stochastic temperature exactly once before mass-based top-p; its final logits s are already scaled. Greedy mode skips temperature. Step5 normalizes without rescaling. The algorithm terminates after a finite processor list and one categorical selection. Its invariant is that the returned probability belongs to the same event law used for selection. A raw model score may be retained as a separate field, never substituted for that probability. Worst-case full sorting costs $O(V\log V)$ per row; selection and scanning can improve particular top-k/top-p implementations. Penalty counts can be incrementally maintained, but their initialization and prompt scope still cost work. A fused kernel can avoid materializing a complete probability tensor without changing the intended law.

## Implementation

[DERIVED] Implementation route: **vLLM** (reference-stack §4 #41, **LLM inference engine**; §4.1 **INFERENCE ENGINE**), v0.31.0 at full commit db9527a46873454610df6dbedf79a36d6bf1a7f6. Source inspection establishes disclosed behavior, not an executed deployment.

[OFFICIAL-DOCUMENTATION] The V2 sampler constructs bias, penalties, bad-words and custom processors in list order, applies its thinking-budget forcing, then temperature, min-p and top-k/top-p. Its seeded native route uses a request seed, token position and token event to construct Gumbel draws, with a separate drafting noise domain. Explicit seeds, greedy rows and processed-logprob requests constrain fused-sampler eligibility. The older V1 sampler has a separately documented pipeline; the release identifier alone is insufficient to identify the selected path. [R37.1, worker/gpu/sample/{sampler,states,gumbel}.py](references.md#r371)

[OFFICIAL-DOCUMENTATION] The inspected PyTorch top-k fallback masks values strictly below the kth threshold, so ties can retain more than $k$ events. Its top-p path sorts ascending, accumulates mass after top-k masking and retains at least the largest-logit event. Accelerator kernels are separate source paths; this chapter does not infer bitwise equality from the fallback implementation. [R37.1, apply_top_k_top_p_pytorch and flashinfer_sample](references.md#r371)

```figure
{
  "id": "fig-37.5",
  "kind": "tensor-flow",
  "title": "Sampling processors transform a full vocabulary row",
  "caption": "Eq.37.1 analytical B=8, V=131072, FP32 materialization: a [B,V] buffer occupies4MiB. A separate probability copy adds another4MiB; fused samplers may avoid that copy. Weights, KV storage, sorting workspace and token indices are excluded.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.1",
  "alt": "Eight full vocabulary rows pass through frozen penalty/temperature and support-processing rules before sampling eight token IDs. A full FP32 logits buffer is4MiB; an optional probability copy has the same size. This is an allocation boundary, not measured runtime residency.",
  "spec": {
    "dims": {
      "B": "8 request rows",
      "V": "131072 vocabulary events"
    },
    "steps": [
      {
        "shape": "[B, V]",
        "label": "Model logits",
        "op": "Declared FP32 materialization",
        "cost": "4MiB for one buffer"
      },
      {
        "shape": "[B, V]",
        "label": "Processed logits",
        "op": "Frozen penalty, temperature and support rules",
        "cost": "In-place or separate allocation is implementation-specific"
      },
      {
        "shape": "[B, V]",
        "label": "Normalized event law",
        "op": "Normalize admitted support",
        "cost": "Optional extra4MiB probability copy"
      },
      {
        "shape": "[B]",
        "label": "Sampled token IDs",
        "op": "Record actual processed law and sampler state"
      }
    ]
  },
  "anchor": "implementation"
}
```

[DERIVED] The resource boundary includes the output-head computation, logits residency, sorting workspace, count state, random draws, host scheduling and any cross-device vocabulary reduction. Parameters are unchanged unless a separate draft model is introduced. No training optimizer or gradient memory applies to a frozen sampler. Sampling can be negligible beside model execution or dominate a small-model/large-batch step; that is a measured deployment question. Energy and money require actual power and allocation measurements and remain NOT-DISCLOSED in the source comparisons used here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Two inspected 2026 studies explicitly distinguish greedy and stochastic workloads. PSC uses greedy pass@1 but temperature 1, unrestricted top-k/top-p for pass@k with $k>1$. The beam/sample+vote study instead uses temperature 0.7 and top-p 0.9 for sampling. Comparing their pass@1 figures without those policies would compare different estimands. [R37.3, §4.5](references.md#r373) [R37.5, §§3–4](references.md#r375)

| Protocol field | PSC downstream study | Beam/sample+vote study |
|---|---|---|
| Models | Llama3.2-1B, Qwen2.5-0.5B, Gemma3-270M | Qwen2.5-Instruct0.5/1.5/3/7B |
| Workload | Go, JSON-Mode-Eval, Spider | All1034 Spider development examples |
| Precision / hardware | Precision NOT-DISCLOSED; oneA10040GB and CPUthread per run | NF4; hardware NOT-DISCLOSED |
| Sampling | $u=1$, no top-k/top-p for stochastic pass@k | $u=.7$, top-p.9,160-token cap |
| Repetition / seeds | No source-complete penalty/seed table | One sampling seed; identifier NOT-DISCLOSED |
| Uncertainty | Repeated-seed intervals NOT-DISCLOSED | Wilson intervals over examples; paired McNemar tests |

## Observations

**What the paper claims.** [PAPER-REPORTED] PSC attributes its mask computation gains to offline parser analysis rather than a new sampling objective. The SQL study investigates candidate-budget allocation under one fixed stochastic policy. [R37.3, §§3–4](references.md#r373) [R37.5, §§3–5](references.md#r375)

**What the evidence shows.** [PAPER-REPORTED] PSC's Go greedy pass@1 can equal unconstrained decoding even when stochastic pass@k improves; for Llama3.2-1B HumanEval-Go, both greedy values are5.6%. The reported higher-k values use a different stochastic policy and are not a monotone extension of that greedy point. [R37.3, Table 4](references.md#r373)

**What we infer.** [DERIVED] Store the processed-law identity alongside a metric. An equal seed is not evidence of equal sampling laws, and equal laws do not imply the same individual draw across different kernels. A claim about quality must specify which of these properties was controlled.

**What remains unknown.** [NOT-DISCLOSED] The inspected studies do not provide a factorial, multi-seed isolation of temperature, every penalty convention and backend-specific ties. Their results do not select one universal sampler for code, reasoning or tool arguments.

## Failure modes

[DERIVED] Observable failures include empty support, NaN softmax, repeated punctuation suppression, EOS removed indefinitely and silently returned raw log probabilities. Near a nucleus boundary, a small floating-point perturbation can move an event across support, producing a large output difference under the same seed. Mixing prompt-inclusive repetition counts with response-only assumptions makes resumed requests diverge from uninterrupted requests. Reusing random streams across requests induces correlations that invalidate an iid interpretation of candidate draws.

## Siblings

```figure
id: fig-37.6
kind: compare
title: Selection policies on a common logit row
caption: No policy dominates task utility by its definition. Rank, mass and deterministic decisions answer different questions.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.2
alt: 'Comparison on Probability and support contract. Support: g=one tie-resolved maximum, k=rank cutoff; tie convention,
  p=mass cutoff; order dependent. Temperature: g=not a categorical temperature, k=changes retained probabilities, p=changes
  probabilities and cutoff. Quality evidence: g=task-specific evaluation, k=task-specific evaluation, p=task-specific evaluation'
spec:
  axis: Probability and support contract
  columns:
  - id: g
    label: Greedy
  - id: k
    label: Top-k
  - id: p
    label: Top-p
  rows:
  - dimension: Support
    values:
      g: one tie-resolved maximum
      k: rank cutoff; tie convention
      p: mass cutoff; order dependent
  - dimension: Temperature
    values:
      g: not a categorical temperature
      k: changes retained probabilities
      p: changes probabilities and cutoff
  - dimension: Quality evidence
    values:
      g: task-specific evaluation
      k: task-specific evaluation
      p: task-specific evaluation
```

[DERIVED] Min-p, present in the pinned implementation, retains events above a fraction of the maximum probability. Its cutoff therefore differs from both rank cardinality and cumulative mass. Grammar constraints encode an external language, whereas these truncation rules encode a probability-selection preference. Their canonical structured-generation analysis follows in §37.4. Beam search in §37.3 uses scores over paths and is not another token-level categorical distribution.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The current V2 route separates drafting noise and supports a chunked verification path discussed in §37.6. Fused sampling changes materialization and launch costs. These are implementation changes documented at the release pin; no isolated end-to-end speedup is inferred from their existence. [R37.1, release notes; gpu/sample/gumbel.py](references.md#r371)

## Limitations

[DERIVED] This finite-vocabulary treatment assumes well-defined token events at a fixed prefix. It does not establish model calibration, semantic correctness or stability under changed prompts. A parser can impose a legal set before this pipeline, but legality does not identify the correct answer. Full probability vectors can be unavailable from a service; in that case exact reconstruction of its processed law is UNVERIFIED, even if a few top log probabilities are returned.

## Reproducibility

[DERIVED] Preserve model/tokenizer hashes, prompt tokens, processor ordering, scopes, support thresholds, tie policy, output-score mode, precision, sampler/backend, seed construction and request position. Save both raw and processed selected-token scores when available. Replay must restore history counts and RNG position together. A release tag is recorded separately from paper runtime versions; later code is not silently substituted for a study's undisclosed dependency version.

## References

[DERIVED] R37.1 supplies pinned implementation behavior; R37.3 and R37.5 supply actual decoding/evaluation protocols. Equations37.1–37.2, the order counterexample and analytical figures are book derivations rather than new 2026 research claims.
