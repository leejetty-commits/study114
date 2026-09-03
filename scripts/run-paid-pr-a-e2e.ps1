# PR-A 로그인 E2E — 로컬 Docker PHP 8.2 + study114_dev 시드
# 운영 DB·배포·PR-B 없음. schema 061은 이 스크립트 후반에 로컬 컨테이너에만 적용한다.
param(
  [switch]$SkipSchemaReset
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== docker compose up (mysql + api) ==="
Push-Location (Join-Path $root "docker")
try {
  docker compose -f docker-compose.dev.yml up -d --build
} finally {
  Pop-Location
}

if (-not $SkipSchemaReset) {
  Write-Host "=== apply-schema-dev (061 미포함) ==="
  & (Join-Path $root "scripts\apply-schema-dev.ps1")
}

function Wait-Api {
  for ($i = 0; $i -lt 40; $i++) {
    try {
      $r = Invoke-WebRequest -Uri "http://127.0.0.1:8080/api/paid/catalog.php" -UseBasicParsing -TimeoutSec 3
      if ($r.StatusCode -eq 200) { return }
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  throw "API :8080 catalog.php 가 응답하지 않습니다"
}

Write-Host "=== wait API :8080 ==="
Wait-Api

$env:STUDY114_PREVIEW_URL = "http://127.0.0.1:8080"
Write-Host "STUDY114_PREVIEW_URL=$env:STUDY114_PREVIEW_URL"

Write-Host "=== playwright p18-b / p18-d / p18-c / p18-02 / history (061 없음) ==="
npx playwright test --workers=1 --project=chromium `
  e2e/p18-b-tickets.spec.js `
  e2e/p18-d-checkout.spec.js `
  e2e/p18-c-request-view.spec.js `
  e2e/p18-02-roi-api.spec.js `
  e2e/p18-pr-a-history.spec.js
if ($LASTEXITCODE -ne 0) { throw "E2E failed before schema 061" }

Write-Host "=== apply schema 061 on local study114_dev only ==="
$src = Join-Path $root "sql\schema\061_payment_catalog_snapshot.sql"
$content = (Get-Content -Path $src -Raw -Encoding UTF8) -replace '\bstudy114\b', 'study114_dev'
$temp = Join-Path $env:TEMP "study114-061.sql"
[System.IO.File]::WriteAllText($temp, $content, [System.Text.UTF8Encoding]::new($false))
docker cp $temp "study114-mysql-dev:/tmp/061_payment_catalog_snapshot.sql"
docker exec study114-mysql-dev sh -c "mysql -uroot -pstudy114dev --default-character-set=utf8mb4 study114_dev < /tmp/061_payment_catalog_snapshot.sql"
if ($LASTEXITCODE -ne 0) { throw "local 061 apply failed" }

Write-Host "=== restart API (column probe cache) ==="
docker restart study114-api-dev | Out-Null
Wait-Api

Write-Host "=== playwright p18-d + history (061 적용 후 로컬 DB) ==="
npx playwright test --workers=1 --project=chromium e2e/p18-d-checkout.spec.js e2e/p18-pr-a-history.spec.js
if ($LASTEXITCODE -ne 0) { throw "E2E failed after local schema 061" }

Write-Host "PR-A login E2E ok"
