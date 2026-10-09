# Research atlas visual QA

Final result: passed sampled browser checks. No numerical design rating is asserted.

## Direction

AI Futures is the user-selected local benchmark: warm paper, serif headings, thin rules, open instruments, restrained accent colors. External references are AI 2027, its compute forecast, AI Futures, and AI 2040. Chapter width intentionally follows the user's latest full-width requirement rather than the narrower reference manuscript measure.

## Changes

- Chapter and section manuscripts use the available viewport width with 24px desktop and 16px mobile gutters. The context panel opens on demand instead of reserving a permanent column. Prose, captions, and scientific figures retain the editorial typography.
- Desktop previews use two columns when multiple figures are available; narrow screens stack them. Captions and source links remain visible.
- Tensor figures have a real, interactive WebGL volume companion with orbit, keyboard rotation, step selection, reset, and a complete fallback trace. Illustrative dimensions are labeled.
- All 66 dashboard chapter badges use distinct, accessible topic symbols; chapter links and titles remain intact.
- Library, Papers, Figures, Evals, Labs, Systems, Graph routes, Compare, Terms, Equations, and timeline readouts use open ruled layouts instead of boxed cards. Route chapter links flow as underlined text, with the full route visible. Systems entries have open text links with monograms.
- Replaced the repeated masthead fingerprint with 13 distinct subject-specific illustrations: turning manuscript pages, citation orbits, separated systems layers, laboratory bubbles, a figure trace, a pendulum, an evaluation sweep, branching futures, a dependency network, a timeline, a concept flower, a balance, and visual grammar marks. They are illustrative rather than quantitative plots. Each supports play/pause, drag, click exploration, arrow keys, and an alternate view; reduced-motion users start paused. No visible text or card surrounds them.
- The homepage brain retains its existing 3D mesh and interactions. Softer ivory shading, reduced crease contrast, matte highlights, muted directional fibers, a lighter contact shadow, and a quiet ink-colored dot field integrate it with the paper theme.

## Evidence

Local artifacts are in artifacts/chapter-polish/ (ignored by git).

- Reference captures: reference-compute.png, reference-2027.png, reference-2040.png, reference-futures.png.
- Local benchmark: ai-futures-benchmark.png.
- Full-width chapter: chapter-final.png, chapter-final-mobile.png; comparison.png pairs the reference and chapter at 1440 x 1000 CSS pixels.
- Indexes: library-editorial-desktop.png and corresponding desktop/mobile captures for six index routes.
- Brain: brain-refined.png, home-refined.png, home-refined-mobile.png.
- Tensor: tensor-3d.png and tensor-3d-mobile.png.

## Verification

- Twelve chapter/section routes sampled on desktop and mobile: no document overflow, broken raster images, or browser page errors. Caption disclosure, calculator controls, and the collapsible context panel exercised.
- Width checks at 1199, 1024, 768, and 390px: content reaches the intended gutters without page overflow.
- Six index routes sampled on desktop and mobile: no mobile overflow or browser page errors. Readout borders/radii/shadows checked; Library and Systems selection exercised.
- All 66 dashboard badges have unique symbols, valid links, and no numeric badge text.
- Homepage WebGL brain renders on desktop and mobile without browser errors or mobile overflow.
- Tensor selection, keyboard orbit/reset, and WebGL-disabled fallback checked.
- Astro type check: zero errors/warnings, one existing deprecated-copy hint. Changed-file lint and production build checked.

Browser sampling does not constitute a manual visual review of all 165 compiled chapter and section pages. Existing large-chunk build warnings remain.

## Interactive masthead follow-up

- All 13 main-page drawings have distinct SVG contents. Browser checks exercised play/pause, keyboard exploration, click exploration, and alternate views on every page.
- No mobile document overflow or browser page errors across those 13 routes. See instruments-verification.json and instruments-board.png.
- Actual animation transforms change while playing and remain stable when paused; pointer dragging changes the exploration state. See verify-motion.mjs.
- route-open.png verifies the formerly boxed route readout now flows directly on paper, with complete underlined chapter links.

## Release review

- Chapter references and verification pages now inherit the full-width manuscript layout, including all 25 Chapter 2 source records. Reference titles and inspection notes use the editorial serif; long links wrap safely.
- Citation timelines omit crowded intermediate year labels while retaining every source mark and both endpoint years.
- All 44 references/verification routes checked at desktop and mobile widths: no document overflow or browser page errors (auxiliary-verification.json).
- Search dependency is prebundled so the first palette request does not trigger a late development dependency reload.
- Maintained browser checks cover full-width article composition, source retention, citations, native contents, calculators, reading modes, mobile navigation, and the 13 interactive mastheads.
- Release gates: formatting, lint, typecheck, 580 unit tests, production build for /The_Model_Stack/, and the full static link checker. The latter checked 659,152 internal links with zero broken links, missing fragments, or URLs outside the deployment base.
- /version.json identifies the package version and exact Git commit compiled by the deployment workflow. Deployment verification must match this commit to main before sharing for review.

- The Equations catalogue defers offscreen row layout without forcing their geometry during metadata measurement. Visible-row updates refresh symbol overflow indicators; focused/hovered rows and print output render fully. The live masthead is isolated from catalogue painting. A real pointer check exercised play, pause, and mobile resize in approximately 6.5 seconds with no overflow.

- Final maintained browser suite: all 28 tests passed. Reduced-motion mode starts paused; explicitly choosing Play enables gentle local motion. Focus outlines remain inside the isolated illustration boundary.

- Production route selection strips the GitHub Pages base prefix before choosing each page's illustration. The static release checker now rejects illustrations whose topic differs from their built route, preventing repeated fallback visuals after deployment.
