# study114 — SSOT DDL → study114_dev (Docker MySQL 8.4)
# Usage:
#   docker compose -f docker/docker-compose.dev.yml up -d
#   .\scripts\apply-schema-dev.ps1
#   .\scripts\verify-schema-dev.ps1

param(
  [string]$Database = "study114_dev",
  [string]$Password = "study114dev",
  [string]$Container = "study114-mysql-dev"
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$sqlDir = Join-Path $root "sql\schema"

if (-not (docker ps --filter "name=$Container" --format "{{.Names}}")) {
  throw "컨테이너 $Container 가 실행 중이 아닙니다. docker compose -f docker/docker-compose.dev.yml up -d"
}

function Apply-SqlFile {
  param([string]$FileName, [switch]$NoDatabaseArg)
  $path = Join-Path $sqlDir $FileName
  $content = Get-Content -Path $path -Raw -Encoding UTF8
  $content = $content -replace '\bstudy114\b', $Database
  $temp = Join-Path $env:TEMP "study114-$FileName"
  [System.IO.File]::WriteAllText($temp, $content, [System.Text.UTF8Encoding]::new($false))
  docker cp $temp "${Container}:/tmp/$FileName" | Out-Null
  if ($NoDatabaseArg) {
    cmd /c "docker exec $Container sh -c `"mysql -uroot -p$Password --default-character-set=utf8mb4 < /tmp/$FileName`""
  } else {
    cmd /c "docker exec $Container sh -c `"mysql -uroot -p$Password --default-character-set=utf8mb4 $Database < /tmp/$FileName`""
  }
  if ($LASTEXITCODE -ne 0) { throw "Failed: $FileName" }
}

Write-Host "Waiting for MySQL..."
for ($i = 0; $i -lt 60; $i++) {
  cmd /c "docker exec $Container mysql -uroot -p$Password -e `"SELECT 1`"" 2>nul
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 2
  if ($i -eq 59) { throw "MySQL not ready" }
}

foreach ($f in @(
  "001_init.sql",
  "002_profile_signup_fields.sql",
  "004_member_ssot_align.sql",
  "005_study_room_ssot_align.sql",
  "006_facility_masters_seed.sql",
  "007_schema_ssot_fix.sql"
)) {
  Write-Host "Applying $f ..."
  Apply-SqlFile -FileName $f -NoDatabaseArg:($f -eq "001_init.sql")
}

Write-Host "Done. Run: .\scripts\verify-schema-dev.ps1"
