/**
 * Server-side inputs for hosting a visual-grammar figure: the node-id → URL
 * resolver that lineage entries and compare columns link through, and the
 * calculator's rendered TeX. Reads the graph through web-shell's memoised
 * bundle loader.
 */
import type { CompiledFigure } from '@atlas/core';
import { getGraph } from '../../../lib/atlas.ts';
import { href } from './site.ts';
import { calculatorTexHtml } from './tex.ts';

export type NodeHref = (id: string) => string | null;

export async function nodeHrefResolver(): Promise<NodeHref> {
  const graph = await getGraph();
  return (id) => {
    const node = graph.nodes[id];
    return node === undefined ? null : href(node.url);
  };
}

export interface FigureHostProps {
  readonly nodeHref: NodeHref;
  /** Present only for calculators, so it can be spread into props that forbid an explicit `undefined`. */
  readonly tex: { readonly texHtml: string } | Record<string, never>;
}

export async function figureHostProps(figure: CompiledFigure): Promise<FigureHostProps> {
  const texHtml = calculatorTexHtml(figure);
  return { nodeHref: await nodeHrefResolver(), tex: texHtml === undefined ? {} : { texHtml } };
}
