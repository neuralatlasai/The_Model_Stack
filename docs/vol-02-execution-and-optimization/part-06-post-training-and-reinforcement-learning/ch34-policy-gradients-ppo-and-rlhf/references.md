---
id: ms.references.34
entity_type: references
title: References — Policy gradients and RLHF
short_title: References — Policy gradients and RLHF
volume: 2
part: 6
chapter: 34
section: null
slug: references
parent: ms.chapter.34
prev_sibling: ms.verification.34
next_sibling: null
children: []
prerequisites:
- ms.chapter.2
- ms.chapter.30
- ms.chapter.31
- ms.chapter.32
downstream:
- ms.chapter.35
- ms.chapter.36
- ms.chapter.38
- ms.chapter.39
related: []
relations: []
axes:
  lifecycle:
  - post_training
  mechanism:
  - policy_optimization
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.verl
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
word_count_target: 1400
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# References — Chapter 34

[DERIVED] All primary surfaces were actually inspected before their chapter claims and accessed on **2026-10-09**. Eligibility is first publication/release **2025-12-01 through 2026-10-09**. All ten admitted records originate in **2026 (100%)**, January 12 through October 5. A current revision or access date does not admit older research. Papers remain preprints unless an independent archival identity is verified. No source execution or independent reproduction is claimed.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R34.1 | repository | verl v0.9.1 | verl contributors | First 2026-09-20; inspected version below | [Primary full text](https://github.com/verl-project/verl/releases/tag/v0.9.1) | [Tagged code](https://github.com/verl-project/verl/tree/v0.9.1) | official documentation | 2026-10-09 | Release/API timestamp 2026-09-20T07:24:43Z; full SHA 1876b06d0a3e4e71e06230be10af14492ca8a75b; core_algos.py GAE216–259, vanilla1286–1380, value2125–2185, KL2188–2248; rollout_corr_helper.py522–659; FSDP transformer_impl.py98–106/1350–1505; vllm_async_server.py1200–1207 |
| R34.2 | paper | Segmental Advantage Estimation: Enhancing PPO for Long-Context LLM Training | Xue Gong et al. | First 2026-01-12; inspected version below | [Primary full text](https://arxiv.org/html/2601.07320v1) | null | preprint | 2026-10-09 | arXiv:2601.07320v1; §§3–5, Eq5/8/10, Table1; Appendix A recurrence, B critic-error bound, D/E/F protocol and limitations |
| R34.3 | paper | Rethinking Importance Sampling in LLM Policy Optimization: A Cumulative Token Perspective | Yuheng Zhang, Chenlu Ye, Shuowei Jin, Changlong Yu, Wei Xiong, Saurabh Sahu, Nan Jiang | First 2026-05-08; inspected version below | [Primary full text](https://arxiv.org/html/2605.07331v1) | null | preprint | 2026-10-09 | arXiv:2605.07331v1; §§2–4, especially3.1 prefix identity,3.3 implemented terminal/group surrogate; Appendix A proofs; Tables2–3 and experiment protocol |
| R34.4 | paper | Start Classifying: Categorical Critics for LLM Reinforcement Learning | Zhijian Zhou et al. | First 2026-08-03; inspected version below | [Primary full text](https://arxiv.org/html/2608.02181v1) | null | preprint | 2026-10-09 | arXiv:2608.02181v1; §§2–5, Table1; Appendix A protocol/target Eq5 caveat, B head/target ablations, C cost, D implementation, E extensions; math arm admitted, contradictory tool reward excluded |
| R34.5 | paper | Beyond Uniform Token-Level Trust Region in LLM Reinforcement Learning | Renjie Mao et al. | First 2026-06-09; inspected version below | [Primary full text](https://arxiv.org/html/2606.10968v1) | null | preprint | 2026-10-09 | arXiv:2606.10968v1; §§2–4, conditional TV bound/gating; Appendix B proofs and initial slack, C auxiliary soft mixture, D reduced-TV approximation/protocol; Table1 selected-validation comparison |
| R34.6 | paper | Rethinking the Divergence Regularization in LLM RL | Jiarui Yao, Xiangxin Zhou, Penghui Qi, Wee Sun Lee, Liefeng Bo, Tianyu Pang | First 2026-06-08; inspected version below | [Primary full text](https://arxiv.org/html/2606.09821v1) | null | preprint | 2026-10-09 | arXiv:2606.09821v1; §3 Eq8–11 scalar regularizer/gradient, §4 outcomes/ablations; Appendix B gradient, C alternative divergences, D Table2 settings and D.1–D.6 ablations |
| R34.7 | paper | Understanding and Preventing Entropy Collapse in RLVR with On-Policy Entropy Flow Optimization | Huimin Xu, Shuai Zhao, Xiaobao Wu, Anh Tuan Luu | First 2026-05-12; inspected version below | [Primary full text](https://arxiv.org/html/2605.11491v1) | null | preprint | 2026-10-09 | arXiv:2605.11491v1; §§3–6, Eq6 disputed entropy simplification, Eq7–9 balancing rule, Tables1–4, §6.6 timing; Appendix A proof inspected/excluded as general identity, B benchmark sizes |
| R34.8 | paper | What pass@k Cannot Measure: Evaluating Diversity and Capability Retention after Post-Training | Subham Rath, Raj Dandekar, Rajat Dandekar, Sreedath Panat | First 2026-10-05; inspected version below | [Primary full text](https://arxiv.org/html/2610.07405v1) | null | preprint | 2026-10-09 | arXiv:2610.07405v1; §§2–5, Tables1–2; reproducibility appendix Training/Sampling/Verifier/Entropy/Bootstrap/Seeds/Known gap; workshop status not promoted to main-conference peer review |
| R34.9 | paper | When RLHF Fails: A Mechanistic Taxonomy of Reward Hacking, Collapse, and Evaluator Gaming | Zelalem Abahana | First 2026-06-02; inspected version below | [Primary full text](https://arxiv.org/html/2606.03238v1) | null | preprint | 2026-10-09 | arXiv:2606.03238v1; §§3–7, Tables2–4, Algorithm2, Appendix A–G; artifacts/judges, mitigation intervals, ungrouped early-warning split and seed/human limitations |
| R34.10 | paper | Can Agents Generalize to the Open World? Unveiling the Fragility of Static Training in Tool Use | Song-Lin Lv, Weiming Wu, Rui Zhu, Zi-Jian Cheng, Lan-Zhe Guo | First 2026-07-01; inspected version below | [Primary full text](https://arxiv.org/html/2607.01084v1) | null | preprint | 2026-10-09 | arXiv:2607.01084v1; §§3.1–3.2 process/shifts,4.2–4.5 perturbations,5 outcomes; Appendix C–D exact setup/results. ICML acceptance is author-reported only |

## Versioned claim locators

### R34.1

[DERIVED] Original publication/release: **2026-09-20**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://github.com/verl-project/verl/releases/tag/v0.9.1). Release/API timestamp 2026-09-20T07:24:43Z; full SHA 1876b06d0a3e4e71e06230be10af14492ca8a75b; core_algos.py GAE216–259, vanilla1286–1380, value2125–2185, KL2188–2248; rollout_corr_helper.py522–659; FSDP transformer_impl.py98–106/1350–1505; vllm_async_server.py1200–1207.

### R34.2

[DERIVED] Original publication/release: **2026-01-12**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://arxiv.org/html/2601.07320v1). arXiv:2601.07320v1; §§3–5, Eq5/8/10, Table1; Appendix A recurrence, B critic-error bound, D/E/F protocol and limitations.

### R34.3

[DERIVED] Original publication/release: **2026-05-08**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://arxiv.org/html/2605.07331v1). arXiv:2605.07331v1; §§2–4, especially3.1 prefix identity,3.3 implemented terminal/group surrogate; Appendix A proofs; Tables2–3 and experiment protocol.

### R34.4

[DERIVED] Original publication/release: **2026-08-03**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://arxiv.org/html/2608.02181v1). arXiv:2608.02181v1; §§2–5, Table1; Appendix A protocol/target Eq5 caveat, B head/target ablations, C cost, D implementation, E extensions; math arm admitted, contradictory tool reward excluded.

### R34.5

[DERIVED] Original publication/release: **2026-06-09**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://arxiv.org/html/2606.10968v1). arXiv:2606.10968v1; §§2–4, conditional TV bound/gating; Appendix B proofs and initial slack, C auxiliary soft mixture, D reduced-TV approximation/protocol; Table1 selected-validation comparison.

### R34.6

[DERIVED] Original publication/release: **2026-06-08**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://arxiv.org/html/2606.09821v1). arXiv:2606.09821v1; §3 Eq8–11 scalar regularizer/gradient, §4 outcomes/ablations; Appendix B gradient, C alternative divergences, D Table2 settings and D.1–D.6 ablations.

### R34.7

[DERIVED] Original publication/release: **2026-05-12**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://arxiv.org/html/2605.11491v1). arXiv:2605.11491v1; §§3–6, Eq6 disputed entropy simplification, Eq7–9 balancing rule, Tables1–4, §6.6 timing; Appendix A proof inspected/excluded as general identity, B benchmark sizes.

### R34.8

[DERIVED] Original publication/release: **2026-10-05**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://arxiv.org/html/2610.07405v1). arXiv:2610.07405v1; §§2–5, Tables1–2; reproducibility appendix Training/Sampling/Verifier/Entropy/Bootstrap/Seeds/Known gap; workshop status not promoted to main-conference peer review.

### R34.9

[DERIVED] Original publication/release: **2026-06-02**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://arxiv.org/html/2606.03238v1). arXiv:2606.03238v1; §§3–7, Tables2–4, Algorithm2, Appendix A–G; artifacts/judges, mitigation intervals, ungrouped early-warning split and seed/human limitations.

### R34.10

[DERIVED] Original publication/release: **2026-07-01**; actual access: **2026-10-09**. Inspected surface: [originating artifact](https://arxiv.org/html/2607.01084v1). arXiv:2607.01084v1; §§3.1–3.2 process/shifts,4.2–4.5 perturbations,5 outcomes; Appendix C–D exact setup/results. ICML acceptance is author-reported only.

## Implementation pin and evidence boundary

[OFFICIAL-DOCUMENTATION] The originating GitHub release API identifies v0.9.1 at **1876b06d0a3e4e71e06230be10af14492ca8a75b**, published **2026-09-20T07:24:43Z**. The [tagged core algorithms](https://github.com/verl-project/verl/blob/v0.9.1/verl/trainer/ppo/core_algos.py), [correction helper](https://github.com/verl-project/verl/blob/v0.9.1/verl/trainer/ppo/rollout_corr_helper.py), [FSDP scorer](https://github.com/verl-project/verl/blob/v0.9.1/verl/workers/engine/fsdp/transformer_impl.py) and [rollout server](https://github.com/verl-project/verl/blob/v0.9.1/verl/workers/rollout/vllm_rollout/vllm_async_server.py) were read directly. Functions establish a disclosed implementation surface; this is not executable compatibility validation. Source papers' unspecified verl versions are not silently equated with this later tag.

## Gaps, exclusions and disputed guarantees

| Item | Status | Review consequence |
|---|---|---|
| Historical PPO1707.06347, GAE1506.02438, InstructGPT2203.02155 | Excluded, pre-window first publication | No historical results imported; mathematical foundations derived without novelty claims |
| CTPO theorem versus implemented outcome/group/clipped surrogate | MATHEMATICALLY-DERIVED boundary | Prefix correction requires prefix-measurable target-policy multipliers; terminal counterexample retained |
| Categorical critic Table1 @256 versus AppendixA smaller per-benchmark budgets | UNVERIFIED reconciliation | Reported aggregate retained with protocol conflict; exact evaluation reconstruction unresolved |
| Categorical critic AppendixA Eq5 tool reward versus prose guarantee | Excluded contradictory guarantee | Incorrect answers can receive positive reward for T>2 under the printed formula; tool arm not used to claim semantic reward validity |
| CPPO reduced TV, initial slack and auxiliary soft policy | PAPER-REPORTED qualified method | Lower-bound gating and gradient scaling do not establish hard deployed full-policy constraints; AppendixB.7 slack retained |
| OPEFO AppendixA off-action simplification | Excluded as general entropy identity | Full-vector Eq34.18 replaces the disputed reduction; reported empirical rule remains explicitly heuristic |
| RLHF study judge defaults, row bootstrap and model scale | NOT-DISCLOSED / limited design | No frontier failure rate, actual judge override identity or independent seed-robust mitigation claimed; reduction intervals include zero |
| pass@k study overwritten raw seed0 / missing per-sample entropy | PAPER-REPORTED missing data | Some paired/diversity analyses n2, aggregate main arms n3; no reconstructed correct-only token entropy |
| Hardware, precision, seeds where marked ND | NOT-DISCLOSED | No inferred optimizer/runtime compatibility or measured throughput |
| Author code availability / paper reproductions | UNVERIFIED execution | Only pinned verl code read; no author repository run, no GPU measurements |
| Inaccessible candidate sources | None admitted | An abstract-only or failed full-text lead supplies no technical claims |

[DERIVED] Older model and dataset names appear only as the workload disclosed by an eligible 2026 originating study. They are not standalone evidence for historical mechanisms, current model capabilities or hidden training practices. Search indexes are discovery routes, not independent corroboration. Analytical resource figures are not copied benchmark curves.

## Route and review consequence

[DERIVED] Retrieval followed exact reference-stack §3#1 arXiv primary full text and §4#37 verl official tagged code. No lab reputation or author-reported conference acceptance substitutes for primary protocol inspection. Full methods, relevant experiment sections and appendices were read vertically; the ledger preserves original dates, inspected revisions, access dates and claim locators. Proposed verification, formulas and chosen examples remain distinct from source-reported observations. These gaps bound the claims without erasing the material that can be reconstructed.
