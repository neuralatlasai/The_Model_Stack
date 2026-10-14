---
id: "ms.section.47.6"
entity_type: "section"
title: "47.6 — Operational learning"
volume: 2
part: 8
chapter: 47
section: 47.6
slug: "47-6-operational-learning"
parent: "ms.chapter.47"
prev_sibling: "ms.section.47.5"
next_sibling: ms.verification.47
children: []
prerequisites: ["ms.chapter.30","ms.chapter.43","ms.chapter.44","ms.chapter.45","ms.chapter.46"]
downstream: ["ms.chapter.48","ms.chapter.66"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["observability","deployment","recovery"],"feedback_setting":[],"modality":["text"]}
papers: []
implementations: ["impl.pytorch","impl.vllm","impl.sglang","impl.nvidia-nccl"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 47.6 — Operational learning

## Scope

[DERIVED] Operational learning converts incidents into testable claims, bounded counterfactuals, remediation and updated evaluations. Its artifact is an evidence ledger and runbook whose conclusions can be revised as new information arrives. We develop incident timelines, replay, root-cause evidence and regression tests without inventing a production incident or treating postmortem consensus as experimental proof.

## Why this exists

[DERIVED] An incident response is optimized for restoring service, often under incomplete information. Its first successful mitigation can become the remembered “cause,” even when several actions occurred together. Later analysis must separate symptom, trigger, enabling condition, failed protection, mitigation and confirmed mechanism. This distinction determines whether the next test prevents recurrence or merely recreates the last symptom.

[DERIVED] Production evidence is also selected. Severe incidents receive postmortems; silent quality failures may not. Easily diagnosed cases get specific labels, while ambiguous cases can be excluded. Counterfactual replay changes arrival patterns, cache histories and side effects. Learning from incidents therefore needs explicit inclusion rules and replay boundaries as carefully as a research experiment does.

## Intuition

[DERIVED] Build a timeline with source references and uncertainty intervals. Place immutable release changes, workload changes, alerts, ownership transitions, mitigations and recovery boundaries on it. Then attach hypotheses that predict the observed sequence. A causal claim earns strength through independent signals and discriminating checks; repeating the same narrative in multiple reports does not create independent evidence.

```figure
{
  "id": "fig-47.18",
  "kind": "diagram",
  "title": "Evidence becomes a revisable operational claim",
  "caption": "A timeline and competing hypotheses precede remediation; new tests retain mechanism and provenance.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.22",
  "alt": "A timeline and competing hypotheses precede remediation; new tests retain mechanism and provenance. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "e",
        "kind": "memory",
        "label": "source evidence"
      },
      {
        "id": "t",
        "kind": "process",
        "label": "bounded timeline"
      },
      {
        "id": "h",
        "kind": "branch",
        "label": "hypotheses / falsifiers"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "discriminating checks"
      },
      {
        "id": "r",
        "kind": "feedback",
        "label": "remediation and tests"
      }
    ],
    "edges": [
      {
        "from": "e",
        "to": "t",
        "kind": "flow"
      },
      {
        "from": "t",
        "to": "h",
        "kind": "flow"
      },
      {
        "from": "h",
        "to": "c",
        "kind": "flow"
      },
      {
        "from": "c",
        "to": "r",
        "kind": "flow"
      },
      {
        "from": "c",
        "to": "h",
        "kind": "flow",
        "label": "unresolved"
      }
    ]
  }
}
```

[PAPER-REPORTED] A Microsoft incident study analyzes 156 severity-2/2.5 inference incidents from April–June 2025 using postmortems and operational records. A relabeled 31-incident sample reports 90% agreement and Cohen's kappa .89. Categories are reproducible annotations, not verified causal ground truth. Its rule selecting the first-listed cause in the incident summary, and its severity selection, constrain interpretation. [R47.7, §3 and Tables 3–4]

## Formulation

[MATHEMATICALLY-DERIVED] For observed outages $i$, GPU count $g_i$, duration $d_i$, eligible set $E$, and hypothesized replacement duration $s_i$, a duration-replacement counterfactual is

$$
 L=\sum_i g_id_i,\qquad
 S_{\rm cf}=\sum_{i\in E}g_i(d_i-s_i)_+,\qquad
 \rho_{\rm cf}=S_{\rm cf}/L\quad(L>0).
$$

(Eq. 47.20)

[DERIVED] The arithmetic is exact for the declared replacement model, but the model omits causal interactions unless they are explicitly included. Earlier recovery may change later failures, routing, queues and shadow availability. Detection and orchestration delays need the same boundary in $d_i$ and $s_i$. Savings in provisioned GPU-hours are not automatically energy savings, cost savings, or recovered successful user tasks.

[MATHEMATICALLY-DERIVED] For service demand $A(t)$, baseline available useful capacity $C_0(t)$, with $A,C_v$ measured in the same work units per second and $Q_v(0)\ge0$, and counterfactual $C_1(t)$, a fluid approximation to excess queued work obeys
$$
 Q_v(t)=Q_v(0)+\int_0^t[A(u)-C_v(u)]\,du+I_v(t),\qquad
 Q_v(t)\ge0,
$$

(Eq. 47.21)
where $I_v(0)=0$ and $I_v$ is the minimal nondecreasing regulator with $\int_0^t Q_v(u)\,dI_v(u)=0$. It therefore grows only at zero queue.

[DERIVED] Equation 47.21 is a reflected-work conservation model, not a measured request queue. It ignores discrete batching, heterogeneous deadlines and state-dependent throughput. It nevertheless shows why replacing outage durations alone cannot predict user impact: queue history and available post-recovery service rate matter. A faster ready event may leave substantial backlog or a cold KV pool.

[DERIVED] Root-cause claims can be represented by an evidence graph whose nodes are observations, transformations and hypotheses. A claim names which observations would change if its proposed mechanism were absent. Counterfactual replay is strongest when the intervention changes one relevant mechanism while preserving authorized inputs, initial state and exogenous arrival schedule. For stochastic generation, preserved seeds alone do not guarantee identical paths across kernels/releases.

## Mechanism

[DERIVED] The incident ledger records observed timestamps with clock/source boundaries, missing intervals, release and cache epochs, affected cohorts, visible outcomes, side-effect commitments, and every mitigation. Label each assertion as direct observation, source-reported account, derived inference or unresolved hypothesis. An alert timestamp is not the failure start; an operator's action timestamp is not the action's effective commit time.

[DERIVED] Counterfactual replay has several modes. Fixed-input functional replay tests outputs under known artifacts. Fixed-arrival performance replay tests resource behavior under a declared schedule. Recorded-stage replay holds intermediate inputs fixed and measures constrained pipeline work. Interactive replay reconstructs tools and environment state, which may be impossible. Report the mode and what adaptation it suppresses rather than calling all of them end-to-end reproduction.

[OFFICIAL-DOCUMENTATION] MLPerf LoadGen supplies query scheduling and completion interfaces; its README states that it does not know the model, input/output formats or accuracy scorer. Accuracy evaluation is supplied outside LoadGen. Thus adopting its harness does not by itself reproduce task quality or an incident environment. [R47.8, LoadGen README “Introduction” and “Integration”]

[DERIVED] Remediation should state a prevented transition or a detected invariant violation. Examples include requiring semantic cache keys, fencing stale publication, validating template/tokenizer compatibility, bounding retries, or preserving a missing terminal-reason counter. A new test case should retain the failure mechanism and provenance while stripping unnecessary sensitive content. Merely adding the exact failed prompt can overfit a symptom and miss the invariant.

```figure
{
  "id": "fig-47.19",
  "kind": "calculator",
  "title": "Duration replacement is a counterfactual",
  "caption": "Illustrative eligible GPU-hour difference; it omits changed queues, shadow availability and detection unless explicitly included.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-47.20",
  "alt": "Illustrative eligible GPU-hour difference; it omits changed queues, shadow availability and detection unless explicitly included. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "tex": "S=g\\max(d-s,0)/3600",
    "inputs": [
      {
        "symbol": "g",
        "label": "provisioned GPUs",
        "default": 8,
        "min": 1,
        "max": 1024,
        "format": "integer"
      },
      {
        "symbol": "d",
        "label": "observed recovery seconds",
        "default": 150,
        "min": 0,
        "max": 10000,
        "format": "seconds"
      },
      {
        "symbol": "s",
        "label": "hypothesized recovery seconds",
        "default": 7,
        "min": 0,
        "max": 10000,
        "format": "seconds"
      }
    ],
    "outputs": [
      {
        "symbol": "x",
        "label": "eligible GPU-hours difference",
        "formula": "g*max(d-s,0)/3600",
        "format": "fixed2",
        "emphasis": true
      }
    ]
  }
}
```

## Algorithm

### Algorithm 47.6 — Bounded incident learning

[DERIVED] Algorithm 47.6 processes a finite incident evidence set $E$ with a finite hypothesis list $H$, review deadline $D$, and authorized replay budget $B$. Initialize durable remaining budget $B_{\rm rem}=B$, an append-only ledger and mark causes unresolved. Outputs are a bounded conclusion, remediation ownership and test artifacts, with unknowns retained.

$$
\begin{aligned}
1.\;&\text{Validate evidence identity, source clock, release and retention authorization;}\\
 &\text{invalid/missing fields}\Rightarrow\text{record gaps; do not fabricate events}.\\
2.\;&\text{Construct a partial-order timeline with timestamp intervals and concurrent actions}.\\
3.\;&\text{For each }h\in H\text{ once, attach predicted signatures and competing explanations;}\\
 &\text{if authorized replay fits }B_{\rm rem},D,\text{ reserve worst-case cost }c_h\text{ atomically: }B_{\rm rem}\leftarrow B_{\rm rem}-c_h;\\
 &\text{enforce remaining-deadline timeout, execute, reconcile }\widetilde c_h\le c_h:\ B_{\rm rem}\leftarrow B_{\rm rem}+c_h-\widetilde c_h;\ \text{preserve boundary};\\
 &\text{otherwise mark untested and continue}.\\
4.\;&\text{Classify each claim as supported, contradicted or unresolved from the retained evidence}.\\
5.\;&\text{For supported or risk-reducing remediations, specify owner, invariant and bounded verification;}\\
 &\text{insufficient evidence}\Rightarrow\text{record provisional containment separately}.\\
6.\;&\text{At }D\text{ return conclusion, alternative hypotheses, test provenance and follow-up gaps}.
\end{aligned}
$$

(Eq. 47.22)

[DERIVED] A replay without an enforceable cost cap including cleanup is infeasible under this budget model. The invariant is that later conclusions never erase earlier evidence or the distinction between mitigation and cause. A proposed replay that would execute external effects without isolation is rejected, not silently simplified into an equivalent experiment. Missing raw logs can limit the conclusion to a source-reported account.

## Implementation

[DERIVED] AI_REFERENCE_STACK §4 **#41 vLLM / #42 SGLang**, layer **Inference engine**, and **#17 PyTorch**, layer **Model / autograd framework**, provide execution identities for the ledger. Microsoft Research / Microsoft AI §1 #13 and NVIDIA Research §1 #14 route the primary incident/recovery studies. MLPerf and the evidence ledger are measurement/operational components outside the catalog's engine entries.

[DERIVED] Ledger storage is $O(Nk)$ for $N$ incidents with $k$ retained evidence items before attachments. Tensor captures, raw prompts and snapshots can dominate metadata by orders of magnitude, so retention should separate indispensable provenance from replaceable derived summaries. Replay costs repeat model FLOPs, prompt/output tokens, state memory and communication under the specified workload; replaying only the last response cannot reproduce the cache history of a long conversation.

[DERIVED] Operational learning also consumes engineering review time and secure-storage budget. Energy/money accounting should include replay GPUs, snapshot retention and repeated evaluation after remediation. Source-reported GPU-hour opportunity is not a bill reduction unless provisioning or useful throughput changes accordingly. A failure test that never checks external publication or side-effect state can pass while leaving the user-visible bug intact.

## Experimental design

### Methodology

[PAPER-REPORTED] Dynamo's trace includes 5,762 in-place restarts and 2,967 lost GPU-hours across 18 weeks. The authors classify 4,443 as confirmed device-preserving, representing 2,375 GPU-hours; 1,319 ambiguous events are excluded from eligible savings. This is a retrospective eligibility classification, not proof that a runtime detector can safely select those events. [R47.6, §§2.2 and 5.6]

### Reported experiments

[PAPER-REPORTED] Replacing eligible recovery durations with seven seconds yields an estimated 2,339 reclaimed GPU-hours: approximately 98% of eligible loss and 79% of all included in-place-restart loss. It assumes a shadow is available and replenishment stays off the critical path, and excludes detection and reserved-capacity costs. This is a counterfactual trace estimate, not a measured live production gain. Appendix B quantifies sampling-related uncertainty. [R47.6, §5.6 and Appendix B]

[PAPER-REPORTED] The incident study's Case B describes frontend timeouts while a long-running backend eventually reports success, alongside malformed output causing parser errors. Reported mitigations include streaming/isolation changes; no randomized or quantified causal effect is supplied for that case. The account illustrates why frontend/backend outcomes and parser boundaries need separate evidence. [R47.7, §6, Case B]

[DERIVED] The two studies supply different evidence: a controlled recovery implementation plus duration-replacement estimate, and retrospective incident classification plus case narratives. Combining them does not establish that fast shadows would have prevented a specific reported parser or timeout incident.

## Observations

**What the paper claims.** [PAPER-REPORTED] Dynamo estimates substantial recoverable GPU-hours from eligible failures; the incident study identifies recurring operational failure categories and mitigation patterns. [R47.6, §5.6; R47.7, §§4–6]

**What the evidence shows.** [PAPER-REPORTED] Dynamo explicitly excludes ambiguous eligibility and studies scrape uncertainty. The incident study's annotation reliability and source records support a structured descriptive corpus, with confidential raw evidence unavailable. [R47.6, Appendix B; R47.7, §§3 and 8]

**What we infer.** [DERIVED] Useful operational learning depends on separating measured transitions, annotation conventions, mechanistic hypotheses and counterfactual assumptions. The same separation should survive into the runbook and new test set.

**What remains unknown.** [NOT-DISCLOSED] The raw incident corpus and production recovery trace are not independently reproduced here. Generalization to lower-severity, silent-quality and multi-node failures remains uncertain.

## Failure modes

[DERIVED] Survivorship bias excludes incidents with missing evidence. Severity selection excludes silent quality failures. A mitigation chosen at peak load can appear effective through regression to the mean. Concurrent scaling, routing and release changes confound attribution. Counterfactual replay that removes tool effects or fixes generated outputs answers a different question from interactive production execution. Annotation agreement cannot repair missing causal evidence.

## Siblings

[DERIVED] Postmortems preserve context; fault injection tests declared failures; replay tests reconstructable histories; formal invariants constrain allowed transitions. Each can expose flaws in the others. A narrative may suggest a new invariant, while a fault injection can show that the proposed protection fails under a different timing schedule.

```figure
{
  "id": "fig-47.20",
  "kind": "compare",
  "title": "Incident learning methods",
  "caption": "Different methods support different claims; none converts an incomplete narrative into causal proof.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.22",
  "alt": "Different methods support different claims; none converts an incomplete narrative into causal proof. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "axis": "Evidence and scope",
    "columns": [
      {
        "id": "m",
        "label": "Postmortem"
      },
      {
        "id": "t",
        "label": "Fault injection"
      },
      {
        "id": "p",
        "label": "Replay"
      }
    ],
    "rows": [
      {
        "dimension": "Preserves",
        "values": {
          "m": "operational context",
          "t": "declared failure transition",
          "p": "reconstructable history"
        }
      },
      {
        "dimension": "Main limitation",
        "values": {
          "m": "selection / missing records",
          "t": "injection realism",
          "p": "changed environment / state"
        }
      },
      {
        "dimension": "Useful output",
        "values": {
          "m": "hypotheses and gaps",
          "t": "invariant counterexamples",
          "p": "bounded counterfactual"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage moves from narrative incident records to structured evidence categories, trace-aware counterfactuals and invariant-driven regression tests. A major open question is how to estimate prevented harm when remediations alter the incident-detection process itself. Settling evidence needs stable exposure denominators, independent detection channels, known observation changes and prospective evaluations rather than a falling postmortem count alone.

## Limitations

[DERIVED] Some incidents remain causally unresolved after thorough review. Preventive action can still be justified by a plausible high-impact failure mechanism, but its evidential status should remain provisional. An operational test suite is not a random sample of all possible failures; repeated success bounds only the tested transitions and environments.

## Reproducibility

[UNVERIFIED] No incident or counterfactual replay was executed here. Reproduction needs inclusion/exclusion rules, timestamp intervals, source logs where authorized, release/cache epochs, all concurrent mitigations, replay mode, initial state, exogenous schedule, output/side-effect treatment and annotation rubric. The proposed chapter exercise is in [verification](verification.md); it must not be presented as a historical incident.

## References

[DERIVED] [R47.6, Dynamo recovery](https://arxiv.org/html/2609.25451v1), §5.6 and Appendix B; [R47.7, inference incidents](https://arxiv.org/html/2511.07424v1), §§3, 6 and 8; [R47.8, MLPerf LoadGen](https://raw.githubusercontent.com/mlcommons/inference/master/loadgen/README.md). Compact incident-source paraphrases are separated from original ledger/replay synthesis.
