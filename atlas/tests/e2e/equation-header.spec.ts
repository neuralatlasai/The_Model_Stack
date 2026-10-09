import { expect, test } from '@playwright/test';

// Trace snapshots repeatedly serialize the equation catalogue's very large DOM.
// A separate file keeps this worker-scoped option local to the equation route.
test.use({ reducedMotion: 'reduce', trace: 'off' });

test('equations illustration supports motion controls and keyboard exploration', async ({ page }) => {
  // Allow the full catalogue to render through all interaction and resize steps on shared CI workers.
  test.setTimeout(60_000);
  await page.goto('/equations/');
  const visual = page.locator('.hi');
  await expect(visual).toBeVisible();
  await expect(page.locator('astro-island').filter({ has: visual })).not.toHaveAttribute('ssr', '');
  await expect(visual).toHaveAttribute('data-playing', 'false');
  const play = await visual.locator('.hi-toggle').boundingBox();
  const explore = await visual.locator('.hi-explore').boundingBox();
  if (play === null || explore === null) throw new Error('Illustration controls are missing');
  await page.mouse.click(play.x + play.width / 2, play.y + play.height / 2);
  await expect(visual).toHaveAttribute('data-playing', 'true');
  await page.mouse.click(play.x + play.width / 2, play.y + play.height / 2);
  await expect(visual).toHaveAttribute('data-playing', 'false');
  await expect
    .poll(() =>
      visual.evaluate((el) =>
        [...el.querySelectorAll('*')]
          .filter((node) => getComputedStyle(node).animationName !== 'none')
          .every((node) => getComputedStyle(node).animationPlayState === 'paused'),
      ),
    )
    .toBe(true);
  await visual.locator('.hi-stage').focus();
  await page.keyboard.press('ArrowRight');
  await expect(visual).toHaveAttribute('data-control', '0.25');
  await page.mouse.click(explore.x + explore.width / 2, explore.y + explore.height / 2);
  await expect(visual).toHaveAttribute('data-expanded', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
