/**
 * Typed fixtures for the research-renderer unit tests. Built from core types
 * so a contract change breaks the fixtures at type-check time, not silently.
 */
import type {
  Block,
  CompiledFigure,
  DocumentHeader,
  DocumentStats,
  Inline,
  NodeMeta,
  ParagraphBlock,
  ResearchDocument,
  Route,
} from '@atlas/core';

export function text(value: string): Inline {
  return { kind: 'text', value };
}

export function para(value: string, anchor: string | null = null): ParagraphBlock {
  return { kind: 'paragraph', anchor, depth: 'overview', content: [text(value)] };
}

export const STATS: DocumentStats = {
  words: 2100,
  readingMinutes: 9,
  equations: 5,
  figures: 0,
  algorithms: 1,
  experiments: 0,
  failureModes: 3,
  definitions: 3,
  citations: 5,
};

export const META: NodeMeta = {
  id: 'ms.section.5.2',
  entityType: 'section',
  title: 'Attention calculation',
  shortTitle: 'Attention',
  volume: 1,
  part: 1,
  chapter: 5,
  section: '5.2',
  slug: '05-2-attention-calculation',
  parent: 'ms.chapter.5',
  prevSibling: 'ms.section.5.1',
  nextSibling: 'ms.section.5.3',
  children: [],
  prerequisites: ['ms.section.5.1'],
  downstream: [],
  related: [],
  siblingsByMechanism: [],
  relations: [],
  axes: { lifecycle: ['pretraining'], mechanism: ['attention'], feedbackSetting: [], modality: ['text'] },
  papers: ['P01'],
  implementations: [],
  benchmarks: [],
  datasets: [],
  maturity: 'foundational',
  disputed: false,
  labelsUsed: ['PAPER-REPORTED'],
  empiricallyObserved: false,
  wordCountTarget: 1050,
  updatedAt: '2026-09-20',
  editorialStatus: 'manuscript_draft',
};

export const ROUTE: Route = {
  url: '/ch05-minimal-transformer-and-execution-trace/05-2-attention-calculation/',
  breadcrumbs: [
    { id: 'ms.volume.1', number: 'I', title: 'Volume I', url: '/vol-01-learning-and-representation/' },
    { id: 'ms.part.1', number: 'I', title: 'Part I', url: '/part-01-scientific-foundations/' },
    { id: 'ms.chapter.5', number: '05', title: 'Minimal Transformer', url: '/ch05-minimal-transformer-and-execution-trace/' },
  ],
  prev: null,
  next: null,
};

export const HEADER: DocumentHeader = {
  identityLine: null,
  number: '5.2',
  title: 'Attention calculation',
  thesis: [text('expand the four attention lines into equations with shapes.')],
  metaLine: null,
};

export function documentWith(lead: readonly Block[], regionBlocks: readonly Block[]): ResearchDocument {
  return {
    schemaVersion: 1,
    meta: META,
    route: ROUTE,
    header: HEADER,
    lead,
    regions: [{ role: 'formulation', title: 'Formulation', anchor: 'formulation', depth: 'technical', blocks: regionBlocks }],
    figures: [],
    rail: [],
    outline: [],
    citations: [],
    definedTerms: [],
    linksTo: [],
    stats: STATS,
    sourcePath: 'vol-01/part-01/ch05/05-2-attention-calculation.md',
    diagnostics: [],
  };
}

export const CALCULATOR: CompiledFigure = {
  id: 'fig-5.4',
  number: '5.4',
  anchor: 'fig-5-4',
  origin: 'authored',
  placement: 'rail',
  regionAnchor: 'mechanism',
  scene: null,
  evidence: 'MATHEMATICALLY-DERIVED',
  sources: ['DERIVED:eq-5.8'],
  text: 'Calculator for Eq. 5.8.',
  spec: {
    id: 'fig-5.4',
    kind: 'calculator',
    title: 'Score-matrix bytes per layer',
    caption: 'The materialised score matrix grows with T squared.',
    placement: 'rail',
    anchor: 'mechanism',
    evidence: 'MATHEMATICALLY-DERIVED',
    source: ['DERIVED:eq-5.8'],
    alt: 'Calculator for Eq. 5.8, M = B·H·T²·b.',
    concepts: [],
  states: [],
    spec: {
      tex: 'M = B\\,H\\,T^{2}\\,b',
      equation: '5.8',
      inputs: [{ symbol: 'T', label: 'sequence length', default: 8192, min: 512, max: 131072, scale: 'log2', format: 'tokens' }],
      outputs: [{ symbol: 'M', label: 'scores per layer', formula: '32*T^2*2', format: 'bytes', emphasis: true }],
      presets: [],
    },
  },
};
