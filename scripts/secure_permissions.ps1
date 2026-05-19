# Lock .env, database, and logs so only YOUR Windows user can read them.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$user = "$env:USERDOMAIN\$env:USERNAME"
Write-Host "Securing Jobybot folder for: $user" -ForegroundColor Cyan

function Lock-Item($path) {
    if (-not (Test-Path $path)) { return }
    icacls $path /inheritance:r 2>$null | Out-Null
    icacls $path /grant:r "${user}:(F)" 2>$null | Out-Null
    icacls $path /grant:r "SYSTEM:(F)" 2>$null | Out-Null
    icacls $path /grant:r "Administrators:(F)" 2>$null | Out-Null
}

Lock-Item (Join-Path $root ".env")
Lock-Item (Join-Path $root "data")
if (Test-Path (Join-Path $root "data\jobybot.db")) {
    Lock-Item (Join-Path $root "data\jobybot.db")
}
Get-ChildItem (Join-Path $root "data") -Filter "*.log" -ErrorAction SilentlyContinue | ForEach-Object {
    Lock-Item $_.FullName
}

Write-Host "[OK] Permissions tightened on .env and data\" -ForegroundColor Green
Write-Host "     Other users on this PC should not read your Gmail App Password." -ForegroundColor Gray
