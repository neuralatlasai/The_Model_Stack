/**
 * The brain hero (components/home/BrainHero.astro) comes alive:
 *
 * - Signals fire continuously along real prerequisite fibres; the neuron a
 *   signal reaches flashes.
 * - Pointing at (or focusing) a neuron lights what it builds on (incoming
 *   fibres) and what it unlocks (outgoing), its concepts and dendrites, fires
 *   signals along its fibres, tags it in place, and names it in the readout.
 * - Left alone, the brain "thinks" through the written chapters in turn.
 * - Arrow keys move between neurons; Enter opens the chapter.
 * Nothing moves under prefers-reduced-motion; hover and keys still work.
 */
import type { PageContext } from './page.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';
const pad = (n: number): string => String(n).padStart(2, '0');

interface Fibre {
  readonly el: SVGPathElement;
  readonly from: number;
  readonly to: number;
  readonly len: number;
}

interface Pulse {
  readonly fibre: Fibre;
  readonly reverse: boolean;
  readonly start: number;
  readonly dur: number;
  readonly g: SVGGElement;
}

export function initBrain(ctx: PageContext, fig: HTMLElement, reduced: boolean): void {
  const { doc, ctl } = ctx;
  const svg = fig.querySelector<SVGSVGElement>('[data-brain-svg]');
  const layer = svg?.querySelector<SVGGElement>('[data-pulses]') ?? null;
  if (svg === null || layer === null) return;
  const signal = ctl.signal;

  const neurons = [...svg.querySelectorAll<SVGAElement>('.hb-n')].sort((a, b) => Number(a.dataset['n']) - Number(b.dataset['n']));
  const byN = new Map(neurons.map((a) => [Number(a.dataset['n']), a]));
  const pos = new Map(
    neurons.map((a) => {
      const core = a.querySelector('.hb-n__core');
      return [Number(a.dataset['n']), { x: Number(core?.getAttribute('cx')), y: Number(core?.getAttribute('cy')) }];
    }),
  );
  const fibres: Fibre[] = [...svg.querySelectorAll<SVGPathElement>('.hb-fibres path')].map((el) => ({
    el,
    from: Number(el.dataset['from']),
    to: Number(el.dataset['to']),
    len: el.getTotalLength(),
  }));
  const concepts = [...svg.querySelectorAll<SVGCircleElement>('.hb-concepts circle')];
  const dendrites = [...svg.querySelectorAll<SVGPathElement>('.hb-dendrites path')];
  const writtenNs = neurons.filter((a) => a.classList.contains('is-written')).map((a) => Number(a.dataset['n']));
  const live = fibres.filter((fibre) => writtenNs.includes(fibre.from) || writtenNs.includes(fibre.to));

  // ── readout and tag ────────────────────────────────────────────────────────
  const readout = fig.querySelector('[data-brain-readout]');
  const slots = { k: readout?.querySelector('[data-k]') ?? null, t: readout?.querySelector('[data-t]') ?? null, m: readout?.querySelector('[data-m]') ?? null };
  const idle = { k: slots.k?.textContent ?? '', t: slots.t?.textContent ?? '', m: slots.m?.textContent ?? '' };
  const tag = svg.querySelector<SVGGElement>('[data-tag]');
  const tagRect = tag?.querySelector('rect') ?? null;
  const tagText = tag?.querySelector('text') ?? null;

  const placeTag = (n: number, label: string): void => {
    const at = pos.get(n);
    if (tag === null || tagRect === null || tagText === null || at === undefined) return;
    tagText.textContent = label;
    const width = tagText.getComputedTextLength() + 16;
    const left = at.x > 420 ? at.x - width - 10 : at.x + 10;
    const top = Math.max(4, at.y - 22);
    tagRect.setAttribute('x', String(left));
    tagRect.setAttribute('y', String(top));
    tagRect.setAttribute('width', String(width));
    tagRect.setAttribute('height', '15');
    tagText.setAttribute('x', String(left + 8));
    tagText.setAttribute('y', String(top + 10.5));
    tag.classList.add('is-on');
  };

  // ── pulses ─────────────────────────────────────────────────────────────────
  // One native animation loop and plain timers, released once on dispose —
  // a page-owned callback per frame would accumulate cleanups on a long visit.
  const pulses: Pulse[] = [];
  let raf = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number): void => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };
  ctl.defer(() => {
    cancelAnimationFrame(raf);
    for (const id of timers) clearTimeout(id);
  });
  const flash = (n: number): void => {
    const a = byN.get(n);
    if (a === undefined) return;
    a.classList.add('is-flash');
    later(() => {
      a.classList.remove('is-flash');
    }, 420);
  };
  const frame = (now: number): void => {
    for (let i = pulses.length - 1; i >= 0; i -= 1) {
      const pulse = pulses[i];
      if (pulse === undefined) continue;
      const t = (now - pulse.start) / pulse.dur;
      if (t < 0) continue;
      if (t >= 1) {
        pulse.g.remove();
        pulses.splice(i, 1);
        flash(pulse.reverse ? pulse.fibre.from : pulse.fibre.to);
        continue;
      }
      const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      const p = pulse.fibre.el.getPointAtLength((pulse.reverse ? 1 - eased : eased) * pulse.fibre.len);
      pulse.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      pulse.g.style.opacity = String(Math.min(1, t * 6, (1 - t) * 6));
    }
    raf = pulses.length > 0 && !ctl.disposed ? requestAnimationFrame(frame) : 0;
  };
  const spawn = (fibre: Fibre, reverse = false, delay = 0): void => {
    if (reduced || pulses.length > 18) return;
    const source = byN.get(reverse ? fibre.to : fibre.from);
    const g = doc.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'hb-pulse');
    g.setAttribute('style', `${source?.getAttribute('style') ?? ''};opacity:0`);
    const glow = doc.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('r', '6');
    glow.setAttribute('class', 'hb-pulse__glow');
    const dot = doc.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('r', '1.8');
    dot.setAttribute('class', 'hb-pulse__dot');
    g.append(glow, dot);
    layer.append(g);
    pulses.push({ fibre, reverse, start: performance.now() + delay, dur: 900 + Math.min(fibre.len, 400) * 3.2, g });
    if (raf === 0) raf = requestAnimationFrame(frame);
  };
  ctl.defer(() => {
    for (const pulse of pulses) pulse.g.remove();
    pulses.length = 0;
  });

  // ── activation ─────────────────────────────────────────────────────────────
  let active: number | null = null;
  const clear = (): void => {
    svg.classList.remove('has-focus');
    for (const a of neurons) a.classList.remove('is-active', 'is-linked');
    for (const fibre of fibres) fibre.el.classList.remove('is-in', 'is-out');
    for (const el of [...concepts, ...dendrites]) el.classList.remove('is-lit');
    tag?.classList.remove('is-on');
  };
  const activate = (n: number | null, fire: boolean): void => {
    active = n;
    clear();
    const a = n === null ? undefined : byN.get(n);
    if (n === null || a === undefined) {
      if (slots.k !== null) slots.k.textContent = idle.k;
      if (slots.t !== null) slots.t.textContent = idle.t;
      if (slots.m !== null) slots.m.textContent = idle.m;
      return;
    }
    svg.classList.add('has-focus');
    a.classList.add('is-active');
    const ins = fibres.filter((fibre) => fibre.to === n);
    const outs = fibres.filter((fibre) => fibre.from === n);
    for (const fibre of ins) {
      fibre.el.classList.add('is-in');
      byN.get(fibre.from)?.classList.add('is-linked');
    }
    for (const fibre of outs) {
      fibre.el.classList.add('is-out');
      byN.get(fibre.to)?.classList.add('is-linked');
    }
    const key = String(n);
    const names: string[] = [];
    for (const concept of concepts) {
      if (concept.dataset['c'] !== key) continue;
      concept.classList.add('is-lit');
      if (names.length < 5) names.push(concept.dataset['t'] ?? '');
    }
    for (const dendrite of dendrites) if (dendrite.dataset['c'] === key) dendrite.classList.add('is-lit');
    const written = a.classList.contains('is-written');
    const title = a.dataset['title'] ?? '';
    if (slots.k !== null) slots.k.textContent = `Chapter ${pad(n)} · ${a.dataset['region'] ?? ''} · ${written ? 'written' : 'planned'}`;
    if (slots.t !== null) slots.t.textContent = title;
    if (slots.m !== null) {
      const count = Number(a.dataset['concepts'] ?? 0);
      const links = `builds on ${String(ins.length)} · unlocks ${String(outs.length)}`;
      slots.m.textContent = count > 0 ? `${links} · ${String(count)} concepts: ${names.join(', ')}${count > names.length ? '…' : ''}` : `${links} · ${written ? 'no glossary terms owned' : 'manuscript planned'}`;
    }
    placeTag(n, `${pad(n)} · ${title.length > 38 ? `${title.slice(0, 36)}…` : title}`);
    if (fire) {
      ins.slice(0, 6).forEach((fibre, i) => {
        spawn(fibre, false, i * 90);
      });
      outs.slice(0, 6).forEach((fibre, i) => {
        spawn(fibre, false, 380 + i * 90);
      });
    }
  };

  // ── pointer, focus, keys ───────────────────────────────────────────────────
  let engaged = false;
  const neuronFrom = (target: EventTarget | null): SVGAElement | null => (target instanceof Element ? target.closest<SVGAElement>('.hb-n') : null);
  svg.addEventListener('pointerover', (event) => {
    const a = neuronFrom(event.target);
    engaged = true;
    if (a !== null && Number(a.dataset['n']) !== active) activate(Number(a.dataset['n']), true);
  }, { signal });
  svg.addEventListener('pointerleave', () => {
    engaged = false;
    activate(null, false);
  }, { signal });
  svg.addEventListener('focusin', (event) => {
    const a = neuronFrom(event.target);
    if (a !== null) {
      engaged = true;
      activate(Number(a.dataset['n']), true);
    }
  }, { signal });
  svg.addEventListener('focusout', () => {
    engaged = false;
  }, { signal });
  svg.addEventListener('keydown', (event) => {
    const a = neuronFrom(event.target);
    if (a === null) return;
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = neurons[(neurons.indexOf(a) + step + neurons.length) % neurons.length];
    if (next === undefined) return;
    for (const other of neurons) other.setAttribute('tabindex', '-1');
    next.setAttribute('tabindex', '0');
    next.focus();
  }, { signal });

  // ── ambient life: firing, and a slow tour of the written chapters ─────────
  if (reduced) return;
  let visible = false;
  ctl.observe(new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
  }, { threshold: 0.15 })).observe(fig);
  const awake = (): boolean => visible && doc.visibilityState === 'visible';
  const ambient = setInterval(() => {
    if (!awake() || live.length === 0 || pulses.length >= 10) return;
    const fibre = live[Math.floor(Math.random() * live.length)];
    if (fibre !== undefined) spawn(fibre, Math.random() < 0.25);
  }, 360);
  let tourAt = 0;
  const tour = setInterval(() => {
    if (!awake() || engaged || writtenNs.length === 0) return;
    activate(writtenNs[tourAt % writtenNs.length] ?? null, true);
    tourAt += 1;
  }, 3200);
  ctl.defer(() => {
    clearInterval(ambient);
    clearInterval(tour);
  });
}
