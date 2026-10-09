---
id: ms.verification.37
entity_type: verification
title: Verification — Decoding
short_title: Verification — Decoding
volume: 2
part: 7
chapter: 37
section: null
slug: verification
parent: ms.chapter.37
prev_sibling: ms.section.37.6
next_sibling: ms.references.37
children: []
prerequisites:
- ms.chapter.4
- ms.chapter.5
- ms.chapter.14
- ms.chapter.31
downstream:
- ms.chapter.38
- ms.chapter.39
- ms.chapter.40
- ms.chapter.42
- ms.chapter.48
related: []
relations: []
axes:
  lifecycle:
  - inference
  mechanism:
  - decoding
  feedback_setting: []
  modality:
  - text
  - code
  - tool_trajectory
  - image
  - video
papers: []
implementations:
- impl.vllm
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used:
  - MATHEMATICALLY-DERIVED
  - DERIVED
  - ASSUMED
  - PAPER-REPORTED
  - OFFICIAL-DOCUMENTATION
  - NOT-DISCLOSED
  - UNVERIFIED
  empirically_observed: false
word_count_target: 1400
updated_at: '2026-10-09'
editorial_status: manuscript_draft
---

# Verification — Chapter 37

[ASSUMED] This file specifies unexecuted book verification and an editorial coverage audit. Source experiments and their reported outcomes live in the six manuscript sections. Numerical tolerances and hardware choices below are proposed test inputs, not measurements. The chapter remains **manuscript_draft**.

## Artifact specification

| Proposed artifact | Required fields |
|---|---|
| `decoder-contract.yaml` | Model/tokenizer/chat-template hashes; ordered processors and history scopes; temperature/top-k/top-p/ties; grammar/schema dialect/compiler pins; RNG/domain; EOS/minimum/cap/text-stop/presentation; search scoring; speculative event/proposal/proof contract; hard resource/deadline limits |
| `law-trace.parquet` | Request and prefix identity; candidate ancestry; raw and actual processed p/q; support; sampled event; acceptance draw; accepted flag; residual mass; bonus event; grammar before/after/rollback state; computed/committed/delivered boundary |
| `output-ledger.jsonl` | Raw event trajectory; displayed text; finish reason; natural versus censored status; structural validator and verdict; task checker/version and verdict; failed or omitted tool effects; immutable error taxonomy |
| `resource-ledger.parquet` | Arrival/queue/prefill/draft/verify/mask/shape/transport/commit timings; cold compilation; weights/KV/logits/DFA/mask/allocator residency; transferred bytes; computed/rejected/corrected/committed events; request-owned and quarantine allocations |
| `comparison.csv` | Configuration identity; probability-law error; ending validity; independent task utility; rate and full-request latency distribution; uncertainty definition; failures/timeouts; source-versus-book provenance |
| `manifest.json` | File hashes; executable/runtime/hardware pins; run seed scheme; frozen evaluation split/selection rule; no-run status until actual execution |

[DERIVED] The law artifact is sufficient to reconstruct the selected next-event distribution and correction, not merely the token string. Identical displayed strings can conceal different token histories and scores. Quarantine ownership is a live resource category; a timed-out request does not imply its memory is reusable.

## Verification task

### Experiment 37.1 — Ordered processing and actual probability

**Hypothesis.** [ASSUMED] A frozen processor contract reconstructs its actual normalized law; different orders can produce different laws.

**Setup.** Enumerate finite vocabularies of3–8 events in FP64, including tied maxima, zero/positive/negative logits, EOS, repeated histories and empty post-filter support. Compare explicit normalization with each reference branch. **Independent variables:** temperature, top-k, top-p, penalty/history convention, grammar mask and operator order. **Controlled variables:** exact logits, prefix, deterministic tie rule and event identity. **Dataset/workload:** exhaustively declared synthetic finite cases, no model capability claim. **Hardware:** ordinary CPU sufficient; record exact arithmetic library. **Metrics:** normalization, support, elementwise law error, raw/processed score discrepancy. **Baselines:** explicit finite formula and greedy rule separately. **Expected result:** prescribed laws agree within$10^{-12}$ for well-conditioned FP64 cases; noncommuting examples intentionally differ. **Ablation:** swap grammar/nucleus or penalty/temperature; remove one processor. **Interpretation:** agreement supports that configuration only. **Threats to validity:** finite cases do not certify an arbitrary kernel; float tolerances must be dtype-specific.

### Experiment 37.2 — Stop-aware delivery and censoring

**Hypothesis.** [ASSUMED] Incremental delivery is invariant to arbitrary token/byte chunk boundaries under a frozen stop policy.

**Setup.** Enumerate trajectories with EOS, explicit token stops, overlapping markers, multi-token markers, split Unicode, caps and deterministic deadlines/errors. **Independent variables:** chunk partitions, inclusion rule, marker/list ties, final decoder policy and censoring boundary. **Controlled variables:** raw committed trajectory and token decoder. **Dataset/workload:** finite token/byte fixtures, including a marker crossing every possible boundary. **Hardware:** CPU; network/event source replaced by bounded deterministic simulator. **Metrics:** delivered bytes, finish reason, raw/committed/delivered identities, duplicates/retraction, pending suffix. **Baselines:** one-shot frozen presentation map. **Expected result:** all admissible partitions produce identical final presentation; no excluded marker is flushed after TEXT_STOP. **Ablation:** newest-fragment-only matching and unbounded retrieval should fail designated counterexamples. **Interpretation:** cap is censoring, not synthetic EOS; completed-only utility has a distinct denominator. **Threats to validity:** a test decoder cannot certify all production encodings or transports.

### Experiment 37.3 — Beam scores and retained-tree bounds

**Hypothesis.** [ASSUMED] The bounded algorithm returns the best retained completion under its declared score, while pruning can lose the global optimum.

**Setup.** Enumerate finite depth$K\le6$ token trees with nonpositive log increments and all endings labeled valid/invalid. **Independent variables:** width 1–8, positive/zero/negative length exponent, response-versus-full-prompt length convention, tie rule and diversity penalty. **Controlled variables:** exact tree law and cap. **Dataset/workload:** synthetic finite search trees, plus proposed independent SQL split if a neural followup is later executed. **Hardware:** CPU for exhaustive enumeration. **Metrics:** score equality, stopping-bound validity, invalid-terminal rejection, global-versus-retained regret and candidate multiplicity. **Baselines:** full enumeration and width 1 under matched conventions. **Expected result:** Eq 37.8 upper-bounds retained descendants only; a counterexample can lose the global optimum after pruning. **Ablation:** positive future rewards should invalidate the log-score bound; prompt-length normalization can change ranking. **Interpretation:** a diverse ranking does not restore iid samples or guarantee task utility. **Threats to validity:** small finite trees establish algebraic examples, not model benchmarks.

### Experiment 37.4 — Local projection, global conditioning and validators

**Hypothesis.** [ASSUMED] Local language masks preserve recognized next-event legality but generally differ from globally conditioning on final validity and cannot certify semantics.

**Setup.** Enumerate a finite sequence law with different continuation-validity probabilities; compute both laws exactly. Replay regular/FSA and nested deterministic grammar fixtures, JSON/schema dialect edge cases and separate task/authorization checks. **Independent variables:** grammar completeness, supported keyword, tokenizer split, EOS/cap and draft-conditioned context. **Controlled variables:** model law, exact schema and final checker. **Dataset/workload:** finite languages plus proposed frozen SQL/JSON/tool fixtures. **Hardware:** CPU parser; record compiler/backend version. **Metrics:** total probability, admitted events, final structural validity, semantic/authorized effect correctness and false rejection. **Baselines:** full global conditioning, local mask and unconstrained generator. **Expected result:** local/global laws differ in the specified example; valid but wrong/omitted effects remain possible. **Ablation:** incomplete SQL grammar rejects a known valid path; a cap before acceptance yields incomplete output. **Interpretation:** DCCD changes context and hence target law, not just execution. **Threats to validity:** task checker can itself be incomplete; schema coverage is backend-specific.

### Experiment 37.5 — Exact correction and the proxy counterexample

**Hypothesis.** [ASSUMED] Eq 37.13 exactly reconstructs target mass on finite laws; local-only sample-dependent proxy alignment is insufficient.

**Setup.** Enumerate normalized positive/zero-support laws over 2–6 events using exact rational arithmetic where possible. Compute unconditional accepted and fallback mass analytically rather than requiring noisy Monte Carlo. Include $p=(.4,.3,.3)$, $q=(.6,.3,.1)$, $k_a=(.6,.2,.2)$. **Independent variables:** proposal support, standard versus sample-dependent fallback, sequential sibling proposal dependence and processor mismatch. **Controlled variables:** actual event space and conditional proposal mechanism. **Dataset/workload:** finite laws plus finite depth 3 path/tree enumeration. **Hardware:** CPU. **Metrics:** normalized marginal and path-law equality; rejected mass; maximum eventwise error. **Baselines:** direct target draws and standard residual. **Expected result:** standard residual returns$(.4,.3,.3)$; the specified proxy returns$(.4,.4,.2)$; $p=q$ has no reachable residual division. **Ablation:** replace q by raw/pre-temperature probabilities or reuse sibling-conditioned q incorrectly. **Interpretation:** the counterexample rejects stated sufficient conditions, not all repository configurations. **Threats to validity:** passing a finite sample family does not prove a new general algorithm; implementation modes must be separately identified.

### Experiment 37.6 — Prefix, tokenizer and rollback integrity

**Hypothesis.** [ASSUMED] Verification commits only state matching the accepted/corrected prefix, and tokenizer transformation must preserve event mass.

**Setup.** Instrument model-independent cache/parser simulators and a proposed later official-runtime integration. Exercise all-accept, first/middle rejection, EOS-in-block, malformed residual, timeout and partial transport. **Independent variables:** path/tree topology, duplicate vocabulary maps, many-to-one maps, grammar state and failure position. **Controlled variables:** finite target/proposal laws and frozen presentation. **Dataset/workload:** declared ancestry/state fixtures. **Hardware:** CPU simulation; GPU integration explicitly deferred. **Metrics:** exact committed state, pending-prefill identity, ancestor attention, rollback length, single release, quarantine retention and delivered boundary. **Baselines:** sequential target-only state replay. **Expected result:** selected state equals replay; unmapped/ambiguous tokenizer cases fail or use an explicitly valid pushforward; ongoing timed-out work remains unavailable. **Ablation:** sibling attention and stale grammar state must fail designated fixtures. **Interpretation:** state equivalence supports an execution boundary, not speed. **Threats to validity:** a simulator cannot certify concurrent device kernels or private MTP verification.

### Experiment 37.7 — Matched-quality runtime and grammar reuse

**Hypothesis.** [ASSUMED] Improved accepted length produces a useful speed gain only when total cost per committed event falls under the same quality/finish contract.

**Setup.** Propose target-only, sequential speculative and selected tree/MTP modes at an explicitly frozen hardware/runtime/model pin, using actual supported correction and grammar contracts. No hardware configuration is asserted available. **Independent variables:** depth, width, co-/separate placement, batch/arrival trace, grammar reuse, cold/warm compiler and transfer path. **Controlled variables:** task split, prompt/cap/stop, actual target law, dtype and final validator. **Dataset/workload:** independent SQL/JSON/text sets with immutable hashes and a separate frozen selection split. **Hardware:** record GPU/CPU/link/driver clocks, memory and kernel builds before any run. **Metrics:** exactness diagnostics, structural/content utility, queue+prefill+decode+delivery p50/p95/p99, total throughput, computed/committed ratio, memory/transfer, failures, energy only if measured. **Baselines:** identical target law and valid grammar coverage; unconstrained rate shown separately. **Expected result:** a gain is accepted only if fidelity/quality thresholds hold and complete wall time improves; high acceptance can fail. **Ablation:** remove proposer, shaping, grammar compilation reuse, overlap or chunking individually where supported. **Interpretation:** candidate-count matching is not equal FLOPs and mean rate is not a tail guarantee. **Threats to validity:** hidden warmup, teacher-forced oracle continuations, schema churn, optional stopping and instrumentation overhead.

## Acceptance criteria

[ASSUMED] Finite exact-law identities use exact rational arithmetic or a justified FP64 tolerance of$10^{-12}$; production dtype tests declare their own numeric bound and stochastic uncertainty. Invalid/zero-mass or unsupported-event inputs return typed failure. No invalid terminal beam is expanded. TEXT_STOP finalizes once; no delivered byte requires retraction. A capped incomplete grammar object is not marked valid. Cache/parser states equal committed replay, and reservations are reclaimed once only after quiescence or transferred to unavailable quarantine. Count-valued figure controls and sampled axes stay on legal integer states.

[ASSUMED] A proposed neural performance result requires a frozen target/finish/quality contract, independent held-out selection and uncertainty from a declared run/query design. Any output-law mismatch rejects the configuration's exactness claim even when throughput improves. A semantic checker failure rejects that task artifact without automatically invalidating structural recognition. Full request timing includes queueing, cold compilation when applicable, failed/discarded work and final delivery. No numerical speed threshold is prescribed without a hardware/workload objective.

## What this edition did not do

[DERIVED] No GPU generation, training, runtime deployment, source reproduction, latency/energy measurement or semantic benchmark was executed for this manuscript. Reading primary methods and code establishes attributed disclosure; native formulas and static compiler checks establish rendering/schema properties, not model capability or scientific review. The proposed artifact/run files above have not been populated by experiments. The finite counterexample is a mathematical construction. Missing source fields remain NOT-DISCLOSED rather than filled from defaults.

## Topic-completeness audit

[DERIVED] Each row maps a substantive variant to its canonical teaching location, applicable obligations and exact inspected support. “All” means scope/intended artifact, intuition, objects/formal contract, complete applicable mechanism, state procedure, physical cost, original protocol/outcomes, failure/alternatives, improvement boundary, limitations and reproducibility. Mathematical foundations are independent derivations; no contemporary novelty claim is made. N/A entries explain why an original training/benchmark obligation does not apply. This audit records coverage and unresolved evidence, not experimental execution or approval.

| Concept / substantive variant | Manuscript anchors and closure | Primary key / precise locator | Unresolved gap and review consequence |
|---|---|---|---|
| Greedy versus positive-temperature law and ties |37.1 Formulation Eq 37.1–2, Algorithm 37.1, Siblings; all; stochastic versus deterministic limit explicit | R37.1 V2 sampler/gumbel; native top-k function | Cross-kernel bitwise identity not promised; no current universal quality winner |
| Top-k including tied threshold |37.1 Mechanism, Implementation, Reproducibility; support/ties and cost | R37.1 apply_top_k_top_p_pytorch | Exact-k book convention differs from tied-threshold code; compare declared conventions |
| Nucleus and temperature/mask order |37.1 Eq 37.2, ordering matrix, Algorithm; all | R37.1 V2 apply_sampling_params, native truncation | Unsupported operator order changes target; frozen pipeline mandatory |
| Frequency/presence/repetition penalties and history scope |37.1 Eq 37.1, Implementation and Failure modes | R37.1 sampler processor construction; penalties paths | Engine scope differs; no universal penalty quality claim; empirical isolation N/A for definition |
| RNG domains, raw/processed logs and fused sampling |37.1 Algorithm/Implementation/Reproducibility | R37.1 SamplingStates,gumbel_noised_argmax,flashinfer_sample | Statistical equivalence does not imply seedwise token equality |
| EOS and ignored/minimum-length EOS |37.2 Formulation Eq 37.3–4, Algorithm and Implementation | R37.1 sampling_params.py,check_stop | Upstream mask and scheduler order jointly required; cap not EOS |
| Explicit token/text stops and overlap/ties |37.2 Mechanism, delivery Algorithm 37.2, Failure modes | R37.1 check_stop_strings,BaseIncrementalDetokenizer | Finalization policy must be frozen; malformed encoding returns named failure |
| Cap/deadline/error/end-of-stream and length-conditioned evaluation |37.2 Eq 37.4–6, protocol/observations and calculator | R37.5 §4/§6 cap/truncation; R37.1 check_stop | Runtime source complete tail statistics absent; censoring retained in denominator |
| Token/delivered presentation pushforward |37.2 Eq 37.5, buffer state diagram/stat and Reproducibility | R37.1 incremental detokenizer; independent pushforward derivation | Same displayed text need not identify raw token scores; empirical study N/A for identity |
| Beam accumulated scores and length normalization |37.3 Eq 37.7–8, Algorithm 37.3, source/code comparison | R37.5 §§3–4 length penalty−2; R37.1 get_beam_search_score | Prompt/EOS denominator and paper/code stopping differ; do not equate implementations |
| Finite beam pruning, invalid endings and safe retained-tree stop |37.3 Mechanism/Algorithm/Limitations | R37.1 offline _beam_search_step; independent Eq 37.8 | Bound excludes discarded paths and positive rewards; no global optimality certificate |
| Diverse group ranking and stochastic self-consistency |37.3 Mechanism/Siblings, actual SQL protocol | R37.5 §3 execution vote, Tables1–2; declared diversity formula | No eligible isolated diverse-beam empirical improvement; ranking not iid sampling |
| Task-dependent SQL utility / incomplete grammar negative results |37.3 Experimental design/Observations | R37.5 §5 Tables1–2, paired error analysis; §6 truncation | One seed, NF4 and candidate-count match limit external/compute claims |
| Finite-state/regex versus nested pushdown grammar |37.4 Mechanism/Siblings;37.6 Eq 37.20 | R37.3 §§2–3 lexer/stack assumptions | Deterministic grammar/lexer coverage required; arbitrary recursive FSA claim rejected |
| Local grammar projection versus global validity conditioning |37.4 Eq 37.9–10 and local/global matrix | R37.2 §3 Eq 4–8; independent continuation-conditioning example | Immediate legal mask does not implement global conditioning; exhaustive identity N/A empirical |
| JSON/schema dialect and tokenizer composition |37.4 Implementation/failures/protocol;37.6 compiler | R37.3 §4.2 Table 2, §4.5 Tables4–5; R37.4 §3 | Unsupported keywords/Unicode behavior remain failures, not guaranteed validity |
| Tool arguments, cross-field/task/authorization validation |37.4 Algorithm/Observations/Siblings | R37.4 §4.3 missing-call and hollow-rescue cases | Valid syntax not truth, completeness or authorization; side effects gated separately |
| DCCD single/multi-draft mixture and confidence boundary |37.4 Eq 37.11, Mechanism, protocol/observations | R37.2 Algorithm 1,§5 Table 2,§5.2 voting,AppendixA–C/I | Context changes reference law; no equal-FLOP/latency or calibration proof |
| PSC offline transducers/classifier and online lookup |37.4 Mechanism;37.6 Eq 37.20, compilation procedure, protocol | R37.3 §3 Eq 3–9,Algorithms1–2; §§4–5 | Stored mask application/transfer not O(1); preprocessing can be large; exact runtime baseline pins absent |
| Sequential draft acceptance and residual normalization |37.5 Eq 37.13–14, Algorithm 37.5, Reproducibility | R37.1 V2 rejection kernel; independent finite-law derivation | Same processed event law essential; zero residual branch unreachable in exact arithmetic |
| Bonus token, cap/EOS and descendant rollback |37.5 Algorithm/Implementation/Failure modes;37.2 delivery | R37.1 rejection_sampler.py; grammar rollback methods | Newly corrected token may await KV materialization; logical state must be explicit |
| Tree iid siblings, conditional proposal updates and ancestry |37.5 Mechanism/Siblings;37.6 ancestry matrix | R37.6 §2 Eq 1–2; R37.1 verifier | Without-replacement/correlated candidate mechanism requires its own conditional law |
| Residual shaping proxy and sample dependence |37.5 Eq 37.15–16, method, protocol and four observations | R37.6 Method Eq 3–13/Algorithm 1;AppendixA.1 Eq 14–20;AppendixB Eq 25–28 | Printed proxy budget/fill policy has disclosure ambiguity; local conditions insufficient; counterexample output(.4,.4,.2); tiny analytic KL not independent proof |
| Shared MTP proposal parameters |37.5 Mechanism/Implementation/source protocol | R37.7 §2.1 Table 2 | Private prompts; no full verification/hardware/latency protocol; sharing not exactness proof |
| Tokenizer/vocabulary map and many-to-one mass |37.5 Eq 37.17, implementation and limits | R37.1 VocabMapping and unknown/EOS handling | String intersection not general prefix-compatible pushforward; unresolved maps fail exactness |
| Acceptance progress versus time / renewal reward |37.6 Eq 37.18–19, calculator/chart and Observations | R37.6 Table 3/Figure 3; independent rate derivation | Mean of ratios differs; no p99 guarantee or adaptive-stop unbiasedness |
| Co-/separate placement, batch and communication |37.6 Mechanism/Algorithm/Implementation | R37.3 §4.4 Figure 3; R37.6 Figure 3; R37.1 sampler | No common production arrival/link study; placement examples analytical, not private capability |
| Logit chunk limits and target/draft KV/weights/masks |37.6 Eq 37.21, stat, Implementation | R37.1 _verify_in_chunks,get_max_chunk_logits; grammar_bitmask | Indivisible request may exceed nominal1GiB; standard KV layout scope explicit |
| Grammar preprocessing/reuse amortization |37.6 Eq 37.20/22, source Tables6–7/Figure 4 and Siblings | R37.3 §5 Tables6–7,Figure 4 |25.1s decoding excludes28.3s compile; schema churn and memory opportunity cost unresolved |
| Error/cancel/drain and quarantine ownership |37.6 Algorithm 37.6/Reproducibility | Independent transactional derivation, grounded execution interfaces R37.1 | Timeout is not quiescence; unavailable ownership retained until safe reclaim; no executed concurrency claim |
| Quality/latency and complete cost frontier |37.6 source protocol/four observations, Experiment 37.7 here | R37.3 §§4–5;R37.5 §4–6;R37.6 Tables1–4 | No universal hardware-normalized dominance; energy/money NOT-DISCLOSED |

[DERIVED] Source-author study reproduction, kernel execution, numerical bitwise parity and independent seed uncertainty remain open where the primary disclosure does not provide them. The chapter closes its formal/method/protocol teaching obligations with those limitations visible; it does not turn an evidence gap into a fabricated measurement. The source-date and exclusion ledger is [references.md](references.md).
