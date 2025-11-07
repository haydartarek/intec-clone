#!/usr/bin/env python3
"""Utility script to verify i18n key coverage across HTML and translation files."""

from __future__ import annotations

import argparse
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path
import re


KEY_VALUE_PATTERN = re.compile(r'"([^"]+)":\s*"((?:[^"\\]|\\.)*)"')
SKIP_ATTRS = {"data-i18n-allow-html"}
DEFAULT_EXCLUDE_DIRS = [".git", "node_modules", "reports"]


class I18nAttributeParser(HTMLParser):
    """Collects all data-i18n* attribute values within an HTML document."""

    def __init__(self) -> None:
        super().__init__()
        self.keys: set[str] = set()

    def handle_starttag(self, tag, attrs):  # type: ignore[override]
        for attr, value in attrs:
            if not attr or value is None:
                continue
            attr = attr.lower()
            if attr.startswith("data-i18n") and attr not in SKIP_ATTRS:
                for candidate in re.split(r"[,\s]+", value.strip()):
                    if candidate:
                        self.keys.add(candidate)


def load_translations(path: Path) -> dict[str, str]:
    """Parse a translation JS file and return a key/value mapping."""
    text = path.read_text(encoding="utf-8")
    translations: dict[str, str] = {}
    for match in KEY_VALUE_PATTERN.finditer(text):
        key, value = match.groups()
        translations[key] = value
    return translations


def collect_html_keys(root: Path, excludes: set[str]) -> dict[Path, set[str]]:
    """Return a mapping of html file -> set of data-i18n keys used."""
    results: dict[Path, set[str]] = {}
    for file_path in sorted(root.rglob("*.html")):
        try:
            rel_parts = file_path.relative_to(root).parts
        except ValueError:
            rel_parts = file_path.parts
        if any(part in excludes for part in rel_parts):
            continue
        parser = I18nAttributeParser()
        parser.feed(file_path.read_text(encoding="utf-8"))
        parser.close()
        results[file_path] = parser.keys
    return results


def format_path(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def print_group(title: str, values: list[str]) -> None:
    print(f"\n{title} ({len(values)}):")
    if not values:
        print("  (none)")
        return
    for value in values:
        print(f"  - {value}")


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(
        description="Check that all data-i18n keys have translations in en.js and nl.js."
    )
    parser.add_argument(
        "--html-root",
        default=repo_root,
        type=Path,
        help="Root folder to scan for *.html files (default: repository root).",
    )
    parser.add_argument(
        "--en",
        default=repo_root / "assets" / "js" / "i18n" / "en.js",
        type=Path,
        help="Path to the English translation file.",
    )
    parser.add_argument(
        "--nl",
        default=repo_root / "assets" / "js" / "i18n" / "nl.js",
        type=Path,
        help="Path to the Dutch translation file.",
    )
    parser.add_argument(
        "--exclude",
        nargs="*",
        default=DEFAULT_EXCLUDE_DIRS,
        help="Directory names to ignore while scanning HTML files.",
    )
    parser.add_argument(
        "--fail-on-missing",
        action="store_true",
        help="Exit with code 1 if any missing translations are detected.",
    )
    args = parser.parse_args()

    html_root = args.html_root.resolve()
    en_path = args.en.resolve()
    nl_path = args.nl.resolve()
    excludes = set(args.exclude)

    html_keys_by_file = collect_html_keys(html_root, excludes)
    all_html_keys = set().union(*html_keys_by_file.values()) if html_keys_by_file else set()

    en_translations = load_translations(en_path)
    nl_translations = load_translations(nl_path)

    en_keys = set(en_translations)
    nl_keys = set(nl_translations)

    missing_in_en = sorted(all_html_keys - en_keys)
    missing_in_nl = sorted(all_html_keys - nl_keys)
    en_only = sorted(en_keys - nl_keys)
    nl_only = sorted(nl_keys - en_keys)
    unused_keys = sorted((en_keys | nl_keys) - all_html_keys)

    print("=== Translation Coverage Report ===")
    print(f"HTML root        : {html_root}")
    print(f"HTML files scanned: {len(html_keys_by_file)}")
    print(f"Unique HTML keys : {len(all_html_keys)}")
    print(f"en.js keys       : {len(en_keys)}")
    print(f"nl.js keys       : {len(nl_keys)}")

    print_group("Missing keys in en.js", missing_in_en)
    print_group("Missing keys in nl.js", missing_in_nl)
    print_group("Keys only in en.js", en_only)
    print_group("Keys only in nl.js", nl_only)
    print_group("Unused translation keys", unused_keys)

    issues_by_file = defaultdict(lambda: {"en": [], "nl": []})
    for path, keys in html_keys_by_file.items():
        missing_en = sorted(keys - en_keys)
        missing_nl = sorted(keys - nl_keys)
        rel_path = format_path(path, html_root)
        if missing_en:
            issues_by_file[rel_path]["en"] = missing_en
        if missing_nl:
            issues_by_file[rel_path]["nl"] = missing_nl

    if issues_by_file:
        print("\n=== File level details ===")
        for rel_path in sorted(issues_by_file):
            en_missing = issues_by_file[rel_path]["en"]
            nl_missing = issues_by_file[rel_path]["nl"]
            if not en_missing and not nl_missing:
                continue
            print(f"\n{rel_path}:")
            if en_missing:
                print("  Missing in en.js:")
                for key in en_missing:
                    print(f"    - {key}")
            if nl_missing:
                print("  Missing in nl.js:")
                for key in nl_missing:
                    print(f"    - {key}")

    has_missing = bool(missing_in_en or missing_in_nl or en_only or nl_only)
    if args.fail_on_missing and has_missing:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
