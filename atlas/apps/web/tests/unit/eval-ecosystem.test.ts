import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { DOMAINS, KINDS, aliasMatcher, domainKindMatrix, ecosystem, hostLabel, matches } from '../../src/lib/eval-ecosystem.ts';

describe('evaluation ecosystem data', () => {
  const { entries, sources } = ecosystem();

  test('all 100 ranks, in order, each with a name, rationale, kind, and domain', () => {
    assert.equal(entries.length, 100);
    entries.forEach((entry, index) => {
      assert.equal(entry.rank, index + 1);
      assert.ok(entry.name.length > 0 && entry.why.length > 0, `#${String(entry.rank)} is complete`);
    });
    assert.equal(entries.filter((entry) => entry.core).length, 20);
    assert.deepEqual(
      entries.filter((entry) => entry.core).map((entry) => entry.rank),
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });

  test('every link is https with no tracking parameters, and every cited source exists', () => {
    const numbers = new Set(sources.map((source) => source.n));
    const urls = [...sources.map((source) => source.url), ...entries.flatMap((entry) => [entry.links.official, entry.links.repo, entry.links.paper])].filter((url) => url !== null);
    for (const url of urls) {
      assert.match(url, /^https:\/\//u);
      assert.doesNotMatch(url, /utm_/u, url);
    }
    for (const entry of entries) for (const ref of entry.refs) assert.ok(numbers.has(ref.n), `#${String(entry.rank)} cites [${String(ref.n)}]`);
  });

  test('chapter anchors are real chapter numbers', () => {
    for (const entry of entries) {
      assert.ok(entry.chapters.length > 0, `#${String(entry.rank)} has at least one chapter`);
      for (const n of entry.chapters) assert.ok(Number.isInteger(n) && n >= 1 && n <= 66);
    }
  });

  test('domain × kind matrix accounts for every entry', () => {
    const matrix = domainKindMatrix(entries);
    assert.equal(matrix.length, DOMAINS.length);
    for (const row of matrix) assert.equal(row.cells.length, KINDS.length);
    assert.equal(
      matrix.reduce((sum, row) => sum + row.total, 0),
      100,
    );
  });
});

describe('alias matching', () => {
  test('whole tokens only; case-sensitive unless marked with ~', () => {
    const helm = aliasMatcher(['HELM']);
    assert.ok(matches(helm, 'Stanford HELM reports'));
    assert.ok(!matches(helm, 'take the helm'));
    assert.ok(!matches(helm, 'OVERWHELMING'));
    const web = aliasMatcher(['WebArena']);
    assert.ok(matches(web, 'agents on WebArena.'));
    assert.ok(!matches(web, 'VisualWebArena results'));
    const aider = aliasMatcher(['~aider polyglot']);
    assert.ok(matches(aider, 'the Aider Polyglot benchmark'));
    const swe = aliasMatcher(['SWE-bench']);
    assert.ok(matches(swe, 'SWE-bench Verified'));
    assert.ok(!matches(swe, 'APEX-SWE-bench'));
  });

  test('host labels keep the owner for code hosts', () => {
    assert.equal(hostLabel('https://github.com/EleutherAI/lm-evaluation-harness'), 'github.com/EleutherAI');
    assert.equal(hostLabel('https://www.swebench.com/'), 'swebench.com');
  });
});
