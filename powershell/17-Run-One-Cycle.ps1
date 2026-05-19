. "$PSScriptRoot\Jobybot-Init.ps1"
Write-Host "Running full cycle (search + email). This may take 15-30 minutes..." -ForegroundColor Yellow
Invoke-Jobybot -Args @("run")
