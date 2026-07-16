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

function Invoke-MysqlInContainer {
  param(
    [string]$SqlFile = "",
    [switch]$NoDatabaseInCli
  )

  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  if ($NoDatabaseInCli) {
    $shCmd = "mysql -uroot -p$Password --default-character-set=utf8mb4 < /tmp/$SqlFile"
  } else {
    $shCmd = "mysql -uroot -p$Password --default-character-set=utf8mb4 $Database < /tmp/$SqlFile"
  }
  docker exec $Container sh -c $shCmd | Out-Null

  $code = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  return $code
}

function Apply-SqlFile {
  param([string]$FileName, [switch]$NoDatabaseArg)
  $path = Join-Path $sqlDir $FileName
  $content = Get-Content -Path $path -Raw -Encoding UTF8
  $content = $content -replace '\bstudy114\b', $Database
  $temp = Join-Path $env:TEMP "study114-$FileName"
  [System.IO.File]::WriteAllText($temp, $content, [System.Text.UTF8Encoding]::new($false))
  docker cp $temp "${Container}:/tmp/$FileName" | Out-Null
  if ((Invoke-MysqlInContainer -SqlFile $FileName -NoDatabaseInCli:$NoDatabaseArg) -ne 0) { throw "Failed: $FileName" }
}

Write-Host "Waiting for MySQL..."
for ($i = 0; $i -lt 60; $i++) {
  # PowerShell은 2>nul을 cmd 인자가 아니라 장치 리다이렉트로 해석하므로 healthcheck 사용
  $health = (docker inspect --format "{{.State.Health.Status}}" $Container | Out-String).Trim()
  if ($health -eq "healthy") { break }
  Start-Sleep -Seconds 2
  if ($i -eq 59) { throw "MySQL not ready (status: $health)" }
}

Write-Host "Dropping database $Database (fresh apply)..."
$resetPath = Join-Path $env:TEMP "study114-reset.sql"
$resetSql = @"
DROP DATABASE IF EXISTS $Database;
CREATE DATABASE $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"@
[System.IO.File]::WriteAllText($resetPath, $resetSql, [System.Text.UTF8Encoding]::new($false))
docker cp $resetPath "${Container}:/tmp/reset.sql" | Out-Null
if ((Invoke-MysqlInContainer -SqlFile "reset.sql" -NoDatabaseInCli) -ne 0) {
  throw "Failed to reset database"
}

foreach ($f in @(
  "001_init.sql",
  "002_profile_signup_fields.sql",
  "003_subject_masters.sql",
  "004_member_ssot_align.sql",
  "005_study_room_ssot_align.sql",
  "006_facility_masters_seed.sql",
  "007_schema_ssot_fix.sql",
  "008_tutors.sql",
  "009_study_room_extended.sql",
  "010_tutor_extended.sql",
  "011_student_gender_group.sql",
  "012_search_dev_seed.sql",
  "013_handoff_basket.sql",
  "014_messages.sql",
  "015_messages_p16_finish.sql",
  "016_registration_hub.sql",
  "017_support_center.sql",
  "018_user_oauth_accounts.sql",
  "019_oauth_role_pending.sql",
  "020_auth_policy_tokens.sql",
  "021_board_engine.sql",
  "022_admin_ops.sql",
  "023_promo_social_links.sql",
  "024_admin_reports.sql",
  "025_board_post_attachments.sql",
  "026_admin_dev_seed.sql",
  "027_provider_roi.sql",
  "028_provider_tickets.sql",
  "029_dev_email_verified.sql",
  "030_provider_request_unlocks.sql",
  "031_provider_payment_orders.sql",
  "032_provider_reminders.sql",
  "032_admin_accounts_seed.sql",
  "033_study_room_map_coords.sql",
  "034_board_operational_channels.sql",
  "035_content_config_definitions.sql"
)) {
  Write-Host "Applying $f ..."
  Apply-SqlFile -FileName $f -NoDatabaseArg:($f -eq "001_init.sql")
}

Write-Host "Done. Run: .\scripts\verify-schema-dev.ps1"
