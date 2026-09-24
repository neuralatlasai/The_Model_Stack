/**
 * Drives the rail's "now reading" track (components/research/RailTrack.astro):
 * on every active-region change the current tick moves, ticks before it are
 * marked read, the region line updates, and the percentage follows reading
 * progress. Purely presentational; scroll-sync owns the state.
 */
import { EVENTS } from './contract.ts';
import { CLIENT_EVENTS } from './events.ts';
import type { PageContext } from './page.ts';

export function initRailTrack(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const track = doc.querySelector<HTMLElement>('[data-rail-track]');
  if (track === null) return;
  const ticks = [...track.querySelectorAll<HTMLAnchorElement>('[data-track-tick]')];
  const pct = track.querySelector<HTMLElement>('[data-track-pct]');
  const nowOrd = track.querySelector<HTMLElement>('[data-track-now-ord]');
  const nowLabel = track.querySelector<HTMLElement>('[data-track-now-label]');

  const setRegion = (anchor: string): void => {
    const index = ticks.findIndex((tick) => tick.dataset['trackTick'] === anchor);
    if (index < 0) return;
    ticks.forEach((tick, i) => {
      tick.classList.toggle('is-current', i === index);
      tick.classList.toggle('is-read', i < index);
      if (i === index) tick.setAttribute('aria-current', 'location');
      else tick.removeAttribute('aria-current');
    });
    const tick = ticks[index];
    if (nowOrd !== null) nowOrd.textContent = tick?.dataset['trackOrd'] ?? '';
    if (nowLabel !== null) nowLabel.textContent = tick?.dataset['trackTitle'] ?? '';
  };

  const setProgress = (progress: number): void => {
    if (pct !== null) pct.textContent = `${String(Math.round(Math.min(1, Math.max(0, progress)) * 100))}%`;
    track.style.setProperty('--track-progress', String(progress));
  };

  doc.addEventListener(
    EVENTS.activeRegion,
    (event) => {
      setRegion(event.detail.anchor);
      setProgress(event.detail.progress);
    },
    { signal: ctl.signal },
  );
  doc.addEventListener(
    CLIENT_EVENTS.progress,
    (event) => {
      setProgress(event.detail.progress);
      if (event.detail.anchor !== null) setRegion(event.detail.anchor);
    },
    { signal: ctl.signal },
  );
}
