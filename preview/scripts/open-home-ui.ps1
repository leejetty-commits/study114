# 우동공 home-ui 프리뷰 열기 (Windows)
$ErrorActionPreference = 'Stop'
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$ui = Join-Path $root 'preview\home-ui'

Write-Host '우동공과 home-ui 프리뷰' -ForegroundColor Cyan
$url = 'http://127.0.0.1:5174/#/guest'
Write-Host "URL: $url" -ForegroundColor Yellow
Write-Host '주의: index.html 파일을 더블클릭하면 안 됩니다. 반드시 dev 서버 URL로 여세요.' -ForegroundColor DarkGray

$resp = $null
try {
  $resp = Invoke-WebRequest -Uri 'http://127.0.0.1:5174/' -UseBasicParsing -TimeoutSec 2
} catch {
  $resp = $null
}

if (-not $resp) {
  Write-Host '서버가 꺼져 있어 npm run dev 를 시작합니다...' -ForegroundColor Gray
  Start-Process powershell -ArgumentList @(
    '-NoExit', '-Command',
    "Set-Location '$ui'; npm run dev"
  )
  Start-Sleep -Seconds 3
}

Start-Process $url
Write-Host '브라우저를 열었습니다. 안 보이면 주소창에 URL을 직접 입력하세요.' -ForegroundColor Green
