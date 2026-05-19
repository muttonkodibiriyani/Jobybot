$root = Split-Path $PSScriptRoot -Parent
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
Get-ChildItem (Join-Path $root "data") -ErrorAction SilentlyContinue | ForEach-Object { Lock-Item $_.FullName }

Write-Host "[OK] Permissions tightened on .env and data\" -ForegroundColor Green
