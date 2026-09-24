/**
 * Semantic validation of figures (VISUAL_GRAMMAR §4–5, §9). `FigureSpecSchema`
 * checks shape; this module checks meaning: formulas bind and stay finite at
 * their defaults, references resolve, graph endpoints exist, tensor dimensions
 * are declared, evidence rules hold. Returns typed issues; never throws.
 */
import {
  chapterNumberOf,
  FigureSpecSchema,
  FORBIDDEN_IN_EDITION_1,
  type DiagnosticCode,
  type FigureSpec,
  type FigureSpecOf,
  type ValueFormat,
} from '@atlas/core';
import { resolveChart } from './chart.ts';
import { evaluateCalculator, sliderModel, tryEvaluate } from './figure-math.ts';
import { collectDims } from './traces.ts';

export interface FigureValidationContext {
  /** Chapter number of the file the figure sits in; null for files outside chapters. */
  readonly chapter: number | null;
  /** True when a citation key (`P19`, `R5.13`) exists in the reference registry. */
  readonly hasCitation: (key: string) => boolean;
  /** True when a node id (`ms.section.5.2`) exists in the manifest. */
  readonly nodeExists: (id: string) => boolean;
}

export interface FigureIssue {
  readonly code: DiagnosticCode;
  readonly message: string;
}

const CITE_KEY = /^(?:P\d{2}|R\d+\.\d+)$/u;
const DERIVED_SOURCE = /^DERIVED:(?:eq|alg|fig|prop)-\d+\.\d+$/u;
const OD_SOURCE = /^OD:[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const COMMIT = /\b[0-9a-f]{7,40}\b/u;

/** Formats that express time or rates; a reported figure using them is a performance figure. */
const PERF_FORMATS: ReadonlySet<ValueFormat> = new Set<ValueFormat>(['seconds', 'bytes/s', 'flop/s']);
const PERF_WORDS =
  /\b(?:latency|latencies|throughput|utili[sz]ation|TTFT|TPOT|ITL|E2E|goodput|MFU|HFU|tokens?\/s|tok\/s|requests?\/s|req\/s|FLOP\/s|p50|p95|p99|speed-?up|time to first token|time per output token)\b/iu;
const PERF_NUMBER = /\d[\d.,]*\s*(?:ms|µs|us|ns|s|min|tok\/s|tokens\/s|req\/s|GB\/s|TB\/s|[kMGTP]?FLOP\/s|%)(?![A-Za-z])/u;

function showsPerformance(figure: FigureSpec): boolean {
  const title = PERF_WORDS.test(figure.title);
  switch (figure.kind) {
    case 'chart': {
      const { x, y } = figure.spec;
      return (
        title ||
        PERF_FORMATS.has(x.format) ||
        PERF_FORMATS.has(y.format) ||
        PERF_WORDS.test(x.label) ||
        PERF_WORDS.test(y.label) ||
        figure.spec.series.some((series) => PERF_WORDS.test(series.label))
      );
    }
    case 'stat-panel':
      return (
        title ||
        PERF_WORDS.test(figure.spec.header) ||
        figure.spec.rows.some((row) => PERF_FORMATS.has(row.format) || PERF_WORDS.test(row.key) || (row.value !== undefined && PERF_NUMBER.test(row.value)))
      );
    case 'memory-stack':
      return title || PERF_FORMATS.has(figure.spec.format);
    case 'calculator':
      return title || figure.spec.outputs.some((output) => PERF_FORMATS.has(output.format) || PERF_WORDS.test(output.label));
    case 'compare':
      return (
        (title || PERF_WORDS.test(figure.spec.axis) || figure.spec.rows.some((row) => PERF_WORDS.test(row.dimension))) &&
        figure.spec.rows.some((row) => Object.values(row.values).some((value) => PERF_NUMBER.test(value)))
      );
    case 'systems-trace':
      return figure.spec.stages.some((stage) => Object.values(stage.values).some((value) => PERF_NUMBER.test(value)));
    case 'hierarchy':
      return figure.spec.levels.some((level) => level.latency !== undefined && PERF_NUMBER.test(level.latency));
    default:
      return false;
  }
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dup.add(value);
    seen.add(value);
  }
  return [...dup];
}

type Push = (code: DiagnosticCode, message: string) => void;

function checkEnvelope(figure: FigureSpec, ctx: FigureValidationContext, push: Push): void {
  if (FORBIDDEN_IN_EDITION_1.has(figure.evidence)) {
    push('label-forbidden', `${figure.evidence} is forbidden in Edition 1.0; figures carry DERIVED/MATHEMATICALLY-DERIVED or a sourced label`);
  }
  const figureChapter = chapterNumberOf(figure.id);
  if (ctx.chapter !== null && figureChapter !== ctx.chapter) {
    push('figure-chapter-mismatch', `figure id ${figure.id} names chapter ${figureChapter ?? '?'} but sits in chapter ${ctx.chapter}`);
  }
  let citedSources = 0;
  let documentationSources = 0;
  for (const source of figure.source) {
    if (CITE_KEY.test(source)) {
      citedSources += 1;
      if (!ctx.hasCitation(source)) push('figure-reference-invalid', `source ${source} has no record in any references.md`);
    } else if (OD_SOURCE.test(source)) {
      documentationSources += 1;
    } else if (!DERIVED_SOURCE.test(source)) {
      push('figure-reference-invalid', `source '${source}' is not a citation key (P19, R5.13), DERIVED:eq-<n.m>, or OD:<doc-id>`);
    }
  }
  if (figure.evidence === 'PAPER-REPORTED' && citedSources === 0) {
    push('figure-reference-invalid', 'PAPER-REPORTED figures must cite a Pnn or Rch.n key present in references.md');
  }
  if (figure.evidence === 'OFFICIAL-DOCUMENTATION' && citedSources + documentationSources === 0) {
    push('figure-reference-invalid', 'OFFICIAL-DOCUMENTATION figures must cite an OD:<doc-id> or a references.md key');
  }
  if (figure.evidence === 'CODE-VERIFIED' && !figure.source.some((source) => COMMIT.test(source))) {
    push('code-verified-without-commit', 'CODE-VERIFIED figures must name the repository commit that was checked');
  }
  for (const concept of figure.concepts) {
    if (!ctx.nodeExists(concept)) push('figure-reference-invalid', `concept ${concept} is not a node in atlas-manifest.json`);
  }
  if ((figure.evidence === 'PAPER-REPORTED' || figure.evidence === 'OFFICIAL-DOCUMENTATION') && figure.context === undefined && showsPerformance(figure)) {
    push(
      'figure-context-missing',
      `${figure.evidence} performance figure needs context (hardware, model, precision, sequenceLength, ioDistribution, concurrency, runtimeVersion, measurementBoundary)`,
    );
  }
}

function checkDiagram(figure: FigureSpecOf<'diagram'>, push: Push): void {
  const { nodes, edges, groups } = figure.spec;
  const ids = new Set(nodes.map((node) => node.id));
  const groupIds = new Set(groups.map((group) => group.id));
  for (const dup of duplicates(nodes.map((node) => node.id))) push('figure-reference-invalid', `duplicate node id '${dup}'`);
  for (const dup of duplicates(groups.map((group) => group.id))) push('figure-reference-invalid', `duplicate group id '${dup}'`);
  for (const node of nodes) {
    if (node.group !== undefined && !groupIds.has(node.group)) push('figure-reference-invalid', `node '${node.id}' names unknown group '${node.group}'`);
  }
  edges.forEach((edge, index) => {
    if (!ids.has(edge.from)) push('figure-reference-invalid', `edge ${index + 1} starts at unknown node '${edge.from}'`);
    if (!ids.has(edge.to)) push('figure-reference-invalid', `edge ${index + 1} ends at unknown node '${edge.to}'`);
  });
}

function checkCycle(figure: FigureSpecOf<'cycle'>, push: Push): void {
  const ids = new Set(figure.spec.stages.map((stage) => stage.id));
  for (const dup of duplicates(figure.spec.stages.map((stage) => stage.id))) push('figure-reference-invalid', `duplicate stage id '${dup}'`);
  figure.spec.edges.forEach((edge, index) => {
    if (!ids.has(edge.from)) push('figure-reference-invalid', `edge ${index + 1} starts at unknown stage '${edge.from}'`);
    if (!ids.has(edge.to)) push('figure-reference-invalid', `edge ${index + 1} ends at unknown stage '${edge.to}'`);
  });
}

function checkTensorFlow(figure: FigureSpecOf<'tensor-flow'>, push: Push): void {
  const declared = new Set(Object.keys(figure.spec.dims));
  figure.spec.steps.forEach((step, index) => {
    const used: string[] = [];
    collectDims(step.shape, used);
    for (const symbol of used) {
      if (!declared.has(symbol)) push('figure-reference-invalid', `step ${index + 1} shape ${step.shape} uses dimension '${symbol}' missing from dims`);
    }
  });
}

function checkSystemsTrace(figure: FigureSpecOf<'systems-trace'>, push: Push): void {
  const columns = new Set<string>(figure.spec.columns);
  for (const dup of duplicates(figure.spec.columns)) push('figure-schema-invalid', `column '${dup}' listed twice`);
  for (const stage of figure.spec.stages) {
    for (const key of Object.keys(stage.values)) {
      if (!columns.has(key)) push('figure-reference-invalid', `stage '${stage.name}' has a value for '${key}', which is not a listed column`);
    }
  }
}

function checkMemoryStack(figure: FigureSpecOf<'memory-stack'>, push: Push): void {
  const env = figure.spec.variables;
  figure.spec.bars.forEach((bar) => {
    bar.segments.forEach((segment) => {
      if (segment.formula === undefined) return;
      const result = tryEvaluate(segment.formula, env);
      if (result.value === null) push('figure-formula-invalid', `bar '${bar.label}', segment '${segment.label}': ${result.error ?? 'error'}`);
      else if (result.value < 0) push('figure-formula-invalid', `bar '${bar.label}', segment '${segment.label}' evaluates to a negative size`);
    });
  });
  const budget = figure.spec.budget;
  if (budget?.formula !== undefined) {
    const result = tryEvaluate(budget.formula, env);
    if (result.value === null) push('figure-formula-invalid', `budget '${budget.label}': ${result.error ?? 'error'}`);
    else if (result.value <= 0) push('figure-formula-invalid', `budget '${budget.label}' must be positive`);
  }
}

function checkCalculator(figure: FigureSpecOf<'calculator'>, push: Push): void {
  const { inputs, outputs, presets } = figure.spec;
  const inputSymbols = inputs.map((input) => input.symbol);
  const outputSymbols = outputs.map((output) => output.symbol);
  for (const dup of duplicates([...inputSymbols, ...outputSymbols])) push('figure-schema-invalid', `symbol '${dup}' is defined more than once`);
  for (const input of inputs) {
    if (input.options !== undefined && !input.options.includes(input.default)) {
      push('figure-schema-invalid', `input ${input.symbol}: default ${input.default} is not one of its options`);
    }
    if (input.scale !== 'linear' && input.options === undefined && !(input.min > 0 && input.max > 0)) {
      push('figure-schema-invalid', `input ${input.symbol}: ${input.scale} scale needs a positive range`);
    }
    if (input.min > input.max) push('figure-schema-invalid', `input ${input.symbol}: min exceeds max`);
    if (input.scale === 'log2' && input.options === undefined) {
      const model = sliderModel(input);
      if (model.max < model.min) push('figure-schema-invalid', `input ${input.symbol}: no power of two lies in [${input.min}, ${input.max}]`);
    }
  }
  const evaluateAt = (values: Readonly<Record<string, number>>, where: string): void => {
    for (const result of evaluateCalculator(figure.spec, values)) {
      if (result.value === null) push('figure-formula-invalid', `output ${result.symbol} ${where}: ${result.error ?? 'error'}`);
    }
  };
  const defaults: Record<string, number> = {};
  for (const input of inputs) defaults[input.symbol] = input.default;
  evaluateAt(defaults, 'at defaults');
  // Each control's extremes (others at default) must also stay finite: the reader can reach them.
  const beforeExtremes = defaults;
  for (const input of inputs) {
    const reachable = input.options ?? [input.min, input.max];
    for (const value of reachable) {
      const probe = { ...beforeExtremes, [input.symbol]: value };
      for (const result of evaluateCalculator(figure.spec, probe)) {
        if (result.value === null) {
          push('figure-formula-invalid', `output ${result.symbol} at ${input.symbol} = ${value}: ${result.error ?? 'error'}`);
        }
      }
    }
  }
  presets.forEach((preset) => {
    for (const key of Object.keys(preset.values)) {
      if (!inputSymbols.includes(key)) push('figure-reference-invalid', `preset '${preset.label}' sets '${key}', which is not an input`);
    }
    evaluateAt({ ...defaults, ...preset.values }, `in preset '${preset.label}'`);
  });
}

function checkStatPanel(figure: FigureSpecOf<'stat-panel'>, push: Push): void {
  for (const row of figure.spec.rows) {
    if (row.formula === undefined) continue;
    const result = tryEvaluate(row.formula, figure.spec.variables);
    if (result.value === null) push('figure-formula-invalid', `row '${row.key}': ${result.error ?? 'error'}`);
  }
  const glyph = figure.spec.glyph;
  if (glyph?.type === 'dots' && glyph.filled > glyph.total) push('figure-schema-invalid', `dot glyph fills ${glyph.filled} of ${glyph.total}`);
}

function checkLineage(figure: FigureSpecOf<'lineage'>, ctx: FigureValidationContext, push: Push): void {
  for (const entry of figure.spec.entries) {
    if (entry.cite !== undefined && !ctx.hasCitation(entry.cite)) push('figure-reference-invalid', `lineage entry '${entry.work}' cites ${entry.cite}, which has no references.md record`);
    if (entry.node !== undefined && !ctx.nodeExists(entry.node)) push('figure-reference-invalid', `lineage entry '${entry.work}' links unknown node ${entry.node}`);
  }
}

function checkMatrix(figure: FigureSpecOf<'matrix'>, push: Push): void {
  const spec = figure.spec;
  if (spec.pattern === 'explicit') {
    const cells = spec.cells;
    if (cells === undefined) push('figure-schema-invalid', 'explicit matrix needs cells');
    else if (cells.length !== spec.rows || cells.some((row) => row.length !== spec.cols)) {
      push('figure-schema-invalid', `cells must be ${spec.rows} rows × ${spec.cols} columns`);
    }
  } else if (spec.cells !== undefined) {
    push('figure-schema-invalid', `cells are only used with pattern: explicit (pattern is ${spec.pattern})`);
  }
  if ((spec.pattern === 'banded' || spec.pattern === 'block-diagonal' || spec.pattern === 'prefix' || spec.pattern === 'dilated') && spec.parameter === undefined) {
    push('figure-schema-invalid', `pattern ${spec.pattern} needs parameter`);
  }
  if (spec.rowTicks !== undefined && spec.rowTicks.length !== spec.rows) push('figure-schema-invalid', `rowTicks has ${spec.rowTicks.length} entries for ${spec.rows} rows`);
  if (spec.colTicks !== undefined && spec.colTicks.length !== spec.cols) push('figure-schema-invalid', `colTicks has ${spec.colTicks.length} entries for ${spec.cols} columns`);
  for (const cell of spec.highlight) {
    if (cell.row >= spec.rows || cell.col >= spec.cols) push('figure-schema-invalid', `highlight (${cell.row}, ${cell.col}) lies outside the ${spec.rows} × ${spec.cols} matrix`);
  }
}

function checkChart(figure: FigureSpecOf<'chart'>, push: Push): void {
  const spec = figure.spec;
  for (const dup of duplicates(spec.series.map((series) => series.id))) push('figure-schema-invalid', `duplicate series id '${dup}'`);
  for (const [name, axis] of [['x', spec.x] as const, ['y', spec.y] as const]) {
    if (axis.domain !== undefined && !(axis.domain[0] < axis.domain[1])) push('figure-schema-invalid', `${name} domain must be increasing`);
    if (axis.scale !== 'linear' && axis.domain !== undefined && axis.domain[0] <= 0) push('figure-schema-invalid', `${name} axis is ${axis.scale} but its domain is not positive`);
    if (axis.scale !== 'linear' && axis.ticks?.some((tick) => tick <= 0) === true) push('figure-schema-invalid', `${name} axis is ${axis.scale} but has non-positive ticks`);
  }
  if (spec.type === 'bar') {
    const categories = spec.categories;
    if (categories === undefined || categories.length === 0) push('figure-schema-invalid', 'bar charts need categories');
    for (const series of spec.series) {
      if (series.values === undefined) push('figure-schema-invalid', `bar series '${series.id}' needs values`);
      else if (categories !== undefined && series.values.length !== categories.length) {
        push('figure-schema-invalid', `bar series '${series.id}' has ${series.values.length} values for ${categories.length} categories`);
      }
      if (series.points !== undefined || series.formula !== undefined) push('figure-schema-invalid', `bar series '${series.id}' must use values, not points or formula`);
    }
  } else {
    for (const series of spec.series) {
      const sources = [series.points !== undefined, series.formula !== undefined, series.values !== undefined].filter(Boolean).length;
      if (sources !== 1) push('figure-schema-invalid', `series '${series.id}' needs exactly one of points or formula (values are for bar charts)`);
      if (series.formula !== undefined && series.sample === undefined && spec.x.domain === undefined) {
        push('figure-schema-invalid', `series '${series.id}' has a formula but no sample range`);
      }
      if (series.sample !== undefined && spec.x.scale !== 'linear' && !(series.sample.from > 0 && series.sample.to > 0)) {
        push('figure-schema-invalid', `series '${series.id}' samples non-positive x on a ${spec.x.scale} axis`);
      }
    }
  }
  if (spec.categories !== undefined && spec.type !== 'bar') push('figure-schema-invalid', 'categories are only used by bar charts');
  const resolved = resolveChart(spec);
  for (const series of resolved.series) {
    const source = spec.series.find((entry) => entry.id === series.id);
    if (series.error !== null && source?.formula !== undefined) push('figure-formula-invalid', `series '${series.id}' ${series.error}`);
    if (spec.y.scale !== 'linear' && series.points.some(([, y]) => y <= 0)) {
      push(source?.formula !== undefined ? 'figure-formula-invalid' : 'figure-schema-invalid', `series '${series.id}' has non-positive values on a ${spec.y.scale} y axis`);
    }
    if (spec.x.scale !== 'linear' && spec.type !== 'bar' && series.points.some(([x]) => x <= 0)) {
      push('figure-schema-invalid', `series '${series.id}' has non-positive x on a ${spec.x.scale} x axis`);
    }
  }
}

function checkCompare(figure: FigureSpecOf<'compare'>, ctx: FigureValidationContext, push: Push): void {
  const columnIds = new Set(figure.spec.columns.map((column) => column.id));
  for (const dup of duplicates(figure.spec.columns.map((column) => column.id))) push('figure-reference-invalid', `duplicate column id '${dup}'`);
  for (const column of figure.spec.columns) {
    if (column.node !== undefined && !ctx.nodeExists(column.node)) push('figure-reference-invalid', `column '${column.label}' links unknown node ${column.node}`);
  }
  for (const row of figure.spec.rows) {
    for (const key of Object.keys(row.values)) {
      if (!columnIds.has(key)) push('figure-reference-invalid', `row '${row.dimension}' has a value for unknown column '${key}'`);
    }
  }
}

/** Semantic checks for a schema-valid figure. An empty array means the figure is valid. */
export function validateFigure(figure: FigureSpec, ctx: FigureValidationContext): FigureIssue[] {
  const issues: FigureIssue[] = [];
  const push: Push = (code, message) => {
    issues.push({ code, message: `${figure.id}: ${message}` });
  };
  checkEnvelope(figure, ctx, push);
  switch (figure.kind) {
    case 'diagram':
      checkDiagram(figure, push);
      break;
    case 'cycle':
      checkCycle(figure, push);
      break;
    case 'tensor-flow':
      checkTensorFlow(figure, push);
      break;
    case 'systems-trace':
      checkSystemsTrace(figure, push);
      break;
    case 'memory-stack':
      checkMemoryStack(figure, push);
      break;
    case 'calculator':
      checkCalculator(figure, push);
      break;
    case 'stat-panel':
      checkStatPanel(figure, push);
      break;
    case 'lineage':
      checkLineage(figure, ctx, push);
      break;
    case 'matrix':
      checkMatrix(figure, push);
      break;
    case 'chart':
      checkChart(figure, push);
      break;
    case 'hierarchy':
      break;
    case 'compare':
      checkCompare(figure, ctx, push);
      break;
  }
  return issues;
}

export interface ParsedFigure {
  readonly figure: FigureSpec | null;
  readonly issues: FigureIssue[];
}

/** Schema-parses untrusted figure data (e.g. YAML output). Convenience for callers and tests. */
export function parseFigure(raw: unknown): ParsedFigure {
  const parsed = FigureSpecSchema.safeParse(raw);
  if (parsed.success) return { figure: parsed.data, issues: [] };
  const issues = parsed.error.issues.map((problem) => {
    const code: DiagnosticCode = problem.path.includes('evidence') && problem.message.includes('EMPIRICALLY-OBSERVED') ? 'label-forbidden' : 'figure-schema-invalid';
    return { code, message: `${problem.path.join('.') || 'figure'}: ${problem.message}` };
  });
  return { figure: null, issues };
}
