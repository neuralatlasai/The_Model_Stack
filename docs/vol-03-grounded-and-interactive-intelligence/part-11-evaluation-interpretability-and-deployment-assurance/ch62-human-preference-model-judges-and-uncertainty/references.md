---
id: ms.references.62
entity_type: references
title: "Chapter 62 — References"
volume: 3
part: 11
chapter: 62
section: null
slug: references
parent: ms.chapter.62
prev_sibling: ms.verification.62
next_sibling: null
children: []
prerequisites: [ms.chapter.6, ms.chapter.61]
downstream: [ms.chapter.63, ms.chapter.66]
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

# Chapter 62 references

[DERIVED] **Accessed 2026-10-25.** Retained new papers have first public release within 2026-03-01–2026-10-24. First release, inspected revision and actual access are separate. Only the named methods/results/appendices and pinned code functions were inspected; no full-bibliography audit, inference run, human study, package installation or replication is claimed.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R62.1 | paper | Blending Human and LLM Expertise to Detect Hallucinations and Omissions in Mental Health Chatbot Responses | Khizar Hussain; Bradley A. Malin; Zhijun Yin; Susannah Leigh Rose; Murat Kantarcioglu | arXiv / 2026 | https://arxiv.org/html/2604.06216v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-03-17. Inspected: v1, 2026-03-17. 62.1: §§3–3.1, Table 1 and §5 context. Three-stakeholder consensus and performance-filtered human baseline. No clinical deployment authorization or unbiased expertise ranking inferred. |
| R62.2 | paper | OSCAR: Order-aware Sensitivity Correction for AI Rankings | You Liu; Yue Liu; Quanchao Lu; Ergan Shang; Nick Shipilov | arXiv / 2026 | https://arxiv.org/html/2609.24128v2 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-09-21. Inspected: v2, 2026-10-13. 62.2/62.4: §§3–7, Table 1; Appendices B–F. Mean/target, gauge, tie-half quasi-likelihood, local attenuation, prompt-cluster inference and identified prediction limits. v1 initially inspected then superseded. |
| R62.3 | paper | RankJudge: A Multi-Turn LLM-as-a-Judge Synthetic Benchmark Generator | Zhenwei Tang; Zhaoyan Liu; Rasa Hosseinzadeh; Tongzi Wu; Keyvan Golestan; Jesse C. Cresswell | arXiv / 2026 | https://arxiv.org/html/2605.21748v1 | https://github.com/layer6ai-labs/RankJudge | preprint | 2026-10-25 | First public: 2026-05-20. Inspected: v1, 2026-05-20. 62.3: §3 joint grade and construction/curation, Appendix C human audit; Appendix B reproducibility checked. Single intended flaw is validated, not assumed realized; judge-set-aware filtering changes support. |
| R62.4 | paper | Reliability without Validity: A Systematic, Large-Scale Evaluation of LLM-as-a-Judge Models Across Agreement, Consistency, and Bias | Justin D. Norman; Michael U. Rivera; D. Alex Hughes | arXiv / 2026 | https://arxiv.org/html/2606.19544v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-06-17. Inspected: v1, 2026-06-17. 62.6: §§2–5, Table 2, Appendices D–F. Three protocols and label conventions inspected. Raw agreement minus kappa is not independently counted factual error; displayed/canonical label mapping requires reproduction. |
| R62.5 | paper | Self- and Other-Labels Induce Bidirectional Bias in LLM Judges | Songeun Chae; Min Kim; Donghoon Jung; Seojin Choi; Seohyon Jung | arXiv / 2026 | https://arxiv.org/pdf/2608.18091v3 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-06-06. Inspected: v3, 2026-10-16. 62.4: §§3–4, Tables 1–5, Appendices C/H. Narrative selection, blind-rating matching and label/source intervention. Matching is not objective-quality ground truth; narrow task and model set. HTML body unavailable, so v3 PDF inspected. |
| R62.6 | paper | Uncertainty-Aware Abstention in Large Language Models with Provable Alignment Guarantees | Sijin Dong; Hiroyuki Shinnou | arXiv / 2026 | https://arxiv.org/html/2607.04430v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-07-05. Inspected: v1, 2026-07-05. 62.5: §3.4 source theorem IDs 3.2 and 3.3 proof; Algorithm 1/§3.5 practical variant; §4 Tables 1–4, proxy correctness. Exchangeability label versus i.i.d. proof; fixed-grid versus empirical scan; certification failure versus impossibility. |
| R62.7 | paper | How Reliable Is Your Jailbreak Judge? Calibration and Adversarial Robustness of Automated ASR Scoring | Yang Gao; Veyon Solutions | arXiv / 2026 | https://arxiv.org/html/2606.25487v2 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-06-24. Inspected: v2, 2026-06-25. 62.4: §§3–4, Tables 1–2 and two-annotator audit. Conditional true-positive flip denominator, T4/4-bit boundary. No whole-population or closed-frontier robustness extrapolation; source precision-only correction is not total-prevalence recovery. |
| R62.8 | repository | RankJudge match runner | Layer 6 AI | pinned source / 2026 | https://raw.githubusercontent.com/layer6ai-labs/RankJudge/1e2260c8f4564b81179a8632d651876e16daa5d2/code/matches.py | https://github.com/layer6ai-labs/RankJudge/commit/1e2260c8f4564b81179a8632d651876e16daa5d2 | official documentation | 2026-10-25 | Eligible research release 2026-05-20; inspected commit dated 2026-06-17 by official commit metadata, separate repository first-visibility date not established. 62.3: build_judge_prompt, run_match, load_state. Conditional joint-field checks and returned-attempt usage; no execution. |
| R62.9 | repository | RankJudge metrics/filtering | Layer 6 AI | pinned source / 2026 | https://raw.githubusercontent.com/layer6ai-labs/RankJudge/1e2260c8f4564b81179a8632d651876e16daa5d2/code/metrics.py | https://github.com/layer6ai-labs/RankJudge | official documentation | 2026-10-25 | Same eligible report/dated commit as R62.8. 62.3: _filter_trivial_pairs, _select_top_pids, _compute_all; configured-roster and filtered-support limits. Static inspection only. |

## Revision and eligibility audit

[DERIVED] OSCAR was first retrieved as v1; its v2 changes the inspected current formulation and is retained throughout. The authorship study uses current v3 PDF because the v3 HTML exposed only its outline. The jailbreak-judge study uses v2 after metadata showed a June 25 revision. The three arXiv identifiers with month-looking prefixes do not replace explicit source first-release metadata.

[DERIVED] Pre-window Chatbot Arena and other historical foundations in the plan are retrieval/context leads; their papers are not newly introduced 2026 evidence. Bradley–Terry, tied comparisons, chance-corrected agreement and proper-score identities are reconstructed here as conditional mathematical mechanisms with the required domains, not claimed as new inventions. The dated RankJudge commit is release-specific static evidence attached to an eligible current paper, with first-public-visibility uncertainty stated rather than invented.

## Scientific qualification record

[DERIVED] Human-domain results condition on assignment and F1-based rater retention. OSCAR adjusted scores require identification and its zeroed-nuisance average-sensitivity target is not a natural-population preference by definition. RankJudge intended labels require validation and roster-dependent filtering changes the task set. Raw agreement/kappa differences describe different summaries, not a direct factual-error correction. Authorship effects are shown on structured narrative selections matched by prior judge ratings. Adversarial flips condition on each judge’s initial true positives and finite attack set.

[DERIVED] CIC names exchangeability while its binomial proof uses independence; empirical-grid/fixed-sequence implementation remarks differ from the fixed-grid union-bound theorem. This chapter supplies a stronger sufficient i.i.d. construction, an explicit dependent counterexample and a distinction between failure to certify and unsafe behavior. Its TriviaQA sentence-similarity predicate is not silently treated as factual truth. These qualifications are independent scientific analysis, not source-reported book experiments.

[UNVERIFIED] No code, judge, uncertainty estimator, calibration procedure or human study was executed. Static source inspection does not establish runtime compatibility or result reproduction. Exact local device cost, deployment population, private provider internals and untested domain/attack behavior remain unknown. All protocols in verification.md are unexecuted.
