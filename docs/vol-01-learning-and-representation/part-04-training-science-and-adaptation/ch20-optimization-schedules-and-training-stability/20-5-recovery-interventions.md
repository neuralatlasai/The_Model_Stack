---
id: ms.section.20.5
entity_type: section
title: Recovery interventions
short_title: Recovery interventions
volume: 1
part: 4
chapter: 20
section: 20.5
slug: 20-5-recovery-interventions
parent: ms.chapter.20
prev_sibling: ms.section.20.4
next_sibling: ms.section.20.6
children: []
prerequisites: [ms.chapter.2, ms.chapter.3, ms.chapter.19]
downstream: [ms.chapter.21, ms.chapter.22, ms.chapter.29, ms.chapter.30]
related: [ms.chapter.6, ms.chapter.13]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P13}
  - {type: implemented_by, target: impl.pytorch}
axes: {lifecycle: [pretraining, continued_training, evaluation], mechanism: [optimization, training_stability], feedback_setting: [], modality: [text, image]}
papers: [P13]
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# 20.5 Recovery interventions

## Scope

[DERIVED] This section owns batch isolation, rollback, rate/clipping/precision interventions and their scientific interpretation. Success first means valid continuation from complete state, and separately means evidence for a failure cause. Distributed transport, checkpoint publication and cluster repair are developed in Chapter 30.

## Why this exists

[DERIVED] Recovery has two distinct objectives: restore a valid continuation state and identify the failure mechanism. A run that resumes with lower loss can satisfy neither if the batch distribution, optimizer state or objective silently changed. The defensible unit is an intervention on a complete checkpointed transition, accompanied by its retained evidence and consumed resources. Numerical failure, optimization instability, data-triggered transients and infrastructure faults overlap in their symptoms; a successful mitigation is not automatically a verified diagnosis.

## Intuition

[MATHEMATICALLY-DERIVED] An anomalous gradient changes parameters and stored moments; replacing the following batch does not undo either. Full-state rollback restores an earlier initial condition, while filtering, resetting moments or changing precision defines a different transition. Stable continuation and causal explanation therefore require separate records.

## Formulation

| Symbol | Meaning and domain |
|---|---|
| $X_k,F$ | Complete recoverable state and its specified training transition |
| $\mathcal E,b_k$ | Execution environment and realized batch |
| $I,K_r$ | Declared intervention and bounded replay horizon |
| $t_{\mathrm{cp}},\Delta$ | Checkpoint duration and checkpoint interval, in the same time unit |
| $\rho$ | Independent stationary failure intensity per time unit |
| $\mathcal J,j_*$ | Eligible checkpoint indices and latest established valid checkpoint |

### Recovery acts on complete state

[MATHEMATICALLY-DERIVED] Let $X_k=(\theta_k,s_k,q_k,r_k,d_k,p_k)$ contain model parameters, optimizer statistics, schedule state, realized RNG state, data iterator state and precision/router/runtime state relevant to continuation. A transition is $X_{k+1}=F(X_k,b_k;\mathcal E)$, with realized batch $b_k$ and execution environment $\mathcal E$. Restoring only $\theta_k$ while retaining later moments gives a different initial condition for $F$. Restoring weights and moments but not the next data position or random consumption likewise does not recreate the original continuation.

[MATHEMATICALLY-DERIVED] Adam's recurrences show why a single gradient can persist after an apparent loss spike ends. A perturbation $\delta g_k$ changes first momentum by $(1-\beta_1)\delta g_k$ and second moment by $(1-\beta_2)(2g_k\odot\delta g_k+\delta g_k^{\odot2})$. Under an otherwise fixed future gradient sequence, those state perturbations decay by powers of their coefficients. Actual future gradients also change because the parameters changed. Replacing only the next batch does not erase the earlier state effect; resetting all moments is itself an optimizer intervention rather than a neutral repair.

[DERIVED] A nonfinite rejected step and a rollback are different transitions. A properly gated rejected update can leave parameters and optimizer moments untouched while changing precision-scale state and data-consumption counters according to policy. A rollback restores an earlier committed state and replays work. A process restart after a hardware fault may also change the execution environment. State equality and budget equality must both be recorded before attributing recovered behavior to one intervention.

## Mechanism

### Methodology: Batch isolation establishes a conditional association

[PAPER-REPORTED] OLMo 2 identifies repetitive n-gram sequences in many spiking batches but reports that the same sequence may spike only for a larger model, only under one order, or not at other occurrences. Broad filtering and loss masking reduce the spike frequency without removing slow norm growth. This rules out a simple deterministic label of intrinsically bad batch; the effect depends on current state and trajectory. [R20.10]; section 3.1

[DERIVED] Removing documents changes the training distribution and effective counts; masking their targets changes the objective on the retained inputs. It may leave those tokens in the context, so its forward influence can persist. The ledger must retain whether a suspect sample was removed, masked only for loss, truncated, replaced or reweighted. Comparing losses across these interventions requires identical evaluation normalization and a common held-out set. A lower training loss after deleting difficult samples is not independent evidence of improved generalization.

### Rollback must precede poisoned state

[PAPER-REPORTED] OLMo 2 reports a z-loss implementation difference: forward values match but backward behavior differs, with precision suspected rather than proven as the cause. Although the authors do not observe an effect on cross-entropy or downstream quality in that comparison, they abandon the custom-implementation fork and retrain from the original divergence point. This is a documented recovery decision under unresolved mechanism, not a proof that the retained implementation is error-free. [R20.10]; section 3.3.3

[DERIVED] A checkpoint after corruption can be structurally loadable while preserving the corrupted statistics. Establish checkpoint lineage, checksums and pre-event diagnostics. A transaction model in which every candidate state is validated before commitment is easy to specify but expensive if it doubles model/state storage. In-place production updates can partially mutate before detecting failure; they require a valid rollback snapshot or an explicitly recoverable journal. A finite-gradient gate alone does not make a multi-tensor optimizer update atomic.

### Schedule and clipping interventions change the dynamics

[MATHEMATICALLY-DERIVED] A smaller learning rate scales the data-gradient and coupled-decay terms of Eq.20.2, leaving prior moment contents intact. Gradient clipping multiplies the incoming direction by a norm-dependent factor before moments are updated; update clipping bounds a transformed direction afterward. Both change the state transition, and neither identifies why the original gradient was large. For a finite nonzero gradient, norm clipping preserves its direction; it does not preserve the coordinatewise Adam transform relative to an unclipped history.

[OFFICIAL-DOCUMENTATION] For FP16 AMP, unscale before clipping and perform the scale update at the effective-batch boundary. The documented scaler skip handles nonfinite assigned gradients before calling the optimizer. A manual rule that skips after moments were already updated does not have the same semantics. Multiple optimizers introduce separate acceptance checks; the trainer must specify whether their updates form one coordinated transition or can be accepted independently. [R20.26]

[PAPER-REPORTED] Kimi K2's QK-Clip is a targeted post-update weight rescaling guided by per-head logit maxima. It differs from global gradient clipping and from changing the softmax forward function. For ordinary head-specific projections, scaling query and key weights by square-root factors scales their bilinear product; MLA's shared rotary key requires a different factor allocation. The statistic comes from the preceding forward pass, so the mechanism regulates growth rather than certifying every updated-input logit. The disclosed large run and small-scale comparison support the specific intervention, not an arbitrary substitution into another architecture. [R20.11]

### Precision changes need a role-specific diagnosis

[PAPER-REPORTED] DeepSeek-V3's low-precision ablation changes activation-gradient quantization grouping and observes divergence around 300B tokens in a 16B-total MoE model. Its successful recipe uses fine-grained groups and higher-precision partial accumulation, with separately retained higher-precision operations and states. This is evidence about a particular tensor role and grouping, not a blanket claim that FP8 is unstable or that making every tensor FP32 is always required. [P13]; section 3.3/AppB

[DERIVED] A precision intervention should identify storage, operand conversion, accumulation, output and persistent-state roles separately. Recasting a rounded BF16 parameter into FP32 does not recover lost historical bits; it only changes future storage. Restoring an earlier higher-precision master state, when that state existed, is different. Switching an autocast policy can also change kernel selection, reduction order and memory use, so a stable replay with wider arithmetic is evidence consistent with a numerical cause but does not uniquely identify the offending operation.

### Infrastructure recovery is a separate evidence class

[PAPER-REPORTED] Llama 3's infrastructure report describes 419 unexpected interruptions over a 54-day pretraining period, with approximately 78% attributed to confirmed or suspected hardware-related issues; only three required substantial manual intervention. Checkpointing and automation limit lost work. These are failure/recovery observations for the reported distributed system, not optimizer-loss-spike counts. Combining hardware interruptions with numerical divergence in one stability rate loses the causal distinction. [R20.27]; section 3.3

```figure
id: fig-20.13
kind: diagram
title: Recovery preserves both state and failure evidence
caption: Containment restores a valid complete state while retaining the failed branch. A changed recovery policy is an intervention whose success and causal interpretation are recorded separately.
placement: inline
evidence: DERIVED
source: [R20.10, R20.11, R20.27]
alt: An anomaly preserves its evidence, identifies a valid checkpoint, restores complete state, records policy changes, and resumes a new branch. The original failure remains in the ledger.
spec:
  direction: TB
  nodes:
    - {id: failure, kind: node, label: anomaly and failed state}
    - {id: evidence, kind: dataset, label: retained batch and traces}
    - {id: checkpoint, kind: state, label: valid complete checkpoint}
    - {id: policy, kind: process, label: explicit intervention}
    - {id: resumed, kind: node, label: recovered branch and cost}
  edges:
    - {from: failure, to: evidence}
    - {from: evidence, to: checkpoint}
    - {from: checkpoint, to: policy}
    - {from: policy, to: resumed}
```

[MATHEMATICALLY-DERIVED] Under the stationary independent-failure approximation developed below, checkpoint overhead and the interior stationary interval are

$$
h(\Delta)=t_{\mathrm{cp}}/\Delta+\rho\Delta/2,\qquad\Delta_* =\sqrt{2t_{\mathrm{cp}}/\rho}.
$$
*(Eq. 20.17)*

[PAPER-REPORTED] For QK-Clip's observed positive maximum $s_{\max}>0$ and positive target $s_{\mathrm{target}}$, the rescaling is

$$
\gamma=\min(1,s_{\mathrm{target}}/s_{\max}),\qquad (W_q,W_k)\mapsto(\sqrt\gamma W_q,\sqrt\gamma W_k).
$$
*(Eq. 20.18)*

[PAPER-REPORTED] This last pair applies to head-specific content projections. MLA rotary query receives $\gamma$ while shared rotary key is unchanged. The statistic precedes the update and is a growth-control signal, not a universal post-update bound. [R20.11], Section 2.1 and Algorithm 1.

```figure
{
  "id": "fig-20.14",
  "kind": "calculator",
  "title": "Checkpoint interval tradeoff",
  "caption": "Conditional stationary-failure approximation, excluding restore duration and failures during recovery. Parameters are illustrative; numerical failures tied to particular states violate the model.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-20.17",
  "alt": "Thirty-second checkpoints every 1800 seconds with 0.1 independent failures per hour give approximately 4.17 percent overhead; the stationary interval is about 1470 seconds.",
  "states": [
    {
      "anchor": "formulation",
      "label": "Illustrative interval",
      "variables": {
        "interval": 1800
      },
      "note": "Checkpoint writes and expected lost work contribute separately."
    },
    {
      "anchor": "mechanism",
      "label": "Longer interval",
      "variables": {
        "interval": 7200
      },
      "note": "Write overhead falls while expected replayed work rises."
    }
  ],
  "spec": {
    "tex": "h(\\Delta)=t_{\\mathrm{cp}}/\\Delta+\\rho\\Delta/2",
    "equation": "20.17",
    "inputs": [
      {
        "symbol": "cp",
        "label": "checkpoint seconds",
        "default": 30,
        "min": 1,
        "max": 300,
        "format": "seconds",
        "step": 1
      },
      {
        "symbol": "interval",
        "label": "interval seconds",
        "default": 1800,
        "min": 60,
        "max": 14400,
        "format": "seconds",
        "step": 60
      },
      {
        "symbol": "rho",
        "label": "independent failures per hour",
        "default": 0.1,
        "min": 0.01,
        "max": 2,
        "format": "raw",
        "step": 0.01
      }
    ],
    "outputs": [
      {
        "symbol": "Overhead",
        "label": "approximate overhead fraction",
        "formula": "cp/interval+(rho/3600)*interval/2",
        "format": "percent",
        "emphasis": true
      },
      {
        "symbol": "Opt",
        "label": "stationary interval",
        "formula": "sqrt(2*cp/(rho/3600))",
        "format": "seconds",
        "emphasis": false
      }
    ]
  }
}
```

```figure
{
  "id": "fig-20.15",
  "kind": "calculator",
  "title": "Head-specific QK rescaling factors",
  "caption": "Algebra of the reported QK-Clip rescaling, with an illustrative maximum. MLA content projections use square-root factors, rotary query uses gamma and shared rotary key stays unchanged.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-20.18",
  "alt": "For an observed positive maximum 1000 and threshold 100, gamma is 0.1 and the content-query/key multiplier is about 0.3162. This does not bound all post-update or unseen logits.",
  "spec": {
    "tex": "\\gamma=\\min(1,s_{\\mathrm{target}}/s_{\\max})",
    "equation": "20.18",
    "inputs": [
      {
        "symbol": "target",
        "label": "positive-logit threshold",
        "default": 100,
        "min": 1,
        "max": 1000,
        "format": "raw",
        "step": 1
      },
      {
        "symbol": "maximum",
        "label": "observed positive maximum",
        "default": 1000,
        "min": 1,
        "max": 10000,
        "format": "raw",
        "step": 1
      }
    ],
    "outputs": [
      {
        "symbol": "Gamma",
        "label": "bilinear rescale factor",
        "formula": "min(1,target/maximum)",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "Root",
        "label": "content query/key factor",
        "formula": "sqrt(min(1,target/maximum))",
        "format": "raw",
        "emphasis": false
      }
    ]
  }
}
```

## Algorithm

[DERIVED] The following transition logic specifies containment and evidence preservation. Chapter 30 owns large-scale checkpoint execution; this reconstruction states what the recovered scientific state must mean.

### Algorithm 20.5 — Containment with retained provenance

[DERIVED] Inputs are anomaly record $\mathcal R_f$, finite checkpoint lineage $\{(j,X_j,m_j)\}$ with integrity manifests $m_j$, recovery policy $\mathcal P$, and bounded replay horizon $K_r$. The suspect transition starts from update $k_f$. A predicate $\operatorname{Valid}$ checks payload integrity, complete-state schema, group mapping and established preincident validity. A declared intervention $I$ maps state, environment and policy to a new branch:

$$
\begin{aligned}
\text{(1)}\quad &\mathcal E_f=\operatorname{Preserve}(\mathcal R_f,\text{realized batch},\text{available states});\\
\text{(2)}\quad &\mathcal J=\{j\le k_f:\operatorname{Valid}(X_j,m_j)=1\},\qquad j_* =\max\mathcal J;\\
\text{(3)}\quad &(\widetilde X_0,\widetilde{\mathcal E},\widetilde{\mathcal P})=I(\operatorname{Restore}(X_{j_*}),\mathcal E,\mathcal P);\\
\text{(4)}\quad &\widetilde X_{r+1}=F(\widetilde X_r,b_r;\widetilde{\mathcal E},\widetilde{\mathcal P}),\quad 0\le r<K_r;\\
\text{(5)}\quad &\mathcal O=(j_*,I,\mathcal E_f,\{\widetilde X_r\},\text{accept/reject record},\text{replayed resources},\text{causal status}).
\end{aligned}
$$

[DERIVED] Future commits depending on suspect state stop before restoration. Empty $\mathcal J$, incomplete restore, failed integrity or another anomaly returns unresolved/rejected continuation. Line (4) is evaluated only while the preceding state is accepted. Select the *latest established valid* checkpoint preceding the suspect transition; a later checkpoint is ineligible if it already includes the corruption. The invariant retains the original failed branch and intervention identity. Stable replay does not automatically set causal status to confirmed. Finite restore attempts and $K_r$ bound termination. Restore traffic scales with checkpoint bytes; replay repeats the corresponding forward/backward and update work.

## Implementation

[DERIVED] Recovery cost includes checkpoint writes/reads, pause time, repeated forward/backward work, intervention diagnostics, discarded branches and any newly provisioned devices. Let checkpoint duration be $t_{\mathrm{cp}}$, interval $\Delta$, and independent stationary failure intensity $\rho$ per unit training time. In the elementary approximation ignoring failures during recovery, checkpoint overhead per unit time is $t_{\mathrm{cp}}/\Delta$, and uniformly located failures lose mean $\Delta/2$ work, giving $t_{\mathrm{cp}}/\Delta+\rho\Delta/2$. Its stationary point is $\Delta=\sqrt{2t_{\mathrm{cp}}/\rho}$. This is a conditional accounting model; correlated failures, asynchronous checkpointing, storage contention and numerical failures tied to data/state invalidate its simple assumptions.

[OFFICIAL-DOCUMENTATION] PyTorch's optimizer state dictionary excludes the parameters themselves and uses parameter-group/order bookkeeping. Reconstruct model, optimizer and scheduler consistently before loading; verify intended name/shape mapping. A checkpoint format that successfully loads is not evidence that all scientific state was retained. The relevant reference-stack layer is MODEL / AUTOGRAD FRAMEWORK; distributed checkpoint transport and resharding belong to Chapters 29-30. [R20.19], [R20.21], [R20.23]

[DERIVED] Rollback fidelity can conflict with throughput when environment changes are necessary to escape a hardware fault. Report both: restoring the same realized state and changing the device/kernel boundary is a controlled change, not byte-identical replay. Operational urgency can justify mitigation before diagnosis, but it does not justify relabeling an unresolved cause as known.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The OLMo 2 recovery case is embedded in controlled architecture, initialization, data and optimizer studies. Repetition masking mitigates spikes but not gradual norm growth; excluding embeddings from decay and lowering AdamW epsilon alter separate dynamics. The z-loss fork is abandoned despite similar task metrics. These records provide actual interventions and negative evidence against a single universal repair. Missing repeated-trial uncertainty for a particular ablation remains a disclosure boundary rather than an invented confidence interval. [R20.10]; section 3

[PAPER-REPORTED] Kimi K2's smaller Muon-versus-MuonClip ablation and production trajectory answer different questions about intervention and scale. DeepSeek-V3 reports no irrecoverable loss spike or rollback during its main 14.8T-token run, while also reporting a divergent quantization ablation. The combination shows why a stable final recipe and a failing variant should both be retained in the evidence record. [R20.11], [P13]

## Observations

### Observation 20.5 - Successful containment can precede a resolved diagnosis

**What the paper claims.** [PAPER-REPORTED] OLMo 2 retrains from a known divergence point; DeepSeek-V3 reports a stable main run and a failing precision variant. [R20.10]; [P13]

**What the evidence shows.** [PAPER-REPORTED] Successful containment is reported while OLMo 2's precision explanation remains suspected, and the DeepSeek ablation isolates a precision design that fails at its tested scale. Neither report supplies this book's independent replay. [R20.10]; [P13]

**What we infer.** [DERIVED] Full-state rollback removes downstream consequences of a suspect transition without identifying its cause. Data order, kernel changes, and altered optimizer state remain alternative explanations if several factors change together.

**What remains unknown.** [UNVERIFIED] The controlled-replay experiments in verification.md remain unexecuted. The relative benefit of each recovery intervention under identical retained state has not been measured here.

## Failure modes

[DERIVED] Retrying an irreversibly corrupted state, overwriting the offending batch, restoring weights with later moments, resetting RNG without the data iterator, accepting one rank's update while another rejects it, and reporting only recovered time all invalidate interpretation. Repeated batch deletion can quietly impose a new curriculum. A lower rate may mask a data or numerical defect by reducing its immediate consequence. Continued success therefore needs the declared evaluation and state checks, not merely disappearance of an alert.

## Siblings

[DERIVED] On the axis of what state changes, [full-state rollback](#recovery-acts-on-complete-state) restores the initial condition; [batch isolation](#mechanism) changes the realized input; rate reduction changes displacement; gradient clipping bounds an incoming gradient; update clipping bounds a transformed direction; QK-Clip changes selected weights after update; precision replacement changes arithmetic. Definitions and equations belong [above](#mechanism) and in [optimizer mechanics](20-1-optimizer-mechanics.md#mechanism). Several changes together can contain failure without identifying a cause.

## Extensions

### Improvements

[PAPER-REPORTED] The progression from generic clipping to per-head QK-Clip illustrates a targeted intervention derived from a measured internal failure signal. The progression from coarse to fine-grained low-precision grouping similarly ties recovery to a specific error pathway. Their costs and operating regimes differ: projection rescaling changes model state; precision changes alter representation and kernels; filtering changes data. None is a universal replacement for controlled diagnosis. [R20.11], [P13]

## Limitations

[DERIVED] Complete-state recovery can restore valid continuation without identifying cause. A stable higher-precision replay can also change kernels and reduction order. The checkpoint-interval optimum assumes independent stationary faults and synchronous cost; data-triggered numerical divergence, storage contention and correlated hardware faults fall outside that approximation.

## Reproducibility

[DERIVED] The recovery ledger retains the failed branch, complete restored checkpoint, changed fields, replayed tokens/FLOPs/time, checkpoint overhead, event chronology and unresolved causes. It distinguishes confirmed numerical facts from author hypotheses and source-reported interventions from the book's proposed replay experiment. No failure injection, rollback or recovery timing has been executed for this manuscript.


## References

[P13](references.md) ? [R20.10](references.md) ? [R20.26](references.md) ? [R20.11](references.md) ? [R20.27](references.md) ? [R20.19](references.md) ? [R20.21](references.md) ? [R20.23](references.md)
