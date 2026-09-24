---
id: ms.verification.2
entity_type: verification
title: Verification — cross-entropy gradients and a paired cluster bootstrap
short_title: Verification 02
volume: 1
part: 1
chapter: 2
section: null
slug: verification
parent: ms.chapter.2
prev_sibling: null
next_sibling: ms.references.2
children: []
prerequisites: [ms.section.2.4, ms.section.2.5]
downstream: [ms.section.3.3, ms.section.6.4]
related: []
siblings_by_mechanism: []
relations:
  - {type: evaluated_by, target: ms.section.2.4}
  - {type: evaluated_by, target: ms.section.2.5}
axes: {lifecycle: [evaluation], mechanism: [differentiation, statistical_inference], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, ASSUMED, UNVERIFIED], empirically_observed: false}
word_count_target: 700
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Verification — Chapter 02

## 1. Artifact specification

The chapter artifact is *a consistent notation and statistical-estimation reference*. It consists of four files.

**`notation-extension.md`** — one table, one row per local symbol introduced in Chapter 02. Fields: symbol · meaning · shape or unit · owning section · conflicts checked against `front-matter/notation.md` (yes/no). Rows: contraction indices i, j, k; σ_i, κ₂; ESS, w_i; H, KL, I(X;Y), ℓ, L_T, L_B, BPB; J, vᵀJ, Ju, H (Hessian), G, A ⊗ G_ℓ; b (baseline), ε, g(θ, ε); ρ, DE, K, m, R, δ, σ_d²; x, f, g_i, b_i, λ_i (multipliers), ν_j, f*, Σ, w.

**`estimator-table.md`** — one row per estimator used anywhere in the book. Fields: estimand · estimator formula (equation number) · unbiased (yes/no/under assumption) · variance formula · per-sample cost (in forward passes, generations, or refits) · resampling unit for its interval · owning section. Initial rows: Monte Carlo mean (Eq. 2.8); self-normalised importance sampling (Eq. 2.9); sampled KL k₁ and k₃ (§02.3); bits per byte (Eq. 2.13); softmax-CE gradient (Eq. 2.16); Hessian-vector product, Gauss–Newton product, K-FAC preconditioner, Hutchinson diagonal (§02.4); score-function, reparameterisation, straight-through (Eq. 2.18–2.19); normal CI, percentile bootstrap, BCa, paired permutation, clustered SE (§02.5); delta-method variance (Eq. 2.27).

**`ce_gradient_check.py`** — reference code below; fields of its output record: dtype · logit scale · V · max |analytic − numeric| · tolerance · pass/fail.

**`paired_cluster_bootstrap.py`** — reference code below; fields of its output record: n · K · m · ρ · R · method (cluster / per-prompt) · empirical coverage · mean width · Monte Carlo SE of coverage.

## 2. Verification task

### Experiment 2.1 — Softmax cross-entropy gradient in log-sum-exp form

- **Hypothesis.** The gradient of Eq. 2.15 with respect to the logits equals p − y (Eq. 2.16) and the LSE-shifted implementation remains finite and accurate on extreme logits.
- **Setup.** FP64 reference implementation of L(z) = −yᵀz + LSE(z); analytic gradient p − y; central finite differences (L(z + εe_v) − L(z − εe_v))/2ε per coordinate.
- **Independent variables.** Logit scale s ∈ {1, 10, 100, 1000} (z = s·ζ, ζ ∼ N(0, 1)); vocabulary size V ∈ {8, 1024, 32768}; target: one-hot and a soft distribution.
- **Controlled variables.** ε = 10⁻⁶ in FP64; seed; no framework fused kernels in the reference path.
- **Dataset/workload.** Synthetic logits only.
- **Hardware.** CPU; irrelevant to the identity.
- **Metrics.** max |∂L/∂z − FD|; whether an unshifted implementation (exp then normalise) produces inf/NaN at s = 1000; relative error of an FP32 and a BF16 forward against FP64 (feeds [§03.2](../ch03-numerical-computation-and-trustworthy-training/03-2-stable-primitives.md)).
- **Baselines.** Framework `cross_entropy` on the same inputs, in FP32.
- **Expected result.** max error ≲ 10⁻⁸ in FP64 for all s; shifted form finite at all s; unshifted form overflows at large s.
- **Ablation.** Remove the max shift; observe failure.
- **Interpretation.** A persistent discrepancy above tolerance at *small* s rejects the derivation of Eq. 2.16 as implemented; a discrepancy only at large s with the shifted form rejects the numerical form.
- **Threats to validity.** Finite-difference error itself grows with s (truncation ∝ ε²·|∂³L|); use FP64 and report the FD error bound.

```python
# ce_gradient_check.py — reference-level, UNVERIFIED for version (written against a PyTorch 2.x-style API; not executed)
import torch

def ce_lse(z, y):
    # z: [V] logits, y: [V] target distribution; Eq. 2.15 in shifted LSE form
    m = z.max()
    lse = m + torch.log(torch.exp(z - m).sum())
    return -(y * z).sum() + lse

def grad_analytic(z, y):
    return torch.softmax(z, dim=0) - y          # Eq. 2.16

def grad_fd(z, y, eps=1e-6):
    g = torch.empty_like(z)
    for v in range(z.numel()):
        e = torch.zeros_like(z); e[v] = eps
        g[v] = (ce_lse(z + e, y) - ce_lse(z - e, y)) / (2 * eps)
    return g

def check(V=1024, scale=1.0, soft=False, seed=0, tol=1e-8):
    gen = torch.Generator().manual_seed(seed)
    z = scale * torch.randn(V, dtype=torch.float64, generator=gen)
    if soft:
        y = torch.softmax(torch.randn(V, dtype=torch.float64, generator=gen), dim=0)
    else:
        y = torch.zeros(V, dtype=torch.float64); y[int(torch.randint(V, (1,), generator=gen))] = 1.0
    err = (grad_analytic(z, y) - grad_fd(z, y)).abs().max().item()
    finite = torch.isfinite(ce_lse(z, y)).item()
    return {"V": V, "scale": scale, "soft": soft, "max_abs_err": err, "finite": finite, "pass": err < tol and finite}

if __name__ == "__main__":
    for s in (1.0, 10.0, 100.0, 1000.0):
        for V in (8, 1024):
            print(check(V=V, scale=s))
```

### Experiment 2.2 — Coverage of per-prompt versus per-cluster paired bootstrap

- **Hypothesis.** With intra-cluster correlation ρ > 0 and m > 1 prompts per cluster, percentile intervals from per-prompt resampling cover the true paired difference δ at a rate below nominal by an amount that grows with DE = 1 + (m − 1)ρ (Eq. 2.22); cluster resampling (Algorithm 2.5) covers at 1 − α within Monte Carlo error.
- **Setup.** Simulate K clusters × m prompts; scores s_A = μ + a_k + e^A_{kj}, s_B = μ − δ + a_k + e^B_{kj}, with a_k ∼ N(0, σ_a²), e ∼ N(0, σ_e²) independent; compute intervals both ways; repeat over S synthetic populations.
- **Independent variables.** ρ ∈ {0, 0.25, 0.5, 0.75}; m ∈ {1, 5, 10, 25}; K ∈ {20, 50, 200}.
- **Controlled variables.** δ, α = 0.05, R = 2000 replicates, S = 2000 populations, seeds.
- **Dataset/workload.** Synthetic; a follow-up on a real benchmark with recorded template ids is a Chapter 06 proposal.
- **Hardware.** CPU.
- **Metrics.** Empirical coverage (fraction of populations whose interval contains δ) with its binomial SE √(c(1−c)/S); mean interval width; ratio of widths (cluster/per-prompt), predicted ≈ √DE.
- **Baselines.** Normal-approximation interval on paired differences treating prompts as iid.
- **Expected result.** Per-prompt coverage ≈ 0.95 at ρ = 0 or m = 1 and falls toward the coverage of an interval √DE too narrow otherwise; cluster coverage ≈ 0.95 throughout for K ≥ 50, degrading at K = 20.
- **Ablation.** Unpaired cluster bootstrap (resample A and B clusters independently): wider intervals, same coverage.
- **Interpretation.** If cluster resampling under-covers at K = 200 and ρ = 0, the implementation is wrong; if per-prompt resampling covers at nominal for ρ = 0.5, m = 10, the design-effect argument as implemented is wrong (the derivation is exact, so this would locate a simulation bug).
- **Threats to validity.** Gaussian, equal-size, single-level clustering is simpler than real evaluations; Bernoulli scores at extreme p and unequal clusters should be added.

```python
# paired_cluster_bootstrap.py — reference-level, UNVERIFIED for version (NumPy-style API; not executed)
import numpy as np

def paired_cluster_bootstrap(s_a, s_b, cluster, R=2000, alpha=0.05, seed=0):
    """Algorithm 2.5. s_a, s_b: per-unit scores (same units, paired); cluster: cluster id per unit."""
    rng = np.random.default_rng(seed)
    d = np.asarray(s_a, float) - np.asarray(s_b, float)            # pair first
    ids, inv = np.unique(np.asarray(cluster), return_inverse=True)
    K = len(ids)
    groups = [np.flatnonzero(inv == k) for k in range(K)]
    d_hat = d.mean()
    reps = np.empty(R)
    for r in range(R):
        draw = rng.integers(0, K, size=K)                              # K clusters with replacement
        idx = np.concatenate([groups[k] for k in draw])               # carried whole
        reps[r] = d[idx].mean()
    lo, hi = np.quantile(reps, [alpha / 2, 1 - alpha / 2])
    return {"d_hat": d_hat, "lo": lo, "hi": hi, "se_boot": reps.std(ddof=1), "K": K}

def simulate_population(K, m, rho, delta, sigma2=1.0, seed=0):
    rng = np.random.default_rng(seed)
    sa2, se2 = rho * sigma2, (1 - rho) * sigma2
    a = rng.normal(0, np.sqrt(sa2), size=K)
    cluster = np.repeat(np.arange(K), m)
    s_a = a[cluster] + rng.normal(0, np.sqrt(se2), size=K * m)
    s_b = a[cluster] - delta + rng.normal(0, np.sqrt(se2), size=K * m)
    return s_a, s_b, cluster

def coverage(K=50, m=10, rho=0.5, delta=0.1, S=2000, R=2000, alpha=0.05, seed=0):
    hits = {"cluster": 0, "per_prompt": 0}; widths = {"cluster": 0.0, "per_prompt": 0.0}
    for s in range(S):
        s_a, s_b, cl = simulate_population(K, m, rho, delta, seed=seed + s)
        for name, lab in (("cluster", cl), ("per_prompt", np.arange(K * m))):
            out = paired_cluster_bootstrap(s_a, s_b, lab, R=R, alpha=alpha, seed=seed + s)
            hits[name] += int(out["lo"] <= delta <= out["hi"])
            widths[name] += out["hi"] - out["lo"]
    res = {}
    for name in hits:
        c = hits[name] / S
        res[name] = {"coverage": c, "coverage_se": (c * (1 - c) / S) ** 0.5, "mean_width": widths[name] / S}
    res["design_effect"] = 1 + (m - 1) * rho
    return res

if __name__ == "__main__":
    print(coverage())
```

## 3. Acceptance criteria

| Check | Criterion |
|---|---|
| 2.1 gradient identity | max |analytic − FD| < 10⁻⁸ in FP64 for all V and s tested |
| 2.1 numerical form | shifted-LSE loss finite for all s; unshifted reference overflows at s = 1000 (documents the failure) |
| 2.1 framework baseline | FP32 framework cross-entropy within 10⁻⁵ relative of the FP64 reference at s ≤ 10; discrepancies at larger s reported, not hidden |
| 2.2 cluster coverage | 0.95 ± 2·SE_cov at K ≥ 50 for every (ρ, m) |
| 2.2 per-prompt coverage | below 0.95 − 2·SE_cov whenever DE ≥ 2; equal to cluster coverage within 2·SE_cov when ρ = 0 or m = 1 |
| 2.2 width ratio | cluster/per-prompt mean width within ±15 % of √DE for K ≥ 50 |
| Artifact tables | every estimator used in Chapters 02–06 has a row; every local symbol has a conflict check against notation.md |

Rejection: failing the 2.1 gradient identity at small s rejects Eq. 2.16 as implemented; failing 2.2 cluster coverage at large K rejects the chapter's variance model or Algorithm 2.5 as implemented.

```figure
id: fig-2.35
kind: diagram
title: Protocol of Experiments 2.1 and 2.2 and their rejection rules
caption: >-
  Two independent checks, each ending in a branch that says which claim a
  failure would reject. In 2.1 the emphasised comparison is analytic p − y
  against FP64 central differences; the unshifted ablation must fail, or the
  test is too easy. In 2.2 the emphasised path is cluster resampling, whose
  coverage must sit in 0.95 ± 2·SE_cov, [0.940, 0.960] at S = 2000; the
  per-prompt baseline must fall below it whenever DE ≥ 2. Thresholds are
  ASSUMED planning values; neither experiment has been run.
placement: wide
evidence: ASSUMED
source: ["DERIVED:eq-2.15", "DERIVED:eq-2.16", "DERIVED:eq-2.22", "DERIVED:alg-2.5"]
alt: >-
  Left-to-right diagram in two groups. Experiment 2.1: synthetic FP64 logits
  z = s·ζ with s in {1, 10, 100, 1000} and V in {8, 1024, 32768}, with one-hot
  or soft targets, feed the shifted-LSE loss of Eq. 2.15, which feeds both
  the analytic gradient p − y (Eq. 2.16) and central finite differences with
  ε = 10^−6. Their maximum absolute difference must be below 10^−8. An
  unshifted exp-then-normalise ablation must overflow at s = 1000. A verdict
  branch: failure at small s rejects Eq. 2.16 as implemented; failure only
  at large s rejects the numerical form. Experiment 2.2: synthetic
  populations of K clusters by m prompts with paired scores and known δ,
  over ρ in {0, 0.25, 0.5, 0.75}, m in {1, 5, 10, 25}, K in {20, 50, 200},
  feed cluster resampling (Algorithm 2.5, R = 2000) on the emphasised path
  and per-prompt resampling as the baseline. Coverage over S = 2000
  populations, with binomial SE of about 0.0049, and the width ratio,
  predicted near √DE within ±15 %, feed a verdict branch: cluster coverage
  outside 0.95 ± 2 SE at K ≥ 50 rejects the variance model or its
  implementation; per-prompt coverage at nominal when DE ≥ 2 locates a
  simulation bug.
spec:
  direction: LR
  nodes:
    - { id: z, kind: dataset, label: "synthetic logits z = s·ζ, FP64", sub: "s ∈ {1, 10, 100, 1000}; V ∈ {8, 1024, 32768}", group: e21 }
    - { id: lse, kind: process, label: "shifted-LSE loss, Eq. 2.15", sub: "one-hot and soft targets y", group: e21 }
    - { id: an, kind: process, label: "analytic gradient p − y", sub: "Eq. 2.16", group: e21 }
    - { id: fd, kind: process, label: "central differences", sub: "ε = 1e-6, per coordinate", group: e21 }
    - { id: err, kind: metric, label: "max |analytic − FD|", sub: "accept < 1e-8 in FP64", group: e21, emphasis: true }
    - { id: abl, kind: dependency, label: "ablation: unshifted exp, then normalise", sub: "must overflow at s = 1000", group: e21 }
    - { id: v1, kind: branch, label: "2.1 verdict", sub: "small s: Eq. 2.16 as coded; large s only: numerics", group: e21 }
    - { id: pop, kind: dataset, label: "synthetic populations, K × m, known δ", sub: "ρ ∈ {0, .25, .5, .75}; m ∈ {1, 5, 10, 25}", group: e22 }
    - { id: cl, kind: process, label: "cluster resampling, Algorithm 2.5", sub: "R = 2000 replicates", group: e22 }
    - { id: pp, kind: process, label: "per-prompt resampling (baseline)", sub: "each prompt its own cluster", group: e22 }
    - { id: cov, kind: metric, label: "coverage over S = 2000 populations", sub: "binomial SE ≈ 0.0049 at c = 0.95", group: e22, emphasis: true }
    - { id: wr, kind: metric, label: "width ratio cluster / per-prompt", sub: "predicted √DE, within ±15 %", group: e22 }
    - { id: v2, kind: branch, label: "2.2 verdict", sub: "cluster outside 0.95 ± 2 SE at K ≥ 50: reject", group: e22 }
  edges:
    - { from: z, to: lse }
    - { from: lse, to: an }
    - { from: lse, to: fd }
    - { from: an, to: err, kind: emphasis, label: "compare" }
    - { from: fd, to: err }
    - { from: abl, to: err, kind: dependency, label: "must fail" }
    - { from: err, to: v1 }
    - { from: pop, to: cl, kind: emphasis }
    - { from: pop, to: pp }
    - { from: cl, to: cov, kind: emphasis }
    - { from: pp, to: cov }
    - { from: cl, to: wr }
    - { from: pp, to: wr }
    - { from: cov, to: v2 }
    - { from: wr, to: v2 }
  groups:
    - { id: e21, label: "Experiment 2.1: softmax-CE gradient" }
    - { id: e22, label: "Experiment 2.2: bootstrap coverage" }
```

## 4. What this edition did not do

Neither experiment was executed for Edition 1.0. The code above is reference-level, written against PyTorch 2.x-style and NumPy-style APIs, and is marked UNVERIFIED for version; it was not run, and no coverage numbers, error magnitudes, or timings are reported. The acceptance thresholds are ASSUMED planning values. No claim in this chapter carries either of the two evidence labels that the contract reserves for executed experiments or inspected implementations.
