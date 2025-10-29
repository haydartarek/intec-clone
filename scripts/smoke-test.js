(async ()=>{
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const urls = ['/index.html','/opleidingen.html','/contact.html','/python.html','/support.html'];
  const out = [];
  for (const u of urls) {
    const full = 'http://localhost:8000' + u;
    try {
      const r = await page.goto(full, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = r.status();
      const title = await page.title();
      const hasSection = await page.$('main, .section, body');
      const html = await page.content();
      // Quick check for "undefined" text which may indicate missing i18n keys
      const hasUndefined = html.includes('undefined') || html.includes('null');
      out.push({ url: full, status, title, hasSection: !!hasSection, hasUndefined });
    } catch (e) {
      out.push({ url: full, error: e.message });
    }
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
})().catch(e=>{ console.error(e); process.exit(1); });
