---
id: ms.section.22.2
entity_type: section
title: Distribution transitions
short_title: Distribution transitions
volume: 1
part: 4
chapter: 22
section: 22.2
slug: 22-2-distribution-transitions
parent: ms.chapter.22
prev_sibling: ms.section.22.1
next_sibling: ms.section.22.3
children: []
prerequisites: [ms.chapter.9, ms.chapter.10, ms.chapter.11, ms.chapter.12, ms.chapter.19, ms.chapter.20, ms.chapter.21]
downstream: [ms.chapter.23, ms.chapter.24, ms.chapter.31]
related: [ms.chapter.49, ms.chapter.50, ms.chapter.63]
relations: []
axes: {lifecycle: [continued_training, adaptation], mechanism: [distribution_transition, retention, adaptation_decision], feedback_setting: [], modality: [text]}
papers: [P13, P40]
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 22.2 Distribution transitions

## Scope

[DERIVED] This section owns the adaptation-specific change from an existing exposure distribution to a target distribution: new domains and languages, code/math emphasis, long-context data, and altered sequence structure. Chapter 09 owns general data-mixture design; Chapters 10 and 15 own tokenization and positional mechanisms. Here the question is which distributional coordinates change, how many usable targets the stage actually supplies, and whether observed gains survive an evaluation that separates these changes.

## Why this exists

[DERIVED] “More domain tokens” leaves four quantities unresolved: available unique material, sampled material, consumed positions, and supervised targets. A million short documents and a few hundred long documents can have the same token count while presenting different boundaries and dependencies. Repetition can increase consumption without increasing unique support. Packing can change the conditional prefixes seen during training even when the documents remain identical.

[DERIVED] Adaptation also creates an allocation problem. At fixed compute, adding replay or long documents displaces other exposure. At fixed new-domain exposure, those additions increase the total budget. Comparing runs without stating which boundary is fixed can make a retention method appear free or a length-extension recipe appear unusually efficient. The intervention needs an exposure ledger and a compute ledger.

## Intuition

[MATHEMATICALLY-DERIVED] Let $\mathcal P_k$ be the example distribution of source $k$, and $w_{s,k}$ its sequence-sampling probability at stage $s$. The sequence mixture is $\mathcal P_s=\sum_k w_{s,k}\mathcal P_k$. If source $k$ contributes an expected $q_k$ supervised tokens per sampled example, its fraction of the aggregate token loss is not generally $w_{s,k}$. It is proportional to $w_{s,k}q_k$. Long documents and response masks therefore alter the effective objective even before any learning-rate change.

[DERIVED] A language transition can also change tokenization efficiency. A fixed number of tokenizer tokens does not imply equal bytes, words, or documents across languages. The same problem appears when code punctuation or mathematical notation is fragmented differently. Preserve tokenizer identity and report bytes or document counts as secondary exposure measures where they reveal the change. A cross-tokenizer loss comparison requires a common measurement unit rather than a nominally identical token count.

## Formulation

[MATHEMATICALLY-DERIVED] For source-independent sampling probabilities $w_{s,k}\ge0$, $\sum_k w_{s,k}=1$, define $q_k=\mathbb E_{\mathcal P_k}\sum_t m_t>0$ and $a_k(\theta)=\mathbb E_{\mathcal P_k}\sum_t m_t\ell_t(\theta)$. Then

$$
J_s(\theta)=\frac{\sum_k w_{s,k}a_k(\theta)}
                 {\sum_j w_{s,j}q_j}
=\sum_k \alpha_{s,k}J_k(\theta),
\quad
\alpha_{s,k}=\frac{w_{s,k}q_k}{\sum_j w_{s,j}q_j},
\quad J_k=\frac{a_k}{q_k}.
$$
*(Eq. 22.4)*

[MATHEMATICALLY-DERIVED] To realize desired supervised-token fractions $\alpha_k^\star$ by example sampling, use

$$
w_k^\star=
\frac{\alpha_k^\star/q_k}{\sum_j\alpha_j^\star/q_j}.
$$
*(Eq. 22.5)*

[MATHEMATICALLY-DERIVED] These equations assume stationary expected lengths and masks during the counted interval. Filtering, truncation, packing, and selective rejection can invalidate a previously estimated $q_k$. Measure realized counts after those transforms. If $q_k=0$, the source cannot contribute to this loss and Eq. 22.5 is undefined for a positive target share.

[DERIVED] Represent the distribution transition as changes in a joint law over source, language, length, document boundary, context structure, and target mask:

$$
\mathcal P_s(z)=\mathcal P_s(k,\mathrm{lang},T,
\mathrm{boundaries},\mathrm{serialization},m,x).
$$
*(Eq. 22.6)*

[DERIVED] This decomposition identifies ablations; it does not assume that its coordinates are independent. For example, long documents may predominantly belong to a new language, confounding language and context extension.

## Mechanism

### Methodology

[DERIVED] First partition the target deficiency into changes in marginal exposure and changes in conditional structure. A code/math emphasis can reweight existing document types. A new language may alter both source distribution and segmentation. Long-context adaptation additionally changes the distribution of distances between relevant tokens. A successful stage must supply examples whose task requires those distances; a longer padded tensor alone does not create supervision for long-range dependence.

[DERIVED] Next choose the sampling unit. If the budget is specified in supervised tokens, sequence sampling must be translated through Eq. 22.5 or implemented by a token-aware sampler. For document sampling, preserve document-level weights and track the resulting token fractions. For length buckets, log both selected documents and admitted positions after truncation. These alternatives produce different populations and should not share a single “data ratio” field.

[DERIVED] Apply leakage controls before mixture tuning. Keep evaluation examples, derived solutions, synthetic rewrites of evaluation questions, and near-duplicate source documents out of candidate pools according to the evaluation's declared rules. A generated question based on a benchmark test item remains derived evaluation material. The absence of an exact answer string is not proof of independence.

[DERIVED] Then specify sequence construction. Document packing without cross-document masking permits conditional dependencies across adjacent documents; isolation masks remove those dependencies but change which attention pairs are admitted. Neither choice is universally correct. Match the intended objective and evaluation interface, and identify separator targets. For fill-in-the-middle, distinguish the transformed sequence distribution from the underlying source corpus; Chapter 19 owns the objective construction.

[MATHEMATICALLY-DERIVED] For $D_s$ consumed tokens and realized source fractions $\hat\alpha_k$, source exposure is $D_{s,k}=D_s\hat\alpha_k$. If the source has $U_k$ available tokens, mean corpus equivalents are $e_k=D_{s,k}/U_k$. Large $e_k$ means repeated exposure, not necessarily overfitting; that outcome requires held-out measurements. It does imply that nominal consumed tokens cannot be interpreted as unique new evidence.

[MATHEMATICALLY-DERIVED] For a full-attention layer with model width $d_{\mathrm{model}}$, attention score/value work per sequence scales as $O(T^2d_{\mathrm{model}})$, while tokenwise projections scale as $O(Td_{\mathrm{model}}^2)$. Holding batch tokens $Q=BT$ fixed makes the attention term $O(QTd_{\mathrm{model}})$. Thus increasing sequence length by $r$ at fixed $Q$ multiplies that term by $r$, even though tokens per step remain constant. Sparse/local attention and hybrid architectures require their own accounting.

```figure
id: fig-22.6
kind: diagram
title: Exposure law after sequence construction
caption: Sampling ratios act before filtering, truncation, masks, and packing. Measure realized targets after all transforms before assigning a source share to the loss.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-22.4
alt: Versioned source pools pass through source sampling and sequence construction. The constructed sequences produce separate counts of consumed positions and supervised targets, which define realized objective weights.
spec:
  direction: TB
  nodes:
    - { id: pools, kind: dataset, label: Versioned source pools }
    - { id: sample, kind: process, label: Example or token sampling }
    - { id: construct, kind: process, label: Filter truncate pack mask }
    - { id: positions, kind: metric, label: Consumed positions }
    - { id: targets, kind: metric, label: Supervised target counts }
    - { id: effective, kind: objective, label: Realized source weights }
  edges:
    - { from: pools, to: sample }
    - { from: sample, to: construct }
    - { from: construct, to: positions }
    - { from: construct, to: targets, kind: emphasis }
    - { from: targets, to: effective }
```

## Algorithm

[DERIVED] **Algorithm 22.2 — Admit a distribution transition.** Inputs are source pools $\{\mathcal P_k,U_k\}$, desired target fractions $\alpha^\star$, fixed transformations $\Phi_s$, calibration sample count $n$, tolerance $\varepsilon_\alpha>0$, and budget $D_s$. A deterministic transformation includes its random seed in state. Output is a frozen sampler or rejection.

$$
\begin{aligned}
1.\quad&
\hat q_k\gets n^{-1}\sum_{i=1}^{n}
q\!\left(\Phi_s(z_{k,i})\right),\quad z_{k,i}\sim\mathcal P_k.\\
2.\quad&
\mathcal A\gets\{k:\alpha_k^\star>0\};\quad
\exists k\in\mathcal A:\hat q_k\le0
\ \Rightarrow\ \operatorname{return}(\bot).\\
&w_k\gets
\begin{cases}
\frac{\alpha_k^\star/\hat q_k}
{\sum_{j\in\mathcal A}\alpha_j^\star/\hat q_j},&k\in\mathcal A,\\
0,&k\notin\mathcal A.
\end{cases}\\
3.\quad&
\hat Q_k\gets\sum_{i=1}^{n}
\mathbf1\{k_i=k\}\,q(\Phi_s(z_i)),\quad
k_i\sim w,\ z_i\sim\mathcal P_{k_i}.\\
4.\quad&
\sum_j\hat Q_j=0\ \Rightarrow\ \operatorname{return}(\bot);\quad
\hat\alpha_k\gets\hat Q_k/\sum_j\hat Q_j,\qquad
e_k\gets\begin{cases}
D_s\hat\alpha_k/U_k,&k\in\mathcal A,\\
0,&k\notin\mathcal A.
\end{cases}\\
5.\quad&
r\gets
\begin{cases}
(w,\Phi_s,\hat\alpha,e,D_s),&
\|\hat\alpha-\alpha^\star\|_1\le\varepsilon_\alpha
\ \land\ \mathsf{LeakageGate}=1,\\
\bot,&\text{otherwise}.
\end{cases}
\end{aligned}
$$

[DERIVED] Before Step 1, require integer $n\ge1$, finite $D_s>0$, $\alpha^\star$ on the probability simplex, and finite $U_k>0$ for active sources; reject otherwise. Set $e_k=0$ for inactive sources with $U_k=0$. Reject non-finite counts before normalization. The invariant is that the admitted record describes post-transform counts rather than intended pre-transform weights. Calibration and validation samples are distinct. Finite $n$ gives sampling uncertainty; $\varepsilon_\alpha$ is a chosen acceptance tolerance, not a confidence guarantee. The bounded procedure returns after one calibration and one validation pass; a rejected design requires a separately logged revision.

## Implementation

[DERIVED] **PyTorch — core training framework; Hugging Face Transformers — model-definition layer.** The conceptual data path is token IDs and masks $[B,T]$, position IDs or equivalent context state, attention constraints, shifted targets, and source tags retained for loss accounting. Framework-specific collators must preserve all required tags through packing. Reading a framework's API does not establish that a particular recipe uses an isolation mask or a specific packing policy.

[MATHEMATICALLY-DERIVED] A dense full-parameter stage has persistent parameter, gradient, and optimizer memory proportional to $N$, with coefficients determined by dtype and sharding. Long-context changes activation storage and attention work; it does not multiply optimizer state merely because $T$ increases. Activation recomputation trades storage for additional compute. Context parallelism adds communication; the exact volume depends on the attention layout and implementation and is NOT-DISCLOSED for an unspecified stage.

[DERIVED] Count preprocessing and deduplication work separately from learner FLOPs. Dataset streaming introduces storage/network traffic and can constrain achieved throughput. A compute-equivalent data comparison should equalize relevant executed work when different length distributions have different cost per token. Equal token counts are sufficient only under an explicitly justified constant-cost-per-token approximation.

```figure
id: fig-22.7
kind: calculator
title: Sequence share versus target share
caption: Illustrative two-source mixture using Eq. 22.4. Equal sequence sampling gives unequal loss weight when one source supplies four times as many supervised targets.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-22.4
alt: With equal sequence sampling, 1024 supervised targets in source one and 4096 in source two, source one contributes 20 percent of the target-normalized loss.
states:
  - { anchor: formulation, label: Unequal lengths, variables: { w: 0.5, q1: 1024, q2: 4096 }, note: Sequence probability is not token-objective share. }
  - { anchor: mechanism, label: Equal target share, variables: { w: 0.8, q1: 1024, q2: 4096 }, note: Four short sequences per long sequence equalize target contribution. }
spec:
  tex: \alpha_1=wq_1/(wq_1+(1-w)q_2)
  equation: "22.4"
  inputs:
    - { symbol: w, label: source one sequence share, default: 0.5, min: 0, max: 1, step: 0.01, format: fixed3 }
    - { symbol: q1, label: source one targets, default: 1024, min: 128, max: 8192, scale: log2, format: tokens }
    - { symbol: q2, label: source two targets, default: 4096, min: 128, max: 8192, scale: log2, format: tokens }
  outputs:
    - { symbol: a, label: source one target share, formula: w*q1/(w*q1+(1-w)*q2), format: percent, emphasis: true }
```

```figure
id: fig-22.8
kind: stat-panel
title: Distribution audit coordinates
caption: The same source tokens can define different objectives after a context or mask change. Preserve each coordinate in the stage manifest.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-22.6
alt: The distribution audit records source, language, length, document boundaries, serialization, and target masks as separate coordinates.
spec:
  header: EXPOSURE TRANSITION
  rows:
    - { key: membership, value: source and language }
    - { key: structure, value: length and boundaries }
    - { key: targets, value: masks after construction }
    - { key: counts, value: unique sampled consumed }
    - { key: contamination, value: original and derived material }
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] DeepSeekMath-Base 7B starts from the code checkpoint immediately before its decay phase and consumes 500B tokens: 56% selected math web, 4% mathematical code, 10% arXiv, 20% GitHub code, and 10% natural language. The reported peak LR is $4.2\times10^{-4}$, batch 10M tokens, context 4K. Corpus screening also compares 1.3B models trained for 150B tokens across alternative mathematical corpora. Precision, seed-level uncertainty, and complete execution costs for these comparisons are not established here. [R22.2]

[PAPER-REPORTED] Olmo 3 screens candidate data by comparing a standard 5B-target/5B-web microanneal against 10B web-only training, then evaluates candidate 100B mixtures and their subsequent SFT behavior. The report explicitly notes variants without compute-matched comparisons. Domain-skewed mixtures reveal cross-domain tradeoffs. This is a disclosed screening/integration workflow, not proof that small-pilot rankings always transfer. [R22.4]

[PAPER-REPORTED] DeepSeek-V3 extends context from 4K to 32K and then 128K in two 1,000-step stages, using sequence batches 1,920 and 480 and LR $7.3\times10^{-6}$. It adjusts YaRN on the decoupled positional key. Its NIAH figure is evaluated after SFT. Optimizer-state carry-over at those boundaries is NOT-DISCLOSED in the inspected description. [P13]

## Observations

**What the paper claims.** [PAPER-REPORTED] DeepSeekMath reports that source choice matters under matched corpus-screening token budgets; arXiv-heavy training does not provide the expected gains in its adopted math tests. [R22.2]

**What the evidence shows.** [DERIVED] Token-matched screening isolates more than a raw corpus-size comparison but still requires accounting for repetition, tokenizer identity, length distribution, and data processing. A negative observation about a particular corpus and evaluator does not establish that archival scientific text is universally unhelpful.

**What we infer.** [MATHEMATICALLY-DERIVED] Using the declared length units, the two V3 extension batches have equal batch-position count because $1920\times32=480\times128$. Their full-attention work need not be equal. Eq. 22.4 likewise explains why source percentages must identify their denominator.

**What remains unknown.** [UNVERIFIED] The book has not reproduced these transitions or tested their transfer to a target organization’s corpus. No universal language, domain, or context mixing ratio follows from the cases.

## Failure modes

[DERIVED] Watch for source-share drift after truncation, repeated-document concentration, train/evaluation overlap introduced by synthetic transformations, and context examples that contain no relevant long-distance relation. Their observable symptoms differ: source-count discrepancies, heavy-tail repetition, contaminated identifiers, and a gap between short retrieval tests and long document reasoning. Track them independently.

[DERIVED] A changing tokenizer invalidates nominal token-equivalence comparisons. A changing mask can reduce effective target count while leaving learner positions unchanged. A changing context policy can silently allow cross-document conditioning. These are distribution failures even when the learner's scalar loss is finite.

## Siblings

[DERIVED] Abrupt reweighting maximizes a clean boundary for an ablation; a gradual curriculum changes exposure continuously and needs a time-indexed $\mathcal P_s$. Token-balanced mixing and document-balanced mixing answer different allocation questions. Long-document selection and synthetic long-context tasks also differ: one preserves observed document structure, while the other introduces generator-dependent structure. Their quality is an empirical question, not a property of the source label.

## Extensions

[DERIVED] Screening individual sources before integration reduces the cost of exploring a large candidate pool, but interactions between sources remain. The mechanism changed by integration is the joint exposure law. Evaluate both the base candidate and the intended downstream post-training path when the artifact's purpose is to initialize that path; a stage can improve one while harming the other.

[DERIVED] A controlled curriculum study should hold the multiset of consumed examples constant while changing their order, then vary the learning-rate trajectory separately. Otherwise a schedule effect and a data-order effect are inseparable. This is a proposed design criterion, not a reported outcome.

## Limitations

[DERIVED] Sequence and target accounting identify the intervention but do not model the information content of examples. Equations 22.4–22.5 cannot predict capability gains from a source's quality score. Long-context competence likewise requires more than the maximum admitted length. Retain domain, distance, language, and format slices even when an overall metric improves.

## Reproducibility

[DERIVED] Archive source snapshots, overlap rules, sampling units, transforms, tokenizer hash, length histograms before and after packing, per-source consumed positions, supervised targets, and exposure counts. Pin the evaluation harness and any generator used for synthetic data. The source ledger records exact inspected revisions and the disclosed limitations; no training run was executed for this chapter.

## References

- [R22.2](references.md#r222) — DeepSeekMath methods and corpus comparisons.
- [R22.4](references.md#r224) — Olmo 3 screening and integration.
- [P13](references.md#p13) — V3 context-extension protocol.
