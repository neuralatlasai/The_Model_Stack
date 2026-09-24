/**
 * Test fixtures read from the real manuscripts (docs/) and the normative
 * grammar (docs/VISUAL_GRAMMAR.md). Read-only; deterministic ordering.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

export const DOCS_DIR = fileURLToPath(new URL('../../../../docs/', import.meta.url));

export interface Fence {
  /** Path relative to docs/, forward slashes. */
  readonly file: string;
  readonly lang: string;
  readonly body: string;
}

function markdownFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...markdownFiles(path));
    else if (name.endsWith('.md')) out.push(path);
  }
  return out;
}

let cache: Fence[] | null = null;

/** Every fenced block (``` only) in docs/, in path order. */
export function allFences(): Fence[] {
  if (cache !== null) return cache;
  const fences: Fence[] = [];
  for (const path of markdownFiles(DOCS_DIR)) {
    const text = readFileSync(path, 'utf8').replace(/\r\n?/gu, '\n');
    const file = relative(DOCS_DIR, path).replaceAll('\\', '/');
    for (const match of text.matchAll(/^```([\w-]*)[^\n]*\n([\s\S]*?)^```\s*$/gmu)) {
      fences.push({ file, lang: match[1] ?? '', body: match[2] ?? '' });
    }
  }
  cache = fences;
  return fences;
}

export const mermaidBlocks = (): Fence[] => allFences().filter((fence) => fence.lang === 'mermaid');
export const tensorTraceBlocks = (): Fence[] => allFences().filter((fence) => fence.lang === 'text' && /^Tensor trace\b/u.test(fence.body));
export const systemsTraceBlocks = (): Fence[] => allFences().filter((fence) => fence.lang === 'text' && /^Systems trace\b/u.test(fence.body));

const GRAMMAR = (): string => readFileSync(join(DOCS_DIR, 'VISUAL_GRAMMAR.md'), 'utf8').replace(/\r\n?/gu, '\n');

/** The complete ```figure example of VISUAL_GRAMMAR §4 (YAML-parsed, unvalidated). */
export function grammarFigureExample(): unknown {
  const match = /```figure\n([\s\S]*?)```/u.exec(GRAMMAR());
  if (match === null) throw new Error('VISUAL_GRAMMAR.md has no ```figure example');
  return parseYaml(match[1] ?? '') as unknown;
}

export interface KindExample {
  readonly kind: string;
  readonly section: string;
  /** The YAML text as written in the grammar. */
  readonly yaml: string;
  readonly spec: unknown;
}

/** Parses a grammar YAML example and returns its `spec` value. */
export function specOf(yaml: string): unknown {
  const parsed = parseYaml(yaml) as unknown;
  return typeof parsed === 'object' && parsed !== null && 'spec' in parsed ? parsed.spec : undefined;
}

/** The per-kind `spec:` YAML examples of VISUAL_GRAMMAR §5.1–5.12. */
export function grammarKindExamples(): KindExample[] {
  const text = GRAMMAR();
  const out: KindExample[] = [];
  const headings = [...text.matchAll(/^### (5\.\d+) `([a-z-]+)`\s*$/gmu)];
  headings.forEach((heading, index) => {
    const start = heading.index;
    const end = headings[index + 1]?.index ?? text.indexOf('\n## 6.', start);
    const section = text.slice(start, end < 0 ? undefined : end);
    const yaml = /```yaml\n([\s\S]*?)```/u.exec(section);
    if (yaml === null) return;
    const source = yaml[1] ?? '';
    const spec = specOf(source);
    if (spec !== undefined) out.push({ kind: heading[2] ?? '', section: heading[1] ?? '', yaml: source, spec });
  });
  return out;
}

/** Wraps a kind example in a valid envelope for chapter 5. */
export function envelope(kind: string, spec: unknown, n: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: `fig-5.${n}`,
    kind,
    title: `Grammar example: ${kind}`,
    caption: `The ${kind} example from VISUAL_GRAMMAR.md, used as a fixture.`,
    evidence: 'MATHEMATICALLY-DERIVED',
    source: 'DERIVED:eq-5.8',
    alt: `Structured ${kind} example figure taken from the visual grammar specification.`,
    spec,
    ...overrides,
  };
}

export const KNOWN_CITATIONS = new Set(['P01', 'P19', 'R5.13']);
export const fixtureContext = {
  chapter: 5,
  hasCitation: (key: string): boolean => KNOWN_CITATIONS.has(key),
  nodeExists: (id: string): boolean => /^ms\.(?:section|chapter)\.\d+(?:\.\d+)?$/u.test(id),
};
