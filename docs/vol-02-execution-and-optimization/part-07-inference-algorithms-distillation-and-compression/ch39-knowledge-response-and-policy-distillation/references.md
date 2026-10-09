---
id: "ms.references.39"
entity_type: "references"
title: "Chapter 39 references"
short_title: "Chapter 39 references"
volume: 2
part: 7
chapter: 39
section: null
slug: "references"
parent: "ms.chapter.39"
prev_sibling: "ms.verification.39"
next_sibling: null
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.23", "ms.chapter.31", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34", "ms.chapter.35", "ms.chapter.36", "ms.chapter.37", "ms.chapter.38"]
downstream: ["ms.chapter.40", "ms.chapter.41", "ms.chapter.42", "ms.chapter.48"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "adaptation", "inference"], "mechanism": ["distillation", "distribution_matching"], "feedback_setting": ["ai_feedback", "verifiable_reward", "environment_return"], "modality": ["text"]}
papers: []
implementations: ["impl.pytorch", "impl.megatron-lm", "impl.verl", "impl.vllm", "impl.sglang"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1400
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# Chapter 39 references

## Evidence boundary and dates

[DERIVED] This chapter admits originating primary research first published from2025-12-01 through2026-10-09. All nine canonical research records first appeared in2026:9/9,100%, exceeding the requested90%2026 share. First dates come from each arXiv submission history, not its identifier month or a recent revision. All relevant methods, experiment protocols and appendices listed below were inspected on2026-10-09 before their claims were drafted. The associated CompactifAI code was read at the full commit recorded under R39.1; code reading is implementation disclosure, not executed verification.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R39.1 | paper | Efficient Knowledge Distillation for LLMs: Offline Top-K Logits and a Fused Chunked KL Loss | Bakbergen Ryskulov , Iker García-Ferrero , David Montero , David Jansen , Ali Hashemi , Jezabel R. Garcia , Antonio Tiene , Román Orús | arXiv2026; first 2026-08-04T15:11:45UTC | [Versioned primary text](https://arxiv.org/html/2608.03796v1) | [Pinned originating code](https://github.com/CompactifAI/Full-Chunked-KL-Loss/tree/38d09ce33dbc36b44212f73fd891b6ee7e63b3e1) | preprint |2026-10-09 | Inspected v1; exact claims and boundaries below |
| R39.2 | paper | Distilling What Matters: Confidence-Aware Selective Distillation for Large Language Models | Ayan Sengupta , Vaibhav Seth , Tanmoy Chakraborty | arXiv2026; first 2026-09-29T05:07:47UTC | [Versioned primary text](https://arxiv.org/html/2609.36734v1) | null | preprint |2026-10-09 | Inspected v1; exact claims and boundaries below |
| R39.3 | paper | Beyond Imitation: Auditing the Recoverability of Reasoning in Distilled Models | Ruitong Li , Binjie Guo , Aisheng Mo , Guowei Su , Han Wang , Jie Li , Ru Zhang | arXiv2026; first 2026-08-11T10:21:49UTC | [Versioned primary text](https://arxiv.org/pdf/2609.26216v1) | null | preprint |2026-10-09 | Inspected v1; exact claims and boundaries below |
| R39.4 | paper | On the Off-Policy Teacher in On-Policy Distillation | Langlin Huang , Hao Liu , Mononito Goswami , Xinyu Li , Prithwish Jana , Nikos Kanakaris , Patrick Blöbaum , Purak Jain | arXiv2026; first 2026-09-29T18:22:05UTC | [Versioned primary text](https://arxiv.org/html/2609.38360v1) | null | preprint |2026-10-09 | Inspected v1; exact claims and boundaries below |
| R39.5 | paper | On-Policy Distillation with Curriculum Turn-level Guidance for Multi-turn Agents | Gengsheng Li , Mao Zheng , Mingyang Song , Ruiqi Liu , Tianyu Yang , Jie Sun , Qiyong Zhong , Haiyun Guo , Junfeng Fang , Dan Zhang , Jinqiao Wang | arXiv2026; first 2026-06-14T16:41:45UTC | [Versioned primary text](https://arxiv.org/html/2606.15912v2) | null | preprint |2026-10-09 | Inspected v2; exact claims and boundaries below |
| R39.6 | paper | On-Policy Context Distillation for Language Models | Tianzhu Ye , Li Dong , Xun Wu , Shaohan Huang , Furu Wei | arXiv2026; first 2026-02-12T18:58:28UTC | [Versioned primary text](https://arxiv.org/html/2602.12275v1) | null | preprint |2026-10-09 | Inspected v1; exact claims and boundaries below |
| R39.7 | technical report | GLM-5: from Vibe Coding to Agentic Engineering | GLM-5-Team: Aohan Zeng et al. | arXiv2026; first 2026-02-17T17:50:56UTC | [Versioned primary text](https://arxiv.org/html/2602.15763v1) | null | preprint |2026-10-09 | Inspected v1; exact claims and boundaries below |
| R39.8 | technical report | DeepSeek-V4: Towards Highly Efficient Million-Token Context Intelligence | DeepSeek-AI et al. | arXiv2026; first 2026-04-26T14:49:33UTC | [Versioned primary text](https://arxiv.org/html/2606.19348v1) | null | preprint |2026-10-09 | Inspected v1; exact claims and boundaries below |
| R39.9 | paper | Reasoning-preserved Efficient Distillation of Large Language Models via Activation-aware Initialization | Junlin He , Yihong Tang , Tong Nie , Guilong Li , Binyu Yang , Jinxiao Du , Lijun Sun , Wei Ma | arXiv2026; first 2026-05-28T04:02:22UTC | [Versioned primary text](https://arxiv.org/html/2605.29327v1) | null | preprint |2026-10-09 | Inspected v1; exact claims and boundaries below |

## Versioned claim locators

### R39.1

**Inspected:** arXiv:2608.03796v1. §3.1 cached original top-k probabilities; §3.2/Algorithm1 loss and chunking; §4.1/Figure2 online–offline profile; §4.2 context memory; §4.3/Table1 output-head-only benchmark; §4.4 loss/packing ablations; AppendixA profiling and optimizer/runtime protocol; AppendixB estimated memory components. The sparse expression retains submass and can be negative; it is not silently promoted to a normalized full KL. The dense32K memory is estimated, and near-identical training loss is not a held-out equivalence test.

**Associated implementation inspection:** [Full pinned tree](https://github.com/CompactifAI/Full-Chunked-KL-Loss/tree/38d09ce33dbc36b44212f73fd891b6ee7e63b3e1), commit `38d09ce33dbc36b44212f73fd891b6ee7e63b3e1`,2026-08-10T10:31:23Z. `full_chunked.py` `_SparseKLHiddenStatesChunkedFunction.forward` first sequence-chunk projection/global-max/exp-sum phase, second projection/sparse entropy-cross-mass phase, `backward` third projection and $Mq-p$; `loss_common.py` input/index preparation and TP helpers. Read with README; no execution claimed. The repository creation date is not treated as proof of its first public release. Paper-first date establishes this family's eligibility; the inspected code commit is also in2026. Numerical `eps=1e-9` clamps and temperature scaling are disclosed implementation choices. Exact prefix cache, selected IDs and teacher temperature remain required.

### R39.2

**Inspected:** arXiv:2609.36734v1, §§2–3 confidence gate/Revival and gradient interpretation; §4/Tables1–3 main outcomes; §8 pseudocode and dropout implementation disclosure; §9 proofs; §10 training/evaluation; §13 calibration, factuality-linked selection and bias diagnostics. Authors report NeurIPS2026 acceptance in arXiv metadata; an independently checked archival proceedings record is not supplied here, so status remains preprint. The soft gate's bounded range, entropy/divergence-sign counterexample and optimizer-state caveat are book derivations, not source-claimed measurements. Five seeds do not resolve undisclosed evaluator commits or prove universal calibration.

### R39.3

**Inspected:** arXiv:2609.26216v1 full19-page PDF, §§3–6 estimator/cohort/conflict, §§7–9 outcomes and controls; Tables1–2 main transfer/intervention; AppendixA/Tables3–5 training and full-versus-LoRA confound; AppendixB/Table6 frozen recovery cohort; AppendixC/Table7 fixed-teacher and covariate controls; AppendixD local gradients/variance identities; AppendicesE–F interpretation and paired evaluation. Original history is August11 despite September-style identifier. Formula extraction loses some display glyphs; manuscript estimator/gradient identities are independently derived. No zero-support claim is admitted from zero sampled successes. Hardware, precision, optimizer name, LoRA rank and exact checkpoint hashes are NOT-DISCLOSED in the inspected protocol.

### R39.4

**Inspected:** arXiv:2609.38360v1, §2 student-prefix mismatch, §3 SCOUT method, §4/Tables1–3 outcomes, §5/Figures3–6 controls/update frequency/compute and Tables4–5 successors; AppendixB.1 initial teacher optimization, B.2 actual sampled K1 clipped student objective and teacher GRPO, B.3 two-level repeated-evaluation/training-run uncertainty, B.4 hardware/software. Three-run aggregate SD is not a confidence interval. Fixed-prefix continuation controls are distinguished from matched evolving checkpoints. Teacher update interval10 and eight teacher continuations are source-disclosed; no dense student conditional-KL implementation is invented.

### R39.5

**Inspected:** arXiv:2606.15912v2, originally June14; inspected revision2026-09-23T17:45:34UTC. §2 baseline; §3.1/Eqs4–5 role losses, §3.2/Eqs6–8 curriculum, §3.3/Eqs9–10 sampling/objective interpretation; §4/Tables1–2 results/ablations; AppendixA.1 environments/Table3, A.2 metrics/Table4 training, A.3 baselines, A.4 hyperparameters and A.5 prompts. Mixed role histories use a common occupancy; the manuscript qualifies any pure-occupancy interpretation of Eq10 with a finite counterexample. Validation-set evaluation, one seed and absent independent-run uncertainty remain explicit. No intermediate-guidance process is relabeled purely student on-policy.

### R39.6

**Inspected:** arXiv:2602.12275v1, §3 objective/Algorithm1, §4.1–4.4 and Tables1–4 transfer/prompt sensitivity, §4.5 retention/Figure3, §4.6/Table5 self-teacher instability, §4.7/Table6 raw versus extracted experience; AppendixA.1–A.3 experience construction/data/top256/optimization/checkpoint selection; AppendixB.1–B.2 system prompts and best-three-test-checkpoint reporting. v2March23 exists but is not silently substituted. Student-top256 tail handling is NOT-DISCLOSED. AppendixA.3 selects the best test checkpoint and B.2 averages the top three test checkpoints; the manuscript therefore does not call these untouched selected-test estimates. Filtered context search uses validation labels; only unfiltered context construction supports the relevant no-label description.

### R39.7

**Inspected:** arXiv:2602.15763v1, §3.1 SFT data categories/rejection/masked erroneous segments, §3.4 general-RL objectives, §3.5/Eq2 final cross-stage distillation using preceding stage checkpoints, prompt-set mixing, detached sampled log-ratio advantages, group1/batch1024; AppendixA/Table10 model architecture and separately scoped pre/mid-training hyperparameters. §3.5 says teacher inference logits differ from a planned training-engine path; that migration is future work in this version. Distillation-specific hardware, LR, total updates, seeds, exact expert mixture and isolating contribution are NOT-DISCLOSED. v2February24 is not substituted. Originating lab route: reference stack §1#6 Z.ai / Zhipu AI / GLM.

### R39.8

**Inspected:** arXiv:2606.19348v1, original history2026-04-26 despite June-style identifier; §5.1.2/Eq29 multi-expert full-vocabulary reverse-KL on student trajectories; §5.2.2 teacher storage/offload, last-hidden caching, on-demand head reconstruction, teacher-index sample ordering and TileLang KL; surrounding §5 post-training/evaluation boundaries. More than ten teachers are reported. The brief relevance/routing explanation does not disclose an executable router. Negligible reconstruction overhead is a source claim without isolated accounting; complete teacher cost is not zero. Fixed-prefix weighted reverse-KL geometric-product identity is a book derivation. Originating lab route: reference stack §1#8 DeepSeek.

### R39.9

**Inspected:** arXiv:2605.29327v1, §3 projection-wrapped architecture, §4 effective rank and linear proxy, §5 activation statistic/Eqs9–10 and Theorem5.1, §6/Tables4–7 results/factorial/orthogonal controls; AppendixB losses, C module/merge disclosure, D.8 initial spectrum proof, F.1–F.5 optimization/data/model/evaluation, G.1 official-versus-retrained LRC, G.2/G.6 calibration sensitivity and G.5 conversational-SFT negative result. Linear balanced gradient flow is not a nonlinear Transformer theorem. Zero initial singular-value derivative does not freeze the product matrix. Main text15 versus AppendixF.2 five SlimOrca proxy samples is an unresolved discrepancy. Exact loss-coefficient implementation, package commits, seeds and precision are NOT-DISCLOSED; no code execution claimed.

## Exclusions and unresolved surfaces

[DERIVED] Historical distillation, PPO and DeepSeek-R1 papers first published before2025-12-01 are excluded from the admitted evidence set, including the plan's historical KD1503.02531 anchor. Their foundational mathematics is reconstructed without a new-2026 novelty claim. A recent revision cannot make an older original eligible. Generic blogs, aggregators and venue formatting are not substituted for primary methods or acceptance records.

[UNVERIFIED] Exact production code/checkpoint pins for CaRE, Recoverability, SCOUT, Guided-OPD, OPCD, GLM-5 distillation and DeepSeek-V4 teacher scheduling were not independently inspected. Their mechanisms remain PAPER-REPORTED at the specified primary version. A repository field of null means no admitted inspected code artifact in this ledger; it does not assert that no repository exists. No current production internals, private data counts or missing experiments are inferred.

[NOT-DISCLOSED] Full teacher-generation/cache/verifier/search cost, component-isolated GLM/DeepSeek distillation outcomes, OPCD tail normalization and several artifact/optimizer/precision fields remain gaps with consequences listed in verification.md. No inaccessible primary candidate is used to support a factual technical claim. All nine admitted primary texts were accessible; Recoverability required PDF rather than an HTML rendering.

## Retrieval record

[DERIVED] Actual searches used primary arXiv routes with method names and2026 dates, followed by full text/appendix inspection and original-history checks. Concrete queries included `site:arxiv.org "Offline Top-K" "2026"`, `site:arxiv.org "CaRE-KD"`, `site:arxiv.org "On the Off-Policy Teacher"`, `site:arxiv.org "Curriculum Turn-level Guidance"`, and exact arXiv identifiers from the originating reports. Discovery routes identify retrieval, not independent evidence. The associated code was fetched from the paper-linked CompactifAI repository and its GitHub commit API, with the actual full SHA retained.
