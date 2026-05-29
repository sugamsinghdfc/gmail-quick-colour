# build-release.ps1
# Zips the extension into dist/gmail-quick-colour.zip ready for a GitHub Release.
# Usage:  powershell -ExecutionPolicy Bypass -File .\build-release.ps1

$ErrorActionPreference = 'Stop'

$root    = $PSScriptRoot
$srcDir  = Join-Path $root 'gmail-quick-colour'
$distDir = Join-Path $root 'dist'
$zipPath = Join-Path $distDir 'gmail-quick-colour.zip'

if (-not (Test-Path $srcDir)) {
    throw "Source folder not found: $srcDir"
}

# Read version from manifest so the message is accurate
$manifest = Get-Content (Join-Path $srcDir 'manifest.json') -Raw | ConvertFrom-Json
$version  = $manifest.version

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Zip the CONTENTS of the extension folder (so unzipping gives a clean folder)
Compress-Archive -Path (Join-Path $srcDir '*') -DestinationPath $zipPath -Force

Write-Host "Built v$version ->  $zipPath" -ForegroundColor Green
Write-Host "Next:  gh release create v$version `"$zipPath`" --title `"v$version`" --notes `"...`"" -ForegroundColor Cyan
