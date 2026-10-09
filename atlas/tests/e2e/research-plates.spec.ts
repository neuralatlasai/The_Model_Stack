import { expect, test } from '@playwright/test';

const route = '/ch33-direct-preference-optimization-and-related-objectives/33-1-dpo-derivation/';

test('research plots reflow at desktop and mobile widths with readable axes and exact keyboard values', async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    const chart = page.locator('.aw-manuscript [data-responsive-chart="fig-33-3"]');
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toHaveAttribute('data-chart-ready', 'true');
    const svg = chart.locator('svg.vg-chart__svg');
    const dimensions = await svg.evaluate((element) => ({
      display: element.getBoundingClientRect().width,
      native: Number(element.getAttribute('viewBox')?.split(' ')[2]),
      font: getComputedStyle(element.querySelector('.vg-tick') ?? element).fontSize,
    }));
    expect(Math.abs(dimensions.display - dimensions.native)).toBeLessThan(2);
    expect(dimensions.font).toBe('12px');
    await expect(page.locator('.aw-manuscript .vg-figure__title').first()).toHaveCSS('font-family', /EB Garamond/u);
    await svg.focus();
    await svg.press('End');
    await expect(chart.locator('.cx-chart-readout')).toContainText('Reference-relative margin');
    await expect(chart.locator('.cx-chart-readout')).toContainText('Binary negative log likelihood');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('calculator controls drive a real plot, selectors change its axes and reset restores the equation', async ({
  page,
}) => {
  await page.goto(route);
  const calculator = page.locator('.aw-manuscript [data-calculator="fig-33.2"]');
  await calculator.scrollIntoViewIfNeeded();
  const input = calculator.locator('input[type="range"]').nth(1);
  await expect(input).toBeEnabled();
  const output = calculator.locator('.vg-calc__outputs');
  const original = await output.textContent();
  const selectedPath = calculator.locator('.sc-chart path[data-series="selected"]');
  const originalPath = await selectedPath.getAttribute('d');
  await input.focus();
  await input.press('End');
  await expect(output).not.toHaveText(original ?? '');
  await expect(selectedPath).not.toHaveAttribute('d', originalPath ?? '');
  await expect(calculator.locator('.sc-calculator__intro')).toContainText('Modified settings');
  await calculator.locator('select').first().selectOption('d');
  await expect(calculator.locator('.vg-axis-label--x')).toContainText('Utility gap');
  const currentPoint = calculator.locator('.vg-pt[data-series="current"]');
  await expect(currentPoint).toHaveAttribute('data-x', '2');
  await calculator.getByRole('button', { name: /^Reset .* to its default values$/u }).click();
  await expect(output).toHaveText(original ?? '');
  await expect(calculator.locator('.sc-calculator__intro')).toContainText('Authored defaults');
  await calculator.locator('select').nth(1).selectOption('Z');
  await expect(calculator.locator('.vg-axis-label--y')).toContainText('Partition value');
});

test('chart exploration and isolation continue after resize and live state changes', async ({ page }) => {
  await page.goto('/ch36-agent-rl-and-distributed-rollout-systems/36-5-asynchrony-and-mismatch/');
  const chart = page.locator('.aw-manuscript [data-responsive-chart="fig-36-29"]');
  await chart.scrollIntoViewIfNeeded();
  await expect(chart).toHaveAttribute('data-chart-ready', 'true');
  const svg = chart.locator('svg.vg-chart__svg');
  const legend = chart.locator('.vg-legend__item');
  await legend.first().click();
  await svg.focus();
  await svg.press('End');
  const before = await chart.locator('.cx-chart-readout').textContent();
  await page.setViewportSize({ width: 700, height: 900 });
  await expect(legend.nth(1)).toHaveAttribute('aria-pressed', 'false');
  await svg.press('ArrowLeft');
  await expect(chart.locator('.cx-chart-readout')).not.toHaveText(before ?? '');
  await page.locator('.aw-manuscript #fig-36-29').evaluate((element) => {
    element.dispatchEvent(
      new CustomEvent('atlas:figure-state', { detail: { figureId: 'fig-36.29', variables: { x: 8 } }, bubbles: true }),
    );
  });
  await expect(chart.locator('.vg-cursor')).toHaveClass(/is-on/u);
  await svg.press('Home');
  await expect(chart.locator('.cx-chart-readout')).toContainText('Version gap');
});

test('series isolation and mobile touch retain exact-value readouts', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/ch36-agent-rl-and-distributed-rollout-systems/36-5-asynchrony-and-mismatch/');
    const chart = page.locator('.aw-manuscript [data-responsive-chart="fig-36-29"]');
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toHaveAttribute('data-chart-ready', 'true');
    const legend = chart.locator('.vg-legend__item');
    await legend.first().click();
    await expect(legend.nth(1)).toHaveAttribute('aria-pressed', 'false');
    await legend.first().click();
    await expect(legend.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await chart.locator('svg.vg-chart__svg').tap({ position: { x: 160, y: 150 } });
    await expect(chart.locator('.cx-chart-readout')).not.toHaveText('Inspect a point for exact coordinates.');
    await expect(chart.locator('.cx-chart-readout')).toContainText('Version gap');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});

test('previous chapters keep their existing figure presentation', async ({ page }) => {
  await page.goto('/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation/');
  await expect(page.locator('.sc-plate, [data-responsive-chart], .sc-sensitivity')).toHaveCount(0);
});

test('long evidence captions wrap and long equations scroll inside the mobile reading width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ch38-inference-time-reasoning-search-and-adaptive-compute/38-6-evaluation-and-economics/');
  const caption = page.locator('.aw-manuscript #fig-38-35 .vg-figure__captext');
  await caption.scrollIntoViewIfNeeded();
  expect(await caption.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  const equation = page.locator('.rb-eq__math').filter({ hasText: 'NOT_ESTIMABLE' });
  await equation.scrollIntoViewIfNeeded();
  expect(await equation.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
  await equation.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  expect(await equation.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('diagram exploration traces real directed paths and pins without moving the readout', async ({ page }) => {
  await page.goto(route);
  const figure = page.locator('.aw-manuscript #fig-33-1');
  await figure.scrollIntoViewIfNeeded();
  const svg = figure.locator('svg.vg-scene');
  await expect(svg).toHaveClass(/is-explorable/u);
  const readout = figure.locator('.vg-explore');
  const height = await readout.evaluate((element) => element.getBoundingClientRect().height);
  await svg.focus();
  for (let at = 0; at < 20; at += 1) {
    await svg.press('ArrowRight');
    if ((await svg.locator('.is-upstream').count()) > 0 && (await svg.locator('.is-downstream').count()) > 0) break;
  }
  expect(await svg.locator('.is-upstream').count()).toBeGreaterThan(0);
  expect(await svg.locator('.is-downstream').count()).toBeGreaterThan(0);
  await svg.press('Enter');
  await expect(readout).toContainText('Pinned');
  expect(await readout.evaluate((element) => element.getBoundingClientRect().height)).toBe(height);
  await svg.press('Escape');
  await expect(svg.locator('.is-hot')).toHaveCount(0);
  expect(await readout.evaluate((element) => element.getBoundingClientRect().height)).toBe(height);
});

test('interaction feedback is user triggered and respects reduced motion and navigation cleanup', async ({
  browser,
}) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    const context = await browser.newContext({ reducedMotion });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(route);
      const calculator = page.locator('.aw-manuscript [data-calculator="fig-33.2"]');
      await calculator.scrollIntoViewIfNeeded();
      const input = calculator.locator('input[type="range"]').nth(1);
      await expect(input).toBeEnabled();
      await expect(calculator).not.toHaveAttribute('data-adjusting', 'true');
      await calculator.evaluate((element) => {
        const observer = new MutationObserver((records) => {
          if (
            records.some((record) => record.attributeName === 'data-adjusting') &&
            element.getAttribute('data-adjusting') === 'true'
          ) {
            element.setAttribute('data-observed-feedback', 'true');
            observer.disconnect();
          }
        });
        observer.observe(element, { attributes: true, attributeFilter: ['data-adjusting'] });
      });
      await input.focus();
      await input.press('End');
      await expect(calculator).toHaveAttribute('data-observed-feedback', 'true');
      const duration = await calculator
        .locator('.vg-calc__value')
        .first()
        .evaluate((element) => getComputedStyle(element).transitionDuration);
      expect(duration).toBe(reducedMotion === 'reduce' ? '0s' : '0.18s');
      await expect(calculator).not.toHaveAttribute('data-adjusting', 'true');
      await input.press('Home');
      await page.goto('/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation/');
      await page.waitForTimeout(250);
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  }
});
