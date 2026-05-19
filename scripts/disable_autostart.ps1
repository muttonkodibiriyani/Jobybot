Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue
schtasks /Delete /TN "JobybotDaily" /F 2>$null | Out-Null
Unregister-ScheduledTask -TaskName "Jobybot" -Confirm:$false -ErrorAction SilentlyContinue
Write-Host "[OK] Auto-start disabled." -ForegroundColor Green
