import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });
for (const route of [
  'library',
  'papers',
  'systems',
  'labs',
  'figures',
  'evaluation-ecosystem',
  'ai-futures',
  'graph',
  'timeline',
  'terms',
  'compare',
  'visual-grammar',
]) {
  test.describe(`${route} header`, () => {
    test(`${route} illustration supports motion controls and keyboard exploration`, async ({ page }) => {
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
  });
}

test('graph emphasis is one connected directed prerequisite path', async ({ page }) => {
  await page.goto('/graph/');
  const visual = page.locator('.hi');
  await expect(page.locator('astro-island').filter({ has: visual })).not.toHaveAttribute('ssr', '');
  const stage = visual.locator('.hi-stage');
  const fingerprints: string[] = [];
  for (const presses of [
    [],
    ['ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowLeft'],
    ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowRight'],
  ]) {
    await stage.focus();
    await page.keyboard.press('Home');
    for (const key of presses) await page.keyboard.press(key);
    const result = await visual.evaluate((el) => {
      const edges = [...el.querySelectorAll('path[data-highlighted="true"]')].map((node) => [
        Number(node.getAttribute('data-edge-from')),
        Number(node.getAttribute('data-edge-to')),
      ]);
      const nodes = [...el.querySelectorAll('circle[data-highlighted="true"]')]
        .map((node) => Number(node.getAttribute('data-node')))
        .sort((a, b) => a - b);
      const sources = edges.map(([from]) => from).filter((from) => !edges.some(([, to]) => to === from));
      let current = sources[0];
      const visited: number[] = [];
      while (current !== undefined && !visited.includes(current)) {
        visited.push(current);
        const outgoing = edges.filter(([from]) => from === current);
        if (outgoing.length > 1) return { valid: false, fingerprint: '' };
        current = outgoing[0]?.[1];
      }
      return {
        valid:
          sources.length === 1 &&
          edges.length === visited.length - 1 &&
          JSON.stringify(nodes) === JSON.stringify([...visited].sort((a, b) => a - b)),
        fingerprint: JSON.stringify(edges),
      };
    });
    expect(result.valid).toBe(true);
    fingerprints.push(result.fingerprint);
  }
  expect(new Set(fingerprints).size).toBe(3);
});

test('visual grammar keyboard exploration changes drawn geometry and resets it', async ({ page }) => {
  await page.goto('/visual-grammar/');
  const visual = page.locator('.hi');
  await expect(page.locator('astro-island').filter({ has: visual })).not.toHaveAttribute('ssr', '');
  const artwork = visual.locator('.hi-art');
  const before = await artwork.innerHTML();
  await visual.locator('.hi-stage').focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => artwork.innerHTML()).not.toBe(before);
  await visual.getByRole('button', { name: /^Reset / }).click();
  await expect.poll(() => artwork.innerHTML()).toBe(before);
});

for (const [family, routes] of [
  ['papers', ['/papers/p01/', '/papers/p02/']],
  ['systems', ['/systems/pytorch/', '/systems/vllm/']],
  ['labs', ['/labs/openai/', '/labs/anthropic/']],
  ['graph', ['/graph/ch01-foundation-model-lifecycle/', '/graph/ch02-mathematical-and-statistical-foundations/']],
] as const) {
  test(`${family} detail drawings encode actual object context and distinct identifiers`, async ({ page }) => {
    const drawings: string[] = [];
    const seals: string[] = [];
    for (const route of routes) {
      await page.goto(route);
      const visual = page.locator('.hi');
      await expect(page.locator('astro-island').filter({ has: visual })).not.toHaveAttribute('ssr', '');
      await expect(visual).toHaveAttribute('data-object-id', /.+/);
      const seal = visual.locator('[data-identity-seal]');
      await expect(seal).toHaveAttribute('d', /^M/);
      const art = visual.locator('.hi-art');
      const drawing = async (): Promise<string> =>
        art.evaluate((el) =>
          JSON.stringify(
            [...el.querySelectorAll('g,path,circle')].map((node) => [
              node.tagName,
              [...node.attributes]
                .filter((attribute) => attribute.value !== '')
                .map((attribute) => [attribute.name, attribute.value])
                .sort((a, b) => (a[0] ?? '').localeCompare(b[0] ?? '')),
            ]),
          ),
        );
      const before = await drawing();
      await visual.locator('.hi-stage').focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await visual.getByRole('button', { name: /^Reset / }).click();
      await expect.poll(drawing).toBe(before);
      const footprint = visual.locator('[data-chapter-count]');
      await expect(footprint).toHaveCount(11);
      drawings.push(
        await art.locator('path').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('d')).join('|')),
      );
      seals.push((await seal.getAttribute('d')) ?? '');
    }
    expect(drawings[0]).not.toBe(drawings[1]);
    expect(seals[0]).not.toBe(seals[1]);
  });
}
