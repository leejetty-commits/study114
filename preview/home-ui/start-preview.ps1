# 우동공 home-ui — dev 서버 + 기본 브라우저 열기
$ErrorActionPreference = 'Stop'
$ui = $PSScriptRoot
$url = 'http://127.0.0.1:5174/#/guest'

function Test-ServerUp {
  try {
    $r = Invoke-WebRequest -Uri 'http://127.0.0.1:5174/' -UseBasicParsing -TimeoutSec 2
    return $r.StatusCode -eq 200
  } catch {
    return $false
  }
}

Set-Location $ui

if (-not (Test-Path 'node_modules')) {
  Write-Host 'npm install...' -ForegroundColor Gray
  npm install
}

if (-not (Test-ServerUp)) {
  Write-Host 'dev 서버 시작 (이 창을 닫지 마세요)...' -ForegroundColor Cyan
  Start-Process powershell -ArgumentList @(
    '-NoExit', '-Command',
    "Set-Location '$ui'; Write-Host 'http://127.0.0.1:5174/#/guest' -ForegroundColor Yellow; npm run dev"
  )
  $deadline = (Get-Date).AddSeconds(15)
  while ((Get-Date) -lt $deadline) {
    if (Test-ServerUp) { break }
    Start-Sleep -Milliseconds 500
  }
}

if (-not (Test-ServerUp)) {
  Write-Host '서버가 뜨지 않았습니다. 위에서 연 PowerShell 창의 오류를 확인하세요.' -ForegroundColor Red
  exit 1
}

Write-Host "브라우저 열기: $url" -ForegroundColor Green
Start-Process $url
