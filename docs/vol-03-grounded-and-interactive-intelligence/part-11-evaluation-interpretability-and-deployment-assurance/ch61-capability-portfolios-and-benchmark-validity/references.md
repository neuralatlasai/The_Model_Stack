---
id: ms.references.61
entity_type: references
title: "Chapter 61 — References"
volume: 3
part: 11
chapter: 61
section: null
slug: references
parent: ms.chapter.61
prev_sibling: ms.verification.61
next_sibling: null
children: []
prerequisites: [ms.chapter.6, ms.chapter.31, ms.chapter.49, ms.chapter.55, ms.chapter.56, ms.chapter.57]
downstream: [ms.chapter.62, ms.chapter.66]
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

# Chapter 61 references

[DERIVED] **Accessed 2026-10-25.** First public release, inspected revision and actual access are separate. New research is restricted to 2026-03-01–2026-10-24. The exact retained source surfaces below were inspected for the named methods and results; no full bibliography audit, inference run, benchmark replication or local package-compatibility check is claimed.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R61.1 | paper | What Does MMLU Actually Measure? A Psychometric Audit of Difficulty Structure in Aggregate Benchmark Scores | Dana Paquin; Riddhiman Jain | arXiv / 2026 | https://arxiv.org/html/2609.09372v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-09-08. Inspected: v1, 2026-09-08. 61.1–61.2: §§3–6, Table 1, Appendix C; response population, fitted item model, subject clustering and construct limits. No internal-mechanism or deployment validation. |
| R61.2 | paper | Who Thinks Best Depends on How Long You Let Them: Budget-Dependent Rankings in LLM Evaluation | Rodrigo Guedes de Souza; Alison R. Panisson | arXiv / 2026 | https://arxiv.org/html/2608.12150v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-08-12. Inspected: v1, 2026-08-12. 61.2–61.3: §3 protocol/three completion analyses; §4.2 significance qualification; Appendices B–C and H. Model/token cap is not a hardware-work match; greedy is not runtime determinism. |
| R61.3 | paper | Contamination Inflates Scores but Rarely Reorders Large Language Model Leaderboards | Xingyao Xiao; Yihong Cheng | arXiv / 2026 | https://arxiv.org/pdf/2609.02899v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-07-05. Inspected: v1, 2026-07-05. 61.4: Method pp. 6–8; Results pp. 9–13, Table 1; Discussion. Aligned contrast, negative control, Rasch/raw ranking checks. Paraphrase-specific difficulty limits causal attribution. |
| R61.4 | paper | A Framework for Generating Valid Context-Specific Benchmarks through Expert Guidance | Kimberly Le Truong; Nari Johnson; Anna Kawakami; Hoda Heidari | arXiv / 2026 | https://arxiv.org/html/2609.16592v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-09-15. Inspected: v1, 2026-09-15. 61.6: §§4–8, Table 1, Appendices B/D; schema, coverage/realism, six-expert protocol and instrument disagreement. Authors report EMNLP Findings acceptance; proceedings status not independently established. |
| R61.5 | paper | perturber: A Stateless Service for Semantics-Preserving Text Perturbations | Khoi-Nguyen Tran; IBM Research AI | arXiv / 2026 | https://arxiv.org/html/2610.12667v1 | Paper-linked code not inspected/executed | preprint | 2026-10-25 | First public: 2026-10-08. Inspected: v1, 2026-10-08. 61.5: §§2–4, Table 1, Appendix C; deterministic/model-backed boundary, parity versus semantic fidelity, small demonstration limits. Catalog/tier counts use different scopes; no model robustness rate inferred. |
| R61.6 | documentation | LM Evaluation Harness v0.4.13 release | EleutherAI | GitHub release / 2026 | https://github.com/EleutherAI/lm-evaluation-harness/releases/tag/v0.4.13 | https://github.com/EleutherAI/lm-evaluation-harness/commit/ddd67220430a2470529f25fd5c05a576ca1057a0 | official documentation | 2026-10-25 | First public: 2026-08-31. Inspected: v0.4.13; ddd67220430a2470529f25fd5c05a576ca1057a0. 61.3: Bug Fixes/Migration Notes, current source release identity. Historical benchmark papers are not recast as current releases. No package install or runtime test. |
| R61.7 | repository | GPQA task README in LM Evaluation Harness v0.4.13 | EleutherAI | pinned source / 2026 | https://raw.githubusercontent.com/EleutherAI/lm-evaluation-harness/v0.4.13/lm_eval/tasks/gpqa/README.md | https://github.com/EleutherAI/lm-evaluation-harness/tree/ddd67220430a2470529f25fd5c05a576ca1057a0/lm_eval/tasks/gpqa | official documentation | 2026-10-25 | First public: 2026-08-31. Inspected: v0.4.13 release-specific surface. 61.2: Groups/Tasks and v2.1/v2.2 changelog. Static documentation inspection; no reproduction of the older paper statistics quoted in its introduction. |
| R61.8 | repository | MMLU-Pro task README in LM Evaluation Harness v0.4.13 | EleutherAI | pinned source / 2026 | https://raw.githubusercontent.com/EleutherAI/lm-evaluation-harness/v0.4.13/lm_eval/tasks/mmlu_pro/README.md | https://github.com/EleutherAI/lm-evaluation-harness/tree/ddd67220430a2470529f25fd5c05a576ca1057a0/lm_eval/tasks/mmlu_pro | official documentation | 2026-10-25 | First public: 2026-08-31. Inspected: v0.4.13; changelog entry 2026-05-04. 61.2: task variants and May chat-role correction. Original benchmark research remains historical context, not newly introduced 2026 evidence. |
| R61.9 | repository | ContextSampler and FirstNSampler | EleutherAI | pinned source / 2026 | https://raw.githubusercontent.com/EleutherAI/lm-evaluation-harness/ddd67220430a2470529f25fd5c05a576ca1057a0/lm_eval/api/samplers.py | https://github.com/EleutherAI/lm-evaluation-harness | official documentation | 2026-10-25 | First public: 2026-08-31. Inspected: ddd67220430a2470529f25fd5c05a576ca1057a0. 61.3: ContextSampler.sample/rm_eval_doc and FirstNSampler.sample; static equality exclusion and duplicate-resampling control flow. Not executed; no semantic deduplication claim. |
| R61.10 | repository | MultiChoiceRegexFilter | EleutherAI | pinned source / 2026 | https://raw.githubusercontent.com/EleutherAI/lm-evaluation-harness/ddd67220430a2470529f25fd5c05a576ca1057a0/lm_eval/filters/extraction.py | https://github.com/EleutherAI/lm-evaluation-harness | official documentation | 2026-10-25 | First public: 2026-08-31. Inspected: ddd67220430a2470529f25fd5c05a576ca1057a0. 61.3: apply, escaped longest-first fallback branches and explicit invalid fallback. Static source only; not all configurations tested. |
| R61.11 | repository | Metric aggregation and uncertainty dispatch | EleutherAI | pinned source / 2026 | https://raw.githubusercontent.com/EleutherAI/lm-evaluation-harness/ddd67220430a2470529f25fd5c05a576ca1057a0/lm_eval/api/metrics.py | https://github.com/EleutherAI/lm-evaluation-harness | official documentation | 2026-10-25 | First public: 2026-08-31. Inspected: ddd67220430a2470529f25fd5c05a576ca1057a0. 61.6: mean, bootstrap_stderr and stderr_for_metric. Static inspection does not certify cluster-valid uncertainty or local package compatibility. |

## Revision and eligibility audit

[DERIVED] The arXiv identifier alone is not a first-release date. Brittlebench, arXiv:2603.13285, was inspected during discovery, but its metadata/full-text header give first release 2026-02-27; it is excluded from newly introduced research and numerical findings. The October perturber paper cites it, but that does not move the older work into the allowed window. The contamination audit has a September-looking identifier but an explicit 2026-07-05 first release; the ledger follows the inspected source metadata rather than inferring the month from the identifier.

[DERIVED] The plan names historical benchmark families and HELM as retrieval/context anchors. Their older papers are not represented as newly released research. The current, dated harness release supplies release-specific implementation corrections; it does not make every old methodological statement in a task README new evidence. Family teaching is an original conditional analysis of the response and validator contract, with canonical experimental foundations linked to Chapter 6.

## Source-local scientific limits

[DERIVED] MMLU factors depend on a selected, related checkpoint population and imperfect domain partition. Budget studies change completion opportunity and may condition on selected completed cases; a zero sampling temperature does not certify deterministic kernels or hosted routing. A corrected paraphrase gap needs counterfactual wording-effect assumptions for causal contamination attribution. A high global ranking correlation does not certify near-ties or absolute acceptance. Expert-schema results come from a small social-work setting and include disagreement between style proxies and expert ratings. Perturbation interface parity is distinct from semantic preservation and deployment robustness.

[UNVERIFIED] No code repository was cloned or executed for this chapter, and no new data, model, provider endpoint or human study was run. The implementation entries are pinned static source/documentation inspections and remain OFFICIAL-DOCUMENTATION, not CODE-VERIFIED or EMPIRICALLY-OBSERVED. Exact local hardware, kernels, package compatibility, energy, monetary cost and production failure distributions remain unestablished. Proposed protocols are in verification.md and are unexecuted.
