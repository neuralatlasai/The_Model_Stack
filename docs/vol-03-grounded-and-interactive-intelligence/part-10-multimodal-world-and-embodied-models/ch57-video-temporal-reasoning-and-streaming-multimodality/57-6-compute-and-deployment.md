---
id: ms.section.57.6
entity_type: section
title: "Compute and deployment"
volume: 3
part: 10
chapter: 57
section: 57.6
slug: 57-6-compute-and-deployment
parent: ms.chapter.57
prev_sibling: ms.section.57.5
next_sibling: ms.verification.57
children: []
prerequisites: [ms.chapter.15, ms.chapter.18, ms.chapter.55, ms.chapter.56]
downstream: [ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.63]
related: [ms.chapter.42, ms.chapter.48, ms.chapter.53]
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [temporal_representation, streaming_state, evidence_grounding], feedback_setting: [], modality: [video, audio, text]}
papers: []
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.vllm]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 57.6 Compute and deployment

## Scope

[DERIVED] The required result is an end-to-end media service that meets declared grounding and real-time deadlines within complete compute, memory, transfer, energy and monetary budgets. The baseline compares model output-token throughput. This section owns media-token rates, batching, encoder/cache reuse, recurrent state, network transfer and deadline feasibility. Hardware and kernel mechanisms remain in Chapters 25–28; resource accounting and queueing remain in Chapters 42/48.

## Why this exists

[DERIVED] A second of media is not a fixed inference request. Resolution, frame rate, temporal merging, audio representation and sampling policy determine the token arrival process. Encoder work can be paid continuously before any question arrives. A system can reduce query-to-answer latency by moving that work earlier while increasing total cost per hour of observation.

[DERIVED] Compression also occurs at different execution boundaries. Removing tokens before an encoder can save encoder and decoder work; pruning after encoding leaves earlier work intact. A smaller decoder context therefore cannot establish an equal proportional reduction in total FLOPs, memory traffic or latency. Identify the removed operations and the new selection cost.

## Intuition

[MATHEMATICALLY-DERIVED] If sustained admitted work exceeds achieved service capacity, backlog grows even when each individual model invocation fits in memory. Conversely, average utilization below one does not ensure a deadline under bursts. Media ingestion needs both an admission rule and a complete latency boundary.

[DERIVED] Cache reuse saves work only when the cached object has the same dependencies. A frame embedding can be independent of earlier frames under one encoder, whereas a higher-layer decoder key/value generally depends on its prefix. Equal image bytes alone do not establish equal decoder state.

## Formulation

[DERIVED] Let $f_v$ be selected frames/second, $k_t\ge1$ frames/tubelet, $p_v$ post-adapter tokens/tubelet before pruning, $q_v\in[0,1)$ the discarded fraction, $r_a$ audio tokens/second and $r_c$ other contextual tokens/second. An interior steady-rate approximation is

$$
r_{\mathrm{tok}}\approx
\frac{f_v}{k_t}p_v(1-q_v)+r_a+r_c.
$$
*(Eq. 57.25)*

[DERIVED] Rounding, pinned initial frames, special tokens and dynamic resolution create boundary terms. Measure actual processed token counts. The approximation does not describe raw camera bandwidth, which depends on encoded bytes, nor the decode workspace after decompression.

```figure
id: fig-57.18
kind: calculator
title: Admitted multimodal tokens per media second
caption: An illustrative interior-rate approximation from Eq. 57.25. It excludes rounding, initial pinned tokens and variable-resolution effects; actual processor counts control admission.
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-57.25
alt: Video token rate is frame rate times tokens per tubelet times retained fraction divided by frames per tubelet. Audio and other context rates are added separately.
spec:
  tex: r_{\mathrm{tok}}\approx f_vp_v(1-q_v)/k_t+r_a+r_c
  equation: "57.25"
  inputs:
    - {symbol: fps, label: "selected frames per second", default: 2, min: 0.1, max: 60, format: fixed2}
    - {symbol: patches, label: "tokens per tubelet before pruning", default: 256, min: 16, max: 2048, format: integer}
    - {symbol: tube, label: "frames per tubelet", default: 2, min: 1, max: 8, format: integer}
    - {symbol: drop, label: "discarded video fraction", default: 0.5, min: 0, max: 0.95, format: percent}
    - {symbol: audio, label: "audio tokens per second", default: 12.5, min: 0, max: 1000, format: fixed2}
    - {symbol: other, label: "other context tokens per second", default: 2, min: 0, max: 2000, format: fixed2}
  outputs:
    - {symbol: vrate, label: "video tokens per second", formula: fps*patches*(1-drop)/tube, format: fixed2}
    - {symbol: total, label: "total admitted tokens per second", formula: vrate+audio+other, format: fixed2}
```

[DERIVED] Let stage $j$ consume average $w_j$ FLOPs per admitted token at achieved service rate $\Pi_j$ FLOPs/second, with other utilization $u_j^{\mathrm{other}}$. A strict average headroom condition is

$$
\varrho_j=
\frac{r_{\mathrm{tok}}w_j}{\Pi_j}
+u_j^{\mathrm{other}}<1.
$$
*(Eq. 57.26)*

[DERIVED] Offered mean work exceeding service capacity cannot remain stable indefinitely under this model. Strict utilization below one leaves average headroom, but is not universally necessary: perfectly periodic arrivals and equal deterministic service can operate at utilization one without growing a queue. Stochastic stability needs explicit arrival/service assumptions. Use achieved rates for the actual batch, precision and memory behavior, rather than advertised peak throughput. A FIFO single-server approximation has the waiting-time recursion developed in Chapter 48; GPU overlap and batching require an appropriate service model. The inequality is not a tail-latency guarantee.

[MATHEMATICALLY-DERIVED] For $L_{\mathrm{att}}$ attention layers, shared symbols $B,S,H_{kv},d_h$, and KV precision $b_{\mathrm{KV}}$ bytes/value, a component budget is

$$
M_{\mathrm{live}}=
M_{\mathrm{params}}+
2L_{\mathrm{att}}BSH_{kv}d_hb_{\mathrm{KV}}
+M_{\mathrm{recurrent}}+
M_{\mathrm{vision}}+M_{\mathrm{workspace}}+
M_{\mathrm{buffers}}+M_{\mathrm{aux}}.
$$
*(Eq. 57.27)*

[DERIVED] This instantiates Chapter 42's KV accounting for the attention subset of a hybrid model. Recurrent state needs its own source-documented dimensions and precision; total model weights use total parameters, not activated MoE parameters. Temporary batch packing, latent-search candidates and host/device copies belong in the appropriate terms. Do not count a compressed context as the entire live footprint.

## Mechanism

### Methodology

[DERIVED] Decompose capture/network receive, media decode, preprocessing, encoder, adapter, state update, trigger, decoder prefill/generation, checking and delivery. Record the dependency graph and which operations run before a question. For each stage identify input/output bytes, tensor shape, precision, reuse scope and measured service boundary. Admission must reserve checker/output work and handle overload explicitly.

[PAPER-REPORTED] The April Nemotron3 Nano Omni report combines two-frame Conv3D tubelets before the vision Transformer with runtime EVS pruning after the vision adapter. The first tubelet is retained as an anchor. Pruning therefore has a different upstream cost boundary from tubelet formation [R57.9, §§2,4.6]. This 2026 integration is the current evidence; the older EVS component is not presented as a new 2026 invention.

[DERIVED] Batching frames or streams can improve accelerator occupancy while increasing waiting time and padding. Different temporal positions or causal prefixes cannot be pooled indiscriminately. Charge batch formation delay and retained decoder state; batch throughput at saturated load does not establish an interactive deadline for a sparsely arriving stream.

[DERIVED] Encoder reuse requires immutable input and preprocessing identity. Decoder reuse additionally requires the relevant context, model, precision, positions and state dependencies:

$$
\operatorname{Reuse}(c_v)=1
\ \Longrightarrow\
\operatorname{InputAndProcessorMatch}
\land\operatorname{ModelStateMatch}
\land\operatorname{ContextAndPositionDependenciesMatch}.
$$
*(Eq. 57.28)*

[DERIVED] A valid cache key is a consequence of the dependency graph. Keying a context-dependent KV entry only by frame checksum can silently reuse a state formed under a different prefix. Changing a processor's crop or temporal merge can invalidate supposedly identical visual observations.

[PAPER-REPORTED] DSCache constructs recent instant KV separately from cumulative past KV and stores keys before positional transforms. Its exact RoPE proposition requires preservation of relative positions; the paper explicitly excludes practical nonuniform re-indexing from that guarantee [R57.10, §§4.1–4.3, Proposition4.2].

[MATHEMATICALLY-DERIVED] With rotary matrices $R(p)$, the identity
$R(p)^\top R(q)=R(q-p)$ explains common-shift invariance. If eviction/recombination changes some relative distances, that proof no longer applies. Further, positional reassignment alone does not undo the contextual information already embedded in higher-layer keys. Separate exact positional identities from an empirically useful approximate cache construction.

[DERIVED] Recurrent state can bound a model's explicit historical state while still losing task distinctions or requiring substantial continuous update work. An archive preserves additional evidence only by consuming storage and future fetch/decode time. Keep these resource dimensions separate when comparing recurrent, KV-based and external-memory systems.

[MATHEMATICALLY-DERIVED] A tubelet requiring $k_t$ uniformly spaced frames cannot be completed before its last frame arrives. Relative to its first frame, the acquisition wait is at least

$$
d_{\mathrm{tubelet}}\ge (k_t-1)/f_v.
$$
*(Eq. 57.29)*

[DERIVED] This bound assumes the encoder requires the complete tubelet. It is a structural observation delay, not a measured implementation latency. For two-frame tubelets at low frame rates, the added wait can be material even when per-tubelet throughput improves. A causal service must timestamp the completed observation accordingly.

[DERIVED] Network transfer and CPU decode can become bottlenecks before GPU inference. Keep encoded-media bit rate, decoded pixels/second, host memory bandwidth and host/device transfer separately measured. Frame dropping after upload saves different bytes than dropping before transmission. Encoder reuse on a server does not save client capture or network cost unless that path also changes.

[DERIVED] **Cost.** Complete work includes rejected frames, preprocessing, continuous memory construction, all trigger checks, query-triggered calls and response verification. For a finite measurement interval with $n_{\mathrm{accepted}}>0$ accepted task outcomes,

$$
E_{\mathrm{accepted}}=
\frac{E_{\mathrm{capture}}+E_{\mathrm{network}}+
E_{\mathrm{encode}}+E_{\mathrm{state}}+
E_{\mathrm{decode}}+E_{\mathrm{check}}}
{n_{\mathrm{accepted}}}.
$$
*(Eq. 57.30)*

[DERIVED] Apply the same boundary to monetary cost, documenting idle allocation and amortization. If no outcome is accepted, this ratio is undefined rather than zero. Query latency, media-hour cost and cost per accepted event answer different engineering questions.

```figure
id: fig-57.19
kind: systems-trace
title: Complete media-to-answer resource boundary
caption: Count continuous work before the query and query-triggered work separately, then combine them for complete cost. Concurrent stages remain a dependency graph rather than a sum of overlapping times.
evidence: DERIVED
source: DERIVED:eq-57.30
alt: The trace identifies receive/decode, encode/adapt, state/trigger and answer/check stages with their memory, compute, communication and failure boundaries.
spec:
  columns: [latency, memory, compute, communication, failure]
  stages:
    - {name: receive and decode, values: {latency: packet and decode age, memory: encoded and decoded buffers, compute: codec and resize work, communication: media bytes, failure: missing or late records}}
    - {name: encode and adapt, values: {latency: tubelet acquisition and encoder, memory: activations and feature cache, compute: selected and rejected observations, communication: host to device, failure: preprocessing mismatch}}
    - {name: state and trigger, values: {latency: update queue and prefill, memory: KV and recurrent state, compute: every silent tick, communication: archive fetch if needed, failure: evicted evidence}}
    - {name: answer and check, values: {latency: generation and final verification, memory: output and checker workspace, compute: accepted and failed attempts, communication: answer delivery, failure: deadline or grounding failure}}
```

## Algorithm

> **Algorithm 57.6 — Resource-admitted media inference.** [DERIVED] Inputs are a finite observation/update batch, source and model signatures, byte/token budgets, measured service profiles, deadline and a declared degradation policy. Output is a checked answer or an explicit rejected/degraded/incomplete result with complete cost records.

$$
\begin{aligned}
1.&\quad \operatorname{MeasureActualTokensBytesAndAvailability};
\quad\operatorname{ValidateSourceAndModelEpoch}.\\
2.&\quad \operatorname{ReserveCheckAndOutputBudgets};
\quad\operatorname{Infeasible}\Rightarrow\operatorname{RejectOrDeclaredDegrade}.\\
3.&\quad \operatorname{ForEachCacheCandidate}:
\ \operatorname{ReuseOnlyIfDependenciesMatch};
\quad\operatorname{OtherwiseRecomputeOrReject}.\\
4.&\quad \operatorname{AdmitBatchOnlyWithinMemoryAndDeadline};
\quad\operatorname{RecordQueueAndPrequeryWork}.\\
5.&\quad \operatorname{RunBoundedEncodeStateTriggerDecodeAndCheck};
\quad\operatorname{CapReached}\Rightarrow\mathrm{incomplete}.\\
6.&\quad\operatorname{Return}(\mathrm{outcome},
\mathrm{actual\ resource\ ledger},\mathrm{degradation\ record}).
\end{aligned}
$$

[DERIVED] The finite update/call/output caps establish per-request termination. Invariants include checked cache dependencies, separate total/activated parameter accounting and no free background work. Degradation can reduce resolution, rate or horizon only if the resulting task remains inside the declared acceptance contract; otherwise reject the task.

## Implementation

[OFFICIAL-DOCUMENTATION] The pinned model card for Nemotron3 Nano Omni declares video input limits and supported serving runtimes [R57.12, Input(s); Software Integration]. The release-specific list does not prove equivalence among vLLM (#41, LLM inference engine), model-definition code in Hugging Face Transformers (#26), and PyTorch (#17). Preserve exact processor, checkpoint, cache and runtime settings before attempting a compatibility claim.

[DERIVED] Exported state must identify preprocessing/model/position conventions, not only tensor shapes. A restart with incompatible recurrent or KV state should reject restoration. Resource telemetry should connect each frame/query to its originating stream and include asynchronous worker work; a fast frontend can conceal an overloaded memory writer.

## Experimental design

### Reported experiments

[PAPER-REPORTED] DSCache evaluates LLaVA-OV7B and Qwen2.5-VL7B with a 32-frame window: four recent feature frames and 28 cumulative frames. OVO-Bench overall accuracy changes 55.6→57.5 and 52.2→55.4 versus uniform cache; the paper notes long-range subtask trade-offs [R57.10, §5, Table 2]. Those are accuracy comparisons, not general cache equivalence.

[PAPER-REPORTED] Nemotron Table 12 reports BF16 TTFT7969 ms without either compression mechanism and 5313 ms with Conv3D+EVS at pruning 0.5 [R57.9, §4.6]. The complete local disclosure boundary is:

| Field | Reported context for this comparison |
|---|---|
| Hardware | NOT-DISCLOSED explicitly beside Table 12; §4.8 separately describes a single-B200 suite |
| Model | Nemotron3 Nano Omni |
| Precision | BF16 checkpoint; detailed KV/state setting not separately bound to this table |
| Media/input distribution | Synthetic 512-frame,512×512,30-FPS video |
| Sequence length | Approximately 141k input tokens without either mechanism; approximately 42k with both |
| Concurrency |1 |
| Runtime/version | aiperf, five runs; exact serving commit for Table 12 NOT-DISCLOSED locally |
| Boundary | Mean time to first token, not complete video-to-final-answer latency |

[DERIVED] Table 13's BF16 TTFT increases 5124→5182 ms from pruning 0.7→0.8 despite adjacent prose describing monotonic improvement. Preserve the tabulated counterexample; absent run-level variation prevents assigning its cause. More pruning also degrades long-video accuracy, so throughput alone cannot choose the retention rate.

[PAPER-REPORTED] StreamMind's same-backbone StreamArena comparison reports pooled accuracy 48.6 versus54.2 for offline Qwen3.5-397B-A17B and weighted query-to-answer latency27.5 versus81.4 seconds. Continuous pre-query memory construction is outside that response interval [R57.5, §3.3, Table 4].

[DERIVED] That trade-off moves work off the query-critical path; it does not show less total work. The appendix's Ubuntu22.04.4 label and el8-tagged kernel string also require clarification before reproducing its environment. Its software list is a reported setup, not independently verified compatibility.

## Observations

**What the papers claim.** [PAPER-REPORTED] Compression, separate cache construction and persistent state reuse improve selected resource/accuracy trade-offs in their reported settings [R57.5, §3; R57.9, §4.6; R57.10, §5].

**What the evidence shows.** [DERIVED] Acquisition, encoder, cache and query-latency boundaries differ. Source regressions and incomplete configuration bindings remain material.

**What we infer.** [DERIVED] Choose the cheapest complete pipeline meeting the same temporal-grounding and deadline rule. Prefer reuse only when dependency validity is established; prefer compression only while the task-specific loss remains acceptable.

**What remains unknown.** [UNVERIFIED] Local p99 delay, full energy/money cost, code-path compatibility and a resolved environment for the source discrepancies remain unchecked.

## Failure modes

> **Failure mode — Cache identity without context identity.** [DERIVED] *Symptom:* reused KV produces different answers after a prefix change. *Cause:* frame hash is treated as the complete dependency signature. *Detection:* compare fresh and reused execution at the same prefix. *Mitigation:* include contextual dependencies or recompute.

> **Failure mode — Background cost omission.** [DERIVED] *Symptom:* query latency improves while an ingestion queue grows or media-hour cost rises. *Cause:* continuous work is excluded from the metric. *Detection:* trace all workers over the complete interval. *Mitigation:* cap and charge ingestion/state work, then repeat the joint acceptance check.

## Siblings

[DERIVED] Encoder reuse, temporal token reduction, decoder KV reuse, recurrent memory and external archives optimize different operations and storage terms. Batching changes service utilization and waiting. Compare them at the complete task boundary instead of ranking them by output-token throughput.

## Extensions

[DERIVED] A dated integration can add evidence for a new architecture/retention combination without making an older component a new method. Reopen a preference when a source-level timing discrepancy is resolved, a cache-equivalence premise fails, a new GPU changes achieved service rates or a stricter event deadline exposes tubelet acquisition delay.

```figure
id: fig-57.20
kind: diagram
title: Cache reuse is conditional on dependencies
caption: A matching frame identity is only the first gate. Context-dependent state also needs matching processor, model, positions and prefix dependencies.
evidence: DERIVED
source: DERIVED:eq-57.28
alt: A cache candidate passes source/processor and context/model/position checks before reuse. Either failed check leads to recompute or explicit rejection.
spec:
  direction: LR
  nodes:
    - {id: candidate, kind: memory, label: Cached feature or KV candidate}
    - {id: source, kind: branch, label: Source and processor match}
    - {id: context, kind: branch, label: Model and contextual dependencies match}
    - {id: reuse, kind: process, label: Reuse under declared semantics}
    - {id: fresh, kind: process, label: Recompute within budget}
    - {id: reject, kind: state, label: Reject if recomputation infeasible}
  edges:
    - {from: candidate, to: source}
    - {from: source, to: context, label: match}
    - {from: source, to: fresh, label: mismatch}
    - {from: context, to: reuse, label: match}
    - {from: context, to: fresh, label: mismatch}
    - {from: fresh, to: reject, label: budget or deadline fails}
```

## Limitations

[DERIVED] The analysis establishes necessary accounting and dependency conditions. It does not certify a hardware deadline or a named engine's performance. Unknown task-loss transfer, unmeasured tail service times or incompatible state semantics prevent deployment preference. The stopping conclusion remains conditional until the complete workload is executed.

## Reproducibility

[DERIVED] Retain dated source revisions, model/processor hashes, shapes and precisions, actual media/token rates, cache signatures, batch policy, worker traces, queue delays, peak component bytes, offered/accepted outcomes and energy/money boundaries. [References](references.md) records unresolved source discrepancies. No GPU serving or media pipeline experiment was executed for the book.

## References

[DERIVED] [R57.5](references.md#r57-5), [R57.9](references.md#r57-9), [R57.10](references.md#r57-10), [R57.12](references.md#r57-12); primary inspection2026-10-25.
