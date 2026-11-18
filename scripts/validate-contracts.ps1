$ErrorActionPreference = "Stop"
$contractFile = "docs/08-api-contract.md"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Validating Universal API Contract: $contractFile" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $contractFile)) {
    Write-Host "[ERROR] $contractFile does not exist." -ForegroundColor Red
    exit 1
}

$content = Get-Content $contractFile -Raw
$errors = 0

if ($content -notmatch "Base URL") {
    Write-Host "[FAIL] Missing 'Base URL' definition." -ForegroundColor Red
    $errors++
} else {
    Write-Host "[OK] Base URL definition present." -ForegroundColor Green
}

if ($content -notmatch "(GET|POST|PUT|PATCH|DELETE) /") {
    Write-Host "[FAIL] No HTTP endpoints (GET/POST/PUT/PATCH/DELETE) documented." -ForegroundColor Red
    $errors++
} else {
    Write-Host "[OK] HTTP endpoints documented." -ForegroundColor Green
}

if ($content -notmatch "sendResponse|success") {
    Write-Host "[FAIL] Missing standardized response envelope specification." -ForegroundColor Red
    $errors++
} else {
    Write-Host "[OK] Standardized sendResponse envelope documented." -ForegroundColor Green
}

if ($errors -eq 0) {
    Write-Host "`nSUCCESS: API Contract format is valid (0 issues)." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nWARNING: API Contract validation failed with $errors issues." -ForegroundColor Yellow
    exit 1
}
