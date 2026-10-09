---
id: ms.section.31.2
entity_type: section
title: Data families
short_title: Data families
volume: 2
part: 6
chapter: 31
section: '31.2'
slug: 31-2-data-families
parent: ms.chapter.31
prev_sibling: ms.section.31.1
next_sibling: ms.section.31.3
children: []
prerequisites:
- ms.chapter.10
- ms.chapter.11
- ms.chapter.12
- ms.chapter.19
- ms.chapter.20
- ms.chapter.21
- ms.chapter.22
- ms.chapter.23
- ms.chapter.24
- ms.chapter.30
downstream:
- ms.chapter.32
- ms.chapter.33
- ms.chapter.34
- ms.chapter.35
- ms.chapter.36
- ms.chapter.39
related: []
relations: []
axes:
  lifecycle:
  - post_training
  mechanism:
  - supervised_fine_tuning
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.hugging-face-trl
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 2000
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# 31.2 — Data families

## Scope

[DERIVED] This section owns the SFT supervision contracts for instructions, dialogue, reasoning, code, tools, multimodal instructions and long-context tasks. It explains how heterogeneous records become a controlled training distribution without equating the number of examples with supervision volume. Generator design, licensing and deduplication remain canonical in Chapters 07–12; architecture remains in Chapters 13–18. The artifact is a family-level manifest carrying source, information boundary, target type, validator and sampling mass.

## Why this exists

[MATHEMATICALLY-DERIVED] A coding completion with executable tests and an unrestricted conversational answer provide different kinds of correctness evidence. A tool trajectory additionally contains actions and observations, only some of which the assistant controls. A multimodal answer may depend on visible evidence or be recoverable from text alone. Treating every record as interchangeable next-token data conceals these differences while still allowing the optimizer to reduce cross-entropy.

[DERIVED] The first operation is therefore semantic admission, before scoring difficulty or filling a token budget. Preserve the original source unit and the exact evidence available when each target was produced. A high-scoring target generated with hidden tests, future tool results or an image description withheld from deployment represents privileged supervision. It can be useful, but only after the target is revised or the conditioning mismatch is explicitly studied. Removing privileged fields from the serialized input does not make the target-generation process causal.

## Intuition

[MATHEMATICALLY-DERIVED] A mixture is an allocation of probability mass across conditional prediction problems. Under a token mean, both sampling probability and selected response length determine that allocation. Under an example mean, each admitted example gets equal outer weight but still distributes its own mass among its selected tokens. Diversity of file names, teacher prompts or reasoning wording does not establish diversity of tasks; correlation is a property of the underlying examples and generation process.

[DERIVED] Define the deployment variable first. For an instruction task, it is an answer meeting a specified contract. For code, it is an artifact satisfying compilation and independent semantic checks. For tools, it is a sequence of valid actions in observed states. For multimodal tasks, it is an answer conditioned on the actual modality. For long context, it is a relation between a target and evidence at documented positions. The common SFT objective can fit all these; it does not make their validators equivalent.

## Formulation

| Object | Required fields | Reason |
|---|---|---|
| Instruction | Instruction, allowed context, answer, validator | Separates compliance from truth |
| Multi-turn | Ordered roles, target turns, complete history | Prevents future-turn conditioning |
| Reasoning | Trace, answer, verification, generation provenance | A correct answer need not validate the trace |
| Code | Repository/input state, patch, tests, execution boundary | Hidden tests remain outside training context |
| Tool trajectory | Tool schemas, actions, observed returns, side effects | Observations are exogenous conditioning |
| Multimodal | Media identity, processor policy, text target | Reveals missing or privileged modality |
| Long-context | Evidence spans, distractors, position and length | Distinguishes retrieval from prefix imitation |

[MATHEMATICALLY-DERIVED] Let $p_k$ be the probability of choosing family $k$, and $\bar A_k$ its expected target mass. For stationary independent sampling and finite means, the long-run fraction of supervised token mass from that family is:

$$
q_k=\frac{p_k\bar A_k}{\sum_jp_j\bar A_j},\qquad p_k=\frac{q_k/\bar A_k}{\sum_jq_j/\bar A_j}.
$$
*(Eq. 31.5)*

where the inverse relation requires strictly positive target means and a desired target-mass allocation summing to one; it is a ratio-of-totals limit, not an unbiased finite-minibatch ratio.

```figure
id: fig-31.7
kind: calculator
title: Mixture mass correction
caption: Illustrative stationary families; average lengths are analytical inputs. Finite-batch mass must still be measured after rendering.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.5
alt: Adjust the declared illustrative inputs; family-one target fraction=p*a/(p*a+(1-p)*bmass), probability for equal target mass=bmass/(a+bmass). Illustrative stationary families; average lengths are analytical inputs. Finite-batch mass must still be measured after rendering.
spec:
  tex: q_1=\frac{p_1 A_1}{p_1 A_1+(1-p_1)A_2}
  equation: "31.5"
  inputs:
    - symbol: p
      label: family-one example probability
      default: 0.5
      min: 0.01
      max: 0.99
      format: fixed3
      step: 0.01
    - symbol: a
      label: family-one mean target mass
      default: 128
      min: 1
      max: 16384
      format: integer
      step: 1
    - symbol: bmass
      label: family-two mean target mass
      default: 2048
      min: 1
      max: 16384
      format: integer
      step: 1
  outputs:
    - symbol: q
      label: family-one target fraction
      formula: p*a/(p*a+(1-p)*bmass)
      format: raw
      emphasis: true
    - symbol: inv
      label: probability for equal target mass
      formula: bmass/(a+bmass)
      format: raw
      emphasis: false
anchor: formulation
states:
  - anchor: formulation
    label: Example balance
    variables:
      p: 0.5
    highlight:
      - q
    note: Equal example probability can create strongly unequal target mass.
  - anchor: mechanism
    label: Short-answer emphasis
    variables:
      p: 0.9
    highlight:
      - q
    note: Increasing the short-answer sampling probability partly compensates for length.
```

## Mechanism

### Methodology

[DERIVED] Admission begins with independent identities: source group, task group and generation group. Split by the unit that could leak the solution—repository, document, problem family or originating conversation—before selecting demonstrations. Then render and measure effective target mass, total context length and modality cost. Label reasoning traces as supplied demonstrations; a fluent trace is not a proof. Keep answer correctness and trace validity as separate fields, including “not checked”.

[DERIVED] For instruction and multi-turn data, retain constraints whose truth can be checked without the answer author's hidden state: format, required fields, turn-specific intent and information available in the prefix. For code, a passing test is evidence only for its assertions and execution environment; a patch may still overfit known tests. Tool records must retain error returns and recovery turns when these are intended behavior, with no synthetic success substituted for an actual observation. Multimodal records require a processor manifest because resizing, frame sampling or crop order changes the available evidence.

[MATHEMATICALLY-DERIVED] A finite subset can be selected under resource and coverage constraints. Let $s_i$ denote an eligible example's declared score, $c_i$ its counted training cost and $h_{ig}$ its membership in coverage group $g$. The following is an explanatory allocation problem, not a claimed globally optimal implementation of any cited paper:

$$
\max_{u\in\{0,1\}^n}\sum_i u_i s_i\quad\text{subject to}\quad\sum_i u_i c_i\le C_{\max},\qquad\sum_i u_i h_{ig}\ge f_g\ \forall g.
$$
*(Eq. 31.6)*

where coverage floors $f_g$ and a resource ceiling $C_{\max}$ are explicit editorial inputs; feasibility is checked before optimization, and scores are not benchmark test labels.

```figure
id: fig-31.8
kind: diagram
title: Family admission before selection
caption: A score cannot repair an invalid information boundary or an infeasible coverage constraint.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.6
alt: The information path is Source groups, then Available information, then Family validator, then Rendered mass, then Coverage
  constraints, then Training manifest. A score cannot repair an invalid information boundary or an infeasible coverage constraint.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: dataset
    label: Source groups
    sub: split before scoring
  - id: n1
    kind: boundary
    label: Available information
    sub: no future observations
  - id: n2
    kind: process
    label: Family validator
    sub: answer and trace separate
  - id: n3
    kind: tensor
    label: Rendered mass
    sub: targets and media cost
  - id: n4
    kind: branch
    label: Coverage constraints
    sub: retain or reject
  - id: n5
    kind: dataset
    label: Training manifest
    sub: stable identities
  edges:
  - from: n0
    to: n1
  - from: n1
    to: n2
  - from: n2
    to: n3
  - from: n3
    to: n4
  - from: n4
    to: n5
```

[MATHEMATICALLY-DERIVED] The exact mixed-integer problem can be expensive; a finite greedy procedure supplies a feasible subset when successful, but not an optimality certificate. Its score-to-cost ratio is undefined for zero cost unless zero-cost cases are handled separately. Coverage floors may conflict with a tight resource budget. Failure to extend one greedy partial selection is recorded as search exhaustion. Only an exact feasibility oracle can certify global infeasibility; neither outcome permits silently dropping the rare family or exceeding capacity.

[MATHEMATICALLY-DERIVED] For multimodal grounding, define the same target's teacher-forced loss with and without the modality. Their difference equals a log-likelihood ratio under those two conditioning contexts:

$$
\Delta_i=\mathcal L(y_i\mid x_i)-\mathcal L(y_i\mid x_i,v_i)=\frac1{r_i}\log\frac{p_\theta(y_i\mid x_i,v_i)}{p_\theta(y_i\mid x_i)}.
$$
*(Eq. 31.7)*

where both losses use the same complete response of $r_i>0$ tokens, tokenizer, model and unit-token mean; $v_i$ is the supplied modality, not a hidden answer annotation.

```figure
id: fig-31.9
kind: compare
title: Family-specific correctness contracts
caption: Validators measure different properties; do not combine their pass labels without the contract.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.6
alt: 'Comparison on What a passing demonstration actually establishes. Independent evidence: code=declared tests, tool=returned
  environment state, vision=media identity and annotations, reason=answer checker and trace checks. Unsettled by fluency:
  code=untested behavior, tool=actual side effects, vision=causal media use, reason=valid intermediate steps. Leakage unit:
  code=repository or task family, tool=trajectory and environment, vision=media/source group, reason=problem template'
spec:
  axis: What a passing demonstration actually establishes
  columns:
  - id: code
    label: Code
  - id: tool
    label: Tool use
  - id: vision
    label: Multimodal
  - id: reason
    label: Reasoning
  rows:
  - dimension: Independent evidence
    values:
      code: declared tests
      tool: returned environment state
      vision: media identity and annotations
      reason: answer checker and trace checks
  - dimension: Unsettled by fluency
    values:
      code: untested behavior
      tool: actual side effects
      vision: causal media use
      reason: valid intermediate steps
  - dimension: Leakage unit
    values:
      code: repository or task family
      tool: trajectory and environment
      vision: media/source group
      reason: problem template
```

[MATHEMATICALLY-DERIVED] A positive modality likelihood ratio does not prove that generated answers use the right pixels or frames. It may reflect a spurious correlation or an answer-bearing watermark. Conversely, a negative ratio does not alone prove a mislabeled example: a weak probe may fail to extract valid evidence. Use the statistic as a model-dependent descriptor, retain its direction and probe revision, and test grounding through controlled evidence changes separately.

## Algorithm

### Algorithm 31.2 — Feasible family-aware admission

[DERIVED] Inputs are a finite pool, immutable split map, validators, cost accounting and group floors. Outputs are a selected manifest or a structured greedy-search-exhausted report. This is book-authored pseudocode for the allocation contract; it does not claim to reproduce a particular source's selector.

$$
\begin{aligned}
1.&\quad E\leftarrow\{i:\operatorname{provenanceValid}(i)\land\operatorname{prefixValid}(i)\land\operatorname{validatorPass}(i)\}.\\
2.&\quad \operatorname{render}(E);\quad \operatorname{reject}\{i:A_i=0\ \lor\ c_i\le0\ \lor\operatorname{nonfinite}(s_i,c_i)\}.\\
3.&\quad S\leftarrow\varnothing;\quad C\leftarrow0;\quad F_g\leftarrow0.\\
4.&\quad \text{For each unmet floor, choose an admissible candidate maximizing declared }s_i/c_i.\\
5.&\quad \text{If no admissible extension exists, return search exhausted; else commit }(S,C,F).\\
6.&\quad \text{Scan remaining candidates in stable score order; add only if }C+c_i\le C_{\max}.\\
7.&\quad \operatorname{require}(F_g\ge f_g\ \forall g);\quad\operatorname{return}(S,\operatorname{hash}(S),C,F).
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] The invariant is that admitted candidates satisfy information boundaries and accumulated cost never exceeds the ceiling. The finite scan terminates; a greedy failure does not prove the original integer program infeasible, so its failure status must say “no feasible subset found by this procedure”. Sorting costs $O(n\log n)$ after descriptor evaluation; descriptor inference, media decoding and validation can dominate. No marginal score is allowed to mutate the immutable test split.

## Implementation

[DERIVED] **Hugging Face TRL**, §4 #29, Post-training / RL, is the versioned trainer boundary [R31.1]; model/processor definitions are separate dependencies. The artifact supplies the trainer already audited labels and lengths rather than treating a trainer API as a data-quality oracle. Retain source-family statistics outside packed rows so physical packing cannot erase family contribution. A multimodal collator must preserve media-to-token alignment; its target mask does not authorize cropping away the evidence needed by a surviving target.

[MATHEMATICALLY-DERIVED] The expected number of consumed selected targets and input positions after $K$ independently sampled examples is:

$$
\mathbb E[R]=K\sum_kp_k\bar A_k,\qquad\mathbb E[D_{\rm input}]=K\sum_kp_k\bar T_k.
$$
*(Eq. 31.8)*

where $\bar T_k$ counts all processed input positions; visual encoder work, descriptor generation and retries are additional costs, not hidden inside target count.

```figure
id: fig-31.10
kind: stat-panel
title: Two training denominators
caption: Illustrative family means. Target mass describes the objective; input count describes only part of training work.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.8
alt: 'Analytical readout: expected target mass=K*(p*Aone+(1-p)*Atwo), expected input tokens=K*(p*Tone+(1-p)*Ttwo). Illustrative
  family means. Target mass describes the objective; input count describes only part of training work.'
spec:
  header: TWO TRAINING DENOMINATORS
  variables:
    K: 1000
    p: 0.5
    Aone: 128
    Atwo: 2048
    Tone: 512
    Ttwo: 4096
  rows:
  - key: expected target mass
    formula: K*(p*Aone+(1-p)*Atwo)
    format: fixed3
  - key: expected input tokens
    formula: K*(p*Tone+(1-p)*Ttwo)
    format: fixed3
anchor: implementation
```

```figure
{
  "id": "fig-31.11",
  "kind": "chart",
  "title": "Sampling correction surface",
  "caption": "Both curves hold all other family properties fixed; this is an analytical mixture relation, not a quality prediction.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-31.5",
  "alt": "Analytical curves: 16x length mismatch equals x/(x+16*(1-x)), equal lengths equals x. Both curves hold all other family properties fixed; this is an analytical mixture relation, not a quality prediction.",
  "spec": {
    "type": "line",
    "x": {
      "label": "short-family example probability",
      "scale": "linear",
      "domain": [
        0.01,
        0.99
      ]
    },
    "y": {
      "label": "short-family target fraction",
      "scale": "linear",
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
    "series": [
      {
        "id": "s0",
        "label": "16x length mismatch",
        "formula": "x/(x+16*(1-x))",
        "sample": {
          "to": 0.99,
          "count": 161,
          "from": 0.01
        }
      },
      {
        "id": "s1",
        "label": "equal lengths",
        "formula": "x",
        "sample": {
          "to": 0.99,
          "count": 161,
          "from": 0.01
        }
      }
    ],
    "annotations": [
      {
        "x": 0.9411764705882353,
        "y": 0.5,
        "label": "Short examples need 16/17 sampling mass"
      }
    ]
  }
}
```

[DERIVED] Parameter bytes depend on the adaptation method, communication on placement and latency on the measured runtime. Training FLOPs cannot be inferred from Eq. 31.8 without architecture and sequence-attention accounting. Energy and money require observed device time, allocation and pricing boundaries and remain UNVERIFIED for this unexecuted recipe. Descriptor generation belongs in total adaptation cost, even when amortized across many candidate subsets.

## Experimental design

### Reported experiments

[PAPER-REPORTED] GDO computes six descriptors, then applies goal-specific feasibility controls to one image/video pool. Its video-dependence descriptor compares blind and video-conditioned losses using a frozen Qwen3-VL-8B-Instruct probe. The experiment holds a one-epoch Qwen3-VL-8B-Instruct recipe on eight H20 GPUs fixed, with global batch eight, and compares selected subsets to 512,000 uniformly selected examples on MVBench, VideoMME, MLVU and LVBench. Table 1's accuracy differences are positive but unequal; the authors identify weaker training-pool alignment for extremely long videos. Selection overhead and task-disjoint independent replication are not established here. [R31.3], §§2.1–2.4, 3.1–3.5, Appendix D.

[PAPER-REPORTED] TopoCurate selects successful tool trajectories using recovery, efficiency and diversity signals derived from merged action-observation states. Its Qwen3 experiments use Tau2-derived candidates and report BFCLv3/Tau2 comparisons and component ablations. Code/data availability is announced rather than verified in the inspected v1. [R31.4], §§4.2–4.3, 5.1–5.4, Appendix C.1–C.2.

| TopoCurate SFT protocol | Inspected disclosure, R31.4 §5/AppB.1–B.2 |
|---|---|
| Backbone/data | Qwen3-Thinking 8B/32B; roughly 3,000 candidate/2,400 selected trajectories |
| Update | Three epochs, batch 256, AdamW, weight decay .01; validation-selected LR {5e-6,7e-6}; 10% warmup/cosine |
| Evaluation | Tau2 eight repeated tests; BFCLv3; component ablations |
| Unresolved | Hardware, precision, independent training seeds/uncertainty: NOT-DISCLOSED |

## Observations

**What the paper claims.** [PAPER-REPORTED] These studies report gains from task-sensitive data selection rather than treating outcome success or uniform sampling as sufficient. [R31.3; R31.4]

**What the evidence shows.** [DERIVED] Their validation axes differ: video QA accuracy and interactive tool success are not commensurate, and neither validates arbitrary long-context instruction data.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 31.5 requires recording rendered lengths alongside sampling probabilities; selected example counts alone cannot reconstruct the learned empirical measure.

**What remains unknown.** [UNVERIFIED] Independent reproduction, selector overhead and robustness outside the disclosed pools remain unresolved.

## Failure modes

> **Failure mode — Invalid semantic quotient.** *Symptom:* state merges depend on pair iteration order. *Cause:* cosine-similarity thresholding is generally not transitive. *Detection:* a triple with $a\sim b$, $b\sim c$ but $a\not\sim c$. *Mitigation:* specify an explicit clustering rule and audit resulting merges; a threshold predicate alone does not define an equivalence relation. [MATHEMATICALLY-DERIVED]

[DERIVED] This qualification applies beside TopoCurate's state abstraction [R31.4, Eq. 3]. A closure creates an equivalence relation but can merge endpoints below threshold through a chain. It therefore changes the operational meaning and cannot inherit a preservation claim automatically. Other observable defects include duplicate repository solutions crossing splits, reasoning answers surviving without their evidence and tool success targets containing fabricated return values.

[MATHEMATICALLY-DERIVED] Its Appendix C Eq.13 also cannot establish a universal positive total-variation lower bound: a constant loss has equal expectations under distinct distributions. Eq.17 places an expert-measure expectation under a policy-to-expert KL label, reversing the required measure. Neither printed statement supplies this chapter's guarantees. These mathematical defects are separate from whether a finite selected subset improves a disclosed benchmark. The source's experimental findings do not repair an invalid proof.

## Siblings

[DERIVED] [Synthetic-data construction](../../../vol-01-learning-and-representation/part-02-data-and-representation-engineering/ch11-synthetic-data-preferences-and-interactive-trajectories/README.md) owns how targets are generated; this section owns how those target families enter SFT. [Training choices](31-4-training-choices.md) owns schedules applied after admission. Retrieval supplies context at inference rather than changing parameters and is a different adaptation route.

```figure
id: fig-31.12
kind: matrix
title: Family contract coverage
caption: 'Illustrative contract matrix: rows are instruction, code, multimodal and tool records; columns are provenance, prefix
  boundary, execution check and external evidence. Filled cells state required audit dimensions, not measured quality.'
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.6
alt: 'Each filled cell denotes an admitted relationship. Illustrative contract matrix: rows are instruction, code, multimodal
  and tool records; columns are provenance, prefix boundary, execution check and external evidence. Filled cells state required
  audit dimensions, not measured quality.'
spec:
  rows: 4
  cols: 4
  pattern: explicit
  cells:
  - - 1
    - 1
    - 0
    - 0
  - - 1
    - 1
    - 1
    - 0
  - - 1
    - 1
    - 0
    - 1
  - - 1
    - 1
    - 1
    - 1
  rowLabel: data family
  colLabel: audit dimension
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

## Extensions

### Improvements

[DERIVED] GDO's goal profiles and TopoCurate's process-sensitive selection are documented alternatives with different comparison contracts. No inspected evidence establishes a single universal selector across all seven families. Combining their descriptors would create a new unvalidated method and must be proposed separately rather than presented as a source result.

## Limitations

[MATHEMATICALLY-DERIVED] Coverage floors guarantee counts, not capability coverage or causal transfer. Probe-dependent descriptors can reproduce the probe's mistakes. A long-context sample with distant evidence need not teach retrieval if its answer is inferable from the prompt alone. Admission should record such ambiguity instead of treating length as task difficulty. This section's family taxonomy does not certify license, confidentiality or user authorization.

## Reproducibility

[DERIVED] Save family definitions, split/group hashes, validators, probe revisions, descriptor inputs, seeds, media preprocessing, selected/rejected identities, target masses and resource ceilings. Keep actual source experiments above separate from the unexecuted proposed mixture study in [verification](verification.md). A missing field remains missing; no brand name supplies it.

## References

[R31.1] Tagged trainer boundary. [R31.3] GDO v1, method, experiments and limitations. [R31.4] TopoCurate v1, trajectory selection and state abstraction. All inspected 2026-10-09; full identities in [references](references.md).
