---
id: ms.section.57.4
entity_type: section
title: "Streaming inference"
volume: 3
part: 10
chapter: 57
section: 57.4
slug: 57-4-streaming-inference
parent: ms.chapter.57
prev_sibling: ms.section.57.3
next_sibling: ms.section.57.5
children: []
prerequisites: [ms.chapter.15, ms.chapter.18, ms.chapter.55, ms.chapter.56]
downstream: [ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.63]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.53]
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [temporal_representation, streaming_state, evidence_grounding], feedback_setting: [], modality: [video, audio, text]}
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 57.4 Streaming inference

## Scope

[DERIVED] The required result is a causally valid incremental answer under bounded working memory, response delay and per-update work. The baseline repeatedly processes the accumulated prefix. This section owns bounded buffers, rolling context, state updates, delayed evidence and answer revisions. Memory consistency machinery remains in Chapter 53, serving scheduling in Chapter 44 and cross-stream time validity in §57.2. A bounded context is not automatically bounded total storage, computation or monitoring lifetime.

## Why this exists

[DERIVED] Reprocessing every prefix repeats earlier encoding and increases work with stream age. Retaining everything avoids some recomputation but eventually violates a finite working-set budget. Eviction then creates a second problem: future questions may require information discarded before their arrival. A useful streaming design must state which task distinctions it retains, which sources can be retrieved later and which deadlines permit retrieval.

[DERIVED] Continuous input also separates “what to answer” from “whether to answer now.” A system that responds at every update can recognize many target events while generating unacceptable premature alerts. A system that always waits avoids false alerts while missing all events. Both response quality and the complete silence/response trajectory belong in the acceptance rule.

## Intuition

[MATHEMATICALLY-DERIVED] A finite-memory system with arbitrary late arrivals and arbitrary future queries cannot guarantee complete exact historical answers. An adversary can delay the only decisive observation beyond the retention window, or ask a question that distinguishes two histories compressed to the same state. A system must restrict delay/query assumptions, retain a retrievable source or return an incomplete result. A finite buffer alone does not resolve the information obstruction.

[DERIVED] Delayed evidence can legitimately revise a provisional answer. It must not be inserted into an earlier decision's ledger as if it had already arrived. Keep the old answer, its evidence cutoff, and a new revision. This makes retrospective correction distinguishable from initial real-time correctness.

## Formulation

[DERIVED] Let update index be $k$, new admitted observation batch be $o_k$, retained state be $z_k$ and metadata ledger be $J_k$. A bounded update has the contract

$$
(z_k,J_k)=F_v(z_{k-1},J_{k-1},o_k),\qquad
\operatorname{tokens}(z_k)\le Q_s,\quad
\operatorname{bytes}(z_k)\le M_s.
$$
*(Eq. 57.15)*

[DERIVED] The ledger itself, external archives, indexes and decoder caches require separate bounds. A fixed frame count does not imply a fixed token count under variable resolution or dynamic tiling. Bound bytes and actual tokens, including transient copies during update/eviction, before claiming memory feasibility.

[MATHEMATICALLY-DERIVED] For an analytical approximation model, suppose update error contracts by factor $\kappa_s\ge0$ and each compression introduces error at most $\varepsilon_s$ in a specified state metric. If $e_k\le\kappa_se_{k-1}+\varepsilon_s$, induction yields

$$
e_k\le \kappa_s^ke_0+
\varepsilon_s\sum_{j=0}^{k-1}\kappa_s^j.
$$
*(Eq. 57.16)*

[DERIVED] With $\kappa_s<1$, accumulated error is bounded by the geometric series; with $\kappa_s=1$, the bound grows linearly. No inspected neural streaming system supplies this contraction constant for arbitrary task error. The identity explains which additional stability evidence would justify repeated compression, rather than asserting that it exists.

## Mechanism

### Methodology

[DERIVED] Separate acquisition, admitted evidence, retained working state, retrieval and response policy. Acquisition records source and arrival times. Admission applies the causal gate. Retention updates recent detail and selected older evidence under explicit budgets. Retrieval can recover only available sources within the remaining deadline. The response policy then chooses wait, provisional answer, final answer or incomplete status using a fixed task contract.

[PAPER-REPORTED] StreamOV builds rank-normalized visual/audio evidence, keeps dense recent and sparse historical selections, deduplicates them and serializes them chronologically. Its trigger is trained with the backbone frozen. Although the formulation permits several early hidden states, the evaluated implementation uses only the final prefill state $h_{t,0}$, before autoregressive decoding [R57.4, §§4.1–4.3].

[DERIVED] This distinguishes response suppression from zero compute: evaluating that trigger still requires the relevant prefill and feature construction. Moreover, a within-window rank is a relative salience score, not a globally calibrated future-query utility. Two windows can assign the same top rank to events with very different absolute importance. Retaining top ranks across windows therefore needs a transfer test on the future query distribution.

[PAPER-REPORTED] LatentStream uses query-agnostic hierarchical retention, grouped latent tokens with nested retrieval scopes, and test-time optimization of latent/retrieved embeddings while the model is frozen. It removes injected evidence copies before final decoding; the bounded external memory remains [R57.7, §§3.2–3.4].

[MATHEMATICALLY-DERIVED] For a bounded measurable reward $\mathcal R_v$ and Gaussian perturbation $\xi\sim\mathcal N(0,\sigma_v^2I)$, differentiating the Gaussian density gives

$$
\nabla_u\,\mathbb E_\xi[\mathcal R_v(u+\xi)]
=\mathbb E_\xi\!\left[
\mathcal R_v(u+\xi)\frac{\xi}{\sigma_v^2}\right],
\qquad \sigma_v>0.
$$
*(Eq. 57.17)*

[DERIVED] This explains the score-function form used for continuous latent search. Finite samples add estimator variance and reward evaluation cost; a small perturbation scale magnifies the score term. Entropy reduction is not a correctness certificate: a distribution can become more confidently wrong. Admissibility therefore requires held-out answer/evidence checks, not only the optimized confidence reward.

[PAPER-REPORTED] StreamPro trains silence/response control with effective-frequency class weights, then applies GRPO with format, turn-level and trajectory rewards. Its benchmark distinguishes perception, temporal reasoning and proactive agency rather than only timestamp-selected QA [R57.8, §§3–4].

[PAPER-REPORTED] For a represented control class with count $n_k>0$, StreamPro uses effective count $(1-\nu_c^{n_k})/(1-\nu_c)$ with $\nu_c=0.9999$, and normalized inverse-effective-count weights for the two control classes; ordinary language tokens receive a separate text weight of 2 in the reported setup. An absent class has zero effective count, so the expression needs a separate zero-count implementation rule, NOT-DISCLOSED in the inspected text. Reported GRPO reward weights are 0.1 for format and 0.45 each for turn and trajectory behavior, with eight-second timing tolerance [R57.8, §4]. These choices change the optimized decision behavior; their calibration still needs a separate target-distribution check.

[MATHEMATICALLY-DERIVED] In a binary weighted cross-entropy example, true response-needed probability $p_v$ and positive weights $w_1,w_0$ yield the pointwise optimum

$$
q_w^*=\frac{w_1p_v}{w_1p_v+w_0(1-p_v)}.
$$
*(Eq. 57.18)*

[DERIVED] Setting the derivative of $-w_1p_v\log q-w_0(1-p_v)\log(1-q)$ to zero gives this result. Unless weights coincide, the optimized probability differs from the original posterior. Reweighting addresses an optimization imbalance but makes a raw threshold a separate calibration decision.

[MATHEMATICALLY-DERIVED] For a declared one-step decision, let $\mathcal F_t$ be the admitted information at decision time and let $E$ be the event that a response is warranted. With false-alert cost $c_{\mathrm{FP}}>0$, missed-ready-event cost $c_{\mathrm{FN}}>0$ and full-history posterior $p_v=\Pr(E\mid\mathcal F_t)$, emitting has conditional expected loss $(1-p_v)c_{\mathrm{FP}}$ and waiting has $p_vc_{\mathrm{FN}}$. Thus

$$
\operatorname{Emit}\quad\Longleftrightarrow\quad
p_v\ge\frac{c_{\mathrm{FP}}}{c_{\mathrm{FP}}+c_{\mathrm{FN}}}.
$$
*(Eq. 57.19)*

[DERIVED] This instantiates the [conditional-risk construction in 56.4](../ch56-audio-speech-and-real-time-interaction/56-4-streaming-interaction.md#formulation) for a myopic two-action model. A general optimal stopping policy must also value information expected from waiting, future deadlines and repeated alerts. Calibration of a scalar score alone supports risk minimization among policies restricted to that score; it does not establish optimality over the full admitted history. A model score or a weighted-loss output is not automatically the posterior $p_v$ in this equation.

```figure
id: fig-57.12
kind: calculator
title: Readiness threshold under declared error costs
caption: A one-step analytical decision using the declared readiness posterior. It does not solve sequential optimal stopping or calibrate a model's trigger score.
placement: rail
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-57.19
alt: Higher false-alert cost raises the readiness threshold; higher missed-event cost lowers it. Both costs are explicit illustrative inputs in the same arbitrary loss unit.
spec:
  tex: p_{\mathrm{threshold}}=c_{\mathrm{FP}}/(c_{\mathrm{FP}}+c_{\mathrm{FN}})
  equation: "57.19"
  inputs:
    - {symbol: fp, label: "false alert cost units", default: 4, min: 0.01, max: 100, format: fixed2}
    - {symbol: fn, label: "missed ready event cost units", default: 1, min: 0.01, max: 100, format: fixed2}
  outputs:
    - {symbol: threshold, label: "posterior readiness threshold", formula: fp/(fp+fn), format: percent}
```

[MATHEMATICALLY-DERIVED] If $q_f$ is a fixed false-alert probability at each of $m_f$ independent silence decisions, the chance of at least one false alert is

$$
P_{\mathrm{any\,false}}=1-(1-q_f)^{m_f}.
$$
*(Eq. 57.20)*

[DERIVED] Without independence, the union bound gives at most $\min(1,m_fq_f)$ when each marginal is bounded by $q_f$. A small per-tick error can therefore violate a long-duration silence requirement. Resetting a detector every tick does not reset the user's accumulated exposure.

[DERIVED] **Cost.** Charge every ingestion tick, scoring pass, retained-state update, trigger prefill and suppressed generation attempt. For $R_v$ latent evolution rounds, $n_\xi$ perturbation samples and reward evaluation cost $C_r$, search adds approximately $R_vn_\xi C_r$ work plus retrieval and embedding storage. A small final token count omits this work. Fixed recent/history capacities bound only the declared memory terms; archive growth and worker concurrency require their own admission limits. Latency, energy and money remain execution-dependent.

```figure
id: fig-57.13
kind: diagram
title: Delayed evidence and answer revisions
caption: Late observations enter a later revision or an explicit gap record; they do not alter the evidence that was available to an earlier answer.
evidence: DERIVED
source: DERIVED:eq-57.15
alt: Received records pass a prefix/availability gate, update bounded state, and feed a trigger. The trigger waits or creates an answer revision. Late evidence is recorded and may create a later revision before the deadline.
spec:
  direction: LR
  nodes:
    - {id: recv, kind: flow, label: Received media records}
    - {id: admit, kind: branch, label: Admissible at this decision}
    - {id: state, kind: memory, label: Bounded state and gap ledger}
    - {id: trigger, kind: branch, label: Readiness and deadline policy}
    - {id: answer, kind: state, label: Versioned answer and cutoff}
    - {id: late, kind: state, label: Late or incomplete evidence}
    - {id: wait, kind: state, label: Wait within remaining budget}
  edges:
    - {from: recv, to: admit}
    - {from: admit, to: state, label: valid}
    - {from: admit, to: late, label: late or unavailable}
    - {from: state, to: trigger}
    - {from: trigger, to: answer, label: response permitted}
    - {from: trigger, to: wait, label: more evidence needed}
    - {from: late, to: state, kind: feedback, label: later valid revision only}
```

## Algorithm

> **Algorithm 57.4 — Bounded streaming update and response.** [DERIVED] Inputs include validated records, finite recent/history capacities, source-availability policy, finite monitoring lifetime, per-tick/call/output caps and a reserved final checker. Output is updated state plus wait/answer/incomplete and an immutable decision cutoff.

$$
\begin{aligned}
1.&\quad \operatorname{LoadStateEpochBudgetsAndStandingRequest};
\quad\operatorname{Expired}\Rightarrow\operatorname{Return}(\mathrm{incomplete}).\\
2.&\quad o_k\leftarrow\operatorname{AdmitAndDeduplicateAtMost}(n_{\max});
\quad\operatorname{RecordLateOrDroppedInputs}.\\
3.&\quad (z_k,J_k)\leftarrow\operatorname{BoundedUpdate}(z_{k-1},J_{k-1},o_k);\\
 &\quad\operatorname{CapacityExceeded}\Rightarrow
\operatorname{DeclaredEvictionOrReject}.\\
4.&\quad \operatorname{OptionalSearch}\Rightarrow
\operatorname{AtMost}(R_v,n_\xi,\mathrm{remaining\ deadline}).\\
5.&\quad a_k\leftarrow\operatorname{DeclaredTrigger}(z_k);
\quad\operatorname{NoBudgetOrEvidence}\Rightarrow\mathrm{incomplete}.\\
6.&\quad a_k=\mathrm{emit}\Rightarrow
\operatorname{BoundedGenerateCheckAndVersionAnswer};\\
 &\quad\operatorname{Otherwise}\Rightarrow\operatorname{RecordWaitAndCutoff}.
\end{aligned}
$$

[DERIVED] Termination is per update, with a finite lifetime for each standing request; an always-on service has no implied global termination proof. Persisted deadlines and budgets survive restart. The invariants are causal evidence admission, bounded retained state and no uncharged search or silent ticks. Checkpoint consistency and duplicate-effect handling are linked to Chapters 51/53 rather than inferred from memory summaries.

## Implementation

[DERIVED] Use source epoch/sequence identity to prevent replayed observations from updating recurrent state twice. Separate compact inference state from a source archive and from the append-only decision trace. Associate each emitted answer with its presentation cutoff, availability cutoff and revision lineage. Updating a summary cannot retroactively make an old answer correct.

[DERIVED] PyTorch (#17, Core training framework) can execute the frozen backbone and explicit latent tensors; Hugging Face Transformers (#26, Model-definition layer) owns model inputs, hidden-state access and generation behavior. A serving engine's cache API is an additional boundary, not proof of compatibility with a research memory method. Record exact operators and model/runtime revisions before claiming deployment support.

## Experimental design

### Reported experiments

[PAPER-REPORTED] StreamOV uses Qwen3-Omni-30B-A3B, a frozen backbone and an 18.9M-parameter trigger on eight 80 GB H100s, with 64-frame SOVBench memory. Table 1 reports real-time/recall/proactive scores separately and distinguishes accumulated QA context [R57.4, §5, Table 1]. This does not measure arbitrary-duration memory completeness.

[PAPER-REPORTED] LatentStream evaluates frozen Qwen2.5-VL3B/7B, one-FPS online input, 2048 visual-token memory, two latent tokens/group, four evolution rounds and eight H20 GPUs. Its Table 4 reports OVO-Bench 56.9 baseline,59.7 direct evidence,56.5 initial latent tokens and 64.2 evolved tokens [R57.7, §4.1, Table 4]. Additional rounds and larger candidate budgets do not improve monotonically.

[PAPER-REPORTED] StreamPro evaluates Qwen2.5-VL-3B and Qwen3-VL-4B at one FPS with a sliding limit of 200 dialogue turns. Its source reports 63K SFT and 3K RL examples; SFT updates the projector/LLM for one epoch on 64 H100 GPUs, learning rate $10^{-5}$ and batch 512. RL uses veRL/vLLM, eight H100 GPUs, one epoch, learning rate $10^{-6}$, global batch 16, eight sampled completions and temperature 1; the source reports approximately 24 hours for each stage. A Gemini-2.5-Pro rubric supplies the answer judge [R57.8, §5.1]. Table 3 also reports reactive OVO overall accuracy decreasing from 52.5 to 50.7 for 3B and 58.5 to 57.6 for 4B after the proactive RL stage. Those results expose a task trade-off rather than establishing uniform improvement. Table 5 isolates control-loss alternatives: proactive SPB changes from 6.6 with ordinary cross-entropy to 16.3 with class balancing while the reported OVO real-time perception row changes from 62.3 to 62.0. Exact independent-run uncertainty is NOT-DISCLOSED for these rows.

[DERIVED] These studies motivate different mechanisms; their backbones, memory representations, evaluators and protocols differ. A deployment preference needs a matched recency baseline, memory-only baseline, trigger ablation and full continuously accumulated cost under the target deadline.

## Observations

**What the papers claim.** [PAPER-REPORTED] Evidence-guided retention, learned triggering and latent internalization improve their respective evaluated streaming tasks [R57.4, §5; R57.7, §4; R57.8, §5].

**What the evidence shows.** [DERIVED] Initial latent tokens can reduce accuracy; token capacity and confidence alone do not explain the reported benefit. Trigger evaluation still includes structural differences among native silence mechanisms.

**What we infer.** [DERIVED] Adopt the simplest retention/trigger combination meeting the same grounding, silence and delay rule. Reopen the choice when errors concentrate beyond the retained horizon or when continuous background work violates capacity.

**What remains unknown.** [UNVERIFIED] The contraction premise, calibrated trigger probabilities, indefinite-horizon sufficiency and local end-to-end runtime behavior have not been established.

## Failure modes

> **Failure mode — Confident forgotten history.** [DERIVED] *Symptom:* low-entropy answers cite an event no longer represented. *Cause:* confidence optimization rewards certainty without restored evidence. *Detection:* remove or contradict the retrieved evidence under a fixed prefix. *Mitigation:* require evidence checks and an unknown path.

> **Failure mode — Backdated repair.** [DERIVED] *Symptom:* retrospective logs show an accurate early answer despite late supporting media. *Cause:* mutable decision records. *Detection:* replay immutable availability cutoffs. *Mitigation:* preserve the original answer and append a revision.

## Siblings

[DERIVED] Recent windows prioritize immediate detail; hierarchical memory retains selected history; external archives preserve retrievable observations; latent search modifies query-conditioned state; learned triggers decide when to speak. These mechanisms address different constraints. Their combined cost and interaction require ablation rather than crediting all benefit to “memory.”

## Extensions

[DERIVED] Weighted control-token training changes the decision distribution and should be followed by calibration under deployment prevalence/costs. Query-conditioned latent search can be useful when retained evidence is available but poorly integrated; it cannot recover an evicted inaccessible event. A stronger matched simple baseline, an entropy/correctness counterexample or an unbounded background queue reopens the preference.

```figure
id: fig-57.14
kind: compare
title: Streaming state mechanisms and unresolved obligations
caption: Small answer contexts hide different upstream costs. No mechanism establishes complete indefinite memory or calibrated readiness by itself.
evidence: DERIVED
source: DERIVED:eq-57.15
alt: The comparison separates recent windows, selected historical memory and latent evolution by retained state, extra work and remaining uncertainty.
spec:
  axis: retained evidence and additional work at the same causal prefix
  columns:
    - {id: recent, label: Recent window}
    - {id: history, label: Selected history}
    - {id: latent, label: Latent evolution}
  rows:
    - {dimension: Retains, values: {recent: recent detailed inputs, history: chosen past observations, latent: query-conditioned latent state}}
    - {dimension: Extra work, values: {recent: repeated window prefill, history: scoring and consolidation, latent: retrieval and reward evaluations}}
    - {dimension: Main unresolved gap, values: {recent: distant events, history: future-query relevance, latent: confidence versus correctness}}
```

## Limitations

[DERIVED] Bounded operation is established only for named capacities and finite per-request limits. Correct answers over unrestricted future queries, arbitrary late arrivals or indefinitely repeated compression remain unresolved. Exhausting a monitor budget establishes termination, not that the event did not occur.

## Reproducibility

[DERIVED] Preserve source/receipt traces, sampling and memory policies, actual token/byte peaks, duplicate rules, trigger thresholds, all silent ticks, latent-search samples and costs, revision lineage and stopping reasons. No streaming model or system experiment was run for this chapter.

## References

[DERIVED] [R57.4](references.md#r57-4), [R57.7](references.md#r57-7) and [R57.8](references.md#r57-8), inspected primary v1 texts on 2026-10-25.
