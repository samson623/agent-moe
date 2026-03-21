# start-tunnel.ps1 — Start public tunnel and register Telegram webhook
#
# Priority order:
#   1. ngrok with NGROK_DOMAIN (static domain — set once, works forever)
#   2. ngrok without domain (random ngrok URL, still more reliable than localtunnel)
#   3. localtunnel (last resort — URL changes every restart)
#
# First-time setup:
#   1. Sign up at https://ngrok.com (free)
#   2. Get your authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
#   3. Get your static domain: https://dashboard.ngrok.com/domains
#   4. Run: powershell -ExecutionPolicy Bypass -File scripts\configure-ngrok.ps1
#   5. Add NGROK_DOMAIN=your-domain.ngrok-free.app to .env.local
#   6. Run this script — webhook registers once and never changes again
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts\start-tunnel.ps1

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$REPO_ROOT = Resolve-Path (Join-Path $SCRIPT_DIR "..")
$ENV_FILE = Join-Path $REPO_ROOT ".env.local"
$NGROK_EXE = if ($env:NGROK_EXE) { $env:NGROK_EXE } else { "C:\Users\1sams\OneDrive\Documents\ngrok-v3-stable-windows-amd64 (1)\ngrok.exe" }
$PORT = if ($env:PORT) { [int]$env:PORT } else { 3000 }
$LAST_WEBHOOK_FILE = Join-Path $env:TEMP "agent-moe-last-webhook.txt"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

function Get-EnvFileValue([string]$name) {
    if (-not (Test-Path $ENV_FILE)) { return $null }
    foreach ($line in Get-Content $ENV_FILE) {
        if ($line -match "^\s*$name=(.*)$") { return $matches[1].Trim() }
    }
    return $null
}

function Get-Config([string]$name) {
    $v = [System.Environment]::GetEnvironmentVariable($name)
    if (-not $v) { $v = Get-EnvFileValue $name }
    return $v
}

function Get-RequiredConfig([string]$name) {
    $v = Get-Config $name
    if (-not $v) { throw "Missing required config: $name — set it in .env.local" }
    return $v
}

function Test-LocalApp([int]$port) {
    try { return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop) }
    catch { return $false }
}

function Register-TelegramWebhook([string]$publicUrl, [string]$botToken, [string]$webhookSecret) {
    $webhookUrl = "$publicUrl/api/telegram/webhook"

    # Skip re-registration if URL hasn't changed
    if (Test-Path $LAST_WEBHOOK_FILE) {
        $last = (Get-Content $LAST_WEBHOOK_FILE -Raw).Trim()
        if ($last -eq $webhookUrl) {
            Write-Host "Webhook unchanged: $webhookUrl" -ForegroundColor Gray
            return
        }
    }

    Write-Host "Registering webhook: $webhookUrl" -ForegroundColor Cyan
    $result = Invoke-RestMethod `
        -Uri "https://api.telegram.org/bot$botToken/setWebhook" `
        -Method POST `
        -Body @{
            url            = $webhookUrl
            secret_token   = $webhookSecret
            allowed_updates = '["message","callback_query"]'
        }

    if (-not $result.ok) { throw "Webhook registration failed: $($result.description)" }

    Set-Content -Path $LAST_WEBHOOK_FILE -Value $webhookUrl
    Write-Host "Webhook registered: $webhookUrl" -ForegroundColor Green
}

# ---------------------------------------------------------------------------
# Pre-flight checks
# ---------------------------------------------------------------------------

$BOT_TOKEN = Get-RequiredConfig "TELEGRAM_BOT_TOKEN"
$WEBHOOK_SECRET = Get-RequiredConfig "TELEGRAM_WEBHOOK_SECRET"

if (-not (Test-LocalApp $PORT)) {
    Write-Host "WARNING: Nothing is listening on localhost:$PORT." -ForegroundColor Yellow
    Write-Host "Start your Next.js app (pnpm dev) before running this script." -ForegroundColor Yellow
    Write-Host ""
}

# ---------------------------------------------------------------------------
# Check ngrok
# ---------------------------------------------------------------------------

$ngrokAvailable = (Test-Path $NGROK_EXE)
$ngrokConfigured = $false

if ($ngrokAvailable) {
    $ngrokConfig = Join-Path $env:USERPROFILE "AppData\Local\ngrok\ngrok.yml"
    if (Test-Path $ngrokConfig) {
        $ngrokConfigured = ($null -ne (Select-String -Path $ngrokConfig -Pattern "authtoken" -Quiet))
    }
}

# ---------------------------------------------------------------------------
# Strategy 1: ngrok with static domain (best — URL never changes)
# ---------------------------------------------------------------------------

$NGROK_DOMAIN = Get-Config "NGROK_DOMAIN"

if ($ngrokConfigured -and $NGROK_DOMAIN) {
    Write-Host "Starting ngrok with static domain: $NGROK_DOMAIN" -ForegroundColor Cyan

    $ngrokProc = Start-Process `
        -FilePath $NGROK_EXE `
        -ArgumentList "http", "--domain=$NGROK_DOMAIN", $PORT `
        -PassThru -WindowStyle Hidden

    Start-Sleep -Seconds 3

    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5
        $publicUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url

        if (-not $publicUrl) { throw "ngrok started but no HTTPS URL found." }

        Register-TelegramWebhook -publicUrl $publicUrl -botToken $BOT_TOKEN -webhookSecret $WEBHOOK_SECRET
        Write-Host ""
        Write-Host "Static URL: $publicUrl" -ForegroundColor Green
        Write-Host "This URL never changes. Webhook is registered permanently." -ForegroundColor Gray
        Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
        Wait-Process -Id $ngrokProc.Id
    } catch {
        Stop-Process -Id $ngrokProc.Id -Force -ErrorAction SilentlyContinue
        throw
    }
    exit 0
}

# ---------------------------------------------------------------------------
# Strategy 2: ngrok without static domain (random URL, but reliable)
# ---------------------------------------------------------------------------

if ($ngrokConfigured) {
    Write-Host "Starting ngrok (no static domain configured)..." -ForegroundColor Cyan
    Write-Host "Tip: Add NGROK_DOMAIN=your-domain.ngrok-free.app to .env.local for a permanent URL." -ForegroundColor Gray
    Write-Host "     Get your free static domain at: https://dashboard.ngrok.com/domains" -ForegroundColor Gray
    Write-Host ""

    $ngrokProc = Start-Process `
        -FilePath $NGROK_EXE `
        -ArgumentList "http", $PORT `
        -PassThru -WindowStyle Hidden

    Start-Sleep -Seconds 3

    try {
        $tunnels = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -TimeoutSec 5
        $publicUrl = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url

        if (-not $publicUrl) { throw "ngrok started but no HTTPS URL found." }

        Register-TelegramWebhook -publicUrl $publicUrl -botToken $BOT_TOKEN -webhookSecret $WEBHOOK_SECRET
        Write-Host ""
        Write-Host "Tunnel: $publicUrl" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
        Wait-Process -Id $ngrokProc.Id
    } catch {
        Stop-Process -Id $ngrokProc.Id -Force -ErrorAction SilentlyContinue
        throw
    }
    exit 0
}

# ---------------------------------------------------------------------------
# Strategy 3: localtunnel (fallback — flaky, URL changes every restart)
# ---------------------------------------------------------------------------

if (-not $ngrokAvailable) {
    Write-Host "ngrok not found. For a reliable tunnel, download ngrok:" -ForegroundColor Yellow
    Write-Host "  https://ngrok.com/download" -ForegroundColor Gray
    Write-Host "  Then run: powershell -ExecutionPolicy Bypass -File scripts\configure-ngrok.ps1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "ngrok is installed but not configured (no authtoken)." -ForegroundColor Yellow
    Write-Host "For a reliable tunnel, run:" -ForegroundColor Gray
    Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\configure-ngrok.ps1" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "Falling back to localtunnel (URL will change on every restart)..." -ForegroundColor Yellow
Write-Host ""

$stdoutLog = Join-Path $env:TEMP "agent-moe-lt.out.log"
$stderrLog = Join-Path $env:TEMP "agent-moe-lt.err.log"
foreach ($f in @($stdoutLog, $stderrLog)) {
    if (Test-Path $f) { Remove-Item $f -Force }
}

$ltProc = Start-Process `
    -FilePath "cmd.exe" `
    -ArgumentList "/c", "pnpm dlx localtunnel --port $PORT" `
    -PassThru `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -WindowStyle Hidden

$deadline = (Get-Date).AddSeconds(30)
$ltUrl = $null

while ((Get-Date) -lt $deadline) {
    if ($ltProc.HasExited) { throw "localtunnel exited before producing a URL." }
    if (Test-Path $stdoutLog) {
        foreach ($line in Get-Content $stdoutLog) {
            if ($line -match "your url is:\s+(https://\S+)") {
                $ltUrl = $matches[1]
                break
            }
        }
    }
    if ($ltUrl) { break }
    Start-Sleep -Milliseconds 500
}

if (-not $ltUrl) {
    Stop-Process -Id $ltProc.Id -Force -ErrorAction SilentlyContinue
    throw "Timed out waiting for localtunnel URL."
}

try {
    Register-TelegramWebhook -publicUrl $ltUrl -botToken $BOT_TOKEN -webhookSecret $WEBHOOK_SECRET
    Write-Host ""
    Write-Host "Tunnel: $ltUrl" -ForegroundColor Yellow
    Write-Host "WARNING: This URL changes every restart. Re-run this script when it does." -ForegroundColor Red
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Wait-Process -Id $ltProc.Id
} catch {
    Stop-Process -Id $ltProc.Id -Force -ErrorAction SilentlyContinue
    throw
}
