import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Inline, ResearchDocument } from '@atlas/core';
import { jsonForHtml } from '../json.ts';
import { documentJsonLd, paperJsonLd, referenceSchemaType, siteJsonLd } from '../jsonld.ts';
import { routeTables, tokenizeRoute } from '../reading-routes.ts';
import { sectionDoc, smallGraph, smallRegistry, text } from './fixtures.ts';

const chapterUrl = (chapter: number): string | null => (chapter <= 66 ? `/ch${chapter.toString().padStart(2, '0')}/` : null);

describe('tokenizeRoute', () => {
  it('links two-digit chapter numbers and keeps the rest as text', () => {
    const tokens = tokenizeRoute('Volume I (01–24) → Part VI (31–36) → 61–62', chapterUrl);
    const chapters = tokens.filter((token) => token.type === 'chapter').map((token) => token.value);
    assert.deepEqual(chapters, ['01', '24', '31', '36', '61', '62']);
    assert.equal(tokens.map((token) => token.value).join(''), 'Volume I (01–24) → Part VI (31–36) → 61–62');
  });

  it('ignores digits inside longer numbers and marks unknown chapters unlinked', () => {
    const tokens = tokenizeRoute('2026 → 99, 06', chapterUrl);
    const chapters = tokens.filter((token) => token.type === 'chapter');
    assert.deepEqual(
      chapters.map((token) => [token.value, token.type === 'chapter' ? token.url : null]),
      [
        ['99', null],
        ['06', '/ch06/'],
      ],
    );
  });

  it('never treats 00 as a chapter', () => {
    assert.deepEqual(tokenizeRoute('00', chapterUrl), [{ type: 'text', value: '00' }]);
  });
});

describe('routeTables', () => {
  const cell = (value: string): readonly Inline[] => [text(value)];
  const routesDoc: ResearchDocument = {
    ...sectionDoc(),
    regions: [
      {
        role: 'other',
        title: '2. Reader entry routes',
        anchor: '2-reader-entry-routes',
        depth: 'overview',
        blocks: [
          {
            kind: 'table',
            anchor: null,
            depth: 'overview',
            role: 'generic',
            wide: false,
            columns: [
              { header: cell('Reader'), align: null },
              { header: cell('Route'), align: null },
              { header: cell('Why'), align: null },
            ],
            rows: [[cell('Systems engineer'), cell('01–06 → 13–17'), cell('Foundations first')]],
          },
          {
            kind: 'table',
            anchor: null,
            depth: 'overview',
            role: 'generic',
            wide: false,
            columns: [
              { header: cell('Name'), align: null },
              { header: cell('Value'), align: null },
              { header: cell('Note'), align: null },
            ],
            rows: [[cell('x'), cell('y'), cell('z')]],
          },
        ],
      },
    ],
  };

  it('extracts tables with a route column and strips section numbering from titles', () => {
    const tables = routeTables(routesDoc);
    assert.equal(tables.length, 1);
    assert.equal(tables[0]?.title, 'Reader entry routes');
    assert.deepEqual(tables[0]?.rows, [{ label: 'Systems engineer', route: '01–06 → 13–17', why: 'Foundations first' }]);
  });
});

describe('structured data', () => {
  const graph = smallGraph();
  const registry = smallRegistry();

  it('places a section inside its chapter, part, volume, and the book', () => {
    const ld = documentJsonLd({ doc: sectionDoc(), graph, registry, site: undefined, edition: '1.0' });
    assert.equal(ld['@type'], 'TechArticle');
    assert.equal(ld['dateModified'], '2026-09-20');
    const chain: string[] = [];
    let cursor: unknown = ld['isPartOf'];
    while (typeof cursor === 'object' && cursor !== null) {
      const record = cursor as Record<string, unknown>;
      chain.push(String(record['@type']));
      cursor = record['isPartOf'];
    }
    assert.deepEqual(chain, ['Chapter', 'CreativeWorkSeries', 'CreativeWorkSeries', 'Book']);
  });

  it('lists only resolved citations and resolves URLs against the site when configured', () => {
    const ld = documentJsonLd({ doc: sectionDoc(), graph, registry, site: new URL('https://atlas.example/'), edition: '1.0' });
    assert.equal(ld['url'], 'https://atlas.example/ch05/05-2/');
    const citations = ld['citation'];
    assert.ok(Array.isArray(citations));
    assert.equal(citations.length, 1);
    assert.equal(jsonForHtml(ld).includes('<'), false);
  });

  it('types paper objects by reference type', () => {
    assert.equal(referenceSchemaType({ type: 'paper' }), 'ScholarlyArticle');
    assert.equal(referenceSchemaType({ type: 'repository' }), 'SoftwareSourceCode');
    assert.equal(referenceSchemaType({ type: 'something else' }), 'CreativeWork');
    const record = registry.references[0];
    assert.ok(record !== undefined);
    const ld = paperJsonLd(record, undefined);
    assert.equal(ld['identifier'], 'P01');
    assert.equal(ld['url'], 'https://arxiv.org/abs/1706.03762');
  });

  it('describes the site with its volumes', () => {
    const ld = siteJsonLd(graph, undefined, '1.0');
    const about = ld['about'] as Record<string, unknown>;
    assert.equal(about['@type'], 'Book');
    assert.equal((about['hasPart'] as unknown[]).length, 1);
  });
});
