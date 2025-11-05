#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
security = ROOT / 'security.html'
en = ROOT / 'assets' / 'js' / 'i18n' / 'en.js'
nl = ROOT / 'assets' / 'js' / 'i18n' / 'nl.js'

if not security.exists():
    print('security.html not found')
    sys.exit(2)

text = security.read_text(encoding='utf-8')
keys = set(re.findall(r'data-i18n="([^"]+)"', text))

en_text = en.read_text(encoding='utf-8') if en.exists() else ''
nl_text = nl.read_text(encoding='utf-8') if nl.exists() else ''

missing_en = []
missing_nl = []
for k in sorted(keys):
    if k not in en_text:
        missing_en.append(k)
    if k not in nl_text:
        missing_nl.append(k)

print(f'Total i18n keys found in security.html: {len(keys)}')
print('\nMissing in en.js:')
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

# exit 1 if any missing
sys.exit(1 if missing_en or missing_nl else 0)
