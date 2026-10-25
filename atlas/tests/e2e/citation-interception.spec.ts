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

test.describe('native citation tabs', () => {
  // Each case selects a native tab; keep those foreground journeys in order.
  test.describe.configure({ mode: 'serial' });
  for (const delayed of [false, true]) {
    const condition = delayed ? ' when the paper document response is held' : '';
    test('middle-click citations open their paper in a native browser tab' + condition, async ({ page, context }) => {
      test.setTimeout(60_000);
      await page.goto('/ch19-pretraining-objectives-and-the-full-training-loop/19-2-batch-semantics/');
      await page.waitForFunction(() => (window as Window & { __atlasClient?: boolean }).__atlasClient === true);
      const citation = page.locator('[data-cite="R19.22"]').first();
      await citation.scrollIntoViewIfNeeded();
      await page.bringToFront();

      const { promise: requestHeld, resolve: documentRequested } = Promise.withResolvers<undefined>();
      const { promise: release, resolve: releaseDocument } = Promise.withResolvers<undefined>();
      if (delayed) {
        await context.route('**/papers/r19-22/', async (route) => {
          documentRequested(undefined);
          await release;
          await route.continue();
        });
      }

      // Listen before native activation: a new background tab can expose its URL
      // before the requested document has arrived. Bind readiness to its response.
      let responseReceived = false;
      const documentResponse = context
        .waitForEvent('response', {
          predicate: (response) =>
            response.request().isNavigationRequest() &&
            response.request().resourceType() === 'document' &&
            new URL(response.url()).pathname === '/papers/r19-22/',
          timeout: 20_000,
        })
        .then((response) => {
          responseReceived = true;
          return response;
        });
      const popup = context.waitForEvent('page', { timeout: 20_000 });
      const activation = citation.click({ button: 'middle' });
      if (delayed) {
        await requestHeld;
        expect(responseReceived).toBe(false);
        // Chromium may expose the popup only once its first response starts.
        // Release before awaiting that event; no document inspection can run yet.
        releaseDocument(undefined);
      }
      await activation;
      const paper = await popup;
      try {
        // Selecting the native tab is part of the reader's journey.
        await paper.bringToFront();
        const response = await documentResponse;
        expect(response.frame().page()).toBe(paper);
        expect(response.ok()).toBe(true);
        expect(await response.finished()).toBeNull();
        await paper.waitForURL(/\/papers\/r19-22\//u, { waitUntil: 'domcontentloaded', timeout: 20_000 });
        await expect(paper.locator('[data-paper-page]')).toBeVisible();
        await expect(paper.locator('[data-paper-page] .sh-identity')).toContainText(/\bR19\.22\b/u);
        await expect(paper.getByRole('heading', { level: 1 })).toHaveText('Automatic Mixed Precision examples');
        await expect(page).toHaveURL(/19-2-batch-semantics\//u);
        await expect(page.locator('[data-rail-inspector]')).toBeHidden();
      } finally {
        releaseDocument(undefined);
        await paper.close();
      }
    });
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
