#!/usr/bin/env python3
import re
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
nl = ROOT / 'assets' / 'js' / 'i18n' / 'nl.js'
security = ROOT / 'security.html'
text = nl.read_text(encoding='utf-8')
sec_text = security.read_text(encoding='utf-8')
keys = sorted(set(re.findall(r'data-i18n="([^"]+)"', sec_text)))

pairs = {}
for k in keys:
    m = re.search(r'"' + re.escape(k) + r'"\s*:\s*"([\s\S]*?)"\s*,', text)
    if m:
        val = m.group(1)
        # unescape common sequences
        val = val.replace('\\n','\n')
        pairs[k]=val

print(json.dumps(pairs, ensure_ascii=False, indent=2))
