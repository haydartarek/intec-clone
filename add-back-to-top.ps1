# Add Back to Top button to all HTML pages
$files = @(
    "contact.html",
    "inschrijven.html",
    "opleidingen.html",
    "overons.html",
    "python.html",
    "security.html",
    "support.html",
    "systeembeheerder.html",
    "vacatures.html",
    "wiezijnwe.html",
    "cvdb\index.html"
)

$backToTopButton = @"

    <!-- Back to Top Button -->
    <button class="back-to-top" id="backToTop" aria-label="رجوع للأعلى">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>

"@

foreach ($file in $files) {
    $filePath = Join-Path $PSScriptRoot $file
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw -Encoding UTF8
        
        # Find the position before the closing </body> tag
        if ($content -match '(.*?)(</body>)') {
            # Insert back-to-top button before </body>
            $newContent = $content -replace '(</body>)', "$backToTopButton`$1"
            Set-Content -Path $filePath -Value $newContent -Encoding UTF8 -NoNewline
            Write-Host "✅ Added back-to-top button to: $file" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Could not find </body> tag in: $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✨ Done! Back-to-top button added to all pages." -ForegroundColor Cyan
