---
id: ms.section.7.4
entity_type: section
title: Rights and governance metadata
short_title: Rights and governance
volume: 1
part: 2
chapter: 7
section: 7.4
slug: 07-4-rights-and-governance-metadata
parent: ms.chapter.7
prev_sibling: ms.section.7.3
next_sibling: ms.section.7.5
children: []
prerequisites: [ms.section.1.1, ms.section.7.2, ms.section.7.3]
downstream: [ms.section.7.5, ms.section.7.6, ms.section.8.4, ms.section.11.6, ms.section.49.1, ms.section.65.4, ms.section.66.2]
related: [ms.section.65.1, ms.section.66.5]
siblings_by_mechanism: [ms.section.8.4]
relations:
  - {type: supported_by, target: paper.P03}
  - {type: supported_by, target: paper.P05}
  - {type: supported_by, target: paper.P07}
  - {type: consumes, target: concept.extraction-lineage}
  - {type: produces, target: concept.admissible-use-decision}
axes: {lifecycle: [data, assurance], mechanism: [license_metadata, consent_record, contractual_restriction, retention, access_boundary, deletion_lineage], feedback_setting: [], modality: [text, code]}
papers: [P03, P04, P05, P07, P21]
implementations: [impl.hugging-face-transformers, impl.pytorch, impl.nanotron]
benchmarks: []
datasets: []
status: {maturity: active, disputed: true}
evidence_summary: {labels_used: [PAPER-REPORTED, OFFICIAL-DOCUMENTATION, MATHEMATICALLY-DERIVED, DERIVED, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2300
updated_at: 2026-09-23
editorial_status: manuscript_draft
---

# 7.4 Rights and governance metadata

## Scope

Objective: treat licences, consent records, contractual restrictions, retention conditions, access boundaries, and deletion lineage as *metadata engineering* — typed evidence records attached to snapshots, evaluated by a versioned policy into an admissible-use decision, and propagated through lineage when a record must be removed. Baseline: one free-text `license` string on a whole mixture. Success: the reader can populate the admissible-use fields of the inventory artifact, evaluate Eq. 7.8 for a stated use, and compute the removal closure of Eq. 7.9. Boundaries: this section gives no legal advice and makes no jurisdiction-specific claim of its own; every statement about what a jurisdiction permits is quoted from a source and labelled UNVERIFIED. Detecting sensitive content is [§8.4](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-4-privacy-and-sensitive-data.md); security controls are [§65.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-4-controls.md); release-time artifact integrity is [§66.2](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch66-release-decisions-reproducibility-and-research-to-production-closure/66-2-artifact-integrity.md).

## Why this exists

What failed before was collection-level labelling. The Data Provenance Initiative audited more than 1,800 text datasets and reports "frequent miscategorization of licenses on widely used dataset hosting sites, with license omission of 70%+ and error rates of 50%+" (PAPER-REPORTED · R7.25). The Pile's authors, documenting their own corpus, found that "researchers often fail to clearly document where their data came from and under what terms its use was consented to" and adopted "a strict model of consent, where ambiguous or unknown consent is treated as non-consensual" (PAPER-REPORTED · P03). The bottleneck that appeared is that rights vary *below* the dataset: The Stack v2 found repository-level licence information unavailable "for 96.93% of repositories" and had to detect licences per file (PAPER-REPORTED · R7.12); a chat corpus contains several participants; a web crawl contains pages whose sites later add a `Disallow` or send a takedown. The constraint that became dominant is accountability after the fact: a record already consumed by a training run cannot be made historically unused by deleting a shard, and FineWeb's changelog shows the operational reality — "We also removed specific domains in response to a C&D notice" in v1.3.0 (OFFICIAL-DOCUMENTATION · R7.5). What changed in the solution is separation: evidence capture, policy evaluation, and remediation become three versioned record types, and a decision is indexed by (snapshot, use, policy, time) rather than stored as a flag on the bytes.

```figure
id: fig-7.18
kind: stat-panel
title: Rights vary below the dataset
caption: >-
  Three audits and one removal, each a self-report by the group that ran it.
  Collection-level labels are missing or wrong on the hosting sites, and
  per-repository licences are missing on almost all of The Stack v2. When
  an opt-out is honoured, one owner fans out to about 17 repositories and
  one repository to about 14 files. Those two ratios are derived here from
  R7.12's counts, and they are the depth that Eq. 7.9 has to walk. The dot
  glyph is the Stack v2 share: 97 of 100 repositories carry no repository
  licence.
placement: rail
anchor: why-this-exists
evidence: PAPER-REPORTED
source: [R7.25, P03, R7.12, R7.5]
alt: >-
  Instrument panel. The Data Provenance Initiative audited more than 1,800 text
  datasets and reports licence omission above 70% and error rates above 50% on
  hosting sites. The Pile lists five of its 22 constituents as not collected
  and distributed in a ToS-compliant fashion. The Stack v2 found no
  repository-level licence for 96.93% of repositories. Its opt-out removed
  1,561 repositories of 91 users and organisations and 22,066 files, which is
  about 14.1 files per repository and 17.2 repositories per owner (derived).
  FineWeb v1.3.0 removed domains after a cease-and-desist notice. The licence
  detection error rate for The Stack v2 is not disclosed. Dot glyph: 97 of 100
  filled for repositories without a repository licence.
spec:
  header: "RIGHTS BELOW THE DATASET · SELF-REPORTS"
  variables: { Nu: 91, Nr: 1561, Nf: 22066, om: 0.70, er: 0.50, nl: 0.9693 }
  rows:
    - { key: "datasets audited (DPI)", value: "1,800+", note: "R7.25" }
    - { key: "licence omission on hosts, at least", formula: "om", format: percent, note: "reported as 70%+ (R7.25)" }
    - { key: "licence error rate on hosts, at least", formula: "er", format: percent, note: "reported as 50%+ (R7.25)" }
    - { key: "Pile constituents not ToS-compliant", value: "5 of 22", note: "P03; unknown consent = non-consensual" }
    - { key: "Stack v2 repos w/o repository licence", formula: "nl", format: percent, note: "96.93% (R7.12); replaced by file-level detection" }
    - { key: "opt-out owners (users + orgs)", formula: "Nu", format: integer, note: "R7.12, cut-off 2023-11-20" }
    - { key: "repositories removed", formula: "Nr", format: integer }
    - { key: "files removed", formula: "Nf", format: integer }
    - { key: "repositories per owner", formula: "Nr/Nu", format: fixed1, note: "derived: first hop of Eq. 7.9" }
    - { key: "files per repository", formula: "Nf/Nr", format: fixed1, note: "derived: second hop of Eq. 7.9" }
    - { key: "FineWeb C&D domain removal", value: "v1.3.0", note: "R7.5 changelog" }
    - { key: "Stack v2 detection error rate", value: "NOT-DISCLOSED" }
  glyph:
    type: dots
    total: 100
    filled: 97
    legend:
      - { marker: filled, label: "repos without a repository licence", value: "96.93%" }
      - { marker: hollow, label: "repos with one", value: "3.07%" }
states:
  - { anchor: why-this-exists, label: "collection-level labels fail", highlight: ["datasets audited (DPI)", "licence omission on hosts, at least", "licence error rate on hosts, at least", "Stack v2 repos w/o repository licence"], note: "Collection-level labelling failed twice over: omitted or wrong on hosting sites, and absent at repository level for 96.93% of Stack v2 repositories." }
  - { anchor: mechanism, label: "opt-out as Eq. 7.9", highlight: ["opt-out owners (users + orgs)", "repositories removed", "files removed", "repositories per owner", "files per repository"], note: "The deletion-lineage paragraph's worked instance: 91 owners → 1,561 repositories → 22,066 files, about 17 repositories per owner and 14 files per repository." }
  - { anchor: observations, label: "self-reports only", highlight: ["licence omission on hosts, at least", "Pile constituents not ToS-compliant", "Stack v2 detection error rate"], note: "Every row is the reporting group's own count. The error rate of the Stack v2 detection chain is not disclosed, so its file-level labels carry unknown error." }
```

## Intuition

A detected licence notice is an *observation*; a permission decision is an *interpretation under a policy*; a retention deadline is an *obligation*. They have different owners and update rules and cannot share a column. Physically, the content hash of an enterprise record does not change when a request switches from "index for internal search" to "export for training", yet the admissibility answer may; the decision is a function of the use, so a permanent Boolean on the object is the wrong data structure (DERIVED). Deletion is likewise not one operation: the data may live as raw archive, extracted shard, tokenized cache, index, backup, and — irreversibly — as a gradient contribution to weights. A closure over lineage tells you *where* to act; it does not tell you that acting removes information from a trained model. Heuristically one may call the governance store "the dataset's conscience"; mechanically it is an append-only ledger with typed rows and a reachability query.

## Formulation

> **Definition — Admissible-use decision.** A versioned result for a specified snapshot, purpose, actor, destination environment, and evaluation time, supported by identified evidence records and evaluated under an identified policy revision.

$$
\mathcal{A}(d, u, p, t) \;\in\; \{\operatorname{Allow}(e),\ \operatorname{Deny}(e),\ \operatorname{Review}(m)\}
$$
*(Eq. 7.8)*

| Local symbol | Meaning | Constraint |
|---|---|---|
| $d$ | snapshot or scoped record set | immutable identity (content hash) |
| $u$ | proposed use: purpose, actor, destination, environment | complete use specification |
| $p$ | decision policy | versioned rules with precedence |
| $t$ | evaluation time | timezone and relevant deadlines recorded |
| $e$ | supporting evidence references | each with scope and observation time |
| $m$ | missing or conflicting evidence | explicit reasons for review |

Eq. 7.8 is a proposed representation (ASSUMED). `Review` is neither inferred permission nor proof of prohibition; the execution policy of this chapter excludes `Review` records from a released training manifest until resolved. The predicate `admissible(d, r, u)` used by Algorithm 7.2 line 5 is 𝒜 = Allow.

```figure
id: fig-7.19
kind: diagram
title: "Evidence, use, policy and time in one decision: A(d, u, p, t)"
caption: >-
  Evidence records are observations. They enter the decision as dashed
  dependencies alongside the snapshot, the use, the policy revision and the
  time. The same content hash can therefore yield Allow for one purpose and
  Review for another. Only the emphasised path reaches a training run, as
  the decision_ref of a Γ row. Review is neither permission nor prohibition:
  it stays out of the released manifest, and unknown consent routes to it by
  rule.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-7.8", R7.34, P03, P05, P21]
concepts: [ms.section.7.4, ms.section.7.2]
alt: >-
  Diagram of Eq. 7.8. Four rights evidence records feed the decision as
  dependencies: licence evidence (an SPDX identifier with repository or file
  scope), a consent record (mechanism, notice version, scope), a terms
  revision (for example the Reddit API terms at collection, March 2023) and a
  retention basis (retain-until per artifact class). The snapshot d (content
  hash), the use u (purpose, actor, destination, jurisdiction), the policy p
  (versioned rules with precedence) and the evaluation time t (deadlines,
  expiry) also feed the decision A(d, u, p, t). It branches to Allow(e), which
  enters the allow manifest and becomes the decision_ref of a role_assignments
  row; to Deny(e), with reason codes in the ledger; and to Review(m), where
  unknown consent routes by rule and which is excluded from a released manifest
  until resolved.
spec:
  direction: LR
  nodes:
    - { id: lic, kind: dependency, label: "licence evidence", sub: "SPDX id; repository vs file scope", group: ev }
    - { id: con, kind: dependency, label: "consent record", sub: "mechanism, notice version, scope", group: ev }
    - { id: ter, kind: dependency, label: "terms revision", sub: "e.g. Reddit API terms, March 2023", group: ev }
    - { id: ret, kind: dependency, label: "retention basis", sub: "retain_until per artifact class", group: ev }
    - { id: d, kind: dataset, label: "snapshot d", sub: "content hash" }
    - { id: u, kind: node, label: "use u", sub: "purpose, actor, destination, jurisdiction" }
    - { id: p, kind: node, label: "policy p", sub: "versioned rules with precedence" }
    - { id: t, kind: state, label: "evaluation time t", sub: "deadlines, expiry" }
    - { id: a, kind: branch, label: "A(d, u, p, t)", sub: "Eq. 7.8, Algorithm 7.4 line 3", emphasis: true }
    - { id: allow, kind: state, label: "Allow(e)", sub: "enters the allow manifest" }
    - { id: deny, kind: state, label: "Deny(e)", sub: "reason codes in the ledger" }
    - { id: rev, kind: state, label: "Review(m)", sub: "unknown consent lands here; excluded until resolved" }
    - { id: gam, kind: flow, label: "Γ row decision_ref", sub: "Algorithm 7.2 line 5" }
  edges:
    - { from: lic, to: a, kind: dependency }
    - { from: con, to: a, kind: dependency }
    - { from: ter, to: a, kind: dependency }
    - { from: ret, to: a, kind: dependency }
    - { from: d, to: a }
    - { from: u, to: a }
    - { from: p, to: a }
    - { from: t, to: a, kind: dependency }
    - { from: a, to: allow, kind: emphasis }
    - { from: allow, to: gam, kind: emphasis, label: "decision_ref" }
    - { from: a, to: deny }
    - { from: a, to: rev }
  groups:
    - { id: ev, label: "rights evidence records (observations)" }
```

> **Definition — Rights evidence record.** A typed observation with fields {issuer, subject (record, file, repository, participant), instrument (licence identifier, consent notice version, contract clause reference, terms-of-use revision), scope, observation time, evidence location}. Licence identifiers use the SPDX License List, "a list of commonly found licenses and exceptions used in free and open or collaborative software, data, hardware, or documentation" (OFFICIAL-DOCUMENTATION · R7.34).

> **Definition — Deletion lineage.** The graph connecting a scoped removal request to affected source objects, derivatives, published artifacts, and recorded downstream uses, together with the status of each required remediation action.

$$
\mathcal{C}_0 = \mathcal{S}_{\text{seed}}, \qquad \mathcal{C}_{k+1} = \mathcal{C}_k \cup \{ v : (w, v) \in \mathcal{E},\ w \in \mathcal{C}_k \}
$$
*(Eq. 7.9)* where 𝒮_seed = the resolved seed set of a removal request, ℰ = the set of derivation and use edges (`wasDerivedFrom` and `used` in PROV-DM terms, §7.3), and the iteration stops at the first k with 𝒞_{k+1} = 𝒞_k. Reachability is MATHEMATICALLY-DERIVED; the action each reachable vertex requires is a policy decision. A trained model in 𝒞 means the model *used* the data; it does not mean deleting a shard removes information from its weights (DERIVED).

```figure
id: fig-7.20
kind: diagram
title: "Removal closure, Eq. 7.9: from a seed to the weights"
caption: >-
  One graph, re-read at each step of the argument. The formulation lights
  the seed and the fixpoint rule. The mechanism lights the only published
  instance, The Stack v2's opt-out, with its three hops. Algorithm 7.4
  lights the use edge, which turns a trained checkpoint into a review task.
  The failure modes light what goes missing when Γ is left out of the edge
  set. Shards, caches and the checkpoint are generic artifact classes, not
  counts R7.12 reports.
placement: rail
anchor: formulation
evidence: DERIVED
source: ["DERIVED:eq-7.9", "DERIVED:alg-7.4", R7.12, R7.33]
alt: >-
  Diagram of the removal closure. A removal request resolves to a seed set C0,
  here the 91 users and organisations of The Stack v2's opt-out. Derivation
  edges (PROV-DM wasDerivedFrom) lead to 1,561 repositories, C1, then to
  22,066 files, C2, then to extracted shards and tokenized caches. A use edge
  (PROV-DM used, a Γ row) leads from the shards to a trained checkpoint, and
  the checkpoint leads to a review task that can never auto-complete. The
  iteration stops at the first k with C(k+1) = C(k). Reachability says where
  to act; it does not say that deleting a shard removes information from the
  weights.
spec:
  direction: TB
  nodes:
    - { id: req, kind: dependency, label: "removal request", sub: "resolved to identities, not URLs" }
    - { id: own, kind: node, label: "C₀: 91 users and organisations", sub: "Stack v2 opt-out seed (R7.12)" }
    - { id: repo, kind: node, label: "C₁: 1,561 repositories", sub: "derivation edge" }
    - { id: file, kind: node, label: "C₂: 22,066 files", sub: "derivation edge" }
    - { id: shard, kind: dataset, label: "extracted shards, tokenized caches", sub: "wasDerivedFrom" }
    - { id: ckpt, kind: model, label: "trained checkpoint", sub: "reached only through a Γ use edge", emphasis: true }
    - { id: rev, kind: branch, label: "review task", sub: "never auto-complete (line 8)" }
    - { id: fix, kind: state, label: "stop at C_{k+1} = C_k", sub: "visited set; O(|V| + |E ∪ Γ|)" }
  edges:
    - { from: req, to: own, label: "resolve seed" }
    - { from: own, to: repo }
    - { from: repo, to: file }
    - { from: file, to: shard }
    - { from: shard, to: ckpt, kind: emphasis, label: "used (Γ row)" }
    - { from: ckpt, to: rev, kind: emphasis }
    - { from: shard, to: fix, kind: dependency }
states:
  - { anchor: formulation, label: "C₀ and the fixpoint", highlight: [req, own, fix], note: "C₀ is the resolved seed. Each step adds every vertex one derivation or use edge away, and the iteration stops at the first k with C_{k+1} = C_k." }
  - { anchor: mechanism, label: "Stack v2 opt-out", highlight: [own, repo, file, "own->repo", "repo->file"], note: "The published instance: 91 users and organisations → 1,561 repositories → 22,066 files (R7.12). No corpus documents the next hop, into trained checkpoints." }
  - { anchor: algorithm, label: "lines 7–8: ℰ ∪ Γ", highlight: [shard, ckpt, rev, "shard->ckpt", "ckpt->rev"], note: "Line 7 traverses derivation and use edges once with a visited set. Line 8: a consumed-by-training edge opens a review task and never auto-completes." }
  - { anchor: failure-modes, label: "closure without Γ", highlight: [ckpt, "shard->ckpt"], note: "Storage deletion reported as model remediation: drop the Γ edge and the closure stops at the shards, so the served checkpoint is never reached." }
```

## Mechanism

**Licences as evidence, not labels.** The corpora of §7.6 illustrate the two levels. At the *distribution* level the builders state a licence for their own artifact: FineWeb, FineWeb-Edu and FineWeb2 are released "under the Open Data Commons Attribution License (ODC-By) v1.0" and "also subject to CommonCrawl's Terms of Use" (OFFICIAL-DOCUMENTATION · R7.5, R7.6, R7.7); DCLM distributes "extracted page content and associated metadata under a standard CC-BY-4.0 licence" with code under MIT and the same Common Crawl terms (PAPER-REPORTED · P07); RefinedWeb's public extract "is made available under an ODC-By 1.0 license" (PAPER-REPORTED · P04); the Hugging Face copy of C4 is "under the terms of ODC-BY" with Common Crawl terms (OFFICIAL-DOCUMENTATION · R7.1); Dolma moved to ODC-By on 2024-04-15 (OFFICIAL-DOCUMENTATION · R7.19), and the RedPajama-Data repository is Apache-2.0 while "For the datasets themselves, we refer to the Common Crawl Foundation Terms of Use" (PAPER-REPORTED · R7.3; OFFICIAL-DOCUMENTATION · R7.2). At the *content* level the distribution licence says nothing: The Stack v2's card states "Any use of all or part of the code gathered in The Stack v2 must abide by the terms of the original licenses" (OFFICIAL-DOCUMENTATION · R7.13), and its construction shows the detection chain — GHArchive repository licence where present, otherwise ScanCode Toolkit over files matching a licence-file regex, SPDX ids gathered, licences "propagate[d] to all files that have the same base path within the repository as the license file", and a permissive list "compiled from the licenses approved by the Blue Oak Council, as well as licenses categorized as 'Permissive' or 'Public Domain' by ScanCode"; copyleft is excluded "due to uncertainty regarding the community's stance", commercial licences "since their creators do not intend their code to be used for commercial purposes" (PAPER-REPORTED · R7.12). Every step is an evidence record with its own scope (repository vs file vs path-propagated) and its own error rate; the inventory keeps `detected_licenses` and `license_type` as two fields, as the card does (R7.13).

```figure
id: fig-7.21
kind: compare
title: What six releases state about rights, and at which level
caption: >-
  Read the first two rows together. Five releases state a licence for their
  own artifact and point upstream to Common Crawl's terms; only The Stack v2
  declines to state one and defers to each file's original licence. The
  content-level row is where the columns part: most releases are silent
  per record, while Dolma states per source and Stack v2 per file. No cell
  here is a legal interpretation; each quotes or paraphrases the release's
  own source.
placement: wide
evidence: OFFICIAL-DOCUMENTATION
source: [R7.1, R7.2, R7.3, R7.19, P05, R7.5, R7.6, R7.7, P07, R7.4, R7.12, R7.13]
concepts: [ms.section.7.4, ms.section.7.6]
alt: >-
  Comparison of rights statements. C4 (allenai/c4 mirror): ODC-BY and bound by
  Common Crawl terms; nothing per record; hosted mirror; no removal path
  stated. RedPajama-Data: repository Apache-2.0, datasets deferred to the
  Common Crawl Foundation Terms of Use; V1 GitHub restricted to Apache, BSD and
  MIT; Books3 taken down due to copyright issues. Dolma: ODC-By from
  2024-04-15; per source C4 and S2ORC ODC-By 1.0, Wikimedia CC BY-SA 4.0,
  Gutenberg not under US copyright, Reddit inheriting the API terms at
  collection; PII removal form. FineWeb family: ODC-By v1.0 and Common Crawl
  terms; nothing per page; FineWeb2 removed subsets by direct download only;
  PII form, C&D domain removal in v1.3.0, webmaster opt-out. DCLM: CC-BY-4.0
  data, MIT code, Common Crawl terms; pool hosted by Common Crawl; one WARC per
  jsonl to propagate redactions. The Stack v2: no single licence, original
  licences apply; detected_licenses and license_type per file, copyleft and
  commercial excluded; gated access; opt-out to 2023-11-20.
spec:
  axis: "Rights as each release's own paper, card or repository states them: distribution level, upstream terms, content level, access and removal; no legal interpretation"
  columns:
    - { id: c4, label: "C4 (allenai/c4 mirror)" }
    - { id: rp, label: "RedPajama-Data" }
    - { id: dolma, label: "Dolma" }
    - { id: fw, label: "FineWeb, -Edu, FineWeb2" }
    - { id: dclm, label: "DCLM" }
    - { id: stack, label: "The Stack v2" }
  rows:
    - { dimension: "distribution licence", values: { c4: "ODC-BY (R7.1)", rp: "repository Apache-2.0 (R7.2)", dolma: "ODC-By from 2024-04-15 (R7.19)", fw: "ODC-By v1.0 (R7.5, R7.6, R7.7)", dclm: "CC-BY-4.0 data; MIT code (P07)", stack: "none of its own: 'must abide by the terms of the original licenses' (R7.13)" } }
    - { dimension: "upstream terms", values: { c4: "'bound by the Common Crawl terms of use'", rp: "'we refer to the Common Crawl Foundation Terms of Use' (R7.3)", dolma: "Reddit: API terms at collection, March 2023 (P05)", fw: "'subject to CommonCrawl's Terms of Use'", dclm: "Common Crawl terms of use", stack: "Software Heritage archive; GHArchive licence where present" } }
    - { dimension: "content level", values: { c4: "NOT-DISCLOSED per record", rp: "V1 GitHub limited to Apache, BSD, MIT; Books3 taken down 'due to copyright issues'", dolma: "per source: C4, S2ORC ODC-By 1.0; Wikimedia CC BY-SA 4.0; Gutenberg not under US copyright", fw: "NOT-DISCLOSED per page", dclm: "NOT-DISCLOSED per page", stack: "detected_licenses + license_type per file; copyleft and commercial excluded (R7.12)" } }
    - { dimension: "access surface", values: { c4: "Hugging Face mirror; TFDS", rp: "code on GitHub; data releases RedPajama-Data-1T and -V2 (R7.2)", dolma: "Hugging Face card; versions v1 … v1_7 (R7.19)", fw: "Hugging Face; FineWeb2 _removed subsets by direct download only", dclm: "DCLM-Pool 'hosted by Common Crawl'", stack: "gated: agree to share contact information; blobs from Software Heritage S3" } }
    - { dimension: "removal path", values: { c4: "NOT-DISCLOSED", rp: "Books3 removal documented", dolma: "PII removal form", fw: "PII form; v1.3.0 C&D domain removal; webmaster opt-out (FineWeb2)", dclm: "one WARC ↔ one jsonl to propagate CC redactions", stack: "'Am I in The Stack' opt-out until 2023-11-20" } }
```

**Consent records.** Consent is a record about a *participant*, not a document. The Pile's three tiers — "Public data", "Terms of Service (ToS) compliant data", and "Data with authorial consent" — with the caveat that "being ToS-compliant does not entail authorial consent" (PAPER-REPORTED · P03), give the minimum enumeration. Interaction data shows what a consent record contains: InstructGPT's notice version ("a recurring notification any time InstructGPT models were used") and scope (Playground only, "we do not use data from customers using the API in production") (PAPER-REPORTED · P21); WildChat's "affirmative, consensual opt-in to anonymously collect their chat transcripts and request headers", released "under AI2 ImpACT Licenses" (PAPER-REPORTED · R7.22). The inventory field is `consent = {mechanism, notice_version, scope, withdrawal_path, evidence_ref}`; an exported chat log without these is `consent = unknown`, and unknown is treated as non-consensual, following P03's rule (ASSUMED policy adopted from P03).

**Contractual restrictions and terms of use.** Terms are instruments with revisions. Dolma records that Pushshift dumps "inherit the Terms of use of the Reddit API at the time of their collection (March 2023)" and that the source later stopped distributing (PAPER-REPORTED · P05); Common Crawl's terms are described by DCLM as granting "a limited, non-transferable license to access and use their service, primarily for innovation, education, and research, with several restrictions" (PAPER-REPORTED · P07). The record therefore stores the terms *revision and date*, allowed purposes, parties, destinations, retention, and redistribution as structured fields, with the clause retained under access control. A parser may propose values; ambiguous clauses stay `Review`, and the stored decision names an accountable reviewer rather than claiming that software resolved an interpretive question (ASSUMED protocol).

**Retention conditions.** Datasheets asks whether "there [are] applicable limits on the retention of the data" and how they "will be enforced" (PAPER-REPORTED · R7.27). Engineering-wise, retention is per *artifact class*: raw payloads, extracted shards, tokenized caches, indexes, backups, audit records, and sidecars each carry a `retain_until` and a `basis`. A tombstone — the fact that a record was excluded, without its content — is itself a record with a retention decision; it is not automatically harmless metadata (DERIVED).

```figure
id: fig-7.22
kind: hierarchy
title: Where one released record lives, and what removal can do there
caption: >-
  Each level is an artifact class with its own retain_until and basis. The
  first five can be deleted or tombstoned with evidence. The tombstone and the
  sidecar are records that themselves need retention decisions. The
  emphasised bottom level is the one no deletion reaches: a gradient
  contribution, where the closure can only open a review task. The upstream
  custodian's copy sits outside every level, which is why crawl-level
  redaction needs a mapping such as DCLM's.
placement: inline
evidence: DERIVED
source: ["DERIVED:eq-7.9", "DERIVED:alg-7.4", R7.27, P07]
concepts: [ms.section.7.4, ms.section.12.1, ms.section.66.2]
alt: >-
  Eight artifact classes from source to model, each with its removal action.
  Raw payload (WARC record or code blob): delete or tombstone; the custodian's
  copy remains, and Common Crawl periodically redacts its dumps. Extracted
  shard: delete and republish a release view. Tokenized cache: delete; worker
  caches must carry the release id. Index: delete the entry. Backup: one
  inaccessible backup marked complete is a failure mode. Audit record or
  tombstone: a record with its own retention decision. Sidecar of locators, IPs
  and user ids: access-controlled, and orphaning it breaks deletion. Trained
  weights, emphasised: a gradient contribution, where the closure opens a
  review task that never auto-completes.
spec:
  direction: down
  levels:
    - { label: "raw payload (WARC record, blob)", kind: dataset, note: "delete or tombstone; custodian copy remains; CC periodically redacts dumps (P07)" }
    - { label: "extracted shard", kind: dataset, note: "delete; publish a new release view" }
    - { label: "tokenized cache", kind: memory, note: "delete; worker caches must carry the release id" }
    - { label: "index", kind: memory, note: "delete the entry" }
    - { label: "backup", kind: memory, note: "one inaccessible backup marked complete is a failure mode" }
    - { label: "audit record / tombstone", kind: state, note: "a record with its own retention decision, not harmless metadata" }
    - { label: "sidecar (locators, IPs, user ids)", kind: boundary, note: "access-controlled; orphaned sidecars break deletion (§7.3)" }
    - { label: "trained weights", kind: model, emphasis: true, note: "gradient contribution: closure opens a review task, never auto-complete" }
```

**Access boundaries.** Access is a property of the *distribution surface*. The Stack v2 is gated ("You need to agree to share your contact information to access this dataset") and its file contents must be fetched separately from Software Heritage's bucket (OFFICIAL-DOCUMENTATION · R7.13); FineWeb2's `_removed` subsets are reachable "through direct download ... but not through `load_dataset`" (OFFICIAL-DOCUMENTATION · R7.7); DCLM-Pool is "hosted by Common Crawl" (PAPER-REPORTED · P07). Inside an organisation the same principle applies to the lineage store: locators, IPs, and user ids in the §7.3 sidecar are governance data with their own boundary, because provenance can identify people and tenants (DERIVED).

**Deletion lineage.** Three published mechanisms fix the shape of the removal path. *Crawl-level*: "Common Crawl does honor deletion requests and periodically redacts dumps", and DCLM's one-to-one WARC-to-jsonl mapping exists so the pool can be "update[d] based on redactions" (PAPER-REPORTED · P07). *Corpus-level*: FineWeb, FineWeb2 and Dolma each publish a PII removal or opt-out form (OFFICIAL-DOCUMENTATION · R7.5, R7.7, R7.19); FineWeb2's card extends the form to webmasters (R7.7). *Pre-training opt-out*: The Stack's "Am I in The Stack" tool let developers opt out until 2023-11-20, after which "we eliminated 1,561 repositories associated with 91 users and organizations. A total of 22,066 files were removed" (PAPER-REPORTED · R7.12) — a worked instance of Eq. 7.9 where the seed is a user, the first hop is repositories, and the second is files. What no published corpus documents is the *use* side of the graph: which trained checkpoints consumed a removed record. The inventory's `role_assignments` table (§7.2) is exactly that edge set, which is why the two sections share one artifact.

```figure
id: fig-7.23
kind: cycle
title: The release–removal loop behind the case-study corpora
caption: >-
  Removal is a loop, not an event. A request arrives after release and
  often after use. The closure produces a new release view that supersedes
  the old one, and the published instances (a CC redaction propagated
  through DCLM's mapping, FineWeb's v1.3.0 C&D removal, The Stack v2's
  opt-out) all close that arc. The arc no published corpus documents is the
  one back to the trained checkpoint, drawn here as a review task.
placement: inline
evidence: PAPER-REPORTED
source: [P07, R7.5, R7.7, R7.12, R7.19, "DERIVED:eq-7.9"]
concepts: [ms.section.7.4, ms.section.66.2]
alt: >-
  Cycle of seven stages. A custodian archive (Common Crawl, Software Heritage)
  feeds a versioned corpus release with card version and manifest, which is
  assigned to runs by role_assignments rows, which feed a training run and
  checkpoint. A removal request (a redaction, a cease-and-desist notice, an
  opt-out or a PII form) arrives after use and is resolved by a closure over
  derivation and use edges (Eq. 7.9), which produces a new release view such
  as FineWeb v1.3.0. Feedback arcs: the new view supersedes the previous
  release; the closure returns to the checkpoint as a review task, not a
  deletion; and a redaction returns to the custodian archive, as Common Crawl
  periodically redacts its dumps.
spec:
  stages:
    - { id: arch, label: "custodian archive", kind: dataset, sub: "Common Crawl · Software Heritage" }
    - { id: rel, label: "versioned corpus release", kind: dataset, sub: "card version + manifest" }
    - { id: gam, label: "role assignments Γ", kind: flow, sub: "(snapshot, role, run)" }
    - { id: run, label: "training run → checkpoint", kind: model, sub: "consumed tokens" }
    - { id: req, label: "removal request", kind: feedback, sub: "redaction · C&D · opt-out · PII form" }
    - { id: clo, label: "closure over ℰ ∪ Γ", kind: process, sub: "Eq. 7.9, Algorithm 7.4" }
    - { id: view, label: "new release view", kind: state, sub: "e.g. FineWeb v1.3.0" }
  edges:
    - { from: arch, to: rel }
    - { from: rel, to: gam }
    - { from: gam, to: run }
    - { from: run, to: req, label: "arrives after use" }
    - { from: req, to: clo }
    - { from: clo, to: view }
    - { from: view, to: rel, kind: feedback, label: "supersedes" }
    - { from: clo, to: run, kind: feedback, label: "review task, not deletion" }
    - { from: req, to: arch, kind: feedback, label: "CC redacts dumps" }
```

**Jurisdiction-specific statements (all UNVERIFIED, quoted as the papers' own claims).** Dolma's authors write that "In the United States, legal scholars and practitioners have suggested that training models on copyright content might constitute fair use", that "legal assessments ... vary widely depending on jurisdiction", and that in early 2024 "Israel ... and Japan allow copyrighted content to be used for AI training data, although the latter is currently re-considering this framework" (PAPER-REPORTED · P05; legal content UNVERIFIED). The Pile's authors argue their use is "transformative" and note "Copyright law varies by country" (PAPER-REPORTED · P03; UNVERIFIED). This book takes no position; the engineering consequence is only that `jurisdiction` is a field of the use specification u in Eq. 7.8, and that a decision valid under one policy revision is not valid under another.

Cost line: evidence records are tens to hundreds of bytes per record plus the retained instrument text; policy evaluation is deterministic rule application, no model FLOPs; licence detection at repository scale is a regex-plus-ScanCode pass whose CPU cost R7.12 does not report (NOT-DISCLOSED); removal closure is one graph traversal per request; the unrecoverable cost is a retrain when a consumed record must leave the weights (DERIVED).

## Algorithm

```text
Algorithm 7.4 — Versioned use decisions and removal closure
INPUT   snapshot manifest (d, a(d)), use specification u, policy revision p, evidence index; for removals: request scope
OUTPUT  allow manifest, deny/review ledger with reason codes, decision digest; for removals: action list by artifact class
STATE   bounded evidence cache, staged decisions, immutable lineage adjacency ℰ, role_assignments Γ (§7.2)
INVARIANT  published records have an Allow result under one declared (p, t); no decision is overwritten, only superseded
1  validate u (purpose, actor, destination, jurisdiction, time) and the integrity of evidence references
2  for each record, or each certified homogeneous partition: resolve scoped evidence (licence, consent, terms, retention)
3  evaluate p exhaustively → Allow(e) | Deny(e) | Review(m); attach reason codes; unknown consent → Review
4  stage allowed identities and excluded decisions without copying sensitive evidence into the public manifest
5  recheck p revision and evidence expiry immediately before atomic manifest publication; expired → re-evaluate
6  on a removal request: resolve seed identities (record, file, repository, user, domain) or return unresolved-scope
7  compute 𝒞 by Eq. 7.9 over ℰ ∪ Γ once, with a visited set; record required action per artifact class
8  mark each action pending | completed-with-evidence | blocked-with-reason; a consumed-by-training edge yields a review task, never auto-complete
9  publish a new release view; retain the historical decision under its own retention policy; terminate
```
Complexity: with n records, at most ϱ rules per record and indexed evidence lookup cost ℓ_ev, evaluation is O(n(ϱ + ℓ_ev)); the closure is O(|V| + |ℰ ∪ Γ|) with a visited set, including cyclic use graphs (MATHEMATICALLY-DERIVED). Rescanning every artifact per removal seed is rejected: overlapping closures make it quadratic without adding information (DERIVED).

## Implementation

The reference stack contains no policy engine; nothing here claims one exists inside any listed system. **Hugging Face Transformers** (#26, *Model definition / adaptation*) must receive only records selected by the applicable allow manifest before tokenization (OFFICIAL-DOCUMENTATION · R7.30 for the tokenizer interface; the gating is this chapter's integration requirement). **PyTorch** (#17, *Model / autograd framework*) and **Nanotron** (#35, *Distributed training*) consume the same release identity (R7.31, R7.32); worker-local caches must carry the release id, otherwise a correct central decision coexists with stale worker inputs (DERIVED). *Outside the reference stack (plan anchors: Appendix C mandatory fields "license/permission record" and "retention/deletion conditions"; P03, P05, P07, R7.12):* SPDX identifiers (R7.34), the ScanCode-based detection chain of R7.12, Hub dataset-card `license` metadata (R7.29), and the PROV-DM relation vocabulary (R7.33) are the documented building blocks; the ledger and closure engine are this chapter's proposed design.

```text
Systems trace (removal request → remediation)
resolve seed → latency: index lookup / memory: O(seed) / failure: URL-only scope cannot resolve archived copies
closure (Eq. 7.9) → latency: O(|V|+|E|) / memory: visited set, disk-backed frontier / failure: missing use edges → silent under-closure
act per class → raw, shard, cache, index, backup: delete or tombstone / model: review task / failure: one inaccessible backup marked complete
publish view → latency: manifest write / communication: invalidation to workers / failure: worker cache without release id
```

## Experimental design

### Experiment 7.4 — Policy revision and incomplete deletion lineage on a synthetic ledger

- **Hypothesis:** indexing decisions by (d, u, p, t) and including use edges Γ in the closure exposes stale permissions and incomplete remediation that a snapshot-level licence string cannot represent.
- **Setup:** a fictional, fully permissioned fixture: synthetic contracts, consent notices with versions, multi-parent derivatives, cached copies, and recorded training uses; planted answer key.
- **Independent variables:** purpose change; expired retention; conflicting evidence; missing parent edges; stale worker manifest; policy revision bump.
- **Controlled variables:** source records, rule order, release protocol.
- **Dataset/workload:** the synthetic fixture only; no real personal data.
- **Hardware:** database, storage and worker topology declared before execution.
- **Metrics:** incorrect Allow rate; Review routing accuracy; closure recall against the planted graph; count of remediation actions left pending; decision latency.
- **Baselines:** one licence string per archive; payload-only deletion tracking (ℰ without Γ).
- **Expected result:** closure recall 1.0 with Γ and < 1.0 without it when training uses are planted; stale worker manifests admit expired data in the baseline only.
- **Ablation:** remove use edges; remove policy-revision recheck (line 5).
- **Interpretation:** agreement with the answer key validates the implementation of the declared policy, never the legal correctness of the policy.
- **Threats to validity:** real instruments are more ambiguous; external copies are unobservable; organisational enforcement is not simulated by traversal.

Proposal only; no run was executed.

## Observations

**What the paper claims.** R7.25 claims 70%+ licence omission and 50%+ error on hosting sites across 1,800+ datasets; P03 claims a three-tier consent model with unknown treated as non-consensual and five constituents not ToS-compliant; R7.12 claims a file-level detection chain and a quantified opt-out removal; P07 claims crawl-level redaction propagation through a one-to-one file mapping; P05 and P03 make jurisdiction claims (all PAPER-REPORTED; legal content UNVERIFIED).

**What the evidence shows.** The audit figures of R7.25 are one group's manual annotation with its own taxonomy; the opt-out counts of R7.12 and the consent tiers of P03 are self-reports by builders. No corpus inspected publishes the use side of its deletion graph, so the claim that Γ is needed rests on Proposition 7.1 and the mechanism, not on an observed incident rate.

**What we infer.** Because the same content hash can be admissible for one use and not another, admissibility must be a function of the use (DERIVED). We infer, marked ASSUMED, that most governance failures in practice are stale-cache failures (a decision outliving its evidence) rather than wrong initial decisions; no public evidence quantifies this.

**What remains unknown.** Licence detection error rates on The Stack v2's chain are NOT-DISCLOSED. Whether any lab retrains after a removal request is NOT-DISCLOSED. Every jurisdictional statement above is UNVERIFIED by this book.

## Failure modes

> **Failure mode — Stale Allow.** *Symptom:* a run consumes records whose consent notice or terms revision has changed. *Cause:* decision cached without (p, t) and expiry. *Detection:* line 5 recheck fails on republication. *Mitigation:* decisions carry policy revision and expiry; invalidate worker caches by release id.

> **Failure mode — Scope over-propagation.** *Symptom:* every file in a repository inherits a permissive label. *Cause:* repository-level notice propagated past its base path. *Detection:* file-level ScanCode disagreement with repository label. *Mitigation:* keep repository and file evidence as separate rows (R7.12's two-level chain).

> **Failure mode — Locator-only removal.** *Symptom:* a request matched by current URL misses archived and re-hosted copies. *Cause:* seed resolved by locator, not identity. *Detection:* identical payload digests remaining after "completion". *Mitigation:* resolve seeds to source identifiers (§7.3) and traverse ℰ.

> **Failure mode — Evidence copy in logs.** *Symptom:* a logging system holds a full contract or a full chat transcript outside the governed store. *Cause:* evidence payload logged instead of a reference. *Detection:* log-store scan for evidence digests. *Mitigation:* references only; logs inherit the evidence retention class.

> **Failure mode — Storage deletion reported as model remediation.** *Symptom:* a request is closed because shards were deleted, while a checkpoint trained on them remains served. *Cause:* Γ edges absent from the closure. *Detection:* role_assignments rows referencing the seed after closure. *Mitigation:* line 8 — training uses open a review task that cannot auto-complete.

## Siblings

**Acquisition and extraction** — [07-3-acquisition-and-extraction.md](07-3-acquisition-and-extraction.md)
Why it exists: records what was observed and how it was transformed. What assumption changed here: observation is given; the question is whether a use is admitted. What objective changed: none. What problem it solved: a stable identity to attach decisions to. What new failure mode it introduced: sidecar boundaries. Changed primitive: lineage edge → decision row.

**Privacy and sensitive data** — [§8.4](../ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-4-privacy-and-sensitive-data.md)
Why it exists: content that should not be trained on regardless of rights. What assumption changed: a detector, not a record, decides. What objective changed: precision/recall of detection. What problem it solved: PII at scale. What new failure mode it introduced: false negatives mistaken for authorisation. Changed primitive: evidence record → classifier. Passing a detector does not supply missing consent, and consent does not prove the detector found every span.

**Security controls** — [§65.4](../../../vol-03-grounded-and-interactive-intelligence/part-11-evaluation-interpretability-and-deployment-assurance/ch65-security-privacy-safety-and-adversarial-robustness/65-4-controls.md)
Why it exists: enforcing boundaries at runtime. What assumption changed: the adversary is active. What objective changed: threat model. What problem it solved: access enforcement. What new failure mode it introduced: none new to data. Changed primitive: decision row → enforcement point.

## Extensions

For federated or partner data, retain remote evidence references and attestations with explicit trust assumptions (ASSUMED). For agents, attach use decisions to retrieved records and tool outputs as well as training snapshots — the retrieval-corpus role's "permissions" and "update/delete behavior" fields in Appendix C. For synthetic data, the teacher's terms and the seed records' rights propagate to generated records through `wasDerivedFrom` edges; Appendix C's distillation row names "reuse rights" for this reason, developed in [§11.6](../ch11-synthetic-data-preferences-and-interactive-trajectories/11-6-synthetic-data-economics.md).

## Limitations

The design is only as complete as its evidence and its edge set; unregistered exports are outside the graph, and a complete traversal of an incomplete graph is an incomplete operational answer. Human interpretation of instruments can disagree with perfect metadata; the ledger records disagreement rather than forcing certainty. The section is falsified as a design if Experiment 7.4 shows that a snapshot-level licence string plus payload-only deletion achieves the same closure recall and stale-Allow rate as the typed ledger on a fixture with planted use edges.

## Reproducibility

Versions: P03 (ar5iv), P04 (ar5iv), P05 (arXiv HTML v2), P07 (arXiv HTML v4), P21 (ar5iv), R7.3, R7.12, R7.22, R7.25 (arXiv abs) — accessed 2026-09-20; R7.1, R7.2, R7.5, R7.6, R7.7, R7.13, R7.19 (cards/READMEs, `main`, unpinned), R7.27 (ar5iv), R7.29, R7.33, R7.34 — accessed 2026-09-20; R7.30–R7.32 opened 2026-09-23. Artifacts: inventory admissible-use fields `license_evidence[]`, `consent`, `terms_revision`, `restrictions[]`, `retain_until_by_class`, `access_boundary`, `deletion_status`, `admissible_use{purpose→decision, policy_rev, evaluated_at}` in [verification.md](verification.md). Exact definitions: Eq. 7.8–7.9. Unresolved: all jurisdictional questions (UNVERIFIED); detection error rates and retrain practice (NOT-DISCLOSED).

## References

P03, P04, P05, P07, P21, R7.1, R7.2, R7.3, R7.5, R7.6, R7.7, R7.12, R7.13, R7.19, R7.22, R7.25, R7.27, R7.29, R7.30, R7.31, R7.32, R7.33, R7.34; Eq. 7.8–7.9.
