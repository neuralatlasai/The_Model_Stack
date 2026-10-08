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

test('modified citation clicks retain their native new-tab behavior', async ({ page, context }) => {
  await page.goto('/ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics/');
  await page.waitForFunction(() => (window as Window & { __atlasClient?: boolean }).__atlasClient === true);
  const popup = context.waitForEvent('page');
  await page
    .locator('[data-cite="R19.22"]')
    .first()
    .click({ modifiers: ['ControlOrMeta'] });
  const paper = await popup;
  await expect(paper).toHaveURL(/\/papers\/r19-22\//u);
  await expect(page.locator('[data-rail-inspector]')).toBeHidden();
  await paper.close();
});

test('keyboard activation opens the citation inspector', async ({ page }) => {
  await page.goto('/ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics/');
  await page.waitForFunction(() => (window as Window & { __atlasClient?: boolean }).__atlasClient === true);
  await page.locator('[data-cite="R19.22"]').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-rail-inspector]')).toBeVisible();
  await expect(page).toHaveURL(/19-2-batch-semantics\//u);
});
