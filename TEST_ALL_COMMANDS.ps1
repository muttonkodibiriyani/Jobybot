# Run every safe test script (no search/email cycle, no emergency stop)
$ErrorActionPreference = "Continue"
$here = $PSScriptRoot
if ($here -match "Jobybot$") { $psDir = Join-Path $here "powershell" }
else { $psDir = Join-Path $here "powershell" }

$tests = @(
    "01-Is-Running.ps1",
    "02-Stats.ps1",
    "03-Top-Jobs.ps1",
    "04-Recent-Emails.ps1",
    "05-Jobs-By-Source.ps1",
    "06-List-All-Jobs.ps1",
    "07-Jobs-Today.ps1",
    "08-LinkedIn-Jobs.ps1",
    "09-Doctor.ps1"
)

Write-Host "`n========== JOBYBOT COMMAND TEST SUITE ==========`n" -ForegroundColor Cyan
$ok = 0
$fail = 0
foreach ($t in $tests) {
    $path = Join-Path $psDir $t
    Write-Host ">>> $t" -ForegroundColor Yellow
    try {
        & powershell -NoProfile -ExecutionPolicy Bypass -File $path
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) { $ok++ } else { $fail++ }
    } catch {
        Write-Host "FAILED: $_" -ForegroundColor Red
        $fail++
    }
    Write-Host ""
}
Write-Host "========== DONE: $ok passed, $fail failed ==========" -ForegroundColor Cyan
Write-Host "Optional manual tests (not run automatically):"
Write-Host "  powershell\10-Test-Email.ps1      (sends real email)"
Write-Host "  powershell\17-Run-One-Cycle.ps1   (15-30 min)"
Write-Host "  powershell\13-Stop-Bot.ps1"
Write-Host "  powershell\14-Emergency-Shutdown.ps1"
