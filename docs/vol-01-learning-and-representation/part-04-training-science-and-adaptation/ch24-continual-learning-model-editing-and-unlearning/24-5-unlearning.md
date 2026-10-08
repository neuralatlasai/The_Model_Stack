---
id: ms.section.24.5
entity_type: section
title: Unlearning
short_title: Deletion counterfactuals
volume: 1
part: 4
chapter: 24
section: 24.5
slug: 24-5-unlearning
parent: ms.chapter.24
prev_sibling: ms.section.24.4
next_sibling: ms.section.24.6
children: []
prerequisites: [ms.chapter.6, ms.chapter.12, ms.chapter.19, ms.section.24.2, ms.section.24.3, ms.section.24.4]
downstream: [ms.section.24.6, ms.chapter.65, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [adaptation, evaluation, assurance], mechanism: [machine_unlearning, privacy, counterfactual_retraining], feedback_setting: [], modality: [text]}
papers: []
implementations: []
benchmarks: [MUSE, TOFU]
datasets: []
status: {maturity: active, disputed: true}
evidence_summary: {labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2600
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# 24.5 — Unlearning

## Scope

[DERIVED] Unlearning asks whether a released system appropriately approximates a specified training process in which selected data or influences were absent. The counterfactual, permitted residual information, observation interface, attacker capabilities, and utility constraints must be stated. A refusal, low answer accuracy, high forget-set loss, or deleted retrieval record is evidence about a particular behavior; none alone proves removal from model parameters.

## Why this exists

[PAPER-REPORTED] MUSE evaluates six dimensions: verbatim memorization, knowledge memorization, membership leakage, retained utility, forget-set scale, and repeated requests. It compares approximate methods with a retraining reference and distinguishes excessive suppression from insufficient suppression. [R24.15], §§3–5.

[MATHEMATICALLY-DERIVED] Maximizing loss on a record is not the inverse of its original training trajectory. Later examples and optimizer states depend on earlier parameters, so subtracting a current gradient does not reconstruct the counterfactual state. Moreover, the record may have duplicates, paraphrases, derived labels, teacher outputs, or checkpoints elsewhere in the pipeline. The target must identify which lineage is to be absent; a local intervention cannot establish an unspecified global deletion claim.

## Intuition

[MATHEMATICALLY-DERIVED] Two parameter vectors can produce the same refusal on a tested prompt while differing everywhere else. One can retain a sensitive association and suppress its expression; another can lack the association. The output test cannot distinguish them on that prompt. An unlearning claim becomes stronger when it survives broader observations and interventions, but finite behavioral evidence still covers only the tested interface and threat class.

[DERIVED] The retraining comparator prevents a second mistake: demanding zero knowledge that the retained data independently support. If a fact is present in both forget and retain data, retraining without the forget records can still recover it. Conversely, forcing its probability far below the retraining distribution can create a recognizable signature of deletion rather than privacy. Removal of a record's influence is different from universal suppression of its semantic content.

## Formulation

| Symbol | Meaning | Condition |
|---|---|---|
| $\mathcal D_{\mathrm{tr}}$ | Original training data within the intervention boundary | Versioned multiset |
| $\mathcal D_f$ | Requested forget records and declared descendants | Explicit identities |
| $\mathcal D_r$ | Retained training multiset | $\mathcal D_{\mathrm{tr}}\setminus\mathcal D_f$ under declared duplicate policy |
| $\mathsf A$ | Training algorithm, including preprocessing and selection | Versioned stochastic map |
| $\omega$ | Algorithmic randomness | Declared distribution |
| $\mathsf U$ | Unlearning map | Inputs include available state and permitted data |
| $\mathsf O$ | Observation interface | Weights, logits, generations, or service access |
| $\mathcal T$ | Test/attacker class | Declared bounded set or formal family |

> **Definition — Unlearning counterfactual.** [DERIVED] The specified randomized training process with selected influences absent, including its pipeline configuration and released-state boundary.

[DERIVED] Define original and retrained random outputs as

$$
\Theta=\mathsf A(\mathcal D_{\mathrm{tr}};\omega),\qquad
\Theta_r=\mathsf A(\mathcal D_r;\omega'),\qquad
\Theta_u=\mathsf U(\Theta,\mathcal D_f,\mathcal D_r;\nu).
$$

*(Eq. 24.24)*

[MATHEMATICALLY-DERIVED] Exact distributional unlearning requires $\Theta_u\overset d=\Theta_r$ for the specified training algorithm and released state. A narrower observable criterion compares $\mathsf O(\Theta_u)$ and $\mathsf O(\Theta_r)$. For test class $\mathcal T$, define

$$
\Delta_{\mathcal T}=\sup_{t\in\mathcal T}
\left|\mathbb E\,t(\mathsf O(\Theta_u))-
\mathbb E\,t(\mathsf O(\Theta_r))\right|.
$$

*(Eq. 24.25)*

A finite test suite estimates only that restricted discrepancy. It cannot upper-bound the discrepancy over every measurable test without additional assumptions. Approximate formal guarantees must give their precise divergence, parameters, quantifiers, and release interface; the generic word “certified” is insufficient.

## Mechanism

### Methodology

#### Retraining and dependency isolation

[MATHEMATICALLY-DERIVED] The direct baseline reruns $\mathsf A$ on $\mathcal D_r$ with the same declared architecture, initialization distribution, preprocessing, training schedule, and selection rule. If hyperparameters or data filters were originally selected using forget records, holding them fixed preserves an additional influence outside a strict all-pipeline counterfactual. Either repeat that selection without the records or explicitly limit the deletion boundary to parameter fitting under a fixed configuration. A shared pretrained base containing unknown copies of the data prevents an all-pretraining deletion claim.

[PAPER-REPORTED] SISA trains isolated constituent models on separate shards and saves states before later slices enter training; deletion retrains affected constituents from a preceding unaffected state and aggregates their predictions. [R24.16], §§III–IV. [MATHEMATICALLY-DERIVED] Its absent-data comparator is the same sharded training algorithm, not a monolithic model trained on the retained union. Isolation prevents a deleted record's gradients from entering unaffected constituents, provided there is no shared data-dependent state. A checkpoint after exposure is not a valid starting point for exact suffix retraining unless its remaining influence is independently removed.

#### Approximate loss-based methods

[MATHEMATICALLY-DERIVED] For forget negative log-likelihood $\mathcal L_f=-\mathbb E_f\log p_\theta(y\mid x)$, gradient ascent updates $\theta\leftarrow\theta+\eta\nabla\mathcal L_f$. Equivalently, minimize $\mathbb E_f\log p_\theta(y\mid x)$, which is unbounded below as target probability approaches zero. This objective has no built-in instruction to match the retained-data retraining distribution and can damage unrelated predictions.

[PAPER-REPORTED] NPO replaces this loss with a bounded-below negative-preference objective relative to the original model. [R24.17], §3, Eq. 3. With local inverse-temperature $\beta_u>0$ and $a_\theta=\log p_\theta(y\mid x)-\log p_{\theta^-}(y\mid x)$, write

$$
\mathcal L_{\mathrm{NPO}}=
\frac2{\beta_u}\mathbb E_f\log(1+\exp(\beta_u a_\theta)),\qquad
\nabla\mathcal L_{\mathrm{NPO}}=
\mathbb E_f\left[2\sigma(\beta_u a_\theta)\nabla\log p_\theta(y\mid x)\right].
$$

*(Eq. 24.26)*

[MATHEMATICALLY-DERIVED] Differentiating softplus yields the displayed weight. At initialization $a_\theta=0$, the weight equals one; after sufficient suppression it approaches zero. This attenuates updates relative to unweighted ascent but supplies no equality with Eq. 24.24's retrained distribution. Sequence log probabilities sum token terms; replacing them with token means changes the loss and effective length weighting.

[PAPER-REPORTED] SimNPO removes the reference ratio and uses length-normalized log probability with an optional margin, addressing the source's identified reference-model bias. [R24.18], §§4–5, Eqs. 4–5. [MATHEMATICALLY-DERIVED] At zero margin, its per-example gradient is

$$
\nabla\ell_{\mathrm{SimNPO}}=
\frac2{|y|}\sigma\left(\frac{\beta_u}{|y|}\log p_\theta(y\mid x)\right)
\nabla\log p_\theta(y\mid x).
$$

*(Eq. 24.27)*

This changes both the confidence dependence and length normalization. The absence of a reference model reduces that reference's residency/forward costs, but a retain objective can still be necessary. A combined objective $\mathcal L_{\mathrm{forget}}+\eta_r\mathcal L_r$ must state whether $\mathcal L_r$ is retained-data likelihood or an output-divergence constraint; they are not interchangeable.

#### Residual memorization, privacy, and relearning

[DERIVED] Evaluate at least three distinct interfaces. Continuation tests probe verbatim sequences; question variants probe semantic information; membership tests ask whether a record's inclusion can be inferred relative to a retraining reference and matched nonmembers. The attack's training and calibration data must be disjoint from the final test data. Distribution mismatch between forget records and nonmembers can produce apparent membership signal unrelated to original inclusion, which the retraining baseline helps expose.

[MATHEMATICALLY-DERIVED] An attack with score $s$ and threshold $t$ has advantage $\Pr[s>t\mid\mathrm{member}]-\Pr[s>t\mid\mathrm{nonmember}]$ under explicitly specified sampling. Testing one score estimates one attack, not the optimum over all attackers. An abnormally large forget loss can be distinguishable in the reverse direction even when a naive low-loss membership classifier fails. Report signed score distributions and attack orientation rather than interpreting a single near-chance or reversed AUC as universal privacy.

[PAPER-REPORTED] Hu et al. test relearning using data disjoint from the targeted evaluation content, including partial forget-set information and benign related data. They observe recovery of suppressed knowledge in their evaluated settings, with results depending on unlearning depth and relearning budget. [R24.19], §§2–4. [MATHEMATICALLY-DERIVED] To interpret recovery, apply the same relearning map $\mathsf R_b$ to both unlearned and retrained models:

$$
\delta_b=m(\mathsf R_b(\Theta_u))-m(\mathsf R_b(\Theta_r)),
$$

*(Eq. 24.28)*

where $b$ fixes training examples, updates, and compute, and $m$ measures held-out target recovery. Recovery alone is not proof of residual memorization: the retained model might relearn equally quickly from available information. Excess recovery relative to the comparator is stronger evidence within the tested protocol. Attacker access to weights versus service-only outputs changes the feasible attack class and must be declared.

#### Inference-time suppression is a separate boundary

[PAPER-REPORTED] Google's 2026 conformal method calibrates a response-refinement iteration budget and accepts outputs according to a verifier. Its main coverage result is marginal under i.i.d. calibration and test inputs; the mechanism does not update model parameters. [R24.20], §§3.1–3.2, Lemma 1. [MATHEMATICALLY-DERIVED] A guarantee about verifier acceptance is a guarantee about that verifier-defined event, subject to its error and distributional assumptions. Unchanged weights still contain whatever information they contained before filtering. Removing the wrapper or exposing the raw model changes the observation interface and invalidates a service-only suppression claim.

```figure
id: fig-24.15
kind: diagram
title: Deletion counterfactual and tested evidence
caption: >-
  The comparison target is retraining without declared forget influences.
  Behavioral suppression, membership tests, and relearning tests inspect
  different projections; none alone establishes equality of released state.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-24.24
alt: >-
  Original training data produce the original model and an unlearning
  candidate. Retained data alone produce a retrained reference. Both models
  enter matched utility, memorization, membership, and relearning tests.
  A response filter is separately attached to the output interface.
spec:
  direction: TB
  nodes:
    - {id: all, kind: dataset, label: Original training multiset}
    - {id: old, kind: model, label: Original checkpoint}
    - {id: unlearn, kind: process, label: Unlearning intervention}
    - {id: candidate, kind: model, label: Candidate released state}
    - {id: retain, kind: dataset, label: Retained multiset only}
    - {id: retrain, kind: process, label: Same training algorithm}
    - {id: reference, kind: model, label: Counterfactual reference}
    - {id: tests, kind: metric, label: Matched utility privacy recovery tests}
    - {id: wrapper, kind: boundary, label: Separate response filter interface}
  edges:
    - {from: all, to: old}
    - {from: old, to: unlearn}
    - {from: unlearn, to: candidate}
    - {from: retain, to: retrain}
    - {from: retrain, to: reference, kind: emphasis}
    - {from: candidate, to: tests}
    - {from: reference, to: tests}
    - {from: candidate, to: wrapper}
```

## Algorithm

**Algorithm 24.5 — Counterfactual deletion audit.** [DERIVED] $\mathsf L$ resolves requested records and declared descendants; $\mathsf A_r$ runs the specified retained-data baseline; $\mathsf U_b$ is a budgeted candidate; $\mathsf T$ evaluates disjoint memorization/privacy/utility suites; $\mathsf R_b$ applies the matched recovery probe. If the retraining comparator cannot be constructed, output a behavioral assessment with the counterfactual gap unresolved.

$$
\begin{aligned}
1.\quad&(\mathcal D_f,\mathcal D_r,\mathcal H_f)\gets\mathsf L(\mathrm{request},\mathrm{lineage}).\\
2.\quad&\neg\operatorname{closed}(\mathcal H_f)\Longrightarrow\operatorname{return}(\mathrm{scope\ unresolved}).\\
3.\quad&\Theta_r\gets\mathsf A_r(\mathcal D_r;\omega'),\quad
 \Theta_u\gets\mathsf U_b(\Theta,\mathcal D_f,\mathcal D_r;\nu).\\
4.\quad&\neg\operatorname{finite}(\Theta_u)\Longrightarrow\operatorname{return}(\mathrm{rejected}).\\
5.\quad&\mathcal Z_0\gets\mathsf T(\mathsf O(\Theta_u),\mathsf O(\Theta_r)).\\
6.\quad&\mathcal Z_b\gets\mathsf T(\mathsf O(\mathsf R_b(\Theta_u)),
 \mathsf O(\mathsf R_b(\Theta_r))),\quad b\in\mathcal B_{\mathrm{attack}}.\\
7.\quad&\operatorname{return}(\mathcal Z_0,\mathcal Z_{\mathcal B_{\mathrm{attack}}},
 \mathrm{scope},\mathrm{unresolved\ gaps},\mathrm{costs}).
\end{aligned}
$$

*(Eq. 24.29)*

[DERIVED] All training and attack budgets are finite. The invariant is equal test interface and equal recovery resources for candidate and reference. Acceptance is a conjunction of declared utility and discrepancy tolerances, not a synonym for exact unlearning. Repeated requests update both lineage and the comparator; deleting a second set from an already approximate model compounds the approximation and requires a new audit.

## Implementation

```figure
id: fig-24.16
kind: calculator
title: NPO suppression gradient weight
caption: >-
  Execute Eq. 24.26's multiplier for one response. The illustrative log-ratio
  controls gradient attenuation relative to unweighted ascent; a small multiplier
  does not establish equivalence to retained-data retraining.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-24.26
alt: >-
  At log-ratio zero the NPO multiplier is one. At log-ratio minus four and
  inverse temperature one it is approximately 0.036; at large negative ratios
  it approaches zero. This is an analytic weight, not measured deletion.
states:
  - { anchor: formulation, label: Original probability, variables: { ratio: 0 }, note: The original-model ratio gives unit multiplier. }
  - { anchor: mechanism, label: Suppressed response, variables: { ratio: -4 }, note: Lower probability attenuates subsequent suppression gradients. }
  - { anchor: failure-modes, label: Comparator still required, variables: { ratio: -4 }, note: Gradient attenuation alone is not a deletion guarantee. }
spec:
  tex: w=2\sigma(\beta_u a)
  equation: "24.26"
  inputs:
    - { symbol: beta, label: local inverse temperature, default: 1, min: 0.1, max: 5, step: 0.1 }
    - { symbol: ratio, label: response log probability ratio, default: 0, min: -10, max: 4, step: 0.1 }
  outputs:
    - { symbol: weight, label: gradient multiplier, formula: 2/(1+exp(-beta*ratio)), emphasis: true }
```

[MATHEMATICALLY-DERIVED] Retraining consumes the retained-data training budget plus repeated evaluation; approximate methods consume forget and retain tokens, optimizer state, and possibly a reference model. NPO reference logits can be precomputed only for the exact fixed examples, masks, and reference revision; full-vocabulary retain-KL storage has a different cost from scalar sequence reference likelihoods. Sequence reference scores occupy $O(n_f)$ values; logits occupy $O(\sum_iT_iV)$ values if materialized. Gradient accumulation retains the token normalization rules of §19.2.

[MATHEMATICALLY-DERIVED] SISA changes persistent cost to multiple constituent checkpoints and slice states. Deletion compute is the sum of affected suffix retraining costs; aggregation may require multiple inference paths. No generic speedup follows from shard count when accuracy, request distribution, and slice exposure differ. Response filtering adds generator/verifier calls and history tokens at inference while leaving training cost unchanged. Distributed gradients, checkpoint propagation, and cache invalidation belong to the counted service boundary. Energy, price, and achieved throughput for a book-defined audit are unmeasured.

[DERIVED] The inspected unlearning papers' research repositories are outside the reference-stack system taxonomy. They supply algorithm/artifact provenance, without establishing pinned compatibility of a unified implementation. Deployment must version the candidate, observation wrapper, retrieval store, and cache generation together; leaving an old replica or cached output reachable defeats a system-level removal claim even if the candidate parameters pass their tests.

## Experimental design

### Reported experiments

[PAPER-REPORTED] MUSE uses News and Books corpora, continuation/QA overlap metrics, a membership statistic compared with retraining, retained QA utility, and successive/scaled deletion studies. Eight approximate methods are compared; confidence intervals for overlap metrics are supplied by bootstrap. [R24.15], §§3–5, Appendix C.1. The results exhibit utility/privacy tradeoffs rather than a method satisfying every criterion.

[PAPER-REPORTED] NPO tests synthetic data and TOFU, comparing forget quality and retained utility; SimNPO additionally reports MUSE and relearning evaluations with length/reference analyses. [R24.17], §§4–5, Appendix D; [R24.18], §§4–6, Appendices G–I. SISA evaluates sharding/slicing and accuracy versus retraining costs on its disclosed datasets. [R24.16], §§VI–VII. These are distinct protocols and cannot be merged into a single cross-paper ranking.

[PAPER-REPORTED] The relearning study partitions available adaptation information from targeted test content and reports recovery across budgets/checkpoints. [R24.19], §§3–4 and appendices. The 2026 conformal study evaluates its verifier-based output interface; it does not measure equality to parameter retraining. [R24.20], §4. Hardware/precision/runtime records sufficient for an independent end-to-end replay remain UNVERIFIED in this chapter; no latency figures are transferred.

## Observations

**What the paper claims.** [PAPER-REPORTED] MUSE documents incompatible-looking improvements across suppression, privacy, and utility; the relearning study shows that some suppressed behavior can recover after limited adaptation. [R24.15], §5; [R24.19], §§3–4.

**What the evidence shows.** [DERIVED] The inspected studies falsify the sufficiency of selected weak behavioral criteria within their tested cases. They do not prove that every approximate method merely obscures all knowledge, nor that every recovery result identifies the original record's influence.

**What we infer.** [MATHEMATICALLY-DERIVED] Equality under a finite observation class is weaker than equality of released-state distributions. Stronger suppression can increase distinguishability from retraining; a refusal cannot establish parameter deletion.

**What remains unknown.** [UNVERIFIED] Global deletion for undisclosed pretraining corpora, arbitrary adaptive attacks, and indefinite repeated requests is not established by the cited finite studies or this manuscript.

## Failure modes

> **Failure mode — Suppression mistaken for absence.** [MATHEMATICALLY-DERIVED] *Symptom:* the standard prompt fails while a changed interface or small matched adaptation recovers information. *Cause:* the tested behavior did not identify the complete influence. *Detection:* compare candidate and retrained reference under predeclared alternate tests. *Mitigation:* narrow the claim or strengthen the intervention and audit.

[DERIVED] Over-unlearning, retained-utility collapse, duplicated lineage, contaminated nonmember sets, attack-budget mismatch, and stale service artifacts are separate failure classes. A non-significant hypothesis test is not proof of equality; power and tolerances must be disclosed. A privacy test with no retraining reference can mistake ordinary distribution shift for membership leakage.

## Siblings

```figure
id: fig-24.17
kind: stat-panel
title: Deletion observation interfaces
caption: >-
  Keep the retraining reference and attack boundary visible. A continuation
  test, membership test, and relearning intervention observe different properties
  of the candidate; refusal alone supplies no parameter-removal evidence.
placement: rail
anchor: failure-modes
evidence: DERIVED
source: [DERIVED:eq-24.25, DERIVED:eq-24.28]
alt: >-
  The audit lists verbatim continuation, semantic questions, retraining-relative
  membership signal, matched benign relearning, and retained utility. Every test
  declares whether it sees service outputs or released weights.
spec:
  header: ABSENT-DATA AUDIT
  rows:
    - { key: comparator, value: same training map without forget lineage }
    - { key: memorization, value: verbatim and semantic probes }
    - { key: privacy, value: signed retraining-relative attack signal }
    - { key: recovery, value: matched benign relearning budgets }
    - { key: utility, value: independent retained task panel }
    - { key: release interface, value: service or weights explicitly declared }
```

[DERIVED] [Continual retention](24-3-mechanism-families.md) protects historical influence; unlearning deliberately excludes selected influence. [Editing](24-4-model-editing.md) changes a target behavior without requiring the absent-data counterfactual. [External-memory deletion](24-6-parametric-versus-external-memory.md) can remove reachable records under a store-access contract while leaving parametric associations unchanged.

## Extensions

### Improvements

[DERIVED] The lineage changes the intervention boundary: SISA isolates future retraining dependencies, NPO attenuates a suppression gradient, SimNPO changes its reference and length dependence, and conformal filtering calibrates service output selection. Each improvement must retain its own comparator and evidence scope. A modern response guard is useful as a service control but cannot inherit the guarantees of a parameter-removal algorithm.

## Limitations

[MATHEMATICALLY-DERIVED] No finite collection of generations proves equality over all possible prompts or all released-state tests. A retraining baseline with an already contaminated base establishes only its explicitly fixed-base intervention boundary. Formal guarantees require their assumptions; behavioral tests require their bounded interpretation. Regulatory sufficiency is outside this chapter's mathematical and empirical remit.

## Reproducibility

[DERIVED] Preserve forget/retain identities, duplicate and descendant policies, base-history scope, training algorithm/configuration, random-seed distribution, original/unlearned/retrained checkpoints, raw attack outputs, matched recovery data/budgets, signed privacy statistics, utility tolerances, selection rules, and repeated-request order. [verification.md](verification.md) contains unexecuted benign-canary proposals; this edition performed no deletion training or privacy attack experiment.

## References

[R24.15](references.md#r2415), [R24.16](references.md#r2416), [R24.17](references.md#r2417), [R24.18](references.md#r2418), [R24.19](references.md#r2419), [R24.20](references.md#r2420).
