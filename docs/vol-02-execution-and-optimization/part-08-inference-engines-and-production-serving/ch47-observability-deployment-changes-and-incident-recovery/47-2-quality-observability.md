---
id: "ms.section.47.2"
entity_type: "section"
title: "47.2 — Quality observability"
volume: 2
part: 8
chapter: 47
section: 47.2
slug: "47-2-quality-observability"
parent: "ms.chapter.47"
prev_sibling: "ms.section.47.1"
next_sibling: "ms.section.47.3"
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

# 47.2 — Quality observability

## Scope

[DERIVED] Quality observability estimates whether deployed answers achieve their intended task, with explicit limits from selective feedback, delayed labels, proxy error, and changing workloads. The observation unit may be an answer, a conversation, a completed workflow, or a safety event; these are not interchangeable. We connect task outcomes, user corrections, drift, abstention, and delayed ground truth without treating a convenient score as the outcome itself.

## Why this exists

[DERIVED] A service can become faster while becoming less useful. It can also receive more negative feedback because a newly exposed cohort has higher expectations, even when conditional answer quality is unchanged. Feedback arrives after different delays and through different selection mechanisms. Deployment monitoring therefore needs a joint record of prediction time, label time, cohort, release, and adjudication policy. Comparing today's incomplete labels with last month's mature labels confounds quality with observation time.

[DERIVED] Safety observability adds a further distinction: an incident may occur without being detected, and a detector may flag benign content. Abstention changes the set of answered requests and can reduce conditional error while increasing unsuccessful workflows. A defensible monitoring objective defines which errors matter, which requests enter the denominator, and how missing labels are handled before interpreting a trend.

## Intuition

[DERIVED] Use three linked ledgers. The outcome ledger records independently assessed task success and later corrections. The proxy ledger records cheaper signals such as user sentiment, refusal rate, retrieved-evidence coverage, or structured workload categories. The observation ledger records when and why each outcome becomes visible. A change in the proxy ledger is a diagnostic lead; it becomes evidence about task quality only through a validated relationship that remains appropriate for the deployed cohort.

```figure
{
  "id": "fig-47.6",
  "kind": "diagram",
  "title": "Outcome, proxy and observation ledgers",
  "caption": "A proxy alert triggers investigation while mature outcome labels retain independent provenance.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.8",
  "alt": "A proxy alert triggers investigation while mature outcome labels retain independent provenance. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "p",
        "kind": "state",
        "label": "prediction and release"
      },
      {
        "id": "x",
        "kind": "process",
        "label": "proxy extraction"
      },
      {
        "id": "l",
        "kind": "memory",
        "label": "delayed label ledger"
      },
      {
        "id": "o",
        "kind": "feedback",
        "label": "observation process"
      },
      {
        "id": "a",
        "kind": "branch",
        "label": "quality interpretation"
      }
    ],
    "edges": [
      {
        "from": "p",
        "to": "x",
        "kind": "flow"
      },
      {
        "from": "p",
        "to": "l",
        "kind": "flow"
      },
      {
        "from": "o",
        "to": "l",
        "kind": "flow"
      },
      {
        "from": "x",
        "to": "a",
        "kind": "flow"
      },
      {
        "from": "l",
        "to": "a",
        "kind": "flow"
      }
    ]
  }
}
```

[PAPER-REPORTED] ProxyDrift studies privacy-constrained monitoring using 21 proxy dimensions, aggregated distributions, a redundancy-adjusted alignment score, and synthetic query recovery. Raw inputs remain inside a compliance boundary; structured proxies support aggregate comparison and query generation. This architecture reduces raw-data movement but is not a differential-privacy guarantee. [R47.3, §§3–5]

## Formulation

[MATHEMATICALLY-DERIVED] Let $Y_i\in[0,1]$ be eventual loss, $X_i$ observed cohort information, and $R_i(d)$ indicate whether a label is available by age $d$. Under conditional missing-at-random observation,
$\Pr(R_i(d)=1\mid X_i,Y_i)=G(d\mid X_i)>0$, iterated expectation gives

$$
 \mathbb E\!\left[\frac{R_i(d)Y_i}{G(d\mid X_i)}\right]
 =\mathbb E\!\left[
   Y_i\frac{\mathbb E[R_i(d)\mid X_i,Y_i]}{G(d\mid X_i)}
  \right]=\mathbb E[Y_i].
$$

(Eq. 47.5)

[DERIVED] This identity is not a license to estimate unavailable labels using arbitrary weights. If severe errors induce faster complaints even after conditioning on recorded $X$, the premise fails. If a cohort never provides feedback, positivity fails. Estimating $G$ introduces additional uncertainty, and small $G$ inflates variance. Mature cohorts with fixed observation age are often easier to interpret than a heavily weighted, assumption-sensitive real-time estimate.

[MATHEMATICALLY-DERIVED] For a binary true failure with prevalence $p$, detector sensitivity $\alpha$, specificity $\beta$, and flagged fraction $q$, total probability yields

$$
 q=\alpha p+(1-\beta)(1-p),\qquad
 p=\frac{q+\beta-1}{\alpha+\beta-1}
 \quad\text{if }\alpha+\beta\ne1.
$$

(Eq. 47.6)

[DERIVED] Inversion is scientifically useful only with independently estimated, cohort-appropriate detector performance. Uncertain sensitivity/specificity must propagate to the estimate, and an empirical value outside $[0,1]$ can signal sampling error or model mismatch. A detector with $\alpha+\beta=1$ carries no prevalence information through its marginal flag rate. Language or template changes can change detector calibration even when true prevalence stays fixed.

[PAPER-REPORTED] ProxyDrift computes normalized square-root Jensen–Shannon distances between production and evaluation marginals, then normalizes each distance using a shuffled probability-mass baseline. Expert weights are discounted for redundancy estimated from mutual information. Its score is a marginal alignment statistic; the method's own independent-sampling comparison illustrates that marginal alignment does not establish joint realism. [R47.3, §4 and §7.1]

[MATHEMATICALLY-DERIVED] A strict counterexample is $P(00)=P(11)=1/2$ and $Q(01)=Q(10)=1/2$. Both binary marginals are Bernoulli $1/2$, so every marginal divergence is zero and any positive-weight average of perfect marginal alignment equals one. Yet

$$
 \operatorname{TV}(P,Q)=\frac12\sum_{x\in\{0,1\}^2}|P(x)-Q(x)|=1.
$$

(Eq. 47.7)

[DERIVED] Even perfect joint input alignment would not establish stable $P(Y\mid X)$: a changed model can fail on the same inputs. Equation 47.7 exposes a specific blind spot rather than invalidating all marginal monitoring. It motivates retaining selected joint summaries and outcome measurements, with the additional sampling and privacy costs they require.

[PAPER-REPORTED] More explicitly, for production/evaluation marginals $P_j,O_j$, the source uses $d_j=\sqrt{\operatorname{JSD}(P_j,O_j)/\log 2}$, with midpoint distribution in the two KL terms. A shuffled-mass baseline $b_j$ produces $a_j=\max(0,1-d_j/b_j)$. Dimensions are ordered by weighted entropy; overlap ratios $\rho_{ij}=I(X_i;X_j)/H(X_i)$ reduce weights through $g_i=\max(0,1-0.8\sum_{j\prec i}\rho_{ij})$, then alignment is $\sum_i g_iw_ia_i/\sum_i g_iw_i$. These definitions expose the zero-denominator cases discussed below. [R47.3, §4, Eqs. 1–4]

[DERIVED] The score's objective is evaluation-distribution alignment in a chosen representation. It is neither a proper scoring rule for answer correctness nor a bound on downstream loss. Expert weighting and redundancy discounting encode a judgment about coverage, not a theorem that correlated dimensions are unimportant for failures. A rare interaction can matter even when each marginal has little entropy.

## Mechanism

[DERIVED] Task outcomes should name the objective: a spreadsheet's formula correctness, a search answer's supported factual content, or completion of an authorized workflow. User edits can expose defects, but edits also encode preferences and changed requirements. Preserve the original output, correction reason, release, adjudicator, and whether the correction was solicited. Updating a label should create a provenance-bearing revision rather than silently rewriting the past.

[DERIVED] Separate coverage from conditional risk. Let $A_i$ indicate answering; report $\Pr(A=1)$, $\mathbb E[Y\mid A=1]$, and a workflow-level loss that accounts for abstention cost. Otherwise a system that refuses everything can appear perfectly accurate. Safety monitoring similarly separates attempted violations, successful harmful outcomes, detector flags, confirmed incidents, and exposure counts. Rare-event zero counts are informative only relative to the observation process.

[MATHEMATICALLY-DERIVED] Under independent identical Bernoulli detected-event trials with probability $p_{\rm det}$, observing zero events in $n$ trials gives the one-sided exact bound $p_{\rm det}\le1-\delta^{1/n}$ at confidence $1-\delta$, because $(1-p_{\rm det})^n=\delta$ at the boundary. It bounds detected events, not all harmful outcomes when detection is incomplete. Dependence or adaptive cohort selection removes the stated binomial guarantee.

```figure
{
  "id": "fig-47.7",
  "kind": "calculator",
  "title": "Zero detected events still permit risk",
  "caption": "Exact one-sided bound for independent identical detected-event trials; incomplete detection needs separate analysis.",
  "placement": "rail",
  "anchor": "mechanism",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-47.8",
  "alt": "Exact one-sided bound for independent identical detected-event trials; incomplete detection needs separate analysis. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "tex": "p_{\\rm det}\\le1-\\delta^{1/n}",
    "inputs": [
      {
        "symbol": "n",
        "label": "independent trials",
        "default": 1000,
        "min": 1,
        "max": 1000000,
        "format": "integer"
      },
      {
        "symbol": "d",
        "label": "tail probability",
        "default": 0.05,
        "min": 0.001,
        "max": 0.2,
        "format": "ratio"
      }
    ],
    "outputs": [
      {
        "symbol": "p",
        "label": "detected-event upper bound",
        "formula": "1-d^(1/n)",
        "format": "ratio",
        "emphasis": true
      }
    ]
  }
}
```

## Algorithm

### Algorithm 47.2 — Fixed-age quality observation

[DERIVED] Algorithm 47.2 joins delayed observations without treating absence as success. Inputs are finite prediction cohort $C$, label revisions $L$ with arrival times, cutoff $t$, fixed observation age $d$, and a predeclared outcome/proxy schema. Initialize ledger $J$ with unknown outcomes. Outputs are fixed-age cohort estimates, coverage/missingness reports, later revisions and proxy alerts.

$$
\begin{aligned}
1.\;&\text{Visit each }\ell\in L\text{ once; reject unmatched identity or invalid provenance;}\\
 &\text{otherwise append revision and arrival time, preserving previous adjudications}.\\
2.\;&M\leftarrow\{i\in C:t-t_i\ge d\};\
 U\leftarrow\{i\in M:\text{no admissible label available by }t_i+d\}.\\
3.\;&M=\varnothing\Rightarrow\text{return insufficient maturity, not a quality estimate}.\\
4.\;&\text{Freeze each outcome using only labels available at exactly age }d;\\
 &\text{report later revisions separately, along with }|M|,|U|,\text{ coverage and cohort composition}.\\
5.\;&\text{Use Eq. 47.5 only if assumptions and positivity are justified at age }d;\\
 &\text{otherwise report labeled-subset quantities and missingness bounds}.\\
6.\;&\text{Compare frozen proxy definitions; return ledger, uncertainty and diagnostic alerts}.
\end{aligned}
$$

(Eq. 47.8)

[DERIVED] The invariant is that unknown, abstained, corrected and confirmed-failure states remain distinct. The finite cohort bounds computation. Label revisions after age $d$ cannot enter the fixed-age estimator; they update a separately named mature/revised estimand. An unavailable label service produces an observation failure, not an automatically healthy deployment.

## Implementation

[DERIVED] AI_REFERENCE_STACK §1 **#13 Microsoft Research / Microsoft AI** routes the ProxyDrift primary paper; §4 **#41 vLLM**, layer **Inference engine**, supplies request/release identities, not task truth. The quality ledger and privacy-constrained proxy service sit outside the catalog's execution-engine entries. Their classifier, rubric, generator, and judge revisions must therefore be recorded explicitly rather than inferred from an engine version.

[PAPER-REPORTED] ProxyDrift uses bounded schema-repair attempts for structured proxy extraction. It builds a Chow–Liu-style maximum-spanning tree from pairwise mutual information and samples conditional proxy configurations before generating text. Finite-sample mutual-information dampening multiplies estimated pair information by a sigmoid of log effective count relative to category-pair cardinality. Conditional sampling mixes empirical child counts with a marginal prior using a chi-square-derived heuristic; sparse parent cells fall back toward the prior. These are practical modifications; classical optimal-tree results for unmodified empirical mutual information do not automatically prove optimality of this altered procedure. [R47.3, §§3.3 and 5]

[DERIVED] For $D$ categorical dimensions with at most $V$ categories, dense pair tables require $O(D^2V^2)$ storage and record updates can cost $O(D^2)$; sparse representations alter constants and missing-category behavior. A maximum-spanning tree over all pairs costs $O(D^2\log D)$ with sorting, while one conditional sample visits $O(D)$ nodes after tables exist. LLM classification and hydration add their own prompt/output tokens, model FLOPs, KV capacity, latency, and monetary charges; aggregate privacy does not make those costs disappear.

[DERIVED] Proxy dimensions with zero entropy or a zero shuffle baseline need explicit conventions. Exclude undefined redundancy ratios or treat a constant dimension separately; for zero baseline, report the distance and an undefined normalized score unless an agreed equality branch is specified. These are book-derived boundary guards, not claims that the paper implements them. Multi-valued dimensions also change pair-count normalization and require a declared sampling unit.

## Experimental design

### Methodology

[PAPER-REPORTED] ProxyDrift compares legacy, independent-proxy and conditional-proxy synthetic evaluations, performs proxy round-trip checks, tests human-versus-synthetic discrimination, and associates proxies with feedback. These are different estimands: alignment, classifier consistency, distinguishability, and outcome association. None alone establishes task correctness. [R47.3, §§6–7]

### Reported experiments

[PAPER-REPORTED] For an April 2026 production baseline, Table 1 reports alignment .284 for legacy evaluation, .897 for independent sampling and .917 for conditional sampling, with roughly 1,000 generated proxy configurations per synthetic condition. Table 3 reports round-trip divergence falling from .282 to .158 after refinement; nearby prose gives .291 for the starting mean. The discrepancy remains unresolved. Refinement on the same 450 cases does not establish held-out external accuracy. [R47.3, §§7.1–7.3]

[PAPER-REPORTED] The 200-query discriminator study reports .65 accuracy when guided by observed feature differences and .54 without that guidance. Failure to reject chance for the latter is not an equivalence test. The paper also contains conflicting satisfaction/prevalence descriptions across dataset and feedback subsections, and gives model-family wildcards instead of immutable classifier/generator revisions. These prevent stronger reproduction claims. [R47.3, §§6, 7.4–7.6 and GenAI usage]

## Observations

**What the paper claims.** [PAPER-REPORTED] Proxy representations can track production/evaluation mismatch and help construct evaluation queries without moving raw production text outside the designated boundary. [R47.3, §§3–5]

**What the evidence shows.** [PAPER-REPORTED] Reported alignment and round-trip consistency improve under the paper's classifiers and metrics; guided discrimination remains above chance, and selected downstream recovery cases are small. [R47.3, §7]

**What we infer.** [DERIVED] The method is useful for monitoring evaluation coverage. Its proxy alignment score should be paired with independent outcome adjudication and joint-distribution checks, especially after classifier or workload changes.

**What remains unknown.** [NOT-DISCLOSED] Exact model revisions, conflicting feedback denominators, transfer to unmeasured semantic dimensions, and stable calibration between alignment and task loss are unresolved in the inspected version.

## Failure modes

[DERIVED] Feedback selection can reverse an apparent release comparison. A safer model may receive complaints from users attempting prohibited tasks; an unusable model may receive no correction because users abandon it. Synthetic queries can match the same classifier that generated their proxies while omitting the production difficulty. Safety detectors can drift with language mix. Abstention, incomplete labels, and privacy suppression must remain visible rather than silently filtered.

## Siblings

[DERIVED] Fixed test suites give stable comparisons but age as workloads change. Production labels give relevant outcomes but arrive selectively. Proxy monitoring offers rapid coverage signals with imperfect semantics. Synthetic recovery can target discovered gaps, but validation on independent real or expertly constructed cases is needed to avoid evaluating a generator against its own representation.

```figure
{
  "id": "fig-47.8",
  "kind": "compare",
  "title": "Quality evidence has different selection mechanisms",
  "caption": "Each surface identifies a different quantity; agreement needs independent validation.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-47.5",
  "alt": "Each surface identifies a different quantity; agreement needs independent validation. Analytical structure or illustrative inputs, not a book-measured result.",
  "spec": {
    "axis": "Observed quantity and unresolved selection",
    "columns": [
      {
        "id": "m",
        "label": "Fixed evaluation"
      },
      {
        "id": "t",
        "label": "User feedback"
      },
      {
        "id": "p",
        "label": "Proxy drift"
      }
    ],
    "rows": [
      {
        "dimension": "Quantity",
        "values": {
          "m": "rubric loss on fixed set",
          "t": "outcome among responders",
          "p": "representation mismatch"
        }
      },
      {
        "dimension": "Selection",
        "values": {
          "m": "test construction",
          "t": "response and delay",
          "p": "schema and classifier"
        }
      },
      {
        "dimension": "Needed complement",
        "values": {
          "m": "current workload coverage",
          "t": "observation analysis",
          "p": "independent task labels"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The improvement lineage moves from aggregate feedback to cohort-aware delayed labels, then proxy distributions, and finally joint and outcome-sensitive auditing. The unresolved scientific question is whether a compact privacy-compatible representation preserves the failure modes that matter for deployment. Settling evidence requires independent task labels across shifts, a representation held fixed during assessment, and explicit tests of conditional and joint changes, rather than only higher self-alignment.

## Limitations

[DERIVED] Without assumptions on missing outcomes, population quality can be only partially identified. If observed loss is $s$ across $n$ labeled cases and $m$ unlabeled cases with loss in $[0,1]$, for $n+m>0$, the full-cohort mean lies in $[s/(n+m),(s+m)/(n+m)]$. This honest bound may be wide; narrowing it requires additional labels or defensible assumptions rather than a more elaborate dashboard.

## Reproducibility

[UNVERIFIED] No classifier or production quality analysis was executed here. Reproduction needs the proxy schema, category mapping, expert weights, missingness conventions, all classifier/generator/judge revisions, label-age policy, adjudication records, cohort denominators, and privacy transformations. Proposed delayed-label and proxy counterexample checks are confined to [verification](verification.md).

## References

[DERIVED] [R47.3, ProxyDrift](https://arxiv.org/html/2608.08245v1), §§3–7 and Appendix C, is the 2026 primary method and evaluation. Its source-specific ambiguities and the access record are preserved in [references](references.md).
