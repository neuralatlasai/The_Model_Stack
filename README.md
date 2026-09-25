# The Model Stack

**From Data and Silicon to Intelligence**

A technical book and interactive research atlas connecting foundation-model learning science, systems engineering, and intelligent applications: continuous reading, connected concepts, and inspectable evidence in one place.

![An open research book connects data and mathematics to silicon, model computation, and an evidence map; a return path carries evaluation back to learning. Conceptual illustration.](assets/model-stack-editorial.png)

[Explore the book](docs/README.md) · [Choose a reading route](docs/front-matter/reading-routes.md) · [Run the Research Atlas](atlas/README.md)

## Purpose

Make a large body of AI research coherent enough to study, question, and apply. Follow a concept from its mathematical foundations through algorithms, implementation, hardware constraints, and evaluation. Understand what it depends on, how alternatives differ, and what evidence supports the claims.

Written for research engineers, AI systems architects, model researchers, and advanced graduate students with a background in machine learning and software engineering.

## Coverage

The planned series spans **3 volumes, 11 parts, 66 chapters, and 8 reference appendices**.

| Volume | Focus |
| --- | --- |
| [I · Learning and Representation](docs/vol-01-learning-and-representation/README.md) | Mathematical foundations, data, tokenization, architectures, pretraining, and adaptation. |
| [II · Execution and Optimization](docs/vol-02-execution-and-optimization/README.md) | Hardware, kernels, distributed training, post-training, inference, compression, and serving. |
| [III · Grounded and Interactive Intelligence](docs/vol-03-grounded-and-interactive-intelligence/README.md) | Retrieval, agents, multimodal and embodied models, evaluation, interpretability, and deployment assurance. |

## Reading experience

- **Read continuously or explore connections:** chapter sequences, prerequisites, related concepts, and role-specific reading routes.
- **Inspect the mechanism:** equations, algorithms, implementation studies, and resource tradeoffs alongside the explanation.
- **Trace the evidence:** primary-source references, explicit assumptions, failure modes, and verification tasks.
- **Explore the Atlas:** searchable research objects, a knowledge tree, contextual visualizations, and calculators beside the text.

## Start reading

Open the [book index](docs/README.md) or select a [reading route](docs/front-matter/reading-routes.md). The [notation guide](docs/front-matter/notation.md) and [glossary](docs/front-matter/glossary.md) support reference reading.

For the local web edition, use Node.js 24 LTS and npm 11:

```sh
cd atlas
npm ci
npm run dev
```

Open **http://localhost:4321**. Reading the Markdown requires no installation.

## Development

Run from `atlas/` after installation:

```sh
npm test
npm run compile:check
npm run build
```

The full quality gate also includes `npm run format:check`, `npm run lint`, and `npm run typecheck`. Browser and accessibility tests use `npm run test:e2e` against a built site; see [Atlas documentation](atlas/README.md).

**Deployment:** the build produces a static site in `atlas/apps/web/dist/`. `ATLAS_SITE` sets the deployment origin; `ATLAS_BASE` sets its path prefix (default `/`). `ATLAS_BUNDLE_DIR` optionally overrides the compiled-content directory, `atlas/.atlas`. Local reading requires no secrets.

**Compatibility:** the web edition targets current Chromium, Firefox, and Safari, with static fallbacks for popovers. Compiled content carries a schema version; unsupported versions are rejected. Published content slugs remain stable.

## Project status

**In development.** This repository contains manuscript drafts, the [editorial plan](book_plan.md), and the Atlas application. The planned scope does not imply that every chapter is complete; integrated studies are proposed exercises, not reported experimental results.
