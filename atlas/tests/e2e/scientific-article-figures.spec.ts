import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PHASES = '/ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition/';
const POLICIES = '/ch54-multi-agent-coordination-and-system-level-evaluation/54-4-coordination-policies/';

test.use({ reducedMotion: 'reduce' });

for (const width of [1440, 390]) {
  test(
    'new article calculators support exact values, native keys, validation and reset at ' + String(width) + 'px',
    async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(PHASES);
      const overview = page.locator('.aw-visual[data-source-figure="fig-42.3"]');
      const canonical = page.locator('#fig-42-3--inline');
      await expect(overview).toHaveClass(/sc-plate/u);
      await expect(canonical.locator('.sc-sensitivity')).toHaveCount(1);
      await overview.scrollIntoViewIfNeeded();
      await expect(overview.locator('.sc-sensitivity')).toBeVisible();
      const exact = overview.getByRole('spinbutton', { name: 'Exact value: Prompt tokens', exact: true });
      const field = overview.locator('.vg-calc__field[data-vg-key="Sp"]');
      const range = field.getByRole('slider');
      await exact.fill('12345');
      await exact.press('Tab');
      await expect(exact).toHaveValue('12345');
      await expect(range).toHaveValue('12345');
      await expect(field.locator('[data-vg-value="Sp"]')).toHaveText('12,345');
      await range.focus();
      await range.press('ArrowRight');
      await expect(exact).toHaveValue('12346');
      await expect(range).toHaveAttribute('aria-valuetext', '12,346');
      await overview.getByRole('button', { name: /Reset .* to its default values/u }).click();
      await expect(exact).toHaveValue('2048');
      await expect(range).toHaveValue('2048');
      for (const invalid of ['0', '131073', '2.5', '']) {
        await exact.fill(invalid);
        await exact.press('Tab');
        expect(await exact.evaluate((element) => (element as HTMLInputElement).validity.valid)).toBe(false);
        await expect(field.locator('.vg-calc__exact-help')).toBeVisible();
        await expect(field.locator('[data-vg-value="Sp"]')).toHaveText('2,048');
      }
      const reset = overview.getByRole('button', { name: /Reset .* to its default values/u });
      await expect(reset).toBeEnabled();
      await reset.click();
      await expect(exact).toHaveValue('2048');
      await expect(field.locator('.vg-calc__exact-help')).toBeHidden();
      await exact.fill('0');
      const heads = overview.getByRole('spinbutton', { name: 'Exact value: Query heads', exact: true });
      await heads.fill('64');
      await heads.press('Tab');
      await expect(exact).toHaveValue('0');
      await reset.click();
      await expect(exact).toHaveValue('2048');
      await expect(heads).toHaveValue('32');
      await exact.fill('');
      await exact.press('Escape');
      await expect(exact).toHaveValue('2048');
      await exact.fill('2048');
      await exact.press('Tab');
      expect(await exact.evaluate((element) => (element as HTMLInputElement).validity.valid)).toBe(true);
      expect(await range.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(
        width === 390 ? 44 : 32,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await overview.screenshot({ path: testInfo.outputPath(`calculator-${String(width)}.png`) });
      expect(errors).toEqual([]);
      const accessibility = await new AxeBuilder({ page })
        .include('.aw-visual[data-source-figure="fig-42.3"]')
        .analyze();
      expect(accessibility.violations).toEqual([]);
    },
  );
}

test('coordination calculator retains decimals and selectable response dimensions', async ({ page }) => {
  await page.goto(POLICIES);
  const figure = page.locator('.aw-visual[data-source-figure="fig-54.12"]');
  await figure.scrollIntoViewIfNeeded();
  const exact = figure.getByRole('spinbutton', { name: 'Exact value: Initial correctness probability', exact: true });
  await exact.fill('0.6');
  await exact.press('Enter');
  await expect(exact).toHaveValue('0.6');
  await expect(figure.locator('[data-vg-value="delta"]')).toContainText('14');
  await figure.getByRole('combobox', { name: 'Vary', exact: true }).selectOption('corr');
  await figure.getByRole('combobox', { name: 'Observe', exact: true }).selectOption('after');
  await expect(figure.getByRole('img', { name: /Sensitivity of after to corr/u })).toBeVisible();
  await expect(figure.locator('.sc-sensitivity__note')).toContainText('remaining controls held fixed');
  await page.goto('/ch51-tool-use-protocol-interfaces-and-reliable-execution/51-4-execution-correctness/');
  const percent = page.locator('.aw-visual[data-source-figure="fig-51.12"]');
  await percent.scrollIntoViewIfNeeded();
  const probability = percent.getByRole('spinbutton', { name: 'Exact value: One-task iid trial success', exact: true });
  await expect(percent.locator('.vg-calc__exact-help--units')).toContainText('0.5 represents 50%');
  await expect(percent.locator('.vg-calc__exact-help--units')).toBeVisible();
  await probability.fill('0.5');
  await probability.press('Enter');
  await expect(probability).toHaveValue('0.5');
  await expect(percent.locator('[data-vg-value="p"]')).toContainText('50');
});

test('new article figures preserve rendered defaults and accessible math without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(PHASES);
    const figure = page.locator('.aw-visual[data-source-figure="fig-42.3"]');
    await expect(figure.locator('.vg-calc__tex .katex-mathml math')).toHaveCount(1);
    for (const control of await figure.locator('input, select, button').all()) await expect(control).toBeDisabled();
    const staticNote = figure.locator('noscript .cx-calc__note');
    await expect(staticNote).toBeVisible();
    await expect(staticNote).toContainText('Authored default values are shown. Enable JavaScript');

    await figure.locator('.aw-visual__details > summary').click();
    await expect(figure.locator('.vg-calc-description')).toContainText('authored defaults');
    await expect(figure.locator('[data-description-input="Sp"] .vg-calc-description__value')).toHaveText('2,048');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    await context.close();
  }
});

for (const javaScriptEnabled of [true, false]) {
  test(
    'mobile diagrams preserve readable scale and native scrolling with JavaScript ' + String(javaScriptEnabled),
    async ({ browser }, testInfo) => {
      const context = await browser.newContext({
        javaScriptEnabled,
        viewport: { width: 390, height: 844 },
        reducedMotion: 'reduce',
      });
      try {
        const page = await context.newPage();
        for (const [route, id] of [
          ['/ch55-vision-language-models-and-document-intelligence/55-4-document-structure/', 'fig-55-12'],
          ['/ch56-audio-speech-and-real-time-interaction/56-4-streaming-interaction/', 'fig-56-12'],
          ['/ch57-video-temporal-reasoning-and-streaming-multimodality/57-4-streaming-inference/', 'fig-57-13'],
          ['/ch33-direct-preference-optimization-and-related-objectives/33-1-dpo-derivation/', 'fig-33-1'],
        ] as const) {
          await page.goto(route);
          const figure = page.locator('.aw-manuscript #' + id);
          await figure.scrollIntoViewIfNeeded();
          const image = figure.locator('svg.vg-scene');
          const viewport = figure.locator('.vg-scroll');
          await expect
            .poll(() =>
              image.evaluate((element) =>
                element instanceof SVGSVGElement
                  ? element.getBoundingClientRect().width / element.viewBox.baseVal.width
                  : 0,
              ),
            )
            .toBeGreaterThanOrEqual(0.79);
          expect(await viewport.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
          await viewport.focus();
          const before = await viewport.evaluate((element) => element.scrollLeft);
          await viewport.press('ArrowRight');
          await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await figure.screenshot({ path: testInfo.outputPath(id + '-mobile.png') });
        }
      } finally {
        await context.close();
      }
    },
  );
}

test('terminal numeric plot labels remain inside the rendered mobile SVG', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [route, id] of [
    ['/ch55-vision-language-models-and-document-intelligence/55-4-document-structure/', 'fig-55-14'],
    ['/ch57-video-temporal-reasoning-and-streaming-multimodality/57-4-streaming-inference/', 'fig-57-12'],
    ['/ch33-direct-preference-optimization-and-related-objectives/33-1-dpo-derivation/', 'fig-33-2'],
  ] as const) {
    await page.goto(route);
    const figure = page.locator('.aw-manuscript #' + id);
    await figure.scrollIntoViewIfNeeded();
    await expect(figure.locator('.sc-sensitivity .sc-chart')).toHaveAttribute('data-chart-ready', 'true');
    const image = figure.locator('.sc-sensitivity svg.vg-chart__svg');
    await expect(image).toBeVisible();
    const bounds = await image.evaluate((element) => {
      const frame = element.getBoundingClientRect();
      return [...element.querySelectorAll('.vg-tick')].map((tick) => {
        const label = tick.getBoundingClientRect();
        return {
          text: tick.textContent,
          left: label.left - frame.left,
          right: label.right - frame.right,
          labelRight: label.right - frame.left,
          xAxis: tick.parentElement?.tagName.toLowerCase() === 'g',
        };
      });
    });
    expect(bounds.length).toBeGreaterThan(3);
    for (const tick of bounds) {
      expect(tick.left, tick.text).toBeGreaterThanOrEqual(-0.5);
      expect(tick.right, tick.text).toBeLessThanOrEqual(0.5);
    }
    const horizontal = bounds.filter((tick) => tick.xAxis);
    for (const [index, tick] of horizontal.entries()) {
      const previous = horizontal[index - 1];
      if (previous !== undefined) expect(tick.left).toBeGreaterThanOrEqual(previous.labelRight - 0.5);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
