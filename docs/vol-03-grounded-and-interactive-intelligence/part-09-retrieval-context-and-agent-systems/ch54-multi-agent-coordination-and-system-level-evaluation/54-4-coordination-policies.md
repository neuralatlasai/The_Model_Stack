---
id: ms.section.54.4
entity_type: section
title: "Coordination policies"
volume: 3
part: 9
chapter: 54
section: 54.4
slug: 54-4-coordination-policies
parent: ms.chapter.54
prev_sibling: ms.section.54.3
next_sibling: ms.section.54.5
children: []
prerequisites: [ms.chapter.6, ms.chapter.38, ms.chapter.48, ms.chapter.51, ms.chapter.52, ms.chapter.53]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, assurance], mechanism: [multi_agent_coordination, resource_accounting], feedback_setting: [], modality: [text]}
papers: [P41, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 54.4 Coordination policies

## Scope

[DERIVED] Coordination policy determines who delegates, who communicates, how disagreements are resolved and when the system stops. We compare centralized and decentralized control, independent aggregation, voting/debate and critic roles. The baseline assumes that more agents or stronger consensus necessarily improves correctness. The objective is verified task benefit under controlled information, authority and total resources.

[DERIVED] Policies combine several interventions: context isolation, parallel exploration, aggregation, correction and additional compute. A policy comparison must identify which intervention changed. Agent count is a structural descriptor; it does not by itself specify evidence diversity, independence or an execution budget.

## Why this exists

[DERIVED] A central coordinator can preserve task constraints and prevent conflicting actions, yet becomes a bottleneck and a single source of planning errors. Decentralized peers can exchange evidence without that bottleneck, yet may propagate one plausible mistake or struggle to resolve conflicting state. A hybrid inherits both coordination opportunities and additional control complexity.

[DERIVED] Voting and criticism are also distinct mechanisms. Independent sampling can reduce some stochastic errors; discussion changes the distribution and dependence of subsequent answers. A critic can correct an error, preserve it or replace a correct answer with a wrong one. Persuasive agreement is not equivalent to independent validation.

[PAPER-REPORTED] Debate-or-Vote compares independent voting with several debate protocols and finds that voting accounts for much of the observed benefit in its tasks [R54.6, §§2–3/Table 1]. This supports a strong ensemble baseline, not a universal theorem that communication is useless.

## Intuition

[DERIVED] Separate generation from aggregation. Initial independent candidates reveal what sampling alone provides. A debate condition then exposes candidates to peers under a named retention/round policy. A critic condition adds a specific verification/evidence channel. The final selection rule is held fixed where possible so its contribution is not confused with generation quality.

[DERIVED] Diversity is useful when it supplies complementary correct evidence or different recoverable errors. Different wording, personas or embedding directions can all occur among wrong answers. A high-performing verifier can make diverse candidates useful; a weak aggregator can discard the only correct one.

## Formulation

[MATHEMATICALLY-DERIVED] Let initial answer correctness probability be $p_0$, correction probability on initially wrong answers be $q_{\rm corr}$ and subversion probability on initially correct answers be $q_{\rm sub}$. Then
$$
p_{\rm after}=p_0(1-q_{\rm sub})+(1-p_0)q_{\rm corr},\qquad
p_{\rm after}-p_0=(1-p_0)q_{\rm corr}-p_0q_{\rm sub}.
$$
*(Eq. 54.11)*

[DERIVED] These are conditional outcome definitions, requiring no independence. A critic helps only when corrected errors outweigh subverted correct answers under the task distribution. Self-reported agreement is not an estimator of either probability; truth/outcome labels are required.

[MATHEMATICALLY-DERIVED] For integer $n_a\ge2$ exchangeable Bernoulli correctness indicators $Y_i$ with $0<p<1$ and pairwise correlation $\rho_{\rm corr}$,
$$
\operatorname{Var}\!\left(\frac1{n_a}\sum_iY_i\right)
=\frac{p(1-p)}{n_a}[1+(n_a-1)\rho_{\rm corr}],\qquad
n_{\rm eff}=\frac{n_a}{1+(n_a-1)\rho_{\rm corr}}
$$
*(Eq. 54.12)*

[DERIVED] The effective count is a variance analogy when the denominator is positive, not an accuracy theorem. Zero denominator gives a deterministic average under that joint law; infeasible correlations are not admitted merely by typing them into a formula. Positive semidefiniteness requires $\rho_{\rm corr}\ge-1/(n_a-1)$, but Bernoulli feasibility can be more restrictive.

[MATHEMATICALLY-DERIVED] Under the stronger iid binary assumption with odd $n_a$, majority correctness is
$$
p_{\rm maj}=\sum_{k=(n_a+1)/2}^{n_a}
\binom{n_a}{k}p^k(1-p)^{n_a-k}.
$$
*(Eq. 54.13)*

[DERIVED] This does not apply to multiclass plurality, correlated agents or a semantic judge selecting open-ended outputs. Even independent draws from one model share systematic task errors through heterogeneous per-task success probabilities; marginal averaging across tasks can conceal that structure.

[MATHEMATICALLY-DERIVED] Pairwise decorrelation alone is insufficient. Construct three exchangeable indicators by drawing $K_{\rm correct}$ and then a uniformly random subset of that size:

| Correct agents $K_{\rm correct}$ | 0 | 1 | 2 | 3 |
|---|---:|---:|---:|---:|
| Law A probability | 0.014 | 0.438 | 0.282 | 0.266 |
| Law B probability | 0.114 | 0.138 | 0.582 | 0.166 |

[MATHEMATICALLY-DERIVED] Both laws have $\mathbb E K_{\rm correct}=1.8$ and $\mathbb E[K_{\rm correct}(K_{\rm correct}-1)]=2.16$. Therefore each agent has $p=0.6$, each pair has joint correctness $2.16/6=0.36=p^2$, and $\rho_{\rm corr}=0$. Nevertheless majority correctness is $0.282+0.266=0.548$ in A and $0.582+0.166=0.748$ in B. The same variance and $n_{\rm eff}$ leave materially different majority outcomes because higher-order dependence differs. These are exact mathematical distributions, not model measurements.



```figure
{
  "id": "fig-54.12",
  "kind": "calculator",
  "title": "Correction versus subversion",
  "caption": "Conditional correctness accounting, not a calibrated critic model. Correction on wrong initial answers must outweigh damage to correct initial answers.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-54.11",
  "alt": "Conditional correctness accounting, not a calibrated critic model. Correction on wrong initial answers must outweigh damage to correct initial answers.",
  "spec": {
    "tex": "\\Delta p=(1-p_0)q_{\\rm corr}-p_0q_{\\rm sub}",
    "equation": "54.11",
    "inputs": [
      {
        "symbol": "p",
        "label": "Initial correctness probability",
        "default": 0.8,
        "min": 0,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "corr",
        "label": "Conditional correction probability",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "sub",
        "label": "Conditional subversion probability",
        "default": 0.1,
        "min": 0,
        "max": 1,
        "format": "ratio"
      }
    ],
    "outputs": [
      {
        "symbol": "delta",
        "label": "Correctness probability change",
        "formula": "(1-p)*corr-p*sub",
        "format": "percent"
      },
      {
        "symbol": "after",
        "label": "Final correctness probability",
        "formula": "p*(1-sub)+(1-p)*corr",
        "format": "percent"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Centralized control routes worker proposals through one coordinator that owns dependency/authority decisions. Independent aggregation keeps worker contexts isolated until selection. Decentralized control permits peer exchange, requiring explicit version, conflict and termination rules. Hybrid control adds peer evidence paths while retaining an authoritative commit coordinator. The topology of messages need not equal the topology of state authority.

[DERIVED] Delegation assigns a bounded task contract rather than an open-ended invitation to spawn more agents. Critics receive an artifact, original requirements and independent evidence/checking tools where available. A critic seeing only the author's explanation can repeat its assumptions. Distinct model identity may alter errors but does not prove independence; measure correction and subversion under matched tasks.

[DERIVED] Voting needs answer normalization, tie rules and missing/failing-agent treatment before evaluation. For open-ended tasks, an equivalence/judge procedure adds model bias and cost. Debate needs round/order/retention rules and a finite stopping cap. Consensus can be a stopping signal under a workflow, but cannot replace a task check or authorize an otherwise forbidden side effect.

[PAPER-REPORTED] R54.5 defines a spectral effective-rank proxy from normalized output embeddings and studies model/persona mixtures [R54.5, §§4.3–5]. Its proxy is not correctness or Shannon answer information.

[MATHEMATICALLY-DERIVED] For nonzero embeddings in dimension $d_e$, a trace-normalized Gram matrix has nonnegative eigenvalues $\eta_j$ summing to one. Its entropy rank is
$$
r_{\rm ent}=\exp\!\left(-\sum_j\eta_j\log\eta_j\right),\qquad
1\le r_{\rm ent}\le\operatorname{rank}(G)\le\min(n_a,d_e).
$$
*(Eq. 54.14)*

[DERIVED] The bound follows from entropy maximization on the nonzero eigenvalue support. Collinear outputs give rank one; equal-energy orthogonal outputs attain their available rank. Diverse wrong answers can attain the upper bound. Replacing labels with this proxy cannot establish independent correct evidence; embedding model and output formatting also affect it. R54.5's larger geometric information lower bound likewise does not order actual information values or establish their actual marginal-return shape.

[PAPER-REPORTED] R54.6 models debate using a Dirichlet-count update and a martingale argument [R54.6, §4/Appendix C]. Its conjugacy proof assumes neighbors are sampled conditionally from the recipient's latent categorical parameter. This is a specific probabilistic model, not an observed implementation law for LLM peers.

[MATHEMATICALLY-DERIVED] More generally, if current belief $p_i$ has count mass $s_i>0$ and $m_i$ observed neighbor votes have conditional expected correctness sum $\sum_{j\in\mathcal N_i}p_j$, the count update gives
$$
\mathbb E[p_i'-p_i\mid\mathcal H]
=\frac{\sum_{j\in\mathcal N_i}p_j-m_ip_i}{s_i+m_i}.
$$
*(Eq. 54.15)*

[DERIVED] Zero drift requires the conditional neighbor mean to equal $p_i$. Unequal beliefs, new evidence and adaptive tools can violate it. A flat empirical mean trajectory does not establish the conditional martingale property, and a martingale in mean belief does not fix the nonlinear majority outcome. The formal assumptions must remain attached to any “debate cannot help” interpretation.

[PAPER-REPORTED] October 2026 work explicitly separates proposal supply from truth-sensitive readout [R54.17, §§3–4]. Its candidate-specific verification pseudo-counts describe a positive-prior Dirichlet accounting model; they are not measured neural hidden states. Coverage selection maximizes a fixed construction-set proxy: labeled correctness for AC-Greedy and answer-cluster agreement fractions for SC-Greedy. The latter is label-free, not a correctness oracle. A monotone submodular construction objective does not guarantee transfer to unseen tasks.

[MATHEMATICALLY-DERIVED] Let $g_0$ indicate that at least one initial candidate is correct, $u_0$ that their declared vote is correct, and $f_*$ that the final output is correct. Assume the vote selects an initial candidate, so $u_0\le g_0$. Partitioning successes and losses gives the exact identity
$$
\mathbb E[f_*-u_0]
=\Pr(f_*=1,g_0=1,u_0=0)
+\Pr(f_*=1,g_0=0,u_0=0)
-\Pr(f_*=0,u_0=1).
$$
*(Eq. 54.16)*

[DERIVED] This joint-probability form of R54.17's Eq. 7 remains defined when an event has probability zero. It separates recovered initial headroom, newly correct outputs and damage. Initial proposal-hit probability bounds final accuracy only when the finalizer is restricted to those candidates. A generator that introduces a new correct answer need not obey that ceiling. Headroom alone is insufficient when damage is large or the readout fails to recover it.

[DERIVED] **Cost.** Centralization adds coordinator tokens and serial decision latency; all-to-all exchange can increase message/context work as Eq. 54.5 shows. Voting needs candidate generation and aggregation; debate adds rounds, context and synchronization. Independent verification may add tools/tests and conflict resolution. Dense spectral-proxy computation requires $O(n_a^2d_e)$ Gram arithmetic, $O(n_a^3)$ dense eigendecomposition and $O(n_a^2)$ storage, separate from embedding/model generation. Total accepted-task cost includes failed candidates, critics, retries and synthesis, even when only one final answer is returned.



```figure
{
  "id": "fig-54.13",
  "kind": "diagram",
  "title": "Supply, exchange and readout",
  "caption": "Preserve isolated initial proposals, then attribute final outcomes to recovered correct minorities, newly correct answers and damage rather than consensus alone.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.16",
  "alt": "The diagram shows Independent proposals to Declared exchange policy; Declared exchange policy to Evidence-aware revision; Evidence-aware revision to Fixed readout and checks; Fixed readout and checks to Recovery, new correct, damage.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "Independent proposals"
      },
      {
        "id": "b",
        "kind": "branch",
        "label": "Declared exchange policy"
      },
      {
        "id": "c",
        "kind": "process",
        "label": "Evidence-aware revision"
      },
      {
        "id": "d",
        "kind": "boundary",
        "label": "Fixed readout and checks"
      },
      {
        "id": "e",
        "kind": "metric",
        "label": "Recovery, new correct, damage"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c"
      },
      {
        "from": "c",
        "to": "d"
      },
      {
        "from": "d",
        "to": "e"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 54.4 — Bounded policy comparison/controller.** [DERIVED] Inputs are fixed task/authority, finite agent configurations, declared topology/aggregation, integer round/delegation caps, durable shared budget and independent task checker. Output is the final artifact plus all candidate, correction/subversion and resource records.

$$
\begin{aligned}
1.&\quad J\leftarrow\operatorname{LoadPolicyStateAndBudgets};
\quad\operatorname{ReserveAggregationAndFinalCheckBudget};\\
 &\quad\operatorname{Unavailable}\Rightarrow\operatorname{ReturnPartial}.\\
2.&\quad \operatorname{GenerateBoundedInitialCandidatesWithDeclaredIsolation};
\quad\operatorname{PersistCandidatesAndCosts}.\\
3.&\quad \operatorname{PolicyRequiresExchange}\land
\operatorname{RoundAndBudgetRemain}\Rightarrow\\
 &\quad\operatorname{DeliverVersionedEvidence};\,
\operatorname{RunBoundedRevisionOrCritic};\,\operatorname{PersistRound};\\
 &\quad \operatorname{NoValidProgressOrCapReached}\Rightarrow\operatorname{GoTo}(5);
\quad\operatorname{Otherwise}\Rightarrow\operatorname{GoTo}(3).\\
4.&\quad \operatorname{NoExchangePolicy}\Rightarrow\operatorname{GoTo}(5).\\
5.&\quad a_*\leftarrow\operatorname{DeclaredAggregateWithTieFailureRules};
\quad\operatorname{IndependentTaskAndPolicyCheck}(a_*);\\
6.&\quad \operatorname{Return}(a_*,J,\mathrm{verified/failed/unknown}).
\end{aligned}
$$

[DERIVED] Invariants are fixed authority, no extra uncharged calls, persistent caps and no consensus-only success. Missing agents and ties follow the predeclared rule, not a favorable post hoc choice. A controller can stop early with failure/unknown when verification is unavailable; it cannot extend rounds to spend unreserved resources.

## Implementation

[DERIVED] Separate message routing, state authority and answer aggregation in the configuration. Log which evidence each agent saw before each answer so apparent independent agreement can be audited. Preserve initial answers before debate; otherwise correction/subversion rates cannot be measured. Answer normalization and judge prompts are versioned parts of the system.

[OFFICIAL-DOCUMENTATION] Framework partial-state reducers are not majority decision semantics or authorizations [R54.14]. A deterministic controller can implement the declared policy while leaving model generation stochastic. No current framework or model compatibility/performance claim follows from static inspection.

## Experimental design

### Reported experiments

[PAPER-REPORTED] R54.6's primary comparisons use five Qwen2.5-7B-Instruct or Llama3.1-8B-Instruct agents across seven tasks, with temperature 1.0, nucleus probability 0.9 and a 512-token generation cap [R54.6, §3/Appendix A]. It compares one-round voting against multi-round debate and examines answer extraction. This isolates some mechanisms, but equal agent count does not make realized tokens/latency equal.

[PAPER-REPORTED] R54.7 varies seven decision protocols, uses Llama 3 8B/70B, retains up to two turns and reports three-run dispersion [R54.7, §3/Table 1]. Different task responses favor different protocols; failure to reach a voting decision affects its averages. R54.5 uses seven reasoning/knowledge tasks, model/persona mixtures, one-round voting and four-round debate with stated call matching [R54.5, §5.1]. That controls calls rather than every resource unit.

[PAPER-REPORTED] R54.17 tests Qwen3-4B and OLMo-3-7B with four-agent traces and fixed-proposal evidence interventions. Applying an identical finalizer to saved states gives 76.45% at R0 versus 78.52% at R3 in its specified aggregate; extra rounds also spend additional work [R54.17, §5/Appendix A.10]. Negative OLMo MATH500 conversion despite positive headroom qualifies universal benefit claims. Main Table 1 uses vote20 versus round-3 majority with differing decoding; Appendix A.5 adds common-decoding, five-seed controls. Those intervals capture generation-seed variation, not task-resampling uncertainty. Construction profiles 500 Qwen/300 OLMo perturbations, and Appendix A.3's compute account excludes failed/exploratory work. These controls challenge a universal debate-null interpretation without proving equal complete lifecycle compute.

## Observations

**What the paper claims.** [PAPER-REPORTED] Voting/debate, diversity and proposal-readout studies propose policy-specific improvements and explanations [R54.5–R54.7; R54.17].

**What the evidence shows.** [PAPER-REPORTED] Experiments have named models/tasks/retention/caps; fixed-proposal and identical-finalizer controls expose distinct mechanisms, while additional rounds and construction have additional costs [R54.17, §5/Appendix A]. Theoretical results require explicit distributional assumptions.

**What we infer.** [DERIVED] Measure correction, subversion, higher-order dependence and aggregation quality rather than treating agreement or spectral diversity as correctness.

**What remains unknown.** [UNVERIFIED] No local policy comparison or calibrated correlation/correction estimate was executed.



```figure
{
  "id": "fig-54.14",
  "kind": "stat-panel",
  "title": "Scientific boundaries to retain",
  "caption": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.11",
  "alt": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "spec": {
    "header": "CLAIM BOUNDARY",
    "rows": [
      {
        "key": "pairwise rho",
        "value": "Insufficient for majority accuracy"
      },
      {
        "key": "spectral rank",
        "value": "Geometry rather than truth"
      },
      {
        "key": "pseudo-count",
        "value": "Accounting, not neural state"
      },
      {
        "key": "controls",
        "value": "Proposals, finalizer, full budget"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

[DERIVED] Shared false premises create consensus on a wrong answer; retain provenance and independent checks. Sycophancy subverts correct candidates; measure Eq. 54.11. Tie-breaking hides failure; predeclare it. Role/model diversity increases disagreement without useful evidence; inspect correct/incorrect outcomes. A central planner becomes a failure bottleneck; preserve task constraints and allow verified objections. A theory proxy is promoted to a universal law; retain assumptions and counterexamples.

## Siblings

[DERIVED] Single-agent search, independent self-consistency, best-of-k with a verifier, specialist pipelines and communicative teams are necessary comparison families. A stronger single agent can use the same tools and extra budget. Chapter 38 owns search/verifier mechanisms; §54.6 owns attribution and uncertainty.

## Extensions

### Improvements

[DERIVED] Preserve independent initial candidates, add verified evidence and select a critic with measured correction/subversion behavior. These changes target a mechanism rather than agent count. Open research is predicting which information and dependence structure makes coordination beneficial before spending the full budget. Prospective held-out tests are needed; observed success cannot be smuggled into the predictor.

## Limitations

[DERIVED] Binary formulas do not directly describe multiclass or open-ended judges. Exchangeability is stronger than equal average accuracy. Spectral rank depends on representation and says nothing about truth. Theoretical lower bounds and flat mean trajectories do not establish actual scaling laws or private-model internal mechanisms.

## Reproducibility

[UNVERIFIED] Preserve initial/final answers, peer exposure, task labels, aggregation/tie rules, model/decoding versions, all resource charges and independent checks. The exact counterexample is mathematical, not a model experiment. Proposed comparisons live in verification.md.

## References

[PAPER-REPORTED] [R54.5](references.md#r54-5), [R54.6](references.md#r54-6), [R54.7](references.md#r54-7), [R54.17](references.md#r54-17) policy/theory studies. [OFFICIAL-DOCUMENTATION] [R54.14](references.md#r54-14) state interface. Access 2026-10-14.
