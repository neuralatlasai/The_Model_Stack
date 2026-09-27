---
id: ms.section.17.1
entity_type: section
title: "Recurrent state"
short_title: "Recurrent state"
section: 17.1
slug: 17-1-recurrent-state
parent: ms.chapter.17
prev_sibling: null
next_sibling: ms.section.17.2
children: []
prerequisites: [ms.chapter.2, ms.chapter.13, ms.chapter.14, ms.chapter.15]
downstream: [ms.chapter.27, ms.chapter.42]
word_count_target: 1900
volume: 1
part: 3
chapter: 17
related: []
relations: []
axes: {lifecycle: [pretraining, inference, evaluation], mechanism: [recurrent_state, state_space, linear_attention], feedback_setting: [], modality: [text, code, image, audio, video]}
papers: [P11, P12]
implementations: [impl.pytorch, impl.hugging-face-transformers, impl.triton-language]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED, NOT-DISCLOSED], empirically_observed: false}
updated_at: 2026-09-27
editorial_status: manuscript_draft
---


# 17.1 — Recurrent state

## Scope

This section establishes the mathematical contract for carrying information through a fixed-size recurrent state. It distinguishes predictive sufficiency, representational capacity, numerical precision, training parallelism, and sequential generation. The baseline is explicit history storage from [Chapter 14](../ch14-attention-architectures-and-cache-representations/README.md). Success means identifying exactly what must survive a prefix boundary, how many bytes it occupies, and which future questions that state can answer. The analysis concerns causal sequence models with fixed parameters during an inference request; external retrieval and online parameter adaptation require additional accounting.

## Why this exists

**DERIVED.** A history-addressable model retains representations that future queries can revisit. Its storage grows with the retained history unless a compression, eviction, or bounded-window policy intervenes. A recurrent model instead updates an existing representation. This makes the representation's size predictable, but it moves the difficulty into deciding what to preserve before the future query is known.

The constraint is therefore not merely execution time. A model may process arbitrarily many tokens while progressively losing distinctions between their histories. A fixed allocation demonstrates that computation remains feasible; it does not demonstrate that an old identifier, an exact quotation, or a revised fact remains recoverable. Researchers must distinguish accepting a sequence from retaining its task-relevant information.

**PAPER-REPORTED.** Mamba motivates input-dependent state updates as a way to select information during sequence processing [P11]. The mathematical development below abstracts from that particular architecture. It specifies properties that any proposed recurrent mechanism must make explicit before its quality or efficiency can be assessed.

## Intuition

**DERIVED.** State is the complete information carried across the chosen temporal cut. It can include a matrix, short convolution buffers, normalization accumulators, counters, and other persistent tensors. Calling only the largest tensor “the state” understates both memory and restoration requirements.

> **Definition — Recurrent-state contract.** The declared collection of values whose restoration, together with fixed model parameters and the same subsequent inputs, reproduces the continuation of a sequence computation.

State sufficiency is always relative to a prediction problem. For a process whose future depends only on a bounded set of latent quantities, compact state may preserve everything required. For a task that can later request any character in an arbitrary prefix, the required distinctions grow with that prefix. Neither case justifies a universal statement about all language tasks.

## Formulation

**MATHEMATICALLY-DERIVED.** Write a deterministic update and readout as

$$
s_t=f_\theta(s_{t-1},u_t),\qquad y_t=g_\theta(s_t,u_t),\qquad s_t\in\mathbb R^{n_s}.
$$
*(Eq. 17.1)*

where $u_t$ is the current input representation, $s_t$ the post-update state, $y_t$ the output, $\theta$ fixed learned parameters, and $n_s$ the state dimension.

The displayed domain is mathematical; an implementation uses a finite representable subset. The update may include several tensors flattened only for analysis. A read-before-write convention would use $s_{t-1}$ and must be specified separately.

A statistic of a history is predictively sufficient for a stated data distribution when

$$
p(U_{t+1:T}\mid U_{1:t})=p(U_{t+1:T}\mid s_t)
$$
*(Eq. 17.2)*

where $U_{a:b}$ denotes random inputs from positions $a$ through $b$, $T>t$ is a finite prediction horizon, and $s_t$ is a deterministic function of the observed history.

This equality defines a demanding property; it does not follow from having trained a recurrence by next-token prediction. Empirical agreement on one evaluation distribution establishes, at most, approximate sufficiency within that evaluation's resolution.

For $B$ independent requests and $L$ identical layers with $n_s$ stored scalar values per layer,

$$
M_{\mathrm{state}}=BLn_sb,\qquad
8M_{\mathrm{request}}\ge m\log_2 V
$$
*(Eq. 17.3)*

where $b$ is bytes per stored value, $M_{\mathrm{state}}$ is tensor payload in bytes, $M_{\mathrm{request}}$ is all prefix-dependent storage available to one request, $m$ is the number of arbitrary symbols to be recalled, and $V\ge2$ is alphabet size.

The first equality excludes metadata and buffers not included in $n_s$. The second is a necessary information bound for the exact delayed-recall task proved below, not an estimate of usable neural capacity.

~~~figure
id: fig-17.3
kind: calculator
title: "State payload and necessary recall bits"
caption: "Illustrative configuration, not a named model. The capacity bound is necessary for arbitrary exact recall; it does not predict learned accuracy."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.3"
alt: "Illustrative configuration, not a named model. The capacity bound is necessary for arbitrary exact recall; it does not predict learned accuracy."
spec: {"tex": "M_{state}=BLn_sb", "equation": "17.3", "inputs": [{"symbol": "B", "label": "requests", "default": 1, "min": 1, "max": 64, "step": 1, "format": "fixed2"}, {"symbol": "L", "label": "layers", "default": 24, "min": 1, "max": 128, "step": 1, "format": "fixed2"}, {"symbol": "ns", "label": "values per layer", "default": 4096, "min": 64, "max": 65536, "step": 1, "format": "fixed2"}, {"symbol": "b", "label": "bytes per value", "default": 4, "min": 1, "max": 8, "step": 1, "format": "fixed2"}, {"symbol": "m", "label": "arbitrary symbols", "default": 8192, "min": 1, "max": 1000000, "step": 1, "format": "fixed2"}, {"symbol": "V", "label": "alphabet size", "default": 256, "min": 2, "max": 65536, "step": 1, "format": "fixed2"}], "outputs": [{"symbol": "payload", "label": "state bytes", "formula": "B*L*ns*b", "format": "bytes"}, {"symbol": "bits", "label": "necessary recall bits", "formula": "m*log2(V)", "format": "integer"}]}
states: [{"anchor":"formulation","label":"One request","variables":{"B":1},"note":"State size is independent of prefix length under this contract."},{"anchor":"mechanism","label":"Concurrent requests","variables":{"B":16},"note":"Independent requests multiply persistent state."},{"anchor":"failure-modes","label":"Longer exact recall","variables":{"m":1000000},"note":"Necessary task information increases while the fixed allocation does not."}]
~~~

## Mechanism

> **Proposition 17.1.** A deterministic finite-state system that must exactly answer every delayed position query about any length-$m$ string over an alphabet of size $V$ needs at least $V^m$ distinct prefix states.

*Proof sketch.* Suppose two different strings produce the same state. They differ at some position. Append the identical query asking for that position. Fixed parameters, identical state, and identical subsequent input give identical output, which cannot equal both different symbols. Thus all strings must map to different states. Storage of $M_{\mathrm{request}}$ bytes admits at most $2^{8M_{\mathrm{request}}}$ bit patterns, giving Eq. 17.3. Count every prefix-dependent side channel; a retained transcript or growing auxiliary index changes the premise.

The bound assumes zero error for every string. It does not characterize average-case error, natural-language compressibility, or randomized approximate retrieval. Infinite-precision real numbers would also violate its finite-representation premise. Parameters can encode the task or distribution but cannot encode an arbitrary request's unseen random string before that request arrives.

Parallel evaluation requires additional structure. Consider affine updates with coefficients available from the input independently of the previous recurrent state:

$$
s_t=F_ts_{t-1}+g_t,\qquad
(F_2,g_2)\circ(F_1,g_1)=(F_2F_1,F_2g_1+g_2).
$$
*(Eq. 17.4)*

where $F_t\in\mathbb R^{n_s\times n_s}$, $g_t\in\mathbb R^{n_s}$, and composition means the right-hand update executes first.

Associativity follows because both parenthesizations of three updates yield $F_3F_2F_1$ and $F_3F_2g_1+F_3g_2+g_3$. Commutativity is unnecessary and generally false. A work-efficient tree scan can compute all prefix summaries with logarithmic parallel depth. For diagonal transitions, combining summaries costs $O(n_s)$ and total work is $O(Tn_s)$. Dense transition composition instead involves matrix multiplication; associativity alone does not make that representation economical.

Teacher-forced training supplies the entire input sequence. Autoregressive generation supplies the next input only after the current output is selected. Parallelizing a layer's scan therefore does not remove token-generation dependency. Nor can an arbitrary nonlinear recurrence be scanned merely because it has a state variable: the compact associative representation must be exhibited.

~~~figure
id: fig-17.4
kind: diagram
title: "A complete prefix boundary"
caption: "The input updates a complete recurrent state; a delayed query can use only the retained state and any explicitly counted external memory."
placement: inline
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.1"
alt: "The input updates a complete recurrent state; a delayed query can use only the retained state and any explicitly counted external memory."
spec: {"direction":"LR","nodes":[{"id":"n0","kind":"tensor","label":"Prefix input"},{"id":"n1","kind":"process","label":"Complete state update"},{"id":"n2","kind":"process","label":"Boundary snapshot"},{"id":"n3","kind":"process","label":"Delayed query"},{"id":"n4","kind":"metric","label":"Continuation output"}],"edges":[{"from":"n0","to":"n1","kind":"flow"},{"from":"n1","to":"n2","kind":"flow"},{"from":"n2","to":"n3","kind":"flow"},{"from":"n3","to":"n4","kind":"flow"}]}
~~~

## Algorithm

~~~text
Algorithm 17.1 — Sequential reference and boundary restoration
INPUT bounded inputs u[1:T], fixed parameters, initial complete state
OUTPUT outputs y[1:T], final complete state, declared boundary snapshots
STATE one state object; separate output storage; selected snapshots
INVARIANT before step t, state represents exactly the accepted prefix 1:t-1
1. Validate tensor shapes, finite values, sequence boundaries, and capacity.
2. Initialize every persistent component, including local buffers and counters.
3. For t = 1,...,T:
4.   Read the current input; compute coefficients using the declared causal rule.
5.   Compute the candidate update and readout without overwriting needed values.
6.   Commit all state components together; retain a snapshot only when requested.
7. Return outputs and the final state.
8. To verify restoration, resume a snapshot on the identical suffix and compare.
~~~

**DERIVED.** If one update costs $c_f$, total update work is $O(Tc_f)$ and live inference state is $O(n_s)$ per layer. Retaining all outputs or every intermediate state adds sequence-dependent storage. Snapshotting $K$ boundaries costs $O(Kn_s)$ unless a declared reconstruction scheme replaces those copies. A failed partial update must not leave convolution history and recurrent matrices at different token positions.

## Implementation

**OFFICIAL-DOCUMENTATION.** Triton language, at the **Kernels / numerics / collectives** layer, documents an associative-scan primitive with a supplied combining function [R17.7]. It is a primitive for implementing a justified algebra, not a proof that a model's update is scan-compatible.

**DERIVED — implementation design.** PyTorch, at the **Model / autograd framework** layer, can express the sequential tensor reference and compare gradients on short bounded sequences. Hugging Face Transformers, at the **Model definition / adaptation** layer, provides a model integration surface; its documented Qwen3-Next architecture demonstrates that recurrent and attention components can coexist [R17.6]. Tests must inspect the actual checkpoint configuration and state object, rather than treating all cache objects as append-only key/value arrays.

Store the most frequently updated state in a layout that avoids transposing the full matrix every token. Separate accumulation precision from weight precision. A state held in a wider dtype consumes more bytes even if its projections use lower precision. With tensor or sequence parallelism, record ownership and synchronization at each boundary; a logical scan does not specify a distributed communication schedule.

## Experimental design

**PROPOSAL.** This is a reproducibility protocol, not a reported model result.

### Experiment 17.1 — Boundary sufficiency and replay

- **Hypothesis:** Complete-state restoration reproduces continuation; omitted state components produce detectable divergence.
- **Setup:** Compare uninterrupted execution with execution split at multiple prefix boundaries.
- **Independent variables:** Boundary position, state precision, snapshot completeness, scan grouping.
- **Controlled variables:** Parameters, input tokens, read/write convention, initial state, backend.
- **Dataset/workload:** Bounded synthetic sequences, repeated keys, delayed position queries, and held-out tokenized text.
- **Hardware:** One declared accelerator configuration; record device, driver, memory, and runtime.
- **Metrics:** Output and final-state error, gradient error for short training cases, persistent bytes, peak allocation.
- **Baselines:** Sequential higher-precision reference and complete-state replay.
- **Expected result:** Algebraically equivalent schedules agree within declared tolerances; no accuracy gain is presumed.
- **Ablation:** Omit each state component separately and vary accumulation dtype.
- **Interpretation:** Replay validates the state contract, not predictive sufficiency for unseen tasks.
- **Threats to validity:** Nondeterministic kernels, tolerance selection after inspection, hidden host-side state, and accidental reuse of the full prefix.

## Observations

**What the paper claims — PAPER-REPORTED.** Mamba presents selection and hardware-aware execution as complementary design choices [P11].

**What the evidence shows — MATHEMATICALLY-DERIVED.** The counting argument separates exact information requirements from allocation size; affine composition establishes a conditional route to parallel scans.

**What we infer — DERIVED.** Capacity, state precision, and execution schedule should be independently varied before explaining a quality difference.

**What remains unknown — UNVERIFIED.** No measured sufficiency frontier, latency advantage, or trained-model replay result is established by this manuscript.

## Failure modes

> **Failure mode — Incomplete snapshot.** *Symptom:* Resumed output diverges immediately despite an identical visible matrix. *Cause:* A convolution buffer, position counter, or normalization state was omitted. *Detection:* Compare every component at the split. *Mitigation:* Serialize the complete state contract atomically.

**DERIVED.** Numerical reassociation can produce small differences even for a mathematically associative operator. Near unstable trajectories, those differences may grow. Set tolerances using precision and sequence length, then inspect whether a discrepancy is numerical or semantic. Resetting only some components at packed-document boundaries is a semantic error, not a harmless precision effect.

~~~figure
id: fig-17.5
kind: stat-panel
title: "State boundary"
caption: "Declared mathematical and experimental boundaries; these are not measured model results."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.3"
alt: "Declared mathematical and experimental boundaries; these are not measured model results."
spec: {"header":"STATE BOUNDARY","rows":[{"key":"Capacity claim","value":"finite precision"},{"key":"Replay boundary","value":"all persistent components"},{"key":"Parallelism","value":"requires composable updates"},{"key":"Quality evidence","value":"proposed, not measured"}]}
~~~

## Siblings

**DERIVED.** [History-addressable attention](../ch14-attention-architectures-and-cache-representations/README.md) changes the storage primitive: future queries revisit retained token representations instead of only a fixed summary. The language-model objective can remain unchanged. Its new cost is history-dependent storage and access.

[Linear attention](17-3-linear-attention.md) chooses an explicit associative statistic, making its collision behavior analyzable. [Delta updates](17-4-delta-rule-mechanisms.md) make writes depend on the current association, allowing selective replacement. Neither changes the finite-state theorem's assumptions merely by changing the update equation.

## Extensions

**DERIVED.** For streaming audio, variable sampling intervals belong in the update contract; the token index alone may not represent elapsed time. For agents that branch a conversation, copy or reconstruct each branch's complete state before accepting different continuations. External retrieval can restore information discarded by a recurrence, but its index, query latency, and consistency semantics become part of the system being evaluated.

## Limitations

**DERIVED.** Worst-case exact recall can be an unnecessarily strict target for compressible data, but it is an appropriate falsifier for claims of unlimited lossless memory. Conversely, good average loss can conceal rare exact-retrieval failures. A useful architecture decision states which errors are acceptable and which histories the evaluation actually covers.

## Reproducibility

**DERIVED — required record.** Retain the state schema, component dtypes, byte counts, initialization, reset masks, boundary snapshots, scan order, and all error tolerances. Distinguish the proposed model experiment from the chapter's small mathematical consistency checks. Sources were inspected on 2026-09-26; documentation availability does not establish that a particular installed kernel was tested.

## References

[P11](references.md#p11); [R17.6](references.md#r176); [R17.7](references.md#r177). The exact-recall proof and affine-composition derivation are the chapter's mathematical analysis under the conditions stated above.

