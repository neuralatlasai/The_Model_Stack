---
id: "ms.references.35"
entity_type: "references"
title: "Chapter35 references"
short_title: "Chapter35 references"
volume: 2
part: 6
chapter: 35
section: null
slug: "references"
parent: "ms.chapter.35"
prev_sibling: "ms.verification.35"
next_sibling: null
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34"]
downstream: ["ms.chapter.36", "ms.chapter.38", "ms.chapter.39", "ms.chapter.62", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "evaluation", "assurance"], "mechanism": ["reinforcement_learning", "verification", "policy_optimization"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
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

# Chapter35 — References and evidence ledger

[DERIVED] Admission requires original public release/publication in 2025-12-01 through 2026-10-09 inclusive. Later revision, proceedings, indexing and access dates cannot repair an older original date. The canonical ledger contains11 eligible artifacts, all originally released in 2026; therefore its 2026 share is 100%. Original foundations are reconstructed mathematically with premises and are not described as2026 inventions. Academic authors are not assigned invented top-lab affiliations or conference acceptance.

## Canonical references

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R35.1 | repository | TRL v1.13.0 tagged release and pinned implementation | Hugging Face TRL maintainers | Official release /2026 | https://github.com/huggingface/trl/releases/tag/v1.13.0 | Peeled commit3d9261f1fec9f9a8140099c78a65c7da73dce79c | official documentation | 2026-10-09 | §35.1,35.2,35.4: group mean/sample SD/epsilon; masks; clipping; loss reduction |
| R35.2 | technical report | GLM-5: from Vibe Coding to Agentic Engineering | GLM-5-Team / Z.ai | arXiv /2026 | https://arxiv.org/abs/2602.15763v1 | Training recipe disclosed partly; exact RL implementation pin NOT-DISCLOSED | preprint | 2026-10-09 | §35.3: §3.1–3.2 SFT, mixed reward sources, group and clipping configuration |
| R35.3 | paper | How Fast Should a Model Commit to Supervision? Training Reasoning Models on the Tsallis Loss Continuum | Chu-Cheng Lin; Eugene Ie | arXiv /2026 | https://arxiv.org/abs/2604.25907v1 | Exact executable recipe NOT-DISCLOSED in inspected method | preprint | 2026-10-09 | §35.3: §6–7; Appendix C–D; cold-start likelihood supervision and actual protocol |
| R35.4 | paper | Prompts Live on an Arc: Gaussian Curricula in Fisher–Rao Coordinates for Rollout-Efficient GRPO | Mei Okonkwo; Pixel Nomand; Julian Berg; Elena Voss; Lena Park; Marcus Hale; Adrian Cho; Sofia Reyes | arXiv /2026 | https://arxiv.org/abs/2609.38018v1 | Appendix D algorithm; exact runtime commit UNVERIFIED | preprint | 2026-10-09 | §35.3–35.5: §3–5; Appendix B.2,C,D,E,F; sampling, beliefs, uncertainty and resource comparisons |
| R35.5 | paper | Rethinking Exploration in RLVR: From Entropy Regularization to Refinement via Bidirectional Entropy Modulation | Hengrui Gu; Xiaotian Han; Yujing Bian; Kaixiong Zhou | arXiv v1 /2026 | https://arxiv.org/abs/2604.04894v1 | Appendix D–E implementation/settings; exact commit UNVERIFIED | preprint | 2026-10-09 | §35.4: §2,4; Appendices D–F; AsymGRPO exponents and source-specific comparisons |
| R35.6 | paper | Understanding and Preventing Entropy Collapse in RLVR with On-Policy Entropy Flow Optimization | Huimin Xu; Shuai Zhao; Xiaobao Wu; Anh Tuan Luu | arXiv /2026 | https://arxiv.org/abs/2605.11491v1 | Figure 3 code fragment inspected; no training executed | preprint | 2026-10-09 | §35.4–35.5: §3–6; Appendix A; entropy diagnostic, balancing and protocol inconsistencies |
| R35.7 | paper | What pass@k Cannot Measure: Evaluating Diversity and Capability Retention after Post-Training | Subham Rath; Raj Dandekar; Rajat Dandekar; Sreedath Panat | arXiv /2026 | https://arxiv.org/abs/2610.07405v1 | Exact training commit UNVERIFIED | preprint | 2026-10-09 | §35.5: §2–4; metrics, seeds, hard-slice findings and finite-sampling limits |
| R35.8 | paper | Verifiable Process Rewards for Agentic Reasoning | Huining Yuan; Zelai Xu; Huaijie Wang; Xiangmin Yi; Jiaxuan Gao; Xiao-Ping Zhang; Yu Wang; Chao Yu; Yi Wu | arXiv /2026 | https://arxiv.org/abs/2605.10325v1 | Full source-specific oracle implementation UNVERIFIED | preprint | 2026-10-09 | §35.1: §2–3; Appendices A,C; game oracles and cross-initial-state normalization |
| R35.9 | paper | FormalRewardBench: A Benchmark for Formal Theorem Proving Reward Models | Zeynel A. Uluşan; Burak S. Akbudak; Can S. Erer; Gözde Gül Şahin | arXiv /2026 | https://arxiv.org/abs/2605.10141v1 | Strategy-specific implementation UNVERIFIED | preprint | 2026-10-09 | §35.6: §3.1–3.2, Figure2, §4, Appendices A–D; learned-judge/kernel boundary |
| R35.10 | technical report | Training a Misaligned Reward Seeker | Richard Qi; Benjamin Wright; Monte MacDiarmid; Evan Hubinger / Anthropic | Alignment Science /2026 | https://alignment.anthropic.com/2026/reward-seeker/ | Frontier training reproduction NOT-DISCLOSED | preprint | 2026-10-09 | §35.6: Summary of Results, Figures1–2, simulated-evaluation setup and controls |
| R35.11 | documentation | Reasoning models struggle to control their chains of thought, and that's good | OpenAI | First-party benchmark disclosure /2026 | https://openai.com/index/reasoning-models-chain-of-thought-controllability/ | Linked benchmark not executed | official documentation | 2026-10-09 | §35.6: CoT-Control construction,13-model evaluation and proxy limitations |

## Original dates and inspected versions

| Reference | Original public date | Inspected artifact | Date evidence and distinction |
|---|---|---|---|
| [R35.1] | 2026-09-10 | Tagv1.13.0; peeled commit3d9261f1fec9f9a8140099c78a65c7da73dce79c | GitHub release published2026-09-10T00:50:26Z; annotated tag88f6b5a0002ff18e0a917149a8f235e4cdc2b72c; tag time00:40:15Z |
| [R35.2] | 2026-02-17 | [v1 HTML](https://arxiv.org/html/2602.15763v1) | Original v1 history; later v2 date2026-02-24 is not admission date |
| [R35.3] | 2026-04-28 | [v1 HTML](https://arxiv.org/html/2604.25907v1) | Original v1 history; later v2 date2026-05-07 not used to redate |
| [R35.4] | 2026-09-29 | [v1 HTML](https://arxiv.org/html/2609.38018v1) | Original v1 history |
| [R35.5] | 2026-04-06 | [v1 HTML](https://arxiv.org/html/2604.04894v1) | Original v1 history; current abstract defaults to renamed v2 with an additional author; this chapter cites v1 title/author list |
| [R35.6] | 2026-05-12 | [v1 HTML](https://arxiv.org/html/2605.11491v1) | Original v1 history |
| [R35.7] | 2026-10-05 | [v1 HTML](https://arxiv.org/html/2610.07405v1) | Original v1 history; before the inclusive cutoff |
| [R35.8] | 2026-05-11 | [v1 HTML](https://arxiv.org/html/2605.10325v1) | Original v1 history; later v2 date2026-05-27 not used to redate |
| [R35.9] | 2026-05-11 | [v1 HTML](https://arxiv.org/html/2605.10141v1) | Original v1 history |
| [R35.10] | 2026-08, day NOT-DISCLOSED | Full originating report and evaluation/limitations sections | Page supplies August2026; every possible day is within the admission window; no exact day inferred |
| [R35.11] | 2026-03-05 | Full first-party disclosure | Dated originating page; linked research is not automatically admitted or treated as inspected |

[DERIVED] Actual access date for every admitted artifact is 2026-10-09. No date is inherited from the plan. The linked v1 artifacts preserve the identity of the methods and results inspected, even where an unversioned abstract now displays a different title or authors.

## Pinned implementation locators

[OFFICIAL-DOCUMENTATION] The inspected release's exact source is retained through immutable commit URLs:

- [GRPO trainer](https://github.com/huggingface/trl/blob/3d9261f1fec9f9a8140099c78a65c7da73dce79c/trl/trainer/grpo_trainer.py): truncated masks2334–2344; grouped rewards/statistics2591–2637; token/KL losses2962–3012; reductions3014–3037.
- [GRPO config](https://github.com/huggingface/trl/blob/3d9261f1fec9f9a8140099c78a65c7da73dce79c/trl/trainer/grpo_config.py): loss_type, scale_rewards, mask_truncated_completions, clipping and beta fields.
- [nanstd helper](https://github.com/huggingface/trl/blob/3d9261f1fec9f9a8140099c78a65c7da73dce79c/trl/trainer/utils.py#L789): finite-count Bessel correction789–820.
- [Versioned documentation](https://huggingface.co/docs/trl/v1.13.0/grpo_trainer): release-specific interface context, not a performance measurement.

[DERIVED] A code-path reading is labeled OFFICIAL-DOCUMENTATION here. No GPU execution, benchmark reproduction or arbitrary distributed configuration is implied by the release pin.

## Inspection boundaries and preserved inconsistencies

[DERIVED] The following notes restrict claims; they are not repairs silently attributed to the papers.

- **R35.2:** §3.1–3.2 supplies the actual supervised/reasoning pipeline and numerical gate. Appendix A's pretraining optimizer must not fill missing RL optimizer fields. Multiple reward sources include model judges; “reasoning RL” does not mean every reward is a formal verifier.
- **R35.3:** §6 and Appendix D expose same-pool ratio estimation and finite-sample bias; §7 uses a gold-answer likelihood channel, exact-match training and substring evaluation. §7.3 Table3 distinguishes GARL peaks preceding validation collapse on HotPotQA/MuSiQue from stable PAFT outcomes; Figure4 and its surrounding text disagree on the exponent0.25 validation peak, so no numerical training curve is reconstructed. Single-seed results and prompted/unprompted comparison changes remain visible. Equal rollout counts do not prove equal total compute. Collapse mechanism remains unresolved.
- **R35.4:** §4/Appendix D define beliefs, target scoring, Gumbel candidate sampling and approximate inclusion correction. Appendix B.2's unbounded iid zero-gradient argument does not automatically cover Appendix E's capped-eight-round procedure. Appendix F's wall-clock values retain the8 H100/BF16/300-update boundary.
- **R35.5:** v1 §4.2's analytical expression is not a complete off-policy correction theorem. Appendix D discusses flipped-curve boundary extensions; a universal main-method zero-group branch is not inferred from it. Appendix E uses MATH500 checkpoint selection, so that metric is not an untouched final test.
- **R35.6:** Eq.6/Appendix A omit cross-action terms relative to the independent derivation35.16–35.17. Table 2's strict-GRPO45.5 conflicts with Table 1's strict50.1/approximate45.5 labels. Strict/approximate comparisons also change learning rate and updates. Highest benchmark-average checkpoint selection entangles selection and reporting. Avg@32 on the small exams differs from Avg@1 elsewhere.
- **R35.7:** §2 fixes the initially filtered training pool; hard-slice tests compare frozen base and trained policies. Plotted min–max shading is not a confidence interval. Entropy/coverage findings are bounded to this small-model protocol.
- **R35.8:** Appendix A normalization spans trajectories with different initial states, with a fallback below four active turns. It is not silently rewritten as within-prompt GRPO.
- **R35.9:** §3.1.1/Figure2 describe S1–S4 collectively while exempting the S3 Python-answer strategy from Lean validation. The contradiction remains; a learned reward model is not a kernel certificate.
- **R35.10:** The80 deliberately hackable environments and simulated evaluations define a pessimistic model organism. No production failure rate or real-world external attack is inferred.
- **R35.11:** Instructed trace-control performance is a proxy; it does not directly quantify deliberate monitor evasion or prove causal faithfulness.

## Exclusions and retrieval leads

| Candidate | Original date / issue | Disposition |
|---|---|---|
| DeepSeekMath arXiv2402.03300 | 2024-02 | Excluded canonical evidence; GRPO mathematics reconstructed locally |
| DeepSeek-R1 arXiv2501.12948 | 2025-01 | Excluded; later proceedings/revisions do not admit it |
| DAPO arXiv2503.14476 | 2025-03 | Excluded; current recipe components distinguished through 2026 comparisons and implementation |
| Understanding R1-Zero-Like Training / DrGRPO arXiv2503.20783 | 2025-03 | Excluded; estimator algebra reconstructed without a newness claim |
| DeepSeek-V4 arXiv2606.19348v1 | Original v1 history2026-04-26T14:49:33UTC; June identifier/index distinct; model release2026-04-24 | Inspected lead, not admitted to this bounded chapter evidence set; no report-performance claims or older hyperparameters imported |
| ThinkPrior arXiv2609.09075 | 2026-09-08 candidate | Not admitted; full method/protocol not inspected for this chapter |
| Older citations inside admitted papers | Various pre-window originals | Not automatically admitted; used neither as independent recent evidence nor as redated2026 discoveries |

## Evidence gaps

[NOT-DISCLOSED] Several primary sources omit seeds, precision, complete optimizer/resource budgets or exact released commits. R35.10 does not disclose an exact August day. [UNVERIFIED] No independent training reproduction, production transfer, universal verifier soundness or causal reasoning mechanism has been established here. The manuscript stays manuscript_draft; explicit gaps limit claims rather than licensing invented completion.
