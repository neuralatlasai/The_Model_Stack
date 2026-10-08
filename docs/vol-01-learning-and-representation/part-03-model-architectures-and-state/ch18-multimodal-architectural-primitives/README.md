---
id: ms.chapter.18
entity_type: chapter
title: Multimodal architectural primitives
short_title: Multimodal primitives
volume: 1
part: 3
chapter: 18
section: null
slug: ch18-multimodal-architectural-primitives
parent: ms.part.3
prev_sibling: ms.chapter.17
next_sibling: ms.chapter.19
children: [ms.section.18.1, ms.section.18.2, ms.section.18.3, ms.section.18.4, ms.section.18.5, ms.section.18.6, ms.verification.18, ms.references.18]
prerequisites: [ms.chapter.4, ms.chapter.10, ms.chapter.13, ms.chapter.14, ms.chapter.15, ms.chapter.16, ms.chapter.17]
downstream: [ms.chapter.19, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60]
related: [ms.chapter.23, ms.chapter.24]
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
word_count_target: 900
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

VOLUME I / PART III — MODEL ARCHITECTURES AND STATE / CHAPTER 18

# 18 — Multimodal architectural primitives

A multimodal model is specified by the information its encoders preserve, the interfaces through which modalities condition one another, the targets used to train those interfaces, and the time and missingness conventions under which it operates. A common embedding width does not make image patches, acoustic frames, codec symbols, spatial states and robot commands interchangeable. Their shapes, coordinate supports and decoding meanings must remain explicit.

6 sections · 13 inspected primary full texts · prerequisites: Chapters 04, 10, 13–17 · artifact: a modality-to-model interface specification · updated 2026-10-08

## Why this chapter exists

PAPER-REPORTED · CLIP demonstrates independent image/text encoding for paired retrieval and zero-shot classification; BLIP-2 connects frozen pretrained components through learned queries; V-JEPA 2 predicts video representations and separately learns an action-conditioned predictor (P44, §§2–3; P45, §3; P47, §§2–3). DERIVED: these are different conditional graphs, not variants distinguished solely by the number of modalities. Explaining their behavior requires the representation, dependency masks, objective, trainability and evaluation adaptation together.

## Scope and boundaries

The chapter owns architectural primitives shared by image, audio, video, spatial and action-conditioned models. It does not enumerate every model family or claim a contemporary ranking. Historical papers establish precisely dated mechanisms; the inspected 2025 reports add video-latent prediction and an audiovisual/speech branching example. Chapters 55–59 develop modality-specific systems, and Chapter 60 develops embodied policies, and Chapter 19 develops the general training loop. The present manuscript derives interface and cost relationships from explicit conditions and attributes experimental findings to their published protocols.

## Chapter map

| Section | Technical subject | Resulting specification |
|---|---|---|
| [18.1 Modality representation](18-1-modality-representation.md) | patches, latent features, audio frames/codecs, video supports, spatial coordinates and action quantization | source-to-feature map with shapes, units, supports and inverse conventions |
| [18.2 Encoders and adapters](18-2-encoders-and-adapters.md) | linear projection, fixed-query resampling, Q-Former masks and staged freezing | component trainability and differentiability graph |
| [18.3 Fusion](18-3-fusion.md) | concatenation, late combination, directional attention, interleaving and branches | admissible dependency graph and cache ownership |
| [18.4 Learning objectives](18-4-learning-objectives.md) | contrastive pairing, conditional likelihood, masked pixels, latent targets and reconstruction | target construction, loss normalization and persistent teacher/codebook state |
| [18.5 Sequence and time alignment](18-5-sequence-and-time-alignment.md) | clock conversion, timestamps, sampling, temporal positions and lookahead | event support, position coordinate and availability/deadline contract |
| [18.6 Transfer and interference](18-6-transfer-and-interference.md) | mixture exposure, forgetting, bottlenecks, missing modalities and cross-modal endpoints | retained-task portfolio and component attribution record |

## Reading the evidence

PAPER-REPORTED marks inspected source methods and observations. MATHEMATICALLY-DERIVED marks conditional algebra or statistical consequences explained in the section. DERIVED marks book synthesis and interface methodology. UNVERIFIED marks claims requiring additional execution or evidence; NOT-DISCLOSED marks a missing common disclosure, not a guessed value. The sources' methods and experiments appear in the topic manuscripts. The proposed freeze/unfreeze study is confined to [Verification](verification.md) and is unexecuted.

The central distinction is between a component's capacity and a measured effect. A rank calculation can establish that a linear map is noninjective on its full input space. It cannot tell which natural-data distinction is lost or whether a task needs it. Likewise, a timestamp grid establishes representable coordinates, while synchronization accuracy requires measurements. The chapter keeps these mathematical consequences separate from reported task outcomes.

## Reference-stack coverage

The following exact reference-stack routes identify source provenance. Conference routes classify the methods' publication contexts; source verification here used the pinned full texts listed in the reference ledger, rather than treating a venue or lab name as evidence.

| Stack section / index | Exact name and listed surface | Layer / use in this chapter | Evidence boundary |
|---|---|---|---|
| §1 / 2 | OpenAI — https://openai.com/research/index/publication/ | representation, contrastive training, speech transcription; CLIP and Whisper | PAPER-REPORTED from inspected full texts |
| §1 / 3 | Google DeepMind — https://deepmind.google/research/publications/ | visual conditioning and action interfaces; Flamingo and RT-2 | PAPER-REPORTED from inspected full texts |
| §1 / 4 | Meta AI / FAIR — https://ai.meta.com/results/?content_types%5B0%5D=publication | codec, masked/latent objectives and modality binding; EnCodec, MAE, ImageBind, V-JEPA 2 | PAPER-REPORTED from inspected full texts |
| §1 / 5 | Alibaba Qwen — https://qwenlm.github.io/ | multimodal architecture and temporal interface; Qwen2.5-Omni | PAPER-REPORTED from inspected report |
| §1 / 13 | Microsoft Research / Microsoft AI — https://www.microsoft.com/research/publications/ | originating coauthor route for original LLaVA | PAPER-REPORTED from inspected full text |
| §1 / 18 | Google Research — https://research.google/pubs/ | patch representation and embodied mixed interfaces; ViT and PaLM-E | PAPER-REPORTED from inspected full texts |
| §1 / 23 | Salesforce AI Research — https://www.salesforceairesearch.com/research | staged query-transformer adaptation; BLIP-2 | PAPER-REPORTED; book-plan anchor |
| §2 / 1–3, 5 | NeurIPS, ICML, ICLR, CVPR — https://proceedings.neurips.cc/ ; https://proceedings.mlr.press/ ; https://openreview.net/group?id=ICLR.cc/2026/Conference ; https://openaccess.thecvf.com/CVPR2026 | source-route taxonomy; no conference-index ranking is used | routes only; inspected versions are identified separately |
| §3 / 1 | arXiv — https://arxiv.org/ | versioned full-text inspection and source locators | retrieval surface; claims attributed to the originating papers |
| §4 / systems | no implementation version is claimed | the chapter analyzes algorithms/interfaces rather than an executed framework release | UNVERIFIED for implementation/runtime behavior |

The §4.2 inspection dimensions applied are objective and supervision, architecture and representation, data, optimization, inference procedure, evaluation and reproducibility, plus resource boundaries where the sources provide them. No CODE-VERIFIED or EMPIRICALLY-OBSERVED claim is made. Framework names are not substituted for inspected algorithms.

## Artifact and audit status

The interface artifact records source shapes and physical units; encoding and normalization; feature layer and query count; trainability per stage; attention and target masks; positions, clock conversion and availability; codebook and inverse action maps; missing-input behavior; and evaluation/resource boundaries. [Verification](verification.md) gives the proposed protocol and topic-by-topic coverage audit. [References](references.md) records all 13 inspected versions and claim locators.

Editorial status remains manuscript_draft. Source methods and reported studies have been inspected, but no primary result was independently reproduced, no source repository commit was executed, and no cross-paper matched workload supports a universal architectural comparison.
