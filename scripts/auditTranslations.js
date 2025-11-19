const fs = require('fs');
const path = require('path');
const vm = require('vm');
const cheerio = require('cheerio');

const projectRoot = path.resolve(__dirname, '..');
const localesDir = path.join(projectRoot, 'assets', 'js', 'i18n');
const outputPath = path.join(projectRoot, 'reports', 'translation-audit.json');
const hardCodedSampleLimit = 50;
const htmlTargets = [
    'index.html',
    'contact.html',
    'digipunt.html',
    'inschrijven.html',
    'opleidingen.html',
    'overons.html',
    'python.html',
    'security.html',
    'support.html',
    'vacatures.html',
    'wiezijnwe.html',
    'systeembeheerder.html',
    path.join('cvdb', 'index.html')
].map((target) => path.join(projectRoot, target));

const skipTextTags = new Set(['script', 'style', 'noscript', 'svg', 'template']);
const wordLikeRegex = /[A-Za-zÀ-ÖØ-öø-ÿ]{3,}/;

function ensureFilesExist(files) {
    const missing = files.filter((filePath) => !fs.existsSync(filePath));
    if (missing.length) {
        const list = missing.map((file) => path.relative(projectRoot, file)).join(', ');
        throw new Error(`Missing required HTML files: ${list}`);
    }
}

function loadLocale(locale) {
    const filePath = path.join(localesDir, `${locale}.js`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Locale file not found: ${filePath}`);
    }

    const code = fs.readFileSync(filePath, 'utf8');
    const context = {
        window: {
            i18n: {},
            console,
        }
    };
    context.window.window = context.window;

    vm.runInNewContext(code, context, { filename: filePath });

    const data = context.window.i18n?.[locale];
    if (!data || typeof data !== 'object') {
        throw new Error(`Locale data missing or malformed for "${locale}"`);
    }
    return data;
}

function normalizeText(text = '') {
    return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasI18nAttribute(element) {
    if (!element || !element.attribs) return false;
    return Object.keys(element.attribs).some((attr) => attr.startsWith('data-i18n'));
}

function hasI18nAncestor(node) {
    let current = node?.parent;
    while (current) {
        if (current.type === 'tag' && hasI18nAttribute(current)) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

function describeNode(node) {
    if (!node || node.type !== 'tag') {
        return 'unknown';
    }
    let descriptor = node.name || 'unknown';
    const { id, class: classAttr } = node.attribs || {};
    if (id) {
        descriptor += `#${id}`;
    }
    if (classAttr) {
        const classes = classAttr
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((cls) => `.${cls}`)
            .join('');
        descriptor += classes;
    }
    return descriptor;
}

function addHardCodedFinding(map, filePath, entry) {
    const relPath = path.relative(projectRoot, filePath);
    if (!map.has(relPath)) {
        map.set(relPath, { count: 0, samples: [] });
    }
    const record = map.get(relPath);
    record.count += 1;
    if (record.samples.length < hardCodedSampleLimit) {
        record.samples.push(entry);
    }
}

function collectHardCodedText($, filePath, hardCodedMap) {
    const body = $('body');
    if (!body.length) return;

    function traverse(node) {
        if (!node) return;
        if (node.type === 'text') {
            const text = normalizeText(node.data || '');
            if (!text || !wordLikeRegex.test(text)) {
                return;
            }
            if (hasI18nAncestor(node)) {
                return;
            }
            addHardCodedFinding(hardCodedMap, filePath, {
                text: text.slice(0, 160),
                context: describeNode(node.parent)
            });
            return;
        }

        if (node.type !== 'tag') {
            return;
        }

        if (skipTextTags.has(node.name)) {
            return;
        }

        const element = $(node);
        element.contents().each((_, child) => traverse(child));
    }

    body.contents().each((_, node) => traverse(node));
}

function collectUsageFromHtml(filePath, usageMap, hardCodedMap) {
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html, { decodeEntities: false });
    const relPath = path.relative(projectRoot, filePath);

    $('*').each((_, element) => {
        if (!element.attribs) return;
        Object.entries(element.attribs).forEach(([attr, value]) => {
            if (!attr.startsWith('data-i18n') || attr === 'data-i18n-allow-html') {
                return;
            }
            const key = (value || '').trim();
            if (!key) return;
            const snippet = normalizeText($(element).text()).slice(0, 120);
            if (!usageMap.has(key)) {
                usageMap.set(key, { count: 0, occurrences: [] });
            }
            const entry = usageMap.get(key);
            entry.count += 1;
            entry.occurrences.push({
                file: relPath,
                attribute: attr,
                sample: snippet
            });
        });
    });

    collectHardCodedText($, filePath, hardCodedMap);
}

function sortKeys(keys) {
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

function main() {
    ensureFilesExist(htmlTargets);

    const usage = new Map();
    const hardCoded = new Map();
    htmlTargets.forEach((filePath) => collectUsageFromHtml(filePath, usage, hardCoded));

    const locales = {
        en: loadLocale('en'),
        nl: loadLocale('nl')
    };

    const missing = { en: [], nl: [] };

    usage.forEach((info, key) => {
        if (!Object.prototype.hasOwnProperty.call(locales.en, key)) {
            missing.en.push({ key, occurrences: info.occurrences });
        }
        if (!Object.prototype.hasOwnProperty.call(locales.nl, key)) {
            missing.nl.push({ key, occurrences: info.occurrences });
        }
    });

    const usedKeys = new Set(usage.keys());
    const unused = {
        en: sortKeys(Object.keys(locales.en).filter((key) => !usedKeys.has(key))),
        nl: sortKeys(Object.keys(locales.nl).filter((key) => !usedKeys.has(key)))
    };

    const hardCodedTotals = Array.from(hardCoded.values()).reduce((sum, info) => sum + info.count, 0);
    const report = {
        generatedAt: new Date().toISOString(),
        htmlFiles: htmlTargets.map((file) => path.relative(projectRoot, file)),
        stats: {
            usedKeys: usage.size,
            enKeys: Object.keys(locales.en).length,
            nlKeys: Object.keys(locales.nl).length,
            missingInEn: missing.en.length,
            missingInNl: missing.nl.length,
            unusedEn: unused.en.length,
            unusedNl: unused.nl.length,
            hardCodedFiles: hardCoded.size,
            hardCodedTextNodes: hardCodedTotals
        },
        missing,
        unused,
        hardCodedText: Object.fromEntries(
            Array.from(hardCoded.entries()).map(([file, info]) => [file, info])
        )
    };

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    const sampleMissingEn = missing.en.slice(0, 10).map((item) => item.key);
    const sampleMissingNl = missing.nl.slice(0, 10).map((item) => item.key);

    console.log('Translation audit summary');
    console.log('==========================');
    console.log(`HTML files checked: ${report.htmlFiles.length}`);
    console.log(`Unique keys referenced: ${usage.size}`);
    console.log(`English keys available: ${report.stats.enKeys}`);
    console.log(`Dutch keys available   : ${report.stats.nlKeys}`);
    console.log(`Missing in English     : ${report.stats.missingInEn}`);
    if (sampleMissingEn.length) {
        console.log('  Examples:', sampleMissingEn.join(', '));
    }
    console.log(`Missing in Dutch       : ${report.stats.missingInNl}`);
    if (sampleMissingNl.length) {
        console.log('  Examples:', sampleMissingNl.join(', '));
    }
    console.log(`Unused English keys    : ${report.stats.unusedEn}`);
    console.log(`Unused Dutch keys      : ${report.stats.unusedNl}`);
    console.log(`Hard-coded text nodes  : ${report.stats.hardCodedTextNodes} (${report.stats.hardCodedFiles} files)`);
    if (hardCoded.size) {
        const topFiles = Array.from(hardCoded.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 3)
            .map(([file, info]) => `${file} (${info.count})`);
        console.log('  Top files:', topFiles.join(', '));
    }
    console.log(`Detailed report saved to ${path.relative(projectRoot, outputPath)}`);
}

main();
