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
updated_at: 2026-10-07
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
| `causal_lm` | causal | BOS/context + shifted targets | declared earlier tokens and c | causal, optionally segment-reset | next original token/EOS under policy | eligible nonpad targets | global valid-token mean or stated sequence mean | BOS/EOS as declared | 1 for aligned full scoring | head/backbone costs in4.1; no objective-only extra block | P01 section3.1; Eq4.1-4.2 | MATHEMATICALLY-DERIVED |
| `mlm` | masked | 15% positions selected; 80/10/10 replacement | all of x̃ | bidirectional | t ∈ M: original x_t | 1[t ∈ M] | mean over |M| (Eq. 4.3) | [MASK] | |M|/T ≈ 0.15 | none; no sampler | R4.1 §3.1 | PAPER-REPORTED |
| `span_corruption` | span | spans → sentinels in x̃; y = s_1∘span_1∘…∘s_{K+1} | enc(x̃) via cross-attn; y_{<j} | bidirectional enc; causal dec + cross | every j of y | 1 on all of y | mean over |y| (Eq. 4.4) | sentinels s_k (`<extra_id_k>`) | |y|/|x̃| | second stack + cross-attn (4·T_enc·d² K/V proj per layer) | P02 §3.1.4; R4.28 | PAPER-REPORTED |
| `denoising_bart` | denoising | x̃ = noise(x) (infilling, permutation); y = x | enc(x̃); y_{<j} | as above | every j of x | 1 on all of x | mean over T | mask token | ≈ 1 | second stack + cross-attn | R4.3 | PAPER-REPORTED |
| `prefix_lm` | prefix | x = (x_{1:P}, x_{P+1:T}) unchanged | prefix bidirectional; rest causal | block | t > P: x_t | 1[t > P] | mean over T − P (Eq. 4.5) | none | (T−P)/T | none; block mask kernel support | P02 §3.2; R4.8 | PAPER-REPORTED |
| `enc_dec_supervised` | enc_dec | (source, target) pairs | enc(source); y_{<j} | bidirectional enc; causal dec + cross | every j of target | 1 on target | mean over |target| | BOS/EOS | |y|/|source| | second stack + cross-attn | P01 | PAPER-REPORTED |
| `ul2_mod` | span (mixture) | per-example switch among R/S/X denoisers | as span/prefix | as span/prefix | as chosen row | as chosen row | as chosen row | [R], [S], [X] | row-dependent | none beyond enc–dec | R4.4 | PAPER-REPORTED |
| `fim_psm` | fim | PRE+Enc(prefix)+SUF+Enc(suffix)+MID+Enc(middle)+EOT | earlier transformed tokens | causal | all transformed targets inR4.5 | all eligible targets; middle-only is a separate variant | declared target mean | exact tokenizer sentinel IDs | direct-target ratio depends on scoring | three delimiters beyond an EOT baseline plus retokenization difference;4.3 | R4.5 section3, AppendixC | PAPER-REPORTED |
| `fim_spm` | fim | PRE+SUF+Enc(suffix)+MID+Enc(prefix)+Enc(middle)+EOT | earlier transformed tokens | causal | declared transformed targets | R4.5 all-segment recipe | declared target mean | compatible format, AppendixD | scoring-dependent | delimiter/retokenization overhead; token-prefix cache reuse conditional | R4.5 AppendixD; R4.12 section2.3/AppendixE | PAPER-REPORTED |
| `causal_masking` | causal_masking | spans replaced by sentinels in body; spans appended at end | causal | causal | appended spans (and body) | 1 on appended spans; body treatment NOT-DISCLOSED | token-mean | sentinels | ≤ 1 | + sentinel and span tokens | R4.9 | PAPER-REPORTED |
| `mtp_sequential` | mtp | earlier depth state + next-token embedding; projection + causal block | full intermediate-token chain | causal with declared segment policy | next offset at each depth | eligible same-segment targets; uninspected production boundary policy NOT-DISCLOSED | unweighted depth means, then lambda once | main vocabulary | separate count per depth | private block + projection/norms; shared Emb/OutHead executes again | P13 section2.2; Algorithm4.4 | PAPER-REPORTED |
| `mtp_parallel_heads` | mtp | shared trunk + private Transformer prediction layers + shared unembedding | shared causal trunk prefix | causal | future offsets | per-offset eligible targets | sum/mean of disclosed head terms | main vocabulary | per-head target count | private layers, repeated shared-unembedding compute; sequential head backward | R4.13 section2 | PAPER-REPORTED |
| `z_loss` | auxiliary | log-normalizer penalty at vocabulary or router site | site-specific | inherited | scalar regularization | declared valid positions | site-specific mean and coefficient | none | N/A scalar penalty | logsumexp reuse plus scalar/gradient/reduction costs | R4.14 section5; R4.15 router z-loss | PAPER-REPORTED |
| `router_balance` | auxiliary | none | — | — | none | — | α·N·Σ f_i P_i, α = 10⁻² (Switch); sequence-wise α = 0.0001 (P13) | none | — | ≈ 0 | P10 §2.2; P13 §2.1 | PAPER-REPORTED |
| `cond_gen_doc` | cond_gen | [c tokens ∘ x tokens] | c as text prefix | causal | x positions | 0 on c, 1 on x | token-mean over x | segment markers | |x|/(|c|+|x|) | none | §31.1 forward | MATHEMATICALLY-DERIVED |
| `cond_gen_image_prefix` | cond_gen | [W·φ(image) ∘ prompt ∘ answer] | image features as prefix tokens; gradient into W (stage 1) and LLM (stage 2) | causal | answer tokens | 0 on image and prompt, 1 on answer | token-mean over answer | image placeholders | |ans|/(n_img+|prompt|+|ans|) | encoder FLOPs; n_img KV positions | R4.19 | PAPER-REPORTED |
| `cond_gen_audio_encdec` | cond_gen | enc(audio); dec = [task tokens ∘ transcript] | cross-attn to audio encoder; task tokens as conditioning | bidirectional enc; causal dec + cross | transcript tokens (some task tokens are targets per R4.18) | 1 on transcript; task-token scoring per report | token-mean | language/task/timestamp tokens | |transcript|/|frames| | encoder + cross-attn | R4.18 | PAPER-REPORTED |
| `action_conditioned` | cond_gen | return/state/action trajectory | causal past, current state, desired return | episode-aware causal | action | eligible action positions | categorical CE for discrete actions; MSE for continuous actions | modality/episode conventions | N/A token ratio for continuous head | modality encoder/head and trajectory processing | R4.20 section3; R4.21 method | PAPER-REPORTED |
| `contrastive_pair` | contrastive | paired encoder batch | global matched candidate set | encoder-specific | pair identity | each local query row | symmetric mean over global B_c queries; correct gather backward | none | N/A not token prediction | bounded all-pairs work, embeddings, local logits, gather gradients | P44 section2.3; Algorithm4.5 | PAPER-REPORTED |
| `discriminative_head` | discriminative | input and categorical label | declared input encoder | encoder-specific | label | eligible examples | example-mean CE | label vocabulary | N/A not sequence generation | finite-label projection; label sampling possible | R4.1 fine-tuning;4.5 | MATHEMATICALLY-DERIVED |

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

(The table lists the constructed sequence as targets. Prepend BOS/context to its shifted input to score all16 targets; masks align to these targets, not to the unshifted input IDs.) Length 12 + 4 = 16 (Algorithm 4.3 invariant). ✔ For the compatible SPM construction in R4.5 AppendixD, use `PRE + SUF + suffix + MID + prefix + middle + EOT`. The prefix and middle are adjacent after MID; delimiter positions differ from PSM. Real-tokenizer boundary behavior must be checked separately from this integer-token fixture.

**Row `mtp_sequential`, K_mtp = 1** (Algorithm 4.4): main targets = the causal row above; depth-1 targets at slots 0…11 are ids at positions t+2: `[3931, 7, 64, 11, 275, 8, 25, 1441, 257, 10, 275, 2]`, mask 1 on 12 slots (slot 12 has no depth-1 target). Denominator for L_MTP = 12; for L_NTP = 13. Their coefficients (1 and λ) therefore weight means over different counts — the normalisation field matters. ✔

### 2.2 Incomparable perplexities

Two synthetic reports for explicitly specified model-tokenizer pairs on the same original bytes; within-tokenizer convention comparisons may hold the checkpoint fixed, constructed only from the definitions (no model was run; every number below is a placeholder pattern, not a measurement — ASSUMED):

| Convention | Report A | Report B | Effect on the comparison |
|---|---|---|---|
| Tokenizer | compatible pair A:0.325 scored tokens/byte, ell=2/1.3 | compatible pair B:0.25 scored tokens/byte, ell=2 | both BPB=0.5/ln2; PPL differs. No arbitrary tokenizer swap on a fixed checkpoint is implied |
| Normalisation | token-weighted document means | equally weighted document means | equal iff empirical Cov(length,mean NLL)=0; unequal lengths alone do not prove inequality (Eq4.18) |
| Context window / stride | disjoint-reset convention | overlapping exactly-once convention | context and possibly counted-target sets differ; inspect masks, initial targets and warm-up, rather than promise monotonic NLL |
| Document boundaries | packed, no attention reset, EOS scored | reset per document, EOS unscored | different conditionals and different Σm — **incomparable** |
| Evaluation set | corpus X, raw | corpus X, whitespace-normalised, deduplicated against training | different text — **incomparable**; also a contamination difference (§61.4) |

The demonstration passes when each row identifies the scoring functional or input that changes and supplies either a constructive counterexample or the condition under which the outputs coincide. Different conventions can give equal values on a particular dataset or model. The byte-normalized example deliberately has equal BPB; equality of one aggregate neither establishes identical scoring events nor makes the token perplexities comparable.

### Experiment 4.7 — Executable check of the ledger rows

- **Hypothesis:** an implementation of Algorithms 4.1–4.4 on the Chapter03 section3.5 reference model reproduces exactly the input, target, and mask tensors of §2.1 for each row.
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

## 4. Inspection and execution status

The six manuscript sections explain source-reported studies; they do not report experiments performed by this book. Primary/official sources were inspected on2026-10-07 at the exact surfaces and locators in references.md. Source-code reads on unpinned branches are OFFICIAL-DOCUMENTATION. No model, kernel, distributed contrastive step, speculative decoder, or generated-code harness was executed. Toy tensors are hand-derived analytical fixtures, not benchmark measurements.

## 5. Topic-completeness trace

For every row below, Scope/Why this exists establish problem and baseline; Formulation states objects and conditions; Mechanism/Methodology gives construction and gradient/state details; Algorithm and Implementation supply executable alignment and resource accounting; Experimental design/Reported experiments and Observations distinguish the source protocol, finding, inference, and gaps; Siblings and Extensions/Improvements compare alternatives and lineage; Failure modes, Limitations, and Reproducibility bound the result. These are the13 obligations of CONTENT_CONTRACT section4.1. A structural mapping is not a claim of independent scientific review.

| Required concepts/variants | Canonical manuscript | Method/experiment source locators | Important boundary and remaining reproduction |
|---|---|---|---|
| Ordered sequence factorization; teacher forcing; causal conditioning; token/sequence means | [4.1](04-1-autoregressive-modeling.md#methodology), Eq4.1-4.2, Algorithm4.1 | P01 sections3.1,5.1-5.4; R4.24 Shape/Parameters; R4.27 forward | Architecture-specific parallelism; global reducer scaling; causal and gradient fixtures unexecuted |
| MLM selected positions and corruption; conditional versus joint score | [4.2](04-2-alternative-objectives.md#methodology), Eq4.3 | R4.1 section3.1 | Corruption mixture is not identical to leave-one-out pseudolikelihood; no implied joint likelihood |
| Span corruption; full denoising; prefix LM; encoder-decoder; mixture regimes | [4.2](04-2-alternative-objectives.md#methodology), Eq4.4-4.6, Algorithm4.2 | P02 sections3.1-3.3,Tables4-7; R4.3 sections2-5; R4.4 section3; R4.8 section2 | Feasible spans/sentinels; architecture and target counts differ; exact collator/backend uninspected |
| FIM PSM/SPM; syntax-sensitive boundaries; causal masking; structured serialization | [4.3](04-3-code-and-structured-sequences.md#methodology), Eq4.7, Algorithm4.3 | R4.5 sections3-4/AppendicesC-D; R4.9 method; R4.12 section2.3/AppendixE | Character retokenization and compatible sentinels; structure-interface details canonical in10.5 |
| Execution-grounded targets and pass@k | [4.3](04-3-code-and-structured-sequences.md#methodology), Eq4.8 | R4.10 section3; R4.30 README | Fixed sampler/test environment; suite success does not prove universal semantic correctness |
| Independent/sequential MTP; weighting; regularizers; heads versus samplers | [4.4](04-4-auxiliary-prediction.md#methodology), Eq4.9-4.11, Algorithm4.4 | R4.13 section2-3; P13 sections2.2,4.5.1/Table4; R4.14-4.16 methods; P35 Algorithm1 | One lambda; private Transformer heads; matched-token evidence not matched-FLOP proof; code alignment unexecuted |
| Register MTP; curriculum ordering; restricted2026 planning result | [4.4](04-4-auxiliary-prediction.md#improvements) | R4.32-R4.33 methods/experiments; R4.34 sections4-5 | Distinct state/curriculum interventions; theoretical architecture/data premises retained |
| Documents, images, audio, actions, observations/environment conditioning | [4.5](04-5-conditional-and-multimodal-learning.md#methodology), Eq4.12/4.14 | R4.18 section2; R4.19 sections3-4; R4.20 sections3-4; R4.21 method | Zero direct loss does not detach context; action CE/MSE units; episode boundaries |
| Generative versus finite-label/contrastive learning; distributed candidate gradients | [4.5](04-5-conditional-and-multimodal-learning.md#methodology), Eq4.13, Algorithm4.5 | P44 sections2.3/2.5,3 | Global candidate count and gather backward; bounded all-pairs cost; no distributed check executed |
| PPL; tokenizer/byte units; distribution mismatch; calibration; deployment objective | [4.6](04-6-likelihood-and-capability.md#methodology), Eq4.15-4.18, Algorithm4.6 | P03 evaluation; R4.22 fixed-context code; R4.17 sections3-4; P01 section5.4; R4.10 section3 | Exactly-once targets; covariance equality; byte event preservation; classifier calibration is not LLM factuality evidence |

## 6. Unexecuted numerical verification proposals

1. **Objective and gradient equality.** Construct unequal-length examples, compare a combined-batch token mean with accumulated/rank-reduced gradients using the stated global scaling. Declare dtype/tolerance; no directional downstream benefit is predicted.
2. **Causal visibility.** Perturb future IDs and verify earlier logits remain equal under deterministic evaluation; separately check document-reset and concatenated-stream policies.
3. **Corruption reconstruction.** Enumerate short feasible span/gap segmentations, reconstruct clean IDs from encoder/target outputs, and reject infeasible counts or insufficient sentinels.
4. **FIM boundaries.** Check compatible PSM/SPM layouts and loss alignment, then separately test real-tokenizer round trips and partial-token edits. The toy tokenizer does not establish a released tokenizer's behavior.
5. **MTP alignment.** Check depth1 targets and masks against the hand-derived13/12 counts; verify lambda is applied once; introduce padding and document ends deliberately.
6. **Distributed contrastive gradients.** Compare a small global reference batch with a sharded differentiable-gather implementation, including candidate gradients from remote queries and parameter-reducer scaling.
7. **Likelihood indexing.** Enumerate each scored original index for short streams, several k/s pairs and BOS policies; require exactly-once accounting for the declared target set. Compare conventions without asserting a universal monotonic likelihood response.

All numerical inputs are declared analytical choices (ASSUMED). The model, gradient, tokenizer, and distributed proposals remain unexecuted; the bounded arithmetic/indexing checks recorded below were executed separately. Accepting them requires preserved inputs, outputs, tolerances, runtime/repository revision, and an actual result. No acceptance criterion is satisfied by a predicted favorable task score.


## 7. Executed analytical checks

On2026-10-07, an inline Python check using only the standard-library `fractions` and `math` modules checked the following derived identities. No model, tokenizer, GPU kernel, benchmark, or generated-code harness was run, and these checks provide no downstream accuracy or throughput evidence. They are bounded arithmetic verification of the manuscript's formulas, not CODE-VERIFIED evidence about an external implementation.

| Check | Inputs and acceptance condition | Result |
|---|---|---|
| Algorithm4.6 target coverage | Stream target count1..128, context k=2..32, every stride s=1..k-1. Enumerate windows; require target indices exactly1..T_eval, each once, a predecessor for every target, window length at most k, and the stated steady-state context bound | 63,488 configurations passed |
| Eq4.8 pass@k identity | n=1..64, c=0..n, k=1..n. Compare the exact binomial ratio with the product form using rational arithmetic | 91,520 configurations passed |
| MTP toy weighting | Main denominator13, auxiliary denominator12, lambda0.3. Compare one auxiliary target's coefficient with one main target's coefficient: (0.3/12)/(1/13) | Exact ratio13/40=0.325 |
| Materialized logits bytes | FP32, B*T=2^20, vocabulary131072 or128000; divide 4*B*T*V bytes by2^30 | 512GiB or500GiB, respectively |

The first check establishes only the enumerated index cases; it does not validate numerical model logits, attention masks, position IDs, document policies, or an evaluation library. The pass@k check establishes the finite combinatorial identity under its stated sampling protocol, not correctness of an execution sandbox. Model-level acceptance criteria in section3 remain pending.
