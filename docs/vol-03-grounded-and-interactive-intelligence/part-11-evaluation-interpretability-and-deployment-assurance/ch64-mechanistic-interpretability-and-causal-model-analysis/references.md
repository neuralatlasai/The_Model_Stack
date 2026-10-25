---
id: ms.references.64
entity_type: references
title: "Chapter 64 references"
volume: 3
part: 11
chapter: 64
section: null
slug: references
parent: ms.chapter.64
prev_sibling: ms.verification.64
next_sibling: null
children: []
prerequisites:
  [
    ms.chapter.2,
    ms.chapter.5,
    ms.chapter.13,
    ms.chapter.14,
    ms.chapter.15,
    ms.chapter.16,
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.32,
    ms.chapter.61,
    ms.chapter.62,
  ]
downstream: [ms.chapter.65, ms.chapter.66]
related: [ms.chapter.40, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [evaluation, assurance],
    mechanism:
      [causal_intervention, representation_analysis, feature_decomposition],
    feedback_setting: [],
    modality: [text],
  }
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        CODE-VERIFIED,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2200
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 64 references

[DERIVED] Accessed means actual inspection on 2026-10-25. Eligibility uses first public evidence in 2026-03-01 through 2026-10-24, not a conference year, revision or access date. Official code claims below are static inspection at the stated SHA; no package was installed and no GPU result was reproduced.

| Key    | Type               | Work                                                                                                            | Authors / organisation                                                              | Venue / year                                                     | Primary URL                                                                                               | Official code                                               | Status                 | Accessed   | Used for                                                                                                                                                                   |
| ------ | ------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R64.1  | paper              | How Do Linear Probes Emerge? A Circuit-Tracing Framework with Concept-Targeted Attribution                      | Vedant Palit; Florent Draye; Terry Jingchen Zhang; Bernhard Schoelkopf; Zhijing Jin | EMNLP 2026 accepted, as recorded by arXiv; inspected preprint v1 | https://arxiv.org/abs/2608.27510                                                                          | https://github.com/vedantpalit/concept-targeted-attribution | preprint               | 2026-10-25 | §§3-5, Table 1, Appendices A-B, D-E; DIM versus corrected evaluation directions, ablation and graph-prediction protocol                                                    |
| R64.2  | paper              | CLT-Forge: A Scalable Library for Cross-Layer Transcoders and Attribution Graphs                                | Florent Draye et al.                                                                | arXiv / 2026                                                     | https://arxiv.org/abs/2603.21014                                                                          | https://github.com/LLM-Interp/CLT-Forge                     | preprint               | 2026-10-25 | v2 §§2-5, Appendices B-D; gate, cross-layer decoding, loss, distributed/cache design, parameter-count discrepancy and disclosed training configurations                    |
| R64.3  | repository         | CLT-Forge pinned implementation                                                                                 | LLM-Interp / originating authors                                                    | official repository / 2026                                       | https://github.com/LLM-Interp/CLT-Forge/tree/c92d83d199899ac88f636310cd90e5c5173c379e                     | https://github.com/LLM-Interp/CLT-Forge                     | official documentation | 2026-10-25 | CLT.**init**, encode, loss, _sparse_decode_gather_cross_layer; attribution module; Llama runner config; pyproject; static only                                             |
| R64.4  | paper              | When Attribution Patching Lies: Diagnosis and a Second-Order Correction                                         | Luyang Zhang; Jialu Wang                                                            | arXiv / 2026                                                     | https://arxiv.org/abs/2606.09899                                                                          | null                                                        | preprint               | 2026-10-25 | v1 §§3.1-3.3 smoothness and HVP, §4 protocols, Table 3, Appendices E.6/E.8 negative joint-circuit results; no pinned code established                                      |
| R64.5  | paper              | Descriptive Collision in Sparse Autoencoder Auto-Interpretability: When One Explanation Describes Many Features | Jordan F. McCann                                                                    | arXiv / 2026                                                     | https://arxiv.org/abs/2605.12874                                                                          | null                                                        | preprint               | 2026-10-25 | v1 §§3-6; label-cluster entropy, strong identical-activation condition of Proposition 1, released-label reanalysis and unexecuted discrimination proposal                  |
| R64.6  | technical report   | Natural Language Autoencoders Produce Unsupervised Explanations of LLM Activations                              | Kit Fraser-Taliente et al.; Anthropic                                               | Transformer Circuits / 2026                                      | https://transformer-circuits.pub/2026/nla/index.html                                                      | https://github.com/kitft/natural_language_autoencoders      | archived               | 2026-10-25 | May 7 report, Architecture/Initialization/Training, behavioral tests, Confabulations, Discussion/Limitations; full HTML inspected locally after web size limit             |
| R64.7  | repository         | Natural Language Autoencoders pinned implementation                                                             | kitft / originating authors                                                         | official repository / 2026                                       | https://github.com/kitft/natural_language_autoencoders/tree/0577769b55ad4fdd96d159e983361b97fa4e7331      | https://github.com/kitft/natural_language_autoencoders      | official documentation | 2026-10-25 | README; nla/models.py, loss.py, schema.py, reward.py; configs/rl.sh and TRAINING_NOTES.md; configurable normalization/reward and distributed failure boundary, static only |
| R64.8  | paper              | Understanding Confabulation and Rethinking Reconstruction in Activation Explanations                            | Gert Lek; Zixuan Xia; Pin-Yu Chen; Lydia Y. Chen                                    | arXiv / 2026                                                     | https://arxiv.org/abs/2609.33702                                                                          | null                                                        | preprint               | 2026-10-25 | v1 §§3-5, Eq.2-3, Table 2; Appendices B/E/F/H/I; source-support evaluator, conditional-mean obstruction, Flow-NLA and unreleased-code limitation                           |
| R64.9  | measurement source | Perplexity Can Miss SAE Feature Damage Under Quantization                                                       | Evan Duan                                                                           | arXiv / 2026                                                     | https://arxiv.org/abs/2606.03002                                                                          | null                                                        | preprint               | 2026-10-25 | v2 §§3.1-3.5/3.8 and Table 3; frozen SAE, simulated per-channel RTN weight compression, conditional behavioral/feature disagreement                                        |
| R64.10 | repository         | Concept-Targeted Attribution pinned repository                                                                  | Vedant Palit et al.                                                                 | official repository / 2026                                       | https://github.com/vedantpalit/concept-targeted-attribution/tree/46f69f131c1bf327592efcbf733b4d08a9ce2894 | https://github.com/vedantpalit/concept-targeted-attribution | official documentation | 2026-10-25 | README artifact layout, setup, demo model and unpinned dependencies; no pipeline execution or full implementation audit claimed                                            |

## First release, revision and inspection boundaries

| Key    | First public research/release evidence                                                  | Inspected revision                                      | Precise distinction                                                                     |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| R64.1  | 2026-08-27 arXiv v1                                                                     | v1, 2026-08-27                                          | Accepted EMNLP status is metadata; no final proceedings text claimed inspected          |
| R64.2  | 2026-03-22 arXiv v1                                                                     | v2, 2026-07-21                                          | Revised author list/method text is not the first-release date                           |
| R64.3  | Code availability disclosed by R64.2; repository's first-public timestamp NOT-DISCLOSED | c92d83d199899ac88f636310cd90e5c5173c379e, 2026-07-30    | Commit timestamp pins inspected content, not proof of repository publication time       |
| R64.4  | 2026-06-05 arXiv v1                                                                     | v1, same date                                           | Runtime/code compatibility UNVERIFIED                                                   |
| R64.5  | 2026-05-13 arXiv v1                                                                     | v1, same date                                           | Manuscript internal May 11 date is not substituted for public release                   |
| R64.6  | 2026-05-07 dated first-party report                                                     | May 7 report as served 2026-10-25, unpinned web surface | Local HTML capture records actual inspected content; no later revision history inferred |
| R64.7  | Code route disclosed with May 7 report; first-public repository timestamp NOT-DISCLOSED | 0577769b55ad4fdd96d159e983361b97fa4e7331, 2026-08-02    | Defaults can differ from the initial report; commit is not a release/benchmark          |
| R64.8  | 2026-09-27 arXiv v1                                                                     | v1, same date                                           | Code/data promised upon acceptance; no executable release verified                      |
| R64.9  | 2026-06-02 arXiv v1                                                                     | v2, 2026-06-04                                          | v1 title differs; v2 title used; frozen-readout study is not packed-kernel evidence     |
| R64.10 | Code linked by 2026-08-27 paper; first-public repository timestamp NOT-DISCLOSED        | 46f69f131c1bf327592efcbf733b4d08a9ce2894, 2026-08-23    | Earlier commit timestamp does not establish public availability before the paper        |

## Source-specific reconciliation and unresolved details

[CODE-VERIFIED] Static inspection of the CLT-Forge repository at commit c92d83d199899ac88f636310cd90e5c5173c379e found the following. R64.3 allocations use encoder [L,d,K], decoder [Q,K,d], Q=L(L+1)/2 including the diagonal, encoder bias [L,K], log threshold [L,K], decoder bias [Q,d]. Its total matrix count differs from R64.2 Appendix B Eq.5 by LKd. Sparse gather expands codes to [n,Q,K_local], then gathers decoder rows and index-adds by target layer. The FP32 reconstruction reduction is coordinate sum / token mean / layer sum. Config and paper batch fields differ as documented in 64.3; no exact-run equivalence claimed.

[CODE-VERIFIED] Static inspection of the NLA repository at commit 0577769b55ad4fdd96d159e983361b97fa4e7331 found the following. R64.7's default reward is negative per-coordinate MSE after configurable norm scaling; log mode is opt-in and clamps at 1e-8. Default sqrt(d) norm scaling makes that MSE equal the unit-direction squared distance for nonzero vectors. The report's log reward and the pinned code's default are kept distinct; zero vectors and explicit null normalization require separate semantics. Environment compatibility, weights, training and reported timings remain UNVERIFIED.

[DERIVED] R64.1 §3.2's orthogonalization wording is not reconciled with Appendix A.2's raw-DIM-attribution/evaluation-correction distinction by an executed run. Postprocessing orthogonality is not independent evidence of an original semantic geometry. Its dataset contrasts do not logically eliminate every style/provenance confound.

[DERIVED] R64.5's identical-explanation proposition requires identical binary activations as well. Its source count prose does not reconcile to the 722-feature table, so the chapter does not promote its aggregate collision percentage to an independently audited population fact. The discrimination method is a proposal, not an executed new judge study.

[DERIVED] R64.4's exact references are finite patch effects under its own score/corruption protocol; the curvature theorem requires smoothness on the complete segment. Appendix E.8 provides joint-circuit regressions that prevent universal improvement claims. A source's estimated path constant is not a certified Lipschitz bound.

[PAPER-REPORTED] R64.9 uses Pythia blocks.4.hook_resid_post and Gemma layer 12 residual width 16,384, 200k/500k token readouts respectively, with FP16-active feature rate >0.001 and survival correlation >0.9. Gemma chunk context is 256; the supplementary sliding context is 2,048 with stride 512. It simulates weight quantization by dequantizing tensors, rather than timing an actual packed low-bit kernel. These boundaries constrain the single numerical comparison retained in 64.6.

## Screened but not introduced as current evidence

| Candidate                                                                | Evidence-screen outcome                                                                                            | Manuscript consequence                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Circuit Tracing / P52 (2025)                                             | Plan anchor predates 2026-03-01                                                                                    | Retrieval context only; new mechanism evidence uses eligible successors |
| Certified Circuits, arXiv:2602.22968                                     | First arXiv 2026-02-26, before window                                                                              | Excluded despite later revision/conference                              |
| Mechanistic Interpretability as Statistical Estimation, arXiv:2510.00845 | First arXiv 2025-10-01                                                                                             | Excluded despite 2026 venue                                             |
| Tracking Equivalent Mechanistic Interpretations, arXiv:2603.30002        | Earlier anonymous OpenReview version found; exact first-public history unresolved because forum/API challenged/403 | Excluded; no first-date claim inferred from March arXiv upload          |

[DERIVED] No evidence is inferred from discovery summaries. All source-derived claims are original paraphrases with local locators; mathematical counterexamples and calculators are conditional book derivations. The ledger is a bounded record of inspected sources, not proof that no later eligible alternative exists.
