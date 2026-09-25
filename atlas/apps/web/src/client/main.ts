/**
 * The single client entry of the Research Atlas (imported once by the base
 * layout). Framework-free: every controller is a small module that enhances
 * server-rendered HTML and degrades to a no-op when its markup is absent.
 *
 * Lifecycle with Astro's ClientRouter: the router swaps <body> on navigation
 * and fires `astro:before-swap` (old page) then `astro:page-load` (new page;
 * also on the first load). Each page gets one `Controller`; every listener,
 * observer, and timer is registered through it and released on before-swap.
 * Mounting is idempotent (keyed on the <body> element), so the immediate
 * mount and the first `astro:page-load` do not double-initialise, and pages
 * without the ClientRouter work too.
 *
 * Heavy or page-specific code is split out and loaded on demand: the search
 * palette (MiniSearch + index) on first ⌘K / Ctrl-K; chart and equation
 * interplay only on pages that contain charts or equations; calculators are
 * Preact islands hydrated when visible. Nothing is logged in production;
 * in development a failing controller reports itself and the others run.
 */
import clientCss from './client.css?inline';
import { ATTR } from '@atlas/core';
import { initAtlasInstrument } from './atlas-instrument.ts';
import { initStackExplorer } from './stack-explorer.ts';
import { initFigureExplore } from './figure-explore.ts';
import { initMiniStack } from './mini-stack.ts';
import { initTimelineExplorer } from './timeline-explorer.ts';
import { initChapterLinks } from './chapter-links.ts';
import { pageData } from './page-data.ts';
import { initRailTrack } from './rail-track.ts';
import { evaluateFigureState } from '@atlas/visual/state';
import { initLiveInstruments } from './live-instruments.ts';
import { initCitations } from './citations.ts';
import { initCopy } from './copy.ts';
import { initDepth } from './depth.ts';
import { siteBase } from './dom.ts';
import { Controller } from './lifecycle.ts';
import { initMinimap } from './minimap.ts';
import { createPageContext, type PageContext } from './page.ts';
import { initRail } from './rail.ts';
import { initReadingState } from './reading-state.ts';
import { initScrollSync } from './scroll-sync.ts';
import { initSearch } from './search.ts';
import { initSheets } from './sheets.ts';
import { browserStorage, createStore } from './storage.ts';
import { initTheme } from './theme.ts';
import { initTree } from './tree.ts';

type Feature = readonly [name: string, init: (ctx: PageContext) => void];

/** Order matters only for shared state: theme and depth first, listeners before scroll-sync's first frame. */
const FEATURES: readonly Feature[] = [
  ['theme', initTheme],
  ['depth', initDepth],
  ['sheets', initSheets],
  ['rail', initRail],
  ['rail-track', initRailTrack],
  ['live-instruments', (ctx) => {
    initLiveInstruments(ctx, evaluateFigureState);
  }],
  ['tree', initTree],
  ['minimap', initMinimap],
  ['reading-state', initReadingState],
  ['citations', initCitations],
  ['copy', initCopy],
  ['atlas-instrument', initAtlasInstrument],
  ['stack-explorer', initStackExplorer],
  ['figure-explore', initFigureExplore],
  ['mini-stack', initMiniStack],
  ['timeline-explorer', initTimelineExplorer],
  ['entity-explorer', (ctx) => { if (ctx.doc.querySelector('[data-entity-explorer]') !== null) void import('./entity-explorer.ts').then((m) => { if (!ctx.ctl.disposed) m.initEntityExplorer(ctx); }); }],
  ['chapter-links', initChapterLinks],
  [
    'papers-explorer',
    (ctx) => {
      if (ctx.doc.querySelector('[data-papers-explorer]') === null) return;
      void import('./papers-explorer.ts').then((module) => {
        if (!ctx.ctl.disposed) module.initPapersExplorer(ctx);
      });
    },
  ],
  [
    'eval-ecosystem',
    (ctx) => {
      if (ctx.doc.querySelector('[data-eco-explorer]') === null) return;
      void import('./eval-ecosystem.ts').then((module) => {
        if (!ctx.ctl.disposed) module.initEvalEcosystem(ctx);
      });
    },
  ],
  [
    'library-explorer',
    (ctx) => {
      if (ctx.doc.querySelector('[data-library-explorer]') === null) return;
      void import('./library-explorer.ts').then((module) => {
        if (!ctx.ctl.disposed) module.initLibraryExplorer(ctx);
      });
    },
  ],
  [
    'paper-page',
    (ctx) => {
      if (ctx.doc.querySelector('[data-paper-page]') === null) return;
      void import('./paper-page.ts').then((module) => {
        if (!ctx.ctl.disposed) module.initPaperPage(ctx);
      });
    },
  ],
  [
    'figures-explorer',
    (ctx) => {
      if (ctx.doc.querySelector('[data-figures-explorer]') === null) return;
      void import('./figures-explorer.ts').then((module) => {
        if (!ctx.ctl.disposed) module.initFiguresExplorer(ctx);
      });
    },
  ],
  [
    'equations-explorer',
    (ctx) => {
      if (ctx.doc.querySelector('[data-equations-explorer]') === null) return;
      void import('./equations-explorer.ts').then((module) => {
        if (!ctx.ctl.disposed) module.initEquationsExplorer(ctx);
      });
    },
  ],
  [
    'terms-explorer',
    (ctx) => {
      if (ctx.doc.querySelector('[data-terms-explorer]') === null) return;
      void import('./terms-explorer.ts').then((module) => {
        if (!ctx.ctl.disposed) module.initTermsExplorer(ctx);
      });
    },
  ],
  [
    'part-map',
    (ctx) => {
      if (ctx.doc.querySelector('[data-part-map]') === null) return;
      void import('./part-map.ts').then((module) => {
        if (!ctx.ctl.disposed) module.initPartMap(ctx);
      });
    },
  ],
  [
    'entity-map',
    (ctx) => {
      if (ctx.doc.querySelector('[data-entity-map]') === null) return;
      void import('./entity-map.ts').then((module) => {
        if (!ctx.ctl.disposed) module.initEntityMap(ctx);
      });
    },
  ],
  ['search', initSearch],
  ['scroll-sync', initScrollSync],
];

const CHART_SELECTOR = `[${ATTR.figureKind}="chart"]`;
const EQUATION_SELECTOR = `[${ATTR.eqVar}], [${ATTR.dim}], .katex`;

const store = createStore(browserStorage());
let controller: Controller | null = null;
let mountedBody: HTMLElement | null = null;

function report(name: string, error: unknown): void {
  if (import.meta.env.DEV) console.error(`[atlas] ${name} failed to initialise`, error);
}

function mount(): void {
  if (controller !== null && mountedBody === document.body) return;
  unmount();
  const ctl = new Controller();
  controller = ctl;
  mountedBody = document.body;
  installStyles();

  const ctx = createPageContext(document, ctl, store, siteBase(document, import.meta.env.BASE_URL));
  for (const [name, init] of FEATURES) {
    try {
      init(ctx);
    } catch (error) {
      report(name, error);
    }
  }

  if (document.querySelector(CHART_SELECTOR) !== null) {
    import('./charts.ts')
      .then((module) => {
        if (!ctl.disposed) module.initCharts(ctx);
      })
      .catch((error: unknown) => {
        report('charts', error);
      });
  }
  if (document.querySelector(EQUATION_SELECTOR) !== null || Object.keys(pageData(document)?.equations ?? {}).length > 0) {
    import('./equations.ts')
      .then((module) => {
        if (!ctl.disposed) module.initEquations(ctx);
      })
      .catch((error: unknown) => {
        report('equations', error);
      });
  }
}

function unmount(): void {
  controller?.dispose();
  controller = null;
  mountedBody = null;
}

let stylesInstalled = false;

/** One constructable stylesheet per document; it survives ClientRouter swaps (head elements do not). */
function installStyles(): void {
  if (stylesInstalled) return;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(clientCss);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    stylesInstalled = true;
  } catch {
    // Engines without constructable stylesheets: a <style> element, re-added after each swap.
    if (document.getElementById('atlas-client-css') === null) {
      const style = document.createElement('style');
      style.id = 'atlas-client-css';
      style.textContent = clientCss;
      document.head.append(style);
    }
  }
}

declare global {
  interface Window {
    __atlasClient?: true;
  }
}

if (window.__atlasClient !== true) {
  window.__atlasClient = true;
  document.addEventListener('astro:page-load', mount);
  document.addEventListener('astro:before-swap', unmount);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
}
