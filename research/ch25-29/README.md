# Chapters 25–29: authoring and integration review

Review date: **2026-10-09**. Application version: **0.1.0**. Starting revision: `1787cad1729f7205016a8920ff26f66a9a6a179c`. The manuscript revision is the Git commit containing this report; the application package version is not a manuscript edition identifier.

## Scope and evidence policy

The next five chapters in the canonical plan are Chapters 25–29, Volume II, Part V. Each has a chapter overview, six substantive topic sections, references and verification: **45 manuscript files and 30 topic sections**.

Originating papers, disclosures and versioned release artifacts must fall within **2025-12-01 through 2026-10-09**, inclusive. A late revision or retrieval date does not admit an older paper. Versioned API documentation supports its released contract, not a claim that every underlying mechanism was invented during this period. Older empirical results repeated by an eligible report are explicitly excluded where they would violate the requested evidence window.

| Chapter | Subject | Topic sections | Authored native figures |
|---|---|---:|---:|
| 25 | Accelerators, memory hierarchy and performance models | 6 | 19 |
| 26 | Kernel programming and numerical equivalence | 6 | 19 |
| 27 | Attention, latent attention and expert kernels | 6 | 18 |
| 28 | Frameworks, graph compilers and runtime integration | 6 | 20 |
| 29 | Parallelism, collectives and distributed optimization | 6 | 21 |
| **Total** | | **30** | **97** |

Every topic has at least three meaningful native figures and an adjustable calculator. Figures use the existing paper, typography, domain accents, technical diagrams and accessible text equivalents. Analytical configurations are labeled as assumptions or derivations; they are not invented benchmark results.

Every section includes scope, motivation, intuition, formulation, mechanism, a bounded mathematical procedure, implementation obligations, experimental design, four-part observations, failure modes, alternatives, extensions, limitations, reproducibility and primary references. The four observation layers distinguish the source claim, the inspected evidence, the book's inference and remaining uncertainty.

## Scientific review

Independent reviews tightened memory lifetimes and contiguous routes, empty-input reductions, asynchronous pipeline ownership, independent state restoration, VJP cotangents, error accumulation across compiler passes, collective contracts, migration capacity and normalized distributed objectives. They also corrected a strict-versus-non-strict amortization threshold and a multi-letter TeX subscript. Source inconsistencies and inaccessible evidence remain recorded instead of being silently resolved.

The arithmetic audits evaluated 13 Chapter 25–26 calculators on 313 default/corner configurations and seven Chapter 27/28.3 calculators on 74 configurations. These finite analytical checks do not execute kernels, reproduce a paper or validate hardware performance.

A separate full-manuscript sweep checked 31 calculators on 328 default, preset and boundary configurations. All 107 display expressions and 996 inline expressions compiled to both visual KaTeX HTML and accessible MathML; all 81 numbered equation anchors resolved. These overlapping audit sets are not independent experimental replications.

Source identities, first dates, inspected locators and excluded evidence are retained in [25-evidence.md](25-evidence.md), [26-28-evidence.md](26-28-evidence.md), [27-evidence.md](27-evidence.md) and [29-evidence.md](29-evidence.md), together with each chapter's canonical references and verification page.

## Integration checks

- Structural review: 45 files, 30 sections and 97 figures; no new-chapter compiler errors or warnings.
- Figure validation: 480 authored figure blocks across the repository, zero problems.
- Production build: 1942 pages built successfully.
- Site-wide links: zero missing files, invalid fragments, data-island base-path errors or incorrectly themed page illustrations.
- New-page browser sweep: 90 visits covering all 45 pages at 1440 px and 390 px; 60 calculator change/reset checks; no document overflow, broken images, KaTeX errors or page exceptions.
- Formatting, lint and type checks passed; all 590 unit tests and all 36 browser tests passed. The initial equation-catalogue resize timeout led to a visibility-guard repair, followed by the successful full browser suite.

## Equation and chapter UI repairs

Display equations and mathematical procedures now use 20 px type on desktop and 18 px on mobile, instead of inheriting the workspace's compact 14 px interface font. Long formulas retain keyboard/touch scrolling, visible scroll cues, equation numbers and MathML. Calculator formulas also use a readable 18 px size and left alignment. Four Chapter 28 equations regained their links to the corresponding executable instruments.

The Chapter 27 model-width subscript is grouped correctly in TeX. Its preparation calculator now distinguishes an exact cost tie from the first strictly beneficial integer call count. The Chapter 26 interface calculator offers discrete integer invocation counts rather than fractional values from a logarithmic slider.

Mobile outline navigation dismisses the Context panel and focuses the destination. Artifact filenames remain intact in verification tables; dense tables scroll inside their own frame. Reference timelines plot explicit publication dates when complete dates are available over a short span, retain year axes otherwise, and expand to contain dense stacks. Excluded historical identifiers in Chapter 29 no longer inflate its eligible-source count.

The equation catalogue's offscreen measurement guard now checks a descendant inside a skipped row, avoiding forced layout of every offscreen formula. The local probe recorded 150–277 ms resize times after this repair. Search, direct equation hashes, offscreen navigation, no-JavaScript rendering and all 581 equations in print were checked. This is a local UI profile, not an accelerator performance experiment.

Local screenshots and machine-readable review results are generated under the ignored `atlas/artifacts/ch25-29/` directory. The committed source and this report retain the review outcome without publishing temporary browser files.

## Editorial boundary

All five chapters remain **`manuscript_draft`**. No accelerator experiment, distributed run, numerical parity trial, measured speedup, energy/cost experiment or independent scientific replication was performed. Proposed experiments remain **UNVERIFIED**. A successful website build and a mathematical review do not certify a reviewer score or empirical superiority over the supplied benchmark publication.
