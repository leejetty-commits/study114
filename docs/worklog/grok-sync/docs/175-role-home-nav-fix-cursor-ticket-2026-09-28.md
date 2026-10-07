# 175 · Cursor — 역할 홈 링크 통일 (이탈버그 최소) (로컬)

- 작성: 2026-09-28 KST · 우동공과2
- 정본: [175](175-role-home-nav-fix-ticket-2026-09-27.md) · 근거 [174](174-in-page-nav-stay-policy-2026-09-27.md) · 174a~d
- 상태: **Cursor 구현 대기** · push · `build:dothome` **금지**(「배포」 전)
- 배치: 로컬 수락 **173 + 175 + 177** 후 「배포」 한 번
- 저장소: `leejetty-commits/study114` · `D:\work\study114`
- Notion: **쓰지 말 것**

---

## 0. 절대

1. 최소 수정만. allowlist 밖 = 오버스코프 → 멈추고 보고.
2. 「홈」「← 메인 홈으로」「검색 배너 홈으로」만. 배너 카피·디자인·라우터 재설계 금지.
3. 마이페이지 breadcrumb · promo CTA study-room 오링크 · 찜/쪽지 인페이지 → **이번 제외**(후속).
4. push / `build:dothome` 금지.

---

## 1. Must

A) `home-marketing-banner.js` — search_room/search_tutor 「홈으로」 `HOME_GUEST` 하드코딩 제거. 렌더 시 역할 홈(기존 `roleHomeHashPath`/`homeHashUrl` 재사용).

B) guide/support 「메인 홈으로」— 실세션 `role_type` 우선. stale guest/타역할 GUIDE_CTX·ACTIVE_ROLE이 로그인 홈을 덮지 말 것. `state.js` + 필요 시 `guide/shell.js`·`support/shell.js`만.

C) 비로그인 community/promo — `getNavRole`이 ACTIVE_ROLE(parent 등) 쓰지 말고 **무조건 guest**. `#/parent` 경유 금지.

D) 비로그인 찾기 `role=parent` 강제는 같은 커밋에 넣되, 파일 3개 이상 추가면 빼고 보고.

용어: 공부방 · 과외쌤 · 학생 · 등록 · 베이직카드.

---

## 2. Allowlist

`home-marketing-banner.js`, `state.js`, `guide/shell.js`, `support/shell.js`, `promo/shell.js`, `concern/shell.js`, `site-nav-config.js`, (D 시) role= 조립 기존 1~2파일.

---

## 3. 수락 스모크

1. 비회원 promo·community 「메인 홈으로」→ `#/guest`만 (`#/parent` 경유 없음)
2. 공부방 support/notice → `#/study-room`
3. 과외쌤 support/notice → `#/tutor`
4. 학생 support·guide → `#/parent` (stale tutor 금지)
5. 각 역할 검색 배너 「홈으로」= GNB 「홈」과 동일
6. 비회원 검색 배너 → `#/guest`
7. allowlist 밖 파일 0

---

## 4. 붙여넣기

```
티켓 175만. D:\work\study114 · git -c safe.directory=D:/work/study114
push·build:dothome·Notion 금지. 최소 수정. allowlist 밖 손대면 멈추고 보고.

Must:
A) home-marketing-banner.js — search_room/search_tutor 「홈으로」 HOME_GUEST 하드코딩 제거. 역할 홈 URL(기존 roleHomeHashPath/homeHashUrl 재사용).
B) guide/support「메인 홈으로」— 실세션 role 우선. stale guest/타역할이 로그인 홈 덮지 말 것. state.js + 필요 시 guide/shell·support/shell만.
C) 비로그인 community/promo getNavRole — 무조건 guest. #/parent 경유 금지.
D) 비로그인 찾기 role=parent 강제는 같은 커밋 OK, 파일 3개+면 빼고 보고.

금지: 마이 breadcrumb, promo CTA study-room 오링크, 찜/쪽지 인페이지, 배너 카피/디자인, 라우터 재설계, 리팩터 전체.

Allowlist: home-marketing-banner.js, state.js, guide/shell.js, support/shell.js, promo/shell.js, concern/shell.js, site-nav-config.js, (D) role= 조립 기존 1~2.

수락: 비회원→#/guest · 공부방→#/study-room · 과외쌤→#/tutor · 학생→#/parent. 검색 배너=GNB 동일. 로컬 커밋. 요점 보고.
정본: docs/175-role-home-nav-fix-ticket-2026-09-27.md · docs/175-role-home-nav-fix-cursor-ticket-2026-09-28.md
```
