# Jobybot — One-shot installer for friends (non-technical users)
# Called by SETUP_FOR_FRIENDS.bat
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
Set-Location $root

function Step($n, $msg) {
    Write-Host ""
    Write-Host "=== Step $n — $msg ===" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "  JOBYBOT SETUP FOR FRIENDS" -ForegroundColor Yellow
Write-Host "  This installs Python packages, checks Gmail, and starts the bot."
Write-Host "  Official download: https://github.com/muttonkodibiriyani/Jobybot"
Write-Host ""

Step 1 "Allow PowerShell scripts (once per PC)"
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
Write-Host "[OK] Execution policy set for your user only."

Step 2 "Find Python 3.10+"
$python = $null
foreach ($cmd in @("python", "py", "python3")) {
    try {
        $v = & $cmd --version 2>$null
        if ($v -match "Python 3\.(1[0-9]|[2-9][0-9])") {
            $python = $cmd
            Write-Host "[OK] $v"
            break
        }
    } catch {}
}
if (-not $python) {
    Write-Host ""
    Write-Host "Python not found. Install from https://www.python.org/downloads/" -ForegroundColor Red
    Write-Host "Tick: Add python.exe to PATH. Then run SETUP_FOR_FRIENDS.bat again."
    Read-Host "Press ENTER to exit"
    exit 1
}

Step 3 "Create virtual environment"
if (-not (Test-Path ".venv")) {
    & $python -m venv .venv
}
$venvPy = Join-Path $root ".venv\Scripts\python.exe"
Write-Host "[OK] .venv ready"

Step 4 "Install dependencies"
& $venvPy -m pip install --upgrade pip --quiet
& $venvPy -m pip install -r python-deps.txt --quiet
Write-Host "[OK] Libraries installed"

# Easy Apply requires a one-time Chromium download (~150MB). We only fetch it
# if the user has opted in via ENABLE_EASY_APPLY=true in their .env, so the
# default friend setup stays small.
$envFile = Join-Path $root ".env"
if ((Test-Path $envFile) -and (Select-String -Path $envFile -Pattern '^\s*ENABLE_EASY_APPLY\s*=\s*true' -Quiet -ErrorAction SilentlyContinue)) {
    Step "4b" "Easy Apply enabled - downloading Chromium (one-time, ~150MB)"
    & $venvPy -m playwright install chromium
    Write-Host "[OK] Chromium installed for Easy Apply"
} else {
    Write-Host "[i] Easy Apply not enabled in .env - skipping Chromium download" -ForegroundColor DarkGray
}

Step 5 "Your settings file (.env)"
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "IMPORTANT: Notepad will open. Fill in:" -ForegroundColor Yellow
    Write-Host "  - Your name, email, phone, LinkedIn"
    Write-Host "  - GMAIL_ADDRESS and GMAIL_APP_PASSWORD (from https://myaccount.google.com/apppasswords)"
    Write-Host "  - Put resume.pdf in this folder"
    Write-Host ""
    Start-Process notepad (Join-Path $root ".env") -Wait
} else {
    Write-Host "[OK] .env already exists"
}

Step 6 "Resume PDF"
$pdfs = Get-ChildItem $root -Filter "*.pdf" -ErrorAction SilentlyContinue
if (-not $pdfs) {
    Write-Host "[!] No PDF resume in folder. Add resume.pdf before emails will attach." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Found: $($pdfs[0].Name)"
}

Step 7 "Lock secret files (security)"
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts\secure_permissions.ps1")

Step 8 "Health check + Gmail test"
& $venvPy jobybot.py init
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Init failed. Fix .env and resume, then run SETUP_FOR_FRIENDS.bat again." -ForegroundColor Red
    Read-Host "Press ENTER"
    exit 1
}

Step 9 "Security audit"
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts\security_audit.ps1")

Step 10 "Enable auto-start (login + daily 9 AM backup task)"
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts\enable_autostart.ps1")

Step 11 "Start bot in background"
$running = Get-Process python -ErrorAction SilentlyContinue |
    Where-Object { try { $_.Path -like "*$root*" } catch { $false } }
if (-not $running) {
    Start-Process -WindowStyle Hidden -FilePath $venvPy `
        -ArgumentList "jobybot.py", "schedule" -WorkingDirectory $root
    Start-Sleep -Seconds 2
    Write-Host "[OK] Scheduler started in background (hourly cycles)."
} else {
    Write-Host "[OK] Bot was already running."
}

Step 12 "First job search + emails (optional)"
$ans = Read-Host "Run first full cycle now? Takes 15-30 min [Y/n]"
if ($ans -ne "n" -and $ans -ne "N") {
    & $venvPy jobybot.py run
}

Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "  Daily control:  double-click JOBYBOT.bat"
Write-Host "  Run now:        double-click RUN_BOT_NOW.bat"
Write-Host "  All commands:   docs\POWERSHELL_COMPLETE.md"
Write-Host "  Job inbox:      data\click_apply_inbox.html"
Write-Host "  Logs:           data\jobybot.log"
Write-Host ""
Write-Host "  NEVER share your .env file — it contains your Gmail App Password."
Write-Host ""
