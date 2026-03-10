param (
    [Parameter(Mandatory=$true)]
    [string]$TargetName
)

$ErrorActionPreference = "Stop"

# 1. Identify Paths
# $PSScriptRoot is the .agent folder
$SourcePath = $PSScriptRoot
# Parent of .agent is the current project (_Kingsberry)
$CurrentProjectDir = Split-Path -Parent $SourcePath
# Parent of current project is the projects root (Desktop)
$ProjectsRootDir = Split-Path -Parent $CurrentProjectDir

$TargetProjectPath = Join-Path $ProjectsRootDir $TargetName

# 2. Validation
if (-not (Test-Path $TargetProjectPath)) {
    Write-Error "❌ Target project '$TargetName' not found in $ProjectsRootDir"
    exit 1
}

# 3. Execution
$DestPath = Join-Path $TargetProjectPath ".agent"

Write-Host "🚀 Installing Antigravity Agent..."
Write-Host "   Source:      $SourcePath"
Write-Host "   Destination: $DestPath"

try {
    # If destination .agent exists, this merges/overwrites
    Copy-Item -Path $SourcePath -Destination $DestPath -Recurse -Force
    
    Write-Host ""
    Write-Host "✅ INSTALLATION COMPLETE" -ForegroundColor Green
    Write-Host "   Antigravity Agent is now active in '$TargetName'"
    Write-Host "   You can now open that folder and use the agent."
}
catch {
    Write-Error "❌ Installation Failed: $_"
}
