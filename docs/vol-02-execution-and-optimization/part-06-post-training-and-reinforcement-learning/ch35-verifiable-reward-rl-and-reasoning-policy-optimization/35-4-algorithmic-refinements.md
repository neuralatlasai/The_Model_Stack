---
id: "ms.section.35.4"
entity_type: "section"
title: "Algorithmic refinements"
short_title: "Algorithmic refinements"
volume: 2
part: 6
chapter: 35
section: 35.4
slug: "35-4-algorithmic-refinements"
parent: "ms.chapter.35"
prev_sibling: "ms.section.35.3"
next_sibling: "ms.section.35.5"
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.32", "ms.chapter.33", "ms.chapter.34"]
downstream: ["ms.chapter.36", "ms.chapter.38", "ms.chapter.39", "ms.chapter.62", "ms.chapter.64"]
related: []
relations: []
axes: {"lifecycle": ["post_training", "evaluation", "assurance"], "mechanism": ["reinforcement_learning", "verification", "policy_optimization"], "feedback_setting": ["verifiable_reward", "environment_return"], "modality": ["text", "code"]}
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

# 35.4 — Algorithmic refinements

## Scope

[DERIVED] Reconstruct algorithmic refinements as separate interventions: response versus token normalization, fixed-length DrGRPO-style reduction, DAPO-style global-token reduction, asymmetric clipping, dynamic sampling, truncation policy, advantage modulation and entropy-aware weighting. Canonical older papers are excluded by the publication window; their estimator algebra is reconstructed here and current behavior is grounded in 2026 primary comparisons and pinned implementation. A named variant is complete only when its objective, collection rule, execution cost and evidence boundary are all explicit.

## Why this exists

[DERIVED] A bundled recipe can improve a benchmark while leaving its causal mechanism unresolved. Changing token weighting can alter which responses dominate updates. Refilling mixed groups can increase useful backward work while increasing generation cost. Widening a clipping bound can change positive-advantage updates without imposing any entropy guarantee. Masking truncated responses removes some gradients but cannot recover an unseen terminal reward. These mechanisms solve different problems and require independent ablations.

[DERIVED] The dominant constraint is estimator-level attribution. Compare interventions under the same initialization, prompt pool, decoding, checker, training tokens and evaluator before claiming that one component explains a gain. If a source changes several controls together, retain that limitation even when its headline result is positive.

## Intuition

[MATHEMATICALLY-DERIVED] A response-mean loss gives each response equal aggregate weight. A global-token loss gives each generated action equal aggregate weight, so longer responses receive more total weight. A fixed maximum-length denominator removes the random observed-length denominator while leaving short responses with less aggregate weight. These are different objectives even if their per-token loss is identical.

[DERIVED] Entropy is also local to a distribution and prefix. Maintaining average token entropy can preserve randomness in irrelevant words while solution strategies collapse. Conversely, a model can reduce linguistic randomness while retaining several distinct correct algorithms. Entropy is a diagnostic and a possible regularizer, not a complete definition of useful exploration.


```figure
{
  "id": "fig-35.19",
  "kind": "diagram",
  "title": "Refinements act at different stages",
  "caption": "Prompt selection precedes generation; truncation precedes advantage construction; clipping and reduction belong to the loss.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.0",
  "alt": "Prompt selection precedes generation; truncation precedes advantage construction; clipping and reduction belong to the loss. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "n0",
        "kind": "dataset",
        "label": "Task proposal"
      },
      {
        "id": "n1",
        "kind": "process",
        "label": "Generate / cap"
      },
      {
        "id": "n2",
        "kind": "state",
        "label": "Status masks"
      },
      {
        "id": "n3",
        "kind": "process",
        "label": "Advantage"
      },
      {
        "id": "n4",
        "kind": "process",
        "label": "Clip / weight"
      },
      {
        "id": "n5",
        "kind": "process",
        "label": "Reduce / update"
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
        "to": "n5"
      }
    ]
  }
}
```


## Formulation

[MATHEMATICALLY-DERIVED] For $N$ responses and masked per-token loss $\ell_{it}$, define three reductions:

$$
\mathcal L_{\rm seq}=\frac1N\sum_i\frac{\sum_tm_{it}\ell_{it}}{L_i},\quad
\mathcal L_{\rm fixed}=\frac{\sum_{it}m_{it}\ell_{it}}{NL_{\max}},\quad
\mathcal L_{\rm tok}=\frac{\sum_{it}m_{it}\ell_{it}}{\sum_iL_i}.
$$
*(Eq. 35.13)*

where $L_i=\sum_tm_{it}>0$, $L_{\max}$ is the declared fixed cap and all denominators span the same logical batch.

[OFFICIAL-DOCUMENTATION] Pinned TRL v1.13.0 implements response means for grpo, a fixed maximum-completion-length denominator for dr_grpo, and globally corrected valid-token normalization for dapo. It also implements separate clipping and truncated-completion masks. These are release-specific code definitions. [R35.1, grpo_trainer.py2334–2344,2962–3037].


```figure
{
  "id": "fig-35.20",
  "kind": "calculator",
  "title": "Equal responses or equal tokens",
  "caption": "Eq.35.13 contrasts two response lengths with constant per-token losses. The fixed-length cap is32 in this analytical example.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.13",
  "alt": "Eq.35.13 contrasts two response lengths with constant per-token losses. The fixed-length cap is32 in this analytical example. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "equation": "35.13",
    "tex": "L_{\\rm seq}=(a+b)/2",
    "inputs": [
      {
        "symbol": "L1",
        "label": "First length",
        "default": 2,
        "min": 1,
        "max": 32,
        "format": "integer",
        "options": [
          1,
          2,
          4,
          8,
          16,
          32
        ]
      },
      {
        "symbol": "L2",
        "label": "Second length",
        "default": 8,
        "min": 1,
        "max": 32,
        "format": "integer",
        "options": [
          1,
          2,
          4,
          8,
          16,
          32
        ]
      },
      {
        "symbol": "a",
        "label": "First token loss",
        "default": 1,
        "min": 0.1,
        "max": 4,
        "format": "fixed3"
      },
      {
        "symbol": "b",
        "label": "Second token loss",
        "default": 3,
        "min": 0.1,
        "max": 4,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "seq",
        "label": "Response mean",
        "formula": "(a+b)/2",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "tok",
        "label": "Token mean",
        "formula": "(L1*a+L2*b)/(L1+L2)",
        "format": "fixed3",
        "emphasis": true
      },
      {
        "symbol": "fixed",
        "label": "Fixed-cap reduction",
        "formula": "(L1*a+L2*b)/64",
        "format": "fixed3",
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation",
  "states": [
    {
      "anchor": "formulation",
      "label": "Unequal lengths",
      "variables": {
        "L1": 2,
        "L2": 8
      }
    },
    {
      "anchor": "mechanism",
      "label": "Equal lengths",
      "variables": {
        "L1": 8,
        "L2": 8
      }
    },
    {
      "anchor": "failure-modes",
      "label": "Length imbalance",
      "variables": {
        "L1": 1,
        "L2": 32
      }
    }
  ]
}
```


## Mechanism

### Methodology

[MATHEMATICALLY-DERIVED] Let response 1 have length2 and response 2 length8, with constant per-token losses $a$ and $b$. Then $\mathcal L_{\rm seq}=(a+b)/2$, while $\mathcal L_{\rm tok}=(2a+8b)/10$. Their derivative weights differ by a factor four between responses. $\mathcal L_{\rm fixed}$ retains the same relative token weights as the global-token loss for this fixed batch, but its overall scale depends on total valid length. Across batches that scale changes, so optimizer dynamics need not match.

[DERIVED] A DrGRPO-style reconstruction removes within-group standard-deviation scaling and uses a fixed-length denominator. These are two independent changes: disabling reward scaling retains raw reward units; changing the denominator alters length weighting. A DAPO-style reconstruction uses global-token reduction alongside separately configured clipping, collection and truncation choices. Do not infer all choices from the loss-type string. An origin-paper score is not reproduced merely by setting one current configuration flag.

[MATHEMATICALLY-DERIVED] For binary correctness probability $p$, a group is informative with probability $u_G(p)$ from Eq. 35.9. Repeated iid uniform prompt draws accepted only when mixed have distribution35.11. If the per-draw gradient contribution $g_j$ is exactly zero for discarded groups and stopping time $T_B$ collects $B$ informative groups, then under integrability and an unbounded iid refill process,

$$
\mathbb E\!\left[\sum_{j=1}^{T_B}g_j\right]
=\mathbb E[T_B]\,\mathbb E[g_1].
$$
*(Eq. 35.14)*

where the identity concerns the unnormalized sum and requires the usual stopping-time conditions; dividing by fixed $B$ only changes its scalar factor.

[DERIVED] This reconciles two facts: accepted prompt frequencies change, while this narrowly specified expected gradient direction can remain unchanged. It fails as a blanket claim for capped refill, prompt-dependent group sizes, nonzero discarded KL terms, adaptive nonuniform proposals or a random token denominator. A maximum of eight refill rounds is a different finite procedure from the unbounded identity. Keep its incomplete-batch probability, consumed rollouts and update-normalization rule.

[MATHEMATICALLY-DERIVED] A useful advantage family on mixed binary groups is

$$
A_+(\hat p)=\left(\frac{1-\hat p}{\hat p}\right)^{a_+},\qquad
A_-(\hat p)=-\left(\frac{\hat p}{1-\hat p}\right)^{a_-}.
$$
*(Eq. 35.15)*

where $a_+,a_-\ge0$, $0<\hat p<1$ and boundary groups require an explicit branch. At $a_+=a_-=1/2$ this matches population-standardized binary advantages with zero epsilon.

[DERIVED] Changing the exponents changes the relative treatment of rare successes and failures. At both exponents zero, advantages are $+1$ and $-1$, not centered rewards. For a fixed population success probability with iid score sampling this produces twice the reward-gradient direction because $\mathbb E[(2R-1)s]=2\mathbb E[Rs]$. Empirical group proportions and clipping introduce additional dependence, so that observation is not a full training equivalence.

[PAPER-REPORTED] AsymGRPO chooses unequal exponents and evaluates them with clipped optimization. Its paper's unclipped analytical expression must not be read as an exact off-policy importance-sampling theorem. [R35.5, §2,4; Appendix D–E].


```figure
{
  "id": "fig-35.21",
  "kind": "chart",
  "title": "Advantage exponents change rare-success weight",
  "caption": "Eq.35.15 compares positive magnitudes on mixed groups; these are analytical functions, not benchmark outcomes.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.15",
  "alt": "Eq.35.15 compares positive magnitudes on mixed groups; these are analytical functions, not benchmark outcomes. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "line",
    "x": {
      "label": "empirical success fraction",
      "domain": [
        0.01,
        0.99
      ]
    },
    "y": {
      "label": "positive advantage",
      "scale": "log10"
    },
    "series": [
      {
        "id": "n0",
        "label": "Exponent0.5",
        "formula": "((1-x)/x)^0.5",
        "sample": {
          "from": 0.01,
          "to": 0.99,
          "count": 41
        },
        "emphasis": true
      },
      {
        "id": "n1",
        "label": "Exponent0.9",
        "formula": "((1-x)/x)^0.9",
        "sample": {
          "from": 0.01,
          "to": 0.99,
          "count": 41
        },
        "dashed": true
      }
    ],
    "annotations": [
      {
        "x": 0.5,
        "y": 1,
        "label": "Both magnitudes1 at half success"
      }
    ]
  }
}
```


[MATHEMATICALLY-DERIVED] Derive an entropy differential independently. For tabular softmax logits $z_b$, probabilities $p_b$ and $H=-\sum_bp_b\log p_b$,

$$
dH=-\sum_bp_b(\log p_b+H)\,dz_b.
$$
*(Eq. 35.16)*

where logits are independent coordinates and the action set is finite. This follows from $dp_b=p_b(dz_b-\sum_cp_cdz_c)$ and $\sum_bdp_b=0$.

[MATHEMATICALLY-DERIVED] With mean-zero action advantages $A_b$ and expected score update $dz_b=\eta p_bA_b$, the first-order entropy change is

$$
\Delta H=-\eta\sum_bp_b^2A_b(\log p_b+H)+O(\eta^2).
$$
*(Eq. 35.17)*

where the approximation holds for sufficiently small finite steps and bounded logits/advantages locally. Shared neural parameters require the actual inner product $\nabla_\theta H^\top g$ and can couple other prefixes.

[DERIVED] R35.6 prints a different diagnostic in Eq.6 and drops cross-action terms in Appendix A's derivation. For $p=(0.8,0.2)$ and $A=(0.2,-0.8)$, Eq. 35.17's coefficient is approximately−0.070978, while that printed diagnostic gives−0.115340. This finite counterexample is an analytical check, not a GPU experiment. The corrected derivation belongs to this book; it must not be attributed to the paper.

[MATHEMATICALLY-DERIVED] A generic balancing construction partitions detached diagnostic contributions into positive mass $P$ and negative magnitude $N$. Multiplying the two sets by $1+b$ and $1-b$ gives net proxy flow $(1+b)P-(1-b)N$. Solving for zero yields

$$
b=\frac{N-P}{N+P},\quad
(1+b)P-(1-b)N=0,\qquad P+N>0.
$$
*(Eq. 35.18)*

where $b\in[-1,1]$; if $P=N=0$, set $b=0$. An empty side gives an endpoint and zeroes the opposite side. Balancing a diagnostic does not prove actual entropy conservation or preserve the full parameter-update direction.

[DERIVED] For example, if two noncollinear parameter contributions are weighted differently, their sum generally rotates. Only special proportionality conditions preserve direction. Detach membership, $P,N,b$ when using this construction as a weighting surrogate; differentiating through them produces another objective. A printed code fragment that omits those semantics does not establish them.


```figure
{
  "id": "fig-35.22",
  "kind": "chart",
  "title": "Detached proxy balancing equalizes two magnitudes",
  "caption": "Eq.35.18 analytical P2,N6 gives b0.5. Weighted positive and negative proxy magnitudes are both3. This balances the diagnostic proxy, not measured gradient norms; zero-total and one-sided branches remain separate.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.18",
  "alt": "Grouped bars show proxy magnitudes positive2/negative6 before balancing and3/3 after balancing. Negative means magnitude of the negative side, not a signed reward or true-gradient measurement.",
  "spec": {
    "type": "bar",
    "categories": [
      "Positive proxy magnitude",
      "Negative proxy magnitude"
    ],
    "x": {
      "label": "detached diagnostic side"
    },
    "y": {
      "label": "declared proxy units",
      "domain": [
        0,
        6
      ]
    },
    "series": [
      {
        "id": "raw",
        "label": "Original",
        "values": [
          2,
          6
        ]
      },
      {
        "id": "balanced",
        "label": "Balanced",
        "values": [
          3,
          3
        ],
        "emphasis": true
      }
    ]
  },
  "anchor": "formulation"
}
```


[MATHEMATICALLY-DERIVED] A prompt belief can be represented in arc coordinate $\psi=\arcsin\sqrt p$. Its binomial Fisher information is $G/[p(1-p)]$ in $p$, and the chain rule gives constant $4G$ in $\psi$. This motivates an approximate Gaussian observation variance $1/(4G)$ away from boundaries; it is not an exact posterior law. A projected scalar filter has

$$
K=\frac{P_\psi}{P_\psi+R_\psi},\quad
\mu^+=\Pi_{[0,\pi/2]}[\mu+K(z-\mu)],\quad
P_\psi^+=(1-K)P_\psi .
$$
*(Eq. 35.19)*

where $P_\psi,R_\psi>0$ are belief and observation variances. Projection and model misspecification mean the reported variance is an approximation, not calibrated uncertainty by definition.

[PAPER-REPORTED] ARCUS propagates beliefs by competence drift and diffusion, uses a Freeman–Tukey observation for mixed counts and boundary observations for all-fail/all-pass groups, scores a Gaussian target kernel by predicted informative yield, samples Gumbel-top-$M$ candidates, then selects at most$B$ informative groups. Its approximate inclusion correction must not be described as exact. [R35.4, §4; Appendix D].

[DERIVED] Every candidate updates the belief, including a zero-variance group. That is statistically different from declaring such groups useless. A task selector has $O(N|\Psi|)$ scalar scoring work for $N$ tasks and target grid $\Psi$, plus $MG$ generation/checker calls. The model forward/backward work dominates only if measured; scalar overhead cannot justify omitting rejected rollout cost.


[MATHEMATICALLY-DERIVED] The scalar belief update can be reconstructed with explicit domain guards. For a mixed count, use $z=\arcsin\sqrt{(m+3/8)/(G+3/4)}$ and $R_\psi=1/(4G+2)$; at counts zero and $G$, use $z=0$ or $\pi/2$ and $R_\psi=1/(2G)$. First propagate $\mu\leftarrow\Pi[\mu+v\sin(2\mu)]$ and $P_\psi\leftarrow P_\psi+Q$, then apply Eq. 35.19. Here $v$ is competence drift and $Q\ge0$ diffusion, distinct from policy value functions. Source moment fitting uses revisited-prompt innovations; an unobserved prompt's belief is a prediction, not a measured pass rate.

[MATHEMATICALLY-DERIVED] For target $\psi^*$ and width $\sigma$, Gaussian overlap is $\kappa=\sqrt{\sigma^2/(\sigma^2+P_\psi)}\exp[-(\mu-\psi^*)^2/(2(\sigma^2+P_\psi))]$. Combining it with an informative-yield approximation produces a score. With $a_q=1+2GP_\psi$, that approximation is $1-\{e^{-G\mu^2/a_q}+e^{-G(\pi/2-\mu)^2/a_q}\}/\sqrt{a_q}$. It comes from a boundary-layer surrogate, not exact integration of a truncated Gaussian posterior. Check its finite nonnegative range before using it as a sampling weight; an all-zero score vector needs a declared fallback.

[PAPER-REPORTED] R35.4 §4 and Appendix D use width $\min(\sin\psi^*,\cos\psi^*)/\sqrt2$, candidate margin 0.25, sampling temperature 0.3 and a41-target grid. Capped-proportional approximate inclusion weights choose the hardest target within 0.03 of best predicted yield, with rate limiting and a warm-up pass.

[DERIVED] Gumbel-top-$M$ ranks $\log s_q/T_{\rm select}+\gamma_q$ for independent unit-scale Gumbel noises. It generates a weighted sample without replacement; the resulting marginal inclusion probabilities are not simply normalized single-draw weights. ARCUS's capped-proportional approximation solves $\sum_q\min(1,c\,s_q^{1/T_{\rm select}})=M$. Use bounded bisection with a declared tolerance; the source uses40 iterations. After generation all candidate groups update beliefs, while only at most$B$ mixed groups ranked by the updated scoring rule enter optimization. The selector therefore has both a pre-generation proposal and a post-generation selection stage.

[DERIVED] The full operator order matters: propagate beliefs, choose target, sample candidates, generate bounded groups, observe counts, update beliefs, select complete informative groups, construct detached advantages and update the policy. Algorithm 35.4 is a generic bounded composition; substituting ARCUS requires these source-specific operators and its candidate margin. Exact inverse-probability correction would need actual inclusion probabilities for the complete selection process. Calling an approximate capped-proportional predictor an exact correction would overstate the method.

## Algorithm

**Algorithm 35.4 — Explicit refinement composition.** Inputs are initial parameters, a positive finite policy-step cap $t_{\max}\ge1$, frozen initial belief states, prompt proposal $Q_t$, positive refill-attempt cap $R_{\max}\ge1$, desired groups $B\ge1$, group size $G\ge2$, positive token cap, exponent/scale contract, clipping bounds, loss reduction and optional detached entropy diagnostic. State retains parameters, prompt beliefs, all attempts and all update failures.

$$
\begin{aligned}
(1)\;&t\leftarrow0;\quad\theta_0\leftarrow\theta_{\rm init};\quad
\operatorname{InitializeFrozenBeliefs};\quad
(\mathcal A_t,\mathcal B_t,r)\leftarrow(\varnothing,\varnothing,0).\\
(2)\;&\mathcal X_r\leftarrow\operatorname{SampleBounded}(Q_t,B,\text{seed}_{t,r});\\
&u\leftarrow(t,r,j)\text{ for each proposed group }j;\quad
\mathcal U_r\leftarrow\operatorname{Collect}_{35.1}(\mathcal X_r,G,L_{\max},T_{t,r}).\\
(3)\;&\mathcal A_t\leftarrow\mathcal A_t\cup\mathcal U_r;\quad
\mathcal C_r\leftarrow\{u:|\mathcal U_{r,u}|=G,\ \operatorname{RewardDefined}(\mathcal U_{r,u}),\ \min_i\sum_jm_{uij}>0\};\\
&m_u\leftarrow\sum_{i=1}^{G}\mathbf1[z_{ui}=\mathrm{PASS}]
\quad(u\in\mathcal C_r).\\
(4)\;&(\mu_{x(u)},P_{x(u)})\leftarrow
\operatorname{BeliefUpdate}_{35.19}(m_u)
\quad(u\in\mathcal C_r,\ \text{belief sampler enabled}).\\
(5)\;&\mathcal I_r\leftarrow
\begin{cases}
\{u\in\mathcal C_r:0<m_u<G\},&\text{mixed-group refill enabled},\\
\mathcal C_r,&\text{ordinary no-refill mode};
\end{cases}\\
&\mathcal B_t\leftarrow\operatorname{SelectFrozenRule}(\mathcal B_t\cup\mathcal I_r,B).\\
(6)\;&r\leftarrow r+1;\quad
\text{repeat 2--5 only if refill enabled, }|\mathcal B_t|<B,\ r<R_{\max},
\text{ budget permits}.\\
(7)\;&|\mathcal B_t|=0\Longrightarrow\text{return }(\mathrm{ABSTAIN},\theta_t,\mathcal A_t);\quad
A_{ui}\leftarrow\operatorname{stopgrad}(\operatorname{ChosenAdvantage}(R_u)).\\
(8)\;&b\leftarrow\operatorname{stopgrad}
\begin{cases}(N-P)/(N+P),&N+P>0,\\0,&N+P=0;\end{cases}\\
&w_{uit}\leftarrow
\begin{cases}
1+b,&d_{uit}>0,\\1-b,&d_{uit}<0,\\1,&d_{uit}=0,
\end{cases}
\quad\text{or }w_{uit}=1\text{ when disabled}.\\
(9)\;&\mathcal L_t\leftarrow
\operatorname{Reduce}_{35.13}(m_{uit}w_{uit}\ell_{uit});
\quad g_t\leftarrow\nabla_\theta\mathcal L_t.\\
(10)\;&\theta_{t+1}\leftarrow
\begin{cases}\operatorname{OptimizerStep}(\theta_t,g_t),&\operatorname{Finite}(\mathcal L_t,g_t),\\
\theta_t,&\text{otherwise; retain FAILED}.
\end{cases}\\
(11)\;&t\leftarrow t+1;\quad
\text{if }t<t_{\max}\text{ and budget permits, reset }(\mathcal A_t,\mathcal B_t,r)\text{ and repeat 2--10}.\\
(12)\;&\text{return }(\theta_t,\text{all attempt ledgers, beliefs and update diagnostics}).
\end{aligned}
$$

[DERIVED] This is an explanatory composition, not a claim that any source executes all refinements together. Disable unused branches explicitly: ordinary uniform GRPO does not need mixed-group refill, exponents, beliefs or entropy weighting. Partial batches follow a frozen denominator rule. Each completed step retains its attempt ledger before the next reset. The diagnostic contributions $d$, masses $P,N$ and membership are computed and detached before line8; absent diagnostics disable that branch. Incomplete groups are quarantined, and repeated prompts retain distinct group IDs $u$. Every outer step and inner refill has a finite cap. The invariant is conserved attempt/budget identity; selection never erases consumed work. Total worst-case attempts are $t_{\max}R_{\max}BG$ before any separately bounded candidate margin.

## Implementation

[DERIVED] In Hugging Face TRL or verl, distinguish generated-action masks, completion-validity masks and truncated-response masks before reduction. Masking a capped response sets a training contribution to zero; it does not classify an unseen answer as incorrect. A reference KL on otherwise discarded groups makes their total gradient nonzero, invalidating the zero-gradient premise of Eq. 35.14.

[DERIVED] Global-token normalization requires allreduced numerator and denominator or an algebraically equivalent distributed correction. Under gradient accumulation, dividing each microbatch by its own valid-token count changes weighting. Entropy diagnostics can require full-vocabulary distributions, adding memory/bandwidth beyond chosen-token log probabilities. A top-k approximation must disclose omitted probability mass. Prompt belief state is small, while rollout KV memory and discarded generation remain substantial.


```figure
{
  "id": "fig-35.23",
  "kind": "compare",
  "title": "What each refinement changes",
  "caption": "The figure separates mechanisms that are often bundled under one training recipe.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.0",
  "alt": "The figure separates mechanisms that are often bundled under one training recipe. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "axis": "Intervention",
    "columns": [
      {
        "id": "n0",
        "label": "Normalization"
      },
      {
        "id": "n1",
        "label": "Sampling"
      },
      {
        "id": "n2",
        "label": "Clipping"
      }
    ],
    "rows": [
      {
        "dimension": "Object",
        "values": {
          "n0": "Loss denominator",
          "n1": "Prompt/attempt measure",
          "n2": "Token surrogate"
        }
      },
      {
        "dimension": "Main observable",
        "values": {
          "n0": "Length-weighted gradient",
          "n1": "Accepted yield + cost",
          "n2": "Clip fraction"
        }
      },
      {
        "dimension": "Not guaranteed",
        "values": {
          "n0": "Unbiased reward gradient",
          "n1": "Fixed-budget superiority",
          "n2": "Hard KL bound"
        }
      }
    ]
  }
}
```


## Experimental design

### Reported experiments

[PAPER-REPORTED] The following are source-specific protocols, not one pooled comparison.

| Source | Disclosed setup | Evaluation/selection | Missing/boundary |
|---|---|---|---|
| AsymGRPO | Qwen3-4B nonthinking; MATH7500;4 H100; verl/AdamW $2e{-6}$;G8;batch 128/mini64;4096response cap; exponents 0.9/0.4 | Temperature0.4, top-p1;5 samples larger tests/10 smaller; best MATH500 checkpoint | Seeds/CIs/precision NOT-DISCLOSED; MATH500 used in selection |
| OPEFO | Qwen2.5-Math7B, Qwen3-4BBase; DAPO17K;32 A100; AdamW;32prompts×8; strict1 update $2.83e{-6}$ versus 8 updates $1e{-6}$ | Temperature1/top-p0.7; Avg@32 on 30/30/40-question exams, Avg@1 others; highest benchmark mean checkpoint | Seeds/precision NOT-DISCLOSED; selection/test entanglement |
| ARCUS | Qwen2.5-Math1.5B/7B,Qwen3-4BBase; DAPO17K;8 H100 80GB;BF16; verl/vLLM;AdamW $1e{-6}$;300updates;B256/G8 | Final checkpoint;3seeds;500heldout training-pool prompts for tuning; temperature 0.6/top-p0.95;32/16/4 samples by benchmark | Dynamic refill capped8rounds; inclusion approximation |

## Observations

**What the paper claims.** [PAPER-REPORTED] AsymGRPO Table 1 reports mean 59.36 versus GRPO56.50 and DrGRPO58.14. OPEFO Table 1 reports 52.4 versus strict GRPO50.1 on 7B. ARCUS Appendix F reports 7B mean 46.90±0.27 versus GRPO44.08±0.37, across three seeds. [R35.4–R35.6].

**What the evidence shows.** [DERIVED] These means use different protocols and cannot rank papers. OPEFO Table 2 labels45.5 as strict GRPO although Table 1 uses45.5 for approximate GRPO. Its strict comparison also changes learning rate and update count. Its entropy proof gap remains separate from the reported benchmark result.

**What we infer.** [MATHEMATICALLY-DERIVED] Normalization, clipping, sampling and diagnostic weighting alter distinct mathematical objects. Equation 35.18 balances its declared proxy only; Eq. 35.17 supplies the independent tabular entropy derivative.

**What remains unknown.** [UNVERIFIED] No independent replication establishes the source gains here. Generality across task families, unseen checker errors and matched end-to-end budgets remains unverified.


```figure
{
  "id": "fig-35.24",
  "kind": "chart",
  "title": "Actual tabular entropy differential",
  "caption": "Eq.35.17 for A=(1−p,−p) gives −2p²(1−p)²log[p/(1−p)]. The sign changes at one half.",
  "placement": "inline",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-35.17",
  "alt": "Eq.35.17 for A=(1−p,−p) gives −2p²(1−p)²log[p/(1−p)]. The sign changes at one half. This is a declared analytical construction, not a measured result for a model.",
  "spec": {
    "type": "line",
    "x": {
      "label": "probability of rewarded action",
      "domain": [
        0.001,
        0.999
      ]
    },
    "y": {
      "label": "first-order entropy coefficient"
    },
    "series": [
      {
        "id": "n0",
        "label": "Exact two-action differential",
        "formula": "-2*x^2*(1-x)^2*ln(x/(1-x))",
        "sample": {
          "from": 0.001,
          "to": 0.999,
          "count": 41
        },
        "emphasis": true
      }
    ],
    "annotations": [
      {
        "x": 0.5,
        "y": 0,
        "label": "Entropy differential changes sign"
      }
    ]
  }
}
```


## Failure modes

> **Failure mode — Proxy conservation mistaken for theorem.** *Symptom:* balanced diagnostic flow is reported as exact neural-policy entropy conservation. *Cause:* omitted cross-action/shared-parameter terms or finite-step effects. *Detection:* compare the full entropy directional derivative with the proxy on finite examples. *Mitigation:* label the diagnostic as a surrogate and retain its counterexamples.

[DERIVED] Additional failures include zero-variance dead zones, biased partial-batch denominators, excessive rejected-rollout cost, stale prompt beliefs and truncation-dependent selection. Wider upper clipping permits additional positive updates; it cannot guarantee exploration. A sampler can improve accepted-batch reward while increasing total cost per useful update.

## Siblings

[DERIVED] GRPO contrasts responses within a task; DrGRPO-style scaling changes reward/length weighting; DAPO-style recipes combine separately configurable changes. AsymGRPO changes advantage magnitudes, ARCUS changes task allocation, and OPEFO weights token updates through a diagnostic. Their scope is different enough that an omnibus label such as improved GRPO is scientifically insufficient.

## Extensions

### Improvements

[PAPER-REPORTED] ARCUS reports a rollout-efficiency tradeoff against capped dynamic sampling. The following totals retain the source's workload boundary. [R35.4, Appendix F, Table 6].

| Methods / total hours | Hardware / model / precision | Sequence and input distribution | Concurrency / budget / runtime | Measurement boundary |
|---|---|---|---|---|
| GRPO19.8; dynamic sampling41.6; ARCUS24.1 | 8×H100 80GB; Qwen2.5-Math7B; BF16 | DAPO-Math17K; prompt cap 1024, response cap 3072 | B256/G8;300policy updates; verl/vLLM; exact versions NOT-DISCLOSED | Source end-to-end training wall clock, including generated/discarded rollouts |

[DERIVED] These totals are not portable throughput promises. Different sampling policies perform different amounts of generation within the same policy-update count.

[DERIVED] The successor evidence does not establish a single best recipe. Retain both accuracy and accepted-update cost, and preserve negative or inconsistent source evidence alongside positive comparisons.

## Limitations

[DERIVED] The formal results assume their stated iid, finite-action or tabular conditions. They do not prove stability of a shared-parameter language model. Missing source implementation details prevent exact reproduction; an explicit NOT-DISCLOSED field is more accurate than importing an older recipe excluded by the user.

## Reproducibility

[DERIVED] Record every intervention independently, including sample/population SD, epsilon, loss axes, clipping bounds, KL placement, truncation branch, refill cap, selector probabilities, entropy precision, detached diagnostic state and all consumed work. Preserve source table inconsistencies and compare against the exact printed baselines rather than silently repairing them.

## References

[R35.1] Pinned TRL code. [R35.4] ARCUS §3–5, Appendices B–F. [R35.5] AsymGRPO §2–4, Appendices D–E. [R35.6] OPEFO §3–6, Appendix A.
