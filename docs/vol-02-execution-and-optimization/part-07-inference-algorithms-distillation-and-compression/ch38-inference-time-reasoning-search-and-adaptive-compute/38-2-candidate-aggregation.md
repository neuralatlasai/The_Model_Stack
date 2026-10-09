---
id: "ms.section.38.2"
entity_type: "section"
title: "Candidate aggregation"
short_title: "Candidate aggregation"
volume: 2
part: 7
chapter: 38
section: 38.2
slug: "38-2-candidate-aggregation"
parent: "ms.chapter.38"
prev_sibling: "ms.section.38.1"
next_sibling: "ms.section.38.3"
children: []
prerequisites: ["ms.chapter.6", "ms.chapter.32", "ms.chapter.35", "ms.chapter.37"]
downstream: ["ms.chapter.39", "ms.chapter.47", "ms.chapter.61", "ms.chapter.63", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["inference", "evaluation", "assurance"], "mechanism": ["search", "verification", "adaptive_compute"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2300
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 38.2 — Candidate aggregation

## Scope

[DERIVED] Candidate aggregation converts a finite set of sampled responses into one answer. This section owns self-consistency, plurality and strict-majority voting, best-of-$N$, confidence-weighted voting, correlated-error effects and verifier-driven selection. The generator, answer-equivalence map and selector are separate components. A correct candidate somewhere in the set is an oracle coverage event; it is not evidence that the deployed selector will return it. Training improvements remain owned by Chapter35, while the independent evaluator's validity remains owned by Chapter32.

[DERIVED] The central deliverable is a selector contract that states which candidates are admissible, how answers are normalized, which scores are available at deployment, how ties are broken and what happens when all candidates are invalid or unscored. Ground-truth evaluation labels cannot be used as selection features unless the application actually has that checking capability and its cost is included.

## Why this exists

[DERIVED] Sampling can expose a correct answer the model produces infrequently. Aggregation can discard idiosyncratic mistakes. Neither effect is automatic. Repeated candidates can share one persuasive error; a confidence model can rank fluent errors above correct terse answers; normalization can merge distinct quantities or split equivalent expressions. Increasing $N$ raises both the opportunity to find a correct candidate and the opportunity to exploit a selector's blind spots.

[DERIVED] Evaluation often conflates these mechanisms by reporting only pass@$N$. The gap between oracle coverage and selected-answer accuracy is itself a measurable engineering quantity. A generator with broad coverage and a poor verifier needs a different intervention from a generator whose candidates never reach the correct answer. Aggregate vote entropy alone cannot identify which case applies.

## Intuition

[DERIVED] A vote counts probability mass assigned to an answer class, not the number of distinct reasoning paths that reached it. Ten paraphrases of one derivation can produce ten votes. A mathematical answer with several correct equivalent forms needs a sound canonicalizer; an overaggressive parser can manufacture agreement by dropping units or signs. Self-consistency is therefore repeated sampling plus a declared equivalence relation plus a selection rule, rather than a synonym for reliable reasoning.

[DERIVED] Best-of-$N$ selects one candidate by a scorer. Weighted voting instead accumulates candidate weights within answer classes. These methods can disagree even with the same scores: two moderate-scored candidates supporting one answer can outweigh a single high-scored candidate, while best-of-$N$ returns the singleton. The choice should follow a model of what scores mean, not an interchangeable implementation label.


```figure
{
  "id": "fig-38.7",
  "kind": "diagram",
  "title": "Coverage precedes selection",
  "caption": "Candidate generation, equivalence mapping and deployment selection are separate from independent evaluation.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.4",
  "alt": "Candidate generation, equivalence mapping and deployment selection are separate from independent evaluation. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "model",
        "label": "Frozen generator"
      },
      {
        "id": "n1",
        "kind": "tensor",
        "label": "Candidate occurrences"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Answer equivalence"
      },
      {
        "id": "n3",
        "kind": "branch",
        "label": "Vote / scorer"
      },
      {
        "id": "n4",
        "kind": "state",
        "label": "Selected answer"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Independent outcome"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2"
      },
      {
        "from": "n2",
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4"
      },
      {
        "from": "n4",
        "to": "n5",
        "label": "evaluate"
      }
    ]
  }
}
```


## Formulation

> **Definition — Candidate coverage.** The event that at least one admissibly sampled candidate satisfies an independent correctness predicate, irrespective of whether the deployed selector can identify it.

[MATHEMATICALLY-DERIVED] For a fixed prompt $x$, let $C_i\in\{0,1\}$ denote correctness under a frozen evaluator. If $C_i$ are iid Bernoulli with probability $p_x$,

$$
P(\max_{i\le N}C_i=1\mid x)=1-(1-p_x)^N.
$$
*(Eq. 38.4)*

For heterogeneous prompts, average this expression over $x$; replacing $p_x$ by its mean is generally wrong. Conditional independence does not eliminate between-prompt heterogeneity. The expression is an oracle coverage probability, not best-of-$N$ accuracy under a fallible verifier.

[MATHEMATICALLY-DERIVED] Under the same iid binary model, the probability that a strict majority of $N$ candidates is correct is

$$
M_N(p_x)=\sum_{j=\lfloor N/2\rfloor+1}^{N}{N\choose j}p_x^j(1-p_x)^{N-j}.
$$
*(Eq. 38.5)*

If every correct response maps to one answer class, this is a sufficient event for plurality correctness. It is not generally the exact plurality probability: wrong answers may split across classes, allowing a correct minority to win. For even $N$, tie handling also matters. In the binary odd-$N$ setting, increasing $N$ helps asymptotically when $p_x>1/2$ and reinforces the wrong class when $p_x<1/2$.


```figure
{
  "id": "fig-38.8",
  "kind": "calculator",
  "title": "Oracle coverage and effective size",
  "caption": "Eqs38.4 and38.6 compare iid coverage with a variance-based effective count. The latter is not a correlated coverage estimate.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.4",
  "alt": "Eqs38.4 and38.6 compare iid coverage with a variance-based effective count. The latter is not a correlated coverage estimate. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "38.4",
    "tex": "P_{\\rm cover}=1-(1-p)^N",
    "inputs": [
      {
        "symbol": "p",
        "label": "Per-prompt success",
        "default": 0.3,
        "min": 0.001,
        "max": 0.999,
        "format": "raw"
      },
      {
        "symbol": "N",
        "label": "Candidate count",
        "default": 8,
        "min": 1,
        "max": 64,
        "format": "integer",
        "options": [
          1,
          2,
          4,
          8,
          16,
          32,
          64
        ]
      },
      {
        "symbol": "rho",
        "label": "Marginal correlation",
        "default": 0.1,
        "min": 0,
        "max": 0.9,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "cover",
        "label": "iid oracle coverage",
        "formula": "1-(1-p)^N",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "eff",
        "label": "Variance effective count",
        "formula": "N/(1+(N-1)*rho)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "var",
        "label": "Mean correctness variance",
        "formula": "p*(1-p)*(1+(N-1)*rho)/N",
        "format": "raw",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "iid diagnostic",
      "variables": {
        "rho": 0,
        "N": 8
      }
    },
    {
      "anchor": "mechanism",
      "label": "Positive correlation",
      "variables": {
        "rho": 0.2,
        "N": 8
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Many correlated outcomes",
      "variables": {
        "rho": 0.5,
        "N": 32
      }
    }
  ]
}
```


[MATHEMATICALLY-DERIVED] For exchangeable Bernoulli correctness indicators with common marginal $p$ and pairwise correlation $\rho$, variance of their average is

$$
\operatorname{Var}(\bar C)=\frac{p(1-p)}N[1+(N-1)\rho],\qquad
N_{\rm eff}=\frac{N}{1+(N-1)\rho}.
$$
*(Eq. 38.6)*

The effective sample size is a variance identity, not a corrected pass@$N$ formula. Not every nominal correlation is feasible for every finite joint distribution. Positive marginal correlation can arise solely from a mixture of easy and hard prompts even when samples are independent conditional on each prompt.

## Mechanism

### Methodology

[DERIVED] **Self-consistency and plurality.** Parse each completed candidate to an answer key $a_i=\kappa(x,y_i)$ and count $n_a$. Return the largest count under a frozen tie rule. Retain parse failures and answer rates. A strict-majority threshold can instead abstain whenever $\max_a n_a\le N/2$; this trades coverage for a property of agreement, not a formal correctness guarantee. Deduplicating candidates before voting changes the estimator from probability-mass aggregation to a support-based rule and must be reported.

[MATHEMATICALLY-DERIVED] **Weighted voting.** With nonnegative, deployment-available weights $w_i$, choose

$$
\hat a_w=\arg\max_a\sum_{i=1}^Nw_i\mathbf1\{a_i=a\}.
$$
*(Eq. 38.7)*

A probability of correctness is not automatically the optimal weight. In a binary latent-label model with conditionally independent voters, known symmetric accuracies $q_i\in(0,1)$, equal label priors and answers $s_i\in\{-1,1\}$, posterior log odds are $\sum_i s_i\log[q_i/(1-q_i)]$. Those assumptions produce log-odds weights; learned LLM confidence scores usually do not establish them. If $q_i<1/2$, optimal model-based weights can be negative, outside Eq.38.7's nonnegative contract. Shared contexts and correlated voters invalidate the factorization.

[DERIVED] **Best-of-$N$.** Select $i^*=\arg\max_i s_v(x,y_i)$, with scorer identity, precision and ties frozen. An outcome scorer estimates final utility; a process scorer assesses intermediate steps. Taking a minimum or product of process scores imposes an additional trajectory reduction that can favor short paths. A deterministic test suite checks the supplied cases and may still miss semantic errors. Reusing the same scorer during search and final selection increases adaptive pressure on that scorer.

[MATHEMATICALLY-DERIVED] If true candidate utility $u_i$ and proxy score $s_i$ satisfy a uniform error bound $|s_i-u_i|\le\epsilon$ on the entire searched set, then

$$
\max_i u_i-u_{i^*}\le2\epsilon.
$$
*(Eq. 38.8)*

The proof is $u_{i^\star}\le s_{i^\star}+\epsilon\le s_{i^*}+\epsilon\le u_{i^*}+2\epsilon$. A validation-set average calibration error does not supply this uniform bound, especially after optimization expands the selected tail. Adaptive exploitation can increase error precisely where selection concentrates.


```figure
{
  "id": "fig-38.9",
  "kind": "chart",
  "title": "Coverage is not strict-majority accuracy",
  "caption": "Eqs38.4–38.5 for three iid candidates compare oracle coverage and binary strict-majority probability.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.5",
  "alt": "Eqs38.4–38.5 for three iid candidates compare oracle coverage and binary strict-majority probability. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "line",
    "x": {
      "label": "per-prompt success probability",
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
    "y": {
      "label": "probability",
      "domain": [
        0,
        1
      ]
    },
    "series": [
      {
        "id": "n0",
        "label": "Any correct",
        "formula": "1-(1-x)^3",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 101
        },
        "emphasis": true
      },
      {
        "id": "n1",
        "label": "Strict majority correct",
        "formula": "3*x^2*(1-x)+x^3",
        "sample": {
          "from": 0,
          "to": 1,
          "count": 101
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0.5,
        "y": 0.875,
        "label": "Coverage7/8 at p=1/2"
      },
      {
        "x": 0.5,
        "y": 0.5,
        "label": "Majority1/2 at p=1/2"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] With an assumed per-candidate false-accept event of probability $f$, independent events give $1-(1-f)^N$ probability of at least one false acceptance. Without independence, the union bound gives

$$
P(\cup_i F_i)\le\min(1,\sum_i P(F_i)).
$$
*(Eq. 38.9)*

Neither quantity equals final selected-answer error without a selection model. A false acceptance may lose to another candidate; a correct candidate may be rejected. Report the checker confusion profile and selection-conditioned outcomes separately.

## Algorithm

**Algorithm 38.2 — Bounded candidate aggregation with explicit score availability.** Inputs are an integer requested count $N\ge1$, nonnegative enforceable generation/check bounds and finite deadlines, resource ceiling $\mathbf B$, equivalence map $\kappa$, validated selector mode $m\in\{\mathrm{PLURALITY},\mathrm{BEST},\mathrm{WEIGHTED}\}$, and frozen tie order. State is an attempt ledger $H$, admissible keys $A$ and scored candidates $S$.

$$
\begin{aligned}
1.\;&i\gets0;\ H,A,S\gets\varnothing;\ \mathbf c\gets\mathbf0.\\
2.\;&\textbf{while }i<N:\ \iota\gets\mathrm{UniqueID}(x,i);\quad
 \mathbf c+\mathbf u_{\rm gen}+\mathbf u_{\rm check}\nleq\mathbf B\Rightarrow\textbf{break}.\\
3.\;&\mathrm{Reserve}(\iota,\mathbf u_{\rm gen}+\mathbf u_{\rm check});\quad
 (y,z,\mathbf d)\gets\mathrm{GenerateCapped}(x,\iota);\ \mathbf c\gets\mathbf c+\mathbf d.\\
4.\;&z\ne\mathrm{COMPLETE}\Rightarrow H\gets H\cup\{(\iota,z,\mathbf d)\};\
 \mathrm{ReleaseUnused}(\iota);\ i\gets i+1;\ \textbf{continue}.\\
5.\;&a\gets\kappa(x,y);\quad a=\bot\Rightarrow
 H\gets H\cup\{(\iota,\mathrm{INVALID},\mathbf d)\};\
 \mathrm{ReleaseUnused}(\iota);\ i\gets i+1;\ \textbf{continue}.\\
6.\;&(s,z_V,\mathbf e)\gets\mathrm{ScoreCapped}(m,x,y);\ \mathbf c\gets\mathbf c+\mathbf e;\quad
 H\gets H\cup\{(\iota,y,a,s,z_V,\mathbf d+\mathbf e)\};\ A\gets A\cup\{(\iota,a)\}.\\
7.\;&z_V=\mathrm{KNOWN}\land s\text{ finite}\land[m\ne\mathrm{WEIGHTED}\lor(0\le w(s)<\infty)]\Rightarrow S\gets S\cup\{(\iota,a,s)\};\quad
 \mathrm{ReleaseUnused}(\iota);\ i\gets i+1.\\
8.\;&H\gets H\cup\{\mathrm{COLLECTION}(N,i,\ |A|,\ |S|,\ i<N\ ?\ \mathrm{BUDGET\_STOPPED}:\mathrm{COMPLETE})\};\\
9.\;&m=\mathrm{PLURALITY}\land A\ne\varnothing\Rightarrow
 \textbf{return }(\mathrm{TieArgMax}_a\sum_{(\iota,b)\in A}\mathbf1\{b=a\},H,\mathbf c).\\
10.\;&m\in\{\mathrm{BEST},\mathrm{WEIGHTED}\}\land S=\varnothing\Rightarrow
 \textbf{return }(\mathrm{ABSTAIN},H,\mathbf c);\quad A=\varnothing\Rightarrow\textbf{return }(\mathrm{ABSTAIN},H,\mathbf c).\\
11.\;&m=\mathrm{BEST}\Rightarrow\textbf{return }(a_{\mathrm{TieArgMax}_{S}s},H,\mathbf c);\quad
 \textbf{return }(\mathrm{TieArgMax}_a\sum_{(\iota,b,s)\in S}w(s)\mathbf1\{b=a\},H,\mathbf c).
\end{aligned}
$$

[DERIVED] In plurality mode ScoreCapped returns a known constant at zero model-call cost. In weighted mode $w$ is frozen, finite and nonnegative; any invalid weight produces UNKNOWN and is excluded from $S$ while retained in $H$. Exclusion of unknown scores is a declared selection policy, not an evaluator label. Best-of-$N$ returns a scored candidate, while a vote returns an answer key plus its representative provenance. Partial collection returns its actual count and budget-stopped status; it cannot be presented as the complete fixed-$N$ iid experiment of Eq.38.4.

## Implementation

[DERIVED] Normalize answers with type-aware rules. Compare quantities together with units and tolerances; preserve exact arithmetic where possible; distinguish an omitted answer from a valid zero. Code candidates require sandboxed tests whose cost and timeout statuses remain visible. A learned scorer must receive the same serialization in development and deployment. Batched verifier calls can reduce overhead while changing numerical and scheduling behavior; record batching rather than assuming one call is one constant-cost event.

[DERIVED] Candidate independence is an execution claim that requires distinct randomness and no unintended mutable sampler state. Error independence is a statistical claim about outcomes under a population. They are different. Even perfectly independent samples from the same wrong-biased answer distribution can agree on one error. The wrong-answer collision probability $\sum_{a\ne a^\star}P(a\mid C=0,x)^2$ measures concentration, not cross-sample dependence. Avoid calling every concentrated distribution a failure of sampler independence.


```figure
{
  "id": "fig-38.10",
  "kind": "chart",
  "title": "Answer mass across three classes",
  "caption": "Eq.38.7 worked vote counts are A6,B1,C1 across eight candidate occurrences. A dominant class can contain repeated derivations; no correctness labels are encoded.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.7",
  "alt": "A categorical bar chart gives classA six votes and classesB andC one each. The bars encode answer mass, not independent strategies or correctness.",
  "spec": {
    "type": "bar",
    "categories": [
      "Class A",
      "Class B",
      "Class C"
    ],
    "x": {
      "label": "normalized answer class"
    },
    "y": {
      "label": "candidate occurrences",
      "domain": [
        0,
        8
      ],
      "format": "integer"
    },
    "series": [
      {
        "id": "n0",
        "label": "Unweighted vote count",
        "values": [
          6,
          1,
          1
        ],
        "emphasis": true
      }
    ]
  }
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] The September2026 aggregation study tests mode toggles at fixed weights and multiple confidence selectors. [R38.7](references.md)

| Field | Source protocol: §3; AppendicesA,B,D,H |
|---|---|
| Models | Qwen3-8B/32B, each thinking/non-thinking; Olmo3-Think7B/32B; Gemma3-12B/27B |
| Data | MATH500, AIME90, AMC83, GPQA198, MMLU-Pro300; selector fit on MATH500 |
| Sampling/evaluator | Eight draws; temperature0.6, top-p0.95, cap32768; normalized numeric/option exact match; vLLM0.27.1 |
| Uncertainty | Problem-cluster bootstrap; one Holm–Bonferroni family of280 selector comparisons |
| Observation | No corrected significant weighted-selector gain; Qwen8B MATH wrong-answer collision0.509 thinking versus0.379 non-thinking |
| Gaps | Hardware/precision, per-run sampling seeds and full cost boundary: NOT-DISCLOSED in cited protocol |

[DERIVED] The observed concentration is compatible with conditionally independent draws. The ten dataset-scale signs also share two weight pairs; they should not be treated as ten independent model replications. Source rescue-rate comparisons have limited power, and a null significant improvement is not proof of exact selector equivalence.

## Observations

**What the paper claims.** [PAPER-REPORTED] Confidence-weighted aggregation did not recover a robust improvement over the unweighted vote under the inspected study. [R38.7](references.md)

**What the evidence shows.** [PAPER-REPORTED] The source records a fixed-weight concentration pattern and a corrected selector null, with limited-power rescue comparisons rather than a confirmed universal voting penalty. [R38.7](references.md)

**What we infer.** [DERIVED] Measure selected decisions, oracle coverage and wrong-answer concentration separately. A discrimination score can rank examples without improving the candidate-level decision that deployment actually makes.

**What remains unknown.** [UNVERIFIED] Neither this study nor the iid derivations establishes an optimal selector for new model families, evidence sources or task distributions.

## Failure modes

[DERIVED] A model can have $p_x<1/2$ and place most error mass on one answer, making more voting harmful. A scorer can be calibrated on ordinary candidates but unreliable on its maximizers. A parser can remove the distinction the evaluator cares about. Shared retrieval can cause all candidates to cite the same false claim. A selector tuned repeatedly on a test set can absorb its answer distribution even without seeing complete labels. These failures need different remedies; increasing $N$ alone addresses none of them by theorem.


```figure
{
  "id": "fig-38.11",
  "kind": "compare",
  "title": "Three selection contracts",
  "caption": "Oracle coverage uses evaluator labels unavailable to an ordinary deployed selector.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.4",
  "alt": "Oracle coverage uses evaluator labels unavailable to an ordinary deployed selector. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Plurality"
      },
      {
        "id": "n1",
        "label": "Best of N"
      },
      {
        "id": "n2",
        "label": "Oracle coverage"
      }
    ],
    "rows": [
      {
        "dimension": "Information",
        "values": {
          "n0": "Answer counts",
          "n1": "Deployment scorer",
          "n2": "True labels"
        }
      },
      {
        "dimension": "Returns",
        "values": {
          "n0": "Answer class",
          "n1": "Candidate",
          "n2": "Existence event"
        }
      },
      {
        "dimension": "Failure",
        "values": {
          "n0": "Shared wrong answer",
          "n1": "Proxy exploitation",
          "n2": "Not a deployment rule"
        }
      }
    ]
  }
}
```


## Siblings

[DERIVED] Chapter35 owns pass@$k$ estimation and capability claims; §38.6 develops frontier-level reporting. §38.3 owns search that adaptively chooses intermediate candidates. §38.4 owns choosing how many attempts to buy. Chapter32 owns verifier calibration, failure analysis and independent final evaluation.

## Extensions

### Improvements

[DERIVED] Compare heterogeneous generators only after charging their different prefills and decoding costs. Use a development-trained selector with explicit shift tests, including cases where score orientation reverses. Improve candidate diversity through evidence or model diversity only when the resulting gains survive matched-resource evaluation. Report abstention coverage and unknown-score rates so a selector cannot improve apparent accuracy by silently dropping difficult cases.


```figure
{
  "id": "fig-38.12",
  "kind": "chart",
  "title": "Wrong answers concentrate in a matched weight pair",
  "caption": "R38.7 §§3–6:Qwen3-8B on MATH500 has conditional wrong-answer collision0.379 with thinking off and0.509 with thinking on. Same weights and eight draws per task; this is wrong-class concentration, not proof of dependent draws or a universal reasoning effect.",
  "placement": "inline",
  "evidence": "PAPER-REPORTED",
  "source": "R38.7",
  "alt": "Two bars show conditional wrong-answer collision0.379 without thinking and0.509 with thinking for Qwen3-8B on MATH500. There are no uncertainty bars because this selected cell does not disclose one here; only two matched weight pairs underlie the broader study.",
  "spec": {
    "type": "bar",
    "categories": [
      "Thinking off",
      "Thinking on"
    ],
    "x": {
      "label": "generation condition"
    },
    "y": {
      "label": "conditional wrong-answer collision",
      "domain": [
        0,
        1
      ],
      "format": "raw"
    },
    "series": [
      {
        "id": "n0",
        "label": "Qwen3-8B / MATH500",
        "values": [
          0.379,
          0.509
        ],
        "emphasis": true
      }
    ]
  },
  "context": {
    "hardware": "NOT-DISCLOSED",
    "model": "Qwen3-8B, same weights with thinking on/off",
    "precision": "NOT-DISCLOSED",
    "sequenceLength": "response cap32768",
    "ioDistribution": "MATH500; k8; temperature0.6; top-p0.95",
    "concurrency": "NOT-DISCLOSED",
    "runtimeVersion": "vLLM0.27.1",
    "measurementBoundary": "Conditional wrong-answer collision, not latency or a causal mechanism"
  }
}
```


## Limitations

[DERIVED] Eq.38.6 summarizes second moments and does not determine the full joint success law. The log-odds voting derivation assumes a highly restrictive voter model. The uniform bound in Eq.38.8 is useful because it states the needed premise, not because current learned verifiers generally satisfy it. Finite benchmark evidence cannot establish that an algorithm always helps or that an unseen correct answer has zero generator probability.

## Reproducibility

[DERIVED] Retain every candidate, immutable random stream, processed behavior configuration, parser output, raw scorer output, unknown status, tie decision, selected representative and evaluator verdict. Publish both requested and completed counts. For learned weights, publish training split, feature extraction costs, calibration procedure and frozen model identity. Expose the cost of all candidates rather than only the selected one.

## References

[R38.7](references.md) §§3–8 and AppendicesA,B,D,H support the aggregation study. [R38.6](references.md) §§2–5 supports the coverage-versus-diversity boundary. Equations38.4–38.9 and Algorithm38.2 are book-derived with explicit premises.
