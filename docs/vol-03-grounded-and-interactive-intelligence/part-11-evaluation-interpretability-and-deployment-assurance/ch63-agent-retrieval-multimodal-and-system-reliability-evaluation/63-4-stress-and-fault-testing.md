---
id: ms.section.63.4
entity_type: section
title: "Stress and fault testing"
volume: 3
part: 11
chapter: 63
section: 63.4
slug: 63-4-stress-and-fault-testing
parent: ms.chapter.63
prev_sibling: ms.section.63.3
next_sibling: ms.section.63.5
children: []
prerequisites: [ms.chapter.6, ms.chapter.62]
downstream: [ms.chapter.65, ms.chapter.66]
related: []
relations: []
axes: {lifecycle: [evaluation], mechanism: [evaluation_validity], feedback_setting: [], modality: [text, image, audio, video]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 1900
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 63.4 Stress and fault testing

## Scope

[DERIVED] Stress testing measures behavior under declared deviations: delayed or unavailable tools, stale or contradictory evidence, lost observations, missing modalities, context overflow, overload and partial completion. Fault injection chooses a mechanism and location; metamorphic testing chooses a transformation and an expected relation between outputs. This section defines what a failed stress test means, separates severity from production prevalence and connects bounded recovery to [Chapters 47, 53 and 57](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/README.md). The artifact is a qualified fault matrix with a valid oracle for each cell.

## Why this exists

[DERIVED] Nominal tasks rarely expose unknown write outcomes, out-of-order results or state that survives an interrupted operation. A system can answer correctly while leaking data, duplicating an action or exceeding its deadline. A stress suite must test those invariants explicitly. It must also avoid treating every output change as a failure: updating a fact should often change the answer, while irrelevant formatting should not. The expected relation depends on which evidence remains sufficient and which policy governs conflicts.

## Intuition

[DERIVED] Fault location changes the hypothesis. Altering a corpus before chunking can change retrieval candidates, evidence availability and context. Altering the retrieved context after retrieval targets downstream interpretation under that fixed context. A missing audio stream can require an honest abstention; dropping a redundant channel may permit continued operation. A timeout may occur before a write commits or after commitment but before acknowledgment. Treating these as a single generic error conceals the recovery mechanism.

## Formulation

[MATHEMATICALLY-DERIVED] Let $S_v(q,\mathcal C)$ be a versioned system, $m$ a qualified mutation and $V_m$ a predicate describing preserved or deliberately changed information. On valid mutations, define

$$
L_m=\mathbf1\{\neg\mathcal P_m(S_v(q,\mathcal C),S_v(q,m(\mathcal C)))\},\qquad R_m=\mathbb E[L_m\mid V_m=1].
$$
*(Eq. 63.10)*

[DERIVED] The relation $\mathcal P_m$ can require invariant meaning, a prescribed fact update, conflict acknowledgment or a safe fallback. Mutation validity and answer equivalence are separate predicates. Conditioning additionally on baseline-correct, closed-book-incorrect examples measures a narrower selected population and must be stated. A correlation between those predicates does not prove retrieval is necessary in every stochastic execution.

[MATHEMATICALLY-DERIVED] A write with a lost acknowledgment has latent committed state $W\in\{0,1\}$. A retry policy must preserve an operation identity $u$ and satisfy the intended exactly-once *effect* property where supported:

$$
\operatorname{effects}(u;\text{original, retries})\le1,\qquad \operatorname{status}(u)\in\{\mathrm{committed},\mathrm{not\ committed},\mathrm{unknown}\}.
$$
*(Eq. 63.11)*

[DERIVED] Unknown is a real terminal or escalation state, not permission to claim failure or repeat a new write. Idempotency must be enforced at the committing service across the required time horizon; a client-side token alone is insufficient. This is a stated system invariant, not a universal guarantee supplied by the protocol.

[MATHEMATICALLY-DERIVED] For a binary ordinary/fault mixture, with fault probability $w_f$ and failure probabilities $r_0,r_1$,

$$
R(w_f)=(1-w_f)r_0+w_fr_1,\qquad 0\le w_f,r_0,r_1\le1.
$$
*(Eq. 63.12)*

[DERIVED] A balanced injection suite estimates its own design mixture. It does not identify $w_f$ in production. For a multi-fault distribution, use separately justified weights and account for compound faults; the two-stratum calculator is a declared simplification. A severe rare failure can justify a hard constraint even when its weighted contribution is small.

```figure
{
  "id": "fig-63.12",
  "kind": "calculator",
  "title": "Stress mixture is an assumption",
  "caption": "Eq. 63.12 combines ordinary and fault-stratum failure under an explicitly supplied prevalence. A balanced injection suite does not estimate production prevalence.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-63.12",
  "alt": "Eq. 63.12 combines ordinary and fault-stratum failure under an explicitly supplied prevalence. A balanced injection suite does not estimate production prevalence.",
  "spec": {
    "tex": "R=(1-w_f)r_0+w_fr_1",
    "equation": "63.12",
    "inputs": [
      {
        "symbol": "w",
        "label": "Assumed fault prevalence",
        "default": 0.01,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "r0",
        "label": "Ordinary-stratum failure",
        "default": 0.02,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "r1",
        "label": "Fault-stratum failure",
        "default": 0.6,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "risk",
        "label": "Mixture failure probability",
        "formula": "(1-w)*r0+w*r1",
        "format": "percent"
      },
      {
        "symbol": "faultpart",
        "label": "Fault contribution",
        "formula": "w*r1",
        "format": "percent"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Rare fault scenario",
      "variables": {
        "w": 0.01,
        "r0": 0.02,
        "r1": 0.6
      },
      "note": "Prevalence is an explicit scenario input.",
      "highlight": [
        "risk"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "Balanced stress design",
      "variables": {
        "w": 0.5,
        "r0": 0.02,
        "r1": 0.6
      },
      "note": "The test design mixture is different from ordinary traffic.",
      "highlight": [
        "risk",
        "faultpart"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Uncertain field prevalence",
      "variables": {
        "w": 0.2,
        "r0": 0.02,
        "r1": 0.6
      },
      "note": "A prevalence change alters expected risk without changing conditional robustness.",
      "highlight": [
        "risk"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Begin with a fault model linked to system boundaries and a clear acceptance contract. Define activation time, duration, magnitude, affected component, reset and cleanup. Include no-fault controls and a positive control proving the injection occurred. Test both explicit failures and plausible corruptions that retain a valid schema. Distinguish injected occurrence from observed harm, recovery and successful diagnosis. A detector can miss a harmless recovered fault; a system can diagnose a fault and still make an unsafe repair.

[DERIVED] Build temporal scenarios: response before deadline, response after cancellation, duplicate response, unavailable dependency, stale cache entry, out-of-order stream and an acknowledgment lost after commitment. Track per-epoch publication rights. Cancellation acknowledgment from a client does not imply device quiescence; buffers and tool handles remain owned until completion or safe quarantine. Missing-stream masks must keep unavailable values out of numerical operations, rather than multiplying NaNs by zero. These tests connect directly to [Chapter 42](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch42-prefill-decode-kv-state-and-inference-resource-models/README.md) resource lifetimes and [Chapter 57](../../part-10-multimodal-world-and-embodied-models/ch57-video-temporal-reasoning-and-streaming-multimodality/README.md) causal stream admission.

[DERIVED] For metamorphic testing, independently qualify that the mutation preserves its claimed evidence or specifies a known update. A change in embedding or retrieval depth can remove the needed evidence; unconditional output invariance is then the wrong oracle. Separate an invalid transformation from a system violation. Judge-based equivalence requires independent auditing and uncertainty from [Chapter 62](../ch62-human-preference-model-judges-and-uncertainty/README.md).

```figure
{
  "id": "fig-63.13",
  "kind": "diagram",
  "title": "Qualify the mutation before scoring",
  "caption": "The test first establishes a valid transformation, then scores its required relation and side-effect invariants. Invalid mutations retain a separate ledger.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.10",
  "alt": "The test first establishes a valid transformation, then scores its required relation and side-effect invariants. Invalid mutations retain a separate ledger.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Task + operator"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Independent validity check"
      },
      {
        "id": "n2",
        "kind": "state",
        "label": "Valid relation / invalid case"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Controlled execution"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Relation + invariant audit"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Severity and outcome ledger"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n1"
      },
      {
        "from": "n1",
        "to": "n2"
      },
      {
        "from": "n2",
        "to": "n3",
        "label": "valid"
      },
      {
        "from": "n3",
        "to": "n4"
      },
      {
        "from": "n4",
        "to": "n5"
      },
      {
        "from": "n2",
        "to": "n5",
        "label": "invalid retained"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 63.4 — Execute a bounded fault and mutation campaign.**

[DERIVED] **Inputs:** finite task/fault matrix, mutation predicates, intensity grid, frozen retry/recovery policy and isolated environment. **Outputs:** valid-injection ledger, outcomes, invariant violations and recovery times.

1. Freeze the case roster, activation rules and expected relation before running the system. Verify operator applicability and isolate destructive effects to disposable state.
2. Execute matched no-fault and injected cases with controlled/reset state. Confirm injection using a trusted channel hidden from diagnosis. Retain failed activation and invalid mutations separately.
3. Trace deadline, retry, cancellation and operation identities; observe both immediate and delayed state effects through bounded post-run checks.
4. Score the declared relation and noncompensable invariants. For unavailable evidence, require the designated fallback rather than an answer that presumes unseen information.
5. Audit ambiguous mutation/oracle labels, compare on a common valid-case cohort and compute task-cluster uncertainty. Publish severity curves and design weights separately from any field prevalence.
6. Quiesce or quarantine outstanding work and reset the environment. Stop at finite matrix, time and cleanup limits; unresolved cleanup is an explicit failure state.

[DERIVED] A $N$-task, $F$-fault, $I$-intensity, $r$-repeat design has up to $NFIr$ injected episodes plus controls and oracle calls. Reusing one original task across mutants requires clustered analysis; it does not provide $FIr$ independent task samples.

## Implementation

[DERIVED] The injector and trusted recorder must not rely on the same failure-prone channel as the agent under test. Keep the activation ledger separate from sanitized traces, and allow identifiers to join them only after diagnosis. Inject realistic boundary events without accidentally changing prompt instructions or revealing the fault name. For lost acknowledgments, inspect committed state using a trusted read path; for delays, measure actual arrival/deadline times, not requested sleep duration alone.

[DERIVED] A compact implementation artifact describes operator ID/version, activation predicate, changed fields, eligible units, intensity, expected relation, side-effect budget and cleanup state. Preserve the nominal trace when it is actually paired, and disclose stochastic differences. [R63.7] illustrates that a structured trace view can discard timing/content distinctions; retain complete traces for auditing. Streaming faults should use support intervals and calibrated event times, not only an arbitrary frame index.

## Experimental design

[ASSUMED] Compare no recovery, bounded retry, status-query/idempotent recovery and a human-escalation policy under matched injected events. Measure terminal task/policy/integrity gates, duplicate effects, late publications, unresolved state and costs. Independently audit mutation validity and a sample of relation judgments. Report uncertainty by original task and scenario, with outcome bounds for ambiguous labels. Experiment 63.2 specifies the unexecuted campaign; no fault injection or mutation experiment was executed here.

## Observations

**What the paper claims.** [PAPER-REPORTED] The RAG mutation study defines pre/post-chunk operators and transformation-specific relations [R63.4, §§3–5].

**What the evidence shows.** [PAPER-REPORTED] It samples 300 qualified base cases per dataset, producing 28,500 mutants across five datasets; selection and judge auditing are explicit [R63.4, §§5.2–5.5, Table 1]. AgentChaosBench supplies 250 faulty traces and 25 controls across five applications and ten fault types [R63.5, §2].

**What we infer.** [DERIVED] Operator coverage, real-world fault prevalence and oracle validity are distinct requirements. Baseline-correct selection limits transfer.

**What remains unknown.** [UNVERIFIED] These suites do not establish field failure frequencies, complete fault coverage or guarantees under compound overload.

## Failure modes

> **Failure mode — Testing invariance after destroying needed evidence.** [DERIVED] *Symptom:* a correct abstention or changed answer is labeled a robustness failure. *Cause:* the mutation changes task-relevant information while the oracle assumes semantic preservation. *Detection:* independently inspect support preservation and the required response relation. *Mitigation:* qualify mutations, separate invalid cases and use update/conflict/fallback predicates when the information state changes.

[DERIVED] Other decisive cases include a timeout after successful commitment, a retry with a new operation ID, a delayed result published into a new epoch, a cache serving an obsolete policy and a missing modality replaced by fabricated content. More retries or a larger model can worsen these cases. An injector that simply edits the final trace cannot measure the agent's actual recovery response.

```figure
{
  "id": "fig-63.14",
  "kind": "compare",
  "title": "Lost acknowledgment is ambiguous state",
  "caption": "A retry must distinguish confirmed non-commitment from an unknown write outcome; a fresh operation identity can duplicate the effect.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-63.11",
  "alt": "A retry must distinguish confirmed non-commitment from an unknown write outcome; a fresh operation identity can duplicate the effect.",
  "spec": {
    "axis": "Recovery after a write timeout",
    "columns": [
      {
        "id": "a",
        "label": "Confirmed not committed"
      },
      {
        "id": "b",
        "label": "Commit state unknown"
      }
    ],
    "rows": [
      {
        "dimension": "Permitted next step",
        "values": {
          "a": "Retry under declared policy",
          "b": "Query status / idempotent retry / escalate"
        }
      },
      {
        "dimension": "Unsafe assumption",
        "values": {
          "a": "Timeout always means failure",
          "b": "New key always means same operation"
        }
      },
      {
        "dimension": "Required evidence",
        "values": {
          "a": "Trusted commit result",
          "b": "Durable identity and status semantics"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Use deterministic boundary injection when the failure mechanism is known and controllable; use measured incident replay to test realistic timing/content; use exploratory adversarial search to discover new cases and then freeze an independent confirmation set. Reverse a broad random-fault suite if it never reaches the consequential boundary. Reverse a handpicked-only suite if it supports an unjustified claim about ordinary prevalence.

## Extensions

[DERIVED] Add intensity/interaction surfaces for delay plus load, stale data plus cache and missing modality plus language shift. Pair operational faults with semantic validity checks. Test a partial repair after restart and under fresh traffic. A policy should improve a specified invariant or recovery boundary; merely producing a longer explanation under stress is not evidence of resilience.

## Limitations

[DERIVED] Synthetic faults approximate selected mechanisms. A fixture can be easier to detect than an actual incident or can produce impossible combinations of state. Metamorphic testing inherits its relation oracle and validity labels. Unknown fault families and long-lived side effects remain outside a finite suite. No finite matrix proves universal reliability.

## Reproducibility

[DERIVED] Preserve operator/source versions, original and mutated evidence, validity adjudication, all offered/eligible counts, intensity, event times, operation IDs, cleanup status and labels hidden during diagnosis. Report the design mixture and any independently estimated production weights. Keep expected outcomes as hypotheses until executed; [verification](verification.md) contains proposals, not measured observations.

## References

[R63.4] Kim, Pasini and Tonella, inspected v1 (2026-07-29), §§3–6, Table 1 and §8 threats. [R63.5] Zhang et al., inspected v1 (2026-08-04), §§2–3, Tables 2–4. [R63.7] pinned formatter, static inspection. Exact implementation/release dates are in [references](references.md).
