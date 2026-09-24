/**
 * @atlas/visual/svg — server-renderable Preact renderers for the visual
 * grammar. Pure views, zero client JS by default; CSS in
 * `./visual-grammar.css` (import it once from the site's global styles).
 *
 * This entry never imports elkjs: layout happens at compile time.
 */
export { Figure, FigureBody, FigureFrame, type FigureBodyProps, type FigureFrameProps, type FigureProps } from './figure.tsx';
export { SceneSvg, EdgePath, EdgeLabel, type SceneSvgProps } from './scene.tsx';
export { EdgeSpecimen, NodeSpecimen, type NodeSpecimenProps } from './specimen.tsx';
export { NodeGlyph, NodeShape, GlyphIcon, type Box, type NodeGlyphProps } from './glyphs.tsx';
export { CalculatorView, type CalculatorViewProps } from './calculator.tsx';
export { TensorFlowView, TensorTraceView, ShapeText } from './tensor.tsx';
export { SystemsTraceTable, SystemsTraceView } from './systems.tsx';
export { MemoryStackView, Swatch } from './memory-stack.tsx';
export { StatPanelView } from './stat-panel.tsx';
export { LineageView, RELATION_GLYPH, type LineageViewProps } from './lineage.tsx';
export { MatrixView, type MatrixViewProps } from './matrix.tsx';
export { ChartView, type ChartViewProps } from './chart.tsx';
export { HierarchyView } from './hierarchy.tsx';
export { CompareView, type CompareViewProps } from './compare.tsx';
export { NeighbourhoodGraph, type NeighbourhoodGraphProps } from './neighbourhood.tsx';
export { calculatorDefaults, evaluateCalculator, sliderModel } from '../figure-math.ts';
