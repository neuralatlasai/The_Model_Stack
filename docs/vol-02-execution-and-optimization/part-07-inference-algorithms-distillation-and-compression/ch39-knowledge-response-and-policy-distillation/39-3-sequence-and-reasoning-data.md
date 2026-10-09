---
id: "ms.section.39.3"
entity_type: "section"
title: "39.3 — Sequence and reasoning data"
short_title: "39.3 — Sequence and reasoning data"
volume: 2
part: 7
chapter: 39
section: 39.3
slug: "39-3-sequence-and-reasoning-data"
parent: "ms.chapter.39"
prev_sibling: "ms.section.39.2"
next_sibling: "ms.section.39.4"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.37", "ms.chapter.38"]
downstream: ["ms.chapter.40", "ms.chapter.41", "ms.chapter.42", "ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "adaptation", "inference"], "mechanism": ["distillation", "distribution_matching"], "feedback_setting": ["ai_feedback", "verifiable_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: ["impl.pytorch", "impl.megatron-lm", "impl.verl", "impl.vllm", "impl.sglang"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2200
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 39.3 — Sequence and reasoning data

## Scope

[DERIVED] Construct response, rationale and answer-only supervision while separating teacher correctness, verifier acceptance and student learnability. The baseline is imitation of one generated response per prompt. Success means a traceable dataset with explicit selection probabilities, role masks, provenance and student-dependent diagnostics. A correct final answer is not a proof that every intermediate statement is correct or that a smaller student can reproduce the trajectory.

## Why this exists

[DERIVED] Synthetic reasoning traces can be expensive and individually impressive while being poor training data. The teacher may use transitions the student cannot recover; a verifier may accept the final answer despite a faulty rationale; long traces can dominate a token-mean objective; filtering can remove precisely the failure states needed at deployment. Selecting only easy successes increases measured acceptance while narrowing the supervised population.

[PAPER-REPORTED] The 2026 Recoverability study conditions a student on partial verified teacher solutions, then measures whether it completes them [R39.3, §§3–6; Appendices A–C]. Its fixed-cohort design asks a different question from teacher accuracy: whether the **receiving student** can exploit the supplied reasoning. GLM-5 reports keeping erroneous trajectory segments visible while masking their loss targets, allowing later correction behavior to remain contextualized [R39.7, §3.1]. OPCD reports that raw historical traces can hurt where extracted experience helps [R39.6, §4.7].

## Intuition

[MATHEMATICALLY-DERIVED] Answer-only imitation learns an output event with minimal rationale cost. Rationale imitation learns a particular path to that event. Prefix recovery probes intermediate conditional behavior, but observed failure under a few samples does not establish zero mathematical support. Filtering conditions the data on an acceptance event; it therefore changes the distribution even when the filter is perfectly implemented.

## Formulation

> **Definition — Prefix recovery.** [DERIVED] Verifier success probability under a declared student continuation law and a fixed distribution of supplied teacher-prefix interventions.

[MATHEMATICALLY-DERIVED] Let $x\sim\nu$, $y\sim p_T(\cdot\mid x)$ and acceptance $A(x,y)\in\{0,1\}$. With $a(x)=\Pr_T[A=1\mid x]>0$,

$$
p_{\rm acc}(y\mid x)=\frac{p_T(y\mid x)A(x,y)}{a(x)},\qquad
\mathbb E[N_{\rm attempts}\mid x]=\frac{1}{a(x)}.
$$
*(Eq. 39.7)*

where the attempt expectation assumes independent draws with unchanged acceptance law and unlimited retries. A cap of $J$ attempts gives success probability $1-(1-a)^J$ and expected attempted draws $[1-(1-a)^J]/a$, with limit $J$ when $a=0$. If prompts with no accepted response are dropped, the prompt population changes too. A fixed total generation budget and a fixed accepted-token budget are different comparisons.

[MATHEMATICALLY-DERIVED] Write a response as rationale $r$ and answer $a_y$, with loss mask $m_t$. Full-response imitation includes both; answer-only imitation sets rationale targets to zero while deciding explicitly whether rationale text remains in the conditioning prefix. If a rationale is visible during training but absent at inference, the two answer laws are different. A teacher-generated rationale also remains a sample, rather than a probability distribution over alternatives.


```figure
{
  "id": "fig-39.13",
  "kind": "calculator",
  "title": "Bounded rejection sampling",
  "caption": "Independent attempts with unchanged acceptance probability. The cap reduces acceptance coverage; expected attempts include unsuccessful prompts.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.7",
  "alt": "Independent attempts with unchanged acceptance probability. The cap reduces acceptance coverage; expected attempts include unsuccessful prompts.",
  "spec": {
    "tex": "P_{\\rm accepted}=1-(1-a)^J,\\quad E[N]=(1-(1-a)^J)/a",
    "equation": "39.7",
    "inputs": [
      {
        "symbol": "a",
        "label": "Per-attempt acceptance",
        "default": 0.25,
        "min": 0.01,
        "max": 1,
        "step": 0.01,
        "scale": "linear",
        "format": "raw"
      },
      {
        "symbol": "J",
        "label": "Attempt cap",
        "default": 8,
        "min": 1,
        "max": 64,
        "step": 1,
        "scale": "linear",
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "success",
        "label": "Prompt acceptance probability",
        "formula": "1-pow(1-a,J)",
        "format": "raw"
      },
      {
        "symbol": "attempts",
        "label": "Expected attempted draws",
        "formula": "(1-pow(1-a,J))/a",
        "format": "fixed3"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] For verified trajectory $y$, fractions $\mathcal F=\{.25,.5,.75\}$ and $K$ independent continuations per fraction, define

$$
\widehat R_s(y)=\frac{1}{|\mathcal F|K}\sum_{f\in\mathcal F}\sum_{k=1}^{K}V(y_{\leq f},\widetilde y_{sfk}),\quad
R_s(y)=\frac{1}{|\mathcal F|}\sum_f\Pr[V=1\mid y,f,s].
$$
*(Eq. 39.8)*

where $V$ is the frozen answer verifier and $y_{\leq f}$ uses a declared rounding/tokenization rule. The estimator is unbiased for this finite intervention distribution. Under conditional independence its variance is at most $1/(4|\mathcal F|K)$, or $1/48$ for three fractions and four draws. Correlated continuations invalidate that bound. Twelve draws are not twelve independent benchmark questions.

## Mechanism

### Methodology

[PAPER-REPORTED] Recoverability freezes1000 verified trajectories,500 fragile and500 robust, selected using low/high posterior success of the smallest student and matched by realized length. The same question IDs and trajectories are reused across student scales [R39.3, Appendix B]. Each student receives the same25%,50%,75% prefixes and four continuations per fraction:12000 continuations per student,36000 over three scales. This preserves the intervention while changing the receiving model. “Fragile” is a cohort label for the original student, not an intrinsic property of a question.

[MATHEMATICALLY-DERIVED] If $n$ conditionally independent continuations produce zero successes, the one-sided95% binomial upper bound on the success probability is $1-.05^{1/n}$. For $n=4$ it is approximately.527; even pooling12 homogeneous draws gives about.221. The three prefix fractions are not generally homogeneous, so the pooled bound need not apply. The valid conclusion is zero observed successes under a specified sampler and cap, not absence from the model's support. Finite softmax probabilities are usually positive before truncation; processor-induced zeros require a separate decoding contract.


```figure
{
  "id": "fig-39.14",
  "kind": "diagram",
  "title": "Outcome and process evidence diverge",
  "caption": "An accepted final answer and a checked reasoning process are separate evidence channels. Student recovery adds a third conditional-behavior measurement.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.8",
  "alt": "An accepted final answer and a checked reasoning process are separate evidence channels. Student recovery adds a third conditional-behavior measurement.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "trace",
        "kind": "dataset",
        "label": "Teacher rationale and answer"
      },
      {
        "id": "answer",
        "kind": "process",
        "label": "Outcome verifier"
      },
      {
        "id": "steps",
        "kind": "process",
        "label": "Step and execution checks"
      },
      {
        "id": "accept",
        "kind": "state",
        "label": "Accepted final answer"
      },
      {
        "id": "recover",
        "kind": "metric",
        "label": "Student prefix recovery"
      }
    ],
    "edges": [
      {
        "from": "trace",
        "to": "answer"
      },
      {
        "from": "trace",
        "to": "steps"
      },
      {
        "from": "answer",
        "to": "accept"
      },
      {
        "from": "accept",
        "to": "recover"
      }
    ]
  }
}
```


```figure
{
  "id": "fig-39.15",
  "kind": "chart",
  "title": "Zero observed successes still permits positive probability",
  "caption": "Analytical bound 1 minus .05 to the power 1/n assumes homogeneous independent Bernoulli draws. Different prefix fractions cannot automatically be pooled.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.8",
  "alt": "Analytical bound 1 minus .05 to the power 1/n assumes homogeneous independent Bernoulli draws. Different prefix fractions cannot automatically be pooled.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Independent draws with zero success",
      "format": "integer"
    },
    "y": {
      "label": "One-sided 95 percent upper bound",
      "format": "raw"
    },
    "series": [
      {
        "id": "s0",
        "label": "Binomial upper bound",
        "points": [
          [
            1,
            0.95
          ],
          [
            2,
            0.7763932022500211
          ],
          [
            4,
            0.5271291954984121
          ],
          [
            8,
            0.31234397806636793
          ],
          [
            12,
            0.22092219194555585
          ],
          [
            16,
            0.17074972298248092
          ],
          [
            32,
            0.0893681989862648
          ],
          [
            64,
            0.045729702330762456
          ]
        ]
      }
    ]
  }
}
```


[PAPER-REPORTED] The study also compares CE and full-vocabulary reverse-KL **logit** gradients on identical response tokens. With student $q$, teacher $p$, one-hot target $e_y$ and $D=\operatorname{KL}(q\Vert p)$,

$$
g_{\rm CE}=q-e_y,\qquad g_{{\rm RKL},v}=q_v\left(\log\frac{q_v}{p_v}-D\right),\qquad
C=\frac{1-\cos(g_{\rm CE},g_{\rm RKL})}{2}.
$$
*(Eq. 39.9)*

where zero-gradient directions are excluded before averaging. $C\in[0,1]$ measures local directional conflict. It is not a parameter-gradient cosine: multiplying by different network Jacobians can change angles. Nor does it identify which gradient improves generalization. The source's fixed-teacher controls and objective intervention provide empirical support beyond the local diagnostic, rather than a universal selector theorem.

[DERIVED] Dataset construction therefore needs two audit levels. First, validate response artifacts: prompt origin, teacher version, decoding, rationale/answer boundaries, tool observations and verifier version. Second, measure the student's relationship to selected trajectories without leaking downstream outcomes into selection. If accepted traces are weighted by length or recovery, disclose the resulting change from the original teacher distribution. A recovery-based curriculum proposed after inspecting target benchmarks is a hypothesis, not a validated improvement.

## Algorithm

**Algorithm 39.3 — Bounded synthetic-trace construction and recovery audit.** [DERIVED] Inputs are a frozen prompt manifest, teacher/student versions, verifier, integer candidate cap $J$, fraction set, positive integer $K$ and generation deadline. Outputs are accepted traces, rejected-attempt ledger and a recovery table with complete cohort identity; alternatively a named incomplete audit. This procedure reconstructs source measurement while adding explicit bounded failure handling.

$$
\begin{aligned}
1.&\quad \mathcal D\leftarrow\varnothing;\ \mathcal L\leftarrow\varnothing;\ \text{freeze split and verifier hashes.}\\
2.&\quad \text{For each prompt }x:\ j\leftarrow0;\ \text{accepted}\leftarrow\text{false}.\\
3.&\quad \text{While }j<J\text{ and deadline remains: draw }y;\ j\leftarrow j+1;\ \text{validate termination and provenance.}\\
4.&\quad \text{Log every attempt; if verifier accepts, store }(x,y,m,\text{hashes})\text{ and end this prompt.}\\
5.&\quad \text{On timeout/error log the named outcome; never relabel an unverified trace as incorrect.}\\
6.&\quad \text{Freeze a source-disjoint cohort; reject duplicate IDs or unequal paired trajectory hashes.}\\
7.&\quad \text{For each }(y,s,f,k):\ \text{generate bounded student continuation and record verified success.}\\
8.&\quad \text{If any required record is absent, return INCOMPLETE\_COHORT; otherwise compute Eq.39.8.}\\
9.&\quad \text{Publish dataset, masks, attempt counts and paired recovery records; do not tune on final tests.}
\end{aligned}
$$

[DERIVED] Invariants are immutable source identities, no test-derived selection, one ledger record per attempt and a complete paired recovery manifest. Timeout and verifier failure remain distinct from a valid unsuccessful solution. Complexity is bounded by prompt count times $J$ generation calls plus cohort size times student count times $|\mathcal F|K$ continuations; token caps and context length determine the actual compute. There is no optimizer step in the recovery diagnostic.

## Implementation

[DERIVED] Store a rationale as typed segments rather than relying on a delimiter string alone. Role and tool-observation masks must survive packing. A failed action may remain visible so a later corrective action has its real context, while its loss target is zero. Removing it changes the state seen by the correction. Answer extraction must preserve whether the complete sequence, executable program or normalized final scalar was verified; these contracts yield different acceptance events.

[PAPER-REPORTED] GLM-5 reports rejection sampling and difficulty filtering for reasoning data, real execution environments for agent trajectories, and masking erroneous segments in SFT [R39.7, §3.1]. Exact dataset counts, per-filter acceptance, verifier error and mask implementation are NOT-DISCLOSED there. This disclosure supports the mechanism, not a reconstruction of private training data or a causal estimate of its contribution.


```figure
{
  "id": "fig-39.16",
  "kind": "matrix",
  "title": "Rationale context and target choices",
  "caption": "For the rationale or error segment shown, full-trace imitation targets it; answer-only and masked-error variants can keep it visible while excluding its loss. Visibility must be declared.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.8",
  "alt": "For the rationale or error segment shown, full-trace imitation targets it; answer-only and masked-error variants can keep it visible while excluding its loss. Visibility must be declared.",
  "spec": {
    "rows": 2,
    "cols": 3,
    "pattern": "explicit",
    "cells": [
      [
        1,
        1,
        1
      ],
      [
        1,
        0,
        0
      ]
    ],
    "rowLabel": "Quantity",
    "colLabel": "Access or choice",
    "rowTicks": [
      "Visible",
      "Targeted"
    ],
    "colTicks": [
      "Full trace",
      "Answer only",
      "Masked error"
    ],
    "legend": "Cell values are the stated quantities; they are not empirical performance."
  }
}
```


## Experimental design

### Reported experiments

| Field | Recoverability protocol [R39.3, §§5–9; Appendices A–F] |
|---|---|
| Models | Qwen3 adjacent teacher/student pairs1.7B→.6B,4B→1.7B,8B→4B,14B→8B; frozen teachers |
| Data/split | GSM8K7473 training to OlympiadBench581 test; MBPP120 training to HumanEval164 test; fixed1000-trajectory diagnostic cohort |
| Optimization |800 updates, seed42, temperature1, LR $10^{-5}$, effective batch16, max sequence1024; complete-vocabulary RKL on valid response tokens |
| Capacity control |.6B/1.7B full updates;4B/8B LoRA because of fixed hardware budget; fixed8B teacher conflict controls also reported |
| Diagnostic/evaluation | Three fractions×four continuations; paired IDs, frozen verifier and decoding within comparisons; cohort-length matching |
| Missing reconstruction fields | Hardware/precision, optimizer type, LoRA rank, exact model revisions, complete decoding parameters and independent training-seed uncertainty NOT-DISCLOSED |

[PAPER-REPORTED] A separate2×2 objective/cohort intervention compares CE and RKL on fragile versus robust StepHard data. The full-vs-LoRA change across student scales prevents treating the downstream trend as a randomized intervention on parameter count alone. The fixed-teacher gradient diagnostic is a stronger control for teacher identity, while remaining observational with respect to model capacity.

## Observations

**What the paper claims.** [PAPER-REPORTED] Prefix recovery and objective conflict locate a capacity-dependent regime where distribution-level transfer has more headroom [R39.3, §§5–10].

**What the evidence shows.** [PAPER-REPORTED] Mean recovery is70.97/85.45/91.93% for.6B/1.7B/4B; the robust–fragile gap contracts45.97→14.35 percentage points. With an8B teacher, standardized conflict separation is.993/.712/.233. OlympiadBench changes are+4.30,+2.58,0,−1.03 points across.6B/1.7B/4B/8B; HumanEval changes+3.66,+2.44,+1.83,+.61. The StepHard intervention reports RKL-over-CE gains15.76 points on fragile and8.79 on robust trajectories. These are source outcomes, without independent multiseed replication in the inspected protocol.

**What we infer.** [DERIVED] Verified teacher correctness and student compatibility are distinct. Paired recovery trends and the objective intervention support the usefulness of a diagnostic; they do not establish a universal two-billion-parameter threshold, zero support from failed samples or causality of local gradient cosine.

**What remains unknown.** [NOT-DISCLOSED] The full-vs-LoRA confound, missing artifact/version fields, uncertainty across training seeds and generality to other model families prevent a universal capacity law or validated recovery-based data selector.


```figure
{
  "id": "fig-39.17",
  "kind": "compare",
  "title": "Data variants on matched prompt identities",
  "caption": "The comparison keeps prompt IDs and verifier fixed. None of the variants establishes exact logit transfer from text alone.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.8",
  "alt": "The comparison keeps prompt IDs and verifier fixed. None of the variants establishes exact logit transfer from text alone.",
  "spec": {
    "axis": "Compare retained evidence and likely distribution change",
    "columns": [
      {
        "id": "answer",
        "label": "Answer-only"
      },
      {
        "id": "rationale",
        "label": "Full rationale"
      },
      {
        "id": "prefix",
        "label": "Partial prefix"
      }
    ],
    "rows": [
      {
        "dimension": "Target",
        "values": {
          "answer": "Final answer tokens",
          "rationale": "Reasoning and answer tokens",
          "prefix": "Declared continuation tokens"
        }
      },
      {
        "dimension": "Main omission",
        "values": {
          "answer": "Reasoning path",
          "rationale": "Unseen alternatives and process truth",
          "prefix": "Earlier reasoning is supplied"
        }
      },
      {
        "dimension": "Key confound",
        "values": {
          "answer": "Hidden rationale conditioning",
          "rationale": "Length and teacher errors",
          "prefix": "Answer leakage and prefix fraction"
        }
      }
    ]
  }
}
```


```figure
{
  "id": "fig-39.18",
  "kind": "stat-panel",
  "title": "Recovery audit units",
  "caption": "The source diagnostic reuses the same trajectories across students. Preserve this pairing when computing uncertainty and capacity trends.",
  "placement": "rail",
  "evidence": "PAPER-REPORTED",
  "source": "R39.3",
  "alt": "The source diagnostic reuses the same trajectories across students. Preserve this pairing when computing uncertainty and capacity trends.",
  "spec": {
    "header": "Recovery audit units",
    "rows": [
      {
        "key": "fractions",
        "value": "3",
        "note": "25, 50 and 75 percent"
      },
      {
        "key": "continuations",
        "value": "4 per fraction",
        "note": "12 measurements per trajectory/student"
      },
      {
        "key": "unit",
        "value": "Trajectory or item",
        "note": "Not twelve independent benchmark questions"
      }
    ]
  }
}
```


## Failure modes

> **Failure mode — Accepted answer, faulty rationale.** [DERIVED] *Symptom:* answer verification succeeds while intermediate transitions contradict execution or stated premises. *Cause:* the acceptance event checks only the final answer. *Detection:* retain step/tool provenance and distinguish outcome from process checks. *Mitigation:* name the verifier's coverage and avoid describing outcome acceptance as proof of every step.

[DERIVED] Filtering can amplify teacher biases, remove difficult prompts and reward verbose traces under token weighting. A truncated continuation can be mislabeled as an ordinary reasoning error. Reusing target-test outcomes to tune a filter leaks evaluation information. Zero observed recovery is particularly dangerous when translated into a claim of impossible learning.

## Siblings

[DERIVED] Answer-only data minimize target-token cost but discard explicit reasoning paths. Full-rationale imitation exposes paths but can copy teacher errors and overwhelm a smaller student. Partial-prefix supervision changes the amount of supplied reasoning, while conditional-logit KD supplies alternatives at those prefixes. Compare them with the same prompt IDs, teacher version, acceptance contract and consumed-token budget; raw example count is insufficient.

## Extensions

### Improvements

[PAPER-REPORTED] OPCD's math validation analysis reports75.1 without experience,70.5 with raw historical traces and77.4 with extracted knowledge; its distillation setting reaches79.7 [R39.6, §4.7, Table6]. This supports a distinction between extracted context and raw traces under that protocol, not a universal claim that rationales are harmful. Its test-based checkpoint selection remains a separate limitation discussed in §39.6. Recoverability proposes a future student-dependent curriculum, but does not validate a deployable selector; book proposals remain in verification.md.

## Limitations

[DERIVED] Recovery depends on sampler, cap, fractions, verifier and cohort. A late-prefix success can reflect answer leakage rather than acquired reasoning, and a low-recovery trace may be useful after prerequisites change. A single objective-conflict number cannot diagnose representation, search and verifier failures independently. No proposed selection rule is presented as an executed improvement.

## Reproducibility

[DERIVED] Publish every candidate attempt, accepted trace hash, filtering decision, response mask, exact prefix boundary and continuation outcome. Preserve paired question IDs across scales. Report uncertainty at the trajectory/item level and distinguish repeated decoding from independent training seeds. Current evidence is the inspected2026 primary protocol and book-derived estimator mathematics; the chapter executed no generation or training.

## References

[R39.3](references.md#r393), [R39.6](references.md#r396), [R39.7](references.md#r397).
