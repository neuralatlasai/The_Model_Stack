---
id: ms.references.4
entity_type: references
title: Chapter 04 references
short_title: References 04
volume: 1
part: 1
chapter: 4
section: null
slug: references
parent: ms.chapter.4
prev_sibling: ms.verification.4
next_sibling: null
children: []
prerequisites: []
downstream: []
related: []
siblings_by_mechanism: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: [P01, P02, P03, P08, P10, P13, P35, P44]
implementations: [impl.pytorch, impl.torchtitan, impl.liger-kernel, impl.nvidia-megatron-core, impl.megatron-lm, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, KNOWN, UNVERIFIED], empirically_observed: false}
word_count_target: 300
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# References — Chapter 04

Every work cited in the chapter. Spine papers use Appendix D ids; other works use `R4.n`. "Accessed" is the date the primary URL (abs page, HTML/ar5iv rendering, documentation page, or raw source file) was opened for this edition; the "Where opened" note records which rendering supported the detail claims. A preprint's presence is not a claim of peer review. Status is the author's best determination from the opened page; where a venue was not confirmed on the page the status is `preprint`.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin | NeurIPS 2017 (Advances in Neural Information Processing Systems 30; proceedings page opened) | https://arxiv.org/abs/1706.03762 | null | peer-reviewed | 2026-09-20 (abs; ar5iv full text; proceedings.neurips.cc abstract page) | causal decoder mask + offset outputs (§3.1); cross-attention (§3.2.3); label smoothing 0.1 hurts PPL, helps BLEU (§5.4) — §4.1, §4.2, §4.5, §4.6 |
| P02 | paper | Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer (T5) | Raffel, Shazeer, Roberts, Lee, Narang, Matena, Zhou, Li, Liu | JMLR 21(140), 2020 (journal page opened) / arXiv 2019 | https://arxiv.org/abs/1910.10683 | https://github.com/google-research/text-to-text-transfer-transformer (README opened) | peer-reviewed | 2026-09-20 (abs; ar5iv full text; jmlr.org page; code README) | span corruption with sentinels (§3.1.4); objective comparison and conclusions (§3.2–3.3); span-length study (§3.3.4) — §4.2 |
| P03 | paper | The Pile: An 800GB Dataset of Diverse Text for Language Modeling | Gao, Biderman, Black, et al. | arXiv 2020 | https://arxiv.org/abs/2101.00027 | null | preprint | 2026-09-20 (abs; ar5iv full text) | bits-per-byte definition and rationale — §4.6 |
| P08 | paper | Scaling Laws for Neural Language Models | Kaplan, McCandlish, Henighan, et al. | arXiv 2020 | https://arxiv.org/abs/2001.08361 | null | preprint | not opened this edition | loss as the fitted quantity of scaling analyses (forward pointer to §21) — §4.6; cited by plan, no detail claim made |
| P10 | paper | Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity | Fedus, Zoph, Shazeer | JMLR 2022 / arXiv 2021 | https://arxiv.org/abs/2101.03961 | null | peer-reviewed | 2026-09-20 (abs; ar5iv full text) | load-balancing loss α·N·Σ f_i P_i, α = 10⁻² (§2.2) — §4.4 |
| P13 | technical report | DeepSeek-V3 Technical Report | DeepSeek-AI | arXiv 2024 | https://arxiv.org/abs/2412.19437 | https://github.com/deepseek-ai/DeepSeek-V3 (README opened; see R4.29) | preprint | 2026-09-20 (abs; arXiv HTML full text) | MTP module structure, D = 1, λ schedule 0.3→0.1 at 10T of 14.8T tokens, inference discard/repurpose (§2.2, §4); sequence-wise balance loss α = 0.0001 (§2.1) — §4.4 |
| P35 | paper | Fast Inference from Transformers via Speculative Decoding | Leviathan, Kalman, Matias | ICML 2023 (PMLR 202; proceedings page opened) | https://arxiv.org/abs/2211.17192 | null | peer-reviewed | 2026-09-20 (abs; proceedings.mlr.press page) | distribution-preserving acceptance rule; training head vs inference algorithm — §4.4 |
| P44 | paper | Learning Transferable Visual Models From Natural Language Supervision (CLIP) | Radford, Kim, Hallacy, et al. | ICML 2021 (PMLR 139:8748–8763; proceedings page opened) | https://arxiv.org/abs/2103.00020 | https://github.com/openai/CLIP (README opened) | peer-reviewed | 2026-09-20 (abs; ar5iv full text; proceedings.mlr.press page; code README) | N×N symmetric contrastive objective, learned log-temperature, 400M pairs (§2.3) — §4.5 |
| R4.1 | paper | BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding | Devlin, Chang, Lee, Toutanova | NAACL 2019 (ACL Anthology N19-1423; page opened) | https://arxiv.org/abs/1810.04805 | https://github.com/google-research/bert (README opened) | peer-reviewed | 2026-09-20 (abs; ar5iv full text; aclanthology.org page; code README) | 15% masking, 80/10/10 rule, masked-only loss (§3.1) — §4.2 |
| R4.2 | paper | Language Models are Few-Shot Learners (GPT-3) | Brown et al. | NeurIPS 2020 | https://arxiv.org/abs/2005.14165 | null | peer-reviewed | 2026-09-20 (abs) | autoregressive decoder-only LM at scale; identity only — §4.1 lineage |
| R4.3 | paper | BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension | Lewis, Liu, Goyal, et al. | ACL 2020 (ACL Anthology 2020.acl-main.703; page opened) | https://arxiv.org/abs/1910.13461 | null | peer-reviewed | 2026-09-20 (abs; aclanthology.org page) | full-sequence denoising; text infilling and sentence permutation — §4.2 |
| R4.4 | paper | UL2: Unifying Language Learning Paradigms | Tay, Dehghani, Tran, et al. | ICLR 2023 / arXiv 2022 | https://arxiv.org/abs/2205.05131 | null | preprint (venue not confirmed on page) | 2026-09-20 (abs; ar5iv full text) | Mixture-of-Denoisers; R/S/X denoisers; paradigm tokens — §4.2 |
| R4.5 | paper | Efficient Training of Language Models to Fill in the Middle | Bavarian, Jun, Tezak, Schulman, McLeavey, Tworek, Chen | arXiv 2022 | https://arxiv.org/abs/2207.14255 | null | preprint | 2026-09-20 (abs; ar5iv full text) | PSM/SPM formats, loss on all sections, 50% rate, character-level split, document- vs context-level FIM, FIM-for-free — §4.3, verification |
| R4.6 | paper | Sequence Level Training with Recurrent Neural Networks | Ranzato, Chopra, Auli, Zaremba | ICLR 2016 / arXiv 2015 | https://arxiv.org/abs/1511.06732 | null | peer-reviewed | 2026-09-20 (abs) | train/test discrepancy, "errors may accumulate" — §4.1 exposure bias |
| R4.7 | paper | Scheduled Sampling for Sequence Prediction with Recurrent Neural Networks | Bengio, Vinyals, Jaitly, Shazeer | NeurIPS 2015 | https://arxiv.org/abs/1506.03099 | null | peer-reviewed | 2026-09-20 (abs) | curriculum from ground-truth to generated tokens — §4.1 |
| R4.8 | paper | Unified Language Model Pre-training for Natural Language Understanding and Generation (UniLM) | Dong, Yang, Wang, et al. | NeurIPS 2019 | https://arxiv.org/abs/1905.03197 | null | peer-reviewed | 2026-09-20 (abs) | unidirectional / bidirectional / seq2seq objectives via self-attention masks — §4.2 |
| R4.9 | paper | InCoder: A Generative Model for Code Infilling and Synthesis | Fried, Aghajanyan, Lin, et al. | ICLR 2023 / arXiv 2022 | https://arxiv.org/abs/2204.05999 | null | preprint (venue not confirmed on page) | 2026-09-20 (abs) | causal masking: masked regions moved to end of file — §4.3 |
| R4.10 | paper | Evaluating Large Language Models Trained on Code (Codex / HumanEval) | Chen et al. (OpenAI) | arXiv 2021 | https://arxiv.org/abs/2107.03374 | https://github.com/openai/human-eval (README opened; see R4.30) | preprint | 2026-09-20 (abs; ar5iv full text) | functional correctness by unit tests; unbiased pass@k; BLEU inadequacy — §4.3 |
| R4.11 | paper | StarCoder: may the source be with you! | Li, Ben Allal, Zi, et al. (BigCode) | arXiv 2023 | https://arxiv.org/abs/2305.06161 | null | preprint | 2026-09-20 (abs) | released infilling capability — §4.3 |
| R4.12 | paper | Code Llama: Open Foundation Models for Code | Rozière, Gehring, Gloeckle, et al. | arXiv 2023 | https://arxiv.org/abs/2308.12950 | null | preprint | 2026-09-20 (abs; ar5iv full text) | 0.9 infilling rate, PSM/SPM halves, prefix+middle joint encoding in SPM — §4.3 |
| R4.13 | paper | Better & Faster Large Language Models via Multi-token Prediction | Gloeckle, Youbi Idrissi, Rozière, Lopez-Paz, Synnaeve | arXiv 2024 | https://arxiv.org/abs/2404.19737 | null | preprint | 2026-09-20 (abs; arXiv HTML full text) | n independent heads; sequential head backward O(V+d); self-speculative decoding up to 3× — §4.4 |
| R4.14 | technical report | PaLM: Scaling Language Modeling with Pathways | Chowdhery et al. | arXiv 2022 | https://arxiv.org/abs/2204.02311 | null | preprint | 2026-09-20 (abs; ar5iv full text) | z-loss 10⁻⁴·log²Z for stability (§5) — §4.4 |
| R4.15 | paper | ST-MoE: Designing Stable and Transferable Sparse Expert Models | Zoph, Bello, Kumar, et al. | arXiv 2022 | https://arxiv.org/abs/2202.08906 | null | preprint | 2026-09-20 (abs; ar5iv full text) | router z-loss, c_z = 0.001, total-loss form — §4.4 |
| R4.16 | paper | Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads | Cai, Li, Geng, Peng, Lee, Chen, Dao | arXiv 2024 | https://arxiv.org/abs/2401.10774 | null | preprint | 2026-09-20 (abs) | extra decoding heads with tree-attention verification — §4.4 |
| R4.17 | paper | On Calibration of Modern Neural Networks | Guo, Pleiss, Sun, Weinberger | ICML 2017 (PMLR 70:1321–1330; proceedings page opened) | https://arxiv.org/abs/1706.04599 | null | peer-reviewed | 2026-09-20 (abs; ar5iv full text; proceedings.mlr.press page) | ECE definition; temperature scaling leaves argmax unchanged — §4.6 |
| R4.18 | paper | Robust Speech Recognition via Large-Scale Weak Supervision (Whisper) | Radford, Kim, Xu, Brockman, McLeavey, Sutskever | arXiv 2022 | https://arxiv.org/abs/2212.04356 | https://github.com/openai/whisper (README opened) | preprint | 2026-09-20 (abs; ar5iv full text; code README) | encoder–decoder audio-conditional LM; task/language special tokens; 680k hours — §4.5 |
| R4.19 | paper | Visual Instruction Tuning (LLaVA) | Liu, Li, Wu, Lee | NeurIPS 2023 | https://arxiv.org/abs/2304.08485 | null | peer-reviewed | 2026-09-20 (abs; ar5iv full text) | projection W; loss on answer tokens only; two-stage training — §4.5 |
| R4.20 | paper | Decision Transformer: Reinforcement Learning via Sequence Modeling | Chen, Lu, Rajeswaran, et al. | NeurIPS 2021 | https://arxiv.org/abs/2106.01345 | null | peer-reviewed | 2026-09-20 (abs) | return-conditioned autoregressive action generation — §4.5 |
| R4.21 | paper | A Generalist Agent (Gato) | Reed, Zolna, Parisotto, et al. | TMLR 2022 / arXiv 2022 | https://arxiv.org/abs/2205.06175 | null | preprint (venue not confirmed on page) | 2026-09-20 (abs) | serialised multi-modal, multi-embodiment token stream — §4.5 |
| R4.22 | documentation | Perplexity of fixed-length models | Hugging Face Transformers documentation | web, current | https://huggingface.co/docs/transformers/perplexity | null | official documentation | 2026-09-20 | PPL definition; tokenizer dependence; strided evaluation; 19.44 → 16.44 example (GPT-2-large, WikiText-2) — §4.6 |
| R4.23 | paper | Rethinking the Inception Architecture for Computer Vision | Szegedy, Vanhoucke, Ioffe, Shlens, Wojna | CVPR 2016 | https://arxiv.org/abs/1512.00567 | null | peer-reviewed | 2026-09-20 (abs; ar5iv full text) | label smoothing q′ = (1−ε)δ + ε/K, ε = 0.1 — §4.1, §4.6 |
| R4.24 | documentation | torch.nn.functional.cross_entropy | PyTorch documentation, version 2.14.0 | web | https://docs.pytorch.org/docs/2.14/generated/torch.nn.functional.cross_entropy.html | null | official documentation | 2026-09-20 | ignore_index and mean-over-non-ignored semantics; label_smoothing — §4.1 |
| R4.25 | repository | torchtitan — `torchtitan/components/loss.py` | PyTorch (TorchTitan) | GitHub, `main` branch | https://github.com/pytorch/torchtitan | https://github.com/pytorch/torchtitan | official documentation (source file; commit not pinned) | 2026-09-20 (raw file on `main`) | `cross_entropy_loss` with `reduction="sum"`, division by `global_valid_tokens` — §4.1 |
| R4.26 | repository | Liger Kernel — `src/liger_kernel/ops/fused_linear_cross_entropy.py` | LinkedIn (Liger Kernel) | GitHub, `main` branch | https://github.com/linkedin/Liger-Kernel | https://github.com/linkedin/Liger-Kernel | official documentation (source file; commit not pinned) | 2026-09-20 (README; raw file on `main`) | chunked fused linear cross-entropy; gradient in forward; weight-gradient accumulation — §4.1 |
| R4.27 | repository | NVIDIA/Megatron-LM repository (README: "contains two components: Megatron-LM and Megatron Core") — `megatron/core/tensor_parallel/cross_entropy.py` | NVIDIA | GitHub, `main` branch | https://github.com/NVIDIA/Megatron-LM | https://github.com/NVIDIA/Megatron-LM | official documentation (source file; commit not pinned) | 2026-09-20 (repository README; raw file on `main`; Megatron-Core docs landing page https://docs.nvidia.com/megatron-core/index.html) | `vocab_parallel_cross_entropy`: MAX and SUM all-reduces across the TP group — §4.1 |
| R4.28 | documentation | T5 model documentation | Hugging Face Transformers documentation, v5.17.0 | web | https://huggingface.co/docs/transformers/model_doc/t5 | null | official documentation | 2026-09-20 | `extra_ids` = 100 sentinels; `<extra_id_k>` example; `_shift_right`; −100 label masking — §4.2 |
| R4.29 | model card | DeepSeek-V3 repository README | DeepSeek-AI | GitHub, `main` branch | https://github.com/deepseek-ai/DeepSeek-V3 | https://github.com/deepseek-ai/DeepSeek-V3 | official documentation (commit not pinned) | 2026-09-20 | 685B total = 671B main-model weights + 14B MTP-module weights; MTP usable for speculative decoding; framework MTP support "under active development" — §4.4 |
| R4.30 | repository | human-eval — evaluation harness README | OpenAI | GitHub, `main` branch | https://github.com/openai/human-eval | https://github.com/openai/human-eval | official documentation (commit not pinned) | 2026-09-20 | untrusted-code execution warning; sandbox requirement — §4.3 |

Notes:

- The NVIDIA Megatron-Core developer-guide page for tensor-parallel utilities was requested and returned HTTP 404 on 2026-09-20; the raw Megatron-LM source file (R4.27) was used instead. No claim about Megatron-Core documentation is made.
- P08 is listed because the chapter names the scaling-fit family of Eq. N.3 as the consumer of ℓ; no detail from P08 is asserted, so it was not opened for this chapter.
- Venue attributions that say "page opened" were confirmed on the proceedings, anthology, or journal page on 2026-09-20 (P01, P02, P35, P44, R4.1, R4.3, R4.17). The remaining `peer-reviewed` venue attributions (P10, R4.2, R4.6, R4.7, R4.8, R4.19, R4.20, R4.23) are the author's bibliographic attribution and were **not** confirmed on a proceedings page this edition; treat their venue cell as UNVERIFIED until the §2.1 conference workflow is run for them. Rows marked "venue not confirmed on page" are kept at status `preprint` regardless of later publication.
- Official-code cells without "(README opened)" were not opened and are either `null` or carried from the paper; https://github.com/deepseek-ai and https://github.com/openai organisation pages were opened on 2026-09-20.
