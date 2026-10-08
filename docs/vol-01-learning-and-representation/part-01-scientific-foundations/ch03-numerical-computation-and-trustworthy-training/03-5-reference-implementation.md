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
word_count_target: 2500
updated_at: 2026-10-07
editorial_status: manuscript_draft
---

# 3.5 Reference implementation

## Scope

[DERIVED] The reference program joins the chapter's contracts in a single-device causal training path that actually consumes its attention mask. It includes target shifting, separate attention and supervision masks, defined empty-row behavior, dtype-preserving normalization and loss, gradient connectivity checks, and an update rejection gate. Chapter 05 owns the full Transformer architecture; this smaller program exposes numerical and objective boundaries without claiming production performance or executed verification.

## Why this exists

[MATHEMATICALLY-DERIVED] A model can reduce its loss while using future tokens, supervising padding, or dividing by the wrong count. Autograd then computes a correct derivative of the wrong objective. A token-only model cannot expose attention-mask defects because its outputs never depend on the mask. Consequently the reference must contain an actual cross-position computation and must expose its inputs, masks, and loss denominator explicitly.

## Intuition

[DERIVED] Each contract has a visible consumer. Token validity controls which keys attention may read. Causality controls which positions may communicate. Transition validity controls which next-token predictions receive supervision. The loss counts valid transitions, not padded array elements. FP64 checking traverses the same operations while preserving FP64 throughout; it is not a separate model with different masking semantics.

## Formulation

[MATHEMATICALLY-DERIVED] From stored tokens $u\in\{0,\ldots,V-1\}^{B\times(T+1)}$ and validity $k$, define

$$
x_{b,t}=u_{b,t},\quad y_{b,t}=u_{b,t+1},\quad
m_{b,t}=k_{b,t}\land k_{b,t+1},\quad0\le t<T.
$$
*(Eq. 3.19)* A sequence with $r$ contiguous real tokens supplies $r-1$ transitions. Packed documents additionally require an explicit same-document boundary term; validity alone cannot supply it. The reference below expects a single document per row or a caller-provided transition mask.

[MATHEMATICALLY-DERIVED] Query $i$ admits key $j$ when

$$
A_{b,i,j}=\mathbf1[j\le i]\,k_{b,j},\qquad
\mathcal L=\frac{\sum_{b,t:m_{b,t}=1}-\log p_\theta(y_{b,t}\mid x_{b,\le t})}{N},
\quad N=\sum_{b,t}m_{b,t}>0.
$$
*(Eq. 3.20)* Padded query outputs are explicitly zeroed and never supervised. A row with no admissible keys receives zero attention output by an explicit branch before any undefined softmax occurs. This zero extension is a program contract; it is not softmax of an empty set.

```figure
id: fig-3.24
kind: stat-panel
title: Explicit causal-reference shape and state accounting
caption: >-
  Shapes are illustrative, not source experiment settings. The parameter
  formula includes untied token/head weights, positional embeddings and
  attention/feed-forward projections. It excludes optimizer state and
  activations. Parameter count alone does not guarantee memorability.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-3.19", "DERIVED:eq-3.20", "DERIVED:alg-3.12"]
alt: >-
  At B4,T64,V2048,D256,Tmax64, parameters total1851392. Their FP64
  snapshot is 14.125MiB. The Boolean attention mask is 16KiB and FP64 logits
  are 4MiB. These quantities are derived allocations, not measured peaks.
spec:
  header: "CAUSAL REFERENCE - ILLUSTRATIVE ACCOUNTING"
  variables: { B: 4, T: 64, V: 2048, D: 256, Tmax: 64 }
  rows:
    - { key: "ids [B,T], int64", formula: "8*B*T", format: bytes }
    - { key: "input positions", formula: "B*T", format: tokens }
    - { key: "attention mask [B,T,T], bool", formula: "B*T^2", format: bytes }
    - { key: "parameters, 2VD+TmaxD+12D^2", formula: "2*V*D+Tmax*D+12*D^2", format: params }
    - { key: "FP64 parameter snapshot", formula: "8*(2*V*D+Tmax*D+12*D^2)", format: bytes }
    - { key: "parameters per input position", formula: "(2*V*D+Tmax*D+12*D^2)/(B*T)", format: ratio }
    - { key: "FP64 logits [B,T,V]", formula: "8*B*T*V", format: bytes }
    - { key: "uniform-prediction loss, nats", formula: "ln(V)", format: fixed2 }
    - { key: "overfit gate", value: "proposed separately; unexecuted" }
```

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

[MATHEMATICALLY-DERIVED] For independent zero-mean weights $W_{ij}$, independent of input $x$, with variance $\sigma_W^2$, cross-weight terms vanish and

$$
\operatorname{Var}\left[\sum_{j=1}^{d}W_{ij}x_j\right]
=\sigma_W^2\sum_{j=1}^{d}\mathbb E[x_j^2]
=d\sigma_W^2v_x
$$
*(Eq. 3.21)* when inputs have zero mean and common variance $v_x$. This is conditional variance propagation, not a theorem that every initialized logit has bounded magnitude. Truncating a sampled distribution changes its actual variance unless compensated. The fixture therefore stores realized parameters rather than relying on an initialization name.

```figure
id: fig-3.26
kind: calculator
title: Initialization scale and the overflow headroom it leaves
caption: >-
  Eq. 3.21 with the illustrative conditional choice σ_W = d_in^−1/2 and a gain g on top.
  At g = 1 the output variance equals the input variance for every fan-in,
  under the stated zero-mean independent-weight premises. That leaves ln 65504 ≈ 11.09
  standard deviations before an unshifted FP16 exponential overflows. At
  g = 4 the headroom falls to 2.8 standard deviations, and step 0 requires the max-subtracted softmax of §3.2. Changing d_in moves σ_W but
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

## Mechanism

### Methodology

[DERIVED] The numerical path first validates discrete dimensions and ranges, shifts tokens once, and forms the transition mask. The model computes embeddings, causal attention, a residual feed-forward path, and vocabulary logits. Statistics, attention scores, softmax, and loss use FP64 when the input is FP64 and FP32 otherwise. Linear operations can follow an external autocast context; this leaves sensitive reductions explicitly wider. The identical model state and discrete tensors define the high-precision and candidate evaluations.

[OFFICIAL-DOCUMENTATION] PyTorch cross-entropy accepts unnormalized logits and integer class targets, with explicit sum/mean/no-reduction choices. SDPA uses Boolean true for an allowed attention pair, while other attention APIs can use the opposite convention. Its dropout probability must be set explicitly to zero during evaluation, and fused implementations can have different numerical results. The transparent implementation below makes these choices explicit before a later fused substitution. [R3.37/R3.38](references.md).

[MATHEMATICALLY-DERIVED] Replacing every masked score by a finite minimum would give a uniform distribution on an entirely masked row. Replacing them by negative infinity and calling softmax directly would evaluate infinity minus infinity. Instead, construct a finite placeholder score row for empty rows, evaluate a finite softmax, and zero that row's probabilities. This keeps both the selected forward result and the recorded derivative finite.

[DERIVED] A saved fixture must include realized parameters, token IDs, validity, transition supervision, and output metadata. Hashes detect accidental changes; they do not prove the fixture's correctness. The analytic FP64 gradient and a finite-difference comparison provide different checks, and causal/padding invariances provide semantic checks independent of either derivative route.

```figure
id: fig-3.27
kind: diagram
title: Fixture once, checks every run
caption: >-
  The left group runs once, under a recorded seed, on CPU in FP64. The right
  group runs on every change. The only thing that crosses between them is
  the stored, hashed fixture, the emphasised edge into the comparison. Fixture hashes separate changed inputs from changed execution; a changed expectation requires independent review. The tiny-batch test and the FD check read the same fixture but catch
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
  of Algorithm 3.7 (T5) and the tiny-batch overfit test (unexecuted acceptance protocol in verification.md) read the fixture. Seeded mutations from Experiment 3.5 are applied
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
    - { id: tb, kind: metric, label: "tiny-batch overfit", sub: "unexecuted verification protocol", group: every }
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

## Algorithm

[DERIVED] Algorithm 3.11 describes fixture materialization as a reproducibility mechanism. Its original experiment choices, acceptance values, and mutation studies are confined to [verification.md](verification.md).

```text
Algorithm 3.11 — Materialize an explicit reference fixture
INPUT  bounded tokens, masks, realized parameter state and environment
OUTPUT  stored reference tensors, flags and hashes
STATE  exact input/model state and FP64-preserving execution
INVARIANT  reference and candidate share objective and discrete inputs
1. validate token ranges, validity, document boundaries, and T+1 shift length
2. store exact initial parameters and discrete input/mask tensors
3. run the FP64-preserving forward/loss path with fixed execution state
4. store logits, scalar loss, parameter gradients, and finite/connectivity flags
5. record tensor hashes, shapes, objective semantics, and environment manifest
6. never regenerate a changed expected result merely to make a check pass
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: one reference forward/backward plus tensor storage and hashing
```

[DERIVED] Algorithm 3.12 defines one unscaled reference update. FP16 scaling inserts the state machine of §3.4 around backward and preserves the same mask and normalization contracts. Rejection occurs before the optimizer mutates its parameters or moments.

```text
Algorithm 3.12 — Reference single-device update
INPUT  bounded reference model, valid batch, optimizer and clip threshold
OUTPUT  accepted/rejected status and diagnostic
STATE  gradients and persistent optimizer/update state
INVARIANT  rejection gates run before optimizer mutation
1. clear gradients; evaluate defined causal forward and valid-token mean loss
2. reject nonfinite loss; backward
3. check expected gradient connectivity and elementwise finiteness
4. compute and check the global norm; apply global clipping
5. perform one optimizer update and advance its accepted-update counter
6. return accepted/rejected status and the diagnostic that selected it
TERMINATION: finite input graph, tensor or declared loop sets exhausted.
COMPLEXITY: one forward/backward plus O(P) checking, norm, clipping and update
```

## Implementation

[DERIVED] This manuscript listing specifies the reference path. Constructor defaults are not an experimental initialization protocol: load the stored fixture state before comparison. Bounds on $T,V,D$ and allocation capacity are caller preconditions; materializing $T^2$ scores is reserved for bounded reference workloads. The code has not been executed in this revision.

```python
from dataclasses import dataclass
import math
import torch
from torch import Tensor, nn
from torch.nn import functional as F


def wide(x: Tensor) -> Tensor:
    # Preserve the FP64 reference; widen narrow execution values to FP32.
    return x if x.dtype == torch.float64 else x.float()


def rms(x: Tensor, eps: float) -> Tensor:
    z = wide(x)
    return (z * torch.rsqrt(z.square().mean(-1, keepdim=True) + eps)).to(x.dtype)


class ReferenceCausalModel(nn.Module):
    def __init__(self, vocab: int, width: int, max_positions: int) -> None:
        super().__init__()
        if min(vocab, width, max_positions) <= 0:
            raise ValueError("model dimensions must be positive")
        self.vocab, self.max_positions = vocab, max_positions
        self.token = nn.Embedding(vocab, width)
        self.position = nn.Embedding(max_positions, width)
        self.qkv = nn.Linear(width, 3 * width, bias=False)
        self.proj = nn.Linear(width, width, bias=False)
        self.up = nn.Linear(width, 4 * width, bias=False)
        self.down = nn.Linear(4 * width, width, bias=False)
        self.head = nn.Linear(width, vocab, bias=False)

    def forward(self, ids: Tensor, valid: Tensor) -> Tensor:
        if ids.ndim != 2 or ids.shape != valid.shape:
            raise ValueError("expected equal [B,T] input and validity shapes")
        if ids.dtype != torch.int64 or valid.dtype != torch.bool:
            raise TypeError("expected int64 tokens and Boolean validity")
        b, t = ids.shape
        if b == 0 or not 0 < t <= self.max_positions:
            raise ValueError("empty or oversized input")
        if ids.device != valid.device:
            raise ValueError("input and validity must share a device")
        if bool(((ids < 0) | (ids >= self.vocab)).any()):
            raise ValueError("token index outside vocabulary")
        positions = torch.arange(t, device=ids.device)
        active = valid.unsqueeze(-1)
        h = (self.token(ids) + self.position(positions)) * active
        q, k, v = self.qkv(rms(h, 1e-5)).chunk(3, dim=-1)
        scores = wide(q) @ wide(k).transpose(-2, -1) / math.sqrt(q.shape[-1])
        causal = positions[:, None] >= positions[None, :]
        allowed = causal[None, :, :] & valid[:, None, :]
        has_key = allowed.any(-1, keepdim=True)
        masked = scores.masked_fill(~allowed, -torch.inf)
        safe = torch.where(has_key, masked, torch.zeros_like(masked))
        probabilities = torch.softmax(safe, dim=-1)
        probabilities = torch.where(has_key, probabilities, torch.zeros_like(probabilities))
        context = (probabilities @ wide(v)).to(h.dtype) * active
        h = (h + self.proj(context)) * active
        h = (h + self.down(F.gelu(self.up(rms(h, 1e-5))))) * active
        return self.head(rms(h, 1e-5))


def shifted_loss(model: ReferenceCausalModel, tokens: Tensor,
                 valid: Tensor, transition: Tensor) -> Tensor:
    # transition includes caller-declared document-boundary exclusions.
    if tokens.ndim != 2 or tokens.shape != valid.shape or tokens.shape[1] < 2:
        raise ValueError("expected matching [B,T+1] tokens and validity")
    if transition.dtype != torch.bool or transition.shape != tokens[:, :-1].shape:
        raise ValueError("expected Boolean [B,T] transition supervision")
    if valid.dtype != torch.bool or tokens.device != transition.device:
        raise ValueError("mask dtype/device mismatch")
    mask = valid[:, :-1] & valid[:, 1:] & transition
    if not bool(mask.any()):
        raise ValueError("effective batch has no supervised transitions")
    if tokens.dtype != torch.int64 or bool(((tokens < 0) | (tokens >= model.vocab)).any()):
        raise ValueError("tokens must be valid vocabulary indices")
    logits = model(tokens[:, :-1], valid[:, :-1])
    # Select supervised rows before evaluating the loss, rather than NaN*0.
    selected = wide(logits[mask])
    targets = tokens[:, 1:][mask]
    return F.cross_entropy(selected, targets, reduction="sum") / mask.sum()


@dataclass(frozen=True)
class Accepted:
    loss: float
    gradient_norm: float


@dataclass(frozen=True)
class Rejected:
    reason: str


def reference_step(model: ReferenceCausalModel, optimizer: torch.optim.Optimizer,
                   tokens: Tensor, valid: Tensor, transition: Tensor,
                   max_norm: float) -> Accepted | Rejected:
    # This unscaled reference is FP32/FP64; AMP inserts Algorithm 3.8.
    if not math.isfinite(max_norm) or max_norm <= 0:
        raise ValueError("clipping threshold must be finite and positive")
    optimizer.zero_grad(set_to_none=True)
    loss = shifted_loss(model, tokens, valid, transition)
    if not bool(torch.isfinite(loss)):
        return Rejected("nonfinite loss")
    loss.backward()
    for name, parameter in model.named_parameters():
        if parameter.grad is None:
            optimizer.zero_grad(set_to_none=True)
            return Rejected(f"disconnected parameter: {name}")
        if not bool(torch.isfinite(parameter.grad).all()):
            optimizer.zero_grad(set_to_none=True)
            return Rejected(f"nonfinite gradient: {name}")
    gradients = [wide(p.grad).double() for p in model.parameters()]
    norm = torch.linalg.vector_norm(torch.stack([torch.linalg.vector_norm(g) for g in gradients]))
    if not bool(torch.isfinite(norm)):
        optimizer.zero_grad(set_to_none=True)
        return Rejected("nonfinite global norm")
    norm_value = float(norm)
    factor = 1.0 if norm_value <= max_norm else max_norm / norm_value
    with torch.no_grad():
        for parameter in model.parameters():
            parameter.grad.mul_(factor)
    optimizer.step()
    return Accepted(float(loss.detach()), norm_value)
```

[DERIVED] Exceptions above reject invalid caller input; finite training rejection is an explicit result. FP64 norm accumulation is a diagnostic choice rather than a low-overhead production recommendation. Optimizer internals remain outside the pre-update gate: this listing does not provide rollback if an optimizer implementation fails after partially writing state. Sparse gradients, tied parameters, multiple optimizers, and distributed replicas require extensions rather than silent reuse.

```figure
id: fig-3.28
kind: tensor-flow
title: Dtype and shape along the causal reference path
caption: >-
  The attention mask is consumed by the score path. Empty score rows are
  made finite before softmax and receive zero probabilities. Wider operations
  preserve FP64 during reference checking and otherwise use FP32. Only valid
  supervised transitions enter the scalar loss.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-3.19", "DERIVED:eq-3.20", "DERIVED:alg-3.12"]
alt: >-
  Tokens and validity form embeddings, query/key/value projections, causal
  masked scores, safe probabilities, context, residual feed-forward states,
  vocabulary logits, selected valid transitions, and a scalar token mean.
  The score and probability tensors scale quadratically in sequence length.
spec:
  dims: { B: "sequences", T: "input positions", D: "width", V: "vocabulary", N: "valid supervised transitions" }
  steps:
    - { shape: "[B, T]", label: "ids and validity" }
    - { shape: "[B, T, D]", label: "token plus position embeddings", op: "embedding" }
    - { shape: "[B, T, 3D]", label: "query, key, value", op: "QKV projection" }
    - { shape: "[B, T, T]", label: "wider masked scores", op: "QK^T / sqrt(D); causal and key mask" }
    - { shape: "[B, T, T]", label: "finite safe probabilities", op: "softmax; empty rows to zero" }
    - { shape: "[B, T, D]", label: "context and residual paths", op: "PV; projection; feed-forward" }
    - { shape: "[B, T, V]", label: "vocabulary logits", op: "head" }
    - { shape: "[N, V]", label: "wider supervised logits", op: "select transition mask" }
    - { shape: "[1]", label: "token mean loss", op: "sum cross-entropy / N" }
```

[DERIVED] With untied token/head weights, maximum position count $T_{\max}$, and no affine normalization or biases, parameter count is $2VD+T_{\max}D+12D^2$. Forward dense products cost approximately $24BTD^2+4BT^2D+2BTDV$ FLOPs, counting multiply-add as two and excluding elementwise work. Attention scores/probabilities occupy $O(BT^2)$ elements. This bounded reference deliberately exposes quadratic storage; it is not an inference or long-context implementation. No communication occurs within the stated boundary; latency, throughput, energy, and money are unmeasured.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The Transformer paper studies decoder masking within an encoder–decoder translation model, rather than this reference architecture. Its WMT14 English–German data contain about 4.5M sentence pairs, with roughly 25,000 source and target tokens per batch. The base model trains100,000 steps on 8 P100 GPUs; reported base/big test BLEU is 27.3/28.4. Its label smoothing0.1 hurts perplexity while improving accuracy and BLEU. These details delimit the evidence for causal decoder training and objective tradeoffs; they do not validate the manuscript listing. [P01, §§3.2.3,5–6](references.md).

[PAPER-REPORTED] Glorot and Bengio's initialization study evaluates signal and gradient propagation across deep networks, motivating a fan-in/fan-out compromise. Its variance argument depends on its activation and distribution conditions. It supports inspecting realized activation and gradient scales, rather than treating an initialization family as a guarantee against overflow. [R3.30, §§3–4](references.md).

## Observations

**What the paper claims.** [PAPER-REPORTED] The translation study evaluates masked decoder training; the initialization study analyzes signal and gradient propagation under stated conditions. These are contextual evidence for the reference contracts rather than experiments on the book listing. [P01 sections 3/5/6; R3.30 section 4](references.md).

**What the evidence shows.** [DERIVED] The inspected operator documentation establishes interface semantics, not that this particular composition executes correctly. The listing consumes its mask and preserves FP64 by construction; numerical validation remains outstanding.

**What we infer.** [MATHEMATICALLY-DERIVED] If identical visible contexts receive conflicting targets, their minimum empirical cross-entropy is positive. Tiny-batch capacity alone therefore cannot establish a 0.01-nat target or convergence in 300steps. Independent future/padding invariances diagnose different defects from derivative agreement.

**What remains unknown.** [UNVERIFIED] Runtime compatibility, fitting behavior, actual allocation and fused parity of this listing have not been measured. Proposed fixtures and reports remain ungenerated.

## Failure modes

[DERIVED] Building a mask but never using it leaves causal mutation checks without a causal computation to test. Replacing an empty attention row by a finite-minimum softmax invents a uniform read. Multiplying an invalid loss by zero can preserve NaNs in the graph. A hidden FP32 cast invalidates FP64 checks. Padding exclusion based only on the current token supervises the last real token against padding. Each defect violates a different visible boundary in the reference path.

## Siblings

[DERIVED] A token-only stub is suitable for checking embedding/head and loss shapes, but cannot verify attention semantics. The explicit attention reference exposes them at quadratic cost. A fused SDPA implementation changes dispatch and intermediate storage while retaining a declared attention contract. The full Chapter 05 model adds architecture-specific paths; passing this smaller reference cannot establish their correctness.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Fused SDPA can select different backends and provides backend controls for diagnosis. Substituting it should preserve Boolean-mask orientation, empty-row behavior, dropout settings, and the FP64 checking route. Its supported dtypes and numerical differences are implementation constraints to record, not reasons to loosen an objective test. [R3.37](references.md).

## Limitations

[UNVERIFIED] Syntax inspection and algebraic accounting do not establish runtime correctness. This listing has not been executed against the inspected documentation surface. It omits packed-document state, optimizer rollback, mixed-device execution, fused-kernel parity, and large-model performance engineering. Those are explicit gaps, not claimed completed artifacts.

## Reproducibility

[DERIVED] The deliverable is the manuscript algorithm and listing. Proposed files, fixtures, and reports in verification.md remain unmaterialized until executed. An eventual report must distinguish a stored analytic reference from an independently checked derivative and state all changes to the objective, model, kernels, and fixture hashes.

## References

[DERIVED] Source locators: [P01; R3.31/g/h; R3.20; R3.30](references.md). The connection from these contracts to the reference listing is original derivation, with no claim of independent experimental validation.
