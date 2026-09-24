/**
 * A deliberately small stand-in for the Markdown compiler, used to exercise the
 * project pipeline independently of markdown/: it indexes numbered objects with
 * regexes, resolves every Markdown link through the context, and emits one
 * paragraph region per H2. Not a Markdown compiler; tests only.
 */
import { REGION_HEADINGS, REGION_ROLE_DEPTH, type Block, type Inline, type Region, type RegionRole } from '@atlas/core';
import type { CompileContext, CompiledBody, MarkdownInput, NumberedObjectIndex } from '../../src/markdown/contract.ts';
import type { CompileEngine } from '../../src/project/pipeline.ts';

function all(pattern: RegExp, text: string): string[] {
  return [...text.matchAll(pattern)].map((match) => match[1] ?? '');
}

export function stubIndex(input: MarkdownInput): NumberedObjectIndex {
  return {
    equations: all(/\*\(Eq\.\s*(\d+\.\d+)\)\*/gu, input.body),
    algorithms: all(/^Algorithm (\d+\.\d+) —/gmu, input.body),
    figures: all(/^id:\s*fig-(\d+\.\d+)\s*$/gmu, input.body),
    experiments: all(/^### Experiment (\d+\.\d+)/gmu, input.body),
    propositions: all(/\*\*Proposition (\d+\.\d+)\.\*\*/gu, input.body),
  };
}

function roleOf(title: string): RegionRole {
  const key = title.split(/\s+[—–-]\s+/u)[0]?.trim().toLowerCase() ?? '';
  return REGION_HEADINGS[key] ?? 'other';
}

export function stubCompile(input: MarkdownInput, ctx: CompileContext): CompiledBody {
  for (const href of all(/\]\(([^)\s]+)\)/gu, input.body)) ctx.resolveLink(href);
  const regions: Region[] = [];
  const sections = input.body.split(/^## /mu).slice(1);
  const used = new Set<string>();
  for (const section of sections) {
    const [titleLine = '', ...rest] = section.split('\n');
    const title = titleLine.trim();
    let anchor = title.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '') || 'region';
    while (used.has(anchor)) anchor = `${anchor}-x`;
    used.add(anchor);
    const text = rest.find((line) => line.trim() !== '' && !line.startsWith('|') && !line.startsWith('```')) ?? '';
    const content: Inline[] = [{ kind: 'text', value: text.trim() }];
    const role = roleOf(title);
    const blocks: Block[] = [{ kind: 'paragraph', anchor: null, depth: REGION_ROLE_DEPTH[role], content }];
    regions.push({ role, title, anchor, depth: REGION_ROLE_DEPTH[role], blocks });
  }
  const citations = [...new Set(all(/\b(P\d{2}|R\d+\.\d+)\b/gu, input.body))].filter((key) => ctx.hasCitation(key as `P${number}`));
  return {
    header: { identityLine: null, number: input.meta.section, title: input.meta.title, thesis: [{ kind: 'text', value: `${input.meta.title} thesis` }], metaLine: null },
    lead: [],
    regions,
    figures: [],
    rail: [],
    outline: [],
    citations: citations as CompiledBody['citations'],
    definedTerms: [],
    linksTo: [],
    stats: { words: input.body.split(/\s+/u).length, readingMinutes: 1, equations: 0, figures: 0, algorithms: 0, experiments: 0, failureModes: 0, definitions: 0, citations: citations.length },
    diagnostics: [],
  };
}

export const stubEngine: CompileEngine = {
  indexNumberedObjects: stubIndex,
  compileMarkdown: stubCompile,
  layoutFigure: () => Promise.resolve(null),
};
