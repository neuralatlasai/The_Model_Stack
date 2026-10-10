import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'reduce', trace: 'off' });

test('manuscript curve selects the matching brain region, prerequisites and chapter links', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-brain]')).toHaveAttribute('data-brain-ready', 'true', { timeout: 30_000 });
  const stations = page.locator('.dx-map__progress [data-map-part]');
  await expect(stations).toHaveCount(11);
  await expect(page.locator('.dx-map__progress [data-map-part][aria-current="true"]')).toHaveCount(0);
  await stations.nth(5).click();
  await expect(page.locator('[data-dx-badge]')).toContainText('Post-training');
  await expect(page.locator('[data-map-status]')).toContainText('chapters written');
  await expect(stations.nth(5)).toHaveAttribute('aria-current', 'true');
  const chapters = page.locator('[data-map-chapters="6"]');
  await expect(chapters).toBeVisible();
  await expect(chapters.locator('a')).toHaveCount(6);
  expect(await page.locator('.dx-map__edge.is-active').count()).toBeGreaterThan(0);
  await expect(page.locator('[data-map-overview]')).not.toBeVisible();
  await stations.nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-map-chapters="2"]')).toBeVisible();
  await expect(chapters).not.toBeVisible();
  await expect(page.locator('[data-dash]')).toHaveAttribute('data-active-part', '2');
});

test('the live region tether joins the brain label to its selected station across desktop and mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const brain = page.locator('[data-brain]');
  const tether = page.locator('[data-region-tether]');
  await expect(brain).toHaveAttribute('data-brain-ready', 'true', { timeout: 30_000 });
  await page.locator('[data-map-part="6"]').click();
  await expect(brain.locator('.hb3-region.is-on')).toContainText('Post-training');
  await expect(brain.locator('.hb3-region.is-on')).toBeVisible();
  const alignmentError = async (): Promise<number> =>
    page.locator('[data-dash]').evaluate((root) => {
      const label = root.querySelector('.hb3-region.is-on');
      const origin = root.querySelector('[data-region-tether-origin]');
      const path = root.querySelector<SVGPathElement>('[data-region-tether-path]');
      const station = root.querySelector('[data-map-part="6"] .dx-map__point');
      const matrix = path?.getScreenCTM();
      if (
        label === null ||
        origin === null ||
        path === null ||
        station === null ||
        matrix === null ||
        matrix === undefined ||
        !path.hasAttribute('d')
      )
        return Number.POSITIVE_INFINITY;
      const labelBounds = label.getBoundingClientRect();
      const originBounds = origin.getBoundingClientRect();
      const stationBounds = station.getBoundingClientRect();
      const endpoint = path.getPointAtLength(path.getTotalLength()).matrixTransform(matrix);
      return Math.max(
        Math.hypot(
          originBounds.x + originBounds.width / 2 - labelBounds.x - labelBounds.width / 2,
          originBounds.y + originBounds.height / 2 - labelBounds.y - labelBounds.height / 2,
        ),
        Math.hypot(
          endpoint.x - stationBounds.x - stationBounds.width / 2,
          endpoint.y - stationBounds.y - stationBounds.height / 2,
        ),
      );
    });
  await expect(tether).toHaveAttribute('data-visible', 'true');
  await expect
    .poll(alignmentError, { message: 'The actual rendered brain label and curve station must anchor the tether.' })
    .toBeLessThanOrEqual(2);
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('[data-dash]')).toHaveAttribute('data-active-part', '6');
    await expect(brain.locator('.hb3-region.is-on')).toBeVisible();
    await expect(tether).toHaveAttribute('data-visible', 'true');
    await expect
      .poll(alignmentError, { message: 'Resizing must keep both tether endpoints aligned within two CSS pixels.' })
      .toBeLessThanOrEqual(2);
  }
  await brain.locator('canvas').dispatchEvent('webglcontextlost', { cancelable: true });
  await expect(brain.locator('[data-brain-svg]')).toBeVisible();
  await expect(tether).toHaveAttribute('data-visible', 'false');
  await expect(tether).toHaveCSS('opacity', '0');
});

test('system reduced motion suppresses signals and context loss restores linked SVG', async ({ page }) => {
  await page.goto('/');
  const brain = page.locator('[data-brain]');
  await expect(brain).toHaveAttribute('data-brain-ready', 'true', { timeout: 30_000 });
  await expect(brain).toHaveClass(/is-3d/u);
  await expect(brain.locator('.hb-controls')).toHaveCount(0);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(
    await brain.evaluate((element) => {
      let signals = 0;
      element.addEventListener('hx:signal', () => {
        signals += 1;
      });
      element.dispatchEvent(new CustomEvent('hx:chapter', { detail: 1 }));
      return signals;
    }),
  ).toBe(0);
  await brain.locator('canvas').dispatchEvent('webglcontextlost', { cancelable: true });
  await expect(brain).toHaveClass(/is-2d/u);
  await expect(brain.locator('[data-brain-svg]')).toBeVisible();
  await expect(brain.locator('.hb-n')).toHaveCount(66);
});

test('story navigator follows a part without exposing manuscript counters', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-brain]')).toHaveAttribute('data-brain-ready', 'true', { timeout: 30_000 });
  await expect(page.locator('[data-dx-badge]')).toContainText('The Model Stack');
  await page.locator('[data-brain]').evaluate((element) => {
    element.dispatchEvent(
      new CustomEvent('hx:part', {
        bubbles: true,
        detail: { part: 6, k: 'Post-training', t: 'Post-training' },
      }),
    );
  });
  await expect(page.locator('[data-dx-badge]')).toContainText('Post');
  await expect(page.locator('[data-dx-tiles]')).toHaveCount(0);
  await expect(page.locator('.bs-sticky')).toHaveCSS('overflow-y', 'visible');
  await expect(page.locator('[data-dash]')).not.toContainText(/\d[\d,]* (words|figures|equations)/u);
});

test('brain chapter selection synchronizes its station and connected chapter links', async ({ page }) => {
  await page.goto('/');
  const brain = page.locator('[data-brain]');
  await expect(brain).toHaveAttribute('data-brain-ready', 'true', { timeout: 30_000 });
  await brain.evaluate((element) => {
    element.dispatchEvent(new CustomEvent('hx:selection', { detail: { chapter: 35 }, bubbles: true }));
  });
  const selected = page.locator('[data-map-chapters="6"] [data-map-chapter="35"]');
  await expect(selected).toBeVisible();
  await expect(selected).toHaveClass(/is-selected/u);
  await expect(page.locator('[data-dx-badge]')).toContainText('Post-training');
  await expect(page.locator('[data-map-part="6"]')).toHaveAttribute('aria-current', 'true');
  expect(await page.locator('.dx-map__edge.is-active').count()).toBeGreaterThan(0);
  await brain.evaluate((element) => {
    element.dispatchEvent(new CustomEvent('hx:selection', { detail: { chapter: null }, bubbles: true }));
  });
  await expect(selected).not.toHaveClass(/is-selected/u);
  await expect(page.locator('[data-map-chapters="6"]')).toBeVisible();
  await brain.locator('canvas').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-dash]')).toHaveAttribute('data-selected-chapter', /\d+/u);
  await expect(brain.locator('.hb3-region.is-on')).toContainText('Foundations');
  await page.locator('[data-map-part="6"]').focus();
  await page.keyboard.press('Enter');
  await expect(brain.locator('.hb3-tag.is-on')).toHaveCount(0);
  await expect(page.locator('[data-dash]')).toHaveAttribute('data-selected-chapter', '');
  await brain.locator('canvas').focus();
  await page.keyboard.press('ArrowRight');
  const chapter = await page.locator('[data-dash]').getAttribute('data-selected-chapter');
  const href = await page.locator(`.dx-catalog [data-map-chapter="${chapter}"]`).getAttribute('href');
  expect(href).not.toBeNull();
  if (href !== null) {
    await Promise.all([page.waitForURL(new URL(href, page.url()).href), page.keyboard.press('Enter')]);
  }
});

test('all chapter symbols expand below the mobile brain and map with equal usable targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('[data-brain]')).toHaveAttribute('data-brain-ready', 'true', { timeout: 30_000 });
  const field = page.locator('.dx-field');
  const map = page.locator('.dx-map');
  const dash = page.locator('[data-dash]');
  const fieldBefore = await field.boundingBox();
  const dashBefore = await dash.boundingBox();
  expect(fieldBefore).not.toBeNull();
  expect(dashBefore).not.toBeNull();
  await page.locator('.dx-catalog summary').click();
  const grid = page.locator('.dx-catalog__grid');
  await expect(grid).toBeVisible();
  await expect(grid.locator('.dx-catalog__part')).toHaveCount(11);
  await expect(grid.locator('a')).toHaveCount(66);
  for (const group of await grid.locator('.dx-catalog__part').all()) {
    await expect(group.locator('a[href]')).toHaveCount(6);
  }
  const targets = await grid.locator('a').evaluateAll((links) =>
    links.map((link) => {
      const rect = link.getBoundingClientRect();
      const style = getComputedStyle(link);
      return { width: rect.width, height: rect.height, border: style.borderTopWidth, href: link.getAttribute('href') };
    }),
  );
  expect(new Set(targets.map((target) => target.href)).size).toBe(66);
  expect(Math.min(...targets.map((target) => target.width))).toBeGreaterThanOrEqual(44);
  expect(Math.min(...targets.map((target) => target.height))).toBeGreaterThanOrEqual(44);
  expect(
    Math.max(...targets.map((target) => target.width)) - Math.min(...targets.map((target) => target.width)),
  ).toBeLessThan(1);
  expect(
    Math.max(...targets.map((target) => target.height)) - Math.min(...targets.map((target) => target.height)),
  ).toBeLessThan(1);
  expect(targets.every((target) => target.border === '0px')).toBe(true);
  const [fieldAfter, mapAfter, gridAfter, dashAfter] = await Promise.all([
    field.boundingBox(),
    map.boundingBox(),
    grid.boundingBox(),
    dash.boundingBox(),
  ]);
  expect(fieldAfter).not.toBeNull();
  expect(mapAfter).not.toBeNull();
  expect(gridAfter).not.toBeNull();
  expect(dashAfter).not.toBeNull();
  if (
    fieldBefore === null ||
    dashBefore === null ||
    fieldAfter === null ||
    mapAfter === null ||
    gridAfter === null ||
    dashAfter === null
  )
    return;
  expect(gridAfter.y).toBeGreaterThanOrEqual(
    Math.max(fieldAfter.y + fieldAfter.height, mapAfter.y + mapAfter.height) - 1,
  );
  expect(Math.abs(fieldAfter.height - fieldBefore.height)).toBeLessThan(1);
  expect(dashAfter.height - dashBefore.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('the expanded desktop catalogue reaches its last chapter through ordinary page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('[data-brain]')).toHaveAttribute('data-brain-ready', 'true', { timeout: 30_000 });
  await page.locator('.dx-catalog summary').click();
  const last = page.locator('.dx-catalog__grid a').last();
  await expect(last).toBeVisible();
  const href = await last.getAttribute('href');
  expect(href).not.toBeNull();
  // Wheel over the manuscript, rather than over the diagram, so reaching the
  // final chapter depends on document scrolling and cannot use a panel scroller.
  await page.mouse.move(40, 450);
  const initialScroll = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 420);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(initialScroll);
  const topbarBottom = await page.locator('.sh-topbar').evaluate((element) => element.getBoundingClientRect().bottom);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const box = await last.boundingBox();
    if (box !== null && box.y >= topbarBottom && box.y + box.height <= 900) break;
    const previousScroll = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 420);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(previousScroll);
  }
  await expect(last).toBeInViewport({ ratio: 1 });
  const scrollers = await page
    .locator('.bs-sticky, [data-dash], .dx-catalog, .dx-catalog__grid')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({ overflow: getComputedStyle(node).overflowY, scrollTop: node.scrollTop })),
    );
  expect(scrollers.every((node) => !['auto', 'scroll'].includes(node.overflow) && node.scrollTop === 0)).toBe(true);
  if (href !== null) {
    await Promise.all([page.waitForURL(new URL(href, page.url()).href), last.click()]);
  }
});

test('touch previews a chapter and a cancelled gesture cannot leave a drag or arm navigation', async ({
  browser,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'CDP generates a real cancelled touch gesture in Chromium.');
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/');
    const brain = page.locator('[data-brain]');
    await expect(brain).toHaveAttribute('data-brain-ready', 'true', { timeout: 30_000 });
    await brain.evaluate((element) => {
      element.dataset['testSelections'] = '0';
      element.addEventListener('hx:selection', () => {
        element.dataset['testSelections'] = String(Number(element.dataset['testSelections']) + 1);
      });
    });
    const box = await brain.locator('canvas').boundingBox();
    expect(box).not.toBeNull();
    if (box === null) return;
    let hit: { x: number; y: number; chapter: string } | null = null;
    // Discover a real visible hit through the same hover interaction a reader
    // uses, without reproducing Three.js projection or fixed neuron coordinates.
    for (const y of [0.4, 0.5, 0.3, 0.6, 0.2, 0.7]) {
      for (const x of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
        await page.mouse.move(1, 1);
        const point = { x: box.x + box.width * x, y: box.y + box.height * y };
        await page.mouse.move(point.x, point.y);
        const chapter = await page.locator('[data-dash]').getAttribute('data-selected-chapter');
        if (chapter) {
          hit = { ...point, chapter };
          break;
        }
      }
      if (hit !== null) break;
    }
    expect(hit, 'The visible brain should expose at least one selectable chapter.').not.toBeNull();
    if (hit === null) return;
    const home = page.url();
    const href = await page.locator(`.dx-catalog [data-map-chapter="${hit.chapter}"]`).getAttribute('href');
    expect(href).not.toBeNull();
    if (href === null) return;
    const before = Number(await brain.getAttribute('data-test-selections'));
    await page.touchscreen.tap(hit.x, hit.y);
    await expect(brain).toHaveAttribute('data-test-selections', String(before + 1));
    await expect(page).toHaveURL(home);
    await expect(page.locator('[data-dash]')).toHaveAttribute('data-selected-chapter', hit.chapter);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hit.x, y: hit.y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await cdp.detach();
    const cancelled = Number(await brain.getAttribute('data-test-selections'));
    await page.touchscreen.tap(hit.x, hit.y);
    await expect(brain).toHaveAttribute('data-test-selections', String(cancelled + 1));
    await expect(page).toHaveURL(home);
    await Promise.all([page.waitForURL(new URL(href, home).href), page.touchscreen.tap(hit.x, hit.y)]);
  } finally {
    await context.close();
  }
});

test('chapter navigation exposes search and theme while preserving technical reference labels', async ({ page }) => {
  await page.goto('/ch35-verifiable-reward-rl-and-reasoning-policy-optimization/35-3-reasoning-policy-development/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('.rb-header__meta')).not.toContainText(/figures|equations|words/u);
  await expect(page.locator('.rb-eq__num').first()).toBeVisible();
  await expect(page.locator('.katex-error')).toHaveCount(0);
  await page.locator('.sh-topbar [data-action="open-search"]').click();
  await expect(page.getByRole('dialog').filter({ has: page.getByRole('combobox') })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.sh-topbar [data-action="toggle-theme"]')).toBeVisible();
});

test('labs readout and dense matrix stay within the page at desktop and tablet widths', async ({ page }) => {
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/labs/');
    await expect(page.locator('.en-readout')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('the homepage retains chapter navigation without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4321/');
    await expect(page.locator('[data-brain-svg]')).toBeVisible();
    await expect(page.locator('.bs-ch')).toHaveCount(66);
    await expect(page.locator('.bs-ch .chapter-symbol')).toHaveCount(66);
    await expect(page.getByRole('button', { name: 'Play motion', exact: true })).not.toBeVisible();
    await page.locator('.dx-catalog summary').click();
    await expect(page.locator('.dx-catalog__grid')).toBeVisible();
    await expect(page.locator('.dx-catalog__part')).toHaveCount(11);
    await expect(page.locator('.dx-catalog__grid a[href]')).toHaveCount(66);
    const first = page.locator('.dx-catalog__grid a').first();
    const href = await first.getAttribute('href');
    expect(href).not.toBeNull();
    if (href !== null) {
      await first.click();
      await expect(page).toHaveURL(new URL(href, 'http://127.0.0.1:4321/').href);
    }
  } finally {
    await context.close();
  }
});
