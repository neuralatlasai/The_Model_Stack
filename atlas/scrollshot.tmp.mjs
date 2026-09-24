import { chromium } from '@playwright/test';
const [out, url, name, ...anchors] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,200)); });
await page.goto('http://localhost:4321' + url, { waitUntil: 'networkidle', timeout: 90000 });
for (const a of anchors) {
  await page.evaluate((id) => { const el = document.getElementById(id); if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 150); }, a);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${out}/${name}-${a}.png` });
}
console.log(name, errs.slice(0,4).join(' | ') || 'no errors');
await browser.close();
