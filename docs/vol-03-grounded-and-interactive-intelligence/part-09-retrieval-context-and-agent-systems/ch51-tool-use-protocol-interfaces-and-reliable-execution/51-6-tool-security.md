---
id: ms.section.51.6
entity_type: section
title: "Tool security"
volume: 3
part: 9
chapter: 51
section: 51.6
slug: 51-6-tool-security
parent: ms.chapter.51
prev_sibling: ms.section.51.5
next_sibling: ms.verification.51
children: []
prerequisites: [ms.chapter.10, ms.chapter.11, ms.chapter.37, ms.chapter.46, ms.chapter.47, ms.chapter.50]
downstream: [ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.65]
related: []
relations: []
axes: {lifecycle: [inference, evaluation], mechanism: [tool_use, typed_interfaces, authorization], feedback_setting: [], modality: [text]}
papers: [P43]
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [MATHEMATICALLY-DERIVED, DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-14
editorial_status: manuscript_draft
---

# 51.6 Tool security

## Scope

[DERIVED] Tool security examines adversarial content crossing from external observations into action selection and privileged execution. It includes prompt injection, credential handling, least privilege, confused-deputy behavior and sandbox escape surfaces. The baseline trusts a typed tool result or uses one text classifier as the entire security boundary. Success means preserving authorized task utility while preventing effects outside the declared authority and threat model.

[DERIVED] Chapter 65 owns the broader security/privacy/safety framework. This section owns the tool boundary: what attackers control, what the model can observe, which component may exercise credentials, and which enforcement remains independent of generated text. A finite benchmark does not prove security.

## Why this exists

[DERIVED] A correctly authenticated server can return attacker-controlled material from an email, document, product name or calendar description. Authentication identifies the responding service; it does not make every byte a trusted instruction. JSON Schema can validate that the email body is a string while the string asks the model to reveal a secret or invoke another tool.

[DERIVED] Tool use makes this a consequential control problem. An injected instruction can alter future arguments, select a privileged operation or redirect a result to an attacker. Even if a model resists explicit “ignore previous instructions” language, an adversary can frame an action as an apparently necessary prerequisite to the legitimate task. Security therefore depends on authority and information flow, not only recognition of suspicious phrases.

[OFFICIAL-DOCUMENTATION] MCP security guidance distinguishes token passthrough, confused deputies, state-handle hijacking, SSRF and local-server compromise [R51.20, corresponding sections]. These are different attack surfaces with different enforcement points; a prompt-injection detector does not solve URL fetching, process privileges or token audience validation.

## Intuition

[DERIVED] Separate knowledge from authority. An external result may provide facts used to answer the user; it cannot expand the caller's permissions, redefine the task or authorize an unrelated mutation. A model may propose an action based on that result, but an independent gate checks the actual operation, target and authorized scope.

[DERIVED] Defense needs two measured properties. Blocking dangerous actions is insufficient if the system blocks ordinary tasks. Preserving benign utility is insufficient if an attacker can exploit a rare high-impact path. Report both legitimate task success and unauthorized effect incidence under a declared attack set, with detector metrics treated as intermediate measurements.

## Formulation

[DERIVED] Let trusted instruction/authority state be $H$, untrusted tool data be $U$, proposed action be $a=\pi_\theta(H,U)$ and independent policy gate be $G(p,a,H)$. A required enforcement invariant is
$$
\operatorname{Execute}(a)\Rightarrow G(p,a,H)=1,
\qquad U\text{ cannot redefine }G\text{ or mint authority}.
$$
*(Eq. 51.14)*

[DERIVED] This does not prove the gate's semantic completeness. A permitted operation can still harm the task through wrong but in-scope arguments; an overly broad gate may authorize too much. The invariant assigns responsibility and exposes the trusted computing boundary instead of claiming natural language is safely separated by a delimiter.

[MATHEMATICALLY-DERIVED] For a detector with true-positive rate $q_{\rm det}$, false-positive rate $\alpha$ and injection prevalence $\rho$, positive predictive value is
$$
\Pr(\mathrm{injected}\mid\mathrm{flag})=
\frac{\rho q_{\rm det}}{\rho q_{\rm det}+(1-\rho)\alpha},
\quad \rho q_{\rm det}+(1-\rho)\alpha>0.
$$
*(Eq. 51.15)*

[DERIVED] At low prevalence, even a modest false-positive rate can dominate flagged outputs. A score threshold selected on a benchmark with balanced classes does not automatically optimize deployment utility. Prevalence is conditional on the actual tool/source/workload and cannot be assumed from attack-suite proportions.

[MATHEMATICALLY-DERIVED] If a task consumes $m$ benign outputs with flag events $F_j$ and marginal probabilities $\alpha_j$, then
$$
\Pr\!\left(\bigcup_{j=1}^{m}F_j\right)\le
\min\!\left(1,\sum_{j=1}^{m}\alpha_j\right).
\qquad
\text{If independent and }\alpha_j=\alpha,\quad
p_{\rm block}=1-(1-\alpha)^m.
$$
*(Eq. 51.16)*

[DERIVED] These are probability identities/bounds for a policy that blocks the task after any flag, not a theorem about all agent defenses. Correlation changes the independent expression; allowing safe recovery changes the task outcome. Per-output detector accuracy is therefore insufficient to infer end-to-end useful service.



```figure
{
  "id": "fig-51.18",
  "kind": "calculator",
  "title": "Benign-task blocking sensitivity",
  "caption": "Independent equal-FPR illustration for stop-on-first-flag policy. Correlated flags and recovery change this expression.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-51.16",
  "alt": "Independent equal-FPR illustration for stop-on-first-flag policy. Correlated flags and recovery change this expression.",
  "spec": {
    "tex": "p_{\\rm block}=1-(1-\\alpha)^m",
    "equation": "51.16",
    "inputs": [
      {
        "symbol": "fpr",
        "label": "Independent per-output false flag",
        "default": 0.01,
        "min": 0,
        "max": 1,
        "format": "percent"
      },
      {
        "symbol": "outputs",
        "label": "Benign outputs in task",
        "default": 20,
        "min": 1,
        "max": 200,
        "format": "integer",
        "step": 1
      }
    ],
    "outputs": [
      {
        "symbol": "result",
        "label": "Task blocked probability",
        "formula": "1-(1-fpr)^outputs",
        "format": "percent"
      }
    ]
  }
}
```

## Mechanism

### Methodology

[DERIVED] Specify attacker control before evaluating a defense. Distinguish a compromised server from a trusted server retrieving hostile content, and a mutable result field from a forged protocol envelope. Identify the attacker goal, allowed injection points, knowledge and query budget. Identify secrets, authority-bearing credentials and irreversible effects. Without this scope, an “attack success rate” has no stable interpretation.

[DERIVED] Enforce credentials and tool permissions outside the model. The executor obtains verified identity from the transport or trusted environment, checks object ownership and limits targets/operations. Secrets need not enter model context to authenticate a request. Returned URLs, resource handles and requested input remain untrusted values: validate destinations, schemes, ownership and scope before following or exercising them.

[OFFICIAL-DOCUMENTATION] Modern MCP authorization requires audience-bound tokens and prohibits accepting/transiting tokens issued for other resources [R51.15, Token Handling]. Security guidance requires authorization checks on explicit state handles and describes per-client consent at a proxy [R51.20, State Handle Hijacking/Confused Deputy]. These checks prevent particular authority-confusion paths independently of a model's textual judgment.

[DERIVED] At the observation boundary, preserve source and field provenance and minimize irrelevant content. Structured extraction can reduce the amount of hostile text reaching a planner, but a field name does not make its content safe. Redaction can remove necessary task facts; summarization can preserve an attack instruction or invent a new one. Any transformation needs utility and attack evaluation rather than an assumed cleansing property.

[DERIVED] A detector can screen data as one layer. Fix its input formatting, truncation/segmentation and threshold before held-out evaluation. Evaluate complete tasks under the actual stop/recovery policy; log false blocks and missed injections separately from unauthorized executed outcomes. A detector's “injection” label is not proof that a dangerous action occurred, while an undetected instruction is not proof that the executor permits it.

[DERIVED] At the execution boundary, sandbox and resource isolation limit blast radius. File permissions, network egress, process launch policy, credential scopes and resource quotas operate at different layers. A container with mounted host secrets and unrestricted credentials can still expose the host's effective authority. Prompt restrictions cannot substitute for operating-system enforcement or secure parser/runtime implementation.

[DERIVED] **Cost.** Screening every output adds model/classifier work proportional to the actual segmented token input, plus buffering latency and memory. If a detector has limit $\ell$ tokens and outputs total $n$ tokens, a simple nonoverlapping segmentation requires $\lceil n/\ell\rceil$ evaluations; overlap adds more. Authorization checks, provenance stores and sandbox startup add their own costs. Measure accepted-task utility and latency with these defenses enabled, including blocked tasks and recovery.



```figure
{
  "id": "fig-51.19",
  "kind": "diagram",
  "title": "Result trust boundary",
  "caption": "External data informs proposals but does not modify the independent authority gate.",
  "placement": "inline",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.16",
  "alt": "External data informs proposals but does not modify the independent authority gate.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "dataset",
        "label": "Untrusted result"
      },
      {
        "id": "p",
        "kind": "process",
        "label": "Validate and tag source"
      },
      {
        "id": "g",
        "kind": "process",
        "label": "Bounded extraction/filter"
      },
      {
        "id": "e",
        "kind": "model",
        "label": "Action proposal"
      },
      {
        "id": "o",
        "kind": "boundary",
        "label": "Independent policy gate"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "p"
      },
      {
        "from": "p",
        "to": "g"
      },
      {
        "from": "g",
        "to": "e"
      },
      {
        "from": "e",
        "to": "o"
      }
    ]
  }
}
```

## Algorithm

> **Algorithm 51.6 — Bounded untrusted-result processing and action gate.** [DERIVED] Inputs are raw tool bytes, their authenticated source if any, task/authority state $H$, verified principal, parser/content bounds, optional fixed detector and deadline. Output is a validated data observation, blocked/unavailable observation or authorized action proposal; execution uses §51.4.

$$
\begin{aligned}
1.&\quad \operatorname{OversizeOrMalformed}\Rightarrow
\operatorname{RecordAndReturn}(\mathrm{invalid\ observation});\\
 &\quad U\leftarrow\operatorname{ParseValidateAndTagProvenance}(\mathrm{bytes}).\\
2.&\quad \operatorname{UnexpectedCredentialOrSensitiveLeak}\Rightarrow
\operatorname{QuarantineAndReturn}(\mathrm{incident});\\
 &\quad U'\leftarrow\operatorname{PolicyBoundedExtraction}(U).\\
3.&\quad \operatorname{DetectorConfigured}\land
\operatorname{Flag}_{\eta}(U',H)\Rightarrow
\operatorname{ApplyDeclaredBlockOrRecovery};\,\operatorname{Return}.\\
4.&\quad (a,\pi)\leftarrow\operatorname{BoundedProposal}(H,U');
\quad \operatorname{NoAction}\Rightarrow\operatorname{Return}(\mathrm{data\ only}).\\
5.&\quad \neg G(p,a,H)\Rightarrow
\operatorname{RecordDenied};\,\operatorname{Return}(\mathrm{unauthorized});\\
 &\quad \operatorname{UngroundedOrInvalid}(a)\Rightarrow
\operatorname{Return}(\mathrm{needs\ evidence/invalid}).\\
6.&\quad \operatorname{Return}(\mathrm{authorized\ proposal},a,\pi,\mathrm{executor\ still\ required}).
\end{aligned}
$$

[DERIVED] Invariants are no authority sourced from $U$, no credential disclosure to the model, no unbounded recursive fetch or parsing, and no execute-on-detector-pass shortcut. Detector timeout is an explicit unavailable/block decision under policy, not a benign classification. A finite content/token/deadline budget bounds every path; recovery has its own cap.

## Implementation

[OFFICIAL-DOCUMENTATION] The HTTP binding requires validation of a present Origin header and rejects invalid origins with 403; it also distinguishes request metadata from application arguments [R51.14, Security & Endpoint/Request Metadata]. stdio subprocesses inherit an environment and host privilege boundary; environment-derived credentials require least-privilege provisioning [R51.15, Scope; R51.20, Local MCP Server Compromise].

[DERIVED] The model-facing adapter should never echo raw access tokens, authorization headers or private credential-store entries as ordinary tool observations. Error reporting needs enough information to diagnose permission failures without disclosing token contents. Restrict retrieval and audit access as well as final execution: unauthorized reads can leak information even if no mutation follows.

[DERIVED] Treat input_required payloads as requests for client-mediated work, subject to the same policy as direct operations. Sampling or elicitation labels do not certify a trusted prompt, safe requested field or authorized URL. Enforce allowlists/bounds where the application has a narrow domain, and preserve explicit unknowns when it does not.

## Experimental design

### Reported experiments

[PAPER-REPORTED] InjecAgent inserts hostile instructions into assumed tool responses and evaluates subsequent direct-harm or two-step data-stealing behavior; extraction responses are simulated in the latter case [R51.21, §§2.2–2.3]. Its 1,054-case base/enhanced settings test a particular interception point, not complete live tool planning.

[PAPER-REPORTED] AgentDojo executes a dynamic tool environment and separately reports benign utility, utility under attack and targeted attacker success [R51.22, §§3–4]. Its historical evaluation uses 97 tasks and 629 security cases. This improves action/outcome visibility relative to a single injected continuation while remaining a simplified benchmark.

[PAPER-REPORTED] The October 2026 detector study replays ground-truth calls without an agent model, labels modified tool outputs by differential replay, and evaluates fifteen detectors plus diagnostic task-aware judges [R51.23, §§3–4]. AD-Clean contains 339 outputs from 97 tasks; a separate τ-bench replay supplies 1,533 benign outputs. The reported 1%-FPR threshold is selected on the same benign set used for evaluation, favoring detectors relative to prospective calibration [R51.23, §4.3].

[PAPER-REPORTED] Its result is a transfer warning: the BIPIA-leading detector detects 2.1% of AgentDojo injections at 1% FPR, and another reported cross-benchmark comparison drops from 72.2% to 15.2% [R51.23, §5.2/Table 2]. These are detector classifications on static replayed inputs, not full-agent attack success or guaranteed adaptive-attack bounds.

## Observations

**What the paper claims.** [PAPER-REPORTED] Existing agent/tool data can carry injection, and detector benchmark rankings need not transfer to agent outputs [R51.21–R51.23].

**What the evidence shows.** [PAPER-REPORTED] The inspected protocols differ materially: assumed continuations, dynamic environment execution and static differential replay measure different objects. The 2026 study also finds false blocks and audits disclosed training overlap.

**What we infer.** [DERIVED] Security evaluation must preserve the actual tool format, authority boundary, attack budget and legitimate task population; classifier scores alone cannot establish secure useful execution.

**What remains unknown.** [NOT-DISCLOSED] No inspected result certifies resistance to all adaptive attacks, sandbox escape or secret leakage in an arbitrary production deployment.



```figure
{
  "id": "fig-51.20",
  "kind": "stat-panel",
  "title": "Contract boundary to retain",
  "caption": "These distinctions constrain claims; they are not measured deployment results.",
  "placement": "rail",
  "anchor": "observations",
  "evidence": "DERIVED",
  "source": "DERIVED:eq-51.16",
  "alt": "Four relevant execution boundaries remain explicit.",
  "spec": {
    "header": "EXECUTION CONTRACT",
    "rows": [
      {
        "key": "source",
        "value": "Data provenance is not authority"
      },
      {
        "key": "secrets",
        "value": "Kept outside model observations"
      },
      {
        "key": "utility",
        "value": "False blocks count at task level"
      },
      {
        "key": "security",
        "value": "Verify actual unauthorized effects"
      }
    ]
  }
}
```

## Failure modes

[DERIVED] Prompt injection promotes external content into authority; detect unauthorized proposed effects and enforce the independent gate. Confused deputy uses a privileged intermediary outside user scope; bind principal/client/resource authority. Token passthrough crosses audiences; validate intended resource and obtain separate downstream credentials. Handle hijacking exploits missing ownership checks; authorize each handle use. SSRF redirects metadata/resource fetches to unintended networks; enforce destination policy at fetch time. Sandbox escape or overbroad mounts bypass model restrictions; constrain and verify the host execution boundary.

[DERIVED] Overblocking also fails the task: a benign confirmation string can trigger a detector and prevent completion. Threshold tuning on the test set, truncating attacks out of view and reporting only easy static attacks can overstate usefulness. Training-overlap audits based on literal strings are lower bounds on contamination, not proof of independent generalization.

## Siblings

[DERIVED] Model instruction-hierarchy training, observation filtering, action-policy gates and sandboxing address different failure surfaces. None universally dominates. Compare defenses with held-out legitimate tasks and attacks under equal executor authority and total budget. Chapter 50 owns context provenance; Chapter 65 owns wider threat models, privacy and safety evaluation.

## Extensions

### Improvements

[DERIVED] AgentDojo's dynamic outcomes and the 2026 detector study's real tool-output replay improve evaluation specificity over prompt-only labels. The changed mechanisms are action-state checks, task-level false-block accounting and distribution/overlap audits. They do not establish a universally effective defense.

[DERIVED] Open questions include calibrating low-FPR operation under changing tool formats, measuring adaptive attacks with bounded budgets and making authority policies expressive enough for useful tasks without depending on model obedience. Settling evidence requires prospective threshold selection, task outcomes and verified enforcement, including benign degradation.

## Limitations

[DERIVED] Eq. 51.14 assumes a trusted correctly implemented gate; its adequacy is itself a review obligation. Eq. 51.16's independent form is conditional. Replay changes can label injected data without proving the instruction would affect an agent. Simulators and static attack suites cannot establish open-world robustness. The inspected τ²-bench Table 2 reports three critical telecom simulator errors in fifty conversations, despite caption wording suggesting none; use the rows, not the optimistic caption [R51.8, §4.3/Table 2].

## Reproducibility

[UNVERIFIED] Required artifacts are attacker control/budgets, clean/injected traces, detector revisions/templates/thresholds, task/operation outcomes, credential scope, isolation configuration and secret-redacted audit records. No attack, detector, sandbox or live credential flow was executed. Proposed tests are confined to verification.md.

## References

[OFFICIAL-DOCUMENTATION] [R51.14](references.md#r51-14), [R51.15](references.md#r51-15), [R51.20](references.md#r51-20) protocol security boundaries. [PAPER-REPORTED] [R51.21](references.md#r51-21) InjecAgent; [R51.22](references.md#r51-22) AgentDojo; [R51.23](references.md#r51-23) October 2026 detector study; [R51.8](references.md#r51-8) simulator limits. Access 2026-10-14.
