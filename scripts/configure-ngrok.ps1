# configure-ngrok.ps1 — One-time ngrok authtoken setup
# Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken
# Usage: powershell -ExecutionPolicy Bypass -File scripts\configure-ngrok.ps1

$NGROK_EXE = "C:\Users\1sams\OneDrive\Documents\ngrok-v3-stable-windows-amd64 (1)\ngrok.exe"

if (-not (Test-Path $NGROK_EXE)) {
    Write-Host "ngrok not found at expected path. Download from https://ngrok.com/download" -ForegroundColor Red
    exit 1
}

$token = Read-Host "Paste your ngrok authtoken (from https://dashboard.ngrok.com/get-started/your-authtoken)"
if (-not $token) {
    Write-Host "No token provided. Exiting." -ForegroundColor Red
    exit 1
}

& $NGROK_EXE config add-authtoken $token
Write-Host ""
Write-Host "ngrok configured! Now run:" -ForegroundColor Green
Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\start-tunnel.ps1" -ForegroundColor Cyan
