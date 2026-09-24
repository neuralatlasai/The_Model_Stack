---
id: ms.section.11.3
entity_type: section
title: Selection and verification
short_title: Selection and verification
volume: 1
part: 2
chapter: 11
section: 11.3
slug: 11-3-selection-and-verification
parent: ms.chapter.11
prev_sibling: ms.section.11.2
next_sibling: ms.section.11.4
children: []
prerequisites: [ms.section.2.2, ms.section.2.5, ms.section.6.1, ms.section.6.2, ms.section.11.1, ms.section.11.2]
downstream: [ms.section.11.4, ms.section.11.6, ms.section.32.4, ms.section.32.6, ms.section.35.3, ms.section.38.2, ms.section.39.3, ms.section.62.3]
related: [ms.section.8.5, ms.section.62.4]
siblings_by_mechanism: []
relations:
  - {type: supported_by, target: paper.P26}
  - {type: supported_by, target: paper.P22}
  - {type: supported_by, target: paper.P29}
  - {type: implemented_by, target: impl.vllm}
  - {type: implemented_by, target: impl.verl}
  - {type: implemented_by, target: impl.openrlhf}
  - {type: evaluated_by, target: experiment.11.7}
axes: {lifecycle: [data, post_training], mechanism: [rejection_sampling, verification, model_judge, disagreement_analysis], feedback_setting: [verifiable_reward, ai_feedback, learned_reward, human_preference], modality: [text]}
papers: [P22, P26, P29, P42, P43]
implementations: [impl.vllm, impl.verl, impl.openrlhf, impl.hugging-face-trl]
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2500
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 11.3 Selection and verification

## Scope

Objective: formalise how candidate samples from a generator are kept or discarded — execution checks, symbolic checks, human review, model judges, and rejection sampling — and give the analysis of what the retained set is a sample *of*, what it costs, and how disagreement between checkers is measured. Baseline: "we filtered for quality" with no statement of the acceptance predicate, its error rates, or the induced distribution. Success: for a retained set, the reader can write down its distribution in terms of the generator's and the checker's, compute the expected cost per accepted sample, and state the bias in prompt difficulty it carries. Boundaries: reward models and verifiers *as training targets* are owned by [§32.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch32-preferences-reward-models-verifiers-and-oversight/32-3-reward-model-training.md) and [§32.4](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch32-preferences-reward-models-verifiers-and-oversight/32-4-outcome-and-process-verification.md); model judges *as evaluators* by [§62.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-3-model-as-judge.md); best-of-N as an *inference-time* procedure by [§38.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/38-2-candidate-aggregation.md); RL with verifiable rewards by Chapter 35. This section owns *selection as a data procedure*.

## Why this exists

What failed before was training on whatever the generator produced. Self-Instruct's audit — 54% of instances fully valid (PAPER-REPORTED · R11.1) — shows the raw output quality of an early generator; the fix was to check outputs before training. The first checks were cheap and weak: STaR keeps a rationale if its final answer matches the reference ("fine-tune on all the rationales that ultimately yielded correct answers"; PAPER-REPORTED · R11.4). The bottleneck that appeared was that *the check defines the data*. STaR notes that "since the model is only trained on the examples which it answers correctly, improvement ends when the model fails to solve new problems in the training set" (PAPER-REPORTED · R11.4): a retained set is biased toward what the generator already does, and the bias is a function of the acceptance predicate. The constraint that became dominant is the cost and reliability of the checker. Execution is reliable but expensive (a container per sample); string matching is cheap but blind to reasoning; a reward model or a model judge is cheap and general but has error rates that the retained set inherits. Llama 2 formalised selection as *rejection sampling fine-tuning* — "We sample K outputs from the model and select the best candidate with our reward" — and observed that "the delta between max and median can be interpreted as potential gain with Rejection Sampling", growing with K (PAPER-REPORTED · R11.5). DeepSeek-R1 used the same construction with a mixed checker: rule-verified reasoning prompts plus "a generative reward model by feeding the ground-truth and model predictions into DeepSeek-V3 for judgment", with additional filters against "mixed languages, long paragraphs, and code blocks", sampling "multiple responses" per prompt and retaining "only the correct ones" (PAPER-REPORTED · P26). What changed is that selection is now a first-class procedure with a predicate, a budget, and an induced distribution — and that recipes report when it did *not* help: Tulu 3 lists "Rejection Sampling" among methods that did not reliably improve its models (PAPER-REPORTED · P29).

## Intuition

Physically, rejection sampling turns a generator into a *filter* on the generator's own distribution: draw, check, keep or discard. The retained samples are drawn from the generator's conditional restricted to the acceptance region, and the number of draws needed per kept sample is the reciprocal of the acceptance probability. This has two immediate consequences. First, the cost of a kept sample is dominated by the *rejected* draws whenever acceptance is low; a prompt with 5% acceptance costs twenty draws per kept sample. Second, prompts on which the generator succeeds often are over-represented in the retained set unless the procedure deliberately caps per-prompt retention — the retained set's prompt marginal is tilted toward the easy. Model judges and reward models make the acceptance region *learned* rather than *executed*; the judge's mistakes become the retained set's mistakes, with a precision that depends on the base rate of correct samples. Heuristically, engineers speak of "verifier-filtered data being clean"; the measurable content is the precision of the retained set under the checker's error rates, Eq. 11.9 below, which can be low even for a good checker when the generator's base rate is low.

## Formulation

Let x ∼ 𝒟 be a prompt, π(·|x) the generator's conditional (a policy or a teacher under fixed σ), and V: (x, y) → {0, 1} an acceptance predicate.

> **Definition — rejection sampling (as a data-selection procedure).** Draw y ∼ π(·|x) and retain y iff V(x, y) = 1. Repeated for a prompt until a retention rule is met (first accept, up to K draws, or all accepts among K draws).

The retained conditional is

$$
\pi_V(y \mid x) \;=\; \frac{\pi(y \mid x)\, V(x,y)}{p_{\text{acc}}(x)},\qquad p_{\text{acc}}(x) = \mathbb{E}_{y \sim \pi(\cdot|x)}\big[V(x,y)\big]
$$
*(Eq. 11.5)* where p_acc(x) = the per-prompt acceptance probability under the generator (MATHEMATICALLY-DERIVED).

> **Definition — acceptance rate.** The realised fraction of draws that pass the gate, p̂_acc = accepted / drawn, reported per prompt (an estimate of p_acc(x)) and per corpus (a draw-weighted average). It is a property of the *pair* (generator, predicate), not of either alone.

The expected number of draws per accepted sample for a prompt is geometric:

$$
\mathbb{E}[\text{draws per accept} \mid x] = \frac{1}{p_{\text{acc}}(x)},\qquad
\mathbb{E}[\text{cost per accept} \mid x] = \frac{c_{\text{gen}}(x) + c_V(x)}{p_{\text{acc}}(x)}
$$
*(Eq. 11.6)* where c_gen(x) = generation cost per draw (tokens × cost/token), c_V(x) = verification cost per draw (MATHEMATICALLY-DERIVED; assumes independent draws).

With a fixed budget of K draws per prompt, the probability of retaining at least one sample is

$$
P(\text{≥ 1 accept} \mid x, K) = 1 - \big(1 - p_{\text{acc}}(x)\big)^{K}
$$
*(Eq. 11.7)* (MATHEMATICALLY-DERIVED; this is the pass@K identity of [§38.2](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/38-2-candidate-aggregation.md) used for data rather than evaluation).

Under the *keep-all-accepts* rule the retained prompt marginal is tilted:

$$
q_V(x) \;\propto\; \mathcal{D}(x)\; K\, p_{\text{acc}}(x)\quad(\text{keep all}),\qquad
q_V(x) \;\propto\; \mathcal{D}(x)\,\big[1-(1-p_{\text{acc}}(x))^{K}\big]\quad(\text{keep one})
$$
*(Eq. 11.8)* (MATHEMATICALLY-DERIVED). Keep-all tilts linearly toward easy prompts; keep-one saturates at 1 for prompts with K·p_acc ≫ 1 and still down-weights hard prompts. A per-prompt cap c ≤ K bounds the tilt to min(K p_acc, c).

Checkers err. Let the generator's true-correctness base rate be p = P(correct | x), and the predicate's false-positive and false-negative rates be α = P(V=1 | incorrect) and β = P(V=0 | correct). Then the precision of the retained set is

$$
P(\text{correct} \mid V=1) \;=\; \frac{p\,(1-\beta)}{p\,(1-\beta) + (1-p)\,\alpha}
$$
*(Eq. 11.9)* (MATHEMATICALLY-DERIVED, Bayes). At p = 0.1, α = 0.05, β = 0.05 the precision is 0.095/(0.095 + 0.045) ≈ 0.68 (DERIVED): a checker with 5% error on each side yields a retained set one third wrong when the generator is right one time in ten.

> **Definition — verifier-filtered set.** A retained set whose acceptance predicate V is an *executed or symbolic* check with recorded evidence (VER rows of §11.2 with `execution` or `symbolic` semantics). A set filtered by a model judge or a reward model is a *judge-filtered set*; the two are not interchangeable because their α, β have different structure (Eq. 11.9).

> **Definition — model-judge filtering (as selection).** Using a language model's verdict as V for retention. It is distinguished from model-as-judge *evaluation* (§62.3) by its role: an evaluation judge scores a fixed set; a filtering judge shapes the training distribution and its errors are inherited by the student.

> **Definition — disagreement analysis.** The measurement, on a common sample, of pairwise agreement between two or more acceptance predicates (execution, symbolic, human, judge), reported as agreement rate and a chance-corrected statistic (Cohen's κ), together with the confusion of each predicate against the strongest available one.

Best-of-N with a scalar scorer R (a reward model) is the ordinal form: retain y* = argmax_{k ≤ N} R(x, y_k). For a continuous score with CDF F under π, the retained density is N F(y)^{N−1} π(y|x), and its divergence from the generator is

$$
\mathrm{KL}\big(\pi_{\text{BoN}} \,\|\, \pi\big) \;=\; \log N - \frac{N-1}{N}
$$
*(Eq. 11.10)* (MATHEMATICALLY-DERIVED under a continuous, tie-free score; derivation below). This is the "distance" a rejection-sampled SFT set moves the student from the generator per selection round, before any training effect.

<details><summary>Derivation of Eq. 11.10</summary>
Let U = F(y) for y ∼ π; U is Uniform(0,1). The best of N draws has density N u^{N−1} on U. KL(π_BoN ∥ π) = E_{BoN}[log(N F(y)^{N−1})] = log N + (N−1) E[log U | U ∼ Beta(N,1)] = log N + (N−1)(−1/N) = log N − (N−1)/N, using E[log U] = −1/N for Beta(N,1). Ties and discrete scores make the bound an upper limit.
</details>

> **Assumption.** Draws for a prompt are independent given σ · *sensitivity:* engines that share a prefix across n samples make draws conditionally independent given the prompt but not given the batch (R11.15's batch-invariance warning); the geometric expectation of Eq. 11.6 still holds in expectation but per-batch acceptance counts are correlated.

## Mechanism

**Execution checks.** The strongest predicate runs the candidate. For code, SWE-bench's harness applies a candidate patch to a repository snapshot in a container and requires the `FAIL_TO_PASS` tests to pass and the `PASS_TO_PASS` tests to keep passing (PAPER-REPORTED · P42; OFFICIAL-DOCUMENTATION · R11.18); Llama 3 reports generating unit tests and executing candidate code with "static and dynamic analysis techniques" in containers, using failures to trigger self-correction (PAPER-REPORTED · R11.6). For tool trajectories, τ-bench compares the final database state to an annotated goal state (PAPER-REPORTED · P43). Execution has low α when the tests are adequate and a β that rises with environment flakiness (timeouts, non-determinism) — which is why VER's verdict vocabulary carries `error` and `timeout` separately from `fail`. Cost line: a container start plus test runtime per draw; for repository-level tasks this is seconds to minutes of CPU per candidate and can exceed the generation cost; the harness state (images, caches) is a fixed cost amortised over draws.

**Symbolic checks.** Exact or normalised matching of a final answer against a reference — the STaR predicate, the RLVR predicates of Tulu 3 for GSM8K/MATH-style answers and IFEval-style constraint checks (PAPER-REPORTED · P29), and the rule-based part of R1's reasoning filter (PAPER-REPORTED · P26). α is non-zero whenever the reference admits multiple correct surface forms or the match ignores the reasoning (a wrong rationale that reaches the right answer passes; STaR names exactly this risk, PAPER-REPORTED · R11.4); β is non-zero whenever normalisation fails (units, formatting, `\boxed{}` conventions — the R1 model card's recommended math directive "put your final answer within \boxed{}" exists to lower β; OFFICIAL-DOCUMENTATION · R11.17). Cost line: negligible compute per draw; the cost is the reference's construction and the matcher's maintenance.

**Human review.** The reference predicate for anything without an executable truth. Llama 2 used humans to write demonstrations and to compare pairs; Llama 3 added strength levels and an edit step (PAPER-REPORTED · R11.5, R11.6); R1's cold-start data were "refin[ed] through post-processing by human annotators" and, in the v2 rendering, passed through "a second round of human verification" (PAPER-REPORTED · P26). Human α and β are population properties and must be measured by inter-annotator agreement — the disagreement analysis below applies to humans as much as to models. Cost line: human time per item, which is money and latency; the resource ledger records it as such; no figure is attributable here (NOT-DISCLOSED for every cited corpus).

**Model judges.** A language model asked to accept or reject. Constitutional AI's feedback model compares two responses under a sampled principle to produce preference labels, and its RL stage trains a preference model "from this dataset of AI preferences" (PAPER-REPORTED · P22); R1's generative reward model judges a prediction against the ground truth (PAPER-REPORTED · P26); UltraFeedback scores completions on four aspects with GPT-4 (PAPER-REPORTED · R11.10). A judge's α and β are not fixed numbers: they depend on the prompt distribution, on whether the judge shares a base with the generator (§11.4 coupling), and on the rubric. Constitutional AI reports that its 52B model's critiques "were sometimes reasonable, but often made inaccurate or overstated criticisms" while revisions were "generally more harmless" (PAPER-REPORTED · P22) — a judge that is useful as a *reviser* while unreliable as a *critic*, which is a statement about α and β varying by task. Cost line: one prefill over (prompt, candidate[s], rubric) per verdict, ≈ 2N_J FLOPs per token for a judge of N_J parameters; chain-of-thought judging adds decode tokens.

**Rejection sampling.** The procedure of Eq. 11.5 with any of the above as V. Three reported instantiations fix the design space. Llama 2: K outputs from the current policy, the reward model selects the best, the selected outputs become "the new gold standard"; rejection sampling was performed only with the 70B model and "all smaller models are fine-tuned on rejection sampled data from the larger model, thus distilling the large-model capabilities"; from RLHF-V4 onward PPO was applied "on top"; restricting to the latest iteration's samples caused regressions so "top-performing samples from all prior iterations" were included (PAPER-REPORTED · R11.5). Llama 3: "K (typically between 10 and 30) outputs from the latest chat model policy", reward-model selection, and a paged-attention serving path that the authors report gave "a throughput improvement of over 2×" during rejection sampling (PAPER-REPORTED · R11.6; the 2× is the authors' figure for their serving stack and is not transferable). DeepSeek-R1: rejection sampling from an RL checkpoint with rule and judge predicates, readability filters, ≈600k retained reasoning rows, ≈200k non-reasoning rows, two SFT epochs; the same 800k rows distilled six Qwen2.5 and Llama3 students by SFT alone with "no RL" (PAPER-REPORTED · P26; OFFICIAL-DOCUMENTATION · R11.17). Under Eq. 11.8, all three tilt the retained prompt marginal toward prompts the policy already solves; none of the three reports its per-prompt acceptance distribution (NOT-DISCLOSED), so the tilt cannot be quantified from the papers. Cost line: K draws per prompt plus K verifications; by Eq. 11.6 the expected cost per kept sample is (c_gen + c_V)/p_acc; the *aggregate* tokens drawn is K × prompts × mean completion length, of which the fraction p̂_acc is retained.

**Disagreement analysis.** Because every predicate errs, a selection pipeline should run at least two on a common audit sample and report their confusion. The analysis has three outputs: pairwise agreement and κ (which bound how different the two retained sets can be); the confusion of each cheap predicate against the strongest (execution or human) on the audit sample, which estimates α and β for Eq. 11.9; and the *conditional* disagreement by prompt stratum (difficulty, domain, length), which locates where a judge fails. Tulu 3's report that rejection sampling and online DPO "did not reliably improve" its models (PAPER-REPORTED · P29) is the kind of negative result that a disagreement analysis explains or fails to explain: if the reward model used for selection disagreed with the downstream evaluator on the prompts that mattered, selection cannot help. Cost line: the audit sample costs the strongest predicate's price times the sample size; at 1,000 items with human review this is the dominant selection-pipeline cost after generation, and it is paid once per (generator version, predicate version) pair.

## Algorithm

```text
Algorithm 11.3 — Budgeted rejection sampling with recorded acceptance and audit
INPUT   prompt set D with per-prompt weights; generator π with controls σ; predicate V
        (with verdict vocabulary {pass, fail, error, timeout}); draw budget K per prompt;
        per-prompt retention cap c; audit predicate V* and audit sample size n_a
OUTPUT  retained set R (VER rows converted to RESP/RAT with semantics
        "rejection_sampled:V"); acceptance table; audit confusion
STATE   per-prompt counters (drawn, pass, fail, error, timeout, retained)
INVARIANT  retained(x) ≤ c; every retained row cites V's evidence; cost ledger counts
           every draw, including error/timeout draws
1  For each x in D:
2     draw y_1..y_K ~ π(·|x; σ) with recorded seeds (Algorithm 11.1)
3     for each y_k: v_k ← V(x, y_k); increment the counter for v_k
4     A ← {y_k : v_k = pass}; if |A| > c, subsample A to c by a recorded rule
5     emit each y in A as a row with evidence(V), p̂_acc(x) = pass/K, draws = K
6  Draw an audit sample of n_a (x, y) pairs stratified by verdict and by p̂_acc(x) quantile
7  Run V* on the audit sample; tabulate the 2×2 confusion of V against V*; estimate α̂, β̂
8  Report: corpus p̂_acc; histogram of p̂_acc(x); the retained prompt marginal versus D
      (Eq. 11.8 tilt); precision estimate by Eq. 11.9 using α̂, β̂ and the base rate p̂_acc;
      total draws, tokens, verification cost; error/timeout rates
```

DERIVED — complexity: K·|D| generator calls and K·|D| predicate calls plus n_a audit calls; cost = Σ_x K(c_gen(x) + c_V(x)) + n_a c_{V*}. Termination: K and n_a are finite. The cap c in line 4 bounds Eq. 11.8's tilt; setting c = K reproduces keep-all, c = 1 keep-one. Line 8's histogram is the input to §11.4's coverage-collapse detector and §11.6's useful-samples-per-cost accounting.

## Implementation

Selection is a generation workload followed by a verification workload, and the reference stack separates them. Generation runs on vLLM (#41, *Inference engine*) or SGLang (#42, *Inference engine*) with `n = K` samples per prompt (OFFICIAL-DOCUMENTATION · R11.15). Post-training frameworks fold selection into their rollout loop: OpenRLHF (#36, *Post-training / RL*) documents "dynamic filtering" that, "for each prompt, generate[s] multiple responses and filter[s] them by your reward/agent 0–1 scores signal", running generation on vLLM inside a Ray-scheduled actor layout, and states that "RLHF training spends 80% of the time on sample generation" (OFFICIAL-DOCUMENTATION · R11.14; the 80% is the project's own characterisation, not a measurement of this book, and is workload-dependent). verl (#37, *Post-training / RL*) documents rollout with vLLM and SGLang backends and a reward/verification stage that can call executed checks and tool environments (OFFICIAL-DOCUMENTATION · R11.12, R11.13). For offline rejection sampling that produces an SFT set rather than an RL batch, the retained rows are written in TRL's prompt-completion type (OFFICIAL-DOCUMENTATION · R11.11) with the provenance and `label_semantics` columns of §11.2. Execution predicates run in sandboxed containers outside the training stack; the SWE-bench harness is one documented example, Docker-based, invoked as `swebench eval <dataset> -p <predictions> --run-id <id> -j <workers>` (OFFICIAL-DOCUMENTATION · R11.18). Under the §4.2 dimensions this section touches *Post-training* (online generation, actor/reward placement), *Inference* (batched sampling with n > 1), *Reliability* (timeouts and errors in the verifier are outcomes, not exceptions), and *Reproducibility* (predicate version, harness image hash, judge model version are part of every retained row's evidence).

```text
Systems trace (one rejection-sampling round)
generate K per prompt   → compute: 2N_T FLOPs × K × completion tokens / memory: K × KV / failure: unseeded sampling
verify (execution)      → compute: CPU per container × K / latency: test runtime / failure: timeout counted as fail
verify (judge)          → compute: 2N_J FLOPs × (prompt + candidate + rubric) tokens × K / failure: judge–generator coupling (§11.4)
audit                   → cost: n_a × strongest predicate / failure: audit not stratified by p̂_acc
retain + serialise      → storage: retained rows + acceptance table / failure: evidence field empty
```

## Experimental design

### Experiment 11.3 — Precision of judge-filtered versus execution-filtered sets

- **Hypothesis:** on a code task with executable tests, a judge-filtered set has lower precision (Eq. 11.9, measured against execution) than its acceptance rate suggests, and the gap grows as the generator's base rate p falls.
- **Setup:** one generator, K = 16 draws per prompt over prompts binned by execution-measured p̂_acc; two predicates — execution (V*) and a model judge (V); precision of V's retained set measured against V* per bin.
- **Independent variables:** prompt bin by p; judge model (two judges, one sharing the generator's base and one not).
- **Controlled variables:** generator, σ, K, prompts, test harness image.
- **Dataset/workload:** repository-level or function-level code tasks with hidden tests; ≥ 500 prompts.
- **Hardware:** generator and judge on one accelerator class; verification on CPU containers; hours logged for both.
- **Metrics:** α̂, β̂ per bin; precision per bin with §6.4 intervals over prompts; cost per retained-and-correct sample by Eq. 11.6 with c_V measured.
- **Baselines:** execution-filtered set (precision 1 by construction against V*, modulo harness flakiness measured by repeated runs).
- **Expected result:** precision of the judge-filtered set falls with p; the judge sharing the generator's base shows higher α on the generator's own errors.
- **Ablation:** chain-of-thought judging versus direct verdict.
- **Interpretation:** the bin where judge precision drops below a declared threshold is the regime where judge filtering must be replaced or audited.
- **Threats to validity:** test adequacy (α of execution itself is not zero); prompt-bin assignment uses the same executions.

Proposal only; no run was executed. The chapter's main verification, [Experiment 11.7](verification.md), compares unfiltered, verifier-filtered, and diversity-controlled sets on a student.

## Observations

**What the paper claims.** R11.5 claims rejection-sampling fine-tuning with a reward-model selector, alone until RLHF-V4 and then with PPO, improved Llama 2-Chat across iterations, and that the max-minus-median reward gap grows with the number of samples. R11.6 claims K between 10 and 30 with reward-model selection and execution-verified code data. P26 claims that ≈600k rejection-sampled reasoning rows plus ≈200k others suffice for SFT of the base and for distillation into six students. R11.4 claims bootstrapped rationales lift GPT-J from 60.0% (direct fine-tune) to 72.5% on CommonsenseQA and from 5.8% to 10.7% on GSM8K. P29 claims rejection sampling did not reliably help its recipe.

**What the evidence shows.** The four positive claims come from four different generators, selectors, students, and evaluations; none is a controlled comparison of *selection* against *no selection at matched tokens*, which is the comparison Experiment 11.7 specifies. The negative result in P29 is reported without the acceptance statistics needed to diagnose it. STaR's per-iteration retraining from the original model is a design choice the authors justify by overfitting avoidance, not by an ablation reported in the pages inspected.

**What we infer.** DERIVED: Eq. 11.8 predicts that keep-all rejection sampling shifts the prompt marginal toward easy prompts by a factor proportional to p_acc(x); the regression that R11.5 observed when restricting to the latest iteration is consistent with a shifting acceptance region, though the paper does not attribute it so (this is the book's inference, not the authors'). DERIVED: Eq. 11.9 implies that judge filtering at low base rates yields retained sets with a material wrong fraction even for accurate judges. ASSUMED: independence of draws.

**What remains unknown.** Per-prompt acceptance distributions for every cited corpus: NOT-DISCLOSED. The false-positive rate of R1's DeepSeek-V3 judge against a stronger check: NOT-DISCLOSED. Whether Llama 3's reported 2× serving throughput during rejection sampling transfers to any other stack: UNVERIFIED and not to be extrapolated. The share of R1's 600k rows that came from rule versus judge predicates: NOT-DISCLOSED.

## Failure modes

> **Failure mode — Easy-prompt tilt.** *Symptom:* the student improves on easy items and stalls or regresses on hard ones. *Cause:* keep-all rejection sampling (Eq. 11.8). *Detection:* histogram of p̂_acc(x) of retained rows versus prompt set; retained mass concentrated at high p̂_acc. *Mitigation:* per-prompt cap c; re-weight by 1/p̂_acc(x) with variance control; keep hard prompts as INSTR rows for RL.

> **Failure mode — Judge precision collapse at low base rate.** *Symptom:* a "verified" set turns out to contain many wrong answers on audit. *Cause:* Eq. 11.9 with small p. *Detection:* audit confusion (Algorithm 11.3 lines 6–7). *Mitigation:* execution or symbolic predicate where available; raise the base rate by better prompting before filtering.

> **Failure mode — Timeout counted as failure.** *Symptom:* long-running correct solutions are systematically rejected; the set favours short programs. *Cause:* verifier `timeout` mapped to `fail`. *Detection:* timeout rate per completion-length bin. *Mitigation:* separate verdicts; re-run timeouts with a larger budget; record the budget.

> **Failure mode — Selector–evaluator disagreement.** *Symptom:* selection improves the selector's score, not the downstream evaluation. *Cause:* the reward model or judge used as V disagrees with the evaluator on the prompts that matter. *Detection:* disagreement analysis between V and the evaluator on an audit sample. *Mitigation:* choose V aligned with the evaluation's construct, or report the gap as the expected ceiling.

> **Failure mode — Rationalised rationale.** *Symptom:* the student produces confident invalid reasoning ending in the reference answer. *Cause:* hint-conditioned rationalization rows (R11.4) trained with `answer_verified` semantics. *Detection:* process-level spot audit of `rationalized:hint_given` rows. *Mitigation:* keep the semantics distinct; cap their share.

## Siblings

**Best-of-N at inference** — [§38.2 Candidate aggregation](../../../vol-02-execution-and-optimization/part-07-inference-algorithms-distillation-and-compression/ch38-inference-time-reasoning-search-and-adaptive-compute/38-2-candidate-aggregation.md)
Why it exists: spend samples at test time instead of training time. What assumption changed: the selector is available at serving. What objective changed: none; the policy is unchanged. What problem it solved: no training run. New failure mode: per-request cost multiplies by N. Changed primitive: retained data → retained answer.

**RL with verifiable rewards** — [§35.1 RLVR formulation](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-1-rlvr-formulation.md)
Why it exists: use V as a reward, not a filter. What assumption changed: rejected samples carry signal (negative advantage) instead of being discarded. What objective changed: Eq. N.6 with R = V. What problem it solved: STaR's "no signal from failures". New failure mode: reward exploitation (§32.6). Changed primitive: filter → gradient.

**Reward-model training** — [§32.3](../../../vol-02-execution-and-optimization/part-06-post-training-and-reinforcement-learning/ch32-preferences-reward-models-verifiers-and-oversight/32-3-reward-model-training.md)
Why it exists: learn V from PREF rows. What assumption changed: V is a model with α, β that vary with the input distribution. New failure mode: over-optimisation against V. Changed primitive: executed predicate → learned scorer.

**Model-as-judge evaluation** — [§62.3](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch62-human-preference-model-judges-and-uncertainty/62-3-model-as-judge.md)
Why it exists: score a fixed set. What assumption changed: the judge does not shape the training distribution. New failure mode: judge biases in reported scores (§62.4). Changed primitive: filter → metric.

**Evaluation contamination checks** — [§8.5](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md)
Why it exists: reject rows that leak test items. What assumption changed: the predicate is about membership, not quality. Changed primitive: correctness gate → overlap gate; both belong in the gate DAG of the chapter artifact.

## Extensions

Domain adaptation changes V (a domain-specific harness) and therefore α, β; re-run the audit per domain. Long-context candidates raise c_V for judges (prefill over the whole candidate) and raise timeout rates for execution. Multimodal outputs need rendered-output verifiers; α, β are NOT-DISCLOSED for any such verifier here. Agent trajectories replace V(x, y) with a terminal-state check and add censoring (§11.5). Proposal: publish, with every rejection-sampled dataset, its acceptance table and audit confusion as part of the dataset record.

## Limitations

Eq. 11.5–11.10 assume a fixed generator during a round; iterated rounds (STaR, Llama 2 V1–V5) change π and therefore p_acc between rounds, and the section's per-round analysis must be re-applied. Eq. 11.10 assumes a continuous, tie-free score. Eq. 11.9 treats α, β as constants across prompts; they are not, which is why the audit is stratified. Falsification: a matched-token comparison in which unfiltered generator output trains a student as well as the verifier-filtered set (Experiment 11.7, arm A versus B) would demote selection from a quality lever to a cost lever for that generator and task. Decision consequence: no "filtered" dataset is accepted in this book without its predicate, acceptance table, and audit confusion.

## Reproducibility

Versions: R11.5 arXiv 2307.09288 (HTML rendering, §3.1, §3.2.3, Fig. 7); R11.6 arXiv 2407.21783 (HTML, §4); P26 arXiv 2501.12948 v1 §2.3.3, §2.4 and v2 (HTML); R11.4 arXiv 2203.14465 v2 (PDF, Algorithm 1, Tables 1–2); P22 arXiv 2212.08073 (PDF, §3.5, §4); P29 arXiv 2411.15124 (HTML); R11.10 arXiv 2310.01377 (abstract); P42/R11.18 SWE-bench (abstract; repository README); P43 arXiv 2406.12045 (HTML); R11.14 OpenRLHF README; R11.12/R11.13 verl docs; R11.15 vLLM `SamplingParams`; R11.17 DeepSeek-R1 repository; all accessed 2026-09-23. Artifacts: the gate DAG and acceptance-table schema in [verification.md](verification.md). Metric definitions: acceptance rate, precision (Eq. 11.9), κ. Unresolved: acceptance distributions and judge error rates of cited corpora (NOT-DISCLOSED).

## References

P22, P26, P29, P42, P43; R11.1, R11.4, R11.5, R11.6, R11.10, R11.11, R11.12, R11.13, R11.14, R11.15, R11.17, R11.18; notation.md §2.5.
