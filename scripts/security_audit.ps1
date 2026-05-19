$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host ""
Write-Host "========== JOBYBOT SECURITY AUDIT ==========" -ForegroundColor Cyan
$issues = 0

function Warn($msg) { Write-Host "  [!] $msg" -ForegroundColor Yellow; $script:issues++ }
function Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }

Ok "Jobybot does not open network ports."

if (-not (Test-Path (Join-Path $root ".env"))) { Warn ".env missing" } else { Ok ".env present (keep private)" }

$gi = Get-Content (Join-Path $root ".gitignore") -Raw -ErrorAction SilentlyContinue
if ($gi -match "\.env") { Ok ".gitignore excludes .env" } else { Warn ".gitignore may not exclude .env" }

$log = Join-Path $root "data\jobybot.log"
if ((Test-Path $log) -and ((Get-Content $log -Tail 50 -Raw) -match "GMAIL_APP_PASSWORD")) {
    Warn "Log may contain password text"
} else {
    Ok "Log tail looks clean"
}

$procs = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -like "*$root*" -and $_.CommandLine -like "*jobybot.py*" }
if ($procs) { Ok "Bot process running (PID $($procs[0].ProcessId))" }

Write-Host ""
if ($issues -eq 0) { Write-Host "Audit passed." -ForegroundColor Green }
else { Write-Host "Audit: $issues warning(s). See docs/SECURITY.md" -ForegroundColor Yellow }
Write-Host "============================================`n"
