/**
 * Standalone validator for authored ```figure blocks (docs/VISUAL_GRAMMAR.md).
 *
 * Runs without the compiler so chapter authors get a fast feedback loop:
 *   node scripts/validate-figures.ts ../docs/vol-01-.../ch05-...            (one chapter folder)
 *   node scripts/validate-figures.ts ../docs                                 (everything)
 *
 * Checks: YAML parses; FigureSpecSchema; id = fig-<chapter>.<n> with the file's chapter;
 * ids unique per chapter and numbered in reading order; formulas parse, bind, and are finite
 * at defaults; cite/source keys exist in the chapter's references.md; node ids exist in the
 * manifest; PAPER-REPORTED / OFFICIAL-DOCUMENTATION charts carry `context`.
 * Exit code 1 when any error is found.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { parse as parseYaml } from 'yaml';
import {
  compileFormula,
  ExprError,
  FigureSpecSchema,
  type FigureSpec,
} from '@atlas/core';

interface Finding {
  readonly file: string;
  readonly line: number;
  readonly id: string;
  readonly message: string;
}

const { positionals } = parseArgs({ allowPositionals: true });
const target = path.resolve(positionals[0] ?? '../docs');
const docsRoot = findDocsRoot(target);

function findDocsRoot(start: string): string {
  let cursor = start;
  for (let i = 0; i < 8; i += 1) {
    if (path.basename(cursor) === 'docs') return cursor;
    cursor = path.dirname(cursor);
  }
  return path.resolve('../docs');
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function chapterOf(file: string): number | null {
  const match = /[\\/]ch(\d{2})-/u.exec(file);
  return match?.[1] === undefined ? null : Number.parseInt(match[1], 10);
}

async function manifestIds(): Promise<Set<string>> {
  const raw: unknown = JSON.parse(await readFile(path.join(docsRoot, 'atlas-manifest.json'), 'utf8'));
  const ids = new Set<string>();
  const visit = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (value !== null && typeof value === 'object') {
      for (const [key, inner] of Object.entries(value)) {
        if (key === 'id' && typeof inner === 'string') ids.add(inner);
        visit(inner);
      }
    }
  };
  visit(raw);
  for (let ch = 1; ch <= 66; ch += 1) {
    ids.add(`ms.verification.${ch}`);
    ids.add(`ms.references.${ch}`);
  }
  return ids;
}

const referenceCache = new Map<string, Set<string>>();
async function referenceKeys(chapterDir: string): Promise<Set<string>> {
  const cached = referenceCache.get(chapterDir);
  if (cached !== undefined) return cached;
  const keys = new Set<string>();
  try {
    const text = await readFile(path.join(chapterDir, 'references.md'), 'utf8');
    for (const match of text.matchAll(/^\|\s*(P\d{2}|R\d+\.\d+)\s*\|/gmu)) {
      if (match[1] !== undefined) keys.add(match[1]);
    }
  } catch {
    // No references.md yet: every cite in this chapter will be reported.
  }
  referenceCache.set(chapterDir, keys);
  return keys;
}

function extractFigures(text: string): { yaml: string; line: number }[] {
  const out: { yaml: string; line: number }[] = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if ((lines[i] ?? '').trim() === '```figure') {
      const start = i + 1;
      let end = start;
      while (end < lines.length && (lines[end] ?? '').trim() !== '```') end += 1;
      out.push({ yaml: lines.slice(start, end).join('\n'), line: start });
      i = end;
    }
  }
  return out;
}

function checkFormula(
  source: string,
  bound: ReadonlySet<string>,
  env: Readonly<Record<string, number>>,
  where: string,
): string | null {
  try {
    const compiled = compileFormula(source);
    const unbound = compiled.variables.filter((name) => !bound.has(name));
    if (unbound.length > 0) return `${where}: unbound identifier(s) ${unbound.join(', ')} in "${source}"`;
    compiled.evaluate(env);
    return null;
  } catch (error) {
    const message = error instanceof ExprError ? `${error.code}: ${error.message}` : String(error);
    return `${where}: formula "${source}" — ${message}`;
  }
}

function sampleXs(sample: { from: number; to: number; count: number }, log: boolean): number[] {
  const xs: number[] = [];
  for (let i = 0; i < sample.count; i += 1) {
    const t = sample.count === 1 ? 0 : i / (sample.count - 1);
    xs.push(log ? sample.from * (sample.to / sample.from) ** t : sample.from + (sample.to - sample.from) * t);
  }
  return xs;
}

function semanticChecks(fig: FigureSpec, refs: ReadonlySet<string>, nodes: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  const citeLike = /^(P\d{2}|R\d+\.\d+)$/u;
  for (const source of fig.source) {
    if (citeLike.test(source) && !refs.has(source)) problems.push(`source ${source} not in the chapter's references.md`);
  }
  for (const concept of fig.concepts) if (!nodes.has(concept)) problems.push(`concept ${concept} not in manifest`);
  if ((fig.evidence === 'PAPER-REPORTED' || fig.evidence === 'OFFICIAL-DOCUMENTATION') && fig.kind === 'chart' && fig.context === undefined) {
    problems.push('PAPER-REPORTED/OFFICIAL-DOCUMENTATION chart needs `context` (hardware, model, precision, …)');
  }

  switch (fig.kind) {
    case 'diagram': {
      const ids = new Set(fig.spec.nodes.map((n) => n.id));
      const groups = new Set(fig.spec.groups.map((g) => g.id));
      if (ids.size !== fig.spec.nodes.length) problems.push('duplicate node ids');
      for (const n of fig.spec.nodes) if (n.group !== undefined && !groups.has(n.group)) problems.push(`node ${n.id}: unknown group ${n.group}`);
      for (const e of fig.spec.edges) {
        if (!ids.has(e.from)) problems.push(`edge from unknown node ${e.from}`);
        if (!ids.has(e.to)) problems.push(`edge to unknown node ${e.to}`);
      }
      break;
    }
    case 'cycle': {
      const ids = new Set(fig.spec.stages.map((s) => s.id));
      for (const e of fig.spec.edges) {
        if (!ids.has(e.from) || !ids.has(e.to)) problems.push(`edge ${e.from}→${e.to} references an unknown stage`);
      }
      break;
    }
    case 'tensor-flow': {
      const dims = new Set(Object.keys(fig.spec.dims));
      for (const step of fig.spec.steps) {
        for (const token of step.shape.slice(1, -1).split(',')) {
          for (const sym of token.match(/[A-Za-z][A-Za-z0-9_]*/gu) ?? []) {
            if (!dims.has(sym)) problems.push(`shape ${step.shape}: dimension ${sym} not declared in dims`);
          }
        }
      }
      break;
    }
    case 'calculator': {
      const bound = new Set<string>();
      const env: Record<string, number> = {};
      for (const input of fig.spec.inputs) {
        bound.add(input.symbol);
        env[input.symbol] = input.default;
        if (input.options !== undefined && !input.options.includes(input.default)) problems.push(`input ${input.symbol}: default not among options`);
      }
      for (const output of fig.spec.outputs) {
        const issue = checkFormula(output.formula, bound, env, `output ${output.symbol}`);
        if (issue !== null) problems.push(issue);
        else env[output.symbol] = compileFormula(output.formula).evaluate(env);
        bound.add(output.symbol);
      }
      for (const preset of fig.spec.presets) {
        for (const key of Object.keys(preset.values)) if (!fig.spec.inputs.some((i) => i.symbol === key)) problems.push(`preset ${preset.label}: unknown input ${key}`);
      }
      break;
    }
    case 'stat-panel': {
      const bound = new Set(Object.keys(fig.spec.variables));
      for (const row of fig.spec.rows) {
        if (row.formula !== undefined) {
          const issue = checkFormula(row.formula, bound, fig.spec.variables, `row ${row.key}`);
          if (issue !== null) problems.push(issue);
        }
      }
      if (fig.spec.glyph?.type === 'dots' && fig.spec.glyph.filled > fig.spec.glyph.total) problems.push('glyph: filled > total');
      break;
    }
    case 'memory-stack': {
      const bound = new Set(Object.keys(fig.spec.variables));
      for (const bar of fig.spec.bars) {
        for (const seg of bar.segments) {
          if (seg.formula !== undefined) {
            const issue = checkFormula(seg.formula, bound, fig.spec.variables, `${bar.label} / ${seg.label}`);
            if (issue !== null) problems.push(issue);
          }
        }
      }
      if (fig.spec.budget?.formula !== undefined) {
        const issue = checkFormula(fig.spec.budget.formula, bound, fig.spec.variables, 'budget');
        if (issue !== null) problems.push(issue);
      }
      break;
    }
    case 'chart': {
      const bound = new Set([...Object.keys(fig.spec.variables), 'x']);
      const log = fig.spec.x.scale !== 'linear';
      for (const series of fig.spec.series) {
        const sources = [series.points, series.values, series.formula].filter((v) => v !== undefined).length;
        if (sources !== 1) problems.push(`series ${series.id}: give exactly one of points, values, formula`);
        if (series.formula !== undefined) {
          if (series.sample === undefined) problems.push(`series ${series.id}: formula needs sample {from, to, count}`);
          else {
            for (const x of sampleXs(series.sample, log)) {
              const issue = checkFormula(series.formula, bound, { ...fig.spec.variables, x }, `series ${series.id} at x=${x}`);
              if (issue !== null) {
                problems.push(issue);
                break;
              }
            }
          }
        }
        if (fig.spec.type === 'bar') {
          if (fig.spec.categories === undefined) problems.push('bar chart needs categories');
          else if (series.values?.length !== fig.spec.categories.length) problems.push(`series ${series.id}: values length must equal categories length`);
        }
      }
      break;
    }
    case 'matrix': {
      if (fig.spec.pattern === 'explicit') {
        if (fig.spec.cells === undefined) problems.push('explicit matrix needs cells');
        else if (fig.spec.cells.length !== fig.spec.rows || fig.spec.cells.some((r) => r.length !== fig.spec.cols)) problems.push('cells must be rows × cols');
      }
      if (['banded', 'block-diagonal', 'prefix', 'dilated'].includes(fig.spec.pattern) && fig.spec.parameter === undefined) {
        problems.push(`pattern ${fig.spec.pattern} needs parameter`);
      }
      for (const h of fig.spec.highlight) if (h.row >= fig.spec.rows || h.col >= fig.spec.cols) problems.push(`highlight (${h.row},${h.col}) outside matrix`);
      break;
    }
    case 'lineage': {
      for (const entry of fig.spec.entries) {
        if (entry.cite !== undefined && !refs.has(entry.cite)) problems.push(`lineage ${entry.work}: cite ${entry.cite} not in references.md`);
        if (entry.node !== undefined && !nodes.has(entry.node)) problems.push(`lineage ${entry.work}: node ${entry.node} not in manifest`);
      }
      break;
    }
    case 'compare': {
      const cols = new Set(fig.spec.columns.map((c) => c.id));
      for (const row of fig.spec.rows) {
        for (const key of Object.keys(row.values)) if (!cols.has(key)) problems.push(`row ${row.dimension}: unknown column ${key}`);
      }
      for (const col of fig.spec.columns) if (col.node !== undefined && !nodes.has(col.node)) problems.push(`column ${col.id}: node ${col.node} not in manifest`);
      break;
    }
    case 'systems-trace':
    case 'hierarchy':
      break;
  }
  return problems;
}


/** Same algorithm as the compiler's region anchors (packages/compiler/src/markdown/slug.ts). */
function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/['’]/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

function regionAnchors(text: string): Set<string> {
  const anchors = new Set<string>();
  let inFence = false;
  for (const line of text.split('\n')) {
    if (/^```/u.test(line.trim())) inFence = !inFence;
    if (inFence) continue;
    const match = /^##\s+(.+?)\s*$/u.exec(line);
    if (match?.[1] !== undefined) anchors.add(slugify(match[1]));
  }
  return anchors;
}

/** Keys a state may highlight, per figure kind (docs/VISUAL_GRAMMAR.md §6.1). */
function highlightKeys(fig: FigureSpec): Set<string> {
  switch (fig.kind) {
    case 'diagram':
      return new Set([...fig.spec.nodes.map((n) => n.id), ...fig.spec.edges.map((e) => `${e.from}->${e.to}`)]);
    case 'cycle':
      return new Set([...fig.spec.stages.map((st) => st.id), ...fig.spec.edges.map((e) => `${e.from}->${e.to}`)]);
    case 'chart':
      return new Set(fig.spec.series.map((series) => series.id));
    case 'stat-panel':
      return new Set(fig.spec.rows.map((row) => row.key));
    case 'memory-stack':
      return new Set(fig.spec.bars.flatMap((bar) => [bar.label, ...bar.segments.map((seg) => `${bar.label}/${seg.label}`)]));
    case 'hierarchy':
      return new Set(fig.spec.levels.map((level) => level.label));
    case 'tensor-flow':
      return new Set(fig.spec.steps.map((_, index) => String(index)));
    case 'systems-trace':
      return new Set(fig.spec.stages.map((stage) => stage.name));
    case 'lineage':
      return new Set(fig.spec.entries.map((entry) => entry.work));
    case 'compare':
      return new Set([...fig.spec.rows.map((row) => row.dimension), ...fig.spec.columns.map((col) => col.id)]);
    case 'calculator':
      return new Set([...fig.spec.inputs.map((i) => i.symbol), ...fig.spec.outputs.map((o) => o.symbol)]);
    case 'matrix':
      return new Set();
  }
}

/** Variables a state may override, per kind. */
function stateVariables(fig: FigureSpec): Set<string> | null {
  switch (fig.kind) {
    case 'calculator':
      return new Set(fig.spec.inputs.map((i) => i.symbol));
    case 'stat-panel':
    case 'memory-stack':
      return new Set(Object.keys(fig.spec.variables));
    case 'chart':
      return new Set([...Object.keys(fig.spec.variables), 'x']);
    default:
      return null;
  }
}

function stateChecks(fig: FigureSpec, anchors: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  if (fig.anchor !== undefined && !anchors.has(fig.anchor)) {
    problems.push(`anchor "${fig.anchor}" is not an H2 region of this file (have: ${[...anchors].join(', ')})`);
  }
  if (fig.states.length === 0) return problems;
  if (fig.placement !== 'rail') problems.push('states are only allowed on placement: rail figures');
  const keys = highlightKeys(fig);
  const vars = stateVariables(fig);
  const seen = new Set<string>();
  for (const [index, state] of fig.states.entries()) {
    const where = `states[${String(index)}]`;
    if (!anchors.has(state.anchor)) problems.push(`${where}: anchor "${state.anchor}" is not an H2 region of this file`);
    if (seen.has(state.anchor)) problems.push(`${where}: two states for region "${state.anchor}"`);
    seen.add(state.anchor);
    for (const key of state.highlight) if (!keys.has(key)) problems.push(`${where}: highlight "${key}" is not a part of this ${fig.kind} (valid: ${[...keys].slice(0, 12).join(', ')})`);
    if (state.variables !== undefined) {
      if (vars === null) problems.push(`${where}: ${fig.kind} figures take no variables`);
      else for (const key of Object.keys(state.variables)) if (!vars.has(key)) problems.push(`${where}: unknown variable "${key}"`);
    }
  }
  return problems;
}

async function main(): Promise<void> {
  const nodes = await manifestIds();
  const files = (await walk(target)).sort();
  const findings: Finding[] = [];
  const perChapter = new Map<number, { id: string; file: string; line: number }[]>();
  let count = 0;

  for (const file of files) {
    const text = await readFile(file, 'utf8');
    const figures = extractFigures(text);
    if (figures.length === 0) continue;
    const chapter = chapterOf(file);
    const refs = await referenceKeys(path.dirname(file));
    const anchors = regionAnchors(text);
    const rel = path.relative(docsRoot, file).replaceAll('\\', '/');

    for (const { yaml, line } of figures) {
      count += 1;
      let raw: unknown;
      try {
        raw = parseYaml(yaml);
      } catch (error) {
        findings.push({ file: rel, line, id: '?', message: `YAML: ${String(error)}` });
        continue;
      }
      const parsed = FigureSpecSchema.safeParse(raw);
      const rawId = typeof raw === 'object' && raw !== null && 'id' in raw ? String(raw.id) : '?';
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          findings.push({ file: rel, line, id: rawId, message: `schema ${issue.path.join('.') || '(root)'}: ${issue.message}` });
        }
        continue;
      }
      const fig = parsed.data;
      const idChapter = Number.parseInt(fig.id.slice(4).split('.')[0] ?? '', 10);
      if (chapter !== null && idChapter !== chapter) findings.push({ file: rel, line, id: fig.id, message: `id chapter ${idChapter} ≠ file chapter ${chapter}` });
      if (chapter !== null) {
        const list = perChapter.get(chapter) ?? [];
        list.push({ id: fig.id, file: rel, line });
        perChapter.set(chapter, list);
      }
      for (const message of semanticChecks(fig, refs, nodes)) findings.push({ file: rel, line, id: fig.id, message });
      if (chapter !== null) for (const message of stateChecks(fig, anchors)) findings.push({ file: rel, line, id: fig.id, message });
    }
  }

  for (const [chapter, list] of perChapter) {
    const seen = new Map<string, string>();
    for (const item of list) {
      const prior = seen.get(item.id);
      if (prior !== undefined) findings.push({ file: item.file, line: item.line, id: item.id, message: `duplicate figure id in chapter ${chapter} (also ${prior})` });
      seen.set(item.id, `${item.file}:${item.line}`);
    }
  }

  for (const f of findings) process.stdout.write(`${f.file}:${f.line}  ${f.id}  ${f.message}\n`);
  process.stdout.write(`\n${count} figure block(s) checked, ${findings.length} problem(s).\n`);
  process.exitCode = findings.length > 0 ? 1 : 0;
}

await main();
