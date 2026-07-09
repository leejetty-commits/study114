#Requires -Version 5.1
# 카페24 스테이징 빌드 — public/ 배치
# Usage: .\scripts\build-staging.ps1
param([switch]$SkipInstall)

$Root = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $Root 'preview\.env.staging.example'
& (Join-Path $PSScriptRoot 'build-shared-hosting.ps1') -EnvFile $EnvFile -Label 'cafe24' -SkipInstall:$SkipInstall
