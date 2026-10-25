import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readTreeIndex } from '../../src/client/tree-children.ts';

describe('bounded chapter index response', () => {
  it('decodes valid UTF-8 even when one character crosses stream chunks', async () => {
    const bytes = new TextEncoder().encode('{"title":"é"}');
    const split = bytes.indexOf(0xc3) + 1;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, split));
        controller.enqueue(bytes.slice(split));
        controller.close();
      },
    });
    assert.deepEqual(await readTreeIndex(new Response(body)), { title: 'é' });
  });

  it('rejects an oversized advertised length and cancels before consuming the body', async () => {
    let canceled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        canceled = true;
      },
    });
    await assert.rejects(readTreeIndex(new Response(body, { headers: { 'content-length': '65537' } })), /size limit/u);
    assert.equal(canceled, true);
  });

  it('counts UTF-8 bytes while streaming even when Content-Length understates the response', async () => {
    let canceled = false;
    const bytes = new TextEncoder().encode(JSON.stringify({ title: 'é'.repeat(33_000) }));
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes);
      },
      cancel() {
        canceled = true;
      },
    });
    await assert.rejects(readTreeIndex(new Response(body, { headers: { 'content-length': '10' } })), /size limit/u);
    assert.equal(canceled, true);
  });

  it('rejects missing bodies and invalid JSON', async () => {
    await assert.rejects(readTreeIndex(new Response(null)), /body is missing/u);
    await assert.rejects(readTreeIndex(new Response('invalid')), SyntaxError);
  });
});
