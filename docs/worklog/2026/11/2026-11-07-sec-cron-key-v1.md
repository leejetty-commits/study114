# sec-cron-key-v1 — paid-reminders cron 뒷문 잠금 (2026-11-07)

**브랜치:** `cursor/sec-cron-key-v1-20261107`  
**상태:** 코드 준비 · **배포 전 사용자 Secret 등록 필수**  
**범위:** 유튜브 홍보 전 보안 필수 1번 (SMS·쪽지 온 후순위와 별개)

## 지시 요지

운영에서 `dev-cron-key` / `?key=` 로 리마인더 cron이 열리던 구멍 잠금.

## 변경 파일

| 파일 | 내용 |
|------|------|
| `public/api/cron/paid-reminders.php` | `STUDY114_CRON_KEY` · 헤더만 · 미설정/약함/`dev-cron-key` → 503 · GET 제거 |
| `config/paid.php` | 기본값 `dev-cron-key` 제거 (빈 폴백) |
| `public/.htaccess` | `SetEnv STUDY114_CRON_KEY __STUDY114_CRON_KEY__` |
| `.github/workflows/deploy.yml` | Secret 주입 · 32자 미만·빈값·`dev-cron-key`면 배포 중단 |
| `e2e/p18-e-reminders.spec.js` | 헤더 인증 · e2e용 긴 키 |

## 배포 전 사용자 할 일

1. GitHub → Settings → Secrets and variables → Actions → Secrets  
2. **New secret** 이름: `STUDY114_CRON_KEY`  
3. 값: **32자 이상** 랜덤 (예: PowerShell `-join ((1..48)|%{'{0:x}' -f (Get-Random -Max 16)})` )  
4. `dev-cron-key` 쓰지 말 것  
5. Secret 저장 **후** 이 브랜치 merge/push · Deploy

Secret 없이 push하면 Inject 단계에서 배포가 **의도적으로 실패**한다.

## 배포 후 확인

```text
# 옛 키 → 실패(403 또는 503)
curl -X POST -H "X-Cron-Key: dev-cron-key" https://study114.net/api/cron/paid-reminders.php

# 쿼리만 → 실패
curl -X POST "https://study114.net/api/cron/paid-reminders.php?key=...."

# 새 키 헤더 → 200 (processed 숫자는 0이어도 ok)
curl -X POST -H "X-Cron-Key: <Secret값>" https://study114.net/api/cron/paid-reminders.php
```

외부 스케줄이 이 URL을 부르면 `X-Cron-Key`만 쓰도록 맞출 것. (현재 저장소 Actions에 paid-reminders schedule 없음)

## 검수

- [ ] Secret 등록됨
- [ ] Actions Inject·Deploy 성공
- [ ] `dev-cron-key` 거부
- [ ] `?key=` 거부
- [ ] 정상 헤더 키 허용
