---
id: ms.verification.5
entity_type: verification
title: Verification — full-sequence versus cached inference
short_title: Verification 05
volume: 1
part: 1
chapter: 5
section: null
slug: verification
parent: ms.chapter.5
prev_sibling: ms.section.5.6
next_sibling: ms.references.5
children: []
prerequisites: [ms.section.3.6, ms.section.5.1, ms.section.5.2, ms.section.5.5, ms.section.5.6]
downstream: [ms.section.26.6, ms.section.42.2]
related: []
siblings_by_mechanism: []
relations:
  - {type: implemented_by, target: impl.pytorch}
  - {type: evaluated_by, target: experiment.5.1}
axes:
  lifecycle: [inference, evaluation]
  mechanism: [cache_representation, numerical_equivalence]
  feedback_setting: []
  modality: [text]
papers: [P01]
implementations: [impl.pytorch, impl.flashattention]
benchmarks: []
datasets: []
status:
  maturity: foundational
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED]
  empirically_observed: false
word_count_target: 900
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Verification — Chapter 05

## 1. Artifact specification

The chapter artifact is *a small reference Transformer with inspectable intermediate tensors*. It consists of four files.

| File | Contents | Fields |
|---|---|---|
| `reference_transformer.py` | Reference-level PyTorch implementation (listing in §5 below) | `Config` (vocab_size, d_model, n_layers, n_heads, d_ff, max_seq_len, ffn ∈ {gelu, swiglu}, tie_embeddings, norm_order ∈ {pre, post}, residual_scale_init, eps); `Model.forward(ids, cache, start_pos, trace)`; `Model.generate(prompt, steps)`; `KVCache`; `check_equivalence(model, prompt, dtype)` |
| `trace.md` | The §5.1 tensor trace instantiated for the §5.6 configuration | one row per trace line: `name, shape, dtype, elements, bytes, params, flops_per_token` |
| `accounting.csv` | Output of Algorithm 5.7 | `component, tensor, shape, params, flops_per_token_forward, bytes_bf16, mode` |
| `equivalence_report.json` | Output of Experiment 5.1 | `config, dtype_weights, dtype_cache, dtype_accumulate, S, per_position_max_abs, per_position_max_rel, argmax_agreement, verdict, notes` |

The trace dictionary returned by `forward(..., trace={})` uses the right-hand names of the §5.1 Tensor trace block (`h_0`, `n_att`, `qkv`, `scores`, `probs`, `ctx`, `a`, `h_mid`, `n_ffn`, `u`, `v`, `f`, `h_l`, `n_L`, `logits`) suffixed by the block index.

## 2. Verification task

The task from the plan: *check that full-sequence and incrementally cached inference agree within numerical tolerance*. The central claim it tests is the one proved in §5.5 — that, under the causal mask, the logits at position t are a function of `x_{1:t}` only, so prefill-then-decode computes the same function as a full pass.

### Experiment 5.1 — Prefill/decode logit equivalence

- **Hypothesis.** For every position t ≤ S, the logit row produced by a full-sequence forward pass over a prompt of S tokens equals the logit row produced by prefilling the first t−1 tokens and decoding token t from the cache, up to floating-point reordering; the difference is bounded by a dtype-derived tolerance and does not grow with t.
- **Setup.** The reference model at the §5.6 configuration with random initialisation (fixed seed) and, separately, the tiny fixture (D = 64, H = 4, L = 4, F = 256, V = 128). Three paths: (A) full pass over S tokens; (B) prefill over S tokens, read logits at every position; (C) prefill over 1 token, then S−1 cached decode steps feeding the *prompt's* tokens (teacher-forced decode, so the inputs are identical to A). B checks that the cache write path does not perturb the forward; C checks indexing and positions.
- **Independent variables.** Dtype regime ∈ {FP32 everywhere; BF16 weights and cache with FP32 accumulation}; attention path ∈ {materialised Algorithm 5.2; fused `scaled_dot_product_attention`}; S ∈ {16, 256, 1024}; `norm_order` ∈ {pre, post}; `ffn` ∈ {gelu, swiglu}.
- **Controlled variables.** Seed, prompt tokens, `model.eval()`, no dropout, no sampling (teacher-forced), identical device.
- **Dataset / workload.** Synthetic uniformly random token ids in `[0, V)`; no natural-language data is needed because the property is structural.
- **Hardware.** Any single accelerator or CPU; the report records device, driver and PyTorch version. The FP32 regime on CPU is the ground truth.
- **Metrics.** For each t: `max_abs(t) = max_v |z_A[t, v] − z_C[t, v]|`, `max_rel(t) = max_abs(t) / max_v |z_A[t, v]|`; `argmax_agreement` = fraction of t with equal argmax between A and C; the same for A versus B.
- **Baselines.** Path A versus itself re-run (measures run-to-run nondeterminism, [§3.6](../ch03-numerical-computation-and-trustworthy-training/03-6-reproducibility-limits.md)); this sets the floor below which differences are noise.
- **Expected result.** FP32: `max_rel(t)` at the level of the A-versus-A floor times a small factor, flat in t. BF16 cache: `max_rel(t)` bounded by the BF16 threshold in §3, flat in t. `argmax_agreement` = 1 in FP32; ≥ 0.99 in BF16 (ties at near-equal logits may flip).
- **Ablation.** Deliberately (i) drop the causal mask in path A, (ii) write the cache at slot `t` instead of `t−1`, (iii) use `P[0]` for every decoded token. Each must be detected by the signature in §3; an ablation that is *not* detected falsifies the protocol, not the model.
- **Interpretation.** A pass supports the §5.5 equivalence and the correctness of the cache path. A fail is diagnosed by its position profile (§3). The result says nothing about model quality.
- **Threats to validity.** Random weights produce near-uniform logits with small dynamic range, so `max_rel` may look favourable; repeat on a checkpoint after a short training run (Chapter 19) before relying on the tolerance. Nondeterministic kernels can make A-versus-A non-zero; the floor must be measured, not assumed. A fused backend may be silently unavailable for a given dtype/shape and fall back to the materialised path, masking a backend-specific defect; log the backend used.

```figure
id: fig-5.32
kind: diagram
title: Prefill and cached-decode equivalence protocol
caption: >-
  Three paths consume the same tokens and weights; only their use of the
  cache differs. The emphasised comparison is A against C, because C
  exercises every append, read and position index. The verdict is read from
  the shape of max_rel(t) across positions, not from one number, and each
  deliberate ablation must land on its own signature. The thresholds are
  ASSUMED from dtype arithmetic until the experiment is run.
placement: wide
evidence: ASSUMED
source: ["DERIVED:alg-5.6", "DERIVED:eq-5.20"]
alt: >-
  Left-to-right diagram of Experiment 5.1. A fixture prompt of uniform random
  ids [B, S] and the reference model in eval mode with a fixed seed feed three
  paths: A, one full pass over S tokens; B, a prefill of S tokens that writes
  the KV cache; C, a prefill of one token followed by S − 1 teacher-forced
  cached decode steps that append to and read from the cache. They produce
  logits z_A, z_B and z_C, each [B, S, V]. z_A against z_C is the emphasised
  comparison; z_A against z_B must agree in argmax everywhere; the A-versus-A
  rerun sets the noise floor. The metrics are max_rel(t) and argmax
  agreement per position. A branch on the position profile of max_rel(t)
  leads to four verdicts: flat within tolerance (FP32 at most 10 times the
  floor and at most 1e-4, BF16 at most 2e-2) is a pass; correct at t = 1 but
  far off from t = 2 indicates a mask or cache-indexing error; growth with t
  indicates a position-offset error; flat but above the FP32 tolerance
  indicates a different ε placement, GELU form or attention scale. The three
  ablations must each trigger a signature.
spec:
  direction: LR
  nodes:
    - { id: x, kind: dataset, label: "fixture prompt", sub: "uniform ids in [0, V), [B, S]" }
    - { id: m, kind: model, label: "reference model, eval(), fixed seed", sub: "§5.6 config or tiny fixture" }
    - { id: pa, kind: process, label: "path A: full pass over S tokens", group: paths }
    - { id: pb, kind: process, label: "path B: prefill S tokens, cache written", group: paths }
    - { id: pc, kind: process, label: "path C: prefill 1, then S − 1 teacher-forced decode steps", group: paths }
    - { id: kv, kind: memory, label: "KV cache", sub: "[L, 2, B, H, S_max, Dh]" }
    - { id: za, kind: tensor, label: "z_A", sub: "[B, S, V]" }
    - { id: zb, kind: tensor, label: "z_B", sub: "[B, S, V]" }
    - { id: zc, kind: tensor, label: "z_C", sub: "[B, S, V]" }
    - { id: floor, kind: metric, label: "A-versus-A floor", sub: "run-to-run nondeterminism (§3.6)" }
    - { id: rel, kind: metric, label: "max_rel(t) and argmax agreement", sub: "per position t" }
    - { id: br, kind: branch, label: "position profile of max_rel(t)" }
    - { id: ok, kind: state, label: "flat, within tolerance: pass", sub: "FP32 ≤ 10×floor and 1e-4 · BF16 ≤ 2e-2" }
    - { id: mask, kind: state, label: "t = 1 fine, t ≥ 2 far off: mask or cache index" }
    - { id: pos, kind: state, label: "grows with t: position offset" }
    - { id: eps, kind: state, label: "flat, above FP32 tolerance: ε, GELU form or scale" }
    - { id: abl, kind: dependency, label: "ablations: no mask, wrong slot, P[0] for all", sub: "each must trip a signature" }
  edges:
    - { from: x, to: pa }
    - { from: x, to: pb }
    - { from: x, to: pc }
    - { from: m, to: pa, kind: dependency }
    - { from: m, to: pb, kind: dependency }
    - { from: m, to: pc, kind: dependency }
    - { from: pb, to: kv, label: "write" }
    - { from: pc, to: kv, label: "append at slot t" }
    - { from: kv, to: pc, kind: feedback, label: "read t keys" }
    - { from: pa, to: za }
    - { from: pb, to: zb }
    - { from: pc, to: zc, kind: emphasis }
    - { from: za, to: rel }
    - { from: zc, to: rel, kind: emphasis, label: "A vs C" }
    - { from: zb, to: rel, label: "A vs B: argmax identical" }
    - { from: floor, to: rel, kind: dependency, label: "noise floor" }
    - { from: rel, to: br }
    - { from: br, to: ok }
    - { from: br, to: mask }
    - { from: br, to: pos }
    - { from: br, to: eps }
    - { from: abl, to: br, kind: dependency, label: "must be detected" }
  groups:
    - { id: paths, label: "three paths, same weights and tokens" }
```

### What would reject the chapter's central claim

If path C disagrees with path A beyond tolerance in FP32 with the materialised attention path — the most controlled regime — then either the reference implementation violates the causal structure (a defect in the artifact) or the equivalence argument of §5.5 is wrong for the reference model. The argument is a proof under the causal mask, so the first is overwhelmingly more likely; the protocol's job is to locate the line.

## 3. Acceptance criteria and tolerance rationale

The thresholds are ASSUMED from dtype arithmetic and become measured floors only after execution.

| Regime | Threshold on `max_rel(t)` | Rationale |
|---|---|---|
| FP32 weights, activations, cache, accumulation | `≤ 10 × floor_AA`, and `≤ 1e-4` absolute cap | FP32 unit roundoff is 2⁻²⁴ ≈ 6·10⁻⁸; a D-term dot product accumulated in a different order differs by O(u·√D) under random rounding; through L = 12 blocks with normalisation, a relative difference of order 10⁻⁵ is expected and 10⁻⁴ is a loose cap. MATHEMATICALLY-DERIVED order of magnitude; the constant is ASSUMED. |
| BF16 weights and cache, FP32 accumulation (the common tensor-core regime) | `≤ 2e-2` | BF16 has an 8-bit significand, unit roundoff 2⁻⁸ ≈ 3.9·10⁻³ ([§3.1](../ch03-numerical-computation-and-trustworthy-training/03-1-numeric-representations.md)). K and V are rounded to BF16 once at store time in both paths, so they are bit-identical; the paths differ in the softmax denominator's summation order over t keys and in where intermediate results are rounded to BF16 between operators. Each rounding contributes ≤ 2⁻⁸ relative; a handful per block over 12 blocks gives an order-10⁻² relative bound. MATHEMATICALLY-DERIVED order; constant ASSUMED. |
| BF16 accumulation (not recommended) | not accepted | Accumulating a 1024-term sum in BF16 loses terms smaller than 2⁻⁸ of the running total; the comparison would measure the accumulator, not the cache. |

Categorical criteria: `argmax_agreement(A, B) = 1` in all regimes (path B must be bit-identical to A if the cache write does not alter the forward); ablations (i)–(iii) must each be detected.

### Diagnostic signatures (what disagreement would indicate)

| Position profile of `max_rel(t)` | Indicates | Chapter reference |
|---|---|---|
| t = 1 within tolerance; t ≥ 2 far outside, not growing | Mask error (future keys visible in A, or missing bottom-right alignment in a chunked prefill) or cache-indexing error (K/V written to the wrong slot or read past the current length) | §5.2 Failure modes; §5.5 Failure modes |
| Growing monotonically with t | Position-offset error — the decode step applies `P[0]` (or RoPE angle 0) instead of the absolute position | §5.5 Implementation note |
| Flat, at the BF16 or FP32 order above | Expected numerical noise from reduction order and intermediate rounding | §3 of this file |
| Flat but above tolerance, FP32 | Different ε placement in RMSNorm, different GELU form, or a different attention scale between the two paths | §5.3, §5.4 Failure modes |
| Non-zero A-versus-A | Nondeterministic kernels; raise the floor, do not "fix" the model | §3.6 |

## 4. What this edition did not do

This protocol is a proposal. No run of Experiment 5.1 was executed for Edition 1.0; no `equivalence_report.json` exists; the thresholds in §3 are derived orders of magnitude with assumed constants, not measured floors. The listing below has not been executed against any PyTorch release and is UNVERIFIED; it is written against the API as documented for PyTorch 2.14.0 (R5.13, R5.14, accessed 2026-09-20).

## 5. Reference implementation (reference-level, UNVERIFIED)

```python
"""reference_transformer.py — Chapter 05 artifact.

Reference-level, not optimised. Written against the PyTorch 2.14.0 documented API
(torch.nn.RMSNorm; torch.nn.functional.scaled_dot_product_attention with attn_mask /
is_causal / scale / enable_gqa), accessed 2026-09-20. NOT EXECUTED for this edition:
UNVERIFIED. Decoder-only, pre-norm (post-norm switch), RMSNorm, learned absolute
positions (RoPE: forward link to §15.1), GELU FFN (SwiGLU switch), no biases.
"""
from dataclasses import dataclass
import math
import torch
import torch.nn as nn
import torch.nn.functional as F


@dataclass
class Config:
    vocab_size: int = 32_000
    d_model: int = 768
    n_layers: int = 12
    n_heads: int = 12
    d_ff: int = 3072            # SwiGLU: use 2048 for equal parameter count (Eq. 5.11)
    max_seq_len: int = 1024
    ffn: str = "gelu"           # "gelu" (exact erf form) | "swiglu"
    tie_embeddings: bool = False
    norm_order: str = "pre"     # "pre" | "post"
    residual_scale_init: bool = False   # GPT-2 rule: scale W_O, W_2 init by 1/sqrt(2 L)
    eps: float = 1e-6

    @property
    def d_head(self) -> int:
        assert self.d_model % self.n_heads == 0
        return self.d_model // self.n_heads


class KVCache:
    """Pre-allocated [L, 2, B, H, S_max, Dh] cache with an explicit length counter."""
    def __init__(self, cfg: Config, batch: int, device, dtype):
        shape = (cfg.n_layers, 2, batch, cfg.n_heads, cfg.max_seq_len, cfg.d_head)
        self.kv = torch.zeros(shape, device=device, dtype=dtype)
        self.length = 0                      # tokens currently stored (all layers)

    def write(self, layer: int, k, v, start: int):
        t = k.shape[2]
        self.kv[layer, 0, :, :, start:start + t] = k
        self.kv[layer, 1, :, :, start:start + t] = v

    def read(self, layer: int, upto: int):
        return self.kv[layer, 0, :, :, :upto], self.kv[layer, 1, :, :, :upto]


def _causal_mask(t_q: int, t_k: int, device) -> torch.Tensor:
    """Bottom-right-aligned additive causal mask for t_q queries over t_k >= t_q keys."""
    offset = t_k - t_q
    i = torch.arange(t_q, device=device)[:, None]
    j = torch.arange(t_k, device=device)[None, :]
    allowed = j <= i + offset
    return torch.zeros(t_q, t_k, device=device).masked_fill(~allowed, float("-inf"))


class Attention(nn.Module):
    def __init__(self, cfg: Config):
        super().__init__()
        self.cfg = cfg
        D = cfg.d_model
        self.wqkv = nn.Linear(D, 3 * D, bias=False)     # packed [D, 3D]
        self.wo = nn.Linear(D, D, bias=False)

    def forward(self, x, cache: KVCache | None, layer: int, start_pos: int,
                trace: dict | None, materialise: bool):
        B, T, D = x.shape
        H, Dh = self.cfg.n_heads, self.cfg.d_head
        qkv = self.wqkv(x).view(B, T, 3, H, Dh)          # [B, T, 3, H, Dh]
        q, k, v = (t.transpose(1, 2) for t in qkv.unbind(2))   # 3 x [B, H, T, Dh]
        if cache is not None:
            cache.write(layer, k, v, start_pos)
            k, v = cache.read(layer, start_pos + T)     # [B, H, start_pos+T, Dh]
        t_k = k.shape[2]
        if materialise:                                  # Algorithm 5.2, reference path
            scores = q @ k.transpose(-1, -2) / math.sqrt(Dh)         # [B, H, T, t_k]
            scores = scores + _causal_mask(T, t_k, x.device)
            probs = torch.softmax(scores.float(), dim=-1).to(q.dtype)
            ctx = probs @ v                                          # [B, H, T, Dh]
            if trace is not None:
                trace[f"scores.{layer}"] = scores
                trace[f"probs.{layer}"] = probs
        else:                                            # fused path (R5.13)
            if T == 1:
                ctx = F.scaled_dot_product_attention(q, k, v)          # no mask needed
            elif start_pos == 0:
                ctx = F.scaled_dot_product_attention(q, k, v, is_causal=True)
            else:                                        # chunked prefill: explicit mask,
                ctx = F.scaled_dot_product_attention(  # never together with is_causal
                    q, k, v, attn_mask=_causal_mask(T, t_k, x.device))
        out = self.wo(ctx.transpose(1, 2).reshape(B, T, D))
        if trace is not None:
            trace[f"qkv.{layer}"] = qkv
            trace[f"ctx.{layer}"] = ctx
            trace[f"a.{layer}"] = out
        return out


class FeedForward(nn.Module):
    def __init__(self, cfg: Config):
        super().__init__()
        self.cfg = cfg
        D, Fw = cfg.d_model, cfg.d_ff
        self.w1 = nn.Linear(D, Fw, bias=False)
        self.w2 = nn.Linear(Fw, D, bias=False)
        self.w3 = nn.Linear(D, Fw, bias=False) if cfg.ffn == "swiglu" else None

    def forward(self, x, layer: int, trace: dict | None):
        u = self.w1(x)                                   # [B, T, F]
        if self.w3 is None:
            v = F.gelu(u)                                # exact (erf) form
        else:
            v = F.silu(u) * self.w3(x)                   # SwiGLU, Eq. 5.10
        f = self.w2(v)
        if trace is not None:
            trace[f"u.{layer}"], trace[f"v.{layer}"], trace[f"f.{layer}"] = u, v, f
        return f


class Block(nn.Module):
    def __init__(self, cfg: Config):
        super().__init__()
        self.cfg = cfg
        self.norm_att = nn.RMSNorm(cfg.d_model, eps=cfg.eps)
        self.norm_ffn = nn.RMSNorm(cfg.d_model, eps=cfg.eps)
        self.attn = Attention(cfg)
        self.ffn = FeedForward(cfg)

    def forward(self, h, cache, layer, start_pos, trace, materialise):
        if self.cfg.norm_order == "pre":                 # Eq. 5.14
            h = h + self.attn(self.norm_att(h), cache, layer, start_pos, trace, materialise)
            h = h + self.ffn(self.norm_ffn(h), layer, trace)
        else:                                            # Eq. 5.13
            h = self.norm_att(h + self.attn(h, cache, layer, start_pos, trace, materialise))
            h = self.norm_ffn(h + self.ffn(h, layer, trace))
        if trace is not None:
            trace[f"h_l.{layer}"] = h
        return h


class Model(nn.Module):
    def __init__(self, cfg: Config):
        super().__init__()
        self.cfg = cfg
        self.embed = nn.Embedding(cfg.vocab_size, cfg.d_model)
        self.pos = nn.Embedding(cfg.max_seq_len, cfg.d_model)
        self.blocks = nn.ModuleList(Block(cfg) for _ in range(cfg.n_layers))
        self.norm_final = nn.RMSNorm(cfg.d_model, eps=cfg.eps)
        self.head = nn.Linear(cfg.d_model, cfg.vocab_size, bias=False)
        if cfg.tie_embeddings:
            self.head.weight = self.embed.weight
        self._init_weights()

    def _init_weights(self):
        # CS336 handout §3.3.1 (R5.11): trunc-normal, var 2/(d_in+d_out), embeddings N(0,1)
        for m in self.modules():
            if isinstance(m, nn.Linear):
                std = math.sqrt(2.0 / (m.in_features + m.out_features))
                nn.init.trunc_normal_(m.weight, 0.0, std, -3 * std, 3 * std)
        nn.init.trunc_normal_(self.embed.weight, 0.0, 1.0, -3.0, 3.0)
        nn.init.trunc_normal_(self.pos.weight, 0.0, 1.0, -3.0, 3.0)
        if self.cfg.residual_scale_init:                 # GPT-2 rule (R5.2 §2.3)
            scale = 1.0 / math.sqrt(2 * self.cfg.n_layers)
            for b in self.blocks:
                b.attn.wo.weight.data.mul_(scale)
                b.ffn.w2.weight.data.mul_(scale)

    def forward(self, ids, cache: KVCache | None = None, start_pos: int = 0,
                trace: dict | None = None, materialise: bool = False,
                last_only: bool = False):
        """Algorithm 5.1 (cache=None) or Algorithm 5.6 lines 2–8 / 10–16 (cache given)."""
        B, T = ids.shape
        assert start_pos + T <= self.cfg.max_seq_len, "position table overflow"
        pos = torch.arange(start_pos, start_pos + T, device=ids.device)
        h = self.embed(ids) + self.pos(pos)[None]        # Eq. 5.1
        if trace is not None:
            trace["h_0"] = h
        for layer, block in enumerate(self.blocks):
            h = block(h, cache, layer, start_pos, trace, materialise)
        if cache is not None:
            cache.length = start_pos + T
        if last_only:
            h = h[:, -1:]
        logits = self.head(self.norm_final(h))           # Eq. 5.3
        if trace is not None:
            trace["logits"] = logits
        return logits

    @torch.no_grad()
    def generate(self, prompt, steps: int, sampler=lambda z: z.argmax(-1)):
        """Algorithm 5.6: prefill, then cached decode steps."""
        self.eval()
        B, S = prompt.shape
        cache = KVCache(self.cfg, B, prompt.device, self.embed.weight.dtype)
        z = self.forward(prompt, cache, 0, last_only=True)
        out = [sampler(z[:, -1])]
        for g in range(steps - 1):
            nxt = out[-1][:, None]
            z = self.forward(nxt, cache, cache.length, last_only=True)
            out.append(sampler(z[:, -1]))
        return torch.stack(out, dim=1), cache


def train_step(model: Model, x, mask, optimizer, clip: float | None = 1.0):
    """Algorithm 5.5. x: [B, T+1] int64; mask: [B, T] in {0,1}."""
    model.train()
    optimizer.zero_grad(set_to_none=True)
    z = model(x[:, :-1])                                 # [B, T, V]
    logp = F.log_softmax(z.float(), dim=-1)              # FP32 log-softmax (§3.2)
    nll = -logp.gather(-1, x[:, 1:, None]).squeeze(-1)   # shifted targets
    loss = (nll * mask).sum() / mask.sum()               # Eq. 5.18, token mean
    loss.backward()
    if clip is not None:
        torch.nn.utils.clip_grad_norm_(model.parameters(), clip)
    optimizer.step()
    return loss.detach()


@torch.no_grad()
def check_equivalence(model: Model, prompt, materialise: bool = True):
    """Experiment 5.1: paths A (full), B (prefill with cache), C (teacher-forced decode)."""
    model.eval()
    B, S = prompt.shape
    zA = model(prompt, materialise=materialise)                      # [B, S, V]
    cache = KVCache(model.cfg, B, prompt.device, model.embed.weight.dtype)
    zB = model(prompt, cache, 0, materialise=materialise)
    cache = KVCache(model.cfg, B, prompt.device, model.embed.weight.dtype)
    rows = []
    for t in range(S):
        rows.append(model(prompt[:, t:t + 1], cache, t, materialise=materialise))
    zC = torch.cat(rows, dim=1)
    scale = zA.float().abs().amax(dim=-1)                            # [B, S]
    rel_C = (zA.float() - zC.float()).abs().amax(dim=-1) / scale
    rel_B = (zA.float() - zB.float()).abs().amax(dim=-1) / scale
    return {
        "per_position_max_rel_AC": rel_C.amax(dim=0).tolist(),
        "per_position_max_rel_AB": rel_B.amax(dim=0).tolist(),
        "argmax_agreement_AC": (zA.argmax(-1) == zC.argmax(-1)).float().mean().item(),
        "argmax_agreement_AB": (zA.argmax(-1) == zB.argmax(-1)).float().mean().item(),
    }


def count_parameters(model: Model) -> int:
    """Must equal Eq. 5.22 (tied or untied row of the §5.6 table)."""
    return sum(p.numel() for p in model.parameters())
```

Equivalence of this listing with the algorithms of §5.1–§5.5 is by construction of the line-by-line mapping in the comments; its numerical behaviour on any device is UNVERIFIED until Experiment 5.1 is run and its report retained.
