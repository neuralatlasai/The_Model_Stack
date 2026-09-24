/**
 * Small builders for synthetic sources and compiled bodies used by the
 * project-layer unit tests.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { entityTypeOf, type Block, type Inline, type NodeId, type NodeMeta, type Region, type RegionRole } from '@atlas/core';
import type { CompiledBody } from '../../src/markdown/contract.ts';
import { parseManifest, type Manifest } from '../../src/project/manifest.ts';
import type { CompiledSource, SourceDoc } from '../../src/project/types.ts';
import { DOCS_DIR } from './paths.ts';

export async function realManifest(): Promise<Manifest> {
  return parseManifest(await readFile(path.join(DOCS_DIR, 'atlas-manifest.json'), 'utf8'));
}

export function meta(id: NodeId, overrides: Partial<NodeMeta> = {}): NodeMeta {
  const section = /^ms\.section\.(\d+\.\d+)$/u.exec(id)?.[1] ?? null;
  const chapter = /^ms\.(?:chapter|section|verification|references)\.(\d+)/u.exec(id)?.[1];
  return {
    id,
    entityType: entityTypeOf(id) ?? 'frontmatter',
    title: `Title of ${id}`,
    shortTitle: `Short ${id}`,
    volume: null,
    part: null,
    chapter: chapter === undefined ? null : Number.parseInt(chapter, 10),
    section,
    slug: 'slug',
    parent: null,
    prevSibling: null,
    nextSibling: null,
    children: [],
    prerequisites: [],
    downstream: [],
    related: [],
    siblingsByMechanism: [],
    relations: [],
    axes: { lifecycle: [], mechanism: [], feedbackSetting: [], modality: [] },
    papers: [],
    implementations: [],
    benchmarks: [],
    datasets: [],
    maturity: 'foundational',
    disputed: false,
    labelsUsed: [],
    empiricallyObserved: false,
    wordCountTarget: null,
    updatedAt: '2026-09-20',
    editorialStatus: 'manuscript_draft',
    ...overrides,
  };
}

export function source(id: NodeId, docPath: string, overrides: Partial<NodeMeta> = {}, body = ''): SourceDoc {
  return { path: docPath, meta: meta(id, overrides), body, bodyStartLine: 30, text: body };
}

export function text(value: string): Inline[] {
  return [{ kind: 'text', value }];
}

export function region(role: RegionRole, title: string, blocks: Block[], anchor = title.toLowerCase().replace(/[^a-z0-9]+/gu, '-')): Region {
  return { role, title, anchor, depth: 'overview', blocks };
}

export function body(parts: Partial<CompiledBody> = {}): CompiledBody {
  return {
    header: { identityLine: null, number: null, title: 'T', thesis: null, metaLine: null },
    lead: [],
    regions: [],
    figures: [],
    rail: [],
    outline: [],
    citations: [],
    definedTerms: [],
    linksTo: [],
    stats: { words: 0, readingMinutes: 0, equations: 0, figures: 0, algorithms: 0, experiments: 0, failureModes: 0, definitions: 0, citations: 0 },
    diagnostics: [],
    ...parts,
  };
}

export function compiledSource(src: SourceDoc, parts: Partial<CompiledBody> = {}): CompiledSource {
  return { source: src, body: body(parts) };
}

/** Asserts presence and returns the value, so later reads need no optional chaining. */
export function must<T>(value: T | null | undefined, what = 'value'): T {
  assert.ok(value !== null && value !== undefined, `${what} is missing`);
  return value;
}
