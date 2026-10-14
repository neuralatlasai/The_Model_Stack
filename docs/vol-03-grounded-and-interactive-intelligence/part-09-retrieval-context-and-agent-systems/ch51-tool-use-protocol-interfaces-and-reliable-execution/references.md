---
id: ms.references.51
entity_type: references
title: "Chapter 51 references"
volume: 3
part: 9
chapter: 51
section: null
slug: references
parent: ms.chapter.51
prev_sibling: ms.verification.51
next_sibling: null
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
word_count_target: 1300
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 51 references

[OFFICIAL-DOCUMENTATION] Actual access for every record: 2026-10-14. Revision-named website pages are explicitly mutable; only commit URLs and paper revision identifiers are pinned. Static inspection does not establish runtime correctness. No original model, server or security experiments were performed.

| Key | Type | Title | Authors | Venue | Primary URL | Code or artifact | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R51.1 | documentation | MCP Tools | MCP contributors | MCP 2026-07-28 | [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) | not executed | official documentation | 2026-10-14 | Representation, names, results and handle authority; Tool/Input and Output Schema/Tool Names/Stateful Tools/Error Handling; revision-named mutable page |
| R51.2 | repository | MCP schema.ts | MCP contributors | Official specification repository | [MCP schema.ts](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/5ea996028df322ce97d1c906731cf8c05a6e268e/schema/2026-07-28/schema.ts) | pinned schema source | official documentation | 2026-10-14 | Narrow static field inspection; no executor or SDK check; Commit 5ea996028df322ce97d1c906731cf8c05a6e268e; RequestMetaObject lines 69–98; InputRequiredResult 584–608; DiscoverRequest 665–696; CallToolRequestParams 1863–1884; ToolAnnotations/Tool 1900–2014 |
| R51.3 | documentation | JSON Schema Validation: A Vocabulary for Structural Validation of JSON | JSON Schema authors | Draft 2020-12 | [JSON Schema Validation: A Vocabulary for Structural Validation of JSON](https://json-schema.org/draft/2020-12/json-schema-validation) | not executed | official documentation | 2026-10-14 | Schema language and validation limits; §6 structural assertions; §7 format annotation/assertion distinction; version-fixed document |
| R51.4 | paper | Toolformer: Language Models Can Teach Themselves to Use Tools | Timo Schick, Jane Dwivedi-Yu, Roberto Dessì, Roberta Raileanu, Maria Lomeli, Luke Zettlemoyer, Nicola Cancedda, Thomas Scialom | arXiv 2023 | [Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/html/2302.04761v1) | not executed | preprint | 2026-10-14 | Historical learned-call objective; compact paraphrase; v1, 2023-02-09; §2 sampling/execution/weighted-loss filtering/fine-tuning; §4 setup and baselines; §7 limits |
| P43 | paper | τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains | Shunyu Yao, Noah Shinn, Pedram Razavi, Karthik Narasimhan | arXiv 2024 | [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/html/2406.12045v1) | not executed | preprint | 2026-10-14 | Deterministic API state, outcome reward, repeated trials and policy gaps; v1, 2024-06-17; §§3–5/Table 1/Table 2; Appendix B policies; CC BY 4.0 |
| R51.6 | paper | ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs | Yujia Qin, Shihao Liang, Yining Ye, Kunlun Zhu, Lan Yan, Yaxi Lu, Yankai Lin, Xin Cong, Xiangru Tang, Bill Qian, Sihan Zhao, Runchu Tian, Ruobing Xie, Jie Zhou, Mark Gerstein, Dahai Li, Zhiyuan Liu, Maosong Sun | arXiv 2023 | [ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs](https://arxiv.org/html/2307.16789v1) | not executed | preprint | 2026-10-14 | Historical catalog/retriever/evaluation route; no current API claim; v1, 2023-07-31; §§2–3.2/Tables 2–3; API retrieval and budget-matched reasoning comparison |
| R51.7 | documentation | MCP Discovery | MCP contributors | MCP 2026-07-28 | [MCP Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover) | not executed | official documentation | 2026-10-14 | Required server method, optional client call, self-reported identity; Request/Response/When to Call/DiscoverResult; revision-named mutable page |
| R51.8 | paper | τ²-Bench: Evaluating Conversational Agents in a Dual-Control Environment | Victor Barres, Honghua Dong, Soham Ray, Xujie Si, Karthik Narasimhan | arXiv 2025 | [τ²-Bench: Evaluating Conversational Agents in a Dual-Control Environment](https://arxiv.org/html/2506.07982v1) | not executed | preprint | 2026-10-14 | Dual control, assertions, four-trial protocol, simulator limits; v1, 2025-06-09; §§3–4/Table 2; Appendices B/D/E; CC BY 4.0 |
| R51.9 | documentation | MCP Versioning and Compatibility | MCP contributors | MCP 2026-07-28 | [MCP Versioning and Compatibility](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning) | not executed | official documentation | 2026-10-14 | Modern per-request versus legacy initialize behavior; Terminology/Protocol Version Negotiation/Extension Negotiation/Backward Compatibility/Compatibility Matrix; mutable |
| R51.10 | documentation | MCP Transports Overview | MCP contributors | MCP 2026-07-28 | [MCP Transports Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports) | not executed | official documentation | 2026-10-14 | Transport binding versus protocol semantics; Messages/Request Metadata/Cancellation/Backward Compatibility; mutable |
| R51.11 | documentation | MCP Message Patterns Overview | MCP contributors | MCP 2026-07-28 | [MCP Message Patterns Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns) | not executed | official documentation | 2026-10-14 | Client initiation and request-scoped streams; Request and Response/Multi Round-Trip Requests/Subscribe and Notify; mutable |
| R51.12 | documentation | MCP Multi Round-Trip Requests | MCP contributors | MCP 2026-07-28 | [MCP Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr) | not executed | official documentation | 2026-10-14 | Client-mediated re-entry and opaque requestState; Core Types/InputRequests/InputResponses/InputRequiredResult; mutable |
| R51.13 | documentation | MCP stdio | MCP contributors | MCP 2026-07-28 | [MCP stdio](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio) | not executed | official documentation | 2026-10-14 | Framing, subprocess lifecycle and legacy probe; Sending/Receiving Messages/Request Metadata/Cancellation/Shutdown/Unexpected Termination/Backward Compatibility; mutable |
| R51.14 | documentation | MCP Streamable HTTP | MCP contributors | MCP 2026-07-28 | [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) | not executed | official documentation | 2026-10-14 | POST/SSE, headers, -32020/-32022/-32601, Origin and era detection; Security & Endpoint/Sending/Receiving/Protocol Version Header/Standard Request Headers/Custom Headers/Value Encoding/Server Validation/Backward Compatibility; mutable |
| R51.15 | documentation | MCP Authorization | MCP contributors | MCP 2026-07-28 | [MCP Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) | not executed | official documentation | 2026-10-14 | HTTP OAuth, environment stdio credentials, audience/resource checks; Purpose and Scope/Roles/Discovery/Scope Selection/Authorization Response Validation/Resource Parameter/Token Handling; mutable |
| R51.16 | documentation | MCP Tasks Extension | Tasks extension contributors | Separate Draft 2026-07-28 extension | [MCP Tasks Extension](https://tasks.extensions.modelcontextprotocol.io/specification/2026-07-28/tasks) | not executed | official documentation | 2026-10-14 | Deferred state and cooperative cancellation; no exactly-once inference; Capability Negotiation/Task Status/Task Cancellation/Status Notifications/Routing Headers; mutable Draft, not core |
| R51.17 | documentation | MCP Cancellation | MCP contributors | MCP 2026-07-28 | [MCP Cancellation](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation) | not executed | official documentation | 2026-10-14 | Cancellation races and absolute maximum timeout; Transport-Specific Cancellation/Timeouts/Behavior Requirements/Timing Considerations; mutable |
| R51.18 | documentation | RFC 9110: HTTP Semantics | Roy T. Fielding, Mark Nottingham, Julian Reschke | IETF RFC 9110, 2022 | [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) | not executed | official documentation | 2026-10-14 | Effect-scope foundation; HTTP method is not application deduplication; §9.2.2 idempotent intended effect and auxiliary-effect qualification |
| R51.19 | paper | Sagas | Hector Garcia-Molina, Kenneth Salem | ACM 1987 paper, pp. 249–259 | [Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf) | not executed | peer-reviewed | 2026-10-14 | Subtransactions, forward/backward recovery and compensation limits; Original PDF §§1–7, §8–9 design discussion; paper-hosted course copy, no execution |
| R51.20 | documentation | MCP Security Best Practices | MCP contributors | MCP 2026-07-28 guidance | [MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices) | not executed | official documentation | 2026-10-14 | Independent authority, destination and host privilege boundaries; Confused Deputy/Token Passthrough/SSRF/State Handle Hijacking/Local Server Compromise/URL Validation/stdio Proxy/Scope Minimization; mutable |
| R51.21 | paper | InjecAgent: Benchmarking Indirect Prompt Injections in Tool-Integrated Large Language Model Agents | Qiusi Zhan, Zhixiang Liang, Zifan Ying, Daniel Kang | arXiv 2024 | [InjecAgent: Benchmarking Indirect Prompt Injections in Tool-Integrated Large Language Model Agents](https://arxiv.org/html/2403.02691v1) | not executed | preprint | 2026-10-14 | Assumed injected-response continuation and two-step exfiltration evaluation; v1, 2024-03-05; §§2.1–2.3/§3/Table 3/§8 |
| R51.22 | paper | AgentDojo: A Dynamic Environment to Evaluate Attacks and Defenses for LLM Agents | Edoardo Debenedetti, Jie Zhang, Mislav Balunović, Luca Beurer-Kellner, Marc Fischer, Florian Tramèr | arXiv 2024 | [AgentDojo: A Dynamic Environment to Evaluate Attacks and Defenses for LLM Agents](https://arxiv.org/html/2406.13352v1) | not executed | preprint | 2026-10-14 | Dynamic tool state, utility and targeted attack outcomes; v1, 2024-06-19; §§3–4/§3.4 metrics/§4.3 defenses; Appendix A |
| R51.23 | paper | Passing the Test You Trained On: Re-evaluating Prompt-Injection Detectors for LLM Agents | Zhuowen Liu | arXiv 2026 | [Passing the Test You Trained On: Re-evaluating Prompt-Injection Detectors for LLM Agents](https://arxiv.org/html/2610.03448v1) | not executed | preprint | 2026-10-14 | Static replay detector transfer, false blocks and disclosed overlap limits; v1, 2026-10-02; §§3–6/Table 1/Table 2; §4.3 same-set threshold; Appendix B Table 4 intervals/Appendix E differential replay; CC BY 4.0 |
| R51.24 | repository | MCP project licensing notice | MCP contributors | Official repository license | [MCP project licensing notice](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/5ea996028df322ce97d1c906731cf8c05a6e268e/LICENSE) | pinned licensing source | official documentation | 2026-10-14 | Specification permissive-license provenance; docs CC BY 4.0 notice; Commit 5ea996028df322ce97d1c906731cf8c05a6e268e; opening license-transition notice and Apache-2.0/MIT terms |

## R51.1

[MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools). **Revision/locator:** Tool/Input and Output Schema/Tool Names/Stateful Tools/Error Handling; revision-named mutable page. **Use:** Representation, names, results and handle authority. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.2

[MCP schema.ts](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/5ea996028df322ce97d1c906731cf8c05a6e268e/schema/2026-07-28/schema.ts). **Revision/locator:** Commit 5ea996028df322ce97d1c906731cf8c05a6e268e; RequestMetaObject lines 69–98; InputRequiredResult 584–608; DiscoverRequest 665–696; CallToolRequestParams 1863–1884; ToolAnnotations/Tool 1900–2014. **Use:** Narrow static field inspection; no executor or SDK check. **Evidence boundary:** Static source inspection only; no executed check or SDK compatibility claim. **Access:** 2026-10-14.

## R51.3

[JSON Schema Validation: A Vocabulary for Structural Validation of JSON](https://json-schema.org/draft/2020-12/json-schema-validation). **Revision/locator:** §6 structural assertions; §7 format annotation/assertion distinction; version-fixed document. **Use:** Schema language and validation limits. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.4

[Toolformer: Language Models Can Teach Themselves to Use Tools](https://arxiv.org/html/2302.04761v1). **Revision/locator:** v1, 2023-02-09; §2 sampling/execution/weighted-loss filtering/fine-tuning; §4 setup and baselines; §7 limits. **Use:** Historical learned-call objective; compact paraphrase. **Evidence boundary:** Source-reported method/protocol only; no independent replication or October 2026 model ranking. **Access:** 2026-10-14.

## P43

[τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/html/2406.12045v1). **Revision/locator:** v1, 2024-06-17; §§3–5/Table 1/Table 2; Appendix B policies; CC BY 4.0. **Use:** Deterministic API state, outcome reward, repeated trials and policy gaps. **Evidence boundary:** Source-reported method/protocol only; no independent replication or October 2026 model ranking. **Access:** 2026-10-14.

## R51.6

[ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs](https://arxiv.org/html/2307.16789v1). **Revision/locator:** v1, 2023-07-31; §§2–3.2/Tables 2–3; API retrieval and budget-matched reasoning comparison. **Use:** Historical catalog/retriever/evaluation route; no current API claim. **Evidence boundary:** Source-reported method/protocol only; no independent replication or October 2026 model ranking. **Access:** 2026-10-14.

## R51.7

[MCP Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover). **Revision/locator:** Request/Response/When to Call/DiscoverResult; revision-named mutable page. **Use:** Required server method, optional client call, self-reported identity. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.8

[τ²-Bench: Evaluating Conversational Agents in a Dual-Control Environment](https://arxiv.org/html/2506.07982v1). **Revision/locator:** v1, 2025-06-09; §§3–4/Table 2; Appendices B/D/E; CC BY 4.0. **Use:** Dual control, assertions, four-trial protocol, simulator limits. **Evidence boundary:** Source-reported method/protocol only; no independent replication or October 2026 model ranking. **Access:** 2026-10-14.

## R51.9

[MCP Versioning and Compatibility](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning). **Revision/locator:** Terminology/Protocol Version Negotiation/Extension Negotiation/Backward Compatibility/Compatibility Matrix; mutable. **Use:** Modern per-request versus legacy initialize behavior. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.10

[MCP Transports Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports). **Revision/locator:** Messages/Request Metadata/Cancellation/Backward Compatibility; mutable. **Use:** Transport binding versus protocol semantics. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.11

[MCP Message Patterns Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns). **Revision/locator:** Request and Response/Multi Round-Trip Requests/Subscribe and Notify; mutable. **Use:** Client initiation and request-scoped streams. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.12

[MCP Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr). **Revision/locator:** Core Types/InputRequests/InputResponses/InputRequiredResult; mutable. **Use:** Client-mediated re-entry and opaque requestState. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.13

[MCP stdio](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio). **Revision/locator:** Sending/Receiving Messages/Request Metadata/Cancellation/Shutdown/Unexpected Termination/Backward Compatibility; mutable. **Use:** Framing, subprocess lifecycle and legacy probe. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.14

[MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http). **Revision/locator:** Security & Endpoint/Sending/Receiving/Protocol Version Header/Standard Request Headers/Custom Headers/Value Encoding/Server Validation/Backward Compatibility; mutable. **Use:** POST/SSE, headers, -32020/-32022/-32601, Origin and era detection. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.15

[MCP Authorization](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization). **Revision/locator:** Purpose and Scope/Roles/Discovery/Scope Selection/Authorization Response Validation/Resource Parameter/Token Handling; mutable. **Use:** HTTP OAuth, environment stdio credentials, audience/resource checks. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.16

[MCP Tasks Extension](https://tasks.extensions.modelcontextprotocol.io/specification/2026-07-28/tasks). **Revision/locator:** Capability Negotiation/Task Status/Task Cancellation/Status Notifications/Routing Headers; mutable Draft, not core. **Use:** Deferred state and cooperative cancellation; no exactly-once inference. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.17

[MCP Cancellation](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation). **Revision/locator:** Transport-Specific Cancellation/Timeouts/Behavior Requirements/Timing Considerations; mutable. **Use:** Cancellation races and absolute maximum timeout. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.18

[RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html). **Revision/locator:** §9.2.2 idempotent intended effect and auxiliary-effect qualification. **Use:** Effect-scope foundation; HTTP method is not application deduplication. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.19

[Sagas](https://www.cs.cornell.edu/andru/cs711/2002fa/reading/sagas.pdf). **Revision/locator:** Original PDF §§1–7, §8–9 design discussion; paper-hosted course copy, no execution. **Use:** Subtransactions, forward/backward recovery and compensation limits. **Evidence boundary:** Source-reported method/protocol only; no independent replication or October 2026 model ranking. **Access:** 2026-10-14.

## R51.20

[MCP Security Best Practices](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices). **Revision/locator:** Confused Deputy/Token Passthrough/SSRF/State Handle Hijacking/Local Server Compromise/URL Validation/stdio Proxy/Scope Minimization; mutable. **Use:** Independent authority, destination and host privilege boundaries. **Evidence boundary:** Official contract/guidance, not a matched implementation-performance experiment. **Access:** 2026-10-14.

## R51.21

[InjecAgent: Benchmarking Indirect Prompt Injections in Tool-Integrated Large Language Model Agents](https://arxiv.org/html/2403.02691v1). **Revision/locator:** v1, 2024-03-05; §§2.1–2.3/§3/Table 3/§8. **Use:** Assumed injected-response continuation and two-step exfiltration evaluation. **Evidence boundary:** Source-reported method/protocol only; no independent replication or October 2026 model ranking. **Access:** 2026-10-14.

## R51.22

[AgentDojo: A Dynamic Environment to Evaluate Attacks and Defenses for LLM Agents](https://arxiv.org/html/2406.13352v1). **Revision/locator:** v1, 2024-06-19; §§3–4/§3.4 metrics/§4.3 defenses; Appendix A. **Use:** Dynamic tool state, utility and targeted attack outcomes. **Evidence boundary:** Source-reported method/protocol only; no independent replication or October 2026 model ranking. **Access:** 2026-10-14.

## R51.23

[Passing the Test You Trained On: Re-evaluating Prompt-Injection Detectors for LLM Agents](https://arxiv.org/html/2610.03448v1). **Revision/locator:** v1, 2026-10-02; §§3–6/Table 1/Table 2; §4.3 same-set threshold; Appendix B Table 4 intervals/Appendix E differential replay; CC BY 4.0. **Use:** Static replay detector transfer, false blocks and disclosed overlap limits. **Evidence boundary:** Source-reported method/protocol only; no independent replication or October 2026 model ranking. **Access:** 2026-10-14.

## R51.24

[MCP project licensing notice](https://raw.githubusercontent.com/modelcontextprotocol/modelcontextprotocol/5ea996028df322ce97d1c906731cf8c05a6e268e/LICENSE). **Revision/locator:** Commit 5ea996028df322ce97d1c906731cf8c05a6e268e; opening license-transition notice and Apache-2.0/MIT terms. **Use:** Specification permissive-license provenance; docs CC BY 4.0 notice. **Evidence boundary:** Static source inspection only; no executed check or SDK compatibility claim. **Access:** 2026-10-14.

## Source-bound interpretation

[DERIVED] Book equations and algorithms are explanatory derivations/contracts, separate from source equations. Toolformer/ToolLLM/Sagas and historical attack studies are compactly paraphrased; no long passages are copied. The MCP repository's explicit permissive licensing notice supports original technical explanation of the specification with attribution. No claim depends on an unseen repository implementation.

[DERIVED] In R51.23, reported literal overlap with BIPIA's training-half material is not proof of test-half attack leakage; the study's exact-match audit is a lower bound on overlap. Its static-template detector rates are not a formal bound for every adaptive threat. R51.8 Table 2's telecom row has 3/50 critical errors (6%) despite conflicting caption wording. R51.2 explicitly makes clientInfo optional while some examples group it with required metadata. These differences remain visible instead of silently harmonized.

[OFFICIAL-DOCUMENTATION] P43 retains the canonical spine identity and an inspected revision-specific record.
