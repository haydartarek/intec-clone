# Script to remove footer from all HTML pages

$files = @(
    'digipunt.html',
    'python.html', 
    'security.html',
    'support.html',
    'systeembeheerder.html',
    'inschrijven.html',
    'vacatures.html',
    'wiezijnwe.html',
    'cvdb\index.html'
)

foreach ($file in $files) {
    Write-Host "Processing $file..." -ForegroundColor Cyan
    
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Pattern to match footer section
    $pattern = '(?s)      <footer class="footer">.*?</footer>\s+    </div>'
    
    if ($content -match $pattern) {
        $content = $content -replace $pattern, '    </div>'
        Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✓ Removed footer from $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Footer pattern not found in $file" -ForegroundColor Yellow
    }
}

Write-Host "Done! All footers removed." -ForegroundColor Green
