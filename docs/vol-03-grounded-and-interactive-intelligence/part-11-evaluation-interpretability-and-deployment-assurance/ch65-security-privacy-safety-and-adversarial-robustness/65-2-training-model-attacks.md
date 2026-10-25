---
id: ms.section.65.2
entity_type: section
title: "Training/model attacks"
volume: 3
part: 11
chapter: 65
section: 65.2
slug: 65-2-training-model-attacks
parent: ms.chapter.65
prev_sibling: ms.section.65.1
next_sibling: ms.section.65.3
children: []
prerequisites: [ms.chapter.7, ms.chapter.8, ms.chapter.24, ms.chapter.32, ms.chapter.33, ms.chapter.34, ms.chapter.35, ms.chapter.36, ms.chapter.46, ms.chapter.47, ms.chapter.51, ms.chapter.52, ms.chapter.53, ms.chapter.54, ms.chapter.55, ms.chapter.56, ms.chapter.57, ms.chapter.58, ms.chapter.59, ms.chapter.60, ms.chapter.61, ms.chapter.62, ms.chapter.63, ms.chapter.64]
downstream: [ms.chapter.66]
related: [ms.chapter.30, ms.chapter.42, ms.chapter.48]
relations: []
axes: {lifecycle: [pretraining, post_training, inference, evaluation, assurance], mechanism: [security_boundary, privacy_accounting, adversarial_evaluation], feedback_setting: [], modality: [text, code, image, tool_trajectory]}
papers: []
implementations: [impl.pytorch]
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, MATHEMATICALLY-DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, ASSUMED, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: 2100
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# 65.2 - Training and model attacks

## Scope

[DERIVED] Poisoning changes training inputs or labels; a backdoor creates conditional behavior; extraction recovers information or functionality; membership inference estimates whether a specified example participated in training. Malicious artifacts can execute code or carry adversarial learned behavior. These mechanisms overlap but have different access requirements and observables.

## Why this exists

[DERIVED] A high membership AUC is not a demonstration that unknown text can be recovered. Refusal to reproduce a document is not proof that its information was removed. A checkpoint that loads safely can still implement a malicious conditional policy. The appropriate mitigation depends on the attacked layer, rather than on a shared label such as privacy attack.

## Intuition

[DERIVED] Three questions separate the claims: what could the attacker modify, what did the attacker already know, and what additional information or action did the experiment establish? Known-candidate membership tests and unknown-content recovery answer different questions even when both exploit memorization.

## Formulation

[MATHEMATICALLY-DERIVED] A conceptual poisoning problem is

$$
 \max_{P:\,|P|\le m}\; J_{attack}(\theta^*(D\cup P)),\qquad
 \theta^*(D\cup P)\in\arg\min_\theta L_{train}(\theta;D\cup P),\quad
 U_{clean}(\theta^*)\ge u_0.
$$
*(Eq. 65.5)*

[DERIVED] P is attacker-modified data under an explicit admissible set; m counts examples, not necessarily tokens, users or influence. The utility constraint captures stealth only on the specified clean workload. Nonconvex training may return one stochastic optimizer trajectory rather than a unique minimizer. This formulation describes an integrity failure for defensive analysis; it is not an executable attack recipe.

[MATHEMATICALLY-DERIVED] For a pure epsilon-DP mechanism and a binary neighboring-dataset hypothesis with prior membership probability pi,

$$
 \Pr[M=1\mid Y=y]\le
 \frac{e^\epsilon\pi}{1-\pi+e^\epsilon\pi}.
$$
*(Eq. 65.6)*

[DERIVED] This is a likelihood-ratio/Bayes consequence for almost every output with a defined posterior, when the two hypotheses are adjacent and delta=0. A population membership experiment with unmatched distributions need not equal that binary neighboring comparison. Approximate DP with delta>0 does not provide this pointwise bound for every output; rare exceptional events require the appropriate approximate-DP analysis. Large epsilon can make the bound weak even when formally valid.

```figure
{
  "id": "fig-65.6",
  "kind": "calculator",
  "title": "Pure-DP posterior bound depends on the prior",
  "caption": "Eq.65.6 is specialized to delta=0 and a binary neighboring-dataset hypothesis. It is not a bound for arbitrary population classifiers.",
  "placement": "rail",
  "anchor": "formulation",
  "evidence": "MATHEMATICALLY-DERIVED",
  "source": "DERIVED:eq-65.6",
  "alt": "Eq.65.6 is specialized to delta=0 and a binary neighboring-dataset hypothesis. It is not a bound for arbitrary population classifiers.",
  "spec": {
    "equation": "65.6",
    "tex": "q\\le e^\\epsilon\\pi/(1-\\pi+e^\\epsilon\\pi)",
    "inputs": [
      {
        "symbol": "eps",
        "label": "Pure privacy epsilon",
        "default": 1,
        "min": 0,
        "max": 10,
        "format": "raw"
      },
      {
        "symbol": "pi",
        "label": "Prior membership probability",
        "default": 0.01,
        "min": 1e-05,
        "max": 0.99,
        "format": "percent"
      }
    ],
    "outputs": [
      {
        "symbol": "q",
        "label": "Upper posterior bound",
        "formula": "exp(eps)*pi/(1-pi+exp(eps)*pi)",
        "format": "percent"
      }
    ]
  }
}
```

[MATHEMATICALLY-DERIVED] Let W be book word positions and S_r positions matched by qualifying spans from generation r, after declared prompt-overlap removal. Aggregate coverage and largest single-generation coverage are

$$
 C_R=\frac{|\bigcup_{r=1}^R S_r|}{|W|},\qquad C_{single}=\max_r\frac{|S_r|}{|W|},\qquad C_{single}\le C_R.
$$
*(Eq. 65.7)*

[DERIVED] Aggregate coverage does not imply a contiguous passage, a single output containing the coverage, or the same result under a smaller sampling budget. The minimum span length changes chance matches. Report span-length distributions, exact matching rules, prompt overlap and unrelated-text controls.

[MATHEMATICALLY-DERIVED] For a fixed membership-score threshold tau,

$$
 TPR(\tau)=\Pr[s(x)\ge\tau\mid M=1],\qquad
 FPR(\tau)=\Pr[s(x)\ge\tau\mid M=0].
$$
*(Eq. 65.8)*

[DERIVED] ROC AUC integrates ranking behavior across thresholds. Operational privacy evidence often needs TPR at a small FPR and the candidate population's prior, not AUC alone. Calibration and attack selection must use separate data from final testing; a search over many attacks can overfit its development members/nonmembers.

## Mechanism

### Methodology

[PAPER-REPORTED] AutoMIA evolves membership-score programs using explorer/exploiter agents, with100 designs per setting, five-minute execution timeout and bounded repair. Its black-box text attacks use known candidate prefixes/suffixes, not unknown-text recovery. Table 1 reports Pythia1.4B Arxiv AUC.730 and TPR.080 at1%FPR; transfer fails on GitHub in the discussed comparison. Train-selected attacks receive held-out evaluation. These results support target-specific signal discovery, not universal high-confidence membership decisions. [R65.3, Sections 3-4; Table 1; Appendix B.2]

[PAPER-REPORTED] Alignment Whack-a-Mole evaluates81selected books and100 completions per excerpt. Its bmc@5 aggregates covered book positions across qualifying spans and generations. In the cross-author conditions, most covered positions lie in5-9 word spans; the unrelated-generation coverage floor is nonzero. Fine-tuning increases extractability in these selected models/books, with public-domain and synthetic controls. This does not establish a whole book emitted in one sample, exhaustive training-corpus reconstruction, or a legal conclusion. [R65.4, Section 3; Table 1; Appendices A.4,B.2,B.6]

```figure
{
  "id": "fig-65.7",
  "kind": "compare",
  "title": "Distinct training and information failures",
  "caption": "Access assumptions and evidence must remain attached to the claim.",
  "placement": "inline",
  "anchor": "mechanism",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.7",
  "alt": "Access assumptions and evidence must remain attached to the claim.",
  "spec": {
    "axis": "Decision-relevant difference",
    "columns": [
      {
        "id": "access",
        "label": "Access"
      },
      {
        "id": "event",
        "label": "Observable event"
      },
      {
        "id": "limit",
        "label": "Does not establish"
      }
    ],
    "rows": [
      {
        "dimension": "Poison/backdoor",
        "values": {
          "access": "Writable training examples or weights",
          "event": "Conditional held-out behavior with clean utility",
          "limit": "Vulnerability without that access"
        }
      },
      {
        "dimension": "Membership",
        "values": {
          "access": "Specified candidate plus model interface",
          "event": "TPR/FPR on matched held-out data",
          "limit": "Recovery of unknown content"
        }
      },
      {
        "dimension": "Extraction",
        "values": {
          "access": "Declared query/adaptation budget",
          "event": "Previously unknown matched information",
          "limit": "Complete corpus or all retained information"
        }
      },
      {
        "dimension": "Malicious artifact",
        "values": {
          "access": "Loader/dependency/checkpoint path",
          "event": "Code execution or adversarial behavior",
          "limit": "Safety merely from a valid signature"
        }
      }
    ]
  }
}
```

## Algorithm

### Algorithm 65.2 — Audit a model artifact and a privacy claim

[DERIVED] Inputs: authorized local artifacts, synthetic canaries and a frozen candidate-data split. Outputs: integrity evidence and distinct membership/extraction results.

1. Hash and inventory weights, adapters, tokenizer, loader, dependency lockfiles and any executable hooks; isolate loading with minimal filesystem/network privileges.
2. Declare whether the hypothesis concerns record membership, user membership, recoverable unknown content, or conditional behavior; define the privacy unit.
3. Partition attack development, threshold calibration and final held-out evaluation by the appropriate record/user/source groups.
4. Keep matched nonmembers and negative controls, including public/synthetic text and unavailable-access conditions. Record what the attacker already knows.
5. Evaluate fixed query/compute budgets and independent random seeds; inspect utility and trigger-specific failures separately. Preserve unknown and timeout outcomes.
6. Report TPR/FPR/prior-sensitive precision, exact-span controls or actual artifact effects as appropriate; do not relabel one observable as another.

[DERIVED] A naive exact span search over R outputs and reference text can be expensive; suffix indexes or hashed n-grams reduce matching cost but require collision/normalization checks. Attack search cost includes failed designs, repairs, model calls and final selection. Loading an artifact is not required to audit its static provenance and should never confer unrestricted privileges.

## Implementation

[DERIVED] Treat weights, adapters and tokenizer/template changes as a combined artifact. A malicious adapter can alter tool selection without arbitrary loader code. Conversely, an executable package can compromise infrastructure without relying on a learned backdoor. Verify format and origin, then test the behavior needed for the deployment.

[DERIVED] Membership datasets must avoid trivial age/source/style differences between members and nonmembers. A timestamp classifier can look like a membership attack while measuring distribution shift. Split by source/user when correlated examples would leak across development and test sets. Private reference texts and generated matches need access-controlled retention; the diagnostic itself can create a new disclosure path.

```figure
{
  "id": "fig-65.8",
  "kind": "diagram",
  "title": "Artifact authenticity and learned behavior are separate",
  "caption": "Both branches require evidence. Signing an artifact does not validate its learned policy; safe loading does not validate downstream authority.",
  "placement": "inline",
  "anchor": "implementation",
  "evidence": "DERIVED",
  "source": "DERIVED:fig-65.8",
  "alt": "Both branches require evidence. Signing an artifact does not validate its learned policy; safe loading does not validate downstream authority.",
  "spec": {
    "direction": "LR",
    "nodes": [
      {
        "id": "a",
        "kind": "node",
        "label": "Pinned artifact identity"
      },
      {
        "id": "l",
        "kind": "boundary",
        "label": "Isolated loader/dependencies"
      },
      {
        "id": "b",
        "kind": "model",
        "label": "Behavioral evaluation"
      },
      {
        "id": "i",
        "kind": "metric",
        "label": "Integrity evidence"
      },
      {
        "id": "p",
        "kind": "metric",
        "label": "Privacy/behavior evidence"
      }
    ],
    "edges": [
      {
        "from": "a",
        "to": "l",
        "kind": "flow",
        "label": "inspect/validate"
      },
      {
        "from": "a",
        "to": "b",
        "kind": "flow",
        "label": "evaluate bounded behavior"
      },
      {
        "from": "l",
        "to": "i",
        "kind": "flow",
        "label": "code boundary"
      },
      {
        "from": "b",
        "to": "p",
        "kind": "flow",
        "label": "held-out claims"
      }
    ]
  }
}
```

## Experimental design

### Reported experiments

[DERIVED] The current cases use different access models: poisoned safeguard training, automated known-candidate membership scoring and model fine-tuning for extractability. Their headline metrics cannot form a single leaderboard. Experiment 65.2 proposes separate local synthetic tests with a common access/budget ledger and a clean-utility gate.

## Observations

**What the paper claims.** [PAPER-REPORTED] AutoMIA finds stronger membership signals in its tested settings; fine-tuning can expose previously hard-to-extract memorized spans [R65.3,R65.4].

**What the evidence shows.** [DERIVED] The attack knowledge, selected targets, low-FPR results, generation budget and matching rules bound each finding.

**What we infer.** [DERIVED] Refusal and erasure require different evidence, and a privacy audit must separate known-candidate inference from unknown-content recovery.

**What remains unknown.** [UNVERIFIED] The same attacks' effectiveness on a new model/data pipeline and the absence of other extraction channels have not been established here.

## Failure modes

[DERIVED] Candidate-distribution confounding, reuse of test data in attack search, aggregate coverage described as a single output, missing query budgets, unsafe reference retention and unexamined loader hooks can reverse a privacy or integrity conclusion. A failed attack supplies a bounded negative result, not an information-theoretic absence proof.

## Siblings

[DERIVED] @ms.chapter.8 owns corpus contamination and @ms.chapter.35 adaptation. @ms.section.65.4 develops formal privacy composition; @ms.section.65.5 supplies prior-sensitive decision metrics. @ms.chapter.64 concerns interpretability evidence, which cannot substitute for these behavioral/privacy tests.

## Extensions

### Improvements and their evidence

[DERIVED] Choose data minimization and formal private training when individual influence is the protected property and an auditable accountant is feasible. Prefer access isolation when the attack requires unavailable weights or a privileged loader. Reverse a mitigation choice when its actual protected unit, utility cost or required access does not match the threat snapshot. Additional attack diversity improves discovery but does not certify completeness.

## Limitations

[DERIVED] This section does not execute extraction, membership attacks or artifact loaders. Pure-DP algebra is conditional on its declared hypotheses; real approximate-DP pipelines require complete accounting. Source-selected books and models do not represent all training corpora.

## Reproducibility

[DERIVED] Retain hashes, source/group splits, candidate knowledge, thresholds, reference matching code/configuration, all attempted-design costs and result denominators. Share synthetic fixtures instead of private or copyrighted recovered text.

## References

[R65.1,R65.3,R65.4] Source revisions, inspected locations and claim limits: @ms.references.65.
