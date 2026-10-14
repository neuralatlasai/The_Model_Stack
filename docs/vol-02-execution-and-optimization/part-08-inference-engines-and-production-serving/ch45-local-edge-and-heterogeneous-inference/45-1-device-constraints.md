---
id: ms.section.45.1
entity_type: section
title: "Device constraints"
volume: 2
part: 8
chapter: 45
section: 45.1
slug: 45-1-device-constraints
parent: ms.chapter.45
prev_sibling: null
next_sibling: ms.section.45.2
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

# 45.1 Device constraints

## Scope

[DERIVED] The objective is to determine whether a local or edge device can sustain a declared inference service within memory, latency, energy, thermal and offline constraints. The baseline is a successful model load followed by a short peak-throughput test. Success requires a feasible operating region over time, including application/OS coexistence and recovery. Architecture, quantization and cache formulas remain in Chapters 25, 40 and 42; this section adds device-level coupling and sustained operation.

## Why this exists

[DERIVED] Fitting a checkpoint is a necessary condition, not a deployment criterion. State, temporary buffers and other applications consume the remaining memory. Bandwidth can limit decode even when compute units are idle. A cold start can depend on storage and compilation. A long run heats a shared package, changes clocks and raises completion time. On a battery-powered device the duration and whole-device energy also determine how many useful tasks remain possible.

[DERIVED] A local setting changes the resource boundary. A server may have dedicated cooling and an explicit admission controller; a personal device shares memory, power and thermal headroom with its display, operating system and foreground activities. A fanless device and an actively cooled edge module therefore cannot inherit the same sustained operating profile merely because both run an Arm CPU and an integrated GPU. The form of a resource constraint can be shared; its coefficients and allowed controls must be identified on the actual platform.

## Intuition

[MATHEMATICALLY-DERIVED] Capacity is a hard simultaneous occupancy constraint. Bandwidth and compute are rate constraints. Temperature is a state variable integrating past power and cooling. Battery energy is a cumulative budget. Interactive latency depends on the critical path through all of them. An optimization that raises momentary token rate can consume thermal headroom faster and reduce later service. There is no monotone implication from peak tokens/s to sustained accepted tasks/J.

[OFFICIAL-DOCUMENTATION] MLX's unified-memory contract allows CPU and GPU operations to access the same array allocation and inserts dependencies between streams [R45.1, "Unified Memory"]. That removes a required discrete-memory copy for these arrays; it does not remove reads/writes to shared DRAM or competition between processors. Shared addressing is not infinite bandwidth.

## Formulation

[MATHEMATICALLY-DERIVED] Let $M_{\rm app}(t)$ be the application's live/reserved physical occupancy, $M_{\rm other}(t)$ competing system occupancy and $M_{\rm phys}$ usable physical memory under the platform's accounting. The device feasibility conditions include

$$
M_{\rm app}(t)+M_{\rm other}(t)\le M_{\rm phys},\qquad
t_{\rm request}\le t_{\rm deadline},\qquad
\int_0^{t_{\rm run}}P_{\rm device}(t)\,dt\le E_{\rm budget}.
$$
*(Eq. 45.1)*

| Symbol | Meaning / unit |
|---|---|
| $M_{\rm *}$ | physical occupancy/capacity, bytes |
| $P_{\rm device},E_{\rm budget}$ | whole-device power in W; energy in J |
| $t_{\rm *}$ | seconds on the declared request/run boundary |

[MATHEMATICALLY-DERIVED] For an explicitly chosen lumped thermal model with constant ambient temperature $\Theta_a$, thermal resistance $R_{\rm th}$, heat capacity $C_{\rm th}$ and package heat input $P_h$,

$$
C_{\rm th}\frac{d\Theta}{dt}=P_h-\frac{\Theta-\Theta_a}{R_{\rm th}},\qquad
\Theta(t)=\Theta_a+R_{\rm th}P_h+
[\Theta(0)-\Theta_a-R_{\rm th}P_h]e^{-t/(R_{\rm th}C_{\rm th})}.
$$
*(Eq. 45.2)*

where $\Theta$ is temperature, $R_{\rm th}$ K/W and $C_{\rm th}$ J/K. This is an analytical one-node heat-balance model, not a fitted description of a named chip. Its equilibrium is $\Theta_a+R_{\rm th}P_h$ and its time constant is $R_{\rm th}C_{\rm th}$. Real packages can require coupled spatial modes.



```figure
{
  "id": "fig-45.3",
  "kind": "calculator",
  "title": "Transient temperature in a one-node model",
  "caption": "Illustrative constant-power analytical model; these inputs are not calibrated to a named device. Shared-domain and firmware effects are omitted.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-45.2",
  "alt": "Illustrative constant-power analytical model; these inputs are not calibrated to a named device. Shared-domain and firmware effects are omitted.",
  "spec": {
    "tex": "\\Theta(t)=\\Theta_a+RP+(\\Theta_0-\\Theta_a-RP)e^{-t/(RC)}",
    "equation": "45.2",
    "inputs": [
      {
        "symbol": "Ta",
        "label": "Ambient C",
        "default": 25,
        "min": 0,
        "max": 70,
        "format": "fixed3"
      },
      {
        "symbol": "T0",
        "label": "Initial C",
        "default": 30,
        "min": 0,
        "max": 90,
        "format": "fixed3"
      },
      {
        "symbol": "R",
        "label": "Thermal resistance K/W",
        "default": 4,
        "min": 0.1,
        "max": 10,
        "format": "fixed3"
      },
      {
        "symbol": "C",
        "label": "Heat capacity J/K",
        "default": 25,
        "min": 1,
        "max": 500,
        "format": "fixed3"
      },
      {
        "symbol": "P",
        "label": "Heat input W",
        "default": 8,
        "min": 0,
        "max": 40,
        "format": "fixed3"
      },
      {
        "symbol": "t",
        "label": "Elapsed seconds",
        "default": 120,
        "min": 0,
        "max": 1800,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "Teq",
        "label": "Equilibrium C",
        "formula": "Ta+R*P",
        "format": "fixed3"
      },
      {
        "symbol": "Theta",
        "label": "Temperature C",
        "formula": "Ta+R*P+(T0-Ta-R*P)*exp(-t/(R*C))",
        "format": "fixed3"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Start with the inference ledger from Chapter 42. Translate its process/rank allocations into the platform's physical memory domains. A discrete GPU has a separate capacity budget; an integrated GPU can share physical DRAM with the CPU but still impose driver allocation limits and alignment constraints. CPU virtual address space, mapped file size, process resident pages and GPU-accessible allocation are different quantities. They must not be collapsed into a single "RAM required" number.

[DERIVED] Then characterize traffic under the declared workload. Learned weights, retained attention state, unpacked intermediates and output buffers generate reads/writes. In a shared-memory device, CPU work such as tokenization or preprocessing can compete with model kernels for the same memory channels. Moving an operator from GPU to CPU can reduce launch overhead yet increase contention. The relevant bandwidth is achieved concurrent traffic under the chosen placement, not a sum of independent CPU and GPU advertised rates.

[MATHEMATICALLY-DERIVED] If an iteration moves $Q$ bytes through the bottleneck memory interface, its transfer time is at least $Q/B_{\rm mem}$ at the stated interface bandwidth. Two concurrent consumers sharing a fixed aggregate rate cannot both sustain that rate indefinitely. Under a simple shared-capacity constraint, rates $r_c,r_g$ satisfy $r_c+r_g\le B_{\rm mem}$. This bound does not predict arbitration, cache reuse or latency; it explains why removing explicit copies is not sufficient to remove shared-memory pressure.

[DERIVED] Thermal feasibility adds a time horizon. In Eq. 45.2, an initially cool package can operate above its indefinitely sustainable power for a finite interval. If the equilibrium exceeds a guard temperature $\Theta_g$ and $\Theta(0)<\Theta_g$, solving for the crossing time yields
$t_g=R_{\rm th}C_{\rm th}\ln[(\Theta_\infty-\Theta(0))/(\Theta_\infty-\Theta_g)]$ with $\Theta_\infty=\Theta_a+R_{\rm th}P_h$. This expression is meaningful only under constant power/ambient/cooling and the stated temperature ordering. A short benchmark ending before $t_g$ cannot establish steady operation.

[MATHEMATICALLY-DERIVED] For a coupled linear analytical model, temperature excess vector $z$ can satisfy $C_{\rm th,mat}\dot z=Gp-Kz$, with positive heat-capacity matrix, heat input $p$, coupling/transfer matrices and boundary conditions chosen so the dynamics are stable. Cross-domain heat means a CPU workload can reduce GPU thermal margin even when GPU power is unchanged. Identifying that coupling requires synchronized power/temperature observations; processor utilization alone does not determine heat flow.

[PAPER-REPORTED] ThermE combines heat estimation, reduced thermal prediction and profile/token-cap search [R45.2, §4]. Platform safety remains independent.

[PAPER-REPORTED] EnerInfer predicts platform-specific throughput/power rankings, selects efficient NPU/DDR settings and adds limited-horizon shell-temperature control [R45.28, §§4–5].

[MATHEMATICALLY-DERIVED] A rate constraint does not make the lowest-rate feasible setting most energy efficient. For illustrative configurations with $(r,P)=(8,4)$ and $(12,5)$ in tasks/s and watts, both exceed a target of five tasks/s, but their active energy/task is $0.5$ and approximately $0.417$ J respectively. These are analytical numbers, not device observations. Maximizing $r/P$ under $r\ge r_{\min}$ differs from minimizing frequency under the same constraint. Whole-device idle/display power, transition cost and task acceptance can change the ordering again.

[DERIVED] A predicted ranking is useful only within its calibration and control domain. A controller must handle an empty feasible set, measurement delay, changed foreground demand and configurations blocked by other system policy. A point that was Pareto efficient before interference can become dominated afterward. This is a general reason to validate the selection outcome, rather than treating correct offline ordering as a permanent optimality guarantee.

[DERIVED] The device contract must state available controls rather than assuming arbitrary frequency manipulation. Application sandboxes may expose only workload sizing and cancellation, while embedded administrators can have power/fan/governor controls. Lowering scheduled work is not equivalent to lowering frequency: the former changes admission/service distribution, the latter changes operator duration and energy. Both can affect responsiveness and accumulated heat; choosing between them requires calibrated transition costs.

[DERIVED] Offline operation adds a dependency-closure requirement. The device must retain model weights, tokenizer/template, executable kernels/libraries and necessary local data, with no required remote lookup during the accepted task. Downloading a model before disconnecting can satisfy an offline preparation contract while still needing periodic licensing or telemetry in some products; those behaviors cannot be assumed away. Test the actual application under the declared network boundary and retain failures. Local inference alone neither establishes a private storage policy nor excludes other application traffic.

[MATHEMATICALLY-DERIVED] For $n_{\rm accepted}>0$ accepted tasks, the whole-run energy per accepted task is $E_{\rm run}/n_{\rm accepted}$, with a defined acceptance criterion. With zero accepted tasks, report undefined efficiency and no accepted service. Subtracting idle power estimates incremental energy, a different quantity. If idle power is $P_0$, incremental energy is $\int(P_{\rm device}-P_0)dt$ under a matched baseline. Negative samples indicate noise or a changed idle state, not negative computation. Battery capacity in Wh converts to joules by multiplying by 3600, but usable energy depends on device/OS conditions and must be measured or documented.

[DERIVED] Resource accounting includes parameter storage, generated/retained tokens, FLOPs and DRAM traffic from Chapter 42 plus storage reads, host/device synchronization, network dependencies when permitted, and the temporal cooling/battery state. A thermal controller adds sensing, prediction and switching work. Time is user-visible over the complete task; energy includes the chosen whole-device components; money requires an explicit hardware/amortization or electricity boundary. None follows from a short peak token rate alone.



```figure
{
  "id": "fig-45.4",
  "kind": "diagram",
  "title": "Coupled device feasibility",
  "caption": "Memory, bandwidth and accumulated heat constrain accepted service. Workload controls can change both present rate and future state.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-45.1",
  "alt": "The diagram shows Declared workload to Shared execution; Physical occupancy to Shared execution; Shared execution to Thermal trajectory; Shared execution to Energy budget; Thermal trajectory to Supported controls; Energy budget to Supported controls; Supported controls to Shared execution; Shared execution to Accepted service.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "w",
        "kind": "dataset",
        "label": "Declared workload"
      },
      {
        "id": "e",
        "kind": "hardware",
        "label": "Shared execution"
      },
      {
        "id": "m",
        "kind": "memory",
        "label": "Physical occupancy"
      },
      {
        "id": "h",
        "kind": "state",
        "label": "Thermal trajectory"
      },
      {
        "id": "b",
        "kind": "state",
        "label": "Energy budget"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "Supported controls"
      },
      {
        "id": "s",
        "kind": "metric",
        "label": "Accepted service"
      }
    ],
    "edges": [
      {
        "from": "w",
        "to": "e"
      },
      {
        "from": "m",
        "to": "e"
      },
      {
        "from": "e",
        "to": "h"
      },
      {
        "from": "e",
        "to": "b"
      },
      {
        "from": "h",
        "to": "c"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "e"
      },
      {
        "from": "e",
        "to": "s"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 45.1 — Bounded device feasibility screen.** [DERIVED] Inputs are immutable deployment/workload identity, finite allowed action set $\mathcal A$, memory/energy/latency limits, sensor validity policy and positive integer horizon $H$. Output is an admissible operating profile or a named infeasibility state. This is a book contract, not ThermE's production algorithm.

$$
\begin{aligned}
1.&\quad \operatorname{ValidateArtifactsAndOfflineClosure};\quad
\mathcal F\leftarrow\varnothing;\quad z_0\leftarrow\operatorname{ObservedDeviceState}.\\
2.&\quad \text{For each }a\in\mathcal A:\quad
\operatorname{Supported}(a)=\mathrm{false}\Rightarrow\operatorname{Reject}(a).\\
3.&\quad \operatorname{PeakMemory}(a)>M_{\rm usable}\Rightarrow\operatorname{Reject}(a).\\
4.&\quad (z_h,E_h,t_h)_{h=1}^{H}\leftarrow\operatorname{DeclaredPrediction}(z_0,a).\\
5.&\quad \text{Invalid sensor/prediction or violated limit}\Rightarrow\operatorname{Reject}(a);\
\text{otherwise }\mathcal F\leftarrow\mathcal F\cup\{a\}.\\
6.&\quad \mathcal F=\varnothing\Rightarrow\mathrm{NO\_FEASIBLE\_PROFILE};\
\text{else return profiles with domain/uncertainty records}.
\end{aligned}
$$

[DERIVED] The invariants are no overridden platform safety limits, no feasible label outside a validated prediction domain, and no omitted simultaneous memory term. Runtime execution additionally checks cancellation/deadline and falls back or terminates on invalid telemetry. Enumeration is bounded by $|\mathcal A|H$ model updates with state-size-dependent cost. A profile's predicted sustainability is not an observation; validation belongs to the proposed protocol.

## Implementation

[OFFICIAL-DOCUMENTATION] **Apple MLX / MLX-LM — Serving / portable runtime** supplies the shared-array placement semantics [R45.1]. **llama.cpp — Inference engine** documents CPU/GPU hybrid execution and available backends [R45.3, Description/Supported backends]. Backend presence does not certify full model/operator support or sustainable power behavior.

[DERIVED] Connect the deployment's operators to actual memory domains and processor paths. Record allocatable rather than nominal memory, effective concurrent bandwidth, kernel/driver identity, allowed thread/work budgets, external-device power boundary and ambient/cooling state. OS termination under memory pressure is a deployment failure even when the runtime's own allocations are internally consistent. Low-memory fallback should preserve a defined task/output contract or reject; silently changing context and quality creates a different service.

## Experimental design

### Reported experiments

[PAPER-REPORTED] ThermE tests Jetson AGX Orin 64 GB, JetPack-R36.5.2/vLLM 0.19.0 against governors/static/adapted controllers. Default Qwen3-14B uses 511/128 tokens, 65°C ambient/60% fan and external power measurement [R45.2, §6.1/Table 1].

## Observations

**What the paper claims.** [PAPER-REPORTED] ThermE reports improved sustained service under its predicted thermal control [R45.2, §6.2].

**What the evidence shows.** [PAPER-REPORTED] Its selected point throttles earlier than vLLM yet has fewer SLO violations [R45.2, Fig. 12]. Independent replication is absent here.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 45.2 distinguishes transient headroom from equilibrium. A cool-start peak can coexist with an infeasible steady state. Shared DRAM and cooling couple ostensibly independent processors.

**What remains unknown.** [UNVERIFIED] Calibration transfer to a different enclosure, mobile permission model, battery state or background workload is not established.



```figure
{
  "id": "fig-45.5",
  "kind": "stat-panel",
  "title": "Resource boundaries",
  "caption": "These quantities answer different feasibility questions; shared addressing does not merge their meanings.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-45.1",
  "alt": "These quantities answer different feasibility questions; shared addressing does not merge their meanings.",
  "spec": {
    "header": "RESOURCE BOUNDARIES",
    "rows": [
      {
        "key": "capacity",
        "value": "Simultaneous physical bytes"
      },
      {
        "key": "rate",
        "value": "Shared bytes/s and FLOPs/s"
      },
      {
        "key": "heat",
        "value": "State integrating power/cooling"
      },
      {
        "key": "energy",
        "value": "Whole-device integral in J"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

> **Failure mode — Cool-start extrapolation.** [DERIVED] *Symptom:* an initially fast run later misses latency targets. *Cause:* memory pressure or accumulated heat changes the execution regime. *Detection:* aligned rate, clocks, temperature, memory and power traces. *Mitigation:* report sustained profiles and use supported workload/control limits.

[DERIVED] Other failures include mapped-file size mistaken for resident capacity, shared-memory bandwidth double counting, offline tasks that depend on missing libraries or remote assets, and a controller whose invalid prediction is treated as permission to continue. Sensor absence is uncertainty, not evidence of thermal margin.

## Siblings

[DERIVED] [§45.5](45-5-hybrid-placement.md) decides which processor owns work; [§45.6](45-6-device-evaluation.md) measures the sustained outcome. Chapter 42 owns cache/phase accounting. Compare feasible service regions under the same quality and duration, rather than isolated peak compute or a device-name ranking.

## Extensions

### Improvements

[PAPER-REPORTED] ThermE's ablations support its combined controller within the testbed [R45.2, §6.4].

## Limitations

[DERIVED] The one-node model omits spatial gradients, nonlinear leakage, variable cooling and firmware hysteresis. A device can be memory feasible but thermally infeasible, or energy efficient per token but poor per accepted task. Privacy/offline claims require the whole application boundary.

> **Open question.** [UNVERIFIED] Can device-level inference control remain reliable under nonstationary ambient conditions and unrelated foreground load without privileged telemetry? *Settling evidence:* held-out coupled thermal/service traces with explicit permission and sensor limits.

## Reproducibility

[DERIVED] Retain exact hardware/enclosure, initial and ambient temperatures, power source, battery state, memory domains, model/runtime identities, controls, task acceptance and duration. R45.1 displays 0.32.3 but is mutable; no local device experiment or implementation check was executed.

## References

[R45.1](references.md#r45-1), [R45.2](references.md#r45-2), [R45.3](references.md#r45-3), [R45.28](references.md#r45-28).
