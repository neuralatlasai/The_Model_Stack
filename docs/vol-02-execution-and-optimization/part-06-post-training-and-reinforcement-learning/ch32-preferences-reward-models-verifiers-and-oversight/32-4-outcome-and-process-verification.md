---
id: "ms.section.32.4"
entity_type: "section"
title: "Outcome and process verification"
short_title: "Outcome and process verification"
volume: 2
part: 6
chapter: 32
section: 32.4
slug: "32-4-outcome-and-process-verification"
parent: "ms.chapter.32"
prev_sibling: "ms.section.32.3"
next_sibling: "ms.section.32.5"
children: []
prerequisites: ["ms.chapter.2", "ms.chapter.6", "ms.chapter.11", "ms.chapter.31"]
downstream: ["ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.38", "ms.chapter.62", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "evaluation", "assurance"], "mechanism": ["preference_modeling", "reward_modeling", "verification", "oversight"], "feedback_setting": ["human_preference", "ai_feedback", "verifiable_reward", "learned_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2200
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 32.4 — Outcome and process verification

## Scope

[DERIVED] Define what outcome and intermediate-step verification can establish, and how incomplete or compromised checkers alter that claim. The section owns final-answer correctness, process supervision, executable tests, proof checkers and verifier incompleteness. A successful artifact binds every verdict to the property, formal statement, artifacts and execution boundary actually checked. Policy-gradient estimators and GRPO updates are developed in Chapters 34–35; a dense feedback sequence does not by itself specify an RL algorithm.

## Why this exists

[DERIVED] Sparse final feedback cannot identify which intermediate decisions were useful, while a dense sequence can reward locally plausible actions that fail globally. Replacing a learned judge with an executable checker narrows some uncertainties but adds a specification and trust boundary. The question is not whether a signal is called verifiable; it is which proposition follows from acceptance and what has to be trusted for that implication.

[PAPER-REPORTED] VPR constructs turn-level rewards in structured environments with algorithmic oracles. FormalRewardBench evaluates learned proof assessment against deliberately incorrect variants of formal proofs. These settings separate a ground-truth checking procedure from the learned model that predicts proof quality. [R32.4, §2; R32.5, §3].

## Intuition

[MATHEMATICALLY-DERIVED] Let $G$ be the intended property and $V$ the implemented acceptance predicate. Soundness on domain $\mathcal X$ requires $V(u)=1\Rightarrow G(u)=1$ for all $u\in\mathcal X$. Completeness requires the reverse implication. Unit tests usually establish only membership in the set of programs passing those fixtures; proving that this implies the full functional specification requires additional mathematics. A proof checker establishes a formal statement relative to its axioms and implementation assumptions. It does not establish that the statement is the one the user intended.

[DERIVED] A process label may mean local derivation validity, preservation of a constraint, progress toward a solution or expected eventual success. Those are different predicates. A locally valid step can be unnecessary; a recoverable wrong step can still lead to a correct answer. Giving every accepted step a positive reward may incentivize redundant steps unless the task objective and shaping rule prevent it. Density is a temporal property of feedback, not a correctness guarantee.


```figure
{
  "id": "fig-32.19",
  "kind": "diagram",
  "title": "Verification has two semantic boundaries",
  "caption": "The formal target must match the intended task before the checker result is used; a valid proof of a changed target is not acceptance of the original task.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "The formal target must match the intended task before the checker result is used; a valid proof of a changed target is not acceptance of the original task. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "intent",
        "kind": "objective",
        "label": "Intended task",
        "sub": "semantic contract"
      },
      {
        "id": "target",
        "kind": "state",
        "label": "Formal target",
        "sub": "statement or fixtures"
      },
      {
        "id": "cand",
        "kind": "dataset",
        "label": "Candidate",
        "sub": "immutable artifact"
      },
      {
        "id": "checker",
        "kind": "process",
        "label": "Pinned checker",
        "sub": "trusted dependencies"
      },
      {
        "id": "verdict",
        "kind": "metric",
        "label": "Scoped verdict",
        "sub": "accept/reject/unknown"
      }
    ],
    "edges": [
      {
        "from": "intent",
        "to": "target",
        "label": "faithfulness boundary"
      },
      {
        "from": "target",
        "to": "checker"
      },
      {
        "from": "cand",
        "to": "checker"
      },
      {
        "from": "checker",
        "to": "verdict",
        "label": "soundness boundary"
      }
    ]
  }
}
```


## Formulation

| Symbol | Meaning | Boundary |
|---|---|---|
| $G(u)$ | Intended task property | Defined independently of the candidate |
| $V(u)$ | Implemented verifier decision | Accept/reject/unknown/error |
| $f_s$ | False-acceptance probability per invalid step in an analytical model | Conditional on step population |
| $m$ | Number of checked steps/opportunities | Finite integer |
| $p_s$ | Independent probability that a step is correct in the toy model | $0<p_s<1$ |
| $c_j$ | Cost of checker invocation $j$ | Seconds, FLOPs or another stated unit |

[MATHEMATICALLY-DERIVED] For $m$ invalid steps whose false acceptances are independent with common probability $f_s$, the probability of at least one false acceptance is

$$
p_{\rm any}=1-(1-f_s)^m.
$$
*(Eq. 32.11)*

The model concerns exposure to at least one verifier mistake; it is not the probability that a complete task fails. If dependence is unknown, the universally valid union bound is

$$
\Pr\left(\bigcup_{j=1}^m E_j\right)\le\min\left(1,\sum_{j=1}^m\Pr(E_j)\right),
\qquad c_{\rm total}=\sum_{j=1}^m c_j.
$$
*(Eq. 32.12)*


```figure
{
  "id": "fig-32.20",
  "kind": "calculator",
  "title": "Exposure to false step acceptance",
  "caption": "Eq. 32.11 assumes independent false acceptances on invalid steps. It reports at least one mistake, not complete-task failure probability.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.11",
  "alt": "Eq. 32.11 assumes independent false acceptances on invalid steps. It reports at least one mistake, not complete-task failure probability. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "tex": "p_{any}=1-(1-f_s)^m",
    "equation": "32.11",
    "inputs": [
      {
        "symbol": "m",
        "label": "invalid-step opportunities",
        "default": 32,
        "min": 1,
        "max": 128,
        "format": "integer",
        "options": [
          1,
          4,
          8,
          16,
          32,
          64,
          128
        ]
      },
      {
        "symbol": "fs",
        "label": "false acceptance per step",
        "default": 0.01,
        "min": 0,
        "max": 0.25,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "pany",
        "label": "at least one false acceptance",
        "formula": "1-(1-fs)^m",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "union",
        "label": "union bound",
        "formula": "min(1,m*fs)",
        "format": "fixed3",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation"
}
```


[MATHEMATICALLY-DERIVED] A separate toy regime assumes $m$ independent Bernoulli correctness events $Z_j$ with probability $p_s$, terminal success requiring all events and a dense count that sums them. Then

$$
\mathbb E\left[\prod_{j=1}^mZ_j\right]=p_s^m,
\qquad
\mathbb E\left[\frac1m\sum_{j=1}^mZ_j\right]=p_s.
$$
*(Eq. 32.13)*

This derives feedback frequency under specified independence and conjunction conditions. It does not derive a policy-gradient advantage, equivalence of objectives, or a guarantee that dense supervision improves final success. The count rewards partial correctness and therefore has a different target unless a valid shaping construction establishes otherwise.


```figure
{
  "id": "fig-32.21",
  "kind": "chart",
  "title": "Sparse success and dense count",
  "caption": "Eq. 32.13 contrasts an all-correct outcome with the normalized correct-step count under independent Bernoulli steps. The objectives differ; the chart is not an RL benchmark.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.13",
  "alt": "Eq. 32.13 contrasts an all-correct outcome with the normalized correct-step count under independent Bernoulli steps. The objectives differ; the chart is not an RL benchmark. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "number of required steps",
      "domain": [
        1,
        32
      ]
    },
    "y": {
      "label": "expected normalized signal",
      "domain": [
        0,
        1
      ],
      "ticks": [
        0,
        0.25,
        0.5,
        0.75,
        1
      ]
    },
    "variables": {},
    "series": [
      {
        "id": "terminal",
        "label": "all-correct terminal signal",
        "formula": "0.9^x",
        "sample": {
          "from": 1,
          "to": 32,
          "count": 32
        },
        "emphasis": true
      },
      {
        "id": "dense",
        "label": "normalized correct-step count",
        "formula": "0.9",
        "sample": {
          "from": 1,
          "to": 32,
          "count": 32
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 10,
        "y": 0.3486784401000001,
        "label": "Ten steps: terminal success about0.349, not0.9"
      }
    ]
  }
}
```


## Mechanism

[DERIVED] Outcome verification begins by fixing the evaluated object. Exact-answer checking requires a canonicalization policy that preserves semantics; numerical checking requires tolerance, scale and exceptional-value handling; executable checking requires completed assertions, deterministic fixtures where applicable and a pinned environment. An answer parser is part of the verifier. If parsing accepts a convenient substring while ignoring contradictory surrounding text, the accepted proposition differs from full-response correctness.

[DERIVED] Test coverage is a quantifier boundary. Running tests on inputs $q_1,\ldots,q_j$ establishes behavior on those inputs under that environment. It cannot establish $\forall q$ correctness by the existence of many tests alone. Property-based testing samples a larger domain but remains a sampling procedure unless supported by an exhaustive or deductive argument. Mutation tests probe whether selected faults are detected; their detection rate depends on the mutation distribution and is not a universal soundness estimate.

[DERIVED] Formal verification moves the boundary to a formal proposition and its trusted kernel. Check the target statement, permitted axioms, imported dependencies, placeholders and the integrity of the checking process. A proof of a weakened theorem is a valid proof of the wrong target. Permitting an additional axiom can make a proof compile without establishing the intended theorem under the original axiom set. A successful external build command is weaker evidence than a complete checker manifest tying the exact theorem and dependencies to the produced proof object.

[DERIVED] Process verification requires a prefix-state transition. Define a state $s_j$, action $a_j$, transition $s_{j+1}=F(s_j,a_j)$ and local predicate $v_j$. A label based on the full future trajectory must be identified as retrospective supervision. An oracle that evaluates consistency against a hidden solution should not be described as a generally available online checker unless the hidden solution is available at deployment. Search-backed verification introduces a search budget; failure to find a witness is not necessarily proof of its absence.

[DERIVED] Local predicates need global composition rules. Preserving a safety invariant at every transition can imply a trajectory invariant if initialization and transition closure are proved. Merely scoring each transition with an independent learned model does not provide that proof. Conversely, final success can justify an outcome reward while leaving intermediate reasoning unvalidated. Maintain both ledgers when process faithfulness matters.


```figure
{
  "id": "fig-32.22",
  "kind": "compare",
  "title": "Outcome and process predicates",
  "caption": "The axis is the object checked and its compositional limitation; richer timing does not automatically strengthen the proposition.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "The axis is the object checked and its compositional limitation; richer timing does not automatically strengthen the proposition. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "axis": "Checked object and missing implication",
    "columns": [
      {
        "id": "o",
        "label": "Outcome"
      },
      {
        "id": "l",
        "label": "Local process"
      },
      {
        "id": "p",
        "label": "Proof kernel"
      }
    ],
    "rows": [
      {
        "dimension": "object",
        "values": {
          "o": "final artifact",
          "l": "state transition",
          "p": "formal proof term"
        }
      },
      {
        "dimension": "acceptance means",
        "values": {
          "o": "declared final predicate",
          "l": "local predicate holds",
          "p": "formal target derives"
        }
      },
      {
        "dimension": "missing implication",
        "values": {
          "o": "all steps valid",
          "l": "global success",
          "p": "target matches intent"
        }
      },
      {
        "dimension": "required audit",
        "values": {
          "o": "coverage/integrity",
          "l": "composition/progress",
          "p": "axioms/dependencies"
        }
      }
    ]
  }
}
```


## Algorithm

[DERIVED] Algorithm 32.4 below describes the book's verification boundary. It is a defensive specification with explicit unknown states; it is not a claim that the cited studies implement each guard.

**Algorithm 32.4 — Bounded verification with immutable semantic targets.** Input $u$ contains the exact statement/program $s$, candidate $y$, permitted dependency manifest $v$ and finite checker budget $b_c$. $\mathcal A_v$ is the permitted axiom/dependency set; $\mathcal P_v$ is the expected assertion manifest; $\mathcal O$ is the checker observation. Output is a tagged verdict and evidence, never an unqualified truth label.

$$
\begin{aligned}
(1)\;&h\leftarrow\operatorname{Hash}(s,y,v);\quad e\leftarrow\operatorname{FreshIsolatedState}(v).\\
(2)\;&\text{if artifact/permission checks fail: return ERROR}(h).\\
(3)\;&\mathcal O\leftarrow\operatorname{RunBounded}(e,s,y;b_c).\\
(4)\;&\text{if timeout, crash or incomplete log: return UNKNOWN}(h,\mathcal O).\\
(5)\;&b_s\leftarrow\mathbf1[\operatorname{Target}(\mathcal O)=s].\\
(6)\;&b_a\leftarrow\mathbf1[\operatorname{Dependencies}(\mathcal O)\subseteq\mathcal A_v].\\
(7)\;&b_p\leftarrow\mathbf1[\operatorname{CompletedChecks}(\mathcal O)=\mathcal P_v].\\
(8)\;&b_i\leftarrow\mathbf1[\operatorname{HashAfter}(s,y,v)=h].\\
(9)\;&V(u)\leftarrow\begin{cases}\mathrm{ACCEPT},&b_sb_ab_pb_i=1\ \land\ \operatorname{PredicatePass}(\mathcal O),\\
\mathrm{REJECT},&b_sb_ab_pb_i=1\ \land\ \operatorname{PredicateFail}(\mathcal O),\\
\mathrm{UNKNOWN},&\text{otherwise}.\end{cases}\\
(10)\;&\text{return }(V(u),h,\mathcal O,v,b_c).
\end{aligned}
$$

The assertion manifest can denote a pinned proof-kernel check rather than unit tests. A target comparison checks the formal statement, not merely a theorem name. REJECT means failure of the stated predicate; it does not prove mathematical falsity when the checker is incomplete. Every invocation uses fresh state and an externally enforced deadline.

[DERIVED] The maintained invariant is that acceptance refers to unchanged artifacts and the declared target/predicate only. Timeouts, crashes and missing checks terminate as unknown or error, never as successful verification. Evidence retention makes later rechecking possible; it does not eliminate a bug in the trusted checker. Where a checker uses non-deterministic scheduling, replay records must capture enough state to delimit reproducibility rather than labeling all failures semantic.

## Implementation

[DERIVED] Keep candidate execution outside the evaluator's authority over tests and final scores. The evaluator owns the assertion manifest and writes verdicts through a separate process identity. A candidate-produced log is evidence from the candidate and cannot be the authoritative score record. Hashes detect changes only when an independent trusted process computes and stores them. The pipeline therefore needs both artifact identity and privilege separation.

[MATHEMATICALLY-DERIVED] If $m$ steps each invoke a checker of time $c_v$, sequential overhead is $mc_v$ before dispatch and serialization. Independent checks can parallelize subject to resource and dependency limits, but a checker needing the resulting state cannot run before that state exists. Storing every process prefix naively can require quadratic token storage; immutable shared prefixes or incremental state reduce duplication without altering the information boundary. Learned process evaluators add parameters, forward FLOPs and activation/KV storage; exact symbolic checkers instead require solver state, proof terms and search memory. State the appropriate boundary rather than assigning a language-model FLOP formula to every verifier.

[PAPER-REPORTED] VPR's Appendix F explicitly normalizes across trajectories from different initial states and falls back to global batch moments when fewer than four trajectories remain active at a turn. This differs from same-prompt grouping. The chapter preserves that reported implementation rather than silently replacing it with a textbook GRPO grouping. [R32.4, Appendix F].

[DERIVED] Total communication is the serialized candidate, state and returned certificate crossing the checker boundary, plus any distributed-model collectives. Measured latency, throughput, energy and money are UNVERIFIED here. There is no basis for a universal claim that process feedback is cheaper than terminal checking: step count, oracle structure and reusable state determine the comparison.


```figure
{
  "id": "fig-32.23",
  "kind": "stat-panel",
  "title": "Checker status is not a binary float",
  "caption": "Only completed scoped evidence can yield acceptance; infrastructure failures retain distinct statuses and remain in the denominator.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "Only completed scoped evidence can yield acceptance; infrastructure failures retain distinct statuses and remain in the denominator. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "header": "VERIFICATION STATUS",
    "variables": {},
    "rows": [
      {
        "key": "accept",
        "value": "scoped predicate established"
      },
      {
        "key": "reject",
        "value": "scoped predicate failed"
      },
      {
        "key": "unknown",
        "value": "incomplete evidence"
      },
      {
        "key": "error",
        "value": "execution/integrity fault"
      }
    ]
  },
  "anchor": "algorithm"
}
```


## Experimental design

[PAPER-REPORTED] Source-specific protocol reconstruction:

| Source | Model, fitting and evaluation | Unresolved fields |
|---|---|---|
| R32.4, §3/Appendix F | Qwen3-4B, 100 updates, Adam $(0.9,0.95)$, LR $2\times10^{-7}$, 128 trajectories/update, discount zero, KL disabled; eight H100 80GB; three 100-game evaluations | Repeated-training seeds: NOT-DISCLOSED |
| R32.5, §3–4 | 250 pairs/five error strategies; DSProver-V2-671B correct proofs; Claude Opus 4.5 generates corruptions; judging temperature 1/top-p 0.75; pointwise and both-order pairwise metrics | Released implementation reproducing strategy-specific validation: UNVERIFIED |

[DERIVED] FormalRewardBench's §3.1.1 says S1–S4 receive Lean validation while also explicitly exempting S3 Python answers, and its pipeline caption states the exemption. The chapter retains this inconsistency in the evidence-gap ledger; it does not infer an uninspected implementation correction. A method comparison must use the verified strategy-specific denominator, not silently treat all examples as identical Lean-check failures.

## Observations

**What the paper claims.** [PAPER-REPORTED] VPR's Sudoku success is $56.25\pm2.28$ versus outcome reward $48.43\pm2.61$ across its repeated evaluations. FormalRewardBench's Claude Opus 4.5 scores 70.1% pointwise versus 59.8% order-consistent pairwise; these metrics differ. [R32.4, Table 1; R32.5, Table 1].

**What the evidence shows.** [DERIVED] These studies test bounded environments and synthetic error families. Learned proof evaluation remains distinct from kernel checking; neither study establishes universal verifier completeness.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 32.11 shows that adding independently fallible checks increases the number of opportunities for at least one mistake. Whether that increases or decreases final task error depends on the composition and correction mechanism.

**What remains unknown.** [UNVERIFIED] Real-world oracle reliability, the unresolved S3 validation implementation, arbitrary-domain transfer and independent reproduction remain outside the established record.

## Failure modes

[DERIVED] Observable failures include passing without completed assertions, a changed theorem statement, non-permitted dependencies, self-reported success after a timeout, locally accepted loops with no progress, and strong terminal scores with invalid intermediate claims. Separate checker errors, incomplete specifications, process-label mismatch and candidate tampering. They require different interventions and denominators.


```figure
{
  "id": "fig-32.24",
  "kind": "matrix",
  "title": "A test suite covers selected predicates",
  "caption": "Rows are three tests and columns are five required properties. Filled cells are illustrative coverage declarations; no row or column proves universal specification coverage.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "Rows are three tests and columns are five required properties. Filled cells are illustrative coverage declarations; no row or column proves universal specification coverage. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "rows": 3,
    "cols": 5,
    "pattern": "explicit",
    "cells": [
      [
        1,
        1,
        0,
        0,
        0
      ],
      [
        0,
        1,
        1,
        0,
        0
      ],
      [
        0,
        0,
        1,
        1,
        0
      ]
    ],
    "rowLabel": "test case",
    "colLabel": "required property",
    "legend": "Filled: declared coverage; property 5 is unchecked."
  }
}
```


## Siblings

[DERIVED] [Reward-model training](32-3-reward-model-training.md) estimates preferences; a verifier checks a scoped predicate. [Oversight](32-5-oversight-strategies.md) arranges independent validation of those predicates. [Reward exploitation](32-6-reward-exploitation.md) studies optimization against their weaknesses. Outcome and process checks differ by information boundary and target; neither is a universal replacement for the other.

## Extensions

[DERIVED] For tool agents, retain both tool-return validity and external state changes. For mathematical research, distinguish formal correctness, faithful formalization and novelty; a kernel proving the formal statement cannot certify novelty in an incomplete literature corpus. For open-ended outputs, some criteria remain preference-based and should be carried as such alongside exact predicates.

## Limitations

[DERIVED] Verification is relative to the specification and trusted computing boundary. A sound restricted-domain checker can still be incomplete or operationally unavailable. The scientific claim must name its valid domain, failure statuses and dependence on oracle reliability. Sparse-to-dense comparisons require matched compute and a stated final utility; otherwise a reward increase may reflect a changed objective.

## Reproducibility

[DERIVED] Archive target and candidate hashes, statement equivalence checks, dependency/axiom manifests, checker versions, fixture identities, seeds, budgets, timeouts, assertion counts and raw verdicts. Keep accepted, rejected, unknown and infrastructure-error populations separate. Primary experimental claims remain PAPER-REPORTED; the independent verification and mutation audit in [verification](verification.md) is unexecuted.

## References

[R32.4] VPR, §2–3 and Appendix F. [R32.5] FormalRewardBench, §3–5 and Appendices A–D. The VPR normalization and proof-benchmark validation discrepancy are preserved explicitly.
