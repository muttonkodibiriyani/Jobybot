. (Join-Path (Split-Path $PSScriptRoot -Parent) "powershell\Jobybot-Init.ps1")

$venvPy = (Resolve-Path $JobybotPy).Path
$bot = Join-Path $JobybotRoot "jobybot.py"

$wsh = New-Object -ComObject WScript.Shell
$lnkPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk"
$lnk = $wsh.CreateShortcut($lnkPath)
$lnk.TargetPath = "cmd.exe"
$lnk.Arguments = "/c `"$venvPy`" `"$bot`" schedule >> `"$JobybotRoot\data\scheduler.log`" 2>&1"
$lnk.WorkingDirectory = $JobybotRoot
$lnk.WindowStyle = 7
$lnk.Save()
Write-Host "[OK] Startup shortcut: $lnkPath" -ForegroundColor Green

$batPath = Join-Path $JobybotRoot "_run_scheduler.bat"
# The .bat is now version-controlled (see _run_scheduler.bat at repo root).
# Do not regenerate it from this script - keep both in sync there.
if (-not (Test-Path $batPath)) {
    Write-Host "[WARN] _run_scheduler.bat missing from repo; recreating fallback" -ForegroundColor Yellow
    @"
@echo off
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1
"%~dp0.venv\Scripts\python.exe" "%~dp0jobybot.py" schedule >> "%~dp0data\scheduler-stdout.log" 2>&1
"@ | Set-Content $batPath -Encoding ASCII
}

# ── Daily 9:00 task: now calls `heartbeat` instead of `schedule`. ──
# `heartbeat` is idempotent: it starts the scheduler only if it died,
# never double-starts. This eliminates the duplicate-scheduler race that
# used to produce duplicate sends from the daily wake-up.
$heartbeatBat = Join-Path $JobybotRoot "_heartbeat.bat"
@"
@echo off
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
"%~dp0.venv\Scripts\python.exe" "%~dp0jobybot.py" heartbeat >> "%~dp0data\heartbeat.log" 2>&1
"@ | Set-Content $heartbeatBat -Encoding ASCII

schtasks /Create /TN "JobybotDaily" /TR "`"$heartbeatBat`"" /SC DAILY /ST 09:00 /F 2>$null | Out-Null
Write-Host "[OK] Daily 9:00 task: JobybotDaily (heartbeat-mode, no double-starts)" -ForegroundColor Green
