import json
import logging
import os
import re
import subprocess
from collections import Counter, defaultdict
from pathlib import Path

from lxml import etree, html

PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_JSON = PROJECT_ROOT / "reports" / "phase-00-preflight-scan.json"
EXCLUDE_DIRS = {".git", "node_modules", ".vscode", "scripts", "reports"}
HTML_EXT = {".html"}
CSS_EXT = {".css"}
JS_EXT = {".js"}
VALID_ROLES = {
    "alert", "alertdialog", "application", "article", "banner", "button", "cell",
    "checkbox", "columnheader", "combobox", "complementary", "contentinfo",
    "definition", "dialog", "directory", "document", "feed", "figure", "form",
    "grid", "gridcell", "group", "heading", "img", "link", "list", "listbox",
    "listitem", "log", "main", "marquee", "math", "menu", "menubar", "menuitem",
    "menuitemcheckbox", "menuitemradio", "navigation", "none", "note", "option",
    "presentation", "progressbar", "radio", "radiogroup", "region", "row",
    "rowgroup", "rowheader", "scrollbar", "search", "searchbox", "separator",
    "slider", "spinbutton", "status", "switch", "tab", "table", "tablist",
    "tabpanel", "term", "textbox", "timer", "toolbar", "tooltip", "tree",
    "treegrid", "treeitem"
}


def should_skip(path: Path) -> bool:
    return any(part in EXCLUDE_DIRS for part in path.parts)


def collect_files(extensions: set[str]) -> list[Path]:
    files: list[Path] = []
    for path in PROJECT_ROOT.rglob("*"):
        if path.is_file() and path.suffix.lower() in extensions and not should_skip(path):
            files.append(path)
    return sorted(files)


def is_external_reference(value: str) -> bool:
    value = value.strip()
    if not value:
        return True
    lowered = value.lower()
    return lowered.startswith(("http://", "https://", "//", "mailto:", "tel:", "data:", "javascript:"))


def resolve_reference(src: str, current_file: Path) -> Path:
    normalized = src.split("?")[0].split("#")[0]
    if normalized.startswith("/"):
        return PROJECT_ROOT / normalized.lstrip("/")
    return (current_file.parent / normalized).resolve()


def scan_html_files(html_files: list[Path]):
    issues = []
    script_refs: set[tuple[str, Path]] = set()
    asset_refs: list[dict] = []
    aria_issues = []
    duplicate_id_details = []

    strict_parser = etree.HTMLParser(recover=False)
    lenient_parser = etree.HTMLParser(recover=True)

    for file_path in html_files:
        text = file_path.read_text(encoding="utf-8", errors="ignore")
        file_issues = []
        try:
            etree.fromstring(text.encode("utf-8"), parser=strict_parser)
        except etree.XMLSyntaxError as exc:
            file_issues.append(f"Syntax error: {exc}")
        tree = etree.fromstring(text.encode("utf-8"), parser=lenient_parser)
        ids = [el.get("id") for el in tree.xpath('//*[@id]')]
        duplicates = [value for value, count in Counter(ids).items() if value and count > 1]
        if duplicates:
            duplicate_id_details.append({
                "file": str(file_path.relative_to(PROJECT_ROOT)),
                "duplicates": duplicates
            })
            file_issues.append(f"Duplicate ids detected: {', '.join(sorted(duplicates))}")

        for el in tree.xpath('//*[@role]'):
            role_value = el.get("role", "").strip()
            if not role_value:
                aria_issues.append({
                    "file": str(file_path.relative_to(PROJECT_ROOT)),
                    "element": etree.ElementTree(el).getpath(el),
                    "issue": "Empty role attribute"
                })
                continue
            invalid_roles = [role for role in role_value.split() if role not in VALID_ROLES]
            if invalid_roles:
                aria_issues.append({
                    "file": str(file_path.relative_to(PROJECT_ROOT)),
                    "element": etree.ElementTree(el).getpath(el),
                    "issue": f"Invalid role(s): {', '.join(invalid_roles)}"
                })
                file_issues.append(f"Invalid role(s) {', '.join(invalid_roles)} at {etree.ElementTree(el).getpath(el)}")

        for el in tree.xpath('//*'):
            for attr, value in el.attrib.items():
                if attr.startswith("aria-") and not value.strip():
                    aria_issues.append({
                        "file": str(file_path.relative_to(PROJECT_ROOT)),
                        "element": etree.ElementTree(el).getpath(el),
                        "issue": f"Empty {attr}"
                    })
                    file_issues.append(f"Empty {attr} at {etree.ElementTree(el).getpath(el)}")

        for script in tree.xpath('//script[@src]'):
            src = script.get("src", "").strip()
            if src and not is_external_reference(src):
                script_refs.add((src, file_path))
                asset_refs.append({
                    "file": str(file_path.relative_to(PROJECT_ROOT)),
                    "tag": "script",
                    "attribute": "src",
                    "value": src
                })

        for link in tree.xpath('//link[@href]'):
            rel = (link.get("rel", "") or "").lower()
            href = link.get("href", "").strip()
            if rel in {"stylesheet", "preload", "icon", "apple-touch-icon"} and href and not is_external_reference(href):
                asset_refs.append({
                    "file": str(file_path.relative_to(PROJECT_ROOT)),
                    "tag": "link",
                    "attribute": "href",
                    "value": href
                })

        for attr_name in ("src", "data-src", "poster"):
            xpath_query = f"//*[@{attr_name}]"
            for el in tree.xpath(xpath_query):
                value = el.get(attr_name, "").strip()
                if value and not is_external_reference(value):
                    asset_refs.append({
                        "file": str(file_path.relative_to(PROJECT_ROOT)),
                        "tag": el.tag,
                        "attribute": attr_name,
                        "value": value
                    })

        if file_issues:
            issues.append({
                "file": str(file_path.relative_to(PROJECT_ROOT)),
                "issues": file_issues
            })

    return issues, aria_issues, duplicate_id_details, script_refs, asset_refs


def scan_css_files(css_files: list[Path]):
    issues_by_file: dict[str, list[str]] = defaultdict(list)

    for css_file in css_files:
        text = css_file.read_text(encoding="utf-8", errors="ignore")
        brace_delta = text.count("{") - text.count("}")
        if brace_delta != 0:
            issues_by_file[str(css_file.relative_to(PROJECT_ROOT))].append(
                f"Brace mismatch: {brace_delta:+d}"
            )

    validator_script = PROJECT_ROOT / "scripts" / "validate_css.js"
    if validator_script.exists():
        cmd = ["node", str(validator_script), *[str(path.relative_to(PROJECT_ROOT)) for path in css_files]]
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=PROJECT_ROOT)
        if result.returncode != 0:
            issues_by_file["__general__"].append(
                f"CSS validator failed: {result.stderr.strip() or result.stdout.strip()}"
            )
        else:
            try:
                validator_results = json.loads(result.stdout.strip() or "[]")
            except json.JSONDecodeError as exc:
                issues_by_file["__general__"].append(f"Invalid CSS validator output: {exc}")
            else:
                for entry in validator_results:
                    file_key = entry.get("file", "unknown")
                    reason = entry.get("reason", "Unknown issue")
                    line = entry.get("line")
                    column = entry.get("column")
                    if line is not None and column is not None:
                        message = f"{reason} (line {line}, column {column})"
                    else:
                        message = reason
                    issues_by_file[file_key].append(message)
    else:
        issues_by_file["__general__"].append("CSS validator script missing")

    css_issues = []
    for file_key, messages in sorted(issues_by_file.items()):
        css_issues.append({
            "file": file_key,
            "issues": messages
        })

    return css_issues


def validate_js(script_refs: set[tuple[str, Path]], js_files: list[Path]):
    missing_scripts = []
    for src, html_file in sorted(script_refs):
        resolved = resolve_reference(src, html_file)
        if not resolved.exists():
            missing_scripts.append({
                "html": str(html_file.relative_to(PROJECT_ROOT)),
                "src": src
            })

    syntax_issues = []
    for js_file in js_files:
        if should_skip(js_file):
            continue
        result = subprocess.run(
            ["node", "--check", str(js_file)],
            capture_output=True,
            text=True,
            cwd=PROJECT_ROOT
        )
        if result.returncode != 0:
            syntax_issues.append({
                "file": str(js_file.relative_to(PROJECT_ROOT)),
                "error": result.stderr.strip() or result.stdout.strip()
            })

    return missing_scripts, syntax_issues


def check_i18n():
    script_path = PROJECT_ROOT / "scripts" / "check_i18n_keys.js"
    if not script_path.exists():
        return {"status": "error", "details": "check_i18n_keys.js missing"}
    result = subprocess.run(
        ["node", str(script_path)],
        capture_output=True,
        text=True,
        cwd=PROJECT_ROOT
    )
    if result.returncode != 0:
        return {
            "status": "error",
            "details": result.stderr.strip() or result.stdout.strip()
        }
    try:
        data = json.loads(result.stdout.strip())
    except json.JSONDecodeError as exc:
        return {
            "status": "error",
            "details": f"Unable to parse i18n checker output: {exc}"
        }
    return data


def evaluate_assets(asset_refs: list[dict]):
    missing_assets = []
    for entry in asset_refs:
        file_path = PROJECT_ROOT / entry["file"]
        ref = entry["value"]
        resolved = resolve_reference(ref, file_path)
        if not resolved.exists():
            missing_assets.append({
                "file": entry["file"],
                "tag": entry["tag"],
                "attribute": entry["attribute"],
                "value": ref
            })
    return missing_assets


def main():
    reports_dir = PROJECT_ROOT / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    html_files = collect_files(HTML_EXT)
    css_files = collect_files(CSS_EXT)
    js_files = collect_files(JS_EXT)

    html_issues, aria_issues, duplicate_ids, script_refs, asset_refs = scan_html_files(html_files)
    css_issues = scan_css_files(css_files)
    missing_scripts, js_syntax = validate_js(script_refs, js_files)
    i18n_report = check_i18n()
    missing_assets = evaluate_assets(asset_refs)

    report = {
        "summary": {
            "html_files": len(html_files),
            "css_files": len(css_files),
            "js_files": len(js_files)
        },
        "html": {
            "issues": html_issues,
            "aria_issues": aria_issues,
            "duplicate_ids": duplicate_ids
        },
        "css": {
            "issues": css_issues
        },
        "javascript": {
            "missing_scripts": missing_scripts,
            "syntax_issues": js_syntax
        },
        "i18n": i18n_report,
        "assets": {
            "missing": missing_assets
        }
    }

    OUTPUT_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))


if __name__ == "__main__":
    main()
