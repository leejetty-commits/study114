#!/usr/bin/env bash
# PHP 문법 검사. php CLI가 없으면 실패(exit 2). 미실행을 성공으로 처리하지 않음.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v php >/dev/null 2>&1; then
  echo "::error::php CLI not found — PHP syntax check 미실행을 성공으로 처리하지 않음"
  exit 2
fi

php -v
echo

fail=0
count=0
while IFS= read -r -d '' f; do
  count=$((count + 1))
  if ! php -l "$f"; then
    fail=1
  fi
done < <(find src public/api scripts -name '*.php' -print0 | sort -z)

if [[ "$count" -eq 0 ]]; then
  echo "::error::검사할 PHP 파일이 없습니다"
  exit 1
fi

echo
echo "php-syntax-check files=${count}"
if [[ "$fail" -ne 0 ]]; then
  echo "::error::PHP syntax check failed"
  exit 1
fi
echo "php-syntax-check ok"
