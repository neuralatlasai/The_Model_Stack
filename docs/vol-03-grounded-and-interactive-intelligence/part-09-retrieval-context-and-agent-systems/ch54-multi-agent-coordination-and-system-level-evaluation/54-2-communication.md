---
id: ms.section.54.2
entity_type: section
title: "Communication"
volume: 3
part: 9
chapter: 54
section: 54.2
slug: 54-2-communication
parent: ms.chapter.54
prev_sibling: ms.section.54.1
next_sibling: ms.section.54.3
children: []
prerequisites: [ms.chapter.6, ms.chapter.38, ms.chapter.48, ms.chapter.51, ms.chapter.52, ms.chapter.53]
downstream: [ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation, assurance], mechanism: [multi_agent_coordination, resource_accounting], feedback_setting: [], modality: [text]}
papers: [P41, P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 54.2 Communication

## Scope

[DERIVED] Communication specifies what agents exchange, who consumes it and how observations become shared evidence. It covers message schemas, shared artifacts, context transfer, provenance and synchronization. The baseline broadcasts accumulated prose histories to every participant. The objective is sufficient validated information at each decision point with controlled context, latency and trust costs.

[DERIVED] Chapter 50 owns grounded context construction and Chapter 51 owns protocol/tool authority. Inter-agent messages remain data about another controller's work. They do not become authoritative because the sender is labeled a specialist, critic or manager.

## Why this exists

[DERIVED] Communication can increase the information available to a worker while reducing the budget left to use it. Repeated long rationales consume prompt processing and context space; later rounds can re-read the same claims without new evidence. Summaries can omit qualifications, source identity or failed checks. A final aggregator may then count several paraphrases of one source as independent support.

[DERIVED] Coordination also depends on when a message is valid. A worker's inventory snapshot can become stale before another worker acts. An artifact can be updated while a recipient still reasons from its previous version. A barrier that waits for every worker avoids some incomplete-input paths but introduces straggler latency; asynchronous consumption reduces waiting while requiring explicit version/dependency handling.

[PAPER-REPORTED] MetaGPT uses structured role artifacts and a publish/subscribe pool instead of unrestricted pairwise dialogue [R54.2, §3.2]. This is a concrete information-routing mechanism, but its claim that artifacts contain necessary information does not prove semantic completeness for arbitrary tasks.

## Intuition

[DERIVED] A useful message says what was asked, what was observed, what artifact was produced, which version it refers to and what remains uncertain. It distinguishes a source statement from an inference and a failed test from an absent test. The recipient can then verify a claim or request missing evidence without reconstructing the sender's entire conversation.

[DERIVED] Shared artifacts reduce repeated serialization when recipients can retrieve exactly what they need. They do not eliminate read traffic, model context or validation. A content hash identifies bytes; it does not establish that those bytes are true, current or authorized. The communication contract must preserve both artifact identity and evidential meaning.

## Formulation

[DERIVED] A bounded message is
$$
m=(\mathrm{task},\mathrm{sender},\mathrm{recipient},\mathrm{seq},
\mathrm{dependsOn},\mathrm{artifactHash},\mathrm{stateVersion},
\mathrm{claims},\mathrm{evidence},\mathrm{uncertainties},\mathrm{status}).
$$
*(Eq. 54.4)*

[DERIVED] Sequence/dependency identifiers describe causal ownership; wall-clock timestamps alone cannot establish causality or freshness across unsynchronized hosts. Claims should identify source locators and the transformation used to derive them. Status distinguishes complete, partial, blocked, failed and unknown work.

[MATHEMATICALLY-DERIVED] Suppose $n_a\ge2$ agents exchange equal-length $\ell_{\rm msg}$-token messages for $r_{\rm rounds}\ge1$ rounds. If every agent re-reads all other agents' previous-round histories, peer-message input tokens are
$$
K_{\rm peer}=n_a(n_a-1)\ell_{\rm msg}
\frac{r_{\rm rounds}(r_{\rm rounds}-1)}2.
$$
*(Eq. 54.5)*

[DERIVED] This counts model input processing under a specified retention rule, not network packet bytes or FLOPs. Keeping only the immediately previous round changes the count to $n_a(n_a-1)\ell_{\rm msg}(r_{\rm rounds}-1)$ but may discard necessary evidence. Prompt caches change achieved work/cost under their own identities; they do not justify erasing the logical context boundary.

[MATHEMATICALLY-DERIVED] With fixed model parameters and no external observations, let transcript $Z=f_\theta(X,U)$, where sampling randomness satisfies $U\perp Y\mid X$. Then the Markov relation $Y-X-(U,Z)$ yields
$$
I(Y;Z\mid X)=0.
$$
*(Eq. 54.6)*

[DERIVED] This is an information-boundary statement, not a claim that reasoning is useless. Computation can make an answer accessible to a bounded decision maker even when it is already determined by the full input. If $X$ is a partial observation and agents acquire new external evidence $O$, then under the corresponding conditional Markov assumptions $I(Y;Z\mid X)\le I(Y;O\mid X)$. A scientifically useful information argument must specify what the observer knows and what new evidence enters.

[DERIVED] For binary correctness, Shannon entropy in bits is $h_2(p)=-p\log_2p-(1-p)\log_2(1-p)$, with zero-log conventions at endpoints, and
$$
0\le I(Y;Z\mid X)\le H(Y\mid X)\le1.
$$
*(Eq. 54.7)*

[DERIVED] Entropy reduction is an expectation over calibrated conditional distributions. A single confidence change or embedding dissimilarity is not this quantity. A more certain wrong answer can reduce subjective uncertainty while worsening correctness.



```figure
{
  "id": "fig-54.6",
  "kind": "calculator",
  "title": "Retained all-to-all history",
  "caption": "Illustrative n-agent R-round transcript with ell tokens per prior response, all-to-all recipients and full retained history. Topology or retention changes invalidate this specific count.",
  "placement": "rail",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-54.5",
  "alt": "Illustrative n-agent R-round transcript with ell tokens per prior response, all-to-all recipients and full retained history. Topology or retention changes invalidate this specific count.",
  "spec": {
    "tex": "T_{\\rm peer}=n(n-1)\\ell R(R-1)/2",
    "equation": "54.5",
    "inputs": [
      {
        "symbol": "agents",
        "label": "Agents",
        "default": 4,
        "min": 2,
        "max": 32,
        "format": "integer"
      },
      {
        "symbol": "rounds",
        "label": "Rounds",
        "default": 4,
        "min": 1,
        "max": 20,
        "format": "integer"
      },
      {
        "symbol": "length",
        "label": "Tokens per prior response",
        "default": 200,
        "min": 1,
        "max": 10000,
        "format": "tokens"
      }
    ],
    "outputs": [
      {
        "symbol": "peer",
        "label": "Cumulative peer-context tokens",
        "formula": "agents*(agents-1)*length*rounds*(rounds-1)/2",
        "format": "tokens"
      }
    ]
  },
  "anchor": "formulation"
}
```

## Mechanism

### Methodology

[DERIVED] Define message purpose and consumers before selecting a topology. A work request contains constraints, input versions, authorized scope, output check and remaining budget. A result contains immutable artifact references, evidence provenance, actual checks, unresolved issues and terminal status. A revision message identifies which previous artifact/claim it supersedes; it does not silently overwrite the historical record.

[DERIVED] Validate structure and bounds at receipt. Authenticate the transport/sender where needed, resolve task/dependency identity and reject stale or unrelated updates. Inspect claims against their sources before using them for consequential decisions. Natural language may explain reasoning, but machine-checkable fields preserve routing, version and status obligations.

[DERIVED] Decide what context to transfer. Full transcripts preserve details but are costly and can propagate irrelevant or hostile content. Summaries save tokens but require retained source/artifact access and uncertainty. Shared artifacts permit selective retrieval; the recipient still needs enough context to interpret them. A narrow extraction can be preferable when the consumer requires one verified field rather than an entire narrative.

[PAPER-REPORTED] AutoGen's historical framework separates conversable agents from conversation programming, with send/receive/reply functions and programmable control/termination; dynamic group chat selects a speaker and broadcasts its response [R54.3, §§2.1–2.2/§3 A5]. These mechanisms make message flow explicit. Natural-language termination markers remain weaker than independent task acceptance.

[DERIVED] Synchronize around dependencies rather than universal rounds when the task permits. A barrier is appropriate when every required input must be current before a merge. An asynchronous consumer needs an explicit snapshot/revision policy and may reject late updates after commitment. Bounded waiting, failure propagation and cancellation must appear in the control state rather than being inferred from conversational silence.

[DERIVED] **Cost.** Count message bytes, copied/retained artifact storage, model input/output tokens, serialization/validation, network waiting and barrier delay separately. Eq. 54.5 can create quadratic round growth even when each round emits only linearly many new messages per agent. An artifact store can reduce repeated transmission without reducing every recipient's inference cost. Evidence checks add tool/network work but can prevent expensive propagation of false claims; the net effect is empirical.

[PAPER-REPORTED] R54.4 measures message density and output similarity and labels low BERTScore assertion similarity as contradiction [R54.4, §4.1]. Dissimilarity does not establish logical opposition: two complementary true claims can have low similarity. A contradiction metric needs an entailment/consistency definition and independent validation.



```figure
{
  "id": "fig-54.7",
  "kind": "diagram",
  "title": "Evidence-preserving communication",
  "caption": "Identity, digest, versions and evidence are checked before atomic receipt-plus-permitted-view publication. Duplicate delivery replays the existing receipt without reapplying the update; stale or invalid messages do not release a dependency.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.5",
  "alt": "A message resolves its versioned artifact and evidence, then enters an atomic unique-sequence receipt/view gate. A new valid view reaches the recipient, duplicates return the recorded receipt, and invalid or stale messages stop.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "state",
        "label": "Message envelope"
      },
      {
        "id": "b",
        "kind": "boundary",
        "label": "Identity, digest and versions"
      },
      {
        "id": "c",
        "kind": "memory",
        "label": "Versioned artifact / evidence"
      },
      {
        "id": "gate",
        "kind": "branch",
        "label": "Atomic unique receipt + permitted view"
      },
      {
        "id": "d",
        "kind": "process",
        "label": "Recipient evidence context"
      },
      {
        "id": "dup",
        "kind": "state",
        "label": "Replay existing receipt"
      },
      {
        "id": "stop",
        "kind": "state",
        "label": "Reject / historical only"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "b"
      },
      {
        "from": "b",
        "to": "c",
        "label": "valid"
      },
      {
        "from": "b",
        "to": "stop",
        "label": "invalid / stale"
      },
      {
        "from": "c",
        "to": "gate"
      },
      {
        "from": "gate",
        "to": "d",
        "label": "new validated publication"
      },
      {
        "from": "gate",
        "to": "dup",
        "label": "duplicate, same digest"
      },
      {
        "from": "gate",
        "to": "stop",
        "label": "conflicting payload / missing evidence"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 54.2 — Bounded evidence-preserving message delivery.** [DERIVED] Inputs are a finite recipient set, message/artifact bounds, registry of task/dependency versions, durable sequence ledger and deadline. Output is accepted data, a typed rejection or missing-evidence status.

$$
\begin{aligned}
1.&\quad \operatorname{ValidateEnvelopeIdentityBounds}(m);
\quad\operatorname{Invalid}\Rightarrow\operatorname{RecordRejectAndStop}.\\
2.&\quad \operatorname{DuplicateSequence}\Rightarrow
\operatorname{DigestMatches}\Rightarrow\operatorname{ReplayReceiptWithoutReapplyingAndStop};\quad \operatorname{DigestMismatch}\Rightarrow\operatorname{RejectConflictAndStop};\\
 &\quad \operatorname{UnknownTaskOrDependency}\Rightarrow
\operatorname{Return}(\mathrm{missing/invalid\ dependency}).\\
3.&\quad a\leftarrow\operatorname{BoundedFetchAndHashCheck}(m.\mathrm{artifactHash});
\quad\operatorname{MissingOrMismatch}\Rightarrow\operatorname{RejectAndStop}.\\
4.&\quad \operatorname{StaleForConsumerSnapshot}(m)\Rightarrow
\operatorname{RetainAsHistoricalOrReject};\,\operatorname{Stop}.\\
5.&\quad \operatorname{ValidateClaimsEvidenceAndUncertainty};
\quad\operatorname{UnsupportedClaim}\Rightarrow\operatorname{MarkUnverified};\\
 &\quad \operatorname{UniqueInsertReceiptAndView}(\mathrm{task,sender,seq,digest}).\\
6.&\quad \operatorname{RequiredInputsValidated}\Rightarrow\operatorname{ReleaseConsumer};
\quad\operatorname{DeadlineReached}\Rightarrow\operatorname{Return}(\mathrm{partial/blocked}).
\end{aligned}
$$

[DERIVED] The receipt write atomically enforces uniqueness of (task, sender, sequence) and binds the payload digest; a losing concurrent duplicate replays only a matching receipt, while changed payloads conflict. Invariants are no unsupported claim promoted to evidence, no duplicate update applied twice and no stale artifact substituted silently. Structure validation does not certify semantic content. Consumer release requires its actual acceptance predicate; unverified material can remain visible as such but cannot satisfy a verified dependency. Fetch/reference recursion and total waiting are bounded.

## Implementation

[DERIVED] Store raw message, normalized fields and derived consumer view with a provenance link. Content-addressed artifacts need retention/deletion and access-control semantics. A cached artifact from another task or tenant may be byte-identical but unauthorized to reveal. Transfer the minimum sufficient evidence under the task's scope.

[OFFICIAL-DOCUMENTATION] Pinned LangGraph StateGraph source represents node outputs as partial state updates and permits per-key binary reducers [R54.14, StateGraph/_get_channel/_is_field_binop]. Static signature checking does not verify associativity, commutativity or semantic safety. Those are application properties, developed in §54.3.

## Experimental design

### Reported experiments

[PAPER-REPORTED] MetaGPT's SoftwareDev comparison reports more token use with its workflow than ChatDev, while executable feedback changes executability/revision outcomes [R54.2, Table 1/§4.4]. This illustrates a quality/resource tradeoff; tokens per code line is not accepted-task efficiency and the selected tasks limit generalization.

[PAPER-REPORTED] R54.4 Appendix E.5 applies a half-log variance ratio to binary task success using ten sampled traces and predicted success probabilities. That Gaussian-style expression is not Bernoulli mutual information [R54.4, Appendix E.5/Eqs. 2–3]. With prior $p=0.5$ and posterior $p=0.999$, a base-two version is about 3.98 bits, exceeding Eq. 54.7's one-bit ceiling. The variance of predicted probabilities also differs from the Bernoulli outcome variance $\bar p(1-\bar p)$. The source proxy may be reported as a proxy; it cannot support an information-theoretic causal claim.

## Observations

**What the paper claims.** [PAPER-REPORTED] Structured artifacts and conversation interfaces organize communication; R54.4 proposes uncertainty/similarity proxies [R54.2–R54.4].

**What the evidence shows.** [PAPER-REPORTED] Sources disclose particular routing, retention and evaluation procedures; their proxies do not directly measure semantic contradiction or Bernoulli information.

**What we infer.** [DERIVED] Communication value depends on validated evidence reaching the right consumer, not on message count, consensus or confidence alone.

**What remains unknown.** [UNVERIFIED] No local communication policy, provenance checker or context-transfer experiment was executed.



```figure
{
  "id": "fig-54.8",
  "kind": "stat-panel",
  "title": "Scientific boundaries to retain",
  "caption": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "placement": "rail",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-54.5",
  "alt": "These conditional distinctions are analytical and methodological boundaries, not measured deployment outcomes.",
  "spec": {
    "header": "CLAIM BOUNDARY",
    "rows": [
      {
        "key": "schema",
        "value": "Structure and finite size"
      },
      {
        "key": "evidence",
        "value": "Original source and transform"
      },
      {
        "key": "duplicate",
        "value": "Atomic key plus payload digest"
      },
      {
        "key": "authority",
        "value": "Message grants no new authority"
      }
    ]
  },
  "anchor": "observations"
}
```

## Failure modes

[DERIVED] Summary laundering drops uncertainty/source qualifiers; retain locators and checks. Echo amplification counts one fact many times; track shared provenance. Stale context produces invalid downstream actions; bind versions. Barrier deadlock waits for a failed dependency; propagate terminal failures. Unlimited history crowds out task evidence; cap retention with explicit omissions. Injection crosses agent messages as well as tool results; apply Chapter 51's trust boundary. False information metrics convert confidence into supposed evidence; use calibrated task outcomes and valid estimands.

## Siblings

[DERIVED] Broadcast, point-to-point, publish/subscribe and artifact retrieval differ in recipient coverage and repeated context. Compare them under equal task evidence and retention, not only message count. Full-history versus recent-round context changes both cost and available information. Chapter 53 owns persistent memory/deletion; §54.5 owns global resource scheduling.

## Extensions

### Improvements

[DERIVED] Schema/version/provenance fields and selective artifact access strengthen the communication contract. Executable evidence checks can replace unsupported agreement signals. The improvement is mechanistic and conditional; no universal performance gain is asserted. Open research concerns measuring the marginal task value of a message under bounded computation and partial observation without confusing it with Shannon information conditioned on a complete input.

## Limitations

[DERIVED] Eq. 54.5 assumes equal message lengths and a particular retention rule. Eq. 54.6 assumes fixed models and no external evidence; it does not apply unchanged to learning or new observations. Hashes certify identity, not truth. The information-boundary critique also applies to R54.5's usable-evidence definition unless a partial-observation or bounded-observer interpretation is supplied [R54.5, §3.2].

## Reproducibility

[UNVERIFIED] Preserve message schemas, task/dependency versions, artifact hashes, source locators, retention policy, actual prompt tokens, synchronization events and validation outcomes. Proposed communication ablations are in verification.md. No original message/task experiment occurred.

## References

[PAPER-REPORTED] [R54.2](references.md#r54-2), [R54.3](references.md#r54-3), [R54.4](references.md#r54-4), [R54.5](references.md#r54-5) communication and theoretical boundaries. [OFFICIAL-DOCUMENTATION] [R54.14](references.md#r54-14) pinned state update source. Access 2026-10-14.
