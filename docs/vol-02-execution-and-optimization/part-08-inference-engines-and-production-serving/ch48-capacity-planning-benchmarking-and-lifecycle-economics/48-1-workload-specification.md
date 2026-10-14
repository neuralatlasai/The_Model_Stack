---
id: ms.section.48.1
entity_type: section
title: "Workload specification"
volume: 2
part: 8
chapter: 48
section: 48.1
slug: 48-1-workload-specification
parent: ms.chapter.48
prev_sibling: null
next_sibling: ms.section.48.2
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

# 48.1 Workload specification

## Scope

[DERIVED] Workload specification defines the process that offers inference work to a system: arrival times, model/task identity, input/output demands, conversation dependencies and cache locality. The baseline is a single request rate plus independent mean prompt/output lengths. Success is a replayable or generative contract preserving the dependencies relevant to capacity and accepted-task service. Chapters 42–44 own phase work and scheduling; this section supplies their workload inputs.

## Why this exists

[DERIVED] Equal requests/s need not imply equal computational demand. Prompts create prefill work and retained state; output trajectories occupy repeated decode steps; shared prefixes can eliminate some prompt computation without eliminating history reads. A client issuing long reasoning requests during bursts creates a different capacity challenge from independently sampled short chats, even if their separate average lengths and daily request counts coincide.

[DERIVED] Aggregate distributions also hide who creates the work. A few clients can change their rates and thereby change the prompt/output mix. A conversation's next turn may depend on the previous response and a human/tool delay. A model fleet can contain hot endpoints and rarely invoked custom models that still require loading or residency. Removing these identities to simplify a trace can remove the mechanism responsible for cache hits, bursts or cold starts.

## Intuition

[MATHEMATICALLY-DERIVED] A request is a marked event rather than an untyped arrival. Its mark describes the amount and kind of work; the temporal sequence determines which requests compete and which prior states are reusable. Sampling marks independently preserves marginals while destroying correlations between workload size and load, between neighboring turns, and between model popularity and prefix reuse. Those changes can alter a nonlinear scheduler's response.

[DERIVED] There are two legitimate objectives: replay a historical offered workload, or model how users generate work in response to service. Replay fixes an external arrival schedule. A conversational model retains response-dependent next-turn timing. They answer different questions. Feeding recorded response delays into a different-speed system without stating the convention can accidentally make its offered load depend on the old system.

## Formulation

[MATHEMATICALLY-DERIVED] Represent offered request $i$ as

$$
w_i=(a_i,m_i,u_i,c_i,k_i,x_i,S_{p,i},S_{o,i}^{\max},h_i,\delta_i,\zeta_i),
\qquad
N_m(t)=\sum_i{\bf1}\{a_i\le t,m_i=m\},\qquad \widehat\lambda_m=\frac{N_m(t+\Delta)-N_m(t)}{\Delta},\quad\Delta>0.
$$
*(Eq. 48.1)*

Here $a_i$ is intended offer time in seconds; $m_i,u_i,c_i,k_i$ are model, client, conversation and turn identities; $x_i$ contains authorized input or a declared proxy; $S_p,S_o^{\max},h$ are input count, output cap and potential compatible-prefix count (or explicitly conditional reported-hit input) in model-native tokens; $\delta_i$ is deadline; $\zeta_i$ includes modality, stopping, quality and cache-namespace policy. Realized output length is an outcome, not interchangeable with its cap.

[MATHEMATICALLY-DERIVED] A generative contract specifies a joint law such as
$p(a_i,m_i,S_{p,i},S_{o,i},h_i\mid\mathcal H_{i-1},u_i,c_i,k_i)$, with history $\mathcal H$ and any response-dependent actions explicit. For a conversation whose next turn follows completion $d_i$ after think/tool time $Z_i\ge0$, $a_{i+1}=d_i+Z_i$ is a closed-loop dependency. An exogenous replay instead retains recorded $a_{i+1}$. Neither convention is implied by a marginal inter-arrival histogram.



```figure
{
  "id": "fig-48.3",
  "kind": "calculator",
  "title": "Windowed offered rate",
  "caption": "Illustrative event count and window; this does not identify burst duration, dependence, token work or cache locality.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-48.1",
  "alt": "Illustrative event count and window; this does not identify burst duration, dependence, token work or cache locality.",
  "spec": {
    "tex": "\\widehat\\lambda=N_{\\rm window}/\\Delta",
    "equation": "48.1",
    "inputs": [
      {
        "symbol": "N",
        "label": "Offered events in window",
        "default": 300,
        "min": 0,
        "max": 100000,
        "format": "integer"
      },
      {
        "symbol": "dt",
        "label": "Window seconds",
        "default": 60,
        "min": 0.1,
        "max": 3600,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "rate",
        "label": "Offered requests/second",
        "formula": "N/dt",
        "format": "fixed3"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Begin by defining the evaluation unit and admission boundary. An offered user task can create several model requests, retries and tool calls. Record their parent task and attempt identities so a failed attempt remains visible without inflating successful task count. Distinguish client-intended arrival, actual transmission, server receipt/admission and execution start. A trace exposing only execution start cannot reconstruct upstream offered demand or omitted queueing without additional assumptions.

[MATHEMATICALLY-DERIVED] For a time window of width $\Delta$, estimate offered rate from $[N(t+\Delta)-N(t)]/\Delta$. Retain count variance and serial dependence across windows rather than reporting only a global average. Under a conditionally Poisson count with random integrated intensity $\Lambda$, total variance gives
$\operatorname{Var}(N)=\mathbb E[\Lambda]+\operatorname{Var}(\Lambda)$.
Thus rate variation alone can produce overdispersion. This identity is a stated model example; it neither proves that a production trace is mixed Poisson nor makes a coefficient of variation a complete burstiness model.

[DERIVED] Describe burst duration and inter-burst spacing alongside rate. Short spikes may fit a finite admission buffer while a sustained increase exceeds service. Two traces with equal count variance can differ in autocorrelation and produce different queue tails. Preserve cross-model correlation too: simultaneous demand spikes cannot be diversified as independent loads, while complementary time-of-day usage may create real multiplexing opportunities.

[MATHEMATICALLY-DERIVED] Prompt/output dependence matters when resource cost is nonlinear. For a simplified cost term $cS_pS_o$, expected work is
$c[\mathbb E S_p\,\mathbb E S_o+\operatorname{Cov}(S_p,S_o)]$.
Independent marginal sampling deletes the covariance term. Actual attention/allocation costs also contain nonlinear context, batch and cache effects from Chapter 42. Matching mean lengths alone does not preserve those costs, even when the simplified cross term is small.

[PAPER-REPORTED] ServeGen constructs workloads per client, combining timestamp/data sampling and conversation-aware mocking; it releases sanitized/parameterized information rather than full private samples [R48.1, §6.1]. Its prefix-cache characterization is explicitly limited [§7].

[DERIVED] A per-client mixture is a useful book model: choose client $u$ with time-varying weight proportional to its rate, then draw the request mark conditionally on that client and state. This separates changes in client composition from changes within a client. It still requires validation: stable historical client statistics can drift, and a model change can alter stopping behavior or prompt formatting. A generated trace is a hypothesis about the workload, not a verified substitute merely because its aggregate histogram looks plausible.

[MATHEMATICALLY-DERIVED] Parametric fits require precise interpretation. An exact exponential survival function satisfies $\Pr(S>s+t\mid S>s)=\Pr(S>t)$; an approximate finite-range histogram fit does not establish this conditional equality. Mixtures of exponential regimes generally lose memorylessness. Likewise, a log-normal density has a quadratic term in $\log s$ in its log-density, unlike the linear log-log asymptote of a power law. A heavy tail and a power law are different hypotheses.

[PAPER-REPORTED] ServeGen describes exponential output fits and groups log-normal/Pareto fits together in its discussion [R48.1, §3.2].

[MATHEMATICALLY-DERIVED] The preceding distinctions restrict the mathematical conclusions those descriptions can support. Check conditional residual-length behavior, censoring and regime mixtures before assigning a memoryless service model; fitting marginal output counts alone does not prove Poisson arrivals or independent service times.

[DERIVED] Cache workload needs prefix identities/content equivalence, temporal locality and routing namespace, not just an average hit rate. A historical hit records the old allocator, capacity and routing policy. Replaying it as an intrinsic request attribute can award a new system impossible hits. Preserve inputs or authorized identity-equivalent surrogates and recompute hits under the tested policy. If content is unavailable, report a conditional hit-driven simulation, rather than claiming content-faithful cache validation.

[DERIVED] For conversations, preserve role/template expansion, prior outputs and truncation. Mocked content with correct lengths can still change speculative acceptance, tokenizer behavior or cache sharing. Replacing real outputs with fixed synthetic tokens removes semantic stopping and can alter later turns. Controlled shape-only workloads remain useful for phase models; accepted-task and cache-content claims require the corresponding real or validated surrogate data.

[DERIVED] Model mix includes architecture, numerical path, adapter and routing identity. Parameter count alone does not determine state traffic or backend support. Multimodal work adds preprocessing, encoder calls and nontext payload transfer. Reasoning channels may consume compute and billable tokens without all being visible; undisclosed internal counts remain unknown. Record whether lengths are provider-reported native tokens, an external tokenizer's text count or configured caps.

[PAPER-REPORTED] The 2026 longitudinal study analyzes a one-year request trace with model/user/instance identities and cached-token signals, reporting changing token/model mix and locality [R48.2, §§3–6/Tables 2–3]. Its full trace release remains promised in the inspected version [Introduction footnote 1].

[DERIVED] Resource accounting includes trace construction/storage, tokenization and privacy-preserving transformations, plus the actual inference FLOPs, physical state, traffic and communication implied by the preserved marks. A generator with $n$ events can store $O(n)$ records and sort by intended time in $O(n\log n)$ comparison work; ordered client streams can instead be merged with a heap. These are algorithm choices, not measured overheads. Energy/money include generation and any retained trace storage when that boundary is relevant; production serving cost is developed in §48.5.



```figure
{
  "id": "fig-48.4",
  "kind": "diagram",
  "title": "Marked workload and session dependencies",
  "caption": "Client/model identity and request marks jointly determine offered work and compatible reuse; conversations can depend on prior completion.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.1",
  "alt": "The diagram shows Client/model mix to Arrival/session generator; Client/model mix to Prompt/output/cache marks; Arrival/session generator to Offered event stream; Prompt/output/cache marks to Offered event stream; Offered event stream to Service response; Service response to Think/tool delay; Think/tool delay to Arrival/session generator.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "c",
        "kind": "dataset",
        "label": "Client/model mix"
      },
      {
        "id": "a",
        "kind": "process",
        "label": "Arrival/session generator"
      },
      {
        "id": "m",
        "kind": "state",
        "label": "Prompt/output/cache marks"
      },
      {
        "id": "w",
        "kind": "flow",
        "label": "Offered event stream"
      },
      {
        "id": "r",
        "kind": "process",
        "label": "Service response"
      },
      {
        "id": "z",
        "kind": "state",
        "label": "Think/tool delay"
      }
    ],
    "edges": [
      {
        "from": "c",
        "to": "a"
      },
      {
        "from": "c",
        "to": "m"
      },
      {
        "from": "a",
        "to": "w"
      },
      {
        "from": "m",
        "to": "w"
      },
      {
        "from": "w",
        "to": "r"
      },
      {
        "from": "r",
        "to": "z"
      },
      {
        "from": "z",
        "to": "a"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 48.1 — Bounded workload-manifest construction.** [DERIVED] Inputs are finite authorized event/session records, schema/tokenizer identities, a declared replay/generation mode, maximum event count $n_{\max}$ and finite time/context/output limits. Output is a validated workload manifest or explicit rejection.

$$
\begin{aligned}
1.&\quad \mathcal W\leftarrow\varnothing;\quad
\operatorname{ValidateAuthorizationSchemaAndTokenUnits}.\\
2.&\quad \text{For each record }i:\quad
\operatorname{MissingBoundaryOrIdentity}\Rightarrow\operatorname{MarkUnknown};\\
 &\quad \text{Invalid required schema/identity}\Rightarrow\operatorname{RecordRejectAndSkip}(i).\\
3.&\quad \operatorname{EncodeAndTemplate}(x_i)\Rightarrow S_{p,i};\
\operatorname{CapViolation}\Rightarrow\operatorname{RecordRejectAndSkip}(i).\\
4.&\quad \operatorname{ResolveConversationParentsAndArrivalConvention};\
\operatorname{CycleOrMissingDependency}\Rightarrow\operatorname{RecordInvalidSessionAndSkip}(i).\\
5.&\quad \operatorname{RecordCacheNamespaceAndContentAvailability};\
|\mathcal W|<n_{\max}\Rightarrow\mathcal W\leftarrow\mathcal W\cup\{w_i\}.\\
6.&\quad \operatorname{OrderByIntendedTime};\
\operatorname{EmitJointTemporalSummariesAndImmutableManifest};\
\operatorname{Return}(\mathcal W,\text{gaps/rejections}).
\end{aligned}
$$

[DERIVED] Invariants are no unauthorized payload disclosure, no execution-start timestamp silently relabelled offered arrival, preserved task/attempt ancestry and explicit realized-length versus cap distinction. A maximum count and horizon terminate generation; malformed records do not become fabricated complete events. Storage is bounded by the retained event/payload budget. The manifest must record which dependencies were deliberately removed for a controlled microbenchmark.

## Implementation

[OFFICIAL-DOCUMENTATION] **vLLM — Inference engine** documents benchmark dataset, request-rate/concurrency and output-length controls [R48.6, dataset/load arguments]. **NVIDIA Triton Inference Server — Serving / portable runtime** routes to GenAI-Perf's file/synthetic input and load settings [R48.5, Model Inputs]. These interfaces provide workload controls, not evidence that an arbitrary synthetic configuration matches production.

[DERIVED] Retain the actual generated request schedule and content/token identity before interpreting results. Tools that resample a small dataset can create unintended repeated prefixes. A shared seed does not repair incompatible tokenizer/templates or hidden backend output behavior. Verify the generated manifest against the intended joint and temporal contract; changes to the generator are experimental changes with their own revision.

## Experimental design

### Reported experiments

[PAPER-REPORTED] ServeGen's provisioning case uses a 10-minute/30,000-request target and Qwen2.5-14B on two A100-80GB GPUs per instance, with pipeline parallelism. It compares client-based and aggregate generation, then replays the actual workload under P99 TTFT/TBT targets [R48.1, §6.3/Fig. 20]. The smaller model substitutes for the production model.

## Observations

**What the paper claims.** [PAPER-REPORTED] ServeGen reports more representative provisioning from client-based generation [R48.1, §6.3].

**What the evidence shows.** [PAPER-REPORTED] Its selected replay supports that case, while sanitized data, model substitution and absent cache characterization limit transfer [R48.1, §§6–7].

**What we infer.** [MATHEMATICALLY-DERIVED] Joint/temporal structure can change expected nonlinear work and queueing even with matching marginals. Empirical fitting does not establish stronger stochastic identities.

**What remains unknown.** [UNVERIFIED] Faithful content-level cache replay, hidden internal-token accounting and generalization to a different client/model regime remain unvalidated here.



```figure
{
  "id": "fig-48.5",
  "kind": "stat-panel",
  "title": "Workload fidelity",
  "caption": "Matching separate averages does not preserve the joint temporal process.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-48.1",
  "alt": "Matching separate averages does not preserve the joint temporal process.",
  "spec": {
    "header": "WORKLOAD FIDELITY",
    "rows": [
      {
        "key": "arrival",
        "value": "Intended versus execution start"
      },
      {
        "key": "marks",
        "value": "Model, lengths and acceptance"
      },
      {
        "key": "sessions",
        "value": "Parent/turn and response delay"
      },
      {
        "key": "cache",
        "value": "Compatible identity and policy"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Marginals mistaken for workload equivalence.** [DERIVED] *Symptom:* a synthetic benchmark provisions less capacity than held-out traffic needs. *Cause:* correlations, bursts, cache identity or session dependencies were removed. *Detection:* compare conditional/temporal summaries and held-out service behavior. *Mitigation:* preserve the relevant joint process and label deliberate simplifications.

[DERIVED] Other failures include capped outputs mistaken for natural lengths, discarded failed attempts, future conversation data leaking into calibration, and historical cache hits reused under a different capacity/routing policy. A privacy transformation that destroys locality can be appropriate for release but changes which systems questions the artifact can settle.

## Siblings

[DERIVED] [§48.2](48-2-load-test-methodology.md) decides how this demand is offered; [§48.3](48-3-metrics.md) counts its outcomes. Chapter 42 maps request shapes to work/state; Chapters 44–46 own scheduling/admission. Compare workload generators at fixed information/privacy boundaries and held-out application behavior.

## Extensions

### Improvements

[DERIVED] The lineage extends aggregate rate/length workloads to client-conditioned composition and longitudinal model/user/cache traces [R48.1–R48.3]. These improve observable structure, while release restrictions and changing production regimes limit what can be reproduced. A longer trace expands temporal coverage; it does not make every future workload stationary or representative.

## Limitations

[DERIVED] No finite trace covers all future clients, model changes or failures. Timestamp semantics and missing payloads can prevent exact replay. A statistical generator can match selected summaries while missing a dependency that materially changes service.

> **Open question.** [UNVERIFIED] Which minimum privacy-preserving workload representation preserves capacity, cache locality and accepted-task tails across schedulers? *Settling evidence:* held-out content-authorized replays and generators with ablated dependencies, not only histogram similarity.

## Reproducibility

[DERIVED] Publish schema, intended/actual timestamp definitions, identity/privacy transformations, tokenizer/template, sampling/rescaling procedure, seeds, limits and rejected records. R48.1/R48.2 are versioned full texts; their artifact availability and disclosure limits remain explicit. No workload generator or serving run was executed here.

## References

[R48.1](references.md#r48-1), [R48.2](references.md#r48-2), [R48.3](references.md#r48-3), [R48.5](references.md#r48-5), [R48.6](references.md#r48-6).
