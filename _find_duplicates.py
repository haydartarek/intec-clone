import cssutils
from pathlib import Path
sheet = cssutils.parseFile('assets/css/main.css')
from collections import defaultdict
rules_map = defaultdict(list)
for rule in sheet:
    if rule.type == rule.STYLE_RULE:
        props = tuple(sorted((p.name, p.value) for p in rule.style if p.name))
        rules_map[props].append(rule.selectorText)
duplicates = {k:v for k,v in rules_map.items() if len(v)>1}
for props, selectors in duplicates.items():
    if any(',' in s for s in selectors):
        continue
    joined = ', '.join(selectors)
    print(f'Duplicate [{len(selectors)}]: {joined}')
