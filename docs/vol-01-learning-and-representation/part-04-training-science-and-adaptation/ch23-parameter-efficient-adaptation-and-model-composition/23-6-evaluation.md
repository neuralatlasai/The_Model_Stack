---
id: ms.section.23.6
entity_type: section
title: Evaluation
volume: 1
part: 4
chapter: 23
section: 23.6
slug: 23-6-evaluation
parent: ms.chapter.23
prev_sibling: ms.section.23.5
next_sibling: ms.verification.23
children: []
prerequisites: [ms.chapter.6, ms.section.23.2, ms.section.23.3, ms.section.23.4, ms.section.23.5]
downstream: [ms.chapter.24, ms.chapter.61, ms.chapter.66]
related: [ms.chapter.22, ms.chapter.40]
siblings_by_mechanism: [ms.section.23.1]
relations: [{type: supported_by, target: paper.P14}, {type: supported_by, target: paper.P15}]
axes: {lifecycle: [adaptation, evaluation], mechanism: [adaptation_evaluation], feedback_setting: [], modality: [text]}
papers: [P14, P15]
implementations: [impl.hugging-face-peft, impl.hugging-face-transformers, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 23.6 Evaluation

## Scope

**MATHEMATICALLY-DERIVED.** Evaluate the trained function, retained capabilities and deployed representation together. Required axes are update capacity, target allocation, out-of-domain behavior, quantization, composition and serving parity. Baselines include the unchanged base and separately tuned full updating where feasible. Success is a predefined quality/retention/cost constraint. This section supplies comparison mathematics and an unexecuted acceptance protocol.

## Why this exists

**MATHEMATICALLY-DERIVED.** A rank sweep can change parameter count, scaling, optimizer dynamics and training time simultaneously. A four-bit comparison can change both the frozen function and kernels. Export can silently change base quantization or merge semantics. One target score cannot identify useful capacity, extra tuning, changed data exposure or a mismatched measurement boundary.

**PAPER-REPORTED.** Biderman et al. compare learning and forgetting across code/math regimes, finding context-dependent LoRA/full-tuning gaps. Shuttleworth et al. inspect singular-vector changes and show that task accuracy can conceal differences in pretraining loss and generalization. These motivate measuring several axes rather than treating a method label as evidence of equivalence. [R23.20] (§3–4); [R23.21] (§3–5)

## Intuition

**MATHEMATICALLY-DERIVED.** Low rank constrains a projection update, not every change to a nonlinear network. A rank-$r$ correction can rotate a sensitive direction strongly; a higher-rank correction can distribute small changes widely. Frozen base weights do not freeze outputs once hidden states change. Retention is a property of the adapted function on a specified distribution, not a consequence of zero base gradients.

## Formulation

**MATHEMATICALLY-DERIVED.** Configuration $c$ identifies base, targets, ranks, scaling, initializer, optimizer, data exposure and numerical representation. $\mathcal D_t,\mathcal D_r,\mathcal D_g$ are disjoint target, retention and shifted-generalization evaluations. Define higher-is-better example score $q(c,x_i)$ and per-valid-token negative log-likelihood $\ell(c,x_i)$. With unchanged-base reference $0$,

$$
\begin{aligned}
\widehat{\Delta Q}_s(c)&=\frac1{n_s}\sum_{i=1}^{n_s}
[q(c,x_i)-q(0,x_i)],\quad s\in\{t,r,g\},\\
\widehat{\Delta L}_r(c)&=
\frac{\sum_i n_i[\ell(c,x_i)-\ell(0,x_i)]}{\sum_i n_i},\\
\mathcal F&=\{c:\operatorname{LCB}(\Delta Q_t)\ge q_{\min},\
\operatorname{LCB}(\Delta Q_r)\ge-\epsilon_r,\
\operatorname{UCB}(\Delta L_r)\le\epsilon_L,\
M_{\mathrm{peak}}(c)\le M_{\max}\}.
\end{aligned}
$$
*(Eq. 23.27)*

**MATHEMATICALLY-DERIVED.** $n_i$ counts valid targets in example $i$. Confidence bounds need a declared procedure and independent units; neighboring tokens are not automatically independent samples. Set $q_{\min},\epsilon_r,\epsilon_L,M_{\max}$ before final testing. Missing retention evidence means this gate has not passed.

```figure
id: fig-23.17
kind: calculator
title: A paired quality gate
caption: Analytical normal-approximation lower bound for independent paired example differences. Inputs are chosen examples, not measurements; clustered data require an appropriate uncertainty calculation.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.27
alt: Mean gain 0.02, paired standard deviation 0.2 and 400 independent examples give a one-sided lower bound near 0.00355 using multiplier 1.645. With 100 examples the lower bound is negative.
spec:
  tex: \operatorname{LCB}=\overline d-z\,s_d/\sqrt n
  inputs:
    - {symbol: gain, label: Mean paired score gain, default: 0.02, min: -0.1, max: 0.1, step: 0.005}
    - {symbol: sd, label: Paired standard deviation, default: 0.2, min: 0.05, max: 0.5, step: 0.05}
    - {symbol: n, label: Independent paired examples, default: 400, min: 100, max: 10000, step: 100}
    - {symbol: z, label: Normal multiplier, default: 1.645, min: 1, max: 3, step: 0.005}
  outputs:
    - {symbol: lcb, label: Illustrative lower confidence bound, formula: gain-z*sd/sqrt(n), format: fixed3}
```

**MATHEMATICALLY-DERIVED.** Capacity has distinct measures. $r(d_i+d_o)$ counts trained factor scalars. Exactly rank-$r$ matrices form a smooth manifold of dimension $r(d_i+d_o-r)$ for $r\le\min(d_i,d_o)$; the difference reflects invertible factor reparameterizations. Effective rank depends on a criterion, such as retaining fraction $\rho$ of squared Frobenius energy:

$$
\begin{aligned}
r_\rho(\Delta W)&=\min\left\{r':
\frac{\sum_{j=1}^{r'}\sigma_j^2}{\sum_j\sigma_j^2}\ge\rho\right\},\\
\Delta W=0&\Rightarrow r_\rho=0,\qquad0<\rho\le1.
\end{aligned}
$$
*(Eq. 23.28)*

**MATHEMATICALLY-DERIVED.** This is an approximation diagnostic, not proof of task sufficiency. A low-energy direction can matter under the input covariance or a critical slice.

## Mechanism

### Methodology

**MATHEMATICALLY-DERIVED.** First fix the comparison. Equal tokens tests sample efficiency; equal elapsed time tests one hardware/runtime budget; equal trained scalars tests one storage constraint. Report the primary budget and remaining measured resources. Full tuning and LoRA need separately tuned learning rates with comparable search budgets; forcing one common rate can favor one parameterization. Keep evaluation examples outside training and configuration selection.

**MATHEMATICALLY-DERIVED.** Separate rank from target allocation. At fixed scalar budget, attention, MLP and embedding targets expose different directions. Compare rank schedules on identical target sets and target sets at matched budgets. Control scaling/initialization or cross them as independent factors. Curves indexed by consumed valid tokens reveal continued improvement, plateaus and retention decline; final checkpoints cannot distinguish these regimes.

**MATHEMATICALLY-DERIVED.** Isolate quantization and export through an artifact path. Let $f_A$ be full-precision-base unmerged adaptation, $f_Q$ quantized-base unmerged adaptation, $f_M$ its decoded merged export and $f_R$ its requantized merged export. Compare $f_Q\leftrightarrow f_M\leftrightarrow f_R$ with the same trained task state. Separately training $f_A$ and $f_Q$ answers the training-treatment question; their final scores alone cannot identify an export bug.

```figure
id: fig-23.18
kind: diagram
title: Training comparison and export comparison
caption: Training treatments follow controlled optimization. Export parity follows one accepted task state through distinct representations; these comparisons answer different questions.
placement: inline
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: ['DERIVED:eq-23.29', 'DERIVED:eq-23.30']
alt: A common base branches to full-precision and quantized training. Accepted quantized task state is evaluated unmerged, decoded and merged, and requantized and merged. Function checks accompany export transitions.
spec:
  direction: TB
  nodes:
    - {id: base, label: Exact common source base, kind: dependency}
    - {id: fp, label: Full precision training treatment, kind: process}
    - {id: qt, label: Quantized base training treatment, kind: process}
    - {id: qa, label: Accepted quantized unmerged function, kind: state}
    - {id: dm, label: Decoded merged export, kind: process}
    - {id: rq, label: Requantized merged export, kind: process}
    - {id: gate, label: Quality retention and parity gates, kind: boundary}
  edges:
    - {from: base, to: fp}
    - {from: base, to: qt}
    - {from: qt, to: qa}
    - {from: qa, to: dm}
    - {from: dm, to: rq}
    - {from: fp, to: gate}
    - {from: qa, to: gate}
    - {from: dm, to: gate}
    - {from: rq, to: gate}
```

**MATHEMATICALLY-DERIVED.** Reference/candidate logits $z,z'$ use the same teacher-forced history:

$$
\begin{aligned}
e_{\infty}&=\max_{x,t}\|z'(x,t)-z(x,t)\|_\infty,\\
\widehat D_{\mathrm{KL}}&=\frac1{N_v}\sum_{x,t\in\mathrm{valid}}
\sum_vp(v\mid x_{\le t})
\log\frac{p(v\mid x_{\le t})}{p'(v\mid x_{\le t})},\\
m(x,t)&=z_{(1)}(x,t)-z_{(2)}(x,t),\qquad
m(x,t)>2e_{\infty}\Rightarrow\arg\max z'=\arg\max z.
\end{aligned}
$$
*(Eq. 23.29)*

**MATHEMATICALLY-DERIVED.** $N_v$ counts valid positions. Each logit moves by at most $e_\infty$, proving the margin implication. Ties need a rule. Compute distribution metrics in a numerically stable common precision. Small error can change a low-margin token, then future histories. Test fixed-history distributions and complete trajectories; exact sampled-token equality requires compatible sampling and coupled RNG and is not a general parity criterion.

**MATHEMATICALLY-DERIVED.** A multi-slice release gate needs simultaneous uncertainty. If $m_g$ independent or dependent gates each use bounds with failure probability at most $\alpha_g$, the union bound gives

$$
\Pr(\text{any bound fails})\le\sum_{j=1}^{m_g}\alpha_{g,j}
\le\alpha_{\mathrm{total}}.
$$
*(Eq. 23.34)*

**MATHEMATICALLY-DERIVED.** Setting $\alpha_{g,j}=\alpha_{\mathrm{total}}/m_g$ is a conservative allocation requiring no independence assumption. Declare the family of gates before testing; adding favorable slices afterward changes the question. For correlated document/problem outcomes, resample the independent cluster and carry all paired model differences together. Report training seeds as a separate source of variability. A narrow example-resampling interval conditional on one seed does not quantify the chance that a new training run fails. Multiple comparisons, search selection and cluster dependence are distinct uncertainties.

## Algorithm

### Algorithm 23.6 - Predeclared adaptation acceptance

**MATHEMATICALLY-DERIVED.** Inputs are finite candidates $\mathcal C$, independent train/validation/test manifests, seeds $\mathcal S$, fixed search budget, Eq. 23.27's gates and parity tolerances $\epsilon_z,\epsilon_{\mathrm{KL}}$. State retains trials, selected $c^\star$, exports and slice results. Output is a release bundle with evidence or rejection.

$$
\begin{aligned}
1.\;&\mathcal T\leftarrow\varnothing,\quad
\neg(\varnothing\ne\mathcal S_{\mathrm{release}}\subseteq\mathcal S)
\Rightarrow\operatorname{return}(\mathrm{invalid\ release\ seeds});\\
2.\;&\forall(c,s)\in\mathcal C\times\mathcal S:\quad
(\sigma_{c,s},a_{c,s})\leftarrow
\mathsf{TrainBounded}(c,s,\mathcal D_{\mathrm{train}}),\\
&\sigma_{c,s}\ne\mathrm{success}\Rightarrow
(\mathsf{RecordFailure}(c,s,\sigma_{c,s}),\
\operatorname{continue}_{(c,s)});\\
3.\;&\mathcal T\leftarrow\mathcal T\cup
\{(c,s,\mathsf{Eval}(a_{c,s},\mathcal D_{\mathrm{val}}),\mathsf{Cost}(a_{c,s}))\};\\
4.\;&\mathcal F_{\mathrm{val}}\leftarrow\mathsf{Feasible}(\mathcal T),\quad
\mathcal F_{\mathrm{val}}=\varnothing\Rightarrow\operatorname{return}(\mathrm{reject}),\quad
c^\star\leftarrow\mathsf{Select}_{\mathrm{predeclared}}(\mathcal F_{\mathrm{val}});\\
5.\;&\mathcal E\leftarrow\{(s,e):s\in\mathcal S_{\mathrm{release}},\
e\in\mathsf{ExportPaths}(a_{c^\star,s})\},\\
&\exists s\in\mathcal S_{\mathrm{release}}:
\{e:(s,e)\in\mathcal E\}=\varnothing
\Rightarrow\operatorname{return}(\mathrm{missing\ export});\\
6.\;&\forall(s,e)\in\mathcal E:\quad
(e_{\infty,s,e},D_{\mathrm{KL},s,e},Q_{s,e})\leftarrow
\mathsf{ParityEval}(a_{c^\star,s},e);\\
7.\;&\mathsf{Final}\leftarrow
\mathsf{Eval}(\mathcal E,\mathcal D_{\mathrm{test},t,r,g}),\quad
G\leftarrow\mathsf{QualityRetention}(\mathsf{Final})
\land\bigwedge_{(s,e)\in\mathcal E}
(e_{\infty,s,e}\le\epsilon_z\land
D_{\mathrm{KL},s,e}\le\epsilon_{\mathrm{KL}});\\
8.\;&G\Rightarrow\operatorname{return}(\mathrm{accepted},\mathcal E,\mathcal T,\mathsf{Final});\quad
\neg G\Rightarrow\operatorname{return}(\mathrm{rejected},\mathcal T,\mathsf{Final}).
\end{aligned}
$$
*(Eq. 23.30)*

**MATHEMATICALLY-DERIVED.** Steps 2-3 execute together for each candidate/seed pair. $\mathcal F_{\mathrm{val}}$ contains configurations with all required successful release-seed records and feasible validation aggregation. Missing seed artifacts reject before export. Each export retains its seed identity; every parity value is indexed by that pair. No empty release set or missing per-seed export can pass a vacuous conjunction. Trials, exports and evaluations have finite caps and typed failure statuses; a failed call never supplies stale inputs to later operations. Nonfinite values, invalid hashes or missing slices reject. Final tests never feed selection. Quality and numerical tolerances remain predeclared.

## Implementation

**OFFICIAL-DOCUMENTATION.** PEFT, **MODEL DEFINITION / ADAPTATION**, documents configuration, saved state and merges; Transformers supplies model interfaces in **MODEL DEFINITION / ADAPTATION**; vLLM, **INFERENCE ENGINE**, documents serving selection. Inspected pages do not guarantee bitwise equality across paths. Runtime commit, model revision, quantizer layout and casts remain evaluation artifacts. [R23.5]; [R23.9]; [R23.19]

**MATHEMATICALLY-DERIVED.** Measure peak allocated/reserved memory separately from adapter bytes. Count base-decode workspace, moments, activations, checkpointing, padding, communication and warmup. Profile deployment at accepted quality; fewer trained scalars do not ensure cheaper inference. Include search, evaluation generations, merge/requantization and transfer in lifecycle cost. Missing power telemetry supports no energy estimate.

```figure
id: fig-23.19
kind: stat-panel
title: Factor count differs from update dimension
caption: Derived square-projection example at width 4096 and rank 256. Factorization has a reparameterization redundancy; neither count measures useful task capacity alone.
placement: rail
anchor: implementation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-23.28
alt: Width 4096 and rank 256 give 2097152 factor scalars, rank-256 manifold dimension 2031616, and 65536 redundant factor coordinates. Performance needs separate evaluation.
spec:
  header: CAPACITY IS NOT ONE NUMBER
  variables: {d: 4096, r: 256}
  rows:
    - {key: factor scalars, formula: 2*d*r, format: integer}
    - {key: rank-r manifold dimension, formula: r*(2*d-r), format: integer}
    - {key: factor-coordinate redundancy, formula: r^2, format: integer}
    - {key: task sufficiency, value: Requires held-out function evaluation}
```

## Experimental design

### Reported experiments

**PAPER-REPORTED.** Biderman et al. use Llama-2-7B, code/math continued pretraining up to 20B tokens and instruction data, separate learning-rate sweeps and ranks 16/64/256 targeting Transformer projections. HumanEval/GSM8K measure learning; HellaSwag/WinoGrande/ARC-Challenge measure retention. High-rank instruction tuning can approach full tuning while continued-pretraining gaps persist in these settings. These are matched-exposure findings, not universal rank sufficiency. [R23.20] (§3, Table 1); §4.1–4.7, Appendix A

**PAPER-REPORTED.** Shuttleworth et al. study RoBERTa/Llama-2, singular vectors, accuracy, pretraining loss and shifted tasks. They vary rank/scaling/learning rate, then rescale selected singular components with neighboring-component controls. Forgetting depends on configuration. Repeated-seed RoBERTa analysis appears in Appendix N. [R23.21] (§3–5); Appendix B, G, N

**UNVERIFIED.** The book protocol stratifies held-out data by domain, source, time and difficulty; records tokenizer/template/evaluator versions and contamination checks; and uses problem/document-level paired bootstrap where justified. Separate training-seed variation from evaluation resampling. Publish all trials: a best-of-many score without its search budget obscures selection bias.

## Observations

**What the paper claims.** **PAPER-REPORTED.** These controlled studies reject universal full-tuning equivalence and guaranteed retention. Conclusions concern their model/data/hyperparameter regimes. [R23.20]; [R23.21]

**What the evidence shows.** **UNVERIFIED.** This book has not reproduced them or established a quality frontier. Favorable method papers and counterexamples are conditional evidence, not interchangeable benchmarks.

**What we infer.** **MATHEMATICALLY-DERIVED.** Eq. 23.27 requires learning and retention simultaneously. Eq. 23.29 distinguishes small representation error from identical generated output.

**What remains unknown.** **NOT-DISCLOSED.** Deployment regression tolerances and hidden pretraining distributions are unspecified; a public retention suite covers only its measured behaviors.

## Failure modes

**MATHEMATICALLY-DERIVED.** Mean accuracy can hide a failed domain. Contaminated retention data can overstate preservation. Test-based rank selection invalidates the test boundary. Unequal exposure confounds capacity and optimization opportunity. Quantization mismatch can cause export loss despite sound training. Missing trained heads/scales can break parity while factors load successfully.

## Siblings

**MATHEMATICALLY-DERIVED.** Training loss diagnoses fit; tensor reconstruction measures approximation under a norm; output KL measures conditional distributions on specified histories; generated accuracy measures behavior. Latency measures a workload/timer boundary. Preserve these measures rather than averaging unlike quantities into an unexplained score.

## Extensions

### Improvements

**MATHEMATICALLY-DERIVED.** For base/adapted unit left singular vectors $u_i^0,u_j^c$, a sign-invariant book diagnostic sets $a_j=\max_i|(u_i^0)^\top u_j^c|$ and counts $a_j<\epsilon$ in a declared top-$k$ set. This reconstructs the source's intruder-direction idea while resolving SVD sign ambiguity. It does not mean the vector lies outside a complete base basis's span. Repeated singular values permit arbitrary rotations: compare subspaces or report gaps before interpreting individual vectors. [R23.21] (Definition 3.1, Algorithm 1)

**MATHEMATICALLY-DERIVED.** Spectral analysis adds evidence, not an acceptance guarantee. Fix layers, precision and thresholds before examining outcomes. SVD consumes workspace and computation. Rescaling components creates a new artifact requiring repeated gates. RandLoRA's full-rank representation and aLoRA's activation boundary in 23.2/23.5 also change evaluation; nominal rank alone cannot compare their quality.

## Limitations

**MATHEMATICALLY-DERIVED.** A finite suite cannot certify all future domains, safety or deletion. Intervals quantify specified sampling uncertainty, not evaluator bias or undisclosed overlap. Spectral diagnostics depend on thresholds/layers. A comparison can falsify equivalence in its regime; absence of a detected difference cannot establish universal equivalence.

## Reproducibility

**UNVERIFIED.** Retain manifests, revisions, all trials/seeds, tokens, deployment paths, per-example predictions, slices and uncertainty procedures. Publish rejects alongside accepted artifacts. No book-authored adaptation/retention/parity measurements accompany this chapter; [verification](verification.md) contains the proposed protocol and editorial audit.

## References

- [P14](references.md#p14) — LoRA.
- [P15](references.md#p15) — QLoRA.
- [R23.5](references.md#r235) — PEFT LoRA.
- [R23.9](references.md#r239) — checkpoint format.
- [R23.19](references.md#r2319) — vLLM.
- [R23.20](references.md#r2320) — learning/forgetting comparison.
- [R23.21](references.md#r2321) — spectral/generalization comparison.
