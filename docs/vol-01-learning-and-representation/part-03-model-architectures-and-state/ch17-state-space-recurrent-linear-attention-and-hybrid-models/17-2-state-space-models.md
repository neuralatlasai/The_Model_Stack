---
id: ms.section.17.2
entity_type: section
title: "State-space models"
short_title: "State-space models"
section: 17.2
slug: 17-2-state-space-models
parent: ms.chapter.17
prev_sibling: ms.section.17.1
next_sibling: ms.section.17.3
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


# 17.2 — State-space models

## Scope

This section develops discretized linear dynamics, input-dependent selection, associative evaluation, and the restricted duality between state-space models and structured attention. Its baseline is a time-invariant linear system; its target is a causal selective sequence operator. Success requires specifying the transition structure, discretization rule, input and output maps, training schedule, and complete inference state. Mamba and Mamba-2 provide primary architectural anchors [P11; R17.1]. Their complete blocks contain more than the recurrence analyzed here.

## Why this exists

**DERIVED.** A fixed convolution applies the same lag-dependent rule to every occurrence of a pattern. That is appropriate when time translation should preserve the operator, but it cannot independently decide that one occurrence should persist while another should be discarded unless additional input-dependent mechanisms intervene. Making coefficients depend on the input supplies that control, at the cost of losing the single stationary convolution kernel.

**PAPER-REPORTED.** Mamba combines input-dependent state-space parameters with hardware-aware scan execution [P11]. Mamba-2 develops structured state-space duality and an execution strategy based on that structure [R17.1]. These contributions address both expressivity and computation; neither should be reduced to the assertion that an arbitrary recurrent equation is fast.

**DERIVED.** The engineering constraint is that expanded per-token states can become much larger than input representations. A mathematically linear-time algorithm can still write enough temporary data to device memory to be slow. The useful representation therefore exposes local matrix products and compact cross-chunk summaries while preserving the original causal update.

## Intuition

**DERIVED.** A state coordinate combines a surviving portion of its past value with a new input contribution. The transition determines survival; the input map determines what enters; the output map determines what can be read. Selection makes these roles depend on the current input representation. A large output coefficient cannot recover a distinction that previous updates have already erased.

> **Definition — Selective state-space update.** A state-space recurrence in which specified transition, input, or readout coefficients depend on the input, so that information propagation is content dependent.

The term does not require every matrix to vary at every position. A model description must identify precisely which coefficients vary and which are learned constants. It must also distinguish a continuous-time parameterization from physical elapsed time: token-dependent discretization steps can be learned computational controls without being measured durations.

## Formulation

**MATHEMATICALLY-DERIVED — standard linear-systems background.** For a constant input on an interval of duration $\Delta>0$,

$$
\frac{d s(r)}{d r}=A_{\mathrm{ssm}}s(r)+B_{\mathrm{in}}u,\qquad
\bar A=e^{\Delta A_{\mathrm{ssm}}},\qquad
\bar B=\left(\int_0^\Delta e^{rA_{\mathrm{ssm}}}\,dr\right)B_{\mathrm{in}}.
$$
*(Eq. 17.5)*

where $s(r)\in\mathbb R^n$, $u\in\mathbb R^p$, $A_{\mathrm{ssm}}\in\mathbb R^{n\times n}$, $B_{\mathrm{in}}\in\mathbb R^{n\times p}$, and $\bar A,\bar B$ are zero-order-hold discrete operators.

Integration of the differential equation gives $s_t=\bar A s_{t-1}+\bar B u_t$. If $A_{\mathrm{ssm}}$ is invertible, the integral can be written using $A_{\mathrm{ssm}}^{-1}(e^{\Delta A_{\mathrm{ssm}}}-I_n)$. The integral remains valid when the matrix is singular; an inverse-based expression must not be used unconditionally.

For a single real coordinate with continuous coefficient $a$ and input coefficient $b_{\mathrm{in}}$,

$$
\bar a=e^{\Delta a},\qquad
\bar b=
\begin{cases}
b_{\mathrm{in}}\operatorname{expm1}(\Delta a)/a,&a\ne0,\\
\Delta b_{\mathrm{in}},&a=0.
\end{cases}
$$
*(Eq. 17.6)*

where $\operatorname{expm1}(x)=e^x-1$ is evaluated by a cancellation-aware numerical routine near zero, and $\bar a,\bar b$ are scalar discrete coefficients.

This is the exact zero-order-hold formula, not an assertion that every Mamba implementation uses this exact input discretization. The transition, input discretization, and any approximation must be recorded separately.

For a diagonal selective recurrence and linear readout,

$$
s_t=a_t^{\mathrm{disc}}\odot s_{t-1}+g_t,\qquad
y_t=O_t s_t+D_{\mathrm{skip}}u_t,\qquad
h_{1/2}=\frac{\ln(1/2)}{\ln \alpha}.
$$
*(Eq. 17.7)*

where $a_t^{\mathrm{disc}},g_t\in\mathbb R^n$, $O_t\in\mathbb R^{p_{\mathrm{out}}\times n}$, $D_{\mathrm{skip}}\in\mathbb R^{p_{\mathrm{out}}\times p}$, and $h_{1/2}$ is a constant-coordinate half-life in steps when its fixed survival coefficient is $0<\alpha<1$.

The half-life is not a measured retrieval horizon. It describes unforced attenuation of one coordinate. Learned writes, readouts, interference, and finite precision determine whether the attenuated signal remains useful.

~~~figure
id: fig-17.6
kind: calculator
title: "Coordinate retention"
caption: "Illustrative constant-coordinate dynamics from Eq. 17.7, not measured model recall. The original signal is attenuated by alpha raised to the delay."
placement: rail
anchor: formulation
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.7"
alt: "Illustrative constant-coordinate dynamics from Eq. 17.7, not measured model recall. The original signal is attenuated by alpha raised to the delay."
spec: {"tex": "h_{1/2}=\\ln(1/2)/\\ln\\alpha", "equation": "17.7", "inputs": [{"symbol": "alpha", "label": "survival per step", "default": 0.99, "min": 0.5, "max": 0.9999, "step": 0.0001, "format": "fixed2"}, {"symbol": "delay", "label": "delay in steps", "default": 128, "min": 1, "max": 8192, "step": 1, "format": "fixed2"}], "outputs": [{"symbol": "retained", "label": "surviving fraction", "formula": "alpha^delay", "format": "fixed2"}, {"symbol": "half", "label": "half-life in steps", "formula": "ln(0.5)/ln(alpha)", "format": "fixed2"}]}
states: [{"anchor":"formulation","label":"Moderate delay","variables":{"alpha":0.99,"delay":128},"note":"A coordinate's attenuation is not the model's exact-retrieval accuracy."},{"anchor":"mechanism","label":"Slower decay","variables":{"alpha":0.999,"delay":128},"note":"Longer retention also preserves more previous interference."},{"anchor":"failure-modes","label":"Long delay","variables":{"alpha":0.99,"delay":4096},"note":"Very small contributions may disappear under finite precision."}]
~~~

## Mechanism

**MATHEMATICALLY-DERIVED.** Repeated substitution in a time-invariant recurrence produces a convolutional response: the contribution of input $u_i$ to output $y_t$ is $O\bar A^{t-i}\bar B u_i$. Its coefficient depends only on the lag. When transition, input, or readout operators vary with content, that coefficient becomes an ordered product specific to the intervening tokens. A single stationary convolution no longer represents the general operator.

For diagonal transitions, the affine composition in [§17.1](17-1-recurrent-state.md) remains elementwise. The coefficient sequence must be available without solving the same recurrent state first. A short causal convolution used to construct coefficients is compatible with parallel training once its inputs are available, but adds its own inference buffer and boundary rules.

Stability requires more care than checking that each coordinate decays. If $a<0$ and $\Delta_t>0$, the homogeneous scalar transition has magnitude below one. A driven state can nevertheless become large when writes are large or contraction approaches one. Under a uniform bound $|a_t^{\mathrm{disc}}|\le\rho<1$ and $|g_t|\le G$, repeated substitution bounds one coordinate by $\rho^t|s_0|+G(1-\rho^t)/(1-\rho)$. Removing the uniform margin invalidates that particular bound.

The same products govern gradients through the linear state path. Strong forgetting attenuates old signals and corresponding gradients; nearly persistent coordinates retain both useful content and interference. This explains why a stability condition alone cannot select the best memory time scale.

**PAPER-REPORTED.** Structured state-space duality connects specified SSM operators with semiseparable sequence matrices; Mamba-2 exploits a restricted transition structure [R17.1]. It does not establish that general softmax attention is identical to every finite-state recurrence.

**PAPER-REPORTED.** In Mamba, the selection includes input-dependent step sizes, input maps, and readout maps, while the continuous transition parameters remain learned model parameters [P11]. Mamba-2's SSD core restricts the transition to a scalar multiple of the identity within the relevant head structure [R17.1]. The restrictions are part of the algorithm's premise.

**DERIVED.** A scalar transition multiplies every state coordinate in its group by the same survival factor. This reduces transition diversity within that group but permits a shared decay structure across many value channels. Different heads can still carry different dynamics. Comparing models solely by a single state dimension therefore omits head count, value width, and which parameters are shared. The appropriate ledger enumerates actual tensors and distinguishes mathematical degrees of freedom from physical storage.

**DERIVED.** For the illustrative matrix update $H_t=\alpha_tH_{t-1}+v_tk_t^\top$, unrolling gives a readout contribution $v_i(k_i^\top q_t)\prod_{j=i+1}^t\alpha_j$. The empty product for $i=t$ equals one. This exhibits a causal attention-like matrix with structured decay. It has no softmax normalization unless an additional, explicitly defined operation supplies one. The scalar decay permits factorization that a completely arbitrary pairwise attention matrix need not possess.

~~~figure
id: fig-17.7
kind: diagram
title: "Selective dynamics and execution"
caption: "Input-derived coefficients define a causal recurrence. A sequential reference and an associative scan evaluate the same declared operator, subject to numerical tolerance."
placement: inline
anchor: mechanism
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.5"
alt: "Input-derived coefficients define a causal recurrence. A sequential reference and an associative scan evaluate the same declared operator, subject to numerical tolerance."
spec: {"direction":"LR","nodes":[{"id":"n0","kind":"tensor","label":"Input representations"},{"id":"n1","kind":"process","label":"Coefficient generation"},{"id":"n2","kind":"process","label":"Discretization"},{"id":"n3","kind":"process","label":"Structured state update"},{"id":"n4","kind":"metric","label":"Readout"}],"edges":[{"from":"n0","to":"n1","kind":"flow"},{"from":"n1","to":"n2","kind":"flow"},{"from":"n2","to":"n3","kind":"flow"},{"from":"n3","to":"n4","kind":"flow"}]}
~~~

## Algorithm

~~~text
Algorithm 17.2 — Diagonal selective recurrence reference
INPUT bounded inputs, coefficient functions, initial state and convolution buffer
OUTPUT outputs and complete final state
STATE diagonal-state tensor, local buffer, position and reset metadata
INVARIANT each output uses only the accepted input prefix
1. Validate shapes, reset boundaries, dtypes, and discretization convention.
2. Generate input-dependent coefficients with the declared causal preprocessing.
3. For t = 1,...,T:
4.   Reset all components if t begins an independent sequence.
5.   Evaluate transition and input coefficients with stable small-step handling.
6.   Update the state using the diagonal affine recurrence.
7.   Apply the readout, skip branch, and declared output gating.
8. Compare an optimized scan against this reference before using its timings.
~~~

**DERIVED.** The diagonal core requires $O(Tn)$ arithmetic and $O(n)$ live state per channel, excluding projections and saved training tensors. If there are $d_{\mathrm{inner}}$ independent channels, count $nd_{\mathrm{inner}}$ state values. A convolution of width $w$ adds up to $(w-1)d_{\mathrm{inner}}$ retained input values under a simple causal implementation. Full-sequence activation memory is not constant merely because inference state is.

## Implementation

**OFFICIAL-DOCUMENTATION.** PyTorch's **Model / autograd framework** layer documents a matrix-exponential operator [R17.8]. It provides a small-system reference for Eq. 17.5, not a recommendation to construct dense matrix exponentials inside a large diagonal kernel.

**DERIVED — implementation design.** Triton language's **Kernels / numerics / collectives** layer supplies the scan building block [R17.7]; a useful kernel must additionally control intermediate materialization and accumulation precision. Hugging Face Transformers' **Model definition / adaptation** layer hosts recurrent/hybrid model integrations [R17.6]. Trace the exact selected model implementation before deciding its input discretization or cache schema.

A diagonal state laid out for one-token updates may differ from the layout preferred by a training chunk. Conversion cost belongs in the measurement. Validate full forward outputs, final states, and gradients; matching only final outputs can conceal a state discrepancy that appears after continuation. Distributed sequence chunks require an exact handoff of boundary state or a declared equivalent scan, with transferred bytes and synchronization included.

## Experimental design

**PROPOSAL.**

### Experiment 17.2 — Discretization and schedule equivalence

- **Hypothesis:** Numerically stable discretization and complete boundary state preserve equivalence across sequential and chunked evaluation.
- **Setup:** Evaluate bounded diagonal systems before evaluating trained checkpoints.
- **Independent variables:** Step size, decay spectrum, input magnitude, chunk length, precision.
- **Controlled variables:** Inputs, coefficient functions, initial state, reset locations, output convention.
- **Dataset/workload:** Scalar zero-limit cases, impulses, constant inputs, alternating writes, and held-out text.
- **Hardware:** Declare accelerator, runtime, compiler, kernel revision, and memory configuration.
- **Metrics:** State/output/gradient error, persistent bytes, temporary bytes, prefill and decode timing separately.
- **Baselines:** Higher-precision sequential recurrence and exact small-system discretization.
- **Expected result:** Correct schedules agree within stated tolerance; speed and trained quality remain empirical questions.
- **Ablation:** Replace cancellation-aware evaluation with direct subtraction near zero; vary state dtype alone.
- **Interpretation:** A discretization mismatch is an operator change, not merely an optimization.
- **Threats to validity:** Comparing different discretizations, uncounted preprocessing, changing projection widths, and insufficiently long numerical stress tests.

## Observations

**What the paper claims — PAPER-REPORTED.** Mamba and Mamba-2 propose different structured execution designs around selective state propagation [P11; R17.1].

**What the evidence shows — MATHEMATICALLY-DERIVED.** The zero-order-hold integral handles singular systems, and input dependence removes the stationary-kernel property in general.

**What we infer — DERIVED.** Transition structure, input discretization, and execution schedule should appear as separate experimental fields.

**What remains unknown — UNVERIFIED.** This manuscript does not establish a trained-model retention horizon or a hardware-specific advantage.

## Failure modes

> **Failure mode — Discretization mismatch.** *Symptom:* Reference and optimized outputs disagree even in high precision. *Cause:* One path uses exact zero-order hold and the other a different input update. *Detection:* Compare scalar coefficients before the scan. *Mitigation:* Align the operator definition before testing tolerance.

**DERIVED.** Products of many small decays can underflow. Dividing two underflowed cumulative products does not reconstruct a valid local ratio. Use a numerically justified local or logarithmic representation, treating zero gates explicitly. Large writes can overflow despite contractive transitions. A padded position that updates state can contaminate the next valid token even when its displayed output is masked.

~~~figure
id: fig-17.8
kind: stat-panel
title: "Dynamics boundaries"
caption: "Declared mathematical and experimental boundaries; these are not measured model results."
placement: rail
anchor: failure-modes
evidence: MATHEMATICALLY-DERIVED
source: "DERIVED:eq-17.7"
alt: "Declared mathematical and experimental boundaries; these are not measured model results."
spec: {"header":"DYNAMICS BOUNDARIES","rows":[{"key":"Transition","value":"structured and causal"},{"key":"Discretization","value":"must be specified"},{"key":"Training storage","value":"not constant in general"},{"key":"Retention curve","value":"analytical, not accuracy"}]}
~~~

## Siblings

**DERIVED.** A time-invariant convolution assumes the same lag response everywhere and permits a stationary kernel. Selective dynamics relax that assumption and require input-dependent evaluation. The objective may remain next-token likelihood in either case.

[Linear attention](17-3-linear-attention.md) exposes key/value association and normalization explicitly. [Delta mechanisms](17-4-delta-rule-mechanisms.md) change the write using a state-dependent prediction residual. That transition is structured but not the same elementwise decay primitive. Substituting its matrix update into a diagonal scan without a new derivation changes the algorithm.

## Extensions

**DERIVED.** Irregularly sampled sensor streams motivate testing physical time intervals against learned steps. For multimodal token streams, differences in tokenization rate change how many updates occur per unit of media time. A proposed adaptation should control both token distance and elapsed duration, since identical per-token decay implies different real-time retention at different rates.

## Limitations

**DERIVED.** Linear state dynamics do not make the whole block linear when coefficient generation, gates, and projections contain nonlinearities. Conversely, nonlinear preprocessing does not remove finite-state capacity constraints. Scalar retention calculations isolate a mechanism and cannot stand in for task-level evaluations.

## Reproducibility

Record continuous versus directly discrete parameterization, transition structure, input discretization, readout shape, local convolution width, accumulation dtype, gate transforms, reset rules, chunk size, and state handoff. **UNVERIFIED:** optimized execution and benchmark outcomes remain unmeasured here. Versioned research and moving documentation are identified separately in the reference ledger.

## References

[P11](references.md#p11); [R17.1](references.md#r171); [R17.6](references.md#r176); [R17.7](references.md#r177); [R17.8](references.md#r178). Equations 17.5–17.7 are standard background and the chapter's explanatory derivations, not a verbatim specification of every Mamba block.
