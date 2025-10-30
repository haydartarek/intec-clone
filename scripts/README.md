FAQ visual smoke test helper

This folder contains a small Puppeteer script to capture screenshots and computed styles
for `.faq-grid` on local HTML pages.

How to run (PowerShell):

1. Install Puppeteer (one-time; ~100MB download):

   npm install puppeteer --save-dev

2. Run the smoke test script:

   node scripts\faq-visual-smoke.js

3. Check screenshots in `screenshots/faq-smoke/` and review the printed computed styles.

Notes:
- The script uses file:// URLs for local files (index.html and opleidingen.html). Add or change pages in the script as needed.
- If you'd like me to run this script for you here, tell me and I'll install the dependency and execute it (it will download Chromium).