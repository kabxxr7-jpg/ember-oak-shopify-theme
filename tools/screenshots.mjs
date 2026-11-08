// Portfolio screenshots of the live development store (light mode). Needs .storefront-cookie from unlock-web.mjs.
import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
import { STORE } from './gql.mjs';

const OUT = new URL('../portfolio/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const cookies = readFileSync(new URL('../.storefront-cookie', import.meta.url), 'utf8').split('; ').map((c) => {
  const i = c.indexOf('=');
  return { name: c.slice(0, i), value: c.slice(i + 1), domain: STORE, path: '/', secure: true };
});
const base = `https://${STORE}`;
const browser = await chromium.launch();

async function ctx(viewport, mobile = false) {
  const c = await browser.newContext({ viewport, deviceScaleFactor: 2, colorScheme: 'light', isMobile: mobile, hasTouch: mobile });
  await c.addCookies(cookies);
  return c;
}
async function open(c, path) {
  const p = await c.newPage();
  await p.goto(base + path, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '#shopify-pc__banner,.shopify-pc__banner__dialog,#preview-bar-iframe{display:none!important} .section-header,.shopify-section-header-sticky{position:relative!important;top:0!important}' });
  // trigger lazy images + reveal-on-scroll animations
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
    document.querySelectorAll('.scroll-trigger').forEach((e) => e.classList.remove('scroll-trigger', 'animate--slide-in', 'animate--fade-in'));
  });
  await p.waitForTimeout(800);
  return p;
}
const shotEl = async (p, sel, file) => {
  const el = p.locator(sel).first().locator('xpath=ancestor-or-self::*[contains(@class,"shopify-section")][1]');
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
  await el.screenshot({ path: OUT + file });
  console.log('✓', file);
};

const desk = await ctx({ width: 1440, height: 900 });

// 1. Home, above the fold
let p = await open(desk, '/');
await p.screenshot({ path: OUT + '01-home-desktop.png' });
console.log('✓ 01-home-desktop.png');

// 2. Comparison table
await shotEl(p, '.eo-compare', '02-comparison-table.png');

// 3. Lookbook with a hotspot open
await p.locator('.eo-hotspot__dot').first().scrollIntoViewIfNeeded();
await p.locator('.eo-hotspot__dot').first().click();
await shotEl(p, 'eo-lookbook', '03-shoppable-lookbook.png');

// 4. Quiz result
p = await open(desk, '/pages/find-your-coffee');
await p.click('[data-start]');
const pick = async (v) => { await p.locator(`[data-question]:not([hidden]) input[value="${v}"]`).check({ force: true }); };
await pick('pour-over'); await p.waitForTimeout(400);
await pick('fruity'); await pick('floral');
await p.locator('[data-question]:not([hidden]) [data-next]').click(); await p.waitForTimeout(300);
await pick('light'); await p.waitForTimeout(400);
await pick('regular'); await p.waitForTimeout(1200);
await shotEl(p, '[data-results]', '04-quiz-result.png');

// 5. Store locator on a phone, after a ZIP search
const phone = await ctx({ width: 390, height: 844 }, true);
p = await open(phone, '/pages/stockists');
await p.fill('input[name="zip"]', '10001');
await p.click('.eo-locator__form button[type="submit"]');
await p.waitForSelector('.eo-store.is-nearest', { timeout: 10000 });
await p.locator('.eo-locator__form').scrollIntoViewIfNeeded();
await p.evaluate(() => window.scrollBy(0, -80));
await p.screenshot({ path: OUT + '05-store-locator-phone.png' });
console.log('✓ 05-store-locator-phone.png');

// 6. Phone: home with testimonial slider
p = await open(phone, '/');
await p.locator('eo-testimonials').scrollIntoViewIfNeeded();
await p.evaluate(() => window.scrollBy(0, -140));
await p.waitForTimeout(500);
await p.screenshot({ path: OUT + '06-testimonials-phone.png' });
console.log('✓ 06-testimonials-phone.png');

await browser.close();
