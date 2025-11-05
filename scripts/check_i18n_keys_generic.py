#!/usr/bin/env python3
from pathlib import Path
import re
import sys

if len(sys.argv) < 2:
    print('Usage: check_i18n_keys_generic.py path/to/page.html')
    sys.exit(2)

ROOT = Path(__file__).resolve().parents[1]
page = ROOT / sys.argv[1]
en = ROOT / 'assets' / 'js' / 'i18n' / 'en.js'
nl = ROOT / 'assets' / 'js' / 'i18n' / 'nl.js'

if not page.exists():
    print(f'Page not found: {page}')
    sys.exit(2)

text = page.read_text(encoding='utf-8')
keys = set(re.findall(r'data-i18n="([^"]+)"', text))
en_text = en.read_text(encoding='utf-8') if en.exists() else ''
nl_text = nl.read_text(encoding='utf-8') if nl.exists() else ''
missing_en = [k for k in sorted(keys) if k not in en_text]
missing_nl = [k for k in sorted(keys) if k not in nl_text]
print(f'Total i18n keys found in {page.name}: {len(keys)}\n')
print('Missing in en.js:')
if missing_en:
    for k in missing_en:
        print('  ' + k)
else:
    print('  None')
print('\nMissing in nl.js:')
if missing_nl:
    for k in missing_nl:
        print('  ' + k)
else:
    print('  None')
sys.exit(1 if missing_en or missing_nl else 0)
