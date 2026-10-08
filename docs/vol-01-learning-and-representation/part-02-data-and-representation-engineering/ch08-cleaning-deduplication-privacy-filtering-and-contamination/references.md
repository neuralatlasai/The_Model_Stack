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
related: [ms.section.8.2]
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
updated_at: 2026-10-08
editorial_status: manuscript_draft
---

# References — cleaning and quality estimation

This ledger was created for Figures 8.36–8.37 and the directly associated Eq. 8.4 derivation. These three sources were inspected on 2026-10-08. The inherited chapter's other R8 keys and detailed assertions have not been audited by this bounded update; their absence below is an evidence gap, not an assertion that they are supported by these entries.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| R8.7 | paper | Language Models are Few-Shot Learners | Brown et al. / OpenAI | NeurIPS 2020 | https://arxiv.org/html/2005.14165v4 | null | preprint | Inspected v4, 22 Jul 2020, Appendix A: explicit np.random.pareto(α) > 1 − document_score keep rule, α = 9, classifier/reference-set description and rationale for choosing α. Supports the reported exponent/construction in Figure 8.36, not a matched classifier distribution, finite-RNG execution claim or corpus retention estimate. | 2026-10-08 |
| P03 | paper | The Pile: An 800GB Dataset of Diverse Text for Language Modeling | Gao et al. / EleutherAI | preprint 2020 | https://arxiv.org/html/2101.00027v1 | null | preprint | Inspected v1, 31 Dec 2020, Appendix C.1.4: same Pareto thresholding with α = 3; fastText bigram classifier and OpenWebText2 reference choice; target filtering-ratio rationale. Table 6 reports corpus-specific retention, which is not plotted or inferred by Figure 8.36. | 2026-10-08 |
| R8.41 | documentation | numpy.random.pareto | NumPy Developers | NumPy 2.3 documentation | https://numpy.org/doc/2.3/reference/random/generated/numpy.random.pareto.html | null | official documentation | Inspected versioned 2.3 manual, Overview/Parameters/Notes/Examples: output is a unit-scale zero-location Lomax variable, shape a > 0, and X + 1 is classical Pareto. Notes display the classical shifted/scaled density used in the example; survival for X is independently derived after the shift. The papers' installed NumPy versions are not disclosed. The stable v2.5 manual was also inspected and explicitly displays the Lomax density a/(1+x)^(a+1); its stable URL is unpinned. | 2026-10-08 |

Figure 8.37 is an exact transformation of the section's Eq. 8.3 under its stated positive accepted-mass condition. Its display interval is not a sampled prior or classifier scenario. Figure 8.36 evaluates the documented continuous probability law using reported exponents; no corpus or language-model measurement was fabricated, and no sampling experiment was executed.
