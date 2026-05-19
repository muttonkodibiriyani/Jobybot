. "$PSScriptRoot\Jobybot-Init.ps1"
Write-Host "Jobybot folder: $JobybotRoot" -ForegroundColor Cyan
$procs = Get-JobybotProcess
if ($procs) {
    $procs | ForEach-Object {
        Write-Host "RUNNING  PID $($_.ProcessId)" -ForegroundColor Green
        Write-Host "  $($_.CommandLine)"
    }
} else {
    Write-Host "NOT RUNNING" -ForegroundColor Yellow
}
Get-ScheduledTask -TaskName "Jobybot" -ErrorAction SilentlyContinue | Format-Table TaskName, State
schtasks /Query /TN "JobybotDaily" /FO LIST 2>$null
