import { expect, test } from '@playwright/test';

const chapters = [
  ['25', 'ch25-accelerators-memory-hierarchy-and-performance-models', '25-1-accelerator-organization'],
  ['26', 'ch26-kernel-programming-and-numerical-equivalence', '26-1-execution-primitives'],
  ['27', 'ch27-attention-latent-attention-and-expert-kernels', '27-1-io-aware-attention'],
  ['28', 'ch28-frameworks-graph-compilers-and-runtime-integration', '28-1-framework-semantics'],
  ['29', 'ch29-parallelism-collectives-and-distributed-optimization', '29-1-data-state-parallelism'],
] as const;

test.use({ reducedMotion: 'reduce' });

for (const [number, chapter, section] of chapters) {
  test(`chapter ${number} equations remain readable on desktop and mobile`, async ({ page }) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${chapter}/${section}/`);
      const equations = page.locator('article .rb-eq__math');
      expect(await equations.count()).toBeGreaterThan(0);
      for (const equation of await equations.all()) {
        await expect(equation).toHaveCSS('font-size', width === 390 ? '18px' : '20px');
        await expect(equation.locator('.katex-html')).toHaveCount(1);
        await expect(equation.locator('.katex-mathml math')).toHaveCount(1);
      }
      await expect(page.locator('.katex-error')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 390) {
        // Check the first overflowing expression rather than assuming a particular formula is long.
        for (const equation of await equations.all()) {
          if (!(await equation.evaluate((element) => element.scrollWidth > element.clientWidth + 1))) continue;
          await equation.focus();
          await page.keyboard.press('ArrowRight');
          await expect.poll(() => equation.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
          break;
        }
      }
    }
  });
}

test('a wide calculator equation retains its full expression and keyboard scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ch29-parallelism-collectives-and-distributed-optimization/29-2-tensor-and-pipeline-parallelism/');
  const equation = page.locator('.vg-calc__tex').first();
  await expect(equation).toHaveCSS('font-size', '18px');
  await expect(equation.locator('.katex-mathml math')).toHaveCount(1);
  await equation.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => equation.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mobile Context closes after navigating to a chapter outline target', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ch28-frameworks-graph-compilers-and-runtime-integration/');
  await page.getByRole('button', { name: 'Context', exact: true }).click();
  const panel = page.locator('#context-rail');
  await expect(panel).toHaveJSProperty('popover', 'auto');
  const link = panel.getByRole('link', { name: /Concept map/u }).first();
  const href = await link.getAttribute('href');
  if (href?.startsWith('#') !== true) throw new Error('Missing local concept-map target');
  await link.click();
  await expect.poll(() => panel.evaluate((element) => element.matches(':popover-open'))).toBe(false);
  await expect(page.locator(href)).toBeFocused();
});

test('mobile verification keeps artifact filenames readable inside its table', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ch26-kernel-programming-and-numerical-equivalence/verification/');
  const filename = page.locator('.rb-table code').filter({ hasText: /^operator-contract\.json$/u });
  await expect(filename).toHaveCSS('white-space', 'nowrap');
  expect(await filename.evaluate((element) => element.getClientRects().length)).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
