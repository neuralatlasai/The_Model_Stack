/** Disclosure summaries retain resolved notation without nesting interactive controls. */
import { expect, test } from '@playwright/test';

test('derivation summaries remain readable and use one disclosure interaction', async ({ page }) => {
  await page.goto('/ch08-cleaning-deduplication-privacy-filtering-and-contamination/08-2-quality-estimation/');
  const summaries = page.locator('.rb-expand__summary');
  await expect(summaries).not.toHaveCount(0);
  await expect(summaries.locator('a, button, input, select, textarea, [tabindex="0"]')).toHaveCount(0);
  const resolved = summaries.locator('.rb-xref--static');
  await expect(resolved).not.toHaveCount(0);
  await expect(resolved.first()).toHaveText(/^Eq\. \d+\.\d+$/u);

  await page.goto('/ch02-mathematical-and-statistical-foundations/');
  const derivations = page.locator('a.rb-xref--derived');
  await expect(derivations).not.toHaveCount(0);
  await expect(derivations.first()).toHaveAttribute('href', /#eq-2-10$/u);
});
