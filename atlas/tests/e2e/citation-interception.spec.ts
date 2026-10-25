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
        // Observe the committed document's URL and actual DCL completion; the
        // native-tab driver's lifecycle bookkeeping can retain an older loader.
        await paper.waitForFunction(
          (expectedUrl) => {
            const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
            return (
              document.URL === expectedUrl &&
              (document.readyState === 'complete' || (timing?.domContentLoadedEventEnd ?? 0) > 0)
            );
          },
          response.url(),
          { timeout: 20_000 },
        );
        // Native background tabs can retain a stale pending-navigation guard in
        // the driver after the document has committed. Read the actual document
        // in its main world, retaining the same visibility and identity checks.
        await expect
          .poll(() =>
            paper.evaluate(() => {
              const marker = document.querySelector<HTMLElement>('[data-paper-page]');
              const bounds = marker?.getBoundingClientRect();
              const style = marker === null ? null : getComputedStyle(marker);
              return {
                url: document.URL,
                committed: document.readyState === 'interactive' || document.readyState === 'complete',
                visible:
                  bounds !== undefined &&
                  bounds.width > 0 &&
                  bounds.height > 0 &&
                  style?.visibility !== 'hidden' &&
                  style?.display !== 'none',
                identity: marker?.querySelector('.sh-identity')?.textContent,
                title: marker?.querySelector('h1')?.textContent?.replace(/\s+/gu, ' ').trim(),
              };
            }),
          )
          .toMatchObject({
            url: response.url(),
            committed: true,
            visible: true,
            identity: expect.stringMatching(/\bR19\.22\b/u),
            title: 'Automatic Mixed Precision examples',
          });
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
