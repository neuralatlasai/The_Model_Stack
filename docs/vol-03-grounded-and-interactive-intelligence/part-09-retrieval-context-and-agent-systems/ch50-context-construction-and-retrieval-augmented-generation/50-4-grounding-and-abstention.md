---
id: "ms.section.50.4"
entity_type: "section"
title: "50.4 — Grounding and abstention"
volume: 3
part: 9
chapter: 50
section: 50.4
slug: "50-4-grounding-and-abstention"
parent: "ms.chapter.50"
prev_sibling: "ms.section.50.3"
next_sibling: "ms.section.50.5"
children: []
prerequisites: ["ms.chapter.10","ms.chapter.15","ms.chapter.37","ms.chapter.38","ms.chapter.49"]
downstream: ["ms.chapter.51","ms.chapter.52","ms.chapter.53","ms.chapter.54"]
related: []
relations: []
axes: {"lifecycle":["inference"],"mechanism":["retrieval","context_construction","grounding"],"feedback_setting":[],"modality":["text"]}
papers: ["P40","P50"]
implementations: ["impl.pytorch","impl.hugging-face-transformers","impl.vllm"]
benchmarks: []
datasets: []
status: {"maturity":"active","disputed":false}
evidence_summary: {"labels_used":["MATHEMATICALLY-DERIVED","DERIVED","PAPER-REPORTED","OFFICIAL-DOCUMENTATION","NOT-DISCLOSED","UNVERIFIED"],"empirically_observed":false}
word_count_target: 2000
updated_at: "2026-10-14"
editorial_status: "manuscript_draft"
---

# 50.4 — Grounding and abstention

## Scope

[DERIVED] Grounding asks whether claims are supported by identified evidence under a declared source and task contract. Abstention controls which requests the system answers when evidence or verification is insufficient. We separate answer correctness, claim support, citation identity, source authority and confidence calibration. None of these properties follows automatically from retrieving a relevant passage.

## Why this exists

[DERIVED] A correct answer can cite an unrelated source. A valid source marker can point to a passage that contradicts the claim. A faithfully quoted passage can be outdated or false. A confident model can ignore evidence and answer from parametric knowledge. These are different failures and require different tests; combining them into one “groundedness” score makes localization and decision-making difficult.

[DERIVED] Refusal creates another ambiguity. Blocking unsupported answers can improve conditional precision while reducing answer coverage. A system that refuses every question has no unsupported answered claims but fails the information task. The operational objective therefore includes the value of a correct answer, harm from an incorrect answer, and the cost of abstention, with independent evidence about which requests are answerable from the permitted corpus.

## Intuition

[DERIVED] Verify a graph from atomic claims to source spans. A citation marker first resolves to an authorized immutable source. A support test then assesses the claim against that source or a necessary combination of sources. A separate task check asks whether the answer is correct and complete. Finally, an answer/abstain policy uses calibrated outcome evidence rather than treating token likelihood or a self-issued “supported” label as truth.

```figure
{
  "id": "fig-50.12",
  "kind": "diagram",
  "title": "Support and truth are separate checks",
  "caption": "Claims first resolve source identities, then support and conflict judgments; a calibrated policy chooses answer or abstention.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-50.17",
  "alt": "Claims first resolve source identities, then support and conflict judgments; a calibrated policy chooses answer or abstention. Analytical structure, not a measured result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "c",
        "kind": "state",
        "label": "candidate claims"
      },
      {
        "id": "i",
        "kind": "process",
        "label": "authorized source mapping"
      },
      {
        "id": "s",
        "kind": "branch",
        "label": "support / conflict / unknown"
      },
      {
        "id": "q",
        "kind": "process",
        "label": "task and coverage checks"
      },
      {
        "id": "a",
        "kind": "branch",
        "label": "answer / partial / abstain"
      }
    ],
    "edges": [
      {
        "from": "c",
        "to": "i",
        "kind": "flow"
      },
      {
        "from": "i",
        "to": "s",
        "kind": "flow"
      },
      {
        "from": "s",
        "to": "q",
        "kind": "flow"
      },
      {
        "from": "q",
        "to": "a",
        "kind": "flow"
      }
    ]
  }
}
```

[PAPER-REPORTED] ALCE evaluates correctness separately from citation recall and precision. Its citation recall checks whether cited passages jointly support each statement; precision also tests irrelevant citations while allowing individually supporting redundant references. These are source-support metrics, not proof that the sources describe the world correctly. [R50.4, §3.3]

## Formulation

[DERIVED] For claim $c$, cited set $D_c$, corpus snapshot $\mathcal D$, and support predicate $\phi$, define distinct predicates:
$$
 I(c)=\mathbf1[D_c\subseteq\mathcal D\text{ and all identities/revisions resolve}],\qquad
 S(c)=I(c)\,\phi(D_c,c),\qquad
 T(c)=\mathbf1[c\text{ is correct under the task's truth criterion}].
$$

(Eq. 50.13)

[DERIVED] $I$ does not imply $S$, and $S$ does not imply $T$. The support predicate may be an expert adjudication, a formal check, or a learned verifier with measured error. A source's publication date and authority also belong to the task criterion; an old authoritative record can be more relevant than a new untrusted assertion.

[DERIVED] With statements $c_1,\ldots,c_n$ and nonempty cited sets, a reconstruction of ALCE's support recall averages $\phi(D_i,c_i)$ over statements. For a citation $d\in D_i$, precision credit requires joint support and either individual support or loss of joint support when $d$ is removed. Formally,
$$
 R_{\rm cite}=\frac1n\sum_i\mathbf1[D_i\ne\varnothing]\phi(D_i,c_i),
 \quad
 P_{i,d}=\phi(D_i,c_i)
 \mathbf1\!\left[\phi(\{d\},c_i)=1\ \lor\
                    \phi(D_i\setminus\{d\},c_i)=0\right].
$$

(Eq. 50.14)

[DERIVED] Precision is averaged over the declared citation units, with empty-output/zero-citation handling stated explicitly. Sentence segmentation can bundle several atomic claims, so a sentence-level score can hide a partially supported clause. A learned $\phi$ also adds classification error and length limits. These formulas describe attributable support under an evaluator, not a mathematical guarantee of factuality.

[MATHEMATICALLY-DERIVED] Let $A_\tau=\mathbf1[s(X)\ge\tau]$ be a frozen score-based answer policy, $Y\in\{0,1\}$ its error, coverage $C_\tau=\Pr(A_\tau=1)$ and selective risk $R_\tau=\mathbb E[Y\mid A_\tau=1]$ when $C_\tau>0$. With fixed abstention cost $c_a$,
$$
 \mathbb E[L_\tau]=C_\tau R_\tau+(1-C_\tau)c_a .
$$

(Eq. 50.15)

[DERIVED] Conditional risk alone omits unanswered requests. If answerability varies by cohort, report coverage and risk for those cohorts as well. A verifier's score can rank difficult requests usefully while its numerical values remain uncalibrated; conversely average calibration need not provide low risk in every selected subgroup.

[MATHEMATICALLY-DERIVED] For $n\ge1$ statements when recall is reported and a nonempty citation-unit denominator when precision is reported, Eq. 50.14 applies; otherwise report the corresponding metric as undefined or follow a separately disclosed convention.

[MATHEMATICALLY-DERIVED] For $M$ thresholds fixed independently of an iid calibration set, a frozen model/verifier, $n_j>0$ accepted calibration cases and error fraction $\widehat R_j$, Hoeffding and a union bound give simultaneous upper bounds
$$
 U_j=\min\!\left(1,\widehat R_j+
       \sqrt{\frac{\log(M/\delta)}{2n_j}}\right),\qquad
 \Pr(\forall j\text{ with }n_j>0:R_j\le U_j)\ge1-\delta .
$$

(Eq. 50.16)

[DERIVED] Conditional on each accepted sample count, accepted outcomes have the policy's conditional distribution under iid sampling; this justifies the individual bound. One may select a threshold with $U_j\le r_{\max}$ after inspecting this finite family. Set $U_j=1$ for $n_j=0$ and mark that threshold uncertified; its conditional risk need not even be defined when population coverage is zero. Training/tuning on calibration labels, arbitrary threshold searches, conversation dependence, delayed selective labels or deployment shift invalidate the simple guarantee. Exchangeability-based methods require their own stated construction; confidence language alone is insufficient.

## Mechanism

[DERIVED] Claim extraction must preserve scope: entities, quantities, units, valid times, modality and negation. “The study found no significant improvement” is not equivalent to “the method has no effect.” A claim about all settings cannot be supported by one positive experiment. Linking an answer clause to a paragraph is a useful starting point, but the verifier must assess the exact asserted proposition and necessary qualifiers.

[DERIVED] Multiple sources can jointly support a claim through explicit reasoning. A numerical result may require two source values and a calculation; store the operation and units along with source spans. Conflict resolution instead needs an authority/valid-time policy. Do not average contradictory assertions into a fabricated consensus. When authority or current state is unknown, expose the conflict or abstain rather than promoting the latest ingestion timestamp to truth.

[PAPER-REPORTED] CiteGuard's disclosed validator combines a valid retrieved-source ID with lexical overlap at least .10 or embedding cosine at least .40, then allows one regeneration. These thresholds are implementation choices. They do not implement logical entailment. [R50.9, §2.6]

[DERIVED] A counterexample is evidence “The treatment did not improve survival” and claim “The treatment improved survival.” Most normalized words overlap, yet the claim reverses the result. Embedding similarity can likewise remain high. A validator built from these tests can accept contradiction even with a correct citation ID. This is a logical failure possibility, not a claim that the inspected experiments contain this exact example.

```figure
{
  "id": "fig-50.13",
  "kind": "calculator",
  "title": "Finite-family selective-risk bound",
  "caption": "Illustrative iid calibration with thresholds fixed independently; empty accepted sets are uncertified.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-50.16",
  "alt": "Illustrative iid calibration with thresholds fixed independently; empty accepted sets are uncertified. Illustrative analytical result, not book-measured performance.",
  "spec": {
    "tex": "U=\\min(1,r+\\sqrt{\\log(M/\\delta)/(2n)})",
    "inputs": [
      {
        "symbol": "n",
        "label": "accepted calibration cases",
        "default": 400,
        "min": 1,
        "max": 1000000,
        "format": "integer"
      },
      {
        "symbol": "r",
        "label": "observed error fraction",
        "default": 0.05,
        "min": 0,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "m",
        "label": "fixed thresholds",
        "default": 10,
        "min": 1,
        "max": 10000,
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
        "symbol": "u",
        "label": "selective-risk upper bound",
        "formula": "min(1,r+sqrt(ln(m/d)/(2*n)))",
        "format": "ratio",
        "emphasis": true
      }
    ]
  }
}
```

[DERIVED] Missing evidence has several states: no candidate retrieved, candidate omitted by budgeting, source accessible but silent, conflicting sources, or verifier uncertainty. A corpus-bounded refusal means the permitted evidence does not justify the requested answer. It does not establish the fact is unknowable or false. Partial answers should identify which clauses are supported and which remain unresolved under the same provenance contract.

## Algorithm

### Algorithm 50.4 — Grounding validation and abstention

[DERIVED] Algorithm 50.4 validates a private candidate under a finite claim/reference cap, verifier budget $B$, deadline $D$ and at most one authorized regeneration. Initialize durable remaining budget $B_{\rm rem}=B$, all claims unknown and final answer unpublished. Outputs are accepted answer, explicitly qualified partial answer, or abstention with reason.

$$
\begin{aligned}
1.\;&\text{Parse claims/markers; malformed or over-cap}\Rightarrow\text{go to step 5 with named defect};\\
 &\text{empty factual answer}\Rightarrow\text{return explicit abstention}.\\
2.\;&\text{For each claim once, resolve authorized source revisions;}\\
 &\text{invalid citation}\Rightarrow\text{mark unsupported; continue}.\\
3.\;&\text{Let }c\text{ cap a feasible verification including cleanup};\\
 &\text{infeasible, deadline expired or }c>B_{\rm rem}
 \Rightarrow\text{mark unknown; continue};\\
 &B_{\rm rem}\leftarrow B_{\rm rem}-c;\
 \text{execute once with timeout and retain support/conflict evidence};\\
 &\text{reconcile actual }\widetilde c\le c:
 B_{\rm rem}\leftarrow B_{\rm rem}+c-\widetilde c.\\
4.\;&\text{All required claims supported and task/coverage contract passes}
 \Rightarrow\text{publish plus provenance; return}.\\
5.\;&\text{If one regeneration remains and capped generation plus revalidation fit }B_{\rm rem},D,\\
 &\text{reserve only generation now; revise with timeout and reconcile its actual cost};\\
 &\text{reset new candidate claims to unknown, retaining the same }B_{\rm rem};\\
 &\text{validate once via steps 1--4, reserving each check in step 3; regeneration is disabled}.\\
6.\;&\text{Otherwise return supported partial answer only under an explicit partial contract, or abstain}.
\end{aligned}
$$

(Eq. 50.17)

[DERIVED] The invariant is that only supported claims satisfying the final task contract are published as verified. A partial-answer contract can publish supported subsets with explicit omissions; it cannot quietly remove the question's essential dependency and claim success. Regeneration uses feedback as a diagnostic request, while the evidence remains authoritative. Unknown verifier output is a failure to verify, not a negative proof about the source.

## Implementation

[OFFICIAL-DOCUMENTATION] ALCE's inspected evaluator uses NLI checks for joint cited passages and individual/removal tests for precision, with sentence/list segmentation and per-answer averaging. It skips empty outputs in that code path, making empty-output accounting an important external evaluation decision. The mutable branch source was inspected without execution. [R50.14, compute_autoais and _run_nli_autoais]

[DERIVED] AI_REFERENCE_STACK §4 **#26 Hugging Face Transformers**, layer **Model definition / adaptation**, supplies NLI/generator model interfaces; **#17 PyTorch**, layer **Model / autograd framework**, supplies their operators. The source-support graph, calibration procedure and answer policy are additional evaluation/control components. A shared generator/verifier family can share errors even when they are separate processes.

[DERIVED] With $n$ statements and at most $k$ citations each, joint support requires $O(n)$ verifier calls; individual/removal checks can add $O(nk)$ calls. Input lengths and model architecture determine FLOPs, so call count alone is not complete cost. Model parameters and weights include generator and verifier; memory includes each candidate, cited spans, verifier activations/KV and retained provenance.

[DERIVED] Communication includes evidence transfer and external evaluator calls; privacy and access constraints apply to those calls as well. Batching checks can improve throughput while increasing memory and waiting. Energy/money includes rejected candidates and regeneration, not only accepted answers. Selective policies can reduce total generation or increase it through verification; the net effect requires measured workload-specific accounting.

## Experimental design

### Methodology

[PAPER-REPORTED] CiteGuard uses 150 curated housing-law questions, 200 PrivacyQA and 50 CUAD examples; configurations are selected on the controlled set. Generator revisions and some metric denominators are underspecified. [R50.9, §§2.7–2.10 and 3.2]

### Reported experiments

[PAPER-REPORTED] Its CUAD stress test reports 100% citation validity, 36% evidence support and 54% answer accuracy. Controlled zero hallucinations means none detected by its operational validation criteria; it is not independent proof of zero errors. [R50.9, Table 11 and §4.3]

[PAPER-REPORTED] ALCE's human evaluation shows attribution remains incomplete: on ELI5, ChatGPT Vanilla has human citation recall 50.8 and precision 52.4, while its automatic evaluator gives 52.8 and 50.4. Agreement on this protocol supports evaluator usefulness, not perfect detection or transfer to 2026 model/task distributions. [R50.4, §6, Table 9]

## Observations

**What the paper claims.** [PAPER-REPORTED] CiteGuard uses runtime checks to accept, regenerate or refuse. [R50.9, §2]

**What the evidence shows.** [PAPER-REPORTED] Valid source IDs coexist with substantial support/answer failures under domain shift; ALCE's independent human checks show incomplete citation coverage. [R50.9, Table 11; R50.4, §6]

**What we infer.** [DERIVED] Citation identity, support and task correctness require separate measurements. A bounded validator improves control but its decision is only as strong as the support test and calibration evidence.

**What remains unknown.** [NOT-DISCLOSED] Neither study establishes universal verifier calibration or a guarantee against all unsupported claims. CiteGuard's exact generator revisions/denominators remain unresolved.

## Failure modes

[DERIVED] Similarity accepts negation changes; valid citations name irrelevant evidence; sentence-level checks hide unsupported clauses; judges prefer verbose familiar answers; conflict resolution mistakes recency for authority. Abstention can mask poor coverage, and threshold tuning on test outcomes can overstate selective reliability. Corpus updates can invalidate calibration without changing the generator.

## Siblings

[DERIVED] Citation formatting validates identity. Retrieval relevance predicts topical usefulness. NLI checks a proposition against evidence. Human/domain adjudication can assess nuanced support and correctness but costs more. Selective-answer calibration controls a statistical deployment risk under assumptions; it does not replace any of these semantic checks.

```figure
{
  "id": "fig-50.14",
  "kind": "compare",
  "title": "Evidence tests identify different properties",
  "caption": "A passing earlier test does not imply a passing later semantic or task test.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-50.13",
  "alt": "A passing earlier test does not imply a passing later semantic or task test. Illustrative analytical result, not book-measured performance.",
  "spec": {
    "axis": "Predicate and unresolved property",
    "columns": [
      {
        "id": "m",
        "label": "Citation identity"
      },
      {
        "id": "t",
        "label": "Claim support"
      },
      {
        "id": "p",
        "label": "Task correctness"
      }
    ],
    "rows": [
      {
        "dimension": "Checks",
        "values": {
          "m": "marker resolves to source",
          "t": "evidence entails claim",
          "p": "answer meets truth/task"
        }
      },
      {
        "dimension": "Can pass while",
        "values": {
          "m": "source contradicts claim",
          "t": "source is outdated/wrong",
          "p": "citation is unrelated"
        }
      },
      {
        "dimension": "Needs",
        "values": {
          "m": "stable revision map",
          "t": "calibrated semantic check",
          "p": "independent task labels"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage is citation-enabled generation, automated support evaluation, runtime acceptance/refusal control and calibrated selective answering. An open question is how to obtain reliable support labels for multi-source reasoning and conflicts at acceptable cost. Settling evidence requires independent expert labels, controlled contradiction tests, subgroup/shift analysis and complete answer/abstention denominators.

## Limitations

[DERIVED] Eq. 50.16 bounds a frozen policy's conditional error under a narrow sampling model; it does not establish source truth or robustness to an updated corpus. Source-support judgments themselves can be uncertain. A transparent unknown branch is necessary when authority, entailment or calibration is unavailable.

## Reproducibility

[UNVERIFIED] No verifier or calibration run was executed. Reproduction needs atomic-claim rules, citation/source revision mapping, verifier/model/rubric revisions, thresholds, calibration split/selection rule, error labels, empty-output conventions, regeneration budget and every abstention. Proposed conflict/negation/shift tests appear only in [verification](verification.md).

## References

[DERIVED] [R50.4, ALCE](https://arxiv.org/html/2305.14627v2), §3.3 and §6; [R50.9, CiteGuard](https://arxiv.org/html/2609.15830v1), §§2–4; [R50.14, evaluator](https://raw.githubusercontent.com/princeton-nlp/ALCE/main/eval.py). The original calibration derivation is separate from source-reported validator results.
