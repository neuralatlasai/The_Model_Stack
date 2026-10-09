---
id: "ms.references.32"
entity_type: "references"
title: "Chapter 32 references"
short_title: "Chapter 32 references"
volume: 2
part: 6
chapter: 32
section: null
slug: "references"
parent: "ms.chapter.32"
prev_sibling: "ms.verification.32"
next_sibling: null
children: []
prerequisites: ["ms.chapter.2", "ms.chapter.6", "ms.chapter.11", "ms.chapter.31"]
downstream: ["ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.38", "ms.chapter.62", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "evaluation", "assurance"], "mechanism": ["preference_modeling", "reward_modeling", "verification", "oversight"], "feedback_setting": ["human_preference", "ai_feedback", "verifiable_reward", "learned_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1600
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# Chapter 32 references

[DERIVED] Admission requires an original publication or newly released artifact between **2025-12-01 and 2026-10-09 inclusive**. All 13 canonical primary artifacts below first appeared in 2026: **13/13 = 100%**. A revised preprint, proceedings placement, web update or access date cannot make an older work eligible. Academic originating preprints use the reference stack's #1 arXiv discovery route; Anthropic and OpenAI reports use the originating top-ten lab route. Retrieval routes support discovery, not the papers' scientific conclusions.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R32.1 | paper | IRPM: Intergroup Relative Preference Modeling for Pointwise Generative Reward Models | Haonan Song et al. | arXiv preprint / 2026 | https://arxiv.org/abs/2601.00677 | NOT-DISCLOSED in this ledger; implementation not executed | preprint | 2026-10-09 | §§32.1,32.3; v2 §3.1–3.4, §4.1/4.3, Figure 3, Appendix B |
| R32.2 | paper | Beyond Binary Preferences: A Principled Framework for Reward Modeling with Ordinal Feedback | Amirhossein Afsharrad, Ruida Zhou, Luca Viano, Sanjay Lall, Mohammad Ghavamzadeh | arXiv preprint / 2026 | https://arxiv.org/abs/2603.02232 | Release promise is not an inspected commit | preprint | 2026-10-09 | §32.2; §3, Appendix F and H.3, Tables 3–5; Appendix A is a proposed DPO extension |
| R32.3 | paper | RewardUQ: A Unified Framework for Uncertainty-Aware Reward Models | Daniel Yang et al. | arXiv preprint / 2026 | https://arxiv.org/abs/2602.24040 | https://github.com/lasgroup/rewarduq (linked; no execution/commit verification) | preprint | 2026-10-09 | §32.3; §3 metrics, §4 estimators, §5/Figures 2/5, Appendix B/Table 1 |
| R32.4 | paper | Verifiable Process Rewards for Agentic Reasoning | Huining Yuan et al. | arXiv preprint / 2026 | https://arxiv.org/abs/2605.10325 | Repository reproduction UNVERIFIED | preprint | 2026-10-09 | §§32.1,32.4; §2 oracles, §3/Tables 1–3, Appendices F–G |
| R32.5 | paper | FormalRewardBench: A Benchmark for Formal Theorem Proving Reward Models | Zeynel A. Uluşan, Burak S. Akbudak, Can S. Erer, Gözde Gül Şahin | arXiv preprint / 2026 | https://arxiv.org/abs/2605.10141 | Strategy-specific implementation UNVERIFIED | preprint | 2026-10-09 | §32.4; §3.1–3.2/Figure 2, §4/Table 1, Appendices A–D |
| R32.6 | technical report | Automated Weak-to-Strong Researcher | Jiaxin Wen, Liang Qiu, Joe Benton, Jan Hendrik Kirchner, Jan Leike / Anthropic | Alignment Science technical report / 2026 | https://alignment.anthropic.com/2026/automated-w2s-researcher/ | Official announcement links code/data; no commit executed | preprint | 2026-10-09 | §32.5; §1, §3.4–3.5, §4 methods/cases and transfer limitations |
| R32.7 | documentation | Claude's Constitution, January 2026 dated artifact | Anthropic; Amanda Askell and Joe Carlsmith lead authors, with contributors | Dated normative document / 2026 | https://www-cdn.anthropic.com/cffd979fd050fbc0d8874b8c58b24cc10554e208/claudes-constitution_webPDF_26-01.26a.pdf | Not applicable | official documentation | 2026-10-09 | §32.5; dated PDF pp.1–8, preface/overview and normative priorities; no empirical adherence claim |
| R32.8 | technical report | Training a Misaligned Reward Seeker | Richard Qi, Benjamin Wright, Monte MacDiarmid, Evan Hubinger / Anthropic | Alignment Science technical report / 2026 | https://alignment.anthropic.com/2026/reward-seeker/ | Frontier-training reproduction unavailable in inspected report | preprint | 2026-10-09 | §32.6; Summary of Results, Figures 1–2, simulated-cyber protocol and limits |
| R32.9 | technical report | Automated Researchers Can Mitigate Well-Characterized Alignment Failures | Chen Yueh-Han, Jiaxin Wen, Jan Hendrik Kirchner / Anthropic | Alignment Science technical report / 2026 | https://alignment.anthropic.com/2026/automated-alignment-researchers/ | Inspection/execution of exact released commit UNVERIFIED | preprint | 2026-10-09 | §32.5; §§2–5, Appendix B.4–B.5 and G: budgets, hidden evaluation and integrity review |
| R32.10 | documentation | Reasoning models struggle to control their chains of thought, and that's good | OpenAI | First-party benchmark disclosure / 2026 | https://openai.com/index/reasoning-models-chain-of-thought-controllability/ | Benchmark link observed; implementation not executed | official documentation | 2026-10-09 | §32.6; CoT-Control construction, evaluated model count, adversarial controls and proxy limitations |
| R32.11 | documentation | Open Sourcing Monitorability Evaluations | Melody Y. Guan et al. / OpenAI | Newly released evaluation artifact and method update / 2026 | https://alignment.openai.com/monitorability-evals/ | https://github.com/openai/monitorability-evals (linked; not executed) | official documentation | 2026-10-09 | §32.5; release scope and new cross-fit filtering discussion; not redating the original study |
| R32.12 | paper | Transitivity Meets Cyclicity: Explicit Preference Decomposition for Dynamic Large Language Model Alignment | Yucong Huang, Xiucheng Li, Kaiqi Zhao, Jing Li | arXiv preprint / 2026 | https://arxiv.org/abs/2605.17342 | https://github.com/lab-klc/Hybrid-Reward-Cyclic (linked; not executed) | preprint | 2026-10-09 | §32.2; §4.1–4.2/source theorems numbered 4.5–4.6, §6, Appendix B and C.3 |
| R32.13 | paper | Share the Judge, Learn the Deferral: Where Specialization Helps LLM Evaluation | Weining Zhang | arXiv preprint / 2026 | https://arxiv.org/abs/2607.27984 | Exact implementation pin UNVERIFIED | preprint | 2026-10-09 | §32.5; §§3–6, Appendix A: split roles, routing risk, adaptive-threshold caveat and audit |

## Original dates, inspected surfaces and eligibility

| Key | Original publication/release | Inspected version/surface | Date authority and boundary |
|---|---|---|---|
| [R32.1] | 2026-01-02 | [arXiv v2 HTML](https://arxiv.org/html/2601.00677v2), revision 2026-01-30 | Submission history; v1 had IRPO title, v2 has IRPM; revision is not the original date |
| [R32.2] | 2026-02-13 | [arXiv v1 HTML](https://arxiv.org/html/2603.02232v1) | Submission history explicitly says February 13 despite the 2603 identifier; preserve the record rather than infer date from ID |
| [R32.3] | 2026-02-27 | [arXiv v1 HTML](https://arxiv.org/html/2602.24040v1) | Original v1 submission history |
| [R32.4] | 2026-05-11 | [arXiv v1 HTML](https://arxiv.org/html/2605.10325v1) | Original v1 submission history |
| [R32.5] | 2026-05-11 | [arXiv v1 HTML](https://arxiv.org/html/2605.10141v1) | Original v1 submission history |
| [R32.6] | 2026-04-14 | Full originating web report, unpinned web surface | [Dated official announcement](https://www.anthropic.com/news/automated-alignment-researchers) links this report; date is not inferred from access |
| [R32.7] | 2026-01-21 | Dated PDF, 84 pages; current constitution web page used only as artifact context | PDF first page supplies date; this is the January 2026 artifact, not an updated date on the 2023 announcement |
| [R32.8] | 2026-08; exact day NOT-DISCLOSED | Full originating August 2026 web report, unpinned web surface | Author/date block gives month/year; every possible day in that month satisfies this chapter's interval |
| [R32.9] | 2026-08-28 | Full originating web report, unpinned web surface | [Dated official research announcement](https://www.anthropic.com/research/automated-researchers-mitigate-alignment-failures) links the report |
| [R32.10] | 2026-03-05 | Full first-party article, unpinned web surface | Dated article header; linked full paper not used for facts beyond the inspected article |
| [R32.11] | 2026-04-23 | Full first-party release/update, unpinned web surface | Dated artifact release; only newly released evaluation scope and cross-fit update are admitted |
| [R32.12] | 2026-05-17 | [arXiv v1 HTML](https://arxiv.org/html/2605.17342v1) | Original v1 submission history; ICML keyword alone is not acceptance evidence |
| [R32.13] | 2026-07-30 | [arXiv v1 HTML](https://arxiv.org/html/2607.27984v1) | Original v1 submission history |

[DERIVED] All access dates above are the actual inspection date, **2026-10-09**. Repository links identify author-linked artifacts only. No repository entry here has CODE-VERIFIED status, no package version compatibility is inferred, and no training/evaluation code was executed. Primary text inspection supports reported mechanisms and protocols; it does not reproduce experimental results.

## Claim-local inspection ledger

- **R32.1:** §3.1–3.4 and Figure 3 establish the sampled pointwise reward construction and tested variants; Appendix B.1 supplies its training recipe. The chapter's typed-source schema and expectation/independence deductions are original reconstructions. Cross-group pair reuse is not counted as independent observations. Exact dependency pins and independent rerun remain UNVERIFIED.
- **R32.2:** §3 and Appendices F/H.3 distinguish ordered likelihood, regularization, joint fitting and post-hoc thresholds. Tables 3/5 supply the 448-example test comparison; do not combine the best MAE baseline with the best exact-accuracy baseline as though they were one system. Appendix A's DPO direction is proposed, not experimentally established. General Appendix F and H.3 have different epoch scopes; the cited joint/post-hoc experiment uses H.3's five epochs.
- **R32.3:** §4 separates shared heads, adapters, inference dropout and a linear posterior approximation. §4.4 omits curvature weights for incremental practicality; the chapter's curvature-weighted matrix is an explanatory contrast, not the source's implemented posterior. Appendix B supplies model/dataset/preprocessing/optimizer sizes; §5/Figures 2/5 delimit its no-universal-winner result. Seeds and exact dependency pins remain gaps.
- **R32.4:** §2 distinguishes search, consistency and posterior-belief oracles. Appendix F uses cross-initial-state trajectory normalization, with a fewer-than-four-active fallback to global moments; the text is preserved explicitly. Table 1's uncertainty is over repeated evaluations, not independently trained seeds. Structured-oracle performance is not open-ended correctness evidence.
- **R32.5:** §3.1.1 and Figure 2 conflict in their description of which corrupted strategies receive Lean validation: S3 is a Python-answer strategy explicitly exempted while S1–S4 are also described collectively. The chapter retains the contradiction. Table 1's pointwise and both-order pairwise outcomes answer different questions. No uninspected implementation repair is attributed to the paper.
- **R32.6:** §1 permits unlimited remote score submissions; §5 reports iterative seed selection and label extraction and explicitly treats the chat test as adaptive validation with an OOD split. §3.4–3.5 and §4 describe selected methods and transfer with hyperparameter tuning allowed. The chapter uses this as a bounded weak-to-strong study, not untouched final-test evidence or a general theorem. Production-scale improvement is within the stated noise floor. Proposed book odds equations identify their own prior/channel premises.
- **R32.7:** Preface and overview state normative goals and acknowledge imperfect adherence. The PDF is evidence of the criteria, not evidence that a model reliably implements them or that a particular training objective is causally responsible.
- **R32.8:** The inspected setup and simulated evaluations delimit a deliberately pessimistic model-organism intervention. No simulated tool action is described as executed in the real world. Missing training optimizer/seed details remain NOT-DISCLOSED; observed conditional behavior is not converted into a deployed-model prevalence estimate.
- **R32.9:** §§2–5 and Appendix B delimit proposal budgets and non-iterating human comparison. Appendix G informs the distinction between monitoring and actual held-out access isolation. The manuscript does not infer that aggregate-score APIs cannot leak information adaptively or that a benchmark mitigation persists under arbitrary future RL.
- **R32.10:** Article benchmark construction and limitations support only the reported instruction-control proxy and its caveat. No probability of deliberate monitor evasion is inferred.
- **R32.11:** The new filtering discussion distinguishes eligibility selection from estimation. It is a 2026 release/update, not a claim that the original monitorability study began in 2026. Restricted evaluation data are outside the released scope.
- **R32.12:** source theorems numbered 4.5–4.6 and Appendix B condition the decomposition; §4.1 explicitly adds isotropic-distribution reasoning to unit normalization. Unit norm by itself does not imply zero mean. §6/C.3 supports representation comparisons, not universal preference geometry.
- **R32.13:** §§4.3–5 distinguish fitting, calibration and final risk audit, the non-tie routing subset and adaptive threshold search. A fixed-rule confidence bound does not certify an adaptively selected rule on reused audit labels. Compute proxies are not converted to wall-clock time or energy.

## Exclusions and evidence gaps

[DERIVED] Plan anchors *Constitutional AI* (arXiv:2212.08073) and *Let's Verify Step by Step* (arXiv:2305.20050) are outside the user's date window and are **not canonical evidence in this chapter**. Their concepts are developed through explicit local derivations and eligible 2026 artifacts. Likewise, a November 2025 reward-hacking report, earlier chain-of-thought monitor reports and October 2025 Petri publication are excluded. A 2026 paper may evaluate an older model or dataset without turning its original publication into an eligible source.

The December 2025 original monitorability study lies inside the broad interval but is not included in this chapter's canonical denominator; the April 2026 newly released artifact is admitted solely for its own new release/update claims. Its release cannot redate the original study. No older source was admitted on the basis of proceedings, revisions or access dates.

[UNVERIFIED] Scientific gaps requiring independent review include exact released commits, independent training/evaluation, source omitted seeds, external validity under newly optimized distributions and the strategy-specific implementation behind the FormalRewardBench wording conflict. [NOT-DISCLOSED] Reward-seeker's precise August release day and frontier training recipe cannot be reconstructed from the inspected setup. These gaps restrict claims; they are not filled by assumed facts.
