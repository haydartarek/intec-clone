# Fix split-layout unique-section issues in all program pages
# INTEC 2025 - CSS Structure Fix

$pages = @(
    "python.html",
    "systeembeheerder.html",
    "support.html"
)

foreach ($page in $pages) {
    $file = "c:\Users\heyde\Desktop\websites\intec-clone\$page"
    
    if (Test-Path $file) {
        Write-Host "Processing $page..." -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Fix split-layout unique-section to just split-layout
        $content = $content -replace 'class="split-layout unique-section"', 'class="split-layout"'
        
        # Fix unique-section__card to just card--highlight
        $content = $content -replace 'class="card card--highlight unique-section__card', 'class="card card--highlight'
        
        # Save the updated content
        $content | Set-Content $file -Encoding UTF8 -NoNewline
        
        Write-Host "Updated $page" -ForegroundColor Green
    }
}

Write-Host "`nAll pages fixed successfully!" -ForegroundColor Green
