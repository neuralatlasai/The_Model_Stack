/**
 * Chapter-page cross-lighting: the section index and the "at a glance" grid
 * are two views of the same six sections; pointing at a section in either
 * lights it in the other, so the reader sees what each section holds before
 * opening it.
 */
import type { PageContext } from './page.ts';

const pathOf = (href: string | null): string => (href === null ? '' : new URL(href, location.href).pathname);

export function initChapterLinks(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const index = [...doc.querySelectorAll<HTMLElement>('.rb-secidx__item')];
  const glance = [...doc.querySelectorAll<HTMLTableRowElement>('.rb-glance__table tbody tr')];
  if (index.length === 0 || glance.length === 0) return;
  const keyOfIndex = (item: HTMLElement): string => pathOf(item.querySelector('a.rb-secidx__title')?.getAttribute('href') ?? null);
  const keyOfRow = (row: HTMLElement): string => pathOf(row.querySelector('.rb-glance__sec a')?.getAttribute('href') ?? null);
  const light = (key: string): void => {
    for (const item of index) item.classList.toggle('is-lit', key !== '' && keyOfIndex(item) === key);
    for (const row of glance) row.classList.toggle('is-lit', key !== '' && keyOfRow(row) === key);
  };
  for (const item of index) {
    item.addEventListener('pointerenter', () => {
      light(keyOfIndex(item));
    }, { signal: ctl.signal });
    item.addEventListener('pointerleave', () => {
      light('');
    }, { signal: ctl.signal });
  }
  for (const row of glance) {
    row.addEventListener('pointerenter', () => {
      light(keyOfRow(row));
    }, { signal: ctl.signal });
    row.addEventListener('pointerleave', () => {
      light('');
    }, { signal: ctl.signal });
  }
}
