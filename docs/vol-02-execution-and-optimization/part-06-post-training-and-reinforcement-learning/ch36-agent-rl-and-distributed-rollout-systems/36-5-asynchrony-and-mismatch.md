---
id: "ms.section.36.5"
entity_type: "section"
title: "Asynchrony and mismatch"
short_title: "Asynchrony and mismatch"
volume: 2
part: 6
chapter: 36
section: 36.5
slug: "36-5-asynchrony-and-mismatch"
parent: "ms.chapter.36"
prev_sibling: "ms.section.36.4"
next_sibling: "ms.section.36.6"
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

# 36.5 — Asynchrony and mismatch

## Scope

[DERIVED] Determine which distribution generated each agent action, which data-selection process retained the episode, and which correction can validly target a different policy. The baseline assumes one rollout checkpoint and numerically identical inference/training probabilities. This section owns within-episode versions, processed behavior log probabilities, support, trajectory/prefix importance weights, cancellation bias, token identity/parity and bounded lag. Queue recovery costs are developed in §36.6. Success is an explicit target measure, not merely a finite ratio tensor.

## Why this exists

[DERIVED] Asynchronous training removes waiting by allowing generation to overlap changing parameters. That same overlap invalidates a single old-policy label when a response resumes under new weights. Even unchanged parameters can yield different probabilities through temperature, legal masks, top-p, quantization and numerical execution. Dropping slow or failed episodes adds a second mismatch between generated and retained data.

[DERIVED] The dominant constraint is denominator truth. A learner's convenient recomputation is not necessarily the distribution that sampled the token. An importance ratio cannot recover actions with zero behavior support, unlogged processing or episodes cancelled in an action-dependent way. The solution logs actual conditional behavior at the generated-token boundary and treats sampling, clipping, discarding and backpressure as separate interventions.

## Intuition

[MATHEMATICALLY-DERIVED] A likelihood ratio changes measure on events that were possible under the source. It does not fill holes in support or reverse a changed environment. A prefix ratio changes the law of a prefix; terminal outcomes additionally depend on the suffix. A version-age threshold limits an operational counter, not a probability-distance metric. These distinctions explain why practical masked surrogates may be stable and useful without being exact unbiased correction.

## Formulation

| Symbol | Meaning | Unit |
|---|---|---|
| $v_{t,j}$ | Immutable weight/configuration identity for generated position | Version/digest |
| $b_{t,j}$ | Processed behavior distribution actually sampled | Probability |
| $p_\theta$ | Declared target action distribution | Probability |
| $W_{1:k}$ | Product likelihood ratio through generated event $k$ | Dimensionless |
| $S$ | Admission/cancellation selection event | Boolean |
| $v_\ell,v_{\min}$ | Learner and oldest episode versions | Monotone version counters |

$$
b_{t,j}(a\mid c)=\operatorname{normalize}\left[\mathcal P_{v_{t,j}}(z_{v_{t,j}}(c))\right]_a,\qquad
\ell_{t,j}^{b}=\log b_{t,j}(a_{t,j}\mid c_t,a_{t,<j}).
$$
*(Eq. 36.26)*

[MATHEMATICALLY-DERIVED] $\mathcal P$ declares processor order, including temperature, penalties, masks and truncation. The displayed normalize notation is schematic for that declared sampler; top-p requires selecting its retained set before renormalization. Raw softmax logits are a different probability when processors change support or relative mass. Token IDs, EOS/stop conventions and exact prefixes identify the event whose probability is recorded.

$$
W(\tau)=\prod_{k\in\mathcal A_e}\frac{p_\theta(a_k\mid c_k)}{b_k(a_k\mid c_k)},\qquad
E_b[W(\tau)F(\tau)]=E_{p_\theta}[F(\tau)].
$$
*(Eq. 36.27)*

> **Assumption.** [ASSUMED] The equality holds for a fixed target parameter value and uses common task/initial-state law, context/parser semantics and environment kernel; target path measure is absolutely continuous with respect to behavior, ratios are true processed probabilities, and the relevant expectation is integrable. Behavior versions can vary by event. *Sensitivity:* an unlogged top-p exclusion or changed live-service kernel invalidates the equality, even when every stored ratio is finite.

```figure
{
  "id": "fig-36.25",
  "kind": "diagram",
  "title": "Asynchrony changes more than weights",
  "caption": "A recorded token requires its actual behavior identity and processor configuration. Selection after generation creates an additional data-measure change.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.27",
  "alt": "A recorded token requires its actual behavior identity and processor configuration. Selection after generation creates an additional data-measure change.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "v",
        "kind": "state",
        "label": "Per-position committed version"
      },
      {
        "id": "proc",
        "kind": "process",
        "label": "Sampler processors and support"
      },
      {
        "id": "gen",
        "kind": "tensor",
        "label": "Generated token and true logp"
      },
      {
        "id": "world",
        "kind": "state",
        "label": "Common environment boundary"
      },
      {
        "id": "select",
        "kind": "process",
        "label": "Completion and admission selection"
      },
      {
        "id": "data",
        "kind": "dataset",
        "label": "Retained experience"
      },
      {
        "id": "target",
        "kind": "objective",
        "label": "Declared learner measure"
      }
    ],
    "edges": [
      {
        "from": "v",
        "to": "gen"
      },
      {
        "from": "proc",
        "to": "gen"
      },
      {
        "from": "gen",
        "to": "world"
      },
      {
        "from": "world",
        "to": "select"
      },
      {
        "from": "select",
        "to": "data"
      },
      {
        "from": "data",
        "to": "target"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Enumerate only generated trainable-role tokens in causal order, retaining observation history between them. Environment transition densities cancel from the path ratio only under Eq36.27's common-kernel assumption. Within-episode policy updates simply make behavior conditional distributions $b_k$ heterogeneous; logging a single final version cannot reconstruct their product. If a frozen subagent's law is identical under both compared orchestrator policies, its conditional transition can cancel; a simultaneously updated subagent cannot be silently treated as fixed.

$$
W_{1:k}=\prod_{j=1}^{k}\frac{p_\theta(a_j\mid c_j)}{b_j(a_j\mid c_j)},\qquad
E_b[W_{1:k}f(h_k,a_k)]=E_{p_\theta}[f(h_k,a_k)].
$$
*(Eq. 36.28)*

[MATHEMATICALLY-DERIVED] The prefix equality holds when $f$ is measurable with respect to that prefix and the same support/integrability assumptions apply. A terminal return sampled from a behavior suffix is not such a function. One can instead use a valid current-policy conditional value of future return, or correct the suffix. Replacing that conditional quantity with a behavior Monte Carlo terminal reward imports bias. PPO clipping, group normalization, detached importance masks and repeated-sample padding add their own approximations.

[MATHEMATICALLY-DERIVED] A two-step counterexample needs no model experiment. Let both policies choose the same first action, while behavior chooses a rewarding second action with probability.2 and target with probability.8. The first-prefix ratio is one. Weighting the sampled terminal reward by that ratio still has expectation.2 rather than.8. Full suffix correction restores the target expectation when support is positive. This isolates the measurability error rather than attributing it to long horizons.

$$
p_b(\tau\mid S=1)=\frac{p_b(\tau)s_b(\tau)}{Z_b},\qquad
E_{b\mid S}[W F]=\frac{E_{p_\theta}[s_b(\tau)F]}{Z_b},\qquad Z_b=E_b[s_b(\tau)].
$$
*(Eq. 36.29)*

[MATHEMATICALLY-DERIVED] Thus ordinary policy ratios on retained data do not generally target the unconditional policy return. Selection correction would additionally need nonzero known retention probabilities and a declared target selection law. Deterministic cancellation of a class of paths creates missing support. A timeout policy that disproportionately removes long reasoning or difficult tool tasks changes the objective even if infrastructure failure is unrelated to semantic correctness conditional on its unobserved causes.

```figure
{
  "id": "fig-36.26",
  "kind": "calculator",
  "title": "Selection can overwhelm policy correction",
  "caption": "Two-outcome analytical example. Behavior and target share equal action mass, but unequal retention changes the observed mean; ordinary policy ratios are one.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.29",
  "alt": "Two-outcome analytical example. Behavior and target share equal action mass, but unequal retention changes the observed mean; ordinary policy ratios are one.",
  "spec": {
    "tex": "P(R=1\\mid S)=\\frac{p s_1}{p s_1+(1-p)s_0}",
    "equation": "36.29",
    "inputs": [
      {
        "symbol": "p",
        "label": "True success mass",
        "default": 0.5,
        "min": 0.1,
        "max": 0.9,
        "step": 0.1,
        "format": "raw"
      },
      {
        "symbol": "s1",
        "label": "Retention of successes",
        "default": 0.8,
        "min": 0.1,
        "max": 1,
        "step": 0.1,
        "format": "raw"
      },
      {
        "symbol": "s0",
        "label": "Retention of failures",
        "default": 0.2,
        "min": 0.1,
        "max": 1,
        "step": 0.1,
        "format": "raw"
      }
    ],
    "outputs": [
      {
        "symbol": "obs",
        "label": "Retained success fraction",
        "formula": "p*s1/(p*s1+(1-p)*s0)",
        "format": "raw",
        "emphasis": true
      },
      {
        "symbol": "keep",
        "label": "Overall retained fraction",
        "formula": "p*s1+(1-p)*s0",
        "format": "raw",
        "emphasis": false
      },
      {
        "symbol": "bias",
        "label": "Observed minus true mean",
        "formula": "p*s1/(p*s1+(1-p)*s0)-p",
        "format": "fixed3",
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
        "s1": 0.5,
        "s0": 0.5
      },
      "note": "Equal retention preserves the success fraction in this analytical case."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "s1": 0.8,
        "s0": 0.2
      },
      "note": "Preferential success retention raises the observed mean despite policy ratios of one."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "s1": 0.2,
        "s0": 0.8
      },
      "note": "Preferential failure retention reverses the sign of selection bias."
    }
  ]
}
```

[PAPER-REPORTED] GLM-5 separates synchronous reasoning correction in §3.2 from asynchronous agent DSDM in §4.1 [R36.1]. Its synchronous construction uses training/inference probability mismatch at old weights in addition to a current/old training ratio. Its agent construction directly reuses logged rollout probabilities and masks ratios outside a strict interval. These are distinct rules.

$$
\rho^{\rm eng}=\frac{\pi_{\rm old}^{\rm train}}{\pi_{\rm old}^{\rm infer}},\quad
r_\theta=\frac{\pi_\theta^{\rm train}}{\pi_{\rm old}^{\rm train}},\quad
\operatorname{pop}(\rho;1/\beta_p,\beta_p)=\rho\,\mathbf1\{1/\beta_p\le\rho\le\beta_p\};
\qquad
f(r)=r\,\mathbf1\{1-\varepsilon_l<r<1+\varepsilon_h\}.
$$
*(Eq. 36.30)*

[DERIVED] The synchronous source combines its population mask with a clipped surrogate. DSDM prints a score-weighted objective proportional to $E[f(r)A\log\pi_\theta]$ using the direct current/rollout ratio. It accepts controlled off-policy bias in the report. The printed text does not resolve whether $f(r)$ is detached: differentiating through it inside the interval adds a factor involving $1+\log\pi_\theta$. The book must specify stop-gradient if it reconstructs a weighted score estimator; it cannot pretend the ambiguous printed expression is an unbiased full-path correction.

[MATHEMATICALLY-DERIVED] The opening §4.1 scalar $K^{-1}\sum_i(r_i-\bar r)$ is identically zero by the definition of $\bar r$. Without a score/probability term it cannot define the policy-training objective. This is a source-expression limitation, not a new optimizer. Chapters34–35 own the actual score-function/group-estimator derivations; the later source DSDM rule is analyzed separately above.

[PAPER-REPORTED] GLM logs version sequences and drops trajectories whose oldest version exceeds a threshold; it excludes environment-collapse failures, repeats valid samples to pad some incomplete groups, and drops smaller surviving groups [R36.1, §4.1]. [DERIVED] Repetition changes weights and effective sample size; it does not create independent new evidence. Exclusion may improve noise handling while changing the retained measure described by Eq36.29.

$$
\ell_e=v_\ell-v_{\min,e},\qquad \operatorname{admit}(e)\Rightarrow\ell_e\le L_{\max},\qquad
\text{bounded lag does not imply bounded KL without update-size conditions}.
$$
*(Eq. 36.31)*

```figure
{
  "id": "fig-36.27",
  "kind": "compare",
  "title": "Corrections have different mathematical targets",
  "caption": "Ratios, clipping and filtering cannot be collapsed into a single exact off-policy correction label.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.28",
  "alt": "Ratios, clipping and filtering cannot be collapsed into a single exact off-policy correction label.",
  "spec": {
    "axis": "Correction boundary",
    "columns": [
      {
        "id": "f",
        "label": "Full path IS"
      },
      {
        "id": "p",
        "label": "Prefix IS"
      },
      {
        "id": "m",
        "label": "Masked surrogate"
      }
    ],
    "rows": [
      {
        "dimension": "Target",
        "values": {
          "f": "Declared complete-path expectation",
          "p": "Prefix-measurable quantity",
          "m": "Chosen bounded-ratio training rule"
        }
      },
      {
        "dimension": "Conditions",
        "values": {
          "f": "Common kernel, support, integrability",
          "p": "Same plus prefix measurability",
          "m": "Explicit masks and stop-gradient convention"
        }
      },
      {
        "dimension": "Terminal reward",
        "values": {
          "f": "Suffix included",
          "p": "Needs current conditional estimate or suffix",
          "m": "Generally biased practical surrogate"
        }
      },
      {
        "dimension": "Missing support",
        "values": {
          "f": "Cannot repair",
          "p": "Cannot repair",
          "m": "Discarding does not restore it"
        }
      }
    ]
  }
}
```

```figure
{
  "id": "fig-36.28",
  "kind": "hierarchy",
  "title": "Identity is necessary before parity",
  "caption": "TITO can preserve exact token events. Probability parity requires additional sampler, kernel and numerical conditions.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.26",
  "alt": "TITO can preserve exact token events. Probability parity requires additional sampler, kernel and numerical conditions.",
  "spec": {
    "direction": "down",
    "levels": [
      {
        "label": "Exact token identities",
        "kind": "tensor",
        "note": "Same input/output IDs and generated mask"
      },
      {
        "label": "Same conditional context",
        "kind": "dataset",
        "note": "Same template, truncation and event order"
      },
      {
        "label": "Same sampler processors",
        "kind": "process",
        "note": "Temperature, masks, penalties, stop handling"
      },
      {
        "label": "Numerical model execution",
        "kind": "process",
        "note": "Precision, kernels, routing and quantization"
      },
      {
        "label": "Declared ratio estimator",
        "kind": "objective",
        "note": "Target and true behavior probabilities"
      }
    ]
  }
}
```

## Algorithm

[DERIVED] **Algorithm 36.5 — Bounded experience admission.** Inputs: finite candidate set, immutable learner identity, positive lag/count/byte caps, declared estimator and support checks. Output: accepted set, unvisited/deferred IDs, and complete input-cost plus examined rejection ledger. Initialize cursor $i=0$, accepted $\mathcal B=\varnothing$, and ledger $\mathcal E$ from every input occurrence's upstream cost/identity. Per-candidate storage request $b_e$ includes token tensors and retained metadata. No environment execution occurs here.

$$
\begin{aligned}
1.&\quad\text{while }i<N\text{ and }|\mathcal B|<B_{\max}:\ i\leftarrow i+1;\ e\leftarrow\operatorname{candidate}(i);\operatorname{record}(\mathcal E,e,\text{upstream cost}).\\
2.&\quad\text{invalid occurrence/context/mask/version/probability}\Rightarrow\operatorname{reject}(e);\operatorname{continue}.\\
3.&\quad\text{unresolved effect, missing verdict, or prohibited completion status}\Rightarrow\operatorname{reject}(e);\operatorname{continue}.\\
4.&\quad v_\ell-v_{\min,e}>L_{\max}\Rightarrow\operatorname{reject}(e,\text{lag});\operatorname{continue}.\\
5.&\quad\text{support/kernel/selection contract not established for claimed estimator}\Rightarrow\operatorname{reject}(e,\text{unsupported target});\operatorname{continue}.\\
6.&\quad\ell\leftarrow\operatorname{reserve\_atomic}(b_e,\text{total admitted bytes}\le M_{\max},\text{scorer slot});\quad\ell=\varnothing\Rightarrow\operatorname{reject}(e,\text{capacity});\operatorname{continue}.\\
7.&\quad q\leftarrow\operatorname{score}_{D}(e,\theta);\operatorname{record}(\mathcal E,q);\quad\text{empty/nonfinite ratios or weights}\Rightarrow\operatorname{release}(\ell);\operatorname{reject}(e);\operatorname{continue}.\\
8.&\quad\mathcal B\leftarrow\mathcal B\cup\{(e,q,\ell)\};\quad\operatorname{record}(\mathcal E,\text{accepted occurrence});\\
9.&\quad\mathcal D\leftarrow\{e_{i+1},\ldots,e_N\};\operatorname{record}(\mathcal E,\mathcal D,\text{deferred});\quad\mathcal B=\varnothing\Rightarrow\operatorname{return}(\mathcal E,\mathcal D,\text{no update});\quad\operatorname{return}(\mathcal B,\mathcal E,\mathcal D,\text{declared estimator}).
\end{aligned}
$$
*(Eq. 36.32)*

[DERIVED] $D$ is a finite positive scorer deadline; $N,B_{\max}$ are finite positive integer caps. Step5 may accept an explicitly labeled practical surrogate with known limitations; it rejects a claim of exactness whose premises are absent. Total admitted bytes must remain below the cap through atomic reservations, and accepted leases transfer to the learner for exactly-once release. A zero-weight candidate is rejected before any normalized reduction. Group admission preserves the declared group unit rather than treating repeated padding as new occurrences.

## Implementation

[OFFICIAL-DOCUMENTATION] **verl — RL post-training layer**, v0.9.1, records partial-rollout version spans and distinguishes newest versus worst/oldest staleness. Its guide documents drop/wait strategies and permits null to disable version control [R36.6]. Plan-anchored **AReaL** v2.1.0 uses `max_head_offpolicyness`, with zero selecting synchronous behavior, and declares recomputation requirements for its decoupled loss [R36.7]. These knobs have different contracts and cannot be equated by similar names.

[DERIVED] Token-in/token-out preserves original IDs through tool and engine boundaries. It prevents retokenization drift but does not prove equal logits or probability processing. Store log probabilities at generation time after declared processors; if an engine reports raw rather than processed log probabilities, mark that limitation and use a compatible target. Probability parity audits require identical contexts and token events, not text equality alone. Backpressure should block new admission using queue/lease occupancy rather than cancel already effectful work indiscriminately.

## Experimental design

### Reported experiments

| GLM-5 protocol [R36.1] | What is actually reconstructible |
|---|---|
| Model/system |744Btotal/40Bactive under AppendixA counting convention; slime-based RL infrastructure; FP8 inference disclosed; complete agent-RL hardware/seed/mix not disclosed |
| Reasoning settings |§3.2group32,batch32,pop-bound2,clip.2/.28,noKL; these are not disclosed as all asynchronous-agent settings |
| Agent evaluation |AppendixB.2 Terminus2:2h,temp.7,top-p1,8192new tokens,128Kcontext,16CPU/32GB; ClaudeCode2.1.14 branch removes wall-clock cap and averages5runs |
| Ablation boundary |Report explains stability mechanisms but does not provide a matched isolated DSDM-versus-exact-IS convergence study with full uncertainty |

## Observations

**What the paper claims.** [PAPER-REPORTED] GLM reports that reusing rollout probabilities accepts controlled off-policy bias and supports training stability; its token gateway and version filtering are disclosed engineering choices [R36.1, §4.1].

**What the evidence shows.** [DERIVED] The inspected protocol supports implementation-specific descriptions, not a general exact-correction theorem. Different evaluation scaffolds and time budgets cannot isolate asynchronous estimator effects.

**What we infer.** [DERIVED] True behavior logging is necessary to reason about mixed-version data, while filtering and numerical mismatch need separate evidence and accounting.

**What remains unknown.** [NOT-DISCLOSED] DSDM stop-gradient implementation, complete asynchronous hyperparameters and matched estimator ablations remain unresolved.

```figure
{
  "id": "fig-36.29",
  "kind": "chart",
  "title": "Version age is not probability distance",
  "caption": "Analytical Bernoulli policies: a fixed number of versions can correspond to very different target probability changes. No measured model trajectory is implied. Only integer version gaps are plotted; version count alone does not bound drift.",
  "placement": "wide",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.31",
  "alt": "Analytical Bernoulli policies: a fixed number of versions can correspond to very different target probability changes. No measured model trajectory is implied.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "Version gap",
      "domain": [
        0,
        16
      ],
      "format": "integer"
    },
    "y": {
      "label": "Absolute action-probability drift",
      "domain": [
        0,
        0.49
      ],
      "format": "raw"
    },
    "variables": {},
    "series": [
      {
        "id": "small",
        "label": "Change .001 per version",
        "formula": "min(0.49,0.001*x)",
        "sample": {
          "from": 0,
          "to": 16,
          "count": 17
        },
        "emphasis": true,
        "dashed": false
      },
      {
        "id": "large",
        "label": "Change .02 per version",
        "formula": "min(0.49,0.02*x)",
        "sample": {
          "from": 0,
          "to": 16,
          "count": 17
        },
        "emphasis": false,
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 16,
        "y": 0.016,
        "label": "Same16 versions: drift0.016"
      },
      {
        "x": 16,
        "y": 0.32,
        "label": "Same16 versions: drift0.32"
      }
    ]
  }
}
```

## Failure modes

[DERIVED] A denominator recomputed from new weights erases true behavior. A grammar mask can make an action impossible under behavior while target assigns mass. A service revision changes the environment kernel. Cancelling slow jobs biases the retained task/length distribution. Padding surviving groups repeats evidence and alters reductions. A stale version count can be small while probability drift is large. Nonfinite ratios indicate a failure to be diagnosed, not a reason to clamp silently and claim exactness.

```figure
{
  "id": "fig-36.30",
  "kind": "memory-stack",
  "title": "Retention changes the observed success composition",
  "caption": "Eq.36.29 expectation under1000 original attempts with success mass0.5. At s1=0.8,s0=0.2 the retained population has400 successes/100 failures while the discarded population has100/400. Counts are analytical expectations, not experimental observations; all1000 attempts remain in the ledger.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-36.29",
  "alt": "Two stacks partition the original attempt measure into retained and discarded outcomes. The default retained success share is0.8 even though original success mass is0.5 and behavior equals target. Reversing retention reverses this distortion.",
  "spec": {
    "format": "raw",
    "variables": {
      "N": 1000,
      "p": 0.5,
      "s1": 0.8,
      "s0": 0.2
    },
    "bars": [
      {
        "label": "Retained attempts",
        "segments": [
          {
            "label": "Successful",
            "kind": "metric",
            "formula": "N*p*s1"
          },
          {
            "label": "Unsuccessful",
            "kind": "boundary",
            "formula": "N*(1-p)*s0"
          }
        ]
      },
      {
        "label": "Discarded attempts",
        "segments": [
          {
            "label": "Successful",
            "kind": "metric",
            "formula": "N*p*(1-s1)"
          },
          {
            "label": "Unsuccessful",
            "kind": "boundary",
            "formula": "N*(1-p)*(1-s0)"
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
        "s1": 0.5,
        "s0": 0.5
      },
      "note": "Outcome-independent retention preserves composition."
    },
    {
      "anchor": "mechanism",
      "label": "Mechanism",
      "variables": {
        "s1": 0.8,
        "s0": 0.2
      },
      "note": "Successful outcomes are preferentially retained."
    },
    {
      "anchor": "failure-modes",
      "label": "Stress boundary",
      "variables": {
        "s1": 0.2,
        "s0": 0.8
      },
      "note": "Failure-biased retention reverses the observed success composition."
    }
  ]
}
```

## Siblings

[DERIVED] Synchronous inference can still have numerical train/inference mismatch. Asynchronous generation can be statistically specified when true mixed behavior is logged. Full importance weighting can have high variance; clipped/masked rules trade exactness for a practical surrogate. Lag caps bound operational age; explicit distribution checks bound measured mismatch. Neither is a replacement for the other.

## Extensions

[DERIVED] Per-event identities permit a mixture of frozen subagents, changing orchestrators and partially resumed generations, provided the target law is stated. Backpressure can reduce future lag by limiting admission. It cannot make previously generated data on-policy or correct missing cancellation support. A version-aware replay buffer should expose selection and replacement counters alongside learning curves.

## Limitations

[DERIVED] Exact ratios can be unusably variable over long horizons. Conditional values introduce approximation unless independently justified. A live changing environment may defeat common-kernel assumptions. Detaching a mask makes a particular gradient well-defined but does not establish that it optimizes the unconditional return. These constraints are mathematical limits, not evidence that every practical asynchronous system is ineffective.

## Reproducibility

[DERIVED] Pin per-position versions/processors/log probabilities, templates and masks, support rules, environment revisions, completion/selection reasons, lag thresholds, group multiplicities and estimator detach/reduction conventions. Report accepted and rejected data distributions together. Proposed finite-state and service-fault checks live in [verification.md](verification.md).

## References

[R36.1](references.md) §§3.2,4.1,AppendicesA/B; [R36.6](references.md) V1 guide; [R36.7](references.md) asynchronous guide.
