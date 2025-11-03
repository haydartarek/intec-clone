# Migration Script: Old Classes → New Unified Classes
# This script updates all HTML files to use the new unified class system

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
    
    # Replace card-grid variations with new unified grids
    # quadrant-grid → programs-showcase__grid (for feature sections)
    $content = $content -replace 'class="card-grid card-grid--quadrant quadrant-grid"', 'class="programs-showcase__grid"'
    
    # phase-grid → training-features__grid (for phase/feature sections)  
    $content = $content -replace 'class="card-grid card-grid--quadrant phase-grid"', 'class="training-features__grid"'
    
    # info-card-grid → why-choose-intec__grid (for benefit sections)
    $content = $content -replace 'class="card-grid card-grid--columns-3 info-card-grid"', 'class="why-choose-intec__grid"'
    
    # card-grid--features → programs-showcase__grid (for feature grids)
    $content = $content -replace 'class="card-grid card-grid--features"', 'class="programs-showcase__grid"'
    
    # Special cases for specific files
    if ($file -eq "vacatures.html") {
        # Keep JavaScript generation as-is for now, just update the grid container
        $content = $content -replace 'class="card-grid card-grid--features" id="vacatures-grid"', 'class="programs-showcase__grid" id="vacatures-grid"'
    }
    
    if ($file -eq "inschrijven.html") {
        # register-prep-grid can stay but use new base class
        $content = $content -replace 'class="card-grid card-grid--quadrant register-prep-grid"', 'class="programs-showcase__grid register-prep-grid"'
    }
    
    # Save if changes were made
    if ($content -ne $originalContent) {
        $content | Set-Content $file -Encoding UTF8 -NoNewline
        Write-Host "✓ Updated $file" -ForegroundColor Green
    } else {
        Write-Host "○ No changes needed for $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Migration complete! All HTML files now use unified classes." -ForegroundColor Green
Write-Host "Next: Remove old CSS from base.css and main.css" -ForegroundColor Yellow
