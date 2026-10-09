---
id: "ms.references.36"
entity_type: "references"
title: "Chapter 36 references"
short_title: "Chapter 36 references"
volume: 2
part: 6
chapter: 36
section: null
slug: "references"
parent: "ms.chapter.36"
prev_sibling: null
next_sibling: null
children: []
prerequisites: ["ms.chapter.11", "ms.chapter.29", "ms.chapter.30", "ms.chapter.34", "ms.chapter.35"]
downstream: ["ms.chapter.38", "ms.chapter.39"]
related: []
relations: []
axes: {"lifecycle": ["post_training"], "mechanism": ["agent_rl", "distributed_rollout"], "feedback_setting": ["environment_return", "verifiable_reward"], "modality": ["text", "image"]}
papers: []
implementations: ["impl.verl"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "ASSUMED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED"], "empirically_observed": false}
word_count_target: 1400
updated_at: "2026-10-09"
editorial_status: manuscript_draft
---


# Chapter 36 references and source ledger

[DERIVED] Access date throughout: 2026-10-09. Admission requires first publication or release between 2025-12-01 and 2026-10-09, inclusive. All seven canonical source families below originated in 2026: 7/7, or 100%. Multiple files of one release are one family. Historical datasets and base checkpoints used by an admitted study remain components of that study; their original publications are not independent admitted references. No conference acceptance is inferred from a manuscript template.

| Key | Type | Work | Organization | Venue | URL | Code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R36.1 | technical report | GLM-5: from Vibe Coding to Agentic Engineering; GLM-5 Team | Z.ai / Zhipu AI / GLM | arXiv | https://arxiv.org/html/2602.15763v1 | https://github.com/zai-org/GLM-5 | preprint | 2026-10-09 | Reasoning versus agent RL, DSDM, TITO, environment pipelines |
| R36.2 | technical report | Kimi K2.5: Visual Agentic Intelligence; Kimi Team | Moonshot AI / Kimi | arXiv | https://arxiv.org/html/2602.02276v2 | — | preprint | 2026-10-09 | PARL, frozen subagents, critical steps, managed environments |
| R36.3 | paper | DeepSeek Elastic Compute (DSec): A Sandbox Infrastructure for Effective Agentic Training at Scale; Jialiang Huang et al. | DeepSeek | arXiv | https://arxiv.org/html/2609.22978v1 | — | preprint | 2026-10-09 | Sandbox backends, composition, recovery, isolated infrastructure experiments |
| R36.4 | paper | SAPO: Single-Rollout Autoregressive Policy Optimization for Agentic Reinforcement Learning; Dayang Liang, Lang Feng, Bo An, Yunlong Liu | Author-affiliated research collaboration; no top-ten-lab affiliation asserted | arXiv | https://arxiv.org/html/2608.19842v3 | — | preprint | 2026-10-09 | Shared causal value readouts, turn targets, matched PPO comparisons |
| R36.5 | paper | Resolving Action Bottleneck: Agentic Reinforcement Learning Informed by Token-Level Energy; Langzhou He et al. | Author-affiliated research collaboration; no top-ten-lab affiliation asserted | arXiv | https://arxiv.org/html/2605.14558v1 | — | preprint | 2026-10-09 | Token-span weighting, reference energy intervention, negative ablations |
| R36.6 | documentation | verl v0.9.1 V1 asynchronous trainer and delta synchronization | verl | Official project release | https://github.com/verl-project/verl/releases/tag/v0.9.1 | https://github.com/verl-project/verl/tree/1876b06d0a3e4e71e06230be10af14492ca8a75b | official documentation | 2026-10-09 | Mode-specific roles, partial rollout, version control, weight-transfer boundary |
| R36.7 | repository | AReaL v2.1.0 asynchronous RL and weight-update controller | AReaL | Official project release | https://github.com/areal-project/AReaL/releases/tag/v2.1.0 | https://github.com/areal-project/AReaL/tree/ecc8b0e4dfb4e3965f67121a5c87866a07c390ae | official documentation | 2026-10-09 | Explicit lag configuration, versioned gateway, request deadlines |

## First dates, inspected versions, and retrieval authority

| Key | Original date authority | Inspected version | Method, experiment and appendix inspection |
|---|---|---|---|
| `R36.1` | [arXiv history](https://arxiv.org/abs/2602.15763v1): 2026-02-17 17:50:56 UTC | v1; later v2 exists, no v2-only claim imported | §§3.2,3.6,4.1–4.2; §6.1; Appendix A Table10 and Appendix B.2–B.4 |
| `R36.2` | [arXiv history](https://arxiv.org/abs/2602.02276v2): first v1 2026-02-02 16:17:38 UTC | v2, 2026-08-07 05:09:52 UTC | §3 PARL, §5.2 Table6/Fig8; Appendix C infrastructure, D unified RL, E.5–E.7 evaluation |
| `R36.3` | [arXiv history](https://arxiv.org/abs/2609.22978v1): 2026-09-19 12:20:26 UTC | v1 | §§2–3 lifecycle/backends; §§4–5 workload/mechanisms; §6 RL co-design; §7 isolation; §§8.1–8.5 setup and results |
| `R36.4` | [arXiv history](https://arxiv.org/abs/2608.19842v3): first v1 2026-08-20 09:43:47 UTC | v3, 2026-09-30 15:16:29 UTC | §§3–4 Eqs1–11; §5 Tables1–2/Figs2–3; Appendix A Algorithm1, B.1 hyperparameters/B.2 templates, C baseline distinctions |
| `R36.5` | [arXiv history](https://arxiv.org/abs/2605.14558v1): 2026-05-14 08:33:02 UTC | v1 | §§3–4 Eqs4–7; §§5.1–5.6 Tables2–3; Appendix A/B estimators; C.1–C.3 implementation, evaluation and signals, Eq16 epsilon |
| `R36.6` | GitHub release API: 2026-09-20T07:24:43Z | full SHA 1876b06d0a3e4e71e06230be10af14492ca8a75b | docs/advance/v1_async_trainer.md; docs/advance/delta_weight_sync.md; verl/trainer/ppo/v1/trainer_separate_async.py, especially _compute_old_log_prob/on_step_end/switch_to_trainer |
| `R36.7` | GitHub release API: 2026-08-25T10:23:59Z | full SHA ecc8b0e4dfb4e3965f67121a5c87866a07c390ae | docs/en/algorithms/async.md; areal/v2/weight_update/controller/controller.py initialize/connect/update_weights/disconnect/destroy |

[OFFICIAL-DOCUMENTATION] Release pins were independently resolved through the projects' GitHub tag-reference APIs and release timestamps. A tag label is accompanied by its full resolved commit because labels can be moved. The inspected source files are linked by immutable SHA below; current `main` and `latest` are not substitutes for them.

- [verl V1 trainer guide](https://github.com/verl-project/verl/blob/1876b06d0a3e4e71e06230be10af14492ca8a75b/docs/advance/v1_async_trainer.md).
- [verl separate-async implementation](https://github.com/verl-project/verl/blob/1876b06d0a3e4e71e06230be10af14492ca8a75b/verl/trainer/ppo/v1/trainer_separate_async.py).
- [verl delta wire contract and measurements](https://github.com/verl-project/verl/blob/1876b06d0a3e4e71e06230be10af14492ca8a75b/docs/advance/delta_weight_sync.md).
- [AReaL asynchronous configuration](https://github.com/areal-project/AReaL/blob/ecc8b0e4dfb4e3965f67121a5c87866a07c390ae/docs/en/algorithms/async.md).
- [AReaL weight gateway controller](https://github.com/areal-project/AReaL/blob/ecc8b0e4dfb4e3965f67121a5c87866a07c390ae/areal/v2/weight_update/controller/controller.py).

## Claim locator map and interpretation boundaries

| Claim family | Exact source locator | Manuscript owner | Boundary preserved |
|---|---|---|---|
| Single-agent records, context and tool boundaries | R36.2 Appendix D/E.6; R36.4 §4.1 and B.2 | §36.1 Mechanism/Implementation | History is observed state, not a disclosed complete world state |
| Frozen-role hierarchical training | R36.2 §3; §5.2 Table6/Fig8 | §36.1 Experimental design; §36.2 Siblings | Only orchestrator trained in PARL; critical steps differ from total work |
| Causal V/Q readout and targets | R36.4 v3 §4.1 Eqs1–3, §4.2 Eqs4–6, §4.3 Eqs7–11; Appendix A | §36.2 Mechanism | Unconstrained difference, not clipped v1 readout, sigmoid or generated value token |
| Token weighting and gauge counterexample | R36.5 §4 Eqs4–7; Appendix C.3 Eq16 | §36.2 Mechanism | Counterexample is book-derived; measured correlation is not a confidence theorem |
| Environments, quota and isolation | R36.3 §§3,5,7 | §36.3 Mechanism/Algorithm | Containers inside QEMU VMs; node admission still required |
| On-demand images and QoS tradeoffs | R36.3 §§8.1–8.5 Figs10–13 | §36.3 Experimental design | Dedicated ten-node tests; production scale and RL integration are separate |
| Actor/learner placement and old-policy residency | R36.6 V1 guide; trainer _compute_old_log_prob | §36.4 Mechanism | Colocated, separate and hybrid-disabled modes differ |
| Versioned weight RPC | R36.7 controller update_weights/connect | §36.4 Implementation | Observed controller contract does not prove end-to-end atomicity |
| Synchronous versus asynchronous corrections | R36.1 §3.2 versus §4.1 Eqs4–5 | §36.5 Mechanism | DSDM is a biased masked surrogate; stop-gradient ambiguity remains |
| Partial trajectories and replay eviction | R36.6 V1 guide partial rollout/off-policy control/recovery | §36.5 Implementation; §36.6 Mechanism | Retained prefix can span versions; drop/refill changes sampling measure |
| Replay versus live continuation | R36.3 §6 | §36.6 Mechanism | Command log reuses results; snapshots do not rewind external services |
| Weight traffic and measured synchronization | R36.6 delta guide wire contract/measured results | §36.4 Experimental design | Per-sync component measurement; no universal end-to-end speedup |

## Version changes and exclusions

[DERIVED] The following are exclusions from the evidential spine, not missing manuscript concepts. Probability, POMDP, return decomposition, importance sampling, queue accounting and checkpoint consistency are derived under explicit premises in this chapter. Their historical original papers are not relabeled as 2026 discoveries.

| Candidate or surface | Disposition | Reason and consequence |
|---|---|---|
| Original PPO, GAE, hierarchical RL, GRPO, HybridFlow, AReaL papers | Excluded independent sources | Original publications precede the user's window; current eligible reports/releases support only their own disclosed implementations and studies |
| SAPO v1 and v2 | Inspected historical revisions, not canonical method/result | v3 changes the readout, expands models and matches PPO turn-GAE; v1's clipped scalar and 33.2% runtime number are not taught as current v3 behavior |
| DeepSeek-V4.1 originating technical PDF | UNVERIFIED for detailed methods | Inaccessible originating PDF in this audit; DSec's inspected §6 supports only the architecture that DSec itself reports |
| DeepSeek-V4 | Not used as a canonical source in this chapter | Eligible history but unnecessary for coverage closure; no uninspected report claims imported |
| SAPO/ActFocus implementation commit | NOT-DISCLOSED in inspected paper surfaces | Described method is reconstructed from the pinned manuscript; no assertion that a current unrelated trainer exactly implements that experiment |
| DSec complete production source and internal workloads | NOT-DISCLOSED | Infrastructure report gives mechanisms and tests, not complete released deployment or independently rerun evidence |
| Current documentation, mutable default branches, release marketing | Not used for version-sensitive internals | SHA-pinned files or full technical reports carry the claim |

## Open evidence gaps

[NOT-DISCLOSED] Exact agent-RL training seed counts, complete task mixtures, per-job hardware allocation, replay-discard distributions and energy/currency costs are not disclosed in the inspected GLM/PARL surfaces. DSec lacks independent repeated-run uncertainty and evaluates infrastructure mechanisms rather than RL learning convergence. ActFocus does not disclose independent training-seed uncertainty in the inspected main/appendix protocol. SAPO v3 reports three-seed mean/standard deviation but not a complete release-pinned training artifact. The references identify what was inspected; they do not certify production deployments or externally score the manuscript.
