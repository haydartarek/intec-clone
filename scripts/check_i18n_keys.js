const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const i18nDir = path.join(projectRoot, 'assets', 'js', 'i18n');
const locales = ['en', 'nl'];

function loadLocale(locale) {
    const filePath = path.join(i18nDir, `${locale}.js`);
    const code = fs.readFileSync(filePath, 'utf8');
    const context = {
        window: { i18n: {} },
        console,
    };
    vm.createContext(context);
    try {
        vm.runInContext(code, context, { filename: filePath });
    } catch (error) {
        throw new Error(`Failed to evaluate ${locale}.js: ${error.message}`);
    }
    const dict = context.window.i18n[locale];
    if (!dict) {
        throw new Error(`${locale}.js did not register window.i18n.${locale}`);
    }
    return { filePath, dict };
}

function main() {
    const localeData = {};
    try {
        for (const locale of locales) {
            localeData[locale] = loadLocale(locale);
        }
    } catch (error) {
        process.stdout.write(JSON.stringify({ status: 'error', details: error.message }));
        process.exit(0);
    }

    const enKeys = Object.keys(localeData.en.dict).sort();
    const nlKeys = Object.keys(localeData.nl.dict).sort();
    const missingInNl = enKeys.filter((key) => !(key in localeData.nl.dict));
    const missingInEn = nlKeys.filter((key) => !(key in localeData.en.dict));

    const report = {
        status: missingInNl.length === 0 && missingInEn.length === 0 ? 'ok' : 'warning',
        locales,
        totals: {
            en: enKeys.length,
            nl: nlKeys.length,
        },
        differences: {
            missingInNl,
            missingInEn,
        },
    };

    process.stdout.write(JSON.stringify(report));
}

main();
