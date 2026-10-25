---
id: ms.section.65.4
entity_type: section
title: "Controls"
volume: 3
part: 11
chapter: 65
section: 65.4
slug: 65-4-controls
parent: ms.chapter.65
prev_sibling: ms.section.65.3
next_sibling: ms.section.65.5
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.24, ms.chapter.32, ms.chapter.33, ms.chapter.34, ms.chapter.35, ms.chapter.36, ms.chapter.46, ms.chapter.47, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64]
downstream: [ms.chapter.66]
related: [ms.chapter.30, ms.chapter.42, ms.chapter.48]
relations: []
axes: {lifecycle: [pretraining, post_training, inference, evaluation, assurance], mechanism: [security_boundary, privacy_accounting, adversarial_evaluation], feedback_setting: [], modality: [text, code, image, tool_trajectory]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 65.4 - Controls

## Scope

[DERIVED] Controls include isolation, access mediation, provenance, secret handling, bounded capabilities, action/output checks and monitoring. Differential privacy protects a declared neighboring-data relation; it is not a universal security control. A defense must identify the invariant it enforces and the assumptions under which it does so.

## Why this exists

[DERIVED] A natural-language safeguard can fail alongside the model it monitors. A formally private release can still expose public information, authorized sensitive facts or logs outside the mechanism. A provenance check identifies bytes and origin, while permission checks limit effects. Combining controls requires a dependency analysis rather than counting layers.

## Intuition

[DERIVED] Structural controls reduce reachable consequences. Statistical controls reduce observed behavioral errors. Formal privacy bounds the change in a mechanism's output distribution when one declared unit changes. These operate on different objects and can be complementary without being probabilistically independent.

## Formulation

[MATHEMATICALLY-DERIVED] A randomized mechanism M is (epsilon,delta)-DP under a declared adjacency relation when every measurable output set S and neighboring D,D' satisfy

$$
 \Pr[M(D)\in S]\le e^\epsilon\Pr[M(D')\in S]+\delta.
$$
*(Eq. 65.13)*

[DERIVED] Specify record/user/conversation adjacency and add/remove versus replacement. If a user contributes k records, a record-level guarantee is not automatically user-level with the same parameters. Sampling, clipping and composition must match the unit. Delta is not simply the probability that a person's data leaks.

[MATHEMATICALLY-DERIVED] An explicitly normalized clipped-gradient update is

$$
 \bar g_i=g_i\min(1,C/\|g_i\|_2),\quad
 \widetilde g=\frac1b\left(\sum_{i\in\mathcal B}\bar g_i+Z\right),\quad
 Z\sim\mathcal N(0,\sigma^2C^2I),\quad\theta^+=\theta-\eta\widetilde g.
$$
*(Eq. 65.14)*

[DERIVED] Define the zero-gradient case as bar_g=0. b is the declared normalization, not a random denominator silently changing the mechanism. A fixed clipped sum has add/remove sensitivity C and replace-one sensitivity at most2C; the batch-mean sensitivities include division by b. The applicable sampled-mechanism accountant depends on sampling law, adjacency, noise convention and repeated access. Per-example gradients can require substantial memory; microbatch or ghost-clipping implementations need equivalent clipping semantics.

[MATHEMATICALLY-DERIVED] Basic adaptive composition, conditional on each mechanism satisfying its stated bound, yields

$$
 \epsilon_{total}\le\sum_j\epsilon_j,\qquad
 \delta_{total}\le\sum_j\delta_j.
$$
*(Eq. 65.15)*

[DERIVED] Tighter accountants can improve this bound under their own premises. Private histogram selection, private label aggregation and final training all belong in the ledger. Subsequent computation using only a released DP object and public information is post-processing; fresh raw-private-data validation or layer selection is another private access. Hyperparameter/search releases can consume privacy even when only the winning model is published.

[MATHEMATICALLY-DERIVED] For two controls with marginal miss probabilities m1,m2 on the same attack distribution, the joint miss is bounded by

$$
 \max(0,m_1+m_2-1)\le\Pr[miss_1\cap miss_2]\le\min(m_1,m_2).
$$
*(Eq. 65.16)*

[DERIVED] The product m1*m2 is the independent-miss specialization. Shared training data, teachers, policy definitions and model representations can correlate failures. Sequential gating changes the distribution seen by the second control; unconditional stand-alone rates do not generally identify the cascade's conditional miss rate.

```figure
{
  "id": "fig-65.12",
  "kind": "calculator",
  "title": "Layering does not imply independent failures",
  "caption": "Eq.65.16 bounds the same-distribution joint miss; the product is an explicitly hypothetical independent specialization.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-65.16",
  "alt": "Eq.65.16 bounds the same-distribution joint miss; the product is an explicitly hypothetical independent specialization.",
  "spec": {
    "equation": "65.16",
    "tex": "\\max(0,m_1+m_2-1)\\le m_{joint}\\le\\min(m_1,m_2)",
    "inputs": [
      {
        "symbol": "m1",
        "label": "First control miss probability",
        "default": 0.2,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "m2",
        "label": "Second control miss probability",
        "default": 0.3,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "lower",
        "label": "Joint-miss lower bound",
        "formula": "max(0,m1+m2-1)",
        "format": "percent"
      },
      {
        "symbol": "upper",
        "label": "Joint-miss upper bound",
        "formula": "min(m1,m2)",
        "format": "percent"
      },
      {
        "symbol": "ind",
        "label": "Independent specialization",
        "formula": "m1*m2",
        "format": "percent"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[PAPER-REPORTED] DP-SelFT builds public candidates, performs private selection/label aggregation, uses private synthetic data for layer selection, then privately fine-tunes. Its budget divides synthesis and training. Appendix B ranks temporarily trained individual layers and selects top15; this heuristic is not an exhaustive subset optimizer. Its risk argument assumes uniform synthetic/private risk agreement and a bounded noise region, with a tail term; Gaussian noise itself is unbounded. Table 1 includes OPT350M epsilon1 MNLI40.2 versus 40.8 for full tuning, so utility dominance is not uniform. Section 5.1 declares total delta=1e-5, C=1, batch 64, 1000 steps and 1024 records; complete sampled-mechanism accounting and executable equivalence still require an implementation audit. [R65.6, Section 4; Table 1; Appendices B,F]

[MATHEMATICALLY-DERIVED] Under Eq.65.14's fixed normalization, the smoothness penalty attributable to isotropic gradient-sum noise is beta*eta^2*d*sigma^2*C^2/(2*b^2), conditional on the current clipped gradient and independent zero-mean noise. Reducing trainable dimension d reduces this term, but can also remove useful gradient signal. This one-update bound neither establishes global optimization convergence nor ranks arbitrary layer subsets.

[DERIVED] The source's minimax transfer argument adds 2*tau for uniform synthetic/private risk discrepancy and alpha*B for noise outside radius rho. That tail term requires loss bounded by B on the tail as well as inside the ball. Appendix F.2 places its written bound under an in-ball quantifier, then uses B outside the ball in the expectation split; the chapter requires an explicit global loss bound. Uncapped cross-entropy does not satisfy it. A low tail probability alone cannot bound expected unbounded tail loss. A practical independent-layer ranking also needs an optimization-gap term if substituted for the exact minimizing selector in the theorem.

[DERIVED] The source's histogram sensitivity1 is compatible with add/remove one-hot contribution adjacency. Under replace-one adjacency the same histogram can change by sqrt(2); clipped gradient sums can change by2C. This is a declared-mechanism audit requirement, not a claim that the source's guarantee is automatically false. A public remote prompt must not encode private examples or private-derived semantics unless that release is accounted for.

[OFFICIAL-DOCUMENTATION] July 28MCP security guidance requires audience-appropriate tokens rather than passthrough, explicit client-bound consent in confused-deputy settings, scoped permissions and protections against unsafe server-side URL resolution. These are protocol/application obligations; a model's agreement with them does not implement them. [R65.10, Confused deputy; Token passthrough; SSRF; Scope minimization]

```figure
{
  "id": "fig-65.13",
  "kind": "diagram",
  "title": "Private access belongs in one accounting graph",
  "caption": "Only arrows downstream of a valid private release and public information qualify as post-processing. New raw-data access re-enters the accountant.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.13",
  "alt": "Only arrows downstream of a valid private release and public information qualify as post-processing. New raw-data access re-enters the accountant.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "p",
        "kind": "dataset",
        "label": "Raw private records"
      },
      {
        "id": "s",
        "kind": "process",
        "label": "Private selection/labeling"
      },
      {
        "id": "y",
        "kind": "dataset",
        "label": "DP synthetic release"
      },
      {
        "id": "l",
        "kind": "process",
        "label": "Layer selection from release"
      },
      {
        "id": "f",
        "kind": "process",
        "label": "DP fine-tuning"
      },
      {
        "id": "a",
        "kind": "boundary",
        "label": "Accountant and release gate"
      }
    ],
    "edges": [
      {
        "from": "p",
        "to": "s",
        "kind": "flow",
        "label": "account access"
      },
      {
        "from": "s",
        "to": "y",
        "kind": "flow",
        "label": "private release"
      },
      {
        "from": "y",
        "to": "l",
        "kind": "flow",
        "label": "post-processing if no raw access"
      },
      {
        "from": "p",
        "to": "f",
        "kind": "flow",
        "label": "account training"
      },
      {
        "from": "l",
        "to": "f",
        "kind": "dependency",
        "label": "chosen subset"
      },
      {
        "from": "s",
        "to": "a",
        "kind": "dependency",
        "label": "privacy cost"
      },
      {
        "from": "f",
        "to": "a",
        "kind": "dependency",
        "label": "privacy cost"
      }
    ]
  }
}
```

## Algorithm

### Algorithm 65.4 — Assemble controls with explicit claims

[DERIVED] Inputs: threat snapshot, authorized workload and a versioned control graph. Outputs: bounded capabilities, privacy ledger where relevant and a testable release rule.

1. Remove unnecessary privileges and isolate loading/execution; specify all allowed filesystem, network, tenant and secret paths.
2. Bind provenance to bytes and dependencies, and authorization to the current principal/resource/action. Keep secrets outside model-readable context where the task permits.
3. Specify each behavioral control's policy, input trust, teacher/judge and refusal/utility behavior; identify shared failure dependencies.
4. For privacy, declare the unit/adjacency and every raw-data access, clipping, sampling, noise and release. Account selection, retries and tuning before release.
5. Audit post-processing claims by tracing data dependencies. If a step reads raw private validation data, either account it or remove the access.
6. Evaluate the composed pipeline with held-out attacks and legitimate tasks, recording conditional misses, actual side effects, latency and resource costs. Reject unresolved accounting or authorization paths.

[DERIVED] The release gate checks conditions rather than assigning one universal security score. Full mediation is conditional on complete path coverage; DP composition is conditional on each mechanism and accountant matching its implementation.

## Implementation

[DERIVED] A capability should be narrow in operation, resource, destination and lifetime. Credentials belong in a broker that validates every call, rather than in a prompt or tool response. Logs, exception traces, model-visible errors, monitor explanations and telemetry need separate redaction/access/retention design. A rejected action can still disclose its arguments through logging.

[DERIVED] Isolation has practical resource costs: sandbox startup, network mediation, serialization, process memory and denied-operation handling. Per-example gradient clipping and privacy accounting have compute/memory overhead. Monitoring shares prefix computation when the runtime supports it, but adds decoding and storage. Measure the complete legitimate-task path and the attack path; a cheap monitor with expensive retries may raise total cost.

```figure
{
  "id": "fig-65.14",
  "kind": "compare",
  "title": "A control is justified by a protected invariant",
  "caption": "Engineering consequences follow the mechanism rather than the number of layers.",
  "placement": "inline",
  "anchor": "implementation",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.14",
  "alt": "Engineering consequences follow the mechanism rather than the number of layers.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "claim",
        "label": "Claim"
      },
      {
        "id": "mechanism",
        "label": "Mechanism"
      },
      {
        "id": "test",
        "label": "Required check"
      }
    ],
    "rows": [
      {
        "dimension": "Access isolation",
        "values": {
          "claim": "Forbidden asset is unreachable",
          "mechanism": "OS/store/network privileges",
          "test": "All modeled paths and bypass attempts"
        }
      },
      {
        "dimension": "Action mediation",
        "values": {
          "claim": "Only authorized effect commits",
          "mechanism": "Principal/resource-bound broker",
          "test": "Actual state, retries and stale approval"
        }
      },
      {
        "dimension": "Private training",
        "values": {
          "claim": "Bounded neighboring influence",
          "mechanism": "Clipping/noise/accountant",
          "test": "Unit, sampling, all releases and code semantics"
        }
      },
      {
        "dimension": "Behavioral monitor",
        "values": {
          "claim": "Reduced tested policy violations",
          "mechanism": "Classifier/self-assessment",
          "test": "Adaptive misses and legitimate utility"
        }
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[DERIVED] Experiment 65.3 tests mediation and monitoring jointly; Experiment 65.2 adds a privacy-accounting fixture. Neither claims a formal deployed guarantee from a smoke test. Compare each control alone with the composed system under identical attack and benign workloads, retaining conditional event counts and uncertain execution outcomes.

## Observations

**What the paper claims.** [PAPER-REPORTED] DP-SelFT improves privacy/utility efficiency in studied fine-tuning settings using private synthetic selection and selective updates [R65.6].

**What the evidence shows.** [DERIVED] The method's theory needs explicit transfer/noise assumptions, its layer selection is heuristic, and reported utility includes a negative cell.

**What we infer.** [DERIVED] Complete mechanism accounting and enforced permission boundaries are more informative than an unsupported count of defense layers.

**What remains unknown.** [UNVERIFIED] This manuscript does not verify a released DP accountant, production sandbox completeness or live protocol conformance.

## Failure modes

[DERIVED] Unaccounted private selection, mismatched adjacency, batch-normalization mistakes, a mutable allowlist, token passthrough, secret-bearing error logs, bypassable mediation and correlated monitor failures can defeat an otherwise plausible design. DP does not prevent malicious output or unauthorized access outside the mechanism.

## Siblings

[DERIVED] @ms.chapter.30 owns training systems, @ms.chapter.47 inference systems and @ms.chapter.51 protocol/execution. @ms.section.65.2 distinguishes privacy attacks; @ms.section.65.5 evaluates behavioral controls and @ms.chapter.66 owns the deployment evidence handoff.

## Extensions

### Improvements and their evidence

[DERIVED] Prefer structural reduction of an unnecessary capability. Choose DP when the protected unit and utility budget are acceptable and accounting is reproducible. Add a behavioral layer when held-out results demonstrate complementary benefit. Reverse choices if dependencies erase the supposed gain, legitimate utility degrades excessively, or the accountant cannot support the release. Unresolved formal premises should block a formal guarantee rather than be hidden behind an empirical success rate.

## Limitations

[DERIVED] This is a design/accounting analysis. Static inspection cannot establish that a production application enforces every path, and source tables do not independently validate privacy parameters. No private training was run.

## Reproducibility

[DERIVED] Archive control configuration, permissions, token audience/scope policy, destination resolution rules, accountancy inputs/outputs, adjacency, clipping normalization, release history and held-out event logs. Record omitted implementation details as gaps.

## References

[R65.6,R65.10] Exact revisions and assumptions: @ms.references.65.
