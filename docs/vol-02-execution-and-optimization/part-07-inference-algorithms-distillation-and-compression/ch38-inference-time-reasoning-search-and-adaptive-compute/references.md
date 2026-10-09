---
id: "ms.references.38"
entity_type: "references"
title: "Chapter38 references"
short_title: "Chapter38 references"
volume: 2
part: 7
chapter: 38
section: null
slug: "references"
parent: "ms.chapter.38"
prev_sibling: "ms.verification.38"
next_sibling: null
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
word_count_target: 1600
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---

# Chapter38 references

[DERIVED] **Evidence window:** original publication/release2025-12-01 through2026-10-09 inclusive. All10 canonical primary artifacts below first appeared in2026:10/10=100%. An older checkpoint, dataset or classical mechanism can be an object inside an eligible2026 study; that does not admit the older originating paper or imply that the mechanism was invented in2026. Access and conference dates do not replace original dates. All listed primary texts were actually inspected on2026-10-09 before detailed attributed claims.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R38.1 | paper | Adaptive Test-Time Compute Allocation for Reasoning LLMs via Constrained Policy Optimization | Zhiyuan Zhai; Bingcong Li; Bingnan Xiao; Ming Li; Xin Wang | arXiv /2026 | https://arxiv.org/html/2604.14853v1 | Claimed AdaCompute-LLM URL unavailable when inspected; see note | preprint |2026-10-09 | §§2–5; AppendicesB.4,C.4,E.1–E.4,F,H: oracle, expected-budget routing, source duality/slack limits |
| R38.2 | paper | Learning When to Think: Adaptive Reasoning for Test-Time Compute Allocation | Gijs Kassenaar; Zhao Yang; Vincent François-Lavet | arXiv /2026 | https://arxiv.org/html/2608.20256v1 | NOT-DISCLOSED immutable run pin | preprint |2026-10-09 | Method; AppendicesA–D; Eq8; Tables3–5: mode reward, warmup, train/evaluation caps, OOD failures |
| R38.3 | paper | Adaptive Parallel Monte Carlo Tree Search for Efficient Test-time Compute Scaling | Hongbeen Kim; Juhyun Lee; Sanghyeon Lee; Kwanghoon Choi; Jaehyuk Huh | arXiv /2026 | https://arxiv.org/html/2604.00510v1 | NOT-DISCLOSED AP-MCTS implementation pin | preprint |2026-10-09 | §§2–5; AppendicesA–B; Table1: WU-PUCT, proxy pruning, scheduling and quality/throughput tradeoff |
| R38.4 | paper | Next Thoughts Are Distributions: Generative Autoregressive Reasoning in the Latent Space | Yang Li; Yi Wang; Shiyuan Huang; Yang Liu; Hao Wang; Chengzhi Mao | arXiv /2026 | https://arxiv.org/html/2609.33271v1 | NOT-DISCLOSED immutable ATF run pin | preprint |2026-10-09 | §§3–4; AppendicesA–F; Table1: CR-VAE, flow updates, surrogate ratios, matched Qwen comparisons, profiling boundary |
| R38.5 | paper | Latent Recurrent Thoughts: Recurrent Refinement of Proposed Latents for Reasoning with Frozen LLMs | Zhaoliang Chen; Jie Fu | arXiv /2026 | https://arxiv.org/html/2609.01117v1 | https://github.com/czl-david/latent-recurrent-thoughts/tree/1113bfbb12de8a9d4703f98a37eef2ffcc566a7c | preprint |2026-10-09 | §§3–4; AppendicesA–C,E,I,K; Table3; pinned modules/decoder/train source inspection |
| R38.6 | paper | What pass@k Cannot Measure: Evaluating Diversity and Capability Retention after Post-Training | Subham Rath; Raj Dandekar; Rajat Dandekar; Sreedath Panat | arXiv /2026 | https://arxiv.org/html/2610.07405v1 | NOT-DISCLOSED immutable experiment pin | preprint |2026-10-09 | §§2–5; Table2: coverage versus diversity, seed/bootstrap boundary and limited scale |
| R38.7 | paper | Reasoning Concentrates Errors, and Self-Consistency Never Notices | Asaad Althoubi | arXiv /2026 | https://arxiv.org/html/2609.32035v1 | NOT-DISCLOSED official release pin | preprint |2026-10-09 | §§3–8; AppendicesA,B,D,H: wrong-answer collision, weighting, matched pairs, multiplicity and rescuerate limits |
| R38.8 | technical report | Kimi K2.5: Visual Agentic Intelligence | Kimi Team / Moonshot AI | arXiv /2026 | https://arxiv.org/html/2602.02276v2 | https://github.com/MoonshotAI/Kimi-K2.5 ; run pin not inspected | preprint |2026-10-09 | §§3,5.2; AppendixE.8; Table6: PARL, critical steps, agent budgets and unmatched-total-compute boundary |
| R38.9 | technical report | GPT-6 Astra System Card | OpenAI | Official safety disclosure /2026 | https://deploymentsafety.openai.com/gpt-6-astra/protocolqa-open-ended | NOT-DISCLOSED internal implementation | official documentation |2026-10-09 | §§9.1,9.2.1–9.2.2; Figures28–30; changelog: controllability versus faithfulness and undisclosed internals |
| R38.10 | paper | On the Power of (Approximate) Reward Models for Inference-Time Scaling: Sequential Monte Carlo and Beyond | Youheng Zhu; Yiping Lu | ICML; PMLR306:167409–167458 /2026 | https://arxiv.org/html/2602.01381v1 ; official venue https://proceedings.mlr.press/v306/zhu26ae.html | NOT-DISCLOSED empirical implementation; theoretical study | peer-reviewed |2026-10-09 | §§3–6; Theorem5.1; AppendixE.6: approximate twists, SMC target/output-law bound; optionalE.10 rates not admitted |

## Original-date and inspected-version ledger

[DERIVED] Original timestamps below were checked against arXiv submission histories, rather than inferred from identifier prefixes. The ICML classification of R38.10 is verified by the official PMLR record, not by an arXiv keyword. Detailed theory inspection used arXivv1; the conference archive's complete PDF was not separately re-audited. Other author-reported venue/workshop labels do not change their typed preprint status.

| Record | Original release | Inspected version | Date/version boundary |
|---|---|---|---|
| [R38.1] |2026-04-16T10:39:22UTC | arXivv1 | Only displayed version; later access does not repair theorem premises |
| [R38.2] |2026-08-20T16:54:08UTC | arXivv1 | v2August21 exists; v2 changes are not silently attributed to inspectedv1 |
| [R38.3] |2026-04-01T05:52:38UTC | arXivv1 | ICML-style template/keyword is not a verified venue record |
| [R38.4] |2026-09-27T06:26:32UTC | arXivv1 | Source-reported latent experiments are not an independently executed reproduction |
| [R38.5] |2026-09-01T11:56:17UTC | arXivv1 plus author code commit below | Companion code commit is later than original paper and is separately identified |
| [R38.6] |2026-10-05T21:16:32UTC | arXivv1 | Author-reported nonarchival workshop status is not main-conference peer review |
| [R38.7] |2026-09-25T22:03:14UTC | arXivv1 | No claim about uninspected future revisions |
| [R38.8] |2026-02-02T16:17:38UTC | arXivv2,2026-08-07T05:09:52UTC | Original eligibility remains February2; result locators refer tov2 |
| [R38.9] |2026-09-03 | Unpinned official web card accessed2026-10-09; visible changelog throughSeptember29 | Mutable web page; no immutable card hash or undocumented internals inferred |
| [R38.10] |2026-02-01T18:28:42UTC | arXivv1; official PMLR metadata inspected | HTML compilation date and July6–11 proceedings date do not replace February1 original |

## Precise source boundaries and inconsistencies

[DERIVED] **R38.1 expected-budget theory.** AppendixC.4's deterministic integral-vertex claim is contradicted by the finite one-task example in §38.4: actions(cost1,utility0) and(cost3,utility1), budget2. The deterministic optimum is0; randomization and the dual reach0.5. AppendixE.3 actually mixes policies associated with adjacent prices. AppendixB.4/Theorem3 drops a price-times-budget-slack term; Eq38.17 retains it. A perfect imitator of an arbitrary feasible price-oracle need not maximize utility at the requested budget. Neither counterexample is attributed as the source's own correction. The source's binary-search oracle points can also slightly overshoot requested budgets. The48-response pools and features have preparation cost and shared-record dependence.

[DERIVED] **R38.2 mode protocol.** AppendixC specifies a16384 global context/response boundary; NoThink and Short have1024/3000 training caps. Uncapped-within-global evaluation differs from the training intervention. The main warmup description, Algorithm1 and AppendixB disagree on forced-per-mode counts. Rounded discount factors produce a different numerical crossover from the unrounded Eq8 construction. Promotion of a mode instruction from the prompt tail to response head is a distribution intervention. The OOD Countdown collapse is retained as a negative finding. NoThink is a mode name, not a proof of zero reasoning.

[DERIVED] **R38.3 proxy and scheduler.** Minimum/product prefix futility bounds only immutable proxy reductions in[0,1]. Selective futility uses empirical first-score correlation, not an all-descendant correctness guarantee. The source quota normalization needs a zero-total fallback and a feasibility rule when active jobs exceed worker slots; the book's strengthened controller states these rather than asserting an inspected implementation already does. AMC/Qwen accuracy65.0 versus72.5 is not erased by a serving-speed headline. Beam8 is near-accuracy matched, not compute matched.

[DERIVED] **R38.4 scores and resources.** AppendixA's dimension-averaged Gaussian transition score exponentiates to a dimension-root density ratio when variance is fixed; it is not the full ratio. The raw squared-error option changes the weighting further. Neither scores completed latent marginal probability. The Table1 Qwen comparisons are matched more closely than reused LLaMA baseline numbers; AppendixE's profiling is a separate timing boundary with24 flow-head evaluations per thought. A decoded CR-VAE reconstruction is not causal proof of the answer mechanism. Math-Verify0.9.0 rescoring applies to saved outputs, not a replacement generation protocol.

[DERIVED] **R38.5 paper/code alignment.** A frozen decoder still propagates activation gradients into latent modules. Training32 slots and inference4 slots is an explicit shift. The drift penalty is soft, not a hard bound. Table3's proposer/refiner factorial is more informative than attributing the combined method's entire gain to recurrence. The inspected training code recomputes the frozen proposer per batch; it does not establish the persistent offline cached-base pipeline described in prose. Requirements ranges do not establish the exact experiment environment.

[DERIVED] **R38.6/7 measurement.** Coverage estimates do not measure semantic diversity or new capability. R38.6's confidence-interval overlap is not a proof of exact equivalence, and its small-model task/seed boundary is retained. R38.7's wrong-answer collision concerns the categorical distribution conditional on a wrong answer; it does not by itself prove non-independent sampling. Its matched reasoning/nonreasoning comparison has only two weight pairs. Weighted-selector multiplicity and OOD failures matter. Its earlier gain headline was withdrawn after headroom normalization, so that headline is not used as evidence.

[DERIVED] **R38.8/9 disclosed systems.** Kimi's critical-step metric uses the maximum subagent depth within a stage; it is not aggregate accelerator work or measured wall time. Agent-swarmed and single-agent rows do not isolate concurrency at matched total compute. The OpenAI controllability suite concerns ability to follow instructions about exposed traces under its declared length/task conditions. It does not reveal the model architecture or prove faithfulness, intentional obfuscation or a causal role for any displayed thought.

[DERIVED] **R38.10 conditional theory.** Uniform twist-ratio and multiplicative Bellman bounds are premises, not established LLM-scorer measurements. The finite-$N$ output-law approximation does not guarantee a realized empirical population or correct answers. AppendixE.10's optional stratified-resampling variance expansion appears to carry an extra factor relative to its own averaged-variance definition; no stratified-rate claim is admitted. This note does not purport to certify every proof in the archive.

## Implementation pins and executable gaps

| Primary artifact | Actual inspected surface | Scope and limitation |
|---|---|---|
| LRT author code | Commit1113bfbb12de8a9d4703f98a37eef2ffcc566a7c, GitHub commit timestamp2026-09-24T04:27:28UTC | Static source inspection only; no training or inference execution |
| LRT modules | `lrt/modules.py`, lines232–248 in stored inspected text |40 detached recurrence passes followed by5 differentiated passes; residual output |
| LRT decoder | `lrt/decoder.py`, line76 and165–196 | Frozen parameter flags plus prefix no-grad/cache and gradient-carrying suffix; not zero activation memory |
| LRT training | `lrt/train.py`, lines218–229 | Frozen proposer is called in the batch path; persistent offline caching not established |
| LRT requirements | Author `requirements.txt` at same commit | Ranges include torch≥2.8 and transformers≥4.57,<4.58; they differ from AppendixK's exact environment listing |
| R38.1 claimed repository | https://github.com/zhiyuanZhai20/AdaCompute-LLM | Returned404 on inspection2026-10-09; implementation unavailable/UNVERIFIED, not a checked executable |
| Other implementation/model artifacts | Source-specific tables in38.1–38.6 | A reported model name or software version is not an immutable weight, tokenizer, processor or environment hash |

[PAPER-REPORTED] R38.5 AppendixK lists torch2.11.0+cu128, transformers4.57.6, accelerate1.10.1, einops0.8.1, xformers0.0.35, numpy2.4.4, scipy1.16.2, scikit-learn1.7.2, pydantic2.11.7, SGLang0.5.12, flashinfer0.6.11.post1, flash-attention4beta14 and httpx0.28.1. These are paper-reported pins, not this edition's installed environment or a confirmed compatible lockfile. R38.7 reports vLLM0.27.1. Exact container, driver, checkpoint and raw-record hashes remain required reproduction inputs where not disclosed.

## Exclusions and unresolved evidence

[DERIVED] The plan's historical anchors2408.03314 and2305.20050, and originating self-consistency/tree-search/classical Monte Carlo papers before the window, are excluded as cited evidence. Their mathematical ideas are reconstructed with explicit premises; no later proceedings, revision or access date launders their original dates. Search-discovered AAAI/ECCV/CVPR and prior EMNLP/ICCV leads were not admitted without full-method and original-history confirmation. Discovery results are not supporting references.

[UNVERIFIED] Missing raw trajectories, source-specific immutable configurations, unavailable implementation details and unmeasured hosted-model physical costs remain gaps. They are neither estimated silently nor filled with inferred provider internals. Source-specific reported observations and book-derived analytical examples remain separately labeled throughout the chapter.
