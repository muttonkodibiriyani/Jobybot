# ════════════════════════════════════════════════════════════════════
#  JOBYBOT — Interactive Menu (Non-IT-Person Friendly)
# ════════════════════════════════════════════════════════════════════
#  Right-click this file → "Run with PowerShell"
#  (or open PowerShell, cd to the Jobybot folder, then: .\jobybot-menu.ps1)
# ════════════════════════════════════════════════════════════════════

# Always work from the folder this script lives in
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$venvPy = "$root\.venv\Scripts\python.exe"
$bot    = "$root\jobybot.py"

function Pause-Menu { Write-Host ""; Read-Host "Press ENTER to return to menu" | Out-Null }

function Header {
    Clear-Host
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "                    🎯 JOBYBOT CONTROL CENTER" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   Folder: $root"

    # Show status
    $proc = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$root*" }
    if ($proc) {
        $mins = [math]::Round((New-TimeSpan -Start $proc.StartTime).TotalMinutes, 1)
        Write-Host "   Status: ✓ RUNNING (PID $($proc.Id), $mins min)" -ForegroundColor Green
    } else {
        Write-Host "   Status: ✗ NOT RUNNING" -ForegroundColor Red
    }

    # Show stats from DB
    if (Test-Path "$root\data\jobybot.db") {
        $py = "$root\.venv\Scripts\python.exe"
        if (Test-Path $py) {
            try {
                $stats = & $py -c "import sqlite3; c=sqlite3.connect('data/jobybot.db'); j=c.execute(\"SELECT COUNT(*) FROM jobs WHERE status='found'\").fetchone()[0]; e=c.execute('SELECT COUNT(*) FROM emails_sent').fetchone()[0]; import datetime; today=datetime.date.today().isoformat(); te=c.execute(\"SELECT COUNT(*) FROM emails_sent WHERE sent_at LIKE ?\",(f'{today}%',)).fetchone()[0]; print(f'{j}|{e}|{te}')" 2>$null
                if ($stats) {
                    $parts = $stats -split '\|'
                    Write-Host "   Jobs found: $($parts[0]) | Total emails: $($parts[1]) | Today: $($parts[2])/80" -ForegroundColor Cyan
                }
            } catch {}
        }
    }
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Menu {
    Header
    Write-Host "  STARTING & STOPPING" -ForegroundColor Yellow
    Write-Host "  ─────────────────────"
    Write-Host "   1.  Start bot in BACKGROUND (runs 24/7)"
    Write-Host "   2.  Run ONE cycle now (search + send emails)"
    Write-Host "   3.  Stop the bot (gracefully)"
    Write-Host "   4.  🚨 EMERGENCY SHUTDOWN (stop everything)"
    Write-Host ""
    Write-Host "  WATCHING & STATS" -ForegroundColor Yellow
    Write-Host "  ─────────────────────"
    Write-Host "   5.  See live bot log"
    Write-Host "   6.  Show statistics"
    Write-Host "   7.  Show top 20 matched jobs"
    Write-Host "   8.  Show 20 latest emails sent"
    Write-Host "   9.  Open the live job inbox in browser"
    Write-Host ""
    Write-Host "  ONE-OFF ACTIONS" -ForegroundColor Yellow
    Write-Host "  ─────────────────────"
    Write-Host "  10.  Search for new jobs only"
    Write-Host "  11.  Send email blast only"
    Write-Host "  12.  Health check (doctor)"
    Write-Host "  13.  Send test email to yourself"
    Write-Host ""
    Write-Host "  SETUP & MAINTENANCE" -ForegroundColor Yellow
    Write-Host "  ─────────────────────"
    Write-Host "  14.  Edit your settings (.env in Notepad)"
    Write-Host "  15.  Enable auto-start at login"
    Write-Host "  16.  Disable auto-start"
    Write-Host "  17.  Backup data to Desktop"
    Write-Host "  18.  Reset all bot memory (with backup)"
    Write-Host ""
    Write-Host "   0.  Exit menu"
    Write-Host ""
}

function Start-Background {
    Header
    if (Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$root*" }) {
        Write-Host "Bot is already running. Use option 3 to stop it first."
    } else {
        Write-Host "Starting Jobybot scheduler in the background..." -ForegroundColor Yellow
        Start-Process -WindowStyle Hidden -FilePath $venvPy `
            -ArgumentList "$bot","schedule" -WorkingDirectory $root
        Start-Sleep -Seconds 3
        $proc = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$root*" }
        if ($proc) {
            Write-Host "✓ Started (PID $($proc.Id))" -ForegroundColor Green
            Write-Host "  Bot now runs every hour, sends up to 80 emails/day."
        } else {
            Write-Host "✗ Failed to start. Run option 12 (Health check) to diagnose." -ForegroundColor Red
        }
    }
    Pause-Menu
}

function Run-OneCycle {
    Header
    Write-Host "Running one full cycle (search + email blast)..." -ForegroundColor Yellow
    Write-Host "This takes ~15 minutes. Window stays open with live output."
    Write-Host "Press Ctrl+C to interrupt."
    Write-Host ""
    & $venvPy $bot run
    Pause-Menu
}

function Stop-Bot {
    Header
    $procs = Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$root*" }
    if (-not $procs) {
        Write-Host "No bot process is running."
    } else {
        Write-Host "Stopping $($procs.Count) Jobybot process(es)..." -ForegroundColor Yellow
        $procs | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Host "✓ Stopped" -ForegroundColor Green
    }
    Pause-Menu
}

function Emergency-Shutdown {
    Header
    Write-Host "🚨 EMERGENCY SHUTDOWN" -ForegroundColor Red
    Write-Host ""
    Write-Host "This will:" -ForegroundColor Yellow
    Write-Host "  1. Kill all Python processes"
    Write-Host "  2. Remove auto-start from Windows Startup"
    Write-Host "  3. Remove daily scheduled task"
    Write-Host ""
    $confirm = Read-Host "Type YES to confirm"
    if ($confirm -ne "YES") { Write-Host "Cancelled."; Pause-Menu; return }

    Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
    Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue
    schtasks /Delete /TN "JobybotDaily" /F 2>$null | Out-Null
    schtasks /Delete /TN "Jobybot"      /F 2>$null | Out-Null

    Write-Host ""
    Write-Host "✓ EMERGENCY SHUTDOWN COMPLETE" -ForegroundColor Green
    Write-Host "  Bot is stopped. Will not restart on reboot."
    Write-Host "  Your data is safe in: $root\data\"
    Pause-Menu
}

function Live-Log {
    Header
    if (-not (Test-Path "$root\data\jobybot.log")) {
        Write-Host "No log file yet. Start the bot first (option 1 or 2)."
    } else {
        Write-Host "Live log (Ctrl+C to exit)..." -ForegroundColor Yellow
        Write-Host ""
        try { Get-Content "$root\data\jobybot.log" -Tail 30 -Wait } catch {}
    }
    Pause-Menu
}

function Show-Stats {
    Header
    & $venvPy $bot stats
    Pause-Menu
}

function Show-TopJobs {
    Header
    & $venvPy -c "import sqlite3; c=sqlite3.connect('data/jobybot.db'); rows=c.execute(\"SELECT match_score, title, company, source FROM jobs WHERE status='found' ORDER BY match_score DESC LIMIT 20\").fetchall(); [print(f'  [{r[0]}] {r[1][:50]:50s} @ {r[2][:30]:30s} ({r[3]})') for r in rows]; print(f'\nTotal high-match jobs: {len(rows)}')"
    Pause-Menu
}

function Show-Emails {
    Header
    Write-Host "  Last 20 emails sent (with your CV attached):" -ForegroundColor Yellow
    Write-Host "  ───────────────────────────────────────────────────────────────"
    & $venvPy -c "import sqlite3; c=sqlite3.connect('data/jobybot.db'); rows=c.execute('SELECT sent_at, company, recipient FROM emails_sent ORDER BY sent_at DESC LIMIT 20').fetchall(); [print(f'  {r[0][:19]} | {r[1][:30]:30s} → {r[2]}') for r in rows]"
    Pause-Menu
}

function Open-Inbox {
    Header
    $html = "$root\data\click_apply_inbox.html"
    if (Test-Path $html) {
        Write-Host "Opening live job inbox in your default browser..." -ForegroundColor Green
        Start-Process $html
    } else {
        Write-Host "No inbox yet. Run the bot first (option 1 or 2) to generate it."
    }
    Pause-Menu
}

function Search-Only {
    Header
    Write-Host "Searching all sources for new matching jobs..." -ForegroundColor Yellow
    & $venvPy $bot search
    Pause-Menu
}

function Email-Only {
    Header
    Write-Host "Sending email blast to curated market contacts..." -ForegroundColor Yellow
    & $venvPy $bot email
    Pause-Menu
}

function Health-Check {
    Header
    & $venvPy $bot doctor
    Pause-Menu
}

function Test-Email {
    Header
    Write-Host "Sending a test email to yourself..." -ForegroundColor Yellow
    & $venvPy -c "from config import get_settings; from core.email_sender import send_email; from pathlib import Path; s=get_settings(); ok,msg = send_email(s.gmail_address, s.gmail_app_password, s.user_email, 'Jobybot Test', 'If you see this, your Gmail App Password is working perfectly. The bot is ready to send real applications.', Path(s.resume_path), s.user_name); print('✓ Test email sent — check your inbox!' if ok else f'✗ FAILED: {msg}')"
    Pause-Menu
}

function Edit-Env {
    Header
    if (-not (Test-Path "$root\.env")) {
        Write-Host "No .env file found. Copying .env.example as a starting point..."
        Copy-Item "$root\.env.example" "$root\.env" -ErrorAction SilentlyContinue
    }
    Write-Host "Opening .env in Notepad..." -ForegroundColor Green
    notepad "$root\.env"
    Write-Host ""
    Write-Host "After saving, the next hourly cycle will use the new settings."
    Write-Host "Or restart the bot (option 3 then option 1) to apply immediately."
    Pause-Menu
}

function Enable-Autostart {
    Header
    Write-Host "Creating Windows Startup shortcut..." -ForegroundColor Yellow

    $wsh = New-Object -ComObject WScript.Shell
    $lnkPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk"
    $lnk = $wsh.CreateShortcut($lnkPath)
    $lnk.TargetPath = "cmd.exe"
    $lnk.Arguments  = "/c `"$venvPy`" `"$bot`" schedule >> `"$root\data\scheduler.log`" 2>&1"
    $lnk.WorkingDirectory = $root
    $lnk.WindowStyle = 7
    $lnk.Save()
    Write-Host "✓ Startup shortcut created: $lnkPath" -ForegroundColor Green

    # Daily 9 AM safety net
    $batPath = "$root\_run_scheduler.bat"
    @"
@echo off
cd /d "$root"
set PYTHONIOENCODING=utf-8
"$venvPy" "$bot" schedule >> "$root\data\scheduler-stdout.log" 2>&1
"@ | Set-Content $batPath -Encoding ASCII

    schtasks /Create /TN "JobybotDaily" /TR "`"$batPath`"" /SC DAILY /ST 09:00 /F 2>$null | Out-Null
    Write-Host "✓ Daily 9 AM safety task: JobybotDaily" -ForegroundColor Green
    Write-Host ""
    Write-Host "From now on, the bot starts every time you log into Windows."
    Pause-Menu
}

function Disable-Autostart {
    Header
    Remove-Item "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\Jobybot Scheduler.lnk" -ErrorAction SilentlyContinue
    schtasks /Delete /TN "JobybotDaily" /F 2>$null | Out-Null
    Write-Host "✓ Auto-start removed." -ForegroundColor Green
    Write-Host "  The bot will NOT launch automatically anymore."
    Write-Host "  Currently running bot is unaffected — use option 3 to stop it."
    Pause-Menu
}

function Backup-Data {
    Header
    $backup = "$env:USERPROFILE\Desktop\Jobybot-Backup-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    Copy-Item "$root\.env"       "$backup\.env"       -ErrorAction SilentlyContinue
    Copy-Item "$root\data"       "$backup\data"       -Recurse -ErrorAction SilentlyContinue
    Copy-Item "$root\resume.pdf" "$backup\resume.pdf" -ErrorAction SilentlyContinue
    Copy-Item "$root\*.pdf"      $backup              -ErrorAction SilentlyContinue
    Write-Host "✓ Backup created at:" -ForegroundColor Green
    Write-Host "    $backup"
    Pause-Menu
}

function Reset-Data {
    Header
    Write-Host "⚠️  This deletes ALL job history and email logs." -ForegroundColor Red
    Write-Host "Bot will resend emails to all recruiters again." -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Type RESET to confirm"
    if ($confirm -ne "RESET") { Write-Host "Cancelled."; Pause-Menu; return }

    # Stop running bot
    Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$root*" } | Stop-Process -Force

    # Backup first
    $backup = "$env:USERPROFILE\Desktop\Jobybot-PreReset-$(Get-Date -Format 'yyyy-MM-dd-HHmm')"
    Copy-Item "$root\data" $backup -Recurse -ErrorAction SilentlyContinue
    Write-Host "Backup saved: $backup"

    # Wipe data
    Remove-Item "$root\data" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Bot memory reset." -ForegroundColor Green
    Pause-Menu
}

# ─── Main loop ──────────────────────────────────────────────────────
while ($true) {
    Show-Menu
    $choice = Read-Host "  Enter choice (0-18)"
    switch ($choice) {
        "1"  { Start-Background }
        "2"  { Run-OneCycle }
        "3"  { Stop-Bot }
        "4"  { Emergency-Shutdown }
        "5"  { Live-Log }
        "6"  { Show-Stats }
        "7"  { Show-TopJobs }
        "8"  { Show-Emails }
        "9"  { Open-Inbox }
        "10" { Search-Only }
        "11" { Email-Only }
        "12" { Health-Check }
        "13" { Test-Email }
        "14" { Edit-Env }
        "15" { Enable-Autostart }
        "16" { Disable-Autostart }
        "17" { Backup-Data }
        "18" { Reset-Data }
        "0"  { Write-Host "Goodbye! Bot keeps running in background if started."; exit 0 }
        default { Write-Host "Invalid choice. Try again." -ForegroundColor Red; Start-Sleep 1 }
    }
}
