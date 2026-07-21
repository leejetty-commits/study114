#!/usr/bin/env bash
# 저장소에 OAuth/운영 비밀값이 다시 커밋되지 않았는지 검사한다.
# 배포(CI)와 로컬 사전 점검용. 실패 시 exit 1.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0
warn() { echo "::error::$*" 2>/dev/null || echo "ERROR: $*"; fail=1; }

# 1) public/.htaccess — OAuth/메일키는 반드시 __PLACEHOLDER__ 형태
htaccess="public/.htaccess"
if [[ ! -f "$htaccess" ]]; then
  warn "$htaccess 없음"
else
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ SetEnv[[:space:]]+(OAUTH_[A-Z0-9_]+|STUDY114_MAIL_PROBE_KEY)[[:space:]]+(.*) ]]; then
      key="${BASH_REMATCH[1]}"
      val="${BASH_REMATCH[2]}"
      val="${val%"${val##*[![:space:]]}"}"  # trim trailing space
      expected="__${key}__"
      if [[ "$val" != "$expected" ]]; then
        warn "$htaccess: $key 값이 placeholder($expected)가 아닙니다. 실값을 커밋하지 마세요. → GitHub Secrets + deploy.yml 주입"
      fi
    fi
  done < "$htaccess"
fi

# 2) Google client_secret 접두사 — 어느 추적 파일이든 금지
if git grep -n 'GOCSPX-' -- ':' ':(exclude)docs/internal/31-oauth-secret-incident.md' >/dev/null 2>&1; then
  git grep -n 'GOCSPX-' -- ':' ':(exclude)docs/internal/31-oauth-secret-incident.md' || true
  warn "추적 파일에 Google client_secret 패턴(GOCSPX-)이 있습니다."
fi

# 3) Google client_id 형태는 .htaccess / 비예시 config에만 금지 (문서·example은 키 이름만)
for f in public/.htaccess config/oauth.php config/auth.php config/app.php; do
  if [[ -f "$f" ]] && grep -Eq 'apps\.googleusercontent\.com' "$f" 2>/dev/null; then
    warn "$f 에 Google client_id 형태가 있습니다. placeholder 또는 env만 사용하세요."
  fi
done

# 4) config/database.php 는 절대 추적되면 안 됨
if git ls-files --error-unmatch config/database.php >/dev/null 2>&1; then
  warn "config/database.php 가 Git에 추적되고 있습니다. .gitignore 대상이어야 합니다."
fi

if [[ "$fail" != "0" ]]; then
  echo "비밀값 커밋 검사 실패 — docs/internal/31-oauth-secret-incident.md 참고"
  exit 1
fi
echo "OK: 커밋된 OAuth/운영 비밀값 검사 통과"
