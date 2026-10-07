# 131 · 129 게스트 홈 허수 걷어내기 — 조건부 수락

- 작성: 2026-09-25 05:15 KST
- 선행: [129](129-guest-home-122-cursor-ticket.md) · [122](122-guest-home-remove-fake-numbers-backlog.md) · [125](125-guest-home-122-investigation.md)
- 상태: **조건부 수락** · 배포 허가됨 → [132](132-guest-home-129-deploy-ticket.md) (2026-09-25 「배포」).
- 커밋: `fb3bbf531917d1d49c2d671971be500f5f964602`
- 부모: `8eaf74d` · 브랜치 `feat/student-mypage-a-g` · origin/main 대비 ahead 1
- 메시지: `fix(guest): replace dummy guest counts and seed cards with live slots`

---

## 판정

**로컬 구현은 129 잠금과 맞습니다.** allowlist·잔여 dirty 제외·로그인 홈 미변경·허수 47/62/128 제거를 코드로 확인했습니다.

다만 이 환경에서 **지도 숫자 API 실호출**과 **프라임 첫 페인트 픽셀**은 스모크하지 못했습니다. 그래서 **조건부 수락**입니다. 배포 전(또는 PHP 있는 로컬에서) 아래 「남은 확인」만 보면 됩니다. **보완 지시문(재코딩)은 없음.**

---

## 확인한 것 (코드·보고 대조)

| 항목 | 결과 |
|------|------|
| SHA · 부모 · 브랜치 · push 안 함 | 일치 |
| 커밋 파일 10개 = 보고 allowlist | 일치. `search-find-surface.js` 미수정 — `search-tier-render` 게스트 랜딩으로 충분 |
| 잔여 dirty 미포함 | `study-room-reg/screens.js` · repo `docs/046`·`047`·`README` 커밋 밖 |
| 지도 하드코딩 47/62/128 | `GUEST_REGION_STATS` 제거. 실패 시 「—」유지 |
| API | `POST /api/search/region-stats.php` body `{}`. 축 서버 고정. `SearchService::guestAxisCounts()` → `search()` total 재사용. 새 테이블 없음 |
| 축 | 공부방 `대치동` · 과외/학생 `서울시`. `regionLabelToken`이 「서울 강남구 대치동」도 대치동으로 맞춤 → COUNT 동등 |
| 현재위치 라벨 | 데모 축 유지 · GPS 미도입 |
| 프라임 CSS | `.expo-media--prime` → `aspect-ratio: 160 / 117` (cqw 제거) |
| 게스트 오버라이드 | `withGuestPlanOverride`: `demo_prime_filled=0`, basic/pick page **10**. 로그인 기본값 구간 밖 |
| 실0 vacant | 프라임 샘플1+빈2 · 픽 샘플1+빈4(1행 5칸) · 베이직/학생 샘플1+빈1 「등록하면 여기에 나와요」 |
| 학생 샘플 | raw `김민수` → 마스크 **김○○** · 「로그인하고 보기」 · 「샘플」스탬프 |
| 실≥1 | 순서 채움 · 빈칸으로 페이지 패딩 없음 (픽·베이직) |
| 찾기 랜딩 | 게스트·region 모드 Basic-only `data-guest-landing` |
| 렌더 검사 11항 | Cursor 보고 통과 |

---

## 남은 확인 (배포 전 · 보완코딩 아님)

1. **PHP 있는 환경**에서 `POST /api/search/region-stats.php` → 200·실수(또는 0). 박스가 47/62/128로 돌아가지 않는지.
2. 게스트 홈 **하드 새로고침** 첫 화면에서 프라임 카드 높이가 한 번에 정상인지(샷 a 수준).
3. (선택) 로그인 공부방·과외쌤 홈 vacant가 예전과 같은지 한 번만 눈으로.

---

## API 요약 (정본)

```
POST /api/search/region-stats.php
req: {}
res 200: { ok, studyRooms, tutors, studentRequests, axes: { room, tutor, student } }
res 405 / 500: ok:false — UI는 「—」, 더미 숫자 금지
```

가설(§9)상 GET 선호였으나 **POST·flat 응답 허용**. 축 문자열은 티켓 예시의 긴 라벨 대신 짧은 「대치동」— 필터 토큰과 동일해 **수락**.

---

## 다음

- 배포 지시: [132](132-guest-home-129-deploy-ticket.md). Cursor 결과 대기.
- 마스터 팝업 스모크(`jetty@naver.com`, `#/admin/settings/popups`)는 128 잔여와 별도.
- 127 숨김 잔재 · 130 카피 전수는 후순위 유지.
