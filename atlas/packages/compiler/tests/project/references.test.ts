import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { must } from './fixtures.ts';
import { canonicalValue, compareCitationKeys, mergeReferences, parseReferencesFile, urlCell } from '../../src/registry/references.ts';

const ORDER_A = `# References — Chapter 05

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Used for | Accessed |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani et al. | NeurIPS 2017 | https://arxiv.org/abs/1706.03762 | https://github.com/tensorflow/tensor2tensor | peer-reviewed | Eq. 5.5–5.7 | 2026-09-20 (arXiv HTML v7) |
| R5.1 | paper | Gaussian Error Linear Units (GELUs) | Hendrycks, Gimpel | arXiv 2016 | https://arxiv.org/abs/1606.08415 | null | preprint | §5.3: GELU | 2026-09-20 |
`;

const ORDER_B = `# Chapter 06 — References

## Primary-paper spine

| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| P01 | paper | Attention Is All You Need | Vaswani, Shazeer et al. | NeurIPS 2017 | [Abstract](https://arxiv.org/abs/1706.03762); [v7](https://arxiv.org/html/1706.03762v7) | null | preprint (venue not confirmed on page) | 2026-09-21 | §6.2 motivation |

## Chapter-specific sources

| Key | Work | Type | Status | Primary URL | Official code | Accessed | Used for | Authors / organisation | Venue / year |
|---|---|---|---|---|---|---|---|---|---|
| R6.11 | LMArena leaderboards | measurement source | UNVERIFIED | null | null | null | Current layout could not be revalidated | LMArena | current page |
| R6.99 | Something | brochure | archived | not a url | null | 2026-09-20 | x | Org | 2024 |
| Q1 | Not a key | paper | preprint | null | null | null | x | Org | 2024 |
`;

describe('parseReferencesFile', () => {
  it('maps columns by header name regardless of order', () => {
    const a = parseReferencesFile({ file: 'ch05/references.md', chapter: 5, body: ORDER_A, bodyStartLine: 30, nodeId: 'ms.references.5' });
    assert.equal(a.rows.length, 2);
    const p01 = must(a.rows[0]);
    assert.equal(p01.key, 'P01');
    assert.equal(p01.work, 'Attention Is All You Need');
    assert.equal(p01.usedFor, 'Eq. 5.5–5.7');
    assert.equal(p01.accessed, '2026-09-20 (arXiv HTML v7)');
    assert.equal(p01.code, 'https://github.com/tensorflow/tensor2tensor');
    assert.equal(p01.line, 34, 'row line is offset by the body start');
    assert.equal(a.rows[1]?.code, null, '"null" cells become null');
    assert.deepEqual(a.diagnostics, []);

    const b = parseReferencesFile({ file: 'ch06/references.md', chapter: 6, body: ORDER_B, bodyStartLine: 1, nodeId: 'ms.references.6' });
    const r611 = must(b.rows.find((row) => row.key === 'R6.11'));
    assert.equal(r611.work, 'LMArena leaderboards');
    assert.equal(r611.type, 'measurement source');
    assert.equal(r611.authors, 'LMArena');
    assert.equal(r611.venue, 'current page');
    assert.equal(r611.url, null);
    assert.equal(r611.accessed, null);
    const spine = must(b.rows.find((row) => row.key === 'P01'));
    assert.equal(spine.url, 'https://arxiv.org/abs/1706.03762', 'first Markdown link wins');
    assert.equal(spine.status, 'preprint', 'qualified status folds to its canonical value');
  });

  it('diagnoses malformed rows without dropping valid ones', () => {
    const b = parseReferencesFile({ file: 'ch06/references.md', chapter: 6, body: ORDER_B, bodyStartLine: 1, nodeId: 'ms.references.6' });
    const messages = b.diagnostics.map((item) => item.message);
    assert.ok(messages.some((message) => message.includes('"Q1" is not a citation key')));
    assert.ok(messages.some((message) => message.includes('type "brochure"')));
    assert.ok(messages.some((message) => message.includes('contains no http(s) URL')));
    assert.ok(b.diagnostics.every((item) => item.code === 'reference-row-malformed' && item.severity === 'warning'));
    assert.ok(b.rows.some((row) => row.key === 'R6.99'));
  });

  it('flags a chapter key listed in another chapter', () => {
    const body = `| Key | Type | Work | Authors / organisation | Venue / year | Primary URL | Official code | Status | Accessed | Used for |
|---|---|---|---|---|---|---|---|---|---|
| R5.1 | paper | GELU | H | 2016 | null | null | preprint | null | x |
`;
    const parsed = parseReferencesFile({ file: 'ch07/references.md', chapter: 7, body, bodyStartLine: 1, nodeId: null });
    assert.match(parsed.diagnostics[0]?.message ?? '', /chapter-5 key listed in chapter 7/u);
  });
});

describe('mergeReferences', () => {
  it('merges spine keys across chapters, records uses per chapter, and notes conflicts as info', () => {
    const a = parseReferencesFile({ file: 'ch05/references.md', chapter: 5, body: ORDER_A, bodyStartLine: 1, nodeId: null });
    const b = parseReferencesFile({ file: 'ch06/references.md', chapter: 6, body: ORDER_B, bodyStartLine: 1, nodeId: null });
    const merged = mergeReferences([...a.rows, ...b.rows]);
    const p01 = merged.records.find((record) => record.key === 'P01');
    assert.ok(p01 !== undefined);
    assert.equal(p01.spine, true);
    assert.equal(p01.authors, 'Vaswani et al.', 'first listing wins');
    assert.deepEqual(
      p01.uses.map((use) => use.chapter),
      [5, 6],
    );
    assert.equal(p01.atlasUrl, '/papers/p01/');
    assert.deepEqual(p01.citedBy, []);
    const conflict = must(merged.diagnostics.find((item) => item.message.startsWith('P01')));
    assert.equal(conflict.code, 'reference-duplicate-conflict');
    assert.equal(conflict.severity, 'info');
    assert.match(conflict.message, /authors/u);
    assert.deepEqual(
      merged.records.map((record) => record.key),
      ['P01', 'R5.1', 'R6.11', 'R6.99'],
    );
  });

  it('lets Appendix D rows supply spine metadata without adding a use', () => {
    const a = parseReferencesFile({ file: 'ch05/references.md', chapter: 5, body: ORDER_A, bodyStartLine: 1, nodeId: null });
    const first = a.rows[0];
    assert.ok(first !== undefined);
    const authority = [{ ...first, work: 'Attention Is All You Need (spine)', chapter: 0, file: 'appendices/d.md' }];
    const merged = mergeReferences(a.rows, authority);
    const p01 = must(merged.records.find((record) => record.key === 'P01'));
    assert.equal(p01.work, 'Attention Is All You Need (spine)');
    assert.deepEqual(
      p01.uses.map((use) => use.chapter),
      [5],
    );
  });
});

describe('reference helpers', () => {
  it('orders spine keys numerically before chapter keys', () => {
    assert.deepEqual(['R10.2', 'P19', 'R5.13', 'P01', 'R5.2'].sort(compareCitationKeys), ['P01', 'P19', 'R5.2', 'R5.13', 'R10.2']);
  });

  it('extracts URLs from cells', () => {
    assert.equal(urlCell('null', []), null);
    assert.equal(urlCell('', []), null);
    assert.equal(urlCell('https://docs.vllm.ai/', []), 'https://docs.vllm.ai/');
    assert.equal(urlCell('see https://x.org/a and more', []), 'https://x.org/a');
    assert.equal(urlCell('[Record](https://arxiv.org/abs/1)', ['https://arxiv.org/abs/1']), 'https://arxiv.org/abs/1');
  });

  it('folds qualified vocabulary values', () => {
    assert.equal(canonicalValue('peer-reviewed (per abs comments)', ['peer-reviewed', 'preprint']), 'peer-reviewed');
    assert.equal(canonicalValue('preprints', ['preprint']), null);
    assert.equal(canonicalValue('UNVERIFIED', ['UNVERIFIED']), 'UNVERIFIED');
  });
});
