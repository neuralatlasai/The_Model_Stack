# Chapter 27 evidence and editorial checks

Authoring inspection date: **2026-10-09**. Allowed first-publication/release window: **2025-12-01 through 2026-10-09**. This ledger records source inspection and manuscript validation, not executed scientific experiments.

| Key | First publication/release | Inspected primary text | Method / protocol locators | Decision |
|---|---|---|---|---|
| R27.1 | 2026-03-05 | https://arxiv.org/html/2603.05451v1 and https://arxiv.org/abs/2603.05451 | §§2–5; Appendix A.1 | Eligible new paper; hardware/year inconsistency retained; no headline speedups transported |
| R27.2 | 2025-12-02 | https://arxiv.org/html/2512.02556v1 and https://arxiv.org/abs/2512.02556 | §2.1 Eqs.1–4; §2.2; Appendix A | Eligible disclosure; inherited September 2025 parity evaluation excluded; no claim of December invention |
| R27.3 | 2026-09-27 | https://arxiv.org/html/2609.33889v1 and https://arxiv.org/abs/2609.33889 | §§4–5; experimental Appendices B–F | Eligible new preprint; bounded baseline-sensitivity and selection-quality use |
| R27.4 | 2026-09-30 | https://github.com/deepseek-ai/FlashMLA/blob/2e5429fc5653bab6e081f09477126f731882a6a9/README.md | Breaking notice, Requirements, Usage | Exact commit verified through official GitHub commit metadata; latest release not compatible with V3.2 caches |
| R27.5 | 2026-09-22 | https://flashinfer.ai/2026/09/22/mega-moe.html | Our approach; Usage; Performance; microbenchmarks; Accuracy gate; Future work | First-party mutable technical disclosure; forward/precision/integration boundaries separated |
| R27.6 | 2026-09-22 | https://flashinfer.ai/releases/ v0.7.0 entry | Unified MoE; PrimTS; plan/run; experimental and autotuning notes | Only dated v0.7.0 release entry used; later doc capabilities not inherited |
| R27.7 | 2026-09-22 | https://flashinfer.ai/2026/09/22/experimental-path.html | Admission, explicit opt-in, graduation/removal | Declared project policy only; no individual-kernel certification implied |
| R27.8 | 2026-09-30 | https://github.com/linkedin/Liger-Kernel/releases/tag/v0.8.4 | Summary; What's Changed, named issue/PR locators | GitHub release API confirms 2026-09-30T20:45:42Z; release-bound implementation evidence |
| R27.9 | 2026-02-20 | https://github.com/facebookresearch/xformers/releases/tag/v0.0.35 | Wheel statement; Removed section | GitHub release API confirms 2026-02-20T15:02:00Z; dependency distribution separate from kernel capability |
| R27.10 | 2026-09-22 | https://flashinfer.ai/2026/09/22/autotuner-v2.html | §§1–5, key audit, timer audit, rank coordination | Eager/graph boundary and persistence controls; no local measurements claimed |

## Consequential findings

- FA4 v1 §5 names B200, Appendix A.1 names B100 180GB SXM6 and March 2025. Submission is March 2026. The manuscript records rather than silently repairs this conflict.
- DeepSeek-V3.2 §2.2 explicitly identifies the parity evaluation as September 2025. It is not used as new in-window empirical evidence.
- FlashMLA's September30 commit removes Hopper and earlier-model support, changes cache layout, and documents special all-invalid sparse-prefill statistics. Importing the latest library is not a compatibility proof.
- MegaMoE compares a same-kernel integration path and a changed-precision path separately; the latter's small GSM8K gate does not establish broad model equivalence. Backpropagation is listed as future work.
- xFormers v0.0.35 changes upstream FA3 wheel distribution. Top-level package version is not the complete backend provenance.

## Authored manuscript inventory

Six numbered sections, chapter README, references, and verification are present. Eighteen authored native figures include six rail calculators and varied diagrams, traces, tensor flows, matrices, memory stacks, and a comparison. Every numbered section has three figures and the four-part observation layer. Equations 27.1–27.22 and Algorithms 27.1–27.6 are explicit book derivations/procedures, not invented source results.

The proposed verification contains numerical/boundary parity, matched traffic/baseline comparisons, and expert progress/dispatch identity experiments. It is unexecuted. No manuscript uses EMPIRICALLY-OBSERVED or unsupported CODE-VERIFIED. Editorial status remains manuscript_draft.

## Validation

The integrator's independent algorithm review made concurrent producer/consumer roles and last-consumer publication explicit in Algorithm27.2. Algorithm27.6 now filters failed numerical candidates and failed/unmeasured profiles, returns immediately on empty-set fallback, and restores independent state for qualification/repeated timing. These are explanatory-procedure corrections, not claims about defects in a released library.

A final independent pass evaluated seven calculators across Chapters 27 and 28.3 on 74 default/extreme/option configurations without undefined or nonfinite arithmetic. It identified an integer-boundary mismatch in Figure 27.18: a ceiling gives the first non-worse count at an exact tie, while Eq. 27.22 requires strict improvement. The figure and equation now use `floor(extra_setup / recurring_saving) + 1`, with tie fixtures at 8000/8001 and 100000/100001 calls. Algorithm 27.2 now explicitly waits for all asynchronous slot reads before release, uses acquire-release completion ordering and acquires the empty publication before reuse; final result writes also complete before output publication. These are analytical corrections, not executed device tests.

- Standalone authored-figure validator: **18 blocks checked, zero problems** after quoting the comma-containing `max(...)` YAML formula.
- In-memory compiler validation: **9 Chapter27 documents, zero errors and zero warnings**. Compilation validates artifact structure rather than scientific claims.

A read-only Markdown-AST math audit of Chapters 25–29 found a KaTeX-valid notation defect in Section 27.5: unbraced `d_model` parses as $d_m$ followed by four independent letters. All such mathematical occurrences, including Eqs. 27.19 and 27.20 and the payload calculator TeX, now use the grouped roman label `d_{\rm model}`. This changes notation only; arithmetic formulas, dimensions and assumptions are unchanged.

## Remaining review blockers

No GPU kernel, model-quality study, distributed layer, cache conversion, gradient check, package/API compatibility, or resource benchmark was run. Mutable technical posts remain unpinned by content commit. FA4 hardware/date reconciliation, broad changed-precision model quality, local support, and complete energy/cost accounting remain unresolved. No independent replication or a 9/10 or 10/10 scientific rating is asserted.
