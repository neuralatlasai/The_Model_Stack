---
id: ms.references.58
entity_type: references
title: "Chapter 58 primary evidence ledger"
volume: 3
part: 10
chapter: 58
section: null
slug: references
parent: ms.chapter.58
prev_sibling: ms.verification.58
next_sibling: null
children: []
prerequisites:
  [
    ms.chapter.4,
    ms.chapter.18,
    ms.chapter.25,
    ms.chapter.26,
    ms.chapter.27,
    ms.chapter.28,
    ms.chapter.37,
    ms.chapter.38,
    ms.chapter.39,
    ms.chapter.40,
    ms.chapter.41,
    ms.chapter.55,
    ms.chapter.56,
    ms.chapter.57,
  ]
downstream: [ms.chapter.59, ms.chapter.60]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [pretraining, inference, evaluation],
    mechanism: [multimodal_generation, predictive_representation, control],
    feedback_setting: [],
    modality: [image, text, audio, video],
  }
papers: []
implementations: [impl.pytorch]
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
        OFFICIAL-DOCUMENTATION,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 58 - Primary evidence ledger

[PAPER-REPORTED] The eleven retained research reports first appeared within 2026-03-01 through 2026-10-24. Actual inspection date is 2026-10-25. Unversioned arXiv submission histories were checked: R58.8 uses v2 and R58.13 uses v4; the other research texts use v1. Paper/revision/access dates are separate. A proceedings label or an arXiv record is not independently treated as proof of peer review.

[OFFICIAL-DOCUMENTATION] The two originating repositories are pinned to dated current-window commits. Inspection was static. No checkpoint, training, generation, metric pipeline or runtime compatibility test was executed by the book. Older plan anchors and foundational methods are linked to canonical earlier chapters, not introduced as current research.

| Key    | Type             | Work                                                                                                                        | Authors / organisation                      | Venue / year                                                                                  | Primary URL                                                                                                                                                              | Official code                                                       | Status                 | Accessed   | Used for                                                                                                                                           |
| ------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| R58.1  | paper            | MacTok: Robust Continuous Tokenization for Image Generation                                                                 | Hengyu Zeng et al.                          | 2026; first public 2026-03-31; inspected 2603.29634v1, 2026-03-31                             | [inspected source](https://arxiv.org/html/2603.29634v1)                                                                                                                  | NOT-DISCLOSED in inspected implementation account                   | preprint               | 2026-10-25 | Tokenizer architecture, masking, alignment, reconstruction/generation distinction; critique of Appendix A likelihood steps                         |
| R58.2  | paper            | Multimodal Flow: Unified Flow Modeling of Language and Vision in Embedding Spaces                                           | Hongyuan Tao et al.                         | 2026; first public 2026-09-30; inspected 2609.40362v1, 2026-09-30                             | [inspected source](https://arxiv.org/html/2609.40362v1)                                                                                                                  | https://github.com/hustvl/Multimodal-Flow                           | preprint               | 2026-10-25 | Chunk-causal flow, codecs, loss, matching boundaries, modality-specific FFNs, different inference regimes                                          |
| R58.3  | paper            | Discrete Diffusion Bridges for Spatiotemporally Aligned Image Translation and Generation                                    | Xing Xie et al.                             | 2026; first public 2026-08-30; inspected 2608.29997v1, 2026-08-30                             | [inspected source](https://arxiv.org/html/2608.29997v1)                                                                                                                  | https://github.com/HKU-HealthAI/DDB                                 | preprint               | 2026-10-25 | Hybrid source/mask absorption, target-dependent training curriculum, unresolved-state commitments; zero-information gap                            |
| R58.4  | paper            | Rethinking UMM Visual Generation: Masked Modeling for Efficient Image-Only Pre-training                                     | Peng Sun; Jun Xie; Tao Lin                  | 2026; first public 2026-03-17; inspected 2603.16139v1, 2026-03-17                             | [inspected source](https://arxiv.org/html/2603.16139v1)                                                                                                                  | https://github.com/LINs-lab/IOMM                                    | preprint               | 2026-10-25 | Frozen MLLM conditioning, residual query adapter, masked image-only stage, mixed adaptation and negative finetuning control                        |
| R58.5  | paper            | Foley-Flow: Coordinated Video-to-Audio Generation with Masked Audio-Visual Alignment and Dynamic Conditional Flows          | Shentong Mo; Yibing Song                    | 2026; first public 2026-03-09; inspected 2603.08126v1, 2026-03-09                             | [inspected source](https://arxiv.org/html/2603.08126v1)                                                                                                                  | NOT-DISCLOSED in inspected method account                           | preprint               | 2026-10-25 | Time-varying AV conditioning; disclosed preprocessing inconsistency and incomplete flow/sampler reconstruction                                     |
| R58.6  | technical report | SenseNova-U1.5: Towards Native Unified Visual Intelligence                                                                  | Haiwen Diao et al.; SenseNova team          | 2026; first public 2026-09-10; inspected 2609.11929v1, 2026-09-10                             | [inspected source](https://arxiv.org/html/2609.11929v1)                                                                                                                  | https://github.com/OpenSenseNova/SenseNova-U1                       | preprint               | 2026-10-25 | Native pixel interface, spatial decoder, staged MoT training, specialists and same-state on-policy field consolidation; nonuniform benchmark gains |
| R58.7  | paper            | From Local Mismatch to Global Impact: Optimizing Cache Reuse Policy for Efficient Diffusion                                 | Xichen Ye et al.                            | 2026; first public 2026-08-13; inspected 2608.13043v1, 2026-08-13                             | [inspected source](https://arxiv.org/html/2608.13043v1)                                                                                                                  | NOT-DISCLOSED in inspected implementation account                   | preprint               | 2026-10-25 | Propagation bound versus learned proxy, fixed-refresh DP, outer search/calibration cost, base-similarity versus VBench tradeoffs                   |
| R58.8  | paper            | On the Robustness of Distribution Support under Diffusion Guidance                                                          | Ruijia Cao; Yuchen Wu; Nisha Chandramoorthy | 2026; first public 2026-05-08; inspected 2605.07220v2, 2026-05-22                             | [inspected source](https://arxiv.org/html/2605.07220v2)                                                                                                                  | NOT-DISCLOSED in inspected theory account                           | preprint               | 2026-10-25 | Exact-score, convex/disjoint support conditions; fine-step limit; unresolved learned-score distribution shift                                      |
| R58.9  | paper            | Depth as Time in One-Step Generative Models                                                                                 | Arnold Caleb Asiimwe et al.                 | 2026; first public 2026-10-02; inspected 2610.03626v1, 2026-10-02                             | [inspected source](https://arxiv.org/html/2610.03626v1)                                                                                                                  | See originating report; implementation not inspected                | preprint               | 2026-10-25 | Intermediate-readout controls, weight-shared depth distillation, repeated-block costs, parameter versus compute compression                        |
| R58.10 | paper            | Calibrate What You SHIP: Post-Selection Risk Control for Verifier-Guided Text-to-Image Generation                           | Xuanhua Yin et al.                          | 2026; first public 2026-08-22; inspected 2608.21748v1, 2026-08-22                             | [inspected source](https://arxiv.org/html/2608.21748v1)                                                                                                                  | NOT-DISCLOSED in inspected implementation account                   | preprint               | 2026-10-25 | Policy-level conditional risk, fixed-grid certificate versus pointwise descriptive rows, complete resource/coverage boundary                       |
| R58.11 | documentation    | Originating Multimodal Flow implementation                                                                                  | hustvl / Multimodal-Flow authors            | 2026; first public 2026-10-08; inspected c84caf50fc3da57e30d5984a4d99dee81f8b0c43, 2026-10-08 | [inspected source](https://github.com/hustvl/Multimodal-Flow/tree/c84caf50fc3da57e30d5984a4d99dee81f8b0c43)                                                              | https://github.com/hustvl/Multimodal-Flow                           | official documentation | 2026-10-25 | Static interpolation, clipping, reduction options, CUDA/dtype cached-path restrictions and routing identity; no runtime result                     |
| R58.12 | documentation    | Originating SenseNova-U1 spatial decoder implementation                                                                     | OpenSenseNova / SenseNova-U1 authors        | 2026; first public 2026-09-24; inspected c35c83b58ef6e238a08b986aa58f3b73303aa42f, 2026-09-24 | [inspected source](https://github.com/OpenSenseNova/SenseNova-U1/blob/c35c83b58ef6e238a08b986aa58f3b73303aa42f/src/sensenova_u1/models/neo_unify/modeling_fm_modules.py) | https://github.com/OpenSenseNova/SenseNova-U1                       | official documentation | 2026-10-25 | Static Pixel Shuffle/convolution construction; active checkpoint class selection and execution unverified                                          |
| R58.13 | paper            | Setting-Matched and Semantics-Scaled Benchmarking of One-Step Generative Models Against Multistep Diffusion and Flow Models | Advaith Ravishankar et al.                  | 2026; first public 2026-03-15; inspected 2603.14186v4, 2026-05-07                             | [inspected source](https://arxiv.org/html/2603.14186v4)                                                                                                                  | https://github.com/Harvard-AI-and-Robotics-Lab/FairBenchmarkingFlow | preprint               | 2026-10-25 | Guidance/steps/conditioning comparison limits, component and scaled metrics, reimplementation discrepancy; v4 supersedes v1 composite              |

## R58.1

[PAPER-REPORTED] **MacTok: Robust Continuous Tokenization for Image Generation.** First public evidence 2026-03-31; inspected revision 2603.29634v1, dated 2026-03-31; accessed 2026-10-25. Exact locators: Secs.3-4; Tables1-6; Appendices A.1-A.3/B/C. [Primary source](https://arxiv.org/html/2603.29634v1).

[DERIVED] Appendix A.2 Eqs.12-14 omit conditions required for expected-log/marginal-log equality and marginal factorization. The chapter derives the valid information penalty and conditional anti-collapse criterion instead of repeating a universal guarantee. Table 1/2 tokenizer and generator capacities differ; guidance and reconstruction/generation axes remain separate.

## R58.2

[PAPER-REPORTED] **Multimodal Flow: Unified Flow Modeling of Language and Vision in Embedding Spaces.** First public evidence 2026-09-30; inspected revision 2609.40362v1, dated 2026-09-30; accessed 2026-10-25. Exact locators: Secs.2-3; Tables4/7-10; Appendices B-C. [Primary source](https://arxiv.org/html/2609.40362v1).

[DERIVED] Table 4 is the50B+5B controlled study, distinct from 150B+5B main benchmarks. Frozen codecs are excluded from parameter matching. Appendix B.3 clamps endpoint conversion at0.05. Eq.10 vector-norm notation and R58.11 channel-mean implementation are not silently equated; active configuration provenance remains unresolved. External GPT-2 perplexity is not model likelihood.

## R58.3

[PAPER-REPORTED] **Discrete Diffusion Bridges for Spatiotemporally Aligned Image Translation and Generation.** First public evidence 2026-08-30; inspected revision 2608.29997v1, dated 2026-08-30; accessed 2026-10-25. Exact locators: Sec.3 Eqs.4-9; Tables4-7; Appendix S2.2/S3. [Primary source](https://arxiv.org/html/2608.29997v1).

[DERIVED] The source token is an unresolved anchor, not an already committed target. The training difficulty map uses target information only during training. Its information normalization has a zero-denominator edge case not resolved by the inspected text; the chapter's uniform fallback is an explicit reference-implementation requirement. Target variance/pixel difference are heuristic difficulty maps, not Shannon information guarantees. Source table conclusions do not establish strict preservation on all outputs.

## R58.4

[PAPER-REPORTED] **Rethinking UMM Visual Generation: Masked Modeling for Efficient Image-Only Pre-training.** First public evidence 2026-03-17; inspected revision 2603.16139v1, dated 2026-03-17; accessed 2026-10-25. Exact locators: Sec.3; Tables1-3; Appendix B; Sec.4.4 ablations. [Primary source](https://arxiv.org/html/2603.16139v1).

[DERIVED] Image-only refers to generative pretraining, not all inherited training or downstream alignment. Table 1 abstract/prose comparator values are inconsistent in places; manuscript uses actual displayed rows for the stated case and avoids a global SOTA claim. Table 2 image-only finetuning negatives are retained. Official-code URL was followed from the originating text, without runtime inspection.

## R58.5

[PAPER-REPORTED] **Foley-Flow: Coordinated Video-to-Audio Generation with Masked Audio-Visual Alignment and Dynamic Conditional Flows.** First public evidence 2026-03-09; inspected revision 2603.08126v1, dated 2026-03-09; accessed 2026-10-25. Exact locators: Secs.3.1-3.3/4.1-4.3; Table 1. [Primary source](https://arxiv.org/html/2603.08126v1).

[DERIVED] Sec.4.1 10s/8kHz/50ms/25ms does not reconstruct128 temporal bins under ordinary STFT framing;399 frames result without padding. A missing resize/crop may explain it, but remains undisclosed. Sec.3's normalizing-flow/velocity language and equations do not supply a complete invertible architecture, log determinant, transport loss and numerical sampler. Reported values remain source claims with these reproduction limits.

## R58.6

[PAPER-REPORTED] **SenseNova-U1.5: Towards Native Unified Visual Intelligence.** First public evidence 2026-09-10; inspected revision 2609.11929v1, dated 2026-09-10; accessed 2026-10-25. Exact locators: Sec.3.1-3.3; Tables1-2/8-9; Sec.5. [Primary source](https://arxiv.org/html/2609.11929v1).

[DERIVED] Table 1 lists separate8.2B understanding and8.2B generation components; model labels in benchmark tables are not total resident-parameter counts. Native/no-external-VAE does not prove lossless information preservation. Same-state on-policy consolidation uses 30-step trajectories, not one-step acceleration. Tables8-9 include lower diversity relative to the predecessor, so improvements are not uniform.

## R58.7

[PAPER-REPORTED] **From Local Mismatch to Global Impact: Optimizing Cache Reuse Policy for Efficient Diffusion.** First public evidence 2026-08-13; inspected revision 2608.13043v1, dated 2026-08-13; accessed 2026-10-25. Exact locators: Sec.3 Theorems3.2-3.4; Sec.4 Table 1; Appendices A.1-A.3/D.1-D.4/G. [Primary source](https://arxiv.org/html/2608.13043v1).

[DERIVED] Proxy-weight learning is empirically useful but no longer the proved bound without additional constraints. Table 1 improves base-output similarity over selected caches while some VBench comparisons regress. Appendix D.3's minutes-scale component and Table 5's hours/multi-H100 full calibration must be separated. Approximate trained-policy/proxy and deployment runtime provenance remain unexecuted. The degree-d Bernstein basis is written with binomial coefficient d choose nu in the chapter; source Eq.17 prints an inconsistent n.

## R58.8

[PAPER-REPORTED] **On the Robustness of Distribution Support under Diffusion Guidance.** First public evidence 2026-05-08; inspected revision 2605.07220v2, dated 2026-05-22; accessed 2026-10-25. Exact locators: Assumptions3.1-3.2; Theorems3.1-3.2/4.1; Remarks3.2-3.4; Secs.5-6. [Primary source](https://arxiv.org/html/2605.07220v2).

[DERIVED] Record first releaseMay8 and inspected v2May22; the HTML body displays a separate later manuscript date, which is not substituted for arXiv history. Exact scores, disjoint convex compact full-dimensional component supports and terminal fine-step limit are material assumptions. Nonconvex numerical examples do not prove a nonconvex theorem; distribution support does not establish calibrated density or semantic validity.

## R58.9

[PAPER-REPORTED] **Depth as Time in One-Step Generative Models.** First public evidence 2026-10-02; inspected revision 2610.03626v1, dated 2026-10-02; accessed 2026-10-25. Exact locators: Secs.3-5; Appendices B.1-B.2/C.1-C.5; Tables1-3. [Primary source](https://arxiv.org/html/2610.03626v1).

[DERIVED] Appendix B readout/random-probe/held-out-mixing controls were inspected. A one-block27.6M student repeats24 times and uses two CFG passes; teacher uses embedded guidance. The16.6x parameter ratio is not a compute/latency ratio. Appendix C reports large degradation when coarser internal steps were not trained, and fixed versus elastic tradeoffs.

## R58.10

[PAPER-REPORTED] **Calibrate What You SHIP: Post-Selection Risk Control for Verifier-Guided Text-to-Image Generation.** First public evidence 2026-08-22; inspected revision 2608.21748v1, dated 2026-08-22; accessed 2026-10-25. Exact locators: Sec.3 Eqs.3-8/Proposition2; Sec.4.1/Table 1; Appendices A/B/E/J. [Primary source](https://arxiv.org/html/2608.21748v1).

[DERIVED] Formal fixed-grid simultaneous control and descriptive pointwise-scanned operating points are explicitly distinguished. The soft target loss is a judge-dependent score, not a human binary error rate. Table 1 lower risk also lowers coverage and can increase compute; pooled rows do not form valid certificates. Cached-stream resplits/bootstraps are not independent generation runs. Adaptive trajectory changes require exact new evaluation.

## R58.11

[OFFICIAL-DOCUMENTATION] **Originating Multimodal Flow implementation.** First public evidence 2026-10-08; inspected revision c84caf50fc3da57e30d5984a4d99dee81f8b0c43, dated 2026-10-08; accessed 2026-10-25. Exact locators: src/mf/latents/flow.py; latents/time.py; training/losses.py; inference/pipeline.py; modeling/chunk_causal_layout.py. [Primary source](https://github.com/hustvl/Multimodal-Flow/tree/c84caf50fc3da57e30d5984a4d99dee81f8b0c43).

[DERIVED] Inspected via authenticated read-only GitHub connector. flow.py interpolate_with_noise; time.py sample_shifted_clean_t; losses.py x0_to_velocity, velocity_mse_values and masked_velocity_mse_loss; pipeline.py _block_session_factory; chunk_causal_layout.py validate_cache_identity. Source validates some shapes and CUDA/dtype restrictions; no execution or guarantee of benchmark/config identity. The latent channel average and configurable token/sample reductions are recorded explicitly.

## R58.12

[OFFICIAL-DOCUMENTATION] **Originating SenseNova-U1 spatial decoder implementation.** First public evidence 2026-09-24; inspected revision c35c83b58ef6e238a08b986aa58f3b73303aa42f, dated 2026-09-24; accessed 2026-10-25. Exact locators: src/sensenova_u1/models/neo_unify/modeling_fm_modules.py: ConvDecoder and other decoder classes. [Primary source](https://github.com/OpenSenseNova/SenseNova-U1/blob/c35c83b58ef6e238a08b986aa58f3b73303aa42f/src/sensenova_u1/models/neo_unify/modeling_fm_modules.py).

[DERIVED] Inspected via read-only GitHub connector. ConvDecoder uses factors2,2,8 and3x3 convolutions. Several alternative classes remain in the same file; no checkpoint was loaded to verify active selection. Code comments can have stale shape descriptions; actual module dimensions, not comments, determine the static tensor calculation.

## R58.13

[PAPER-REPORTED] **Setting-Matched and Semantics-Scaled Benchmarking of One-Step Generative Models Against Multistep Diffusion and Flow Models.** First public evidence 2026-03-15; inspected revision 2603.14186v4, dated 2026-05-07; accessed 2026-10-25. Exact locators: Secs.3-5; Tables3-4; Appendices C/L. [Primary source](https://arxiv.org/html/2603.14186v4).

[DERIVED] Unversioned history shows v1March15/v2March28/v3April2/v4May7. v1 used MMHM; v4 uses semantics-scaled component metrics. Only v4's current construction supports manuscript claims. Same nominal CFG and step counts are not common effective guidance or equal compute. Appendix C discrepancies limit baseline replication, and label-ID versus templated-text conditions remain a documented confounder.

## Excluded foundations and remaining evidence

[DERIVED] Historical diffusion, VQ, flow matching, original JEPA and autoregressive foundations remain owned by earlier canonical chapters. First-release eligibility was checked rather than inferred from a2026 venue. Pre-window MAETok, original MeanFlow, original V-JEPA2, Emu3 and January2026 Scale-RAE are contextual comparator names only, not newly inspected research sources or independently verified current results. Their appearances inside a retained paper do not establish a fresh evidence record.

[UNVERIFIED] Complete runtime environments, checkpoint-to-config provenance, training/inference replication, independent evaluator audits, device energy and monetary measurements remain unexecuted. Source-specific gaps above determine which replication/comparison claims must remain unresolved. No ledger entry upgrades the chapter from manuscript_draft.
