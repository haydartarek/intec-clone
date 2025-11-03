# Migration Script: Old Classes to New Unified Classes
$files = @(
    "wiezijnwe.html",
    "vacatures.html", 
    "contact.html",
    "inschrijven.html",
    "support.html",
    "python.html",
    "security.html",
    "systeembeheerder.html"
)

foreach ($file in $files) {
    Write-Host "Processing $file..." -ForegroundColor Cyan
    $content = Get-Content $file -Raw -Encoding UTF8
    $originalContent = $content
    
    # Replace old classes with new unified classes
    $content = $content -replace 'class="card-grid card-grid--quadrant quadrant-grid"', 'class="programs-showcase__grid"'
    $content = $content -replace 'class="card-grid card-grid--quadrant phase-grid"', 'class="training-features__grid"'
    $content = $content -replace 'class="card-grid card-grid--columns-3 info-card-grid"', 'class="why-choose-intec__grid"'
    $content = $content -replace 'class="card-grid card-grid--features"', 'class="programs-showcase__grid"'
    
    if ($file -eq "vacatures.html") {
        $content = $content -replace 'class="card-grid card-grid--features" id="vacatures-grid"', 'class="programs-showcase__grid" id="vacatures-grid"'
    }
    
    if ($file -eq "inschrijven.html") {
        $content = $content -replace 'class="card-grid card-grid--quadrant register-prep-grid"', 'class="programs-showcase__grid register-prep-grid"'
    }
    
    if ($content -ne $originalContent) {
        $content | Set-Content $file -Encoding UTF8 -NoNewline
        Write-Host "Updated $file" -ForegroundColor Green
    } else {
        Write-Host "No changes for $file" -ForegroundColor Gray
    }
}

Write-Host "Migration complete!" -ForegroundColor Green
