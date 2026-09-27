/**
 * Evidence page (pages/evidence.astro): the label ledger, connected. A dot
 * names its label, chapter, count, and share of that chapter's labels; a label
 * (in the ledger or in the definitions below) lights its whole row and gives
 * its total and the chapter that uses it most; a chapter number lights its
 * column and gives the chapter's mix. Leaving restores the rest state.
 *
 * Loaded on demand from stack-explorer.ts when the ledger markup is present.
 */
import type { PageContext } from './page.ts';

const grouped = (n: number): string => n.toLocaleString('en-US');

export function initEvidenceLedger(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-evidence-ledger]');
  const readout = root?.querySelector<HTMLElement>('[data-evx-readout]') ?? null;
  if (root === null || readout === null) return;
  const slot = (name: string): HTMLElement | null => readout.querySelector<HTMLElement>(`[data-evx-${name}]`);
  const out = { kicker: slot('rk'), title: slot('rt'), text: slot('rx'), k1: slot('r1k'), v1: slot('r1'), k2: slot('r2k'), v2: slot('r2') };
  type Out = Record<keyof typeof out, string>;
  const initial = Object.fromEntries(Object.entries(out).map(([key, element]) => [key, element?.textContent ?? ''])) as Out;
  const write = (values: Out): void => {
    for (const [key, element] of Object.entries(out)) if (element !== null) element.textContent = values[key as keyof Out];
  };

  const rows = new Map<string, HTMLElement>();
  for (const row of root.querySelectorAll<HTMLElement>('[data-evx-row]')) rows.set(row.dataset['evxRow'] ?? '', row);
  const cellsOf = (column: string): HTMLElement[] => [...root.querySelectorAll<HTMLElement>(`.evx__cell[data-evx-col="${column}"]`)];
  const defs = [...doc.querySelectorAll<HTMLElement>('[data-evx-def]')];

  let lit: HTMLElement[] = [];
  const clear = (): void => {
    for (const element of lit) element.classList.remove('is-lit', 'is-cell');
    lit = [];
    root.classList.remove('has-lit');
  };
  const mark = (elements: readonly HTMLElement[], className = 'is-lit'): void => {
    for (const element of elements) {
      element.classList.add(className);
      lit.push(element);
    }
  };
  const labelOf = (row: HTMLElement): string => row.dataset['evxRow'] ?? '';
  const defOf = (label: string): HTMLElement[] => defs.filter((def) => def.dataset['evxDef'] === label);

  const showRow = (label: string): void => {
    const row = rows.get(label);
    if (row === undefined) return;
    clear();
    root.classList.add('has-lit');
    mark([row, ...defOf(label)]);
    write({
      kicker: row.dataset['evxKicker'] ?? '',
      title: label,
      text: row.dataset['evxMeaning'] ?? '',
      k1: 'statements',
      v1: grouped(Number(row.dataset['evxTotal'] ?? '0')),
      k2: 'most in',
      v2: row.dataset['evxTop'] === '' ? '—' : (row.dataset['evxTop'] ?? '—'),
    });
  };
  const showCell = (cell: HTMLElement): void => {
    const row = cell.closest<HTMLElement>('[data-evx-row]');
    if (row === null) return;
    const label = labelOf(row);
    clear();
    root.classList.add('has-lit');
    mark([row, ...defOf(label)]);
    mark([cell], 'is-cell');
    const chapter = cell.dataset['evxCh'] ?? '';
    write({
      kicker: `${label} · chapter ${chapter.slice(0, 2)}`,
      title: chapter.slice(3),
      text: row.dataset['evxMeaning'] ?? '',
      k1: 'statements here',
      v1: grouped(Number(cell.dataset['evxN'] ?? '0')),
      k2: "share of chapter's labels",
      v2: cell.dataset['evxShare'] ?? '',
    });
  };
  const showColumn = (head: HTMLElement): void => {
    const column = head.dataset['evxCol'] ?? '';
    const cells = cellsOf(column);
    clear();
    root.classList.add('has-lit');
    mark([head, ...cells]);
    const mix = cells
      .map((cell) => ({ label: labelOf(cell.closest<HTMLElement>('[data-evx-row]') ?? cell), n: Number(cell.dataset['evxN'] ?? '0') }))
      .filter((entry) => entry.n > 0)
      .sort((a, b) => b.n - a.n);
    const total = mix.reduce((sum, entry) => sum + entry.n, 0);
    const chapter = cells[0]?.dataset['evxCh'] ?? '';
    const top = mix[0];
    write({
      kicker: `chapter ${chapter.slice(0, 2)} · ${String(mix.length)} labels in use`,
      title: chapter.slice(3),
      text: mix.map((entry) => `${entry.label} ${grouped(entry.n)}`).join(' · '),
      k1: 'statements',
      v1: grouped(total),
      k2: 'most used',
      v2: top === undefined ? '—' : `${top.label} · ${String(Math.round((top.n / Math.max(1, total)) * 100))}%`,
    });
  };
  const reset = (): void => {
    clear();
    write(initial);
  };

  const route = (target: EventTarget | null): void => {
    const element = target instanceof Element ? target : null;
    const cell = element?.closest<HTMLElement>('.evx__cell') ?? null;
    if (cell !== null) {
      showCell(cell);
      return;
    }
    const head = element?.closest<HTMLElement>('.evx__ch') ?? null;
    if (head !== null) {
      showColumn(head);
      return;
    }
    const row = element?.closest<HTMLElement>('[data-evx-row]') ?? null;
    if (row !== null) {
      showRow(labelOf(row));
      return;
    }
    const def = element?.closest<HTMLElement>('[data-evx-def]') ?? null;
    if (def !== null) showRow(def.dataset['evxDef'] ?? '');
  };

  const scopes = [root, ...defs];
  for (const scope of scopes) {
    scope.addEventListener('pointerover', (event) => {
      route(event.target);
    }, { signal: ctl.signal });
    scope.addEventListener('pointerleave', reset, { signal: ctl.signal });
  }
  root.addEventListener('focusin', (event) => {
    route(event.target);
  }, { signal: ctl.signal });
  root.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) reset();
  }, { signal: ctl.signal });
}
