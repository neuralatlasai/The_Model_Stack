import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { cleanRendered, matchesRendered, parseSymbol, sameSymbol } from '../../src/client/eq-symbols.ts';

describe('parseSymbol', () => {
  test('plain and subscripted identifiers', () => {
    assert.deepEqual(parseSymbol('T'), { base: 'T', sub: '' });
    assert.deepEqual(parseSymbol('H_kv'), { base: 'H', sub: 'kv' });
    assert.deepEqual(parseSymbol('H_{kv}'), { base: 'H', sub: 'kv' });
    assert.deepEqual(parseSymbol('d_h'), { base: 'd', sub: 'h' });
    assert.deepEqual(parseSymbol('d_model'), { base: 'd', sub: 'model' });
  });

  test('TeX wrappers and math delimiters are stripped', () => {
    assert.deepEqual(parseSymbol('u_{\\mathrm{in}}'), { base: 'u', sub: 'in' });
    assert.deepEqual(parseSymbol('$T$'), { base: 'T', sub: '' });
    assert.deepEqual(parseSymbol('M_{\\text{KV}}'), { base: 'M', sub: 'KV' });
  });

  test('Greek letters written as words, commands, or glyphs', () => {
    assert.deepEqual(parseSymbol('beta'), { base: 'β', sub: '' });
    assert.deepEqual(parseSymbol('\\beta'), { base: 'β', sub: '' });
    assert.deepEqual(parseSymbol('β'), { base: 'β', sub: '' });
    assert.deepEqual(parseSymbol('\\pi_{\\theta}'), { base: 'π', sub: 'θ' });
  });

  test('multi-letter bases are not single symbols', () => {
    assert.equal(parseSymbol('MFU'), null);
    assert.equal(parseSymbol(''), null);
  });

  test('a superscript is not part of the subscript', () => {
    assert.deepEqual(parseSymbol('H_kv^2'), { base: 'H', sub: 'kv' });
  });
});

describe('matchesRendered', () => {
  test('matches base glyph and subscript text as KaTeX renders them', () => {
    const key = { base: 'H', sub: 'kv' };
    assert.equal(matchesRendered(key, 'H', '\u200bkv'), true);
    assert.equal(matchesRendered(key, 'H', '2kv'), true); // superscript and subscript share the box
    assert.equal(matchesRendered(key, 'H', 'q'), false);
    assert.equal(matchesRendered(key, 'L', 'kv'), false);
  });

  test('a bare symbol does not match a subscripted glyph but tolerates a numeric superscript', () => {
    const key = { base: 'T', sub: '' };
    assert.equal(matchesRendered(key, 'T', ''), true);
    assert.equal(matchesRendered(key, 'T', '2'), true);
    assert.equal(matchesRendered({ base: 'H', sub: '' }, 'H', 'kv'), false);
  });

  test('cleanRendered and sameSymbol', () => {
    assert.equal(cleanRendered(' k\u00a0v\u200b '), 'kv');
    assert.equal(sameSymbol({ base: 'H', sub: 'kv' }, { base: 'H', sub: 'kv' }), true);
    assert.equal(sameSymbol({ base: 'H', sub: 'kv' }, { base: 'H', sub: 'q' }), false);
  });
});
