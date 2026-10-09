---
id: "ms.verification.36"
entity_type: "verification"
title: "Chapter 36 verification"
short_title: "Chapter 36 verification"
volume: 2
part: 6
chapter: 36
section: null
slug: "verification"
parent: "ms.chapter.36"
prev_sibling: null
next_sibling: null
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.29", "ms.chapter.30", "ms.chapter.34", "ms.chapter.35"]
downstream: ["ms.chapter.38", "ms.chapter.39"]
related: []
relations: []
axes: {"lifecycle": ["post_training"], "mechanism": ["agent_rl", "distributed_rollout"], "feedback_setting": ["environment_return", "verifiable_reward"], "modality": ["text", "image"]}
papers: []
implementations: ["impl.verl"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1400
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---


# Chapter 36 verification and editorial closure

[DERIVED] This file separates two activities: an editorial map of manuscript obligations and unexecuted proposed verification protocols. Reported experiments remain in the sections with their actual source versions. No training run, deployment fault test, independent benchmark reproduction or external review score is claimed here.

## Topic-completeness audit

[DERIVED] Each row maps a required concept or substantive variant to its formal mechanism, bounded algorithm, implementation/resource treatment, actual source evidence and limits. The section links lead to exact canonical manuscripts; heading anchors preserve the fifteen-part content contract. Mechanism equations and algorithm numbers identify local reconstruction, not new source novelty. Rows marked derived have explicit analytical premises rather than an invented study. Experimental protocols and observations are source-specific; they are not satisfied by the proposals below.

| Concept or substantive variant | Mechanism, math and algorithm anchor | Implementation and resource anchor | Actual source protocol/findings locator | Failure, limits and reproducibility closure |
|---|---|---|---|---|
| Tool action versus returned observation | [36.1 Formulation](36-1-agent-trajectories.md#formulation), Eqs1–2; Algorithm36.1 | Token/turn masks, event ledger, visible versus generated costs | R36.2 AppendixD; R36.4v3 §4.1/B.2; §36.1 source protocol | Observation leakage excluded; exact IDs and role provenance |
| Partial observation/history | [36.1 Mechanism](36-1-agent-trajectories.md#mechanism), Eqs1/4 | History→context projection; O(S) metadata plus architecture cost | R36.2 AppendixE.6 context-management policies | Hidden state is not disclosed transcript state; context truncation recorded |
| Externally changing state | §36.1 Eqs1/4, Algorithm36.1 | Service revision/time/effect artifact | R36.2 AppendixE.6 live search variability | Local seeds cannot reset web/service state; common-kernel limitation |
| Multi-turn/long-horizon outcomes | §36.1 Eqs3/5, figs36.2/36.5 | Repeated prefill, tools and artifact retention | R36.2 §5.2 Table6/Fig8 and AppendixE | Independent-hazard curve is analytical; total work not inferred from score |
| Task failure/budget stop/ambiguous effect | §36.1 Algorithm36.1, §36.2 Eq9 | Typed status and generation/tool costs before branching | R36.1 §4.1 failure distinctions; R36.3 §6 | Incomplete responses not admitted as complete; no blind effect retry |
| Terminal return | [36.2 Formulation](36-2-credit-assignment.md#formulation), Eqs7/9–10 | Turn mapping and declared terminal token | R36.4v3 §4.2/AppendixB finite task horizons | Infrastructure censor not terminal zero by default |
| Dense potential shaping | §36.2 Eq7 derivation; Algorithm36.2 target path | Checker calls, private versus exposed evidence | Mathematical reconstruction; no named-system deployment claimed | Fixed initial/zero terminal potential and declared discount required |
| Intermediate checks and delayed feedback | §36.2 Mechanism/fig36.11 | Immutable verdict join, checker revision and storage | R36.4v3 B.2 observation/action protocol; R36.3 §7 checker isolation | Adaptive feedback/exposure changes task; late join cannot use task index alone |
| SAPO v3 causal V/Q representation | §36.2 Eq8, fig36.7; Algorithm36.2 | Reserved entries, pre/post-action gathers, shared head | R36.4v3 §4.1 Eqs1–3; §5/Table2 | Unconstrained readout; restricted action support; v1 clipping excluded |
| SAPO GAE and SARSA targets | §36.2 Eqs9–10; Algorithm36.2 reverse pass | Frozen old values, valid-turn normalization | R36.4v3 §4.2 Eqs4–6, AppendixA | Next actual action for SARSA; Q−V not policy advantage |
| SAPO joint clipped objectives | §36.2 Eq11; Algorithm36.2 | Token versus turn reductions; shared optimizer/activation state | R36.4v3 §4.3 Eqs7–11; §5.2–5.3 and AppendixB | Clipped regression not hard readout bound; gradient interference |
| SAPO updated evidence | §36.2 Experimental design/Observations |1.5B/7B/14B hardware and H200 resource boundary | R36.4v3 Tables1–2/Fig2, AppendixB.1 | Matched PPO turn-GAE; three-seed SD; v1 33.2% claim superseded |
| ActFocus token-span weighting | §36.2 Eq12; Algorithm36.2 weight guard | Frozen reference pass/vocabulary reduction; generated-mask denominator | R36.5 §4 Eqs5–7; §5/AppendixC.2 | Positive denominator; alpha0 reasoning-only batch skipped |
| ActFocus energy/alternative signals | §36.2 Eq13/fig36.10 | Reference logits versus entropy/NLL/shift cost | R36.5 §5.6/AppendixC.3 Eqs16–22 | Gauge counterexample; main sigma versus appendix epsilon explicit |
| ActFocus negative ablations | §36.2 Observations/Failure modes | Same source hardware/workload protocol | R36.5 §§5.4–5.6 alpha collapse/nonmonotonic beta | Token fraction is not gradient-norm proof; training-seed uncertainty missing |
| Hierarchical frozen-role PARL | §36.2 Siblings; §36.6 Eq36 | Separate orchestrator/subagent masks and aggregate work | R36.2 §3 reward annealing/frozen roles; §5.2 Table6/Fig8 | No gradient through fixed subagent outputs; critical steps not FLOPs |
| Stateless function/container/microVM/full VM | [36.3 Mechanism](36-3-environment-infrastructure.md#mechanism), fig36.15 | Kernel/private-state/device/residency boundary | R36.3 §3 backend disclosure; §8.1 hardware | FnCall/container inside QEMU; cleanup is not isolation proof |
| Reset determinism and simulators | §36.3 Eq16/Algorithm36.3 | Projection, RNG streams, image/schema revisions | R36.3 §§3/5 composition; R36.4v3 B.2 environment protocol | Files-only equality insufficient; live external service excluded |
| Tool schemas and effect limits | §36.3 Algorithm36.3 | Validation before execution, deadlines/output cap | R36.3 §§3/7 invocation/isolation | Schema-valid shell text can still be effectful; unknown status quarantined |
| Quotas and final admission | §36.3 Eq15/Algorithm36.3 | Atomic parent/node counters and reserved checker bytes | R36.3 §3 placement/admission | Stale placement hints not admission; bounded retry/quarantine capacity |
| Composable layers/lazy images | §36.3 Eqs17–18/figs36.14/36.16 | Overlay priority, private upper, accessed blocks | R36.3 §5.1/§5.3; §8.2–8.3 Figs10–11 | Cold/warm boundary, dependency conflicts, storage congestion |
| Memory overcommit and CPU QoS | §36.3 Eq19 | Host/guest caches, DAX metadata, reclaim and SMT | R36.3 §5.2; §8.4–8.5 Figs12–13 | Peak versus integrated memory; transient CPU and residual latency inflation |
| Reward isolation | §36.3 Implementation/Algorithm36.3 | Private credentials, sealed artifacts, network/control-socket restrictions | R36.3 §7 | Isolation does not establish semantic verifier soundness |
| Actor/learner/rollout/reward/environment roles | [36.4 Formulation](36-4-distributed-roles.md#formulation), Eq21/fig36.19 | Per-role capacity and residency | R36.6 V1 guide; R36.7 controller | Stage-rate units must match; reject upstream work remains cost |
| Sync/colocated/separate/hybrid-disabled modes | §36.4 Mechanism/fig36.21 | Pool lending/mode transitions/partial generation | R36.6 V1 choose-mode and switching guide | No inference on hybrid-disabled training GPUs; source-specific behavior |
| Stable old policy and CPU swaps | §36.4 Eq23 | Save/restore counts, pinned RAM and link traffic | R36.6 trainer `_compute_old_log_prob` | Recomputed old policy differs from actual processed behavior |
| Full/delta weights and layout | §36.4 Eqs22/24; Algorithm36.4 | Base digest, slots, coordinates, seeding, checksum | R36.6 delta guide wire/measured sections | Wrong base invalidates delta; per-sync gain not end-to-end gain |
| Atomic publication and cache reconstruction | §36.4 Algorithm36.4; §36.6 recovery | Exclusive fence, receiver bytes, invalidate/rebuild KV | R36.6 trainer switch methods; R36.7 controller version RPC | Book-derived stronger protocol; controller ACK not proof atomicity |
| Within-episode versions/true behavior | [36.5 Formulation](36-5-asynchrony-and-mismatch.md#formulation), Eq26 | Per-position IDs/processors/logps | R36.1 §4.1; R36.6 V1 partial-rollout guide | Retained prefix not resampled; raw logits may differ from behavior |
| Full path importance correction | §36.5 Eq27 derivation; Algorithm36.5 | Log products, support/kernel checks | Derived under explicit premises; source methods compared separately | Fixed target, common kernel, absolute continuity, integrability |
| Prefix correction and delayed reward | §36.5 Eq28/two-step counterexample | Prefix-measurable conditional value or suffix correction | Derived finite-state identity; Chapter34 canonical estimator link | Terminal behavior reward is not prefix-measurable |
| Action-dependent cancellation/filtering | §36.5 Eq29/calculator | Retention reasons, prompt/group multiplicity | R36.1 §4.1; R36.6 eviction/refill guide | Unknown/zero selection support prevents unconditional correction |
| GLM sync population mask versus DSDM | §36.5 Eq30 | Different old-train/infer/current probabilities | R36.1 §3.2 versus §4.1 Eqs4–5 | DSDM detach not disclosed; intro centered-reward scalar identically zero |
| TITO versus probability parity | §36.5 Implementation/fig36.28 | Exact token/context/mask identities then sampler/numerical parity | R36.1 §4.1; R36.2 AppendixD | Text equality/token identity cannot prove equal probabilities |
| Bounded lag and backpressure | §36.5 Eq31/Algorithm36.5 | Queue/byte/lease caps; per-event oldest version | R36.6 drop/wait/null; R36.7 max-head control | Version gaps not KL bounds; cancellation changes measure |
| Utilization/queue/tails | [36.6 Mechanism](36-6-efficiency-and-reproducibility.md#mechanism), Eqs34–35 | All pools, queue residence and retained memory | R36.3 §4 lifetime/demand characterization | Stationarity/iid conditions explicit; mean not p99 |
| Replay/retry/live continuation/snapshot | §36.6 Eq37/Algorithm36.6 | Result reuse, reconciliation, KV and retained state | R36.3 §6; R36.6 replay recovery | External service cannot rewind; ambiguous non-idempotent effects excluded |
| Consistent checkpoint and consumption | §36.6 Eq38/Algorithm36.6 | Model/optimizer/RNG/cursor/queues/effects/tombstones | R36.6 finished/pending restore; R36.3 §6 | Source docs not full effectful checkpoint proof; exclusive fenced ownership |
| Cost per successful update | §36.6 Eq33/calculator/Observations | GPU/CPU hours, bytes, retry/waste/checkpoint work | Source cost boundaries in §§36.3–36.4; full economic total missing | U>0; no-commit report; quality separately measured; no inferred energy/tariff |

## Proposed verification protocols — unexecuted

### V36.1 — Event and partial-observation contract

[ASSUMED] Use a finite two-state simulator and a separate changing-service stub. Freeze tasks, parser, context builder and policy processors. Bound each episode to8turns/512generated tokens, each tool to1second and each run to128occurrences. Reserve environment/result capacity before every effect. Inject parser rejection, observation truncation, missing generation log probabilities, pre-execution timeout and ambiguous post-effect timeout at predetermined occurrence IDs. No external production service is called.

[DERIVED] Expected invariants: every attempt/cost remains recorded; invalid actions retain the previous observation explicitly; missing probabilities never become complete admitted trajectories; tool/observation tokens are excluded from policy action masks. The changing-service case must fail a claim of full reset parity while preserving the local reset projection. Check exact event bytes, task/occurrence distinctions and bounded resource release. A failure falsifies the representation or acquisition implementation, not the value estimator.

### V36.2 — Credit estimator and source-reconstruction checks

[ASSUMED] Enumerate terminal/dense toy rewards, true terminations and censored paths with horizons1–8; use finite fixed old values and positive normalization epsilons. Check SAPO v3 reserved-token support, pre/post-action positions, SARSA next-action targets, turn normalization before token broadcast, and separate token/turn reductions. Compare a correct causal mask with deliberate future-observation leakage. Do not execute RL or call the study's unavailable code and present it as a reproduction.

[DERIVED] Derive potential telescoping exactly and verify its terminal boundary. Apply a common and then context-dependent logit shift to the ActFocus energy rule: probabilities remain identical while raw energy changes; the second shift need not preserve batch ranking. Exercise zero action counts, alpha0, zero variance with the declared main/appendix convention, nonfinite rewards and failure after a prior accepted optimizer step. The returned state must preserve earlier commits while skipping only the failed current step. Independent trained-model outcomes remain unknown.

### V36.3 — Reset, isolation and nested quota failure

[ASSUMED] Provision a disposable simulator sandbox with immutable base/workspace/toolkit hashes and a private writable layer; use synthetic credentials and no network. Run at most32episodes,4concurrent leases,64MiBresults/episode and a finite quarantine pool. Test file/process/RNG reset fields, toolkit path-collision priority, parent/child quota races, stale placement hints and a deliberately slow checker. Reserve checker capacity before execution. Inject cleanup failure and verify that state is quarantined rather than reused.

[DERIVED] Measure actual reset projection equality, observed cross-episode contamination, node admission rejections, retained bytes and exact cleanup ownership. Reward evaluation consumes a sealed artifact under a separate credential. Fail the protocol if an agent can change its already sealed result, read checker answers, exceed atomic parent quotas or force unbounded recovery. This establishes only the declared local boundary; it does not certify adversarial isolation of a production hypervisor.

### V36.4 — Version publication and within-episode resumption

[ASSUMED] Use two finite toy model tensors with explicit full/delta manifests and two receiver replicas. Limit transfer attempts to3 and each RPC to1second. Reserve complete receiver/staging bytes. Inject wrong base digest, reordered layout, partial transfer, stale publisher fence and publication acknowledgment loss. Retain a generated prefix with old probabilities; after a new version, invalidate weight-dependent KV and reconstruct from its exact IDs. Include an explicitly pinned old-replica continuation as a separate arm.

[DERIVED] Acceptance requires no routing to partially installed weights, no stale publisher overwriting a newer serving pointer, bounded retries, correct version labels and all failed bytes/time retained. If reconstruction fails, the request remains unroutable. Check full/delta equality only over the manifest's actual tensor elements; it is not probability parity under different numerical engines. The AReaL controller inspection alone does not satisfy this protocol.

### V36.5 — Selection and importance counterexamples

[ASSUMED] Enumerate a two-step finite policy with positive common support, fixed target parameters, identical kernels and known outcome rewards. Compare full path ratios, prefix ratios with prefix-measurable quantities, and prefix ratios incorrectly applied to behavior terminal returns. Add a known retention function and then deterministic cancellation. Limit enumeration to64paths and exact rational probabilities; no model sampling is needed.

[DERIVED] Expected results follow Eqs36.27–36.29: exact full correction under its premises, prefix correction only for the correct measurable quantity, and changed conditional measure under retention. Deterministic excluded paths prevent unconditional recovery. Separately test mixed-version processed probabilities and deliberately substitute raw logits/top-p-incompatible denominators. These are falsification examples for estimator claims, not empirical evidence that a named provider's training diverges.

### V36.6 — Delayed workers, checkpoint recovery and accepted-update cost

[ASSUMED] Freeze a small disposable task set, synchronous baseline and asynchronous modes with the same evaluation manifest. Bound total work to256occurrences,4workers,8queued groups,3retries and finite per-call deadlines; no production endpoints. Inject worker delays and known pre-effect failures using immutable occurrence IDs. Take a consistent cut with pending, finished and already consumed work; simulate learner/rollout process loss separately from sandbox loss. Include one ambiguous effect that requires reconciliation and cannot be blindly retried.

[DERIVED] Compare completion/status distribution, oldest/newest version gaps, accepted/rejected groups, duplicate consumptions, re-prefill tokens, queue residence, CPU/GPU resource-time, storage/network bytes and committed update count. Report U=0 explicitly. Restore finished results once, reissue only safe pending work, preserve RNG/cursor/tombstones, and retain old behavior for prefixes. Re-evaluate task quality only after selecting and freezing the recovery recipe. A faster restore with changed accepted-data distribution does not establish equivalent training.

## Source-reproduction boundaries

[DERIVED] A faithful reproduction requires more than matching a model name. SAPO v3 needs its updated readout, turn-GAE PPO baseline and three-seed protocol; v1's clipped value and runtime headline are a different experiment. ActFocus needs exact span parsing, alpha/beta, reference signal, filtering and appendix epsilon convention. DSec needs each benchmark's backend/hardware and cold/warm boundary. GLM needs source-specific sync versus async rules and unresolved detach semantics. Kimi requires frozen-role ownership and separate critical-step, wall-time and total-work metrics. The pinned verl tables contain separate hardware sessions; they cannot be pooled into one universal speedup.

## Evidence gaps and disposition

| Gap | Consequence | Required follow-up before stronger claim |
|---|---|---|
| GLM DSDM detach/complete asynchronous recipe | No unbiased-gradient or exact-code equivalence claim | Inspect originating pinned loss implementation and target/reduction contract |
| Frontier training seeds/task mix/hardware | No independent convergence or cost ranking | Released run manifests and independently repeated matched studies |
| SAPO/ActFocus exact training commit | Manuscript reconstruction only | Author-provided code/version comparison; no substitute trainer inferred |
| DSec complete production source/internal suites | Mechanism evidence with deployment-specific limits | Released task/runtime artifacts and independent uncertainty |
| V4.1 originating PDF inaccessible | No detailed uninspected V4.1 method claim | Retrieve pinned full report and inspect; DSec disclosure remains narrowly scoped |
| External-world reset and exactly-once effects | Local checkpoint cannot prove global replay | Versioned service simulator or explicit idempotency/transaction protocol |
| Energy/currency/full accepted-update measurements | Physical cost formula only; no invented numbers | Measured device power, tariffs, all attempts and fixed acceptance/evaluation |

## Manuscript validation boundary

[DERIVED] Structural checks use the existing standalone native-figure validator and the safe in-memory `compileAtlas` review helper. They check frontmatter, links, evidence records, mathematical rendering, figure schema, legal count-axis samples, control characters and finite calculator/chart states. No application bundle is written. Passing these checks is necessary for reviewability, not proof of scientific completeness, a verified implementation or an external10/10 rating.

## References

[R36.1–R36.7](references.md), with exact original dates, inspected versions, locators and exclusions in the canonical ledger.
