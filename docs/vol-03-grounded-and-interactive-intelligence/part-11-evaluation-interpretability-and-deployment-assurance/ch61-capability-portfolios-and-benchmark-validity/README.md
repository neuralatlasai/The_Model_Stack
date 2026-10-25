---
id: ms.chapter.61
entity_type: chapter
title: "Capability portfolios and benchmark validity"
volume: 3
part: 11
chapter: 61
section: null
slug: ch61-capability-portfolios-and-benchmark-validity
parent: ms.part.11
prev_sibling: ms.chapter.60
next_sibling: ms.chapter.62
children: [ms.section.61.1, ms.section.61.2, ms.section.61.3, ms.section.61.4, ms.section.61.5, ms.section.61.6, ms.verification.61, ms.references.61]
prerequisites: [ms.chapter.6, ms.chapter.31, ms.chapter.49, ms.chapter.55, ms.chapter.56, ms.chapter.57]
downstream: [ms.chapter.62, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [evaluation], mechanism: [evaluation_validity], feedback_setting: [], modality: [text, image, audio, video]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1400
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

VOLUME III / PART XI — EVALUATION, INTERPRETABILITY, AND DEPLOYMENT ASSURANCE / CHAPTER 61

# 61 — Capability portfolios and benchmark validity

[DERIVED] A defensible capability claim requires a portfolio whose task support, protocol, evaluator and uncertainty justify the actual decision.

6 sections · 5 primary research papers · 1 pinned implementation family, static inspection only · prerequisites: 06, 21, 31–40, 49–60 · artifact: a versioned evaluation portfolio with coverage and contamination analysis · updated 2026-10-25

## Why this chapter exists

[DERIVED] A benchmark score can be exactly reproduced and still answer the wrong question. The error arises when academic questions stand in for an operational population, when a finite validator is treated as a complete specification, when a prompt or budget change is attributed to model weights, or when a global average is allowed to compensate for a failed requirement. Better inference does not remove these measurement obligations.

[DERIVED] The bottleneck shifts from producing outputs to justifying the inference drawn from them. A model-development comparison, an endpoint purchase, a domain adaptation, and a release gate require different evidence. Public item sets can supply useful regression signals while remaining exposed, narrow or insufficiently validated for deployment transfer. The response is to retain their value under a bounded claim and add the missing controls, rather than call every score either definitive or worthless.

[DERIVED] This chapter constructs a decision-specific measurement portfolio, follows each response through its validator, freezes the protocol, challenges validity, tests transfer, and reports the result with its denominators and resource boundary. Current primary studies motivate concrete cautions; the mathematical constructions make their consequences inspectable without pretending that the book has run a new benchmark. A failed audit changes the supported claim or the instrument. It does not disappear inside a polished aggregate.

## Concept map

```mermaid
flowchart LR
  R["[Objective] Required result"] --> P["[Dataset] Target population"]
  P --> C["[Process] Coverage obligations"]
  C --> F["[Dataset] Benchmark families"]
  F --> V["[Process] Response validator"]
  V --> I["[Boundary] Protocol identity"]
  I --> O["[Memory] Offered outcomes"]
  O --> A["[Branch] Validity audit"]
  A --> T["[Process] Transfer controls"]
  T --> U["[Metric] Paired uncertainty"]
  U --> G["[Branch] Required gates"]
  G --> D["[State] Bounded decision"]
  A --> E["[State] Unresolved evidence"]
  E --> C
```

- Required result
  - Target population and coverage obligations
  - Benchmark families and response validator
  - Protocol identity and offered outcomes
  - Validity audit and unresolved evidence
  - Transfer controls and paired uncertainty
  - Required gates and bounded decision

[DERIVED] Text equivalent: required result → target population → coverage obligations → benchmark families → response validator → protocol identity → offered outcomes → validity audit → transfer controls → paired uncertainty → required gates → bounded decision. An unresolved validity gap returns to coverage construction. The graph is an argument dependency, not a claim that every evaluation pipeline is linear.

## Position in the book

| Relation | Canonical connections |
|---|---|
| Prerequisites | [Experimental design](../../../vol-01-learning-and-representation/part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/README.md), [scaling and budget](../../../vol-01-learning-and-representation/part-04-training-science-and-adaptation/ch21-scaling-laws-and-compute-allocation/README.md), [post-training behavior](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch31-supervised-fine-tuning-and-behavior-acquisition/README.md), [retrieval](../../part-09-retrieval-context-and-agent-systems/ch49-retrieval-models-indexing-and-evidence-access/README.md), [document intelligence](../../part-10-multimodal-world-and-embodied-models/ch55-vision-language-models-and-document-intelligence/README.md), [speech](../../part-10-multimodal-world-and-embodied-models/ch56-audio-speech-and-real-time-interaction/README.md), [temporal multimodality](../../part-10-multimodal-world-and-embodied-models/ch57-video-temporal-reasoning-and-streaming-multimodality/README.md) |
| Siblings (same part) | [Human and judge uncertainty](../ch62-human-preference-model-judges-and-uncertainty/README.md), [system reliability evaluation](../ch63-agent-retrieval-multimodal-and-system-reliability-evaluation/README.md), [causal interpretability](../ch64-mechanistic-interpretability-and-causal-model-analysis/README.md) |
| Downstream | [Security/safety evidence](../ch65-security-privacy-safety-and-adversarial-robustness/README.md), [release closure](../ch66-release-decisions-reproducibility-and-research-to-production-closure/README.md) |
| Trades off with | [Capacity/economics](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch48-capacity-planning-benchmarking-and-lifecycle-economics/README.md): evidence cost versus decision uncertainty, under an unchanged acceptance requirement |

## Sections

| Section | What changes here | Primary evidence labels |
|---|---|---|
| [61.1](61-1-capability-dimensions.md) Capability dimensions | Requirements become an admissible measurement portfolio | DERIVED · MATHEMATICALLY-DERIVED · PAPER-REPORTED |
| [61.2](61-2-benchmark-families.md) Benchmark families | Response objects determine validator obligations | DERIVED · MATHEMATICALLY-DERIVED · OFFICIAL-DOCUMENTATION |
| [61.3](61-3-version-and-protocol-control.md) Version and protocol control | The full evaluation operator receives an identity | DERIVED · MATHEMATICALLY-DERIVED · OFFICIAL-DOCUMENTATION |
| [61.4](61-4-validity-threats.md) Validity threats | Exposure, labels, shortcuts and selection challenge inference | DERIVED · MATHEMATICALLY-DERIVED · PAPER-REPORTED |
| [61.5](61-5-robustness-and-transfer.md) Robustness and transfer | Valid variants and target support delimit transfer | DERIVED · MATHEMATICALLY-DERIVED · PAPER-REPORTED |
| [61.6](61-6-reporting.md) Reporting | Denominators, pairing, weights and resources delimit reporting | DERIVED · MATHEMATICALLY-DERIVED · PAPER-REPORTED |

## Artifact

[DERIVED] The versioned portfolio contains requirement/gate records; a coverage matrix with proxy justifications; dataset/item/variant lineage; immutable protocol manifests; rendered inputs and raw offered outcomes; validator controls and adjudication; task-level and paired/cluster-aware analyses; resource joins; sensitivity results; and a bounded decision note. A result row must reconnect to the source task and exact measurement operator. Keep failed calls, unsupported inputs, invalid outputs and abstentions in the ledger.

[DERIVED] The artifact's acceptance rule is whether an independent reviewer can reconstruct what was tested, why that test counts toward a requirement, which alternatives were compared on compatible terms, and what evidence would reverse the decision. File count or aggregate accuracy is not a substitute for those answers. A private dependency or unavailable provider revision remains an explicit limitation, even if the remaining artifact is public.

```figure
{
  "id": "fig-61.1",
  "kind": "cycle",
  "title": "Evidence obligations reopen portfolio design",
  "caption": "The loop terminates in a bounded decision or an explicit unresolved gap. A failed validity assumption returns to the relevant construction; exhausting an evaluation budget does not establish capability.",
  "placement": "inline",
  "anchor": "artifact",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-61.2",
  "alt": "The loop terminates in a bounded decision or an explicit unresolved gap. A failed validity assumption returns to the relevant construction; exhausting an evaluation budget does not establish capability.",
  "spec": {
    "stages": [
      {
        "id": "req",
        "label": "Required result and population",
        "kind": "objective"
      },
      {
        "id": "port",
        "label": "Admissible portfolio",
        "kind": "dataset"
      },
      {
        "id": "run",
        "label": "Frozen protocol",
        "kind": "process"
      },
      {
        "id": "audit",
        "label": "Validity and uncertainty audit",
        "kind": "branch"
      },
      {
        "id": "decide",
        "label": "Bounded decision or gap",
        "kind": "state"
      }
    ],
    "edges": [
      {
        "from": "req",
        "to": "port"
      },
      {
        "from": "port",
        "to": "run"
      },
      {
        "from": "run",
        "to": "audit"
      },
      {
        "from": "audit",
        "to": "decide"
      },
      {
        "from": "audit",
        "to": "port",
        "kind": "feedback",
        "label": "failed assumption"
      },
      {
        "from": "decide",
        "to": "req",
        "kind": "feedback",
        "label": "new operating requirement"
      }
    ]
  }
}
```

## Verification

[ASSUMED] [Verification](verification.md) proposes three unexecuted experiments: a fixed-checkpoint prompt/budget ranking audit, validator/perturbation controls, and a paired-report/decision sensitivity reconstruction. They specify all twelve canonical fields, finite execution caps, item-family grouping, offered denominators and interpretation rules. No model, endpoint, dataset download, human study, package execution or benchmark replication was performed by the book.

## Lineage

[PAPER-REPORTED] 2026 · MMLU construct audit · alternative branch [R61.1]. 2026 · budget-conditioned ranking audit · alternative branch [R61.2]. 2026 · reference-corrected contamination audit · alternative branch [R61.3]. 2026 · expert-guided contextual benchmarks · alternative branch [R61.4]. 2026 · perturber transformation boundary · engineering optimization [R61.5]. These studies change different applicability or measurement assumptions and are not ordered by scientific merit.

```figure
{
  "id": "fig-61.2",
  "kind": "lineage",
  "title": "Current evidence challenges different validity assumptions",
  "caption": "The 2026 studies address construct representation, budget sensitivity, contamination contrasts, contextual coverage and perturbation tooling. Their different targets are alternative contributions, not a ranking of benchmark quality.",
  "placement": "wide",
  "anchor": "lineage",
  "evidence": "PAPER-REPORTED",
  "source": [
    "R61.1",
    "R61.2",
    "R61.3",
    "R61.4",
    "R61.5"
  ],
  "alt": "Five 2026 evidence routes address different validity obligations: response structure, inference budget, exposure contrast, contextual coverage and perturbation fidelity. None certifies a universal model ranking.",
  "spec": {
    "entries": [
      {
        "year": 2026,
        "work": "MMLU construct audit",
        "cite": "R61.1",
        "relation": "alternative branch"
      },
      {
        "year": 2026,
        "work": "Budget-conditioned ranking audit",
        "cite": "R61.2",
        "relation": "alternative branch"
      },
      {
        "year": 2026,
        "work": "Reference-corrected contamination audit",
        "cite": "R61.3",
        "relation": "alternative branch"
      },
      {
        "year": 2026,
        "work": "Expert-guided context benchmarks",
        "cite": "R61.4",
        "relation": "alternative branch"
      },
      {
        "year": 2026,
        "work": "perturber transform boundary",
        "cite": "R61.5",
        "relation": "engineering optimization"
      }
    ]
  }
}
```

## Terms owned here

- **Capability portfolio (61.1):** decision-specific measurements plus their support, protocol and unresolved coverage obligations.
- **Response–validator contract (61.2):** the output object and acceptance operation that define a task's observed correctness.
- **Evaluation protocol identity (61.3):** the versioned data, prompt, endpoint, budget, tools, extraction, grading and aggregation operator.
- **Reference-corrected wording contrast (61.4):** aligned original/paraphrase differences after subtracting a declared reference gap; causal interpretation needs extra assumptions.
- **Admissible evaluation perturbation (61.5):** a declared transformation independently checked to preserve the target requirement at the claimed level.
- **Portfolio aggregation rule (61.6):** explicit task weights and failure/eligibility rules defining a reported summary.

[DERIVED] General experimental units, train/test partitioning, likelihood, tool correctness, modality support and deployment authorization remain at their canonical earlier chapters. This chapter applies them to evaluation rather than duplicating their definitions.

## Reference-stack coverage

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §3 discovery source | #1 arXiv | — | Full-text methods/results and revision metadata for the five retained current papers; discovery route itself is not result evidence | https://arxiv.org/ ; https://arxiv.org/search/advanced | 61.1–61.6 | PAPER-REPORTED |
| §1 lab | #24 IBM Research AI | — | perturber author affiliation and current transformation-tool report, retrieved through the primary arXiv paper rather than inferred from a lab homepage | https://research.ibm.com/publications | 61.5 | PAPER-REPORTED |
| §2 conference | #6 EMNLP | — | Source-reported Findings acceptance for the contextual-benchmark paper; independent proceedings status not asserted | https://aclanthology.org/venues/emnlp/ | 61.6 | NOT-DISCLOSED |
| Outside the reference stack (routed via book_plan.md anchors) | EleutherAI LM Evaluation Harness | Evaluation orchestration, outside §4 taxonomy | The plan's explicit harness anchor; v0.4.13 release and pinned sampler/extractor/metric source surfaces | https://github.com/EleutherAI/lm-evaluation-harness | 61.2, 61.3, 61.6 | OFFICIAL-DOCUMENTATION |

[DERIVED] **Inspection dimensions applied:** Reproducibility includes exact task/configuration and static commit locators; Metrics includes task denominators, uncertainty and accepted-task expense; Reliability includes failure retention and bounded execution; Inference includes generation budgets, endpoint identity and allowed tools; Memory includes output/trace storage. Precision, Kernels, Parallelism and Communication must be disclosed for executed performance comparisons but were not measured here. No irrelevant training-stack compatibility is inferred from a paper's model name.

## Source route

[DERIVED] Follow the reference stack's paper-search cascade, then inspect the actual method, result, appendix and revision history. Concrete routes include: site:arxiv.org/abs "MMLU" "psychometric" 2026; site:arxiv.org/abs "budget-dependent" "evaluation"; site:arxiv.org/abs "contamination" "rankings" 2026; site:research.ibm.com/publications "perturbation" AND AI; site:aclanthology.org "EMNLP" "context-specific benchmarks"; site:github.com/EleutherAI/lm-evaluation-harness "v0.4.13". A failed retrieval or abstract-only inspection does not authorize detailed attribution. Record actual first release and inspected revision separately.

## Status

[DERIVED] Manuscript draft. The six sections contain mechanism-level constructions, mathematical domains and counterexamples, finite procedures, source-reported protocols and limitations, implementation inspection boundaries, cost accounting, and decision/reversal conditions. This is an authored reference, not a claim of an independently validated universal benchmark.

[NOT-DISCLOSED] Private training exposure, provider-internal execution, deployment population weights, local runtime compatibility, device traffic/energy and cost per accepted task remain unestablished. The five retained current papers and pinned harness surfaces were inspected only for the scope in [references](references.md). Older foundations remain canonical links. All proposed experiments are unexecuted and editorial status remains manuscript_draft.
