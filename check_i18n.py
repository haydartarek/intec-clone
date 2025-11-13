import re
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).parent.resolve()
IGNORED_DIRS = {'.git', 'node_modules'}
EXTRA_ATTRS = ['data-i18n', 'data-i18n-placeholder', 'data-i18n-aria-label']
PATTERN = re.compile(r'"([^"\\]+)"\s*:\s*"(.*?)"', re.DOTALL)


def should_skip(path: Path) -> bool:
    return any(part in IGNORED_DIRS for part in path.parts)


def collect_html_files() -> list[Path]:
    return sorted(
        path for path in ROOT.rglob('*.html')
        if not should_skip(path)
    )


def collect_keys(html_files: list[Path]) -> set[str]:
    keys: set[str] = set()
    for file in html_files:
        soup = BeautifulSoup(file.read_text(encoding='utf-8'), 'html.parser')
        for attr in EXTRA_ATTRS:
            for el in soup.select(f'[{attr}]'):
                val = el.get(attr)
                if val:
                    keys.add(val.strip())
    return keys


def load_dict(path: Path) -> dict[str, str]:
    entries: dict[str, str] = {}
    text = path.read_text(encoding='utf-8')
    for match in PATTERN.finditer(text):
        key, value = match.groups()
        entries[key] = value
    return entries


def main():
    html_files = collect_html_files()
    keys = collect_keys(html_files)

    en = load_dict(ROOT / 'assets/js/i18n/en.js')
    nl = load_dict(ROOT / 'assets/js/i18n/nl.js')

    missing_en = sorted(keys - en.keys())
    missing_nl = sorted(keys - nl.keys())
    unused_en = sorted(en.keys() - keys)
    unused_nl = sorted(nl.keys() - keys)

    print('Scanned HTML files:', len(html_files))
    print('Total keys in HTML:', len(keys))
    print('Missing in en:', len(missing_en))
    for k in missing_en:
        print('  ', k)
    print('Missing in nl:', len(missing_nl))
    for k in missing_nl:
        print('  ', k)
    print('Unused en keys:', len(unused_en))
    print('Unused nl keys:', len(unused_nl))


if __name__ == '__main__':
    main()
