# CLAUDE.md — The Model Stack

Project-level instructions for Claude Code. These apply to every session in this repository.

## 1. Who I am working with

-  principal AI staff scientist / senior AI systems engineer, Bengaluru.
-  expert familiarity with modern AI/ML systems. Do not teach from first principles unless the task requires it.
- Respond as a senior technical collaborator, not a general-purpose tutor.
- No generic summaries, elementary explanations, marketing language, AI buzzwords, recruiter-style language, inflated claims, or obsolete terminology.

## 2. What this repository is

- `book_plan.md` is the complete editorial specification for the book **The Model Stack — From Data and Silicon to Intelligence** (3 volumes, 11 parts, 66 chapters, 396 sections, 8 appendices). It is the authority on chapter ownership, section coverage, prerequisites, artifacts, verification tasks, and source anchors.
- `Instruction/` is **read-only input**. Never modify, paraphrase, or "improve" any file in it:
  - `AI_REFERENCE_STACK.md` — the only permitted vocabulary and source-route reference for labs, conferences, discovery sources, and the training/post-training/inference stack. Content must use its names and search protocols exactly.
  - `standards.md` — Python/process engineering baseline (applies when code is written).
  - `nodejs-javascript-engineering-standards-2026.md` — Node/JS/browser baseline (applies to the future Atlas UI).
  - `UI_UX.md` — the Research Atlas design brief. Content is structured so it compiles into its content-object model.
  - `AI-2040.pdf` — the AI Futures Project scenario; presentation reference only, not chapter content.
- `docs/` holds the chapter manuscripts as Markdown. The normative authoring standard is `docs/CONTENT_CONTRACT.md`; figures and rail instruments follow `docs/VISUAL_GRAMMAR.md`; the atlas index is `docs/README.md`; the machine-readable node list is `docs/atlas-manifest.json`; shared symbols are in `docs/front-matter/notation.md`.
- `atlas/` holds the **Research Atlas** web application (TypeScript + Node) that compiles `docs/` into typed research objects and renders them per `Instruction/UI_UX.md`. See §6.
- Current phase (from 2026-09-23): **UI build + visual authoring**, running alongside continued manuscript writing. Chapters 01–11 have manuscripts; the UI and the visual layer are built against them first.

## 3. Non-negotiable content rules

- **2026 editorial standard (user instruction, 2026-09-24).** Write for principal scientists and senior systems engineers using primary evidence checked at authoring time for the 2026 edition. Verify version-sensitive APIs, implementation constraints, release status, and research claims against the exact source routes in `Instruction/AI_REFERENCE_STACK.md`; record the actual access date and the inspected version, revision, or explicitly unpinned documentation surface. Preserve useful historical foundations with their dates, but do not present historical defaults as current behavior or equate recency with technical superiority.
- **Originality and evidence discipline.** Write original technical synthesis with claim-local references and independently explained derivations. Never invent citations, results, versions, or undocumented mechanisms. State mathematical conditions and proposed experimental configurations explicitly; do not substitute assumptions for missing source evidence. Mark unresolved facts UNVERIFIED or NOT-DISCLOSED. Do not promise absolute absence of error or plagiarism without an appropriate audit.
- **Current collaboration boundary.** The user develops the website code; this agent writes chapter content and chapter-local visual material under `docs/`. Do not modify application code, dependencies, build outputs, or unrelated chapters. Changes to this instruction file are permitted when explicitly requested by the user. Validate manuscript structure and figures without writing application build artifacts.
- Every concept has exactly one canonical teaching location; elsewhere, link. No duplicated definitions.
- Every non-trivial statement carries exactly one evidence label: KNOWN · DERIVED · ASSUMED · NOT-DISCLOSED · UNVERIFIED · PAPER-REPORTED · OFFICIAL-DOCUMENTATION · MATHEMATICALLY-DERIVED · CODE-VERIFIED · EMPIRICALLY-OBSERVED.
- EMPIRICALLY-OBSERVED does not appear in Edition 1.0. Every experiment is a proposal. CODE-VERIFIED requires repository + commit + the check performed.
- Never fabricate citations, benchmarks, architecture details, pricing, APIs, version strings, or hardware specifications. Missing detail is NOT-DISCLOSED or UNVERIFIED, never inferred from a brand or model name.
- Every mechanism is followed by its cost: parameters, tokens, FLOPs, memory capacity, memory traffic, communication, latency, throughput, energy, money.
- Every performance number sits next to its context: hardware, model, precision, sequence length, input/output distribution, concurrency, runtime version, measurement boundary. Advertised peak FLOPs are not application throughput.
- Define the evaluation axis before comparing anything. No rankings of labs, models, or engines.
- Keep categories separate: objective vs algorithm vs feedback source vs architecture vs implementation; RLVR vs GRPO vs reasoning; LoRA (adaptation) vs quantization/pruning (compression); GGUF vs GGML vs llama.cpp vs Ollama; RoCE vs InfiniBand; CXL vs memory media; Triton language vs Triton Inference Server.
- Structure for research subjects: Objective → Intuition → Formulation → Methodology → Implementation → Experiments → Observations → Limitations → Practical implications. Papers are read vertically: problem → mechanism → equations → algorithm → representation → compute → system consequences → experiments → limitations → descendants.
- Structure for systems subjects: algorithm → representation → runtime → compute → memory → communication → deployment, and for agent systems context construction → retrieval → planning → tool routing → memory/state → orchestration → execution → verification → observability → recovery → deployment, with rollback, retries/timeouts, resource exhaustion, state consistency, security, latency, throughput, scaling, and cost analysed.
- Separate physical resource reasoning from cognitive analogy; analogies are heuristic unless supported by intervention evidence.
- Brutal truth: state where evidence is thin, where reported gains are unreproduced, where a common claim is a category error, where a vendor figure does not transfer.
- Prefer 2025–2026 methods and systems; historical material explains why modern approaches evolved.
- Writing: technical, human, scientific, credible; dense but coherent; precise terminology; no repetition.

## 4. How work is executed here

- **The content-writing duty is ours.** Every file under `docs/` must contain the full research manuscript for its node: derivations, equations, algorithms, tensor/systems traces, cost accounting, experiments (as proposals), failure modes, sibling differentials, and lineage. A file that is only a reference list, an outline, or a placeholder is a defect. Nobody else fills these files.
- **Web search is mandatory for grounding.** For every PAPER-REPORTED or OFFICIAL-DOCUMENTATION claim, open the primary source with WebFetch/WebSearch (arXiv abs page, official documentation root, official GitHub org, model card, course site) as routed by `Instruction/AI_REFERENCE_STACK.md`, confirm the claim, and record the URL with the actual access date in the chapter's `references.md`. Sources that could not be opened stay UNVERIFIED. Web search is for verification and primary-source retrieval; it never replaces the reference-stack vocabulary or introduces unrouted sources.
- **Every chapter is bound to the reference stack.** The chapter page carries a *Reference-stack coverage* table (contract §3 item 13) naming the exact §1 labs, §2 conferences, §3 discovery sources, and §4 systems it draws on, with rank number, §4.1 stack layer, the surface URL as listed in `AI_REFERENCE_STACK.md`, what was taken from it, and the evidence label, plus the §4.2 inspection dimensions applied. Sources outside the reference stack are allowed only when `book_plan.md` anchors them, and are listed as such.
- Chapters are written to full mechanism depth: roughly 1,500–2,600 words per section, 11,000–16,000 per chapter. The plan's 5,000–7,000 figure is an indicative planning budget, not a ceiling.
- Chapter manuscripts are written by subagents: **at most five agents in parallel, one chapter per agent**, launched in waves. Each agent reads `book_plan.md` (its chapter matrix, the shared mathematical contract, Appendix H), `Instruction/AI_REFERENCE_STACK.md`, `docs/CONTENT_CONTRACT.md`, `docs/front-matter/notation.md`, and an exemplar chapter, then writes its chapter folder, fetching primary sources as it writes.
- Verification after each wave: frontmatter validity, file naming, link resolution, evidence-label presence, absence of EMPIRICALLY-OBSERVED, coverage of every matrix item, sibling and lineage sections present.
- If something fails verification, report: failed component → evidence → probable cause → corrective action.
- Human approval is required for consequential organisational decisions, irreversible actions, confidential disclosures, production authorisation, and decisions with an undefined utility function. Escalate only when an essential input or authorisation is genuinely unavailable.
- Do not commit or push unless asked. `docs/` is the deliverable; `Instruction/` and `book_plan.md` are inputs.

## 6. Research Atlas (UI) — how the web application is built

**Authority.** `Instruction/UI_UX.md` governs product, information architecture, and interaction; `Instruction/nodejs-javascript-engineering-standards-2026.md` governs code, repository, testing, security, and release; `docs/CONTENT_CONTRACT.md` and `docs/VISUAL_GRAMMAR.md` govern what the compiler accepts. When they conflict, record the controlling authority in an ADR under `atlas/docs/adr/`.

**Stack (pinned exact versions in `atlas/package.json`, lockfile committed).**
- Node.js 24 LTS (`engines: >=24`), ESM only, `"type": "module"`, relative imports carry real `.ts` extensions, built-ins use `node:`.
- TypeScript 6.0.x (not 7.x: typescript-eslint and `@astrojs/check` do not support it yet). `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `erasableSyntaxOnly` (no `enum`, `namespace`, or parameter properties). No `any`; `unknown` plus a zod parse at every trust boundary (Markdown, YAML, JSON, URL params, `localStorage`).
- npm workspaces: `packages/core` (domain types, ids, zod schemas, DOM contract; no I/O), `packages/visual` (visual grammar: primitives, Mermaid-subset parser, ELK layout, SVG renderers), `packages/compiler` (reads `docs/`, emits typed research objects, graph, search index into `atlas/.atlas/`), `apps/web` (Astro 7 static site + Preact islands). Dependency direction: core ← visual ← compiler; web reads core, visual, and compiled output only.
- Pure-TS packages run directly on Node 24 type stripping and are tested with `node:test`; the site is tested with Playwright + axe-core. ESLint 10 flat config (typescript-eslint `strictTypeChecked`), Prettier. KaTeX (server-rendered, HTML+MathML), Shiki (dual theme), MiniSearch (lexical, lazy-loaded).
- Gates, all from a clean `npm ci`: `format:check`, `lint`, `typecheck`, `test`, `compile` (content), `build`, `test:e2e`. A change is not done until they pass.

**Product rules that are easy to get wrong.**
- The shell is stable; the centre column changes. Knowledge tree, reader, and context rail are three projections of one state: active section drives tree highlight, rail instruments (≤ 3 at once), URL hash, progress, and minimap. Native scroll only: no scroll-jacking, snapping, parallax, or fade-ups.
- Critical content is server-rendered HTML. Graphs, figures, and equations always carry a text equivalent. Heavy code (graph, search index, calculators) loads only on demand.
- Depth control (Overview · Technical · Research · Implementation) toggles visibility of layers of one document; it is persisted in the URL.
- Evidence labels render as quiet semantic markers, not badge walls. Paper citations open an inspector in the rail and keep the reader anchored.
- Budgets: LCP < 1.8 s, INP < 150 ms, CLS < 0.05, WCAG 2.2 AA, keyboard traversal of tree/graph/palette, reduced-motion honoured, motion 80–300 ms and functional only.
- Never: card grids, gradients, glassmorphism, neon, generic AI illustration, dashboard grids, rows of big-number stat tiles (totals go in the page's meta line or inside the instrument), badge walls, marketing copy, lorem ipsum. Real manuscript content only.

**Visual style (reference: ai-2027.com, `Instruction/AI-2040.pdf`, OpenAI engineering index posts).** Editorial monograph, not a web app: warm paper-neutral surface; old-style serif body at 18–19 px with real small caps for section heads; oxblood accent for links, note numbers, and active states, used sparingly; hairline rules instead of containers; sidenotes and citation previews in the right margin, aligned to their reference; the right rail is a monospace *instrument panel* (state header, key/value rows with right-aligned values, dot-matrix and block glyphs, dotted-leader legends) that changes with the section being read; figures are quiet, numbered, captioned, sourced, with mono labels. Dark mode is designed separately, not inverted. Domain accents mark only identifiers, edges, active states, and series.

**Alive and connected is the defining requirement (every page and sub-page).** It may look simple and clean, but nothing important is static: every node, dot, row, chip, and connector responds, and every response carries information — what it is, what it connects to, where it leads. Index pages (Library, Papers, Systems, Labs, Timeline, Equations, Figures, Terms) each pair one *instrument* (a map, field, matrix, or minimap drawn from real registry data) with a condensed ledger; the two cross-light, and chips, search, and threads filter both. The Library is the page reviewers land on and must read at a glance as a living book. Rules learned the hard way:
- Readouts have fixed geometry (reserved, clamped heights). A panel that grows on hover moves content under the pointer and flickers.
- Nested grids declare `grid-template-columns: minmax(0, 1fr)`; an implicit `auto` track sizes to no-wrap text and overflows the page.
- `position: sticky` sticks to its nearest overflow ancestor, so sticky table headers cannot sit inside `overflow-x` wrappers.
- CSS custom-property defaults live on the component root, never on the element that consumes them, or state classes on ancestors cannot override them.
- Every instrument is one tab stop with roving focus (arrows, Enter, Esc) and an `aria-live` readout. Page-specific controllers load lazily from `client/main.ts`.

**Visual grammar is authored content, and it is our job.** Every section page carries figures and rail instruments written by us in the grammar of `docs/VISUAL_GRAMMAR.md` (fenced `figure` blocks: diagram, tensor-flow, systems-trace, memory-stack, calculator, stat-panel, lineage, cycle, matrix, chart, hierarchy, compare). Numbers inside figures obey the evidence rules of §3: illustrative numbers are DERIVED from a stated equation, reported numbers are PAPER-REPORTED/OFFICIAL-DOCUMENTATION with full context. The compiler rejects figures that fail the schema, so authors must run `npm run compile` from `atlas/` before reporting.

**Execution.** UI work runs through subagents and workflows: shared contracts in `packages/core` are written first and change only deliberately; implementation fans out over disjoint directories; integration, adversarial review (types, standards, accessibility, performance, brief conformance), and screenshot-based visual QA follow. Visual authoring runs in waves of at most five agents, one chapter each.

## 7. Other durable preferences

- Titles: short, novel, serious, in the style of compact research artifacts. This book is *The Model Stack — From Data and Silicon to Intelligence*.
- Research navigation must connect papers, researchers, conferences, labs, courses (Stanford CS336), and measurement sources (Artificial Analysis, Epoch AI, LMArena) through typed relations, never as parents of methods.
- LaTeX tasks: act as an expert LaTeX engineer; Overleaf-compatible, clean, complete, professional, preserve 100 % of supplied content, delivered as a single `main.tex`, no explanatory prose.
