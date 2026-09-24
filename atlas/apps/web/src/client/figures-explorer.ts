/**
 * Figures behaviour (components/shell/FiguresExplorer.astro): the coverage
 * matrix and the ledger are one instrument.
 *
 * - Point at a cell: the readout names chapter × kind and lists its figures;
 *   they light in the ledger. Click pins the cell as a ledger filter.
 * - Point at a row header: that chapter's cells light and the readout gives its
 *   mix by kind; at a column header: what the kind is for, and where it is used.
 * - Point at a ledger row: its cell lights in the matrix.
 * - Kind, placement, live, and text filters drive ledger and matrix together.
 * - Keyboard: the matrix is one tab stop; arrows move between cells; Enter
 *   pins; Esc clears.
 */
import type { PageContext } from './page.ts';

const pad = (n: string): string => n.padStart(2, '0');

export function initFiguresExplorer(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-figures-explorer]');
  const matrix = root?.querySelector<HTMLElement>('[data-fx-matrix]') ?? null;
  if (root === null || matrix === null) return;
  const signal = ctl.signal;

  const cells = [...matrix.querySelectorAll<HTMLAnchorElement>('[data-fx-cell]')];
  const cellOf = new Map(cells.map((cell) => [cell.dataset['fxCell'] ?? '', cell]));
  const rowHeads = [...matrix.querySelectorAll<HTMLButtonElement>('[data-fx-rowhead]')];
  const colHeads = [...matrix.querySelectorAll<HTMLButtonElement>('[data-fx-col]')];
  const items = [...root.querySelectorAll<HTMLTableRowElement>('[data-fx-item]')];
  const groups = [...root.querySelectorAll<HTMLTableSectionElement>('[data-fx-group]')];
  const out = {
    kicker: root.querySelector<HTMLElement>('[data-fx-kicker]'),
    title: root.querySelector<HTMLElement>('[data-fx-title]'),
    meta: root.querySelector<HTMLElement>('[data-fx-meta]'),
    list: root.querySelector<HTMLElement>('[data-fx-list]'),
  };
  const initial = { kicker: out.kicker?.textContent ?? '', title: out.title?.textContent ?? '', meta: out.meta?.textContent ?? '' };
  const shown = root.querySelector<HTMLElement>('[data-fx-shown]');
  const clearButton = root.querySelector<HTMLButtonElement>('[data-fx-clear]');

  const keyOf = (item: HTMLElement): string => `${item.dataset['chapter'] ?? ''}|${item.dataset['kind'] ?? ''}`;
  const chapterTitle = (chapter: string): string => rowHeads.find((head) => head.dataset['fxRowhead'] === chapter)?.querySelector('.fx-rowhead__t')?.textContent ?? '';
  const titleOf = (item: HTMLElement): string => item.querySelector('.fx-title a')?.textContent ?? '';

  // ── readout ────────────────────────────────────────────────────────────────
  const write = (kicker: string, title: string, meta: string, list: readonly HTMLElement[]): void => {
    if (out.kicker !== null) out.kicker.textContent = kicker;
    if (out.title !== null) out.title.textContent = title;
    if (out.meta !== null) out.meta.textContent = meta;
    if (out.list === null) return;
    const lines = list.slice(0, 6).map((item) => {
      const li = doc.createElement('li');
      const b = doc.createElement('b');
      b.textContent = item.querySelector('.fx-num')?.textContent ?? '';
      li.append(b, ' ', titleOf(item));
      return li;
    });
    if (list.length > 6) {
      const more = doc.createElement('li');
      more.textContent = `+ ${String(list.length - 6)} more — click to filter the ledger`;
      lines[5] = more;
    }
    out.list.replaceChildren(...lines);
  };
  const reset = (): void => {
    write(initial.kicker, initial.title, initial.meta, []);
  };

  // ── lighting ───────────────────────────────────────────────────────────────
  const clear = (): void => {
    matrix.classList.remove('has-focus');
    for (const cell of cells) cell.classList.remove('is-lit', 'is-focus');
    for (const head of [...rowHeads, ...colHeads]) head.classList.remove('is-lit');
    for (const item of items) item.classList.remove('is-lit');
  };
  const showCell = (cell: HTMLElement): void => {
    clear();
    cell.classList.add('is-focus');
    const [chapter = '', kind = ''] = (cell.dataset['fxCell'] ?? '').split('|');
    const own = items.filter((item) => item.dataset['chapter'] === chapter && item.dataset['kind'] === kind);
    for (const item of own) item.classList.add('is-lit');
    const live = own.filter((item) => item.dataset['live'] === 'yes').length;
    const purpose = colHeads.find((head) => head.dataset['fxCol'] === kind)?.title.split(': ')[1] ?? '';
    write(
      `ch ${pad(chapter)} · ${kind} · ${String(own.length)}${live > 0 ? ` · ${String(live)} live` : ''}`,
      chapterTitle(chapter),
      own.length === 0 ? `No ${kind} figure in this chapter yet.` : `${kind}: ${purpose}.`,
      own,
    );
  };
  const showRow = (chapter: string): void => {
    clear();
    matrix.classList.add('has-focus');
    rowHeads.find((head) => head.dataset['fxRowhead'] === chapter)?.classList.add('is-lit');
    for (const cell of cells) if (cell.dataset['fxCell']?.startsWith(`${chapter}|`) === true && cell.dataset['fxN'] !== '0') cell.classList.add('is-lit');
    const own = items.filter((item) => item.dataset['chapter'] === chapter);
    const kinds = new Map<string, number>();
    for (const item of own) kinds.set(item.dataset['kind'] ?? '', (kinds.get(item.dataset['kind'] ?? '') ?? 0) + 1);
    const mix = [...kinds].sort((a, b) => b[1] - a[1]).map(([kind, n]) => `${String(n)} ${kind}`).join(' · ');
    const live = own.filter((item) => item.dataset['live'] === 'yes').length;
    write(`ch ${pad(chapter)} · ${String(own.length)} figures · ${String(live)} live`, chapterTitle(chapter), mix, []);
  };
  const showColumn = (kind: string): void => {
    clear();
    matrix.classList.add('has-focus');
    const head = colHeads.find((candidate) => candidate.dataset['fxCol'] === kind);
    head?.classList.add('is-lit');
    for (const cell of cells) if (cell.dataset['fxCell']?.endsWith(`|${kind}`) === true && cell.dataset['fxN'] !== '0') cell.classList.add('is-lit');
    const own = items.filter((item) => item.dataset['kind'] === kind);
    const chapters = new Set(own.map((item) => item.dataset['chapter'] ?? ''));
    write(`${kind} · ${String(own.length)} figures · ${String(chapters.size)} chapters`, head?.title.split(': ')[1] ?? kind, `Used in chapters ${[...chapters].map(pad).join(' ')}.`, []);
  };
  const release = (): void => {
    clear();
    if (pinned !== null) {
      const cell = cellOf.get(pinned);
      if (cell !== undefined) showCell(cell);
    } else reset();
  };

  matrix.addEventListener('pointerover', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const cell = target?.closest<HTMLElement>('[data-fx-cell]');
    if (cell !== null && cell !== undefined) {
      showCell(cell);
      return;
    }
    const row = target?.closest<HTMLElement>('[data-fx-rowhead]');
    if (row !== null && row !== undefined) {
      showRow(row.dataset['fxRowhead'] ?? '');
      return;
    }
    const col = target?.closest<HTMLElement>('[data-fx-col]');
    if (col !== null && col !== undefined) showColumn(col.dataset['fxCol'] ?? '');
  }, { signal });
  matrix.addEventListener('pointerleave', release, { signal });
  matrix.addEventListener('focusin', (event) => {
    const cell = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-fx-cell]') : null;
    if (cell !== null) showCell(cell);
  }, { signal });

  const ledger = root.querySelector('.fx-table');
  ledger?.addEventListener('pointerover', (event) => {
    const item = event.target instanceof Element ? event.target.closest<HTMLTableRowElement>('[data-fx-item]') : null;
    if (item === null) return;
    clear();
    item.classList.add('is-lit');
    cellOf.get(keyOf(item))?.classList.add('is-focus');
  }, { signal });
  ledger?.addEventListener('pointerleave', release, { signal });

  // ── filters ────────────────────────────────────────────────────────────────
  const kinds = new Set<string>();
  const places = new Set<string>();
  let liveOnly = false;
  let query = '';
  let pinned: string | null = null;
  const apply = (): void => {
    let n = 0;
    for (const item of items) {
      const visible =
        (pinned === null || keyOf(item) === pinned) &&
        (kinds.size === 0 || kinds.has(item.dataset['kind'] ?? '')) &&
        (places.size === 0 || places.has(item.dataset['place'] ?? '')) &&
        (!liveOnly || item.dataset['live'] === 'yes') &&
        (query === '' || query.split(/\s+/u).every((term) => (item.dataset['text'] ?? '').includes(term)));
      item.hidden = !visible;
      if (visible) n += 1;
    }
    for (const group of groups) group.hidden = [...group.querySelectorAll<HTMLElement>('[data-fx-item]')].every((item) => item.hidden);
    // The matrix follows the kind and placement filters: cells with no matching figure step back.
    for (const cell of cells) {
      const [chapter = '', kind = ''] = (cell.dataset['fxCell'] ?? '').split('|');
      const any = items.some((item) => item.dataset['chapter'] === chapter && item.dataset['kind'] === kind && !item.hidden);
      cell.classList.toggle('is-filtered', !any && cell.dataset['fxN'] !== '0');
      cell.classList.toggle('is-pinned', pinned === cell.dataset['fxCell']);
    }
    if (clearButton !== null) clearButton.hidden = pinned === null;
    if (shown !== null) shown.textContent = `${String(n)} of ${String(items.length)}`;
  };
  const pin = (cell: HTMLElement): void => {
    const key = cell.dataset['fxCell'] ?? '';
    pinned = pinned === key ? null : key;
    apply();
  };
  matrix.addEventListener('click', (event) => {
    const cell = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-fx-cell]') : null;
    if (cell === null || cell.dataset['fxN'] === '0') return;
    pin(cell);
    // The link's #fx-ledger jump is kept so the filtered ledger comes into view.
  }, { signal });
  clearButton?.addEventListener('click', () => {
    pinned = null;
    apply();
    release();
  }, { signal });
  const toggle = (chip: HTMLButtonElement, set: Set<string>, value: string): void => {
    if (set.has(value)) set.delete(value);
    else set.add(value);
    chip.setAttribute('aria-pressed', String(set.has(value)));
    apply();
  };
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-fx-kind]')) {
    chip.addEventListener('click', () => {
      toggle(chip, kinds, chip.dataset['fxKind'] ?? '');
    }, { signal });
  }
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-fx-place]')) {
    chip.addEventListener('click', () => {
      toggle(chip, places, chip.dataset['fxPlace'] ?? '');
    }, { signal });
  }
  const liveChip = root.querySelector<HTMLButtonElement>('[data-fx-live]');
  liveChip?.addEventListener('click', () => {
    liveOnly = !liveOnly;
    liveChip.setAttribute('aria-pressed', String(liveOnly));
    apply();
  }, { signal });
  const search = root.querySelector<HTMLInputElement>('[data-fx-search]');
  let debounce: (() => void) | null = null;
  search?.addEventListener('input', () => {
    debounce?.();
    debounce = ctl.timeout(() => {
      query = search.value.trim().toLowerCase();
      apply();
    }, 90);
  }, { signal });

  // ── keyboard: one tab stop, arrows across the grid ─────────────────────────
  const rows = [...matrix.querySelectorAll<HTMLElement>('[data-fx-row]')].map((row) => [...row.querySelectorAll<HTMLAnchorElement>('[data-fx-cell]')]);
  const MOVES: Readonly<Record<string, readonly [number, number]>> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
  matrix.addEventListener('keydown', (event) => {
    const cell = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('[data-fx-cell]') : null;
    if (cell === null) return;
    if (event.key === 'Escape') {
      pinned = null;
      apply();
      release();
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (cell.dataset['fxN'] !== '0') pin(cell);
      return;
    }
    const move = MOVES[event.key];
    if (move === undefined) return;
    event.preventDefault();
    const r = rows.findIndex((row) => row.includes(cell));
    const c = rows[r]?.indexOf(cell) ?? 0;
    const next = rows[Math.max(0, Math.min(rows.length - 1, r + move[0]))]?.[Math.max(0, Math.min((rows[0]?.length ?? 1) - 1, c + move[1]))];
    if (next === undefined) return;
    for (const other of cells) other.setAttribute('tabindex', '-1');
    next.setAttribute('tabindex', '0');
    next.focus();
  }, { signal });
}
