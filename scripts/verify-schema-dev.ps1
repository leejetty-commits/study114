# study114_dev 테이블·컬럼 검증
param(
  [string]$Database = "study114_dev",
  [string]$Password = "study114dev",
  [string]$Container = "study114-mysql-dev"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$tables = @(
  "users", "user_profiles", "user_roles", "students", "student_subject_targets",
  "subject_masters", "regions", "complexes",
  "study_rooms", "study_room_regions", "study_room_subject_targets",
  "study_room_images", "facility_masters", "study_room_facilities",
  "tutors", "tutor_regions", "tutor_subject_targets",
  "tutor_lesson_places", "tutor_teaching_style_badges", "tutor_images"
)

function Invoke-MysqlScript {
  param(
    [string]$InputSql,
    [string]$RemoteName = "verify.sql"
  )
  $temp = Join-Path $env:TEMP "study114-$RemoteName"
  [System.IO.File]::WriteAllText($temp, $InputSql, [System.Text.UTF8Encoding]::new($false))
  docker cp $temp "${Container}:/tmp/$RemoteName" | Out-Null

  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  docker exec $Container sh -c "mysql -uroot -p$Password --table < /tmp/$RemoteName" | Out-Host
  $code = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($code -ne 0) { throw "MySQL verify failed (exit $code)" }
}

$sql = @"
USE $Database;
SHOW TABLES;
"@

foreach ($t in $tables) {
  $sql += "`nSELECT '$t' AS tbl; SHOW COLUMNS FROM ``$t``;"
}

$sql += @"

SELECT facility_code, facility_name FROM facility_masters ORDER BY sort_order;
"@

Invoke-MysqlScript -InputSql $sql -RemoteName "verify-tables.sql"

Write-Host "`n--- schema_check.sql ---"
$schemaCheck = Get-Content (Join-Path $root "sql\verify\schema_check.sql") -Raw
$schemaCheck = $schemaCheck -replace '\bstudy114\b', $Database
Invoke-MysqlScript -InputSql $schemaCheck -RemoteName "verify-schema-check.sql"
