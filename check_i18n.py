import re
from pathlib import Path
from bs4 import BeautifulSoup

html_files=[Path('python.html'),Path('security.html'),Path('support.html'),Path('systeembeheerder.html')]
keys=set()
extra_attrs=['data-i18n','data-i18n-placeholder','data-i18n-aria-label']
for file in html_files:
    soup=BeautifulSoup(file.read_text(encoding='utf-8'), 'html.parser')
    for attr in extra_attrs:
        for el in soup.select(f'[{attr}]'):
            val=el.get(attr)
            if val:
                keys.add(val.strip())

pattern=re.compile(r'"([^"\\]+)"\s*:\s*"(.*?)"', re.DOTALL)

def load_dict(path):
    text=Path(path).read_text(encoding='utf-8')
    entries=dict()
    for match in pattern.finditer(text):
        key,value=match.groups()
        entries[key]=value
    return entries

en=load_dict('assets/js/i18n/en.js')
nl=load_dict('assets/js/i18n/nl.js')
missing_en=sorted(keys - en.keys())
missing_nl=sorted(keys - nl.keys())
unused_en=sorted(en.keys() - keys)
unused_nl=sorted(nl.keys() - keys)
print('Total keys in HTML:', len(keys))
print('Missing in en:', len(missing_en))
for k in missing_en:
    print('  ',k)
print('Missing in nl:', len(missing_nl))
for k in missing_nl:
    print('  ',k)
print('Unused en keys:', len(unused_en))
print('Unused nl keys:', len(unused_nl))
