---
id: ms.part.9
entity_type: part
title: "Part IX — Retrieval, Context, and Agent Systems"
short_title: Part IX
volume: 3
part: 9
chapter: null
section: null
slug: part-09-retrieval-context-and-agent-systems
parent: ms.volume.3
prev_sibling: ms.part.8
next_sibling: ms.part.10
children: [ms.chapter.49, ms.chapter.50, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.54]
prerequisites: []
downstream: []
related: []
relations: []
axes: {lifecycle: [], mechanism: [], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: foundational, disputed: false}
evidence_summary: {labels_used: [KNOWN], empirically_observed: false}
word_count_target: 500
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

VOLUME III / PART IX

# Part IX — Retrieval, Context, and Agent Systems

**Principal development outcome:** Grounded context, reliable tools, and consistent long-horizon state.

**Navigation:** [Volume III](../README.md) · [Atlas index](../../README.md) · previous part: [Part VIII](../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/README.md) · next part: [Part X](../../vol-03-grounded-and-interactive-intelligence/part-10-multimodal-world-and-embodied-models/README.md)

## Chapters

| Ch | Title | Prerequisites | Artifact | Sections |
|---:|---|---|---|---|
| [49](ch49-retrieval-models-indexing-and-evidence-access/README.md) | Retrieval models, indexing, and evidence access | 06–12, 18, 48 | a versioned retrieval pipeline and recall/latency evaluation | [49.1](ch49-retrieval-models-indexing-and-evidence-access/49-1-corpus-construction.md) · [49.2](ch49-retrieval-models-indexing-and-evidence-access/49-2-retrieval-representations.md) · [49.3](ch49-retrieval-models-indexing-and-evidence-access/49-3-search-infrastructure.md) · [49.4](ch49-retrieval-models-indexing-and-evidence-access/49-4-ranking-and-fusion.md) · [49.5](ch49-retrieval-models-indexing-and-evidence-access/49-5-query-and-evidence-strategy.md) · [49.6](ch49-retrieval-models-indexing-and-evidence-access/49-6-retrieval-evaluation.md) |
| [50](ch50-context-construction-and-retrieval-augmented-generation/README.md) | Context construction and retrieval-augmented generation | 10, 15, 37–38, 49 | a context compiler with evidence provenance | [50.1](ch50-context-construction-and-retrieval-augmented-generation/50-1-context-assembly.md) · [50.2](ch50-context-construction-and-retrieval-augmented-generation/50-2-context-budgeting.md) · [50.3](ch50-context-construction-and-retrieval-augmented-generation/50-3-generation-strategies.md) · [50.4](ch50-context-construction-and-retrieval-augmented-generation/50-4-grounding-and-abstention.md) · [50.5](ch50-context-construction-and-retrieval-augmented-generation/50-5-retrieval-versus-context-length.md) · [50.6](ch50-context-construction-and-retrieval-augmented-generation/50-6-end-to-end-evaluation.md) |
| [51](ch51-tool-use-protocol-interfaces-and-reliable-execution/README.md) | Tool use, protocol interfaces, and reliable execution | 10–11, 37, 46–47, 50 | a typed tool-execution contract | [51.1](ch51-tool-use-protocol-interfaces-and-reliable-execution/51-1-tool-representation.md) · [51.2](ch51-tool-use-protocol-interfaces-and-reliable-execution/51-2-routing-and-selection.md) · [51.3](ch51-tool-use-protocol-interfaces-and-reliable-execution/51-3-protocol-boundaries.md) · [51.4](ch51-tool-use-protocol-interfaces-and-reliable-execution/51-4-execution-correctness.md) · [51.5](ch51-tool-use-protocol-interfaces-and-reliable-execution/51-5-side-effect-management.md) · [51.6](ch51-tool-use-protocol-interfaces-and-reliable-execution/51-6-tool-security.md) |
| [52](ch52-planning-control-flow-verification-and-recovery/README.md) | Planning, control flow, verification, and recovery | 36, 38, 50–51 | a bounded agent controller with explicit state transitions | [52.1](ch52-planning-control-flow-verification-and-recovery/52-1-controller-families.md) · [52.2](ch52-planning-control-flow-verification-and-recovery/52-2-state-and-constraints.md) · [52.3](ch52-planning-control-flow-verification-and-recovery/52-3-plan-verification.md) · [52.4](ch52-planning-control-flow-verification-and-recovery/52-4-adaptive-execution.md) · [52.5](ch52-planning-control-flow-verification-and-recovery/52-5-recovery.md) · [52.6](ch52-planning-control-flow-verification-and-recovery/52-6-performance-analysis.md) |
| [53](ch53-agent-memory-persistent-state-and-long-horizon-consistency/README.md) | Agent memory, persistent state, and long-horizon consistency | 24, 42, 49–52 | a memory/state policy with provenance and deletion semantics | [53.1](ch53-agent-memory-persistent-state-and-long-horizon-consistency/53-1-memory-taxonomy.md) · [53.2](ch53-agent-memory-persistent-state-and-long-horizon-consistency/53-2-write-policies.md) · [53.3](ch53-agent-memory-persistent-state-and-long-horizon-consistency/53-3-retrieval-and-use.md) · [53.4](ch53-agent-memory-persistent-state-and-long-horizon-consistency/53-4-state-consistency.md) · [53.5](ch53-agent-memory-persistent-state-and-long-horizon-consistency/53-5-forgetting-and-deletion.md) · [53.6](ch53-agent-memory-persistent-state-and-long-horizon-consistency/53-6-long-horizon-evaluation.md) |
| [54](ch54-multi-agent-coordination-and-system-level-evaluation/README.md) | Multi-agent coordination and system-level evaluation | 06, 36, 48, 51–53 | a coordination experiment with a budget-matched single-agent baseline | [54.1](ch54-multi-agent-coordination-and-system-level-evaluation/54-1-decomposition.md) · [54.2](ch54-multi-agent-coordination-and-system-level-evaluation/54-2-communication.md) · [54.3](ch54-multi-agent-coordination-and-system-level-evaluation/54-3-shared-state.md) · [54.4](ch54-multi-agent-coordination-and-system-level-evaluation/54-4-coordination-policies.md) · [54.5](ch54-multi-agent-coordination-and-system-level-evaluation/54-5-resource-control.md) · [54.6](ch54-multi-agent-coordination-and-system-level-evaluation/54-6-evaluation.md) |

## Reading order inside this part

Chapters are ordered by prerequisite. Each chapter page lists its own prerequisites, siblings, and downstream chapters.
