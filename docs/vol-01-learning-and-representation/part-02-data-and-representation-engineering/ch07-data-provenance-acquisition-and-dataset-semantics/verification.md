---
id: ms.verification.7
entity_type: verification
title: Chapter 07 verification — dataset inventory and lineage trace
short_title: Verification 07
volume: 1
part: 2
chapter: 7
section: null
slug: verification
parent: ms.chapter.7
prev_sibling: ms.section.7.6
next_sibling: ms.references.7
children: []
prerequisites: [ms.section.7.1, ms.section.7.2, ms.section.7.3, ms.section.7.4, ms.section.7.5, ms.section.7.6]
downstream: [ms.chapter.8, ms.chapter.9, ms.chapter.12, ms.chapter.66]
related: [ms.section.6.6]
siblings_by_mechanism: []
relations:
  - {type: evaluated_by, target: ms.verification.7}
axes: {lifecycle: [data, assurance], mechanism: [dataset_inventory, lineage_audit], feedback_setting: [], modality: [text, code]}
papers: [P05, P06, P07]
implementations: []
benchmarks: []
datasets: []
status: {maturity: established, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 900
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# Verification — Chapter 07

## 1. Artifact specification: the dataset inventory with provenance and admissible-use fields

The chapter artifact is two tables sharing one key.

### 1.1 `snapshots` — one row per dataset snapshot (Eq. 7.3)

The first seventeen rows are the mandatory dataset fields of `book_plan.md` Appendix C, in its order; the remaining rows are the chapter's provenance and admissible-use additions.

| Field | Type | Owning section | Meaning |
|---|---|---|---|
| `dataset_id` | key | 7.2 | stable identifier: name + release/version/DOI |
| `snapshot_hash` | hex or NOT-DISCLOSED | 7.2 | content hash of the released record set |
| `origin` | struct | 7.1, 7.2 | `source_category` (§7.1 enum) × `authorship` ∈ {human, machine, mixed, unknown} × `custodian` |
| `acquisition_time` | interval | 7.3 | observation window of the acquisition events (crawl ids, API window, archive version) |
| `modality` | set | 7.2 | ⊆ {text, code, image, audio, video, action, tabular} |
| `language` | distribution + method | 7.2 | language(-script) labels with LID model id and threshold |
| `domain` | distribution + method | 7.2 | declared taxonomy with assignment method |
| `unit_of_sampling` | enum | 7.1 | page · book · paper · file · repository · thread · conversation · record · episode |
| `label_schema` | enum | 7.2 | none · reference target · comparison · scalar · process label · verifier verdict · trajectory return |
| `generator_policy` | id or null | 7.2 | generator/policy revision if synthetic; selector model id if classifier-defined |
| `license_permission_record[]` | list of rights evidence records | 7.4 | {issuer, subject, instrument (SPDX id / notice version / clause / terms revision), scope, observed_at, evidence_ref} |
| `pipeline_versions` | struct | 7.3 | `archive_format`, `extractor_id`, `extractor_version`, `filter_config_digest`, `dedup_config_digest` |
| `training_role` | — | 7.2 | *not a column*: see `role_assignments` |
| `train_eval_membership` | struct | 7.2 | declared splits and their sizes, or NOT-DISCLOSED |
| `contamination_results` | struct | 7.5 | method, evaluation sets checked, rate, date; forward to §8.5 |
| `retention_deletion` | struct | 7.4 | `retain_until_by_class`, `deletion_path` (form, tool), `access_boundary` |
| `known_limitations[]` | list | 7.5 | `omissions[]` (by design / measured / suspected), `collection_bias[]` (mechanism, consequence, evidence), `unresolved_provenance[]` (resolvable?) |
| `token_counts[]` | list | 7.2 | each {qualifier ∈ {available, sampled, consumed}, count, tokenizer_repo, tokenizer_revision, source_ref} |
| `bytes_per_token` | float + tokenizer | 7.1 | ν_tok of Eq. 7.1 |
| `yield_chain` | struct | 7.1 | Z, γ_ext, γ_filt, γ_dedup |
| `source_identifier_scheme` | enum | 7.3 | WARC-Record-ID + archive path · SWHID · corpus id · API record id · episode id |
| `sidecar_ref` | id | 7.3 | access-controlled store of locators, IPs, user ids |
| `frame` | struct | 7.5 | snapshots/interfaces/window; `coverage_by_stratum` (κ_g or unidentified), `retention_by_stratum` (η_g) |
| `card_timestamps` | struct | 7.5 | collected, inspected, decided |
| `admissible_use` | map | 7.4 | purpose → {decision ∈ {Allow, Deny, Review}, policy_rev, evaluated_at, evidence_refs, jurisdiction} |
| `evidence_label` | enum | all | label for the row as transcribed |

### 1.2 `role_assignments` — one row per (snapshot, role, run) (Eq. 7.4)

| Field | Type | Meaning |
|---|---|---|
| `dataset_id` | key → snapshots | the snapshot consumed |
| `role` | enum | one of the twelve Appendix C roles |
| `run_id` | id | training, evaluation, or serving configuration; carries `lineage_id` |
| `sampling_proportion` | float | q_k of Eq. 7.5 |
| `tokenizer_repo`, `tokenizer_revision` | ids | tok_u |
| `loss_mask`, `template_id`, `packing_rule` | run-side fields | per Table 7.2b |
| `consumed_tokens` | int + tokenizer | D_cons contribution |
| `decision_ref` | id → admissible_use | the Allow that authorised this row |

### 1.3 Illustrative filled row (ASSUMED — not a record of any real dataset)

| Field | Value |
|---|---|
| `dataset_id` | `example-webcorpus-2026.03` |
| `snapshot_hash` | `sha256:…` (illustrative) |
| `origin` | web · mixed (machine-generated share unmeasured) · Common Crawl via in-house extraction |
| `acquisition_time` | `CC-MAIN-2026-05` … `CC-MAIN-2026-13` |
| `modality` / `language` | {text} / en 0.94, de 0.03, other 0.03 by fastText-class LID at 0.65 (method recorded) |
| `domain` | uncontrolled web; URL-rule taxonomy v3 |
| `unit_of_sampling` | page |
| `label_schema` / `generator_policy` | none / null |
| `license_permission_record[]` | [{Common Crawl terms rev. 2026-01, scope: all records}, {distribution: ODC-By-1.0}] |
| `pipeline_versions` | WARC · trafilatura-class extractor v.X (digest) · filters digest · per-crawl MinHash digest |
| `train_eval_membership` | train only; no held-out split |
| `contamination_results` | exact-match against evaluation set list v7: 0.004% documents flagged, removed (method ref §8.5) |
| `retention_deletion` | raw WARC 90 days; shards until superseded; removal form; sidecar restricted |
| `known_limitations[]` | omissions: code (suspected); bias: URL blocklist (mechanism) → dialect removal (hypothesis, unmeasured); unresolved: per-page authorship (unresolvable) |
| `token_counts[]` | available · 2.1 T · gpt2 @ revision r; sampled · 1.4 T (q = 0.67); consumed · 1.4 T by run `pt-2026-04` |
| `admissible_use` | pretraining-internal → Allow (policy p12, 2026-04-02); external redistribution → Review (terms clause 4 ambiguous) |
| `evidence_label` | ASSUMED (illustrative) |

```figure
id: fig-7.34
kind: stat-panel
title: The illustrative row checked against its own acceptance criteria
caption: >-
  The §1.3 row is ASSUMED, not a real dataset, but its numbers can still be
  held to §3. Eq. 7.5 on its available count and q gives 1.407 T against the
  stated 1.4 T consumed, a 0.5% gap inside the 1% tolerance. The instrument
  follows the file: the row, then the fourth resolution of Experiment 7.7,
  then the thresholds that are planning inputs rather than measurements.
placement: rail
anchor: 1-artifact-specification-the-dataset-inventory-with-provenance-and-admissible-use-fields
evidence: DERIVED
source: ["DERIVED:eq-7.5", "DERIVED:eq-7.11"]
alt: >-
  Instrument panel for the illustrative row of §1.3 (ASSUMED). Available: 2.1 T
  gpt2 tokens at revision r. Sampling proportion q = 0.67. Eq. 7.5 gives q
  times available, 1.407 T. The trainer's consumed counter: 1.4 T. The identity
  gap is 0.5% of the counter, against an acceptance tolerance of 1%.
  Thresholds for lineage completeness: at least 0.980 for web strata and 0.995
  for code, enterprise and interaction strata. Contamination flagged by exact
  match: 0.004% of documents. Decision for external redistribution: Review,
  because terms clause 4 is ambiguous.
spec:
  header: "§1.3 ILLUSTRATIVE ROW · ASSUMED"
  variables: { Da: 2.1e12, q: 0.67, Dc: 1.4e12, tol: 0.01, lw: 0.98, lc: 0.995 }
  rows:
    - { key: "available, gpt2 @ revision r", formula: "Da", format: tokens }
    - { key: "sampling proportion q", formula: "q", format: fixed2 }
    - { key: "Σ q·D_avail (Eq. 7.5)", formula: "q*Da", format: tokens }
    - { key: "trainer consumed counter", formula: "Dc", format: tokens }
    - { key: "identity gap, ÷ counter", formula: "abs(q*Da - Dc)/Dc", format: percent }
    - { key: "acceptance tolerance (§3)", formula: "tol", format: percent }
    - { key: "λ̂ threshold, web strata", formula: "lw", format: fixed3, note: "ASSUMED planning input" }
    - { key: "λ̂ min, code · enterprise · interaction", formula: "lc", format: fixed3, note: "ASSUMED planning input" }
    - { key: "contamination flagged, exact match", value: "0.004% of documents" }
    - { key: "external redistribution", value: "Review (clause 4 ambiguous)" }
states:
  - { anchor: 1-artifact-specification-the-dataset-inventory-with-provenance-and-admissible-use-fields, label: "the row, internally", highlight: ["available, gpt2 @ revision r", "sampling proportion q", "Σ q·D_avail (Eq. 7.5)", "trainer consumed counter"], note: "Available 2.1 T, q = 0.67, consumed 1.4 T: Eq. 7.5 gives 1.407 T, so the illustrative row is internally consistent to 0.5%." }
  - { anchor: 2-verification-task, label: "resolution (iv)", highlight: ["external redistribution"], note: "Resolution (iv) needs decision_ref = Allow for the role consumed. The row's Review for external redistribution can never authorise a role_assignments row." }
  - { anchor: 3-acceptance-criteria-thresholds-assumed, label: "consumed-token identity", highlight: ["identity gap, ÷ counter", "acceptance tolerance (§3)", "λ̂ threshold, web strata", "λ̂ min, code · enterprise · interaction"], note: "The identity passes: 0.5% < 1%. The λ̂ thresholds are planning inputs (ASSUMED), not measurements." }
```

## 2. Verification task

### Experiment 7.7 — Trace sampled training records to their source and transformation history; report missing lineage explicitly

- **Hypothesis:** for a corpus built with the inventory of §1 and Algorithm 7.3, every sampled training record resolves, through recorded fields only, to (i) an acquisition event with time and interface, (ii) an archived source object by source identifier, (iii) every transformation identity between source and record, and (iv) an admissible-use decision for the role in which it was consumed; and the fraction that does not resolve is reported per stratum rather than averaged away.
- **Setup:** take one training run `u` and its `role_assignments` rows; draw a stratified random sample of consumed records; for each, attempt the four resolutions from inventory fields alone (no ad-hoc lookups); record outcome per required field.
- **Sampling design:** strata = (source category × role) present in `u`; within each stratum, simple random sampling of records with known inclusion probability; sample size per stratum chosen so that a completeness of 0.98 is distinguished from 0.95 at the stated power ([§2.5](../../part-01-scientific-foundations/ch02-mathematical-and-statistical-foundations/02-5-statistical-inference.md)); strata with fewer records than the target size are enumerated in full. Estimate by Eq. 7.11 with stratum weights ω_g; report an interval that respects clustering by shard.
- **Independent variables:** source category; role; pipeline version (two builds if available).
- **Controlled variables:** the run `u`; the inventory schema version; the resolution procedure (scripted, fixed before sampling).
- **Dataset/workload:** the run's consumed record set; the inventory tables; the sidecar (read under its access boundary).
- **Hardware:** none beyond the metadata store; wall-clock of remote resolutions recorded.
- **Metrics:** *lineage completeness* λ = fraction of sampled records for which **all** required fields resolve: `source_identifier` resolves to an archived object whose payload digest matches `h_payload` of the first transformation; `acquisition_time` present; every `(h_tool, h_config)` on the path present; `role_assignments.decision_ref` present and equal to Allow at consumption time. Report λ̂ per stratum and pooled (Eq. 7.11), plus the *per-field miss profile* (which field failed, how often) and the *irrecoverable fraction* (records whose source object no longer exists at the custodian, distinguished from records whose identifier was never recorded).
- **Baselines:** URL-only lineage (locator stored, no identifier, no transformation digests); stage-named catalogue without `role_assignments`.
- **Expected result:** λ̂ = 1 within sampling error for records produced under Algorithm 7.3 with sidecar retention; baseline λ̂ materially lower with misses concentrated in `source_identifier` (URL drift) and `decision_ref` (no role table). Magnitudes are not predicted (UNVERIFIED).
- **Ablation:** drop sidecar access (simulating a restricted audit) and report which fields become unresolvable; drop `role_assignments` and report that `decision_ref` cannot be evaluated.
- **Interpretation:** λ̂ measures the *recorded* chain; a resolved chain does not certify that the source was truthful or that the rights evidence was correctly interpreted (§7.4 Limitations).
- **Threats to validity:** custodians remove objects between build and audit (inflates the irrecoverable fraction regardless of schema); resolution scripts may embed knowledge not in the inventory (guard: scripts read only inventory fields); small strata have wide intervals.

**What result rejects the chapter's central claim.** The chapter claims that a role-relational, evidence-linked inventory makes training-record lineage auditable *from recorded fields alone*. It is rejected if, for a corpus built under Algorithm 7.3 with the §1 schema, pooled λ̂ falls below the acceptance threshold in §3 **and** the per-field miss profile shows the misses are attributable to the schema (fields absent or ambiguous) rather than to custodian removal; or if a sampled record with `role = evaluation` in lineage ℓ(u) also appears in a training role of the same lineage, which means Algorithm 7.2 lines 2–3 were not enforceable from the tables.

```figure
id: fig-7.35
kind: diagram
title: "Experiment 7.7: a consumed record traced back, misses kept"
caption: >-
  The emphasised path is the claim under test: a sampled consumed record
  resolves on all four fields from inventory fields alone, and λ̂ clears
  §3's ASSUMED threshold. The protocol's discipline is on the other
  branch. A miss is kept by field. A source removed at the custodian is
  counted against the custodian, not the schema. The chapter is rejected
  only by schema-attributable misses or by a single evaluation/training
  collision in one lineage.
placement: wide
evidence: DERIVED
source: ["DERIVED:eq-7.11", "DERIVED:alg-7.2", "DERIVED:alg-7.3"]
concepts: [ms.section.7.3, ms.section.7.5, ms.section.7.2]
alt: >-
  Diagram of Experiment 7.7. Run u with its role_assignments rows and lineage
  id is stratified by source category and role, with simple random sampling
  and known inclusion probabilities. Each sampled consumed record is resolved
  from inventory fields only, on four fields: (i) an acquisition event with
  time and interface; (ii) an archived source object whose identifier resolves
  and whose digest matches h_payload; (iii) every tool and configuration digest
  on the path; (iv) decision_ref equal to Allow at consumption time. A branch
  asks whether all four resolve. If yes, on the emphasised path, the record is
  complete. If no, it is incomplete by field, with a per-field miss profile,
  and misses whose source was removed at the custodian are counted as
  irrecoverable, not schema failures. Both feed λ̂ per stratum and pooled with
  Eq. 7.11 weights and a shard-clustered interval. A branch asks whether λ̂
  clears the ASSUMED thresholds, 0.98 for web and 0.995 for code, enterprise
  and interaction. If yes, lineage is auditable from recorded fields. If no,
  with schema-attributable misses, the central claim is rejected. Any
  evaluation/training collision in one lineage also rejects it.
spec:
  direction: TB
  nodes:
    - { id: run, kind: model, label: "run u + role_assignments", sub: "lineage id ℓ(u)" }
    - { id: str, kind: process, label: "stratify: source category × role", sub: "SRS within stratum; inclusion probs known" }
    - { id: rec, kind: dataset, label: "sampled consumed record", sub: "inventory fields only; no ad-hoc lookups" }
    - { id: r1, kind: dependency, label: "(i) acquisition event", sub: "time + interface", group: res }
    - { id: r2, kind: dependency, label: "(ii) archived source object", sub: "identifier resolves; digest = h_payload", group: res }
    - { id: r3, kind: dependency, label: "(iii) every (h_tool, h_config)", sub: "on the path to the record", group: res }
    - { id: r4, kind: dependency, label: "(iv) decision_ref = Allow", sub: "at consumption time", group: res }
    - { id: all, kind: branch, label: "all four resolve?" }
    - { id: ok, kind: state, label: "complete" }
    - { id: miss, kind: state, label: "incomplete(fields)", sub: "per-field miss profile" }
    - { id: gone, kind: state, label: "irrecoverable", sub: "removed at custodian: not the schema" }
    - { id: lam, kind: metric, label: "λ̂ per stratum and pooled", sub: "Eq. 7.11 weights; shard-clustered interval" }
    - { id: acc, kind: branch, label: "clears §3 threshold?", sub: "≥ 0.98 web; ≥ 0.995 code, enterprise, interaction" }
    - { id: pass, kind: state, label: "lineage auditable from recorded fields", emphasis: true }
    - { id: rej, kind: boundary, label: "central claim rejected", sub: "misses attributable to the schema" }
    - { id: coll, kind: boundary, label: "evaluation/training collision in ℓ(u)", sub: "any occurrence rejects" }
  edges:
    - { from: run, to: str }
    - { from: str, to: rec }
    - { from: rec, to: r1 }
    - { from: rec, to: r2 }
    - { from: rec, to: r3 }
    - { from: rec, to: r4 }
    - { from: r1, to: all }
    - { from: r2, to: all }
    - { from: r3, to: all }
    - { from: r4, to: all }
    - { from: all, to: ok, kind: emphasis, label: "yes" }
    - { from: all, to: miss, label: "no" }
    - { from: miss, to: gone, kind: dependency, label: "source removed at custodian" }
    - { from: ok, to: lam, kind: emphasis }
    - { from: miss, to: lam }
    - { from: lam, to: acc, kind: emphasis }
    - { from: acc, to: pass, kind: emphasis, label: "yes" }
    - { from: acc, to: rej, label: "no, schema misses" }
    - { from: coll, to: rej, kind: dependency }
  groups:
    - { id: res, label: "four resolutions from inventory fields" }
```

## 3. Acceptance criteria (thresholds ASSUMED)

| Criterion | Threshold | Tolerance / note |
|---|---|---|
| Pooled lineage completeness λ̂ | ≥ 0.98 for web-category strata; ≥ 0.995 for code, enterprise, and interaction strata | lower interval bound must clear the threshold; thresholds are planning inputs, not measurements |
| Irrecoverable fraction | reported separately; no threshold | counted against the custodian, not the schema |
| Evaluation/training collision in one lineage | 0 sampled records | any occurrence rejects |
| Token-count qualifiers | 100% of `token_counts[]` entries carry qualifier + tokenizer repo + revision | categorical |
| Consumed-token identity | Σ_k q_k · D_avail,k (Eq. 7.5) within 1% of the trainer's consumed counter | tokenizer must match on both sides |
| Mandatory fields | every Appendix C field present or explicitly `NOT-DISCLOSED` / `unknown` — never blank | categorical |
| Decision validity | every `role_assignments.decision_ref` is Allow under a policy revision valid at `run_id` start | categorical |

## 4. What this edition did not do

No corpus was downloaded, sampled, or traced for this edition. The nine Dataset records of §7.6 were filled from papers, repositories, and cards opened on the dates in [references.md](references.md), not from record-level audits. Experiment 7.7, the thresholds above, and the illustrative row in §1.3 are proposals; every label in this file is DERIVED, ASSUMED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, or UNVERIFIED, and EMPIRICALLY-OBSERVED does not appear.
