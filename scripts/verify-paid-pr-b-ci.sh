#!/usr/bin/env bash
# PR-B CI — PHP 8.2 + 임시 MySQL. 운영 DB·FTP 없음.
# 공유 DB 경합을 피하기 위해 이 job은 단일 PHP 프로세스 직렬 실행 (--workers 없음).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

php -v

CHANGED_PHP=(
  src/Paid/StudentMemoGate.php
  src/Paid/MemoTicketPolicy.php
  src/Paid/PaidConflictException.php
  src/Paid/ImmediateMemoRepository.php
  src/Paid/ProviderTicketRepository.php
  src/Paid/ProviderTicketService.php
  src/Paid/ProviderCheckoutService.php
  src/Paid/ProviderCheckoutRepository.php
  src/Paid/ProviderStatusService.php
  src/Paid/PaidApi.php
  src/Messages/MessagesService.php
  src/Messages/ProviderEntitlementService.php
  public/api/paid/checkout.php
  scripts/verify-paid-pr-b-integration.php
  scripts/verify-paid-pr-b-legacy-report.php
)

echo
echo "=== 1) php -l (PR-B PHP) ==="
for f in "${CHANGED_PHP[@]}"; do
  php -l "$f"
done

echo
echo "=== 1b) php-syntax-check.sh ==="
bash scripts/php-syntax-check.sh

if [[ ! -f config/database.php ]]; then
  cp config/database.php.example config/database.php
  echo "copied config/database.php.example → config/database.php"
fi

if ! command -v mysql >/dev/null 2>&1; then
  echo "::error::mysql client not found"
  exit 2
fi

export MYSQL_PWD="${STUDY114_DB_PASS:-test}"
MYSQL=(mysql -h"${STUDY114_DB_HOST:-127.0.0.1}" -P"${STUDY114_DB_PORT:-3306}" -u"${STUDY114_DB_USER:-study114}" --protocol=TCP)

echo
echo "=== 2) harness + 062 + extra + 063 + memo-status + 061 ==="
"${MYSQL[@]}" < scripts/fixtures/paid-pr-a-temp-db.sql
"${MYSQL[@]}" < sql/schema/062_provider_ticket_profile.sql
"${MYSQL[@]}" < scripts/fixtures/paid-pr-b-extra.sql
"${MYSQL[@]}" < sql/schema/063_student_memo_fulfillment.sql
"${MYSQL[@]}" < scripts/fixtures/paid-pr-b-memo-status.sql
"${MYSQL[@]}" < sql/schema/061_payment_catalog_snapshot.sql

echo
echo "=== 2b) 062 legacy dry-run counts ==="
php scripts/verify-paid-pr-b-legacy-report.php

echo
echo "=== 3) PR-A regression post061 (provider required) ==="
php scripts/verify-paid-pr-a-integration.php --phase=post061

echo
echo "=== 4) PR-B domain tests (serial, isolated users 40+) ==="
php scripts/verify-paid-pr-b-integration.php

echo
echo "=== 5) catalog unit ==="
php scripts/verify-paid-catalog.php
php scripts/verify-paid-pricing.php

echo
echo "PR-B CI ok — 운영 배포/운영 DB 미적용"
