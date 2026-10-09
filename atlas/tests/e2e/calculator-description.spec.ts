import { expect, test, type Locator } from '@playwright/test';

const ROUTE = '/ch12-scalable-data-infrastructure-and-reproducible-ingestion/12-2-transformation-execution/';

// Explicit disclosure screenshots provide evidence without tracing hidden
// duplicate figure subtrees or relying on trace archive streaming.
test.use({ reducedMotion: 'reduce', trace: 'off' });

async function schedulingDescription(description: Locator): Promise<void> {
  await expect(description).toHaveCount(1);
  await expect(description.locator('.katex-display')).toHaveCount(1);
  await expect(description.locator('.katex-mathml math')).toHaveCount(1);
  await expect(description.locator('.katex-error')).toHaveCount(0);
  await expect(description.locator('.vg-calc-description__eqno')).toHaveText('(12.4)');
  await expect(
    description.getByRole('region', { name: 'Equation 12.4', exact: true, includeHidden: true }),
  ).toHaveAttribute('tabindex', '0');
  for (const [symbol, label, value, upper] of [
    ['work', 'total work', '109.000', '10000.000'],
    ['p', 'workers', '10', '256'],
    ['longest', 'longest task', '100.000', '10000.000'],
    ['path', 'critical path', '100.000', '10000.000'],
  ] as const) {
    const row = description.locator(`[data-description-input="${symbol}"]`);
    await expect(row.locator('dt')).toContainText(label);
    await expect(row.locator('code')).toHaveText(symbol);
    await expect(row.locator('.vg-calc-description__value')).toHaveText(value);
    await expect(row.locator('.vg-calc-description__range')).toContainText('Range 1');
    await expect(row.locator('.vg-calc-description__range')).toContainText(upper);
  }
  const result = description.locator('[data-description-output="lower"]');
  await expect(result.locator('dt')).toContainText('lower bound');
  await expect(result.locator('.vg-calc-description__value')).toHaveText('100.000');
  // KaTeX deliberately retains TeX in its hidden MathML annotation. The
  // disclosure's prose and metadata must not show that source as plain text.
  const prose = await description.locator(':scope > p, :scope > dl').allTextContents();
  expect(prose.join(' ')).not.toMatch(/\\(?:ge|max|mathrm|frac|sum|text)\b/u);
}

for (const javaScriptEnabled of [true, false]) {
  test(`calculator disclosures render math, defaults and ranges with JavaScript ${String(javaScriptEnabled)}`, async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({ javaScriptEnabled, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.goto(`http://127.0.0.1:4321${ROUTE}`);
      const overview = page.locator('.aw-visual[data-source-figure="fig-12.6"]');
      const canonical = page.locator('#fig-12-6--inline');
      const rail = page.locator('#fig-12-6--rail');
      await schedulingDescription(rail.locator('.vg-calc-description'));

      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        const disclosure = overview.locator('.aw-visual__details');
        if (!(await disclosure.evaluate((el) => (el as HTMLDetailsElement).open))) {
          await disclosure.locator('summary').click();
        }
        const description = disclosure.locator('.vg-calc-description');
        await expect(description).toBeVisible();
        await schedulingDescription(description);
        await description.screenshot({ path: testInfo.outputPath(`overview-${String(width)}.png`) });

        const canonicalDetails = canonical.locator('.vg-text');
        if (!(await canonicalDetails.evaluate((el) => (el as HTMLDetailsElement).open))) {
          await canonicalDetails.locator('summary').click();
        }
        const inlineDescription = canonicalDetails.locator('.vg-calc-description');
        await expect(inlineDescription).toBeVisible();
        await schedulingDescription(inlineDescription);
        const formula = inlineDescription.getByRole('region', { name: 'Equation 12.4', exact: true });
        await formula.focus();
        await expect(formula).toBeFocused();
        if (width === 390) {
          // This equation fits at its default size. Enlarge the text to check
          // the native scroll path required by readers using text zoom.
          await formula.evaluate((el) => {
            el.style.fontSize = `${String(Number.parseFloat(getComputedStyle(el).fontSize) * 2)}px`;
          });
          expect(await formula.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
          await page.keyboard.press('ArrowRight');
          await expect.poll(() => formula.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          await formula.evaluate((el) => {
            el.style.fontSize = '';
            el.scrollLeft = 0;
          });
          await inlineDescription.screenshot({ path: testInfo.outputPath('inline-mobile.png') });
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      }
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test('a modern preference calculator disclosure describes authored defaults separately from its live state', async ({
  page,
}) => {
  await page.goto('/ch33-direct-preference-optimization-and-related-objectives/33-1-dpo-derivation/');
  const figure = page.locator('.aw-visual[data-source-figure="fig-33.2"]');
  await figure.locator('.aw-visual__details > summary').click();
  const description = figure.locator('.vg-calc-description');
  await expect(description.locator('.katex-display')).toHaveCount(1);
  await expect(description.locator('.katex-mathml math')).toHaveCount(1);
  await expect(description.locator('.vg-calc-description__eqno')).toHaveText('(33.2)');
  await expect(description.locator('[data-description-input="d"] .vg-calc-description__value')).toHaveText('1.000');
  await expect(description.locator('[data-description-output="p"] .vg-calc-description__value')).toHaveText('0.6444');
  await expect(description).toContainText('authored defaults');
});
