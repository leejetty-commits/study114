# 103 · Cursor — 과외쌤 홈 「조회」= 실제 누적 조회 (로컬)

- 작성일: 2026-09-25 (KST)
- 화면: **과외쌤 로그인 홈 · 과외쌤 박스 · 조회**
- 사용자 잠금: 「허수 돌릴 수 없음 · 실제 로직에 붙여야」(2026-09-25)
- 선행: 공부방 홈 [044]/[study-room-home-seed `ensureLifetimeViews` + `fetchRoiSummary`] · 배포됨 과외쌤 홈 [102](102-tutor-home-101-deploy-acceptance.md) (`0456459`)
- 상태: **로컬 부분 수락** → [104](104-tutor-home-views-103-acceptance.md) · 서버는 [105](105-tutor-roi-lifetime-views-no-room-ticket.md) · push 금지
- 기준 HEAD: `0456459` = `origin/main` — Cursor가 `git log -1` 재확인

---

## 0. 한 줄

과외쌤 박스 **조회** 숫자를 미리보기 고정값(`MY_TUTOR.views`)이 아니라, 공부방 홈과 같이 **서버 누적 조회(`lifetime_views`)** 로 보여 준다.  
같은 작업에서 **무관 dirty(2·3·4·5)는 로컬에서 되돌린다**(사이트에서 기능을 빼는 게 아님 · PC 잔여만 취소).

---

## 1. 「로컬 되돌리기」의미 (기획 메모)

PC에만 남아 있는 **아직 커밋·배포 안 한 손댄 내용**을 취소해, 지금 `origin/main`(운영과 같은 커밋)과 파일을 맞춘다.  
이미 올라간 사이트 기능을 지우는 작업이 **아니다.**

---

## 2. 사전 정리 — 되돌릴 경로 (C)

커밋·push **하지 말고**, 아래만 작업 트리에서 원복/삭제.

| # | 경로 | 내용 | 조치 |
|---|------|------|------|
| 2 | `preview/home-ui/src/study-room-reg/screens.js` | 빈 줄만 | `git checkout --` / `git restore` |
| 3 | `preview/shared/location-display.js` | 가능동·논현 좌표 잔여 | restore |
| 4 | `src/Paid/ProviderUsageService.php` | ROI에 studyRoomId 넘기려다 만 한 줄 | restore |
| 5 | `public/assets/teaser-*.js` · `.tmp*` · `_verify/` · 레포 `docs/*` untracked | 산출·임시 | **삭제만**(커밋 금지). teaser는 untracked면 파일 삭제 |

`provider-status.js`의 `getLifetimeViewsFromStatus` dirty:  
- **이번 티켓에서 tutor 조회를 `fetchRoiSummary` 경로로 가면** → `provider-status.js`도 **restore**(헬퍼 미사용 잔여 제거).  
- status 캐시로 붙이려면 그 파일만 남기고 tutor에 **실제로 연결**할 것. **연결 없이 dirty만 남기지 말 것.**

보고: `git status`에 위 C가 사라졌는지.

---

## 3. 조회 — 잠금 정책

1. 과외쌤 로그인 홈 멤버박스 **조회** = 서버 `lifetime_views` (공부방과 동일 개념: 기간 합산이 아닌 **누적 COUNT**; 없으면 빈칸/`—`, **64·128 등 허수 금지**).
2. 구현 SSOT: 공부방 `study-room-home-seed.js`의 `ensureLifetimeViews` + `paid-api.js` `fetchRoiSummary`.  
   - 과외쌤은 **공부방 id 없음** → `fetchRoiSummary(7)` (또는 days만) · `study_room_id` **넣지 않음**.
3. 비로그인·미리보기·API 실패: 허수 금지. `—` / 로딩 후 `—` / 빈칸 중 하나(공부방과 톤 맞춤). `MY_TUTOR.views`를 조회 표시에 **쓰지 말 것**.
4. 쪽지 받음 기본값·프라임/픽·현재위치 등 **102 배포분 회귀 금지**.

---

## 4. 수정 잠금

1. `screens/tutor.js`: 조회 칸을 시드/헬퍼의 실값으로. `MY_TUTOR.views` 제거(표시 경로).
2. 시드: `tutor-home-seed.js` 신설 **또는** tutor.js 인근 최소 헬퍼. 공부방 `ensureLifetimeViews` 패턴 복제(과외는 roomId 없이).
3. 홈 진입·멤버박스 렌더 전 `ensure…` 호출 → 값 오면 리렌더(공부방과 동일 체감).
4. `provider-status` 경유지 선택 시: status 응답에 `lifetime_views`가 실제로 오는지 확인. 안 오면 **roi.php 경로로 통일**.

---

## 5. Allowlist (B)

```
preview/home-ui/src/screens/tutor.js
preview/home-ui/src/tutor-home-seed.js          # 신설 시
preview/home-ui/src/paid-api.js                 # import만이면 unchanged OK
preview/home-ui/src/provider-status.js          # status 경로 쓸 때만 · 아니면 restore
```

필요 최소·보고:

```
preview/home-ui/src/data.js                     # MY_TUTOR.views 표시 폐기 시 주석/정리만
preview/home-ui/src/study-room-home-seed.js     # 패턴 참고만 · 공부방 회귀 없이
```

---

## 6. Forbidden (C · 배포·혼입)

```
git add -A · push · build:dothome
location-display.js · ProviderUsageService.php · study-room-reg/** 를 「기능 추가」로 커밋
teaser-* · .tmp* · _verify · 레포 docs untracked 커밋
SidoRegionEnsure · 가입 · 프라임/픽 vacant 재손대기(이번 목적 아니면)
```

---

## 7. 스모크

1. dirty C(2·3·4·5·미연결 provider-status) **원복/삭제 후** status 깨끗(또는 B만).
2. 과외쌤 로그인 홈 조회: **고정 64/128 아님** · API `lifetime_views`와 숫자 일치(또는 없으면 —).
3. 네트워크: `/api/paid/roi.php` (study_room_id 없음) 또는 선택한 status 경로 증거.
4. 공부방 홈 조회·멤버박스 회귀 없음.
5. 게스트·프라임/픽·현재위치·우리동네 학생 회귀 없음.
6. push 안 함.

---

## 8. 완료 보고

1. 되돌린/삭제한 경로 목록  
2. 조회 연결 경로(roi vs status) · 허수 제거 증거  
3. diff 파일 = B  
4. push 안 함

---

## 9. Cursor 붙여넣기

```
[티켓 103 · 과외쌤 홈 조회=실제 lifetime_views · 로컬만 · push 금지]

사용자: 허수 금지 · 실제 로직. base≈0456459=origin/main.

A) 로컬 되돌리기(사이트 기능 삭제가 아님 · PC 미커밋 잔여 취소):
git restore -- preview/home-ui/src/study-room-reg/screens.js
git restore -- preview/shared/location-display.js
git restore -- src/Paid/ProviderUsageService.php
provider-status.js는 아래 B에서 status 경로 안 쓰면 restore.
untracked teaser-* · .tmp* · _verify 는 삭제만(커밋 금지).

B) 과외쌤 박스 「조회」:
공부방 study-room-home-seed ensureLifetimeViews + fetchRoiSummary 패턴.
과외는 study_room_id 없이 fetchRoiSummary(7).
MY_TUTOR.views(64/128) 표시 금지. 없거나 실패면 —/빈칸.
Allowlist: screens/tutor.js · tutor-home-seed.js(신설시) · paid-api(필요시) · provider-status(연결할 때만).
102 UI 회귀 금지. 보고 후 push 금지.
```
