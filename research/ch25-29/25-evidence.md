# Chapter 25 evidence and review record

Inspected **2026-10-09**. Eligible originating-publication/release window: **2025-12-01 through 2026-10-09**, inclusive. This is an authoring ledger, not an experimental result. The full typed bibliography lives in the chapter's `references.md`.

| Key | Originating date | Opened primary text and locator | Claim boundary |
|---|---|---|---|
| R25.1 | 2026-01-05; page updated2026-03-16 | https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform-six-new-chips-one-ai-supercomputer/ — GPU, memory/decode, scale-up and platform sections | First-party architecture disclosure; no headline performance ratio adopted |
| R25.2 | 2026-08-04 | https://rocm.blogs.amd.com/ecosystems-and-partners/cdna5-helios/README.html — execution, memory, networking, resiliency | Wave32, data movers and rack-domain disclosure; no independent validation |
| R25.3 | 2025-12-01; inspected v1 and v3 dated2026-03-02 | https://arxiv.org/html/2512.02189v1 and https://arxiv.org/html/2512.02189v3 — §§III–V,VII-A; abstract/history opened separately | Microbenchmark method and restrictions; abstract/code-availability inconsistency retained |
| R25.4 | 2026-05-05 | https://arxiv.org/html/2605.04178v1 — §§IV-A–G,V-A–B, TablesII,IV–IX | Fitted per-case multiplier and omitted queueing/multinode terms prevent universal accuracy claims |
| R25.5 | 2026-06-14 | https://arxiv.org/pdf/2606.15870 — pp.2–8, Table1, software, architecture, resilience; abstract authors/DOI/history verified separately | Contemporary report's architecture is used; historical performance results are excluded |
| R25.6 | 2025-12-02 | https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-ec2-trn3-ultraservers/ — launch scope and per-chip versus system specification | Specifications only, no implied accepted-work rate or price comparison |
| R25.7 | 2026-03-03 | https://www.apple.com/newsroom/2026/03/apple-debuts-m5-pro-and-m5-max-to-supercharge-the-most-demanding-pro-workflows/ — M5 Pro/Max, advanced technologies | GPU neural accelerators distinguished from Neural Engine; no imported vendor ratio |
| R25.8 | 2026-01-05 | https://www.intel.com/content/www/us/en/newsroom/news/artificial-intelligence/ces-2026-intel-core-ultra-series-3-debut-first-built-on-intel-18a.html | CPU/GPU/NPU identity only; inaccessible datasheet internals excluded |
| R25.9 | 2026-08-22 | https://arxiv.org/html/2608.21731v1 — §§2–4,5.1–5.7; abstract authors/history checked | Host-core-to-CXL-DIMM contention study; no GPU/KV-offload benefit inferred |
| R25.10 | 2026-08-27; v2 listed2026-09-01 | https://arxiv.org/html/2608.26575v1 — §§2.2,3.1–3.3,9; abstract authors/history checked | Inspected v1 protocol; within-row confidential-computing comparison only |
| R25.11 | 2026-05-26 | https://aws.amazon.com/about-aws/whats-new/2026/05/aws-announce-neuron-2-30-0/ — Neuron2.30/NKI0.4 interface additions | Versioned interface disclosure; installed compatibility unverified |
| R25.12 | 2026-04-17 | https://docs.nvidia.com/networking/display/kubernetes2611/nvidia-network-operator-v26-1-1.pdf — pp.22–24; https://github.com/Mellanox/network-operator/releases/tag/v26.1.1 | Dated adapter/IB/RoCE support; no measured throughput |
| R25.13 | 2026-08-04 | https://docs.openvino.ai/2026/about-openvino/release-notes-openvino.html — previous2026 releases →2026.3 only | Dated device/model coverage; later page sections not inherited |

The December2025 Blackwell paper's §III-A states148 B200 SMs; the May2026 modeling paper's TableII states176. Neither count is imported as a verified specification. The December paper's inspected body withholds source code during review despite the abstract's open-source language. Those discrepancies are preserved rather than silently reconciled.

The Intel datasheet route returned403 and failed tool retrieval. Search-result snippets did not replace primary inspection. Detailed NPU internals remain excluded. No eligible detailed Inferentia successor or unspecified specialist-ASIC artifact was invented to complete a comparison table.

## Independent mathematical and editorial review

A second agent reviewed the six sections and corrected the following before integration:

- Added an explicit padding-efficiency equation and bound the corresponding calculator to it.
- Retained immutable memory-tier identity in lifetime events, so migration cannot redirect an earlier release to the new tier.
- Required a physical route to be a contiguous directed endpoint path rather than a list of individually valid edges.
- Defined latency comparison through a declared quantile and made unresolved candidates skip admission explicitly.
- Included calculator formulas in their numbered derivation anchors.
- Restricted checkpoint-calculator inputs to the stated first-order rare-event regime and aligned the analytical fixture with the new defaults.
- Corrected AWS Neuron's reference-stack membership and aligned the retained-progress time-fraction definition across section, chapter and verification.

These are manuscript/mathematical corrections, not evidence of hardware execution. All scientific experiments remain UNVERIFIED. The chapter remains `manuscript_draft`.

The chapter has **six sections with three native figures each**, plus one dated chapter lineage figure. Standalone figure validation after independent review checked **19 figure blocks with zero problems**. The integrated build and browser review are recorded separately by the integrator.
