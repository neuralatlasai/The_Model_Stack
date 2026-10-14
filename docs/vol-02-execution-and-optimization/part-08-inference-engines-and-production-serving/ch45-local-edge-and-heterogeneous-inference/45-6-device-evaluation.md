---
id: ms.section.45.6
entity_type: section
title: "Device evaluation"
volume: 2
part: 8
chapter: 45
section: 45.6
slug: 45-6-device-evaluation
parent: ms.chapter.45
prev_sibling: ms.section.45.5
next_sibling: ms.verification.45
children: []
prerequisites: [ms.chapter.25, ms.chapter.37, ms.chapter.40, ms.chapter.41, ms.chapter.42, ms.chapter.43]
downstream: [ms.chapter.46, ms.chapter.47, ms.chapter.48]
related: []
siblings_by_mechanism: []
relations: []
axes: {lifecycle: [inference, serving, evaluation], mechanism: [heterogeneous_execution, resource_accounting], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.llama-cpp, impl.apple-mlx-mlx-lm, impl.onnx-runtime, impl.openvino]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 45.6 Device evaluation

## Scope

[DERIVED] Device evaluation determines whether an entire local inference application delivers accepted tasks within sustained latency, memory, energy, thermal, context and privacy requirements. The baseline is a warm short token-generation microbenchmark. Success is a reproducible deployment profile connecting task quality to complete device behavior. Proposed experiments appear only in [verification](verification.md); protocols described here are source-reported methods and analytical measurement requirements.

## Why this exists

[DERIVED] A tokens/s value leaves the initialization boundary, context length, output stopping, numerical quality and duration unspecified. A model that stops early can appear faster or cheaper while failing the task. A warm cache conceals storage latency. A cooled phone exploits temporary thermal headroom. A local application can still transmit prompts through logging or a remote tool. These are different failure dimensions, and no scalar establishes all of them.

[DERIVED] Evaluation must preserve the deployment objective. An interactive assistant needs responsiveness and accepted output at a declared concurrency; an unattended edge monitor may optimize sustained completion under fixed power. Comparing the former's closed-loop conversation trace with the latter's saturated stream changes arrival process, context history and idle opportunities. Retain those workload semantics before interpreting a device ranking.

## Intuition

[MATHEMATICALLY-DERIVED] Energy integrates power over a declared boundary. Efficiency is a ratio whose denominator must represent useful service. Temperature depends on past power and cooling; latency depends on current state and workload. A complete test needs synchronized trajectories and repeated initial conditions, not only independent averages. Correlation between rising temperature and falling throughput is suggestive but does not identify the firmware mechanism.

[DERIVED] Coldness is multidimensional: process absent, model not loaded, page cache empty, kernels uncompiled, prompt prefix absent and package cool are distinct states. A process restart can leave page cache and compiled kernels warm. A cooled device can retain every model page. Describe a state vector rather than claiming that a single "cold run" resets everything.

## Formulation

[MATHEMATICALLY-DERIVED] For samples at times $t_i$ with measured whole-device powers $P_i$, a trapezoidal energy estimate and accepted-task efficiency are

$$
\widehat E_{\rm device}
=\sum_{i=0}^{n-1}\frac{P_i+P_{i+1}}{2}(t_{i+1}-t_i),\qquad
e_{\rm accepted}=\frac{\widehat E_{\rm device}}{N_{\rm accepted}},
\quad N_{\rm accepted}>0.
$$
*(Eq. 45.9)*

Here time is seconds, power watts, energy joules and $N_{\rm accepted}$ counts completed outputs satisfying declared task and latency requirements. If no task is accepted, efficiency is undefined and the run reports no accepted service. Joules/token is separately defined and does not certify task utility.

[MATHEMATICALLY-DERIVED] For an observed battery voltage/current trajectory, electrical energy is $\int V(t)I(t)dt$, while charge is $\int I(t)dt$. Multiplying charge by one nominal voltage is an approximation requiring a stated voltage assumption; mAh alone is not energy. Whole-device input, battery output and processor-rail energy differ because conversion losses and peripherals lie on different sides of their measurement boundaries.

| Quantity | Required boundary |
|---|---|
| TTFT | request accepted/start to first user-visible token, including specified queue/template work |
| Inter-token latency | arrival-time differences for streamed tokens; retain distribution and stalls |
| End-to-end latency | request/task start to completion, including stop/validation policy |
| Whole-device J/task | integration interval, powered components and accepted-task denominator |
| Incremental J/task | matched idle baseline and subtraction, separately named |
| Memory | virtual, resident, shared, private, accelerator allocated/reserved and device pressure |
| Thermal state | sensor identity/location, ambient/enclosure, initial state and trajectory |



```figure
{
  "id": "fig-45.18",
  "kind": "calculator",
  "title": "Energy per accepted task",
  "caption": "Illustrative constant whole-device power instantiates Eq. 45.9. Zero accepted tasks is undefined and is excluded from this calculator domain.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-45.9",
  "alt": "Illustrative constant whole-device power instantiates Eq. 45.9. Zero accepted tasks is undefined and is excluded from this calculator domain.",
  "spec": {
    "tex": "E=P\\,t,\\quad e=E/N_{\\rm accepted}",
    "equation": "45.9",
    "inputs": [
      {
        "symbol": "P",
        "label": "Whole-device watts",
        "default": 8,
        "min": 0,
        "max": 50,
        "format": "fixed3"
      },
      {
        "symbol": "t",
        "label": "Measured seconds",
        "default": 600,
        "min": 1,
        "max": 7200,
        "format": "fixed3"
      },
      {
        "symbol": "N",
        "label": "Accepted tasks",
        "default": 100,
        "min": 1,
        "max": 10000,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "E",
        "label": "Device joules",
        "formula": "P*t",
        "format": "fixed3"
      },
      {
        "symbol": "e",
        "label": "Joules/accepted task",
        "formula": "P*t/N",
        "format": "fixed3"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Establish identity first: checkpoint/tokenizer/template hashes, quantization method and actual tensor types, runtime/backend/compiler/driver revisions and device OS/firmware. Preserve prompt/output tokenization. Deterministic settings help comparisons but do not guarantee bitwise equality across reduction paths. Correctness checks compare relevant logits/state or accepted-task quality under an explicit tolerance, rather than judging only fluent final text.

[DERIVED] Partition initialization into artifact acquisition, file access, parsing, allocation/repacking, compilation and first execution. Report the complete critical path when the user waits for them. Some phases overlap; summing independently timed durations can double count. If preprocessing occurs before the measured request, state that exclusion. A warm profile can be valid for a persistent assistant but cannot answer a fresh-install or post-eviction question.

[OFFICIAL-DOCUMENTATION] llama-bench distinguishes prompt-processing, generation and combined tests; it reports repetitions and supports context-depth control. Its documentation explicitly excludes tokenization and sampling [R45.8, Usage]. Its generation result is therefore a kernel/runtime benchmark boundary, not automatically application TTFT or end-to-end responsiveness.

[DERIVED] Sustained evaluation requires rate, context and state trajectories. Generating into a growing conversation changes attention work even with constant clocks. Resetting context each request holds work more stable but measures a different service. Separate them when attributing slowdown: compare matched sequence lengths or include context in analysis. An idle interval changes cooling and power opportunity and belongs in an interactive trace's energy boundary.

[MATHEMATICALLY-DERIVED] Define window rate $g_k=N_k/\Delta t_k$ for accepted work $N_k$ and temperature slope $s_k=[\Theta(t_{k+1})-\Theta(t_k)]/\Delta t_k$. A near-zero slope over a declared window can indicate approximate equilibrium under stationary conditions; it does not prove equilibrium if cooling, ambient or workload changes. Firmware can stabilize temperature by reducing clocks, so stationary temperature and stationary service are separate conditions.

[DERIVED] Retain sensor uncertainty and measurement overhead. Counters can alter scheduling; tracing changes memory traffic and timing. An external meter avoids some software interference but adds calibration, sampling and synchronization requirements. Rail telemetry can omit display, radio, regulator or storage contributions. Slow power sampling aliases bursts, while unaligned clocks attribute energy to the wrong phase. Report integration and missing intervals instead of silently interpolating long gaps.

[DERIVED] Battery testing adds charge state, health, charging status and power mode. USB automation can supply energy or change performance policy. A laboratory supply stabilizes voltage while removing battery-dependent behavior; that is a deliberate boundary, not ordinary unplugged use. Extrapolating tasks per charge from a short trace assumes stable usable energy and future workload, and should be labelled.

[PAPER-REPORTED] MELT separates intrusive profiling, synchronizes events and uses different phone/Jetson power boundaries [R45.9, §§3–4].

[DERIVED] Context evaluation has three tests: configured runtime limit, successful allocation/execution at a length, and useful task behavior at that length. A runtime can allocate a long cache while positional generalization fails. A compiler can support a bounded shape domain while the model advertises a larger window. Retain effective input, history and output caps; truncation/sliding-window policies change the task and must be visible.

[DERIVED] Privacy evaluation needs a threat model and data flow. Local compute removes a mandatory cloud-model request only if the application uses that path. It does not exclude telemetry, remote retrieval/tools, crash reports, prompt logs, insecure downloads or another process reading accessible files. State adversaries, permissions, storage retention and network behavior. Offline functionality requires dependency closure under disconnection; privacy concerns what can be learned/accessed and cannot be proven by successful disconnected inference alone.

[DERIVED] The cost ledger joins arithmetic/tensor traffic from Chapters 40–42 to initialization/storage/network activity, memory pressure, processor utilization and thermal/energy trajectories. An improvement should identify which term changed. Lower parameter storage does not ensure lower energy if unpacking and duration increase. Money depends on lifetime, electricity and support assumptions; local deployment has a total cost beyond any per-request API bill.



```figure
{
  "id": "fig-45.19",
  "kind": "diagram",
  "title": "Synchronized deployment profile",
  "caption": "Initial state and declared workload lead to bounded execution. Output acceptance and aligned resource trajectories jointly define the profile.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-45.9",
  "alt": "The diagram shows Cold/warm state vector to Bounded application run; Arrival/context/task to Bounded application run; Bounded application run to Check accepted output; Bounded application run to Power thermal memory trace; Check accepted output to Deployment profile; Power thermal memory trace to Deployment profile.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "i",
        "kind": "state",
        "label": "Cold/warm state vector"
      },
      {
        "id": "w",
        "kind": "dataset",
        "label": "Arrival/context/task"
      },
      {
        "id": "e",
        "kind": "process",
        "label": "Bounded application run"
      },
      {
        "id": "q",
        "kind": "process",
        "label": "Check accepted output"
      },
      {
        "id": "r",
        "kind": "metric",
        "label": "Power thermal memory trace"
      },
      {
        "id": "p",
        "kind": "metric",
        "label": "Deployment profile"
      }
    ],
    "edges": [
      {
        "from": "i",
        "to": "e"
      },
      {
        "from": "w",
        "to": "e"
      },
      {
        "from": "e",
        "to": "q"
      },
      {
        "from": "e",
        "to": "r"
      },
      {
        "from": "q",
        "to": "p"
      },
      {
        "from": "r",
        "to": "p"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 45.6 — Bounded deployment-profile collection.** [DERIVED] Inputs are immutable identity, finite ordered cases $\mathcal C$, initial-state tolerances, sensor policy, task acceptance and per-case time/token/memory limits. Output is a profile with accepted results, rejected cases and missing evidence. Each case counts accepted completions explicitly; failed cases contribute zero.

$$
\begin{aligned}
1.&\quad \operatorname{ValidateIdentityAndMeasurementBoundary};\
\mathcal R\leftarrow\varnothing.\\
2.&\quad \text{For }c\in\mathcal C:\quad
\operatorname{EstablishAndRecordInitialState}(c).\\
3.&\quad \text{State/sensors invalid}\Rightarrow
\mathcal R\leftarrow\mathcal R\cup\{\mathrm{INVALID}(c)\};\ \operatorname{Continue}.\\
4.&\quad \operatorname{ExecuteWithLimits}(c)
\Rightarrow(\text{output},\text{timestamps},P,\Theta,M,\text{status}).\\
5.&\quad \text{Safety/timeout/OOM failure}\Rightarrow
\operatorname{StopCaseAndRetainTrace};\
\text{else }\operatorname{EvaluateAcceptance}.\\
6.&\quad \operatorname{IntegrateOnlyValidIntervals};\
N_{\rm accepted}(c)\leftarrow\operatorname{CountAccepted}(\text{output},\text{status});\quad
N_{\rm accepted}(c)=0\Rightarrow e_{\rm accepted}(c)=\mathrm{UNDEFINED}.\\
7.&\quad \mathcal R\leftarrow\mathcal R\cup\{\operatorname{CaseRecord}(c,\text{status},\text{acceptance},\text{valid/missing intervals},\text{trace})\}.\\
8.&\quad \text{After all cases: }\operatorname{Return}(\mathcal R,\text{uncertainty},\text{coverage gaps});
\quad\text{retain every failed case}.
\end{aligned}
$$

[DERIVED] Invariants are unchanged acceptance/measurement definitions across variants, platform safety preserved, and complete failure retention. Finite cases and per-case limits guarantee termination. Establishing a cool baseline also has a bounded waiting condition; failure produces an invalid-initial-state record. This is an audit contract, not a claim that this manuscript ran devices.

## Implementation

[DERIVED] Join request state, token arrivals, context, process/device allocations and power/temperature samples in a timestamped record. Keep raw intervals alongside summaries. Report warm resident service and each defined cold-start profile separately. If hardware prevents a measurement, retain NOT-DISCLOSED or UNVERIFIED rather than inferring it from utilization, advertised capacity or another device.

[OFFICIAL-DOCUMENTATION] The July 2026 MLCommons Edge Agentic v6.1 call specifies a separate accuracy gate and single-concurrency conversation replay. Performance uses 20 conversations/1,007 turns, recorded pauses, a 32K configuration and per-turn streaming metrics [R45.23, Workload/Performance]. This is a specification/call, not evidence that every runtime passed or a device result.

## Experimental design

### Reported experiments

[PAPER-REPORTED] MELT repeats runs three times. Its Zephyr-3B 4-bit, 50-prompt phone/Jetson traces show different sustained behavior; the phone DVFS explanation remains hypothetical [R45.9, §§5.1–5.2.3/Fig. 8].

[PAPER-REPORTED] EnerInfer's component-efficiency experiments and foreground-display tasks use different energy boundaries; Table 2 and §6.4/Fig. 15 must not be conflated [R45.28]. Its Qwen2.5-1.5B-Q4 thermal stress starts at 37°C [§6.3].

[DERIVED] If the optimized subsystem contributes fraction $f$ of baseline task energy and its energy falls fraction $s$ while all other terms remain fixed, whole-task savings are $fs$. A component improvement therefore cannot be copied into a battery-life claim without the energy fraction, unchanged-duration assumption and peripheral behavior. Extending task duration can increase the supposedly fixed terms.

[UNVERIFIED] EnerInfer's printed Algorithm 2 updates the previous timestamp before subtracting it, making the displayed interval zero [R45.28, lines 5–8]. Artifact clarification is required; this does not establish an implementation defect.

[DERIVED] This supports measuring trajectories, not importing a historical ranking into 2026. Different devices, versions, processor choices, quantization and context evolution confound a universal runtime comparison. Current documentation supplies capability contracts; it does not replace a matched sustained experiment.

## Observations

**What the paper claims.** [PAPER-REPORTED] MELT advocates joint device evaluation [R45.9].

**What the evidence shows.** [PAPER-REPORTED] Phone/edge traces and intrusive profiling have distinct boundaries [R45.9, §§4–5].

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 45.9 permits an energy-efficient token stream to have poor accepted-task efficiency. Changing the power boundary or acceptance denominator changes the metric.

**What remains unknown.** [UNVERIFIED] A contemporary, quality-matched sustained comparison across all Chapter 45 runtimes and ordinary phone permissions has not been executed here.



```figure
{
  "id": "fig-45.20",
  "kind": "stat-panel",
  "title": "Claim boundary audit",
  "caption": "No individual measurement establishes every property in the deployment claim.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-45.9",
  "alt": "No individual measurement establishes every property in the deployment claim.",
  "spec": {
    "header": "CLAIM BOUNDARY AUDIT",
    "rows": [
      {
        "key": "warm",
        "value": "Process/page/kernel/prefix/heat"
      },
      {
        "key": "energy",
        "value": "Whole-device versus incremental"
      },
      {
        "key": "context",
        "value": "Configured, executable, useful"
      },
      {
        "key": "privacy",
        "value": "Threat model and complete data flow"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Warm peak presented as sustained service.** [DERIVED] *Symptom:* users observe slow starts, later stalls or rapid drain absent from results. *Cause:* warm pages/kernels, cool package, excluded preprocessing or incomplete power boundary. *Detection:* initial-state vector and full-run traces. *Mitigation:* separate initialization and sustained profiles.

[DERIVED] Other failures include output truncation, context drift mistaken for thermal degradation, charge mistaken for energy, idle subtraction without a matched baseline, and local execution described as a privacy proof. Failed/OOM configurations belong in coverage with their task conditions.

## Siblings

[DERIVED] [§45.1](45-1-device-constraints.md) models feasibility; [§45.5](45-5-hybrid-placement.md) explains transfer/locality changes. Chapter 47 owns observability/recovery; Chapter 48 owns service benchmarking and lifecycle economics. Device evaluation supplies their measured boundaries.

## Extensions

### Improvements

[DERIVED] The lineage extends operator timing to application traces, external energy/thermal measurement and accepted-task conversation benchmarks. These answer different questions and should coexist. The 2026 MLCommons call makes arrival/stopping behavior explicit; ThermE adds calibrated predictive edge thermal control [R45.23; R45.2]. Neither establishes universal device dominance.

## Limitations

[DERIVED] Restricted sensors/firmware can prevent causal attribution. Laboratory repetitions do not cover every background process, battery-aging state or enclosure. Privacy remains conditional on the adversary and observed application boundary.

> **Open question.** [UNVERIFIED] Which compact profile predicts user-visible service under changing context, ambient conditions and foreground activity across devices? *Settling evidence:* held-out traces with synchronized power/thermal/resources, task quality and uncertainty.

## Reproducibility

[DERIVED] Publish identity, arrival/context/stopping policy, state preparation, calibration, raw timestamps, failures and acceptance rules. R45.23 is a 2026 call/specification that may evolve, not a final submission result. No device run, energy measurement or security validation was executed here.

## References

[R45.2](references.md#r45-2), [R45.8](references.md#r45-8), [R45.9](references.md#r45-9), [R45.23](references.md#r45-23), [R45.28](references.md#r45-28).
