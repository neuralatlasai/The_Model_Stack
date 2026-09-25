/**
 * Part map behaviour (components/research/PartMap.astro): pointing at or
 * focusing a chapter tile lights the outside chapters it builds on and unlocks
 * (and the in-part tiles it builds on), steps the rest back, and fills the
 * fixed-size readout; pointing at an outside chip lights the tiles that use
 * it. Tiles form one tab stop (arrows move, Enter opens, Esc clears).
 */
import type { PageContext } from './page.ts';

interface TileData {
  readonly title: string;
  readonly state: string;
  readonly summary: string;
  readonly words: number;
  readonly figures: number;
  readonly equations: number;
  readonly sections: string;
}

function isTileData(value: unknown): value is TileData {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record['title'] === 'string' && typeof record['summary'] === 'string' && typeof record['words'] === 'number';
}

export function initPartMap(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('[data-part-map]');
  if (root === null) return;
  const signal = ctl.signal;
  const tiles = [...root.querySelectorAll<HTMLElement>('[data-pm-tile]')];
  const chips = [...root.querySelectorAll<HTMLAnchorElement>('[data-pm-ext]')];
  const out = {
    kicker: root.querySelector<HTMLElement>('[data-pm-kicker]'),
    title: root.querySelector<HTMLElement>('[data-pm-title]'),
    body: root.querySelector<HTMLElement>('[data-pm-body]'),
  };
  const initial = { kicker: out.kicker?.textContent ?? '', title: out.title?.textContent ?? '', body: out.body?.textContent ?? '' };
  let data: Readonly<Record<string, unknown>> = {};
  try {
    const parsed: unknown = JSON.parse(root.querySelector('[data-pm-data]')?.textContent ?? '{}');
    if (typeof parsed === 'object' && parsed !== null) data = parsed as Record<string, unknown>;
  } catch {
    data = {};
  }
  const pad = (n: string): string => n.padStart(2, '0');
  const set = (kicker: string, title: string, body: string): void => {
    if (out.kicker !== null) out.kicker.textContent = kicker;
    if (out.title !== null) out.title.textContent = title;
    if (out.body !== null) out.body.textContent = body;
  };

  const clear = (): void => {
    root.classList.remove('has-focus');
    for (const el of root.querySelectorAll('.is-lit, .is-focus, .is-up, .is-down')) el.classList.remove('is-lit', 'is-focus', 'is-up', 'is-down');
  };
  const reset = (): void => {
    clear();
    set(initial.kicker, initial.title, initial.body);
  };

  const showTile = (tile: HTMLElement): void => {
    clear();
    root.classList.add('has-focus');
    tile.classList.add('is-focus');
    const n = tile.dataset['pmTile'] ?? '';
    const ins = new Set((tile.dataset['pmIn'] ?? '').split(' ').filter((v) => v !== ''));
    const outs = new Set((tile.dataset['pmOut'] ?? '').split(' ').filter((v) => v !== ''));
    for (const other of tiles) {
      const m = other.dataset['pmTile'] ?? '';
      if (ins.has(m)) other.classList.add('is-up');
      if (outs.has(m)) other.classList.add('is-down');
    }
    for (const chip of chips) {
      const m = chip.dataset['pmExt'] ?? '';
      if (ins.has(m)) chip.classList.add('is-up');
      if (outs.has(m)) chip.classList.add('is-down');
    }
    const info = data[n];
    if (isTileData(info)) {
      const measures = [`${info.sections} sections`, info.words > 0 ? `${info.words.toLocaleString('en')} words` : null, `${String(info.figures)} figures`, `${String(info.equations)} equations`]
        .filter((part) => part !== null)
        .join(' · ');
      set(`ch ${pad(n)} · ${info.state} · builds on ${String(ins.size)} · unlocks ${String(outs.size)}`, info.title, info.summary === '' ? measures : `${measures}. ${info.summary}`);
    }
  };
  const showChip = (chip: HTMLAnchorElement): void => {
    clear();
    root.classList.add('has-focus');
    chip.classList.add('is-focus');
    const via = new Set((chip.dataset['pmVia'] ?? '').split(' ').filter((v) => v !== ''));
    for (const tile of tiles) if (via.has(tile.dataset['pmTile'] ?? '')) tile.classList.add('is-lit');
    const inbound = chip.closest('.pm-side--in') !== null;
    const names = tiles.filter((tile) => via.has(tile.dataset['pmTile'] ?? '')).map((tile) => tile.querySelector('.pm-tile__n')?.textContent ?? '');
    set(
      `ch ${pad(chip.dataset['pmExt'] ?? '')} · ${inbound ? 'an earlier chapter this part builds on' : 'a later chapter this part unlocks'}`,
      chip.title,
      `${inbound ? 'Needed by' : 'Needs'} ${names.join(', ')} in this part.`,
    );
  };

  root.addEventListener('pointerover', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const tile = target?.closest<HTMLElement>('[data-pm-tile]');
    if (tile !== null && tile !== undefined) {
      showTile(tile);
      return;
    }
    const chip = target?.closest<HTMLAnchorElement>('[data-pm-ext]');
    if (chip !== null && chip !== undefined) showChip(chip);
  }, { signal });
  root.addEventListener('pointerleave', reset, { signal });
  root.addEventListener('focusin', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const tile = target?.closest<HTMLElement>('[data-pm-tile]');
    if (tile !== null && tile !== undefined) showTile(tile);
    const chip = target?.closest<HTMLAnchorElement>('[data-pm-ext]');
    if (chip !== null && chip !== undefined) showChip(chip);
  }, { signal });

  // Keyboard: the tiles are one tab stop; arrows move between them.
  const links = tiles.map((tile) => tile.querySelector<HTMLAnchorElement>('.pm-tile__link')).filter((link) => link !== null);
  root.querySelector('[data-pm-tiles]')?.addEventListener('keydown', (event) => {
    if (!(event instanceof KeyboardEvent)) return;
    if (event.key === 'Escape') {
      reset();
      return;
    }
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    const at = links.findIndex((link) => link === doc.activeElement);
    const next = links[Math.max(0, Math.min(links.length - 1, at + step))];
    if (next === undefined) return;
    event.preventDefault();
    for (const link of links) link.setAttribute('tabindex', '-1');
    next.setAttribute('tabindex', '0');
    next.focus();
  }, { signal });
}
