---
id: ms.section.51.3
entity_type: section
title: "Protocol boundaries"
volume: 3
part: 9
chapter: 51
section: 51.3
slug: 51-3-protocol-boundaries
parent: ms.chapter.51
prev_sibling: ms.section.51.2
next_sibling: ms.section.51.4
children: []
prerequisites: [ms.chapter.10, ms.chapter.11, ms.chapter.37, ms.chapter.46, ms.chapter.47, ms.chapter.50]
downstream: [ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [tool_use, typed_interfaces, authorization], feedback_setting: [], modality: [text]}
papers: [P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 51.3 Protocol boundaries

## Scope

[OFFICIAL-DOCUMENTATION] This section pins MCP to revision 2026-07-28, inspected on 2026-10-14. Modern MCP uses per-request version/capability metadata, client-initiated JSON-RPC interactions and no protocol-level session or initialize handshake [R51.9, Versioning; R51.10, Messages/Request Metadata]. Older initialization-based behavior belongs only to explicitly supported legacy compatibility.

[DERIVED] The object is an interoperable tool boundary, not a planning algorithm or proof of authorization. We examine message representation, transport framing, discovery, version handling, credentials and lifecycle. The baseline treats “MCP connected” as both a durable session and permission to use every discovered operation. That model is incorrect for the pinned revision and unsafe as an application contract.

## Why this exists

[DERIVED] Interface revisions can change who initiates messages, where state lives and how a proxy routes requests. A client built around connection-scoped initialization may discard essential per-request metadata or send an obsolete server callback response. A load balancer that assumes session affinity may conceal application state that was never made explicit. A protocol adapter must therefore identify the actual revision before inferring lifecycle behavior from a familiar method name.

[DERIVED] Transport connectivity also crosses distinct authority boundaries. Launching a subprocess gives it some operating-system privileges; obtaining an HTTP token gives access to a particular protected resource under particular claims. Neither establishes that a model-generated action satisfies current user intent, resource ownership or business rules. Protocol conformance and task authorization must be reviewed separately.

[OFFICIAL-DOCUMENTATION] The pinned schema makes protocolVersion and clientCapabilities required per request, while clientInfo is optional with a SHOULD-level inclusion recommendation and is self-reported [R51.2, RequestMetaObject lines 69–98]. Some prose examples group clientInfo with required metadata; the explicit field definition is the narrower basis used here.

## Intuition

[DERIVED] Think of each modern request as carrying enough protocol context to be interpreted independently. “Stateless protocol” means the wire does not supply an implicit conversation/session container. A server may still maintain a database, task or shopping cart. Such application state needs explicit identity, lifetime and authorization; it does not disappear because transport state was removed.

[DERIVED] Discovery tells a client what features and versions a server reports. Authentication verifies a principal under a credential mechanism. Authorization decides whether that principal may perform this operation on this object now. A result containing more input requests is an unfinished interaction; it does not hand the server autonomous authority to initiate arbitrary client operations.

## Formulation

[DERIVED] Represent a modern request as
$$
m=(\mathrm{id},\mathrm{method},\mathrm{params},
v,\kappa_c,p_{\rm transport}),
\qquad
\operatorname{Admit}(m)=
\operatorname{WireValid}(m)\land
v\in\mathcal V_s\land
\operatorname{CapabilityCompatible}(m)\land
\operatorname{Authorized}(p_{\rm transport},m).

$$
*(Eq. 51.6)*
Here $v$ is the declared revision, $\kappa_c$ the request's client capabilities, $\mathcal V_s$ supported server revisions, and $p_{\rm transport}$ verified identity if authentication is present. An anonymous deployment must define its own constrained policy; missing credentials are not inferred identity.

[MATHEMATICALLY-DERIVED] In a simplified serial path with round-trip time $r>0$, $d\in\{0,1\}$ optional discovery exchanges, nonnegative integer $u$ version-retry exchanges and nonnegative integer $j$ additional input cycles, communication waiting alone is
$$
T_{\rm rt}=(1+d+u+j)r.

$$
*(Eq. 51.7)*
This omits processing, user think time, queueing, authentication discovery and token acquisition; their costs are additional. No mandatory modern initialize exchange is hidden in the constant. Parallel work and unequal RTTs require the actual dependency graph instead of this scalar approximation.

[DERIVED] A compatibility state is $(e,\mathcal V_{\rm tried},v)$ with era $e\in\{\mathrm{unknown,modern,legacy}\}$. The era is a property of the counterpart/configuration, while selected revision is a property of requests. A recognized modern version error is evidence to try a mutually supported modern revision, not evidence to force a legacy initialization path.



```figure
{
  "id": "fig-51.9",
  "kind": "calculator",
  "title": "Serial communication floor",
  "caption": "Serial equal-RTT illustration excludes processing, authentication and user think time; modern initialize is not a required exchange.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-51.7",
  "alt": "Serial equal-RTT illustration excludes processing, authentication and user think time; modern initialize is not a required exchange.",
  "spec": {
    "tex": "T_{\\rm rt}=(1+d+u+j)r",
    "equation": "51.7",
    "inputs": [
      {
        "symbol": "rtt",
        "label": "Round-trip seconds",
        "default": 0.05,
        "min": 0.001,
        "max": 5,
        "format": "seconds"
      },
      {
        "symbol": "discover",
        "label": "Optional discovery exchanges",
        "default": 1,
        "min": 0,
        "max": 1,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "versions",
        "label": "Additional version exchanges",
        "default": 0,
        "min": 0,
        "max": 8,
        "format": "integer",
        "step": 1
      },
      {
        "symbol": "inputs",
        "label": "Additional input exchanges",
        "default": 2,
        "min": 0,
        "max": 8,
        "format": "integer",
        "step": 1
      }
    ],
    "outputs": [
      {
        "symbol": "result",
        "label": "Communication seconds",
        "formula": "(1+discover+versions+inputs)*rtt",
        "format": "seconds"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[OFFICIAL-DOCUMENTATION] Every modern interaction starts at the client. A server answers with a result or error and may emit request-related notifications; it does not initiate JSON-RPC requests. Additional sampling, elicitation or roots input is represented through an input_required result, after which the client gathers allowed input and retries with matching inputResponses and opaque requestState [R51.11, Request/Response; R51.12, Core Types]. This is client-mediated re-entry, not an unrestricted callback channel.

[OFFICIAL-DOCUMENTATION] Version mismatch returns -32022 with supported versions. Servers implement server/discover; a modern client may call it first or send an operation directly and handle the mismatch [R51.9, Protocol Version Negotiation; R51.7]. A dual-era client uses binding-specific detection for legacy fallback. The recognized-modern-error branch remains modern; fallback is not keyed to one assumed legacy error code.

[OFFICIAL-DOCUMENTATION] stdio frames one JSON-RPC message per newline over a client-launched subprocess's standard streams; logging goes to stderr rather than corrupting stdout [R51.13, Sending/Receiving Messages]. Streamable HTTP uses an individual POST for each message and returns either JSON or a request-scoped SSE stream; modern core has no GET stream endpoint, protocol sessions or resumable Last-Event-ID stream [R51.14, Sending/Receiving Messages]. These transport semantics must not be copied from the 2025 revision.

[OFFICIAL-DOCUMENTATION] Protocol metadata remains in the body. HTTP mirrors selected metadata into headers and rejects mismatches according to the binding; the body is the source of truth [R51.10, Request Metadata; R51.14, Request Metadata Headers]. Subscriptions are explicit long-lived requests; reconnection requires reissuing them rather than assuming a hidden session survived [R51.11, Subscribe and Notify].

[OFFICIAL-DOCUMENTATION] For HTTP requests, MCP-Protocol-Version mirrors the body revision; Mcp-Method mirrors the RPC method for all requests, and Mcp-Name mirrors the name/URI for tools/call, resources/read and prompts/get. Header/body mismatches return 400. Unsupported revisions return HTTP 400 with -32022; unknown RPC methods return 404 with -32601. A present invalid Origin is rejected with 403 [R51.14, Security & Endpoint/Protocol Version Header/Standard Request Headers/Server Validation]. Values outside the safe header representation use the specified UTF-8 Base64 sentinel encoding, including literal values that resemble the sentinel. Custom x-mcp-header parameters require the binding's type/path/name constraints and safe encoding; sensitive values should not be mirrored into intermediary-visible headers [R51.14, Custom Headers/Value Encoding; R51.1, x-mcp-header].

[OFFICIAL-DOCUMENTATION] MCP's authorization specification applies to HTTP transports; stdio credentials instead come from the environment. For protected HTTP resources it specifies OAuth discovery, resource indicators and audience-bound access tokens, with authorization on every HTTP request [R51.15, Purpose and Scope/Resource Parameter/Token Handling]. Token availability does not eliminate operation/resource authorization inside the service.

[DERIVED] **Cost.** Count serialized metadata and schemas, parsing, TLS/network establishment where applicable, authentication discovery/refresh, input cycles and subscriptions separately. Per-request metadata can add bytes while removing a required connection handshake. Neither direction proves lower latency under actual workloads. HTTP framing, proxy buffering, subprocess startup, server work and user interactions can dominate the simple Eq. 51.7 bound.

[DERIVED] Lifecycle ownership follows the transport/application split. A subprocess may exit while an external side effect persists. An HTTP response stream can close while a worker has crossed a commit point. Explicit handles identify application state across requests; a handle's possession does not authorize the caller in an authenticated service. §51.4 owns unresolved execution; §51.5 owns commit and compensation.



```figure
{
  "id": "fig-51.10",
  "kind": "diagram",
  "title": "Modern request interpretation",
  "caption": "Per-request version/capabilities precede dispatch; additional input returns through client-mediated re-entry.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.7",
  "alt": "Request metadata passes a version/capability gate or terminates with a typed error. Dispatch can complete, or request additional input; only client-authorized continuation creates a new validated request.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "flow",
        "label": "Request plus metadata"
      },
      {
        "id": "p",
        "kind": "branch",
        "label": "Version / capability valid?"
      },
      {
        "id": "g",
        "kind": "process",
        "label": "Dispatch"
      },
      {
        "id": "e",
        "kind": "branch",
        "label": "Complete or input_required"
      },
      {
        "id": "done",
        "kind": "state",
        "label": "Complete result"
      },
      {
        "id": "o",
        "kind": "branch",
        "label": "Client authorizes re-entry?"
      },
      {
        "id": "stop",
        "kind": "state",
        "label": "Error / no continuation"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "p"
      },
      {
        "from": "p",
        "to": "g",
        "label": "valid"
      },
      {
        "from": "p",
        "to": "stop",
        "label": "invalid"
      },
      {
        "from": "g",
        "to": "e"
      },
      {
        "from": "e",
        "to": "done",
        "label": "complete"
      },
      {
        "from": "e",
        "to": "o",
        "label": "input_required"
      },
      {
        "from": "o",
        "to": "a",
        "label": "authorized new request",
        "kind": "feedback"
      },
      {
        "from": "o",
        "to": "stop",
        "label": "declined / unavailable"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 51.3 — Bounded modern protocol dispatch.** [DERIVED] Inputs are an already authorized proposal, client-supported revisions, endpoint configuration, deadline and finite integer version/input budgets $k_{\rm ver},k_{\rm in}\ge0$. Output is a validated result, a typed protocol failure or an unresolved application outcome.

$$
\begin{aligned}
1.&\quad v\leftarrow v_{\rm preferred};\quad
\mathcal V_{\rm tried}\leftarrow\varnothing;\quad j\leftarrow0.\\
2.&\quad \operatorname{SendBoundedRequest}(\mathrm{new\ id},v,\kappa_c,\mathrm{params});
\quad\mathcal V_{\rm tried}\leftarrow\mathcal V_{\rm tried}\cup\{v\}.\\
3.&\quad \mathrm{error}=-32022\land
\operatorname{ConfirmedNoApplicationExecution}\Rightarrow\\
 &\quad \mathcal U\leftarrow(\mathcal V_c\cap\mathcal V_s)\setminus\mathcal V_{\rm tried};
\quad \mathcal U\ne\varnothing\land|\mathcal V_{\rm tried}|\le k_{\rm ver}
\Rightarrow v\leftarrow\operatorname{Choose}(\mathcal U);\,\operatorname{GoTo}(2).\\
4.&\quad \mathrm{resultType}=\mathrm{input\_required}\land j<k_{\rm in}
\land\operatorname{BeforeDeadline}\Rightarrow\\
 &\quad \operatorname{ValidateAndAuthorizeInputRequests};
\quad \operatorname{DeniedOrUnsupported}\Rightarrow\operatorname{StopWithFailure};\\
 &\quad \operatorname{CollectBoundedResponses};\,
j\leftarrow j+1;\,\operatorname{AttachOpaqueStateAndResponses};\,\operatorname{GoTo}(2).\\
5.&\quad \operatorname{CompleteCompatibleResult}\Rightarrow\operatorname{ValidateAndReturn};
\quad\operatorname{Otherwise}\Rightarrow\operatorname{ReturnTypedFailureOrUnknown}.
\end{aligned}
$$

[DERIVED] Budgets count additional version attempts and input cycles; the absolute deadline applies to all branches, including discovery/authentication. Invariants are fresh transport correlation IDs, current metadata, preserved logical operation identity and no opaque-state interpretation. A lost response or untrusted error cannot certify that no effect occurred; it enters reconciliation, not blind retry. Legacy fallback is a separately configured finite adapter, not an implicit branch that removes modern security requirements.

## Implementation

[OFFICIAL-DOCUMENTATION] The pinned schema source distinguishes RequestMetaObject, DiscoverRequest, InputRequiredResult and CallToolRequestParams [R51.2]. This is static specification inspection. It does not establish that a named SDK implements every 2026 method, that two libraries interoperate or that a running server enforces all predicates.

[DERIVED] An adapter should carry protocol era/revision in its connection configuration and request logs, while keeping secrets out of model context. Preserve the response discriminator before parsing its payload: an input request is neither final task success nor an authorization grant. Match inputResponses to the original keys and cap their number, content and total iterations. Every input request remains subject to client policy, including sampling requests with persuasive system prompts.

[DERIVED] For an aggregate proxy, bind catalog records to authenticated endpoints rather than serverInfo names. Recheck credentials and object ownership on explicit handles. Transport-level security failures should not be paraphrased into ordinary model tool results that suggest another route around the boundary.

## Experimental design

### Reported experiments

[NOT-DISCLOSED] The inspected normative protocol pages define requirements, not a matched 2026 throughput, reliability or SDK-interoperability experiment. There is no source-supplied performance table to borrow for Eq. 51.7. Compatibility must be tested at exact client/server revisions and transports.

[PAPER-REPORTED] τ-bench and τ²-bench evaluate tool-using conversations under their own APIs and simulated users [P43; R51.8]. Their task outcomes do not test modern MCP conformance, OAuth audience enforcement, transport cancellation or backward compatibility. They motivate application-level evaluation while leaving these protocol obligations open.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] It defines request-scoped interpretation, discovery, transports and authorization requirements.

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] The inspected 2026 revision and pinned schema encode those requirements; some overview/example wording needs reconciliation with explicit field definitions.

**What we infer.** [DERIVED] Protocol era must be an explicit implementation dimension.

**What remains unknown.** [UNVERIFIED] No actual SDK pair, network configuration or server enforcement was executed here.



```figure
{
  "id": "fig-51.11",
  "kind": "stat-panel",
  "title": "Contract boundary to retain",
  "caption": "These distinctions constrain claims; they are not measured deployment results.",
  "placement": "rail",
  "anchor": "observations",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.7",
  "alt": "Four relevant execution boundaries remain explicit.",
  "spec": {
    "header": "EXECUTION CONTRACT",
    "rows": [
      {
        "key": "era",
        "value": "Modern versus legacy explicit"
      },
      {
        "key": "metadata",
        "value": "Version and capabilities/request"
      },
      {
        "key": "body",
        "value": "Source of truth for mirrors"
      },
      {
        "key": "state",
        "value": "Explicit application handles"
      }
    ]
  }
}
```

## Failure modes

[DERIVED] Era confusion produces initialize assumptions on a modern endpoint or modern requests interpreted by a permissive legacy server; use explicit detection and diagnostic logs. Header/body disagreement creates routing ambiguity; reject rather than selecting whichever value is convenient. A stale capability cache causes unsupported callbacks/results; honor per-request declarations. An implicit application session loses or crosses user state after routing; use explicit scoped handles. Credential forwarding to the wrong audience crosses resource boundaries; validate audiences and obtain appropriate downstream credentials.

## Siblings

[DERIVED] A direct typed function adapter can avoid a network protocol but still needs validation and authorization. HTTP/OpenAPI interfaces expose their own method/schema/lifecycle conventions; MCP adds standardized discovery and interaction patterns without replacing backend semantics. Compare adapters at equal operations and trust policy. Chapters 46–47 own production service boundaries and recovery; Chapter 65 owns broader security evaluation.

## Extensions

### Improvements

[OFFICIAL-DOCUMENTATION] The 2026 change replaces legacy connection-scoped initialization and server-originated requests with per-request metadata and client-mediated input cycles [R51.9; R51.12]. This is a documented mechanism change; no universal speed or safety gain follows from it. The separately negotiated Tasks extension adds deferred task handles and polling and remains a Draft extension, analyzed in §51.4 [R51.16].

[DERIVED] Open research concerns auditing cross-version adapters without weakening authority or duplicating effects, and predicting the latency/resource consequences of repeated user/input cycles. Settling evidence requires faulted interoperability traces and application commit observations, not only successful wire examples.

## Limitations

[DERIVED] Normative conformance does not prove implementation conformance. Stateless protocol semantics do not imply stateless application behavior or idempotent retry. Self-reported identity/capability claims cannot establish trust. Authentication can be optional in a deployment, but its absence requires a correspondingly restricted application threat model; it cannot be treated as a verified principal.

## Reproducibility

[UNVERIFIED] Pin client/server/proxy revisions, schema revision, era policy, transports, discovery/authentication metadata, credential audiences, timeout limits and raw secret-redacted message traces. No live endpoint, OAuth flow or compatibility matrix was tested. Proposed conformance and failure checks are in verification.md.

## References

[OFFICIAL-DOCUMENTATION] [R51.2](references.md#r51-2) pinned schema; [R51.7](references.md#r51-7) Discovery; [R51.9–R51.16](references.md#r51-9) versioning, transports, patterns, authorization and Tasks. [PAPER-REPORTED] [P43](references.md#p43), [R51.8](references.md#r51-8) application benchmarks. Access 2026-10-14.
