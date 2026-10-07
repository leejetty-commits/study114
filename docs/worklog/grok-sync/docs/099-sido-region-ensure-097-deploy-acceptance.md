# 099 · 097 배포 수락 — cities 군=시 동급

- 작성일: 2026-09-25 (KST)
- 대상: [097](097-sido-region-ensure-096-deploy-ticket.md) (=로컬 [096](096-sido-region-ensure-si-gun-seed-ticket.md))
- 판정: **운영 수락**
- SHA: `353d616e2aebedc28a0b209b1c6149d90ae6e663` (짧은 `353d616`)
- base: `4660fd8` → `353d616` on `origin/main`
- Actions: Deploy to dothome **#332** 성공 (ftp-deploy 포함). 로컬 `build:dothome` 미실행(허용)

---

## 1. Allowlist

- 커밋 파일: `src/Region/SidoRegionEnsure.php` **만**
- 커밋 후 index 비움 · C(provider-status · study-room-reg · location-display · ProviderUsage · teaser 등)는 **unstaged 유지** → 097 게이트 충족

---

## 2. 운영 스모크 (보고 신뢰)

`GET /api/auth/regions.php?action=cities` · HTTP 200 · CF 5xx 없음

| 항목 | 결과 |
|------|------|
| 가평군 | label 가평군 · **id 125** · kind city |
| 활동지역 매핑 | 경기도 가평군 → **125** |
| 의정부시 | id **29** 유지 |
| 서울특별시 | id **19** 유지 |
| 군 수 | **76** · 강화·옹진 **없음** |
| 공부방 주소검색 | 이번 커밋 비포함 · 회귀 의심 근거 없음 |

---

## 3. 비차단 잔여

응답 본문 **앞**에 PHP notice(`InvalidArgumentException` use 관련)가 붙음.  
가입 화면은 앞부분을 걷어내고 JSON을 읽어 **가평군 125 매핑은 성공**.  
→ **이번 수락을 막지 않음.** 별도 청소 티켓 후보(regions.php / use 문 notice).

---

## 4. 결론

과외 cities에 군이 시와 동급으로 들어갔고, 운영에서 가평군 id·매핑이 확인됐다. **097 닫음.**  
과외쌤 로그인 홈 UI([098](098-tutor-home-login-ui-fix-ticket.md))와 **축 분리 유지**.
