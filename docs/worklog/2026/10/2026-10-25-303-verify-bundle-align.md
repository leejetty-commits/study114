# 303 Verify bundle 검사를 현행 main에 맞춤

**과제 ID:** 303  
**브랜치:** `cursor/303-verify-bundle-align-20261025-85f6`  
**기준:** `origin/main` `5f045d04` (301-1-1c)  
**작업일:** 2026-10-25  
**승인:** 이 세션은 자기 커밋을 승인하지 않는다.

## 지시서 원문

Verify bundle CI가 깨져 있음. 제품(앱) 코드 버그가 아니라 검사 스크립트가 최근 의도적 변경(298 intro_long, 301-1-1 guest published, 277-7a2 s114Confirm, 301-1-1b 동네인사/공개샵 세션)을 따라오지 못한 것. 제품/앱 런타임 코드는 고치지 말고, Verify 검사 스크립트(및 검사가 참조하는 문서가 있다면 그 분류 한 줄)만 현행 main에 맞출 것.

권장 순서 3 → 2 → 1. 한 PR에 묶어도 됨.

## 한 일 (검사만)

제품 PHP/JS 비즈니스 로직·Deploy 워크플로는 건드리지 않았다.

### 3) student-hope-hidden-required

- `scripts/verify-student-hope-hidden-required.mjs`
- 277-7a2 이후 `signup-basic.js`가 `s114Confirm`을 import 하는데 DEPS에 없어 1 FAIL.
- `s114Confirm: async () => true` mock 한 줄 추가. 이 검사는 확인창 경로를 타지 않는다.

### 2) cur-006-email-verify-inventory

- `scripts/verify-cur-006-email-verify-inventory.mjs`
- `public/api/neighborhood-greeting-card.php`, `public/api/study-room/public.php`가 AuthSession으로 회원/손님만 가리는 공개 읽기 API인데 intentionalNoGate에 없어 REVIEW 2건.
- `search/search.php`와 같이 경로 추가. 앱 PHP는 그대로.
- `docs/internal/cur-006-email-verify-open-apis.md`에 같은 분류 한 줄(검사가 필수로 요구하지는 않음).

### 1) tutor-search-fields

- `scripts/verify-tutor-search-fields.php`: 298 이후 `intro_long`은 검색 응답·카드 공개 칸. 가짜 행·기대값·비공개 키/값/SQL 금지에서 공개로 옮김. 손님에게 숨기는 제품 변경은 하지 않음.
- `scripts/verify-tutor-search-fields.mjs`:
  - `BASE_REF` `3f03aaa` → `5f045d04` (301-1-1c). search.php 인자 증가·guest published와 맞춤.
  - `ROOM_BODY_REF` `f41408da…` → `5f045d04…`. searchRooms 본문(guest published · 좌표 플래그).
  - WHERE 비교 시 `completeSql` 게이트 줄을 기준 커밋에서도 빼서, 게이트가 이미 들어 있는 기준과 글자 비교가 맞음.
  - `CARD_KEYS`에 `intro_long` 추가. 프라임·확대카드 소개 기대를 `intro_short` → `intro_long`.
  - `TUTOR_DETAIL_REF`(`ada09d4a`, 298)는 그대로.

## 확인

로컬(PHP 8.3 · Node):

| 검사 | 결과 |
| --- | --- |
| `node scripts/verify-student-hope-hidden-required.mjs` | 18 passed, 0 failed |
| `node scripts/verify-cur-006-email-verify-inventory.mjs` | CUR-006 inventory OK passed=17 (gated=52 open_intentional=10 missing=0 review=0) |
| `node scripts/verify-tutor-search-fields.mjs` | 67 PASS / 0 FAIL (php 36 · static 12 · mapper 19) |

## 배포 전 사용자 할 일

없음 (SQL·환경변수·Secrets·`.htaccess` 변경 없음).

## 승인

| 커밋 | 승인자 | 일시 |
| --- | --- | --- |
| (이번 커밋) | 승인 대기 | |
