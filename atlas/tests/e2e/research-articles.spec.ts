import { expect, test } from '@playwright/test';

const ARTICLE = '/ch01-foundation-model-lifecycle/01-1-problem-formulation/';
const VISUAL_TOPICS = [
  '/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation/',
  '/ch07-data-provenance-acquisition-and-dataset-semantics/07-3-acquisition-and-extraction/',
  '/ch06-experimental-design-and-evaluation-before-optimization/06-6-reproducible-evidence/',
] as const;

test('authored topic pages fill the viewport with explanation followed by scientific figures', async ({ page }) => {
  await page.setViewportSize({ width: 1275, height: 623 });
  for (const route of VISUAL_TOPICS) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('data-article-layout', 'workspace');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.locator('.aw-explanation')).toHaveCSS('width', '1227px');
    await expect(page.locator('.aw-explanation .rb-p').first()).toHaveCSS('font-size', '23px');
    await expect(page.locator('.aw-visuals .aw-visual')).toHaveCount(2);
    await expect(page.locator('#context-rail')).not.toBeVisible();
    const previews = await page.locator('.aw-visual').evaluateAll((figures) =>
      figures.map((figure) => ({
        source: (figure as HTMLElement).dataset['sourceFigure'],
        anchor: figure.querySelector('header a')?.getAttribute('href'),
        top: figure.getBoundingClientRect().top,
      })),
    );
    for (const preview of previews) {
      const explanationBottom = await page.locator('.aw-explanation').evaluate((e) => e.getBoundingClientRect().bottom);
      expect(preview.top).toBeGreaterThanOrEqual(explanationBottom);
      expect(preview.anchor).toBeTruthy();
      const canonical = page.locator(`.aw-manuscript ${preview.anchor ?? ''}`);
      await expect(canonical).toHaveCount(1);
      expect(
        await canonical.evaluate(
          (element, source) =>
            element.getAttribute('data-figure') === source ||
            [...element.querySelectorAll('[data-figure]')].some(
              (figure) => figure.getAttribute('data-figure') === source,
            ),
          preview.source,
        ),
      ).toBe(true);
    }
    const duplicateIds = await page.locator('article [id]').evaluateAll((elements) => {
      const counts = new Map<string, number>();
      for (const element of elements) counts.set(element.id, (counts.get(element.id) ?? 0) + 1);
      return [...counts].filter(([, count]) => count > 1).map(([id]) => id);
    });
    expect(duplicateIds).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('desktop page contents remain available as a native popover without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1275, height: 623 } });
  try {
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4321${VISUAL_TOPICS[0]}`);
    const contents = page.locator('#context-rail');
    await expect(contents).not.toBeVisible();
    await page.getByRole('button', { name: 'On this page', exact: true }).click();
    await expect(contents).toBeVisible();
    await expect(contents.getByRole('link', { name: /Methodology/iu }).first()).toBeVisible();
    await contents.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(contents).not.toBeVisible();
  } finally {
    await context.close();
  }
});

test('the opening calculator changes independently and can reset to its authored defaults', async ({ page }) => {
  await page.goto(VISUAL_TOPICS[1]);
  const preview = page.locator('.aw-visual--calculator');
  const input = preview.locator('input[type="range"]').first();
  await expect(input).toBeEnabled();
  const outputs = preview.locator('.vg-calc__outputs');
  const initial = (await outputs.textContent()) ?? '';
  expect(initial).not.toBe('');
  const canonical = page.locator('.aw-manuscript [data-calculator="fig-7.13"] .vg-calc__outputs');
  const canonicalInitial = (await canonical.textContent()) ?? '';
  expect(canonicalInitial).not.toBe('');
  await input.focus();
  await input.press('End');
  await expect(outputs).not.toHaveText(initial);
  await expect(canonical).toHaveText(canonicalInitial);
  await preview.getByRole('button', { name: /^Reset .+ to its default values$/u }).click();
  await expect(outputs).toHaveText(initial);
});

test('evidence, citations, and inspection dimensions keep the shared reading rhythm', async ({ page }) => {
  await page.goto('/ch02-mathematical-and-statistical-foundations/');
  const derivation = page.locator('.rb-p').filter({ hasText: 'Each section makes those choices explicit' });
  await expect(derivation.locator('.rb-xref--derived')).toHaveCount(3);
  await expect(derivation).not.toContainText('DERIVED:eq-');
  await expect(derivation).toHaveCSS('font-size', '22px');
  await expect(derivation).toHaveCSS('line-height', '33px');
  const paper = page.locator('.rb-p').filter({ hasText: 'Source-reported protocols then establish' });
  await expect(paper.locator('.rb-cite').first()).toHaveCSS('top', '0px');
  await expect(paper.locator('.rb-cite').first()).toHaveCSS('font-size', '22px');
  await expect(paper).toContainText('§\u202f3.2');
  const dimensions = page.locator('.rb-dimensions');
  await expect(dimensions.locator('.rb-dimensions__item')).toHaveCount(6);
  await expect(dimensions).toContainText('Communication');
  await expect(dimensions).toContainText('§§\u202f02.1, 02.4');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('reading tools remain accessible from the contents panel', async ({ page }) => {
  await page.goto(VISUAL_TOPICS[0]);
  await page.getByRole('button', { name: 'On this page', exact: true }).click();
  const context = page.locator('#context-rail');
  await expect(context.getByRole('link', { name: 'Systems', exact: true })).toBeVisible();
  await expect(context.getByRole('button', { name: /^Colour theme/u })).toBeVisible();
  await context.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('dialog').filter({ has: page.getByRole('combobox') })).toBeVisible();
});

test('a legacy depth link and stored Overview cannot hide manuscript sections or figures', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('atlas.depth.v1', '"overview"');
  });
  await page.goto(`${ARTICLE}?depth=overview`);
  await expect(page.locator('html')).toHaveAttribute('data-depth', 'implementation');
  const regions = page.locator('article [data-region]');
  await expect(regions).toHaveCount(15);
  for (const region of await regions.all()) await expect(region).toBeVisible();
  await expect(page.locator('nav[aria-label="Reading depth"]')).toHaveCount(0);
  for (const figure of await page.locator('article .rb-figure__inline').all()) await expect(figure).toBeVisible();
  await expect(page.locator('#implementation')).toContainText(/implementation/iu);
  await expect(page.locator('#reproducibility')).toBeVisible();
  await expect(page.locator('#references')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem('atlas.depth.v1'))).toBe('"overview"');
  await page
    .getByRole('navigation', { name: 'Atlas', exact: true })
    .getByRole('link', { name: 'Library', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-reading-mode', 'atlas');
  await expect(page.locator('html')).toHaveAttribute('data-depth', 'overview');
});

test('the entire article remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4321${ARTICLE}?depth=overview`);
    const regions = page.locator('article [data-region]');
    await expect(regions).toHaveCount(15);
    for (const region of await regions.all()) await expect(region).toBeVisible();
    await expect(page.locator('article .rb-figure__inline').first()).toBeVisible();
  } finally {
    await context.close();
  }
});

test('mobile reading preserves the manuscript and native chapter navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(ARTICLE);
  for (const region of await page.locator('article [data-region]').all()) await expect(region).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Contents', exact: true }).click();
  await expect(page.locator('#knowledge-tree')).toBeVisible();
  await page.locator('#knowledge-tree').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('#knowledge-tree')).not.toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Problem formulation');
});

test('research diagrams fit the article and retain full-size inspection', async ({ page }) => {
  await page.goto(ARTICLE);
  const figure = page
    .locator('article .rb-figure')
    .filter({ has: page.locator('.vg-scroll .vg-svg') })
    .first();
  const image = figure.locator('.vg-scroll .vg-svg');
  const viewport = figure.locator('.vg-scroll');
  const imageWidth = await image.evaluate((element) => element.getBoundingClientRect().width);
  const viewportWidth = await viewport.evaluate((element) => element.clientWidth);
  expect(imageWidth).toBeLessThanOrEqual(viewportWidth + 1);
  const fullSize = figure.getByRole('checkbox');
  await fullSize.check();
  await expect(fullSize).toBeChecked();
  expect(await image.evaluate((element) => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(imageWidth);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await fullSize.uncheck();
  expect(await image.evaluate((element) => element.getBoundingClientRect().width)).toBeLessThanOrEqual(
    viewportWidth + 1,
  );
});

test('authored derivations are expanded on entry without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(
      'http://127.0.0.1:4321/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-6-filter-interactions/',
    );
    const derivations = page.locator('article details.rb-expand');
    expect(await derivations.count()).toBeGreaterThan(0);
    for (const derivation of await derivations.all()) {
      await expect(derivation).toHaveAttribute('open', '');
      await expect(derivation.locator('.rb-expand__body')).toBeVisible();
    }
  } finally {
    await context.close();
  }
});

test('chapter references use the full reading width and retain all source records on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/ch02-mathematical-and-statistical-foundations/references/');
  await expect(page.locator('.aw-manuscript')).toHaveCSS('width', '1392px');
  await expect(page.locator('.rb-records__item')).toHaveCount(25);
  await expect(page.locator('.rb-records__title').first()).toHaveCSS('font-family', /EB Garamond/u);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.aw-manuscript')).toHaveCSS('width', '358px');
  await expect(page.locator('.rb-records__item')).toHaveCount(25);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
