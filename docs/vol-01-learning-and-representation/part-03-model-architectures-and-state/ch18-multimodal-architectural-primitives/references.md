---
id: ms.references.18
entity_type: references
title: References — multimodal architectural primitives
short_title: References
volume: 1
part: 3
chapter: 18
section: null
slug: references
parent: ms.chapter.18
prev_sibling: ms.verification.18
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
siblings_by_mechanism: []
relations: []
axes:
  lifecycle: [pretraining, adaptation, inference, evaluation]
  mechanism: [multimodal_interfaces]
  feedback_setting: []
  modality: [text, image, audio, video, action]
papers: [P44, P45, P47]
implementations: []
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, DERIVED, MATHEMATICALLY-DERIVED, UNVERIFIED, NOT-DISCLOSED]
  empirically_observed: false
word_count_target: 1200
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# References — multimodal architectural primitives

All entries below were inspected as full texts on **2026-10-08**. The version is part of the primary URL. Method/experiment locators identify the claims used in the manuscript; they do not imply independent replication. Relevant equations, tables and appendices were read directly. No repository commit was executed, no result is CODE-VERIFIED, and no source was upgraded to current implementation behavior merely because its paper is recent.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P44 | paper | Learning Transferable Visual Models From Natural Language Supervision | Radford et al. / OpenAI | ICML 2021 | https://arxiv.org/html/2103.00020v1 | https://github.com/openai/CLIP | preprint | Inspected v1, 26 Feb 2021; §2.3 symmetric in-batch contrastive objective and learned logit scale; §§2.4–2.5 encoders/training; §3.1 prompts/zero-shot evaluation; §3.2 and Appendix A linear probes; §3.3 distribution shift. Sections 18.3–18.4. | 2026-10-08 |
| P45 | paper | BLIP-2: Bootstrapping Language-Image Pre-training with Frozen Image Encoders and Large Language Models | Li, Li, Savarese, Hoi / Salesforce AI Research | ICML 2023 | https://arxiv.org/html/2301.12597v3 | https://github.com/salesforce/LAVIS | preprint | Inspected v3, 15 Jun 2023; §3.1 query architecture; §3.2 contrastive/generative/matching masks; §3.3 OPT versus FlanT5 conditioning; §3.4 data, steps and precision; §4.1 Table 2 zero-shot VQA prompts/results; §4.4 Table 6 COCO retrieval-finetuning objective ablation. Sections 18.2, 18.4. | 2026-10-08 |
| P47 | paper | V-JEPA 2: Self-Supervised Video Models Enable Understanding, Prediction and Planning | Assran et al. / Meta AI / FAIR | technical report 2025 | https://arxiv.org/html/2506.09985v1 | https://github.com/facebookresearch/vjepa2 | preprint | Inspected v1, 11 Jun 2025; §2.1 latent L1 objective/EMA targets; §§2.2–2.3 scale/data experiments and frozen attentive-probe protocol; §3 distinct frozen-encoder action-conditioned stage; §§5–7 classification, prediction, video-language adaptation. Sections 18.4, 18.6. | 2026-10-08 |
| R18.1 | paper | An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale | Dosovitskiy et al. / Google Research | ICLR 2021 | https://arxiv.org/html/2010.11929v2 | https://github.com/google-research/vision_transformer | preprint | Inspected v2, 3 Jun 2021; §3.1 patch projection/class and position embeddings, Eqs. 1–4; §3.2 resolution/position interpolation; §4 classification and pretraining-scale experiments, §4.3 Figures 3–4 data requirements. Section 18.1. | 2026-10-08 |
| R18.2 | paper | Flamingo: a Visual Language Model for Few-Shot Learning | Alayrac et al. / DeepMind | NeurIPS 2022 | https://arxiv.org/html/2204.14198v1 | null | preprint | Inspected v1, 29 Apr 2022; §3.1.1 NFNet-F6, video sampling and 64-query resampler with appended latent keys/values; §§3.1.2–3.1.3 zero-initialized tanh gates and immediate-image cross-attention; §3.2 mixture; §4.1.4/Appendix A.1.2 M3W index augmentation; §4.4 Table 7 conditioning/resampling ablations; Appendix C.3 evaluation/support subsets. Sections 18.2–18.3. | 2026-10-08 |
| R18.3 | paper | Robust Speech Recognition via Large-Scale Weak Supervision | Radford et al. / OpenAI | ICML 2023 | https://arxiv.org/html/2212.04356v1 | https://github.com/openai/whisper | preprint | Inspected v1, 6 Dec 2022; §§2.1–2.2 30-second windows, 16 kHz log-Mel preprocessing and convolutional stem; §2.3 timestamp/task-token conventions; §4.5 long-form windowing, heuristics and evaluation. Later release changes are not attributed to this initial configuration. Sections 18.1, 18.5. | 2026-10-08 |
| R18.4 | paper | High Fidelity Neural Audio Compression | Défossez, Copet, Synnaeve, Adi / Meta AI / FAIR | TMLR 2023 | https://arxiv.org/html/2210.13438v1 | https://github.com/facebookresearch/encodec | preprint | Inspected v1, 24 Oct 2022; §§3.1–3.2 encoder strides, latent rate, RVQ/codebook convention; §§3.3–3.4 entropy model and loss balancing; §4 listening/objective evaluation; §4.6 Table 5 initial buffering/CPU real-time factors with stated boundary. Sections 18.1, 18.4–18.5. | 2026-10-08 |
| R18.5 | paper | Visual Instruction Tuning | Liu, Li, Wu, Lee / Microsoft Research, University of Wisconsin–Madison, Columbia University | NeurIPS 2023 | https://arxiv.org/html/2304.08485v2 | https://github.com/haotian-liu/LLaVA | preprint | Inspected v2, 11 Dec 2023; §3 synthetic instruction construction; §4.1 original linear projection; §4.2 two-stage training, 595k alignment pairs and assistant-token objective. Later LLaVA architectures are not inferred from this source. Sections 18.2, 18.4. | 2026-10-08 |
| R18.6 | technical report | Qwen2.5-Omni Technical Report | Qwen Team / Alibaba Qwen | technical report 2025 | https://arxiv.org/html/2503.20215v1 | https://github.com/QwenLM/Qwen2.5-Omni | preprint | Inspected v1, 26 Mar 2025; §2.2 encoder/time representations and TMRoPE; §2.3 Thinker-to-Talker interface; §2.4 blockwise streaming/lookahead; §3 stage boundaries; §5 separate text/audio/image/video/audiovisual/speech evaluation tables. Sections 18.2–18.3, 18.5. | 2026-10-08 |
| R18.7 | paper | PaLM-E: An Embodied Multimodal Language Model | Driess et al. / Google Research, TU Berlin | ICML 2023 | https://arxiv.org/html/2303.03378v1 | null | preprint | Inspected v1, 6 Mar 2023; §§3–4 continuous observations in language embeddings; §6.2 Table 1 TAMP mixtures/representations/frozen language model; §6.3 language subgoals and separate low-level policies; §6.6 Figure 6 and Appendix Table 8 retention versus inherited PaLM. Prose reports 3.9% largest-model NLG degradation whereas Table 8 lists 3.8%; discrepancy retained. Sections 18.1, 18.6. | 2026-10-08 |
| R18.8 | paper | Masked Autoencoders Are Scalable Vision Learners | He et al. / Meta AI / FAIR | CVPR 2022 | https://arxiv.org/html/2111.06377v3 | https://github.com/facebookresearch/mae | preprint | Inspected v3, 19 Dec 2021; §3 visible-only encoder, full-position decoder, masked-pixel loss and normalized targets; §4.1 masking/target ablations; §4.3 partial fine-tuning/linear-probe distinction. Section 18.4. | 2026-10-08 |
| R18.9 | paper | ImageBind: One Embedding Space To Bind Them All | Girdhar et al. / Meta AI / FAIR | CVPR 2023 | https://arxiv.org/html/2305.05665v1 | https://github.com/facebookresearch/ImageBind | preprint | Inspected v1, 9 May 2023; §3 image-paired contrastive training, modality encoders and frozen image/text paths; §4 zero-shot/retrieval evaluation; §5 Table 5 spatial/temporal alignment and augmentation ablations; §5.1 fixed-other-encoder image scaling. Sections 18.5–18.6. | 2026-10-08 |
| R18.10 | paper | RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control | Brohan et al. / Google DeepMind | CoRL 2023 | https://arxiv.org/html/2307.15818v1 | null | preprint | Inspected v1, 28 Jul 2023; §3.2 eight-component action convention, 256-bin discretization and vocabulary mapping; §3.3 inference/control boundary; §4 robot evaluation protocol and limitations. The illustrative integer string is not used as an eight-component schema. Section 18.1. | 2026-10-08 |

## Source interpretation

The status column records the inspected artifact: a versioned preprint/full-text report even where the venue column identifies publication context. Official-code links identify author-supplied surfaces referenced by the papers; their contents and current HEAD behavior were not inspected or executed for this chapter. A link is not a commit pin.

Patch injectivity, index-rate accounting, connector chain rules, attention interactions, gating derivatives, loss gradients, conditional mean/median characterizations, clock-error propagation and local gradient interference are explained as book derivations with explicit premises. They are not attributed as experimental results or verbatim source proofs.

## Evidence gaps

Independent numerical reproduction is UNVERIFIED. No common data/pretraining history, hardware, precision, runtime, concurrency or cost boundary spans the compared systems. Source-specific results retain their task/protocol meanings. Longitudinal missing-modality robustness, capture-clock synchronization and complete component-factorial effects are not established by these cross-paper comparisons. The PaLM-E prose/table rounding discrepancy is visible above; this manuscript does not resolve it by inventing unrounded scores.
