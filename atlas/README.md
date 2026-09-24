# Research Atlas — The Model Stack

The web edition of *The Model Stack — From Data and Silicon to Intelligence*. It compiles the manuscripts in `../docs/` into typed research objects and renders them as an interactive research atlas (`../Instruction/UI_UX.md`): a knowledge tree, a reading column with first-class research objects (equations, algorithms, claims, failure modes, experiments, siblings), and a context rail of live instruments that change with the region being read.

## Supported runtime

- Node.js **24 LTS** (`engines: >=24 <27`; tested on 24.12). `eslint-plugin-astro` is pinned to 1.7.0 because 3.x requires Node ≥ 24.16 (see `docs/adr/`).
- npm 11 with the committed `package-lock.json`.
- Browsers: current Chromium, Firefox, and Safari (Baseline widely available features; the Popover API degrades to static panels).

## Commands (run in `atlas/`)

| Command | What it does |
|---|---|
| `npm ci` | Install exactly what the lockfile pins |
| `npm run dev` | Compile `../docs` into `.atlas/`, then serve the site at http://localhost:4321 with hot reload |
| `npm run compile` / `compile:check` | Compile only; `:check` exits 1 on any error diagnostic |
| `npm run figures:check` | Validate every authored ` ```figure ` block without the full compiler |
| `npm run build` / `preview` | Static production build into `apps/web/dist`, then serve it |
| `npm run typecheck` | `tsc` for core, visual, compiler; `astro check` for the site |
| `npm run lint` / `format:check` | ESLint 10 flat config (typescript-eslint strict type-checked); Prettier |
| `npm test` | `node:test` suites of the pure-TS packages |
| `npm run test:e2e` | Playwright + axe accessibility checks against a built site |

A change is done when `format:check`, `lint`, `typecheck`, `test`, `compile:check`, and `build` pass from a clean `npm ci`.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
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

## Compatibility policy

The compiled bundle carries `schemaVersion`; the site refuses a bundle whose version it does not know. Content slugs are stable URLs and never change after publication.
