import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { depthFromUrl, linkWithDepth, pageUrlWithDepth, resolveDepth } from '../../src/client/depth-url.ts';

const PAGE = 'https://atlas.test/ch05-minimal-transformer/05-2-attention/?depth=technical#formulation';

describe('depthFromUrl', () => {
  test('valid ?depth= is returned', () => {
    assert.equal(depthFromUrl('https://atlas.test/x/?depth=research'), 'research');
  });

  test('absent, invalid, or unparsable → null', () => {
    assert.equal(depthFromUrl('https://atlas.test/x/'), null);
    assert.equal(depthFromUrl('https://atlas.test/x/?depth=%3Cscript%3E'), null);
    assert.equal(depthFromUrl('not a url'), null);
  });
});

describe('resolveDepth', () => {
  test('URL wins over storage, storage over default', () => {
    assert.equal(resolveDepth('overview', 'research'), 'overview');
    assert.equal(resolveDepth(null, 'research'), 'research');
    assert.equal(resolveDepth(null, null), 'implementation');
  });
});

describe('pageUrlWithDepth', () => {
  test('sets the parameter and keeps the fragment', () => {
    assert.equal(pageUrlWithDepth('https://atlas.test/a/#eq-5-4', 'overview'), 'https://atlas.test/a/?depth=overview#eq-5-4');
  });

  test('the default depth removes the parameter', () => {
    assert.equal(pageUrlWithDepth(PAGE, 'implementation'), 'https://atlas.test/ch05-minimal-transformer/05-2-attention/#formulation');
  });

  test('other query parameters survive', () => {
    assert.equal(pageUrlWithDepth('https://atlas.test/graph/?node=ms.section.5.2', 'research'), 'https://atlas.test/graph/?node=ms.section.5.2&depth=research');
  });
});

describe('linkWithDepth', () => {
  test('internal page links carry the depth', () => {
    assert.equal(linkWithDepth('/ch05-minimal-transformer/05-3-mlp/', 'technical', PAGE), '/ch05-minimal-transformer/05-3-mlp/?depth=technical');
  });

  test('relative links are resolved against the page', () => {
    assert.equal(linkWithDepth('../05-1-scope/#why', 'overview', PAGE), '/ch05-minimal-transformer/05-1-scope/?depth=overview#why');
  });

  test('an existing depth parameter is replaced, and removed for the default depth', () => {
    assert.equal(linkWithDepth('/a/?depth=overview', 'research', PAGE), '/a/?depth=research');
    assert.equal(linkWithDepth('/a/?depth=overview', 'implementation', PAGE), '/a/');
  });

  test('same-page fragment links are left alone (a query would turn a jump into a navigation)', () => {
    assert.equal(linkWithDepth('#eq-5-4', 'overview', PAGE), null);
  });

  test('other origins, non-http schemes, and file paths are left alone', () => {
    assert.equal(linkWithDepth('https://arxiv.org/abs/1706.03762', 'overview', PAGE), null);
    assert.equal(linkWithDepth('mailto:someone@example.org', 'overview', PAGE), null);
    assert.equal(linkWithDepth('javascript:alert(1)', 'overview', PAGE), null);
    assert.equal(linkWithDepth('/search-index.json', 'overview', PAGE), null);
  });
});
