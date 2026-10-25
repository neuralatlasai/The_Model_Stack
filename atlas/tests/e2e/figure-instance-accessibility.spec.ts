import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const route = '/ch58-generative-multimodal-models-and-alternative-generation-paths/58-1-generative-representations/';

test('overview and main instruments have distinct landmarks and keyboard-accessible chart overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(route);
  const article = page.locator('article[data-node-id="ms.section.58.1"]');
  for (const calculator of await article.locator('.sc-calculator:visible').all()) {
    await calculator.scrollIntoViewIfNeeded();
    await expect(calculator.locator('input[type="range"]').first()).toBeEnabled();
    await expect(calculator.locator('.sc-sensitivity')).toHaveAccessibleName(
      /Explore the response for Figure 58\.3: .+, (?:main figure|visual overview)/u,
    );
  }
  const overview = article.locator('[data-calculator="fig-auto-overview-fig-58-3"] .vg-calc__tex');
  const canonical = article.locator('#fig-58-3--inline .vg-calc__tex');
  await expect(overview).toHaveAccessibleName(/Equation 58\.3 for Figure 58\.3: .+, visual overview/u);
  await expect(canonical).toHaveAccessibleName(/Equation 58\.3 for Figure 58\.3: .+, main figure/u);
  const chart = article.locator('[data-responsive-chart="fig-58-3--overview-sweep"]');
  await chart.scrollIntoViewIfNeeded();
  await expect(chart).toHaveAttribute('data-chart-ready', 'true');
  // At 390px the hydrated plot can reflow to fit; the original overflow was its SSR-width copy.
  const results = await new AxeBuilder({ page }).include('article[data-node-id="ms.section.58.1"]').analyze();
  expect(results.violations).toEqual([]);
  // Exercise content growth deterministically: the normal hydrated plot reflows to fit.
  // The no-JS test below covers the actual overflowing server-rendered mobile plot.
  const svg = chart.locator('svg.vg-chart__svg');
  await svg.evaluate((element) => {
    element.style.minWidth = '700px';
  });
  await expect.poll(() => chart.evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(true);
  await expect(chart).toHaveAttribute('tabindex', '0');
  await chart.focus();
  await expect(chart).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => chart.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await svg.evaluate((element) => {
    element.style.removeProperty('min-width');
  });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await expect.poll(() => chart.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await expect(chart).not.toHaveAttribute('tabindex');
});

test('calculator narrative annotations track the actual values after edits, reset and authored-state selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ch62-human-preference-model-judges-and-uncertainty/62-1-human-evaluation-design/');
  const figure = page.locator('.aw-manuscript #fig-62-3--inline');
  await figure.scrollIntoViewIfNeeded();
  const correlation = figure.locator('[data-vg-key="rho"] input[type="range"]');
  await expect(correlation).toBeEnabled();
  await expect(correlation).toHaveValue('0.5');
  await expect(figure.locator('[data-vg-state-label]')).toHaveText('Authored defaults');
  const note = figure.locator('[data-vg-state-note]');
  await expect(note).toHaveText('');
  const selectState = async (): Promise<void> => {
    await figure.evaluate((host) => {
      const state = (
        JSON.parse(host.getAttribute('data-states') ?? '[]') as { variables: Record<string, number> }[]
      )[0];
      if (state === undefined) throw new Error('Missing authored state');
      host.dispatchEvent(
        new CustomEvent('atlas:figure-state', {
          bubbles: true,
          detail: { figureId: 'fig-62.3', variables: state.variables, state },
        }),
      );
    });
  };
  await selectState();
  await expect(correlation).toHaveValue('0');
  await expect(figure.locator('[data-vg-state-label]')).toHaveText('Independent repeats');
  const authoredNote = await note.textContent();
  expect(authoredNote?.trim()).not.toBe('');
  await correlation.focus();
  await correlation.press('End');
  await expect(correlation).toHaveValue('1');
  await expect(figure.locator('[data-vg-state-label]')).toHaveText('Custom settings');
  await expect(note).toHaveText('');
  await figure.getByRole('button', { name: /^Reset .* to its default values$/u }).click();
  await expect(correlation).toHaveValue('0.5');
  await expect(figure.locator('[data-vg-state-label]')).toHaveText('Authored defaults');
  await expect(note).toHaveText('');
  await selectState();
  await expect(correlation).toHaveValue('0');
  await expect(figure.locator('[data-vg-state-label]')).toHaveText('Independent repeats');
  await expect(note).toHaveText(authoredNote ?? '');
});

test('server-rendered mobile chart overflow remains keyboard accessible without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto(new URL(route, baseURL).href);
    const chart = page.locator(
      'article[data-node-id="ms.section.58.1"] [data-responsive-chart="fig-58-3--overview-sweep"]',
    );
    await chart.scrollIntoViewIfNeeded();
    expect(await chart.evaluate((element) => element.scrollWidth > element.clientWidth + 1)).toBe(true);
    await expect(chart).toHaveAttribute('tabindex', '0');
    await expect(chart).toHaveAccessibleName(/Scrollable chart for Figure 58\.3: .+, visual overview/u);
    await chart.focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => chart.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    // Axe's script injection requires JavaScript; the JS-on test checks the whole article.
    // Here the server HTML and the browser's native keyboard scroll are the evidence.
  } finally {
    await context.close();
  }
});
