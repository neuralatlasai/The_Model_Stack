---
id: ms.references.66
entity_type: references
title: "Chapter 66 — References"
volume: 3
part: 11
chapter: 66
section: null
slug: references
parent: ms.chapter.66
prev_sibling: ms.verification.66
next_sibling: null
children: []
prerequisites: [ms.chapter.6, ms.chapter.30, ms.chapter.47, ms.chapter.48, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
downstream: []
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

# Chapter 66 references

[DERIVED] **Accessed 2026-10-25.** Retained new papers first appeared within 2026-03-01–2026-10-24. Publication/revision/access dates remain separate. Only the named full-text methods/results/appendices and two pinned code surfaces were inspected; no full bibliography, package/model/environment execution or research replication is claimed.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R66.1 | paper | Reproducibility Beyond Artifacts: Interactional Support for Collaborative Machine Learning | Zhiwei Li; Carl Kesselman | CHI EA / 2026 | https://arxiv.org/html/2604.06414v2 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-04-07. Inspected: v2, 2026-04-10; §§2–5, Table 1. Situated embedded observation, not population prevalence; prototype longitudinal benefit untested. |
| R66.2 | paper | Modelstamp: Pre-Deserialization Verification of Machine-Learning Artifacts and Runtime Environment State | Anagha Dhekne | arXiv / 2026 | https://arxiv.org/pdf/2609.01781v1 | https://github.com/AnaghaDhekne/modelstamp | preprint | 2026-10-25 | First public: 2026-09-01. Inspected: v1 PDF, 2026-09-01; §§II–VI, Tables IV–V. Drift/projection and trust-boundary tests; no deserializer safety or public authentication inference. HTML unavailable. |
| R66.3 | paper | On the Tightness and Computational Tractability of Higher-Dimensional Confidence Sequences | Fabian Denoodt; Sibylle Hess; Joaquin Vanschoren; Christian A. Naesseth | arXiv / 2026 | https://arxiv.org/html/2610.03727v2 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-08-21. Inspected: v2, 2026-10-08; §§2–6, Appendix F safe numerical construction, §G.6 ratios. Constant conditional mean; volume not a universal equivalence gate. |
| R66.4 | paper | ICAN-Deploy: Identity-Stable Canary Deployment for Safety-Critical Embodied Agents | Xue Qin; Simin Luan; John See; Zeyd Boukhers; Cong Yang; Zhijun Li | arXiv / 2026 | https://arxiv.org/html/2605.28097v1 | Full runtime/artifact not inspected | preprint | 2026-10-25 | First public: 2026-05-27. Inspected: v1, 2026-05-27; §§3–6, Appendices A/B. Hash projection excludes capability versions; MuJoCo/exception scope; no-traffic policy; behavior explicitly not invariant. |
| R66.5 | paper | RECLAIM: Can Agents Reproduce the Claims of Machine Learning Papers? | Mithil Salunkhe; Haochen Ding; Samridhi Verma; Volodymyr Kindratenko | arXiv / 2026 | https://arxiv.org/html/2609.28850v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-09-23. Inspected: v1, 2026-09-23; §§3–6, main-text audit/target methods and Appendices D/F. Fixed targets, artifact tiers, provenance-audited grading and limits of attributing faithful non-matches. |
| R66.6 | paper | More Programs or More Rolls? Separating Coverage from Specialization in LLM Harnesses | Ziyang Xu; Haitian Zhong; Hao Zhou; Hao Qin; Chenhan Jin; Te Qi; Shengze Xu; Tieyong Zeng | arXiv / 2026 | https://arxiv.org/html/2609.35873v1 | Not inspected/executed | preprint | 2026-10-25 | First public: 2026-09-26. Inspected: v1, 2026-09-26; §§3–6, Table 3, Appendices B–E and BIRD trace context. Complete-case selection/post-acquisition diagnostic; zero selector gain does not bound all specialization. |
| R66.7 | paper | Mutation Testing for Reproducibility Safeguards in Machine Learning Research Software: An Empirical Study | Ilya Shulepov | arXiv / 2026 | https://arxiv.org/html/2608.27100v1 | https://doi.org/10.5281/zenodo.22126120 | preprint | 2026-10-25 | First public: 2026-08-27. Inspected: v1, 2026-08-27; §§3/5–8, Tables 2–5, Appendices A–D. Baseline-first/semantic equivalence/bounded restoration; selected workflow sensitivity, not repository irreproducibility. |
| R66.8 | repository | Modelstamp core.py v0.1.4 at 5aa456ae1c9df3f6bd84de8e4e24269c86ef94f5 | Anagha Dhekne | GitHub / 2026 | https://raw.githubusercontent.com/AnaghaDhekne/modelstamp/5aa456ae1c9df3f6bd84de8e4e24269c86ef94f5/src/modelstamp/core.py | https://github.com/AnaghaDhekne/modelstamp | official documentation | 2026-10-25 | Commit authored/committed: 2026-08-25T16:34:52Z. Separate first visibility not established. Static _verify_stream/load/_commit_artifact_pair/_artifact_lock and authentication functions; no runtime. |
| R66.9 | repository | Modelstamp _manifest.py v0.1.4 at 5aa456ae1c9df3f6bd84de8e4e24269c86ef94f5 | Anagha Dhekne | GitHub / 2026 | https://raw.githubusercontent.com/AnaghaDhekne/modelstamp/5aa456ae1c9df3f6bd84de8e4e24269c86ef94f5/src/modelstamp/_manifest.py | https://github.com/AnaghaDhekne/modelstamp | official documentation | 2026-10-25 | Same pinned commit/date as R66.8. Static signing_bytes/from_dict/_diff_environments and compare_to_current. Schema/authentication/projection boundaries only; no runtime. |

## Source boundaries

[DERIVED] The manifest/procedure/utility equations are authored constructions with their displayed premises. Eq. 66.8 is a conservative Hoeffding union-over-time bound, not an implementation of the cited multivariate portfolio method. Eq. 66.18 is a hypothetical decision upper bound, not an empirically calibrated safety posterior.

[DERIVED] Historical HELM, foundational sequential-inference and model-persistence work are handled through the canonical earlier chapters. A later conference year or revision does not reset first public release. Current venue acceptance statements are source-reported unless proceedings were independently inspected. No legal or regulatory compliance conclusion follows from this release dossier.

[DERIVED] Modelstamp tag v0.1.4 was resolved to the full Git commit through the remote; official GitHub commit metadata supplies the recorded authored/committed date. Public visibility time is not independently established. Reading these source files does not establish reproducibility of their package/runtime or the paper experiments.

[UNVERIFIED] All new verification studies are proposals. No numerical manuscript-quality score, production certification, independent reproduction or external deployment is asserted.
