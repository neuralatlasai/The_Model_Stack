---
id: ms.verification.6
entity_type: verification
title: Preregistered experiment and benchmark manifest
short_title: Data quality versus compute
volume: 1
part: 1
chapter: 6
section: null
slug: verification
parent: ms.chapter.6
prev_sibling: ms.section.6.6
next_sibling: ms.references.6
children: []
prerequisites: [ms.section.6.1, ms.section.6.2, ms.section.6.3, ms.section.6.4, ms.section.6.5, ms.section.6.6]
downstream: [ms.chapter.8, ms.chapter.9, ms.chapter.21]
related: []
relations: [{type: supported_by, target: paper.P07}, {type: supported_by, target: paper.P50}]
axes: {lifecycle: [data, pretraining, evaluation], mechanism: [budget_matching, factorial_design, evidence_replay], feedback_setting: [], modality: [text]}
papers: [P07, P50]
implementations: [impl.pytorch, impl.torchtitan, impl.nanotron]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [ASSUMED, DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, UNVERIFIED], empirically_observed: false}
word_count_target: 1800
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Verification — Data quality versus extra compute

## Artifact specification

**ASSUMED.** The artifact is a proposed six-file evidence package. This chapter specifies its schema and an illustrative design; it does not supply fabricated hashes, checkpoints, or outcomes. The package becomes an actual preregistration only after all required revisions are resolved and the commitment is retained before observing relevant outcomes.

| File | Required records and fields |
|---|---|
| `prereg.yaml` | Hypothesis id; population; primary contrast; primary metric and task weights; δ; confidence/error allocation; factors and levels; independent seed list; tuning budget; matched resource; tolerance; stopping rule; failure policy; estimator and power-planning assumptions; registration timestamp provenance |
| `benchmark_manifest.yaml` | Per-task capability measured, task construction, metric, dataset revision and hashes, contamination risks, protocol, limitations, comparability; nine evaluation-unit components from §6.1; checkpoint/tokenizer/template/scaffold identities; scorer and analysis revisions; hardware/runtime/kernel configuration; resource-accounting method |
| `partition.yaml` | Immutable pool hash; consumed training ids; development and test ids; role map; group-key definition; timestamps and provenance; cut-off; quarantine ids and reasons; classifier-positive/negative source ids; decontamination version; test-exposure ledger |
| `outcomes.jsonl` | Manifest id; arm/run/seed/task/item/cluster/sample/attempt ids; rendered prompt hash; response reference and hash; score; terminal status; failure reason; sampling settings; token counts; monotonic timing events; consumed FLOPs and accelerator-hours; actual charging boundary |
| `negative_results.md` | Every registered contrast; estimate and interval; feasibility; relation to ±δ; planned/completed/failed runs; unsupported hypothesis; uncertainty and extrapolation envelope |
| `deviations.md` | Timestamp; original manifest hash; changed field; reason; outcomes already visible; impact on confirmatory interpretation; replacement version and retained original |

**DERIVED.** Large logs may be physically sharded while `outcomes.jsonl` remains the logical record schema. An immutable shard index belongs to the manifest. Raw model outputs required for rescoring are referenced artifacts, not substitute aggregate scores. Restricted data retain access and retention rules; public hashes alone do not permit full reproduction.

## Verification task

### Experiment 6.7 — Separate filtering, training budget, and total resource cost

- **Hypothesis:** a fixed data-selection intervention improves held-out quality by more than δ at matched training compute, and its advantage survives comparison with an unfiltered baseline allowed the same total compute.
- **Setup:** proposal; cross filter off/on with two consumed-token budgets at fixed architecture, tokenizer, sequence length, optimiser schedule rule, and evaluation protocol. Add one unfiltered top-up arm at each budget. Run every arm with the same registered set of independent training-seed blocks.
- **Independent variables:** filtering intervention; consumed-token budget; whether the unfiltered baseline receives a total-compute top-up.
- **Controlled variables:** initialisation distribution, model parameter count, raw source pool, non-filter cleaning/deduplication, data-order generation procedure, loss masks, sequence packing, training precision, tuning budget, scorer, test partition, task weights.
- **Dataset/workload:** one immutable web-text candidate pool; quality-filter fitting uses training/development data only. Evaluate both a preregistered general task suite and a separately held-out transfer domain absent from the filter's fitting sources. Preserve cluster ids and decontaminate before registration.
- **Hardware:** one pinned accelerator topology for training; one fixed evaluation topology. Actual device, driver, runtime, memory configuration, and repository commits are UNVERIFIED and must be resolved before execution. No named model performance is predicted.
- **Metrics:** fixed-weight mean task score; paired per-task and suite differences; training-seed variance; cluster-conditional uncertainty; consumed training FLOPs, curation/tuning/evaluation FLOPs, accelerator-hours, retained unique tokens, repetition count, failures, energy and money where measured.
- **Baselines:** unfiltered at the same training budget; unfiltered at the same total compute; the larger unfiltered budget distinguishes an ordinary scaling gain from a filtering gain.
- **Expected result:** none asserted. The design can distinguish a filtering effect, a training-budget effect, their interaction, and a total-resource opportunity cost.
- **Ablation:** filter on/off at each budget; unfiltered compute top-up; domain-stratified transfer; a sensitivity analysis over δ and curation-cost allocation, declared before outcomes.
- **Interpretation:** support the practical filtering claim only if its registered lower confidence bound exceeds δ at the relevant matched boundary. An interval wholly inside [−δ,δ] rejects a practically meaningful advantage at that boundary under the specified equivalence rule. A wide interval is inconclusive. A gain confined to filter-like tasks limits transfer and does not identify contamination without additional evidence.
- **Threats to validity:** filter-induced repetition, unequal unique-data coverage, missing CPU curation costs, incompatible FLOP counting, seed-by-data interactions, benchmark-informed selection, hidden training failures, temporal ambiguity, and insufficient independent runs.

```figure
id: fig-6.32
kind: diagram
title: Protocol of Experiment 6.7, from pool to decision
caption: >-
  Every arm draws from one immutable pool, and the filter is fitted on
  training and development data only. The six arms, each with five seed
  blocks, meet in a single checkpoint set that is evaluated on the fixed
  suite and on the held-out transfer domain. The heavy path is the
  registered primary contrast, filtered high budget against its
  total-compute top-up, compared within seed blocks and then against ±δ.
  The resource ledger enters twice: it sizes the top-ups, and its 1 % gate
  must pass before any interval is read. Nothing here has been run.
placement: wide
evidence: ASSUMED
source: ["DERIVED:eq-6.8", "DERIVED:eq-6.9", "DERIVED:eq-6.3", P07]
concepts: [ms.verification.6]
alt: >-
  Left-to-right diagram of Experiment 6.7. An immutable web-text pool feeds
  a quality filter fitted on training and development data only, and a
  partition step that freezes the test suite and the held-out transfer
  domain with cluster ids after decontamination. Six arms, each with five
  seed blocks: U_low and F_low at 2.0 billion tokens (1.2 × 10¹⁸ FLOPs),
  U_high and F_high at 4.0 billion (2.4 × 10¹⁸), and top-up arms U_low_top
  and U_high_top that add ΔD = 10⁸ tokens. The filtered arms take the
  filtered pool. A resource ledger (training, curation, tuning and
  evaluation FLOPs, and accelerator-hours) sets the top-ups. All 30 runs
  produce checkpoints, evaluated on the general suite and the transfer
  domain. Per seed block, weighted paired differences feed the emphasised
  primary contrast, F_high against U_high_top, and the secondary contrasts
  (filter at each budget and the interaction), multiplicity-adjusted or
  exploratory. The decision branch compares the registered interval with 0
  and ±δ, δ = 0.01: improvement, equivalence, or unresolved. The acceptance
  gates must pass first. Every outcome goes to negative_results.md,
  deviations.md and outcomes.jsonl.
spec:
  direction: LR
  nodes:
    - { id: pool, kind: dataset, label: "immutable web-text pool", sub: "hash in partition.yaml" }
    - { id: fit, kind: process, label: "fit quality filter", sub: "train/dev sources only" }
    - { id: part, kind: boundary, label: "partition + decontamination", sub: "test suite, transfer domain, cluster ids" }
    - { id: led, kind: dependency, label: "resource ledger", sub: "train, curate, tune, eval FLOPs; accel-hours" }
    - { id: ul, kind: process, label: "U_low", sub: "2.0B tokens, 1.2e18 FLOPs", group: arms }
    - { id: fl, kind: process, label: "F_low", sub: "2.0B tokens, 1.2e18 FLOPs", group: arms }
    - { id: uh, kind: process, label: "U_high", sub: "4.0B tokens, 2.4e18 FLOPs", group: arms }
    - { id: fh, kind: process, label: "F_high", sub: "4.0B tokens, 2.4e18 FLOPs", group: arms }
    - { id: ult, kind: process, label: "U_low_top", sub: "2.0B + ΔD_low tokens", group: arms }
    - { id: uht, kind: process, label: "U_high_top", sub: "4.0B + ΔD_high tokens", group: arms }
    - { id: ck, kind: model, label: "30 checkpoints", sub: "6 arms × 5 seed blocks" }
    - { id: eg, kind: metric, label: "general task suite", sub: "fixed task weights", group: ana }
    - { id: et, kind: metric, label: "held-out transfer domain", sub: "absent from filter sources", group: ana }
    - { id: diff, kind: process, label: "per seed block: weighted paired differences", group: ana }
    - { id: prim, kind: metric, label: "primary: F_high vs U_high_top", sub: "total-compute contrast", group: ana }
    - { id: sec, kind: metric, label: "secondary: filter per budget; interaction", sub: "adjusted or exploratory", group: ana }
    - { id: gate, kind: dependency, label: "acceptance gates", sub: "identity, partition, budget ±1 %, completion" }
    - { id: dec, kind: branch, label: "interval vs 0 and ±δ", sub: "δ = 0.01, α = 0.05", emphasis: true }
    - { id: o1, kind: state, label: "practical improvement", sub: "lower bound > δ" }
    - { id: o2, kind: state, label: "equivalence", sub: "interval inside ±δ" }
    - { id: o3, kind: state, label: "unresolved", sub: "wide interval: inconclusive" }
    - { id: out, kind: memory, label: "negative_results.md · deviations.md · outcomes.jsonl" }
  edges:
    - { from: pool, to: fit }
    - { from: pool, to: part }
    - { from: pool, to: ul }
    - { from: pool, to: uh }
    - { from: fit, to: fl, label: "filtered pool" }
    - { from: fit, to: fh, label: "filtered pool" }
    - { from: led, to: ult, kind: dependency, label: "sets ΔD" }
    - { from: led, to: uht, kind: dependency, label: "sets ΔD" }
    - { from: ul, to: ck }
    - { from: fl, to: ck }
    - { from: uh, to: ck }
    - { from: fh, to: ck }
    - { from: ult, to: ck }
    - { from: uht, to: ck }
    - { from: ck, to: eg }
    - { from: ck, to: et }
    - { from: part, to: eg, kind: dependency }
    - { from: part, to: et, kind: dependency }
    - { from: eg, to: diff, kind: emphasis }
    - { from: et, to: diff }
    - { from: diff, to: prim, kind: emphasis }
    - { from: diff, to: sec }
    - { from: prim, to: dec, kind: emphasis }
    - { from: sec, to: dec }
    - { from: gate, to: dec, kind: dependency, label: "must pass first" }
    - { from: dec, to: o1 }
    - { from: dec, to: o2 }
    - { from: dec, to: o3 }
    - { from: dec, to: out, label: "every outcome" }
  groups:
    - { id: arms, label: "six arms, five seed blocks each" }
    - { id: ana, label: "registered analysis" }
```

### Illustrative design instance

**ASSUMED.** These values are planning inputs, not measurements: N = 100,000,000 dense parameters; D_low = 2,000,000,000 consumed training tokens; D_high = 4,000,000,000; T = 1,024; five independent training-seed blocks; δ = 0.01 absolute score units; primary family error budget α = 0.05. The tokeniser and model remain fixed. The analytic estimate C_train ≈ 6ND is used only for preliminary scheduling; actual matching must use the declared operation-count model including material attention and recomputation terms.

| Arm | Filter | Consumed tokens | Approximate training FLOPs | Comparison role |
|---|---|---|---|---|
| U_low | off | 2.0 billion | 1.2 × 10¹⁸ | low-budget training baseline |
| F_low | on | 2.0 billion | 1.2 × 10¹⁸ | low-budget filter effect |
| U_high | off | 4.0 billion | 2.4 × 10¹⁸ | high-budget training baseline |
| F_high | on | 4.0 billion | 2.4 × 10¹⁸ | high-budget filter effect |
| U_low_top | off | 2.0 billion + ΔD_low | 1.2 × 10¹⁸ + ΔC_low | low-budget total-compute baseline |
| U_high_top | off | 4.0 billion + ΔD_high | 2.4 × 10¹⁸ + ΔC_high | high-budget total-compute baseline |

**MATHEMATICALLY-DERIVED.** Under the simplified 6N per-token accounting, ΔD_budget = ΔC_budget/(6N), where ΔC_budget is the *difference* in non-training cost between the filtered arm and its unfiltered baseline. Common cleaning, equal evaluation, and equal tuning costs cancel. For an assumed incremental filtering cost of 6 × 10¹⁶ FLOPs allocated per run, ΔD = 100,000,000 tokens. Five seed blocks across six arms give 30 planned training runs. If that same incremental cost applies at both budgets, their approximate total training cost is 5·[3·1.2 × 10¹⁸ + 3·2.4 × 10¹⁸ + 2·6 × 10¹⁶] = 5.46 × 10¹⁹ FLOPs, excluding curation, tuning, evaluation, and approximation error.

```figure
id: fig-6.33
kind: memory-stack
title: FLOPs per arm in the illustrative design instance
caption: >-
  Each bar is one arm's five seed blocks. Pairs of bars are equal on the
  resource their contrast names. U_low and F_low match on training FLOPs.
  F_low, with its allocated curation, matches U_low_top, with its top-up
  training, on total compute. The training segments, top-ups included, sum
  to the text's 5.46 × 10¹⁹. The curation segments are the ASSUMED 6 × 10¹⁶
  per run and are excluded from that sum, as the text says. 6ND is the
  scheduling approximation, not the matched operation count.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.8"
alt: >-
  Six stacked bars of FLOPs for five seed blocks each, with N = 10⁸, D_low
  = 2 × 10⁹, D_high = 4 × 10⁹ and an ASSUMED 6 × 10¹⁶ incremental curation
  FLOPs per run. U_low: training 6.0 × 10¹⁸. F_low: training 6.0 × 10¹⁸
  plus allocated curation 3.0 × 10¹⁷, total 6.3 × 10¹⁸. U_low_top: training
  6.0 × 10¹⁸ plus top-up training 3.0 × 10¹⁷, total 6.3 × 10¹⁸. U_high:
  1.2 × 10¹⁹. F_high: 1.2 × 10¹⁹ plus curation 3.0 × 10¹⁷. U_high_top:
  1.2 × 10¹⁹ plus top-up 3.0 × 10¹⁷. Training including top-ups sums to
  5.46 × 10¹⁹ FLOPs over 30 runs.
spec:
  format: flops
  variables: { N: 1.0e8, Dl: 2.0e9, Dh: 4.0e9, dC: 6.0e16, s: 5 }
  bars:
    - label: "U_low × 5"
      segments:
        - { label: "training, 6·N·D_low", kind: process, formula: "s*6*N*Dl" }
    - label: "F_low × 5"
      segments:
        - { label: "training, 6·N·D_low", kind: process, formula: "s*6*N*Dl" }
        - { label: "curation, allocated (ASSUMED)", kind: dependency, formula: "s*dC" }
    - label: "U_low_top × 5"
      segments:
        - { label: "training, 6·N·D_low", kind: process, formula: "s*6*N*Dl" }
        - { label: "top-up training, 6·N·ΔD", kind: process, formula: "s*dC" }
    - label: "U_high × 5"
      segments:
        - { label: "training, 6·N·D_high", kind: process, formula: "s*6*N*Dh" }
    - label: "F_high × 5"
      segments:
        - { label: "training, 6·N·D_high", kind: process, formula: "s*6*N*Dh" }
        - { label: "curation, allocated (ASSUMED)", kind: dependency, formula: "s*dC" }
    - label: "U_high_top × 5"
      segments:
        - { label: "training, 6·N·D_high", kind: process, formula: "s*6*N*Dh" }
        - { label: "top-up training, 6·N·ΔD", kind: process, formula: "s*dC" }
```

**ASSUMED.** Curation cost is first measured or estimated on a development-only pilot with an explicit operation ledger. If CPU or storage work cannot be translated into comparable FLOPs, retain it as separate CPU-time, energy, and monetary quantities; do not call a GPU-only ledger matched total resource cost. If filtering is performed once and reused across seeds, publish both first-use and actual amortised ledgers. The proposed top-up comparison uses a declared per-run allocation, with the reuse count in the manifest.

**DERIVED.** The low/high budgets are factor levels, so they must not be equalised against each other. Matching occurs within each declared contrast: U_low versus F_low, U_high versus F_high, and each filtered arm versus its corresponding top-up. Applying one maximum budget across all six arms would destroy the training-budget factor. A top-up changes consumed tokens intentionally; it answers an opportunity-cost question and is not the same estimand as the training-matched filter effect.

```figure
id: fig-6.34
kind: stat-panel
title: Incremental curation cost against the 1 % budget gate
caption: >-
  This joins the design instance to the Budget gate. At the low budget the
  ASSUMED incremental curation cost is 5 % of training compute, five times
  the 1 % matching tolerance. Without the top-up arm the total-compute
  contrast would fail its own gate. At the high budget it is still 2.5
  times the tolerance. Both figures rest on a curation cost that this
  edition did not measure.
placement: rail
anchor: verification-task
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-6.8"
alt: >-
  Instrument panel at N = 10⁸ with an ASSUMED incremental curation cost of
  6 × 10¹⁶ FLOPs per run and a 1 % budget tolerance. At D = 2 × 10⁹:
  C_train = 1.2 × 10¹⁸, top-up ΔD = 10⁸ tokens, the curation cost is 5 % of
  C_train, the tolerance is 1.2 × 10¹⁶ FLOPs, and the curation cost is 5.0
  times the tolerance. At D = 4 × 10⁹: 2.4 × 10¹⁸, ΔD = 10⁸, 2.5 %,
  tolerance 2.4 × 10¹⁶, 2.5 times. Fixed rows: 30 planned runs, and
  5.46 × 10¹⁹ training FLOPs in total.
spec:
  header: "BUDGET GATE · MATCHED WITHIN 1 %"
  variables: { N: 1.0e8, D: 2.0e9, dC: 6.0e16, tol: 0.01 }
  rows:
    - { key: "C_train ≈ 6·N·D", formula: "6*N*D", format: flops }
    - { key: "top-up ΔD = ΔC/(6N)", formula: "dC/(6*N)", format: tokens }
    - { key: "ΔC_curate ÷ C_train", formula: "dC/(6*N*D)", format: percent, note: "ΔC is ASSUMED, not measured" }
    - { key: "1 % matching tolerance", formula: "tol*6*N*D", format: flops }
    - { key: "ΔC_curate ÷ tolerance", formula: "dC/(tol*6*N*D)", format: ratio }
    - { key: "planned training runs", value: "30 = 6 arms × 5 seed blocks" }
    - { key: "training FLOPs, all runs", value: "5.46 × 10¹⁹" }
states:
  - { anchor: verification-task, label: "D_low = 2 × 10⁹", variables: { N: 1.0e8, D: 2.0e9, dC: 6.0e16, tol: 0.01 }, highlight: ["ΔC_curate ÷ C_train", "ΔC_curate ÷ tolerance", "top-up ΔD = ΔC/(6N)"], note: "The low budget's curation increment is 5 % of training, five times the gate, so the U_low_top arm is required: without it, F_low vs U_low cannot be called total-matched." }
  - { anchor: acceptance-criteria, label: "D_high = 4 × 10⁹", variables: { N: 1.0e8, D: 4.0e9, dC: 6.0e16, tol: 0.01 }, highlight: ["1 % matching tolerance", "ΔC_curate ÷ tolerance"], note: "Budget gate at the high budget: the tolerance doubles to 2.4 × 10¹⁶, and the same increment is still 2.5 times over. The gate rejects any contrast matched outside it." }
  - { anchor: what-this-edition-did-not-do, label: "ΔC unmeasured", variables: { N: 1.0e8, D: 2.0e9, dC: 6.0e16, tol: 0.01 }, highlight: ["ΔC_curate ÷ C_train", "planned training runs"], note: "No curation cost was measured and no run was executed. The 6 × 10¹⁶ that sizes every top-up is ASSUMED until a development-only pilot ledger replaces it." }
```

### Analysis and decision rules

**ASSUMED.** Make the high-budget total-compute contrast the primary contrast, evaluated on a fixed task suite. For each independent training-seed block, compute the complete weighted paired difference, then use the registered seed-block interval. Report a separate cluster-conditional interval for fixed checkpoints; do not pretend the two intervals jointly establish generalisation to new task populations. Secondary contrasts and the filter-by-budget interaction receive a declared multiplicity adjustment, or are explicitly exploratory.

**MATHEMATICALLY-DERIVED.** The interaction contrast is `(F_high − U_high) − (F_low − U_low)` in score units. Its relation to the ±1 regression coefficient of §6.3 is four times γ_12. Compare this contrast within seed blocks rather than subtracting four unrelated published means. Sharing seed indices creates a blocking design; it does not guarantee positive covariance or identical data order across different datasets.

```figure
id: fig-6.35
kind: matrix
title: Contrast weights over the six arms
caption: >-
  Which arms each registered contrast reads, and with what sign. The
  primary total-compute contrast, highlighted, touches only F_high and its
  top-up. The interaction row is the only one to read four arms, which is
  why it is computed within seed blocks and not by subtracting four
  published means. It equals 4γ₁₂ in §6.3's ±1 coding. The top-up arms
  enter only the total-compute rows, because matching is per contrast and
  never across the two budget levels.
placement: inline
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:eq-6.6", "DERIVED:eq-6.7"]
alt: >-
  Matrix of five contrasts by six arms, U_low, F_low, U_high, F_high,
  U_low_top and U_high_top. A full cell is weight +1, a half cell −1, an
  empty cell 0. Filter at the low budget: F_low +1, U_low −1. Filter at the
  high budget: F_high +1, U_high −1. Total compute at the low budget: F_low
  +1, U_low_top −1. Total compute at the high budget, the primary contrast
  and highlighted: F_high +1, U_high_top −1. Filter × budget interaction:
  F_high +1, U_high −1, F_low −1, U_low +1, equal to 4γ₁₂.
spec:
  rows: 5
  cols: 6
  pattern: explicit
  rowLabel: "registered contrast"
  colLabel: "arm"
  rowTicks: ["filt@low", "filt@high", "total@low", "total@high", "F×budget"]
  colTicks: ["U_low", "F_low", "U_high", "F_high", "U_low_top", "U_high_top"]
  cells:
    - [0.5, 1, 0, 0, 0, 0]
    - [0, 0, 0.5, 1, 0, 0]
    - [0, 1, 0, 0, 0.5, 0]
    - [0, 0, 0, 1, 0, 0.5]
    - [1, 0.5, 0.5, 1, 0, 0]
  highlight: [{ row: 3, col: 3 }, { row: 3, col: 5 }]
  legend: "full = +1, half = −1, empty = 0; top-ups enter only total-compute rows; F×budget = 4γ₁₂"
```

**ASSUMED.** Five seed blocks are an illustrative minimum allocation, not a proof of adequate power. Before registration, estimate plausible variances on independent development tasks and examine power across that range. If the fixed budget cannot distinguish δ, register a precision-limited exploratory study. Do not repeatedly add seeds after looking at the primary test result unless a sequential design was specified in advance.

## Acceptance criteria

| Gate | Acceptance rule |
|---|---|
| Identity | Every executed run resolves all required model, tokenizer, dataset, scorer, analysis, and runtime revisions; no required execution identity remains UNVERIFIED |
| Partition | No exact item or declared group overlaps test with training/development; temporal mode excludes post-cut-off training/development items and quarantines straddling groups |
| Budget | Declared consumed-FLOP boundary differs by at most 1% within each matched contrast; report actual discrepancy and reject matching outside tolerance |
| Data exposure | Unique and repeated consumed tokens are reported; a filtered pool shortage triggers redesign before test inspection |
| Completion | All 30 planned training runs have terminal records; failures, retries, and exclusions are retained |
| Statistical scope | Every interval names its independent unit and conditional population; every primary contrast has a prespecified δ, estimator, and stopping rule |
| Decision | Practical improvement, equivalence, degradation, or unresolved status follows the registered interval rule without outcome-dependent changes |
| Replay | Exact counts agree across independent reducers; deterministic score aggregation differs by at most 10⁻¹⁰ in absolute score units; resampling-based intervals use the same resample index artifact or a separately justified Monte Carlo tolerance |
| Integrity | Altered manifests, corrupt shards, conflicting duplicate ids, and missing attempts are detected and prevent a complete-evidence claim |
| Publication | Every registered arm, negative result, deviation, and tested extrapolation limit is retained |

**ASSUMED.** The 1% matching tolerance and 10⁻¹⁰ replay tolerance are proposed engineering thresholds. Tighten the budget tolerance when expected effects are small, and verify that numerical tolerance is suitable for the chosen reduction order. Passing structural checks establishes an auditable design; it does not guarantee that the filter improves quality.

## What this edition did not do

No model was trained, no benchmark was run, no curation cost was measured, and no empirical outcome was produced. The six-file package above is an artifact specification; the planning instance is not a witnessed preregistration. All execution identifiers and proposed effect magnitudes remain UNVERIFIED or ASSUMED as labelled. The manuscript's arithmetic and structural checks are editorial verification, not experimental evidence.

## References

[P07 and P50](references.md) are the plan's primary anchors. R6.1, R6.25, R6.26, and R6.30 support the uncertainty and preregistration methodology. [§6.3](06-3-controlled-comparisons.md), [§6.4](06-4-measurement-uncertainty.md), and [§6.6](06-6-reproducible-evidence.md) own the design, analysis boundary, and evidence contract.
