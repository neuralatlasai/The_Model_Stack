/**
 * Timeline behaviour (components/shell/TimelineExplorer.astro): the chronicle
 * and its minimap are one instrument.
 *
 * - Scroll: the minimap's band spans the years in view, the entry at the
 *   reading line is ringed in both views, and the tally counts what has been
 *   read so far by relation.
 * - Point at a dot or an entry: the readout names it, and that chapter's whole
 *   lineage lights in both views.
 * - Click a dot or a year band: the chronicle scrolls there (the hash is kept
 *   for sharing).
 * - Relation chips hide/show a relation in both views; thread chips follow one
 *   chapter's lineage (hover previews it, click pins it).
 * - Keyboard: the minimap is one tab stop; arrows step through dots in time
 *   order; Enter scrolls to the entry; Esc clears.
 */
import { READING_THRESHOLD } from './contract.ts';
import type { PageContext } from './page.ts';

const RELATION_NAMES: Readonly<Record<string, string>> = {
  anc: 'conceptual ancestor',
  opt: 'engineering optimization',
  alt: 'alternative branch',
  sup: 'superseded approach',
  fro: 'current frontier',
};

const reducedMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initTimelineExplorer(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-timeline-explorer]');
  if (root === null) return;
  const svg = root.querySelector<SVGSVGElement>('[data-tlm-svg]');
  const entries = [...root.querySelectorAll<HTMLElement>('[data-tl-entry]')];
  const marks = [...root.querySelectorAll<SVGAElement>('.tlm__mark[data-tl]')];
  const years = [...root.querySelectorAll<HTMLElement>('.tlc-year[data-year]')];
  const view = root.querySelector<SVGRectElement>('[data-tlm-view]');
  const cursor = root.querySelector<SVGLineElement>('[data-tlm-cursor]');
  const out = {
    kicker: root.querySelector<HTMLElement>('[data-tlm-kicker]'),
    title: root.querySelector<HTMLElement>('[data-tlm-title]'),
    meta: root.querySelector<HTMLElement>('[data-tlm-meta]'),
    tallyLabel: root.querySelector<HTMLElement>('[data-tlm-tally-label]'),
    tallyN: root.querySelector<HTMLElement>('[data-tlm-tally-n]'),
  };
  if (svg === null || entries.length === 0) return;

  const markOf = new Map(marks.map((mark) => [mark.dataset['tl'] ?? '', mark]));
  const entryOf = new Map(entries.map((entry) => [entry.dataset['tlEntry'] ?? '', entry]));
  const bandOf = new Map(
    [...svg.querySelectorAll<SVGAElement>('[data-tlm-year]')].map((link) => [link.dataset['tlmYear'] ?? '', link.querySelector('rect')]),
  );
  const segs = new Map([...root.querySelectorAll<HTMLElement>('[data-tlm-seg]')].map((seg) => [seg.dataset['tlmSeg'] ?? '', seg]));
  const counts = new Map([...root.querySelectorAll<HTMLElement>('[data-tlm-count]')].map((cell) => [cell.dataset['tlmCount'] ?? '', cell]));
  const total = entries.length;
  const hidden = new Set<string>();
  let pinnedThread: string | null = null;

  // ── readout ────────────────────────────────────────────────────────────────
  let current: HTMLElement | null = null;
  const describe = (entry: HTMLElement, lead: string): void => {
    const work = entry.querySelector('.tlc-work')?.firstElementChild?.textContent.trim() ?? '';
    const owner = entry.querySelector<HTMLAnchorElement>('[data-tlc-owner]');
    const chapter = entry.dataset['chapter'] ?? '';
    const thread = entries.filter((other) => other.dataset['chapter'] === chapter).length;
    if (out.kicker !== null) out.kicker.textContent = `${lead} · ${entry.dataset['year'] ?? ''} · ${RELATION_NAMES[entry.dataset['relation'] ?? ''] ?? ''}`;
    if (out.title !== null) out.title.textContent = work;
    if (out.meta !== null) {
      const link = doc.createElement('a');
      link.href = owner?.href ?? '#';
      const number = owner?.querySelector('.tlc-owner__n')?.textContent ?? '';
      const title = owner?.querySelector('.tlc-owner__t')?.textContent ?? '';
      link.textContent = `${number} ${title}`.trim();
      out.meta.replaceChildren('placed by ', link, ` · ${String(thread)} entr${thread === 1 ? 'y' : 'ies'} in its lineage`);
    }
  };

  // ── connected states ───────────────────────────────────────────────────────
  const clearFocus = (): void => {
    for (const entry of entries) entry.classList.remove('is-focus', 'is-thread');
    for (const mark of marks) mark.classList.remove('is-focus', 'is-thread');
    root.classList.toggle('has-thread', pinnedThread !== null);
    if (pinnedThread !== null) lightThread(pinnedThread);
  };
  const lightThread = (chapter: string): void => {
    root.classList.add('has-thread');
    for (const entry of entries) entry.classList.toggle('is-thread', entry.dataset['chapter'] === chapter);
    for (const mark of marks) mark.classList.toggle('is-thread', mark.dataset['chapter'] === chapter);
  };
  const focusEntry = (id: string, lead: string): void => {
    const entry = entryOf.get(id);
    if (entry === undefined) return;
    clearFocus();
    lightThread(entry.dataset['chapter'] ?? '');
    entry.classList.add('is-focus');
    markOf.get(id)?.classList.add('is-focus');
    describe(entry, lead);
  };
  const release = (): void => {
    clearFocus();
    if (current !== null) describe(current, 'Reading');
  };

  // ── scroll sync: band over the years in view, ring at the reading line, tally ─
  let frame = 0;
  const sync = (): void => {
    frame = 0;
    const line = innerHeight * READING_THRESHOLD;
    let reading: HTMLElement | null = null;
    let first: HTMLElement | null = null;
    let last: HTMLElement | null = null;
    for (const entry of entries) {
      if (entry.hidden || entry.closest('.tlc-year')?.hasAttribute('hidden') === true) continue;
      const rect = entry.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight) {
        first ??= entry;
        last = entry;
      }
      if (rect.top <= line) reading = entry;
    }
    reading ??= first;
    // Viewport band: from the first visible entry's year band to the last one's.
    const a = bandOf.get(first?.dataset['year'] ?? '');
    const b = bandOf.get(last?.dataset['year'] ?? '');
    if (view !== null && a !== null && a !== undefined && b !== null && b !== undefined) {
      const y0 = Number(a.getAttribute('y'));
      const y1 = Number(b.getAttribute('y')) + Number(b.getAttribute('height'));
      view.setAttribute('y', String(y0));
      view.setAttribute('height', String(Math.max(4, y1 - y0)));
    }
    if (reading === current) return;
    current?.classList.remove('is-current');
    for (const mark of marks) mark.classList.remove('is-current');
    current = reading;
    if (current === null) return;
    current.classList.add('is-current');
    const mark = markOf.get(current.dataset['tlEntry'] ?? '');
    mark?.classList.add('is-current');
    const cy = mark?.querySelector('.tlm__dot')?.getAttribute('cy');
    if (cursor !== null && cy !== null && cy !== undefined) {
      cursor.setAttribute('y1', cy);
      cursor.setAttribute('y2', cy);
      cursor.classList.add('is-on');
    }
    // Tally: entries up to and including the current one, in chronicle order.
    const upto = entries.indexOf(current);
    const read = entries.slice(0, upto + 1);
    const readIds = new Set(read.map((entry) => entry.dataset['tlEntry'] ?? ''));
    svg.classList.add('has-progress');
    for (const other of marks) other.classList.toggle('is-read', readIds.has(other.dataset['tl'] ?? ''));
    for (const [key, seg] of segs) {
      const n = read.filter((entry) => entry.dataset['relation'] === key).length;
      seg.style.flexGrow = String(n);
      const cell = counts.get(key);
      if (cell !== undefined) cell.textContent = String(n);
    }
    if (out.tallyLabel !== null) out.tallyLabel.textContent = `read up to ${current.dataset['year'] ?? ''}`;
    if (out.tallyN !== null) out.tallyN.textContent = `${String(read.length)} of ${String(total)}`;
    if (!root.matches(':hover')) describe(current, 'Reading');
  };
  const schedule = (): void => {
    if (frame === 0) frame = requestAnimationFrame(sync);
  };
  addEventListener('scroll', schedule, { passive: true, signal: ctl.signal });
  addEventListener('resize', schedule, { passive: true, signal: ctl.signal });
  ctl.defer(() => {
    cancelAnimationFrame(frame);
  });
  schedule();

  // ── pointer ───────────────────────────────────────────────────────────────
  const markFrom = (target: EventTarget | null): SVGAElement | null =>
    target instanceof Element ? target.closest<SVGAElement>('.tlm__mark[data-tl]') : null;
  svg.addEventListener('pointerover', (event) => {
    const mark = markFrom(event.target);
    if (mark !== null) focusEntry(mark.dataset['tl'] ?? '', 'Pointing');
  }, { signal: ctl.signal });
  svg.addEventListener('pointerleave', release, { signal: ctl.signal });
  for (const entry of entries) {
    entry.addEventListener('pointerenter', () => {
      focusEntry(entry.dataset['tlEntry'] ?? '', 'Pointing');
    }, { signal: ctl.signal });
    entry.addEventListener('pointerleave', release, { signal: ctl.signal });
  }

  // Click a dot or a year band: scroll the chronicle there and mark it.
  const reveal = (target: HTMLElement): void => {
    history.replaceState(history.state, '', `#${target.id}`);
    target.scrollIntoView({ block: target.classList.contains('tlc-entry') ? 'center' : 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    if (target.classList.contains('tlc-entry')) {
      target.classList.remove('is-flash');
      target.getBoundingClientRect(); // restart the flash animation
      target.classList.add('is-flash');
    }
  };
  svg.addEventListener('click', (event) => {
    const mark = markFrom(event.target);
    const band = event.target instanceof Element ? event.target.closest<SVGAElement>('[data-tlm-year]') : null;
    const target = mark !== null ? entryOf.get(mark.dataset['tl'] ?? '') : band !== null ? doc.getElementById(`year-${band.dataset['tlmYear'] ?? ''}`) : null;
    if (target === null || target === undefined) return;
    event.preventDefault();
    reveal(target);
  }, { signal: ctl.signal });

  // ── filters ───────────────────────────────────────────────────────────────
  const applyFilters = (): void => {
    for (const entry of entries) {
      const off = hidden.has(entry.dataset['relation'] ?? '') || (pinnedThread !== null && entry.dataset['chapter'] !== pinnedThread);
      entry.hidden = off;
    }
    for (const year of years) year.hidden = [...year.querySelectorAll<HTMLElement>('[data-tl-entry]')].every((entry) => entry.hidden);
    for (const mark of marks) mark.classList.toggle('is-filtered', hidden.has(mark.dataset['relation'] ?? ''));
    current = null;
    schedule();
  };
  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-tlx-filter]')) {
    chip.addEventListener('click', () => {
      const key = chip.dataset['tlxFilter'] ?? '';
      if (hidden.has(key)) hidden.delete(key);
      else hidden.add(key);
      chip.setAttribute('aria-pressed', String(!hidden.has(key)));
      applyFilters();
    }, { signal: ctl.signal });
  }
  const threadChips = [...root.querySelectorAll<HTMLButtonElement>('[data-tlx-thread]')];
  for (const chip of threadChips) {
    const chapter = chip.dataset['tlxThread'] ?? '';
    chip.addEventListener('pointerenter', () => {
      clearFocus();
      lightThread(chapter);
    }, { signal: ctl.signal });
    chip.addEventListener('pointerleave', clearFocus, { signal: ctl.signal });
    chip.addEventListener('click', () => {
      pinnedThread = pinnedThread === chapter ? null : chapter;
      for (const other of threadChips) other.setAttribute('aria-pressed', String(other.dataset['tlxThread'] === pinnedThread));
      clearFocus();
      applyFilters();
      const first = entries.find((entry) => !entry.hidden);
      if (pinnedThread !== null && first !== undefined && first.getBoundingClientRect().top < 0) reveal(first.closest<HTMLElement>('.tlc-year') ?? first);
    }, { signal: ctl.signal });
  }

  // ── keyboard: one tab stop, arrows in time order ──────────────────────────
  const ordered = [...marks].sort((a, b) => {
    const ea = entryOf.get(a.dataset['tl'] ?? '');
    const eb = entryOf.get(b.dataset['tl'] ?? '');
    return (ea === undefined ? 0 : entries.indexOf(ea)) - (eb === undefined ? 0 : entries.indexOf(eb));
  });
  const STEP: Readonly<Record<string, number>> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
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
    for (const other of marks) other.setAttribute('tabindex', '-1');
    next.setAttribute('tabindex', '0');
    next.focus();
  }, { signal: ctl.signal });
  svg.addEventListener('focusin', (event) => {
    const mark = markFrom(event.target);
    if (mark !== null) focusEntry(mark.dataset['tl'] ?? '', 'Focused');
  }, { signal: ctl.signal });

  // Arriving on #tl-N (from the home strip or a shared link): flash the entry.
  const arrived = /^#tl-\d+$/u.test(location.hash) ? doc.getElementById(location.hash.slice(1)) : null;
  if (arrived !== null) {
    arrived.classList.add('is-flash');
    focusEntry(arrived.dataset['tlEntry'] ?? '', 'Linked');
  }
}
