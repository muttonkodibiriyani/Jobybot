. "$PSScriptRoot\Jobybot-Init.ps1"
$envFile = Join-Path $JobybotRoot ".env"
if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $JobybotRoot ".env.example") $envFile
}
notepad $envFile
