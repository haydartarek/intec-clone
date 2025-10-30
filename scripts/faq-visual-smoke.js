/**
 * Lightweight Puppeteer smoke test for `.faq-grid` visual checks.
 *
 * Usage (run after installing puppeteer):
 *   npm install puppeteer --save-dev
 *   node scripts\faq-visual-smoke.js
 *
 * The script will open local files via file:// URLs and take screenshots at
 * 1366x768, 768x1024, and 375x812. It will also log computed styles for the
 * first `.faq-grid` element.
 */
const puppeteer = require('puppeteer');
const fs = require('fs');

const pages = [
  'index.html',
  'opleidingen.html' // change or add 'faq.html' if you have a dedicated FAQ page
];

const viewports = [
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 }
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  try {
    for (const pagePath of pages) {
      const url = `file://${process.cwd()}/${pagePath}`;
      for (const vp of viewports) {
        const page = await browser.newPage();
        await page.setViewport({ width: vp.width, height: vp.height });
        console.log(`Opening ${url} at ${vp.name} (${vp.width}x${vp.height})`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Wait briefly for any CSS animations to settle
        await page.waitForTimeout(300);

        // Capture screenshot
        const screenshotsDir = 'screenshots/faq-smoke';
        if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });
        const screenshotPath = `${screenshotsDir}/${pagePath.replace('.html','')}-${vp.name}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Saved ${screenshotPath}`);

        // Grab computed styles for the first .faq-grid element
        const computed = await page.evaluate(() => {
          const el = document.querySelector('.faq-grid');
          if (!el) return null;
          const cs = window.getComputedStyle(el);
          const props = ['display','gridTemplateColumns','gap','padding','boxShadow','backgroundColor','borderRadius'];
          const out = {};
          props.forEach(p => { out[p] = cs.getPropertyValue(p); });
          return out;
        });

        console.log('Computed .faq-grid styles:', computed);
        await page.close();
      }
    }
  } catch (err) {
    console.error('Smoke test failed:', err);
  } finally {
    await browser.close();
  }
})();
