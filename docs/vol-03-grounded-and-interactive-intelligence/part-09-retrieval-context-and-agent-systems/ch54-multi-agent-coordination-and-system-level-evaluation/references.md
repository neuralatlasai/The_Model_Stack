---
id: ms.references.54
entity_type: references
title: "Chapter 54 references"
volume: 3
part: 9
chapter: 54
section: null
slug: references
parent: ms.chapter.54
prev_sibling: ms.verification.54
next_sibling: null
children: []
prerequisites: [ms.chapter.6, ms.chapter.38, ms.chapter.48, ms.chapter.51, ms.chapter.52, ms.chapter.53]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, assurance], mechanism: [multi_agent_coordination, resource_accounting], feedback_setting: [], modality: [text]}
papers: [P41, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1300
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 54 references

[OFFICIAL-DOCUMENTATION] All records were actually inspected on 2026-10-14. Paper versions and commit URLs are pinned; website documentation is explicitly mutable/unpinned. Static inspection does not establish executed correctness, current model compatibility or independent replication.

| Key | Type | Title | Authors | Venue | Primary URL | Code or artifact | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P41 | paper | ReAct: Synergizing Reasoning and Acting in Language Models | Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, Yuan Cao | arXiv, original 2022 | [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/html/2210.03629v3) | not executed | preprint | 2026-10-14 | Single-controller reasoning/action baseline; spine P41; v3, 2023-03-10; §§2–3/Appendix B/C, CC BY 4.0 |
| R54.2 | paper | MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework | Sirui Hong, Mingchen Zhuge, Jiaqi Chen, Xiawu Zheng, Yuheng Cheng, Ceyao Zhang, Jinlin Wang, Zili Wang, Steven Ka Shing Yau, Zijuan Lin, Liyang Zhou, Chenyu Ran, Lingfeng Xiao, Chenglin Wu, Jürgen Schmidhuber | arXiv, original 2023 | [MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework](https://arxiv.org/html/2308.00352v6) | not executed | preprint | 2026-10-14 | SOP interfaces, publish/subscribe, executable feedback and selected-task limits; v6, 2024-10-21; §§3.1–3.3/§§4.1–4.4/Tables 1–3/Appendix C/D, CC BY 4.0 |
| R54.3 | paper | AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation | Qingyun Wu, Gagan Bansal, Jieyu Zhang, Yiran Wu, Beibin Li, Erkang Zhu, Li Jiang, Xiaoyun Zhang, Shaokun Zhang, Jiale Liu, Ahmed Awadallah, Ryen W. White, Doug Burger, Chi Wang | arXiv 2023 | [AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation](https://arxiv.org/html/2308.08155v2) | not executed | preprint | 2026-10-14 | Conversation programming and narrow application protocols; v2, 2023-10-03; §§2.1–2.2/§3 A1–A6/Appendix D, CC BY 4.0 |
| R54.4 | paper | Towards a Science of Scaling Agent Systems | Yubin Kim, Ken Gu, Chanwoo Park, Chunjong Park, Samuel Schmidgall, A. Ali Heydari, Yao Yan, Zhihan Zhang, Yuchen Zhuang, Yun Liu, Mark Malhotra, Paul Pu Liang, Hae Won Park, Yuzhe Yang, Xuhai Xu, Yilun Du, Shwetak Patel, Tim Althoff, Daniel McDuff, Xin Liu | arXiv 2025 | [Towards a Science of Scaling Agent Systems](https://arxiv.org/html/2512.08296v2) | not executed | preprint | 2026-10-14 | Controlled domain outcomes; outcome-containing predictors, standardization and information-proxy critique; v2, 2025-12-17; §§3–4/Table 2–5/Appendices B/C/E; E.2 caps, E.4 samples, E.5 variance proxy; CC BY 4.0 |
| R54.5 | paper | Understanding Agent Scaling in LLM-Based Multi-Agent Systems via Diversity | Yingxuan Yang, Chengrui Qu, Muning Wen, Laixi Shi, Ying Wen, Weinan Zhang, Adam Wierman, Shangding Gu | arXiv 2026 | [Understanding Agent Scaling in LLM-Based Multi-Agent Systems via Diversity](https://arxiv.org/html/2602.03794v1) | not executed | preprint | 2026-10-14 | Diversity/proxy scope; no universal correctness law; v1, 2026-02-03; §§3–5/Appendix A |
| R54.6 | paper | Debate or Vote: Which Yields Better Decisions in Multi-Agent Large Language Models? | Hyeong Kyu Choi, Xiaojin Zhu, Yixuan Li | arXiv 2025 | [Debate or Vote: Which Yields Better Decisions in Multi-Agent Large Language Models?](https://arxiv.org/html/2508.17536v1) | not executed | preprint | 2026-10-14 | Voting/debate controls, conditional neighbor-mean requirement, answer-extraction confound; v1, 2025-08-24; §§2–6/Table 1/Appendices A/C.2–C.3/F/H; CC BY 4.0 |
| R54.7 | paper | Voting or Consensus? Decision-Making in Multi-Agent Debate | Lars Benedikt Kaesberg, Jonas Becker, Jan Philip Wahle, Terry Ruas, Bela Gipp | arXiv 2025 | [Voting or Consensus? Decision-Making in Multi-Agent Debate](https://arxiv.org/html/2502.19130v1) | not executed | preprint | 2026-10-14 | Seven decision protocols, retention, task dependence and run dispersion; v1, 2025-02-26; §§3–4/Table 1/Appendices B–E; CC BY-SA 4.0 |
| R54.8 | documentation | LangGraph Persistence | LangChain contributors | Official mutable documentation | [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence) | not executed | official documentation | 2026-10-14 | Storage scope and in-memory restart limitation; Checkpointer versus Store/Troubleshooting, accessed current unpinned surface |
| R54.9 | documentation | SQLite Transaction | SQLite contributors | Official documentation | [SQLite Transaction](https://www.sqlite.org/lang_transaction.html) | not executed | official documentation | 2026-10-14 | Read/write/snapshot/busy/error scope; §§2.1–2.3/§3; page updated 2026-02-18, mutable |
| P43 | paper | τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains | Shunyu Yao, Noah Shinn, Pedram Razavi, Karthik Narasimhan | arXiv 2024 | [τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/html/2406.12045v1) | not executed | preprint | 2026-10-14 | State/communication outcomes and repeated reliability; spine P43; v1, 2024-06-17; §§3–5/Appendix B; CC BY 4.0 |
| R54.11 | paper | τ²-Bench: Evaluating Conversational Agents in a Dual-Control Environment | Victor Barres, Honghua Dong, Soham Ray, Xujie Si, Karthik Narasimhan | arXiv 2025 | [τ²-Bench: Evaluating Conversational Agents in a Dual-Control Environment](https://arxiv.org/html/2506.07982v1) | not executed | preprint | 2026-10-14 | Dual-control assertions and simulator limitations; v1, 2025-06-09; §§3–4/Table 2/Appendices B/D/E; CC BY 4.0 |
| R54.12 | paper | Why Do Multi-Agent LLM Systems Fail? | Mert Cemri, Melissa Z. Pan, Shuyi Yang, Lakshya A. Agrawal, Bhavya Chopra, Rishabh Tiwari, Kurt Keutzer, Aditya Parameswaran, Dan Klein, Kannan Ramchandran, Matei Zaharia, Joseph E. Gonzalez, Ion Stoica | arXiv 2025 | [Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/html/2503.13657v1) | not executed | preprint | 2026-10-14 | Trace taxonomy, small expert/judge validation and diagnostic scope; v1, 2025-03-17; §§3–4/Table 2/Appendices A/B/D |
| R54.13 | documentation | How we built our multi-agent research system | Anthropic engineering | First-party report, 2025-06-13 | [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) | not executed | official documentation | 2026-10-14 | Internal product overhead and allocation context, not matched public benchmark; Benefits/Architecture/Scale effort/Production reliability; mutable article |
| R54.14 | repository | LangGraph graph/state.py | LangChain contributors | Official repository | [LangGraph graph/state.py](https://raw.githubusercontent.com/langchain-ai/langgraph/ccb851effb7b4c6255add86dbeed577061475aff/libs/langgraph/langgraph/graph/state.py) | pinned source | official documentation | 2026-10-14 | Static partial-update/reducer/policy interface only; Commit ccb851effb7b4c6255add86dbeed577061475aff; _NodeDefaults lines 97–104; StateGraph 124–143; set_node_defaults 252–268; _get_channel/_is_field_binop 1719–1787 |
| R54.15 | documentation | LangGraph Checkpointers | LangChain contributors | Official mutable documentation | [LangGraph Checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers) | not executed | official documentation | 2026-10-14 | Checkpoint versus task-write recovery scope; no external-effect atomicity; Fault-tolerance/Pending writes/Super-steps/Checkpointer interface/Serializer/Conformance suite; unpinned |
| R54.16 | repository | LangGraph LICENSE | LangChain contributors | Official repository | [LangGraph LICENSE](https://raw.githubusercontent.com/langchain-ai/langgraph/ccb851effb7b4c6255add86dbeed577061475aff/LICENSE) | pinned source | official documentation | 2026-10-14 | Permissive source-inspection provenance; no copied implementation; Commit ccb851effb7b4c6255add86dbeed577061475aff; MIT license, copyright 2024 LangChain Inc. |
| R54.17 | paper | When Debate Helps: Proposal Supply and Verification-Aware Readout in Multi-Agent Reasoning | Zihao Zhao, Tunyu Zhang, Haizhou Shi, Yusong Zhao, Xinxi Zhang, Hao Wang | arXiv 2026 | [When Debate Helps](https://arxiv.org/html/2610.04686v1) | linked repository not executed | preprint | 2026-10-14 | Proposal/readout distinction and control limits; v1, 2026-10-03; §§3–5/Eq. 7/Table 1/Appendices A.2–A.5/A.9–A.10/B/C; CC BY 4.0 |

## P41

[ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/html/2210.03629v3). **Revision/locator:** v3, 2023-03-10; §§2–3/Appendix B/C, CC BY 4.0. **Use:** Single-controller reasoning/action baseline; spine P41. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.2

[MetaGPT: Meta Programming for a Multi-Agent Collaborative Framework](https://arxiv.org/html/2308.00352v6). **Revision/locator:** v6, 2024-10-21; §§3.1–3.3/§§4.1–4.4/Tables 1–3/Appendix C/D, CC BY 4.0. **Use:** SOP interfaces, publish/subscribe, executable feedback and selected-task limits. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.3

[AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation](https://arxiv.org/html/2308.08155v2). **Revision/locator:** v2, 2023-10-03; §§2.1–2.2/§3 A1–A6/Appendix D, CC BY 4.0. **Use:** Conversation programming and narrow application protocols. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.4

[Towards a Science of Scaling Agent Systems](https://arxiv.org/html/2512.08296v2). **Revision/locator:** v2, 2025-12-17; §§3–4/Table 2–5/Appendices B/C/E; E.2 caps, E.4 samples, E.5 variance proxy; CC BY 4.0. **Use:** Controlled domain outcomes; outcome-containing predictors, standardization and information-proxy critique. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.5

[Understanding Agent Scaling in LLM-Based Multi-Agent Systems via Diversity](https://arxiv.org/html/2602.03794v1). **Revision/locator:** v1, 2026-02-03; §§3–5/Appendix A. **Use:** Diversity/proxy scope; no universal correctness law. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.6

[Debate or Vote: Which Yields Better Decisions in Multi-Agent Large Language Models?](https://arxiv.org/html/2508.17536v1). **Revision/locator:** v1, 2025-08-24; §§2–6/Table 1/Appendices A/C.2–C.3/F/H; CC BY 4.0. **Use:** Voting/debate controls, conditional neighbor-mean requirement, answer-extraction confound. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.7

[Voting or Consensus? Decision-Making in Multi-Agent Debate](https://arxiv.org/html/2502.19130v1). **Revision/locator:** v1, 2025-02-26; §§3–4/Table 1/Appendices B–E; CC BY-SA 4.0. **Use:** Seven decision protocols, retention, task dependence and run dispersion. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.8

[LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence). **Revision/locator:** Checkpointer versus Store/Troubleshooting, accessed current unpinned surface. **Use:** Storage scope and in-memory restart limitation. **Boundary:** Documentation/first-party report; no matched local experiment. **Access:** 2026-10-14.

## R54.9

[SQLite Transaction](https://www.sqlite.org/lang_transaction.html). **Revision/locator:** §§2.1–2.3/§3; page updated 2026-02-18, mutable. **Use:** Read/write/snapshot/busy/error scope. **Boundary:** Documentation/first-party report; no matched local experiment. **Access:** 2026-10-14.

## P43

[τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains](https://arxiv.org/html/2406.12045v1). **Revision/locator:** v1, 2024-06-17; §§3–5/Appendix B; CC BY 4.0. **Use:** State/communication outcomes and repeated reliability; spine P43. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.11

[τ²-Bench: Evaluating Conversational Agents in a Dual-Control Environment](https://arxiv.org/html/2506.07982v1). **Revision/locator:** v1, 2025-06-09; §§3–4/Table 2/Appendices B/D/E; CC BY 4.0. **Use:** Dual-control assertions and simulator limitations. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.12

[Why Do Multi-Agent LLM Systems Fail?](https://arxiv.org/html/2503.13657v1). **Revision/locator:** v1, 2025-03-17; §§3–4/Table 2/Appendices A/B/D. **Use:** Trace taxonomy, small expert/judge validation and diagnostic scope. **Boundary:** Source-reported protocol and bounded findings; no independent model experiment. **Access:** 2026-10-14.

## R54.13

[How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system). **Revision/locator:** Benefits/Architecture/Scale effort/Production reliability; mutable article. **Use:** Internal product overhead and allocation context, not matched public benchmark. **Boundary:** Documentation/first-party report; no matched local experiment. **Access:** 2026-10-14.

## R54.14

[LangGraph graph/state.py](https://raw.githubusercontent.com/langchain-ai/langgraph/ccb851effb7b4c6255add86dbeed577061475aff/libs/langgraph/langgraph/graph/state.py). **Revision/locator:** Commit ccb851effb7b4c6255add86dbeed577061475aff; _NodeDefaults lines 97–104; StateGraph 124–143; set_node_defaults 252–268; _get_channel/_is_field_binop 1719–1787. **Use:** Static partial-update/reducer/policy interface only. **Boundary:** Static inspection only; no executed check. **Access:** 2026-10-14.

## R54.15

[LangGraph Checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers). **Revision/locator:** Fault-tolerance/Pending writes/Super-steps/Checkpointer interface/Serializer/Conformance suite; unpinned. **Use:** Checkpoint versus task-write recovery scope; no external-effect atomicity. **Boundary:** Documentation/first-party report; no matched local experiment. **Access:** 2026-10-14.

## R54.16

[LangGraph LICENSE](https://raw.githubusercontent.com/langchain-ai/langgraph/ccb851effb7b4c6255add86dbeed577061475aff/LICENSE). **Revision/locator:** Commit ccb851effb7b4c6255add86dbeed577061475aff; MIT license, copyright 2024 LangChain Inc.. **Use:** Permissive source-inspection provenance; no copied implementation. **Boundary:** Static inspection only; no executed check. **Access:** 2026-10-14.

## R54.17

[When Debate Helps: Proposal Supply and Verification-Aware Readout in Multi-Agent Reasoning](https://arxiv.org/html/2610.04686v1). **Revision/locator:** v1, 2026-10-03; §§3–5/Eq. 7/Table 1/Appendices A.2–A.5/A.9–A.10/B/C; CC BY 4.0. **Use:** Event-partition gain accounting, fixed-proposal evidence interventions, identical-finalizer control and coverage construction. **Boundary:** Pseudo-counts are bookkeeping, not measured neural states; construction/decoding and successful-run compute accounting constrain comparison. **Access:** 2026-10-14.

## Scientific interpretation retained

[DERIVED] P41/P43 are revision-specific inspection records for spine P41/P43. R54.4's observed efficiency contains success; its standardized/raw arithmetic, outcome-derived complexity and binary variance information proxy do not establish an ex-ante universal selector. R54.6 Appendix C.3 explicitly needs the conditional neighbor mean to equal the recipient belief; homogeneous initialization alone does not enforce that pathwise condition. R54.5's proxy is embedding geometry and its information bounds need an appropriate observation model. Original book derivations and exact probability counterexamples are separate from source-reported experiments.

[UNVERIFIED] No model, agent workflow, database or framework was executed. No current tariff, model leaderboard or unseen SDK capability was adopted. Source protocols control the attributed claims; proposed experiments remain in verification.md.
