# ════════════════════════════════════════════════════════════════════
#  JOBYBOT — Interactive Menu (Non-IT-Person Friendly)
# ════════════════════════════════════════════════════════════════════
#  How to launch:
#    1. Double-click JOBYBOT.bat in the Jobybot folder, OR
#    2. Right-click this file (jobybot-menu.ps1) → Run with PowerShell
# ════════════════════════════════════════════════════════════════════

# Always work from the folder this script lives in
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$venvPy = Join-Path $root ".venv\Scripts\python.exe"
$bot    = Join-Path $root "jobybot.py"
$scripts = Join-Path $root "scripts"

function Pause-Menu {
    Write-Host ""
    Read-Host "Press ENTER to return to menu" | Out-Null
}

function Show-Header {
    Clear-Host
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host "                  JOBYBOT CONTROL CENTER" -ForegroundColor Yellow
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host "  Folder: $root"

    # Single source of truth: PID lockfile written by `jobybot.py schedule`
    # (see core/scheduler_lock.py). Avoids false-positives from the queue
    # server, dashboard renderer, or other transient python.exe instances.
    $lock = Join-Path $root "data\scheduler.lock"
    $sched_alive = $false
    if (Test-Path $lock) {
        try {
            $meta = Get-Content $lock -Raw | ConvertFrom-Json
            $proc = Get-Process -Id $meta.pid -ErrorAction SilentlyContinue
            if ($proc) {
                $sched_alive = $true
                $mins = [math]::Round((New-TimeSpan -Start $proc.StartTime).TotalMinutes, 1)
                Write-Host "  Scheduler: RUNNING (PID $($meta.pid), $mins min)" -ForegroundColor Green
            }
        } catch {}
    }
    if (-not $sched_alive) {
        Write-Host "  Scheduler: NOT RUNNING (use option 1 to start)" -ForegroundColor Red
    }

    # Stats from helper script
    if ((Test-Path $venvPy) -and (Test-Path "$scripts\stats_line.py")) {
        try {
            $line = & $venvPy "$scripts\stats_line.py" 2>$null
            if ($line -and $line -match "^\d+\|\d+\|\d+\|\d+$") {
                $p = $line -split '\|'
                Write-Host "  Jobs found: $($p[0])  |  Total emails: $($p[1])  |  Today: $($p[2])/$($p[3])" -ForegroundColor Cyan
            }
        } catch {}
    }
    Write-Host "==============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Menu {
    Show-Header
    Write-Host "  STARTING & STOPPING" -ForegroundColor Yellow
    Write-Host "  -------------------"
    Write-Host "   1.  Start bot in BACKGROUND (runs 24/7)"
    Write-Host "   2.  Run ONE cycle now (search + send emails)"
    Write-Host "   3.  Stop the bot"
    Write-Host "   4.  EMERGENCY SHUTDOWN (stop everything + disable auto-start)"
    Write-Host ""
    Write-Host "  WATCHING & STATS" -ForegroundColor Yellow
    Write-Host "  -------------------"
    Write-Host "   5.  See live bot log (Ctrl+C to exit log view)"
    Write-Host "   6.  Show statistics"
    Write-Host "   7.  Show top 20 matched jobs"
    Write-Host "   8.  Show 20 latest emails sent"
    Write-Host "   9.  Open the live job inbox in browser"
    Write-Host ""
    Write-Host "  ONE-OFF ACTIONS" -ForegroundColor Yellow
    Write-Host "  -------------------"
    Write-Host "  10.  Search for new jobs only"
    Write-Host "  11.  Send email blast only"
    Write-Host "  12.  Health check (verify config + SMTP)"
    Write-Host "  13.  Send a test email to yourself"
    Write-Host ""
    Write-Host "  SETUP & MAINTENANCE" -ForegroundColor Yellow
    Write-Host "  -------------------"
    Write-Host "  14.  Edit your settings (.env in Notepad)"
    Write-Host "  15.  Enable auto-start on every login"
    Write-Host "  16.  Disable auto-start"
    Write-Host "  17.  Backup all bot data to Desktop"
    Write-Host "  18.  Reset all bot memory (auto-backup first)"
    Write-Host ""
    Write-Host "  REVIEW & AUDIT" -ForegroundColor Yellow
    Write-Host "  -------------------"
    Write-Host "  19.  Open Review Queue (approve / edit / send each email)"
    Write-Host "  20.  Status snapshot (scheduler, queue, today's progress)"
    Write-Host "  21.  Full E2E audit (every stage: search to dashboard)"
    Write-Host ""
    Write-Host "   0.  Exit menu (bot keeps running if started)"
    Write-Host ""
}

function Op-OpenReviewQueue {
    Show-Header
    Write-Host "Starting the local review-queue UI on http://127.0.0.1:7868" -ForegroundColor Yellow
    Write-Host "You can edit subject/body and one-click Send or Skip each pending email."
    Write-Host ""
    Start-Process -WindowStyle Hidden -FilePath $venvPy `
        -ArgumentList $bot, "queue" `
        -WorkingDirectory $root
    Start-Sleep -Seconds 3
    Start-Process "http://127.0.0.1:7868"
    Write-Host "[OK] Review UI launched. The window will stay open in the background."
    Pause-Menu
}

function Op-StatusSnapshot {
    Show-Header
    & $venvPy $bot status
    Pause-Menu
}

function Op-AuditE2E {
    Show-Header
    Write-Host "Running full E2E audit (10 stages) ..." -ForegroundColor Yellow
    & $venvPy "$scripts\_e2e_audit.py"
    Pause-Menu
}

function Op-StartBackground {
    Show-Header
    Write-Host "Starting Jobybot scheduler in the background (idempotent heartbeat)..." -ForegroundColor Yellow
    # `heartbeat` is safe to invoke at any time: it starts the scheduler only
    # if the PID lockfile reports no live daemon. The lock prevents the
    # duplicate-scheduler race that used to be a top support issue.
    & $venvPy $bot heartbeat
    Start-Sleep -Seconds 3
    & $venvPy $bot status
    Pause-Menu
}

function Op-RunOneCycle {
    Show-Header
    Write-Host "Running one full cycle (search + email blast)..." -ForegroundColor Yellow
    Write-Host "This takes ~15 minutes. Window stays open with live output."
    Write-Host "Press Ctrl+C to interrupt."
    Write-Host ""
    & $venvPy $bot run
    Pause-Menu
}

function Op-Stop {
    Show-Header
    $procs = Get-Process python -ErrorAction SilentlyContinue |
             Where-Object { try { $_.Path -like "*$root*" } catch { $false } }
    if (-not $procs) {
        Write-Host "No bot process is running."
    } else {
        Write-Host "Stopping $($procs.Count) Jobybot process(es)..." -ForegroundColor Yellow
        $procs | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Host "[OK] Stopped" -ForegroundColor Green
    }
    Pause-Menu
}

function Op-Emergency {
    Show-Header
    Write-Host "*** EMERGENCY SHUTDOWN ***" -ForegroundColor Red
    Write-Host ""
    Write-Host "This will:"
    Write-Host "  1. Kill all running bot processes"
    Write-Host "  2. Remove auto-start from Windows Startup"
    Write-Host "  3. Remove daily scheduled task"
    Write-Host ""
    $confirm = Read-Host "Type YES to confirm"
    if ($confirm -ne "YES") {
        Write-Host "Cancelled."
        Pause-Menu
        return
    }

    Get-Process python -ErrorAction SilentlyContinue |
        Where-Object { try { $_.Path -like "*$root*" } catch { $false } } |
        Stop-Process -Force

    Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue
    schtasks /Delete /TN "JobybotDaily" /F 2>$null | Out-Null
    schtasks /Delete /TN "Jobybot"      /F 2>$null | Out-Null

    Write-Host ""
    Write-Host "[OK] EMERGENCY SHUTDOWN COMPLETE" -ForegroundColor Green
    Write-Host "     Bot is stopped. Will not restart on reboot."
    Write-Host "     Your data is safe in: $root\data\"
    Pause-Menu
}

function Op-LiveLog {
    Show-Header
    $log = Join-Path $root "data\jobybot.log"
    if (-not (Test-Path $log)) {
        Write-Host "No log file yet. Start the bot first (option 1 or 2)."
        Pause-Menu
        return
    }
    Write-Host "Live log (Ctrl+C to exit log view, bot keeps running)..." -ForegroundColor Yellow
    Write-Host ""
    try { Get-Content $log -Tail 30 -Wait } catch {}
    Pause-Menu
}

function Op-Stats {
    Show-Header
    & $venvPy $bot stats
    Pause-Menu
}

function Op-TopJobs {
    Show-Header
    & $venvPy "$scripts\top_jobs.py"
    Pause-Menu
}

function Op-RecentEmails {
    Show-Header
    & $venvPy "$scripts\recent_emails.py"
    Pause-Menu
}

function Op-OpenInbox {
    Show-Header
    $html = Join-Path $root "data\click_apply_inbox.html"
    if (Test-Path $html) {
        Write-Host "Opening live job inbox in your default browser..." -ForegroundColor Green
        Start-Process $html
    } else {
        Write-Host "No inbox yet. Run the bot first (option 1 or 2) to generate it."
    }
    Pause-Menu
}

function Op-SearchOnly {
    Show-Header
    Write-Host "Searching all sources for new matching jobs..." -ForegroundColor Yellow
    & $venvPy $bot search
    Pause-Menu
}

function Op-EmailOnly {
    Show-Header
    Write-Host "Sending email blast to curated market contacts..." -ForegroundColor Yellow
    & $venvPy $bot email
    Pause-Menu
}

function Op-Doctor {
    Show-Header
    & $venvPy $bot doctor
    Pause-Menu
}

function Op-TestEmail {
    Show-Header
    Write-Host "Sending a test email to yourself..." -ForegroundColor Yellow
    & $venvPy "$scripts\test_email.py"
    Pause-Menu
}

function Op-EditEnv {
    Show-Header
    $envPath = Join-Path $root ".env"
    $examplePath = Join-Path $root ".env.example"
    if (-not (Test-Path $envPath)) {
        Write-Host "No .env file found. Copying .env.example as a starting point..."
        Copy-Item $examplePath $envPath -ErrorAction SilentlyContinue
    }
    Write-Host "Opening .env in Notepad..." -ForegroundColor Green
    Start-Process notepad $envPath -Wait
    Write-Host ""
    Write-Host "After saving, the next hourly cycle will use the new settings."
    Write-Host "Or restart the bot (option 3 then option 1) to apply immediately."
    Pause-Menu
}

function Op-EnableAutoStart {
    Show-Header
    Write-Host "Creating Windows Startup shortcut..." -ForegroundColor Yellow

    $wsh = New-Object -ComObject WScript.Shell
    $lnkPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk"
    $lnk = $wsh.CreateShortcut($lnkPath)
    $lnk.TargetPath = "cmd.exe"
    $lnk.Arguments  = "/c `"$venvPy`" `"$bot`" schedule >> `"$root\data\scheduler.log`" 2>&1"
    $lnk.WorkingDirectory = $root
    $lnk.WindowStyle = 7
    $lnk.Save()
    Write-Host "[OK] Startup shortcut created" -ForegroundColor Green
    Write-Host "     $lnkPath"

    # Daily 9 AM safety task
    $batPath = Join-Path $root "_run_scheduler.bat"
    $batBody = "@echo off`r`ncd /d `"$root`"`r`nset PYTHONIOENCODING=utf-8`r`n`"$venvPy`" `"$bot`" schedule >> `"$root\data\scheduler-stdout.log`" 2>&1"
    Set-Content $batPath -Value $batBody -Encoding ASCII

    schtasks /Create /TN "JobybotDaily" /TR "`"$batPath`"" /SC DAILY /ST 09:00 /F 2>$null | Out-Null
    Write-Host "[OK] Daily 9 AM safety task: JobybotDaily" -ForegroundColor Green
    Write-Host ""
    Write-Host "From now on, the bot starts every time you log into Windows."
    Pause-Menu
}

function Op-DisableAutoStart {
    Show-Header
    Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue
    schtasks /Delete /TN "JobybotDaily" /F 2>$null | Out-Null
    Write-Host "[OK] Auto-start removed." -ForegroundColor Green
    Write-Host "     Bot will NOT launch automatically anymore."
    Write-Host "     Currently running bot is unaffected — use option 3 to stop it."
    Pause-Menu
}

function Op-Backup {
    Show-Header
    $stamp = Get-Date -Format 'yyyy-MM-dd-HHmm'
    $backup = Join-Path ([Environment]::GetFolderPath("Desktop")) "Jobybot-Backup-$stamp"
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    Copy-Item (Join-Path $root ".env")       (Join-Path $backup ".env")       -ErrorAction SilentlyContinue
    Copy-Item (Join-Path $root "data")       (Join-Path $backup "data")       -Recurse -ErrorAction SilentlyContinue
    Copy-Item (Join-Path $root "resume.pdf") (Join-Path $backup "resume.pdf") -ErrorAction SilentlyContinue
    Copy-Item (Join-Path $root "*.pdf")      $backup                          -ErrorAction SilentlyContinue
    Write-Host "[OK] Backup created at:" -ForegroundColor Green
    Write-Host "     $backup"
    Pause-Menu
}

function Op-Reset {
    Show-Header
    Write-Host "*** WARNING ***" -ForegroundColor Red
    Write-Host "This deletes ALL job history and email logs."
    Write-Host "The bot will resend emails to all recruiters again."
    Write-Host ""
    $confirm = Read-Host "Type RESET to confirm"
    if ($confirm -ne "RESET") {
        Write-Host "Cancelled."
        Pause-Menu
        return
    }

    # Stop running bot
    Get-Process python -ErrorAction SilentlyContinue |
        Where-Object { try { $_.Path -like "*$root*" } catch { $false } } |
        Stop-Process -Force

    # Backup first
    $stamp = Get-Date -Format 'yyyy-MM-dd-HHmm'
    $backup = Join-Path ([Environment]::GetFolderPath("Desktop")) "Jobybot-PreReset-$stamp"
    Copy-Item (Join-Path $root "data") $backup -Recurse -ErrorAction SilentlyContinue
    Write-Host "Backup saved: $backup"

    # Wipe data folder
    Remove-Item (Join-Path $root "data") -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Bot memory reset." -ForegroundColor Green
    Pause-Menu
}

# ──────────────────────────────────────────────────────────────────────
# Main loop
# ──────────────────────────────────────────────────────────────────────
while ($true) {
    Show-Menu
    $choice = Read-Host "  Enter choice (0-21)"
    switch ($choice) {
        "1"  { Op-StartBackground }
        "2"  { Op-RunOneCycle }
        "3"  { Op-Stop }
        "4"  { Op-Emergency }
        "5"  { Op-LiveLog }
        "6"  { Op-Stats }
        "7"  { Op-TopJobs }
        "8"  { Op-RecentEmails }
        "9"  { Op-OpenInbox }
        "10" { Op-SearchOnly }
        "11" { Op-EmailOnly }
        "12" { Op-Doctor }
        "13" { Op-TestEmail }
        "14" { Op-EditEnv }
        "15" { Op-EnableAutoStart }
        "16" { Op-DisableAutoStart }
        "17" { Op-Backup }
        "18" { Op-Reset }
        "19" { Op-OpenReviewQueue }
        "20" { Op-StatusSnapshot }
        "21" { Op-AuditE2E }
        "0"  { Write-Host ""; Write-Host "Goodbye! Bot keeps running in background if you started it."; exit 0 }
        default { Write-Host "  Invalid choice. Pick a number from 0-21." -ForegroundColor Red; Start-Sleep 1 }
    }
}
