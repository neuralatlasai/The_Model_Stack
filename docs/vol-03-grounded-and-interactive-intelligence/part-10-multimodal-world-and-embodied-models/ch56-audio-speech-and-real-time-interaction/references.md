---
id: ms.references.56
entity_type: references
title: "Chapter 56 — References"
volume: 3
part: 10
chapter: 56
section: null
slug: references
parent: ms.chapter.56
prev_sibling: ms.verification.56
next_sibling: null
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.42, ms.chapter.46, ms.chapter.47]
downstream: [ms.chapter.57, ms.chapter.60, ms.chapter.61, ms.chapter.63, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [audio_streaming, temporal_alignment], feedback_setting: [], modality: [audio, text]}
papers: []
implementations: [impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, PAPER-REPORTED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1500
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 56 references

[DERIVED] **Inspection date: 2026-10-25.** The retained research papers were first publicly released within **2026-03-01–2026-10-24**. First release, inspected revision, and access date are separate fields below. Methods, experiment descriptions, and specific tables were inspected; this is not a claim that every bibliography item, appendix, code path, or result was independently verified. Source inspection is not model execution or replication.

| Key | Type | Work | Authors / organization | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R56.1 | technical report | Qwen-Audio-3.0-TTS: Freely Controllable and Highly Robust Speech Synthesis with Multi-Stage Training Paradigm | Bajian Xiang et al. | arXiv / 2026 | https://arxiv.org/html/2607.23938v1 | Not inspected; no executable claim | preprint | 2026-10-25 | First public release 2026-07-27; inspected v1, same date. 56.1: §2.1 tokenizer stages; §3.1 12.5-Hz/ten-ternary-dimension bottleneck and supervision; §3.3 evaluator scope; §4.1 Tables 1–2 rate/capacity comparisons. Not used to establish universal optimal rate or end-user latency. |
| R56.2 | technical report | Voxtral TTS | Mistral AI; Alexander H. Liu et al. | arXiv / 2026 | https://arxiv.org/html/2603.25551v2 | Source-described vLLM-Omni; no repository commit inspected/executed | preprint | 2026-10-25 | First public release 2026-03-26; inspected v2, 2026-04-06. 56.2: §§2–3 semantic/acoustic synthesis and loss-mask/preference boundary; §4.3 blinded native-dialect human protocol, ties excluded; §5.1 Table 6 Hindi regression. 56.6: §2.1 codec layout; §§6.1–6.3 graph buckets, shared-memory overlap, Tables 7–8 H200 workload and serving boundary. |
| R56.3 | paper | X2Streaming-ASR: Wait When Uncertain, Emit When Ready for Streaming ASR | Zhiwei Lin, Kaiqi Fu, Rime Wen, Zehan Liu, Shawn Qin, Roy Gan, Hao Wang; X Square Robot | arXiv / 2026 | https://arxiv.org/html/2609.08672v4 | https://github.com/X-Square-Robot/X2Streaming-ASR (linked by report; not inspected/executed) | preprint | 2026-10-25 | First public release 2026-09-08; inspected current v4, 2026-10-12. 56.3–56.4: §§2.1–2.2 asynchronous encoder/listen/decode and hard commits; Eqs. 4–9 character/word credit and capped delay; §3.1 forced-aligned timing, public versus paper-quoted comparators; Tables 1–3 current quality/timing/ablation. v1 was initially inspected, then superseded in manuscript claims by v4 after revision audit. |
| R56.4 | paper | HiThink Turn: An Intent-Aware Turn-Taking Control Module for Full-Duplex Dialogue | Feiyang Chen et al.; HiThink Research | arXiv / 2026 | https://arxiv.org/html/2609.34096v1 | ms-swift is named by report; implementation not inspected/executed | preprint | 2026-10-25 | First public release 2026-09-28; inspected v1. 56.4: §§2.2–2.4 labels, annotation, earliest intent-sufficient prefix, playback-state condition/loss exclusion; §3.1 disclosed eight-H100/BF16/LoRA training; §3.3 fixed-prediction trigger comparison and successful-case denominator; Table 3 aggregate explicitly excludes latency; §§3.4–3.5 subgroup/ablation limits. |
| R56.5 | paper | Full-Duplex Interaction in Spoken Dialogue Systems: A Comprehensive Study from the ICASSP 2026 HumDial Challenge | Chengyou Wang, Hongfei Xue, Guojian Li, Zhixian Zhao, Shuiyuan Wang, Shuai Wang, Xin Xu, Hui Bu, Lei Xie | arXiv / 2026 | https://arxiv.org/html/2604.21406v2 | https://github.com/ASLP-lab/HumDial-FDBench (linked by report; not inspected/executed) | preprint | 2026-10-25 | First public release 2026-04-23; inspected current v2, 2026-04-24, after initial v1 inspection. 56.5: §§3.1–3.2 acted/script construction and nine Table 1 scenario rows; §§4.1–4.3 ASR/judge/VAD, successful-case timing, Eqs. 1–3 and comparator-dependent normalization; §5.2 Table 2 separates fastest and highest overall. Title's ICASSP reference is not independent peer-review verification. |
| R56.6 | paper | Overcoming State Inertia in Full-Duplex Spoken Language Models via Activation Steering | Cheng-Kuang Chang, Kai-Wei Chang, Alexander H. Liu, James Glass | arXiv / 2026 | https://arxiv.org/html/2606.11386v1 | Not inspected; no executable claim | preprint | 2026-10-25 | First public release 2026-06-09; inspected v1. 56.3: §§3.2–3.4 logit-lens stream-affinity diagnostics and limits; §§4–6.1 Zero-Buffer construction, ASR/LLM judging, disjoint vector calibration, onset detector, finite decay schedule; §6.2 Table 2 reported outcomes/standard errors and Table 3 model-specific intervention settings. |
| R56.7 | paper | Streaming Neural Speech Codecs through Time-Invariant Representations (HTML title begins “Towards”) | Kélian Estève, Salima Mhdaffar, Mickael Rouvier, Richard Dufour, Yannick Estève | arXiv / 2026 | https://arxiv.org/html/2607.05250v1 | Not inspected; no executable claim | preprint | 2026-10-25 | First public release 2026-07-06; inspected v1. 56.1: §2.2/Figure 2 Dual-TIRE branch/quantization/reinjection; §3 frozen probes and reconstruction setup; §4.4 Tables 3–4 metric trade-offs; §5/Table 5 contiguous 660-ms block reconstruction, which is not an end-to-end response timer. Title variation does not indicate a different arXiv work. |
| R56.8 | paper | WaxalNet: Benchmarking and Adapting Speech Recognition for Spontaneous Speech in 19 African Languages | Victor Tolulope Olufemi et al.; CMU Africa, LyngualLabs, MBZUAI | arXiv / 2026 | https://arxiv.org/html/2606.02375v2 | Report-linked models/code not inspected or executed | preprint | 2026-10-25 | First public release 2026-06-01; inspected current v2, 2026-10-21. 56.5: §3 common normalization, cleaning/failure exclusions, paired bootstrap, one run/condition; §5 shared-encoder decoder comparison with residual capacity confound; §7/Table 4 domain-shift limits; §8 quartile-sampled joint native-speaker audit; Limitations separates test uncertainty from training seeds. Appendix F/Table 9 CPU boundary also read, not transferred to an edge device. Initial v1 title “WAXAL-NET: Finetuned Edge ASR…” and its earlier binomial-style interval are superseded rather than attributed to v2. |
| R56.9 | paper | ELARSpeech: A 30K-Hour Dataset Across 675 Underrepresented Languages for Long-Tail Multilingual Speech Technologies — withdrawn candidate | Sangmin Lee, Yejin Jeon, David Ifeoluwa Adelani | arXiv / 2026 | https://arxiv.org/abs/2610.19388v2 | Not used | archived | 2026-10-25 | First public release 2026-10-14; v1 methods/results were inspected during retrieval. Current v2 metadata, 2026-10-19, says withdrawn while addressing data usage and permission requirements. Excluded from research findings, performance comparison, and recommended artifacts. Metadata is used only to document that exclusion. |
| R56.10 | technical report | Qwen3.5-Omni Technical Report | Qwen Team; Alibaba Qwen | arXiv / 2026 | https://arxiv.org/html/2604.15804v2 | Not inspected/executed | preprint | 2026-10-25 | First release 2026-04-17; inspected current v2, 2026-04-21. 56.3: §§2.1, 2.4–2.5 Thinker/Talker, residual-codebook/waveform route, ARIA prefix ratio, Table 2 critical-path definition and explicit resource-allocation comparison caveat. Exact ratio estimator/empty-prefix implementation not disclosed by the inspected description. |
| R56.11 | paper | From Sounds to Scenes: A Benchmark for Evaluating Context-Aware Auditory Scene Understanding in Large Audio Language Models | Pengfei Zhang et al. | arXiv / 2026 | https://arxiv.org/html/2606.25391v1 | Report-linked artifacts not inspected/executed | preprint | 2026-10-25 | First release 2026-06-24; inspected v1. 56.2: §§2.1–2.2 script/layer construction and four task types; §3 instruments and four-option questions; §§4.1–4.2 Tables 1–2 separates transcription from scene accuracy and tests Gaussian-noise layer replacement. The prose's universal collapse wording is qualified by the actual ablation entries. |

## Revision and exclusion audit

[DERIVED] Reopening revision histories changed the draft: X2's initial v1 numbers were replaced by v4's Table 1, WaxalNet's initial v1 interpretation was replaced by v2's shared-encoder and paired-bootstrap analysis, and ELARSpeech's findings were removed after withdrawal was discovered. Current claims always cite the retained revision. A general mathematical objection to treating WER as Bernoulli probability remains independently derived in 56.5; it is not attributed to WaxalNet v2's interval procedure.

[DERIVED] The plan's older Qwen2.5-Omni anchor is a retrieval/context lead, not newly introduced research evidence. WAXAL's February first release similarly does not qualify merely because later pages changed. Existing likelihood, attention, post-training, fusion, and experimental-design foundations link to their canonical chapters. The current papers' use of older base models does not make the base-model papers newly eligible or establish undocumented base-model internals.

## Source-specific boundaries

[DERIVED] Qwen's rate/capacity ablation does not isolate every other tokenizer difference against its predecessor. Dual-TIRE's reconstruction/probe results do not prove perfect disentanglement. Voxtral's table reports serving rather than microphone-to-playback. X2 times forced-aligned character/word boundaries and hard commitment rather than complete spoken responses. HiThink's aggregate excludes latencies and its trigger comparison changes the successful cohort. HumDial has a scenario-count inconsistency and a comparator-dependent normalized delay score. WaxalNet v2 excludes some offered failures and reports only one training run per condition. The chapter preserves those distinctions.

[NOT-DISCLOSED] Exact runtime/precision sufficient to reproduce the reported Voxtral timing; complete local clock/codec support; device energy, traffic, and financial cost per accepted conversation; several raw judge/aligner labels; and future workload tails are not established here. Unknowns are not filled with model-name guesses or peak hardware rates.

[UNVERIFIED] No repository commit, codec, ASR/TTS model, steering intervention, microphone path, browser audio implementation, or network emulator was executed. Report-linked code URLs describe provenance only. Book-authored figures, recurrences, and counterexamples are conditional mathematical explanations, not benchmark replication. Proposed checks remain in [verification](verification.md).
