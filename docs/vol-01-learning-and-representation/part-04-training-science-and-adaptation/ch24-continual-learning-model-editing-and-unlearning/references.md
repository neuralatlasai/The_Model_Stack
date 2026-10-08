---
id: ms.references.24
entity_type: references
title: References — Continual learning, model editing, and unlearning
short_title: References 24
volume: 1
part: 4
chapter: 24
section: null
slug: references
parent: ms.chapter.24
prev_sibling: ms.verification.24
next_sibling: null
children: []
prerequisites: [ms.chapter.6, ms.chapter.19, ms.chapter.23]
downstream: [ms.chapter.49, ms.chapter.53, ms.chapter.65, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [continued_training, adaptation, evaluation, assurance], mechanism: [continual_learning, model_editing, machine_unlearning], feedback_setting: [], modality: [text, image]}
papers: []
implementations: [impl.hugging-face-peft, impl.hugging-face-trl]
benchmarks: [TRACE, MUSE, MQuAKE]
datasets: []
status: {maturity: active, disputed: true}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1600
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# References — Chapter 24

The originating full texts below were inspected on **2026-10-08**. Publication status and inspected revision are separate: a later arXiv version is not silently treated as the archival version. The chapter's algorithms, counterexamples, resource identities, and acceptance specifications are explanatory reconstructions labeled DERIVED or MATHEMATICALLY-DERIVED. No entry establishes independent reproduction or installed-runtime compatibility.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R24.1 | paper | Re-evaluating Continual Learning Scenarios: A Categorization and Case for Strong Baselines | Yen-Chang Hsu et al. | arXiv, 2018; inspected v4, 2019 | [Full text](https://arxiv.org/html/1810.12488v4) | null | preprint | 2026-10-08 | §24.1: §2.2/Table 1 regimes; §§3–4 matched classification baselines and state budget |
| R24.2 | paper | TRACE: A Comprehensive Benchmark for Continual Learning in Large Language Models | Xiao Wang et al.; Fudan University and collaborators | arXiv, 2023 | [Full text](https://arxiv.org/html/2310.06762v1) | null | preprint | 2026-10-08 | §§24.1–24.2: §§3–4.4 sequential tasks, inherited panels, replay access, reported forgetting |
| R24.3 | paper | Gradient Episodic Memory for Continual Learning | David Lopez-Paz; Marc'Aurelio Ranzato; FAIR | NeurIPS 2017; inspected arXiv v6, 2022 | [Full text](https://arxiv.org/html/1706.08840v6) | null | peer-reviewed | 2026-10-08 | §§24.2–24.3: §2/Eqs. 2–4 metrics; §3/Eqs. 6–11 projection; §§4.1–4.4.1 and Appendix B |
| R24.4 | paper | Overcoming catastrophic forgetting in neural networks | James Kirkpatrick et al.; DeepMind and collaborators | PNAS, 2017 | [Full text](https://arxiv.org/html/1612.00796v2) | null | peer-reviewed | 2026-10-08 | §24.3: §2/Eqs. 1–3; §§2.1–2.2 classification/Atari; Appendix 4 implementation and diagonal limits |
| R24.5 | paper | On Quadratic Penalties in Elastic Weight Consolidation | Ferenc Huszár | arXiv, 2017 | [Full text](https://arxiv.org/html/1712.03847v1) | null | preprint | 2026-10-08 | §24.3: Laplace conditions; Eqs. 8–11 recursive single-anchor correction; Eqs. 12–13 revisits |
| R24.6 | paper | Learning without Forgetting | Zhizhong Li; Derek Hoiem | Inspected arXiv v3, 2017 | [Full text](https://arxiv.org/html/1606.09282v3) | null | preprint | 2026-10-08 | §24.3: §III/Fig. 3 old-output anchors on new inputs; §IV and Table 4 comparisons |
| R24.7 | paper | Continual Learning with Deep Generative Replay | Hanul Shin; Jung Kwon Lee; Jaehong Kim; Jiwon Kim | Inspected arXiv v3, 2017 | [Full text](https://arxiv.org/html/1705.08690v3) | null | preprint | 2026-10-08 | §24.3: §3.1/Eq. 1 coupled generator/solver; §§4.1–4.3 classification regimes |
| R24.8 | paper | Progressive Neural Networks | Andrei A. Rusu et al.; DeepMind | arXiv, 2016; inspected v4, 2022 | [Full text](https://arxiv.org/html/1606.04671v4) | null | preprint | 2026-10-08 | §24.3: §2/Eq. 1 frozen columns and lateral connections; §5 and experimental appendix |
| R24.9 | paper | Self-Distillation Enables Continual Learning | Idan Shenfeld; Mehul Damani; Jonas Hübotter; Pulkit Agrawal | ICML 2026, PMLR 306:111542–111558 | [Inspected preprint v1](https://arxiv.org/html/2601.19897v1) | null | peer-reviewed | 2026-10-08 | §24.3: §3 and Appendix A.1 estimator; §§4.1,4.3,4.6; Appendices B.1–B.2 setup/selection/seeds |
| R24.10 | documentation | PEFT model API | Hugging Face PEFT contributors | Mutable official documentation | [API reference](https://huggingface.co/docs/peft/en/package_reference/peft_model) | null | official documentation | 2026-10-08 | §24.3: PeftModel.load_adapter, set_adapter, activation and trainability contracts |
| R24.11 | paper | Locating and Editing Factual Associations in GPT | Kevin Meng; David Bau; Alex Andonian; Yonatan Belinkov | NeurIPS 2022; inspected arXiv v5, 2023 | [Full text](https://arxiv.org/html/2202.05262v5) | null | peer-reviewed | 2026-10-08 | §24.4: §2 causal intervention; §3.1/Eqs. 2–4 ROME; §§3.2–3.7 and Appendix E.5 |
| R24.12 | paper | Mass-Editing Memory in a Transformer | Kevin Meng; Arnab Sen Sharma; Alex Andonian; Yonatan Belinkov; David Bau | ICLR 2023; inspected arXiv v2 | [Full text](https://arxiv.org/html/2210.07229v2) | null | peer-reviewed | 2026-10-08 | §24.4: §§3,4.2–4.3/Eqs. 7–14 batch updates and residual distribution; §5/appendix settings |
| R24.13 | paper | AlphaEdit: Null-Space Constrained Knowledge Editing for Language Models | Junfeng Fang et al. | ICLR 2025; inspected arXiv v4 | [Full text](https://arxiv.org/html/2410.02355v4) | null | peer-reviewed | 2026-10-08 | §24.4: §3.2/Eqs. 8–10 fixed-key constraint; §3.3/Eqs. 11–14 soft prior-edit term; §4/Appendices A–B |
| R24.14 | paper | MQuAKE: Assessing Knowledge Editing in Language Models via Multi-Hop Questions | Zexuan Zhong; Zhengxuan Wu; Christopher D. Manning; Christopher Potts; Danqi Chen | EMNLP 2023, pp. 15686–15702 | [Inspected PDF v2](https://arxiv.org/pdf/2305.14795v2) | null | peer-reviewed | 2026-10-08 | §§24.4,24.6: §§3–4 data and item metric; §§5.1–5.2 MeLLo; Appendix H retrieval comparison |
| R24.15 | paper | MUSE: Machine Unlearning Six-Way Evaluation for Language Models | Weijia Shi et al. | Inspected arXiv v2, 2024 | [Full text](https://arxiv.org/html/2407.06460v2) | null | preprint | 2026-10-08 | §24.5: §§3–5 six criteria, baselines, scale/repeated requests; Appendices B.1,C.1 setup and uncertainty |
| R24.16 | paper | Machine Unlearning | Lucas Bourtoule et al. | IEEE Symposium on Security and Privacy, 2021; inspected arXiv v3, 2020 | [Full text](https://arxiv.org/html/1912.03817v3) | null | peer-reviewed | 2026-10-08 | §24.5: §§III–IV SISA/counterfactual; §§V–VII compute and utility tradeoffs; Appendix C storage |
| R24.17 | paper | Negative Preference Optimization: From Catastrophic Collapse to Effective Unlearning | Ruiqi Zhang; Licong Lin; Yu Bai; Song Mei | Inspected arXiv v2, 2024 | [Full text](https://arxiv.org/html/2404.05868v2) | null | preprint | 2026-10-08 | §24.5: §3/Eq. 3 objective; §§4–5 reported comparisons; Appendix D settings |
| R24.18 | paper | Simplicity Prevails: Rethinking Negative Preference Optimization for LLM Unlearning | Chongyu Fan et al. | arXiv:2410.07163; HTML revision UNVERIFIED | [Inspected full text](https://arxiv.org/html/2410.07163) | null | preprint | 2026-10-08 | §24.5: §§4–5/Eqs. 4–5 reference bias and length-normalized objective; §6 and Appendix I |
| R24.19 | paper | Unlearning or Obfuscating? Jogging the Memory of Unlearned LLMs via Benign Relearning | Shengyuan Hu; Yiwei Fu; Zhiwei Steven Wu; Virginia Smith | Inspected arXiv v4, 2025 | [Full text](https://arxiv.org/html/2406.13356v4) | null | preprint | 2026-10-08 | §24.5: §§2–4 matched content boundaries and recovery; Appendix A setup; Appendix I metrics |
| R24.20 | technical report | Inference-time Unlearning Using Conformal Prediction | Somnath Basu Roy Chowdhury et al.; Google Research | arXiv, 2026 | [Full text v1](https://arxiv.org/html/2602.03787v1) | null | preprint | 2026-10-08 | §§24.5–24.6: §§3.1–3.2/Algorithm 1/Lemma 1 assumptions; §4 workload; Appendix A coverage |
| R24.21 | paper | Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks | Patrick Lewis et al.; FAIR and collaborators | NeurIPS 2020; inspected arXiv v4, 2021 | [Full text](https://arxiv.org/html/2005.11401v4) | null | peer-reviewed | 2026-10-08 | §24.6: §2 latent retrieval; §§3–4 tasks/ablations; §4.5 index hot-swapping |

## R24.1

Inspected revision: arXiv:1810.12488v4, 2019-01-23. The manuscript uses operational regime distinctions and the need for matched state budgets. The source's classification protocol has a two-hidden-layer MLP, fixed per-task epochs, Adam, and no optimizer reset; these are disclosed historical controls, not language-model training recommendations. Generalizing its benchmark rankings is outside this use.

## R24.2

Inspected revision: arXiv:2310.06762v1, 2023-10-10. §§4.1–4.3 specify eight balanced sequential datasets, source-native task metrics, aligned-model baselines, and replay with historical/alignment data. §4.4 reports inherited-capability degradation. The book's metric denominators are explicitly defined in Eq. 24.7; they are not silently identified with every TRACE normalization. No current-frontier rank is asserted.

## R24.3

Inspected revision: arXiv:1706.08840v6, 2022-09-13. [Archival metadata](https://proceedings.neurips.cc/paper_files/paper/2017/hash/f87522788a2be2d171666752f97ddebb-Abstract.html) confirms the 2017 proceedings. The chapter reconstructs the first-order old-loss constraint; this is not an exact nonlinear preservation guarantee. The pretrained baseline in §24.2 deliberately adapts GEM's initialization comparator.

## R24.4

Inspected revision: arXiv:1612.00796v2, 2017-01-25. The paper's own parameter perturbation analysis and Atari setup limit the diagonal approximation. The chapter separates the model Fisher, observed-label empirical Fisher, and data-loss Hessian; the source's shorthand does not justify identifying these objects in arbitrary neural networks.

## R24.5

Inspected revision: arXiv:1712.03847v1, 2017-12-11. This is a mathematical correction, not an independently reproduced benchmark comparison. The recursive precision's scaling and the latest anchor must be specified together. The book does not claim that adding penalties at every historical posterior mode implements the corrected recursion.

## R24.6

Inspected revision: arXiv:1606.09282v3, 2017-02-14. §III supplies the old-output-on-new-input procedure; §IV compares ImageNet/Places initialization and new classification datasets, including dissimilar tasks. No original-data support guarantee follows from the absence of an old-example buffer. Archival revision equivalence was not checked.

## R24.7

Inspected revision: arXiv:1705.08690v3, 2017-12-12. The title is “Continual Learning with Deep Generative Replay”; the shortened mechanism name in §24.3 is not a separate paper. Its generated historical inputs and previous-solver targets are explicit. Generated-data fidelity and authorization are independent questions; the source does not certify a privacy guarantee for synthetic replay.

## R24.8

Inspected revision: arXiv:1606.04671v4, 2022-10-22. Frozen historical columns, new columns, and lateral features define the method. The manuscript's deterministic old-path equality is a conditional mathematical argument; unchanging parameters alone is insufficient if normalization buffers or routing change. Historical transfer evidence is not transferred to arbitrary adapters.

## R24.9

Inspected method revision: arXiv:2601.19897v1, 2026-01-27. [ICML archival metadata](https://proceedings.mlr.press/v306/shenfeld26a.html) was also opened; the linked archival PDF retrieval failed, so the method/results attribution is pinned to v1 rather than claimed identical to the proceedings PDF. §4 covers science-question, tool-use, medical, and new-knowledge tasks; §4.3 includes sequential retention; §4.6 examines teacher choices. Appendix B.1 discloses full fine-tuning with Hugging Face TRL on a single H200, validation-based selection, and training settings; B.2 uses three seeds and confidence intervals. No installed TRL behavior was tested. Eq. 24.15 is the book's fixed-prefix derivative reconstruction, with a stated stop-gradient boundary rather than an unqualified full-sequence-gradient claim.

## R24.10

The URL is mutable and unpinned. Inspected API entries: `PeftModel.load_adapter` states that loading does not itself activate an adapter; `set_adapter` activates the selected loaded adapter and can make it trainable when the documented inference-mode conditions permit. These statements apply to the documented interface, not every mixed-adapter class. No package version, commit, or runtime was executed; executable compatibility remains UNVERIFIED.

## R24.11

Inspected revision: arXiv:2202.05262v5, 2023-01-13. [NeurIPS archival record](https://proceedings.neurips.cc/paper_files/paper/2022/hash/6f1d43d5a82a37e89b0665b33bf3a182-Abstract-Conference.html) confirms publication. §3.1 supplies key/value construction and the constrained rank-one update; §§3.2–3.7 distinguish efficacy, generalization, neighborhood specificity, generation, and limitations. Causal tracing is an intervention analysis of the tested model, not proof of a unique universal fact location.

## R24.12

Inspected revision: arXiv:2210.07229v2, 2023-08-01; [archival ICLR PDF metadata](https://openreview.net/pdf?id=MkbcAHIYgyS) cross-checked. §4 distributes batch residuals across selected layers and recomputes keys; the book does not describe MEMIT as independent single-layer ROME edits. Conflicting requests and order-dependent representations are outside the simple fixed-key solver's guarantees.

## R24.13

Inspected revision: arXiv:2410.02355v4, 2025-04-22; [ICLR archival record](https://proceedings.iclr.cc/paper_files/paper/2025/hash/29c8c615b3187ee995029284702d3f43-Abstract-Conference.html) cross-checked. §3.2's projection preserves selected fixed key vectors locally. §3.3 adds previous-edit keys through a soft residual term; these are not automatically exact constraints. The numerical singular-value threshold and selected covariance statistics define an approximate nullspace in practice. The chapter's reduced-coordinate constrained ridge solution is explanatory mathematics, not a claim about the released solver's exact execution.

## R24.14

Inspected PDF: arXiv:2305.14795v2, 2023-10-29, 17 pages. [ACL archival metadata](https://aclanthology.org/2023.emnlp-main.971/) confirms venue and pages. §4's multi-hop metric accepts any of three question variants per item. §5.1 explicitly includes frozen-model decomposition, sentence memory, Contriever retrieval, and contradiction checking. Results are bounded by the generated question protocol, model versions, prompts, and memory conditions.

## R24.15

Inspected revision: arXiv:2407.06460v2, 2024-07-14. §3.1 defines VerbMem, KnowMem, and PrivLeak; the latter is retraining-relative and must not be replaced by a universal “AUC equals 0.5” target. §§3.2,4 and Appendix B.1 disclose News/Books datasets, original model training, and eight approximate baselines. Appendix C.1 supplies bootstrap uncertainty for specified criteria. Archival ICLR-version equivalence was not inspected, so the record conservatively identifies the inspected preprint.

## R24.16

Inspected revision: arXiv:1912.03817v3, 2020-12-15; the full text identifies the 2021 IEEE symposium. The sharded training algorithm is its own counterfactual comparator. A pretrained component outside the sharded dependency boundary is not retrospectively unlearned by retraining affected shards. Resource advantages depend on shard/slice count and deletion-request distribution, with utility/storage tradeoffs disclosed in §§V–VII and Appendix C.

## R24.17

Inspected header revision: arXiv:2404.05868v2, 2024-10-10. The rendered body also displays a later date; this mismatch is recorded rather than interpreted as a verified later revision. §3 gives the source objective and restricted theoretical setting; §§4–5 and Appendix D provide synthetic/TOFU comparisons. The chapter uses the objective and disclosed experiments, not a universal theorem of neural-network unlearning.

## R24.18

The inspected HTML did not expose a reliable version/date header; revision is **UNVERIFIED**. §5's optional margin and length normalization are retained; Eq. 24.27 deliberately selects zero margin and derives its gradient. §6/Appendix I disclose TOFU/MUSE/WMDP settings, search, and checkpoint selection. Pinning and archival reconciliation are required before reviewed status; reading the full method supports a bounded preprint attribution, not a version-pinned replication claim.

## R24.19

Inspected revision: arXiv:2406.13356v4, 2025-03-17. §§2–4 separate partial-target and benign-related relearning, with held-out content and training-depth/budget sensitivity. The book proposes benign synthetic-canary experiments only. Its matched-retraining recovery gap is an evaluation control, not a numerical result attributed to this paper.

## R24.20

Inspected revision: arXiv:2602.03787v1, 2026-02-03. §3.1 specifies verifier-based refinement and finite iteration budgets; §3.2's principal coverage statement is marginal under the stated i.i.d. calibration/test assumptions. Appendix A separates split-conformal and stronger calibration variants. The first-party landing summary and PDF abstract have differing reported percentages; this manuscript quotes neither. The method changes response selection without updating parameters and does not establish parameter deletion.

## R24.21

Inspected revision: arXiv:2005.11401v4, 2021-04-12. §2 specifies the document latent-variable models; §4.5's index experiment uses December 2016/2018 Wikipedia snapshots and 82 templated leader questions. This finite test supports a demonstrated update route, not general perfect evidence use, authorization, or deletion. Eq. 24.32 is a separate book-derived cost comparison with explicit illustrative inputs.

## Evidence gaps and review consequence

[UNVERIFIED] All reported numerical findings remain source-reported. No model training, edit application, deletion experiment, runtime compatibility check, or independent benchmark reproduction was performed. Mutable PEFT documentation, the unresolved SimNPO HTML revision, and the unavailable SDFT archival PDF prevent a blanket version-pinned implementation/revision claim. [NOT-DISCLOSED] Realized latency, memory peaks, energy, monetary cost, complete frontier-model pretraining provenance, and global preservation/deletion guarantees are unavailable for the proposed artifact. These gaps preserve `manuscript_draft` status; they do not authorize guessed values or broader guarantees.
