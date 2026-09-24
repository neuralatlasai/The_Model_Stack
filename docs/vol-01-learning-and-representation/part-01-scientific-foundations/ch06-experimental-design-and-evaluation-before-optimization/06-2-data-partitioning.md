---
id: ms.section.6.2
entity_type: section
title: Data partitioning
short_title: Data partitioning
volume: 1
part: 1
chapter: 6
section: 6.2
slug: 06-2-data-partitioning
parent: ms.chapter.6
prev_sibling: ms.section.6.1
next_sibling: ms.section.6.3
children: []
prerequisites: [ms.section.1.1, ms.section.2.2, ms.section.2.5, ms.section.4.6, ms.section.6.1]
downstream: [ms.section.6.4, ms.section.6.6, ms.section.7.5, ms.section.8.5, ms.section.21.5, ms.section.61.4]
related: [ms.section.8.3, ms.section.62.2]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P07}
  - {type: supported_by, target: paper.P50}
  - {type: prerequisite_of, target: ms.section.8.5}
  - {type: evaluated_by, target: experiment.6.2}
axes: {lifecycle: [data, evaluation], mechanism: [data_partitioning, contamination_control, adaptive_reuse], feedback_setting: [], modality: [text]}
papers: [P07, P50]
implementations: [impl.pytorch, impl.torchtitan, impl.nanotron]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, KNOWN, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2200
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# 6.2 Data partitioning

## Scope

Objective: state the partition contract — which data may influence which decision — covering train/development/test separation, temporal splits, group splits, contamination treated as a partitioning failure at design time, and repeated test-set exposure. Baseline: a random row-level split of one dataset. Success: for any reported test score the reader can name every path by which test information could have reached the evaluated unit and can distinguish fixed-candidate selection bounds from adaptive-reuse claims. Boundaries: contamination *detection* methods (overlap search, membership tests, rephrasing probes) are owned by [§8.5](../../part-02-data-and-representation-engineering/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md); near-duplicate structure by [§8.3](../../part-02-data-and-representation-engineering/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-3-duplicate-structure.md); dataset documentation fields by [§7.5](../../part-02-data-and-representation-engineering/ch07-data-provenance-acquisition-and-dataset-semantics/07-5-dataset-documentation.md); validity threats at portfolio level by [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md).

## Why this exists

What failed before was an assumption borrowed from supervised learning on curated datasets: that a test split drawn once at random is independent of everything the system has seen. For web-scale pretraining the training set is a crawl that may contain the benchmark; the GPT-3 report already names datasets where the model "faces methodological issues related to training on large web corpora" (PAPER-REPORTED · R6.21). For leaderboards the test set is queried by many teams for years. For ML-based science generally, Kapoor and Narayanan survey 17 fields and 329 papers affected by leakage and give a taxonomy of "8 types of leakage that range from textbook errors to open research problems" (PAPER-REPORTED · R6.17). The bottleneck is that independence cannot be restored after the fact: a contaminated or over-queried test set yields a number whose bias is unknown and unit-specific. The constraint that became dominant is information flow from the test sample into any decision — a gradient, a hyperparameter, a prompt, a filter, a stopping time. What changed is that partitioning becomes a contract written before data collection or training, with group and temporal keys and a ledger of test exposures, instead of a preprocessing step.

## Intuition

Physically, a test set is a finite store of independent bits about the task distribution. Every decision that consumes a statistic of it spends some of those bits: the statistic's noise becomes part of the selected system. A training corpus that contains test items has spent them all at once. A quality filter trained on benchmark-like text spends them indirectly, by raising the density of test-like documents. Heuristically, this is "teaching to the test"; the measurable fact is a dependence between the sample used to estimate quality and the procedure that produced the unit.

## Formulation

> **Definition — partition contract.** The preregistered assignment of every data item to exactly one role — *training* (may influence parameters), *development* (may influence any design choice: hyperparameters, prompts, templates, checkpoint selection, stopping, filters), or *test* (may influence one reported estimate per registered hypothesis) — together with the group and temporal constraints that the assignment must satisfy.

Let 𝒯, 𝒱, 𝒮 be the training, development, and test sets, g(·) a group key, and t(·) a timestamp. The contract requires

$$
\mathcal{T}\cap\mathcal{V}=\mathcal{T}\cap\mathcal{S}=\mathcal{V}\cap\mathcal{S}=\varnothing,\qquad g(\mathcal{T}\cup\mathcal{V})\cap g(\mathcal{S})=\varnothing,\qquad \max_{x\in\mathcal{T}\cup\mathcal{V}} t(x) < t_{\text{cut}} \le \min_{x\in\mathcal{S}} t(x)
$$
*(Eq. 6.3)* where g(𝒜) = set of group keys occurring in 𝒜, t_cut = temporal cut-off; the second condition defines a group split and the third a temporal split; a plain random split enforces only the first.

> **Definition — group split.** A partition in which all items sharing a group key (source document, passage, template, repository, author, problem family) fall in one role.

> **Definition — temporal split.** A partition in which every test item was created after a cut-off that is later than the creation time of every training and development item in the unit's lineage.

> **Definition — contamination (as a partitioning failure).** Any path by which a test item, or an item sharing its group key, reaches a training or development role in the lineage of the evaluated unit — a violation of Eq. 6.3 for that unit. Detection methods are owned by §8.5.

> **Definition — test-exposure ledger.** The append-only record of every decision that consumed a statistic of 𝒮, with date, decision, and the statistic consumed; its length k is the adaptivity count.

**Selection optimism for fixed candidates.** Let k candidate units be fixed independently of the test sample, with estimates q̂_j = q_j + e_j. Assume each centred error e_j is sub-Gaussian with a common valid proxy variance σ². For means of n independent scores in [0,1], Hoeffding's lemma supplies σ² = 1/(4n); q(1 − q)/n is a Bernoulli variance, not a universally valid sub-Gaussian proxy. With no independence assumption across candidate errors,

$$
\mathbb{E}\Big[\max_{j\le k} e_j\Big] \;\le\; \sigma\sqrt{2\ln k}
$$
*(Eq. 6.4)* where n = independent equally weighted test units, k = number of predeclared candidates. MATHEMATICALLY-DERIVED: for t > 0, the log-sum-exp bound gives E[max e_j] ≤ log(k)/t + tσ²/2; minimising over t gives the expression. If j* is selected using these fixed candidates, E[e_j*] ≤ E[max e_j]. The ledger length alone does not establish this bound for adaptively constructed candidates. Unequal cluster weights require a correspondingly weighted bound, not substitution of the raw cluster count.

```figure
id: fig-6.8
kind: calculator
title: Selection optimism bound for fixed candidates
caption: >-
  Eq. 6.4 with Hoeffding's valid proxy σ = 1/(2√n) for means of n
  independent scores in [0, 1]. The bound grows only as √(ln k) and falls
  as 1/√n. The last output inverts it. It gives the independent test units
  needed before selection among k fixed candidates is bounded by the §6.4
  practical margin δ. This is an upper bound on expected optimism, not a
  predicted bias, and it does not cover candidates revised after test
  feedback.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.4"
concepts: [ms.section.6.2]
alt: >-
  Calculator for Eq. 6.4 with inputs n independent test units, k
  predeclared candidates and a practical margin δ. At n = 1,000 the proxy is
  σ = 0.01581. For k = 10 the bound is 0.0339 score units, 3.39 times
  δ = 0.01, and 11,513 independent units would bring it down to δ. For
  k = 100 the bound is 0.0480, 4.8 times δ, and 23,026 units are needed.
  For k = 1 the bound is zero. At n = 100 and k = 100 it is 0.152.
spec:
  tex: >-
    \mathbb{E}\Big[\max_{j\le k} e_j\Big] \le \sigma\sqrt{2\ln k},\qquad \sigma=\frac{1}{2\sqrt{n}},\qquad n_{\delta}=\frac{\ln k}{2\,\delta^{2}}
  equation: "6.4"
  inputs:
    - { symbol: n, label: "independent test units n", default: 1000, min: 10, max: 1000000, scale: log10, format: integer }
    - { symbol: k, label: "predeclared candidates k", default: 10, min: 1, max: 10000, scale: log10, format: integer }
    - { symbol: delta, label: "practical margin δ (§6.4)", default: 0.01, min: 0.005, max: 0.05, step: 0.005, format: fixed3 }
  outputs:
    - { symbol: sig, label: "sub-Gaussian proxy σ = 1/(2√n)", formula: "1/(2*sqrt(n))", format: raw }
    - { symbol: B, label: "bound on E[max e_j], score units", formula: "sig*sqrt(2*ln(k))", format: raw, emphasis: true }
    - { symbol: rat, label: "bound ÷ δ", formula: "B/delta", format: ratio }
    - { symbol: nd, label: "units for bound = δ at this k", formula: "ln(k)/(2*delta^2)", format: integer }
  presets:
    - { label: "k = 100", values: { k: 100 } }
    - { label: "k = 1, no selection", values: { k: 1 } }
    - { label: "n = 100, k = 100", values: { n: 100, k: 100 } }
states:
  - { anchor: formulation, label: "n = 1,000, k = 10", variables: { n: 1000, k: 10, delta: 0.01 }, highlight: [sig, B], note: "The section's worked value: σ = 1/(2√1000) = 0.0158 and a bound of 0.0339 score units on the expected optimism of the best of ten fixed candidates." }
  - { anchor: mechanism, label: "k = 100", variables: { n: 1000, k: 100, delta: 0.01 }, highlight: [k, B, rat], note: "Ten times the candidates adds only 1.4 points: 0.0339 → 0.0480, because the bound grows as √(ln k). It is still 4.8 times δ." }
  - { anchor: experimental-design, label: "k = 1 baseline", variables: { n: 1000, k: 1, delta: 0.01 }, highlight: [k, B], note: "Experiment 6.2's k = 1 arm has no selection, so its bound is zero. A gap on the fresh set there reflects difficulty shift (R6.14), not selection." }
  - { anchor: failure-modes, label: "test used as dev, n = 100", variables: { n: 100, k: 100, delta: 0.01 }, highlight: [n, B, nd], note: "A hundred prompt variants chosen on a 100-item test: bound 0.152, 15 points. Candidates revised after test feedback are not covered by even this bound." }
```

**Bias from contamination.** If a fraction f_c(u) of test items is contaminated for unit u, with success probability p_c(u) on those and p_0(u) on clean items,

$$
\mathbb{E}[\hat q(u)] = p_0(u) + f_c(u)\,\big(p_c(u)-p_0(u)\big)
$$
*(Eq. 6.5)* where every term depends on u because contamination is a property of the unit's training lineage, not of the benchmark.

```figure
id: fig-6.9
kind: calculator
title: Contamination bias of one unit under Eq. 6.5
caption: >-
  Eq. 6.5 as a mixture of clean and contaminated items. The bias is
  f_c(p_c − p_0), and because both probabilities lie in [0, 1] it can never
  exceed f_c. The states walk from a moderate case to the bound and then to
  the case the Limitations warn about. A large contaminated fraction with
  almost no score gap produces no visible gap at all. All three settings are
  illustrative values for one unit, not estimates for any benchmark.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.5"
alt: >-
  Calculator for Eq. 6.5 with inputs contaminated fraction f_c, clean-item
  success probability p_0 and contaminated-item success probability p_c.
  It outputs the expected score p_0 + f_c(p_c − p_0), the bias
  f_c(p_c − p_0) and the bound f_c on the bias magnitude. At the
  illustrative f_c = 0.1, p_0 = 0.6 and p_c = 0.9, the expected score is
  0.630 and the bias 0.030. At f_c = 0.1, p_0 = 0 and p_c = 1 the bias
  reaches its bound of 0.100. At f_c = 0.3, p_0 = 0.6 and p_c = 0.61 the
  bias is only 0.003 although 30 % of items are contaminated.
spec:
  tex: >-
    \mathbb{E}[\hat q(u)] = p_0(u) + f_c(u)\,\big(p_c(u)-p_0(u)\big),\qquad |\text{bias}|\le f_c(u)
  equation: "6.5"
  inputs:
    - { symbol: fc, label: "contaminated fraction f_c(u)", default: 0.1, min: 0, max: 1, step: 0.01, format: percent }
    - { symbol: p0, label: "success on clean items p_0(u)", default: 0.6, min: 0, max: 1, step: 0.01, format: fixed2 }
    - { symbol: pc, label: "success on contaminated items p_c(u)", default: 0.9, min: 0, max: 1, step: 0.01, format: fixed2 }
  outputs:
    - { symbol: Eq, label: "expected reported score", formula: "p0 + fc*(pc - p0)", format: fixed3 }
    - { symbol: bias, label: "bias f_c(p_c − p_0)", formula: "fc*(pc - p0)", format: fixed3, emphasis: true }
    - { symbol: bmax, label: "bound on |bias|: f_c", formula: "fc", format: fixed3 }
states:
  - { anchor: formulation, label: "f_c = 10 %", variables: { fc: 0.1, p0: 0.6, pc: 0.9 }, highlight: [Eq, bias], note: "Illustrative unit: a tenth of the items contaminated and a 30-point advantage on them adds 0.030 to a clean score of 0.600." }
  - { anchor: observations, label: "bias at its bound", variables: { fc: 0.1, p0: 0, pc: 1 }, highlight: [bias, bmax], note: "The bias reaches f_c only when contaminated items are always solved and clean ones never are. The bias is bounded and unit-specific, as the inference states." }
  - { anchor: limitations, label: "contaminated, no gap", variables: { fc: 0.3, p0: 0.6, pc: 0.61 }, highlight: [fc, bias], note: "30 % of items contaminated but p_c − p_0 = 0.01: the bias is 0.003. A missing fresh-set gap does not show that contamination is absent." }
```

> **Assumption.** The group key captures the dependence structure · *sensitivity:* an omitted key (e.g. splitting by question when questions share a passage) leaves Eq. 6.3's second condition nominally satisfied and violated in fact; the leakage gap of Experiment 6.2 is then non-zero.

## Mechanism

**Train, development, test.** The three roles differ by which decisions they may touch, not by size. Anything selected by looking at a score was tuned on the data that produced the score: a prompt format chosen because it scores higher on the test items has used 𝒮 as 𝒱. Given format effects of tens of points on some tasks (PAPER-REPORTED · R6.4, R6.22), prompt selection on the test split can materially bias the selected result; its size relative to hyperparameter selection is UNVERIFIED without a comparable candidate set. Dodge et al. make the corresponding reporting demand for the development role: report expected validation performance "as a function of computation budget", because the number of configurations tried is itself a resource that changes which method appears to win (PAPER-REPORTED · R6.24). Cost line: a development set costs the items withheld from both training and test; its evaluation cost is paid once per configuration tried, which is where most evaluation FLOPs go.

**Repeated test-set exposure.** Eq. 6.4 applies to selection from fixed candidates, not arbitrary adaptive reuse. With ASSUMED n = 1,000 independent bounded items, the valid Hoeffding proxy gives σ = 1/(2√1000) ≈ 0.01581. For k = 10 and k = 100 fixed candidates, the expected-optimism upper bounds are approximately 0.0339 and 0.0480 score units (MATHEMATICALLY-DERIVED · DERIVED:eq-6.4). These are conservative bounds, not predicted or attained biases; independence between candidate errors does not make them exact. Once candidates are revised after test feedback, their test errors need not obey the same centred proxy. PAPER-REPORTED: the Ladder (R6.16) and reusable-holdout construction (R6.15) address adaptive disclosure under their own assumptions. Their guarantees cannot be borrowed merely by counting queries. DERIVED — cost line: controlled disclosure trades statistical resolution and protocol complexity for protection against adaptive reuse.

```figure
id: fig-6.10
kind: chart
title: Fixed-candidate optimism bound against the number of candidates
caption: >-
  Eq. 6.4 for three test sizes. Each curve rises steeply over the first few
  candidates and then flattens as √(ln k). The horizontal line is the §6.4
  illustrative margin δ = 0.01. At n = 1,000 even two candidates exceed it.
  Bringing ten candidates under δ takes ln 10/(2δ²) ≈ 11,513 independent
  units, as in the rail calculator. These are bounds, not attained biases.
  None of them covers candidates revised after test feedback.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.4"
alt: >-
  Line chart of the Eq. 6.4 bound σ√(2 ln k), with σ = 1/(2√n), against
  the number of fixed candidates k from 1 to 1,000 on a log axis. For
  n = 100 the bound is 0.059 at k = 2, 0.107 at k = 10, 0.152 at k = 100
  and 0.186 at k = 1,000. For n = 1,000 it is 0.0186, 0.0339, 0.0480 and
  0.0588. For n = 10,000 it is 0.0059, 0.0107, 0.0152 and 0.0186. A dashed
  line marks δ = 0.01. All curves start at 0 for k = 1.
spec:
  type: line
  x: { label: "fixed candidates k", scale: log10, format: integer, domain: [1, 1000] }
  y: { label: "bound on expected optimism, score units", scale: linear, format: fixed3, domain: [0, 0.2] }
  series:
    - { id: n100, label: "n = 100 independent units", formula: "sqrt(2*ln(x))/(2*sqrt(100))", sample: { from: 1, to: 1000, count: 31 } }
    - { id: n1000, label: "n = 1,000 (the section's worked case)", formula: "sqrt(2*ln(x))/(2*sqrt(1000))", sample: { from: 1, to: 1000, count: 31 }, emphasis: true }
    - { id: n10000, label: "n = 10,000", formula: "sqrt(2*ln(x))/(2*sqrt(10000))", sample: { from: 1, to: 1000, count: 31 } }
    - { id: delta, label: "δ = 0.01, §6.4 illustrative margin", formula: "0.01", sample: { from: 1, to: 1000, count: 2 }, dashed: true }
  annotations:
    - { x: 10, label: "n = 1,000, k = 10: 0.0339" }
    - { x: 100, label: "n = 1,000, k = 100: 0.0480" }
```

PAPER-REPORTED: fresh-test-set studies provide workload-specific evidence rather than measurements of Eq. 6.4's upper bound. Recht et al. built fresh test sets for CIFAR-10 and ImageNet and found "accuracy drops of 3% - 15% on CIFAR-10 and 11% - 14% on ImageNet", yet gains on the original test sets carried over to the new ones, and the authors attribute the drop to the new items being slightly harder, not to adaptive overfitting (PAPER-REPORTED · R6.14). For language models, Zhang et al. built GSM1k to mirror GSM8k and report "accuracy drops of up to 8%, with several families of models showing evidence of systematic overfitting", a correlation between a model's likelihood of generating GSM8k examples and its gap, and minimal gaps for frontier models (PAPER-REPORTED · R6.31; workload: grade-school arithmetic, their model set and date). DERIVED: these studies do not identify a universal ordering effect of reuse. Equation 6.5 explains why unit-specific exposure need not cancel in a paired comparison, while difficulty and population shifts remain competing explanations.

**Group splits.** When items share a source, a random split places siblings on both sides, and the test score estimates within-group generalisation. Model the item score as s = μ + a_g + e with group effect a_g. A unit that has trained on group g can fit a_g; on a random split its expected test score includes 𝔼[a_g | g seen], on a group split it does not. DERIVED: the score difference is a leakage/generalisation gap. It is not equal to a between-group variance component: the gap has score units, variance has squared-score units, and how much group information is learned depends on the training procedure. The [design effect](../ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md) instead describes dependence in uncertainty estimation. Practical keys: passage for reading comprehension, template for generated questions, repository for code (the plan's Appendix C lists "file/repository splits" as a required distinction for code corpora; KNOWN · book_plan.md Appendix C), problem family for mathematics, conversation for multi-turn data, source language document for translated multilingual sets. Miller names the same structure as the reason for clustered errors (PAPER-REPORTED · R6.1); partitioning by the cluster key is the design-time counterpart of clustering the standard error at analysis time. Cost line: group splits reduce the usable test size when groups are few and large, which raises the interval width of §6.4.

**Temporal splits.** Lazaridou et al. report that language models "perform worse in the realistic setup of predicting future utterances from beyond their training period" and that the degradation grows with temporal distance (PAPER-REPORTED · R6.19). A temporal split therefore measures a different and usually harder quantity than a random split; it is the honest one when deployment is in the future of the training data (DERIVED). LiveBench turns the temporal split into an operating procedure: "frequently-updated questions from recent information sources", automatic scoring against "objective ground-truth values", and a commitment to monthly updates (PAPER-REPORTED · R6.20). The precondition is a known training cut-off for the unit. For closed models it is frequently NOT-DISCLOSED; for a hosted endpoint whose weights are silently replaced, the cut-off moves inside the measurement window, and a temporal split that was valid at registration can become invalid (DERIVED from Eq. 6.3 applied to u_endp of §6.1). Cost line: temporal refresh makes scores non-comparable across refreshes unless old items are retained as an anchor set; item authoring is a recurring cost.

**Contamination at design time.** The paths are enumerable before any detection method is run: (i) test items inside the pretraining crawl; (ii) test items, paraphrases, or solutions inside post-training or synthetic data; (iii) development-role use of test items (prompt, template, or checkpoint selection); (iv) benchmark-informed data selection — a quality classifier or n-gram selector whose positive examples resemble the evaluation tasks raises test-like density without copying any item; (v) public interaction logs from an evaluation platform re-entering training. Design-time controls come from Jacovi et al.: publish test data only when "encrypted with a public key and licensed to disallow derivative distribution", require training-exclusion controls from API providers, and "avoid data which appears with its solution on the internet" (PAPER-REPORTED · R6.18). The Open LLM Leaderboard documents one such control in use: access to GPQA "is restricted through gating mechanisms to minimize the risk of data contamination" (OFFICIAL-DOCUMENTATION · R6.13). Path (v) is the partitioning face of the preference-platform issue of §6.1: R6.32 reports that access to arena data yields gains on the arena distribution (PAPER-REPORTED · R6.32; not independently verified).

```figure
id: fig-6.11
kind: diagram
title: Five paths from the test set into a unit's lineage
caption: >-
  Contamination drawn as information flow, before any detector runs. Four
  paths copy or consume test items. Path (iv) copies nothing. It raises the
  density of test-like text through a selector's positive examples, so an
  exact-overlap check cannot close it. That is the heavy path, and it is why
  the verification protocol registers a held-out domain as a test role.
  Every path ends in the same place, Eq. 6.5's f_c(u), which is a property
  of the unit and not of the benchmark.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-6.3", "DERIVED:eq-6.5", R6.18, R6.13, R6.32]
concepts: [ms.section.6.2, ms.section.8.5]
alt: >-
  Left-to-right diagram. The test set and its group siblings feed five
  paths into the evaluated unit's training lineage: (i) test items inside
  the pretraining crawl; (ii) items, paraphrases or solutions inside
  post-training or synthetic data; (iii) development-role use such as
  prompt, template or checkpoint selection; (iv) benchmark-informed data
  selection, where a quality classifier's positives resemble the tasks, a
  dependency with no copying; and (v) public interaction logs from an
  evaluation platform re-entering training (R6.32). All five reach the
  unit, whose expected score follows Eq. 6.5. Design-time controls: publish
  test data encrypted and licensed against derivatives (R6.18) blocks path
  (i); gated access, as for GPQA on the Open LLM Leaderboard (R6.13), also
  blocks (i); training-exclusion controls from API providers (R6.18) block
  (v); selecting on the development set with an exposure ledger closes
  (iii); a held-out domain registered as a test role exposes (iv), on the
  emphasised path.
spec:
  direction: LR
  nodes:
    - { id: S, kind: dataset, label: "test set 𝒮 and group siblings g(𝒮)" }
    - { id: p1, kind: flow, label: "(i) pretraining crawl", group: paths }
    - { id: p2, kind: flow, label: "(ii) post-training or synthetic data", group: paths }
    - { id: p3, kind: flow, label: "(iii) development-role use", sub: "prompt, template, checkpoint selection", group: paths }
    - { id: p4, kind: flow, label: "(iv) benchmark-informed selection", sub: "classifier positives resemble tasks", group: paths }
    - { id: p5, kind: flow, label: "(v) evaluation-platform logs", sub: "re-enter training (R6.32)", group: paths }
    - { id: unit, kind: model, label: "evaluated unit u, training lineage" }
    - { id: bias, kind: metric, label: "E[q̂(u)] = p₀ + f_c(p_c − p₀)", sub: "Eq. 6.5; |bias| ≤ f_c", emphasis: true }
    - { id: enc, kind: dependency, label: "encrypted, licensed test publication", sub: "R6.18", group: ctl }
    - { id: gate, kind: dependency, label: "gated access", sub: "GPQA on the Open LLM Leaderboard (R6.13)", group: ctl }
    - { id: excl, kind: dependency, label: "training-exclusion controls from API providers", sub: "R6.18", group: ctl }
    - { id: led, kind: dependency, label: "select on 𝒱; exposure ledger", sub: "Eq. 6.4 for fixed candidates only", group: ctl }
    - { id: hold, kind: dependency, label: "held-out domain as a registered test role", sub: "verification.md", group: ctl }
  edges:
    - { from: S, to: p1 }
    - { from: S, to: p2 }
    - { from: S, to: p3 }
    - { from: S, to: p4, kind: dependency, label: "resemblance, no copy" }
    - { from: S, to: p5 }
    - { from: p1, to: unit }
    - { from: p2, to: unit }
    - { from: p3, to: unit }
    - { from: p4, to: unit, kind: emphasis }
    - { from: p5, to: unit }
    - { from: unit, to: bias, kind: emphasis }
    - { from: enc, to: p1, kind: dependency, label: "blocks" }
    - { from: gate, to: p1, kind: dependency, label: "blocks" }
    - { from: excl, to: p5, kind: dependency, label: "blocks" }
    - { from: led, to: p3, kind: dependency, label: "closes" }
    - { from: hold, to: p4, kind: dependency, label: "exposes" }
  groups:
    - { id: paths, label: "paths into the lineage (enumerable at design time)" }
    - { id: ctl, label: "design-time controls" }
```

Two disclosures show how far even careful work gets after the fact. DCLM removed pages flagged as containing MMLU or HellaSwag question text with an answer option and reports that this "does not lead to decreases in model performance, so our performance gains on these two tasks are not likely to be caused by increased presence of their test examples in our dataset", while noting many false positives in the flags (PAPER-REPORTED · P07 §4.6). HELM lists the contamination evidence it knows of and states that understanding of how contaminated models are remains limited (PAPER-REPORTED · P50). Neither could be a guarantee; both are what honest reporting looks like when path (i) was never closed by design. Path (iv) is the one the chapter's verification experiment must control, which is why it evaluates on a held-out domain.

## Algorithm

```text
Algorithm 6.2 — Frozen group assignment with optional strict temporal separation
INPUT   finite immutable item pool with unique ids, bounded group keys, verified timestamps;
        fixed salt; role thresholds; optional temporal cut-off; checkpoint cut-off registry
OUTPUT  immutable partition and quarantine records, or INVALID-PARTITION; exposure ledger
STATE   group min/max timestamps, role map, item counts
INVARIANT  groups never cross roles; in temporal mode train/dev precede the cut-off
1  Validate unique ids, thresholds, group-key completeness, and timestamp provenance.
2  Aggregate each group's minimum and maximum timestamp; reject unresolved required times.
3  For each group compute z = keyed_hash(salt, group_key) / hash_range in [0,1).
4  Without a temporal cut-off, assign TRAIN, DEV, or TEST by fixed intervals of z.
5  With a cut-off, if max_time < cut-off, assign TRAIN or DEV by fixed intervals of z.
6      If min_time >= cut-off, assign TEST or HOLDOUT by a registered threshold.
7      Otherwise quarantine the entire straddling group; never move its future rows to TRAIN.
8  Check realised role sizes and group separation; if infeasible, return INVALID-PARTITION.
9  In temporal mode, flag a checkpoint with training_cutoff >= split_cutoff as NOT-CERTIFIED;
       flag an unknown cutoff as CUTOFF-NOT-DISCLOSED; require stronger lineage evidence.
10 Freeze the item inventory, role map, quarantine reasons, and split digest before training.
11 On later test-statistic access, append the date, decision, statistic, and consumer.
```

DERIVED — complexity: O(|𝒫| log |𝒫|) for deterministic sorting and uniqueness checks with bounded keys, plus linear hashing in input bytes. Each group is assigned once. Fixed hash intervals preserve a group's assignment when unrelated groups are added, whereas rank-based quota filling would reshuffle assignments. Exact role fractions are not guaranteed; record realised sizes and freeze this dataset version. New items or changed timestamps create a new partition version, and a newly straddling group must be revalidated. A late checkpoint cut-off means temporal cleanliness is not certified by dates alone, not that particular test items are proven to have been seen. Fields are listed in [verification.md](verification.md).

```figure
id: fig-6.12
kind: matrix
title: One pool, three partitions of its groups
caption: >-
  Ten illustrative groups, sorted by timestamp, under the three conditions
  of Eq. 6.3. A row-level random split puts 80/10/10 % of every group's
  items in train/dev/test, so every group straddles the test boundary. The
  group split assigns whole groups by hash interval. With ten groups only
  one lands in test, which is the interval-width cost the section names.
  The temporal split quarantines g6, which straddles the cut-off. The group
  and temporal columns disagree on g7, g9 and g10: each condition is a
  separate constraint.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-6.3", "DERIVED:alg-6.2"]
concepts: [ms.section.6.2]
alt: >-
  Matrix of ten groups g1 to g10, sorted by time, against nine columns: the
  train, dev and test roles under a random, a group and a temporal split.
  Random split: every group has 0.8 of its items in train, 0.1 in dev and
  0.1 in test. Group split by hash interval: g3 is entirely dev, g8
  entirely test, and the other eight groups entirely train. Temporal split
  with a cut-off between g6 and g7: g1 to g5 precede it and go to train or
  dev, g7 to g10 follow it and go to test, and g6 straddles it and is
  quarantined. Highlighted cells: g6 quarantined, and g8 as the only
  group-split test group. Illustrative assignment, not a dataset.
spec:
  rows: 10
  cols: 9
  pattern: explicit
  rowLabel: "group key, sorted by time"
  colLabel: "split type · role"
  rowTicks: ["g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8", "g9", "g10"]
  colTicks: ["rand T", "rand V", "rand S", "group T", "group V", "group S", "time T/V", "time S", "time Q"]
  cells:
    - [0.8, 0.1, 0.1, 1, 0, 0, 1, 0, 0]
    - [0.8, 0.1, 0.1, 1, 0, 0, 1, 0, 0]
    - [0.8, 0.1, 0.1, 0, 1, 0, 1, 0, 0]
    - [0.8, 0.1, 0.1, 1, 0, 0, 1, 0, 0]
    - [0.8, 0.1, 0.1, 1, 0, 0, 1, 0, 0]
    - [0.8, 0.1, 0.1, 1, 0, 0, 0, 0, 1]
    - [0.8, 0.1, 0.1, 1, 0, 0, 0, 1, 0]
    - [0.8, 0.1, 0.1, 0, 0, 1, 0, 1, 0]
    - [0.8, 0.1, 0.1, 1, 0, 0, 0, 1, 0]
    - [0.8, 0.1, 0.1, 1, 0, 0, 0, 1, 0]
  highlight: [{ row: 5, col: 8 }, { row: 7, col: 5 }]
  legend: "cell = share of a group's items in a role; random rows straddle all roles, group and time rows are one-hot"
```

## Implementation

The contract is enforced at two boundaries. At the training boundary, membership in 𝒯 is a fact about what the data loader consumed: the *Model / autograd framework* layer (PyTorch) and the *Distributed training* layer (TorchTitan, Nanotron) determine which document ids reach the optimiser, and a run that does not log consumed document or shard ids cannot later answer "was item x in 𝒯?" except by the detection methods of §8.5. Whether these systems log consumed document identifiers by default is NOT-DISCLOSED here (not inspected); the manifest of §6.6 requires the log regardless. At the evaluation boundary, the harness configuration names which split supplies few-shot examples and which supplies scored items; the LM Evaluation Harness expresses a task as a configuration file communicated "along with a linked library version" (PAPER-REPORTED · R6.4; the harness is outside the reference stack). Few-shot exemplars must come from 𝒯 or 𝒱, never 𝒮 — drawing them from the test split is a group-split violation when exemplars and scored items share templates (DERIVED).

```text
Systems trace (partition enforcement)
hash + group keys  → compute: one hash per item / memory: O(|𝒫|) keys / failure: wrong key granularity
training loader    → storage: ASSUMED 8–16 raw bytes per document id before metadata/indexes / failure: log absent → membership unanswerable
evaluation harness → failure: few-shot split = test split; silent dataset revision change
ledger append      → storage: one row per decision / failure: informal "quick looks" at test never recorded
```

Cost line: the consumed-id log for a corpus of 10⁹ documents at 16 bytes per id is 16 GB — small against the corpus, and supports exact membership checks when ids map unambiguously to immutable source records (DERIVED; the document count is an ASSUMED illustration).

## Experimental design

### Experiment 6.2 — Leakage gap of random versus group splits, and optimism under exposure

- **Hypothesis:** (a) for a dataset with shared-source items, a unit fine-tuned on the training role scores higher under a random split than under a group split by an amount that grows with the between-group variance share; (b) selecting the best of k variants fixed independently of the test sample on a test set of n clusters inflates its score by an amount bounded by Eq. 6.4 and visible on a fresh test set.
- **Setup:** one small open checkpoint; one reading-comprehension-style dataset with passage keys; two partitions of the same pool by Algorithm 6.2 (group key = passage; group key = item id, i.e. random); k ∈ {1, 10, 100} variants differing in seed and prompt format.
- **Independent variables:** split type; k; whether selection used 𝒱 or 𝒮.
- **Controlled variables:** pool, role fractions, fine-tuning tokens and FLOPs, scaffold, engine, hardware.
- **Dataset/workload:** a public passage-grouped QA dataset; a second, disjoint sample from the same source held back as the fresh test set.
- **Hardware:** single accelerator class; recorded.
- **Metrics:** Eq. 6.1 on each test set; leakage gap = q̂_random − q̂_group; optimism = q̂_selected(𝒮) − q̂_selected(fresh); intervals by the paired cluster bootstrap (Algorithm 2.5 of §2.5) with passages as clusters.
- **Baselines:** the pretrained checkpoint without fine-tuning (no training-role exposure, so the leakage gap should be zero up to noise).
- **Expected result:** positive leakage gap after fine-tuning, near zero for the baseline; optimism increasing in k and below the Eq. 6.4 bound; near-zero optimism when selection used 𝒱.
- **Ablation:** shuffle passage keys (destroying group structure) to confirm the gap vanishes.
- **Interpretation:** quantifies, for one dataset, the two leaks the contract closes; does not estimate contamination of any public benchmark.
- **Threats to validity:** the fresh sample may differ in difficulty (the R6.14 finding); fine-tuning exaggerates group fitting relative to pretraining exposure.

Proposal only; no run was executed.

## Observations

**What the paper claims.** R6.14 claims large absolute drops on fresh test sets with preserved ordering and attributes them to difficulty shift. R6.31 claims drops of up to 8% on a GSM8k replica concentrated in some model families. R6.19 claims degradation beyond the training period. R6.16 and R6.15 claim validity guarantees under adaptive reuse. R6.18 proposes design-time publication controls. P07 claims its MMLU and HellaSwag gains are not explained by flagged overlap. R6.17 claims leakage is widespread across ML-based science.

**What the evidence shows.** PAPER-REPORTED: R6.14 and R6.31 study different benchmarks and model populations; the first reports broad preservation of comparative improvements, whereas the second reports model-dependent arithmetic gaps. DERIVED: neither establishes that benchmark reuse is generally harmless or identifies contamination from a performance gap alone. R6.15 and R6.16 provide adaptive-reuse guarantees under their specified mechanisms; P07's overlap check is a within-paper analysis with acknowledged detection limitations.

**What we infer.** MATHEMATICALLY-DERIVED: Eq. 6.5's bias has magnitude at most f_c(u), because success probabilities lie in [0,1]. It is bounded and unit-specific. Eq. 6.4 gives a fixed-candidate expected-optimism bound under its assumptions; it does not establish common bias across units or cover arbitrary adaptive reuse. UNVERIFIED: which mechanism dominates ranking distortion for a particular benchmark. ASSUMED: benchmark-informed data selection merits a separate audit because simple exact-overlap checks need not detect it.

**What remains unknown.** Training cut-offs and training-set membership for most closed units are NOT-DISCLOSED. The contamination fraction f_c(u) of any public benchmark for any specific unit is UNVERIFIED here. Whether ordering robustness (R6.14) holds for generative language benchmarks at large is UNVERIFIED beyond the single replica in R6.31.

## Failure modes

> **Failure mode — Test set used as development set [DERIVED].** *Symptom:* prompts or checkpoints were selected using test outcomes; a fresh sample may expose a gap. *Cause:* selection on 𝒮. *Detection:* audit decisions against the exposure ledger; a missing ledger leaves the history unresolved. *Mitigation:* select on 𝒱, retain a fresh independent test, and apply Eq. 6.4 only to candidates fixed independently of that test.

> **Failure mode — Sibling leakage.** *Symptom:* high test score, poor performance on new sources. *Cause:* random split across shared passages, templates, or repositories. *Detection:* leakage gap of Experiment 6.2; group keys overlapping between roles. *Mitigation:* group split by the coarsest plausible key.

> **Failure mode — Temporal inversion.** *Symptom:* a unit "predicts" events or solves problems published before its cut-off. *Cause:* test timestamps precede the unit's training cut-off. *Detection:* Algorithm 6.2 line 9; an overlapping cut-off prevents temporal certification but does not itself prove item exposure. *Mitigation:* temporal split; mark units with undisclosed cut-offs.

> **Failure mode — Selection-induced contamination.** *Symptom:* gains concentrated on tasks resembling the data filter's positive examples. *Cause:* path (iv). *Detection:* compare gains on in-domain versus held-out-domain tasks (verification protocol). *Mitigation:* held-out domain as a registered test role; disclose filter training data.

> **Failure mode — Moving endpoint.** *Symptom:* a temporal benchmark's scores rise mid-window with no announced release. *Cause:* provider-side weight update shifts the cut-off. *Detection:* repeated dated measurements (§6.4). *Mitigation:* attribute results to (endpoint, date); never pool across an unexplained jump.

## Siblings

**Static held-out split** — this file, Eq. 6.3 first condition
Why it exists: cheapest independence guarantee. What assumption changed: none; rows are iid. What problem it solved: overfitting to training rows. New failure mode: sibling leakage, contamination, reuse. Changed primitive: none (baseline).

**Temporal refresh benchmarks** — this file; portfolio use in [§61.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-3-version-and-protocol-control.md)
Why it exists: static items end up in crawls. What assumption changed: the test set is a process, not a file. What objective changed: performance on recent items. What problem it solved: path (i) and (ii) for units with known earlier cut-offs. New failure mode: scores not comparable across refreshes; authoring cost. Changed primitive: fixed 𝒮 → dated stream of 𝒮_t.

**Private or gated test sets** — [§61.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch61-capability-portfolios-and-benchmark-validity/61-4-validity-threats.md)
Why it exists: public items get crawled. What assumption changed: the evaluator, not the developer, holds 𝒮. What problem it solved: paths (i)–(iii). New failure mode: no external audit of item quality; evaluator becomes a trusted party. Changed primitive: public file → query interface.

**Reuse-robust leaderboards (Ladder, reusable holdout)** — this file, R6.15, R6.16
Why it exists: leaderboards are adaptive by construction. What assumption changed: answers to test queries are deliberately coarsened or noised. What objective changed: leaderboard accuracy under adaptivity. What problem it solved: adaptive-query validity under each method's own assumptions. New failure mode: small true gains invisible. Changed primitive: exact test statistic → thresholded or noised statistic.

**Contamination detection** — [§8.5 Evaluation contamination](../../part-02-data-and-representation-engineering/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md)
Why it exists: design-time control is unavailable for third-party units. What assumption changed: membership is inferred, not known. What problem it solved: after-the-fact audit. New failure mode: false positives and negatives (P07 reports the former). Changed primitive: contract → detector.

## Extensions

For domain adaptation the group key must include the domain source so that a held-out *domain* exists, not only held-out rows. For long context, documents concatenated into one context must not mix roles. For multimodality, group keys follow the underlying asset (one video yields many clips). For agents and environments, the group is the environment instance or repository snapshot, and the temporal key is the snapshot date. For embodiment, the group is the scene or object set. Proposal: register group keys per modality in the manifest and treat an item with a missing key as its own group only after review.

## Limitations

DERIVED: Eq. 6.3 requires sufficient lineage and timestamp evidence. Eq. 6.4 bounds expected optimism for fixed candidates, not an individual realised gap or arbitrary adaptive search. Group keys can be too coarse or too fine. A fresh-test gap alone cannot separate difficulty shift, exposure, and selection. Absence of a gap does not prove absence of contamination, because f_c(u) may be positive while p_c(u) − p_0(u) is small. A checkpoint cut-off later than test publication does not prove exposure; it prevents temporal certification based on dates alone. Report such scores with unresolved lineage and limit the claim accordingly, rather than treating missing evidence as either cleanliness or proven contamination.

## Reproducibility

Versions: R6.14 arXiv 1902.10811; R6.15 arXiv 1506.02629; R6.16 arXiv 1502.04585; R6.17 arXiv 2207.07048; R6.18 arXiv 2305.10160; R6.19 arXiv 2102.01951; R6.20 arXiv 2406.19314; R6.21 arXiv 2005.14165; R6.31 arXiv 2405.00332; P07 arXiv 2406.11794 v4 (HTML); P50 (ar5iv); all accessed 2026-09-20. Artifacts: `partition.yaml`, the exposure ledger. Configuration: salt, group key definition, t_cut, role fractions. Metric definitions: leakage gap and optimism as in Experiment 6.2. Unresolved: closed-unit cut-offs and membership (NOT-DISCLOSED); benchmark-specific f_c(u) (UNVERIFIED).

## References

P07, P50; R6.1, R6.4, R6.13, R6.14, R6.15, R6.16, R6.17, R6.18, R6.19, R6.20, R6.21, R6.22, R6.24, R6.31, R6.32; book_plan.md Appendix C.
