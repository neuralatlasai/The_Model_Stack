---
id: ms.section.46.6
entity_type: section
title: API behavior
volume: 2
part: 8
chapter: 46
section: 46.6
slug: 46-6-api-behavior
parent: ms.chapter.46
prev_sibling: ms.section.46.5
next_sibling: ms.verification.46
children: []
prerequisites: [ms.chapter.6, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.section.46.5]
downstream: [ms.chapter.47, ms.chapter.48, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [serving_control_plane], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.tensorrt-llm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 46.6 — API behavior

## Scope

[DERIVED] An inference API makes authentication, versioning, streaming and failure behavior observable to clients. This section examines complete authorization boundaries, structured errors, partial streams, compatibility and client metrics. The baseline is an endpoint that returns a token stream and HTTP status without a declared lifecycle. Success is a bounded, interpretable protocol that preserves the serving contract through failures and version changes.

## Why this exists

[DERIVED] Model-serving protocols often resemble familiar chat APIs while differing in templates, defaults, supported fields, stream chunks and terminal reasons. A client can receive HTTP200 and still lose the answer midstream. A configured API key can protect only selected routes. A schema-valid error can omit whether work ran or whether retry is safe. These are execution and evidence problems, not merely documentation polish.

[OFFICIAL-DOCUMENTATION] Current vLLM security documentation explicitly scopes API-key protection to selected path prefixes and lists unprotected endpoints [R46.12, “API Key Authentication Limitations”]. A complete application boundary therefore cannot be inferred from the presence of one authentication flag.

## Intuition

[DERIVED] The API is a state machine whose events cross trust, timing and buffering boundaries. A robust client needs to know who is authorized, what action/version ran, how much output is committed, and which terminal outcome occurred. Protocol compatibility is therefore more than matching one request JSON object.

## Formulation

> **Definition — Observable inference protocol.** [DERIVED] A versioned request/event/terminal-state contract that lets a client distinguish accepted completion, explicit failure, cancellation and ambiguous interruption, while preserving request identity and authorization.

| Local symbol | Meaning |
|---|---|
| $P_r$ | Authenticated principal and its permitted actions/data scope |
| $v_r$ | API, model, template and decoding contract identity |
| $e_j=(i,a,j,\kappa,p,v_r)$ | Logical ID, attempt ID, event sequence, kind, payload and version |
| $\mathcal S$ | Protocol states |
| $B_{\rm out}(t),B_{\max}$ | Buffered output bytes and finite ceiling |
| $g(t),c(t)$ | Actual produced and consumed output-byte rates |
| $\Delta g>0$ | Constant positive net byte-growth rate in an analytical example |
| $n_{\rm sent},n_{\rm terminal}$ | Eligible client requests sent and observed terminal outcomes |

[DERIVED] A minimal lifecycle is

$$
\mathcal S:
\text{validated}\rightarrow\text{accepted}\rightarrow\text{streaming}
\rightarrow\{\text{completed},\text{failed},\text{cancelled}\}.
$$
*(Eq. 46.26)*

A transport interruption without a terminal event is **ambiguous** from the client's perspective; it must not be silently mapped to completed. Server and client state can disagree temporarily.

[MATHEMATICALLY-DERIVED] Event-order acceptance requires

$$
j_{k+1}>j_k,\qquad
\text{terminal observed}\Rightarrow
\text{no subsequent semantic output accepted for that logical result}.
$$
*(Eq. 46.27)*

The sequence rule is a proposed protocol invariant, not a universal property of current chat APIs. Duplicate replay can be discarded by sequence identity only when replay semantics and retention are actually provided.

## Mechanism

### Methodology

[DERIVED] Authenticate before expensive model work and bind the resulting principal to the request's model, data, quota and administration permissions. Authentication verifies identity or possession of a credential; authorization determines permitted actions. One shared API key need not distinguish tenants or privilege levels. A request claiming its own tenant identifier cannot grant itself that tenant's resources or cached state.

[OFFICIAL-DOCUMENTATION] At vLLM commit a2fb4827324bf023075799ef3d70d347834b8137, AuthenticationMiddleware defines four guarded prefixes, verifies Bearer tokens through hashed digest comparisons, and skips unguarded paths/OPTIONS in its declared scope [R46.13, authenticate.py:11,30–62]. Static inspection corroborates the documented boundary; it is not a penetration test or proof of complete deployment security.

[DERIVED] The gateway must enumerate all externally reachable inference, metadata, adapter, health, metric, plugin and administrative routes. Different actions can require different privileges. A reverse proxy that permits only intended routes reduces accidental exposure, but its policy and forwarded identity must be matched to the engine. Internal collective/state-transfer ports are a separate trust boundary; a public API credential does not authenticate those channels automatically.

[OFFICIAL-DOCUMENTATION] vLLM's security page documents internal-network exposure and plugin-route limitations [R46.12]. [DERIVED] Cache and retrieval reuse need identity/ACL enforcement too: matching prompt text does not authorize sharing private data or side-channel-visible state. The routing eligibility policy in §46.3 remains enforced after dispatch and failover.

[DERIVED] Validate request syntax and semantic limits before admission: supported model/version, context/token cap, sampler ranges, constraint grammar, tool schema and media limits. Unknown fields need a declared reject/ignore policy. Silent ignoring is dangerous when a caller relies on a quality, budget or data constraint. A supported field name also needs its unit and default; “max tokens” may refer to generated tokens, full context or a different budget in different interfaces.

[DERIVED] Version identity should include the numerical/model artifact, tokenizer/template and decoding semantics, not just a transport API version. A backward-compatible JSON change can still alter model behavior through a new default template or stop token. Preserve explicit resolved settings in traces. The [Chapter 43 comparison](../ch43-runtime-architecture-and-inference-engine-selection/43-6-selection-methodology.md) separates same-prefix numerical checks from free-running task behavior.

[OFFICIAL-DOCUMENTATION] RFC9457 defines a structured problem representation with type, status, title, detail and instance, plus extensible machine-readable fields [R46.10, §3]. Its human-readable detail is not intended as a parser's primary decision input.

[DERIVED] An inference error additionally needs declared machine-readable semantics: invalid input, unsupported capability, quota exhaustion, overload, deadline, cancellation, provider/worker failure and ambiguous completion. Include logical request/attempt identity and retryability only when it is justified. A “retryable” flag cannot replace a deadline, budget or idempotency check. Error details should expose enough to correct the request without publishing credentials, private prompts or internal topology unnecessarily.

[OFFICIAL-DOCUMENTATION] HTTP semantics distinguishes response control/status from content, and Retry-After supplies response timing guidance [R46.9, §§6.2,10.2.3]. [DERIVED] Once a streaming response's success headers are committed, a later failure cannot be represented as a newly chosen ordinary HTTP status for that same response. The stream needs an application terminal/error event, or the client must recognize interruption as ambiguous.

[OFFICIAL-DOCUMENTATION] The HTML SSE standard defines UTF-8 event framing and EventSource reconnection/Last-Event-ID behavior [R46.11, §§9.2.3–9.2.6]. [DERIVED] A POST generation request read through fetch can use SSE framing without inheriting the browser EventSource API's automatic reconnection semantics. Event framing alone does not provide durable replay, exactly-once delivery or safe generation resumption.

[DERIVED] A client parser must handle arbitrary transport chunk boundaries: one chunk can contain part of an event or multiple events. UTF-8 characters can also span byte reads. Parse complete framed events before interpreting payloads. An application can emit a terminal event after a final token, but a close without that event remains distinguishable. If the last event is a length-cap termination, task acceptance still depends on whether truncation is allowed.

[DERIVED] Streaming results contain at least three progress concepts: model computation, accepted model-prefix tokens and published client output. Stop-string withholding, grammar handling and output filtering can delay or suppress publication. A server-side token count therefore need not equal client-visible text/token count at cancellation. Usage records should identify their unit and whether the figure is final, partial or unknown.

[DERIVED] Partial failure policy must be explicit. A client may retain text already shown while reporting failure, discard it and start a new logical attempt, or resume from retained event history when supported. Appending a newly generated replacement continuation to an old partial stream can create an output that no model actually generated under one consistent history. Same seed does not repair this issue (§43.6).

[OFFICIAL-DOCUMENTATION] Ray Serve documents cancellation of a streaming async generator on client disconnect, delivered when it reaches an await point [R46.20, “Terminating the stream when a client disconnects”]. [DERIVED] Application cancellation must propagate to generation and resource owners; cancelling the HTTP writer alone can leave model work running.

[MATHEMATICALLY-DERIVED] Output-buffer conservation with actual production/consumption rates is

$$
B_{\rm out}(t)=B_{\rm out}(0)+
\int_0^t[g(s)-c(s)]\,ds,\qquad
0\le B_{\rm out}(t)\le B_{\max}.
$$
*(Eq. 46.28)*

The gate must act before the ceiling is exceeded. If rates are constant with $\Delta g=g-c>0$, time to fill remaining space is

$$
t_{\rm fill}=\frac{B_{\max}-B_{\rm out}(0)}{\Delta g}.
$$
*(Eq. 46.29)*

These equations use actual dequeued bytes; a hypothetical consumption capacity that continues below empty would require a reflected fluid model instead. Network backpressure can stall writes without stalling model generation, so every intermediate buffer needs a bound or an explicit cancellation/pause mechanism.

[DERIVED] Slow-client handling trades resource retention against user experience. Pause future generation if the execution interface supports it safely, cap buffered events, or terminate under a declared idle/output policy. Silently dropping tokens violates the stream contract. Shared generation with multiple attached clients requires per-client cursors and bounded replay retention; one slow subscriber should not create unbounded state for all.

[DERIVED] Client metrics must begin at the declared client request boundary and retain terminal/ambiguous outcomes. Record request ID, sent time, first usable delivery, last delivery, terminal time, status, chunk/event counts and any observable token counts. Do not infer token ITL from coalesced chunks. A server histogram excludes network/client buffering and cannot substitute for client measurement.

[DERIVED] Costs include authorization/validation/tokenization CPU, event parsing/serialization, TLS/network transfers, output buffers and replay retention. Per-event processing is linear in parsed bytes plus schema-validation work; per-request control state is constant-sized apart from retained inputs/events. Credential lookup and policy evaluation have store/cache costs. Retaining full stream histories scales with event bytes times retention population; aggregated metrics reduce storage but lose per-request joint-outcome reconstruction.

```figure
id: fig-46.18
kind: diagram
title: Streaming success is a terminal contract
caption: Authentication and version resolution precede admission. Published events and terminal outcomes are observed independently of internal model progress.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.26
alt: Principal and request version feed validation/admission. Generation enters a bounded output buffer and event transport. The client distinguishes completed, failed, cancelled and ambiguous interruption.
spec:
  direction: LR
  nodes:
    - {id: identity, kind: process, label: authenticate authorize}
    - {id: version, kind: tensor, label: resolve contract version}
    - {id: gate, kind: process, label: validate and admit}
    - {id: model, kind: process, label: model progress}
    - {id: buffer, kind: memory, label: bounded publication buffer}
    - {id: client, kind: process, label: client event parser}
    - {id: terminal, kind: state, label: terminal or ambiguous}
  edges:
    - {from: identity, to: gate}
    - {from: version, to: gate}
    - {from: gate, to: model}
    - {from: model, to: buffer}
    - {from: buffer, to: client}
    - {from: client, to: terminal}
    - {from: buffer, to: model, kind: feedback, label: backpressure or stop}
```

## Algorithm

### Algorithm 46.6 — Bounded authenticated stream

[DERIVED] Inputs are credentials, request/version, finite token/deadline/output-buffer limits and a terminal-event schema. Outputs are a client-observable history and final accounting. Terminal branches follow §46.1 and release partial reservations after safe completion.

$$
\begin{aligned}
1.\;&P_r\leftarrow\operatorname{Authenticate};
\quad\text{failure}\Rightarrow\operatorname{Reject};\\
&\operatorname{AuthorizeAndValidate}(P_r,r,v_r)=\text{false}
\Rightarrow\operatorname{Reject}.\\
2.\;&\operatorname{AcquireAdmissionReservation};
\quad\text{failure}\Rightarrow\operatorname{Reject};
\quad j\leftarrow0.\\
3.\;&\operatorname{ExecuteNextAdmissibleWorkAndProcessStopRules};\\
4.\;&B_{\rm out}+\text{next event bytes}>B_{\max}
\Rightarrow\operatorname{BoundedPauseOrCancel};\\
&\text{otherwise }j\leftarrow j+1,\space
\operatorname{Publish}(e_j).\\
5.\;&\text{disconnect, cancellation or deadline}\Rightarrow
\operatorname{StopFutureWorkAndFinalizeFailureOrCancellation};\\
&\text{normal terminal}\Rightarrow\operatorname{PublishTerminalAndFinalize};\\
&\text{continuing within limits}\Rightarrow\text{return to 3}.
\end{aligned}
$$

[DERIVED] A pause in line 4 resumes only when space is available within its finite timeout; it does not fall through into an overflowing publication. A terminal attempt to send an error may itself fail, leaving client state ambiguous. Invariants are authorization at every action boundary, monotonic event identity, no semantic output after terminal state and finite buffer/resource ownership.

## Implementation

[OFFICIAL-DOCUMENTATION] vLLM/TensorRT-LLM are **Inference engine**; reverse proxies, Ray Serve, SSE/HTTP implementations and identity stores are outside the numbered stack, routed through deployment/API coverage. The immutable vLLM middleware file is statically inspected [R46.13]; actual gateway policy, streaming parser and cancellation integration remain unexecuted.

## Experimental design

### Reported experiments

[NOT-DISCLOSED] The inspected standards and security/streaming documentation do not supply a controlled model-serving experiment covering this complete protocol. Their examples specify interfaces, not measured application availability or p95 latency. The source-inspection evidence confirms a narrow middleware boundary; it does not test deployed routing, proxy configuration or client behavior.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] Authentication scope, event framing, structured errors and cancellation have the documented semantics [R46.9–13; R46.20].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The pinned middleware contains prefix-scoped authentication, and the protocol sources distinguish framing/reconnection from application result semantics. No complete service measurement follows from those facts.

**What we infer.** [DERIVED] An HTTP200 or SSE-formatted stream is insufficient evidence of a completed task. The client needs terminal-state and identity rules alongside bounded buffering and cancellation.

**What remains unknown.** [UNVERIFIED] Deployed endpoint exposure, replay correctness, partial-failure handling and client timing have not been executed.

## Failure modes

> **Failure mode — Stream closes without a terminal result.** [DERIVED] *Symptom:* the UI shows a partial answer as complete. *Cause:* client equates transport close with accepted completion. *Detection:* require a declared terminal event and retain interruption state. *Mitigation:* expose partial/ambiguous failure and apply bounded replay/retry policy.

[DERIVED] Other failures include unauthorized plugin/admin routes, silently ignored budget fields, unbounded slow-client buffers and mixed-version continuations.

## Siblings

[DERIVED] Buffered response APIs simplify one terminal body but delay partial visibility. Streaming APIs improve incremental delivery while adding parser, replay and ambiguity obligations. Web transport compatibility and [engine numerical compatibility](../ch43-runtime-architecture-and-inference-engine-selection/43-6-selection-methodology.md) are separate contracts.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] Current security documentation makes endpoint/plugin authentication boundaries explicit; RFC9457 standardizes machine-readable problem types; stream interfaces expose cancellation points [R46.10–13; R46.20]. [DERIVED] Integrating these into a complete inference protocol is application engineering, not a claim that every serving endpoint already does so.

## Limitations

[DERIVED] Clients cannot observe unreported internal token events or resolve lost terminal outcomes without server support. A research question is how to make partial generation replay and failover consistent across changing numerical engines while bounding retention and duplicate computation.

## Reproducibility

[UNVERIFIED] Preserve route/auth policy, API/model/template revisions, request schema/defaults, proxy buffering, stream parser/version, event/cursor semantics, output limits, usage units and client traces. Fault/slow-client/version tests are proposals in [verification](verification.md), not completed experiments.

```figure
id: fig-46.19
kind: calculator
title: Time to fill an output buffer
caption: Eq. 46.29 uses a constant positive net byte-growth rate and an initially empty hypothetical buffer.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-46.29
alt: Buffer capacity divided by positive net production rate gives the time before a bound is reached.
states:
  - {anchor: formulation, label: Constant-rate model, note: Inputs are hypothetical megabyte units.}
  - {anchor: mechanism, label: Slow client, variables: {growth: 2}, note: Backpressure must reach generation or a finite stop policy.}
  - {anchor: failure-modes, label: Full buffer, note: Dropping semantic output is not valid flow control.}
spec:
  tex: t_{fill}=B_{max}/Delta g
  equation: "46.29"
  inputs:
    - {symbol: buffer, label: buffer megabytes, default: 8, min: 1, max: 100, format: fixed2}
    - {symbol: growth, label: positive net megabytes per second, default: 1, min: 0.1, max: 10, format: fixed2}
  outputs:
    - {symbol: seconds, label: fill time seconds, formula: "buffer/growth", format: fixed2}
```

```figure
id: fig-46.20
kind: stat-panel
title: Client outcome vocabulary
caption: A lost terminal event is ambiguous even when an earlier success header arrived.
placement: rail
anchor: mechanism
evidence: DERIVED
source: DERIVED:eq-46.26
alt: The card separates completed, explicit failure and ambiguous interruption.
spec:
  header: OBSERVABLE TERMINAL STATE
  rows:
    - {key: completed, value: declared accepted termination}
    - {key: failed cancelled, value: explicit terminal outcome}
    - {key: ambiguous, value: transport lost without terminal}
```

## References

[R46.9](references.md#r46-9), [R46.10](references.md#r46-10), [R46.11](references.md#r46-11), [R46.12](references.md#r46-12), [R46.13](references.md#r46-13), [R46.20](references.md#r46-20).
