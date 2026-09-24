/**
 * @atlas/visual — the visual grammar of the Research Atlas (docs/VISUAL_GRAMMAR.md).
 *
 * Pure TypeScript, runs on Node type stripping: Mermaid-subset parser, trace
 * parsers, semantic figure validation, ELK/deterministic layout to `Scene`,
 * generated text equivalents, and the numeric helpers the renderers share.
 * The Preact renderers live under `@atlas/visual/svg`.
 */
export { parseMermaid, type MermaidIssue, type MermaidParseResult } from './mermaid.ts';
export { collectDims, parseSystemsTrace, parseTensorTrace, type ParsedSystemsTrace, type ParsedTensorTrace } from './traces.ts';
export { parseFigure, validateFigure, type FigureIssue, type FigureValidationContext, type ParsedFigure } from './validate.ts';
export {
  layoutCycle,
  layoutDiagram,
  layoutFigure,
  layoutNeighbourhood,
  NEIGHBOURHOOD_CAP,
  NEIGHBOURHOOD_HEADINGS,
  type NeighbourhoodInput,
} from './layout/index.ts';
export { describeFigure } from './describe.ts';
export {
  allocateCells,
  calculatorDefaults,
  compileCached,
  evaluateCalculator,
  evaluateMemoryStack,
  evaluateStatPanel,
  formatOrDash,
  sliderModel,
  tryEvaluate,
  type CalculatorInput,
  type CalculatorOutputValue,
  type Evaluation,
  type SliderModel,
  type StackValues,
  type StatRowValue,
} from './figure-math.ts';
export { logTicks, makeScale, niceLinearTicks, resolveChart, samplePositions, seriesValueAt, unitScales, type ResolvedChart, type ResolvedSeries, type Scale, type ScaleKind, type UnitScales } from './chart.ts';
export {
  BUDGET_KEY,
  CURSOR_VARIABLE,
  evaluateFigureState,
  resolveFigureStates,
  segmentKey,
  type FigureStateValue,
  type FigureStateValues,
  type ResolvedFigureState,
} from './state.ts';
export { MATRIX_PATTERN_TEXT, matrixCell, matrixCells, matrixSummary, type MatrixSummary } from './matrix.ts';
export { GLYPH_INSET, measureNode, NODE_TYPE, placeNodeText, type MeasuredNode, type PlacedLine } from './node-geometry.ts';
export { linesWidth, textWidth, wrapText, type TextFamily } from './text-metrics.ts';
