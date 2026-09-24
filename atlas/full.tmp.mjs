import { chromium } from '@playwright/test';
const [out, url, prefix, max] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('http://localhost:4321' + url, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(600);
const H = await page.evaluate(() => document.documentElement.scrollHeight);
const regions = await page.evaluate(() => [...document.querySelectorAll('[data-region]')].map(r => r.id + '@' + Math.round(r.getBoundingClientRect().top + scrollY) + '+' + Math.round(r.getBoundingClientRect().height)));
console.log('height', H, regions.join(' '));
for (let y = 0, i = 0; y < H && i < Number(max); y += 880, i++) {
  await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${prefix}-${String(i).padStart(2,'0')}.png` });
}
await browser.close();
