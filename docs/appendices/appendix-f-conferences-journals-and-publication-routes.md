---
id: ms.appendix.f
entity_type: appendix
title: "Conferences, journals, and publication routes"
short_title: Appendix F
volume: null
part: null
chapter: null
section: null
slug: appendix-f-conferences-journals-and-publication-routes
parent: ms.appendices
prev_sibling: ms.appendix.e
next_sibling: ms.appendix.g
children: []
prerequisites: []
downstream: []
related: [ms.chapter.6, ms.chapter.66]
relations: []
axes: {lifecycle: [evaluation, assurance], mechanism: [evidence_audit, provenance], feedback_setting: [], modality: []}
papers: []
implementations: []
benchmarks: []
datasets: []
status: {maturity: active, disputed: false}
evidence_summary: {labels_used: [DERIVED, PAPER-REPORTED, OFFICIAL-DOCUMENTATION, NOT-DISCLOSED, UNVERIFIED], empirically_observed: false}
word_count_target: null
updated_at: 2026-10-25
editorial_status: manuscript_draft
---

# Appendix F — Conferences, journals, and publication routes

[DERIVED] Publication routes organize discovery and provenance; venue names do not replace technical review. The map below describes research axes and historical archives. It is not an event calendar, acceptance announcement or current call-for-papers guide.

## Coverage by research axis

| Research axis | Venues and publication routes | Why the book needs them |
|---|---|---|
| Machine learning and statistics | NeurIPS, ICML, ICLR, AISTATS, UAI, JMLR, TMLR | Objectives, optimization, generalization, architectures, and learning theory |
| Language modeling and NLP | ACL, EMNLP, NAACL, EACL, COLING, COLM | Language representations, data, multilinguality, alignment, and evaluation |
| ML systems | MLSys | Compiler/runtime, distributed training, serving, and algorithm–system interactions |
| Operating/distributed systems | OSDI, SOSP, NSDI, EuroSys; USENIX ATC proceedings as an archive | Scheduling, state management, disaggregation, and fault tolerance |
| Architecture and hardware | ISCA, MICRO, HPCA, ASPLOS, Hot Chips | Memory hierarchy, accelerators, interconnects, and hardware/software co-design |
| Parallel/HPC | SC, PPoPP, IPDPS | Parallel algorithms, communication, scaling, and cluster execution |
| Retrieval and data systems | SIGIR, WSDM, The Web Conference, KDD, SIGMOD, VLDB | Retrieval, ranking, indexing, data processing, and storage |
| Vision and multimodality | CVPR, ICCV, ECCV | Visual representations, video, generative models, and multimodal reasoning |
| Speech/audio | ICASSP, Interspeech | Speech understanding/generation, streaming, and acoustic evaluation |
| Robotics and embodied AI | CoRL, RSS, ICRA, IROS | Policy learning, control, simulation, and embodied generalization |
| Security and privacy | IEEE S&P, USENIX Security, ACM CCS, NDSS, PETS | Adversarial behavior, privacy, systems security, and threat modeling |

## Publication-state record

| State or event | What to record | What it does not establish |
|---|---|---|
| First public manuscript | Earliest verified public version and date, including an earlier public submission where relevant | Later arXiv numbering or access time cannot establish first release |
| Revision | Exact version, date and changed claims, methods or results | A newer revision does not retroactively support a claim made from an older version |
| Submission/review | Official submission identity and public decision/review record when available | A submission is not acceptance; visible reviews are not the final published artifact |
| Acceptance/publication | Official proceedings/journal route and linked work identity | Acceptance is not proof that every result is correct or independently replicated |
| Correction/retraction | Exact notice, date and affected claims/versions | An unchanged old mirror is not evidence that no correction exists |
| Artifact evaluation | Specific badge/report criteria, version and evaluated artifact | An artifact check is not automatically numerical reproduction or broader deployment validity |
| Independent reproduction | Independent investigators, code/data/environment, protocol and observed agreement/disagreement | Reusing released outputs without rerunning the method is not an independent experiment |

## Primary discovery routes

Use [PMLR](https://proceedings.mlr.press/), [ACL Anthology](https://aclanthology.org/), [OpenReview](https://openreview.net/), [NeurIPS proceedings](https://proceedings.neurips.cc/), [USENIX](https://www.usenix.org/conferences), [CVF Open Access](https://openaccess.thecvf.com/) and the relevant ACM, IEEE and official venue archives. These are source routes; the specific work's page and artifact determine its status. Historical SysML naming and MLSys should be treated with their dated context rather than counted automatically as separate contemporary venues.

[DERIVED] The chapter ledger separates first publication, inspected revision and actual access. If a venue acceptance is only stated by the preprint authors and the official record has not been inspected, preserve that distinction. An informal report may contain substantial reproducible evidence; a peer-reviewed paper may still omit essential data or confound a comparison. Evaluate the mechanism and experiment before adopting its conclusion.

[DERIVED] A source-window rule applies to the earliest verified public release, not the conference year printed on a later paper. Historical foundations remain usable as foundations and should not be relabeled as current findings. Chapters 61–66 apply these distinctions to benchmark validity, uncertainty, interpretation, security and release decisions.
