/**
 * Generated text equivalents (VISUAL_GRAMMAR §8, UI_UX §60). The compiler
 * appends this to the author's `alt`, so every figure is navigable as text:
 * node and edge lists in reading order, tensor steps, stage × column cells,
 * computed values at their defaults, sampled series values.
 */
import { formatValue, type ChartSpec, type FigureSpec, type FigureSpecOf, type ValueFormat } from '@atlas/core';
import { resolveChart } from './chart.ts';
import { calculatorDefaults, evaluateCalculator, evaluateMemoryStack, evaluateStatPanel } from './figure-math.ts';
import { MATRIX_PATTERN_TEXT, matrixSummary } from './matrix.ts';

const EDGE_KIND_TEXT = { flow: '', dependency: ' (dependency)', feedback: ' (feedback)', emphasis: ' (main path)' } as const;

function fmt(value: number | null, format: ValueFormat): string {
  return value === null ? 'not computable' : formatValue(value, format);
}

function percent(part: number, whole: number): string {
  if (whole <= 0) return '0 %';
  const share = (part / whole) * 100;
  return `${share >= 10 ? share.toFixed(0) : share.toFixed(1)} %`;
}

function sentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?]$/u.test(trimmed) ? trimmed : `${trimmed}.`;
}

function describeDiagram(figure: FigureSpecOf<'diagram'>): string[] {
  const { nodes, edges, groups, direction } = figure.spec;
  const name = new Map(nodes.map((node) => [node.id, node.sub === undefined ? node.label : `${node.label} ${node.sub}`]));
  const groupName = new Map(groups.map((group) => [group.id, group.label]));
  const lines = [
    `Diagram, ${direction === 'LR' ? 'left to right' : 'top to bottom'}: ${nodes.length} nodes, ${edges.length} edges${groups.length > 0 ? `, ${groups.length} groups` : ''}.`,
    sentence(
      `Nodes: ${nodes
        .map((node) => {
          const traits = [node.kind, ...(node.emphasis ? ['emphasised'] : []), ...(node.group === undefined ? [] : [`in ${groupName.get(node.group) ?? node.group}`])];
          return `${name.get(node.id) ?? node.id} (${traits.join(', ')})`;
        })
        .join('; ')}`,
    ),
  ];
  if (edges.length > 0) {
    lines.push(
      sentence(
        `Edges: ${edges
          .map((edge) => `${name.get(edge.from) ?? edge.from} → ${name.get(edge.to) ?? edge.to}${EDGE_KIND_TEXT[edge.kind]}${edge.label === undefined ? '' : ` “${edge.label}”`}`)
          .join('; ')}`,
      ),
    );
  }
  return lines;
}

function describeTensorFlow(figure: FigureSpecOf<'tensor-flow'>): string[] {
  const dims = Object.entries(figure.spec.dims).map(([symbol, meaning]) => `${symbol} = ${meaning}`);
  return [
    `Tensor flow over ${dims.length} dimensions: ${dims.join(', ')}.`,
    ...figure.spec.steps.map((step, index) => {
      const parts = [`Step ${index + 1}:`];
      if (step.op !== undefined) parts.push(`${step.op} →`);
      parts.push(step.shape);
      if (step.label !== undefined) parts.push(`(${step.label})`);
      let line = parts.join(' ');
      if (step.cost !== undefined) line += `; cost ${step.cost}`;
      return sentence(line);
    }),
  ];
}

function describeSystemsTrace(figure: FigureSpecOf<'systems-trace'>): string[] {
  const { columns, stages } = figure.spec;
  return [
    `Systems trace: ${stages.length} stages × ${columns.join(', ')}.`,
    ...stages.map((stage, index) => {
      const cells = columns.map((column) => {
        const value = stage.values[column];
        return value === undefined || value === '' ? null : `${column} ${value}`;
      });
      const filled = cells.filter((cell): cell is string => cell !== null);
      return sentence(`Stage ${index + 1}, ${stage.name}${stage.emphasis ? ' (emphasised)' : ''}: ${filled.length > 0 ? filled.join('; ') : 'no values'}`);
    }),
  ];
}

function describeMemoryStack(figure: FigureSpecOf<'memory-stack'>): string[] {
  const format = figure.spec.format;
  const values = evaluateMemoryStack(figure.spec);
  const lines = [`Stacked ${values.bars.length === 1 ? 'bar' : 'bars'}; segments listed from the base of each bar.`];
  for (const bar of values.bars) {
    const segments = bar.segments.map((segment) => `${segment.label} ${fmt(segment.value, format)}${segment.value === null ? '' : ` (${percent(segment.value, bar.total)})`}`);
    lines.push(sentence(`${bar.label}: ${segments.join('; ')}; total ${fmt(bar.total, format)}`));
  }
  const budget = values.budget;
  if (budget !== null) {
    const budgetValue = budget.value;
    const verdicts =
      budgetValue === null
        ? []
        : values.bars.map((bar) =>
            bar.total > budgetValue ? `${bar.label} exceeds it by ${fmt(bar.total - budgetValue, format)}` : `${bar.label} fits with ${fmt(budgetValue - bar.total, format)} to spare`,
          );
    lines.push(sentence(`Budget ${budget.label}: ${fmt(budgetValue, format)}${verdicts.length > 0 ? `; ${verdicts.join('; ')}` : ''}`));
  }
  return lines;
}

function describeCalculator(figure: FigureSpecOf<'calculator'>): string[] {
  const spec = figure.spec;
  const defaults = calculatorDefaults(spec);
  const outputs = evaluateCalculator(spec, defaults);
  const lines = [sentence(`Calculator${spec.equation === undefined ? '' : ` for Eq. ${spec.equation}`}: ${spec.tex}`)];
  lines.push(
    sentence(
      `Inputs at their defaults: ${spec.inputs
        .map((input) => {
          const range =
            input.options !== undefined
              ? `options ${input.options.map((option) => formatValue(option, input.format)).join(', ')}`
              : `range ${formatValue(input.min, input.format)} to ${formatValue(input.max, input.format)}${input.scale === 'log2' ? ' in powers of two' : input.scale === 'log10' ? ', logarithmic' : ''}`;
          return `${input.label} ${input.symbol} = ${formatValue(input.default, input.format)} (${range})`;
        })
        .join('; ')}`,
    ),
  );
  lines.push(sentence(`Outputs: ${outputs.map((output) => `${output.label} ${output.symbol} = ${fmt(output.value, output.format)}${output.emphasis ? ' (primary)' : ''}`).join('; ')}`));
  for (const preset of spec.presets) {
    const values = evaluateCalculator(spec, { ...defaults, ...preset.values });
    const set = Object.entries(preset.values).map(([symbol, value]) => `${symbol} = ${value}`);
    lines.push(sentence(`Preset ${preset.label} (${set.join(', ')}): ${values.map((output) => `${output.symbol} = ${fmt(output.value, output.format)}`).join('; ')}`));
  }
  return lines;
}

function describeStatPanel(figure: FigureSpecOf<'stat-panel'>): string[] {
  const rows = evaluateStatPanel(figure.spec);
  const lines = [
    sentence(
      `Instrument ${figure.spec.header}: ${rows
        .map((row) => `${row.key} ${row.text.unit === '' ? row.text.value : `${row.text.value} ${row.text.unit}`}${row.note === null ? '' : ` (${row.note})`}`)
        .join('; ')}`,
    ),
  ];
  const glyph = figure.spec.glyph;
  if (glyph?.type === 'dots') {
    const legend = glyph.legend.map((entry) => `${entry.marker} = ${entry.label}${entry.value === undefined ? '' : ` ${entry.value}`}`);
    lines.push(sentence(`Dot glyph: ${glyph.filled} of ${glyph.total} filled${legend.length > 0 ? `; ${legend.join('; ')}` : ''}`));
  } else if (glyph?.type === 'blocks') {
    const total = glyph.items.reduce((sum, item) => sum + item.weight, 0);
    lines.push(sentence(`Block glyph: ${glyph.items.map((item) => `${item.label} ${percent(item.weight, total)}${item.emphasis ? ' (emphasised)' : ''}`).join('; ')}`));
  }
  return lines;
}

function describeLineage(figure: FigureSpecOf<'lineage'>): string[] {
  return [
    `Lineage, ${figure.spec.entries.length} entries in order.`,
    ...figure.spec.entries.map((entry) =>
      sentence(`${entry.year}: ${entry.work}${entry.cite === undefined ? '' : ` [${entry.cite}]`} — ${entry.relation}${entry.note === undefined ? '' : `; ${entry.note}`}`),
    ),
  ];
}

function describeCycle(figure: FigureSpecOf<'cycle'>): string[] {
  const { stages, edges } = figure.spec;
  const position = new Map(stages.map((stage, index) => [stage.id, index]));
  const name = new Map(stages.map((stage) => [stage.id, stage.label]));
  const forward: string[] = [];
  const feedback: string[] = [];
  for (const edge of edges) {
    const text = `${name.get(edge.from) ?? edge.from} → ${name.get(edge.to) ?? edge.to}${edge.label === undefined ? '' : ` “${edge.label}”`}`;
    const upstream = (position.get(edge.to) ?? 0) <= (position.get(edge.from) ?? 0);
    (edge.kind === 'feedback' || upstream ? feedback : forward).push(text);
  }
  const lines = [sentence(`Cycle of ${stages.length} stages, top to bottom: ${stages.map((stage) => `${stage.label} (${stage.kind}${stage.sub === undefined ? '' : `, ${stage.sub}`})`).join(', ')}`)];
  if (forward.length > 0) lines.push(sentence(`Forward flow: ${forward.join('; ')}`));
  if (feedback.length > 0) lines.push(sentence(`Feedback loops: ${feedback.join('; ')}`));
  return lines;
}

function describeMatrix(figure: FigureSpecOf<'matrix'>): string[] {
  const spec = figure.spec;
  const summary = matrixSummary(spec);
  const parameter = spec.parameter === undefined ? '' : ` (parameter ${spec.parameter})`;
  const lines = [
    `${spec.rows} × ${spec.cols} matrix; rows: ${spec.rowLabel}; columns: ${spec.colLabel}.`,
    sentence(`Pattern ${MATRIX_PATTERN_TEXT[spec.pattern]}${parameter}`),
    spec.pattern === 'explicit'
      ? `${summary.admitted} of ${summary.total} cells non-zero; total intensity ${summary.mass.toFixed(2)}.`
      : `${summary.admitted} of ${summary.total} cells admitted (${percent(summary.admitted, summary.total)}).`,
  ];
  if (spec.highlight.length > 0) lines.push(sentence(`Highlighted cells (row, column): ${spec.highlight.map((cell) => `(${cell.row}, ${cell.col})`).join(', ')}`));
  if (spec.legend !== undefined) lines.push(sentence(`Legend: ${spec.legend}`));
  return lines;
}

function axisText(name: string, axis: ChartSpec['x']): string {
  const scale = axis.scale === 'linear' ? 'linear' : `${axis.scale} scale`;
  const domain = axis.domain === undefined ? '' : `, ${formatValue(axis.domain[0], axis.format)} to ${formatValue(axis.domain[1], axis.format)}`;
  return `${name}: ${axis.label} (${scale}${domain})`;
}

function samplesOf<T>(items: readonly T[], count: number): T[] {
  if (items.length <= count) return [...items];
  const out: T[] = [];
  for (let k = 0; k < count; k += 1) {
    const item = items[Math.round((k * (items.length - 1)) / (count - 1))];
    if (item !== undefined && !out.includes(item)) out.push(item);
  }
  return out;
}

function describeChart(figure: FigureSpecOf<'chart'>): string[] {
  const spec = figure.spec;
  const resolved = resolveChart(spec);
  const lines = [sentence(`${spec.type.charAt(0).toUpperCase()}${spec.type.slice(1)} chart. ${axisText('x', spec.x)}; ${axisText('y', spec.y)}`)];
  for (const series of resolved.series) {
    const traits = [series.emphasis ? 'emphasised' : null, series.dashed ? 'dashed' : null].filter((trait): trait is string => trait !== null);
    const head = `Series ${series.label}${traits.length > 0 ? ` (${traits.join(', ')})` : ''}`;
    if (series.error !== null && series.points.length === 0) {
      lines.push(sentence(`${head}: not computable`));
      continue;
    }
    const values =
      spec.type === 'bar'
        ? series.points.map(([index, y]) => `${spec.categories?.[index] ?? `#${index + 1}`} ${formatValue(y, spec.y.format)}`)
        : samplesOf(series.points, 5).map(([x, y]) => `at ${formatValue(x, spec.x.format)}, ${formatValue(y, spec.y.format)}`);
    lines.push(sentence(`${head}: ${values.join('; ')}`));
  }
  for (const annotation of spec.annotations) {
    lines.push(sentence(`Annotation at x = ${formatValue(annotation.x, spec.x.format)}${annotation.y === undefined ? '' : `, y = ${formatValue(annotation.y, spec.y.format)}`}: ${annotation.label}`));
  }
  return lines;
}

function describeHierarchy(figure: FigureSpecOf<'hierarchy'>): string[] {
  const { levels, direction } = figure.spec;
  return [
    `Hierarchy of ${levels.length} levels, ${direction === 'down' ? 'top to bottom' : 'bottom to top'}.`,
    ...levels.map((level, index) => {
      const metrics = [
        level.capacity === undefined ? null : `capacity ${level.capacity}`,
        level.bandwidth === undefined ? null : `bandwidth ${level.bandwidth}`,
        level.latency === undefined ? null : `latency ${level.latency}`,
      ].filter((metric): metric is string => metric !== null);
      const traits = [level.kind, ...(level.emphasis ? ['emphasised'] : [])].join(', ');
      return sentence(`${index + 1}. ${level.label} (${traits})${metrics.length > 0 ? `: ${metrics.join(', ')}` : ''}${level.note === undefined ? '' : `; ${level.note}`}`);
    }),
  ];
}

function describeCompare(figure: FigureSpecOf<'compare'>): string[] {
  const { axis, columns, rows } = figure.spec;
  const lines = [sentence(`Comparison on the axis: ${axis}`), sentence(`Columns: ${columns.map((column) => column.label).join(', ')}`)];
  const differing: string[] = [];
  const identical: string[] = [];
  for (const row of rows) {
    const cells = columns.map((column) => row.values[column.id] ?? '—');
    const same = cells.every((cell) => cell === cells[0]);
    if (same) identical.push(`${row.dimension} (${cells[0] ?? '—'})`);
    else differing.push(`${row.dimension} — ${columns.map((column, index) => `${column.label}: ${cells[index] ?? '—'}`).join(', ')}`);
  }
  if (differing.length > 0) lines.push(sentence(`Rows that differ: ${differing.join('; ')}`));
  if (identical.length > 0) lines.push(sentence(`Rows identical across columns: ${identical.join('; ')}`));
  return lines;
}

/** Structured text equivalent of a figure, one statement per line. Never empty. */
export function describeFigure(figure: FigureSpec): string {
  let lines: string[];
  switch (figure.kind) {
    case 'diagram':
      lines = describeDiagram(figure);
      break;
    case 'tensor-flow':
      lines = describeTensorFlow(figure);
      break;
    case 'systems-trace':
      lines = describeSystemsTrace(figure);
      break;
    case 'memory-stack':
      lines = describeMemoryStack(figure);
      break;
    case 'calculator':
      lines = describeCalculator(figure);
      break;
    case 'stat-panel':
      lines = describeStatPanel(figure);
      break;
    case 'lineage':
      lines = describeLineage(figure);
      break;
    case 'cycle':
      lines = describeCycle(figure);
      break;
    case 'matrix':
      lines = describeMatrix(figure);
      break;
    case 'chart':
      lines = describeChart(figure);
      break;
    case 'hierarchy':
      lines = describeHierarchy(figure);
      break;
    case 'compare':
      lines = describeCompare(figure);
      break;
  }
  return lines.join('\n');
}
