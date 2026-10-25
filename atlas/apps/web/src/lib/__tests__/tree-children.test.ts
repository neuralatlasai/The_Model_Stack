import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildTreeChildren, parseTreeChildren, type TreeChildrenPayload } from '../tree-children.ts';
import { smallGraph } from './fixtures.ts';

function payload(): TreeChildrenPayload {
  const result = buildTreeChildren(smallGraph(), 'ms.chapter.5');
  assert.ok(result);
  return result;
}

describe('deferred chapter index', () => {
  it('uses graph order, titles and leaf URLs; planned or non-chapter parents have no endpoint', () => {
    assert.deepEqual(
      payload().children.map((child) => [child.id, child.title, child.url]),
      [
        ['ms.section.5.1', 'Execution trace', '/ch05/05-1/'],
        ['ms.section.5.2', 'Attention calculation', '/ch05/05-2/'],
      ],
    );
    for (const id of ['ms.chapter.6', 'ms.section.5.1', 'ms.chapter.99'])
      assert.equal(buildTreeChildren(smallGraph(), id), null);
  });

  it('supports root and prefixed deployment without double-prefixing fetched routes', () => {
    assert.equal(
      parseTreeChildren(payload(), 'ms.chapter.5', '/', 'https://example.org', '/ch05/')[0]?.url,
      '/ch05/05-1/',
    );
    const expected = '/The_Model_Stack/ch05/05-1/';
    assert.equal(
      parseTreeChildren(payload(), 'ms.chapter.5', '/The_Model_Stack/', 'https://example.org', '/ch05/')[0]?.url,
      expected,
    );
    const rebased = payload();
    rebased.url = '/The_Model_Stack/ch05/';
    rebased.children = rebased.children.map((child) => ({ ...child, url: `/The_Model_Stack${child.url}` }));
    assert.equal(
      parseTreeChildren(rebased, 'ms.chapter.5', '/The_Model_Stack/', 'https://example.org', '/ch05/')[0]?.url,
      expected,
    );
  });

  it('rejects malformed, cross-chapter and duplicate identities before creating DOM', () => {
    const base = payload();
    assert.throws(() =>
      parseTreeChildren({ ...base, id: 'ms.chapter.6' }, 'ms.chapter.5', '/', 'https://example.org', '/ch05/'),
    );
    assert.throws(() =>
      parseTreeChildren({ ...base, unknown: true }, 'ms.chapter.5', '/', 'https://example.org', '/ch05/'),
    );
    for (const id of ['ms.section.6.1', 'ms.chapter.5', 'ms.section.5.0', 'invalid']) {
      const changed = { ...base, children: [{ ...base.children[0], id }] };
      assert.throws(() => parseTreeChildren(changed, 'ms.chapter.5', '/', 'https://example.org', '/ch05/'));
    }
    assert.throws(() =>
      parseTreeChildren(
        { ...base, children: [base.children[0], base.children[0]] },
        'ms.chapter.5',
        '/',
        'https://example.org',
        '/ch05/',
      ),
    );
  });

  it('binds the payload parent path to the actual chapter link', () => {
    const base = payload();
    const changed = {
      ...base,
      url: '/ch06/',
      children: base.children.map((child) => ({ ...child, url: child.url.replace('/ch05/', '/ch06/') })),
    };
    assert.throws(() => parseTreeChildren(changed, 'ms.chapter.5', '/', 'https://example.org', '/ch05/'));
  });

  it('rejects unsafe paths and links outside the chapter or deployment base', () => {
    for (const url of [
      'javascript:alert(1)',
      '//evil.example/ch05/',
      'https://example.org/ch05/05-1/',
      '/ch05/\\evil/',
      '/ch05/05-1/?redirect=1',
      '/ch05/05-1/#other',
      '/ch06/06-1/',
      '/The_Model_Stack/../outside/',
      '/ch05/%2e%2e/other/',
    ]) {
      const base = payload();
      assert.throws(
        () =>
          parseTreeChildren(
            { ...base, children: [{ ...base.children[0], url }] },
            'ms.chapter.5',
            '/The_Model_Stack/',
            'https://example.org',
            '/ch05/',
          ),
        url,
      );
    }
  });
});
