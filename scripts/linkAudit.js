const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const projectRoot = path.resolve(__dirname, '..');
const outputPath = path.join(projectRoot, 'link-audit-report.json');
const skipDirs = new Set(['node_modules', 'assets', 'data', 'reports', 'scripts', '.git', '.vscode', '.idea']);

const toPosix = (value) => value.split(path.sep).join('/');

const getHtmlFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (entry.name.startsWith('.DS_')) {
            continue;
        }

        const absolute = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (skipDirs.has(entry.name)) {
                continue;
            }
            files.push(...getHtmlFiles(absolute));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
            files.push(absolute);
        }
    }

    return files;
};

const htmlFiles = getHtmlFiles(projectRoot);
const domMap = new Map();

for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    const $ = cheerio.load(html);
    const ids = new Set();
    $('[id]').each((_, el) => {
        const id = $(el).attr('id');
        if (id) {
            ids.add(id);
        }
    });

    domMap.set(toPosix(path.relative(projectRoot, file)), { $, ids, html });
}

const classifyHref = (href, fromPath) => {
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        return { type: 'ignored' };
    }

    let url;
    try {
        url = new URL(href);
    } catch (err) {
        url = null;
    }

    const baseDir = toPosix(path.dirname(fromPath));
    const normalizeJoin = (target) => {
        const joined = path.posix.join(baseDir === '.' ? '' : baseDir, target);
        return path.posix.normalize(joined);
    };

    if (url && (url.protocol === 'http:' || url.protocol === 'https:')) {
        if (url.hostname.endsWith('intecbrussel.be')) {
            const pathname = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
            return {
                type: 'internal',
                targetFile: pathname,
                hash: url.hash ? url.hash.slice(1) : '',
                original: href
            };
        }
        return { type: 'external', original: href };
    }

    const [pathPartRaw, hashPart = ''] = href.split('#');
    const [pathWithoutQuery] = pathPartRaw.split('?');
    const hash = hashPart.trim();

    if (!pathWithoutQuery || pathWithoutQuery === '') {
        return { type: 'anchor', targetFile: fromPath, hash };
    }

    if (pathWithoutQuery.startsWith('/')) {
        const normalized = pathWithoutQuery === '/' ? 'index.html' : pathWithoutQuery.replace(/^\//, '');
        return { type: 'internal', targetFile: normalized, hash, original: href };
    }

    const normalized = normalizeJoin(pathWithoutQuery);
    return { type: 'internal', targetFile: normalized, hash, original: href };
};

const results = {
    generatedAt: new Date().toISOString(),
    pagesScanned: htmlFiles.length,
    summary: {
        brokenLinks: 0,
        missingAnchors: 0,
        uncheckedExternalLinks: 0
    },
    pages: []
};

for (const [relativePath, domInfo] of domMap.entries()) {
    const { $, ids } = domInfo;
    const pageReport = {
        path: relativePath,
        brokenLinks: [],
        missingAnchors: [],
        externalLinks: []
    };

    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        const label = $(el).text().trim().slice(0, 80);
        const classification = classifyHref(href, relativePath);

        if (classification.type === 'ignored') {
            return;
        }

        if (classification.type === 'external') {
            pageReport.externalLinks.push({ href, label });
            results.summary.uncheckedExternalLinks += 1;
            return;
        }

        if (classification.type === 'anchor') {
            if (classification.hash && !ids.has(classification.hash)) {
                pageReport.missingAnchors.push({ href, label, reason: 'Anchor id not found in page' });
                results.summary.missingAnchors += 1;
            }
            return;
        }

        if (classification.type === 'internal') {
            const { targetFile, hash } = classification;
            const absoluteTarget = path.join(projectRoot, targetFile);
            if (!domMap.has(targetFile)) {
                if (!fs.existsSync(absoluteTarget)) {
                    pageReport.brokenLinks.push({ href, label, reason: `Missing target file ${targetFile}` });
                    results.summary.brokenLinks += 1;
                }
                return;
            }
            if (hash) {
                const targetDom = domMap.get(targetFile);
                if (!targetDom.ids.has(hash)) {
                    pageReport.missingAnchors.push({ href, label, reason: `Missing anchor #${hash} in ${targetFile}` });
                    results.summary.missingAnchors += 1;
                }
            }
        }
    });

    results.pages.push(pageReport);
}

fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`Link audit complete. Report written to ${outputPath}`);
