---
id: ms.section.48.6
entity_type: section
title: "External measurements"
volume: 2
part: 8
chapter: 48
section: 48.6
slug: 48-6-external-measurements
parent: ms.chapter.48
prev_sibling: ms.section.48.5
next_sibling: ms.verification.48
children: []
prerequisites: [ms.chapter.6, ms.chapter.21, ms.chapter.25, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.chapter.46, ms.chapter.47]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63]
related: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [capacity_planning, benchmarking, resource_accounting], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.nvidia-triton-inference-server]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 48.6 External measurements

## Scope

[DERIVED] External measurements provide evidence about a defined model, endpoint or system under a published protocol. The baseline transfers a leaderboard number directly into a production capacity/cost claim. Success is a provenance-preserving comparison that states which aspects of the target workload are supported and which require internal validation. This section covers MLPerf, Artificial Analysis, Epoch and reproducible internal measurements without treating discovery or aggregate metadata as mechanism evidence.

## Why this exists

[DERIVED] The same named model can be served with different precision, kernels, routing, hardware, cache policy and network location. Endpoint performance includes provider scheduling and transport; an isolated model benchmark may exclude them. A standardized system result can be highly reproducible while using a workload unlike the intended application. A historical price/performance record can be accurate for its date and still be unsuitable for a current procurement estimate.

[DERIVED] External evidence reduces the search space, but only after its unit is identified. Model-quality measurements concern outputs under a task/evaluator. Endpoint measurements concern a deployed API path. A system-under-test result concerns the disclosed hardware/software/load boundary. Training metadata describes model development and can include estimates. These records cannot be substituted for one another merely because they share a model-family name.

## Intuition

[DERIVED] Treat every number as the end of a measurement pipeline. Ask what entered, which work ran, which outputs were accepted, which failures remained, what interval was counted and how uncertainty was represented. Then map that pipeline to the target deployment. A mismatch can make a result irrelevant to one claim while retaining value for another; relevance is claim-specific.

[MATHEMATICALLY-DERIVED] A multiobjective frontier requires comparable coordinates. A higher token rate and lower per-token price do not imply lower accepted-task cost if output lengths or quality differ. A P50 endpoint speed and a P99 internal SLO do not inhabit the same statistic. A conversion is valid only when the missing relation is identified, rather than guessed from a nearby metric.

## Formulation

[DERIVED] Represent an evidence bundle by
$b=(\text{source, revision, date, object, workload, load, quality, clocks, units, failures, resources, price})$.
A target comparison requires a compatibility predicate $K(b,\mathcal D)$ for deployment contract $\mathcal D$. Missing fields produce partial or unidentified claims, not automatic compatibility. The predicate is an editorial/engineering contract, not a claim that evidence relevance can always be reduced to a binary scalar.

[MATHEMATICALLY-DERIVED] With matched service contracts and positive measured task counts, let a point be $y=(G,-L_p,-c)$: accepted-task goodput, negative declared latency quantile and negative accepted-task cost. Point $A$ dominates $B$ only if

$$
G_A\ge G_B,\qquad L_{p,A}\le L_{p,B},\qquad c_A\le c_B,
$$
*(Eq. 48.10)*

with at least one strict inequality and all coordinates defined on compatible populations, quality, workload and ownership boundaries. Measurement intervals/uncertainty can make dominance unresolved. This is a book comparison definition, not a claim that a particular benchmark publishes all three coordinates.



```figure
{
  "id": "fig-48.18",
  "kind": "calculator",
  "title": "Dominance margins",
  "caption": "Illustrative matched coordinates. A dominates B only when every margin is nonnegative and at least one positive; uncertainty can leave the comparison unresolved.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-48.10",
  "alt": "Illustrative matched coordinates. A dominates B only when every margin is nonnegative and at least one positive; uncertainty can leave the comparison unresolved.",
  "spec": {
    "tex": "\\Delta G=G_A-G_B,\\quad\\Delta L=L_B-L_A,\\quad\\Delta c=c_B-c_A",
    "equation": "48.10",
    "inputs": [
      {
        "symbol": "GA",
        "label": "A accepted tasks/s",
        "default": 10,
        "min": 0,
        "max": 100,
        "format": "fixed3"
      },
      {
        "symbol": "GB",
        "label": "B accepted tasks/s",
        "default": 8,
        "min": 0,
        "max": 100,
        "format": "fixed3"
      },
      {
        "symbol": "LA",
        "label": "A declared tail seconds",
        "default": 1,
        "min": 0,
        "max": 10,
        "format": "seconds"
      },
      {
        "symbol": "LB",
        "label": "B declared tail seconds",
        "default": 2,
        "min": 0,
        "max": 10,
        "format": "seconds"
      },
      {
        "symbol": "CA",
        "label": "A currency/accepted task",
        "default": 0.1,
        "min": 0,
        "max": 10,
        "format": "fixed3"
      },
      {
        "symbol": "CB",
        "label": "B currency/accepted task",
        "default": 0.2,
        "min": 0,
        "max": 10,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "dG",
        "label": "Goodput margin",
        "formula": "GA-GB",
        "format": "fixed3"
      },
      {
        "symbol": "dL",
        "label": "Latency margin seconds",
        "formula": "LB-LA",
        "format": "seconds"
      },
      {
        "symbol": "dc",
        "label": "Cost margin",
        "formula": "CB-CA",
        "format": "fixed3"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Start with primary protocol and disclosed artifacts, then the result row. Preserve source URL, actual access date, immutable revision where available and benchmark round. A blog announcing results can identify new workloads but does not supply the full system configuration or measurement log. Trace a numeric claim to the original row/report and its supporting protocol before using it. If that inspection was not performed, say so.

[PAPER-REPORTED] The original MLPerf Inference paper separates single-stream, server and offline load scenarios with different metrics and quality constraints [R48.8, §§3–4]. [DERIVED] This is historical methodology evidence. Its 2019 task limits are not silently promoted to current 2026 LLM rules.

[OFFICIAL-DOCUMENTATION] MLPerf Inference v6.1's September 2026 announcement introduces end-to-end RAG and edge agentic workloads and describes API-centric harness adoption [R48.11]. Individual hardware speedup claims are not reproduced here without their result rows and configuration evidence.

[DERIVED] Standardization makes a comparison more controlled within its declared division, scenario, workload and accuracy constraints. It does not make every accepted optimization equivalent for every application. Check model-equivalence/precision rules, task preprocessing, allowed caching, output constraints and availability status. A result from a large distributed system cannot be divided by accelerator count to obtain a valid single-device latency or capacity curve when scaling and communication are nonlinear.

[OFFICIAL-DOCUMENTATION] The inspected MLPerf Endpoints v1.0 surface is draft/WIP and differs from earlier Inference rounds: concurrency curves, versioned metric rules and provisioned-power normalization [R48.12–R48.13, Basics/Metrics]. Its October 12 opening does not remove every explicitly tentative section in the inspected revision.

[DERIVED] Provisioned-power-normalized throughput is not measured energy efficiency. A capacity rating or component model has units of power, but dividing throughput by it does not recover the actual integral of operating power or whole-task energy. It may be a useful common normalization under a benchmark rule. It cannot establish battery/energy savings without the corresponding measurements and ownership boundary from Chapters 45 and §48.5.

[OFFICIAL-DOCUMENTATION] The 2026 end-to-end RAG specification uses ingestion and iterative QnA pipelines over FRAMES/Wikipedia, reporting documents/s and tasks/s. Its first instance is Offline; Server is future work [R48.15, Dataset/Performance metrics]. Multiple models, retrieval and storage lie inside that task boundary.

[OFFICIAL-DOCUMENTATION] In performance mode, recorded inputs fix stage/hop counts and retrieved passages; generated outputs are discarded. Accuracy is assessed separately. TEST09 checks aggregate final-answer length, leaving intermediate-stage work unguarded by that test [R48.15, Performance metrics/Compliance]. [DERIVED] This controlled pipeline-work measurement does not establish adaptive retrieval robustness under live failures.

[MATHEMATICALLY-DERIVED] For a pipeline, adding component token rates does not produce task throughput. A task may invoke different models repeatedly, with variable hop count and non-model work. The bottleneck and critical path depend on scheduling and shared resources. An end-to-end task metric therefore preserves a useful unit that one model's token rate cannot express; exact component attribution still requires event traces.

[OFFICIAL-DOCUMENTATION] Artificial Analysis distinguishes models, endpoints and systems, and uses standardized external text-token counts for performance while native/billed tokens matter for prices [R48.16, Definitions]. [DERIVED] Equal text can then be counted consistently across models for one reporting purpose without implying equal native-token arithmetic or equal billable units.

[OFFICIAL-DOCUMENTATION] Its API performance methodology v2.2.0 (March 2, 2026) uses a 10K-input default and rolling median presentation; it discloses client location, prompt diversity and reasoning-channel timing [R48.17, Workloads/Representation/Technical Details]. Those medians do not establish a target application's P99 or provider-independent hardware limit.

[OFFICIAL-DOCUMENTATION] AA-SLT instead maintains fixed parallel requests, immediately replaces completions and uses three-minute 1K-input/1K-output phases. Its response-rate definition counts at least one output token [R48.18, Overview/Specifications/Metrics]. [DERIVED] This is a closed-loop system profile, and that response predicate is weaker than successful accepted-task completion.

[DERIVED] Do not combine API single-prompt speed, closed-loop throughput and billed prices into a synthetic production service without the missing workload/dependence relation. Prompt diversity matters when speculative execution or model stopping changes work. Provider-reported cache usage supports a provider's accounting boundary, not independent proof of internal allocator behavior. Network location can change endpoint latency without changing model execution.

[OFFICIAL-DOCUMENTATION] Epoch's model database documents inclusion rules, source fields, estimated development quantities and revisions [R48.19–R48.20, Documentation]. It is development/trend metadata, not an inference endpoint benchmark. [DERIVED] Such records can inform an explicitly qualified training-amortization scenario; they do not reveal a deployed service's utilization, current tariff or task-quality goodput.

[DERIVED] Internal measurements are necessary where the external evidence and target contract differ. Preserve workload and arrival/cache dependencies, numerical/task acceptance, generator headroom, complete failures and resource/cost boundaries from §§48.1–48.5. Replicate a relevant external configuration when feasible, then vary the deployment-specific dimensions independently. This separates protocol reproduction from application transfer rather than treating one successful rerun as both.

[DERIVED] Evidence comparison should expose uncertainty and selection. A best submitted point is selected from a tuning/search process; a rolling median aggregates dates and conditions. A benchmark's audit improves compliance but does not erase statistical uncertainty or supply omitted tails. Compare raw/disclosed distributions where available and retain protocol changes across rounds. Incomplete disclosure can make a ranking unidentified even when every published scalar is accurately copied.

[DERIVED] Resource accounting includes benchmark client, SUT, preprocessing/tools/retrieval/storage, tuning/calibration and any persistent idle/reserve resources within scope. FLOPs, physical bytes and link traffic explain transfer between configurations; endpoint-only evidence may leave these unknown. Energy requires measured/system or explicitly modelled provisioned boundaries. Monetary comparison requires dated contracts and accepted-task usage. These quantities cannot be inferred solely from a model's training compute or parameter count.



```figure
{
  "id": "fig-48.19",
  "kind": "diagram",
  "title": "Evidence-to-deployment compatibility",
  "caption": "Primary protocol and result identity must match the target units, quality, workload and resource boundary before a comparison transfers.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.10",
  "alt": "The diagram shows Primary protocol/result to Model endpoint or SUT identity; Model endpoint or SUT identity to Audit units/load/quality; Audit units/load/quality to Supported conversion?; Target deployment contract to Supported conversion?; Supported conversion? to Bounded claim; Supported conversion? to Partial or unidentified.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "s",
        "kind": "dataset",
        "label": "Primary protocol/result"
      },
      {
        "id": "m",
        "kind": "state",
        "label": "Model endpoint or SUT identity"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "Audit units/load/quality"
      },
      {
        "id": "d",
        "kind": "dataset",
        "label": "Target deployment contract"
      },
      {
        "id": "k",
        "kind": "branch",
        "label": "Supported conversion?"
      },
      {
        "id": "v",
        "kind": "metric",
        "label": "Bounded claim"
      },
      {
        "id": "u",
        "kind": "state",
        "label": "Partial or unidentified"
      }
    ],
    "edges": [
      {
        "from": "s",
        "to": "m"
      },
      {
        "from": "m",
        "to": "p"
      },
      {
        "from": "p",
        "to": "k"
      },
      {
        "from": "d",
        "to": "k"
      },
      {
        "from": "k",
        "to": "v"
      },
      {
        "from": "k",
        "to": "u"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 48.6 — Finite external-evidence compatibility audit.** [DERIVED] Inputs are finite evidence bundles $\mathcal B$, target contract $\mathcal D$, required fields and bounded follow-up/inspection budget. Output is supported comparison claims, partial evidence and rejected transfers.

$$
\begin{aligned}
1.&\quad \mathcal S\leftarrow\varnothing;\
\operatorname{FixTargetUnitsQualityLoadAndBoundary}(\mathcal D).\\
2.&\quad \text{For }b\in\mathcal B:\quad
\operatorname{InspectPrimaryProtocolRevisionAndResultLocator}.\\
3.&\quad \operatorname{MissingRequiredField}\Rightarrow
\operatorname{MarkPartial}(b);\
\operatorname{IncompatibleBoundary}\Rightarrow\operatorname{RecordRejectedTransfer};\,\operatorname{SkipClaim}.\\
4.&\quad \operatorname{DocumentValidConversionsAndUncertainty};\
\operatorname{NoIdentifiedConversion}\Rightarrow\operatorname{RetainUnknown}.\\
5.&\quad \operatorname{AllClaimRequiredFieldsComplete}\land\operatorname{CompatibleSupportedClaim}\Rightarrow
\mathcal S\leftarrow\mathcal S\cup\{(b,\text{claim/domain})\}.\\
6.&\quad \operatorname{Return}(\mathcal S,\text{partial/rejected records},
\text{internal validation still required}).
\end{aligned}
$$

[DERIVED] Each candidate claim is evaluated separately. A partial bundle may support a narrower claim only when every field required for that claim is complete and compatible; missing fields cannot fall through to support the original claim. Invariants are no discovery page substituted for originating evidence, no historical rule relabelled current, no response/token success substituted for task acceptance, and no unknown price/resource field treated as zero. Finite bundles/budget terminate the audit. Rejecting a transfer does not assert that the original result is false; it restricts the downstream claim.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** and **NVIDIA Triton Inference Server — Serving / portable runtime** supply benchmark/runtime tools used for internal validation [R48.5–R48.7]. MLPerf/Artificial Analysis/Epoch are plan-anchored external measurement/data routes, outside the numbered system stack. Their roles and revision limits are recorded separately.

[DERIVED] Store a machine-readable evidence manifest alongside raw internal outcomes and a comparison table whose columns show object, scenario, quality, token units, clocks, failure population, system/power boundary and date. This prevents later readers from treating incomparable rows as a hardware or model ranking. Source access is provenance; compatibility still requires a justified mapping.

## Experimental design

### Reported experiments

[OFFICIAL-DOCUMENTATION] The end-to-end RAG workload fixes a corpus of 2,515 Wikipedia articles and 824 queries, with an accuracy judge outside the timed answer path [R48.15, Dataset/Model selection]. Ingestion and QnA have separate throughput units. The source is a benchmark specification, not a book-executed comparison.

[NOT-DISCLOSED] No inspected common experiment measures MLPerf systems, API endpoints, model-development metadata and the target internal application under one interchangeable protocol. Their evidence classes remain separate.

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] The external sources publish scenario-specific system/endpoint protocols or development data [R48.11–R48.20].

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] Their units, load, power and acceptance definitions differ; the 2026 Endpoints source retains draft sections [R48.13].

**What we infer.** [MATHEMATICALLY-DERIVED] Equation 48.10 requires compatible coordinates. A leader on one reported metric can remain unranked for accepted-task cost and tails.

**What remains unknown.** [UNVERIFIED] Transfer to an unmeasured application, hidden provider execution and undisclosed failure/energy populations remain unidentified.



```figure
{
  "id": "fig-48.20",
  "kind": "stat-panel",
  "title": "External evidence classes",
  "caption": "These sources answer different questions and cannot supply interchangeable capacity coordinates.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.10",
  "alt": "These sources answer different questions and cannot supply interchangeable capacity coordinates.",
  "spec": {
    "header": "EXTERNAL EVIDENCE CLASSES",
    "rows": [
      {
        "key": "mlperf",
        "value": "Disclosed scenario and SUT"
      },
      {
        "key": "api",
        "value": "Provider endpoint and client path"
      },
      {
        "key": "metadata",
        "value": "Model-development estimates"
      },
      {
        "key": "internal",
        "value": "Held-out target workload/service"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Endpoint result presented as model/hardware law.** [DERIVED] *Symptom:* a published speed or cost ranking fails in a different region/workload. *Cause:* provider routing, load, token units or quality differed. *Detection:* compare complete evidence manifests. *Mitigation:* state the original domain and validate the target service.

[DERIVED] Other failures include old/current benchmark rules merged, provisioned power labelled measured joules, incomplete responses counted as task success, synthetic response-time estimates labelled observed tails, and training metadata treated as endpoint capacity. A result row without its configuration remains incomplete evidence for procurement.

## Siblings

[DERIVED] [§48.1](48-1-workload-specification.md) defines target demand; [§48.3](48-3-metrics.md) reconciles units/populations; [§48.5](48-5-economics.md) defines the decision boundary. Chapter 6 owns general evidence design. Compare external sources by what claim their protocol can support, not brand authority alone.

## Extensions

### Improvements

[DERIVED] The lineage expands single-model standardized scenarios to endpoint concurrency envelopes and multicomponent task pipelines. These make previously omitted boundaries visible, while adding disclosure, workload and normalization choices. Updated methodology can improve relevance and simultaneously break historical comparability; revision-aware reanalysis is part of the improvement.

## Limitations

[DERIVED] Endpoint internals can remain private, external traffic can drift and model-development data can be estimated/non-exhaustive. Draft rules can change after inspection. No cross-source conversion recovers unobserved quality, failure or energy behavior without assumptions.

> **Open question.** [UNVERIFIED] Which minimal disclosure and task suite make external endpoint/system results transportable to realistic agentic services? *Settling evidence:* paired public/internal protocols with raw failures, task quality, dependency/resource boundaries and held-out transfer analysis.

## Reproducibility

[DERIVED] Preserve exact URLs/revisions, actual 2026-10-14 inspection, result/configuration locators, formula/token/quality definitions and validity limits. No live price recommendation, reproduced submission or internal performance experiment is claimed. The proposed held-out capacity/cost study remains in verification.

## References

[R48.5](references.md#r48-5), [R48.6](references.md#r48-6), [R48.7](references.md#r48-7), [R48.8](references.md#r48-8), [R48.11](references.md#r48-11), [R48.12](references.md#r48-12), [R48.13](references.md#r48-13), [R48.14](references.md#r48-14), [R48.15](references.md#r48-15), [R48.16](references.md#r48-16), [R48.17](references.md#r48-17), [R48.18](references.md#r48-18), [R48.19](references.md#r48-19), [R48.20](references.md#r48-20).
