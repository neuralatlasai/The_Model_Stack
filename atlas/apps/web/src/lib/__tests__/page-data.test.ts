import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PageDataSchema } from '@atlas/core';
import { jsonForHtml } from '../json.ts';
import { pageDataFor } from '../page-data.ts';
import { LONG_WORK, sectionDoc, smallGraph, smallRegistry } from './fixtures.ts';

describe('pageDataFor', () => {
  const data = pageDataFor(sectionDoc(), { graph: smallGraph(), registry: smallRegistry() });

  it('produces data that satisfies PageDataSchema', () => {
    assert.equal(PageDataSchema.safeParse(data).success, true);
  });

  it('embeds only references cited in the body or stacked in the rail', () => {
    assert.deepEqual(Object.keys(data.references).sort(), ['P01', 'R5.1']);
  });

  it('chooses the current chapter use and normalises its whitespace', () => {
    assert.equal(data.references['P01']?.usedFor, 'attention definition');
    assert.equal(data.references['R5.1']?.usedFor, 'API reference for SDPA');
  });

  it('clips long bibliographic fields to the schema limits', () => {
    const work = data.references['R5.1']?.work ?? '';
    assert.ok(LONG_WORK.length > 400);
    assert.equal(work.length, 400);
    assert.ok(work.endsWith('…'));
  });

  it('embeds glossary terms from the rail and ignores unknown slugs', () => {
    assert.deepEqual(Object.keys(data.terms), ['kv-cache']);
    assert.equal(data.terms['kv-cache']?.definition, 'Per-layer key and value tensors retained across decode steps.');
  });

  it('embeds equations defined on the page, including nested ones, and cross-referenced ones', () => {
    assert.deepEqual(Object.keys(data.equations).sort(), ['5.1', '5.2', '5.3']);
    assert.equal(data.equations['5.2']?.url, '/ch05/05-2/#eq-5-2');
    assert.equal(data.equations['5.3']?.anchor, 'eq-5-3');
    assert.equal(data.equations['5.1']?.url, '/ch05/05-1/#eq-5-1');
  });

  it('includes the neighbourhood as route references', () => {
    assert.deepEqual(
      data.neighbours.prerequisites.map((ref) => ref.id),
      ['ms.section.5.1'],
    );
    assert.deepEqual(
      data.neighbours.siblings.map((ref) => ref.id),
      ['ms.section.5.1'],
    );
  });

  it('lists every region with its role', () => {
    assert.deepEqual(
      data.regions.map((region) => `${region.anchor}:${region.role}`),
      ['formulation:formulation', 'siblings:siblings'],
    );
  });

  it('serialises safely for an inline script element', () => {
    const html = jsonForHtml(data);
    assert.equal(html.includes('<'), false);
    assert.deepEqual(JSON.parse(html), data);
  });
});
