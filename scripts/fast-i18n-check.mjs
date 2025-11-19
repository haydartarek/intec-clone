#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const projectRoot = resolve(__dirname, '..');

const localeFiles = {
    en: resolve(projectRoot, 'assets/js/i18n/en.js'),
    nl: resolve(projectRoot, 'assets/js/i18n/nl.js'),
};

const keys = process.argv.slice(2);
if (!keys.length) {
    console.error('Usage: node scripts/fast-i18n-check.mjs <key> [key...]');
    process.exit(1);
}

async function loadLocale(locale) {
    const code = await readFile(localeFiles[locale], 'utf8');
    const context = { window: { i18n: {} } };
    vm.createContext(context);
    vm.runInContext(code, context, { filename: localeFiles[locale] });
    const dict = context.window.i18n?.[locale];
    if (!dict) {
        throw new Error(`Locale '${locale}' not found after evaluating ${localeFiles[locale]}`);
    }
    return dict;
}

function analyzeValue(value) {
    if (typeof value !== 'string') {
        return { status: 'ERROR', reason: 'Not a string' };
    }
    if (!value.length) {
        return { status: 'ERROR', reason: 'Empty string' };
    }
    if (value.includes('\uFFFD')) {
        return { status: 'ERROR', reason: 'Contains replacement character' };
    }
    return { status: 'OK' };
}

const start = performance.now();
const summaries = { OK: 0, ERROR: 0 };

const locales = await Promise.all(
    Object.entries(localeFiles).map(async ([locale]) => [locale, await loadLocale(locale)])
);
const dictionaries = Object.fromEntries(locales);

for (const key of keys) {
    console.log(`\nKey: ${key}`);
    for (const [locale, dict] of Object.entries(dictionaries)) {
        const value = dict[key];
        const result = analyzeValue(value);
        summaries[result.status] += 1;
        if (result.status === 'OK') {
            console.log(`  [${locale}] OK    | ${value}`);
        } else {
            const printable = typeof value === 'string' ? value : String(value);
            console.log(`  [${locale}] ERROR | ${printable || '—'} (${result.reason})`);
        }
    }
}

const duration = (performance.now() - start).toFixed(2);
console.log(`\nSummary: ${keys.length} keys checked across ${Object.keys(localeFiles).length} locales -> ${summaries.OK} OK, ${summaries.ERROR} ERROR (in ${duration}ms)`);
