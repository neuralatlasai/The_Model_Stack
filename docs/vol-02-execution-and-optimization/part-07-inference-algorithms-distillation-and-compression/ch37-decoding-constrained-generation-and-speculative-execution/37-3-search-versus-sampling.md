---
id: ms.section.37.3
entity_type: section
title: Search versus sampling
short_title: Search versus sampling
volume: 2
part: 7
chapter: 37
section: '37.3'
slug: 37-3-search-versus-sampling
parent: ms.chapter.37
prev_sibling: ms.section.37.2
next_sibling: ms.section.37.4
children: []
prerequisites:
- ms.chapter.4
- ms.chapter.5
- ms.chapter.14
- ms.chapter.31
downstream:
- ms.chapter.38
- ms.chapter.39
- ms.chapter.40
- ms.chapter.42
- ms.chapter.48
related: []
relations: []
axes:
  lifecycle:
  - inference
  mechanism:
  - decoding
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.vllm
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

# 37.3 — Search versus sampling

## Scope

[DERIVED] This section owns path search versus token sampling: beam states, sequence scores, length normalization, candidate diversity and task-dependent selection. Its baseline is greedy selection under the already specified processed law. Success means finding useful completed responses under a declared search budget, rather than claiming that a high-likelihood path is automatically correct. Inference-time reasoning/search trees beyond token beams belong to Chapter 38. The artifact compares candidate-count, model-work and execution-based utility as separate axes.

## Why this exists

[DERIVED] Locally choosing the largest next-token probability need not maximize complete-sequence probability. A promising prefix can lead to a low-probability continuation; a slightly weaker prefix can terminate confidently. Beam search keeps several prefixes to reduce that local commitment. Its finite width still discards alternatives irrevocably, and its scoring rule may optimize length-adjusted likelihood rather than likelihood itself. The meaning of “best beam” is therefore determined by the score and stopping rule, not by beam width alone.

[PAPER-REPORTED] A 2026 grammar-constrained text-to-SQL study compares beam widths and execution-vote sample counts on the same1034 examples. The result is informative precisely because it reports model size, quantization, candidate budgets, single-run uncertainty and grammar incompleteness. It does not establish a task-independent ordering between beam search and sampling. [R37.5, §§3–7](references.md#r37-5)

## Intuition

[MATHEMATICALLY-DERIVED] Sequence likelihood is a product, so log scores add. Since every added token has log probability at most zero, unnormalized scores favor shorter paths unless their probability mass supports the longer continuation strongly enough. Dividing a negative log score by a positive length power changes that preference. A positive exponent makes long negative scores less negative; a negative exponent makes them more negative. A library's “length penalty” name does not specify which sign or denominator it uses.

[DERIVED] Sampling explores by probability mass; beam search explores by retained score rank. Several sampled traces can produce the same executable result, while several beams can be near-identical surface variants. Diversity of strings, probability mass and task outcomes must be measured separately. Execution voting merges candidates by what their programs do on the chosen database, not by exact token identity and not by semantic equivalence over every possible database.

## Formulation

[MATHEMATICALLY-DERIVED] Let $h$ be a response prefix of length $\ell$, and $q$ the processed token law from §37.1. The cumulative score and one explicit completion normalization are:

$$
s(h)=\sum_{t=1}^{\ell}\log q(y_t\mid x,y_{<t}),\qquad S_a(y)=\frac{s(y)}{\ell(y)^a},\qquad \ell(y)\ge1.
$$
*(Eq. 37.7)*

where $a$ is a local length exponent. The contract must state whether EOS and prompt tokens enter $\ell$, and whether $s$ uses raw or processed probabilities. The book convention here counts response events including EOS; implementation comparisons below explicitly differ.

```figure
{
  "id": "fig-37.13",
  "kind": "calculator",
  "title": "Length normalization of two paths",
  "caption": "Illustrative completed paths. Positive difference favors the first path. The score changes with normalization even when both underlying likelihoods stay fixed.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.7",
  "alt": "Adjust the declared illustrative inputs; first normalized score=-c1/l1^a, second normalized score=-c2/l2^a, first minus second score=-c1/l1^a+c2/l2^a. Illustrative completed paths. Positive difference favors the first path. The score changes with normalization even when both underlying likelihoods stay fixed.",
  "spec": {
    "tex": "S_a=s/\\ell^a",
    "equation": "37.7",
    "inputs": [
      {
        "symbol": "a",
        "label": "length exponent",
        "default": 1,
        "min": -2,
        "max": 2,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "l1",
        "label": "first completion length",
        "default": 12,
        "min": 1,
        "max": 128,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "l2",
        "label": "second completion length",
        "default": 24,
        "min": 1,
        "max": 128,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "c1",
        "label": "first negative-log-score magnitude",
        "default": 12,
        "min": 0,
        "max": 100,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "c2",
        "label": "second negative-log-score magnitude",
        "default": 20,
        "min": 0,
        "max": 100,
        "format": "fixed3",
        "step": 0.01
      }
    ],
    "outputs": [
      {
        "symbol": "s1",
        "label": "first normalized score",
        "formula": "-c1/l1^a",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "s2",
        "label": "second normalized score",
        "formula": "-c2/l2^a",
        "format": "fixed3",
        "emphasis": false
      },
      {
        "symbol": "d",
        "label": "first minus second score",
        "formula": "-c1/l1^a+c2/l2^a",
        "format": "fixed3",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared boundary",
      "variables": {
        "a": 0
      },
      "note": "Zero exponent compares unnormalized path scores."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "a": 1
      },
      "note": "Positive length normalization changes the ranking of these completed paths."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "a": -1
      },
      "note": "A negative exponent further penalizes long paths; likelihood increments remain fixed in this illustration."
    }
  ]
}
```

[MATHEMATICALLY-DERIVED] A retained-prefix stopping bound can avoid terminating merely because a fixed number of completions arrived. With nonpositive future log increments and hard completion-length ceiling $K$, an upper bound for any completion of a current prefix is:

$$
U_a(h)=\begin{cases}s(h)/K^a&a\ge0,\\s(h)/\ell(h)^a&a<0,\ \ell(h)>0,\\0&a<0,\ \ell(h)=0.\end{cases}\qquad \max_{y\supset h,\ \ell(y)\le K}S_a(y)\le U_a(h).
$$
*(Eq. 37.8)*

where $s(h)\le0$ and score increments are log probabilities with no positive token rewards. The bound applies only to descendants of retained prefixes. Finite-width pruning already discarded other paths, so this is not a global optimality certificate.

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] For $a\ge0$, a completion has score numerator at most $s(h)$ and denominator at most $K^a$. Dividing a negative numerator by the largest permitted denominator supplies the optimistic bound in Eq 37.8. For $a<0$, normalization multiplies by an increasing power of length; using current length and current score is optimistic. Added positive rewards, externally normalized scores or non-log-probability terms break that derivation. Stop only when the required completed-set threshold dominates every surviving-prefix upper bound, or declare the chosen heuristic stopping policy.

```figure
id: fig-37.14
kind: diagram
title: Beam state transitions
caption: Finished and active hypotheses use distinct state. A completion-count heuristic is not the same stopping certificate
  as a score upper bound on every retained continuation.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.8
alt: The information path is Active prefixes, then Expand legal events, then EOS or continuing, then Completed set, then Prune
  active prefixes, then Stop certificate. Finished and active hypotheses use distinct state. A completion-count heuristic
  is not the same stopping certificate as a score upper bound on every retained continuation.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: state
    label: Active prefixes
    sub: raw s and cache handles
  - id: n1
    kind: process
    label: Expand legal events
    sub: score each continuation
  - id: n2
    kind: branch
    label: EOS or continuing
    sub: separate candidates
  - id: n3
    kind: state
    label: Completed set
    sub: final length score
  - id: n4
    kind: process
    label: Prune active prefixes
    sub: retain width bound
  - id: n5
    kind: metric
    label: Stop certificate
    sub: retained-tree bound only
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

[DERIVED] Beam width is a state cap, not an exact amount of inference work. Each active prefix requires model state and a score row; EOS can remove a hypothesis early. Prefix-cache sharing can reduce repeated prefill, while the number of output-head rows still follows expansions. A method that retrieves only a fixed top list before checking grammar legality can miss the highest-scoring legal continuation. If invalid tokens dominate that list, the legal beam can disappear despite a nonempty legal vocabulary. Expand from the masked law or make the retrieval approximation explicit.

[MATHEMATICALLY-DERIVED] Diverse group beams can use a detached ranking penalty $\kappa c_t(v)$, where $c_t(v)$ counts use of token $v$ by earlier groups at depth $t$. Within group $g$, rank by $s(hv)-\kappa c_t(v)$, then update counts before selecting the next group. This is a fully specified greedy diversity heuristic, not sampling from $q$ and not a probability-preserving transformation. Store original likelihood and diversity rank separately. A more diverse set under this token-overlap criterion can still share the same incorrect SQL execution result.

```figure
id: fig-37.15
kind: compare
title: Candidate diversity is not one quantity
caption: The equivalence relation defines what diversity/voting means. No single agreement statistic supplies semantic truth.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.7
alt: 'Comparison on Candidate equivalence. Grouping: tok=identical token path, exec=same result on chosen database, util=same
  declared outcome value. Failure: tok=paraphrases counted as diverse, exec=spurious agreement on one database, util=different
  reasoning may share score. Selection: tok=sequence score or token overlap, exec=modal result with tie rule, util=external
  evaluator or verified rule'
spec:
  axis: Candidate equivalence
  columns:
  - id: tok
    label: Token identity
  - id: exec
    label: Execution result
  - id: util
    label: Task utility
  rows:
  - dimension: Grouping
    values:
      tok: identical token path
      exec: same result on chosen database
      util: same declared outcome value
  - dimension: Failure
    values:
      tok: paraphrases counted as diverse
      exec: spurious agreement on one database
      util: different reasoning may share score
  - dimension: Selection
    values:
      tok: sequence score or token overlap
      exec: modal result with tie rule
      util: external evaluator or verified rule
```

[MATHEMATICALLY-DERIVED] For $m$ independently generated candidates with result probabilities $p_r$, execution-vote estimates a mode of that result distribution. It does not estimate the result with maximum truth probability unless the candidate law and evaluator happen to align. If the wrong result has the largest mass, repeated sampling can make the wrong majority more reliable. Independence is also conditional on prompt/configuration; shared RNG or deterministic candidates violate the simple iid interpretation.

## Algorithm

### Algorithm 37.3 — scored finite-width sequence search

[DERIVED] Algorithm 37.3 is bounded reference beam search over the declared law. Inputs are positive-integer width $w$ and action cap $K$, requested output count $1\le n_{\rm out}\le w$, score exponent, token/grammar ending contract and immutable model/processor state. State contains active prefixes with raw scores and cache handles, plus completed responses. It does not declare a cap prefix to be a natural completion.

$$
\begin{aligned}
&1.\quad\mathcal H\leftarrow\{(\epsilon,0,\mathrm{cache}_0)\};\ \mathcal F\leftarrow\varnothing;\ t\leftarrow0.\\
&2.\quad\textbf{while }t<K\textbf{ and }\mathcal H\ne\varnothing:\quad t\leftarrow t+1;\ \mathcal C\leftarrow\varnothing.\\
&3.\qquad\textbf{for }(h,s,c)\in\mathcal H:\ q\leftarrow\operatorname{ProcessedLaw}(h);\ \text{require valid mass}.\\
&4.\qquad\quad\textbf{for each }v\in\operatorname{supp}(q):\ s'\leftarrow s+\log q(v);\ h'\leftarrow h\Vert v.\\
&5.\qquad\qquad\textbf{if terminal and valid: append }(h',s')\text{ to }\mathcal F;\\
&\qquad\qquad\textbf{else if terminal and invalid: reject/log INVALID\_ENDING;}\\
&\qquad\qquad\textbf{else: append }(h',s',\mathrm{fork}(c,v))\text{ to }\mathcal C.\\
&6.\qquad\mathcal H\leftarrow\operatorname{Top}_{w}(\mathcal C;\text{declared partial-score,ties});\ \text{release pruned cache handles}.\\
&7.\qquad\mathcal F\leftarrow\operatorname{Top}_{w}(\mathcal F;S_a);\ \textbf{if required finished score}\ge\max_{h\in\mathcal H}U_a(h):\ \textbf{break}.\\
&8.\quad\text{return up to }n_{\rm out}\text{ best completions and a shortfall flag; else CAP/EXHAUSTED with retained prefixes}.
\end{aligned}
$$

[DERIVED] Interpret the maximum of an empty active set as negative infinity. Step7 is used only when the score satisfies Eq 37.8 and enough completed candidates exist for the requested output count. Invalid-law branches terminate with a named failure rather than fabricate a score. Cache forks can be logical references until chosen children require materialized state. The invariant is that every retained score is the sum over that exact path's chosen probability convention. Time is at most $K$ expansion rounds with up to $wV$ score candidates per round; model computation, cache traffic and sorting are additional physical boundaries.

```figure
{
  "id": "fig-37.16",
  "kind": "chart",
  "title": "Positive and negative length exponents",
  "caption": "Analytical scores at integer lengths1–32 with an intentionally fixed numerator. Real paths add negative log increments, so this isolates only normalization, not an empirical length trend. Only integer completion lengths are shown; no fractional token configuration is implied.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.7",
  "alt": "Analytical curves: exponent+1 equals -12/x, exponent0 equals -12, exponent-1 equals -12*x. Analytical scores at integer lengths1–32 with an intentionally fixed numerator. Real paths add negative log increments, so this isolates only normalization, not an empirical length trend.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "response length",
      "scale": "linear",
      "domain": [
        1,
        32
      ],
      "format": "integer"
    },
    "y": {
      "label": "normalized score at fixed s=-12",
      "scale": "linear"
    },
    "series": [
      {
        "id": "s0",
        "label": "exponent+1",
        "formula": "-12/x",
        "sample": {
          "to": 32,
          "count": 32,
          "from": 1
        }
      },
      {
        "id": "s1",
        "label": "exponent0",
        "formula": "-12",
        "sample": {
          "to": 32,
          "count": 32,
          "from": 1
        }
      },
      {
        "id": "s2",
        "label": "exponent-1",
        "formula": "-12*x",
        "sample": {
          "to": 32,
          "count": 32,
          "from": 1
        }
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": -12,
        "label": "All three exponents agree at length1"
      },
      {
        "x": 32,
        "y": -384,
        "label": "Exponent−1: score−384 at length32"
      }
    ]
  }
}
```

## Implementation

[DERIVED] Implementation route: **vLLM** (reference-stack §4 #41, **LLM inference engine**; §4.1 **INFERENCE ENGINE**), v0.31.0 at full commit db9527a46873454610df6dbedf79a36d6bf1a7f6. Source inspection establishes disclosed behavior, not an executed deployment.

[OFFICIAL-DOCUMENTATION] Pinned vLLM offline beam search performs one-token requests, gathers a top-logprob candidate list, splits EOS completions from continuing beams and sorts by its own beam-score helper. That helper uses `len(tokens)` including prompt tokens and removes a final EOS from its denominator; this differs from Eq 37.7's response/EOS convention. The score sums returned raw log probabilities. Grammar masks are reconstructed per beam by replaying generated tokens because that backend interface does not clone matcher state. [R37.1, beam_search/offline.py and utils.py](references.md#r37-1)

[OFFICIAL-DOCUMENTATION] When a legal-token set exceeds the engine whitelist cap, this implementation skips engine-side whitelist enforcement and filters its returned candidate list afterward. Its code requests roughly twice the beam width in top log probabilities. Therefore it must not be described as exhaustive expansion of every legal event. Its loop stops on empty active beams or the token iteration limit rather than the SQL paper's first-arriving-completed-set rule. The two implementations are not silently equated. [R37.1, _build_beam_sampling_params and _beam_search_step](references.md#r37-1)

```figure
{
  "id": "fig-37.17",
  "kind": "memory-stack",
  "title": "Expansion scores and retained scores have different residency",
  "caption": "Eq.37.7 illustrative W=8, V=131072 and4-byte scores: full expansion scores occupy4MiB, while eight retained scalar scores occupy32bytes. These are alternative score-residency boundaries, not complete beam memory; KV forks, prefix IDs, sorting indices, finished hypotheses and weights are excluded.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.7",
  "alt": "The full-expansion score bar contains W×V FP32 scores; the retained-score bar contains only W scalar scores. Their size ratio is the vocabulary size under this declared materialization. Actual implementations may stream expansion scores; no vLLM allocation measurement is asserted.",
  "spec": {
    "format": "bytes",
    "variables": {
      "W": 8,
      "V": 131072,
      "b": 4
    },
    "bars": [
      {
        "label": "Full expansion score materialization",
        "segments": [
          {
            "label": "W×V scalar scores",
            "kind": "memory",
            "formula": "W*V*b"
          }
        ]
      },
      {
        "label": "Retained scalar scores only",
        "segments": [
          {
            "label": "W selected scores",
            "kind": "metric",
            "formula": "W*b"
          }
        ]
      }
    ]
  },
  "anchor": "implementation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared boundary",
      "variables": {
        "W": 1
      },
      "note": "One active prefix still expands a full vocabulary under this materialization."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "W": 8
      },
      "note": "Eight prefixes multiply full-expansion score storage."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "W": 32
      },
      "note": "Larger beam width raises score residency; streaming can move this boundary but not remove selection work."
    }
  ]
}
```

[DERIVED] Frozen inference adds no optimizer/grads, but a beam can multiply KV residency when prefixes diverge. Cross-device target execution and vocabulary reductions apply to each expanded model row; execution voting additionally runs candidates, canonicalizes result sets and resolves ties. Database queries require read-only isolation, deadlines and result-size bounds if they are evaluated as candidates. A failed candidate must remain in the declared denominator even when discarded from voting. Energy/money and measured width-to-latency conversion remain NOT-DISCLOSED in the SQL source.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The SQL study compares four model sizes and budgets1/2/4/8 on every Spider development example. The matched budget is beam width versus number of samples, not measured FLOPs or elapsed time. [R37.5, §§3–4](references.md#r37-5)

| Field | Actual disclosed protocol |
|---|---|
| Model / precision | Qwen2.5-Instruct0.5B,1.5B,3B,7B; NF4 |
| Data / metric |1034Spider development examples; result-set execution accuracy; order significant when gold query has ORDER BY |
| Beam | Width1,2,4,8; length exponent-2; first-come finished-set stopping;160-token cap |
| Sampling / voting | Temperature.7,top-p.9; discard execution failures; vote over execution results |
| Repetition / uncertainty | One decoding run/configuration and one sampling seed;95% Wilson intervals over examples; exact paired McNemar tests |
| Missing | Hardware, full runtime/model pins, seed identifier, per-query latency/FLOPs and repeated-seed intervals NOT-DISCLOSED |

## Observations

**What the paper claims.** [PAPER-REPORTED] The source argues that beam is not significantly worse than sample+vote at its matched candidate counts, and that extra small-model inference generally fails to substitute for the next larger model. [R37.5, §5](references.md#r37-5)

**What the evidence shows.** [PAPER-REPORTED] At1.5B, beam accuracy rises.351→.505 from width 1→8, versus sample+vote.299→.450. Beam is significantly ahead in11of16paired cells and behind in none, but at 0.5B/budget 8 sampling is numerically.248 versus beam.245 with p=.89. The paper's “never beats” wording must therefore be read as its significance statement, not numerical dominance. At7B, width 4 scores.662 and width 8.654: larger width is not monotonically better in that table. [R37.5, Tables1–2](references.md#r37-5)

**What we infer.** [DERIVED] Beam width and candidate count are useful experimental controls but incomplete cost measures. A single-seed result cannot establish sampling variance. Grammar incompleteness and score/stopping conventions can drive the apparent comparison as much as the search family.

**What remains unknown.** [NOT-DISCLOSED] The study does not directly test its suggested wrong-mode/diversity explanation; it leaves vote entropy and candidate-diversity measurements to later work. No general superiority claim across reasoning, JSON or tool-use workloads follows.

## Failure modes

[PAPER-REPORTED] The paper diagnoses correct SQLite queries rejected by its incomplete grammar, including value-list IN, IS NOT NULL, outer joins and aliases. At3B the constraint corrects25predictions and breaks58; at 7B it corrects28 and breaks73. This is empirical grammar coverage failure, not evidence that normalization reorders still-legal greedy tokens. [R37.5, §5](references.md#r37-5)

[DERIVED] Other failures are length-score sign errors, prompt-inclusive denominators compared with response-only scores, early completed-set stopping misrepresented as optimal, lost cache ownership after pruning and legal events omitted by pre-mask top-list retrieval. Diverse group beams can optimize an overlap proxy at the expense of likelihood. Execution voting can reward a spurious query that matches gold on one finite database while implementing the wrong general relation.

## Siblings

```figure
id: fig-37.18
kind: matrix
title: Tree attention follows ancestry
caption: Illustrative nodes root,a,b,child-of-a. Rows query nodes and columns key nodes in that order. The child of a sees
  root/a/self, never sibling b. Beam cache forks and speculative trees require branch-local histories.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.8
alt: Each filled cell denotes an admitted relationship. Illustrative nodes root,a,b,child-of-a. Rows query nodes and columns
  key nodes in that order. The child of a sees root/a/self, never sibling b. Beam cache forks and speculative trees require
  branch-local histories.
spec:
  rows: 4
  cols: 4
  pattern: explicit
  cells:
  - - 1
    - 0
    - 0
    - 0
  - - 1
    - 1
    - 0
    - 0
  - - 1
    - 0
    - 1
    - 0
  - - 1
    - 1
    - 0
    - 1
  rowLabel: root / a / b / aa query
  colLabel: root / a / b / aa key
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

[DERIVED] Greedy search keeps one current path; sampling draws from an explicit law; beam retains several score-ranked paths. A diverse-group penalty intentionally changes ranking without supplying probabilities. Execution-guided selection uses task information beyond model likelihood and its execution cost belongs to total budget. Chapter 38 develops verifier/search allocation beyond this token-beam scope. A wider beam can find a higher normalized score while lowering external task utility; that is objective mismatch, not necessarily search failure.

## Extensions

### Improvements

[PAPER-REPORTED] The 2026 SQL study provides paired grammar-failure diagnosis beyond a coarse beam/sampling ranking. That diagnosis isolates missing grammar constructs among correct-but-rejected predictions. It does not establish a repaired-grammar result or a new diversity mechanism; those improvements are not fabricated here. [R37.5, §5](references.md#r37-5)

## Limitations

[DERIVED] Eq 37.8 bounds only the retained finite search tree and only for nonpositive log-score increments under the stated normalization. Beam pruning is a heuristic approximation to sequence optimization. The inspected studies do not establish a current multi-seed improvement for diverse-group beams, so that variant is presented as a mathematically specified ranking alternative with an explicit empirical gap. Equal candidate counts do not constitute a hardware-normalized frontier.

## Reproducibility

[DERIVED] Record raw/processed score selection, prompt/EOS length conventions, partial/final ranks, tie order, beam width, complete stopping rule, maximum length, legal-token retrieval limits and cache-sharing policy. For voting, preserve candidate failures, database snapshot, execution timeout, result canonicalization and modal ties. Report paired disagreements rather than interpreting overlapping marginal confidence intervals as a difference test. Seed replication and actual latency/compute accounting remain necessary to extend the source's limited comparison.

## References

[DERIVED] R37.5 supplies the source study and negative results. R37.1 supplies the explicitly different pinned offline implementation. Equations37.7–37.8, bounded procedure and diverse-ranking specification are independent derivations, not claims of newly invented 2026 foundations or executed experiments.
