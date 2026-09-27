---
id: ms.verification.16
entity_type: verification
title: Chapter 16 verification
short_title: Chapter 16 verification
section: null
slug: verification
parent: ms.chapter.16
prev_sibling: ms.section.16.6
next_sibling: ms.references.16
children: []
prerequisites: [ms.chapter.13, ms.chapter.14, ms.section.16.1, ms.section.16.2, ms.section.16.3, ms.section.16.4, ms.section.16.5, ms.section.16.6]
downstream: [ms.chapter.27, ms.chapter.29, ms.chapter.42]
volume: 1
part: 3
chapter: 16
related: []
relations: []
axes: {lifecycle: [pretraining, adaptation, inference, evaluation], mechanism: [mixture_of_experts, conditional_computation], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P10, P13]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.nvidia-megatron-core]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
word_count_target: 1500
updated_at: 2026-09-26
editorial_status: manuscript_draft
---

# Chapter 16 — Verification and MoE routing study

## Artifact contract

**PROPOSAL.** Produce an MoE routing and resource-accounting study that reports task quality, expert-load histograms, drop rates, communication bytes, and tail latency under the same configuration identity. The artifact distinguishes mathematical correctness fixtures from unexecuted model experiments.

| Record | Required fields | Invariant |
|---|---|---|
| Architecture | Dense and shared components; expert shapes; total and activated counts; tied tensors | Logical parameters and physical replicas are separate |
| Router | Eligible sets; scoring; top-k; normalization; ties; routing granularity; causal scope | Selection and combination can be reconstructed |
| Training | Data exposure; optimizer; auxiliary coefficients; balancing scope; controller state; precision | A resumed run preserves routing-relevant state |
| Assignment | Token and expert identifiers; coefficients; pre-capacity counts | Every intended token–expert edge is identifiable |
| Capacity | Accepted/rejected edges; policy; dropped mass; padded rows | Executed work is not substituted for requested work |
| Placement | Expert owners, shards, replicas, process groups, topology | Physical execution preserves logical expert identity |
| Communication | Transfer unit; send/receive splits; byte representation; local/remote boundary | Endpoint counters are not double-counted |
| Outcome | Quality, expert/rank distributions, drops, bytes, memory, latency, failures | Metrics refer to one configuration and workload stratum |
| Comparison | Matched and unmatched budgets; baseline; tuning expenditure; uncertainty | Every conclusion states its comparison boundary |

The canonical record retains both requested and executed assignments. A capacity policy can make executed loads look balanced by discarding excess demand; that record must remain distinguishable from a router that produced balanced demand before capacity handling.

For autoregressive claims, record whether routing and admission are token-local, prefix-local, or batch-dependent. The causal attention mask is only one part of the complete dependency graph.

## Formulation

**MATHEMATICALLY-DERIVED — authored fixtures, not named-model measurements.**

| Fixture | Configuration | Expected result |
|---|---|---|
| Full parameter boundary | 64 experts × 1 million parameters; top-two; 4 million shared; 12 million other dense; 0.25 million router | Total 80.25 million; activated 18.25 million; full ratio approximately 4.40 |
| Top-one gate | Selected probability 0.6; scalar expert output 2 | Retained-mass output 1.2; selected-renormalized output 2 |
| Uniform auxiliary value | Both expert distributions equal 1/E | Auxiliary objective equals its declared coefficient |
| Auxiliary gradient | Fixed selections away from boundaries; independent finite difference | Eq. 16.8 matches within a declared tolerance |
| Z-loss shift | Subtract each row's log-partition from all logits | Softmax unchanged; row log-partition becomes zero in exact arithmetic |
| Capacity | Loads 8, 4, 2, 2; four slots per expert | 16 requested, 12 accepted, 4 dropped; 16 reserved slots |
| Row rounding | Integer row count and positive integer block size | Per-expert padding is between zero and block size minus one |
| Weighted combination | Inputs 2 and −3; experts 2x and −x; coefficients 0.75 and 0.25 | Outputs 2.5 and −3.75; fixed-gate input derivative 1.25 |
| Logical communication | 1024 remote assignments; width 4096; two bytes per value | 16 MiB for one input and one return row per assignment |
| Synthetic occupancy | One token, 64 experts, uniform top-two | Exactly two touched experts |
| Replica payload | Three replicas of an expert with payload W bytes | Total 3W bytes; additional 2W bytes, excluding other state |

The arithmetic, block-rounding boundaries, weighted scatter, softmax shift, and auxiliary-gradient fixtures were checked during editorial validation on 2026-09-26. These are mathematical checks, not a model benchmark or a CODE-VERIFIED repository claim. The finite-difference auxiliary-gradient check used fixed selections and a perturbation of 0.00001; its maximum absolute residual was below 0.000000001.

Record the scope of that check: small floating-point reference expressions, no trained checkpoint, no distributed runtime, and no performance measurement. A successful fixture cannot establish model quality or implementation correctness outside the tested mathematical case.

## Mechanism

**DERIVED.** Use an ordered chain of evidence. First establish tensor and assignment identities. Then establish numerical agreement with an independent bounded reference. Then evaluate the actual candidate's task behavior and resource use. Skipping a lower layer makes attribution at the next layer unreliable.

The router negative control changes selected renormalization while preserving indices. The permutation negative control overwrites rather than accumulates a top-k contribution. The capacity negative control reports only post-drop counts. The communication negative control counts sends and receives twice. Each should fail its corresponding audit while leaving unrelated checks interpretable.

Causality needs intervention tests. Hold a prefix fixed while replacing later tokens in the same routing pool. Separately hold one request fixed while replacing unrelated co-batched requests. Record whether selection, capacity acceptance, or output changes. A declared token-local, batch-independent implementation should preserve the relevant target computation within numerical tolerances; a deliberately batch-dependent policy must disclose that behavior and evaluate its consequences.

Replica correctness needs uneven work. Compare a single logical expert owner with synchronized replicas processing unequal assignment counts. Verify the intended aggregate gradient and one optimizer update. A test using perfectly equal replica loads can conceal incorrect averaging.

## Algorithm

~~~text
Algorithm 16.7 — Verify an MoE architecture and execution claim
INPUT: finite candidates, independent bounded reference, source/configuration ledger,
       workload strata, quality and resource acceptance criteria
OUTPUT: joint study report with qualified conclusions and unresolved fields
STATE: immutable candidate identifiers and complete execution-attempt records
INVARIANT: quality and resource outcomes never mix configuration identities
1. Verify parameter inventories and routing coefficient conventions.
2. Check assignment conservation and forward/backward reference agreement.
3. Run future-token and co-batch interventions under the declared causal contract.
4. Check pre/post-capacity counts, dropped mass, and padding exclusion.
5. Validate placement, replica updates, split sizes, and byte-count conventions.
6. Freeze candidate selection using development evidence.
7. Evaluate held-out quality and closed-loop workload strata.
8. Collect histograms, drops, bytes, memory, completion, and latency jointly.
9. Estimate uncertainty at the declared independent sampling unit.
10. Publish passing, failing, and unresolved configurations with their boundaries.
~~~

The reference is explicitly bounded. Counting-based assignment audits cost linear work in assignment count plus expert bookkeeping. Model training and inference dominate the proposed study's budget and must be accounted for independently. The protocol does not require modifying application code.

## Experimental design

**PROPOSAL — no model quality, training, or serving result is populated.**

### Experiment 16.7 — Joint routing and resource-accounting study

- **Hypothesis:** An MoE configuration's quality-resource trade-off depends on routing semantics, balancing scope, assignment preservation, placement, and workload tails.
- **Setup:** Compare finite candidates with independently specified dense active-compute and total-memory baselines.
- **Independent variables:** Expert count, top-k, shared capacity, normalization, balance policy, admission policy, placement, and batch-size stratum.
- **Controlled variables:** Source data eligibility, tokenizer, architecture outside the intervention, training budget per comparison, and evaluator.
- **Dataset/workload:** Mixed-domain held-out tasks, homogeneous bursts, rare-domain inputs, causal fixtures, and prefill/decode request strata.
- **Hardware:** Record actual devices, topology, precision, runtime and kernel revisions, concurrency, and measurement boundaries.
- **Metrics:** Quality and uncertainty; expert/rank load histograms; assignment/token drops; dropped mass; communication bytes; peak memory; completion; tail latency.
- **Baselines:** Independent no-drop reference, active-compute dense match, total-parameter dense match, and no-overlap execution where supported.
- **Expected result:** The study produces conditional trade-offs; it does not presuppose that MoE or any router is superior.
- **Ablation:** Separate fixed-trace execution changes from closed-loop routing changes; vary one contract at a time.
- **Interpretation:** Accept only conclusions supported jointly by the matched boundary, operator checks, and held-out outcomes.
- **Threats to validity:** Unequal tuning, correlated samples, missing failures, shared reference defects, hidden dropping, and changing workload mixtures.

The primary analysis should identify a small set of predeclared comparisons. Exploratory results can motivate a later study but must not be relabeled as confirmatory evidence. Use independent training seeds where the claim concerns training stability or convergence rather than one checkpoint's behavior.

## Failure modes

> **Failure mode — Quality/performance configuration mismatch.** *Symptom:* a speed result appears favorable without a corresponding quality record. *Cause:* throughput was measured under a different capacity, routing, or precision configuration. *Detection:* compare immutable configuration identities. *Mitigation:* rerun the missing quality or resource evaluation under the same configuration.

> **Failure mode — Balanced execution conceals dropped demand.** *Symptom:* expert loads look uniform while some examples degrade. *Cause:* only post-capacity counts were logged. *Detection:* compare pre-capacity and accepted assignment ledgers by domain and token position. *Mitigation:* disclose drops and evaluate a preservation-compatible policy.

> **Failure mode — Replay result overgeneralized.** *Symptom:* a fixed-trace kernel improvement is presented as a full-model quality or serving result. *Cause:* the experiment excluded routing feedback, generated history, or failed requests. *Detection:* audit which stages were actually executed. *Mitigation:* add closed-loop evaluation with the same configuration identity.

## Limitations

**DERIVED.** Synthetic fixtures establish local identities and expose specific defects; they do not reproduce natural routing distributions. Small experiments may miss rare overload and divergence events. Passing a study on one topology does not establish performance elsewhere. Unknown outcomes remain UNVERIFIED rather than being filled with illustrative numbers.

## Reproducibility

Archive the complete configuration and source ledger, mathematical fixture inputs, routing traces or declared bounded summaries, raw outcomes, scorer revision, hardware/runtime context, and sampling procedure. Preserve candidate-search expenditure, rejected configurations, and explicit exclusions from cost accounting.

The manuscript is complete as an authored research chapter when its structure, references, equations, figures, links, and mathematical fixtures pass editorial checks. Empirical validation remains a separate future activity; the evidence summary remains **empirically_observed: false**.

## References

[16.2 routing and causality](16-2-router-design.md); [16.3 balance and z-loss](16-3-training-dynamics.md); [16.4 assignment preservation](16-4-capacity-and-execution.md); [16.5 replica and traffic boundaries](16-5-distributed-implications.md); [16.6 comparative methodology](16-6-comparative-methodology.md); [primary references](references.md).

