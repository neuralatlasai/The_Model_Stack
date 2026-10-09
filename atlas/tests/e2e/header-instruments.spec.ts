import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });
for (const route of [
  'library',
  'papers',
  'systems',
  'labs',
  'figures',
  'equations',
  'evaluation-ecosystem',
  'ai-futures',
  'graph',
  'timeline',
  'terms',
  'compare',
  'visual-grammar',
]) {
  test(`${route} illustration supports motion controls and keyboard exploration`, async ({ page }) => {
    // Allow the full catalogue to render through all interaction and resize steps on shared CI workers.
    if (route === 'equations') test.setTimeout(60_000);
    await page.goto(`/${route}/`);
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
    await visual.locator('.hi-stage').focus();
    await page.keyboard.press('ArrowRight');
    await expect(visual).toHaveAttribute('data-control', '0.25');
    await page.mouse.click(explore.x + explore.width / 2, explore.y + explore.height / 2);
    await expect(visual).toHaveAttribute('data-expanded', 'true');
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
