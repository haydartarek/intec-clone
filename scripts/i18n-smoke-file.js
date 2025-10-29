(async ()=>{
  const puppeteer = require('puppeteer');
  const path = require('path');
  const files = [
    'index.html','opleidingen.html','contact.html','python.html','support.html'
  ];
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const results = [];
  for(const f of files){
    const full = 'file://' + path.resolve(process.cwd(), f);
    const r={file:full};
    try{
      await page.goto(full, { waitUntil: 'networkidle2', timeout: 20000 });
      r.initial = {};
      try{ const title = await page.title(); r.title=title; }catch(e){ r.titleError=e.message }
      // pick some selectors by page
      const checks = ['[data-i18n]','h1','main'];
      for(const sel of checks){
        try{
          const el = await page.$(sel);
          r.initial[sel] = el ? await page.evaluate(e=>e.innerText.trim(), el) : null;
        }catch(e){ r.initial[sel] = {error: e.message}; }
      }
      // Try switch to English
      const enBtn = await page.$('[data-lang-select][data-lang="en"]');
      if(enBtn){ await enBtn.click(); await page.waitForTimeout(400); }
      r.after = {};
      for(const sel of checks){
        try{
          const el = await page.$(sel);
          r.after[sel] = el ? await page.evaluate(e=>e.innerText.trim(), el) : null;
        }catch(e){ r.after[sel] = {error: e.message}; }
      }
      const html = await page.content();
      r.containsUndefined = html.includes('undefined') || html.includes('null');
    }catch(e){ r.error = e.message; }
    results.push(r);
  }
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch(e=>{ console.error(e); process.exit(1); });
