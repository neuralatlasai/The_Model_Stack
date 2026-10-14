---
id: ms.references.52
entity_type: references
title: Chapter 52 references
volume: 3
part: 9
chapter: 52
section: null
slug: references
parent: ms.chapter.52
prev_sibling: ms.verification.52
next_sibling: null
children: []
prerequisites: [ms.chapter.36, ms.chapter.38, ms.chapter.50, ms.chapter.51]
downstream: [ms.chapter.53, ms.chapter.54, ms.chapter.63]
related: [ms.chapter.46, ms.chapter.47]
relations: []
axes: {lifecycle: [inference, evaluation, assurance], mechanism: [agent_control, verification, recovery], feedback_setting: [environment_return], modality: [text]}
papers: [P41, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 52 references

[DERIVED] Actual inspection date: **2026-10-14**. Full methods, relevant experiments and exact locators below were opened while writing. Bibliographic identity and inspected revision are separate: a later revision was not silently substituted. Static source inspection supports the named source property only. No framework, solver, tool environment or benchmark was executed; no runtime-verified implementation or book-measured research result is claimed.

## References

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P41 | paper | ReAct | Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, Yuan Cao | ICLR / 2023 | https://arxiv.org/html/2210.03629v3 | https://react-lm.github.io/ | peer-reviewed | 2026-10-14 | v3, 2023-03-10; full title ReAct: Synergizing Reasoning and Acting in Language Models. §2 augmented action/context mechanism; §§3.1–3.3, Table 1 PaLM-540B protocol and task-dependent EM/accuracy; §4 decision-making setup; Appendix C prompts. CC BY 4.0. OpenReview forum browser challenge prevented direct archival inspection; primary v3 full text inspected. |
| P43 | paper | τ-bench | Shunyu Yao, Noah Shinn, Pedram Razavi, Karthik Narasimhan / Sierra | arXiv / 2024 | https://arxiv.org/html/2406.12045v1 | https://github.com/sierra-research/tau-bench | preprint | 2026-10-14 | v1, 2024-06-17; §3 POMDP/API/user/policy/reward and pass^k definitions; §4.1/Table 1 domain counts; §5 protocol; Tables 2–3 and Figure 4 outcomes. CC BY 4.0. |
| R52.1 | paper | PlanBench-XL: Evaluating Long-Horizon Planning of LLM Tool-Use Agents in Large-Scale Tool Ecosystems | Jiayu Liu, Qihan Lin, Cheng Qian, Rui Wang, Emre Can Acikgoz, Xiaocheng Yang, Jiateng Liu, Zhenhailong Wang, Xiusi Chen, Heng Ji, Dilek Hakkani-Tür | arXiv / 2026 | https://arxiv.org/html/2606.22388v1 | null | preprint | 2026-10-14 | v1, 2026-06-21; §§3–6; Table 2 configuration; Appendix B.6 retriever, B.7 runtime, B.8 Eqs.14–21/illustrative precision, B.9.3 blocker feasibility and tie-breaks; §5/Figures 2–3 silent errors and longer recovery. Nonexclusive arXiv license; compact factual synopsis only. |
| R52.2 | paper | When Tools Fail: Benchmarking Dynamic Replanning and Anomaly Recovery in LLM Agents | Dongsheng Zhu, Xuchen Ma, Yucheng Shen, Xiang Li, Yukun Zhao, Shuaiqiang Wang, Lingyong Yan, Dawei Yin | arXiv / 2026 | https://arxiv.org/html/2606.05806v1 | https://github.com/Zhudongsheng75/ToolMaze | preprint | 2026-10-14 | v1, 2026-06-04; §§3.1–3.4 corpus/topology/generation/activation; §3.5 Eqs.1–4 success/recovery/cost; §4.1 budgets; Table 2 prompt/fault outcomes; §4.3/Figure 5 cross-model slopes; Appendix D full conditions. CC BY 4.0. |
| R52.3 | technical report | Building effective agents | Anthropic | First-party engineering / 2024 | https://www.anthropic.com/engineering/building-effective-agents | null | official documentation | 2026-10-14 | Published 2024-12-19; mutable text unpinned. “What are agents?”, “When and how to use frameworks”, “Building blocks, workflows, and agents”, workflow patterns and “Agents”. Historical distinction; current page notes tooling has changed. Not a controlled benchmark. |
| R52.4 | paper | Language Agent Tree Search Unifies Reasoning, Acting, and Planning in Language Models | Andy Zhou, Kai Yan, Michal Shlapentokh-Rothman, Haohan Wang, Yu-Xiong Wang | ICML, PMLR 235 / 2024 | https://arxiv.org/html/2310.04406v3 | https://github.com/lapisrocks/LanguageAgentTreeSearch | peer-reviewed | 2026-10-14 | v3, 2024-06-06; §§3–4 resettable environment/MCTS/LM heuristic/reflection; §5.1/Table 3 HotpotQA; Table 8 ablations; Table 9 success-conditioned token counts. Archival identity independently opened at https://proceedings.mlr.press/v235/zhou24r.html . CC BY 4.0. |
| R52.5 | paper | ReWOO: Decoupling Reasoning from Observations for Efficient Augmented Language Models | Binfeng Xu, Zhiyuan Peng, Bowen Lei, Subhabrata Mukherjee, Yuchen Liu, Dongkuan Xu | arXiv / 2023 | https://arxiv.org/html/2305.18323v1 | https://github.com/billxbf/ReWOO | preprint | 2026-10-14 | v1, 2023-05-23; §§2.1–2.3 plan/work/solve, prompt redundancy and specialization; §§3.1–3.2/Table 2 HotpotQA protocol, tokens, judged accuracy and EM; Appendix A.1 token decomposition. CC BY 4.0. |
| R52.6 | paper | Planning and acting in partially observable stochastic domains | Leslie Pack Kaelbling, Michael L. Littman, Anthony R. Cassandra | Artificial Intelligence 101:99–134 / 1998 | https://people.csail.mit.edu/lpk/papers/aij98-pomdp.pdf | null | peer-reviewed | 2026-10-14 | Publisher-layout author-hosted PDF; received 1995-10-11, revised 1998-01-17; §§3.1–3.3, pp.105–107 state estimator/policy and Bayes belief update. Inspected these full sections; no claim about the paper's later solver experiments. |
| R52.7 | paper | PDDL2.1: An Extension to PDDL for Expressing Temporal Planning Domains | Maria Fox, Derek Long | JAIR 20:61–124 / 2003 | https://arxiv.org/pdf/1106.4561 | null | peer-reviewed | 2026-10-14 | JAIR-layout 64-page 2003 edition in an unversioned arXiv PDF route, explicitly unpinned; §§4–5, pp.69–74 plan metrics, durative actions, start/end/interval conditions and concurrency. These language semantics, not a production API implementation, support the local temporal-condition distinction. |
| R52.8 | paper | LLMs Can’t Plan, But Can Help Planning in LLM-Modulo Frameworks | Subbarao Kambhampati, Karthik Valmeekam, Lin Guan, Kaya Stechly, Mudit Verma, Siddhant Bhambri, Lucas Saldyt, Anil Murthy | arXiv / 2024 | https://arxiv.org/html/2402.01817v2 | null | preprint | 2026-10-14 | v2, 2024-02-06; §3.1 hard/soft critics and reformulation; §3.2 backprompt controller; §3.4 specification/model acquisition; Figure 3. Position/framework paper; secondary numerical claims in §2 are not used as primary results. CC BY 4.0. |
| R52.9 | documentation | Online Z3 Guide: Introduction and Basic Commands | Microsoft Research / Z3 contributors | Official guide / 2026 access | https://microsoft.github.io/z3guide/docs/logic/basiccommands/ | https://github.com/Z3Prover/z3 | official documentation | 2026-10-14 | Mutable pages unpinned; footer build 8ff965d3, browser z3-solver 5.0.0. Basic Commands check-sat/get-model, Using Scopes and Configuration; introduction https://microsoft.github.io/z3guide/docs/logic/intro/ also inspected. No solver query executed. |
| R52.10 | paper | Reflexion: Language Agents with Verbal Reinforcement Learning | Noah Shinn, Federico Cassano, Edward Berman, Ashwin Gopinath, Karthik Narasimhan, Shunyu Yao (inspected v4 author list) | NeurIPS / 2023 | https://arxiv.org/html/2303.11366v4 | https://github.com/noahshinn024/reflexion | peer-reviewed | 2026-10-14 | v4, 2023-10-10; §3 actor/evaluator/reflection and bounded context; §4.3 tests, Tables 1–3 outcomes/acceptance error/ablation; §5 limitations. CC BY 4.0. Archival metadata separately opened at https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html ; it lists five authors, omitting Berman. Local results refer explicitly to inspected v4. |
| R52.11 | paper | Agent Planning Benchmark: A Diagnostic Framework for Planning Capabilities in LLM Agents | Haoyu Sun, Wenxuan Wang, Mingyang Song, Jujie He, Weinan Zhang, Yang Liu, Yang Yang, Yu Cheng | arXiv / 2026 | https://arxiv.org/html/2606.04874v1 | null | preprint | 2026-10-14 | v1, 2026-06-03; §3 diagnostic modes; §5.1/Table 3 separate executable validation; Appendix D.1/Table 7 judge/human agreement; D.2 alternative solutions. §5.4 selected efficiency subset inspected but no population efficiency claim used. Nonexclusive arXiv license; compact factual synopsis only. |
| R52.12 | documentation | LangGraph persistence | LangChain | Official documentation / 2026 access | https://docs.langchain.com/oss/python/langgraph/persistence | https://github.com/langchain-ai/langgraph | official documentation | 2026-10-14 | Mutable unpinned resolved page; former durable-execution route redirects here. “Checkpointer vs. store”, “MemorySaver does not persist between restarts”, “Checkpoints growing unboundedly”, subgraph state. Documentation promises only; backend not executed. |
| R52.13 | documentation | LangGraph interrupts | LangChain | Official documentation / 2026 access | https://docs.langchain.com/oss/python/langgraph/interrupts | https://github.com/langchain-ai/langgraph | official documentation | 2026-10-14 | Mutable unpinned; introduction indefinite waiting; “Resuming interrupts” node restart; “Rules of interrupts” ordering/idempotent pre-interrupt side effects. No claim of exactly-once external effects. |
| R52.14 | repository | LangGraph Pregel loop source | LangChain contributors | Official repository / 2026 | https://raw.githubusercontent.com/langchain-ai/langgraph/ccb851effb7b4c6255add86dbeed577061475aff/libs/langgraph/langgraph/pregel/_loop.py | https://github.com/langchain-ai/langgraph | official documentation | 2026-10-14 | Commit ccb851effb7b4c6255add86dbeed577061475aff, resolved commit timestamp 2026-10-14T07:39:24Z; raw file tick lines633–646; synchronous entry1858–1859; asynchronous entry2116–2117; _put_checkpoint opening1209–1237. Exact static boundary and file hash below. |
| R52.15 | paper | Sagas | Hector Garcia-Molina, Kenneth Salem | ACM SIGMOD:249–259 / 1987 | https://sigmodrecord.org/?download_id=11106&smd_process_download=1 | null | peer-reviewed | 2026-10-14 | Official SIGMOD Record PDF, 11 pages; §1 pp.249–250 compensation semantics; §2 save points; §§4–5 backward/forward recovery; §8 parallel save-point dependency; §9 domain design. Scanned PDF's official OCR text inspected. No agent benchmark or measured production gain is attributed. |

## P41

[PAPER-REPORTED] [ReAct](https://arxiv.org/html/2210.03629v3). v3, 2023-03-10; full title ReAct: Synergizing Reasoning and Acting in Language Models. §2 augmented action/context mechanism; §§3.1–3.3, Table 1 PaLM-540B protocol and task-dependent EM/accuracy; §4 decision-making setup; Appendix C prompts. CC BY 4.0. OpenReview forum browser challenge prevented direct archival inspection; primary v3 full text inspected.

## P43

[PAPER-REPORTED] [τ-bench](https://arxiv.org/html/2406.12045v1). v1, 2024-06-17; §3 POMDP/API/user/policy/reward and pass^k definitions; §4.1/Table 1 domain counts; §5 protocol; Tables 2–3 and Figure 4 outcomes. CC BY 4.0.

## R52.1

[PAPER-REPORTED] [PlanBench-XL: Evaluating Long-Horizon Planning of LLM Tool-Use Agents in Large-Scale Tool Ecosystems](https://arxiv.org/html/2606.22388v1). v1, 2026-06-21; §§3–6; Table 2 configuration; Appendix B.6 retriever, B.7 runtime, B.8 Eqs.14–21/illustrative precision, B.9.3 blocker feasibility and tie-breaks; §5/Figures 2–3 silent errors and longer recovery. Nonexclusive arXiv license; compact factual synopsis only.

## R52.2

[PAPER-REPORTED] [When Tools Fail: Benchmarking Dynamic Replanning and Anomaly Recovery in LLM Agents](https://arxiv.org/html/2606.05806v1). v1, 2026-06-04; §§3.1–3.4 corpus/topology/generation/activation; §3.5 Eqs.1–4 success/recovery/cost; §4.1 budgets; Table 2 prompt/fault outcomes; §4.3/Figure 5 cross-model slopes; Appendix D full conditions. CC BY 4.0.

## R52.3

[PAPER-REPORTED] [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents). Published 2024-12-19; mutable text unpinned. “What are agents?”, “When and how to use frameworks”, “Building blocks, workflows, and agents”, workflow patterns and “Agents”. Historical distinction; current page notes tooling has changed. Not a controlled benchmark.

## R52.4

[PAPER-REPORTED] [Language Agent Tree Search Unifies Reasoning, Acting, and Planning in Language Models](https://arxiv.org/html/2310.04406v3). v3, 2024-06-06; §§3–4 resettable environment/MCTS/LM heuristic/reflection; §5.1/Table 3 HotpotQA; Table 8 ablations; Table 9 success-conditioned token counts. Archival identity independently opened at https://proceedings.mlr.press/v235/zhou24r.html . CC BY 4.0.

## R52.5

[PAPER-REPORTED] [ReWOO: Decoupling Reasoning from Observations for Efficient Augmented Language Models](https://arxiv.org/html/2305.18323v1). v1, 2023-05-23; §§2.1–2.3 plan/work/solve, prompt redundancy and specialization; §§3.1–3.2/Table 2 HotpotQA protocol, tokens, judged accuracy and EM; Appendix A.1 token decomposition. CC BY 4.0.

## R52.6

[PAPER-REPORTED] [Planning and acting in partially observable stochastic domains](https://people.csail.mit.edu/lpk/papers/aij98-pomdp.pdf). Publisher-layout author-hosted PDF; received 1995-10-11, revised 1998-01-17; §§3.1–3.3, pp.105–107 state estimator/policy and Bayes belief update. Inspected these full sections; no claim about the paper's later solver experiments.

## R52.7

[PAPER-REPORTED] [PDDL2.1: An Extension to PDDL for Expressing Temporal Planning Domains](https://arxiv.org/pdf/1106.4561). JAIR-layout 64-page 2003 edition in an unversioned arXiv PDF route, explicitly unpinned; §§4–5, pp.69–74 plan metrics, durative actions, start/end/interval conditions and concurrency. These language semantics, not a production API implementation, support the local temporal-condition distinction.

## R52.8

[PAPER-REPORTED] [LLMs Can’t Plan, But Can Help Planning in LLM-Modulo Frameworks](https://arxiv.org/html/2402.01817v2). v2, 2024-02-06; §3.1 hard/soft critics and reformulation; §3.2 backprompt controller; §3.4 specification/model acquisition; Figure 3. Position/framework paper; secondary numerical claims in §2 are not used as primary results. CC BY 4.0.

## R52.9

[OFFICIAL-DOCUMENTATION] [Online Z3 Guide: Introduction and Basic Commands](https://microsoft.github.io/z3guide/docs/logic/basiccommands/). Mutable pages unpinned; footer build 8ff965d3, browser z3-solver 5.0.0. Basic Commands check-sat/get-model, Using Scopes and Configuration; introduction https://microsoft.github.io/z3guide/docs/logic/intro/ also inspected. No solver query executed.

## R52.10

[PAPER-REPORTED] [Reflexion: Language Agents with Verbal Reinforcement Learning](https://arxiv.org/html/2303.11366v4). v4, 2023-10-10; §3 actor/evaluator/reflection and bounded context; §4.3 tests, Tables 1–3 outcomes/acceptance error/ablation; §5 limitations. CC BY 4.0. Archival metadata separately opened at https://proceedings.neurips.cc/paper_files/paper/2023/hash/1b44b878bb782e6954cd888628510e90-Abstract-Conference.html ; it lists five authors, omitting Berman. Local results refer explicitly to inspected v4.

## R52.11

[PAPER-REPORTED] [Agent Planning Benchmark: A Diagnostic Framework for Planning Capabilities in LLM Agents](https://arxiv.org/html/2606.04874v1). v1, 2026-06-03; §3 diagnostic modes; §5.1/Table 3 separate executable validation; Appendix D.1/Table 7 judge/human agreement; D.2 alternative solutions. §5.4 selected efficiency subset inspected but no population efficiency claim used. Nonexclusive arXiv license; compact factual synopsis only.

## R52.12

[OFFICIAL-DOCUMENTATION] [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence). Mutable unpinned resolved page; former durable-execution route redirects here. “Checkpointer vs. store”, “MemorySaver does not persist between restarts”, “Checkpoints growing unboundedly”, subgraph state. Documentation promises only; backend not executed.

## R52.13

[OFFICIAL-DOCUMENTATION] [LangGraph interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts). Mutable unpinned; introduction indefinite waiting; “Resuming interrupts” node restart; “Rules of interrupts” ordering/idempotent pre-interrupt side effects. No claim of exactly-once external effects.

## R52.14

[OFFICIAL-DOCUMENTATION] [LangGraph Pregel loop source](https://raw.githubusercontent.com/langchain-ai/langgraph/ccb851effb7b4c6255add86dbeed577061475aff/libs/langgraph/langgraph/pregel/_loop.py). Commit ccb851effb7b4c6255add86dbeed577061475aff, resolved commit timestamp 2026-10-14T07:39:24Z; raw file tick lines633–646; synchronous entry1858–1859; asynchronous entry2116–2117; _put_checkpoint opening1209–1237. Exact static boundary and file hash below.

## R52.15

[PAPER-REPORTED] [Sagas](https://sigmodrecord.org/?download_id=11106&smd_process_download=1). Official SIGMOD Record PDF, 11 pages; §1 pp.249–250 compensation semantics; §2 save points; §§4–5 backward/forward recovery; §8 parallel save-point dependency; §9 domain design. Scanned PDF's official OCR text inspected. No agent benchmark or measured production gain is attributed.

## Implementation inspection record

[OFFICIAL-DOCUMENTATION] R52.14 was fetched from the immutable raw URL, decoded and inspected with line-numbered output. The 2,144-line file's SHA-256 is **1485e5d299b71b91f59f4685ef33318ac4543bb1c81f6282e9e15323eec4526c**. tick checks step greater than stop and returns out_of_steps; both entry paths initialize stop using recursion_limit. These are source-level facts. The check did not execute the loop, test timeout behavior, restore a backend, or prove a logical-request-wide budget.

[DERIVED] The checkpoint function's opening was inspected to identify code location; no claim of complete checkpoint atomicity or durability is inferred from those lines. A deployed compatibility claim would require a versioned package, checkpointer, tool transport and executed end-to-end checks. The repository blob page timed out; the same immutable raw file was successfully opened with web fetch and independently retrieved for static inspection.

## Revision and evidence boundaries

[DERIVED] P41 and P43 preserve the plan's spine keys. The 2026 preprints are inspected v1 records, not claims of archival acceptance or complete coverage of later revisions. Mutable official documentation remains unpinned even when its footer exposes a build identifier. The references distinguish retrieved code links from inspected code; only R52.14's named file was statically inspected.

[NOT-DISCLOSED] Common hardware/precision, cross-paper equal total compute, provider kernel revisions, complete repeated-run uncertainty and transaction-level crash/partition outcomes are absent from the cited controller comparisons. [UNVERIFIED] Local execution, independent replication, semantic world-model completeness and safe effect recovery of the proposed artifact remain untested. These gaps block reviewed status and operational reliability claims.

[DERIVED] Original equations, conditional proofs, algorithm adaptations and engineering synthesis are predominant. Licensed CC BY texts are attributed at their local method/result locators. Nonexclusive papers and restricted historical PDFs receive compact factual summaries; no long verbatim passages are reproduced.
