---
id: ms.references.57
entity_type: references
title: "Chapter 57 references"
volume: 3
part: 10
chapter: 57
section: null
slug: references
parent: ms.chapter.57
prev_sibling: ms.verification.57
next_sibling: null
children: []
prerequisites: [ms.chapter.15, ms.chapter.18, ms.chapter.55, ms.chapter.56]
downstream: [ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.63]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.53]
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [temporal_representation, streaming_state, evidence_grounding], feedback_setting: [], modality: [video, audio, text]}
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 57 references

[DERIVED] Every primary text below was inspected on **2026-10-25**. Newly introduced research first appeared within **2026-03-01–2026-10-24**. First public evidence and inspected revision are separate fields in the keyed notes. Earlier plan anchors remain retrieval context, with foundations linked to their canonical book chapters rather than recast as new eligible evidence.

## References

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R57.1 | paper | The Shape of Time: Video-Token Contrast for Temporal Understanding in VideoLMs | Yumeng Shi; Quanyu Long; Yin Wu; Wenya Wang | arXiv /2026 | https://arxiv.org/html/2609.04110v1 | — | preprint |2026-10-25 | §§3.2–3.4,Eqs. 3–12; §4 Tables 1–3; Appendix B; view construction, contrastive representation, matched objective and regressions |
| R57.2 | paper | AV-SyncBench: Decoupled Benchmarking of Temporal and Semantic Audio-Visual Synchronization | Tianhong Zhou et al. | arXiv /2026 | https://arxiv.org/html/2607.00726v1 | https://fgt7t6g.github.io/AV-SyncBench | preprint |2026-10-25 | §§2.1–2.3,3.1–3.2,Tables 1–2; perturbation construction, chunk scores, hardware and pairwise accuracy |
| R57.3 | paper | CaST-Bench: Benchmarking Causal Chain-Grounded Spatio-Temporal Reasoning for Video Question Answering | Mingfang Zhang et al. | arXiv /2026 | https://arxiv.org/html/2605.23216v2 | https://woven-by-toyota.github.io/CaST-Bench | preprint |2026-10-25 | §§4.1–4.3,5.1–5.2,Tables 2–4,Supplement§12; chain filtering, matching, faithfulness and oracle-evidence access |
| R57.4 | paper | StreamOV: Streaming Omni-Video Understanding via Evidence-Guided Memory and Response Triggering | Ming Xie et al. | arXiv /2026 | https://arxiv.org/html/2605.25621v1 | — | preprint |2026-10-25 | §§3–5,Eqs. 1–5,Tables 1–2,Appendices H/J/K; evidence routing, memory update, actual prefill-only trigger and experiment context |
| R57.5 | paper | StreamArena: Toward Continuous, Interactive, and Long-Horizon Agentic Streaming Video Understanding | Xichen Zhang et al. | arXiv /2026 | https://arxiv.org/html/2608.05703v1 | — | preprint |2026-10-25 | §§2.1–2.2,3.3–3.4,4,Tables 4–5,Appendices C.5–C.7; persistent-worker design, latency boundary and environment disclosures |
| R57.6 | paper | LiveProBench: Can Streaming Video Models Really Interact Like Humans? | Kaixuan Du et al. | arXiv /2026 | https://arxiv.org/html/2609.12658v2 | — | preprint |2026-10-25 | §§2.1–2.4,3.1–3.2,Table 2; one-second full-sequence protocol, native silence, geometric score and inconsistent human aggregate |
| R57.7 | paper | Beyond Retrieval: Progressive Latent Memory Evolution for Streaming Video Understanding | Hongyu Qu et al. | arXiv /2026 | https://arxiv.org/html/2609.04131v1 | — | preprint |2026-10-25 | §§3.2–3.4,4.1–4.3,Eqs. 1–9,Tables 3–5,Fig.3; hierarchical retention, Gaussian latent search, source conditions and nonmonotonic budgets |
| R57.8 | paper | StreamPro: From Reactive Perception to Proactive Decision-Making in Streaming Video | Ao Li et al. | arXiv /2026 | https://arxiv.org/html/2605.16381v1 | — | preprint |2026-10-25 | §§3–5,Eqs. 1–5,Tables 3–7; control-token weighting, trajectory rewards, disclosed training setup and reactive-task trade-offs |
| R57.9 | technical report | Nemotron3 Nano Omni: Efficient and Open Multimodal Intelligence | NVIDIA | arXiv /2026 | https://arxiv.org/html/2604.24954v1 | — | preprint |2026-10-25 | §§2,4.6–4.8,Tables 12–13; tubelet/pruning integration, different execution boundaries, conditional performance and source inconsistency |
| R57.10 | paper | Decouple and Cache: KV Cache Construction for Streaming Video Understanding | Zhanzhong Pang; Dibyadip Chatterjee; Fadime Sener; Angela Yao | arXiv /2026 | https://arxiv.org/html/2605.01858v1 | https://github.com/pangzhan27/DSCache | preprint |2026-10-25 | §§4.1–4.3,5.1–5.4,Proposition4.2,Tables 1–2,Appendix B/E; relative-position conditions, recent/cumulative caches and accuracy trade-offs |
| R57.11 | paper | A Simple Baseline for Streaming Video Understanding | Yujiao Shen; Shulin Tian; Jingkang Yang; Ziwei Liu | arXiv /2026 | https://arxiv.org/html/2604.02317v1 | https://github.com/EvolvingLMMs-Lab/SimpleStream | preprint |2026-10-25 | §§3.2,4.1–4.4,5.1–5.3,Table 1; recent-frame comparator, visible-prefix controls and perception/memory trade-off |
| R57.12 | model card | Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16 model card | NVIDIA | Official model release /2026 | https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16/blob/e5e9932441de940c9a62185c870ea5bcd4cd24e2/README.md | — | official documentation |2026-10-25 | Release Date; Input(s); Software Integration; immutable card revision, declared limits and integration surfaces; no execution |

## R57.1

[PAPER-REPORTED] First arXiv release 2026-09-03; inspected v1. The abstract page notes EMNLP 2026 acceptance; this ledger cites the inspected preprint rather than claiming an inspected proceedings artifact. Method locators are §§3.2–3.4,Eqs. 3–12. Main Table 1 includes task regressions; Table 2 isolates the auxiliary objective. Source-reported negative sampling uses nonidentity normalized inversion distance up to0.5, with replacement if needed. Training data and layer/view choices are in §4/Appendix B.

## R57.2

[PAPER-REPORTED] First arXiv release 2026-07-01; inspected v1. The abstract notes Interspeech 2026 acceptance. §2 separates temporal and semantic edits; §2.3 defines the model-dependent score and original-versus-edited decision. §3.1 supplies two H20 GPUs,25-FPS video and 16-kHz audio. Table 2's pairwise accuracy is not a lag-error bound.

## R57.3

[PAPER-REPORTED] First arXiv release 2026-05-22; inspected v2 dated 2026-07-02, after first inspecting v1 for source discovery. The chapter's claims are bound to v2. §4.1 describes text-only and evidence-masking filters; §4.3 defines greedy instance matching and joint evidence/answer metrics; §5.1 identifies native-video versus sampled-frame paths and threshold 0.1. Table 4's ground-truth-chain condition has privileged evidence access.

## R57.4

[PAPER-REPORTED] First arXiv release 2026-05-25; inspected v1. §§4.1–4.2 give local rank-normalized evidence and short/long selection. Eq. 5 gives a general prefix-state trigger; the final §4.3 paragraph and §5 explicitly say the implementation uses only $h_{t,0}$. No autoregressive trigger-state steps are charged as necessary in that evaluated configuration, but prefill remains. §5 records the frozen backbone, trigger size and memory/hardware context.

## R57.5

[PAPER-REPORTED] First arXiv release 2026-08-06; inspected v1. §§2.1–2.2 separate benchmark and worker architecture. §3.3/Table 4 compares same-backbone query-to-answer latency and pooled accuracy while excluding continuous pre-query construction from that latency. Appendices C.5–C.7 describe worker defaults/launch overrides, shared serving endpoint, hardware/software, judge and seeds.

[UNVERIFIED] Appendix C.6 combines an Ubuntu22.04.4 label with an el8-tagged kernel string. This chapter preserves that disclosure inconsistency and does not claim to have reproduced the environment. Source code and data availability assertions are not runtime verification.

## R57.6

[PAPER-REPORTED] First arXiv release 2026-09-11; inspected v2 dated 2026-09-22. §§2.1–2.4 define the prefix horizon, one-second opportunities, first-response windows, exact duplicate counts and paired response/silence aggregation. §3 retains native silence mechanisms and uses audio-disabled rows for its primary comparison.

[DERIVED] Table 2 Human Agent components 90.3,96.3,87.5,98.9,85.9,83.6 average 90.4167%, matching table AVG 90.42. Adjacent prose states 92.99%. The manuscript records the discrepancy; no substitute result is invented and no universal human ceiling is inferred.

## R57.7

[PAPER-REPORTED] First arXiv release 2026-09-03; inspected v1. §§3.2–3.4 contain hierarchical consolidation, nested latent retrieval scopes and Gaussian score-function optimization. §4.1 gives the evaluated memory, candidate and evolution settings. Tables 3–5 separate components and reward choices; Fig.3 shows candidate/iteration sensitivity. These observations support a bounded comparison, not a theorem that entropy reduction yields correct answers.

## R57.8

[PAPER-REPORTED] First arXiv release 2026-05-11; inspected v1. §4.1 uses effective-frequency class weighting and a separate text scale; §4.2 combines format, turn and trajectory rewards. §5.1 supplies backbones, training hardware/durations, batches, learning rates and one-FPS inference. Table 3 reports a real-time-task decline after proactive RL, and Table 5 compares control-token losses. GRPO's general optimization machinery is owned by Chapter 34.

## R57.9

[PAPER-REPORTED] First arXiv report release 2026-04-27; inspected v1. §4.6 contains the new dated Conv3D/EVS integration and ablations. EVS itself is an older component; the report is not used to relabel its historical origin. Table 12 supplies synthetic media/concurrency and repeated-run boundaries. The exact GPU and serving commit are not explicitly bound locally to that table, so the manuscript does not silently import them from §4.8's separate suite.

[DERIVED] Table 13 gives BF16 TTFT5124 ms at pruning 0.7 and 5182 ms at 0.8, contradicting the nearby monotonic prose. Its run-level variance is not supplied in the inspected table. The manuscript treats the difference as an unresolved source observation, without assigning significance or a cause.

## R57.10

[PAPER-REPORTED] First arXiv release 2026-05-03; inspected v1. §§4.1–4.3 define position-agnostic storage, cumulative updates and instant cache construction. Proposition4.2 assumes relative-distance preservation. The immediately preceding discussion explicitly excludes the practical nonuniform re-indexing heuristic. §5.1/Table 2 gives the four/28-frame split and the compared accuracy settings; Appendix E addresses approximation/latency boundaries.

## R57.11

[PAPER-REPORTED] First identified arXiv public release 2026-04-02; inspected v1. The manuscript's internal date is April 1, which is not independently treated as proof of earlier public availability. §3.2 defines the recent-window construction; §4.1 retains model-specific pipelines under a shared visible prefix. §5 discusses recency, Visual-RAG and benchmark weighting. The protocol is not assumed to match all resource dimensions merely because the prefix matches.

## R57.12

[OFFICIAL-DOCUMENTATION] Declared public model release 2026-04-28; inspected immutable revision **e5e9932441de940c9a62185c870ea5bcd4cd24e2**, last modified 2026-08-24 according to the first-party model API. Repository creation 2026-04-20 does not establish when it became public. The versioned README was opened at that revision. It supports interface and release claims only; no checkpoint was downloaded or executed.

## Evidence boundaries and gaps

| Unresolved item | Consequence |
|---|---|
| No book model/encoder/streaming/serving benchmark execution | No independent reproduction, measured quality rating or validated runtime artifact |
| Unknown target event durations, query family and arrival-delay law | No universal sampler, retention policy or trigger threshold |
| Model scores and entropy are uncalibrated under the target population | No correctness certificate from confidence alone |
| Source-specific frame rates, backbones, prompts and evaluators | No cross-paper numerical ranking |
| R57.5 environment, R57.6 aggregate, R57.9 monotonicity/configuration gaps | Preserve source inconsistencies and request clarifying primary evidence before reproducing the affected claim |
| Mutable endpoints, models and remote media | Pin actual artifacts and retain availability snapshots; a dated paper is not a current API guarantee |
| Hardware/energy/money omitted for some source conditions | Report unknown dimensions and execute complete accounting before deployment preference |

[DERIVED] The chapter's conditional derivations, counterexamples, mathematical procedures and diagrams are original synthesis. Primary mechanisms and compact numerical comparisons retain local citations and source conditions. No substantial source prose is reproduced. Proposed experiments and the topic-completeness map are in [verification](verification.md).
