# Fix split-layout structure in all program pages
# Replace mixed old/new classes with consistent new structure

$pages = @(
    "support.html",
    "python.html",
    "security.html",
    "systeembeheerder.html"
)

foreach ($page in $pages) {
    Write-Host "Processing $page..." -ForegroundColor Cyan
    $content = Get-Content $page -Raw -Encoding UTF8
    $originalContent = $content
    
    # Fix inside split-layout sections:
    # Replace card__header with feature-card__header
    $content = $content -replace '(<div class="split-layout">.*?)<div class="card__header align-start">', '$1<div class="feature-card__header align-start">'
    
    # Replace card__eyebrow with feature-card__eyebrow
    $content = $content -replace '(<div class="split-layout">.*?)<span class="card__eyebrow"', '$1<span class="feature-card__eyebrow"'
    
    # More precise: fix within split-layout context using multiline
    $content = $content -replace '(?s)(split-layout.*?)(card__header)(?=.*?</article>.*?</article>.*?</div>)', '$1feature-card__header'
    $content = $content -replace '(?s)(split-layout.*?)(card__eyebrow)(?=.*?</article>.*?</article>.*?</div>)', '$1feature-card__eyebrow'
    
    if ($content -ne $originalContent) {
        $content | Set-Content $page -Encoding UTF8 -NoNewline
        Write-Host "✓ Fixed $page" -ForegroundColor Green
    } else {
        Write-Host "○ No changes for $page" -ForegroundColor Gray
    }
}

Write-Host "`nSplit-layout structure fixed!" -ForegroundColor Green
