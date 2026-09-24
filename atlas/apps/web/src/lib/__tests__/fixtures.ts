/**
 * Typed test fixtures: a small atlas (one volume, one part, a written chapter
 * with two sections, a planned chapter with one planned section), a registry,
 * and a compiled section document exercising equations, xrefs, citations,
 * nested blocks, rail instruments, and sibling differentials.
 * Test-only; never imported by site code.
 */
import type {
  AtlasGraph,
  Block,
  BundleManifest,
  GraphNode,
  Inline,
  NodeId,
  NodeMeta,
  Registry,
  ResearchDocument,
  SiblingBlock,
  TreeNode,
} from '@atlas/core';

export const text = (value: string): Inline => ({ kind: 'text', value });

export function graphNode(fields: Partial<GraphNode> & Pick<GraphNode, 'id' | 'entityType' | 'url'>): GraphNode {
  return {
    number: null,
    title: fields.id,
    shortTitle: fields.title ?? fields.id,
    parent: null,
    children: [],
    domain: 'foundations',
    hasManuscript: true,
    state: 'manuscript_draft',
    maturity: 'foundational',
    wordCount: 1000,
    summary: null,
    plan: null,
    ...fields,
  };
}

const nodes: GraphNode[] = [
  graphNode({
    id: 'ms.volume.1',
    entityType: 'volume',
    number: 'I',
    title: 'Learning and Representation',
    shortTitle: 'Volume I',
    url: '/vol-01/',
    children: ['ms.part.1'],
    domain: 'reference',
  }),
  graphNode({
    id: 'ms.part.1',
    entityType: 'part',
    number: 'I',
    title: 'Scientific Foundations',
    shortTitle: 'Part I',
    url: '/part-01/',
    parent: 'ms.volume.1',
    children: ['ms.chapter.5', 'ms.chapter.6'],
    plan: { artifact: null, prerequisitesText: null, outcome: 'A correct reference model', sections: [] },
  }),
  graphNode({
    id: 'ms.chapter.5',
    entityType: 'chapter',
    number: '05',
    title: 'A minimal Transformer',
    url: '/ch05/',
    parent: 'ms.part.1',
    children: ['ms.section.5.1', 'ms.section.5.2'],
    summary: 'A decoder-only Transformer is a list of typed tensors.',
  }),
  graphNode({ id: 'ms.section.5.1', entityType: 'section', number: '5.1', title: 'Execution trace', url: '/ch05/05-1/', parent: 'ms.chapter.5' }),
  graphNode({ id: 'ms.section.5.2', entityType: 'section', number: '5.2', title: 'Attention calculation', url: '/ch05/05-2/', parent: 'ms.chapter.5' }),
  graphNode({
    id: 'ms.chapter.6',
    entityType: 'chapter',
    number: '06',
    title: 'Experimental design',
    url: '/ch06/',
    parent: 'ms.part.1',
    children: ['ms.section.6.1'],
    hasManuscript: false,
    state: 'planned',
    maturity: null,
    wordCount: 0,
    plan: {
      artifact: 'a benchmark report',
      prerequisitesText: '01–05',
      outcome: null,
      sections: [{ id: 'ms.section.6.1', number: '6.1', title: 'Evaluation axes' }],
    },
  }),
  graphNode({
    id: 'ms.section.6.1',
    entityType: 'section',
    number: '6.1',
    title: 'Evaluation axes',
    url: '/ch06/06-1/',
    parent: 'ms.chapter.6',
    hasManuscript: false,
    state: 'planned',
    maturity: null,
    wordCount: 0,
  }),
];

function treeOf(graphNodes: readonly GraphNode[], id: NodeId): TreeNode {
  const node = graphNodes.find((candidate) => candidate.id === id);
  if (node === undefined) throw new Error(`fixture: missing ${id}`);
  return {
    id: node.id,
    number: node.number,
    title: node.title,
    shortTitle: node.shortTitle,
    url: node.url,
    domain: node.domain,
    hasManuscript: node.hasManuscript,
    children: node.children.map((child) => treeOf(graphNodes, child)),
  };
}

export function smallGraph(): AtlasGraph {
  return {
    nodes: Object.fromEntries(nodes.map((node) => [node.id, node])),
    edges: [
      { from: 'ms.section.5.2', to: 'ms.section.5.1', type: 'prerequisite' },
      { from: 'ms.chapter.5', to: 'ms.chapter.6', type: 'downstream' },
    ],
    external: [],
    tree: [treeOf(nodes, 'ms.volume.1')],
    order: nodes.map((node) => node.id),
  };
}

export const LONG_WORK = 'W'.repeat(450);

export function smallRegistry(): Registry {
  return {
    references: [
      {
        key: 'P01',
        spine: true,
        type: 'paper',
        work: 'Attention Is All You Need',
        authors: 'Vaswani et al.',
        venue: 'NeurIPS 2017',
        url: 'https://arxiv.org/abs/1706.03762',
        code: null,
        status: 'peer-reviewed',
        uses: [
          { chapter: 4, usedFor: 'objective background', accessed: '2026-09-20' },
          { chapter: 5, usedFor: 'attention definition', accessed: '2026-09-21' },
        ],
        citedBy: ['ms.section.5.2'],
        atlasUrl: '/papers/p01/',
      },
      {
        key: 'R5.1',
        spine: false,
        type: 'documentation',
        work: LONG_WORK,
        authors: 'PyTorch',
        venue: 'docs',
        url: null,
        code: null,
        status: 'UNVERIFIED',
        uses: [{ chapter: 5, usedFor: 'API   reference\n  for SDPA', accessed: null }],
        citedBy: [],
        atlasUrl: '/papers/r5-1/',
      },
      {
        key: 'R5.2',
        spine: false,
        type: 'paper',
        work: 'Not cited on 5.2',
        authors: 'Nobody',
        venue: 'arXiv',
        url: null,
        code: null,
        status: 'preprint',
        uses: [],
        citedBy: [],
        atlasUrl: '/papers/r5-2/',
      },
    ],
    terms: [
      {
        slug: 'kv-cache',
        term: 'KV cache',
        definition: [text('Per-layer key and value tensors retained across decode steps.')],
        owner: 'ms.section.5.2',
        ownerTitle: 'Attention calculation',
        chapter: 5,
        url: '/ch05/05-2/#term-kv-cache',
      },
    ],
    systems: [],
    labs: [],
    lineage: [],
    equations: [
      {
        number: '5.1',
        nodeId: 'ms.section.5.1',
        anchor: 'eq-5-1',
        url: '/ch05/05-1/#eq-5-1',
        tex: 'x = y',
        html: '<span class="katex">x = y</span>',
        variables: [{ symbol: 'x', meaning: 'input' }],
      },
    ],
    objects: [],
  };
}

export function nodeMeta(id: NodeId, fields: Partial<NodeMeta> = {}): NodeMeta {
  return {
    id,
    entityType: 'section',
    title: 'Attention calculation',
    shortTitle: 'Attention calculation',
    volume: 1,
    part: 1,
    chapter: 5,
    section: '5.2',
    slug: '05-2-attention-calculation',
    parent: 'ms.chapter.5',
    prevSibling: 'ms.section.5.1',
    nextSibling: null,
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
    labelsUsed: ['MATHEMATICALLY-DERIVED'],
    empiricallyObserved: false,
    wordCountTarget: 1000,
    updatedAt: '2026-09-20',
    editorialStatus: 'manuscript_draft',
    ...fields,
  };
}

function equation(number: string): Block {
  return {
    kind: 'equation',
    anchor: `eq-${number.replace('.', '-')}`,
    depth: 'technical',
    number,
    tex: 'a = b',
    html: `<span class="katex">a = b (${number})</span>`,
    note: null,
    variables: [{ symbol: 'a', meaning: 'left side' }],
  };
}

export function sibling(name: string, fields: Partial<SiblingBlock['differential']>): SiblingBlock {
  return {
    kind: 'sibling',
    anchor: `sib-${name.toLowerCase()}`,
    depth: 'research',
    name,
    target: { type: 'node', nodeId: 'ms.section.5.1', anchor: null, href: '/ch05/05-1/' },
    differential: {
      whyExists: null,
      assumptionChanged: null,
      objectiveChanged: null,
      problemSolved: null,
      newFailureMode: null,
      changedPrimitive: null,
      ...fields,
    },
  };
}

export function sectionDoc(): ResearchDocument {
  return {
    schemaVersion: 1,
    meta: nodeMeta('ms.section.5.2'),
    route: {
      url: '/ch05/05-2/',
      breadcrumbs: [
        { id: 'ms.volume.1', title: 'Learning and Representation', number: 'I', url: '/vol-01/' },
        { id: 'ms.part.1', title: 'Scientific Foundations', number: 'I', url: '/part-01/' },
        { id: 'ms.chapter.5', title: 'A minimal Transformer', number: '05', url: '/ch05/' },
      ],
      prev: { id: 'ms.section.5.1', title: 'Execution trace', number: '5.1', url: '/ch05/05-1/' },
      next: null,
    },
    header: {
      identityLine: null,
      number: '5.2',
      title: 'Attention calculation',
      thesis: [text('Expand the attention lines into costed equations.')],
      metaLine: null,
    },
    lead: [],
    regions: [
      {
        role: 'formulation',
        title: 'Formulation',
        anchor: 'formulation',
        depth: 'technical',
        blocks: [
          equation('5.2'),
          {
            kind: 'paragraph',
            anchor: null,
            depth: 'overview',
            content: [
              text('Compare '),
              {
                kind: 'xref',
                ref: 'equation',
                number: '5.1',
                text: 'Eq. 5.1',
                target: { nodeId: 'ms.section.5.1', anchor: 'eq-5-1', href: '/ch05/05-1/#eq-5-1' },
              },
              text(' with '),
              { kind: 'strong', children: [{ kind: 'xref', ref: 'algorithm', number: '5.2', text: 'Algorithm 5.2', target: null }] },
              { kind: 'cite', key: 'P01', resolved: true },
            ],
          },
          {
            kind: 'expansion',
            anchor: null,
            depth: 'technical',
            variant: 'derivation',
            summary: [text('Derivation of Eq. 5.3')],
            blocks: [{ kind: 'list', anchor: null, depth: 'overview', ordered: false, start: null, items: [{ blocks: [equation('5.3')], checked: null }] }],
          },
        ],
      },
      {
        role: 'siblings',
        title: 'Siblings',
        anchor: 'siblings',
        depth: 'research',
        blocks: [
          sibling('MQA', {
            assumptionChanged: [text('All query heads share one K/V head.')],
            objectiveChanged: [text('None.')],
            problemSolved: [text('KV bytes fall by H_q.')],
          }),
          sibling('GQA', {
            assumptionChanged: [text('Groups of query heads share K/V.')],
            objectiveChanged: [text('none')],
          }),
        ],
      },
    ],
    figures: [],
    rail: [
      {
        regionAnchor: 'formulation',
        role: 'formulation',
        instruments: [
          { kind: 'citations', keys: ['R5.1'] },
          { kind: 'terms', slugs: ['kv-cache', 'unknown-term'] },
        ],
      },
    ],
    outline: [],
    citations: ['P01'],
    definedTerms: [],
    linksTo: ['ms.section.5.1'],
    stats: {
      words: 1800,
      readingMinutes: 8,
      equations: 2,
      figures: 0,
      algorithms: 0,
      experiments: 0,
      failureModes: 0,
      definitions: 0,
      citations: 1,
    },
    sourcePath: 'vol-01/part-01/ch05/05-2-attention-calculation.md',
    diagnostics: [],
  };
}

export function manifestFor(documents: readonly NodeId[]): BundleManifest {
  return {
    schemaVersion: 1,
    edition: '1.0',
    compiledAt: '2026-09-23T12:00:00.000Z',
    docsRoot: 'docs',
    documents: [...documents],
    counts: { documents: documents.length, planned: 2, figures: 0, equations: 3, references: 3, terms: 1, searchDocs: 1 },
    diagnostics: { error: 0, warning: 0, info: 0 },
  };
}
