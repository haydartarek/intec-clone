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
const changes = [];

for (const file of htmlFiles) {
    const original = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(original, { decodeEntities: false });
    let mutated = false;

    $('img').each((_, el) => {
        const $img = $(el);
        const attrs = el.attribs || {};
        const isCritical = attrs['data-critical'] === 'true';

        if (isCritical) {
            if (attrs.loading !== 'eager') {
                $img.attr('loading', 'eager');
                mutated = true;
            }
            if (attrs.fetchpriority !== 'high') {
                $img.attr('fetchpriority', 'high');
                mutated = true;
            }
        } else {
            if (!attrs.loading || attrs.loading === 'eager') {
                $img.attr('loading', 'lazy');
                mutated = true;
            }
            if (!attrs.decoding) {
                $img.attr('decoding', 'async');
                mutated = true;
            }
        }

        if (!attrs.decoding && isCritical) {
            $img.attr('decoding', 'async');
            mutated = true;
        }
    });

    if (mutated) {
        fs.writeFileSync(file, $.html());
        changes.push(path.relative(projectRoot, file));
    }
}

console.log(`Optimized images in ${changes.length} file(s).`);
if (changes.length) {
    console.log(changes.join('\n'));
}
