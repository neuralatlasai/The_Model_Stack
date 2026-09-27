---
id: ms.references.17
entity_type: references
title: "Chapter 17 references"
short_title: "Chapter 17 references"
section: null
slug: references
parent: ms.chapter.17
prev_sibling: null
next_sibling: null
children: []
prerequisites: [ms.chapter.2, ms.chapter.13, ms.chapter.14, ms.chapter.15]
downstream: [ms.chapter.27, ms.chapter.42]
word_count_target: 1200
volume: 1
part: 3
chapter: 17
related: []
relations: []
axes: {lifecycle: [pretraining, inference, evaluation], mechanism: [recurrent_state, state_space, linear_attention], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P11, P12]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.triton-language]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-27
editorial_status: manuscript_draft
---


# Chapter 17 — References and evidence boundaries

Primary sources were inspected on **2026-09-26 and 2026-09-27** through the routes in Instruction/AI_REFERENCE_STACK.md. The chapter's book-plan anchors are Mamba [P11] and Gated Delta Networks [P12]. Historical methods retain their original dates. Current model and documentation pages are access-dated and explicitly unpinned; availability in 2026 is not a claim of benchmark leadership.

## Typed reference records

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P11 | paper | Mamba (full title: Mamba: Linear-Time Sequence Modeling with Selective State Spaces) | Gu and Dao | arXiv 2023 (v2 2024) | https://arxiv.org/abs/2312.00752 | null | preprint | Selective parameters and structured execution; 17.1–17.2 | 2026-09-26 |
| P12 | paper | Gated Delta Networks: Improving Mamba2 with Delta Rule | Songlin Yang; Jan Kautz; Ali Hatamizadeh | arXiv 2024; v3 2025, ICLR 2025 camera-ready record | https://arxiv.org/abs/2412.06464 | null | preprint | Gated delta recurrence and block design; 17.4 | 2026-09-27 |
| R17.1 | paper | Transformers are SSMs: Generalized Models and Efficient Algorithms Through Structured State Space Duality | Tri Dao; Albert Gu | ICML 2024, PMLR 235:10041–10071 | https://proceedings.mlr.press/v235/dao24a.html | null | peer-reviewed | Structured state-space duality and Mamba-2; 17.2 | 2026-09-26 |
| R17.2 | paper | Transformers are RNNs: Fast Autoregressive Transformers with Linear Attention | Angelos Katharopoulos; Apoorv Vyas; Nikolaos Pappas; François Fleuret | ICML 2020, PMLR 119:5156–5165 | https://proceedings.mlr.press/v119/katharopoulos20a.html | null | peer-reviewed | Feature-map factorization and causal recurrent statistics; 17.3 | 2026-09-27 |
| R17.3 | paper | Zoology: Measuring and Improving Recall in Efficient Language Models | Simran Arora; Sabri Eyuboglu; Aman Timalsina; Isys Johnson; Michael Poli; James Zou; Atri Rudra; Christopher Ré | arXiv 2023, v1 | https://arxiv.org/abs/2312.04927 | null | preprint | Associative-recall evaluation motivation; 17.6 | 2026-09-26 |
| R17.4 | technical report | Nemotron-H: A Family of Accurate and Efficient Hybrid Mamba-Transformer Models | NVIDIA et al. | arXiv 2025; inspected v4, 2025-09-05 | https://arxiv.org/abs/2504.03624 | null | preprint | Disclosed Mamba-2/attention/FFN hybrid example; 17.5 | 2026-09-26 |
| R17.5 | model card | Qwen3-Next-80B-A3B-Instruct | Alibaba Qwen | Moving model card; repository revision not pinned | https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct | null | official documentation | Disclosed Gated DeltaNet/gated-attention hybrid; 17.5 | 2026-09-27 |
| R17.6 | documentation | Qwen3-Next | Hugging Face Transformers | Moving main documentation; package revision not pinned | https://huggingface.co/docs/transformers/main/en/model_doc/qwen3_next | null | official documentation | Current model-definition surface and hybrid composition; 17.1, 17.2, 17.4, 17.5 | 2026-09-26 |
| R17.7 | documentation | triton.language.associative_scan | Triton language | Moving main documentation; compiler revision not pinned | https://triton-lang.org/main/python-api/generated/triton.language.associative_scan.html | null | official documentation | Associative-scan primitive interface; 17.1–17.6 | 2026-09-26 |
| R17.8 | documentation | torch.linalg.matrix_exp | PyTorch | Versioned documentation path 2.12 | https://docs.pytorch.org/docs/2.12/generated/torch.linalg.matrix_exp.html | null | official documentation | Matrix-exponential reference operator; 17.2 | 2026-09-26 |

A null code field means this ledger makes no repository-specific verification claim. It does not mean source code is unavailable. Preprint status describes the cited arXiv surface; the P12 record separately notes its camera-ready designation. P11 preserves existing book-wide spine metadata.

## P11

**PAPER-REPORTED.** The [v2 full text](https://arxiv.org/html/2312.00752v2) supports the selective-parameter and hardware-aware-scan anchors. The manuscript distinguishes exact zero-order-hold background from the discretization actually selected by an implementation. It does not transfer benchmark ratios, infer unlimited recall, or treat a recurrence equation as the whole Mamba block.

The chapter's finite-state counting proof, boundary contract, and numerical stress protocol are independent explanatory analysis. They are not represented as the paper's experimental results.

## P12

**PAPER-REPORTED.** The [v3 full text](https://arxiv.org/html/2412.06464v3), dated 2025-03-06, was used for the final recurrence and block-design check. The initial v1 was also inspected; v3 controls the manuscript's source-specific statements. Section 3.1 provides the gated recurrence, and §3.4 identifies normalization and local processing.

The chapter maps the source's update strength to $\eta_t$ and uses $H_t$ for the value-by-key state matrix. Gate endpoints and spectral bounds are explicitly mathematical analysis. No reported benchmark table or speed ratio is reproduced. The local squared-error interpretation does not imply that a deployment system updates its persistent model parameters.

## R17.1

**PAPER-REPORTED.** The [ICML record](https://proceedings.mlr.press/v235/dao24a.html) and [arXiv full text](https://arxiv.org/html/2405.21060v1) establish bibliographic identity and the structured-duality anchor. The title is not interpreted as an unrestricted equivalence between arbitrary softmax Transformers and fixed-size recurrent models.

The chapter derives a scalar-decay example to make the causal sequence matrix visible. It does not claim that every SSM has identical transition structure or equal implementation cost.

## R17.2

**PAPER-REPORTED.** The [archival page](https://proceedings.mlr.press/v119/katharopoulos20a.html) and [paper PDF](https://proceedings.mlr.press/v119/katharopoulos20a/katharopoulos20a.pdf) identify the factorized-attention construction. The chapter independently expands the causal sums and states its feature-domain and denominator conditions.

The duplicate-feature counterexample isolates an aggregation primitive. It is not attributed as a theorem about all contextualized networks in the source. Historical speed claims are not transferred to current hardware.

## R17.3

**PAPER-REPORTED.** The [full text](https://arxiv.org/html/2312.04927v1) motivates recall-focused diagnostics and multi-query associative recall. The chapter's factorial task design, exact-copy analysis, and proposed measurement ledger are methodological extensions labeled as such.

A source-reported benchmark ordering is not used as a current ranking. The chapter does not assume that a task originally used for one architecture family has identical difficulty under a different tokenizer or training distribution.

## R17.4

**PAPER-REPORTED.** The [v4 full text](https://arxiv.org/html/2504.03624v4), particularly its architecture discussion in §2, supplies a concrete hybrid example. Only the disclosed combination of Mamba-2, attention, and feed-forward components is used here.

The symbolic hybrid memory formula is a generic accounting derivation, not a reconstruction of every buffer in Nemotron-H. Reported speedups, precision recipes, parameter counts, and downstream scores are not imported into this chapter's comparisons.

## R17.5

**OFFICIAL-DOCUMENTATION.** The [official Qwen model card](https://huggingface.co/Qwen/Qwen3-Next-80B-A3B-Instruct) provides a current public hybrid example. The manuscript uses only the disclosed combination of Gated DeltaNet and gated attention. The page is mutable and no repository commit was pinned.

No model was downloaded or executed. Undisclosed training details are not inferred from the model name, and the card's benchmark claims are not independently reproduced.

## R17.6

**OFFICIAL-DOCUMENTATION.** The [Transformers main documentation](https://huggingface.co/docs/transformers/main/en/model_doc/qwen3_next) is a model-definition route. Its architecture description was inspected, but no installed package version or selected kernel was validated against it.

Implementation sections distinguish proposed inspection steps from source-confirmed behavior. In particular, the chapter's transactional rollback protocol is a derived correctness requirement, not a claim that this documentation promises a particular rollback API.

## R17.7

**OFFICIAL-DOCUMENTATION.** The [Triton scan documentation](https://triton-lang.org/main/python-api/generated/triton.language.associative_scan.html) specifies input tensors, an axis, a combining function, and optional reverse traversal. A combining function must follow the documented compilation contract.

The chapter supplies the mathematical associativity argument separately. Availability of this primitive does not establish an efficient dense-matrix scan, distributed scan, or Gated DeltaNet implementation.

## R17.8

**OFFICIAL-DOCUMENTATION.** The [PyTorch 2.12 matrix-exponential page](https://docs.pytorch.org/docs/2.12/generated/torch.linalg.matrix_exp.html) supplies a versioned reference-operator surface. This is a documentation version, not a claim that the local environment runs that release.

The continuous-time derivation and scalar zero-limit treatment are mathematical background. Dense matrix exponentiation is proposed only for small reference systems; the manuscript does not prescribe it as a production diagonal-state kernel.

## Evidence and originality boundary

**DERIVED.** The chapter contains original explanatory prose, worked algebra, and experimental protocols. Claim-local keys identify the limited source-dependent mechanisms. Equations that follow from the declared definitions are labeled mathematical derivations; architectural disclosures are labeled according to their source type.

**UNVERIFIED.** No model training, inference benchmark, publication-scale reproduction, or independent corpus-wide plagiarism scan was performed. No absolute originality score or zero-error guarantee is asserted. All six model experiments remain proposals. Numerical consistency checks of the manuscript's examples do not constitute model-quality evidence.

