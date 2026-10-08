---
id: ms.references.21
entity_type: references
title: Chapter 21 references
short_title: Chapter 21 references
volume: 1
part: 4
chapter: 21
section: null
slug: references
parent: ms.chapter.21
prev_sibling: ms.verification.21
next_sibling: null
children: []
prerequisites:
- ms.chapter.6
- ms.chapter.9
- ms.chapter.13
- ms.chapter.19
- ms.chapter.20
downstream:
- ms.chapter.22
- ms.chapter.29
- ms.chapter.30
related:
- ms.chapter.35
- ms.chapter.36
- ms.chapter.59
siblings_by_mechanism: []
relations:
- type: supported_by
  target: paper.P08
- type: supported_by
  target: paper.P09
axes:
  lifecycle:
  - pretraining
  - post_training
  - evaluation
  - inference
  mechanism:
  - scaling_laws
  - compute_allocation
  feedback_setting: []
  modality:
  - text
papers:
- P07
- P08
- P09
implementations: []
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 2000
updated_at: '2026-10-08'
editorial_status: manuscript_draft
---

# Chapter 21 references

[DERIVED] This ledger records primary sources actually opened during preparation on 2026-10-08. Revision pins identify the text used for the stated method; they are not a blanket claim that every paper was comprehensively surveyed through all subsequent literature. Full primary HTML/PDF was accessible and the indicated method, experimental and limitation locations were inspected. Abstract pages were additionally used to check the revisions of the more recent sources. No source training program, released checkpoint or fitting implementation was executed.

## Source ledger

| Key | Type | Work | Authors/organisation | Venue/year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P07 | paper | DataComp-LM: In search of the next generation of training sets for language models | Jeffrey Li et al. | arXiv, 2024; inspected revision 2025 | https://arxiv.org/html/2406.11794v4 | Not inspected | preprint | 2026-10-08 | Controlled data-curation scales, proxy transfer and recipe boundaries. |
| P08 | paper | Scaling Laws for Neural Language Models | Jared Kaplan et al., OpenAI | arXiv, 2020 | https://arxiv.org/html/2001.08361v1 | Not inspected | preprint | 2026-10-08 | Finite-dataset versus finite-training-time laws, count conventions and historical allocation. |
| P09 | paper | Training Compute-Optimal Large Language Models | Jordan Hoffmann et al., DeepMind | NeurIPS, 2022 | https://arxiv.org/html/2203.15556v1 | Not inspected | peer-reviewed | 2026-10-08 | Three estimators, smoothed-training-loss proxy, robust fit and large-scale comparison. |
| R21.1 | paper | Resolving Discrepancies in Compute-Optimal Scaling of Language Models | Tomer Porian, Mitchell Wortsman, Jenia Jitsev, Ludwig Schmidt, Yair Carmon | NeurIPS, 2024; revised 2025 | https://arxiv.org/html/2406.19146v4 | Not inspected | peer-reviewed | 2026-10-08 | Head cost, warmup, tuning, no-decay result, resampling and repetition disclosure. |
| R21.2 | paper | Chinchilla Scaling: A replication attempt | Tamay Besiroglu, Ege Erdil, Matthew Barnett, Josh You, Epoch AI | arXiv, 2024 | https://arxiv.org/html/2404.10102v2 | Not inspected | preprint | 2026-10-08 | Figure digitization, robust refitting, rounding, stopping and estimator disagreement. |
| R21.3 | paper | Beyond Chinchilla-Optimal: Accounting for Inference in Language Model Scaling Laws | Nikhil Sardana, Jacob Portes, Sasha Doubov, Jonathan Frankle | ICML, 2024; revised 2025 | https://arxiv.org/html/2401.00448v3 | Ancillary files listed; not executed | peer-reviewed | 2026-10-08 | Fixed-quality lifecycle allocation, monetary assumptions and 47-run long-training sweep. |
| R21.4 | paper | Scaling Data-Constrained Language Models | Niklas Muennighoff et al. | NeurIPS, 2023; retrieved revision 2025 | https://arxiv.org/pdf/2305.16264 | Not inspected | peer-reviewed | 2026-10-08 | Effective repeated data/model capacity, shuffled epochs and saturation limits. |
| R21.5 | paper | Unified Scaling Laws for Routed Language Models | Aidan Clark et al., DeepMind | ICML, 2022 | https://arxiv.org/pdf/2202.01169 | Not inspected | peer-reviewed | 2026-10-08 | Fixed-data routed-model law, expert saturation and base-size interaction. |
| R21.6 | paper | Scaling Laws for Fine-Grained Mixture of Experts | Jakub Krajewski et al. | arXiv, 2024 | https://arxiv.org/pdf/2402.07871 | Not inspected | preprint | 2026-10-08 | Granularity, fixed expansion, fitted loss surface and router-inclusive allocation. |
| R21.7 | paper | Scaling Laws for Multilingual Language Models | Yifei He et al. | arXiv, 2024 | https://arxiv.org/html/2410.12883v2 | Not inspected | preprint | 2026-10-08 | Family grouping, mixture-share law and optimal sampling ratios. |
| R21.8 | paper | ATLAS: Adaptive Transfer Scaling Laws for Multilingual Pretraining, Finetuning, and Decoding the Curse of Multilinguality | Shayne Longpre et al. | ICLR, 2026 | https://arxiv.org/pdf/2510.22037 | Not inspected | peer-reviewed | 2026-10-08 | Transfer/repetition effective data, multilingual holdouts and measured transfer statistics. |
| R21.9 | paper | Effective Long-Context Scaling of Foundation Models | Wenhan Xiong et al., Meta | NAACL, 2024 | https://aclanthology.org/2024.naacl-long.260.pdf | Not inspected | peer-reviewed | 2026-10-08 | Positional adaptation, 400B-token continuation, context-dependent loss and evaluations. |
| R21.10 | paper | Distillation Scaling Laws | Dan Busbridge et al., Apple | ICML, 2025 | https://arxiv.org/html/2502.08606v2 | Not inspected | peer-reviewed | 2026-10-08 | Teacher-conditioned law, capacity gap, experiment grids and cost amortization. |
| R21.11 | paper | The Art of Scaling Reinforcement Learning Compute for LLMs | Devvrit Khatri et al., Meta | arXiv, 2025 | https://arxiv.org/html/2510.13786v1 | Not inspected | preprint | 2026-10-08 | Sigmoid RL scaling, ScaleRL, GPU-hour boundary, mean@16 and extrapolation. |
| R21.12 | paper | Scaling LLM Test-Time Compute Optimally can be More Effective than Scaling Model Parameters | Charlie Snell, Jaehoon Lee, Kelvin Xu, Aviral Kumar | arXiv, 2024 | https://arxiv.org/pdf/2408.03314 | Not inspected | preprint | 2026-10-08 | Difficulty-conditional strategies, verifier behavior, cross-validation and excluded estimation cost. |
| R21.13 | paper | Are Emergent Abilities of Large Language Models a Mirage? | Rylan Schaeffer, Brando Miranda, Sanmi Koyejo | NeurIPS, 2023 | https://arxiv.org/pdf/2304.15004 | Not inspected | peer-reviewed | 2026-10-08 | Metric-induced appearance, finite resolution and alternative scoring. |
| R21.14 | paper | Observational Scaling Laws and the Predictability of Language Model Performance | Yangjun Ruan et al. | NeurIPS, 2024 | https://arxiv.org/html/2405.10938v3 | Not inspected | peer-reviewed | 2026-10-08 | Capability representation, training-only preprocessing, stronger-model and future-release prediction. |
| R21.15 | paper | Predictability and Surprise in Large Generative Models | Deep Ganguli et al., Anthropic | FAccT, 2022 | https://arxiv.org/pdf/2202.07785 | Not inspected | peer-reviewed | 2026-10-08 | Aggregate predictability versus uncertain narrower impacts. |
| R21.16 | paper | Emergent Abilities of Large Language Models | Jason Wei et al. | TMLR, 2022 | https://arxiv.org/pdf/2206.07682 | Not inspected | peer-reviewed | 2026-10-08 | Historical operational emergence definition and extrapolation question. |
| R21.17 | paper | A Hitchhiker's Guide to Scaling Law Estimation | Leshem Choshen, Yang Zhang, Jacob Andreas | ICML, 2025 | https://arxiv.org/pdf/2410.11840v2 | Not inspected | peer-reviewed | 2026-10-08 | Published-model archive, raw-loss fitting, trajectory use, seed and distance sensitivity. |
| R21.18 | documentation | Epoch AI data index | Epoch AI | Official data portal, unversioned | https://epoch.ai/data | Not applicable | official documentation | 2026-10-08 | Dataset discovery and provenance context only; no numerical trend claim. |

## Inspection and revision ledger

| Key | Inspected text and locators | Evidence boundary |
|---|---|---|
| P07 | HTML v4; training-scale tables, data curation methods, main controlled comparisons and appendices. | Source-reported curation experiments. Data processing, benchmarks and code not independently run. |
| P08 | Historical HTML v1; sections 1.2, 2–4 and computation/architecture appendices. | Available dataset size in its finite-data law is separated from processed tokens in its time analysis. |
| P09 | HTML v1; Introduction footnote 2, sections 3.1–3.3 and 4, Appendices C–D including D.2. | Smoothed training loss is the source's test-loss proxy under its stated less-than-one-epoch assumption. |
| R21.1 | HTML v4, revision 2025-01-19; sections 3–4, Table 1 and Appendices B–C. | Original controlled runs; includes source disclosure of repetition in some auxiliary/OWT runs. |
| R21.2 | HTML v2; digitization, optimizer reconstruction, bootstrap and coefficient discussion. | Partial observations recovered from a published figure; no original training reproduction. |
| R21.3 | HTML v3, revision 2025-04-14; lifecycle and currency derivation, experiment grid, fit ablations and appendices. | Original 47-run sweep plus analytical serving scenarios; scenario utilization is not a universal measurement. |
| R21.4 | Retrieved full PDF stamped v5, 2025-06-28; effective-data/model equations, experimental setup and repetition comparisons. | Original runs; effective-data saturation does not represent every overfitting regime. |
| R21.5 | Retrieved full PDF; routed law, saturation and interaction analysis, experimental grid. No revision number asserted here. | Fixed-data scaling; cannot identify optimal token allocation by itself. |
| R21.6 | Retrieved full PDF and abstract metadata confirming v1; sections 4–6, granularity law and compute model. | Original fine-grained MoE runs at fixed expansion; no hardware-independent latency optimum. |
| R21.7 | HTML v2, revision 2024-12-03; family grouping, mixture intervention, fitted law and ratio optimization. | Grouping-dependent transfer hypothesis; not absence of transfer between all individual languages. |
| R21.8 | Retrieved full PDF and metadata confirming v2, 2026-02-25; sections 3–5, Table 1, multilingual and held-out protocols. | Original training/finetuning study; measured transfer scores distinguished from fitted transfer coefficients. |
| R21.9 | Full NAACL proceedings PDF; sections 2–4, context fit, continuation protocol and evaluation. | Continuation changes both training and context; short-task gains do not isolate context alone. |
| R21.10 | HTML v2, revision 2025-07-25; sections 3–4, Eq.8, experiment grids, capacity gap and compute boundaries. | Original distillation experiments; teacher creation versus incremental student cost kept separate. |
| R21.11 | HTML v1; sections 2–5, recipe, rollout protocol, scaling fit, ablations and extrapolation. | GPU-hour scaling within its systems and recipe; mean@16 is not pass@16. |
| R21.12 | Retrieved full PDF; sections 3–5 and appendices on difficulty bins, search, revision and verifier generalization. No revision number asserted here. | Main strategy budget excludes difficulty-estimation work; deployment must account for it. |
| R21.13 | Retrieved full PDF, v2 confirmed through metadata; sections 2–4 and metric experiments. | Particular apparent-emergence explanations, not a proof that all capability transitions are artifacts. |
| R21.14 | HTML v3, revision 2024-10-01; sections 3–5, response fitting, splits, future-model validation and appendices. | Observational prediction; reference-equivalent compute is not actual measured training compute. |
| R21.15 | Retrieved full proceedings PDF; predictability and narrower-behavior arguments and limitations. | Primary conceptual analysis; no task-specific numerical law imported from its secondary citations. |
| R21.16 | Retrieved full PDF; emergence definition, examples and limitations. No revision number asserted here. | Historical framing only; task measurements are not treated as newly reproduced primary experiments. |
| R21.17 | Full PDF v2, revision 2025-06-02; sections 2–8, archive, squared-loss estimation, largest-size holdouts and Appendix E. | Retrospective analysis of published models, not 485 newly trained models. |
| R21.18 | Official portal index, accessed 2026-10-08. | Discovery context only; individual dataset methodology and downloadable data not audited. |

## What this inspection does and does not establish

[DERIVED] Method reconstruction uses the primary text rather than an abstract summary. The ledger distinguishes theoretical forms, original controlled experiments, analyses of existing measurements, conceptual interpretations and discovery resources. A preprint status identifies the inspected representation where a venue was not verified; it should not be read as a claim that no later venue exists.

[UNVERIFIED] No independent replication, model execution, source-code behavior check or original-run audit has been performed. Hardware configurations and source prices are not imported into a common benchmark. Claims about throughput, memory, energy or deployment cost are therefore restricted to analytical units and source-specific assumptions explicitly discussed in the sections. The verification proposals must obtain actual run and serving measurements before making such claims for a new system.

[DERIVED] This draft's 2026 evidence includes the inspected ATLAS revision; it does not claim an exhaustive survey of every paper released by 2026-10-08. Historical sources remain pinned when used to reconstruct their original methods. Later revisions are not silently substituted for those historical claims. The same rule applies to current resource portals: an accessed date establishes inspection of that page, not validation of every linked record.
