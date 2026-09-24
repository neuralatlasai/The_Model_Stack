/**
 * Paper page behaviour (pages/papers/[key].astro): the chapter grid, its
 * readout, the co-citation list, the lineage entries, and the "Used for"
 * table are one instrument.
 *
 * - Point at (or focus) a lit chapter dot or a table row: the dot is ringed,
 *   the readout names the chapter, what the book uses the work for there, and
 *   lists its citing pages.
 * - Point at a co-cited work: the chapters holding the pages it shares with
 *   this one stay lit (ink ring), the rest dim; the readout lists the shared
 *   pages.
 * - Point at a lineage entry: its chapter lights and the readout gives the
 *   entry's note.
 * - Keyboard: the grid is one tab stop; arrows step through lit chapters;
 *   Enter opens; Escape clears. The co-citation list is one tab stop with
 *   Up/Down. Everything restores when the pointer leaves the instrument.
 *
 * The data comes from a JSON island parsed with zod; readout nodes are built
 * with textContent only.
 */
import { z } from 'zod';
import type { PageContext } from './page.ts';

const PageSchema = z.object({ label: z.string(), title: z.string(), url: z.string() });
const ModelSchema = z.object({
  key: z.string(),
  pages: z.number().int(),
  chapters: z.array(
    z.object({
      n: z.number().int(),
      number: z.string(),
      title: z.string(),
      url: z.string(),
      pages: z.array(PageSchema),
      uses: z.array(z.string()),
      accessed: z.array(z.string()),
    }),
  ),
  cocited: z.array(z.object({ key: z.string(), work: z.string(), chapters: z.array(z.number().int()), shared: z.array(PageSchema) })),
  lineage: z.array(z.object({ index: z.number().int(), year: z.string(), relation: z.string(), work: z.string(), note: z.string(), chapter: z.number().int().nullable() })),
});
type Model = z.output<typeof ModelSchema>;
type Page = z.output<typeof PageSchema>;

const LIST_ROWS = 6;
const plural = (n: number, one: string, many = `${one}s`): string => `${String(n)} ${n === 1 ? one : many}`;

export function initPaperPage(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-pp-root]');
  const svg = root?.querySelector<SVGSVGElement>('[data-pp-svg]') ?? null;
  const readout = root?.querySelector<HTMLElement>('[data-pp-readout]') ?? null;
  if (root === null || svg === null || readout === null) return;
  const signal = ctl.signal;

  let model: Model;
  try {
    const parsed = ModelSchema.safeParse(JSON.parse(root.querySelector('script[data-pp-model]')?.textContent ?? ''));
    if (!parsed.success) return;
    model = parsed.data;
  } catch {
    return;
  }
  const chapterOf = new Map(model.chapters.map((chapter) => [chapter.n, chapter]));
  const cocitedOf = new Map(model.cocited.map((work) => [work.key, work]));
  const lineageOf = new Map(model.lineage.map((entry) => [entry.index, entry]));

  const dots = new Map<number, SVGAElement>();
  for (const dot of svg.querySelectorAll<SVGAElement>('[data-pp-n]')) dots.set(Number(dot.dataset['ppN']), dot);
  const rows = new Map<number, HTMLTableRowElement>();
  for (const row of root.querySelectorAll<HTMLTableRowElement>('[data-pp-row]')) rows.set(Number(row.dataset['ppRow']), row);
  const coRows = [...root.querySelectorAll<HTMLAnchorElement>('[data-pp-co]')];

  // ── readout ───────────────────────────────────────────────────────────────
  const slot = (name: string): HTMLElement | null => readout.querySelector<HTMLElement>(`[data-pp-${name}]`);
  const out = { kicker: slot('kicker'), title: slot('title'), text: slot('text'), listhead: slot('listhead'), list: slot('list'), foot: slot('foot') };
  const initial = new Map<HTMLElement, Node[]>();
  for (const el of Object.values(out)) if (el !== null) initial.set(el, [...el.childNodes].map((node) => node.cloneNode(true)));
  const set = (el: HTMLElement | null, value: string): void => {
    if (el !== null) el.textContent = value;
  };
  const span = (className: string, value: string): HTMLSpanElement => {
    const el = doc.createElement('span');
    el.className = className;
    el.textContent = value;
    return el;
  };
  const listHead = (left: string, right: string): void => {
    out.listhead?.replaceChildren(span('', left), span('', right));
  };
  const pageList = (pages: readonly Page[]): void => {
    out.list?.replaceChildren(
      ...pages.slice(0, LIST_ROWS).map((page) => {
        const item = doc.createElement('li');
        item.className = 'pp-ro__item';
        const link = doc.createElement('a');
        link.href = page.url;
        link.tabIndex = -1;
        link.append(span('pp-ro__num', page.label), span('pp-ro__text2', page.title));
        item.append(link);
        return item;
      }),
    );
    set(out.foot, pages.length > LIST_ROWS ? `+${String(pages.length - LIST_ROWS)} more — all in “Used for” below` : '');
  };
  const restore = (): void => {
    for (const [el, nodes] of initial) el.replaceChildren(...nodes.map((node) => node.cloneNode(true)));
  };

  // ── lighting ──────────────────────────────────────────────────────────────
  let current: string | null = null;
  const clear = (): void => {
    current = null;
    svg.classList.remove('has-focus', 'has-co');
    for (const dot of dots.values()) dot.classList.remove('is-focus', 'is-shared');
    for (const row of rows.values()) row.classList.remove('is-on');
    for (const row of coRows) row.classList.remove('is-on');
  };
  const reset = (): void => {
    clear();
    restore();
  };

  const showChapter = (n: number): void => {
    if (current === `ch:${String(n)}`) return;
    const chapter = chapterOf.get(n);
    if (chapter === undefined) return;
    clear();
    current = `ch:${String(n)}`;
    svg.classList.add('has-focus');
    dots.get(n)?.classList.add('is-focus');
    rows.get(n)?.classList.add('is-on');
    set(out.kicker, `Chapter ${chapter.number} · ${chapter.pages.length === 0 ? 'no citing page' : plural(chapter.pages.length, 'citing page')}`);
    set(out.title, chapter.title);
    set(
      out.text,
      chapter.uses.length === 0
        ? `No use is recorded in this chapter's references; ${model.key} is cited on the pages below.`
        : `Used for: ${chapter.uses.join(' · ')}`,
    );
    listHead('Citing pages', chapter.uses.length === 0 ? 'no use recorded' : chapter.accessed.length > 0 ? `accessed ${chapter.accessed.join(', ')}` : 'not accessed — UNVERIFIED');
    pageList(chapter.pages);
  };

  const showCocited = (key: string): void => {
    if (current === `co:${key}`) return;
    const work = cocitedOf.get(key);
    if (work === undefined) return;
    clear();
    current = `co:${key}`;
    svg.classList.add('has-co');
    for (const n of work.chapters) dots.get(n)?.classList.add('is-shared');
    coRows.find((row) => row.dataset['ppCo'] === key)?.classList.add('is-on');
    set(out.kicker, `Cited alongside · ${work.key}`);
    set(out.title, work.work);
    set(
      out.text,
      `Shares ${plural(work.shared.length, 'page')} of ${model.key}'s ${String(model.pages)} with this work${work.chapters.length > 0 ? `, in ${work.chapters.length === 1 ? 'chapter' : 'chapters'} ${work.chapters.map((n) => String(n).padStart(2, '0')).join(', ')}` : ''} — the chapters ringed in the grid.`,
    );
    listHead('Shared pages', String(work.shared.length));
    pageList(work.shared);
  };

  const showLineage = (index: number): void => {
    if (current === `ln:${String(index)}`) return;
    const entry = lineageOf.get(index);
    if (entry === undefined) return;
    clear();
    current = `ln:${String(index)}`;
    const chapter = entry.chapter === null ? undefined : chapterOf.get(entry.chapter);
    if (entry.chapter !== null) {
      svg.classList.add('has-focus');
      dots.get(entry.chapter)?.classList.add('is-focus');
    }
    set(out.kicker, `Lineage · ${entry.year} · ${entry.relation}`);
    set(out.title, entry.work);
    set(out.text, entry.note === '' ? 'No note is recorded for this entry.' : entry.note);
    listHead('Placed by', entry.chapter === null ? '—' : `chapter ${String(entry.chapter).padStart(2, '0')}`);
    pageList(chapter === undefined ? [] : [{ label: chapter.number, title: chapter.title, url: chapter.url }]);
  };

  // ── pointer and focus ─────────────────────────────────────────────────────
  const route = (target: EventTarget | null): void => {
    if (!(target instanceof Element)) return;
    const dot = target.closest<SVGAElement>('[data-pp-n]');
    if (dot !== null) {
      showChapter(Number(dot.dataset['ppN']));
      return;
    }
    const row = target.closest<HTMLElement>('[data-pp-row]');
    if (row !== null) {
      showChapter(Number(row.dataset['ppRow']));
      return;
    }
    const co = target.closest<HTMLElement>('[data-pp-co]');
    if (co !== null) {
      showCocited(co.dataset['ppCo'] ?? '');
      return;
    }
    const lin = target.closest<HTMLElement>('[data-pp-lin]');
    if (lin !== null) showLineage(Number(lin.dataset['ppLin']));
  };
  root.addEventListener('pointerover', (event) => {
    route(event.target);
  }, { signal });
  root.addEventListener('focusin', (event) => {
    route(event.target);
  }, { signal });
  root.addEventListener('pointerleave', reset, { signal });
  root.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) reset();
  }, { signal });

  // ── keyboard ──────────────────────────────────────────────────────────────
  const lit = [...dots.entries()].sort((a, b) => a[0] - b[0]).map(([, dot]) => dot);
  const roving = (items: readonly (HTMLElement | SVGElement)[], from: Element, key: string, forward: readonly string[], back: readonly string[]): boolean => {
    const at = items.findIndex((item) => item === from);
    if (at === -1) return false;
    const to = forward.includes(key) ? at + 1 : back.includes(key) ? at - 1 : key === 'Home' ? 0 : key === 'End' ? items.length - 1 : null;
    if (to === null) return false;
    const next = items[Math.max(0, Math.min(items.length - 1, to))];
    if (next === undefined) return false;
    for (const item of items) item.setAttribute('tabindex', '-1');
    next.setAttribute('tabindex', '0');
    next.focus();
    return true;
  };
  svg.addEventListener('keydown', (event) => {
    const dot = event.target instanceof Element ? event.target.closest<SVGAElement>('[data-pp-n]') : null;
    if (dot === null) return;
    if (event.key === 'Escape') {
      reset();
      return;
    }
    if (roving(lit, dot, event.key, ['ArrowRight', 'ArrowDown'], ['ArrowLeft', 'ArrowUp'])) event.preventDefault();
  }, { signal });

  coRows.forEach((row, index) => {
    row.tabIndex = index === 0 ? 0 : -1;
  });
  root.querySelector('[data-pp-co-list]')?.addEventListener('keydown', (event) => {
    const row = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('[data-pp-co]') : null;
    if (row === null || !(event instanceof KeyboardEvent)) return;
    if (event.key === 'Escape') {
      reset();
      return;
    }
    if (roving(coRows, row, event.key, ['ArrowDown'], ['ArrowUp'])) event.preventDefault();
  }, { signal });
}
