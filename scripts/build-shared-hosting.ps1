#Requires -Version 5.1
<#
.SYNOPSIS
  shared hosting용 Vite 빌드 + public/ 배치 (닷홈·카페24 공통)

.PARAMETER EnvFile
  프론트 URL이 들어 있는 env 예시 파일 (기본: preview/.env.dothome.example)

.PARAMETER Label
  콘솔 출력용 라벨

.EXAMPLE
  .\scripts\build-shared-hosting.ps1
  .\scripts\build-shared-hosting.ps1 -EnvFile preview\.env.staging.example -Label cafe24
#>
param(
  [string]$EnvFile = (Join-Path (Split-Path -Parent $PSScriptRoot) 'preview\.env.dothome.example'),
  [string]$Label = 'dothome',
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Preview = Join-Path $Root 'preview'
$Public = Join-Path $Root 'public'

if (-not (Test-Path $EnvFile)) {
  throw "Missing env file: $EnvFile"
}

$Packages = @(
  @{ Name = 'home-ui';       Base = '/';                 Target = $Public },
  @{ Name = 'auth-ui';       Base = '/auth/';             Target = (Join-Path $Public 'auth') },
  @{ Name = 'search-ui';     Base = '/search/';           Target = (Join-Path $Public 'search') },
  @{ Name = 'study-room-ui'; Base = '/register/room/';    Target = (Join-Path $Public 'register\room') },
  @{ Name = 'tutor-ui';      Base = '/register/tutor/';   Target = (Join-Path $Public 'register\tutor') }
)

function Copy-BuildDist {
  param(
    [string]$DistDir,
    [string]$TargetDir,
    [switch]$IsHomeRoot
  )

  if (-not (Test-Path $DistDir)) {
    throw "Build output not found: $DistDir"
  }

  New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

  if ($IsHomeRoot) {
    $index = Join-Path $DistDir 'index.html'
    if (Test-Path $index) {
      Copy-Item $index (Join-Path $TargetDir 'index.html') -Force
    }
    $distAssets = Join-Path $DistDir 'assets'
    if (Test-Path $distAssets) {
      $publicAssets = Join-Path $TargetDir 'assets'
      New-Item -ItemType Directory -Force -Path $publicAssets | Out-Null
      Copy-Item (Join-Path $distAssets '*') $publicAssets -Recurse -Force
    }
    Get-ChildItem $DistDir -File | Where-Object { $_.Name -ne 'index.html' } | ForEach-Object {
      Copy-Item $_.FullName $TargetDir -Force
    }
    return
  }

  if (Test-Path $TargetDir) {
    Get-ChildItem $TargetDir -Force | Remove-Item -Recurse -Force
  }
  New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
  Copy-Item (Join-Path $DistDir '*') $TargetDir -Recurse -Force
}

Write-Host "== study114 shared hosting build ($Label) ==" -ForegroundColor Cyan
Write-Host "Env: $EnvFile" -ForegroundColor DarkGray

foreach ($pkg in $Packages) {
  $pkgDir = Join-Path $Preview $pkg.Name
  $distDir = Join-Path $pkgDir 'dist'

  if (-not $SkipInstall) {
    Write-Host "[$($pkg.Name)] npm install" -ForegroundColor Yellow
    Push-Location $pkgDir
    npm install --no-fund --no-audit | Out-Host
    Pop-Location
  }

  Copy-Item $EnvFile (Join-Path $pkgDir '.env.production.local') -Force

  $env:VITE_BASE_PATH = $pkg.Base
  Write-Host "[$($pkg.Name)] vite build (base=$($pkg.Base))" -ForegroundColor Yellow
  Push-Location $pkgDir
  npm run build | Out-Host
  if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "vite build failed: $($pkg.Name)"
  }
  Pop-Location
  Remove-Item Env:VITE_BASE_PATH -ErrorAction SilentlyContinue

  $isHome = $pkg.Name -eq 'home-ui'
  Copy-BuildDist -DistDir $distDir -TargetDir $pkg.Target -IsHomeRoot:$isHome
  Write-Host "[$($pkg.Name)] -> $($pkg.Target)" -ForegroundColor Green
}

Write-Host ''
Write-Host 'Done. See docs/internal/01-dothome-deploy.md for FTP upload paths.' -ForegroundColor Cyan
