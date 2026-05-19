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
@"
@echo off
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
"%~dp0.venv\Scripts\python.exe" "%~dp0jobybot.py" schedule >> "%~dp0data\scheduler-stdout.log" 2>&1
"@ | Set-Content $batPath -Encoding ASCII

schtasks /Create /TN "JobybotDaily" /TR "`"$batPath`"" /SC DAILY /ST 09:00 /F 2>$null | Out-Null
Write-Host "[OK] Daily 9:00 task: JobybotDaily" -ForegroundColor Green
