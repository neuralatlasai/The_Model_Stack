import { expect, test } from '@playwright/test';

const PHASES = '/ch42-prefill-decode-kv-state-and-inference-resource-models/42-1-phase-decomposition/';
const POLICIES = '/ch54-multi-agent-coordination-and-system-level-evaluation/54-4-coordination-policies/';
const CHAPTER = '[data-tree-node="ms.chapter.40"]';
const FIRST = '[data-tree-node="ms.section.40.1"]';

test.use({ reducedMotion: 'reduce' });

test('deferred chapter children preserve keyboard order and the destination SSR current branch', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(PHASES);
  await page.getByRole('button', { name: 'Knowledge tree', exact: true }).click();
  const tree = page.locator('#knowledge-tree');
  await expect(tree.locator(FIRST)).toHaveCount(0);
  const chapter = tree.locator(CHAPTER);
  await chapter.focus();
  await chapter.press('ArrowRight');
  await expect(tree.locator(FIRST)).toBeVisible();
  await chapter.press('ArrowRight');
  await expect(tree.locator(FIRST)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const second = tree.locator('[data-tree-node="ms.section.40.2"]');
  await expect(second).toBeFocused();
  await page.keyboard.press('Enter');
  await page.waitForURL(/40-2-quantization-targets\//u);
  await page.getByRole('button', { name: 'Knowledge tree', exact: true }).click();
  await expect(tree.locator('[aria-current="page"]')).toHaveAttribute('data-tree-node', 'ms.section.40.2');
  await expect(tree.locator(CHAPTER)).toHaveAttribute('aria-expanded', 'true');
  await expect(tree.locator('[data-tree-node^="ms.section.40."]')).toHaveCount(6);
  await expect(tree.locator('[data-tree-node^="ms.section.42."]')).toHaveCount(0);
  // A user-expanded chapter is restored after a fresh entry elsewhere; its
  // children are still fetched only on that restored expansion.
  await page.goto(PHASES);
  await page.getByRole('button', { name: 'Knowledge tree', exact: true }).click();
  await expect(tree.locator(CHAPTER)).toHaveAttribute('aria-expanded', 'true');
  await expect(tree.locator(FIRST)).toBeVisible();
});

test('a failed chapter index can retry while its chapter link remains available', async ({ page }) => {
  let requests = 0;
  await page.route('**/tree-children/40.json', async (route) => {
    requests += 1;
    if (requests === 1) await route.fulfill({ status: 503, body: 'unavailable' });
    else await route.continue();
  });
  await page.goto(PHASES);
  await page.getByRole('button', { name: 'Knowledge tree', exact: true }).click();
  const tree = page.locator('#knowledge-tree');
  const chapter = tree.locator(CHAPTER);
  await chapter.focus();
  await chapter.press('ArrowRight');
  await expect(tree.getByRole('status')).toContainText('Collapse and expand to retry');
  await expect(chapter).toHaveAttribute('href', '/ch40-quantization-from-numerical-model-to-deployable-artifact/');
  await chapter.press('ArrowLeft');
  await chapter.press('ArrowRight');
  await expect(tree.locator(FIRST)).toBeVisible();
  expect(requests).toBe(2);
  await expect(chapter).toBeFocused();
});

test('restored expansion paints stored progress on children loaded after initialization', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('atlas.tree-expanded.v1', JSON.stringify(['ms.chapter.40']));
    localStorage.setItem(
      'atlas.progress.v1',
      JSON.stringify({
        'ms.section.40.1': { max: 0.75, anchor: 'scope', at: '2026-10-25T00:00:00Z' },
      }),
    );
  });
  await page.goto(PHASES);
  await page.getByRole('button', { name: 'Knowledge tree', exact: true }).click();
  const item = page.locator('#knowledge-tree').locator(FIRST);
  await expect(item).toBeVisible();
  await expect.poll(() => item.evaluate((element) => element.style.getPropertyValue('--progress'))).toBe('0.750');
});

test('route disposal aborts an old branch request and a new page can load the same branch', async ({ page }) => {
  let releaseOld: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    releaseOld = resolve;
  });
  let requests = 0;
  const failures: string[] = [];
  page.on('requestfailed', (request) => {
    if (request.url().endsWith('/tree-children/40.json')) failures.push(request.failure()?.errorText ?? '');
  });
  await page.route('**/tree-children/40.json', async (route) => {
    requests += 1;
    if (requests === 1) await gate;
    try {
      await route.continue();
    } catch {
      /* The old page intentionally aborts its fetch. */
    }
  });
  try {
    await page.goto(PHASES);
    await page.getByRole('button', { name: 'Knowledge tree', exact: true }).click();
    const tree = page.locator('#knowledge-tree');
    await tree.locator(CHAPTER).focus();
    await tree.locator(CHAPTER).press('ArrowRight');
    await expect(tree.getByRole('status')).toHaveText('Loading sections…');
    await tree.locator('[data-tree-node="ms.section.42.2"]').click();
    await page.waitForURL(/42-2-state-accounting\//u);
    await page.getByRole('button', { name: 'Knowledge tree', exact: true }).click();
    await expect(tree.locator(FIRST)).toBeVisible();
    releaseOld();
    await expect.poll(() => failures.length).toBeGreaterThan(0);
    await expect(tree.locator(FIRST)).toHaveCount(1);
    await expect(tree.locator('[aria-current="page"]')).toHaveAttribute('data-tree-node', 'ms.section.42.2');
  } finally {
    releaseOld();
  }
});

test('without JavaScript every chapter and the current chapter sections remain navigable', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(PHASES);
    await page.getByRole('button', { name: 'Knowledge tree', exact: true }).click();
    const tree = page.locator('#knowledge-tree');
    const fallback = tree.locator('[data-tree-fallback]');
    await expect(fallback).toBeVisible();
    await expect(fallback.locator('[data-fallback-chapter]')).toHaveCount(66);
    await expect(fallback.locator('[data-fallback-chapter="ms.chapter.1"]')).toBeVisible();
    const next = fallback.getByRole('link', { name: /^42\.2 /u });
    await expect(next).toBeVisible();
    await next.click();
    await page.waitForURL(/42-2-state-accounting\//u);
    await page.getByRole('button', { name: 'Knowledge tree', exact: true }).click();
    await expect(tree.locator('[data-tree-fallback] [aria-current="page"]')).toHaveText(/^42\.2 /u);
  } finally {
    await context.close();
  }
});

test('mobile citation inspection brings its title into the panel without moving the manuscript', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(POLICIES);
  const citation = page.locator('a[data-cite="R54.6"]').first();
  await citation.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  await citation.click();
  const inspector = page.locator('[data-rail-inspector]');
  await expect(inspector).toBeVisible();
  const title = inspector.locator('.cx-insp__title');
  await expect(title).toBeFocused();
  await expect
    .poll(() =>
      title.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.top >= 0 && bounds.bottom <= innerHeight;
      }),
    )
    .toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(before);
  await inspector.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(citation).toBeFocused();
});

test('deferred popover focus preserves a warm inspector title handoff', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(POLICIES);
  const citation = page.locator('a[data-cite="R54.6"]').first();
  await citation.click();
  const inspector = page.locator('[data-rail-inspector]');
  await expect(inspector).toBeVisible();
  await inspector.getByRole('button', { name: 'Close', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#context-rail')).toBeHidden();
  await citation.click();
  await expect(inspector.locator('.cx-insp__title')).toBeFocused();

  // Reproduce the exact ordering without racing the dynamic import against the
  // browser's toggle task: content has handed off focus before the opening
  // callback's animation frame executes. The real popover remains open.
  const preserved = await page.locator('#context-rail').evaluate(async (panel) => {
    if (!panel.matches(':popover-open')) throw new Error('The native context popover must be open');
    const heading = panel.querySelector<HTMLElement>('#atlas-inspector-title');
    if (heading === null) throw new Error('The warm inspector title must be rendered');
    heading.focus({ preventScroll: true });
    panel.dispatchEvent(new ToggleEvent('toggle', { oldState: 'closed', newState: 'open' }));
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
    return document.activeElement === heading;
  });
  expect(preserved).toBe(true);
  await expect(inspector.locator('.cx-insp__title')).toBeFocused();
  await inspector.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(citation).toBeFocused();
});
