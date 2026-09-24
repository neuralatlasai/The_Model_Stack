/**
 * Papers behaviour (components/shell/PapersExplorer.astro): the citation
 * field, its chapter panel, and the ledger are one instrument.
 *
 * - Point at a dot or a ledger row: the readout names the work (key, type,
 *   year, authors, venue, status, what the book uses it for) and the chapters
 *   that draw on it light in the panel.
 * - Point at a chapter: its works light in the field and the ledger; click
 *   pins it as a filter.
 * - Type, status, spine, and text filters drive field and ledger together,
 *   with a live "shown" count. Column buttons sort the ledger in place.
 * - Keyboard: the field is one tab stop; arrows step through dots left to
 *   right; Enter opens the paper page; Esc clears.
 * - `#type-…` on arrival selects that type.
 */
import type { PageContext } from './page.ts';

interface Work {
  readonly key: string;
  readonly row: HTMLTableRowElement;
  readonly mark: SVGAElement | undefined;
  readonly type: string;
  readonly status: string;
  readonly spine: boolean;
  readonly chapters: readonly string[];
  readonly text: string;
}

const pad = (n: string): string => n.padStart(2, '0');

export function initPapersExplorer(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-papers-explorer]');
  const svg = root?.querySelector<SVGSVGElement>('[data-pfx-svg]') ?? null;
  const tbody = root?.querySelector<HTMLTableSectionElement>('[data-pfx-table] tbody') ?? null;
  if (root === null || svg === null || tbody === null) return;
  const signal = ctl.signal;

  const marks = new Map([...svg.querySelectorAll<SVGAElement>('[data-pfx-key]')].map((mark) => [mark.dataset['pfxKey'] ?? '', mark]));
  const works: Work[] = [...tbody.querySelectorAll<HTMLTableRowElement>('[data-pfx-row]')].map((row) => ({
    key: row.dataset['pfxRow'] ?? '',
    row,
    mark: marks.get(row.dataset['pfxRow'] ?? ''),
    type: row.dataset['type'] ?? '',
    status: row.dataset['status'] ?? '',
    spine: row.dataset['spine'] === 'yes',
    chapters: (row.dataset['chapters'] ?? '').trim().split(/\s+/u).filter((n) => n !== ''),
    text: row.dataset['text'] ?? '',
  }));
  const byKey = new Map(works.map((work) => [work.key, work]));
  const chapterButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-pfx-chapter]')];
  const out = {
    kicker: root.querySelector<HTMLElement>('[data-pfx-kicker]'),
    title: root.querySelector<HTMLElement>('[data-pfx-title]'),
    who: root.querySelector<HTMLElement>('[data-pfx-who]'),
    meta: root.querySelector<HTMLElement>('[data-pfx-meta]'),
    used: root.querySelector<HTMLElement>('[data-pfx-used]'),
  };
  const initial = Object.fromEntries(Object.entries(out).map(([name, el]) => [name, el?.textContent ?? ''])) as Record<keyof typeof out, string>;
  const shown = root.querySelector<HTMLElement>('[data-pfx-shown]');

  // ── readout ────────────────────────────────────────────────────────────────
  const set = (name: keyof typeof out, text: string): void => {
    const el = out[name];
    if (el !== null) el.textContent = text;
  };
  const describe = (work: Work): void => {
    const row = work.row;
    const title = row.querySelector('.pfx-work > a')?.textContent ?? work.key;
    const authors = row.querySelector('.pfx-authors')?.textContent ?? '';
    const status = row.querySelector('.pfx-status')?.textContent.trim() ?? '';
    const year = row.dataset['year'] ?? '';
    set('kicker', [work.key, work.type, year === '' ? 'undated' : year, work.spine ? 'spine paper' : null].filter((part) => part !== null).join(' · '));
    set('title', title);
    set('who', authors === '' ? '—' : authors);
    set('meta', `${row.dataset['venue'] ?? ''} · ${status}`);
    const used = row.dataset['used'] ?? '';
    if (out.used !== null) {
      const b = doc.createElement('b');
      b.textContent = work.chapters.length === 0 ? 'no chapter yet' : `ch ${work.chapters.map(pad).join(' ')}`;
      out.used.replaceChildren(b, used === '' ? '' : ` · used for: ${used}`);
    }
  };
  const resetReadout = (): void => {
    for (const name of Object.keys(out) as (keyof typeof out)[]) set(name, initial[name]);
  };

  // ── lighting ───────────────────────────────────────────────────────────────
  let pinnedChapter: string | null = null;
  const clearLight = (): void => {
    svg.classList.remove('has-focus');
    for (const work of works) {
      work.row.classList.remove('is-lit');
      work.mark?.classList.remove('is-lit', 'is-focus');
    }
    for (const button of chapterButtons) button.classList.remove('is-lit');
  };
  const focusWork = (work: Work): void => {
    clearLight();
    work.mark?.classList.add('is-focus');
    work.row.classList.add('is-lit');
    for (const button of chapterButtons) button.classList.toggle('is-lit', work.chapters.includes(button.dataset['pfxChapter'] ?? ''));
    describe(work);
  };
  const lightChapter = (n: string): void => {
    clearLight();
    svg.classList.add('has-focus');
    let count = 0;
    for (const work of works) {
      const on = work.chapters.includes(n);
      if (on) count += 1;
      work.mark?.classList.toggle('is-lit', on);
      work.row.classList.toggle('is-lit', on && pinnedChapter === null);
    }
    const button = chapterButtons.find((candidate) => candidate.dataset['pfxChapter'] === n);
    button?.classList.add('is-lit');
    set('kicker', `chapter ${pad(n)} · ${String(count)} works`);
    set('title', button?.querySelector('.pfx-ch__t')?.textContent ?? '');
    set('who', 'Its works are lit in the field;');
    set('meta', pinnedChapter === n ? 'the ledger is filtered to them — click again to clear.' : 'click to filter the ledger to them.');
    if (out.used !== null) out.used.textContent = '';
  };
  const release = (): void => {
    clearLight();
    if (pinnedChapter !== null) lightChapter(pinnedChapter);
    else resetReadout();
  };

  const markFrom = (target: EventTarget | null): SVGAElement | null =>
    target instanceof Element ? target.closest<SVGAElement>('[data-pfx-key]') : null;
  svg.addEventListener('pointerover', (event) => {
    const work = byKey.get(markFrom(event.target)?.dataset['pfxKey'] ?? '');
    if (work !== undefined) focusWork(work);
  }, { signal });
  svg.addEventListener('pointerleave', release, { signal });
  svg.addEventListener('focusin', (event) => {
    const work = byKey.get(markFrom(event.target)?.dataset['pfxKey'] ?? '');
    if (work !== undefined) focusWork(work);
  }, { signal });
  tbody.addEventListener('pointerover', (event) => {
    const row = event.target instanceof Element ? event.target.closest<HTMLTableRowElement>('[data-pfx-row]') : null;
    const work = byKey.get(row?.dataset['pfxRow'] ?? '');
    if (work !== undefined) focusWork(work);
  }, { signal });
  tbody.addEventListener('pointerleave', release, { signal });

  for (const button of chapterButtons) {
    const n = button.dataset['pfxChapter'] ?? '';
    button.addEventListener('pointerenter', () => {
      lightChapter(n);
    }, { signal });
    button.addEventListener('focus', () => {
      lightChapter(n);
    }, { signal });
    button.addEventListener('pointerleave', release, { signal });
    button.addEventListener('click', () => {
      pinnedChapter = pinnedChapter === n ? null : n;
      for (const other of chapterButtons) other.setAttribute('aria-pressed', String(other.dataset['pfxChapter'] === pinnedChapter));
      apply();
      if (pinnedChapter === null) release();
      else lightChapter(n);
    }, { signal });
  }

  // ── filters ────────────────────────────────────────────────────────────────
  const types = new Set<string>();
  const statuses = new Set<string>();
  let spineOnly = false;
  let query = '';
  const apply = (): void => {
    let count = 0;
    for (const work of works) {
      const visible =
        (types.size === 0 || types.has(work.type)) &&
        (statuses.size === 0 || statuses.has(work.status)) &&
        (!spineOnly || work.spine) &&
        (pinnedChapter === null || work.chapters.includes(pinnedChapter)) &&
        (query === '' || query.split(/\s+/u).every((term) => work.text.includes(term)));
      work.row.hidden = !visible;
      work.mark?.classList.toggle('is-filtered', !visible);
      if (visible) count += 1;
    }
    if (shown !== null) shown.textContent = `${String(count)} of ${String(works.length)}`;
  };
  const toggleChip = (chip: HTMLButtonElement, set: Set<string>, value: string): void => {
    if (set.has(value)) set.delete(value);
    else set.add(value);
    chip.setAttribute('aria-pressed', String(set.has(value)));
    apply();
  };
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-pfx-type]')) {
    chip.addEventListener('click', () => {
      toggleChip(chip, types, chip.dataset['pfxType'] ?? '');
    }, { signal });
  }
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-pfx-status]')) {
    chip.addEventListener('click', () => {
      toggleChip(chip, statuses, chip.dataset['pfxStatus'] ?? '');
    }, { signal });
  }
  const spineChip = root.querySelector<HTMLButtonElement>('[data-pfx-spine]');
  spineChip?.addEventListener('click', () => {
    spineOnly = !spineOnly;
    spineChip.setAttribute('aria-pressed', String(spineOnly));
    apply();
  }, { signal });
  const search = root.querySelector<HTMLInputElement>('[data-pfx-search]');
  let debounce: (() => void) | null = null;
  search?.addEventListener('input', () => {
    debounce?.();
    debounce = ctl.timeout(() => {
      query = search.value.trim().toLowerCase();
      apply();
    }, 90);
  }, { signal });

  // ── sorting ────────────────────────────────────────────────────────────────
  const SORT_VALUE: Readonly<Record<string, (work: Work) => number>> = {
    key: (work) => Number(work.row.dataset['keyOrder'] ?? 0),
    year: (work) => Number(work.row.dataset['year'] === '' ? 99999 : work.row.dataset['year']),
    cited: (work) => Number(work.row.dataset['cited'] ?? 0),
  };
  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-pfx-sort]')) {
    button.addEventListener('click', () => {
      const by = button.dataset['pfxSort'] ?? 'key';
      const th = button.closest('th');
      const descending = th?.getAttribute('aria-sort') === 'ascending' ? true : th?.getAttribute('aria-sort') === 'descending' ? false : by === 'cited';
      for (const other of root.querySelectorAll('thead th[aria-sort]')) other.setAttribute('aria-sort', 'none');
      th?.setAttribute('aria-sort', descending ? 'descending' : 'ascending');
      const value = SORT_VALUE[by] ?? SORT_VALUE['key'];
      if (value === undefined) return;
      const sorted = [...works].sort((a, b) => (descending ? value(b) - value(a) : value(a) - value(b)) || Number(a.row.dataset['keyOrder']) - Number(b.row.dataset['keyOrder']));
      tbody.append(...sorted.map((work) => work.row));
    }, { signal });
  }

  // ── keyboard: one tab stop, arrows left to right ───────────────────────────
  const ordered = [...marks.values()].sort((a, b) => {
    const ax = Number(a.querySelector('.pfx-mark__dot')?.getAttribute('cx'));
    const bx = Number(b.querySelector('.pfx-mark__dot')?.getAttribute('cx'));
    return ax - bx;
  });
  const STEP: Readonly<Record<string, number>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  svg.addEventListener('keydown', (event) => {
    const mark = markFrom(event.target);
    if (mark === null) return;
    if (event.key === 'Escape') {
      release();
      return;
    }
    const visible = ordered.filter((other) => !other.classList.contains('is-filtered'));
    const at = Math.max(0, visible.indexOf(mark));
    const step = STEP[event.key];
    const next = event.key === 'Home' ? visible[0] : event.key === 'End' ? visible.at(-1) : step === undefined ? undefined : visible[Math.max(0, Math.min(visible.length - 1, at + step))];
    if (next === undefined) return;
    event.preventDefault();
    for (const other of marks.values()) other.setAttribute('tabindex', '-1');
    next.setAttribute('tabindex', '0');
    next.focus();
  }, { signal });

  // Arriving on #type-…: select that type.
  const arrived = /^#type-[a-z0-9-]+$/u.test(location.hash) ? doc.getElementById(location.hash.slice(1)) : null;
  if (arrived instanceof HTMLButtonElement && arrived.dataset['pfxType'] !== undefined) toggleChip(arrived, types, arrived.dataset['pfxType']);
}
