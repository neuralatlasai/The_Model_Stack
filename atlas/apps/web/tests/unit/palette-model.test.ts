import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import type { SearchHit } from '@atlas/core';
import { COMMANDS, formatCitation, groupHits, locator, parseQuery, rankCommands, typeLine } from '../../src/client/palette-model.ts';

describe('parseQuery', () => {
  test('">" switches to command mode (leading whitespace tolerated)', () => {
    assert.deepEqual(parseQuery('>depth'), { mode: 'command', text: 'depth' });
    assert.deepEqual(parseQuery('  >  toggle dark '), { mode: 'command', text: 'toggle dark' });
    assert.deepEqual(parseQuery('>'), { mode: 'command', text: '' });
  });

  test('anything else searches', () => {
    assert.deepEqual(parseQuery(' kv cache '), { mode: 'search', text: 'kv cache' });
    assert.deepEqual(parseQuery('a > b'), { mode: 'search', text: 'a > b' });
  });
});

describe('rankCommands', () => {
  test('empty query lists every command in catalogue order', () => {
    assert.deepEqual(
      rankCommands(COMMANDS, '').map((command) => command.id),
      COMMANDS.map((command) => command.id),
    );
  });

  test('title prefix beats word prefix beats keyword', () => {
    const ids = rankCommands(COMMANDS, 'depth').map((command) => command.id);
    assert.deepEqual(ids.slice(0, 4), ['depth-overview', 'depth-technical', 'depth-research', 'depth-implementation']);
  });

  test('every token must match', () => {
    assert.deepEqual(
      rankCommands(COMMANDS, 'toggle dark').map((command) => command.id),
      ['toggle-dark'],
    );
    assert.deepEqual(rankCommands(COMMANDS, 'dark nonsense'), []);
  });

  test('keywords find commands whose titles do not mention the word', () => {
    assert.ok(rankCommands(COMMANDS, 'theme').some((command) => command.id === 'toggle-dark'));
    assert.ok(rankCommands(COMMANDS, 'cite').some((command) => command.id === 'copy-citation'));
  });
});

describe('groupHits', () => {
  const hit = (id: string, kind: SearchHit['kind'], score: number): SearchHit => ({ id, kind, title: id, context: 'Foundations / Transformer', url: `/${id}/`, score });

  test('groups by kind, groups ordered by their best hit, hits by score', () => {
    const groups = groupHits([hit('p1', 'paper', 5), hit('s1', 'section', 9), hit('s2', 'section', 2), hit('e1', 'equation', 7)], 10);
    assert.deepEqual(
      groups.map((group) => group.kind),
      ['section', 'equation', 'paper'],
    );
    assert.deepEqual(
      groups[0]?.hits.map((entry) => entry.id),
      ['s1', 's2'],
    );
    assert.equal(groups[0]?.label, 'CONCEPT');
  });

  test('keeps only the best `limit` hits', () => {
    const groups = groupHits([hit('a', 'term', 1), hit('b', 'term', 3), hit('c', 'paper', 2)], 2);
    assert.deepEqual(
      groups.flatMap((group) => group.hits.map((entry) => entry.id)),
      ['b', 'c'],
    );
  });
});

describe('typeLine', () => {
  test('object type label plus context', () => {
    assert.equal(typeLine({ kind: 'paper', context: 'Kwon et al.' }), 'PAPER · Kwon et al.');
    assert.equal(typeLine({ kind: 'system', context: '' }), 'SYSTEM');
  });
});

describe('formatCitation', () => {
  test('section pages cite §n', () => {
    assert.equal(
      formatCitation('Attention as a memory read', 'ms.section.5.2', 'https://atlas.test/ch05/05-2/'),
      'Attention as a memory read — The Model Stack, §5.2, https://atlas.test/ch05/05-2/',
    );
  });

  test('chapter pages cite the chapter; other pages omit the locator', () => {
    assert.equal(locator('ms.chapter.11'), 'Chapter 11');
    assert.equal(formatCitation('Notation', 'ms.frontmatter.notation', 'https://atlas.test/front-matter/notation/'), 'Notation — The Model Stack, https://atlas.test/front-matter/notation/');
    assert.equal(locator(null), null);
  });
});
