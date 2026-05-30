# study114_dev 테이블·컬럼 검증
param(
  [string]$Database = "study114_dev"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$tables = @(
  "users", "user_profiles", "user_roles", "students", "student_subject_targets",
  "regions", "complexes",
  "study_rooms", "study_room_regions", "study_room_subject_targets",
  "study_room_images", "facility_masters", "study_room_facilities"
)

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

$sql | docker exec -i study114-mysql-dev mysql -uroot -pstudy114dev --table

Write-Host "`n--- schema_check.sql ---"
Get-Content (Join-Path $root "sql\verify\schema_check.sql") -Raw |
  ForEach-Object { $_ -replace '\bstudy114\b', $Database } |
  docker exec -i study114-mysql-dev mysql -uroot -pstudy114dev --table
