---
id: "ms.section.33.2"
entity_type: "section"
title: "Reference-policy effects"
short_title: "Reference-policy effects"
volume: 2
part: 6
chapter: 33
section: 33.2
slug: "33-2-reference-policy-effects"
parent: "ms.chapter.33"
prev_sibling: "ms.section.33.1"
next_sibling: "ms.section.33.3"
children: []
prerequisites: ["ms.chapter.2", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32"]
downstream: ["ms.chapter.34", "ms.chapter.35", "ms.chapter.36"]
related: []
relations: []
axes: {"lifecycle": ["post_training"], "mechanism": ["preference_optimization", "offline_optimization"], "feedback_setting": ["human_preference", "ai_feedback", "verifiable_reward"], "modality": ["text", "image"]}
papers: []
implementations: ["impl.hugging-face-trl"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2000
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 33.2 — Reference-policy effects

## Scope

[DERIVED] Establish the probability, tokenization and numerical contract for reference-relative training. The baseline is an immutable instruction-tuned reference and completion-only sequence sums. Success requires finite, comparable scores for exactly the same token events, stable gradients and a cache that cannot silently refer to another measure. This section owns reference choice, beta conventions, support mismatch and log-probability computation. It does not select a universally optimal reference checkpoint.

## Why this exists

[DERIVED] The reference does more than consume memory. It defines which policy changes count as improvement in relative score and which responses are admissible under finite KL. Two references can assign different relative mass to the same candidates; the identical trained policy then has different preference margins. A cache hides the computation but cannot remove that dependence. Treating the reference as an interchangeable implementation detail changes the objective while preserving its name.

[DERIVED] A second bottleneck is semantic parity between scoring paths. A policy may score a completion including its end-of-turn token while its reference cache omits that token. A chat template can insert an extra assistant prefix. A truncation rule can cut a response before its answer. These discrepancies alter the event whose probability is being compared. Stable scalar arithmetic cannot repair a mismatch in the event definition.

## Intuition

[MATHEMATICALLY-DERIVED] The direct margin compares changes in odds relative to the reference. It asks whether the chosen/rejected probability ratio has increased from the reference ratio. A high absolute chosen likelihood can still produce a negative relative margin if the reference favored that choice more strongly. Beta scales this relative logit in the fitting loss, while in the variational derivation it penalizes departure from the reference; these descriptions are consistent only under fixed reward units and the model assumptions of §33.1.

## Formulation

| Symbol | Meaning | Shape or unit |
|---|---|---|
| $u_{it}$ | Target token id after causal shift | $[2B,T-1]$ integers |
| $m_{it}$ | Valid completion-token indicator | $[2B,T-1]$ binary |
| $z^\pi_{itv},z^q_{itv}$ | Policy/reference vocabulary logits | $[2B,T-1,V]$ |
| $n_i=\sum_tm_{it}>0$ | Scored response length | Tokens |
| $l_i,h_i$ | Masked sequence log probabilities | Nats |
| $c_q$ | Reference content identity | Digest |

[MATHEMATICALLY-DERIVED] For finite logits, score the token event by

$$
l_i=\sum_t m_{it}\left[z^\pi_{it,u_{it}}-\operatorname{LSE}_{v}z^\pi_{itv}\right],\qquad
h_i=\sum_t m_{it}\left[z^q_{it,u_{it}}-\operatorname{LSE}_{v}z^q_{itv}\right].
$$
*(Eq. 33.6)*

where $\operatorname{LSE}(z)=a+\log\sum_v e^{z_v-a}$ with $a=\max_vz_v$. Prompt tokens still condition every completion token, but do not contribute to a completion-only sum.

[MATHEMATICALLY-DERIVED] Let $o_\theta=\log\pi_\theta(y^+\mid x)-\log\pi_\theta(y^-\mid x)$ and $o_q=\log q(y^+\mid x)-\log q(y^-\mid x)$. Then

$$
\Delta_\theta=o_\theta-o_q,\qquad
\Delta_{q'}-\Delta_q=\log\frac{q(y^+\mid x)}{q(y^-\mid x)}-\log\frac{q'(y^+\mid x)}{q'(y^-\mid x)}.
$$
*(Eq. 33.7)*

This identity isolates reference sensitivity while holding policy, pair and token event fixed. Changing both reference and initialization does not isolate this effect experimentally.

```figure
{
  "id": "fig-33.7",
  "kind": "calculator",
  "title": "Reference odds shift the same policy margin",
  "caption": "Analytical same-pair sensitivity. Positive masses are restricted away from zero; chosen and rejected are the only two actions in this calculator.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.7",
  "alt": "Analytical same-pair sensitivity. Positive masses are restricted away from zero; chosen and rejected are the only two actions in this calculator.",
  "spec": {
    "tex": "\\Delta=\\log\\frac{p}{1-p}-\\log\\frac{q}{1-q}",
    "equation": "33.7",
    "inputs": [
      {
        "symbol": "p",
        "label": "Policy chosen mass",
        "default": 0.6,
        "min": 0.1,
        "max": 0.9,
        "step": 0.1,
        "format": "raw"
      },
      {
        "symbol": "q",
        "label": "Reference chosen mass",
        "default": 0.4,
        "min": 0.1,
        "max": 0.9,
        "step": 0.1,
        "format": "raw"
      },
      {
        "symbol": "b",
        "label": "Beta coefficient",
        "default": 1,
        "min": 0.1,
        "max": 2,
        "step": 0.1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "d",
        "label": "Reference-relative margin",
        "formula": "ln(p/(1-p))-ln(q/(1-q))",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "s",
        "label": "Predicted comparison probability",
        "formula": "1/(1+exp(-b*(ln(p/(1-p))-ln(q/(1-q)))))",
        "format": "raw",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Same reference and policy",
      "variables": {
        "p": 0.6,
        "q": 0.6
      }
    },
    {
      "anchor": "mechanism",
      "label": "Different reference odds",
      "variables": {
        "p": 0.6,
        "q": 0.4
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Reference favors chosen more",
      "variables": {
        "p": 0.6,
        "q": 0.8
      }
    }
  ]
}
```

```figure
{
  "id": "fig-33.8",
  "kind": "diagram",
  "title": "The same scored event through two paths",
  "caption": "One token contract feeds policy and reference scoring. Immutable identity binds cache rows to that exact contract.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.6",
  "alt": "One token contract feeds policy and reference scoring. Immutable identity binds cache rows to that exact contract.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "text",
        "kind": "dataset",
        "label": "Prompt and response bytes"
      },
      {
        "id": "tok",
        "kind": "process",
        "label": "Pinned chat tokenization"
      },
      {
        "id": "mask",
        "kind": "tensor",
        "label": "Shift and completion mask"
      },
      {
        "id": "policy",
        "kind": "process",
        "label": "Trainable log probabilities"
      },
      {
        "id": "ref",
        "kind": "process",
        "label": "Frozen log probabilities"
      },
      {
        "id": "cache",
        "kind": "memory",
        "label": "Identity-bound cache"
      },
      {
        "id": "diff",
        "kind": "objective",
        "label": "Reference-relative margin"
      }
    ],
    "edges": [
      {
        "from": "text",
        "to": "tok"
      },
      {
        "from": "tok",
        "to": "mask"
      },
      {
        "from": "mask",
        "to": "policy"
      },
      {
        "from": "mask",
        "to": "ref"
      },
      {
        "from": "ref",
        "to": "cache"
      },
      {
        "from": "cache",
        "to": "diff"
      },
      {
        "from": "policy",
        "to": "diff"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Reference selection begins by declaring its purpose. A copy of the instruction-tuned initialization makes every initial log ratio zero under identical evaluation mode. A stronger external reference changes the anchor and may require another tokenizer-compatible model and more memory. An older policy snapshot anchors an iterative round. These are different experimental interventions. A candidate can share architecture with the reference without sharing token probabilities, templates or vocabulary mapping.

[MATHEMATICALLY-DERIVED] Under fixed utility gap $d$, the two-action optimum has log odds $\log(q_a/q_b)+d/\beta$. Increasing beta decreases the optimal departure from reference odds. In the empirical loss, however, the derivative at zero margin has magnitude $\beta/2$. A larger beta can initially increase parameter-space update magnitude at fixed learning rate while implying a smaller variational optimum displacement. These are different statements about different objects. A beta sweep must therefore report the optimizer and stopping rule, rather than treating beta as an isolated trust-region radius.

[MATHEMATICALLY-DERIVED] If $q(y\mid x)=0$ and $\pi(y\mid x)>0$, the forward KL is infinite. A finite-logit unconstrained softmax has positive token probabilities, but hard decoding masks, vocabulary differences, underflowed stored probabilities and explicit support restrictions can introduce zeros. Scoring logits with log-softmax avoids manufacturing zeros by exponentiating tiny values; it cannot recover an event a hard mask has forbidden. Replacing zero by epsilon defines a smoothed reference and must be recorded as an objective change.

[DERIVED] Tokenization is a joint boundary decision. Tokenizing prompt and completion independently can differ from tokenizing their concatenation near the boundary. Resolve the actual complete chat sequence, identify the assistant suffix, and verify that policy and reference see identical ids and attention context. The first completion token is predicted from the final prompt position; the logit and target shift must reflect that. Padding contributes neither response length nor log probability. End-of-turn, EOS and multiple assistant turns require explicit conventions rather than assumptions based on visible text.

[MATHEMATICALLY-DERIVED] For the binary loss use stable softplus:

$$
\ell(z)=\max(0,-z)+\log(1+e^{-|z|}),\qquad z=\beta\Delta_\theta,\qquad
\frac{d\ell}{dz}=-\sigma(-z).
$$
*(Eq. 33.8)*

The exponential argument is nonpositive, avoiding overflow for large finite logits. Computing $-\log\sigma(z)$ through a rounded sigmoid can instead produce infinite loss or zero gradients. Accumulate long sequence sums in sufficient precision; compare policy/reference paths under the same reduction policy. Finite token log probabilities can still overflow an inadequate accumulator over very long sequences.

[MATHEMATICALLY-DERIVED] Length normalization is a new score, not an algebraic rearrangement:

$$
\Delta_{\mathrm{sum}}=(l^+-h^+)-(l^--h^-),\qquad
\Delta_{\mathrm{mean}}=\frac{l^+-h^+}{n^+}-\frac{l^--h^-}{n^-}.
$$
*(Eq. 33.9)*

There is a common scalar conversion only when both lengths share the same fixed value. If one candidate has twice the tokens, dividing by each candidate's length changes their relative weighting. The average log probability exponentiates to a geometric mean token probability; it is generally not a normalized distribution over complete responses. Consequently its penalty coefficient cannot automatically inherit the sequence-level KL interpretation.

[DERIVED] Reference caching binds a row to reference revision, tokenizer files, chat template, response text, token ids, completion masks, EOS rule, truncation policy, scoring dtype and any length-dependent weighting. A cache index based only on visible text omits consequential dependencies. Use content identities and reject mismatches. If the reference changes between iterative rounds, either regenerate affected rows or retain the old anchor explicitly; mixing row generations creates a dataset with pair-specific references.

```figure
{
  "id": "fig-33.9",
  "kind": "chart",
  "title": "Stable loss and its derivative magnitude",
  "caption": "Closed-form response loss and derivative magnitude at beta1. Extreme positive margins saturate the label fit; this is not evidence of task improvement.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.8",
  "alt": "Closed-form response loss and derivative magnitude at beta1. Extreme positive margins saturate the label fit; this is not evidence of task improvement.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Comparison logit",
      "domain": [
        -12,
        12
      ]
    },
    "y": {
      "label": "Loss or derivative magnitude"
    },
    "variables": {},
    "series": [
      {
        "id": "loss",
        "label": "Stable binary loss",
        "formula": "max(0,-x)+ln(1+exp(-abs(x)))",
        "sample": {
          "from": -12,
          "to": 12,
          "count": 33
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "gradient",
        "label": "Absolute logit derivative",
        "formula": "1/(1+exp(x))",
        "sample": {
          "from": -12,
          "to": 12,
          "count": 33
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0,
        "y": 0.5,
        "label": "Logit derivative magnitude1/2"
      },
      {
        "x": 0,
        "y": 0.6931471805599453,
        "label": "Binary loss ln2"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-33.10",
  "kind": "compare",
  "title": "Sequence sums and response means",
  "caption": "This comparison concerns the mathematical event and reduction. Equal coefficient names do not make these conventions interchangeable.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.9",
  "alt": "This comparison concerns the mathematical event and reduction. Equal coefficient names do not make these conventions interchangeable.",
  "spec": {
    "axis": "Scoring contract",
    "columns": [
      {
        "id": "sum",
        "label": "Sequence sum"
      },
      {
        "id": "mean",
        "label": "Response mean"
      }
    ],
    "rows": [
      {
        "dimension": "Units",
        "values": {
          "sum": "Nats per complete response",
          "mean": "Nats per scored token"
        }
      },
      {
        "dimension": "Length factor",
        "values": {
          "sum": "Every token contributes",
          "mean": "Each response divided by its own count"
        }
      },
      {
        "dimension": "Probability meaning",
        "values": {
          "sum": "Conditional sequence log probability",
          "mean": "Log geometric mean token probability"
        }
      },
      {
        "dimension": "Common rescaling",
        "values": {
          "sum": "Only for shared fixed length",
          "mean": "Variable lengths change the objective"
        }
      }
    ]
  }
}
```

## Algorithm

### Algorithm 33.2 — Identity-bound paired scoring

[DERIVED] Inputs are a finite batch, pinned tokenizer/template, policy and immutable reference, cache manifest and declared maximum length. Output is four finite sequence scores and lengths, or a rejected-row ledger. State contains cache identity and finite cursor. Define the immutable per-row key $\rho_i=h(U_i,\mathrm{attention}_i,M_i)$ over the full rendered ids, conditioning context and scoring mask; a reused dataset row number is never a cache key. The following procedure makes rejection explicit rather than silently clipping incompatible scores.

$$
\begin{aligned}
1.&\quad c\leftarrow h(q,\mathrm{tokenizer},\mathrm{template},\mathrm{mask},\mathrm{EOS},\mathrm{truncation},\mathrm{precision}).\\
2.&\quad U,M\leftarrow\operatorname{joint\_tokenize\_and\_shift}(D);\quad n_i\leftarrow\sum_tM_{it}.\\
3.&\quad n_i=0\ \lor\ \operatorname{support\_invalid}(U_i)\ \Longrightarrow\ \operatorname{reject}(\rho_i),\operatorname{continue\_next\_row};\quad\text{never score rejected rows}.\\
4.&\quad l_i\leftarrow\sum_tM_{it}\operatorname{logsoftmax}(z^\pi_{it})_{U_{it}}.\\
5.&\quad \operatorname{cache\_match}(\rho_i,c)\ ?\ h_i\leftarrow\mathrm{cache}[\rho_i,c]\ :\ h_i\leftarrow\operatorname{score}(q,U_i,M_i).\\
6.&\quad \neg\operatorname{finite}(l_i,h_i)\ \Longrightarrow\ \operatorname{reject\_batch}(\mathrm{identity}).\\
7.&\quad \operatorname{return}\left((l_i^+-h_i^+)-(l_i^--h_i^-),n_i^+,n_i^-,c\right).
\end{aligned}
$$
*(Eq. 33.10)*

[DERIVED] The invariant is identical ids, masks and conditioning contexts across the two scoring paths. The finite batch terminates after one scoring attempt or a recorded failure; retries require an outer bounded policy. Additional scalar reduction costs $O(BT)$ and cache storage $O(N)$ sequence scores plus identities, or $O(NT)$ if token-level reuse is required. A frozen reference needs no backward activations, but its forward kernels, weight residency and communication still consume resources. Cached sums cannot reconstruct arbitrary later token reweighting.

## Implementation

[OFFICIAL-DOCUMENTATION] Hugging Face TRL, **Post-training / RL**, v1.13.0 shifts labels and completion masks, masks token log probabilities, and sums them for reference scores. IPO subsequently divides each branch's score by its completion count [R33.6, `compute_ref_log_probs`, IPO branch]. Adapter-disabled reference execution is also version-specific.

[DERIVED] Disabling a trainable adapter recovers a frozen reference only if every shared base parameter remains frozen and the reference adapter/state is immutable. Dropout mode, quantization state and stochastic kernels can break deterministic cache agreement. Inspect actual parameter ownership instead of inferring it from an adapter name. A reference forward in no-grad mode suppresses gradients; it does not freeze parameters against other optimizer groups.

[DERIVED] Dense model computation dominates scalar loss arithmetic. Record trainable and resident parameter counts separately, response/prompt lengths, padding fraction, reference cache build time, GPU/host cache bytes, vocabulary projection strategy and data-parallel communication. Full-reference sharding can require additional weight gathers. Comparing cached DPO with uncached reference-free training without charging cache construction measures a different resource boundary. Energy and monetary costs remain UNVERIFIED unless their component measurements and prices are retained.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] R33.5–R33.6 are release and code evidence, with no matched reference-cache performance experiment. They establish an inspected implementation convention only.

| Protocol field | Inspected boundary |
|---|---|
| Artifact | TRL v1.13.0, release2026-09-10, commit3d9261f |
| Paths | `compute_ref_log_probs`; `_compute_loss`; IPO branch |
| Workload / hardware / seeds | Not a published experiment in these artifacts |
| Quantitative cache speedup | NOT-DISCLOSED; no number claimed |

[DERIVED] A source release is not evidence that the installed project uses the same kernels or that an adapter configuration realizes the intended reference. Proposed parity and cache-mutation checks remain in verification.md.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The tagged implementation exposes multiple score/loss conventions [R33.6]. No scientific paper result is inferred from that interface.

**What the evidence shows.** [DERIVED] The inspected path differentiates sequence sums, count-normalized IPO and reference execution. These are consequential contract choices rather than equivalent spellings.

**What we infer.** [MATHEMATICALLY-DERIVED] Eqs. 33.7–9 explain how reference odds, beta and token counts alter the comparison logit even for unchanged visible responses.

**What remains unknown.** [UNVERIFIED] Installed-kernel parity, cache invalidation behavior and full device cost have not been executed for this edition.

```figure
{
  "id": "fig-33.11",
  "kind": "matrix",
  "title": "Cache dependency closure",
  "caption": "Each row is a cache dependency: reference, tokenization, mask and reduction. A changed dependency requires a new scoring identity; filled cells represent that logical requirement.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.10",
  "alt": "Each row is a cache dependency: reference, tokenization, mask and reduction. A changed dependency requires a new scoring identity; filled cells represent that logical requirement.",
  "spec": {
    "rows": 4,
    "cols": 4,
    "pattern": "explicit",
    "cells": [
      [
        1,
        0,
        0,
        0
      ],
      [
        1,
        1,
        0,
        0
      ],
      [
        1,
        1,
        1,
        0
      ],
      [
        1,
        1,
        1,
        1
      ]
    ],
    "rowLabel": "Reference / tokens / mask / reduction",
    "colLabel": "Identity dependency",
    "legend": "Filled = required; empty = not sufficient alone."
  }
}
```

## Failure modes

> **Failure mode — Template drift.** [DERIVED] *Symptom:* cache and fresh reference scores disagree on unchanged text. *Cause:* token boundary, assistant prefix or terminator changed. *Detection:* compare token ids and masks before scalar scores. *Mitigation:* bind cache identity to complete preprocessing artifacts.

> **Failure mode — Mixed references.** [DERIVED] *Symptom:* repeated pair identities receive incompatible anchor odds. *Cause:* partial cache refresh after a reference update. *Detection:* per-row reference digest. *Mitigation:* invalidate atomically or define and disclose the heterogeneous-anchor objective.

[DERIVED] Empty completions, NaNs in masked positions, hard-zero support and unequal distributed denominators need explicit rejection or repair policies. Multiplying NaN by a zero mask does not generally produce zero; set or select invalid positions before reduction. A mean over workers with different valid-pair counts changes the objective weighting.

## Siblings

[DERIVED] Reference-free odds and mean-log-probability methods in [§33.3](33-3-objective-families.md) remove one frozen-model dependency while changing the score. A moving reference in [§33.4](33-4-offline-versus-online-data.md) changes the anchor between rounds. Neither operation is a pure memory optimization of the fixed-reference objective.

## Extensions

### Improvements

[DERIVED] The tagged release includes fused execution and optional loss conventions; this section claims no isolated speed or quality gain for them. The useful documented change is a concrete current implementation surface against which scoring contracts can be inspected. A kernel substitution needs equality of masks, reductions and gradients within a declared numerical policy before its performance is comparable.

## Limitations

[DERIVED] Stable arithmetic establishes finite computation under finite inputs; it does not establish support coverage, correct labels or a useful reference. Cache consistency cannot validate annotation quality. Sequence truncation changes the represented event; treating a truncated suffix as a complete response requires an explicit revised objective and evaluation boundary.

## Reproducibility

[DERIVED] Retain raw strings, canonical ids, shifted target ids, attention/completion masks, lengths, reference digest, cached values, fresh parity samples, preprocessing revision and loss coefficient convention. Source inspection is pinned to2026-10-09; no installed compatibility is asserted. Record whether reference storage is a full model, frozen adapter, recomputed base or precomputed cache.

```figure
{
  "id": "fig-33.12",
  "kind": "tensor-flow",
  "title": "Reference scores reduce from tokens to one pair margin",
  "caption": "Eq.33.10 shape contract for padded response-token sums. Selected-token log probabilities reduce to two sequence scores, subtract the matched frozen-reference scores and form one pair margin. Per-response means are a different declared objective.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-33.10",
  "alt": "For B pairs,2 responses,T padded positions and vocabularyV, logits[B,2,T,V] gather to log probabilities[B,2,T], masked sums[B,2], reference-relative scores[B,2], pair margins[B] and one reduced loss. The dense workspace is not the size of a cached pair score.",
  "spec": {
    "dims": {
      "B": "comparison pairs",
      "T": "padded response positions",
      "V": "vocabulary"
    },
    "steps": [
      {
        "shape": "[B, 2, T, V]",
        "label": "Scoring logits"
      },
      {
        "shape": "[B, 2, T]",
        "label": "Selected log probabilities",
        "op": "Gather target events"
      },
      {
        "shape": "[B, 2]",
        "label": "Sequence scores",
        "op": "Masked response-token sum"
      },
      {
        "shape": "[B, 2]",
        "label": "Relative scores",
        "op": "Subtract matched reference scores"
      },
      {
        "shape": "[B]",
        "label": "Comparison margins",
        "op": "Chosen minus rejected"
      },
      {
        "shape": "[1]",
        "label": "Reduced objective",
        "op": "Stable loss and declared batch reduction"
      }
    ]
  },
  "anchor": "reproducibility"
}
```

## References

[R33.5](references.md#r335), [R33.6](references.md#r336). Mathematical sensitivity and stability results are derived locally under their stated finite-input conditions.
