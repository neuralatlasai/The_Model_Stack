---
id: ms.section.9.5
entity_type: section
title: Multilingual and specialist mixtures
short_title: Multilingual and specialist
volume: 1
part: 2
chapter: 9
section: 9.5
slug: 09-5-multilingual-and-specialist-mixtures
parent: ms.chapter.9
prev_sibling: ms.section.9.4
next_sibling: ms.section.9.6
children: []
prerequisites: [ms.section.4.3, ms.section.7.2, ms.section.9.1, ms.section.9.2, ms.section.9.4]
downstream: [ms.section.9.6, ms.section.10.3, ms.section.22.2, ms.section.22.4, ms.section.31.2]
related: [ms.section.13.5]
siblings_by_mechanism: [ms.section.9.1, ms.section.22.2]
relations:
  - {type: supported_by, target: paper.P25}
  - {type: consumes, target: concept.token-fertility}
axes:
  lifecycle: [data, pretraining, continued_training]
  mechanism: [data_mixture, multilingual_sampling, domain_transfer, interference]
  feedback_setting: []
  modality: [text]
papers: [P25]
implementations: []
benchmarks: []
datasets: [mc4, deepseekmath-corpus]
status:
  maturity: active
  disputed: true
evidence_summary:
  labels_used: [PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED]
  empirically_observed: false
word_count_target: 2200
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# 9.5 Multilingual and specialist mixtures

## Scope

Objective: extend the mixture formulation to the two cases where a token is not a fixed unit of content — languages with different fertility under one tokenizer, and specialist domains (code, mathematics) whose value is measured on tasks outside their own validation loss — and give the mechanisms of resource imbalance, cross-lingual and cross-domain transfer, and interference. Baseline: token-share weights applied uniformly across languages and domains. Success criterion: the reader can convert a content-share target into token weights under a named tokenizer, can allocate a budget across languages with an epoch cap, and can state what the disclosed code/math recipes actually report. Boundaries: fertility and vocabulary economics are owned by [§10.3](../ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md) — this section *uses* fertility and does not define it; retention under distribution shift is owned by [§22.4](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-4-retention-and-interference.md); code objectives are [§4.3](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-3-code-and-structured-sequences.md).

## Why this exists

What failed before was treating the weight vector as a statement about content when it is a statement about tokens. PAPER-REPORTED (R9.15): the same text translated into different languages can have tokenization lengths differing by up to 15× under one tokenizer, and by more than 4× for some pairs even under byte-level models; a 5% token share for a high-fertility language is therefore a much smaller share of content, and its epochs, computed in tokens, understate how many times its bytes were repeated. The bottleneck in multilingual training is resource imbalance: PAPER-REPORTED (R9.13): XLM-R trained on one hundred languages from more than two terabytes of filtered Common Crawl and reported a trade-off "between positive transfer and capacity dilution"; PAPER-REPORTED (R9.11): mT5's α = 0.3 was chosen because "if low-resource languages are sampled too often, the model may overfit; if high-resource languages are not trained on enough, the model will underfit". The dominant constraint is capacity shared across languages and domains that compete for it: PAPER-REPORTED (R9.14): across more than 10,000 small models on 250 languages, adding multilingual data in moderation helped low-resource languages "similar to increasing low-resource dataset sizes by up to 33%", depended on syntactic similarity, and "high-resource languages consistently perform worse in multilingual pre-training scenarios", with the harm growing as dataset size grows relative to capacity. What changed is that specialist domains were shown to transfer across task boundaries — code to reasoning, math corpora to general benchmarks — so the mixture is now chosen for its cross-domain effect, and the open recipes that disclose their specialist mixtures (P25) are the only quantitative anchors.

## Intuition

Physically, a language's share of the *bytes* the model reads is what determines the content it sees; the tokenizer converts bytes to tokens at a language-dependent rate, and the loss, the FLOPs and the sequence positions are all counted in tokens. A high-fertility language therefore costs more FLOPs per byte of content and fills the context with fewer bytes; at equal token share it has seen less content, and at equal content share it has consumed more compute. The two accountings — content and compute — disagree by the fertility ratio, and the mixture must state which one its weights are in. For specialist domains the physics is simpler: code and mathematics are token streams like any other, but their *evaluation* is on tasks (program synthesis, problem solving) whose relation to the domain's own perplexity is weak, so the weight is chosen by transfer measurements rather than by in-domain loss. Heuristically, code "teaches reasoning"; the physical content is that adding code tokens changed measured performance on non-code tasks in controlled ablations (R9.28), with the mechanism unknown.

## Formulation

Let languages (or domains) i = 1..k have available bytes b_i and available tokens n_i = φ_i b_i under tokenizer τ_id, where φ_i is the fertility of language i in tokens per byte (the quantity defined and analysed in [§10.3](../ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md); this section only consumes it).

> **Definition — content-share weight.** A domain weight v_i expressed as a share of bytes (or words) rather than tokens, related to the token weight w_i through fertility by Eq. 9.19.

$$
w_i = \frac{v_i\,\varphi_i}{\sum_j v_j\,\varphi_j}, \qquad e_i = \frac{w_i\,D}{n_i} = \frac{v_i\,D}{b_i \sum_j v_j \varphi_j}
$$
*(Eq. 9.19)* where D is consumed tokens; the second equality shows that effective epochs are invariant to whether one counts bytes or tokens once the conversion is applied consistently, but *differ* between the two conventions when weights are set without conversion. MATHEMATICALLY-DERIVED.

<details><summary>Derivation of Eq. 9.19</summary>

Consumed tokens of language i are w_i D; consumed bytes are w_i D/φ_i. A content-share target v_i requires w_i D/φ_i ∝ v_i, i.e. w_i ∝ v_i φ_i, normalised over j. Epochs in bytes are (w_i D/φ_i)/b_i; substituting w_i and n_i = φ_i b_i gives the stated form. If a practitioner sets w_i = v_i directly (no conversion), the realised content share is v_i/φ_i normalised, so the content *ratio* between two languages is off by their fertility ratio — for a 15× fertility gap (R9.15), the high-fertility language is under-represented 15× relative to the other. After renormalisation its absolute share falls by the smaller factor Σ_j v_j φ_i/φ_j, the content-weighted mean of its fertility ratios, which approaches 15 only when its own share is small (for two languages, 15 − 14 v_i: 8× at v_i = 0.5). MATHEMATICALLY-DERIVED.

</details>

```figure
id: fig-9.25
kind: calculator
title: Content shares to token weights under fertility
caption: >-
  Eq. 9.19 for three languages with fertilities 0.25, 0.4 and 0.75 tokens per
  byte, the 3× range Experiment 9.5 asks for; the values are illustrative, not
  measured on any tokenizer. Content shares of 60/30/10 need token weights of
  43/35/22. Scroll: the conversion, the fertility-blind arm that writes the
  content shares straight into the token weights, and a tokenizer migration
  that silently changes what an unchanged policy file means.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-9.19", R9.15]
alt: >-
  Calculator for Eq. 9.19, w_i = v_i·φ_i / Σ_j v_j·φ_j, with content shares
  v_1, v_2 (v_3 = 1 − v_1 − v_2) and fertilities φ_1, φ_2, φ_3 in tokens per
  byte. At the illustrative defaults v = 60%, 30%, 10% and φ = 0.25, 0.4, 0.75
  the token weights are 43.5%, 34.8% and 21.7%. If the content shares are used
  directly as token weights, language 3 receives 4.1% of the bytes instead of
  10%, a 2.46× under-representation. With φ_3 = 0.5 after a tokenizer change
  the same content target needs w_3 = 15.6%, and the old 21.7% would give
  language 3 14.3% of the bytes.
spec:
  tex: >-
    w_i = \frac{v_i\,\varphi_i}{\sum_j v_j\,\varphi_j},\qquad \text{content share if } w = v:\ \frac{v_i/\varphi_i}{\sum_j v_j/\varphi_j}
  equation: "9.19"
  inputs:
    - { symbol: v1, label: "content share v_1", default: 0.6, min: 0.05, max: 0.9, step: 0.05, format: percent }
    - { symbol: v2, label: "content share v_2 (v_3 = 1 − v_1 − v_2)", default: 0.3, min: 0.05, max: 0.9, step: 0.05, format: percent }
    - { symbol: p1, label: "fertility φ_1, tokens per byte", default: 0.25, min: 0.1, max: 2, step: 0.05, format: fixed2 }
    - { symbol: p2, label: "fertility φ_2", default: 0.4, min: 0.1, max: 2, step: 0.05, format: fixed2 }
    - { symbol: p3, label: "fertility φ_3", default: 0.75, min: 0.1, max: 2, step: 0.05, format: fixed2 }
  outputs:
    - { symbol: w1, label: "token weight w_1", formula: "v1*p1/(v1*p1 + v2*p2 + (1 - v1 - v2)*p3)", format: percent }
    - { symbol: w2, label: "token weight w_2", formula: "v2*p2/(v1*p1 + v2*p2 + (1 - v1 - v2)*p3)", format: percent }
    - { symbol: w3, label: "token weight w_3", formula: "(1 - v1 - v2)*p3/(v1*p1 + v2*p2 + (1 - v1 - v2)*p3)", format: percent, emphasis: true }
    - { symbol: c3, label: "language 3 content share if w = v", formula: "((1 - v1 - v2)/p3)/(v1/p1 + v2/p2 + (1 - v1 - v2)/p3)", format: percent }
    - { symbol: under, label: "fertility-blind under-representation of 3", formula: "(1 - v1 - v2)/c3", format: ratio }
states:
  - { anchor: formulation, label: "3× fertility range", variables: { v1: 0.6, v2: 0.3, p1: 0.25, p2: 0.4, p3: 0.75 }, highlight: [w1, w2, w3], note: "Content shares 60/30/10 become token weights 43.5/34.8/21.7: the high-fertility language needs more than twice its content share in tokens." }
  - { anchor: experimental-design, label: "token-share-as-set arm", variables: { v1: 0.6, v2: 0.3, p1: 0.25, p2: 0.4, p3: 0.75 }, highlight: [c3, under], note: "Experiment 9.5's fertility-blind arm writes 60/30/10 as token weights: language 3 then reads 4.1% of the bytes, 2.46× less content than intended." }
  - { anchor: failure-modes, label: "tokenizer migration, φ_3 = 0.5", variables: { v1: 0.6, v2: 0.3, p1: 0.25, p2: 0.4, p3: 0.5 }, highlight: [p3, w3], note: "A new tokenizer lowers φ_3 to 0.5: the same content target now needs w_3 = 15.6%. Keep the old 21.7% and language 3 silently gets 14.3% of the bytes, not 10%." }
```

**Temperature and cap in content units.** Eq. 9.3 and Eq. 9.5 of [§9.1](09-1-mixture-formulation.md) apply unchanged with n_i replaced by b_i and the cap E_max applied to byte epochs; the UniMax construction (R9.12) allocates characters, not tokens, for exactly this reason. PAPER-REPORTED (R9.12): sort languages by ascending character count, allocate the remaining budget uniformly among the remaining languages, cap each language at N epochs of its corpus and redistribute — the best results at N = 1 with a small effect.

```figure
id: fig-9.26
kind: calculator
title: Epoch-capped allocation against α = 0.3 temperature
caption: >-
  Algorithm 9.5's allocation steps for three languages in ascending byte
  order (uniform share of the remainder, capped at E_max byte epochs), beside
  Eq. 9.3 at α = 0.3 in bytes on the same budget. The cap reads every language
  at most E_max times; temperature reads the smallest 14 times at a 100× size
  range and 77 times at 1000×. At four times the budget the cap binds on all
  three languages and the planner must report a shortfall instead of
  repeating the tail. Illustrative byte counts, not a named crawl.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:alg-9.5", "DERIVED:eq-9.3", R9.12, R9.11]
alt: >-
  Calculator over three languages' bytes b_1 ≤ b_2 ≤ b_3, a byte budget B and
  a byte-epoch cap E_max. UniMax-style allocation: a_1 = min(B/3, E·b_1),
  a_2 = min((B − a_1)/2, E·b_2), a_3 = min(B − a_1 − a_2, E·b_3), epochs
  a_i/b_i, shortfall B − Σ a_i. At the illustrative defaults b = 10G, 100G and
  1T bytes, B = 1T and E_max = 1: epochs 1, 1 and 0.89, no shortfall; α = 0.3
  temperature gives 14.3 epochs for the smallest and 0.57 for the largest.
  With b_1 = 1G: capped 1, 1, 0.90; temperature 77.4 and 0.61, a 126× ratio.
  With b_1 = 1G and B = 4T: the cap leaves 2.9T bytes unallocated; temperature
  would read the smallest language 310 times.
spec:
  tex: >-
    a_1 = \min\!\Big(\tfrac{B}{3}, E\,b_1\Big),\ a_2 = \min\!\Big(\tfrac{B - a_1}{2}, E\,b_2\Big),\ a_3 = \min(B - a_1 - a_2,\ E\,b_3),\qquad e_i = \frac{a_i}{b_i}
  inputs:
    - { symbol: b1, label: "bytes, smallest language b_1", default: 1.0e10, min: 1.0e8, max: 1.0e12, scale: log10, format: si }
    - { symbol: b2, label: "bytes, middle language b_2", default: 1.0e11, min: 1.0e8, max: 1.0e13, scale: log10, format: si }
    - { symbol: b3, label: "bytes, largest language b_3", default: 1.0e12, min: 1.0e9, max: 1.0e14, scale: log10, format: si }
    - { symbol: B, label: "byte budget B", default: 1.0e12, min: 1.0e10, max: 1.0e14, scale: log10, format: si }
    - { symbol: E, label: "cap E_max, byte epochs", default: 1, min: 1, max: 4, options: [1, 2, 4], format: integer }
  outputs:
    - { symbol: e1, label: "capped epochs, smallest", formula: "min(B/3, E*b1)/b1", format: fixed2 }
    - { symbol: e2, label: "capped epochs, middle", formula: "min((B - e1*b1)/2, E*b2)/b2", format: fixed2 }
    - { symbol: e3, label: "capped epochs, largest", formula: "min(B - e1*b1 - e2*b2, E*b3)/b3", format: fixed2 }
    - { symbol: sf, label: "shortfall, bytes left unplaced", formula: "max(round(B - e1*b1 - e2*b2 - e3*b3), 0)", format: si, emphasis: true }
    - { symbol: t1, label: "α = 0.3 epochs, smallest", formula: "B*b1^(0.3 - 1)/(b1^0.3 + b2^0.3 + b3^0.3)", format: fixed2 }
    - { symbol: t3, label: "α = 0.3 epochs, largest", formula: "B*b3^(0.3 - 1)/(b1^0.3 + b2^0.3 + b3^0.3)", format: fixed2 }
states:
  - { anchor: formulation, label: "100× range, E_max = 1", variables: { b1: 1.0e10, B: 1.0e12, E: 1 }, highlight: [e1, e2, e3, t1], note: "The cap reads the two smaller languages exactly once and the largest 0.89 times; α = 0.3 would read the smallest 14.3 times on the same budget." }
  - { anchor: mechanism, label: "1000× range", variables: { b1: 1.0e9, B: 1.0e12, E: 1 }, highlight: [t1, t3, e1], note: "At a 10³ size ratio temperature reads the smallest language 77 times and the largest 0.61 times, the 126× of the Mechanism; the cap holds both at or below one epoch." }
  - { anchor: failure-modes, label: "4× budget: the cap binds", variables: { b1: 1.0e9, B: 4.0e12, E: 1 }, highlight: [sf, t1], note: "At 4T bytes of budget every language is capped: 2.9T bytes cannot be placed at E_max = 1 and must be reported as a shortfall, where temperature would read the tail 310 times." }
```

> **Definition — cross-domain transfer matrix.** The matrix `Θ_{ij} = ∂L_i/∂r_j` of sensitivities of validation domain i's loss to training domain j's weight, evaluated along the simplex at a stated mixture and budget.

Under the mixing law of [§9.4](09-4-learned-mixture-selection.md) (Eq. 9.17), the matrix has the closed form

$$
\Theta_{ij} = \frac{\partial L_i}{\partial r_j} = k_i\,t_{ij}\,\exp\!\Big(\sum_{m} t_{im} r_m\Big)
$$
*(Eq. 9.20)* where a negative Θ_ij is facilitation (more of j lowers loss on i) and a positive one is interference; the sign structure is the paper's reading of t_ij (PAPER-REPORTED, R9.4). The chapter uses Θ as a reporting object; whether Eq. 9.17's form is adequate for languages is UNVERIFIED — R9.4 fitted it on RedPajama's English-dominant domains.

**Capacity dilution.** The multilingual results of R9.13 and R9.14 are consistent with a model in which each language's loss depends on its own consumed content, on the content of similar languages (transfer), and on the total content of all languages relative to N (dilution); the chapter does not assert a functional form for dilution beyond the qualitative statement that its magnitude grows with total data at fixed N (PAPER-REPORTED, R9.14: "as dataset sizes increase, adding multilingual data begins to hurt performance for both low-resource and high-resource languages, likely due to limited model capacity"). Vocabulary allocation across languages — the size of the embedding and output head — is a coupled decision owned by [§10.3](../ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md) and [§13.5](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-5-embeddings-and-heads.md).

> **Assumption.** Fertility is measured on the training pool itself, per language, under the run's tokenizer · *sensitivity:* fertility measured on a benchmark or on translated parallel text differs from pool fertility, and the conversion of Eq. 9.19 is only as good as the φ_i used.

## Mechanism

**Resource imbalance and its two remedies.** Temperature sampling (Eq. 9.3 in bytes) raises tail-language shares at the cost of repetition, as Eq. 9.4 quantifies — for α = 0.3 and a 10³ size ratio, about 126× more epochs on the small language. Epoch-capped allocation (R9.12) bounds repetition and fills the head uniformly. PAPER-REPORTED (R9.12): UniMax "outperforms both baselines at all model sizes considered" and tail overfitting under temperature sampling "only emerges with scale: Large shows no obvious overfitting, XL shows weak overfitting, and it becomes conspicuous at XXL size" — the capacity coupling of [§9.2](09-2-quality-and-diversity.md) seen in a multilingual setting. Cost: none in FLOPs; the cap makes the allocation depend on the budget, so the policy must be re-derived when D changes.

**Cross-lingual transfer.** PAPER-REPORTED (R9.14): improvements to low-resource languages "depend on the syntactic similarity of the added multilingual data, with marginal additional effects of vocabulary overlap". PAPER-REPORTED (R9.2): DoGE's out-of-domain variant on Wiki40b with English, German, Spanish, French and Russian as sources and Catalan or Dutch as targets found weights that improved target perplexity — a learned Θ column. Cost of exploiting transfer: none beyond the selection compute of [§9.4](09-4-learned-mixture-selection.md); the benefit is bounded by the "up to 33%" equivalent-data figure at the scales R9.14 tested (≤ 45M parameters), which does not license any figure at larger scales (UNVERIFIED).

**Code and mathematics mixtures — what is disclosed.** PAPER-REPORTED (P25): DeepSeekMath built a 120B-token mathematical corpus from Common Crawl with a fastText classifier seeded on OpenWebMath positives (500,000 positives and 500,000 negatives), iterated over four collection rounds to 35.5M pages, multilingual with English and Chinese most represented. DeepSeekMath-Base 7B was initialised from DeepSeek-Coder-Base-v1.5 7B and trained for 500B tokens on a disclosed mixture: 56% DeepSeekMath Corpus, 4% AlgebraicStack, 10% arXiv, 20% GitHub code, 10% Common Crawl natural language. Findings as the paper states them: code training "benefits program-aided mathematical reasoning, both under the two-stage training and one-stage training settings"; "mixing code tokens and math tokens effectively mitigates the issue of catastrophic forgetting" of coding ability; arXiv papers "seem ineffective in improving mathematical reasoning", with "no notable improvements or even deterioration" from arXiv-only corpora; the math-trained model showed gains on MMLU and BBH over its precursor and maintained HumanEval and MBPP performance; decontamination removed any segment sharing a 10-gram with a benchmark (exact match at ≥ 3-grams for short benchmarks). These are the only quantitative mixture weights for a specialist recipe disclosed by a reference-stack lab in the sources opened. PAPER-REPORTED (R9.28): across 470M–2.8B models, adding code to text-only pretraining produced up to 8.2% relative improvement in natural-language reasoning, 4.2% in world knowledge, 6.6% in generative win-rates and a 12× improvement in code performance, with code *quality* having "an outsized impact across all tasks". PAPER-REPORTED (R9.5): in the data-constrained setting, mixing up to 50% Python code "shows no deterioration" on the evaluated natural-language tasks, beyond which "performance decreases quickly". PAPER-REPORTED (R9.8): Llama 3's final mix is "roughly 50% of tokens corresponding to general knowledge, 25% of mathematical and reasoning tokens, 17% code tokens, and 8% multilingual tokens" — category shares only, per-source weights NOT-DISCLOSED. PAPER-REPORTED (R9.30): Qwen3 raises the proportion of STEM, coding, reasoning and synthetic data in its second stage; weights NOT-DISCLOSED. Cost of a specialist share: at fixed D, every token of code displaces a token of something else; the transfer results say the displacement is favourable up to a share that the sources bound between "17%" (a disclosed recipe) and "50%" (a data-constrained ablation), and nothing in the sources fixes the optimum for a given budget.

```figure
id: fig-9.27
kind: stat-panel
title: DeepSeekMath-Base 7B continued-pretraining mixture
caption: >-
  The one specialist mixture with per-source weights among the sources opened,
  converted to tokens. The 56% share over 500B tokens is 280B tokens drawn from
  a 120B-token corpus, so the math corpus is read about 2.3 times, a derived
  number the paper does not state and one that sits inside R9.5's four-epoch
  boundary. Code and web are replay floors, not targets. Llama 3's category
  shares are shown for contrast: disclosed only at the category level.
placement: rail
anchor: mechanism
evidence: PAPER-REPORTED
source: [P25, R9.8, R9.5]
alt: >-
  Instrument panel of the DeepSeekMath-Base 7B mixture (P25), 500B tokens
  from DeepSeek-Coder-Base-v1.5 7B: DeepSeekMath Corpus 56%, 280B tokens;
  AlgebraicStack 4%, 20B; arXiv 10%, 50B; GitHub code 20%, 100B; Common Crawl
  natural language 10%, 50B. The math corpus holds 120B unique tokens, so it is
  read about 2.33 times, derived here under the assumption that both counts use
  the same tokenizer. Llama 3's final mix (R9.8) is about 50% general
  knowledge, 25% mathematics and reasoning, 17% code and 8% multilingual, with
  per-source weights not disclosed. A block glyph shows the five DeepSeekMath
  shares.
spec:
  header: "DEEPSEEKMATH-BASE 7B · 500B TOKENS (P25)"
  variables: { D: 500.0e9, math: 0.56, alg: 0.04, arxiv: 0.10, gh: 0.20, cc: 0.10, U: 120.0e9 }
  rows:
    - { key: "DeepSeekMath Corpus, 56%", formula: "math*D", format: tokens }
    - { key: "AlgebraicStack, 4%", formula: "alg*D", format: tokens }
    - { key: "arXiv, 10%", formula: "arxiv*D", format: tokens, note: "arXiv-only training ineffective for math (P25)" }
    - { key: "GitHub code, 20%", formula: "gh*D", format: tokens, note: "replay floor for coding" }
    - { key: "Common Crawl text, 10%", formula: "cc*D", format: tokens, note: "replay floor for general text" }
    - { key: "math corpus, unique tokens", formula: "U", format: tokens }
    - { key: "math corpus epochs", formula: "math*D/U", format: fixed2, note: "DERIVED; same-tokenizer counts assumed" }
    - { key: "initialised from", value: "DeepSeek-Coder-Base-v1.5 7B" }
    - { key: "decontamination", value: "segments sharing a 10-gram removed" }
    - { key: "Llama 3 final mix, % (R9.8)", value: "50 / 25 / 17 / 8", note: "general / math+reasoning / code / multilingual" }
  glyph:
    type: blocks
    items:
      - { label: "math corpus 56%", weight: 56, emphasis: true }
      - { label: "AlgebraicStack 4%", weight: 4 }
      - { label: "arXiv 10%", weight: 10 }
      - { label: "GitHub 20%", weight: 20 }
      - { label: "Common Crawl 10%", weight: 10 }
states:
  - { anchor: mechanism, label: "the disclosed specialist mix", highlight: ["DeepSeekMath Corpus, 56%", "AlgebraicStack, 4%", "arXiv, 10%", "GitHub code, 20%", "Common Crawl text, 10%", "math corpus epochs"], note: "Per-source weights of a specialist stage, the only ones disclosed in the sources opened: the 120B-token math corpus is read about 2.3 times over 500B tokens." }
  - { anchor: observations, label: "several changes at once", highlight: ["initialised from", "math corpus epochs", "arXiv, 10%"], note: "Checkpoint, corpus and mixture changed together, so no single weight here can be credited with a gain; arXiv keeps 10% although arXiv-only training was found ineffective." }
  - { anchor: siblings, label: "replay floors", highlight: ["GitHub code, 20%", "Common Crawl text, 10%"], note: "The specialist-stage pattern: 20% code and 10% web are floors that keep the checkpoint's coding and general ability from being crowded out." }
```

```figure
id: fig-9.28
kind: compare
title: What the sources say about a code or math share
caption: >-
  The favourable range of a specialist share, bounded from the sources. The
  disclosed recipes sit at 17–20% code; the data-constrained ablation found no
  harm up to 50% and a quick fall beyond; the controlled ablations show code
  helping non-code tasks at ≤ 2.8B. The columns differ in scale, corpus,
  baseline and evaluation, so they bound a range; they do not locate an
  optimum, and the Qwen3 column holds nothing quantitative.
placement: wide
evidence: PAPER-REPORTED
source: [P25, R9.28, R9.5, R9.8, R9.30]
alt: >-
  Comparison table with five columns: DeepSeekMath (P25), code ablations
  (R9.28), data-constrained code mixing (R9.5), Llama 3's final mix (R9.8) and
  Qwen3's second stage (R9.30). Scale: 7B for 500B tokens from a code-trained
  7B; 470M to 2.8B; data-constrained runs on C4 and OSCAR; the Llama 3 herd;
  the Qwen3 family. Share: 56% math corpus plus 4% AlgebraicStack and 20% code;
  code added to text-only pretraining; up to 50% Python code; 17% code and 25%
  math and reasoning; raised but not disclosed. Reported effect: code benefits
  math reasoning and forgetting is mitigated by mixing, arXiv ineffective;
  up to +8.2% relative NL reasoning, +4.2% knowledge, +6.6% win-rate and 12×
  code; no deterioration up to 50%, quick decrease beyond; category shares only;
  not separately quantified.
spec:
  axis: >-
    Share of consumed tokens given to code or mathematics and the effect each
    source reports, in the setting and at the scale it states
  columns:
    - { id: p25, label: "DeepSeekMath (P25)" }
    - { id: r928, label: "Code ablations (R9.28)" }
    - { id: r95, label: "Data-constrained (R9.5)" }
    - { id: r98, label: "Llama 3 final mix (R9.8)" }
    - { id: r930, label: "Qwen3 stage 2 (R9.30)" }
  rows:
    - { dimension: "setting and scale", values: { p25: "continued pretraining, 7B, 500B tokens, from a code-trained 7B", r928: "controlled pretraining ablations, 470M–2.8B", r95: "data-constrained runs on C4 and OSCAR subsets", r98: "the herd's pretraining mix", r930: "second pretraining stage, about 5T tokens" } }
    - { dimension: "specialist share", values: { p25: "56% math corpus + 4% AlgebraicStack; 20% code", r928: "code added to text-only pretraining", r95: "up to 50% Python code", r98: "17% code; 25% math and reasoning", r930: "more STEM, code, reasoning, synthetic; NOT-DISCLOSED" } }
    - { dimension: "reported effect", values: { p25: "code helps math reasoning in one- and two-stage runs; MMLU and BBH up; HumanEval and MBPP maintained", r928: "up to +8.2% relative NL reasoning, +4.2% knowledge, +6.6% win-rate, 12× code", r95: "no deterioration on NL tasks up to 50%; decreases quickly beyond", r98: "category shares only; per-source weights NOT-DISCLOSED", r930: "not separately quantified" } }
    - { dimension: "replay or floor", values: { p25: "20% code and 10% web kept; mixing mitigates forgetting of coding", r928: "not stated", r95: "not stated", r98: "not stated", r930: "not stated" } }
    - { dimension: "what it bounds", values: { p25: "a disclosed specialist recipe", r928: "direction: code transfers to non-code tasks at ≤ 2.8B", r95: "the upper edge of the favourable range, 50%", r98: "a disclosed frontier category share, 17% code", r930: "nothing quantitative" } }
```

**Domain interference.** Interference appears in three forms in the sources: a positive Θ_ij (R9.4's conflict coefficients); mixing curated sources into a well-filtered web set lowering the average (P07, Table 6, −1.2 Core points for DCLM-baseline with RedPajama extras); and forgetting when a specialist share crowds out its neighbour, which P25 addresses by keeping 20% code in a math run. The retention mechanism — why a domain whose weight drops loses performance, and how replay bounds the loss — is owned by [§22.4](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-4-retention-and-interference.md); this section's contribution is that a replay share is a mixture weight with a floor, exactly the admissible-window lower bound of [§9.2](09-2-quality-and-diversity.md). Cost: the replay share is compute spent on a domain the run is not trying to improve.

```figure
id: fig-9.29
kind: matrix
title: Reported signs of the transfer matrix Θ
caption: >-
  A reported-sign map of Θ_ij = ∂L_i/∂r_j, not a measured matrix: each filled
  cell is the direction one source reports for adding training domain j on
  validation target i. Read the last column: the same curated extras interfere
  on a strongly filtered web base and help a weaker one (P07), so a sign
  belongs to a base mixture and a budget, not to a pair of domains. Ringed
  cells are interference. Every entry is one ablation at ≤ 7B; an empty cell
  means not measured in the sources opened, not zero transfer.
placement: inline
evidence: PAPER-REPORTED
source: [P25, R9.28, R9.5, R9.14, R9.2, P07]
alt: >-
  Seven-by-five matrix. Rows are validation targets: math reasoning,
  natural-language reasoning, code, low-resource language, high-resource language,
  DCLM Core on the strongly filtered web base, and Core on weaker web bases.
  Columns are training domains added: code, math web corpus, arXiv,
  multilingual data, and RedPajama curated extras. Facilitation reported: code
  on math reasoning (P25), code on NL reasoning (R9.28; R9.5 reports no
  deterioration up to 50%), code on code (R9.28, 12×), math corpus on math
  reasoning and on MMLU and BBH (P25), multilingual data on similar
  low-resource languages (R9.14 up to 33% equivalent data; R9.2 Catalan and
  Dutch targets), extras on weaker web bases (P07, +1.4 to +2.2). Null or
  maintained: arXiv on math reasoning (P25), math corpus on code with a 20%
  code floor (P25). Interference: multilingual data on high-resource languages
  (R9.14) and extras on DCLM-baseline (P07, −1.2 Core). All other cells not
  measured.
spec:
  rows: 7
  cols: 5
  pattern: explicit
  cells:
    - [1, 1, 0.5, 0, 0]
    - [1, 1, 0, 0, 0]
    - [1, 0.5, 0, 0, 0]
    - [0, 0, 0, 1, 0]
    - [0, 0, 0, 0.2, 0]
    - [0, 0, 0, 0, 0.2]
    - [0, 0, 0, 0, 1]
  rowLabel: "validation target i"
  colLabel: "training domain added, j"
  rowTicks: ["math reas.", "NL reason.", "code", "low-res lang", "high-res", "Core, DCLM", "Core, weak"]
  colTicks: ["code", "math web", "arXiv", "multiling.", "RPJ extras"]
  highlight: [{ row: 4, col: 3 }, { row: 5, col: 4 }]
  legend: "1 facilitation · 0.5 null or maintained · 0.2 interference (ringed) · 0 not measured; signs, not Θ values"
```

## Algorithm

```text
Algorithm 9.5 — Fertility-aware, epoch-capped budget allocation across languages or domains
INPUT   languages 1..k with available bytes b_i and fertility φ_i (tokens/byte, from §10.3, measured on the pool under τ_id);
        token budget D; epoch cap E_max (in byte epochs); optional content-share priors v_i; optional floors f_i (replay)
OUTPUT  token weights w_i, byte epochs e_i, and the ledger columns (available_tokens, fertility, content_share)
STATE   remaining byte budget R; set of open languages O
INVARIANT Σ_i w_i = 1; e_i ≤ E_max for all i; w_i ≥ f_i for all i; allocation is a deterministic function of the inputs
1.  convert the token budget to a byte budget under the *mixture* fertility: iterate D_bytes ← D / Σ_i (share_i·φ_i) with share_i from the previous pass (start with v_i or uniform); stop when D_bytes changes by < 0.1%
2.  R ← D_bytes; O ← {1..k}; sort O by ascending b_i (UniMax order, R9.12)
3.  for i in O in that order:
4.      target_i ← max(f_i·D_bytes, v_i·R / Σ_{j ∈ O} v_j)            # uniform share of the remainder (v uniform) or prior-weighted
5.      alloc_i ← min(target_i, E_max·b_i)                              # cap at E_max byte epochs
6.      R ← R − alloc_i; remove i from O
7.  if R > 0: distribute R over the uncapped languages proportionally to their remaining headroom (E_max·b_i − alloc_i); repeat until R = 0 or all capped
8.  for each i: e_i ← alloc_i / b_i; w_i ← alloc_i·φ_i / Σ_j alloc_j·φ_j    # Eq. 9.19 conversion to token weights
9.  assert |Σ_i alloc_i·φ_i − D| < one unit; write ledger columns
TERMINATION: after step 8; if step 7 exhausts every language's cap before R = 0, the budget cannot be met without exceeding E_max — report the shortfall.
```

Complexity: O(k log k) for the sort plus O(k) per pass of steps 1 and 7; typically a handful of passes. Implementation link: `mixture_policy.yaml` rows carry `weight_kind = token` with `content_share` and `fertility_tokens_per_byte` recorded; [verification.md](verification.md).

Cost line: parameters 0; tokens — exactly D; FLOPs — the fertility measurement is one tokenizer pass over the pool (CPU, O(bytes)); memory O(k); communication none; latency none on the training path; energy and money — NOT-DISCLOSED.

## Implementation

Tensors → operators: nothing changes on the accelerator; the sampling unit is a packed sequence whose domain composition the ledger records per language. Framework: the loader of [§9.1](09-1-mixture-formulation.md) with per-language streams. Named reference-stack systems with §4.1 layer: **MosaicML LLM Foundry** (Distributed training) — one `Stream` per language with `proportion` = w_i from Algorithm 9.5 (R9.33); **Megatron-LM** (Distributed training) — one indexed dataset per language blended by weight (R9.36), with the caveat that the blend is specified in samples, so a per-language sample must be a fixed token count for w_i to be a token weight; **Hugging Face Transformers** (Model definition / adaptation) — the tokenizer object whose per-language fertility Algorithm 9.5 consumes; the measurement itself is [§10.3](../ch10-tokenization-serialization-and-interface-correctness/10-3-vocabulary-economics.md)'s. Kernels: none. Memory: vocabulary size couples to embedding and head parameters ([§13.5](../../part-03-model-architectures-and-state/ch13-dense-transformer-design-and-parameter-allocation/13-5-embeddings-and-heads.md)). Communication: none specific. Deployment: fertility values are versioned with the tokenizer hash; a tokenizer change invalidates every w_i.

> **Implementation note [impl.megatron-lm · datasets readme as opened 2026-09-20].** Because `BlendedDataset` draws *samples* in proportion to weights (R9.36), and a GPT sample is a fixed-length token sequence, its weights are token weights by construction — which is the convention Eq. 9.19 converts *to*, not from; a content-share target must be converted before it is written into the blend.

## Experimental design

### Experiment 9.5 — Content-matched versus token-matched multilingual mixtures with a held-out language

- **Hypothesis.** At equal consumed tokens and equal FLOPs, a mixture whose weights are set from content shares via Eq. 9.19 yields lower loss on high-fertility languages than the same content shares applied directly as token weights, at a small cost on low-fertility languages; an epoch cap of 1–2 byte epochs beats α = 0.3 temperature sampling on tail languages at the larger of two model sizes; and a held-out language related to a sampled one improves through transfer while an unrelated held-out language does not.
- **Setup.** 12 languages from an open multilingual crawl spanning a 100× byte range and at least a 3× fertility range under one tokenizer; two model sizes (about 300M and 1B); D = 20N per size.
- **Independent variables.** Weight convention ∈ {token-share-as-set, content-share via Eq. 9.19}; allocation ∈ {α = 0.3 temperature, Algorithm 9.5 with E_max = 1, E_max = 2}; model size.
- **Controlled variables.** Tokenizer (fixed, fertility measured per language on the pool), pools, filter ledger, schedule, sequence length, seeds (3), evaluator.
- **Dataset / workload.** Per-language held-out splits; two held-out languages (one typologically close to a sampled language, one distant) never in any pool.
- **Hardware.** Any.
- **Metrics.** Per-language token-mean loss *and* bits per byte ([§2.3](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-3-information-theory.md)) — the second is the fertility-invariant comparison; byte epochs per language from the ledger; held-out language bits per byte.
- **Baselines.** Size-proportional in tokens (T_s = 1).
- **Expected result.** Content-matched weights lower bits per byte on high-fertility languages; the cap beats temperature on tail languages at 1B but not necessarily at 300M (the R9.12 scale pattern); the close held-out language improves relative to the distant one.
- **Ablation.** Swap the tokenizer for one with a different fertility profile and repeat one arm: the token-share-as-set arm's per-language ranking changes; the content-matched arm's does not (within noise).
- **Interpretation.** Confirms that weights must be stated in a fertility-aware unit and that repetition, not share, drives tail overfitting.
- **Threats to validity.** Fertility measured on the pool may not match evaluation text; language identification errors in the pools; small-scale insensitivity; bits per byte depends on byte normalisation conventions that must be fixed in advance.

## Observations

**What the paper claims.** PAPER-REPORTED (R9.11, R9.12, R9.13, R9.14): exponent-smoothed sampling with α ≈ 0.3 was a reasonable compromise; epoch caps beat it at scale; multilingual training trades transfer against dilution; moderate multilingual data helps low-resource languages and hurts high-resource ones. PAPER-REPORTED (R9.15): tokenization length disparities up to 15× exist. PAPER-REPORTED (P25, R9.28, R9.5): code helps mathematical and general reasoning; arXiv did not help math; up to 50% code did not hurt in a data-constrained setting.

**What the evidence shows.** The multilingual sampling results come from three groups over five years with consistent direction; the "curse" result (R9.14) is at ≤ 45M parameters and its magnitude does not transfer. The code-transfer result has two independent groups at ≤ 7B with different corpora. The arXiv-ineffectiveness finding is one lab's, on one corpus, and contradicts common practice; it has not been independently reproduced in the sources opened.

**What we infer.** DERIVED: any multilingual mixture reported in token shares without fertility is under-specified by the fertility ratio, which can exceed the mixture weights themselves in magnitude; DERIVED: the specialist share has a favourable range whose upper bound the sources place somewhere between the disclosed recipes and the 50% ablation, and whose position depends on the budget and the evaluation suite; ASSUMED: replay floors of the order used by P25 (20% code in a math run) are a reasonable starting point, not a law.

**What remains unknown.** NOT-DISCLOSED: per-language and per-source weights of every frontier model; the fertility profile of their tokenizers on their pools. UNVERIFIED: transfer of the R9.14 dilution magnitude to ≥ 1B; the mechanism of code-to-reasoning transfer; whether Eq. 9.17's form holds across languages.

## Failure modes

> **Failure mode — fertility-blind weights.** *Symptom:* a high-fertility language underperforms at "the same weight" as a low-fertility one. *Cause:* token shares set as if they were content shares. *Detection:* per-language bits per byte diverge from per-language loss ranking; `content_share` column in the ledger differs from the intended share. *Mitigation:* Eq. 9.19; Algorithm 9.5.

> **Failure mode — tail overfitting at scale.** *Symptom:* tail-language validation loss rises late in training at the larger model but not the smaller. *Cause:* byte epochs ≫ 1 under temperature sampling; capacity coupling (R9.12). *Detection:* e_i in byte epochs; per-language loss curves. *Mitigation:* epoch cap.

> **Failure mode — specialist crowding.** *Symptom:* code or general benchmarks fall while math rises. *Cause:* specialist share above its favourable range with no replay floor. *Detection:* held-out neighbour domain in [verification.md](verification.md). *Mitigation:* floors f_i in Algorithm 9.5 (P25 keeps 20% code, 10% web).

> **Failure mode — tokenizer change invalidates the policy.** *Symptom:* the same policy file gives different per-language exposure after a tokenizer migration. *Cause:* φ_i changed. *Detection:* tokenizer hash mismatch against the policy. *Mitigation:* re-run Algorithm 9.5; [§10.6](../ch10-tokenization-serialization-and-interface-correctness/10-6-migration-and-compatibility.md).

> **Failure mode — decontamination gap in specialist corpora.** *Symptom:* benchmark gains that vanish on a fresh problem set. *Cause:* classifier-collected math pages include benchmark problems. *Detection:* n-gram overlap ([§8.5](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md)); P25's 10-gram rule. *Mitigation:* decontaminate before weighting.

## Siblings

**Token-share mixture (language-agnostic)** — [§9.1](09-1-mixture-formulation.md)
Why it exists: one accounting unit. What assumption changed (relative to fertility-aware weights): a token is a fixed amount of content. What objective changed: none. What problem it solved: simplicity. What new failure mode it introduced: fertility-blind under-representation. Changed primitive: w in tokens.

**Temperature sampling over languages (mT5/XLM-R style)** — this file; [§9.1](09-1-mixture-formulation.md) Eq. 9.3
Why it exists: resource imbalance over three orders of magnitude. What assumption changed: a single exponent balances head and tail. What objective changed: none. What problem it solved: tail presence. What new failure mode it introduced: tail repetition that overfits at scale. Changed primitive: b_i → b_i^α.

**Epoch-capped allocation (UniMax)** — this file, Algorithm 9.5
Why it exists: temperature sampling overfits the tail at scale. What assumption changed: bound repetition, fill the head uniformly. What objective changed: uniform coverage under caps. What problem it solved: tail overfitting. What new failure mode it introduced: budget-dependent policy; head languages absorb the remainder. Changed primitive: exponent → cap.

**Learned cross-lingual weights (DoGE-OOD)** — [§9.4](09-4-learned-mixture-selection.md)
Why it exists: transfer depends on similarity that a cap ignores. What assumption changed: gradient alignment with a target language predicts transfer. What objective changed: target-language loss. What problem it solved: source weighting for a low-resource target. What new failure mode it introduced: proxy compute; unverified transfer. Changed primitive: cap → learned Θ column.

**Specialist continued pretraining (DeepSeekMath pattern)** — this file; [§22.2](../../part-04-training-science-and-adaptation/ch22-continued-pretraining-mid-training-and-domain-adaptation/22-2-distribution-transitions.md)
Why it exists: a specialist corpus is small relative to a base run. What assumption changed: start from a code-trained checkpoint and mix replay. What objective changed: none. What problem it solved: math capability with retained coding. What new failure mode it introduced: interference bounded only by the replay floor. Changed primitive: one run → base + specialist stage with floors.

## Extensions

Domain adaptation to enterprise or scientific corpora is the specialist case with an unknown Θ column; the annealing probe of [§9.3](09-3-curriculum-design.md) is the cheapest estimate. Long context in multilingual settings compounds fertility with sequence positions: a high-fertility language fills a fixed context with fewer bytes, so per-language length buckets should be defined in bytes (proposal). Multimodal mixtures generalise fertility to tokens per image or per second of audio, and Eq. 9.19 applies with φ_i per modality (proposal). Agentic and tool data are specialist domains whose evaluation is execution-grounded ([§4.3](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-3-code-and-structured-sequences.md)), so their weights should be chosen by transfer measurement as for code.

## Limitations

Eq. 9.19 treats fertility as a per-language constant; within a language it varies by domain (code versus prose in the same language), so a (language, domain) grid is the correct unit when both axes are weighted. The specialist evidence is from ≤ 7B models and from recipes that changed several things at once (checkpoint initialisation, corpus, mixture), so no single weight in P25's mixture can be credited with a specific gain. Falsification: if Experiment 9.5 shows the content-matched and token-matched arms indistinguishable in bits per byte across a 3× fertility range, fertility conversion is unnecessary at that scale; if the cap does not beat temperature at 1B, the R9.12 scale pattern does not hold for that pool.

## Reproducibility

Tokenizer hash; per-language fertility table with the measurement method; b_i, φ_i, D, E_max, f_i and v_i; Algorithm 9.5 outputs in `mixture_policy.yaml`; sources opened: R9.11 (arXiv abs; ar5iv), R9.12 (arXiv abs; ar5iv), R9.13 (arXiv abs), R9.14 (arXiv abs), R9.15 (arXiv abs), P25 (ar5iv), R9.28 (arXiv abs), R9.5 (arXiv abs; ar5iv), R9.8 (ar5iv), R9.30 (arXiv HTML), R9.2 (PDF text). No run executed (UNVERIFIED).

## References

P07 · P25 · R9.2 · R9.4 · R9.5 · R9.8 · R9.11 · R9.12 · R9.13 · R9.14 · R9.15 · R9.28 · R9.30 · R9.33 · R9.36 · [references.md](references.md)
