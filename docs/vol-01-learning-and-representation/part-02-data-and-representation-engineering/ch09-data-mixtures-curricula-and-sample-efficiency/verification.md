---
id: ms.verification.9
entity_type: verification
title: Verification — mixtures at equal tokens and equal FLOPs with a held-out domain
short_title: Verification 09
volume: 1
part: 2
chapter: 9
section: null
slug: verification
parent: ms.chapter.9
prev_sibling: ms.section.9.6
next_sibling: ms.references.9
children: []
prerequisites: [ms.section.6.3, ms.section.6.4, ms.section.6.5, ms.section.9.1, ms.section.9.2, ms.section.9.3, ms.section.9.6]
downstream: [ms.section.12.5, ms.section.21.5]
related: []
siblings_by_mechanism: []
relations:
  - {type: evaluated_by, target: experiment.9.7}
  - {type: produces, target: artifact.mixture-policy-and-exposure-accounting-report}
axes:
  lifecycle: [data, pretraining, evaluation]
  mechanism: [data_mixture, matched_budget_comparison, exposure_accounting]
  feedback_setting: []
  modality: [text]
papers: [P07, P09]
implementations: [impl.mosaicml-llm-foundry, impl.megatron-lm]
benchmarks: []
datasets: []
status:
  maturity: active
  disputed: false
evidence_summary:
  labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, UNVERIFIED]
  empirically_observed: false
word_count_target: 1300
updated_at: 2026-09-24
editorial_status: manuscript_draft
---

# Verification — Chapter 09

## 1. Artifact specification

The chapter artifact is *a mixture policy and exposure accounting report*. It consists of four files; every field is defined in the owning section.

| File | Contents | Fields |
|---|---|---|
| `mixture_policy.yaml` | One record per (schedule phase, domain); the policy object of [§9.1](09-1-mixture-formulation.md) with the phase table of [§9.3](09-3-curriculum-design.md) and the provenance of [§9.4](09-4-learned-mixture-selection.md) | `policy_id, policy_hash, tokenizer_id, tokenizer_hash, seed, order_rule ∈ {permutation, with_replacement}, phases: [ {phase_id, phase_start_token, phase_end_token, sampling_unit ∈ {document, packed_sequence, token}, sequence_length_T, weight_kind ∈ {token, unit}, sampling_temperature_T_s (or null), epoch_cap_E_max, domains: [ {domain_id, source_ids (→ Chapter 07 inventory), filter_ledger_id (→ Chapter 08 removal ledger), weight (rational), content_share (or null), fertility_tokens_per_byte (or null), floor_weight (or null), synthetic_fraction (0 if none), generator_id (or null)} ] } ], provenance: {selection_method ∈ {hand_set, temperature, epoch_cap, DRO, alignment, regression, bandit, annealing_probe}, proxy_scale_params, proxy_tokens, selection_target, selected_on_datasets, sampled_mixture_count}` |
| `exposure_report.csv` | One row per (reporting step, phase, domain); the ledger of Algorithm 9.1 with the audit of Algorithm 9.2 and the planner header of Algorithm 9.6 | header block: `plan_N, plan_D, plan_C_flops (6ND, dense, fixed T), D_prime_mix (Eq. 9.25, indicative), regime_flag, R_star_D_used, sensitivity_N_star_range`; rows: `step, phase_id, domain_id, tokenizer_id, available_tokens, sampled_tokens, consumed_tokens, effective_epochs, max_unit_repetitions, skipped_tokens, masked_tokens, bytes_consumed, fertility_tokens_per_byte, content_share_realised, lr_weighted_consumed_tokens (Eq. 9.11), unique_tokens, coverage, redundancy, long_tail_retention, cell_definition_id` |
| `sampler_state.json` | The resumable state of Algorithm 9.1 (and the deferred queues of Algorithm 9.3 when gating is on) | `policy_hash, seed, committed_index, credits[k], pass[k], pos[k], sampled_tokens[k], consumed_tokens[k], deferred_queues[k] (or empty), world_size_at_save, written_at_step` |
| `comparison_manifest.json` | The matched-budget comparison record of §2 below, in the Comparison-record form of Appendix B | `mixtures_compared: [policy_id], budget_conventions: {equal_tokens: D, equal_flops: C}, model_family, sizes, sequence_length, tokenizer_hash, held_out_domain_id, held_out_domain_exclusions: {pools, selection_targets, reference_models, generators}, seeds, evaluator_id, evaluator_independence_statement, metrics, pre_registered_margin_held_out, pre_registered_effect_size, results (empty until executed), threats_recorded` |

Invariants across files: `policy_hash` in `sampler_state.json` and every `exposure_report.csv` row equals the hash of `mixture_policy.yaml`; `consumed_tokens ≤ sampled_tokens` per row; `effective_epochs = consumed_tokens / available_tokens`; `Σ_domains weight = 1` per phase as rationals; a domain with `synthetic_fraction > 0` names its `generator_id`.

## 2. Verification task

The task from the plan: *compare mixtures at equal tokens and equal FLOPs; include a held-out domain to expose over-specialization.* The central claim it tests is the chapter's: that per-domain exposure — consumed tokens, effective epochs and, for time-indexed policies, where those tokens fall in the schedule — is what determines what a model learns per FLOP (the ledger records timing as learning-rate-weighted exposure, Eq. 9.11, which is one candidate account of the timing effect alongside the persistence of late tokens; [Experiment 9.3](09-3-curriculum-design.md#experiment-93--data-shift-versus-decay-in-a-late-phase) separates them), so that (i) two policies with matched exposure are indistinguishable, (ii) a policy that claims a sample-efficiency gain must show it under both budget conventions, and (iii) a gain confined to in-mixture domains while a held-out domain degrades is specialisation, not efficiency. The matched-budget design vocabulary (baselines, ablations, fixed budgets, interaction effects) is owned by [§6.3](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-3-controlled-comparisons.md); the frontier comparison at fixed compute by [§6.5](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-5-quality-resource-frontiers.md); seed and task variance by [§6.4](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md).

### Experiment 9.7 — Mixture comparison at equal tokens and equal FLOPs with a held-out domain

- **Hypothesis.** Among at least three mixture policies on identical pools — a size-proportional baseline P0, a hand-set temperature or epoch-capped policy P1, and a proxy-selected or late-stage policy P2 — any policy credited with a sample-efficiency gain over P0 improves the in-mixture aggregate under *both* the equal-tokens and the equal-FLOPs convention, across seeds, without degrading the held-out domain beyond the pre-registered margin. Two policies with matched per-domain consumed tokens and repetition counts but different nominal weights and units (the exposure-matched pair of [Experiment 9.1](09-1-mixture-formulation.md#experiment-91--exposure-equivalence-across-sampling-units-and-temperatures)) differ by no more than seed noise.
- **Setup.** Pools: k ≥ 6 open domains from the Chapter 07 inventory after the Chapter 08 ledger, plus one held-out domain D_H excluded from every pool, every selection target, every reference or proxy model, and every synthetic generator's prompts. Model: one dense family at two sizes; budgets stated in the DCLM convention "tokens = 20 × parameters × Chinchilla multiplier" (PAPER-REPORTED, P07, Table 1), e.g. 1B-1x and 1B-2x, so that the equal-FLOPs convention is explicit. Sequence length fixed across arms *except* in a length-curriculum arm, for which FLOPs are computed from Eq. 9.10 of [§9.3](09-3-curriculum-design.md).
- **Independent variables.** Policy ∈ {P0, P1, P2, and the exposure-matched twin of P1}; budget convention ∈ {equal consumed tokens, equal training FLOPs}; model size (two values).
- **Controlled variables.** Tokenizer (hash recorded), pools and filter ledger, model architecture, optimiser and schedule (identical across arms at equal tokens; at equal FLOPs, a length-curriculum arm consumes more tokens at the same C and this is stated), packing rule, seeds (3 per arm per size), evaluator identity and its independence from the pool construction ([§6.1](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-1-evaluation-units.md)).
- **Dataset / workload.** Per-domain held-out validation splits; D_H validation; a benchmark suite decontaminated against every pool by the [§8.5](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md) procedure; a rare-entity question set for the memorisation probe of [§9.2](09-2-quality-and-diversity.md).
- **Hardware.** Any accelerator; the report records device, framework and loader versions; FLOPs are reported as 6ND (dense, fixed T) or by Eq. 9.10 for length phases — never from wall-clock.
- **Metrics.** Token-mean loss per domain and on D_H ([§4.1](../../part-01-scientific-foundations/ch04-language-modeling-and-learning-objectives/04-1-autoregressive-modeling.md) normalisation stated); bits per byte for any multilingual arm; benchmark suite; the full exposure ledger per arm (consumed tokens, effective epochs, max unit repetitions, η-weighted exposure); paired seed differences with confidence intervals ([§2.5](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md)).
- **Baselines.** P0 at each budget and size.
- **Expected result.** If the chapter's claims hold: the exposure-matched twin is within seed noise of P1 under both conventions; P2's in-mixture gain has the same sign under both conventions; D_H moves within the margin for P1 and for a P2 that keeps a base-mix floor, and outside it for a P2 without a floor; the gain shrinks between the two sizes but does not change sign.
- **Ablation.** (a) Remove the held-out domain's exclusion from the selection target for P2 (leakage): the reported gain rises — this quantifies leakage. (b) Count sampled instead of consumed tokens with 2% domain-correlated skips injected: the ledger misstates exposure by a predictable amount. (c) Swap the budget convention only: a policy whose gain flips sign is exploiting the convention, not the data.
- **Interpretation.** A pass supports the exposure-accounting claim and licenses the phrase "sample-efficiency gain" for P2 at the tested scales only. The result says nothing about transfer to larger scales (see [§9.4](09-4-learned-mixture-selection.md)).
- **Threats to validity.** Small models may be insensitive to ordering and to modest weight changes; the held-out domain may be close to a sampled domain (report a similarity measure); evaluator suites are themselves mixtures of domains and can favour a policy; the equal-FLOPs convention at fixed N and T coincides with equal tokens, so the two conventions separate only when T or N differ — the protocol must include at least one such arm or state that the conventions coincide.

```figure
id: fig-9.35
kind: diagram
title: Experiment 9.7, mixtures at equal tokens and equal FLOPs with a held-out domain
caption: >-
  Follow the heavy path: every policy runs through the same sampler and model
  family under both budget conventions, and the verdict is read from the
  per-domain losses and the held-out domain together. The held-out domain is
  a boundary drawn around everything that could leak into it. The
  exposure-matched twin is the arm that tests the chapter's central claim; the three
  ablations must each change the verdict in the predicted direction. The
  thresholds on the verdict are ASSUMED pre-registration defaults until run.
placement: wide
evidence: ASSUMED
source: ["DERIVED:alg-9.1", "DERIVED:eq-9.10", P07]
alt: >-
  Left-to-right diagram of Experiment 9.7. At least six open domain pools feed
  four policies: P0 size-proportional, P1 temperature or epoch cap, P1's
  exposure-matched twin with another unit, and P2 proxy-selected or
  late-stage. All run through the Algorithm 9.1 sampler, which writes the
  exposure report (consumed tokens, epochs, maximum repetitions, η-weighted
  exposure). A branch applies equal consumed tokens or equal training FLOPs
  (6ND, or Eq. 9.10 for a length arm) to one dense family at two sizes in the
  P07 convention, such as 1B-1x and 1B-2x. Evaluation measures per-domain
  loss, the held-out domain's loss and a decontaminated suite over three
  seeds. The held-out domain D_H is excluded from every pool, selection
  target, reference model and generator prompt, checked by a leakage report.
  The acceptance criteria give four outcomes: credit when the gain has the
  same sign under both conventions and D_H stays within its margin;
  specialisation when D_H degrades; a convention exploit when the sign flips;
  rejection of the central claim when the twin differs from P1 beyond seed
  noise. Three ablations must each move the verdict.
spec:
  direction: LR
  nodes:
    - { id: pools, kind: dataset, label: "k ≥ 6 open domain pools", sub: "Ch. 07 inventory · Ch. 08 ledger" }
    - { id: dh, kind: boundary, label: "held-out domain D_H", sub: "outside pools, targets, refs, generators" }
    - { id: p0, kind: process, label: "P0 size-proportional", group: pol }
    - { id: p1, kind: process, label: "P1 temperature or epoch cap", group: pol }
    - { id: twin, kind: process, label: "P1 twin: same exposure, other unit", group: pol, emphasis: true }
    - { id: p2, kind: process, label: "P2 proxy-selected or late-stage", group: pol }
    - { id: sampler, kind: process, label: "Algorithm 9.1 sampler", sub: "sampler_state.json" }
    - { id: ledger, kind: metric, label: "exposure_report.csv", sub: "d_i, e_i, r_i^max, d̃_i" }
    - { id: conv, kind: branch, label: "budget convention", sub: "equal tokens D · equal FLOPs C" }
    - { id: model, kind: model, label: "one dense family, two sizes", sub: "1B-1x and 1B-2x (P07)" }
    - { id: evalm, kind: metric, label: "per-domain loss, D_H loss, suite", sub: "3 seeds, paired differences" }
    - { id: leak, kind: dependency, label: "leakage report", sub: "n-gram overlap, §8.5" }
    - { id: abl, kind: dependency, label: "ablations a–c", sub: "leakage · sampled count · convention swap" }
    - { id: verdict, kind: branch, label: "acceptance criteria (§3)" }
    - { id: credit, kind: state, label: "credit: same sign under both, D_H in margin" }
    - { id: spec, kind: state, label: "specialisation: D_H degrades" }
    - { id: flip, kind: state, label: "exploits the convention: sign flips" }
    - { id: reject, kind: state, label: "twin ≠ P1: exposure is not the whole story" }
  edges:
    - { from: pools, to: sampler }
    - { from: p0, to: sampler, kind: dependency }
    - { from: p1, to: sampler, kind: dependency }
    - { from: twin, to: sampler, kind: dependency }
    - { from: p2, to: sampler, kind: dependency }
    - { from: sampler, to: ledger }
    - { from: sampler, to: conv, kind: emphasis }
    - { from: conv, to: model, kind: emphasis }
    - { from: model, to: evalm, kind: emphasis }
    - { from: dh, to: evalm, kind: dependency, label: "held-out loss" }
    - { from: dh, to: leak, kind: dependency, label: "exclusions checked" }
    - { from: evalm, to: verdict, kind: emphasis }
    - { from: ledger, to: verdict, kind: dependency, label: "exposure match" }
    - { from: leak, to: verdict, kind: dependency }
    - { from: abl, to: verdict, kind: dependency, label: "must move the verdict" }
    - { from: verdict, to: credit }
    - { from: verdict, to: spec }
    - { from: verdict, to: flip }
    - { from: verdict, to: reject }
  groups:
    - { id: pol, label: "≥ 3 policies on the same pools" }
```

### What would reject the chapter's central claim

If the exposure-matched twin of P1 differs from P1 beyond seed noise, under either convention, at either size, and the difference survives the ablations — then per-domain exposure does not explain outcome differences: something about nominal weights, sampling unit or intra-batch composition is causal in its own right, and the policy definition of [§9.1](09-1-mixture-formulation.md) is incomplete (most plausibly missing a packing or batch-composition rule). If P2's gain has opposite signs under the two conventions, the chapter's insistence on both conventions is vindicated but the specific policy is not a sample-efficiency gain. If every policy degrades D_H beyond the margin, the pools are too narrow for the held-out design and the domain partition must be revisited.

## 3. Acceptance criteria

Thresholds are ASSUMED pre-registration defaults; they become measured floors only after execution.

| Criterion | Threshold | Rationale |
|---|---|---|
| Ledger consistency | `Σ_i consumed_tokens_i` within one packed sequence of the planned D per phase; `|count_i(t) − t·w_i| < 1` in units at every reporting step | Algorithm 9.1 invariant, MATHEMATICALLY-DERIVED |
| Restart determinism | The hash of the first 10⁴ emitted (domain, unit, pass) triples after a restart at any step, and at two world sizes, equals the uninterrupted run's | [§9.1](09-1-mixture-formulation.md) Mechanism; [§12.5](../ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-5-resume-semantics.md) |
| Exposure-matched equivalence | Paired difference in in-mixture aggregate loss between P1 and its twin has a 95% interval containing zero, and its point estimate is below 0.25 × the P0–P1 effect | Seed-noise floor from three seeds, [§6.4](../../part-01-scientific-foundations/ch06-experimental-design-and-evaluation-before-optimization/06-4-measurement-uncertainty.md) |
| Sample-efficiency credit | P2 improves the in-mixture aggregate over P0 under both conventions with the same sign, with 95% intervals excluding zero at the larger size | Both-conventions rule of this chapter |
| Held-out margin | D_H loss for any credited policy no worse than P0 by more than the pre-registered margin (default: 0.5 × the P0 seed standard deviation on D_H) | Over-specialisation guard; ASSUMED constant |
| Epoch report | Every credited policy's ledger lists e_i and r_i^max per domain; any domain with e_i > 4 is flagged and discussed; any with e_i > 16 requires a stated justification | R9.5 boundaries, PAPER-REPORTED, as applied in [§9.6](09-6-data-scaling-limits.md) |
| Leakage report | Empty overlap (n-gram, [§8.5](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-5-evaluation-contamination.md) procedure) between D_H and every pool, selection target, reference model corpus and generator prompt set; non-empty overlap voids the held-out result | Selection-leakage definition of [§9.4](09-4-learned-mixture-selection.md) |
| FLOP statement | Every arm reports C from 6ND (dense, fixed T) or Eq. 9.10; wall-clock is reported separately and never substituted | [notation.md](../../../front-matter/notation.md) §2.2 |

Categorical criteria: ablation (a) must raise the measured gain (if it does not, the leakage guard is not binding and the held-out design should be tightened); ablation (b) must be detected by the sampled/consumed divergence; ablation (c) must be reported for every credited policy.

### Diagnostic signatures

| Observation | Indicates | Chapter reference |
|---|---|---|
| Twin differs from P1; difference constant per domain | Unit/weight mismatch (Eq. 9.2 not applied) | [§9.1](09-1-mixture-formulation.md) Failure modes |
| Small domain's loss falls early then rises; r_i^max ≫ ⌈e_i⌉ | Silent repetition under with-replacement order | [§9.1](09-1-mixture-formulation.md), [§9.6](09-6-data-scaling-limits.md) |
| Gain present at equal tokens, absent at equal FLOPs | A length or size change is doing the work | [§9.3](09-3-curriculum-design.md) Eq. 9.10 |
| Gain present only on benchmarks whose training splits are in a pool | In-distribution exposure, not efficiency | [§9.3](09-3-curriculum-design.md), [§9.4](09-4-learned-mixture-selection.md) leakage paths |
| D_H degrades while in-mixture improves | Over-specialisation; missing floor weight | [§9.3](09-3-curriculum-design.md), [§9.5](09-5-multilingual-and-specialist-mixtures.md) |
| Gain shrinks with size but keeps sign | Expected; consistent with R9.8's 405B observation | [§9.4](09-4-learned-mixture-selection.md) Observations |
| Gain flips sign with size | Rank invariance fails for this policy and pool set | [§9.4](09-4-learned-mixture-selection.md) Limitations |

## 4. What this edition did not do

This protocol is a proposal. No run of Experiment 9.7, nor of Experiments 9.1–9.6, was executed for Edition 1.0; no `exposure_report.csv`, `sampler_state.json` or `comparison_manifest.json` with results exists; the thresholds in §3 are pre-registration defaults, not measured floors. The reference listing in §5 has not been executed and is UNVERIFIED; it targets no framework version and uses only the Python standard library so that its integer arithmetic can be checked by reading.

## 5. Reference implementation of Algorithm 9.1 (reference-level, UNVERIFIED)

```python
"""sampler.py — Chapter 09 artifact, Algorithm 9.1 (outer draw and exposure counters).

Reference-level, standard library only. NOT EXECUTED for this edition: UNVERIFIED.
Weights are rationals with a common denominator Q so that the credit scheme is exact.
The within-domain permutation is a seeded Fisher–Yates over a stored index list; a
Feistel bijection would remove the O(|U_i|) storage but is omitted for readability.
"""
from dataclasses import dataclass, field
import hashlib, json, random


@dataclass
class DomainState:
    n_units: int
    unit_lengths: list            # tokens per unit under the run's tokenizer
    credit: int = 0
    pass_idx: int = 0
    pos: int = 0
    perm: list = field(default_factory=list)
    sampled_tokens: int = 0
    consumed_tokens: int = 0


class WeightedSampler:
    def __init__(self, weights_num: list[int], Q: int, domains: list[DomainState], seed: int):
        assert sum(weights_num) == Q, "weights must be rationals over a common denominator Q"
        self.w, self.Q, self.d, self.seed = weights_num, Q, domains, seed
        self.t = 0                      # global index of the next draw
        self.committed_index = 0
        self.pending = []               # (t, domain, unit_len) awaiting COMMIT
        self.policy_hash = hashlib.sha256(json.dumps([weights_num, Q, seed]).encode()).hexdigest()

    def _new_perm(self, i: int):
        st = self.d[i]
        rng = random.Random(f"{self.seed}:{i}:{st.pass_idx}")
        st.perm = list(range(st.n_units)); rng.shuffle(st.perm); st.pos = 0

    def draw(self):
        """One outer draw; returns (domain, unit, pass). Exactly proportional: |count_i - t*w_i/Q| < 1."""
        for i, st in enumerate(self.d):
            st.credit += self.w[i]                                  # accrue Q*w_i with Q folded in
        i = max(range(len(self.d)), key=lambda k: (self.d[k].credit, -k))   # argmax, lowest index on ties
        st = self.d[i]; st.credit -= self.Q
        if not st.perm or st.pos == st.n_units:
            if st.perm: st.pass_idx += 1
            self._new_perm(i)
        j = st.perm[st.pos]; st.pos += 1
        st.sampled_tokens += st.unit_lengths[j]
        self.pending.append((self.t, i, st.unit_lengths[j]))
        self.t += 1
        return i, j, st.pass_idx

    def commit(self, upto: int, unmasked_fraction: float = 1.0):
        """Training loop signals that every draw with index <= upto entered a retained optimiser step."""
        keep = []
        for (t, i, L) in self.pending:
            if t <= upto: self.d[i].consumed_tokens += int(L * unmasked_fraction)
            else: keep.append((t, i, L))
        self.pending = keep; self.committed_index = upto + 1

    def state_dict(self) -> dict:
        return {"policy_hash": self.policy_hash, "seed": self.seed, "t": self.t,
                "committed_index": self.committed_index,
                "domains": [{"credit": s.credit, "pass": s.pass_idx, "pos": s.pos,
                             "sampled": s.sampled_tokens, "consumed": s.consumed_tokens} for s in self.d]}

    def load_state_dict(self, sd: dict):
        assert sd["policy_hash"] == self.policy_hash
        self.t, self.committed_index = sd["t"], sd["committed_index"]
        for s, r in zip(self.d, sd["domains"]):
            s.credit, s.pass_idx, s.pos = r["credit"], r["pass"], r["pos"]
            s.sampled_tokens, s.consumed_tokens = r["sampled"], r["consumed"]
            self._new_perm(self.d.index(s)); s.pos = r["pos"]   # regenerate the pass permutation, then seek

    def exposure_row(self, step: int, available_tokens: list[int]) -> list[dict]:
        return [{"step": step, "domain": i, "available_tokens": available_tokens[i],
                 "sampled_tokens": s.sampled_tokens, "consumed_tokens": s.consumed_tokens,
                 "effective_epochs": s.consumed_tokens / max(available_tokens[i], 1),
                 "max_unit_repetitions": s.pass_idx + (1 if s.pos > 0 else 0)}
                for i, s in enumerate(self.d)]
```

Rank partitioning (Algorithm 9.1, line 11) is applied by the caller: rank r consumes the draw with global index t iff `t % world_size == r`; every rank runs the same sampler and therefore holds the same state, so no communication is needed. The `commit` call must be made with the same `upto` on every rank, after the optimiser step is known to be retained.
