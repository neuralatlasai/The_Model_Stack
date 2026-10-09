---
id: "ms.section.36.6"
entity_type: "section"
title: "Efficiency and reproducibility"
short_title: "Efficiency and reproducibility"
volume: 2
part: 6
chapter: 36
section: 36.6
slug: "36-6-efficiency-and-reproducibility"
parent: "ms.chapter.36"
prev_sibling: "ms.section.36.5"
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
word_count_target: 2000
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 36.6 — Efficiency and reproducibility

## Scope

[DERIVED] Measure and reproduce useful agent-RL progress across variable rollouts, queues, retries, replay and checkpoint recovery. The baseline reports generated tokens/s or mean episode latency. Success is lower total resource cost per committed, scientifically admissible update under a fixed task/evaluation contract, with discarded work and unresolved effects retained in the ledger. This section owns the recovery/cost boundary; probability correction and selection semantics remain in §36.5.

## Why this exists

[DERIVED] High inference utilization can coexist with an idle learner, a saturated checker or mostly rejected experience. Mean rollout latency can improve while long episodes accumulate policy lag. Restarting a failed worker can regenerate expensive prefixes or duplicate external effects. A checkpoint that restores model weights while forgetting consumed prompts changes the data stream. These failures disappear from token-throughput dashboards but directly affect the training budget and estimator.

[DERIVED] The dominant constraint is accounting across unsuccessful work. Accepted updates are downstream of generation, environment execution, verification, admission and finite optimizer transitions. A discarded group still consumed GPU time and sandbox residency. A paused episode still occupies state and ages relative to the learner. The solution is a joined occurrence/update ledger and a consistent recovery cut, rather than treating every restart as a fresh cost-free task.

## Intuition

[MATHEMATICALLY-DERIVED] Useful throughput multiplies raw production by survival through all admission gates, while resource cost includes every attempt. Parallel branches reduce the longest-path component only when resources permit actual overlap. Retaining state avoids recomputation but uses memory and can increase lag. Recovery is therefore a three-way tradeoff among recomputation, retained state and changed data measure, not an unconditional efficiency gain.

## Formulation

| Quantity | Definition | Unit |
|---|---|---|
| $U$ | Committed accepted optimizer updates | Integer |
| $H_g,H_c$ | Accelerator and CPU resource-hours over all attempts | Device-hours; core-hours |
| $B_n,B_s$ | Network and storage traffic including retries/checkpoints | Bytes |
| $T_e$ | Episode service time including tools | Seconds |
| $Q$ | Admitted waiting/in-flight work | Occurrences |
| $C$ | Consistent checkpoint cut | Versioned state manifest |

$$
\operatorname{cost}_{\rm update}=\frac{(H_g,H_c,B_n,B_s)}{U},\quad U>0;\qquad
\operatorname{currency}_{\rm update}=\frac{\sum_r p_r R_r}{U},\qquad
\operatorname{energy}_{\rm update}=\frac{\int P(t)\,dt}{U}.
$$
*(Eq. 36.33)*

[MATHEMATICALLY-DERIVED] The first expression is a vector of physical costs, not a scalar ranking. Currency requires actual tariffs $p_r$ and billed quantities $R_r$; energy requires measured power. When $U=0$, report consumed resources and no successful update rather than dividing by zero. A committed update is an optimizer/state event, not proof that benchmark quality improved. Quality-constrained cost requires a separate fixed evaluation criterion.

```figure
{
  "id": "fig-36.31",
  "kind": "diagram",
  "title": "Useful progress includes every rejected path",
  "caption": "All attempted work contributes to cost. Only admitted finite optimizer commits enter the accepted-update denominator, while task quality remains independently evaluated.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.33",
  "alt": "All attempted work contributes to cost. Only admitted finite optimizer commits enter the accepted-update denominator, while task quality remains independently evaluated.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "admit",
        "kind": "dataset",
        "label": "Task occurrence ledger"
      },
      {
        "id": "gen",
        "kind": "process",
        "label": "Generation and tools"
      },
      {
        "id": "judge",
        "kind": "objective",
        "label": "Versioned verification"
      },
      {
        "id": "select",
        "kind": "process",
        "label": "Identity/lag/selection admission"
      },
      {
        "id": "update",
        "kind": "process",
        "label": "Finite optimizer commit"
      },
      {
        "id": "cost",
        "kind": "tensor",
        "label": "All resource attempts"
      },
      {
        "id": "quality",
        "kind": "objective",
        "label": "Independent frozen evaluation"
      }
    ],
    "edges": [
      {
        "from": "admit",
        "to": "gen"
      },
      {
        "from": "gen",
        "to": "judge"
      },
      {
        "from": "judge",
        "to": "select"
      },
      {
        "from": "select",
        "to": "update"
      },
      {
        "from": "gen",
        "to": "cost"
      },
      {
        "from": "judge",
        "to": "cost"
      },
      {
        "from": "select",
        "to": "cost"
      },
      {
        "from": "update",
        "to": "cost"
      },
      {
        "from": "update",
        "to": "quality"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-36.32",
  "kind": "calculator",
  "title": "Resources per accepted update",
  "caption": "Analytical accounting inputs. Accepted updates cannot exceed attempts in the slider domain; discarded work remains in the numerator.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.33",
  "alt": "Analytical accounting inputs. Accepted updates cannot exceed attempts in the slider domain; discarded work remains in the numerator.",
  "spec": {
    "tex": "C_g=H_g/U,\\quad C_c=H_c/U",
    "equation": "36.33",
    "inputs": [
      {
        "symbol": "n",
        "label": "Attempted updates",
        "default": 64,
        "min": 64,
        "max": 256,
        "step": 64,
        "format": "integer"
      },
      {
        "symbol": "u",
        "label": "Accepted updates",
        "default": 32,
        "min": 1,
        "max": 64,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "hr",
        "label": "Rollout accelerator hours",
        "default": 8,
        "min": 1,
        "max": 32,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "ht",
        "label": "Learner accelerator hours",
        "default": 4,
        "min": 1,
        "max": 32,
        "step": 1,
        "format": "integer"
      },
      {
        "symbol": "hc",
        "label": "Environment CPU core-hours",
        "default": 128,
        "min": 16,
        "max": 512,
        "step": 16,
        "format": "integer"
      }
    ],
    "outputs": [
      {
        "symbol": "g",
        "label": "Accelerator hours per commit",
        "formula": "(hr+ht)/u",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "c",
        "label": "CPU core-hours per commit",
        "formula": "hc/u",
        "format": "fixed3",
        "emphasis": false
      },
      {
        "symbol": "a",
        "label": "Acceptance fraction",
        "formula": "u/n",
        "format": "raw",
        "emphasis": false
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared boundary",
      "variables": {
        "n": 64,
        "u": 64
      },
      "note": "Every attempted update is admitted in this state."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "n": 64,
        "u": 32
      },
      "note": "All resource work remains in the numerator when only half the updates commit."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "n": 256,
        "u": 1
      },
      "note": "One commit after many attempts makes each accepted update expensive; zero commits require a separate branch."
    }
  ]
}
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Queue stability requires a declared arrival/service process. Under stationary ergodic conditions with finite means, Little's relation gives

$$
E[Q]=\lambda E[T_{\rm residence}],\qquad
\text{M/M/1 analytical case: }E[T_{\rm residence}]=\frac1{\mu-\lambda},\quad0\le\lambda<\mu.
$$
*(Eq. 36.34)*

[MATHEMATICALLY-DERIVED] The second identity additionally assumes Poisson arrivals, exponential service and one server. Agent tools generally need not satisfy it; use it only to expose sensitivity as load approaches capacity. Mean admission below mean capacity does not bound p99. Finite queues and deadlines bound retained work, but drop/cancel policies then become selection mechanisms, not invisible infrastructure details.

[MATHEMATICALLY-DERIVED] For a batch of independent episode times with common CDF $F$, a synchronous barrier has

$$
P(T_{\max}\le t)=F(t)^B,\qquad
T_{\rm barrier}=\max_{1\le i\le B}T_i.
$$
*(Eq. 36.35)*

[DERIVED] Shared storage outages violate independence and can make tails worse. Asynchrony removes a particular barrier by consuming ready work, but it does not remove slow episodes, judge queues or their resource bills. Group-based training still requires the declared group unit. Dynamic refill, repeating valid samples and dropping a group are different policies with different prompt weights, as §§36.2/36.5 explain.

$$
S_{\rm critical}=\sum_t\left(S_{\rm main}^{(t)}+\max_iS_{{\rm sub},i}^{(t)}\right),\qquad
S_{\rm total}=\sum_t\left(S_{\rm main}^{(t)}+\sum_iS_{{\rm sub},i}^{(t)}\right).
$$
*(Eq. 36.36)*

[PAPER-REPORTED] The first metric follows Kimi's PARL critical-step definition [R36.2, §3]; empty parallel groups contribute zero. [DERIVED] It is a step proxy, not FLOPs or measured wall time. Unequal model sizes, tool durations, queueing and transfer break any direct step-to-time conversion. Parallelism can reduce $S_{\rm critical}$ while increasing $S_{\rm total}$, KV residency and external calls.

```figure
{
  "id": "fig-36.33",
  "kind": "compare",
  "title": "Latency and work answer different questions",
  "caption": "Matched target quality still needs both critical-path latency and total resource accounting. The equations are analytical, not benchmark measurements.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.36",
  "alt": "Matched target quality still needs both critical-path latency and total resource accounting. The equations are analytical, not benchmark measurements.",
  "spec": {
    "axis": "Accounting dimension",
    "columns": [
      {
        "id": "l",
        "label": "Critical path"
      },
      {
        "id": "w",
        "label": "Total work"
      },
      {
        "id": "u",
        "label": "Accepted updates"
      }
    ],
    "rows": [
      {
        "dimension": "Primary unit",
        "values": {
          "l": "Seconds or declared steps",
          "w": "Tokens, calls, device-hours",
          "u": "Committed optimizer transitions"
        }
      },
      {
        "dimension": "Parallel effect",
        "values": {
          "l": "May reduce longest path",
          "w": "May increase aggregate work",
          "u": "Depends on complete admission"
        }
      },
      {
        "dimension": "Tail failure",
        "values": {
          "l": "Slowest required branch",
          "w": "Retained and recomputed work",
          "u": "Starvation or rejected batches"
        }
      },
      {
        "dimension": "Required record",
        "values": {
          "l": "Stage timing and dependencies",
          "w": "All branches/retries",
          "u": "Immutable commit and skip ledger"
        }
      }
    ]
  }
}
```

[DERIVED] Replay has three meanings that must not be merged. Reusing a completed command's recorded result avoids executing its effect again. Recomputing an observation from a restored local simulator creates a new event unless transition parity is established. Continuing a live retained process resumes its existing state, including elapsed external time. A local snapshot cannot rewind a remote purchase, public web page or service clock.

[PAPER-REPORTED] DSec describes an earlier command-log approach that reuses completed results after agent-loop loss. Its later reported V4.1 architecture retains rollout-worker containers and agent sandboxes outside the preemptible GPU pool, while inference can reconnect [R36.3, §6]. [DERIVED] This is DSec's inspected architecture disclosure, not a detailed independent inspection of the inaccessible V4.1 training report.

[DERIVED] Partial generation preserves exact prefix IDs and their original behavior probabilities. Resuming under new weights requires rebuilding weight-dependent KV from that prefix, or continuing on an explicitly retained old-version replica. Reusing old KV with new weights generally conditions on incompatible internal tensors. Re-prefill costs belong in recovery traffic and latency. The mixed-version probability contract then follows §36.5; an old prefix is not relabeled as newly sampled.

[PAPER-REPORTED] DSec suspends containers through process freezing and memory reclamation, and microVMs through snapshot/terminate/restore [R36.3, §6]. [DERIVED] Suspension trades active resources for retained state/storage and restore time. The episode continues to age relative to the learner. An efficient restore may still produce an episode too stale for the declared update policy.

$$
P(\text{all attempts fail})=(1-p)^R,\qquad
E[N_{\rm attempts}]=\sum_{j=0}^{R-1}(1-p)^j=\frac{1-(1-p)^R}{p},\quad0<p\le1.
$$
*(Eq. 36.37)*

[MATHEMATICALLY-DERIVED] This bounded retry model assumes independent identical known pre-effect failures and at most $R\ge1$ attempts. It must not be applied to ambiguous non-idempotent effects. Retrying a timed-out purchase without an external idempotency key can change the world twice; a retry success probability is not sufficient authorization to repeat that operation.

```figure
{
  "id": "fig-36.34",
  "kind": "chart",
  "title": "Bounded retries spend work even when they fail",
  "caption": "Independent known pre-effect failures with per-attempt success.3. Ambiguous effect retries are excluded by the model. Points are integer retry caps. Probability and expected attempt count are separately named readouts, not interchangeable units.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.37",
  "alt": "Independent known pre-effect failures with per-attempt success.3. Ambiguous effect retries are excluded by the model.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "Maximum attempts R",
      "domain": [
        1,
        16
      ],
      "format": "integer"
    },
    "y": {
      "label": "Probability or expected attempts"
    },
    "variables": {},
    "series": [
      {
        "id": "w",
        "label": "Expected attempts",
        "formula": "(1-0.7^x)/0.3",
        "sample": {
          "from": 1,
          "to": 16,
          "count": 16
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "f",
        "label": "Exhaustion probability",
        "formula": "0.7^x",
        "sample": {
          "from": 1,
          "to": 16,
          "count": 16
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 1,
        "y": 1,
        "label": "One attempt always spends one unit"
      },
      {
        "x": 16,
        "y": 3.322255689810133,
        "label": "Retry work approaches1/0.3"
      }
    ]
  }
}
```

```figure
{
  "id": "fig-36.35",
  "kind": "hierarchy",
  "title": "Recovery chooses an event semantics",
  "caption": "The same transcript can arise through different operations. Its provenance decides whether old results or new observations are evidence.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.37",
  "alt": "The same transcript can arise through different operations. Its provenance decides whether old results or new observations are evidence.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Known completed command",
        "kind": "state",
        "note": "Reuse stored result under same occurrence"
      },
      {
        "label": "Known absent command effect",
        "kind": "state",
        "note": "Bounded retry with new attempt identity"
      },
      {
        "label": "Ambiguous external effect",
        "kind": "state",
        "note": "Reconcile or quarantine; no blind replay"
      },
      {
        "label": "Retained live sandbox",
        "kind": "state",
        "note": "Continue with elapsed-time boundary"
      },
      {
        "label": "New local reset",
        "kind": "state",
        "note": "New execution unless parity established"
      }
    ]
  }
}
```

[MATHEMATICALLY-DERIVED] A consistent checkpoint is a cut through state dependencies, not a directory containing weights. Define

$$
C=(\theta_v,\mathrm{opt},\mathrm{sched},\mathrm{RNG},\mathrm{data\ cursor},\mathrm{pending},\mathrm{finished},\mathrm{effect\ ledger},\mathrm{versions},\mathrm{queue\ ownership}).
$$
*(Eq. 36.38)*

[DERIVED] The cut must associate consumed prompts with pending/finished occurrences, committed updates with optimizer/scheduler/RNG state, and effects with their recorded outcomes. An external effect may remain in doubt across the cut; its status is preserved for reconciliation. Restoring the learner alone while replaying every consumed prompt duplicates data and cost. Reusing finished experience while forgetting its prior training-consumption state duplicates updates.

## Algorithm

[DERIVED] **Algorithm 36.6 — Recovery from a consistent cut.** Inputs: immutable checkpoint manifest $C$, finite occurrence set with $N=|C.\mathrm{occurrences}|$, finite positive integer attempt cap $R$ and finite positive deadlines, exclusive fenced recovery ownership and finite resource budgets. Output: restored state $S$ plus unresolved/quarantined statuses and costs. Initialize cursor $i=0$, ledger $\mathcal E=\varnothing$ and restored update count from $C$.

$$
\begin{aligned}
1.&\quad\text{invalid manifest/digest/fence}\Rightarrow\operatorname{return}(\mathcal E,\text{recovery blocked});\quad\ell\leftarrow\operatorname{reserve}(\text{restore memory, storage, queue slots});\quad\ell=\varnothing\Rightarrow\operatorname{return}(\mathcal E,\text{capacity}).\\
2.&\quad(S,q)\leftarrow\operatorname{restore}_{D}(C.\theta,C.\mathrm{opt},C.\mathrm{sched},C.\mathrm{RNG},C.\text{cursor});\operatorname{record}(\mathcal E,q);\quad\text{invalid}\Rightarrow\operatorname{release}(\ell);\operatorname{return}(\mathcal E,\text{blocked}).\\
3.&\quad\text{for }i=1,\ldots,N:\ e\leftarrow C.e_i;\ k_e\leftarrow\text{not required};\quad\text{already committed/consumed}\Rightarrow\operatorname{restore\_tombstone}(e);\operatorname{continue}.\\
4.&\quad\text{finished result}\Rightarrow\operatorname{restore\_once}(e,\text{IDs, probabilities, verdict});\operatorname{continue};\quad\text{effect unknown}\Rightarrow\operatorname{quarantine}(e);\operatorname{continue}.\\
5.&\quad j\leftarrow\operatorname{reserve}(e,\text{bounded execution/reconciliation resources});\quad j=\varnothing\Rightarrow\operatorname{record}(\mathcal E,e,\text{deferred});\operatorname{continue}.\\
6.&\quad\text{retained live state}\Rightarrow q_e\leftarrow\operatorname{reconnect}_{D}(e);\quad\text{known absent effect}\Rightarrow q_e\leftarrow\operatorname{retry}_{D,R}(e);\quad\text{otherwise}\Rightarrow q_e\leftarrow\text{blocked}.\\
7.&\quad\operatorname{record}(\mathcal E,q_e,\text{all attempt costs});\quad\text{partial generation}\Rightarrow k_e\leftarrow\operatorname{rebuild\_KV}_{D}(\text{exact prefix,committed weights});\operatorname{record}(\mathcal E,k_e,\text{rebuild time/work});\\
 &\quad\text{failed rebuild}\Rightarrow\operatorname{mark\_unroutable}(e);\quad\text{work still running/ambiguous}\Rightarrow\operatorname{transfer\_lease}(j,\text{bounded quarantine});\operatorname{continue};\quad\operatorname{release}(j).\\
8.&\quad\operatorname{reapply\_admission}(\text{version, support, completion});\operatorname{publish\_fenced}(\text{recovered ownership, routable set});\operatorname{release}(\ell);\operatorname{return}(S,\mathcal E,\text{unresolved set}).
\end{aligned}
$$
*(Eq. 36.39)*

[DERIVED] Every branch is mutually exclusive by typed effect/result status. A reconnect or retry failure stays deferred/failed in the ledger; it does not manufacture an observation. KV-rebuild failure keeps that generation unroutable. Exactly-once logical consumption uses occurrence tombstones and fenced ownership; external exactly-once effects additionally require the external service's idempotency/transaction contract. Resource exhaustion returns deferred work rather than spawning unbounded recovery attempts.

## Implementation

[OFFICIAL-DOCUMENTATION] **verl — RL post-training layer** documents recovery of finished groups as-is and reissuing saved pending/running prompts in its V1 async guide [R36.6]. This is a specific prompt/replay-buffer contract; an effectful agent wrapper must additionally preserve the effect ledger before reissuing. Plan-anchored **AReaL** exposes versioned weight and timeout controls [R36.7]; its controller alone does not prove full checkpoint consistency.

[DERIVED] Instrument timelines by occurrence, attempt and update, not just host process. Distinguish generated, verified, admitted, consumed and committed counters. Record queue residence, environment active/suspended time, judge wait, checkpoint bytes, replayed-result count, re-prefill tokens and wasted accelerator work. A double-counted retry inflates throughput; an omitted retry understates cost. Throughput denominators include dedicated rollout devices as well as learner devices.

## Experimental design

### Reported experiments

| Evidence | Actual protocol and boundary |
|---|---|
| DSec workload characterization [R36.3, §4] | Early2026production week; lifetime sample30Kcontainers/10KmicroVMs; median17.4/15.5minutes,p99>3hours; demand sampled separately from ten-node mechanism tests |
| Recovery disclosure [R36.3, §6] | Command-result reuse and retained worker/sandbox architecture described; no matched fault-injected learning-quality/recovery-cost experiment in §8 |
| verl replay recovery [R36.6, V1 guide] | Pending/running prompts reissued, finished groups restored; documentation contract, not an independent performance benchmark |
| Kimi latency evidence | Source protocol and score/timing distinction are recorded in §36.1; no equal-total-FLOP recovery study inferred |

## Observations

**What the paper claims.** [PAPER-REPORTED] DSec reports long-lived environment tails and state-retention mechanisms to decouple agent/sandbox survival from preemptible inference [R36.3, §§4,6].

**What the evidence shows.** [DERIVED] Long-lived state is a real operational workload feature in that deployment. The report's isolated infrastructure tests do not establish end-to-end RL recovery equivalence or zero lost work.

**What we infer.** [DERIVED] Scheduling on mean lifetime alone understates retained state and lag risk. Result reuse, live continuation and fresh execution need distinct metrics and correctness contracts.

**What remains unknown.** [NOT-DISCLOSED] Fault-conditioned task distribution, full recovery overhead, independently repeated convergence under failures and energy/currency per accepted update remain unavailable.

## Failure modes

[DERIVED] A restore can duplicate consumed prompts, reuse a stale verdict, resume with incompatible KV or replay a non-idempotent effect. A queue can be bounded in count but unbounded in bytes because observations grow. A retained sandbox can survive while its network credentials expire. A learner can report progress from optimizer steps that were never atomically checkpointed. These failures require occurrence-level reconciliation, not merely restarting a process.

```figure
{
  "id": "fig-36.36",
  "kind": "memory-stack",
  "title": "Rejected work remains in cost per committed update",
  "caption": "Eq.36.33 analytical numerator8 rollout accelerator-hours+4 learner accelerator-hours. Dividing by32 committed updates gives0.25+0.125=0.375 accelerator-hours per commit. The separate128 CPU-core-hours coordinate is not added to accelerator time; zero commits have no finite per-commit ratio.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.33",
  "alt": "A per-commit stack divides all rollout and learner accelerator-hours by the admitted update countU. With U32 its components are0.25 and0.125 hours. Reducing U increases both components even when total work is unchanged; CPU cost is a separate physical coordinate.",
  "spec": {
    "format": "raw",
    "variables": {
      "hr": 8,
      "ht": 4,
      "U": 32
    },
    "bars": [
      {
        "label": "Accelerator-hours per committed update",
        "segments": [
          {
            "label": "All rollout work / U",
            "kind": "process",
            "formula": "hr/U"
          },
          {
            "label": "All learner work / U",
            "kind": "model",
            "formula": "ht/U"
          }
        ]
      }
    ]
  },
  "anchor": "failure-modes",
  "states": [
    {
      "anchor": "formulation",
      "label": "Declared boundary",
      "variables": {
        "U": 64
      },
      "note": "All64 attempts commit in this boundary."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "U": 32
      },
      "note": "Half the attempts commit; discarded work is retained."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "U": 1
      },
      "note": "One commit carries all12 accelerator-hours; zero requires a non-numeric status."
    }
  ]
}
```

## Siblings

[DERIVED] Restart-from-scratch spends recomputation and may alter completion-length distribution. Retaining live state spends memory and lag. Snapshot restore spends storage/restore work and cannot rewind external services. Reusing a recorded result avoids a repeated effect but cannot answer a changed command. The right choice follows the state/effect contract and cost boundary rather than a general preference for replay.

## Extensions

[DERIVED] Adaptive pool lending and on-demand environments can be combined with bounded recovery when admission and effect ownership remain explicit. Cost-aware scheduling should use accepted-update yield and quality constraints, not only token speed. A policy that learns shorter episodes can change the service-time distribution during training; queue models and resource splits must be re-estimated without silently changing evaluation budgets.

## Limitations

[DERIVED] Little's relation describes averages under stated stability conditions; it does not guarantee deadlines. The iid tail and retry examples are analytical illustrations with explicit premises. A consistent local checkpoint cannot guarantee deterministic external-world replay. A low physical cost per optimizer commit is scientifically unhelpful if the reward contract or evaluation has changed. Missing energy/tariff evidence remains missing rather than estimated from device names.

## Reproducibility

[DERIVED] Preserve model/optimizer/scheduler/RNG, data cursors, occurrence/attempt IDs, pending and finished queues, consumption tombstones, effect/result ledgers, service/schema/checker versions, exact prefixes/log probabilities, resource reservations and checkpoint digests. Report restore/preemption counters and total successful-update denominator. All proposed fault injection and cost comparisons remain unexecuted protocols in [verification.md](verification.md).

## References

[R36.3](references.md) §§4,6,8; [R36.6](references.md) V1 recovery and throughput guide; [R36.7](references.md) controller; [R36.2](references.md) §3/§5.2.
