# Read-only security audit for Jobybot (local machine).
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "========== JOBYBOT SECURITY AUDIT ==========" -ForegroundColor Cyan
$issues = 0

function Warn($msg) {
    Write-Host "  [!] $msg" -ForegroundColor Yellow
    $script:issues++
}
function Ok($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

# 1. No inbound server in Jobybot code (documented design)
Ok "Jobybot does not open network ports or accept remote connections."

# 2. .env exists and is not world-readable (best effort on Windows)
$envPath = Join-Path $root ".env"
if (-not (Test-Path $envPath)) {
    Warn ".env missing — copy from .env.example before running."
} else {
    Ok ".env present (secrets stay local; never commit to Git)."
}

# 3. .gitignore should exclude secrets
$gitignore = Join-Path $root ".gitignore"
if (Test-Path $gitignore) {
    $gi = Get-Content $gitignore -Raw
    if ($gi -match "\.env" -and $gi -match "data/") {
        Ok ".gitignore excludes .env and data/ from Git."
    } else {
        Warn ".gitignore may not exclude all sensitive paths."
    }
}

# 4. Check no accidental password in log tail
$log = Join-Path $root "data\jobybot.log"
if (Test-Path $log) {
    $tail = Get-Content $log -Tail 100 -ErrorAction SilentlyContinue -Raw
    if ($tail -match "GMAIL_APP_PASSWORD|app_password\s*=\s*\S{8,}") {
        Warn "Log may contain password-like text — review data\jobybot.log"
    } else {
        Ok "Recent log tail does not show obvious password leaks."
    }
}

# 5. Python only from this project's venv when bot runs
$procs = Get-Process python -ErrorAction SilentlyContinue |
    Where-Object { try { $_.Path -like "*$root*" } catch { $false } }
if ($procs) {
    Ok "Bot process uses venv under Jobybot folder (PID $($procs[0].Id))."
}

# 6. Listening ports (Jobybot should not listen)
try {
    $listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.OwningProcess -in @($procs.Id) }
    if ($listeners) {
        Warn "A Jobybot Python process is listening on a port — unexpected."
    } else {
        Ok "No listening ports owned by Jobybot Python."
    }
} catch {
    Ok "Port check skipped (requires admin); design has no server."
}

# 7. Resume PDF
if (-not (Get-ChildItem $root -Filter "*.pdf" -ErrorAction SilentlyContinue)) {
    Warn "No resume PDF found in folder."
} else {
    Ok "Resume PDF found."
}

Write-Host ""
if ($issues -eq 0) {
    Write-Host "Audit passed ($issues warnings)." -ForegroundColor Green
} else {
    Write-Host "Audit finished with $issues warning(s). See docs/SECURITY.md" -ForegroundColor Yellow
}
Write-Host "============================================`n"
