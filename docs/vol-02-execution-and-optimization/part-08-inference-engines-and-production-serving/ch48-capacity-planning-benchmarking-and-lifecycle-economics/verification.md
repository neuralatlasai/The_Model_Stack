---
id: ms.verification.48
entity_type: verification
title: Chapter 48 verification
volume: 2
part: 8
chapter: 48
section: null
slug: verification
parent: ms.chapter.48
prev_sibling: ms.section.48.6
next_sibling: ms.references.48
children: []
prerequisites: [ms.chapter.6, ms.chapter.21, ms.chapter.25, ms.chapter.42, ms.chapter.43, ms.chapter.44, ms.chapter.45, ms.chapter.46, ms.chapter.47]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63]
related: []
relations:
  - {type: implemented_by, target: impl.vllm}
axes: {lifecycle: [inference, serving, evaluation], mechanism: [capacity_planning, resource_accounting], feedback_setting: [], modality: [text]}
papers: []
implementations: [impl.vllm, impl.nvidia-triton-inference-server]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2500
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# Chapter 48 verification

## Status and scientific question

[UNVERIFIED] This is a proposed held-out capacity/cost study. No model server, traffic generator, simulator, cloud resource, tariff API or energy meter was executed. Source inspection, mathematical review and document validation do not establish service capacity or current price/performance.

[DERIVED] The scientific question is whether a model of one declared service predicts accepted goodput, tail latency and full ownership cost on a workload excluded from calibration, with failure/retry/cache state and offered-load accounting preserved. A fit to a mean or a benchmark peak is insufficient evidence for p95/p99 service under future traffic.

## Artifact and identity

[DERIVED] Retain the offered marked workload, response-dependent session generator, exact model/tokenizer/template and runtime revisions, workload seeds, initial/cache state, admission and scheduling policies, event clocks, terminal outcomes, quality/SLO definition, physical-resource inventory and price/energy ownership ledger. Include every timeout, rejection, malformed response and missing telemetry interval. A source-reported experiment is evidence for its disclosed regime, never a substitute for these artifacts.

[OFFICIAL-DOCUMENTATION] Immutable inspected sources are vLLM badfcdbf919532624b2296eeacb85c6dd9fe2e58, wrk2 44a94c17d8e6a0bac8559b53da76848e430cb7a7, MLCommons endpoints policy a6428d38e6691c0d90cb8a27ec4acbe98c2bf90f and diagnostic guide 3a51022c2f52dea27fc0338b91df781c3871f538. They establish narrow source provenance, not executed correctness. Other mutable guides and paper revisions are identified in [references](references.md).

## Topic-completeness and evidence audit

[DERIVED] The rows below specify all plan topics. Their owner inherits the thirteen-obligation routing below. Each source locator and exception constrains the corresponding claim; no documentation-only capability receives a borrowed performance experiment.

| ID / topic | Owner and mechanism | Evidence / locator | Formal/resource boundary | Present gap and proposed rejection |
|---|---|---|---|---|
| W1 Arrival process | 48.1 marked exogenous versus feedback arrivals | R48.1 §§3,5; R48.2 §§3–4 | Eq. 48.1 window counts, conditional intensity | Reject fitted law on held-out burst/session statistics |
| W2 Joint lengths | 48.1 paired input/output marks | R48.1 §5; R48.3 workload analysis | Covariance changes mixed-work estimate | No local joint trace; reject marginal-only equivalence |
| W3 Conversation | 48.1 turn dependencies and think time | R48.2 Tables 2–3 | Completion-driven arrivals differ from replay | Preserve failed/abandoned turns; no live sessions |
| W4 Cache locality | 48.1 potential compatible prefixes | R48.2 §6.1 | Actual hit depends on policy/residency/identity | No actual cache ledger; reject borrowed historical hit credit |
| W5 Model mixture | 48.1 routing/class mixture | R48.2 §§3–4 | Resource and acceptance per class | No model traffic; reject class starvation hidden by aggregate |
| W6 Concurrency/hidden work | 48.1 observed versus latent marks | R48.2 record fields; R48.17 | Output budget differs from realized work | Hidden reasoning/abandonment not fully observed |
| L1 Open/closed loop | 48.2 intended clock versus replacement | R48.4; R48.13 §6.1 | Eq. 48.2 latency; interactive law conditional | Reject closed-loop capacity interpretation as fixed offered rate |
| L2 Coordinated omission | 48.2 missing offers versus lag | R48.4 measurement examples | Intended-to-terminal population | No generator run; retain unsent/rejected offers |
| L3 Generator headroom | 48.2 issue lag and semaphore queue | R48.7 get_request/limited_request_func | Client queue distinct from service queue | Reject runs with unexplained issue lag or client ceiling |
| L4 Warm/cold state | 48.2 model/kernel/cache/queue state | DERIVED; Chapter 45 | Setup excluded only under named boundary | No state preparation; invalidate ambiguous warm-up |
| L5 Duration/drift | 48.2 steady window and full trace | R48.13 §4.4; R48.14 caveats | Issue cohort, drain and temporal dependence | Reject first plateau as universal stability proof |
| L6 Saturation | 48.2 constrained offered/admitted/completed search | R48.6 request-rate/concurrency | Feasibility depends on tails/quality, not peak | No load sweep; reject assumed monotonic goodput |
| M1 TTFT | 48.3 first visible unit contract | R48.5 Metrics; R48.13 §4.1 | Eq. 48.3; client timing and empty chunks | No stream trace; reject undefined first-token boundary |
| M2 ITL/TPOT | 48.3 token/chunk and short-output domain | R48.5; R48.7 calculate_metrics | So>=2 for TPOT; reciprocal summaries differ | Reject chunk-as-token and undefined-value zero imputation |
| M3 E2E | 48.3 terminal accepted completion | Eq. 48.3; R48.6 | Clock/timeout/output length matters | No terminal event ledger |
| M4 Throughput | 48.3 offered/admitted/completed rates | Eq. 48.4; R48.6 | Consistent cohort and interval boundaries | Reject count inequality across mismatched windows |
| M5 Goodput | 48.3 joint quality and SLO acceptance | Eq. 48.4; R48.13 quality rules | Per-task joint event, not separate percentile success | No task evaluator; latency-only goodput explicitly narrower |
| M6 Memory/utilization | 48.3 occupancy and resource saturation | R48.5 Telemetry; Chapters 25,42 | Physical bytes and counter denominators | No telemetry; utilization alone cannot prove bottleneck |
| M7 Errors/censoring | 48.3 all-offer terminal accounting | DERIVED | Conditional successful tails versus operational failure | Reject silently dropped timeouts and unknown outcomes |
| M8 Tail uncertainty | 48.3 finite-sample ranks | Eq. 48.5 own derivation | iid continuous quantiles; dependence invalidates binomial | No independent sample; reject precise p99 from tiny cohorts |
| Q1 Little's law | 48.4 population-time identity | R48.10 abstract; Eq. 48.6 | Stable consistent boundary and finite limiting means | Original proof unavailable; own derivation not measured fit |
| Q2 Queue headroom | 48.4 residual-work M/G/1 example | Eq. 48.7 own derivation | Poisson/iid/single-server finite second moment | Continuous batching violates simple-model premises |
| Q3 Tail protection | 48.4 SLO-aware capacity | DERIVED; R48.9 §§4–7 | Mean prediction is not tail guarantee | No held-out tail validation; reject mean-to-p99 inference |
| Q4 Admission | 48.4 class/deadline/resource policy | Chapters 44,46; resource inequalities | Accepted goodput includes rejected offers | No policy execution; reject shifting load via uncounted drops |
| Q5 Failure reserve | 48.4 surviving capacity necessary bound | Eq. 48.4 section reserve inequality | (r-f) mu_safe >= lambda, not recovery sufficiency | No fault trace; restart/correlated loss excluded from bound |
| Q6 Prediction | 48.4 simulator/profile transfer | R48.9 §7/App. A | Event state, profile domains and held-out error | Vidur source regime not universal simulator validation |
| C1 Accepted task | 48.5 complete ownership ratio | Eq. 48.8 | Cost currency per accepted task; N>0 | No accepted tasks; report undefined at zero |
| C2 Training/preparation | 48.5 declared amortization | DERIVED | Allocation horizon and sunk/marginal decision | No training ledger; avoid recharging sunk costs blindly |
| C3 Idle/reserve | 48.5 rental and redundant occupancy | Eq. 48.8; R48.21 §6 | All paid resource-time, including failover/idle | No rental record; reject utilization-only estimate |
| C4 Retry/failure | 48.5 full retry path | R48.21 §§3–6; geometric own example | iid c/q ratio only under explicit conditions | Correlated failure/deadline path unknown |
| C5 Tools/storage/network | 48.5 end-to-end dependency cost | DERIVED; R48.15 | Nonoverlapping billed/owned units | No tool or storage bill; partial subtotal not full cost |
| C6 Energy | 48.5 whole-domain integration | Eq. 48.8; R48.13 §4.5 | Joules versus provisioned watts; avoid double charge | No power meter; provisioned estimate not measured energy |
| C7 Break-even | 48.5 fixed/marginal frontier | Eq. 48.9 | Sign cases, horizon, currency/date and capacity | No current tariff; reject timeless price ratios |
| C8 Preemption | 48.5 stateful migration/recovery | R48.21 §§3–6/Fig. 7; R48.22 | Historical savings with latency penalty and assumptions | No equal-SLO rerun; don't export AWS historical prices |
| X1 MLPerf | 48.6 model/scenario/SUT boundary | R48.8 §§3–4; R48.11 | Quality, scenario, round and measured unit | No individual 6.1 result inspected/adopted |
| X2 Endpoint submissions | 48.6 API/SUT and draft policy | R48.12–14 | Fixed concurrency, steady windows, P90 TPOT | Draft branch not ratified universal methodology |
| X3 E2E RAG | 48.6 pipeline-level task | R48.15 Task/Metrics | Offline ingestion docs/s versus QnA tasks/s; timed replay fixes stage inputs/hops | No pipeline benchmark; adaptive robustness not established; Server remains future in source |
| X4 Artificial Analysis | 48.6 external API measurement | R48.16–18 | External tokens, rolling summaries, client region | Not internal capacity or native billed-token equivalence |
| X5 Epoch | 48.6 development metadata | R48.19–20 | Estimates and provenance, not endpoint measurements | No CSV snapshot; no service inference from trend table |
| X6 Internal held-out | 48.6 compatibility audit | Eq. 48.10 own relation | Same object/load/quality/cost boundary and uncertainty | No comparable result bundles; dominance unresolved |

## Obligation-to-anchor routing

[DERIVED] Every audit row inherits all thirteen entries from its owning section. Primary-source locators remain topic-specific; the coverage map is separate from the proposed study.

| Code | Obligation | Anchor and restriction |
|---|---|---|
| P | Problem and prior limitation | scope; why-this-exists |
| F | Formal contract | formulation: variables, units, domains and population |
| M | Full methodology | mechanism: Methodology reconstructs stages/choices |
| Q | Mathematical account | formulation; mechanism: numbered identities versus empirical models |
| A | Executable procedure | algorithm: bounded state transitions, invariants and failure branches |
| I | Implementation | implementation: source-inspected versus actually executed |
| C | Resource accounting | mechanism; algorithm; implementation: bytes/traffic/time/money boundaries |
| E | Reported protocol | experimental-design: source regime, no borrowed experiment |
| O | Observations | observations: claim, evidence, inference and unknown |
| S | Alternatives | siblings: controlled axis and prerequisite ownership |
| L | Improvement/lineage | extensions; README lineage: changed mechanism and evidence limits |
| V | Validity | failure-modes; limitations: regimes, counterexamples and open questions |
| R | Closure | reproducibility; references: identity, artifacts and blocking gaps |

| Topic IDs | Section | Exact obligation anchors |
|---|---|---|
| W1–W6 | [48-1](48-1-workload-specification.md) | [P 1](48-1-workload-specification.md#scope) / [P 2](48-1-workload-specification.md#why-this-exists); [F 1](48-1-workload-specification.md#formulation); [M 1](48-1-workload-specification.md#mechanism); [Q 1](48-1-workload-specification.md#formulation) / [Q 2](48-1-workload-specification.md#mechanism); [A 1](48-1-workload-specification.md#algorithm); [I 1](48-1-workload-specification.md#implementation); [C 1](48-1-workload-specification.md#mechanism) / [C 2](48-1-workload-specification.md#algorithm) / [C 3](48-1-workload-specification.md#implementation); [E 1](48-1-workload-specification.md#experimental-design); [O 1](48-1-workload-specification.md#observations); [S 1](48-1-workload-specification.md#siblings); [L 1](48-1-workload-specification.md#extensions); [V 1](48-1-workload-specification.md#failure-modes) / [V 2](48-1-workload-specification.md#limitations); [R 1](48-1-workload-specification.md#reproducibility) / [R 2](48-1-workload-specification.md#references) |
| L1–L6 | [48-2](48-2-load-test-methodology.md) | [P 1](48-2-load-test-methodology.md#scope) / [P 2](48-2-load-test-methodology.md#why-this-exists); [F 1](48-2-load-test-methodology.md#formulation); [M 1](48-2-load-test-methodology.md#mechanism); [Q 1](48-2-load-test-methodology.md#formulation) / [Q 2](48-2-load-test-methodology.md#mechanism); [A 1](48-2-load-test-methodology.md#algorithm); [I 1](48-2-load-test-methodology.md#implementation); [C 1](48-2-load-test-methodology.md#mechanism) / [C 2](48-2-load-test-methodology.md#algorithm) / [C 3](48-2-load-test-methodology.md#implementation); [E 1](48-2-load-test-methodology.md#experimental-design); [O 1](48-2-load-test-methodology.md#observations); [S 1](48-2-load-test-methodology.md#siblings); [L 1](48-2-load-test-methodology.md#extensions); [V 1](48-2-load-test-methodology.md#failure-modes) / [V 2](48-2-load-test-methodology.md#limitations); [R 1](48-2-load-test-methodology.md#reproducibility) / [R 2](48-2-load-test-methodology.md#references) |
| M1–M8 | [48-3](48-3-metrics.md) | [P 1](48-3-metrics.md#scope) / [P 2](48-3-metrics.md#why-this-exists); [F 1](48-3-metrics.md#formulation); [M 1](48-3-metrics.md#mechanism); [Q 1](48-3-metrics.md#formulation) / [Q 2](48-3-metrics.md#mechanism); [A 1](48-3-metrics.md#algorithm); [I 1](48-3-metrics.md#implementation); [C 1](48-3-metrics.md#mechanism) / [C 2](48-3-metrics.md#algorithm) / [C 3](48-3-metrics.md#implementation); [E 1](48-3-metrics.md#experimental-design); [O 1](48-3-metrics.md#observations); [S 1](48-3-metrics.md#siblings); [L 1](48-3-metrics.md#extensions); [V 1](48-3-metrics.md#failure-modes) / [V 2](48-3-metrics.md#limitations); [R 1](48-3-metrics.md#reproducibility) / [R 2](48-3-metrics.md#references) |
| Q1–Q6 | [48-4](48-4-queueing-and-capacity.md) | [P 1](48-4-queueing-and-capacity.md#scope) / [P 2](48-4-queueing-and-capacity.md#why-this-exists); [F 1](48-4-queueing-and-capacity.md#formulation); [M 1](48-4-queueing-and-capacity.md#mechanism); [Q 1](48-4-queueing-and-capacity.md#formulation) / [Q 2](48-4-queueing-and-capacity.md#mechanism); [A 1](48-4-queueing-and-capacity.md#algorithm); [I 1](48-4-queueing-and-capacity.md#implementation); [C 1](48-4-queueing-and-capacity.md#mechanism) / [C 2](48-4-queueing-and-capacity.md#algorithm) / [C 3](48-4-queueing-and-capacity.md#implementation); [E 1](48-4-queueing-and-capacity.md#experimental-design); [O 1](48-4-queueing-and-capacity.md#observations); [S 1](48-4-queueing-and-capacity.md#siblings); [L 1](48-4-queueing-and-capacity.md#extensions); [V 1](48-4-queueing-and-capacity.md#failure-modes) / [V 2](48-4-queueing-and-capacity.md#limitations); [R 1](48-4-queueing-and-capacity.md#reproducibility) / [R 2](48-4-queueing-and-capacity.md#references) |
| C1–C8 | [48-5](48-5-economics.md) | [P 1](48-5-economics.md#scope) / [P 2](48-5-economics.md#why-this-exists); [F 1](48-5-economics.md#formulation); [M 1](48-5-economics.md#mechanism); [Q 1](48-5-economics.md#formulation) / [Q 2](48-5-economics.md#mechanism); [A 1](48-5-economics.md#algorithm); [I 1](48-5-economics.md#implementation); [C 1](48-5-economics.md#mechanism) / [C 2](48-5-economics.md#algorithm) / [C 3](48-5-economics.md#implementation); [E 1](48-5-economics.md#experimental-design); [O 1](48-5-economics.md#observations); [S 1](48-5-economics.md#siblings); [L 1](48-5-economics.md#extensions); [V 1](48-5-economics.md#failure-modes) / [V 2](48-5-economics.md#limitations); [R 1](48-5-economics.md#reproducibility) / [R 2](48-5-economics.md#references) |
| X1–X6 | [48-6](48-6-external-measurements.md) | [P 1](48-6-external-measurements.md#scope) / [P 2](48-6-external-measurements.md#why-this-exists); [F 1](48-6-external-measurements.md#formulation); [M 1](48-6-external-measurements.md#mechanism); [Q 1](48-6-external-measurements.md#formulation) / [Q 2](48-6-external-measurements.md#mechanism); [A 1](48-6-external-measurements.md#algorithm); [I 1](48-6-external-measurements.md#implementation); [C 1](48-6-external-measurements.md#mechanism) / [C 2](48-6-external-measurements.md#algorithm) / [C 3](48-6-external-measurements.md#implementation); [E 1](48-6-external-measurements.md#experimental-design); [O 1](48-6-external-measurements.md#observations); [S 1](48-6-external-measurements.md#siblings); [L 1](48-6-external-measurements.md#extensions); [V 1](48-6-external-measurements.md#failure-modes) / [V 2](48-6-external-measurements.md#limitations); [R 1](48-6-external-measurements.md#reproducibility) / [R 2](48-6-external-measurements.md#references) |

[DERIVED] Exceptions are explicit. W1–W6 source studies establish their own workload properties, not universality or access to unreleased/raw private traces. L1–L6 and M1–M8 are chiefly measurement contracts; E is not a new matched generator comparison, and mathematical identities require no training dataset. Q1–Q5 use conditional book derivations; no continuous-batching p99 theorem or recovery guarantee is claimed. Q6 uses Vidur's disclosed experiment, with near-capacity and architecture-domain limits. C1–C7 are accounting/decision formulations without an inspected universal cost experiment; C8's SpotServe result has its historical workload, cost and latency tradeoff. X1–X5 are boundary/provenance evidence, not an internally replicated ranking. Their absent matched experiments are claim-blocking gaps, not waived obligations.

## Proposed held-out study

[ASSUMED] Select one explicitly supported model/service configuration and a fixed quality-and-SLO acceptance rule. Preserve tokenizer, template, numerical format, output stopping and evaluator. Partition workload by time and session so repeated prefixes or adjacent conversation turns cannot leak between calibration and test. Declare whether the prediction target is a future period of the same service or a new model/hardware/client domain; these are distinct transfer claims.

[ASSUMED] Calibrate only on training traffic and profiles. Retain joint prompt/output/session distributions rather than independently resampling marginals. Construct an exogenous offered-arrival replay and a separate response-dependent interactive population. Include regular traffic, measured burst windows and declared stress scenarios. Cache residency is recomputed for each tested policy from compatible content and initial state. Synthetic stress is labeled synthetic and does not estimate real-world frequency.

[ASSUMED] Drive open-loop offers against an independent clock; separately run a closed-loop concurrency sweep. Capture intended issue, actual issue, admission, first nonempty visible response, every token/chunk timestamp and terminal status. Retain late or unsent offers. Measure generator lag and headroom on an independently characterized destination before interpreting server saturation. Compare direct and service paths only when output semantics remain equal.

[ASSUMED] Warm-up and setup are separately timed. Use predetermined maximum duration and drain/follow-up limits; do not stop when a favorable percentile appears. Include cold/resident/no-prefix and warm/cache-compatible initial states as different strata. Publish full trajectories alongside any candidate steady window. Independent runs or session-level blocks provide uncertainty units; token-level resampling cannot erase request or temporal correlation.

[ASSUMED] For each load and class, report offered/admitted/completed/accepted counts and rates, TTFT, token-aware ITL, TPOT only when defined, E2E, memory and resource traffic, failures and missing records. Provide successful-response quantiles and full-offer deadline acceptance separately. Use order-statistic intervals only when their iid/continuity premises are defensible; otherwise report block-based sensitivity and the raw cohort size without an unjustified confidence guarantee.

[ASSUMED] Test prediction on the held-out trace before refitting. Compare predicted and observed mean and tail behavior, accepted goodput and queue/backlog trajectories. Predeclare tolerances in service-relevant units and relative error only away from zero. Add ablations for independent-length resampling, cache-hit borrowing, closed-loop substitution and omitted client delay. These isolate why a seemingly accurate peak-rate model can fail the actual contract.

[ASSUMED] Exercise a declared failure set with controlled resource loss, restart and dependency delay. The surviving-capacity inequality is a prerequisite, not the acceptance test. Count in-flight loss, retries, cold load, admission effects and recovery time; include all paid reserve/redundant resource-time. A failure scenario unsupported by the environment is missing coverage, not a successful test.

[ASSUMED] Join the complete resource-time ledger to dated currency/unit tariffs and task outcomes. Include preparation/training allocation, idle and redundant resources, failed attempts, tools, storage, network and separately borne energy without overlapping rental charges. Report known partial subtotals when costs remain unknown. Normalize to accepted tasks only when their count is positive; show forecast horizons and uncertainty rather than precise costs from unidentified prices.

## Acceptance and rejection

[DERIVED] Review requires reproducible workload/identity/event/cost artifacts and held-out predictions that meet the predeclared quality, p95/p99 and cost criteria under the declared workload/failure set. A source result, valid figure, good fit on calibration, high utilization, small mean error or successful warm demo cannot independently satisfy this criterion.

[UNVERIFIED] Outstanding blockers are an executable service and generator at pinned revisions, accessible held-out traffic with authorized cache identity, quality evaluator, complete terminal event ledger, resource/failure telemetry and dated full costs. The unresolved research questions are generalizing queue/latency models under nonstationary ragged batching, estimating policy-sensitive workload/cache feedback and jointly planning capacity, admission and recovery with calibrated tail uncertainty. Settling them requires prospective held-out tests across domains, not more curve fitting on the same trace.

## Source search and inspection ledger

[OFFICIAL-DOCUMENTATION] Searches on 2026-10-14 included “2026 LLM serving benchmark workload goodput tail latency capacity”, “BurstGPT real world workload characterization LLM serving”, “Vidur simulation LLM inference 2024”, “open closed loop LLM inference benchmarking coordinated omission”, “SpotServe Serving Generative Large Language Models on Preemptible Instances evaluation cost” and “2026 LLM inference cost accepted task energy amortization economics”. Exact inspected primary URLs, revisions and locators are in [references](references.md). Search snippets were discovery routes, not evidence.

[NOT-DISCLOSED] Charon's 2026 MLSys abstract was found, but the full paper fetch failed; its results were excluded. Later BurstGPT abstract statistics were not mixed with the inspected earlier 2401.17644v1 revision. Little's publisher abstract was inspected, while the full-paper link redirected; the manuscript provides its own population-time derivation rather than attributing an unseen proof. Current endpoint policies are draft and mutable unless pinned. No current vendor ranking, live price or individual MLPerf 6.1 submission was adopted.
