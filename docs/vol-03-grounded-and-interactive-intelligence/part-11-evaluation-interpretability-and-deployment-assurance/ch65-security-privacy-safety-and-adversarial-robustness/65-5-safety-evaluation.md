---
id: ms.section.65.5
entity_type: section
title: "Safety evaluation"
volume: 3
part: 11
chapter: 65
section: 65.5
slug: 65-5-safety-evaluation
parent: ms.chapter.65
prev_sibling: ms.section.65.4
next_sibling: ms.section.65.6
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.24, ms.chapter.32, ms.chapter.33, ms.chapter.34, ms.chapter.35, ms.chapter.36, ms.chapter.46, ms.chapter.47, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64]
downstream: [ms.chapter.66]
related: [ms.chapter.30, ms.chapter.42, ms.chapter.48]
relations: []
axes: {lifecycle: [pretraining, post_training, inference, evaluation, assurance], mechanism: [security_boundary, privacy_accounting, adversarial_evaluation], feedback_setting: [], modality: [text, code, image, tool_trajectory]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 65.5 - Safety evaluation

## Scope

[DERIVED] Safety evaluation measures harmful capability/behavior, legitimate-task degradation, false refusals, adversarial robustness and human oversight. The deployment policy defines the boundary; the evaluator estimates behavior relative to it. Policy legitimacy, factual harm and scorer agreement are separate questions.

## Why this exists

[DERIVED] A model can improve harmful-request refusal while becoming unusable on benign requests. A monitor can agree with its teacher while sharing the teacher's blind spots. A high recall at1%false positives can still produce mostly false alarms when the target event is rare. Evaluation must retain both sides of the boundary and its operational base rate.

## Intuition

[DERIVED] Consider two benign requests and two harmful requests with nearly identical surface language. A useful safety system responds to intent and authorization, rather than refusing every occurrence of a sensitive topic or obeying every benign-looking wrapper. Testing only harmful examples rewards indiscriminate refusal.

## Formulation

[MATHEMATICALLY-DERIVED] For event prevalence pi, true-positive rate t and false-positive rate f,

$$
 PPV=\frac{t\pi}{t\pi+f(1-\pi)},\qquad
 E[false\ alerts]=Nf(1-\pi).
$$
*(Eq. 65.17)*

[DERIVED] These equations require a common deployment population and fixed detector/threshold. At t=.8,f=.01,pi=.001, precision is about7.4%, despite high recall. If t*pi+f*(1-pi)=0 there are no positive predictions and PPV is undefined. Adaptive selection, unknown prevalence and delayed labels require sensitivity analysis rather than a single calibrated number.

[MATHEMATICALLY-DERIVED] Distinguish harmful compliance, benign false refusal and useful completion:

$$
 H=\Pr[violation\mid x\in\mathcal H],\quad
 F=\Pr[refusal\mid x\in\mathcal B],\quad
 U=\Pr[authorized\ task\ completed\mid x\in\mathcal B].
$$
*(Eq. 65.18)*

[DERIVED] H is not always1 minus refusal: a non-refusal can be harmless, and a refusal can contain prohibited information. U is not necessarily1-F because an answer can be incorrect, incomplete or unauthorized. Define partial compliance, abstention and uncertain judgments explicitly.

[MATHEMATICALLY-DERIVED] WIFA's anchored group-consistency construction uses a first-response-position logit contrast s_k, after teacher-forced intent analysis:

$$
 s_k=\max_{v\in\mathcal R}z_{k,v}-\max_{v\in\mathcal C}z_{k,v},\quad
 \bar s=K^{-1}\sum_k s_k,\quad
 L_{grp}=K^{-1}\sum_k(s_k-\bar s)^2+
 \gamma\begin{cases}[m-\bar s]_+,&harmful,\\ {}[m+\bar s]_+,&benign,\end{cases}\quad
 L=L_{SFT}+\lambda L_{grp}.
$$
*(Eq. 65.19)*

[DERIVED] R/C are tokenizer-specific refusal/comply token sets, z logits, m nonnegative margin, and lambda/gamma weights. This is a training surrogate, not an inference-time calibrated harm classifier. The variance term alone permits equally wrong scores; directional anchors separate harmful/benign groups. Teacher-forced canonical intent is available during training, not an oracle supplied at deployment [R65.7, Section 3.3; Appendix B.3].

[MATHEMATICALLY-DERIVED] One possible declared release criterion is

$$
 \max_g H_g\le h_0,\qquad \sum_g w_gF_g\le f_0,\qquad
 \sum_g w_gU_g\ge u_0,\qquad w_g\ge0,\ \sum_gw_g=1.
$$
*(Eq. 65.20)*

[DERIVED] This combines a worst-group harmful constraint with weighted benign criteria; it is a design choice, not a universal policy. Use distinct weights if harmful and benign populations differ. A missing group is unmeasured, rather than zero risk. Finite-sample uncertainty and evaluator error must accompany the decision.

```figure
{
  "id": "fig-65.15",
  "kind": "calculator",
  "title": "Review precision changes with event prevalence",
  "caption": "Eq.65.17 fixed-population specialization. The minimum prevalence and positive recall keep the denominator nonzero.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-65.17",
  "alt": "Eq.65.17 fixed-population specialization. The minimum prevalence and positive recall keep the denominator nonzero.",
  "spec": {
    "equation": "65.17",
    "tex": "PPV=t\\pi/[t\\pi+f(1-\\pi)]",
    "inputs": [
      {
        "symbol": "t",
        "label": "True-positive rate",
        "default": 0.8,
        "min": 0.0001,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "f",
        "label": "False-positive rate",
        "default": 0.01,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "pi",
        "label": "Target-event prevalence",
        "default": 0.001,
        "min": 1e-06,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "N",
        "label": "Reviewed opportunities",
        "default": 100000,
        "min": 1,
        "max": 10000000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "ppv",
        "label": "Positive predictive value",
        "formula": "t*pi/(t*pi+f*(1-pi))",
        "format": "percent"
      },
      {
        "symbol": "fp",
        "label": "Expected false alerts",
        "formula": "N*f*(1-pi)",
        "format": "raw"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] WIFA applies shared wrappers to harmful and benign intents; A-GCRT regularizes sampled forms using Eq.65.19. In v2Table 2, Qwen-AdvBench reduces one over-refusal measure8.30points while XSTest safe refusal rises5.61points, MMLU falls1.10 and GSM8K5.69. Its fixed v2 configuration and held-out attack protocols must not inherit claims about an earlier revision's selection procedure. Gains on one benign metric are not uniform utility dominance. [R65.7, Sections 3-6; Tables2-3; Appendix B]

[PAPER-REPORTED] Safety for Whom uses harmful-target cross-entropy and benign forward-KL to the frozen base, with token-count routing. Target-domain refusal increases9.47% to 84.75% while XSTest over-refusal rises2% to 74%. Boundary pairs reduce held-out benign over-refusal32.94% to 4.16%, with harmful-side refusal falling91.88% to 87.72%. Appendix F.7 adds a two-seed sensitivity check, not a robust variance estimate. OOD pairs come from a separate earlier construction, rather than an ordinary random held-out split. [R65.8, Sections 4-6; Appendices D.5,E,F.7]

[PAPER-REPORTED] Self-Assessment appends a hidden assessment after each response, reusing the conversation KV cache; assessment tokens receive training loss. Production detection reports78%teacher-flag recall and94%high-priority recall at1%FPR. The same stronger teacher labels evaluation, leaving shared blind spots unmeasured. Its production use is passive monitoring. In a separate24-task blocking test, attacker success is13/24versus19/24base and6/24standalone monitor; offline flags do not equal adaptive blocking success. [R65.9, Methods; Results; Adaptive adversarial evaluation]

```figure
{
  "id": "fig-65.16",
  "kind": "diagram",
  "title": "Train and evaluate both sides of the boundary",
  "caption": "Held-out intent/form combinations, legitimate task utility and independent adjudication prevent a refusal-only objective from masquerading as safety.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.16",
  "alt": "Held-out intent/form combinations, legitimate task utility and independent adjudication prevent a refusal-only objective from masquerading as safety.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "i",
        "kind": "dataset",
        "label": "Harmful/benign intent groups"
      },
      {
        "id": "f",
        "kind": "process",
        "label": "Shared and unseen forms"
      },
      {
        "id": "m",
        "kind": "model",
        "label": "Frozen candidate system"
      },
      {
        "id": "j",
        "kind": "boundary",
        "label": "Independent policy adjudication"
      },
      {
        "id": "h",
        "kind": "metric",
        "label": "Harmful violation/severity"
      },
      {
        "id": "u",
        "kind": "metric",
        "label": "False refusal and useful completion"
      }
    ],
    "edges": [
      {
        "from": "i",
        "to": "f",
        "kind": "flow",
        "label": "separate splits"
      },
      {
        "from": "f",
        "to": "m",
        "kind": "flow",
        "label": "fixed/adaptive protocols"
      },
      {
        "from": "m",
        "to": "j",
        "kind": "flow",
        "label": "responses and actual state"
      },
      {
        "from": "j",
        "to": "h",
        "kind": "flow",
        "label": "harmful side"
      },
      {
        "from": "j",
        "to": "u",
        "kind": "flow",
        "label": "benign side"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 65.5 — Evaluate a safety operating point

[DERIVED] Inputs: a declared deployment policy, held-out intent groups, legitimate tasks and frozen evaluators. Outputs: harm/utility/resource outcomes with adjudicated uncertainty.

1. Define harmful/benign/ambiguous categories, protected groups, severity and acceptable task behavior. Resolve policy ambiguity before model comparison where possible.
2. Separate training, development, threshold selection and final test by intent/source; hold out forms and compositional intent/form combinations.
3. Freeze model, wrappers, monitor threshold, attacker protocol/budget, session reset and resource environment. Allocate equal-budget comparisons or report the difference.
4. Evaluate harmful requests, near-boundary benign requests and representative legitimate tasks. Record actual state changes when relevant, not only textual refusal.
5. Blind independent adjudicators to system identity and condition; audit both flagged and unflagged samples, including teacher-disagreement strata. Preserve ambiguous/missing outcomes and costs.
6. Report per-group H,F,U, severity, uncertainty, detector base-rate sensitivity and resource costs. Choose an operating point using declared constraints; reopen on policy or deployment shift.

[DERIVED] Multiple outputs from one intent or adaptive battle are clustered observations, not independent prompts. Human oversight needs a sampling plan that can reveal false negatives; reviewing only flagged material cannot estimate recall. A held-out judge remains a fallible measurement instrument.

## Implementation

[DERIVED] The safety harness must pin policy versions, judge prompts/checkpoints, refusal parser and missingness rules. A summary that averages whichever benchmark fields happen to exist changes the estimand when fields are missing. Require a common set or report separate comparable subsets. @ms.chapter.62 owns judge calibration and error analysis.

[DERIVED] Hidden assessment turns still consume compute and may contain sensitive rationales. Prefix reuse avoids recomputing some context, but decoding, cache retention and concurrent capacity remain. Keep assessment text out of future user context as specified, apply access/retention rules and test failure correlation with the main model. Monitoring after a response cannot retroactively prevent information already disclosed.

```figure
{
  "id": "fig-65.17",
  "kind": "compare",
  "title": "Three different evaluation claims",
  "caption": "The proposed evidence requirements separate detector agreement, blocking and task safety.",
  "placement": "inline",
  "anchor": "implementation",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.17",
  "alt": "The proposed evidence requirements separate detector agreement, blocking and task safety.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "event",
        "label": "Observable"
      },
      {
        "id": "support",
        "label": "Supports"
      },
      {
        "id": "gap",
        "label": "Does not establish"
      }
    ],
    "rows": [
      {
        "dimension": "Teacher agreement",
        "values": {
          "event": "Monitor matches teacher labels",
          "support": "Relative detection against that teacher",
          "gap": "Independent harm truth or shared blind spots"
        }
      },
      {
        "dimension": "Passive monitoring",
        "values": {
          "event": "Flags completed conversations",
          "support": "Review/discovery workflow",
          "gap": "Prevention of the completed disclosure"
        }
      },
      {
        "dimension": "Adaptive blocking",
        "values": {
          "event": "Attacker retries against full control",
          "support": "Bounded tested resistance",
          "gap": "Untested strategies or all deployments"
        }
      },
      {
        "dimension": "Human review",
        "values": {
          "event": "Sampled adjudication",
          "support": "Error analysis under sampling design",
          "gap": "Recall if only positives reviewed"
        }
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[DERIVED] Experiment 65.4 proposes a harmful/benign boundary matrix with independent sampled adjudication. Separate monitor agreement, intervention effects and useful task completion. Retain one common benchmark set across compared runs and cluster by intent/battle, with source-prespecified resource budgets.

## Observations

**What the paper claims.** [PAPER-REPORTED] Intent-group supervision, local boundary data and cached self-assessment improve different measured safety operating points [R65.7-R65.9].

**What the evidence shows.** [DERIVED] Negative benign/capability results, teacher-relative labels, narrow policy scope and small adaptive tests limit broad safety claims.

**What we infer.** [DERIVED] Evaluation should expose a harm/utility/resource frontier and independent error analysis, rather than reward refusal alone.

**What remains unknown.** [UNVERIFIED] New policies, rare harms, shifted populations and stronger adaptive attackers can invalidate the selected operating point.

## Failure modes

[DERIVED] Judge leakage, shared teacher errors, unreported missing fields, adaptive test reuse, topic-wide refusal, ignored benign utility and passive-monitor results described as prevention are material failures. A low observed unsafe rate can reflect an insensitive scorer rather than a safer system.

## Siblings

[DERIVED] @ms.chapter.61 owns benchmark construction, @ms.chapter.62 judges and calibration, @ms.chapter.63 reliability and @ms.chapter.64 interpretability limits. @ms.section.65.6 integrates adversary budgets and residual risk; @ms.chapter.66 owns release evidence.

## Extensions

### Improvements and their evidence

[DERIVED] Add boundary pairs when observed over-refusal is local to an intent boundary, and shared-form supervision when superficial wrappers drive errors. Use independent review when teacher agreement is the only label source. Reverse these choices if held-out harmful recall falls below the declared constraint, utility costs exceed the deployment budget or the apparent gain disappears under a common benchmark set. A changed policy requires fresh adjudication, not merely a threshold adjustment.

## Limitations

[DERIVED] No safety training, attack campaign or human adjudication was conducted here. Algebra and source interpretation do not establish a deployment-safe operating point. Policies and measurable harm can diverge.

## Reproducibility

[DERIVED] Archive policy/judge versions, intent/source splits, wrappers, thresholds, all harm/benign denominators, missingness, adjudication sampling, disagreement resolution and complete compute/latency costs.

## References

[R65.7-R65.9] Exact methods, revisions, negative findings and source limitations: @ms.references.65.
