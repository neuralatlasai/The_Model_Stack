---
id: "ms.section.39.2"
entity_type: "section"
title: "39.2 — Information access"
short_title: "39.2 — Information access"
volume: 2
part: 7
chapter: 39
section: 39.2
slug: "39-2-information-access"
parent: "ms.chapter.39"
prev_sibling: "ms.section.39.1"
next_sibling: "ms.section.39.3"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.37", "ms.chapter.38"]
downstream: ["ms.chapter.40", "ms.chapter.41", "ms.chapter.42", "ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "adaptation", "inference"], "mechanism": ["distillation", "distribution_matching"], "feedback_setting": ["ai_feedback", "verifiable_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: ["impl.pytorch", "impl.megatron-lm", "impl.verl", "impl.vllm", "impl.sglang"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2200
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 39.2 — Information access

## Scope

[DERIVED] Specify the supervision available to a student when the teacher exposes complete logits, selected probabilities, generated text or hidden features. The baseline is full-vocabulary conditional KL on aligned tokens. Success means an explicit statement of which loss can be computed from the available interface, what approximation remains and which information is irrecoverably absent. This section owns interface and memory contracts; response quality and trajectory distribution follow in §§39.3–39.4.

## Why this exists

[DERIVED] Teacher memory and output tensors can exceed the student's own training footprint. For $B$ sequences of $T$ tokens and vocabulary $V$, one dense output tensor contains $BTV$ values before gradients, probabilities or temporary buffers are counted. Reducing teacher access can remove repeated computation, but it can also change the learning problem. Saving a top-k vector without its original normalizer silently converts a partial measure into a conditional distribution if it is renormalized on read.

[PAPER-REPORTED] The August2026 offline study caches the teacher's top100 probabilities and implements a loss that keeps their original submass [R39.1, §3]. DeepSeek-V4 instead reports caching the teacher's last hidden state and reconstructing complete logits through its output head [R39.8, §5.2.2]. OPCD evaluates a reverse-KL approximation on the student's top256 tokens [R39.6, Appendix A.3]. The subset owner, retained normalizer and direction are consequential differences.

## Intuition

[MATHEMATICALLY-DERIVED] A top-k set is a partition of the vocabulary into individually observed tokens and an unobserved tail. If total tail probability is known, it supports an exact **coarsened** categorical KL, with one aggregate tail event. It does not reveal how that tail mass is distributed. If the retained mass is kept without adding a tail bucket, the resulting expression is not a normalized KL. If it is renormalized, the loss describes a teacher conditioned on the retained event.

## Formulation

> **Definition — Retained teacher submass.** [DERIVED] The sum of original teacher probabilities on the selected token set, before any renormalization; it lies between zero and one.

[MATHEMATICALLY-DERIVED] Let $S_K$ be the teacher-selected subset, $M=\sum_{v\in S_K}p_v\in[0,1]$, $Q=\sum_{v\in S_K}q_v$ and $\tilde p_v=p_v/M$ when $M>0$. The inspected sparse objective is

$$
\begin{aligned}
L_{\rm sparse}&=\sum_{v\in S_K}p_v\log p_v-\sum_{v\in S_K}p_vz_v+M\log\sum_{u\in V}e^{z_u}\\
&=M\operatorname{KL}(\tilde p\Vert q)+M\log M,\qquad
\frac{\partial L_{\rm sparse}}{\partial z_v}=Mq_v-p_v\mathbf1\{v\in S_K\}.
\end{aligned}
$$
*(Eq. 39.4)*

where $\tilde p$ is embedded in the full vocabulary with zero tail, and $z$ is a temperature-one student logit vector. A shared-temperature version introduces the scaling from Eq.39.2. The identity explains negative values: when $q=\tilde p$, the objective is $M\log M<0$ for $0<M<1$. It also explains why positions with different retained mass have different gradient weight. At $M=0$, the sparse objective and gradient are zero; the conditional distribution is undefined.


```figure
id: fig-39.7
kind: calculator
title: Sparse submass changes both loss and weight
caption: The student is a two-event law. Retained teacher mass M occupies the first event; the sparse loss can be negative even at its optimum.
placement: rail
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-39.4
alt: The student is a two-event law. Retained teacher mass M occupies the first event; the sparse loss can be negative even at its optimum.
spec:
  tex: L=M\log(M/q),\quad \partial_z L=M(q-1)
  equation: "39.4"
  inputs:
    - symbol: M
      label: Retained teacher mass
      default: 0.8
      min: 0.01
      max: 1
      step: 0.01
      scale: linear
      format: raw
    - symbol: q
      label: Student retained-event mass
      default: 0.7
      min: 0.01
      max: 0.99
      step: 0.01
      scale: linear
      format: raw
  outputs:
    - symbol: loss
      label: Sparse objective
      formula: M*ln(M/q)
      format: fixed3
    - symbol: grad
      label: First-logit gradient
      formula: M*(q-1)
      format: raw
    - symbol: floor
      label: Sparse optimum value
      formula: M*ln(M)
      format: fixed3
```


[MATHEMATICALLY-DERIVED] With teacher and student tail masses available, coarsening gives

$$
\begin{aligned}
D_{\rm coarse}&=\sum_{v\in S_K}p_v\log\frac{p_v}{q_v}+(1-M)\log\frac{1-M}{1-Q},\\
D_{\rm full}&=D_{\rm coarse}+(1-M)\operatorname{KL}(p_{\rm tail}\Vert q_{\rm tail})\ \geq D_{\rm coarse}.
\end{aligned}
$$
*(Eq. 39.5)*

where $p_{\rm tail},q_{\rm tail}$ are conditional distributions on the omitted set. The decomposition follows by factoring each tail probability into its mass and conditional law. Boundary cases use $0\log0=0$ and the usual infinite divergence for positive mass over zero. The missing conditional tail KL cannot be reconstructed from aggregate masses. Tail-bucket supervision and Eq.39.4 therefore remain different objectives even with the same $K$.

## Mechanism

### Methodology

[PAPER-REPORTED] The offline method first runs a fixed teacher over a fixed, tokenized training corpus, storing selected token IDs and their original probabilities at each target position. Student training then reads that cache without running the teacher [R39.1, §3]. A meaningful cache key includes teacher/checkpoint, tokenizer, exact preceding tokens, attention/packing boundaries, target shift, temperature and selected-token rule. Token IDs by themselves are insufficient. Changing the packing mask changes the prefix law and invalidates teacher–student equivalence even when target text matches.

[MATHEMATICALLY-DERIVED] A vocabulary remapping requires a shared measurable event. For a bijective one-token map $f$, probabilities can be permuted. If teacher tokens map to multiple student tokens, the teacher's next-token marginal is not a student next-token law. A valid text-level transfer must sum teacher probabilities over tokenizations of the same string event and condition consistently on the shared text prefix. Generated text followed by student retokenization avoids pretending such sums were computed, but produces response imitation instead of exact logit distillation. Feature access similarly requires coordinate and token correspondence; a black-box API returning text cannot support an exact feature or complete-logit loss.


```figure
{
  "id": "fig-39.8",
  "kind": "compare",
  "title": "What each teacher interface identifies",
  "caption": "A black-box response API does not provide exact logit or representation distillation. Each access contract determines which loss is computable.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.1",
  "alt": "A black-box response API does not provide exact logit or representation distillation. Each access contract determines which loss is computable.",
  "spec": {
    "axis": "Compare recoverable targets at one aligned prefix",
    "columns": [
      {
        "id": "full",
        "label": "Full law"
      },
      {
        "id": "top",
        "label": "Top-k and tail"
      },
      {
        "id": "text",
        "label": "Generated text"
      },
      {
        "id": "feat",
        "label": "Features"
      }
    ],
    "rows": [
      {
        "dimension": "Identifies",
        "values": {
          "full": "Every local probability",
          "top": "Selected probabilities and tail mass",
          "text": "Sampled token sequence",
          "feat": "Disclosed hidden coordinates"
        }
      },
      {
        "dimension": "Does not identify",
        "values": {
          "full": "Truth or sequence occupancy",
          "top": "Conditional tail distribution",
          "text": "Unobserved alternatives",
          "feat": "Output probabilities without head"
        }
      },
      {
        "dimension": "Alignment",
        "values": {
          "full": "Vocabulary and prefix",
          "top": "Vocabulary, set and normalizer",
          "text": "Text and retokenization",
          "feat": "Layer, token and width map"
        }
      }
    ]
  }
}
```


```figure
{
  "id": "fig-39.9",
  "kind": "diagram",
  "title": "The complete normalizer survives sparse targets",
  "caption": "Teacher targets are sparse, but the student normalizer still spans every vocabulary shard. Original retained teacher mass scales the student gradient.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.4",
  "alt": "Teacher targets are sparse, but the student normalizer still spans every vocabulary shard. Original retained teacher mass scales the student gradient.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "x",
        "kind": "tensor",
        "label": "Student hidden states"
      },
      {
        "id": "w",
        "kind": "model",
        "label": "Vocabulary-sharded head"
      },
      {
        "id": "norm",
        "kind": "process",
        "label": "Global max then exponential sum"
      },
      {
        "id": "cache",
        "kind": "memory",
        "label": "Original teacher IDs and probabilities"
      },
      {
        "id": "loss",
        "kind": "objective",
        "label": "Sparse entropy minus cross term"
      },
      {
        "id": "grad",
        "kind": "tensor",
        "label": "Mass-weighted student gradient"
      }
    ],
    "edges": [
      {
        "from": "x",
        "to": "norm"
      },
      {
        "from": "w",
        "to": "norm"
      },
      {
        "from": "norm",
        "to": "loss"
      },
      {
        "from": "cache",
        "to": "loss"
      },
      {
        "from": "loss",
        "to": "grad"
      }
    ]
  }
}
```


[PAPER-REPORTED] The pinned CompactifAI implementation performs two output-projection loops in forward and one recomputation loop in backward [R39.1, associated code `full_chunked.py`, SHA in references]. First it computes a globally stable log-normalizer over vocabulary chunks. Second it recomputes chunk logits, gathers sparse teacher terms and accumulates the loss. Backward recomputes chunks again to form $Mq-p$ and output-head/hidden gradients. Tensor-parallel normalization requires global maximum **before** exponentiation and global sum afterward. The paper's high-level “extra projection” wording is not substituted for this inspected execution order.

[DERIVED] Chunking reduces workspace but not output-head arithmetic to zero. At fixed hidden width $d$, projecting all target positions costs $O(BTdV)$ each pass; output-weight gradient storage can remain $O(dV)$, and the final hidden state remains $O(BTd)$. Sequence-parallel gather/reduce-scatter and tensor-parallel normalizer/gradient reductions add communication. Fusing a loss does not remove the student's attention, optimizer, teacher-cache construction or data loading.

## Algorithm

**Algorithm 39.2 — Sparse teacher loss with a complete student normalizer.** [DERIVED] Inputs are $X\in\mathbb R^{n\times d}$, vocabulary-sharded output weights $W$, selected IDs/probabilities and positive integer token-chunk size $C$. Output is loss and gradients under Eq.39.4, or CACHE/NUMERICAL failure. The procedure reconstructs the pinned method's phases without claiming kernel execution.

$$
\begin{aligned}
1.&\quad \text{Validate unique selected IDs, finite logits/masses, }0\leq M_i\leq1,\ n>0,\ C\in\mathbb N_{>0}.\\
2.&\quad \text{Require a disjoint complete vocabulary-shard manifest and matching cache/prefix hashes.}\\
3.&\quad \text{For each token chunk }I:\ z_{I,V_{\rm local}}\leftarrow X_IW^\top;\ \text{retain this chunk temporarily.}\\
4.&\quad a_i\leftarrow\operatorname{AllReduceMax}\max_{v\in V_{\rm local}}z_{iv};\quad
s_i\leftarrow\operatorname{AllReduceSum}\sum_{v\in V_{\rm local}}e^{z_{iv}-a_i}.\\
5.&\quad \text{Reject nonfinite }a_i\text{ or nonpositive/nonfinite }s_i;\ \ell_i\leftarrow a_i+\log s_i;\ \text{discard chunk logits.}\\
6.&\quad \text{Second token-chunk pass: reproject; accumulate shard-local }H_i,G_i,M_i\text{ once, then sum across shards.}\\
7.&\quad L\leftarrow n^{-1}\sum_i(H_i-G_i+M_i\ell_i);\quad M_i=0\Rightarrow L_i=0.\\
8.&\quad \text{Third projection pass in backward: }E_{iv}\leftarrow n^{-1}(M_ie^{z_{iv}-\ell_i}-p_{iv}\mathbf1_{S_i}).\\
9.&\quad \nabla W\leftarrow\sum_I E_I^\top X_I;\quad\nabla X_I\leftarrow E_IW;\quad\text{reduce as layout requires.}
\end{aligned}
$$

[DERIVED] Invariants are full-vocabulary student normalization, unchanged cached teacher masses and no duplicate shard contribution. Real implementations can combine running maxima/sums differently; this aligned procedure specifies the mathematical dependence. The actual pinned code chunks sequence positions while retaining each local vocabulary chunk-buffer until its global maximum is known; it does not need an additional normalizer projection. All loops are bounded by $\lceil n/C\rceil$ and the finite shard count. Gradients are committed only after all chunks and collectives complete successfully; partial gradients are discarded on failure. Selected cache data must have $O(nK)$ entries, not arbitrary ragged IDs without a mask.

## Implementation

[MATHEMATICALLY-DERIVED] One dense output buffer is $bBTV$ bytes. A sparse cache with $b_p$ probability bytes and $b_i$ index bytes is $(b_p+b_i)BTK$, excluding headers and compression. A chunk workspace is approximately $bBCV$, while saved hidden states cost $bBTd$; persistent head weights and gradients contribute $O(bdV)$ independently of sequence length. These terms describe a boundary, not a complete peak-memory predictor:

$$
M_{\rm dense}=bBTV,\qquad M_{\rm cache}=(b_p+b_i)BTK,\qquad
M_{\rm work}=bBCV+bBTd.
$$
*(Eq. 39.6)*

where $C$ is a chunk of token positions, as in Algorithm39.2; each implementation's chunk axis must be stated. Both dense and chunked forms remain linear in $T$ at fixed other dimensions. The improvement is a coefficient and residency change, not a change from quadratic to linear output memory.


```figure
{
  "id": "fig-39.10",
  "kind": "memory-stack",
  "title": "Output-memory boundary",
  "caption": "Illustrative dimensions B=1, T=32768, V=131072, d=4096, token chunk C=4096 and two bytes/value. These are analytical buffer terms, not peak device measurements.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.6",
  "alt": "Illustrative dimensions B=1, T=32768, V=131072, d=4096, token chunk C=4096 and two bytes/value. These are analytical buffer terms, not peak device measurements.",
  "spec": {
    "format": "bytes",
    "variables": {
      "B": 1,
      "T": 32768,
      "V": 131072,
      "d": 4096,
      "C": 4096,
      "b": 2
    },
    "bars": [
      {
        "label": "Dense output",
        "segments": [
          {
            "label": "Output buffer",
            "formula": "b*B*T*V"
          }
        ]
      },
      {
        "label": "Chunked boundary",
        "segments": [
          {
            "label": "Chunk output",
            "formula": "b*B*C*V"
          },
          {
            "label": "Saved hidden state",
            "formula": "b*B*T*d"
          }
        ]
      }
    ]
  }
}
```


[PAPER-REPORTED] DeepSeek-V4 retains full-vocabulary OPD using CPU/distributed-storage teacher offload, last-hidden-state caching, teacher-index ordering and one resident teacher head per minibatch [R39.8, §5.2.2]. Reconstructing logits requires a hidden-state–head multiplication and data movement. “Negligible” source overhead is a claim about its system, with isolated timing and overlap conditions NOT-DISCLOSED, not zero teacher cost. OPCD's student-top256 approximation has undisclosed tail normalization; it cannot be relabeled exact full-vocabulary reverse KL [R39.6, Appendix A.3].

## Experimental design

### Reported experiments

| Boundary | Disclosed protocol [R39.1, §4; Appendices A–B] |
|---|---|
| End-to-end online/offline | Llama3.1-8B-Instruct teacher, compressed 3B student; 8192-token SmolTalk workload; one H200; BF16 with FP32 reductions |
| Training profile | Global batch32/microbatch1; Adam(.9,.999,$10^{-8}$), decay.1, clip1; LR $2\cdot10^{-6}$ to $2\cdot10^{-7}$; seed1234 |
| Timing boundary | Fifteen profile iterations; Nsight iterations10–13; cached-teacher construction excluded from per-iteration comparison |
| Output-head toy | Hidden4096, vocabulary131072, batch1, TP2, H200; chunk4096; deterministic inputs, fresh process per configuration; no attention/optimizer/teacher |
| Versions/uncertainty | NGC PyTorch26.01, Transformers4.57.6, Megatron-Bridge.3.0; multi-seed quality uncertainty NOT-DISCLOSED |

## Observations

**What the paper claims.** [PAPER-REPORTED] Caching removes repeated teacher execution, and fused chunking permits longer contexts [R39.1, §§3–4].

**What the evidence shows.** [PAPER-REPORTED] The 8K end-to-end profile reports103→78GB and25.9→18.5seconds per iteration, with near-identical **training loss**, not an isolated held-out quality-equivalence test. Offline dense/forward-chunked/full-chunked memory is78/62/58GB at8K. The output-head-only 32K experiment reports85.2/17.7/5.45GiB; forward chunking is faster there, whereas full chunking reaches256K at11.6GiB and3.3times the forward-chunked iteration rate. These toy results exclude full-model attention and optimizer memory. Dense32K≈250GB is an extrapolation, not a completed dense run.

**What we infer.** [DERIVED] Cache amortization and workspace reduction solve different resource problems. The direction, submass and cache prefix determine scientific equivalence; kernel speed cannot settle them.

**What remains unknown.** [NOT-DISCLOSED] A complete teacher-cache construction bill, broad held-out equivalence across top-k settings, and isolated DeepSeek teacher-scheduling overhead are unavailable in the inspected evidence.


```figure
{
  "id": "fig-39.11",
  "kind": "chart",
  "title": "Retained-mass objective floor",
  "caption": "At q equal to the normalized retained teacher, the sparse expression equals M log M. Negative values are expected; treating them as a normalized KL would misdiagnose the implementation.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.4",
  "alt": "At q equal to the normalized retained teacher, the sparse expression equals M log M. Negative values are expected; treating them as a normalized KL would misdiagnose the implementation.",
  "spec": {
    "type": "line",
    "x": {
      "label": "Retained teacher mass",
      "format": "raw"
    },
    "y": {
      "label": "Minimum sparse loss",
      "format": "fixed3"
    },
    "series": [
      {
        "id": "s0",
        "label": "M log M",
        "points": [
          [
            0.05,
            -0.14978661367769955
          ],
          [
            0.1,
            -0.23025850929940456
          ],
          [
            0.15,
            -0.28456799773288216
          ],
          [
            0.2,
            -0.3218875824868201
          ],
          [
            0.25,
            -0.34657359027997264
          ],
          [
            0.3,
            -0.3611918412977808
          ],
          [
            0.35,
            -0.36743774357453723
          ],
          [
            0.4,
            -0.366516292749662
          ],
          [
            0.45,
            -0.3593284632979972
          ],
          [
            0.5,
            -0.34657359027997264
          ],
          [
            0.55,
            -0.32881035041559126
          ],
          [
            0.6,
            -0.30649537425959444
          ],
          [
            0.65,
            -0.2800088954600953
          ],
          [
            0.7,
            -0.2496724607571127
          ],
          [
            0.75,
            -0.21576155433883568
          ],
          [
            0.8,
            -0.17851484105136778
          ],
          [
            0.85,
            -0.1381410900731087
          ],
          [
            0.9,
            -0.09482446409204366
          ],
          [
            0.95,
            -0.04872862966817305
          ],
          [
            1.0,
            0.0
          ]
        ]
      }
    ]
  }
}
```


```figure
{
  "id": "fig-39.12",
  "kind": "stat-panel",
  "title": "Cache identity",
  "caption": "A cache hit requires the same conditional event and law. File existence or matching target text alone is insufficient.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-39.4",
  "alt": "A cache hit requires the same conditional event and law. File existence or matching target text alone is insufficient.",
  "spec": {
    "header": "Cache identity",
    "rows": [
      {
        "key": "prefix",
        "value": "Exact token history",
        "note": "Including attention and packing boundaries"
      },
      {
        "key": "temperature",
        "value": "Teacher and student",
        "note": "A probability cache cannot change its own temperature"
      },
      {
        "key": "normalizer",
        "value": "Original submass",
        "note": "Renormalizing changes the gradient"
      }
    ]
  }
}
```


## Failure modes

> **Failure mode — Renormalized cache masquerading as full KL.** [DERIVED] *Symptom:* loss values and gradient weights differ by retained mass. *Cause:* cached top-k probabilities were normalized after truncation or their tail discarded without declaration. *Detection:* record per-position $M$, reproduce Eq.39.4 and audit the tail bucket. *Mitigation:* name the actual objective and preserve the original normalizer where required.

[DERIVED] A stale prefix cache can supervise a different attention history; a tokenizer ID collision can align unrelated events; an incorrect tensor-parallel sum can normalize each shard separately. A code path that computes full logits before chunking the loss still retains the dense output spike. Each failure has a distinct tensor-level signature.

## Siblings

[DERIVED] Full logits preserve a complete local law at high bandwidth. Top-k plus tail mass preserves a coarsening. Renormalized top-k preserves a conditional law. Original submass preserves a weighted sparse objective. Text preserves sampled outcomes, and hidden features preserve coordinate information. Compare these on information and counted execution boundary before comparing throughput. Section39.1 defines their losses; §39.6 accounts for their complete economics.

## Extensions

### Improvements

[PAPER-REPORTED] The offline paper's forward-chunked loss retains dense input logits but reduces loss workspace; full chunking fuses projection and backward recomputation to reduce retained output memory further [R39.1, §§3–4]. DeepSeek's hidden-cache scheme retains complete targets with different storage and head-reconstruction costs [R39.8, §5.2.2]. Neither is a source-supported universal winner across context, model layout and teacher reuse.

## Limitations

[DERIVED] No compressed interface can reconstruct information it never stored without an additional model or assumption. A tail bucket bounds full forward KL from below, but a small lower bound does not imply a small omitted term. Cross-tokenizer exact distillation requires event alignment beyond the one-token API. The chapter does not claim production behavior from code reading alone.

## Reproducibility

[OFFICIAL-DOCUMENTATION] Associated code was inspected at commit `38d09ce33dbc36b44212f73fd891b6ee7e63b3e1` dated2026-08-10. `full_chunked.py` and `loss_common.py` establish the described phase order and sparse-mass behavior. No kernel was executed. Record shard layout, chunk axis, buffer dtype, cache hash and teacher temperature; compare the mathematical finite cases independently from hardware performance.

## References

[R39.1](references.md#r39-1), [R39.6](references.md#r39-6), [R39.8](references.md#r39-8).
