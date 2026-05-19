. "$PSScriptRoot\Jobybot-Init.ps1"
Write-Host "`n========== JOBYBOT DAILY CHECK ==========`n" -ForegroundColor Cyan
$procs = Get-JobybotProcess
if ($procs) { Write-Host "RUNNING  PID $($procs[0].ProcessId)" -ForegroundColor Green }
else         { Write-Host "NOT RUNNING" -ForegroundColor Red }
Invoke-Jobybot -Args @("stats")
Invoke-JobybotScript "jobs_by_source.py"
Write-Host "`n--- Last 8 log lines ---" -ForegroundColor Cyan
$log = Join-Path $JobybotRoot "data\jobybot.log"
if (Test-Path $log) { Get-Content $log -Tail 8 }
Write-Host "`n=========================================`n" -ForegroundColor Cyan
