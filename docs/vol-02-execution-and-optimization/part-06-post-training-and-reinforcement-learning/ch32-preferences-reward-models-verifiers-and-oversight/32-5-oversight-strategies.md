---
id: "ms.section.32.5"
entity_type: "section"
title: "Oversight strategies"
short_title: "Oversight strategies"
volume: 2
part: 6
chapter: 32
section: 32.5
slug: "32-5-oversight-strategies"
parent: "ms.chapter.32"
prev_sibling: "ms.section.32.4"
next_sibling: "ms.section.32.6"
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

# 32.5 — Oversight strategies

## Scope

[DERIVED] Organize constitutional feedback, critique/revision, weak-to-strong supervision and scalable oversight around independent validation. The section owns the authority and information flow of an oversight protocol. Success means the final claim is supported by evidence that the proposing system cannot silently rewrite, not merely that two agents agree. Human judgment remains an observation with a domain and population, while formal or executable checking remains scoped by [§32.4](32-4-outcome-and-process-verification.md).

## Why this exists

[DERIVED] A stronger generator can produce work that its supervisor cannot directly assess. Delegating assessment to another model reduces human effort but creates shared-error and evaluator-manipulation risks. Repeated critique can improve a candidate, or can make it more persuasive to an unchanged weak judge. An oversight strategy must specify what additional evidence it exposes and how that evidence changes the judge's decision.

[OFFICIAL-DOCUMENTATION] Anthropic's January 21, 2026 constitution states intended values and behavioral priorities while acknowledging that actual behavior can diverge. This is a normative training artifact, not a theorem or empirical proof that a model follows its contents. [R32.7, dated PDF, preface and overview].

[DERIVED] The recent eligible studies concern bounded measurement problems, not a general solution for supervising arbitrarily capable systems. Their relevance is methodological: isolate supervision from evaluation, define transfer tests, preserve denied or failed attempts and measure which parts of the workflow actually improve the independently observed target.

## Intuition

[MATHEMATICALLY-DERIVED] Independent evidence can improve inference only if it contains information not already determined by the current observation. Two judges reading the same misleading explanation may share the same error. Distinct model names or random seeds do not prove conditional independence. Critique is useful when it supplies checkable counterexamples, missing constraints or new measurements; agreement alone does not create such evidence.

[DERIVED] A constitution specifies criteria and priorities. A critique maps a candidate to alleged violations of those criteria. A revision changes the candidate. A verifier assesses the revised candidate using a separate evidential boundary. The loop is an algorithmic composition, not a reason to merge the critic's confidence with final acceptance. Keep the candidate generator, critic, rubric author and final evaluator as separately versioned roles even when one implementation serves several roles.


```figure
{
  "id": "fig-32.25",
  "kind": "cycle",
  "title": "Critique and release have different authority",
  "caption": "Development checks can feed bounded revisions. A candidate is frozen before the separate final audit; audit feedback cannot return to the revision loop.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "Development checks feed a bounded critique and revision loop. Its selected candidate is frozen and passed once to a separate final audit, followed by acceptance or abstention. There is no audit edge back to revision. This is an analytical protocol, not a measured model result.",
  "spec": {
    "stages": [
      {
        "id": "gen",
        "label": "Generate",
        "kind": "model"
      },
      {
        "id": "crit",
        "label": "Critique",
        "kind": "process"
      },
      {
        "id": "rev",
        "label": "Revise",
        "kind": "process"
      },
      {
        "id": "verify",
        "label": "Development check",
        "kind": "metric"
      },
      {
        "id": "audit",
        "label": "Frozen candidate audit",
        "kind": "metric"
      },
      {
        "id": "release",
        "label": "Accept or abstain",
        "kind": "state"
      }
    ],
    "edges": [
      {
        "from": "gen",
        "to": "crit"
      },
      {
        "from": "crit",
        "to": "rev"
      },
      {
        "from": "rev",
        "to": "verify"
      },
      {
        "from": "verify",
        "to": "audit",
        "label": "freeze"
      },
      {
        "from": "audit",
        "to": "release"
      },
      {
        "from": "verify",
        "to": "crit",
        "kind": "feedback",
        "label": "bounded rejected revision"
      }
    ]
  }
}
```


## Formulation

| Symbol | Meaning | Condition |
|---|---|---|
| $a_w,a_s,a_*$ | Weak supervisor, supervised student and ground-truth-supervised student performance | Same metric and population |
| $\mathrm{PGR}$ | Performance gap recovered | Denominator strictly positive |
| $E_1,E_2$ | Failure events of two oversight layers | Defined on the same units |
| $n_a$ | Independent audit units | Grouping declared |
| $k_a$ | Fixed candidate rules compared | Finite and prespecified |
| $\delta_a$ | Audit failure probability in a concentration bound | $0<\delta_a<1$ |

[MATHEMATICALLY-DERIVED] When $a_*>a_w$, define

$$
\mathrm{PGR}=\frac{a_s-a_w}{a_*-a_w}.
$$
*(Eq. 32.14)*

This ratio is not restricted to $[0,1]$: it is negative when supervision worsens the weak baseline, and exceeds one when the student exceeds the particular ground-truth-supervised reference. A small denominator makes it unstable. Comparisons across datasets with different denominators require the component scores, not only the normalized ratio.


```figure
{
  "id": "fig-32.26",
  "kind": "calculator",
  "title": "Performance gap recovered",
  "caption": "Eq. 32.14 reports student performance relative to weak and ground-truth-supervised references. The reference is parameterized inside [0,1] as aw+(1-aw)*fraction. PGR can lie outside [0,1]. Inputs are illustrative.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.14",
  "alt": "Eq. 32.14 reports student performance relative to weak and ground-truth-supervised references. The reference is parameterized inside [0,1] as aw+(1-aw)*fraction. PGR can lie outside [0,1]. Inputs are illustrative. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "tex": "\\mathrm{PGR}=(a_s-a_w)/(a_*-a_w)",
    "equation": "32.14",
    "inputs": [
      {
        "symbol": "aw",
        "label": "weak performance",
        "default": 0.55,
        "min": 0,
        "max": 0.99,
        "format": "fixed3"
      },
      {
        "symbol": "fraction",
        "label": "fraction of available reference gap",
        "default": 0.5,
        "min": 0.01,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "ascore",
        "label": "student performance",
        "default": 0.72,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "pgr",
        "label": "gap recovered",
        "formula": "(ascore-aw)/((1-aw)*fraction)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "reference",
        "label": "reference performance",
        "formula": "aw+(1-aw)*fraction",
        "format": "fixed3",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation"
}
```


[MATHEMATICALLY-DERIVED] Two oversight layers fail jointly with

$$
\Pr(E_1\cap E_2)=\Pr(E_1)\Pr(E_2\mid E_1).
$$
*(Eq. 32.15)*

Multiplying marginal failure rates is justified only under independence. For a second judge chosen because it agrees with the first, dependence is induced by selection even if the original models were independently trained. Evaluate the second layer specifically on first-layer failures, rather than inferring redundancy from overall accuracy.

[MATHEMATICALLY-DERIVED] If each of $k_a$ fixed decision rules has independent audit errors in $[0,1]$ across $n_a$ units, a Hoeffding union bound gives

$$
\Pr\left(\max_{j\le k_a}|\hat e_j-e_j|>\epsilon_a\right)
\le2k_a e^{-2n_a\epsilon_a^2},\qquad
\epsilon_a=\sqrt{\frac{\log(2k_a/\delta_a)}{2n_a}}.
$$
*(Eq. 32.16)*

The rules must be fixed independently of the audit observations. An adaptive researcher that changes rules after seeing scores violates that condition. Declaring a large query budget does not automatically restore this bound for arbitrary adaptively generated rules. Group-correlated prompts require an appropriate concentration or resampling design rather than substituting raw row count for independent units.

## Mechanism

[DERIVED] Constitutional feedback starts with a versioned normative specification. Compile each principle into an operational assessment question with permitted evidence and conflict handling. Preserve the distinction between hard constraints and compensable preferences. A weighted average can permit a high helpfulness score to cancel a constraint violation; lexicographic or constrained decisions express a different normative rule. Neither choice is dictated by the text alone, so the artifact must expose it.

[DERIVED] Critique/revision can be tested as a causal intervention on a candidate-production process. Hold the initial candidate and revision budget fixed; compare no critique, self-critique, independent critique and an evidence-bearing critique. The final evaluator must be independent of the critic's training and proposal selection to the degree claimed. A critique that includes new executable tests changes the available evidence; a purely rhetorical rewrite can change judge preference without changing task correctness. Report both.

[DERIVED] Weak-to-strong supervision asks whether the student's existing representation supports a target beyond the supervisor's errors. Training only to imitate weak labels can preserve systematic mistakes. A formal noise-channel model makes the missing identifiability explicit: with latent correct label $Z$ and weak label $W$, observing $W$ alone cannot determine both the class distribution and the channel $P(W\mid Z,X)$ without additional structure. A confident student prediction is not a gold label unless some separate assumption or measurement justifies it.

[MATHEMATICALLY-DERIVED] At a fixed input $X$, let $p_\star=P(Z=1\mid X)\in(0,1)$ be the declared conditional class prior. With a known weak-label channel and positive likelihoods for the observed $w$, posterior odds satisfy

$$
\frac{P(Z=1\mid W=w,X)}{P(Z=0\mid W=w,X)}=
\frac{p_\star}{1-p_\star}\,
\frac{P(W=w\mid Z=1,X)}{P(W=w\mid Z=0,X)}.
$$
*(Eq. 32.17)*

If prior and channel are estimated from the same noisy labels, the identity does not make them identifiable. Cross-fitting can avoid using an example to train its own predictor, but cannot independently prove that the learned channel is correct. Retain ground-truth evaluation outside the label-refinement loop. This is a mathematical account of a possible model, not an assertion about undisclosed model internals.


```figure
{
  "id": "fig-32.27",
  "kind": "diagram",
  "title": "Noisy supervision is a latent channel",
  "caption": "A weak label and a student prior inform a latent target only under a specified noise-channel model; held-out ground truth remains outside the refinement loop.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "A weak label and a student prior inform a latent target only under a specified noise-channel model; held-out ground truth remains outside the refinement loop. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "latent",
        "kind": "state",
        "label": "Latent correct label",
        "sub": "Z"
      },
      {
        "id": "weak",
        "kind": "dataset",
        "label": "Weak observation",
        "sub": "W"
      },
      {
        "id": "prior",
        "kind": "model",
        "label": "Student prior",
        "sub": "independent information?"
      },
      {
        "id": "posterior",
        "kind": "process",
        "label": "Posterior refinement",
        "sub": "declared channel"
      },
      {
        "id": "test",
        "kind": "metric",
        "label": "Held-out truth",
        "sub": "evaluation only"
      }
    ],
    "edges": [
      {
        "from": "latent",
        "to": "weak",
        "label": "noise channel"
      },
      {
        "from": "weak",
        "to": "posterior"
      },
      {
        "from": "prior",
        "to": "posterior"
      },
      {
        "from": "latent",
        "to": "test"
      }
    ]
  }
}
```


[DERIVED] Scalable oversight decomposes work into objects with checkable interfaces. A decomposition helps only if its local checks compose into the target property. A debate or critic protocol changes which evidence reaches the judge; it does not certify that a weak judge can recognize the decisive evidence. An independent final evaluator can itself be incomplete. The protocol should state escalation and abstention rather than force an answer when supervision is inadequate.

[DERIVED] Deferral is a decision problem distinct from training a judge. Let $d_\psi(z)$ estimate whether a cheaper evaluator's answer is correct from observable score features $z$. A frozen rule accepts when $d_\psi(z)\ge b_d$ and otherwise escalates. Its risk is $\Pr(\mathrm{wrong}\mid\mathrm{accepted})$, its coverage is $\Pr(\mathrm{accepted})$, and its work includes both the first evaluator and the escalated fraction. A correctness head trained on one rubric can fail under another even if the original reward scores remain useful. Candidate generation, correctness-head fitting, threshold selection and independent audit require separate data roles. An exact confidence bound describes the frozen accepted subset; repeatedly adjusting the threshold on that same audit invalidates the original interpretation.

## Algorithm

[DERIVED] Algorithm 32.5 is an explicit proposed loop with bounded revisions and a separately owned final checker. It preserves normative criteria, candidate lineage and evaluator authority.

**Algorithm 32.5 — Critique, bounded revision and independent release.** Inputs are task $x$, frozen constitution/rubric $c_v$, candidate generator $G_v$, critic $K_v$, development verifier $V_w$, final auditor $A_a$, positive revision cap $j_{\max}$ and isolated audit data. Each generation and checker call has its own finite token/runtime allowance and typed failure result. The output is the accepted candidate with its evidence, or a scoped abstention. The critic has no write access to either checker. Development feedback may guide revisions; the final auditor and its data remain unavailable until the candidate is frozen.

$$
\begin{aligned}
(1)\;&y_0\leftarrow G_v(x);\quad j\leftarrow0;\quad\mathcal H_0\leftarrow\{y_0\};\quad y_*\leftarrow\varnothing.\\
(2)\;&k_j\leftarrow K_v(x,y_j,c_v);\quad\text{record critique provenance}.\\
(3)\;&\tilde y_j\leftarrow\operatorname{Revise}_v(x,y_j,k_j,c_v).\\
(4)\;&o_j\leftarrow V_w(x,\tilde y_j)\quad\text{in fresh external state}.\\
(5)\;&\text{if }o_j=\mathrm{ACCEPT}:\ y_*\leftarrow\operatorname{Freeze}(\tilde y_j);\quad\text{exit revision loop}.\\
(6)\;&\text{if }o_j\in\{\mathrm{ERROR},\mathrm{UNKNOWN}\}:\text{ return ABSTAIN}(o_j).\\
(7)\;&\text{if }\tilde y_j\in\mathcal H_j:\text{ return ABSTAIN}(\text{revision cycle}).\\
(8)\;&y_{j+1}\leftarrow\tilde y_j;\quad\mathcal H_{j+1}\leftarrow\mathcal H_j\cup\{\tilde y_j\};\quad j\leftarrow j+1.\\
(9)\;&\text{repeat lines 2--8 while }j<j_{\max}.\\
(10)\;&y_*=\varnothing\Longrightarrow\text{return ABSTAIN}(\text{revision budget exhausted}).\\
(11)\;&o_*\leftarrow A_a(x,y_*)\quad\text{once, using isolated audit state/data}.\\
(12)\;&\text{return }\begin{cases}(y_*,o_*,v,w,a),&o_*=\mathrm{ACCEPT},\\
\mathrm{ABSTAIN}(o_*),&\text{otherwise; no revision or reselection after audit}.\end{cases}
\end{aligned}
$$

Every returned development verdict, including a binary rejection, can influence the next revision. Withholding a scalar score alone does not make repeated checker queries an independent audit. Only line 11 uses the final audit procedure, after selection is frozen; its result cannot restart this loop. This is a proposed composition, not a reproduction of Constitutional AI. A constitution fixes normative criteria but supplies no logical acceptance theorem. The invariant is unchanged evaluator authority and target identity through every revision.

[DERIVED] The revision cap prevents indefinite persuasion/search against one evaluator. Cycle detection prevents repeated identical artifacts from consuming the budget without progress. Neither guard proves improvement. A protocol can legitimately return no acceptable candidate; abstention coverage and cost remain part of the reported outcome.

## Implementation

[DERIVED] Separate proposing and evaluation processes by actual data permissions. A hidden test label in the same filesystem account is hidden only by convention. An aggregate scoring API still leaks information through repeated queries, timing and overly granular diagnostics; log the query budget and the information returned. Retain rejected code submissions and their reason so evaluation integrity can be reviewed rather than reporting only successful methods.

[DERIVED] Freeze a method description, code hash and training-data manifest before seeing its evaluation result. Approval binds to that version; changing code after approval creates a new candidate. Human review should focus on load-bearing choices and target definitions, while deterministic artifact checks enforce identity. A model-based monitor adds a probabilistic judgment and needs its own false-positive/false-negative analysis; its presence is not equivalent to an access-control boundary.

[MATHEMATICALLY-DERIVED] For a path reaching the final audit, let the initial candidate use $t_0$ generated tokens, each of $j$ revisions use $t_g$ new generator tokens and $t_k$ critique tokens, each development check cost $c_v$, and the final audit cost $c_a$. The declared fixed-count model then uses $t_0+j(t_g+t_k)$ generated tokens and $jc_v+c_a$ checker work. Variable lengths and early exits require their actual sums instead. Sharing prefixes can reduce repeated encoding; it cannot erase newly generated tokens or checker invocations. Parallel candidate search changes latency and peak memory but preserves total work accounting. Parameters are those of generator, critic and learned verifier; text constitutions add context tokens, not trainable parameters by themselves. Energy, billing cost and achieved throughput are UNVERIFIED without measured execution.


```figure
{
  "id": "fig-32.28",
  "kind": "systems-trace",
  "title": "Oversight information and authority",
  "caption": "The proposed execution trace distinguishes candidate access, evaluation state and retained evidence; this is an analytical protocol rather than a reported production implementation.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.0",
  "alt": "The proposed execution trace distinguishes candidate access, evaluation state and retained evidence; this is an analytical protocol rather than a reported production implementation. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "columns": [
      "compute",
      "memory",
      "communication",
      "failure"
    ],
    "stages": [
      {
        "name": "Proposal",
        "values": {
          "compute": "generation",
          "memory": "candidate state",
          "communication": "method and code hash",
          "failure": "description/code mismatch"
        }
      },
      {
        "name": "Bounded training",
        "values": {
          "compute": "declared cap",
          "memory": "optimizer and weights",
          "communication": "model artifact",
          "failure": "unauthorized data"
        }
      },
      {
        "name": "Independent evaluation",
        "values": {
          "compute": "checker/judge",
          "memory": "isolated fixtures",
          "communication": "bounded aggregate score",
          "failure": "adaptive information leak"
        }
      },
      {
        "name": "Release audit",
        "values": {
          "memory": "immutable ledger",
          "communication": "scope and unresolved gaps",
          "failure": "selective reporting"
        }
      }
    ]
  }
}
```


## Experimental design

[PAPER-REPORTED] The actual studies use different optimization and audit budgets.

| Source | Method/testbed | Selection and uncertainty |
|---|---|---|
| R32.6, §1/3.4–3.5/§5 | Qwen1.5-0.5B-Chat weak/Qwen3-4B-Base strong; chat hill-climbing, math/coding transfer | Unlimited score-API submissions make chat ID/OOD splits adaptive validation; reported seed selection and label extraction; math/code transfer allows hyperparameter tuning; production Sonnet4.0: +0.5 point within noise |
| R32.9, §2–5/Appendix B | Five Opus 4.8 researchers, 48 hours; each training proposal approximately 30 minutes/H200 | Hidden/capability checks; human proposals cannot iterate; not a matched iterative comparison |
| R32.13, §4.3–5 | Skywork reward Qwen3 ladder 0.6B→4B→8B; 14-feature logistic correctness heads; 1,763 non-tie tasks | Disjoint fitting/calibration/test; 102 ties excluded from routing; 3% calibration buffer versus 5% test risk, exact one-sided 95% bound; adaptive scanning is heuristic |

## Observations

**What the paper claims.** [PAPER-REPORTED] The weak-to-strong report finds strong small-model testbed performance but limited production transfer in the attempted setting. Its §5 explicitly describes iterative seed selection and extraction of test labels through differences in remote scores; the authors treat the repeatedly queried chat test as validation with an OOD split. Math/code migration permits hyperparameter tuning while freezing the method's components. The deferral study separately distinguishes routing correctness from reward scoring. [R32.6, §1, §3.4–3.5, §5; R32.13, §6].

**What the evidence shows.** [DERIVED] The weak-to-strong report's queried chat scores are adaptive validation evidence, even where examples were initially withheld from fitting. OOD membership does not remove selection through repeated score feedback. Its transfer experiments test narrower migration claims under allowed tuning, and the attempted production gain remains within noise. These boundaries and the deferral study's separate audit support only the tested workflows; they do not establish general automated oversight or replacement of human authority by model agreement.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 32.15 requires the conditional failure rate of the second layer on the first layer's failures. Evaluating only its marginal accuracy cannot quantify the composite control.

**What remains unknown.** [UNVERIFIED] General weak-to-strong identifiability, robustness after extensive new optimization and integrity against unanticipated adaptive channels remain unresolved.

## Failure modes

[DERIVED] Failure signatures include improving judge scores without independent utility gains, critiques that merely repeat the target answer, declining coverage hidden by higher accepted-set accuracy, and secret-label access through an evaluation interface. Production transfer can fail when the student's useful prior signal is absent even if a small testbed succeeds. An audit bound for fixed rules cannot be reused after adaptive changes.


```figure
{
  "id": "fig-32.29",
  "kind": "stat-panel",
  "title": "Composite oversight failure",
  "caption": "Eq. 32.15 makes the second layer conditional on first-layer failures. The illustrative state change preserves the first-layer rate while altering conditional failure.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.15",
  "alt": "Eq. 32.15 makes the second layer conditional on first-layer failures. The illustrative state change preserves the first-layer rate while altering conditional failure. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "header": "CONTROL DEPENDENCE",
    "variables": {
      "p1": 0.1,
      "pcond": 0.1
    },
    "rows": [
      {
        "key": "first-layer failure",
        "formula": "p1"
      },
      {
        "key": "second given first",
        "formula": "pcond"
      },
      {
        "key": "joint failure",
        "formula": "p1*pcond"
      }
    ]
  },
  "anchor": "mechanism",
  "states": [
    {
      "anchor": "mechanism",
      "label": "Complementary layer",
      "variables": {
        "pcond": 0.1
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Shared blind spot",
      "variables": {
        "pcond": 0.9
      },
      "highlight": [
        "joint failure"
      ]
    }
  ]
}
```


## Siblings

[DERIVED] Constitutional criteria change normative specification; critique/revision changes candidate construction; weak-to-strong learning changes how imperfect labels update a model; deferral changes when evidence is trusted. [Feedback ontology](32-1-feedback-ontology.md) retains their source types, and [verification](32-4-outcome-and-process-verification.md) retains their correctness boundary. Combining these methods adds interfaces; it does not merge their guarantees.

## Extensions

[OFFICIAL-DOCUMENTATION] OpenAI's April 23, 2026 monitorability release adds a cross-fit filtering strategy and reference metric code; restricted evaluations are omitted. Treat it as a dated evaluation artifact, not a new publication date for the December 2025 original study. [R32.11, release and robustness discussion].

[DERIVED] Cross-fitting separates selection from estimation but does not make a behavioral trace causally complete. An external state audit can complement trace monitoring; neither text plausibility nor a clean transcript replaces checking what the system actually changed.


```figure
{
  "id": "fig-32.30",
  "kind": "chart",
  "title": "Fixed-rule audit multiplicity",
  "caption": "Eq. 32.16 shows the independent-unit bound for a fixed family of rules. It does not cover arbitrary rules adapted to the same audit data.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-32.16",
  "alt": "Eq. 32.16 shows the independent-unit bound for a fixed family of rules. It does not cover arbitrary rules adapted to the same audit data. The structure is an analytical construction; it is not a measured result for a named model.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "fixed candidate rules",
      "domain": [
        1,
        1000
      ]
    },
    "y": {
      "label": "absolute error bound"
    },
    "variables": {},
    "series": [
      {
        "id": "bound",
        "label": "n = 1000, delta = 0.05",
        "formula": "sqrt(ln(2*x/0.05)/(2*1000))",
        "sample": {
          "from": 1,
          "to": 1000,
          "count": 334
        },
        "emphasis": true
      }
    ],
    "annotations": [
      {
        "x": 1000,
        "y": 0.07278954160144187,
        "label": "Bound requires rules fixed before independent audit"
      }
    ]
  }
}
```


## Limitations

[DERIVED] The oversight framework has no general guarantee for tasks whose target cannot be operationalized or whose decisive evidence the supervisor cannot recognize. A constitution supplies criteria, not empirical adherence. Automated experimentation scales search volume while making integrity and adaptive overfitting more important. Independent validation must be independence in data and authority, with statistical dependence still measured.

## Reproducibility

[DERIVED] Archive role prompts, rubric/constitution versions, initial candidates, all critiques and revisions, code/data hashes, denied attempts, evaluation permissions, query budgets and returned information. Report raw component scores with PGR, conditional monitor failures, accepted coverage and total generated/checker work. The proposed book loop has not been executed; the experiments above remain source-reported.

## References

[R32.6] Automated Weak-to-Strong Researcher. [R32.7] January 2026 constitution. [R32.9] Automated alignment researchers. [R32.11] April monitorability release. [R32.13] Shared judge/audited deferral. Each is an eligible 2026 primary artifact.
