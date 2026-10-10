---
id: ms.section.37.2
entity_type: section
title: Sequence termination
short_title: Sequence termination
volume: 2
part: 7
chapter: 37
section: '37.2'
slug: 37-2-sequence-termination
parent: ms.chapter.37
prev_sibling: ms.section.37.1
next_sibling: ms.section.37.3
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

# 37.2 — Sequence termination

## Scope

[DERIVED] This section owns the ending and presentation contract: sampled EOS, explicit stop tokens/strings, length caps, truncation, cancellation and streaming boundaries. Its artifact preserves raw token events, delivered text and a typed finish reason. A complete response, a valid grammar prefix and a cap-exhausted prefix are distinct outputs. The statistical target includes the ending rule; the rendered string alone cannot reconstruct that target. Grammar acceptance is developed in §37.4 and speculative rollback in §37.5.

## Why this exists

[DERIVED] Output stripping is often treated as harmless cleanup. It becomes a statistical error when stripped EOS probabilities disappear from sequence scores, when cap-truncated responses are scored as successful completion, or when a stop string is leaked to a client before the server recognizes it across chunk boundaries. A model can predict a legitimate next token while a transport layer cancels the request. The cancellation supplies no evidence that the language-model process naturally ended there.

[PAPER-REPORTED] The 2026 SQL study supplies a concrete length-sensitive setting: its grammar always permits further query continuation, its model/beam procedure must decide when to finish, and generation is capped at 160 new tokens. The paper reports different truncation rates across beam widths and sampling. Those rates are outcomes of that policy and cap, not universal properties of SQL grammars. [R37.5, §§3–4,6](references.md#r37-5)

## Intuition

[MATHEMATICALLY-DERIVED] EOS contributes a factor to the probability of a completed token sequence. A cap instead observes a prefix and hides its continuation. A stop-string map can merge several raw tokenizations or suffix histories into the same displayed string. Hence raw-token likelihood, completion probability and likelihood of the delivered string are three different quantities. A streaming server must make this distinction before it emits irreversible bytes to the client.

[DERIVED] Buffering is an information constraint. If a stop marker has length $m$ characters, the last $m-1$ characters might be the beginning of a marker completed by later text. Holding that suffix prevents premature delivery when the marker must be excluded. The buffer is not optional merely because each token is complete: token boundaries need not align with marker boundaries or decoded Unicode boundaries.

## Formulation

[MATHEMATICALLY-DERIVED] Let $G$ count non-EOS tokens before the first EOS. For a realized non-EOS path $y_{1:g}$, define its EOS-terminated probability and the censoring survival product:

$$
P(y_{1:g},\mathrm{EOS}\mid x)=\left[\prod_{t=1}^{g}q(y_t\mid x,y_{<t})\right]q(\mathrm{EOS}\mid x,y_{1:g}),\qquad P(G\ge K\mid x)=\mathbb E\!\left[\prod_{t=1}^{K}(1-e_t(H_t))\right].
$$
*(Eq. 37.3)*

where $e_t(h)=q(\mathrm{EOS}\mid h)$ and the expectation is over the non-EOS conditional path process. With history-dependent hazards one cannot replace the expectation of the product by a product of marginal means. The cap $K$ counts all sampled token actions, including any EOS.

[MATHEMATICALLY-DERIVED] In an explicitly illustrative constant-hazard process with $e\in(0,1)$, independent stopping gives a geometric law. If $J$ is the number of sampled actions through EOS and $J_K=\min(J,K)$:

$$
P(J>K)=(1-e)^K,\qquad P(\mathrm{EOS\ by\ }K)=1-(1-e)^K,\qquad \mathbb E[J_K]=\sum_{j=0}^{K-1}(1-e)^j=\frac{1-(1-e)^K}{e}.
$$
*(Eq. 37.4)*

where $e$ is a chosen constant EOS hazard, not a model estimate. At $e=0$ the expectation is $K$ by continuity; at $e=1$ it is one for $K\ge1$. A grammar accepting EOS only at certain states violates the constant-hazard assumption.

```figure
{
  "id": "fig-37.7",
  "kind": "calculator",
  "title": "Token cap and censoring mass",
  "caption": "Constant-hazard analytical example. The cap is an integer action count, and completion probability is distinct from the expected action count.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.4",
  "alt": "Adjust the declared illustrative inputs; no EOS before cap=(1-e)^k, expected sampled actions=(1-(1-e)^k)/e, EOS completion probability=1-(1-e)^k. Constant-hazard analytical example. The cap is an integer action count, and completion probability is distinct from the expected action count.",
  "spec": {
    "tex": "P_{\\rm cap}=(1-e)^K,\\quad E[J_K]=(1-(1-e)^K)/e",
    "equation": "37.4",
    "inputs": [
      {
        "symbol": "e",
        "label": "illustrative EOS hazard",
        "default": 0.1,
        "min": 0.01,
        "max": 1,
        "format": "raw",
        "step": 0.01
      },
      {
        "symbol": "k",
        "label": "sampled-action cap",
        "default": 16,
        "min": 1,
        "max": 128,
        "format": "integer",
        "step": 1
      }
    ],
    "outputs": [
      {
        "symbol": "c",
        "label": "no EOS before cap",
        "formula": "(1-e)^k",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "n",
        "label": "expected sampled actions",
        "formula": "(1-(1-e)^k)/e",
        "format": "fixed3",
        "emphasis": false
      },
      {
        "symbol": "done",
        "label": "EOS completion probability",
        "formula": "1-(1-e)^k",
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
        "e": 0.1,
        "k": 1
      },
      "note": "One sampled action exposes the declared EOS hazard."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "e": 0.1,
        "k": 16
      },
      "note": "The cap terminates no-EOS paths without turning them into completed answers."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "e": 0.01,
        "k": 128
      },
      "note": "A low EOS hazard can retain appreciable censoring mass even at a large cap."
    }
  ]
}
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] A presentation transformation $F$ maps token paths and finish events to delivered text. Its probability is the pushforward, summing every raw event that maps to the same string:

$$
P(\text{delivered}=s)=\sum_{\omega:F(\omega)=s}P(\omega).
$$
*(Eq. 37.5)*

where $\omega$ includes EOS/stop/cap identity and tokenization. The score of one selected raw path is not generally the probability of the delivered string. This distinction matters for calibrated confidence or exact distribution comparisons.

```figure
id: fig-37.8
kind: diagram
title: Streaming state and irreversible delivery
caption: Only text known not to belong to an excluded future marker is released. Token events, buffered text and client-delivered
  text have different boundaries.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.5
alt: The information path is Committed token ledger, then Incremental decoder, then Undelivered suffix, then Earliest completed
  stop, then Client delivery. Only text known not to belong to an excluded future marker is released. Token events, buffered
  text and client-delivered text have different boundaries.
spec:
  direction: LR
  nodes:
  - id: n0
    kind: state
    label: Committed token ledger
    sub: raw event identity
  - id: n1
    kind: process
    label: Incremental decoder
    sub: carry partial encoding
  - id: n2
    kind: memory
    label: Undelivered suffix
    sub: possible stop prefix
  - id: n3
    kind: branch
    label: Earliest completed stop
    sub: declared tie order
  - id: n4
    kind: flow
    label: Client delivery
    sub: immutable text prefix
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

[DERIVED] An EOS token is not the same event as its human-readable spelling appearing in ordinary text. A stop-token set is matched on token identifiers. A stop-string list is matched after the declared decoding/normalization procedure. A JSON field can legitimately contain the characters used by an application stop marker; a string-based stop then changes the output language unless the delimiter is designed and escaped consistently. Minimum-token rules can suppress early token stops while string matching has its own threshold implementation.

[OFFICIAL-DOCUMENTATION] In the pinned detokenizer, excluded stop strings reserve `max(len(s))-1` characters. When a block contains multiple completed markers, `check_stop_strings` chooses the one with the earliest completion offset, breaking equal-end ties by list order. That explicitly supports speculative multi-token updates. The inclusion flag changes truncation to the marker's beginning or end. This is a character-level decoded-text contract, not a guarantee that every tokenizer emits one complete Unicode character per token. [R37.1, BaseIncrementalDetokenizer and check_stop_strings](references.md#r37-1)

```figure
{
  "id": "fig-37.9",
  "kind": "chart",
  "title": "Cap survival in a fixed-hazard process",
  "caption": "Analytical survival curves sampled at every integer cap from1 through32. They illustrate censoring sensitivity; they are not measured response-length distributions. Integer caps are distinct configurations. The logarithmic probability axis preserves low censoring mass.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.4",
  "alt": "Analytical curves: hazard0.05 equals 0.95^x, hazard0.15 equals 0.85^x. Analytical survival curves sampled at every integer cap from1 through32. They illustrate censoring sensitivity; they are not measured response-length distributions.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "sampled-action cap K",
      "scale": "linear",
      "domain": [
        1,
        32
      ],
      "format": "integer"
    },
    "y": {
      "label": "probability of no EOS",
      "scale": "log10",
      "domain": [
        0.001,
        1
      ],
      "format": "raw"
    },
    "series": [
      {
        "id": "s0",
        "label": "hazard0.05",
        "formula": "0.95^x",
        "sample": {
          "to": 32,
          "count": 32,
          "from": 1
        }
      },
      {
        "id": "s1",
        "label": "hazard0.15",
        "formula": "0.85^x",
        "sample": {
          "to": 32,
          "count": 32,
          "from": 1
        }
      }
    ],
    "annotations": [
      {
        "x": 32,
        "y": 0.0055132238072354,
        "label": "Cap32, hazard0.15: censoring0.00551"
      }
    ]
  }
}
```

[MATHEMATICALLY-DERIVED] Length-conditioned accuracy can change when no answer changes. Let $U\in[0,1]$ be task utility and $E_K$ denote natural completion by the cap. The conditional mean $\mathbb E[U\mid E_K]$ omits censored tasks. The all-task utility with censoring assigned zero is $P(E_K)\mathbb E[U\mid E_K]$. Raising a cap can alter both factors and the selected population. Comparing conditional means at different caps is therefore not an accuracy comparison on a common workload.

$$
\mathbb E[U\mathbf1_{E_K}]=P(E_K)\mathbb E[U\mid E_K],\qquad \widehat U_{\rm all}=\frac{\sum_{i=1}^{n}U_i\mathbf1_{E_{K,i}}}{n},\quad \widehat U_{\rm completed}=\frac{\sum_iU_i\mathbf1_{E_{K,i}}}{\sum_i\mathbf1_{E_{K,i}}}.
$$
*(Eq. 37.6)*

where the second denominator must be positive. Reporting both estimands reveals completion selection; neither turns a cap-truncated prefix into a naturally completed sequence. Task-defined partial credit requires an explicit evaluator.

```figure
id: fig-37.10
kind: compare
title: Ending events and their probability meaning
caption: A finish label is evidence about an event, not a semantic-correctness label. Transport timeout and user cancellation
  require additional distinct labels.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.3
alt: 'Comparison on Termination contract. Origin: e=sampled token event, s=declared token/text predicate, c=external resource
  rule. Likelihood record: e=include EOS score, s=retain raw event before stripping, c=prefix probability; continuation unknown.
  Task validity: e=evaluate completed response, s=evaluate resulting language, c=report censored/incomplete separately'
spec:
  axis: Termination contract
  columns:
  - id: e
    label: EOS
  - id: s
    label: Stop marker
  - id: c
    label: Administrative cap
  rows:
  - dimension: Origin
    values:
      e: sampled token event
      s: declared token/text predicate
      c: external resource rule
  - dimension: Likelihood record
    values:
      e: include EOS score
      s: retain raw event before stripping
      c: prefix probability; continuation unknown
  - dimension: Task validity
    values:
      e: evaluate completed response
      s: evaluate resulting language
      c: report censored/incomplete separately
```

## Algorithm

### Algorithm 37.2 — bounded stop-aware delivery

[DERIVED] Algorithm 37.2 gives a bounded streaming contract. Inputs are an ordered stream of verified token events, positive cap $K$, token stops including EOS unless explicitly ignored, decoded-text stops, inclusion rule and task deadline. State holds the raw committed prefix $h$, incremental decoder $d$, undelivered suffix $b_s$, delivered text $o$ and finish reason $r_f$. Draft-computed tokens are not yet stream events. Event retrieval must enforce the remaining deadline and return named timeout, error or end-of-stream outcomes; a deadline checked outside an unbounded blocking call does not bound execution.

$$
\begin{aligned}
&1.\quad h\leftarrow\varnothing;\ d\leftarrow d_0;\ b_s\leftarrow\epsilon;\ o\leftarrow\epsilon;\ r_f\leftarrow\mathrm{RUNNING}.\\
&2.\quad\textbf{while }|h|<K\textbf{ and before deadline and }r_f=\mathrm{RUNNING}:\\
&3.\qquad v\leftarrow\operatorname{NextVerifiedEvent}(\text{remaining deadline});\\
&\qquad\quad\textbf{if timeout/error/end-of-stream: set matching finish reason; }\textbf{break};\\
&\qquad\quad h\leftarrow h\mathbin\Vert v;\ \text{retain score and event ID}.\\
&4.\qquad\textbf{if }v\in\text{token stops: set }r_f\leftarrow\mathrm{TOKEN\_STOP};\ \textbf{break}.\\
&5.\qquad(d,a)\leftarrow\operatorname{DecodeIncrementally}(d,v);\ b_s\leftarrow b_s\mathbin\Vert a.\\
&6.\qquad\textbf{if a text stop completes: }a\leftarrow\text{retained prefix under inclusion rule};\\
&\qquad\quad\operatorname{Deliver}(a);\ o\leftarrow o\Vert a;\ b_s\leftarrow\epsilon;\ \text{discard trimmed marker/tail};\\
&\qquad\quad r_f\leftarrow\mathrm{TEXT\_STOP};\ \textbf{break}.\\
&7.\qquad a\leftarrow\text{safe prefix of }b_s;\ \operatorname{Deliver}(a);\ o\leftarrow o\Vert a;\ \text{remove }a\text{ from }b_s.\\
&8.\quad\textbf{if running: classify CAP, DEADLINE or CANCEL; never synthesize EOS}.\\
&9.\quad\textbf{if }r_f\ne\mathrm{TEXT\_STOP}:\ a\leftarrow\operatorname{FinalizeDecoder}(d;\text{frozen terminal policy});\\
&\qquad\text{append only valid permitted }a\text{ to }b_s;\ \text{trim any newly completed marker per frozen rule};\\
&\qquad\operatorname{Deliver}(b_s);\ o\leftarrow o\Vert b_s;\ b_s\leftarrow\epsilon;\\
&\qquad\text{on invalid encoding record ENCODING\_ERROR; seal }(h,o,r_f);\ \text{discard uncommitted block tail}.
\end{aligned}
$$

[DERIVED] The invariant is that delivered text cannot require retraction under the declared marker rule. Stop matching examines newly completed spans including boundary overlap; checking only the newest token's decoded fragment violates that invariant. The procedure stops at a finite cap/deadline or explicit event. A malformed decoder state produces a named decoding failure. Cancellation preserves the last acknowledged client boundary. For a verified block, iterate events until the first stop and roll back unused suffix state; retaining a computed-token trace is permitted but it must remain distinct from the committed response.

```figure
id: fig-37.11
kind: matrix
title: One stop marker spans several delivery fragments
caption: Illustrative marker ABC. Fragment1 contains A/B, fragment2 contains B/C as overlapping match state. Rows identify
  the two boundary windows; columns are marker characters A,B,C. A per-fragment whole-string search misses the completed marker.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-37.5
alt: Each filled cell denotes an admitted relationship. Illustrative marker ABC. Fragment1 contains A/B, fragment2 contains
  B/C as overlapping match state. Rows identify the two boundary windows; columns are marker characters A,B,C. A per-fragment
  whole-string search misses the completed marker.
spec:
  rows: 2
  cols: 3
  pattern: explicit
  cells:
  - - 1
    - 1
    - 0
  - - 0
    - 1
    - 1
  rowLabel: first / next boundary window
  colLabel: A / B / C
  legend: Filled cells denote admitted relationships; inspect the caption for axis identities.
```

## Implementation

[DERIVED] Implementation route: **vLLM** (reference-stack §4 #41, **LLM inference engine**; §4.1 **INFERENCE ENGINE**), v0.31.0 at full commit db9527a46873454610df6dbedf79a36d6bf1a7f6. Source inspection establishes disclosed behavior, not an executed deployment.

[OFFICIAL-DOCUMENTATION] Scheduler `check_stop` examines EOS, explicit stop-token identifiers, model-context/response caps and then repetition detection. Thus EOS encountered exactly at a cap is classified by the earlier stop check. A minimum-length condition appears later in that function; processor-level EOS suppression and scheduler classification must be read together. `ignore_eos` handling is configured through sampling parameters, not inferred from a finish string. [R37.1, sampling_params.py; v1/core/sched/utils.py](references.md#r37-1)

[OFFICIAL-DOCUMENTATION] The fast detokenizer includes recovery for invalid-prefix/non-monotonic UTF-8 decoding behavior. That code acknowledges tokenizer edge cases; it does not prove that a reset yields identical text for every malformed input. The slow path maintains prompt and read offsets separately. A deployment's tokenizer-library version selects the fast/slow path, so reproducibility must pin it. [R37.1, FastIncrementalDetokenizer and SlowIncrementalDetokenizer](references.md#r37-1)

```figure
{
  "id": "fig-37.12",
  "kind": "systems-trace",
  "title": "Streaming stop handling retains a bounded suffix",
  "caption": "Eq.37.5 with maximum marker length12 characters retains at most11 trailing characters per request, or704 across64 requests. This excludes decoder state and complete output storage; characters are not UTF-8 bytes or tokens. Frozen matching and stripping rules determine the released text.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-37.5",
  "alt": "The stream protocol records sampled IDs, incrementally decodes text, withholds the bounded matching suffix and releases text under the frozen stop contract. A matched marker produces a stop event. EOS, a token cap and a decode error remain distinct terminal statuses.",
  "spec": {
    "columns": [
      "memory",
      "communication",
      "failure"
    ],
    "stages": [
      {
        "name": "Record sampled event",
        "values": {
          "memory": "Token IDs and processed-law provenance retained",
          "communication": "Incremental decoder receives the token",
          "failure": "Do not infer text offsets from token count"
        }
      },
      {
        "name": "Decode and retain suffix",
        "values": {
          "memory": "At most11 trailing characters/request for matching",
          "communication": "Release only text outside the undecided suffix",
          "failure": "Decode/normalization errors retain typed status"
        }
      },
      {
        "name": "Match frozen stop rule",
        "values": {
          "memory": "Matched span and tie rule preserved",
          "communication": "Apply declared marker-inclusion or stripping policy",
          "failure": "Do not expose partial marker then retract it"
        }
      },
      {
        "name": "Finalize stream",
        "values": {
          "memory": "64-request matching suffix bound:704 characters",
          "communication": "Finalize legal tail under EOS/stop/cap contract",
          "failure": "A cap is censoring, not an EOS completion"
        }
      }
    ]
  },
  "anchor": "implementation"
}
```

[DERIVED] Naive marker matching costs $O(Jm)$ per updated text window for $J$ markers of maximum length $m$, apart from search-implementation details. A prefix automaton can amortize matching over decoded characters but needs explicit tie/inclusion behavior. Model compute includes tokens generated before the stopping decision and any speculative excess; client-visible output length can be smaller. Network and serialization work scale with delivered chunks, while buffering can increase delivery latency without increasing model-token latency. No additional trainable parameters or optimizer state is required. Energy/money and stop-specific p99 overhead are NOT-DISCLOSED here.

## Experimental design

### Reported experiments

[PAPER-REPORTED] The beam/sample+vote study's actual stopping experiment uses the full Spider development workload and reports truncation after comparing model sizes and candidate budgets. [R37.5, §§4,6](references.md#r37-5)

| Protocol dimension | Disclosed setting |
|---|---|
| Models / precision | Qwen2.5-Instruct0.5/1.5/3/7B; NF4 |
| Workload / ending |1034Spider examples; EOS allowed only at grammar-accepting states;160new-token cap |
| Beam settings | Width1,2,4,8; finished-query length penalty-2; paper's first-come finished-set stopping |
| Sampling | Candidate count1,2,4,8; temperature.7,top-p.9; execution-result vote |
| Measurement | Cap truncation fraction, execution accuracy; Wilson intervals concern examples |
| Missing fields | Hardware, model revision, runtime revision, seed identifier, repeated-seed truncation variability NOT-DISCLOSED |

## Observations

**What the paper claims.** [PAPER-REPORTED] The study tests whether over-generation explains beam's advantage over sample+vote and reports that the truncation data do not support that explanation in this workload. [R37.5, §6](references.md#r37-5)

**What the evidence shows.** [PAPER-REPORTED] Across sizes, beam truncation is reported as0.8–2.4% at width 1 and0.0–1.1% at width 8, reaching zero at 3B/7B. Sample+vote truncation remains1.0–2.7%. These ranges describe model/budget configurations under one cap, not confidence intervals or universal monotonicity of arbitrary length penalties. [R37.5, §6](references.md#r37-5)

**What we infer.** [DERIVED] A stopping intervention can change the observed quality/latency frontier without changing weights. Natural completion and truncation should accompany accuracy; completed-only metrics can conceal which examples were removed. The paper's use of a negative length exponent is one scoring convention, not a portable setting across APIs.

**What remains unknown.** [NOT-DISCLOSED] The inspected study does not isolate stop-string buffering or client delivery latency. The official code inspection supplies its behavior, not measured overhead or a production fault rate.

## Failure modes

[DERIVED] Symptoms include leaked stop delimiters, repeated final chunks, partial Unicode replacement, unfinished JSON labeled complete, cap exits reported as EOS and inconsistent finish reasons at identical boundaries. Concurrent updates can emit a suffix twice unless delivery offsets and committed-token positions advance atomically. EOS suppression can turn an otherwise short task into a cap failure. A parser-accepted prefix may still be extended indefinitely; grammar validity alone is not a termination proof.

## Siblings

[DERIVED] Token stops are cheap and precise for a fixed tokenizer, but do not directly express arbitrary text delimiters. Text stops express application protocols but operate after decoding and can collide with content. Grammar termination states can authorize EOS only when a structure is complete, but cannot force a semantically appropriate stopping time unless the language encodes one. Deadlines bound wall time while token caps bound actions; neither implies a bound on the other under queueing or tool waits.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The pinned earliest-completion stop matcher explicitly handles multiple newly generated tokens, avoiding dependence on how a speculative block is chunked. Its tie rule is part of that improvement's behavior. The source does not provide an isolated throughput or correctness benchmark for this function; the manuscript claims only the disclosed operation. [R37.1, check_stop_strings](references.md#r37-1)

## Limitations

[DERIVED] The geometric calculator is a finite analytical model, not an estimator for history-dependent language-model EOS. A stop transformation can invalidate a schema or alter utility; validity must be checked after the actual presentation contract. Remote API outputs may omit raw token paths and internal caps. Then sequence-probability parity and precise censoring causes remain UNVERIFIED instead of being inferred from displayed punctuation.

## Reproducibility

[DERIVED] Record cap units, prompt-plus-output context ceiling, EOS IDs, explicit token/string stops, list order, inclusion flag, minimum tokens, tokenizer/decoder versions, deadline and cancellation provenance. Preserve final committed token count and delivered-character offsets. Evaluate all-task accuracy, completion rate, cap rate and completed-only accuracy with their denominators. Token delivery timestamps belong to the client boundary if the objective is streaming experience; internal model steps alone cannot reconstruct it.

## References

[DERIVED] R37.1 supports exact versioned ending/decoder behavior. R37.5 supplies the actual length-sensitive SQL protocol and truncation observations. Equations37.3–37.6 and the streaming procedure are book derivations with stated finite-process assumptions.
