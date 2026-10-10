import { test, expect } from '@playwright/test';

test('a citation opens its inspector before the Astro router handles navigation', async ({ page }) => {
  await page.goto('/ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics/');
  await page.waitForFunction(() => (window as Window & { __atlasClient?: boolean }).__atlasClient === true);
  const citation = page.locator('[data-cite="R19.22"]').first();
  await citation.click();
  await expect(page.locator('[data-rail-inspector]')).toBeVisible();
  await expect(page.locator('[data-rail-inspector]')).toContainText('Automatic Mixed Precision examples');
  await expect(page).toHaveURL(/19-2-batch-semantics\//u);
});

test('modified citation clicks remain unprevented and do not open the inspector', async ({ page }) => {
  await page.goto('/ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics/');
  await page.waitForFunction(() => (window as Window & { __atlasClient?: boolean }).__atlasClient === true);
  const citation = page.locator('[data-cite="R19.22"]').first();
  await citation.scrollIntoViewIfNeeded();
  await page.bringToFront();
  const activation = page.evaluate(
    () =>
      new Promise<{ modified: boolean; prevented: boolean }>((resolve) => {
        window.addEventListener(
          'click',
          (event) => {
            queueMicrotask(() => {
              resolve({ modified: event.ctrlKey || event.metaKey, prevented: event.defaultPrevented });
            });
          },
          { once: true },
        );
      }),
  );
  await citation.click({ modifiers: ['ControlOrMeta'] });
  expect(await activation).toEqual({ modified: true, prevented: false });
  await expect(page).toHaveURL(/19-2-batch-semantics\//u);
  await expect(page.locator('[data-rail-inspector]')).toBeHidden();
});

test('middle-click citations open their paper in a native browser tab', async ({ page, context }) => {
  test.setTimeout(60_000);
  await page.goto('/ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics/');
  await page.waitForFunction(() => (window as Window & { __atlasClient?: boolean }).__atlasClient === true);
  const citation = page.locator('[data-cite="R19.22"]').first();
  await citation.scrollIntoViewIfNeeded();
  await page.bringToFront();
  const popup = context.waitForEvent('page', { timeout: 20_000 });
  await citation.click({ button: 'middle' });
  const paper = await popup;
  try {
    // The native background tab can still be compiling its first development
    // request when it is created. Verify the loaded document, not its initial URL.
    await paper.waitForURL(/\/papers\/r19-22\//u, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await expect(paper.locator('[data-paper-page]')).toBeVisible();
    await expect(paper.locator('[data-paper-page] .sh-identity')).toContainText(/\bR19\.22\b/u);
    await expect(paper.getByRole('heading', { level: 1 })).toHaveText('Automatic Mixed Precision examples');
    await expect(page).toHaveURL(/19-2-batch-semantics\//u);
    await expect(page.locator('[data-rail-inspector]')).toBeHidden();
  } finally {
    await paper.close();
  }
});

test('keyboard activation opens the citation inspector', async ({ page }) => {
  await page.goto('/ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics/');
  await page.waitForFunction(() => (window as Window & { __atlasClient?: boolean }).__atlasClient === true);
  await page.locator('[data-cite="R19.22"]').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-rail-inspector]')).toBeVisible();
  await expect(page).toHaveURL(/19-2-batch-semantics\//u);
});
