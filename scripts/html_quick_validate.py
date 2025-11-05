#!/usr/bin/env python3
"""
Quick, heuristic HTML validator — checks for unbalanced tags.
Does not replace a full validator (like validator.w3.org) but finds common mistakes
such as missing closing tags or stray closing tags produced by manual edits.

Usage: python scripts/html_quick_validate.py path/to/file1.html path/to/file2.html
"""
import re
import sys
from pathlib import Path

VOID_TAGS = set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'])

TAG_RE = re.compile(r'<\s*(/)?\s*([a-zA-Z0-9:-]+)([^>]*)>', re.IGNORECASE)
SCRIPT_STYLE_RE = re.compile(r'<(script|style)(?:[^>]*)>.*?</\1>', re.IGNORECASE|re.DOTALL)
COMMENT_RE = re.compile(r'<!--.*?-->', re.DOTALL)


def line_col_from_pos(text, pos):
    # 1-based line and column
    line = text.count('\n', 0, pos) + 1
    try:
        col = pos - text.rfind('\n', 0, pos)
    except Exception:
        col = 1
    return line, col


def validate_html_text(text):
    # remove comments and script/style content to avoid false positives
    cleaned = COMMENT_RE.sub('', text)
    cleaned = SCRIPT_STYLE_RE.sub(lambda m: '<' + m.group(1) + '>...</' + m.group(1) + '>', cleaned)

    stack = []
    errors = []

    for m in TAG_RE.finditer(cleaned):
        full = m.group(0)
        is_close = bool(m.group(1))
        tag = m.group(2).lower()
        attrs = m.group(3) or ''
        pos = m.start()
        line, col = line_col_from_pos(cleaned, pos)

        # ignore doctype or comments (doctype starts with <! and we've removed comments)
        if tag.startswith('!') or tag.startswith('?'):
            continue

        # self-closing detection
        self_closing = attrs.strip().endswith('/')

        if is_close:
            if stack and stack[-1] == tag:
                stack.pop()
            else:
                # try to find matching tag deeper in stack
                if tag in stack:
                    # pop until we remove the tag, but warn about mismatched nesting
                    while stack and stack[-1] != tag:
                        popped = stack.pop()
                        errors.append((line, col, f"Unclosed <{popped}> before closing </{tag}>") )
                    if stack and stack[-1] == tag:
                        stack.pop()
                else:
                    errors.append((line, col, f"Stray closing tag </{tag}> with no matching opening tag"))
        else:
            # opening tag
            if tag in VOID_TAGS or self_closing:
                # void/self-closing tags — ignore
                continue
            else:
                stack.append(tag)

    # any tags left open
    while stack:
        unclosed = stack.pop()
        errors.append((None, None, f"Unclosed <{unclosed}> at end of document"))

    return errors


def validate_file(path: Path):
    text = path.read_text(encoding='utf-8')
    errors = validate_html_text(text)
    return errors


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: html_quick_validate.py file1.html [file2.html ...]')
        sys.exit(2)

    any_error = False
    for p in sys.argv[1:]:
        path = Path(p)
        if not path.exists():
            print(f"[ERROR] File not found: {path}")
            any_error = True
            continue
        print(f"\nValidating: {path}\n{'-'*60}")
        errors = validate_file(path)
        if not errors:
            print("OK — no obvious unbalanced tags found (heuristic check).")
        else:
            any_error = True
            for e in errors:
                line, col, msg = e
                if line is not None:
                    print(f"Line {line}: {msg}")
                else:
                    print(f"{msg}")
    sys.exit(1 if any_error else 0)
