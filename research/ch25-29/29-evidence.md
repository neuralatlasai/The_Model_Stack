# Chapter 29 research and evidence record

Inspected: **2026-10-09**. Authoring window: **2025-12-01–2026-10-09**, inclusive. Chapter: *Parallelism, collectives, and distributed optimization*. This record supports the manuscript bibliography; it is not empirical execution evidence.

## Retrieval protocol

Read `docs/CONTENT_CONTRACT.md`, `docs/VISUAL_GRAMMAR.md`, `Instruction/AI_REFERENCE_STACK.md`, the native figure schema, the Chapter 29 matrix and existing Chapter 23/24 manuscript conventions. Followed official-source-first training-stack retrieval, arXiv exact-title/revision checks and conference-discovery follow-up. The benchmark journal is an editorial comparator, not a factual authority for distributed mechanisms.

Concrete discovery queries included:

- `site:arxiv.org/abs "distributed training" "2026" "parallelism"`
- `site:github.com/NVIDIA/Megatron-LM/releases "2026"`
- `site:pytorch.org/blog PyTorch 2.10 release FSDP 2026`
- `site:arxiv.org/abs "context parallelism" "2026"`
- `site:arxiv.org/abs "expert parallelism" "Dec" "2025"`
- `site:arxiv.org/abs "collective communication" "2026" training`
- `site:proceedings.mlr.press "context parallelism" "2026"`
- `site:github.com/openucx/ucx/releases "2026"`
- `site:github.com/open-mpi/ompi/releases "2026"`
- `site:docs.nvidia.com/nvshmem/release-notes "2026"`

Search outputs were treated as discovery. Full primary method/experiment or release text was then opened. arXiv abstract pages verified submission histories separately from full-text inspection. Public GitHub release API metadata independently confirmed publication timestamps for NCCL, Megatron-Core and UCX; no authenticated account or credentials were required.

## Primary eligibility and inspection ledger

| Key | Original publication/release | Inspected primary locator | Use boundary |
|---|---|---|---|
| R29.1 | 2026-07-08 | https://pytorch.org/blog/pytorch-2-13-release-blog/ — Distributed Training, FSDP2 Separate Reduce-Scatter Group | Documented unstable scheduling capability; no imported speedup |
| R29.2 | 2026-08-19T19:02:15Z | https://github.com/NVIDIA/Megatron-LM/releases/tag/core_v0.19.0 — MoE, model support, Parallelism, Datasets, Known Issues | Release-specific features and limits; executable composition unverified |
| R29.3 | 2026-06-09T17:48:41Z | https://arxiv.org/html/2606.11169v1 — §2, §4.1–4.3, §6.1–6.4; https://arxiv.org/abs/2606.11169 submission history | Placement versus scheduling and global DAG; no generic speedup or runtime parity |
| R29.4 | 2026-05-12T09:51:28Z | https://arxiv.org/html/2605.18815v1 — §4.1–4.4, Algorithm 1, §6.1–6.5; https://arxiv.org/abs/2605.18815 | State-region migration and printed-loop qualification; code behavior unverified |
| R29.5 | 2026-06-07T06:45:15Z | https://arxiv.org/html/2606.08476v1 — §3.1–3.4, Algorithm 1, §4.1–4.2, Fig. 5–6; https://arxiv.org/abs/2606.08476 | Document-aware context placement, intra-node evaluation boundary |
| R29.6 | 2026-09-28T04:59:35Z | https://arxiv.org/html/2609.34318v1 — §3–4 diagnosis; §5.1–5.2 design; §6.1–6.4 evaluation; https://arxiv.org/abs/2609.34318 | Load-driven context scheduling and distinct diagnostic/evaluation scales |
| R29.7 | 2025-12-22T20:05:09Z | https://arxiv.org/html/2512.19849v1 — §3–4, Table 2, §5.1–5.4; https://arxiv.org/abs/2512.19849 | Portable EP control/payload separation; small-batch counterexample and CPU-resource boundary |
| R29.8 | 2026-02-27T20:38:14Z | https://github.com/NVIDIA/nccl/releases/tag/v2.29.7-1 — GIN/device, symmetric RS, compatibility limitations | Dated release capability, not throughput prediction |
| R29.9 | 2026-01-21 | https://github.com/ROCm/rccl/releases/tag/rocm-7.2.0 — release identity and Changed | RCCL 2.27.7 release, no inferred NCCL equivalence |
| R29.10 | NEWS 2025-12-02; GitHub 2026-02-05T13:44:25Z | https://github.com/openucx/ucx/releases/tag/v1.20.0 — UCP/UCT; tagged identity | Keep document and release dates distinct; device/path capability only |
| R29.11 | Tag/changelog 2026-02-11 | https://github.com/open-mpi/ompi/releases/tag/v5.0.10 and https://raw.githubusercontent.com/open-mpi/ompi/v5.0.10/docs/release-notes/changelog/v5.0.x.rst — first entry | Embedded heading is rc2; stable qualification unresolved |
| R29.12 | 2026-09-22T21:42:08Z | https://github.com/NVIDIA/nvshmem/releases/tag/v3.8.0-0 — PGAS description, Features, Compatibility, Limitations | One-sided/symmetric interface and pairwise visibility scope |
| R29.13 | 2026-03-23 | https://pytorch.org/blog/pytorch-2-11-release-blog/ — differentiable collective disclosure | Release capability; adjoint/normalization derivation remains book-authored |

## Mathematical review findings

The following are original analytical findings, not source benchmark results:

1. Summed-loss gradients must be normalized by the global valid-target count. Averaging rank means changes the objective for unequal counts. The explicit two-rank fixture gives 0.5 rather than 1.
2. Persistent state and temporal peak differ. Full sharding can reduce persistent state while increasing reconstruction traffic or temporary peak.
3. Paired MLP partitioning requires output and input-gradient reductions at specific boundaries; nonlinear activation cannot move across an unfinished partial sum.
4. Equal token counts can have unequal causal pair counts under different document partitions. The derived work model preserves the actual attention mask.
5. EP uses dynamic assignment matrices, with separate dispatch, return, metadata and deduplication conventions. Shared and routed expert parameters can require different replica groups.
6. Linear collective adjoints follow the declared global loss and normalization. An autograd-enabled API does not infer an ambiguous objective.
7. The printed DynaTrain v1 XOR schedule loops rounds 1..n−1. At n=3, pair 1↔2 requires round 3 and is omitted. This is a pair-coverage counterexample, distinct from deadlock behavior or actual code execution. The book's explanatory procedure enlarges the round domain to 1..2^ceil(log2 n)−1 with valid-peer filtering. Coverage and symmetric pairing follow algebraically; transport progress/recovery remain additional obligations.

## Rejected or limited retrieval routes

- Historical P17/P18 and other pre-window mechanism papers: excluded despite their canonical importance. No recent revision resets first publication.
- A recent collective survey appeared in discovery: not used as primary originating-method evidence.
- ICML 2026 context-parallel papers appeared in discovery: not admitted solely from a proceedings date; original-date eligibility must be checked before use.
- DeepSeek-V3.2 December 2025 report was opened, but it was not necessary to support this chapter's distributed-runtime claims and is not cited merely to add a lab name.
- Requested versioned PyTorch 2.13 FSDP and Megatron 0.19.0 API-document routes were inaccessible through the browser tool. The manuscript instead cites inspected dated releases and explicitly avoids an API-page inspection claim.
- Mutable NCCL documentation headers carried misleading old-version/date combinations. Original-date eligibility uses pinned GitHub release metadata rather than those wrappers.
- Open MPI v5.0.10's bundled changelog says rc2. The manuscript records this mismatch and leaves stable qualification unverified.

## Authoring and validation boundary

Six sections contain at least three authored native figures each: twenty-one total, with memory stacks, calculators, tensor flow, charts, masks, routing matrices, execution traces, hierarchy and comparison instruments. Every section includes an adjustable calculator. Browser review identified missing adjustable instruments on §29.2, §29.5 and §29.6; figures 29.19–29.21 now execute existing Eqs. 29.6, 29.15 and 29.20 with explicit assumptions and analytical presets, preserving their original three figures. Every figure declares evidence, source, caption and text equivalent. Their numerical values are derived illustrative configurations, never invented benchmark outcomes.

The manuscript remains `manuscript_draft`. GPU execution, numerical parity, performance, power, cost, independent replication, installed compatibility and recovery behavior remain unverified. The verification page specifies proposed tests and a topic-by-topic coverage audit. Validation output should be retained by the integrator; the figure validator establishes grammar/formula/source consistency only.
