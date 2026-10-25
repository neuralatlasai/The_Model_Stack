---
id: ms.section.11.6
entity_type: section
title: Synthetic-data economics
short_title: Synthetic-data economics
volume: 1
part: 2
chapter: 11
section: 11.6
slug: 11-6-synthetic-data-economics
parent: ms.chapter.11
prev_sibling: ms.section.11.5
next_sibling: null
children: []
prerequisites: [ms.section.2.2, ms.section.6.1, ms.chapter.9, ms.section.11.1, ms.section.11.2, ms.section.11.3, ms.section.11.4, ms.section.11.5]
downstream: [ms.chapter.19, ms.chapter.31, ms.chapter.61, ms.chapter.62, ms.chapter.66]
related: [ms.chapter.47, ms.chapter.63]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.R11.23}
  - {type: supported_by, target: paper.R11.24}
  - {type: supported_by, target: paper.R11.25}
  - {type: supported_by, target: paper.R11.26}
  - {type: produces, target: artifact.synthetic-data-cost-and-student-learning-curve-report}
axes: {lifecycle: [data, pretraining, post_training, evaluation], mechanism: [selection, deduplication, resource_accounting, learning_curves], feedback_setting: [verifiable_reward, human_preference, ai_feedback], modality: [text, tool_trajectory]}
papers: []
implementations: [impl.pytorch, impl.vllm, impl.hugging-face-trl]
benchmarks: []
datasets: []
status: {maturity: active, disputed: true}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 3000
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 11.6 Synthetic-data economics

## Scope

Objective: choose a generation/selection/deduplication recipe by the student outcome it supports under a declared resource budget. Baseline: buying or reporting raw generated tokens. Success: the decision report separates offered, accepted and distinct records; retains all paid work; compares student learning curves with independent evaluation; and states what would reverse the preference. This section owns the data decision. Sampler scheduling, training execution, judge calibration and release authority remain in their canonical chapters.

## Why this exists

[DERIVED] A cheap candidate can be expensive supervision. Rejection adds paid generation and checking without a retained row. Repetition can inflate accepted count while adding little new content. A stricter judge can improve its own acceptance precision while removing hard, useful cases. The controlling obstruction is that neither a retained count nor a teacher/judge score identifies the causal effect of a dataset on a student.

[PAPER-REPORTED] WildAI studies detector-labeled web text, not a controlled instruction generator. Its 800-model grid spans 19.9M–973M parameters and varies human-token budgets and added AI/human text. Human-text loss can initially improve and then worsen as AI text is added; the target evaluation distribution changes the conclusion [R11.23, §§4–5; Appendix B]. These small-model pretraining results do not establish the value of targeted synthetic post-training examples. They motivate measuring the actual student/target pair rather than assigning every generated token one positive exchange rate.

## Intuition

[DERIVED] Keep a production funnel and a learning comparison separate. The funnel measures what was offered, which gates passed, which items were grouped or discarded, and what resources were consumed. The learning comparison measures what a fixed student training recipe learned from the retained multiset. The first makes the second auditable; it does not substitute for it.

[DERIVED] A label such as useful sample hides an acceptance rule. It might mean valid JSON, an executed test passing, a human-approved demonstration, or a positive measured student contribution. These are distinct events. Cost per accepted row is identifiable from an operational ledger once its scope is fixed. Cost per unit of student improvement needs a student comparison and an identified outcome; a judge's approval alone cannot supply that denominator.

## Formulation

[DERIVED] First choose a resource boundary. For a scalar accounting measure, every term below must have the same unit, such as total normalized compute work under declared weights. If resources are a vector, retain separate budgets. Peak memory is an allocation maximum, and parallel wall time is a scheduling/critical-path quantity; neither is obtained by summing these work terms.

$$
\begin{aligned}
C_{\mathrm{build}}&=C_{\mathrm{setup}}+
 \sum_{i=1}^{N_{\mathrm{off}}}(C_{\mathrm{gen},i}+C_{\mathrm{check},i})
 +C_{\mathrm{dedup}},\\
C_{\mathrm{total}}&=C_{\mathrm{build}}+C_{\mathrm{student}}+C_{\mathrm{eval}}.
\end{aligned}
$$
*(Eq. 11.16)*

[DERIVED] Include rejected outputs, timeouts, retries, invalid parses and duplicate candidates in the offered work. Record shared-prefix work once at its actual execution boundary; do not assume an engine shares it merely because requests have similar text. If resource settlement is incomplete, report an interval or unknown component instead of certifying a complete cost. For finite observed counts, accepted yield is $N_A/N_{\mathrm{off}}$ when $N_{\mathrm{off}}>0$, and build cost per retained item is $C_{\mathrm{build}}/N_A$ only when $N_A>0$.

[MATHEMATICALLY-DERIVED] A useful special case has independent, identically distributed trial pairs $(c_i,A_i)$, where $c_i\ge0$, $\mathbb E[c_i]=c<\infty$, $A_i\in\{0,1\}$ and $p=\Pr(A_i=1)>0$. Cost and acceptance within the same trial may be dependent. With $\tau=\min\{i\ge1:A_i=1\}$,

$$
\mathbb E\!\left[\sum_{i=1}^{\tau}c_i\right]
=\sum_{i\ge1}\mathbb E[c_i\,\mathbf1\{\tau\ge i\}]
=c\sum_{i\ge1}(1-p)^{i-1}=\frac c p.
$$
*(Eq. 11.17)*

[DERIVED] The independence used is between trial $i$ and earlier accept/reject events. This is not an assertion that accepted examples and rejected examples cost the same. Adaptive prompts, changing judges, a growing deduplication pool and finite budget censoring can invalidate the stationary trial model. With $p=0$ there is no first accepted item and no accepted-cost ratio. The illustrative calculator executes this special case, not the total pipeline cost of Eq. 11.16.

```figure
{
  "id": "fig-11.1",
  "kind": "calculator",
  "title": "Stationary cost per accepted example",
  "caption": "Illustrative renewal calculation in Eq. 11.17. The mean per-offer cost includes generation and checking. Independent stationary trial pairs and positive acceptance probability are premises. Fixed setup, deduplication, student training and evaluation are excluded; acceptance is a gate outcome, not established learning value.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-11.17",
  "alt": "Holding cost per offered trial fixed, decreasing the probability of acceptance increases expected paid work until the first accepted example. Zero acceptance supplies no accepted example and is outside this ratio.",
  "spec": {
    "tex": "c_{\\mathrm{accept}}=c/p",
    "equation": "11.17",
    "inputs": [
      {
        "symbol": "c",
        "label": "Mean normalized work per offer",
        "default": 1,
        "min": 0.01,
        "max": 100,
        "format": "fixed2"
      },
      {
        "symbol": "p",
        "label": "Acceptance probability",
        "default": 0.25,
        "min": 0.001,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "cost",
        "label": "Expected work to first acceptance",
        "formula": "c/p",
        "format": "fixed2"
      }
    ]
  }
}
```

[MATHEMATICALLY-DERIVED] Distinctness requires its own model. Suppose independent offers land in fixed accepted equivalence classes $j=1,\ldots,K$ with probabilities $q_j$, where $\sum_jq_j=p\le1$; all remaining probability is rejection. Let $U_n$ count occupied accepted classes after integer $n\ge0$ offers. Indicator expectations give

$$
\mathbb E[U_n]=\sum_{j=1}^{K}\!\left[1-(1-q_j)^n\right],\qquad
\mathbb E[U_{n+1}-U_n]=\sum_{j=1}^{K}q_j(1-q_j)^n.
$$
*(Eq. 11.18)*

[DERIVED] At $n=0$, the empty-product convention gives $\mathbb E[U_0]=0$. For equal class probabilities $q_j=p/K$, expected accepted count is $np$ while expected occupied classes saturate at $K$. This is not a semantic deduplication theorem: pairwise similarity thresholds can be nontransitive, representations and representatives can change, and approximate-neighbor search can miss edges. Record the actual grouping algorithm. Even an exact class count is not an independent-sample count or a learning-effect estimate.

```figure
{
  "id": "fig-11.2",
  "kind": "chart",
  "title": "Accepted volume and distinct classes diverge",
  "caption": "Analytical expectations under Eq. 11.18 for independent offers, acceptance p=0.2 and K=100 fixed equiprobable accepted classes. Points are integer offered counts. This is a fixed-partition occupancy model, not a measurement of a semantic deduplication pipeline or independent learning signal.",
  "placement": "inline",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-11.18",
  "alt": "Expected accepted count grows as 0.2 times offered count, whereas expected occupied accepted classes saturate at 100. The model counts content classes, not downstream usefulness.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Offered examples"
    },
    "y": {
      "label": "Expected count",
      "format": "fixed2"
    },
    "series": [
      {
        "id": "accepted",
        "label": "Gate accepted",
        "points": [
          [
            0,
            0
          ],
          [
            10,
            2
          ],
          [
            50,
            10
          ],
          [
            100,
            20
          ],
          [
            200,
            40
          ],
          [
            500,
            100
          ],
          [
            1000,
            200
          ],
          [
            2000,
            400
          ]
        ]
      },
      {
        "id": "distinct",
        "label": "Distinct accepted classes",
        "points": [
          [
            0,
            0
          ],
          [
            10,
            1.9820956648050614
          ],
          [
            50,
            9.525318199596434
          ],
          [
            100,
            18.143319531157232
          ],
          [
            200,
            32.99483862621775
          ],
          [
            500,
            63.24887451428414
          ],
          [
            1000,
            86.49354775533166
          ],
          [
            2000,
            98.17575747762494
          ]
        ]
      }
    ]
  }
}
```

[MATHEMATICALLY-DERIVED] Non-additive learning value appears even in a one-step model. Let $g_i$ be training gradients at a fixed $\theta$, $\bar g_S=|S|^{-1}\sum_{i\in S}g_i$, and update by one gradient-descent step. For validation loss $L$ with Hessian $H$ that is $L_H$-Lipschitz along the update segment,

$$
L(\theta-\eta\bar g_S)-L(\theta)
=-\eta\nabla L(\theta)^\top\bar g_S
+\frac{\eta^2}{2}\bar g_S^\top H(\theta)\bar g_S+R_S,
\quad |R_S|\le\frac{L_H\eta^3}{6}\|\bar g_S\|^3.
$$
*(Eq. 11.19)*

[DERIVED] The quadratic term includes cross-sample interactions. An exact counterexample uses $L(\theta)=\theta^2/2$ at $\theta=0$. Groups with gradients $(+1,-1)$ and $(+1,+1)$ have the same average individual one-step validation loss, $\eta^2/2$, but group updates have losses $0$ and $\eta^2/2$. Thus identical individual scores need not identify group value. This construction uses a specified gradient-descent update; it does not reconstruct a paper's AdamW experiments or prove that diversity always improves learning.

[PAPER-REPORTED] Group-Level Signals compares group and individual-proxy influence in pretraining and post-training settings. Its oracle uses a reference-set loss and an explicit one-step AdamW intervention; gradient-diversity diagnostics allocate expensive group-scoring calls [R11.24, §§2–5; Appendices B.1/B.8]. The oracle's information and scoring cost must accompany a comparison. Reference-loss agreement is not a general deployment-quality guarantee, and using final evaluation labels for curation would change the evaluation question.

## Mechanism

[DERIVED] Define each candidate recipe before comparing it: teacher and revision; source/seed construction; sampling; gate order and thresholds; duplicate grouping; target conversion; student initialization, optimizer, token exposure and stopping; and evaluator. A comparison that changes the teacher, filter, dataset size, student compute and evaluator together identifies a system difference. It cannot attribute the gain to one filtering mechanism.

[DERIVED] Evaluate a learning curve at finite planned resource/exposure points. Distinguish fixed offered count, fixed retained count, fixed student tokens and fixed total resources; a recipe may rank differently under each. Repeating real data, obtaining fresh real data and constructing synthetic data are meaningful comparators only where access, labels, resources and target population are specified. A slope estimated in a data-starved pilot need not transfer to a larger model or a higher-data regime.

[MATHEMATICALLY-DERIVED] Let $\mathcal A$ be a finite recipe set, $\Delta_a$ the target-population improvement under a frozen training/evaluation design, $C_a$ its expected total accounted work, $\mathbf r_a$ upper bounds for the resource quantities under strict limits, and $\mathbf B$ the allowed budgets. The decision problem can be stated as

$$
a_*\in\operatorname*{argmin}_{a\in\mathcal A}C_a
\quad\text{subject to}\quad
\Delta_a\ge\delta,\qquad \mathbf r_a\le\mathbf B.
$$
*(Eq. 11.20)*

[DERIVED] The target is defined here; the evidence must still estimate it. If no candidate is certified, return no admissible choice or inconclusive evidence as appropriate. Do not silently choose an inadmissible baseline. Marginal gain per extra cost is a diagnostic, not a general greedy optimum: a two-unit budget can prefer a recipe with a joint gain of five over a one-unit gain of two followed by no further gain. Without concavity or a suitable exchange property, the cheap first increment can prevent the best combination.

## Algorithm

### Algorithm 11.6 — Finite, resource-accounted synthetic-data comparison

[DERIVED] Inputs are a finite preregistered recipe grid, resource budgets, finite trial/exposure points, immutable data/checkpoint/evaluator identities and a final acceptance rule. Outputs are a frozen candidate with its evidence or a typed failure/inconclusive result.

$$
\begin{aligned}
1.&\quad\text{validate target, access, label semantics, resource units and finite inventory};\\
2.&\quad\text{for each admitted recipe/trial, reserve its declared upper resource bound};\\
3.&\quad\text{generate offers; log every outcome, check, rejection, duplicate and unresolved work item};\\
4.&\quad\text{freeze retained multiset and train paired student configurations at planned exposures};\\
5.&\quad\text{evaluate development comparisons; retain all trials and uncertainty, not only the winner};\\
6.&\quad\text{freeze selected candidate; apply independent final acceptance rule};\\
7.&\quad\text{return candidate only with complete admissibility evidence; otherwise report the unmet obligation}.
\end{aligned}
$$

[DERIVED] Admission requires the declared resource bound; an unknown bound prevents a strict feasibility certificate. Stop dispatch when no reservation or trial remains, and treat cancellation/late settlement explicitly. The finite inventory bounds the book algorithm's dispatch count; it does not prove the scientific optimum. Data publication/resume semantics and irreversible action authority are owned by Chapters 12 and 66.

```figure
{
  "id": "fig-11.3",
  "kind": "diagram",
  "title": "A finite evidence-constrained pipeline decision",
  "caption": "Book-designed control flow for Algorithm 11.6. Every offered trial and failure remains charged to the ledger. Missing resource or outcome evidence prevents a feasibility certificate; budget exhaustion can terminate comparison without establishing an optimum.",
  "placement": "inline",
  "anchor": "algorithm",
  "evidence": "DERIVED",
  "source": "DERIVED:alg-11.6",
  "alt": "A finite candidate inventory is admitted only with a resource reservation, then generated, gated and deduplicated. Paid work and rejected outcomes enter one ledger. Student comparisons use development evidence; a frozen final check yields an accepted configuration or an explicit inconclusive result.",
  "spec": {
    "nodes": [
      {
        "id": "a",
        "label": "[Process] Finite candidate inventory and target"
      },
      {
        "id": "b",
        "label": "[State] Resource admission and reservation"
      },
      {
        "id": "c",
        "label": "[Process] Generate, gate and deduplicate"
      },
      {
        "id": "d",
        "label": "[State] All offered work and rejection ledger"
      },
      {
        "id": "e",
        "label": "[Process] Cost-matched student comparisons"
      },
      {
        "id": "f",
        "label": "[Process] Freeze candidate and final acceptance check"
      },
      {
        "id": "g",
        "label": "[Artifact] Defensible candidate and evidence"
      },
      {
        "id": "h",
        "label": "[Boundary] Inconclusive or no admissible choice"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c",
        "label": "admitted"
      },
      {
        "from": "b",
        "to": "h",
        "label": "unbounded or unavailable budget"
      },
      {
        "from": "c",
        "to": "d",
        "label": "include failures and duplicates"
      },
      {
        "from": "d",
        "to": "e",
        "label": "usable evidence"
      },
      {
        "from": "d",
        "to": "h",
        "label": "unresolved cost or outcome"
      },
      {
        "from": "e",
        "to": "f",
        "label": "comparison complete"
      },
      {
        "from": "e",
        "to": "h",
        "label": "budget/deadline before conclusion"
      },
      {
        "from": "f",
        "to": "g",
        "label": "acceptance rule met"
      },
      {
        "from": "f",
        "to": "h",
        "label": "not certified"
      }
    ]
  }
}
```

## Implementation

[DERIVED] Emit one ledger joining offer ID, parent/seed group, teacher/prompt/sampling/interface revision, token/resource counters, gate evidence, selected target type, duplicate group, student dataset revision, training seed and evaluation revision. Keep costs at the boundary that incurred them. A judge reused by generation, selection and evaluation creates dependence; independently versioned systems can still share a training distribution or systematic error.

[OFFICIAL-DOCUMENTATION] WildAI's released repository at commit 795a71852d569173fcdaca1db2a466109cd80814 (2026-10-01) provides data, training, evaluation, law-fitting and result surfaces. Its README distinguishes installation extras and independent stages [R11.27]. This book inspected the pinned release surface statically; no CUDA environment, corpus labeling, model training or law refitting was executed. Availability of code does not establish end-to-end reproducibility in the book's environment.

[DERIVED] Cost comparisons should retain a vector where necessary: generator/selector/student work, GPU time, CPU time, peak memory, stored bytes, network traffic and any money paid at a stated date. A single scalar needs explicit weights and uncertainty. License, access and labeling requirements affect admissibility independently of a favorable learning curve. A normalized-work calculator is not a price quote.

## Experimental design

### Reported experiments and their limits

[PAPER-REPORTED] FinSafeGuard describes 26.4M raw candidates, 20.9M after merging, 16.99M after deduplication and 14.3M after judge filtering. Its abstract and body differ on the judge-stage reduction (15.9% versus 16.5%), and §8 leaves downstream model evaluation for future work [R11.25, §§5–8]. These are pipeline counts and proxy-quality evidence, not measured safety improvement of a trained student. Reconstruct denominators before using any percentage in a cost model.

[PAPER-REPORTED] Training Dynamics compares human and synthetic examples across classification and structured prediction, then studies selection using encoder learning dynamics [R11.26, §§3–5]. The pipeline includes label/tree repairs and within-synthetic/reference-neighbor filtering. A measured selection effect therefore belongs to that processed task/model regime, not to an arbitrary raw LLM output pool. Modeling selection cost requires those transformations too.

### Proposed verification

[DERIVED] The integrated cost-matched study is specified in [Experiment 11.8](verification.md#exp-11-8). It is unexecuted. Freeze the development grid before the final test, pair student configurations, charge all construction and training work, and evaluate failures/censored runs rather than reporting only successful student models.

[MATHEMATICALLY-DERIVED] With $B$ independently generated source batches, $R$ declared student seeds and a fixed held-out test population, define paired loss differences $\widehat d_{b,r}=\widehat L_{\mathrm{baseline},b,r}-\widehat L_{\mathrm{candidate},b,r}$ under the same metric and workload weights, so positive differences mean improvement. A descriptive estimator is

$$
\widehat\Delta=\frac1B\sum_{b=1}^{B}\frac1R\sum_{r=1}^{R}\widehat d_{b,r}.
$$
*(Eq. 11.21)*

[DERIVED] The formula alone supplies no confidence guarantee. Shared test groups, reused controls and common source batches create dependence. Resampling must preserve the comparison pairing and relevant source/test clusters; a token-level interval is not a between-training-run interval. Final uncertainty should distinguish source generation, student optimization and target-population sampling, with the limits of a small pilot visible. A failed certification can mean insufficient evidence rather than a harmful or intrinsically impossible recipe.

## Observations

**What the paper claims.** [PAPER-REPORTED] The recent studies investigate different targets: web-text pretraining loss, reference-based group influence, construction/quality filtering, and encoder training dynamics. Their metrics are not interchangeable [R11.23–R11.26].

**What the evidence shows.** [DERIVED] Each supplied comparison is conditional on its source population, processing, model, budget and evaluator. A large retained corpus can coexist with absent student evidence; a profitable region of a learning curve can coexist with harm elsewhere.

**What we infer.** [DERIVED] Choose a resource-accounted student comparison as the controlling evidence, with the operational funnel retained to explain its costs and selection. Where group interactions matter, independent per-row scores are inadequate as a complete value model.

**What remains unknown.** [UNVERIFIED] No book generation/student experiment was run. Generalization to a different teacher, model scale, target distribution or resource regime remains an empirical question. Current source availability does not certify runtime compatibility.

## Failure modes

[DERIVED] A growing retained count with saturated class occupancy indicates repetition rather than guaranteed new signal (Eq. 11.18). Improving judge acceptance without a held-out student gain indicates an unqualified proxy. Missing rejected/failed work understates the resource denominator; an unbounded resource component prevents the strict feasibility claim of Eq. 11.20. Each symptom calls for its corresponding ledger, comparator or additional measurement rather than a universal threshold change.

## Siblings

| Alternative | Changed obstruction | Reversal evidence |
|---|---|---|
| More samples from the same generator | Buys additional exposure, potentially with declining distinctness or correlated error. | A paired cost-matched learning curve shows whether the next increment helps. |
| Stronger or reordered gates | Changes false acceptance, rejection and paid work together. | Independent audits of accepted and rejected strata plus student outcomes reveal overfiltering or proxy failure. |
| Group-aware selection | Pays to model interactions missed by isolated scores. | Scoring overhead, reference dependence and held-out student gain determine whether its extra work is justified. |
| Repeated/fresh real data | Changes source access and distribution rather than only generator throughput. | Compare under the same target and full resource boundary; a different target can reverse the preference. |

## Extensions

[DERIVED] The source-supported progression from isolated sample proxies to group-level intervention is described above (R11.24); it adds reference dependence and scoring cost. Open research directions include cheap diagnostics of useful group effects outside calibration, marginal-value identification when teacher/selector/student co-evolve, and accounting for the evaluation cost of distinguishing nearly tied recipes. These are unresolved directions, not established improvements.

## Limitations

[DERIVED] The stationary-trial ratio, fixed-class occupancy model and local gradient expansion have different premises and identify no universal exchange rate from generated tokens to student utility. The conditional empirical regimes are preserved above. A wrong proxy, violated stationarity, implementation defect, stronger cost-matched comparator or inconclusive pilot requires a different decision update; a failed certification alone establishes neither harm nor impossibility.

## Reproducibility

[DERIVED] R11.23, R11.24 and R11.26 first appeared 2026-09-30; R11.25 appeared 2026-10-19. All current v1 primary texts and abstract revision histories were inspected on 2026-10-25. The implementation surface is pinned separately in R11.27. Equation 11.17's trial model, Eq. 11.18's fixed classes, Eq. 11.19's local update/remainder premises and the illustrative figure parameters are book derivations. No reported or illustrative number is a book-measured model result. Verification records the proposed artifact and acceptance boundaries.

## References

R11.23 · R11.24 · R11.25 · R11.26 · R11.27 · [chapter references](references.md) · [verification](verification.md)
