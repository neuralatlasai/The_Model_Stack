---
id: ms.section.51.2
entity_type: section
title: "Routing and selection"
volume: 3
part: 9
chapter: 51
section: 51.2
slug: 51-2-routing-and-selection
parent: ms.chapter.51
prev_sibling: ms.section.51.1
next_sibling: ms.section.51.3
children: []
prerequisites: [ms.chapter.10, ms.chapter.11, ms.chapter.37, ms.chapter.46, ms.chapter.47, ms.chapter.50]
downstream: [ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [tool_use, typed_interfaces, authorization], feedback_setting: [], modality: [text]}
papers: [P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 51.2 Routing and selection

## Scope

[DERIVED] Tool routing maps a task and current observations to a bounded set of eligible operations, then selects an operation or declines to act. It includes discovery, retrieval, constrained selection and argument grounding. The baseline inserts an entire catalog into the model context and accepts the highest-scoring call. Success means selecting a supported operation with justified arguments while preserving authorization, ambiguity and resource limits.

[DERIVED] A route is not a plan. Chapter 52 owns long-horizon controller policies; here the selected action crosses the contract defined in §51.1. A route also differs from an HTTP destination: network dispatch follows a resolved server-qualified identity and must not be inferred from untrusted natural-language descriptions.

## Why this exists

[DERIVED] Large catalogs consume context and introduce near-duplicate operations. Adding tools can improve nominal capability while worsening selection: an operation with a persuasive description can displace the relevant one, a stale tool can occupy a retrieval slot, and a powerful tool can be selected for a task supported by a narrower operation. The engineering question is which information should reach the decision maker and which choices remain admissible.

[DERIVED] Tool retrieval has a stricter consequence than document retrieval. A missed document may reduce answer evidence; a missed required operation can make a task impossible within the selected set. A retrieved but unauthorized operation must remain unavailable for execution even if its description is semantically relevant. Quality metrics that ignore this distinction can reward a router for finding capabilities the caller cannot use.

[OFFICIAL-DOCUMENTATION] Modern MCP discovery and tool listing expose currently available features; the tool set can vary with request authorization, and names alone are not globally unique [R51.1, Capabilities/Tool Names; R51.7, Discovery]. Cached catalog identity therefore needs more than a display name.

## Intuition

[DERIVED] Use a sequence of decreasing uncertainty. Discovery establishes what the server says it offers. Eligibility filters what the application is prepared to expose under the verified principal and policy. Retrieval reduces the semantic search space. Selection chooses among remaining operations, and grounding resolves concrete arguments against task evidence and authoritative lookups. Validation then checks the proposed call; none of the earlier stages bypasses it.

[DERIVED] Unsupported requests are a normal output class. An empty eligible set means something different from an ambiguous top pair. A high retrieval score means similarity under a representation, not a probability of successful execution. A plausible argument means something different from an identifier returned by an authorized lookup. Keeping these distinctions produces more informative abstention than forcing every request into a tool name.

## Formulation

[DERIVED] Let $\mathcal T$ be the finite versioned catalog, $x$ the task, $h$ the current history and $p$ the verified principal. The eligibility set $\mathcal E(p,h)\subseteq\mathcal T$ is established by trusted application policy; it is not a model-generated authorization decision. A retriever constructs $\mathcal C_k(x,h)\subseteq\mathcal E$, and a selector proposes $(t,a)$ or $\bot$.

[MATHEMATICALLY-DERIVED] If execution is restricted to $\mathcal C_k$ and cannot expand it, let $\Omega(x)$ be the exhaustive family of operation sets used by all valid solutions, including the empty set when no-tool completion is valid. Then
$$
\Pr(\mathrm{success})\le
\Pr\!\left(\exists\omega\in\Omega(x):\omega\subseteq\mathcal C_k\right).

$$
*(Eq. 51.3)*
The event is solution coverage, not ordinary recall of one annotated path. Multiple equivalent APIs can make a reference-path recall metric underestimate coverage; unavailable semantic prerequisites can make name recall overestimate it. The bound does not apply unchanged to a controller that later retrieves additional tools.

[DERIVED] A generic contrastive retriever can train embeddings $f_\phi(x),g_\phi(t)$ with score $s_\phi$ and positive tool $t^+$:
$$
\mathcal L_{\rm ret}=-\log
\frac{\exp(s_\phi(x,t^+)/\tau_{\rm ret})}
{\sum_{t\in\mathcal N_x}\exp(s_\phi(x,t)/\tau_{\rm ret})},\quad \tau_{\rm ret}>0.

$$
*(Eq. 51.4)*
Here $\mathcal N_x$ is a finite training candidate set including the positive. This book formulation illustrates supervision and negative sampling; it is not a claim that every tool retriever uses this exact loss. Equivalent tools mislabeled negative and absent unsupported-task examples can distort calibration.

[MATHEMATICALLY-DERIVED] For an illustrative binary decision, let a correctly completed action earn $u_+>0$, a wrong action incur loss $u_-\ge0$, execution cost $c_{\rm exec}\ge0$, and abstention utility be zero. If $q$ is a calibrated conditional correctness probability, action has positive expected utility only when
$$
qu_+-(1-q)u_--c_{\rm exec}>0
\ \Longleftrightarrow\ q>\frac{u_-+c_{\rm exec}}{u_++u_-}.

$$
*(Eq. 51.5)*
If $c_{\rm exec}\ge u_+$, no $q\le1$ yields strictly positive utility. This is a decision example, not permission to price away mandatory authorization or policy constraints.



```figure
{
  "id": "fig-51.6",
  "kind": "calculator",
  "title": "Illustrative action threshold",
  "caption": "Illustrative utility units with calibrated correctness probability. A threshold at or above one admits no strictly positive-utility action; mandatory policy is separate.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-51.5",
  "alt": "Illustrative utility units with calibrated correctness probability. A threshold at or above one admits no strictly positive-utility action; mandatory policy is separate.",
  "spec": {
    "tex": "q_{\\rm min}=(u_-+c_{\\rm exec})/(u_++u_-)",
    "equation": "51.5",
    "inputs": [
      {
        "symbol": "gain",
        "label": "Correct-action utility",
        "default": 1,
        "min": 0.01,
        "max": 100,
        "format": "fixed3"
      },
      {
        "symbol": "loss",
        "label": "Wrong-action loss",
        "default": 9,
        "min": 0,
        "max": 100,
        "format": "fixed3"
      },
      {
        "symbol": "cost",
        "label": "Execution cost",
        "default": 0.1,
        "min": 0,
        "max": 100,
        "format": "fixed3"
      }
    ],
    "outputs": [
      {
        "symbol": "result",
        "label": "Strict utility threshold",
        "formula": "(loss+cost)/(gain+loss)",
        "format": "fixed3"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Discovery first records qualified operation identities, schema revisions, credential-dependent visibility and expiry. Trusted policy then removes prohibited tool classes and unsupported argument domains before semantic ranking. Filtering solely after a top-k search can yield an empty result despite eligible candidates outside that top-k; either retrieve within the eligible index or replenish under a bounded search policy.

[DERIVED] Retrieval uses task intent, already known facts and unresolved prerequisites. Descriptions need enough semantic detail to distinguish “search customers” from “export all customers”, but should not become a channel that can alter trusted selection policy. The retriever may combine lexical identifiers with dense representations; their errors differ. Exact identifiers are valuable when present, while paraphrase similarity helps natural-language intent. Neither establishes whether a resource exists.

[DERIVED] Selection receives a bounded catalog plus a no-tool option and explicit unsupported/ambiguity handling. Constrained decoding can restrict tool-name and argument syntax, yet grounding remains evidential: map each argument to user input, trusted tool observation or deterministic conversion. Resolve ambiguous entity names through authorized lookup or clarification. Do not invent missing required arguments to satisfy the grammar.

[DERIVED] After selection, re-resolve registry identity and revalidate schema/policy. Catalog updates, revoked credentials or resource changes may occur between retrieval and dispatch. Negative results need typed causes so the controller can refresh stale metadata, gather information or stop. A denied operation should not trigger unbounded search for an equivalent privileged route.

[DERIVED] **Cost.** Brute-force dense scoring for $m$ tools of embedding dimension $d_r$ costs $O(md_r)$ arithmetic and $O(md_r)$ stored embedding values; approximate indexing exchanges search work for recall and index complexity. Cross-encoding $k$ descriptions requires $k$ model evaluations unless batched, with actual token work depending on their lengths. Context cost grows with the sum of selected schema/description tokens. Grounding lookups add latency, network bytes and potential privacy exposure; classify their side effects as well.

[PAPER-REPORTED] ToolLLM constructs API-linked instructions and solution traces, trains a neural API retriever, and supplies retrieved APIs to ToolLLaMA [R51.6, §§2–3]. Its Table 2 compares retrieval against BM25 and Ada embeddings. The study establishes a historical retrieval-plus-execution approach; its live API and synthetic instruction distribution do not establish current catalog coverage.

[DERIVED] The practical lesson is to evaluate the composed path. Retrieval quality can improve while accepted outcomes decline because argument grounding, policy checks or backend reliability dominate. Conversely, a smaller eligible catalog can improve accepted actions while reducing raw recall against an unrestricted reference catalog. Report both the conditioned retrieval population and the end-to-end task population.



```figure
{
  "id": "fig-51.7",
  "kind": "diagram",
  "title": "Eligible routing",
  "caption": "Discovery, eligibility and retrieval precede grounded selection; unsupported or ambiguous routes remain explicit.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.5",
  "alt": "The catalog passes trusted eligibility and bounded retrieval into a selection gate. A supported choice produces a grounded proposal; ambiguity or no eligible tool terminates in abstention or clarification without dispatch.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "dataset",
        "label": "Versioned catalog"
      },
      {
        "id": "p",
        "kind": "boundary",
        "label": "Trusted eligibility"
      },
      {
        "id": "g",
        "kind": "process",
        "label": "Bounded retrieval"
      },
      {
        "id": "e",
        "kind": "branch",
        "label": "Supported clear selection?"
      },
      {
        "id": "o",
        "kind": "state",
        "label": "Grounded proposal"
      },
      {
        "id": "stop",
        "kind": "state",
        "label": "Abstain / clarify, no dispatch"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "p"
      },
      {
        "from": "p",
        "to": "g"
      },
      {
        "from": "g",
        "to": "e"
      },
      {
        "from": "e",
        "to": "o",
        "label": "yes"
      },
      {
        "from": "e",
        "to": "stop",
        "label": "no / ambiguous"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 51.2 — Bounded eligible routing with explicit abstention.** [DERIVED] Inputs are task/history, verified principal, finite versioned catalog, integer maximum candidates $k\ge1$, integer refresh budget $k_{\rm ref}\ge0$ and absolute deadline. Output is a validated action proposal or a typed unsupported/ambiguous outcome. Initialize $j=0$ once before the following loop.

$$
\begin{aligned}
1.&\quad \mathcal E\leftarrow
\operatorname{TrustedEligibility}(p,\mathcal T,h).\\
2.&\quad \mathcal E=\varnothing\Rightarrow
\operatorname{Return}(\mathrm{unsupported});\quad
\mathcal C\leftarrow\operatorname{Retrieve}_{\le k}(x,h,\mathcal E);\quad \mathcal C=\varnothing\Rightarrow\operatorname{Return}(\mathrm{unsupported}).\\
3.&\quad (t,a,\pi)\leftarrow\operatorname{SelectOrAbstain}(\mathcal C,x,h);
\quad t=\bot\Rightarrow\operatorname{Return}(\mathrm{unsupported/ambiguous}).\\
4.&\quad \operatorname{UngroundedRequiredArgument}(a,\pi)\Rightarrow
\operatorname{Return}(\mathrm{needs\ information}).\\
5.&\quad z\leftarrow\operatorname{ContractGate}_{51.1}(\iota_t,v_t,a,\pi,p);
\quad z=\mathrm{accepted}\Rightarrow\operatorname{Return}(z).\\
6.&\quad z=\mathrm{stale}\land j<k_{\rm ref}\land\operatorname{BeforeDeadline}
\Rightarrow j\leftarrow j+1;\,\operatorname{RefreshCatalog};\,\operatorname{GoTo}(1).\\
7.&\quad \operatorname{Return}(z,\mathrm{no\ execution}).
\end{aligned}
$$

[DERIVED] Invariants are selection within trusted eligibility, preserved argument provenance, no execution by this routing procedure and at most $k_{\rm ref}$ refreshes. A schema/authority denial is terminal for this proposal. Each model/lookup step has byte/token/time bounds; absence of a result by deadline terminates instead of silently extending the search.

## Implementation

[OFFICIAL-DOCUMENTATION] MCP tools/list supports pagination and caching, and a declared list-change capability connects to subscriptions [R51.1, Listing Tools/List Changed Notification]. A finite client must cap pages and bytes while retaining the fact that an incomplete listing is incomplete. Server-reported identity is display/debug information, not a verified security identity [R51.7, DiscoverResult].

[DERIVED] Index records should include authenticated endpoint identity, contract hash, authorization visibility partition and invalidation information. Separate per-principal private catalogs from globally reusable public descriptions. A catalog embedding can leak operation or resource names; applying access control only at final execution may still disclose information through retrieval results or logs.

[DERIVED] Rank explanations should identify relevant capabilities and unresolved facts without exposing hidden credentials. An unsupported request can be answered with available alternatives only when those alternatives are within the same authorized scope. Adapters that fabricate a tool result from cached documentation hide backend failures and destroy outcome provenance.

## Experimental design

### Reported experiments

[PAPER-REPORTED] ToolLLM's preliminary reasoning comparison uses 1,000 instructions per scenario type and compares DFSDT with ReAct and a call-budget-matched ReAct@N baseline [R51.6, §3.2/Table 3]. This controls one important resource axis but relies on its ToolEval evaluation and historical API environment. It is not an authorization or durable side-effect test.

[PAPER-REPORTED] τ²-bench's no-user and oracle-plan ablations distinguish direct tool control from communicating a plan to another actor [R51.8, §4.2]. Those interventions change available observations/control as well as execution path; they should not be interpreted as a clean measurement of a router alone.

## Observations

**What the paper claims.** [PAPER-REPORTED] ToolLLM retrieves candidate APIs for a tool-using model [R51.6, §§2–3].

**What the evidence shows.** [PAPER-REPORTED] ToolLLM reports retrieval and reasoning comparisons under its generated tasks [R51.6, Tables 2–3]. [OFFICIAL-DOCUMENTATION] Modern discovery specifies interfaces without routing accuracy [R51.7].

**What we infer.** [DERIVED] End-to-end routing needs separate coverage, grounded-argument and acceptance metrics.

**What remains unknown.** [UNVERIFIED] No inspected study here establishes calibrated abstention or authorized solution coverage for a production catalog in October 2026.



```figure
{
  "id": "fig-51.8",
  "kind": "stat-panel",
  "title": "Contract boundary to retain",
  "caption": "These distinctions constrain claims; they are not measured deployment results.",
  "placement": "rail",
  "anchor": "observations",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.5",
  "alt": "Four relevant execution boundaries remain explicit.",
  "spec": {
    "header": "EXECUTION CONTRACT",
    "rows": [
      {
        "key": "catalog",
        "value": "Version and visibility partition"
      },
      {
        "key": "coverage",
        "value": "All valid solution alternatives"
      },
      {
        "key": "grounding",
        "value": "Argument provenance retained"
      },
      {
        "key": "abstain",
        "value": "Unsupported is a normal outcome"
      }
    ]
  }
}
```

## Failure modes

[DERIVED] Retrieval miss produces an apparently unsupported task; detect it with an eligible oracle catalog and alternative-path annotations. Description collision produces a high-scoring wrong operation; retain qualified identity and adversarially similar names. Argument hallucination produces valid identifiers with no evidential source; require provenance. Visibility leakage exposes private catalog entries before execution; enforce retrieval-time policy. Unbounded refresh loops convert backend drift into cost exhaustion; cap and report them.

## Siblings

[DERIVED] Full-catalog prompting, lexical retrieval, dense retrieval and hierarchical dispatch differ in context cost, coverage and update behavior. Compare them at equal eligible catalogs, task sets and total model/lookup budget. Chapter 49 owns general retrieval representations; this section owns their operation-selection consequences. Chapter 52 owns adaptive plan expansion; §51.6 addresses adversarial catalog/result content.

## Extensions

### Improvements

[DERIVED] Successor designs can add unsupported-task training, equivalent-operation labels and state-aware grounding to retrieval. The changed mechanisms are supervision and execution evidence; no measured superiority is asserted without a matched comparison. The 2026 request-scoped capability model also requires refreshing assumptions at each invocation rather than treating prior discovery as permanent entitlement.

[DERIVED] An unresolved question is how to estimate solution-set coverage when multiple tool sequences are valid and live capabilities change. Settling evidence requires held-out catalogs, independent task validators, version drift and explicit exposure costs. Static top-k name recall cannot resolve it.

## Limitations

[DERIVED] Eq. 51.3 assumes fixed candidate confinement; Eq. 51.5 assumes a calibrated probability and simplified utilities. Mandatory policy constraints precede utility. Catalog retrieval may be inappropriate for tiny fixed workflows, and its overhead can exceed the value of semantic flexibility. Source-reported live APIs can disappear, so historical benchmark scores do not imply current availability.

## Reproducibility

[UNVERIFIED] Required artifacts are catalog snapshots, visibility policy, retrieval index/build, task split, equivalent-solution labels, selection prompts, grounding provenance, budgets and complete denied/unsupported outcomes. No router was trained or run. Proposed checks remain in verification.md.

## References

[PAPER-REPORTED] [R51.6](references.md#r51-6) ToolLLM; [R51.8](references.md#r51-8) τ²-bench. [OFFICIAL-DOCUMENTATION] [R51.1](references.md#r51-1) Tools; [R51.7](references.md#r51-7) Discovery. Accessed 2026-10-14.
