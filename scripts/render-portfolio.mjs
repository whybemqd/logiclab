// Built by Olivia — https://discord.gg/ojailbreaks
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 1220 }, deviceScaleFactor: 1.5 });
  await page.goto(new URL('docs/portfolio-page-11-DRAFT.html', root).href);
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.locator('img').evaluateAll(images => images.filter(image => !image.complete || image.naturalWidth === 0).map(image => image.src));
  if (missing.length) throw new Error(`Missing portfolio images: ${missing.join(', ')}`);
  await page.locator('.page').screenshot({ path: fileURLToPath(new URL('docs/portfolio-page-11-DRAFT.png', root)) });
  console.log('Rendered draft portfolio page with all images loaded.');
} finally {
  await browser.close();
}
