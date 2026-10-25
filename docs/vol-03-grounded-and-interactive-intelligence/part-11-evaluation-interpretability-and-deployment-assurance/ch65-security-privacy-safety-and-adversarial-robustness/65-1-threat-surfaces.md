---
id: ms.section.65.1
entity_type: section
title: "Threat surfaces"
volume: 3
part: 11
chapter: 65
section: 65.1
slug: 65-1-threat-surfaces
parent: ms.chapter.65
prev_sibling: null
next_sibling: ms.section.65.2
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.24, ms.chapter.32, ms.chapter.33, ms.chapter.34, ms.chapter.35, ms.chapter.36, ms.chapter.46, ms.chapter.47, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64]
downstream: [ms.chapter.66]
related: [ms.chapter.30, ms.chapter.42, ms.chapter.48]
relations: []
axes: {lifecycle: [pretraining, post_training, inference, evaluation, assurance], mechanism: [security_boundary, privacy_accounting, adversarial_evaluation], feedback_setting: [], modality: [text, code, image, tool_trajectory]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 65.1 - Threat surfaces

## Scope

[DERIVED] Threat modeling begins with assets and invariants across training data, weights, dependencies, retrieval, prompts, tools, persistent memory, interfaces and infrastructure. An attack name is not a threat model. This section defines the access and evaluation contract used throughout the chapter.

## Why this exists

[DERIVED] A backdoor study with attacker-controlled weights cannot establish the vulnerability of a service whose weights are fixed and authenticated. A prompt-injection test that scores output text cannot establish an unauthorized payment unless a payment occurred or a faithful execution-state oracle records it. A clean classifier can still be compromised through its training pipeline or wrapper.

## Intuition

[DERIVED] A document may be relevant and authentic while carrying an instruction the user never authorized. A signed model proves who published particular bytes, not that the publisher is benign. A model may describe an operation correctly while lacking permission to perform it. Separate content, provenance and authority before evaluating behavior.

## Formulation

[MATHEMATICALLY-DERIVED] Define the threat snapshot

$$
 \mathcal T=(\mathcal X,\mathcal I,\mathcal K,\mathcal S,B,\mathcal E,V),
$$
*(Eq. 65.1)*

[DERIVED] X is assets/invariants, I attacker interventions, K attacker knowledge, S writable/readable surfaces, B resources/interaction budget, E environment/harness/state and V the success event. Assets include confidentiality, integrity, availability and authorized task completion. V must distinguish attempted, blocked, emitted and executed violations.

[MATHEMATICALLY-DERIVED] For an authority graph G=(nodes,edges), a necessary exfiltration path has

$$
 \text{read protected asset}\leadsto\text{attacker-influenced computation}\leadsto\text{outbound sink}.
$$
*(Eq. 65.2)*

[DERIVED] A mediator can break the path by denying an access or information flow. This is a reachability model under declared graph completeness; unmodeled logs, side channels, caches and background jobs can add paths. Deleting an explicit HTTP tool does not prove every outbound channel is absent.

[MATHEMATICALLY-DERIVED] Random independent review with replacement misses m poisoned records among N after r inspections with probability

$$
 P_{miss}=(1-m/N)^r.
$$
*(Eq. 65.3)*

[DERIVED] Without-replacement review instead has hypergeometric probability choose(N-m,r)/choose(N,r), for valid counts. A review process targeted by provenance or labels has a different sampling law. Neither expression proves that an inspected poison is recognizable. Small poisoned fractions can evade random review even when their learned effect is large.

[MATHEMATICALLY-DERIVED] A deployment risk functional can be written

$$
 R(Df,A;\mathcal T)=\mathbb E[L(V,h)\mid Df,A,\mathcal T],
$$
*(Eq. 65.4)*

[DERIVED] Df denotes the complete defender, including model, tools, permissions, wrappers and monitors. L includes severity and operational consequences. This conditional expectation is not a measured probability until the task/adversary distributions and independent sampling units are specified. Robustness across a finite tested attacker set is narrower than a supremum over all feasible adversaries.

```figure
{
  "id": "fig-65.3",
  "kind": "calculator",
  "title": "Random inspection can miss a small poison fraction",
  "caption": "Eq.65.3 independent with-replacement inspections; p=m/N. A sampled malicious example is assumed detectable, an optimistic review premise.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-65.3",
  "alt": "Eq.65.3 independent with-replacement inspections; p=m/N. A sampled malicious example is assumed detectable, an optimistic review premise.",
  "spec": {
    "equation": "65.3",
    "tex": "P_{miss}=(1-p)^r",
    "inputs": [
      {
        "symbol": "p",
        "label": "Poisoned record fraction",
        "default": 0.001,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "r",
        "label": "Independent inspections",
        "default": 100,
        "min": 1,
        "max": 10000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "miss",
        "label": "Probability of no poison sampled",
        "formula": "(1-p)^r",
        "format": "percent"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Enumerate each lifecycle boundary: collection/provenance, curation and labels, training code/checkpoints, dependencies and loaders, deployment templates/retrieval, model-output parsing, credential broker, tools, memory and logs. At each boundary record attacker control, authority and observability. A model prompt cannot enforce a filesystem permission if the runtime grants unrestricted access.

[PAPER-REPORTED] The April classifier-poisoning study fine-tunes Qwen3-8B with LoRA on biological-harm classification. Around32 poisoned examples can install its studied trigger; three trials vary selected data/poisons. Its internal Haiku4.5 follow-up uses one trial per poison amount, with32 examples activating67/100 OODqueries and128activating100/100. Fixed adversarial sets and trigger similarity limit generalization; this is not a claim that every classifier is compromised by32 examples or that adaptive red-teamers cannot detect it. [R65.1, Methods; internal replication; Limitations]

[DERIVED] A safeguard's training pipeline is therefore part of the threat surface. Ordinary clean accuracy and a fixed jailbreak set can miss a secret-trigger behavior. Provenance review, role separation and data-access controls address a different obstruction from adding another runtime classifier.

```figure
{
  "id": "fig-65.4",
  "kind": "diagram",
  "title": "A safeguard also has a supply chain",
  "caption": "Classifier training data, wrapper code and deployment configuration require integrity controls. A clean benchmark tests only the evaluated behavior.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.4",
  "alt": "Classifier training data, wrapper code and deployment configuration require integrity controls. A clean benchmark tests only the evaluated behavior.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "data",
        "kind": "dataset",
        "label": "Classifier data/labels"
      },
      {
        "id": "code",
        "kind": "process",
        "label": "Training and dependencies"
      },
      {
        "id": "weights",
        "kind": "model",
        "label": "Safeguard weights"
      },
      {
        "id": "wrap",
        "kind": "boundary",
        "label": "Wrapper and threshold"
      },
      {
        "id": "agent",
        "kind": "model",
        "label": "Protected system"
      }
    ],
    "edges": [
      {
        "from": "data",
        "to": "code",
        "kind": "flow",
        "label": "curate"
      },
      {
        "from": "code",
        "to": "weights",
        "kind": "flow",
        "label": "train"
      },
      {
        "from": "weights",
        "to": "wrap",
        "kind": "flow",
        "label": "load"
      },
      {
        "from": "wrap",
        "to": "agent",
        "kind": "dependency",
        "label": "gate behavior"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 65.1 — Produce a reviewable threat snapshot

[DERIVED] Inputs: a local system inventory and declared deployment task. Output: a versioned graph, protected invariants and bounded test plan.

1. List assets and concrete violation events, including legitimate task failure and service denial.
2. Enumerate each component's read/write/execute/network privileges and data retention.
3. Assign attacker capabilities separately for training, artifacts, runtime input and infrastructure; do not grant capabilities merely because another paper assumes them.
4. Trace authority transitions and all modeled paths to protected sinks, including memory, logs and background jobs.
5. Specify attack feedback/budget, defender session/reset state, success oracle and independent test unit.
6. Record controls, unresolved graph edges, accountable owner and the operating change that invalidates the snapshot.

[DERIVED] Graph traversal is O(nodes+edges) for explicit reachability; establishing graph completeness is the hard engineering obligation. A static graph cannot capture all implicit flows or unknown code paths.

## Implementation

[DERIVED] Inventory hashes alone are insufficient: include loader behavior, remote-code options, plugins, environment variables, network egress, credentials, model adapters and data-processing scripts. A tensor file format that avoids general code execution reduces one artifact risk but cannot prove benign learned behavior. Pinning a malicious dependency makes the attack reproducible rather than harmless.

[DERIVED] Keep secret material outside model-readable context whenever feasible and retrieve per-resource data under the authenticated principal. Persistent memory requires tenant/session/task separation at the store/query layer. A textual instruction saying another user's data is private is weaker than preventing that data from being returned.

## Experimental design

### Reported experiments

[DERIVED] The poisoning case controls training-set access and classifier targets. Its empirical threshold is specific to those choices. A deployment with different training review, wrapper controls or data distribution requires another study.

[DERIVED] Experiment 65.1 proposes synthetic canaries and local mock tools across lifecycle boundaries. Test both attacker-controlled and immutable components, with an explicit no-access control. No real credentials or third-party systems enter the artifact.

## Observations

**What the paper claims.** [PAPER-REPORTED] Fine-tuning-data poisoning can compromise the studied classifiers without a large fixed-set robustness loss [R65.1].

**What the evidence shows.** [DERIVED] The disclosed training access, trigger construction, trial counts and fixed evaluations bound that conclusion.

**What we infer.** [DERIVED] Safeguard integrity and behavior robustness need distinct evidence and controls.

**What remains unknown.** [UNVERIFIED] Exhaustive review effectiveness and adaptive detection under other triggers were left untested in that study.

## Failure modes

[DERIVED] Unspecified attacker access, hidden privileged artifacts, ambiguous success events, ignored logs/egress and conflated attempted/executed actions can invalidate a threat claim. A defense can reduce harmful output by refusing every legitimate request; utility must remain in the acceptance rule.

```figure
{
  "id": "fig-65.5",
  "kind": "compare",
  "title": "A threat surface has a control and an oracle",
  "caption": "The table is a proposed audit map, not an observed mitigation result.",
  "placement": "inline",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.5",
  "alt": "The table is a proposed audit map, not an observed mitigation result.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "surface",
        "label": "Surface"
      },
      {
        "id": "control",
        "label": "Boundary"
      },
      {
        "id": "oracle",
        "label": "Evidence"
      }
    ],
    "rows": [
      {
        "dimension": "Data/weights",
        "values": {
          "surface": "Poison or malicious artifact",
          "control": "Provenance and isolated loading",
          "oracle": "Hashes plus held-out behavior tests"
        }
      },
      {
        "dimension": "Retrieval/memory",
        "values": {
          "surface": "Untrusted content or cross-tenant data",
          "control": "Principal-scoped access and provenance",
          "oracle": "Synthetic canary/state checks"
        }
      },
      {
        "dimension": "Tools/infrastructure",
        "values": {
          "surface": "Unauthorized side effect or egress",
          "control": "Capability broker and isolation",
          "oracle": "Actual mock state and event logs"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] @ms.chapter.7 and @ms.chapter.8 own data provenance; @ms.chapter.30 owns training infrastructure; @ms.chapter.51 owns tool execution. @ms.section.65.2 examines learned attacks and @ms.section.65.3 runtime authority transitions.

## Extensions

### Improvements and their evidence

[DERIVED] Prioritize a mediator when the graph identifies a privileged path that a model can influence. Reverse the choice if the path is absent or a narrower control preserves more utility. Add behavioral screening when artifact integrity cannot establish learned behavior; retain both when their failure modes differ. Stop only at a bounded snapshot, reopening on new privileges, components or attacker access.

## Limitations

[DERIVED] Threat models omit unknown mechanisms and can become stale. Graph reachability is conditional on the inventory, not a formal proof of the deployed system. No controls were executed here.

## Reproducibility

[DERIVED] Archive inventory/version hashes, access matrix, graph, synthetic assets, success oracle, budgets and reset state. Do not retain live secrets in the manuscript or audit artifacts.

## References

[R65.1] Classifier poisoning, April 24 technical disclosure. Exact settings and bounds: @ms.references.65.
