. "$PSScriptRoot\Jobybot-Init.ps1"
$existing = Get-JobybotProcess
if ($existing) {
    Write-Host "Already running PID $($existing.ProcessId)"
} else {
    Start-JobybotSchedulerBackground
}
