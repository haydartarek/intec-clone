const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const projectRoot = path.resolve(__dirname, '..');
const skipDirs = new Set(['node_modules', 'assets', 'data', 'reports', 'scripts', '.git']);

const collectHtmlFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        if (entry.name.startsWith('.')) {
            continue;
        }
        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (skipDirs.has(entry.name)) {
                continue;
            }
            files.push(...collectHtmlFiles(absolute));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
            files.push(absolute);
        }
    }
    return files;
};

const htmlFiles = collectHtmlFiles(projectRoot);
const issues = [];

for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(html, { decodeEntities: false });
    $('img').each((_, el) => {
        const attrs = el.attribs || {};
        const isCritical = attrs['data-critical'] === 'true';
        const loading = attrs.loading;
        const fetchpriority = attrs.fetchpriority;
        const decoding = attrs.decoding;
        const entry = {
            file: path.relative(projectRoot, file),
            html: $.html(el)
        };

        if (isCritical) {
            if (loading !== 'eager' || fetchpriority !== 'high') {
                issues.push({ ...entry, issue: 'critical-image-missing-priority' });
            }
            if (!decoding) {
                issues.push({ ...entry, issue: 'critical-image-missing-decoding' });
            }
        } else {
            if (!loading || loading === 'eager') {
                issues.push({ ...entry, issue: 'noncritical-missing-lazy' });
            }
            if (!decoding) {
                issues.push({ ...entry, issue: 'noncritical-missing-decoding' });
            }
        }
    });
}

const reportPath = path.join(projectRoot, 'reports', 'image-performance-report.json');
const payload = { generatedAt: new Date().toISOString(), issues };
fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
console.log(`Image audit complete. Issues found: ${issues.length}. Report: ${reportPath}`);
