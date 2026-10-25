import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const POLICIES = '/ch54-multi-agent-coordination-and-system-level-evaluation/54-4-coordination-policies/';

test.use({ reducedMotion: 'reduce' });

test('selected recent-search metadata has sufficient contrast across a live light-to-dark switch', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => {
    localStorage.setItem(
      'atlas.recent.v1',
      JSON.stringify([
        {
          nodeId: 'ms.chapter.40',
          url: '/ch40-quantization-from-numerical-model-to-deployable-artifact/',
          title: 'Quantization from numerical model to deployable artifact',
        },
      ]),
    );
  });
  await page.goto(POLICIES);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Search and commands' });
  await expect(dialog.locator('[aria-selected="true"] .cx-palette__type')).toBeVisible();
  const lightBackground = await dialog.evaluate((element) => getComputedStyle(element).backgroundColor);
  expect((await new AxeBuilder({ page }).include('#atlas-palette').analyze()).violations).toEqual([]);
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect
    .poll(() => dialog.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe(lightBackground);
  expect((await new AxeBuilder({ page }).include('#atlas-palette').analyze()).violations).toEqual([]);
});

test('search has a visible close control and restores focus across repeated mobile and desktop opens', async ({
  page,
}) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(POLICIES);
    const trigger = page.getByRole('button', { name: 'Search', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Search and commands' });
    await trigger.click();
    const close = dialog.getByRole('button', { name: 'Close search', exact: true });
    await expect(close).toBeVisible();
    expect(await close.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(
      width === 390 ? 44 : 32,
    );
    await dialog.getByRole('combobox').press('Tab');
    await expect(close).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.click();
    await close.click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('a pending first search clears recent destinations before Enter can activate them', async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    localStorage.setItem(
      'atlas.recent.v1',
      JSON.stringify([
        {
          nodeId: 'ms.chapter.40',
          url: '/ch40-quantization-from-numerical-model-to-deployable-artifact/',
          title: 'Quantization from numerical model to deployable artifact',
        },
      ]),
    );
  });
  let releaseIndex: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    releaseIndex = resolve;
  });
  await page.route('**/search-index.json', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto(POLICIES);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Search and commands' });
    const input = dialog.getByRole('combobox');
    const options = dialog.getByRole('option');
    await expect(options.first()).toContainText('Quantization');
    await input.fill('state consistency');
    await expect(dialog.getByRole('status')).toHaveText('Loading the search index…');
    await expect(options).toHaveCount(0);
    await expect(input).not.toHaveAttribute('aria-activedescendant');
    await input.press('Enter');
    await expect(dialog).toBeVisible();
    expect(new URL(page.url()).pathname).toBe(POLICIES);
    releaseIndex();
    await expect(options.first()).toBeVisible({ timeout: 30_000 });
    const destination = await options.first().getAttribute('href');
    expect(destination).not.toBeNull();
    await input.press('Enter');
    await expect(dialog).not.toBeVisible();
    const expected = new URL(destination ?? '', page.url());
    await expect.poll(() => new URL(page.url()).pathname).toBe(expected.pathname);
  } finally {
    releaseIndex();
  }
});
