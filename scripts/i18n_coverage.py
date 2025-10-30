#!/usr/bin/env python3
"""
Scan HTML files for data-i18n usage and compare against NL/EN dictionaries.

Writes a JSON report to scripts/i18n_coverage_report.json and prints
a human-readable summary to stdout.

Usage: python scripts/i18n_coverage.py
"""
import os
import re
import json
from collections import defaultdict

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

HTML_EXT = '.html'
I18N_PATHS = {
    'nl': os.path.join(ROOT, 'assets', 'js', 'i18n', 'nl.js'),
    'en': os.path.join(ROOT, 'assets', 'js', 'i18n', 'en.js'),
}

ATTRS = ['data-i18n', 'data-i18n-placeholder', 'data-i18n-aria-label']

def find_html_files(root, exclude_dirs=None):
    """Find HTML files under root, skipping directories in exclude_dirs.

    exclude_dirs: set of directory names to skip (e.g., {'node_modules', '.git'})
    """
    if exclude_dirs is None:
        exclude_dirs = {"node_modules", ".git"}
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        # mutate dirnames in-place to skip excluded dirs for efficient pruning
        dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
        for fn in filenames:
            if fn.lower().endswith(HTML_EXT):
                files.append(os.path.join(dirpath, fn))
    return sorted(files)

def extract_keys_from_html(path):
    text = open(path, 'r', encoding='utf-8', errors='ignore').read()
    keys = set()
    for attr in ATTRS:
        # match attr="value" or attr='value'
        for m in re.findall(r'%s\s*=\s*["\']([^"\']+)["\']' % re.escape(attr), text):
            # attributes can contain multiple keys separated by spaces; split conservatively
            for part in re.split(r"\s+", m.strip()):
                if part:
                    keys.add(part)
    # also detect usage in templates like data-i18n="key:sub"
    # leave as-is; callers can decide
    includes = {
        'nl': 'assets/js/i18n/nl.js' in text,
        'en': 'assets/js/i18n/en.js' in text,
    }
    return sorted(keys), includes

def extract_keys_from_dict(path):
    if not os.path.exists(path):
        return set()
    text = open(path, 'r', encoding='utf-8', errors='ignore').read()
    # crude but effective: find occurrences of 'key': 'value' or "key": "value"
    pairs = re.findall(r'["\']([^"\']+)["\']\s*:\s*["\']', text)
    return set(pairs)

def main():
    html_files = find_html_files(ROOT)
    nl_keys = extract_keys_from_dict(I18N_PATHS['nl'])
    en_keys = extract_keys_from_dict(I18N_PATHS['en'])

    report = {
        'summary': {},
        'pages': {},
        'dictionaries': {
            'nl_count': len(nl_keys),
            'en_count': len(en_keys),
        }
    }

    total_pages = 0
    pages_missing_both_includes = []

    for path in html_files:
        total_pages += 1
        rel = os.path.relpath(path, ROOT).replace('\\', '/')
        keys, includes = extract_keys_from_html(path)
        missing_nl = sorted([k for k in keys if k not in nl_keys])
        missing_en = sorted([k for k in keys if k not in en_keys])
        page_report = {
            'keys_used_count': len(keys),
            'keys_used': sorted(keys),
            'includes': includes,
            'missing_in_nl': missing_nl,
            'missing_in_en': missing_en,
        }
        report['pages'][rel] = page_report
        if not includes['nl'] and not includes['en']:
            pages_missing_both_includes.append(rel)

    report['summary']['total_pages'] = total_pages
    report['summary']['pages_missing_both_includes'] = pages_missing_both_includes
    report['summary']['total_nl_keys'] = len(nl_keys)
    report['summary']['total_en_keys'] = len(en_keys)

    out_path = os.path.join(ROOT, 'scripts', 'i18n_coverage_report.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    # Print a human-readable summary
    print('\nI18N Coverage Report')
    print('Root:', ROOT)
    print('HTML pages scanned: %d' % total_pages)
    print('NL dictionary keys: %d' % len(nl_keys))
    print('EN dictionary keys: %d' % len(en_keys))
    print('\nPages missing both NL and EN includes:')
    if pages_missing_both_includes:
        for p in pages_missing_both_includes:
            print(' -', p)
    else:
        print(' - None (every page has at least one i18n include)')

    # Print pages with missing keys (brief)
    print('\nPages with missing NL/EN keys (first 20 pages shown):')
    shown = 0
    for p, info in report['pages'].items():
        if info['missing_in_nl'] or info['missing_in_en']:
            print('\n==', p)
            if info['missing_in_nl']:
                print('  Missing in NL (%d): %s' % (len(info['missing_in_nl']), ', '.join(info['missing_in_nl'][:20])))
            if info['missing_in_en']:
                print('  Missing in EN (%d): %s' % (len(info['missing_in_en']), ', '.join(info['missing_in_en'][:20])))
            shown += 1
            if shown >= 20:
                break

    print('\nFull report written to:', out_path)

if __name__ == '__main__':
    main()
