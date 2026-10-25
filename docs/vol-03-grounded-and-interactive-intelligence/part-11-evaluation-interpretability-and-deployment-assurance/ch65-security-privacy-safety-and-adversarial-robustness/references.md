---
id: ms.references.65
entity_type: references
title: "Chapter 65 primary evidence ledger"
volume: 3
part: 11
chapter: 65
section: null
slug: references
parent: ms.chapter.65
prev_sibling: ms.verification.65
next_sibling: null
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.24, ms.chapter.32, ms.chapter.33, ms.chapter.34, ms.chapter.35, ms.chapter.36, ms.chapter.46, ms.chapter.47, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64]
downstream: [ms.chapter.66]
related: [ms.chapter.30, ms.chapter.42, ms.chapter.48]
relations: []
axes: {lifecycle: [pretraining, post_training, inference, evaluation, assurance], mechanism: [security_boundary, privacy_accounting, adversarial_evaluation], feedback_setting: [], modality: [text, code, image, tool_trajectory]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Chapter 65 - Primary evidence ledger

[PAPER-REPORTED] Nine retained research disclosures first appeared within 2026-03-01 through 2026-10-24: seven arXiv reports and two dated originating technical disclosures. Actual access/inspection was 2026-10-25. Unversioned arXiv histories were rechecked: AutoMIA v2, Whack-a-Mole v5, Adaptive Adversaries v2 and WIFA v2 are the latest eligible revisions; the other three inspected records have v1. Conservative preprint status does not treat an arXiv venue comment as independent publication verification.

[OFFICIAL-DOCUMENTATION] July 28protocol documentation and one exact originating repository commit supplement the research. The protocol page is a version-addressed, mutable website; the commit is immutable identity for the inspected paths. Code inspection was static. No source model, training, attack, private-data processing, production control or benchmark was executed.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R65.1 | documentation | Poisoning Fine-tuning Datasets of Constitutional Classifiers | Chase Bowers; Faizan Ali; John Hughes; Jerry Wei; Fabien Roger; Anthropic Fellows/Anthropic | 2026; first public/dated artifact 2026-04-24 | [originating technical disclosure](https://alignment.anthropic.com/2026/backdooring-classifiers/) | Not pinned or executed here | official documentation | 2026-10-25 | Safeguard training access, trial counts and fixed-set robustness limitations |
| R65.2 | paper | Your LLM Agent Can Leak Your Data: Data Exfiltration via Backdoored Tool Use | Wuyang Zhang; Shichao Pei | 2026; first public 2026-04-07; inspected 2604.05432v1,2026-04-07 | [full text](https://arxiv.org/html/2604.05432v1) | Not pinned or executed here | preprint | 2026-10-25 | Weight/server control, synthetic state, delivery versus exfiltration and analytical multi-turn model |
| R65.3 | paper | Automated Membership Inference Attacks (AutoMIA): Discovering MIA Signal Computations using LLM Agents | Toan Tran; Olivera Kotevska; Li Xiong | 2026; first public 2026-03-19; inspected 2603.19375v2,2026-09-16 | [full text](https://arxiv.org/html/2603.19375v2) | Source implementation not pinned or executed here | preprint | 2026-10-25 | Search budget, known-candidate signals, held-out testing and low-FPR limitations |
| R65.4 | paper | Alignment Whack-a-Mole: Finetuning Activates Verbatim Recall of Copyrighted Books in Large Language Models | Xinyue Liu; Niloofar Mireshghallah; Jane C. Ginsburg; Tuhin Chakrabarty | 2026; first public 2026-03-21; inspected 2603.20957v5,2026-09-15 | [full text](https://arxiv.org/html/2603.20957v5) | Source implementation not pinned or executed here | preprint | 2026-10-25 | Aggregate span coverage, generation budgets, chance floors and erasure/extractability distinction |
| R65.5 | paper | Adaptive Adversaries: A Multi-Turn, Multi-LLM Benchmark for LLM Agent Security | Devina Jain; David Hartmann; Chuan Li | 2026; first public 2026-07-20; inspected 2607.18063v2,2026-09-11 | [full text](https://arxiv.org/html/2607.18063v2) | https://github.com/sofasogood/adaptive-adversaries | preprint | 2026-10-25 | Cross-session adaptation, resource budgets, scorer/state limitations and negative provenance result |
| R65.6 | paper | DP-SelFT: Differentially Private Selective Fine-Tuning for Large Language Models | Haichao Sha; Zihao Wang; Yuncheng Wu; Hong Chen; Wei Dong | 2026; first public 2026-05-17; inspected 2605.17432v1,2026-05-17 | [full text](https://arxiv.org/html/2605.17432v1) | https://anonymous.4open.science/r/DPSelectiveFT/README.md ; not pinned/inspected | preprint | 2026-10-25 | Private selection/composition, heuristic layer ranking, conditional theory and negative utility cell |
| R65.7 | paper | Refusing Intent, Not Form: Wrapper-Based Intent-Group Supervision for LLM Safety | Ping Wu; Haibo Tong; Feifei Zhao; Han Shen; Yu Shi; Yilin Zhao; Sicheng Shen; Guobin Shen; Yun Luo; Yi Zeng | 2026; first public 2026-08-13; inspected 2608.13304v2,2026-10-14 | [full text](https://arxiv.org/html/2608.13304v2) | Source implementation not pinned or executed here | preprint | 2026-10-25 | Shared wrappers, first-position surrogate, v2 selection protocol and multidimensional tradeoffs |
| R65.8 | paper | Safety for Whom? Boundary-Aware Self-Distillation for Controlled LLM Safety Refusal | Alejo Lopez-Avila; Iker Garcia-Ferrero; Jezabel Garcia; Antonio Tiene; Roman Orus | 2026; first public 2026-09-03; inspected 2609.04482v1,2026-09-03 | [full text](https://arxiv.org/html/2609.04482v1) | Source implementation/checkpoints not pinned here | preprint | 2026-10-25 | CE/KL routing, local policy boundary, false-refusal negatives, OOD construction and two-seed sensitivity |
| R65.9 | documentation | Scaling Misuse Detection with Self-Assessment | Yiming Zhang; Chen Xia; Andy Dau; John Wang; James Yu; Bobby Chen; Andreas Terzis; Nicholas Carlini; Erik Jones; Anthropic | 2026; first public/dated artifact 2026-10-16 | [originating technical disclosure](https://safeguards.anthropic.com/2026/self-assessment/) | Production implementation not released/verified here | official documentation | 2026-10-25 | Cached assessment, teacher-relative labels, passive monitoring versus adaptive blocking |
| R65.10 | documentation | MCP Security Best Practices, July 28version | Model Context Protocol | 2026; inspected version-addressed artifact 2026-07-28 | [official versioned guidance](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices) | Documentation, not a tested implementation | official documentation | 2026-10-25 | Confused deputy, token audience, SSRF, scope and secret boundaries |
| R65.11 | documentation | Adaptive Adversaries originating defender/scorer implementation | sofasogood/adaptive-adversaries | 2026; inspected artifact 2026-09-11; commit 87ca4cd334bd2e31622e4be7f375e08e1056c766 | [pinned tree](https://github.com/sofasogood/adaptive-adversaries/tree/87ca4cd334bd2e31622e4be7f375e08e1056c766) | https://github.com/sofasogood/adaptive-adversaries/tree/87ca4cd334bd2e31622e4be7f375e08e1056c766 | official documentation | 2026-10-25 | Static history-key and synthetic memory-leak scoring semantics |

## R65.1

[PAPER-REPORTED] **Poisoning Fine-tuning Datasets of Constitutional Classifiers.** First public/dated disclosure2026-04-24; accessed 2026-10-25. Exact locators: Threat Model; Methods; mutated-trigger and injection-template experiments; Internal Replication; Limitations. [Primary text](https://alignment.anthropic.com/2026/backdooring-classifiers/).

[DERIVED] The clean robustness plots select successful backdoors and the stated stronger baseline settings. Internal trial counts differ from the three-trial open-model studies. Proposed data-review mitigations are not evaluated defenses. The manuscript does not reproduce trigger payloads or generalize the example count into a universal threshold.

## R65.2

[PAPER-REPORTED] **Back-Reveal.** First public 2026-04-07; inspected 2604.05432v1,2026-04-07; accessed 2026-10-25. Exact locators: Sections 3.1,3.4-3.6,4.1,4.4-4.6; Table 8; Figure 4; Appendix B. [Primary text](https://arxiv.org/html/2604.05432v1).

[DERIVED] The abstract's multi-turn wording must be read with Section 4.5's analytical stationary-turn construction and sensitivity/upper-bound qualification. A pipeline delivery table does not measure the final violation event. Equation65.12 is labeled hypothetical mathematical reconstruction rather than source execution; actual composed-system testing remains proposed.

## R65.3

[PAPER-REPORTED] **AutoMIA.** First public 2026-03-19; inspected 2603.19375v2,2026-09-16; accessed 2026-10-25. Exact locators: Section 3; Section 4.1/Table 1; transfer analysis; Appendices A.3-A.7,B.1-B.2.3. [Primary text](https://arxiv.org/html/2603.19375v2).

[DERIVED] Training-selected designs and held-out test scores are distinct. Overall AUC does not specify precision in a rare-membership population. The candidate suffix is known to the attack; this is not unknown-content recovery. Target-specific failures and full search/repair budget remain material.

## R65.4

[PAPER-REPORTED] **Alignment Whack-a-Mole.** First public 2026-03-21; inspected 2603.20957v5,2026-09-15; accessed 2026-10-25. Exact locators: Sections 3-5; Table 1; Appendices A.3-A.4,B.2,B.4,B.6. [Primary text](https://arxiv.org/html/2603.20957v5).

[DERIVED] Aggregate covered positions, longest single-generation spans and merged book blocks are different metrics. Nonzero unrelated-text coverage and a selected book set limit broad extractability claims. The chapter supplies no recovered passages or legal conclusions. Increased extractability is not an exhaustive information-content or training-corpus proof.

## R65.5

[PAPER-REPORTED] **Adaptive Adversaries.** First public 2026-07-20; inspected 2607.18063v2,2026-09-11; accessed 2026-10-25. Exact locators: Sections 3-6; Tables1-3; Appendix B.1-B.6, including history, defender-state and frozen-replay controls. [Primary text](https://arxiv.org/html/2607.18063v2).

[DERIVED] The title's multi-turn language means adaptive cross-session attacker search in the main protocol. Five battles per scenario/pair and output-only frontier tasks constrain risk/ranking claims. Historical competition, frontier evaluation and benign controls differ in protocol/population. No real tool or external-state security result is inferred.

## R65.6

[PAPER-REPORTED] **DP-SelFT.** First public 2026-05-17; inspected 2605.17432v1,2026-05-17; accessed 2026-10-25. Exact locators: Sections2.3-2.4,4.2-4.4; Table 1; Algorithms1-3; Appendices B,F.1-F.2. [Primary text](https://arxiv.org/html/2605.17432v1).

[DERIVED] Uniform synthetic/private risk agreement, loss/noise assumptions and a Gaussian tail term are conditions, not established properties of arbitrary private data. Top-layer ranking does not solve exhaustive subset search. Section 5.1 reports total delta=1e-5; Appendix B states equal synthesis/training deltas. The exact sampled mechanism and full selection/labeling accountant still need executable audit. F.2's tail step needs global bounded loss beyond its displayed in-ball quantifier; uncapped cross-entropy does not qualify. No unsupported leakage accusation or formal replication is made.

## R65.7

[PAPER-REPORTED] **WIFA.** First public 2026-08-13; inspected 2608.13304v2,2026-10-14; accessed 2026-10-25. Exact locators: Sections 3.1-3.3,4-6; Tables2-3; Appendices A.2-A.4,B.2-B.5,C.5-C.6. [Primary text](https://arxiv.org/html/2608.13304v2).

[DERIVED] The current revision states fixed benchmark-selection rules. A critique of an earlier revision must not overwrite that protocol. First-token contrast and teacher-forced intent remain training surrogates. Multiple metrics move in opposite directions; changes in margin and anchor weight are not an isolated one-factor causal study. Source code/training was not executed.

## R65.8

[PAPER-REPORTED] **Safety for Whom.** First public 2026-09-03; inspected 2609.04482v1,2026-09-03; accessed 2026-10-25. Exact locators: Sections 4.1-4.3,6.1-6.3; Appendices A.1-A.4,D.3-D.5,E.2-E.6,F.5-F.8. [Primary text](https://arxiv.org/html/2609.04482v1).

[DERIVED] Two-seed Appendix F.7 is retained as a narrow sensitivity check. OOD boundary construction, unpinned model revisions and available-field averaging limit exact reproduction/comparison. Refusal and unsafe-content scores need not be complements; compare common benchmark sets. The local deployment-policy example does not classify all political content as harmful.

## R65.9

[PAPER-REPORTED] **Self-Assessment.** First public/dated disclosure2026-10-16; accessed 2026-10-25. Exact locators: Methods/Training; Scaling/Production Results; Adaptive Adversarial Evaluation; Limitations and footnotes. [Primary text](https://safeguards.anthropic.com/2026/self-assessment/).

[DERIVED] Teacher-relative detection, passive production use and the separate small blocking test answer different questions. Prefix reuse is not zero overhead; hidden assessments can carry sensitive explanations and correlated errors. The chapter makes no independent production-verification claim.

## R65.10

[OFFICIAL-DOCUMENTATION] **MCP Security Best Practices.** Inspected version-addressed artifact 2026-07-28; accessed 2026-10-25. The specification URL redirects to the current versioned tutorial path. Exact headings: Confused Deputy Problem; Token Passthrough; Server-Side Request Forgery; Scope Minimization. [Official guidance](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices).

[DERIVED] Version-addressed guidance is not an immutable code pin, a claim that all described risks first appeared in July, or implementation conformance. @ms.chapter.51 owns canonical protocol execution; this chapter uses the security invariants.

## R65.11

[OFFICIAL-DOCUMENTATION] **Pinned originating implementation.** Commit87ca4cd334bd2e31622e4be7f375e08e1056c766, dated 2026-09-11; accessed 2026-10-25. Inspected paths: `scenarios/security_arena/agents/defender/agent.py` (`Defender.execute`, conversation history); `scenarios/security_arena/plugins/memleak.py` (`check_success`). [Pinned tree](https://github.com/sofasogood/adaptive-adversaries/tree/87ca4cd334bd2e31622e4be7f375e08e1056c766).

[DERIVED] The caller's conversation-ID assignment controls fresh versus persistent sessions. The scorer's refusal-context exclusion can label an emitted synthetic password as unsuccessful; audit an information-disclosure event separately. These are static code observations, not model execution or full recipe equivalence.

## Evidence boundaries

[DERIVED] Historical foundations are linked to canonical earlier chapters rather than introduced as newly eligible research. Mathematical constructions and proposed controls are explicitly derived. Missing code pins, human adjudication, live attacks, model/training runs, deployed enforcement and complete privacy accounting remain open. Source-specific negative results and contradictions are retained rather than resolved by an unsupported universal claim.
