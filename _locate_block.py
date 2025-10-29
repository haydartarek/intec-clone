from pathlib import Path
text = Path("assets/css/main.css").read_text(encoding="utf-8")
start = text.index("/* Accessibility */")
end = text.index("/* Buttons */")
print(start, end)
