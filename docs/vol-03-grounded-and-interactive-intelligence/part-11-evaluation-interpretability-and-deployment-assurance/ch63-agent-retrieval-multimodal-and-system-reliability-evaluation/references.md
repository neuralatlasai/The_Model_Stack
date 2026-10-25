---
id: ms.references.63
entity_type: references
title: "Chapter 63 — References"
volume: 3
part: 11
chapter: 63
section: null
slug: references
parent: ms.chapter.63
prev_sibling: ms.verification.63
next_sibling: null
children: []
prerequisites: [ms.chapter.6, ms.chapter.62]
downstream: [ms.chapter.65, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [evaluation], mechanism: [evaluation_validity], feedback_setting: [], modality: [text, image, audio, video]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1400
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 63 references

[DERIVED] **Accessed 2026-10-25.** Retained papers first appeared within 2026-03-01–2026-10-24. First public release, inspected revision and actual access are separate. Only the named method/result/appendix and implementation surfaces were inspected. No inference, environment execution, source replication or full-bibliography verification is claimed.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R63.1 | paper | SWE-Bench Pro Verified: A Reliable Benchmark for Software Engineering Agents | Pujun Zheng; Zixin Shang; Shufan Jiang; Wenhui Tian; Dongsheng Zhu; Zerun Ma; Dingbo Yuan; Qi Zhang | arXiv / 2026 | https://arxiv.org/html/2609.08149v3 | https://github.com/open-compass/AgentCompass | preprint | 2026-10-25 | First public: 2026-09-08. Inspected: v3, 2026-10-09; §§3–4, Tables 2–3, transition audit. 63.1: information boundary and task/verifier revisions. No exhaustive leakage-closure claim. |
| R63.2 | paper | On the Reliability of Computer Use Agents | Gonzalo Gonzalez-Pumariega; Saaket Agashe; Jiachen Yang; Ang Li; Xin Eric Wang | arXiv / 2026 | https://arxiv.org/html/2604.17849v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-04-20. Inspected: v1, 2026-04-20; §2, §§3–5, Tables 1–4, Appendices E/F. 63.2: repeated execution and paired evidence; clarification/feedback information distinguished. |
| R63.3 | paper | When Failures Propagate: Causal Failure Attribution in Agentic Retrieval-Augmented Generation | Lauren Pothuru | arXiv / 2026 | https://arxiv.org/html/2608.20627v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-08-20. Inspected: v1, 2026-08-20; §§3–7, Tables 2–3, §9. 63.3: certified injection, suffix scope, failed-case denominator; small content comparisons exploratory. |
| R63.4 | paper | When Knowledge Changes: Metamorphic Testing of RAG Systems with Mutations | Jinhan Kim; Samuele Pasini; Paolo Tonella | ASE / 2026 | https://arxiv.org/html/2607.26843v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-07-29. Inspected: v1, 2026-07-29; §§3–6, Table 1, §8. 63.4: selection, operator scope and relation/oracle qualification. HTML identifies ASE DOI; proceedings independently unverified. |
| R63.5 | paper | When Agentic Executions Fail: Detecting and Localizing Runtime Faults from Telemetry | Chenkai Zhang; Yiran Li; Yifang Tian; Michalis Bachras; Hans-Arno Jacobsen | arXiv / 2026 | https://arxiv.org/html/2608.14680v1 | https://github.com/kevinzck8k/agentic-fault-diagnosis | preprint | 2026-10-25 | First public: 2026-08-04. Inspected: v1, 2026-08-04; §§2–3, Tables 2–4, §5 limits. 63.4: fault model/controls; diagnosis is distinct from resilience. |
| R63.6 | paper | $\tau^{\tau}$-Bench: An Environment for End-To-End, Realistic Agent Construction | Quan Shi; Keshav Dhandhania; Karthik Narasimhan; Victor Barres | arXiv / 2026 | https://arxiv.org/html/2609.04611v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-09-04. Inspected: v1, 2026-09-04; §§3–4, Table 2, §7 limits. 63.5: build/serve ledgers, composition and privileged reference; construction variance unmeasured. |
| R63.7 | repository | AgentChaosBench trace_view.py at 04a8a46d32be12dea1f020b7eed8c7e84e5f30ed | kevinzck8k / paper authors | GitHub / 2026 | https://raw.githubusercontent.com/kevinzck8k/agentic-fault-diagnosis/04a8a46d32be12dea1f020b7eed8c7e84e5f30ed/trace_view.py | https://github.com/kevinzck8k/agentic-fault-diagnosis | official documentation | 2026-10-25 | Commit authored: 2026-08-21T16:42:32Z; committed: 17:10:05Z. Independent first visibility not established. 63.3: static _repeat_key/structured_view/render, lines 29–78. No runtime. |
| R63.8 | repository | AgentChaosBench rca_summary.py at 04a8a46d32be12dea1f020b7eed8c7e84e5f30ed | kevinzck8k / paper authors | GitHub / 2026 | https://raw.githubusercontent.com/kevinzck8k/agentic-fault-diagnosis/04a8a46d32be12dea1f020b7eed8c7e84e5f30ed/rca_summary.py | https://github.com/kevinzck8k/agentic-fault-diagnosis | official documentation | 2026-10-25 | Same pinned commit/date as R63.7. 63.3: static slug_of/main/cell, lines 21–93; observed faulty/control aggregation. No runtime. |
| R63.9 | paper | Incident-Arena: Getting agents to the last nine of reliability | Andre Fu; Malik Drabla; Leon Liu; Meji Abidoye; Marek Šuppa; Lata Mishra; Adnan El Assadi; Yiyuan Li | arXiv / 2026 | https://arxiv.org/pdf/2610.00648v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-09-30. Inspected: v1, 2026-09-30; PDF/HTML §§3–6, Appendix B. 63.6: operational gates and finite horizon; pooled effort discrepancy below. |

## Source boundaries

[DERIVED] Historical SWE-bench, Terminal-Bench, OSWorld and $\tau$-family names locate task families, not new-window publications. Terminal-Bench 2.0 (2601.11868, first 2026-01-17) and ReliabilityBench (2601.06112, first 2026-01-03) were excluded as new research. An identifier, conference year or later revision does not reset first release.

[DERIVED] **Incident-Arena asset discrepancy:** the [abstract landing page](https://arxiv.org/abs/2610.00648) gives 2.81M tokens/41 turns; inspected v1 PDF/HTML gives 4.0M/68 steps. These summaries are not reconciled here and no pooled effort comparison uses them. The retained account follows the named full-text methods, with the discrepancy unresolved.

[DERIVED] R63.7–R63.8 were fetched at the full commit confirmed by remote HEAD and official GitHub commit metadata. Static inspection does not establish a package/environment lock, public visibility date, runtime behavior, model reproducibility or reproduction of the paper. The independent timing and truncated-key consequences in 63.3 follow the displayed functions, not an executed benchmark.

[UNVERIFIED] All verification studies are unexecuted proposals. Authored equations and figures are derived constructions with stated assumptions; they are not new model experiments or a numerical quality certification.
