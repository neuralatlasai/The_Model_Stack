/**
 * Home story behaviour (components/home/HomeStory.astro). Progressive: the
 * server renders the first state of everything; this adds motion and life.
 *
 * - Sections reveal as they enter the viewport.
 * - The hero brain (client brain.ts) fires signals along real prerequisite
 *   fibres and names any chapter neuron under the pointer.
 * - Claims, example chapters, depths, and search queries cycle while their
 *   panel is on screen and not being handled; every control also works by
 *   click and keyboard. Nothing moves under prefers-reduced-motion.
 */
import type { PageContext } from './page.ts';

interface Cycler {
  readonly stop: () => void;
}

export function initHome(ctx: PageContext): void {
  const { doc, ctl } = ctx;
  const root = doc.querySelector<HTMLElement>('main.sh-home');
  const hero = root?.querySelector('[data-home-hero]') ?? null;
  if (root === null || hero === null) return;
  const signal = ctl.signal;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) root.classList.add('hx-anim');
  ctl.defer(() => {
    root.classList.remove('hx-anim');
  });

  // ── reveal + visibility ────────────────────────────────────────────────────
  const visible = new Set<Element>();
  const io = ctl.observe(
    new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            visible.add(entry.target);
          } else {
            visible.delete(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    ),
  );
  for (const el of root.querySelectorAll('[data-reveal], [data-home-claims], [data-home-deps], [data-home-depth], [data-home-search]')) io.observe(el);
  // The pulse runs from the first step's icon to the last one's.
  const steps = root.querySelector<HTMLElement>('.hx-steps');
  const measure = (): void => {
    const icons = steps === null ? [] : [...steps.querySelectorAll('.hx-step__icon')];
    const first = icons[0]?.getBoundingClientRect();
    const last = icons.at(-1)?.getBoundingClientRect();
    if (steps !== null && first !== undefined && last !== undefined) steps.style.setProperty('--hx-flow-w', `${String(Math.max(120, last.left - first.left + 90))}px`);
  };
  measure();
  window.addEventListener('resize', measure, { signal });

  /** Runs `step` every `ms` while `panel` is on screen, the tab is visible, and the panel is not hovered or focused. */
  const cycle = (panel: Element | null, ms: number, step: () => void, scope: Element | null = panel): Cycler => {
    let stopped = reduced || panel === null;
    let held = false;
    if (scope !== null) {
      scope.addEventListener('pointerenter', () => { held = true; }, { signal });
      scope.addEventListener('pointerleave', () => { held = false; }, { signal });
      scope.addEventListener('focusin', () => { held = true; }, { signal });
      scope.addEventListener('focusout', () => { held = false; }, { signal });
    }
    const id = stopped
      ? null
      : setInterval(() => {
          if (!stopped && !held && doc.visibilityState === 'visible' && panel !== null && visible.has(panel)) step();
        }, ms);
    if (id !== null) ctl.defer(() => {
      clearInterval(id);
    });
    return {
      stop: () => {
        stopped = true;
        if (id !== null) clearInterval(id);
      },
    };
  };

  // ── the brain ──────────────────────────────────────────────────────────────
  const brain = root.querySelector<HTMLElement>('[data-brain]');
  if (brain !== null) {
    void import('./brain.ts').then((module) => {
      if (!ctl.disposed) module.initBrain(ctx, brain, reduced);
    });
  }

  // ── 01 claims ──────────────────────────────────────────────────────────────
  const claimsPanel = root.querySelector('[data-home-claims]');
  const claims = claimsPanel === null ? [] : [...claimsPanel.querySelectorAll<HTMLElement>('[data-claim]')];
  const dots = claimsPanel === null ? [] : [...claimsPanel.querySelectorAll<HTMLElement>('[data-dot]')];
  const labels = claimsPanel === null ? [] : [...claimsPanel.querySelectorAll<HTMLButtonElement>('[data-claim-target]')];
  let claimAt = 0;
  const showClaim = (index: number): void => {
    claimAt = (index + claims.length) % Math.max(1, claims.length);
    claims.forEach((claim, i) => { claim.hidden = i !== claimAt; });
    dots.forEach((dot, i) => dot.classList.toggle('is-on', i === claimAt));
    const label = claims[claimAt]?.querySelector('.hx-chip')?.textContent ?? '';
    for (const button of labels) {
      const target = Number(button.dataset['claimTarget']);
      const shown = target >= 0 && claims[target]?.querySelector('.hx-chip')?.textContent === label;
      button.setAttribute('aria-pressed', String(shown));
    }
  };
  for (const button of labels) {
    button.addEventListener('click', () => {
      const target = Number(button.dataset['claimTarget']);
      if (target >= 0) showClaim(target);
    }, { signal });
  }
  if (claims.length > 1) cycle(claimsPanel, 6500, () => { showClaim(claimAt + 1); });

  // ── 02 dependencies ────────────────────────────────────────────────────────
  const depsPanel = root.querySelector('[data-home-deps]');
  const deps = depsPanel === null ? [] : [...depsPanel.querySelectorAll<HTMLElement>('[data-focus]')];
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-focus-tab]')];
  let depAt = 0;
  const showDep = (index: number): void => {
    depAt = (index + deps.length) % Math.max(1, deps.length);
    deps.forEach((dep, i) => { dep.hidden = i !== depAt; });
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === depAt));
      tab.tabIndex = i === depAt ? 0 : -1;
    });
  };
  let depCycle: Cycler | null = null;
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      depCycle?.stop();
      showDep(i);
    }, { signal });
    tab.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (step === 0) return;
      event.preventDefault();
      depCycle?.stop();
      showDep(depAt + step);
      tabs[depAt]?.focus();
    }, { signal });
  });
  showDep(0);
  if (deps.length > 1) depCycle = cycle(depsPanel, 5200, () => { showDep(depAt + 1); }, depsPanel?.closest('section') ?? depsPanel);

  // ── 03 depth ───────────────────────────────────────────────────────────────
  const depth = root.querySelector<HTMLElement>('[data-home-depth]');
  const opts = depth === null ? [] : [...depth.querySelectorAll<HTMLButtonElement>('[data-depth-opt]')];
  const desc = depth?.querySelector('[data-depth-desc]') ?? null;
  let descriptions: Record<string, string> = {};
  try {
    descriptions = JSON.parse(depth?.querySelector('[data-depth-desc-data]')?.textContent ?? '{}') as Record<string, string>;
  } catch {
    descriptions = {};
  }
  let depthAt = Math.max(0, opts.findIndex((opt) => opt.getAttribute('aria-checked') === 'true'));
  const setDepth = (index: number): void => {
    depthAt = (index + opts.length) % Math.max(1, opts.length);
    const key = opts[depthAt]?.dataset['depthOpt'] ?? 'technical';
    if (depth !== null) depth.dataset['depth'] = key;
    opts.forEach((opt, i) => {
      opt.setAttribute('aria-checked', String(i === depthAt));
      opt.tabIndex = i === depthAt ? 0 : -1;
    });
    if (desc !== null) desc.textContent = descriptions[key] ?? '';
  };
  let depthCycle: Cycler | null = null;
  opts.forEach((opt, i) => {
    opt.addEventListener('click', () => {
      depthCycle?.stop();
      setDepth(i);
    }, { signal });
    opt.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
      if (step === 0) return;
      event.preventDefault();
      depthCycle?.stop();
      setDepth(depthAt + step);
      opts[depthAt]?.focus();
    }, { signal });
  });
  setDepth(depthAt);
  if (opts.length > 1) depthCycle = cycle(depth, 2600, () => { setDepth(depthAt + 1); });

  // ── 04 search ──────────────────────────────────────────────────────────────
  const searchPanel = root.querySelector('[data-home-search]');
  const query = searchPanel?.querySelector('[data-query]') ?? null;
  const results = searchPanel === null ? [] : [...searchPanel.querySelectorAll<HTMLElement>('[data-results]')];
  let searchAt = 0;
  let typing: ReturnType<typeof setTimeout> | undefined;
  ctl.defer(() => {
    clearTimeout(typing);
  });
  const showSearch = (index: number): void => {
    searchAt = (index + results.length) % Math.max(1, results.length);
    const text = results[searchAt]?.dataset['q'] ?? '';
    for (const list of results) list.hidden = true;
    clearTimeout(typing);
    let n = 0;
    const type = (): void => {
      if (query !== null) query.textContent = text.slice(0, n);
      if (n < text.length) {
        n += 1;
        typing = setTimeout(type, 65);
      } else {
        const list = results[searchAt];
        if (list !== undefined) list.hidden = false;
      }
    };
    type();
  };
  if (results.length > 1) cycle(searchPanel, 4200, () => { showSearch(searchAt + 1); });
  root.querySelector('[data-home-open-search]')?.addEventListener('click', () => {
    doc.querySelector<HTMLElement>('[data-action="open-search"]')?.click();
  }, { signal });

  // ── 05 sources: name the evaluation system under the pointer ──────────────
  const ecoName = root.querySelector('[data-eco-name]');
  const ecoIdle = ecoName?.textContent ?? '';
  const ecoGrid = root.querySelector('.hx-eco');
  ecoGrid?.addEventListener('pointerover', (event) => {
    const cell = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-eco-label]') : null;
    if (cell !== null && ecoName !== null) ecoName.textContent = cell.dataset['ecoLabel'] ?? ecoIdle;
  }, { signal });
  ecoGrid?.addEventListener('pointerleave', () => {
    if (ecoName !== null) ecoName.textContent = ecoIdle;
  }, { signal });
}
