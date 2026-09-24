---
id: ms.section.3.5
entity_type: section
title: Reference implementation
short_title: Reference skeleton
volume: 1
part: 1
chapter: 3
section: 3.5
slug: 03-5-reference-implementation
parent: ms.chapter.3
prev_sibling: ms.section.3.4
next_sibling: ms.section.3.6
children: []
prerequisites: [ms.section.2.1, ms.section.3.2, ms.section.3.3, ms.section.3.4]
downstream: [ms.section.3.6, ms.section.4.1, ms.section.5.1, ms.section.5.5, ms.section.12.4, ms.section.19.3, ms.section.19.6]
related: [ms.section.6.2, ms.section.10.1]
siblings_by_mechanism: []
relations:
  - {type: implemented_by, target: impl.pytorch}
  - {type: supported_by, target: paper.P01}
axes: {lifecycle: [pretraining, evaluation], mechanism: [reference_implementation, masking, initialization], feedback_setting: [], modality: [text]}
papers: [P01]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [DERIVED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, KNOWN, UNVERIFIED], empirically_observed: false}
word_count_target: 1050
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 3.5 Reference implementation

## Scope

Objective: fix the contracts that make a single-device training skeleton *testable* — tensor shape contracts, the three masks (causal, padding, loss), the initialization scale, deterministic fixtures with stored expected outputs, and the tiny-batch overfitting test — and give a reference-level PyTorch skeleton that the verification protocol runs. Baseline: an ad-hoc script that trains but cannot be checked. Success criterion: the skeleton passes Experiments 3.1–3.5 of [verification.md](verification.md). Boundaries: the model architecture is a stub here and is developed in [Chapter 05](../ch05-minimal-transformer-and-execution-trace/README.md); objective semantics (which tokens are targets) in [§4.1](../ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md); sequence packing and its masks in [§12.4](../../part-02-data-and-representation-engineering/ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md); the full training loop and its state in [Chapter 19](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/README.md).

## Why this exists

What failed: mask bugs — attending to the future, attending to padding, or averaging the loss over padded positions — produce models that train smoothly to a wrong objective and are discovered only at evaluation [KNOWN — the course sequence of CS336 Assignment 1 is built around implementing and testing exactly these pieces from scratch, R3.15]. Bottleneck: shape errors surface as broadcasting successes rather than failures, because [B, T, 1] broadcasts against [B, 1, T] silently. Dominant constraint: a test needs a fixed input and a fixed expected output, which the framework's RNG stream does not provide across versions ([§3.6](03-6-reproducibility-limits.md)). What changed: fixtures are stored artifacts; masks are Boolean tensors with declared semantics; and the first test is whether the skeleton can memorize a handful of sequences.

## Intuition

Physically, a training skeleton is a contract between three tensors — token ids [B, T], a Boolean attention mask [B, 1, T, T] (or its factored form), and a loss mask [B, T] — and the parameter tensors whose shapes are fixed by d_model, d_ff, H, and V. Every downstream failure is a violation of one of these contracts. The tiny-batch test is the cheapest possible end-to-end check: a model with far more parameters than the fixture has tokens must drive the token-mean loss toward zero; if it cannot, the gradient, the mask, or the optimizer is wrong, and it is wrong before scale adds cost.

## Formulation

Shapes (axis names per notation.md): ids ∈ ℤ^{[B,T]}; embeddings [B, T, D]; attention scores per head [B, H, T, T]; logits [B, T, V]; targets ids shifted by one, [B, T].

```figure
id: fig-3.24
kind: stat-panel
title: The skeleton contract at an illustrative fixture
caption: >-
  One fixture, costed contract by contract as the section builds it. The
  shapes are illustrative (B = 4, T = 64, V = 2048, D = 256), chosen so the
  ModelStub has about 10⁶ parameters, the size the cost line assumes. They
  are not taken from any named model. Watch the parameters-per-token row. The
  tiny-batch test is meaningful only while it is in the thousands. Watch the
  mask row too. It is the one tensor that grows with T².
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-3.19", "DERIVED:eq-3.20", "DERIVED:alg-3.12"]
alt: >-
  Instrument panel for an illustrative fixture with B = 4, T = 64, V = 2048
  and D = 256. Token ids [B, T] in int64 take 2 KiB. The fixture holds 256
  tokens. The Boolean attention mask [B, 1, T, T] takes 16 KiB. The ModelStub
  has 2·V·D + D = 1,048,832 parameters, and its FP64 snapshot at 8 bytes per
  parameter is 8 MiB. There are 4,097 parameters per fixture token. FP64
  logits y64 [B, T, V] take 4 MiB. The loss of a uniform prediction is
  ln V ≈ 7.62 nats. The acceptance floor ℓ_min is 0.01 nats within 300 steps.
  At T = 4096 the mask grows to 64 MiB.
spec:
  header: "SKELETON CONTRACT · ILLUSTRATIVE FIXTURE"
  variables: { B: 4, T: 64, V: 2048, D: 256 }
  rows:
    - { key: "ids [B, T], int64", formula: "8*B*T", format: bytes }
    - { key: "fixture tokens, B·T", formula: "B*T", format: tokens }
    - { key: "attention mask [B, 1, T, T], bool", formula: "B*T^2", format: bytes }
    - { key: "ModelStub params, 2·V·D + D", formula: "2*V*D + D", format: params }
    - { key: "θ64 snapshot, 8 B/param", formula: "8*(2*V*D + D)", format: bytes }
    - { key: "params per fixture token", formula: "(2*V*D + D)/(B*T)", format: ratio }
    - { key: "FP64 logits y64 [B, T, V]", formula: "8*B*T*V", format: bytes }
    - { key: "uniform-prediction loss, ln V", formula: "ln(V)", format: fixed2, note: "nats" }
    - { key: "T9 floor ℓ_min", value: "0.01 nats" }
    - { key: "T9 N_steps", value: "300" }
states:
  - { anchor: formulation, label: "shapes and masks", highlight: ["ids [B, T], int64", "attention mask [B, 1, T, T], bool"], note: "Eq. 3.19–3.20 at the fixture's shapes: ids [4, 64] and a [4, 1, 64, 64] Boolean mask of 16 KiB. The shapes are illustrative, not a named model." }
  - { anchor: mechanism, label: "stored fixture", highlight: ["θ64 snapshot, 8 B/param", "FP64 logits y64 [B, T, V]"], note: "The fixture stores FP64 parameters (8 B each, about 8 MiB for about 10⁶ parameters) and FP64 logits. A change in the framework's RNG stream cannot invalidate it." }
  - { anchor: algorithm, label: "tiny-batch test", highlight: ["params per fixture token", "uniform-prediction loss, ln V", "T9 floor ℓ_min"], note: "Algorithm 3.12 needs far more parameters than tokens, here 4,097 per token. The loss must fall from the order of ln V ≈ 7.62 nats to 0.01 within 300 steps." }
  - { anchor: implementation, label: "T = 4096", variables: { T: 4096 }, highlight: ["attention mask [B, 1, T, T], bool"], note: "The same mask at T = 4096 is 64 MiB for B = 4 (B·T² bytes). It is the first tensor to remove once Chapter 05's attention takes a causal flag and lengths." }
```

Causal mask:

$$
C_{ij} = \mathbb{1}[\, j \le i \,], \qquad i, j \in \{1,\dots,T\}
$$
*(Eq. 3.19)* where C is [T, T], broadcast over B and H; masked scores are set to −∞ before Eq. 3.7 so that they receive exactly zero probability.

Combined attention mask with padding (key mask k ∈ {0,1}^{[B,T]}, 1 = real token) and loss mask:

$$
A_{b,i,j} = C_{ij}\, k_{b,j}, \qquad m_{b,t} = k_{b,t+1}\cdot \mathbb{1}[\text{target}_{b,t}\ \text{is supervised}]
$$
*(Eq. 3.20)* where A is [B, 1, T, T] and m_{b,t} is the target mask of Eq. N.2 for the prediction made at position t of the token at t+1; a query row whose keys are all masked must be defined to output zero (Algorithm 3.2) and must have m = 0.

```figure
id: fig-3.25
kind: matrix
title: Combined attention mask and loss mask for one padded row
caption: >-
  Eq. 3.19 and 3.20 for one sequence of five real tokens right-padded to
  T = 8. The causal triangle loses its columns j ≥ 5 to the key mask, leaving
  30 of the 64 pairs instead of 36. Padded queries (rows 5 to 7, faint) still
  attend to real keys. Their outputs are computed and then discarded by
  m = 0. The highlighted row is the easy one to get wrong. Position 4 is a
  real token, but its target position 5 is padding, so m₄ = k₅ = 0. Five
  real tokens give four supervised predictions.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.19", "DERIVED:eq-3.20"]
alt: >-
  Eight by eight grid, query position i down the rows and key position j
  across, for key mask k = 1 at positions 0 to 4 and 0 at positions 5 to 7.
  Rows 0 to 4 admit keys 0 to i: 1, 2, 3, 4 and 5 cells. Rows 5 to 7 are
  padded queries and admit keys 0 to 4, drawn faint. Columns 5 to 7 are
  masked in every row. In total 30 of the 64 pairs are admitted, against 36
  for the causal mask alone. Row labels give the loss mask: m = 1 for
  positions 0 to 3 and m = 0 for positions 4 to 7. Row 4 is highlighted
  across keys 0 to 4, a real token with no supervised target.
spec:
  rows: 8
  cols: 8
  pattern: explicit
  cells:
    - [1, 0, 0, 0, 0, 0, 0, 0]
    - [1, 1, 0, 0, 0, 0, 0, 0]
    - [1, 1, 1, 0, 0, 0, 0, 0]
    - [1, 1, 1, 1, 0, 0, 0, 0]
    - [1, 1, 1, 1, 1, 0, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0, 0, 0]
    - [0.35, 0.35, 0.35, 0.35, 0.35, 0, 0, 0]
  rowLabel: "query position i, loss mask m_i"
  colLabel: "key position j, key mask k_j"
  rowTicks: ["0 · m=1", "1 · m=1", "2 · m=1", "3 · m=1", "4 · m=0", "5 · m=0", "6 · m=0", "7 · m=0"]
  colTicks: ["0", "1", "2", "3", "4", "5 pad", "6 pad", "7 pad"]
  highlight:
    - { row: 4, col: 0 }
    - { row: 4, col: 1 }
    - { row: 4, col: 2 }
    - { row: 4, col: 3 }
    - { row: 4, col: 4 }
  legend: "A = C·k admits 30 of 64 pairs; faint = padded query, excluded by m = 0"
```

Initialization scale for a linear map from d_in to d_out with weights W drawn i.i.d. with variance σ_W²:

$$
\mathrm{Var}[(Wx)_i] = d_{\text{in}}\,\sigma_W^2\,\mathrm{Var}[x_j] \quad\Rightarrow\quad \sigma_W^2 = \frac{1}{d_{\text{in}}}\ \text{preserves variance}
$$
*(Eq. 3.21)* where x has i.i.d. entries; residual-branch scaling with depth is owned by [§5.4](../ch05-minimal-transformer-and-execution-trace/05-4-residual-organization.md). The skeleton uses σ_W = d_in^{−1/2}, truncated to ±3σ, for all projections, and zeros for biases and normalization offsets [ASSUMED — a design input; sensitivity: too-large σ produces logits of magnitude ≫ 1 at step 0 and exercises the overflow paths of §3.2].

```figure
id: fig-3.26
kind: calculator
title: Initialization scale and the overflow headroom it leaves
caption: >-
  Eq. 3.21 with the skeleton's choice σ_W = d_in^−1/2 and a gain g on top.
  At g = 1 the output variance equals the input variance for every fan-in,
  so the head's logits start with unit spread. That leaves ln 65504 ≈ 11.09
  standard deviations before an unshifted FP16 exponential overflows. At
  g = 4 the headroom falls to 2.8 standard deviations, and step 0 already
  depends on the max-subtracted softmax of §3.2. Changing d_in moves σ_W but
  not the output variance.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-3.21", "DERIVED:eq-3.3"]
alt: >-
  Calculator for Eq. 3.21, Var[(Wx)_i] = d_in·σ_W²·Var[x_j], with
  σ_W = g·d_in^−1/2. At d_in = 256, g = 1 and Var[x] = 1: σ_W = 0.0625, the
  output variance is 1, ln 65504 is 11.09 output standard deviations, and the
  ±3σ_W weight truncation bound is 0.1875. Preset g = 4: σ_W = 0.25, output
  variance 16, headroom 2.77 standard deviations. Preset d_in = 4096:
  σ_W = 0.015625 and the output variance is still 1.
spec:
  tex: >-
    \mathrm{Var}[(Wx)_i]=d_{\text{in}}\,\sigma_W^{2}\,\mathrm{Var}[x_j],\qquad \sigma_W=g\,d_{\text{in}}^{-1/2}
  equation: "3.21"
  inputs:
    - { symbol: d, label: "fan-in d_in", default: 256, min: 64, max: 16384, scale: log2, format: integer }
    - { symbol: g, label: "gain g on σ_W = d_in^−1/2", default: 1, min: 0.5, max: 8, options: [0.5, 1, 2, 4, 8], format: raw }
    - { symbol: vx, label: "Var[x_j]", default: 1, min: 0.1, max: 10, scale: log10, format: raw }
  outputs:
    - { symbol: sw, label: "σ_W", formula: "g/sqrt(d)", format: raw }
    - { symbol: vy, label: "Var[(Wx)_i], Eq. 3.21", formula: "d*sw^2*vx", format: raw, emphasis: true }
    - { symbol: hr, label: "ln 65504 in output standard deviations", formula: "ln(65504)/sqrt(vy)", format: fixed2 }
    - { symbol: tr, label: "weight truncation bound ±3σ_W", formula: "3*sw", format: raw }
  presets:
    - { label: "g = 4", values: { g: 4 } }
    - { label: "d_in = 4096", values: { d: 4096 } }
```

> **Definition — Deterministic fixture.** A stored (input, expected output) pair — token ids, masks, parameter snapshot, and FP64 forward/gradient values — produced once under a recorded seed and reused across versions without regenerating from the framework RNG.

> **Definition — Tiny-batch overfitting test.** Training the skeleton on a fixed fixture of a few sequences until the token-mean loss falls below a declared floor, as a necessary condition for correctness of gradient, masks, and optimizer.

## Mechanism

Shape contracts are enforced at module boundaries with assertions on `tensor.shape` and `tensor.dtype`; a reference-level skeleton asserts rather than reshapes, so that a silent broadcast becomes a loud failure [DERIVED]. The causal mask is a constant [T, T] Boolean built once; the padding key-mask is per batch; the two are combined by logical AND (Eq. 3.20). Masked positions are filled with the most negative finite value of the compute dtype rather than −∞ when a fully masked row is possible, so that exp(z − m) yields a finite (uniform) row instead of NaN; that row is then zeroed by the loss mask. The loss uses the reduction of [§3.2](03-2-stable-primitives.md): log-softmax in FP32, gather of the target, masked sum divided by Σm (Eq. N.2), never `mean()` over all positions.

Fixtures: Algorithm 3.11 draws ids and masks from a seeded generator *once*, computes FP64 forward values and gradients with the FP64 twin of the model, and stores everything; every later run compares against the stored values with the tolerances of verification.md. Because the fixture is stored, a framework RNG change cannot invalidate it; only a change in the model definition does, which is the intended sensitivity.

The tiny-batch test (Algorithm 3.12) is a necessary, not sufficient, condition: it detects a wrong sign, a wrong mask, a detached graph, a mis-normalized loss, and a broken optimizer, but not a subtly wrong VJP that still descends. It complements, and does not replace, the FP64 check of [§3.3](03-3-automatic-differentiation.md).

Cost line: fixtures cost one FP64 forward+backward on a tiny model (seconds on CPU) and O(|θ|·8) bytes of storage for the FP64 parameter snapshot; the tiny-batch test costs a few hundred steps on a model of ≈ 10^6 parameters — negligible against any real run and therefore mandatory before one [DERIVED].

## Algorithm

```text
Algorithm 3.11 — Deterministic fixture construction
INPUT   seed; shapes (B, T, V, D, ...); model definition f; padding fraction p
OUTPUT  fixture directory: ids.pt, key_mask.pt, loss_mask.pt, theta64.pt, y64.pt, grad64.pt, meta.json
STATE   generator g seeded with seed (CPU); FP64 model f64 with parameters theta64
INVARIANT every stored tensor is produced by f64 on CPU with deterministic settings
1  g ← Generator(seed); ids ← randint(V, [B, T], g); lengths ← T − floor(p·T·u), u ~ U[0,1]^B
2  key_mask[b, t] ← (t < lengths[b]); loss_mask ← key_mask shifted per Eq. 3.20
3  theta64 ← initialize f64 by Eq. 3.21 using g; store theta64
4  y64 ← f64(ids, key_mask) logits; loss64 ← masked token-mean CE
5  grad64 ← ∂loss64/∂theta64 (Algorithm 3.5 in FP64)
6  write ids, key_mask, loss_mask, theta64, y64, loss64, grad64, and meta (seed, shapes, versions)
7  TERMINATION: one forward and one backward
```

```text
Algorithm 3.12 — Tiny-batch overfitting test
INPUT   fixture (ids, masks); model f in the target precision recipe; optimizer; N_steps; floor ℓ_min
OUTPUT  pass if loss_N ≤ ℓ_min; the loss trace
STATE   parameters initialized from theta64 cast to the recipe's storage dtype
INVARIANT the same batch is used at every step; deterministic settings on
1  for s = 1..N_steps:
2      loss_s ← masked token-mean CE(f(ids, key_mask), targets)   # FP32 reduction
3      backward; clip by Eq. 3.13; step   (Algorithm 3.6 with K = 1)
4      assert isfinite(loss_s)
5  pass iff loss_N ≤ ℓ_min  (e.g. ℓ_min = 0.01 nats for a memorizable fixture)
6  TERMINATION: N_steps
```

Complexity: N_steps forward+backward on a fixture whose token count is far below the parameter count; the floor ℓ_min is a declared acceptance value, not a claim about any model.

```figure
id: fig-3.27
kind: diagram
title: Fixture once, checks every run
caption: >-
  The left group runs once, under a recorded seed, on CPU in FP64. The right
  group runs on every change. The only thing that crosses between them is
  the stored, hashed fixture, the emphasised edge into the comparison. That
  is why a framework RNG change cannot invalidate a test and a model change
  must. The tiny-batch test and the FD check read the same fixture but catch
  different defects: a descending but wrong VJP passes the first and fails
  the second.
placement: inline
evidence: DERIVED
source: ["DERIVED:alg-3.11", "DERIVED:alg-3.12", "DERIVED:alg-3.7"]
alt: >-
  Diagram in two groups. Built once (Algorithm 3.11): a recorded seed feeds a
  CPU generator, which draws ids, key_mask and loss_mask [B, T] by Eq. 3.20
  and θ64 initialised by Eq. 3.21 with ±3σ truncation. Both feed the FP64 twin
  f64 on CPU with deterministic settings. It produces y64, loss64 and grad64
  (Algorithm 3.5 in FP64), which are stored with ids, masks and θ64 as the
  fixture, with a SHA-256 per tensor and never regenerated. The framework RNG
  stream is used by the generator only once. Every run (Algorithm 3.12 and
  checks): the skeleton under a precision recipe is compared with the stored
  fixture on forward values and gradients (T4, T6, emphasised). The FD check
  of Algorithm 3.7 (T5) and the tiny-batch overfit test (T9: 0.01 nats in 300
  steps) read the fixture. Seeded mutations from Experiment 3.5 are applied
  to the skeleton.
spec:
  direction: LR
  nodes:
    - { id: seed, kind: dependency, label: "seed", sub: "recorded in meta.json", group: once }
    - { id: gen, kind: process, label: "CPU Generator(seed)", sub: "draws once", group: once }
    - { id: rng, kind: dependency, label: "framework RNG stream", sub: "may change across versions" }
    - { id: ids, kind: tensor, label: "ids, key_mask, loss_mask", sub: "[B, T]; Eq. 3.20", group: once }
    - { id: th, kind: tensor, label: "θ64 by Eq. 3.21", sub: "FP64, ±3σ truncation", group: once }
    - { id: f64, kind: model, label: "FP64 twin f64 on CPU", sub: "deterministic settings", group: once }
    - { id: out, kind: tensor, label: "y64, loss64, grad64", sub: "Algorithm 3.5 in FP64", group: once }
    - { id: fx, kind: dataset, label: "stored fixture", sub: "SHA-256 per tensor; never regenerated" }
    - { id: sk, kind: model, label: "skeleton under a recipe", sub: "FP32 · FP16 + S · BF16 (+ master)", group: every }
    - { id: cmp, kind: metric, label: "forward and gradient vs FP64", sub: "T4, T6", group: every }
    - { id: fd, kind: metric, label: "finite-difference check", sub: "T5, Algorithm 3.7", group: every }
    - { id: tb, kind: metric, label: "tiny-batch overfit", sub: "T9: 0.01 nats in 300 steps", group: every }
    - { id: mut, kind: branch, label: "seeded mutations", sub: "triu, no padding term, mean(), …", group: every }
  edges:
    - { from: seed, to: gen }
    - { from: rng, to: gen, kind: dependency, label: "used once" }
    - { from: gen, to: ids }
    - { from: gen, to: th }
    - { from: ids, to: f64 }
    - { from: th, to: f64 }
    - { from: f64, to: out }
    - { from: out, to: fx, kind: emphasis }
    - { from: ids, to: fx }
    - { from: th, to: fx }
    - { from: fx, to: cmp, kind: emphasis, label: "stored values" }
    - { from: sk, to: cmp }
    - { from: fx, to: fd }
    - { from: fx, to: tb }
    - { from: sk, to: tb }
    - { from: mut, to: sk, kind: dependency, label: "Experiment 3.5" }
  groups:
    - { id: once, label: "built once, Algorithm 3.11" }
    - { id: every, label: "every run, Algorithm 3.12 and checks" }
```

## Implementation

```python
# Reference-level PyTorch skeleton. Written against the PyTorch 2.14 documented API
# (docs accessed 2026-09-20). Execution UNVERIFIED in this edition. Not tuned; not fast.
import json, math, torch, torch.nn as nn, torch.nn.functional as F

def set_deterministic(seed: int) -> None:
    torch.manual_seed(seed)                       # seeds CPU and CUDA generators (docs: Reproducibility)
    torch.use_deterministic_algorithms(True)      # error on known-nondeterministic ops
    torch.backends.cudnn.benchmark = False
    torch.backends.cuda.matmul.allow_bf16_reduced_precision_reduction = False   # default is True (docs: CUDA semantics)
    torch.backends.cuda.matmul.allow_fp16_reduced_precision_reduction = False

def causal_mask(T: int, device) -> torch.Tensor:                 # [1, 1, T, T] bool, True = attend
    return torch.tril(torch.ones(T, T, dtype=torch.bool, device=device))[None, None]

def attention_mask(key_mask: torch.Tensor) -> torch.Tensor:     # key_mask [B, T] bool -> [B, 1, T, T]
    B, T = key_mask.shape
    return causal_mask(T, key_mask.device) & key_mask[:, None, None, :]

def shift_targets(ids: torch.Tensor, key_mask: torch.Tensor, ignore: int = -100):
    tgt = ids[:, 1:].clone(); tgt[~key_mask[:, 1:]] = ignore     # loss mask m_t via ignore index (Eq. 3.20)
    return ids[:, :-1], tgt

def masked_token_mean_ce(logits: torch.Tensor, tgt: torch.Tensor, ignore: int = -100) -> torch.Tensor:
    logp = F.log_softmax(logits.float(), dim=-1)                 # FP32 max-subtracted LSE (Eq. 3.6-3.7)
    m = (tgt != ignore); safe_tgt = tgt.masked_fill(~m, 0)
    nll = -logp.gather(-1, safe_tgt[..., None]).squeeze(-1)      # [B, T]
    return (nll * m).sum() / m.sum().clamp_min(1)                # Eq. N.2: mean over supervised tokens

class ModelStub(nn.Module):
    """Placeholder for the Chapter 05 Transformer; keeps the shape/mask contract."""
    def __init__(self, V: int, D: int):
        super().__init__()
        self.emb = nn.Embedding(V, D); self.norm = nn.RMSNorm(D); self.head = nn.Linear(D, V, bias=False)
        for p in (self.emb.weight, self.head.weight):
            nn.init.trunc_normal_(p, std=D ** -0.5, a=-3 * D ** -0.5, b=3 * D ** -0.5)   # Eq. 3.21
    def forward(self, ids: torch.Tensor, key_mask: torch.Tensor) -> torch.Tensor:
        B, T = ids.shape; assert key_mask.shape == (B, T) and key_mask.dtype == torch.bool
        x = self.emb(ids)                                          # [B, T, D]
        _ = attention_mask(key_mask)                               # [B, 1, T, T]; consumed by Chapter 05 attention
        return self.head(self.norm(x.float()).to(x.dtype))        # [B, T, V]; normalization stats in FP32

def train_step(model, opt, ids, key_mask, *, clip: float, scaler=None, autocast_dtype=None) -> float:
    inp, tgt = shift_targets(ids, key_mask)
    opt.zero_grad(set_to_none=True)
    ctx = torch.autocast("cuda", dtype=autocast_dtype) if autocast_dtype else torch.autocast("cuda", enabled=False)
    with ctx:
        loss = masked_token_mean_ce(model(inp, key_mask[:, :-1]), tgt)
    if scaler is not None:                                          # FP16 recipe: Algorithm 3.8
        scaler.scale(loss).backward(); scaler.unscale_(opt)
    else:                                                           # BF16 or FP32 recipe
        loss.backward()
    total = torch.nn.utils.clip_grad_norm_(model.parameters(), clip)  # Eq. 3.13; returns total norm
    if not torch.isfinite(total):                                   # finiteness gate (Algorithm 3.6 line 7)
        opt.zero_grad(set_to_none=True)
        if scaler is not None: scaler.update()                      # backoff
        return float("nan")
    if scaler is not None: scaler.step(opt); scaler.update()
    else: opt.step()
    return loss.item()

def overfit_tiny_batch(fixture_dir: str, steps: int = 300, floor: float = 1e-2, device="cuda") -> bool:
    set_deterministic(0)
    ids = torch.load(f"{fixture_dir}/ids.pt").to(device); km = torch.load(f"{fixture_dir}/key_mask.pt").to(device)
    meta = json.load(open(f"{fixture_dir}/meta.json"))
    model = ModelStub(meta["V"], meta["D"]).to(device)
    model.load_state_dict({k: v.to(torch.float32) for k, v in torch.load(f"{fixture_dir}/theta64.pt").items()})
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.0)
    last = math.inf
    for _ in range(steps):
        last = train_step(model, opt, ids, km, clip=1.0)
        assert math.isfinite(last)
    return last <= floor
```

Framework placement: Model / autograd framework layer (PyTorch). Kernels: `F.log_softmax` in FP32 dispatches to a fused max-subtracted kernel; `nn.RMSNorm` computes statistics in the input dtype unless the input is upcast, hence the explicit `.float()` [OFFICIAL-DOCUMENTATION for the API surface, R3.11; the upcast is the book's rule from §3.2]. Memory: the [B, 1, T, T] Boolean mask costs B·T² bytes and is the first tensor to remove when the Chapter 05 attention adopts a fused kernel that takes the causal flag and lengths instead. Deployment: none.

```figure
id: fig-3.28
kind: tensor-flow
title: Dtype and shape along the skeleton's loss path
caption: >-
  ModelStub.forward and masked_token_mean_ce as one trace. The shape changes
  only twice, into [B, T, V] at the head and back to [B, T] at the gather.
  The dtype changes at every step the §3.2 rules name: statistics go up to
  FP32 and come back, logits go up to FP32 before log_softmax, and the mean
  divides by Σm, never by B·T. The [B, 1, T, T] mask is built on the side and
  not consumed by the stub.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-3.7", "DERIVED:eq-3.20"]
alt: >-
  Eight-step tensor trace. Token ids and key mask [B, T]. The embedding
  gather gives x [B, T, D] in the storage dtype (V·D parameters). x.float()
  and RMSNorm compute statistics in FP32 over [B, T, D]. .to(x.dtype) casts
  back to storage. The output head D to V gives logits [B, T, V] (D·V
  parameters, 2·D·V FLOPs per token). log_softmax of logits.float() gives
  FP32 log-probabilities [B, T, V] by max-subtracted log-sum-exp (Eq.
  3.6–3.7). Gathering the target and multiplying by the loss mask gives
  per-token negative log-likelihood [B, T], with ignore index −100 becoming
  m = 0 (Eq. 3.20). Σ(nll·m) / max(Σm, 1) gives the scalar token mean of
  Eq. N.2.
spec:
  dims: { B: "sequences", T: "input positions after the shift", D: "model width", V: "vocabulary" }
  steps:
    - { shape: "[B, T]", label: "ids (int64) and key_mask (bool)" }
    - { shape: "[B, T, D]", label: "x, storage dtype", op: "embedding gather", cost: "V·D params" }
    - { shape: "[B, T, D]", label: "normalised, statistics in FP32", op: "x.float() → RMSNorm", cost: "row sums accumulated in FP32 (§3.2)" }
    - { shape: "[B, T, D]", label: "back in storage dtype", op: ".to(x.dtype)" }
    - { shape: "[B, T, V]", label: "logits", op: "output head, D → V", cost: "D·V params · 2·D·V FLOPs/token" }
    - { shape: "[B, T, V]", label: "log-probabilities, FP32", op: "log_softmax(logits.float())", cost: "max-subtracted LSE, Eq. 3.6–3.7" }
    - { shape: "[B, T]", label: "per-token NLL, zero where m = 0", op: "gather target, × m", cost: "ignore index −100 → m (Eq. 3.20)" }
    - { shape: "[1]", label: "masked token mean", op: "Σ(nll·m) / max(Σm, 1)", cost: "Eq. N.2; never mean() over B·T" }
```

> **Implementation note [impl.pytorch · docs 2.14, accessed 2026-09-20; execution UNVERIFIED].** `torch.use_deterministic_algorithms(True)` requires `CUBLAS_WORKSPACE_CONFIG=:4096:8` or `:16:8` to be set in the environment for CUDA GEMMs [OFFICIAL-DOCUMENTATION — PyTorch Reproducibility page]; the skeleton's manifest records which.

## Experimental design

Proposed: Experiment 3.5 in [verification.md](verification.md) — (1) build the fixture with Algorithm 3.11; (2) compare the skeleton's FP32 and BF16 forward/gradient against the stored FP64 values (Experiments 3.1–3.3); (3) run Algorithm 3.12 for each recipe; (4) mutation tests: flip the causal mask to `triu`, drop the padding term of Eq. 3.20, replace the masked mean with `mean()`, and confirm that each mutation is caught by (2) or (3). Controlled: seed, device, deterministic flags; metric: max relative error and final loss; baseline: the FP64 twin.

## Observations

**What the paper claims.** CS336 (Spring 2026) structures Assignment 1 as implementing the tokenizer, Transformer, and optimizer from scratch and training a minimal language model, with later assignments on systems and scaling [OFFICIAL-DOCUMENTATION — course page, R3.15, accessed 2026-09-20]. P01 defines the causal ("masking out") attention that Eq. 3.19 encodes [PAPER-REPORTED].

**What the evidence shows.** Mask and loss-normalization semantics are definitional; the only empirical content of this section is that a skeleton either passes or fails the stated tests, and no runs were executed for this edition.

**What we infer.** A fixture stored with FP64 values decouples correctness testing from RNG-stream stability; the book treats stored fixtures as the unit of regression testing for every later chapter's reference model [DERIVED].

**What remains unknown.** Whether the stub's initialization scale is appropriate for the full Chapter 05 model is deferred to §5.4 (UNVERIFIED here). The behavior of fused attention kernels on fully masked rows is kernel-specific and must be tested per kernel (NOT-DISCLOSED in general).

## Failure modes

> **Failure mode — Future leakage.** *Symptom:* tiny-batch loss collapses implausibly fast; evaluation loss at generation time is far worse than training loss. *Cause:* `triu` instead of `tril`, or a transposed mask. *Detection:* per-position loss at t = 0 is already near zero. *Mitigation:* Eq. 3.19 with an explicit test that logits at position i do not change when ids at j > i change.

> **Failure mode — Padding in the denominator.** *Symptom:* loss values depend on batch padding fraction. *Cause:* `mean()` over [B, T]. *Detection:* the same sequences with different padding give different losses. *Mitigation:* Eq. N.2 with Σm.

> **Failure mode — NaN from fully masked rows.** *Symptom:* NaN only in batches with short sequences. *Cause:* −∞ fill with all keys masked. *Detection:* per-row key counts of zero. *Mitigation:* finite fill plus loss mask; or exclude the row.

> **Failure mode — Fixture drift.** *Symptom:* tests fail after a framework upgrade with no code change. *Cause:* regenerated fixture from a changed RNG stream, or a changed kernel outside tolerance. *Detection:* compare stored ids hash. *Mitigation:* never regenerate; re-derive tolerances ([§3.6](03-6-reproducibility-limits.md)).

## Siblings

**Boolean additive-mask vs Boolean multiplicative mask** — this section. Why additive exists: one fused add before softmax. What assumption changed: −∞ (or min-finite) is representable in the compute dtype. What new failure mode it introduced: NaN on fully masked rows. Changed primitive: multiply probabilities → add to logits.

**Ignore-index loss mask vs explicit weight mask** — this section. Why ignore-index exists: a single integer marks unsupervised targets. What assumption changed: the target vocabulary never uses the sentinel. What new failure mode it introduced: a padding token id colliding with a real id if the sentinel is misused. Changed primitive: weight vector → sentinel id.

**Packed sequences with document masks** — [§12.4](../../part-02-data-and-representation-engineering/ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-4-packing-and-masks.md). Why it exists: padding wastes compute. What assumption changed: one row holds several documents. What new failure mode it introduced: cross-document attention unless the block-diagonal mask is applied. Changed primitive: per-batch key mask → per-document block mask.

**Regenerated fixtures vs stored fixtures** — this section. Why regenerated exists: no storage. What new failure mode it introduced: RNG-stream drift across versions. Changed primitive: seed → stored tensors.

## Extensions

Conditional objectives ([§4.5](../ch04-language-modeling-and-learning-objectives/04-5-conditional-and-multimodal-learning.md)) change only m_t; SFT with prompt masking sets m_t = 0 on prompt tokens; multimodal inputs add a modality mask to the key mask; agent trajectories add tool-output spans to the loss mask — all are values of Eq. 3.20, not new mechanisms (proposal-level).

## Limitations

The stub has no attention, so the [B, 1, T, T] mask is constructed but not consumed; the contract is exercised fully only in Chapter 05. The overfitting floor ℓ_min is an acceptance value chosen for a memorizable fixture and has no meaning for real data. Falsification: a skeleton passing Algorithm 3.12 but failing Algorithm 3.7 indicates a VJP error that still descends — the reason both tests exist. Decision consequence: no scale-up ([§19.6](../../part-04-training-science-and-adaptation/ch19-pretraining-objectives-and-the-full-training-loop/19-6-reference-to-scale-handoff.md)) before both pass.

## Reproducibility

Target: the PyTorch 2.14 documented API; execution UNVERIFIED. Fixture metadata records seed, shapes, framework version, device, and deterministic flags. Unresolved: fused-kernel masked-row behavior (NOT-DISCLOSED per kernel).

## References

P01; R3.11, R3.15, R3.25.
