---
id: ms.verification.51
entity_type: verification
title: "Chapter 51 verification"
volume: 3
part: 9
chapter: 51
section: null
slug: verification
parent: ms.chapter.51
prev_sibling: ms.section.51.6
next_sibling: ms.references.51
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
word_count_target: 2500
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 51 verification

## Status and scientific question

[UNVERIFIED] This is a proposed tool-execution study. No server, model, router, validator, OAuth flow, transaction backend, detector or sandbox was executed. Structural/figure checks and independent mathematical review establish manuscript consistency only.

[DERIVED] The scientific question is whether a typed executor preserves intended authorized effects and accurately reports unknown/partial outcomes under malformed input/output, duplicate delivery, timeouts, restart and adversarial observations. The null engineering claim is that parseable function calls and protocol connectivity are insufficient to establish that property.

## Artifact and identity

[DERIVED] Preserve qualified tool identities, contract/schema/dialect hashes, principal and resource policy, argument provenance, logical-operation and attempt IDs, durable budgets/deadlines/ownership, proposal digests and applicable authorization, prepared/committed/reconciled journals, exact client/server/proxy versions and transport era, raw secret-redacted events and independent task/policy assertions.

[OFFICIAL-DOCUMENTATION] The MCP normative revision is 2026-07-28. Schema and licensing inspection is pinned to 5ea996028df322ce97d1c906731cf8c05a6e268e. Revision-named web pages remain mutable. ClientInfo is optional in the explicit schema; version and client capabilities are required. The Tasks material is a separate Draft extension; no SDK conformance follows from its existence [R51.2/R51.9/R51.16/R51.24].

## Topic-completeness and evidence audit

[DERIVED] Each required topic below inherits all thirteen obligations through the exact section-anchor routing. Sources support only their recorded scope. The final column is proposed verification, not an observed outcome.

| ID / topic | Owner / mechanism | Source locator | Math and cost boundary | Present gap / proposed rejection |
|---|---|---|---|---|
| T1 Function schemas | 51.1 accepted call language | R51.1 Tool; R51.2 Tool | Eqs. 51.1–51.2, parser bytes/depth | No validator run; reject unsupported keyword claims |
| T2 Types | 51.1 explicit dialect/null/units | R51.3 §§6–7 | Validation versus annotations; no silent coercion | No fixture; reject semantic equivalence by type alone |
| T3 Capabilities | 51.1 descriptive versus authority | R51.1 ToolAnnotations | Trusted predicates separate from hints | No enforcement; reject discoverable=authorized |
| T4 Required arguments | 51.1 provenance/precondition | R51.1 inputSchema | Missing evidence is not true | No grounding records; reject fabricated defaults |
| T5 Result schemas | 51.1 structured output validation | R51.1 Output Schema | Bytes, postconditions and status distinct | No result fixtures; reject parseable=successful |
| T6 Semantic preconditions | 51.1 state-owning gate | Book Eqs. 51.1–51.2 | Commit-time state recheck | No backend; reject stale preflight proof |
| R1 Discovery | 51.2 versioned qualified catalog | R51.7; R51.1 Listing | Pages/bytes/visibility and expiry | No catalog; reject globally unique display names |
| R2 Tool retrieval | 51.2 eligible bounded candidates | R51.6 §§2–3/Table 2 | Eq. 51.3 coverage; O(md_r) brute force | No held-out catalog; reject annotated-path-only coverage |
| R3 Constrained selection | 51.2 model proposal plus abstention | R51.6 Table 3; Chapter 37 | Eq. 51.5 utility conditional, policy precedes | No calibrated selector; reject similarity as probability |
| R4 Argument grounding | 51.2 evidence per argument | Book contract | Lookup/context/cost and provenance | No observed mapping; reject invented IDs |
| R5 Unsupported requests | 51.2 explicit normal outcome | Algorithm 51.2 | Empty/ambiguous candidate branches | No unsupported-task suite |
| R6 Catalog drift | 51.2 finite refresh | R51.1 List Changed | Persist identity/revision; finite refresh | No invalidation test; reject endless search |
| P1 Interfaces | 51.3 protocol/adapter boundary | R51.9–R51.15 | Eq. 51.6 independent admission factors | No client/server conformance |
| P2 Transport | 51.3 stdio versus HTTP/SSE | R51.13–R51.14 | Framing, bytes, subprocess/network costs | No raw traces; reject old GET/session model |
| P3 Lifecycle | 51.3 explicit state/streams | R51.10–R51.13 | Eq. 51.7 RTT model only | No restart test; state is application-owned |
| P4 Authentication | 51.3 verified identity | R51.15 Roles/Token Handling | HTTP OAuth; stdio environment credentials | No live flow; reject self-reported clientInfo identity |
| P5 Authorization | 51.3 resource and operation | R51.15; R51.20 | Every request/handle policy | No ownership test; access is not authority |
| P6 Version negotiation | 51.3 -32022 and era detection | R51.9 Compatibility Matrix | Finite revision attempts/deadline | No matrix run; reject modern-error legacy downgrade |
| P7 Capability discovery | 51.3 per-request declarations | R51.2 RequestMetaObject; R51.7 | No inference from prior request | No capability permutations |
| P8 HTTP mirrors | 51.3 method/name/version headers | R51.14 Standard Headers/Server Validation | 400/-32020, 400/-32022, 404/-32601, Origin403 | No malformed/mismatch fixtures |
| E1 Validation | 51.4 layered response interpretation | R51.1 Error Handling; R51.2 | Input/result/postcondition distinct | No output checks; reject result object=success |
| E2 Timeouts | 51.4 unknown effect knowledge | R51.17 Timeouts | Absolute persisted deadline; Eq. 51.8 | No lost-response fault; reject timeout=no effect |
| E3 Cancellation | 51.4 signaling and races | R51.17 Timing | Transport signal versus application rollback | No race test |
| E4 Retries | 51.4 durable attempts and fencing | Algorithm 51.4 | At most k_retry+1 reservations across restart | No concurrent worker; reject reset budget |
| E5 Idempotency | 51.4 effect-domain repeat semantics | R51.18 §9.2.2; Eq. 51.9 | Atomic dedup scope/retention | No ledger; reject RPC ID as dedup proof |
| E6 Asynchronous completion | 51.4 negotiated Draft Tasks | R51.16 Task Status/Cancellation | Poll count, expiry/status/error interpretation | No task backend; no guaranteed cancellation |
| E7 Result interpretation | 51.4 authoritative outcome | P43 §3; Eq. 51.8 | Unknown/partial versus final success | No live state oracle |
| E8 Reliability | 51.4 all-k repeated trials | P43 §§3/5; R51.8 §4; Eq. 51.10 | iid within task, valid integer counts | No trials; reject pass@k substitution |
| S1 Dry run | 51.5 preview meaning/isolation | Book contract | Preparation versus live effect boundary | No preview backend; reject name as no-effect proof |
| S2 Approval boundary | 51.5 proposal/scope binding | Eq. 51.11; P43 policy caveat | Standing authority versus new required decision | No approval fixture; reject regenerated action |
| S3 Transaction | 51.5 atomic state check and commit | Eq. 51.11 | Lock/version cost; race counterexample | No transactional backend |
| S4 Compensation | 51.5 semantic recovery | R51.19 §§2–7; Eq. 51.13 | New authorized effects, not inverse | No compensation; reject exact-state rollback claim |
| S5 Resource isolation | 51.5 external enforcement | R51.20 Local Server Compromise | Mount/network/credential/quotas | No sandbox; reject disposable label as isolation |
| S6 Auditability | 51.5 durable PREPARED journal | Algorithm 51.5 | Persist before dispatch; redact/access-control | No crash trace; reject missing effect entry |
| X1 Injection through results | 51.6 data versus instruction | R51.21 §§2–3; R51.22 §§3–4 | Eq. 51.14 gate, not semantic proof | No attack run |
| X2 Secret handling | 51.6 outside model observations | R51.15 Token Handling; R51.20 | Credential audience and redaction | No credential flow |
| X3 Least privilege | 51.6 independent scope | R51.20 Scope Minimization | In-scope errors still possible | No permission matrix |
| X4 Confused deputy | 51.6 proxy/client/resource binding | R51.20 Confused Deputy | Authority source cannot be result text | No proxy test |
| X5 Sandbox escape surfaces | 51.6 host enforcement | R51.20 Local/stdio Proxy | OS boundary, mounts/egress and parser | No exploit/isolation verification |
| X6 Detector tradeoff | 51.6 prevalence and false blocks | R51.23 §4.3/§5/Table 2; Eqs. 51.15–16 | Prospective threshold; dependent outputs | No detector; reject classifier TPR as agent ASR |
| X7 Callback/input content | 51.6 client-mediated untrusted input | R51.12/R51.16 | Bounded input cycles and client policy | No elicitation/sampling test |

## Obligation-to-anchor routing

[DERIVED] Every row inherits P/F/M/Q/A/I/C/E/O/S/L/V/R below from its owning section. Exact row sources/locators remain controlling. Documentation-only topics have no matched empirical improvement experiment.

| Code | Contract obligation | Owning anchor(s) |
|---|---|---|
| P | Problem and prior limitation | scope; why-this-exists |
| F | Formal contract | formulation |
| M | Full methodology | mechanism / Methodology |
| Q | Mathematical account | formulation; mechanism |
| A | Procedure/state/failure/stopping | algorithm |
| I | Implementation | implementation |
| C | Resource accounting | mechanism; algorithm; implementation |
| E | Source-reported protocol | experimental-design |
| O | Four-part observations | observations |
| S | Alternatives | siblings |
| L | Improvement and lineage | extensions; README lineage |
| V | Limits and validity | failure-modes; limitations |
| R | Closure and sources | reproducibility; references |

| Topics | Owner | Exact anchors for all obligations |
|---|---|---|
| T1–T6 | [51-1](51-1-tool-representation.md) | [P 1](51-1-tool-representation.md#scope) / [P 2](51-1-tool-representation.md#why-this-exists); [F 1](51-1-tool-representation.md#formulation); [M 1](51-1-tool-representation.md#mechanism); [Q 1](51-1-tool-representation.md#formulation) / [Q 2](51-1-tool-representation.md#mechanism); [A 1](51-1-tool-representation.md#algorithm); [I 1](51-1-tool-representation.md#implementation); [C 1](51-1-tool-representation.md#mechanism) / [C 2](51-1-tool-representation.md#algorithm) / [C 3](51-1-tool-representation.md#implementation); [E 1](51-1-tool-representation.md#experimental-design); [O 1](51-1-tool-representation.md#observations); [S 1](51-1-tool-representation.md#siblings); [L 1](51-1-tool-representation.md#extensions); [V 1](51-1-tool-representation.md#failure-modes) / [V 2](51-1-tool-representation.md#limitations); [R 1](51-1-tool-representation.md#reproducibility) / [R 2](51-1-tool-representation.md#references) |
| R1–R6 | [51-2](51-2-routing-and-selection.md) | [P 1](51-2-routing-and-selection.md#scope) / [P 2](51-2-routing-and-selection.md#why-this-exists); [F 1](51-2-routing-and-selection.md#formulation); [M 1](51-2-routing-and-selection.md#mechanism); [Q 1](51-2-routing-and-selection.md#formulation) / [Q 2](51-2-routing-and-selection.md#mechanism); [A 1](51-2-routing-and-selection.md#algorithm); [I 1](51-2-routing-and-selection.md#implementation); [C 1](51-2-routing-and-selection.md#mechanism) / [C 2](51-2-routing-and-selection.md#algorithm) / [C 3](51-2-routing-and-selection.md#implementation); [E 1](51-2-routing-and-selection.md#experimental-design); [O 1](51-2-routing-and-selection.md#observations); [S 1](51-2-routing-and-selection.md#siblings); [L 1](51-2-routing-and-selection.md#extensions); [V 1](51-2-routing-and-selection.md#failure-modes) / [V 2](51-2-routing-and-selection.md#limitations); [R 1](51-2-routing-and-selection.md#reproducibility) / [R 2](51-2-routing-and-selection.md#references) |
| P1–P8 | [51-3](51-3-protocol-boundaries.md) | [P 1](51-3-protocol-boundaries.md#scope) / [P 2](51-3-protocol-boundaries.md#why-this-exists); [F 1](51-3-protocol-boundaries.md#formulation); [M 1](51-3-protocol-boundaries.md#mechanism); [Q 1](51-3-protocol-boundaries.md#formulation) / [Q 2](51-3-protocol-boundaries.md#mechanism); [A 1](51-3-protocol-boundaries.md#algorithm); [I 1](51-3-protocol-boundaries.md#implementation); [C 1](51-3-protocol-boundaries.md#mechanism) / [C 2](51-3-protocol-boundaries.md#algorithm) / [C 3](51-3-protocol-boundaries.md#implementation); [E 1](51-3-protocol-boundaries.md#experimental-design); [O 1](51-3-protocol-boundaries.md#observations); [S 1](51-3-protocol-boundaries.md#siblings); [L 1](51-3-protocol-boundaries.md#extensions); [V 1](51-3-protocol-boundaries.md#failure-modes) / [V 2](51-3-protocol-boundaries.md#limitations); [R 1](51-3-protocol-boundaries.md#reproducibility) / [R 2](51-3-protocol-boundaries.md#references) |
| E1–E8 | [51-4](51-4-execution-correctness.md) | [P 1](51-4-execution-correctness.md#scope) / [P 2](51-4-execution-correctness.md#why-this-exists); [F 1](51-4-execution-correctness.md#formulation); [M 1](51-4-execution-correctness.md#mechanism); [Q 1](51-4-execution-correctness.md#formulation) / [Q 2](51-4-execution-correctness.md#mechanism); [A 1](51-4-execution-correctness.md#algorithm); [I 1](51-4-execution-correctness.md#implementation); [C 1](51-4-execution-correctness.md#mechanism) / [C 2](51-4-execution-correctness.md#algorithm) / [C 3](51-4-execution-correctness.md#implementation); [E 1](51-4-execution-correctness.md#experimental-design); [O 1](51-4-execution-correctness.md#observations); [S 1](51-4-execution-correctness.md#siblings); [L 1](51-4-execution-correctness.md#extensions); [V 1](51-4-execution-correctness.md#failure-modes) / [V 2](51-4-execution-correctness.md#limitations); [R 1](51-4-execution-correctness.md#reproducibility) / [R 2](51-4-execution-correctness.md#references) |
| S1–S6 | [51-5](51-5-side-effect-management.md) | [P 1](51-5-side-effect-management.md#scope) / [P 2](51-5-side-effect-management.md#why-this-exists); [F 1](51-5-side-effect-management.md#formulation); [M 1](51-5-side-effect-management.md#mechanism); [Q 1](51-5-side-effect-management.md#formulation) / [Q 2](51-5-side-effect-management.md#mechanism); [A 1](51-5-side-effect-management.md#algorithm); [I 1](51-5-side-effect-management.md#implementation); [C 1](51-5-side-effect-management.md#mechanism) / [C 2](51-5-side-effect-management.md#algorithm) / [C 3](51-5-side-effect-management.md#implementation); [E 1](51-5-side-effect-management.md#experimental-design); [O 1](51-5-side-effect-management.md#observations); [S 1](51-5-side-effect-management.md#siblings); [L 1](51-5-side-effect-management.md#extensions); [V 1](51-5-side-effect-management.md#failure-modes) / [V 2](51-5-side-effect-management.md#limitations); [R 1](51-5-side-effect-management.md#reproducibility) / [R 2](51-5-side-effect-management.md#references) |
| X1–X7 | [51-6](51-6-tool-security.md) | [P 1](51-6-tool-security.md#scope) / [P 2](51-6-tool-security.md#why-this-exists); [F 1](51-6-tool-security.md#formulation); [M 1](51-6-tool-security.md#mechanism); [Q 1](51-6-tool-security.md#formulation) / [Q 2](51-6-tool-security.md#mechanism); [A 1](51-6-tool-security.md#algorithm); [I 1](51-6-tool-security.md#implementation); [C 1](51-6-tool-security.md#mechanism) / [C 2](51-6-tool-security.md#algorithm) / [C 3](51-6-tool-security.md#implementation); [E 1](51-6-tool-security.md#experimental-design); [O 1](51-6-tool-security.md#observations); [S 1](51-6-tool-security.md#siblings); [L 1](51-6-tool-security.md#extensions); [V 1](51-6-tool-security.md#failure-modes) / [V 2](51-6-tool-security.md#limitations); [R 1](51-6-tool-security.md#reproducibility) / [R 2](51-6-tool-security.md#references) |

[DERIVED] Exceptions: T1–T6 and P1–P8 are structural/normative contracts; no training split or source-reported matched runtime-performance experiment exists. Toolformer provides learned-calling context, not validator/authorization validation. R1–R6's ToolLLM evidence belongs to its historical generated tasks and live APIs, not current catalogs. E1–E8 use conditional book execution arguments and τ task experiments; those task studies do not inject real distributed commit faults. S1–S6 use transaction/recovery lineage and task-policy limitations without a matched agent compensation study. X1–X7's benchmarks measure different interception/action/detector objects; no universal defense claim is inherited. Missing performance/safety experiments remain claim-blocking gaps.

## Proposed experimental design

[ASSUMED] Use a disposable state-owning fixture with typed read/update operations, explicit authorization, versioned resources and independently readable effect/audit state. Include a mock external-effect service with its own deduplication key and outcome lookup. Pin executor/validator/protocol code and exact contracts. A fixture is a controlled experiment, not evidence of production safety.

[ASSUMED] Establish valid, semantically invalid, unauthorized, missing-information and unsupported-task cases before comparing routers or models. Split by operation/template and resource identity to avoid memorized argument mappings. Include equivalent valid solution paths and no-tool completions so coverage reflects the task rather than one annotated sequence.

[ASSUMED] Compare full-catalog, bounded lexical/dense retrieval and deterministic workflow routing at equal eligible catalogs and total call/token budgets. Record unsupported/abstained outcomes, catalog leakage, grounded argument validity and final task acceptance. Do not report retrieval recall as accepted execution.

[ASSUMED] For the protocol layer, exercise modern-only and explicitly configured dual-era clients/servers over both transports. Test version errors, missing/mismatched headers, invalid Origin, unsupported capabilities, malformed result discriminators and bounded input cycles. Confirm body/header agreement and that recognized modern errors do not trigger legacy downgrade. No credentials or secrets belong in the released traces.

[ASSUMED] Schedule faults before dispatch, after durable PREPARED reservation, immediately before/after commit, after commit but before response, during cancellation and after process restart. Duplicate deliveries reuse logical operation identity while obtaining fresh attempt IDs. Run concurrent ownership contenders to test fenced reservation and persisted budgets. Measure the authoritative effect count and operation status, not only client return values.

[ASSUMED] Exercise expired deduplication records, same-key changed arguments/revision, unavailable reconciliation and external services lacking atomic coordination. These cases should expose bounded guarantees and unresolved outcomes. A failed reconciliation must not become known absence; an abandoned attempt must not replenish a budget without the declared authoritative release rule.

[ASSUMED] For side effects, bind approval to a prepared proposal, mutate state before commit and verify rejection/re-preparation under policy. Preserve standing authorization when still applicable. Inject partial multi-step completion and failed compensation; check journal persistence before dispatch and residual state after recovery. Include zero-step workflows and missing authorization after earlier commits.

[ASSUMED] For security, use a predeclared bounded attack set in the fixture and held-out legitimate tasks. Specify which result fields the attacker controls and which authority remains unavailable. Compare no detector, a fixed detector and independent executor gates while keeping the task policy constant. Thresholds are selected on separate calibration data. Record detector false flags, blocked tasks, proposed unauthorized actions and actually executed unauthorized effects separately.

[ASSUMED] Evaluate long outputs, serialization variants and distribution shifts without truncating the adversarial content out of view. Report task-level utility under the actual block/recovery policy and total screening/context/network latency/cost. Training-overlap audits distinguish training-half from test-half material and exact matches from broader potential contamination.

## Acceptance, limitations and open questions

[DERIVED] Acceptance requires traceable contract/identity artifacts, correct known/unknown effect classification, no out-of-scope execution in the declared test set, durable budget/journal invariants and verified final/partial states. Security results remain bounded by attacker control and query budget; absence of observed failures is not a general proof.

[UNVERIFIED] Review blockers are executable pinned adapters/validators/backends, independent state and policy assertions, fault/duplicate/restart traces, held-out routing tasks and detector/permission/isolation checks. Current manuscript validation cannot remove them.

[DERIVED] Substantive open questions include solution-set coverage under changing catalogs, reusable partial-effect contracts across heterogeneous services, prospective low-FPR calibration under changing formats and compensation under concurrent actors. Settling evidence requires held-out tasks, actual effect/state observations, prospective thresholds and controlled recovery boundaries; additional successful demonstrations cannot substitute.

## Search and inspection ledger

[OFFICIAL-DOCUMENTATION] Actual searches on 2026-10-14 included “2026 tool calling benchmark protocol agent reliability”, “AgentDojo InjecAgent prompt injection benchmark” and “2026 MCP authorization tool security”. Searches were discovery routes; every adopted mechanism/result comes from the inspected primary text in references.md. MCP pages were followed through official specification links when direct retrieval initially failed.

[OFFICIAL-DOCUMENTATION] The repository HEAD was resolved with git ls-remote, then the immutable schema and license URLs were inspected. This is narrow static inspection, not a runtime verification. No unseen SDK compatibility, live API availability, model ranking or security guarantee was inferred. Source discrepancies and current Draft-extension status remain explicit.
