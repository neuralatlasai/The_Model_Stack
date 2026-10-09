---
id: ms.section.31.3
entity_type: section
title: Conversation semantics
short_title: Conversation semantics
volume: 2
part: 6
chapter: 31
section: '31.3'
slug: 31-3-conversation-semantics
parent: ms.chapter.31
prev_sibling: ms.section.31.2
next_sibling: ms.section.31.4
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

# 31.3 — Conversation semantics

## Scope

[DERIVED] This section owns the training semantics of roles, context, assistant targets, tool observations, truncation and packed examples. Serialization syntax belongs to Chapter 10; here the concern is the conditional distribution induced after serialization. The output is a fixture suite mapping each token to its source event, target status, position and legal predecessors. A fixture passes only if model inputs, target masks and information boundaries agree.

## Why this exists

[MATHEMATICALLY-DERIVED] A language model is trained on token identifiers, not the author's intended role names. If a system instruction is rendered as ordinary text, its behavior depends on the template and learned context. If a tool return is placed inside an assistant target span, the objective teaches the assistant to emit observations. If two conversations are packed behind a single causal mask, the second can condition on the first even when its target mask is otherwise correct. All three changes alter the learning problem without necessarily raising a parser error.

[DERIVED] Review therefore begins with the rendered fixture, including special-token identifiers and terminal markers. Inspecting raw JSON is insufficient because rendering can add headers, remove empty turns, normalize tool-call syntax or assign generation spans. Training and inference templates must agree on the prefix at which the assistant begins producing a response. A training prefix ending after the complete answer header and an inference prefix ending before it create a distribution mismatch that must be measured, not described as harmless formatting.

## Intuition

[MATHEMATICALLY-DERIVED] Role and source are separate attributes. An assistant can produce a tool-call request, while the result comes from an environment. A system message can be available conditioning without being a target. Earlier assistant turns can be context for a later target even when their own losses are disabled. Causal visibility specifies what a prediction can read; supervision specifies which predictions influence the update. Neither can stand in for the other.

[MATHEMATICALLY-DERIVED] Packing independent examples is an execution transformation only if each prediction sees exactly the context it would have seen when evaluated separately, its positional semantics are preserved and its loss weight is unchanged. Appending an EOS token does not mathematically block attention. Resetting position identifiers does not itself impose an attention mask. The attention backend must interpret the sequence-boundary metadata consistently with the declared block-causal relation.

## Formulation

| Symbol | Meaning | Contract |
|---|---|---|
| $e_t$ | Source event of rendered token $t$ | Role, turn, source example |
| $s_t$ | Packed-example identity | Integer, immutable |
| $a_t$ | Assistant-generation span indicator | Binary template output |
| $c_t$ | Selected completion-region indicator | Binary policy output |
| $v_t$ | Valid rendered token indicator | Padding excluded |
| $m_t$ | Final target indicator | Applies to the predicted token, after alignment |

[MATHEMATICALLY-DERIVED] For a policy combining assistant-only and completion-only selection, the noninitial target mask is an intersection, not a union:

$$
m_t=v_ta_tc_t\,\mathbf1[s_{t-1}=s_t],\qquad t\ge2;\qquad m_1=0.
$$
*(Eq. 31.9)*

where the example-start condition excludes an artificial cross-example next-token prediction; a policy without a completion restriction sets $c_t=1$ on valid positions.

```figure
id: fig-31.13
kind: diagram
title: Conversation event provenance
caption: A tool request belongs to assistant generation; the observed tool result remains externally supplied conditioning.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.9
alt: The information path is System and user, then Assistant action, then Environment execution, then Tool observation, then
  Assistant continuation. A tool request belongs to assistant generation; the observed tool result remains externally supplied
  conditioning.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: state
    label: System and user
    sub: conditioning events
  - id: n1
    kind: model
    label: Assistant action
    sub: generated tool request
  - id: n2
    kind: boundary
    label: Environment execution
    sub: external state transition
  - id: n3
    kind: state
    label: Tool observation
    sub: exogenous returned value
  - id: n4
    kind: model
    label: Assistant continuation
    sub: conditional target
  edges:
  - from: n0
    to: n1
  - from: n1
    to: n2
  - from: n2
    to: n3
  - from: n3
    to: n4
```

## Mechanism

### Methodology

[DERIVED] First define the role/event grammar, including whether assistant headers, reasoning delimiters, call arguments and end-of-turn markers are selected targets. The choice is part of the artifact; there is no universal target convention. Then render each complete fixture through the exact tokenizer/template/processor and retain offsets from source events to tokens. Tokenization is not generally additive across text boundaries, so constructing a completion mask from separately tokenized string lengths requires an explicit prefix-match check.

[MATHEMATICALLY-DERIVED] For teacher forcing, a logit at input position $t-1$ predicts token $t$. The target mask must move with the target, not with the logit position's role. This creates a consequential boundary case: the final user/context token often predicts the first assistant token. Masking the logit because its input token was “user” incorrectly removes a valid response target. Conversely, masking only the first assistant input position can leave a tool observation supervised one step earlier. Offset fixtures settle this without relying on intuitive role labels.

[DERIVED] Multi-turn supervision can target all assistant turns, only the final turn, or a declared subset. All earlier admissible turns remain in the prefix unless a context policy explicitly drops them. If a later turn corrects an earlier answer, training the earlier answer as an unconditional gold target is a data-policy decision, not automatically a valid correction procedure. For tool episodes, include errors and user confirmations as events with their true order. Do not convert an environment failure into assistant-generated success text to obtain a complete trajectory.

[MATHEMATICALLY-DERIVED] The independent-example attention relation is:

$$
\mathcal A_{ij}=\mathbf1[s_i=s_j]\mathbf1[j\le i],\qquad \operatorname{pos}(i)=i-\operatorname{start}(s_i).
$$
*(Eq. 31.10)*

where $i$ and $j$ index packed query/key positions; this is block-causal attention for independent examples, with per-example position reset under the chosen positional convention.

```figure
id: fig-31.14
kind: matrix
title: Block-causal packing contract
caption: Two independent three-token examples. The second query block cannot read the first key block even though the tokens
  share physical storage.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.10
alt: Each filled cell denotes an admitted relationship. Two independent three-token examples. The second query block cannot
  read the first key block even though the tokens share physical storage.
spec:
  rows: 6
  cols: 6
  pattern: explicit
  cells:
  - - 1
    - 0
    - 0
    - 0
    - 0
    - 0
  - - 1
    - 1
    - 0
    - 0
    - 0
    - 0
  - - 1
    - 1
    - 1
    - 0
    - 0
    - 0
  - - 0
    - 0
    - 0
    - 1
    - 0
    - 0
  - - 0
    - 0
    - 0
    - 1
    - 1
    - 0
  - - 0
    - 0
    - 0
    - 1
    - 1
    - 1
  rowLabel: packed query i
  colLabel: packed key j
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

[MATHEMATICALLY-DERIVED] When each example has $T_i$ tokens, independent causal attention admits a sum of triangular pair counts. A single unsegmented causal stream adds cross-example pairs. That addition is both extra arithmetic and extra information; a faster implementation of the wrong relation is not a packing optimization.

$$
P_{\rm independent}=\sum_i\frac{T_i(T_i+1)}2,\qquad P_{\rm concatenated}-P_{\rm independent}=\sum_{i<j}T_iT_j.
$$
*(Eq. 31.11)*

where counts include diagonal query/key pairs, exclude padding and assume full causal attention inside each example; FLOPs require multiplying by the architecture-specific operation cost.

```figure
id: fig-31.15
kind: calculator
title: Forbidden cross-example attention
caption: Two independent illustrative examples. These are attention pair counts, not model FLOPs or measured latency.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.11
alt: Adjust the declared illustrative inputs; forbidden query-key pairs=t1*t2, independent causal pairs=t1*(t1+1)/2+t2*(t2+1)/2.
  Two independent illustrative examples. These are attention pair counts, not model FLOPs or measured latency.
spec:
  tex: P_{\rm cross}=T_1T_2
  equation: '31.11'
  inputs:
  - symbol: t1
    label: tokens in first example
    default: 1024
    min: 1
    max: 32768
    format: integer
    step: 1
  - symbol: t2
    label: tokens in second example
    default: 2048
    min: 1
    max: 32768
    format: integer
    step: 1
  outputs:
  - symbol: cross
    label: forbidden query-key pairs
    formula: t1*t2
    format: fixed3
    emphasis: true
  - symbol: legal
    label: independent causal pairs
    formula: t1*(t1+1)/2+t2*(t2+1)/2
    format: fixed3
    emphasis: false
anchor: formulation
states:
- anchor: formulation
  label: Two examples
  variables:
    t1: 1024
    t2: 2048
  highlight:
  - cross
  note: Cross-example pairs have no role in the independent training objective.
- anchor: mechanism
  label: Long second example
  variables:
    t2: 8192
  highlight:
  - cross
  - legal
  note: A larger packed stream magnifies both legal and forbidden work.
```

[DERIVED] Truncation must be defined as a semantic transformation. Prefix truncation can remove the system policy or a needed tool observation. Suffix truncation can retain reasoning without an answer or remove a termination target. Window extraction can leave a tool result without its request or a media placeholder without its payload. The artifact must declare whether partial completions are permitted and which dependent event groups are atomic. When required groups cannot fit, rejecting the example is an honest outcome; synthetic missing prefixes are a different dataset.

[MATHEMATICALLY-DERIVED] The number of supervised targets surviving a truncation window $[u,v]$ is not its length. It is the sum of aligned original target indicators after checking semantic closure:

$$
R_{[u,v]}=\sum_{t=u}^{v}m_t\,\mathbf1[\operatorname{requiredContext}(t)\subseteq[u,v]],\qquad 0\le R_{[u,v]}\le v-u+1.
$$
*(Eq. 31.12)*

where the predicate is defined by the event contract; dependence can include media payloads and external observations, not only text-token offsets.

```figure
id: fig-31.16
kind: compare
title: Truncation policies
caption: No policy preserves the original task automatically; the surviving target set must be measured after transformation.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.12
alt: 'Comparison on Which information boundary changes. Primary risk: left=lost constraints or observations, right=lost answer
  or termination, event=fewer admitted targets. Required audit: left=remaining context sufficiency, right=partial-target policy,
  event=closure and rejection rate. Target count: left=recompute, right=recompute, event=recompute'
spec:
  axis: Which information boundary changes
  columns:
  - id: left
    label: Drop old prefix
  - id: right
    label: Drop suffix
  - id: event
    label: Keep complete event groups
  rows:
  - dimension: Primary risk
    values:
      left: lost constraints or observations
      right: lost answer or termination
      event: fewer admitted targets
  - dimension: Required audit
    values:
      left: remaining context sufficiency
      right: partial-target policy
      event: closure and rejection rate
  - dimension: Target count
    values:
      left: recompute
      right: recompute
      event: recompute
```

## Algorithm

### Algorithm 31.3 — Render, align and pack with fixtures

[DERIVED] Inputs are finite event sequences, template/tokenizer revisions, semantic truncation policy and maximum packed length. Outputs are tokens, labels, block boundaries, positions and provenance; failures carry the source identifier. Template generation spans are authoritative only after fixture inspection.

$$
\begin{aligned}
1.&\quad (z,e,a,c,v)\leftarrow\operatorname{RenderWithOffsets}(\text{events});\quad\operatorname{checkPrefixFixtures}(z,e).\\
2.&\quad (z,e,a,c,v)\leftarrow\operatorname{SemanticWindow}(z,e,a,c,v);\quad\operatorname{checkClosure}(e).\\
3.&\quad m\leftarrow\operatorname{ShiftAlignedIntersection}(a,c,v);\quad\operatorname{require}(\sum_t m_t>0).\\
4.&\quad \text{Pack complete admitted examples; assign immutable }s_t\text{ and local positions}.\\
5.&\quad \mathcal A\leftarrow\operatorname{BlockCausal}(s);\quad m_{\operatorname{start}(s)}\leftarrow0.\\
6.&\quad \operatorname{assert}(\text{packed and separate legal prefixes match for every selected target}).\\
7.&\quad \operatorname{return}(z,m,\mathcal A,\operatorname{pos},e,\operatorname{hash}(\text{policies})).
\end{aligned}
$$

[MATHEMATICALLY-DERIVED] Each packing insertion preserves example identity, context relation and target mass. A finite first-fit scan terminates; its utilization is a heuristic, not an optimal bin-packing certificate. Token/event bookkeeping is linear in rendered positions once examples are ordered. Materializing a dense attention matrix costs quadratic storage, but a backend can encode the same relation using cumulative sequence lengths; that representation must be validated against the relation rather than inferred from its name.

## Implementation

[OFFICIAL-DOCUMENTATION] **Hugging Face TRL**, §4 #29, Post-training / RL, requires generation markers for assistant-only templates and documents their family-specific patching. The v1.13.0 padding-free collator resets positions and masks sequence starts; its implementation explicitly cautions against an all-ones attention mask that defeats the intended boundary metadata. [R31.1], tagged docs assistant-only warning; tagged code `DataCollatorForLanguageModeling.torch_call` and `get_position_ids_from_packed_seq_lengths`. The contract above remains stricter than assuming every backend consumes that metadata correctly.

[MATHEMATICALLY-DERIVED] Masks and positions require $O(\sum_iT_i)$ bookkeeping; the backbone's memory and arithmetic remain architecture dependent. Packing can reduce padded positions, but target-count-normalized training must keep the same logical measure. Communication of loss statistics is unchanged except for different local masses. Latency, energy and monetary savings are UNVERIFIED without matched packed/separate execution; utilization alone is not end-to-end throughput.

```figure
id: fig-31.17
kind: stat-panel
title: Two-example boundary ledger
caption: Illustrative all-token selection before role restrictions. Each independent sequence contributes no target at its
  first position.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-31.9
alt: 'Analytical readout: processed positions=Tfirst+Tsecond, excluded sequence starts=2, maximum shifted targets=Tfirst+Tsecond-2.
  Illustrative all-token selection before role restrictions. Each independent sequence contributes no target at its first
  position.'
spec:
  header: TWO-EXAMPLE BOUNDARY LEDGER
  variables:
    Tfirst: 1024
    Tsecond: 2048
  rows:
  - key: processed positions
    formula: Tfirst+Tsecond
    format: fixed3
  - key: excluded sequence starts
    formula: '2'
    format: fixed3
  - key: maximum shifted targets
    formula: Tfirst+Tsecond-2
    format: fixed3
anchor: implementation
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] OpenAgent perturbs tool names, descriptions, observations and dependency rules. Reported SFT failures under changed feedback and rigid invocation patterns do not establish that SFT intrinsically cannot ground tool semantics. This is a controlled sandbox diagnostic; deployment shift frequency and independent reproduction remain unresolved. [R31.5], §§3–6, Appendices A–D.

| OpenAgent protocol | Inspected disclosure, R31.5 AppA.4/B/C/D |
|---|---|
| Model/workload | Qwen2.5-7B-Instruct; disjoint anonymized POI entities, 6,050 train/880 test |
| SFT | Full tuning, AdamW, LR 3e-5, batch 2, 800 steps; checkpoints each 200 |
| Evaluation | Temperature 0/top-p 1; tool perturbations; accuracy/average call length |
| Unresolved | Hardware, precision, repeated training seeds: NOT-DISCLOSED |

[DERIVED] The source studies behavioral shifts rather than packed/unpacked numerical parity. The latter remains the unexecuted fixture/gradient protocol in [verification](verification.md); source behavioral evidence cannot substitute for a backend attention-boundary test.

## Observations

**What the paper claims.** [PAPER-REPORTED] The disclosed sandbox reveals fragility of static tool training under controlled shifts. [R31.5]

**What the evidence shows.** [DERIVED] Tool feedback and schema changes are concrete evaluation axes; the causal explanation remains limited by the source's training controls and environment.

**What we infer.** [MATHEMATICALLY-DERIVED] An observation supervised as assistant output changes the event distribution being learned, independently of any empirical claim about downstream failure rates.

**What remains unknown.** [UNVERIFIED] Production shift rates and packed-backend numerical equivalence for this recipe have not been measured.

## Failure modes

> **Failure mode — Observation imitation.** *Symptom:* the assistant prints a successful tool return without execution. *Cause:* environment events were included as assistant targets or valid histories lacked failures. *Detection:* token/event provenance plus an execution-required evaluation. *Mitigation:* correct target ownership and independently check returned state. [DERIVED]

> **Failure mode — Packed cross-talk.** *Symptom:* changing an unrelated earlier packed example changes later-example logits beyond tolerance. *Cause:* backend ignores boundaries. *Detection:* compare separate and packed logits with dropout disabled. *Mitigation:* repair the attention representation before accepting throughput. [MATHEMATICALLY-DERIVED]

## Siblings

[DERIVED] [Serialization](../../../vol-01-learning-and-representation/part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/README.md) owns interface encoding; this section owns its supervised semantics. [SFT objectives](31-1-sft-objectives.md) owns normalization; [data families](31-2-data-families.md) owns family admission. A larger context window changes capacity, not the validity of the preserved events.

```figure
{
  "id": "fig-31.18",
  "kind": "chart",
  "title": "Cross-talk growth",
  "caption": "The forbidden cross-block term grows with both example lengths; this is a counting identity, not an observed degradation curve. Sampled sequence lengths are integers; dots are admissible configurations, not measured attention traffic.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-31.11",
  "alt": "Analytical curves: first example 1024 tokens equals 1024*x, first example 2048 tokens equals 2048*x. The forbidden cross-block term grows with both example lengths; this is a counting identity, not an observed degradation curve.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "second example length",
      "scale": "linear",
      "domain": [
        1,
        8191
      ]
    },
    "y": {
      "label": "forbidden attention pairs",
      "scale": "linear"
    },
    "series": [
      {
        "id": "s0",
        "label": "first example 1024 tokens",
        "formula": "1024*x",
        "sample": {
          "to": 8191,
          "count": 274,
          "from": 1
        }
      },
      {
        "id": "s1",
        "label": "first example 2048 tokens",
        "formula": "2048*x",
        "sample": {
          "to": 8191,
          "count": 274,
          "from": 1
        }
      }
    ],
    "annotations": [
      {
        "x": 4096,
        "y": 8388608,
        "label": "8,388,608 forbidden pairs at this configuration"
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The inspected 2026 tool study supplies a perturbation intervention, whereas the tagged trainer supplies boundary-aware collation. They act at different levels: behavioral coverage and execution representation. Combining them does not establish a stronger measured result. Multimodal packing additionally requires each media payload to remain bound to its placeholder and processor coordinates; if that binding is unsupported, the admissible implementation is separate examples.

## Limitations

[MATHEMATICALLY-DERIVED] Perfect fixture parity establishes the intended supervised conditional computation on those inputs. It does not prove instruction compliance on new prompts, authenticate tool returns or grant authority for side effects. Floating-point parity also requires a tolerance matched to dtype and reduction changes. Exact bitwise equality is a different requirement and may reject mathematically equivalent implementations.

## Reproducibility

[DERIVED] Archive fixtures containing empty assistant spans, multi-token boundaries, multiple tool calls, failed tools, long prefixes, media placeholders and sequence starts. Retain both human-readable events and integer token arrays. Record training/inference template differences and target-count deltas after truncation. Every expected rejection is part of the fixture suite rather than an omitted sample.

## References

[R31.1] TRL v1.13.0 docs and collator. [R31.5] OpenAgent v1 controlled interaction shifts. Detailed access/version records are in [references](references.md).
