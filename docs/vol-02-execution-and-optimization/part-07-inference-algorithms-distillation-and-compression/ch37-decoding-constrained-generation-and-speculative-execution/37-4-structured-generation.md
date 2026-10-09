---
id: ms.section.37.4
entity_type: section
title: Structured generation
short_title: Structured generation
volume: 2
part: 7
chapter: 37
section: '37.4'
slug: 37-4-structured-generation
parent: ms.chapter.37
prev_sibling: ms.section.37.3
next_sibling: ms.section.37.5
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

# 37.4 — Structured generation

## Scope

[DERIVED] This section owns constrained output languages: finite-state and stack-based grammar masks, JSON/schema realization, tool-argument validation and the boundary of semantic correctness. Its baseline is unconstrained generation plus post-hoc validation. Success is explicit structural validity with separately measured task utility. A locally constrained distribution is not automatically the original model conditioned on eventual validity. Draft-conditioned generation changes the model context; its purpose and cost differ from exact speculative acceleration.

## Why this exists

[DERIVED] Retrying malformed outputs wastes model tokens and can still leave an unbounded failure probability. Incremental constraints prevent some malformed continuations before they are sampled. They also remove model-supported events and can exclude useful outputs when the implemented grammar is incomplete. The correct question is which language was enforced, whether prefixes remain completable under the resource cap, and which properties remain outside that language. “Valid JSON” does not establish schema adherence, tool authorization, faithful extraction or mathematical truth.

[PAPER-REPORTED] Eligible 2026 evidence separates these concerns. DCCD studies constrained reasoning and format realization; PSC studies parser-mask efficiency and its lexer failures; the structural/semantic study reports schema-valid but incomplete function calls; the SQL beam study identifies correct queries excluded by an incomplete grammar. Their workloads support different claims and must not be combined into one universal “structured output improves accuracy” statement. [R37.2](references.md#r372) [R37.3](references.md#r373) [R37.4](references.md#r374) [R37.5](references.md#r375)

## Intuition

[MATHEMATICALLY-DERIVED] A recognizer updates state when bytes or characters arrive. Token generation requires composing that recognizer with the tokenizer's decoded events: one token can contain several delimiters, half a multi-byte character or a complete identifier. Testing token spellings as isolated strings can therefore be wrong. A mask must represent exactly the events that preserve an extendable prefix, using the actual incremental decoding contract and declared grammar semantics.

[DERIVED] Finite-state constraints remember a finite automaton state. General nested structures need stack state, or a deliberately bounded-depth expansion with a finite state explosion. A schema can add field names, required keys, enums and numeric/string restrictions, but arbitrary cross-field truth is not obtained by syntactic masking. A tool call needs layered validation: parse and schema, authorized tool/arguments, semantic preconditions and controlled execution. The first two can be machine-checkable without solving the last two.

## Formulation

[MATHEMATICALLY-DERIVED] Let $\mathcal L$ be a declared output language including its EOS/termination convention. Define $\mathcal A(h)$ as token events whose appended decoded prefix has some valid completion. For model law $p$ and positive feasible mass $\alpha(h)$, local renormalization is:

$$
\alpha(h)=\sum_{v\in\mathcal A(h)}p(v\mid h),\qquad q_{\rm local}(v\mid h)=\frac{p(v\mid h)\mathbf1\{v\in\mathcal A(h)\}}{\alpha(h)},\qquad \mathrm{KL}(q_{\rm local}\|p)=-\log\alpha(h).
$$
*(Eq. 37.9)*

where $\alpha(h)>0$ and legality is represented correctly. The KL identity follows because the log ratio is constant $-\log\alpha(h)$ on surviving support. It is a local projection identity, not a semantic-accuracy theorem. DCCD §3 Eq 4–8 states this same projection analysis.

```figure
{
  "id": "fig-37.19",
  "kind": "calculator",
  "title": "Feasible mass and projection distortion",
  "caption": "Equal feasible mass at mpositions is an illustrative path calculation. Expected sequence KL averages these terms under the constrained path law; this is not measured accuracy.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.9",
  "alt": "Adjust the declared illustrative inputs; local reverse KL in nats=-ln(a), sum of local log-normalizer terms=-m*ln(a), valid-path reweight factor=exp(-m*ln(a)). Equal feasible mass at mpositions is an illustrative path calculation. Expected sequence KL averages these terms under the constrained path law; this is not measured accuracy.",
  "spec": {
    "tex": "D_{\\rm local}=-\\log\\alpha,\\quad D_{\\rm path}=m(-\\log\\alpha)",
    "equation": "37.9",
    "inputs": [
      {
        "symbol": "a",
        "label": "illustrative feasible mass",
        "default": 0.25,
        "min": 0.01,
        "max": 1,
        "format": "raw",
        "step": 0.01
      },
      {
        "symbol": "m",
        "label": "equal-mass constrained positions",
        "default": 16,
        "min": 1,
        "max": 128,
        "format": "integer",
        "step": 1
      }
    ],
    "outputs": [
      {
        "symbol": "d",
        "label": "local reverse KL in nats",
        "formula": "-ln(a)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "path",
        "label": "sum of local log-normalizer terms",
        "formula": "-m*ln(a)",
        "format": "fixed3",
        "emphasis": false
      },
      {
        "symbol": "weight",
        "label": "valid-path reweight factor",
        "formula": "exp(-m*ln(a))",
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
        "a": 1,
        "m": 16
      },
      "note": "A full feasible set creates no local projection tax."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "a": 0.25,
        "m": 16
      },
      "note": "Repeated local normalization changes the path law."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "a": 0.01,
        "m": 128
      },
      "note": "Small feasible masses can yield very large path reweighting without establishing semantic quality."
    }
  ]
}
```

[MATHEMATICALLY-DERIVED] Global conditioning additionally depends on the probability of valid future completion. For a finite stopping contract let $C(h)=P_p(\text{eventual valid completion}\mid h)$. When $C(h)>0$:

$$
q_{\rm global}(v\mid h)=p(v\mid h)\frac{C(hv)}{C(h)},\qquad C(h)=\sum_vp(v\mid h)C(hv).
$$
*(Eq. 37.10)*

where completed valid states have $C=1$ and invalid/cap-failed terminal states have $C=0$. Local masking replaces the continuation probability by a binary extendability test followed by its own normalizer. They agree only under additional equal-continuation-mass conditions on admitted events.

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Consider first events $a,b$ with probabilities.5/.5. Their only valid endings have conditional probabilities.9 and.1; other endings are invalid. Both first events are extendable, so local masking samples them.5/.5 and later forces the valid ending. Globally conditioning on validity instead gives first-event probabilities.9/.1. This finite construction disproves the claim that repeated valid-token normalization samples the original distribution conditioned on all future constraints.

```figure
id: fig-37.20
kind: matrix
title: Local projection and global conditioning
caption: Finite two-branch example. Rows are local mask sampling then globally conditioned sampling; columns are first events
  a,b. Valid future mass is0.9after a and0.1after b.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.10
alt: Each filled cell denotes an admitted relationship. Finite two-branch example. Rows are local mask sampling then globally
  conditioned sampling; columns are first events a,b. Valid future mass is0.9after a and0.1after b.
spec:
  rows: 2
  cols: 2
  pattern: explicit
  cells:
  - - 0.5
    - 0.5
  - - 0.9
    - 0.1
  rowLabel: local / global
  colLabel: a / b
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

[DERIVED] A deterministic automaton can precompute transitions for every tokenizer event and state, rejecting events with no reachable accepting continuation. A pushdown parser instead tracks a lexer state plus stack. PSC reconstructs token acceptance as a finite-state classifier *of that stack*, rather than claiming the output language itself becomes finite-state. It precomputes realizable terminal sequences, represents parser transitions through transducers, combines per-token acceptance automata and stores masks for classifier states. The online classifier scans the current stack; model logits still require applying the selected vocabulary mask.

```figure
id: fig-37.21
kind: diagram
title: Tokenizer-composed structural state
caption: Recognizer state governs token legality. Final semantic validation remains separate. PSC classifies parser-stack
  configurations; it does not flatten an unbounded nested language into a fixed-depth recognizer.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.9
alt: The information path is Grammar and vocabulary, then Offline construction, then Prefix recognizer, then Legal token mask,
  then Processed sampler, then Final validation. Recognizer state governs token legality. Final semantic validation remains
  separate. PSC classifies parser-stack configurations; it does not flatten an unbounded nested language into a fixed-depth
  recognizer.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: dependency
    label: Grammar and vocabulary
    sub: versioned pair
  - id: n1
    kind: process
    label: Offline construction
    sub: lexer/parser contract
  - id: n2
    kind: state
    label: Prefix recognizer
    sub: lexer plus stack
  - id: n3
    kind: tensor
    label: Legal token mask
    sub: V admitted events
  - id: n4
    kind: model
    label: Processed sampler
    sub: normalized legal law
  - id: n5
    kind: process
    label: Final validation
    sub: schema then task semantics
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

[PAPER-REPORTED] PSC's formal treatment assumes a deterministic terminating pushdown parser and an extendability simplification: reaching a stable parser state admits a realizable accepting continuation. These conditions belong beside the method. Its practical lexer assumes a Unicode character is contained within a token and uses one-character lookahead; the authors report edge-case rejection failures from those assumptions. Correct parser analysis does not repair an incorrect tokenizer/lexer composition. [R37.3, §§2.1,3.2,4.2](references.md#r373)

[MATHEMATICALLY-DERIVED] DCCD first samples a free-form draft and then generates constrained output with the draft added to context. The final marginal therefore changes to a mixture:

$$
Q_{\rm DCCD}(z\mid x)=\sum_d p_{\rm draft}(d\mid x)\prod_t\frac{p_{\rm proj}(z_t\mid x,d,z_{<t})\mathbf1\{z_t\in\mathcal A(x,z_{<t})\}}{\alpha_d(x,z_{<t})}.
$$
*(Eq. 37.11)*

where $\alpha_d$ normalizes the projector at the draft-conditioned prefix. The language is unchanged but the reference conditional law is changed. Multi-draft selection changes the mixture again. This is not an exact accelerator for the original prompt-only target distribution.

[PAPER-REPORTED] DCCD's method allows equal or different draft/projector models and multiple drafts. Its general Algorithm 1 selects a constrained candidate by cumulative log feasible mass; its reported majority-vote scaling instead votes over unconstrained drafts and projects the selected draft once. Those are different selection protocols. AppendixA bounds utility differences through total variation/KL relative to a fixed reference law. Larger feasible mass tightens that projection bound, but changing the draft also changes the reference law's utility; a larger feasible mass alone does not prove higher semantic accuracy. [R37.2, §4, Algorithm 1, §5.2, AppendixA](references.md#r372)

[PAPER-REPORTED] In the general multi-draft procedure, initialize candidate set $\mathcal C=\varnothing$. For each of a declared positive-integer number $K_d$ of bounded unconstrained drafts, initialize constrained prefix $z^{(k)}=\epsilon$ and score $S_k=0$. At each permitted projector step, compute $\alpha_{kt}=\sum_{v\in\mathcal A(x,z^{(k)}_{<t})}p_{\rm proj}(v\mid x,d^{(k)},z^{(k)}_{<t})$, add $\log\alpha_{kt}$ to $S_k$, and sample or greedily choose from its normalized legal law. Preserve the choice of stochastic versus greedy realization. Retain only candidates ending validly under the book's explicit cap/deadline/validator contract, then select maximal $S_k$ with a declared tie rule; an empty candidate set returns `NO_VALID_REALIZATION`. The source's printed fixed-$T$ algorithm lacks this explicit ending branch, so the book does not infer natural completion from its fixed loop. [R37.2, Algorithm 1 lines1–13](references.md#r372)

[DERIVED] $S_k=\sum_t\log\alpha_{kt}$ ranks the accumulated feasible-mass tax along the realized constrained prefix. It is not the constrained sequence log-likelihood or an independent semantic verifier. Length differences can affect this sum. Majority voting over drafts before a single projection is a different selection map; it cannot be described as selecting among $K_d$ fully projected candidates. Cost includes all $K_d$ drafts plus all realized candidate projections in the general branch, whereas vote-then-project pays multiple drafts and one projection. Any claimed comparison must preserve that distinction and the identity of the draft selected for context.

```figure
{
  "id": "fig-37.22",
  "kind": "chart",
  "title": "Local constraint distortion",
  "caption": "Exact finite-distribution identity for a positive feasible mass. The curve quantifies distribution change, not semantic damage or model confidence calibration. Log-spaced analytical samples resolve rare feasible sets; the domain extends to0.001 and contains no accuracy measurements.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.9",
  "alt": "Analytical curves: local projection tax equals -ln(x). Exact finite-distribution identity for a positive feasible mass. The curve quantifies distribution change, not semantic damage or model confidence calibration.",
  "spec": {
    "type": "line",
    "x": {
      "label": "feasible probability mass",
      "scale": "log10",
      "domain": [
        0.001,
        1
      ],
      "format": "raw"
    },
    "y": {
      "label": "reverse KL in nats",
      "scale": "linear"
    },
    "series": [
      {
        "id": "s0",
        "label": "local projection tax",
        "points": [
          [
            0.001,
            6.907755278982137
          ],
          [
            0.001071519305237606,
            6.838677726192316
          ],
          [
            0.0011481536214968829,
            6.769600173402495
          ],
          [
            0.0012302687708123812,
            6.700522620612674
          ],
          [
            0.0013182567385564075,
            6.631445067822852
          ],
          [
            0.001412537544622754,
            6.5623675150330305
          ],
          [
            0.0015135612484362087,
            6.4932899622432085
          ],
          [
            0.0016218100973589297,
            6.4242124094533875
          ],
          [
            0.0017378008287493763,
            6.3551348566635655
          ],
          [
            0.0018620871366628676,
            6.286057303873744
          ],
          [
            0.001995262314968879,
            6.216979751083923
          ],
          [
            0.0021379620895022326,
            6.147902198294101
          ],
          [
            0.0022908676527677724,
            6.078824645504281
          ],
          [
            0.002454708915685031,
            6.009747092714459
          ],
          [
            0.0026302679918953813,
            5.940669539924638
          ],
          [
            0.002818382931264455,
            5.871591987134816
          ],
          [
            0.003019951720402016,
            5.802514434344995
          ],
          [
            0.003235936569296281,
            5.733436881555174
          ],
          [
            0.0034673685045253167,
            5.664359328765352
          ],
          [
            0.003715352290971724,
            5.595281775975532
          ],
          [
            0.003981071705534973,
            5.52620422318571
          ],
          [
            0.004265795188015926,
            5.457126670395889
          ],
          [
            0.004570881896148752,
            5.388049117606067
          ],
          [
            0.004897788193684461,
            5.318971564816246
          ],
          [
            0.005248074602497723,
            5.249894012026425
          ],
          [
            0.005623413251903491,
            5.180816459236603
          ],
          [
            0.0060255958607435805,
            5.111738906446781
          ],
          [
            0.006456542290346556,
            5.0426613536569596
          ],
          [
            0.006918309709189363,
            4.973583800867139
          ],
          [
            0.007413102413009177,
            4.904506248077317
          ],
          [
            0.007943282347242814,
            4.835428695287496
          ],
          [
            0.008511380382023767,
            4.766351142497674
          ],
          [
            0.009120108393559097,
            4.697273589707853
          ],
          [
            0.009772372209558112,
            4.628196036918031
          ],
          [
            0.010471285480508996,
            4.55911848412821
          ],
          [
            0.011220184543019636,
            4.490040931338389
          ],
          [
            0.012022644346174132,
            4.420963378548567
          ],
          [
            0.012882495516931342,
            4.351885825758746
          ],
          [
            0.013803842646028845,
            4.282808272968925
          ],
          [
            0.014791083881682071,
            4.213730720179104
          ],
          [
            0.015848931924611134,
            4.144653167389282
          ],
          [
            0.016982436524617443,
            4.075575614599461
          ],
          [
            0.018197008586099836,
            4.00649806180964
          ],
          [
            0.019498445997580455,
            3.937420509019818
          ],
          [
            0.020892961308540396,
            3.8683429562299967
          ],
          [
            0.0223872113856834,
            3.799265403440175
          ],
          [
            0.023988329190194897,
            3.7301878506503545
          ],
          [
            0.025703957827688632,
            3.661110297860533
          ],
          [
            0.02754228703338166,
            3.5920327450707115
          ],
          [
            0.029512092266663854,
            3.52295519228089
          ],
          [
            0.03162277660168379,
            3.4538776394910684
          ],
          [
            0.033884415613920256,
            3.3848000867012473
          ],
          [
            0.03630780547701014,
            3.315722533911426
          ],
          [
            0.03890451449942807,
            3.2466449811216043
          ],
          [
            0.04168693834703355,
            3.1775674283317827
          ],
          [
            0.0446683592150963,
            3.108489875541962
          ],
          [
            0.047863009232263824,
            3.0394123227521406
          ],
          [
            0.05128613839913648,
            2.970334769962319
          ],
          [
            0.054954087385762455,
            2.9012572171724975
          ],
          [
            0.0588843655355589,
            2.832179664382676
          ],
          [
            0.06309573444801933,
            2.763102111592855
          ],
          [
            0.06760829753919818,
            2.6940245588030334
          ],
          [
            0.07244359600749903,
            2.624947006013212
          ],
          [
            0.07762471166286916,
            2.5558694532233908
          ],
          [
            0.08317637711026708,
            2.4867919004335697
          ],
          [
            0.08912509381337455,
            2.417714347643748
          ],
          [
            0.09549925860214359,
            2.3486367948539266
          ],
          [
            0.10232929922807536,
            2.2795592420641055
          ],
          [
            0.1096478196143185,
            2.210481689274284
          ],
          [
            0.11748975549395291,
            2.141404136484463
          ],
          [
            0.12589254117941676,
            2.072326583694641
          ],
          [
            0.13489628825916533,
            2.00324903090482
          ],
          [
            0.1445439770745928,
            1.9341714781149981
          ],
          [
            0.1548816618912481,
            1.8650939253251773
          ],
          [
            0.16595869074375613,
            1.7960163725353553
          ],
          [
            0.1778279410038923,
            1.7269388197455342
          ],
          [
            0.19054607179632463,
            1.6578612669557133
          ],
          [
            0.20417379446695297,
            1.5887837141658914
          ],
          [
            0.21877616239495518,
            1.5197061613760705
          ],
          [
            0.23442288153199228,
            1.4506286085862485
          ],
          [
            0.25118864315095796,
            1.3815510557964277
          ],
          [
            0.26915348039269166,
            1.3124735030066057
          ],
          [
            0.28840315031266056,
            1.2433959502167848
          ],
          [
            0.30902954325135923,
            1.1743183974269626
          ],
          [
            0.3311311214825911,
            1.1052408446371418
          ],
          [
            0.3548133892335753,
            1.036163291847321
          ],
          [
            0.38018939632056126,
            0.967085739057499
          ],
          [
            0.4073802778041126,
            0.8980081862676781
          ],
          [
            0.4365158322401661,
            0.8289306334778561
          ],
          [
            0.4677351412871981,
            0.7598530806880353
          ],
          [
            0.5011872336272725,
            0.6907755278982134
          ],
          [
            0.5370317963702527,
            0.6216979751083924
          ],
          [
            0.5754399373371566,
            0.5526204223185716
          ],
          [
            0.6165950018614822,
            0.4835428695287496
          ],
          [
            0.6606934480075958,
            0.41446531673892856
          ],
          [
            0.707945784384138,
            0.3453877639491067
          ],
          [
            0.7585775750291835,
            0.2763102111592858
          ],
          [
            0.8128305161640995,
            0.20723265836946378
          ],
          [
            0.8709635899560806,
            0.1381551055796428
          ],
          [
            0.9332543007969915,
            0.06907755278982093
          ],
          [
            1,
            0
          ]
        ]
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 0,
        "label": "Full feasible mass: zero projection tax"
      },
      {
        "x": 0.01,
        "y": 4.605170185988092,
        "label": "Feasible mass0.01:4.605 nats"
      }
    ]
  }
}
```

[DERIVED] Tool arguments require a precise post-generation contract. Structural checks reject unknown fields, missing required values and invalid types under the selected schema dialect. Cross-field constraints check relations such as start≤end or mutually exclusive arguments. Authorization checks bind resource identifiers to the caller and permitted operation. Domain checks determine whether the proposed action actually satisfies the user's request. None of these stages may treat arbitrary generated strings as instructions to the validator. A generated argument can pass every type check and still reference the wrong customer.

## Algorithm

### Algorithm 37.4 — constrained realization and validation

[DERIVED] Algorithm 37.4 is bounded constrained generation with optional draft conditioning. Inputs are a compiled grammar/tokenizer pair, fixed model/processor contract, optional draft policy, cap and validators. State explicitly separates tentative decoder/parser advancement from the accepted response. Its output is a structurally validated artifact or a typed failure, plus a separate semantic assessment.

$$
\begin{aligned}
&1.\quad d\leftarrow\epsilon;\ \textbf{if draft mode: }d\leftarrow\operatorname{BoundedDraft}(x;\text{remaining deadline});\\
&\qquad\textbf{on draft error/timeout: return DRAFT\_ERROR/DRAFT\_TIMEOUT}.\\
&2.\quad h\leftarrow\epsilon;\ g\leftarrow g_0;\ t\leftarrow0;\ r_f\leftarrow\mathrm{RUNNING}.\\
&3.\quad\textbf{while }t<K\textbf{ and running and before deadline: }A\leftarrow\operatorname{ValidEvents}(g,\text{tokenizer});\\
&4.\qquad p\leftarrow p(\cdot\mid x,d,h)\text{ in draft mode, else }p(\cdot\mid x,h);\\
&\qquad\text{admit EOS only if }g\text{ accepts; form ordered masked law }q;\\
&\qquad\textbf{if invalid/zero mass: return INVALID\_LAW/EMPTY\_LEGAL\_MASS}.\\
&5.\qquad v\sim q;\ (g',h')\leftarrow\operatorname{TentativeAdvance}(g,h,v);\\
&6.\qquad\textbf{if recognizer rejects: restore }(g,h);\ \textbf{return MASK\_STATE\_MISMATCH}.\\
&7.\qquad(g,h,t)\leftarrow(g',h',t+1);\ \textbf{if EOS: }r_f\leftarrow\mathrm{COMPLETED}.\\
&8.\quad\textbf{if running: return CAP/DEADLINE with incomplete prefix};\\
&\qquad\text{parse/schema-validate within remaining deadline; on timeout/error return VALIDATOR\_TIMEOUT/ERROR}.\\
&9.\quad\textbf{if structural failure: return VALIDATION\_FAILURE};\\
&\qquad\text{run bounded semantic/authorization checks before any effect; on timeout return TASK\_CHECK\_TIMEOUT}.\\
&10.\quad\text{return artifact, finish reason, structural verdict and separate task verdict}.
\end{aligned}
$$

[DERIVED] Draft failure, empty legal mass and validation exceptions terminate explicitly. A finite cap ensures bounded model actions; independent time/memory budgets bound compilation and external validators. Prefix extendability does not ensure completion before $K$, so cap exits cannot claim guaranteed valid final strings. The invariant is agreement between committed token history, decoder state and grammar state. Exact syntactic validity requires a sound mask, an accepting end and no later text transformation that breaks the language. Inexact/heuristic masks must identify their approximation rather than inherit that guarantee.

## Implementation

[DERIVED] Implementation route: **vLLM** (reference-stack §4 #41, **LLM inference engine**; §4.1 **INFERENCE ENGINE**), v0.31.0 at full commit db9527a46873454610df6dbedf79a36d6bf1a7f6. Source inspection establishes disclosed behavior, not an executed deployment.

[OFFICIAL-DOCUMENTATION] vLLM's grammar manager fills a mask at each speculative prefix, tentatively advances matcher state, then rolls those advancements back. The backend limits rollback according to its speculative-token configuration. Accepted tokens subsequently advance the committed grammar. This represents the needed transactional separation but is not a proof of deployment parity across all backends or custom processors. [R37.1, grammar_bitmask; XgrammarGrammar.rollback](references.md#r371)

$$
M_{\rm bitmask}=4B\left\lceil\frac{V}{32}\right\rceil\ \text{bytes},\qquad M_{\rm stored\ masks}=4R\left\lceil\frac{V}{32}\right\rceil\ \text{bytes}.
$$
*(Eq. 37.12)*

where a mask packs32token flags into each4-byteword, $B$ masks are live and $R$ distinct masks are stored. These are mask tensors only; classifier/transducer state, compilation workspace, logits, parser stacks and model state are additional.

```figure
{
  "id": "fig-37.23",
  "kind": "systems-trace",
  "title": "Mask precomputation moves work into stored vocabulary bitsets",
  "caption": "Eq.37.12 illustrative V=131072,16 live masks and256 classifier masks: one packed mask is16KiB,live masks total64KiB,and classifier masks total1MiB. Precomputation does not remove per-step vocabulary-mask application traffic. No source runtime measurement is asserted.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.12",
  "alt": "Three stages distinguish precomputed classifier mask storage, live-state mask composition and application to vocabulary logits. Stored masks use1MiB in the declared example and live batch masks64KiB; logits, parser stacks and cache metadata are additional.",
  "spec": {
    "columns": [
      "memory",
      "compute",
      "failure"
    ],
    "stages": [
      {
        "name": "Precompute classifier masks",
        "values": {
          "memory": "256 packed vocabulary masks:1MiB",
          "compute": "Move repeated classification into precomputation",
          "failure": "A cache hit requires the correct grammar/tokenizer identity"
        }
      },
      {
        "name": "Compose live masks",
        "values": {
          "memory": "16 packed live masks:64KiB",
          "compute": "Combine masks for each active parser state",
          "failure": "Empty feasible support needs a terminal failure branch"
        }
      },
      {
        "name": "Apply and sample",
        "values": {
          "memory": "Vocabulary logits and parser state are additional",
          "compute": "Apply masks, normalize positive support and sample",
          "failure": "Structural validity does not guarantee semantic correctness"
        }
      }
    ]
  },
  "anchor": "implementation"
}
```

[DERIVED] A naive token checker can parse every event at every step; caching or PSC replaces that repeated work with preprocessing and state lookup. Applying a dense vocabulary mask still reads/writes vocabulary-sized data unless fused or sparse. Draft conditioning charges all draft tokens, additional prefill with the draft and constrained realization; parameter-count efficiency is not compute or latency efficiency. Frozen generation adds no gradients/optimizer states. Grammar-cache memory and host/GPU mask transfer are distinct from KV tensors. The inspected sources do not disclose complete energy/money accounting.

## Experimental design

### Reported experiments

| Study | Disclosed protocol | Missing or limited boundary |
|---|---|---|
| DCCD v1 | Table 1 lists Llama3.2-1B,Llama3.1-8B,Qwen2.5-1.5/3/7/14B; GSM8K,GSM-Symbolic,MATH500,FOLIO; XGrammar/vLLM; joint answer+format accuracy;3-shot CF baseline; source grammars/schemas AppendixI | Figure 7 instead labels its3B model Llama3.2; do not silently identify it with Table 1's Qwen3B. Hardware,dtype,version hashes,full caps/sampling/seeds/uncertainty NOT-DISCLOSED |
| Structural/semantic v1 | Qwen3-.6B/4B,Llama3.2-1B/3B,Phi4-mini3.8B; BF16;14 hand-designed JSON/schema/function/extraction tasks; greedy native/Outlines/XGrammar; Draft2020-12 validation; normalized field comparisons | Complete hardware/runtime/seed replication protocol NOT-DISCLOSED; coarse function score |
| PSC v1 | Three tokenizer families; oracle-mask test plus separately autoregressive downstream tasks; deterministic grammar analysis | Lexer assumptions limit end-to-end mask correctness; detailed runtime accounting in §37.6 |

[PAPER-REPORTED] DCCD counts a response successful only when answer correctness and structure both pass; FOLIO uses Prover9 for the formalized deduction. The semantic-gap study weights function selection and required-parameter presence equally, so its score can miss hollow argument content. These evaluators measure different notions of utility. [R37.2, §5.1,AppendixB/I](references.md#r372) [R37.4, §3.4,4.3](references.md#r374)

## Observations

**What the paper claims.** [PAPER-REPORTED] DCCD attributes gains to draft conditioning before hard projection. The semantic-gap study claims complete structural rescue on its tested tasks while retaining semantic failures. [R37.2, §§4–5](references.md#r372) [R37.4, §4](references.md#r374)

**What the evidence shows.** [PAPER-REPORTED] DCCD Table 2 reports 1B GSM8K joint accuracy15.24→39.04 under CD→DCCD. Additional generation/context is part of this comparison and is not isolated as zero-cost projection improvement. The semantic-gap study reports 100% schema validity for both constrained backends on its14 tasks; Qwen3-.6B's content score remains.943 under XGrammar, and its missing second function call remains.200 across decoders. A reported Llama1B function score1.000 still contains an email body consisting of list numerals. [R37.2, Table 2](references.md#r372) [R37.4, Tables5–6,§4.3](references.md#r374)

**What we infer.** [DERIVED] Structural validity is an independently useful contract, but it is not a semantic-correctness estimator. DCCD changes the inference procedure and target context; its gains do not establish exact distribution preservation. A task schema that permits one call cannot enforce an instruction requiring two unless that requirement is encoded or validated separately.

**What remains unknown.** [NOT-DISCLOSED] Full seed sensitivity, production-schema external validity and matched-latency DCCD comparisons remain unavailable in the inspected protocols. A low projection tax is not proven calibration or correctness. No private model capability is inferred from these small-model studies.

## Failure modes

[DERIVED] Failure symptoms include valid but wrong field values, omitted permitted calls, incomplete grammar coverage, split-Unicode lexer errors, unsupported schema keywords, parser-state drift after rejection and cap-truncated structures labeled valid. A grammar compiled for one tokenizer must not be reused solely because another vocabulary has the same size. Regex/FSA encodings of nested syntax require bounded depth or a different recognizer; claiming arbitrary recursive support from a flat automaton is a representation error.

## Siblings

```figure
id: fig-37.24
kind: compare
title: Structural and semantic constraint families
caption: JSON syntax, schema validation and task truth form distinct contracts. A parser-stack classifier optimizes recognition
  without deleting the stack language semantics.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.9
alt: 'Comparison on Enforced property. State: f=finite automaton state, p=lexer plus unbounded/bounded stack, v=task/database/environment
  context. Guarantee: f=recognized regular language, p=represented grammar with conditions, v=checker-specific soundness.
  Cannot infer: f=arbitrary nesting, p=truth or authorized effects, v=all real-world correctness without assumptions'
spec:
  axis: Enforced property
  columns:
  - id: f
    label: Finite-state
  - id: p
    label: Pushdown grammar
  - id: v
    label: Semantic validator
  rows:
  - dimension: State
    values:
      f: finite automaton state
      p: lexer plus unbounded/bounded stack
      v: task/database/environment context
  - dimension: Guarantee
    values:
      f: recognized regular language
      p: represented grammar with conditions
      v: checker-specific soundness
  - dimension: Cannot infer
    values:
      f: arbitrary nesting
      p: truth or authorized effects
      v: all real-world correctness without assumptions
```

## Extensions

### Improvements

[PAPER-REPORTED] DCCD changes conditioning rather than relaxing the grammar. PSC changes online parser work rather than task utility under an identical correct mask. The semantic-gap study adds separate content evaluation rather than a new generator. These 2026 developments address different failure surfaces. Their benefits cannot be multiplied as independent speed/accuracy factors without a combined controlled experiment. [R37.2, §4](references.md#r372) [R37.3, §3](references.md#r373) [R37.4, §§3–4](references.md#r374)

## Limitations

[DERIVED] Guaranteed final validity requires termination in the implemented language and a correct tokenizer/recognizer composition. It does not hold for arbitrary cap truncation. Global conditioning requires future-validity probabilities generally unavailable from an ordinary local grammar mask. The source theory/protocol gaps prevent treating every 2026 exactness or confidence phrase as established fact. Cross-field/authorization validation can also be incomplete; the chapter reports the checker contract rather than inventing a universal semantic verifier.

## Reproducibility

[DERIVED] Preserve exact grammar/schema dialect, converted grammar, tokenizer/decoder hash, EOS treatment, unsupported-keyword policy, compilation limits and final validator. Log draft tokens, draft/projector identities and candidate selection separately for DCCD. Keep structural and semantic verdicts plus raw outputs for error taxonomy. Reconstructing a study requires its actual runtime versions; the current vLLM pin supports operational exposition without replacing undisclosed paper dependencies.

## References

[DERIVED] R37.1–R37.5 supply inspected code, methods, protocols and cases. Equations37.9–37.12 independently reconstruct the local/global/mixture and storage contracts, with the source's projection formulation explicitly attributed where used.
