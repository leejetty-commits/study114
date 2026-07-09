#Requires -Version 5.1
# 닷홈 shared hosting 빌드 — public/ 배치
# Usage: .\scripts\build-dothome.ps1
param([switch]$SkipInstall)

$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root 'preview\.env.dothome.example'
& (Join-Path $PSScriptRoot 'build-shared-hosting.ps1') -EnvFile $EnvFile -Label 'dothome' -SkipInstall:$SkipInstall
