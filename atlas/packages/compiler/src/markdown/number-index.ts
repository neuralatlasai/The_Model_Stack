/**
 * First pass (UI_UX §61 deep links, two-pass cross-references): the numbered
 * objects a document defines, found by a line scan without parsing Markdown,
 * resolving links, or rendering math. The patterns mirror the full compile:
 *
 *   *(Eq. 5.4)* …                      equation tag line
 *   Algorithm 5.2 — …                  first line of a fenced block
 *   id: fig-5.3                        inside a ```figure block
 *   ### Experiment 5.1 — …             H3–H6
 *   > **Proposition 7.1.**             also Theorem / Lemma / Corollary
 *
 * Content inside other fenced blocks (examples in the contract, code) is
 * ignored. Numbers are returned without prefixes (`5.4`, `5.3`), unique, in
 * document order.
 */
import type { MarkdownInput, NumberedObjectIndex } from './contract.ts';

const NUMBER = String.raw`(?:\d+|[A-Z])\.\d+[a-z]?`;
const EQUATION_TAG = new RegExp(String.raw`^\s*(?:[*_]{1,2})?\(\s*Eq\.?\s*(${NUMBER})\s*\)(?:[*_]{1,2})?`, 'u');
const ALGORITHM_TITLE = new RegExp(String.raw`^\s*Algorithm\s+(${NUMBER})(?![\d.])`, 'u');
const FIGURE_ID = /^\s*id\s*:\s*["']?fig-(\d+\.\d+)["']?\s*(?:#.*)?$/u;
const EXPERIMENT_HEADING = new RegExp(String.raw`^\s{0,3}#{3,6}\s+Experiments?\s+(${NUMBER})(?![\d.])`, 'u');
const PROPOSITION = new RegExp(String.raw`^\s*(?:>\s*)+\*\*(?:Proposition|Theorem|Lemma|Corollary)\s+(${NUMBER})\.?\*\*`, 'u');
const FENCE = /^\s{0,3}(`{3,}|~{3,})\s*([^\s`]*)/u;
/** Algorithms are recognised only in plain-text fences, as in the full compile. */
const PLAIN_LANGS: ReadonlySet<string> = new Set(['', 'text', 'txt', 'plain', 'plaintext']);

function pushUnique(list: string[], value: string | undefined): void {
  if (value !== undefined && !list.includes(value)) list.push(value);
}

/** Accepts the body string, or the MarkdownInput whose body is scanned (the project pipeline passes the input). */
export function indexNumberedObjects(source: string | MarkdownInput): NumberedObjectIndex {
  const body = typeof source === 'string' ? source : source.body;
  const equations: string[] = [];
  const algorithms: string[] = [];
  const figures: string[] = [];
  const experiments: string[] = [];
  const propositions: string[] = [];

  let fence: { readonly marker: string; readonly lang: string; firstLine: boolean } | null = null;
  for (const line of body.replace(/\r\n?/gu, '\n').split('\n')) {
    if (fence !== null) {
      const close = FENCE.exec(line);
      const marker = close?.[1];
      if (marker?.startsWith(fence.marker.charAt(0)) && marker.length >= fence.marker.length && (close?.[2] ?? '') === '') {
        fence = null;
        continue;
      }
      if (fence.lang === 'figure') pushUnique(figures, FIGURE_ID.exec(line)?.[1]);
      else if (fence.firstLine && PLAIN_LANGS.has(fence.lang) && line.trim() !== '') {
        pushUnique(algorithms, ALGORITHM_TITLE.exec(line)?.[1]);
      }
      if (line.trim() !== '') fence.firstLine = false;
      continue;
    }
    const open = FENCE.exec(line);
    if (open !== null) {
      fence = { marker: open[1] ?? '```', lang: (open[2] ?? '').toLowerCase(), firstLine: true };
      continue;
    }
    pushUnique(equations, EQUATION_TAG.exec(line)?.[1]);
    pushUnique(experiments, EXPERIMENT_HEADING.exec(line)?.[1]);
    pushUnique(propositions, PROPOSITION.exec(line)?.[1]);
  }
  return { equations, algorithms, figures, experiments, propositions };
}
