---
id: ms.section.66.2
entity_type: section
title: "Artifact integrity"
volume: 3
part: 11
chapter: 66
section: 66.2
slug: 66-2-artifact-integrity
parent: ms.chapter.66
prev_sibling: ms.section.66.1
next_sibling: ms.section.66.3
children: []
prerequisites: [ms.chapter.6, ms.chapter.30, ms.chapter.47, ms.chapter.48, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
downstream: []
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

# 66.2 Artifact integrity

## Scope

[DERIVED] Artifact integrity binds datasets, checkpoints/shards, tokenizer, adapters, preprocessing, engine, configuration and evaluator. Distinguish byte identity, trusted origin, freshness, environment compatibility and behavior. The output is an immutable release manifest with verified loading/publication. [Chapter 30](../../../vol-02-execution-and-optimization/part-05-hardware-kernels-and-distributed-execution/ch30-large-training-runs-reliability-monitoring-and-recovery/README.md) supplies checkpoint lineage, [47](../../../vol-02-execution-and-optimization/part-08-inference-engines-and-production-serving/ch47-observability-deployment-changes-and-incident-recovery/README.md) recovery and [65](../ch65-security-privacy-safety-and-adversarial-robustness/README.md) the trust model.

## Why this exists

[DERIVED] A checkpoint can stay unchanged while its tokenizer, template, kernel or dependency changes. A digest stored beside an artifact can be replaced with it; a valid signature can authenticate obsolete or malicious content. Two independently replaced files are not one atomic transaction. Scientific support requires the complete tested dependency set and a trustworthy activation boundary.

## Intuition

[DERIVED] The manifest is a typed dependency graph. Each item has a role, digest, immutable locator, size, producer, provenance and license/access terms. Routing identity may intentionally cover fewer fields than reproducibility identity; record both projections. Content identity does not establish legal rights or a behavior-preserving transformation.

## Formulation

[MATHEMATICALLY-DERIVED] For immutable bytes $A_i$, typed metadata $m_i$ and specified unambiguous serialization,

$$
h_i=H(\operatorname{canon}(m_i,H(A_i),h_{p_1},\ldots,h_{p_r})),\quad h_{\rm release}=H(\operatorname{canon}(h_1,\ldots,h_M,\mathrm{config},\mathrm{evaluator})).


$$
*(Eq. 66.4)*

[DERIVED] Fix ordering, types and domain separation; variable-length raw concatenation can be ambiguous. Trusted reference digests, complete dependency coverage and collision resistance are premises.

$$
V_{\rm bytes}=\mathbf1\{H(A)=d_{\rm trusted}\},\qquad V_{\rm env}=\mathbf1\{\Pi_R(E_{\rm current})=\Pi_R(E_{\rm reference})\}.


$$
*(Eq. 66.5)*

[DERIVED] Matching an environment projection $\Pi_R$ does not prove omitted drivers, services or variables irrelevant. For $B$ bytes and sustained scan bandwidth $\beta>0$,

$$
T_{\rm scan}\ge B/\beta,\qquad T_{\rm scan,ideal}=B/\beta,\qquad M_{\rm streaming}=O(b_{\rm chunk}).


$$
*(Eq. 66.6)*

[DERIVED] The instrument executes only ideal scan seconds from bytes and bytes/second. Hashing, authentication, opening files and environment checks add work; contention/cache state change bandwidth.

```figure
{
  "id": "fig-66.6",
  "kind": "calculator",
  "title": "Scan-time resource boundary",
  "caption": "Eq. 66.6 ideal scan only; chosen bandwidth is not measured hashing speed or full verification latency.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-66.6",
  "alt": "Eq. 66.6 ideal scan only; chosen bandwidth is not measured hashing speed or full verification latency.",
  "spec": {
    "tex": "T_{\\rm scan,ideal}=B/\\beta",
    "equation": "66.6",
    "inputs": [
      {
        "symbol": "bytes",
        "label": "Artifact bytes",
        "default": 1073741824,
        "min": 1048576,
        "max": 1099511627776,
        "format": "raw"
      },
      {
        "symbol": "rate",
        "label": "Sustained bytes per second",
        "default": 500000000,
        "min": 1000000,
        "max": 10000000000,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "seconds",
        "label": "Ideal scan seconds",
        "formula": "bytes/rate",
        "format": "seconds"
      }
    ]
  },
  "states": [
    {
      "anchor": "formulation",
      "label": "Explicit units",
      "variables": {
        "bytes": 1073741824,
        "rate": 500000000
      },
      "note": "One GiB is represented in bytes.",
      "highlight": [
        "seconds"
      ]
    },
    {
      "anchor": "mechanism",
      "label": "Larger set",
      "variables": {
        "bytes": 107374182400,
        "rate": 500000000
      },
      "note": "Scan work scales with bytes.",
      "highlight": [
        "seconds"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "Contended storage",
      "variables": {
        "bytes": 107374182400,
        "rate": 10000000
      },
      "note": "Low bandwidth can dominate activation.",
      "highlight": [
        "seconds"
      ]
    }
  ]
}
```

## Mechanism

[DERIVED] Freeze data inclusion/preprocessing/splits; model/shards/adapters; tokenizer vocabulary/normalization/template; engine, kernels, precision/quantization; policies/tools; evaluator/labels; packages, driver/OS, hardware and runtime flags. Mark hosted hidden fields unavailable. Establish trust before executable deserialization. Authenticate the manifest, verify size/digests, compare represented runtime under an explicit reject/warn policy and load the bytes actually verified. Publish an immutable coherent directory, then atomically switch a small activation pointer. Preserve the previous pointer and recovery procedure.

```figure
{
  "id": "fig-66.7",
  "kind": "diagram",
  "title": "Verify before activation",
  "caption": "The candidate remains staged until identity, runtime and behavioral controls pass; failed verification preserves the prior set.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.4",
  "alt": "The candidate remains staged until identity, runtime and behavioral controls pass; failed verification preserves the prior set.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Trusted manifest"
      },
      {
        "id": "n1",
        "kind": "memory",
        "label": "Staged immutable set"
      },
      {
        "id": "n2",
        "kind": "process",
        "label": "Bytes + runtime checks"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Behavior controls"
      },
      {
        "id": "n4",
        "kind": "state",
        "label": "Activation pointer"
      },
      {
        "id": "n5",
        "kind": "memory",
        "label": "Prior set retained"
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
        "to": "n3"
      },
      {
        "from": "n3",
        "to": "n4",
        "label": "pass"
      },
      {
        "from": "n2",
        "to": "n5",
        "label": "reject"
      },
      {
        "from": "n3",
        "to": "n5",
        "label": "reject"
      }
    ]
  }
}
```

## Algorithm

**Algorithm 66.2 — Bind and activate a coherent set.** [DERIVED] **Inputs:** finite manifest, trusted verification material, allowed runtime and previous release. **Outputs:** immutable verified candidate or rejection.

1. Validate schema, roles, authorization and freshness policy.
2. Stage immutable members and verify sizes/digests/dependency closure before executable loading.
3. Compare environment projection and enforce mismatch policy.
4. Load protected verified bytes and run interface/numerical/behavior controls.
5. Apply the storage durability procedure, freeze the set and serialize activation-pointer switching.
6. On failure recover the prior coherent release and bound cleanup. 

[DERIVED] Hashing costs $O(\sum_i|A_i|)$ time with chunk memory; graph checks cost $O(M+E)$. Atomicity, durability and authentication are distinct.

## Implementation

[OFFICIAL-DOCUMENTATION] Pinned Modelstamp v0.1.4 load performs configured optional HMAC authentication, verifies a stream, compares environment and deserializes that stream; environment mismatch defaults to warning. Its signature check accepts an unsigned manifest when no verification key is supplied; a caller requiring authenticated origin must enforce the key/signature policy. A shared-key HMAC does not establish public publisher authentication. Its pair writer stages files and rolls back but explicitly lacks a two-path filesystem transaction [R66.8, load/_verify_stream/_commit_artifact_pair]. [DERIVED] Cooperating locks do not constrain an adversarial filesystem actor; same-handle loading reduces path-replacement races but cannot prevent mutation of that opened file. Use immutable storage/permissions when required. [OFFICIAL-DOCUMENTATION] Stable JSON signing and environment projection are explicit in the manifest implementation [R66.9, signing_bytes/_diff_environments]. [DERIVED] This static inspection establishes neither safe deserialization nor complete dependency capture.

## Experimental design

[ASSUMED] Challenge a disposable fixture with missing shard, tokenizer mismatch, runtime drift, artifact/manifest replacement, replay, interrupted publication and noncooperating modification. Establish baseline validity and each control's expected guarantee before mutation. Experiment 66.2 in [verification](verification.md) is unexecuted; no package was installed or artifact loaded here.

## Observations

**What the paper claims.** [PAPER-REPORTED] Modelstamp separates artifact consistency and represented runtime drift before deserialization [R66.2, §§II–IV].

**What the evidence shows.** [PAPER-REPORTED] Fourteen drift and eight trust-boundary scenarios include expected acceptance of shared-key replacement and valid-pair replay [R66.2, Tables IV–V].

**What we infer.** [DERIVED] Bytes, origin, freshness and behavior need distinct controls.

**What remains unknown.** [UNVERIFIED] These cases do not certify arbitrary serialized models or omitted dependencies.

## Failure modes

> **Failure mode — Coherent digest, incoherent system.** [DERIVED] *Symptom:* a signed checkpoint loads with the wrong tokenizer, policy or evaluator. *Cause:* identity omits behavior-changing dependencies. *Detection:* reconcile manifest roles and controlled mismatches against runtime. *Mitigation:* bind the full tested set and distinguish a narrower routing identity. Replacing both an unsigned artifact and its digest preserves self-consistency without trusted origin; replay preserves authentication without freshness. Neither makes unsafe deserialization harmless.

```figure
{
  "id": "fig-66.8",
  "kind": "compare",
  "title": "Different verification questions",
  "caption": "Byte integrity, origin, freshness and behavior require distinct evidence.",
  "placement": "rail",
  "anchor": "failure-modes",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-66.5",
  "alt": "Byte integrity, origin, freshness and behavior require distinct evidence.",
  "spec": {
    "axis": "Declared Control boundary",
    "columns": [
      {
        "id": "a",
        "label": "Establishes"
      },
      {
        "id": "b",
        "label": "Remains separate"
      }
    ],
    "rows": [
      {
        "dimension": "Digest",
        "values": {
          "a": "Reference byte match",
          "b": "Trusted origin and behavior"
        }
      },
      {
        "dimension": "Authentication",
        "values": {
          "a": "Authorized key relation",
          "b": "Freshness and benign content"
        }
      },
      {
        "dimension": "Environment projection",
        "values": {
          "a": "Recorded fields match",
          "b": "Omitted dependencies and outcomes"
        }
      }
    ]
  }
}
```

## Siblings

[DERIVED] Use immutable content-addressed sets for activation, authenticated registries for authorization, lockfiles for reconstruction and behavioral controls for consequences. Reverse digest-only checking when origin/environment matters. Reverse warning-only drift handling when exact supported state is a release requirement. A lockfile and runtime manifest answer different questions.

## Extensions

[DERIVED] Extend lineage through merging, conversion, quantization and engine compilation, recording transformation and validation after each. Retain rights/access metadata without publishing restricted data. Ask whether the intended predicate is preserved within tolerance rather than whether filenames resemble the original.

## Limitations

[DERIVED] Completeness is relative to a dependency model. Hardware nondeterminism and hosted services can escape it. Authentication does not establish benevolence; finite mismatch tests do not prove universal compatibility. Atomic publication does not reverse external writes already performed by a running candidate.

## Reproducibility

[DERIVED] Archive schema/canonicalization, trusted verification identities without secrets, immutable hashes, source commits, environment projection, expected controls, activation/recovery logs and unavailable fields. Only the named source functions were statically inspected; runtime claims remain unverified.

## References

[R66.2] Dhekne, v1 PDF (2026-09-01), §§II–VI, Tables IV–V. [R66.8–R66.9] Pinned Modelstamp v0.1.4 functions; exact commit/date in [references](references.md).
