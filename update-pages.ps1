# Update all HTML pages (except index.html) with new class names
# INTEC 2025 - Unified Sections System

$pages = @(
    "python.html",
    "security.html",
    "systeembeheerder.html",
    "support.html",
    "contact.html",
    "digipunt.html",
    "inschrijven.html",
    "overons.html",
    "wiezijnwe.html",
    "vacatures.html"
)

foreach ($page in $pages) {
    $file = "c:\Users\heyde\Desktop\websites\intec-clone\$page"
    
    if (Test-Path $file) {
        Write-Host "Processing $page..." -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw -Encoding UTF8
        
        # Replace old card classes with new ones
        $content = $content -replace 'class="card card--feature', 'class="feature-card'
        $content = $content -replace 'class="card__header"', 'class="feature-card__header"'
        $content = $content -replace 'class="card__icon', 'class="feature-card__icon'
        $content = $content -replace 'class="card__title"', 'class="feature-card__title"'
        $content = $content -replace 'class="card__body"', 'class="feature-card__list"'
        $content = $content -replace 'class="card__list"', 'class="feature-card__list"'
        
        # Replace section classes
        $content = $content -replace 'class="section section--surface"', 'class="why-choose-intec"'
        $content = $content -replace 'class="section program-highlight-section"', 'class="training-features"'
        
        # Replace card grids
        $content = $content -replace 'class="card-grid card-grid--features program-feature-grid"', 'class="training-features__grid"'
        $content = $content -replace 'class="card-grid card-grid--feature"', 'class="programs-showcase__grid"'
        
        # Replace info cards
        $content = $content -replace 'class="info-card-grid"', 'class="why-choose-intec__grid"'
        $content = $content -replace 'class="info-card', 'class="benefit-card'
        $content = $content -replace 'class="info-card__title"', 'class="benefit-card__title"'
        $content = $content -replace 'class="info-card__text"', 'class="benefit-card__text"'
        
        # Replace CTA sections
        $content = $content -replace 'class="section cta-band cta-band--minimal"', 'class="enrollment-cta"'
        $content = $content -replace 'class="cta-band__inner container"', 'class="enrollment-cta__content container"'
        $content = $content -replace 'class="cta-band__content"', 'class="enrollment-cta__content"'
        $content = $content -replace 'class="cta-band__eyebrow"', 'class="enrollment-cta__eyebrow"'
        $content = $content -replace 'class="cta-band__actions"', 'class="enrollment-cta__actions"'
        
        # Save the updated content
        $content | Set-Content $file -Encoding UTF8 -NoNewline
        
        Write-Host "Updated $page" -ForegroundColor Green
    }
}

Write-Host "`nAll pages updated successfully!" -ForegroundColor Green
