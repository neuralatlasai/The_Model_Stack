---
id: "ms.chapter.50"
entity_type: "chapter"
title: "Context construction and retrieval-augmented generation"
volume: 3
part: 9
chapter: 50
section: null
slug: "ch50-context-construction-and-retrieval-augmented-generation"
parent: "ms.part.9"
prev_sibling: "ms.chapter.49"
next_sibling: "ms.chapter.51"
children: ["ms.section.50.1","ms.section.50.2","ms.section.50.3","ms.section.50.4","ms.section.50.5","ms.section.50.6","ms.verification.50","ms.references.50"]
prerequisites: ["ms.chapter.10","ms.chapter.15","ms.chapter.37","ms.chapter.38","ms.chapter.49"]
downstream: ["ms.chapter.51","ms.chapter.52","ms.chapter.53","ms.chapter.54"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["retrieval","context_construction","grounding"],"feedback_setting":[],"modality":["text"]}
papers: ["P40","P50"]
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.vllm"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 1500
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

VOLUME III / PART IX — RETRIEVAL, CONTEXT, AND AGENT SYSTEMS / CHAPTER 50

# 50 — Context construction and retrieval-augmented generation

[DERIVED] Grounded generation requires a provenance-preserving context compiler, a declared evidence-use mechanism and an independently evaluated answer contract under explicit quality and resource constraints.

6 sections · 2 spine papers · 3 implementations · prerequisites: 10, 15, 37–38, 49 · artifact: a context compiler with evidence provenance (planned) · updated 2026-10-14

## Why this chapter exists

[DERIVED] Retrieval originally supplied a convenient extra input: find passages, append them to the prompt and generate an answer. That composition fails when an omitted exception changes a rule, local citation indices shift after reordering, a summary invents certainty, or a validator accepts a contradiction because it shares many words with the source. Longer context can preserve more information while adding distractors and occupied state. More retrieval or revision can spend additional compute without repairing the missing dependency.

[DERIVED] The dominant constraint is the relationship among evidence identity, semantic support, model information flow and the final task objective. A valid citation marker does not imply support; support does not imply source truth; a correct answer string does not prove evidence use. Selection objectives can have elegant approximation guarantees while failing to represent complementary facts. Statistical abstention guarantees can fail under unrecorded corpus/model shifts.

[DERIVED] This chapter makes those distinctions operational. Context is compiled from typed, authorized objects with stable source mappings. Budgets protect dependencies and expose infeasibility. Generation models specify whether document marginalization occurs outside or inside the token product. Grounding and answer policies retain their calibration assumptions. Comparisons use equal quality/coverage constraints and complete costs. Evaluation records each stage and the changes introduced by oracle interventions. Inspected 2026 evidence includes negative conditions and protocol limitations; the proposed artifact remains unexecuted.

## Concept map

~~~mermaid
flowchart TB
 Q["[State] Request and evidence authority"] --> I["[Dataset] Versioned retrieved candidates"]
 I --> C["[Process] Typed context compiler"]
 H["[Memory] History and tool dependencies"] --> C
 C --> B["[Branch] Budget and representation"]
 B --> P["[Memory] Source-provenance map"]
 B --> G["[Model] Generation strategy"]
 G --> R["[Process] Bounded retrieval or revision"]
 R --> C
 G --> V["[Branch] Claim support and task checks"]
 P --> V
 V --> A["[State] Answer, partial answer or abstention"]
 A --> E["[Metric] Quality, coverage and resource cost"]
 E --> O["[Feedback] Stage and oracle diagnostics"]
 O --> B
 O --> G
 L["[State] Long-context or retrieval policy"] --> B
~~~

Text equivalent:

- Request and evidence authority defines the permitted input.
  - Versioned retrieved candidates enter the typed context compiler.
    - History and tool dependencies also enter that compiler.
    - Budget and representation chooses the approved input form.
      - Source-provenance map retains evidence identity.
      - Generation strategy produces candidates.
        - Bounded retrieval or revision can return new input to the compiler.
        - Claim support and task checks evaluate candidates using the source map.
          - Answer, partial answer or abstention records the terminal result.
            - Quality, coverage and resource cost measure the composed outcome.
              - Stage and oracle diagnostics inform budgeting and generation.
  - Long-context or retrieval policy supplies an alternative evidence-exposure decision.

## Position in the book

| Relation | Canonical location |
|---|---|
| Prerequisites | [10 — Serialization](../../../vol-01-learning-and-representation/part-02-data-and-representation-engineering/ch10-tokenization-serialization-and-interface-correctness/README.md); [15 — Effective access](../../../vol-01-learning-and-representation/part-03-model-architectures-and-state/ch15-position-long-context-and-effective-information-access/README.md); [37 — Decoding](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch37-decoding-constrained-generation-and-speculative-execution/README.md); [38 — Adaptive compute](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/README.md); [49 — Retrieval](../ch49-retrieval-models-indexing-and-evidence-access/README.md) |
| Siblings (same part) | [51 — Tools](../ch51-tool-use-protocol-interfaces-and-reliable-execution/README.md); [52 — Control](../ch52-planning-control-flow-verification-and-recovery/README.md) |
| Downstream | [53 — Memory](../ch53-agent-memory-persistent-state-and-long-horizon-consistency/README.md); [54 — Coordination](../ch54-multi-agent-coordination-and-system-level-evaluation/README.md) |
| Trades off with | [50.2 — Compression/coverage](50-2-context-budgeting.md); [50.4 — Answer/abstain](50-4-grounding-and-abstention.md); [50.5 — Evidence/complete cost](50-5-retrieval-versus-context-length.md) |

## Sections

| Section | Title | What changes here | Primary evidence |
|---|---|---|---|
| [50.1](50-1-context-assembly.md) | Context assembly | Typed authority, serialization and source maps constrain input | DERIVED; PAPER-REPORTED |
| [50.2](50-2-context-budgeting.md) | Context budgeting | Representation choice must preserve dependencies under a finite budget | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [50.3](50-3-generation-strategies.md) | Generation strategies | Latent marginalization and adaptive control carry different state | MATHEMATICALLY-DERIVED; PAPER-REPORTED |
| [50.4](50-4-grounding-and-abstention.md) | Grounding and abstention | Support, truth and calibrated selection are separate predicates | DERIVED; MATHEMATICALLY-DERIVED |
| [50.5](50-5-retrieval-versus-context-length.md) | Retrieval versus context length | Equal-quality frontiers replace nominal window/token comparisons | DERIVED; PAPER-REPORTED |
| [50.6](50-6-end-to-end-evaluation.md) | End-to-end evaluation | Stage records and matched interventions constrain failure attribution | DERIVED; OFFICIAL-DOCUMENTATION |

## Artifact

[DERIVED] The **context compiler with evidence provenance** comprises an input-object schema, immutable corpus/model/template manifest, dependency/access checks, representation/order policy, token ledger, source-span map, generation-action trace, claim/citation graph and evaluation record. Its explicit outputs include compiled tokens and exclusions, supported answer or qualified partial/abstention, terminal failure reasons and complete consumed budgets. It never treats an unresolved identity or over-window mandatory input as a successful compilation.

[DERIVED] The deliverable's scientific purpose is inspectability: a reviewer should be able to determine which evidence the model could access, which transformations altered it, what the generation policy did, and what the evaluator actually measured. It separates transformations from evidence and source mapping from entailment. The implementation and proposed checks are specified in [verification](verification.md); none has been executed here.

## Verification

[DERIVED] The central task labels failures by retrieval, context construction, generation and citation/support stage, then tests whether oracle retrieval or oracle context repairs the final answer. Matched length/position/distractor controls expose alternative explanations for oracle repair. Additional proposed checks cover trust/access boundaries, complementary/conflicting facts, compression, calibrated abstention and corpus updates. Equal complete-cost comparisons retain all internal actions and unsuccessful requests.

## Lineage

- **2020 · RAG · conceptual ancestor.** [PAPER-REPORTED] Latent-document likelihoods [P40](references.md).
- **2021 · Fusion-in-Decoder · engineering optimization.** [PAPER-REPORTED] Independent passage encoding and decoder fusion [R50.2](references.md).
- **2023 · LLMLingua · engineering optimization.** [PAPER-REPORTED] Component-sensitive lossy prompt compression [R50.3](references.md).
- **2023 · ALCE · alternative branch.** [PAPER-REPORTED] Correctness and attribution evaluation [R50.4](references.md).
- **2024 · Self-RAG / Self-Route · alternative branch.** [PAPER-REPORTED] Adaptive evidence use and context fallback [R50.5–R50.6](references.md).
- **2026 · LongEval / CiteGuard / context allocation · current frontier.** [PAPER-REPORTED] Explicit validation, diagnostic feedback and protocol-specific limits [R50.8–R50.10](references.md).

```figure
{
  "id": "fig-50.1",
  "kind": "lineage",
  "title": "Evidence-to-answer method lineage",
  "caption": "The branches change probability models, representations, control and evaluation; dates do not imply a universal ranking.",
  "placement": "inline",
  "evidence": "PAPER-REPORTED",
  "source": [
    "P40",
    "R50.2",
    "R50.3",
    "R50.4",
    "R50.5",
    "R50.8",
    "R50.10"
  ],
  "alt": "RAG2020, FiD2021, compression and citation evaluation2023, adaptive evidence generation2024, and2026 validation/allocation.",
  "spec": {
    "entries": [
      {
        "year": 2020,
        "work": "RAG",
        "cite": "P40",
        "relation": "conceptual ancestor"
      },
      {
        "year": 2021,
        "work": "Fusion-in-Decoder",
        "cite": "R50.2",
        "relation": "engineering optimization"
      },
      {
        "year": 2023,
        "work": "LLMLingua",
        "cite": "R50.3",
        "relation": "engineering optimization"
      },
      {
        "year": 2023,
        "work": "ALCE",
        "cite": "R50.4",
        "relation": "alternative branch"
      },
      {
        "year": 2024,
        "work": "Self-RAG",
        "cite": "R50.5",
        "relation": "alternative branch"
      },
      {
        "year": 2026,
        "work": "LongEval / context allocation",
        "cite": "R50.8",
        "relation": "current frontier"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-50.2",
  "kind": "cycle",
  "title": "Context and evidence-control loop",
  "caption": "New evidence or a named defect justifies another bounded iteration; all work and terminal outcomes remain visible.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-50.12",
  "alt": "Acquire authorized evidence, compile context, generate privately, verify, and record answer or bounded retrieval/revision.",
  "spec": {
    "stages": [
      {
        "id": "e",
        "label": "Authorized evidence",
        "kind": "dataset"
      },
      {
        "id": "c",
        "label": "Compile context",
        "kind": "process"
      },
      {
        "id": "g",
        "label": "Private generation",
        "kind": "model"
      },
      {
        "id": "v",
        "label": "Support / task check",
        "kind": "branch"
      },
      {
        "id": "o",
        "label": "Outcome / next dependency",
        "kind": "feedback"
      }
    ],
    "edges": [
      {
        "from": "e",
        "to": "c"
      },
      {
        "from": "c",
        "to": "g"
      },
      {
        "from": "g",
        "to": "v"
      },
      {
        "from": "v",
        "to": "o"
      },
      {
        "from": "o",
        "to": "e",
        "kind": "feedback",
        "label": "bounded new evidence"
      }
    ]
  }
}
```

## Terms owned here

| Term | Canonical definition and owner |
|---|---|
| Evidence-provenance context compiler | Typed authorized context transformation with stable source lineage; [50.1](50-1-context-assembly.md) |
| Mandatory context dependency closure | Input items required to preserve request/tool/history meaning; [50.2](50-2-context-budgeting.md) |
| Restricted-document generation mixture | Latent-document distribution normalized on retrieved support; [50.3](50-3-generation-strategies.md) |
| Citation identity versus support | Source resolution and semantic entailment are distinct predicates; [50.4](50-4-grounding-and-abstention.md) |
| Equal-quality context-policy frontier | Minimum complete cost under fixed risk/coverage/latency requirements; [50.5](50-5-retrieval-versus-context-length.md) |
| Oracle context intervention | A declared replacement of evidence representation used for diagnostic repair; [50.6](50-6-end-to-end-evaluation.md) |

## Reference-stack coverage

| Stack section | Entry | Stack layer | What this chapter takes from it | Surface used | Sections | Evidence label |
|---|---|---|---|---|---|---|
| §1 lab | #4 Meta AI / FAIR | — | RAG/FiD originating methods | https://github.com/facebookresearch | 50.1, 50.3, 50.5 | PAPER-REPORTED |
| §1 lab | #13 Microsoft Research / Microsoft AI | — | LLMLingua compression | https://www.microsoft.com/research/publications/ | 50.2 | PAPER-REPORTED |
| §1 lab | #3 Google DeepMind | — | Self-Route archival study | https://deepmind.google/research/publications/ | 50.5 | PAPER-REPORTED |
| §1 lab | #22 Allen Institute for AI (Ai2) | — | Self-RAG primary research | https://allenai.org/papers | 50.3 | PAPER-REPORTED |
| §4 system | #26 Hugging Face Transformers | Model definition / adaptation | Chat serialization, RAG loss source and verifier interfaces | https://huggingface.co/docs/transformers/ | All | OFFICIAL-DOCUMENTATION |
| §4 system | #17 PyTorch | Model / autograd framework | Tensor/operator and model-state cost | https://pytorch.org/docs/stable/ | All | DERIVED; PAPER-REPORTED |
| §4 system | #41 vLLM | Inference engine | Reported Self-RAG runtime and causal serving boundary | https://docs.vllm.ai/ | All | PAPER-REPORTED; DERIVED |
| Outside the reference stack (routed via book_plan.md anchors) | ALCE/HELM, LongEval/CiteGuard/allocation, MLPerf E2E RAG | — | Plan's RAG/HELM anchors require task-support evaluation; direct primary methods/official measurement complete those obligations | Exact URLs/revisions in [references](references.md) | All | PAPER-REPORTED; OFFICIAL-DOCUMENTATION |

[DERIVED] **Inspection dimensions applied:** Inference, Metrics and Reproducibility throughout; Memory/Communication/Kernels in 50.1/50.3/50.5–50.6; Precision/Parallelism in implementation cost boundaries; Post-training in the reported learned retriever/critic/compressor objectives. Checkpointing is not a mechanism studied here; corpus/model manifests identify versions rather than training recovery. No framework/kernel execution verification is claimed.

## Source route

[DERIVED] Use the plan's originating RAG and HELM anchors, then the reference stack's lab-to-primary-paper and paper-to-official-implementation cascade. Concrete filled-in queries retain its protocols:

- §1.1: "site:ai.meta.com/results publication retrieval augmented generation OR site:arxiv.org/abs Meta AI retrieval augmented generation".
- §1.1: "site:microsoft.com/research/publication prompt compression OR site:arxiv.org/abs Microsoft Research LLMLingua".
- §1.1: "site:deepmind.google/research/publications long context retrieval".
- §3.1: "Enabling Large Language Models to Generate Text with Citations official paper code".
- §4.3: "site:github.com/huggingface/transformers RagSequenceForGeneration get_nll".
- §4.3: "site:docs.vllm.ai retrieval generation metrics".

[DERIVED] Inspect full method/protocol sections before using headline results. Verify the normalization, evaluator, evidence universe and comparison budget. Check negative conditions and ambiguous source notation against the inspected revision. A repository link verifies availability, while a source-path inspection supports only the disclosed code semantics; neither establishes execution compatibility.

## Status

[UNVERIFIED] **Editorial status: manuscript_draft.** Six complete section manuscripts, 20 figures, mathematical formulations/procedures, source-reported protocols and a required-topic audit are present. No context compiler/model/evaluation benchmark was executed. Branch docs/source are unpinned. CiteGuard generator/denominator ambiguities, Self-Route aggregate inconsistencies, evaluator transfer and adaptive allocation limits remain explicit.

[DERIVED] Open questions concern representation preservation under compression, tractable allocation with complementary/conflicting facts, critic calibration under corpus shifts and reliable stage attribution from oracle interventions. Each is tied to settling evidence in the relevant section. These scientific gaps are distinct from the unexecuted artifact; the chapter remains a defensible draft rather than a claimed benchmark replication.
