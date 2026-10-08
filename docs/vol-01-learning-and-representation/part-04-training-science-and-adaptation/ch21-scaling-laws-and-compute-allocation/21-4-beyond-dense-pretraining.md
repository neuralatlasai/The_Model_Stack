---
id: ms.section.21.4
entity_type: section
title: Beyond dense pretraining
short_title: Beyond dense pretraining
volume: 1
part: 4
chapter: 21
section: '21.4'
slug: 21-4-beyond-dense-pretraining
parent: ms.chapter.21
prev_sibling: ms.section.21.3
next_sibling: ms.section.21.5
children: []
prerequisites:
- ms.chapter.6
- ms.chapter.9
- ms.chapter.13
- ms.chapter.19
- ms.chapter.20
downstream:
- ms.chapter.22
- ms.chapter.29
- ms.chapter.30
related:
- ms.chapter.35
- ms.chapter.36
- ms.chapter.59
siblings_by_mechanism: []
relations:
- type: supported_by
  target: paper.P08
- type: supported_by
  target: paper.P09
axes:
  lifecycle:
  - pretraining
  - post_training
  - evaluation
  - inference
  mechanism:
  - scaling_laws
  - compute_allocation
  feedback_setting: []
  modality:
  - text
papers:
- P07
- P08
- P09
implementations: []
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 2000
updated_at: '2026-10-08'
editorial_status: manuscript_draft
---

# 21.4 Beyond dense pretraining

[DERIVED] The two-coordinate surface $L(N,D)$ is useful when other relevant choices are fixed. Sparse activation, repeated data, filtering, multilingual transfer, context extension, teacher supervision, reinforcement learning and inference-time search each change what those coordinates mean or add another response mechanism. A method's scaling analysis must therefore specify its controlled intervention and cost boundary before comparing exponents or optima.

## Formulation

[DERIVED] A general accounting form is $Y=F(N_{\mathrm{total}},N_{\mathrm{active}},D,U,\pi,s,\mathcal T,\mathcal R,B;\mathcal E)$, where $\pi$ is a data mixture, $s$ is context length, $\mathcal T$ a teacher/supervision configuration, $\mathcal R$ an RL recipe, $B$ an inference budget and $\mathcal E$ the evaluation contract. This notation is a dependency inventory, not a proposed universal fitted equation. The following primary studies estimate restricted slices with distinct functional forms. Their empirical findings cannot identify all coordinates simultaneously.

## Methodology

### Repeated presentations are not additional unique data

[PAPER-REPORTED] Muennighoff et al. extend dense scaling to constrained unique data. Let $U_D$ be unique training tokens and $R_D=D/U_D-1$ the repetitions beyond the first pass. Their effective-data term is

$$
D_{\mathrm{eff}}=U_D\left[1+R_D^*\left(1-e^{-R_D/R_D^*}\right)\right].
$$
*(Eq. 21.14)*

[MATHEMATICALLY-DERIVED] For $U_D>0$, $R_D\ge0$ and $R_D^*>0$, this equals $U_D$ after one pass, has initial marginal benefit $dD_{\mathrm{eff}}/dD=1$, and approaches $U_D(1+R_D^*)$ after unlimited repetitions. The marginal is $e^{-R_D/R_D^*}$, so $R_D^*$ is an e-folding scale in this parameterization, not literally the repetition count at half benefit. At half marginal benefit, $R_D=R_D^*\log2$. The reported model also saturates effective model capacity with an analogous term before inserting both effective coordinates into an additive loss law. [R21.4, section 3]

[PAPER-REPORTED] Their study runs more than 400 experiments, using C4, GPT-2-style models, shuffled repeated epochs and horizon-matched cosine schedules. Fits use a subset of those runs. Moderate repetition can remain competitive in the tested data-limited regime; extensive repetition eventually shows diminishing returns and, in some configurations, worsening behavior. This supports distinguishing $D$ from $U$, rather than treating repeated tokens as cost-free substitutes for unique text. [R21.4, sections 3–4]

[DERIVED] Eq.21.14 is a saturating benefit model, not a model of arbitrary overfitting. Its monotonicity cannot represent loss increasing with repetition without an added mechanism or restricted fitting domain. Identical token counts also do not make synthetic, augmented and verbatim repeated data equivalent: their distributions and information overlap require separate measurement.

### Sparse routing separates stored capacity from activated work

[PAPER-REPORTED] Clark et al. train 168 routed models across base sizes, expert counts and three routing mechanisms, alongside dense baselines. Their fixed-data study fits a log-loss law with a base-size/expert-count interaction, schematically

$$
\log L=a\log N+b\log\widehat E+c\log N\log\widehat E+d.
$$
*(Eq. 21.15)*

[DERIVED] Here $N$ is their base-model coordinate and $\widehat E$ a saturation-adjusted expert coordinate. The interaction means the marginal expert benefit depends on base size; it is not equivalent to adding all experts to a dense parameter count. A fixed-data fit does not determine how optimal training duration changes with compute. [R21.5, sections 3–4]

[PAPER-REPORTED] Krajewski et al. add granularity $G$, shrinking individual expert width while activating more experts so the active feed-forward capacity can remain comparable. They study over 100 configurations with expansion fixed at 64, total non-embedding sizes from 129M to 3.7B, and 16B–130B training tokens. Their fitted surface is

$$
L(N,D,G)=c+(a+gG^{-\gamma})N^{-\alpha}+bD^{-\beta}.
$$
*(Eq. 21.16)*

[DERIVED] Optimizing this surface requires their router-inclusive work model. Using $6N_{\mathrm{total}}D$ charges every expert as active; using active weight FLOPs alone omits routing and communication. Increasing $G$ can improve the fitted loss term while increasing router cost. A training-FLOP advantage therefore need not translate to better latency or memory at a particular batch and interconnect. The fixed expansion and tested granularity range delimit the reported result. [R21.6, sections 4–6]

### Data quality changes the response surface

[PAPER-REPORTED] DataComp-LM fixes training/evaluation recipes and compares data curation at multiple scales. Its baseline development includes hundreds of experiments; its benchmark scales vary from sub-billion models to 6.9B models and different token budgets. Model-based filtering is a reported intervention rather than a latent property inferred from downstream scores alone. [P07, sections 2–4/Appendices]

[DERIVED] If filtering keeps fraction $r$ of a corpus, the available tokens change from $U$ to approximately $rU$ under the same tokenizer. The distribution also changes from $q$ to $q_r$. A gain at fixed $D$ may reflect higher relevance, removal of duplication, different domain proportions or increased repetition of the retained material. A scalar “quality multiplier” is not identified by one such comparison. The scaling family must condition on the filter, its scoring model, threshold, extraction and deduplication policy. The cost of scoring and curating is also separate from final training FLOPs.

[DERIVED] Proxy-scale curation rankings are useful only if their transfer is validated at larger scales. Contamination, licensed-source availability and tokenizer effects can affect both the selected data and evaluation. Data provenance belongs to Chapters 17–18; the allocation consequence here is that $A,B,E$ and possibly exponents are conditional on the curation procedure rather than constants attached to a raw token count.

### Multilingual allocation needs transfer and repetition coordinates

[PAPER-REPORTED] He et al. fit language-family loss as a product of a model/data term and mixture proportion:

$$
L_i(N,D,p_i)=\left(E_i+A_iN^{-\alpha_i}+B_iD^{-\beta_i}\right)p_i^{-\gamma_i}.
$$
*(Eq. 21.17)*

[PAPER-REPORTED] The study uses more than 100 models, 23 languages grouped into five operational families and systematic mixture changes. Its family grouping seeks to reduce omitted cross-group transfer; tests with alternative groupings reveal why the grouping assumption matters. It does not show that every pair of individual languages transfers negligibly. [R21.7, sections 3–5]

[MATHEMATICALLY-DERIVED] With fixed $N,D$, write the parenthesized term as $c_i$ and minimize $\sum_iw_ic_ip_i^{-\gamma}$ subject to $\sum_i p_i=1$. For common positive $\gamma$ and positive $w_ic_i$, the interior optimum is $p_i\propto(w_ic_i)^{1/(1+\gamma)}$. Evaluation preference weights $w_i$ differ from training shares $p_i$. Unequal exponents require solving the shared Lagrange multiplier rather than applying this common-exponent expression.

[PAPER-REPORTED] The February 2026 ATLAS revision instead models effective data with saturating repetition and measured cross-language transfer. Its form includes a target-language contribution, explicit contributions from three highly co-sampled languages and a pooled remainder, each weighted by a transfer term, before applying an additive model/data law. The study spans 774 training/finetuning experiments and evaluates held-out sizes, data, compute and mixtures. [R21.8, sections 3–5/Appendices]

[MATHEMATICALLY-DERIVED] For $U>0$ and $\lambda>0$, its repetition component can be written $S_\lambda(D,U)=D$ for $D\le U$ and $U[1+(1-e^{-\lambda(D/U-1)})/\lambda]$ otherwise. This preserves the first-pass value and derivative while saturating additional benefit. At $\lambda\to0$, the continuous limit is nonsaturating. Transfer coefficients then modify effective data for the target language. Observed negative transfer scores, or small fitted transfer contributions, cannot be replaced by an assumption that all non-target tokens are equally useful; the paper's measured transfer statistic is distinct from its fitted coefficients. The later study improves out-of-sample prediction on its own holdouts; it does not establish a distribution-free multilingual law. [R21.8, section 3/Table 1]

### Context length changes both information and work

[PAPER-REPORTED] Xiong et al. extend Llama 2 through continued pretraining with altered positional frequencies and long sequences. They fit context-dependent loss with a saturating form $L(s)=(a/s)^b+c$ for a specified model/checkpoint. The reported recipe uses 400B additional tokens and model-dependent training lengths; evaluation includes long-context tasks and ordinary tasks. [R21.9, sections 2–4]

[DERIVED] Context loss is conditional on which tokens are scored and which preceding tokens are available. Longer context can reduce uncertainty by exposing relevant history, yet quadratic attention work, attention kernels, batching and cache storage alter its cost. Continuing for 400B tokens also changes the model, so improvements in short-context tasks do not isolate context length alone. A valid context-scaling comparison fixes the data, scored targets, checkpoint treatment and work boundary, or explicitly estimates their interactions. The positional mechanism itself belongs to Chapter 11.

### Distillation adds teacher quality and teacher cost

[PAPER-REPORTED] Busbridge et al. study teacher/student scaling using distinct training splits, decoder models and several protocols varying teacher compute, student compute and teacher loss. Their fitted student-loss family depends on teacher loss $L_T$ and a supervised reference student loss $\widetilde L_S$:

$$
L_S=L_T+L_T^{-c_0}\left[1+\left(\frac{L_T}{d_1\widetilde L_S}\right)^{1/f_1}\right]^{-c_1 f_1}
\left(A N_S^{-\alpha'}+B D_S^{-\beta'}\right)^{\gamma'}.
$$
*(Eq. 21.18)*

[DERIVED] Positive coefficients make this particular predicted correction positive; its fitted functional form is not an exact identity for every empirical teacher/student comparison. The teacher-quality-dependent factor captures a capacity-gap effect: stronger teachers need not monotonically improve a fixed student. Teacher loss summarizes a protocol-specific quality dimension, not all aspects of teacher alignment or pedagogical suitability. [R21.10, sections 3–4/Eq.8]

[PAPER-REPORTED] Their controlled experiments span non-embedding model sizes from 143M to 12.6B and include pure distillation settings with specified temperature and loss mixture. They compare allocation boundaries that include or exclude teacher creation and inference. Distillation's economic advantage depends on whether the teacher already exists and whether its cost is amortized across students. [R21.10, sections 3–4]

[MATHEMATICALLY-DERIVED] A simplified per-student compute boundary is $6N_SD_S+2N_TD_S+6N_TD_T/K$ when one teacher is trained and shared by $K$ equal student projects, using dense approximations. The middle term is teacher forward work for supervision; precomputed logits add storage/I/O and can change reuse. Omitting teacher work changes the question from total-program efficiency to incremental student-training efficiency. A student-only parameter count cannot resolve that distinction.

### RL compute and inference compute are different budgets

[PAPER-REPORTED] Khatri et al. fit a bounded sigmoid to reward/task performance as RL compute increases at fixed starting model and recipe:

$$
R(C)=R_0+\frac{A-R_0}{1+(C_{\mathrm{mid}}/C)^B},\qquad C,C_{\mathrm{mid}},B>0,\quad0\le R_0\le A\le1.
$$
*(Eq. 21.19)*

[DERIVED] $A$ is an asymptote, $C_{\mathrm{mid}}$ a midpoint and $B$ a slope parameter; altering a recipe can shift them differently. Compute in the paper is operationalized in GPU-hours for its systems, not a universal conversion to FLOPs. RL consumes rollout, reward/verifier and optimization work, and changes its sampling distribution during training. A pretraining token exponent does not describe those mechanisms. [R21.11, sections 2–4]

[PAPER-REPORTED] The study reports over 400000 aggregate GPU-hours and scaled runs including an 8B model to 100000 GPU-hours. Its recipe uses a specific prompt corpus, rollout settings and asynchronous RL system. Validation mean@16 is an average success statistic over samples, not pass@16. Reported forward extrapolations and leave-one-component-out ablations concern that recipe and measurement, including which changes affect efficiency versus asymptotic performance. [R21.11, sections 3–5]

[PAPER-REPORTED] Snell et al. instead hold the trained model fixed and allocate test-time work among answer sampling, verifier-guided search and iterative revision. They estimate difficulty bins from sampled success or verifier signals and select strategies with cross-validation. The study's main difficulty-estimation cost is excluded from its reported strategy budgets, which matters for deployment accounting. [R21.12, sections 3–5/Appendices]

[MATHEMATICALLY-DERIVED] Inference allocation is $\pi_*(q,B)=\arg\max_{\pi:C(\pi,q)\le B}\Pr(\mathrm{correct}\mid q,\pi)$ for a query $q$ and budget $B$. A learned difficulty estimator can approximate this conditional decision, but oracle task labels cannot be used at deployment. Search may exploit a verifier's errors; additional samples can increase selection of persuasive incorrect answers if verifier calibration degrades. The relevant scaling variable is total verified strategy work, including estimation, generation and verification, rather than merely generated answer count.

## Algorithm

[DERIVED] The following reconstruction evaluates the transfer/repetition form described above for one target language. Its fitted coefficients and source-grouping policy must come from the inspected model; it does not prescribe a new transfer estimator or claim an independently fitted mixture optimum. [R21.8, section 3]

```text
Algorithm 21.4 — Evaluate transfer- and repetition-aware language loss
INPUT: N; source presentations D_i and unique counts U_i; fitted coefficients; target t
OUTPUT: predicted target-language loss with fit-domain and accounting metadata
STATE: target's designated source group K_t; pooled remainder; lambda and transfer weights
INVARIANT: presentations and unique counts share the fitted tokenizer and corpus boundary
1. Validate finite N>0, lambda>0 and nonnegative counts; reject D_i>0 with U_i<=0.
2. Set S_i=0 for D_i=0; otherwise compute S_i=D_i when D_i<=U_i.
3. Otherwise compute S_i=U_i*[1+(1-exp(-lambda*(D_i/U_i-1)))/lambda].
4. Form pooled-remainder D_other,U_other under the fitted aggregation policy; compute S_other.
5. Form D_eff=S_target+sum over i in K_t of tau_i*S_i+tau_other*S_other.
6. If D_eff<=0, return an invalid-domain result rather than evaluate a fractional power.
7. Compute L_target=E+A*N^(-alpha)+B*D_eff^(-beta) using the fitted coefficient record.
8. Return the prediction and extrapolation flags; retain actual work on presented tokens separately.
TERMINATION: one finite source-group pass and one target prediction or explicit rejection
COMPLEXITY: O(K) arithmetic for K source groups; fitting and training costs are separate
```

## Observations

### Observation 21.4 - Added compute has mechanism-specific returns

**What the paper claims.** [PAPER-REPORTED] Primary studies describe gains and saturation in repeated-data, sparse, multilingual, distilled, RL and test-time-compute regimes. [R21.4–R21.12]

**What the evidence shows.** [PAPER-REPORTED] These studies vary different coordinates and retain negative evidence: diminishing repetition, base/expert interactions, transfer-sensitive mixtures, capacity gaps, recipe-dependent RL trajectories and verifier/search failures. Their results cannot be represented by a single unqualified parameter/token ratio. [R21.4–R21.12]

**What we infer.** [DERIVED] A new scaling coordinate is justified by its mechanism and validated predictive contribution. It must also enter resource accounting when it consumes material work.

**What remains unknown.** [UNVERIFIED] No independently validated joint law currently established in this manuscript combines all these coordinates, or predicts arbitrary 2026 production systems from public counts alone.

## Improvements and limits

[DERIVED] The improvement lineage is specific: repetition terms correct the equation of presentations with novelty; routed-model interactions separate active compute from stored capacity; curation benchmarks control recipe while changing data; transfer models distinguish language shares from effective target-language data; context fits retain information and work changes; distillation adds teacher quality and amortization; RL separates efficiency from asymptotic reward; and query-conditional search allocates inference work by difficulty. These are methodological developments, not evidence that their coefficients transfer between studies.

[UNVERIFIED] This chapter has not independently trained or reproduced any extension. Its [reference ledger](references.md) records the full texts and locators inspected, while [verification](verification.md) restricts proposed experiments to identifiable coordinate changes. Architectural mechanics, multilingual data governance, distillation implementations and RL objectives retain their detailed treatments in the corresponding chapters.

```figure
id: fig-21.4
kind: diagram
title: Scaling coordinates beyond dense token training
caption: Each intervention adds a distinct response or cost coordinate. The diagram expresses dependencies, without implying a fitted universal joint law.
placement: wide
evidence: DERIVED
source: [P07, R21.4, R21.6, R21.8, R21.10, R21.11, R21.12]
alt: Unique and repeated data, active and stored experts, language transfer, context, teacher quality, RL recipe and inference search each feed a conditional comparison with explicit quality and cost boundaries.
spec:
  direction: LR
  nodes:
    - {id: data, kind: dataset, label: uniqueness and curation}
    - {id: sparse, kind: model, label: active and stored experts}
    - {id: language, kind: dataset, label: language transfer and repetition}
    - {id: context, kind: memory, label: context and cache work}
    - {id: teacher, kind: model, label: teacher quality and cost}
    - {id: rl, kind: feedback, label: RL recipe and rollout work}
    - {id: search, kind: process, label: query-conditional inference strategy}
    - {id: compare, kind: objective, label: validated quality and cost comparison}
  edges:
    - {from: data, to: compare}
    - {from: sparse, to: compare}
    - {from: language, to: compare}
    - {from: context, to: compare}
    - {from: teacher, to: compare}
    - {from: rl, to: compare}
    - {from: search, to: compare}
```
