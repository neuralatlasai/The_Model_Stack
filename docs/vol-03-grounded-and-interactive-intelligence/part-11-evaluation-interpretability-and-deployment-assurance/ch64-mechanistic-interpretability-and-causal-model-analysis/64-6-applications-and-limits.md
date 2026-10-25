---
id: ms.section.64.6
entity_type: section
title: "Applications and limits"
volume: 3
part: 11
chapter: 64
section: 64.6
slug: 64-6-applications-and-limits
parent: ms.chapter.64
prev_sibling: ms.section.64.5
next_sibling: ms.verification.64
children: []
prerequisites:
  [
    ms.chapter.2,
    ms.chapter.5,
    ms.chapter.13,
    ms.chapter.14,
    ms.chapter.15,
    ms.chapter.16,
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.32,
    ms.chapter.61,
    ms.chapter.62,
  ]
downstream: [ms.chapter.65, ms.chapter.66]
related: [ms.chapter.40, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [evaluation, assurance],
    mechanism:
      [causal_intervention, representation_analysis, feature_decomposition],
    feedback_setting: [],
    modality: [text],
  }
papers: []
implementations:
  [
    impl.pytorch,
    impl.hugging-face-transformers,
    impl.pytorch-fsdp2,
    impl.nvidia-megatron-core,
    impl.sglang,
  ]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        CODE-VERIFIED,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2200
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 64.6 Applications and limits

## Scope

[DERIVED] Interpretability is useful for debugging, targeted modification and safety investigation when its intervention predictions survive the relevant operating changes. The baseline trusts a feature name, a readable activation explanation or stable output perplexity. Acceptance instead requires task-specific improvement, bounded unrelated harm and revalidation of the measurement after model/dtype/site changes. This section owns application validity, natural-language activation explanations, measurement drift and mechanistic generalization failure. Security policy and release authorization remain in Chapters 65-66; an interpretation is not a safety certificate.

## Why this exists

[DERIVED] An explanation can be operationally helpful and scientifically incomplete. It can reveal a hypothesis that a later intervention falsifies. Conversely, a model modification can improve one observed task while breaking another, or preserve output quality while invalidating the feature basis used for monitoring. The dominant uncertainty is whether the analysis transfers to the intervention, population and deployed measurement regime. More eloquent labels do not resolve that uncertainty.

## Intuition

[PAPER-REPORTED] Natural Language Autoencoders (NLAs) turn one activation into explanatory text, then reconstruct the activation from that text. Their training rewards round-trip information, using a verbalizer and reconstructor. This differs from identifying the sequence of original-model operations that produced the activation. The May 2026 report explicitly discusses confabulation and the limits of a single-layer black-box readout. [R64.6, Architecture, Training, Limitations](https://transformer-circuits.pub/2026/nla/index.html).

[DERIVED] Reconstructability can motivate investigation without proving that every sentence is true of the source context or describes a causal mechanism. A strong decoder may extract useful signal from some words while other words are unsupported. Repeated useful observations at one checkpoint also do not establish a stable feature identity after a release change.

## Formulation

[DERIVED] For a proposed activation modification $h\leftarrow h+\gamma u$, let $T(\gamma,u)$ be target-task performance, $B_j(\gamma,u)$ unrelated-task harm and $K_{\mathrm{run}}$ the full intervention cost. A book-defined selection problem is

$$
\max_{\gamma,u}T(\gamma,u)\quad\text{subject to}\quad
B_j(\gamma,u)\le\epsilon_j\ \forall j,\quad
K_{\mathrm{run}}\le K_*,\quad
(\gamma,u)\in\mathcal A_{\mathrm{validated}}.
$$

_(Eq. 64.21)_

[DERIVED] The admissible set fixes site, norm/range, population and intervention policy. The constraints are measured on disjoint held-out workloads with uncertainty and a predeclared stopping rule. They do not certify untested harms. A feature's attractive label is not a substitute for these measurements; if the feasible set is empty, report no acceptable modification instead of selecting the least bad unconstrained point.

[DERIVED] Let $H=h/\|h\|_2$ be a nonzero activation direction, $z\sim\pi_\phi(\cdot\mid H)$ a textual explanation and $u_\psi(z)$ a unit reconstructor output. The round-trip loss and conventional explained variance are

$$
\mathcal L_{\mathrm{point}}=\mathbb E\|H-u_\psi(z)\|_2^2
=2-2\mathbb E[H^Tu_\psi(z)],\quad
V_{\mathrm{NLA}}=1-\frac{\mathbb E\|H-u_\psi(z)\|^2}{\mathbb E\|H-\mathbb EH\|^2}.
$$

_(Eq. 64.22)_

[DERIVED] Normalization discards magnitude; zero activations and a zero variance denominator need explicit handling. Explained variance may be negative. An alternative normalized-mean baseline is a different metric and must be named separately. The report's unit-direction formulation and the pinned implementation's configurable norm scale are reconciled below. [R64.6, Training; R64.7, `nla/schema.py`](https://transformer-circuits.pub/2026/nla/index.html).

[PAPER-REPORTED] The report trains a warm-started verbalizer by group-relative policy updates with a reference-policy KL penalty, using a negative-log reconstruction-error reward. A schematic population objective, excluding the estimator's clipping/group normalization, is

$$
J(\phi;\psi)=\mathbb E_{H,z\sim\pi_\phi}[r_\psi(H,z)]
-\beta_{\mathrm{NLA}}\mathbb E_H\operatorname{KL}(\pi_\phi(\cdot\mid H)\|\pi_{\mathrm{ref}}(\cdot\mid H)),
\quad r_{\log}=-\log\max(\|H-u_\psi(z)\|^2,\epsilon_{\mathrm{num}}).
$$

_(Eq. 64.23)_

[DERIVED] The numerical clamp is an explicit book/pinned-code guard; its value and loss normalization must be recorded. Negative MSE and negative log MSE order individual nonzero errors identically but do not generally produce the same expected-policy objective. A mixture can prefer different outcomes under these transformations. Group normalization, clipping and KL further affect training; refer to the canonical policy-update chapter rather than treating Eq. 64.23 as the exact implemented surrogate. [R64.6, Training; R64.7, `nla/reward.py`, `_mse_to_reward`](https://github.com/kitft/natural_language_autoencoders/blob/0577769b55ad4fdd96d159e983361b97fa4e7331/nla/reward.py).

[MATHEMATICALLY-DERIVED] For a fixed explanation and unit-valued random $H$, write $\mu_z=\mathbb E[H\mid z]$. Then

$$
\min_{\|u\|=1}\mathbb E[\|H-u\|^2\mid z]=2-2\|\mu_z\|,
\quad u_*=\mu_z/\|\mu_z\|\ \text{if }\mu_z\ne0.
$$

_(Eq. 64.24)_

[DERIVED] Expand the square to $2-2u^T\mu_z$ and maximize the inner product by Cauchy-Schwarz. If $\mu_z=0$, every unit output has loss 2. Distributions uniform on $\{e_1,-e_1\}$ and $\{e_2,-e_2\}$ therefore have the same optimal point loss although they occupy different axes. The example uses nonzero unit activations, so it is not a normalization artifact. This is the point-reconstruction obstruction analyzed by Flow-NLA. [R64.8, §4.1](https://arxiv.org/html/2609.33702v1#S4.SS1).

```figure
{
  "id": "fig-64.18",
  "kind": "calculator",
  "title": "Point reconstruction sees the conditional mean",
  "caption": "Executes Eq. 64.24 for an assumed unit-vector population. Equal mean norm implies equal best point loss even when conditional distributions differ.",
  "alt": "An analytical calculator with explicit inputs. Executes Eq. 64.24 for an assumed unit-vector population. Equal mean norm implies equal best point loss even when conditional distributions differ.",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-64.24",
  "spec": {
    "equation": "64.24",
    "tex": "\\mathcal L_{\\mathrm{best}}=2-2\\|\\mu_z\\|",
    "inputs": [
      {
        "symbol": "mean",
        "label": "conditional mean norm",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "loss",
        "label": "best unit point-reconstruction loss",
        "formula": "2-2*mean",
        "format": "fixed3"
      }
    ]
  },
  "placement": "rail",
  "anchor": "formulation"
}
```

[PAPER-REPORTED] Flow-NLA instead standardizes activation coordinates and trains a conditional v-parameterized denoiser. With $a_t^2+b_t^2=1$, Gaussian $\varepsilon\sim\mathcal N(0,I_d)$ and standardized $x$, it uses

$$
x_t=a_tx+b_t\varepsilon,\quad v_t=a_t\varepsilon-b_tx,\qquad
\mathcal L_{\mathrm{vel}}=\mathbb E\left[d^{-1}\|f_\psi(x_t,t,z)-v_t\|^2\right],\quad
\widehat\varepsilon_\psi=b_tx_t+a_tf_\psi(x_t,t,z).
$$

_(Eq. 64.25)_

[DERIVED] The last identity follows from $b_tx_t+a_tv_t=\varepsilon$ and requires no second predictor. Here $v_t$ is the denoising v-parameterization, not automatically the derivative of the noising path in its chosen clock. If $a_t=\cos\theta(t)$ and $b_t=\sin\theta(t)$, then $d x_t/dt=\theta'(t)v_t$; equality with $v_t$ itself requires unit angular speed. The condition $a_t^2+b_t^2=1$ alone does not supply that speed. This distinction leaves the displayed noise-recovery identity unchanged. A richer conditional distribution can preserve information beyond its mean. This does not imply that a finite trained reconstructor attains the population optimum or that its words are supported by the original context. [R64.8, §4.2, Eq. 2](https://arxiv.org/html/2609.33702v1#S4.SS2).

[PAPER-REPORTED] In log signal-to-noise coordinate $\zeta=\log(a_t^2/b_t^2)$, the source's reward integrates noise-prediction error over $[-8,8]$:

$$
R_\psi(h,z)=-\frac12\int_{-8}^{8}\mathbb E_\varepsilon
\|\varepsilon-\widehat\varepsilon_\psi(x_\zeta,\zeta,z)\|_2^2\,d\zeta.
$$

_(Eq. 64.26)_

[DERIVED] Constant weighting in log-SNR corresponds to the source's conditional diffusion-likelihood-bound term. Numerical quadrature and finite denoiser error approximate it. For a fixed verbalizer and ideal denoiser, the conditional distribution is identifiable from interior-noise denoising under the source's assumptions; the actual decoder tracks a moving target $p_\phi(h\mid z)\propto p(h)\pi_\phi(z\mid h)$. A higher lower bound need not prove a higher true likelihood when bound slack changes, and neither likelihood nor mutual information guarantees source support or a causal explanation. [R64.8, §4.2, Appendices F, H-I](https://arxiv.org/html/2609.33702v1#S4.SS2).

## Mechanism

### Methodology

[PAPER-REPORTED] The original NLA report inserts a scaled activation into a verbalizer's special input position and generates text. A truncated language-model reconstructor reads that text and projects its final hidden state back into the activation space. It first trains on summary/activation pairs, then alternates current-reconstructor fitting with verbalizer policy updates. The reward step treats reconstructor parameters as fixed; the discrete text channel is not differentiated end-to-end. The report examines reconstruction, paraphrase robustness and contextual confabulation separately. [R64.6, Architecture, Initialization and Training](https://transformer-circuits.pub/2026/nla/index.html).

[CODE-VERIFIED] Static inspection of the NLA repository at commit 0577769b55ad4fdd96d159e983361b97fa4e7331 found the following. The pinned repository's `normalize_activation` uses a float32 norm, clamp $10^{-12}$ and configurable target scale; explicit null disables normalization. Its default scale is $\sqrt d$, and per-coordinate MSE for two such nonzero normalized vectors equals the unit-vector squared distance in Eq. 64.22. `reward.py` defaults to negative MSE and enables negative log MSE with `NLA_LOG_MSE_REWARD=1`, clamping MSE at $10^{-8}$. Thus this inspected August implementation is not assumed to reproduce the May report's reward setting by default. It also distinguishes a normalized-mean baseline from raw variance. [R64.7, `nla/schema.py`, `nla/reward.py`](https://github.com/kitft/natural_language_autoencoders/blob/0577769b55ad4fdd96d159e983361b97fa4e7331/nla/schema.py#L134).

[PAPER-REPORTED] Flow-NLA retains verbalizer initialization and group-relative/KL updates, replacing the reconstructor and reward with conditional denoising. Its denoiser is fitted to generated activation-text pairs, and sampled noise plus numerical integration estimate the reward. The paper reports that an earlier energy-score reward collapsed spread outside leading principal components; covariance diagnostics motivated its likelihood-bound alternative. This is a documented failed variant rather than an assumed universal success of a richer decoder. [R64.8, §4.2, Appendix F](https://arxiv.org/html/2609.33702v1#A6).

```figure
{
  "id": "fig-64.19",
  "kind": "diagram",
  "title": "Activation text is a hypothesis channel",
  "caption": "The round trip measures information retained in text. Source support, original-model interventions and release drift are separate checks, even when reconstruction succeeds.",
  "alt": "Text equivalent: Frozen-model activation and site identity. Activation-conditioned verbalizer. Generated explanation. Point or conditional-flow reconstructor. Reconstruction-based reward. Source-support and intervention checks. Checkpoint and dtype revalidation. Arrows encode the stated dependencies, not measured causal strengths.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.22",
    "DERIVED:eq-64.26"
  ],
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "h",
        "kind": "tensor",
        "label": "Frozen-model activation and site identity"
      },
      {
        "id": "av",
        "kind": "model",
        "label": "Activation-conditioned verbalizer"
      },
      {
        "id": "text",
        "kind": "state",
        "label": "Generated explanation"
      },
      {
        "id": "ar",
        "kind": "model",
        "label": "Point or conditional-flow reconstructor"
      },
      {
        "id": "reward",
        "kind": "objective",
        "label": "Reconstruction-based reward"
      },
      {
        "id": "support",
        "kind": "metric",
        "label": "Source-support and intervention checks"
      },
      {
        "id": "drift",
        "kind": "boundary",
        "label": "Checkpoint and dtype revalidation"
      }
    ],
    "edges": [
      {
        "from": "h",
        "to": "av",
        "label": "condition"
      },
      {
        "from": "av",
        "to": "text",
        "label": "sample"
      },
      {
        "from": "text",
        "to": "ar",
        "label": "read"
      },
      {
        "from": "h",
        "to": "reward",
        "label": "target"
      },
      {
        "from": "ar",
        "to": "reward",
        "label": "predict"
      },
      {
        "from": "reward",
        "to": "av",
        "label": "policy update"
      },
      {
        "from": "text",
        "to": "support",
        "label": "independent test"
      },
      {
        "from": "drift",
        "to": "support",
        "label": "new regime"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 64.6 - Audit an interpretation before applying a modification.** [DERIVED] Inputs are a versioned interpretation, a finite modification grid $\mathcal G$, discovery/validation/final-test populations, benign-task budgets and a measurement-regime identity. Output is an accepted bounded modification, no feasible choice or an invalid measurement.

$$
\begin{aligned}
1.&\quad r\leftarrow(\mathrm{checkpoint,tokenizer,site,dtype,dictionary,population});\\
2.&\quad \operatorname{ControlsPass}(r)=0\Rightarrow\operatorname{return}(\mathrm{invalid});\\
3.&\quad \mathcal G_*\leftarrow\{g\in\mathcal G:
 \widehat B_{j,\mathrm{val}}(g)+u_j\le\epsilon_j\ \forall j,\ K(g)\le K_*\};\\
4.&\quad \mathcal G_*=\varnothing\Rightarrow\operatorname{return}(\mathrm{no\ feasible\ modification});\\
5.&\quad g_*\leftarrow\arg\max_{g\in\mathcal G_*}\widehat T_{\mathrm{val}}(g);
 \quad\operatorname{freeze}(g_*);\\
6.&\quad \operatorname{return}(g_*,\mathrm{final\ held\text{-}out\ target/benign\ tests},r);\\
7.&\quad r'\ne r\Rightarrow\mathrm{reopen\ measurement\ and\ intervention\ validation}.
\end{aligned}
$$

[DERIVED] Here $u_j$ is a predeclared uncertainty allowance, not an invented confidence certificate. Validation chooses a candidate; final testing must still reject it if any acceptance condition fails. Runtime is $O(|\mathcal G|n_{\mathrm{val}})$ model interventions plus final tests and discovery cost. An NLA-based pipeline additionally pays target activation extraction, autoregressive verbalization, reconstructor/reward execution and training synchronization. Flow reward multiplies decoder work by sampled noise levels and draws; serving one explanation and training the explainer are different cost boundaries. The protocol never uses a label alone to authorize a change.

## Implementation

[CODE-VERIFIED] Static inspection of the NLA repository at commit 0577769b55ad4fdd96d159e983361b97fa4e7331 found the following. The NLA README/configuration identifies FSDP2 and Megatron backends for training and SGLang for rollout, with custom activation-embedding and reward plumbing. PyTorch is the autograd framework, PyTorch FSDP2 and NVIDIA Megatron-Core are distributed-execution layers, and SGLang is the inference/rollout layer. These names do not establish that stock unpatched versions interoperate. In `reward.py`, every critic rank participates in the sharded forward; pending asynchronous samples are batched with a configured flush timeout, and failures are propagated to unresolved futures. Ignoring one rank or orphaning a reward future can deadlock a training step. This is static source inspection only. [R64.7, README, `configs/rl.sh`, `nla/reward.py`](https://github.com/kitft/natural_language_autoencoders/tree/0577769b55ad4fdd96d159e983361b97fa4e7331).

[DERIVED] Activation data and explanations may retain source-sensitive information. Minimize stored content, keep access/provenance controls and separate scientific analysis from deployment authorization. Fixed hook names, normalization, checkpoint and numerical kernels are part of a measurement instrument. Reusing an old dictionary after quantization is a new transfer experiment, not an automatic continuation of the old feature identity.

## Experimental design

### Reported experiments

[PAPER-REPORTED] Flow-NLA studies Qwen2.5-7B-Instruct, Gemma-3-12B and Apertus-v1.5-8B with separate reported model revision prefixes and hidden-state sites. Training draws FineWeb documents of at least 128 tokens, truncates at 1,024 and samples ten positions/document; document partitions are 25% verbalizer initialization, 25% reconstructor initialization and 50% online training. Runs use eight GH200 GPUs. The source's code/data release is promised upon acceptance, so the full executable environment remains UNVERIFIED. [R64.8, Appendices B.1, E](https://arxiv.org/html/2609.33702v1#A2.SS1).

[PAPER-REPORTED] Evaluation uses DeepSeek V4.1 Flash with thinking disabled and temperature zero. Utility judges see explanation plus task question; contextual-support judges additionally see the source, while writing judges inspect the explanation. The suites contain 1,344 classification examples across twelve equally weighted tasks, 500 ten-way continuation choices, 248 response-behavior examples and 658 hard-negative pairs. Generation/parse exclusions and checkpoint selection affect the denominator; the paper's intervals are pointwise bootstrap intervals, not simultaneous guarantees. Automated support judgments measure context support, not privileged truth about the model's internal computation. [R64.8, Appendices B.2, D, G](https://arxiv.org/html/2609.33702v1#A2.SS2).

[PAPER-REPORTED] A separate quantization study freezes an SAE readout while applying per-output-channel round-to-nearest weight quantization and floating dequantization to Pythia-70M and Gemma-2-2B. It uses matched token-position feature correlations, not retrained dictionaries or packed low-bit kernel timings. Gemma's INT6 sliding-window perplexity changes from 46.39 to 44.79 while only 51.30% of its eligible frozen features exceed correlation 0.9. This is a workload-specific disagreement between behavioral and feature measurements; exact readout sites, active-feature threshold and chunk/sliding-window settings remain in the reference note. [R64.9, §§3-4, Table 3](https://arxiv.org/html/2606.03002v2#S4).

## Observations

**What the paper claims.** [PAPER-REPORTED] Flow-NLA's Qwen table reports assertion risk 83.7% for its point-reconstruction rerun versus 71.9% for Flow-NLA, but response-behavior macro-F1 74.9% versus 72.9%; improvement is not uniform across every utility axis. The paper explicitly notes automated-evaluator and provider/inference differences that limit attributing every gap solely to the reward. [R64.8, Table 2, §5](https://arxiv.org/html/2609.33702v1#A1.T2).

**What the evidence shows.** [DERIVED] Eq.64.24 proves a mean-only obstruction even with nonzero unit activations; the Qwen source comparison retains a behavior-utility regression while lowering assertion risk. Positive-affine correlation invariance further shows that a stable feature correlation need not preserve intervention magnitude. These are distinct limitations, not one aggregate quality score.

**What we infer.** [DERIVED] Richer reconstruction feedback addresses a real conditional-mean obstruction, but contextual support and mechanistic fidelity still require independent tests. The quantization result motivates revalidating a frozen interpretation after numerical changes; it does not prove that the original semantics or causal mechanism were destroyed. [DERIVED] Use generated activation text to prioritize hypotheses when it adds useful, independently checked information at acceptable cost. Prefer a simpler readout if the text adds confabulation without decision value. Withhold or roll back a modification when unrelated-task harm, measurement drift or failed causal controls exceed the predeclared budget. Reopen the instrument whenever its regime identity changes.

**What remains unknown.** [UNVERIFIED] Neither new NLA training nor low-bit kernel execution was performed here. Cross-release feature identity, human-validated mechanistic truth of explanations, and broad safety-monitor transfer are not established by the inspected studies. The May report and September reruns use distinct evaluators/configurations and should not be called identical replications.

## Failure modes

[MATHEMATICALLY-DERIVED] Pearson correlation is invariant under positive scaling and constant offset of a nonconstant feature trace. Thus perfect correlation can coexist with changed intervention magnitudes or threshold crossings. Undefined zero-variance features require an explicit count. Conversely, low frozen-basis correlation can reflect a harmless coordinate change rather than lost semantics. A drift test should combine paired behavior, representation alignment, selectivity and finite interventions instead of treating one threshold as an ontology test.

[DERIVED] NLA reward can favor text useful to a decoder without supporting every claim; a judge with different information access can test a different property. Normalization can erase magnitude-bearing signals. The reconstructor's moving conditional distribution can make rewards stale, and a finite log-SNR band is not an exact full-distribution likelihood. Prompt-family leakage makes apparent mechanistic generalization optimistic. Monitoring only successful parsed explanations hides failed generations and operational cost.

## Siblings

```figure
{
  "id": "fig-64.20",
  "kind": "compare",
  "title": "Application evidence has separate acceptance axes",
  "caption": "Behavior, round-trip information, source support and causal fidelity can disagree. Select the instrument for the decision and retain the remaining uncertainty.",
  "alt": "Text equivalent: Behavior, round-trip information, source support and causal fidelity can disagree. Select the instrument for the decision and retain the remaining uncertainty.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.21",
    "DERIVED:eq-64.22",
    "DERIVED:eq-64.26"
  ],
  "spec": {
    "axis": "Application evidence has separate acceptance axes",
    "columns": [
      {
        "id": "readout",
        "label": "Probe or NLA readout"
      },
      {
        "id": "circuit",
        "label": "Intervention-tested circuit"
      },
      {
        "id": "monitor",
        "label": "Deployed monitor"
      }
    ],
    "rows": [
      {
        "dimension": "Acceptance target",
        "values": {
          "readout": "Useful held-out information",
          "circuit": "Predicted finite effects under controls",
          "monitor": "Risk/latency under operational population"
        }
      },
      {
        "dimension": "Main unresolved boundary",
        "values": {
          "readout": "Truth and causal use of decoded text",
          "circuit": "Untested interventions and omitted mechanisms",
          "monitor": "Drift, adversaries and authorization"
        }
      },
      {
        "dimension": "Reopen when",
        "values": {
          "readout": "Judge access or decoder setting changes",
          "circuit": "Checkpoint, donor or dictionary changes",
          "monitor": "Input distribution or release regime changes"
        }
      }
    ]
  },
  "placement": "rail",
  "anchor": "siblings"
}
```

[DERIVED] Direct behavioral regression tests can be stronger evidence for a release decision than an unvalidated internal monitor. Mechanistic analysis adds value when it predicts failures or interventions that those cheaper tests miss. The decision criterion is incremental, held-out explanatory and operational value under the same budget, not the apparent intimacy of internal access.

## Extensions

### Improvements

[PAPER-REPORTED] Flow-NLA's September contribution replaces a point decoder with a conditional denoising objective and likelihood-bound reward, preserving the basic activation-to-text channel. Its reported covariance diagnostic rejects an earlier energy-score variant. It remains a distributional readout, not a newly validated circuit-tracing method. The quantization study supplies a measurement-transfer warning rather than a universally superior compression choice. [R64.8, §§4-5; R64.9, §4](https://arxiv.org/html/2609.33702v1#S4).

## Limitations

[DERIVED] No inspected method supports an unrestricted conclusion that an explanation is complete, truthful, stable across releases or sufficient for safety. The chapter establishes conditional mechanisms, source-reported tests and explicit counterexamples. Its stopping boundary is a finite claim with an evidence ledger; untested distributional or adversarial coverage remains open. Chapters 65-66 carry the threat-model and release-closure obligations.

## Reproducibility

[DERIVED] Preserve target/model/tokenizer/site revisions, activation normalization, explainer/reconstructor checkpoints, reward mode, KL/update estimator, rollout/provider settings, judge prompts/information, failed/parsed denominators, uncertainty unit and full extraction/training/inference cost. The [verification](verification.md) records proposed transfer experiments and pure analytical fixtures. No source report is presented as a book-executed replication.

## References

[R64.6] May 7 NLA report. [R64.7] Pinned NLA repository. [R64.8] Flow-NLA, §§3-5 and Appendices A-B, D-I. [R64.9] Quantization/SAE study v2. Full records and source limitations: [references](references.md).
