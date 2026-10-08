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

## Scope

[DERIVED] The two-coordinate surface $L(N,D)$ is useful when other relevant choices are fixed. Sparse activation, repeated data, filtering, multilingual transfer, context extension, teacher supervision, reinforcement learning and inference-time search each change what those coordinates mean or add another response mechanism. A method's scaling analysis must therefore specify its controlled intervention and cost boundary before comparing exponents or optima.

## Why this exists

[DERIVED] Applying a dense pretraining exponent to a different intervention can price the wrong work or predict the wrong response. Repeated data adds presentations without proportional novelty; sparse capacity adds stored weights without activating all of them; teacher and verifier passes consume work outside the student's own updates. This section owns these differences as allocation coordinates. Chapters 07–11, 14, 16, 22, 35, 38–39 and 42 retain the underlying data, architecture, adaptation, RL, search, distillation and cache mechanisms.

## Intuition

[MATHEMATICALLY-DERIVED] A new coordinate matters when it changes the conditional response or feasible cost at fixed existing coordinates. Its coefficient is identified only by variation that distinguishes its effect from recipe changes. Replacing $D$ by an effective-data term is a hypothesis about quality response; it does not replace the actual presentations in the work ledger. A fixed-data sparse study similarly identifies capacity effects without identifying the best training duration.

## Formulation

[DERIVED] A general accounting form is $Y=F(N_{\mathrm{total}},N_{\mathrm{active}},D,U,\pi,s,\mathcal T,\mathcal R,B;\mathcal E)$, where $\pi$ is a data mixture, $s$ is context length, $\mathcal T$ a teacher/supervision configuration, $\mathcal R$ an RL recipe, $B$ an inference budget and $\mathcal E$ the evaluation contract. This notation is a dependency inventory, not a proposed universal fitted equation. The following primary studies estimate restricted slices with distinct functional forms. Their empirical findings cannot identify all coordinates simultaneously.

## Mechanism

```figure
id: fig-21.7
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

### Methodology

### Repeated presentations are not additional unique data

[PAPER-REPORTED] Muennighoff et al. extend dense scaling to constrained unique data. Let $U_D$ be unique training tokens and $R_D=D/U_D-1$ the repetitions beyond the first pass. Their effective-data term is

$$
D_{\mathrm{eff}}=U_D\left[1+R_D^*\left(1-e^{-R_D/R_D^*}\right)\right].
$$
*(Eq. 21.14)*

[MATHEMATICALLY-DERIVED] For $U_D>0$, $R_D\ge0$ and $R_D^*>0$, this equals $U_D$ after one pass, has initial marginal benefit $dD_{\mathrm{eff}}/dD=1$, and approaches $U_D(1+R_D^*)$ after unlimited repetitions. The marginal is $e^{-R_D/R_D^*}$, so $R_D^*$ is an e-folding scale in this parameterization, not literally the repetition count at half benefit. At half marginal benefit, $R_D=R_D^*\log2$. The reported model also saturates effective model capacity with an analogous term before inserting both effective coordinates into an additive loss law. [R21.4, section 3]

[PAPER-REPORTED] Their study runs more than 400 experiments, using C4, GPT-2-style models, shuffled repeated epochs and horizon-matched cosine schedules. Fits use a subset of those runs. Moderate repetition can remain competitive in the tested data-limited regime; extensive repetition eventually shows diminishing returns and, in some configurations, worsening behavior. This supports distinguishing $D$ from $U$, rather than treating repeated tokens as cost-free substitutes for unique text. [R21.4, sections 3–4]

[DERIVED] Eq. 21.14 is a saturating benefit model, not a model of arbitrary overfitting. Its monotonicity cannot represent loss increasing with repetition without an added mechanism or restricted fitting domain. Identical token counts also do not make synthetic, augmented and verbatim repeated data equivalent: their distributions and information overlap require separate measurement.

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

[DERIVED] Proxy-scale curation rankings are useful only if their transfer is validated at larger scales. Contamination, licensed-source availability and tokenizer effects can affect both the selected data and evaluation. Data provenance and cleaning belong to Chapters 07–08; the allocation consequence here is that $A,B,E$ and possibly exponents are conditional on the curation procedure rather than constants attached to a raw token count.

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

[DERIVED] Context loss is conditional on which tokens are scored and which preceding tokens are available. Longer context can reduce uncertainty by exposing relevant history, yet quadratic attention work, attention kernels, batching and cache storage alter its cost. Continuing for 400B tokens also changes the model, so improvements in short-context tasks do not isolate context length alone. A valid context-scaling comparison fixes the data, scored targets, checkpoint treatment and work boundary, or explicitly estimates their interactions. The positional mechanism itself belongs to Chapter 14.

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

[PAPER-REPORTED] The distillation study itself uses an attention/head-aware forward-work function rather than the two-FLOP-per-parameter shortcut for its small models and 4096-token contexts. Its teacher-cost scenarios explicitly distinguish creation and logit generation. Thus the simplified expression above is an analytical decomposition, not a numerical reconstruction of the paper's optimum. [R21.10], §5, Equation 9 and Appendix H.1.

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

```figure
id: fig-21.8
kind: calculator
title: Repetition benefit and paid presentations
caption: >-
  Equation 21.14 is evaluated for an analytical corpus. The fitted repetition
  scale is supplied as an input rather than copied from a named model.
  Effective tokens enter predicted quality; work still pays for every epoch.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-21.14
alt: >-
  With one unit of unique data, ten epochs and repetition scale 3, the
  effective data is about 3.85 units, the asymptotic ceiling 4 units,
  and marginal effective benefit about 0.0498 per added presentation.
spec:
  tex: D_{\mathrm{eff}}=U[1+r_*(1-e^{-(e-1)/r_*})]
  equation: "21.14"
  inputs:
    - {symbol: unique, label: unique data in common token units, default: 1, min: 0.001, max: 1000}
    - {symbol: epochs, label: complete-corpus epochs, default: 10, min: 1, max: 100, step: 1}
    - {symbol: scale, label: repetition e-folding scale, default: 3, min: 0.1, max: 100}
  outputs:
    - {symbol: paid, label: paid token presentations, formula: unique*epochs}
    - {symbol: effective, label: effective data, formula: unique*(1+scale*(1-exp(-(epochs-1)/scale))), emphasis: true}
    - {symbol: ceiling, label: effective-data ceiling, formula: unique*(1+scale)}
    - {symbol: marginal, label: marginal effective benefit, formula: exp(-(epochs-1)/scale)}
```

## Algorithm

[DERIVED] The following reconstruction evaluates the transfer/repetition form described above for one target language. Its fitted coefficients and source-grouping policy must come from the inspected model; it does not prescribe a new transfer estimator or claim an independently fitted mixture optimum. [R21.8, section 3]

**Algorithm 21.4 — Evaluate transfer and repetition.** [DERIVED] Input: positive model size $N$, the source-fitted grouping $\mathcal J_t=\{t\}\cup\mathcal K_t\cup\{\mathrm{other}\}$, group presentations/unique counts $(D_j,U_j)$, and coefficients $(\lambda_j,\tau_j)$ with $\tau_t=1$. Output: target-language loss or an invalid-domain record. The pooled remainder and its unique-count rule are inputs from the fitted protocol; they are not guessed by summing overlapping source corpora.

$$
\begin{aligned}
1.\quad &\mathsf V\gets[N>0]\land\bigwedge_{j\in\mathcal J_t}
 [D_j\ge0\land U_j\ge0\land\lambda_j>0\land(D_j>0\Rightarrow U_j>0)].\\
2.\quad &\neg\mathsf V\ \Longrightarrow\ \operatorname{return}(\mathrm{invalid\ counts}).\\
3.\quad &S_j\gets\begin{cases}
 0,&D_j=0,\\
 D_j,&0<D_j\le U_j,\\
 U_j\left[1+\dfrac{1-e^{-\lambda_j(D_j/U_j-1)}}{\lambda_j}\right],&D_j>U_j.
 \end{cases}\\
4.\quad &D_{\mathrm{eff},t}\gets\sum_{j\in\mathcal J_t}\tau_jS_j.\\
5.\quad &D_{\mathrm{eff},t}\le0\ \Longrightarrow\ \operatorname{return}(\mathrm{invalid\ effective\ data}).\\
6.\quad &\widehat L_t\gets E+A N^{-\alpha}+B D_{\mathrm{eff},t}^{-\beta}.\\
7.\quad &\operatorname{return}(\widehat L_t,D_{\mathrm{eff},t},\{D_j\},\mathrm{domain\ flags}).
\end{aligned}
$$
*(Eq. 21.27)*

[DERIVED] Finite inputs and coefficients are validated before arithmetic; numerical overflow yields an unresolved prediction. The invariant is that all counts and coefficients use the fitted tokenizer, group partition and corpus boundary. Effective tokens affect the quality prediction; actual training work still uses presentations and architecture operations. One prediction terminates after $|\mathcal J_t|$ group evaluations, requiring $O(|\mathcal J_t|)$ arithmetic and retained audit storage. It creates no new training parameters or evidence of measured transfer. Fitting coefficients and training the language models are separate, substantially larger costs.

## Implementation

[PAPER-REPORTED] Clark et al. use **JAX**, the Model / autograd framework layer, on TPUs with data, expert and sharding parallelism, sequence length 2048, and the same 130B-token training duration across sizes. Xiong et al. use **FlashAttention**, the Attention kernel layer, for long-sequence continuation. These are source execution contexts, not locally verified software paths. [R21.5], §2 and Appendix A; [R21.9], §2.1.

[MATHEMATICALLY-DERIVED] Sparse routing introduces expert dispatch/combine traffic and load-dependent active work; total weights still occupy parameter/optimizer storage unless sharded. Teacher supervision adds teacher execution or retained logits; RL adds generator/trainer state and reward work; search adds repeated decoding, verifier state and potentially growing cache storage. Source-specific topology, precision, batching and timing are necessary for a throughput/energy claim. This section reports conditional response forms and their work boundaries rather than a cross-system performance ranking.

## Experimental design

### Reported experiments

[DERIVED] The source protocols above represent distinct interventions. The repetition study changes unique data/epochs at fixed budgets; routed studies vary base size, expert count or granularity; DataComp-LM fixes a recipe while changing curation; multilingual studies vary mixture and held-out transfer conditions; context continuation changes checkpoint training and context; distillation varies teacher/student allocations; RL varies update/rollout work; test-time allocation holds weights fixed while changing strategies. These interventions cannot be pooled as independent observations of one dense response law. Source seeds, hardware and precision remain source-specific and are not replaced by assumed shared values.

## Observations

### Observation 21.4 - Added compute has mechanism-specific returns

**What the paper claims.** [PAPER-REPORTED] Primary studies describe gains and saturation in repeated-data, sparse, multilingual, distilled, RL and test-time-compute regimes. [R21.4–R21.12]

**What the evidence shows.** [PAPER-REPORTED] These studies vary different coordinates and retain negative evidence: diminishing repetition, base/expert interactions, transfer-sensitive mixtures, capacity gaps, recipe-dependent RL trajectories and verifier/search failures. Their results cannot be represented by a single unqualified parameter/token ratio. [R21.4–R21.12]

**What we infer.** [DERIVED] A new scaling coordinate is justified by its mechanism and validated predictive contribution. It must also enter resource accounting when it consumes material work.

**What remains unknown.** [UNVERIFIED] No independently validated joint law currently established in this manuscript combines all these coordinates, or predicts arbitrary 2026 production systems from public counts alone.

## Failure modes

[MATHEMATICALLY-DERIVED] A monotone saturation law cannot represent worsening loss from overfitting; a fixed-data expert fit cannot identify an optimal data allocation; a pooled transfer term can hide harmful source combinations; a teacher-conditioned fit can fail when the target student lies outside its capacity range. Each failure has an observable comparison: held-out repetition endpoints, independent token horizons, target-language mixture holdouts, or teacher/student holdouts. A test-time strategy that selects verifier errors can also lose actual selected-answer quality while oracle pass rates improve.

## Siblings

[DERIVED] Curation changes the data distribution; multilingual sampling changes mixture exposure and transfer; distillation changes supervision; sparse activation changes capacity/work coupling; RL changes the policy under a reward; search changes inference behavior at fixed weights. Compare their incremental work and quality under matched target tasks, not by inserting every cost into an equivalent token count. [Chapter 38](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/README.md) owns adaptive search and [Chapter 39](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch39-knowledge-response-and-policy-distillation/README.md) owns distillation mechanisms.

## Extensions

### Improvements

[DERIVED] The improvement lineage is specific: repetition terms correct the equation of presentations with novelty; routed-model interactions separate active compute from stored capacity; curation benchmarks control recipe while changing data; transfer models distinguish language shares from effective target-language data; context fits retain information and work changes; distillation adds teacher quality and amortization; RL separates efficiency from asymptotic reward; and query-conditional search allocates inference work by difficulty. These are methodological developments, not evidence that their coefficients transfer between studies.

[UNVERIFIED] This chapter has not independently trained or reproduced any extension. Its [reference ledger](references.md) records the full texts and locators inspected, while [verification](verification.md) restricts proposed experiments to identifiable coordinate changes. Architectural mechanics, multilingual data governance, distillation implementations and RL objectives retain their detailed treatments in the corresponding chapters.

## Limitations

[DERIVED] Section 21.4 is an allocation bridge rather than a joint estimator for every architecture and learning algorithm. Source forms are restricted to their varied coordinates and inspected support. No shared coefficient vector, universal effective-token conversion or exhaustive 2026 frontier claim is established. A new family needs independent predictions in its relevant coordinate range, including negative outcomes and the actual work omitted by a convenient shortcut.

## Reproducibility

[DERIVED] Retain each source's tokenizer/count conventions, group partition, unique-data definition, teacher split, reward/prompt corpus, inference strategy and evaluation event. Transfer scores and fitted transfer weights are distinct records. The ledger supplies inspected versions and exact method locators; no source training run, released checkpoint, kernel path or book-designed extension experiment was executed.

## References

[P07](references.md#p07); [R21.4](references.md#r21-4); [R21.5](references.md#r21-5); [R21.6](references.md#r21-6); [R21.7](references.md#r21-7); [R21.8](references.md#r21-8); [R21.9](references.md#r21-9); [R21.10](references.md#r21-10); [R21.11](references.md#r21-11); [R21.12](references.md#r21-12); [verification](verification.md).
