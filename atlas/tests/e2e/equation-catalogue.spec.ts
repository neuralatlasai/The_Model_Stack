import { expect, test } from '@playwright/test';

// Serializing every KaTeX subtree into a trace is substantially more expensive
// than these interactions; verify the real route without DOM snapshot capture.
test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 1000 }, trace: 'off' });

test('equation catalogue stays within the viewport after search, scroll and mobile resize', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/equations/?depth=overview');
  await expect(page.locator('[data-equations-explorer]')).toHaveClass(/is-enhanced/);
  await page.evaluate(() => document.fonts.ready);
  const total = await page.locator('[data-eqx-row]').count();
  const all = `${String(total)} of ${String(total)}`;

  const visual = page.locator('.hi');
  await expect(page.locator('astro-island').filter({ has: visual })).not.toHaveAttribute('ssr', '');
  await visual.locator('.hi-stage').focus();
  await page.keyboard.press('ArrowRight');
  await expect(visual).toHaveAttribute('data-control', '0.25');
  await page.keyboard.press('Home');
  await expect(visual).toHaveAttribute('data-control', '0');
  await visual.locator('.hi-stage').click();
  await expect(visual).toHaveAttribute('data-expanded', 'true');

  await page.setViewportSize({ width: 390, height: 844 });
  const search = page.locator('[data-eqx-search]');
  await search.fill('temperature');
  await expect(page.locator('[data-eqx-shown]')).not.toHaveText(all);
  await search.fill('');
  await expect(page.locator('[data-eqx-shown]')).toHaveText(all);
  // Enter the deferred catalogue before growing the viewport: resizing at the
  // page top alone does not reproduce its stale offscreen overflow geometry.
  await page.locator('.eqx-index').scrollIntoViewIfNeeded();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);

  await page.setViewportSize({ width: 390, height: 844 });
  const row = page.locator('[data-eqx-row="23.9"]');
  await row.scrollIntoViewIfNeeded();
  const formula = row.locator('.eqx-row__math');
  await expect(formula.locator('.katex-mathml math')).toHaveCount(1);
  expect(await formula.locator('annotation[encoding="application/x-tex"]').textContent()).toContain('InitOptimizer');
  expect(await formula.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  await formula.focus();
  await expect(formula).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => formula.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await row.locator('.eqx-row__num a').focus();
  await expect(row.getByRole('link', { name: /^Equation 23\.9,/ })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test('equation catalogue retains complete semantic math and scrolling without JavaScript', async ({ browser }) => {
  test.setTimeout(60_000);
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/equations/');
  const row = page.locator('[data-eqx-row="23.9"]');
  await row.scrollIntoViewIfNeeded();
  const formula = row.locator('.eqx-row__math');
  await expect(formula.locator('.katex-mathml math')).toHaveCount(1);
  expect(await formula.locator('annotation[encoding="application/x-tex"]').textContent()).toContain('InitOptimizer');
  await formula.focus();
  await expect(formula).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => formula.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await context.close();
});
