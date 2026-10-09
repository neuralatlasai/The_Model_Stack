---
id: ms.section.37.5
entity_type: section
title: Speculative decoding
short_title: Speculative decoding
volume: 2
part: 7
chapter: 37
section: '37.5'
slug: 37-5-speculative-decoding
parent: ms.chapter.37
prev_sibling: ms.section.37.4
next_sibling: ms.section.37.6
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

# 37.5 — Speculative decoding

## Scope

[DERIVED] This section owns exact speculative sampling: proposal generation, acceptance, residual correction, tree/MTP extensions and the token-event identity needed by the proof. The artifact is a bounded verification transaction whose committed output has a declared target law. Runtime placement and latency are owned by §37.6. A longer accepted prefix is an algorithmic outcome; it is not automatically a faster or more accurate service. “Lossless” refers to a specified distributional contract, which may already include temperature, penalties and grammar restrictions.

## Why this exists

[DERIVED] Autoregressive model execution often pays a substantial cost for each sequential step. A cheap proposer can compute several possible future events, while a target processes their prefixes in a parallel teacher-forced pass. The target still has to decide which events become real. Simply accepting plausible draft text changes the distribution. Exact correction converts speculative work into a coupling between the proposal and target laws; it does not grant the proposer authority over committed content.

[PAPER-REPORTED] ResiSpec studies the declining usefulness of later sibling proposals after rejection shifts the target toward residual mass. GLM-5 reports a shared-parameter multi-token-prediction design and an accepted-length comparison. They concern different proposal mechanisms and disclose different verification detail. The source's exactness theorem is audited below rather than imported as an unqualified implementation guarantee. [R37.6, §2, method and AppendixA](references.md#r376) [R37.7, §2.1, Table 2](references.md#r377)

## Intuition

[MATHEMATICALLY-DERIVED] At one position, a proposed token contributes accepted mass equal to the overlap of target and proposal probabilities. Rejection occurs on the proposal's excess mass. A correct fallback places exactly that missing mass in the target's excess region. This decomposition is the reason an imperfect draft can accelerate generation without changing the target. It also explains why the fallback cannot be replaced by any normalized distribution merely because that distribution looks close to the draft.

[DERIVED] The target and proposer must describe the same event at the same committed prefix. Equal token identifiers are insufficient if tokenizer decoding, history penalties, grammar state or temperature differ. Exactness concerns the output law, whereas deterministic replay concerns a particular coupling and random-number schedule. Two exact algorithms can generate different individual texts under the same integer seed. Conversely, identical texts on a small sample cannot establish equality of laws.

## Formulation

| Local object | Meaning | Unit / condition |
|---|---|---|
| $p(v\mid h),q(v\mid h)$ | Processed target and actual proposal laws | Same finite token-event space, normalized |
| $a(v)$ | Conditional acceptance probability | $[0,1]$ for events with $q(v)>0$ |
| $A,Z$ | Accepted mass and rejection probability | $A+Z=1$ |
| $R$ | Conditional fallback law after rejection | Defined only when $Z>0$ |
| $k_x,R_x$ | Sample-dependent proxy and fallback | May depend on rejected proposal $x$ |
| $\mathcal T,d,b$ | Candidate tree, depth and branching factor | Explicit topology and proposal mechanism |

[MATHEMATICALLY-DERIVED] For a proposal $X\sim q$, accept with probability $\min(1,p(X)/q(X))$. Events with $q(v)=0$ are never proposed; their target mass remains eligible for fallback. The exact one-position decomposition is:

$$
a(v)=\min\!\left(1,\frac{p(v)}{q(v)}\right),\quad A=\sum_v\min(p(v),q(v)),\quad Z=1-A=\sum_v(p(v)-q(v))_+,\qquad R(v)=\frac{(p(v)-q(v))_+}{Z},\quad \Pr(Y=v)=\min(p(v),q(v))+Z R(v)=p(v).
$$
*(Eq. 37.13)*

where $a(v)$ is evaluated only for a sampled event with positive $q(v)$. When $Z=0$, the two laws agree and rejection is a probability-zero event; no residual division is executed. Equality of the positive and negative total differences follows from both laws summing to one. This is an independent finite-law derivation, not a claim of a new 2026 invention.

```figure
{
  "id": "fig-37.25",
  "kind": "calculator",
  "title": "Overlap and exact output mass",
  "caption": "Two-event illustrative laws are p=(p,1-p), q=(q,1-q). The readout computes unconditional accepted and corrected mass without evaluating an undefined residual when p=q. It is not a model acceptance measurement.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.13",
  "alt": "Adjust the declared illustrative inputs; accepted probability=1-abs(p-q), rejection probability=abs(p-q), exact output probability of a=min(p,q)+max(0,p-q). Two-event illustrative laws are p=(p,1-p), q=(q,1-q). The readout computes unconditional accepted and corrected mass without evaluating an undefined residual when p=q. It is not a model acceptance measurement.",
  "spec": {
    "tex": "A=1-|p_a-q_a|,\\quad p_{\\rm out}(a)=\\min(p_a,q_a)+(p_a-q_a)_+",
    "equation": "37.13",
    "inputs": [
      {
        "symbol": "p",
        "label": "target probability of event a",
        "default": 0.4,
        "min": 0.05,
        "max": 0.95,
        "format": "raw",
        "step": 0.01
      },
      {
        "symbol": "q",
        "label": "proposal probability of event a",
        "default": 0.7,
        "min": 0.05,
        "max": 0.95,
        "format": "raw",
        "step": 0.01
      }
    ],
    "outputs": [
      {
        "symbol": "A",
        "label": "accepted probability",
        "formula": "1-abs(p-q)",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "Z",
        "label": "rejection probability",
        "formula": "abs(p-q)",
        "format": "raw",
        "emphasis": false
      },
      {
        "symbol": "out",
        "label": "exact output probability of a",
        "formula": "min(p,q)+max(0,p-q)",
        "format": "raw",
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
        "p": 0.4,
        "q": 0.4
      },
      "note": "Equal target and proposal laws accept every draw; no residual division is needed."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "p": 0.4,
        "q": 0.7
      },
      "note": "Excess proposal mass on event a is corrected toward event b."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "p": 0.7,
        "q": 0.4
      },
      "note": "Reversing the mismatch moves residual mass to event a while preserving the target law."
    }
  ]
}
```

[MATHEMATICALLY-DERIVED] If each committed event is conditionally distributed according to the target at that exact prefix, the joint response law follows by multiplying the conditional factors. The draft may depend on previous draft tokens, but each target verification must use their matching ancestor prefix:

$$
\Pr(Y_{1:m}=y_{1:m}\mid x)=\prod_{t=1}^{m}p(y_t\mid x,y_{<t}),\qquad q_t=q(\cdot\mid x,y_{<t}),\quad p_t=p(\cdot\mid x,y_{<t}).
$$
*(Eq. 37.14)*

where $m$ counts committed events, with EOS and caps interpreted by §37.2. For a drafted path, later positions are reachable only after earlier proposals are accepted. A correction discards descendant proposals whose conditioning prefix no longer matches. This induction requires the one-step law to hold conditional on all reachable verification state.

## Mechanism

### Methodology

[DERIVED] In sequential drafting, generate up to $d$ events and retain their actual normalized proposal laws or sufficient exact representations. A target pass evaluates the matching drafted prefixes. Verify from the first event onward. At the first rejection, sample one residual event and discard the remaining draft path. If every draft event is accepted, an additional target event can be sampled from the final target row, subject to the remaining cap and stop policy. That bonus is a new event, not an automatically accepted proposal. EOS can terminate inside the accepted block, preventing later computed events from becoming output.

```figure
id: fig-37.26
kind: diagram
title: One speculative block has a commit frontier
caption: Target computation can be parallel while commitment remains prefix ordered. A rejected event changes the prefix and
  invalidates its descendants. External streaming follows the committed frontier only.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.14
alt: The information path is Draft path, then Target rows, then Sequential verify, then Commit frontier, then Rollback tail.
  Target computation can be parallel while commitment remains prefix ordered. A rejected event changes the prefix and invalidates
  its descendants. External streaming follows the committed frontier only.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: model
    label: Draft path
    sub: actual proposal laws q
  - id: n1
    kind: tensor
    label: Target rows
    sub: same ancestor prefixes
  - id: n2
    kind: process
    label: Sequential verify
    sub: overlap then residual
  - id: n3
    kind: boundary
    label: Commit frontier
    sub: accepted prefix plus correction
  - id: n4
    kind: state
    label: Rollback tail
    sub: discard mismatched descendants
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

[DERIVED] A tree replaces one draft path with several possible children. A tree-attention mask must expose only each node's ancestors and the original prompt; sibling leakage evaluates the wrong conditional law. At a node, sequentially testing iid siblings against updated residual target laws can apply the same decomposition repeatedly. The proposal law for the next sibling must remain its actual law conditional on the entire preceding rejection history. Sampling without replacement, correlated candidate construction, top-k deterministic enumeration and branch reuse require their own conditional probabilities. Calling all of them “q” does not supply an exactness proof.

[PAPER-REPORTED] ResiSpec's stated baseline draws sibling candidates from the original draft law and updates the target residual after rejection. Its mechanism constructs a proxy $k=p-r+s$ with $0\le r\le p$, disjoint residual/slack supports, and equal residual/slack mass $Z$. The proxy matches $q$ at the currently proposed event, while the fallback is normalized $(p-k)_+$. Its algorithm places slack at the rejected token and clips/distributes residual mass elsewhere to make that residual resemble the original draft. This addresses an actual acceptance-efficiency concern, but the proxy can depend on which event was sampled. [R37.6, §2, method, Algorithm 1](references.md#r376)

[PAPER-REPORTED] More precisely, the printed Algorithm 1 initializes a current residual target $R\leftarrow p$ and retains the original proposal $q$. Each of at most $k$ siblings is sampled from $q$, tested against $R(x)/q(x)$, and either returned or followed by `GetProxy(R,q,x)` and $R\leftarrow(R-K)_+/\sum(R-K)_+$. Exhausting the siblings samples from the last residual. The rejected event therefore influences the proxy and every subsequent residual. A fixed-proxy argument cannot be substituted for this candidate-dependent transition. [R37.6, Algorithm 1 lines3–16](references.md#r376)

[DERIVED] A guarded reconstruction of the source's printed `GetProxy` branch uses current target $p$, actual proposal $q$ and a rejected event $x$ with $q(x)>p(x)$. Initialize $Z=q(x)-p(x)>0$, set $r_x=0$, and set $r_i=\min(Zq_i,p_i)$ for $i\ne x$. Compute deficit $\Delta=Z-\sum_i r_i$. Distribute that deficit only over $i\ne x$ with remaining capacity $p_i-r_i$, then set $s=Z e_x$ and $k=p-r+s$. This supplies $k_x=p_x+Z=q_x$, equal residual/slack totals and normalization. Excluding $x$ from redistribution is required to retain local alignment and disjointness; setting $k_x$ again after violating those conditions is not a normalization repair. The total non-$x$ capacity is sufficient in exact arithmetic because $Z=q_x-p_x\le1-p_x$.

$$
\begin{aligned}
&\textbf{Procedure 37.5a: guarded reconstruction of the printed proxy branch}\\
&1.\quad\text{validate }p,q,\ q_x>p_x;\ Z\leftarrow q_x-p_x;\ r_x\leftarrow0;\ r_i\leftarrow\min(Zq_i,p_i)\ (i\ne x).\\
&2.\quad\Delta\leftarrow Z-\sum_i r_i;\ \mathcal I\leftarrow\text{declared finite order of non-}x\text{ events}.\\
&3.\quad\textbf{for }i\in\mathcal I:\ \eta\leftarrow\min(\max(\Delta,0),p_i-r_i);\ r_i\leftarrow r_i+\eta;\ \Delta\leftarrow\Delta-\eta.\\
&4.\quad\textbf{if deficit exceeds tolerance or invariants fail: return PROXY\_CONSTRUCTION\_FAILURE}.\\
&5.\quad s\leftarrow Z e_x;\ k\leftarrow p-r+s;\ \text{return }k,\ r/Z\text{ and unresolved exactness status}.
\end{aligned}
$$

[DERIVED] The declared finite filling order makes this reconstruction bounded and reproducible; it is a book-specified completion of the paper's unspecified redistribution policy, not a claim that its repository uses that order. Invariants are $r_x=0$, $0\le r\le p$, $\sum r=Z$, $r_i s_i=0$ and $\sum k=1$. There are $O(V)$ reductions/updates and vocabulary memory traffic, with no added model forward in this branch. The paper's prose Eq 13 also uses $\max(Z^*,|q_x-p_x|)$ whereas its printed algorithm initializes the local discrepancy alone. These are not silently treated as one executable recipe. A larger budget would need additional slack placement while maintaining normalization/local alignment; the inspected pseudocode does not fully specify it. None of these local invariants discharges the marginal condition below. [R37.6, Eq 13 and Algorithm 1 lines17–23](references.md#r376)

[MATHEMATICALLY-DERIVED] For sample-dependent fallback $R_x$, local alignment $k_x(x)=q(x)$ preserves accepted mass at $x$ but does not prove the output marginal. The exact remaining obligation is:

$$
\Pr(Y=v)=\min(p(v),q(v))+\sum_x(q(x)-p(x))_+R_x(v)\stackrel{!}{=}p(v).
$$
*(Eq. 37.15)*

where The rejection-conditioned mixture must supply the missing target mass at every event $v$. Replacing the sample-indexed family $k_x$ by one fixed $k$ while summing over $x$ is unjustified without an additional identity. The standard common residual from Eq 37.13 satisfies this condition.

[MATHEMATICALLY-DERIVED] A finite counterexample isolates that obligation. Let $p=(.4,.3,.3)$ and $q=(.6,.3,.1)$. Only event $a$ can be rejected. Choose its proxy $k_a=(.6,.2,.2)$: it is normalized and matches $q(a)$. Here $r=(p-k_a)_+=(0,.1,.1)$, slack $s=(.2,0,0)$ is disjoint, both masses equal $.2$, and $R_a=(0,.5,.5)$. All named local conditions hold. The resulting output is:

$$
\underbrace{(.4,.3,.1)}_{\text{accepted mass}}+\underbrace{.2(0,.5,.5)}_{\text{rejection fallback}}=(.4,.4,.2)\ne(.4,.3,.3)=p.
$$
*(Eq. 37.16)*

where The standard residual would be $(0,0,1)$ and restores $p$. This counterexample identifies an insufficiency in the inspected v1 theorem conditions; it does not establish the behavior of every uninspected implementation or deny the paper-reported runtime measurements.

```figure
id: fig-37.27
kind: matrix
title: Local alignment does not determine the output marginal
caption: Rows are target p, accepted mass, and resulting output for the sample-dependent proxy counterexample. Columns are
  a,b,c. Each row is numerical probability mass, not a binary adjacency mask. Accepted mass sums to0.8; the final row sums
  to1 but differs from p.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.16
alt: Each filled cell denotes an admitted relationship. Rows are target p, accepted mass, and resulting output for the sample-dependent
  proxy counterexample. Columns are a,b,c. Each row is numerical probability mass, not a binary adjacency mask. Accepted mass
  sums to0.8; the final row sums to1 but differs from p.
spec:
  rows: 3
  cols: 3
  pattern: explicit
  cells:
  - - 0.4
    - 0.3
    - 0.3
  - - 0.4
    - 0.3
    - 0.1
  - - 0.4
    - 0.4
    - 0.2
  rowLabel: target / accepted / output
  colLabel: a / b / c
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

## Algorithm

### Algorithm 37.5 — bounded exact speculative transaction

[DERIVED] Algorithm 37.5 specifies the conservative sequential exact family. Inputs are frozen target/proposer contracts, common event identities, positive-integer draft limit $d$, remaining committed-event cap $K$ and a deadline. `Commit` advances the logical prefix and parser/delivery state only for verified events. A cache can lag a newly sampled correction until its next prefill; its metadata must distinguish that pending event from already materialized KV rows.

$$
\begin{aligned}
&1.\quad h\leftarrow h_0;\ n\leftarrow0;\ r_f\leftarrow\mathrm{RUNNING};\ \text{snapshot committed cache/parser state}.\\
&2.\quad\textbf{while }n<K\textbf{ and before deadline and running}:\\
&3.\qquad L\leftarrow\min(d,K-n);\ (x_{1:L'},q_{1:L'})\leftarrow\operatorname{BoundedDraft}(h,L);\\
&\qquad\textbf{if error/timeout or not }1\le L'\le L:\ \textbf{return named failure at committed frontier}.\\
&4.\qquad p_{1:L'+1}\leftarrow\operatorname{TargetVerify}(h,x_{1:L'};\text{remaining deadline});\\
&\qquad\textbf{if target error/timeout: return TARGET\_ERROR/TIMEOUT before accessing rows};\ j\leftarrow1.\\
&5.\qquad\textbf{while }j\le L'\textbf{ and running}:\ \text{validate normalized same-event }p_j,q_j\text{ and }q_j(x_j)>0;\\
&\qquad\quad U_j\sim\operatorname{Uniform}[0,1)\text{ fresh conditional-independent of proposal/history};\\
&\qquad\quad\textbf{if }U_j<\min(1,p_j(x_j)/q_j(x_j)):\ \operatorname{Commit}(x_j);\ n\leftarrow n+1;\ j\leftarrow j+1;\\
&6.\qquad\quad\textbf{else}:\ r\leftarrow(p_j-q_j)_+;\ Z\leftarrow\sum_v r(v);\\
&\qquad\qquad\textbf{if }Z\le0\text{ or nonfinite: return NUMERICAL\_RESIDUAL\_FAILURE};\\
&\qquad\qquad v\sim r/Z;\ \operatorname{Commit}(v);\ n\leftarrow n+1;\ \textbf{break}.\\
&7.\qquad\textbf{if all }L'\text{ accepted and }n<K\textbf{ and running}:\\
&\qquad\quad\text{validate normalized finite bonus law }p_{L'+1};\ v\sim p_{L'+1};\ \operatorname{Commit}(v);\ n\leftarrow n+1.\\
&8.\qquad\operatorname{RollbackAndScheduleCommittedPrefix}(h);\ \text{release all uncommitted descendants}.\\
&9.\quad\text{return committed prefix, EOS/CAP/DEADLINE/failure, and separate computed-token counters}.
\end{aligned}
$$

[DERIVED] Every model/event call must obey the remaining deadline; target failure returns the last committed frontier. Positive $q_j(x_j)$ is guaranteed only by a valid actual proposal draw and must be checked when importing cached proposals. `Commit` immediately applies the stop contract, so a natural ending prevents bonus output. In exact arithmetic, rejection with zero residual mass is unreachable. Numeric inconsistency is recorded as failure rather than repaired with an arbitrary target or uniform draw. Model fallback can restart a fresh target-only step at the committed prefix if it is an explicitly logged recovery transaction; it cannot silently complete a failed residual step under a false exactness certificate.

## Implementation

[DERIVED] Implementation route: **vLLM** (reference-stack §4 #41, **LLM inference engine**; §4.1 **INFERENCE ENGINE**), v0.31.0 at full commit db9527a46873454610df6dbedf79a36d6bf1a7f6. Source inspection establishes disclosed behavior, not an executed deployment.

[OFFICIAL-DOCUMENTATION] The pinned V2 rejection sampler applies the target's sampling parameters before verification. Its verification utilities form draft probabilities from cached logits and their temperature convention, compare log probabilities against a uniform draw, and compute the positive-difference residual with stable log-domain operations. When the proposal representation is a one-hot event, its residual path removes that event rather than pretending a full draft distribution is available. Greedy, synthetic-acceptance and alternative verification modes have different contracts; a source path supporting them does not prove every configuration is distribution-preserving. [R37.1, gpu/spec_decode/rejection_sampler.py and rejection_sampler_utils.py](references.md#r371)

[DERIVED] Retain target and draft processor identities with each row. Full-logit draft probabilities, truncated probabilities, temperature-adjusted probabilities and raw model probabilities are distinct objects. An implementation that verifies a top-p proposal with its pre-truncation likelihood uses the wrong $q$. Penalty/grammar states must replay along exactly the selected path. FP32 probability reductions can improve numerical stability but do not establish exact real-arithmetic equivalence or eliminate finite-support mismatch. Greedy matching can preserve a deterministic target decision without using the stochastic residual proof.

[MATHEMATICALLY-DERIVED] Different vocabularies require an actual event transformation. For a prefix-compatible deterministic map $\phi$ from draft events to target events, the induced proposal law is a pushforward:

$$
q_{\rm target}(v\mid h)=\sum_{u:\phi_h(u)=v}q_{\rm draft}(u\mid h),\qquad \operatorname{Decode}_{T}(h\Vert\phi_h(u))=\operatorname{Decode}_{D}(\tilde h\Vert u).
$$
*(Eq. 37.17)*

where The decoding identity must remain prefix-compatible, including incremental state. Many-to-one maps sum mass; a one-to-many tokenization requires a sequence-level event construction rather than this single-event formula. Equality of normalized vocabulary strings is only a candidate alignment heuristic, not this complete contract.

[OFFICIAL-DOCUMENTATION] vLLM's vocabulary mapper intersects normalized token strings, keeps the first duplicate and masks unmapped draft entries, with a configured unknown/EOS fallback. That code establishes its actual matching procedure. It does not supply a general homomorphism proof for arbitrary tokenizer pairs or justify ignoring many-to-one proposal mass. [R37.1, v1/spec_decode/vocab_mapping.py](references.md#r371)

```figure
{
  "id": "fig-37.28",
  "kind": "chart",
  "title": "Draft depth and bounded progress",
  "caption": "An illustrative homogeneous conditional-acceptance model with no EOS/cap truncation and one correction or bonus event. At integer depth d, expected progress is1+alpha+...+alpha^d. Acceptance is held constant solely to expose diminishing progress; it is not a source measurement or a general independence claim. The points are legal integer draft depths; the horizontal ceiling requires the declared homogeneous conditional-acceptance model.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.14",
  "alt": "Analytical curves: constant acceptance0.8 equals (1-pow(0.8,x+1))/0.2, constant acceptance0.5 equals (1-pow(0.5,x+1))/0.5. An illustrative homogeneous conditional-acceptance model with no EOS/cap truncation and one correction or bonus event. At integer depth d, expected progress is1+alpha+...+alpha^d. Acceptance is held constant solely to expose diminishing progress; it is not a source measurement or a general independence claim.",
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
      "label": "expected committed events per block",
      "scale": "linear"
    },
    "series": [
      {
        "id": "s0",
        "label": "constant acceptance0.8",
        "formula": "(1-pow(0.8,x+1))/0.2",
        "sample": {
          "to": 16,
          "count": 16,
          "from": 1
        }
      },
      {
        "id": "s1",
        "label": "constant acceptance0.5",
        "formula": "(1-pow(0.5,x+1))/0.5",
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
        "y": 1.8,
        "label": "Depth1; acceptance0.8:1.8 events"
      },
      {
        "x": 16,
        "y": 4.8874100093157375,
        "label": "Depth16 approaches the5-event ceiling"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-37.29",
  "kind": "memory-stack",
  "title": "Full proposal laws carry a declared representation cost",
  "caption": "Eq.37.14 illustrative B=4,depth5,V=32000,4-byte probabilities: retaining every proposal distribution costs2,560,000bytes. Recomputing or streaming can change residency; exact correction still requires the admitted event law. Target verification logits, KV state, sampler state and transport are additional.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.14",
  "alt": "One bar contains B×depth×V×4bytes for retained proposal distributions, equal to2,560,000bytes in the default. Increasing draft depth increases this declared representation cost. It is not inevitable residency for a streaming implementation and is not measured GPU memory.",
  "spec": {
    "format": "bytes",
    "variables": {
      "B": 4,
      "d": 5,
      "V": 32000,
      "s": 4
    },
    "bars": [
      {
        "label": "All retained proposal probability rows",
        "segments": [
          {
            "label": "B×depth×V probabilities",
            "kind": "memory",
            "formula": "B*d*V*s"
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
        "d": 1
      },
      "note": "One proposal row per request under this materialization."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "d": 5
      },
      "note": "Five retained draft rows per request."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "d": 16
      },
      "note": "Longer drafts increase full-law storage even if progress saturates."
    }
  ]
}
```

[DERIVED] Resource accounting includes proposer weights or MTP heads, both models' relevant KV state, candidate-node activations, vocabulary rows, tree masks and rollback metadata. Frozen inference requires no optimizer or gradient tensors. A shared MTP head can reduce additional parameter residency but still has distinct predicted positions, execution and state. Compression of $q$ must preserve whatever acceptance/residual information the selected proof needs; merely retaining the proposed token's probability does not reconstruct a general full residual.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The table reconstructs disclosed source experiments; it does not describe book-executed tests.

| Protocol field | ResiSpec main and ablation study | GLM-5 MTP comparison |
|---|---|---|
| Model/checkpoint | Llama-2-7B target and JackFram/Llama-68M draft; additional Vicuna/Sheared-Llama pairs in appendices; exact hashes NOT-DISCLOSED | GLM-5 versus DeepSeek-V3.2; GLM-5 shared MTP parameters across 3 training layers |
| Workload/split | CNN/DM, OpenWebText and C4;200 fixed-order examples per run, generation budget 512 | Private prompts; identities/counts/split NOT-DISCLOSED |
| Proposal/evaluator | Main complete tree depth 5, branching 3; reported accepted length and generated tokens/wall time |4 speculative steps; average accepted length |
| Sampling | Temperatures1.0/.6, top-p 1.0 in main comparison | Temperature/top-p/processor contract NOT-DISCLOSED |
| Hardware/precision | Single RTX3090; precision NOT-DISCLOSED | NOT-DISCLOSED for Table 2 comparison |
| Seeds/uncertainty | Python/NumPy/Torch/CUDA seeding and per-example base-plus-index scheme; base identifier and independent-run intervals NOT-DISCLOSED | Seeds and uncertainty NOT-DISCLOSED |
| Training/optimizer | No speculative training budget disclosed for this inference intervention; existing model artifacts | MTP training design disclosed, isolated Table 2 training-budget equivalence NOT-DISCLOSED |
| Ablations | Tree topologies, candidate widths, proxy variants and integration with Sequoia/EAGLE | Shared MTP design and accepted-length comparison; isolated latency ablation NOT-DISCLOSED |

[PAPER-REPORTED] ResiSpec AppendixC separates warmup and timed generation, uses containerized processes and defines throughput by generated tokens divided by wall time. Its EAGLE/Sequoia integrations use additional settings, including an EAGLE-family128-token budget and published grow maps; their protocol must not be silently equated with the main512-token experiment. Its Table 4 KL values are calculated through the AppendixB path-marginal derivation, which inherits a cancellation assumption requiring the sample-dependence audit above. [R37.6, Tables1–4, AppendixB–D](references.md#r376)

```figure
{
  "id": "fig-37.39",
  "kind": "memory-stack",
  "title": "Accepted and residual masses reconstruct the target law",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.13",
  "caption": "Eq.37.13 binary p=(0.4,0.6),q=(0.7,0.3). Unconditional accepted masses are(0.4,0.3); rejection-correction masses are(0,0.3),so the emitted law is exactly(0.4,0.6). At p=q,all draws are accepted and no residual normalization is evaluated. This is a one-step exact-law derivation,not a measured acceptance rate.",
  "alt": "Two event bars partition emitted mass into accepted proposal mass and residual correction mass. At the default,event a has0.4 accepted and0 corrected;event b has0.3 accepted and0.3 corrected. The total across both events is one and equals the target law.",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared boundary",
      "variables": {
        "p": 0.4,
        "q": 0.4
      },
      "note": "Equal laws require no residual draw."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "p": 0.4,
        "q": 0.7
      },
      "note": "Excess proposal mass on event a produces correction toward event b."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "p": 0.7,
        "q": 0.4
      },
      "note": "Reverse mismatch moves correction to event a; emitted mass still equals p."
    }
  ],
  "spec": {
    "format": "raw",
    "variables": {
      "p": 0.4,
      "q": 0.7
    },
    "bars": [
      {
        "label": "Emitted event a",
        "segments": [
          {
            "label": "Accepted proposal mass",
            "kind": "model",
            "formula": "min(p,q)"
          },
          {
            "label": "Unconditional correction mass",
            "kind": "feedback",
            "formula": "max(0,p-q)"
          }
        ]
      },
      {
        "label": "Emitted event b",
        "segments": [
          {
            "label": "Accepted proposal mass",
            "kind": "model",
            "formula": "min(1-p,1-q)"
          },
          {
            "label": "Unconditional correction mass",
            "kind": "feedback",
            "formula": "max(0,q-p)"
          }
        ]
      }
    ]
  }
}
```

## Observations

**What the paper claims.** [PAPER-REPORTED] ResiSpec claims residual shaping improves multi-candidate efficiency while preserving the target distribution. GLM-5 reports accepted length2.76 versus 2.55 for DeepSeek-V3.2 at 4 speculative steps. [R37.6, abstract and method](references.md#r376) [R37.7, Table 2](references.md#r377)

**What the evidence shows.** [PAPER-REPORTED] At temperature 1.0 on CNN/DM, ResiSpec Table 1 reports accepted length4.68 and96.43 tokens/s versus SpecInfer2.51 and57.29 tokens/s, about 1.68× throughput under that protocol. Its topology ablation reports 101.01 versus 52.69 tokens/s for depth 7/branching 2, about 1.92×, while broader trees have different absolute rates. Table 4 reports KL values near numerical zero, including values around$10^{-10}$–$10^{-9}$, through the disclosed analytical marginal calculation. Those values do not independently discharge the sample-dependent-proxy condition. The GLM table measures accepted length on private prompts and does not disclose matched end-to-end latency. [R37.6, Tables1,3,4 and AppendixB](references.md#r376) [R37.7, §2.1](references.md#r377)

**What we infer.** [MATHEMATICALLY-DERIVED] The finite counterexample shows the v1 local alignment/disjointness conditions are insufficient for the general exactness claim as stated. It does not refute every implementation outcome or the reported time measurements. For deployment, an alternative proxy needs a complete conditional-mixture proof or an explicitly approximate distribution contract. Longer accepted paths are useful only if their target/proposal event laws, state transitions and actual time cost are also acceptable.

**What remains unknown.** [NOT-DISCLOSED] Exact checkpoint revisions, several precision fields and independent-seed uncertainty are missing from the source protocols. A reviewed correction establishing the general sample-dependent proxy theorem was not found in the inspected v1. Private GLM prompts do not establish public workload acceptance or a service-level speedup. No implementation execution or empirical exactness certification is claimed here.

## Failure modes

[DERIVED] Common failures are raw-versus-processed likelihood mismatch, sibling-contaminated attention, descendants retained after correction, invalid EOS inside a block, replayed penalty counts, duplicated delivery, residual underflow and tokenizer misalignment. Additional failures arise when iid sibling assumptions are reused for dependent proposal sets, or when a candidate-dependent proxy is treated as fixed during marginalization. A tree can be probability-correct yet slower because its verification rows and scheduler costs exceed the accepted-token gain.

## Siblings

```figure
id: fig-37.30
kind: compare
title: Three proposal families need separate contracts
caption: The table specifies proof obligations, not universal implementation equivalence. An MTP architectural design does
  not automatically choose a stochastic correction algorithm.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.14
alt: 'Comparison on Proposal mechanism. Conditional object: s=one prefix-conditioned proposal path, t=joint candidate mechanism
  plus rejection history, m=position/head-conditioned proposal law. Target verification: s=path ancestry, t=tree ancestry
  mask, m=declared multi-step verification. Exactness obligation: s=Eq37.13 at each reachable position, t=conditional residual
  law at each sibling transition, m=same-event proof; sharing alone proves none'
spec:
  axis: Proposal mechanism
  columns:
  - id: s
    label: Sequential draft
  - id: t
    label: Sibling/tree candidates
  - id: m
    label: Shared MTP head
  rows:
  - dimension: Conditional object
    values:
      s: one prefix-conditioned proposal path
      t: joint candidate mechanism plus rejection history
      m: position/head-conditioned proposal law
  - dimension: Target verification
    values:
      s: path ancestry
      t: tree ancestry mask
      m: declared multi-step verification
  - dimension: Exactness obligation
    values:
      s: Eq37.13 at each reachable position
      t: conditional residual law at each sibling transition
      m: same-event proof; sharing alone proves none
```

## Extensions

### Improvements

[PAPER-REPORTED] The 2026 ResiSpec proposal targets residual drift, while GLM-5 targets economical multi-token proposal parameters. The pinned vLLM release supplies concrete verification, log-domain residual and chunked processing paths. These are source-supported developments at different layers. Their gains cannot be multiplied without a combined controlled measurement; a proof gap is not repaired by a favorable throughput table. [R37.6, method and experiments](references.md#r376) [R37.7, §2.1](references.md#r377) [R37.1, rejection sampler paths](references.md#r371)

## Limitations

[DERIVED] Exactness here is conditional on correct normalized laws, shared events, conditional proposal semantics and faithfully maintained prefix state. Floating-point kernels approximate those objects. A theoretical identity is not a bitwise guarantee; a sampled divergence estimate is not a proof. Tree proposal selection and tokenizer translation can each add unverified assumptions. The inspected evidence supports specific current mechanisms and reported protocols, not a universal current speed frontier.

## Reproducibility

[DERIVED] Preserve model/tokenizer/configuration pins, per-position processed target/proposal law identities, proposal topology and conditional sampling mechanism. Store both computed and committed counts, rejection position, residual normalization, cache/parser rollback and finish reason. Record whether log probabilities are raw, transformed, truncated or one-hot. An exactness claim must state the event space and theorem conditions independently of wall-clock outcomes. The book verification plan specifies finite-law checks and proposed runtime ablations separately from the source-reported evidence.

## References

[DERIVED] R37.1 supplies the exact official release/code pin; R37.6 supplies the residual-shaping method, reported experiments and audited v1 proof; R37.7 supplies the bounded MTP report. Equations37.13–37.17 and the counterexample are independent derivations. No pre-window paper is admitted by a later revision.
