. "$PSScriptRoot\Jobybot-Init.ps1"
$log = Join-Path $JobybotRoot "data\jobybot.log"
if (-not (Test-Path $log)) { Write-Host "No log yet. Start the bot first."; exit 0 }
Get-Content $log -Tail 30 -Wait
