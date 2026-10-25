# Research Atlas — The Model Stack

The web edition of _The Model Stack — From Data and Silicon to Intelligence_. It compiles the manuscripts in `../docs/` into typed research objects and renders them as an interactive research atlas (`../Instruction/UI_UX.md`): a knowledge tree, a reading column with first-class research objects (equations, algorithms, claims, failure modes, experiments, siblings), and a context rail of live instruments that change with the region being read.

## Supported runtime

- Node.js **24 LTS** (`engines: >=24 <27`; tested on 24.12). `eslint-plugin-astro` is pinned to 1.7.0 because 3.x requires Node ≥ 24.16 (see `docs/adr/`).
- npm 11 with the committed `package-lock.json`.
- Browsers: current Chromium, Firefox, and Safari (Baseline widely available features; the Popover API degrades to static panels).

## Commands (run in `atlas/`)

| Command                             | What it does                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm ci`                            | Install exactly what the lockfile pins                                                         |
| `npm run dev`                       | Compile `../docs` into `.atlas/`, then serve the site at http://localhost:4321 with hot reload |
| `npm run compile` / `compile:check` | Compile only; `:check` exits 1 on any error diagnostic                                         |
| `npm run figures:check`             | Validate every authored ` ```figure ` block without the full compiler                          |
| `npm run build` / `preview`         | Static production build into `apps/web/dist`, then serve it                                    |
| `npm run typecheck`                 | `tsc` for core, visual, compiler; `astro check` for the site                                   |
| `npm run lint` / `format:check`     | ESLint 10 flat config (typescript-eslint strict type-checked); Prettier                        |
| `npm test`                          | `node:test` suites of the pure-TS packages                                                     |
| `npm run test:e2e`                  | Playwright + axe accessibility checks against a built site                                     |

A change is done when `format:check`, `lint`, `typecheck`, `test`, `compile:check`, and `build` pass from a clean `npm ci`.

## Configuration

| Variable           | Default        | Meaning                                                                  |
| ------------------ | -------------- | ------------------------------------------------------------------------ |
| `ATLAS_BUNDLE_DIR` | `atlas/.atlas` | Where the site reads the compiled bundle (validated once at build start) |

No secrets are used; nothing is read from the environment at runtime in the browser.

## Architecture

```
docs/*.md ──► packages/compiler ──► .atlas/ (typed JSON bundle) ──► apps/web (Astro 7, static) ──► dist/
                   │   ▲                                               │
                   ▼   │                                               ▼
             packages/visual  ◄──────────────  packages/core  ──►  client/ (framework-free TS) + Preact islands
```

- **`packages/core`** — domain contracts: ids, evidence labels, frontmatter schema (zod), the research AST, the visual-grammar spec (12 figure kinds, 15 primitives, live `states`), scene geometry, graph, routes, search, DOM/storage contract, formula language, number formatting. No I/O.
- **`packages/visual`** — the visual grammar: Mermaid-subset parser, ELK layout to `Scene`, figure validation, text equivalents, and server-rendered Preact SVG/HTML renderers for every figure kind.
- **`packages/compiler`** — reads `docs/`, validates frontmatter and figures, emits research documents, the knowledge graph, registries (references, terms, systems, labs, lineage, equations, objects), and a MiniSearch index into `.atlas/`.
- **`apps/web`** — Astro 7 static site: the shell (tree · reader · rail), research-object renderers, derived page images (chapter at a glance, sources in time), index pages; client controllers for scroll-sync, the live rail, search (⌘K), citations, depth, theme, and reading state; the calculator island.

Dependency direction is one-way: core ← visual ← compiler; the web app reads core, visual, and the compiled bundle.

## Authoring figures

Figures and live rail instruments are content, written in the chapter files as ` ```figure ` YAML blocks. The grammar is normative in [`../docs/VISUAL_GRAMMAR.md`](../docs/VISUAL_GRAMMAR.md); the reference page `/visual-grammar/` renders every primitive and kind. Run `npm run figures:check` and `npm run compile:check` before committing.

## Developer quality brief: scientific webpages

Treat the current edition as the baseline for substantial improvement. A high editorial score or a “10×” ambition does not establish that readers understand the material better. Record concrete defects, changes and checks; reserve quantified comprehension claims for a defined reader study.

The scientific content and its visual explanation must meet the following acceptance criteria:

- **Preserve the scientific argument.** Keep assumptions, mathematical domains, optimization objectives, algorithm state, computational costs, experimental conditions, limitations and primary-source locators accessible together. Evidence labels and draft status must survive compilation and rendering.
- **Give every figure a technical purpose.** Show an actual mechanism, comparison or sensitivity. Distinguish optional paths, parallel work, dependencies, rejection, terminal outcomes and unresolved effects. Arrows must not introduce a stronger causal or execution claim than the manuscript supports. Each caption explains the relevant assumption and engineering consequence; the text equivalent describes the visual structure.
- **Make quantities inspectable.** Display units, counting boundaries and sufficient precision. Separate real thresholds from integer decisions. Interactive values must respect mathematical domains, synchronize across copies, support keyboard operation and reset predictably. Exact entry should complement sliders when the range makes precise selection difficult. Invalid values need understandable feedback, without silently changing the scientific question.
- **Keep the reading experience coherent.** Scientific rendering follows authored content capabilities across chapters. Preserve the knowledge tree, native reading flow and context rail; the rail remains a compact aid. Figures, equations, captions and controls must remain readable at desktop and mobile widths, in both themes and with reduced motion. Retain server-rendered defaults and accessible mathematical/text representations when JavaScript is unavailable.
- **Verify the complete flow.** Capture the current page before changing it, then inspect equivalent states afterward. Check chapter overview, section figures, expanded figures and live instruments, including keyboard interaction and narrow layouts. Run the applicable formatting, type, unit, compiler, build and browser/accessibility checks. Report the tested routes, states and remaining limits; a screenshot or passing schema alone does not establish scientific or accessibility completeness.

Use [`CONTENT_CONTRACT.md`](../docs/CONTENT_CONTRACT.md), [`VISUAL_GRAMMAR.md`](../docs/VISUAL_GRAMMAR.md) and the established [`UI_UX.md`](../Instruction/UI_UX.md) as the detailed contracts. Fix a failed criterion at its owning layer and retain an evidence-based handoff for review.

**Review snapshot — 2026-10-14.** Chapters 40–54 contain 135 manuscript files, 90 sections, 300 authored figure blocks, 408 display-equation blocks (348 numbered), 91 mathematical algorithms and 32 proposed experiments. Primary-source revisions and inspection locators are recorded in each chapter's reference ledger. The manuscripts remain drafts; book-designed model, serving and agent experiments were not executed. Mathematical consistency checks and application tests do not establish independent replication of the cited research.

Validation from a clean lockfile installation:

- Formatting, lint and type checks pass; all 645 unit tests and 70 browser tests pass. The subsequent metadata correction has focused route/JSON-LD tests and built-site integration checks.
- The compiler processes 500 documents with zero errors. Chapters 40–54 have zero error or warning diagnostics, complete experiment-field recognition and working mathematical algorithm anchors. The complete atlas retains 262 warning diagnostics from older content; informational catalogue differences, planned links, custom headings and external-paper locators remain recorded.
- All 1,159 authored figure blocks pass validation. Sampled desktop/mobile views, keyboard controls, exact-input validation/reset, formula sensitivity, citation/search navigation, light/dark presentation, accessible math and no-JavaScript defaults were inspected. Calculator axe checks pass in both themes; this is not a full WCAG certification.
- The exact GitHub Pages build produces 2,347 pages. Its scan checks 1,432,228 internal links and 48,584 fragments with zero missing files, missing IDs, paths outside the deployment base, invalid island URLs or mismatched page illustrations. Prefixed Chromium integration reports no page errors or failed requests. Canonical and structured-data identities retain `/The_Model_Stack/`; external primary-source URLs remain unchanged.

The production dependency audit passes at the workflow's high-severity threshold, with two low-severity transitive KaTeX findings remaining; the full audit also reports five high-severity findings in development lint dependencies. Dependency versions were not changed in this work. The generated site occupies 984,537,538 bytes uncompressed (938.928 MiB), close to the [documented 1 GB GitHub Pages limit](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits). Review shared page payloads and artifact size before further content expansion.

## Compatibility policy

**Continuation review — 2026-10-25.** Chapters 40–54 received targeted mathematical, source-version and control-flow corrections, including recovery termination, loading-memory accounting, runtime publication, plan nonblocking and atomic action preconditions. The website adds reliable search cancellation/loading, visible mobile citation focus, deferred chapter navigation with a native no-JavaScript index, and a dark selected-result contrast fix. A comparable 500-document Pages build occupies 565,049,289 bytes; its HTML/JSON scan checks 680,636 internal URLs and 57,830 fragments with zero failures. The calculator entry chunk falls from 1,437,660 to 6,380 raw bytes after removing a build-time layout import; shared dependencies and field performance are separate. The full dependency audit has no high/moderate findings, with two low transitive KaTeX entries remaining. See [the size/security decisions](docs/adr/0002-pages-size-and-security-gates.md); the earlier snapshot above records the October 14 state. The deployment workflow supplies the complete checks for the committed review snapshot.

The compiled bundle carries `schemaVersion`; the site refuses a bundle whose version it does not know. Content slugs are stable URLs and never change after publication.
