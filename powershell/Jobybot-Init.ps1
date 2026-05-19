# Shared setup — dot-source from other scripts:  . "$PSScriptRoot\Jobybot-Init.ps1"
$ErrorActionPreference = "Stop"

if ($PSScriptRoot -match "powershell$") {
    $script:JobybotRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
} else {
    $script:JobybotRoot = $PSScriptRoot
}

Set-Location $script:JobybotRoot

$script:JobybotPy = Join-Path $JobybotRoot ".venv\Scripts\python.exe"

function Test-JobybotInstall {
    if (-not (Test-Path $script:JobybotPy)) {
        Write-Host "ERROR: Python venv not found at:" -ForegroundColor Red
        Write-Host "  $script:JobybotPy"
        Write-Host "Run:  PowerShell -ExecutionPolicy Bypass -File install.ps1"
        exit 1
    }
}

function Invoke-Jobybot {
    param([Parameter(Mandatory)][string[]]$Args)
    Test-JobybotInstall
    & $script:JobybotPy (Join-Path $JobybotRoot "jobybot.py") @Args
}

function Invoke-JobybotScript {
    param(
        [Parameter(Mandatory)][string]$ScriptName,
        [Parameter(ValueFromRemainingArguments = $true)][string[]]$ScriptArgs
    )
    Test-JobybotInstall
    $path = Join-Path $JobybotRoot "scripts\$ScriptName"
    if (-not (Test-Path $path)) {
        Write-Host "ERROR: Script not found: $path" -ForegroundColor Red
        exit 1
    }
    & $script:JobybotPy $path @ScriptArgs
}

function Get-JobybotProcess {
    Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -like "*$JobybotRoot*" -and $_.CommandLine -like "*jobybot.py*" }
}

function Stop-JobybotProcess {
    $procs = Get-JobybotProcess
    if (-not $procs) {
        Write-Host "No Jobybot python process running."
        return
    }
    foreach ($p in $procs) {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped PID $($p.ProcessId)"
    }
}

function Start-JobybotSchedulerBackground {
    Test-JobybotInstall
    $pyFull = (Resolve-Path $script:JobybotPy).Path
    $botFull = Join-Path $JobybotRoot "jobybot.py"
    Start-Process -WindowStyle Hidden -FilePath $pyFull `
        -ArgumentList "`"$botFull`"", "schedule" `
        -WorkingDirectory $JobybotRoot
    Write-Host "Scheduler started in background."
}
