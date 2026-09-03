#!/usr/bin/env bash
# PR-A CI — PHP 8.2 문법 · 카탈로그 · 임시 MySQL 061 · catalog/checkout 통합
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v php >/dev/null 2>&1; then
  echo "::error::php CLI not found"
  exit 2
fi

php -v

CHANGED_PHP=(
  src/Paid/PaidCatalog.php
  src/Paid/PositionPeriodCalculator.php
  src/Paid/ProviderCheckoutRepository.php
  src/Paid/ProviderCheckoutService.php
  src/Paid/ProviderUsageService.php
  src/Paid/TutorPositionMemoBundle.php
  public/api/paid/catalog.php
  public/api/paid/checkout.php
  scripts/verify-paid-catalog.php
  scripts/verify-paid-pricing.php
  scripts/verify-paid-pr-a-integration.php
)

echo
echo "=== 1) php -l (PR-A changed PHP) ==="
for f in "${CHANGED_PHP[@]}"; do
  php -l "$f"
done

echo
echo "=== 1b) php-syntax-check.sh (src/public/api/scripts) ==="
bash scripts/php-syntax-check.sh

echo
echo "=== 2) php scripts/verify-paid-catalog.php ==="
php scripts/verify-paid-catalog.php

echo
echo "=== 3) php scripts/verify-paid-pricing.php ==="
php scripts/verify-paid-pricing.php

if [[ ! -f config/database.php ]]; then
  cp config/database.php.example config/database.php
  echo "copied config/database.php.example → config/database.php (gitignored)"
fi

if ! command -v mysql >/dev/null 2>&1; then
  echo "::error::mysql client not found — schema 061 / checkout DB 통합 미실행"
  exit 2
fi

export MYSQL_PWD="${STUDY114_DB_PASS:-test}"
MYSQL=(mysql -h"${STUDY114_DB_HOST:-127.0.0.1}" -P"${STUDY114_DB_PORT:-3306}" -u"${STUDY114_DB_USER:-study114}" --protocol=TCP)

echo
echo "=== 4) temp MySQL harness + schema 061 syntax ==="
"${MYSQL[@]}" < scripts/fixtures/paid-pr-a-temp-db.sql
echo "harness applied (061 not yet)"

echo
echo "=== 5a) checkout create on 061-absent DB ==="
php scripts/verify-paid-pr-a-integration.php --phase=pre061

echo
echo "=== 4b) apply sql/schema/061_payment_catalog_snapshot.sql ==="
"${MYSQL[@]}" < sql/schema/061_payment_catalog_snapshot.sql
col="$("${MYSQL[@]}" -N -e "SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='study114' AND TABLE_NAME='provider_payment_orders' AND COLUMN_NAME='catalog_version'")"
if [[ "$col" != "1" ]]; then
  echo "::error::061 did not add catalog_version (count=${col})"
  exit 1
fi
echo "061 applied — catalog_version present"

echo
echo "=== 5b) checkout create on 061-present DB ==="
php scripts/verify-paid-pr-a-integration.php --phase=post061

echo
echo "=== 5c/6) catalog + auth-gated status/history/messages HTTP ==="
php -S 127.0.0.1:18080 -t public >/tmp/paid-pr-a-php-server.log 2>&1 &
pid=$!
trap 'kill "$pid" 2>/dev/null || true' EXIT
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS "http://127.0.0.1:18080/api/paid/catalog.php" >/dev/null; then
    break
  fi
  sleep 0.3
done
export CATALOG_BASE_URL="http://127.0.0.1:18080"
php scripts/verify-paid-pr-a-integration.php --phase=http

echo
echo "=== node source contracts ==="
node scripts/verify-paid-pr-a.mjs
node scripts/verify-paid-catalog.mjs
node scripts/verify-paid-pricing.mjs

echo
echo "PR-A CI local steps ok"
echo "SKIP e2e p18-b/c/d — STUDY114_PREVIEW_URL 로그인 스택(운영/미리보기) 없음. HTTP 401 게이트만 확인."
