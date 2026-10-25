---
id: ms.references.55
entity_type: references
title: Chapter 55 primary evidence ledger
volume: 3
part: 10
chapter: 55
section: null
slug: references
parent: ms.chapter.55
prev_sibling: ms.verification.55
next_sibling: null
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.49, ms.chapter.50]
downstream: [ms.section.55.2, ms.section.55.6, ms.chapter.57]
related: [ms.chapter.15, ms.chapter.42]
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [visual_representation, spatial_sampling], feedback_setting: [], modality: [image, text]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 55 - Primary evidence ledger

[PAPER-REPORTED] Every newly introduced report below first appeared within 2026-03-01 through 2026-10-24. Inspected revisions are v1 for ten reports and current v2 for ChartDiff and VELD-QA; first-public and revision dates are separate. Actual inspection occurred 2026-10-25; HTML full-text snapshots and source locators were retained in the current-run audit artifacts. Publication status is recorded conservatively as preprint; an arXiv record alone does not establish peer review.

[OFFICIAL-DOCUMENTATION] The originating SCVER repository was inspected at the exact current-window commit below. This is a static source inspection, not a runtime test, compatibility result or benchmark. No training, inference or model evaluation was executed by the book. Foundation pointers in the plan are routed to earlier canonical chapters and are not newly cited as current research.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R55.1 | paper | Qianfan-OCR: A Unified End-to-End Model for Document Intelligence | Baidu Qianfan Team | arXiv 2026; first public 2026-03-11; inspected v1 | [v1 full text](https://arxiv.org/html/2603.13398v1) | https://github.com/baidubce/Qianfan-VL | preprint | 2026-10-25 | Secs.3-5; architecture, synthesis, staged training; Table 2 model-scope distinction |
| R55.2 | paper | LeVLJEPA: End-to-End Vision-Language Pretraining Without Negatives | Lukas Kuhn; Giuseppe Serra; Randall Balestriero; Florian Buettner | arXiv 2026; first public 2026-07-01; inspected v1 | [v1 full text](https://arxiv.org/html/2607.00784v1) | https://github.com/mlo-lab/LeVLJEPA | preprint | 2026-10-25 | Secs.2-7; Tables1-6; Appendix A objectives, downstream readouts and cross-device gather |
| R55.3 | paper | State-Conditioned Visual Evidence Retrieval for Fine-Grained Perception in Document Vision-Language Models | Mingxu Chai et al. | arXiv 2026; first public 2026-08-27; inspected v1 | [v1 full text](https://arxiv.org/html/2608.28698v1) | https://github.com/SII-sc22mc/SCVER | preprint | 2026-10-25 | Sec. 3 Eqs.1-8; Sec.4 Tables1/3/4/5; AppendicesB.1-B.6; sampler and guidance scope |
| R55.4 | paper | What Does the Caption Really Say? Counterfactual Phrase Intervention for Compositional Data Selection in Vision-Language Pretraining | Hyejin Go; Semi Lee; Hyesong Choi | arXiv 2026; first public 2026-05-21; inspected v1 | [v1 full text](https://arxiv.org/html/2605.22651v1) | NOT-DISCLOSED in inspected method account | preprint | 2026-10-25 | Secs.4-7; substitution constraints, ranking, Tables2-4, two-seed and non-dominance limits |
| R55.5 | paper | GroundCount: Grounding Vision-Language Models with Object Detection for Mitigating Counting Hallucinations | Boyuan Chen; Minghao Shao; Siddharth Garg; Ramesh Karri; Muhammad Shafique | arXiv 2026; first public 2026-03-11; inspected v1 | [v1 full text](https://arxiv.org/html/2603.10978v1) | NOT-DISCLOSED in inspected implementation account | preprint | 2026-10-25 | Secs.IV-V; prompt/fusion algorithms, TableII, negative model/threshold results |
| R55.6 | paper | OrdinalBench: A Benchmark Dataset for Diagnosing Generalization Limits in Ordinal Number Understanding of Vision-Language Models | Yusuke Tozaki; Hisashi Miyamori | arXiv 2026; first public 2026-03-08; inspected v1 | [v1 full text](https://arxiv.org/html/2603.07786v1) | See originating report; code not inspected | preprint | 2026-10-25 | Secs.3-5; generated traversal task, trace metrics, subset distinctions, stride result |
| R55.7 | paper | ChartDiff: A Large-Scale Benchmark for Comprehending Pairs of Charts | Rongtian Ye | arXiv 2026; first public 2026-03-30; inspected v2, 2026-05-11 | [v2 full text](https://arxiv.org/html/2603.28902v2) | https://ckchaos.github.io/ChartDiff | preprint | 2026-10-25 | Secs.3-4; Table 2, annotation/evaluator methods, human-rating check and limitations |
| R55.8 | paper | PaddleOCR-VL-1.6: Expanding the Frontier of Document Parsing with Under-Optimized Region Refinement and Progressive Post-Training | Zelun Zhang et al.; PaddlePaddle Team, Baidu Inc. | arXiv 2026; first public 2026-06-02; inspected v1 | [v1 full text](https://arxiv.org/html/2606.03264v1) | https://github.com/PaddlePaddle/PaddleOCR | preprint | 2026-10-25 | Secs.2-5; Algorithms1-2, task rewards, Table 8 and prose inconsistency; unchanged architecture |
| R55.9 | paper | LITTA: Late-Interaction and Test-Time Alignment for Visually-Grounded Multimodal Retrieval | Seonok Kim | arXiv 2026; first public 2026-03-10; inspected v1 | [v1 full text](https://arxiv.org/html/2603.26683v1) | NOT-DISCLOSED in inspected method account | preprint | 2026-10-25 | Secs.3-4; MaxSim/RRF, index boundary, candidate depth, Table1 domain means |
| R55.10 | paper | VELD-QA: A Large-Scale Dataset for Visual Evidence Grounding and Question Answering in Long Documents | Zhivar Sourati et al.; Oracle AI and collaborating institutions | arXiv 2026; first public 2026-10-14; inspected v2, 2026-10-16 | [v2 full text](https://arxiv.org/html/2610.20964v2) | https://github.com/oracle-samples/veld-qa | preprint | 2026-10-25 | Secs.3-6; Tables2-5; AppendicesC/F; cohort, partial credit and evidence-coverage controls |
| R55.11 | paper | Seeing is Believing: Benchmarking and Mitigating the Interference of Language Priors on Visual Perception in MLLMs | Li Ma; Yan Zhuang; Jiawen Deng; Fuji Ren | arXiv 2026; first public 2026-10-15; inspected v1 | [v1 full text](https://arxiv.org/html/2610.21902v1) | See originating report; repository not inspected | preprint | 2026-10-25 | Secs.3-5; Eqs.1-2, Tables3-5; Appendix C; moving filter and threshold tradeoff |
| R55.12 | paper | Visual Cache Reuse for Efficient Multimodal Inference | Shuheng Gao; Yuankai Fan; Jiaqiang Ma; Jiawei Shao; Yongkun Li; Xuelong Li | arXiv 2026; first public 2026-10-18; inspected v1 | [v1 full text](https://arxiv.org/html/2610.25136v1) | No VisMemo source commit disclosed in inspected report | preprint | 2026-10-25 | Secs.3-4; Table1; lookup, entropy, recompute/reuse/mask, setup, amortization and hit-rate inconsistencies |
| R55.13 | documentation | Originating SCVER implementation | SII-sc22mc / SCVER authors | commit 2026-08-27 | [pinned source](https://github.com/SII-sc22mc/SCVER/blob/f1ea200abc69d6b48e070639c2b93b06014672ec/scver/modeling_scver.py) | [configuration](https://github.com/SII-sc22mc/SCVER/blob/f1ea200abc69d6b48e070639c2b93b06014672ec/scver/config.py) | official documentation | 2026-10-25 | Static source inspection; Modeling lines 627-657 visual centroid; configuration restrictions config restrictions; config Transformers 4.57.6; no runtime claim |

## R55.1

[PAPER-REPORTED] **Qianfan-OCR: A Unified End-to-End Model for Document Intelligence.** First public 2026-03-11; inspected arXiv `2603.13398v1`; accessed 2026-10-25. Primary locator: Secs.3-5; architecture, synthesis, staged training; Table 2 model-scope distinction.

[DERIVED] The visual interface quantities are disclosed, but the inspected architecture section does not specify the complete1,024-to-256 token reduction. Do not infer pooling from counts. The stage ablation uses an 8B configuration, not the main 4B language backbone; source-defined mixtures are not a controlled final-model attribution.

## R55.2

[PAPER-REPORTED] **LeVLJEPA: End-to-End Vision-Language Pretraining Without Negatives.** First public 2026-07-01; inspected arXiv `2607.00784v1`; accessed 2026-10-25. Primary locator: Secs.2-7; Tables1-6; Appendix A objectives, downstream readouts and cross-device gather.

[DERIVED] Full method and readout tables were inspected, including Appendix A gather behavior. Global classification, dense segmentation and bridge-trained VQA differ. The frozen-bridge Table 6 favors LeVLJEPA in the displayed columns; Table 1 separately reports lower zero-shot classification than contrastive baselines. Distinguish these evaluated consumers rather than reversing the Qwen row attribution. Bridge seeds are not independent pretraining seeds. Matched samples/schedule do not independently verify identical FLOPs or energy.

## R55.3

[PAPER-REPORTED] **State-Conditioned Visual Evidence Retrieval for Fine-Grained Perception in Document Vision-Language Models.** First public 2026-08-27; inspected arXiv `2608.28698v1`; accessed 2026-10-25. Primary locator: Sec. 3 Eqs.1-8; Sec.4 Tables1/3/4/5; AppendicesB.1-B.6; sampler and guidance scope.

[DERIVED] The printed visual-attention centroid lacks explicit normalization. R55.13 supplies it for the released specialized implementation. Detailed delegated sampler numerics remain uninspected. Mixed VQA comparisons, guidance ablation and same-data controls are retained; undisclosed backbone data prevent an independent contamination audit.

## R55.4

[PAPER-REPORTED] **What Does the Caption Really Say? Counterfactual Phrase Intervention for Compositional Data Selection in Vision-Language Pretraining.** First public 2026-05-21; inspected arXiv `2605.22651v1`; accessed 2026-10-25. Primary locator: Secs.4-7; substitution constraints, ranking, Tables2-4, two-seed and non-dominance limits.

[DERIVED] Controlled replacement is a score-sensitivity proxy, not causal identification or mutual information. Exact tokenizer-length invariance does not bound embedding movement or a Taylor remainder. Two-seed estimates and correlated benchmark summaries limit certainty; the stricter SugarCrepe++overall result does not uniformly favor curation.

## R55.5

[PAPER-REPORTED] **GroundCount: Grounding Vision-Language Models with Object Detection for Mitigating Counting Hallucinations.** First public 2026-03-11; inspected arXiv `2603.10978v1`; accessed 2026-10-25. Primary locator: Secs.IV-V; prompt/fusion algorithms, TableII, negative model/threshold results.

[DERIVED] A detector supplies fallible observations. The source tests finite thresholds and model families; its causal explanations for architectural behavior are not isolated by those comparisons. Fusion variants also change trainable components and checkpoint selection. Reported speedups are not transferred without complete latency conditions.

## R55.6

[PAPER-REPORTED] **OrdinalBench: A Benchmark Dataset for Diagnosing Generalization Limits in Ordinal Number Understanding of Vision-Language Models.** First public 2026-03-08; inspected arXiv `2603.07786v1`; accessed 2026-10-25. Primary locator: Secs.3-5; generated traversal task, trace metrics, subset distinctions, stride result.

[DERIVED] The benchmark supplies generated trajectories and parser-sensitive trace metrics. Some API evaluations use stratified subsets, unlike full open-model runs. Long-ordinal errors do not isolate internal memory capacity. Zero temperature is not a proof of deterministic execution. Diagram topology transfer beyond these generated loops remains unverified.

## R55.7

[PAPER-REPORTED] **ChartDiff: A Large-Scale Benchmark for Comprehending Pairs of Charts.** First public 2026-03-30; inspected arXiv `2603.28902v2` (2026-05-11); accessed 2026-10-25. Primary locator: Secs.3-4; Table 2, annotation/evaluator methods, human-rating check and limitations.

[DERIVED] Data-derived chart pairs and human-verified model annotations were inspected alongside evaluator prompts/methods. Lexical overlap and judge score measure different properties. A human-score correlation does not independently validate every chart fact, and the model-annotation/judge relationship leaves evaluator bias. Publication acceptance was not needed for the chapter claim.

## R55.8

[PAPER-REPORTED] **PaddleOCR-VL-1.6: Expanding the Frontier of Document Parsing with Under-Optimized Region Refinement and Progressive Post-Training.** First public 2026-06-02; inspected arXiv `2606.03264v1`; accessed 2026-10-25. Primary locator: Secs.2-5; Algorithms1-2, task rewards, Table 8 and prose inconsistency; unchanged architecture.

[DERIVED] The contribution is data and post-training with prior architecture/layout detector retained. Table 8 sequential ablation does not isolate data, training budget and stage ordering. Table 8 SFT TEDS-S is 97.09, while prose says 97.19; the manuscript uses the table. Expert agreement and render-guided acceptance are not independent ground truth.

## R55.9

[PAPER-REPORTED] **LITTA: Late-Interaction and Test-Time Alignment for Visually-Grounded Multimodal Retrieval.** First public 2026-03-10; inspected arXiv `2603.26683v1`; accessed 2026-10-25. Primary locator: Secs.3-4; MaxSim/RRF, index boundary, candidate depth, Table1 domain means.

[DERIVED] The abstract page records first public 2026-03-10 despite the later-looking numeric identifier; the inspected history, not the identifier, controls the date. MaxSim/RRF and top-20 candidate configuration were inspected. Detailed index/runtime commits, failed-expansion frequency and total service cost remain unresolved. Arithmetic complexity retains vector width explicitly in the book.

## R55.10

[PAPER-REPORTED] **VELD-QA: A Large-Scale Dataset for Visual Evidence Grounding and Question Answering in Long Documents.** First public 2026-10-14; inspected arXiv `2610.20964v2` (2026-10-16); accessed 2026-10-25. Primary locator: Secs.3-6; Tables2-5; AppendicesC/F; cohort, partial credit and evidence-coverage controls.

[DERIVED] Dataset and answer/evidence settings, source-group statistics, partial-credit judge and document bootstrap were inspected. Appendix C states answer grading does not itself assess citation faithfulness. Appendix F controls prompt/runner/resolution for gold-versus-retrieved input. Agent systems retain method-specific prompts/budgets, so those comparisons do not isolate agency at equal cost.

## R55.11

[PAPER-REPORTED] **Seeing is Believing: Benchmarking and Mitigating the Interference of Language Priors on Visual Perception in MLLMs.** First public 2026-10-15; inspected arXiv `2610.21902v1`; accessed 2026-10-25. Primary locator: Secs.3-5; Eqs.1-2, Tables3-5; Appendix C; moving filter and threshold tradeoff.

[DERIVED] Filtered Count refers to removed image-free-correct items, not the remaining conflict-set denominator. Model-specific membership changes after adaptation. Fixed-cohort transitions in the chapter are a book analysis, not supplied source results. VIG is smoothed log-odds change; its exact mathematical bound follows from the written formula. Threshold 0.90 is a tradeoff, not uniformly best perception.

## R55.12

[PAPER-REPORTED] **Visual Cache Reuse for Efficient Multimodal Inference.** First public 2026-10-18; inspected arXiv `2610.25136v1`; accessed 2026-10-25. Primary locator: Secs.3-4; Table1; lookup, entropy, recompute/reuse/mask, setup, amortization and hit-rate inconsistencies.

[DERIVED] Current encoding, lookup, warmup, patch selection/masking and partial cache I/O remain in the approximate path. Low entropy does not certify equivalent contextual KV. Setup, Table1 and efficiency sections were inspected; no fresh-compute quality parity proof is inferred. Abstract/body hit-rate figures differ, and several figure references are inconsistent; the chapter avoids merging those summaries. Precision/concurrency and engine commits remain NOT-DISCLOSED.

## R55.13

[OFFICIAL-DOCUMENTATION] Commit `f1ea200abc69d6b48e070639c2b93b06014672ec`, authored/committed 2026-08-27, was resolved through the originating repository's commit/tree API and source files. Inspected `scver/modeling_scver.py`: `restore_spatial_map`, `_record_teacher_target` (lines 627-657), `_validate_mineru_config`, `_capture_premerger_features`, two-stream `forward` and `from_pretrained`; `scver/config.py`: version, supported base, insertion layers and defaults. Accessed 2026-10-25.

[OFFICIAL-DOCUMENTATION] The code renormalizes visual attention, uses normalized cell centers, gates tiny visual mass, freezes the backbone and specializes to one still image per example. It pins Transformers 4.57.6 and delegates the deformable sampling operator. Configuration checks and comments are evidence of intended constraints; no environment import, unit test, training or generation was performed. Boundary/clipping semantics of the delegated kernel, accelerator numerical behavior, graph capture and concurrency remain UNVERIFIED.

## Revision-history audit

[DERIVED] All twelve unversioned arXiv submission histories were reopened on 2026-10-25. Ten retained reports list only v1. ChartDiff's current v2 (2026-05-11) and VELD-QA's v2 (2026-10-16) were then opened, downloaded and compared with the earlier inspected v1 texts. The cited VELD-QA methods, experiments and evaluation/coverage appendices have identical normalized text; ChartDiff adds bibliography formatting and model citations without changing the cited construction/results. The ledger now points to those current revisions. This comparison is source inspection, not result replication.

## Current-window exclusions and research limits

[DERIVED] CASA (`2512.19535`) first appeared 2025-12-22; its March2026revision does not satisfy the first-public window and is excluded. Historical CLIP/BLIP-2 anchors are linked via Chapter 18 rather than newly introduced. Qwen release discovery does not establish a new architecture merely because a later checkpoint was published. This topical search is broad enough to support the identified mechanisms, not an exhaustive census of every 2026 VLM.

## Dataset and benchmark records

| Capability / dataset | Construction and metric | Protocol and contamination risks | Known limits and comparability |
|---|---|---|---|
| OrdinalBench [R55.6] | Generated loop/maze scenes;39,000 QA; final accuracy and trace metrics | Source-generated public test; API subsets versus complete open-model evaluation; generator/template exposure possible | Synthetic topology; structured output/length can confound procedural attribution |
| ChartDiff [R55.7] |8,541 rendered chart pairs from source tables;6,041/1,000/1,500 train/validation/test; ROUGE and model-judged quality | Model-generated then human-verified comparison summaries; latent-source overlap needs separate audit | Limited chart types; judge/annotation dependence and rendering distribution |
| VELD-QA [R55.10] |15,000 human-authored QA;5,859 PDF file entries but5,585 distinct byte contents; visual evidence annotations | PDF-level splits;1,452 test questions; grouped bootstrap and partial-credit judge; byte aliases/semantic duplicates require audit | Reference evidence not necessarily minimal/exhaustive; all-page batching differs from a single unlimited-context read |
| ViSiP-Bench [R55.11] | Rare visual/prior conflicts; model-specific blank answers; adherence, filtered accuracy, log-odds shift | Three repeats; per-model filters change populations; answer-token probability access needed for VIG | Filter transitions and generated-image artifacts; no universal prior set or internal-cause proof |
| OmniDocBench v1.6 in [R55.8] | Adaptive element matching; text, formula, table and reading-order metrics | Source report cites official leaderboard; independent rerun absent; prior data/benchmark exposure unresolved | Aggregation/matching differs across revisions; headline score does not isolate each structural property |

[NOT-DISCLOSED] Independent license/access audits, exact hashes of every released dataset, full training mixtures, all package commits, numerical parity tolerances and source-level statistical uncertainty are incomplete. Those values must be obtained before reproducing or deploying a candidate; the chapter does not fill them by assumption.
