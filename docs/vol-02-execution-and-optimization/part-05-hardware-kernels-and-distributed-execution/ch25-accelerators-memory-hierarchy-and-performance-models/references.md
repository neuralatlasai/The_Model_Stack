---
id: "ms.references.25"
entity_type: "references"
title: "References — Chapter 25"
short_title: "References — Chapter 25"
volume: 2
part: 5
chapter: 25
section: null
slug: "references"
parent: "ms.chapter.25"
prev_sibling: "ms.verification.25"
next_sibling: null
children: []
prerequisites: ["ms.chapter.1", "ms.chapter.2", "ms.chapter.3", "ms.chapter.5", "ms.chapter.13", "ms.chapter.14", "ms.chapter.15", "ms.chapter.16", "ms.chapter.17"]
downstream: ["ms.chapter.26", "ms.chapter.27", "ms.chapter.28", "ms.chapter.29", "ms.chapter.30"]
related: []
relations: []
axes: {"lifecycle": ["pretraining", "inference", "serving"], "mechanism": ["hardware", "performance_model", "memory_hierarchy"], "feedback_setting": [], "modality": ["text", "image"]}
papers: []
implementations: ["impl.nvidia-cuda", "impl.amd-rocm", "impl.google-tpu-xla"]
benchmarks: []
datasets: []
status: {"maturity": "active", "disputed": false}
evidence_summary: {"labels_used": ["MATHEMATICALLY-DERIVED", "DERIVED", "PAPER-REPORTED", "OFFICIAL-DOCUMENTATION", "NOT-DISCLOSED", "UNVERIFIED", "ASSUMED"], "empirically_observed": false}
word_count_target: 1200
updated_at: "2026-10-09"
editorial_status: "manuscript_draft"
---

# References — Chapter 25

Evidence window: **2025-12-01 through 2026-10-09**, inclusive. First publication/release controls eligibility; an inspection date or late revision never makes an older work eligible. Standard mathematical mechanisms are derived in the chapter, not claimed as recent inventions.

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R25.1 | technical report | Inside the NVIDIA Vera Rubin Platform: Six New Chips, One AI Supercomputer | Kyle Aubrey / NVIDIA | 2026-01-05; updated 2026-03-16 | [R25.1 primary](https://developer.nvidia.com/blog/inside-the-nvidia-rubin-platform-six-new-chips-one-ai-supercomputer/) | null | official documentation | 2026-10-09 | Rubin GPU, Memory and decode efficiency, Scale-up interconnect, NVLink6, platform/rack software; mutable page inspected 2026-10-09. Architecture disclosure, not reproduced throughput. |
| R25.2 | technical report | Introducing AMD CDNA 5 and the AMD Helios Rackscale Solution | Michael Roy et al. / AMD | 2026-08-04 | [R25.2 primary](https://rocm.blogs.amd.com/ecosystems-and-partners/cdna5-helios/README.html) | null | official documentation | 2026-10-09 | Reimagining AI Compute; Memory Designed for Large Models; Built on Open Networking; Rack-Scale Resiliency. Disclosed Wave32, data movers, rack domains, rerouting; no book-run validation. |
| R25.3 | paper | Microbenchmarking NVIDIA’s Blackwell Architecture: An in-depth Architectural Analysis | Aaron Jarmusch; Sunita Chandrasekaran | first 2025-12-01; inspected v3 2026-03-02 and v1 | [R25.3 primary](https://arxiv.org/abs/2512.02189) | null | preprint | 2026-10-09 | Full HTML v1 and v3: §§III–V, VII-A. Protocol, instruction/memory characterization, withheld-code and discrepancy boundaries; no headline speedup imported. |
| R25.4 | paper | Microbenchmark-Driven Analytical Performance Modeling Across Modern GPU Architectures | Aaron Jarmusch; Sunita Chandrasekaran | first 2026-05-05; v1 | [R25.4 primary](https://arxiv.org/abs/2605.04178) | null | preprint | 2026-10-09 | Full HTML v1 §§IV-A–G, V-A–B, TablesII, IV–IX. Calibration, overhead, holdout requirements, restricted validation. Optional per-case multipliers explicitly disclosed. |
| R25.5 | paper | Google's Training Supercomputers from TPU v2 to Ironwood: Architectural Stability, Scale, Resilience, Power Efficiency, and Sustainability Across Five Generations | Norman P. Jouppi; Sridhar Lakshmanamurthy; Cliff Young; David Patterson / Google | first 2026-06-14; IEEE Micro July/August2026 | [R25.5 primary](https://arxiv.org/abs/2606.15870) | null | peer-reviewed | 2026-10-09 | PDF v1 pp.2–8, Table1, Architecture Stability, TPU Software Stack, Architecture Evolution, Improved Resilience. DOI10.1109/MM.2026.3699647 linked in arXiv metadata. Earlier historical results cited by the report are not imported as current evidence. |
| R25.6 | technical report | Announcing Amazon EC2 Trn3 UltraServers for faster, lower-cost generative AI training | Amazon Web Services | 2025-12-02 | [R25.6 primary](https://aws.amazon.com/about-aws/whats-new/2025/12/amazon-ec2-trn3-ultraservers/) | null | official documentation | 2026-10-09 | Original release paragraph2: per-chip144GB HBM3e,4.9TB/s,2.52FP8PFLOPs; up-to144chip scope. Specification boundaries only; no price/performance ratio adopted. |
| R25.7 | technical report | Apple debuts M5 Pro and M5 Max to supercharge the most demanding pro workflows | Apple | 2026-03-03 | [R25.7 primary](https://www.apple.com/newsroom/2026/03/apple-debuts-m5-pro-and-m5-max-to-supercharge-the-most-demanding-pro-workflows/) | null | official documentation | 2026-10-09 | M5 Pro/Max and Advanced Technologies: GPU neural accelerators, unified memory, separate Neural Engine; no vendor performance ratio used as comparable LLM measurement. |
| R25.8 | technical report | CES2026: Intel Core Ultra Series3 Debut as First Built on Intel18A | Intel | 2026-01-05 | [R25.8 primary](https://www.intel.com/content/www/us/en/newsroom/news/artificial-intelligence/ces-2026-intel-core-ultra-series-3-debut-first-built-on-intel-18a.html) | null | official documentation | 2026-10-09 | Series3 CPU/GPU/NPU differentiation and release identity. Referenced datasheet872188 retrieval403; its microarchitecture details are excluded and retained as an evidence gap. |
| R25.9 | paper | Building A CSFQ-Inspired Transport for Switched CXL Memory Pooling | Zerui Guo; Emily Shriver; Ming Liu | first 2026-08-22; v1 | [R25.9 primary](https://arxiv.org/abs/2608.21731) | null | preprint | 2026-10-09 | Full HTMLv1 §§2–4,5.1–5.7: host-core-to-DIMM path, sharing, testbed/workload boundary, rack-scale qualification. No GPU/KV-offload performance inferred. |
| R25.10 | paper | Benchmarking Confidential Computing Performance on NVIDIA Blackwell GPUs | Amean Asad; Ansgar Grunseid | first 2026-08-27; inspected v1; v2 listed 2026-09-01 | [R25.10 primary](https://arxiv.org/abs/2608.26575) | null | preprint | 2026-10-09 | Full HTMLv1 §§2.2,3.1–3.3,9: encrypted boundaries, paired within-row comparisons, software and timing restrictions. No cross-row hardware ranking. |
| R25.11 | documentation | AWS Neuron2.30.0 with NKI0.4.0 | Amazon Web Services | 2026-05-26 | [R25.11 primary](https://aws.amazon.com/about-aws/whats-new/2026/05/aws-announce-neuron-2-30-0/) | null | official documentation | 2026-10-09 | Versioned announcement: Trainium3 activate2, OCPFP8 matrix inputs, tile constants and reference kernels. Artifact/interface disclosure only, executable compatibility UNVERIFIED. |
| R25.12 | documentation | NVIDIA Network Operator v26.1.1 | NVIDIA / Mellanox | release 2026-04-17; tagd91e099 | [R25.12 primary](https://docs.nvidia.com/networking/display/kubernetes2611/nvidia-network-operator-v26-1-1.pdf) | [release](https://github.com/Mellanox/network-operator/releases/tag/v26.1.1) | official documentation | 2026-10-09 | Versioned PDFpp.22–24, Platform Support adapter table; IB RDMA/RoCE distinction. Release tag page inspected; no bandwidth measured. |
| R25.13 | documentation | OpenVINO2026.3 release notes | Intel OpenVINO | 2026-08-04 | [R25.13 primary](https://docs.openvino.ai/2026/about-openvino/release-notes-openvino.html) | null | official documentation | 2026-10-09 | Previous2026 releases →2026.3 → New models supported and portability section. Only the dated2026.3 subsection is used; mutable page inspected2026-10-09. |

## Inspection and discrepancy record

- **R25.3:** full-text v1 and v3 were opened. Both §III-A describe 148 B200 SMs, while R25.4 TableII lists176. This book does not resolve the SKU/stepping/count discrepancy and imports neither as a verified specification. It also does not infer code availability from the abstract: the inspected body states that code cannot be shared during double-blind review.
- **R25.4:** §IV-D permits per-case fitted multipliers; §IV-G excludes CTA queueing and multi-node scaling. Those boundaries prevent treating fitted errors as universal prediction accuracy. Any independent calibration/holdout implementation remains UNVERIFIED.
- **R25.5:** the originating2026 paper is eligible; historical origin papers and production results cited inside it are outside this chapter's source set. No historical goodput number is restated as a new measurement.
- **R25.8:** the January2026 datasheet URL returned403 during direct retrieval and failed browser-tool fetch. Only the opened originating launch disclosure supports this manuscript. Detailed NPU internals from search snippets are excluded.
- **R25.9 and R25.10:** originating author lists and submission dates were checked against the primary abstract records; the full v1 method and evaluation text were opened. R25.10 lists a September1 revision; this manuscript attributes only the inspected v1 protocol. No independent replication was performed.
- **Mutable documentation:** R25.1, R25.2, R25.7, R25.8 and R25.13 are dated releases with mutable page bodies. Record snapshots/hashes for an executable release artifact. The chapter restricts them to the inspected disclosure and makes no binary compatibility claim.

## Evidence gaps

| Candidate question | Evidence state | Consequence |
|---|---|---|
| Matched end-to-end ranking across all accelerator families | UNVERIFIED; no experiment executed | No winner or universal speedup claimed |
| Exact deployment firmware, thermal margins, pricing and error rates | NOT-DISCLOSED for an unspecified deployment | Required artifact inputs, never invented defaults |
| Inferentia successor internals and unsupported specialist ASIC routes | UNVERIFIED in the requested window | Remain unqualified candidates |
| Numerical compatibility of every named framework/hardware combination | UNVERIFIED | Must pass Chapter26/28 qualification before performance comparison |
