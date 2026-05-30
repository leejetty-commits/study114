# study114 — SSOT DDL 적용 (로컬 MySQL)
# Usage: .\scripts\apply-schema.ps1 [-User root] [-Password ""]

param(
  [string]$User = "root",
  [string]$Password = "",
  [string]$Host = "127.0.0.1",
  [string]$Database = "study114"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$sqlDir = Join-Path $root "sql\schema"

if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
  Write-Error "mysql 클라이언트를 찾을 수 없습니다. PATH에 MySQL을 추가하거나 Docker MySQL을 사용하세요."
}

$files = @(
  "001_init.sql",
  "002_profile_signup_fields.sql",
  "004_member_ssot_align.sql",
  "005_study_room_ssot_align.sql",
  "006_facility_masters_seed.sql"
)

$mysqlArgs = @("-h", $Host, "-u", $User)
if ($Password) { $mysqlArgs += @("-p$Password") }

foreach ($file in $files) {
  $path = Join-Path $sqlDir $file
  if (-not (Test-Path $path)) {
    Write-Error "파일 없음: $path"
  }
  Write-Host "Applying $file ..."
  if ($file -eq "001_init.sql") {
    & mysql @mysqlArgs < $path
  } else {
    & mysql @mysqlArgs $Database < $path
  }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Done. Verify: mysql -u $User -p $Database < sql\verify\schema_check.sql"
