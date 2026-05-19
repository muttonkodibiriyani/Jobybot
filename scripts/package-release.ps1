# Build Jobybot-Pro-Setup.zip for website download (no secrets, no venv, no user data)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root "releases"
$zipPath = Join-Path $outDir "Jobybot-Pro-Setup.zip"
$staging = Join-Path $env:TEMP "Jobybot-Pro-staging-$(Get-Random)"

New-Item -ItemType Directory -Path $outDir -Force | Out-Null
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging -Force | Out-Null

$exclude = @('.venv', 'data', '.env', '.git', 'releases', 'website\node_modules', 'website\.next', '__pycache__')
$items = Get-ChildItem $root -Force | Where-Object {
    $name = $_.Name
    $name -notin $exclude -and -not $name.EndsWith('.pdf')
}

foreach ($item in $items) {
    Copy-Item $item.FullName (Join-Path $staging $item.Name) -Recurse -Force
}

# Ensure installer entry points exist
@(
    "SETUP_FOR_FRIENDS.bat",
    "START_AUTOSCHEDULE.bat",
    "RUN_BOT_NOW.bat",
    "JOBYBOT.bat"
) | ForEach-Object {
    if (-not (Test-Path (Join-Path $staging $_))) {
        Write-Warning "Missing $_ in package"
    }
}

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zipPath -Force
Remove-Item $staging -Recurse -Force

$mb = [math]::Round((Get-Item $zipPath).Length / 1MB, 2)
Write-Host "[OK] Created: $zipPath ($mb MB)" -ForegroundColor Green
Write-Host "     Upload to server or use with website /api/download"
