---
id: ms.references.8
entity_type: references
title: References — cleaning and quality estimation
short_title: References
volume: 1
part: 2
chapter: 8
section: null
slug: references
parent: ms.chapter.8
prev_sibling: ms.verification.8
next_sibling: null
children: []
prerequisites: []
downstream: []
related: [ms.section.8.2, ms.section.8.6]
siblings_by_mechanism: []
relations: []
axes:
  lifecycle: [data, evaluation]
  mechanism: [quality_filtering]
  feedback_setting: []
  modality: [text]
papers: [P03]
implementations: []
benchmarks: []
datasets: []
status:
  maturity: established
  disputed: false
evidence_summary:
  labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, UNVERIFIED]
  empirically_observed: false
word_count_target: 500
updated_at: 2026-10-09
editorial_status: manuscript_draft
---

# References — cleaning and quality estimation

This ledger records the bounded source inspection for Figures 8.36–8.37 and Eq. 8.4 on 2026-10-08, extended on 2026-10-09 to the six primary sources cited by Figures 8.30, 8.34 and 8.35. Each entry states the inspected revision and claim locator. Other inherited R8 keys and detailed chapter assertions remain unaudited; a registered source does not establish every assertion attributed to it elsewhere in this chapter.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| R8.7 | paper | Language Models are Few-Shot Learners | Brown et al. / OpenAI | NeurIPS 2020 | https://arxiv.org/html/2005.14165v4 | null | preprint | Inspected v4, 22 Jul 2020, Appendix A: explicit np.random.pareto(α) > 1 − document_score keep rule, α = 9, classifier/reference-set description and rationale for choosing α. Supports the reported exponent/construction in Figure 8.36, not a matched classifier distribution, finite-RNG execution claim or corpus retention estimate. | 2026-10-08 |
| P03 | paper | The Pile: An 800GB Dataset of Diverse Text for Language Modeling | Gao et al. / EleutherAI | preprint 2020 | https://arxiv.org/html/2101.00027v1 | null | preprint | Inspected v1, 31 Dec 2020, Appendix C.1.4: same Pareto thresholding with α = 3; fastText bigram classifier and OpenWebText2 reference choice; target filtering-ratio rationale. Table 6 reports corpus-specific retention, which is not plotted or inferred by Figure 8.36. | 2026-10-08 |
| R8.41 | documentation | numpy.random.pareto | NumPy Developers | NumPy 2.3 documentation | https://numpy.org/doc/2.3/reference/random/generated/numpy.random.pareto.html | null | official documentation | Inspected versioned 2.3 manual, Overview/Parameters/Notes/Examples: output is a unit-scale zero-location Lomax variable, shape a > 0, and X + 1 is classical Pareto. Notes display the classical shifted/scaled density used in the example; survival for X is independently derived after the shift. The papers' installed NumPy versions are not disclosed. The stable v2.5 manual was also inspected and explicitly displays the Lomax density a/(1+x)^(a+1); its stable URL is unpinned. | 2026-10-08 |
| R8.13 | paper | Poisoning Web-Scale Training Datasets is Practical | Carlini et al. / Google and collaborators | preprint 2024 revision | https://arxiv.org/html/2302.10149v2 | null | preprint | Inspected v2, 6 May 2024, Sections III–IV and VI-B–VI-C: split-view and frontrunning threat models, content-hash verification and timing defenses. Supports Figure 8.34's provenance motivation, not its assumed filter pass probabilities, MinHash graph, or attack-success threshold. The inherited numerical Common Crawl/Oromo claim explicitly attributed to v1 Appendix B.3 was not checked in this inspection. | 2026-10-09 |
| R8.33 | paper | A Pretrainer's Guide to Training Data: Measuring the Effects of Data Age, Domain Coverage, Quality, & Toxicity | Longpre et al. / Google Research and collaborators | preprint 2023 revision | https://arxiv.org/html/2305.13169v2 | null | preprint | Inspected v2, 13 Nov 2023, Sections 2.1–2.4 and 5; Figure 6 visually inspected, including T = 0.7 (46% remaining) and Books QA change −6.7; Table 15 gives 45.6% remaining before rounding. Appendix C.1/Table 5: LM-XL 1.5B, TPU 8×8×8, sequence 512, T5X/TensorFlow. Appendix C.5/Table 9: domain evaluation is average QA F1; Books is NarrativeQA. These are corpus retention and downstream F1 changes, not speed measurements. | 2026-10-09 |
| R8.35 | paper | AboutMe: Using Self-Descriptions in Webpages to Document the Effects of English Pretraining Data Filters | Lucy et al. / Ai2 and collaborators | preprint 2024 revision | https://arxiv.org/html/2401.06408v3 | null | preprint | Inspected v3, 20 Jun 2024, Sections 2–4, especially Section 4.4/Figure 5, with filtering cutoffs in Section 4 and Appendix B. Reports the 2.4× CLD2 removal-rate ratio for Eastern Asia versus Northern Europe in the AboutMe-associated webpage population. CLD2 score ties make the removed tail 5.2%, rather than the nominal 10%; this observational comparison is not a universal regional error rate or causal estimate. | 2026-10-09 |
| R8.37 | paper | DataDecide: How to Predict Best Pretraining Data with Small Experiments | Magnusson et al. / Ai2 and University of Washington | preprint 2025 revision | https://arxiv.org/html/2504.11393v2 | null | preprint | Inspected v2, 13 Jul 2025, Sections 2.1–2.5 and 3.1–3.4, Figures 1–5. Section 2.1 reports up to two accuracy points of run standard deviation for some recipes at 1B, 100 tokens per parameter (5× Chinchilla). Approximately 80% pairwise prediction accuracy from 150M targets the suite's 1B ranking and depends on task/metric. Figure 8.35's normal seed model and selected noise values are book-derived illustrations, not replications of these experiments. | 2026-10-09 |
| R8.38 | paper | Nemotron-CC: Transforming Common Crawl into a Refined Long-Horizon Pretraining Dataset | Su et al. / NVIDIA | preprint 2025 revision | https://arxiv.org/html/2412.02595v2 | null | preprint | Inspected v2, 30 May 2025, Section 2.1/Table 1: 13-snapshot jusText high-quality token counts 127B unfiltered versus 104B filtered, judged by FineWeb-Edu. Sections 3.1 and 3.3/Table 7: MMLU 55.5 unfiltered versus 57.5 with only HQ unfiltered, 8B/1T runs with a 73% variable Common Crawl blend. Appendices D, F and G specify training, snapshots and ablation classifier; D reports 1024 H100 GPUs and Megatron-LM. This is conditional filter application, not a measured swap of two fixed stages; Table 7 supplies no seed uncertainty. | 2026-10-09 |
| R8.39 | paper | Poisoning Attacks on LLMs Require a Near-constant Number of Poison Samples | Souly et al. / UK AI Security Institute, Anthropic and collaborators | preprint 2025 | https://arxiv.org/html/2510.07192v1 | null | preprint | Inspected v1, 8 Oct 2025, Sections 2 and 3.1–3.2/Figure 2: controlled denial-of-service backdoor experiments, dense 600M–13B autoregressive models, roughly 20 training tokens per parameter, three seeds per configuration. Reports success with 250 poisoned documents across tested model sizes and 0.00016% of training tokens at 13B. This count belongs to that experimental attack and evaluation; it is neither a universal attack budget nor a measurement of survival through a filtering/deduplication chain. | 2026-10-09 |

Figure 8.37 is an exact transformation of the section's Eq. 8.3 under its stated positive accepted-mass condition. Its display interval is not a sampled prior or classifier scenario. Figure 8.36 evaluates the documented continuous probability law using reported exponents; no corpus or language-model measurement was fabricated, and no sampling experiment was executed.

Figure 8.30 juxtaposes heterogeneous corpus, classification, evaluation and poisoning studies; its context explicitly preserves those separate boundaries. Figure 8.34 computes expected survival budgets and candidate-edge marginals under stated assumptions; neither cited poisoning paper establishes its pass probabilities or guarantees graph connectivity. Figure 8.35 evaluates a normal-noise decision model with a displayed logistic approximation. No new training, poisoning or filtering experiment was executed for this update.
