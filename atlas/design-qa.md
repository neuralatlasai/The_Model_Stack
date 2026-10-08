# Content-page visual review

Final result: passed

Reviewed 2026-10-08. Scope: the shared presentation of all 194 authored content
routes, including 120 topic articles. This review does not certify completion
of the planned 66-chapter manuscript or every scientific claim.

## Reference and implementation

The latest visual target is [AI Futures Model](https://www.aifuturesmodel.com/),
particularly the screenshot supplied by the user: compact ET Book masthead,
Geist running text, a narrow Explanation column, adjacent scientific visuals,
green ink, small monospace labels, and thin rules. The supplied
[AI 2027 research articles](https://ai-2027.com/research),
[Compute Forecast](https://ai-2027.com/research/compute-forecast),
[AI Goals Forecast](https://ai-2027.com/research/ai-goals-forecast), and
[AI 2027](https://ai-2027.com/) informed source-linked research presentation.
The later AI Futures screenshot determines the opening composition.

Live implementation:

- http://localhost:4321/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation/
- http://localhost:4321/ch07-data-provenance-acquisition-and-dataset-semantics/07-3-acquisition-and-extraction/
- http://localhost:4321/ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence/
- http://localhost:4321/ch02-mathematical-and-statistical-foundations/

Evidence directory:
`C:/Users/heman/AppData/Local/Temp/model-stack-workspace-review/`.
Reference and implementation were compared together as image inputs, including
focused header, Explanation, and visualization crops. Browser capture used the
installed Playwright fallback because the in-app browser runtime was unavailable.

The primary pair uses identical 1275 x 623 CSS-pixel viewports at DPR 1. Browser
chrome is excluded. The user's browser screenshot includes browser chrome and
appears zoomed; measurements use the live reference at the normalized viewport.
Additional implementation views cover 1440 x 900, tablet 900 x 900, mobile
390 x 844, and dark mode.

## Fidelity surfaces

| Surface                    | Final implementation and evidence                                                                                                                                                                                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fonts and hierarchy        | Locally served ET Book bold 30px/36px masthead; Geist 14px/21px desktop running text; small monospace section labels. Mobile opening text uses 15px/23px and a 24px/30px masthead. Math and code retain their notation fonts. Local licenses and provenance accompany both font families.                                                                                |
| Layout and spacing         | 32px desktop margins, 84px header, 300px Explanation column, 16px gap, and two adjacent authored scientific objects. The complete technical manuscript continues below. Contents and book navigation use native popovers, preserving the open workspace.                                                                                                                 |
| Colors and surfaces        | Reference paper #fffff8, green #2d6845 links and plotted emphasis, dark ink, thin rules, open figures, and compact controls. Existing dark tokens remain available and were inspected separately.                                                                                                                                                                        |
| Assets and figures         | Actual manuscript charts, calculators, diagrams, and hierarchies are selected for the opening. Chart previews use 440 x 390 geometry with readable direct labels. Wide equations and tall diagrams have bounded keyboard-accessible inspection. Full figure links reach canonical content. No decorative replacement images or invented forecast values were introduced. |
| Copy and technical objects | The book retains its technical content. Known derivation identifiers display as linked Eq. N references, citations share the text baseline, explicit section lists have consistent spacing, and inspection dimensions use definition rows. Tables, captions, algorithms, lineage labels, and comparison axes share the running-text hierarchy.                           |

The content and scientific graphics necessarily differ from the reference
forecasting application. The book's quantities, units, argument, source context,
and controls determine their labels and chart axes. The manuscript is neither
replaced by the reference's copy nor shortened to reproduce its paragraph count.

## Iteration and severity review

| Finding                                                                                   | Severity | Resolution                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Oversized literary hero, serif body, permanent right outline                              | P1       | Replaced throughout authored content pages with the compact explanation-and-visuals composition.                                                                               |
| Small red chart previews and inflated SVG scale                                           | P1       | Green reference palette, readable preview geometry, restrained maximum width, canonical full-size access.                                                                      |
| Unreadable wide diagrams in opening panels                                                | P1       | Select legible authored objects first; tall diagrams scroll safely from the top. Acquisition now opens with its calculator and source-reference hierarchy.                     |
| Mismatched body sizes, raised citations, raw known derivation IDs, dense inspection prose | P2       | Shared 14px/21px hierarchy, baseline citations, registry-backed equation labels, explicit section spacing, semantic dimension rows.                                            |
| Serif comparison-axis labels and long statistics/calculator labels                        | P2       | Shared sans-serif labels, bounded grid columns, wrapping values, and complete canonical figures. Final statistics-panel measurements confirm values remain inside their panel. |
| Nested links inside disclosure summaries                                                  | P1       | Summary references remain resolved and readable as static spans; body references retain active links.                                                                          |
| Unfocusable calculator equation scroller                                                  | P1       | Named, focusable equation region with a visible focus outline.                                                                                                                 |

No unresolved P0, P1, or P2 visual issue remains in the reviewed samples. Tall
scientific diagrams intentionally require inspection; they remain complete in
the manuscript and accessible through the preview region and Full figure link.

## Verification

- Full route audit: 194/194 authored routes returned HTTP 200, selected the shared
  workspace layout, and rendered exactly one H1. All 2,162 canonical region
  anchors, 435 figure bodies (417 structured and 18 Mermaid-derived), 416
  equation blocks, and 15 code listings remained present. No duplicate canonical
  IDs or omitted figure provenance were found. The audit's snapshot and final
  bundle contained identical document payloads despite a manifest timestamp
  change. Evidence: `audit.json`.
- Final screenshots: `reference-1275-final.png`, `quality-1275-final.png`,
  `acquisition-1275-final.png`, `evidence-1275-final.png`,
  `quality-1440-final.png`, `quality-mobile-final.png`,
  `acquisition-tablet-final.png`, `quality-dark-final.png`, and
  `problem-mobile-final.png`. No page overflow or browser errors in these views.
- Focused content captures: `inline-derivations-final.png`,
  `inline-citations-final.png`, `inspection-dimensions-final.png`, and
  `quality-methodology-final.png`.
- All 567 unit/integration tests passed; strict ESLint passed; TypeScript and
  Astro checks passed with zero errors or warnings. One existing copy-fallback
  deprecation hint remains.
- All 11 final browser regressions passed, covering the shared composition,
  independent calculator state/reset, content preservation, citations, summary
  interactions, native navigation, reading tools, legacy depth preferences,
  mobile, no-JavaScript reading, full-size figures, and open derivations.
- Final production build passed: 1,802 generated pages. Its existing large-chunk
  warning concerns the visualization bundle and does not indicate missing pages.
- Final Axe checks across six desktop/mobile/dark samples found zero WCAG 2 A/AA
  or 2.1 A/AA violations and zero console/page errors. Incomplete checks are
  recorded for manual review, including contrast and isolated table/ARIA checks;
  they are not counted as automated passes. Evidence: `accessibility-final.json`.

Existing corpus compiler diagnostics, unresolved scientific references, and
planned unwritten topics remain content-authoring work. They are not hidden by
this layout, and this visual review makes no claim that all 66 chapters are
finished. The existing repository-wide formatting baseline is outside this
visual change; modified presentation files received focused formatting checks.

Final result: passed
