---
id: ms.section.64.5
entity_type: section
title: "Attribution graphs"
volume: 3
part: 11
chapter: 64
section: 64.5
slug: 64-5-attribution-graphs
parent: ms.chapter.64
prev_sibling: ms.section.64.4
next_sibling: ms.section.64.6
children: []
prerequisites:
  [
    ms.chapter.2,
    ms.chapter.5,
    ms.chapter.13,
    ms.chapter.14,
    ms.chapter.15,
    ms.chapter.16,
    ms.chapter.17,
    ms.chapter.18,
    ms.chapter.32,
    ms.chapter.61,
    ms.chapter.62,
  ]
downstream: [ms.chapter.65, ms.chapter.66]
related: [ms.chapter.40, ms.chapter.63]
relations: []
axes:
  {
    lifecycle: [evaluation, assurance],
    mechanism:
      [causal_intervention, representation_analysis, feature_decomposition],
    feedback_setting: [],
    modality: [text],
  }
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers]
benchmarks: []
datasets: []
status: { maturity: active, disputed: false }
evidence_summary:
  {
    labels_used:
      [
        DERIVED,
        MATHEMATICALLY-DERIVED,
        PAPER-REPORTED,
        CODE-VERIFIED,
        ASSUMED,
        NOT-DISCLOSED,
        UNVERIFIED,
      ],
    empirically_observed: false,
  }
word_count_target: 2200
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 64.5 Attribution graphs

## Scope

[DERIVED] Attribution graphs compress a replacement model's prompt-local computation into feature nodes and weighted dependencies. The baseline is an output-only or coarse component explanation. The required result is a graph with explicit approximation, residual, pruning and intervention contracts, accompanied by separate reconstruction, replacement and causal tests. This section owns cross-layer flow, graph construction and faithfulness measurement. It does not treat graph completeness, edge-weight coverage or readable labels as a proof that the original model computes exactly the depicted mechanism.

## Why this exists

[DERIVED] A large collection of isolated features does not explain how their effects combine across layers and token positions. Dense all-pairs dependencies are difficult to inspect and expensive to store. A sparse replacement model supplies candidate variables and local propagation rules, while target-dependent pruning reduces the displayed graph. The controlling obstruction is preserving the distinctions needed for the claim while discarding most nodes and edges. Pruning improves inspectability by introducing another approximation whose error must be measured.

## Intuition

[PAPER-REPORTED] CLT-Forge and CTA trace a feature's decoder directions through fixed local propagation paths to a later feature's encoder direction or a chosen scalar readout. Nonlinearities and input-dependent attention/normalization terms are frozen in the analysis computation. Consequently the graph describes a specified local replacement calculation. It is not the full Jacobian of the unrestricted original model, and attention computation itself remains outside CLT-Forge's learned replacement scope. [R64.2, §§2.2, 5; R64.1, Appendix A.4](https://arxiv.org/html/2603.21014v2#S2.SS2).

## Formulation

[DERIVED] Let $i=(\ell,k,p)$ identify a source feature at layer $\ell$, token $p$, with code value $z_i$. Let $j=(r,k',p')$ be a downstream target. Let $u_i^{\ell\to s}\in\mathbb R^d$ be its decoder column into MLP output $s$ and $e_j\in\mathbb R^d$ the target encoder covector. For a declared frozen-path propagation matrix $J_{s,p\to r,p'}\in\mathbb R^{d\times d}$, define

$$
\kappa_{ij}=\sum_{\ell\le s\le r}e_j^TJ_{s,p\to r,p'}u_i^{\ell\to s},\qquad
c_{ij}=z_i\kappa_{ij}.
$$

_(Eq. 64.17)_

[DERIVED] The first is a local edge sensitivity; the second is a value-weighted contribution under the frozen linear contract. The source graph equations show the decoder-Jacobian-encoder contraction; multiplication by source activation must be stated when interpreting an edge as a contribution. A target nonlinear gate's output additionally requires its own fixed mask/derivative policy. Tensor orientation here is explicit rather than copied from row-vector notation. A same-layer path that does not exist in the original execution contributes zero under the correct causal ordering. [R64.2, Eq. 4; R64.1, Appendix A.4, Eq. 2](https://arxiv.org/html/2608.27510v1#A1.SS4).

[DERIVED] For held-out activations, define reconstruction explained variance and a separate loss-recovery score:

$$
V_{\mathrm{rec}}=1-\frac{\sum_i\|m_i-\widehat m_i\|^2}{\sum_i\|m_i-\bar m\|^2},\qquad
R_{\mathrm{loss}}=\frac{\mathcal L_{\mathrm{abl}}-\mathcal L_{\mathrm{rep}}}
{\mathcal L_{\mathrm{abl}}-\mathcal L_{\mathrm{orig}}}.
$$

_(Eq. 64.18)_

[DERIVED] The variance denominator must be positive. Loss recovery additionally requires an ablation baseline with strictly greater loss than the original under the same workload. The score can be negative or exceed one and must not be clipped into apparent validity. These are book-defined metrics; CLT-Forge's reported replacement/completeness numbers are not silently assigned these exact normalizations. Reconstruction tests target prediction at cached sites; joint replacement runs the altered model; interventions test particular causal claims. They answer different questions.

[DERIVED] For edge weights $w_e$ and a retained set $\mathcal E_*$, absolute-weight coverage is

$$
A(\mathcal E_*)=\frac{\sum_{e\in\mathcal E_*}|w_e|}{\sum_{e\in\mathcal E}|w_e|},
\qquad \sum_{e\in\mathcal E}|w_e|>0.
$$

_(Eq. 64.19)_

[MATHEMATICALLY-DERIVED] Coverage does not bound relative output error without additional assumptions. Contributions $100,-99,1$ sum to 2. Keeping only the largest positive contribution preserves 50% of absolute weight but predicts 100. Even 99% absolute coverage can omit the small uncancelled result that matters. Propagation gains, nonlinear interactions and residual nodes further break any automatic coverage-to-faithfulness inference. If all weights are zero, report undefined coverage and a zero-evidence graph rather than 100% completeness.

[MATHEMATICALLY-DERIVED] For $m$ active nodes and $b$ bytes per stored edge scalar, a dense adjacency requires

$$
M_{\mathrm{adj}}=bm^2\ \mathrm{bytes},\qquad
M_{\mathrm{sparse}}\simeq |\mathcal E_*|(b+2b_{\mathrm{idx}})\ \mathrm{bytes},
$$

_(Eq. 64.20)_

[DERIVED] The sparse estimate counts two indices and one scalar per edge, excluding row pointers, object overhead, node payloads and temporary autograd state. A causal triangle can reduce the dense count but token/layer ordering must be modeled before applying that reduction. Dense edge materialization can dominate a graph whose final picture is small.

```figure
{
  "id": "fig-64.15",
  "kind": "calculator",
  "title": "Graph storage before rendering",
  "caption": "Executes Eq. 64.20 for illustrative counts. Dense adjacency and sparse edge-list estimates exclude node metadata, graph objects, row pointers and differentiation memory.",
  "alt": "An analytical calculator with explicit inputs. Executes Eq. 64.20 for illustrative counts. Dense adjacency and sparse edge-list estimates exclude node metadata, graph objects, row pointers and differentiation memory.",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-64.20",
  "spec": {
    "equation": "64.20",
    "tex": "M_{\\mathrm{adj}}=bm^2,\\quad M_{\\mathrm{sparse}}=e(b+2b_{\\mathrm{idx}})",
    "inputs": [
      {
        "symbol": "nodes",
        "label": "active graph nodes",
        "default": 10000,
        "min": 100,
        "max": 100000,
        "format": "integer"
      },
      {
        "symbol": "edges",
        "label": "retained edge records",
        "default": 50000,
        "min": 0,
        "max": 10000000,
        "format": "integer"
      },
      {
        "symbol": "scalar",
        "label": "bytes per edge scalar",
        "default": 4,
        "min": 2,
        "max": 8,
        "format": "integer"
      },
      {
        "symbol": "index",
        "label": "bytes per endpoint index",
        "default": 4,
        "min": 4,
        "max": 8,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "dense",
        "label": "dense adjacency MiB",
        "formula": "scalar*pow(nodes,2)/pow(2,20)",
        "format": "fixed2"
      },
      {
        "symbol": "sparse",
        "label": "edge-list estimate MiB",
        "formula": "edges*(scalar+2*index)/pow(2,20)",
        "format": "fixed2"
      }
    ]
  },
  "placement": "rail",
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] CLT-Forge constructs a replacement execution, obtains sparse active features, computes target-directed dependencies and prunes for inspection. CTA reuses the construction with either a probe direction at a selected layer/token or an output logit. Its Appendix A.4 states node and edge thresholds of 80% and 95% effect coverage respectively. Thresholds are analysis choices; a probe-target graph must apply them to its actual target, not accidentally use a stale logit target. [R64.2, §§2.2, 3.5; R64.1, Appendix A.4](https://arxiv.org/html/2608.27510v1#A1.SS4).

[DERIVED] A reproducible graph build must retain model and dictionary identities; feature IDs and token positions; edge sensitivity versus contribution semantics; scalar target and sign; frozen nonlinearities; error/bias/embedding nodes; and pruning rules. The feature reconstruction residual is not noise that can be deleted merely because it lacks a convenient name. If a residual node explains much of the target, the displayed named-feature mechanism is correspondingly incomplete. Labels are annotations with evidence, not a new computation performed by the graph.

[DERIVED] Validation proceeds across three boundaries. First, predict held-out MLP outputs in the original activation distribution. Second, substitute all intended reconstructed outputs and measure the original task loss and behavior: independently small site errors may accumulate or move later inputs off the cached distribution. Third, intervene on features or edges in both the analysis model and a justified corresponding original-model intervention, testing agreement rather than only deletion from the graph. A graph that passes one boundary can fail the next.

```figure
{
  "id": "fig-64.16",
  "kind": "diagram",
  "title": "Three validation boundaries for an attribution graph",
  "caption": "Reconstruction accuracy, joint replacement behavior and causal transfer require separate records. Residual and frozen-path assumptions remain attached to the graph.",
  "alt": "Text equivalent: Original frozen model and target. Held-out site activations. Site reconstruction test. Joint replacement execution. Frozen-path target graph and residuals. Matched intervention transfer test. Arrows encode the stated dependencies, not measured causal strengths.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.17",
    "DERIVED:eq-64.18",
    "DERIVED:eq-64.19"
  ],
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "orig",
        "kind": "model",
        "label": "Original frozen model and target"
      },
      {
        "id": "cache",
        "kind": "dataset",
        "label": "Held-out site activations"
      },
      {
        "id": "recon",
        "kind": "metric",
        "label": "Site reconstruction test"
      },
      {
        "id": "replace",
        "kind": "model",
        "label": "Joint replacement execution"
      },
      {
        "id": "graph",
        "kind": "process",
        "label": "Frozen-path target graph and residuals"
      },
      {
        "id": "causal",
        "kind": "metric",
        "label": "Matched intervention transfer test"
      }
    ],
    "edges": [
      {
        "from": "orig",
        "to": "cache",
        "label": "extract"
      },
      {
        "from": "cache",
        "to": "recon",
        "label": "predict"
      },
      {
        "from": "recon",
        "to": "replace",
        "label": "separate acceptance"
      },
      {
        "from": "replace",
        "to": "graph",
        "label": "construct and prune"
      },
      {
        "from": "orig",
        "to": "causal",
        "label": "original intervention"
      },
      {
        "from": "graph",
        "to": "causal",
        "label": "analysis prediction"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 64.5 - Build a graph with an explicit fidelity envelope.** [DERIVED] Inputs are a frozen model/replacement pair, prompt, scalar target, node/edge coverage levels, a finite VJP/edge budget and held-out validation cases. Outputs are a graph plus three validation records, or incomplete status.

$$
\begin{aligned}
1.&\quad \text{validate model, tokenizer, CLT, site and target identities};\\
2.&\quad (z,\widehat m,\varepsilon_{\mathrm{rec}})\leftarrow\operatorname{ReplacementForward}(x);
 \quad\text{retain bias and residual nodes};\\
3.&\quad \forall j\in\mathcal V_{\mathrm{active}}:\quad
 \kappa_{ij}\leftarrow\sum_s e_j^TJ_su_i^{\ell\to s},\quad c_{ij}\leftarrow z_i\kappa_{ij};\\
4.&\quad \text{if budget exhausted, return }(\mathrm{incomplete},\mathrm{computed\ edges});\\
5.&\quad \mathcal V_*,\mathcal E_*\leftarrow\operatorname{Prune}(c,\mathrm{declared\ thresholds});
 \quad\text{zero denominator}\Rightarrow\mathrm{undefined\ coverage};\\
6.&\quad \mathcal F\leftarrow(\mathrm{reconstruction},\mathrm{joint\ replacement},\mathrm{intervention\ transfer});\\
7.&\quad \operatorname{return}(\mathcal V_*,\mathcal E_*,\mathcal F,\mathrm{assumptions},\mathrm{omissions}).
\end{aligned}
$$

[DERIVED] Step 3 is conceptual: vector-Jacobian products can avoid materializing $d\times d$ Jacobians, but must honor the frozen-path contract. The invariant is a fixed target and unchanged analysis identities; pruning never upgrades an untested edge to verified. Building dependencies for $m$ targets can require $O(m)$ reverse traversals and up to $O(m^2)$ retained edge scalars. Streaming top candidates can reduce memory only if the pruning algorithm and discarded-mass accounting remain valid. The output records missing edges when resources stop extraction.

## Implementation

[CODE-VERIFIED] Static inspection of the CLT-Forge repository at commit c92d83d199899ac88f636310cd90e5c5173c379e found the following. CLT-Forge's pinned repository contains separate model, training and attribution modules, with feature-sharded decoding described in 64.3. This inspection establishes those static paths and their allocation/reduction rules; it does not execute graph extraction. PyTorch is the autograd/framework layer and Hugging Face Transformers the model-definition layer. The CLT/graph package is a source-specific implementation outside the reference stack. A production serving engine is not needed merely to construct an attribution graph and is not inserted as a dependency. [R64.3, `src/clt_forge/attribution/attribution.py`](https://github.com/LLM-Interp/CLT-Forge/blob/c92d83d199899ac88f636310cd90e5c5173c379e/src/clt_forge/attribution/attribution.py).

[DERIVED] Cache graph artifacts by model, tokenizer, dictionary, prompt, site, target, frozen-path policy and pruning configuration. A prompt-only key can return a graph for a different readout. Different dtypes or hooks are separate measurement regimes until checked. Store sparse indices with explicit token/layer ordering and validate references before display; renderer truncation is distinct from scientific pruning. Runtime and GPU memory must include the unpruned extraction, not just the final JSON or SVG.

## Experimental design

### Reported experiments

[PAPER-REPORTED] CLT-Forge reports explained variance around 0.7-0.8, replacement around 0.8 and graph completeness around 0.95 in its main evaluation discussion. The inspected discussion does not define every normalization sufficiently to identify them with Eq. 64.18. Its detailed training configurations are recorded in 64.3. CTA builds roughly 10,400 Gemma concept-layer-prompt graphs and reports graph construction/predictability work on a single A100 80 GB, with feature-level analysis around 26 h and graph-structural prediction around 5 h. These times describe different analysis pipelines, not interchangeable per-graph latency measures. [R64.2, §4; R64.1, Appendix E](https://arxiv.org/html/2603.21014v2#S4).

[DERIVED] A graph-faithfulness experiment must hold the scalar score, donor family, target examples, replacement checkpoint and pruning budget fixed across candidates. Compare an unpruned replacement, pruned feature graph, coarse-component baseline and size/norm-matched random graph. Evaluate held-out exact interventions and report omitted/error-node mass. Bootstrap by original prompt or template, preserving paired candidates; repeated edge deletions from one graph are not independent prompts. The book's proposed experiment remains unexecuted.

## Observations

**What the paper claims.** [PAPER-REPORTED] CLT-Forge states that direct optimization of replacement behavior was noisy and unstable relative to reconstruction-based training, and that its attention computation remains frozen. CTA reports target-dependent feature dissociation, with shared and exclusive graph components. [R64.2, §5; R64.1, §§3.3, 4.2](https://arxiv.org/html/2603.21014v2#S5).

**What the evidence shows.** [DERIVED] The cancellation counterexample for Eq.64.19 demonstrates that large absolute-weight coverage alone cannot bound relative output fidelity. The inspected sources disclose frozen-path and reconstruction-proxy limits, so their graph metrics are evidence under those contracts rather than proof of the original model's complete causal structure.

**What we infer.** [DERIVED] Reconstruction is a practical training proxy and the graph can localize target-dependent hypotheses. The proxy, target choice and frozen attention policy delimit the explanation. High graph coverage cannot fill the missing causal tests. [DERIVED] Use the graph when it reduces the hypothesis space and predicts held-out interventions better than cheaper component-level alternatives at the same extraction budget. Reject a mechanistic completeness claim if residual nodes dominate, joint replacement fails or interventions disagree. A display with fewer edges is preferable only after these acceptance constraints are preserved.

**What remains unknown.** [NOT-DISCLOSED] Fully reconciled metric normalizations, graph stability under alternate equally good dictionaries and broad original-model intervention transfer are not established by the reported headline numbers. No new extraction or independent runtime measurement is reported here.

## Failure modes

[DERIVED] Frozen attention can omit the mechanism that reroutes information after a perturbation. Decoder reuse can appear as a direct causal edge even though it is a replacement-model factorization. Correlated feature splitting changes graph topology without a large reconstruction change. Signed cancellation makes absolute coverage misleading. A small loss-recovery denominator is unstable; an improving ablation baseline invalidates its intended direction. Hidden residuals, stale target caches and mismatched feature IDs create falsely persuasive diagrams.

## Siblings

```figure
{
  "id": "fig-64.17",
  "kind": "compare",
  "title": "Graph scores test different objects",
  "caption": "Each score retains its own denominator, target and undefined cases. Passing one boundary does not discharge the others.",
  "alt": "Text equivalent: Each score retains its own denominator, target and undefined cases. Passing one boundary does not discharge the others.",
  "evidence": "DERIVED",
  "source": [
    "DERIVED:eq-64.18",
    "DERIVED:eq-64.19"
  ],
  "spec": {
    "axis": "Graph scores test different objects",
    "columns": [
      {
        "id": "recon",
        "label": "Reconstruction"
      },
      {
        "id": "replace",
        "label": "Joint replacement"
      },
      {
        "id": "intervene",
        "label": "Causal transfer"
      }
    ],
    "rows": [
      {
        "dimension": "Compared objects",
        "values": {
          "recon": "Target and predicted site tensors",
          "replace": "Original and altered full executions",
          "intervene": "Predicted and observed finite interventions"
        }
      },
      {
        "dimension": "Required control",
        "values": {
          "recon": "Held-out activation distribution",
          "replace": "Ablation baseline and task metric",
          "intervene": "Matched donor/site/background"
        }
      },
      {
        "dimension": "Cannot establish alone",
        "values": {
          "recon": "Downstream behavior",
          "replace": "Unique semantic mechanism",
          "intervene": "Untested intervention completeness"
        }
      }
    ]
  },
  "placement": "rail",
  "anchor": "siblings"
}
```

[DERIVED] A coarse head/MLP circuit costs less to name and may retain a more direct architectural intervention. Feature graphs improve resolution at the cost of learned-basis and replacement assumptions. Compare them on the intervention question, not the visual density of the graph.

## Extensions

### Improvements

[PAPER-REPORTED] CLT-Forge's cached/distributed pipeline is an engineering extension of cross-layer replacement analysis; CTA changes the readout being explained. Both improve what can be inspected under a practical budget, while retaining dictionary quality and frozen-path limitations. No eligible inspected source establishes a general theorem that a sparse attribution graph is a unique faithful causal model of a frontier LLM. [R64.2, §§3-5; R64.1, Limitations](https://arxiv.org/html/2608.27510v1#S5).

## Limitations

[DERIVED] A graph is a target- and prompt-local scientific artifact, not a global model diagram. Transfer to another target, tokenization, model revision or intervention family must be tested. A useful debugging hypothesis can remain valuable after a completeness claim fails, provided that its scope and error nodes are retained. Stop at that bounded use when the stronger validation is unavailable.

## Reproducibility

[DERIVED] Publish the unpruned and displayed graph identities, target/site schema, all frozen operators, contribution convention, residual/error nodes, pruning thresholds, coverage denominators, exact intervention records and compute/memory boundary. Equation/calculator bindings and pure storage/count fixtures are recorded in [verification](verification.md). They verify analytical integration, not a new graph extraction experiment.

## References

[R64.1] CTA, Appendix A.4 and E. [R64.2] CLT-Forge, §§2.2-5. [R64.3] Pinned attribution implementation. [R64.4] Bounds individual-effect versus joint-circuit conclusions.
