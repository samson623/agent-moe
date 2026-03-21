# telegram-webhook-status.ps1 - Show Telegram webhook status using TELEGRAM_BOT_TOKEN
# Usage: powershell -ExecutionPolicy Bypass -File scripts\telegram-webhook-status.ps1

$ErrorActionPreference = "Stop"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$REPO_ROOT = Resolve-Path (Join-Path $SCRIPT_DIR "..")
$ENV_FILE = Join-Path $REPO_ROOT ".env.local"

function Get-EnvFileValue([string]$name) {
    if (-not (Test-Path $ENV_FILE)) {
        return $null
    }

    foreach ($line in Get-Content $ENV_FILE) {
        if ($line -match "^\s*$name=(.*)$") {
            return $matches[1].Trim()
        }
    }

    return $null
}

function Get-RequiredConfig([string]$name) {
    $value = [System.Environment]::GetEnvironmentVariable($name)
    if (-not $value) {
        $value = Get-EnvFileValue $name
    }

    if (-not $value) {
        throw "Missing required config: $name (set it in the environment or .env.local)"
    }

    return $value
}

$botToken = Get-RequiredConfig "TELEGRAM_BOT_TOKEN"
$info = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/getWebhookInfo" -Method GET

if (-not $info.ok) {
    throw "Telegram getWebhookInfo failed."
}

$result = $info.result
$lastErrorAt = $null
if ($result.last_error_date) {
    $lastErrorAt = [DateTimeOffset]::FromUnixTimeSeconds([int64]$result.last_error_date).ToLocalTime().ToString("yyyy-MM-dd HH:mm:ss zzz")
}

[pscustomobject]@{
    url = $result.url
    pending_update_count = $result.pending_update_count
    allowed_updates = ($result.allowed_updates -join ",")
    last_error_at = $lastErrorAt
    last_error_message = $result.last_error_message
    has_custom_certificate = $result.has_custom_certificate
    max_connections = $result.max_connections
} | Format-List
