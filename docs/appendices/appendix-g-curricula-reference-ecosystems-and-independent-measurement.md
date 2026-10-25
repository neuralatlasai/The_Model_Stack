---
id: ms.appendix.g
entity_type: appendix
title: "Curricula, reference ecosystems, and independent measurement"
short_title: Appendix G
volume: null
part: null
chapter: null
section: null
slug: appendix-g-curricula-reference-ecosystems-and-independent-measurement
parent: ms.appendices
prev_sibling: ms.appendix.f
next_sibling: ms.appendix.h
children: []
prerequisites: []
downstream: []
related: [ms.chapter.6, ms.chapter.66]
relations: []
axes: {lifecycle: [evaluation, assurance], mechanism: [evidence_audit, provenance], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Appendix G — Curricula, reference ecosystems, and independent measurement

[DERIVED] Curricula provide learning sequences and implementation exercises. Measurement platforms provide observations under their own protocols. Artifact hubs and citation tools provide discovery. These roles have different evidentiary force: a course ordering does not prove optimality, a popularity count does not validate a method, and an endpoint benchmark is not an intrinsic constant of its model name.

## Curriculum map

| Resource | Main role | Mapping into this book |
|---|---|---|
| [Stanford CS336, Spring 2026](https://cs336.stanford.edu/) | Implementation-driven language-model construction | Tokenizer/model/optimizer → 03–05, 10, 19–20; systems → 25–30; scaling → 21; data → 07–12; alignment/reasoning → 31–35 |
| [CS336, Spring 2025 archive](https://cs336.stanford.edu/spring2025/) | Stable prior curriculum/assignment reference | Compare versioned exercises and preserve reproducibility |
| [Stanford CS224N](https://web.stanford.edu/class/cs224n/) | NLP/deep-learning foundations | 02, 04–05, 10, 13–18, 49–50 |
| Stanford CS25 | Research talks and evolving Transformer/foundation-model topics | Supplementary mechanism and case-study discovery; pin the talk and year |
| Stanford CS324 / foundation-model courses | Broader foundation-model lifecycle and impacts | 01, 06–12, 21, 61–66; use the specific archived offering |
| [Deep Learning Systems](https://dlsyscourse.org/) | Framework, automatic differentiation, and systems implementation | 03, 25–29 |
| [Berkeley deep RL course](https://rail.eecs.berkeley.edu/deeprlcourse/) | Sequential decision-making and RL foundations | 34–36, 52, 59–60 |
| Full Stack Deep Learning | Application/system lifecycle studies | 46–54, 63–66; pin the course edition |
| Official implementation tutorials | PyTorch/JAX, Hugging Face, vendor/kernel/runtime documentation | Implementation references; never substitute tutorial claims for measured performance |

[DERIVED] The map preserves the plan's coverage targets. Pin a specific archived offering, assignment revision and dependency environment before reproducing an exercise. A course home page can change. The historical CS336 handout account in Chapter 10 identifies its version but lacks a recorded original checksum; the bibliography explicitly retains that reproducibility limit. This appendix does not claim that every current offering has the same syllabus.

## Measurement and discovery routes

| Source | Appropriate use | Boundary on interpretation |
|---|---|---|
| [Artificial Analysis](https://artificialanalysis.ai/methodology) | Model/endpoint evaluations, performance methodology, and cost/performance comparisons | Record workload, date, provider, and token-counting conventions; endpoint results are not intrinsic model constants |
| [Epoch AI](https://epoch.ai/data) | Compute/hardware/data-center/economic trends and capability/benchmark measurement | Preserve estimation methods, uncertainty, measured versus estimated fields, and benchmark scope |
| [Arena methodology](https://arxiv.org/abs/2403.04132) | Pairwise human-preference evidence | Voting population, task mixture, model identities, and statistical uncertainty constrain interpretation |
| [Hugging Face](https://huggingface.co/) | Model/dataset artifacts, cards, code links, papers, and community discovery | Likes, downloads, or paper votes measure attention, not scientific validity |
| [arXiv](https://arxiv.org/) | Primary manuscript discovery and version history | Submission does not imply peer review; inspect revisions and later publication |
| [OpenReview](https://openreview.net/) | Papers, reviews, decisions, and public discussion where available | Distinguish submission, review, and acceptance; venue policies vary |
| [Semantic Scholar](https://www.semanticscholar.org/) | Citation graph and literature discovery | Retrieve the primary work before making a technical claim |
| Papers with Code references | Historical paper–implementation links and previously collected records | Resolve to the actual paper and repository; verify current availability before using it as a maintained discovery dependency |

## Minimum external measurement record

| Boundary | Required record |
|---|---|
| Measured object | Exact model/endpoint/artifact, provider, time window and revision where disclosed |
| Workload | Task/prompt population, languages/modalities, length/output convention and permitted tools or reasoning budget |
| Units | Tokenizer/token-count convention, byte normalization, wall-clock/device time, offered/successful denominator and currency convention |
| State | Cache/warmup, concurrency/arrival process, retries, service errors, missing/censored trials and hidden configuration |
| Estimation | Aggregation, independent sample units, uncertainty, selection/multiplicity and any extrapolation |
| Provenance | Raw or released observations, collection protocol and restrictions; distinguish measured fields from estimates and unknown values |

[DERIVED] Throughput comparisons require matching the token convention. A platform's normalized tokens/sec, a provider's native output tokens/sec and a byte-normalized rate can differ for the same text. Recover the precise methodology and time window before comparing values; this index contains no newly measured endpoint ranking or price recommendation.

## A reproducible study route

[DERIVED] Start from a precise question and primary method, then choose an exercise or tutorial that exposes its implementation boundary. Build an original controlled capstone using an attributed, frozen dataset and a qualified evaluator. Record failures and negative controls. Use discovery tools to find competing explanations and independent reproductions; retrieve the primary work before treating a citation summary as technical evidence.

[DERIVED] Chapter 6 owns experimental design, Chapter 48 owns system measurement, Chapters 61–63 own capability/reliability estimands and Chapter 66 owns release evidence. Appendices I and J preserve the supplied supplemental evaluation and forecasting source indexes. Neither their ordering nor this curriculum map assigns a scientific-quality score.
