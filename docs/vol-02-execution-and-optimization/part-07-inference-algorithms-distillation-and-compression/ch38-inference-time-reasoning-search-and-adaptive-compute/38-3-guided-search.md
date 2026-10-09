---
id: "ms.section.38.3"
entity_type: "section"
title: "Guided search"
short_title: "Guided search"
volume: 2
part: 7
chapter: 38
section: 38.3
slug: "38-3-guided-search"
parent: "ms.chapter.38"
prev_sibling: "ms.section.38.2"
next_sibling: "ms.section.38.4"
children: []
prerequisites: ["ms.chapter.6", "ms.chapter.32", "ms.chapter.35", "ms.chapter.37"]
downstream: ["ms.chapter.39", "ms.chapter.47", "ms.chapter.61", "ms.chapter.63", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["inference", "evaluation", "assurance"], "mechanism": ["search", "verification", "adaptive_compute"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["DERIVED", "MATHEMATICALLY-DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "ASSUMED", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 2300
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# 38.3 — Guided search

## Scope

[DERIVED] Guided search allocates inference work to partial states rather than drawing only complete independent responses. This section owns outcome and process scorers, tree and beam search, Monte Carlo tree search, environment feedback, asynchronous search statistics and cancellation. Its deliverable is a bounded search procedure with explicit state, expansion policy, value semantics and return rule. A search tree is a record of explored hypotheses; it is not itself evidence that the highest-scored hypothesis is correct.

[DERIVED] The policy over nodes and the policy over next text tokens are distinct. A controller may select a promising prefix, then ask a language model to expand it. The scorer may inspect that prefix or only its eventual answer. An environment can provide an executable transition or a test result. These channels define different search problems and must remain separate in both mathematics and logs.

## Why this exists

[DERIVED] Complete-answer sampling wastes work when many candidates share a useful prefix, and serial revision can remain trapped in one mistaken path. Search retains alternatives and moves compute toward promising states. Its cost is substantial: tree storage, repeated prefills, verifier calls, value estimates, rollouts and coordination. Search can also magnify proxy error because it repeatedly chooses states that score well under a model trained on a different distribution.

[DERIVED] Parallel search adds a scheduling problem. Several workers can choose the same unexplored edge from stale statistics, duplicating work. Avoiding this duplication changes the policy's exploration behavior. A claim that parallelism preserves the exact serial search trajectory is therefore stronger than a claim that it preserves similar benchmark accuracy. The latter needs measurement; the former needs an algorithmic equivalence argument.

## Intuition

[DERIVED] A beam is a synchronized frontier: expand retained prefixes, score children and keep a fixed number. MCTS repeatedly descends a retained tree, balances an estimated return against exploration, expands or rolls out, then backs up a result. Beam pruning is irreversible under an ordinary implementation. MCTS can revisit a branch, but finite budgets and proxy scores can still leave the correct path unexplored. Neither method avoids the need for a final independent evaluator.

[DERIVED] A process score is an observation attached to a step. A value estimate predicts a future outcome from a state. They coincide only under an explicit target and calibration model. Multiplying locally plausible step scores does not automatically yield a calibrated probability that the final answer is correct; shared errors and non-independent steps invalidate that interpretation.


```figure
{
  "id": "fig-38.13",
  "kind": "diagram",
  "title": "Search retains and revisits hypotheses",
  "caption": "A retained state is expanded, scored and backed up before the controller selects another path; independent evaluation follows frozen return.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.11",
  "alt": "A retained state is expanded, scored and backed up before the controller selects another path; independent evaluation follows frozen return. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "memory",
        "label": "Retained tree"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Select path"
      },
      {
        "id": "n2",
        "kind": "model",
        "label": "Expand / rollout"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Process or outcome score"
      },
      {
        "id": "n4",
        "kind": "feedback",
        "label": "Backup statistics"
      },
      {
        "id": "n5",
        "kind": "metric",
        "label": "Frozen final evaluation"
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
        "to": "n4"
      },
      {
        "from": "n4",
        "to": "n0",
        "label": "update"
      },
      {
        "from": "n3",
        "to": "n5",
        "label": "return boundary"
      }
    ]
  }
}
```


## Formulation

> **Definition — Search state.** A versioned partial artifact together with the environment observations, legal continuations, accumulated resource usage and immutable lineage required to reproduce its expansion and scoring.

[MATHEMATICALLY-DERIVED] A beam of width $w\ge1$ with frontier $F_d$ and admissible expansions $E(s)$ uses

$$
F_{d+1}=\mathrm{Top}_{w,\prec}\{(s,a):s\in F_d,\ a\in E(s),\ \mathrm{KnownFiniteScore}(s,a)\}.
$$
*(Eq. 38.10)*

The order $\prec$ fixes score ties. Empty expansion terminates with the best previously completed admissible artifact, or ABSTAIN. If expansion or scoring is budget-limited, the actual child subset is part of the policy. Width alone does not specify total compute, because expansion count, depth, prefix length and scoring cost also matter.

[MATHEMATICALLY-DERIVED] Let $N(s,a)$ count completed scored visits, $Q(s,a)$ their mean proxy return, $P(s,a)$ a declared prior and $O(s,a)$ in-flight reservations. A partial-statistics PUCT rule is

$$
a^*=\arg\max_{a\in A(s)}\left[Q(s,a)+cP(s,a)\frac{\sqrt{N(s)+O(s)}}{1+N(s,a)+O(s,a)}\right],\quad c\ge0.
$$
*(Eq. 38.11)*

The action set must be nonempty and finite. An unseen edge has a declared initial $Q$, not a fabricated terminal observation. The exploration term can be zero at an unvisited root; stable ties or an explicit first-expansion rule must then supply behavior. In-flight counts reduce duplicate selection but change the search statistics from serial PUCT.


```figure
{
  "id": "fig-38.14",
  "kind": "calculator",
  "title": "In-flight work changes PUCT",
  "caption": "Eq.38.11 evaluates one edge with declared mean and prior. Counts are integer options; increasing edge in-flight count lowers its bonus.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.11",
  "alt": "Eq.38.11 evaluates one edge with declared mean and prior. Counts are integer options; increasing edge in-flight count lowers its bonus. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "38.11",
    "tex": "U=Q+cP\\sqrt{N_p+O_p}/(1+N_e+O_e)",
    "inputs": [
      {
        "symbol": "Q",
        "label": "Edge mean",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "fixed3"
      },
      {
        "symbol": "P",
        "label": "Edge prior",
        "default": 0.2,
        "min": 0,
        "max": 1,
        "format": "raw"
      },
      {
        "symbol": "c",
        "label": "Exploration coefficient",
        "default": 1,
        "min": 0.1,
        "max": 4,
        "format": "fixed3"
      },
      {
        "symbol": "Np",
        "label": "Parent completed visits",
        "default": 16,
        "min": 0,
        "max": 64,
        "format": "integer",
        "options": [
          0,
          1,
          4,
          16,
          32,
          64
        ]
      },
      {
        "symbol": "Op",
        "label": "Parent in-flight visits",
        "default": 4,
        "min": 0,
        "max": 16,
        "format": "integer",
        "options": [
          0,
          1,
          2,
          4,
          8,
          16
        ]
      },
      {
        "symbol": "Ne",
        "label": "Edge completed visits",
        "default": 4,
        "min": 0,
        "max": 16,
        "format": "integer",
        "options": [
          0,
          1,
          2,
          4,
          8,
          16
        ]
      },
      {
        "symbol": "Oe",
        "label": "Edge in-flight visits",
        "default": 1,
        "min": 0,
        "max": 16,
        "format": "integer",
        "options": [
          0,
          1,
          2,
          4,
          8,
          16
        ]
      }
    ],
    "outputs": [
      {
        "symbol": "bonus",
        "label": "Exploration bonus",
        "formula": "c*P*sqrt(Np+Op)/(1+Ne+Oe)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "score",
        "label": "WU-PUCT priority",
        "formula": "Q+c*P*sqrt(Np+Op)/(1+Ne+Oe)",
        "format": "fixed3",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "No in-flight edge",
      "variables": {
        "Oe": 0
      }
    },
    {
      "anchor": "mechanism",
      "label": "One reserved rollout",
      "variables": {
        "Oe": 1
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Many reserved rollouts",
      "variables": {
        "Oe": 8
      }
    }
  ]
}
```


## Mechanism

### Methodology

[DERIVED] **Tree and beam variants.** A fixed-width beam ranks partial paths at each depth. Diverse beams introduce a diversity penalty or group allocation; that is a changed objective whose coefficient and grouping require a development protocol. A best-first frontier expands the currently highest-priority state without synchronizing depth. Branch-and-bound safely prunes only when an upper bound on every descendant's target utility is valid. A learned ranking score alone is not such a bound. Node reuse can save generation when identical states truly have the same legal future; merging merely similar text can erase distinct environment states.

[DERIVED] **Monte Carlo methods.** MCTS maintains search statistics rather than evaluating every frontier state equally. Rollout returns can be final verifier scores, environment rewards or learned value predictions. Their backup rule must specify whether $Q$ is a mean, maximum or another reduction. A maximum backup emphasizes rare high proxy returns and is more vulnerable to optimistic noise. A mean backup estimates the rollout policy's expected proxy return from that edge, not the optimal achievable true utility.

[DERIVED] **Outcome and process guidance.** Outcome guidance scores complete artifacts. Process guidance supplies intermediate ranking information, potentially enabling early pruning but also increasing verifier exposure and cost. Environment feedback such as a compile error or failed test can create a legal state transition for revision. A successful supplied test remains a statement about those fixtures. To claim a solution is formally proved, the system needs an appropriate proof object and trusted checker, not a high process-reward score.

[MATHEMATICALLY-DERIVED] Suppose step scores $r_j\in[0,1]$ are immutable on retained prefixes. For prefix $p$ and any extension $p\oplus q$,

$$
\min_{j\in p\oplus q}r_j\le\min_{j\in p}r_j,\qquad
\prod_{j\in p\oplus q}r_j\le\prod_{j\in p}r_j.
$$
*(Eq. 38.12)*

Thus a prefix below proxy threshold $\tau$ cannot later cross it under those exact reductions. This bounds the proxy, not semantic correctness. Allowing revision of a retained step breaks the premise. Excluding a low-initial-score branch because of empirical correlation is a heuristic and does not preserve an all-descendant guarantee.


```figure
{
  "id": "fig-38.15",
  "kind": "chart",
  "title": "A proxy upper bound stays a proxy",
  "caption": "Eq.38.12 for an initial product0.8 and repeated step score0.9 decreases with integer added-step count; correctness is not plotted. Points are integer added-step counts.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.12",
  "alt": "Eq.38.12 for an initial product0.8 and repeated step score0.9 decreases with integer added-step count; correctness is not plotted. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "scatter",
    "x": {
      "label": "added step count",
      "domain": [
        0,
        24
      ]
    },
    "y": {
      "label": "product proxy upper bound"
    },
    "series": [
      {
        "id": "n0",
        "label": "0.8 times 0.9 per step",
        "formula": "0.8*0.9^x",
        "sample": {
          "from": 0,
          "to": 24,
          "count": 25
        },
        "emphasis": true
      }
    ],
    "annotations": [
      {
        "x": 0,
        "y": 0.8,
        "label": "Initial prefix proxy0.8"
      },
      {
        "x": 24,
        "y": 0.06381315446149805,
        "label": "24 added steps"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] For a scheduler with at most $M$ concurrent slots and active job set $J$, assign integer quotas $p_j$ satisfying

$$
1\le p_j,\quad\sum_{j\in J}p_j\le M;\qquad
O(e)=\sum_{\iota\in I}\mathbf1\{e\in\operatorname{path}(\iota)\}.
$$
*(Eq. 38.13)*

Here $I$ is the set of launched but unfinalized rollout IDs. If $|J|>M$, keep excess jobs pending. Initialize one slot per admitted job, then distribute the remaining $M-|J|$ by a nonnegative priority rule. When all priorities are zero, use a declared stable round-robin fallback instead of dividing by zero. A quota reduction requests cancellation; it does not instantly prove that an executing kernel released its memory or slot.


[MATHEMATICALLY-DERIVED] **Sequential Monte Carlo is a different Monte Carlo policy.** Rather than selecting a single tree edge, keep a population of prefixes and resample their ancestry. Let $p_{\rm ref}(s_{1:t}\mid x)$ be the declared reference path law and $V_t(s_{1:t})>0$ an intermediate twist, with terminal $V_T=\phi\ge0$ and positive finite normalizer. The unnormalized path target is $\gamma_t=p_{\rm ref}(s_{1:t}\mid x)V_t(s_{1:t})$. If a proposal $q_t$ is positive wherever the target transition has mass, its incremental weight is

$$
G_t(s_{1:t})=\frac{p_{\rm ref}(s_t\mid s_{<t},x)}{q_t(s_t\mid s_{<t},x)}\frac{V_t(s_{1:t})}{V_{t-1}(s_{<t})},\qquad
\bar w_t^i=\frac{G_t^i}{\sum_{j=1}^{N}G_t^j},\qquad
A_{t+1}^i\sim\operatorname{Categorical}(\bar w_t^{1:N}).
$$
*(Eq. 38.14)*

The parent population was resampled to equal weights before propagation, which is why no old particle weight appears in $G_t$. Without that resampling, the old weight must multiply the incremental factor. A reference proposal $q_t=p_{\rm ref}$ cancels the probability ratio; a temperature, truncation or processor change generally does not. Define these distributions after the actual sampling processors. A proposal that removes target support invalidates this importance construction rather than merely increasing variance. For variable-length paths, specify an absorbing terminal transition before using a fixed horizon.

[DERIVED] Resampling deliberately couples ancestry. The final $N$ particles are therefore not $N$ independent solutions, even if every propagation draw uses fresh randomness. Weight ESS, $(\sum_iG_i)^2/\sum_iG_i^2$, describes concentration of the current weights. Equal weights can coexist with a single surviving ancestor, duplicate answers or identical semantic strategies; ESS is not solution diversity. Repeated resampling can collapse ancestry, while avoiding it can let weights collapse. A resampling schedule is a policy choice with a different error and cost profile. Multinomial sampling can be implemented with a cumulative weight table; alternative schemes need their actual probability law and analysis, rather than inheriting a multinomial theorem by name.

[PAPER-REPORTED] R38.10 analyzes Feynman–Kac path targets and terminal resampling. Its main SMC claim assumes uniformly bounded consecutive twist ratios and reciprocal ratios by $L$, plus a uniform multiplicative Bellman discrepancy bounded by $1+\epsilon$ between a twist and the reference conditional expectation of the next twist. Under these premises, Theorem5.1 gives a sufficient particle count proportional to $L^6T(1+\epsilon)^{6(T-1)}/\delta$ for a total-variation error tolerance $\delta$. [R38.10](references.md) §§3,5; AppendixE.6.

[DERIVED] The bounded object is the law of a particle drawn after terminal resampling, equivalently the expectation of the weighted empirical measure; it is not a guarantee that the realized particle cloud has that total-variation distance. With fixed $L$ and $\epsilon=O(1/T)$, the displayed dependence is polynomial in horizon. If $L$ grows with horizon or Bellman error stays constant, that interpretation fails. Average calibration, a small supervised loss or good answer-ranking accuracy does not establish the uniform premises. A zero terminal potential on a reachable path also violates a finite reciprocal-ratio premise, even though the bounded sampler can handle individual zero terminal weights and reject an all-zero population. Moreover, closeness to a verifier-weighted target is not correctness unless the terminal potential and target themselves encode an adequate correctness contract. The theory has no measured LLM hardware or latency result.

## Algorithm

**Algorithm 38.3 — Bounded asynchronous tree search with exactly-once finalization.** Inputs are nonnegative integer launch cap $K$, integer concurrency cap $M\ge1$, a finite absolute run deadline, enforceable generation/verifier allowances and per-call deadlines, legal expansion rules and a frozen proxy threshold policy. State is tree $T$, terminal candidates $Y$, active IDs $I$, finalized IDs $D$, ledger $H$, counts $N,O$, means $Q$ and consumed/reserved resources $\mathbf c,\mathbf r$. Return selection has a pre-reserved local allowance.

$$
\begin{aligned}
1.\;&k\gets0;\ T\gets\{\mathrm{root}(x)\};\ I,D,Y,H\gets\varnothing;
 \ N,O,Q,\mathbf c,\mathbf r\gets0.\\
2.\;&\textbf{while }(k<K\ \lor I\ne\varnothing)\land\mathrm{Clock}()<d_{\rm run}:\\
3.\;&\quad\ell\gets[k<K\land |I|<M\land\mathrm{Expandable}(T)];\quad\ell\Rightarrow
 \ p\gets\mathrm{SelectPath}_{38.11}(T);\ \iota\gets\mathrm{UniqueID}(k,p).\\
4.\;&\quad\ell\land(\mathbf c+\mathbf r+\mathbf u(\iota)\le\mathbf B)\Rightarrow
 [\mathrm{Reserve}(\iota);\ \mathbf r\gets\mathbf r+\mathbf u(\iota);
 \ I\gets I\cup\{\iota\};\ O(e)\gets O(e)+1\ (e\in p);\ \mathrm{LaunchCapped}(\iota,p)];\\
5.\;&\quad\ell\Rightarrow k\gets k+1\ \text{after every launch decision};\quad
 \mathrm{NoAdmissionPossible}\land I=\varnothing\Rightarrow\textbf{break}.\\
6.\;&\quad e\gets\mathrm{NextTerminalEventBeforeDeadline}(I);\quad
 e=\mathrm{NONE}\Rightarrow\textbf{continue};\quad (\iota,z,o,q,\mathbf d)\gets\mathrm{Fields}(e);\quad(\iota\notin I\lor\iota\in D)\Rightarrow[\mathrm{LogStale}(e);\ \textbf{continue}].\\
7.\;&\quad e=(\iota,z,o,q,\mathbf d)\land\iota\in I\land\iota\notin D\Rightarrow
 [I\gets I\setminus\{\iota\};\ D\gets D\cup\{\iota\};\ \mathbf c\gets\mathbf c+\mathbf d;
 \ \mathbf r\gets\mathbf r-\mathbf u(\iota);\ O(e')\gets O(e')-1\ (e'\in p_\iota)].\\
8.\;&\quad H\gets H\cup\{(\iota,z,o,q,\mathbf d)\};\quad
 z=\mathrm{COMPLETE}\land\mathrm{ValidExpansion}(o,p_\iota)\Rightarrow
 T\gets\mathrm{InsertChild}(T,\mathrm{parent}(p_\iota),o,\iota,v_{\rm state},v_{\rm cache},v_{\rm env}).\\
9.\;&\quad
 z=\mathrm{COMPLETE}\land(\mathrm{ValidExpansion}(o,p_\iota)\lor\mathrm{ValidTerminal}(o))\land q\in[0,1]\Rightarrow
 [Q(e')\gets(N(e')Q(e')+q)/(N(e')+1);\ N(e')\gets N(e')+1\ (e'\in p_\iota)].\\
10.\;&\quad z=\mathrm{COMPLETE}\land\mathrm{ValidTerminal}(o)\Rightarrow Y\gets Y\cup\{(\iota,o,q)\};\quad
 \mathrm{PruneOnlyUnderDeclaredProxyRule}(T).\\
11.\;&\mathrm{CancelAndDrainCapped}(I);\ \mathrm{FinalizeOnce}(I,D,H,\mathbf c,\mathbf r,O);\quad
 Y_{\rm scored}=\{y\in Y:\mathrm{KnownFinite}(q_y)\land q_y\in[0,1]\}.\\
12.\;&Y_{\rm scored}=\varnothing\Rightarrow\textbf{return }(\mathrm{ABSTAIN},H,\mathbf c);\quad
 \textbf{return }(\mathrm{FrozenSelect}(Y_{\rm scored}),H,\mathbf c).
\end{aligned}
$$

[DERIVED] The launch-eligibility Boolean guards path/ID creation, admission and launch-count advancement, so a full worker pool cannot reuse a prior launch ID. The admission conjunction is short-circuited before reading an absent new ID. A rejected start or launch fault produces a fresh terminal ERROR event with its consumed setup work and retained partial output. Lines7–10 execute only inside the guarded fresh-terminal-event branch; duplicate or stale events are logged and skipped. ERROR, TIMEOUT, CANCELLED and unknown scores finalize resource accounting but do not fabricate a $Q$ observation. A partial expansion with no valid terminal candidate cannot enter $Y$. Enforced deadlines guarantee eventual acknowledgement or an explicit quarantined-worker terminal status; quarantined reservations cannot be reused. A run returns after bounded draining, with any unreclaimed resource recorded as unavailable rather than silently refunded. Launch cap and deadlines establish termination; Eq.38.13 and the ID guard establish conservation.


**Algorithm 38.4 — Bounded multinomial particle propagation.** Inputs are integers $N,T\ge1$, positive finite intermediate twists and nonnegative terminal potential, a support-dominating processed proposal, finite deadlines, and executable per-step allowances for all $N$ propagation and twist evaluations, normalization, resampling, ancestry bookkeeping and capped return. State is prefixes $s^i$, normalized weights $w^i$, ancestry and attempt ledger $H_p$, consumed and reserved resources. This variant is separate from the tree loop.

$$
\begin{aligned}
1.\;&s^i\gets\varnothing;\ w^i\gets1/N\ (i=1,\ldots,N);\ H_p\gets\varnothing;\ \mathbf c\gets0.\\
2.\;&\textbf{for }t=1,\ldots,T:\quad g_t\gets\mathrm{Reserve}(N\text{ proposals},N\text{ twists},\text{bookkeeping and return});\\
3.\;&\quad g_t=\mathrm{DENIED}\Rightarrow\textbf{return }(\mathrm{BUDGET\_STOPPED},H_p,\mathbf c);\quad
 A_t^i\overset{\rm iid}{\sim}\operatorname{Categorical}(w^{1:N}).\\
4.\;&\quad\textbf{for }i=1,\ldots,N:\quad \iota\gets\mathrm{UniqueID}(t,i);\quad
 (s_t^i,z_i,\mathbf d_i)\gets\mathrm{ProposeAndTwistCapped}(s^{A_t^i},q_t,\iota);\\
5.\;&\quad H_p\gets H_p\cup\{(\iota,A_t^i,z_i,\mathbf d_i)\};\quad
 \mathbf c\gets\mathbf c+\mathbf d_i;\quad
 z_i\ne\mathrm{COMPLETE}\lor\mathrm{UnknownWeight}_i\Rightarrow
 [(\mathbf d_{\rm aux},H_p)\gets\mathrm{DrainAndFinalize}(g_t,H_p);\ \mathbf c\gets\mathbf c+\mathbf d_{\rm aux};\ \textbf{return }(\mathrm{NOT\_ESTIMABLE},H_p,\mathbf c)].\\
6.\;&\quad \tilde s^i\gets s^{A_t^i}\oplus s_t^i;\quad G_i\gets\mathrm{Eq}_{38.14}(\tilde s^i);\quad
 (G_i<0\lor\neg\mathrm{Finite}(G_i))\Rightarrow
 [(\mathbf d_{\rm aux},H_p)\gets\mathrm{DrainAndFinalize}(g_t,H_p);\ \mathbf c\gets\mathbf c+\mathbf d_{\rm aux};\ \textbf{return }(\mathrm{INVALID},H_p,\mathbf c)].\\
7.\;&\quad Z_t\gets\sum_{i=1}^{N}G_i;\quad (Z_t\le0\lor\neg\mathrm{Finite}(Z_t))\Rightarrow
 [(\mathbf d_{\rm aux},H_p)\gets\mathrm{Finalize}(g_t,H_p);\ \mathbf c\gets\mathbf c+\mathbf d_{\rm aux};\ \textbf{return }(\mathrm{DEGENERATE},H_p,\mathbf c)];\quad
 w^i\gets G_i/Z_t;\ s^i\gets\tilde s^i.\\
8.\;&\quad\mathrm{RecordAncestryAndESS}(H_p,w^{1:N});\quad t=T\Rightarrow J\sim\operatorname{Categorical}(w^{1:N});\\
&\quad(\mathbf d_{\rm aux},H_p)\gets\mathrm{Finalize}(g_t,H_p);\ \mathbf c\gets\mathbf c+\mathbf d_{\rm aux};\\
9.\;&
 \textbf{return }(s^J,H_p,\mathbf c).
\end{aligned}
$$

[DERIVED] Lines4–6 complete for every particle before the group normalizer in line7. Finalizers return only previously uncharged consumed work, including bounded cancellation and local normalization/resampling/bookkeeping; proposal/twist work already added in line5 is not charged twice. The final particle draw occurs before final-step accounting closes. Capped serialization/return uses the reserved local allowance and contributes its actual work to the ledger. Unsupported transitions, unknown scores and failed proposals terminate the admitted estimator; replacing them with arbitrary zero weights would define another algorithm. Finite $NT$ propagation calls do not include all work: twists, processor probability evaluation, normalization, resampling, context copies and terminal checking must also be charged. Hard admission can return a partial ledger but cannot advertise a budget-stopped population as the completed fixed-horizon sampler. Positive twists avoid intermediate division by zero; an all-zero terminal potential still produces a declared degeneracy branch. The output is a finite-$N$ approximation, not an exactly correct answer.

## Implementation

[DERIVED] Store parent pointers and immutable token/context identities, including environment snapshots. KV-cache reuse requires exact model, positions, masks and prefix identity. A state reached through a different tool history can require a different cache and legal-action set even if its displayed text is identical. Bound tree memory separately from active worker count; retaining every branch's KV cache can dominate search storage.

[DERIVED] Scoring has its own queue. Allocating every accelerator to generation can starve the verifier and leave many expensive candidates waiting. Quotas should account for the bottleneck resource rather than only rollout count. Preemption must distinguish requesting a stop, acknowledging it, releasing reservations and committing the terminal ledger record. A cancelled rollout is consumed work even when its answer is never used. These invariants remain necessary under speculative kernels, batched scoring and task migration.


```figure
{
  "id": "fig-38.16",
  "kind": "memory-stack",
  "title": "Integer concurrency quotas share one pool",
  "caption": "Eq.38.13 analytical eight-slot pool:four admitted jobs first receive one slot each, then a feasible allocation3,2,2,1 fills the pool. A fifth job stays pending until a slot is released.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.13",
  "alt": "Four stacked job quotas total eight slots as3+2+2+1, against capacity eight. Initial admission gives1+1+1+1 and leaves four slots for distribution. Pending work is not an allocated slot.",
  "spec": {
    "format": "integer",
    "variables": {
      "M": 8,
      "q1": 3,
      "q2": 2,
      "q3": 2,
      "q4": 1
    },
    "bars": [
      {
        "label": "Admitted jobs",
        "segments": [
          {
            "label": "Job A",
            "formula": "q1",
            "kind": "process"
          },
          {
            "label": "Job B",
            "formula": "q2",
            "kind": "process"
          },
          {
            "label": "Job C",
            "formula": "q3",
            "kind": "process"
          },
          {
            "label": "Job D",
            "formula": "q4",
            "kind": "process"
          }
        ]
      }
    ],
    "budget": {
      "label": "Concurrent slots",
      "formula": "M"
    }
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "One slot per admitted job",
      "variables": {
        "q1": 1,
        "q2": 1,
        "q3": 1,
        "q4": 1
      },
      "note": "The remaining four slots can be distributed."
    },
    {
      "anchor": "mechanism",
      "label": "Feasible allocation",
      "variables": {
        "q1": 3,
        "q2": 2,
        "q3": 2,
        "q4": 1
      },
      "note": "Total allocation equals the hard pool."
    },
    {
      "anchor": "failure-modes",
      "label": "Additional job remains pending",
      "variables": {
        "q1": 3,
        "q2": 2,
        "q3": 2,
        "q4": 1
      },
      "note": "Do not allocate a ninth slot."
    }
  ]
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] AP-MCTS is an inspected system study of partial statistics, negative early exit and adaptive parallelism. [R38.3](references.md)

| Field | Source protocol: §§4–5; AppendicesA–B |
|---|---|
| Hardware/model | Four H100-SXM80GB; two generation/two reward GPUs; Llama3.1-8B or Qwen2.5-14B; Qwen2.5-Math-PRM7B |
| Workload | MATH500; AMC23 original40 for accuracy; augmented prefixes only for performance |
| Baselines | Serial MCTS; positive exit; positive+negative exit; full boosting; beam8 chosen near baseline accuracy |
| Scores | In-flight WU-PUCT; proxy-prefix futility plus selective heuristic |
| Actual negative result | AMC/Qwen full accuracy65.0 versus vanilla72.5; Table1; boosting can reduce throughput relative to negative exit alone |
| Disclosure gaps | Precision, full software pin, random seeds and accuracy uncertainty: NOT-DISCLOSED |

[DERIVED] Beam8 is not a matched-compute control. The paper's explanation that numerical variation contributes to accuracy changes is an attribution requiring further isolation; the reported table itself contains meaningful quality differences. A throughput gain is not quality-preserving dominance when the selected-answer metric changes.


[PAPER-REPORTED] The companion Monte Carlo evidence is theoretical, not an empirical LLM benchmark. The official PMLR record identifies R38.10 as ICML2026; its first arXiv release is February1,2026. The inspected v1 §§3–6 define the path target, approximate twists, single-particle contrast and SMC bound; AppendixE derives the principal particle-bias bound. Models, task datasets, training optimizer, precision, accelerators, random seeds and benchmark confidence intervals are not applicable to that formal study. The positive finding is conditional polynomial horizon dependence under its uniform assumptions; the negative comparison concerns persistent bias in single-particle guidance when the approximate twist is imperfect. Neither finding establishes practical dominance for an LLM scorer. [R38.10](references.md)

[DERIVED] The source's optional stratified-resampling extension is not used here: AppendixE.10 defines an averaged stratum variance, but a displayed variance expansion appears to introduce an additional $1/N$ factor. This edition does not silently repair the expression and attribute the repair to the paper. The main conditional SMC discussion is kept separate from that unadmitted extension; an independent theorem audit remains a reproduction obligation.

## Observations

**What the paper claims.** [PAPER-REPORTED] AP-MCTS combines partial-statistics selection, early exit and scheduler boosting to improve serving efficiency. [R38.3](references.md)

**What the evidence shows.** [PAPER-REPORTED] Benefits depend on workload and configuration, with an explicit AMC/Qwen negative regime and lower full-suite accuracy in the cited cell. [R38.3](references.md)

**What we infer.** [DERIVED] Treat search quality and serving efficiency as a joint frontier. Proxy futility can reduce work while discarding semantically correct paths.

**What remains unknown.** [NOT-DISCLOSED] The inspected protocol does not establish exact serial/parallel trajectory equivalence, uncertainty for the quality differences or a universal optimal concurrency policy.

## Failure modes

[DERIVED] Stale $O$ counts can block promising paths indefinitely. Double finalization can create negative in-flight counts and over-admit workers. A zero-total priority normalization can yield invalid quotas. A process scorer trained on clean steps can rank search-generated adversarial states poorly. A minimum-score rule can prune a correct solution after one mis-scored step. Revisable prefixes invalidate monotone upper bounds. Environment feedback can change legal continuations and make cached states stale.


```figure
{
  "id": "fig-38.17",
  "kind": "diagram",
  "title": "Equal particle weights can share one ancestor",
  "caption": "Eq.38.14 SMC counterexample:four descendants all resample parentA. Their equal final weights give ESS4, while their retained parent diversity is1. Fresh propagation draws do not undo shared ancestry.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.14",
  "alt": "Four possible parent particles A,B,C,D are shown. All four retained descendants point back toA; B,C,D have no retained descendants. Equal weights give ESS4 although only one ancestor survives.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "state",
        "label": "Parent A"
      },
      {
        "id": "n1",
        "kind": "state",
        "label": "Parent B"
      },
      {
        "id": "n2",
        "kind": "state",
        "label": "Parent C"
      },
      {
        "id": "n3",
        "kind": "state",
        "label": "Parent D"
      },
      {
        "id": "n4",
        "kind": "state",
        "label": "Child 1 · weight1/4"
      },
      {
        "id": "n5",
        "kind": "state",
        "label": "Child 2 · weight1/4"
      },
      {
        "id": "n6",
        "kind": "state",
        "label": "Child 3 · weight1/4"
      },
      {
        "id": "n7",
        "kind": "state",
        "label": "Child 4 · weight1/4"
      }
    ],
    "edges": [
      {
        "from": "n0",
        "to": "n4",
        "label": "resampled ancestor"
      },
      {
        "from": "n0",
        "to": "n5",
        "label": "resampled ancestor"
      },
      {
        "from": "n0",
        "to": "n6",
        "label": "resampled ancestor"
      },
      {
        "from": "n0",
        "to": "n7",
        "label": "resampled ancestor"
      }
    ]
  },
  "states": [
    {
      "anchor": "mechanism",
      "label": "Population before resampling",
      "highlight": [
        "n0",
        "n1",
        "n2",
        "n3"
      ]
    },
    {
      "anchor": "failure-modes",
      "label": "One retained ancestor",
      "highlight": [
        "n0",
        "n4",
        "n5",
        "n6",
        "n7"
      ]
    }
  ],
  "anchor": "mechanism"
}
```


## Siblings

[DERIVED] Chapter37 owns decoding and speculative cache correctness. Chapter36 owns asynchronous rollout execution. Chapter32 owns process-reward and verifier semantics. §38.2 owns complete-candidate selection; §38.4 owns when to stop or switch compute modes. Search combines these mechanisms but does not replace their contracts.

## Extensions

### Improvements

[DERIVED] Separate proxy-only pruning from correctness-certified pruning in the controller API. Attach a reason and bound premise to every discarded branch. Calibrate value models on the actual searched-state distribution, then evaluate on untouched tasks. Allocate generation and verification jointly, with resource-specific queues and deadline-aware draining. Use hard admission invariants even when learned priorities control the soft allocation order.


```figure
{
  "id": "fig-38.18",
  "kind": "compare",
  "title": "Three pruning propositions",
  "caption": "The comparison distinguishes a proven bound on a chosen score from empirical branch prediction and semantic correctness.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-38.12",
  "alt": "The comparison distinguishes a proven bound on a chosen score from empirical branch prediction and semantic correctness. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Proxy bound"
      },
      {
        "id": "n1",
        "label": "Selective futility"
      },
      {
        "id": "n2",
        "label": "Correctness certificate"
      }
    ],
    "rows": [
      {
        "dimension": "Premise",
        "values": {
          "n0": "Immutable factors in[0,1]",
          "n1": "Empirical score correlation",
          "n2": "Trusted formal contract"
        }
      },
      {
        "dimension": "Guarantee",
        "values": {
          "n0": "Cannot cross proxy threshold",
          "n1": "Heuristic only",
          "n2": "Specified checked property"
        }
      },
      {
        "dimension": "Main risk",
        "values": {
          "n0": "Proxy mismatch",
          "n1": "False negative branch",
          "n2": "Specification gap"
        }
      }
    ]
  }
}
```


## Limitations

[DERIVED] Finite MCTS with a learned value function has no general guarantee of finding a correct proof or program. Eq.38.12 only preserves a chosen proxy threshold. Parallel work can improve latency while consuming more total computation and changing exploration. The bounded algorithm is a book-derived auditable skeleton, not a claim that the source implementation satisfies every strengthened guard.

## Reproducibility

[DERIVED] Publish node/edge IDs, expansion randomness, prior/value identities, backup reduction, score range, terminal statuses, pruning reasons, in-flight transitions, cancellation acknowledgements, quotas and all consumed resources. Reconstruct the tree from the event stream and verify each increment has exactly one matching decrement. Preserve final-evaluator isolation from the scorer used to guide search.

## References

[R38.3](references.md) §§2–5 and AppendicesA–B provide the search-system comparison. [R38.10](references.md) §§3–6 and AppendixE supply the separate theory-only SMC comparison. Equations38.10–38.14 and Algorithms38.3/38.4 are book-derived contracts; the proxy-versus-correctness distinction is essential to interpreting the study.
