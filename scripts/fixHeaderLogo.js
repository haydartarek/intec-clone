const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const targetPatterns = [
    {
        regex: /<img src="assets\/img\/logo\+intec\+brusselZWART1\.png"[^>]*>/g,
        replacement: '<img src="assets/img/logo+intec+brusselZWART1.png" alt="INTEC Brussel logo" data-critical="true" decoding="async" loading="eager" fetchpriority="high" width="180" height="50">'
    },
    {
        regex: /<img src="\.\.\/assets\/img\/logo\+intec\+brusselZWART1\.png"[^>]*>/g,
        replacement: '<img src="../assets/img/logo+intec+brusselZWART1.png" alt="INTEC Brussel logo" data-critical="true" decoding="async" loading="eager" fetchpriority="high" width="180" height="50">'
    }
];

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
let updated = 0;

for (const file of htmlFiles) {
    const original = fs.readFileSync(file, 'utf8');
    let modified = original;
    for (const pattern of targetPatterns) {
        modified = modified.replace(pattern.regex, pattern.replacement);
    }
    if (modified !== original) {
        fs.writeFileSync(file, modified);
        updated += 1;
    }
}

console.log(`Updated header logos in ${updated} file(s).`);
