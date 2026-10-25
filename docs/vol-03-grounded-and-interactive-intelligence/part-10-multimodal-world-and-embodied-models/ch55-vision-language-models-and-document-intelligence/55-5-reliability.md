---
id: ms.section.55.5
entity_type: section
title: Reliability
volume: 3
part: 10
chapter: 55
section: 55.5
slug: 55-5-reliability
parent: ms.chapter.55
prev_sibling: ms.section.55.4
next_sibling: ms.section.55.6
children: []
prerequisites: [ms.chapter.18, ms.chapter.31, ms.chapter.49, ms.chapter.50]
downstream: [ms.chapter.57, ms.chapter.63]
related: [ms.chapter.15, ms.chapter.42]
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [visual_representation, spatial_sampling], feedback_setting: [], modality: [image, text]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2000
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 55.5 - Reliability

## Scope

[DERIVED] The required result is an answer whose correctness, evidential support and uncertainty satisfy a declared acceptance rule under the intended image/question distribution. Reliability here covers hallucinated evidence, resolution and spatial errors, distractors and answer-language confounds. It does not infer an internal explanation from a single output trace. General benchmark validity and judge reliability belong to Chapters 61-63; the present section develops visual component interventions and the limits of their attribution.

## Why this exists

[DERIVED] Correctness and grounding can diverge. A model may answer correctly from language priors without using the image, or read a correct value while attaching an incorrect citation. It may lower its rate of one familiar wrong answer by switching to another wrong answer. A benchmark that filters out text-only successes separately for every model changes its evaluation population as the model changes. These distinctions are scientifically consequential: the same aggregate score can support different engineering decisions.

## Intuition

[MATHEMATICALLY-DERIVED] With three answer choices, a model can abandon its image-free answer yet select the remaining incorrect choice. Therefore 'does not follow the prior' is not equivalent to 'reads the image correctly'. In a binary task those events can become complements only when all responses are valid choices and the reference answer is unambiguous. Invalid strings, abstentions and more choices break that identity. A metric must disclose its sample set and outcome partition before a change can be interpreted.

```figure
{
  "id": "fig-55.15",
  "kind": "diagram",
  "title": "A visual failure chooses the next investigation",
  "caption": "Fixed-item controls distinguish missing observations, structural/evidence access, downstream computation and invalid evaluation. An oracle gain identifies a boundary to investigate; it does not prove a unique internal cause. An invalid intervention or moving cohort requires measurement repair first.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-55.18",
  "alt": "Fixed-item controls distinguish missing observations, structural/evidence access, downstream computation and invalid evaluation. An oracle gain identifies a boundary to investigate; it does not prove a unique internal cause. An invalid intervention or moving cohort requires measurement repair first.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "wrong",
        "kind": "state",
        "label": "Visual answer fails"
      },
      {
        "id": "valid",
        "kind": "branch",
        "label": "Evaluator / cohort / target valid?"
      },
      {
        "id": "repair",
        "kind": "process",
        "label": "Repair measurement"
      },
      {
        "id": "oracle",
        "kind": "branch",
        "label": "Oracle evidence closes gap?"
      },
      {
        "id": "observe",
        "kind": "process",
        "label": "Inspect perception and structure"
      },
      {
        "id": "reason",
        "kind": "process",
        "label": "Inspect operation and evaluator"
      },
      {
        "id": "compare",
        "kind": "metric",
        "label": "Matched repair and comparator"
      }
    ],
    "edges": [
      {
        "from": "wrong",
        "to": "valid"
      },
      {
        "from": "valid",
        "to": "repair",
        "label": "no"
      },
      {
        "from": "valid",
        "to": "oracle",
        "label": "yes"
      },
      {
        "from": "oracle",
        "to": "observe",
        "label": "yes"
      },
      {
        "from": "oracle",
        "to": "reason",
        "label": "no"
      },
      {
        "from": "observe",
        "to": "compare"
      },
      {
        "from": "reason",
        "to": "compare"
      }
    ]
  }
}
```


## Formulation

[DERIVED] For example $i$, write reference answer $a_i^*$, image-free answer $a_{B,i}$ and visual answer $a_{V,i}$. Let $A_m=\{i:a_{B,i}^{(m)}\ne a_i^*\}$ be the conflict set for model $m$. Restricting to that set removes image-free correct responses but selects different items for different models. On one fixed nonempty set $A$, define

$$
P_A=\frac1{|A|}\sum_{i\in A}\mathbf1[a_{V,i}=a_{B,i}],\quad
Q_A=\frac1{|A|}\sum_{i\in A}\mathbf1[a_{V,i}=a_i^*],\quad
O_A=1-P_A-Q_A.
$$
*(Eq. 55.17)*

where every $i\in A$ has $a_{B,i}\ne a_i^*$. The three categories are prior answer, correct visual answer and other response. They are disjoint; $O_A\geq0$ under complete outcome accounting. The third category includes a different wrong answer, invalid output and abstention, which should also be reported separately. Lower $P_A$ alone can be entirely offset by higher $O_A$.

[PAPER-REPORTED] ViSiP-Bench elicits image-free answers per model, filters image-free correct items and reports prior adherence, filtered accuracy and a probability-based log-odds shift [R55.11, Sec. 3.2]. Its Table 3 changes the reported Filtered Count from 147 for the base model to 154 for MAPS and 385 for Post-hoc. These count removed image-free-correct items, not the remaining conflict-set denominator. Model-specific filtering prevents treating the displayed accuracy differences as a fixed-population effect.

[MATHEMATICALLY-DERIVED] For base and adapted models, report their own conflict sets for operational diagnosis but also a fixed cohort, for example $A_\cap=A_0\cap A_1$, and the blank-answer transition table on all original items. The fixed-cohort difference is

$$
\Delta Q_{A_\cap}=|A_\cap|^{-1}\sum_{i\in A_\cap}
\left(\mathbf1[a_{V,i}^{(1)}=a_i^*]-\mathbf1[a_{V,i}^{(0)}=a_i^*]\right).
$$
*(Eq. 55.18)*

where the empty-intersection case is undefined and must be reported, not filled with zero. The intersection answers a selected hard-cohort question and is not an unbiased estimate of full-distribution improvement. Also evaluate all items and a base-fixed conflict cohort to expose newly broken image-free knowledge and cohort movement. When stochastic blank outputs define membership, freeze the membership protocol or account for its uncertainty.

[PAPER-REPORTED] The source's Visual Information Gain is an epsilon-smoothed log-odds change, not Shannon mutual information [R55.11, Eq. 2]. In book notation,

$$
G_i=\log\frac{p_V(a_i^*)+\epsilon}{1-p_V(a_i^*)+\epsilon}
-\log\frac{p_B(a_i^*)+\epsilon}{1-p_B(a_i^*)+\epsilon}.
$$
*(Eq. 55.19)*

where $p_B,p_V\in[0,1]$ are consistently defined answer probabilities and $\epsilon>0$. For this formula, $|G_i|\leq2\log((1+\epsilon)/\epsilon)$, approximately 32.236 at $\epsilon=10^{-7}$. This follows by evaluating the monotone log-odds at zero and one; the paper's $(-33,33)$ statement is a loose enclosure. Multi-token answers require a declared scoring scheme: an option-token probability, a normalized sequence score and a free-form answer probability are different quantities.

[MATHEMATICALLY-DERIVED] For acceptance score $s_i$, threshold $\eta$, error indicator $e_i$ and $N$ attempted items, selective coverage and risk are

$$
C(\eta)=\frac1N\sum_i\mathbf1[s_i\geq\eta],\qquad
R(\eta)=\frac{\sum_i e_i\mathbf1[s_i\geq\eta]}{\sum_i\mathbf1[s_i\geq\eta]}.
$$
*(Eq. 55.20)*

where risk is undefined if no answer is accepted. Correctness and unsupported-evidence error can be separate $e_i$ axes. Rejecting everything gives zero coverage and no estimated risk, not a perfect reliable system. Thresholds must be selected on development data under a minimum-coverage/resource rule and then held fixed for evaluation.

```figure
{
  "id": "fig-55.16",
  "kind": "calculator",
  "title": "Leaving the prior is not necessarily becoming correct",
  "caption": "Analytical partition on a fixed nonempty conflict cohort. The second input is correctness among answers that leave the prior, so every slider setting preserves nonnegative categories summing to one. No reported model probabilities are used.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-55.17",
  "alt": "Analytical partition on a fixed nonempty conflict cohort. The second input is correctness among answers that leave the prior, so every slider setting preserves nonnegative categories summing to one. No reported model probabilities are used.",
  "spec": {
    "tex": "P+Q+O=1;\\quad Q=(1-P)c",
    "equation": "55.17",
    "inputs": [
      {
        "symbol": "prior",
        "label": "Fraction retaining wrong prior",
        "default": 0.4,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "c",
        "label": "Correct among non-prior responses",
        "default": 0.5,
        "min": 0,
        "max": 1,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "P",
        "label": "Prior answer",
        "formula": "prior",
        "format": "percent"
      },
      {
        "symbol": "Q",
        "label": "Correct visual answer",
        "formula": "(1-prior)*c",
        "format": "percent"
      },
      {
        "symbol": "O",
        "label": "Other response",
        "formula": "(1-prior)*(1-c)",
        "format": "percent"
      }
    ]
  }
}
```


## Mechanism

### Methodology

[DERIVED] Build a diagnostic matrix with image/question pairs under original raster, controlled downsampling, gold crops, blank/shuffled image, oracle OCR text and oracle structured evidence. The intervention must preserve the target answer when that is the comparison's premise. Downsampling can make an originally answerable question illegible; if so the intervention changes available information and abstention may be correct. A gold crop can leak the answer location, so its gain is an upper-bound probe of a supplied localization interface, not a deployable accuracy claim.

[DERIVED] Oracle text separates some character-recognition errors from downstream computation, but its formatting can leak table structure and its vocabulary can alter the language problem. Use separate plain transcription and structured-table conditions. A remaining oracle gap can arise from reasoning, instruction interpretation or evaluation; it is not uniquely a reasoning defect. Likewise, improvement with oracle text identifies an observation/interface bottleneck without establishing which encoder repair is causally responsible.

[DERIVED] Resolution tests should measure realized tokens and glyph size rather than only file dimensions. Spatial tests should independently perturb translation, crop boundaries, rotation, row ordering and distractor density while preserving source-coordinate truth. A correct answer that shifts under a harmless crop offset suggests representation sensitivity; a wrong answer that persists across views may reflect shared observation loss or a stable prior. Contradictory crop answers require arbitration against original evidence, not automatic majority voting among correlated views.

[DERIVED] Answer-language confounds require paired questions and answers in each tested language with semantic equivalence checked independently. Translating only the question can change named entities, numeral formats, units or answer normalization. Report image-free and visual conditions in the same language, plus translation and OCR scripts. A gain from an English answer template does not establish better perception of a non-English document. Source scripts, directionality and Unicode normalization are distinct axes.

[PAPER-REPORTED] MAPS selects confident model-specific priors, generates rare factual counterexamples and performs LoRA adaptation. Its Qwen3-VL-8B setup uses four A100 80GB GPUs and two epochs [R55.11, Secs. 4-5]. Table 5's lower threshold improves filtered perception metrics while reducing general-benchmark scores. Table 4 also includes small regressions for MAPS on VisuLogic and MMStar. Thus the source supports a measured tradeoff; it does not establish universal preservation or a uniformly optimal threshold.

## Algorithm

### Algorithm 55.5 — Fixed-population visual reliability evaluation

[DERIVED] Inputs are immutable test items, frozen model/processor revisions, preregistered interventions, acceptance rule, evaluator and finite resource caps. Output is a paired outcome ledger with uncertainty and unresolved cases.

$$
\begin{aligned}
1.&\quad \text{freeze original item ids, grouped splits, blank-answer protocol and every evaluation denominator}.\\
2.&\quad \text{validate each intervention's target/evidence semantics; mark changed or unanswerable cases explicitly}.\\
3.&\quad \text{for each bounded item/condition: execute only while admissible; retain timeout, refusal and invalid outcomes}.\\
4.&\quad \text{score answer, cited evidence, required operation and acceptance separately}.\\
5.&\quad \text{construct full-population and fixed-cohort paired transitions; do not compare moving filters as one cohort}.\\
6.&\quad \text{estimate grouped uncertainty; audit disagreements and contamination; report limits before selecting a repair}.
\end{aligned}
$$

[DERIVED] The invariant is that attempted items cannot disappear after seeing outcomes. A finite intervention set and attempt cap bound execution; retries consume the cap and preserve first-attempt results. Grouped uncertainty follows the source unit, such as document or latent scene, rather than pretending paraphrases and adjacent pages are independent. An inconclusive interval is retained as inconclusive.

## Implementation

[DERIVED] Store source hashes, exact processed images, realized tokens, prompts and normalized plus raw outputs. A grader must distinguish unsupported evidence from an incorrect answer and preserve partial-credit rules. Judge prompts, model versions, temperature and disagreement adjudication are part of the measurement instrument. Blinding model and intervention identities can reduce some bias; it cannot prove judge independence. For numeric answers, executable unit-aware checks can supplement model judgments, with tolerances fixed before evaluation.

[MATHEMATICALLY-DERIVED] With $N$ originals, $J$ interventions, $S$ decoding repeats and $M$ models, the planned answer-call count is $NJSM$ before blank probes, graders and retries. Oracle and augmentation calls must enter the resource budget. Confidence intervals over repeated bridges or generations do not estimate all pretraining uncertainty. Bootstrap at the appropriate group level, preserve paired differences and report the number of independent groups. Energy and cost require metered calls under the deployment boundary; benchmark sample count alone is not an energy model.

## Experimental design

### Reported experiments

[PAPER-REPORTED] ViSiP-Bench evaluates 24 models and averages three repeats; probability-based scores require access to the needed logits [R55.11, Sec. 3.3]. VELD-QA compares gold and retrieved evidence and conditions analyses on retrieval coverage, separating missing-page failures from errors despite coverage [R55.10, Appendix F]. Neither study alone supplies all the controlled image, oracle-text, language and deployment interventions proposed here.

## Observations

**What the paper claims.** [PAPER-REPORTED] ViSiP-Bench describes model-aware prior softening as improving visual reliance while maintaining general capability [R55.11, Sec. 5]. Its displayed metrics and filters qualify that statement as above.

**What the evidence shows.** [DERIVED] Changes in prior adherence, visual accuracy, blank-answer correctness and evaluated membership are separable outcomes. Table-level aggregate gains do not identify their joint paired transitions; those require item-level outputs.

**What we infer.** [DERIVED] The next justified intervention depends on the diagnosed obstruction. A resolution-only failure motivates better observation; a correct-oracle/wrong-raster gap motivates perception or structure; wrong oracle computation motivates the operation or evaluator. A moving-cohort gain motivates reanalysis before model changes.

**What remains unknown.** [UNVERIFIED] Fixed-cohort effect sizes for the source's adapted models, generalization beyond its sampled priors, independent annotation truth and service-load selective risk require additional evidence. No book experiment has been executed.

```figure
{
  "id": "fig-55.17",
  "kind": "compare",
  "title": "Each evaluation cohort answers a different question",
  "caption": "A fixed population supports paired changes without moving membership. The intersection isolates shared image-free conflicts but is selected; the base-fixed set follows original failures; model-specific filters describe different operating populations. Empty cohorts are undefined.",
  "placement": "inline",
  "anchor": "observations",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-55.18",
  "alt": "A fixed population supports paired changes without moving membership. The intersection isolates shared image-free conflicts but is selected; the base-fixed set follows original failures; model-specific filters describe different operating populations. Empty cohorts are undefined.",
  "spec": {
    "axis": "Estimand and selection boundary for base versus adapted visual models",
    "columns": [
      {
        "id": "all",
        "label": "All original items"
      },
      {
        "id": "fixed",
        "label": "Fixed conflict cohort"
      },
      {
        "id": "own",
        "label": "Model-specific conflicts"
      }
    ],
    "rows": [
      {
        "dimension": "Membership",
        "values": {
          "all": "Same immutable full test set",
          "fixed": "Base-fixed or preregistered intersection",
          "own": "Each model defines its own blank-wrong set"
        }
      },
      {
        "dimension": "Useful question",
        "values": {
          "all": "Total correctness and blank-answer damage",
          "fixed": "Paired change on the named selected cohort",
          "own": "Residual prior conflicts within each model"
        }
      },
      {
        "dimension": "Main limitation",
        "values": {
          "all": "May dilute rare prior-conflict behavior",
          "fixed": "Selected-cohort result is not total-population effect",
          "own": "Aggregate differences mix effect and membership"
        }
      }
    ]
  }
}
```


## Failure modes

> **Failure mode - Lower adherence, unchanged correctness.** [DERIVED] *Symptom:* prior adherence falls while visual errors remain. *Cause:* responses move from the prior answer into another wrong category. *Detection:* score the complete partition in Eq. 55.17. *Mitigation:* optimize and evaluate answer/evidence error jointly rather than rewarding disagreement alone.

> **Failure mode - Moving evaluation cohort.** [DERIVED] *Symptom:* filtered accuracy improves alongside a changed blank-answer filter. *Cause:* each model excludes different items. *Detection:* retain original ids and compute fixed-cohort transitions. *Mitigation:* report full-population results and several explicitly fixed cohorts; do not infer a common-population effect from separate aggregates.

## Siblings

[DERIVED] Choose abstention when the acceptance rule tolerates lower coverage and evidence cannot meet its threshold. Choose resolution/crop repair when controlled observation changes close the gap within budget. Choose adaptation only after paired tests establish that behavior rather than information access is the obstruction. A comparator with lower supported error at the same coverage/resource cap reverses the choice. A failed evaluator or invalid intervention invalidates attribution and requires measurement repair first. Stop when the accepted operating rule is met or the evidence is insufficient; exhausting experiments does not establish reliability.

## Extensions

### Improvements

[DERIVED] A useful extension combines item-level evidence scoring with adaptive acquisition and reports how each extra observation changes accepted error and cost. The acquisition policy must be evaluated on held-out items, including its stop/abstain branch. Reusing the same benchmark to design rare counterexamples, tune acceptance and claim generalization makes those stages dependent. Separate data or an explicit adaptive-evaluation analysis is needed to bound that feedback.

## Limitations

[DERIVED] These diagnostics constrain explanations but do not recover a unique internal causal mechanism. Rare-but-real datasets can overrepresent unusual conflicts; synthetic edits can introduce artifacts; oracle inputs change available information. The bounded conclusion is an auditable comparison under declared interventions and cohorts, not a guarantee against every visual hallucination.

## Reproducibility

[DERIVED] Publish item-level paired outcomes, cohort membership, filter counts with definitions, invalid/timeout policy, reference and evidence annotations, intervention hashes, answer-probability extraction and grouped uncertainty code. Mark any inaccessible provider logits or versions UNVERIFIED. See [verification](verification.md) for the unexecuted fixed-cohort and oracle protocols.

## References

[R55.11](references.md#r55-11), Secs. 3-5, Eqs. 1-2 and Tables 3-5; [R55.10](references.md#r55-10), Appendix F. Task-specific counterexamples: Sec. 55.3. Deployment costs and bounded acquisition: Sec. 55.6.
