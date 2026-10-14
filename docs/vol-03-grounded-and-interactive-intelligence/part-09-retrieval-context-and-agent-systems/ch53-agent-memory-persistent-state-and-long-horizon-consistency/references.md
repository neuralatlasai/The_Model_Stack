---
id: "ms.references.53"
entity_type: "references"
title: "Chapter 53 — References"
volume: 3
part: 9
chapter: 53
section: null
slug: "references"
parent: "ms.chapter.53"
prev_sibling: "ms.verification.53"
next_sibling: null
children: []
prerequisites: ["ms.chapter.24","ms.chapter.42","ms.chapter.49","ms.chapter.50","ms.chapter.51","ms.chapter.52"]
downstream: ["ms.chapter.54","ms.chapter.66"]
related: []
relations: []
axes: {"lifecycle":["inference","evaluation","assurance"],"mechanism":["agent_memory","persistent_state","provenance","deletion"],"feedback_setting":[],"modality":["text"]}
papers: ["P16","P40"]
implementations: ["impl.pytorch","impl.hugging-face-transformers"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# Chapter 53 — References

[DERIVED] All listed primary surfaces were inspected on **2026-10-14**. Paper revisions are pinned below; documentation major versions are fixed where available. Repository main paths are explicitly unpinned and were inspected without executing them. P16 and P40 retain their canonical spine identities. Method claims and original engineering derivations are separated in the sections.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P16 | paper | Overcoming catastrophic forgetting in neural networks | James Kirkpatrick et al.; DeepMind | PNAS / 2017; origin 2016 | https://arxiv.org/html/1612.00796v2 | — | peer-reviewed | Inspected v2, 2017-01-25; §2 Eq. 3 and §2.1–2.2; parametric-retention boundary only. Nonexclusive license; compact attribution. | 2026-10-14 |
| P40 | paper | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | Patrick Lewis et al.; FAIR and collaborators | NeurIPS / 2020 | https://arxiv.org/html/2005.11401v4 | https://github.com/huggingface/transformers | peer-reviewed | Inspected v4 in this research session for Chapter 50; §2, Fig. 1 and retrieval/generation formulation. External evidence-access anchor; full mechanism remains §50.3. | 2026-10-14 |
| R53.1 | paper | MemGPT: Towards LLMs as Operating Systems | Charles Packer; Sarah Wooders; Kevin Lin; Vivian Fang; Shishir G. Patil; Ion Stoica; Joseph E. Gonzalez | arXiv / 2023; inspected revision 2024 | https://arxiv.org/html/2310.08560v2 | https://research.memgpt.ai | preprint | v2, 2024-02-12, CC BY 4.0; §2.1–2.4 context/queue/function/heartbeat procedure; §3 implementation model IDs; §3.1.1 Table 2 access comparison; §3.2.1–3.2.2 control failures and UUID task. | 2026-10-14 |
| R53.2 | paper | Generative Agents: Interactive Simulacra of Human Behavior | Joon Sung Park; Joseph C. O'Brien; Carrie J. Cai; Meredith Ringel Morris; Percy Liang; Michael S. Bernstein | UIST / 2023 | https://arxiv.org/html/2304.03442v2 | https://github.com/joonspk-research/generative_agents | peer-reviewed | v2, 2023-08-06; §4.1–4.2 ranking/reflection. Nonexclusive license; compact mechanism attribution, no new numerical benchmark claim. | 2026-10-14 |
| R53.3 | paper | LongMemEval: Benchmarking Chat Assistants on Long-Term Interactive Memory | Di Wu; Hongwei Wang; Wenhao Yu; Yuwei Zhang; Kai-Wei Chang; Dong Yu | ICLR / 2025 | https://arxiv.org/html/2410.10813v2 | https://github.com/xiaowu0162/LongMemEval | peer-reviewed | v2, 2025-03-04, CC BY 4.0; §3.1–3.3 construction/metrics; §4–5.4 interface designs and Table 3 paired cells; Appendix A.4 Table 6 judge validation; Appendix E.4 time-filter failures. | 2026-10-14 |
| R53.4 | paper | Benchmarking Agent Memory in Interdependent Multi-Session Agentic Tasks | Zexue He et al. | arXiv / 2026 | https://arxiv.org/html/2602.16313v1 | — | preprint | v1, 2026-02-18; §3.2 loop; §4.1–4.3, Eq. 5 and Table 3. Nonexclusive license; bounded synopsis. | 2026-10-14 |
| R53.5 | paper | STALE: Can LLM Agents Know When Their Memories Are No Longer Valid? | Hanxiang Chao; Yihan Bai; Rui Sheng; Tianle Li; Yushi Sun | arXiv / 2026 | https://arxiv.org/html/2605.06527v1 | https://github.com/icedreamc/STALE | preprint | v1, 2026-05-07, CC BY 4.0; §3.2–3.5 conflict construction/probes; §4.1 Table 2 setup/outcomes; §4.3 association boundary; §4.4 Table 3 visibility/revision diagnostic; Appendix E.3 Table 7 judge validation; Appendix F.1–F.3 CUPMem procedure; Appendix G artifact links. | 2026-10-14 |
| R53.6 | paper | Forgetting Without Restarting: Execution-State Unlearning for Stateful LLM Agents | Chao Yao; Yangbo Wei; Zhen Huang; Junhong Qian; Chenle Chen; Shaoqiang Lu; Chen Wu; Lei He | arXiv / 2026 | https://arxiv.org/html/2609.04875v1 | — | preprint | v1, 2026-09-04; Method Theorem 1/Corollary 1; Experiments setup, Table 1 and Exactness/Efficiency. Nonexclusive license; bounded synopsis. | 2026-10-14 |
| R53.7 | paper | Deployment-Time Memorization in Foundation-Model Agents | Lei (Rachel) Chen; Guilin Zhang; Kai Zhao; Dalmo Cirne; Andy Olsen; Zeke Miller; Xu Chu; Alet Blanken; Amine Anoun; Jerry Ting | arXiv / 2026 | https://arxiv.org/html/2606.10062v1 | — | preprint | v1, 2026-06-08, CC BY 4.0; §2.1–2.4, Table 1 deletion modes; §3.1 setup/scoring; §3.2–3.3 Table 2 residue/uncertainty. The claimed appendix utility validation is absent from inspected HTML. | 2026-10-14 |
| R53.8 | repository | Transformers cache implementation | Hugging Face Transformers contributors | Official repository / mutable main | https://raw.githubusercontent.com/huggingface/transformers/main/src/transformers/cache_utils.py | https://github.com/huggingface/transformers | official documentation | Unpinned main; DynamicLayer.crop lines 156–178, DynamicSlidingWindowLayer.crop 267–284, LinearAttentionLayer.crop 930–943, Cache.crop 1507–1515 in inspected surface. Layer-specific rollback/history prerequisites and changing argument semantics; no execution. | 2026-10-14 |
| R53.9 | documentation | PostgreSQL 18: Transaction Isolation | PostgreSQL Global Development Group | Official documentation / version 18 | https://www.postgresql.org/docs/18/transaction-iso.html | https://www.postgresql.org/docs/18/ | official documentation | Major-version URL fixed, page revision unpinned; §13.2.1–13.2.3 and Table 13.1, snapshots/serialization/retry contract. | 2026-10-14 |
| R53.10 | documentation | PostgreSQL 18: Routine Vacuuming | PostgreSQL Global Development Group | Official documentation / version 18 | https://www.postgresql.org/docs/18/routine-vacuuming.html | https://www.postgresql.org/docs/18/ | official documentation | Major-version URL fixed, page revision unpinned; §24.1.1–24.1.2, row-version retention/reuse boundary; not media-erasure certification. | 2026-10-14 |
| R53.11 | repository | LongMemEval answer evaluation implementation | LongMemEval authors | Official repository / mutable main | https://raw.githubusercontent.com/xiaowu0162/LongMemEval/main/src/evaluation/evaluate_qa.py | https://github.com/xiaowu0162/LongMemEval | official documentation | Unpinned main; model_zoo lines 10–14, get_anscheck_prompt 21–42, category dispatch/scoring 89–105. Dated judges, temporal tolerance and knowledge-update rubric; no execution. | 2026-10-14 |

## Evidence boundaries

[DERIVED] Paper protocols establish outcomes under their disclosed histories, task agents, memory configurations, judges and budgets. A representation or system label is not a universal quality ordering. Source-specific comparisons retain exact table boundaries; the manuscript does not reconcile different appendix/main-table settings by silently substituting cells.

[DERIVED] The transactional/provenance/deletion policy is an engineering synthesis required by the plan. Original arguments cover decision-sufficiency collisions, expected write utility, cumulative defect bounds, eligibility, write skew, idempotent operation identity, recorded deletion closure, conditional runtime reconstruction, zero-event uncertainty and offered-task statistics. These arguments do not establish that the proposed service has been implemented correctly.

[NOT-DISCLOSED] Complete deployment-level model precision/hardware, energy, monetary prices, independent replication and calibration details are not uniformly supplied by these sources. Where the prose reports a historical model ID or setup, it is a description of that study rather than a current endpoint recommendation.

[UNVERIFIED] Official code links in paper records identify source artifacts; they do not imply those repositories were executed or every code path inspected. The actual source inspections are R53.8 and R53.11, plus full-text paper procedures. All main-path source and documentation page revisions remain unpinned where stated.

## Licensing and adaptation

[DERIVED] MemGPT v2, LongMemEval v2, STALE v1 and Deployment-Time Memorization v1 explicitly display CC BY 4.0. Their mechanisms and protocols are attributed and critically re-expressed. Nonexclusive papers receive compact bibliographic/mechanism/result synopses; the surrounding derivations, counterexamples, state policy, algorithms and diagrams are original manuscript synthesis. No substantial source prose is reproduced.

## Open evidence gaps

| Gap | Review consequence |
|---|---|
| No executed memory, transaction, deletion or replay artifact | Draft specifications cannot be described as a validated implementation |
| Mutable cache/evaluator source | Bind commit and dependency versions before reproducing behavior |
| No complete proof that provenance captures every influence/copy | Closure completion is conditional on graph/copy coverage |
| Counterfactual observations or committed effects unavailable | Exact runtime restoration is outside the guarantee |
| Finite leakage probes and small controlled deletion sample | Zero observed residue is not a zero-risk statement |
| Nonuniform judges/task definitions | Preserve exact rubric, denominator and outcome semantics |
| Unknown lifecycle coefficients | Report stage costs and resource dimensions before claiming efficiency |

[DERIVED] Proposed experiments and the concept-by-concept completeness audit are in [verification](verification.md).
