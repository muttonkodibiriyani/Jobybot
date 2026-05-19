# Jobybot — Enterprise Windows Installer
# Usage:  PowerShell -ExecutionPolicy Bypass -File install.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Print-Step($n, $m) {
    Write-Host ""
    Write-Host "═══ Step $n — $m ═══" -ForegroundColor Cyan
}

Print-Step 1 "Check Python 3.10+"
$python = $null
foreach ($cmd in @("python", "py", "python3")) {
    try {
        $v = & $cmd --version 2>$null
        if ($v -match "Python 3\.(1[0-9]|[2-9][0-9])") {
            $python = $cmd
            Write-Host "✓ Found: $v ($cmd)"
            break
        }
    } catch {}
}
if (-not $python) {
    Write-Host "Python 3.10+ not found. Installing via winget..." -ForegroundColor Yellow
    winget install --id Python.Python.3.12 -e --silent
    $python = "python"
    Write-Host "Re-run this script after Python installation completes."
    exit 0
}

Print-Step 2 "Create virtual environment"
if (-not (Test-Path ".venv")) {
    & $python -m venv .venv
}
$pip = ".\.venv\Scripts\pip.exe"
$venvPy = ".\.venv\Scripts\python.exe"
Write-Host "✓ venv ready: .venv\"

Print-Step 3 "Install dependencies"
& $venvPy -m pip install --upgrade pip --quiet
& $pip install -r requirements.txt --quiet
Write-Host "✓ Dependencies installed"

Print-Step 4 "Create .env from template"
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env created — EDIT IT WITH YOUR DETAILS:" -ForegroundColor Yellow
    Write-Host "    notepad .env" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press ENTER when you've filled in .env"
} else {
    Write-Host "✓ .env already exists"
}

Print-Step 5 "Ensure resume PDF is present"
$envContent = Get-Content ".env" -Raw
if ($envContent -match "RESUME_PATH=(.+)") {
    $resumePath = $matches[1].Trim().Trim('"')
    if (-not (Test-Path $resumePath)) {
        Write-Host "⚠ Resume not found at: $resumePath" -ForegroundColor Yellow
        Write-Host "Place your CV PDF in this folder and update RESUME_PATH in .env"
        Read-Host "Press ENTER when ready"
    } else {
        Write-Host "✓ Resume: $resumePath"
    }
}

Print-Step 6 "Secure local secrets (.env permissions)"
& powershell -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot\scripts\secure_permissions.ps1"

Print-Step 7 "Run init (parse resume, test SMTP)"
& $venvPy jobybot.py init

Print-Step 8 "Run one cycle now"
$ans = Read-Host "Run a full cycle now? (search + emails) [y/N]"
if ($ans -eq "y" -or $ans -eq "Y") {
    & $venvPy jobybot.py run
}

Print-Step 9 "Start 24/7 background scheduler"
$ans = Read-Host "Start hourly scheduler in background? [y/N]"
if ($ans -eq "y" -or $ans -eq "Y") {
    Write-Host ""
    Write-Host "Registering Windows Scheduled Task 'Jobybot' to run at logon..." -ForegroundColor Cyan
    $action  = New-ScheduledTaskAction -Execute $venvPy -Argument "$PSScriptRoot\jobybot.py schedule" -WorkingDirectory $PSScriptRoot
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 5)
    try {
        Register-ScheduledTask -TaskName "Jobybot" -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
        Start-ScheduledTask -TaskName "Jobybot"
        Write-Host "✓ Scheduled task 'Jobybot' registered and started." -ForegroundColor Green
        Write-Host ""
        Write-Host "Manage with:"
        Write-Host "  Get-ScheduledTask Jobybot              — status"
        Write-Host "  Stop-ScheduledTask Jobybot             — pause"
        Write-Host "  Start-ScheduledTask Jobybot            — resume"
        Write-Host "  Unregister-ScheduledTask Jobybot -Force — uninstall"
    } catch {
        Write-Host "Could not register scheduled task. Starting foreground instead..." -ForegroundColor Yellow
        & $venvPy jobybot.py schedule
    }
}

Write-Host ""
Write-Host "═══ Install complete ═══" -ForegroundColor Green
Write-Host ""
Write-Host "Live job inbox HTML:  $PSScriptRoot\data\click_apply_inbox.html"
Write-Host "Logs:                 $PSScriptRoot\data\jobybot.log"
Write-Host "Database:             $PSScriptRoot\data\jobybot.db"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  .venv\Scripts\python.exe jobybot.py stats     — see counts"
Write-Host "  .venv\Scripts\python.exe jobybot.py doctor    — check config"
Write-Host "  .venv\Scripts\python.exe jobybot.py run       — one cycle now"
Write-Host ""
