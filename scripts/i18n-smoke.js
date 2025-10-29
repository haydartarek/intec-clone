(async ()=>{
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const pages = [
    { url: '/index.html', checks: ['[data-i18n="home.hero.title"]','[data-i18n="home.hero.lead"]'] },
    { url: '/opleidingen.html', checks: ['[data-i18n="courses.title"]','[data-i18n="courses.lead"]'] },
    { url: '/contact.html', checks: ['[data-i18n="contact.title"]','[data-i18n="contact.peopleIntro"]'] },
    { url: '/python.html', checks: ['h1','main .section'] },
    { url: '/support.html', checks: ['h1','main .section'] }
  ];

  const results = [];
  for(const p of pages){
    const full = 'http://localhost:8000' + p.url;
    const r = { page: full };
    try{
      await page.goto(full, { waitUntil: 'networkidle2', timeout: 20000 });
      r.status = 200;
      r.initial = {};
      for(const sel of p.checks){
        try{
          await page.waitForTimeout(80);
          const el = await page.$(sel);
          r.initial[sel] = el ? await page.evaluate(e=>e.innerText.trim(), el) : null;
        }catch(e){ r.initial[sel] = {error: e.message}; }
      }

      // switch to English
      const enBtn = await page.$('[data-lang-select][data-lang="en"]');
      if(enBtn){
        await enBtn.click();
        await page.waitForTimeout(500);
        // If the site triggers a reload or re-render function, attempt to run global `i18nApply` if present
        try{
          await page.evaluate(()=>{ if(window.applyI18n) window.applyI18n(); if(window.i18n && window.setLanguage){ try{ window.setLanguage('en'); }catch(e){} } });
        }catch(e){}
      }

      r.after = {};
      for(const sel of p.checks){
        try{
          await page.waitForTimeout(80);
          const el = await page.$(sel);
          r.after[sel] = el ? await page.evaluate(e=>e.innerText.trim(), el) : null;
        }catch(e){ r.after[sel] = {error: e.message}; }
      }

      // check for 'undefined' text anywhere
      const html = await page.content();
      r.containsUndefined = html.includes('undefined') || html.includes('null');

    }catch(e){ r.error = e.message; }
    results.push(r);
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch(e=>{ console.error(e); process.exit(1); });
