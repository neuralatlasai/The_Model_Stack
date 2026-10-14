---
id: "ms.section.50.6"
entity_type: "section"
title: "50.6 — End-to-end evaluation"
volume: 3
part: 9
chapter: 50
section: 50.6
slug: "50-6-end-to-end-evaluation"
parent: "ms.chapter.50"
prev_sibling: "ms.section.50.5"
next_sibling: "ms.verification.50"
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

# 50.6 — End-to-end evaluation

## Scope

[DERIVED] End-to-end evaluation measures the entire evidence-to-answer system while retaining stage-level records for retrieval failure, context omission, unsupported generation, citation errors and corpus changes. The verification target is to determine whether oracle retrieval or oracle context repairs a failed answer, with matched controls that expose alternative explanations. A final score alone is insufficient for this attribution.

## Why this exists

[DERIVED] Retrieval recall can rise while answer accuracy falls because additional passages distract the generator. A context compiler can omit retrieved gold evidence. A validator can block a correct answer or accept a contradiction. Corpus updates can change the truth criterion, evidence IDs and calibration at once. These interactions make a sum of independent component error rates a poor model of total system behavior.

[DERIVED] Oracle interventions appear decisive but can change more than their intended stage. Replacing retrieved context with a concise gold paragraph changes length, position, difficulty and distractor burden. A successful answer after that replacement does not isolate retrieval as the sole cause. Evaluation must declare its intervention, retain the resulting representation and distinguish diagnosis under altered inputs from causal identification under matched controls.

## Intuition

[DERIVED] Keep a record of offered request, corpus snapshot, retrieved candidate IDs, compiled tokens/source map, generated claims, citations, verifier decisions and final task outcome. Define stage failures from that record. Then use carefully scoped interventions to test which missing or corrupted information mattered. Every failure, refusal, timeout and unsupported configuration stays in the denominator appropriate to the task.

```figure
{
  "id": "fig-50.18",
  "kind": "diagram",
  "title": "Stage records support bounded failure attribution",
  "caption": "Final outcomes retain retrieval, compiled evidence, claims and verifier state; oracle repair is compared with matched controls.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-50.25",
  "alt": "Final outcomes retain retrieval, compiled evidence, claims and verifier state; oracle repair is compared with matched controls. Analytical structure, not a measured result.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "r",
        "kind": "dataset",
        "label": "retrieved candidates"
      },
      {
        "id": "c",
        "kind": "memory",
        "label": "compiled context"
      },
      {
        "id": "g",
        "kind": "model",
        "label": "claims / citations"
      },
      {
        "id": "v",
        "kind": "branch",
        "label": "verification"
      },
      {
        "id": "y",
        "kind": "metric",
        "label": "task outcome"
      },
      {
        "id": "o",
        "kind": "feedback",
        "label": "oracle / matched control"
      }
    ],
    "edges": [
      {
        "from": "r",
        "to": "c",
        "kind": "flow"
      },
      {
        "from": "c",
        "to": "g",
        "kind": "flow"
      },
      {
        "from": "g",
        "to": "v",
        "kind": "flow"
      },
      {
        "from": "v",
        "to": "y",
        "kind": "flow"
      },
      {
        "from": "o",
        "to": "r",
        "kind": "flow"
      },
      {
        "from": "o",
        "to": "c",
        "kind": "flow"
      }
    ]
  }
}
```

[PAPER-REPORTED] HELM separates scenario, model adaptation and metric, emphasizing multiple desiderata rather than accuracy alone. For RAG, the adaptation includes retrieval/context compilation and validation, so those components belong in the evaluated system identity. Its general framework is not itself a current RAG benchmark. [P50, §§2.1–2.3 and 4]

## Formulation

[DERIVED] Let $R$ denote sufficient evidence retrieved, $C$ sufficient evidence retained in compiled context, $G$ a supported/correct generation and $V$ final acceptance satisfying the task contract. If success is defined to require all four, the chain rule gives

$$
 \Pr(\mathrm{success})=\Pr(R)\Pr(C\mid R)
             \Pr(G\mid C,R)\Pr(V\mid G,C,R).
$$

(Eq. 50.22)

[DERIVED] All displayed conditioning prefixes are assumed to have positive probability; if one has probability zero, the required joint success is zero and the later conditional factors are not evaluated. No independence is assumed. A parametric-memory answer may be correct even when $R$ fails, so Eq. 50.22 applies to the declared evidence-grounded success criterion, not all possible answer correctness. Diagnostic labels should therefore allow “correct but unsupported” and “supported but task-incorrect” states. Multiple simultaneous failures also need multiple labels rather than a forced single cause.

[DERIVED] For $N\ge1$ evaluated pairs and request $i$, let $Y_i(r,c)$ be the outcome under a specified retrieval intervention $r$ and context intervention $c$, holding other declared conditions fixed. A paired difference

$$
 \widehat\Delta_R=\frac1N\sum_i[Y_i(1,c_0)-Y_i(0,c_0)]
$$

(Eq. 50.23)

[DERIVED] estimates a particular intervention effect only when those two inputs are well-defined and comparable. In real pipelines, context depends on retrieval, so holding $c_0$ fixed can block the intended information path. Alternatively letting the compiler adapt estimates a bundled upstream intervention. Both can be useful, but they answer different questions. Oracle interventions also use information unavailable to deployment and cannot be treated as deployable policies.

[DERIVED] A document's leave-one-out likelihood sensitivity for a fixed answer $y$ is

$$
 a(d)=\frac{\log p_\theta(y\mid q,C)
                  -\log p_\theta(y\mid q,C\setminus\{d\})}{|y|},
 \qquad |y|>0 .
$$

(Eq. 50.24)

[DERIVED] Both likelihoods must be positive for a finite log difference; zero-likelihood cases are reported separately rather than silently clipped. The quantity is a precisely defined intervention statistic, not automatically evidence use or truth. Deletion changes positions/length; length-matched replacement supplies a useful additional control. Redundant supporting documents can yield small individual effects even when their joint removal matters. Negative effects can indicate distraction, changed formatting or a different preferred wording. Holding the answer fixed avoids target-change confounding but measures teacher-forced sensitivity rather than the answer that would actually be generated after intervention.

## Mechanism

[DERIVED] Retrieval failure means sufficient permitted evidence was absent from the retrieved candidate set under a defined gold criterion. Context omission means relevant retrieved evidence was excluded or semantically lost during compilation. Unsupported generation means a claim lacks the required evidence support. Citation identity errors and citation-support errors differ. Task errors can persist despite correct support when the answer is incomplete, uses a wrong calculation or resolves a conflict incorrectly.

[DERIVED] Corpus updates require versioned evaluation queries and answer/evidence labels. Some questions retain their answer; others intentionally change. Deleting a source can make a formerly answerable query unanswerable, and access changes can alter the permitted evidence universe without changing public truth. Compare both preserved and changed-query strata rather than treating every output change as regression or every unchanged answer as stability.

[DERIVED] An oracle-retrieval study should retain the ordinary compiler and record how replacing/inserting evidence changes its output. An oracle-context study should state which source facts and dependencies it preserves. Length/position/distractor-matched controls can probe whether repair came from the missing evidence or from simplifying the input. These controls improve identification but do not automatically make a high-dimensional semantic intervention isolated.

[PAPER-REPORTED] The 2026 allocation study uses fixed-target leave-one-out passes, stable evidence identifiers and deletion/replacement controls. It tests attribution discrimination on both off-query and same-query negatives. This stronger diagnostic design exposes the weakness of relevance-only proxies, while its measured sensitivity still does not prove universal causal evidence use. [R50.10, §§4.1–4.4]

```figure
{
  "id": "fig-50.19",
  "kind": "calculator",
  "title": "Composed success has conditional stages",
  "caption": "Illustrative chain-rule factors under a success definition requiring sufficient retrieved/retained evidence and verified correct output.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-50.22",
  "alt": "Illustrative chain-rule factors under a success definition requiring sufficient retrieved/retained evidence and verified correct output. Analytical structure or illustrative values, not book-measured results.",
  "spec": {
    "tex": "p=r\\,c\\,g\\,v",
    "inputs": [
      {
        "symbol": "r",
        "label": "sufficient evidence retrieved",
        "default": 0.9,
        "min": 0,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "c",
        "label": "retained given retrieved",
        "default": 0.9,
        "min": 0,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "g",
        "label": "correct given sufficient context",
        "default": 0.8,
        "min": 0,
        "max": 1,
        "format": "ratio"
      },
      {
        "symbol": "v",
        "label": "final contract given prior stages",
        "default": 0.95,
        "min": 0,
        "max": 1,
        "format": "ratio"
      }
    ],
    "outputs": [
      {
        "symbol": "p",
        "label": "declared grounded success",
        "formula": "r*c*g*v",
        "format": "ratio",
        "emphasis": true
      }
    ]
  }
}
```

[DERIVED] End-to-end measurement also needs two execution modes distinguished. Fully adaptive runs allow model outputs to change later queries, retrieved evidence and stopping decisions. Recorded-stage replay fixes intermediate inputs and control flow while measuring the work of the components. The latter can improve systems comparability, but cannot demonstrate that a changed controller makes equally good decisions online.

## Algorithm

### Algorithm 50.6 — Bounded evidence evaluation

[DERIVED] Algorithm 50.6 is a bounded evaluation procedure, not a reported executed experiment. Inputs are finite authorized cohort $Q$, frozen system/corpus identities, predeclared diagnostic arms, total work budget $B$, deadline $D$ and independent task/support labels. Initialize durable $B_{\rm rem}=B$, one record per offered query and all outcomes unknown.

$$
\begin{aligned}
1.\;&\text{Validate cohort, source revisions and labels; unavailable labels}\Rightarrow\text{retain unknown}.\\
2.\;&\text{For each query/declared arm once, let }c\text{ cap execution/labels/cleanup;}\\
 &c>B_{\rm rem}\text{ or expired deadline}\Rightarrow\text{record unexecuted; continue}.\\
3.\;&B_{\rm rem}\leftarrow B_{\rm rem}-c;\ \text{execute with timeout; record retrieval, compilation, generation, citations and terminal state;}\\
 &\text{reconcile }\widetilde c\le c:\ B_{\rm rem}\leftarrow B_{\rm rem}+c-\widetilde c;\\
 &\text{retain failures rather than dropping incomplete cases}.\\
4.\;&\text{Apply independent stage/task predicates; preserve multiple simultaneous failure labels}.\\
5.\;&\text{For oracle arms, record changed length/position/evidence and matched-control outcome};\\
 &\text{unmatched intervention}\Rightarrow\text{report diagnostic repair, not isolated causal attribution}.\\
6.\;&\text{Aggregate by offered cohort, corpus revision and answer coverage; return paired outcomes,}\\
 &\text{uncertainty, cost and missing-label/unexecuted counts}.
\end{aligned}
$$

(Eq. 50.25)

[DERIVED] The invariant is that no excluded outcome silently improves a score. A cohort may have a separate conditional metric among answered cases, but the all-offered denominator and unknown/unexecuted fraction remain visible. Evaluation uses independently defined labels; scoring the output only with the same validator that decided publication risks circular assessment.

## Implementation

[DERIVED] AI_REFERENCE_STACK §4 **#26 Hugging Face Transformers**, layer **Model definition / adaptation**, **#17 PyTorch**, layer **Model / autograd framework**, and **#41 vLLM**, layer **Inference engine**, identify execution components. HELM and MLPerf are evaluation anchors explicitly routed by the book plan. ALCE supplies benchmark/evaluator logic outside the execution catalog. Every model, retriever, compiler, corpus and evaluator revision belongs in the run identity.

[DERIVED] Full evaluation cost includes gold annotation, retrieval/index reads, reranking, compression, internal generation, validation and final output. Oracle and matched-control arms multiply work. Leave-one-out over $k$ documents requires $k+1$ forward evaluations of a fixed target before batching/reuse; it avoids autoregressive sampling but still consumes model FLOPs, KV/activation memory, weight traffic and possibly distributed communication. Parallelism changes latency and peak memory, not total work for free.

[DERIVED] Storage includes prompt/context manifests, evidence revisions, outputs, claim graphs and trace/error records. Sensitive text can be replaced with authorized hashes only where that preserves the intended reproducibility boundary; hashes cannot reconstruct omitted semantic content. Energy/money should include all arms and failed runs. Point estimates without uncertainty and denominator records are insufficient when query/task mixtures differ.

## Experimental design

### Methodology

[OFFICIAL-DOCUMENTATION] MLPerf's August 2026 RAG benchmark uses 824 FRAMES queries and a frozen Wikipedia corpus. Its initial performance scenario is Offline. Recorded reference inputs at every stage/hop fix retrieved documents and hop counts; generated outputs are discarded in performance runs. Accuracy is assessed separately. [R50.11, “Dataset and task selection” and “Performance metrics”]

### Reported experiments

[OFFICIAL-DOCUMENTATION] The disclosure reports a 35% reference final-answer accuracy and an acceptance threshold relative to that reference. TEST09 checks only aggregate final-answer mean output length within ±10%; intermediate generation/retrieval stages are outside that check. It introduces a workload/reference, not a hardware speedup result. [R50.11, “Accuracy metrics” and “Compliance”]

[PAPER-REPORTED] LongEval's fixed-candidate study reports hybrid versus corrective ROUGE-F1 .132 versus .126 and document-ID citation precision .766 versus .692. Its RAGAs faithfulness scores move differently, and the paired 47-query test is nonsignificant for citation faithfulness/relevancy. This demonstrates metric disagreement under one protocol, not proof that one architecture uses parametric rather than retrieved knowledge. [R50.8, Tables 1/4 and §5]

## Observations

**What the paper claims.** [OFFICIAL-DOCUMENTATION] MLPerf supplies a multi-component RAG workload with separate performance/accuracy procedures. [R50.11]

**What the evidence shows.** [OFFICIAL-DOCUMENTATION] Recorded-stage performance holds control flow fixed, and compliance covers final-answer length only. These boundaries constrain conclusions about adaptive robustness. [R50.11, performance/compliance]

**What we infer.** [DERIVED] Stage traces, independent semantic labels and matched interventions are complementary. A reliable evaluation preserves both the final user outcome and the evidence needed to explain its failures.

**What remains unknown.** [NOT-DISCLOSED] This manuscript has no executed oracle study or corpus-update evaluation. Private or unversioned intermediate evidence can prevent reproducing a failure even when the final answer is retained.

## Failure modes

[DERIVED] Validator-as-judge circularity inflates success. A single LLM judge confounds style with support. Oracle simplification attributes a repair to retrieval while removing distractors and shortening context. Correct answer strings hide unsupported generation. Citation-ID precision is mistaken for entailment. Static snapshots conceal freshness failures. Recorded-stage replay is mislabeled an adaptive controller test.

## Siblings

[DERIVED] Retrieval-only metrics isolate evidence access; context audits isolate transformations; generation/support evaluation tests evidence use; end-to-end tasks test the composed outcome. Oracle interventions reveal repair opportunities, while matched controls strengthen causal interpretation. Systems replay measures declared work; fully adaptive evaluation measures decision consequences as well.

```figure
{
  "id": "fig-50.20",
  "kind": "compare",
  "title": "Evaluation modes answer different questions",
  "caption": "Controlling intermediate inputs improves repeatability while changing the evaluated decision process.",
  "placement": "rail",
  "anchor": "siblings",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-50.25",
  "alt": "Controlling intermediate inputs improves repeatability while changing the evaluated decision process. Analytical structure or illustrative values, not book-measured results.",
  "spec": {
    "axis": "What changes and what is identified",
    "columns": [
      {
        "id": "m",
        "label": "Adaptive run"
      },
      {
        "id": "t",
        "label": "Recorded-stage replay"
      },
      {
        "id": "p",
        "label": "Oracle intervention"
      }
    ],
    "rows": [
      {
        "dimension": "Control flow",
        "values": {
          "m": "generated actions determine next input",
          "t": "reference stage inputs fixed",
          "p": "declared evidence replaced"
        }
      },
      {
        "dimension": "Measures",
        "values": {
          "m": "composed decision outcome",
          "t": "work under fixed pipeline trace",
          "p": "diagnostic repair / scoped effect"
        }
      },
      {
        "dimension": "Main caveat",
        "values": {
          "m": "stochastic paths / confounding",
          "t": "not adaptive robustness",
          "p": "length / position / distribution changes"
        }
      }
    ]
  }
}
```

## Extensions

### Improvements

[DERIVED] The lineage moves from task accuracy to attribution metrics, intervention-based diagnostics and multi-component systems benchmarks. A central open question is whether stage-level diagnostics predict failures after corpus and policy updates. Settling evidence needs prospective versioned updates, independent labels, stable denominators and tests of both adaptive and recorded-stage execution.

## Limitations

[DERIVED] Gold evidence can be incomplete; correct answers can have several valid supporting sets. Oracle context is an intervention on a representation, not direct access to a latent causal variable. Teacher-forced sensitivity and judge agreement remain imperfect measurements. The evaluation procedure can expose these limits but cannot remove them through more metrics alone.

## Reproducibility

[UNVERIFIED] No proposed evaluation was executed. Required artifacts include offered queries, labels, corpus/access snapshots, retriever/index/model/evaluator revisions, exact context/token manifests, all internal actions, oracle/control definitions, cost boundaries, exclusions and unknowns. The unexecuted protocols and acceptance criteria are in [verification](verification.md).

## References

[DERIVED] [R50.8, LongEval](https://arxiv.org/html/2607.14400v1); [R50.10, allocation diagnostics](https://arxiv.org/html/2608.23252v1); [R50.11, MLPerf E2E RAG](https://mlcommons.org/2026/08/endtoend-inference/); [P50, HELM](https://arxiv.org/html/2211.09110v2). The source register distinguishes published references, preprints and mutable implementation surfaces.
