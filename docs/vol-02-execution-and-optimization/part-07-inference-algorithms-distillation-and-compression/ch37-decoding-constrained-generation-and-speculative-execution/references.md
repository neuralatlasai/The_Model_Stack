---
id: ms.references.37
entity_type: references
title: References — Decoding
short_title: References — Decoding
volume: 2
part: 7
chapter: 37
section: null
slug: references
parent: ms.chapter.37
prev_sibling: ms.verification.37
next_sibling: null
children: []
prerequisites:
- ms.chapter.4
- ms.chapter.5
- ms.chapter.14
- ms.chapter.31
downstream:
- ms.chapter.38
- ms.chapter.39
- ms.chapter.40
- ms.chapter.42
- ms.chapter.48
related: []
relations: []
axes:
  lifecycle:
  - inference
  mechanism:
  - decoding
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.vllm
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 1400
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# References — Chapter 37

[DERIVED] Eligibility follows first publication/release 2025-12-01 through 2026-10-09. All **seven canonical evidence records originate in 2026 (100%)**, February8 through October5. The actual inspection/access date is **2026-10-09**. Full relevant methods, experiments, appendices and the official release's named code paths were inspected before the claims were drafted. Source inspection does not assert repository execution, benchmark reproduction or scientific review completion.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R37.1 | repository | vLLM v0.31.0 | vLLM contributors | First 2026-10-05; inspected version below | [Primary text](https://github.com/vllm-project/vllm/releases/tag/v0.31.0) | [Full pinned tree](https://github.com/vllm-project/vllm/tree/db9527a46873454610df6dbedf79a36d6bf1a7f6) | official documentation | 2026-10-09 | Published 2026-10-05T06:44:55Z; full SHA db9527a46873454610df6dbedf79a36d6bf1a7f6. worker/gpu/sample/sampler.py Sampler.__init__,apply_sampling_params,sample; states.py SamplingStates; gumbel.py gumbel_noised_argmax; worker/gpu/spec_decode/rejection_sampler.py _verify,_verify_in_chunks,get_max_chunk_logits; rejection_sampler_utils.py _rejection_kernel and residual logits; sample/ops/topk_topp_sampler.py apply_top_k_top_p_pytorch,flashinfer_sample; entrypoints/generate/beam_search/offline.py beam_search,_beam_search_step,_build_beam_sampling_params; utils.py get_beam_search_score; v1/core/sched/utils.py check_stop; v1/engine/detokenizer.py BaseIncrementalDetokenizer and check_stop_strings; v1/structured_output/__init__.py grammar_bitmask,accept_tokens; backend_xgrammar.py rollback,validate_tokens; v1/spec_decode/vocab_mapping.py VocabMapping |
| R37.2 | paper | Draft-Conditioned Constrained Decoding for Structured Generation in LLMs | Avinash Reddy, Thayne T. Walker, James S. Ide, Amrit Singh Bedi | First 2026-02-08; inspected version below | [Primary text](https://arxiv.org/html/2603.03305v1) | null | preprint | 2026-10-09 | arXiv:2603.03305v1; original submission 2026-02-08T03:52:24UTC despite March identifier. §§3–4 Eq 4–15, Algorithm 1; §5 Table 2, Figures4–8; AppendixA Eq 16–18, B setup, C probability diagnostics, D scaling, E judge, F/I schemas and grammars, J/K cases. v2June27 has a different title and is not silently mixed into this inspected v1 |
| R37.3 | paper | Efficient Grammar-Constrained Decoding via Parser Stack Classification | Yongmin Li, Yihong Dong, Jia Li, Ge Li | First 2026-08-04; inspected version below | [Primary text](https://arxiv.org/html/2608.03065v1) | null | preprint | 2026-10-09 | arXiv:2608.03065v1 first 2026-08-04T03:26:54UTC. §2.1 token/character contract; §§3.1–3.5 Eq 3–9, Theorems1–3, Algorithms1–2; §4.1 complete protocol, §4.2 Table 2 lexer failures, §4.3 Table 3 CPU-mask boundary, §4.4 Figure 3 throughput, §4.5 Tables4–5 downstream settings; §§5.1–5.3 Tables6–7 preprocessing/runtime memory and validity threats. ISSTA 2026 acceptance is author-reported; this chapter routes the inspected primary preprint through arXiv and does not claim top-ten conference membership |
| R37.4 | paper | Constrained Decoding Eliminates Structural Failures in Small LLMs but Reveals a Scale-Dependent Semantic Gap | Akash Chavan | First 2026-09-20; inspected version below | [Primary text](https://arxiv.org/html/2609.23742v1) | null | preprint | 2026-10-09 | arXiv:2609.23742v1 first 2026-09-20T16:44:57UTC despite September23-style identifier. §3 Tables2–3 model/condition/metric protocol; §4 Tables5–6 structural/content outcomes; §4.3 receipt, missing-call and hollow-rescue cases; §5.1 limitations. ACL format does not establish ACL acceptance |
| R37.5 | paper | Beam Search, Self-Consistency, and the Limits of Inference-Time Scaling for Grammar-Constrained Text-to-SQL in Small Language Models | Ty Chermsirivatana, John MacCormick | First 2026-08-26; inspected version below | [Primary text](https://arxiv.org/html/2608.25761v1) | null | preprint | 2026-10-09 | arXiv:2608.25761v1 first 2026-08-26T13:07:06UTC. §3 beam stopping and execution-vote; §4 NF4,1034 examples,temperature.7,top-p.9,length penalty-2,cap160,single-seed and interval definitions; §5 Tables1–2 exact results, incomplete-grammar paired analysis; §6 truncation and untested mechanisms; §7 scope limits |
| R37.6 | paper | ResiSpec: Enhancing Multi-Candidate Speculative Sampling via Residual Distribution Shaping | Zhi-Kai Chen, Jun-Jie Tao, Wei-Xiang Mao, De-Chuan Zhan, Han-Jia Ye | First 2026-08-25; inspected version below | [Primary text](https://arxiv.org/html/2608.24411v1) | null | preprint | 2026-10-09 | arXiv:2608.24411v1 first 2026-08-25T11:25:55UTC. Method: Residual Distribution Shaping Eq 3–13 and Algorithm 1; AppendixA.1 Eq 14–20 exactness proof inspected with counterexample in §37.5; AppendixA.2 shaping bound; Experiment Tables1–4 and Figure 3; AppendixB Eq 25–28 marginal reconstruction caveat; AppendixC full reproducibility and AppendixD model/tree ablations. Exactness is source-claimed, not admitted unconditionally |
| R37.7 | paper | GLM-5: from Vibe Coding to Agentic Engineering | GLM-5-Team: Aohan Zeng et al. | First 2026-02-17; inspected version below | [Primary text](https://arxiv.org/html/2602.15763v1) | null | preprint | 2026-10-09 | arXiv:2602.15763v1 first 2026-02-17T17:50:56UTC. §2.1 Multi-token Prediction with Parameter Sharing, Table 2 accept lengths2.55/2.76 at four speculative steps and private prompt set. Architecture paragraph provides744Btotal/40Bactive,80 layers but does not disclose an MTP-specific hardware/precision/seed/latency protocol. v2February24 not substituted |

## Versioned claim locators

### R37.1

[DERIVED] Original publication/release: **2026-10-05**; inspected/accessed: **2026-10-09**. [Originating surface](https://github.com/vllm-project/vllm/releases/tag/v0.31.0). Published 2026-10-05T06:44:55Z; full SHA db9527a46873454610df6dbedf79a36d6bf1a7f6. worker/gpu/sample/sampler.py Sampler.__init__,apply_sampling_params,sample; states.py SamplingStates; gumbel.py gumbel_noised_argmax; worker/gpu/spec_decode/rejection_sampler.py _verify,_verify_in_chunks,get_max_chunk_logits; rejection_sampler_utils.py _rejection_kernel and residual logits; sample/ops/topk_topp_sampler.py apply_top_k_top_p_pytorch,flashinfer_sample; entrypoints/generate/beam_search/offline.py beam_search,_beam_search_step,_build_beam_sampling_params; utils.py get_beam_search_score; v1/core/sched/utils.py check_stop; v1/engine/detokenizer.py BaseIncrementalDetokenizer and check_stop_strings; v1/structured_output/__init__.py grammar_bitmask,accept_tokens; backend_xgrammar.py rollback,validate_tokens; v1/spec_decode/vocab_mapping.py VocabMapping.

### R37.2

[DERIVED] Original publication/release: **2026-02-08**; inspected/accessed: **2026-10-09**. [Originating surface](https://arxiv.org/html/2603.03305v1). arXiv:2603.03305v1; original submission 2026-02-08T03:52:24UTC despite March identifier. §§3–4 Eq 4–15, Algorithm 1; §5 Table 2, Figures4–8; AppendixA Eq 16–18, B setup, C probability diagnostics, D scaling, E judge, F/I schemas and grammars, J/K cases. v2June27 has a different title and is not silently mixed into this inspected v1.

### R37.3

[DERIVED] Original publication/release: **2026-08-04**; inspected/accessed: **2026-10-09**. [Originating surface](https://arxiv.org/html/2608.03065v1). arXiv:2608.03065v1 first 2026-08-04T03:26:54UTC. §2.1 token/character contract; §§3.1–3.5 Eq 3–9, Theorems1–3, Algorithms1–2; §4.1 complete protocol, §4.2 Table 2 lexer failures, §4.3 Table 3 CPU-mask boundary, §4.4 Figure 3 throughput, §4.5 Tables4–5 downstream settings; §§5.1–5.3 Tables6–7 preprocessing/runtime memory and validity threats. ISSTA 2026 acceptance is author-reported; this chapter routes the inspected primary preprint through arXiv and does not claim top-ten conference membership.

### R37.4

[DERIVED] Original publication/release: **2026-09-20**; inspected/accessed: **2026-10-09**. [Originating surface](https://arxiv.org/html/2609.23742v1). arXiv:2609.23742v1 first 2026-09-20T16:44:57UTC despite September23-style identifier. §3 Tables2–3 model/condition/metric protocol; §4 Tables5–6 structural/content outcomes; §4.3 receipt, missing-call and hollow-rescue cases; §5.1 limitations. ACL format does not establish ACL acceptance.

### R37.5

[DERIVED] Original publication/release: **2026-08-26**; inspected/accessed: **2026-10-09**. [Originating surface](https://arxiv.org/html/2608.25761v1). arXiv:2608.25761v1 first 2026-08-26T13:07:06UTC. §3 beam stopping and execution-vote; §4 NF4,1034 examples,temperature.7,top-p.9,length penalty-2,cap160,single-seed and interval definitions; §5 Tables1–2 exact results, incomplete-grammar paired analysis; §6 truncation and untested mechanisms; §7 scope limits.

### R37.6

[DERIVED] Original publication/release: **2026-08-25**; inspected/accessed: **2026-10-09**. [Originating surface](https://arxiv.org/html/2608.24411v1). arXiv:2608.24411v1 first 2026-08-25T11:25:55UTC. Method: Residual Distribution Shaping Eq 3–13 and Algorithm 1; AppendixA.1 Eq 14–20 exactness proof inspected with counterexample in §37.5; AppendixA.2 shaping bound; Experiment Tables1–4 and Figure 3; AppendixB Eq 25–28 marginal reconstruction caveat; AppendixC full reproducibility and AppendixD model/tree ablations. Exactness is source-claimed, not admitted unconditionally.

### R37.7

[DERIVED] Original publication/release: **2026-02-17**; inspected/accessed: **2026-10-09**. [Originating surface](https://arxiv.org/html/2602.15763v1). arXiv:2602.15763v1 first 2026-02-17T17:50:56UTC. §2.1 Multi-token Prediction with Parameter Sharing, Table 2 accept lengths2.55/2.76 at four speculative steps and private prompt set. Architecture paragraph provides744Btotal/40Bactive,80 layers but does not disclose an MTP-specific hardware/precision/seed/latency protocol. v2February24 not substituted.

## Release identity and source paths

[OFFICIAL-DOCUMENTATION] The originating GitHub release/API records v0.31.0 at **db9527a46873454610df6dbedf79a36d6bf1a7f6**, published **2026-10-05T06:44:55Z**. The release notes identify Model Runner V2 as the default, while separate V1 source paths remain. This manuscript identifies the path whenever the distinction matters. [Release](https://github.com/vllm-project/vllm/releases/tag/v0.31.0)

[OFFICIAL-DOCUMENTATION] Inspected full pinned source surfaces include [V2 sampler](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/v1/worker/gpu/sample/sampler.py), [V2 rejection sampler](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/v1/worker/gpu/spec_decode/rejection_sampler.py), [correction kernels](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/v1/worker/gpu/spec_decode/rejection_sampler_utils.py), [native truncation fallback](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/v1/sample/ops/topk_topp_sampler.py), [beam implementation](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/entrypoints/generate/beam_search/offline.py), [beam score](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/entrypoints/generate/beam_search/utils.py), [stop checks](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/v1/core/sched/utils.py), [detokenization](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/v1/engine/detokenizer.py), [grammar manager](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/v1/structured_output/__init__.py) and [vocabulary mapping](https://github.com/vllm-project/vllm/blob/db9527a46873454610df6dbedf79a36d6bf1a7f6/vllm/v1/spec_decode/vocab_mapping.py). Function names in R37.1 are stable locators at that SHA. Paper-runtime versions remain separately NOT-DISCLOSED when omitted; the October release is not retrospectively assigned to a February/August experiment.

## Exclusions, inaccessible surfaces and disputed guarantees

[UNVERIFIED] **Speculative Speculative Decoding**, arXiv2603.03251v1, was retrieved in full and has verified ICLR 2026 archival identity, but earliest public OpenReview history for forum aL1Wnml9Ef could not be established: the forum challenges the browser and API2 returned403. Its arXiv history starts March3, but that alone does not exclude an earlier public submission. It is **not admitted as canonical chapter evidence**, and no SSD performance/mechanism claims rely on it. [Forum](https://openreview.net/forum?id=aL1Wnml9Ef) [ArXiv history](https://arxiv.org/abs/2603.03251)

[DERIVED] The plan's2211.17192 foundational paper and historical beam/grammar/temperature references are outside this user's source window. Their dates are not refreshed by citations in 2026 sources. The chapter reconstructs foundational finite-probability identities independently and uses eligible 2026 studies/current official implementation for current empirical and operational claims; it does not claim these foundations were invented in 2026.

[MATHEMATICALLY-DERIVED] ResiSpec AppendixA.1's local alignment condition is insufficient for the stated universal exactness theorem when the proxy depends on the rejected proposal. Section 37.5 provides normalized distributions, acceptance/rejection mass and the resulting discrepant output law. This is a counterexample to the stated sufficient condition, not a finding that every configuration of its repository is biased. AppendixB's reconstruction uses the same fixed-proxy-style cancellation, so its tiny reported KL values are not treated as independent proof of that general condition.

[NOT-DISCLOSED] DCCD v1 omits hardware, dtype, model revision hashes, complete sampling/cap configuration and seed uncertainty; parameter-normalized accuracy is not measured compute efficiency. The structural/semantic study omits a complete hardware/version/seed protocol and uses14 hand-designed tasks. The beam study supplies one sampling seed but not its identifier/hardware and matches candidate count rather than measured FLOPs/latency. PSC's environment file/package is mentioned but not assigned an independently inspected commit here; its reported measurements remain paper-reported. GLM-5's private MTP prompts and timing boundary are unavailable. ResiSpec's base-seed identifier/checkpoint hashes/precision are not fully specified in the inspected protocol.

[DERIVED] Discovery routes are reference-stack §3 #1 **arXiv** and, for the excluded-date check, §3 #2 **OpenReview** / §2 #3 **ICLR**. Only originating primary surfaces support the manuscript. vLLM is reference-stack §4 #41 **LLM inference engine**, §4.1 **INFERENCE ENGINE**. XGrammar, Outlines and other baselines are named only as disclosed components of admitted studies or the pinned vLLM backend; their historical papers are not additional canonical evidence records or invented top-ten stack entries.

[DERIVED] Additional inspected source ambiguities: DCCD Table 1 lists Qwen2.5-3B while Figure 7 labels a Llama3.2-3B probability diagnostic; these are not silently identified. ResiSpec Algorithm 1 uses the local discrepancy budget, whereas prose Eq 13 also includes a maximum with an ideal budget; redistribution policy and larger-budget slack allocation are not fully specified. Procedure 37.5a declares a book reconstruction and preserves unresolved exactness. The GLM lab route is reference-stack section1 entry6 Z.ai / Zhipu AI / GLM, with the originating report retrieved through arXiv.
