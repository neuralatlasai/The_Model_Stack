---
id: ms.section.37.6
entity_type: section
title: Runtime coupling
short_title: Runtime coupling
volume: 2
part: 7
chapter: 37
section: '37.6'
slug: 37-6-runtime-coupling
parent: ms.chapter.37
prev_sibling: ms.section.37.5
next_sibling: ms.verification.37
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

# 37.6 — Runtime coupling

## Scope

[DERIVED] This section owns the physical execution boundary of a decoder: proposer/target placement, dynamic batching, grammar compilation and mask transport, verification workspace, cache transactions and latency-quality accounting. The artifact is a deployment contract that connects the mathematical generator to admitted resources and delivered events. It does not replace the probability proofs in §§37.1–37.5 or the broader serving architecture in Chapter 42. A configuration is useful only under its stated workload, hardware, quality contract and latency objective.

## Why this exists

[DERIVED] A decoder can reduce sequential target invocations and still increase total latency. Draft execution, target verification width, vocabulary operations, grammar masks, synchronization, cache updates and host scheduling can exceed the work saved. A CPU parser's2-microsecond mask classification can coexist with expensive compilation and transfer. A throughput gain at large batch size can coexist with worse first-token or tail latency. An accepted-token metric is therefore insufficient to select a production configuration.

[PAPER-REPORTED] PSC explicitly separates online mask construction from preprocessing and end-to-end vLLM throughput. ResiSpec separates drafting, verification and residual shaping in its profile and reports substantial variation with tree topology. The pinned vLLM implementation adds bounded verification-chunk logic and transactional grammar-mask state. These sources support a concrete cost model while leaving some service-level measurements undisclosed. [R37.3, §§4–5](references.md#r373) [R37.6, Figure 3 and Table 3](references.md#r376) [R37.1, sampler and structured-output paths](references.md#r371)

## Intuition

[DERIVED] Each speculative cycle buys a random amount of committed progress for an actual wall-clock cost. Increasing depth or width can raise both. The useful ratio is committed progress per cycle time, measured across complete requests and under the same finish rules. A scheduler may overlap CPU mask work with GPU execution, but overlap changes the critical path rather than making either operation free. Separate-device drafting can reduce contention while adding transport, synchronization and another resident model.

[DERIVED] Grammar preprocessing moves repeated work from each token to a reusable artifact. This is attractive when many tokens share an immutable grammar/tokenizer contract. It is expensive when schemas change frequently or compilation produces a large automaton. Caching the artifact requires exact schema dialect, tokenizer, compiler and configuration identity. Sharing a mask by schema name alone can admit invalid events after a schema revision. Performance and language equivalence must be assessed separately.

## Formulation

| Local object | Meaning | Unit |
|---|---|---|
| $N_i,C_i$ | Committed progress and measured cycle wall time | Token events, seconds |
| $T_d,T_v,T_s,T_g,T_c,T_h$ | Draft, verify, shaping, grammar, transfer/commit and scheduler components | Seconds at a declared boundary |
| $B,V,d,n_{\mathcal T}$ | Requests, vocabulary, depth and total tree nodes | Integer counts |
| $M_{\rm weights},M_{\rm KV},M_{\rm logits},M_{\rm grammar}$ | Separate resident resource categories | Bytes |
| $Q,T_{\rm prep},r_0,r_1$ | Reused generated events, compile time and decoding rates | Events, seconds, events/second |

[MATHEMATICALLY-DERIVED] For stationary regenerative cycles with finite positive mean cost, the renewal-reward rate is $\mathbb E[N]/\mathbb E[C]$. A finite trace instead reports its actual total progress divided by actual total wall time, with warmup/queue boundaries disclosed:

$$
r_{\rm spec}=\frac{\mathbb E[N]}{\mathbb E[C]},\qquad S=t_0\frac{\mathbb E[N]}{\mathbb E[C]},\qquad \widehat r=\frac{\sum_i N_i}{\sum_i C_i},\qquad C_{\rm serial}=T_d+T_v+T_s+T_g+T_c+T_h.
$$
*(Eq. 37.18)*

where $t_0$ is target-only seconds per event under the same workload and finish definition. $S$ compares rates under the stated stationary model. Generally $\mathbb E[N/C]\ne\mathbb E[N]/\mathbb E[C]$. For overlapping execution, measure the dependency-graph critical path; the serial sum is not its wall time. Adaptive request censoring/selection can invalidate an unqualified fixed-population interpretation.

```figure
{
  "id": "fig-37.31",
  "kind": "calculator",
  "title": "Progress must exceed cycle overhead",
  "caption": "Illustrative nonoverlapping cycle means with a positive verification time. Other cost includes masks, shaping, transport and scheduling. Mean progress is a real-valued expectation, not an integer count slider. No source timing values or measured deployment outcome are asserted.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.18",
  "alt": "Adjust the declared illustrative inputs; illustrative speed ratio=t*m/(d+v+o), speculative events per second=m/(d+v+o), seconds per committed event=(d+v+o)/m. Illustrative nonoverlapping cycle means with a positive verification time. Other cost includes masks, shaping, transport and scheduling. Mean progress is a real-valued expectation, not an integer count slider. No source timing values or measured deployment outcome are asserted.",
  "spec": {
    "tex": "S=t_0\\mu/(T_d+T_v+T_o)",
    "equation": "37.18",
    "inputs": [
      {
        "symbol": "t",
        "label": "target-only seconds per event",
        "default": 0.02,
        "min": 0.01,
        "max": 0.2,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "m",
        "label": "mean committed events per cycle",
        "default": 3,
        "min": 1,
        "max": 8,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "d",
        "label": "draft seconds per cycle",
        "default": 0.01,
        "min": 0,
        "max": 0.1,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "v",
        "label": "verification seconds per cycle",
        "default": 0.03,
        "min": 0.01,
        "max": 0.2,
        "format": "fixed3",
        "step": 0.01
      },
      {
        "symbol": "o",
        "label": "other seconds per cycle",
        "default": 0.01,
        "min": 0,
        "max": 0.1,
        "format": "fixed3",
        "step": 0.01
      }
    ],
    "outputs": [
      {
        "symbol": "S",
        "label": "illustrative speed ratio",
        "formula": "t*m/(d+v+o)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "r",
        "label": "speculative events per second",
        "formula": "m/(d+v+o)",
        "format": "fixed3",
        "emphasis": false
      },
      {
        "symbol": "c",
        "label": "seconds per committed event",
        "formula": "(d+v+o)/m",
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
        "t": 0.02,
        "m": 3,
        "d": 0.01,
        "v": 0.03,
        "o": 0.01
      },
      "note": "Progress must pay for the complete nonoverlapping cycle."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "t": 0.02,
        "m": 5,
        "d": 0.01,
        "v": 0.03,
        "o": 0.01
      },
      "note": "Greater mean progress improves the rate only under unchanged cycle cost."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "t": 0.02,
        "m": 2,
        "d": 0.1,
        "v": 0.1,
        "o": 0.1
      },
      "note": "Large draft, verification and other overhead can erase the time advantage."
    }
  ]
}
```

[MATHEMATICALLY-DERIVED] Under the deliberately simplified model of constant conditional acceptance $\alpha$, no stops and one correction/bonus event, depth-$d$ progress is a finite geometric sum. Physical verification still processes drafted positions, including those later discarded:

$$
\mu_d=1+\sum_{j=1}^{d}\alpha^j,\qquad C_d=T_d(d)+T_v(d+1,B)+T_{\rm other}(d,B),\qquad d^*\in\arg\min_{d\in\mathcal D_{\rm feasible}}\frac{C_d}{\mu_d}.
$$
*(Eq. 37.19)*

where $\mu_d=d+1$ at $\alpha=1$. Feasibility includes resident memory, context and deadline constraints. A constant acceptance model is illustrative; actual conditional acceptance depends on prefix, proposal and tree topology. Minimizing mean cost does not certify a p99 latency bound or preserve a changed quality law.

```figure
{
  "id": "fig-37.32",
  "kind": "chart",
  "title": "Deeper drafting can lose the time advantage",
  "caption": "At integer depth d, progress uses conditional acceptance0.8 and cycle cost0.65+0.3d in illustrative units with target-only cost1. This analytical curve includes growing draft/verification overhead. It does not fit a paper or establish an optimal deployment depth. Discrete configurations prevent interpolation from suggesting fractional draft depths.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.19",
  "alt": "Analytical curves: progress divided by cycle cost equals ((1-pow(0.8,x+1))/0.2)/(0.65+0.3*x), unit rate baseline equals 1. At integer depth d, progress uses conditional acceptance0.8 and cycle cost0.65+0.3d in illustrative units with target-only cost1. This analytical curve includes growing draft/verification overhead. It does not fit a paper or establish an optimal deployment depth.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "draft depth",
      "scale": "linear",
      "domain": [
        1,
        16
      ],
      "format": "integer"
    },
    "y": {
      "label": "illustrative rate ratio",
      "scale": "linear"
    },
    "series": [
      {
        "id": "s0",
        "label": "progress divided by cycle cost",
        "formula": "((1-pow(0.8,x+1))/0.2)/(0.65+0.3*x)",
        "sample": {
          "to": 16,
          "count": 16,
          "from": 1
        }
      },
      {
        "id": "s1",
        "label": "unit rate baseline",
        "formula": "1",
        "sample": {
          "to": 16,
          "count": 16,
          "from": 1
        }
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 1.8947368421052633,
        "label": "Depth1: rate ratio1.895"
      },
      {
        "x": 16,
        "y": 0.8967724787735298,
        "label": "Depth16: rate falls below baseline"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Co-located target and draft models share GPU capacity and can compete for bandwidth, kernels and KV pages. Placing the draft on another device changes that contention but requires movement of proposed events and the verification information required by the selected exactness proof. Sending token identifiers costs $O(Bd)$ integers; sending full FP32 proposal distributions costs $4BdV$ bytes. Compressing that information is an algorithmic change unless the correction path can reconstruct it. Host grammar work adds CPU scheduling and mask transfer; it can overlap model kernels only when its dependencies permit.

```figure
id: fig-37.33
kind: diagram
title: Placement changes dependencies and paid work
caption: This is a dependency diagram, not a claim of actual concurrent hardware placement. Co-location collapses transport
  boundaries while retaining model/state costs. Separate placement adds link traffic and synchronization; only a measured
  critical path determines latency.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.18
alt: The information path is Host scheduler, then Draft device, then Transfer frontier, then Target device, then Commit service.
  This is a dependency diagram, not a claim of actual concurrent hardware placement. Co-location collapses transport boundaries
  while retaining model/state costs. Separate placement adds link traffic and synchronization; only a measured critical path
  determines latency.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: state
    label: Host scheduler
    sub: request deadlines and grammar
  - id: n1
    kind: model
    label: Draft device
    sub: weights KV proposal rows
  - id: n2
    kind: boundary
    label: Transfer frontier
    sub: tokens and required laws
  - id: n3
    kind: model
    label: Target device
    sub: verification and target KV
  - id: n4
    kind: process
    label: Commit service
    sub: residual state delivery
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

[DERIVED] Continuous batching mixes requests with different prompt lengths, draft depths, grammar states and finish positions. Padding a verification batch to its largest tree can waste target work. Ragged packing can reduce that waste while making row-to-request/ancestor bookkeeping stricter. A target row can be used only for its owning prefix and processor identity. Prefix caches share immutable ancestors, not speculative descendants whose acceptance is unknown. A beam/tree fork can share physical pages until mutation; accounting must distinguish logical references from allocated bytes and release each allocation exactly once.

```figure
id: fig-37.34
kind: matrix
title: Tree attention admits ancestors and self only
caption: Candidate nodes are a,b,c,d, where c descends from a and d descends from b. Rows are target input nodes and columns
  are visible candidate nodes; every row also sees the common prompt, omitted here. Siblings remain invisible. The resulting
  logits predict each node’s next event at its own ancestry.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.14
alt: Each filled cell denotes an admitted relationship. Candidate nodes are a,b,c,d, where c descends from a and d descends
  from b. Rows are target input nodes and columns are visible candidate nodes; every row also sees the common prompt, omitted
  here. Siblings remain invisible. The resulting logits predict each node’s next event at its own ancestry.
spec:
  rows: 4
  cols: 4
  pattern: explicit
  cells:
  - - 1
    - 0
    - 0
    - 0
  - - 0
    - 1
    - 0
    - 0
  - - 1
    - 0
    - 1
    - 0
  - - 0
    - 1
    - 0
    - 1
  rowLabel: input node a / b / c / d
  colLabel: visible node a / b / c / d
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

[PAPER-REPORTED] PSC precomputes how a vocabulary token can advance the lexer and produce terminal sequences. It composes pushdown-stack transducers for those sequences, removes output to obtain acceptors for admissible parser stacks, and builds a combined deterministic classifier. Runtime feeds the lexer state and current stack to this classifier, whose reached state labels a stored token-validity mask. This moves repeated token-by-token parser simulation into preprocessing. The construction requires deterministic parser behavior, terminating epsilon closure and a correctly represented lexer/tokenizer interface; stack-symbol order and input encoding are part of the artifact. [R37.3, §3.1–3.3, Algorithms1–2](references.md#r373)

[PAPER-REPORTED] Let $R_q(v)$ be the realizable lexer terminal sequences associated with token $v$ at lexer state $q$. The source represents each terminal-sequence parser transition by a finite-state transducer $P_w$ from an input stack to its stabilized output stack, rejecting when no transition exists. Its epsilon transducer consumes enough stack-top symbols to decide a parser action, performs required epsilon moves until stable, then copies the remaining stack. A terminal transducer consumes the needed stack top, applies one terminal transition and copies the remainder. Feeding the stack through epsilon stabilization, terminal1, stabilization, terminal2 and so on builds $P_w$. This explicit operational composition avoids the opposite written composition orders appearing in Eq 8 and Algorithm 1; actual libraries must pin their convention. Removing output labels leaves $A_w$, the regular language of input stacks admitted by that terminal sequence. [R37.3, §§3.2–3.4 Eq 3–8, Theorems1–2](references.md#r373)

[PAPER-REPORTED] Introduce singleton-symbol acceptors $I_q,I_v$. The source unions $I_qA_wI_v$ over lexer states, vocabulary events and $w\in R_q(v)$, then determinizes/minimizes. Feeding only the encoded lexer state plus stack reaches a classifier state; the next accepted event labels are its precomputed mask. This jointly shares work across tokens instead of independently running an acceptor for each token. The source's reduction assumes that reaching a stable stack has an available lexer-realizable accepting continuation; determinism/termination alone are not substituted for that extendability assumption. Partial lexical fragments, whitespace and a token spanning several terminals must enter $R_q(v)$ correctly. [R37.3, §3.2 Eq 3 assumption, §3.5 Eq 9 and Algorithms1–2](references.md#r373)

[MATHEMATICALLY-DERIVED] Write the compiled classifier as $D=(S,\delta,s_0)$ with stored bitmasks $M_s$. For lexer state $q$ and parser stack $\gamma$, a correctness contract is that its lookup exactly matches represented token extendability:

$$
s(q,\gamma)=\delta^*(s_0,\operatorname{Encode}(q,\gamma)),\qquad M_{s(q,\gamma)}(v)=\mathbf1\{\operatorname{Advance}(q,\gamma,\operatorname{Decode}(v))\text{ is extendable}\}.
$$
*(Eq. 37.20)*

where Runtime classification is linear in the encoded stack length for a deterministic transition table, then a constant-time pointer lookup to a stored mask. Applying or transporting a $V$-bit mask remains vocabulary-dependent. The identity is the desired compilation invariant; it is not guaranteed for unsupported lexer/schema constructs or a mismatched tokenizer.

[DERIVED] The offline procedure enumerates the finite lexer-state/vocabulary pairs, computes their realizable terminal sequences, composes the corresponding terminating stack transducers and merges admissibility languages into a classifier. Determinization/minimization can grow sharply and must have a bounded time/memory policy. A compilation timeout returns `GRAMMAR_COMPILE_LIMIT`; it does not silently substitute an incomplete grammar and retain an exact-validity label. Cached success records the schema/grammar bytes, tokenizer decoder, compiler version, supported dialect and resource limits. EOS acceptance is checked against the final recognizer rather than inferred from a nonempty mask.

## Algorithm

### Algorithm 37.6 — resource-bounded verification window

[DERIVED] Algorithm 37.6 bounds a scheduler window over a finite request snapshot. Inputs include a positive-integer window limit $J$, hard memory/row limits, deadlines, a frozen scheduling policy and versioned grammar artifacts. It chooses feasible batches without claiming globally optimal scheduling. Reservations are transactional and owned by unique identifiers; physical capacity is reclaimed only after work is quiescent, or ownership transfers to an unavailable quarantine ledger. The exact generation/stop transitions are delegated to Algorithms37.2/37.5, preserving their invariants.

$$
\begin{aligned}
&1.\quad\mathcal Q\leftarrow\text{finite request snapshot};\ \mathcal R\leftarrow\varnothing;\ \mathcal Z\leftarrow\varnothing;\ j\leftarrow0;\ \mathcal L\leftarrow\varnothing.\\
&2.\quad\textbf{while }j<J\textbf{ and }\mathcal Q\ne\varnothing\textbf{ and before window deadline}:\\
&3.\qquad\text{expire/cancel requests at committed frontiers};\ \textbf{if }\mathcal Q=\varnothing:\ \textbf{break normally};\\
&\qquad\mathcal B\leftarrow\operatorname{ChooseFeasible}(\mathcal Q).\\
&\qquad\textbf{if }\mathcal B=\varnothing:\ \text{return CAPACITY\_BLOCKED and remaining queue}.\\
&4.\qquad c\leftarrow\operatorname{Reserve}(\text{weights, KV, rows, masks, transport};\mathcal B);\\
&\qquad\textbf{if reservation fails: return ADMISSION\_FAILURE};\ \mathcal R\leftarrow\mathcal R\cup\{c\};\ j\leftarrow j+1.\\
&5.\qquad\textbf{try}:\ \text{validate immutable request/artifact identities};\\
&\qquad\quad\text{run bounded draft, grammar, target and correction steps at matching prefixes};\\
&\qquad\quad\text{commit only verified events through stop-aware delivery; record computed/discarded work}.\\
&6.\qquad\textbf{on error/timeout}:\ \operatorname{RequestCancel}(c);\ a\leftarrow\operatorname{BoundedDrainAck}(c);\\
&\qquad\quad\textbf{if }a=\mathrm{QUIESCENT}:\ \text{rollback private tentative cache/parser state};\\
&\qquad\quad\textbf{else}:\ \operatorname{TransferUnavailableOwnership}(c);\ \mathcal Z\leftarrow\mathcal Z\cup\{c\};\\
&\qquad\quad\text{retain delivered boundary; record named failure and drain/quarantine status}.\\
&7.\qquad\textbf{finally}:\ \textbf{if }c\notin\mathcal Z:\ \operatorname{ReleaseOnceAfterQuiescence}(c);\\
&\qquad\quad\mathcal R\leftarrow\mathcal R\setminus\{c\};\ \text{append timings/status to }\mathcal L.\\
&8.\qquad\text{remove finished requests; requeue unfinished live requests under frozen policy}.\\
&9.\quad\text{return committed outcomes, queue, ledger }\mathcal L\text{ and unavailable }\mathcal Z;\ \text{require }\mathcal R=\varnothing.
\end{aligned}
$$

[DERIVED] A feasible reservation upper-bounds the actual allocations of the selected path, including its largest indivisible request. A timeout is not evidence that GPU kernels or transport have stopped. Quarantined allocations remain unavailable until a separate owner obtains completion/reset acknowledgement and safely reclaims them; an empty request-owned reservation set therefore does not imply all bytes are free. Tentative work remains isolated from the committed cache. Policy depth/width may adapt between transactions using logged information; it cannot retrospectively relabel an approximate verification step as exact. A deadline returns a censored prefix rather than EOS. Profiling synchronization can alter overlap and latency, so component profiling and uninstrumented end-to-end rates are separate measurements. Every computed but rejected node still enters the resource ledger.

## Implementation

[DERIVED] Implementation route: **vLLM** (reference-stack §4 #41, **LLM inference engine**; §4.1 **INFERENCE ENGINE**), v0.31.0 at full commit db9527a46873454610df6dbedf79a36d6bf1a7f6. Source inspection establishes disclosed behavior, not an executed deployment.

[OFFICIAL-DOCUMENTATION] The vLLM V2 rejection sampler budgets a chunked path around 1GiB of FP32 logits, using a row estimate proportional to $1/(4V)$. It preserves request boundaries when forming chunks. Thus that setting is not a universal hard1GiB maximum: one indivisible oversized request can exceed the nominal chunk estimate. An adaptive verification branch asserts restrictions when a batch exceeds its supported unchunked configuration. Admission must inspect the actual path and largest request rather than treating the constant as a complete OOM guarantee. [R37.1, gpu/spec_decode/rejection_sampler.py, _verify_in_chunks](references.md#r371)

[OFFICIAL-DOCUMENTATION] The structured-output manager tentatively advances grammar state along proposed tokens to populate position-specific masks, then rolls back those advances. Acceptance later advances the committed state. It allocates packed masks for speculative positions and coordinates matcher/backend rollback limits. This code behavior explains why correct logits alone are insufficient: stale grammar state can change the target law. [R37.1, v1/structured_output/__init__.py and backend_xgrammar.py](references.md#r371)

[MATHEMATICALLY-DERIVED] A compact residency model keeps each resource separate. For a standard homogeneous KV layout with $L$ layers, $H_{\rm KV}$ KV heads, head dimension $D_h$, total resident token positions $P$ and $s_k$ bytes per element:

$$
M_{\rm total}=M_{\rm weights,T}+M_{\rm weights,D}+M_{\rm KV,T}+M_{\rm KV,D}+M_{\rm logits}+M_{\rm grammar}+M_{\rm workspace},\quad M_{\rm KV}=2PLH_{\rm KV}D_hs_k,\quad M_{\rm mask}=4B(d+1)\left\lceil\frac V{32}\right\rceil.
$$
*(Eq. 37.21)*

where The factor2 represents key and value tensors. This KV expression assumes a declared standard layout and omits architecture-specific compressed/stateful alternatives; target and draft use their own dimensions. Packed masks use32-bit words. No optimizer or gradient residency is added for frozen inference. Tree/beam pages, allocator slack, communication staging and kernels enter their actual categories rather than being hidden in parameter count.

```figure
{
  "id": "fig-37.35",
  "kind": "memory-stack",
  "title": "Depth-indexed masks and node-indexed logits scale differently",
  "caption": "Eq.37.21 analytical B=8,depth5,V=128256,n=121 tree nodes and4-byte logits. Packed masks count B(depth+1)rows,while full tree logits count Bn rows. The bars compare distinct allocation boundaries; do not add depth and node counts or infer measured GPU residency.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.21",
  "alt": "A packed-mask bar uses4B(depth+1)ceil(V/32)bytes,whereas a full FP32 tree-logit bar usesBnV×4bytes. Actual tree nodes, not draft depth alone, determine the second quantity. Chunking/streaming may reduce simultaneous logit residency.",
  "spec": {
    "format": "bytes",
    "variables": {
      "B": 8,
      "d": 5,
      "V": 128256,
      "n": 121,
      "s": 4
    },
    "bars": [
      {
        "label": "Packed masks across depth positions",
        "segments": [
          {
            "label": "4B(depth+1)ceil(V/32)",
            "kind": "memory",
            "formula": "4*B*(d+1)*ceil(V/32)"
          }
        ]
      },
      {
        "label": "Full tree-logit materialization",
        "segments": [
          {
            "label": "B×actual nodes×V×bytes",
            "kind": "tensor",
            "formula": "B*n*V*s"
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
        "n": 31
      },
      "note": "The mask depth remains fixed while actual tree size varies."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "n": 121
      },
      "note": "Default121-node materialization; no automatic identity with depth5."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "n": 341
      },
      "note": "A wider tree increases full logit residency without changing this depth-indexed mask count."
    }
  ]
}
```

[DERIVED] Parameter memory is not total inference memory. A shared MTP design does not delete every position's state. A batch can fit weights and fail during logits materialization or DFA compilation. CPU grammar memory can exceed GPU mask memory by orders of magnitude. Cross-device execution additionally charges transfer buffers and actual link traffic; p99 request latency includes queueing, prompt prefill, grammar compilation if cold, generation and final delivery.

## Experimental design

### Reported experiments

[PAPER-REPORTED] This table preserves the source's actual timing boundaries, including what is outside each benchmark.

| Protocol field | PSC compilation/mask/throughput experiments | ResiSpec topology/profile experiments |
|---|---|---|
| Model/tokenizer | Llama3.2 vocabulary 128256, Qwen2.5 vocabulary 151665, Gemma3 vocabulary 262145; throughput includes1B/.5B/270M and Qwen7B | Llama-2-7B/JackFram68M main pair; exact revisions NOT-DISCLOSED |
| Workload | First1000 parseable Stack programs per Java/Go/SQL;1000 filtered valid MaskBench schemas; accepted-only teacher-forced throughput | CNN/DM, OpenWebText, C4;200 fixed-order examples per run |
| Hardware | Machine8A10040GB, two XeonGold6348,512GB RAM; experiments use one GPU and one CPU thread | One RTX3090 |
| Boundary | CPU tensor mask construction excludes H2D transfer and logit masking; vLLM throughput includes runtime grammar work but uses oracle accepted-token replay | Draft/verify/shaping profile plus end-to-end generated tokens/wall time; synchronization-sensitive |
| Settings/precision | Throughput batches1,2,4,…,256; precision and exact baseline revisions NOT-DISCLOSED in inspected prose | Temperatures1/.6, top-p 1; main budget 512; precision NOT-DISCLOSED |
| Seeds/intervals | Independent-run seed and uncertainty protocol NOT-DISCLOSED | Deterministic seed scheme disclosed, base seed and multi-run confidence intervals NOT-DISCLOSED |
| Ablations | Grammar/vocabulary, batch/model size, offline and resident memory | Depth/branching/candidate counts, residual shaping and integrations |
| Optimizer/budget | Frozen inference, no training optimizer; compilation and decoding timed separately | Frozen inference intervention, no new optimizer step |

[PAPER-REPORTED] PSC Table 6 reports Llama JSON preprocessing28.3 seconds with 3.04GiB peak memory, versus SQL4662.7 seconds and255.3GiB peak. Table 7 reports SQL runtime classifier3.42GiB plus stored masks2.82GiB; for a Gemma Go configuration, stored masks reach6.32GiB. Those are concrete preprocessing/residency tradeoffs, not evidence that all grammars are inexpensive. Its microbenchmark mask classification is about 2.2–2.6 microseconds across tested languages, excluding transfer/application; “up to700×” is a mask-construction comparison, not end-to-end generation acceleration. [R37.3, §4.3, Tables2–3, §5, Tables6–7](references.md#r373)

[MATHEMATICALLY-DERIVED] When a compiled artifact is reused, the decoding-only speed advantage repays preprocessing only after enough events. Under fixed rates and no other cold-start cost:

$$
T_{\rm prep}+\frac Q{r_1}\le\frac Q{r_0}\quad\Longleftrightarrow\quad Q\ge Q^*=\frac{T_{\rm prep}}{1/r_0-1/r_1},\qquad r_1>r_0>0.
$$
*(Eq. 37.22)*

where If $r_1\le r_0$, positive preprocessing is not repaid by this rate comparison. Rates must refer to the same workload/batch/finish contract. Cache misses, schema churn, memory opportunity cost and queueing change the model. Events shared across unrelated schema artifacts cannot be pooled as if they reused one compilation.

[PAPER-REPORTED] PSC Figure 4 supplies a concrete case: Llama1B JSON throughput3077 tokens/s for LLGuidance and6553.1 for PSC, with 28.3 seconds preprocessing. Eq 37.22 gives approximately164.2 thousand reused tokens. At that boundary, PSC's post-compilation decoding takes about 25.1 seconds; including compilation gives about 53.4 seconds, matching the alternative's total. Calling25.1 seconds the whole cold-start elapsed time would omit28.3 seconds of paid work. The unconstrained7524.7 tokens/s rate is a different validity contract, not a grammar-equivalent baseline. [R37.3, Figure 4 and §5.2](references.md#r373)

## Observations

**What the paper claims.** [PAPER-REPORTED] PSC claims small online overhead through stack classification and amortizable preprocessing. ResiSpec claims better multi-candidate progress and throughput from residual shaping. [R37.3, §§4–5](references.md#r373) [R37.6, §4](references.md#r376)

**What the evidence shows.** [PAPER-REPORTED] PSC's performance gap narrows when larger model compute dominates and becomes more visible at larger batches. Its large offline/runtime automata demonstrate a real time-memory exchange. Its end-to-end throughput protocol follows already accepted oracle continuations; downstream actual-generation correctness is a separate experiment. ResiSpec Table 3 reports depth 7/branching 2 at 101.01 tokens/s, depth 5/branching 3 at 94.25, depth 4/branching 5 at 60.83, and depth 3/branching 11 at 44.21, despite broadly comparable node totals. More parallel proposals therefore do not monotonically increase rate in that study. These source rates retain the exactness caveat of §37.5. [R37.3, §4.4 and §5](references.md#r373) [R37.6, Table 3](references.md#r376)

**What we infer.** [DERIVED] Favorable acceptance must be combined with verified distribution semantics and complete paid work. The optimum depends on model size, batch composition, vocabulary, grammar reuse, device/link capacity and tail-latency objective. The current code pin demonstrates concrete engineering constraints without establishing an independently measured universal speed frontier. Compilation break-even is conditional on reuse and is not a license to ignore memory opportunity cost.

**What remains unknown.** [NOT-DISCLOSED] The inspected studies do not jointly report production arrival traces, p50/p95/p99 latency, power/energy, allocated monetary cost, schema-churn sensitivity and multi-seed quality under a common hardware-normalized protocol. Exact baseline dependency revisions and several precision fields remain unavailable. No private serving performance or executed benchmark is inferred.

## Failure modes

[DERIVED] Failure surfaces include OOM at an indivisible request, allocator fragmentation, stale grammar-cache keys, unbounded compilation, host-mask bottlenecks, hidden transfer/synchronization, sibling attention leakage, queue starvation and cache pages released twice. A nominal chunk budget can fail to bound a whole request. Excluding discarded proposals, warmup or timeouts from denominators makes an operationally misleading rate. Averaging per-cycle token/time ratios weights cycles differently from total progress divided by total elapsed time. Selectively stopping after favorable observations can further bias a finite report.

## Siblings

```figure
id: fig-37.36
kind: compare
title: Where constraint work is paid
caption: These strategies describe cost placement. They do not imply identical grammar coverage or actual measured speed.
  A backend comparison requires equal supported language and independently validated ending rules.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.20
alt: 'Comparison on Runtime strategy. Up-front work: o=compile grammar and parser state, p=transducer composition, determinization,
  masks, g=backend-specific compilation and transfer. Per-event work: o=parser/token validity construction, p=stack classification
  plus mask application, g=state update and device masking. Resource limit: o=CPU latency and queueing, p=offline peak and
  stored automata/masks, g=device memory and synchronization'
spec:
  axis: Runtime strategy
  columns:
  - id: o
    label: Online parsing
  - id: p
    label: Precompiled classifier
  - id: g
    label: Device-resident masks
  rows:
  - dimension: Up-front work
    values:
      o: compile grammar and parser state
      p: transducer composition, determinization, masks
      g: backend-specific compilation and transfer
  - dimension: Per-event work
    values:
      o: parser/token validity construction
      p: stack classification plus mask application
      g: state update and device masking
  - dimension: Resource limit
    values:
      o: CPU latency and queueing
      p: offline peak and stored automata/masks
      g: device memory and synchronization
```

## Extensions

### Improvements

[PAPER-REPORTED] PSC moves admissibility simulation into a compiled classifier; vLLM's pinned release offers verification chunking and state rollback; ResiSpec investigates candidate utility after residual updates. Each successor addresses a concrete bottleneck, with distinct theory/protocol limits. A combined implementation requires renewed correctness and latency evaluation rather than multiplying advertised factors. [R37.3, method](references.md#r373) [R37.1, named paths](references.md#r371) [R37.6, method and ablations](references.md#r376)

## Limitations

[DERIVED] The cost equations are conditional models, not forecasts of undisclosed hardware. Stationary rate arguments do not determine request tails. The standard KV formula excludes architecture-specific latent/state-space layouts. Classifier construction is limited by represented deterministic grammar/lexer semantics and potentially large preprocessing. Source timing results use different workloads and cannot be ranked as one universal leaderboard. Distributional exactness and semantic correctness remain separate axes even when a method is fast.

## Reproducibility

[DERIVED] Archive the full hardware topology, model/tokenizer/runtime pins, placement, precision, batch/arrival trace, scheduler policy and resource limits. Record cold/warm compilation, grammar hashes, mask-transfer bytes, actual logits chunks, reserved/peak memory, computed/accepted/committed/delivered counts and all finish reasons. Separate uninstrumented wall time from synchronized component profiles. Preserve failures/timeouts and queueing in end-to-end denominators. The chapter's verification file describes proposed execution; the present manuscript claims source inspection and static mathematical rendering only.

## References

[DERIVED] R37.1, R37.3 and R37.6 supply pinned code and inspected actual protocols. Equations37.18–37.22 reconstruct renewal-reward, bounded-depth progress, classifier, residency and amortization contracts. The calculated PSC break-even uses explicitly source-reported inputs and includes the complete cold-start boundary.
