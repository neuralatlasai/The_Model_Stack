import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { paperUrl } from '@atlas/core';
import { modeLinks } from '../modes.ts';
import { ancestorsOf, enclosing, identityLine, nodesOfType, orderNeighbours, treeContains, treeState } from '../nodes.ts';
import { chapterFragment, compareUrl, domIdFor, mapUrl, paperParam, pathParam, withDepth } from '../urls.ts';
import { smallGraph } from './fixtures.ts';

describe('graph helpers', () => {
  const graph = smallGraph();

  it('lists ancestors root first', () => {
    assert.deepEqual(
      ancestorsOf(graph, 'ms.section.5.2').map((node) => node.id),
      ['ms.volume.1', 'ms.part.1', 'ms.chapter.5'],
    );
    assert.deepEqual(ancestorsOf(graph, 'ms.volume.1'), []);
  });

  it('expands the active branch and collapses unrelated ones', () => {
    const state = treeState(graph, 'ms.section.5.2');
    assert.deepEqual([...state.expanded].sort(), ['ms.chapter.5', 'ms.part.1', 'ms.volume.1']);
    assert.equal(state.activePath.has('ms.section.5.2'), true);
    assert.equal(state.expanded.has('ms.chapter.6'), false);
    assert.equal(state.currentId, 'ms.section.5.2');
  });

  it('opens the volumes when there is no current node', () => {
    const state = treeState(graph, null);
    assert.deepEqual([...state.expanded], ['ms.volume.1']);
    assert.equal(state.currentId, null);
  });

  it('ignores a current id that is not in the graph', () => {
    const state = treeState(graph, 'ms.section.9.9');
    assert.equal(state.currentId, null);
  });

  it('builds identity lines from the hierarchy', () => {
    const chapter = graph.nodes['ms.chapter.6'];
    assert.ok(chapter !== undefined);
    assert.equal(identityLine(graph, chapter), 'VOLUME I / PART I — SCIENTIFIC FOUNDATIONS / CHAPTER 06');
  });

  it('walks the reading order and finds enclosing nodes', () => {
    const { prev, next } = orderNeighbours(graph, 'ms.chapter.6');
    assert.equal(prev?.id, 'ms.section.5.2');
    assert.equal(next?.id, 'ms.section.6.1');
    assert.equal(enclosing(graph, 'ms.section.6.1', 'chapter')?.id, 'ms.chapter.6');
    assert.equal(enclosing(graph, 'ms.chapter.6', 'chapter')?.id, 'ms.chapter.6');
    assert.equal(enclosing(graph, 'ms.volume.1', 'chapter'), null);
  });

  it('orders nodes of a type by reading order', () => {
    assert.deepEqual(
      nodesOfType(graph, 'chapter').map((node) => node.id),
      ['ms.chapter.5', 'ms.chapter.6'],
    );
    assert.equal(treeContains(graph.tree, 'ms.section.6.1'), true);
    assert.equal(treeContains(graph.tree, 'ms.section.9.9'), false);
  });
});

describe('url helpers', () => {
  it('derives rest parameters from node URLs', () => {
    assert.equal(pathParam('/'), undefined);
    assert.equal(pathParam('/a/b/'), 'a/b');
    assert.equal(pathParam('/a/b'), 'a/b');
    assert.equal(pathParam('/a/b/?depth=overview#x'), 'a/b');
  });

  it('mirrors node URLs under the map and compare views', () => {
    assert.equal(mapUrl('/ch05/05-2/'), '/graph/ch05/05-2/');
    assert.equal(compareUrl('/ch05/05-2'), '/compare/ch05/05-2/');
  });

  it('agrees with core paperUrl for paper routes', () => {
    assert.equal(`/papers/${paperParam('P01')}/`, paperUrl('P01'));
    assert.equal(`/papers/${paperParam('R5.13')}/`, paperUrl('R5.13'));
  });

  it('builds fragments, DOM ids, and depth links', () => {
    assert.equal(chapterFragment(5), 'ch-05');
    assert.equal(domIdFor('tg', 'ms.section.5.2'), 'tg-ms-section-5-2');
    assert.equal(withDepth('/ch05/', 'overview'), '/ch05/?depth=overview');
  });
});

describe('mode links', () => {
  const graph = smallGraph();

  it('points Papers at the page references region when present', () => {
    const links = modeLinks({ graph, url: '/ch05/05-2/', chapter: 5, referencesAnchor: 'references', hasCompare: true });
    assert.equal(links.read, '/ch05/05-2/');
    assert.equal(links.map, '/graph/ch05/05-2/');
    assert.equal(links.papers, '/ch05/05-2/#references');
    assert.equal(links.implementations, '/systems/#ch-05');
    assert.equal(links.compare, '/compare/ch05/05-2/');
  });

  it('falls back to index pages when the node has no own targets', () => {
    const links = modeLinks({ graph, url: '/ch06/', chapter: 6, referencesAnchor: null, hasCompare: false, chapterHasCompare: true });
    assert.equal(links.papers, '/papers/');
    assert.equal(links.compare, '/compare/#ch-06');
    // A chapter with no compare pages has no #ch-NN group on the compare index: link the index itself.
    const bare = modeLinks({ graph, url: '/ch06/', chapter: 6, referencesAnchor: null, hasCompare: false });
    assert.equal(bare.compare, '/compare/');
    const reference = modeLinks({ graph, url: '/front-matter/notation/', chapter: null, referencesAnchor: null, hasCompare: false });
    assert.equal(reference.implementations, '/systems/');
    assert.equal(reference.compare, '/compare/');
  });
});
