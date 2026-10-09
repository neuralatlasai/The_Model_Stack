---
id: "ms.section.30.4"
entity_type: "section"
title: "Failure taxonomy"
short_title: "Failure taxonomy"
volume: 2
part: 5
chapter: 30
section: 30.4
slug: "30-4-failure-taxonomy"
parent: "ms.chapter.30"
prev_sibling: "ms.section.30.3"
next_sibling: "ms.section.30.5"
children: []
prerequisites: ["ms.chapter.12", "ms.chapter.19", "ms.chapter.20", "ms.chapter.21", "ms.chapter.25", "ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29"]
downstream: ["ms.chapter.31", "ms.chapter.36", "ms.chapter.44"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "continued_training"], "mechanism": ["distributed_training", "fault_tolerance", "checkpointing"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.torchtitan", "impl.megatron-lm", "impl.nvidia-megatron-core"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2000
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 30.4 — Failure taxonomy

## Scope

[DERIVED] Classify device/node loss, collective hangs, stragglers, network faults, storage stalls, numerical divergence and silent corruption by affected state and recovery eligibility. The output is a diagnosis-and-action contract, not a catalog of error strings. The baseline treats every incident as whole-job restart; selective recovery is accepted only when the surviving state meets the required invariant. Failure frequencies are deployment-specific and remain unestimated here.

## Why this exists

[PAPER-REPORTED] The 2026 instruction-level SDC study targets matrix-multiply instructions and demonstrates both transient symptoms and persistent parameter divergence in single-GPU LLaMA-based training [R30.8, §IV–VII]. The 2026 gate-level study finds that most observed corruptions are finite values [R30.10, §V]. A detector limited to NaN/Inf therefore does not cover the entire corruption class in those studies.

[DERIVED] A watchdog timeout names an unmet deadline, not a root cause. A healthy rank can time out because another rank skipped a collective, the network stopped progressing, storage starved the input pipeline, or one device is slow. Conversely, incorrect finite arithmetic can satisfy every deadline. Classification must separate liveness from numerical validity and distinguish suspicion from evidence sufficient to authorize a state-preserving restart.

## Intuition

[MATHEMATICALLY-DERIVED] Recovery safety depends on what may have changed. A lost process destroys its private volatile state. A communication failure can leave an update partially applied unless the protocol fences a known boundary. A straggler may preserve correct state while delaying everyone. Silent corruption can preserve liveness while invalidating parameters and optimizer moments. The same symptom can occupy several classes; the controller should retain multiple hypotheses until a discriminating check or conservative fallback resolves them.

## Formulation

| Class | State risk | Discriminating evidence | Safe default boundary |
|---|---|---|---|
| Device/node loss | Missing volatile shards | Endpoint loss and hardware health | Validated surviving copy or durable checkpoint |
| Collective hang | Unknown partial communication | Ordered operation ledger and peer progress | Quiescence and group retirement |
| Straggler | Correct but late work, or hidden fault | Phase-resolved rank skew | Diagnose before replacement |
| Network fault | Broken routes/communicators | Transport errors plus endpoint health | Qualified context repair or restart |
| Storage stall | Snapshot/input queue backlog | Queue age and backend completion | Backpressure; keep prior anchor |
| Numerical divergence | Invalid update trajectory | Loss, gradient, update and state diagnostics | Restore known clean predecessor |
| Silent corruption | Incorrect finite values possible | Independent replay/checksums and fault evidence | Quarantine suspected state |

[DERIVED] This table is a book-derived classification by recovery obligations. It does not assign causality from one log line or import historical fleet rates. It deliberately separates state availability, numerical validity and execution progress.

[MATHEMATICALLY-DERIVED] For corruption prevalence $p$, detector sensitivity $s$ and false-positive probability $f$, positive predictive value is

$$
\Pr(\text{corruption}\mid\text{alarm})=\frac{sp}{sp+f(1-p)},\qquad sp+f(1-p)>0.
$$
*(Eq. 30.17)*

The formula follows by Bayes' rule for the declared population. It does not provide a prevalence estimate. At chosen analytical inputs $p=10^{-5},s=0.95,f=10^{-3}$, the posterior is about $0.00941$. High sensitivity alone does not make an alarm a hardware diagnosis when true events are rare.

```figure
{
  "id": "fig-30.19",
  "kind": "diagram",
  "title": "Failure diagnosis branches on state and liveness",
  "caption": "A timeout and a numerical alarm take different diagnostic paths. Selective continuation requires verified surviving state; otherwise recovery returns to a validated predecessor.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.18",
  "alt": "A timeout and a numerical alarm take different diagnostic paths. Selective continuation requires verified surviving state; otherwise recovery returns to a validated predecessor.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "sig",
        "kind": "metric",
        "label": "Observed symptom"
      },
      {
        "id": "live",
        "kind": "branch",
        "label": "Progress stopped?"
      },
      {
        "id": "num",
        "kind": "branch",
        "label": "State disagreement?"
      },
      {
        "id": "health",
        "kind": "hardware",
        "label": "Endpoint health"
      },
      {
        "id": "cut",
        "kind": "state",
        "label": "Committed boundary"
      },
      {
        "id": "keep",
        "kind": "process",
        "label": "Qualified repair"
      },
      {
        "id": "restore",
        "kind": "model",
        "label": "Validated predecessor"
      }
    ],
    "edges": [
      {
        "from": "sig",
        "to": "live"
      },
      {
        "from": "sig",
        "to": "num"
      },
      {
        "from": "live",
        "to": "health"
      },
      {
        "from": "num",
        "to": "cut"
      },
      {
        "from": "health",
        "to": "cut"
      },
      {
        "from": "cut",
        "to": "keep"
      },
      {
        "from": "cut",
        "to": "restore"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-30.20",
  "kind": "calculator",
  "title": "Rare-event alarms need a base rate",
  "caption": "Analytical Bayes calculation, not a measured detector or cluster. Vary false-positive probability as well as sensitivity; an alarm is not automatically a confirmed corruption.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.17",
  "alt": "Analytical Bayes calculation, not a measured detector or cluster. Vary false-positive probability as well as sensitivity; an alarm is not automatically a confirmed corruption.",
  "spec": {
    "tex": "PPV=sp/(sp+f(1-p))",
    "equation": "30.17",
    "inputs": [
      {
        "symbol": "p",
        "label": "Chosen corruption probability",
        "default": 0.00001,
        "min": 0.000001,
        "max": 0.01,
        "step": 0.000001,
        "format": "raw"
      },
      {
        "symbol": "sens",
        "label": "Sensitivity",
        "default": 0.95,
        "min": 0.1,
        "max": 1,
        "step": 0.01,
        "format": "raw"
      },
      {
        "symbol": "fp",
        "label": "False-positive probability",
        "default": 0.001,
        "min": 0.000001,
        "max": 0.05,
        "step": 0.000001,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "PPV",
        "label": "Positive predictive value",
        "formula": "sens*p/(sens*p+fp*(1-p))",
        "format": "raw",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] A device/node-loss path first identifies which logical state coordinates disappeared, whether replicas survive, and whether those copies are at the accepted version. Excluding the dead endpoint from a group is not enough when its unique optimizer shard is missing. Replacement must restore that shard or choose an older complete checkpoint. Correlated power or switch events can destroy owner and peer together; protection must be evaluated by domains rather than copy count.

[DERIVED] A collective-hang path compares operation sequence, group generation, tensor dtype/shape and split vectors across participants. Different sequence numbers suggest control-flow divergence; matching operations with stalled transport suggest a communication path problem, but neither alone proves root cause. Record the last completed and first incomplete operation. Retire the affected communicator before repair and prevent any rank from applying an update using partial reduction output. The healthy control path must have its own deadline and cannot depend on completing the failed collective.

[MATHEMATICALLY-DERIVED] A conservative distributed numerical rejection is

$$
a_k=\max_{r\in\mathcal R_k}a_{r,k},\qquad a_{r,k}\in\{0,1\};\qquad a_k=1\Longrightarrow\neg\operatorname{commit}(k).
$$
*(Eq. 30.18)*

All participants must agree on the decision or retire the generation. A detector that skips one optimizer rank while peers continue creates inconsistent state. The decision reduction itself needs a healthy channel or bounded failure fallback. This invariant requires aborting incomplete work, not merely logging an alarm.

[DERIVED] Straggler diagnosis uses per-rank phase timings and workload denominators. A larger valid-token count, longer sequence, expert imbalance or compile miss can explain a slower rank without a defective device. Compare homologous phases at matched input shape and precision. A delayed rank causes downstream waits, so blaming every rank with a long communication span confuses the victim with the initiating delay. Replacement can worsen performance if it discards a warm compile/cache state without removing the real shared bottleneck.

[DERIVED] Storage stalls require queue and ownership inspection. A slow asynchronous save can retain device or host buffers, interfere with input reads, and eventually stop training. Check generation age, queued bytes, completed writes and backend errors. Skipping a pending checkpoint changes the durability horizon and must retain the last complete anchor. Retrying a broken storage path without a byte bound can turn one I/O fault into memory exhaustion across every rank.

[PAPER-REPORTED] TrainSDC combines Q/K-path recomputation with fingerprints, residual-gain monitoring and exponent-aware gradient scaling [R30.9, §4, Eqs. 4–18]. Its reported characterization distinguishes forward path sensitivity from backward exponent effects. [MATHEMATICALLY-DERIVED] A fingerprint match is not a proof of tensor identity because distinct inputs can collide. Deterministic repeated arithmetic may reproduce the same persistent fault. Independent checks need their own failure model and cannot be assumed fault-free merely because they execute twice.

[MATHEMATICALLY-DERIVED] For exact shadow tensors $x$ and $\widehat x$, a bounded numerical comparison can use

$$
\delta(x,\widehat x)=\frac{\|x-\widehat x\|_2}{\max(\|x\|_2,\epsilon_x)},\qquad\epsilon_x>0;
\quad\operatorname{accept}\Longleftrightarrow\operatorname{finite}(x,\widehat x)\land\delta\le\varepsilon_{\rm rel}.
$$
*(Eq. 30.19)*

Here $\epsilon_x$ is an explicitly chosen scale floor and $\varepsilon_{\rm rel}$ a declared tolerance, not a learned universal detector. For zero tensors the floor avoids undefined division, but also changes the sensitivity to small absolute errors. Stable norm computation and an independent absolute tolerance are needed when very small or large magnitudes are valid. Comparing only final loss can miss a persistent optimizer-state deviation.

[DERIVED] Numerical divergence is not synonymous with hardware corruption. Bad data, an incorrect mask, a kernel bug, an unstable optimizer setting, a changed loss denominator and a hardware fault can all create spikes. A clean-state replay on an independently qualified executor can distinguish some causes, provided it restores input identity, RNG, optimizer moments and scheduler position. A repeated spike at the same sample under healthy execution argues against treating node replacement as a complete remedy; it still does not identify one unique cause.

```figure
{
  "id": "fig-30.21",
  "kind": "matrix",
  "title": "Symptoms do not identify one failure class",
  "caption": "Illustrative logical coverage: rows are timeout, finite mismatch, nonfinite state and queue growth; columns are liveness, numerical, storage and membership checks. Filled entries require investigation, not a diagnosis.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.18",
  "alt": "Illustrative logical coverage: rows are timeout, finite mismatch, nonfinite state and queue growth; columns are liveness, numerical, storage and membership checks. Filled entries require investigation, not a diagnosis.",
  "spec": {
    "rows": 4,
    "cols": 4,
    "pattern": "explicit",
    "cells": [
      [
        1,
        0,
        1,
        1
      ],
      [
        0,
        1,
        0,
        1
      ],
      [
        0,
        1,
        0,
        0
      ],
      [
        1,
        0,
        1,
        0
      ]
    ],
    "rowLabel": "Observed symptom class",
    "colLabel": "Required diagnostic family",
    "legend": "Filled = required; empty = not sufficient alone."
  }
}
```

```figure
id: fig-30.22
kind: chart
title: False positives dominate rare-event populations
caption: Analytical sensitivity0.95 and prevalence1e-5. The curve is a conditional posterior from Eq. 30.17, not measured detector performance. The logarithmic false-positive axis resolves the rare-event transition; sensitivity is0.95 and prevalence is0.00001.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: DERIVED:eq-30.17
alt: Analytical sensitivity0.95 and prevalence1e-5. The curve is a conditional posterior from Eq. 30.17, not measured detector performance.
spec:
  type: line
  x:
    label: False-positive probability
    domain:
      - 0.000001
      - 0.01
    scale: log10
    ticks:
      - 0.000001
      - 0.00001
      - 0.0001
      - 0.001
      - 0.01
  y:
    label: Positive predictive value
    domain:
      - 0
      - 1
    ticks:
      - 0
      - 0.25
      - 0.5
      - 0.75
      - 1
  variables:
    p: 0.00001
    sens: 0.95
  series:
    - id: ppv
      label: Posterior
      emphasis: true
      dashed: false
      points:
        - - 0.000001
          - 0.90476276644073
        - - 0.0000010592537251772898
          - 0.8996856953349455
        - - 0.000001122018454301963
          - 0.8943695659975093
        - - 0.0000011885022274370189
          - 0.8888065288604414
        - - 0.0000012589254117941661
          - 0.8829888443837364
        - - 0.000001333521432163324
          - 0.8769089306053546
        - - 0.0000014125375446227554
          - 0.8705594146303571
        - - 0.0000014962356560944329
          - 0.8639331880097733
        - - 0.000001584893192461114
          - 0.8570234658974947
        - - 0.000001678804018122559
          - 0.8498238498032487
        - - 0.000001778279410038923
          - 0.8423283936817809
        - - 0.000001883649089489802
          - 0.8345316730133006
        - - 0.0000019952623149688787
          - 0.82642885643878
        - - 0.000002113489039836648
          - 0.818015779417093
        - - 0.0000022387211385683376
          - 0.8092890192707122
        - - 0.0000023713737056616552
          - 0.8002459708847189
        - - 0.0000025118864315095823
          - 0.7908849222225909
        - - 0.0000026607250597988086
          - 0.7812051287242736
        - - 0.000002818382931264455
          - 0.7712068855605928
        - - 0.0000029853826189179572
          - 0.7608915966364507
        - - 0.000003162277660168379
          - 0.7502618391671095
        - - 0.0000033496543915782793
          - 0.7393214226009736
        - - 0.000003548133892335753
          - 0.72807544063229
        - - 0.0000037583740428844434
          - 0.7165303150417515
        - - 0.000003981071705534969
          - 0.704693830125258
        - - 0.000004216965034285822
          - 0.692575156523814
        - - 0.000004466835921509635
          - 0.680184863352714
        - - 0.000004731512589614803
          - 0.6675349176468529
        - - 0.000005011872336272725
          - 0.6546386702912822
        - - 0.000005308844442309879
          - 0.6415108277908357
        - - 0.000005623413251903491
          - 0.6281674094473109
        - - 0.000005956621435290109
          - 0.6146256897536078
        - - 0.00000630957344480193
          - 0.6009041260762611
        - - 0.000006683439175686149
          - 0.5870222719747523
        - - 0.000007079457843841373
          - 0.5730006767905415
        - - 0.000007498942093324558
          - 0.5588607724227939
        - - 0.000007943282347242822
          - 0.5446247484827953
        - - 0.000008413951416451948
          - 0.5303154172762155
        - - 0.00000891250938133746
          - 0.5159560702932877
        - - 0.000009440608762859225
          - 0.5015703280837022
        - - 0.00001
          - 0.4871819855486439
        - - 0.000010592537251772897
          - 0.472814854791491
        - - 0.00001122018454301963
          - 0.4584926077271426
        - - 0.00001188502227437019
          - 0.4442386206557647
        - - 0.000012589254117941661
          - 0.43007582295963437
        - - 0.00001333521432163324
          - 0.4160265519834574
        - - 0.000014125375446227555
          - 0.402112416012649
        - - 0.000014962356560944327
          - 0.3883541670757359
        - - 0.00001584893192461114
          - 0.3747715850729724
        - - 0.000016788040181225588
          - 0.36138337448110247
        - - 0.00001778279410038923
          - 0.3482070746123319
        - - 0.00001883649089489802
          - 0.3352589841227836
        - - 0.000019952623149688786
          - 0.32255410018052827
        - - 0.000021134890398366476
          - 0.3101060724240453
        - - 0.00002238721138568338
          - 0.2979271715760942
        - - 0.000023713737056616554
          - 0.28602827233197137
        - - 0.000025118864315095822
          - 0.27441884992038834
        - - 0.000026607250597988085
          - 0.26310698954368456
        - - 0.00002818382931264455
          - 0.252099407744613
        - - 0.00002985382618917957
          - 0.24140148462087033
        - - 0.000031622776601683795
          - 0.2310173057161104
        - - 0.000033496543915782794
          - 0.22094971235653726
        - - 0.000035481338923357534
          - 0.21120035917343774
        - - 0.00003758374042884443
          - 0.20176977755169012
        - - 0.000039810717055349695
          - 0.19265744376919716
        - - 0.00004216965034285822
          - 0.18386185063883695
        - - 0.00004466835921509635
          - 0.17538058152923605
        - - 0.00004731512589614803
          - 0.16721038571963465
        - - 0.00005011872336272725
          - 0.1593472541337374
        - - 0.00005308844442309879
          - 0.15178649459424395
        - - 0.00005623413251903491
          - 0.14452280584056051
        - - 0.000059566214352901096
          - 0.1375503496542383
        - - 0.00006309573444801929
          - 0.13086282053748047
        - - 0.00006683439175686149
          - 0.12445351248762854
        - - 0.00007079457843841373
          - 0.11831538250322683
        - - 0.00007498942093324559
          - 0.11244111054381149
        - - 0.00007943282347242822
          - 0.10682315574512301
        - - 0.00008413951416451947
          - 0.10145380876336743
        - - 0.00008912509381337459
          - 0.0963252401862088
        - - 0.00009440608762859227
          - 0.09142954500427362
        - - 0.0001
          - 0.08675878318523457
        - - 0.00010592537251772886
          - 0.082305016433333
        - - 0.0001122018454301963
          - 0.07806034125088378
        - - 0.00011885022274370189
          - 0.07401691844542287
        - - 0.00012589254117941674
          - 0.07016699924724279
        - - 0.0001333521432163324
          - 0.06650294821772473
        - - 0.0001412537544622754
          - 0.0630172631397213
        - - 0.00014962356560944327
          - 0.059702592087863916
        - - 0.00015848931924611142
          - 0.05655174787965065
        - - 0.00016788040181225607
          - 0.053557720108058246
        - - 0.00017782794100389227
          - 0.05071368495372705
        - - 0.00018836490894898002
          - 0.04801301296996421
        - - 0.00019952623149688788
          - 0.04544927502731708
        - - 0.00021134890398366476
          - 0.04301624659667045
        - - 0.000223872113856834
          - 0.040707910541050434
        - - 0.00023713737056616554
          - 0.038518458576865415
        - - 0.00025118864315095795
          - 0.03644229155543396
        - - 0.00026607250597988083
          - 0.0344740187055492
        - - 0.0002818382931264455
          - 0.032608455967690186
        - - 0.000298538261891796
          - 0.03084062354045665
        - - 0.00031622776601683794
          - 0.02916574274999218
        - - 0.00033496543915782756
          - 0.02757923234366619
        - - 0.0003548133892335753
          - 0.02607670430017452
        - - 0.0003758374042884443
          - 0.024653959239547805
        - - 0.00039810717055349735
          - 0.023306981508358336
        - - 0.00042169650342858224
          - 0.022031934007713538
        - - 0.00044668359215096305
          - 0.020825152824428806
        - - 0.0004731512589614803
          - 0.01968314171908342
        - - 0.0005011872336272725
          - 0.018602566518477345
        - - 0.0005308844442309885
          - 0.0175802494543103
        - - 0.0005623413251903491
          - 0.016613163484680643
        - - 0.0005956621435290103
          - 0.015698426630232777
        - - 0.000630957344480193
          - 0.014833296352442045
        - - 0.0006683439175686149
          - 0.014015163997594575
        - - 0.000707945784384138
          - 0.013241549326469612
        - - 0.0007498942093324559
          - 0.01251009514653809
        - - 0.0007943282347242813
          - 0.011818562060629763
        - - 0.0008413951416451947
          - 0.011164823343464952
        - - 0.0008912509381337459
          - 0.010546859955174086
        - - 0.0009440608762859235
          - 0.00996275569891373
        - - 0.001
          - 0.009410692527910132
        - - 0.0010592537251772887
          - 0.008888946005700036
        - - 0.001122018454301963
          - 0.008395880921972219
        - - 0.001188502227437019
          - 0.007929947065225254
        - - 0.0012589254117941675
          - 0.007489675152428572
        - - 0.001333521432163324
          - 0.007073672914989686
        - - 0.001412537544622754
          - 0.006680621339575724
        - - 0.0014962356560944327
          - 0.006309271061697873
        - - 0.001584893192461114
          - 0.005958438909431277
        - - 0.0016788040181225606
          - 0.005627004594198376
        - - 0.0017782794100389228
          - 0.00531390754518026
        - - 0.0018836490894898002
          - 0.005018143883629276
        - - 0.001995262314968879
          - 0.004738763533127591
        - - 0.0021134890398366475
          - 0.004474867461663546
        - - 0.00223872113856834
          - 0.004225605051273179
        - - 0.0023713737056616554
          - 0.003990171590911749
        - - 0.0025118864315095794
          - 0.0037678058881744155
        - - 0.0026607250597988083
          - 0.0035577879954705265
        - - 0.002818382931264455
          - 0.003359437046268546
        - - 0.0029853826189179603
          - 0.003172109197063947
        - - 0.0031622776601683794
          - 0.0029951956707770138
        - - 0.003349654391578276
          - 0.002828120897358422
        - - 0.0035481338923357532
          - 0.0026703407474645588
        - - 0.003758374042884443
          - 0.002521340855159683
        - - 0.003981071705534973
          - 0.002380635025705883
        - - 0.004216965034285823
          - 0.002247763724612387
        - - 0.0044668359215096305
          - 0.002122292644231739
        - - 0.0047315125896148025
          - 0.0020038113443098643
        - - 0.005011872336272725
          - 0.0018919319630191828
        - - 0.005308844442309885
          - 0.0017862879951274523
        - - 0.005623413251903491
          - 0.0016865331340789704
        - - 0.005956621435290103
          - 0.0015923401748885518
        - - 0.00630957344480193
          - 0.0015033999748713732
        - - 0.006683439175686149
          - 0.0014194204693530302
        - - 0.00707945784384138
          - 0.001340125739623366
        - - 0.007498942093324558
          - 0.0012652551305144522
        - - 0.007943282347242814
          - 0.0011945624150972865
        - - 0.008413951416451947
          - 0.0011278150041029215
        - - 0.008912509381337459
          - 0.0010647931977818125
        - - 0.009440608762859235
          - 0.0010052894780199538
        - - 0.01
          - 0.0009491078386316862
  annotations:
    - x: 0.000009500095000950009
      y: 0.5
      label: Equal expected true and false alerts
```

## Algorithm

### Algorithm 30.4 — Diagnose, fence and qualify recovery

[DERIVED] Inputs are a symptom record, committed predecessor, generation map, bounded diagnostic budget and candidate repair paths. Output is continued execution under a validated contract, checkpoint restore, or quarantined failure. No branch guesses numerical validity from process liveness.

$$
\begin{aligned}
1.&\quad z\leftarrow\operatorname{capture}(\text{rank, step, phase, generation, last completed event}).\\
2.&\quad \operatorname{fence\_optimizer\_commit};\quad\operatorname{request\_quiescence}(t_{\max}).\\
3.&\quad \mathcal H\leftarrow\operatorname{classify\_hypotheses}(z,\text{health, sequence, queues, numerical checks}).\\
4.&\quad \neg\operatorname{control\_agreement}\ \lor\ t>t_{\max}\ \Longrightarrow\ \operatorname{retire\_generation}.\\
5.&\quad \exists h\in\mathcal H:\operatorname{state\_may\_be\_corrupt}(h)\ \Longrightarrow\ \operatorname{quarantine\_state}.\\
6.&\quad \operatorname{qualified\_repair}(\mathcal H,\mathcal Q_k)\ \Longrightarrow\ \operatorname{repair},\operatorname{validate\_all\_ranks}.\\
7.&\quad \mathcal E\leftarrow\{j:E(j)\};\quad\neg\operatorname{repair\_validated}\land\mathcal E=\varnothing\Longrightarrow\operatorname{return\_failed}.\\
8.&\quad \neg\operatorname{repair\_validated}\land\mathcal E\ne\varnothing\Longrightarrow\operatorname{restore}(\max\mathcal E).\\
9.&\quad \operatorname{publish\_incident}(z,\mathcal H,\text{action, evidence, unresolved alternatives}).
\end{aligned}
$$
*(Eq. 30.20)*

[MATHEMATICALLY-DERIVED] The invariant excludes optimizer commits between suspicion and a globally accepted recovery decision. Termination is bounded by diagnosis/repair deadlines and a finite fallback path; unavailable valid checkpoints end in explicit failure. Metadata inspection costs scale with events and ranks. Shadow replay can cost a complete step; tensor comparison adds a full read of compared values; hashing adds traffic even if its output is small.

## Implementation

[OFFICIAL-DOCUMENTATION] Megatron-Core 0.19.0 records a convergence issue for one fused cross-entropy path and a grouped all-to-all corruption issue in a specific transport stack [R30.11, Known Issues]. These are version-specific disclosures, not evidence that every divergence is a model problem or every all-to-all implementation is corrupt. The proposed classifier retains model, kernel and transport hypotheses separately.

[DERIVED] Implement endpoint health outside the failed data plane. Preserve per-rank logs and communicator generations before process teardown. Limit diagnostic tensor dumps by bytes and retention policy; otherwise instrumentation can trigger the storage failure being diagnosed. Detection adds no trainable parameters, but redundant computation adds FLOPs, reads and latency; false alarms add replayed tokens and restore cost. Energy, money and incident rates are UNVERIFIED without deployment records. Never infer those costs from injected event frequency.

```figure
{
  "id": "fig-30.23",
  "kind": "compare",
  "title": "Restart, context repair and numerical replay",
  "caption": "The comparison concerns the state premise required for each action. A surviving process is insufficient evidence for any action that assumes correct device state.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.20",
  "alt": "The comparison concerns the state premise required for each action. A surviving process is insufficient evidence for any action that assumes correct device state.",
  "spec": {
    "axis": "Required state premise before recovery",
    "columns": [
      {
        "id": "restart",
        "label": "Durable restart"
      },
      {
        "id": "repair",
        "label": "Context repair"
      },
      {
        "id": "replay",
        "label": "Clean-step replay"
      }
    ],
    "rows": [
      {
        "dimension": "Lost device state",
        "values": {
          "restart": "Recover from checkpoint",
          "repair": "Not eligible",
          "replay": "Requires predecessor copy"
        }
      },
      {
        "dimension": "Possibly corrupt state",
        "values": {
          "restart": "Select known clean anchor",
          "repair": "Reject",
          "replay": "Restore predecessor first"
        }
      },
      {
        "dimension": "Data requirement",
        "values": {
          "restart": "Saved cursor and policy",
          "repair": "Same committed frontier",
          "replay": "Same batch and RNG"
        }
      },
      {
        "dimension": "Main cost",
        "values": {
          "restart": "Allocation, load and lost work",
          "repair": "Qualification and rebinding",
          "replay": "Repeated computation and comparison"
        }
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[PAPER-REPORTED] The instruction-level study injects targeted HMMA input-register faults in single-GPU models and evaluates recomputation with 60M/350M/1.3B variants; Table I reports multiple seeds [R30.8, §IV, VII]. TrainSDC separately characterizes compact models and evaluates protection on Llama3.2-1B/Qwen3-0.6B under specified sparse/dense injections [R30.9, §3,5]. The gate-level study covers63 CUDA microbenchmarks and stuck-at faults on an undisclosed production-class design [R30.10, §II–V]. These fault distributions are different; none supplies a universal fleet event rate.

[PAPER-REPORTED] The protocols deliberately inject different faults [R30.8, §IV,VII; R30.9, §5, Appendix A; R30.10, §IV–V].

| Field | Instruction-level study | TrainSDC | Gate-level study |
|---|---|---|---|
| Workload |60M/350M/1.3B LLaMA, AdamW | Llama3.2-1B/Qwen3-0.6B evaluation; compact-model characterization |63CUDA microbenchmarks |
| Fault/budget | HMMA input register;10000 steps; average once/100 steps,1–5 step duration | Sparse/dense selected-node injection;100 clean calibration steps;814 clean deployment steps/network | Stuck-at gate simulations;600M observed output corruptions |
| Baseline/ablation | Clean, injected, injected plus recomputation | Q/K checks, residual guard and exponent-scaling ablations | Fault-pattern/format/address classes |
| Seeds/precision |12/6/3 seeds; exact hardware/precision use source configuration | Three813-event fault traces/network; BF16 exponent study separate | Production-class design unnamed; multiple output formats |
| Limitation | Faults disabled during recomputation; single GPU | Guard history seeded separately on restart | No production event-prevalence estimate |

[PAPER-REPORTED] Recomputation returns evaluation loss near the clean baseline in the instruction study; that experiment does not reinject during replay [R30.8, TableI]. TrainSDC records missed forward events and clean alarms: combined FPR1/1628; sparse10-element recall43.42%/40.94% for the two models [R30.9, Appendix A, Table5]. [DERIVED] Zero alarms in a short calibration holdout is therefore not a proof of zero deployment false alarms or complete detection.

## Observations

**What the paper claims.** [PAPER-REPORTED] The studies report that corruption location, exponent behavior and instruction-level propagation influence training damage [R30.8, §V; R30.9, §3–5; R30.10, §V].

**What the evidence shows.** [DERIVED] Their interventions establish sensitivity under declared injection models. They do not prove that software bit flips match every deployed hardware fault, or that a detector retains its reported behavior on a larger distributed model.

**What we infer.** [MATHEMATICALLY-DERIVED] Eq. 30.17 requires prevalence and false-positive accounting; Eq. 30.18 requires global rejection before committing an update. A finite-only screen cannot exclude all finite corruption by definition.

**What remains unknown.** [UNVERIFIED] Real deployment prevalence, correlated failures, detector calibration and distributed recovery correctness have not been independently measured here.

## Failure modes

> **Failure mode — Symptom promoted to root cause.** [DERIVED] *Symptom:* every watchdog timeout triggers device quarantine. *Cause:* no phase/peer evidence. *Detection:* incidents recur after replacement. *Mitigation:* preserve alternative hypotheses and discriminate with ordered traces.

> **Failure mode — Rank-local skipped update.** [MATHEMATICALLY-DERIVED] *Symptom:* parameter versions diverge after an alarm. *Cause:* only one rank suppresses optimizer execution. *Detection:* global version/state check. *Mitigation:* globally agreed rejection or generation retirement.

```figure
{
  "id": "fig-30.24",
  "kind": "stat-panel",
  "title": "Incident evidence has distinct confidence levels",
  "caption": "The ledger separates an observed symptom from a qualified recovery premise. An unresolved cause remains unresolved after a successful restart.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-30.20",
  "alt": "The ledger separates an observed symptom from a qualified recovery premise. An unresolved cause remains unresolved after a successful restart.",
  "spec": {
    "header": "Incident evidence has distinct confidence levels",
    "rows": [
      {
        "key": "Symptom",
        "value": "Observed event and boundary"
      },
      {
        "key": "Hypotheses",
        "value": "Multiple retained causes"
      },
      {
        "key": "State validity",
        "value": "Checked or unknown"
      },
      {
        "key": "Action",
        "value": "Premise and deadline"
      },
      {
        "key": "Closure",
        "value": "Evidence versus unresolved cause"
      }
    ]
  },
  "anchor": "failure-modes"
}
```

## Siblings

[DERIVED] **Numerical kernel equivalence**, [Chapter26](../ch26-kernel-programming-and-numerical-equivalence/README.md), evaluates a known optimization against a reference; incident diagnosis considers unknown failures. **Observability**, [§30.5](30-5-observability.md), supplies evidence but does not authorize recovery. **Recovery**, [§30.6](30-6-recovery-and-reproducibility.md), acts only after the state premise is established or conservatively replaced.

## Extensions

### Improvements

[PAPER-REPORTED] TrainSDC replaces uniform protection with path- and exponent-dependent checks and includes component ablations [R30.9, §4–5]. Its cost and effectiveness remain conditional on that model and injection protocol. [DERIVED] New numerical formats or fused operators change exponent and propagation behavior; transfer of a detector requires a fresh characterization, rather than retaining a threshold solely because its source is recent.

## Limitations

[DERIVED] No finite diagnostic set proves absence of every silent error. A successful replay can share a persistent fault, and a hash can preserve already-invalid state. The conservative protocol sacrifices progress when qualification is unavailable. That is a stated consistency choice; its operational value requires measured false alarms, recovery time and retained training quality.

## Reproducibility

[DERIVED] Retain fault class, injection site/distribution, affected ranks, pre/post state, input IDs, RNG, detector thresholds, false alarms, healthy baselines and recovery decisions. Keep production events separate from synthetic injections. [UNVERIFIED] No fault injection or independent reproduction was performed for this edition.

## References

[R30.8] instruction-level SDC study; [R30.9] TrainSDC; [R30.10] gate-level pattern study; [R30.11] Megatron-Core Known Issues. Full versions and locators appear in [references](references.md).
