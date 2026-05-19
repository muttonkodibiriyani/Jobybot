$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$venvPy = Join-Path $root ".venv\Scripts\python.exe"
$bot = Join-Path $root "jobybot.py"

$wsh = New-Object -ComObject WScript.Shell
$lnkPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk"
$lnk = $wsh.CreateShortcut($lnkPath)
$lnk.TargetPath = "cmd.exe"
$lnk.Arguments = "/c `"$venvPy`" `"$bot`" schedule >> `"$root\data\scheduler.log`" 2>&1"
$lnk.WorkingDirectory = $root
$lnk.WindowStyle = 7
$lnk.Save()
Write-Host "[OK] Startup shortcut: $lnkPath" -ForegroundColor Green

$batPath = Join-Path $root "_run_scheduler.bat"
@"
@echo off
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
"%~dp0.venv\Scripts\python.exe" "%~dp0jobybot.py" schedule >> "%~dp0data\scheduler-stdout.log" 2>&1
"@ | Set-Content $batPath -Encoding ASCII

schtasks /Create /TN "JobybotDaily" /TR "`"$batPath`"" /SC DAILY /ST 09:00 /F 2>$null | Out-Null
Write-Host "[OK] Daily 9:00 task: JobybotDaily" -ForegroundColor Green
