---
id: ms.verification.4
entity_type: verification
title: Chapter 04 verification — objective ledger and hand-audited masks
short_title: Verification 04
volume: 1
part: 1
chapter: 4
section: null
slug: verification
parent: ms.chapter.4
prev_sibling: ms.section.4.6
next_sibling: ms.references.4
children: []
prerequisites: [ms.section.4.1, ms.section.4.2, ms.section.4.3, ms.section.4.4, ms.section.4.5, ms.section.4.6]
downstream: [ms.chapter.5, ms.chapter.19, ms.chapter.31]
related: []
siblings_by_mechanism: []
relations:
  - {type: evaluated_by, target: ms.verification.4}
axes: {lifecycle: [pretraining, evaluation], mechanism: [objective, masking, normalization], feedback_setting: [], modality: [text, code, image, audio, action]}
papers: [P01, P02, P13, P44]
implementations: []
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, PAPER-REPORTED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 700
updated_at: 2026-09-20
editorial_status: manuscript_draft
---

# Verification — Chapter 04

## 1. Artifact specification: the objective ledger

The chapter artifact is a single table, the **objective ledger**, with one row per objective family. Fields:

| Field | Type | Meaning |
|---|---|---|
| `objective_id` | key | stable identifier used by later chapters |
| `family` | enum | causal · masked · span · denoising · prefix · enc_dec · fim · causal_masking · mtp · auxiliary · cond_gen · contrastive · discriminative |
| `sequence_construction` | text | how the training sequence is built from raw data (shift, corruption, rearrangement, concatenation) |
| `conditioning` | text | what each scored position may attend to (visible set), and the interface for non-text c |
| `attention_mask` | enum | causal · bidirectional · block(prefix bidirectional, rest causal) · cross(enc→dec) |
| `target_positions` | text | which positions carry targets and what the target is |
| `loss_mask` | text | m_t as a rule over positions |
| `normalisation` | text | token-mean / sequence-mean / per-router-layer / per-pair; the denominator |
| `special_tokens` | list | sentinels, mode tokens, placeholders |
| `target_length_ratio` | expr | ρ from Eq. 4.6 |
| `extra_params_flops` | text | parameters and FLOPs beyond the causal row |
| `anchor` | id | primary source |
| `label` | enum | evidence label for the row as transcribed |

### 1.1 Populated ledger

| objective_id | family | sequence_construction | conditioning / interface | attention_mask | target_positions | loss_mask m_t | normalisation | special_tokens | ρ | extra params / FLOPs | anchor | label |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `causal_lm` | causal | inp = [BOS, x_1..x_T], tgt = [x_1..x_T, EOS] | x_{<t}; text c as prefix | causal | every t: x_t | 1 on all non-pad targets | token-mean, global count (Eq. 4.2) | BOS, EOS | 1 | none | P01 §3.1; §4.1 | MATHEMATICALLY-DERIVED |
| `mlm` | masked | 15% positions selected; 80/10/10 replacement | all of x̃ | bidirectional | t ∈ M: original x_t | 1[t ∈ M] | mean over |M| (Eq. 4.3) | [MASK] | |M|/T ≈ 0.15 | none; no sampler | R4.1 §3.1 | PAPER-REPORTED |
| `span_corruption` | span | spans → sentinels in x̃; y = s_1∘span_1∘…∘s_{K+1} | enc(x̃) via cross-attn; y_{<j} | bidirectional enc; causal dec + cross | every j of y | 1 on all of y | mean over |y| (Eq. 4.4) | sentinels s_k (`<extra_id_k>`) | |y|/|x̃| | second stack + cross-attn (4·T_enc·d² K/V proj per layer) | P02 §3.1.4; R4.28 | PAPER-REPORTED |
| `denoising_bart` | denoising | x̃ = noise(x) (infilling, permutation); y = x | enc(x̃); y_{<j} | as above | every j of x | 1 on all of x | mean over T | mask token | ≈ 1 | second stack + cross-attn | R4.3 | PAPER-REPORTED |
| `prefix_lm` | prefix | x = (x_{1:P}, x_{P+1:T}) unchanged | prefix bidirectional; rest causal | block | t > P: x_t | 1[t > P] | mean over T − P (Eq. 4.5) | none | (T−P)/T | none; block mask kernel support | P02 §3.2; R4.8 | PAPER-REPORTED |
| `enc_dec_supervised` | enc_dec | (source, target) pairs | enc(source); y_{<j} | bidirectional enc; causal dec + cross | every j of target | 1 on target | mean over |target| | BOS/EOS | |y|/|source| | second stack + cross-attn | P01 | PAPER-REPORTED |
| `ul2_mod` | span (mixture) | per-example switch among R/S/X denoisers | as span/prefix | as span/prefix | as chosen row | as chosen row | as chosen row | [R], [S], [X] | row-dependent | none beyond enc–dec | R4.4 | PAPER-REPORTED |
| `fim_psm` | fim | PRE∘prefix∘SUF∘suffix∘MID∘middle∘EOT (char-level uniform split), rate 0.5 | causal over rearranged seq | causal | every t | 1 on all sections (R4.5 choice); variant: middle only | token-mean | PRE, SUF, MID, EOT | 1 (variant: |mid|/T) | +4 tokens/doc | R4.5 | PAPER-REPORTED |
| `fim_spm` | fim | suffix, then prefix, then middle; prefix+middle encoded jointly (R4.12) | causal | causal | every t | as fim_psm | token-mean | sentinel layout UNVERIFIED | 1 | +4 tokens/doc | R4.5; R4.12 | PAPER-REPORTED / UNVERIFIED (layout) |
| `causal_masking` | causal_masking | spans replaced by sentinels in body; spans appended at end | causal | causal | appended spans (and body) | 1 on appended spans; body treatment NOT-DISCLOSED | token-mean | sentinels | ≤ 1 | + sentinel and span tokens | R4.9 | PAPER-REPORTED |
| `mtp_sequential` | mtp | depth-k module: M_k[RMSNorm(h^{k−1}); RMSNorm(Emb(x_{t+k}))] → TRM_k → shared OutHead | causal chain preserved at each depth | causal | positions 2+k … T+1 at depth k | 1 on those positions (boundary handling NOT-DISCLOSED) | (λ/D)·Σ_k mean CE; λ = 0.3→0.1 at 10T/14.8T tokens; D = 1 | none | 1 per depth | +1 block + 2d² per depth; +1 OutHead eval/token | P13 §2.2, §4 | PAPER-REPORTED |
| `mtp_parallel_heads` | mtp | n independent [d, V] heads on shared trunk | causal | causal | t+1 … t+n | 1 | sum over heads of token-mean CE | none | n | +(n−1)·d·V params; +(n−1) OutHead evals/token | R4.13 | PAPER-REPORTED |
| `z_loss` | auxiliary | none (scalar from log-sum-exp) | — | — | none | — | coefficient 10⁻⁴ · mean log²Z (PaLM); router variant c_z = 0.001 (ST-MoE) | none | — | ≈ 0 | R4.14; R4.15 | PAPER-REPORTED |
| `router_balance` | auxiliary | none | — | — | none | — | α·N·Σ f_i P_i, α = 10⁻² (Switch); sequence-wise α = 0.0001 (P13) | none | — | ≈ 0 | P10 §2.2; P13 §2.1 | PAPER-REPORTED |
| `cond_gen_doc` | cond_gen | [c tokens ∘ x tokens] | c as text prefix | causal | x positions | 0 on c, 1 on x | token-mean over x | segment markers | |x|/(|c|+|x|) | none | §31.1 forward | MATHEMATICALLY-DERIVED |
| `cond_gen_image_prefix` | cond_gen | [W·φ(image) ∘ prompt ∘ answer] | image features as prefix tokens; gradient into W (stage 1) and LLM (stage 2) | causal | answer tokens | 0 on image and prompt, 1 on answer | token-mean over answer | image placeholders | |ans|/(n_img+|prompt|+|ans|) | encoder FLOPs; n_img KV positions | R4.19 | PAPER-REPORTED |
| `cond_gen_audio_encdec` | cond_gen | enc(audio); dec = [task tokens ∘ transcript] | cross-attn to audio encoder; task tokens as conditioning | bidirectional enc; causal dec + cross | transcript tokens (some task tokens are targets per R4.18) | 1 on transcript; task-token scoring per report | token-mean | language/task/timestamp tokens | |transcript|/|frames| | encoder + cross-attn | R4.18 | PAPER-REPORTED |
| `action_conditioned` | cond_gen | interleaved (R̂_t, s_t, a_t) tokens | history of returns, states, actions | causal | action tokens | 1 on actions (policy) or actions+observations (world model) — design field | token-mean over scored tokens | modality tokens | design-dependent | tokenisers per modality | R4.20; R4.21 | PAPER-REPORTED |
| `contrastive_pair` | contrastive | batch of N (a_i, b_i) | none (two encoders) | — | pair identity over the batch | 1 per pair | symmetric CE, mean over 2N rows; candidate set = global N | none | — | two encoders; N×N matrix; all-gather | P44 §2.3 | PAPER-REPORTED |
| `discriminative_head` | discriminative | (input, label) | encoder | bidirectional or causal | label ∈ 𝒴 | 1 per example | mean over examples | none | — | head [d, |𝒴|]; no sampler | R4.1 (fine-tuning) | PAPER-REPORTED |

## 2. Verification task

The plan's task: *reproduce objective masking on a hand-audited sequence and show when two reported perplexities are incomparable.*

```figure
id: fig-4.35
kind: diagram
title: The two-part verification protocol for the objective ledger
caption: >-
  The upper group checks that a ledger row is sufficient: regenerate the
  integer tensors from the row alone and require exact equality, with any
  mismatch sent back to the ledger, never to the tables. The lower group
  checks the incomparability claim; the chapter is rejected only if two
  conventions can be shown to give identical ℓ for every model and text.
placement: wide
evidence: MATHEMATICALLY-DERIVED
source: ["DERIVED:alg-4.1", "DERIVED:alg-4.2", "DERIVED:alg-4.3", "DERIVED:alg-4.4", "DERIVED:eq-4.15", "DERIVED:eq-4.18"]
alt: >-
  Diagram of the verification protocol in two groups. Hand-audited masks
  (§2.1): the 12-token audit sequence with toy ids (BOS 1, EOS 2, PAD 0) and
  one ledger row of 13 fields feed Algorithms 4.1 to 4.4, run for the causal,
  span, prefix, FIM and MTP rows; they produce input, target, loss-mask and
  visibility tensors, which are compared with the §2.1 tables for exact
  equality with no tolerance. On a match, Σm and ρ per row are checked: 13, 6,
  5, 16 (or 6 middle-only) and 13 + 12; then the row is accepted. On a
  mismatch the ledger row is under-specified and a feedback edge returns to
  revise it. Incomparable perplexities (§2.2): two synthetic reports for the
  same checkpoint and text are diffed on the five conventions; a branch asks
  which of Eq. 4.15 to 4.18 the pair evaluates differently. Naming an
  equation marks the pair incomparable, or comparable only as BPB for the
  tokenizer row; showing identical ℓ for all models and texts rejects the
  chapter's claim.
spec:
  direction: TB
  nodes:
    - { id: seq, kind: dataset, label: "12-token audit sequence", sub: "toy ids; BOS 1, EOS 2, PAD 0", group: audit }
    - { id: row, kind: node, label: "ledger row, 13 fields", sub: "§1.1", group: audit }
    - { id: algs, kind: process, label: "Algorithms 4.1–4.4", sub: "causal · span · prefix · FIM · MTP", group: audit }
    - { id: tens, kind: tensor, label: "input, target, m_t, visibility", sub: "integer tensors", group: audit }
    - { id: eq, kind: branch, label: "exact equality with the §2.1 tables?", sub: "tolerance: none", group: audit }
    - { id: sums, kind: metric, label: "Σm and ρ per row", sub: "13 · 6 · 5 · 16 (6) · 13 + 12", group: audit }
    - { id: ok, kind: state, label: "row accepted", group: audit }
    - { id: under, kind: feedback, label: "ledger row under-specified", sub: "revise the row, regenerate", group: audit }
    - { id: reps, kind: dataset, label: "two synthetic PPL reports", sub: "same checkpoint, same text", group: ppl }
    - { id: diff, kind: process, label: "diff the five conventions", sub: "tokenizer · norm · stride · boundary · set", group: ppl }
    - { id: which, kind: branch, label: "which of Eq. 4.15–4.18 differs?", group: ppl }
    - { id: inc, kind: state, label: "incomparable, or comparable only as BPB", group: ppl }
    - { id: rej, kind: boundary, label: "chapter claim rejected", sub: "identical ℓ for all models and texts" }
  edges:
    - { from: seq, to: algs }
    - { from: row, to: algs, kind: dependency, label: "row alone" }
    - { from: algs, to: tens, kind: emphasis }
    - { from: tens, to: eq, kind: emphasis }
    - { from: eq, to: sums, kind: emphasis, label: "match" }
    - { from: sums, to: ok, kind: emphasis }
    - { from: eq, to: under, label: "mismatch" }
    - { from: under, to: row, kind: feedback, label: "revise" }
    - { from: reps, to: diff }
    - { from: diff, to: which }
    - { from: which, to: inc, label: "an equation is named" }
    - { from: which, to: rej, label: "no equation differs" }
  groups:
    - { id: audit, label: "§2.1 hand-audited masks" }
    - { id: ppl, label: "§2.2 incomparable perplexities" }
```

### 2.1 Hand-audited sequence

The sequence is 12 tokens from a toy tokenizer. The ids are **illustrative** (ASSUMED): they are not the ids of any released tokenizer, and the verification is over the *structure*, not the values.

| pos t | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| text | `def` | `▁add` | `(` | `a` | `,` | `▁b` | `)` | `:` | `▁return` | `▁a` | `+` | `▁b` |
| id | 1042 | 3931 | 7 | 64 | 11 | 275 | 8 | 25 | 1441 | 257 | 10 | 275 |

Special ids: BOS = 1, EOS = 2, PAD = 0, sentinels S0 = 32000, S1 = 32001, S2 = 32002, PRE = 32010, SUF = 32011, MID = 32012, EOT = 2 (shared with EOS in this toy).

**Row `causal_lm`** (Algorithm 4.1):

| slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| input | 1 | 1042 | 3931 | 7 | 64 | 11 | 275 | 8 | 25 | 1441 | 257 | 10 | 275 |
| target | 1042 | 3931 | 7 | 64 | 11 | 275 | 8 | 25 | 1441 | 257 | 10 | 275 | 2 |
| m_t | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| visible | ≤0 | ≤1 | ≤2 | ≤3 | ≤4 | ≤5 | ≤6 | ≤7 | ≤8 | ≤9 | ≤10 | ≤11 | ≤12 |

Denominator Σm = 13; ρ = 1. Check: the target at slot j equals the input at slot j+1 for all j < 12 (shift invariant).

**Row `span_corruption`** (Algorithm 4.2; spans chosen by hand: positions 4–5 and position 11; 3 of 12 tokens = 25%, above the P02 15% rate, chosen for legibility — ASSUMED):

Encoder input x̃ (11 tokens): `[1042, 3931, 7, 32000, 275, 8, 25, 1441, 257, 32001, 275]` — bidirectional visibility over all 11.
Decoder input (shifted): `[0, 32000, 64, 11, 32001, 10]`; decoder target y: `[32000, 64, 11, 32001, 10, 32002]`; m = `[1, 1, 1, 1, 1, 1]`.
Denominator Σm = 6; ρ = 6/11. Check: every original token appears exactly once in x̃ or y, excluding sentinels (Algorithm 4.2 invariant): x̃ holds positions 1–3, 6–10, 12; y holds 4, 5, 11. ✔

**Row `prefix_lm`** (P = 8, Eq. 4.5):

| slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| input | 1 | 1042 | 3931 | 7 | 64 | 11 | 275 | 8 | 25 | 1441 | 257 | 10 | 275 |
| target | — | — | — | — | — | — | — | — | 1441 | 257 | 10 | 275 | 2 |
| m_t | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 |
| visible | 0–8 | 0–8 | 0–8 | 0–8 | 0–8 | 0–8 | 0–8 | 0–8 | 0–8 | ≤9 | ≤10 | ≤11 | ≤12 |

Slots 0–8 (BOS plus the 8 prefix tokens) attend bidirectionally among themselves; slots 9–12 attend causally. Denominator Σm = 5; ρ = 5/13. Check: no scored slot precedes P. ✔

**Row `fim_psm`** (Algorithm 4.3; split by hand: prefix = positions 1–3, middle = 4–8, suffix = 9–12):

| slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| token | PRE | 1042 | 3931 | 7 | SUF | 1441 | 257 | 10 | 275 | MID | 64 | 11 | 275 | 8 | 25 | EOT |
| id | 32010 | 1042 | 3931 | 7 | 32011 | 1441 | 257 | 10 | 275 | 32012 | 64 | 11 | 275 | 8 | 25 | 2 |
| m_t (R4.5: all) | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| m_t (middle-only) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 1 | 1 | 1 |

(Targets are the next slot as in the causal row; the table shows the input sequence and the two mask variants.) Length 12 + 4 = 16 (Algorithm 4.3 invariant). ✔ Under `fim_spm` the same tokens are laid out with the suffix block before the prefix block and the middle last; the middle's visible context is then [suffix, prefix], contiguous with the prefix.

**Row `mtp_sequential`, D = 1** (Algorithm 4.4): main targets = the causal row above; depth-1 targets at slots 0…11 are ids at positions t+2: `[3931, 7, 64, 11, 275, 8, 25, 1441, 257, 10, 275, 2]`, mask 1 on 12 slots (slot 12 has no depth-1 target). Denominator for L_MTP = 12; for L_NTP = 13. Their coefficients (1 and λ) therefore weight means over different counts — the normalisation field matters. ✔

### 2.2 Incomparable perplexities

Two synthetic reports for the *same checkpoint* on the *same text*, constructed only from the definitions (no model was run; every number below is a placeholder pattern, not a measurement — ASSUMED):

| Convention | Report A | Report B | Effect on the comparison |
|---|---|---|---|
| Tokenizer | 32k vocabulary, L_T = 1.30 tokens/byte-normalised unit | 128k vocabulary, L_T = 1.00 | B scores fewer tokens per byte; per-token ℓ_B < ℓ_A even if BPB is identical (Eq. 4.16) — **incomparable as PPL, comparable as BPB** |
| Normalisation | token-mean over all documents | mean of per-document means | differ unless all documents have equal length or equal loss (Eq. 4.18) — **incomparable** |
| Context window / stride | k = 1024, stride 1024 (disjoint) | k = 1024, stride 512 | B gives every token ≥ 512 tokens of context; documentation example moves 19.44 → 16.44 for one model (R4.22) — **incomparable** |
| Document boundaries | packed, no attention reset, EOS scored | reset per document, EOS unscored | different conditionals and different Σm — **incomparable** |
| Evaluation set | corpus X, raw | corpus X, whitespace-normalised, deduplicated against training | different text — **incomparable**; also a contamination difference (§61.4) |

The demonstration passes if, for each row, the reader can state which of Eq. 4.15–4.18 the two reports evaluate differently. It fails (and the chapter's claim is rejected) if any row's two conventions can be shown to yield identical ℓ for all models and texts — which for rows 1–4 would contradict the derivations, and for row 5 is definitional.

### Experiment 4.7 — Executable check of the ledger rows

- **Hypothesis:** an implementation of Algorithms 4.1–4.4 on the §3.5 reference model reproduces exactly the input, target, and mask tensors of §2.1 for each row.
- **Setup:** toy tokenizer with the ids above; reference model with V ≥ 32013.
- **Independent variables:** objective row.
- **Controlled variables:** the 12-token sequence; the hand-chosen spans, P, and FIM split.
- **Dataset/workload:** the single sequence.
- **Hardware:** CPU is sufficient.
- **Metrics:** exact tensor equality; Σm per row; ρ per row.
- **Baselines:** the tables in §2.1.
- **Expected result:** equality for all rows; Σm = 13, 6, 5, 16 (or 6 for middle-only), and 13 + 12 for causal, span, prefix, FIM, MTP.
- **Ablation:** loss-on-all vs middle-only for FIM; packed vs reset boundaries for the causal row with two copies of the sequence.
- **Interpretation:** the ledger row is sufficient to regenerate the tensors; any discrepancy is a ledger under-specification.
- **Threats to validity:** the toy ids; no statement about real tokenizers.

## 3. Acceptance criteria

1. Every ledger row has all thirteen fields populated or explicitly `NOT-DISCLOSED`/`UNVERIFIED`; no field is blank.
2. For each of the four hand-audited rows plus MTP, the regenerated tensors equal §2.1 exactly (tolerance: none; these are integer tensors).
3. Σm and ρ per row match the stated values.
4. For the incomparability table, each row names the equation (4.15–4.18) or definition whose inputs differ, and at least one row demonstrates a PPL difference with identical BPB.
5. No row of the ledger carries either of the two labels that `CONTENT_CONTRACT.md` §6 forbids in Edition 1.0; every row's label is one of PAPER-REPORTED, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, or UNVERIFIED.

## 4. What this edition did not do

No model was trained or evaluated for this chapter. Experiments 4.1–4.7 are proposals. The hand-audited tensors in §2.1 were constructed by hand from the algorithms and have not been executed against any implementation. The incomparability table uses placeholder conventions and one documentation-reported example (R4.22); it reports no measurement of the book's own. The DeepSeek-V3 acceptance-rate figure for MTP under speculative use was not confirmed in the fetched rendering and is not quoted anywhere in the chapter.
