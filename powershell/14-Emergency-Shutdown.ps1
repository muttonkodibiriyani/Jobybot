. "$PSScriptRoot\Jobybot-Init.ps1"
Stop-JobybotProcess
Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue
schtasks /Delete /TN "JobybotDaily" /F 2>$null | Out-Null
schtasks /Delete /TN "Jobybot" /F 2>$null | Out-Null
Unregister-ScheduledTask -TaskName "Jobybot" -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "EMERGENCY SHUTDOWN COMPLETE" -ForegroundColor Red
Write-Host "Data safe in: $JobybotRoot\data"
