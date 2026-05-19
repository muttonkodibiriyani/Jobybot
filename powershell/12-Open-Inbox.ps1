. "$PSScriptRoot\Jobybot-Init.ps1"
$html = Join-Path $JobybotRoot "data\click_apply_inbox.html"
if (Test-Path $html) { Start-Process $html } else { Write-Host "No inbox yet. Run search first." -ForegroundColor Yellow }
