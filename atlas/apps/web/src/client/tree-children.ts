/** Loaded only when a reader expands a chapter whose children are not already in the HTML. */
import { parseTreeChildren } from '../lib/tree-children.ts';
import { h } from './dom.ts';
import type { PageContext } from './page.ts';

const MAX_INDEX_BYTES = 64 * 1024;

/** Bound decoded transfer bytes before retaining or parsing an index. */
export async function readTreeIndex(response: Response): Promise<unknown> {
  const length = response.headers.get('content-length');
  if (length !== null && /^\d+$/u.test(length) && Number(length) > MAX_INDEX_BYTES) {
    await response.body?.cancel();
    throw new Error('Chapter index exceeds its size limit');
  }
  if (response.body === null) throw new Error('Chapter index body is missing');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const parts: string[] = [];
  let bytes = 0;
  let finished = false;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) {
        finished = true;
        break;
      }
      bytes += chunk.value.byteLength;
      if (bytes > MAX_INDEX_BYTES) throw new Error('Chapter index exceeds its size limit');
      parts.push(decoder.decode(chunk.value, { stream: true }));
    }
    parts.push(decoder.decode());
    const raw: unknown = JSON.parse(parts.join(''));
    return raw;
  } finally {
    if (!finished) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function fetchTreeChildren(
  ctx: PageContext,
  chapterId: string,
  chapter: string,
  level: number,
  expectedChapterUrl: string,
): Promise<{ readonly rows: readonly HTMLElement[]; readonly items: readonly HTMLElement[] }> {
  if (!/^[1-9]\d*$/u.test(chapter) || ctx.ctl.disposed) throw new Error('Invalid chapter request');
  const response = await fetch(`${ctx.base}tree-children/${chapter}.json`, {
    credentials: 'same-origin',
    signal: AbortSignal.any([ctx.ctl.signal, AbortSignal.timeout(10_000)]),
  });
  if (!response.ok) throw new Error('Chapter index request failed');
  const children = parseTreeChildren(
    await readTreeIndex(response),
    chapterId,
    ctx.base,
    location.origin,
    expectedChapterUrl,
  );
  const items: HTMLElement[] = [];
  const rows = children.map((child) => {
    const item = h(
      'a',
      {
        role: 'treeitem',
        class: 'sh-tree-link',
        href: child.url,
        'data-tree-node': child.id,
        'aria-level': level,
        tabindex: -1,
      },
      h('span', { class: 'sh-tree-num', 'aria-hidden': child.number === null ? 'true' : null }, child.number ?? ''),
      h('span', { class: 'sh-tree-label' }, child.title),
      child.hasManuscript ? null : h('span', { class: 'sh-visually-hidden' }, ' (planned)'),
      h('span', { class: 'sh-tree-progress', 'data-progress': child.id, 'aria-hidden': 'true' }),
    );
    items.push(item);
    return h(
      'li',
      { role: 'none', class: `sh-tree-item${child.hasManuscript ? '' : ' sh-tree-item--planned'}` },
      h('div', { class: 'sh-tree-row' }, item),
    );
  });
  return { rows, items };
}
